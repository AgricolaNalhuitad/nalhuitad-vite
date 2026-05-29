# Quickstart: Trazabilidad LO+UP

## Prerrequisitos

```bash
pnpm install
# añadir dependencias del feature:
pnpm add qrcode.react html5-qrcode
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

`.env.local` con las `VITE_FIREBASE_*` (ver `firebase.ts` REQUIRED_VARS).

## Desarrollo

```bash
pnpm dev            # SPA en vite
pnpm typecheck      # tsc --noEmit
pnpm lint
pnpm test           # vitest watch
pnpm test:run       # vitest CI
```

## Seed del catálogo de ubicaciones (una vez por entorno)

```bash
pnpm tsx scripts/seed-ubicaciones.ts   # idempotente; crea las 19 ubicaciones
```

## Reglas de seguridad (zona crítica)

```bash
pnpm test:rules     # firebase emulators:exec → vitest reglas
# tras revisar con gstack /code-review --ultra:
pnpm rules:deploy   # deploy reglas a producción
```

## E2E (Playwright sobre emulador)

```bash
firebase emulators:exec --only firestore,auth "pnpm exec playwright test"
```

Flujos cubiertos: siembra→QR · raleo 3 destinos · cosecha→auto-cierre LO. Guardrails aserttados: ubicación ocupada · suma de raleo no cuadra · cosecha excede.

## Verificación de éxito (mapea a Success Criteria)

| Verificación | Criterio |
|--------------|----------|
| Crear siembra de 6 bandejas Milena → aparece "Milena DD-Mmm", UP en Inv D, QR imprimible | SC-001, FR-001…004 |
| Ralear 540 en 3 destinos (200/240/100) → 3 UP hijas, origen 'trasladada', suma=540 | SC-002, FR-008…012 |
| Escanear QR de ubicación ocupada → muestra lote, días, genealogía en <2s | SC-004, FR-022 |
| Cosechar última UP de un lote → LO pasa a 'cosechado' y sale del listado | FR-019 |
| Toda UP activa resuelve su loteOrigenId | SC-003 |

> **Reality Check (CLAUDE.md):** CI verde ≠ prod. Tras deploy, verificar manualmente en prod los 3 flujos con datos reales antes de declarar READY.

## Switchover (corte limpio — operación humana, fuera de horario)

1. Deploy de reglas (con `lotes` legacy ya en deny-write) y de la app.
2. Seed de ubicaciones (`seed-ubicaciones.ts`).
3. **Recrear a mano** como LO+UP los pocos lotes en curso (los que aún no se cosechan), usando "Nueva siembra" + traslados al estado actual de cada uno.
4. Verificar que la vista "Histórico" (`/historico`) muestra los lotes viejos en solo-lectura (mutaciones deshabilitadas).
5. A partir de aquí, toda escritura nueva usa LO+UP; `lotes` queda congelada.

> No hay script de migración: el volumen (~puñado de lotes activos) hace la recreación manual más segura y simple que automatizarla.
