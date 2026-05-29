// Modelo LO+UP (Sprint 4). Ver specs/001-traceability-lo-up/data-model.md.
// Stage se redefine aquí (en vez de importar de ../lotes) porque el módulo lotes
// queda como Histórico solo-lectura; trazabilidad es la fuente de verdad nueva.

export type Stage = 'almacigo' | 'transplante' | 'raleo' | 'cosecha';

export type LoteOrigenEstado = 'activo' | 'cosechado' | 'descartado';
export type UnidadEstado = 'activa' | 'cosechada' | 'descartada' | 'trasladada';
export type EventoTipo = 'creacion' | 'traslado' | 'raleo' | 'cosecha' | 'descarte';
export type UbicacionTipo = 'almacigo' | 'piscina_intermedia' | 'piscina_dwc' | 'bancada_nft';
export type Invernadero = 'A' | 'B' | 'C' | 'D';

/** Identidad genealógica de una siembra. Persiste hasta que todas sus UP están cosechadas. */
export interface LoteOrigen {
  id: string;
  variety: string;
  fechaSiembra: string;   // ISO YYYY-MM-DD
  bandejas: number;
  nombreAmigable: string;
  estado: LoteOrigenEstado;
  notas?: string;
}

/** Presencia física de plantas en una ubicación concreta. */
export interface UnidadProduccion {
  id: string;
  loteOrigenId: string;
  parentUpId?: string;    // si nació de un raleo
  ubicacionId: string;
  cantidadInicial: number;
  etapa: Stage;
  estado: UnidadEstado;
  fechaIngreso: string;   // ISO YYYY-MM-DD
}

/** Espacio físico productivo. Catálogo seed de 19 (FR-024). id = INV-X-YYY. */
export interface Ubicacion {
  id: string;
  invernadero: Invernadero;
  tipo: UbicacionTipo;
  identificador: string;
  capacidadMax: number;
  funcion?: string;
}

/** Entrada append-only de la bitácora de una UP (FR-032). */
export interface EventoHistorial {
  id: string;
  upId: string;
  loteOrigenId: string;
  fecha: string;          // ISO YYYY-MM-DD
  tipoAccion: EventoTipo;
  cantidad?: number;
  cantidadDescartada?: number;
  ubicacionPrevia?: string;
  ubicacionNueva?: string;
  notas?: string;
}

// --- Inputs ---

export interface NuevaSiembraInput {
  variety: string;
  fechaSiembra: string;   // ISO YYYY-MM-DD
  bandejas: number;
  notas?: string;
}

export interface TrasladoInput {
  ubicacionDestinoId: string;
  fecha: string;          // ISO YYYY-MM-DD
  cantidad?: number;
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
  paquetes: number;       // UI en paquetes; se persiste en lechugas (×2)
  descarte: number;       // lechugas individuales
  fecha: string;          // ISO YYYY-MM-DD
  notas?: string;
}
