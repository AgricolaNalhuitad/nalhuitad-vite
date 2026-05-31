import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUnidad } from '../useUnidad';
import { useCosechar } from '../useTrazabilidadMutations';
import { paquetesALechugas } from '../plantas';
import styles from './CosecharUpScreen.module.css';

const MAX_PAQUETES = 210;
const hoyIso = () => new Date().toISOString().slice(0, 10);

function mensajeError(err: unknown): string {
  return err instanceof Error ? err.message : 'No se pudo registrar la cosecha.';
}

export function CosecharUpScreen() {
  const { upId } = useParams<{ upId: string }>();
  const id = upId ?? '';
  const navigate = useNavigate();
  const { data: up } = useUnidad(id);
  const { mutateAsync, isPending } = useCosechar(id);
  const [paquetes, setPaquetes] = useState('');
  const [descarte, setDescarte] = useState('0');
  const [fecha, setFecha] = useState(hoyIso);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cantidad = up?.cantidad ?? 0;
  const paquetesNum = Number(paquetes);
  const descarteNum = Number(descarte);
  const paquetesValido =
    Number.isInteger(paquetesNum) && paquetesNum >= 1 && paquetesNum <= MAX_PAQUETES;
  const descarteValido = Number.isInteger(descarteNum) && descarteNum >= 0;
  const lechugas = paquetesValido ? paquetesALechugas(paquetesNum) : 0;
  const totalRetirado = lechugas + (descarteValido ? descarteNum : 0);
  const excede = up != null && totalRetirado > cantidad;
  const restante = cantidad - totalRetirado;
  const esTotal = up != null && totalRetirado > 0 && restante === 0;

  const puedeConfirmar = up != null && paquetesValido && descarteValido && !excede && !isPending;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!paquetesValido) {
      setError(`Indica los paquetes (1 a ${MAX_PAQUETES}).`);
      return;
    }
    if (!descarteValido) {
      setError('El descarte debe ser un entero ≥ 0.');
      return;
    }
    if (excede) {
      setError('La cosecha excede la cantidad disponible en la unidad.');
      return;
    }
    setError(null);
    try {
      await mutateAsync({
        paquetes: paquetesNum,
        descarte: descarteNum,
        fecha,
        notas: notas.trim() || undefined,
      });
      navigate(`/up/${id}`);
    } catch (err) {
      setError(mensajeError(err));
    }
  };

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>Registrar cosecha</h1>
      {up && (
        <p className={styles.actual}>
          Disponible: <strong>{cantidad.toLocaleString('es-CL')}</strong> plantas
        </p>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <label className={styles.field}>
          <span className={styles.label}>Paquetes (1 paquete = 2 lechugas)</span>
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_PAQUETES}
            placeholder="0"
            value={paquetes}
            onChange={(e) => setPaquetes(e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Descarte (lechugas)</span>
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={0}
            value={descarte}
            onChange={(e) => setDescarte(e.target.value)}
            disabled={isPending}
          />
        </label>

        {paquetesValido && (
          <p className={excede ? styles.previewBad : styles.preview} aria-live="polite">
            {lechugas.toLocaleString('es-CL')} lechugas
            {descarteValido && descarteNum > 0
              ? ` + ${descarteNum.toLocaleString('es-CL')} descarte`
              : ''}{' '}
            = {totalRetirado.toLocaleString('es-CL')} retiradas · quedan{' '}
            {Math.max(restante, 0).toLocaleString('es-CL')}
            {excede ? ' — excede lo disponible' : esTotal ? ' — cierra la unidad' : ''}
          </p>
        )}

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
            {isPending ? 'Registrando…' : 'Registrar cosecha'}
          </button>
        </div>
      </form>
    </div>
  );
}
