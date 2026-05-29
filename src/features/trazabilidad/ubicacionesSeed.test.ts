import { describe, it, expect } from 'vitest';
import { UBICACIONES_SEED } from './ubicacionesSeed';

describe('UBICACIONES_SEED', () => {
  it('contiene exactamente 19 ubicaciones (FR-024)', () => {
    expect(UBICACIONES_SEED).toHaveLength(19);
  });

  it('tiene ids únicos con formato INV-X-YYY', () => {
    const ids = UBICACIONES_SEED.map((u) => u.id);
    expect(new Set(ids).size).toBe(19);
    for (const id of ids) {
      expect(id).toMatch(/^INV-[ABCD]-[A-Z0-9]+$/);
    }
  });

  it('distribuye las ubicaciones por invernadero según el catálogo', () => {
    const porInv = (inv: string) => UBICACIONES_SEED.filter((u) => u.invernadero === inv).length;
    expect(porInv('D')).toBe(1);
    expect(porInv('C')).toBe(4);
    expect(porInv('A')).toBe(8);
    expect(porInv('B')).toBe(6);
  });

  it('respeta las capacidades máximas del dominio', () => {
    const cap = (id: string) => UBICACIONES_SEED.find((u) => u.id === id)?.capacidadMax;
    expect(cap('INV-A-P05')).toBe(252);
    expect(cap('INV-B-B02')).toBe(290);
    expect(cap('INV-C-P01')).toBe(540);
    expect(cap('INV-D-ALM')).toBe(810);
  });
});
