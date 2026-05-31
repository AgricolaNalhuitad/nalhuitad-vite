import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UpDetailScreen } from './UpDetailScreen';

vi.mock('../useUnidad', () => ({
  useUnidad: () => ({
    data: {
      id: 'up-1',
      refLoteOrigen: 'lo-1',
      ubicacionId: 'INV-C-P01',
      cantidad: 810,
      etapa: 'transplante',
      estado: 'activa',
      fechaIngreso: '2026-05-30',
      historial: [
        { fecha: '2026-05-23', tipoAccion: 'creacion', cantidad: 810 },
        {
          fecha: '2026-05-30',
          tipoAccion: 'traslado',
          ubicacionPrevia: 'INV-D-ALM',
          ubicacionNueva: 'INV-C-P01',
        },
      ],
      createdAt: '',
      createdBy: '',
    },
    isLoading: false,
    isError: false,
  }),
}));

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
  }),
}));

function renderAt(path = '/up/up-1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/up/:upId" element={<UpDetailScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('UpDetailScreen', () => {
  it('muestra genealogía (lote), historial embebido y la acción de trasladar', () => {
    renderAt();

    expect(screen.getByText('Milena 23-May')).toBeInTheDocument(); // genealogía → LO
    expect(screen.getByText('Traslado')).toBeInTheDocument(); // historial
    expect(screen.getByText('Creación')).toBeInTheDocument(); // historial
    expect(screen.getByText('INV-D-ALM → INV-C-P01')).toBeInTheDocument(); // detalle traslado

    expect(screen.getByRole('link', { name: 'Trasladar' })).toHaveAttribute(
      'href',
      '/up/up-1/trasladar',
    );
  });
});
