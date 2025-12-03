import React, { useState, useEffect, useMemo } from 'react';
import { Measurement, MeasurementStatus, CommissionItem, User, Address } from './types';
import { MeasurementForm } from './components/MeasurementForm';
import { MeasurementList } from './components/MeasurementList';
import { CommissionsView } from './components/CommissionsView';
import { PrintableCommissions } from './components/PrintableCommissions';
import { MapView } from './components/MapView';
import { CalendarView } from './components/CalendarView';
import { SharedItemView } from './components/SharedItemView';
import { SplashScreen } from './SplashScreen';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { SupabaseConfigErrorView } from './components/SupabaseConfigErrorView';
import { Button } from './components/Button';
import { Toast } from './components/Toast';
import { authService } from './services/authService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import { Plus, LayoutTemplate, Clock, CheckCircle2, ListFilter, Search, Calendar as CalendarIcon, FilterX, DollarSign, LayoutList, LogOut, Loader2, Home, AlertTriangle, ChevronUp, ChevronDown, ListChecks } from 'lucide-react';

type View = 'dashboard' | 'agenda' | 'form' | 'commissions' | 'print-preview';
type ToastState = { message: string, type: 'success' | 'error' } | null;

// Helper functions to map Supabase DB (snake_case) to App types (camelCase)
const mapToMeasurement = (data: any): Measurement => ({
  id: data.id,
  orderNumber: data.order_number,
  date: data.date,
  requesterName: data.requester_name,
  status: data.status as MeasurementStatus,
  clientName: data.client_name,
  clientPhone: data.client_phone,
  address: data.address || { street: '', number: '', district: '', city: '' },
  observations: data.observations,
  orderValue: data.order_value,
  commissionRate: data.commission_rate,
  commissionPaid: data.commission_paid,
});

const mapToDb = (data: Partial<Omit<Measurement, 'id'>> & { user_id?: string }) => {
  const dbData: { [key: string]: any } = {};
  if (data.orderNumber !== undefined) dbData.order_number = data.orderNumber;
  if (data.date !== undefined) dbData.date = data.date;
  if (data.requesterName !== undefined) dbData.requester_name = data.requesterName;
  if (data.status !== undefined) dbData.status = data.status;
  if (data.clientName !== undefined) dbData.client_name = data.clientName;
  if (data.clientPhone !== undefined) dbData.client_phone = data.clientPhone;
  if (data.address !== undefined) dbData.address = data.address;
  if (data.observations !== undefined) dbData.observations = data.observations;
  if (data.orderValue !== undefined) dbData.order_value = data.orderValue;
  if (data.commissionRate !== undefined) dbData.commission_rate = data.commissionRate;
  if (data.commissionPaid !== undefined) dbData.commission_paid = data.commissionPaid;
  if (data.user_id !== undefined) dbData.user_id = data.user_id;
  return dbData;
};

const removeAccents = (str: string): string => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const NavButton: React.FC<{active: boolean, onClick: () => void, children: React.ReactNode, icon: React.ReactNode, mobile?: boolean}> = ({ active, onClick, children, icon, mobile }) => {
    if (mobile) {
        return (
            <button onClick={onClick} className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors w-full ${active ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
                {icon}
                <span>{children}</span>
            </button>
        )
    }
    const baseStyle = "flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors";
    const activeStyle = "bg-blue-100/60 text-blue-700";
    const inactiveStyle = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
    return (
        <button onClick={onClick} className={`${baseStyle} ${active ? activeStyle : inactiveStyle}`}>
            {icon} {children}
        </button>
    )
}

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | undefined>(undefined);
  const [mapAddress, setMapAddress] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showList, setShowList] = useState(false); // Default to collapsed list
  const [agendaView, setAgendaView] = useState<'list' | 'calendar'>('list');
  const [toast, setToast] = useState<ToastState>(null);
  const [sharedItem, setSharedItem] = useState<Measurement | null>(null);
  const [printItems, setPrintItems] = useState<CommissionItem[] | null>(null);
  const [dateForNew, setDateForNew] = useState<string | undefined>(undefined);
  
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleApiError = (error: unknown, context: string) => {
    // 1. Log detailed error to console properly. 
    // JSON.stringify helps avoid [object Object] in environments where console.error stringifies arguments directly.
    try {
        console.error(`[handleApiError] Context: ${context}`, JSON.stringify(error, null, 2));
    } catch (e) {
        console.error(`[handleApiError] Context: ${context}`, error);
    }

    let detailMessage = 'Ocorreu um erro desconhecido.';

    if (error instanceof Error) {
        detailMessage = error.message;
    } else if (typeof error === 'string') {
        detailMessage = error;
    } else if (typeof error === 'object' && error !== null) {
        const anyErr = error as any;
        // Handle Supabase/Postgrest error format
        const message = anyErr.message || anyErr.msg || anyErr.error_description;
        const details = anyErr.details;
        const hint = anyErr.hint;
        const code = anyErr.code; // Postgrest error code
        
        if (message) {
            detailMessage = typeof message === 'string' ? message : JSON.stringify(message);
            if (details) detailMessage += ` (${details})`;
            if (hint) detailMessage += ` - Dica: ${hint}`;
        } else if (code) {
             detailMessage = `Erro código: ${code}`;
        } else {
             // Fallback for generic objects
             try {
                const str = JSON.stringify(error);
                if (str !== '{}') detailMessage = str;
             } catch (e) {
                detailMessage = 'Erro não serializável';
             }
        }
    }

    // 2. User friendly translation
    const lowerCaseMessage = detailMessage.toLowerCase();
    let userFriendlyMessage = detailMessage;

    if (lowerCaseMessage.includes('violates row-level security policy')) {
        userFriendlyMessage = 'Você não tem permissão para realizar esta ação. Verifique as políticas de segurança (RLS) do Supabase.';
    } else if (lowerCaseMessage.includes('violates foreign key constraint')) {
        userFriendlyMessage = 'Não foi possível realizar a operação devido a dados relacionados.';
    } else if (lowerCaseMessage.includes('violates unique constraint') || lowerCaseMessage.includes('duplicate key value')) {
        userFriendlyMessage = 'Já existe um registro com estes dados. Verifique se há duplicatas.';
    } else if (lowerCaseMessage.includes('check constraint')) {
        userFriendlyMessage = 'Os dados fornecidos são inválidos. Por favor, verifique os campos.';
    } else if (lowerCaseMessage.includes('network error') || lowerCaseMessage.includes('failed to fetch')) {
        userFriendlyMessage = 'Falha de conexão. Verifique sua internet e tente novamente.';
    } else if (lowerCaseMessage.includes('invalid login credentials')) {
        userFriendlyMessage = 'E-mail ou senha inválidos.';
    } else if (lowerCaseMessage.includes('jwt expired')) {
        userFriendlyMessage = 'Sua sessão expirou. Faça login novamente.';
    } else if (lowerCaseMessage.includes('relation "measurements" does not exist') || lowerCaseMessage.includes('42p01')) {
        userFriendlyMessage = 'A tabela do banco de dados não foi encontrada. Execute o script SQL de configuração.';
    }

    showToast(`Erro ao ${context}: ${userFriendlyMessage}`, 'error');
  };

  const fetchMeasurements = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setMeasurements(data.map(mapToMeasurement));
    } catch (error) {
      handleApiError(error, 'carregar os agendamentos');
    }
  };

  const handleSession = async () => {
    const sessionUser = await authService.getSessionUser();
    if (sessionUser) {
      setUser(sessionUser);
    }
    setTimeout(() => setIsLoading(false), 1500); // Simulate loading and show splash
  };
  
  // Check for shared item in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const measurementId = urlParams.get('measurementId');

    if (measurementId && isSupabaseConfigured()) {
      const fetchSharedItem = async () => {
        try {
          const { data, error } = await supabase
            .from('measurements')
            .select('*')
            .eq('id', measurementId)
            .single();
          if (error) throw error;
          if (data) {
            setSharedItem(mapToMeasurement(data));
          }
        } catch (err) {
          console.error('Error fetching shared item:', err);
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
      };
      fetchSharedItem();
    } else {
      handleSession();
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMeasurements();
    }
  }, [user]);
  
  useInactivityTimer(() => {
    if (user) {
      handleLogout("Sessão expirada por inatividade.");
    }
  });

  const handleSave = async (data: Omit<Measurement, 'id'>) => {
    try {
      if (editingMeasurement) {
        // Update
        const { error } = await supabase
          .from('measurements')
          .update(mapToDb(data))
          .eq('id', editingMeasurement.id);
        if (error) throw error;
        showToast('Agendamento atualizado com sucesso!', 'success');
      } else {
        // Create
        if (!user) {
          throw new Error("Usuário não está logado, não é possível salvar.");
        }
        const dataToInsert = { ...data, user_id: user.id };
        const { error } = await supabase
          .from('measurements')
          .insert([mapToDb(dataToInsert)]);
        if (error) throw error;
        showToast('Agendamento criado com sucesso!', 'success');
      }
      await fetchMeasurements();
      setView('agenda');
      setEditingMeasurement(undefined);
      setDateForNew(undefined);
    } catch (error) {
      handleApiError(error, editingMeasurement ? 'atualizar o agendamento' : 'criar o agendamento');
    }
  };
  
  const handlePartialUpdate = async (id: string, data: Partial<Measurement>) => {
    try {
        const { error } = await supabase
            .from('measurements')
            .update(mapToDb(data))
            .eq('id', id);
        if (error) throw error;
        
        setMeasurements(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
        showToast('Nº do pedido atualizado.', 'success');
    } catch (error) {
        handleApiError(error, 'atualizar o nº do pedido');
    }
  };

  const handleCommissionDataChange = async (updatedItems: CommissionItem[]) => {
    try {
        const updates = updatedItems.map(item => {
            const parseNumeric = (val: string | number | null | undefined): number | null => {
                if (val === null || val === undefined || val === '') return null;
                if (typeof val === 'number') return val;
                const cleaned = val.replace(/\./g, '').replace(',', '.');
                const num = parseFloat(cleaned);
                return isNaN(num) ? null : num;
            };
            return supabase.from('measurements').update({
                order_value: parseNumeric(item.orderValue),
                commission_rate: parseNumeric(item.commissionRate),
                order_number: item.orderNumber,
                client_name: item.clientName,
                commission_paid: item.commissionPaid,
            }).eq('id', item.id);
        });
        
        const results = await Promise.all(updates);
        const firstError = results.find(res => res.error);
        if (firstError) throw firstError.error;

        await fetchMeasurements(); // Recarrega todos os dados para garantir consistência
        showToast('Dados de comissão salvos!', 'success');
    } catch (error) {
        handleApiError(error, 'salvar os dados de comissão');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('measurements')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchMeasurements();
      showToast('Agendamento excluído com sucesso!', 'success');
    } catch (error) {
      handleApiError(error, 'excluir o agendamento');
    }
  };

  const handleEdit = (measurement: Measurement) => {
    setEditingMeasurement(measurement);
    setView('form');
  };

  const handleAddNew = () => {
    setEditingMeasurement(undefined);
    setDateForNew(undefined);
    setView('form');
  };
  
  const handleAddNewWithDate = (date: string) => {
    setEditingMeasurement(undefined);
    setDateForNew(date);
    setView('form');
  }

  const handleCancelForm = () => {
    setEditingMeasurement(undefined);
    setDateForNew(undefined);
    setView(view === 'dashboard' ? 'dashboard' : 'agenda'); // Go back to where you came from
  };

  const handleViewMap = (address: string) => setMapAddress(address);

  const handleStatusUpdate = async (id: string, newStatus: MeasurementStatus) => {
    try {
      const { error } = await supabase
        .from('measurements')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      
      setMeasurements(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
      showToast('Status atualizado com sucesso!', 'success');
    } catch (error) {
       handleApiError(error, 'atualizar o status');
    }
  };
  
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };
  
  const handleLogout = async (message: string = "Você saiu da sua conta.") => {
    await authService.logout();
    setUser(null);
    setView('dashboard'); // Reset view
    showToast(message, 'success');
  };

  const handleShowPrintPreview = (items: CommissionItem[]) => {
    setPrintItems(items);
    setView('print-preview');
  };
  
  const handleStatCardClick = (targetView: View, filters: { status?: string } = {}) => {
    if (filters.status) {
      setStatusFilter(filters.status);
    } else {
      // Reseta o filtro se não for especificado (ex: ao ir para comissões)
      setStatusFilter('all');
    }
    setSearchTerm(''); // Limpa a busca ao navegar
    setView(targetView);
  };

  const filteredMeasurements = useMemo(() => {
    const normalizedTerm = removeAccents(searchTerm.toLowerCase());
    return measurements.filter(m => {
      const matchesSearch =
        removeAccents(m.clientName.toLowerCase()).includes(normalizedTerm) ||
        removeAccents(m.requesterName.toLowerCase()).includes(normalizedTerm) ||
        (m.orderNumber && m.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [measurements, searchTerm, statusFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };
  
  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

  const renderContent = () => {
    if (view === 'print-preview' && printItems) {
      return <PrintableCommissions items={printItems} onBack={() => { setView('commissions'); setPrintItems(null); }} />;
    }
    
    switch (view) {
      case 'dashboard':
        return <DashboardView user={user!} measurements={measurements} onAddNew={handleAddNew} onStatCardClick={handleStatCardClick} onEdit={handleEdit} />;
      case 'agenda':
        return (
          <div className="space-y-6">
            {/* Header and Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><LayoutList /> Agenda de Medições</h2>
                  <p className="text-gray-500 text-sm mt-1">Filtre e visualize os agendamentos por lista ou calendário.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
                  <input type="text" className="block w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" placeholder="Buscar por cliente, solicitante..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="all">Todos os Status</option>
                  <option value={MeasurementStatus.PENDING}>Pendente</option>
                  <option value={MeasurementStatus.COMPLETED}>Realizado</option>
                  <option value={MeasurementStatus.CANCELLED}>Cancelado</option>
                </select>
                 {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 bg-red-50 hover:bg-red-100" icon={<FilterX size={14}/>}>
                      Limpar
                    </Button>
                  )}
              </div>

               {/* View toggler */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                      <button onClick={() => setAgendaView('list')} className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-1.5 transition-colors ${agendaView === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                          <LayoutList size={14}/> Lista
                      </button>
                       <button onClick={() => setAgendaView('calendar')} className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-1.5 transition-colors ${agendaView === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                          <CalendarIcon size={14}/> Calendário
                      </button>
                  </div>
                  <Button onClick={handleAddNew} icon={<Plus size={16}/>}>Novo Agendamento</Button>
              </div>
            </div>

            {agendaView === 'list' && (
              <div>
                <div 
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-indigo-50 p-4 rounded-lg shadow-sm border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => setShowList(!showList)}
                  role="button"
                  aria-expanded={showList}
                  aria-controls="measurement-list-container"
                >
                  <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                    <ListChecks />
                    Lista de Agendamentos
                  </h3>
                  <div className="flex items-center justify-between sm:justify-end sm:gap-3 w-full sm:w-auto">
                    <span className="text-sm font-medium text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                      {filteredMeasurements.length} resultado(s)
                    </span>
                    {showList ? <ChevronUp className="text-indigo-600" /> : <ChevronDown className="text-indigo-600" />}
                  </div>
                </div>

                {showList && (
                  <div id="measurement-list-container" className="mt-6 animate-in fade-in duration-300">
                    <MeasurementList 
                      measurements={filteredMeasurements} 
                      onEdit={handleEdit} 
                      onDelete={handleDelete} 
                      onViewMap={handleViewMap} 
                      onStatusUpdate={handleStatusUpdate} 
                      onPartialUpdate={handlePartialUpdate} 
                    />
                  </div>
                )}
                
                <div className="mt-8 text-center text-sm text-gray-500 font-medium">
                  <p>— Total de {filteredMeasurements.length} agendamento(s) exibido(s) —</p>
                </div>
              </div>
            )}
            {agendaView === 'calendar' && (
                <CalendarView measurements={filteredMeasurements} onEdit={handleEdit} onAdd={handleAddNewWithDate} />
            )}
          </div>
        );
      case 'form':
        return <MeasurementForm initialData={editingMeasurement} initialDate={dateForNew} onSave={handleSave} onCancel={handleCancelForm} />;
      case 'commissions':
        return <CommissionsView allMeasurements={measurements} onShowPrintPreview={handleShowPrintPreview} onCommissionDataChange={handleCommissionDataChange} />;
      default:
        return <div>View not found</div>;
    }
  };

  const renderApp = () => {
    if (isLoading) return null; // Splash screen is shown via isAppReady logic
    if (!isAppReady) return <SplashScreen isExiting onAnimationEnd={() => setIsAppReady(true)} />;
    
    if (sharedItem) {
      return <SharedItemView measurement={sharedItem} onClose={() => setSharedItem(null)} />;
    }

    if (!user) {
      return <LoginView onLoginSuccess={handleLoginSuccess} />;
    }

    const showMobileNav = view === 'dashboard' || view === 'agenda' || view === 'commissions';

    return (
      <div className="bg-gray-50 min-h-screen">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40 no-print">
          <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <LayoutTemplate size={20}/>
              </div>
              <h1 className="font-bold text-lg text-gray-800 hidden sm:block">Agenda do Medidor</h1>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
               <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Home size={16}/>}>Dashboard</NavButton>
               <NavButton active={view === 'agenda'} onClick={() => setView('agenda')} icon={<LayoutList size={16}/>}>Agenda</NavButton>
               <NavButton active={view === 'commissions'} onClick={() => setView('commissions')} icon={<DollarSign size={16}/>}>Comissões</NavButton>
            </nav>

            <div className="flex items-center gap-2">
                <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800 truncate max-w-24 sm:max-w-none" title={user.name}>{user.name}</p>
                    <p className="text-xs text-gray-500 hidden sm:block">{user.email}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => handleLogout()} title="Sair">
                    <LogOut size={14} />
                </Button>
            </div>
          </div>
          {/* Mobile Nav Bar */}
          {showMobileNav && (
            <nav className="md:hidden bg-white border-t border-gray-100 p-2 flex justify-around">
                <NavButton mobile active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Home size={20}/>}>Dashboard</NavButton>
                <NavButton mobile active={view === 'agenda'} onClick={() => setView('agenda')} icon={<LayoutList size={20}/>}>Agenda</NavButton>
                <NavButton mobile active={view === 'commissions'} onClick={() => setView('commissions')} icon={<DollarSign size={20}/>}>Comissões</NavButton>
            </nav>
           )}
        </header>

        <main className="max-w-7xl mx-auto p-4 sm:p-6 pb-28 md:pb-6">
          {renderContent()}
        </main>
        
        {/* Mobile FAB */}
        {showMobileNav && (
            <button 
                onClick={handleAddNew} 
                className="md:hidden fixed bottom-6 right-6 z-30 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-blue-700 transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="Novo Agendamento"
            >
                <Plus size={32}/>
            </button>
        )}


        {mapAddress && <MapView address={mapAddress} onClose={() => setMapAddress(null)} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  };

  if (!isSupabaseConfigured()) {
    return <SupabaseConfigErrorView />;
  }

  return (
    <>
      {!isAppReady && <SplashScreen />}
      {renderApp()}
    </>
  );
};
// FIX: Add default export for the App component.
export default App;