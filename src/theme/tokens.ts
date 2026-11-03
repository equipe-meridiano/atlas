/**
 * Tokens de design do Atlas v1.0, copiados do frame "Components / Atlas v1.0" do Figma.
 *
 * Token = um valor com nome (uma cor, um espaçamento, um tamanho de fonte).
 * As telas usam sempre o nome, nunca o valor solto, para que uma mudança no
 * design seja feita num lugar só.
 */

export const colors = {
  ink: '#192C35',
  muted: '#52656D',
  paper: '#F3F6F7',
  white: '#FFFFFF',
  ice: '#D9E7EA',
  blue: '#324BD6',
  lilac: '#CEC9ED',
} as const;

/** Grade de 8 pontos: todo espaçamento é múltiplo de 8 (o 4 é a meia medida). */
export const space = {
  half: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  card: 16,
  sheet: 24,
} as const;

/** Margem lateral de todas as telas (24 no Figma). */
export const screenPadding = space.l;

/** Alvo mínimo de toque pedido no handoff: 48dp. */
export const minTouchTarget = 48;
