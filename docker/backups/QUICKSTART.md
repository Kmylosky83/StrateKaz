# Guía Rápida - Backup y Restauración MySQL

## Comandos Esenciales

### Crear Backup

```bash
# Desarrollo
./docker/scripts/backup.sh

# Producción
./docker/scripts/backup.sh prod
```

### Restaurar Backup

```bash
# Listar backups disponibles
ls -lth docker/backups/backup_*.sql.gz

# Restaurar backup específico
./docker/scripts/restore.sh docker/backups/backup_20231225_143000.sql.gz

# Restaurar en producción
./docker/scripts/restore.sh docker/backups/backup_20231225_143000.sql.gz prod
```

### Configurar Backups Automáticos

```bash
# Configuración interactiva
./docker/scripts/setup-cron.sh
```

## Ubicaciones Importantes

```
docker/backups/
├── backup_YYYYMMDD_HHMMSS.sql.gz    # Backups normales
├── pre_restore_YYYYMMDD_HHMMSS.sql.gz  # Backups de seguridad
└── logs/
    ├── backup_YYYYMMDD_HHMMSS.log    # Logs de backup
    └── restore_YYYYMMDD_HHMMSS.log   # Logs de restore
```

## Casos de Uso Comunes

### 1. Backup Antes de Actualización

```bash
# 1. Crear backup
./docker/scripts/backup.sh prod

# 2. Actualizar código/database
git pull
docker-compose exec backend python manage.py migrate

# 3. Verificar que todo funciona
```

### 2. Clonar Base de Datos de Producción a Desarrollo

```bash
# En servidor de producción
./docker/scripts/backup.sh prod

# Copiar backup a servidor de desarrollo
scp docker/backups/backup_*.sql.gz dev-server:/proyecto/docker/backups/

# En servidor de desarrollo
./docker/scripts/restore.sh docker/backups/backup_YYYYMMDD_HHMMSS.sql.gz dev
```

### 3. Recuperación ante Desastre

```bash
# 1. Detener servicios
docker-compose stop backend celery_worker

# 2. Restaurar último backup
./docker/scripts/restore.sh docker/backups/backup_LATEST.sql.gz

# 3. Reiniciar servicios
docker-compose start backend celery_worker
```

### 4. Backup Manual Antes de Operación Peligrosa

```bash
# Crear backup con nombre descriptivo
./docker/scripts/backup.sh
# Nota: El script automáticamente agrega timestamp

# Opcional: renombrar para identificar fácilmente
mv docker/backups/backup_20231225_143000.sql.gz \
   docker/backups/before_migration_v2.sql.gz
```

## Cron Jobs Comunes

### Backup Diario (2:00 AM)

```cron
0 2 * * * cd /ruta/proyecto && ./docker/scripts/backup.sh prod >> /var/log/mysql-backup.log 2>&1
```

### Backup Cada 6 Horas

```cron
0 */6 * * * cd /ruta/proyecto && ./docker/scripts/backup.sh >> /var/log/mysql-backup.log 2>&1
```

### Backup Semanal Completo

```cron
0 3 * * 0 cd /ruta/proyecto && ./docker/scripts/backup.sh prod >> /var/log/mysql-backup-weekly.log 2>&1
```

## Monitoreo

### Ver Últimos Backups

```bash
ls -lth docker/backups/backup_*.sql.gz | head -5
```

### Ver Logs de Último Backup

```bash
tail -f docker/backups/logs/backup_$(ls -t docker/backups/logs/backup_*.log | head -1 | xargs basename)
```

### Verificar Espacio en Disco

```bash
df -h docker/backups/
du -sh docker/backups/
```

## Troubleshooting Rápido

### Error: Contenedor no está corriendo

```bash
docker-compose up -d
```

### Error: Sin espacio en disco

```bash
# Limpiar backups antiguos manualmente
find docker/backups/ -name "backup_*.sql.gz" -mtime +7 -delete
```

### Error: Permisos denegados

```bash
chmod +x docker/scripts/backup.sh
chmod +x docker/scripts/restore.sh
```

### Verificar Integridad de Backup

```bash
gzip -t docker/backups/backup_20231225_143000.sql.gz
```

## Configuración de Retención

Por defecto: 7 días

Para cambiar, editar en `docker/scripts/backup.sh`:

```bash
readonly RETENTION_DAYS=7  # Cambiar a 14, 30, etc.
```

O usar variable de entorno:

```bash
# En .env
BACKUP_RETENTION_DAYS=30
```

## Seguridad

### Permisos Recomendados

```bash
chmod 600 docker/backups/*.sql.gz    # Solo propietario
chmod 700 docker/scripts/*.sh         # Scripts ejecutables
```

### Cifrar Backups Sensibles

```bash
# Cifrar
gpg --symmetric --cipher-algo AES256 docker/backups/backup_20231225_143000.sql.gz

# Descifrar
gpg --decrypt backup_20231225_143000.sql.gz.gpg > backup_temp.sql.gz
```

## Más Información

- Documentación completa: `docker/backups/README.md`
- Scripts: `docker/scripts/README.md`

## Contacto de Soporte

Para problemas o preguntas:
- Revisar logs en `docker/backups/logs/`
- Contactar al equipo de DevOps

---

Última actualización: 2024-12-23
