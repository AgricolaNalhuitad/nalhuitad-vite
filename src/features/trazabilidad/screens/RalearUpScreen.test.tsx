import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RalearUpScreen } from './RalearUpScreen';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../useUnidad', () => ({
  useUnidad: () => ({
    data: { id: 'up-1', ubicacionId: 'INV-D-ALM', cantidad: 810, estado: 'activa' },
    isLoading: false,
    isError: false,
  }),
}));

const conn = vi.hoisted(() => ({ online: true }));
vi.mock('../useFirestoreConnectivity', () => ({
  useFirestoreConnectivity: () => ({ isOnline: conn.online }),
}));

const ralearMock = vi.fn();
vi.mock('../useTrazabilidadMutations', () => ({
  useRalear: () => ({ mutateAsync: ralearMock, isPending: false }),
}));

// Borrador en memoria (evita acoplar el test a localStorage).
vi.mock('../raleoDraftStore', () => ({
  useRaleoDraftStore: Object.assign(() => () => {}, {
    getState: () => ({ drafts: {} }),
  }),
}));

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/up/up-1/ralear']}>
      <Routes>
        <Route path="/up/:upId/ralear" element={<RalearUpScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  conn.online = true;
  vi.clearAllMocks();
});

describe('RalearUpScreen', () => {
  it('confirma el raleo cuando la suma cuadra (INV-1) y hay conexión', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.selectOptions(screen.getByLabelText(/ubicación destino 1/i), 'INV-A-P01');
    await user.type(screen.getByLabelText(/cantidad destino 1/i), '405');
    await user.click(screen.getByRole('button', { name: /agregar destino/i }));
    await user.selectOptions(screen.getByLabelText(/ubicación destino 2/i), 'INV-A-P02');
    await user.type(screen.getByLabelText(/cantidad destino 2/i), '405');

    const confirmar = screen.getByRole('button', { name: /confirmar raleo/i });
    expect(confirmar).toBeEnabled();
    await user.click(confirmar);

    expect(ralearMock).toHaveBeenCalledWith(
      expect.objectContaining({
        destinos: [
          { ubicacionId: 'INV-A-P01', cantidad: 405 },
          { ubicacionId: 'INV-A-P02', cantidad: 405 },
        ],
      }),
    );
  });

  it('deshabilita confirmar cuando no hay conexión (FR-014)', async () => {
    conn.online = false;
    const user = userEvent.setup();
    renderScreen();

    await user.selectOptions(screen.getByLabelText(/ubicación destino 1/i), 'INV-A-P01');
    await user.type(screen.getByLabelText(/cantidad destino 1/i), '810');

    expect(screen.getByRole('button', { name: /confirmar raleo/i })).toBeDisabled();
  });

  it('advierte capacidad excedida sin bloquear el envío (FR-013)', async () => {
    const user = userEvent.setup();
    renderScreen();

    // INV-A-P01 cap 252; 810 lo excede.
    await user.selectOptions(screen.getByLabelText(/ubicación destino 1/i), 'INV-A-P01');
    await user.type(screen.getByLabelText(/cantidad destino 1/i), '810');

    expect(screen.getByText(/excede la capacidad/i)).toBeInTheDocument();
    // Suma cuadra (810) y hay conexión → confirmar sigue habilitado pese a la advertencia.
    expect(screen.getByRole('button', { name: /confirmar raleo/i })).toBeEnabled();
  });
});
