import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { validarSumaRaleo } from './plantas';
import type { HistorialEntry, RaleoInput, UnidadProduccion } from './types';

const COL = 'unidadesProduccion';
const MAX_DESTINOS = 5;

/**
 * Ralea una UP: la divide en 1..5 UP hijas de forma atómica (writeBatch — INV-2/FR-012).
 * - INV-1: Σ(cantidad de destinos) == cantidad del origen.
 * - INV-3: cada ubicación destino debe estar libre.
 * - FR-014: requiere conexión (no se permite encolar offline).
 * El origen pasa a 'trasladada' (libera su ubicación); las hijas referencian parentUpId.
 */
export async function ralear(
  upOrigenId: string,
  input: RaleoInput,
): Promise<{ hijasIds: string[] }> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sesión no iniciada: no se puede ralear.');

  // FR-014: online-only. En navegador offline falla; en Node (sin navigator.onLine) no aplica.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('El raleo requiere conexión a internet.');
  }

  const { destinos, fecha } = input;
  if (destinos.length < 1 || destinos.length > MAX_DESTINOS) {
    throw new Error(`El raleo admite entre 1 y ${MAX_DESTINOS} destinos.`);
  }

  const origenRef = doc(db, COL, upOrigenId);
  const origenSnap = await getDoc(origenRef);
  if (!origenSnap.exists()) throw new Error('Unidad de producción de origen no encontrada.');
  const origen = origenSnap.data() as Omit<UnidadProduccion, 'id'>;

  // INV-1: suma exacta.
  if (!validarSumaRaleo(origen.cantidad, destinos).ok) {
    throw new Error('La suma de los destinos debe igualar la cantidad del origen.');
  }

  // INV-3: cada destino libre (el propio origen no cuenta, pasará a 'trasladada').
  for (const d of destinos) {
    const ocupadas = await getDocs(
      query(collection(db, COL), where('ubicacionId', '==', d.ubicacionId), where('estado', '==', 'activa')),
    );
    if (ocupadas.docs.some((o) => o.id !== upOrigenId)) {
      throw new Error(`La ubicación ${d.ubicacionId} ya está ocupada por otra unidad activa.`);
    }
  }

  const nowIso = new Date().toISOString();
  const batch = writeBatch(db);
  const hijasIds: string[] = [];

  for (const d of destinos) {
    const hijaRef = doc(collection(db, COL));
    hijasIds.push(hijaRef.id);
    batch.set(hijaRef, {
      refLoteOrigen: origen.refLoteOrigen,
      parentUpId: upOrigenId,
      ubicacionId: d.ubicacionId,
      cantidad: d.cantidad,
      etapa: 'raleo',
      estado: 'activa',
      fechaIngreso: fecha,
      historial: [{ fecha, tipoAccion: 'raleo', cantidad: d.cantidad, ubicacionNueva: d.ubicacionId }],
      createdAt: nowIso,
      createdBy: uid,
      lastModifiedBy: uid,
      lastModifiedAt: nowIso,
    });
  }

  const entradaOrigen: HistorialEntry = { fecha, tipoAccion: 'raleo' };
  if (input.notas) entradaOrigen.notas = input.notas;
  batch.update(origenRef, {
    estado: 'trasladada',
    historial: [...(origen.historial ?? []), entradaOrigen],
    lastModifiedBy: uid,
    lastModifiedAt: nowIso,
  });

  await batch.commit();
  return { hijasIds };
}
