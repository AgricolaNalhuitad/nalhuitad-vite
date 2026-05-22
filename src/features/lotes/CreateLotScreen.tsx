import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLot } from './useLotMutations';
import styles from './CreateLotScreen.module.css';

export function CreateLotScreen() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(today);
  const [invernadero, setInvernadero] = useState<'A' | 'B'>('A');
  const [tipo, setTipo] = useState('piscina');
  const [identificador, setIdentificador] = useState('');

  const { mutateAsync, isPending } = useCreateLot();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({
      name,
      variety,
      date,
      quantity: Number(quantity),
      location: { invernadero, tipo, identificador },
    });
    navigate('/lotes');
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button className={styles.cancelBtn} onClick={() => navigate('/lotes')}>Cancelar</button>
        <h1 className={styles.title}>Nuevo lote</h1>
        <span />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label} htmlFor="name">
          Nombre
          <input
            id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            className={styles.input} placeholder="ej. Milena Norte" required
          />
        </label>

        <label className={styles.label} htmlFor="variety">
          Variedad
          <input
            id="variety" type="text" value={variety} onChange={(e) => setVariety(e.target.value)}
            className={styles.input} placeholder="ej. Milena" required
          />
        </label>

        <label className={styles.label} htmlFor="quantity">
          Bandejas
          <input
            id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
            className={styles.input} placeholder="ej. 21" required min="1"
          />
        </label>

        <label className={styles.label} htmlFor="date">
          Fecha de siembra
          <input
            id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className={styles.input} required
          />
        </label>

        <p className={styles.groupLabel}>Ubicación</p>

        <label className={styles.label} htmlFor="invernadero">
          Invernadero
          <select
            id="invernadero" value={invernadero}
            onChange={(e) => setInvernadero(e.target.value as 'A' | 'B')}
            className={styles.input}
          >
            <option value="A">Invernadero A</option>
            <option value="B">Invernadero B</option>
          </select>
        </label>

        <label className={styles.label} htmlFor="tipo">
          Tipo
          <select
            id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}
            className={styles.input}
          >
            <option value="piscina">Piscina</option>
            <option value="tubo">Tubo</option>
            <option value="canal">Canal</option>
          </select>
        </label>

        <label className={styles.label} htmlFor="identificador">
          Identificador
          <input
            id="identificador" type="text" value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            className={styles.input} placeholder="ej. P01" required
          />
        </label>

        <button type="submit" className={styles.submitBtn} disabled={isPending}>
          {isPending ? 'Creando…' : 'Crear lote'}
        </button>
      </form>
    </div>
  );
}
