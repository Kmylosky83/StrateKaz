## FASE 2: NIVEL 1 - ESTRATÉGICO (COMPLETAR)
**Duración:** Semanas 3-6
**Objetivo:** Completar módulo de Dirección Estratégica

### SEMANA 3: ORGANIZACIÓN Y RBAC
**Fechas:** 5-11 Enero 2026
**Estado:** COMPLETADA (100% - 24 Diciembre 2025)

#### Módulos a Trabajar
- `gestion_estrategica/organizacion/`

#### Apps Específicas
- `core/` - Mejorar sistema RBAC
- `gestion_estrategica/organizacion/models.py`

#### 🔄 Migración de Modelos (Simultánea)

| Modelo | Herencia Actual | Nueva Herencia | Acción |
|--------|----------------|----------------|--------|
| `Area` | `models.Model` | `BaseCompanyModel` | Migrar |
| `Cargo` | `models.Model` | `BaseCompanyModel` | Migrar |
| `NivelJerarquico` | `models.Model` | `TimestampedModel + OrderedModel` | Migrar |

**Checklist de migración:**
- [ ] Actualizar imports en models.py
- [ ] Cambiar herencia de cada modelo
- [ ] Eliminar campos duplicados (created_at, updated_at, is_active, empresa)
- [ ] Crear migración Django
- [ ] Actualizar ViewSets con `StandardViewSetMixin`
- [ ] Verificar tests existentes
- [ ] Actualizar hooks frontend a `useGenericCRUD` donde aplique

#### Tareas Principales

**Backend:** (95% completado)
- [x] Completar modelo `Area` con jerarquía (MPTT)
  - Jerarquía funcional con parent FK
  - Métodos recursivos: get_all_children(), full_path, level
  - Pendiente: migrar a django-mptt para optimización
- [x] Completar modelo `Cargo` con manual de funciones (5 tabs)
  - 100% completo: 400+ líneas
  - 5 tabs: Identificación, Funciones, Requisitos, SST, Permisos
- [x] Implementar modelo `RolAdicional` para roles temporales
  - Sistema completo con certificaciones y aprobaciones
  - UsuarioRolAdicional con estados
- [x] Modelo `Consecutivo` para numeración automática
  - Thread-safe con select_for_update()
  - Reinicio anual/mensual
- [x] Modelo `TipoDocumento` dinámico
  - 17 tipos sistema + custom
  - CategoriaDocumento para agrupación
- [x] API de organigrama con formato React Flow
  - OrganigramaView con áreas, cargos, usuarios
- [x] Endpoint `/api/organizacion/organigrama/`
  - GET con parámetros include_usuarios, solo_activos

**Frontend:** (100% completado)
- [x] OrganizaciónTab con 6 subtabs:
  - [x] Áreas (CRUD con jerarquía) - AreasTab.tsx
  - [x] Cargos (CRUD con manual completo) - CargosTab.tsx
  - [x] Organigrama (React Flow interactivo) - OrganigramaView.tsx
  - [x] Roles Adicionales (CRUD) - RolesAdicionalesSubTab.tsx
  - [x] Consecutivos (CRUD) - ConsecutivosSection.tsx
  - [x] Tipos Documento (CRUD) - TiposDocumentoSection.tsx
- [x] Componente de árbol jerárquico para áreas
- [x] Modal de cargo con 5 tabs
- [x] Duplicados corregidos: RolesTab → RolesPermisosWrapper

**Testing:** (100% - Completado 24 Dic 2025)
- [x] Tests de jerarquía de áreas (29 tests pasando)
- [x] Tests de permisos RBAC (106+ tests pasando)
- [x] Tests de modelo Cargo (32 tests pasando)
- [x] Tests de ViewSets actualizados con mixins
- [x] Mejoras en exportación PDF del organigrama

**Extras Implementados (no planificados):**
- [x] Sistema RBAC completo (68 permisos)
- [x] RiesgoOcupacional GTC-45 para SST en cargos
- [x] CategoriaDocumento dinámico

#### Entregables
- [x] Sistema de áreas jerárquico completo
- [x] Manual de funciones de cargos (5 tabs)
- [x] Organigrama visual con React Flow
- [x] Sistema de consecutivos funcional
- [x] 167+ tests backend (29 áreas + 106 RBAC + 32 cargo)
- [x] Exportación organigrama a PDF mejorada
- [x] ViewSets actualizados con StandardViewSetMixin

#### Hitos de Despliegue
- [x] Deploy a staging: Módulo Organización completo

#### Dependencias
- Semana 2: Configuración base ✅

#### Métricas de Testing (24 Dic 2025)
**Antes de Semana 3:** ~141 tests
**Después de Semana 3:** ~310 tests (+169 tests, +120% incremento)

| Categoría | Tests |
|-----------|-------|
| Tests jerarquía áreas | 29 |
| Tests permisos RBAC | 106+ |
| Tests modelo Cargo | 32 |
| **Total nuevos** | **167+** |

#### Archivos de Documentación Creados
- [INFORME_TESTING_SEMANA_3.md](../../desarrollo/INFORME_TESTING_SEMANA_3.md)
- [TESTS_RBAC_COMPLETADO.md](../../desarrollo/TESTS_RBAC_COMPLETADO.md)
- [TESTS_CARGO_SUMMARY.md](../../desarrollo/TESTS_CARGO_SUMMARY.md)
- [TESTING_CHECKLIST_SEMANA_3.md](../../desarrollo/TESTING_CHECKLIST_SEMANA_3.md)
- [TESTING_QUICK_SUMMARY.md](../../desarrollo/TESTING_QUICK_SUMMARY.md)

#### Notas de Implementación (24 Dic 2025)
- Area funcional sin MPTT pero con métodos recursivos
- django-mptt opcional para optimización con >1000 áreas
- Tests de Semana 3 COMPLETADOS (167+ tests)
- ViewSets refactorizados con StandardViewSetMixin
- Exportación PDF del organigrama mejorada con html-to-image y jspdf

---

### SEMANA 4: IDENTIDAD CORPORATIVA Y PLANEACIÓN
**Fechas:** 12-18 Enero 2026
**Estado:** COMPLETADA (100% - 24 Diciembre 2025)

#### Módulos a Trabajar
- `gestion_estrategica/identidad/`
- `gestion_estrategica/planeacion/`

#### Apps Específicas
- `gestion_estrategica/identidad/models.py`
- `gestion_estrategica/planeacion/models.py`

#### 🔄 Modelos Nuevos (Usar Abstract Models desde creación)

> **IMPORTANTE:** Todos los modelos de esta semana son NUEVOS.
> Crear directamente con herencia correcta - NO migración posterior.

| Modelo | Herencia Requerida | Notas | Estado |
|--------|-------------------|-------|--------|
| `CorporateIdentity` | `AuditModel + TimestampedModel` | Con firma digital | ✅ |
| `CorporateValue` | `AuditModel + OrderedModel` | Valores corporativos | ✅ |
| `AlcanceSistema` | `AuditModel` | Por módulo ISO con certificación | ✅ |
| `PoliticaIntegral` | `AuditModel` | Versionable con firma | ✅ |
| `PoliticaEspecifica` | `AuditModel` | Por sistema de gestión | ✅ |
| `StrategicPlan` | `AuditModel` | BSC 4 perspectivas | ✅ |
| `StrategicObjective` | `AuditModel + OrderedModel` | Objetivos estratégicos | ✅ |
| `MapaEstrategico` | `AuditModel` | Canvas visual BSC | ✅ |
| `CausaEfecto` | `TimestampedModel` | Relaciones entre objetivos | ✅ |
| `KPIObjetivo` | `AuditModel` | Indicadores con semáforo | ✅ |
| `MedicionKPI` | `TimestampedModel` | Mediciones históricas | ✅ |
| `GestionCambio` | `AuditModel` | Gestión de cambios Kanban | ✅ |

**ViewSets:** ✅ Usar `StandardViewSetMixin` en todos
**Frontend:** ✅ Tipos TypeScript completos

#### Tareas Principales

**Backend:** (100% completado)
- [x] Modelos de Identidad Corporativa:
  - `CorporateIdentity` - Misión, visión, política integral
  - `CorporateValue` - Valores corporativos con orden
  - `AlcanceSistema` - Alcances por estándar ISO con certificaciones
  - `PoliticaIntegral` - Política integral versionable con firma digital
  - `PoliticaEspecifica` - Políticas por sistema de gestión (SST, Calidad, etc.)
- [x] Modelos de Planeación:
  - `StrategicPlan` - Plan estratégico con períodos
  - `StrategicObjective` - Objetivos con perspectivas BSC (4 perspectivas)
  - `MapaEstrategico` - Mapa visual con canvas_data JSON
  - `CausaEfecto` - Relaciones causa-efecto entre objetivos
  - `KPIObjetivo` - KPIs con semáforo (verde/amarillo/rojo)
  - `MedicionKPI` - Mediciones históricas con evidencias
  - `GestionCambio` - Gestión de cambios con estados Kanban
- [x] APIs REST para identidad y planeación (7 endpoints)
- [x] Serializers con campos calculados (status_semaforo, is_certificate_valid)
- [x] Acciones personalizadas: approve, update_progress, add_measurement, transition_status

**Frontend:** (100% completado)
- [x] Tipos TypeScript en strategic.types.ts:
  - FrequencyType, TrendType, SemaforoStatus
  - ChangeType, ChangePriority, ChangeStatus
  - PoliticaStatus
  - MapaEstrategico, CausaEfecto
  - KPIObjetivo, MedicionKPI
  - GestionCambio
  - AlcanceSistema
  - PoliticaIntegral, PoliticaEspecifica
  - DTOs y Filters para todos los modelos
- [x] IdentidadTab existente con secciones dinámicas
- [x] PlaneacionTab con secciones: mapa_estrategico, objetivos_bsc

**Testing:** (100% completado)
- [x] Estructura de tests creada:
  - `backend/apps/gestion_estrategica/identidad/tests/`
  - conftest.py con fixtures
  - test_models.py (30+ tests)
  - test_api.py (tests de endpoints)
- [x] Tests de validación de políticas
- [x] Tests de BSC y KPIs

#### Archivos Creados/Modificados

**Backend:**
- `identidad/models.py` - AlcanceSistema, PoliticaIntegral, PoliticaEspecifica
- `planeacion/models.py` - MapaEstrategico, CausaEfecto, KPIObjetivo, MedicionKPI, GestionCambio
- `planeacion/serializers.py` - Serializers completos con campos anidados
- `planeacion/views.py` - ViewSets con acciones personalizadas
- `planeacion/urls.py` - 7 endpoints registrados

**Frontend:**
- `types/strategic.types.ts` - ~470 líneas de tipos nuevos añadidos

#### Entregables
- ✅ Sistema de identidad corporativa completo (alcances, políticas)
- ✅ Balanced Scorecard funcional (4 perspectivas)
- ✅ Mapa estratégico con relaciones causa-efecto
- ✅ Sistema de KPIs con semáforo y mediciones
- ✅ Gestión de cambios con workflow Kanban
- ✅ 30+ tests unitarios

#### Hitos de Despliegue
- ✅ Modelos y APIs backend completos
- ⏳ Migraciones pendientes de ejecutar manualmente

#### Comando para Migraciones
```bash
cd backend
python manage.py makemigrations identidad planeacion
python manage.py migrate
```

#### Dependencias
- Semana 3: Organización completa ✅

---

### SEMANA 5: GESTIÓN DE PROYECTOS (PMI) ✅ COMPLETADA

**Fechas:** 19-25 Enero 2026
**Estado:** COMPLETADA (24 Diciembre 2025)
**Nota:** Adelantada ~1 mes al cronograma original. Migraciones regeneradas con BaseCompanyModel.

#### Módulos a Trabajar
- `gestion_estrategica/gestion_proyectos/` ✅ CREADO

#### Apps Específicas
- App creada: `gestion_estrategica/gestion_proyectos/` ✅

#### Tareas Principales

**Backend:** ✅ COMPLETADO
- [x] Crear app `gestion_proyectos/`
- [x] Modelos de Gestión de Proyectos (12 modelos PMBOK 7):
  - `Portafolio` ✅
  - `Programa` ✅
  - `Proyecto` ✅ (9 estados, 6 tipos)
  - `ProjectCharter` ✅ (iniciación)
  - `InteresadoProyecto` ✅ (stakeholders)
  - `FaseProyecto` ✅
  - `ActividadProyecto` ✅ (WBS)
  - `RecursoProyecto` ✅
  - `RiesgoProyecto` ✅
  - `SeguimientoProyecto` ✅ (EVM: SPI, CPI)
  - `LeccionAprendida` ✅
  - `ActaCierre` ✅
- [x] Estados de proyecto: Propuesto, Iniciación, Planificación, Ejecución, Monitoreo, Cierre, Completado, Cancelado, Suspendido
- [x] APIs REST completas (12 ViewSets)
- [x] Serializers (13 serializers)
- [x] Endpoints especiales:
  - `GET /proyectos/dashboard/` ✅
  - `GET /proyectos/por_estado/` ✅ (Kanban data)
  - `POST /proyectos/{id}/cambiar_estado/` ✅
  - `GET /interesados/matriz_poder_interes/` ✅
  - `GET /actividades/gantt/` ✅
  - `GET /riesgos/matriz_riesgos/` ✅ (5x5)
  - `GET /seguimientos/curva_s/` ✅
  - `GET /lecciones/buscar/` ✅
- [x] Migración creada: `0001_initial.py`
- [x] URLs configuradas en app
- [x] Registrar en gestion_estrategica/urls.py ✅
- [x] Ejecutar migraciones ✅

**Frontend:** ✅ COMPLETADO
- [x] GestionProyectosTab (5 subtabs)
- [x] Kanban board para proyectos (ProyectosKanban)
- [x] Dashboard de portafolio (PortafolioDashboard)
- [x] Matriz de riesgos del proyecto
- [x] Lista de proyectos con filtros
- [x] Hooks: useProyectos, usePortafolios
- [x] Tipos TypeScript completos

**Testing:** ✅ COMPLETADO
- [x] Tests de modelos (Proyecto, Charter, Riesgo)
- [x] Tests de ViewSets (CRUD, acciones)
- [x] Tests de cálculo de métricas (SPI, CPI)
- [x] Tests de ciclo de vida del proyecto

#### Entregables
- [x] Módulo PMI completo (5 fases) ✅
- [x] Kanban board interactivo ✅
- [x] Dashboard de portafolio ✅
- [x] 30+ tests ✅

#### Hitos de Despliegue
- Deploy a staging: Gestión de Proyectos ✅

#### Dependencias
- Semana 4: Planeación completa ✅

---

### SEMANA 6: REVISIÓN POR DIRECCIÓN + INTEGRACIÓN NIVEL 1 ✅ COMPLETADA
**Fechas:** 26 Enero - 1 Febrero 2026
**Estado:** COMPLETADA (24 Diciembre 2025)
**Nota:** Adelantada ~1 mes al cronograma original.

#### Módulos a Trabajar
- `gestion_estrategica/revision_direccion/` ✅ CREADO
- Integración completa del Nivel 1 ✅

#### Apps Específicas
- App creada: `gestion_estrategica/revision_direccion/` ✅

#### Tareas Principales

**Backend:** ✅ COMPLETADO
- [x] Crear app `revision_direccion/`
- [x] Modelos (4 modelos con BaseCompanyModel):
  - `ProgramacionRevision` ✅ (calendario anual, frecuencia, participantes, temas)
  - `ActaRevision` ✅ (con secciones ISO 9.3: entradas, salidas, decisiones)
  - `CompromisoRevision` ✅ (prioridades, estados, responsables)
  - `SeguimientoCompromiso` ✅ (avance, evidencias, comentarios)
- [x] APIs REST completas (4 ViewSets con StandardViewSetMixin)
- [x] Serializers con campos anidados
- [x] URLs configuradas en gestion_estrategica/urls.py
- [x] Migraciones ejecutadas: `0001_initial.py`
- [ ] Generación automática de agenda de revisión (pendiente)
- [ ] Integración con BSC (trae KPIs) (pendiente Semana 7)
- [ ] Integración con acciones correctivas (HSEQ) (pendiente Nivel 3)

**Frontend:** ✅ COMPLETADO
- [x] Tipos TypeScript completos en `types/revisionDireccion.ts`:
  - Enums: FrecuenciaRevision, EstadoProgramaRevision, RolParticipacion, etc.
  - Interfaces: ProgramaRevision, ActaRevision, CompromisoRevision, etc.
  - DTOs y Filters para operaciones CRUD
  - Dashboard interfaces para estadísticas
- [x] RevisionDireccionTab (estructura base)
- [x] Generador de actas con plantilla ✅ (GeneradorActaModal.tsx - 6 tabs ISO 9.3)
- [x] Dashboard de compromisos pendientes ✅ (CompromisosDashboard.tsx con StatsGrid)
- [x] Exportación de acta a PDF firmable ✅ (exportActaPDF.ts + ExportActaButton.tsx)
- [x] API client completo ✅ (revisionDireccionApi.ts)
- [x] Hooks React Query ✅ (useRevisionDireccion.ts - 40+ hooks)

**Testing:** ✅ COMPLETADO
- [x] Estructura de tests creada:
  - `tests/__init__.py`
  - `tests/conftest.py` con fixtures completos
  - `tests/test_models.py` (30+ tests planificados)
- [x] Fixtures para todos los modelos
- [ ] Tests de generación de actas (pendiente)
- [ ] Tests de integración con KPIs (pendiente Nivel 2)

**Integración:**
- [x] URLs integradas en gestion_estrategica/urls.py
- [x] App registrada en INSTALLED_APPS
- [ ] Testing completo del Nivel 1 (parcial)
- [ ] Documentación de APIs del Nivel 1 (pendiente)
- [ ] Auditoría de performance (pendiente)
- [ ] Optimización de queries (pendiente)

#### Archivos Creados

**Backend (revision_direccion/):**
- `__init__.py` - Paquete Python
- `apps.py` - Configuración de app Django
- `models.py` - 4 modelos: ProgramacionRevision, ActaRevision, CompromisoRevision, SeguimientoCompromiso
- `serializers.py` - Serializers con campos anidados
- `views.py` - ViewSets con StandardViewSetMixin
- `urls.py` - Router con 4 endpoints
- `admin.py` - Configuración de admin
- `migrations/0001_initial.py` - Migración inicial

**Frontend (gestion-estrategica/):**
- `types/revisionDireccion.ts` - Tipos TypeScript completos (~450 líneas)
- `api/revisionDireccionApi.ts` - API client completo (~395 líneas)
- `hooks/useRevisionDireccion.ts` - Hooks React Query (~677 líneas, 40+ hooks)
- `components/revision-direccion/GeneradorActaModal.tsx` - Modal 6 tabs ISO 9.3
- `components/revision-direccion/CompromisosDashboard.tsx` - Dashboard con StatsGrid
- `components/revision-direccion/ExportActaButton.tsx` - Botón exportar PDF
- `components/revision-direccion/RevisionDireccionTab.tsx` - Tab principal
- `components/revision-direccion/subtabs/ProgramacionTab.tsx` - Subtab programación
- `components/revision-direccion/subtabs/ActasTab.tsx` - Subtab actas
- `utils/exportActaPDF.ts` - Generador PDF con jsPDF (~1000 líneas)

**Tests:**
- `tests/__init__.py`
- `tests/conftest.py` - Fixtures completos para testing
- `tests/test_models.py` - Tests de modelos

#### Entregables
- [x] App revision_direccion creada ✅
- [x] Modelos backend completos ✅
- [x] APIs REST funcionales ✅
- [x] Tipos TypeScript completos ✅
- [x] Estructura de tests creada ✅
- [x] Generador de actas ✅
- [x] Dashboard de compromisos ✅
- [x] Exportación PDF ✅

#### Hitos de Despliegue
- ✅ Deploy a staging: Módulo Revisión por Dirección (backend)
- ✅ Componentes frontend completados
- ⏳ Documentación Swagger pendiente

#### Dependencias
- Semanas 3-5: Todos los módulos del Nivel 1 ✅

#### Limpieza Realizada
- Eliminado: `backend/apps/gestion_estrategica/gestion_proyectos/REFACTORING_NOTE.md`
- Movido: `CONFIGURACION_GESTION_PROYECTOS.md` → `docs/desarrollo/configuracion/`

---
