import { useEffect, useRef } from 'react';

/**
 * Ponte entre a tela "O caminho pausou" e a tela que falhou.
 * Quando a pessoa toca em "Tentar novamente", a tela de erro chama `requestRetry`
 * e volta; a tela de origem, que está ouvindo, refaz a requisição.
 */
export type RetryOrigin = 'buscar' | 'clima';

type Listener = () => void;
const listeners = new Map<RetryOrigin, Set<Listener>>();

export function requestRetry(origin: RetryOrigin) {
  listeners.get(origin)?.forEach((listener) => listener());
}

export function useRetryListener(origin: RetryOrigin, onRetry: () => void) {
  const callback = useRef(onRetry);

  // Guarda sempre a versão mais nova do callback, sem refazer a inscrição.
  useEffect(() => {
    callback.current = onRetry;
  });

  useEffect(() => {
    const listener = () => callback.current();
    const set = listeners.get(origin) ?? new Set<Listener>();
    set.add(listener);
    listeners.set(origin, set);
    return () => {
      set.delete(listener);
    };
  }, [origin]);
}
