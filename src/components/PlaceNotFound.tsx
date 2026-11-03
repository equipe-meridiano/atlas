import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, screenPadding, type } from '@/theme';
import { Button } from './Button';

/** Mostrado se a tela de destino ou de clima abrir sem os dados do lugar (link quebrado). */
export function PlaceNotFound() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 29 }]}>
      <Text accessibilityRole="header" style={[type.title, styles.ink]}>
        Destino não encontrado.
      </Text>
      <Text style={[type.body, styles.muted, styles.text]}>
        Volte para o Explorar e escolha um destino de novo.
      </Text>
      <Button label="Ir para Explorar" onPress={() => router.replace('/explorar')} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: screenPadding },
  ink: { color: colors.ink },
  muted: { color: colors.muted },
  text: { marginTop: 16 },
  button: { marginTop: 32 },
});
