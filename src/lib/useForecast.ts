import { useCallback, useEffect, useState } from 'react';

import type { Place } from '@/data/place';
import { isApiError } from './http';
import { getForecast, type Forecast } from './openMeteo';

export type ForecastState =
  | { status: 'loading' }
  | { status: 'success'; forecast: Forecast }
  | { status: 'offline' }
  | { status: 'error' };

type Finished = Exclude<ForecastState, { status: 'loading' }>;

const LOADING: ForecastState = { status: 'loading' };

/**
 * Previsão de um destino. `refresh` busca de novo (botão "Atualizar previsão").
 * Enquanto a resposta da requisição atual (coordenadas + tentativa) não chega, está carregando.
 */
export function useForecast(place: Pick<Place, 'latitude' | 'longitude'> | null) {
  const [attempt, setAttempt] = useState(0);
  const [finished, setFinished] = useState<{ key: string; state: Finished } | null>(null);
  const latitude = place?.latitude;
  const longitude = place?.longitude;
  const key = `${attempt}:${latitude}:${longitude}`;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    const controller = new AbortController();

    getForecast({ latitude, longitude }, controller.signal)
      .then((forecast) => setFinished({ key, state: { status: 'success', forecast } }))
      .catch((error: unknown) => {
        if (isApiError(error, 'aborted')) return;
        setFinished({ key, state: { status: isApiError(error, 'offline') ? 'offline' : 'error' } });
      });

    return () => controller.abort();
  }, [latitude, longitude, key]);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  const state: ForecastState = finished?.key === key ? finished.state : LOADING;
  return { state, refresh };
}
