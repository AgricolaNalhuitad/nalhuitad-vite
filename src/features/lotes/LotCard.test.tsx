import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LotCard } from './LotCard';
import type { Lot } from './types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const fakeLot: Lot = {
  id: 'lot1',
  name: 'Milena Norte',
  date: '2026-01-15',
  stage: 'almacigo',
  variety: 'Milena',
  quantity: 21,
  currentQuantity: 2700,
  location: { invernadero: 'A', tipo: 'piscina', identificador: 'P01' },
  stageHistory: [{ stage: 'almacigo', date: '2026-01-15' }],
  raleos: [],
  childrenIds: [],
};

function renderCard(lot: Lot = fakeLot) {
  return render(
    <MemoryRouter>
      <LotCard lot={lot} />
    </MemoryRouter>,
  );
}

describe('LotCard', () => {
  it('renderiza el nombre del lote', () => {
    renderCard();
    expect(screen.getByText('Milena Norte')).toBeInTheDocument();
  });

  it('renderiza la etiqueta de etapa', () => {
    renderCard();
    expect(screen.getByText('Almácigo')).toBeInTheDocument();
  });

  it('renderiza la ubicación', () => {
    renderCard();
    expect(screen.getByText(/INV-A/)).toBeInTheDocument();
    expect(screen.getByText(/P01/)).toBeInTheDocument();
  });

  it('renderiza "Sembrado" con la fecha', () => {
    renderCard();
    expect(screen.getByText(/Sembrado/)).toBeInTheDocument();
  });

  it('renderiza los stats de plantas', () => {
    renderCard();
    expect(screen.getByText('Sembradas')).toBeInTheDocument();
    expect(screen.getByText('En producción')).toBeInTheDocument();
  });

  it('navega a /lotes/:id al hacer click', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/lotes/lot1');
  });

  it('omite ubicación si location es null', () => {
    renderCard({ ...fakeLot, location: null });
    expect(screen.queryByText(/INV-/)).toBeNull();
  });
});
