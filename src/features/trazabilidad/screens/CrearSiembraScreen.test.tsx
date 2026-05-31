import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CrearSiembraScreen } from './CrearSiembraScreen';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const createSiembraMock = vi.fn();
vi.mock('../lotesOrigenApi', () => ({
  createSiembra: (input: unknown) => createSiembraMock(input),
  subscribeLotesOrigen: () => () => {},
  subscribeLoteOrigen: () => () => {},
}));

function renderScreen() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <CrearSiembraScreen />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CrearSiembraScreen', () => {
  it('muestra el formulario con variedad Milena por defecto (FR-001)', () => {
    renderScreen();
    expect(screen.getByLabelText(/variedad/i)).toHaveValue('Milena');
    expect(screen.getByLabelText(/bandejas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument();
  });

  it('crea la siembra y navega al QR imprimible de la UP', async () => {
    createSiembraMock.mockResolvedValue({ loteOrigenId: 'lo-1', upId: 'up-1' });
    const user = userEvent.setup();
    renderScreen();

    const bandejas = screen.getByLabelText(/bandejas/i);
    await user.clear(bandejas);
    await user.type(bandejas, '6');
    await user.click(screen.getByRole('button', { name: /sembrar/i }));

    await waitFor(() => {
      expect(createSiembraMock).toHaveBeenCalledWith(
        expect.objectContaining({ variedad: 'Milena', bandejas: 6 }),
      );
    });
    expect(navigateMock).toHaveBeenCalledWith('/up/up-1/qr');
  });

  it('valida bandejas > 0 antes de enviar', async () => {
    const user = userEvent.setup();
    renderScreen();

    const bandejas = screen.getByLabelText(/bandejas/i);
    await user.clear(bandejas);
    await user.type(bandejas, '0');
    await user.click(screen.getByRole('button', { name: /sembrar/i }));

    expect(createSiembraMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
