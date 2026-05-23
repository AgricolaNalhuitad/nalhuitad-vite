---
name: nuevo-lote
description: Use when implementing or modifying lot creation in nalhuitad — CreateLotScreen, createLot API, NewLotInput, variety defaults, tray-to-plant conversion, or Firestore document structure for new lots.
---

# Nuevo Lote

Workflow completo para crear un lote nuevo en nalhuitad. Cubre el formulario, las invariantes del dominio y la estructura del documento Firestore.

## Cuándo usar

- Implementar o modificar `CreateLotScreen.tsx`
- Cambiar `createLot` en `lotApi.ts` o `NewLotInput` en `types.ts`
- Agregar campos al formulario de creación
- Entender cómo se calcula `currentQuantity` al crear un lote

## Workflow (7 pasos)

```
1. Nombre del lote         → texto libre, requerido
2. Variedad                → default "Milena"
3. Cantidad de bandejas    → número ≥ 1 (se convierte a plantas: × 135)
4. Fecha de siembra        → ISO YYYY-MM-DD, default hoy
5. Ubicación               → invernadero + tipo + identificador
6. Crear en Firestore      → stage fijo "almacigo"
7. Confirmar creación      → navegar a /lotes
```

---

## Invariantes del dominio (NO ignorar)

| Invariante | Valor | Archivo |
|---|---|---|
| Stage inicial | siempre `'almacigo'` | `lotApi.ts` `createLot` |
| Plantas por bandeja | `135` | `lotApi.ts`: `currentQuantity = quantity * 135` |
| Variedad default | `'Milena'` | `CreateLotScreen` estado inicial |
| Fecha default | hoy (`new Date().toISOString().slice(0, 10)`) | `CreateLotScreen` estado inicial |
| Invernaderos válidos | `'A'` o `'B'` | tipo `'A' \| 'B'` en el select |

> **Nunca** dejar `variety` vacío como default — usar `'Milena'`.  
> **Nunca** cambiar la fórmula `quantity * 135` sin actualizar los tests de `lotApi.test.ts`.

---

## Estructura del documento Firestore

Colección: `lotes` — `addDoc(collection(db, 'lotes'), { ... })`

```ts
{
  name:            string,           // nombre del lote
  variety:         string,           // "Milena" u otra
  date:            string,           // ISO YYYY-MM-DD (fecha siembra)
  quantity:        number,           // bandejas
  currentQuantity: number,           // bandejas × 135 (plantas actuales)
  stage:           'almacigo',       // SIEMPRE fijo al crear
  location:        Location,         // { invernadero, tipo, identificador }
  stageHistory:    [{ stage: 'almacigo', date }],  // array con entrada inicial
  raleos:          [],               // vacío al crear
  childrenIds:     [],               // vacío al crear
}
```

---

## Campos de ubicación (`Location`)

```ts
interface Location {
  invernadero: string;   // 'A' | 'B'
  tipo: string;          // 'piscina' | 'tubo' | 'canal'
  identificador: string; // e.g. 'P01', 'T03'
}
```

Opciones del select `tipo`: `piscina`, `tubo`, `canal`.  
Invernaderos disponibles para almácigo inicial: **A** (DWC raíz flotante) y **B** (NFT tubos). Inv C y D son aclimatación/germinación — no aparecen en este formulario.

---

## Patrón de implementación del formulario

```tsx
// Estado inicial canónico para CreateLotScreen
const [variety, setVariety] = useState('Milena');           // default dominio
const [date, setDate] = useState(today);                    // default hoy
const [invernadero, setInvernadero] = useState<'A' | 'B'>('A');
const [tipo, setTipo] = useState('piscina');
```

Submit llama `mutateAsync` y navega a `/lotes` en `onSuccess` (el hook ya invalida las queries):

```ts
await mutateAsync({ name, variety, date, quantity: Number(quantity), location });
navigate('/lotes');
```

---

## Paso 6 — Firestore (`createLot`)

```ts
// lotApi.ts
export async function createLot(input: NewLotInput): Promise<string> {
  const ref = await addDoc(collection(db, 'lotes'), {
    name:            input.name,
    variety:         input.variety,
    date:            input.date,
    quantity:        input.quantity,
    currentQuantity: input.quantity * 135,   // invariante: 135 plantas/bandeja
    stage:           'almacigo',              // invariante: siempre almacigo
    location:        input.location,
    stageHistory:    [{ stage: 'almacigo', date: input.date }],
    raleos:          [],
    childrenIds:     [],
  });
  return ref.id;
}
```

---

## Paso 7 — Confirmación

No hay pantalla de confirmación separada. La confirmación es implícita: éxito en `mutateAsync` → navegar a `/lotes`. El usuario ve el nuevo lote en el listado.

Si se necesita confirmación explícita (modal/toast), agregar en `onSuccess` del hook en `useLotMutations.ts` — no en el formulario.

---

## Orden de implementación (TDD)

1. **types.ts** — verificar/actualizar `NewLotInput` si se agregan campos
2. **lotApi.test.ts** — test rojo para cualquier cambio en `createLot`
3. **lotApi.ts** — implementar cambio
4. **useLotMutations.test.ts** — si cambia el hook
5. **CreateLotScreen.tsx** — actualizar formulario
6. **CreateLotScreen.test.tsx** — test de submit completo

Siempre al cierre: `pnpm typecheck && pnpm lint && pnpm test:run`

---

## Errores comunes

| Problema | Causa | Fix |
|---|---|---|
| `variety` llega vacío a Firestore | `useState('')` en vez de `useState('Milena')` | Cambiar el estado inicial |
| `currentQuantity` incorrecto | Cambiar `quantity` sin actualizar la fórmula `× 135` | Buscar todos los usos en `lotApi.ts` y tests |
| Lote creado con stage incorrecto | Pasar `stage` como input variable | `stage` está hardcodeado en `createLot` — no es input |
| Select invernadero acepta 'C' o 'D' | Tipo demasiado permisivo | Usar `'A' \| 'B'` explícito |
| `identificador` vacío pasa validación | Sin `required` en el input | Agregar `required` al campo identificador |
