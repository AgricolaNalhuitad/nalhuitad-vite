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

## Decisiones técnicas tomadas — no revertir

### Build & tooling

- **Vite 6** sobre CRA/webpack — migración desde el stack legacy (React 18 Babel standalone). No volver atrás.
- **pnpm** sobre npm/yarn — lockfile comprometido, scripts configurados. Cambiar rompe reproducibilidad.
- **TypeScript 5 strict** — modo estricto activado desde el inicio. No bajar `strict: false` para "solucionar" errores de tipos; arreglar el tipo.

### Estado

- **Zustand 5** para estado cliente/UI — elegido sobre Redux (demasiado boilerplate) y Context API (re-renders, no escala). No migrar a Redux.
- **React Query 5** para estado servidor — elegido sobre Redux Toolkit Query y SWR. Separación explícita: Zustand = UI state, React Query = server state. No mezclar.

### Estilos

- **CSS Modules** sobre Tailwind, styled-components y Emotion — colocalización con el componente (`X.module.css` al lado de `X.tsx`). No migrar a utilidades inline.
- **CSS variables para todos los tokens** — colores, espaciados, colores de etapa. Nunca hardcodear hex. Los temas dark/light se resuelven en `:root` y `[data-theme="light"]`.

### Testing

- **Vitest 2 + RTL** sobre Jest — integración nativa con Vite, sin config extra. No migrar a Jest.
- **Tests colocados junto al código** (`X.test.tsx` al lado de `X.tsx`) — no en carpeta `__tests__` separada.
- **TDD para lógica de negocio** — test rojo primero, luego implementación. No escribir implementación antes del test en lógica de dominio.

### Backend

- **Firebase SDK v10 (modular)** sobre Supabase u otras alternativas — proyecto `nalhuitad-d6758` ya en producción con datos reales. No cambiar de proveedor.
- **Credenciales en `.env.local`** (gitignored) — nunca en el código ni en el repo.

### Arquitectura de componentes

- **`lotPlantasIniciales(lot)`** para contar plantas de lotes hijos — verifica `parentId`. No usar `toPlants(lot.quantity)` directamente en lotes hijos.
- **Routing: `/lotes/nuevo`** para crear lotes — no `/mas/nuevo` ni variantes.

### Documentación y agentes

- **Issues como archivos markdown** en `.scratch/<feature>/` — no GitHub Issues ni Linear para el flujo de agentes.
- **Single-context**: `CONTEXT.md` + `docs/adr/` como fuente de verdad del dominio — no duplicar en otros lugares.
- **Legacy preservada** en producción (`agricolanalhuitad.github.io`) — la nueva app convive, no reemplaza abruptamente. Ningún cambio puede romper la legacy.

---

## Workflow Boris Cherny

1. **Modo plan primero** — activar `Shift+Tab` antes de escribir cualquier código. Pensar toda la arquitectura antes de tocar nada.
2. **"Think hard"** al inicio de prompts complejos — activa un flujo de razonamiento más profundo.
3. **CLAUDE.md vivo** — cada vez que la IA cometa un error, actualizar este archivo inmediatamente con el error y la corrección. No esperar.
4. **Code review con otro Claude** — usar un Claude para revisar el PR generado por otro Claude. Los humanos hacen acceptance testing, no revisión línea a línea.
5. **Parallel agents con Git Worktrees** — una sesión por área (frontend / backend / auth), fusionar al final. Acelera proyectos 3x–5x.

## Workflow tareas complejas — mini-spec + interview

Para tareas que cumplan **cualquiera** de estas:

- Tocan ≥3 archivos o ≥3 pasos distintos
- Tocan código en producción (`firestore.rules`, `src/lib/firebase.ts`, scripts deploy)
- Tienen ≥2 opciones de implementación válidas
- Grigor describió el qué pero no el cómo

Antes de escribir código, ejecutar **mini-spec + interview**:

1. **Mini-spec inline (3–5 líneas):** resumir qué se va a hacer, qué archivos toca, qué invariantes preserva, y cuál es el criterio de éxito.
2. **Interview con `AskUserQuestion`:** 1–3 preguntas concretas que resuelvan las decisiones ambiguas. No preguntar cosas obvias del contexto; sí preguntar trade-offs reales.
   - Para cada opción ofrecida, incluir una descripción que explique la consecuencia (no solo el nombre)
   - Marcar "(Recommended)" la opción que el contexto del repo sugiere
3. **Recién después** de recibir respuestas: implementar.

Por qué: evita ir-y-volver. Las preguntas batchead toman 30s para Grigor y ahorran reescribir código. Las que se pueden inferir del contexto NO se preguntan — eso es ruido.

## Agentes y skills disponibles (project-local)

Cuándo invocar cada uno:

| Surface                                | Cuándo                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `nalhuitad-lotes` (agent)              | Cualquier cambio en Lotes, Sprint 4 trazabilidad LO+UP, mutaciones Firestore `lotes/`  |
| `nalhuitad-seguridad` (agent)          | Firestore rules, RBAC custom claims, .env\*, scripts deploy. Conservador por diseño    |
| `nalhuitad-context` (skill)            | Cualquier cosa del proyecto — auto-carga con triggers de nalhuitad                     |
| `nuevo-lote` (skill)                   | CreateLotScreen, createLot, NewLotInput                                                |
| `registro-cosecha` (skill)             | HarvestSheet, registerHarvest, alerta Telegram                                         |
| `nalhuitad-formulacion-chiloe` (skill) | Solución nutritiva, EC/pH, fertigación — adapta resh-hydroponics y sonneveld para 42°S |
| `firebase-basics` (skill)              | Firestore v10 modular, transactions, RBAC. Obliga consultar context7                   |
| `/careful` (skill)                     | Antes de tocar paths críticos — entra plan mode + autoimpone deny                      |
| `/freeze` (skill)                      | Snapshot git tag antes de operación de alto riesgo + modo no-write                     |

Sensores: ver `references/sensors.md` — agente bloqueado por hardware, blueprint documentado para activación futura.

## Errores conocidos — nunca repetir

1. **`useState('')` para variedad** — siempre `useState('Milena')` como default.
2. **`setState` dentro de `useEffect`** — mover resets al handler (`retry`), nunca dentro del efecto.
3. **`toPlants(lot.quantity)` en lotes hijos** — usar `lotPlantasIniciales(lot)` que verifica `parentId`.
4. **Ruta `/mas/nuevo` para crear lotes** — la ruta correcta es `/lotes/nuevo`.
5. **Template literals anidados en JSX** — nunca, sin excepciones.
6. **Hooks después de returns condicionales** — nunca, sin excepciones (React error #310).
7. **CRÍTICO: Borrar directorios de skills/config sin inventario previo** — antes de borrar cualquier directorio de skills o configuración, hacer inventario completo verificando el origen de cada item. En la limpieza de ECC del 24-05-2026 se borró `book-to-skill` (virgiliojr94) que no era de ECC. Nunca asumir que un directorio contiene solo una fuente sin verificar item por item.
