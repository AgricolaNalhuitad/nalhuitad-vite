import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { paquetesALechugas } from './plantas';
import type { CosechaInput, HistorialEntry, TrasladoInput, UnidadProduccion } from './types';

const MAX_PAQUETES = 210; // un viaje de cosecha (FR / reglas)

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

/**
 * Registra una cosecha de la UP (FR-015..019). La UI captura paquetes; se persiste también
 * lechugas equivalentes (paquetes×2). INV-4: (paquetes×2) + descarte ≤ cantidad disponible.
 * Baja la cantidad; si llega a 0 la UP pasa a 'cosechada' (libera su ubicación). Si tras ello
 * ninguna otra UP del lote sigue activa, auto-cierra el lote origen (FR-019). Todo atómico
 * (writeBatch: doc de cosecha + UP + lote).
 */
export async function registrarCosecha(upId: string, input: CosechaInput): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sesión no iniciada: no se puede cosechar.');
  if (!Number.isInteger(input.paquetes) || input.paquetes < 1) {
    throw new Error('Debe registrarse al menos 1 paquete.');
  }
  if (input.paquetes > MAX_PAQUETES) {
    throw new Error(`Máximo ${MAX_PAQUETES} paquetes por registro de cosecha.`);
  }
  if (!Number.isInteger(input.descarte) || input.descarte < 0) {
    throw new Error('El descarte debe ser un entero ≥ 0.');
  }

  const upRef = doc(db, COL, upId);
  const snap = await getDoc(upRef);
  if (!snap.exists()) throw new Error('Unidad de producción no encontrada.');
  const up = snap.data() as Omit<UnidadProduccion, 'id'>;

  const lechugas = paquetesALechugas(input.paquetes);
  const totalRetirado = lechugas + input.descarte;
  if (totalRetirado > up.cantidad) {
    throw new Error('La cosecha excede la cantidad disponible en la unidad (INV-4).');
  }

  const nuevaCantidad = up.cantidad - totalRetirado;
  const esTotal = nuevaCantidad === 0;
  const nowIso = new Date().toISOString();

  // Auto-cierre del lote (FR-019): solo si la UP queda cosechada y ninguna otra del lote sigue activa.
  let cerrarLote = false;
  if (esTotal) {
    const activas = await getDocs(
      query(
        collection(db, COL),
        where('refLoteOrigen', '==', up.refLoteOrigen),
        where('estado', '==', 'activa'),
      ),
    );
    cerrarLote = activas.docs.every((d) => d.id === upId);
  }

  const batch = writeBatch(db);

  const cosechaRef = doc(collection(db, 'cosechas'));
  batch.set(cosechaRef, {
    refUnidadProduccion: upId,
    refLoteOrigen: up.refLoteOrigen,
    paquetes: input.paquetes,
    descarte: input.descarte,
    lechugasEquivalentes: lechugas,
    fecha: input.fecha,
    notas: input.notas ?? '',
    createdAt: nowIso,
    createdBy: uid,
  });

  const entrada: HistorialEntry = {
    fecha: input.fecha,
    tipoAccion: 'cosecha',
    cantidad: lechugas,
    cantidadDescartada: input.descarte,
  };
  batch.update(upRef, {
    cantidad: nuevaCantidad,
    estado: esTotal ? 'cosechada' : 'activa',
    historial: [...(up.historial ?? []), entrada],
    lastModifiedBy: uid,
    lastModifiedAt: nowIso,
  });

  if (cerrarLote) {
    batch.update(doc(db, 'loteOrigen', up.refLoteOrigen), {
      estado: 'cosechado',
      lastModifiedBy: uid,
      lastModifiedAt: nowIso,
    });
  }

  await batch.commit();
}
