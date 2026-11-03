import { useCallback, useEffect, useState } from 'react';

import type { Place } from '@/data/place';
import { isApiError } from './http';
import { searchCities } from './openMeteo';
import { useDebouncedValue } from './useDebouncedValue';

/** O Open-Meteo só busca a partir de 2 letras. */
export const MIN_QUERY_LENGTH = 2;

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'success'; query: string; results: Place[] }
  | { status: 'empty'; query: string }
  | { status: 'offline'; query: string }
  | { status: 'error'; query: string };

/**
 * Busca de cidades com debounce de 350ms e cancelamento.
 * Cada nova busca cancela a anterior (AbortController), para que uma resposta
 * atrasada de "Rey" nunca apareça por cima do resultado de "Reykjavík".
 */
export function useCitySearch(text: string) {
  const query = useDebouncedValue(text.trim());
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setState({ status: 'idle' });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading', query });

    searchCities(query, controller.signal)
      .then((results) => {
        setState(results.length > 0 ? { status: 'success', query, results } : { status: 'empty', query });
      })
      .catch((error: unknown) => {
        if (isApiError(error, 'aborted')) return;
        setState({ status: isApiError(error, 'offline') ? 'offline' : 'error', query });
      });

    return () => controller.abort();
  }, [query, attempt]);

  /** Refaz a última busca (botões "Tentar novamente"). */
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  /** O texto digitado ainda não virou busca (debounce rodando). */
  const pending = text.trim() !== query;

  return { state, retry, pending };
}
