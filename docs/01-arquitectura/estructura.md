# Estructura del Proyecto StrateKaz
**Última actualización:** 2026-04-20

## 1. Árbol raíz (2 niveles, solo directorios)

```
StrateKaz/
├── backend/
│   ├── apps/
│   ├── backups/
│   ├── config/
│   ├── docker/
│   ├── logs/
│   ├── media/
│   ├── requirements/
│   ├── scripts/
│   ├── static/
│   ├── staticfiles/
│   ├── templates/
│   ├── tests/
│   ├── utils/
│   └── venv/
├── docs/
│   ├── 01-arquitectura/
│   ├── 02-desarrollo/
│   ├── 03-modulos/
│   ├── 04-devops/
│   ├── architecture/
│   ├── auditorias/
│   ├── audits/
│   ├── business/
│   ├── history/
│   ├── inventory/
│   ├── marketing/
│   └── snapshots/
├── docker/
├── frontend/
│   └── src/
├── marketing_site/
├── node_modules/
└── scripts/
```

## 2. Descripción de carpetas top-level

| Carpeta | Propósito |
|---------|-----------|
| `backend/` | Django REST API — settings, apps, utils, config, scripts |
| `frontend/` | React SPA — componentes, features, hooks, api, stores |
| `docs/` | Documentación técnica versionada (47+ archivos) |
| `docker/` | Archivos de configuración Docker (init.sql, etc.) |
| `marketing_site/` | Landing page standalone (React, independiente del SPA) |
| `node_modules/` | Dependencias npm del workspace raíz (husky, lint-staged) |
| `scripts/` | Scripts de deploy, backup y verificación (bash) |

## 3. Backend — árbol interno (2 niveles)

```
backend/
├── apps/                   # 23 módulos Django (~84 sub-apps)
│   ├── accounting/
│   ├── administracion/
│   ├── analytics/
│   ├── audit_system/
│   ├── catalogo_productos/
│   ├── core/
│   ├── gamificacion/
│   ├── gestion_estrategica/
│   ├── hseq_management/
│   ├── ia/
│   ├── logistics_fleet/
│   ├── mi_equipo/
│   ├── mi_portal/
│   ├── motor_cumplimiento/
│   ├── motor_riesgos/
│   ├── production_ops/
│   ├── sales_crm/
│   ├── shared_library/
│   ├── supply_chain/
│   ├── talent_hub/
│   ├── tenant/
│   ├── tesoreria/
│   └── workflow_engine/
├── config/                 # Settings modulares
│   ├── settings/           # base.py / development.py / production.py / testing.py
│   └── urls.py, celery.py, wsgi.py, asgi.py
├── utils/                  # Base models, logging, cache, validators, storage
├── requirements/           # requirements*.txt divididos por entorno
├── templates/              # Templates Django (emails, PDFs)
├── static/                 # Archivos estáticos fuente
├── staticfiles/            # Archivos estáticos compilados (collectstatic)
├── media/                  # Archivos subidos por usuarios (segregados por tenant)
├── tests/                  # Tests de integración cross-app
├── scripts/                # Scripts de gestión backend
├── logs/                   # Logs locales de desarrollo
├── backups/                # Backups locales de BD
└── docker/                 # Dockerfiles específicos del backend
```

## 4. Frontend src/ — árbol interno (2 niveles)

```
frontend/src/
├── api/                    # Clientes axios (axios-config, auth, tenant, users)
├── assets/                 # Imágenes, SVGs, fuentes locales
├── components/             # Componentes compartidos (100+ en common/forms/layout/modals)
├── constants/              # Constantes globales (modules, permissions, brand, ui-labels)
├── contexts/               # React contexts (ThemeContext, etc.)
├── features/               # 28 feature modules (ver sección 5)
├── hooks/                  # 19+ custom hooks globales
├── layouts/                # DashboardLayout, Sidebar, Header, ProtectedRoute
├── lib/                    # API factory, CRUD hooks factory, query-keys, animations
├── pages/                  # Login, Dashboard, Error, NotFound
├── routes/                 # React Router config + guards
├── store/                  # Zustand stores (authStore, themeStore)
├── types/                  # Definiciones TypeScript globales
└── utils/                  # formatters, dateUtils, cn helper
```

## 5. Descripción de carpetas clave

### backend/apps/ — módulos Django

| Módulo | Tipo | Propósito |
|--------|------|-----------|
| `core/` | App plana | Auth, RBAC, menú, middleware, permisos — núcleo de la plataforma |
| `tenant/` | App plana | Multi-tenant: Tenant, Domain, Plan, TenantUser |
| `ia/` | App plana | GeminiService, ayuda contextual, asistente de texto |
| `shared_library/` | App plana | Biblioteca maestra de plantillas compartidas multi-tenant |
| `catalogo_productos/` | App plana | Catálogo maestro transversal (MateriaPrima, ProductoTerminado, UnidadMedida) |
| `mi_equipo/` | App plana + contenedor | Portal de gestión de personas: estructura_cargos, seleccion, colaboradores, onboarding |
| `mi_portal/` | App plana | Portal del empleado (Mi Portal) — URLs activas, NO en TENANT_APPS |
| `audit_system/` | Contenedor | Logs del sistema, alertas, notificaciones, tareas/recordatorios (C0) |
| `workflow_engine/` | Contenedor | Diseñador BPMN, ejecución, monitoreo, firma digital (CT) |
| `gestion_estrategica/` | Contenedor | Configuracion, organizacion, identidad, contexto, encuestas, gestion_documental, planeacion y más (C1 + CT + C2) |
| `supply_chain/` | Contenedor | Cadena de suministro: catalogos, gestion_proveedores, recepcion, liquidaciones, almacenamiento, compras (C2 LIVE) |
| `analytics/` | Contenedor | KPIs, dashboards, informes, tendencias (C3) |
| `motor_cumplimiento/` | Contenedor | Matriz legal, requisitos, reglamentos, evidencias (C2 DORMIDO) |
| `motor_riesgos/` | Contenedor | Riesgos, IPEVR, aspectos ambientales, seguridad (C2 DORMIDO) |
| `hseq_management/` | Contenedor | Accidentalidad, SST, higiene, medicina, emergencias, calidad (C2 DORMIDO) |
| `talent_hub/` | Contenedor | Gestión continua del colaborador: formación, desempeño, nómina, off-boarding (C2 DORMIDO) |
| `production_ops/` | Contenedor | Recepción, procesamiento, producto terminado, mantenimiento (C2 DORMIDO) |
| `logistics_fleet/` | Contenedor | Gestión de flota y transporte (C2 DORMIDO) |
| `sales_crm/` | Contenedor | Clientes, pipeline de ventas, pedidos, servicio (C2 DORMIDO) |
| `administracion/` | Contenedor | Presupuesto, activos fijos, servicios generales (C2 DORMIDO) |
| `tesoreria/` | Contenedor | Módulo de tesorería (C2 DORMIDO) |
| `accounting/` | Contenedor | Config contable, movimientos, informes, integración (C2 DORMIDO) |
| `gamificacion/` | Contenedor | Juego SST — DESACTIVADO, pendiente refactor completo |

### frontend/src/features/ — feature modules

| Feature | Propósito |
|---------|-----------|
| `acciones-mejora/` | Módulo de acciones de mejora continua |
| `accounting/` | Frontend contabilidad (DORMIDO) |
| `admin-global/` | Panel de administración global (superadmin) |
| `administracion/` | Frontend administración/finanzas (DORMIDO) |
| `analytics/` | Dashboards, KPIs, informes analíticos |
| `audit-system/` | Centro de control: logs, alertas, notificaciones, tareas |
| `catalogo-productos/` | Catálogo maestro de productos y materias primas |
| `cliente-portal/` | Portal de clientes (DORMIDO) |
| `configuracion/` | Configuración organizacional (C1 Fundación) |
| `configuracion-admin/` | Configuración de plataforma (C0) |
| `cumplimiento/` | Motor de cumplimiento legal (DORMIDO) |
| `gestion-documental/` | Gestión documental (8 fases, CT) |
| `gestion-estrategica/` | Planeación estratégica, identidad, contexto (C1/C2) |
| `hseq/` | HSEQ: SST, calidad, medioambiente (DORMIDO) |
| `logistics-fleet/` | Flota y transporte (DORMIDO) |
| `mi-equipo/` | Portal Mi Equipo: cargos, selección, colaboradores, onboarding (L20 LIVE) |
| `mi-portal/` | Portal del empleado (Mi Portal LIVE) |
| `perfil/` | Perfil de usuario |
| `planificacion-operativa/` | Planificación operativa (DORMIDO) |
| `production-ops/` | Operaciones de producción (DORMIDO) |
| `proveedor-portal/` | Portal de proveedores (DORMIDO) |
| `riesgos/` | Motor de riesgos (DORMIDO) |
| `sales-crm/` | CRM de ventas (DORMIDO) |
| `sst-game/` | Juego SST — DESACTIVADO, pendiente refactor |
| `supply-chain/` | Cadena de suministro (LIVE: proveedores, recepción, almacenamiento) |
| `talent-hub/` | Talent Hub gestión continua del colaborador (DORMIDO) |
| `tesoreria/` | Tesorería (DORMIDO) |
| `users/` | Gestión de usuarios — centro de control (solo lectura + impersonar) |
| `workflows/` | Diseñador de flujos, ejecución, firma digital (CT) |

---

## Regla de mantenimiento

Este documento es fuente de verdad para la estructura de directorios del proyecto.
Debe actualizarse en el mismo PR cada vez que cambie:
- Se agregue o elimine una carpeta top-level
- Se active un módulo Django nuevo (carpeta en backend/apps/)
- Se agregue un feature module nuevo en frontend/src/features/

Última actualización: 2026-04-20
Responsable: quien abre el PR que dispara el cambio.
