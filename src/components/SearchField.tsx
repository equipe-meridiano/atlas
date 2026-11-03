import type { Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';

import { colors, radius, type } from '@/theme';
import { FeedbackPressable } from './FeedbackPressable';

const PLACEHOLDER = 'Buscar uma cidade';

type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  inputRef?: Ref<TextInputInstance>;
  autoFocus?: boolean;
};

/** Componente "Search / Default": campo de busca de verdade (tela Buscar). */
export function SearchField({ value, onChangeText, inputRef, autoFocus }: InputProps) {
  return (
    <View style={styles.field}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        placeholder={PLACEHOLDER}
        placeholderTextColor={colors.muted}
        accessibilityLabel={PLACEHOLDER}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="words"
        style={[type.body, styles.input]}
      />
    </View>
  );
}

/** Mesmo visual, mas como botão: no Explorar ele leva para a tela Buscar. */
export function SearchFieldButton({ onPress }: { onPress: () => void }) {
  return (
    <FeedbackPressable
      accessibilityRole="search"
      accessibilityLabel={PLACEHOLDER}
      accessibilityHint="Abre a busca de destinos"
      onPress={onPress}
      style={styles.field}
    >
      <Text style={[type.body, styles.placeholder]}>{PLACEHOLDER}</Text>
    </FeedbackPressable>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 56,
    width: '100%',
    maxWidth: 316,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 16,
  },
  input: { color: colors.ink, paddingVertical: 16 },
  placeholder: { color: colors.muted },
});
