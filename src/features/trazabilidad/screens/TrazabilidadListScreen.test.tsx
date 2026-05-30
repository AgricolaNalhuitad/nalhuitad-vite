import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TrazabilidadListScreen } from './TrazabilidadListScreen';

vi.mock('../useLotesOrigen', () => ({
  useLotesOrigen: () => ({
    data: [
      {
        id: 'lo-1',
        nombre: 'Milena 23-May',
        variedad: 'Milena',
        fechaSiembra: '2026-05-23',
        bandejas: 6,
        cantidadInicial: 810,
        estado: 'activo',
        createdAt: '',
        createdBy: '',
      },
    ],
    isLoading: false,
    isError: false,
    retry: vi.fn(),
  }),
}));

vi.mock('../useUnidades', () => ({
  useUnidades: () => ({
    data: [
      {
        id: 'up-1',
        refLoteOrigen: 'lo-1',
        ubicacionId: 'INV-D-ALM',
        cantidad: 810,
        etapa: 'almacigo',
        estado: 'activa',
        fechaIngreso: '2026-05-23',
        historial: [],
        createdAt: '',
        createdBy: '',
      },
    ],
    isLoading: false,
    isError: false,
  }),
}));

function renderScreen() {
  return render(
    <MemoryRouter>
      <TrazabilidadListScreen />
    </MemoryRouter>,
  );
}

describe('TrazabilidadListScreen', () => {
  it('lista lotes activos con su UP y enlaces a siembra/detalle/QR', () => {
    renderScreen();

    expect(screen.getByText('Milena 23-May')).toBeInTheDocument();
    expect(screen.getByText('INV-D-ALM')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nueva siembra/i })).toHaveAttribute(
      'href',
      '/trazabilidad/siembra',
    );
    expect(screen.getByRole('link', { name: 'QR' })).toHaveAttribute('href', '/up/up-1/qr');
  });
});
