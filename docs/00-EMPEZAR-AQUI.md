# Punto de Entrada - Documentación del Proyecto

## Bienvenida

Documentación del **SGI StrateKaz** - Sistema de Gestión Integral para multi Industria.

| Info | Valor |
|------|-------|
| **Versión** | 2.0.0 |
| **Estado** | ✅ DESARROLLO COMPLETO - Listo para Producción |
| **Última Actualización** | 30 Diciembre 2025 (Fase 7 - Semana 26 - GO-LIVE) |

> **PRINCIPIO FUNDAMENTAL:** Este sistema es **100% dinámico desde la base de datos**. NO se permite hardcoding.

---

## Navegación Rápida

### Para Nuevos Desarrolladores

1. Leer este documento
2. Revisar [README.md](../README.md) para quick start
3. Consultar [ARQUITECTURA-DINAMICA.md](desarrollo/ARQUITECTURA-DINAMICA.md)
4. Ver [CRONOGRAMA-26-SEMANAS.md](planificacion/CRONOGRAMA-26-SEMANAS.md)
5. A finalizar de leer [CRONOGRAMA-26-SEMANAS.md](planificacion/CRONOGRAMA-26-SEMANAS.md) continuar de manera secuencial semana a semana

### Para Actualizar Documentación

Seguir la guía: [GUIA-ACTUALIZACION-DOCS.md](GUIA-ACTUALIZACION-DOCS.md)

---

## Arquitectura del Sistema

### 6 Niveles, 14 Módulos

| Nivel | Módulos | Estado |
|-------|---------|--------|
| **1. Estratégico** | gestion_estrategica | ✅ Completo |
| **2. Cumplimiento** | motor_cumplimiento, motor_riesgos, workflow_engine | ✅ Completo |
| **3. Torre Control** | hseq_management | ✅ Completo (S11-S14) |
| **4. Cadena Valor** | supply_chain, production_ops, logistics_fleet, sales_crm | ✅ Completo (S15-S18) |
| **5. Habilitadores** | talent_hub, admin_finance, accounting | ✅ Completo (S19-S22) |
| **6. Inteligencia** | analytics, audit_system | ✅ Completo (S23-S25) |

Ver detalle: [arquitectura/CATALOGO-MODULOS.md](arquitectura/CATALOGO-MODULOS.md)

---

## Índice de Documentación

### Documentos Prioritarios

| Documento | Descripción | Cuándo Leer |
|-----------|-------------|-------------|
| [GUIA-ACTUALIZACION-DOCS.md](GUIA-ACTUALIZACION-DOCS.md) | Qué documentos actualizar según cambios | Al modificar funcionalidades |
| [CRONOGRAMA-26-SEMANAS.md](planificacion/CRONOGRAMA-26-SEMANAS.md) | Plan de desarrollo semanal | Para planificación |
| [REFACTORING-PLAN.md](desarrollo/REFACTORING-PLAN.md) | Código reutilizable y refactoring | Antes de escribir código |

### Por Categoría

#### Arquitectura (`arquitectura/`)

| Documento | Descripción |
|-----------|-------------|
| [CATALOGO-MODULOS.md](arquitectura/CATALOGO-MODULOS.md) | 6 niveles, 14 módulos detallados |
| [DATABASE-ARCHITECTURE.md](arquitectura/DATABASE-ARCHITECTURE.md) | 154 tablas documentadas |
| [DIAGRAMA-ER.md](arquitectura/DIAGRAMA-ER.md) | Diagrama Entidad-Relación |
| [ESTRUCTURA-6-NIVELES-ERP.md](arquitectura/ESTRUCTURA-6-NIVELES-ERP.md) | Descripción de niveles |

#### Desarrollo (`desarrollo/`)

| Documento | Descripción |
|-----------|-------------|
| [ARQUITECTURA-DINAMICA.md](desarrollo/ARQUITECTURA-DINAMICA.md) | Sistema 100% dinámico |
| [CODIGO-REUTILIZABLE.md](desarrollo/CODIGO-REUTILIZABLE.md) | Abstract models, mixins, hooks |
| [NAVEGACION-DINAMICA.md](desarrollo/NAVEGACION-DINAMICA.md) | Sistema de navegación |
| [RBAC-SYSTEM.md](desarrollo/RBAC-SYSTEM.md) | Roles y permisos |
| [AUTENTICACION.md](desarrollo/AUTENTICACION.md) | Sistema JWT |
| [BRANDING-DINAMICO.md](desarrollo/BRANDING-DINAMICO.md) | Logos, colores dinámicos |
| [LOGGING.md](desarrollo/LOGGING.md) | Sistema de logs |
| [TESTING.md](desarrollo/TESTING.md) | pytest, Vitest, Storybook |
| [POLITICAS-DESARROLLO.md](desarrollo/POLITICAS-DESARROLLO.md) | Convenciones de código |
| [REFACTORING-PLAN.md](desarrollo/REFACTORING-PLAN.md) | Plan de refactoring |

#### DevOps (`devops/`)

| Documento | Descripción |
|-----------|-------------|
| [CI-CD.md](devops/CI-CD.md) | GitHub Actions |
| [BACKUPS.md](devops/BACKUPS.md) | Sistema de backups |
| [DESPLIEGUE.md](devops/DESPLIEGUE.md) | Staging y producción |

#### Planificación (`planificacion/`)

| Documento | Descripción |
|-----------|-------------|
| [CRONOGRAMA-26-SEMANAS.md](planificacion/CRONOGRAMA-26-SEMANAS.md) | Plan de desarrollo |
| [CRONOGRAMA-VISUAL.md](planificacion/CRONOGRAMA-VISUAL.md) | Visualización |

#### Guías (`guias/`)

| Documento | Descripción |
|-----------|-------------|
| [CLAUDE.md](guias/CLAUDE.md) | Configuración para IA/desarrolladores |

#### Usuarios (`usuarios/`)

| Documento | Descripción |
|-----------|-------------|
| [CONFIGURACION-MARCA.md](usuarios/CONFIGURACION-MARCA.md) | Guía de branding para usuarios |

#### Módulos (`modulos/`)

| Carpeta | Contenido |
|---------|-----------|
| `hseq/` | Documentación HSEQ (4 docs) |
| `riesgos/` | Motor de riesgos (4 docs) |
| `cumplimiento/` | Requisitos legales |
| `consecutivos/` | Sistema de consecutivos |

#### Desarrollo - Sesiones (`desarrollo/sesiones/`)

Registros históricos de sesiones de desarrollo significativas.

#### Desarrollo - Celery (`desarrollo/celery/`)

| Documento | Descripción |
|-----------|-------------|
| [CELERY_QUICKSTART.md](desarrollo/celery/CELERY_QUICKSTART.md) | Inicio rápido |
| [REDIS-CELERY-GUIDE.md](desarrollo/celery/REDIS-CELERY-GUIDE.md) | Guía completa |

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | Django 5.0, DRF, MySQL 8.0, Python 3.11+ |
| **Frontend** | React 18, TypeScript 5.3, Vite, Tailwind, Zustand |
| **Async** | Celery 5.3+, Redis 7 |
| **DevOps** | Docker, GitHub Actions |

---

## Comandos Útiles

### Docker

```bash
docker-compose up -d              # Iniciar
docker-compose logs -f            # Logs
docker-compose restart            # Reiniciar
```

### Backend

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend pytest
```

### Frontend

```bash
cd frontend && npm run dev        # Desarrollo
cd frontend && npm test           # Tests
cd frontend && npm run storybook  # Componentes
```

---

## Preservar - No Modificar Sin Análisis

- `apps/core/` - Sistema RBAC, Usuario, Cargo, Permiso
- `apps/gestion_estrategica/organizacion/` - Áreas, Consecutivos
- `apps/gestion_estrategica/configuracion/` - EmpresaConfig
- `frontend/src/hooks/usePermissions.ts` - Hook de permisos
- `frontend/src/store/authStore.ts` - Store de autenticación

---

## Progreso del Proyecto

| Semana | Estado | Entregables |
|--------|--------|-------------|
| 1-6 | ✅ Completadas | Nivel 1 Estratégico completo |
| 7-8 | ✅ Completadas | Motor Cumplimiento (Matriz Legal, Partes Interesadas) |
| 9-10 | ✅ Completadas | Motor Riesgos + Workflow Engine |
| 11 | ✅ Completada | Sistema Documental + Planificación HSEQ |
| 12 | ✅ Completada | Calidad + Medicina Laboral (129 tests) |
| 13 | ✅ Completada | Seguridad Industrial + Accidentalidad (130 tests) |
| 14 | ✅ Completada | Backend 27 modelos + Frontend 4 módulos HSEQ completos |
| 15 | ✅ Completada | Supply Chain - gestion_proveedores + catalogos |
| 16 | ✅ Completada | Supply Chain - programacion + compras + almacenamiento (167 tests) |
| 17 | ✅ Completada | Production Ops + Logistics Fleet (Backend+Frontend+Tests) |
| **18** | ✅ **COMPLETADA** | Sales CRM Completo (4 apps, 37 modelos, 89 tests) |
| **19** | ✅ **COMPLETADA** | Talent Hub - Estructura Cargos, Selección, Colaboradores |
| **20** | ✅ **COMPLETADA** | Talent Hub - Onboarding, Formación (LMS), Desempeño 360° |
| **21** | ✅ **COMPLETADA** | Talent Hub - Control Tiempo, Novedades, Disciplinario, Nómina, Off-Boarding |
| **22** | ✅ **COMPLETADA** | Admin Finance (4 apps) + Accounting (4 apps - módulo activable) |
| **23** | ✅ **COMPLETADA** | Analytics - Indicadores + Dashboards (10 modelos, 105 tests) |
| **24** | ✅ **COMPLETADA** | Analytics - Análisis + Informes (13 modelos) |
| **25** | ✅ **COMPLETADA** | Audit System (16 modelos, 195 tests, 5 páginas frontend) |
| **26** | ✅ **COMPLETADA** | Optimización + Documentación + GO-LIVE |

Ver detalle: [CRONOGRAMA-26-SEMANAS.md](planificacion/CRONOGRAMA-26-SEMANAS.md)

---

## Logros Recientes

### Semana 18 - Sales CRM Completo (28 Dic 2025) ✅ COMPLETADA

**Backend (4 apps, 37 modelos, ~9,500 líneas):**

| App | Modelos | Características |
|-----|---------|-----------------|
| gestion_clientes | 9 | Clientes, contactos, segmentación, NPS |
| pipeline_ventas | 9 | Pipeline Kanban, oportunidades, cotizaciones |
| pedidos_facturacion | 10 | Pedidos, facturación, pagos, descuentos |
| servicio_cliente | 9 | PQRS, SLA, fidelización, encuestas |

**Frontend (8 páginas, ~5,200 líneas):**

| Página | Características |
|--------|-----------------|
| GestionClientesPage | 4 tabs: Clientes, Contactos, Segmentación, NPS |
| PipelineVentasPage | Kanban, Cotizaciones, Productos |
| PedidosFacturacionPage | Pedidos, Facturación, Pagos |
| ServicioClientePage | PQRS, Fidelización, Encuestas |

**Tests (89 tests - 254% del objetivo, ~3,800 líneas):**

| App | Tests | Cobertura |
|-----|-------|-----------|
| gestion_clientes | 22 | Clientes, contactos, NPS |
| pipeline_ventas | 23 | Pipeline, cotizaciones, conversiones |
| pedidos_facturacion | 25 | Pedidos, facturación, pagos |
| servicio_cliente | 19 | PQRS, SLA, fidelización |

**Características Especiales:**
- Pipeline Kanban con drag & drop
- NPS con Net Promoter Score
- PQRS con SLA automático
- Programa de fidelización con puntos
- Integración completa con clientes y productos

---

### Semana 17 - Production Ops + Logistics Fleet (28 Dic 2025) ✅ COMPLETADA

**Backend (6 apps, ~55 modelos, ~10,400 líneas):**

| Módulo | Apps | Modelos | Características |
|--------|------|---------|-----------------|
| production_ops | 4 | ~33 | Recepción, procesamiento, mantenimiento, producto terminado |
| logistics_fleet | 2 | ~20 | Gestión flota PESV, transporte, manifiestos |

**Frontend (~4,500 líneas):**

| Módulo | Archivos | Características |
|--------|----------|-----------------|
| production-ops | Types, API, Hooks, 4 tabs | 33 interfaces, 60+ hooks React Query |
| logistics-fleet | Types, API, Hooks, 2 tabs | 20 interfaces, cumplimiento PESV |

**Tests (65+ tests, ~4,500 líneas):**

| Módulo | Tests | Cobertura |
|--------|-------|-----------|
| production_ops | 50+ | Recepción, producto terminado, liberaciones |
| logistics_fleet | 15+ | Flota PESV, transporte, flujo E2E |

---

### Semana 16 - Supply Chain: Programación + Compras + Almacenamiento (27 Dic 2025) ✅ COMPLETADA

**Backend (3 apps, 35 modelos, ~8,300 líneas):**

| App | Modelos | Características |
|-----|---------|-----------------|
| programacion_abastecimiento | 9 | Soft delete, calendario, estadísticas |
| compras | 16 | Flujo completo requisición→recepción |
| almacenamiento | 9 | Kardex automático, CPP, alertas |

**Frontend (~2,800 líneas):**
- Types: 34 interfaces TypeScript
- API: 135+ funciones CRUD
- Hooks: 110+ hooks React Query
- Components: 3 tabs con 15 subtabs

**Tests (167 tests):**
- programacion_abastecimiento: 53 tests
- compras: 64 tests
- almacenamiento: 50 tests

---

### Semana 15 - Supply Chain: Gestión Proveedores + Catálogos (27 Dic 2025) ✅ COMPLETADA

- Backend: 18 modelos gestion_proveedores + 6 modelos catalogos (~4,000 líneas)
- Frontend: Types, API, Hooks, Components completos
- Tests: 181 tests comprehensivos

---

### Semana 14 - HSEQ Completo (27 Dic 2025) ✅ COMPLETADA

Backend 27 modelos + Frontend 4 módulos HSEQ completos (Emergencias, Ambiental, Mejora, Comités)

---

---

## Logros Recientes - Semana 21 (29 Dic 2025)

### Talent Hub Completo (11 apps, ~65 modelos)

**Semanas 19-21 - FASE 6 Talent Hub:**

| Semana | Apps | Modelos | Descripción |
|--------|------|---------|-------------|
| 19 | 3 | ~20 | Estructura Cargos, Selección, Colaboradores |
| 20 | 3 | ~25 | Onboarding, Formación LMS, Desempeño 360° |
| 21 | 5 | ~35 | Control Tiempo, Novedades, Disciplinario, Nómina, Off-Boarding |

**Frontend Semana 21 (5 apps):**
- Types: 5 archivos (~2,500 líneas)
- Hooks: 5 archivos (~194 hooks React Query)
- Integración con TalentHubPage (11 tabs totales)

---

## Logros Recientes - Fase 7: Nivel 6 Inteligencia (29 Dic 2025)

### Semana 23: Analytics - Indicadores + Dashboards ✅

**Backend (3 apps, 10 modelos):**
- `config_indicadores/`: CatalogoKPI, FichaTecnicaKPI, MetaKPI, ConfiguracionSemaforo
- `dashboard_gerencial/`: VistaDashboard (4 perspectivas BSC), WidgetDashboard, FavoritoDashboard
- `indicadores_area/`: ValorKPI, AccionPorKPI, AlertaKPI

**Frontend (~2,500 líneas):**
- Types: analytics.types.ts (~500 líneas)
- API: analytics/api/index.ts (~350 líneas)
- Hooks: useAnalytics.ts (40+ hooks React Query)
- 4 páginas: ConfigIndicadoresPage, DashboardGerencialPage, IndicadoresAreaPage, AnalyticsPage

**Tests:** 105 tests (67 modelos + 38 views)

---

### Semana 24: Analytics - Análisis + Informes ✅

**Backend (4 apps, 13 modelos adicionales):**
- `analisis_tendencias/`: AnalisisKPI, TendenciaKPI, AnomaliaDetectada
- `generador_informes/`: PlantillaInforme, InformeDinamico, ProgramacionInforme, HistorialInforme
- `acciones_indicador/`: PlanAccionKPI, ActividadPlanKPI, SeguimientoPlanKPI, IntegracionAccionCorrectiva
- `exportacion_integracion/`: ConfiguracionExportacion, LogExportacion

**Frontend (~1,500 líneas):**
- 4 páginas adicionales con tabs completos
- 30+ hooks React Query adicionales

**Total Analytics:** 7 apps, 23 modelos

---

### Semana 25: Audit System ✅

**Backend (4 apps, 16 modelos):**

| App | Modelos | Descripción |
|-----|---------|-------------|
| logs_sistema | 4 | ConfiguracionAuditoria, LogAcceso, LogCambio, LogConsulta |
| centro_notificaciones | 4 | TipoNotificacion, Notificacion, PreferenciaNotificacion, NotificacionMasiva |
| config_alertas | 4 | TipoAlerta, ConfiguracionAlerta, AlertaGenerada, EscalamientoAlerta |
| tareas_recordatorios | 4 | Tarea, Recordatorio, EventoCalendario, ComentarioTarea |

**Frontend (~4,500 líneas):**
- Types: audit-system.types.ts (~600 líneas)
- API: audit-system/api/index.ts (~400 líneas)
- Hooks: useAuditSystem.ts (50+ hooks React Query)
- 5 páginas: AuditSystemPage, LogsSistemaPage, NotificacionesPage, AlertasPage, TareasPage

**Tests:** 195 tests (244% del objetivo de 80)

| App | Tests |
|-----|-------|
| logs_sistema | 62 |
| centro_notificaciones | 42 |
| config_alertas | 39 |
| tareas_recordatorios | 52 |

---

## Semana 26 - GO-LIVE ✅ COMPLETADA (30 Dic 2025)

**Optimización Backend:**
- ✅ Queries optimizadas (N+1 eliminados) - 75-80% mejora
- ✅ 3 índices compuestos en BaseCompanyModel
- ✅ Caché Redis con decoradores
- ✅ 7 ViewSet mixins reutilizables

**Optimización Frontend:**
- ✅ Code splitting con React.lazy() - 54 rutas
- ✅ Chunk splitting Vite - 17 chunks modulares

**Documentación API:**
- ✅ Swagger UI en `/api/docs/`
- ✅ ReDoc en `/api/redoc/`

**Seguridad OWASP:**
- ✅ Rate limiting, Security headers, Input sanitization

**Configuración Producción:**
- ✅ docker-compose.prod.yml + Dockerfile.prod
- ✅ nginx.prod.conf con SSL
- ✅ Backups automatizados + Sentry

---

## 🎉 PROYECTO COMPLETADO

| Métrica | Valor |
|---------|-------|
| Módulos | 16 |
| Apps Django | ~92 |
| Modelos | ~300+ |
| Tests | 1,500+ |

**Sistema listo para GO-LIVE en producción.**

---

**Última actualización:** 30 Diciembre 2025 (Semana 26 - DESARROLLO COMPLETO)
