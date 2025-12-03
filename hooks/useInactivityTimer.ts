import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook customizado para detectar inatividade do usuário e acionar um callback.
 * @param onTimeout A função a ser chamada quando o usuário estiver inativo.
 * @param timeout A duração da inatividade em milissegundos. Padrão de 15 minutos.
 */
export const useInactivityTimer = (onTimeout: () => void, timeout: number = 15 * 60 * 1000) => {
  const timeoutId = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }
    timeoutId.current = window.setTimeout(onTimeout, timeout);
  }, [onTimeout, timeout]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

    const handleActivity = () => {
      resetTimer();
    };

    // Configura os event listeners para a atividade do usuário
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Inicia o timer
    resetTimer();

    // Função de limpeza para remover os listeners e limpar o timer
    return () => {
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]); // O efeito depende apenas da função memoizada resetTimer
};
