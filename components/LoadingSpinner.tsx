
import React from 'react';

// A high-quality loading spinner component for visual feedback during async operations
const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-8 border-slate-100 dark:border-slate-800 rounded-full"></div>
        <div className="absolute inset-0 border-8 border-green-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Brian-AI System Processing...</p>
    </div>
  );
};

export default LoadingSpinner;
