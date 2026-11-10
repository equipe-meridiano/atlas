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

type Finished = Exclude<SearchState, { status: 'idle' } | { status: 'loading' }>;

/**
 * Busca de cidades com debounce de 350ms e cancelamento.
 * Cada nova busca cancela a anterior (AbortController), para que uma resposta
 * atrasada de "Rey" nunca apareça por cima do resultado de "Reykjavík".
 *
 * O estado "carregando" não é gravado: enquanto a resposta da busca atual
 * (texto + tentativa) não chega, a busca está carregando.
 */
export function useCitySearch(text: string) {
  const query = useDebouncedValue(text.trim());
  const [attempt, setAttempt] = useState(0);
  const [finished, setFinished] = useState<{ key: string; state: Finished } | null>(null);
  const key = `${attempt}:${query}`;
  const active = query.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();

    searchCities(query, controller.signal)
      .then((results) => {
        setFinished({
          key,
          state: results.length > 0 ? { status: 'success', query, results } : { status: 'empty', query },
        });
      })
      .catch((error: unknown) => {
        if (isApiError(error, 'aborted')) return;
        setFinished({ key, state: { status: isApiError(error, 'offline') ? 'offline' : 'error', query } });
      });

    return () => controller.abort();
  }, [active, query, key]);

  /** Refaz a última busca (botões "Tentar novamente"). */
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  let state: SearchState;
  if (!active) state = { status: 'idle' };
  else if (finished?.key === key) state = finished.state;
  else state = { status: 'loading', query };

  return { state, retry };
}
