---
name: firebase-basics
description: Use when implementing Firestore reads/writes, custom claims/RBAC, security rules, or Firebase Auth flows in nalhuitad-vite. Documenta patrones Firebase v10 modular específicos de la app (proyecto nalhuitad-d6758) y obliga consultar context7 antes de inventar APIs.
---

# Firebase basics — nalhuitad-vite

Patrones Firebase v10 modular usados en este repo. **Cuando dudes de una API**, consulta context7 (no inventes). Cuando toques rules o auth, escala a `nalhuitad-seguridad`.

## Stack en uso

| Capa | Versión | Archivo principal |
|---|---|---|
| Firebase SDK | v10 modular | `src/lib/firebase.ts` |
| Firestore | v10 | `src/features/lotes/lotApi.ts` |
| Auth | v10 (email/password) | `src/features/auth/useSessionStore.ts` |
| Rules | Firebase Rules v2 | `firestore.rules` |
| Emulador | firebase-tools | `pnpm test:rules` |
| Proyecto | `nalhuitad-d6758` | `.firebaserc` (no commiteado en este repo) |

## Cuándo consultar context7 (mandatorio, no opcional)

Antes de escribir CUALQUIERA de estos, llamar a context7 con el topic exacto:

| Topic context7 | Cuándo |
|---|---|
| `firebase firestore modular query` | Antes de crear `query(collection(...), where(...), orderBy(...))` |
| `firebase firestore transactions` | Antes de cualquier `runTransaction` o batch que toque múltiples docs |
| `firebase firestore arrayUnion arrayRemove` | Para mutar arrays como `stageHistory` |
| `firebase auth custom claims` | Antes de leer/escribir RBAC claims |
| `firestore security rules v2` | Antes de modificar `firestore.rules` |
| `firebase rules unit testing v3` | Antes de tocar `tests/security/firestore.rules.test.ts` |
| `firebase emulator suite` | Antes de cambiar config de `firebase.json` o `pnpm test:rules` |

Comando vía MCP (context7 ya configurado en `.mcp.json`):
```
mcp__context7__resolve-library-id → firebase
mcp__context7__get-library-docs → /firebase/firebase-js-sdk topic="<topic>"
```

> **Nunca** copiar snippets de blog posts o Stack Overflow viejos sin verificar contra context7. Firebase rota APIs entre minor versions.

## Patrones canónicos del repo (no reinventar)

### Boot + validación de env

```ts
// src/lib/firebase.ts — validación obligatoria al boot
const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

for (const key of required) {
  if (!import.meta.env[key]) {
    throw new Error(`Falta env var ${key} — agregar a .env.local`);
  }
}
```

Cualquier nueva env var (Telegram, etc.) sigue este patrón. No fallback silencioso.

### Lectura: query + onSnapshot

```ts
const q = query(
  collection(db, 'lotes'),
  where('stage', '!=', 'cosechado'),
  orderBy('date', 'desc'),
);
const unsubscribe = onSnapshot(q, (snap) => { /* ... */ });
```

Wrap en React Query (`useQuery`) — nunca un `onSnapshot` desnudo en componente sin cleanup.

### Mutación: updateDoc + arrayUnion

```ts
await updateDoc(doc(db, 'lotes', id), {
  stage: 'cosecha',
  stageHistory: arrayUnion({ stage: 'cosecha', date, ...payload }),
});
```

Si la mutación toca >1 doc (ej. lote padre + lote hijo) → **transaction obligatoria**, no `await` secuenciales.

### Transacciones

```ts
await runTransaction(db, async (tx) => {
  const padre = await tx.get(doc(db, 'lotes', padreId));
  if (!padre.exists()) throw new Error('lote padre no existe');
  const remaining = padre.data().currentQuantity - quantity;
  tx.update(padre.ref, { currentQuantity: remaining });
  tx.set(doc(collection(db, 'lotes')), { ...hijo, parentId: padreId });
});
```

Reglas:
- Todas las lecturas ANTES de todas las escrituras (regla Firestore)
- Lanzar errores explícitos para abortar
- Tests con emulador, no mocks

### Custom claims (RBAC)

```ts
// Leer claim en el cliente
const token = await user.getIdTokenResult(true); // forceRefresh
const isAdmin = token.claims.admin === true;
const isCosechador = token.claims.cosechador === true;
```

**Asignar** custom claims se hace **fuera de este repo** (script admin Firebase Functions o consola). El cliente solo lee.

> **Crítico — pre-flight RBAC:** ANTES de deployar reglas que requieran un claim nuevo, verificar que las cuentas existentes en producción TIENEN el claim asignado. Ver `feedback_rbac_claims_preflight.md`. Incidente real: commit `20fdf1b`.

### Security rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuth() { return request.auth != null; }
    function isAdmin() { return isAuth() && request.auth.token.admin == true; }
    function isCosechador() { return isAuth() && request.auth.token.cosechador == true; }

    match /lotes/{lotId} {
      allow read: if isAuth();
      allow create, update: if isCosechador() || isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

Reglas:
- Funciones helper para no repetir `request.auth.token.X == true`
- **Nunca** `if request.auth != null` solo para mutaciones — siempre claim específico
- Probar cada regla en `firestore.rules.test.ts` con cuentas mock que tienen/no tienen el claim

## Anti-patterns Firebase específicos del repo

| Problema | Causa | Fix |
|---|---|---|
| `addDoc` retorna id pero el cliente no lo refleja | No invalidar React Query | `qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY })` en `onSuccess` |
| Lectura "fresca" no refleja write reciente | Caché del SDK | Usar `getDocFromServer` solo cuando crítico — agrega latencia |
| Permission-denied silencioso post-deploy rules | Claim faltante en cuenta de prod | Pre-flight: `firebase auth:export` y verificar claims |
| Test pasa con mock pero falla con emulador | Mock no replica reglas de seguridad | Tests de seguridad SIEMPRE con emulador (`pnpm test:rules`) |
| `runTransaction` aborta sin error visible | Función retorna void cuando debería retornar valor | Retornar el valor desde la callback de `runTransaction` |
| `arrayUnion` no dedupe entries idénticas | Objetos con shapes distintos no son iguales | Validar antes de unir — o usar map keyed por id |
| App crashea al boot con env vacío | `.env.local` no existe en máquina nueva de Grigor | El boot debe lanzar error claro indicando qué var falta y dónde agregarla |

## Procedimiento — modificar un campo del doc `lotes/`

1. Actualizar tipo en `types.ts`
2. Actualizar API en `lotApi.ts` (TDD: test rojo primero)
3. Si el campo afecta lecturas/escrituras protegidas → editar `firestore.rules`
4. Editar `tests/security/firestore.rules.test.ts` — caso con permiso + sin permiso
5. Correr `pnpm test:rules` (emulador) — verde
6. Correr `pnpm test:run` — verde
7. Si rules cambió: invocar `/careful` antes de cualquier deploy
8. `firebase deploy --only firestore:rules --dry-run` → revisar diff
9. Pre-flight RBAC si rules nuevas dependen de claim — verificar cuentas existentes
10. Confirmar a Grigor → deploy real → monitorear permission-denied 30 min

## Cuándo escalar a `nalhuitad-seguridad`

- Cualquier cambio en `firestore.rules` o sus tests
- Cualquier modificación al modelo de RBAC
- Antes de cambiar `.env*`
- Antes de un `firebase deploy` real (no `--dry-run`)
