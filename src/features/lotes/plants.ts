export const PLANTS_PER_TRAY_DEFAULT = 135;

export function toPlants(trays: number): number {
  return Number.isFinite(trays) ? Math.round(trays * PLANTS_PER_TRAY_DEFAULT) : 0;
}

export function lotPlantasIniciales(lot: { quantity: number; parentId?: string }): number {
  return lot.parentId ? lot.quantity : toPlants(lot.quantity);
}

export function daysSince(iso: string): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
