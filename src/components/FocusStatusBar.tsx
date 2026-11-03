import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Barra de status (relógio, bateria) clara ou escura conforme o fundo da tela.
 * Só a tela visível define a cor, para uma tela escondida não sobrescrever a outra.
 */
export function FocusStatusBar({ style }: { style: 'light' | 'dark' }) {
  const focused = useIsFocused();
  return focused ? <StatusBar style={style} /> : null;
}
