import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Measurement, MeasurementStatus, CommissionItem } from '../types';
import { Button } from './Button';
import { Calculator, Trash2, Printer, Search, FilterX, BadgeCheck, BadgeX, ListFilter } from 'lucide-react';
import { CommissionStatusModal } from './CommissionStatusModal';

interface CommissionsViewProps {
  onShowPrintPreview: (items: CommissionItem[]) => void;
  allMeasurements: Measurement[];
  onCommissionDataChange: (updatedItems: CommissionItem[]) => void;
}

type PaymentStatusFilter = 'all' | 'paid' | 'unpaid';

const removeAccents = (str: string): string => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const toCommissionItem = (m: Measurement): CommissionItem => {
  const commissionRateNum = m.commissionRate ?? 0.5;
  const orderValueNumber = m.orderValue ?? 0;
  const commissionValue = orderValueNumber * (commissionRateNum / 100);
  
  return {
    id: m.id,
    orderNumber: m.orderNumber,
    date: m.date,
    requesterName: m.requesterName,
    status: m.status,
    clientName: m.clientName,
    clientPhone: m.clientPhone,
    address: m.address,
    observations: m.observations,
    commissionPaid: m.commissionPaid,
    orderValue: m.orderValue != null ? String(m.orderValue).replace('.', ',') : '',
    commissionRate: String(commissionRateNum).replace('.', ','),
    commissionValue: commissionValue,
  };
};

const parseNumeric = (val: string | number): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Remove thousand separators (.) and replace comma (,) with a dot for float parsing
    const cleaned = String(val).replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};


export const CommissionsView: React.FC<CommissionsViewProps> = ({ onShowPrintPreview, allMeasurements, onCommissionDataChange }) => {
  const [commissionList, setCommissionList] = useState<CommissionItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>('all');
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<CommissionItem | null>(null);

  useEffect(() => {
    // FIX: Listar todos os "Realizados", mesmo sem nº de pedido, para permitir preenchimento posterior.
    const completedMeasurements = allMeasurements
      .filter(m => m.status === MeasurementStatus.COMPLETED)
      .map(toCommissionItem);
    setCommissionList(completedMeasurements);
  }, [allMeasurements]);

  // Efeito para definir o filtro de data padrão para o mês atual na montagem do componente.
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formatDateForInput = (date: Date): string => {
      return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    };

    setStartDate(formatDateForInput(firstDay));
    setEndDate(formatDateForInput(lastDay));
  }, []); // A dependência vazia [] garante que isso rode apenas uma vez, quando o componente é montado.
  
  const filteredCommissionList = useMemo(() => {
    const normalizedTerm = removeAccents(searchTerm.toLowerCase());
    return commissionList.filter(item => {
      const matchesText =
        removeAccents(item.clientName.toLowerCase()).includes(normalizedTerm) ||
        removeAccents(item.requesterName.toLowerCase()).includes(normalizedTerm) ||
        (item.orderNumber && item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const itemDate = item.date;
      const matchesStart = startDate ? itemDate >= startDate : true;
      const matchesEnd = endDate ? itemDate <= endDate : true;

      const matchesPaymentStatus = (() => {
        if (paymentStatusFilter === 'all') {
          return true;
        }
        if (paymentStatusFilter === 'paid') {
          return item.commissionPaid === true;
        }
        if (paymentStatusFilter === 'unpaid') {
          // Exibe apenas se não estiver pago E se o valor do pedido for maior que zero.
          const hasOrderValue = parseNumeric(item.orderValue) > 0;
          return !item.commissionPaid && hasOrderValue;
        }
        return true; // Default case
      })();

      return matchesText && matchesStart && matchesEnd && matchesPaymentStatus;
    });
  }, [commissionList, searchTerm, startDate, endDate, paymentStatusFilter]);

  const handleUpdateItem = (id: string, field: 'orderValue' | 'commissionRate' | 'orderNumber' | 'clientName', value: string) => {
    let changedItem: CommissionItem | undefined;
    const updatedCommissionList = commissionList.map(item => {
        if (item.id !== id) return item;
        
        // Create the updated item
        let updatedItem = { ...item, [field]: value };

        // Recalculate commission value based on potentially new string values
        const orderVal = parseNumeric(updatedItem.orderValue);
        const rate = parseNumeric(updatedItem.commissionRate);
        updatedItem.commissionValue = orderVal * (rate / 100);
        
        changedItem = updatedItem; // Store the single changed item
        return updatedItem;
    });

    setCommissionList(updatedCommissionList); // Update the local UI state
    
    // Send only the changed item to the parent for DB update
    if (changedItem) {
        onCommissionDataChange([changedItem]);
    }
  };

  const handleCommissionStatusSave = async (isPaid: boolean) => {
    if (!statusUpdateTarget) return;

    const updatedItem = {
        ...statusUpdateTarget,
        commissionPaid: isPaid,
    };
    
    // Passa o item atualizado para o App.tsx que irá atualizar o estado e o DB.
    onCommissionDataChange([updatedItem]);

    // Fecha o modal
    setStatusUpdateTarget(null);
  };
  
  const handleRemoveItem = (id: string) => {
    if(window.confirm("Remover os dados de comissão deste item? O agendamento não será excluído.")) {
        const updatedItem = commissionList.find(item => item.id === id);
        if(updatedItem) {
             const updatedCommissionList = commissionList.filter(item => item.id !== id);
             setCommissionList(updatedCommissionList);
             onCommissionDataChange([{...updatedItem, orderValue: '', commissionRate: ''}]);
        }
    }
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setPaymentStatusFilter('all');
  };
  
  const hasActiveFilters = searchTerm || startDate || endDate || paymentStatusFilter !== 'all';

  const totals = useMemo(() => {
    return filteredCommissionList.reduce((acc, item) => {
      const orderValue = parseNumeric(item.orderValue);
      const commissionValue = item.commissionValue || 0;

      acc.orders += orderValue;
      if (item.commissionPaid) {
        acc.commissionsPaid += commissionValue;
      } else {
        acc.commissionsToPay += commissionValue;
      }
      return acc;
    }, { orders: 0, commissionsToPay: 0, commissionsPaid: 0 });
  }, [filteredCommissionList]);


  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };
  
  const formatCurrencyInput = (value: string): string => {
    if (!value) return '';
    let cleanValue = value.replace(/[^\d,]/g, '');
    const commaCount = (cleanValue.match(/,/g) || []).length;
    if (commaCount > 1) {
       const parts = cleanValue.split(',');
       cleanValue = parts[0] + ',' + parts.slice(1).join('');
    }
    const [integer, decimal] = cleanValue.split(',');
    if (decimal && decimal.length > 2) {
        cleanValue = `${integer},${decimal.substring(0, 2)}`;
    }
    return cleanValue;
  };
  
  const formatRateInput = (value: string): string => {
    if (!value) return '';
    let cleanValue = value.replace(/[^\d,]/g, '');
    const commaCount = (cleanValue.match(/,/g) || []).length;
    if (commaCount > 1) {
        const parts = cleanValue.split(',');
        cleanValue = parts[0] + ',' + parts.slice(1).join('');
    }
    return cleanValue;
  };

  return (
    <>
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calculator className="text-emerald-600" /> Controle de Comissões
            </h2>
            <p className="text-gray-500 text-sm mt-1">Gerencie valores e calcule comissões. Use os filtros para refinar a lista.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => onShowPrintPreview(filteredCommissionList)} variant="primary" icon={<Printer size={18} />} disabled={filteredCommissionList.length === 0}>Imprimir Relatório</Button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                <div className="lg:col-span-6 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400 group-focus-within:text-emerald-500" /></div>
                    <input type="text" className="block w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" placeholder="Buscar por cliente, solicitante, pedido..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="lg:col-span-5 flex gap-2">
                    <input type="date" className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <input type="date" className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="lg:col-span-1"><button onClick={clearFilters} disabled={!hasActiveFilters} className={`w-full h-full flex items-center justify-center rounded-lg border ${ hasActiveFilters ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`} title="Limpar Filtros"><FilterX size={18} /></button></div>
            </div>
            <div className="flex items-center pt-3 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-500 mr-3">Status Pagamento:</span>
                <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                    <FilterButton active={paymentStatusFilter === 'all'} onClick={() => setPaymentStatusFilter('all')} icon={<ListFilter size={14}/>}>Todos</FilterButton>
                    <FilterButton active={paymentStatusFilter === 'unpaid'} onClick={() => setPaymentStatusFilter('unpaid')} icon={<BadgeX size={14}/>}>A Pagar</FilterButton>
                    <FilterButton active={paymentStatusFilter === 'paid'} onClick={() => setPaymentStatusFilter('paid')} icon={<BadgeCheck size={14}/>}>Pago</FilterButton>
                </div>
            </div>
        </div>

        {filteredCommissionList.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-4 border-t border-gray-100">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Pedidos</p><p className="text-2xl font-bold text-gray-800">{formatCurrency(totals.orders)}</p></div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200"><p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Comissões a Pagar</p><p className="text-2xl font-bold text-amber-700">{formatCurrency(totals.commissionsToPay)}</p></div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200"><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Comissões Pagas</p><p className="text-2xl font-bold text-emerald-700">{formatCurrency(totals.commissionsPaid)}</p></div>
          </div>
        )}
      </div>
      
      {filteredCommissionList.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-700">Detalhamento Financeiro ({filteredCommissionList.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap w-32">Data / Pedido</th>
                  <th className="px-4 py-3">Cliente / Solicitante</th>
                  <th className="px-4 py-3 w-32">Valor Pedido (R$)</th>
                  <th className="px-4 py-3 w-24">Comissão (%)</th>
                  <th className="px-4 py-3 w-32 text-right">Valor Comissão</th>
                  <th className="px-4 py-3 w-28 text-center">Status</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCommissionList.map((item) => {
                  const hasOrderValue = parseNumeric(item.orderValue) > 0;
                  return (
                  <tr key={item.id} className="transition-colors group hover:bg-gray-50/50">
                    <td className="px-4 py-3 align-middle"><div className="font-medium text-gray-900 mb-1">{new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div><input type="text" className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white font-mono" placeholder="Nº Pedido" value={item.orderNumber || ''} onChange={(e) => handleUpdateItem(item.id, 'orderNumber', e.target.value)} /></td>
                    <td className="px-4 py-3 align-middle"><div className="mb-1"><input type="text" className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-900 placeholder-gray-400" value={item.clientName} placeholder="Nome do Cliente" onChange={(e) => handleUpdateItem(item.id, 'clientName', e.target.value)} /></div><div className="text-xs text-blue-600 truncate max-w-[200px] px-2" title={item.requesterName}>{item.requesterName}</div></td>
                    <td className="px-4 py-3 align-middle"><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span><input type="text" className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-right font-medium placeholder:text-gray-300" placeholder="0,00" value={item.orderValue} onChange={(e) => handleUpdateItem(item.id, 'orderValue', formatCurrencyInput(e.target.value))} /></div></td>
                    <td className="px-4 py-3 align-middle"><div className="relative"><input type="text" className="w-full pl-2 pr-5 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-center" value={item.commissionRate} onChange={(e) => handleUpdateItem(item.id, 'commissionRate', formatRateInput(e.target.value))} /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span></div></td>
                    <td className={`px-4 py-3 align-middle text-right font-bold ${item.commissionPaid ? 'text-gray-500 line-through' : 'text-emerald-700'}`}>{formatCurrency(item.commissionValue)}</td>
                    <td className="px-4 py-3 align-middle text-center">
                      {hasOrderValue ? (
                        <button 
                          onClick={() => setStatusUpdateTarget(item)} 
                          className="inline-flex transition-transform hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 rounded-full" 
                          title="Clique para alterar o status do pagamento"
                        >
                          {item.commissionPaid 
                              ? <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border-emerald-200 px-2 py-0.5 rounded-full text-xs font-medium"><BadgeCheck size={12}/> Pago</span>
                              : <span className="flex items-center gap-1.5 bg-amber-100 text-amber-800 border-amber-200 px-2 py-0.5 rounded-full text-xs font-medium"><BadgeX size={12}/> A Pagar</span>
                          }
                        </button>
                      ) : (
                        <span 
                          className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full text-xs font-medium"
                          title="Preencha o Valor do Pedido para definir o status"
                        >
                          Pedido não fechado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-right"><button onClick={() => handleRemoveItem(item.id)} className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded" title="Remover dados da comissão"><Trash2 size={16} /></button></td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Calculator className="text-gray-400" size={24} /></div>
          <h3 className="text-lg font-medium text-gray-900">Nenhum item para comissão</h3>
           <p className="text-gray-500 mt-1 max-w-sm mx-auto">{hasActiveFilters ? "Nenhum resultado encontrado para os filtros." : "Agendamentos com status 'Realizado' aparecerão aqui."}</p>
        </div>
      )}
    </div>
    {statusUpdateTarget && (
        <CommissionStatusModal 
            item={statusUpdateTarget}
            onClose={() => setStatusUpdateTarget(null)}
            onSave={handleCommissionStatusSave}
        />
    )}
    </>
  );
};


const FilterButton: React.FC<{active: boolean, onClick: () => void, children: React.ReactNode, icon: React.ReactNode}> = ({ active, onClick, children, icon }) => {
    const baseStyle = "px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-1.5 transition-colors";
    const activeStyle = "bg-white text-emerald-600 shadow-sm";
    const inactiveStyle = "text-gray-500 hover:text-gray-800";
    return (
        <button onClick={onClick} className={`${baseStyle} ${active ? activeStyle : inactiveStyle}`}>
            {icon} {children}
        </button>
    )
}