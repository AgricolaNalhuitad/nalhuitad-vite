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
