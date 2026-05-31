import { describe, it, expect } from 'vitest';
import { nombreBase, generarNombreAmigable } from './nombreAmigable';

describe('nombreAmigable', () => {
  describe('nombreBase', () => {
    it('genera "Variedad DD-Mmm" desde fecha ISO', () => {
      expect(nombreBase('Milena', '2026-05-23')).toBe('Milena 23-May');
    });

    it('no rellena el día con cero', () => {
      expect(nombreBase('Milena', '2026-05-03')).toBe('Milena 3-May');
    });
  });

  describe('generarNombreAmigable', () => {
    it('sin colisión devuelve la base sin sufijo (FR-003)', () => {
      expect(generarNombreAmigable('Milena', '2026-05-23', [])).toBe('Milena 23-May');
    });

    it('en colisión asigna el siguiente sufijo #NN disponible', () => {
      expect(generarNombreAmigable('Milena', '2026-05-23', ['Milena 23-May'])).toBe(
        'Milena 23-May #02',
      );
      expect(
        generarNombreAmigable('Milena', '2026-05-23', ['Milena 23-May', 'Milena 23-May #02']),
      ).toBe('Milena 23-May #03');
    });

    it('no colisiona entre variedades distintas el mismo día', () => {
      expect(generarNombreAmigable('Lugano', '2026-05-23', ['Milena 23-May'])).toBe('Lugano 23-May');
    });
  });
});
