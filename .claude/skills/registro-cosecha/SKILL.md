---
name: registro-cosecha
description: Use when implementing or modifying harvest registration in nalhuitad — selecting active lots, recording cantidad cosechada + descarte, writing to Firestore, and sending a Telegram alert.
---

# Registro de Cosecha

Workflow completo para registrar una cosecha en la app nalhuitad: selección de lote, captura de datos, persistencia en Firestore y notificación por Telegram.

## Cuándo usar

- Implementar o ampliar `HarvestSheet.tsx`
- Agregar campos `cantidadCosechada` / `descarte` al flujo de cosecha
- Integrar notificación Telegram al registrar cosecha
- Modificar `HarvestInput`, `registerHarvest`, o `useRegisterHarvest`

## Workflow (5 pasos)

```
1. Seleccionar lote activo
2. Ingresar cantidad cosechada (lechugas)
3. Ingresar descarte (lechugas)
4. Registrar en Firestore
5. Enviar alerta a Telegram
```

---

## Paso 1 — Seleccionar lote activo

Solo lotes en etapa `'cosecha'` son elegibles. El lote se recibe como prop `lotId: string` desde `LotDetailScreen` — no hay selector libre; el usuario llega al sheet desde el lote que ya abrió.

```tsx
// Solo habilitar el botón "Registrar cosecha" cuando:
lot.stage === 'cosecha';
```

---

## Paso 2 & 3 — Campos del formulario

Agregar a `HarvestInput` (en `types.ts`):

```ts
export interface HarvestInput {
  date: string; // ISO YYYY-MM-DD
  cantidadCosechada: number; // lechugas cosechadas
  descarte: number; // lechugas descartadas
  notes?: string;
}
```

Validaciones del formulario:

- `cantidadCosechada` ≥ 1
- `descarte` ≥ 0
- `descarte` < `cantidadCosechada`
- Referencia: 210 lechugas/viaje es la capacidad estándar por cosecha

---

## Paso 4 — Firestore

Actualizar `registerHarvest` en `lotApi.ts`:

```ts
export async function registerHarvest(id: string, input: HarvestInput): Promise<void> {
  const entry = {
    stage: 'cosecha',
    date: input.date,
    cantidadCosechada: input.cantidadCosechada,
    descarte: input.descarte,
    ...(input.notes !== undefined && { notes: input.notes }),
  };
  await updateDoc(doc(db, 'lotes', id), {
    stage: 'cosecha',
    stageHistory: arrayUnion(entry),
  });
}
```

Colección: `lotes/{lotId}` — campo `stageHistory` (arrayUnion).

---

## Paso 5 — Alerta Telegram

### Configuración

Variable de entorno en `.env.local` (nunca commitear):

```
VITE_TELEGRAM_BOT_TOKEN=...
VITE_TELEGRAM_CHAT_ID=...
```

Registrar en `lib/firebase.ts` o crear `lib/notifications.ts` con validación al boot.

### Implementación

```ts
// lib/telegram.ts
export async function sendTelegramAlert(message: string): Promise<void> {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // silencioso en dev si no están configuradas
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });
}
```

### Formato del mensaje

```ts
function buildHarvestMessage(lotName: string, input: HarvestInput): string {
  const neto = input.cantidadCosechada - input.descarte;
  return (
    `🥬 <b>Cosecha registrada</b>\n` +
    `Lote: ${lotName}\n` +
    `Fecha: ${input.date}\n` +
    `Cosechadas: ${input.cantidadCosechada} lechugas\n` +
    `Descarte: ${input.descarte}\n` +
    `<b>Neto: ${neto} lechugas</b>`
  );
}
```

### Llamada desde el mutation hook

```ts
// useLotMutations.ts — useRegisterHarvest
onSuccess: async () => {
  await sendTelegramAlert(buildHarvestMessage(lotName, input));
  void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY });
  void qc.invalidateQueries({ queryKey: lotQueryKey(id) });
},
```

> El `lotName` debe pasarse como parámetro extra al hook o resolverse desde el cache de React Query antes de llamar `mutateAsync`.

---

## Orden de implementación (TDD)

1. **types.ts** — ampliar `HarvestInput`
2. **lotApi.test.ts** — test rojo para `registerHarvest` con nuevos campos
3. **lotApi.ts** — implementación (`arrayUnion` con `cantidadCosechada` y `descarte`)
4. **lib/telegram.ts** — helper con test unitario (mockear `fetch`)
5. **useLotMutations.test.ts** — verificar que `onSuccess` llama `sendTelegramAlert`
6. **HarvestSheet.tsx** — ampliar formulario con los 2 campos nuevos
7. **HarvestSheet.test.tsx** — test de submit con los campos completos

Ejecutar siempre al cierre: `pnpm typecheck && pnpm lint && pnpm test:run`

---

## Gotchas

| Problema                                                 | Causa                                                                         | Fix                                                                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `StageHistoryEntry` no acepta nuevos campos              | El tipo no fue actualizado                                                    | Agregar `cantidadCosechada?` y `descarte?` a `StageHistoryEntry` en `types.ts`                                        |
| Telegram silenciado en producción                        | `VITE_TELEGRAM_*` no está en `.env.local` de Grigor                           | Documentar en README de setup; el helper no lanza error si las vars faltan                                            |
| `lotName` undefined en `onSuccess`                       | El hook no recibe el nombre del lote                                          | Pasarlo como parámetro al hook: `useRegisterHarvest(id, lotName)`                                                     |
| Descarte ≥ cantidad cosechada                            | Sin validación en el formulario                                               | Validar antes de habilitar el botón submit                                                                            |
| `registerHarvest` rebota con `permission-denied`         | Cuenta no tiene claim `cosechador` o `admin`                                  | Auth console → verificar claim; ver `feedback_rbac_claims_preflight`                                                  |
| Cosecha registrada pero Telegram no llega y no hay error | `fetch` falla silencioso en `lib/telegram.ts` (no rechaza por status 4xx/5xx) | Loggear `response.status` y opcionalmente mostrar toast no-bloqueante "alerta no enviada" — la cosecha SÍ se registró |
| Cosecha cuenta plantas por encima del stock del lote     | No se descuenta `currentQuantity` al cosechar                                 | El descuento debe ir en la misma transaction Firestore que el `arrayUnion(stageHistory)`                              |
| Doble-tap en "Registrar" crea dos entries duplicados     | Botón submit no se deshabilita durante la mutation                            | `<button disabled={mutation.isPending}>` y/o `useMutation` con `mutationKey` para deduplicar                          |
| Test pasa con mock pero registro real corta plantas mal  | Mock no replica la transacción Firestore                                      | Test de integración con emulador (`vitest.security.config.ts`) o e2e con Playwright MCP                               |
