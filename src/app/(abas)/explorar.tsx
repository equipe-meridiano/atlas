import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Contours, DestinationCard, FeedbackPressable, SearchFieldButton } from '@/components';
import { FocusStatusBar } from '@/components/FocusStatusBar';
import { featured, placeToParams, type Place } from '@/data/place';
import { colors, minTouchTarget, screenPadding, type } from '@/theme';

function openPlace(place: Place) {
  router.push({ pathname: '/destino', params: placeToParams(place) });
}

/** 02 / Explorar — tela inicial depois da entrada. */
export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const discover = featured.discover;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 21 }]}
    >
      <FocusStatusBar style="dark" />

      <Text accessibilityRole="header" style={[type.brand, styles.ink]}>
        atlas
      </Text>
      <Text style={[type.intro, styles.muted, styles.tagline]}>O mundo está lá fora.</Text>

      <View style={styles.search}>
        {/* "foco" muda a cada toque, para a tela Buscar saber que deve abrir o teclado. */}
        <SearchFieldButton
          onPress={() => router.navigate({ pathname: '/buscar', params: { foco: String(Date.now()) } })}
        />
      </View>

      <View style={styles.hero}>
        <Contours variant="explorar" style={styles.contours} />
        <Text accessibilityRole="header" style={[type.hero, styles.ink]}>
          {'Seu próximo\nhorizonte.'}
        </Text>
      </View>

      <View style={styles.card}>
        <DestinationCard place={featured.hero} onPress={() => openPlace(featured.hero)} />
      </View>

      <Text accessibilityRole="header" style={[type.section, styles.ink, styles.sectionTitle]}>
        Para descobrir
      </Text>
      <FeedbackPressable
        accessibilityRole="button"
        accessibilityLabel={`${discover.name}, ${discover.country}. ${discover.tagline}`}
        accessibilityHint="Abre os detalhes do destino"
        onPress={() => openPlace(discover)}
        style={styles.discover}
      >
        <Text style={[type.body, styles.ink]}>{`${discover.name}, ${discover.country}`}</Text>
        <Text style={[type.smallCaption, styles.muted, styles.discoverText]}>{discover.tagline}</Text>
      </FeedbackPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: screenPadding, paddingBottom: 32 },
  ink: { color: colors.ink },
  muted: { color: colors.muted },
  tagline: { marginTop: 8 },
  search: { marginTop: 24 },
  hero: { marginTop: 24 },
  // Posição do Figma: as curvas começam 31pt acima do título, a 146pt da margem.
  contours: { position: 'absolute', top: -31, left: 146 },
  card: { marginTop: 24 },
  sectionTitle: { marginTop: 24 },
  discover: { marginTop: 8, minHeight: minTouchTarget, justifyContent: 'center', paddingVertical: 8 },
  discoverText: { marginTop: 8 },
});
