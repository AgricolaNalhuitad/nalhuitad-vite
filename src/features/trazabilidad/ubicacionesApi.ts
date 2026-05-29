import {
  collection,
  onSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ubicacion } from './types';

/** Suscripción al catálogo de ubicaciones (RQ+Firestore, igual patrón que subscribeLotes). */
export function subscribeUbicaciones(
  onData: (ubicaciones: Ubicacion[]) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'ubicaciones'),
    (snap) =>
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ubicacion, 'id'>) }))),
    onError,
  );
}
