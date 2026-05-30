import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QrPrintScreen } from './QrPrintScreen';

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

function renderAt(path = '/up/up-1/qr') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/up/:upId/qr" element={<QrPrintScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('QrPrintScreen', () => {
  it('muestra el QR imprimible de la UP resuelta vía su lote', () => {
    renderAt();

    expect(screen.getByRole('img', { name: /QR de Milena 23-May/i })).toBeInTheDocument();
    expect(screen.getByText('Milena 23-May')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /imprimir/i })).toBeInTheDocument();
  });
});
