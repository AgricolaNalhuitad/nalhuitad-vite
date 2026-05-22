import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLot } from './useLot';
import { useUpdateLot } from './useLotMutations';
import styles from './EditLotScreen.module.css';

export function EditLotScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lot, isLoading } = useLot(id!);
  const { mutateAsync, isPending } = useUpdateLot(id!);

  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [invernadero, setInvernadero] = useState<'A' | 'B'>('A');
  const [tipo, setTipo] = useState('piscina');
  const [identificador, setIdentificador] = useState('');

  useEffect(() => {
    if (lot) {
      setName(lot.name);
      setVariety(lot.variety);
      if (lot.location) {
        setInvernadero(lot.location.invernadero as 'A' | 'B');
        setTipo(lot.location.tipo);
        setIdentificador(lot.location.identificador);
      }
    }
  }, [lot]);

  if (isLoading) {
    return <div className={styles.skeleton} data-testid="edit-skeleton" />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutateAsync({
      name,
      variety,
      location: { invernadero, tipo, identificador },
    });
    navigate(`/lotes/${id}`);
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button className={styles.cancelBtn} onClick={() => navigate(`/lotes/${id}`)}>Cancelar</button>
        <h1 className={styles.title}>Editar lote</h1>
        <span />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label} htmlFor="name">
          Nombre
          <input
            id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            className={styles.input} required
          />
        </label>

        <label className={styles.label} htmlFor="variety">
          Variedad
          <input
            id="variety" type="text" value={variety} onChange={(e) => setVariety(e.target.value)}
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
            className={styles.input} required
          />
        </label>

        <button type="submit" className={styles.submitBtn} disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
