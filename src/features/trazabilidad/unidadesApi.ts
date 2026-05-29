import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { HistorialEntry, TrasladoInput, UnidadProduccion } from './types';

const COL = 'unidadesProduccion';

/** Suscripción a todas las unidades de producción (RQ+Firestore). US2+ añade aquí más operaciones. */
export function subscribeUnidades(
  onData: (unidades: UnidadProduccion[]) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, COL),
    (snap) =>
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UnidadProduccion, 'id'>) }))),
    onError,
  );
}

/** Suscripción a una UP por id (null si no existe). */
export function subscribeUnidad(
  upId: string,
  onData: (unidad: UnidadProduccion | null) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, COL, upId),
    (snap) =>
      onData(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<UnidadProduccion, 'id'>) } : null),
    onError,
  );
}

/** Suscripción a la UP activa en una ubicación (consulta "¿qué hay aquí?", FR-022; null si libre). */
export function subscribeUnidadActivaPorUbicacion(
  ubicacionId: string,
  onData: (unidad: UnidadProduccion | null) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, COL),
      where('ubicacionId', '==', ubicacionId),
      where('estado', '==', 'activa'),
    ),
    (snap) => {
      const d = snap.docs[0];
      onData(d ? { id: d.id, ...(d.data() as Omit<UnidadProduccion, 'id'>) } : null);
    },
    onError,
  );
}

/**
 * Traslada una UP a otra ubicación (FR-005..007). Aplica el guard INV-3: la ubicación
 * destino no puede tener otra UP activa. Hace append al historial embebido (sin arrayUnion).
 */
export async function trasladarUnidad(upId: string, input: TrasladoInput): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sesión no iniciada: no se puede trasladar.');

  // Guard INV-3: destino libre (salvo que ya sea esta misma UP).
  const ocupadas = await getDocs(
    query(
      collection(db, COL),
      where('ubicacionId', '==', input.ubicacionDestinoId),
      where('estado', '==', 'activa'),
    ),
  );
  if (ocupadas.docs.some((d) => d.id !== upId)) {
    throw new Error('La ubicación destino ya está ocupada por otra unidad activa.');
  }

  const upRef = doc(db, COL, upId);
  const snap = await getDoc(upRef);
  if (!snap.exists()) throw new Error('Unidad de producción no encontrada.');
  const actual = snap.data() as Omit<UnidadProduccion, 'id'>;

  const entrada: HistorialEntry = {
    fecha: input.fecha,
    tipoAccion: 'traslado',
    ubicacionPrevia: actual.ubicacionId,
    ubicacionNueva: input.ubicacionDestinoId,
  };
  if (input.notas) entrada.notas = input.notas;

  await updateDoc(upRef, {
    ubicacionId: input.ubicacionDestinoId,
    fechaIngreso: input.fecha,
    historial: [...(actual.historial ?? []), entrada],
    lastModifiedBy: uid,
    lastModifiedAt: new Date().toISOString(),
  });
}
