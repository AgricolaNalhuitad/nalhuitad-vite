import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as useLotMutationsModule from './useLotMutations';
import { CreateLotScreen } from './CreateLotScreen';

vi.mock('./useLotMutations');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeWrapper() {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, createElement(MemoryRouter, {}, children));
}

describe('CreateLotScreen', () => {
  beforeEach(() => {
    vi.mocked(useLotMutationsModule.useCreateLot).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue('new-id'),
      isPending: false,
    } as unknown as ReturnType<typeof useLotMutationsModule.useCreateLot>);
  });

  it('renderiza el formulario', () => {
    render(<CreateLotScreen />, { wrapper: makeWrapper() });
    expect(screen.getByText('Nuevo lote')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/variedad/i)).toBeInTheDocument();
  });

  it('muestra botón "Crear lote"', () => {
    render(<CreateLotScreen />, { wrapper: makeWrapper() });
    expect(screen.getByRole('button', { name: /crear lote/i })).toBeInTheDocument();
  });

  it('botón cancelar navega a /lotes', () => {
    render(<CreateLotScreen />, { wrapper: makeWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/lotes');
  });
});
