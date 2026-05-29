import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUnidad } from '../useUnidad';
import { useTrasladar } from '../useTrazabilidadMutations';
import { UBICACIONES_SEED } from '../ubicacionesSeed';
import styles from './TrasladarUpScreen.module.css';

const hoyIso = () => new Date().toISOString().slice(0, 10);

function mensajeError(err: unknown): string {
  return err instanceof Error ? err.message : 'No se pudo trasladar la unidad.';
}

export function TrasladarUpScreen() {
  const { upId } = useParams<{ upId: string }>();
  const navigate = useNavigate();
  const { data: up } = useUnidad(upId ?? '');
  const { mutateAsync, isPending } = useTrasladar(upId ?? '');
  const [destino, setDestino] = useState('');
  const [fecha, setFecha] = useState(hoyIso);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Catálogo estático de las 19 ubicaciones (sin la actual como destino).
  const destinos = UBICACIONES_SEED.filter((u) => u.id !== up?.ubicacionId);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (destino === '') {
      setError('Elige una ubicación destino.');
      return;
    }
    setError(null);
    try {
      await mutateAsync({ ubicacionDestinoId: destino, fecha, notas: notas.trim() || undefined });
      navigate(`/up/${upId}`);
    } catch (err) {
      setError(mensajeError(err));
    }
  };

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>Trasladar unidad</h1>
      {up && (
        <p className={styles.actual}>
          Ubicación actual: <strong>{up.ubicacionId}</strong>
        </p>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <label className={styles.field}>
          <span className={styles.label}>Ubicación destino</span>
          <select
            className={styles.input}
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            disabled={isPending}
          >
            <option value="">Selecciona…</option>
            {destinos.map((u) => (
              <option key={u.id} value={u.id}>
                {u.id} — {u.funcion}
              </option>
            ))}
          </select>
        </label>

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
            onClick={() => navigate(`/up/${upId}`)}
            disabled={isPending}
          >
            Cancelar
          </button>
          <button type="submit" className={styles.button} disabled={isPending}>
            {isPending ? 'Trasladando…' : 'Trasladar'}
          </button>
        </div>
      </form>
    </div>
  );
}
