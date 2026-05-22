import { describe, expect, it } from 'vitest';
import {
  countByStage,
  totalEnProduccion,
  pctCapacidad,
  CAPACIDAD_INSTALADA,
} from './aggregations';
import type { Lot } from './types';

const makeLot = (overrides: Partial<Lot>): Lot => ({
  id: 'x',
  name: 'Test',
  date: '2026-01-01',
  stage: 'almacigo',
  variety: '',
  quantity: 0,
  currentQuantity: 0,
  location: null,
  stageHistory: [],
  raleos: [],
  childrenIds: [],
  ...overrides,
});

const lots: Lot[] = [
  makeLot({ id: '1', stage: 'almacigo',    currentQuantity: 1000 }),
  makeLot({ id: '2', stage: 'transplante', currentQuantity: 500  }),
  makeLot({ id: '3', stage: 'raleo',       currentQuantity: 200  }),
  makeLot({ id: '4', stage: 'cosecha',     currentQuantity: 0    }),
];

describe('CAPACIDAD_INSTALADA', () => {
  it('es 3756', () => {
    expect(CAPACIDAD_INSTALADA).toBe(3756);
  });
});

describe('countByStage', () => {
  it('suma currentQuantity de la etapa indicada', () => {
    expect(countByStage(lots, 'almacigo')).toBe(1000);
    expect(countByStage(lots, 'transplante')).toBe(500);
    expect(countByStage(lots, 'raleo')).toBe(200);
  });

  it('incluye lotes cosechados si se pide cosecha', () => {
    expect(countByStage(lots, 'cosecha')).toBe(0);
  });

  it('array vacío → 0', () => {
    expect(countByStage([], 'almacigo')).toBe(0);
  });
});

describe('totalEnProduccion', () => {
  it('excluye lotes en etapa cosecha', () => {
    expect(totalEnProduccion(lots)).toBe(1700);
  });

  it('array vacío → 0', () => {
    expect(totalEnProduccion([])).toBe(0);
  });
});

describe('pctCapacidad', () => {
  it('3756 plantas → 100%', () => {
    expect(pctCapacidad(3756)).toBe(100);
  });

  it('0 plantas → 0%', () => {
    expect(pctCapacidad(0)).toBe(0);
  });

  it('1878 plantas → 50%', () => {
    expect(pctCapacidad(1878)).toBe(50);
  });

  it('más de la capacidad → clamped a 100%', () => {
    expect(pctCapacidad(9999)).toBe(100);
  });
});
