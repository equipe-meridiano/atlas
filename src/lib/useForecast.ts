import { useCallback, useEffect, useState } from 'react';

import type { Place } from '@/data/place';
import { isApiError } from './http';
import { getForecast, type Forecast } from './openMeteo';

export type ForecastState =
  | { status: 'loading' }
  | { status: 'success'; forecast: Forecast }
  | { status: 'offline' }
  | { status: 'error' };

/** Previsão de um destino. `refresh` busca de novo (botão "Atualizar previsão"). */
export function useForecast(place: Pick<Place, 'latitude' | 'longitude'> | null) {
  const [state, setState] = useState<ForecastState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const latitude = place?.latitude;
  const longitude = place?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    const controller = new AbortController();
    setState({ status: 'loading' });

    getForecast({ latitude, longitude }, controller.signal)
      .then((forecast) => setState({ status: 'success', forecast }))
      .catch((error: unknown) => {
        if (isApiError(error, 'aborted')) return;
        setState({ status: isApiError(error, 'offline') ? 'offline' : 'error' });
      });

    return () => controller.abort();
  }, [latitude, longitude, attempt]);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, refresh };
}
