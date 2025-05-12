import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useBudget } from '../hooks/useBudget';
import { Toast } from './Toast';
import { BudgetChart } from './BudgetChart';
import { BudgetItem } from './BudgetItem';
import { calculateTotals, formatCurrency, getDeltaPercent, getEmoji } from '../utils/budgetUtils';

export function BudgetTracker() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const {
    budget,
    spent,
    inputValues,
    history,
    toast,
    toastType,
    handleInputChange,
    handleAddExpense,
    closeMonth,
    deleteEntry
  } = useBudget();

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [compareMonth1, setCompareMonth1] = useState('');
  const [compareMonth2, setCompareMonth2] = useState('');

  const { totalBudget, totalSpent, totalRemaining, monthlySurplus } = calculateTotals(budget, spent);
  const currentMonth = new Date().toLocaleString('bg-BG', { month: 'long', year: 'numeric' });
  const remainingClass = totalRemaining > 0 ? 'font-semibold' : totalRemaining < 0 ? 'text-red-600' : 'text-gray-600';

  const comparison = () => {
    const month1 = history.find(h => h.month === compareMonth1);
    const month2 = history.find(h => h.month === compareMonth2);
    if (!month1 || !month2) return null;

    return Object.keys(budget).map(key => {
      const value1 = month1.spent[key] || 0;
      const value2 = month2.spent[key] || 0;
      const diff = value2 - value1;
      const percent = value1 === 0 ? 100 : Math.round((diff / value1) * 100);
      const trend = percent === 0 ? '' : percent > 0 ? `📈 +${percent}%` : `📉 ${percent}%`;
      return { category: key, month1: value1, month2: value2, trend };
    });
  };

  const compareData = comparison();
  const uniqueMonths = [...new Set(history.map(entry => entry.month))];

  return (
    <>
      {/* Full-width header */}
      <header className="w-full bg-50 shadow-md border-b-4 border-300 px-4 py-2 flex items-center justify-between">
        <img src="/green-logo.png" alt="Budgetory Logo" className="w-20 h-20 sm:w-32 sm:h-32" />
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base"
        >
          🔓 Изход
        </button>
      </header>
      {/* Boxed app content */}
      <div className="w-full max-w-md mx-auto px-2 py-4 sm:max-w-2xl sm:px-4 font-sans relative">
        <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">📊 Твоят месечен бюджет</h1>
        <h2 className="text-center text-base sm:text-lg text-gray-600 mb-6">Месец: {currentMonth}</h2>
        <div className="flex flex-col items-center text-center text-base sm:text-lg md:text-xl font-medium space-y-2 mt-4">
          <div className="text-gray-700">
            💰 <span className="font-semibold">Общ бюджет:</span> {formatCurrency(totalBudget)}
          </div>
          <div className="text-gray-700">
            💸 <span className="font-semibold">Изхарчено:</span> {formatCurrency(totalSpent)}
          </div>
          <div className={`${remainingClass} font-bold text-lg sm:text-xl`}>📈 Остатък от бюджет: {formatCurrency(totalRemaining)}</div>
          <div className="font-bold text-lg sm:text-xl font-semibold">💵 Остатък от заплата: {formatCurrency(monthlySurplus)}</div>
        </div>
        <div className="w-full flex justify-center my-4">
          <div className="w-full max-w-xs sm:max-w-md">
            <BudgetChart data={spent} />
          </div>
        </div>
        {history.length >= 2 && (
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-2">📊 Сравнение на месеците</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <select value={compareMonth1} onChange={(e) => setCompareMonth1(e.target.value)} className="border rounded px-3 py-1 w-full sm:w-auto">
                <option value="">Избери първи месец</option>
                {uniqueMonths.map(month => <option key={month} value={month}>{month}</option>)}
              </select>
              <select value={compareMonth2} onChange={(e) => setCompareMonth2(e.target.value)} className="border rounded px-3 py-1 w-full sm:w-auto">
                <option value="">Избери втори месец</option>
                {uniqueMonths.map(month => <option key={month} value={month}>{month}</option>)}
              </select>
            </div>
            {compareData && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-center border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-1 border">Категория</th>
                      <th className="px-2 py-1 border">{compareMonth1}</th>
                      <th className="px-2 py-1 border">{compareMonth2}</th>
                      <th className="px-2 py-1 border">Разлика</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareData.map(row => (
                      <tr key={row.category}>
                        <td className="px-2 py-1 border text-left">{row.category}</td>
                        <td className="px-2 py-1 border">{formatCurrency(row.month1)}</td>
                        <td className="px-2 py-1 border">{formatCurrency(row.month2)}</td>
                        <td className="px-2 py-1 border">{row.trend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <div className="hidden md:grid grid-cols-12 font-semibold text-center text-gray-600 border-b pb-2">
          <div className="md:col-span-3">Категория</div>
          <div className="md:col-span-3">Бюджет</div>
          <div className="md:col-span-3">Изхарчено</div>
          <div className="md:col-span-3">Ново разход</div>
        </div>
        <div className="grid gap-4 mt-4">
          {Object.entries(budget).map(([key, value]) => (
            <div key={key} className="w-full">
              <BudgetItem
                category={key}
                budget={value}
                spent={spent[key]}
                inputValue={inputValues[key]}
                onInputChange={handleInputChange}
                onAddExpense={handleAddExpense}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 mb-8 flex justify-center">
          <button
            onClick={closeMonth}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full max-w-xs sm:max-w-md"
          >
            📁 Затвори текущия месец
          </button>
        </div>
        <Toast message={toast} type={toastType} />
        {history.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-center mb-4">🗂 Предходни Месеци</h3>
            <div className="space-y-4">
              {history.map((entry, index) => {
                const prev = history[index - 1];
                return (
                  <div key={index} className="border rounded p-4 shadow-sm bg-gray-50 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div className="font-medium text-gray-700">📅 {entry.month} </div>
                      <div className="flex items-center gap-4 mt-2 sm:mt-0">
                        <button
                          className="text-sm text-blue-600 hover:underline"
                          onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                          {expandedIndex === index ? 'Скрий детайли' : 'Покажи детайли'}
                        </button>
                        <button
                          className="text-sm text-red-600 hover:underline"
                          onClick={() => deleteEntry(index)}
                        >
                          🗑️ Изтрий
                        </button>
                      </div>
                    </div>
                    <div className="text-sm mt-2">💰 Бюджет: {formatCurrency(entry.totalBudget)}</div>
                    <div className={`text-sm ${entry.totalSpent > entry.totalBudget ? 'text-red-600' : 'text-black'}`}>💸 Изхарчено: {formatCurrency(entry.totalSpent)}</div>
                    <div className={`text-sm font-semibold ${entry.totalRemaining > 0 ? 'text-green-600' : entry.totalRemaining < 0 ? 'text-red-600' : 'text-gray-600'}`}>📈 Остатък: {formatCurrency(entry.totalRemaining)}</div>
                    {prev && (
                      <div className="text-sm text-gray-500 mt-1 italic">📊 Промяна от предходния месец: {getDeltaPercent(entry.totalSpent, prev.totalSpent)}%</div>
                    )}
                    {expandedIndex === index && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.keys(entry.budget).map((cat) => {
                          const spentVal = entry.spent[cat];
                          const budgetVal = entry.budget[cat];
                          const emoji = getEmoji(spentVal, budgetVal);
                          const diff = spentVal - budgetVal;
                          const deltaText = diff === 0 ? '' : diff > 0 ? `+${diff} BGN 📉` : `${Math.abs(diff)} BGN 📈`;

                          return (
                            <div key={cat} className="text-sm bg-white p-2 rounded border w-full">
                              <div className="font-semibold">{emoji} {cat}</div>
                              <div>Бюджет: {formatCurrency(budgetVal)}</div>
                              <div>Изхарчено: {formatCurrency(spentVal)}</div>
                              <div className={diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-gray-500'}>{deltaText}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
} 