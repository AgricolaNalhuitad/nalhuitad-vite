import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as useLotesModule from './useLotes';
import { LotesScreen } from './LotesScreen';
import type { Lot } from './types';

vi.mock('./useLotes');

const makeLot = (overrides: Partial<Lot>): Lot => ({
  id: 'x', name: 'Test', date: '2026-01-01', stage: 'almacigo',
  variety: '', quantity: 10, currentQuantity: 1350, location: null,
  stageHistory: [{ stage: 'almacigo', date: '2026-01-01' }],
  raleos: [], childrenIds: [], ...overrides,
});

const mockRetry = vi.fn();

function mockHook(overrides: Partial<ReturnType<typeof useLotesModule.useLotes>>) {
  vi.mocked(useLotesModule.useLotes).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    retry: mockRetry,
    ...overrides,
  } as ReturnType<typeof useLotesModule.useLotes>);
}

function renderScreen() {
  return render(
    <MemoryRouter>
      <LotesScreen />
    </MemoryRouter>,
  );
}

describe('LotesScreen', () => {
  it('muestra skeletons cuando isLoading', () => {
    mockHook({ isLoading: true });
    renderScreen();
    const skeletons = document.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBe(3);
  });

  it('muestra EmptyState cuando data es array vacío', () => {
    mockHook({ data: [] });
    renderScreen();
    expect(screen.getByText('Sin lotes registrados')).toBeInTheDocument();
  });

  it('muestra ErrorState cuando isError', () => {
    mockHook({ isError: true });
    renderScreen();
    expect(screen.getByText('No pudimos cargar los lotes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('muestra dashboard y lista de lotes activos', () => {
    const lots = [
      makeLot({ id: '1', name: 'Lote A', stage: 'almacigo' }),
      makeLot({ id: '2', name: 'Lote B', stage: 'raleo'    }),
    ];
    mockHook({ data: lots });
    renderScreen();
    expect(screen.getByText('Total en producción')).toBeInTheDocument();
    expect(screen.getByText('Lote A')).toBeInTheDocument();
    expect(screen.getByText('Lote B')).toBeInTheDocument();
  });

  it('muestra sección cosechados si hay lotes cosechados', () => {
    const lots = [
      makeLot({ id: '1', name: 'Activo',    stage: 'raleo'   }),
      makeLot({ id: '2', name: 'Cosechado', stage: 'cosecha',
        stageHistory: [{ stage: 'cosecha', date: '2026-03-01' }] }),
    ];
    mockHook({ data: lots });
    renderScreen();
    expect(screen.getByText(/Cosechados/)).toBeInTheDocument();
    expect(screen.getByText('Cosechado')).toBeInTheDocument();
  });
});
