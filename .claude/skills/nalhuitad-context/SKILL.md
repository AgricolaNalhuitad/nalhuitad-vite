---
name: nalhuitad-context
description: Use when user mentions nalhuitad, the app, lotes, invernadero, cosecha, almácigo, Milena, Chiloé, or modifies code in nalhuitad-vite. Hydroponic lettuce farm app (Chonchi, Chiloé) — owner Grigor, real production data.
---

# Nalhuitad Context

Operación hidropónica comercial en Chonchi, Chiloé. Dueño: **Grigor** (abogado, no programador). Datos reales en producción. App móvil que migra el stack legacy (`nalhuitad-app/` React 18 Babel standalone → `nalhuitad-vite/` React 19 + Vite 6).

## Reglas críticas

**Nunca:**
- `npm` / `yarn` — solo **`pnpm`**
- Hooks después de returns condicionales (React error #310)
- Colores hex hardcodeados — usar `var(--green)`, `var(--bg-card)`, etc.
- Commitear `.env.local` (credenciales Firebase reales)
- Template literals anidados
- Tocar app legacy en producción: `https://agricolanalhuitad.github.io/nalhuitad.github.io`

**Siempre:**
- `pnpm typecheck && pnpm lint && pnpm test:run` antes de cerrar tarea
- CSS Modules por componente (`X.module.css` junto a `X.tsx`)
- Tests colocados junto al código (`X.test.tsx` junto a `X.tsx`)
- TDD para lógica de negocio: test rojo → implementación → test verde

## Dominio

**Invernaderos:**

| ID    | Lugar     | Sistema            | Plantas |
|-------|-----------|--------------------|---------|
| Inv D | Castro    | Germinación/almácigo | —     |
| Inv C | Nalhuitad | Aclimatación       | —       |
| Inv A | Nalhuitad | DWC raíz flotante  | 2.016   |
| Inv B | Nalhuitad | NFT tubos          | 1.740   |

**Etapas de lote (orden estricto):** `almacigo` → `transplante` → `raleo` → `cosecha`

**Cosecha:** 210 lechugas/viaje · Variedad principal: **Milena** · Ubicación: Chonchi, Chiloé

## Firebase

Proyecto: `nalhuitad-d6758`

Vars requeridas en `.env.local` (gitignored — Grigor las crea localmente):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN      → nalhuitad-d6758.firebaseapp.com
VITE_FIREBASE_PROJECT_ID       → nalhuitad-d6758
VITE_FIREBASE_APP_ID
```
`lib/firebase.ts` valida al boot y lanza error explícito si falta alguna.

## Paleta CSS (`src/styles/tokens.css`)

Usar **siempre variables CSS**, nunca hex directamente en componentes.

| Grupo        | Variables                                              |
|--------------|--------------------------------------------------------|
| Fondos       | `--bg-1` `--bg-2` `--bg-card` `--bg-card-h` `--bg-input` |
| Texto        | `--text-1` `--text-2` `--text-3`                       |
| Bordes       | `--border` `--sep`                                     |
| Etapas       | `--stage-a` `--stage-t` `--stage-r` `--stage-c`        |
| Semánticos   | `--green` `--red` `--amber`                            |
| Navegación   | `--nav-bg` `--nav-active` `--nav-inactive`             |

Tema dark por defecto (`data-theme="dark"` en `<html>`). Variables light disponibles en `[data-theme='light']`.

## Colores de etapa

| Etapa      | Variable     | Dark          | Light         |
|------------|--------------|---------------|---------------|
| Almácigo   | `--stage-a`  | `#C4873B`     | `#B8701A`     |
| Transplante| `--stage-t`  | `#3B8DD4`     | `#1E6DB5`     |
| Raleo      | `--stage-r`  | `#B83D7A`     | `#A02870`     |
| Cosecha    | `--stage-c`  | `#7C4DDB`     | `#6B3FA0`     |

## Sprint actual

**Fase A Sprint 1 ✅** — 31/31 tests · 161 KB gzipped  
Auth completo + routing + AppShell con bottom tabs + SplashScreen + PlaceholderScreens

**Sprint 2 pendiente** — Pantalla Lotes con Firestore real

## Stack

Vite 6 · React 19 · TypeScript 5 strict · Firebase SDK v10 · Zustand 5 · React Query 5 · Vitest 2 + RTL · CSS Modules · pnpm

## Referencias de nivel 3 (cargar solo si se trabaja en ese módulo)

- `@.claude/skills/nalhuitad-context/references/sensors.md` — integración sensores (bloqueada por hardware)
- `@.claude/skills/nalhuitad-context/references/nutrient-formulation.md` — formulación de nutrientes
- `@.claude/skills/nalhuitad-context/references/financial-module.md` — módulo financiero (futuro)
- `@.claude/skills/nalhuitad-context/references/capacitor-integration.md` — wrapper Capacitor (`nalhuitad-app/`)
