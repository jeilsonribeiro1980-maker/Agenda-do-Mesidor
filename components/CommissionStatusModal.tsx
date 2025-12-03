import React, { useState } from 'react';
import { CommissionItem } from '../types';
import { X, BadgeCheck, BadgeX, Loader2, DollarSign } from 'lucide-react';

interface CommissionStatusModalProps {
  item: CommissionItem;
  onClose: () => void;
  onSave: (isPaid: boolean) => Promise<void>;
}

export const CommissionStatusModal: React.FC<CommissionStatusModalProps> = ({ item, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState<boolean | null>(null);

  const handleSaveClick = async (isPaid: boolean) => {
    if (isSaving !== null) return;
    setIsSaving(isPaid);
    await onSave(isPaid);
    // O componente será desmontado pelo pai, que também irá resetar o estado.
  };

  const currentStatusText = item.commissionPaid ? "Pago" : "A Pagar";
  const currentStatusColor = item.commissionPaid ? "text-emerald-600" : "text-amber-600";

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={isSaving !== null ? undefined : onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-500" />
            Alterar Pagamento
          </h2>
          <button 
            onClick={isSaving !== null ? undefined : onClose} 
            disabled={isSaving !== null} 
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Status atual para <span className="font-semibold text-gray-700">{item.clientName}</span> é <strong className={currentStatusColor}>{currentStatusText}</strong>.
          Selecione o novo status.
        </p>

        <div className="space-y-3 pt-2">
          {/* Botão Marcar como Pago */}
          <button
            onClick={() => handleSaveClick(true)}
            disabled={isSaving !== null || item.commissionPaid}
            className="w-full flex items-center justify-center gap-3 p-3 rounded-lg border text-left font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-emerald-50"
          >
            {isSaving === true ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <BadgeCheck size={20} />
            )}
            <span>Marcar como Pago</span>
          </button>
          
          {/* Botão Marcar "A Pagar" */}
          <button
            onClick={() => handleSaveClick(false)}
            disabled={isSaving !== null || !item.commissionPaid}
            className="w-full flex items-center justify-center gap-3 p-3 rounded-lg border text-left font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 focus:ring-amber-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-amber-50"
          >
            {isSaving === false ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <BadgeX size={20} />
            )}
            <span>Marcar "A Pagar"</span>
          </button>
        </div>
      </div>
    </div>
  );
};