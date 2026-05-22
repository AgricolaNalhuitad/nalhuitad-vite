export type Stage = 'almacigo' | 'transplante' | 'raleo' | 'cosecha';

export interface Location {
  invernadero: string;
  tipo: string;
  identificador: string;
}

export interface StageHistoryEntry {
  stage: Stage;
  date: string;
  quantity?: number;
  notes?: string;
  location?: Location;
}

export interface RaleoEntry {
  fecha: string;
  cantidadRaleada: number;
  lotHijoId?: string;
  destino?: Location;
}

/** Forma cruda de Firestore — todos los campos opcionales para tolerar docs históricos */
export interface LotDoc {
  id: string;
  name?: string;
  date?: string;
  stage?: Stage;
  variety?: string;
  quantity?: number;
  currentQuantity?: number;
  mortalidadAcumulada?: number;
  location?: Location;
  locations?: Location[];
  stageHistory?: StageHistoryEntry[];
  raleos?: RaleoEntry[];
  childrenIds?: string[];
  parentId?: string;
}

/** Forma normalizada que consumen los componentes — defaults aplicados */
export interface Lot {
  id: string;
  name: string;
  date: string;
  stage: Stage;
  variety: string;
  quantity: number;
  currentQuantity: number;
  location: Location | null;
  stageHistory: StageHistoryEntry[];
  raleos: RaleoEntry[];
  childrenIds: string[];
}

/** Input para crear un nuevo lote */
export interface NewLotInput {
  name: string;
  variety: string;
  date: string;           // ISO YYYY-MM-DD
  quantity: number;       // bandejas de almácigo
  location: Location;
}

/** Input para editar campos básicos del lote */
export interface UpdateLotInput {
  name?: string;
  variety?: string;
  location?: Location;
}

/** Input para avanzar a la siguiente etapa */
export interface AdvanceStageInput {
  newStage: Stage;
  date: string;           // ISO YYYY-MM-DD
  quantity?: number;      // nueva cantidad de plantas (si cambia)
  location?: Location;    // nueva ubicación (si cambia)
  notes?: string;
}

/** Input para registrar cosecha */
export interface HarvestInput {
  date: string;           // ISO YYYY-MM-DD
  notes?: string;
}

/** Input para registrar raleo */
export interface RaleoInput {
  cantidadRaleada: number;
  fecha: string;          // ISO YYYY-MM-DD
  destino?: Location;
}
