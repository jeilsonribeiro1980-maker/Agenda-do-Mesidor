import React, { useState, useMemo, useEffect } from 'react';
import { CommissionItem } from '../types';
import { Button } from './Button';
import { Printer, ArrowLeft, Filter, FilterX, LayoutTemplate } from 'lucide-react';

interface PrintableCommissionsProps {
  items: CommissionItem[];
  onBack: () => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

const parseOrderValue = (orderValue: number | string): number => {
    if (typeof orderValue === 'number') return orderValue;
    if (orderValue === '') return 0;
    const cleanedString = String(orderValue).replace(/\./g, '').replace(',', '.');
    const value = parseFloat(cleanedString);
    return isNaN(value) ? 0 : value;
};


export const PrintableCommissions: React.FC<PrintableCommissionsProps> = ({ items, onBack }) => {
  
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  // Sincroniza o estado inicial do filtro com as datas dos itens, se houver
  useEffect(() => {
    if (items.length > 0) {
      const dates = items.map(item => item.date);
      const minDate = dates.reduce((a, b) => a < b ? a : b);
      const maxDate = dates.reduce((a, b) => a > b ? a : b);
      setAppliedStartDate(minDate);
      setAppliedEndDate(maxDate);
    }
  }, [items]);


  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const itemDate = item.date;
      const matchesStart = appliedStartDate ? itemDate >= appliedStartDate : true;
      const matchesEnd = appliedEndDate ? itemDate <= appliedEndDate : true;
      return matchesStart && matchesEnd;
    });
  }, [items, appliedStartDate, appliedEndDate]);

  const totals = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const orderValue = parseOrderValue(item.orderValue);
      const commissionValue = item.commissionValue || 0;
      acc.orders += orderValue;
      if (item.commissionPaid) {
          acc.commissionsPaid += commissionValue;
      } else {
          acc.commissionsToPay += commissionValue;
      }
      return acc;
    }, { orders: 0, commissionsToPay: 0, commissionsPaid: 0 });
  }, [filteredItems]);


  const handlePrint = () => {
    window.print();
  };
  
  const getPeriodText = () => {
    if (!appliedStartDate && !appliedEndDate) return "Todos os períodos";
    if (appliedStartDate && !appliedEndDate) return `A partir de ${formatDate(appliedStartDate)}`;
    if (!appliedStartDate && appliedEndDate) return `Até ${formatDate(appliedEndDate)}`;
    if (appliedStartDate === appliedEndDate) return formatDate(appliedStartDate);
    return `${formatDate(appliedStartDate)} a ${formatDate(appliedEndDate)}`;
  };

  return (
    <div className="bg-gray-100 min-h-screen animate-in fade-in print:bg-white">
      {/* Controls Header - Sticky and non-printable */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={onBack} icon={<ArrowLeft size={16} />}>Voltar</Button>
            <div>
                <h2 className="text-lg font-bold text-gray-800">Impressão de Relatório</h2>
                <p className="text-xs text-gray-500">{filteredItems.length} itens no período selecionado</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <input type="date" value={appliedStartDate} onChange={(e) => setAppliedStartDate(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-md text-sm w-full" />
             <span className="text-gray-500 text-sm">a</span>
             <input type="date" value={appliedEndDate} onChange={(e) => setAppliedEndDate(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-md text-sm w-full" />
             <Button onClick={handlePrint} icon={<Printer size={16} />} className="w-full sm:w-auto">Imprimir</Button>
          </div>
        </div>
      </header>

      {/* A4 Landscape Preview Area */}
       <main className="py-8 px-4 print:p-0 print:m-0">
            <div id="printable-area" className="bg-white max-w-[297mm] min-h-[200mm] mx-auto shadow-lg p-10 print:shadow-none print:p-0">
                {/* Report Header */}
                <section className="flex justify-between items-center pb-6 print:pb-2 border-b-2 border-gray-400 print:border-b-2 print:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 text-white p-3 rounded-lg print:bg-gray-800">
                            <LayoutTemplate size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Relatório de Comissões</h1>
                            <p className="text-gray-500">Agenda do Medidor</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-gray-700">{getPeriodText()}</p>
                        <p className="text-xs text-gray-500">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                    </div>
                </section>
                
                {/* Table */}
                <section className="mt-8 print:mt-2">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="p-2 text-left font-bold text-gray-600 uppercase tracking-wider w-24">Data</th>
                                <th className="p-2 text-left font-bold text-gray-600 uppercase tracking-wider w-24">Pedido</th>
                                <th className="p-2 text-left font-bold text-gray-600 uppercase tracking-wider">Cliente</th>
                                <th className="p-2 text-left font-bold text-gray-600 uppercase tracking-wider">Solicitante</th>
                                <th className="p-2 text-right font-bold text-gray-600 uppercase tracking-wider w-36">Valor Pedido</th>
                                <th className="p-2 text-center font-bold text-gray-600 uppercase tracking-wider w-20">%</th>
                                <th className="p-2 text-right font-bold text-gray-600 uppercase tracking-wider w-36">Valor Comissão</th>
                                <th className="p-2 text-center font-bold text-gray-600 uppercase tracking-wider w-28">Status Pgto.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length > 0 ? filteredItems.map((item) => (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="p-3 whitespace-nowrap">{formatDate(item.date)}</td>
                                    <td className="p-3 text-gray-600 font-mono text-xs">{item.orderNumber || '-'}</td>
                                    <td className="p-3 font-medium text-gray-800">{item.clientName}</td>
                                    <td className="p-3 text-gray-500">{item.requesterName}</td>
                                    <td className="p-3 text-right font-mono">{formatCurrency(parseOrderValue(item.orderValue))}</td>
                                    <td className="p-3 text-center text-gray-500 font-mono">{String(item.commissionRate).replace('.', ',')}%</td>
                                    <td className="p-3 text-right font-semibold text-emerald-700 font-mono">{formatCurrency(item.commissionValue)}</td>
                                    <td className={`p-3 text-center font-semibold ${item.commissionPaid ? 'text-gray-500' : 'text-amber-600'}`}>
                                    {item.commissionPaid ? 'Pago' : 'A Pagar'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                <td colSpan={8} className="text-center p-16 text-gray-500 bg-gray-50">
                                    <h3 className="text-lg font-medium">Nenhum item encontrado</h3>
                                    <p>Não há dados para o período selecionado.</p>
                                </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
                
                {/* Totals Footer */}
                {filteredItems.length > 0 && (
                    <section className="mt-8 pt-6 print:mt-2 print:pt-2 border-t-2 border-gray-400 print:border-t-2 print:border-gray-800">
                        <div className="flex justify-end">
                        <div className="w-full max-w-sm space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-600">Total de Pedidos:</span>
                                <span className="font-mono font-semibold text-gray-800">{formatCurrency(totals.orders)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="font-semibold text-amber-700">Comissões a Pagar:</span>
                                <span className="font-mono font-semibold text-amber-700">{formatCurrency(totals.commissionsToPay)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-emerald-700">Comissões Pagas:</span>
                                <span className="font-mono font-semibold text-emerald-700">{formatCurrency(totals.commissionsPaid)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2 text-base">
                                <span className="font-bold text-gray-800">Total Geral de Comissões:</span>
                                <span className="font-mono font-bold text-gray-900">{formatCurrency(totals.commissionsToPay + totals.commissionsPaid)}</span>
                            </div>
                        </div>
                        </div>
                    </section>
                )}

                 {/* Report Footer */}
                <footer className="text-center text-xs text-gray-400 pt-10 mt-10 border-t border-gray-200 print:pt-1 print:mt-2">
                    Relatório gerado pelo sistema Agenda do Medidor
                </footer>
            </div>
       </main>
    </div>
  );
};