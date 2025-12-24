# Sistema de Gestión Integral (SGI) - Contexto para Claude Code

## Descripción del Proyecto

**Sistema de Gestión Integral (SGI)** multi-industria completamente adaptable. Actualmente implementado para la industria de rendering (recolección y procesamiento de materias primas: huesos, sebo, grasa), pero diseñado para ser usado en manufactura, servicios, logística y cualquier otra industria.

**Arquitectura:** Plataforma web con backend Django y frontend React.

**Versión actual:** 1.0.0-beta.1
**GitHub:** [Grasas-Huesos-SGI](https://github.com/Kmylosky83/Grasas-Huesos-SGI)

## 🎯 Característica Clave: Sistema Dinámico

**Los cargos, roles y permisos son 100% dinámicos y se gestionan desde la base de datos.**

- ✅ No hay cargos hardcodeados en el código
- ✅ Cada empresa define sus propios cargos desde la interfaz admin
- ✅ Adaptable a cualquier industria sin cambios de código
- ✅ Ver: `docs/RBAC-SYSTEM.md` y `IMPLEMENTACION_SISTEMA_DINAMICO.md`

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

## Sistema de Cargos Dinámicos

**IMPORTANTE:** Los cargos se gestionan 100% desde la base de datos. No hay cargos hardcodeados.

### Gestión desde la interfaz

**Ruta:** Dirección Estratégica > Organización > Cargos

Cada empresa puede crear sus propios cargos con:

- Código único (ej: `gerente_general`, `supervisor_produccion`)
- Nivel jerárquico (0=Operativo, 1=Supervisión, 2=Coordinación, 3=Dirección)
- Manual de funciones completo (5 tabs)
- Permisos personalizados
- Riesgos ocupacionales (SST)

### Ejemplos de cargos por industria

| Industria | Ejemplos |
|-----------|----------|
| **Rendering** | Coordinador Recolección, Operador Báscula, Jefe Planta |
| **Manufactura** | Supervisor Producción, Operador Máquina, Ingeniero Calidad |
| **Servicios** | Coordinador Proyectos, Analista, Consultor Senior |
| **Logística** | Coordinador Flota, Conductor, Auxiliar Bodega |

### Validación en código

**Backend:**

```python
# ✅ CORRECTO: Usar permisos
if request.user.has_perm('proveedores.manage'):
    # Lógica

# ✅ Alternativa: Verificar cargo dinámico
if request.user.cargo and request.user.cargo.code == 'gerente_general':
    # Lógica
```

**Frontend:**

```typescript
// ✅ CORRECTO: Usar hook de permisos
const { hasPermission } = usePermissions();
if (hasPermission('proveedores.manage')) {
  // Mostrar componente
}
```

**❌ NUNCA hacer:**

```python
# Hardcodear cargos específicos
if user.cargo_code in ['lider_com_econorte', 'comercial_econorte']:
    # MAL - No hacer esto
```

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
