import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as lotesApiModule from './lotesApi';
import { useLotes } from './useLotes';
import type { Lot } from './types';

vi.mock('./lotesApi');

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

describe('useLotes', () => {
  let capturedOnData: ((lots: Lot[]) => void) | null = null;
  let capturedOnError: ((err: Error) => void) | null = null;
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.mocked(lotesApiModule.subscribeLotes).mockImplementation(
      (onData, onError) => {
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
    const { result } = renderHook(() => useLotes(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);
  });

  it('data disponible tras snapshot simulado', () => {
    const { result } = renderHook(() => useLotes(), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnData!([fakeLot]);
    });
    expect(result.current.data).toEqual([fakeLot]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('isError tras error simulado', () => {
    const { result } = renderHook(() => useLotes(), {
      wrapper: makeWrapper(),
    });
    act(() => {
      capturedOnError!(new Error('permission-denied'));
    });
    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('retry reinicia la suscripción', () => {
    const { result } = renderHook(() => useLotes(), {
      wrapper: makeWrapper(),
    });
    // simular error
    act(() => {
      capturedOnError!(new Error('network'));
    });
    expect(result.current.isError).toBe(true);

    // llamar retry → debe volver a isLoading
    act(() => {
      result.current.retry();
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    // subscribeLotes se llamó dos veces (mount + retry)
    expect(vi.mocked(lotesApiModule.subscribeLotes)).toHaveBeenCalledTimes(2);
  });

  it('cleanup: invoca unsubscribe al desmontar', () => {
    const { unmount } = renderHook(() => useLotes(), {
      wrapper: makeWrapper(),
    });
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
