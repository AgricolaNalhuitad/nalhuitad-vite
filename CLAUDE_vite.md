# Nalhuitad — Vite App

Operación hidropónica comercial en Chonchi, Chiloé. Esta app reemplaza el stack legacy (React 18 Babel standalone). El dueño es Grigor — abogado, no programador. Los datos son reales y en producción.

## Stack
Vite 6 · React 19 · TypeScript 5 strict · Firebase SDK v10 · Zustand 5 · React Query 5 · Vitest 2 + RTL · CSS Modules · pnpm

## Reglas críticas

**Nunca:**
- Usar npm o yarn — solo pnpm
- Llamar hooks después de returns condicionales (React error #310)
- Hardcodear colores hex — usar variables CSS (`var(--green)`, `var(--bg-card)`, etc.)
- Commitear credenciales Firebase — están en `.env.local` (gitignored)
- Romper la app legacy en producción: `https://agricolanalhuitad.github.io/nalhuitad.github.io`

**Siempre:**
- `pnpm typecheck && pnpm lint && pnpm test:run` antes de dar una tarea por terminada
- CSS Modules por componente (`X.module.css` al lado de `X.tsx`)
- Tests colocados junto al código (`X.test.tsx` al lado de `X.tsx`)
- TDD para lógica de negocio: test rojo → implementación → test verde

## Firebase
Proyecto: `nalhuitad-d6758`
Variables de entorno requeridas en `.env.local`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

## Dominio — lo que el código no puede decir

**Etapas de un lote (en orden):** `almacigo` → `transplante` → `raleo` → `cosecha`

**Invernaderos:**
- Inv D (Castro): germinación/almácigo
- Inv C (Nalhuitad): aclimatación
- Inv A (Nalhuitad): DWC raíz flotante, 2.016 plantas
- Inv B (Nalhuitad): NFT tubos, 1.740 plantas

**Cosecha:** 210 lechugas por viaje. Variedad principal: Milena.

**Colores de etapa:**
- Almácigo: `--stage-a` (#C4873B dark / #B8701A light)
- Transplante: `--stage-t` (#3B8DD4 dark / #1E6DB5 light)
- Raleo: `--stage-r` (#B83D7A dark / #A02870 light)
- Cosecha: `--stage-c` (#7C4DDB dark / #6B3FA0 light)

## Fase A — Estado
Sprint 1 completo ✅ (31/31 tests, 161KB gzipped)
Sprint 2 pendiente: pantalla Lotes con Firestore real

## Agent skills

### Issue tracker
Issues viven como archivos markdown bajo `.scratch/<feature>/`. Ver `docs/agents/issue-tracker.md`.

### Triage labels
needs-triage · needs-info · ready-for-agent · ready-for-human · wontfix. Ver `docs/agents/triage-labels.md`.

### Domain docs
Single-context: `CONTEXT.md` + `docs/adr/` en la raíz. Ver `docs/agents/domain.md`.
