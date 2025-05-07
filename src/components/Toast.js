import React from 'react';

export const Toast = ({ message, type }) => {
  if (!message) return null;

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-100 border border-green-300 text-green-800";
      case "warning":
        return "bg-yellow-100 border border-yellow-300 text-yellow-800";
      default:
        return "bg-red-100 border border-red-300 text-red-800";
    }
  };

  return (
    <div className={`fixed bottom-5 right-5 px-4 py-2 rounded shadow-md z-50 transition-opacity duration-300 ${getToastStyles()}`}>
      {message}
    </div>
  );
}; 