import { act, renderHook } from '@testing-library/react-native';

import { SEARCH_DEBOUNCE_MS } from '../useDebouncedValue';
import { useCitySearch } from '../useCitySearch';

const originalFetch = globalThis.fetch;

const reykjavik = {
  id: 3413829,
  name: 'Reykjavík',
  latitude: 64.13548,
  longitude: -21.89541,
  feature_code: 'PPLC',
  timezone: 'Atlantic/Reykjavik',
  country: 'Islândia',
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.useRealTimers();
});

/** Avança o debounce e deixa as promessas da requisição terminarem. */
async function settle() {
  await act(async () => {
    jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
  });
  await act(async () => {});
}

describe('useCitySearch', () => {
  it('fica parado com menos de 2 letras', async () => {
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
    const { result } = await renderHook(() => useCitySearch('R'));
    await settle();
    expect(result.current.state).toEqual({ status: 'idle' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('busca depois do debounce e mostra os resultados', async () => {
    globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ results: [reykjavik] }))) as typeof fetch;
    const { result, rerender } = await renderHook(({ text }: { text: string }) => useCitySearch(text), {
      initialProps: { text: '' },
    });

    await rerender({ text: 'Reyk' });
    await settle();

    expect(result.current.state.status).toBe('success');
    if (result.current.state.status === 'success') {
      expect(result.current.state.results[0].id).toBe('3413829');
    }
  });

  it('marca falta de conexão e refaz a busca no retry', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch;
    const { result } = await renderHook(() => useCitySearch('Reyk'));
    await settle();
    expect(result.current.state.status).toBe('offline');

    let respond: () => void = () => {};
    globalThis.fetch = jest.fn(
      () => new Promise<Response>((resolve) => (respond = () => resolve(new Response(JSON.stringify({}))))),
    ) as typeof fetch;
    await act(() => result.current.retry());
    expect(result.current.state.status).toBe('loading');

    await act(async () => respond());
    expect(result.current.state).toEqual({ status: 'empty', query: 'Reyk' });
  });
});
