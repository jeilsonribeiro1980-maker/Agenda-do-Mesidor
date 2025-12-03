import React from 'react';
import { Measurement } from '../types';
import { X, Calendar, User, MapPin, Phone, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { MeasurementStatus } from '../types';

interface SharedItemViewProps {
  measurement: Measurement;
  onClose: () => void;
}

const StatusInfo: React.FC<{ status: MeasurementStatus }> = ({ status }) => {
  const config = {
    [MeasurementStatus.PENDING]: { 
      bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock 
    },
    [MeasurementStatus.COMPLETED]: { 
      bg: 'bg-emerald-100', text: 'text-emerald-800', icon: CheckCircle2 
    },
    [MeasurementStatus.CANCELLED]: { 
      bg: 'bg-rose-100', text: 'text-rose-800', icon: XCircle 
    },
  };
  const style = config[status];
  const Icon = style.icon;

  return (
    <div className={`p-4 rounded-lg flex items-center gap-3 ${style.bg} ${style.text}`}>
      <Icon size={24} />
      <div>
        <p className="font-bold text-lg">{status}</p>
        <p className="text-sm">Status do Agendamento</p>
      </div>
    </div>
  );
};

export const SharedItemView: React.FC<SharedItemViewProps> = ({ measurement, onClose }) => {
  if (!measurement) return null;

  const fullAddress = `${measurement.address.street}, ${measurement.address.number}, ${measurement.address.district}, ${measurement.address.city}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Detalhes do Agendamento</h2>
            <p className="text-xs text-gray-500">Informação partilhada</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <StatusInfo status={measurement.status} />

          <div className="space-y-3 pt-2">
             <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-400 mt-1" />
                <div>
                    <p className="font-semibold text-gray-800">{new Date(measurement.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-xs text-gray-500">Data da Medição</p>
                </div>
            </div>

             <div className="flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-1" />
                <div>
                    <p className="font-semibold text-gray-800">{measurement.clientName}</p>
                    <p className="text-xs text-gray-500">Cliente</p>
                </div>
            </div>

            <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-1" />
                <div>
                    <p className="font-semibold text-gray-800">{measurement.clientPhone}</p>
                    <p className="text-xs text-gray-500">Telefone</p>
                </div>
            </div>
            
             <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-1" />
                <div>
                    <p className="font-semibold text-gray-800">{fullAddress}</p>
                    <p className="text-xs text-gray-500">Endereço da Obra</p>
                </div>
            </div>

            {measurement.observations && (
                 <div className="flex items-start gap-3 pt-2">
                    <FileText size={18} className="text-gray-400 mt-1" />
                    <div>
                        <p className="font-semibold text-gray-800 whitespace-pre-wrap">{measurement.observations}</p>
                        <p className="text-xs text-gray-500">Observações</p>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};