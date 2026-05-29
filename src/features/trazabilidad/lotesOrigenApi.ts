import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { bandejasALechugas } from './plantas';
import { generarNombreAmigable } from './nombreAmigable';
import type { LoteOrigen, NuevaSiembraInput } from './types';

/** Ubicación por defecto de la UP inicial de una siembra (FR-002). */
const UBICACION_ALMACIGO = 'INV-D-ALM';

export function subscribeLotesOrigen(
  onData: (lotes: LoteOrigen[]) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'loteOrigen'),
    (snap) =>
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LoteOrigen, 'id'>) }))),
    onError,
  );
}

export function subscribeLoteOrigen(
  id: string,
  onData: (lote: LoteOrigen | null) => void,
  onError: (err: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'loteOrigen', id),
    (snap) =>
      onData(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<LoteOrigen, 'id'>) } : null),
    onError,
  );
}

/**
 * Crea una siembra: lote origen + unidad de producción inicial en Inv D-Almácigo,
 * de forma atómica (FR-001, FR-002). Genera nombre amigable con sufijo en colisión (FR-003).
 * Requiere conexión (writeBatch).
 */
export async function createSiembra(
  input: NuevaSiembraInput,
): Promise<{ loteOrigenId: string; upId: string }> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sesión no iniciada: no se puede crear la siembra.');

  // Resolver colisión de nombre amigable para misma variedad + fecha (FR-003).
  const sameDay = await getDocs(
    query(
      collection(db, 'loteOrigen'),
      where('variedad', '==', input.variedad),
      where('fechaSiembra', '==', input.fechaSiembra),
    ),
  );
  const existentes = sameDay.docs.map((d) => (d.data() as { nombre?: string }).nombre ?? '');
  const nombre = generarNombreAmigable(input.variedad, input.fechaSiembra, existentes);

  const cantidadInicial = bandejasALechugas(input.bandejas);
  const nowIso = new Date().toISOString();

  const loteRef = doc(collection(db, 'loteOrigen'));
  const upRef = doc(collection(db, 'unidadesProduccion'));

  const batch = writeBatch(db);
  batch.set(loteRef, {
    nombre,
    variedad: input.variedad,
    fechaSiembra: input.fechaSiembra,
    bandejas: input.bandejas,
    cantidadInicial,
    estado: 'activo',
    notas: input.notas ?? '',
    createdAt: nowIso,
    createdBy: uid,
    lastModifiedBy: uid,
    lastModifiedAt: nowIso,
  });
  batch.set(upRef, {
    refLoteOrigen: loteRef.id,
    ubicacionId: UBICACION_ALMACIGO,
    cantidad: cantidadInicial,
    etapa: 'almacigo',
    estado: 'activa',
    fechaIngreso: input.fechaSiembra,
    historial: [{ fecha: input.fechaSiembra, tipoAccion: 'creacion', cantidad: cantidadInicial }],
    createdAt: nowIso,
    createdBy: uid,
    lastModifiedBy: uid,
    lastModifiedAt: nowIso,
  });
  await batch.commit();

  return { loteOrigenId: loteRef.id, upId: upRef.id };
}
