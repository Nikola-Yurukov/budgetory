import React from 'react';

export const BudgetItem = ({
  category,
  budget,
  spent,
  inputValue,
  onInputChange,
  onAddExpense
}) => {
  const isOver = spent > budget;
  const isUnder80 = spent <= budget * 0.8;
  const isOver90 = spent > budget * 0.9 && spent <= budget;
  const savedAmount = budget - spent;
  const savedInfo = savedAmount > 0 && !isOver ? ` (оставащи ${savedAmount} BGN 📈)` : '';
  const inputTextColor = isOver ? 'text-red-600' : 'text-gray-800';
  const emoji = isUnder80 ? ' 🟢' : isOver90 ? ' 🟡' : isOver ? '🔴' : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 border rounded-lg p-4 shadow-sm justify-items-center">
      <span className="md:col-span-3 text-center font-medium text-gray-700 w-full">
        {category}{emoji}{savedInfo}
      </span>
      <div className="md:col-span-3 w-full text-center">{budget} BGN</div>
      <div className="md:col-span-3 w-full text-center">
        <div className={`${inputTextColor}`}>{spent} BGN</div>
      </div>
      <div className="md:col-span-3 w-full flex flex-col items-center">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => onInputChange(category, e.target.value)}
          placeholder="Добави сума"
          className="w-full p-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={() => onAddExpense(category)}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          ➕ Добави
        </button>
      </div>
    </div>
  );
}; 