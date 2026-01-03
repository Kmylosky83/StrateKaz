# Guía de Gestión Multi-Empresa en cPanel

## SGI - Sistema de Gestión Integral

**Versión:** 1.0
**Fecha:** 2025-12-30
**Modelo:** Unitenant - Hasta 10 Empresas

---

## 1. Panel de Control de Empresas

### 1.1 Estado Actual de Empresas

| # | Identificador | Empresa | Subdominio | Estado | RAM Est. |
|---|---------------|---------|------------|--------|----------|
| 1 | `grasas` | StrateKaz | grasas.stratekaz.com | Producción | ~500 MB |
| 2 | `demo` | Demo Comercial | demo.stratekaz.com | Activo | ~300 MB |
| 3 | `staging` | Ambiente QA | staging.stratekaz.com | Activo | ~300 MB |
| 4 | - | (Disponible) | - | - | - |
| 5 | - | (Disponible) | - | - | - |
| 6 | - | (Disponible) | - | - | - |
| 7 | - | (Disponible) | - | - | - |
| 8 | - | (Disponible) | - | - | - |
| 9 | - | (Disponible) | - | - | - |
| 10 | - | (Disponible) | - | - | - |

**Recursos del Servidor:**

- RAM Total: 6 GB
- RAM Usada: ~1.1 GB (3 empresas activas)
- RAM Disponible: ~4.9 GB
- Capacidad Restante: ~7 empresas más

### 1.2 Acceso Rápido

```bash
# SSH al servidor
ssh strat@stratekaz.com

# Listar todas las empresas
ls -la ~/*.stratekaz.com/

# Ver uso de recursos
~/shared/scripts/check_resources.sh

# Health check de todas
~/shared/scripts/health_check.sh
```

---

## 2. Operaciones Comunes

### 2.1 Agregar Nueva Empresa

**Tiempo estimado:** 30-45 minutos

**Requisitos:**

- Identificador único (max 8 caracteres)
- Información de la empresa (nombre, NIT, logo)
- Email del administrador

**Proceso:**

```bash
# 1. En cPanel crear:
#    - Subdominio: {id}.stratekaz.com
#    - Base de datos: {id}_sgi
#    - Usuario MySQL: {id}_usr
#    - Cuenta email: noreply@{id}.stratekaz.com
#    - Python App

# 2. En servidor SSH:
cd ~/{id}.stratekaz.com
git clone https://github.com/Kmylosky83/Grasas-Huesos-SGI.git .
cp deploy/cpanel/.env.staging backend/.env
nano backend/.env  # Configurar valores

# 3. Instalar y migrar:
source ~/virtualenv/{id}.stratekaz.com/3.9/bin/activate
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createcachetable
python manage.py collectstatic --noinput
python manage.py createsuperuser

# 4. Verificar:
curl -I https://{id}.stratekaz.com/api/health/
```

Ver guía completa: [DEPLOY-CPANEL.md](../../deploy/cpanel/DEPLOY-CPANEL.md)

### 2.2 Eliminar/Desactivar Empresa

**Antes de eliminar:**

1. Notificar al cliente con anticipación
2. Crear backup final de la base de datos
3. Exportar datos si el cliente lo requiere

**Proceso de desactivación (mantiene datos):**

```bash
# Renombrar directorio para desactivar
mv ~/{id}.stratekaz.com ~/{id}.stratekaz.com.DISABLED

# En cPanel:
# - Setup Python App > Eliminar aplicación
# - Subdomains > Eliminar subdominio (NO elimina archivos)
```

**Proceso de eliminación completa:**

```bash
# 1. Backup final
mysqldump strat_{id}_sgi | gzip > ~/shared/backups/final_{id}_$(date +%Y%m%d).sql.gz

# 2. Eliminar en cPanel:
#    - Setup Python App > Eliminar
#    - MySQL Databases > Eliminar DB y usuario
#    - Subdomains > Eliminar
#    - Email Accounts > Eliminar

# 3. Eliminar archivos
rm -rf ~/{id}.stratekaz.com
```

### 2.3 Actualizar Todas las Empresas

**Para actualizaciones de código base:**

```bash
# Ejecutar script de sincronización
~/shared/scripts/sync_all_empresas.sh
```

**Contenido del script:**

```bash
#!/bin/bash
# ~/shared/scripts/sync_all_empresas.sh

EMPRESAS=("grasas" "demo" "staging")  # Agregar nuevas aquí

for EMPRESA in "${EMPRESAS[@]}"; do
    echo "=== Actualizando: $EMPRESA ==="

    cd ~/$EMPRESA.stratekaz.com

    # Backup .env
    cp backend/.env backend/.env.backup

    # Pull código
    git fetch origin main
    git reset --hard origin/main

    # Restaurar .env
    mv backend/.env.backup backend/.env

    # Dependencias y migraciones
    source ~/virtualenv/$EMPRESA.stratekaz.com/3.9/bin/activate
    pip install -r backend/requirements.txt -q
    cd backend
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput

    # Reiniciar
    touch ../tmp/restart.txt

    echo "✓ $EMPRESA actualizado"
done
```

### 2.4 Actualizar Solo Una Empresa

```bash
# Conectar
ssh strat@stratekaz.com

# Actualizar empresa específica
EMPRESA="grasas"
cd ~/$EMPRESA.stratekaz.com

# Backup .env
cp backend/.env backend/.env.backup

# Pull
git fetch origin main
git reset --hard origin/main

# Restaurar .env
mv backend/.env.backup backend/.env

# Dependencias y migraciones
source ~/virtualenv/$EMPRESA.stratekaz.com/3.9/bin/activate
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Reiniciar
touch ../tmp/restart.txt

# Verificar
curl -I https://$EMPRESA.stratekaz.com/api/health/
```

---

## 3. Monitoreo y Salud

### 3.1 Script de Health Check

```bash
#!/bin/bash
# ~/shared/scripts/health_check.sh

EMPRESAS=("grasas" "demo" "staging")
ALERT_EMAIL="devops@stratekaz.com"

echo "=== SGI Health Check ==="
echo "Fecha: $(date)"
echo ""

ERRORS=""

for EMPRESA in "${EMPRESAS[@]}"; do
    URL="https://$EMPRESA.stratekaz.com/api/health/"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --max-time 10)

    if [ "$STATUS" == "200" ]; then
        echo "✓ $EMPRESA: OK"
    else
        echo "✗ $EMPRESA: ERROR (HTTP $STATUS)"
        ERRORS="$ERRORS\n- $EMPRESA: HTTP $STATUS"
    fi
done

# Enviar alerta si hay errores
if [ -n "$ERRORS" ]; then
    echo -e "ALERTA SGI\n\nProblemas detectados:$ERRORS\n\nFecha: $(date)" | \
    mail -s "[ALERTA] SGI Health Check Failed" "$ALERT_EMAIL"
fi
```

### 3.2 Script de Recursos

```bash
#!/bin/bash
# ~/shared/scripts/check_resources.sh

echo "=========================================="
echo "       RECURSOS DEL SERVIDOR SGI"
echo "=========================================="
echo ""

# Memoria
echo "--- MEMORIA RAM ---"
free -h
echo ""

# Disco
echo "--- ESPACIO EN DISCO ---"
df -h ~ | head -2
echo ""

# Procesos Python
echo "--- PROCESOS PYTHON ---"
PYTHON_PROCS=$(ps aux | grep python | grep -v grep | wc -l)
echo "Procesos Python activos: $PYTHON_PROCS"
echo ""

# Tamaño por empresa
echo "--- TAMAÑO POR EMPRESA ---"
for dir in ~/*.stratekaz.com; do
    if [ -d "$dir" ]; then
        SIZE=$(du -sh "$dir" 2>/dev/null | cut -f1)
        NAME=$(basename "$dir")
        echo "$NAME: $SIZE"
    fi
done
echo ""

# Bases de datos
echo "--- TAMAÑO DE BASES DE DATOS ---"
mysql -e "
SELECT
    table_schema AS 'Base de Datos',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Tamaño (MB)'
FROM information_schema.tables
WHERE table_schema LIKE 'strat_%'
GROUP BY table_schema
ORDER BY SUM(data_length + index_length) DESC;
" 2>/dev/null || echo "(Requiere acceso MySQL)"

echo ""
echo "=========================================="
```

### 3.3 Configurar Cron Jobs de Monitoreo

En **cPanel > Cron Jobs**, agregar:

| Frecuencia | Comando | Descripción |
|------------|---------|-------------|
| `*/15 * * * *` | `~/shared/scripts/health_check.sh >> ~/logs/health.log 2>&1` | Health check cada 15 min |
| `0 8 * * *` | `~/shared/scripts/check_resources.sh \| mail -s "SGI Daily Report" devops@stratekaz.com` | Reporte diario |
| `0 3 * * *` | `~/shared/scripts/backup_all_dbs.sh >> ~/logs/backup.log 2>&1` | Backup diario |

---

## 4. Backups

### 4.1 Backup Automático (Jetbackups)

cPanel incluye Jetbackups con:

- Frecuencia: Diaria
- Retención: 7 días
- Incluye: Archivos + Bases de datos

**Restaurar desde Jetbackups:**

1. cPanel > Jetbackups
2. Seleccionar fecha
3. Elegir empresa/DB específica
4. Click Restore

### 4.2 Backup Manual - Todas las DBs

```bash
#!/bin/bash
# ~/shared/scripts/backup_all_dbs.sh

BACKUP_DIR="/home/strat/shared/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

DATABASES=(
    "strat_grasas_sgi"
    "strat_demo_sgi"
    "strat_staging_sgi"
    # Agregar nuevas empresas aquí
)

mkdir -p "$BACKUP_DIR/$DATE"

echo "=== Backup de Bases de Datos ==="
echo "Fecha: $DATE"

for DB in "${DATABASES[@]}"; do
    echo -n "Respaldando $DB... "
    mysqldump "$DB" 2>/dev/null | gzip > "$BACKUP_DIR/$DATE/$DB.sql.gz"

    if [ $? -eq 0 ]; then
        SIZE=$(du -h "$BACKUP_DIR/$DATE/$DB.sql.gz" | cut -f1)
        echo "OK ($SIZE)"
    else
        echo "ERROR"
    fi
done

# Limpiar backups antiguos
echo ""
echo "Limpiando backups > $RETENTION_DAYS días..."
find "$BACKUP_DIR" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null

echo ""
echo "=== Backup Completo ==="
ls -lh "$BACKUP_DIR/$DATE/"
```

### 4.3 Backup Manual - Una Empresa

```bash
# Uso: ~/shared/scripts/backup_single_db.sh {identificador}

EMPRESA=$1
DATE=$(date +%Y%m%d_%H%M%S)

if [ -z "$EMPRESA" ]; then
    echo "Uso: $0 {identificador}"
    echo "Ejemplo: $0 grasas"
    exit 1
fi

DB_NAME="strat_${EMPRESA}_sgi"
BACKUP_FILE="/home/strat/shared/backups/${DATE}_${DB_NAME}.sql.gz"

echo "Respaldando: $DB_NAME"
mysqldump "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Backup: $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
else
    echo "✗ Error en backup"
fi
```

### 4.4 Restaurar Backup

```bash
# Restaurar desde archivo comprimido
BACKUP_FILE="/home/strat/shared/backups/20251230_030000/strat_grasas_sgi.sql.gz"
DB_NAME="strat_grasas_sgi"

# Verificar backup
zcat "$BACKUP_FILE" | head -20

# Restaurar (SOBRESCRIBE datos actuales)
gunzip -c "$BACKUP_FILE" | mysql "$DB_NAME"

# Verificar
mysql "$DB_NAME" -e "SELECT COUNT(*) FROM auth_user;"
```

---

## 5. Troubleshooting Multi-Empresa

### 5.1 Empresa No Responde (503/502)

```bash
EMPRESA="grasas"

# 1. Verificar logs
tail -50 ~/logs/$EMPRESA.stratekaz.com-error.log

# 2. Verificar proceso Passenger
ps aux | grep -i "$EMPRESA"

# 3. Reiniciar aplicación
touch ~/$EMPRESA.stratekaz.com/tmp/restart.txt

# 4. Si persiste, verificar .env
cat ~/$EMPRESA.stratekaz.com/backend/.env | grep -E "^(DB_|SECRET)"

# 5. Verificar conexión a DB
source ~/virtualenv/$EMPRESA.stratekaz.com/3.9/bin/activate
cd ~/$EMPRESA.stratekaz.com/backend
python manage.py check
```

### 5.2 Base de Datos Llena

```bash
# Ver tamaño de todas las DBs
mysql -e "
SELECT
    table_schema,
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema LIKE 'strat_%'
GROUP BY table_schema
ORDER BY size_mb DESC;
"

# Ver tablas más grandes de una DB
mysql strat_grasas_sgi -e "
SELECT
    table_name,
    ROUND((data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'strat_grasas_sgi'
ORDER BY size_mb DESC
LIMIT 10;
"

# Limpiar sesiones expiradas
source ~/virtualenv/grasas.stratekaz.com/3.9/bin/activate
cd ~/grasas.stratekaz.com/backend
python manage.py clearsessions

# Limpiar cache
python manage.py shell -c "from django.core.cache import cache; cache.clear()"
```

### 5.3 Conflicto de Código Entre Empresas

Si una empresa tiene código modificado que no debe propagarse:

```bash
EMPRESA="cliente_especial"

# Ver diferencias con main
cd ~/$EMPRESA.stratekaz.com
git status
git diff

# Guardar cambios locales
git stash

# Actualizar
git pull origin main

# Restaurar cambios locales (si es necesario)
git stash pop

# O descartar cambios locales y usar main
git reset --hard origin/main
```

### 5.4 SSL Expirado

```bash
# Verificar estado SSL
curl -vI https://grasas.stratekaz.com 2>&1 | grep -E "SSL|expire"

# Renovar en cPanel:
# 1. cPanel > SSL/TLS Status
# 2. Seleccionar dominio
# 3. Click "Run AutoSSL"
```

---

## 6. Procedimientos de Emergencia

### 6.1 Empresa Comprometida (Seguridad)

```bash
EMPRESA="comprometida"

# 1. INMEDIATO: Desactivar acceso
cd ~/$EMPRESA.stratekaz.com
mv backend/.env backend/.env.DISABLED
touch tmp/restart.txt

# 2. Revisar logs de acceso
grep "POST.*login" ~/logs/$EMPRESA.stratekaz.com-access.log | tail -100

# 3. Cambiar todas las credenciales:
#    - Password de DB (cPanel > MySQL)
#    - SECRET_KEY en .env
#    - Passwords de usuarios admin (Django shell)

# 4. Restaurar desde backup limpio si es necesario
# 5. Reactivar con nuevas credenciales
```

### 6.2 Servidor Sin Espacio

```bash
# Identificar uso
du -sh ~/*

# Limpiar logs antiguos
find ~/logs -name "*.log" -mtime +30 -delete

# Limpiar backups antiguos
find ~/shared/backups -mtime +30 -delete

# Limpiar cache de pip
pip cache purge

# Limpiar archivos temporales
find ~/*/tmp -type f -mtime +7 -delete
```

### 6.3 Rollback de Emergencia

```bash
EMPRESA="grasas"
COMMIT="abc123"  # Commit anterior estable

cd ~/$EMPRESA.stratekaz.com

# Volver a commit anterior
git checkout $COMMIT

# Reinstalar dependencias de esa versión
source ~/virtualenv/$EMPRESA.stratekaz.com/3.9/bin/activate
pip install -r backend/requirements.txt

# Reiniciar
touch tmp/restart.txt

# Si hay que revertir migraciones:
cd backend
python manage.py showmigrations
python manage.py migrate {app_name} {migration_anterior}
```

---

## 7. Registro de Empresas

### 7.1 Template de Registro

Al agregar una nueva empresa, documentar:

```markdown
## Empresa: {Nombre}

**Fecha de Alta:** YYYY-MM-DD
**Identificador:** {id}
**Subdominio:** {id}.stratekaz.com

### Datos de la Empresa

- **Razón Social:**
- **NIT:**
- **Contacto Principal:**
- **Email Contacto:**
- **Teléfono:**

### Credenciales (almacenar en gestor seguro)

- **DB Name:** strat_{id}_sgi
- **DB User:** strat_{id}_usr
- **DB Password:** (en gestor de passwords)
- **SECRET_KEY:** (en gestor de passwords)
- **Email:** noreply@{id}.stratekaz.com

### Módulos Activados

- [ ] Gestión Estratégica
- [ ] Motor de Cumplimiento
- [ ] Motor de Riesgos
- [ ] HSEQ
- [ ] Supply Chain
- [ ] Production Ops
- [ ] Logistics Fleet
- [ ] Sales CRM
- [ ] Talent Hub
- [ ] Admin Finance
- [ ] Accounting
- [ ] Analytics

### Configuración Especial

(Documentar cualquier personalización)

### Historial

| Fecha | Acción | Responsable |
|-------|--------|-------------|
| YYYY-MM-DD | Alta inicial | |
```

---

## 8. Matriz de Responsabilidades

| Tarea | Frecuencia | Responsable | Backup |
|-------|------------|-------------|--------|
| Health checks | Automático (15 min) | Cron Job | - |
| Backups DB | Diario (3am) | Cron Job | Jetbackups |
| Actualizaciones de código | Por release | DevOps | - |
| Monitoreo de recursos | Diario | DevOps | Reporte automático |
| Renovación SSL | Automático | AutoSSL | DevOps |
| Onboarding nuevos clientes | Por demanda | DevOps | - |
| Soporte Nivel 1 | Continuo | Soporte | DevOps |
| Incidentes críticos | On-call | DevOps | CTO |

---

## Referencias

- [ESTRATEGIA-CPANEL-CORPORATIVO.md](./ESTRATEGIA-CPANEL-CORPORATIVO.md)
- [ARQUITECTURA-UNITENANT.md](./ARQUITECTURA-UNITENANT.md)
- [DEPLOY-CPANEL.md](../../deploy/cpanel/DEPLOY-CPANEL.md)

---

*Última actualización: 2025-12-30*
