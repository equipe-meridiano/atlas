import { useEffect, useState } from 'react';

/** Tempo de espera da busca, do handoff: 350ms depois da última tecla. */
export const SEARCH_DEBOUNCE_MS = 350;

/**
 * "Debounce" = esperar a pessoa parar de digitar antes de agir.
 * O valor devolvido só muda quando `value` fica parado por `delay` ms,
 * então digitar "Reykjavík" gera uma busca, e não nove.
 */
export function useDebouncedValue<T>(value: T, delay = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
