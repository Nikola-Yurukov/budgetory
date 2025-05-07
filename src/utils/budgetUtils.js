export const getEmoji = (spent, budget) => {
  if (spent > budget) return '🔴';
  if (spent > budget * 0.9) return '🟡';
  return '🟢';
};

export const getDeltaPercent = (current, previous) => {
  if (!previous || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
};

export const calculateTotals = (budget, spent) => {
  const totalBudget = Object.values(budget).reduce((acc, val) => acc + Number(val), 0);
  const totalSpent = Object.values(spent).reduce((acc, val) => acc + Number(val), 0);
  const totalRemaining = totalBudget - totalSpent;
  const monthlySurplus = 7500 - totalSpent; // Using the constant from budget.js

  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    monthlySurplus
  };
};

export const formatCurrency = (amount) => {
  return amount.toLocaleString() + ' BGN';
}; 