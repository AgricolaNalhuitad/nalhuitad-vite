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
