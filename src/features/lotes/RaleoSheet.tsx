import { useState } from 'react';
import { useRegisterRaleo } from './useLotMutations';
import type { Lot } from './types';
import styles from './RaleoSheet.module.css';

interface Props {
  lot: Lot;
  onClose: () => void;
}

export function RaleoSheet({ lot, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [cantidadRaleada, setCantidad] = useState<string>('');
  const [fecha, setFecha] = useState(today);

  const { mutateAsync, isPending } = useRegisterRaleo(lot.id, lot.currentQuantity);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({ cantidadRaleada: Number(cantidadRaleada), fecha });
    onClose();
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <p className={styles.title}>Registrar raleo</p>
        <p className={styles.subtitle}>
          En producción: {lot.currentQuantity.toLocaleString('es-CL')} plantas
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Cantidad raleada (plantas)
            <input
              type="number" value={cantidadRaleada}
              onChange={(e) => setCantidad(e.target.value)}
              className={styles.input} required min="1"
              max={lot.currentQuantity}
            />
          </label>
          <label className={styles.label}>
            Fecha
            <input
              type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className={styles.input} required
            />
          </label>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? 'Guardando…' : 'Registrar raleo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
