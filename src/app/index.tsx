import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Contours } from '@/components';
import { FocusStatusBar } from '@/components/FocusStatusBar';
import { photos } from '@/data/photos';
import { colors, displayMaxScale, screenPadding, type } from '@/theme';

/** 01 / Começar — tela de entrada. */
export default function StartScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <FocusStatusBar style="light" />

      <View style={styles.photoArea}>
        <Image
          source={photos.montanhas.source}
          alt={photos.montanhas.alt}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <View style={[styles.scrim, { height: insets.top + 65 }]} />
        <Contours variant="comecar" style={[styles.contours, { top: insets.top + 63 }]} />
        <Text
          accessibilityRole="header"
          style={[type.brandLarge, styles.brand, { top: insets.top + 23 }]}
        >
          atlas
        </Text>
      </View>

      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 22) }]}>
        <Text style={[type.display, styles.white]} maxFontSizeMultiplier={displayMaxScale}>
          {'Vá além\ndo mapa.'}
        </Text>
        <Text style={[type.intro, styles.ice, styles.intro]}>
          {'Encontre seu próximo destino.\nVeja o clima antes de partir.'}
        </Text>
        <Button
          label="Explorar destinos"
          onPress={() => router.replace('/explorar')}
          style={styles.button}
        />
        <Text style={[type.micro, styles.ice, styles.credit]}>Uma criação da equipe Meridiano</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  photoArea: { flex: 1, overflow: 'hidden' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.ink, opacity: 0.35 },
  contours: { position: 'absolute', right: 0 },
  brand: { position: 'absolute', left: screenPadding, color: colors.white },
  panel: { backgroundColor: colors.ink, paddingHorizontal: screenPadding, paddingTop: 24 },
  white: { color: colors.white },
  ice: { color: colors.ice },
  intro: { marginTop: 16 },
  button: { marginTop: 48 },
  credit: { marginTop: 22 },
});
