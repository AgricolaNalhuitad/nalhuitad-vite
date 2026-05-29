import type { Ubicacion } from './types';

function serie(
  invernadero: Ubicacion['invernadero'],
  tipo: Ubicacion['tipo'],
  prefijo: string,
  count: number,
  capacidadMaxima: number,
  funcion: string,
): Ubicacion[] {
  return Array.from({ length: count }, (_, i) => {
    const identificador = `${prefijo}${String(i + 1).padStart(2, '0')}`;
    return {
      id: `INV-${invernadero}-${identificador}`,
      invernadero,
      tipo,
      identificador,
      capacidadMaxima,
      funcion,
    };
  });
}

/**
 * Catálogo seed de las 19 ubicaciones físicas (FR-024). Fuente: spec.md.
 * Inv D=1 almácigo, Inv C=4 piscinas intermedias, Inv A=8 DWC, Inv B=6 NFT.
 */
export const UBICACIONES_SEED: readonly Ubicacion[] = [
  {
    id: 'INV-D-ALM',
    invernadero: 'D',
    tipo: 'almacigo',
    identificador: 'ALM',
    capacidadMaxima: 810,
    funcion: 'Germinación de almácigos',
  },
  ...serie('C', 'piscina_intermedia', 'P', 4, 540, 'Aclimatación y trasplante'),
  ...serie('A', 'piscina_dwc', 'P', 8, 252, 'Producción raíz flotante'),
  ...serie('B', 'bancada_nft', 'B', 6, 290, 'Producción NFT tubos'),
];
