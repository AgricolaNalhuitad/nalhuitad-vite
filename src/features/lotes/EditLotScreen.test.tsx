import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as useLotModule from './useLot';
import * as useLotMutationsModule from './useLotMutations';
import { EditLotScreen } from './EditLotScreen';
import type { Lot } from './types';

vi.mock('./useLot');
vi.mock('./useLotMutations');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const fakeLot: Lot = {
  id: 'lot1', name: 'Milena Norte', date: '2026-01-01', stage: 'almacigo',
  variety: 'Milena', quantity: 21, currentQuantity: 2700,
  location: { invernadero: 'A', tipo: 'piscina', identificador: 'P01' },
  stageHistory: [], raleos: [], childrenIds: [],
};

function makeWrapper() {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    createElement(
      QueryClientProvider, { client: qc },
      createElement(MemoryRouter, { initialEntries: ['/lotes/lot1/editar'] },
        createElement(Routes, {},
          createElement(Route, { path: '/lotes/:id/editar', element: children as React.ReactElement })
        )
      )
    );
}

describe('EditLotScreen', () => {
  beforeEach(() => {
    vi.mocked(useLotModule.useLot).mockReturnValue({
      lot: fakeLot, isLoading: false, isError: false, error: null, retry: vi.fn(),
    } as ReturnType<typeof useLotModule.useLot>);
    vi.mocked(useLotMutationsModule.useUpdateLot).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useLotMutationsModule.useUpdateLot>);
  });

  it('renderiza el formulario con datos pre-llenados', () => {
    render(<EditLotScreen />, { wrapper: makeWrapper() });
    expect(screen.getByDisplayValue('Milena Norte')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Milena')).toBeInTheDocument();
  });

  it('muestra el botón "Guardar cambios"', () => {
    render(<EditLotScreen />, { wrapper: makeWrapper() });
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it('botón cancelar navega a /lotes/:id', () => {
    render(<EditLotScreen />, { wrapper: makeWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/lotes/lot1');
  });

  it('muestra skeleton si isLoading', () => {
    vi.mocked(useLotModule.useLot).mockReturnValue({
      lot: undefined, isLoading: true, isError: false, error: null, retry: vi.fn(),
    } as ReturnType<typeof useLotModule.useLot>);
    render(<EditLotScreen />, { wrapper: makeWrapper() });
    expect(document.querySelector('[data-testid="edit-skeleton"]')).toBeInTheDocument();
  });
});
