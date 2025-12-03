import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Configuração da Conexão com o Supabase ---

// 1. Tenta obter as credenciais das variáveis de ambiente.
// Esta é a abordagem recomendada para produção e segurança.
let supabaseUrl = typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined;
let supabaseKey = typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined;

// 2. Se as variáveis de ambiente não estiverem definidas, usa as credenciais do projeto como fallback.
// Isso é útil para desenvolvimento local ou cenários de início rápido.
const FALLBACK_PROJECT_URL = 'https://suxblumjoyrkvapwrmhx.supabase.co';
const FALLBACK_PROJECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1eGJsdW1qb3lya3ZhcHdybWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjY0NzYsImV4cCI6MjA3OTc0MjQ3Nn0.tGnzccHEyz-dKvrAerqy8R0CL-nxYV_y4KBNsjHGkyo';

if (!supabaseUrl || !supabaseKey) {
  // Esta mensagem aparecerá no console do desenvolvedor.
  console.warn(
    'Variáveis de ambiente do Supabase (SUPABASE_URL, SUPABASE_ANON_KEY) não encontradas. ' +
    'Usando credenciais fixas no código como fallback. É recomendado usar variáveis de ambiente para produção.'
  );
  supabaseUrl = FALLBACK_PROJECT_URL;
  supabaseKey = FALLBACK_PROJECT_KEY;
}

/**
 * Verifica se o cliente Supabase está configurado corretamente com credenciais válidas.
 * O aplicativo exibirá uma tela de erro se esta função retornar falso.
 * @returns {boolean} Verdadeiro se configurado, falso caso contrário.
 */
export const isSupabaseConfigured = (): boolean => {
  // Uma configuração válida requer tanto uma URL quanto uma chave.
  // Também verificamos um valor de placeholder comum para evitar uso acidental.
  return !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('placeholder.supabase.co');
};

/**
 * A instância única (singleton) do cliente Supabase.
 * É criada apenas se a configuração for válida.
 * Outras partes do aplicativo importam esta instância para interagir com o Supabase.
 */
let supabase: SupabaseClient;

if (isSupabaseConfigured()) {
  // Cria o cliente com as credenciais obtidas.
  supabase = createClient(supabaseUrl!, supabaseKey!);
} else {
  // Se não estiver configurado, cria um objeto dummy. Isso evita que o aplicativo quebre
  // ao importar `supabase` antes que a verificação de configuração seja concluída.
  // A verificação `isSupabaseConfigured` em App.tsx cuidará de exibir a tela de erro.
  console.error('Supabase não está configurado. Verifique suas variáveis de ambiente ou credenciais de fallback.');
  supabase = {} as SupabaseClient;
}

export { supabase };