import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { Place } from '@/data/place';
import { durations, transitionDuration, useReduceMotion } from '@/lib/motion';
import { usePlacePhoto } from '@/lib/usePlacePhoto';
import { colors, radius, type } from '@/theme';
import { FeedbackPressable } from './FeedbackPressable';
import { Skeleton } from './Skeleton';

type Props = {
  place: Place;
  onPress: () => void;
};

/** Componente "Destination / Editorial" do Figma: foto de 176, nome e país. */
export function DestinationCard({ place, onPress }: Props) {
  const photo = usePlacePhoto(place.id, place.name);
  const reduceMotion = useReduceMotion();

  return (
    <FeedbackPressable
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${place.country}`}
      accessibilityHint="Abre os detalhes do destino"
      onPress={onPress}
      style={styles.card}
    >
      <Image
        source={photo.source}
        placeholder={photo.placeholder}
        placeholderContentFit="cover"
        onError={photo.onError}
        transition={transitionDuration(durations.navegacao, reduceMotion)}
        recyclingKey={place.id}
        style={styles.photo}
        contentFit="cover"
        accessible={false}
      />
      <View style={styles.text}>
        <Text style={[type.cardTitle, styles.name]} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={[type.caption, styles.country]} numberOfLines={1}>
          {place.country}
        </Text>
      </View>
    </FeedbackPressable>
  );
}

/** Mesmo tamanho do card real, para o resultado entrar sem a tela "pular". */
export function DestinationCardSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Carregando destinos" accessible>
      <Skeleton style={styles.photo} tone="dark" />
      <View style={styles.text}>
        <Skeleton style={styles.skeletonName} tone="dark" />
        <Skeleton style={styles.skeletonCountry} tone="dark" />
      </View>
    </View>
  );
}

export const CARD_HEIGHT = 252;

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    borderRadius: radius.card,
    backgroundColor: colors.ink,
    overflow: 'hidden',
  },
  photo: { height: 176, width: '100%' },
  text: { paddingHorizontal: 16, paddingTop: 12, gap: 6 },
  name: { color: colors.white },
  country: { color: colors.ice },
  skeletonName: { height: 24, width: 160, borderRadius: 6 },
  skeletonCountry: { height: 14, width: 80, borderRadius: 6 },
});
