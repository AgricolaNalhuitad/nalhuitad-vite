import type { EventoHistorial } from './types';

/** Lechugas por bandeja de almácigo — valor canónico del dominio (FR-004). */
export const LECHUGAS_POR_BANDEJA = 135;

/** Lechugas por paquete en cosecha (FR-015). */
export const LECHUGAS_POR_PAQUETE = 2;

/** Cantidad inicial de plantas de un lote según sus bandejas. */
export function bandejasALechugas(bandejas: number): number {
  return bandejas * LECHUGAS_POR_BANDEJA;
}

/** Convierte paquetes a lechugas individuales. */
export function paquetesALechugas(paquetes: number): number {
  return paquetes * LECHUGAS_POR_PAQUETE;
}

/**
 * Cantidad actual de una UP = cantidad inicial − Σ descartes del historial (FR-031).
 * No se persiste: se deriva siempre del historial.
 */
export function calcularCurrentQuantity(
  cantidadInicial: number,
  eventos: readonly EventoHistorial[],
): number {
  const descartes = eventos.reduce((acc, ev) => acc + (ev.cantidadDescartada ?? 0), 0);
  return cantidadInicial - descartes;
}

export interface ValidacionSumaRaleo {
  ok: boolean;
  /** suma de destinos − cantidad disponible (0 = cuadra) */
  diferencia: number;
}

/**
 * Valida que la suma de cantidades de los destinos de un raleo iguale
 * la cantidad disponible en la unidad origen (INV-1 / FR-009).
 */
export function validarSumaRaleo(
  currentQuantity: number,
  destinos: readonly { cantidad: number }[],
): ValidacionSumaRaleo {
  const suma = destinos.reduce((acc, d) => acc + d.cantidad, 0);
  const diferencia = suma - currentQuantity;
  return { ok: diferencia === 0, diferencia };
}
