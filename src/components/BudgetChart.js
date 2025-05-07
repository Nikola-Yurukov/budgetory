import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { CHART_COLORS } from '../constants/budget';

export const BudgetChart = ({ data }) => {
  const pieData = Object.keys(data).map((key) => ({
    name: key,
    value: data[key]
  })).filter(item => item.value > 0);

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-6 h-full mb-6">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
            {pieData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="max-h-60 overflow-y-auto text-sm w-full sm:w-auto mt-4 sm:mt-0">
        <ul className="space-y-1">
          {pieData.map((entry, index) => (
            <li key={entry.name} className="flex items-center gap-2">
              <span
                className="inline-block w-4 h-4 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              ></span>
              {entry.name}: {entry.value.toLocaleString()} BGN
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 