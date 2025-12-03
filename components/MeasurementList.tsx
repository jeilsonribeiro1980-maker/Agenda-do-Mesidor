import React, { useState } from 'react';
import { Measurement, MeasurementStatus } from '../types';
import { MapPin, Phone, User, Calendar, Edit2, Trash2, CheckCircle2, Clock, XCircle, FileText, Share2, Hash, Lock, Unlock, Link } from 'lucide-react';
import { Button } from './Button';

interface MeasurementListProps {
  measurements: Measurement[];
  onEdit: (measurement: Measurement) => void;
  onDelete: (id: string) => void;
  onViewMap: (address: string) => void;
  onStatusUpdate: (id: string, newStatus: MeasurementStatus) => void;
  onPartialUpdate: (id: string, data: Partial<Pick<Measurement, 'orderNumber'>>) => void;
}

const StatusBadge: React.FC<{ status: MeasurementStatus }> = ({ status }) => {
  const config = {
    [MeasurementStatus.PENDING]: { 
      bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock 
    },
    [MeasurementStatus.COMPLETED]: { 
      bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 
    },
    [MeasurementStatus.CANCELLED]: { 
      bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle 
    },
  };
  
  const style = config[status];
  const Icon = style.icon;

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
      <Icon size={14} />
      {status}
    </span>
  );
};

export const MeasurementList: React.FC<MeasurementListProps> = ({ measurements, onEdit, onDelete, onViewMap, onStatusUpdate, onPartialUpdate }) => {
  
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderInputValue, setOrderInputValue] = useState('');
  const [unlockedCards, setUnlockedCards] = useState(new Set<string>());
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  const toggleLock = (id: string) => {
    setUnlockedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleShare = async (item: Measurement) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?measurementId=${item.id}`;

    try {
      if (navigator.share) {
        const shareData = {
          title: `Agendamento: ${item.clientName}`,
          text: `Confira os detalhes do agendamento de medição para ${item.clientName}.`,
          url: shareUrl,
        };
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link público do agendamento copiado!');
      }
    } catch (err) {
      console.error('Erro ao partilhar:', err);
      if ((err as DOMException).name !== 'AbortError') {
        alert('Não foi possível partilhar ou copiar o link.');
      }
    }
  };
    
  const handleOrderClick = (item: Measurement) => {
    setEditingOrderId(item.id);
    setOrderInputValue(item.orderNumber || '');
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderInputValue(e.target.value);
  };

  const handleOrderSave = (id: string) => {
    if (editingOrderId === id) { // Only save if currently editing this item
      const currentItem = measurements.find(m => m.id === id);
      if(currentItem && currentItem.orderNumber !== orderInputValue) {
        onPartialUpdate(id, { orderNumber: orderInputValue });
      }
      setEditingOrderId(null);
    }
  };

  const handleOrderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      handleOrderSave(id);
    } else if (e.key === 'Escape') {
      setEditingOrderId(null);
    }
  };

  if (measurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="bg-blue-50 p-4 rounded-full mb-4">
          <Calendar className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum agendamento</h3>
        <p className="text-gray-500 max-w-xs mx-auto">
          Utilize o botão + para adicionar uma nova medição ou ajuste seus filtros.
        </p>
      </div>
    );
  }

  const areAllUnlocked = unlockedCards.size === measurements.length;

  const handleToggleAllLocks = () => {
    if (areAllUnlocked) {
        setUnlockedCards(new Set()); // Lock all
    } else {
        const allIds = measurements.map(m => m.id);
        setUnlockedCards(new Set(allIds)); // Unlock all
    }
  };

  return (
    <>
      {/* Control bar for bulk actions */}
      <div className="flex justify-end items-center mb-4 -mt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleToggleAllLocks} 
          icon={areAllUnlocked ? <Lock size={14} /> : <Unlock size={14} />}
          className="text-gray-600 hover:text-blue-700 hover:bg-blue-50"
          title={areAllUnlocked ? 'Bloquear todos os cards para evitar edições acidentais' : 'Desbloquear todos os cards para edição rápida'}
        >
          {areAllUnlocked ? 'Bloquear Todos' : 'Desbloquear Todos'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {measurements.map((item) => {
          const isLocked = !unlockedCards.has(item.id);
          const isStatusMenuOpen = openStatusMenuId === item.id;
          const dateObj = new Date(item.date + 'T00:00:00');
          const day = dateObj.getDate();
          const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
          const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
          const fullAddress = `${item.address.street}, ${item.address.number}, ${item.address.district}, ${item.address.city}`;

          return (
            <div key={item.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200 overflow-hidden flex flex-col">
              
              {/* Header with Date Badge and Status */}
              <div className="p-5 pb-2 flex justify-between items-start">
                <div className="flex gap-4">
                  {/* Date Badge */}
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 shrink-0 shadow-sm">
                    <span className="text-xl font-bold leading-none">{day}</span>
                    <span className="text-[10px] font-bold tracking-wider">{month}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">{weekday}</p>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 leading-tight group-hover:text-blue-600 transition-colors">
                      {item.clientName}
                    </h3>
                  </div>
                </div>
                <div className="relative">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLocked) {
                        setOpenStatusMenuId(isStatusMenuOpen ? null : item.id);
                      }
                    }}
                    title={isLocked ? "Destrave o card para alterar" : "Clique para alterar o status"}
                    className={`inline-block rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-150 ease-in-out ${!isLocked ? 'cursor-pointer hover:scale-105 active:scale-100' : 'cursor-not-allowed opacity-70'}`}
                  >
                    <StatusBadge status={item.status} />
                  </div>
                   {isStatusMenuOpen && !isLocked && (
                    <div 
                      className="absolute top-full right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border z-20 animate-in fade-in duration-150"
                      onClick={(e) => e.stopPropagation()} 
                    >
                      <div className="p-1">
                        {Object.values(MeasurementStatus)
                          .map(status => (
                            <button
                              key={status}
                              onClick={() => {
                                if (item.status !== status) {
                                  onStatusUpdate(item.id, status);
                                }
                                setOpenStatusMenuId(null);
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                                item.status === status
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {status === MeasurementStatus.PENDING && <Clock size={14} className="text-amber-600"/>}
                              {status === MeasurementStatus.COMPLETED && <CheckCircle2 size={14} className="text-emerald-600"/>}
                              {status === MeasurementStatus.CANCELLED && <XCircle size={14} className="text-rose-600"/>}
                              {status}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Body */}
              <div className="px-5 py-3 space-y-3 flex-1">
                <div className="flex items-start gap-4">
                  <div className="flex-1 flex items-start gap-3 p-2.5 bg-gray-50/80 rounded-lg border border-gray-100">
                    <User size={16} className="mt-0.5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5 font-medium">Solicitante</p>
                      <p className="text-sm font-semibold text-gray-700 truncate">{item.requesterName}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-start gap-3 p-2.5 bg-gray-50/80 rounded-lg border border-gray-100">
                    <Hash size={16} className="mt-0.5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5 font-medium">Nº Pedido</p>
                      {editingOrderId === item.id && !isLocked ? (
                        <input
                          type="text"
                          value={orderInputValue}
                          onChange={handleOrderChange}
                          onBlur={() => handleOrderSave(item.id)}
                          onKeyDown={(e) => handleOrderKeyDown(e, item.id)}
                          autoFocus
                          className="text-sm font-semibold text-gray-700 bg-white border border-blue-400 rounded px-1 py-0.5 -m-1 w-full outline-none ring-2 ring-blue-200"
                        />
                      ) : (
                        <p
                          onClick={!isLocked ? () => handleOrderClick(item) : undefined}
                          className={`text-sm font-semibold text-gray-700 rounded px-1 py-0.5 -mx-1 min-h-[22px] truncate ${isLocked ? 'cursor-default' : 'cursor-pointer hover:bg-gray-200/50'}`}
                          title={isLocked ? "Destrave o card para editar" : "Clique para editar o nº do pedido"}
                        >
                          {item.orderNumber || <span className="text-gray-400 font-normal italic">Adicionar</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600 pl-1">
                  <Phone size={16} className="text-gray-400 shrink-0" />
                  <span className="font-medium">{item.clientPhone || <span className="text-gray-400">Não informado</span>}</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-gray-600 pl-1">
                  <MapPin size={16} className="mt-1 text-gray-400 shrink-0" />
                  <span className="flex-1 line-clamp-2 leading-relaxed">
                    {item.address.street}, {item.address.number}
                    {item.address.complement && <span className="text-gray-400"> ({item.address.complement})</span>}
                    <br />
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{item.address.district} • {item.address.city}</span>
                  </span>
                  <button
                      onClick={() => onViewMap(fullAddress)}
                      className="self-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver no Mapa"
                    >
                      <MapPin size={20} />
                    </button>
                </div>
              </div>
              
              {item.observations && (
                <div className="px-5 pb-3">
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                      <FileText size={14} /> Observações
                    </h4>
                    <p className="text-sm text-amber-900/80 whitespace-pre-wrap">{item.observations}</p>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-100 flex gap-2 bg-gray-50/30">
                <button
                    onClick={() => toggleLock(item.id)}
                    className={`w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg transition-colors ${
                        isLocked 
                        ? 'text-red-500 hover:bg-red-50 hover:text-red-700' 
                        : 'text-blue-500 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                    title={isLocked ? 'Destravar para editar' : 'Travar card'}
                >
                    {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
                <button 
                    onClick={() => handleShare(item)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors"
                    title="Partilhar Link"
                  >
                    <Link size={16} />
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.')) {
                      onDelete(item.id);
                    }
                  }}
                  disabled={isLocked}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
                <Button 
                  variant="secondary"
                  onClick={() => onEdit(item)}
                  disabled={isLocked}
                  className="flex-1 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  icon={<Edit2 size={16} />}
                >
                  Editar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};