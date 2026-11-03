import { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/lib/motion';
import { colors } from '@/theme';

type Props = {
  style?: StyleProp<ViewStyle>;
  /** light = sobre fundo claro (paper); dark = sobre fundo escuro (ink). */
  tone?: 'light' | 'dark';
};

/**
 * Bloco cinza que ocupa o lugar do conteúdo enquanto ele carrega ("skeleton").
 * Pulsa devagar; com "Reduzir movimento" ativo, fica parado.
 */
export function Skeleton({ style, tone = 'light' }: Props) {
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity, reduceMotion]);

  const backgroundColor = tone === 'dark' ? 'rgba(217, 231, 234, 0.18)' : colors.ice;

  return <Animated.View style={[{ backgroundColor, borderRadius: 8, opacity }, style]} />;
}
