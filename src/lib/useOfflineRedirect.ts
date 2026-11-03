import { router, useIsFocused } from 'expo-router';
import { useEffect, useRef } from 'react';

import type { RetryOrigin } from './retry';

/**
 * Abre a tela "O caminho pausou" quando uma requisição falha por falta de conexão.
 * Abre uma vez por falha: voltar dessa tela sem tentar de novo não a reabre.
 *
 * @param failure o objeto de estado da falha atual, ou null quando não há falha de conexão
 */
export function useOfflineRedirect(failure: object | null, origin: RetryOrigin) {
  const focused = useIsFocused();
  const shown = useRef<object | null>(null);

  useEffect(() => {
    if (!failure || !focused || shown.current === failure) return;
    shown.current = failure;
    router.push({ pathname: '/sem-conexao', params: { origem: origin } });
  }, [failure, focused, origin]);
}
