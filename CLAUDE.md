# Grasas y Huesos del Norte - Contexto para Claude Code

## Descripción del Proyecto

Sistema integral de gestión para la recolección y procesamiento de ACU (Aceite de Cocina Usado) y subproductos cárnicos. Plataforma web con backend Django y frontend React.

## Stack Tecnológico

- **Backend**: Django 5.0.9, Django REST Framework, MySQL 8.0, Python 3.11+
- **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS, TanStack Query, Zustand
- **DevOps**: Docker & Docker Compose

## Estructura del Proyecto

```
backend/           → Django API (puerto 8000)
frontend/          → React SPA (puerto 3010)
docs/              → Documentación técnica
docker/            → Configuración Docker
.claude/agents/    → Agentes especializados
```

## Reglas de Desarrollo

### 1. Usar Agentes Especializados

SIEMPRE usar el agente apropiado para cada tarea:

- `django-master` → Backend: APIs, modelos, serializers
- `react-architect` → Frontend: componentes, hooks, UI
- `data-architect` → Base de datos: schemas, queries, optimización
- `devops-infrastructure-engineer` → Docker, CI/CD
- `qa-testing-specialist` → Tests

### 2. Paralelización

Cuando sea posible, ejecutar múltiples agentes en paralelo para optimizar tiempo.

### 3. Estructura de Archivos

- Raíz limpia: solo archivos de configuración esenciales
- Documentación en `/docs`
- No crear archivos `.bak`, `.tmp`, `.old`

### 4. Convenciones de Código

**Backend (Python)**:
- PEP 8
- Type hints en funciones públicas
- Docstrings en clases/métodos públicos

**Frontend (TypeScript)**:
- ESLint + Prettier
- Componentes funcionales
- Carpeta por feature (`features/nombre/`)

### 5. Git

```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
refactor: refactorización
test: tests
chore: mantenimiento
```

## Módulos del Sistema

| Módulo | App Django | Estado |
|--------|------------|--------|
| Ecoaliados | `apps.ecoaliados` | Activo |
| Programaciones | `apps.programaciones` | Activo |
| Recolecciones | `apps.recolecciones` | Activo |
| Core (Auth) | `apps.core` | Activo |

## Roles del Sistema

- `superadmin` - Acceso total
- `gerente` - Gestión general
- `lider_com_econorte` - Líder comercial
- `comercial_econorte` - Comercial
- `lider_logistica_econorte` - Líder logística
- `recolector_econorte` - Recolector

## Notas Importantes

1. **Timezone**: Colombia (America/Bogota, UTC-5). Ver `/docs/SOLUCION_TIMEZONE.md`
2. **Multi-tenant**: No aplica, es sistema single-tenant
3. **Branding**: "Powered by StrateKaz" es el branding oficial, no modificar
