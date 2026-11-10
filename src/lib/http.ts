/**
 * Requisições HTTP do Atlas.
 *
 * Tudo que vem da internet passa por aqui, por três motivos:
 * 1. Timeout: se a API demorar demais, a gente desiste e avisa (em vez de girar para sempre).
 * 2. Cancelamento: uma busca antiga é cancelada quando a pessoa digita outra coisa.
 * 3. Erros com nome: cada tela decide o que mostrar a partir do tipo do erro.
 */

export type ApiErrorKind =
  /** Sem internet ou a API não respondeu a tempo → tela "O caminho pausou". */
  | 'offline'
  /** A API respondeu com erro (HTTP 4xx/5xx). */
  | 'server'
  /** A resposta chegou, mas não está no formato esperado. */
  | 'invalid'
  /** Nós mesmos cancelamos (nova busca, tela fechada). Não é mostrado. */
  | 'aborted';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const DEFAULT_TIMEOUT_MS = 10_000;

type Options = {
  /** Sinal de quem chamou, para cancelar de fora. */
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Cabeçalhos extras (ex.: User-Agent exigido pelas APIs do Wikimedia). */
  headers?: Record<string, string>;
};

/** GET que devolve o JSON da resposta (ainda sem validar o formato). */
export async function getJson(
  url: string,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS, headers }: Options = {},
): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const cancelFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancelFromCaller);

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json', ...headers },
      });
    } catch {
      if (timedOut) throw new ApiError('offline', 'A API demorou demais para responder.');
      if (controller.signal.aborted) throw new ApiError('aborted', 'Requisição cancelada.');
      throw new ApiError('offline', 'Sem conexão com a internet.');
    }

    if (!response.ok) {
      throw new ApiError('server', `A API respondeu com o código ${response.status}.`);
    }

    try {
      return await response.json();
    } catch {
      if (timedOut) throw new ApiError('offline', 'A API demorou demais para responder.');
      if (controller.signal.aborted) throw new ApiError('aborted', 'Requisição cancelada.');
      throw new ApiError('invalid', 'A resposta da API não é um JSON válido.');
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancelFromCaller);
  }
}

export function isApiError(error: unknown, kind?: ApiErrorKind): error is ApiError {
  return error instanceof ApiError && (kind === undefined || error.kind === kind);
}
