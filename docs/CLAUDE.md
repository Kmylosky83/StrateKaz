# Grasas y Huesos del Norte - Contexto para Claude Code

## Descripción del Proyecto

Sistema integral de gestión para la recolección y procesamiento de materias primas (huesos, sebo, grasa) y subproductos cárnicos. Plataforma web con backend Django y frontend React.

**Versión actual:** 1.0.0-beta.1
**GitHub:** [Grasas-Huesos-SGI](https://github.com/Kmylosky83/Grasas-Huesos-SGI)

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
| Proveedores | `apps.proveedores` | Activo |
| Ecoaliados | `apps.ecoaliados` | Activo |
| Programaciones | `apps.programaciones` | Activo |
| Recolecciones | `apps.recolecciones` | Activo |
| Core (Auth) | `apps.core` | Activo |

## Tipos de Materia Prima (18 códigos)

El sistema maneja 18 tipos de materia prima organizados en 4 categorías:

```python
# backend/apps/proveedores/constants.py
CATEGORIAS = {
    'HUESO': ['HUESO_CRUDO', 'HUESO_SECO', 'HUESO_CALCINADO', 'HUESO_CENIZA'],
    'SEBO_CRUDO': ['SEBO_CRUDO_CARNICERIA', 'SEBO_CRUDO_MATADERO', 'SEBO_CUERO', 'SEBO_CUERO_VIRIL', 'SEBO_POLLO'],
    'SEBO_PROCESADO': ['SEBO_PROCESADO_A', 'SEBO_PROCESADO_B', 'SEBO_PROCESADO_B1', 'SEBO_PROCESADO_B2', 'SEBO_PROCESADO_B4', 'SEBO_PROCESADO_C'],
    'OTROS': ['CHICHARRON', 'CABEZAS', 'ACU']
}
```

### Compatibilidad Legacy

Los proveedores pueden tener en `subtipo_materia`:

- **Valores legacy**: `SEBO`, `HUESO`, `CABEZAS`, `ACU` (se expanden a códigos específicos en UI)
- **Valores específicos**: `HUESO_CRUDO`, `SEBO_CUERO`, etc. (se usan directamente)

El mapeo `NEW_TO_LEGACY_MAPPING` en `constants.py` permite validar precios contra ambos formatos.

Cada tipo tiene precio independiente configurado en `PrecioMateriaPrima` con historial de auditoría.

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

## Despliegue

### Staging

- **Dominio:** `grasas.stratekaz.com`
- **Hosting:** Ilimitado Host (cPanel con Python)
- **Guía:** `deploy/cpanel/DEPLOY-CPANEL.md`

### Archivos de configuración

- `deploy/cpanel/passenger_wsgi.py` - WSGI para Passenger
- `deploy/cpanel/.env.staging` - Variables de entorno staging
- `deploy/cpanel/.env.frontend.staging` - Variables frontend

## Tareas Pendientes

- [ ] Completar deploy en staging (subir por File Manager)
- [ ] Continuar auditoría del sistema
- [ ] Planificar migración a PWA
