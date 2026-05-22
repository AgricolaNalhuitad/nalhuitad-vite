# Formulación de Nutrientes — Referencia

**Estado:** Módulo futuro. No implementado aún.

## Contexto del dominio

La operación usa solución nutritiva en ciclo cerrado (NFT e DWC). Grigor ajusta la formulación manualmente hoy. El módulo futuro permitirá registrar y auditar cambios de EC/pH por invernadero.

## Parámetros clave (hidropónico lechuga Milena)

| Parámetro | Rango objetivo | Unidad |
|-----------|---------------|--------|
| EC        | 1.2 – 2.0     | mS/cm  |
| pH        | 5.5 – 6.5     | —      |
| Temp. solución | 18 – 22  | °C     |

## Etapas y ajustes

| Etapa       | EC objetivo | Notas                        |
|-------------|-------------|------------------------------|
| Almácigo    | 0.8 – 1.2   | Solución más diluida         |
| Transplante | 1.2 – 1.6   | Incremento gradual           |
| Raleo       | 1.4 – 1.8   | Crecimiento activo           |
| Cosecha     | 1.6 – 2.0   | Máxima concentración         |

## Inventario de sales (referencia)

Pendiente de documentar con Grigor. Agregar aquí cuando se implemente el módulo.

## Notas de implementación

- Registros por lote + invernadero
- Historial auditable (no sobreescribir, append-only)
- Integración con pantalla Sensores (cuando esté disponible)
- Alertas si EC/pH salen de rango
