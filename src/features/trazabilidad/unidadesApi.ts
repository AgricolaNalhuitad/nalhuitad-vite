import {
  collection,
  onSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UnidadProduccion } from './types';

/**
 * Suscripción a todas las unidades de producción (RQ+Firestore, mismo patrón que
 * subscribeLotesOrigen). US2+ añadirá a este archivo subscribeUnidad/traslado/cosecha.
 */
export function subscribeUnidades(
  onData: (unidades: UnidadProduccion[]) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'unidadesProduccion'),
    (snap) =>
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UnidadProduccion, 'id'>) }))),
    onError,
  );
}
