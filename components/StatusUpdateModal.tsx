import React, { useState } from 'react';
import { Measurement, MeasurementStatus } from '../types';
import { X, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface StatusUpdateModalProps {
  measurement: Measurement;
  onClose: () => void;
  onSave: (newStatus: MeasurementStatus) => Promise<void>;
}

const statusOptions = [
  { status: MeasurementStatus.PENDING, label: 'Pendente', icon: Clock, color: 'amber' },
  { status: MeasurementStatus.COMPLETED, label: 'Realizado', icon: CheckCircle2, color: 'emerald' },
  { status: MeasurementStatus.CANCELLED, label: 'Cancelado', icon: XCircle, color: 'rose' },
];

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({ measurement, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState<MeasurementStatus | null>(null);

  const handleSaveClick = async (newStatus: MeasurementStatus) => {
    if (isSaving) return;
    setIsSaving(newStatus);
    await onSave(newStatus);
    // The component will be unmounted by the parent, so no need to reset isSaving.
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={isSaving ? undefined : onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Alterar Status</h2>
          <button 
            onClick={isSaving ? undefined : onClose} 
            disabled={isSaving !== null} 
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Selecione o novo status para o agendamento de <span className="font-semibold text-gray-700">{measurement.clientName}</span>.
        </p>

        <div className="space-y-3 pt-2">
          {statusOptions.map(({ status, label, icon: Icon, color }) => {
            const isCurrent = measurement.status === status;
            const buttonVariants = {
                amber: { base: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100', active: 'bg-amber-500 text-white ring-amber-300' },
                emerald: { base: 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100', active: 'bg-emerald-500 text-white ring-emerald-300' },
                rose: { base: 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100', active: 'bg-rose-500 text-white ring-rose-300' },
            };
            const style = buttonVariants[color as 'amber' | 'emerald' | 'rose'];

            return (
              <button
                key={status}
                onClick={() => handleSaveClick(status)}
                disabled={isSaving !== null}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-wait ${isCurrent ? style.active : style.base}`}
              >
                <div className="w-5 flex items-center justify-center">
                  {isSaving === status ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};