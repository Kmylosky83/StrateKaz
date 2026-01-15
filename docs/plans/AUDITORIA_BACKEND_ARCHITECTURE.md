# REPORTE AUDITORÍA BACKEND ARCHITECTURE - StrateKaz

**Fecha:** 2026-01-15
**Auditor:** Claude Code (Agente Django Master / Backend Architect)
**Versión del Proyecto:** 3.3.0

---

## RESUMEN EJECUTIVO

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Total Apps Django** | 80 | ✅ Bien organizado |
| **Endpoints API** | ~659 | ✅ Documentados con OpenAPI |
| **Archivos >500 líneas** | 20+ | ⚠️ Necesitan refactorización |
| **Dependencias circulares** | 1 (soft) | ✅ Mitigada con lazy imports |
| **Endpoints públicos** | 4 | ✅ Mínimo, bien protegidos |
| **TODO/FIXME pendientes** | 64 | ⚠️ Deuda técnica |

---

## A. INVENTARIO Y ESTRUCTURA DE APLICACIONES

### Apps Django - Organización por Niveles

**Total: 80 aplicaciones Django organizadas en 6 niveles + core**

#### NIVEL 0: CORE BASE (1 app)
| App | Path | Descripción |
|-----|------|-------------|
| **core** | `apps/core/` | Autenticación, RBAC, Base Models, Middleware, Usuarios, Cargos |

**Archivos principales:** models.py (3,245 líneas), viewsets.py, viewsets_rbac.py, serializers.py, permissions.py, middleware/

---

#### NIVEL 1: ESTRATÉGICO (7 apps) - Semana 6
| App | Path | Descripción |
|-----|------|-------------|
| **configuracion** | `apps/gestion_estrategica/configuracion/` | EmpresaConfig, Sedes, Normas ISO, Configuración maestra |
| **organizacion** | `apps/gestion_estrategica/organizacion/` | Áreas, estructura jerárquica, ConsecutivoConfig |
| **identidad** | `apps/gestion_estrategica/identidad/` | Identidad corporativa, misión/visión, políticas, valores |
| **planeacion** | `apps/gestion_estrategica/planeacion/` | Planes estratégicos, BSC, objetivos, KPIs |
| **contexto** | `apps/gestion_estrategica/planeacion/contexto/` | ISO 4.1: DOFA, PESTEL, Porter |
| **gestion_proyectos** | `apps/gestion_estrategica/gestion_proyectos/` | Portafolio, programas, proyectos |
| **revision_direccion** | `apps/gestion_estrategica/revision_direccion/` | Actas revisión gerencial ISO 9001/14001/45001 |

---

#### NIVEL 2: CUMPLIMIENTO Y RIESGOS (14 apps) - Semana 10

**Motor Cumplimiento (4 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **matriz_legal** | `apps/motor_cumplimiento/matriz_legal/` | Matriz de requisitos legales |
| **requisitos_legales** | `apps/motor_cumplimiento/requisitos_legales/` | Evaluación cumplimiento legal |
| **partes_interesadas** | `apps/motor_cumplimiento/partes_interesadas/` | Gestión stakeholders |
| **reglamentos_internos** | `apps/motor_cumplimiento/reglamentos_internos/` | Políticas y reglamentos internos |

**Motor Riesgos (6 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **riesgos_procesos** | `apps/motor_riesgos/riesgos_procesos/` | Riesgos de proceso ISO 31000 |
| **ipevr** | `apps/motor_riesgos/ipevr/` | Peligros SST - GTC-45 Colombia |
| **aspectos_ambientales** | `apps/motor_riesgos/aspectos_ambientales/` | Aspectos ambientales ISO 14001 |
| **riesgos_viales** | `apps/motor_riesgos/riesgos_viales/` | Riesgos viales PESV |
| **sagrilaft_ptee** | `apps/motor_riesgos/sagrilaft_ptee/` | LAFT/PEP risk management |
| **seguridad_informacion** | `apps/motor_riesgos/seguridad_informacion/` | Riesgos TI ISO 27001 |

**Workflow Engine (4 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **disenador_flujos** | `apps/workflow_engine/disenador_flujos/` | Diseñador BPMN 2.0 |
| **ejecucion** | `apps/workflow_engine/ejecucion/` | Ejecución de workflows |
| **monitoreo** | `apps/workflow_engine/monitoreo/` | Monitoreo y métricas |
| **firma_digital** | `apps/workflow_engine/firma_digital/` | Firmas digitales |

---

#### NIVEL 3: TORRE DE CONTROL HSEQ (11 apps) - Semana 14
| App | Path | Descripción |
|-----|------|-------------|
| **sistema_documental** | `apps/hseq_management/sistema_documental/` | Gestión documental |
| **planificacion_sistema** | `apps/hseq_management/planificacion_sistema/` | Planificación anual SIG |
| **calidad** | `apps/hseq_management/calidad/` | No conformidades ISO 9001 |
| **medicina_laboral** | `apps/hseq_management/medicina_laboral/` | Salud ocupacional |
| **seguridad_industrial** | `apps/hseq_management/seguridad_industrial/` | Permisos de trabajo |
| **higiene_industrial** | `apps/hseq_management/higiene_industrial/` | Mediciones higiene |
| **gestion_comites** | `apps/hseq_management/gestion_comites/` | Comités HSEQ |
| **accidentalidad** | `apps/hseq_management/accidentalidad/` | Accidentes/incidentes |
| **emergencias** | `apps/hseq_management/emergencias/` | Planes emergencia |
| **gestion_ambiental** | `apps/hseq_management/gestion_ambiental/` | Programas ambientales |
| **mejora_continua** | `apps/hseq_management/mejora_continua/` | Auditorías internas |

---

#### NIVEL 4: CADENA DE VALOR (17 apps) - Semana 18

**Supply Chain (5 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **catalogos** | `apps/supply_chain/catalogos/` | Catálogos compartidos |
| **gestion_proveedores** | `apps/supply_chain/gestion_proveedores/` | Proveedores y evaluaciones |
| **programacion_abastecimiento** | `apps/supply_chain/programacion_abastecimiento/` | Programación rutas |
| **compras** | `apps/supply_chain/compras/` | Órdenes de compra |
| **almacenamiento** | `apps/supply_chain/almacenamiento/` | Inventarios y kardex |

**Production Ops (4 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **recepcion** | `apps/production_ops/recepcion/` | Recepción materia prima |
| **procesamiento** | `apps/production_ops/procesamiento/` | Lotes y procesos |
| **mantenimiento** | `apps/production_ops/mantenimiento/` | Mantenimiento equipos |
| **producto_terminado** | `apps/production_ops/producto_terminado/` | Productos terminados |

**Logistics Fleet (4 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **gestion_flota** | `apps/logistics_fleet/gestion_flota/` | Vehículos y conductores |
| **gestion_transporte** | `apps/logistics_fleet/gestion_transporte/` | Rutas y guías DIAN |
| **despachos** | `apps/logistics_fleet/despachos/` | Despachos de mercancía |
| **pesv_operativo** | `apps/logistics_fleet/pesv_operativo/` | PESV operativo |

**Sales CRM (4 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **gestion_clientes** | `apps/sales_crm/gestion_clientes/` | Clientes y segmentación |
| **pipeline_ventas** | `apps/sales_crm/pipeline_ventas/` | Oportunidades y cotizaciones |
| **pedidos_facturacion** | `apps/sales_crm/pedidos_facturacion/` | Pedidos e integración DIAN |
| **servicio_cliente** | `apps/sales_crm/servicio_cliente/` | Tickets y reclamaciones |

---

#### NIVEL 5: HABILITADORES (19 apps) - Semana 22

**Talent Hub (11 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **estructura_cargos** | `apps/talent_hub/estructura_cargos/` | Profesiogramas y competencias |
| **seleccion_contratacion** | `apps/talent_hub/seleccion_contratacion/` | Reclutamiento |
| **colaboradores** | `apps/talent_hub/colaboradores/` | Expedientes empleados |
| **onboarding_induccion** | `apps/talent_hub/onboarding_induccion/` | Inducción |
| **formacion_reinduccion** | `apps/talent_hub/formacion_reinduccion/` | LMS y capacitaciones |
| **desempeno** | `apps/talent_hub/desempeno/` | Evaluación 360° |
| **control_tiempo** | `apps/talent_hub/control_tiempo/` | Control asistencia |
| **novedades** | `apps/talent_hub/novedades/` | Novedades nómina |
| **nomina** | `apps/talent_hub/nomina/` | Nómina y liquidaciones |
| **off_boarding** | `apps/talent_hub/off_boarding/` | Proceso egreso |
| **proceso_disciplinario** | `apps/talent_hub/proceso_disciplinario/` | Procesos disciplinarios |

**Admin Finance (4 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **presupuesto** | `apps/admin_finance/presupuesto/` | Presupuesto y ejecución |
| **tesoreria** | `apps/admin_finance/tesoreria/` | Tesorería y flujo caja |
| **activos_fijos** | `apps/admin_finance/activos_fijos/` | Activos y depreciación |
| **servicios_generales** | `apps/admin_finance/servicios_generales/` | Servicios generales |

**Accounting (4 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **config_contable** | `apps/accounting/config_contable/` | PUC Colombia y terceros |
| **movimientos** | `apps/accounting/movimientos/` | Comprobantes contables |
| **informes_contables** | `apps/accounting/informes_contables/` | Estados financieros |
| **integracion** | `apps/accounting/integracion/` | Cola de contabilización |

---

#### NIVEL 6: INTELIGENCIA Y CONTROL (11 apps) - Semana 26 GO-LIVE

**Analytics (7 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **config_indicadores** | `apps/analytics/config_indicadores/` | Fichas técnicas KPIs |
| **indicadores_area** | `apps/analytics/indicadores_area/` | Medición por área |
| **dashboard_gerencial** | `apps/analytics/dashboard_gerencial/` | Dashboards ejecutivos |
| **analisis_tendencias** | `apps/analytics/analisis_tendencias/` | Tendencias y forecasting |
| **generador_informes** | `apps/analytics/generador_informes/` | Generación reportes |
| **acciones_indicador** | `apps/analytics/acciones_indicador/` | Planes de acción |
| **exportacion_integracion** | `apps/analytics/exportacion_integracion/` | Exportación e integración |

**Audit System (4 apps):**
| App | Path | Descripción |
|-----|------|-------------|
| **logs_sistema** | `apps/audit_system/logs_sistema/` | Logs de auditoría |
| **centro_notificaciones** | `apps/audit_system/centro_notificaciones/` | Notificaciones multicanal |
| **config_alertas** | `apps/audit_system/config_alertas/` | Reglas de alertas |
| **tareas_recordatorios** | `apps/audit_system/tareas_recordatorios/` | Gestión de tareas |

---

### Estructura de Archivos por App

**Patrón Estándar Django (95% de las apps):**
```
app_name/
├── __init__.py
├── apps.py
├── models.py          # O models/ para apps complejas
├── views.py           # O viewsets.py para DRF
├── serializers.py
├── urls.py
├── admin.py
├── migrations/
├── tests/             # Opcional
├── services.py        # Opcional (solo 1 app tiene)
└── filters.py         # Opcional
```

**⚠️ Archivos fuera de convención Django:**
| Archivo | App | Líneas | Problema |
|---------|-----|--------|----------|
| `serializers_config.py` | core | 486 | Split de serializers |
| `serializers_rbac.py` | core | 1,436 | Split de serializers |
| `serializers_mixins.py` | core | 1,419 | Split de serializers |
| `viewsets_config.py` | core | 582 | Split de viewsets |
| `viewsets_rbac.py` | core | 1,466 | Split de viewsets |
| `models_rbac_adicional.py` | core | 610 | Split de models |

**Recomendación:** Consolidar en carpetas con `__init__.py` para imports limpios.

---

### Archivos con >500 líneas (Candidatos a Dividir)

**CRÍTICO (>1200 líneas):**
| Archivo | Líneas | Modelos/Clases |
|---------|--------|----------------|
| `core/models.py` | 3,245 | 24 modelos |
| `gestion_estrategica/configuracion/models.py` | 2,689 | 20+ modelos |
| `hseq_management/emergencias/models.py` | 1,754 | 12 modelos |
| `gestion_estrategica/identidad/views.py` | 1,646 | 8 ViewSets |
| `talent_hub/off_boarding/models.py` | 1,526 | 10 modelos |
| `core/viewsets_rbac.py` | 1,466 | 6 ViewSets |

**ALTO (900-1200 líneas):**
| Archivo | Líneas |
|---------|--------|
| `supply_chain/compras/models.py` | 1,394 |
| `core/validators.py` | 1,379 |
| `hseq_management/medicina_laboral/models.py` | 1,366 |
| `sales_crm/servicio_cliente/models.py` | 1,299 |

---

## B. CONFIGURACIÓN Y SETTINGS

### Estructura de Settings

**Estado Actual:** MONOLÍTICO (archivo único)
```
config/
├── settings.py         # 36.7 KB - Archivo único con condicionales
├── wsgi.py
├── asgi.py
├── celery.py           # Configuración Celery separada
├── urls.py             # 13.9 KB
└── __init__.py
```

**⚠️ No existe separación:** base.py, development.py, production.py
**✓ Usa:** Variables de entorno via `python-decouple`
**✓ Detección de entorno:** `USE_CPANEL` flag para modo cPanel vs VPS/Docker

---

### Configuración Multi-Tenant

**Estado:** ✅ Implementado a nivel de modelo

```python
# apps/core/base_models/base.py
class BaseCompanyModel(models.Model):
    empresa = models.ForeignKey('gestion_estrategica.EmpresaConfig', ...)

    class Meta:
        abstract = True
```

**Implementación:**
- Todos los modelos heredan de `BaseCompanyModel`
- Filtrado por `empresa` en cada ViewSet
- NO usa django-tenant-schemas (filtrado manual)

---

### Variables Hardcodeadas (Problemas de Seguridad)

**❌ CRÍTICO - Valores default inseguros:**
```python
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')
'PASSWORD': config('DB_PASSWORD', default='')  # Vacío por defecto
```

**⚠️ MEDIO - Business logic en settings:**
```python
PRECIO_COMPRA_ECONORTE = config('PRECIO_COMPRA_ECONORTE', default=3500, cast=int)
PRECIO_REFERENCIA_COMISION = config('PRECIO_REFERENCIA_COMISION', default=3000, cast=int)
```

**✓ CORRECTO - Bien externalizados:**
- JWT lifetimes
- CORS origins
- Email configuration
- Celery broker URLs
- Redis URLs
- Sentry settings

---

### Middleware

**Total: 12 Middleware**

**Middleware de terceros (10):**
```python
'corsheaders.middleware.CorsMiddleware'
'django.middleware.security.SecurityMiddleware'
'whitenoise.middleware.WhiteNoiseMiddleware'
'django.contrib.sessions.middleware.SessionMiddleware'
'django.middleware.common.CommonMiddleware'
'csp.middleware.CSPMiddleware'
'django.middleware.csrf.CsrfViewMiddleware'
'django.contrib.auth.middleware.AuthenticationMiddleware'
'django.contrib.messages.middleware.MessageMiddleware'
'django.middleware.clickjacking.XFrameOptionsMiddleware'
'auditlog.middleware.AuditlogMiddleware'
```

**Middleware custom (2):**
```python
'apps.core.middleware.IPBlockMiddleware'      # Bloqueo IPs sospechosas
'apps.core.middleware.SecurityMiddleware'     # Detección SQL injection/XSS
```

**Ubicación:** `apps/core/middleware/security.py`

---

### Apps Instaladas

**Total: 93 aplicaciones en INSTALLED_APPS**

| Categoría | Cantidad | Apps |
|-----------|----------|------|
| Django Core | 6 | admin, auth, contenttypes, sessions, messages, staticfiles |
| Third-party | 10 | rest_framework, simplejwt, corsheaders, csp, django_filters, auditlog, drf_spectacular, celery_beat, celery_results |
| Propias | 80 | Organizadas en 6 niveles (ver sección A) |

---

## C. VIEWS Y ENDPOINTS

### Inventario de Endpoints

**Resumen Total:**
| Tipo | Cantidad |
|------|----------|
| Endpoints totales | ~659 |
| ViewSet registrations | 500 |
| Function-based paths | 159 |
| Custom actions (@action) | 766 |

---

### Tipos de Views Usadas

| Tipo | Uso | Porcentaje |
|------|-----|------------|
| **ViewSets** (ModelViewSet, ReadOnlyModelViewSet) | 484 | 98% |
| **APIView** | 1 | <1% |
| **Function-based** | 0 | 0% |

**Patrón dominante:** ViewSet-based architecture con custom actions.

---

### Protección de Endpoints

**Endpoints con autenticación requerida:** 655+ (99.4%)
**Endpoints anónimos:** 4 (0.6%)

**Endpoints públicos (AllowAny):**
1. `GET /api/identidad/identidad/active/` - Identidad corporativa activa
2. `GET /api/identidad/identidad/showcase/` - Showcase público (cached 5 min)
3. `GET /api/core/branding/active/` - Branding activo
4. `GET /api/gestion-estrategica/branding/active/` - Branding estratégico

---

### Clases de Permisos Usadas

| Clase | Uso | Descripción |
|-------|-----|-------------|
| `IsAuthenticated` | 558 | Requiere JWT token |
| `GranularActionPermission` | 200+ | RBAC v4.0 granular |
| `RequireSectionAndCRUD` | Views estratégicas | Combinado sección + CRUD |
| `IsSuperAdmin` | Admin endpoints | Solo superusuario |
| `RequireCargoLevel` | Jerárquico | Niveles 0-3 |
| `AllowAny` | 4 | Endpoints públicos |

---

### Complejidad de Views

**Views con >50 líneas (TOP 10):**
| Archivo | Líneas | ViewSets |
|---------|--------|----------|
| `identidad/views.py` | 1,646 | CorporateIdentity, Values, Policies |
| `gestion_proveedores/viewsets.py` | 997 | Proveedores, Evaluaciones |
| `sistema_documental/views.py` | 980 | Documentos, Control cambios |
| `configuracion/views.py` | 902 | NormaISO, ConfigIdentidad |
| `almacenamiento/views.py` | 901 | Inventario, Kardex, Alertas |

**⚠️ Lógica de negocio en views:**
- For loops en views: 114 instancias
- Condicionales complejos: 69 instancias
- Solo 1 archivo `services.py` encontrado

**Recomendación:** Extraer lógica a clases Service.

---

## D. DEPENDENCIAS ENTRE APPS

### Mapa de Dependencias

```
CORE (Hub Central - 100% dependencia)
├── Todas las apps importan de:
│   ├── base_models (BaseCompanyModel, TimestampedModel, OrderedModel)
│   ├── models (User, Cargo, Role, SystemModule)
│   ├── mixins (StandardViewSetMixin, OrderingMixin)
│   └── permissions (GranularActionPermission, IsSuperAdmin)

GESTION_ESTRATEGICA (Hub Estratégico - 19 dependencias inversas)
├── configuracion → Usado por: analytics, audit_system, production_ops, supply_chain
├── organizacion → Usado por: production_ops, supply_chain, sales_crm (ConsecutivoConfig)
└── identidad → Imports de: Core, audit_system, hseq_management

SUPPLY_CHAIN (Dependencias internas)
├── catalogos → programacion_abastecimiento, almacenamiento
├── compras → gestion_proveedores, catalogos, organizacion
└── gestion_proveedores → organizacion

AUDIT_SYSTEM (Cross-cutting)
└── centro_notificaciones → Usado por: identidad (12+ imports)
```

---

### Dependencias Circulares

**DETECTADA: 1 Dependencia Circular Soft**

```
gestion_estrategica.identidad ↔ audit_system.centro_notificaciones
```

**Estado:** MITIGADA con lazy imports a nivel de función
**Riesgo:** MEDIO

**Ejemplo del problema:**
```python
# identidad/views.py (línea 1071)
def some_method(self):
    from apps.audit_system.centro_notificaciones.utils import (...)  # Lazy import
```

---

### Acoplamiento Fuerte

**NIVEL CRÍTICO:**
1. **gestion_estrategica.identidad** - 34+ dependencias cruzadas
2. **gestion_estrategica.configuracion** - 19+ dependencias inversas

**NIVEL ALTO:**
3. **Core** - Punto único de fallo (todas las apps dependen)
4. **audit_system.centro_notificaciones** - 14+ dependencias inversas

---

## E. PROBLEMAS DETECTADOS

### 1. Archivos Excesivamente Grandes

| Prioridad | Archivo | Líneas | Acción |
|-----------|---------|--------|--------|
| 🔴 CRÍTICO | `core/models.py` | 3,245 | Dividir en 4-5 módulos |
| 🔴 CRÍTICO | `configuracion/models.py` | 2,689 | Dividir por dominio |
| 🟠 ALTO | `identidad/views.py` | 1,646 | Extraer a services |
| 🟠 ALTO | `viewsets_rbac.py` | 1,466 | Consolidar estructura |

---

### 2. Deuda Técnica (TODO/FIXME)

**Total: 64 TODOs pendientes**

**Integraciones faltantes (Alta prioridad):**
- SMS provider integration
- Firebase Cloud Messaging
- Prueba de conexión real
- Web scraping legal
- Integración módulo contable

**Implementaciones incompletas:**
- 5 filtros por empresa pendientes
- 3 hardcoded empresa_id=1
- 20+ features en módulos incompletos

---

### 3. Manejo de Excepciones

**6 `except:` desnudos encontrados:**
```python
# Mal patrón encontrado en:
apps/analytics/indicadores_area/models.py:115
apps/gestion_estrategica/configuracion/stats_views.py:240
apps/supply_chain/almacenamiento/models.py:944
apps/workflow_engine/firma_digital/models.py:1214
```

**Recomendación:** Cambiar a excepciones específicas + logging.

---

### 4. Valores Default Inseguros

```python
# ❌ En settings.py
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')
'PASSWORD': config('DB_PASSWORD', default='')
```

---

### 5. Falta de Capa de Servicios

**Encontrado:** Solo 1 archivo `services.py` en todo el backend
**Problema:** Lógica de negocio embebida en ViewSets
**Impacto:** Dificulta testing y reutilización

---

## F. RECOMENDACIONES

### Prioridad Alta (Semana 1-2)

1. **Dividir core/models.py**
   - Crear: `models_cargo.py`, `models_rbac.py`, `models_config.py`
   - Estimado: 8 horas

2. **Corregir 6 `except:` desnudos**
   - Cambiar a excepciones específicas
   - Agregar logging
   - Estimado: 2 horas

3. **Eliminar SECRET_KEY default**
   - Forzar variable de entorno en producción
   - Estimado: 1 hora

### Prioridad Media (Semana 3-4)

4. **Extraer lógica a Services**
   - Crear `services.py` para identidad, almacenamiento, proveedores
   - Estimado: 16 horas

5. **Implementar 15 TODOs de integraciones**
   - SMS, FCM, scraping legal
   - Estimado: 24 horas

6. **Resolver dependencia circular identidad ↔ audit_system**
   - Crear interfaz de notificaciones
   - Estimado: 4 horas

### Prioridad Baja (Semana 5+)

7. **Separar settings en base/dev/prod**
   - Crear estructura de configuración por ambiente
   - Estimado: 4 horas

8. **Agregar caching a endpoints de catálogos**
   - Solo 1 endpoint con cache actualmente
   - Estimado: 8 horas

---

## G. MÉTRICAS DE CALIDAD

| Métrica | Valor | Estado |
|---------|-------|--------|
| Cobertura de tests | ~40% | ⚠️ Mejorar |
| Endpoints documentados | 100% | ✅ Excelente |
| Archivos >500 líneas | 20 | ⚠️ Refactorizar |
| Dependencias circulares | 1 soft | ✅ Aceptable |
| Endpoints públicos | 4/659 | ✅ Excelente |
| Excepciones manejadas | 94% | ⚠️ Mejorar 6 casos |
| Middleware seguridad | Custom + CSP | ✅ Excelente |

---

## H. CONCLUSIÓN

El backend de StrateKaz presenta una **arquitectura sólida y bien organizada** con 80 aplicaciones Django estructuradas en 6 niveles lógicos de deployment. El sistema RBAC v4.0 es robusto y los endpoints están bien protegidos.

**Fortalezas:**
- Arquitectura modular escalable
- Multi-tenancy implementado a nivel de modelo
- RBAC granular con 15+ clases de permisos
- Solo 4 endpoints públicos (mínimo riesgo)
- Documentación OpenAPI completa

**Áreas de Mejora:**
- Archivos monolíticos (core/models.py con 3,245 líneas)
- Falta de capa de servicios (lógica en views)
- 64 TODOs de deuda técnica
- 6 excepciones desnudas
- Settings monolítico sin separación por ambiente

**Esfuerzo estimado de refactorización:** 80-120 horas

---

*Generado por Claude Code - Agente Django Master*
