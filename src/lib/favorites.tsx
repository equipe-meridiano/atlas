import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { featured, type Place } from '@/data/place';

/**
 * Lugares salvos, guardados no próprio celular com AsyncStorage
 * (um armazenamento de texto chave → valor que continua lá depois de fechar o app).
 */
export const STORAGE_KEY = 'atlas:salvos:v1';

type FavoritesValue = {
  places: Place[];
  /** false até terminar de ler o armazenamento na abertura do app. */
  ready: boolean;
  /** true quando não deu para ler ou gravar no celular: os salvos podem se perder ao fechar o app. */
  storageError: boolean;
  isSaved: (id: string) => boolean;
  toggle: (place: Place) => void;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

/** Ids que os destaques usavam antes de adotar o id do GeoNames. */
const LEGACY_IDS: Record<string, string> = {
  'destaque-reykjavik': featured.hero.id,
  'destaque-interlaken': featured.discover.id,
};

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Confere um item lido do armazenamento e devolve só os campos de Place. */
function toPlace(item: unknown): Place | null {
  if (typeof item !== 'object' || item === null) return null;
  const data = item as Record<string, unknown>;
  const { id, name, country, timezone, latitude, longitude } = data;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof country !== 'string') return null;
  if (typeof timezone !== 'string' || typeof latitude !== 'number' || typeof longitude !== 'number') return null;

  return {
    id: LEGACY_IDS[id] ?? id,
    name,
    country,
    region: optionalText(data.region),
    latitude,
    longitude,
    timezone,
    isCapital: data.isCapital === true,
    tagline: optionalText(data.tagline),
  };
}

/** Lê o que foi gravado: descarta itens corrompidos e repetidos. */
export function parseStoredPlaces(raw: string | null): Place[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    const places: Place[] = [];
    for (const item of data) {
      const place = toPlace(item);
      if (!place || seen.has(place.id)) continue;
      seen.add(place.id);
      places.push(place);
    }
    return places;
  } catch {
    return [];
  }
}

/** Salva ou remove. O salvo mais recente aparece primeiro na lista. */
export function togglePlace(current: Place[], place: Place): Place[] {
  const exists = current.some((item) => item.id === place.id);
  return exists ? current.filter((item) => item.id !== place.id) : [place, ...current];
}

type LoadStatus = 'loading' | 'ready' | 'readFailed';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [saveFailed, setSaveFailed] = useState(false);
  const loaded = useRef(false);
  /** Toques em "Salvar" feitos antes da leitura terminar; reaplicados sobre o que foi lido. */
  const earlyToggles = useRef<Place[]>([]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(
        (raw) => ({ stored: parseStoredPlaces(raw), ok: true }),
        () => ({ stored: [] as Place[], ok: false }),
      )
      .then(({ stored, ok }) => {
        if (!active) return;
        loaded.current = true;
        const toggles = earlyToggles.current;
        earlyToggles.current = [];
        setPlaces(toggles.reduce(togglePlace, stored));
        setStatus(ok ? 'ready' : 'readFailed');
      });
    return () => {
      active = false;
    };
  }, []);

  // Grava sempre que a lista muda. Só depois de ler com sucesso: gravar antes
  // (ou depois de uma leitura que falhou) apagaria o que já estava salvo.
  useEffect(() => {
    if (status !== 'ready') return;
    let active = true;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(places)).then(
      () => active && setSaveFailed(false),
      () => active && setSaveFailed(true),
    );
    return () => {
      active = false;
    };
  }, [places, status]);

  const toggle = useCallback((place: Place) => {
    if (!loaded.current) earlyToggles.current.push(place);
    setPlaces((current) => togglePlace(current, place));
  }, []);

  const value = useMemo<FavoritesValue>(
    () => ({
      places,
      ready: status !== 'loading',
      storageError: status === 'readFailed' || saveFailed,
      isSaved: (id) => places.some((item) => item.id === id),
      toggle,
    }),
    [places, status, saveFailed, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('useFavorites precisa estar dentro de <FavoritesProvider>.');
  return value;
}
