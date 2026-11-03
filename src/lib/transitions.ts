import type { BottomTabNavigationOptions } from 'expo-router/js-tabs';
import {
  CardStyleInterpolators,
  type StackCardInterpolationProps,
  type StackNavigationOptions,
} from 'expo-router/js-stack';
import { SceneStyleInterpolators } from 'expo-router/js-tabs';

import { durations, easeOut, transitionDuration } from './motion';

/**
 * Transições entre telas, com os tempos exatos do handoff.
 * Usamos o stack em JavaScript do Expo Router porque ele aceita duração
 * personalizada no Android e no iOS (o stack nativo só aceita no iOS).
 */

function timing(ms: number) {
  return { animation: 'timing', config: { duration: ms, easing: easeOut } } as const;
}

/** Dissolve: a tela nova aparece por cima, só mudando a opacidade. */
export function dissolve(ms: number, reduceMotion: boolean): StackNavigationOptions {
  const spec = timing(transitionDuration(ms, reduceMotion));
  return {
    transitionSpec: { open: spec, close: spec },
    cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
  };
}

/**
 * Card → Destino: no Figma é um "smart animate" de 400ms, em que o card cresce até
 * virar a ficha do destino. Aqui a tela entra dissolvendo e crescendo levemente (96% → 100%).
 * Com "Reduzir movimento", vira um dissolve simples de 100ms, sem o crescimento.
 */
export function cardToDestination(reduceMotion: boolean): StackNavigationOptions {
  if (reduceMotion) return dissolve(durations.reduzido, true);
  const spec = timing(durations.cardParaDestino);
  return {
    transitionSpec: { open: spec, close: spec },
    cardStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
      cardStyle: {
        opacity: current.progress,
        transform: [{ scale: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
      },
    }),
  };
}

/** Troca de aba: dissolve de 200ms. */
export function tabDissolve(reduceMotion: boolean): BottomTabNavigationOptions {
  return {
    animation: 'fade',
    transitionSpec: timing(transitionDuration(durations.navegacao, reduceMotion)),
    sceneStyleInterpolator: SceneStyleInterpolators.forFade,
  };
}
