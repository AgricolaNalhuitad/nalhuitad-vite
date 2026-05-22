import { describe, expect, it } from 'vitest';
import { toPlants, daysSince, formatDate, PLANTS_PER_TRAY_DEFAULT } from './plants';

describe('PLANTS_PER_TRAY_DEFAULT', () => {
  it('es 135', () => {
    expect(PLANTS_PER_TRAY_DEFAULT).toBe(135);
  });
});

describe('toPlants', () => {
  it('0 bandejas → 0 plantas', () => {
    expect(toPlants(0)).toBe(0);
  });

  it('21 bandejas → 2835 plantas (21 × 135)', () => {
    expect(toPlants(21)).toBe(2835);
  });

  it('NaN → 0 (sin crash)', () => {
    expect(toPlants(NaN)).toBe(0);
  });
});

describe('daysSince', () => {
  it('string vacío → 0', () => {
    expect(daysSince('')).toBe(0);
  });

  it('fecha de hoy → 0', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(daysSince(today)).toBe(0);
  });

  it('fecha de ayer → 1', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    expect(daysSince(yesterday)).toBe(1);
  });
});

describe('formatDate', () => {
  it('string vacío → "—"', () => {
    expect(formatDate('')).toBe('—');
  });

  it('fecha ISO válida incluye día y año', () => {
    const result = formatDate('2026-03-15');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2026/);
  });
});
