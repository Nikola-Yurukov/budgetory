import { useState, useEffect } from 'react';
import { defaultBudget } from '../constants/budget';
import { calculateTotals } from '../utils/budgetUtils';

export const useBudget = () => {
  const [budget] = useState(defaultBudget);
  const [spent, setSpent] = useState(() => {
    const saved = localStorage.getItem('currentSpent');
    return saved ? JSON.parse(saved) : Object.keys(defaultBudget).reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  });
  
  const [inputValues, setInputValues] = useState(
    Object.keys(defaultBudget).reduce((acc, key) => ({ ...acc, [key]: '' }), {})
  );
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    const storedHistory = localStorage.getItem('budgetHistory');
    const storedSpent = localStorage.getItem('currentSpent');
    const storedInputs = localStorage.getItem('currentInputs');

    if (storedHistory) setHistory(JSON.parse(storedHistory));
    if (storedSpent) setSpent(JSON.parse(storedSpent));
    if (storedInputs) setInputValues(JSON.parse(storedInputs));
  }, []);

  useEffect(() => {
    localStorage.setItem('currentSpent', JSON.stringify(spent));
  }, [spent]);

  useEffect(() => {
    localStorage.setItem('currentInputs', JSON.stringify(inputValues));
  }, [inputValues]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleInputChange = (key, value) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handleAddExpense = (key) => {
    const value = Number(inputValues[key]);
    if (!value || isNaN(value)) return;
    const newSpent = { ...spent, [key]: spent[key] + value };
    setSpent(newSpent);
    setInputValues(prev => ({ ...prev, [key]: '' }));
    setToastType("success");
    setToast(`💸 Добавен разход от ${value} BGN към "${key}".`);
  };

  const closeMonth = () => {
    const currentMonth = new Date().toLocaleString('bg-BG', { month: 'long', year: 'numeric' });
    const exists = history.some(entry => entry.month === currentMonth);
    if (exists) {
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
    deleteEntry
  };
}; 