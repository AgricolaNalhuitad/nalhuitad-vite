import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as useLotMutationsModule from './useLotMutations';
import { RaleoSheet } from './RaleoSheet';
import type { Lot } from './types';

vi.mock('./useLotMutations');

const fakeLot: Lot = {
  id: 'lot1', name: 'Milena', date: '2026-01-01', stage: 'raleo',
  variety: '', quantity: 10, currentQuantity: 2500, location: null,
  stageHistory: [], raleos: [], childrenIds: [],
};

function makeWrapper() {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe('RaleoSheet', () => {
  beforeEach(() => {
    vi.mocked(useLotMutationsModule.useRegisterRaleo).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useLotMutationsModule.useRegisterRaleo>);
  });

  it('renderiza sin crash', () => {
    render(
      <RaleoSheet lot={fakeLot} onClose={vi.fn()} />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getAllByText(/Registrar raleo/i)[0]).toBeInTheDocument();
  });

  it('muestra la cantidad actual disponible', () => {
    render(
      <RaleoSheet lot={fakeLot} onClose={vi.fn()} />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/2\.500|2500/)).toBeInTheDocument();
  });

  it('botón cancelar llama onClose', () => {
    const onClose = vi.fn();
    render(
      <RaleoSheet lot={fakeLot} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    screen.getByRole('button', { name: /cancelar/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
