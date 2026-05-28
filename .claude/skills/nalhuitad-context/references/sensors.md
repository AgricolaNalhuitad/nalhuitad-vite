# Sensores — Referencia

**Estado:** Bloqueado por hardware. Esta pantalla está fuera de scope hasta que el hardware esté disponible.

## Contexto

La pantalla `/mas/sensores` existe como `PlaceholderScreen` en el Sprint 1. El sprint de sensores se planificará cuando el hardware esté operativo.

## Hardware previsto

- Sensores de pH, EC (conductividad eléctrica), temperatura de solución
- Sensores de temperatura/humedad ambiental por invernadero
- Comunicación: pendiente de definir (WiFi/Bluetooth/LoRa)

## Invernaderos que recibirán sensores

- Inv A (DWC, 2.016 plantas) — prioridad 1
- Inv B (NFT, 1.740 plantas) — prioridad 2
- Inv C (aclimatación) — prioridad 3

## Decisiones pendientes

- Protocolo de comunicación (WiFi directo vs gateway)
- Frecuencia de muestreo
- Almacenamiento: Firestore subcollection vs Time Series DB
- Alertas: umbrales por etapa de lote

## Cuando se retome

1. Actualizar este archivo con specs del hardware real
2. Crear ADR en `docs/adr/` para decisiones de arquitectura
3. Diseñar pantalla Sensores con datos reales

---

## Activar agente `nalhuitad-sensores` (deferred plan)

Hoy NO existe `.claude/agents/nalhuitad-sensores.md` — crear un agente para trabajo bloqueado por hardware sería overhead. Cuando llegue el hardware, crear el agente siguiendo este blueprint:

### Frontmatter sugerido

```yaml
---
name: nalhuitad-sensores
description: Use PROACTIVELY when implementing or modifying ingest de telemetría (pH, EC, T° solución, T°/HR ambiente), pantalla /mas/sensores, alertas por umbral, o backend ingest (Cloud Functions o gateway). Pre-cargado con specs hardware + protocolo MQTT/WiFi seleccionado.
tools: Read, Write, Edit, Grep, Glob, Bash(pnpm typecheck *), Bash(pnpm test:run *), Bash(pnpm test *), Bash(pnpm lint *), Bash(git status *), Bash(git diff *), Bash(git log *)
model: inherit
skills:
  - nalhuitad-context
  - firebase-basics
  - nalhuitad-formulacion-chiloe # para interpretar umbrales en contexto Chiloé
permissionMode: default
color: cyan
---
```

### Skills nuevas que probablemente toque crear

- `nalhuitad-sensores-ingest` — patrón de ingest (gateway → Cloud Function → Firestore subcollection `lotes/{lotId}/telemetria/{ts}`)
- `nalhuitad-sensores-alertas` — umbrales por etapa (almácigo vs cosecha tienen rangos distintos) y canal Telegram

### Paths que debe vigilar

- `src/features/sensores/**` (nueva carpeta)
- `functions/sensores/**` (Cloud Functions ingest, si se usa esa ruta)
- `firestore.rules` — subcollection nueva necesita reglas (escalar a `nalhuitad-seguridad`)
- Cualquier nueva env var → `src/lib/firebase.ts` boot validation

### Decisiones a tomar antes de crear el agente

| Decisión            | Opciones                                                         | Implicación                                                                 |
| ------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Protocolo           | WiFi directo a Firestore vs MQTT broker vs LoRa→gateway          | Latencia, costo, resiliencia frente a corte de internet en Chonchi          |
| Almacenamiento      | Subcollection `telemetria/` vs colección top-level `mediciones/` | Cardinalidad — DWC con muestreo cada 5 min son ~290k docs/año por lote      |
| Frecuencia muestreo | 1/min, 1/5min, 1/15min                                           | EC y pH cambian lento; T° agua puede cambiar rápido en NFT día sin nubes    |
| Alertas             | App push, Telegram, ambas                                        | Grigor usa Telegram para cosecha — extender al mismo canal es lo más simple |
| Retención           | 1 año hot + cold storage                                         | Costo Firestore vs valor de datos históricos para análisis                  |

Cuando se haya decidido lo anterior, crear el agente y eliminar este bloque del stub.
