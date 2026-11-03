import { ApiError, getJson } from '../http';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.useRealTimers();
});

function mockFetch(implementation: (url: string, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = jest.fn(implementation) as unknown as typeof fetch;
}

/** fetch falso que só termina quando o sinal é cancelado, como uma rede travada. */
function hangingFetch() {
  mockFetch(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('AbortError')));
      }),
  );
}

async function kindOf(promise: Promise<unknown>) {
  try {
    await promise;
    return 'ok';
  } catch (error) {
    return error instanceof ApiError ? error.kind : 'outro';
  }
}

describe('getJson', () => {
  it('devolve o JSON quando a resposta é boa', async () => {
    mockFetch(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await expect(getJson('https://exemplo.test')).resolves.toEqual({ ok: true });
  });

  it('classifica falha de rede como offline', async () => {
    mockFetch(async () => {
      throw new TypeError('Network request failed');
    });
    expect(await kindOf(getJson('https://exemplo.test'))).toBe('offline');
  });

  it('classifica timeout como offline', async () => {
    jest.useFakeTimers();
    hangingFetch();
    const request = kindOf(getJson('https://exemplo.test', { timeoutMs: 1000 }));
    jest.advanceTimersByTime(1000);
    expect(await request).toBe('offline');
  });

  it('distingue cancelamento de erro', async () => {
    hangingFetch();
    const controller = new AbortController();
    const request = kindOf(getJson('https://exemplo.test', { signal: controller.signal }));
    controller.abort();
    expect(await request).toBe('aborted');
  });

  it('classifica HTTP 500 como erro do servidor e JSON quebrado como inválido', async () => {
    mockFetch(async () => new Response('falhou', { status: 500 }));
    expect(await kindOf(getJson('https://exemplo.test'))).toBe('server');
    mockFetch(async () => new Response('não é json', { status: 200 }));
    expect(await kindOf(getJson('https://exemplo.test'))).toBe('invalid');
  });
});
