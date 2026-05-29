import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUnidad } from '../useUnidad';
import { useRalear } from '../useTrazabilidadMutations';
import { useFirestoreConnectivity } from '../useFirestoreConnectivity';
import { useRaleoDraftStore } from '../raleoDraftStore';
import { validarSumaRaleo } from '../plantas';
import { UBICACIONES_SEED } from '../ubicacionesSeed';
import type { RaleoDestino } from '../types';
import styles from './RalearUpScreen.module.css';

const MAX_DESTINOS = 5;
const hoyIso = () => new Date().toISOString().slice(0, 10);

const capacidadDe = (ubicacionId: string): number =>
  UBICACIONES_SEED.find((u) => u.id === ubicacionId)?.capacidadMaxima ?? Number.POSITIVE_INFINITY;

function mensajeError(err: unknown): string {
  return err instanceof Error ? err.message : 'No se pudo ralear la unidad.';
}

export function RalearUpScreen() {
  const { upId } = useParams<{ upId: string }>();
  const id = upId ?? '';
  const navigate = useNavigate();
  const { data: origen } = useUnidad(id);
  const { isOnline } = useFirestoreConnectivity();
  const { mutateAsync, isPending } = useRalear(id);
  const setDraft = useRaleoDraftStore((s) => s.setDraft);
  const clearDraft = useRaleoDraftStore((s) => s.clearDraft);

  const [destinos, setDestinos] = useState<RaleoDestino[]>(
    () => useRaleoDraftStore.getState().drafts[id]?.destinos ?? [{ ubicacionId: '', cantidad: 0 }],
  );
  const [fecha, setFecha] = useState(
    () => useRaleoDraftStore.getState().drafts[id]?.fecha ?? hoyIso(),
  );
  const [notas, setNotas] = useState(() => useRaleoDraftStore.getState().drafts[id]?.notas ?? '');
  const [error, setError] = useState<string | null>(null);

  // Persistir borrador local (FR-014): permite reanudar tras offline o cierre.
  useEffect(() => {
    setDraft(id, { destinos, fecha, notas });
  }, [id, destinos, fecha, notas, setDraft]);

  const cantidadOrigen = origen?.cantidad ?? 0;
  const suma = destinos.reduce((acc, d) => acc + d.cantidad, 0);
  const sumaOk = origen ? validarSumaRaleo(cantidadOrigen, destinos).ok : false;
  const todosConUbicacion = destinos.every((d) => d.ubicacionId !== '');
  const puedeConfirmar = isOnline && sumaOk && todosConUbicacion && !isPending;

  const updateDestino = (i: number, patch: Partial<RaleoDestino>) =>
    setDestinos((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const addDestino = () =>
    setDestinos((prev) =>
      prev.length < MAX_DESTINOS ? [...prev, { ubicacionId: '', cantidad: 0 }] : prev,
    );
  const removeDestino = (i: number) =>
    setDestinos((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setError('El raleo requiere conexión a internet.');
      return;
    }
    if (!todosConUbicacion) {
      setError('Cada destino necesita una ubicación.');
      return;
    }
    if (!sumaOk) {
      setError('La suma de los destinos debe igualar la cantidad del origen.');
      return;
    }
    setError(null);
    try {
      await mutateAsync({ destinos, fecha, notas: notas.trim() || undefined });
      clearDraft(id);
      navigate(`/up/${id}`);
    } catch (err) {
      setError(mensajeError(err));
    }
  };

  const usadas = new Set(destinos.map((d) => d.ubicacionId).filter(Boolean));

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>Ralear unidad</h1>
      {origen && (
        <p className={styles.actual}>
          Origen: <strong>{origen.ubicacionId}</strong> ·{' '}
          {cantidadOrigen.toLocaleString('es-CL')} plantas
        </p>
      )}

      {!isOnline && (
        <p className={styles.offline} role="status">
          Sin conexión — el raleo requiere internet. El borrador quedó guardado.
        </p>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {destinos.map((d, i) => {
          const opciones = UBICACIONES_SEED.filter(
            (u) =>
              u.id !== origen?.ubicacionId && (u.id === d.ubicacionId || !usadas.has(u.id)),
          );
          const excede = d.ubicacionId !== '' && d.cantidad > capacidadDe(d.ubicacionId);
          return (
            <div key={i} className={styles.destino}>
              <div className={styles.destinoRow}>
                <select
                  aria-label={`Ubicación destino ${i + 1}`}
                  className={styles.select}
                  value={d.ubicacionId}
                  onChange={(e) => updateDestino(i, { ubicacionId: e.target.value })}
                  disabled={isPending}
                >
                  <option value="">Selecciona…</option>
                  {opciones.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.id} (máx {u.capacidadMaxima})
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`Cantidad destino ${i + 1}`}
                  className={styles.cantidad}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={d.cantidad || ''}
                  onChange={(e) => updateDestino(i, { cantidad: Number(e.target.value) })}
                  disabled={isPending}
                />
                {destinos.length > 1 && (
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => removeDestino(i)}
                    aria-label={`Quitar destino ${i + 1}`}
                    disabled={isPending}
                  >
                    ✕
                  </button>
                )}
              </div>
              {excede && (
                <p className={styles.warning} role="status">
                  Excede la capacidad de {d.ubicacionId} ({capacidadDe(d.ubicacionId)}); se permite
                  igual.
                </p>
              )}
            </div>
          );
        })}

        {destinos.length < MAX_DESTINOS && (
          <button
            type="button"
            className={styles.addDestino}
            onClick={addDestino}
            disabled={isPending}
          >
            + Agregar destino
          </button>
        )}

        <p className={sumaOk ? styles.sumaOk : styles.sumaBad} aria-live="polite">
          Suma: {suma.toLocaleString('es-CL')} / {cantidadOrigen.toLocaleString('es-CL')}
          {origen && !sumaOk ? ' — debe coincidir' : ''}
        </p>

        <label className={styles.field}>
          <span className={styles.label}>Fecha</span>
          <input
            className={styles.input}
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Notas (opcional)</span>
          <textarea
            className={styles.textarea}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            disabled={isPending}
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => navigate(`/up/${id}`)}
            disabled={isPending}
          >
            Cancelar
          </button>
          <button type="submit" className={styles.button} disabled={!puedeConfirmar}>
            {isPending ? 'Raleando…' : 'Confirmar raleo'}
          </button>
        </div>
      </form>
    </div>
  );
}
