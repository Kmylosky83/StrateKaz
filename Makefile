# ==============================================
# Makefile - StrateKaz
# Sistema de Gestión Integral
# ==============================================

.PHONY: help build up down restart logs shell-backend shell-frontend shell-db clean test migrate

# Variables
DOCKER_COMPOSE = docker-compose
PROJECT_NAME = stratekaz

# Default target
help:
	@echo "======================================"
	@echo "StrateKaz - Makefile"
	@echo "======================================"
	@echo ""
	@echo "Comandos disponibles:"
	@echo ""
	@echo "  make build          - Construir todas las imágenes Docker"
	@echo "  make up             - Iniciar todos los servicios"
	@echo "  make down           - Detener todos los servicios"
	@echo "  make restart        - Reiniciar todos los servicios"
	@echo "  make logs           - Ver logs de todos los servicios"
	@echo "  make logs-backend   - Ver logs solo del backend"
	@echo "  make logs-frontend  - Ver logs solo del frontend"
	@echo "  make logs-db        - Ver logs solo de la base de datos"
	@echo ""
	@echo "  make shell-backend  - Abrir shell en el contenedor backend"
	@echo "  make shell-frontend - Abrir shell en el contenedor frontend"
	@echo "  make shell-db       - Conectar a PostgreSQL shell"
	@echo ""
	@echo "  make migrate        - Ejecutar migraciones de Django"
	@echo "  make makemigrations - Crear nuevas migraciones"
	@echo "  make superuser      - Crear superusuario de Django"
	@echo "  make collectstatic  - Recolectar archivos estáticos"
	@echo ""
	@echo "  make test           - Ejecutar tests del backend"
	@echo "  make test-coverage  - Ejecutar tests con cobertura"
	@echo ""
	@echo "  make db-backup      - Crear backup de la base de datos"
	@echo "  make health         - Verificar salud de los servicios"
	@echo "  make clean          - Limpiar contenedores y volúmenes"
	@echo "  make clean-all      - Limpiar todo incluyendo imágenes"
	@echo ""
	@echo "  make dev-setup      - Configuración inicial para desarrollo"
	@echo ""

# Docker Compose operations
build:
	@echo "🔨 Construyendo imágenes Docker..."
	$(DOCKER_COMPOSE) build

up:
	@echo "🚀 Iniciando servicios..."
	$(DOCKER_COMPOSE) up -d
	@echo "✅ Servicios iniciados!"
	@echo "   Backend:  http://localhost:8000"
	@echo "   Frontend: http://localhost:3010"
	@echo "   PostgreSQL: localhost:5432"

down:
	@echo "🛑 Deteniendo servicios..."
	$(DOCKER_COMPOSE) down

restart:
	@echo "🔄 Reiniciando servicios..."
	$(DOCKER_COMPOSE) restart

# Logs
logs:
	$(DOCKER_COMPOSE) logs -f

logs-backend:
	$(DOCKER_COMPOSE) logs -f backend

logs-frontend:
	$(DOCKER_COMPOSE) logs -f frontend

logs-db:
	$(DOCKER_COMPOSE) logs -f db

# Shell access
shell-backend:
	@echo "🐍 Abriendo shell en backend..."
	$(DOCKER_COMPOSE) exec backend bash

shell-frontend:
	@echo "⚛️  Abriendo shell en frontend..."
	$(DOCKER_COMPOSE) exec frontend sh

shell-db:
	@echo "🗄️  Conectando a PostgreSQL..."
	$(DOCKER_COMPOSE) exec db psql -U $${DB_USER:-stratekaz} -d $${DB_NAME:-stratekaz}

# Django management commands
migrate:
	@echo "🔄 Ejecutando migraciones..."
	$(DOCKER_COMPOSE) exec backend python manage.py migrate

makemigrations:
	@echo "📝 Creando migraciones..."
	$(DOCKER_COMPOSE) exec backend python manage.py makemigrations

superuser:
	@echo "👤 Creando superusuario..."
	$(DOCKER_COMPOSE) exec backend python manage.py createsuperuser

collectstatic:
	@echo "📦 Recolectando archivos estáticos..."
	$(DOCKER_COMPOSE) exec backend python manage.py collectstatic --noinput

# Testing
test:
	@echo "🧪 Ejecutando tests..."
	$(DOCKER_COMPOSE) exec backend pytest

test-coverage:
	@echo "🧪 Ejecutando tests con cobertura..."
	$(DOCKER_COMPOSE) exec backend pytest --cov=apps --cov-report=html
	@echo "📊 Reporte de cobertura generado en backend/htmlcov/index.html"

# Database operations
db-backup:
	@echo "💾 Creando backup de base de datos..."
	@mkdir -p backups
	$(DOCKER_COMPOSE) exec -T db pg_dump -U $${DB_USER:-stratekaz} $${DB_NAME:-stratekaz} > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup creado en backups/"

db-restore:
	@echo "⚠️  Restaurar base de datos"
	@read -p "Ingrese el nombre del archivo de backup: " backup; \
	$(DOCKER_COMPOSE) exec -T db psql -U $${DB_USER:-stratekaz} $${DB_NAME:-stratekaz} < backups/$$backup

# Health checks
health:
	@echo "🏥 Verificando salud de servicios..."
	@echo ""
	@echo "📊 Estado de contenedores:"
	@$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "🔍 Backend Health Check:"
	@curl -sf http://localhost:8000/api/core/health/ | python -m json.tool || echo "❌ Backend no responde"
	@echo ""
	@echo "🔍 Frontend Health Check:"
	@curl -sf http://localhost:3010 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend no responde"
	@echo ""
	@echo "🔍 Database Health Check:"
	@$(DOCKER_COMPOSE) exec -T db pg_isready -U $${DB_USER:-stratekaz} -d $${DB_NAME:-stratekaz} > /dev/null 2>&1 && echo "✅ Database OK" || echo "❌ Database no responde"

# Cleanup operations
clean:
	@echo "🧹 Limpiando contenedores y volúmenes..."
	$(DOCKER_COMPOSE) down -v
	docker system prune -f
	@echo "✅ Limpieza completada"

clean-all:
	@echo "⚠️  ADVERTENCIA: Esto eliminará TODAS las imágenes del proyecto"
	@read -p "¿Está seguro? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		$(DOCKER_COMPOSE) down -v --rmi all; \
		docker system prune -af --volumes; \
		echo "✅ Limpieza total completada"; \
	else \
		echo "❌ Operación cancelada"; \
	fi

# Development setup
dev-setup:
	@echo "🚀 Configuración inicial de desarrollo..."
	@echo ""
	@echo "1️⃣  Construyendo imágenes..."
	$(DOCKER_COMPOSE) build
	@echo ""
	@echo "2️⃣  Iniciando base de datos..."
	$(DOCKER_COMPOSE) up -d db
	@echo "   Esperando 15 segundos a que PostgreSQL inicie..."
	@sleep 15
	@echo ""
	@echo "3️⃣  Iniciando backend..."
	$(DOCKER_COMPOSE) up -d backend
	@echo "   Esperando 10 segundos a que Django inicie..."
	@sleep 10
	@echo ""
	@echo "4️⃣  Ejecutando migraciones..."
	$(DOCKER_COMPOSE) exec backend python manage.py migrate || echo "⚠️  Migraciones pendientes (normal en primer inicio)"
	@echo ""
	@echo "5️⃣  Iniciando frontend..."
	$(DOCKER_COMPOSE) up -d frontend
	@echo ""
	@echo "✅ Configuración inicial completada!"
	@echo ""
	@echo "📍 Servicios disponibles:"
	@echo "   Backend:  http://localhost:8000"
	@echo "   Admin:    http://localhost:8000/admin"
	@echo "   Frontend: http://localhost:3010"
	@echo ""
	@echo "💡 Siguiente paso: make superuser (para crear usuario admin)"
