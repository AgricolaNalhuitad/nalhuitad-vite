// Modelo LO+UP (Sprint 4).
// Fuente de verdad: firestore.rules + tests/security/firestore.rules.test.ts (60 tests).
// Reconciliado 2026-05-29 al test suite committeado.

export type Stage = 'almacigo' | 'transplante' | 'raleo' | 'cosecha';

export type LoteOrigenEstado = 'activo' | 'cosechado' | 'descartado';
export type UnidadEstado = 'activa' | 'cosechada' | 'descartada' | 'trasladada';
export type HistorialTipo = 'creacion' | 'traslado' | 'raleo' | 'cosecha' | 'descarte';
export type UbicacionTipo = 'almacigo' | 'piscina_intermedia' | 'piscina_dwc' | 'bancada_nft';
export type Invernadero = 'A' | 'B' | 'C' | 'D';

/** Campos de auditoría comunes (timestamps como ISO string). */
export interface AuditFields {
  createdAt: string;
  createdBy: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

/** Identidad genealógica de una siembra. Colección `loteOrigen`. */
export interface LoteOrigen extends AuditFields {
  id: string;
  nombre: string;          // nombre amigable, ej. "Milena 23-May"
  variedad: string;
  fechaSiembra: string;    // ISO YYYY-MM-DD
  bandejas: number;
  cantidadInicial: number; // = bandejas * 135
  estado: LoteOrigenEstado;
  notas?: string;
}

/** Entrada embebida del historial de una UP (no es colección — D2). */
export interface HistorialEntry {
  fecha: string;           // ISO YYYY-MM-DD
  tipoAccion: HistorialTipo;
  cantidad?: number;
  cantidadDescartada?: number;
  ubicacionPrevia?: string;
  ubicacionNueva?: string;
  notas?: string;
}

/** Presencia física de plantas en una ubicación. Colección `unidadesProduccion`. */
export interface UnidadProduccion extends AuditFields {
  id: string;
  refLoteOrigen: string;
  parentUpId?: string;        // si nació de un raleo
  ubicacionId: string;
  cantidad: number;           // persistida y mutable (baja en cosecha/raleo — D4b)
  etapa: Stage;
  estado: UnidadEstado;
  fechaIngreso: string;       // ISO YYYY-MM-DD
  historial: HistorialEntry[];
}

/** Registro de cosecha (ledger append-only). Colección `cosechas`. */
export interface Cosecha {
  id: string;
  refUnidadProduccion: string;
  refLoteOrigen: string;
  paquetes: number;
  descarte: number;
  lechugasEquivalentes: number; // = paquetes * 2
  fecha: string;                // ISO YYYY-MM-DD
  notas?: string;
  createdAt: string;
  createdBy: string;
}

/** Espacio físico productivo. Catálogo seed de 19 (FR-024). id = INV-X-YYY. */
export interface Ubicacion {
  id: string;
  invernadero: Invernadero;
  tipo: UbicacionTipo;
  identificador: string;
  capacidadMaxima: number;
  funcion?: string;
}

// --- Inputs (capa de app; los campos de audit/derivados los completa la api) ---

export interface NuevaSiembraInput {
  variedad: string;
  fechaSiembra: string;   // ISO YYYY-MM-DD
  bandejas: number;
  notas?: string;
}

export interface TrasladoInput {
  ubicacionDestinoId: string;
  fecha: string;          // ISO YYYY-MM-DD
  notas?: string;
}

export interface RaleoDestino {
  ubicacionId: string;
  cantidad: number;
}

export interface RaleoInput {
  destinos: RaleoDestino[];
  fecha: string;          // ISO YYYY-MM-DD
  notas?: string;
}

export interface CosechaInput {
  paquetes: number;       // UI en paquetes; se persiste lechugasEquivalentes (×2)
  descarte: number;       // lechugas individuales
  fecha: string;          // ISO YYYY-MM-DD
  notas?: string;
}
