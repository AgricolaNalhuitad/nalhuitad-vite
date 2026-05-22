import { useState } from 'react';
import { useRegisterHarvest } from './useLotMutations';
import styles from './HarvestSheet.module.css';

interface Props {
  lotId: string;
  onClose: () => void;
}

export function HarvestSheet({ lotId, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');

  const { mutateAsync, isPending } = useRegisterHarvest(lotId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({ date, ...(notes ? { notes } : {}) });
    onClose();
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <p className={styles.title}>Registrar cosecha</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Fecha de cosecha
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className={styles.input} required
            />
          </label>
          <label className={styles.label}>
            Notas (opcional)
            <input
              type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className={styles.input}
            />
          </label>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? 'Guardando…' : 'Confirmar cosecha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
