# Grasas y Huesos del Norte - Sistema de Gestión Integral

Sistema integral de gestión para la recolección y procesamiento de ACU (Aceite de Cocina Usado) y subproductos cárnicos.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | Django 5.0.9, Django REST Framework, MySQL 8.0, Python 3.11+ |
| **Frontend** | React 18, TypeScript 5, Vite 5, Tailwind CSS, TanStack Query, Zustand |
| **DevOps** | Docker & Docker Compose, Nginx (Producción) |

## Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd "Grasas y Huesos del Norte"

# 2. Iniciar servicios
docker-compose up -d

# 3. Acceder
# Frontend: http://localhost:3010
# Backend API: http://localhost:8000
# Admin Django: http://localhost:8000/admin
```

## Estructura del Proyecto

```text
Grasas y Huesos del Norte/
├── backend/                 # Django Backend
│   ├── apps/
│   │   ├── core/           # Usuarios, Cargos, Campos personalizados
│   │   ├── ecoaliados/     # Gestión de Ecoaliados (proveedores)
│   │   ├── programaciones/ # Programación de recolecciones
│   │   ├── recolecciones/  # Registro de recolecciones y vouchers
│   │   └── proveedores/    # Proveedores externos
│   └── config/             # Configuración Django
├── frontend/               # React Frontend
│   └── src/
│       ├── api/            # Configuración Axios
│       ├── components/     # Componentes reutilizables
│       ├── features/       # Módulos por funcionalidad
│       ├── hooks/          # Custom hooks
│       └── stores/         # Zustand stores
├── docker/                 # Configuración Docker
├── docs/                   # Documentación del proyecto
├── .claude/                # Configuración Claude Code
│   └── agents/             # Agentes especializados
├── docker-compose.yml
└── README.md
```

## Módulos del Sistema

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Gestión de Ecoaliados | Activo | CRUD, unidades de negocio, precios, geolocalización |
| Programación de Recolecciones | Activo | Programación, asignación, estados, reprogramación |
| Ejecución de Recolecciones | Activo | Registro, cálculos, vouchers, estadísticas |
| Recepción en Planta | Pendiente | - |
| Liquidaciones | Pendiente | - |
| Certificaciones | Pendiente | - |
| Reportes y Analytics | Pendiente | - |

## Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| `superadmin` | Acceso total al sistema |
| `gerente` | Gestión general y reportes |
| `lider_com_econorte` | Líder comercial - gestión de ecoaliados |
| `comercial_econorte` | Comercial - programación de recolecciones |
| `lider_logistica_econorte` | Líder logística - asignación y reprogramación |
| `recolector_econorte` | Recolector - ejecución de recolecciones |

## Autenticación

JWT (JSON Web Tokens):

- Access Token: 60 minutos
- Refresh Token: 7 días
- Blacklist para tokens revocados

---

## Políticas de Desarrollo

### 1. Estructura de Archivos

- **Raíz del proyecto**: Solo archivos de configuración esenciales (`docker-compose.yml`, `Makefile`, `.env`, `.gitignore`, `README.md`)
- **Sin archivos temporales**: No `.bak`, `.tmp`, `.old`, `.log` en repositorio
- **Documentación**: Toda documentación adicional va en `/docs`
- **Scripts de utilidad**: Van en `/backend/scripts/` o `/frontend/scripts/`

### 2. Uso de Agentes Especializados (Claude Code)

Este proyecto utiliza agentes especializados para optimizar el desarrollo. **SIEMPRE** usar el agente apropiado:

| Agente | Uso |
|--------|-----|
| `django-master` | APIs REST, modelos, serializers, vistas Django |
| `react-architect` | Componentes React, hooks, estado, UI |
| `data-architect` | Esquemas DB, queries, migraciones, optimización |
| `devops-infrastructure-engineer` | Docker, CI/CD, deployment |
| `qa-testing-specialist` | Tests unitarios, integración, E2E |
| `documentation-expert` | Documentación técnica, APIs |

Reglas de Agentes:

1. **Paralelización**: Cuando la tarea lo permita, ejecutar múltiples agentes en paralelo
2. **Especialización**: Cada agente trabaja en su dominio específico
3. **Contexto del proyecto**: Los agentes analizan la estructura existente antes de recomendar

Ejemplo de uso paralelo:

```text
Tarea: "Agregar nuevo endpoint de reportes"
→ Agente django-master: Crear modelo y API
→ Agente react-architect: Crear componente de visualización
→ Agente qa-testing-specialist: Crear tests
(Ejecutados en paralelo)
```

### 3. Convenciones de Código

#### Backend (Python/Django)

- PEP 8 estricto
- Type hints en funciones públicas
- Docstrings en clases y métodos públicos
- Tests para cada endpoint

#### Frontend (TypeScript/React)

- ESLint + Prettier
- Componentes funcionales con hooks
- Types/Interfaces para props y estado
- Carpeta por feature (`features/nombre/`)

### 4. Git Workflow

```bash
# Ramas
main           # Producción estable
develop        # Desarrollo integrado
feature/*      # Nuevas funcionalidades
fix/*          # Correcciones de bugs
hotfix/*       # Fixes urgentes en producción

# Commits
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
refactor: refactorización
test: tests
chore: mantenimiento
```

### 5. Documentación

- `/docs`: Documentación técnica, guías, decisiones de arquitectura
- `/backend/README.md`: Específico del backend
- `/frontend/README.md`: Específico del frontend
- Inline comments: Solo cuando el código no es autoexplicativo

---

## Comandos Útiles

```bash
# Logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Migraciones
docker-compose exec backend python manage.py migrate

# Superusuario
docker-compose exec backend python manage.py createsuperuser

# Limpiar cache Python
docker exec grasas_huesos_backend sh -c "find /app -name '*.pyc' -delete && find /app -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null"
docker restart grasas_huesos_backend
```

---

## Licencia

Propietario - Uso interno

## Soporte

Para soporte técnico, contactar al equipo de desarrollo.
