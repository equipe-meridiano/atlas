import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { featured } from '@/data/place';
import { FavoritesProvider, STORAGE_KEY, useFavorites } from '../favorites';

function wrapper({ children }: { children: ReactNode }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}

/** Leitura do armazenamento que só termina quando o teste mandar. */
function deferredRead(value: string | null) {
  let finish: () => void = () => {};
  jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(
    () => new Promise((resolve) => (finish = () => resolve(value))),
  );
  return () => finish();
}

beforeEach(async () => {
  // As funções do mock do AsyncStorage já são jest.fn: limpa o histórico de chamadas entre testes.
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('FavoritesProvider', () => {
  it('não perde o que foi salvo antes de terminar a leitura', async () => {
    const finishRead = deferredRead(JSON.stringify([featured.discover]));
    const { result } = await renderHook(() => useFavorites(), { wrapper });

    expect(result.current.ready).toBe(false);
    await act(() => result.current.toggle(featured.hero));
    await act(async () => finishRead());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.places.map((p) => p.id)).toEqual([featured.hero.id, featured.discover.id]);
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? '[]')).toHaveLength(2),
    );
  });

  it('não apaga o armazenamento quando a leitura falha', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([featured.hero]));
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('falhou'));
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    setItem.mockClear(); // descarta a gravação de preparação acima

    const { result } = await renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(() => result.current.toggle(featured.discover));

    expect(result.current.storageError).toBe(true);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('avisa quando a gravação falha', async () => {
    // Duas gravações: a da abertura e a do toque em "Salvar".
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error('disco cheio'))
      .mockRejectedValueOnce(new Error('disco cheio'));
    const { result } = await renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(() => result.current.toggle(featured.hero));
    await waitFor(() => expect(result.current.storageError).toBe(true));
    expect(result.current.isSaved(featured.hero.id)).toBe(true);
  });
});
