import React from 'react';

export const BudgetItem = ({
  category,
  budget,
  spent,
  inputValue,
  onInputChange,
  onAddExpense,
  onDeleteCategory
}) => {
  return (
    <div className="w-full bg-gray-50 p-3 rounded border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => onInputChange(category, e.target.value)}
          placeholder="Добави сума"
          className="flex-1 sm:max-w-[150px] px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="flex gap-2">
          <button
            onClick={() => onAddExpense(category)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            ➕ Добави
          </button>

          {onDeleteCategory && (
            <button
              onClick={onDeleteCategory}
              className="px-3 py-1 text-red-500 border border-red-300 rounded hover:bg-red-100 text-sm"
              title="Изтрий категория"
            >
              ❌ Изтрий
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
