
import React from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, type = 'info', children }) => {
  if (!isOpen) return null;

  const typeStyles = {
    info: { icon: <Info size={40} className="text-blue-500"/>, border: 'border-blue-100' },
    success: { icon: <CheckCircle size={40} className="text-green-500"/>, border: 'border-green-100' },
    warning: { icon: <AlertCircle size={40} className="text-yellow-500"/>, border: 'border-yellow-100' },
    error: { icon: <AlertCircle size={40} className="text-red-500"/>, border: 'border-red-100' },
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className={`bg-white dark:bg-slate-800 w-full max-w-lg rounded-[4rem] shadow-3xl border-8 ${typeStyles[type].border} dark:border-slate-700 overflow-hidden animate-stack-grow`}>
        <div className="flex items-center justify-between p-10 border-b-4 border-slate-50 dark:border-slate-700">
          <div className="flex items-center gap-4">
            {typeStyles[type].icon}
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{title}</h3>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-3xl transition-all">
            <X size={24} />
          </button>
        </div>
        <div className="p-10">
          <div className="text-slate-600 dark:text-slate-300 font-bold text-lg leading-relaxed mb-10">
            {children}
          </div>
          <button 
            onClick={onClose}
            className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-transform"
          >
            ĐÃ HIỂU
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
