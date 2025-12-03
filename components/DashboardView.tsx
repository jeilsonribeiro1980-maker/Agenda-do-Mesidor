import React, { useMemo } from 'react';
import { Measurement, MeasurementStatus, User } from '../types';
import { ArrowRight, Bell, ListChecks, PieChart, CheckCircle2, Calendar } from 'lucide-react';
import { StatCard } from './StatCard';

interface DashboardViewProps {
  user: User;
  measurements: Measurement[];
  onAddNew: () => void;
  onStatCardClick: (view: 'agenda' | 'commissions', filters?: { status?: string }) => void;
  onEdit: (measurement: Measurement) => void;
}

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return {
        day: date.toLocaleDateString('pt-BR', { day: '2-digit' }),
        month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    }
};

export const DashboardView: React.FC<DashboardViewProps> = ({ user, measurements, onAddNew, onStatCardClick, onEdit }) => {

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const measurementsThisMonth = measurements.filter(m => {
      const [year, month] = m.date.split('-').map(Number);
      return month - 1 === currentMonth && year === currentYear;
    });

    const pendingMeasurements = measurements.filter(m => m.status === MeasurementStatus.PENDING);

    const completedThisMonthCount = measurementsThisMonth.filter(m => m.status === MeasurementStatus.COMPLETED).length;
    const totalRelevantThisMonth = measurementsThisMonth.filter(m => m.status !== MeasurementStatus.CANCELLED).length;
    const completionRate = totalRelevantThisMonth > 0 ? Math.round((completedThisMonthCount / totalRelevantThisMonth) * 100) : 0;

    return {
      totalPending: pendingMeasurements.length,
      completedThisMonth: completedThisMonthCount,
      totalThisMonth: totalRelevantThisMonth,
      completionRate: `${completionRate}%`,
      completionRateDetail: `${completedThisMonthCount} de ${totalRelevantThisMonth} concluído(s)`,
    };
  }, [measurements]);
  
  const upcomingMeasurements = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return measurements
      .filter(m => {
          const mDate = new Date(m.date + 'T00:00:00');
          return m.status === MeasurementStatus.PENDING && mDate >= today;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [measurements]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Olá, {user.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 mt-1">Aqui está um resumo da sua atividade.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Pendentes" 
          value={stats.totalPending} 
          icon={<ListChecks size={20} />} 
          color="amber" 
          footer="Total de agendamentos a realizar"
          onClick={() => onStatCardClick('agenda', { status: MeasurementStatus.PENDING })}
        />
        <StatCard 
          title="Concluídos (Mês)"
          value={stats.completedThisMonth}
          icon={<CheckCircle2 size={20} />}
          color="emerald"
          footer="Agendamentos realizados este mês"
          onClick={() => onStatCardClick('agenda', { status: MeasurementStatus.COMPLETED })}
        />
        <StatCard 
          title="Total no Mês"
          value={stats.totalThisMonth}
          icon={<Calendar size={20} />}
          color="indigo"
          footer="Agendamentos para este mês"
          onClick={() => onStatCardClick('agenda')}
        />
        <StatCard 
          title="Taxa de Conclusão (Mês)" 
          value={stats.completionRate} 
          icon={<PieChart size={20} />} 
          color="blue" 
          footer={stats.completionRateDetail}
        />
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Bell size={20} className="text-blue-500"/> Próximos Agendamentos</h3>
        {upcomingMeasurements.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {upcomingMeasurements.map(m => {
                const { day, month } = formatDate(m.date);
                return (
                    <div key={m.id} onClick={() => onEdit(m)} className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 shrink-0 shadow-sm">
                            <span className="text-lg font-bold leading-none">{day}</span>
                            <span className="text-[10px] font-bold tracking-wider uppercase">{month}</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-gray-800 truncate">{m.clientName}</p>
                            <p className="text-xs text-gray-500 truncate">Sol.: {m.requesterName}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500 font-medium hidden sm:block shrink-0 ml-4">
                           <p className="font-semibold">{m.address.district}</p>
                           <p>{m.address.city}</p>
                        </div>
                        <ArrowRight size={16} className="text-gray-400 shrink-0"/>
                    </div>
                )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center bg-gray-50/70 rounded-lg p-8 border border-dashed border-gray-200">
             <div className="bg-emerald-100 p-3 rounded-full mb-3">
                 <Bell size={24} className="text-emerald-600"/>
             </div>
             <p className="text-sm font-semibold text-gray-700">Tudo em dia!</p>
             <p className="text-xs text-gray-500">Nenhum agendamento pendente para os próximos dias.</p>
          </div>
        )}
      </div>
    </div>
  );
};