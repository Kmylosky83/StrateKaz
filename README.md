# Grasas y Huesos del Norte - SGI

Sistema integral de gestión para la recolección y procesamiento de materias primas (huesos, sebo, grasa) y subproductos cárnicos en Colombia.

**Versión:** 2.0.0-alpha.2
**Última actualización:** 23 Diciembre 2025
**Repositorio:** [GitHub](https://github.com/Kmylosky83/Grasas-Huesos-SGI)

## Arquitectura Modular (6 Niveles, 14 Módulos)

El sistema implementa una arquitectura de **monolito modular** organizada en 6 niveles jerárquicos:

```text
┌──────────────────────────────────────────────────────────────────┐
│ NIVEL 1: ESTRATÉGICO                                              │
│   └── gestion_estrategica/ (identidad, organizacion, planeacion,  │
│                             configuracion)                        │
├──────────────────────────────────────────────────────────────────┤
│ NIVEL 2: CUMPLIMIENTO                                             │
│   ├── motor_cumplimiento/ (matriz_legal, requisitos, partes)     │
│   ├── motor_riesgos/ (ipevr, aspectos_ambientales, sagrilaft)    │
│   └── workflow_engine/ (disenador_flujos, ejecucion, monitoreo)  │
├──────────────────────────────────────────────────────────────────┤
│ NIVEL 3: TORRE DE CONTROL (HSEQ)                                  │
│   └── hseq_management/ (calidad, sst, ambiental, comites,        │
│                         accidentalidad, emergencias, mejora)      │
├──────────────────────────────────────────────────────────────────┤
│ NIVEL 4: CADENA DE VALOR                                          │
│   ├── supply_chain/ (proveedores, compras, almacenamiento)       │
│   ├── production_ops/ (recepcion, procesamiento, calidad)        │
│   ├── logistics_fleet/ (transporte, flota, pesv_operativo)       │
│   └── sales_crm/ (clientes, ventas, facturacion)                 │
├──────────────────────────────────────────────────────────────────┤
│ NIVEL 5: HABILITADORES                                            │
│   ├── talent_hub/ (colaboradores, nomina, formacion, desempeno)  │
│   ├── admin_finance/ (tesoreria, presupuesto, activos_fijos)     │
│   └── accounting/ (contabilidad - módulo activable)              │
├──────────────────────────────────────────────────────────────────┤
│ NIVEL 6: INTELIGENCIA                                             │
│   ├── analytics/ (indicadores, dashboards, reportes)             │
│   └── audit_system/ (logs, notificaciones, alertas)              │
└──────────────────────────────────────────────────────────────────┘
```

**Documentación de arquitectura:**

- [DATABASE-ARCHITECTURE.md](docs/DATABASE-ARCHITECTURE.md) - 154 tablas documentadas
- [00-EMPEZAR-AQUI.md](docs/00-EMPEZAR-AQUI.md) - Índice de documentación

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | Django 5.0.9, Django REST Framework, MySQL 8.0, Python 3.11+ |
| **Frontend** | React 18, TypeScript 5.3, Vite 5, Tailwind CSS 3.4, TanStack Query, Zustand |
| **UI/UX** | Framer Motion, Lucide React, Montserrat + Inter fonts |
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
│   │   ├── core/           # Usuarios, RBAC, Campos personalizados
│   │   ├── gestion_estrategica/  # ✅ Nivel 1 - Dirección Estratégica
│   │   │   ├── configuracion/
│   │   │   ├── organizacion/
│   │   │   ├── identidad/
│   │   │   ├── planeacion/
│   │   │   ├── gestion_proyectos/ (PMI)
│   │   │   └── revision_direccion/
│   │   ├── motor_cumplimiento/   # 🔜 Nivel 2 - Cumplimiento
│   │   ├── motor_riesgos/        # ✅ Nivel 2 - Riesgos
│   │   ├── workflow_engine/      # ✅ Nivel 2 - Workflows
│   │   ├── hseq_management/      # ✅ Nivel 3 - Torre HSEQ (11 tabs)
│   │   ├── supply_chain/         # ⚠️ Nivel 4 (refactor pendiente)
│   │   ├── production_ops/       # ⚠️ Nivel 4 (refactor pendiente)
│   │   ├── logistics_fleet/      # 🔜 Nivel 4
│   │   ├── sales_crm/            # 🔜 Nivel 4
│   │   ├── talent_hub/           # 🔜 Nivel 5
│   │   ├── admin_finance/        # 🔜 Nivel 5
│   │   ├── accounting/           # 🔜 Nivel 5 (activable)
│   │   ├── analytics/            # 🔜 Nivel 6
│   │   └── audit_system/         # 🔜 Nivel 6
│   └── config/             # Configuración Django
├── frontend/               # React Frontend
│   └── src/
│       ├── api/            # Configuración Axios
│       ├── components/     # Design System
│       │   ├── common/     # Componentes UI (Button, Card, Modal, etc.)
│       │   ├── forms/      # Inputs, Select, DatePicker, etc.
│       │   ├── layout/     # PageHeader, Sidebar dinámico
│       │   └── modals/     # Sistema de modales estandarizado
│       ├── features/       # Módulos por funcionalidad (6 niveles)
│       │   ├── gestion-estrategica/  # ✅ Nivel 1
│       │   ├── riesgos/              # ✅ Nivel 2
│       │   ├── workflows/            # ✅ Nivel 2
│       │   ├── hseq/                 # ✅ Nivel 3
│       │   ├── proveedores/          # ⚠️ Legacy → supply-chain
│       │   ├── econorte/             # ⚠️ Legacy → supply-chain
│       │   ├── recepciones/          # ⚠️ Legacy → production-ops
│       │   └── [otros...]            # 🔜 Próximamente
│       ├── hooks/          # Custom hooks
│       ├── lib/            # Utilidades (animaciones, etc.)
│       ├── routes/         # ✅ Reorganizado por 6 niveles
│       └── store/          # Zustand stores
├── docker/                 # Configuración Docker
├── docs/                   # Documentación del proyecto
├── .claude/                # Configuración Claude Code
│   └── agents/             # Agentes especializados
├── docker-compose.yml
├── REORGANIZACION_FRONTEND.md  # ✅ Documentación reorganización
└── README.md
```

## Sistema de Navegación Dinámica

El sistema implementa una navegación completamente dinámica cargada desde la base de datos, permitiendo control granular sobre módulos, tabs y secciones.

### Arquitectura de 3 Niveles

```
SystemModule (Módulo)
  └── ModuleTab (Tab/Pestaña)
        └── TabSection (Sección/Sub-navegación)
```

### Características

| Característica | Descripción |
|----------------|-------------|
| **Sin hardcoding** | Toda la navegación viene de la API |
| **Control granular** | Activar/desactivar módulos, tabs y secciones |
| **Iconos dinámicos** | Iconos de Lucide React cargados por nombre |
| **Colores por módulo** | Cada módulo tiene su color de macroproceso |
| **Tiempo real** | Cambios en configuración se reflejan inmediatamente |

### API Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/core/system-modules/sidebar/` | Módulos para sidebar (habilitados) |
| `GET /api/core/system-modules/tree/` | Árbol completo para configuración |
| `PATCH /api/core/system-modules/{id}/toggle/` | Activar/desactivar módulo |
| `PATCH /api/core/module-tabs/{id}/toggle/` | Activar/desactivar tab |
| `PATCH /api/core/tab-sections/{id}/toggle/` | Activar/desactivar sección |

### Uso en Frontend

```tsx
// Hook para sidebar
import { useSidebarModules } from '@/features/gestion-estrategica/hooks/useModules';
const { data: modules } = useSidebarModules();

// Hook para secciones de un tab
import { useTabSections } from '@/features/gestion-estrategica/hooks/useModules';
const { sections } = useTabSections('gestion_estrategica', 'configuracion');

// Componente de sub-navegación
import { DynamicSections } from '@/components/common';
<DynamicSections
  sections={sections}
  activeSection={activeSection}
  onChange={setActiveSection}
  macroprocessColor="purple"
/>
```

## Módulos del Sistema (6 Niveles)

### Nivel 1 - Estratégico

| Módulo | Código | Estado | Tabs |
|--------|--------|--------|------|
| **Dirección Estratégica** | `Gestion_Estrategica` | ✅ Activo | Configuración, Organización, Identidad, Planeación, Proyectos PMI, Revisión Dirección |

### Nivel 2 - Cumplimiento

| Módulo | Código | Estado | Tabs |
|--------|--------|--------|------|
| **Cumplimiento** | `motor_cumplimiento` | ✅ Backend | Matriz Legal, Requisitos Legales, Partes Interesadas, Reglamentos Internos |
| **Riesgos** | `motor_riesgos` | ✅ Backend | Contexto, Riesgos y Oportunidades, IPEVR, Aspectos Ambientales, Riesgos Viales, SAGRILAFT, Seguridad Info |
| **Flujos de Trabajo** | `workflow_engine` | ✅ Backend | Diseñador de Flujos, Ejecución, Monitoreo |

### Nivel 3 - Torre de Control

| Módulo | Código | Estado | Tabs |
|--------|--------|--------|------|
| **Gestión HSEQ** | `hseq_management` | ✅ Backend | Sistema Documental, Planificación, Calidad, Medicina Laboral, Seguridad Industrial, Higiene Industrial, Comités, Accidentalidad, Emergencias, Gestión Ambiental, Mejora Continua |

### Nivel 4 - Cadena de Valor

| Módulo | Código | Estado | Tabs |
|--------|--------|--------|------|
| **Cadena de Suministro** | `supply_chain` | ⚠️ Legacy | Proveedores, Catálogos, Compras, Almacenamiento, Liquidaciones |
| **Operaciones de Producción** | `production_ops` | ⚠️ Legacy | Recepción, Lotes, Procesamiento, Mantenimiento |
| **Logística y Flota** | `logistics_fleet` | 🔜 Próximo | Transporte, Despachos, Flota Vehicular, PESV Operativo |
| **Ventas y CRM** | `sales_crm` | 🔜 Próximo | Clientes, Pipeline, Facturación, PQRS |

### Nivel 5 - Habilitadores

| Módulo | Código | Estado | Tabs |
|--------|--------|--------|------|
| **Centro de Talento** | `talent_hub` | 🔜 Próximo | Colaboradores, Formación, Nómina, Desempeño, Bienestar |
| **Administración y Finanzas** | `admin_finance` | 🔜 Próximo | Tesorería, Presupuesto, Activos Fijos, Servicios Generales |
| **Contabilidad** | `accounting` | 🔜 Activable | Plan de Cuentas, Movimientos, Informes, Cierre |

### Nivel 6 - Inteligencia

| Módulo | Código | Estado | Tabs |
|--------|--------|--------|------|
| **Analítica** | `analytics` | 🔜 Próximo | Indicadores, Dashboard Gerencial, Reportes, Benchmarking |
| **Sistema de Auditoría** | `audit_system` | 🔜 Próximo | Logs de Sistema, Notificaciones, Centro de Alertas, Auditoría |

### Tipos de Materia Prima (18 códigos)

| Categoría | Tipos |
|-----------|-------|
| **HUESO** | Hueso Crudo, Hueso Cocinado, Hueso Frito, Carnaza |
| **SEBO CRUDO** | Sebo de Res, Sebo de Cerdo, Grasa de Pollo, Chicharrón, Recorte de Grasa |
| **SEBO PROCESADO** | Sebo Fundido Res, Sebo Fundido Cerdo, Manteca Cerdo, Grasa Fundida Pollo, Aceite Reciclado, Aceite Trampa Grasa |
| **OTROS** | Vísceras, Sangre, Residuos Orgánicos |

## Sistema RBAC (Control de Acceso)

El sistema implementa un control de acceso basado en roles (RBAC) dinamico. Ver documentacion completa en [docs/RBAC-SYSTEM.md](docs/RBAC-SYSTEM.md).

### Jerarquia de Permisos

```
Usuario → Cargo (1:1) → Permisos
       → Roles (1:N) → Permisos
       → Grupos (1:N) → Roles → Permisos
```

### Sistema Dinámico de Cargos

El sistema permite crear cargos dinámicamente con un **Manual de Funciones completo** estructurado en 5 tabs:

| Tab | Contenido |
|-----|-----------|
| **1. Identificación** | Código, nombre, área, nivel jerárquico, reporta a |
| **2. Funciones** | Objetivo del cargo, funciones y responsabilidades, autoridad |
| **3. Requisitos** | Nivel educativo, experiencia, competencias técnicas y blandas |
| **4. SST** | Riesgos ocupacionales (GTC 45), EPP, exámenes médicos, capacitaciones |
| **5. Permisos** | Rol del sistema, permisos directos, roles por defecto |

#### Requisitos Profesionales

| Campo | Descripción |
|-------|-------------|
| `requiere_licencia_conduccion` | Licencia de conducción (con categoría) |
| `requiere_licencia_sst` | Licencia en Seguridad y Salud en el Trabajo |
| `requiere_tarjeta_contador` | Tarjeta Profesional de Contador Público |
| `requiere_tarjeta_abogado` | Tarjeta Profesional de Abogado |

#### Riesgos Ocupacionales (GTC 45)

Catálogo de 78 riesgos ocupacionales universales organizados en 7 categorías:

| Categoría | Cantidad | Ejemplo |
|-----------|----------|---------|
| Biológico | 8 | Virus, bacterias, hongos |
| Físico | 14 | Ruido, iluminación, vibración |
| Químico | 13 | Gases, vapores, material particulado |
| Psicosocial | 11 | Carga mental, trabajo monótono |
| Biomecánico | 7 | Postura, movimiento repetitivo |
| Condiciones de Seguridad | 19 | Mecánico, eléctrico, locativo |
| Fenómenos Naturales | 6 | Sismo, inundación, vendaval |

Niveles de riesgo: **I** (Crítico), **II** (Alto), **III** (Medio), **IV** (Bajo)

### Organigrama Visual Interactivo

El sistema incluye un organigrama visual interactivo construido con **React Flow v12** para visualizar la estructura organizacional.

#### Tecnologías

| Tecnología | Uso |
|------------|-----|
| `@xyflow/react` | Canvas interactivo con zoom, pan y nodos arrastrables |
| `@dagrejs/dagre` | Layout automático jerárquico |
| `html-to-image` | Exportación a PNG |
| `jspdf` | Exportación a PDF |

#### Modos de Vista

| Modo | Descripción |
|------|-------------|
| **Por Cargos** | Vista jerárquica de cargos con relaciones reporta-a |
| **Por Áreas** | Vista de áreas/departamentos con subáreas |
| **Compacto** | Vista simplificada con nodos más pequeños |

#### Colores por Nivel Jerárquico

| Nivel | Color | Descripción |
|-------|-------|-------------|
| **Estratégico** | 🔴 Rojo | Dirección general, gerencias |
| **Táctico** | 🔵 Azul | Coordinaciones, jefaturas |
| **Operativo** | 🟢 Verde | Personal operativo |
| **Apoyo** | 🟣 Púrpura | Áreas de soporte |

#### Características

| Característica | Descripción |
|----------------|-------------|
| **Avatares de usuarios** | Fotos o iniciales de usuarios asignados a cada cargo |
| **Indicadores** | Vacantes, subordinados, jefaturas |
| **Búsqueda** | Filtrar por nombre o código |
| **Filtros** | Por nivel jerárquico, solo activos |
| **Exportación** | PNG y PDF con logo de empresa |
| **MiniMapa** | Navegación rápida en organigramas grandes |
| **Zoom** | Control de zoom con botones y scroll |

#### API Endpoint

```
GET /api/organizacion/organigrama/
```

**Parámetros:**
- `include_usuarios=true` - Incluir lista completa de usuarios
- `solo_activos=false` - Incluir cargos/áreas inactivos

**Respuesta:**
```json
{
  "areas": [...],
  "cargos": [
    {
      "id": 1,
      "name": "Gerente General",
      "nivel_jerarquico": "ESTRATEGICO",
      "usuarios_asignados": [
        {
          "id": 1,
          "full_name": "Juan Pérez",
          "photo_url": "/media/usuarios/fotos/juan.jpg",
          "initials": "JP"
        }
      ]
    }
  ],
  "stats": {
    "total_areas": 5,
    "total_cargos": 20,
    "total_usuarios": 15
  }
}
```

#### Uso en Frontend

```tsx
// Navegar a: Dirección Estratégica > Organización > Organigrama

// O importar el componente directamente
import { OrganigramaCanvas } from '@/features/gestion-estrategica/components/organigrama';

function MyPage() {
  return <OrganigramaCanvas />;
}
```

### Roles Funcionales (Ejemplos)

| Rol | Descripción |
|-----|-------------|
| `superadmin` | Acceso total al sistema |
| `aprobador_recolecciones` | Aprobar/rechazar recolecciones |
| `gestor_programaciones` | Gestionar programaciones |
| `gestor_proveedores` | Gestionar proveedores y precios |

**Nota:** Los roles son configurables según las necesidades de cada empresa.

---

## 🎯 Sistema de Cargos Completamente Dinámico

El sistema gestiona los cargos de forma **100% dinámica** desde la base de datos. **No hay cargos hardcodeados en el código.**

### Características Clave

✅ **Creación dinámica** de cargos desde interfaz admin
✅ **Manual de funciones completo** por cargo (5 tabs)
✅ **Permisos personalizables** por cargo
✅ **Adaptable a cualquier industria** sin cambiar código
✅ **Multi-empresa**: Cada implementación define sus propios cargos

### Gestión de Cargos

**Ruta:** Dirección Estratégica > Organización > Cargos

Cada cargo incluye:

- **Código único**: Identificador (ej: `lider_comercial`, `gerente_general`)
- **Nivel jerárquico**: 0-Operativo, 1-Supervisión, 2-Coordinación, 3-Dirección
- **Manual de funciones**: Identificación, Funciones, Requisitos, SST, Permisos
- **Riesgos ocupacionales**: GTC-45 (78 riesgos en 7 categorías)
- **Permisos asociados**: Asignación directa de permisos

### Ejemplos Multi-Industria

| Industria | Ejemplos de Cargos |
|-----------|-------------------|
| **Rendering** | Coordinador Recolección, Operador Báscula, Jefe Planta |
| **Manufactura** | Supervisor Producción, Operador Máquina, Ingeniero Calidad |
| **Servicios** | Coordinador Proyectos, Analista, Consultor Senior |
| **Logística** | Coordinador Flota, Conductor, Auxiliar Bodega |

**Flexibilidad total:** Cada empresa define sus cargos sin modificar código.

### Ver Documentación Completa

- **[Sistema de Cargos Dinámicos](docs/RBAC-SYSTEM.md#sistema-de-cargos-dinámicos)** - Guía completa
- **[Implementación del Sistema Dinámico](IMPLEMENTACION_SISTEMA_DINAMICO.md)** - Detalles técnicos

---

### Uso en Backend

```python
from apps.core.permissions import RequirePermission, RequireCargo
from apps.core.permissions_constants import PermissionCodes, CargoCodes

class RecoleccionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, RequirePermission]
    permission_map = {
        'list': PermissionCodes.RECOLECCIONES.VIEW_LIST,
        'create': PermissionCodes.RECOLECCIONES.CREATE,
    }
```

### Uso en Frontend

```tsx
import { usePermissions } from '@/hooks/usePermissions';
import { ProtectedAction } from '@/components/common';
import { CargoCodes, PermissionCodes } from '@/constants/permissions';

// Hook
const { hasPermission, hasCargo } = usePermissions();

// Componente
<ProtectedAction permission={PermissionCodes.RECOLECCIONES.CREATE}>
  <Button>Crear</Button>
</ProtectedAction>
```

## Autenticacion

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
- `/docs/DESIGN-SYSTEM.md`: Design System completo (tipografía, colores, animaciones, modales)
- `/backend/README.md`: Específico del backend
- `/frontend/README.md`: Específico del frontend
- Inline comments: Solo cuando el código no es autoexplicativo

---

## Design System

El proyecto cuenta con un Design System completo documentado en [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

### Resumen

| Aspecto | Tecnología |
|---------|------------|
| **Tipografía** | Montserrat (títulos) + Inter (cuerpo) |
| **Animaciones** | Framer Motion |
| **Iconos** | Lucide React |
| **Modales** | Sistema estandarizado (6 tipos) |

### Componentes Principales

```tsx
// UI Components
import { Button, Badge, Card, Modal, Spinner } from '@/components/common';

// Form Components
import { Input, Select, Textarea, DatePicker } from '@/components/forms';

// Layout Components
import { PageHeader, PageTabs, StatsGrid, FilterCard, DataTableCard } from '@/components/layout';

// Modal System
import { FormModal, ConfirmModal, DetailModal, WizardModal } from '@/components/modals';

// Animated Components
import { AnimatedPage, AnimatedCard, FadeIn, Skeleton } from '@/components/common';
```

### StatsGrid (Estadísticas)

Componente estandarizado para mostrar estadísticas en tarjetas visuales con colores de macroproceso.

```tsx
import { StatsGrid, StatsGridSkeleton } from '@/components/layout';
import type { StatItem } from '@/components/layout';

// Definir estadísticas
const stats: StatItem[] = [
  { label: 'Total Cargos', value: 10, icon: Briefcase, iconColor: 'primary' },
  { label: 'Activos', value: 8, icon: CheckCircle, iconColor: 'success' },
  { label: 'Con Usuarios', value: 5, icon: Users, iconColor: 'info', description: 'Asignados' },
];

// Renderizar
{isLoading ? (
  <StatsGridSkeleton columns={4} />
) : (
  <StatsGrid stats={stats} columns={4} macroprocessColor="purple" />
)}
```

| Prop | Tipo | Descripción |
|------|------|-------------|
| `stats` | `StatItem[]` | Array de estadísticas |
| `columns` | `2-5` | Número de columnas |
| `macroprocessColor` | `string` | Color del macroproceso (green, blue, purple, etc.) |

**Secciones con StatsGrid implementado:**

| Módulo | Sección | Stats |
|--------|---------|-------|
| Organización | AreasTab | Total, Activas, Raíz, Con Responsable |
| Organización | CargosTab | Total, Sistema, Usuarios, Permisos |
| Organización | RolesAdicionalesSubTab | Total, Activos, Certificación, Usuarios |
| Organización | ConsecutivosSection | Total, Activos, Reset Anual, Generados |
| Organización | TiposDocumentoSection | Categorías, Tipos, Activos, Consecutivo |
| Control de Acceso | UsersPage | Total, Activos, Inactivos, Con Cargo |
| Control de Acceso | PermisosTab | Total Permisos, Módulos, Alcance Global, Alcance Propio |

---

## Branding Dinámico

El sistema soporta configuración de marca dinámica desde la base de datos, permitiendo personalizar logos, colores y nombre de empresa sin recompilar.

### Características

| Característica | Descripción |
|----------------|-------------|
| **Logos dinámicos** | Logo claro y oscuro configurables desde DB |
| **Colores de marca** | Primary, Secondary, Accent con variantes automáticas (50-900) |
| **Nombre de empresa** | Configurable en Header, Sidebar, Login, Vouchers |
| **Favicon personalizado** | Ícono de la aplicación configurable |
| **Tiempo real** | Cambios se aplican sin recargar la página |

### Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│                    useDynamicTheme()                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  useBrandingConfig()                         │
│          (Hook global con fallbacks a defaults)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 useActiveBranding()                          │
│     (React Query - solo ejecuta si hay auth token)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              GET /api/core/branding/active/                  │
│                   (Backend Django)                           │
└─────────────────────────────────────────────────────────────┘
```

### Uso en Frontend

```tsx
// Hook global de branding
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

function MyComponent() {
  const {
    companyName,        // Nombre completo
    companyShortName,   // Nombre corto (siglas)
    logo,               // URL logo oscuro
    logoWhite,          // URL logo claro
    primaryColor,       // Color primario HEX
    getLogoForTheme,    // Función helper
    isLoading
  } = useBrandingConfig();

  return (
    <img src={getLogoForTheme('dark')} alt={companyName} />
  );
}
```

### Colores CSS Variables

Los colores se inyectan como CSS variables en `:root`:

```css
/* Generadas automáticamente por useDynamicTheme */
--color-primary-50: 239 246 255;
--color-primary-100: 219 234 254;
--color-primary-500: 59 130 246;  /* Color base */
--color-primary-900: 30 58 138;
/* ... variantes 50-900 para primary, secondary, accent */
```

### Configuración en Tailwind

```javascript
// tailwind.config.js
colors: {
  primary: {
    500: 'rgb(var(--color-primary-500) / <alpha-value>)',
    // CSS variables con fallbacks
  }
}
```

### Dimensiones Recomendadas

| Archivo | Dimensiones | Formato | Uso |
|---------|-------------|---------|-----|
| **Logo Principal** | 400×120 px | PNG (fondo transparente) | Header, Login, Vouchers |
| **Logo Blanco** | 400×120 px | PNG (fondo transparente) | Header (tema oscuro) |
| **Favicon** | 32×32 px | ICO o PNG | Pestaña del navegador |

**Especificaciones de logos:**

- **Aspect ratio:** Horizontal (aprox. 3:1 o 4:1)
- **Altura mínima:** 120px para buena calidad en pantallas retina
- **Formato:** PNG con fondo transparente
- **Peso máximo:** 500KB por archivo
- **Logo oscuro:** Para fondos claros (tema light)
- **Logo blanco/claro:** Para fondos oscuros (tema dark)

**Dónde se muestran los logos:**

| Ubicación | Logo usado | Altura display |
|-----------|------------|----------------|
| Header | Dinámico según tema | 40px |
| Login | Ambos (según tema) | 96px |
| Vouchers impresión | Logo oscuro | 60px |
| Admin preview | Ambos | 64px |

### Gestión de Logos

**Subir logos:**

1. Click en el área de upload o arrastrar archivo
2. Formatos soportados: PNG, JPG, SVG (logo), ICO/PNG (favicon)
3. El logo se sube al servidor y se muestra inmediatamente

**Eliminar logos:**

1. Click en el botón X sobre el logo
2. El preview desaparece inmediatamente
3. Al guardar, el archivo se elimina del servidor

**Reemplazar logos:**

1. Eliminar el logo actual (X)
2. Subir el nuevo archivo
3. Guardar cambios

### Configuración desde Admin

Acceder a **Dirección Estratégica > Configuración > Branding**:

1. Subir logos (claro y oscuro)
2. Configurar colores con selector de color
3. Definir nombre de empresa y eslogan
4. Marcar como "Activo"

Los cambios se aplican inmediatamente en toda la aplicación.

### API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/core/branding/` | Listar configuraciones |
| POST | `/api/core/branding/` | Crear configuración (FormData) |
| PATCH | `/api/core/branding/{id}/` | Actualizar (soporta `*_clear` para eliminar archivos) |
| GET | `/api/core/branding/active/` | Obtener configuración activa |

**Campos especiales para eliminar archivos (PATCH):**

- `logo_clear: true` - Elimina el logo principal
- `logo_white_clear: true` - Elimina el logo blanco
- `favicon_clear: true` - Elimina el favicon

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

## Despliegue

### Staging (cPanel)

- **Dominio:** `grasas.stratekaz.com`
- **Hosting:** Ilimitado Host - Plan Corporativo
- **Guía completa:** [deploy/cpanel/DEPLOY-CPANEL.md](deploy/cpanel/DEPLOY-CPANEL.md)

```bash
# Subir archivos por File Manager (cPanel)
# 1. Comprimir proyecto
# 2. Subir ZIP a cPanel → File Manager
# 3. Extraer en directorio del subdominio
# 4. Configurar Python App en cPanel
# 5. Configurar .env con credenciales
```

### Archivos de Deploy

| Archivo | Descripción |
|---------|-------------|
| `deploy/cpanel/passenger_wsgi.py` | Punto de entrada WSGI para Passenger |
| `deploy/cpanel/.env.staging` | Template de variables de entorno |
| `deploy/cpanel/DEPLOY-CPANEL.md` | Guía paso a paso |

## Licencia

Propietario - Uso interno

## Soporte

Para soporte técnico, contactar al equipo de desarrollo.

---

**Última actualización:** 23 Diciembre 2025
