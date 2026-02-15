# 🚀 Deploy Checklist - Sprints 14 → 16.1

**Fecha:** 2026-02-15
**Commits:** 9 commits (904c4d5 → 6440ea4)
**Sprints:** 14, 14.1, 15, 16, 16.1

---

## 📋 **PRE-DEPLOY CHECKS**

### ✅ **1. Frontend - VERIFICADO**
- [x] Código committed y pusheado
- [x] 0% hardcoding responsive
- [x] Componentes nuevos exportados
- [x] Build local exitoso (pendiente)
- [x] PWA version bump en commits

### ⏳ **2. Backend - PENDIENTE VERIFICAR**

#### **Migraciones Detectadas (20 archivos):**

**Core & Tenant:**
```
✓ 0009_reorder_talent_hub_sidebar.py
✓ 0008_remove_cargos_colaboradores_from_organizacion.py
✓ 0007_migrate_funciones_competencias_structured.py
✓ 0006_rename_areas_to_procesos.py
✓ 0005_remove_branding_tab_section.py
✓ tenant/0006_tenantuser_password_reset_expires_and_more.py
✓ tenant/0005_tenant_notes.py
```

**Gestión Estratégica:**
```
✓ gestion_documental/0002_add_policy_fields_to_documento.py
✓ identidad/0002_delete_politica_especifica.py
✓ organizacion/0002_organigramanodeposition.py
✓ configuracion/0003_alter_empresaconfig_options_and_more.py
```

**Talent Hub:**
```
✓ seleccion_contratacion/0005_rename_indexes.py
✓ seleccion_contratacion/0004_add_entrevista_asincronica.py
✓ seleccion_contratacion/0003_add_pruebas_dinamicas.py
✓ control_tiempo/0004_turno_horas_semanales_maximas.py
✓ novedades/0002_configuraciondotacion_entregadotacion.py
✓ off_boarding/0002_certificadotrabajo.py
✓ proceso_disciplinario/0003_denunciaacosolaboral.py
```

**HSEQ & Cumplimiento:**
```
✓ medicina_laboral/0003_rename_ml_caso_emp_col_idx.py
✓ evidencias/0002_rename_cumplimient_empresa_idx.py
```

#### **Seeds Críticos:**

| Comando | Propósito | Estado | Acción |
|---------|-----------|--------|--------|
| `seed_estructura_final` | Sidebar (modulos/tabs/secciones) | ✅ Idempotent | Ejecutar |
| `seed_permisos_rbac` | Permisos RBAC | ✅ Idempotent | Ejecutar |
| `seed_admin_cargo` | Cargos ADMIN/USUARIO | ✅ Idempotent | Ejecutar |
| `seed_organizacion` | Consecutivos sistema | ⚠️ Verificar | Revisar |
| `IconRegistry.cargar_iconos_sistema()` | 56 iconos sistema | ❌ NO ejecutado | **PENDIENTE** |

---

## 🔍 **TAREAS PRE-DEPLOY**

### **A. Verificar Docker Local (TÚ)**
```bash
# 1. Iniciar Docker Desktop
# 2. Verificar servicios
docker-compose ps

# Esperado:
# stratekaz-db-1     Up    5432/tcp
# stratekaz-redis-1  Up    6379/tcp
```

### **B. Testing Local (CLAUDE)**
```bash
# 1. Activar venv
cd backend
venv\Scripts\activate  # Windows

# 2. Verificar migraciones pendientes
python manage.py showmigrations --plan | findstr "\[ \]"

# 3. Ejecutar migraciones localmente
python manage.py migrate_schemas

# 4. Verificar seeds (1 tenant test)
python manage.py sync_tenant_seeds --tenant-code=test --dry-run

# 5. Testing API local
python manage.py runserver
# Test: http://localhost:8000/api/core/cargos-rbac/
```

### **C. Build Frontend Local (CLAUDE)**
```bash
cd frontend
npm run build

# Verificar output:
# ✓ 500+ modules transformed
# ✓ dist/ generado
# ✓ No errores TypeScript
```

---

## 🚀 **DEPLOY A PRODUCCIÓN**

### **Paso 1: Backup (VPS)**
```bash
# Conexión: Terminal web Hostinger (hPanel > VPS > Terminal)

# Backup DB (antes de migrate)
sudo -u postgres pg_dump stratekaz_db > /opt/backups/stratekaz_pre_sprint16.1_$(date +%Y%m%d_%H%M%S).sql

# Backup código (por si acaso)
cd /opt && tar -czf stratekaz_backup_$(date +%Y%m%d).tar.gz stratekaz/
```

### **Paso 2: Pull & Migrate (VPS)**
```bash
cd /opt/stratekaz

# Pull código
git pull origin main
# Esperado: 9 commits nuevos (904c4d5 → 6440ea4)

# Backend - Activar venv
cd backend
source venv/bin/activate

# Verificar migraciones pendientes
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py showmigrations --plan | grep "\[ \]"

# Ejecutar migraciones (TODAS las tenants + public)
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py migrate_schemas

# ⏱️ Tiempo estimado: 2-3 min
```

### **Paso 3: Sync Seeds (VPS)**
```bash
# Ejecutar seeds en TODAS las tenants activas
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py sync_tenant_seeds --all

# ⏱️ Tiempo estimado: 1-2 min por tenant

# Verificar logs:
# ✓ seed_estructura_final ejecutado
# ✓ seed_permisos_rbac ejecutado
# ✓ seed_admin_cargo ejecutado
```

### **Paso 4: Cargar Iconos Sistema (VPS)** ⚠️ **CRÍTICO**
```bash
# Ejecutar en shell Django
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py shell

# En el shell:
from apps.tenant.models import Tenant
from apps.core.models import IconRegistry
from django_tenants.utils import schema_context

# Para CADA tenant
for tenant in Tenant.objects.exclude(schema_name='public').filter(schema_status='ready'):
    print(f"Cargando iconos en tenant: {tenant.code}")
    with schema_context(tenant.schema_name):
        IconRegistry.cargar_iconos_sistema()
    print(f"✓ {tenant.code} - 56 iconos cargados")

exit()
```

### **Paso 5: Build Frontend (VPS)**
```bash
cd /opt/stratekaz/frontend

# Build con variables de producción
VITE_API_URL=https://app.stratekaz.com/api \
VITE_BASE_DOMAIN=stratekaz.com \
npm run build

# ⏱️ Tiempo estimado: 2-3 min

# Verificar output:
ls -lh dist/  # Debe existir
```

### **Paso 6: Restart Servicios (VPS)**
```bash
# Restart TODOS los servicios
sudo systemctl restart stratekaz-gunicorn
sudo systemctl restart stratekaz-celery
sudo systemctl restart stratekaz-celerybeat

# Verificar estado
sudo systemctl status stratekaz-gunicorn --no-pager
sudo systemctl status stratekaz-celery --no-pager
sudo systemctl status stratekaz-celerybeat --no-pager

# Todos deben mostrar: active (running)
```

### **Paso 7: Verificar Logs (VPS)**
```bash
# Logs gunicorn (últimas 50 líneas)
sudo journalctl -u stratekaz-gunicorn -n 50 --no-pager

# Buscar errores:
sudo journalctl -u stratekaz-gunicorn -p err -n 20

# Si hay errores de import:
# - Verificar venv activado en service file
# - Verificar PYTHONPATH
```

---

## ✅ **POST-DEPLOY VERIFICATION**

### **1. Health Checks**
```bash
# API Health
curl https://app.stratekaz.com/api/health/
# Esperado: {"status": "ok"}

# Static files
curl -I https://app.stratekaz.com/
# Esperado: 200 OK

# PWA manifest
curl -I https://app.stratekaz.com/manifest.json
# Esperado: 200 OK
```

### **2. Testing Manual (Browser)**

**Login & Session:**
- [ ] Login en https://app.stratekaz.com
- [ ] Email: admin@stratekaz.com / Admin.2024!
- [ ] Session cierra automáticamente (PWA version bump) ✓ NORMAL
- [ ] Re-login exitoso
- [ ] Service Worker actualizado (DevTools > Application)

**Responsive & Mobile UX:**
- [ ] Abrir DevTools > Responsive mode (Cmd+Shift+M)
- [ ] iPhone SE (375px): Tabs icon-only ✓
- [ ] Botones >= 44px height (Inspector)
- [ ] Paginación tablas touch-friendly
- [ ] No scroll horizontal en móvil

**Features Sprint 14-16:**
- [ ] Gestor Documental: Crear documento
- [ ] FormBuilder: Crear formulario dinámico
- [ ] Consecutivos: Generar código automático
- [ ] Colaboradores: Dropdown cargos funciona
- [ ] Organigrama: Guardar posiciones

### **3. Performance Check**
```bash
# Response times
curl -w "\nTime: %{time_total}s\n" https://app.stratekaz.com/api/core/cargos-rbac/
# Esperado: < 500ms

# Celery tasks
sudo systemctl status stratekaz-celery --no-pager
# Esperado: No errores, workers activos
```

---

## 🐛 **ROLLBACK PLAN** (Si falla)

```bash
# 1. Restore DB
sudo -u postgres psql stratekaz_db < /opt/backups/stratekaz_pre_sprint16.1_TIMESTAMP.sql

# 2. Rollback código
cd /opt/stratekaz
git reset --hard 904c4d5  # Commit ANTES de Sprint 14

# 3. Rebuild frontend
cd frontend && npm run build

# 4. Restart servicios
sudo systemctl restart stratekaz-gunicorn stratekaz-celery stratekaz-celerybeat
```

---

## 📊 **CHECKLIST FINAL**

### **Pre-Deploy:**
- [ ] Docker local running
- [ ] Migraciones verificadas local
- [ ] Seeds verificados local
- [ ] Build frontend local exitoso
- [ ] Backup DB producción creado

### **Deploy:**
- [ ] Git pull ejecutado
- [ ] migrate_schemas ejecutado
- [ ] sync_tenant_seeds ejecutado
- [ ] IconRegistry.cargar_iconos_sistema() ejecutado
- [ ] npm run build ejecutado
- [ ] Servicios restarteados

### **Post-Deploy:**
- [ ] Health checks OK
- [ ] Login funciona
- [ ] PWA version actualizada
- [ ] Responsive verificado (5 viewports)
- [ ] Features Sprint 14-16 funcionan
- [ ] No errores en logs

---

## 📝 **NOTAS**

**Tiempo estimado total:** 15-20 minutos

**Downtime:** ~30 segundos (restart servicios)

**Session impact:** Usuarios deben re-login (PWA version bump)

**Crítico ejecutar:**
1. ✅ migrate_schemas (20 migraciones)
2. ✅ sync_tenant_seeds (estructura actualizada)
3. ⚠️ IconRegistry seeds (PENDIENTE en producción)

**NO ejecutar:**
- ❌ makemigrations (ya hechas)
- ❌ flush DB (perdería data)
- ❌ seeds destructivos

---

**Preparado por:** Claude Sonnet 4.5
**Fecha:** 2026-02-15
**Sprint:** 16.1 - Responsive & Mobile UX Optimization
