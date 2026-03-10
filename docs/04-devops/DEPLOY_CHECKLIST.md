# Deploy Checklist — StrateKaz SGI

> Checklist genérico para cualquier deploy. Para comandos completos y one-liners, ver `memory/deploy.md`.

---

## PRE-DEPLOY

### 1. Verificar código local
- [ ] Todos los cambios committed y pusheados a `origin main`
- [ ] `npm run build` exitoso localmente (0 errores TypeScript)
- [ ] `python manage.py check --deploy` sin warnings críticos
- [ ] Migraciones creadas localmente (NUNCA `makemigrations` en VPS)

### 2. Identificar cambios del deploy
- [ ] **Migraciones pendientes**: `python manage.py showmigrations --plan | grep "\[ \]"`
- [ ] **Seeds necesarios**: ¿Cambió `seed_estructura_final`, `seed_permisos_rbac`, etc.?
- [ ] **Dependencias**: ¿Cambió `requirements.txt` o `package.json`?
- [ ] **Collectstatic**: ¿Cambió archivos estáticos del backend?

---

## DEPLOY EN VPS

### Opción rápida: Solo Frontend
```bash
cd /opt/stratekaz && git checkout -- . && git pull origin main && cd frontend && npm install && VITE_API_URL=https://app.stratekaz.com/api VITE_BASE_DOMAIN=stratekaz.com npm run build
```

### Opción completa: Full-stack
```bash
cd /opt/stratekaz && git checkout -- . && git pull origin main && cd backend && source venv/bin/activate && DJANGO_SETTINGS_MODULE=config.settings.production python manage.py migrate_schemas && DJANGO_SETTINGS_MODULE=config.settings.production python manage.py deploy_seeds_all_tenants && DJANGO_SETTINGS_MODULE=config.settings.production python manage.py collectstatic --noinput && cd /opt/stratekaz/frontend && npm install && VITE_API_URL=https://app.stratekaz.com/api VITE_BASE_DOMAIN=stratekaz.com npm run build && sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
```

### Con Sentry DSN (rebuild frontend con tracking)
```bash
cd /opt/stratekaz/frontend && VITE_API_URL=https://app.stratekaz.com/api VITE_BASE_DOMAIN=stratekaz.com VITE_SENTRY_DSN=https://44b5a6594d27f6ffb6c90382efda7c49@o4510460014231552.ingest.us.sentry.io/4510930761220096 VITE_SENTRY_ENVIRONMENT=production npm run build
```

### Notas importantes
- `git checkout -- .` es **necesario** porque `npm install` modifica `package-lock.json` en VPS
- SIEMPRE `migrate_schemas` (NO `migrate`) — ejecuta en todos los schemas
- SIEMPRE `deploy_seeds_all_tenants` (NUNCA seeds individuales en VPS)
- Nginx sirve `/opt/stratekaz/frontend/dist/` directamente (NO `/var/www/`)

---

## POST-DEPLOY

### 1. Verificar servicios
```bash
sudo systemctl status stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat --no-pager
# Todos deben mostrar: active (running)
```

### 2. Health checks
```bash
curl -s https://app.stratekaz.com/api/health/ | python3 -m json.tool
# Esperado: {"status": "ok"}

curl -I https://app.stratekaz.com/
# Esperado: 200 OK
```

### 3. Verificar logs (si hay problemas)
```bash
sudo journalctl -u stratekaz-gunicorn -n 50 --no-pager
sudo journalctl -u stratekaz-celery -n 50 --no-pager
```

### 4. Testing manual (browser)
- [ ] Login exitoso en https://app.stratekaz.com
- [ ] Navegación por módulos sin errores
- [ ] Features nuevas funcionando correctamente
- [ ] No errores en consola del browser

---

## ROLLBACK (si falla)

### Opción A: Rollback de código
```bash
cd /opt/stratekaz
git log --oneline -5  # Identificar commit anterior
git reset --hard <commit-anterior>
cd frontend && VITE_API_URL=https://app.stratekaz.com/api VITE_BASE_DOMAIN=stratekaz.com npm run build
sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
```

### Opción B: Restore DB (si migraciones rompieron algo)
```bash
sudo -u postgres psql stratekaz_db < /var/backups/stratekaz/full/backup_YYYYMMDD.sql
```

---

## BACKUP (antes de deploys mayores)

```bash
# Backup DB
sudo -u postgres pg_dump stratekaz_db > /var/backups/stratekaz/full/pre_deploy_$(date +%Y%m%d_%H%M%S).sql

# Backup código
cd /opt && tar -czf stratekaz_backup_$(date +%Y%m%d).tar.gz stratekaz/
```

> **Backup automático**: Cron diario 2AM → `/var/backups/stratekaz/` (retención 30 días)

---

## Referencia rápida — Servicios VPS

| Servicio | Acción | Comando |
|----------|--------|---------|
| Gunicorn | Restart | `sudo systemctl restart stratekaz-gunicorn` |
| Celery | Restart | `sudo systemctl restart stratekaz-celery` |
| Beat | Restart | `sudo systemctl restart stratekaz-celerybeat` |
| Nginx | Reload | `sudo systemctl reload nginx` |
| Todos | Status | `sudo systemctl status stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat` |
| Logs | Ver | `sudo journalctl -u stratekaz-gunicorn -f` |

---

**Path VPS:** `/opt/stratekaz/` | **Python venv:** `source backend/venv/bin/activate`
**SSL expira:** 2026-05-14 (renovación manual wildcard `*.stratekaz.com`)
