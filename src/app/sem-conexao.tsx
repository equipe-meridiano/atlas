import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Contours } from '@/components';
import { FocusStatusBar } from '@/components/FocusStatusBar';
import { requestRetry, type RetryOrigin } from '@/lib/retry';
import { colors, screenPadding, type } from '@/theme';

/** 08 / Sem conexão. Aberta pela busca ou pelo clima quando a internet falha. */
export default function OfflineScreen() {
  const insets = useSafeAreaInsets();
  const { origem } = useLocalSearchParams<{ origem?: string }>();
  const origin: RetryOrigin = origem === 'clima' ? 'clima' : 'buscar';

  function retry() {
    // Volta primeiro e depois pede a nova tentativa para a tela de origem.
    router.back();
    requestRetry(origin);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 29, paddingBottom: Math.max(insets.bottom, 24) }]}
    >
      <FocusStatusBar style="dark" />
      <Text accessibilityRole="header" style={[type.title, styles.ink]}>
        O caminho pausou.
      </Text>
      <Contours variant="semConexao" style={styles.contours} />
      <Text style={[type.message, styles.ink]} accessibilityLiveRegion="polite">
        {origin === 'clima' ? 'Não foi possível\ncarregar a previsão.' : 'Não foi possível\ncarregar os destinos.'}
      </Text>
      <Text style={[type.body, styles.muted, styles.text]}>
        {'Verifique sua conexão e tente de novo.\nSeus lugares salvos continuam aqui.'}
      </Text>
      <Button label="Tentar novamente" onPress={retry} style={styles.primary} />
      <Button
        variant="secondary"
        label="Ver lugares salvos"
        onPress={() => router.dismissTo('/salvos')}
        style={styles.secondary}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: screenPadding },
  ink: { color: colors.ink },
  muted: { color: colors.muted },
  // Figma: as curvas ficam 91pt abaixo do título, a 26pt da margem.
  contours: { marginTop: 91, marginLeft: 26 },
  text: { marginTop: 28 },
  primary: { marginTop: 64 },
  secondary: { marginTop: 14 },
});
