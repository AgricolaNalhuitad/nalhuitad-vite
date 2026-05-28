---
name: freeze
description: Use cuando Grigor pide "freeze", "congela", "snapshot antes de", o ANTES de cualquier operación de alto riesgo donde quiera tener un punto de rollback rápido y explícito. Crea un git tag local de freeze + activa modo no-write hasta unfreeze.
---

# /freeze — Snapshot de seguridad

Crea un punto de restauración rápido **antes** de operaciones donde pueda perderse trabajo. Es complemento de `/careful`: careful previene cambios accidentales, freeze garantiza rollback si algo se cuela igual.

## Cuando activar

- Antes de un refactor grande que cruza múltiples archivos
- Antes de un `firebase deploy` a prod
- Antes de aceptar un PR de Claude que tocó zonas críticas
- Antes de upgrade mayor de deps (`pnpm update --latest`, migración React, etc.)
- Cuando Grigor diga "freeze" o "snapshot" o "antes de tocar X dame escape"

## Protocolo

### 1. Verificar estado limpio

```bash
git status --short
```

Si hay cambios sin commitear, **NO hacer freeze todavía**. Preguntar a Grigor:
- "Hay cambios sin commit. ¿Los commiteamos primero, los stasheamos, o cancelamos el freeze?"

### 2. Crear tag de freeze

```bash
$tagName = "freeze-" + (Get-Date -Format "yyyyMMdd-HHmm")
git tag -a $tagName -m "Freeze antes de: <razón breve>"
```

Ejemplo de nombre: `freeze-20260524-1830`.

### 3. Confirmar a Grigor

Mostrar:
- Nombre del tag creado
- Commit hash sobre el que apunta (`git rev-parse HEAD`)
- Comando exacto de rollback: `git reset --hard <tag-name>` (con advertencia: destructivo)

### 4. Entrar en modo no-write

Durante el freeze:
- **NO usar Edit / Write / NotebookEdit / Bash que escriba al disco** en archivos del repo
- Sí permitido: Read, Grep, Glob, Bash de solo lectura (status, log, diff)
- Si Grigor pide un cambio durante el freeze, decir "estamos en freeze — necesito que confirmes unfreeze o que use solo plan mode para mostrarte el diff sin aplicarlo"

### 5. Salir del freeze

Cuando Grigor diga "unfreeze" o "ok continúa":
- Confirmar explícitamente: "Saliendo de freeze `<tag-name>`. El tag se mantiene local hasta que decidas borrarlo."
- Borrar tag opcional: `git tag -d <tag-name>` (Grigor decide)

## Rollback (si algo salió mal después)

```bash
# Ver qué tags de freeze existen
git tag --list 'freeze-*' --sort=-creatordate

# Rollback destructivo (descarta TODO desde el freeze)
git reset --hard <tag-name>

# Rollback no-destructivo (crea commit que revierte)
git revert --no-commit <tag-name>..HEAD
git commit -m "revert: rollback a $tag-name"
```

**Preferir `git revert`** sobre `git reset --hard` si ya hubo push. Reset destructivo solo en local antes del primer push.

## Anti-patterns

- Crear freeze con working tree sucio y después no saber qué cambios eran de antes vs nuevos
- Usar `git reset --hard` después de haber pusheado el tag — reescribir history en remote es destructivo
- Olvidar borrar tags viejos de freeze — acumular 50 tags `freeze-*` ensucia `git tag --list`
- Salir del freeze implícitamente sin decirlo — el operador pierde control

## Notas

- Los tags `freeze-*` son **locales por default** (no se pushean automáticamente). Para snapshot remoto, agregar `git push origin <tag>` (preguntar a Grigor)
- El tag apunta al commit, no al working tree. Si hay uncommitted changes en el freeze, NO quedan en el tag — por eso el paso 1 exige estado limpio
