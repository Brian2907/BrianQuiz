
import React from 'react';

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Đang xử lý dữ liệu..." }) => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-slate-600 font-medium animate-pulse">{message}</p>
  </div>
);

export default LoadingSpinner;
