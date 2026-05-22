import type { Lot, Stage } from './types';

export const CAPACIDAD_INSTALADA = 3756; // Inv A (2.016) + Inv B (1.740)

export function countByStage(lots: Lot[], stage: Stage): number {
  return lots
    .filter((l) => l.stage === stage)
    .reduce((acc, l) => acc + l.currentQuantity, 0);
}

export function totalEnProduccion(lots: Lot[]): number {
  return lots
    .filter((l) => l.stage !== 'cosecha')
    .reduce((acc, l) => acc + l.currentQuantity, 0);
}

export function pctCapacidad(total: number): number {
  return Math.min(100, Math.round((total / CAPACIDAD_INSTALADA) * 100));
}
