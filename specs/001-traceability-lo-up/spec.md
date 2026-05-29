# Feature Specification: Sistema de Trazabilidad LO+UP

**Feature Branch**: `001-traceability-lo-up`

**Created**: 2026-05-23

**Status**: Draft

**Input**: User description: "Sprint 4 — Sistema de Trazabilidad LO+UP. Dos niveles: Lote Origen (genealogía) + Unidad de Producción (presencia física). Permitir que un lote origen se divida en múltiples ubicaciones físicas simultáneas manteniendo trazabilidad completa desde semilla hasta cosecha. QR por unidad y por ubicación física. Convivencia 30 días con lotes legacy."

## User Scenarios & Testing

### User Story 1 - Sembrar y crear nuevo lote origen (Priority: P1)

El trabajador siembra una nueva tanda de almácigos en Castro (Inv D) y crea el registro del lote en la app. El sistema genera automáticamente el lote origen genealógico y la primera unidad de producción ubicada en el almácigo de Inv D, e imprime un código QR físico para pegar en las bandejas.

**Why this priority**: Es el punto de entrada de toda la trazabilidad. Sin la creación correcta del lote origen, ninguna operación posterior puede asociarse a una siembra. Es la base del sistema.

**Independent Test**: Crear una siembra de 6 bandejas de Milena con fecha hoy. Verificar que (a) aparece un lote nuevo en el listado con nombre amigable "Milena 23-May", (b) existe una unidad de producción asociada en Inv D, (c) se puede generar e imprimir el QR.

**Acceptance Scenarios**:

1. **Given** el trabajador en la pantalla de inicio, **When** presiona "Nueva siembra" e ingresa variedad Milena, 6 bandejas, fecha 23-May-2026, **Then** el sistema crea el lote origen y una unidad de producción ubicada en Inv D - Almácigo, ambos con estado "activo".
2. **Given** un lote origen recién creado, **When** el trabajador presiona "Imprimir QR", **Then** el sistema muestra una vista imprimible con un código QR escaneable que identifica unívocamente esa unidad de producción.
3. **Given** que ya existe otra siembra el mismo día, **When** se crea una segunda siembra de Milena en la misma fecha, **Then** el sistema asigna nombres amigables distintivos sin conflicto (ej. "Milena 23-May #01", "Milena 23-May #02").

---

### User Story 2 - Trasladar plantas entre invernaderos (Priority: P2)

El trabajador escanea el código QR pegado en una bandeja de almácigos y registra el traslado de esa unidad a una ubicación específica en otro invernadero (típicamente Inv D → Inv C cuando los almácigos están maduros).

**Why this priority**: Es la operación más frecuente del flujo productivo y conecta la genealogía con la realidad física en cada invernadero. Sin traslado registrado, la app no sabe dónde están las plantas.

**Independent Test**: Escanear QR de una unidad en Inv D. Seleccionar destino INV-C-P02. Verificar que la unidad cambia su ubicación en la app, la ubicación origen queda libre y la destino ocupada, y se preserva el historial.

**Acceptance Scenarios**:

1. **Given** una unidad de producción activa en Inv D - Almácigo, **When** el trabajador escanea su QR y selecciona "Trasladar a Inv C - P02", **Then** la unidad actualiza su ubicación, la ubicación previa queda marcada como libre, la nueva como ocupada, y la unidad mantiene su referencia al lote origen.
2. **Given** una unidad trasladada, **When** se consulta su pantalla de detalle, **Then** se ve el historial completo: fecha de siembra, fecha de ingreso al Inv D, fecha de traslado a Inv C, ubicación actual.
3. **Given** una ubicación destino que ya está ocupada por otra unidad activa, **When** se intenta trasladar una nueva unidad ahí, **Then** el sistema bloquea la operación con un mensaje claro y la opción de cambiar de ubicación.

---

### User Story 3 - Ralear dividiendo en múltiples ubicaciones (Priority: P3)

Cuando una piscina o bancada queda libre por cosecha, el trabajador toma plantas de Inv C y las distribuye en múltiples ubicaciones físicas distintas en una sola operación de raleo. Una sola unidad origen puede generar 1 a 5 unidades hijas, cada una en una ubicación diferente.

**Why this priority**: Es el caso de uso que rompe el modelo legacy de un solo `location` por lote. Sin esta operación, el sistema nuevo no aporta valor sobre el anterior. Es el corazón de la trazabilidad LO+UP.

**Independent Test**: Tomar una unidad con 540 plantas en Inv C - P02. Ralear en 3 destinos: 200 a INV-A-P05, 240 a INV-B-B02, 100 a INV-A-P07. Verificar que (a) se crean 3 unidades nuevas con el mismo lote origen, (b) la unidad origen queda con estado "trasladada", (c) cada unidad nueva tiene su QR imprimible, (d) las cantidades suman exactamente 540.

**Acceptance Scenarios**:

1. **Given** una unidad activa con 540 plantas en Inv C, **When** el trabajador presiona "Ralear" e ingresa 3 destinos (200 a INV-A-P05, 240 a INV-B-B02, 100 a INV-A-P07), **Then** el sistema crea 3 unidades nuevas hijas con el mismo lote origen, marca la unidad origen como "trasladada", y libera la ubicación de origen.
2. **Given** un raleo en curso, **When** la suma de cantidades de los destinos no coincide con la cantidad disponible en la unidad origen, **Then** el sistema bloquea la confirmación y muestra la diferencia.
3. **Given** un raleo confirmado exitosamente, **When** se consulta cualquiera de las unidades hijas, **Then** se ve la genealogía completa: lote origen, unidad padre, fecha de raleo, hermanas en otras ubicaciones.
4. **Given** una ubicación destino con capacidad máxima de 252 plantas, **When** se intenta asignarle 300, **Then** el sistema muestra una advertencia con la opción de continuar dejando una nota (no es un bloqueo).
5. **Given** que el trabajador no tiene conexión, **When** intenta confirmar un raleo, **Then** el sistema indica que la operación requiere conexión y deja la captura guardada como borrador local.

---

### User Story 4 - Registrar cosecha con paquetes (Priority: P4)

El trabajador escanea el QR de una unidad madura en Inv A o Inv B, ingresa la cantidad cosechada en paquetes (cada paquete = 2 lechugas) más el descarte, y el sistema cierra esa unidad. Internamente el sistema trabaja en lechugas individuales pero la UI siempre muestra paquetes en la operación de cosecha.

**Why this priority**: Cierra el ciclo productivo y libera ubicaciones para nuevos raleos. La distinción paquete/lechuga individual es crítica para evitar errores operacionales que se han dado en el pasado.

**Independent Test**: Escanear QR de unidad con 210 plantas en INV-A-P05. Ingresar "105 paquetes cosechados, 0 descarte". Verificar que (a) la unidad queda con estado "cosechada", (b) la ubicación queda libre, (c) el sistema interpreta internamente 210 lechugas, (d) si todas las unidades del lote origen están cosechadas, el lote origen pasa a estado "cosechado".

**Acceptance Scenarios**:

1. **Given** una unidad madura con 210 plantas en INV-A-P05, **When** el trabajador ingresa cosecha de 100 paquetes y descarte de 10 lechugas individuales, **Then** la unidad queda en estado "cosechada", la ubicación libre, y el registro guarda 200 lechugas cosechadas + 10 descartadas (210 totales).
2. **Given** una operación de cosecha en curso, **When** la suma de cosecha (×2) más descarte excede la cantidad actual de la unidad, **Then** el sistema bloquea la confirmación.
3. **Given** todas las unidades de producción de un lote origen ya cosechadas, **When** se confirma la última cosecha, **Then** el lote origen cambia automáticamente a estado "cosechado" y desaparece del listado de lotes activos.
4. **Given** un viaje completo de cosecha, **When** se suman los paquetes de varias cosechas del día, **Then** el sistema muestra el total y advierte si supera 210 paquetes (la capacidad por viaje).

---

### User Story 5 - Consultar ubicación física por QR (Priority: P5)

El trabajador escanea el QR pegado en una piscina, bancada o tubo físico y la app responde mostrando qué hay ahí: variedad, fecha de siembra, días en producción, cantidad de plantas, y genealogía completa hasta la semilla.

**Why this priority**: Resuelve el caso "estoy parado frente a P05, ¿qué tenemos aquí?". Es la consulta más natural en terreno y multiplica el valor del sistema cuando se opera con varias decenas de ubicaciones físicas activas.

**Independent Test**: Escanear el QR físico de INV-A-P05. Verificar que la pantalla muestra el nombre del lote, fecha de siembra, días desde siembra, cantidad actual, e historial (Inv D → Inv C → Inv A) si esta es la unidad activa.

**Acceptance Scenarios**:

1. **Given** una ubicación ocupada por una unidad activa, **When** el trabajador escanea el QR físico de esa ubicación, **Then** se muestra el lote origen asociado, la cantidad de plantas, los días desde siembra y la genealogía completa.
2. **Given** una ubicación libre, **When** se escanea su QR, **Then** se muestra "Ubicación libre" con un botón para asignar manualmente una unidad nueva.
3. **Given** un lote origen consultado, **When** se solicita ver "Todas las unidades de este lote", **Then** se muestran todas las unidades hijas activas y su ubicación actual.

---

### User Story 6 - Convivencia con lotes legacy (Priority: P6)

Los lotes creados con el modelo anterior siguen disponibles en modo solo lectura durante 30 días después del switchover, sin posibilidad de modificación. Toda escritura nueva usa el modelo LO+UP.

**Why this priority**: Permite consulta histórica sin obligar a una migración completa el día 1. Reduce el riesgo de pérdida de información histórica.

**Independent Test**: Después de migración inicial, abrir un lote legacy desde la sección "Histórico". Verificar que se muestra la información en modo lectura y que los botones de modificación (avanzar etapa, ralear, cosechar) están deshabilitados.

**Acceptance Scenarios**:

1. **Given** un lote creado con el modelo anterior, **When** el trabajador lo abre desde el listado de lotes legacy, **Then** ve todos los datos históricos pero no puede modificarlos.
2. **Given** un lote legacy y un lote nuevo del modelo LO+UP con la misma variedad, **When** se consulta el listado general de lotes activos, **Then** ambos aparecen marcados claramente con su tipo de modelo.
3. **Given** que han pasado 30 días desde el switchover, **When** el administrador ejecuta la operación de cierre, **Then** los lotes legacy quedan archivados fuera del listado principal pero accesibles en el archivo histórico.

---

### Edge Cases

- **Pérdida de plantas entre etapas**: Si en un traslado el trabajador reporta menos plantas que las que tenía la unidad origen, el sistema debe registrar la pérdida como descarte en el historial sin alterar la cantidad inicial original.
- **Raleo con conexión intermitente**: Si la conexión se pierde durante el formulario de raleo, el borrador se mantiene en el dispositivo hasta que haya conexión y el usuario reintente la confirmación.
- **QR dañado o ilegible**: Existe un buscador alternativo por nombre amigable del lote o número visible en la etiqueta, para los casos en que el QR no escanea.
- **Cosecha parcial de una unidad**: Cuando solo se cosecha parte de una ubicación (ej. 100 paquetes de una unidad con 210 plantas), la unidad queda con cantidad reducida pero estado sigue "activo". Solo cuando se cosecha el remanente la unidad pasa a "cosechada".
- **Ubicación ocupada al asignar destino de raleo**: Si una ubicación destino tiene una unidad activa, el sistema bloquea y propone elegir otra. Si la unidad ocupante está marcada como pendiente de cosecha, se sugiere completar la cosecha primero.
- **Variedad distinta en raleo**: El raleo solo redistribuye plantas del mismo lote origen, no permite mezclar plantas de variedades distintas en la misma operación.

## Requirements

### Functional Requirements

**Creación de lotes y unidades**

- **FR-001**: El sistema MUST permitir crear un lote origen capturando variedad (default Milena), cantidad de bandejas, fecha de siembra y notas opcionales.
- **FR-002**: Al crear un lote origen, el sistema MUST generar automáticamente una unidad de producción inicial asociada, ubicada por defecto en Inv D - Almácigo.
- **FR-003**: El sistema MUST asignar al lote origen un identificador interno único y un nombre amigable derivado de variedad + fecha (ej. "Milena 23-May"), con sufijo numérico si hay colisión en el mismo día.
- **FR-004**: La cantidad inicial de plantas de la unidad MUST calcularse automáticamente como bandejas × 135 (135 lechugas por bandeja, valor canónico del dominio).

**Traslados**

- **FR-005**: El sistema MUST permitir trasladar una unidad de producción de una ubicación a otra, registrando fecha y ubicación previa en el historial.
- **FR-006**: Al trasladar una unidad, el sistema MUST liberar la ubicación previa marcándola como disponible y ocupar la nueva.
- **FR-007**: El sistema MUST bloquear el traslado a una ubicación ya ocupada por otra unidad activa.

**Raleos (división en múltiples destinos)**

- **FR-008**: El sistema MUST permitir dividir una unidad origen en N unidades hijas (1 ≤ N ≤ 5), cada una con su propia cantidad de plantas y ubicación física distinta.
- **FR-009**: La suma de cantidades de las unidades hijas en un raleo MUST igualar la cantidad disponible en la unidad origen.
- **FR-010**: Después de un raleo exitoso, la unidad origen MUST conservarse en el sistema con estado "trasladada" (no se elimina) para preservar la genealogía.
- **FR-011**: Cada unidad hija de un raleo MUST conservar la referencia al lote origen genealógico y a la unidad padre directa.
- **FR-012**: El sistema MUST ejecutar el raleo como una operación atómica: o se crean todas las unidades hijas y se marca la origen, o nada se persiste.
- **FR-013**: El sistema MUST advertir, sin bloquear, cuando una unidad hija excede la capacidad máxima recomendada de la ubicación destino, permitiendo continuar con una nota.
- **FR-014**: El raleo MUST requerir conexión activa al servicio de persistencia (no se permite offline).

**Cosechas**

- **FR-015**: El sistema MUST permitir registrar cosecha de una unidad ingresando cantidad cosechada en paquetes (1 paquete = 2 lechugas) más descarte en lechugas individuales.
- **FR-016**: La UI de cosecha MUST mostrar siempre paquetes pero persistir internamente lechugas individuales.
- **FR-017**: La suma de (paquetes × 2) más descarte MUST no exceder la cantidad actual de la unidad.
- **FR-018**: Una cosecha parcial deja la unidad activa con cantidad reducida; una cosecha completa marca la unidad como "cosechada" y libera la ubicación.
- **FR-019**: Cuando todas las unidades de un lote origen están cosechadas, el lote origen MUST pasar automáticamente a estado "cosechado" y salir del listado de lotes activos.

**Consultas por QR**

- **FR-020**: El sistema MUST generar códigos QR imprimibles para cada unidad de producción y cada ubicación física del catálogo.
- **FR-021**: Escanear un QR de unidad MUST abrir la pantalla de detalle de esa unidad, incluyendo genealogía completa hasta el lote origen.
- **FR-022**: Escanear un QR de ubicación física MUST mostrar la unidad activa que la ocupa (o indicar "libre" si no hay), incluyendo enlace al lote origen.
- **FR-023**: Para casos de QR ilegible, el sistema MUST ofrecer un buscador alternativo por nombre amigable del lote.

**Catálogo de ubicaciones**

- **FR-024**: El sistema MUST mantener un catálogo de 19 ubicaciones físicas pre-sembrado: INV-D-ALM (1), INV-C-P01 a INV-C-P04 (4), INV-A-P01 a INV-A-P08 (8), INV-B-B01 a INV-B-B06 (6).
- **FR-025**: Cada ubicación MUST tener una capacidad máxima recomendada usada solo como advertencia (no bloqueo).
- **FR-026**: Una ubicación MUST tener a lo sumo una unidad de producción activa simultáneamente.

**Convivencia con modelo legacy**

- **FR-027**: Los lotes del modelo anterior MUST migrarse a una colección de solo lectura llamada `lotes_legacy` durante el switchover.
- **FR-028**: La app MUST exponer una sección "Histórico" para consultar lotes legacy sin posibilidad de modificación.
- **FR-029**: Durante 30 días después del switchover, ambos conjuntos (legacy y nuevo) MUST aparecer en el listado general con un marcador visual de su tipo de modelo.
- **FR-030**: Después de 30 días, el administrador MUST poder archivar los lotes legacy fuera del listado principal preservando su accesibilidad en el histórico.

**Mortalidad y descartes**

- **FR-031**: La cantidad actual de plantas de una unidad MUST calcularse como cantidad inicial menos la suma de descartes registrados en el historial (no se persiste un campo derivado).
- **FR-032**: Cualquier pérdida de plantas entre operaciones MUST registrarse como entrada de descarte en el historial con fecha, cantidad y motivo opcional.

### Key Entities

- **Lote Origen**: Representa la identidad genealógica de un grupo de plantas desde la siembra. Tiene variedad, fecha de siembra, cantidad inicial de bandejas, nombre amigable, estado general (activo/cosechado/descartado) y notas. Una siembra es un lote origen. Persiste hasta que todas sus unidades de producción están cosechadas.
- **Unidad de Producción (UP)**: Representa la presencia física de plantas en una ubicación concreta en un momento dado. Tiene referencia al lote origen, ubicación, cantidad de plantas, etapa productiva (almácigo, transplante, raleo, cosecha), estado (activa, cosechada, descartada, trasladada), referencia opcional a unidad padre (si nació de un raleo), fecha de ingreso a la ubicación y un historial de eventos.
- **Ubicación**: Representa un espacio físico productivo en algún invernadero. Tiene tipo (almácigo, piscina, bancada, piscina intermedia), invernadero (A/B/C/D), identificador (P01, B02, etc.), capacidad máxima recomendada y estado (libre/ocupada).
- **Evento de Historial**: Cada acción que afecta a una unidad de producción genera una entrada con fecha, tipo de acción (creación, traslado, raleo, cosecha, descarte), cantidades involucradas y ubicaciones previa/nueva si aplica.
- **Lote Legacy**: Snapshot inmutable de un lote del modelo anterior, con su información histórica completa preservada para consulta.

## Success Criteria

### Measurable Outcomes

- **SC-001**: El trabajador completa la creación de una siembra (Story 1) en menos de 60 segundos desde abrir la app hasta confirmar.
- **SC-002**: El trabajador completa un raleo en 3 ubicaciones (Story 3) en menos de 3 minutos desde escanear el QR origen hasta imprimir los 3 QR nuevos.
- **SC-003**: El 100% de las unidades de producción activas tienen referencia válida y resoluble a su lote origen genealógico.
- **SC-004**: El sistema responde a la consulta "¿qué hay en esta ubicación?" en menos de 2 segundos desde el escaneo del QR físico.
- **SC-005**: Cero pérdidas de datos en el switchover: el conteo de lotes legacy migrados es exactamente igual al conteo de lotes en el modelo anterior previo al switchover.
- **SC-006**: Después de un mes de uso productivo, el trabajador puede responder sin ayuda técnica "¿de qué siembra viene esto?" para cualquier ubicación física activa en menos de 30 segundos.
- **SC-007**: El sistema soporta sin degradación perceptible la operación con hasta 50 unidades de producción activas simultáneas (escala 3× el volumen actual de ~3.740 plantas en 2 invernaderos).
- **SC-008**: Tasa de error operacional (raleos con cantidades que no cuadran, traslados a ubicaciones ocupadas, cosechas con cantidades inválidas) menor a 1 por cada 100 operaciones registradas.

## Assumptions

- El trabajador opera con un dispositivo móvil con cámara funcional para escaneo de QR.
- La conexión a internet en el invernadero es intermitente pero no inexistente: las operaciones simples (cosecha, traslado) funcionan con escritura optimista offline; las operaciones complejas (raleo multi-destino) requieren conexión activa.
- El catálogo de 19 ubicaciones físicas es estable durante el horizonte del Sprint 4. Cambios en infraestructura requieren una operación administrativa explícita.
- La variedad principal es Milena con presencia muy mayoritaria. Otras variedades pueden ingresarse manualmente pero no se gestionan listas predefinidas.
- El factor 135 lechugas por bandeja es canónico y constante en el dominio; un cambio futuro requeriría una migración explícita.
- Un paquete equivale exactamente a 2 lechugas en la operación de cosecha; este factor no se parametriza por lote.
- La capacidad máxima por ubicación es una estimación de buena práctica agronómica, no un límite físico inviolable.
- El switchover al nuevo modelo se ejecuta en una operación única offline (script de migración fuera de horario operativo) y no en producción en vivo.
- Los QR físicos pegados en las ubicaciones se imprimen una sola vez al inicio y solo se reimprimen ante daño. Los QR de unidad se imprimen al crear cada unidad nueva y se descartan al cosecharla.
- El sistema asume un único trabajador operando a la vez en cada invernadero; conflictos de escritura concurrente sobre la misma unidad o ubicación son improbables pero deben resolverse last-write-wins con feedback al usuario.

## Seed Data — Catálogo de Ubicaciones

El sistema MUST pre-sembrar el siguiente catálogo de 19 ubicaciones al inicio del Sprint 4:

| ID | Invernadero | Tipo | Identificador | Capacidad máxima | Función |
|----|-------------|------|---------------|------------------|---------|
| INV-D-ALM | D (Castro) | almácigo | ALM | 6 bandejas (810 lechugas) | Germinación de almácigos |
| INV-C-P01 | C (Nalhuitad) | piscina intermedia | P01 | 540 | Aclimatación y trasplante |
| INV-C-P02 | C (Nalhuitad) | piscina intermedia | P02 | 540 | Aclimatación y trasplante |
| INV-C-P03 | C (Nalhuitad) | piscina intermedia | P03 | 540 | Aclimatación y trasplante |
| INV-C-P04 | C (Nalhuitad) | piscina intermedia | P04 | 540 | Aclimatación y trasplante |
| INV-A-P01 | A (Nalhuitad) | piscina DWC | P01 | 252 | Producción raíz flotante |
| INV-A-P02 | A (Nalhuitad) | piscina DWC | P02 | 252 | Producción raíz flotante |
| INV-A-P03 | A (Nalhuitad) | piscina DWC | P03 | 252 | Producción raíz flotante |
| INV-A-P04 | A (Nalhuitad) | piscina DWC | P04 | 252 | Producción raíz flotante |
| INV-A-P05 | A (Nalhuitad) | piscina DWC | P05 | 252 | Producción raíz flotante |
| INV-A-P06 | A (Nalhuitad) | piscina DWC | P06 | 252 | Producción raíz flotante |
| INV-A-P07 | A (Nalhuitad) | piscina DWC | P07 | 252 | Producción raíz flotante |
| INV-A-P08 | A (Nalhuitad) | piscina DWC | P08 | 252 | Producción raíz flotante |
| INV-B-B01 | B (Nalhuitad) | bancada NFT | B01 | 290 | Producción NFT tubos |
| INV-B-B02 | B (Nalhuitad) | bancada NFT | B02 | 290 | Producción NFT tubos |
| INV-B-B03 | B (Nalhuitad) | bancada NFT | B03 | 290 | Producción NFT tubos |
| INV-B-B04 | B (Nalhuitad) | bancada NFT | B04 | 290 | Producción NFT tubos |
| INV-B-B05 | B (Nalhuitad) | bancada NFT | B05 | 290 | Producción NFT tubos |
| INV-B-B06 | B (Nalhuitad) | bancada NFT | B06 | 290 | Producción NFT tubos |

**Capacidades totales por invernadero**: Inv D = 810 plantas (almácigo), Inv C = 2.160 plantas (transitorio), Inv A = 2.016 plantas (DWC), Inv B = 1.740 plantas (NFT). Total productivo Inv A + B = **3.756 plantas**, consistente con las ~3.740 plantas reales de operación actual.
