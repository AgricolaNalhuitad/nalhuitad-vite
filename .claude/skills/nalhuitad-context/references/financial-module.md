# Módulo Financiero — Referencia

**Estado:** Futuro. No planificado en Fase A ni Fase B.

## Contexto

Grigor (abogado) lleva las finanzas de la operación manualmente hoy. El módulo financiero es un candidato para una fase posterior una vez que el core agronómico esté estable.

## Flujos identificados (preliminar)

**Ingresos:**
- Venta lechugas: 210 unidades/viaje × precio/lechuga
- Frecuencia de cosecha: variable según etapa de lotes activos
- Cliente(s): pendiente de documentar

**Egresos:**
- Sales/nutrientes
- Electricidad (bombas, iluminación)
- Mano de obra
- Mantenimiento de invernaderos

## KPIs de interés

- Costo por lechuga producida
- Margen por ciclo de lote
- Rotación de capital (días almácigo → cosecha)
- Rendimiento por invernadero (A vs B)

## Decisiones de diseño pendientes

- ¿Standalone dentro de la app o integración con herramienta contable externa?
- Moneda: CLP (pesos chilenos)
- Período fiscal: enero–diciembre

## Cuando se planifique

1. Crear spec en `docs/specs/` con brainstorming previo (`superpowers:brainstorming`)
2. Documentar flujos reales con Grigor
3. Agregar ADR para decisiones de arquitectura en `docs/adr/`
