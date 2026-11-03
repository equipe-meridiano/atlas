import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackLink, Button } from '@/components';
import { FocusStatusBar } from '@/components/FocusStatusBar';
import { PlaceNotFound } from '@/components/PlaceNotFound';
import { defaultTagline, placeFromParams, placeToParams } from '@/data/place';
import { photos } from '@/data/photos';
import { useFavorites } from '@/lib/favorites';
import { formatLatitude, formatLongitude } from '@/lib/format';
import { colors, displayMaxScale, radius, screenPadding, type } from '@/theme';

const PHOTO_HEIGHT = 370;
/** A ficha sobe 30pt por cima da foto, como no Figma. */
const SHEET_OVERLAP = 30;

/** 04 / Destino. */
export default function DestinationScreen() {
  const insets = useSafeAreaInsets();
  const place = placeFromParams(useLocalSearchParams());
  const { isSaved, toggle } = useFavorites();

  if (!place) return <PlaceNotFound />;

  const saved = isSaved(place.id);
  const photo = photos[place.photo];

  return (
    <ScrollView style={styles.screen} bounces={false}>
      <FocusStatusBar style="light" />

      <View style={styles.photo}>
        <Image source={photo.source} alt={photo.alt} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={[styles.scrim, { height: insets.top + 63 }]} />
        <View style={[styles.back, { top: insets.top + 8 }]}>
          <BackLink color={colors.white} onPress={() => router.back()} />
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Text accessibilityRole="header" style={[type.placeTitle, styles.ink]} maxFontSizeMultiplier={displayMaxScale}>
          {place.name}
        </Text>
        <Text style={[type.bodyLarge, styles.muted, styles.country]}>{place.country}</Text>
        <Text style={[type.lead, styles.ink, styles.lead]}>{place.tagline ?? defaultTagline}</Text>

        <View style={styles.facts} accessible>
          <Text style={[type.body, styles.muted]}>{formatLatitude(place.latitude)}</Text>
          <Text style={[type.body, styles.muted]}>{formatLongitude(place.longitude)}</Text>
          <Text style={[type.body, styles.muted]}>{`Fuso horário: ${place.timezone}`}</Text>
        </View>

        <Button
          label="Ver previsão do tempo"
          onPress={() => router.push({ pathname: '/clima', params: placeToParams(place) })}
          style={styles.primary}
        />
        <Button
          variant="secondary"
          label={saved ? 'Remover dos salvos' : 'Salvar destino'}
          accessibilityHint={saved ? undefined : 'Guarda o destino na aba Salvos'}
          onPress={() => toggle(place)}
          style={styles.secondary}
        />

        <Text style={[type.note, styles.muted, styles.credit]}>Foto ilustrativa / dados: Open-Meteo</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  photo: { height: PHOTO_HEIGHT },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.ink, opacity: 0.4 },
  back: { position: 'absolute', left: screenPadding },
  sheet: {
    marginTop: -SHEET_OVERLAP,
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: screenPadding,
    paddingTop: 30,
  },
  ink: { color: colors.ink },
  muted: { color: colors.muted },
  country: { marginTop: 8 },
  lead: { marginTop: 28 },
  facts: { marginTop: 22 },
  primary: { marginTop: 37 },
  secondary: { marginTop: 12 },
  credit: { marginTop: 28 },
});
