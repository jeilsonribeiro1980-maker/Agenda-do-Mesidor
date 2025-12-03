import React, { useState, useEffect } from 'react';
import { Measurement, MeasurementStatus } from '../types';
import { InputField } from './InputField';
import { Button } from './Button';
import { Save, X, User, MapPin, Calendar, FileText, DollarSign, ChevronDown, BadgeCheck, BadgeX } from 'lucide-react';

interface MeasurementFormProps {
  initialData?: Measurement;
  initialDate?: string;
  onSave: (data: Omit<Measurement, 'id'>) => void;
  onCancel: () => void;
}

export const MeasurementForm: React.FC<MeasurementFormProps> = ({ initialData, initialDate, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: initialDate || new Date().toISOString().split('T')[0],
    orderNumber: '',
    requesterName: '',
    status: MeasurementStatus.PENDING,
    clientName: '',
    clientPhone: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    observations: '',
    orderValue: '',
    commissionRate: '',
    commissionPaid: false,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showFinancial, setShowFinancial] = useState(false);
  const [initialStateString, setInitialStateString] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    let stateToStore: any;
    if (initialData) {
      const initialFormState = {
        date: initialData.date,
        orderNumber: initialData.orderNumber || '',
        requesterName: initialData.requesterName,
        status: initialData.status,
        clientName: initialData.clientName,
        clientPhone: initialData.clientPhone,
        street: initialData.address.street,
        number: initialData.address.number,
        complement: initialData.address.complement || '',
        district: initialData.address.district,
        city: initialData.address.city,
        observations: initialData.observations || '',
        orderValue: initialData.orderValue != null ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(initialData.orderValue) : '',
        commissionRate: initialData.commissionRate != null ? String(initialData.commissionRate).replace('.', ',') : '',
        commissionPaid: initialData.commissionPaid || false,
      };
      setFormData(initialFormState);
      stateToStore = initialFormState;
      if (initialData.orderValue || initialData.commissionRate || initialData.status === MeasurementStatus.COMPLETED) {
        setShowFinancial(true);
      }
    } else if (initialDate) {
      const newFormData = { ...formData, date: initialDate };
      setFormData(newFormData);
      stateToStore = newFormData;
    } else {
      stateToStore = formData;
    }
    setInitialStateString(JSON.stringify(stateToStore));
  }, [initialData, initialDate]);

  useEffect(() => {
    if (initialStateString) {
      const currentStateString = JSON.stringify(formData);
      setHasChanges(currentStateString !== initialStateString);
    }
  }, [formData, initialStateString]);

  const formatPhoneNumber = (value: string): string => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 3) return `(${phoneNumber}`;
    if (phoneNumberLength < 8) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'clientPhone') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Mantém apenas os dígitos
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly === '') {
        setFormData(prev => ({ ...prev, [name]: '' }));
        return;
    }

    // Converte a string de dígitos para um número (ex: '125000' -> 1250.00)
    const numberValue = Number(digitsOnly) / 100;

    // Formata o número para uma string de moeda BRL (ex: 1250 -> "1.250,00")
    const formattedValue = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };


  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // 1. Remove caracteres inválidos (permite apenas dígitos e vírgula)
    let cleanValue = value.replace(/[^\d,]/g, '');

    // 2. Garante que haja apenas uma vírgula
    const parts = cleanValue.split(',');
    if (parts.length > 2) {
      cleanValue = `${parts[0]},${parts.slice(1).join('')}`;
    }
    
    // 3. Limita a duas casas decimais
    const finalParts = cleanValue.split(',');
    if (finalParts.length === 2) {
      finalParts[1] = finalParts[1].substring(0, 2);
      cleanValue = finalParts.join(',');
    }

    setFormData(prev => ({...prev, [name]: cleanValue}));
  };

  const handlePaymentStatusChange = (isPaid: boolean) => {
    if (isPaid) {
        // Validação: Só permite marcar como Pago se houver valor no pedido
        if (!formData.orderValue || formData.orderValue.trim() === '') {
            alert("Informe o Valor do Pedido antes de alterar o status para Pago.");
            return;
        }
    }
    setFormData(prev => ({ ...prev, commissionPaid: isPaid }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Basic validation example
    if (!formData.requesterName || !formData.clientName || !formData.street || !formData.city) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      setIsSaving(false);
      return;
    }

    const parseNumeric = (val: string | number | null | undefined): number | null => {
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'number') return val;
        const cleaned = val.replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
    };

    const dataToSave = {
      date: formData.date,
      orderNumber: formData.orderNumber || undefined,
      requesterName: formData.requesterName,
      status: formData.status,
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      address: {
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        district: formData.district,
        city: formData.city,
      },
      observations: formData.observations,
      orderValue: parseNumeric(formData.orderValue),
      commissionRate: parseNumeric(formData.commissionRate),
      commissionPaid: formData.commissionPaid,
    };

    onSave(dataToSave as Omit<Measurement, 'id'>);
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm("Você possui alterações não salvas. Deseja realmente sair e descartá-las?")) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
        
        {/* Section: Main Info */}
        <Section title="Dados Gerais" icon={<Calendar size={20}/>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <InputField label="Data" type="date" name="date" value={formData.date} onChange={handleChange} required />
             <InputField label="Nº do Pedido (Opcional)" name="orderNumber" value={formData.orderNumber} onChange={handleChange} placeholder="Ex: 12345" />
             <InputField label="Solicitante" name="requesterName" value={formData.requesterName} onChange={handleChange} placeholder="Nome do vendedor" required />
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full mt-1.5 px-4 py-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                {Object.values(MeasurementStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>
        
        {/* Section: Client Info */}
        <Section title="Dados do Cliente" icon={<User size={20}/>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Nome do Cliente" name="clientName" value={formData.clientName} onChange={handleChange} required placeholder="Nome completo" />
            <InputField label="Telefone" name="clientPhone" value={formData.clientPhone} onChange={handleChange} placeholder="(00) 00000-0000" maxLength={15} />
          </div>
        </Section>

        {/* Section: Address */}
        <Section title="Endereço da Obra" icon={<MapPin size={20}/>}>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2"><InputField label="Rua / Avenida" name="street" value={formData.street} onChange={handleChange} required /></div>
              <InputField label="Número" name="number" value={formData.number} onChange={handleChange} required />
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <InputField label="Complemento (Opcional)" name="complement" value={formData.complement} onChange={handleChange} placeholder="Apto, Bloco, etc." />
             <InputField label="Bairro" name="district" value={formData.district} onChange={handleChange} required />
             <InputField label="Cidade" name="city" value={formData.city} onChange={handleChange} required />
           </div>
        </Section>
        
        {/* Section: Observations */}
        <Section title="Observações" icon={<FileText size={20}/>}>
            <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
                placeholder="Ex: Medição urgente, cliente aguardando na obra, levar amostras..."
            ></textarea>
        </Section>
        
        {/* Section: Financial Data */}
        <div className="border-t border-gray-200 pt-6">
            <button type="button" onClick={() => setShowFinancial(!showFinancial)} className="flex justify-between items-center w-full text-left">
                <Section title="Dados Financeiros (Opcional)" icon={<DollarSign size={20}/>} asHeader={false} />
                <ChevronDown size={20} className={`text-gray-500 transition-transform ${showFinancial ? 'rotate-180' : ''}`} />
            </button>
            {showFinancial && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                        <InputField label="Valor do Pedido" name="orderValue" value={formData.orderValue} onChange={handleCurrencyChange} placeholder="1.250,00" className="pl-8 text-right"/>
                    </div>
                     <div className="relative">
                        <InputField label="Taxa de Comissão" name="commissionRate" value={formData.commissionRate} onChange={handleNumericChange} placeholder="0,5" className="pr-6 text-center" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-sm font-medium text-gray-700 block mb-2">Status do Pagamento</label>
                        <div className="flex gap-3">
                            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors w-full justify-center font-medium ${!formData.commissionPaid ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-200' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="commissionPaid"
                                    checked={!formData.commissionPaid}
                                    onChange={() => handlePaymentStatusChange(false)}
                                    className="hidden"
                                />
                                <BadgeX size={16} /> A Pagar
                            </label>
                            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors w-full justify-center font-medium ${formData.commissionPaid ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-200' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="commissionPaid"
                                    checked={formData.commissionPaid}
                                    onChange={() => handlePaymentStatusChange(true)}
                                    className="hidden"
                                />
                                <BadgeCheck size={16} /> Pago
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>


        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={handleCancel} icon={<X size={16}/>}>Cancelar</Button>
          <Button 
            type="submit" 
            isLoading={isSaving} 
            icon={<Save size={16}/>}
            disabled={isSaving || (!!initialData && !hasChanges)}
            title={!!initialData && !hasChanges ? 'Nenhuma alteração foi feita' : ''}
          >
            {initialData ? 'Salvar Alterações' : 'Criar Agendamento'}
          </Button>
        </div>
      </form>
    </div>
  );
};

const Section: React.FC<{title: string, icon: React.ReactNode, children?: React.ReactNode, asHeader?: boolean}> = ({ title, icon, children, asHeader = true }) => (
    <div className="space-y-4">
        {asHeader && (
            <h3 className="font-bold text-lg text-gray-700 flex items-center gap-2 pb-2 border-b border-gray-200">
                <span className="text-blue-600">{icon}</span>
                {title}
            </h3>
        )}
        {!asHeader && (
             <h3 className="font-bold text-lg text-gray-700 flex items-center gap-2">
                <span className="text-blue-600">{icon}</span>
                {title}
            </h3>
        )}
        {children}
    </div>
);