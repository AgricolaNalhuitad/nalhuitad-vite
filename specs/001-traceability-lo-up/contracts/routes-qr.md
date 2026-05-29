# Contract: Rutas (react-router) + Esquema QR

## Rutas deep-link

| Ruta | Pantalla | Origen típico |
|------|----------|---------------|
| `/trazabilidad` | Listado de lotes activos (LO+UP) | nav principal |
| `/trazabilidad/siembra` | Crear siembra (Story 1) | botón "Nueva siembra" |
| `/up/:upId` | Detalle de UP + genealogía + historial (Story 2/5) | **escaneo QR de unidad** |
| `/up/:upId/qr` | Vista imprimible del QR de la UP | botón "Imprimir QR" |
| `/up/:upId/trasladar` | Form traslado (Story 2) | detalle UP |
| `/up/:upId/ralear` | Form raleo multi-destino (Story 3) | detalle UP |
| `/up/:upId/cosechar` | Form cosecha en paquetes (Story 4) | detalle UP |
| `/ubicacion/:ubicacionId` | Consulta "¿qué hay aquí?" (Story 5) | **escaneo QR de ubicación** |
| `/historico` | Lotes legacy solo-lectura (R6) | nav "Histórico" |

## Esquema QR

- **QR de unidad** codifica: `{origin}/up/{upId}` → al escanear con cámara nativa abre la PWA en el detalle de la UP (FR-021).
- **QR de ubicación** codifica: `{origin}/ubicacion/{ubicacionId}` → muestra la UP activa o "libre" (FR-022).
- `{origin}` = origen de despliegue de la PWA (env), para que el deep-link funcione desde la cámara del sistema.

## Generación

- Componente `<QrCode value={url} />` envuelve `qrcode.react` (render SVG).
- `<PrintableQrup={...} />`: layout imprimible con QR + `nombreAmigable` + `variety` + `fechaSiembra` (FR-020). CSS `@media print`.

## Escaneo

- Ruta primaria: cámara nativa del móvil (sin código — el QR es una URL).
- Fallback in-app `<QrScanner onResult={(url)=>navigate(parsePath(url))} />`:
  - usa `BarcodeDetector` si está disponible; si no, `html5-qrcode`.
  - `parsePath(url)`: extrae `/up/:id` o `/ubicacion/:id` del URL escaneado; ignora orígenes ajenos.
- Degradación (FR-023): buscador por `nombreAmigable` cuando el QR es ilegible.
