import type { ImageSource } from 'expo-image';

/**
 * Fotos editoriais do Atlas. Aparecem na tela de entrada e como reserva enquanto a foto
 * real do destino carrega, ou quando o Wikimedia não tem foto para a cidade.
 */
export type PhotoKey = 'montanhas' | 'lago';

export const photos: Record<PhotoKey, { source: ImageSource; alt: string }> = {
  montanhas: {
    source: require('../../assets/images/destino-montanhas.jpg'),
    alt: 'Foto ilustrativa: vale com montanhas nevadas e floresta de pinheiros',
  },
  lago: {
    source: require('../../assets/images/destino-lago.jpg'),
    alt: 'Foto ilustrativa: barco de madeira num lago entre montanhas',
  },
};

/**
 * Foto de reserva de um destino, sempre a mesma para o mesmo id
 * (não depende da posição na lista nem da busca feita).
 */
export function fallbackPhotoKey(placeId: string): PhotoKey {
  let sum = 0;
  for (let i = 0; i < placeId.length; i++) sum += placeId.charCodeAt(i);
  return sum % 2 === 0 ? 'montanhas' : 'lago';
}
