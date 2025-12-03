import { supabase } from './supabaseClient';
import { User } from '../types';

export const authService = {
  register: async (name: string, email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          return { user: null, error: "Este e-mail já está cadastrado." };
        }
        if (error.message.includes("Password should be at least 6 characters")) {
          return { user: null, error: "A senha deve ter no mínimo 6 caracteres." };
        }
        return { user: null, error: "Não foi possível criar a conta. Tente novamente." };
      }

      if (data.user) {
        // Se houver sessão (confirmação de e-mail desativada), retorna o usuário para login automático
        if (data.session) {
          const user: User = {
            id: data.user.id,
            name: data.user.user_metadata.full_name || name,
            email: data.user.email || email,
          };
          return { user, error: null };
        }
        // Se não houver sessão, o usuário foi criado, mas precisa fazer login manualmente
        return { user: null, error: null };
      }

      return { user: null, error: "Ocorreu um erro inesperado durante o cadastro." };
    } catch (e) {
      return { user: null, error: 'Não foi possível conectar ao servidor.' };
    }
  },

  login: async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { user: null, error: 'E-mail ou senha inválidos.' };
        }
        return { user: null, error: 'Não foi possível fazer login. Tente novamente.' };
      }

      if (data.user) {
        const user: User = {
          id: data.user.id,
          name: data.user.user_metadata.full_name || 'Usuário',
          email: data.user.email || '',
        };
        return { user, error: null };
      }
      return { user: null, error: 'Usuário não encontrado.' };
    } catch (e) {
      return { user: null, error: 'Não foi possível conectar ao servidor.' };
    }
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  getSessionUser: async (): Promise<User | null> => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session || !session.user) {
        return null;
        }
        return {
        id: session.user.id,
        name: session.user.user_metadata.full_name || 'Usuário',
        email: session.user.email || '',
        };
    } catch (e) {
        return null;
    }
  },
};