import { StyleSheet, Text } from 'react-native';

import { minTouchTarget, type } from '@/theme';
import { FeedbackPressable } from './FeedbackPressable';

type Props = { onPress: () => void; color: string };

/**
 * "Voltar" do topo das telas Destino e Clima.
 * O texto tem 19dp de altura, então a área de toque é ampliada até os 48dp do handoff.
 */
export function BackLink({ onPress, color }: Props) {
  return (
    <FeedbackPressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      onPress={onPress}
      hitSlop={8}
      style={styles.touch}
    >
      <Text style={[type.label, { color }]}>Voltar</Text>
    </FeedbackPressable>
  );
}

const styles = StyleSheet.create({
  touch: {
    alignSelf: 'flex-start',
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    justifyContent: 'center',
  },
});
