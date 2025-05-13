import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useBudget } from '../hooks/useBudget';
import { useUserData } from '../hooks/useUserData';
import { Toast } from './Toast';
import { BudgetChart } from './BudgetChart';
import { BudgetItem } from './BudgetItem';
import { Onboarding } from './Onboarding';
import { calculateTotals, formatCurrency } from '../utils/budgetUtils';

export function BudgetTracker() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [compareMonth1, setCompareMonth1] = useState('');
  const [compareMonth2, setCompareMonth2] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const { userData, loading } = useUserData(refreshKey);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user) {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const initialData = useMemo(() => ({
    budgets: userData?.budgets || {},
    transactions: userData?.transactions || [],
    categories: userData?.categories || []
  }), [userData]);

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
  } = useBudget(initialData);

  const handleSettingsComplete = () => {
    setShowSettings(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteCategory = async (category) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      const updatedBudgets = { ...data.budgets };
      const updatedCategories = [...(data.categories || [])];
      const updatedTransactions = [...(data.transactions || [])];

      delete updatedBudgets[category];
      const index = updatedCategories.indexOf(category);
      if (index !== -1) updatedCategories.splice(index, 1);
      const filteredTransactions = updatedTransactions.filter(
        tx => tx.category !== category
      );

      await updateDoc(userRef, {
        budgets: updatedBudgets,
        categories: updatedCategories,
        transactions: filteredTransactions
      });

      setRefreshKey(prev => prev + 1);

    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  if (loading || userData == null) return <div>Зареждане...</div>;

  if (showSettings) return <Onboarding onComplete={handleSettingsComplete} />;
  
  if (!userData.onboardingComplete) return <Onboarding onComplete={handleSettingsComplete} />;
  
  
  const {
    totalBudget,
    totalSpent,
    totalRemaining,
    monthlySurplus
  } = calculateTotals(
    budget,
    spent,
    userData?.salary || 0,
    userData?.monthlyBudget || null
  );

  const currentMonth = new Date().toLocaleString('bg-BG', { month: 'long', year: 'numeric' });
  const remainingClass = totalRemaining > 0 ? 'font-semibold' : totalRemaining < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <>
      <header className="w-full bg-50 shadow-md border-b-4 border-300 px-4 py-2 flex items-center justify-between">
        <img src="/green-logo.png" alt="Budgetory Logo" className="w-20 h-20 sm:w-32 sm:h-32" />
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition-colors duration-200 text-sm sm:text-base"
          >
            ⚙️ Настройки на бюджета
          </button>
          <button
            onClick={async () => {
              await signOut(auth);
              navigate('/login');
            }}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base"
          >
            🔓 Изход
          </button>
        </div>
      </header>

      <div className="w-full max-w-md mx-auto px-2 py-4 sm:max-w-2xl sm:px-4 font-sans relative">
        <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">📊 Твоят месечен бюджет</h1>
        <h2 className="text-center text-base sm:text-lg text-gray-600 mb-6">Месец: {currentMonth}</h2>

        <div className="flex flex-col items-center text-center text-base sm:text-lg md:text-xl font-medium space-y-2 mt-4">
          <div className="text-gray-700">💸 <span className="font-semibold">Изхарчено:</span> {formatCurrency(totalSpent)}</div>
          <div className="font-bold text-lg sm:text-xl font-semibold">💵 Остатък от заплата: {formatCurrency(monthlySurplus)}</div>
          <div className="text-gray-700">
            🧮 <span className="font-bold text-lg sm:text-xl font-semibold">Общ месечен бюджет:</span> {formatCurrency(userData?.monthlyBudget || 0)}
          </div>
        </div>

        <div className="w-full flex justify-center my-4">
          <div className="w-full max-w-xs sm:max-w-xl">
            <BudgetChart data={spent} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-6">
          {userData.categories?.map((cat) => {
            const percentSpent = budget[cat] > 0 ? Math.min((spent[cat] / budget[cat]) * 100, 100) : 0;
            const barColor = percentSpent >= 100 ? 'bg-red-500' : 'bg-green-500';
            return (
              <div key={cat} className="bg-white shadow-md rounded-lg p-4 transition-transform duration-300 hover:scale-[1.01]">
                <div className="mb-2 text-sm font-medium text-gray-600">Категория: <strong>{cat}</strong></div>
                <div className="grid grid-cols-1 gap-1 text-sm text-gray-800 mb-2">
                  <div><span className="font-semibold">Бюджет:</span> {formatCurrency(budget[cat] || 0)}</div>
                  <div><span className="font-semibold">Изхарчено:</span> {formatCurrency(spent[cat] || 0)}</div>
                  <div><span className="font-semibold">Остатък:</span> {formatCurrency((budget[cat] || 0) - (spent[cat] || 0))}</div>
                </div>
                <BudgetItem
                  category={cat}
                  budget={budget[cat] || 0}
                  spent={spent[cat] || 0}
                  inputValue={inputValues[cat] || ''}
                  onInputChange={handleInputChange}
                  onAddExpense={handleAddExpense}
                  onDeleteCategory={() => handleDeleteCategory(cat)}
                />
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${barColor} h-3 rounded-full`}
                      style={{ width: `${percentSpent}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    {formatCurrency(spent[cat] || 0)} от {formatCurrency(budget[cat] || 0)} ({Math.round(percentSpent)}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Toast message={toast} type={toastType} />
      </div>
    </>
  );
}
