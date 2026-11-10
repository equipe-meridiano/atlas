import type { ImageSource } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';

import { fallbackPhotoKey, photos } from '@/data/photos';
import type { Place } from '@/data/place';
import { loadPlacePhoto, type PlacePhoto } from './placePhotos';

export type PlacePhotoView = {
  /** Foto real quando disponível; senão, a foto editorial de reserva. */
  source: ImageSource;
  /** Foto editorial mostrada enquanto a real carrega. */
  placeholder: ImageSource;
  /** Autor e licença da foto real; null quando a imagem é ilustrativa. */
  credit: string | null;
  sourceUrl: string | null;
  status: 'loading' | 'ready' | 'unavailable';
  /** Texto para leitor de tela. */
  alt: string;
  /** Se a foto real não abrir, volta para a de reserva. */
  onError: () => void;
};

export function usePlacePhoto(place: Place | null): PlacePhotoView {
  const placeId = place?.id ?? '';
  const placeName = place?.name ?? '';
  const latitude = place?.latitude;
  const longitude = place?.longitude;
  const [loaded, setLoaded] = useState<{ id: string; photo: PlacePhoto | null } | null>(null);
  const [failedUri, setFailedUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadPlacePhoto(placeId, latitude !== undefined && longitude !== undefined
      ? { name: placeName, latitude, longitude } : undefined).then((photo) => {
      if (active) setLoaded({ id: placeId, photo });
    });
    return () => {
      active = false;
    };
  }, [placeId, placeName, latitude, longitude]);

  // Resultado de outro destino (o componente foi reaproveitado) não vale.
  const photo = loaded?.id === placeId ? loaded.photo : null;
  const remote = photo && photo.uri !== failedUri ? photo : null;
  const fallback = photos[fallbackPhotoKey(placeId)];

  const onError = useCallback(() => {
    if (remote) setFailedUri(remote.uri);
  }, [remote]);

  return {
    source: remote ? { uri: remote.uri } : fallback.source,
    placeholder: fallback.source,
    credit: remote?.credit ?? null,
    sourceUrl: remote?.sourceUrl ?? null,
    status: remote ? 'ready' : loaded?.id === placeId ? 'unavailable' : 'loading',
    alt: remote ? `Foto de ${placeName}` : fallback.alt,
    onError,
  };
}
