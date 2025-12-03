import React from 'react';
import { Database, AlertTriangle } from 'lucide-react';

export const SupabaseConfigErrorView: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
        <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Database size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuração Necessária</h1>
        <p className="text-gray-600 mb-6">
          Para utilizar o Agenda do Medidor, você precisa conectar o projeto ao Supabase.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg text-left text-sm text-gray-700 border border-gray-200 mb-6 space-y-2">
          <p className="font-semibold flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500"/> Variáveis de ambiente ausentes:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1 text-gray-600 font-mono">
            <li>SUPABASE_URL</li>
            <li>SUPABASE_ANON_KEY</li>
          </ul>
        </div>

        <p className="text-xs text-gray-400">
          Adicione estas chaves no seu arquivo de ambiente ou configuração de deploy.
        </p>
      </div>
    </div>
  );
};