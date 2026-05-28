---
paths:
  - "docs/**/*.md"
  - "specs/**/*.md"
  - "CONTEXT.md"
  - "CLAUDE*.md"
---

# Docs — nalhuitad-vite

## Convenciones

- **`CLAUDE.md` y `CLAUDE_vite.md`** son fuente de verdad operacional para agentes. Mantener ≤ 200 líneas cada uno (Boris: adherencia confiable cae sobre eso). Si crece, extraer a `docs/` o a una skill bajo `.claude/skills/`.
- **`docs/adr/`** decisiones arquitectónicas — formato ADR (contexto · decisión · consecuencias). Una decisión por archivo.
- **`specs/<NNN-feature>/`** specs vivas de speckit. No editar manualmente specs cerradas (referenciar en ADR si cambia la decisión).
- **`docs/development/`** notas de desarrollo, sprints, retros.
- **`docs/agents/`** convenciones para flujo de agentes (issue-tracker, triage-labels, domain).

## Enlaces

- Usar rutas relativas entre docs (`../adr/0001-vite.md`), nunca URLs absolutas de GitHub
- Referenciar archivos de código con `path:line` (e.g. `src/lib/firebase.ts:42`)

## Estilo

- Headings jerárquicos sin saltos (`##` → `###`, no `##` → `####`)
- Tablas para comparaciones estructuradas
- Code fences con lenguaje (`​`​`ts`, `​`​`bash`, `​`​`json`)
- Sin emojis salvo que el usuario los pida

## Qué no hacer

- No duplicar contenido entre `CLAUDE.md` y skills — la skill es la fuente, CLAUDE.md referencia
- No commitear docs con credenciales, datos reales de plantas, o URLs internas de Firebase
- No agregar docs nuevos sin enlazarlos desde un índice (`docs/README.md` o `CLAUDE.md`)
