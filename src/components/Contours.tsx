import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * "Atlas / topographic contours": a ilustração de curvas de nível do design.
 * Cada tela tem a sua versão, exportada do Figma em SVG, no tamanho original.
 */
const variants = {
  comecar: { source: require('../../assets/contornos/comecar.svg'), width: 240, height: 260 },
  explorar: { source: require('../../assets/contornos/explorar.svg'), width: 210, height: 160 },
  clima: { source: require('../../assets/contornos/clima.svg'), width: 280, height: 260 },
  buscaVazia: { source: require('../../assets/contornos/busca-vazia.svg'), width: 290, height: 230 },
  semConexao: { source: require('../../assets/contornos/sem-conexao.svg'), width: 300, height: 240 },
} as const;

export type ContoursVariant = keyof typeof variants;

type Props = {
  variant: ContoursVariant;
  /** Posição na tela (normalmente absoluta, como no Figma). */
  style?: StyleProp<ViewStyle>;
};

/** Puramente decorativa: o leitor de tela ignora. */
export function Contours({ variant, style }: Props) {
  const { source, width, height } = variants[variant];

  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.wrapper, { width, height }, style]}
    >
      <Image source={source} style={{ width, height }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'visible' },
});
