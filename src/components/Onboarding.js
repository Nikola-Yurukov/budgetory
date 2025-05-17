import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../firebase';

export function Onboarding({ onComplete }) {
  const [salary, setSalary] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [categories, setCategories] = useState([{ name: '', budget: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [existingData, setExistingData] = useState({});

  useEffect(() => {
    const fetchExisting = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      if (data?.onboardingComplete && !onComplete) return;
      setExistingData(data);
      setSalary(data.salary?.toString() || '');
      setMonthlyBudget(data.monthlyBudget?.toString() || '');
      const formattedCategories = (data.categories || []).map(cat => ({
        name: cat,
        budget: data.budgets?.[cat]?.toString() || ''
      }));
      if (formattedCategories.length > 0) {
        setCategories(formattedCategories);
      }
    };
    fetchExisting();
  }, [onComplete]);

  useEffect(() => {
    const formCategoryNames = categories.map(cat => cat.name);
    const existingCategories = existingData.categories || [];
    const categoriesChanged = existingCategories.length !== formCategoryNames.length ||
      !existingCategories.every(name => formCategoryNames.includes(name));

    const salaryChanged = salary !== '' && Number(salary) !== existingData.salary;
    const budgetChanged = monthlyBudget !== '' && Number(monthlyBudget) !== existingData.monthlyBudget;

    const budgetValuesChanged = categories.some(cat => {
      const existingBudget = existingData.budgets?.[cat.name]?.toString() || '';
      return cat.budget !== existingBudget;
    });

    setHasChanges(salaryChanged || budgetChanged || categoriesChanged || budgetValuesChanged);
  }, [salary, monthlyBudget, categories, existingData]);

  const handleAddCategory = () => {
    setCategories([...categories, { name: '', budget: '' }]);
  };

  const handleChange = (index, field, value) => {
    const newCategories = [...categories];
    newCategories[index][field] = value;
    setCategories(newCategories);
  };

  const handleRemoveCategory = async (index) => {
    const catToRemove = categories[index]?.name;
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);

    if (catToRemove) {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('User not authenticated');
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) return;

        const existingData = docSnap.data();
        const updatedBudgets = { ...existingData.budgets };
        const updatedCategories = [...(existingData.categories || [])];

        delete updatedBudgets[catToRemove];
        const indexInArray = updatedCategories.indexOf(catToRemove);
        if (indexInArray !== -1) updatedCategories.splice(indexInArray, 1);

        await updateDoc(userRef, {
          budgets: updatedBudgets,
          categories: updatedCategories
        });
      } catch (err) {
        console.error('Failed to delete category:', err);
      }
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (!window.confirm("Имате незапазени промени. Искате ли да ги отхвърлите и да продължите?")) {
        return;
      }
    }
    if (onComplete) onComplete();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError('Не сте влезли в профила си.');
      setSaving(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};

      const newBudgets = { ...existingData.budgets };
      const newCategories = new Set(existingData.categories || []);

      categories.forEach(cat => {
        if (cat.name && cat.budget) {
          newBudgets[cat.name] = Number(cat.budget);
          newCategories.add(cat.name);
        }
      });

      await setDoc(userRef, {
        salary: salary !== '' ? Number(salary) : existingData.salary || 0,
        monthlyBudget: monthlyBudget !== '' ? Number(monthlyBudget) : existingData.monthlyBudget || 0,
        budgets: newBudgets,
        categories: Array.from(newCategories),
        onboardingComplete: true
      }, { merge: true });

      if (onComplete) onComplete();
    } catch (err) {
      setError('Грешка при запазване на настройките.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow-lg p-4 relative">
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-xl"
        title="Затвори"
      >
        ✖
      </button>
      <h2 className="text-xl font-bold mb-4">🎯 Моят бюджет</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-medium">Месечна заплата:</label>
        <input
          type="number"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          className="w-full border px-2 py-1 mb-4"
        />
  
        <label className="block mb-2 font-medium">Общ месечен бюджет:</label>
        <input
          type="number"
          value={monthlyBudget}
          onChange={(e) => setMonthlyBudget(e.target.value)}
          className="w-full border px-2 py-1 mb-4"
        />
  
        <h3 className="font-semibold mb-2">Категории:</h3>
        {categories.map((cat, index) => (
          <div key={index} className="flex gap-2 mb-2 items-center">
            <input
              type="text"
              placeholder="Категория"
              value={cat.name}
              onChange={(e) => handleChange(index, 'name', e.target.value)}
              className="flex-1 border px-2 py-1"
              required
            />
            <input
              type="number"
              placeholder="Бюджет"
              value={cat.budget}
              onChange={(e) => handleChange(index, 'budget', e.target.value)}
              className="w-24 border px-2 py-1"
              required
            />
            <button
              type="button"
              onClick={() => handleRemoveCategory(index)}
              className="text-red-500 hover:text-red-700"
              title="Премахни категория"
            >
              ❌
            </button>
          </div>
        ))}
  
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <button type="button" onClick={handleAddCategory} className="text-blue-600">
            ➕ Добави категория
          </button>
          <button
            type="submit"
            disabled={!hasChanges}
            className={`w-full py-2 px-4 rounded ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } transition`}
          >
            💾 Запази
          </button>
        </div>
  
        {error && <div className="text-red-600 mb-2">{error}</div>}
      </form>
    </div>
  );
  
}
