---
name: Comandos VPS — siempre completos y ejecutables
description: No dar comandos interactivos fragmentados para el VPS; usar -c con python manage.py shell
type: feedback
---

Siempre dar comandos VPS completos y directamente ejecutables en bash, como hace deploy.sh.

**Why:** El usuario opera en terminal web de Hostinger. Comandos fragmentados (entrar al shell, pegar código, exit) causan confusión y errores de sintaxis bash. El venv tampoco está activo por defecto.

**How to apply:**
- Para Django shell: usar `python manage.py shell -c "..."` con el código inline
- Siempre incluir `source /opt/stratekaz/backend/venv/bin/activate &&` al inicio
- Nunca pedir al usuario que entre al shell interactivo y pegue código por separado
- Nunca dar `exit()` como paso separado
- Para scripts largos, encadenar todo en un solo bloque bash ejecutable
