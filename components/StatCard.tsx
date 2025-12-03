import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: 'blue' | 'amber' | 'emerald' | 'indigo';
  onClick?: () => void;
  footer?: string;
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color, onClick, footer, isLoading }) => {
  const Tag = onClick ? 'button' : 'div';

  const colors = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      iconBg: 'bg-blue-500',
      border: 'hover:border-blue-200'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      iconBg: 'bg-amber-500',
      border: 'hover:border-amber-200'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      iconBg: 'bg-emerald-500',
      border: 'hover:border-emerald-200'
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      iconBg: 'bg-indigo-500',
      border: 'hover:border-indigo-200'
    },
  };

  const style = colors[color];
  const interactiveClasses = onClick ? `cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${style.border}` : '';

  return (
    <Tag 
        onClick={onClick} 
        className={`p-5 rounded-2xl border border-transparent shadow-sm flex flex-col justify-between ${style.bg} ${interactiveClasses}`}
        disabled={isLoading || !onClick}
    >
      <div className="flex justify-between items-start">
        <p className={`text-sm font-semibold ${style.text}`}>{title}</p>
        <div className={`w-9 h-9 flex items-center justify-center rounded-lg text-white ${style.iconBg} shadow-sm shrink-0`}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        {isLoading ? (
            <div className={`h-9 w-24 rounded animate-pulse ${style.iconBg} opacity-20`}></div>
        ) : (
            <p className={`text-3xl font-bold ${style.text} truncate`}>{value}</p>
        )}
        {footer && <p className={`text-xs ${style.text} opacity-70 mt-1`}>{footer}</p>}
      </div>
    </Tag>
  );
};