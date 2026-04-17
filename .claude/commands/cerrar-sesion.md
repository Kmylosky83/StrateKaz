---
description: Cierra la sesión actual — crea doc/history/, actualiza MEMORY.md, propone commit
argument-hint: "[título-kebab-opcional]"
---

# Protocolo Cierra Sesión — StrateKaz

Ejecuta este protocolo paso a paso. No saltes pasos. Pide confirmación antes de commitear.

## Paso 1 — Auditar sesión

Corre en paralelo:
- `git log --since=midnight --oneline` (commits del día)
- `git status` (cambios sin commitear)
- `git log -1 --format=%H` (último hash)

Si no hay commits del día Y no hay cambios pendientes, informa al usuario y detente:
> "No hay commits ni cambios pendientes hoy. Nada que cerrar. ¿Quieres forzar un cierre vacío de sesión?"

## Paso 2 — Inferir título o preguntar

Si el usuario pasó argumento (`$1`), usar como slug kebab-case.
Si no, inferir del primer commit del día (tipo + scope). Ejemplos:
- `feat(catalogo-productos): ...` → `supply-chain-s1-catalogo-productos`
- `fix(auth): ...` → `auth-fix-<resumen>`

Si no puedes inferir con confianza, **PREGUNTA** al usuario:
> "¿Qué título le doy a la sesión? (kebab-case, ej: 'supply-chain-s2-proveedor')"

NO inventes. Espera respuesta.

## Paso 3 — Leer contexto mínimo

Lee estos archivos para tener contexto al redactar el doc de cierre:
- Diff de commits del día: `git log --since=midnight -p --stat`
- Archivo de sesión anterior en `docs/history/` (última fecha) — para tono y estructura consistente
- `~/.claude/projects/C--Proyectos-StrateKaz/memory/MEMORY.md` — sección "Última sesión cerrada" actual

## Paso 4 — Crear doc de cierre

Crear archivo `docs/history/YYYY-MM-DD-<titulo-kebab>.md` con esta estructura obligatoria:

```markdown
# Sesión YYYY-MM-DD — <Título legible>

## Commits del día
| Commit | Descripción | CI |
|--------|-------------|----|
| <hash> | <tipo(scope): descripción> | <✅ #nro / ⏳ pendiente / ❌ #nro> |

## Estado del producto
- CURRENT_DEPLOY_LEVEL: <valor>
- Tests: <N passed / N failed / N skipped / N errors>
- Gate CI: <N rutas, N tests bloqueantes>
- Apps LIVE tocadas: <lista>

## Decisiones tomadas (no reabrir)
1. <Decisión arquitectónica>
2. ...

## Deuda consciente activa
- <Item deuda>: <razón por la que se deja pendiente>
- ...

## Próximo paso claro
<Una frase de qué hacer en la siguiente sesión>

## Archivos clave tocados
- `path/to/file.py` — <qué cambió>
- ...

## Hallazgos abiertos (si aplica)
- **HXX** — <descripción>: severidad <ALTA/MEDIA/BAJA>
```

Rellena los campos leyendo el diff + contexto. NO inventes CI verde si no lo verificaste.

## Paso 5 — Actualizar MEMORY.md

Edita `~/.claude/projects/C--Proyectos-StrateKaz/memory/MEMORY.md`:

**5a.** Reemplazar sección "## Última sesión cerrada" con 4 líneas máximo:
```markdown
## Última sesión cerrada
**YYYY-MM-DD** — <resumen 1 línea>.
<Estado clave 1 línea: tests, deploy level, etc.>
Próximo: <qué sigue>.
Detalle completo: `docs/history/YYYY-MM-DD-<titulo>.md`.
```

**5b.** Agregar línea en sección "### Historia (sesiones cerradas)" con formato:
```markdown
- `docs/history/YYYY-MM-DD-<titulo>.md` — <resumen corto ≤80 chars>
```

Verificar que MEMORY.md total quede bajo 200 líneas. Si supera, alertar al usuario.

## Paso 6 — Proponer commit

NO commitear automáticamente. Mostrar al usuario:

> **Resumen del cierre:**
> - Archivo creado: `docs/history/YYYY-MM-DD-<titulo>.md`
> - MEMORY.md actualizado (local, NO se commitea)
>
> **Commit propuesto:**
> ```
> docs(history): cierre sesión YYYY-MM-DD — <resumen>
> ```
>
> ¿Procedo con `git add docs/history/YYYY-MM-DD-*.md && git commit`?
> (responde "sí" para commitear, "no" para solo dejar el archivo)

## Reglas críticas

- **NO commitear MEMORY.md** — es scratch pad local, fuera del repo.
- **NO forzar verde en CI** — si no verificaste CI, escribe "⏳ pendiente" o "no verificado".
- **NO inventar hallazgos** — solo documentar lo que realmente salió en la sesión.
- **NO duplicar contenido** — si ya hay un doc arquitectónico sobre el tema, referencialo en vez de copiar.
- **Español colombiano** con tildes correctas siempre.
- Si el usuario pide "cierra y pushea", ENTONCES sí hacer `git push` tras el commit (sigue la instrucción permanente: commit → push → CI → deploy).
