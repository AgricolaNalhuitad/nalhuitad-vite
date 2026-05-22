import { useState } from 'react';
import { STAGE_ORDER, STAGE_LABELS } from './stages';
import { useAdvanceStage } from './useLotMutations';
import type { Lot } from './types';
import styles from './AdvanceStageSheet.module.css';

interface Props {
  lot: Lot;
  onClose: () => void;
}

export function AdvanceStageSheet({ lot, onClose }: Props) {
  const currentIdx = STAGE_ORDER.indexOf(lot.stage);
  const nextStage = STAGE_ORDER[currentIdx + 1] ?? 'cosecha';
  const nextLabel = STAGE_LABELS[nextStage];
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { mutateAsync, isPending } = useAdvanceStage(lot.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({
      newStage: nextStage,
      date,
      ...(quantity ? { quantity: Number(quantity) } : {}),
      ...(notes ? { notes } : {}),
    });
    onClose();
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <p className={styles.title}>Avanzar a {nextLabel}</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Fecha
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className={styles.input} required
            />
          </label>
          <label className={styles.label}>
            Cantidad actual (opcional)
            <input
              type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
              className={styles.input} placeholder="plantas"
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
              {isPending ? 'Guardando…' : `Avanzar a ${nextLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
