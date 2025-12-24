# EMPEZAR AQUI - Documentacion del Proyecto

## Bienvenida

Documentacion completa del **ERP StrateKaz** - Sistema de Gestión Integral multi-industria. Esta guia te ayudara a navegar la documentacion disponible.

> **IMPORTANTE:** Este sistema es **100% dinámico desde la base de datos**. El sidebar, módulos, tabs, cargos, roles y permisos se configuran completamente desde la DB sin modificar código.

---

## ESTRUCTURA FINAL - 14 MÓDULOS

Validada: 23 Diciembre 2024 | Fuente: `Estructura Final 22.txt`

| Orden | Módulo | Código | Tabs | Estado |
|-------|--------|--------|------|--------|
| **10** | **Direccion Estrategica** | gestion_estrategica | 6 | COMPLETO |
| **20** | **Cumplimiento Normativo** | motor_cumplimiento | 4 | COMPLETO |
| **21** | **Motor de Riesgos** | motor_riesgos | 7 | COMPLETO |
| **22** | **Flujos de Trabajo** | workflow_engine | 3 | COMPLETO |
| **30** | **Gestion Integral** | hseq_management | 11 | COMPLETO (10) / PARCIAL (1) |
| **40** | **Cadena de Suministro** | supply_chain | 5 | ESTRUCTURA |
| **41** | **Base de Operaciones** | production_ops | 4 | ESTRUCTURA |
| **42** | **Logistica y Flota** | logistics_fleet | 4 | ESTRUCTURA |
| **43** | **Ventas y CRM** | sales_crm | 4 | ESTRUCTURA |
| **50** | **Centro de Talento** | talent_hub | 11 | ESTRUCTURA |
| **51** | **Administracion y Financiero** | admin_finance | 4 | ESTRUCTURA |
| **52** | **Contabilidad** | accounting | 4 | ESTRUCTURA |
| **60** | **Inteligencia de Negocios** | analytics | 7 | ESTRUCTURA |
| **61** | **Sistema de Auditorias** | audit_system | 4 | ESTRUCTURA |

**Total: 14 módulos | 80 tabs | 6 niveles**
**Backend: 29 apps COMPLETAS, 50 apps ESTRUCTURA**
**Frontend: 4 features COMPLETAS, 4 PARCIALES, 2 ESTRUCTURA**

---

## ARQUITECTURA DEL SISTEMA

### 6 Niveles Jerárquicos

```text
NIVEL 1: ESTRATÉGICO (10)
  └── Direccion Estrategica     → Configuración, Organización, Identidad, Planeación

NIVEL 2: CUMPLIMIENTO (20-22)
  ├── Cumplimiento Normativo    → Matriz Legal, Requisitos, Partes Interesadas
  ├── Motor de Riesgos          → Contexto, IPEVR, Aspectos Ambientales, SAGRILAFT
  └── Flujos de Trabajo         → Diseñador, Ejecución, Monitoreo

NIVEL 3: TORRE DE CONTROL (30)
  └── Gestion Integral          → Sistema Documental, Calidad, SST, Ambiental, Emergencias

NIVEL 4: CADENA DE VALOR (40-43)
  ├── Cadena de Suministro      → Proveedores, Catálogos, Compras, Almacenamiento
  ├── Base de Operaciones       → Recepción, Procesamiento, Mantenimiento
  ├── Logistica y Flota         → Transporte, Despachos, Flota, PESV
  └── Ventas y CRM              → Clientes, Pipeline, Facturación

NIVEL 5: HABILITADORES (50-52)
  ├── Centro de Talento         → Colaboradores, Formación, Nómina
  ├── Administracion y Finanzas → Tesorería, Presupuesto, Activos
  └── Contabilidad              → Config Contable, Movimientos, Informes

NIVEL 6: INTELIGENCIA (60-61)
  ├── Inteligencia de Negocios  → KPIs, Dashboards, Reportes
  └── Sistema de Auditorias     → Logs, Notificaciones, Alertas
```

**Leyenda:**

- `[ACTIVO]` - Módulo completamente funcional con modelos, APIs y frontend
- `[PARCIAL]` - Algunas apps implementadas, otras pendientes
- `[ESTRUCTURA]` - Estructura de archivos creada, pendiente implementación de modelos

---

## ESTADO ACTUAL DEL PROYECTO

### Apps ACTIVAS y Funcionales

| App | Ubicación | Modelos | Estado |
|-----|-----------|---------|--------|
| **core** | apps/core | User, Cargo, Permiso, Grupo | PRODUCCION |
| **configuracion** | apps/gestion_estrategica/configuracion | EmpresaConfig, SedeEmpresa, IntegracionExterna | PRODUCCION |
| **organizacion** | apps/gestion_estrategica/organizacion | Area, ConsecutivoConfig | PRODUCCION |
| **identidad** | apps/gestion_estrategica/identidad | CorporateIdentity, CorporateValue | PRODUCCION |
| **planeacion** | apps/gestion_estrategica/planeacion | StrategicPlan, StrategicObjective | PRODUCCION |
| **matriz_legal** | apps/motor_cumplimiento/matriz_legal | TipoNorma, NormaLegal, EmpresaNorma | PRODUCCION |

### Apps LEGACY Funcionales (Pendiente Migración)

| App Legacy | Modelos | Destino Nueva Arquitectura | Prioridad |
|------------|---------|---------------------------|-----------|
| **proveedores** | UnidadNegocio, Proveedor, HistorialPrecio | supply_chain/gestion_proveedores | MEDIA |

> **Nota:** Las apps `ecoaliados`, `programaciones`, `recolecciones` y `recepciones` fueron eliminadas el 23/12/2024 por estar hardcodeadas y contener solo datos de prueba.

### Apps ELIMINADAS (22 Dic 2024)

- ~~apps/unidades/~~ - Duplicaba proveedores.UnidadNegocio
- ~~apps/lotes/~~ - Vacío, sin modelos
- ~~apps/liquidaciones/~~ - Vacío, sin modelos
- ~~apps/certificados/~~ - Vacío, sin modelos
- ~~apps/reportes/~~ - Vacío, sin modelos

### Módulos con Estructura (Pendiente Implementación)

| Nivel | Módulo | Apps | Estado |
|-------|--------|------|--------|
| 2 | motor_cumplimiento | 4 | 1 ACTIVO, 3 pendientes |
| 2 | motor_riesgos | 7 | Estructura creada |
| 2 | workflow_engine | 3 | Estructura creada |
| 3 | hseq_management | 11 | Estructura creada |
| 4 | supply_chain | 5 | Estructura creada |
| 4 | production_ops | 4 | Estructura creada |
| 4 | logistics_fleet | 4 | Estructura creada |
| 4 | sales_crm | 4 | Estructura creada |
| 5 | talent_hub | 11 | Estructura creada |
| 5 | admin_finance | 4 | Estructura creada |
| 5 | accounting | 4 | Estructura creada |
| 6 | analytics | 7 | Estructura creada |
| 6 | audit_system | 4 | Estructura creada |

**Total: 14 módulos, 69 apps nuevas + 6 apps activas + 5 apps legacy = 80 apps**

---

## INDICE DE DOCUMENTACION

La documentación está organizada en las siguientes carpetas:

### arquitectura/

Documentación técnica sobre la arquitectura del sistema.

| Archivo | Descripcion |
|---------|-------------|
| **DATABASE-ARCHITECTURE.md** | Arquitectura completa de 154 tablas en 14 módulos |
| **DIAGRAMA-ER.md** | Diagrama Entidad-Relación completo del sistema (Semana 1) |
| **ESTRUCTURA-6-NIVELES-ERP.md** | Descripción de los 6 niveles jerárquicos del ERP |
| **ANALISIS-SAAS-ARQUITECTURA.md** | Análisis de arquitectura SaaS multi-tenant |
| **PLAN-MIGRACION-INCREMENTAL.md** | Plan de migración sin romper funcionalidad |
| **INTEGRACIONES-ARQUITECTURA.md** | Arquitectura de integraciones externas |

### modulos/

Documentación específica de cada módulo funcional.

#### modulos/hseq/

| Archivo | Descripcion |
|---------|-------------|
| **HSEQ_MODULES_SETUP.md** | Configuración del sistema HSEQ |
| **INDEX_HSEQ_MODULES.md** | Índice de módulos HSEQ |
| **QUICK_START_HSEQ.md** | Guía rápida de inicio HSEQ |
| **RESUMEN_HSEQ_MODULES.md** | Resumen de funcionalidades HSEQ |

#### modulos/riesgos/

| Archivo | Descripcion |
|---------|-------------|
| **MOTOR_RIESGOS_REGISTRO_COMPLETO.md** | Registro completo del motor de riesgos |
| **RIESGO-SELECTOR-IMPLEMENTATION.md** | Implementación del selector de riesgos |
| **RIESGO-SELECTOR-UX-DESIGN.md** | Diseño UX del selector |
| **RIESGO-SELECTOR-VISUAL-GUIDE.md** | Guía visual del selector |

#### modulos/cumplimiento/

| Archivo | Descripcion |
|---------|-------------|
| **REQUISITOS_LEGALES_FILES.md** | Gestión de archivos de requisitos legales |

#### modulos/recepciones/

| Archivo | Descripcion |
|---------|-------------|
| **RECEPCIONES-DIAGRAMS.md** | Diagramas del módulo de recepciones |
| **RECEPCIONES-MODELS.md** | Modelos de datos de recepciones |
| **RECEPCIONES-SUMMARY.md** | Resumen del módulo de recepciones |
| **EJEMPLO-IMPLEMENTACION-RECEPCION.md** | Ejemplo de implementación |

#### modulos/consecutivos/

| Archivo | Descripcion |
|---------|-------------|
| **SISTEMA-CONSECUTIVOS-INFORME-TECNICO.md** | Informe técnico del sistema de consecutivos |

### desarrollo/

Documentación para desarrolladores.

| Archivo | Descripcion |
|---------|-------------|
| **RBAC-SYSTEM.md** | Sistema completo de permisos, roles y grupos |
| **DESIGN-SYSTEM.md** | Design System completo |
| **DESIGN-SYSTEM-INDEX.md** | Índice del Design System |
| **COMPONENTES-DESIGN-SYSTEM.md** | Documentacion detallada de componentes |
| **COMPONENTES-CATALOGO.md** | Catálogo de componentes UI reutilizables |
| **GUIA-INICIO-DESIGN-SYSTEM.md** | Guía de inicio del Design System |
| **LAYOUT-COMPONENTS.md** | Componentes de layout |
| **RESUMEN-COMPONENTES.md** | Resumen de componentes disponibles |
| **SNIPPETS-RAPIDOS.md** | Codigo copy & paste |
| **DOCKER.md** | Configuración Docker para desarrollo y producción |
| **LUCIDE_ICONS_REFERENCE.md** | Referencia de iconos Lucide |

#### desarrollo/celery/

Documentación de Celery y tareas asíncronas.

| Archivo | Descripcion |
|---------|-------------|
| **REDIS-CELERY-GUIDE.md** | Guía completa de Redis y Celery |
| **CELERY_QUICKSTART.md** | Inicio rápido de Celery |
| **CELERY_COMMANDS.md** | Comandos útiles de Celery |
| **CELERY_SETUP_COMPLETE.md** | Configuración completa de Celery |

#### desarrollo/ci-cd/

Documentación de CI/CD y GitHub Actions.

| Archivo | Descripcion |
|---------|-------------|
| **GITHUB_ACTIONS_SETUP.md** | Configuración de GitHub Actions |

#### desarrollo/migraciones/

Documentación de migraciones y limpieza de código.

| Archivo | Descripcion |
|---------|-------------|
| **LIMPIEZA_LEGACY_COMPLETADA.md** | Registro de limpieza de módulos legacy |
| **REORGANIZACION_FRONTEND.md** | Reorganización de estructura frontend |

#### desarrollo/fixes/

Documentación de correcciones y soluciones técnicas.

| Archivo | Descripcion |
|---------|-------------|
| **RACE_CONDITION_DIAGRAM.md** | Diagrama de race condition |
| **RACE_CONDITION_FIX.md** | Solución a race condition |
| **CHANGELOG_RACE_CONDITION.md** | Registro de cambios de race condition |
| **SOLUCION_TIMEZONE.md** | Solución a problemas de timezone |

#### desarrollo/sesiones/

Registro de sesiones de desarrollo.

| Archivo | Descripcion |
|---------|-------------|
| **SESSION-2025-12-13-navegacion-dinamica.md** | Sesión de navegación dinámica |

### planificacion/

Planificación y cronogramas del proyecto.

| Archivo | Descripcion |
|---------|-------------|
| **CRONOGRAMA-26-SEMANAS.md** | Cronograma de desarrollo por sprints |
| **CRONOGRAMA-VISUAL.md** | Visualización del cronograma |

### sistema-integraciones/

Documentación del sistema de integraciones externas.

| Archivo | Descripcion |
|---------|-------------|
| **INTEGRACIONES-COMPONENTES-EJEMPLO.md** | Ejemplos de componentes de integración |
| **INTEGRACIONES-EXTERNAS.md** | Documentación de integraciones externas |
| **INTEGRACIONES-EXTERNAS-API.md** | API de integraciones externas |
| **INTEGRACION-EXTERNA-API.md** | Especificación de API de integración |
| **RESUMEN-INTEGRACION-EXTERNA.md** | Resumen del sistema de integraciones |

### guias/

Guías de uso y configuración.

| Archivo | Descripcion |
|---------|-------------|
| **CLAUDE.md** | Configuracion de Claude Code y agentes especializados |

---

## GUÍA DE IMPLEMENTACIÓN

### Para implementar un nuevo módulo:

1. **Leer DATABASE-ARCHITECTURE.md** - Entender los modelos requeridos
2. **Crear modelos** en `apps/{modulo}/{app}/models.py`
3. **Crear serializers** en `apps/{modulo}/{app}/serializers.py`
4. **Crear views** en `apps/{modulo}/{app}/views.py`
5. **Registrar URLs** en `apps/{modulo}/{app}/urls.py`
6. **Agregar a INSTALLED_APPS** en `config/settings.py`
7. **Ejecutar migraciones**: `python manage.py makemigrations && migrate`
8. **Crear componentes frontend** siguiendo DESIGN-SYSTEM.md

### Orden recomendado de implementación:

```text
FASE 2 (Cumplimiento) - EN PROGRESO:
  1. motor_cumplimiento/matriz_legal    [COMPLETADO]
  2. motor_riesgos/ipevr                [PENDIENTE]
  3. motor_riesgos/aspectos_ambientales [PENDIENTE]

FASE 3 (HSEQ):
  4. hseq_management/sistema_documental
  5. hseq_management/accidentalidad
  6. hseq_management/gestion_comites

FASE 4 (Migración Legacy → Nueva Arquitectura):
  7. supply_chain/gestion_proveedores (migrar desde proveedores/, ecoaliados/)
  8. logistics_fleet/gestion_transporte (migrar desde programaciones/, recolecciones/)
  9. production_ops/recepcion (migrar desde recepciones/)
```

---

## PRESERVAR - NO MODIFICAR

Los siguientes componentes son críticos y no deben modificarse sin análisis previo:

- **apps/core/** - Sistema RBAC, Usuario, Cargo, Permiso
- **apps/gestion_estrategica/organizacion/** - Áreas, ConsecutivoConfig
- **apps/gestion_estrategica/configuracion/** - EmpresaConfig, SedeEmpresa, IntegracionExterna
- **frontend/src/hooks/usePermissions.ts** - Hook de permisos
- **frontend/src/store/authStore.ts** - Store de autenticación
- **backend/apps/core/permissions_constants.py** - Códigos de permisos

---

## PLAN DE MIGRACIÓN LEGACY

### Estrategia Recomendada: Migración Progresiva

Las apps legacy (proveedores, ecoaliados, programaciones, recolecciones, recepciones) tienen datos en producción y NO deben eliminarse hasta completar la migración:

1. **Fase 1**: Crear nuevos módulos con modelos que referencien a los legacy
2. **Fase 2**: Migrar lógica de negocio a nuevos módulos
3. **Fase 3**: Actualizar frontend para usar nuevas APIs
4. **Fase 4**: Crear migraciones de datos
5. **Fase 5**: Deprecar y eliminar apps legacy

### Mapeo de Migración

| App Legacy | Destino | Modelos a Migrar |
|------------|---------|------------------|
| proveedores | supply_chain/gestion_proveedores | UnidadNegocio, Proveedor, HistorialPrecio |
| ecoaliados | supply_chain/gestion_proveedores | Ecoaliado (merge con proveedores) |
| programaciones | logistics_fleet/gestion_transporte | Programacion |
| recolecciones | logistics_fleet/despachos | Recoleccion |
| recepciones | production_ops/recepcion | RecepcionMateriaPrima |

---

## STACK TECNOLÓGICO

| Capa | Tecnología |
|------|------------|
| **Backend** | Django 5.0.9, DRF, MySQL 8.0, Python 3.11+ |
| **Frontend** | React 18, TypeScript 5.3, Vite 5, Tailwind CSS 3.4 |
| **Estado** | TanStack Query, Zustand |
| **UI** | Framer Motion, Lucide React, Shadcn-UI |
| **Async/Cache** | Redis 7, Celery 5.3, django-celery-beat |
| **DevOps** | Docker, Docker Compose, GitHub Actions CI/CD |

### Contenedores Docker (6 servicios)

| Contenedor | Puerto | Descripción |
|------------|--------|-------------|
| grasas_huesos_db | 3307 | MySQL 8.0 - Base de datos |
| grasas_huesos_redis | 6379 | Redis 7 - Message broker y cache |
| grasas_huesos_backend | 8000 | Django - API REST |
| grasas_huesos_celery_worker | - | Celery Worker - Tareas async |
| grasas_huesos_celery_beat | - | Celery Beat - Tareas programadas |
| grasas_huesos_frontend | 3010 | React + Vite - SPA |

---

## COMANDOS ÚTILES

### Comandos Docker

```bash
# Iniciar desarrollo
docker-compose up -d

# Ver logs
docker logs grasas_huesos_backend -f

# Reiniciar servicios
docker-compose restart

# Detener servicios
docker-compose down
```

### Comandos Django

```bash
# Django check
docker exec grasas_huesos_backend python manage.py check

# Crear migraciones
docker exec grasas_huesos_backend python manage.py makemigrations

# Aplicar migraciones
docker exec grasas_huesos_backend python manage.py migrate

# Crear superusuario
docker exec grasas_huesos_backend python manage.py createsuperuser

# Shell interactivo
docker exec -it grasas_huesos_backend python manage.py shell
```

### Seeds de Datos

```bash
# Configurar TODOS los 14 módulos según Estructura Final 22
docker exec grasas_huesos_backend python manage.py seed_estructura_final

# Limpiar módulos legacy (desactivar)
docker exec grasas_huesos_backend python manage.py cleanup_legacy_modules

# Limpiar módulos legacy (eliminar permanentemente)
docker exec grasas_huesos_backend python manage.py cleanup_legacy_modules --delete

# Verificar sidebar actual
curl http://localhost:8000/api/core/system-modules/sidebar/
```

### Celery y Redis

```bash
# Ver estado del worker
docker logs grasas_huesos_celery_worker -f

# Ver tareas programadas
docker logs grasas_huesos_celery_beat -f

# Verificar conexión Redis
docker exec grasas_huesos_redis redis-cli ping

# Ejecutar tarea de prueba
python test_celery.py
```

### Testing

```bash
# Backend tests
docker exec grasas_huesos_backend pytest

# Backend tests con coverage
docker exec grasas_huesos_backend pytest --cov=apps --cov-report=html

# Frontend tests
cd frontend && npm test

# Frontend tests con coverage
cd frontend && npm run test:coverage

# Storybook (catálogo de componentes)
cd frontend && npm run storybook
```

### CI/CD

```bash
# Validar workflows de GitHub Actions
gh workflow list

# Ver estado de workflows
gh workflow view ci.yml

# Ejecutar workflow manualmente
gh workflow run ci.yml
```

### Backups

```bash
# Backup de base de datos MySQL (recomendado)
./docker/scripts/backup.sh

# Restore de backup
./docker/scripts/restore.sh docker/backups/backup_20251223_143000.sql.gz

# Configurar backups automáticos
./docker/scripts/setup-cron.sh

# Ver backups disponibles
ls -lh docker/backups/*.sql.gz
```

---

## CONTACTO

Para soporte técnico, consultar documentación en `/docs` o contactar al equipo de desarrollo.

---

**Estado:** En desarrollo activo
**Última actualización:** 23 Diciembre 2024
**Versión:** 2.0.0-alpha.3
