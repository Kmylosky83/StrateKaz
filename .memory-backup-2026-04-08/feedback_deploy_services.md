---
name: Deploy service names
description: VPS systemd services use stratekaz- prefix, not plain names
type: feedback
---

SIEMPRE usar nombres correctos de servicios systemd en VPS: `stratekaz-gunicorn`, `stratekaz-celery`, `stratekaz-celerybeat`.

**Why:** Los servicios NO se llaman `gunicorn`, `celery`, `celerybeat` — llevan prefijo `stratekaz-`. Usar nombres incorrectos causa `Unit not found`.

**How to apply:** Al generar comandos deploy VPS, SIEMPRE consultar deploy.md Opción C o usar esta referencia:
```bash
sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
```
