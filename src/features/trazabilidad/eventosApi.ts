import {
  collection,
  onSnapshot,
  query,
  where,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { EventoHistorial } from './types';

/** Suscripción al historial (append-only) de una unidad de producción. */
export function subscribeEventosPorUp(
  upId: string,
  onData: (eventos: EventoHistorial[]) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  const q = query(collection(db, 'eventosHistorial'), where('upId', '==', upId));
  return onSnapshot(
    q,
    (snap) =>
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventoHistorial, 'id'>) }))),
    onError,
  );
}
