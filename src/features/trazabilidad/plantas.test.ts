import { describe, it, expect } from 'vitest';
import {
  LECHUGAS_POR_BANDEJA,
  LECHUGAS_POR_PAQUETE,
  bandejasALechugas,
  paquetesALechugas,
  calcularCurrentQuantity,
  validarSumaRaleo,
} from './plantas';
import type { EventoHistorial } from './types';

function evento(partial: Partial<EventoHistorial>): EventoHistorial {
  return {
    id: 'e',
    upId: 'u1',
    loteOrigenId: 'l1',
    fecha: '2026-05-01',
    tipoAccion: 'descarte',
    ...partial,
  };
}

describe('plantas', () => {
  describe('bandejasALechugas', () => {
    it('multiplica bandejas por 135 (valor canónico FR-004)', () => {
      expect(LECHUGAS_POR_BANDEJA).toBe(135);
      expect(bandejasALechugas(6)).toBe(810);
    });
  });

  describe('paquetesALechugas', () => {
    it('multiplica paquetes por 2 (FR-015)', () => {
      expect(LECHUGAS_POR_PAQUETE).toBe(2);
      expect(paquetesALechugas(100)).toBe(200);
    });
  });

  describe('calcularCurrentQuantity', () => {
    it('resta la suma de descartes a la cantidad inicial (FR-031)', () => {
      const eventos = [
        evento({ id: 'e1', cantidadDescartada: 10 }),
        evento({ id: 'e2', cantidadDescartada: 5 }),
      ];
      expect(calcularCurrentQuantity(210, eventos)).toBe(195);
    });

    it('devuelve la cantidad inicial cuando no hay descartes', () => {
      const eventos = [evento({ id: 'e1', tipoAccion: 'creacion', cantidadDescartada: undefined })];
      expect(calcularCurrentQuantity(540, eventos)).toBe(540);
    });
  });

  describe('validarSumaRaleo', () => {
    it('ok cuando la suma de destinos iguala la cantidad disponible (INV-1/FR-009)', () => {
      const r = validarSumaRaleo(540, [{ cantidad: 200 }, { cantidad: 240 }, { cantidad: 100 }]);
      expect(r.ok).toBe(true);
      expect(r.diferencia).toBe(0);
    });

    it('falla y reporta la diferencia cuando la suma no cuadra', () => {
      const r = validarSumaRaleo(540, [{ cantidad: 200 }, { cantidad: 240 }]);
      expect(r.ok).toBe(false);
      expect(r.diferencia).toBe(-100);
    });
  });
});
