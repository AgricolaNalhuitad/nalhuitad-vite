import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LotesDashboard } from './LotesDashboard';
import type { Lot } from './types';

const makeLot = (overrides: Partial<Lot>): Lot => ({
  id: 'x', name: 'Test', date: '2026-01-01', stage: 'almacigo',
  variety: '', quantity: 10, currentQuantity: 1350, location: null,
  stageHistory: [], raleos: [], childrenIds: [], ...overrides,
});

describe('LotesDashboard', () => {
  it('renderiza sin crash con lotes activos', () => {
    const lots = [
      makeLot({ id: '1', stage: 'almacigo',    currentQuantity: 1000 }),
      makeLot({ id: '2', stage: 'transplante', currentQuantity: 500  }),
    ];
    render(<LotesDashboard lots={lots} />);
    expect(screen.getByText('Total en producción')).toBeInTheDocument();
  });

  it('muestra el conteo de lotes activos', () => {
    const lots = [makeLot({ id: '1' }), makeLot({ id: '2' })];
    render(<LotesDashboard lots={lots} />);
    expect(screen.getByText(/2 lotes activos/)).toBeInTheDocument();
  });

  it('muestra "Capacidad instalada"', () => {
    render(<LotesDashboard lots={[makeLot({ id: '1' })]} />);
    expect(screen.getByText('Capacidad instalada')).toBeInTheDocument();
  });

  it('renderiza sin crash con array vacío', () => {
    render(<LotesDashboard lots={[]} />);
    expect(screen.getByText('Total en producción')).toBeInTheDocument();
  });
});
