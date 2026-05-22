import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useLotMutationsModule from './useLotMutations';
import { AdvanceStageSheet } from './AdvanceStageSheet';
import type { Lot } from './types';

vi.mock('./useLotMutations');

const fakeLot: Lot = {
  id: 'lot1', name: 'Milena', date: '2026-01-01', stage: 'almacigo',
  variety: '', quantity: 10, currentQuantity: 1350, location: null,
  stageHistory: [], raleos: [], childrenIds: [],
};

function makeWrapper() {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe('AdvanceStageSheet', () => {
  beforeEach(() => {
    vi.mocked(useLotMutationsModule.useAdvanceStage).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useLotMutationsModule.useAdvanceStage>);
  });

  it('renderiza sin crash', () => {
    render(
      <AdvanceStageSheet lot={fakeLot} onClose={vi.fn()} />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getAllByText(/Avanzar a/)[0]).toBeInTheDocument();
  });

  it('muestra el next stage correcto (almacigo → transplante)', () => {
    render(
      <AdvanceStageSheet lot={fakeLot} onClose={vi.fn()} />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getAllByText(/Transplante/i)[0]).toBeInTheDocument();
  });

  it('botón cancelar llama onClose', () => {
    const onClose = vi.fn();
    render(
      <AdvanceStageSheet lot={fakeLot} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    screen.getByRole('button', { name: /cancelar/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
