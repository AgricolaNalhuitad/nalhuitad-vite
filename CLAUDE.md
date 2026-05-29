<!-- SPECKIT START -->

Plan activo: [specs/001-traceability-lo-up/plan.md](specs/001-traceability-lo-up/plan.md)
(Trazabilidad LO+UP — Sprint 4). Contexto técnico, estructura y artefactos
(research.md, data-model.md, contracts/, quickstart.md) en ese directorio.

<!-- SPECKIT END -->

## Code Review — protocolo único

Default: siempre `gstack /code-review` antes de abrir PR.
Crítico (Firestore rules, RBAC, Auth, sensores/dosificación): `gstack /code-review --ultra`
No usar para code review: oh-my-claudecode:code-reviewer, ECC code-review, superpowers review.

## Sistemas de memoria — regla única

auto-memory (MEMORY.md): contexto usuario, feedback, preferencias de desarrollo.
MemPalace: conocimiento estructurado de dominio — formulaciones, sensores, recetas, decisiones de producto.
claude-mem: desactivado. Excepción: learn-codebase una vez por sprint, output curado a Obsidian.

## Principios de trabajo

### Cambios mínimos (Minimal Change)

- Tocar solo lo que el task requiere. Si un archivo no es necesario para el task, no abrirlo.
- Tres líneas similares > abstracción prematura. Extraer helper recién en la cuarta ocurrencia.
- Sin defensive code para casos imposibles. Validar solo en boundaries (input usuario, APIs externas).
- Si se detecta algo mejorable fuera del scope: anotarlo como follow-up, nunca editar en silencio.

### Verificación real (Reality Check)

- Validar contra comportamiento real, no suposiciones. CI verde ≠ prod funcionando.
- Después de cada deploy: verificar en prod manualmente, no asumir que el build exitoso alcanza.
- "Funciona en mi máquina" no es evidencia. Screenshots o métricas reales son evidencia.
- Default: NEEDS WORK. Solo READY con evidencia concreta.

### Alertas operacionales (Incident Response)

Cuando dispara alerta en Telegram o Firestore:

1. OBSERVAR — confirmar que es real, no falso positivo
2. ESTABILIZAR — detener el sangrado primero (rollback, feature flag, pausa dosificación)
3. HIPOTETIZAR — una hipótesis a la vez, 15 min máximo por camino
4. ROOT CAUSE — buscar causa sistémica, no parchear síntoma
   Regla: el hardware con límites duros nunca espera instrucción de software para proteger plantas.
