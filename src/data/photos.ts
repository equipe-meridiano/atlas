import type { ImageSource } from 'expo-image';

/**
 * Fotos editoriais do Atlas. Elas são ilustrativas: a API de clima não fornece fotos,
 * então cada destino recebe uma das duas imagens do design.
 */
export type PhotoKey = 'montanhas' | 'lago';

export const photos: Record<PhotoKey, { source: ImageSource; alt: string }> = {
  montanhas: {
    source: require('../../assets/images/destino-montanhas.png'),
    alt: 'Foto ilustrativa: vale com montanhas nevadas e floresta de pinheiros',
  },
  lago: {
    source: require('../../assets/images/destino-lago.png'),
    alt: 'Foto ilustrativa: barco de madeira num lago entre montanhas',
  },
};
