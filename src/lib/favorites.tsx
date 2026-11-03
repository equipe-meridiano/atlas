import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isSafePhotoUrl, type Place } from '@/data/place';

/**
 * Lugares salvos, guardados no próprio celular com AsyncStorage
 * (um armazenamento de texto chave → valor que continua lá depois de fechar o app).
 */
export const STORAGE_KEY = 'atlas:salvos:v1';

type FavoritesValue = {
  places: Place[];
  /** false até terminar de ler o armazenamento na abertura do app. */
  ready: boolean;
  isSaved: (id: string) => boolean;
  toggle: (place: Place) => void;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

/** Confere cada item lido do armazenamento; descarta o que estiver corrompido. */
export function parseStoredPlaces(raw: string | null): Place[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const places = data.filter(
      (item): item is Place =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.country === 'string' &&
        typeof item.timezone === 'string' &&
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number' &&
        (item.photo === 'montanhas' || item.photo === 'lago'),
    );
    // Uma foto salva com endereço estranho é descartada; o destino volta para a foto do design.
    return places.map((place) => {
      if (place.photoUrl === undefined || isSafePhotoUrl(place.photoUrl)) return place;
      const { photoUrl: _ignored, photoCredit: _credit, ...rest } = place;
      return rest;
    });
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setPlaces(parseStoredPlaces(raw)))
      .catch(() => setPlaces([]))
      .finally(() => setReady(true));
  }, []);

  // Grava sempre que a lista muda, mas só depois da primeira leitura,
  // para não apagar o que já estava salvo com uma lista vazia.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(places)).catch(() => {});
  }, [places, ready]);

  const toggle = useCallback((place: Place) => {
    setPlaces((current) => {
      const exists = current.some((item) => item.id === place.id);
      // O salvo mais recente aparece primeiro na lista.
      return exists ? current.filter((item) => item.id !== place.id) : [place, ...current];
    });
  }, []);

  const value = useMemo<FavoritesValue>(
    () => ({
      places,
      ready,
      isSaved: (id) => places.some((item) => item.id === id),
      toggle,
    }),
    [places, ready, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('useFavorites precisa estar dentro de <FavoritesProvider>.');
  return value;
}
