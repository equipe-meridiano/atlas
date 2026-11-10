import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

/**
 * Tempos de animação do handoff ("Interações e acessibilidade").
 * Quando a pessoa ativa "Reduzir movimento" no celular, tudo vira um dissolve de 100ms.
 */
export const durations = {
  /** Entrada → Explorar: dissolve 400ms. */
  entrada: 400,
  /** Card → Destino: smart animate 400ms. */
  cardParaDestino: 400,
  /** Navegação entre telas e abas: dissolve 200ms. */
  navegacao: 200,
  /** Feedback de toque: 120ms. */
  toque: 120,
  /** Reduzir movimento: dissolve 100ms, sem parallax. */
  reduzido: 100,
} as const;

/** Opacidade do botão enquanto o dedo está nele (85%). */
export const pressedOpacity = 0.85;

/** Curva suave de saída, a mais próxima do "ease out" do Figma. */
export const easeOut = Easing.bezier(0.25, 0.1, 0.25, 1);

/** Diz se a pessoa pediu "Reduzir movimento" nas configurações de acessibilidade. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(true);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduce(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduce;
}

/** Duração final de uma transição, já respeitando "Reduzir movimento". */
export function transitionDuration(ms: number, reduceMotion: boolean): number {
  return reduceMotion ? durations.reduzido : ms;
}
