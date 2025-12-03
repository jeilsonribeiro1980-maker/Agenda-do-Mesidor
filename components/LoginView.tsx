import React, { useState } from 'react';
import { InputField } from './InputField';
import { Button } from './Button';
import { authService } from '../services/authService';
import { User } from '../types';
import { LayoutTemplate, LogIn, UserPlus, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Adicionado estado de sucesso para feedback visual
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLoginView) {
        const { user, error: loginError } = await authService.login(email, password);
        if (loginError) {
          setError(loginError);
          setLoading(false);
        } else if (user) {
          onLoginSuccess(user);
        }
      } else {
        // Fluxo de Cadastro
        if (password !== confirmPassword) {
          setError('As senhas não coincidem.');
          setLoading(false);
          return;
        }
        
        const { user: newUser, error: registerError } = await authService.register(name, email, password);
        
        if (newUser) {
           // Login automático após cadastro
           onLoginSuccess(newUser);
           return;
        }
        
        if (registerError) {
          setError(registerError);
        } else {
          // Cadastro sucesso mas sem sessão automática (fallback)
          setSuccess('Conta criada com sucesso! Faça login para continuar.');
          setIsLoginView(true);
          setPassword('');
          setConfirmPassword('');
        }
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };
  
  return (
    <div className="animate-content-fade-in">
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-6">
              <div className="flex flex-col items-center text-center">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-blue-500/30 mb-4">
                  <LayoutTemplate size={32} />
                  </div>
              <h2 className="text-2xl font-bold text-gray-900">{isLoginView ? 'Acessar Agenda' : 'Criar Nova Conta'}</h2>
              <p className="text-sm text-gray-500">Bem-vindo(a) ao Agenda do Medidor</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                </div>
              )}
              
              {success && (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm border border-emerald-100 flex items-center gap-2">
                    <UserPlus size={16} className="shrink-0" />
                    {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginView && (
                  <InputField
                  label="Seu Nome"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome Completo"
                  required
                  />
              )}
              <InputField
                  label="E-mail"
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
              />
              <InputField
                  label="Senha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isLoginView ? "current-password" : "new-password"}
                  required
              />
              {!isLoginView && (
                  <InputField
                  label="Confirmar Senha"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  />
              )}
              <Button type="submit" isLoading={loading} className="w-full !py-3" icon={isLoginView ? <LogIn size={18}/> : <UserPlus size={18}/>}>
                  {isLoginView ? 'Entrar' : 'Cadastrar'}
              </Button>
              </form>
              <p className="text-center text-sm text-gray-600">
              {isLoginView ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                  type="button"
                  onClick={() => {
                      setIsLoginView(!isLoginView);
                      setError('');
                      setSuccess('');
                      setPassword('');
                      setConfirmPassword('');
                  }}
                  className="font-semibold text-blue-600 hover:underline ml-1"
              >
                  {isLoginView ? 'Cadastre-se' : 'Faça o login'}
              </button>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};