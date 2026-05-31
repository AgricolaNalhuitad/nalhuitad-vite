import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CosecharUpScreen } from './CosecharUpScreen';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../useUnidad', () => ({
  useUnidad: () => ({
    data: { id: 'up-1', ubicacionId: 'INV-A-P01', cantidad: 270, estado: 'activa' },
    isLoading: false,
    isError: false,
  }),
}));

const cosecharMock = vi.fn();
vi.mock('../useTrazabilidadMutations', () => ({
  useCosechar: () => ({ mutateAsync: cosecharMock, isPending: false }),
}));

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/up/up-1/cosechar']}>
      <Routes>
        <Route path="/up/:upId/cosechar" element={<CosecharUpScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CosecharUpScreen', () => {
  it('convierte paquetes a lechugas (×2) y registra la cosecha', async () => {
    cosecharMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderScreen();

    await user.type(screen.getByLabelText(/paquetes/i), '100');
    expect(screen.getByText(/200 lechugas/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /registrar cosecha/i }));

    await waitFor(() => {
      expect(cosecharMock).toHaveBeenCalledWith(expect.objectContaining({ paquetes: 100 }));
    });
    expect(navigateMock).toHaveBeenCalledWith('/up/up-1');
  });

  it('deshabilita confirmar cuando la cosecha excede lo disponible (INV-4)', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.type(screen.getByLabelText(/paquetes/i), '140'); // 280 > 270

    expect(screen.getByText(/excede lo disponible/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar cosecha/i })).toBeDisabled();
    expect(cosecharMock).not.toHaveBeenCalled();
  });
});
