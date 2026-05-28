---
name: nalhuitad-formulacion-chiloe
description: Use when formulating nutrient solutions, choosing EC/pH targets, calibrating fertigation, or troubleshooting nutrient/salinity issues in the nalhuitad farm (Chonchi, Chiloé 42°S, DWC Inv A + NFT Inv B, lechuga Milena). Adapta las skills upstream resh-hydroponics y sonneveld-greenhouse-nutrition al contexto chileno.
---

# Formulación nutritiva — Nalhuitad (Chiloé)

Adaptaciones locales a las recomendaciones de los libros de referencia. **No reemplaza** a las skills upstream — las complementa con lo que esos autores no cubren para Chiloé.

## Referencias upstream (consultar primero)

| Tema | Skill |
|---|---|
| Frameworks generales de cultivo hidropónico, DWC, NFT, lechuga | `resh-hydroponics` |
| Solución nutritiva, EC/pH, salinidad, fertigación de invernadero | `sonneveld-greenhouse-nutrition` |

Cuando el modelo invoque cualquiera de las dos, esta skill agrega capa Chiloé.

## Por qué adaptar (Chiloé 42°S vs. literatura)

| Variable | Resh / Sonneveld (típico) | Chonchi, Chiloé | Implicación |
|---|---|---|---|
| Latitud | 25°–45° | 42°41′S | DLI bajo en invierno → no replicar EC altas de literatura europea/USA |
| Temperatura mínima invierno | 8–15 °C | 2–8 °C en piscina sin climatizar | EC más conservadora; raíz tolera menos en frío |
| Calidad del agua de origen | RO / pozo profundo bajo en HCO₃⁻ | Agua superficial Chiloé alta en hierro y materia orgánica | Filtración previa + ajuste pH siempre con ácido nítrico, no fosfórico (P ya alto) |
| Disponibilidad de fertilizantes | Stocks grado-invernadero | Stocks chilenos en formato agrícola (urea, MAP, KNO₃ corrientes) | Verificar pureza y micronutrientes — los formulados chilenos suelen no traer Mo/B suficientes |
| Unidades | mmol/L (Sonneveld) o ppm (Resh) | Proveedores chilenos hablan g/100 L | Convertir antes de pedir |

## Defaults para Milena en Nalhuitad

Estos son **puntos de partida**, no dogma. Calibrar con medición real.

### Solución madre — Milena DWC Inv A

| Etapa | EC target (mS/cm) | pH target | Notas |
|---|---|---|---|
| Almácigo (Inv D) | 0.8 – 1.0 | 5.8 – 6.2 | Bajo para no quemar raíz tierna |
| Transplante a Inv C (aclimatación) | 1.2 – 1.4 | 5.8 – 6.2 | Subir gradual |
| Raleo a Inv A (DWC) verano | 1.6 – 1.8 | 5.8 – 6.2 | Sonneveld §"Lettuce" base |
| Raleo a Inv A invierno (T° agua <12 °C) | 1.4 – 1.6 | 5.8 – 6.2 | Bajar EC en frío — raíz menos eficiente |
| Cosecha (últimos 5 días) | mantener | 5.8 – 6.2 | No cambiar formulación; evitar acumulación de nitratos en hoja |

### NFT Inv B

Mismo perfil que DWC pero el tubo se calienta más rápido al sol → **chequear T° solución cada 2 h en días sin nubes**. EC sube por evaporación más rápido que en piscina.

## Anti-patterns Chiloé-específicos

| Problema | Por qué pasa acá | Fix |
|---|---|---|
| EC sube sin meter sal | Evaporación de NFT en día despejado de verano | Re-medir al mediodía y compensar con agua, no con dilución de madre |
| pH sube a 7+ en pocas horas | Alta concentración de HCO₃⁻ en agua de fuente | Pre-acidificar el agua de reposición a 5.5 antes de mezclar madre |
| Clorosis intervenal aunque hay Fe en formula | Fe precipita a pH >6.5 + agua fría | Usar Fe-EDDHA (no Fe-EDTA) — más estable a pH alto y frío |
| Necrosis apical lechuga (tipburn) | T° rápida + EC alta + viento del sur reseca | Bajar EC, ventilar antes de las 11 am, evitar riegos al mediodía |
| Algas verdes en piscina DWC | Luz que llega al agua + alta T° + N alto | Tapar superficie expuesta, mantener tapa NFT bien sellada |
| Madre A se cristaliza guardada en bodega | Bodega <5 °C inviernos en Chonchi | Disolver con agua tibia (30 °C) antes de inyectar; no calentar madre formulada |
| Ratio Ca:Mg desbalanceado pese a respetar receta libro | Aguas Chiloé ya traen Mg alto | Pedir análisis de agua anual y restar lo que ya viene del agua |

## Conversiones útiles (Sonneveld mmol/L → g/100L producto chileno)

| Ion | Fuente típica CL | mmol/L objetivo | g/100 L |
|---|---|---|---|
| NO₃⁻ | KNO₃ (13-0-46) | 12 | 12 × 101 g/mol ÷ 10 = ~121 g (parte K incluida) |
| K⁺ | KNO₃ | 6 | ya cubierto por el cálculo anterior |
| Ca²⁺ | Ca(NO₃)₂·4H₂O (15.5%) | 4 | 4 × 164 ÷ 10 = ~65 g |
| Mg²⁺ | MgSO₄·7H₂O (sulfato Mg agrícola) | 1.5 | 1.5 × 246 ÷ 10 = ~37 g (restar Mg de agua) |
| H₂PO₄⁻ | MAP (12-61-0) | 1.5 | 1.5 × 115 ÷ 10 = ~17 g |

> **Importante:** Estos números son una receta tipo "Sonneveld base lettuce winter" ajustada. **Siempre** validar con análisis de agua de Chonchi (cambia entre estaciones — temporada de lluvias trae más materia orgánica).

## Procedimiento de cambio de formulación

1. Análisis de agua de origen (laboratorio Castro o Puerto Montt)
2. Consultar `sonneveld-greenhouse-nutrition` para perfil base de lechuga
3. Restar iones ya presentes en agua → solución madre A y B
4. Verificar que stock disponible cubre Mo/B (chequear etiqueta del micronutriente comprado)
5. Preparar lote de prueba en 100 L antes de aplicar a piscina completa de Inv A (2.016 plantas en juego)
6. Medir EC y pH cada 4 h durante las primeras 48 h
7. Documentar receta + análisis en `docs/development/formulacion/<fecha>.md`

## Cuando dudar y consultar

- Cambios bruscos de clima (frente frío) → considerar bajar EC 0.2 mS/cm temporal
- Cambio de proveedor de fertilizante → re-validar formulación (purezas distintas)
- Nuevo análisis de agua → re-calcular madre
- Lechuga distinta a Milena → consultar `resh-hydroponics` capítulo "Lettuce"
