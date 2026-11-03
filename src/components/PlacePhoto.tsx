import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import type { StyleProp, ImageStyle } from 'react-native';

import type { Place } from '@/data/place';
import { photos } from '@/data/photos';
import { useReduceMotion } from '@/lib/motion';

type Props = {
  place: Place;
  style?: StyleProp<ImageStyle>;
  /** No card, o leitor de tela já lê o nome da cidade; a foto fica em silêncio. */
  decorative?: boolean;
};

/**
 * Foto do destino: a foto real da cidade (Wikimedia) quando existe;
 * se não existir ou não carregar, a foto editorial do design.
 * A imagem baixada fica guardada no celular (cache), então os salvos aparecem mesmo offline.
 */
export function PlacePhoto({ place, style, decorative = false }: Props) {
  const reduceMotion = useReduceMotion();
  const [failed, setFailed] = useState(false);

  // Outro destino na mesma tela (lista reaproveita componentes): tenta a foto de novo.
  useEffect(() => setFailed(false), [place.photoUrl]);

  const remote = place.photoUrl && !failed ? place.photoUrl : undefined;
  const fallback = photos[place.photo];

  return (
    <Image
      source={remote ? { uri: remote } : fallback.source}
      style={style}
      contentFit="cover"
      transition={reduceMotion ? 0 : 200}
      cachePolicy="disk"
      onError={() => setFailed(true)}
      accessible={!decorative}
      alt={decorative ? undefined : remote ? `Foto de ${place.name}` : fallback.alt}
    />
  );
}
