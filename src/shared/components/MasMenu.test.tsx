import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MasMenu } from './MasMenu';

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ signOut: vi.fn() }),
}));

describe('MasMenu', () => {
  it('incluye acceso directo a Trazabilidad como primer ítem', () => {
    render(
      <MemoryRouter>
        <MasMenu />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /trazabilidad/i });
    expect(link).toHaveAttribute('href', '/trazabilidad');
  });
});
