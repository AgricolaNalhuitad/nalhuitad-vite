import styles from './PlaceholderScreen.module.css';

interface Props {
  name: string;
}

export function PlaceholderScreen({ name }: Props) {
  return (
    <section className={styles.root}>
      <h1 className={styles.title}>{name}</h1>
      <p className={styles.note}>Próximamente — pantalla {name} de la migración Fase A.</p>
    </section>
  );
}
