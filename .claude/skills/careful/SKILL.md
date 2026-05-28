---
name: careful
description: Use when about to touch high-risk paths (firestore.rules, .env*, scripts deploy, RBAC), when working on a Sprint en producción, o cuando Grigor pide "modo cuidadoso". Activa plan mode + restricciones explícitas a Edit/Write antes de actuar.
---

# /careful — Modo cuidadoso

Activate this skill ANTES de modificar nada en zonas críticas. Es un **primer de comportamiento** — no edita settings.json, pero impone disciplina en este turno.

## Cuando activar

- Vas a tocar `firestore.rules`, `firestore.indexes.json`, o cualquier archivo bajo `tests/security/`
- Vas a editar `.env*`, `firebase.json`, scripts en `scripts/deploy*`, o `package.json` (deps)
- Vas a correr un `firebase deploy` (con o sin `--dry-run`)
- Vas a cambiar RBAC custom claims o lógica de auth (`src/lib/auth*`, `useSessionStore`)
- Grigor dice "ojo", "cuidado", "modo seguro", o invoca `/careful` explícitamente

## Disciplina obligatoria (en este turno)

1. **EnterPlanMode inmediatamente** si no estás ya en plan mode. No saltarte este paso.
2. **NO usar Edit / Write / NotebookEdit en estos paths:**
   - `firestore.rules`, `firestore.indexes.json`
   - `.env`, `.env.local`, `.env.*`
   - `scripts/deploy*`, `scripts/migrate*`, `scripts/seed*`
   - `firebase.json`, `.firebaserc`
   - `package.json` (cambios de deps)
   - `tests/security/firestore.rules.test.ts`
3. **Si necesitas modificar uno de esos paths**, presentas el cambio propuesto como diff en plan mode y esperas a que Grigor diga "ok ejecuta".
4. **Antes de cualquier `firebase deploy`** (incluso `--dry-run`):
   - Confirmar que tests `pnpm test:rules` pasan
   - Verificar que hay rollback plan (último commit estable identificado)
   - Verificar pre-flight RBAC: custom claims asignados a cuentas reales (ver `feedback_rbac_claims_preflight`)
5. **Cerrar con summary explícito** de qué se cambió y qué no, antes de salir de careful mode.

## Por qué esto y no settings.json deny

Las deny rules permanentes son inflexibles — un día querrás editar `firestore.rules` legítimamente y vas a tener que tocar settings.json en caliente. El skill como **primer de comportamiento** te da el mismo efecto, dura solo este turno, y deja decisiones en manos del operador.

## Salir de careful mode

Cuando termine la tarea sensible, decir explícitamente "saliendo de careful mode" en el summary final. El siguiente turno vuelve a operación normal.

## Anti-patterns

- Activar `/careful` y después hacer Edits "rápidos" sin presentar diff primero
- Saltarse plan mode "porque es un cambio chiquito"
- Ejecutar `firebase deploy` sin --dry-run primero
- Modificar tests de rules para que pasen en vez de arreglar la lógica
