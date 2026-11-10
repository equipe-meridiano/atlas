import { useState } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { durations, pressedOpacity, useReduceMotion } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

/**
 * Pressable com o feedback de toque do handoff: a opacidade vai a 85% em 120ms
 * quando o dedo encosta e volta a 100% quando solta.
 * Todo elemento tocável do app usa este componente.
 */
export function FeedbackPressable({ style, onPressIn, onPressOut, ...rest }: Props) {
  const [opacity] = useState(() => new Animated.Value(1));
  const reduceMotion = useReduceMotion();

  function animateTo(value: number) {
    opacity.stopAnimation();
    Animated.timing(opacity, {
      toValue: value,
      duration: reduceMotion ? 0 : durations.toque,
      useNativeDriver: true,
    }).start();
  }

  return (
    <AnimatedPressable
      {...rest}
      style={[style, { opacity }]}
      onPressIn={(event: GestureResponderEvent) => {
        animateTo(pressedOpacity);
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        animateTo(1);
        onPressOut?.(event);
      }}
    />
  );
}
