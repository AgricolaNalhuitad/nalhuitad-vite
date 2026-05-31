import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrearSiembra } from '../useTrazabilidadMutations';
import { bandejasALechugas } from '../plantas';
import styles from './CrearSiembraScreen.module.css';

const hoyIso = () => new Date().toISOString().slice(0, 10);

function mensajeError(err: unknown): string {
  return err instanceof Error ? err.message : 'No se pudo registrar la siembra.';
}

export function CrearSiembraScreen() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCrearSiembra();
  const [variedad, setVariedad] = useState('Milena');
  const [bandejas, setBandejas] = useState('');
  const [fechaSiembra, setFechaSiembra] = useState(hoyIso);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);

  const bandejasNum = Number(bandejas);
  const previewLechugas =
    Number.isInteger(bandejasNum) && bandejasNum > 0 ? bandejasALechugas(bandejasNum) : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const variedadLimpia = variedad.trim();
    if (variedadLimpia === '') {
      setError('Indica la variedad.');
      return;
    }
    if (!Number.isInteger(bandejasNum) || bandejasNum < 1) {
      setError('Las bandejas deben ser un número entero mayor o igual a 1.');
      return;
    }
    if (bandejasNum > 100) {
      setError('Máximo 100 bandejas por siembra.');
      return;
    }
    if (fechaSiembra === '') {
      setError('Indica la fecha de siembra.');
      return;
    }
    setError(null);
    try {
      const { upId } = await mutateAsync({
        variedad: variedadLimpia,
        fechaSiembra,
        bandejas: bandejasNum,
        notas: notas.trim() || undefined,
      });
      navigate(`/up/${upId}/qr`);
    } catch (err) {
      setError(mensajeError(err));
    }
  };

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>Nueva siembra</h1>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <label className={styles.field}>
          <span className={styles.label}>Variedad</span>
          <input
            className={styles.input}
            value={variedad}
            onChange={(e) => setVariedad(e.target.value)}
            disabled={isPending}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Bandejas</span>
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            placeholder="6"
            value={bandejas}
            onChange={(e) => setBandejas(e.target.value)}
            disabled={isPending}
          />
        </label>
        {previewLechugas !== null && (
          <p className={styles.preview}>
            = {previewLechugas.toLocaleString('es-CL')} lechugas (135 por bandeja)
          </p>
        )}

        <label className={styles.field}>
          <span className={styles.label}>Fecha de siembra</span>
          <input
            className={styles.input}
            type="date"
            value={fechaSiembra}
            onChange={(e) => setFechaSiembra(e.target.value)}
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
            onClick={() => navigate('/trazabilidad')}
            disabled={isPending}
          >
            Cancelar
          </button>
          <button type="submit" className={styles.button} disabled={isPending}>
            {isPending ? 'Sembrando…' : 'Sembrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
