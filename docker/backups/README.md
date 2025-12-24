# Sistema de Backup Automático - Base de Datos MySQL

Sistema completo de backup y restauración para la base de datos MySQL del proyecto ERP Grasas y Huesos del Norte.

## Características

- Backup completo de la base de datos MySQL usando mysqldump
- Compresión automática con gzip (nivel máximo)
- Rotación automática de backups (retención: 7 días)
- Logging detallado de todas las operaciones
- Verificación de integridad de archivos comprimidos
- Backup de seguridad automático antes de restaurar
- Manejo robusto de errores
- Soporte para entornos de desarrollo y producción

## Estructura de Directorios

```
docker/backups/
├── README.md                          # Este archivo
├── .gitkeep                           # Mantiene el directorio en git
├── backup_YYYYMMDD_HHMMSS.sql.gz     # Archivos de backup (ignorados por git)
├── pre_restore_YYYYMMDD_HHMMSS.sql.gz # Backups de seguridad pre-restauración
└── logs/                              # Logs de operaciones
    ├── backup_YYYYMMDD_HHMMSS.log
    └── restore_YYYYMMDD_HHMMSS.log
```

## Scripts Disponibles

### 1. Script de Backup (`docker/scripts/backup.sh`)

Crea un backup completo de la base de datos MySQL.

#### Uso

```bash
# Backup en modo desarrollo (default)
./docker/scripts/backup.sh

# Backup en modo producción
./docker/scripts/backup.sh prod
```

#### Proceso de Backup

1. Verifica que el contenedor MySQL está corriendo
2. Verifica el estado de salud del contenedor
3. Ejecuta mysqldump con las siguientes opciones:
   - `--single-transaction`: Backup consistente sin bloquear tablas
   - `--quick`: Optimización para tablas grandes
   - `--lock-tables=false`: No bloquear tablas durante el backup
   - `--routines`: Incluir procedimientos almacenados
   - `--triggers`: Incluir triggers
   - `--events`: Incluir eventos programados
   - `--hex-blob`: Formato hexadecimal para datos binarios
   - `--default-character-set=utf8mb4`: Codificación UTF-8
4. Comprime el dump SQL con gzip (nivel 9)
5. Verifica la integridad del archivo comprimido
6. Establece permisos seguros (600)
7. Limpia backups antiguos (>7 días)
8. Muestra lista de backups disponibles

#### Salida

```
╔════════════════════════════════════════════════════════════╗
║   GRASAS Y HUESOS DEL NORTE - MySQL Backup Automático   ║
╚════════════════════════════════════════════════════════════╝

[INFO] Modo de desarrollo activado
[INFO] Cargando variables de entorno desde: .env
[INFO] ═══════════════════════════════════════════════════════
[INFO] Iniciando proceso de backup
[INFO] ═══════════════════════════════════════════════════════
[INFO] Contenedor: grasas_huesos_db
[INFO] Base de datos: grasas_huesos_db
[INFO] Archivo destino: backup_20231225_143000.sql.gz
[INFO] Verificando estado del contenedor: grasas_huesos_db
[SUCCESS] Contenedor grasas_huesos_db está activo
[INFO] Ejecutando mysqldump...
[SUCCESS] mysqldump ejecutado exitosamente
[INFO] Tamaño del dump SQL: 15M
[INFO] Comprimiendo backup con gzip...
[SUCCESS] Backup comprimido exitosamente
[INFO] Tamaño comprimido: 3.2M
[INFO] Ratio de compresión: 79%
[INFO] Verificando integridad del archivo comprimido...
[SUCCESS] Integridad verificada correctamente
[SUCCESS] ═══════════════════════════════════════════════════════
[SUCCESS] BACKUP COMPLETADO EXITOSAMENTE
[SUCCESS] ═══════════════════════════════════════════════════════
```

#### Archivos Generados

- **Backup**: `docker/backups/backup_YYYYMMDD_HHMMSS.sql.gz`
- **Log**: `docker/backups/logs/backup_YYYYMMDD_HHMMSS.log`

### 2. Script de Restauración (`docker/scripts/restore.sh`)

Restaura la base de datos desde un archivo de backup.

#### Uso

```bash
# Restaurar backup en modo desarrollo
./docker/scripts/restore.sh docker/backups/backup_20231225_143000.sql.gz

# Restaurar backup en modo producción
./docker/scripts/restore.sh docker/backups/backup_20231225_143000.sql.gz prod

# Ver backups disponibles
./docker/scripts/restore.sh
```

#### Proceso de Restauración

1. Valida el archivo de backup especificado
2. Verifica la integridad del archivo comprimido
3. **CREA UN BACKUP DE SEGURIDAD** de la base de datos actual
4. Solicita confirmación del usuario (doble verificación)
5. Descomprime el archivo de backup
6. Restaura la base de datos
7. Limpia archivos temporales
8. Muestra instrucciones de reinicio de servicios

#### Confirmación Interactiva

El script requiere confirmación explícita para evitar restauraciones accidentales:

```
[WARNING] ═══════════════════════════════════════════════════════
[WARNING] ADVERTENCIA: Esta operación SOBRESCRIBIRÁ la base de datos actual
[WARNING] ═══════════════════════════════════════════════════════

[INFO] Base de datos que será sobrescrita: grasas_huesos_db
[INFO] Archivo de backup: docker/backups/backup_20231225_143000.sql.gz

¿Está ABSOLUTAMENTE SEGURO de que desea continuar? Escriba 'yes' para confirmar:
```

#### Backup de Seguridad

Antes de restaurar, el script crea automáticamente un backup de seguridad:

```
[WARNING] Creando backup de seguridad de la base de datos actual...
[SUCCESS] Backup de seguridad creado: pre_restore_20231225_150000.sql.gz
[INFO] Tamaño: 3.1M
[INFO] Puede revertir los cambios usando: ./docker/scripts/restore.sh docker/backups/pre_restore_20231225_150000.sql.gz
```

#### Archivos Generados

- **Backup de seguridad**: `docker/backups/pre_restore_YYYYMMDD_HHMMSS.sql.gz`
- **Log**: `docker/backups/logs/restore_YYYYMMDD_HHMMSS.log`

## Automatización con Cron

### Configuración de Backup Diario

Para ejecutar backups automáticos diarios a las 2:00 AM:

```bash
# Editar crontab
crontab -e

# Agregar línea (backup diario a las 2:00 AM)
0 2 * * * cd /ruta/al/proyecto && ./docker/scripts/backup.sh >> /var/log/mysql-backup.log 2>&1
```

### Configuración de Backup Cada 6 Horas

```bash
# Backup cada 6 horas (00:00, 06:00, 12:00, 18:00)
0 */6 * * * cd /ruta/al/proyecto && ./docker/scripts/backup.sh >> /var/log/mysql-backup.log 2>&1
```

### Configuración de Backup Semanal (Producción)

```bash
# Backup semanal completo (domingos a las 3:00 AM)
0 3 * * 0 cd /ruta/al/proyecto && ./docker/scripts/backup.sh prod >> /var/log/mysql-backup-weekly.log 2>&1
```

### Verificar Cron Jobs

```bash
# Listar cron jobs activos
crontab -l

# Ver logs de cron
tail -f /var/log/cron
```

## Rotación de Backups

El sistema mantiene automáticamente los backups de los últimos 7 días. Los backups más antiguos se eliminan automáticamente durante cada ejecución del script de backup.

### Cambiar Período de Retención

Para cambiar el período de retención, editar la variable en `docker/scripts/backup.sh`:

```bash
# En backup.sh, línea 41
readonly RETENTION_DAYS=7  # Cambiar a 14, 30, etc.
```

O configurar en variables de entorno:

```bash
# En .env o .env.production
BACKUP_RETENTION_DAYS=30
```

## Gestión Manual de Backups

### Listar Todos los Backups

```bash
ls -lh docker/backups/backup_*.sql.gz
```

### Ver Detalles de un Backup

```bash
# Ver tamaño y fecha
ls -lh docker/backups/backup_20231225_143000.sql.gz

# Ver contenido sin descomprimir
zcat docker/backups/backup_20231225_143000.sql.gz | head -n 50
```

### Copiar Backup a Ubicación Segura

```bash
# Copiar a almacenamiento externo
cp docker/backups/backup_20231225_143000.sql.gz /mnt/nas/backups/

# Sincronizar con servidor remoto
rsync -avz docker/backups/ usuario@servidor:/backups/mysql/
```

### Eliminar Backups Antiguos Manualmente

```bash
# Eliminar backups más antiguos de 30 días
find docker/backups/ -name "backup_*.sql.gz" -mtime +30 -delete

# Eliminar backups específicos
rm docker/backups/backup_20231201_*.sql.gz
```

## Recuperación ante Desastres

### Escenario 1: Corrupción de Datos

1. Detener servicios que escriben a la BD:
   ```bash
   docker-compose stop backend celery_worker
   ```

2. Restaurar desde el último backup:
   ```bash
   ./docker/scripts/restore.sh docker/backups/backup_20231225_143000.sql.gz
   ```

3. Reiniciar servicios:
   ```bash
   docker-compose start backend celery_worker
   ```

### Escenario 2: Pérdida Completa del Servidor

1. Configurar nuevo servidor
2. Clonar repositorio
3. Copiar backups desde almacenamiento remoto
4. Restaurar base de datos:
   ```bash
   ./docker/scripts/restore.sh docker/backups/backup_20231225_143000.sql.gz prod
   ```

### Escenario 3: Migración a Nuevo Servidor

1. Crear backup en servidor antiguo:
   ```bash
   ./docker/scripts/backup.sh prod
   ```

2. Transferir backup al nuevo servidor:
   ```bash
   scp docker/backups/backup_*.sql.gz usuario@nuevo-servidor:/ruta/al/proyecto/docker/backups/
   ```

3. Restaurar en nuevo servidor:
   ```bash
   ./docker/scripts/restore.sh docker/backups/backup_*.sql.gz prod
   ```

## Seguridad

### Permisos de Archivos

Los scripts establecen automáticamente permisos seguros:

```bash
# Backups: solo lectura/escritura para el propietario
chmod 600 docker/backups/*.sql.gz

# Scripts: ejecutables solo para el propietario
chmod 700 docker/scripts/backup.sh
chmod 700 docker/scripts/restore.sh
```

### Protección de Credenciales

- Las credenciales se cargan desde archivos `.env` o `.env.production`
- NUNCA incluir credenciales directamente en los scripts
- Los archivos `.env` deben estar en `.gitignore`
- Los logs NO incluyen contraseñas

### Cifrado de Backups (Opcional)

Para backups especialmente sensibles, puede cifrarlos con GPG:

```bash
# Cifrar backup
gpg --symmetric --cipher-algo AES256 docker/backups/backup_20231225_143000.sql.gz

# Descifrar para restaurar
gpg --decrypt docker/backups/backup_20231225_143000.sql.gz.gpg > backup_temp.sql.gz
./docker/scripts/restore.sh backup_temp.sql.gz
rm backup_temp.sql.gz
```

## Monitoreo y Alertas

### Verificar Último Backup

```bash
# Ver último backup creado
ls -lt docker/backups/backup_*.sql.gz | head -1

# Verificar que hay backups recientes (últimas 24 horas)
find docker/backups/ -name "backup_*.sql.gz" -mtime -1
```

### Script de Monitoreo

```bash
#!/bin/bash
# Verificar que existe un backup de las últimas 24 horas

BACKUP_COUNT=$(find docker/backups/ -name "backup_*.sql.gz" -mtime -1 | wc -l)

if [ $BACKUP_COUNT -eq 0 ]; then
    echo "ALERTA: No hay backups recientes"
    # Enviar notificación (email, Slack, etc.)
    exit 1
else
    echo "OK: Encontrados $BACKUP_COUNT backups recientes"
    exit 0
fi
```

### Integración con Healthchecks.io

```bash
# En crontab, agregar curl a healthchecks.io después del backup
0 2 * * * cd /ruta/al/proyecto && ./docker/scripts/backup.sh && curl -fsS -m 10 --retry 5 https://hc-ping.com/your-uuid-here
```

## Logs

### Ubicación de Logs

- **Backups**: `docker/backups/logs/backup_YYYYMMDD_HHMMSS.log`
- **Restauraciones**: `docker/backups/logs/restore_YYYYMMDD_HHMMSS.log`

### Ver Logs Recientes

```bash
# Ver último log de backup
cat docker/backups/logs/backup_$(ls -t docker/backups/logs/backup_*.log | head -1 | xargs basename)

# Ver todos los logs de hoy
find docker/backups/logs/ -name "*.log" -mtime -1 -exec tail -f {} +
```

### Rotación de Logs

Los logs se limpian automáticamente junto con los backups (después de 7 días).

## Troubleshooting

### Error: Contenedor no está corriendo

```
[ERROR] El contenedor grasas_huesos_db no está corriendo
```

**Solución**: Iniciar los servicios de Docker
```bash
docker-compose up -d
```

### Error: Archivo comprimido corrupto

```
[ERROR] El archivo comprimido está corrupto o dañado
```

**Solución**: Usar un backup anterior
```bash
# Listar backups disponibles
ls -lt docker/backups/backup_*.sql.gz

# Restaurar desde backup anterior
./docker/scripts/restore.sh docker/backups/backup_FECHA_ANTERIOR.sql.gz
```

### Error: No hay espacio en disco

```
gzip: write error: No space left on device
```

**Solución**: Limpiar espacio en disco
```bash
# Ver espacio disponible
df -h

# Limpiar backups antiguos manualmente
find docker/backups/ -name "backup_*.sql.gz" -mtime +7 -delete

# Limpiar imágenes Docker no usadas
docker system prune -a
```

### Error: Permisos denegados

```
bash: ./docker/scripts/backup.sh: Permission denied
```

**Solución**: Dar permisos de ejecución
```bash
chmod +x docker/scripts/backup.sh
chmod +x docker/scripts/restore.sh
```

## Variables de Entorno

Las siguientes variables se pueden configurar en `.env` o `.env.production`:

```bash
# Base de datos
MYSQL_DATABASE=grasas_huesos_db
MYSQL_ROOT_PASSWORD=password_seguro

# Configuración de backup
BACKUP_RETENTION_DAYS=7
BACKUP_PATH=/backups
```

## Mejores Prácticas

1. **Backup Regular**: Configurar backups automáticos con cron
2. **Múltiples Copias**: Mantener backups en diferentes ubicaciones (local + remoto)
3. **Pruebas de Restauración**: Probar restauraciones periódicamente
4. **Monitoreo**: Implementar alertas para backups fallidos
5. **Documentación**: Mantener documentado el proceso de recuperación
6. **Seguridad**: Cifrar backups que contienen datos sensibles
7. **Retención**: Ajustar período de retención según necesidades de negocio

## Soporte

Para reportar problemas o sugerencias:
- Revisar los logs en `docker/backups/logs/`
- Contactar al equipo de DevOps
- Crear un issue en el repositorio del proyecto

---

**Última actualización**: 2024-12-23
**Versión**: 1.0
**Autor**: DevOps Team - Grasas y Huesos del Norte S.A.S
