import { QRCodeSVG } from 'qrcode.react';

interface QrCodeProps {
  /** URL absoluta que codifica el QR (deep-link de la PWA). */
  value: string;
  /** Lado del QR en px. */
  size?: number;
  /** Etiqueta accesible; por defecto, el propio valor. */
  title?: string;
}

// Negro sobre blanco fijo: el QR debe ser legible por la cámara independientemente del
// tema de la app (un QR temático romperia el contraste de escaneo). No usar tokens aquí.
const QR_FG = '#000000';
const QR_BG = '#ffffff';

export function QrCode({ value, size = 192, title }: QrCodeProps) {
  const label = title ?? value;
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      bgColor={QR_BG}
      fgColor={QR_FG}
      marginSize={2}
      title={label}
      role="img"
      aria-label={label}
    />
  );
}
