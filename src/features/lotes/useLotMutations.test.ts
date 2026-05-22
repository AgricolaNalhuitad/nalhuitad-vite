import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as lotApiModule from './lotApi';
import {
  useCreateLot,
  useUpdateLot,
  useAdvanceStage,
  useRegisterHarvest,
  useRegisterRaleo,
} from './useLotMutations';
import type { AdvanceStageInput, HarvestInput, NewLotInput, RaleoInput, UpdateLotInput } from './types';

vi.mock('./lotApi');

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe('useCreateLot', () => {
  it('llama createLot y retorna el id creado', async () => {
    vi.mocked(lotApiModule.createLot).mockResolvedValue('new-lot-id');

    const { result } = renderHook(() => useCreateLot(), { wrapper: makeWrapper() });
    let returnedId: string | undefined;

    await act(async () => {
      returnedId = await result.current.mutateAsync({
        name: 'Test', variety: 'Milena', date: '2026-01-01', quantity: 10,
        location: { invernadero: 'A', tipo: 'piscina', identificador: 'P01' },
      } satisfies NewLotInput);
    });

    expect(vi.mocked(lotApiModule.createLot)).toHaveBeenCalledOnce();
    expect(returnedId).toBe('new-lot-id');
  });
});

describe('useUpdateLot', () => {
  it('llama updateLot con el id y el input', async () => {
    vi.mocked(lotApiModule.updateLot).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateLot('lot1'), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ name: 'Nuevo nombre' } satisfies UpdateLotInput);
    });

    expect(vi.mocked(lotApiModule.updateLot)).toHaveBeenCalledWith('lot1', { name: 'Nuevo nombre' });
  });
});

describe('useAdvanceStage', () => {
  it('llama advanceStage con el id y el input', async () => {
    vi.mocked(lotApiModule.advanceStage).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAdvanceStage('lot1'), { wrapper: makeWrapper() });

    const input: AdvanceStageInput = { newStage: 'transplante', date: '2026-02-01' };
    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(vi.mocked(lotApiModule.advanceStage)).toHaveBeenCalledWith('lot1', input);
  });
});

describe('useRegisterHarvest', () => {
  it('llama registerHarvest con el id y el input', async () => {
    vi.mocked(lotApiModule.registerHarvest).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRegisterHarvest('lot1'), { wrapper: makeWrapper() });

    const input: HarvestInput = { date: '2026-04-01' };
    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(vi.mocked(lotApiModule.registerHarvest)).toHaveBeenCalledWith('lot1', input);
  });
});

describe('useRegisterRaleo', () => {
  it('llama registerRaleo con el id, currentQuantity y el input', async () => {
    vi.mocked(lotApiModule.registerRaleo).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useRegisterRaleo('lot1', 2500),
      { wrapper: makeWrapper() },
    );

    const input: RaleoInput = { cantidadRaleada: 300, fecha: '2026-03-01' };
    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(vi.mocked(lotApiModule.registerRaleo)).toHaveBeenCalledWith('lot1', 2500, input);
  });
});
