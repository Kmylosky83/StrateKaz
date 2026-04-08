---
name: deploy-commands-from-docs
description: NEVER generate VPS deploy commands from memory — always copy from deploy.md Option C
type: feedback
---

NUNCA generar comandos deploy VPS de memoria. SIEMPRE copiar textualmente de deploy.md Opción C/D/E según corresponda.

**Why:** El 2026-03-16 se generó un one-liner con 4 errores: (1) `source venv/bin/activate` en vez de `source backend/venv/bin/activate`, (2) faltaba `git checkout -- .` antes de pull, (3) faltaba `DJANGO_SETTINGS_MODULE=config.settings.production`, (4) faltaba reiniciar celery/beat. El deploy falló en VPS inmediatamente.

**How to apply:** Al entregar comando deploy VPS, SIEMPRE:
1. Leer deploy.md y copiar la Opción que aplique (C=completo, D=frontend-only, E=cascade)
2. NO modificar ni "simplificar" el comando
3. Si el deploy necesita pasos adicionales (ej: shell fix), agregarlos DESPUÉS del one-liner estándar
