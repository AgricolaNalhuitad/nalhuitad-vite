import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeLot } from './lotesApi';
import type {
  AdvanceStageInput,
  HarvestInput,
  Lot,
  LotDoc,
  NewLotInput,
  RaleoInput,
  UpdateLotInput,
} from './types';

export function subscribeLot(
  id: string,
  onData: (lot: Lot | null) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'lotes', id),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(normalizeLot({ id: snap.id, ...(snap.data() as Omit<LotDoc, 'id'>) }));
    },
    onError,
  );
}

export async function createLot(input: NewLotInput): Promise<string> {
  const ref = await addDoc(collection(db, 'lotes'), {
    name:            input.name,
    variety:         input.variety,
    date:            input.date,
    quantity:        input.quantity,
    currentQuantity: input.quantity * 135,
    stage:           'almacigo',
    location:        input.location,
    stageHistory:    [{ stage: 'almacigo', date: input.date }],
    raleos:          [],
    childrenIds:     [],
  });
  return ref.id;
}

export async function updateLot(id: string, input: UpdateLotInput): Promise<void> {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined)     data.name = input.name;
  if (input.variety !== undefined)  data.variety = input.variety;
  if (input.location !== undefined) data.location = input.location;
  await updateDoc(doc(db, 'lotes', id), data);
}

export async function advanceStage(id: string, input: AdvanceStageInput): Promise<void> {
  const entry = {
    stage:    input.newStage,
    date:     input.date,
    ...(input.quantity !== undefined && { quantity: input.quantity }),
    ...(input.notes    !== undefined && { notes: input.notes }),
    ...(input.location !== undefined && { location: input.location }),
  };
  const data: Record<string, unknown> = {
    stage:        input.newStage,
    stageHistory: arrayUnion(entry),
  };
  if (input.quantity !== undefined) data.currentQuantity = input.quantity;
  if (input.location !== undefined) data.location = input.location;
  await updateDoc(doc(db, 'lotes', id), data);
}

export async function registerHarvest(id: string, input: HarvestInput): Promise<void> {
  const entry = {
    stage: 'cosecha',
    date:  input.date,
    ...(input.notes !== undefined && { notes: input.notes }),
  };
  await updateDoc(doc(db, 'lotes', id), {
    stage:        'cosecha',
    stageHistory: arrayUnion(entry),
  });
}

export async function registerRaleo(
  id: string,
  currentQuantity: number,
  input: RaleoInput,
): Promise<void> {
  const entry = {
    fecha:            input.fecha,
    cantidadRaleada:  input.cantidadRaleada,
    ...(input.destino !== undefined && { destino: input.destino }),
  };
  await updateDoc(doc(db, 'lotes', id), {
    currentQuantity: currentQuantity - input.cantidadRaleada,
    raleos:          arrayUnion(entry),
  });
}
