import { QrCode } from './QrCode';
import styles from './PrintableQr.module.css';

interface PrintableQrProps {
  /** UP cuyo detalle abre el QR al escanear (`{origin}/up/{upId}`). */
  upId: string;
  nombre: string;
  variedad: string;
  fechaSiembra: string;
}

/** Etiqueta imprimible: QR + nombre amigable + variedad + fecha (FR-020). */
export function PrintableQr({ upId, nombre, variedad, fechaSiembra }: PrintableQrProps) {
  const url = `${window.location.origin}/up/${upId}`;
  return (
    <div className={styles.label}>
      <QrCode value={url} size={208} title={`QR de ${nombre}`} />
      <div className={styles.meta}>
        <p className={styles.nombre}>{nombre}</p>
        <p className={styles.dato}>{variedad}</p>
        <p className={styles.dato}>{fechaSiembra}</p>
      </div>
    </div>
  );
}
