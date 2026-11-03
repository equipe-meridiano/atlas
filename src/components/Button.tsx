import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, type } from '@/theme';
import { FeedbackPressable } from './FeedbackPressable';

type Props = {
  label: string;
  onPress: () => void;
  /** primary = azul (ação principal); secondary = gelo (ação de apoio). */
  variant?: 'primary' | 'secondary';
  /** Texto extra para leitor de tela, quando o rótulo sozinho não basta. */
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Componente "Button / Primary" do Figma: 56dp de altura, cantos de 16.
 * O nome acessível é igual ao rótulo, como pede a descrição do componente.
 */
export function Button({ label, onPress, variant = 'primary', accessibilityHint, style }: Props) {
  const secondary = variant === 'secondary';

  return (
    <FeedbackPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={[styles.base, secondary ? styles.secondary : styles.primary, style]}
    >
      <Text style={[type.label, styles.label, { color: secondary ? colors.ink : colors.white }]}>
        {label}
      </Text>
    </FeedbackPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    width: '100%',
    maxWidth: 290,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: colors.blue },
  secondary: { backgroundColor: colors.ice },
  label: { textAlign: 'center' },
});
