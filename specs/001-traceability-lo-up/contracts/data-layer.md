# Contract: Data Layer (api + hooks)

Patrón obligatorio: cada `subscribe*` usa `onSnapshot` y alimenta el cache de React Query vía `setQueryData` (igual que `useLotes.ts`/`useLot.ts`). Mutaciones vía `useMutation` + `invalidateQueries`. Sin `arrayUnion`.

## `lotesOrigenApi.ts`

```ts
subscribeLotesOrigen(onData: (los: LoteOrigen[]) => void, onError): Unsubscribe
subscribeLoteOrigen(id, onData: (lo: LoteOrigen | null) => void, onError): Unsubscribe
createSiembra(input: NuevaSiembraInput): Promise<{ loteOrigenId: string; upId: string }>
// crea LO + UP inicial en Inv D-Almácigo (FR-002) en un writeBatch; genera nombreAmigable con sufijo
```

`NuevaSiembraInput`: `{ variety: string; fechaSiembra: string; bandejas: number; notas?: string }`

## `unidadesApi.ts`

```ts
subscribeUnidades(onData: (ups: UnidadProduccion[]) => void, onError): Unsubscribe
subscribeUnidad(upId, onData, onError): Unsubscribe
subscribeUnidadesPorLote(loteOrigenId, onData, onError): Unsubscribe  // FR (todas las UP de un lote)
subscribeUnidadActivaPorUbicacion(ubicacionId, onData, onError): Unsubscribe  // consulta "¿qué hay aquí?"
trasladarUnidad(upId, input: TrasladoInput): Promise<void>
// valida ubicación destino libre (INV-3); escribe UP.ubicacionId + evento 'traslado'; offline-friendly
registrarCosecha(upId, input: CosechaInput): Promise<void>
// valida INV-4; parcial→activa / total→cosechada; evento 'cosecha'; si última UP del lote → LO 'cosechado' (FR-019)
```

`TrasladoInput`: `{ ubicacionDestinoId: string; fecha: string; cantidad?: number; notas? }`
`CosechaInput`: `{ paquetes: number; descarte: number; fecha: string; notas? }` (UI en paquetes, persiste lechugas: `paquetes×2`)

## `raleoApi.ts`

```ts
ralear(upOrigenId, input: RaleoInput): Promise<{ hijasIds: string[] }>
// PRE: useFirestoreConnectivity online (FR-014); valida INV-1 (suma exacta)
// writeBatch atómico: crea N UP hijas (1≤N≤5) + origen→'trasladada' + libera ubicación origen
//   + N eventos 'raleo'. Todo o nada (INV-2/FR-012).
```

`RaleoInput`: `{ destinos: Array<{ ubicacionId: string; cantidad: number }>; fecha: string; notas? }`
Validaciones: `1 ≤ destinos.length ≤ 5`; `Σ cantidad == currentQuantity(origen)`; cada `ubicacionId` libre; advertencia sin bloqueo si `cantidad > capacidadMax` (FR-013).

## `ubicacionesApi.ts`

```ts
subscribeUbicaciones(onData: (ubis: Ubicacion[]) => void, onError): Unsubscribe  // catálogo seed (solo lectura en runtime)
```

## `eventosApi.ts`

```ts
subscribeEventosPorUp(upId, onData: (evs: EventoHistorial[]) => void, onError): Unsubscribe
```

## Hooks

`useLotesOrigen()`, `useLoteOrigen(id)`, `useUnidades()`, `useUnidad(id)`, `useUnidadesPorLote(loteId)`, `useUbicaciones()`, `useEventosPorUp(upId)` — todos mismo shape de retorno que `useLotes` (`{ data, isLoading, isError, error, retry }`).

`useTrazabilidadMutations.ts`: `useCrearSiembra()`, `useTrasladar(upId)`, `useRalear(upOrigenId)`, `useCosechar(upId)`.

`useFirestoreConnectivity(): { isOnline: boolean }` — deriva de `metadata.fromCache` de una suscripción liviana + `navigator.onLine`.

## Helpers puros (testables aislados)

```ts
calcularCurrentQuantity(cantidadInicial: number, eventos: EventoHistorial[]): number   // FR-031
generarNombreAmigable(variety, fechaSiembra, existentesMismoDia: string[]): string     // FR-003
paquetesALechugas(paquetes: number): number   // ×2
validarSumaRaleo(currentQuantity, destinos): { ok: boolean; diferencia: number }       // INV-1
```
