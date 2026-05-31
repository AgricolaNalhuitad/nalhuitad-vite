import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrintableQr } from './PrintableQr';

describe('PrintableQr', () => {
  it('muestra el QR accesible y los datos del lote (FR-020)', () => {
    render(
      <PrintableQr
        upId="up-1"
        nombre="Milena 23-May"
        variedad="Milena"
        fechaSiembra="2026-05-23"
      />,
    );

    expect(screen.getByRole('img', { name: /QR de Milena 23-May/i })).toBeInTheDocument();
    expect(screen.getByText('Milena 23-May')).toBeInTheDocument();
    expect(screen.getByText('Milena')).toBeInTheDocument();
    expect(screen.getByText('2026-05-23')).toBeInTheDocument();
  });
});
