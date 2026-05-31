import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TrasladarUpScreen } from './TrasladarUpScreen';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../useUnidad', () => ({
  useUnidad: () => ({
    data: { id: 'up-1', ubicacionId: 'INV-D-ALM', estado: 'activa' },
    isLoading: false,
    isError: false,
  }),
}));

const trasladarMock = vi.fn();
vi.mock('../useTrazabilidadMutations', () => ({
  useTrasladar: () => ({ mutateAsync: trasladarMock, isPending: false }),
}));

function renderAt() {
  return render(
    <MemoryRouter initialEntries={['/up/up-1/trasladar']}>
      <Routes>
        <Route path="/up/:upId/trasladar" element={<TrasladarUpScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TrasladarUpScreen', () => {
  it('traslada a la ubicación elegida y vuelve al detalle de la UP', async () => {
    trasladarMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderAt();

    await user.selectOptions(screen.getByLabelText(/destino/i), 'INV-C-P01');
    await user.click(screen.getByRole('button', { name: /trasladar/i }));

    await waitFor(() => {
      expect(trasladarMock).toHaveBeenCalledWith(
        expect.objectContaining({ ubicacionDestinoId: 'INV-C-P01' }),
      );
    });
    expect(navigateMock).toHaveBeenCalledWith('/up/up-1');
  });

  it('exige elegir un destino antes de enviar', async () => {
    const user = userEvent.setup();
    renderAt();

    await user.click(screen.getByRole('button', { name: /trasladar/i }));

    expect(trasladarMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
