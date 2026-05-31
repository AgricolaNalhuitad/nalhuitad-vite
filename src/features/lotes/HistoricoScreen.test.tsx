import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoricoScreen } from './HistoricoScreen';

vi.mock('./useLotes', () => ({
  useLotes: () => ({
    data: [
      {
        id: 'l1',
        name: 'Milena vieja',
        variety: 'Milena',
        stage: 'cosecha',
        quantity: 270,
        currentQuantity: 210,
        date: '2026-01-10',
        location: null,
        stageHistory: [],
        raleos: [],
        childrenIds: [],
      },
    ],
    isLoading: false,
    isError: false,
    retry: vi.fn(),
  }),
}));

describe('HistoricoScreen', () => {
  it('lista lotes legacy en modo solo lectura, sin acciones de mutación', () => {
    render(<HistoricoScreen />);

    expect(screen.getByText(/solo lectura/i)).toBeInTheDocument();
    expect(screen.getByText('Milena vieja')).toBeInTheDocument();
    expect(screen.getByText(/Milena · 210 plantas · 2026-01-10/)).toBeInTheDocument();

    // No expone mutaciones (avanzar etapa / ralear / cosechar / editar).
    expect(
      screen.queryByRole('button', { name: /avanzar|ralear|cosechar|editar|guardar/i }),
    ).toBeNull();
  });
});
