import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-close after 4 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 size={20} />,
      bgColor: 'bg-emerald-500',
      textColor: 'text-white',
      borderColor: 'border-emerald-600',
    },
    error: {
      icon: <AlertTriangle size={20} />,
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-600',
    },
  };

  const style = config[type];

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-4 w-full max-w-sm p-4 rounded-xl shadow-lg border ${style.bgColor} ${style.borderColor} animate-in fade-in slide-in-from-top-4 duration-300`}>
      <div className="flex items-center gap-3">
        <span className={style.textColor}>{style.icon}</span>
        <p className={`font-medium text-sm ${style.textColor}`}>{message}</p>
      </div>
      <button onClick={onClose} className={`p-1 rounded-full hover:bg-black/10 ${style.textColor}`}>
        <X size={18} />
      </button>
    </div>
  );
};