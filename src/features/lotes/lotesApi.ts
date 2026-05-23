import {
  collection,
  onSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toPlants } from './plants';
import type { Lot, LotDoc } from './types';

export function normalizeLot(doc: LotDoc): Lot {
  const quantity = doc.quantity ?? 0;
  return {
    id:              doc.id,
    name:            doc.name ?? '',
    date:            doc.date ?? '',
    stage:           doc.stage ?? 'almacigo',
    variety:         doc.variety ?? '',
    quantity,
    currentQuantity: doc.currentQuantity ?? toPlants(quantity),
    location:        doc.location ?? doc.locations?.[0] ?? null,
    stageHistory:    doc.stageHistory ?? [],
    raleos:          doc.raleos ?? [],
    childrenIds:     doc.childrenIds ?? [],
    ...(doc.parentId !== undefined && { parentId: doc.parentId }),
  };
}

export function subscribeLotes(
  onData: (lots: Lot[]) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'lotes'),
    (snap) =>
      onData(
        snap.docs.map((d) =>
          normalizeLot({ id: d.id, ...(d.data() as Omit<LotDoc, 'id'>) }),
        ),
      ),
    onError,
  );
}
