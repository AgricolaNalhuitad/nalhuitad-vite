# Protocolo de Seguridad — Nalhuitad

**Versión**: 1.0
**Fecha**: 2026-05-24
**Proyecto**: nalhuitad-vite (app móvil hidroponía Chonchi, Chiloé)
**Firebase Project ID**: `nalhuitad-d6758`
**Dueño operativo**: Grigor
**Estado**: vigente para Sprint 4 en adelante

---

## 0. Propósito de este documento

Este es el documento canónico de seguridad de Nalhuitad. Su público es:

1. **Grigor** (dueño, abogado, no programador) — debe poder ejecutar los runbooks sin asistencia técnica
2. **Desarrolladores externos** que el día de mañana toquen el repo — deben encontrar aquí el contexto completo sin reconstruir nada de Slack o memoria
3. **Auditores futuros** (compradores B2B, certificaciones) — deben ver políticas escritas, no folclore oral

Está organizado en tres horizontes temporales: **Horizonte 1** son los controles no negociables que deben estar antes de Sprint 4. **Horizonte 2** aplica cuando lleguen los sensores LilyGO. **Horizonte 3** aplica cuando la operación escale a múltiples sedes o cuando un comprador comercial exija auditoría.

---

## Tabla de contenidos

- [1. Estado actual de la seguridad](#1-estado-actual-de-la-seguridad)
- [2. Horizonte 1 — Antes de Sprint 4](#2-horizonte-1--antes-de-sprint-4)
  - [2.1 Firestore Security Rules](#21-firestore-security-rules)
  - [2.2 Tests de reglas (~50 casos)](#22-tests-de-reglas-50-casos)
  - [2.3 Restricción de API key — paso a paso](#23-restricción-de-api-key--paso-a-paso)
  - [2.4 Rotación de API key](#24-rotación-de-api-key)
  - [2.5 Auditoría de dependencias](#25-auditoría-de-dependencias)
  - [2.6 Backup diario a Google Cloud Storage](#26-backup-diario-a-google-cloud-storage)
  - [2.7 Runbook de respuesta a incidentes](#27-runbook-de-respuesta-a-incidentes)
- [3. Horizonte 2 — Llegada de sensores LilyGO](#3-horizonte-2--llegada-de-sensores-lilygo)
  - [3.1 Identidad por dispositivo](#31-identidad-por-dispositivo)
  - [3.2 Validación de lecturas en ingest](#32-validación-de-lecturas-en-ingest)
  - [3.3 Transporte HTTPS + mTLS](#33-transporte-https--mtls)
  - [3.4 Rate limiting en Cloud Functions](#34-rate-limiting-en-cloud-functions)
  - [3.5 OTA updates firmados](#35-ota-updates-firmados)
  - [3.6 Segmentación de red en sitio](#36-segmentación-de-red-en-sitio)
  - [3.7 Audit logging completo](#37-audit-logging-completo)
- [4. Horizonte 3 — Multi-sede y escala](#4-horizonte-3--multi-sede-y-escala)
  - [4.1 Multi-tenancy real](#41-multi-tenancy-real)
  - [4.2 RBAC formal](#42-rbac-formal)
  - [4.3 Cumplimiento Ley 19.628 (Chile)](#43-cumplimiento-ley-19628-chile)
  - [4.4 SOC2 Type I / ISO27001 lite](#44-soc2-type-i--iso27001-lite)
  - [4.5 Pentest externo anual](#45-pentest-externo-anual)
  - [4.6 Disaster Recovery cross-region](#46-disaster-recovery-cross-region)
  - [4.7 Gestión centralizada de secretos](#47-gestión-centralizada-de-secretos)
- [Apéndice A — Matriz de cobertura de tests](#apéndice-a--matriz-de-cobertura-de-tests)
- [Apéndice B — Comandos rápidos](#apéndice-b--comandos-rápidos)
- [Apéndice C — Contactos y referencias](#apéndice-c--contactos-y-referencias)
- [Apéndice D — Bitácora de cambios](#apéndice-d--bitácora-de-cambios)

---

## 1. Estado actual de la seguridad

### Implementado al 2026-05-24

| Control | Estado | Evidencia |
|---|---|---|
| Firebase Auth (email/password) | Activo | `src/features/auth/` |
| `.env.local` en `.gitignore` | Activo | `.gitignore`, validado por `lib/firebase.ts` al boot |
| Validación obligatoria de variables Firebase al boot | Activo | `lib/firebase.ts` lanza error explícito si falta cualquier `VITE_FIREBASE_*` |
| claude-code-security-review en CI | Activo | `.github/workflows/` |
| ECC AgentShield score 97/100 | Activo | última corrida verificada |
| Deny list configurada | Activo | settings.local.json |

### Pendiente (cubierto por este documento)

| Control | Horizonte | Sección |
|---|---|---|
| Firestore Security Rules formales | 1 | [2.1](#21-firestore-security-rules) |
| Tests de reglas | 1 | [2.2](#22-tests-de-reglas-50-casos) |
| Restricción de API key | 1 | [2.3](#23-restricción-de-api-key--paso-a-paso) |
| Rotación de API key | 1 | [2.4](#24-rotación-de-api-key) |
| Auditoría automática de deps | 1 | [2.5](#25-auditoría-de-dependencias) |
| Backup diario | 1 | [2.6](#26-backup-diario-a-google-cloud-storage) |
| Runbook incidentes | 1 | [2.7](#27-runbook-de-respuesta-a-incidentes) |
| Autenticación de socio (si aplica) | 1 | implícito en RBAC inicial de §2.1 |
| Sensores LilyGO | 2 | [3](#3-horizonte-2--llegada-de-sensores-lilygo) |
| Rate limiting Cloud Functions | 2 | [3.4](#34-rate-limiting-en-cloud-functions) |
| Multi-sede | 3 | [4.1](#41-multi-tenancy-real) |

---

## 2. Horizonte 1 — Antes de Sprint 4

Los siete controles de este horizonte son la base sobre la cual se construye todo lo demás. **Ningún ítem nuevo del Sprint 4 debe entrar a producción sin §2.1 y §2.3 deployados.**

### 2.1 Firestore Security Rules

**Archivo**: `firestore.rules` (raíz del repo)
**Deploy**: `pnpm rules:deploy` (equivale a `firebase deploy --only firestore:rules`)

#### Modelo de roles

Dos roles vía custom claims de Firebase Auth:

| Role | Quién | Permisos generales |
|---|---|---|
| `owner` | Grigor | Todo: lectura, escritura, gestión de catálogo, gestión de usuarios. Único que puede invocar Cloud Functions de borrado auditado. |
| `operator` | Socio / trabajadores | Lectura completa, creación de lotes/UPs/cosechas, actualización con restricciones (genealogía inmutable, cantidad solo decrece). |

Los claims se asignan exclusivamente vía Cloud Function admin (no editables desde cliente). Procedimiento:

```javascript
// scripts/setRole.ts — corre con service account admin
await admin.auth().setCustomUserClaims(uid, { role: 'owner' });
// Tras esto el usuario debe re-loggearse para que el token contenga el claim
```

#### Colecciones protegidas

| Colección | Lectura | Crear | Actualizar | Borrar |
|---|---|---|---|---|
| `users` | self o owner | owner | owner | nunca |
| `loteOrigen` | operator+ | operator+ con schema validado | operator+ excepto genealogía | nunca (vía CF) |
| `unidadesProduccion` | operator+ | operator+ con schema validado | operator+ excepto genealogía, cantidad solo decrece | nunca (vía CF) |
| `cosechas` | operator+ | operator+ con `lechugasEquivalentes == paquetes × 2` | nunca | nunca |
| `ubicaciones` | cualquier autenticado | owner con id `INV-[A-D]-XXX` | owner | nunca |
| `lotes` (legacy) | operator+ | nunca | nunca | nunca |
| `lotes_legacy` | operator+ | nunca | nunca | nunca |
| cualquier otra | nunca | nunca | nunca | nunca |

#### Invariantes de dominio aplicados en reglas

| Regla | Requisito funcional |
|---|---|
| `cantidadInicial == bandejas × 135` en `loteOrigen` | FR-004: 135 lechugas/bandeja canónico |
| `estado == 'activo'` al crear `loteOrigen` | FR-001 |
| `refLoteOrigen` y `parentUpId` inmutables en `unidadesProduccion` | FR-011: genealogía intocable |
| `cantidad` solo decrece o se mantiene en `unidadesProduccion` | FR-031: mortalidad/cosechas no inflan plantas |
| `lechugasEquivalentes == paquetes × 2` en `cosechas` | FR-016: 1 paquete = 2 lechugas |
| `cosechas` append-only (no update, no delete) | FR-015, FR-017 — corregir vía nueva cosecha de signo opuesto |
| `paquetes ≤ 210` por cosecha individual | Capacidad por viaje (Story 4 acceptance #4) |
| `ubicacionId` matchea `^INV-[A-D]-[A-Z0-9]+$` | FR-024: catálogo de 19 ubicaciones |

#### Lo que NO está en las reglas (y por qué)

Algunas validaciones funcionales son demasiado complejas o costosas para Firestore Rules y se delegan a Cloud Functions (Sprint 5+):

- **FR-009**: Suma de cantidades hijas == cantidad origen en raleo → requiere transacción atómica multi-doc, va en Cloud Function `executeRaleo`
- **FR-007**: Bloqueo de traslado a ubicación ocupada → requiere query, va en CF `executeTraslado`
- **FR-012**: Atomicidad del raleo (todo o nada) → naturaleza de transacción, CF
- **FR-019**: Auto-cambio de `loteOrigen` a `cosechado` cuando todas las UPs están cosechadas → trigger Firestore, CF
- **Borrados auditados** → CF que escribe a colección `audit/{id}` antes de borrar

Estas reglas las cubren los tests de Cloud Functions cuando se implementen, no las reglas Firestore.

### 2.2 Tests de reglas (~50 casos)

**Archivo**: `tests/security/firestore.rules.test.ts`
**Runner**: `pnpm test:rules` (levanta emulador Firestore en `127.0.0.1:8080`, ejecuta, lo apaga)
**Prerrequisitos**: Node 20+, Java JDK 11+ (Temurin recomendado), `pnpm install`

#### Categorías de tests

| Grupo | Tests | Qué valida |
|---|---|---|
| `auth & roles` | 6 | anónimo denegado, sin role denegado, operator/owner permitidos, default-deny en colecciones desconocidas |
| `loteOrigen create` | 10 | fórmula 135×bandejas, rangos bandejas (1-100), estado inicial 'activo', formato fecha ISO, campos extra rechazados, spoofing de createdBy bloqueado, variedad obligatoria no vacía |
| `loteOrigen update` | 7 | transición a 'cosechado'/'descartado' permitida, variedad/bandejas/createdBy inmutables, estado inválido rechazado, anónimo bloqueado, notas mutables |
| `loteOrigen delete` | 2 | denegado a operator y a owner (cliente nunca borra) |
| `unidadesProduccion create` | 7 | pattern ubicación, estado inicial 'activa', etapas válidas, refLoteOrigen requerido no vacío, cantidad mínima, hijas de raleo con parentUpId |
| `unidadesProduccion update` | 9 | cantidad decrece (cosecha parcial), bloqueada al subir, transiciones activa→trasladada/cosechada, traslado de ubicación, genealogía intocable, estados/ubicaciones inválidos rechazados |
| `unidadesProduccion delete` | 2 | denegado siempre |
| `cosechas` | 6 | fórmula paquetes×2, tope 210 paquetes, descarte no negativo, update denegado, delete denegado |
| `lotes legacy` | 5 | lectura permitida, escritura denegada en ambas colecciones incluso a owner |
| `ubicaciones` | 4 | lectura para autenticados, escritura solo owner, pattern de id validado |

**Total: ~58 tests** distribuidos en describe blocks por colección. La matriz completa de cobertura está en [Apéndice A](#apéndice-a--matriz-de-cobertura-de-tests).

#### Política de cambios en reglas

1. Cualquier PR que toque `firestore.rules` **debe** actualizar tests en el mismo PR
2. Si un test antiguo deja de aplicar, removerlo explícitamente con razón en commit
3. CI debe correr `pnpm test:rules` y bloquear merge si falla
4. Antes de `pnpm rules:deploy`, validar con `firebase deploy --only firestore:rules --dry-run`

### 2.3 Restricción de API key — paso a paso

La `VITE_FIREBASE_API_KEY` es pública por diseño (va en el bundle JavaScript). Eso no es una vulnerabilidad **si** la key está restringida correctamente. Sin restricciones, cualquiera puede:

- Tomar la key del bundle
- Consumir la cuota de Firebase del proyecto desde cualquier dominio
- Intentar fuerza bruta contra Identity Toolkit (Auth)
- Generar tráfico que dispare límites de billing

#### Pasos

**1. Abrir credenciales del proyecto**

URL directa: `https://console.cloud.google.com/apis/credentials?project=nalhuitad-d6758`

En la sección **API Keys** habrá al menos una key llamada `Browser key (auto created by Firebase)`. Click en su nombre para editar.

**2. Application restrictions → HTTP referrers**

Seleccionar **HTTP referrers (web sites)**. Click "ADD AN ITEM" por cada línea:

```
https://agricolanalhuitad.github.io/*
https://agricolanalhuitad.github.io/nalhuitad.github.io/*
http://localhost:5173/*
http://localhost:4173/*
http://127.0.0.1:5173/*
http://127.0.0.1:4173/*
```

Justificación por entrada:

| Entrada | Para qué |
|---|---|
| `agricolanalhuitad.github.io/*` | App nueva en producción (GitHub Pages, vite build) |
| `agricolanalhuitad.github.io/nalhuitad.github.io/*` | App legacy en convivencia 30 días |
| `localhost:5173/*` | `pnpm dev` (Vite dev server) |
| `localhost:4173/*` | `pnpm preview` (build local antes de subir) |
| `127.0.0.1:*` | Variante por si el browser no normaliza localhost |

Cuando agreguen dominio propio (ej. `app.nalhuitad.cl`), añadirlo aquí **antes** de cambiar DNS, no después.

**3. API restrictions → Restrict key**

En el dropdown marcar SOLO estas APIs (desmarcar el resto):

| API | Para qué |
|---|---|
| Identity Toolkit API | Login/registro Firebase Auth |
| Token Service API | Refresh automático de tokens de sesión |
| Cloud Firestore API | Lectura/escritura de la base de datos |
| Firebase Installations API | ID único por instalación (telemetría obligatoria) |
| Firebase Cloud Messaging API | Solo si planean push notifications, sino omitir |

**4. Save y verificar propagación**

Click **SAVE**. La propagación tarda hasta 5 minutos.

Verificación de que la app sigue funcionando:
1. Abrir app en producción
2. Hacer login con cuenta real
3. Crear un lote de prueba (descartar después)
4. DevTools → Network → confirmar 0 errores 403 desde dominios `*.googleapis.com`

Verificación de que la restricción funciona (test del ataque):

```powershell
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<API_KEY>" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@test.com\",\"password\":\"x\",\"returnSecureToken\":true}'
```

Esperado: `403 Forbidden — Requests from referer <empty> are blocked.`

Si la respuesta es 400 Bad Request o cualquier otra, la restricción NO está aplicada — repetir desde paso 2.

**5. Documentar el cambio**

Añadir entrada en [Apéndice D — Bitácora de cambios](#apéndice-d--bitácora-de-cambios) con fecha, qué se cambió y por qué.

### 2.4 Rotación de API key

| Frecuencia | Trigger | Acción |
|---|---|---|
| **Inicial (única)** | Setup del protocolo | Crear API key nueva con restricciones de §2.3, actualizar `.env.local`, eliminar la vieja a las 24h |
| **Anual** | Cumpleaños del proyecto | Crear nueva key, ventana overlap 7 días, deshabilitar la vieja |
| **Incidente** | Key aparece en log público, screenshot filtrado, commit accidental, o sospecha fundada | Rotación inmediata sin overlap |

#### Procedimiento de rotación

```
1. Console → APIs & Services → Credentials → CREATE CREDENTIALS → API key
2. Copiar la nueva key
3. Aplicar inmediatamente las restricciones de §2.3 a la nueva key
4. Actualizar .env.local (local) y secrets de GitHub Actions
5. Hacer rebuild + redeploy de la app
6. Esperar 1 hora de tráfico normal — verificar que no haya 403
7. (Modo overlap) Esperar 7 días con ambas keys activas
8. (Modo incidente) Saltar al paso 9 inmediatamente
9. Console → API key vieja → DELETE
10. Anotar en bitácora (Apéndice D)
```

### 2.5 Auditoría de dependencias

#### CI automático

Añadir al workflow existente `.github/workflows/`:

```yaml
audit:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
    - run: pnpm install --frozen-lockfile
    - run: pnpm audit --audit-level=high --prod
    - uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        severity: 'CRITICAL,HIGH'
        exit-code: '1'
```

#### Dependabot

Archivo `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    groups:
      minor-and-patch:
        update-types: ['minor', 'patch']
    open-pull-requests-limit: 5
```

#### Política de versionado

- **Patch y minor**: auto-merge si CI verde (Dependabot agrupados)
- **Major**: PR manual, revisar changelog, correr full test suite local antes de merge
- **Firebase SDK**: nunca actualizar major sin verificar que las custom claims y reglas siguen compatibles
- **React**: validar que no rompa hooks existentes (regla heredada: nada de hooks después de returns condicionales)

### 2.6 Backup diario a Google Cloud Storage

Sin backup, un `delete` accidental o un attack rampage es irrecuperable. Costo estimado: **< USD 2/mes** al volumen actual.

#### Setup único (Grigor o desarrollador)

**1. Crear bucket de backups en región Santiago**

```bash
gcloud storage buckets create gs://nalhuitad-backups \
  --project=nalhuitad-d6758 \
  --location=southamerica-west1 \
  --uniform-bucket-level-access
```

**2. Lifecycle rule: borrar exports > 30 días**

Archivo `lifecycle.json`:

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "Delete" },
        "condition": { "age": 30 }
      }
    ]
  }
}
```

```bash
gcloud storage buckets update gs://nalhuitad-backups --lifecycle-file=lifecycle.json
```

**3. Service account para backups**

```bash
gcloud iam service-accounts create firestore-backup \
  --display-name="Firestore daily backup" \
  --project=nalhuitad-d6758

gcloud projects add-iam-policy-binding nalhuitad-d6758 \
  --member="serviceAccount:firestore-backup@nalhuitad-d6758.iam.gserviceaccount.com" \
  --role="roles/datastore.importExportAdmin"

gcloud projects add-iam-policy-binding nalhuitad-d6758 \
  --member="serviceAccount:firestore-backup@nalhuitad-d6758.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

**4. Cloud Scheduler — corre diario 3 AM hora Chile**

```bash
gcloud scheduler jobs create http firestore-daily-backup \
  --project=nalhuitad-d6758 \
  --location=southamerica-west1 \
  --schedule="0 3 * * *" \
  --time-zone="America/Santiago" \
  --uri="https://firestore.googleapis.com/v1/projects/nalhuitad-d6758/databases/(default):exportDocuments" \
  --http-method=POST \
  --message-body='{"outputUriPrefix":"gs://nalhuitad-backups/daily"}' \
  --oauth-service-account-email=firestore-backup@nalhuitad-d6758.iam.gserviceaccount.com
```

**5. Verificar primera corrida manual**

```bash
gcloud scheduler jobs run firestore-daily-backup --location=southamerica-west1
# Esperar 5 min, luego:
gcloud storage ls gs://nalhuitad-backups/daily/
```

#### Restore — procedimiento de prueba trimestral

Validar que el backup sirve **antes** de necesitarlo de verdad:

```bash
# Importar a un proyecto staging (NUNCA a prod sin razón crítica)
gcloud firestore import \
  --project=nalhuitad-staging \
  gs://nalhuitad-backups/daily/<TIMESTAMP>
```

**Calendario obligatorio**: el primer día hábil de cada trimestre (enero, abril, julio, octubre). Anotar en bitácora (Apéndice D) con conteo de docs restaurados vs producción.

#### Política de retención

| Tipo | Retención | Justificación |
|---|---|---|
| Backup diario | 30 días | Lifecycle automático |
| Backup post-incidente | Permanente | Mover manualmente a bucket separado `gs://nalhuitad-backups-archive/` sin lifecycle |
| Backup pre-migración | Permanente | Antes de switchover legacy → LO+UP, p.ej. |

### 2.7 Runbook de respuesta a incidentes

#### Clasificación por severidad

| Severidad | Definición | Tiempo de respuesta | Quién actúa |
|---|---|---|---|
| **SEV1** | Datos comprometidos, pérdida de información, acceso no autorizado confirmado, borrado masivo | < 15 minutos | Grigor + contacto técnico inmediato |
| **SEV2** | App caída para todos los usuarios, login no funciona, billing alert disparado | < 1 hora | Grigor solo, escalar si no resuelve en 30 min |
| **SEV3** | Funcionalidad degradada, performance, errores intermitentes en una sola pantalla | Próximo día hábil | Anotar en issue de GitHub |

#### SEV1 — Runbook ejecutable por Grigor

**Síntoma típico**: usuario desconocido apareciendo en consola Firebase, datos modificados sin explicación, billing dispara alerta, screenshot filtrado.

```
PASO 1 — CONTENER (5 min)
  a. https://console.firebase.google.com/project/nalhuitad-d6758/authentication/users
  b. Identificar cuentas no reconocidas → click 3 puntos → "Disable account"
  c. Si no se distingue cuál: deshabilitar TODAS menos la de Grigor

PASO 2 — EVALUAR (5 min)
  a. https://console.firebase.google.com/project/nalhuitad-d6758/firestore
  b. Revisar colecciones loteOrigen, unidadesProduccion, cosechas
  c. ¿Documentos borrados o alterados? → ir a paso 3
  d. ¿Solo accesos sin daño? → ir a paso 4

PASO 3 — RESTAURAR (15 min)
  a. https://console.cloud.google.com/storage/browser/nalhuitad-backups/daily
  b. Identificar último backup PRE-incidente (timestamp anterior al evento)
  c. Ejecutar restore (ver §2.6 procedimiento de prueba, pero apuntando a prod)
  d. Verificar conteo de documentos

PASO 4 — ROTAR Y NOTIFICAR
  a. Rotar API key (§2.4 modo incidente)
  b. Forzar logout de todos los usuarios: Console → Authentication → Users → Revoke refresh tokens
  c. WhatsApp/llamada a contacto técnico (Apéndice C)
  d. WhatsApp a socio si aplica

PASO 5 — POST-MORTEM (siguiente día hábil)
  a. Crear docs/incidents/YYYY-MM-DD-titulo-corto.md desde template
  b. Timeline, causa raíz, qué se hizo, qué prevenir
  c. Actualizar este protocolo si surge un control faltante
```

#### SEV2 — Runbook

**Síntoma típico**: usuarios reportan que la app no abre, error 500, login falla, mensaje de billing en email.

```
PASO 1 — DIAGNOSTICAR (5 min)
  a. https://status.firebase.google.com/ → ¿hay outage de Firebase?
       SÍ: esperar, comunicar a usuarios. No actuar.
       NO: continuar.
  b. https://console.firebase.google.com/project/nalhuitad-d6758/hosting/sites
       ¿Último deploy fue reciente y rompió algo?
       SÍ: ir a paso 2.
       NO: ir a paso 3.

PASO 2 — ROLLBACK DEPLOY (2 min)
  a. Hosting → Releases → encontrar release previo (verde, sin issues reportados)
  b. Click 3 puntos → "Rollback"
  c. Refrescar app, verificar

PASO 3 — VERIFICAR BILLING
  a. https://console.cloud.google.com/billing
  b. ¿Cuota agotada? ¿Alerta disparada por uso inesperado?
       SÍ: posible incidente SEV1 disfrazado — escalar a SEV1
       NO: continuar a paso 4

PASO 4 — VERIFICAR REGLAS
  a. ¿Se hizo deploy reciente de firestore.rules?
       SÍ: rollback con `firebase deploy --only firestore:rules` desde commit previo
       NO: contactar técnico
```

#### SEV3 — Runbook

```
1. Crear issue en GitHub describiendo síntoma, pasos para reproducir, navegador/dispositivo
2. Tag: severity:low
3. Asignar a próximo Sprint
4. No requiere notificación inmediata
```

#### Template de post-mortem

Crear en `docs/incidents/YYYY-MM-DD-titulo.md`:

```markdown
# Incidente: <título>

**Fecha**: YYYY-MM-DD
**Severidad**: SEV1 / SEV2
**Detectado por**: <persona o monitoreo>
**Duración del impacto**: HH:MM

## Resumen ejecutivo
Una o dos frases.

## Timeline
- HH:MM — primera señal
- HH:MM — detección
- HH:MM — contención
- HH:MM — resolución
- HH:MM — comunicación cerrada

## Causa raíz
¿Qué falló técnicamente? ¿Por qué falló?

## Lo que funcionó
Controles que sí sirvieron.

## Lo que no funcionó
Lo que debió detectar antes y no lo hizo.

## Acciones de prevención
- [ ] Cambio en código / proceso
- [ ] Actualización a este protocolo
- [ ] Test nuevo que hubiera atrapado esto
```

---

## 3. Horizonte 2 — Llegada de sensores LilyGO

Cuando los sensores LilyGO ESP32 entren a operación, traen consigo una nueva superficie de ataque: dispositivos físicos en invernaderos remotos, posiblemente con WiFi débil, escribiendo a Firestore o vía Cloud Functions.

### 3.1 Identidad por dispositivo

**Anti-patrón a evitar**: una sola API key compartida entre todos los sensores. Si un LilyGO se roba o vuelca su flash, no hay forma de revocar sin tumbar la flota completa.

**Patrón correcto**: un service account por dispositivo con scope mínimo.

```
sensor-dwc-inv-a@nalhuitad-d6758.iam.gserviceaccount.com
sensor-nft-inv-b@nalhuitad-d6758.iam.gserviceaccount.com
sensor-almacigo-inv-d@nalhuitad-d6758.iam.gserviceaccount.com
```

Permisos por SA:

| Permiso | Alcance |
|---|---|
| Escribir a `lecturas/{sensorId}/{timestamp}` | Solo SU sensorId |
| Leer `dispositivos/{sensorId}/config` | Solo SU config |
| Cualquier otra cosa | Denegado por reglas |

Token JWT firmado por GCP, refrescado por el firmware cada hora.

Si un sensor se compromete:
```bash
gcloud iam service-accounts disable sensor-dwc-inv-a@nalhuitad-d6758.iam.gserviceaccount.com
# Las demás SAs siguen funcionando. Reemplazar firmware del comprometido.
```

### 3.2 Validación de lecturas en ingest

Cloud Function `ingestSensorReading` valida cada lectura antes de persistir:

| Campo | Rango válido | Acción fuera de rango |
|---|---|---|
| pH | 5.0 ≤ x ≤ 7.5 | Rechazar con flag `out_of_range` en colección `sensor_errors` |
| EC (mS/cm) | 0.5 ≤ x ≤ 3.5 | Idem |
| Temperatura (°C) | 0 ≤ x ≤ 50 | Idem |
| Humedad relativa | 20% ≤ x ≤ 100% | Idem |
| Timestamp | dentro de ±5 min del servidor | Rechazar como `replay_attack` |
| Delta vs lectura previa | < 30% cambio | Marcar `suspicious` pero persistir |

Esto bloquea sensores comprometidos que intenten envenenar el dataset para esconder problemas operativos (ej: pH real 4.0 reportado como 6.5 para evitar alertas).

### 3.3 Transporte HTTPS + mTLS

ESP32 soporta TLS sin esfuerzo extra. Cero excusas para texto plano.

| Mecanismo | Uso |
|---|---|
| HTTPS POST a Cloud Function endpoint | Mínimo aceptable |
| mTLS con certificado cliente embebido en firmware | Recomendado |
| MQTT sobre TLS con auth | Aceptable si se usa broker propio |
| MQTT sin TLS, broker público | **Prohibido** |

Certificados cliente generados con CA propia mantenida offline. Rotación anual.

### 3.4 Rate limiting en Cloud Functions

Ahora que existen endpoints expuestos, las cuotas implícitas de Firebase no bastan.

| Recurso | Límite | Implementación |
|---|---|---|
| Por sensor | 1 lectura cada 30 segundos | Doc TTL `rate_limit/{sensorId}` con timestamp última |
| Por IP | 60 requests/min | Cloud Armor delante de Cloud Functions, o lógica in-function con Redis/Memorystore |
| Por proyecto (billing) | Budget alert a USD 20/mes | Console → Billing → Budgets & alerts |
| Por endpoint público (app) | 100 req/min por usuario | Firebase App Check + tokens reCAPTCHA |

Cuando se dispare un rate limit, log a `audit/rate_limit_hits` con sensorId/IP/timestamp.

### 3.5 OTA updates firmados

Cuando llegue actualización remota de firmware:

```
1. Generar firmware binario
2. Firmar con clave privada offline (mantenida en YubiKey o similar)
3. Subir a gs://nalhuitad-firmware/v{N}.bin + v{N}.sig
4. Actualizar Firestore: dispositivos/{id}/firmwareTarget = v{N}
5. LilyGO consulta config cada hora, descarga si target ≠ instalado
6. Verifica firma con clave pública embebida en firmware actual
7. Si firma válida → flashea. Si no → rechaza, log, alerta
```

Si un sensor reporta versión que no existe en el bucket: alerta inmediata, posible compromiso físico.

### 3.6 Segmentación de red en sitio

Router con firewall (Mikrotik o pfSense, USD 100-300 inversión única):

| VLAN | Subred | Egreso permitido | Quién |
|---|---|---|---|
| `sensors` | 10.0.10.0/24 | Solo `*.googleapis.com:443` y NTP | Sensores LilyGO |
| `admin` | 10.0.1.0/24 | Todo egreso normal | Laptops, tablet de Grigor |
| `guest` | 10.0.20.0/24 | Solo internet, sin acceso interno | Visitas |

Sensores no pueden hablarse entre sí ni alcanzar la VLAN admin. Reduce blast radius si uno se compromete.

### 3.7 Audit logging completo

Activar Cloud Audit Logs para Firestore:

```
Console → IAM → Audit Logs → Cloud Firestore API
  ☑ Admin Read    ☑ Data Read    ☑ Data Write
```

Exportar a BigQuery vía log sink para queries históricas:

```sql
-- ¿Quién modificó el lote X el 2026-06-15?
SELECT timestamp, protoPayload.authenticationInfo.principalEmail, protoPayload.methodName
FROM `nalhuitad-d6758.firestore_logs.cloudaudit_googleapis_com_data_access`
WHERE protoPayload.resourceName LIKE '%loteOrigen/lote-abc%'
  AND DATE(timestamp) = '2026-06-15'
ORDER BY timestamp;
```

Costo: cubierto por free tier de Cloud Logging a esta escala (< 50 GB/mes).

---

## 4. Horizonte 3 — Multi-sede y escala

Aplica cuando Nalhuitad sea 3+ sitios o tenga compradores comerciales exigentes (supermercados, hoteles cadena).

### 4.1 Multi-tenancy real

Esquema:

```
sedes/{sedeId}                              ← Chonchi, Castro, Puerto Montt…
sedes/{sedeId}/loteOrigen/{loteId}          ← todo bajo sede
sedes/{sedeId}/unidadesProduccion/{upId}
sedes/{sedeId}/cosechas/{cosechaId}
sedes/{sedeId}/ubicaciones/{ubicId}
users/{uid}.allowedSedes: [sedeId, …]
```

Reglas Firestore checkean tanto el `sedeId` en path como el claim del usuario:

```javascript
match /sedes/{sedeId}/loteOrigen/{loteId} {
  allow read: if isAuth() && sedeId in request.auth.token.allowedSedes;
  ...
}
```

Owner ve todo (sin filtro), managers ven su(s) sede(s) asignada(s).

### 4.2 RBAC formal

| Rol | Lectura | Crear lote | Editar | Borrar | Gestionar usuarios |
|---|---|---|---|---|---|
| `owner` | Todo | Sí | Sí | Vía CF | Sí |
| `manager` | Sus sedes | Sí | Sí | No | No |
| `operator` | Sus sedes | Sí | Limitada | No | No |
| `viewer` | Sus sedes (solo lectura) | No | No | No | No |
| `device` | Solo escribir su propio `lecturas/{id}` | No | No | No | No |

Claims gestionados por Cloud Function admin con UI propia accesible solo a owner (Grigor no debe tocar `gcloud` para asignar roles).

### 4.3 Cumplimiento Ley 19.628 (Chile)

Si la app registra trabajadores (cosechadores, jornaleros), aplica la **Ley 19.628 sobre Protección de la Vida Privada** (en proceso de ser reemplazada por la nueva ley de datos personales 2026).

Requisitos técnicos sobre el sistema:

- **Aviso de privacidad** visible al onboarding del trabajador
- **Consentimiento explícito** para procesamiento de datos personales — campo `consentDate` y `consentVersion` en `users/{uid}`
- **Derechos ARCO** implementables:
  - Acceso: endpoint `/me/export` que entrega ZIP con todos los datos del usuario
  - Rectificación: edición desde la app
  - Cancelación: soft-delete con retención legal (mantener trazabilidad operacional, anonimizar PII)
  - Oposición: flag `optOutAnalytics` que excluye al usuario de telemetría
- **Datos sensibles** (licencias médicas, historiales) requieren doble consentimiento y cifrado en reposo (Firestore lo da por defecto; si se añade un blob storage, validar)

Grigor como abogado redacta los textos legales; el código solo debe soportar la operación.

### 4.4 SOC2 Type I / ISO27001 lite

Compradores B2B grandes (Walmart Chile, Jumbo, hoteles cadena) frecuentemente exigen evidencia de seguridad. No hace falta certificación formal cara (USD 30K+); basta con un dossier interno consistente:

| Política escrita | Responsable |
|---|---|
| Information Security Policy | Grigor (legal) |
| Access Control Policy | Grigor + técnico |
| Change Management Policy | Técnico |
| Vendor Management Policy | Grigor (legal) |
| Incident Response Policy | Este documento §2.7 + §4.6 |
| Business Continuity Plan | Este documento §2.6 + §4.6 |

Evidencia objetiva ya disponible:
- Logs de cambios → Git history + audit logs Firestore §3.7
- Backups probados → §2.6 procedimiento trimestral
- Tests de seguridad → §2.2
- Control de acceso → reglas Firestore §2.1

### 4.5 Pentest externo anual

Empresas en Chile que hacen pentest a este perfil:

- **Dreamlab** (Santiago)
- **NSS** (Santiago)
- **ITQ Latam** (regional)

Scope sugerido (~USD 2-5K por engagement):
- App web/móvil — OWASP Top 10
- Reglas Firestore — intentos de bypass
- Endpoints Cloud Functions — fuzzing, auth bypass
- Sensores IoT — análisis físico de un LilyGO de muestra

Calendario: primera semana de noviembre cada año (después de cosecha alta de octubre).

### 4.6 Disaster Recovery cross-region

| Métrica | Objetivo | Cómo |
|---|---|---|
| RTO (tiempo a recuperar) | 4 horas | Backups en bucket multi-región, app desplegable desde repo |
| RPO (pérdida máxima de datos) | 24 horas | Backup diario §2.6 |
| Región primaria | `southamerica-west1` (Santiago) | Firestore + GCS |
| Región DR | `us-east1` o `southamerica-east1` (São Paulo) | Bucket de backups replicado |

Si la región Santiago cae: la app sirve desde Firebase Hosting global (multi-región automático); los datos se restauran desde backup en región alternativa.

### 4.7 Gestión centralizada de secretos

Cuando existan más secretos que solo Firebase config (tokens Telegram, claves firma firmware, credenciales API compradores):

**Google Secret Manager**:

```bash
# Crear secret
echo -n "TELEGRAM_BOT_TOKEN_VALUE" | gcloud secrets create telegram-bot-token --data-file=-

# Cloud Function lo lee en runtime
const [version] = await secretClient.accessSecretVersion({
  name: 'projects/nalhuitad-d6758/secrets/telegram-bot-token/versions/latest'
});
```

Reglas:
- Nada de secretos en repo, ni siquiera en commits viejos (purgar history si hay alguno)
- Nada de secretos en `.env` de servidor — solo Secret Manager
- Rotación automática para los que lo permitan (Cloud SQL passwords, etc.)
- Acceso a secrets logueado a auditoría

---

## Apéndice A — Matriz de cobertura de tests

| # | Test | Colección | Regla validada |
|---|---|---|---|
| 1 | anonymous cannot read loteOrigen | loteOrigen | `isOperator()` requiere auth |
| 2 | authenticated without role cannot read loteOrigen | loteOrigen | role check |
| 3 | operator can read loteOrigen | loteOrigen | role=operator |
| 4 | owner can read loteOrigen | loteOrigen | role=owner |
| 5 | anonymous denied on default deny path | catch-all | default deny |
| 6 | authenticated denied on undeclared collection | catch-all | default deny |
| 7 | operator creates valid loteOrigen | loteOrigen | create happy path |
| 8 | rejects cantidadInicial != bandejas * 135 | loteOrigen | FR-004 |
| 9 | rejects bandejas = 0 | loteOrigen | rango bandejas |
| 10 | rejects bandejas > 100 | loteOrigen | rango bandejas |
| 11 | rejects estado != activo on create | loteOrigen | FR-001 estado inicial |
| 12 | rejects malformed fechaSiembra | loteOrigen | regex ISO date |
| 13 | rejects extra unknown field | loteOrigen | `hasOnly` |
| 14 | rejects createdBy != auth uid | loteOrigen | anti-spoofing |
| 15 | rejects missing required field | loteOrigen | `hasAll` |
| 16 | rejects empty variedad | loteOrigen | `size() > 0` |
| 17 | allows transition activo → cosechado | loteOrigen | estado mutable |
| 18 | allows updating notas | loteOrigen | notas mutable |
| 19 | rejects changing variedad | loteOrigen | FR-011 |
| 20 | rejects changing bandejas | loteOrigen | inmutable |
| 21 | rejects changing createdBy | loteOrigen | audit trail |
| 22 | rejects invalid estado | loteOrigen | enum estado |
| 23 | rejects update by anonymous | loteOrigen | auth |
| 24 | denies delete to operator | loteOrigen | no delete cliente |
| 25 | denies delete to owner | loteOrigen | no delete cliente |
| 26 | operator creates valid UP | unidadesProduccion | create happy path |
| 27 | rejects invalid ubicacionId pattern | unidadesProduccion | regex `INV-[A-D]-` |
| 28 | rejects estado != activa on create | unidadesProduccion | FR-002 |
| 29 | rejects invalid etapa | unidadesProduccion | enum stage |
| 30 | rejects empty refLoteOrigen | unidadesProduccion | genealogía obligatoria |
| 31 | rejects cantidad = 0 | unidadesProduccion | rango cantidad |
| 32 | accepts UP with parentUpId | unidadesProduccion | hija de raleo |
| 33 | allows cantidad decrease | unidadesProduccion | FR-031 |
| 34 | rejects cantidad increase | unidadesProduccion | FR-031 |
| 35 | allows estado activa → trasladada | unidadesProduccion | FR-010 raleo |
| 36 | allows estado activa → cosechada | unidadesProduccion | FR-018 |
| 37 | allows ubicacionId change | unidadesProduccion | FR-005 traslado |
| 38 | rejects changing refLoteOrigen | unidadesProduccion | FR-011 |
| 39 | rejects changing parentUpId | unidadesProduccion | FR-011 |
| 40 | rejects invalid estado | unidadesProduccion | enum estado |
| 41 | rejects invalid ubicacionId after traslado | unidadesProduccion | regex |
| 42 | denies delete to operator | unidadesProduccion | no delete cliente |
| 43 | denies delete to owner | unidadesProduccion | no delete cliente |
| 44 | operator creates valid cosecha | cosechas | create happy path |
| 45 | rejects lechugasEquivalentes != paquetes * 2 | cosechas | FR-016 |
| 46 | rejects paquetes > 210 | cosechas | capacidad por viaje |
| 47 | rejects negative descarte | cosechas | rango |
| 48 | rejects update of existing cosecha | cosechas | append-only |
| 49 | rejects delete of existing cosecha | cosechas | append-only |
| 50 | operator can read lotes legacy | lotes | read-only legacy |
| 51 | operator can read lotes_legacy | lotes_legacy | read-only legacy |
| 52 | denies write to lotes even by owner | lotes | congelado |
| 53 | denies create new lote in legacy collection | lotes | congelado |
| 54 | denies delete in lotes_legacy | lotes_legacy | congelado |
| 55 | any authenticated can read ubicaciones | ubicaciones | catálogo público auth |
| 56 | anonymous cannot read ubicaciones | ubicaciones | auth required |
| 57 | only owner can create catálogo entry | ubicaciones | role=owner |
| 58 | rejects ubicacionId outside pattern | ubicaciones | regex |

---

## Apéndice B — Comandos rápidos

### Desarrollo local

```powershell
# Setup inicial (una vez)
pnpm install
pnpm exec firebase login

# Tests de reglas (levanta emulador, corre, apaga)
pnpm test:rules

# Tests de app
pnpm test:run

# Validación completa antes de commit
pnpm typecheck && pnpm lint && pnpm test:run
```

### Deploy

```powershell
# Reglas Firestore (después de tests verdes)
pnpm rules:deploy

# Verificar antes con dry-run
pnpm exec firebase deploy --only firestore:rules --dry-run

# App (Hosting)
pnpm build
pnpm exec firebase deploy --only hosting
```

### Operaciones

```bash
# Asignar role a usuario (script con service account)
pnpm exec ts-node scripts/setRole.ts <uid> <owner|operator>

# Listar usuarios
gcloud auth list --project=nalhuitad-d6758

# Ver backups disponibles
gcloud storage ls gs://nalhuitad-backups/daily/

# Ejecutar backup manual ahora
gcloud scheduler jobs run firestore-daily-backup --location=southamerica-west1

# Rollback de Hosting (emergencia SEV2)
# Hacer desde Console: Firebase → Hosting → Releases → 3 puntos → Rollback
```

### Auditoría

```powershell
# Audit de dependencias local
pnpm audit --audit-level=high --prod

# Ver últimas escrituras en Firestore (necesita BigQuery sink configurado)
# Console → BigQuery → consultar nalhuitad-d6758.firestore_logs
```

---

## Apéndice C — Contactos y referencias

### Contactos operativos

| Rol | Nombre | Canal | Cuándo contactar |
|---|---|---|---|
| Dueño | Grigor | WhatsApp / email | Todo lo crítico |
| Socio operativo | _por definir_ | _por definir_ | SEV1, decisiones operacionales |
| Desarrollador primario | _por definir_ | _por definir_ | SEV1, SEV2 si no se resuelve en 30 min |
| Soporte Firebase | https://firebase.google.com/support | Email (tier según plan) | Cuando esté caído Firebase mismo |

### URLs frecuentes

| Recurso | URL |
|---|---|
| Firebase Console del proyecto | https://console.firebase.google.com/project/nalhuitad-d6758 |
| GCP Console del proyecto | https://console.cloud.google.com/?project=nalhuitad-d6758 |
| Credenciales / API keys | https://console.cloud.google.com/apis/credentials?project=nalhuitad-d6758 |
| Billing | https://console.cloud.google.com/billing |
| Firebase Status | https://status.firebase.google.com/ |
| Backups (GCS) | https://console.cloud.google.com/storage/browser/nalhuitad-backups |
| App producción nueva | https://agricolanalhuitad.github.io/ |
| App legacy | https://agricolanalhuitad.github.io/nalhuitad.github.io |
| Repo | (URL del repo Git aquí) |

### Documentación de referencia

- [Firestore Security Rules — Reference](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [`@firebase/rules-unit-testing` docs](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Cloud Audit Logs para Firestore](https://cloud.google.com/firestore/docs/audit-logging)
- [OWASP Top 10 (2021)](https://owasp.org/Top10/)
- [Ley 19.628 Chile (texto oficial)](https://www.bcn.cl/leychile/navegar?idNorma=141599)

---

## Apéndice D — Bitácora de cambios

| Fecha | Cambio | Autor | Razón |
|---|---|---|---|
| 2026-05-24 | Versión inicial del protocolo | Grigor + Claude | Setup pre-Sprint 4 |
| _pendiente_ | Restricción API key aplicada | _Grigor_ | §2.3 ejecutado |
| _pendiente_ | Firestore rules deployadas | _Grigor_ | §2.1 ejecutado |
| _pendiente_ | Backup diario operativo | _Grigor_ | §2.6 ejecutado |

> Cada cambio operativo del protocolo (rotación de key, ejecución de runbook, restore de backup, etc.) debe quedar registrado aquí con fecha y razón. Esta bitácora es evidencia para auditorías y para post-mortems.
