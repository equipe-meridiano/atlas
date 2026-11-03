import { useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { durations, pressedOpacity } from '@/lib/motion';

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
  const opacity = useRef(new Animated.Value(1)).current;

  function animateTo(value: number) {
    Animated.timing(opacity, {
      toValue: value,
      duration: durations.toque,
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
