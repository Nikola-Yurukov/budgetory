// A Tailwind-optimized budgeting tracker UI
// Refactored to use explicit expense entry instead of month closing logic

import React, { useState, useEffect } from 'react';
import { useBudget } from './hooks/useBudget';
import { Toast } from './components/Toast';
import { BudgetChart } from './components/BudgetChart';
import { BudgetItem } from './components/BudgetItem';
import { calculateTotals, formatCurrency, getDeltaPercent, getEmoji } from './utils/budgetUtils';
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { BudgetTracker } from './components/BudgetTracker';
import { Login } from './components/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<BudgetTracker />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}