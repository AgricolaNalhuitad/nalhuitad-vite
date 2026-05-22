import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as useLotMutationsModule from './useLotMutations';
import { HarvestSheet } from './HarvestSheet';

vi.mock('./useLotMutations');

function makeWrapper() {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe('HarvestSheet', () => {
  beforeEach(() => {
    vi.mocked(useLotMutationsModule.useRegisterHarvest).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useLotMutationsModule.useRegisterHarvest>);
  });

  it('renderiza sin crash', () => {
    render(
      <HarvestSheet lotId="lot1" onClose={vi.fn()} />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/Confirmar cosecha/i)).toBeInTheDocument();
  });

  it('botón cancelar llama onClose', () => {
    const onClose = vi.fn();
    render(
      <HarvestSheet lotId="lot1" onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    screen.getByRole('button', { name: /cancelar/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
