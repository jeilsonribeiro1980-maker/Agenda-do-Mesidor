import React, { useState } from 'react';
import { Measurement, MeasurementStatus } from '../types';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, Plus } from 'lucide-react';

interface CalendarViewProps {
  measurements: Measurement[];
  onEdit: (measurement: Measurement) => void;
  onAdd: (date: string) => void;
}

const statusConfig = {
    [MeasurementStatus.PENDING]: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', icon: Clock },
    [MeasurementStatus.COMPLETED]: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', icon: CheckCircle2 },
    [MeasurementStatus.CANCELLED]: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', icon: XCircle },
};

export const CalendarView: React.FC<CalendarViewProps> = ({ measurements, onEdit, onAdd }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const days = [];
  // Add padding for days from previous month
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`pad-start-${i}`} className="border-r border-b border-gray-200 bg-gray-50/30"></div>);
  }

  // Add days of the current month
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayMeasurements = measurements.filter(m => m.date === dateStr);
    
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

    days.push(
      <div 
        key={day} 
        onClick={() => onAdd(dateStr)}
        className="border-r border-b border-gray-200 p-2 min-h-[120px] flex flex-col group hover:bg-blue-50/30 cursor-pointer transition-colors relative"
      >
        <div className="flex justify-between items-start mb-1">
            <div className={`text-sm font-semibold ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-700'}`}>
            {day}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                <Plus size={16} />
            </div>
        </div>
        
        <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {dayMeasurements.map(m => {
             const style = statusConfig[m.status];
             const Icon = style.icon;
             return (
              <button
                key={m.id}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the add new date
                    onEdit(m);
                }}
                className={`w-full text-left p-1.5 rounded-md text-xs font-medium cursor-pointer transition-transform hover:scale-105 hover:shadow-sm ${style.bg} ${style.text}`}
              >
                <div className="flex items-center gap-1.5">
                   <Icon size={12} className="shrink-0" />
                   <span className="truncate">{m.clientName}</span>
                </div>
              </button>
             )
            })}
        </div>
      </div>
    );
  }

  // Add padding for days from next month
  const totalCells = days.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    days.push(<div key={`pad-end-${i}`} className="border-r border-b border-gray-200 bg-gray-50/30"></div>);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  }

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 animate-in fade-in">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 text-gray-600"><ChevronLeft size={20} /></button>
        <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
             <button onClick={handleToday} className="text-xs text-blue-600 font-semibold hover:underline">Hoje</button>
        </div>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 text-gray-600"><ChevronRight size={20} /></button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-t border-l border-gray-200">
        {weekdays.map(day => (
          <div key={day} className="text-center py-2 text-xs font-bold text-gray-500 uppercase bg-gray-50 border-r border-b border-gray-200">{day}</div>
        ))}
        {days}
      </div>
    </div>
  );
};