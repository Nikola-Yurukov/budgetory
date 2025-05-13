import { useState, useEffect } from 'react';
import { calculateTotals } from '../utils/budgetUtils';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export const useBudget = (initialData = {}) => {
  const [budget, setBudget] = useState({});
  const [spent, setSpent] = useState({});
  const [inputValues, setInputValues] = useState({});
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [monthlyBudget, setMonthlyBudget] = useState(0);

  useEffect(() => {
    const categories = initialData?.categories || Object.keys(initialData?.budgets || {});
    const newBudget = {};
    const newSpent = {};
    const newInputs = {};

    const calculatedSpent = {};
    (initialData.transactions || []).forEach(tx => {
      if (!calculatedSpent[tx.category]) {
        calculatedSpent[tx.category] = 0;
      }
      calculatedSpent[tx.category] += tx.amount;
    });

    categories.forEach(cat => {
      newBudget[cat] = initialData.budgets?.[cat] || 0;
      newSpent[cat] = calculatedSpent[cat] || 0;
      newInputs[cat] = '';
    });

    setMonthlyBudget(initialData.monthlyBudget || 0);
    setBudget(newBudget);
    setSpent(newSpent);
    setInputValues(newInputs);
    setHistory(initialData.transactions || []);
  }, [initialData]);

  const handleInputChange = (key, value) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handleAddExpense = async (category) => {
    const value = inputValues[category];
    if (!value || isNaN(value)) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const newTransaction = {
      category,
      amount: Number(value),
      timestamp: Date.now(),
    };

    try {
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      const existingData = docSnap.data();
      const currentTransactions = existingData.transactions || [];

      await updateDoc(userRef, {
        transactions: [...currentTransactions, newTransaction],
      });

      setInputValues(prev => ({ ...prev, [category]: '' }));
      setSpent(prev => ({
        ...prev,
        [category]: (prev[category] || 0) + Number(value)
      }));
      setHistory(prev => [...prev, newTransaction]);
    } catch (err) {
      console.error('Failed to save transaction:', err);
    }
  };

  const closeMonth = () => {
    const currentMonth = new Date().toLocaleString('bg-BG', {
      month: 'long',
      year: 'numeric'
    });

    if (history.some(h => h.month === currentMonth)) {
      setToastType("warning");
      setToast("📅 Този месец вече е затворен.");
      return;
    }

    const totals = calculateTotals(budget, spent);
    const newEntry = {
      timestamp: new Date().toLocaleString('bg-BG'),
      month: currentMonth,
      budget,
      spent,
      ...totals
    };

    const updatedHistory = [...history, newEntry];
    setHistory(updatedHistory);
    localStorage.setItem('budgetHistory', JSON.stringify(updatedHistory));
    setToastType("success");
    setToast("📁 Месецът беше успешно затворен.");
  };

  const deleteEntry = (indexToRemove) => {
    const updated = history.filter((_, idx) => idx !== indexToRemove);
    setHistory(updated);
    localStorage.setItem('budgetHistory', JSON.stringify(updated));
    setToastType("success");
    setToast("🗑️ Месецът беше изтрит.");
  };

  return {
    budget,
    spent,
    inputValues,
    history,
    toast,
    toastType,
    handleInputChange,
    handleAddExpense,
    closeMonth,
    deleteEntry,
    monthlyBudget
  };
};
