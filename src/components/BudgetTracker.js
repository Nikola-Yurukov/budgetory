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
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showGuide, setShowGuide] = useState(true);  
  const { userData, loading } = useUserData(refreshKey);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) {
        navigate('/login');
      } else {
        setUser(firebaseUser);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const [guidePosition, setGuidePosition] = useState({ top: 0, left: 0 });

  const guideSteps = [
    {
      text: "Добре дошъл в Budgetory!",
      highlight: "header"
    },
    {
      text: "Тук можеш да зададеш своята заплата и месечен бюджет.",
      highlight: "budget-summary"
    },
    {
      text: "Създай категории (напр. Храна, Сметки, Забавления).",
      highlight: "categories"
    },
    {
        text: "Натисни копчето 'Настройки'.От там можеш да зададеш своя месечен бюджет, и да добавяш различни категории.",
        highlight: "categories"
      },
    {
      text: "Следи разходите си в реално време.",
      highlight: "summary-bars"
    },
    {
      text: "Използвай графиката за бърз преглед на бюджета.",
      highlight: "chart"
    },
    {
      text: "Добави разходи като въведеш стойност под съответната категория.",
      highlight: "category-actions"
    },
    {
      text: "Ако изразходиш повече от зададеното — ще получиш предупреждение.",
      highlight: "alerts"
    },
    {
      text: "Целта ти е да останеш в рамките на бюджета и да спестиш!",
      highlight: "summary"
    }
];

useEffect(() => {
  if (!showGuide) return;
  const step = guideSteps[currentStep];
  const el = document.querySelector(`[data-guide-id="${step.highlight}"]`);
  if (el) {
    const rect = el.getBoundingClientRect();
    setGuidePosition({
      top: rect.top + window.scrollY - 10,
      left: rect.left + window.scrollX + rect.width + 16,
    });
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, [currentStep, showGuide]);


  const initialData = useMemo(() => ({
    budgets: userData?.budgets || {},
    transactions: userData?.transactions || [],
    categories: userData?.categories || []
  }), [userData]);

  const {
    budget,
    spent,
    inputValues,
    toast,
    toastType,
    handleInputChange,
    handleAddExpense,
    closeMonth,
  } = useBudget(initialData);

  if (!user) return <div>Зареждане на профила...</div>;
  if (loading || !userData) return <div>Зареждане...</div>;
  if (showSettings || !userData.onboardingComplete) return <Onboarding onComplete={() => setShowSettings(false)} />;

  const { totalBudget, totalSpent, totalRemaining, monthlySurplus } = calculateTotals(
    budget,
    spent,
    userData?.salary || 0,
    userData?.monthlyBudget || 0
  );

  const budgetPercent = Math.min((totalSpent / userData.monthlyBudget) * 100, 100);
  const salaryPercent = Math.min((totalSpent / userData.salary) * 100, 100);

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - today.getDate();
  const dailyAllowance = Math.max(0, monthlySurplus) / Math.max(1, remainingDays);

  const overspendingWarnings = userData.categories?.filter(cat => spent[cat] > (budget[cat] || 0));
  const currentMonth = today.toLocaleString('bg-BG', { month: 'long', year: 'numeric' });

  const handleNextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowGuide(false);
    }
  };

  return (
    <div className="max-w-2xl  mx-auto px-4 py-6 font-sans">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📊 Твоят месечен бюджет</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
          >⚙️ Настройки</button>
          <button
            onClick={async () => { await signOut(auth); navigate('/login'); }}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >🔓 Изход</button>
        </div>
      </header>

      {showGuide && (
  <div
    className="fixed z-50 bg-white text-gray-800 p-4 rounded shadow-xl max-w-xs transition-all duration-300"
    style={{
      position: 'fixed',
      top: guidePosition.top,
      left: guidePosition.left,
    }}
  >
    <div className="text-sm font-semibold mb-2">{guideSteps[currentStep].text}</div>
    <div className="text-right">
      <button
        onClick={handleNextStep}
        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
      >
        {currentStep < guideSteps.length - 1 ? 'Следваща стъпка' : 'Готово'}
      </button>
    </div>
  </div>
)}


      <h2 className="text-center text-gray-600 mb-4">Месец: {currentMonth}</h2>
      <p className="text-center text-sm text-gray-500 mb-4">
        📅 Остават {remainingDays} дни · Можеш да харчиш до {formatCurrency(dailyAllowance)} на ден
      </p>

      <div className="bg-white rounded shadow p-4 space-y-3 text-center">
        <p className="text-green-700 font-semibold">📗 Остатък от заплата: {formatCurrency(userData.salary - totalSpent)} от {formatCurrency(userData.salary)}</p>
        <p className="text-blue-800 font-semibold">📊 Бюджет: {formatCurrency(totalSpent)} от {formatCurrency(userData.monthlyBudget)}</p>

        <div className="text-sm">
          <p className="text-gray-600">Използван бюджет: {Math.round(budgetPercent)}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${budgetPercent}%` }}></div>
          </div>

          <p className="text-gray-600">Изразходвана заплата: {Math.round(salaryPercent)}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${salaryPercent}%` }}></div>
          </div>
        </div>

        <p className={`font-bold ${monthlySurplus < 0 ? 'text-red-600' : 'text-green-600'}`}>💰 Нетен месечен резултат: {formatCurrency(monthlySurplus)}</p>
      </div>

      {overspendingWarnings.length > 0 && (
        <div className="bg-yellow-100 text-yellow-800 mt-4 p-3 rounded-md">
          ⚠️ Превишен бюджет в: {overspendingWarnings.join(', ')}
        </div>
      )}

      <div className="my-6">
        <BudgetChart data={spent} />
      </div>

      <div className="grid gap-4">
        {userData.categories?.map(cat => {
          const percentSpent = budget[cat] > 0 ? Math.min((spent[cat] / budget[cat]) * 100, 100) : 0;
          const barColor = percentSpent >= 100 ? 'bg-red-500' : 'bg-green-500';
          return (
            <div key={cat} className="bg-white p-4 rounded shadow">
              <p className="font-medium text-gray-700">Категория: <strong>{cat}</strong></p>
              <p>Бюджет: {formatCurrency(budget[cat] || 0)} · Изхарчено: {formatCurrency(spent[cat] || 0)}</p>
              <BudgetItem
                category={cat}
                budget={budget[cat] || 0}
                spent={spent[cat] || 0}
                inputValue={inputValues[cat] || ''}
                onInputChange={handleInputChange}
                onAddExpense={handleAddExpense}
                onDeleteCategory={async () => {
                  const uid = auth.currentUser?.uid;
                  if (!uid) return;
                  const userRef = doc(db, 'users', uid);
                  const docSnap = await getDoc(userRef);
                  if (!docSnap.exists()) return;

                  const data = docSnap.data();
                  const updatedBudgets = { ...data.budgets };
                  const updatedCategories = [...(data.categories || [])];
                  const updatedTransactions = [...(data.transactions || [])];

                  delete updatedBudgets[cat];
                  const index = updatedCategories.indexOf(cat);
                  if (index !== -1) updatedCategories.splice(index, 1);

                  const filteredTransactions = updatedTransactions.filter(tx => tx.category !== cat);

                  await updateDoc(userRef, {
                    budgets: updatedBudgets,
                    categories: updatedCategories,
                    transactions: filteredTransactions
                  });

                  setRefreshKey(prev => prev + 1);
                }}
              />
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`${barColor} h-2 rounded-full`} style={{ width: `${percentSpent}%` }}></div>
                </div>
                <p className="text-xs text-gray-600 text-center mt-1">
                  {formatCurrency(spent[cat] || 0)} от {formatCurrency(budget[cat] || 0)} ({Math.round(percentSpent)}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Toast message={toast} type={toastType} />
    </div>
  );
}
