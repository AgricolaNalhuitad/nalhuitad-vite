import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as lotApiModule from './lotApi';
import { useLot } from './useLot';
import type { Lot } from './types';

vi.mock('./lotApi');

const fakeLot: Lot = {
  id: 'lot1',
  name: 'Milena Norte',
  date: '2026-01-01',
  stage: 'almacigo',
  variety: '',
  quantity: 10,
  currentQuantity: 1350,
  location: null,
  stageHistory: [{ stage: 'almacigo', date: '2026-01-01' }],
  raleos: [],
  childrenIds: [],
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe('useLot', () => {
  let capturedOnData: ((lot: Lot | null) => void) | null = null;
  let capturedOnError: ((err: Error) => void) | null = null;
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.mocked(lotApiModule.subscribeLot).mockImplementation(
      (_id, onData, onError) => {
        capturedOnData = onData;
        capturedOnError = onError as (err: Error) => void;
        return mockUnsubscribe;
      },
    );
  });

  afterEach(() => {
    capturedOnData = null;
    capturedOnError = null;
  });

  it('estado inicial: isLoading true, sin data ni error', () => {
    const { result } = renderHook(() => useLot('lot1'), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.lot).toBeUndefined();
    expect(result.current.isError).toBe(false);
  });

  it('data disponible tras snapshot simulado', () => {
    const { result } = renderHook(() => useLot('lot1'), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnData!(fakeLot);
    });
    expect(result.current.lot).toEqual(fakeLot);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('lot es null cuando el doc no existe en Firestore', () => {
    const { result } = renderHook(() => useLot('lot-gone'), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnData!(null);
    });
    expect(result.current.lot).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('isError tras error simulado', () => {
    const { result } = renderHook(() => useLot('lot1'), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnError!(new Error('permission-denied'));
    });
    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('retry reinicia la suscripción', () => {
    const { result } = renderHook(() => useLot('lot1'), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnError!(new Error('network'));
    });
    expect(result.current.isError).toBe(true);

    act(() => {
      result.current.retry();
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(vi.mocked(lotApiModule.subscribeLot)).toHaveBeenCalledTimes(2);
  });

  it('cleanup: invoca unsubscribe al desmontar', () => {
    const { unmount } = renderHook(() => useLot('lot1'), {
      wrapper: makeWrapper(),
    });
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('suscripción cambia cuando cambia el id', () => {
    const { rerender } = renderHook(({ id }) => useLot(id), {
      wrapper: makeWrapper(),
      initialProps: { id: 'lot1' },
    });
    const callsBefore = vi.mocked(lotApiModule.subscribeLot).mock.calls.length;
    rerender({ id: 'lot2' });
    expect(vi.mocked(lotApiModule.subscribeLot).mock.calls.length).toBe(callsBefore + 1);
  });
});
