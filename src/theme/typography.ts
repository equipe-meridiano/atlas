import type { TextStyle } from 'react-native';

/**
 * Tipografia do Atlas: Manrope, altura de linha 1.2 em todos os estilos (igual ao Figma).
 * Os nomes descrevem o papel do texto, não o tamanho, para facilitar a leitura das telas.
 */

export const fontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
} as const;

type Weight = keyof typeof fontFamily;

function style(size: number, weight: Weight): TextStyle {
  return { fontFamily: fontFamily[weight], fontSize: size, lineHeight: Math.round(size * 1.2) };
}

export const type = {
  /** Temperatura gigante da tela de clima (110). */
  temperature: style(110, 'medium'),
  /** Título da tela de entrada: "Vá além do mapa." */
  display: style(58, 'medium'),
  /** Nome do destino na ficha (44). */
  placeTitle: style(44, 'medium'),
  /** Chamada da tela Explorar: "Seu próximo horizonte." */
  hero: style(39, 'medium'),
  /** Marca "atlas" na entrada. */
  brandLarge: style(38, 'semibold'),
  /** Título padrão de tela (36). */
  title: style(36, 'medium'),
  /** Título de estado vazio, mais leve (36). */
  titleLight: style(36, 'regular'),
  /** Marca "atlas" no topo do Explorar. */
  brand: style(34, 'semibold'),
  /** Nome da cidade no clima (34). */
  cityLight: style(34, 'regular'),
  /** Mensagem principal de erro (29). */
  message: style(29, 'regular'),
  /** Frase editorial do destino (25). */
  lead: style(25, 'regular'),
  /** Frase de apoio na lista de salvos (24). */
  subtitle: style(24, 'regular'),
  /** Nome no card de destino e títulos de seção escura (23). */
  cardTitle: style(23, 'medium'),
  /** "Para descobrir" (22). */
  section: style(22, 'semibold'),
  /** Condição do tempo (20). */
  condition: style(20, 'regular'),
  bodyLarge: style(18, 'regular'),
  bodyLargeMedium: style(18, 'medium'),
  intro: style(17, 'regular'),
  /** Texto base do app: 16dp, como pede o handoff. */
  body: style(16, 'regular'),
  label: style(16, 'semibold'),
  small: style(15, 'regular'),
  tab: style(14, 'semibold'),
  smallCaption: style(14, 'regular'),
  caption: style(13, 'regular'),
  micro: style(12, 'regular'),
  note: style(11, 'regular'),
} as const;

/**
 * Teto para a escala de texto do sistema nos títulos muito grandes.
 * O texto continua crescendo com a configuração do celular, mas sem quebrar a tela.
 */
export const displayMaxScale = 1.3;
