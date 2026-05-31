const MESES_ABREV = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

/** Nombre base "Variedad DD-Mmm" a partir de variedad + fecha ISO YYYY-MM-DD. */
export function nombreBase(variety: string, fechaSiembraIso: string): string {
  const [, mes, dia] = fechaSiembraIso.split('-');
  const mesAbrev = MESES_ABREV[Number(mes) - 1] ?? mes;
  return `${variety} ${Number(dia)}-${mesAbrev}`;
}

/**
 * Nombre amigable único para una siembra (FR-003).
 * Primera del día: "Milena 23-May". En colisión, sufijo incremental: "#02", "#03"…
 * `existentesMismoDia` son los nombres ya usados para la misma variedad+día.
 */
export function generarNombreAmigable(
  variety: string,
  fechaSiembraIso: string,
  existentesMismoDia: readonly string[],
): string {
  const base = nombreBase(variety, fechaSiembraIso);
  const tomados = new Set(existentesMismoDia);
  if (!tomados.has(base)) return base;

  let n = 2;
  while (tomados.has(`${base} #${String(n).padStart(2, '0')}`)) {
    n += 1;
  }
  return `${base} #${String(n).padStart(2, '0')}`;
}
