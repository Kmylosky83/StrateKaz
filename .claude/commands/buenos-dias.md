---
description: Rehidratación liviana — valida estado del repo, CI, deuda abierta, y propone arranque
argument-hint: "[opcional: skip-ci]"
---

# Protocolo Buenos Días — StrateKaz

Ejecuta este protocolo paso a paso al inicio de cada sesión de trabajo.
Objetivo: validar el estado real del repo, confirmar la deuda pendiente y
alinear el arranque con lo acordado en la última sesión cerrada.

**NO es un cierre** (usar `/cerrar-sesion` para eso). **NO reemplaza** la
carga automática de `CLAUDE.md` + `MEMORY.md` del system prompt — complementa.

## Paso 1 — Estado del repo

Corre en paralelo:
- `git fetch origin` (sincronizar refs remotas)
- `git log --oneline -8` (últimos commits)
- `git status` (cambios sin commitear)
- `git log HEAD..origin/main --oneline` (commits en remoto que no tengo local)

Si `git status` muestra cambios sin commitear:
> "Hay cambios sin commitear del final de la sesión anterior. ¿Los reviso antes de arrancar?"

Si `HEAD..origin/main` muestra commits:
> "Hay commits nuevos en `origin/main` que no tengo local. ¿Hago `git pull` antes de arrancar?"

## Paso 2 — Confirmar último cierre

Lee:
- Sección `"## Última sesión cerrada"` de `~/.claude/projects/C--Proyectos-StrateKaz/memory/MEMORY.md`
- El último doc de `docs/history/` (ordenar por fecha, tomar el más reciente)

Extrae:
- Último commit citado en el cierre
- Próximo paso acordado
- Deuda consciente activa (lista de `H-*`)

## Paso 3 — Validar CI del último push (opcional: saltar con `$1 == "skip-ci"`)

```bash
curl -s "https://api.github.com/repos/Kmylosky83/StrateKaz/actions/runs?branch=main&per_page=3"
```

Parsear y reportar para el último commit local:
- `CI - Continuous Integration` → ✅ / ⏳ / ❌
- `CodeQL Security Analysis` → ✅ / ⏳ / ❌

Si hay fallo (❌), leer el job/step que falló y reportar al usuario.

## Paso 4 — Priorizar deuda activa

De los `H-*` del último doc de cierre, clasificar:

**Bloqueantes para próxima sesión** — verificar antes de avanzar:
- Tests pendientes de re-correr
- Fixes no verificados
- CI rojo

**No bloqueantes** — mencionar pero no forzar:
- Mejoras, refactors menores, features pendientes

## Paso 5 — Proponer arranque

Reportar al usuario con formato:

```
Buenos días. Estado del repo:
- Último commit: <hash> (<scope>)
- Working tree: <limpio | cambios pendientes>
- Sync con origin: <al día | <N> commits pull pendiente>
- CI último push: <✅ verde | ⏳ corriendo | ❌ falló en X>

Deuda activa:
- <H-xx-N> <descripción> ← BLOQUEANTE / no bloqueante
- ...

Próximo paso acordado: <del MEMORY.md>

Plan propuesto:
1. [Verificar deuda bloqueante si hay]
2. [Arrancar próximo paso]

¿Arrancamos con esto o hay algo nuevo que tengas en mente?
```

## Reglas críticas

- **NO modificar archivos** en buenos-dias — es solo lectura + reporte.
- **NO commitear nada** en este comando.
- **NO inventar estado del CI** — si la API falla, decirlo y ofrecer continuar sin CI check.
- **NO forzar el plan** — el usuario puede redirigir. El comando propone, no impone.
- **Español colombiano** con tildes correctas siempre.
- Si no hay MEMORY.md "Última sesión cerrada" o está vacío, pedir al usuario contexto breve antes de proponer arranque.

## Cuándo NO usar este comando

- Cuando arrancas una tarea puntual no relacionada con la última sesión (ej: "revisa un bug específico").
- Cuando el usuario ya te dio el contexto del arranque en el primer mensaje.
- Cuando estás dentro de una sesión en curso (no al arranque del día).
