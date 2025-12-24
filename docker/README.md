# Docker Configuration - Grasas y Huesos del Norte

Configuración Docker para desarrollo y producción del sistema de gestión.

## Inicio Rápido

### Desarrollo

```bash
# 1. Iniciar servicios
docker-compose up -d

# 2. Ver logs
docker-compose logs -f

# 3. Acceder
# Frontend: http://localhost:3010
# Backend:  http://localhost:8000/api
```

### Producción

```bash
# 1. Configurar variables
cp .env.production.example .env.production
nano .env.production

# 2. Iniciar
docker-compose -f docker-compose.prod.yml up -d

# 3. Verificar
./scripts/health.sh prod
```

## Estructura

```
docker/
├── scripts/          # Scripts de utilidad
│   ├── start.sh     # Iniciar servicios
│   ├── stop.sh      # Detener servicios
│   ├── logs.sh      # Ver logs
│   ├── backup.sh    # Backup BD
│   ├── restore.sh   # Restaurar BD
│   └── health.sh    # Health check
└── mysql/
    └── init.sql     # Script inicial BD
```

## Scripts de Utilidad

Ver documentación completa en: `scripts/README.md`

### Comandos Básicos

```bash
# Desarrollo
./scripts/start.sh              # Iniciar
./scripts/logs.sh               # Ver logs
./scripts/health.sh             # Verificar salud
./scripts/backup.sh             # Backup BD
./scripts/stop.sh               # Detener

# Producción
./scripts/start.sh prod         # Iniciar producción
./scripts/logs.sh prod          # Logs producción
./scripts/health.sh prod        # Health producción
./scripts/backup.sh prod        # Backup producción
```

## Servicios

### MySQL 8.0
- **Puerto desarrollo:** 3308
- **Puerto producción:** 3306 (interno)
- **Base de datos:** grasas_huesos_db
- **Health check:** Cada 10s

### Django Backend
- **Puerto desarrollo:** 8000
- **Puerto producción:** 8000 (interno)
- **Workers producción:** 4
- **Health check:** Cada 30s

### React Frontend
- **Puerto desarrollo:** 3010 (Vite dev server)
- **Puerto producción:** 80 (Nginx)
- **Health check:** Cada 30s

## Volumes

**Desarrollo:**
- `mysql_data`: Datos MySQL
- `static_volume`: Archivos estáticos Django
- `media_volume`: Archivos de media Django

**Producción:**
- `mysql_data_prod`: Datos MySQL (bind mount configurable)
- `static_volume_prod`: Archivos estáticos
- `media_volume_prod`: Archivos de media

## Configuración

### Variables de Entorno

**Desarrollo:** `.env` (raíz del proyecto)
**Producción:** `.env.production` (copiar desde .env.production.example)

### Archivos Importantes

- `../docker-compose.yml` - Configuración desarrollo
- `../docker-compose.prod.yml` - Configuración producción
- `../.env` - Variables desarrollo
- `../.env.production.example` - Template producción

## Comandos Docker Útiles

```bash
# Ver estado
docker-compose ps

# Ver logs de servicio específico
docker-compose logs -f backend

# Ejecutar comando en contenedor
docker-compose exec backend python manage.py migrate

# Reiniciar servicio
docker-compose restart backend

# Reconstruir imagen
docker-compose build backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (CUIDADO)
docker-compose down -v
```

## Mantenimiento

### Backups

```bash
# Crear backup
./scripts/backup.sh prod

# Restaurar backup
./scripts/restore.sh ./backups/mysql/backup_YYYYMMDD_HHMMSS.sql.gz prod
```

Los backups se guardan en: `../backups/mysql/`
Retención: 30 días (configurable en .env: `BACKUP_RETENTION_DAYS`)

### Limpieza

```bash
# Limpiar contenedores detenidos
docker container prune

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar volúmenes no usados (CUIDADO)
docker volume prune

# Limpieza completa
docker system prune -a --volumes
```

## Troubleshooting

### Contenedor no inicia
```bash
# Ver logs
docker-compose logs <service-name>

# Verificar health
./scripts/health.sh
```

### Puerto en uso
```bash
# Identificar proceso (Linux/Mac)
sudo lsof -i :8000

# Cambiar puerto en .env
BACKEND_PORT=8001
```

### Cambios no se reflejan
```bash
# Reconstruir imagen
docker-compose build <service-name>

# Recrear contenedor
docker-compose up -d --force-recreate <service-name>
```

## Documentación Completa

Ver documentación detallada en: `../docs/DOCKER.md`

Incluye:
- Guía completa de instalación
- Configuración paso a paso
- Comandos avanzados
- Troubleshooting extensivo
- Mejores prácticas
- Integración CI/CD

## Recursos

- [Documentación Docker](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Django Deployment](https://docs.djangoproject.com/en/stable/howto/deployment/)

## Soporte

Para problemas o preguntas:
1. Revisar `../docs/DOCKER.md`
2. Verificar logs: `./scripts/logs.sh`
3. Verificar health: `./scripts/health.sh`
4. Consultar con DevOps team

---

**Última actualización:** 2024-12-22
