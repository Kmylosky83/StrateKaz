# Documentación Docker - StrateKaz

## Tabla de Contenidos

- [Introducción](#introducción)
- [Requisitos Previos](#requisitos-previos)
- [Arquitectura Docker](#arquitectura-docker)
- [Configuración de Desarrollo](#configuración-de-desarrollo)
- [Configuración de Producción](#configuración-de-producción)
- [Scripts de Utilidad](#scripts-de-utilidad)
- [Comandos Útiles](#comandos-útiles)
- [Troubleshooting](#troubleshooting)
- [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

Esta documentación describe la configuración Docker del proyecto **StrateKaz**, incluyendo configuraciones para desarrollo y producción, scripts de utilidad y mejores prácticas.

### Servicios Dockerizados

- **MySQL 8.0**: Base de datos principal
- **Django Backend**: API REST con Django + DRF
- **React Frontend**: Aplicación web con Vite

---

## Requisitos Previos

### Software Requerido

- Docker Engine 20.10+ o Docker Desktop
- Docker Compose 2.0+
- Git
- 8GB RAM mínimo (recomendado 16GB)
- 20GB espacio en disco libre

### Instalación Docker

**Windows/Mac:**
```bash
# Descargar Docker Desktop desde:
https://www.docker.com/products/docker-desktop
```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## Arquitectura Docker

### Estructura de Archivos

```
project/
├── docker-compose.yml           # Desarrollo
├── docker-compose.prod.yml      # Producción
├── .env                         # Variables desarrollo
├── .env.production.example      # Template producción
├── backend/
│   ├── Dockerfile              # Imagen desarrollo
│   ├── Dockerfile.prod         # Imagen producción (multi-stage)
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile              # Imagen producción (nginx)
│   ├── Dockerfile.dev          # Imagen desarrollo
│   ├── nginx.conf              # Configuración nginx
│   └── .dockerignore
└── docker/
    ├── scripts/
    │   ├── start.sh            # Iniciar servicios
    │   ├── stop.sh             # Detener servicios
    │   ├── logs.sh             # Ver logs
    │   ├── backup.sh           # Backup BD
    │   ├── restore.sh          # Restaurar BD
    │   └── health.sh           # Health checks
    └── mysql/
        └── init.sql            # Script inicial BD
```

### Red y Volúmenes

**Desarrollo:**
- Red: `grasas_network` (bridge)
- Volúmenes:
  - `mysql_data`: Datos MySQL
  - `static_volume`: Archivos estáticos Django
  - `media_volume`: Archivos de media Django

**Producción:**
- Red: `grasas_network_prod` (bridge con subnet 172.28.0.0/16)
- Volúmenes:
  - `mysql_data_prod`: Datos MySQL (bind mount configurable)
  - `static_volume_prod`: Archivos estáticos
  - `media_volume_prod`: Archivos de media

---

## Configuración de Desarrollo

### 1. Configuración Inicial

```bash
# Clonar repositorio
git clone <repository-url>
cd grasas-y-huesos-del-norte

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar variables si es necesario
nano .env
```

### 2. Variables de Entorno (.env)

Las variables están pre-configuradas para desarrollo:

```env
# Database
MYSQL_DATABASE=grasas_huesos_db
MYSQL_ROOT_PASSWORD=root_password_2024
MYSQL_USER=grasas_user
MYSQL_PASSWORD=grasas_pass_2024

# Django
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production-2024
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3010
MYSQL_PORT=3308
```

### 3. Iniciar Servicios (Método Simple)

```bash
# Opción 1: Docker Compose directo
docker-compose up -d

# Opción 2: Script de inicio
chmod +x docker/scripts/*.sh
./docker/scripts/start.sh
```

### 4. Verificar Estado

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs
docker-compose logs -f

# Health check
./docker/scripts/health.sh
```

### 5. Acceder a la Aplicación

- **Frontend**: http://localhost:3010
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/api/docs/

### 6. Comandos de Desarrollo Comunes

```bash
# Reconstruir imágenes
docker-compose build

# Reiniciar un servicio específico
docker-compose restart backend

# Ver logs de un servicio
docker-compose logs -f backend

# Ejecutar comandos Django
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py shell

# Acceder al shell del contenedor
docker-compose exec backend bash
docker-compose exec frontend sh

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: Borra datos)
docker-compose down -v
```

---

## Configuración de Producción

### 1. Preparación del Entorno

```bash
# Copiar template de variables de producción
cp .env.production.example .env.production

# IMPORTANTE: Editar y configurar todas las variables
nano .env.production
```

### 2. Variables de Producción Críticas

**DEBE CAMBIAR ESTOS VALORES:**

```env
# Secret keys (generar valores aleatorios)
SECRET_KEY=<generar-secreto-fuerte-50-caracteres>
MYSQL_ROOT_PASSWORD=<password-fuerte-aleatorio>
MYSQL_PASSWORD=<password-fuerte-aleatorio>

# Dominio
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Security
DEBUG=False
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

**Generar secretos seguros:**

```bash
# Método 1: Python
python -c "import secrets; print(secrets.token_urlsafe(50))"

# Método 2: OpenSSL
openssl rand -base64 32
```

### 3. Iniciar en Producción

```bash
# Usar docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# O usar script
./docker/scripts/start.sh prod
```

### 4. Características de Producción

**Seguridad:**
- Containers run as non-root users
- No expone puertos innecesarios
- SSL/TLS configurado
- Security headers en nginx
- Variables sensibles en .env

**Performance:**
- Multi-stage builds (imágenes optimizadas)
- Gunicorn con 4 workers
- Nginx con compresión gzip
- Caché de assets estáticos
- Resource limits configurados

**Monitoring:**
- Health checks en todos los servicios
- Logging estructurado (JSON)
- Límites de logs (rotación automática)
- Métricas de recursos

**Optimizaciones MySQL:**
- Buffer pool configurado
- Slow query log activado
- Max connections: 500
- InnoDB optimizado

### 5. SSL/HTTPS Setup

Para habilitar HTTPS en producción:

1. Obtener certificados SSL (Let's Encrypt recomendado):

```bash
# Instalar certbot
sudo apt install certbot

# Obtener certificado
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Los certificados estarán en:
# /etc/letsencrypt/live/yourdomain.com/
```

2. Copiar certificados al proyecto:

```bash
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
```

3. Descomentar líneas SSL en `docker-compose.prod.yml`

---

## Scripts de Utilidad

### start.sh - Iniciar Servicios

```bash
# Desarrollo (default)
./docker/scripts/start.sh

# Producción
./docker/scripts/start.sh prod
```

**Funcionalidad:**
- Valida archivos .env
- Construye imágenes si es necesario
- Inicia servicios en modo detached
- Muestra estado y URLs de acceso

### stop.sh - Detener Servicios

```bash
# Detener sin eliminar volúmenes
./docker/scripts/stop.sh

# Detener y eliminar volúmenes (CUIDADO)
./docker/scripts/stop.sh dev volumes

# Producción
./docker/scripts/stop.sh prod
```

### logs.sh - Ver Logs

```bash
# Todos los servicios (follow)
./docker/scripts/logs.sh

# Servicio específico
./docker/scripts/logs.sh dev backend
./docker/scripts/logs.sh prod frontend

# Sin follow (snapshot)
./docker/scripts/logs.sh dev backend --no-follow
```

### backup.sh - Backup de Base de Datos

```bash
# Backup desarrollo
./docker/scripts/backup.sh

# Backup producción
./docker/scripts/backup.sh prod
```

**Funcionalidad:**
- Dump completo de MySQL (estructura + datos)
- Compresión gzip automática
- Nomenclatura con timestamp
- Limpieza automática de backups antiguos (30 días)
- Ubicación: `./backups/mysql/`

### restore.sh - Restaurar Base de Datos

```bash
# Listar backups disponibles
./docker/scripts/restore.sh

# Restaurar backup específico
./docker/scripts/restore.sh ./backups/mysql/backup_20240101_120000.sql.gz

# Producción
./docker/scripts/restore.sh ./backups/mysql/backup_20240101_120000.sql.gz prod
```

**ADVERTENCIA:** Sobrescribe la base de datos actual. Requiere confirmación.

### health.sh - Verificar Salud

```bash
# Desarrollo
./docker/scripts/health.sh

# Producción
./docker/scripts/health.sh prod
```

**Muestra:**
- Estado de health checks
- Containers running
- Uso de CPU y memoria
- I/O de red

---

## Comandos Útiles

### Gestión de Contenedores

```bash
# Listar contenedores activos
docker ps

# Listar todos (incluyendo detenidos)
docker ps -a

# Ver logs en tiempo real
docker logs -f <container-name>

# Estadísticas de recursos
docker stats

# Inspeccionar contenedor
docker inspect <container-name>

# Ejecutar comando en contenedor
docker exec -it <container-name> bash
```

### Gestión de Imágenes

```bash
# Listar imágenes
docker images

# Eliminar imagen
docker rmi <image-id>

# Limpiar imágenes no usadas
docker image prune -a

# Ver tamaño de imágenes
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### Gestión de Volúmenes

```bash
# Listar volúmenes
docker volume ls

# Inspeccionar volumen
docker volume inspect <volume-name>

# Eliminar volumen (CUIDADO)
docker volume rm <volume-name>

# Limpiar volúmenes no usados
docker volume prune
```

### Limpieza General

```bash
# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes no usadas
docker image prune -a

# Eliminar volúmenes no usados
docker volume prune

# Limpieza completa del sistema
docker system prune -a --volumes

# Ver espacio usado por Docker
docker system df
```

### Debugging

```bash
# Ver últimas 100 líneas de logs
docker-compose logs --tail=100

# Logs de un servicio específico
docker-compose logs backend --tail=50 -f

# Ver variables de entorno
docker-compose exec backend env

# Verificar conectividad de red
docker-compose exec backend ping db

# Verificar DNS
docker-compose exec backend nslookup db

# Test de conectividad MySQL
docker-compose exec backend mysql -h db -u grasas_user -p

# Ejecutar tests en el backend
docker-compose exec backend pytest
```

---

## Troubleshooting

### Problema: Contenedor no inicia

**Síntomas:** Contenedor se reinicia constantemente

**Solución:**
```bash
# Ver logs del contenedor
docker-compose logs <service-name>

# Ver los últimos eventos
docker events --since 1h

# Verificar health check
docker inspect --format='{{.State.Health}}' <container-name>
```

### Problema: Error de conexión a base de datos

**Síntomas:** Backend no puede conectar a MySQL

**Soluciones:**
```bash
# 1. Verificar que MySQL está healthy
docker-compose ps

# 2. Esperar a que MySQL termine de iniciar
docker-compose logs db | grep "ready for connections"

# 3. Verificar wait_for_db está en el comando
docker-compose exec backend python manage.py wait_for_db

# 4. Probar conexión manual
docker-compose exec backend mysql -h db -u grasas_user -p
```

### Problema: Puertos en uso

**Síntomas:** "Port is already allocated"

**Soluciones:**
```bash
# Identificar proceso usando el puerto
# Linux/Mac:
sudo lsof -i :8000
sudo netstat -tulpn | grep :8000

# Windows:
netstat -ano | findstr :8000

# Matar proceso
kill -9 <PID>

# O cambiar puerto en .env
BACKEND_PORT=8001
```

### Problema: Cambios no se reflejan

**Síntomas:** Código actualizado no aparece en contenedor

**Soluciones:**
```bash
# 1. Verificar que los volúmenes están montados
docker-compose config

# 2. Reconstruir imagen
docker-compose build <service-name>

# 3. Recrear contenedor
docker-compose up -d --force-recreate <service-name>

# 4. Frontend: Limpiar caché de Vite
docker-compose exec frontend rm -rf /app/.vite
```

### Problema: Espacio en disco lleno

**Síntomas:** "No space left on device"

**Soluciones:**
```bash
# Ver uso de espacio
docker system df

# Limpiar contenedores detenidos
docker container prune

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar volúmenes no usados (CUIDADO)
docker volume prune

# Limpieza agresiva (CUIDADO: elimina todo)
docker system prune -a --volumes
```

### Problema: Performance lento

**Síntomas:** Contenedores lentos o consumiendo mucha CPU/RAM

**Soluciones:**
```bash
# 1. Ver estadísticas de recursos
docker stats

# 2. Aumentar recursos en Docker Desktop
# Settings > Resources > Memory/CPU

# 3. Verificar resource limits en docker-compose
docker-compose config | grep -A 5 resources

# 4. Optimizar MySQL
docker-compose exec db mysql -u root -p
# Ejecutar: SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
```

### Problema: Migraciones no aplican

**Síntomas:** Cambios en modelos no se reflejan en BD

**Soluciones:**
```bash
# 1. Verificar migraciones pendientes
docker-compose exec backend python manage.py showmigrations

# 2. Crear migraciones
docker-compose exec backend python manage.py makemigrations

# 3. Aplicar migraciones
docker-compose exec backend python manage.py migrate

# 4. Si hay conflictos, ver migración específica
docker-compose exec backend python manage.py sqlmigrate <app> <migration>
```

---

## Mejores Prácticas

### Desarrollo

1. **No commitear archivos sensibles**
   - Agregar `.env` a `.gitignore`
   - Usar `.env.example` como template
   - Nunca hardcodear credenciales

2. **Mantener imágenes ligeras**
   - Usar `.dockerignore` apropiadamente
   - Multi-stage builds para producción
   - Limpiar caché de package managers

3. **Hot reload habilitado**
   - Montar código como volumen en desarrollo
   - Usar watch mode (Vite, Django runserver)
   - No usar volúmenes en producción

4. **Logs accesibles**
   - Usar `docker-compose logs -f`
   - Configurar niveles de log apropiados
   - Rotar logs automáticamente

### Producción

1. **Seguridad first**
   - Cambiar TODAS las credenciales default
   - Usar secretos fuertes y aleatorios
   - Habilitar SSL/TLS
   - No exponer puertos innecesarios
   - Containers como non-root users

2. **Monitoreo continuo**
   - Configurar health checks
   - Monitorear recursos (CPU, RAM, disco)
   - Logs centralizados
   - Alertas configuradas

3. **Backups regulares**
   - Backup diario de base de datos
   - Retención de 30 días mínimo
   - Testar restauración regularmente
   - Backup de volúmenes de media

4. **Updates y mantenimiento**
   - Actualizar imágenes base regularmente
   - Mantener Docker Engine actualizado
   - Revisar security advisories
   - Plan de rollback documentado

5. **Resource management**
   - Configurar limits y reservations
   - Monitorear uso real
   - Escalar horizontalmente cuando sea necesario
   - Usar restart policies apropiadas

### DevOps

1. **Versionado de imágenes**
   ```bash
   # Tag por versión
   docker build -t app:1.0.0 .
   docker build -t app:latest .

   # Tag por commit
   docker build -t app:$(git rev-parse --short HEAD) .
   ```

2. **CI/CD Integration**
   - Build automático en push
   - Tests antes de deploy
   - Deploy staging antes de producción
   - Rollback automático si falla health check

3. **Documentación**
   - Mantener README actualizado
   - Documentar cambios en CHANGELOG
   - Runbooks para operaciones comunes
   - Diagramas de arquitectura

---

## Recursos Adicionales

### Documentación Oficial

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Django Deployment](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [Vite Build](https://vitejs.dev/guide/build.html)

### Herramientas Útiles

- [Dive](https://github.com/wagoodman/dive) - Analizar capas de imágenes
- [ctop](https://github.com/bcicen/ctop) - Top para contenedores
- [lazydocker](https://github.com/jesseduffield/lazydocker) - UI terminal para Docker
- [Docker Slim](https://github.com/docker-slim/docker-slim) - Optimizar imágenes

### Monitoreo y Logging

- [Portainer](https://www.portainer.io/) - UI web para Docker
- [Grafana + Prometheus](https://grafana.com/) - Métricas y dashboards
- [ELK Stack](https://www.elastic.co/elk-stack) - Logs centralizados
- [Sentry](https://sentry.io/) - Error tracking

---

## Contacto y Soporte

Para problemas o preguntas:

1. Revisar esta documentación
2. Buscar en logs: `docker-compose logs -f`
3. Verificar health: `./docker/scripts/health.sh`
4. Consultar con el equipo de desarrollo

---

**Última actualización:** 2024-12-22
**Versión:** 1.0.0
**Mantenedor:** DevOps Team - StrateKaz
