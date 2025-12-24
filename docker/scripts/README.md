# Docker Utility Scripts

Scripts de utilidad para gestión de Docker en el proyecto Grasas y Huesos del Norte.

## Scripts Disponibles

### start.sh - Iniciar Servicios
```bash
./start.sh [mode]

# Ejemplos:
./start.sh              # Modo desarrollo (default)
./start.sh dev         # Modo desarrollo
./start.sh prod        # Modo producción
```

**Funcionalidad:**
- Valida archivos .env requeridos
- Construye imágenes Docker
- Inicia servicios en modo detached
- Muestra estado y URLs de acceso

---

### stop.sh - Detener Servicios
```bash
./stop.sh [mode] [volumes]

# Ejemplos:
./stop.sh              # Detener desarrollo
./stop.sh prod         # Detener producción
./stop.sh dev volumes  # Detener y eliminar volúmenes (CUIDADO)
```

**Funcionalidad:**
- Detiene todos los servicios
- Opcionalmente elimina volúmenes (requiere confirmación)

---

### logs.sh - Ver Logs
```bash
./logs.sh [mode] [service] [follow]

# Ejemplos:
./logs.sh                    # Todos los servicios (follow)
./logs.sh dev backend        # Solo backend
./logs.sh prod frontend -f   # Frontend en producción (follow)
./logs.sh dev db --no-follow # DB sin follow
```

**Funcionalidad:**
- Muestra logs de servicios
- Soporta follow mode (-f)
- Filtro por servicio específico

---

### backup.sh - Backup de Base de Datos
```bash
./backup.sh [mode]

# Ejemplos:
./backup.sh       # Backup desarrollo
./backup.sh prod  # Backup producción
```

**Funcionalidad:**
- Dump completo de MySQL (estructura + datos)
- Compresión gzip automática (nivel 9)
- Nomenclatura con timestamp: `backup_YYYYMMDD_HHMMSS.sql.gz`
- Logging detallado dual (consola + archivo)
- Verificación de integridad del archivo comprimido
- Limpieza automática (retención 7 días)
- Permisos seguros automáticos (600)
- Cálculo de ratio de compresión
- Ubicación: `../backups/`
- Logs: `../backups/logs/`

**Ver documentación completa:** `../backups/README.md`

---

### restore.sh - Restaurar Base de Datos
```bash
./restore.sh <backup_file> [mode]

# Ejemplos:
./restore.sh ../backups/backup_20231225_120000.sql.gz
./restore.sh ../backups/backup_20231225_120000.sql.gz prod
```

**Funcionalidad:**
- Restaura backup comprimido o sin comprimir
- Verificación de integridad antes de restaurar
- **Backup de seguridad automático** antes de restaurar
- Logging detallado dual (consola + archivo)
- Doble confirmación (operación destructiva)
- Limpieza automática de archivos temporales
- Soporta archivos .sql y .sql.gz
- Instrucciones post-restauración

**ADVERTENCIA:** Sobrescribe la base de datos actual. El script crea un backup de seguridad automáticamente.

---

### setup-cron.sh - Configurar Backups Automáticos

```bash
./setup-cron.sh

# Configuración interactiva de cron jobs
```

**Funcionalidad:**

- Configuración interactiva de backups automáticos
- Opciones predefinidas (diario, cada 6h, 12h, semanal, etc.)
- Modo personalizado con expresión cron
- Selección de modo (dev/prod)
- Verificación de cron jobs existentes
- Logging de ejecuciones automáticas

**Opciones de frecuencia:**

1. Diario a las 2:00 AM
2. Cada 12 horas (02:00 AM y 02:00 PM)
3. Cada 6 horas
4. Cada 4 horas
5. Cada hora
6. Semanal (Domingos a las 3:00 AM)
7. Personalizado

---

### health.sh - Verificar Salud de Servicios
```bash
./health.sh [mode]

# Ejemplos:
./health.sh       # Desarrollo
./health.sh prod  # Producción
```

**Funcionalidad:**
- Verifica health checks de contenedores
- Muestra estado de servicios
- Muestra uso de recursos (CPU, RAM, I/O)
- Códigos de salida:
  - 0: Todos los servicios saludables
  - 1: Algunos servicios unhealthy
  - 2: Algunos servicios no corriendo
  - 3: Algunos servicios iniciando

---

## Permisos de Ejecución

En Linux/Mac, dar permisos de ejecución:

```bash
chmod +x *.sh
```

---

## Uso en Windows

### Opción 1: Git Bash
```bash
bash start.sh
```

### Opción 2: WSL (Recomendado)
```bash
./start.sh
```

### Opción 3: PowerShell (crear wrappers)
```powershell
# start.ps1
docker-compose up -d
```

---

## Variables de Entorno

Los scripts leen variables de:
- `.env` (desarrollo)
- `.env.production` (producción)

Asegúrese de que estos archivos existan y estén configurados correctamente.

---

## Troubleshooting

### Script no ejecuta
```bash
# Verificar permisos
ls -la *.sh

# Dar permisos
chmod +x *.sh

# Verificar line endings (debe ser LF, no CRLF)
dos2unix *.sh
```

### Error "docker-compose not found"
```bash
# Instalar docker-compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Error ".env not found"
```bash
# Crear desde template
cp ../../.env.example ../../.env

# Producción
cp ../../.env.production.example ../../.env.production
```

---

## Mejores Prácticas

1. **Backups regulares**: Ejecutar `backup.sh` antes de cambios importantes
2. **Verificar salud**: Usar `health.sh` regularmente
3. **Logs para debugging**: `logs.sh dev backend -f` durante desarrollo
4. **Producción**: Siempre verificar health antes de cambios en prod

---

## Integración con CI/CD

Estos scripts pueden usarse en pipelines:

```yaml
# .github/workflows/deploy.yml
- name: Deploy to Production
  run: |
    ./docker/scripts/backup.sh prod
    ./docker/scripts/start.sh prod
    ./docker/scripts/health.sh prod
```

---

## Contribuciones

Al agregar nuevos scripts:

1. Seguir el formato de los scripts existentes
2. Agregar banner con colores
3. Validar entradas del usuario
4. Documentar en este README
5. Incluir ejemplos de uso
6. Manejar errores apropiadamente

---

**Última actualización:** 2024-12-22
