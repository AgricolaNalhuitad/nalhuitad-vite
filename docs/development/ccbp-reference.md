# Referencia — claude-code-best-practice (Shayan Raisshan)

Repo upstream: https://github.com/shanraisshan/claude-code-best-practice

Repo de referencia para conceptos de Claude Code. **No es dependencia** — solo material de consulta.

## Qué consultar ahí

| Tema | Archivo upstream |
|---|---|
| Frontmatter de skills (15 campos) | `best-practice/claude-skills.md` |
| Frontmatter de subagents (16 campos) | `best-practice/claude-subagents.md` |
| Todos los 27 hook events | `.claude/hooks/HOOKS-README.md` |
| Patrón Command → Agent → Skill | `orchestration-workflow/orchestration-workflow.md` |
| Configuración (jerarquía) | `best-practice/claude-settings.md` |
| Auto-memoria y rules | `best-practice/claude-memory.md` |
| MCP servers | `best-practice/claude-mcp.md` |
| Tips Boris Cherny (15+ tips) | `tips/claude-boris-15-tips-30-mar-26.md` |
| Power-ups (`/powerup`) | `best-practice/claude-power-ups.md` |

## Qué NO traer desde ahí

- **Sistema de hooks por sonido** (`.claude/hooks/scripts/hooks.py`) — 480 líneas Python para reproducir WAVs. Grigor no observa terminal en vivo; overhead > valor
- **Agentes y skills de demo** (weather, time, presentation, agent-browser) — irrelevantes para hidropónica. `agent-browser` además está flagged **High Risk** por Snyk
- **`spinnerVerbs`, `spinnerTipsOverride`** — branding personal del autor
- **`enableAllProjectMcpServers: true`** — demasiado permisivo para datos de producción
- **`development-workflows-research-agent`** con `bypassPermissions: true` — riesgoso en repo con `.env.local` y RBAC vivos

## Qué SÍ se aplicó en nalhuitad

- `.claude/settings.json` → permissions `ask` para `rm`, `chmod`, `npm`, `yarn`, `firebase deploy`, `git push --force`, etc. Previene reincidencia del incidente 24-05-2026 (borrado accidental de `book-to-skill`)
- `.claude/settings.json` → `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: 80` (defer autocompact)
- `.claude/rules/docs.md` con `paths:` lazy-loaded — convenciones para `docs/`, `specs/`, `CLAUDE*.md`

## Decisiones pendientes (ver conversación con Grigor)

- MCP: agregar `context7` (docs Firebase/React 19 live) y/o `playwright` (E2E Sprint 4)
- `plansDirectory: ./reports` — actualmente nalhuitad usa `specs/` (speckit)
- Research agent adaptado sin `bypassPermissions` — útil para evaluar libs/SDKs
