# CRONOGRAMA DE DESARROLLO - 26 SEMANAS
# ERP Multi-Empresa StrateKaz

**Fecha de Inicio:** 2025-12-22
**Fecha de Finalización:** 2026-06-28
**Versión:** 1.0.0
**Equipo:** 3-5 desarrolladores (Backend, Frontend, QA, DevOps)

---

## RESUMEN EJECUTIVO

### Estructura del Proyecto

| Métrica | Cantidad |
|---------|----------|
| Niveles Jerárquicos | 6 |
| Módulos Principales | 14 |
| Apps Django | 81 apps |
| Tablas Base de Datos | 154 tablas |
| Endpoints API | ~300 endpoints |

### Arquitectura de Niveles

```
Nivel 1: Estratégico        → Dirección Estratégica (1 módulo)
Nivel 2: Cumplimiento       → Cumplimiento, Riesgos, Workflows (3 módulos)
Nivel 3: Torre de Control   → HSEQ Management (1 módulo)
Nivel 4: Cadena de Valor    → Supply Chain, Producción, Logística, CRM (4 módulos)
Nivel 5: Habilitadores      → Talento, Finanzas, Contabilidad (3 módulos)
Nivel 6: Inteligencia       → Analytics, Auditoría (2 módulos)
```

### Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| Backend | Django 5.0.9 + DRF + MySQL 8.0 |
| Frontend | React 18 + TypeScript + Vite 5 |
| UI/UX | Tailwind CSS + Framer Motion |
| Async Tasks | Celery + Redis |
| DevOps | Docker + Docker Compose |

---

## FASE 1: ESTRUCTURA BASE Y ANÁLISIS
**Duración:** Semanas 1-2
**Objetivo:** Configurar infraestructura y completar análisis técnico

### SEMANA 1: ANÁLISIS Y CONFIGURACIÓN INICIAL
**Fechas:** 22-28 Diciembre 2025

#### Módulos a Trabajar
- Infraestructura base
- Sistema de navegación dinámica
- Base de datos

#### Apps Específicas
- `core/` - Usuario, RBAC, permisos
- `gestion_estrategica/configuracion/` - Configuración base

#### Tareas Principales

**Backend:**
- [ ] Auditoría completa de modelos existentes (154 tablas)
- [ ] Crear diagrama ER completo de la base de datos
- [ ] Documentar relaciones entre apps existentes
- [ ] Configurar entorno de desarrollo local
- [ ] Setup Redis para Celery
- [ ] Configurar logs estructurados

**Frontend:**
- [ ] Auditoría del Design System existente
- [ ] Documentar componentes reutilizables
- [ ] Configurar Storybook para componentes
- [ ] Setup de testing (Vitest + React Testing Library)

**DevOps:**
- [ ] Configurar Docker Compose para desarrollo
- [ ] Setup de CI/CD básico (GitHub Actions)
- [ ] Configurar backups automáticos de BD

#### Entregables
- Diagrama ER completo de BD (archivo Mermaid)
- Documentación de arquitectura actualizada
- Inventario de componentes UI existentes
- Plan de pruebas detallado

#### Hitos de Despliegue
- Entorno de desarrollo estable
- Pipeline CI/CD funcional

#### Dependencias
- Ninguna (inicio del proyecto)

---

### SEMANA 2: CONSOLIDACIÓN NIVEL 1 BASE
**Fechas:** 29 Diciembre - 4 Enero 2026

#### Módulos a Trabajar
- `gestion_estrategica` (consolidación de lo existente)

#### Apps Específicas
- `gestion_estrategica/configuracion/` - Completar modelos
- `gestion_estrategica/identidad/` - Misión, visión, valores
- `gestion_estrategica/organizacion/` - Áreas, cargos, organigrama

#### Tareas Principales

**Backend:**
- [ ] Completar modelo `EmpresaConfig` con todos los campos
- [ ] Crear modelos de `SedeEmpresa` con geolocalización
- [ ] Implementar modelo `BrandingConfig` (logos, colores)
- [ ] Crear modelos de Identidad Corporativa
- [ ] APIs REST para configuración básica

**Frontend:**
- [ ] Completar ConfiguraciónSection (5 subtabs)
  - Datos de Empresa
  - Sedes y Ubicaciones
  - Branding (logos dinámicos)
  - Módulos y Features
  - Integraciones Externas
- [ ] Componente de Organigrama con React Flow
- [ ] Sistema de tabs dinámicos desde API

**Testing:**
- [ ] Tests unitarios para modelos de configuración
- [ ] Tests de API de configuración
- [ ] Tests E2E del flujo de configuración inicial

#### Entregables
- Sistema de configuración base funcional
- Organigrama visual con React Flow
- Branding dinámico implementado
- 20+ tests unitarios pasando

#### Hitos de Despliegue
- Deploy a staging: Configuración base
- Sistema de branding funcional

#### Dependencias
- Semana 1: Infraestructura configurada

---

## FASE 2: NIVEL 1 - ESTRATÉGICO (COMPLETAR)
**Duración:** Semanas 3-6
**Objetivo:** Completar módulo de Dirección Estratégica

### SEMANA 3: ORGANIZACIÓN Y RBAC
**Fechas:** 5-11 Enero 2026

#### Módulos a Trabajar
- `gestion_estrategica/organizacion/`

#### Apps Específicas
- `core/` - Mejorar sistema RBAC
- `gestion_estrategica/organizacion/models.py`

#### Tareas Principales

**Backend:**
- [ ] Completar modelo `Area` con jerarquía (MPTT)
- [ ] Completar modelo `Cargo` con manual de funciones (5 tabs)
- [ ] Implementar modelo `RolAdicional` para roles temporales
- [ ] Modelo `Consecutivo` para numeración automática
- [ ] Modelo `TipoDocumento` dinámico
- [ ] API de organigrama con formato React Flow
- [ ] Endpoint `/api/organizacion/organigrama/`

**Frontend:**
- [ ] OrganizaciónTab con 6 subtabs:
  - Áreas (CRUD con jerarquía)
  - Cargos (CRUD con manual completo)
  - Organigrama (React Flow interactivo)
  - Roles Adicionales (CRUD)
  - Consecutivos (CRUD)
  - Tipos Documento (CRUD)
- [ ] Componente de árbol jerárquico para áreas
- [ ] Modal de cargo con 5 tabs (Identificación, Funciones, Requisitos, SST, Permisos)

**Testing:**
- [ ] Tests de jerarquía de áreas (MPTT)
- [ ] Tests de permisos RBAC
- [ ] Tests E2E de creación de cargo completo

#### Entregables
- Sistema de áreas jerárquico completo
- Manual de funciones de cargos (5 tabs)
- Organigrama visual exportable a PDF
- Sistema de consecutivos funcional
- 30+ tests

#### Hitos de Despliegue
- Deploy a staging: Módulo Organización completo

#### Dependencias
- Semana 2: Configuración base

---

### SEMANA 4: IDENTIDAD CORPORATIVA Y PLANEACIÓN
**Fechas:** 12-18 Enero 2026

#### Módulos a Trabajar
- `gestion_estrategica/identidad/`
- `gestion_estrategica/planeacion/`

#### Apps Específicas
- `gestion_estrategica/identidad/models.py`
- `gestion_estrategica/planeacion/models.py`

#### Tareas Principales

**Backend:**
- [ ] Modelos de Identidad Corporativa:
  - `MisionVision`
  - `ValorCorporativo`
  - `AlcanceSistema`
  - `PoliticaIntegral`
  - `PoliticaEspecifica` (por módulo)
- [ ] Modelos de Planeación:
  - `MapaEstrategico` (4 perspectivas BSC)
  - `ObjetivoEstrategico`
  - `KPIObjetivo` (indicadores medibles)
  - `GestionCambio`
- [ ] APIs REST para identidad y planeación

**Frontend:**
- [ ] IdentidadCorporativaTab (5 subtabs)
- [ ] PlaneacionEstrategicaTab (3 subtabs)
- [ ] Visualización de Mapa Estratégico (4 perspectivas)
- [ ] Dashboard de KPIs del BSC
- [ ] Editor WYSIWYG para políticas

**Testing:**
- [ ] Tests de modelos de identidad
- [ ] Tests de BSC y KPIs
- [ ] Tests de validación de políticas

#### Entregables
- Sistema de identidad corporativa completo
- Balanced Scorecard funcional
- Mapa estratégico visual
- 25+ tests

#### Hitos de Despliegue
- Deploy a staging: Identidad + Planeación

#### Dependencias
- Semana 3: Organización completa

---

### SEMANA 5: GESTIÓN DE PROYECTOS (PMI)
**Fechas:** 19-25 Enero 2026

#### Módulos a Trabajar
- `gestion_estrategica/proyectos/` (nuevo)

#### Apps Específicas
- Nueva app: `gestion_estrategica/proyectos/`

#### Tareas Principales

**Backend:**
- [ ] Crear app `proyectos/`
- [ ] Modelos de Gestión de Proyectos:
  - `Portafolio`
  - `Proyecto`
  - `Charter` (iniciación)
  - `PlanProyecto` (planificación)
  - `Entregable`
  - `RiesgoProyecto`
  - `Hito`
  - `CambioProyecto`
- [ ] Estados de proyecto: Iniciación, Planificación, Ejecución, Monitoreo, Cierre
- [ ] APIs REST completas

**Frontend:**
- [ ] GestionProyectosTab (5 subtabs)
- [ ] Kanban board para proyectos
- [ ] Gantt chart para cronograma (react-gantt-chart)
- [ ] Dashboard de portafolio
- [ ] Registro de riesgos del proyecto

**Testing:**
- [ ] Tests de ciclo de vida del proyecto
- [ ] Tests de gestión de cambios
- [ ] Tests de cálculo de métricas (SPI, CPI)

#### Entregables
- Módulo PMI completo (5 fases)
- Gantt chart interactivo
- Dashboard de portafolio
- 30+ tests

#### Hitos de Despliegue
- Deploy a staging: Gestión de Proyectos

#### Dependencias
- Semana 4: Planeación completa

---

### SEMANA 6: REVISIÓN POR DIRECCIÓN + INTEGRACIÓN NIVEL 1
**Fechas:** 26 Enero - 1 Febrero 2026

#### Módulos a Trabajar
- `gestion_estrategica/revision_direccion/` (nuevo)
- Integración completa del Nivel 1

#### Apps Específicas
- Nueva app: `gestion_estrategica/revision_direccion/`

#### Tareas Principales

**Backend:**
- [ ] Crear app `revision_direccion/`
- [ ] Modelos:
  - `ProgramacionRevision` (calendario anual)
  - `ActaRevision` (con secciones)
  - `CompromisoRevision`
  - `SeguimientoCompromiso`
- [ ] Generación automática de agenda de revisión
- [ ] Integración con BSC (trae KPIs)
- [ ] Integración con acciones correctivas (HSEQ)

**Frontend:**
- [ ] RevisionDireccionTab (3 subtabs)
- [ ] Generador de actas con plantilla
- [ ] Dashboard de compromisos pendientes
- [ ] Exportación de acta a PDF firmable

**Testing:**
- [ ] Tests de generación de actas
- [ ] Tests de seguimiento de compromisos
- [ ] Tests de integración con KPIs

**Integración:**
- [ ] Testing completo del Nivel 1
- [ ] Documentación de APIs del Nivel 1
- [ ] Auditoría de performance
- [ ] Optimización de queries

#### Entregables
- Módulo Revisión por Dirección completo
- Nivel 1 (Estratégico) 100% funcional
- Documentación de APIs completa
- 40+ tests de integración

#### Hitos de Despliegue
- Deploy a producción: Nivel 1 completo (Dirección Estratégica)
- Documentación Swagger completa del Nivel 1

#### Dependencias
- Semanas 3-5: Todos los módulos del Nivel 1

---

## FASE 3: NIVEL 2 - CUMPLIMIENTO
**Duración:** Semanas 7-10
**Objetivo:** Implementar motores de cumplimiento, riesgos y workflows

### SEMANA 7: MOTOR DE CUMPLIMIENTO - MATRIZ LEGAL
**Fechas:** 2-8 Febrero 2026

#### Módulos a Trabajar
- `motor_cumplimiento/` (nuevo módulo)

#### Apps Específicas
- Nueva app: `motor_cumplimiento/matriz_legal/`
- Nueva app: `motor_cumplimiento/requisitos/`

#### Tareas Principales

**Backend:**
- [ ] Crear módulo `motor_cumplimiento/`
- [ ] Modelos de Matriz Legal:
  - `TipoNorma` (Decreto, Ley, Resolución, Circular, NTC)
  - `Norma`
  - `ArticuloNorma`
  - `RequisitoLegal`
  - `FuenteNormativa`
- [ ] Scraper para actualización automática:
  - Web scraping de sitios oficiales (DIAN, MinTrabajo, etc.)
  - Celery task cada 15 días
- [ ] Modelos de Requisitos:
  - `Licencia`
  - `Permiso`
  - `Concepto`
  - `AlertaVencimiento`

**Frontend:**
- [ ] MatrizLegalTab (6 subtabs):
  - Decretos
  - Leyes
  - Resoluciones
  - Circulares
  - Normas Técnicas
  - Web Scraping (config)
- [ ] Buscador inteligente de normas
- [ ] Vista de requisitos legales con alertas
- [ ] Dashboard de vencimientos

**Celery:**
- [ ] Task: `scrape_legal_updates` (cada 15 días)
- [ ] Task: `check_license_expirations` (diario)

**Testing:**
- [ ] Tests de scraper
- [ ] Tests de alertas de vencimiento
- [ ] Tests de búsqueda de normas

#### Entregables
- Matriz legal funcional con 6 tipos de normas
- Scraper automático configurado
- Sistema de alertas de vencimientos
- 25+ tests

#### Hitos de Despliegue
- Deploy a staging: Módulo Cumplimiento - Matriz Legal

#### Dependencias
- Semana 6: Nivel 1 completo

---

### SEMANA 8: PARTES INTERESADAS Y REGLAMENTOS
**Fechas:** 9-15 Febrero 2026

#### Módulos a Trabajar
- `motor_cumplimiento/partes_interesadas/` (nuevo)
- `motor_cumplimiento/reglamentos/` (nuevo)

#### Apps Específicas
- Nueva app: `motor_cumplimiento/partes_interesadas/`
- Nueva app: `motor_cumplimiento/reglamentos/`

#### Tareas Principales

**Backend:**
- [ ] Modelos de Partes Interesadas:
  - `ParteInteresada` (interno/externo)
  - `RequisitoPI`
  - `ComunicacionPI`
  - `MatrizComunicaciones`
- [ ] Modelos de Reglamentos Internos:
  - `TipoReglamento` (dinámico)
  - `Reglamento`
  - `VersionReglamento`
  - `PublicacionReglamento`
  - `SocializacionReglamento`
- [ ] Versionamiento automático
- [ ] Control de firmas de socialización

**Frontend:**
- [ ] PartesInteresadasTab (3 subtabs)
- [ ] ReglamentosInternosTab (5 subtabs)
- [ ] Matriz de comunicaciones interactiva
- [ ] Generador de reglamentos con plantillas
- [ ] Sistema de socialización con firmas

**Testing:**
- [ ] Tests de versionamiento
- [ ] Tests de matriz de comunicaciones
- [ ] Tests de socialización

#### Entregables
- Gestión de Partes Interesadas completa
- Sistema de reglamentos con versionamiento
- Matriz de comunicaciones
- 30+ tests

#### Hitos de Despliegue
- Deploy a staging: Partes Interesadas + Reglamentos

#### Dependencias
- Semana 7: Matriz Legal

---

### SEMANA 9: MOTOR DE RIESGOS - CONTEXTO Y RIESGOS
**Fechas:** 16-22 Febrero 2026

#### Módulos a Trabajar
- `motor_riesgos/` (nuevo módulo)

#### Apps Específicas
- Nueva app: `motor_riesgos/contexto/`
- Nueva app: `motor_riesgos/riesgos_procesos/`
- Nueva app: `motor_riesgos/ipevr/`

#### Tareas Principales

**Backend:**
- [ ] Crear módulo `motor_riesgos/`
- [ ] Modelos de Contexto Organizacional:
  - `FactorContexto` (Interno/Externo)
  - `AnalisisPCI` (Perfil Capacidad Interna)
  - `AnalisisPOAM` (Perfil Oportunidades Amenazas)
  - `AnalisisPESTEL` (6 factores)
  - `FuerzaPorter` (5 fuerzas)
  - `AnalisisDOFA`
  - `EstrategiaTOWS`
- [ ] Modelos de Riesgos:
  - `RiesgoProceso`
  - `AnalisisRiesgo` (probabilidad x impacto)
  - `TratamientoRiesgo`
  - `Oportunidad`
  - `ControlOperacional`
- [ ] Modelos IPEVR (GTC-45):
  - `PeligroOcupacional` (78 peligros en 7 categorías)
  - `MatrizGTC45`
  - `ControlSST`

**Frontend:**
- [ ] ContextoOrganizacionalTab (7 subtabs)
- [ ] RiesgosOportunidadesTab (5 subtabs)
- [ ] IPEVRTab (5 subtabs)
- [ ] Matriz DOFA visual
- [ ] Mapa de calor de riesgos
- [ ] Matriz GTC-45 interactiva

**Testing:**
- [ ] Tests de análisis DOFA
- [ ] Tests de cálculo de nivel de riesgo
- [ ] Tests de matriz GTC-45

#### Entregables
- Sistema de contexto organizacional completo
- Gestión de riesgos y oportunidades
- Matriz IPEVR (GTC-45) con 78 peligros
- 35+ tests

#### Hitos de Despliegue
- Deploy a staging: Motor de Riesgos (Contexto + IPEVR)

#### Dependencies
- Semana 8: Cumplimiento completo

---

### SEMANA 10: MOTOR DE RIESGOS - ASPECTOS AMBIENTALES + WORKFLOW ENGINE
**Fechas:** 23 Febrero - 1 Marzo 2026

#### Módulos a Trabajar
- `motor_riesgos/aspectos_ambientales/` (nuevo)
- `motor_riesgos/riesgos_viales/` (nuevo)
- `workflow_engine/` (nuevo módulo)

#### Apps Específicas
- Nueva app: `motor_riesgos/aspectos_ambientales/`
- Nueva app: `motor_riesgos/riesgos_viales/`
- Nuevo módulo: `workflow_engine/`

#### Tareas Principales

**Backend:**
- [ ] Modelos Ambientales:
  - `AspectoAmbiental`
  - `ImpactoAmbiental`
  - `ControlAmbiental`
- [ ] Modelos Riesgos Viales:
  - `Ruta`
  - `PuntoCritico`
  - `ControlVial`
- [ ] Modelos Workflow Engine (BPM):
  - `DefinicionFlujo` (JSON con canvas)
  - `Estado`
  - `Transicion`
  - `Condicion`
  - `InstanciaFlujo`
  - `TareaPendiente`
  - `HistorialFlujo`
- [ ] Motor de ejecución de workflows
- [ ] Sistema de notificaciones por estado

**Frontend:**
- [ ] AspectoAmbientalTab (4 subtabs)
- [ ] RiesgosVialesTab (3 subtabs)
- [ ] DisenadorFlujosTab (canvas visual drag & drop):
  - Canvas con react-flow
  - Estados (nodos)
  - Transiciones (edges)
  - Condiciones
  - Notificaciones
  - Roles por paso
- [ ] EjecucionTab (tareas pendientes)
- [ ] MonitoreoTab (métricas de proceso)

**Testing:**
- [ ] Tests de aspectos ambientales
- [ ] Tests de motor de workflows
- [ ] Tests de ejecución de flujos

#### Entregables
- Aspectos ambientales y riesgos viales
- Motor de Workflows (BPM) funcional
- Designer de flujos visual
- 40+ tests

#### Hitos de Despliegue
- Deploy a producción: Nivel 2 completo (Cumplimiento + Riesgos + Workflows)

#### Dependencias
- Semana 9: Contexto y Riesgos

---

## FASE 4: NIVEL 3 - TORRE DE CONTROL (HSEQ)
**Duración:** Semanas 11-14
**Objetivo:** Implementar sistema integrado de gestión HSEQ

### SEMANA 11: SISTEMA DOCUMENTAL + PLANIFICACIÓN HSEQ
**Fechas:** 2-8 Marzo 2026

#### Módulos a Trabajar
- `hseq_management/` (nuevo módulo)

#### Apps Específicas
- Nueva app: `hseq_management/sistema_documental/`
- Nueva app: `hseq_management/planificacion/`

#### Tareas Principales

**Backend:**
- [ ] Crear módulo `hseq_management/`
- [ ] Modelos de Sistema Documental:
  - `TipoDocumento` (Manual, Procedimiento, Instructivo, Formato)
  - `Documento`
  - `VersionDocumento`
  - `FirmaDigital`
  - `ControlDocumental`
  - `ListadoMaestro`
- [ ] Constructor de documentos dinámico
- [ ] Form Builder para formularios
- [ ] Modelos de Planificación:
  - `PlanTrabajoAnual`
  - `ObjetivoHSEQ` (link a BSC)
  - `ProgramaGestion`
  - `Cronograma`

**Frontend:**
- [ ] SistemaDocumentalTab (6 subtabs)
- [ ] Constructor de documentos (drag & drop)
- [ ] Form Builder visual
- [ ] Sistema de firmas digitales
- [ ] PlanificacionSistemaTab (4 subtabs)
- [ ] Cronograma interactivo

**Testing:**
- [ ] Tests de versionamiento documental
- [ ] Tests de firmas digitales
- [ ] Tests de plan de trabajo

#### Entregables
- Sistema documental completo
- Form Builder funcional
- Firmas digitales implementadas
- Plan de trabajo HSEQ
- 30+ tests

#### Hitos de Despliegue
- Deploy a staging: Sistema Documental + Planificación HSEQ

#### Dependencias
- Semana 10: Workflows completos

---

### SEMANA 12: CALIDAD + MEDICINA LABORAL
**Fechas:** 9-15 Marzo 2026

#### Módulos a Trabajar
- `hseq_management/calidad/` (nuevo)
- `hseq_management/medicina_laboral/` (nuevo)

#### Apps Específicas
- Nueva app: `hseq_management/calidad/`
- Nueva app: `hseq_management/medicina_laboral/`

#### Tareas Principales

**Backend:**
- [ ] Modelos de Calidad:
  - `NoConformidad`
  - `SalidaNoConforme`
  - `ControlCambio`
  - `AccionCorrectiva`
  - `AccionPreventiva`
  - `AccionMejora`
- [ ] Workflow para AC/AP/AM (usa workflow_engine)
- [ ] Modelos de Medicina Laboral:
  - `ExamenMedico` (ingreso, periódico, egreso)
  - `ResultadoExamen`
  - `Restriccion`
  - `VigilanciaEpidemiologica`
  - `EstadisticaSalud`
  - `Diagnostico`

**Frontend:**
- [ ] CalidadTab (3 subtabs)
- [ ] Kanban de NC/AC/AP/AM
- [ ] MedicinaLaboralTab (5 subtabs)
- [ ] Dashboard de restricciones activas
- [ ] Estadísticas de salud ocupacional

**Testing:**
- [ ] Tests de workflow de AC/AP
- [ ] Tests de medicina laboral
- [ ] Tests de vigilancia epidemiológica

#### Entregables
- Módulo de Calidad completo
- Medicina Laboral funcional
- Dashboard de salud ocupacional
- 35+ tests

#### Hitos de Despliegue
- Deploy a staging: Calidad + Medicina Laboral

#### Dependencias
- Semana 11: Sistema Documental

---

### SEMANA 13: SEGURIDAD INDUSTRIAL + ACCIDENTALIDAD
**Fechas:** 16-22 Marzo 2026

#### Módulos a Trabajar
- `hseq_management/seguridad_industrial/` (nuevo)
- `hseq_management/accidentalidad/` (nuevo)

#### Apps Específicas
- Nueva app: `hseq_management/seguridad_industrial/`
- Nueva app: `hseq_management/accidentalidad/`

#### Tareas Principales

**Backend:**
- [ ] Modelos de Seguridad Industrial:
  - `PermisoTrabajo` (alturas, espacios confinados, etc.)
  - `TipoInspeccion` (configurable)
  - `Inspeccion`
  - `ItemInspeccion`
  - `ControlEPP`
  - `AsignacionEPP`
  - `ProgramaSeguridad`
- [ ] Sistema dinámico de inspecciones
- [ ] Modelos de Accidentalidad:
  - `AccidenteTrabajo`
  - `Investigacion`
  - `LeccionAprendida`
  - `PlanAccion`

**Frontend:**
- [ ] SeguridadIndustrialTab (4 subtabs)
- [ ] Constructor de inspecciones dinámicas
- [ ] Control de EPP (asignación/entrega)
- [ ] AccidentalidadTab (4 subtabs)
- [ ] Formulario de investigación de AT
- [ ] Dashboard de indicadores SST (Res.0312)

**Testing:**
- [ ] Tests de permisos de trabajo
- [ ] Tests de inspecciones dinámicas
- [ ] Tests de investigación de AT

#### Entregables
- Seguridad Industrial completa
- Sistema de inspecciones dinámico
- Accidentalidad (ATEL) funcional
- 30+ tests

#### Hitos de Despliegue
- Deploy a staging: Seguridad + Accidentalidad

#### Dependencias
- Semana 12: Calidad + Medicina

---

### SEMANA 14: EMERGENCIAS + AMBIENTAL + MEJORA CONTINUA
**Fechas:** 23-29 Marzo 2026

#### Módulos a Trabajar
- `hseq_management/emergencias/` (nuevo)
- `hseq_management/gestion_ambiental/` (nuevo)
- `hseq_management/mejora_continua/` (nuevo)
- `hseq_management/comites/` (nuevo)

#### Apps Específicas
- Nueva app: `hseq_management/emergencias/`
- Nueva app: `hseq_management/gestion_ambiental/`
- Nueva app: `hseq_management/mejora_continua/`
- Nueva app: `hseq_management/comites/`

#### Tareas Principales

**Backend:**
- [ ] Modelos de Emergencias:
  - `AnalisisVulnerabilidad`
  - `PlanEmergencia`
  - `PlanoEvacuacion` (archivo)
  - `Brigada`
  - `Brigadista`
  - `Simulacro`
  - `RecursoEmergencia`
- [ ] Modelos Ambientales:
  - `GestionResiduo`
  - `Vertimiento`
  - `Emision`
  - `ConsumoRecurso`
  - `HuellaCarbono`
  - `CertificadoAmbiental`
- [ ] Modelos de Mejora Continua:
  - `ProgramaAuditoria`
  - `Auditoria`
  - `Hallazgo`
  - `EvaluacionCumplimiento`
- [ ] Modelos de Comités:
  - `TipoComite` (dinámico: COPASST, COCOLA, CSV, etc.)
  - `Comite`
  - `MiembroComite`
  - `ActaComite`
  - `Votacion`

**Frontend:**
- [ ] EmergenciasTab (6 subtabs)
- [ ] GestionAmbientalTab (6 subtabs)
- [ ] MejoraContinuaTab (6 subtabs)
- [ ] GestionComitesTab (5 subtabs)
- [ ] Dashboard de auditorías
- [ ] Calendario de simulacros

**Testing:**
- [ ] Tests de plan de emergencias
- [ ] Tests de auditorías
- [ ] Tests de comités dinámicos

#### Entregables
- Gestión de Emergencias completa
- Gestión Ambiental funcional
- Sistema de Auditorías
- Gestión de Comités dinámica
- 40+ tests

#### Hitos de Despliegue
- Deploy a producción: Nivel 3 completo (HSEQ Management)

#### Dependencias
- Semana 13: Seguridad + Accidentalidad

---

## FASE 5: NIVEL 4 - CADENA DE VALOR
**Duración:** Semanas 15-18
**Objetivo:** Implementar procesos operativos del negocio

### SEMANA 15: SUPPLY CHAIN - PROVEEDORES + CATÁLOGOS
**Fechas:** 30 Marzo - 5 Abril 2026

#### Módulos a Trabajar
- `supply_chain/` (nuevo módulo, refactorizar existentes)

#### Apps Específicas
- Refactorizar: `proveedores/` → `supply_chain/gestion_proveedores/`
- Nueva app: `supply_chain/catalogos/`

#### Tareas Principales

**Backend:**
- [ ] Crear módulo `supply_chain/`
- [ ] Migrar modelos de `proveedores/`:
  - `TipoProveedor` (dinámico)
  - `Proveedor`
  - `SeleccionProveedor`
  - `EvaluacionProveedor`
  - `ReevaluacionProveedor`
  - `ProveedorCritico`
- [ ] Modelos de Catálogos:
  - `CategoriaProducto` (jerarquía)
  - `MateriaPrima` (18 tipos)
  - `Producto`
  - `Servicio`
  - `Precio`
  - `HistorialPrecio`
- [ ] Migración de datos de `proveedores/` a `supply_chain/`

**Frontend:**
- [ ] GestionProveedoresTab (5 subtabs)
- [ ] Refactorizar componentes de proveedores
- [ ] CatalogosTab (5 subtabs)
- [ ] Dashboard de precios históricos

**Testing:**
- [ ] Tests de migración de datos
- [ ] Tests de evaluación de proveedores
- [ ] Tests de catálogos

#### Entregables
- Módulo Supply Chain creado
- Proveedores migrados y mejorados
- Catálogos de productos/servicios
- 30+ tests

#### Hitos de Despliegue
- Deploy a staging: Supply Chain - Proveedores

#### Dependencias
- Semana 14: HSEQ completo

---

### SEMANA 16: SUPPLY CHAIN - PROGRAMACIÓN + COMPRAS
**Fechas:** 6-12 Abril 2026

#### Módulos a Trabajar
- `supply_chain/programacion_abastecimiento/` (nuevo)
- `supply_chain/compras/` (nuevo)
- `supply_chain/almacenamiento/` (nuevo)

#### Apps Específicas
- Refactorizar: `programaciones/` + `recolecciones/` + `liquidaciones/` → `supply_chain/programacion_abastecimiento/`
- Nueva app: `supply_chain/compras/`
- Nueva app: `supply_chain/almacenamiento/`

#### Tareas Principales

**Backend:**
- [ ] Modelos de Programación Abastecimiento:
  - Migrar de `programaciones/`
  - `TipoOperacion` (configurable)
  - `Programacion`
  - `AsignacionRecurso`
  - `Ejecucion`
  - `Liquidacion`
  - Genera CxP automáticamente
- [ ] Modelos de Compras:
  - `Requisicion`
  - `Cotizacion`
  - `EvaluacionCotizacion`
  - `OrdenCompra`
  - `Contrato`
  - `RecepcionCompra`
- [ ] Modelos de Almacenamiento:
  - `Almacen`
  - `Inventario`
  - `MovimientoInventario`
  - `Kardex`
  - `AlertaStock`

**Frontend:**
- [ ] ProgramacionAbastecimientoTab (5 subtabs)
- [ ] ComprasTab (6 subtabs)
- [ ] AlmacenamientoTab (5 subtabs)
- [ ] Dashboard de inventarios
- [ ] Kardex en tiempo real

**Testing:**
- [ ] Tests de programación
- [ ] Tests de compras
- [ ] Tests de kardex

#### Entregables
- Programación de abastecimiento completa
- Módulo de Compras funcional
- Almacenamiento e inventarios
- 35+ tests

#### Hitos de Despliegue
- Deploy a staging: Supply Chain completo

#### Dependencias
- Semana 15: Proveedores migrados

---

### SEMANA 17: PRODUCTION OPS + LOGISTICS & FLEET
**Fechas:** 13-19 Abril 2026

#### Módulos a Trabajar
- `production_ops/` (nuevo módulo)
- `logistics_fleet/` (nuevo módulo)

#### Apps Específicas
- Refactorizar: `recepciones/` → `production_ops/recepcion/`
- Refactorizar: `lotes/` → `production_ops/procesamiento/`
- Nueva app: `production_ops/mantenimiento/`
- Nueva app: `production_ops/producto_terminado/`
- Nueva app: `logistics_fleet/gestion_transporte/`
- Nueva app: `logistics_fleet/gestion_flota/`

#### Tareas Principales

**Backend:**
- [ ] Crear módulo `production_ops/`
- [ ] Migrar modelos de recepción
- [ ] Migrar modelos de lotes
- [ ] Modelos de Mantenimiento:
  - `ActivoProduccion`
  - `EquipoMedicion`
  - `PlanMantenimiento`
  - `Calibracion`
  - `OrdenTrabajo`
  - `Parada`
- [ ] Modelos de Producto Terminado:
  - `Stock`
  - `LoteProduccion`
  - `CalidadSalida`
  - `Certificado`
  - `Liberacion`
- [ ] Crear módulo `logistics_fleet/`
- [ ] Modelos de Flota:
  - `TipoVehiculo`
  - `Vehiculo`
  - `HojaVidaVehiculo`
  - `DocumentoVehiculo`
  - `VerificacionTercero`
  - `CostoOperacion`
- [ ] Modelos de Transporte:
  - `ProgramacionRuta`
  - `AsignacionRecurso`
  - `Despacho`
  - `Manifiesto`
  - `Remision`

**Frontend:**
- [ ] RecepcionTab (5 subtabs)
- [ ] ProcesamientoTab (6 subtabs)
- [ ] MantenimientoTab (6 subtabs)
- [ ] ProductoTerminadoTab (5 subtabs)
- [ ] GestionTransporteTab (5 subtabs)
- [ ] GestionFlotaTab (5 subtabs)
- [ ] Dashboard de mantenimiento

**Testing:**
- [ ] Tests de producción
- [ ] Tests de mantenimiento
- [ ] Tests de flota

#### Entregables
- Operaciones de Producción completo
- Logística y Flota funcional
- Dashboard de mantenimiento
- 40+ tests

#### Hitos de Despliegue
- Deploy a staging: Production Ops + Logistics

#### Dependencies
- Semana 16: Supply Chain completo

---

### SEMANA 18: SALES & CRM
**Fechas:** 20-26 Abril 2026

#### Módulos a Trabajar
- `sales_crm/` (nuevo módulo)

#### Apps Específicas
- Nueva app: `sales_crm/gestion_clientes/`
- Nueva app: `sales_crm/pipeline_ventas/`
- Nueva app: `sales_crm/pedidos_facturacion/`
- Nueva app: `sales_crm/servicio_cliente/`

#### Tareas Principales

**Backend:**
- [ ] Crear módulo `sales_crm/`
- [ ] Modelos de Clientes:
  - `Cliente`
  - `Contacto`
  - `Segmentacion`
  - `InteraccionCliente`
  - `HistorialCompra`
  - `ScoringCliente`
- [ ] Modelos de Pipeline:
  - `EtapaVenta` (configurable)
  - `Oportunidad`
  - `Cotizacion`
  - `SeguimientoOportunidad`
- [ ] Modelos de Facturación:
  - `Pedido`
  - `AprobacionPedido`
  - `FacturaElectronica` (DIAN)
  - `NotaCredito`
  - `NotaDebito`
  - Genera CxC
- [ ] Modelos de Servicio:
  - `PQRS`
  - `EncuestaSatisfaccion`
  - `Fidelizacion`

**Frontend:**
- [ ] GestionClientesTab (6 subtabs)
- [ ] PipelineVentasTab (5 subtabs)
- [ ] PedidosFacturacionTab (5 subtabs)
- [ ] ServicioClienteTab (5 subtabs)
- [ ] Kanban de oportunidades
- [ ] Dashboard de ventas

**Testing:**
- [ ] Tests de pipeline de ventas
- [ ] Tests de facturación electrónica
- [ ] Tests de PQRS

#### Entregables
- Módulo CRM completo
- Pipeline de ventas funcional
- Facturación electrónica DIAN
- 35+ tests

#### Hitos de Despliegue
- Deploy a producción: Nivel 4 completo (Cadena de Valor)

#### Dependencias
- Semana 17: Production Ops + Logistics

---

## FASE 6: NIVEL 5 - HABILITADORES
**Duración:** Semanas 19-22
**Objetivo:** Implementar recursos de soporte organizacional

### SEMANA 19: TALENT HUB - ESTRUCTURA Y SELECCIÓN
**Fechas:** 27 Abril - 3 Mayo 2026

#### Módulos a Trabajar
- `talent_hub/` (nuevo módulo)

#### Apps Específicas
- Nueva app: `talent_hub/estructura_cargos/`
- Nueva app: `talent_hub/seleccion_contratacion/`
- Nueva app: `talent_hub/colaboradores/`

#### Tareas Principales

**Backend:**
- [ ] Crear módulo `talent_hub/`
- [ ] Modelos de Estructura:
  - Link a `Cargo` (←Organización)
  - `Profesiograma`
  - `MatrizCompetencia`
  - `RequisitoEspecial`
  - `Vacante` (auto desde organigrama)
- [ ] Modelos de Selección:
  - `VacanteActiva`
  - `Candidato`
  - `Entrevista`
  - `Prueba`
  - `TipoContrato`
  - `AfiliacionSS`
- [ ] Modelos de Colaboradores:
  - `Colaborador`
  - `HojaVida`
  - `InfoPersonal`
  - `HistorialLaboral`

**Frontend:**
- [ ] EstructuraCargosTab (5 subtabs)
- [ ] SeleccionContratacionTab (6 subtabs)
- [ ] ColaboradoresTab (5 subtabs)
- [ ] Dashboard de vacantes activas
- [ ] Portal de candidatos

**Testing:**
- [ ] Tests de gestión de vacantes
- [ ] Tests de selección
- [ ] Tests de hojas de vida

#### Entregables
- Estructura de cargos integrada con Organización
- Selección y contratación funcional
- Directorio de colaboradores
- 30+ tests

#### Hitos de Despliegue
- Deploy a staging: Talent Hub - Estructura

#### Dependencias
- Semana 18: CRM completo

---

### SEMANA 20: TALENT HUB - ONBOARDING + FORMACIÓN + DESEMPEÑO
**Fechas:** 4-10 Mayo 2026

#### Módulos a Trabajar
- `talent_hub/onboarding_induccion/` (nuevo)
- `talent_hub/formacion_reinduccion/` (nuevo)
- `talent_hub/desempeno/` (nuevo)

#### Apps Específicas
- Nueva app: `talent_hub/onboarding_induccion/`
- Nueva app: `talent_hub/formacion_reinduccion/`
- Nueva app: `talent_hub/desempeno/`

#### Tareas Principales

**Backend:**
- [ ] Modelos de Onboarding:
  - `ModuloInduccion` (configurable)
  - `AsignacionPorCargo`
  - `ChecklistIngreso`
  - `EjecucionIntegral`
  - `EntregaEPP`
  - `EntregaActivo`
  - `FirmaDocumento`
- [ ] Modelos de Formación:
  - `PlanFormacion`
  - `Capacitacion`
  - `ProgramacionCapacitacion`
  - `EjecucionCapacitacion`
  - `Gamificacion` (puntos, badges)
  - `EvaluacionEficacia`
  - `Certificado`
- [ ] Modelos de Desempeño:
  - `EvaluacionDesempeno`
  - `PlanMejora`
  - `Reconocimiento`

**Frontend:**
- [ ] OnboardingInduccionTab (6 subtabs)
- [ ] FormacionReinduccionTab (6 subtabs)
- [ ] DesempenoTab (3 subtabs)
- [ ] Portal de capacitaciones (LMS básico)
- [ ] Gamificación (leaderboard)

**Testing:**
- [ ] Tests de onboarding
- [ ] Tests de capacitaciones
- [ ] Tests de evaluación de desempeño

#### Entregables
- Onboarding completo
- Sistema de capacitaciones (LMS básico)
- Gamificación implementada
- Evaluación de desempeño
- 35+ tests

#### Hitos de Despliegue
- Deploy a staging: Talent Hub - Onboarding + Formación

#### Dependencias
- Semana 19: Estructura de Cargos

---

### SEMANA 21: TALENT HUB - NÓMINA + OFF-BOARDING
**Fechas:** 11-17 Mayo 2026

#### Módulos a Trabajar
- `talent_hub/control_tiempo/` (nuevo)
- `talent_hub/novedades/` (nuevo)
- `talent_hub/proceso_disciplinario/` (nuevo)
- `talent_hub/nomina/` (nuevo)
- `talent_hub/off_boarding/` (nuevo)

#### Apps Específicas
- Nueva app: `talent_hub/control_tiempo/`
- Nueva app: `talent_hub/novedades/`
- Nueva app: `talent_hub/proceso_disciplinario/`
- Nueva app: `talent_hub/nomina/`
- Nueva app: `talent_hub/off_boarding/`

#### Tareas Principales

**Backend:**
- [ ] Modelos de Control de Tiempo:
  - `RegistroIngreso`
  - `RegistroSalida`
  - `Asistencia`
  - `HoraExtra`
  - `Turno`
- [ ] Modelos de Novedades:
  - `Incapacidad`
  - `Licencia`
  - `Permiso`
  - `Vacacion`
- [ ] Modelos Disciplinarios:
  - `LlamadoAtencion`
  - `Descargo`
  - `Memorando`
  - `Suspension`
- [ ] Modelos de Nómina:
  - `ConfiguracionNomina`
  - `Preliquidacion`
  - `Liquidacion`
  - `Prestacion`
  - API exportación
- [ ] Modelos de Off-Boarding:
  - `TipoRetiro`
  - `PazSalvo`
  - `ExamenEgreso`
  - `EntrevistaRetiro`
  - `LiquidacionFinal`
  - Libera vacante auto

**Frontend:**
- [ ] ControlTiempoTab (5 subtabs)
- [ ] NovedadesTab (4 subtabs)
- [ ] ProcesoDisciplinarioTab (5 subtabs)
- [ ] NominaTab (5 subtabs)
- [ ] OffBoardingTab (6 subtabs)
- [ ] Dashboard de nómina

**Testing:**
- [ ] Tests de control de tiempo
- [ ] Tests de nómina
- [ ] Tests de off-boarding

#### Entregables
- Control de tiempo funcional
- Nómina básica con exportación
- Off-boarding completo
- 40+ tests

#### Hitos de Despliegue
- Deploy a staging: Talent Hub completo

#### Dependencias
- Semana 20: Onboarding + Formación

---

### SEMANA 22: ADMIN & FINANCE + ACCOUNTING
**Fechas:** 18-24 Mayo 2026

#### Módulos a Trabajar
- `admin_finance/` (nuevo módulo)
- `accounting/` (nuevo módulo, activable)

#### Apps Específicas
- Nueva app: `admin_finance/tesoreria/`
- Nueva app: `admin_finance/presupuesto/`
- Nueva app: `admin_finance/activos_fijos/`
- Nueva app: `admin_finance/servicios_generales/`
- Nuevo módulo: `accounting/` (activable)

#### Tareas Principales

**Backend:**
- [ ] Crear módulo `admin_finance/`
- [ ] Modelos de Tesorería:
  - `CuentaPorPagar` (←Liquidaciones)
  - `CuentaPorCobrar` (←Facturas)
  - `Banco`
  - `FlujoCaja`
  - `Pago`
  - `Recaudo`
- [ ] Modelos de Presupuesto:
  - `CentroCosto`
  - `Rubro`
  - `PresupuestoPorArea`
  - `Aprobacion`
  - `Ejecucion`
- [ ] Modelos de Activos Fijos:
  - `CategoriaActivo`
  - `ActivoFijo`
  - `HojaVidaActivo`
  - `ProgramaMantenimiento`
  - `Depreciacion`
  - `Baja`
- [ ] Modelos de Servicios:
  - `MantenimientoLocativo`
  - `ServicioPublico`
  - `ContratoServicio`
- [ ] Crear módulo `accounting/` (activable):
  - `PlanCuentas`
  - `CentroCosto`
  - `Tercero`
  - `Comprobante`
  - `LibroDiario`
  - `LibroMayor`
  - Informes contables (Balance, PyG)
  - API de integración

**Frontend:**
- [ ] TesoreriaTab (5 subtabs)
- [ ] PresupuestoTab (5 subtabs)
- [ ] ActivosFijosTab (6 subtabs)
- [ ] ServiciosGeneralesTab (3 subtabs)
- [ ] AccountingTabs (4 tabs, activable)
- [ ] Dashboard financiero

**Testing:**
- [ ] Tests de tesorería
- [ ] Tests de presupuesto
- [ ] Tests de contabilidad

#### Entregables
- Administración y Finanzas completo
- Contabilidad básica (activable)
- Dashboard financiero
- 35+ tests

#### Hitos de Despliegue
- Deploy a producción: Nivel 5 completo (Habilitadores)

#### Dependencias
- Semana 21: Talent Hub completo

---

## FASE 7: NIVEL 6 - INTELIGENCIA + TESTING FINAL
**Duración:** Semanas 23-26
**Objetivo:** Implementar BI, auditoría y testing final del sistema completo

### SEMANA 23: ANALYTICS - INDICADORES + DASHBOARDS
**Fechas:** 25-31 Mayo 2026

#### Módulos a Trabajar
- `analytics/` (nuevo módulo)

#### Apps Específicas
- Nueva app: `analytics/config_indicadores/`
- Nueva app: `analytics/dashboard_gerencial/`
- Nueva app: `analytics/indicadores_area/`

#### Tareas Principales

**Backend:**
- [ ] Crear módulo `analytics/`
- [ ] Modelos de Indicadores:
  - `CatalogoKPI`
  - `FichaTecnica`
  - `FormulaKPI`
  - `FuenteDatos`
  - `Meta`
  - `ConfiguracionSemaforo`
  - `AccionAutomatica` (genera AC si rojo)
  - `ValorKPI` (histórico)
- [ ] Modelos de Dashboard:
  - `VistaDashboard` (4 perspectivas BSC)
  - `WidgetDashboard`
  - `ConfiguracionWidget`
- [ ] Modelos de Indicadores por Área:
  - KPIs SST (Res.0312, E-P-R)
  - KPIs PESV
  - KPIs Ambientales
  - KPIs Calidad
  - KPIs Comerciales
  - KPIs Operacionales/RRHH/Financieros
- [ ] Celery tasks para cálculo automático de KPIs

**Frontend:**
- [ ] ConfigIndicadoresTab (6 subtabs)
- [ ] DashboardGerencialTab (6 subtabs):
  - Vista Ejecutiva
  - Perspectiva Financiera
  - Perspectiva Cliente
  - Perspectiva Procesos
  - Perspectiva Aprendizaje
  - Drill-down
- [ ] IndicadoresPorAreaTab (6 subtabs)
- [ ] Gráficos interactivos (Chart.js / Recharts)

**Celery:**
- [ ] Task: `calculate_kpis` (según frecuencia configurada)
- [ ] Task: `check_kpi_thresholds` (diario, genera AC)

**Testing:**
- [ ] Tests de cálculo de KPIs
- [ ] Tests de generación de AC automática
- [ ] Tests de dashboards

#### Entregables
- Sistema de indicadores completo
- Dashboard gerencial (4 perspectivas BSC)
- Indicadores por área (SST, PESV, etc.)
- Generación automática de AC desde KPI
- 35+ tests

#### Hitos de Despliegue
- Deploy a staging: Analytics - Indicadores

#### Dependencias
- Semana 22: Admin & Finance completo

---

### SEMANA 24: ANALYTICS - ANÁLISIS + GENERADOR INFORMES
**Fechas:** 1-7 Junio 2026

#### Módulos a Trabajar
- `analytics/analisis_tendencias/` (nuevo)
- `analytics/generador_informes/` (nuevo)
- `analytics/acciones_indicador/` (nuevo)

#### Apps Específicas
- Nueva app: `analytics/analisis_tendencias/`
- Nueva app: `analytics/generador_informes/`
- Nueva app: `analytics/acciones_indicador/`
- Nueva app: `analytics/exportacion_integracion/`

#### Tareas Principales

**Backend:**
- [ ] Modelos de Análisis:
  - `AnalisisVsMeta`
  - `AnalisisVsPeriodoAnterior`
  - `TendenciaKPI`
  - `Proyeccion`
  - `AnomaliaDetectada`
- [ ] Modelos de Generador:
  - `PlantillaInforme` (normas: Res.0312, PESV, etc.)
  - `InformeDinamico`
  - `ProgramacionInforme`
  - `HistorialInforme`
  - `EnvioEmail`
- [ ] Modelos de Acciones:
  - Link a `AccionCorrectiva` (HSEQ)
  - `KPIEnRojo`
  - `PlanAccionKPI`
  - `SeguimientoPlan`
- [ ] Celery tasks:
  - `detect_anomalies` (semanal)
  - `generate_scheduled_reports` (según programación)

**Frontend:**
- [ ] AnalisisTendenciasTab (5 subtabs)
- [ ] GeneradorInformesTab (5 subtabs):
  - Plantillas Norma
  - Constructor Dinámico
  - Programación Auto
  - Historial
  - Envío Email
- [ ] AccionesPorIndicadorTab (4 subtabs)
- [ ] ExportacionIntegracionTab (5 subtabs):
  - Excel
  - PDF
  - Power BI
  - API Datos
  - Webhooks

**Testing:**
- [ ] Tests de detección de anomalías
- [ ] Tests de generación de informes
- [ ] Tests de exportación

#### Entregables
- Análisis de tendencias funcional
- Generador de informes dinámico
- Sistema de acciones por KPI
- Exportación a múltiples formatos
- 40+ tests

#### Hitos de Despliegue
- Deploy a staging: Analytics completo

#### Dependencias
- Semana 23: Indicadores + Dashboards

---

### SEMANA 25: AUDIT SYSTEM + TESTING INTEGRAL
**Fechas:** 8-14 Junio 2026

#### Módulos a Trabajar
- `audit_system/` (nuevo módulo)
- Testing integral del sistema completo

#### Apps Específicas
- Nueva app: `audit_system/logs_sistema/`
- Nueva app: `audit_system/centro_notificaciones/`
- Nueva app: `audit_system/config_alertas/`
- Nueva app: `audit_system/tareas_recordatorios/`

#### Tareas Principales

**Backend:**
- [ ] Crear módulo `audit_system/`
- [ ] Modelos de Logs:
  - Configurar django-auditlog
  - `Trazabilidad`
  - `CambioDatos`
  - `Acceso`
  - `ConfiguracionRetencion`
- [ ] Modelos de Notificaciones:
  - `Notificacion`
  - `NotificacionPorRol`
  - `PreferenciaUsuario`
  - `CanalNotificacion`
- [ ] Modelos de Alertas:
  - `AlertaPorVencimiento`
  - `AlertaPorUmbralKPI`
  - `AlertaPorEvento`
  - `Escalamiento`
- [ ] Modelos de Tareas:
  - `TareaPendiente`
  - `Calendario`
  - `Recordatorio`
  - `VistaEquipo`

**Frontend:**
- [ ] LogsSistemaTab (5 subtabs)
- [ ] CentroNotificacionesTab (4 subtabs)
- [ ] ConfigAlertasTab (4 subtabs)
- [ ] TareasRecordatoriosTab (4 subtabs)
- [ ] Centro de notificaciones (campana 🔔)

**Testing Integral:**
- [ ] Tests de integración entre todos los módulos
- [ ] Tests de flujos completos end-to-end:
  - Flujo de recolección completo
  - Flujo de compra completo
  - Flujo de NC → AC → Hallazgo de auditoría
  - Flujo de capacitación completo
  - Flujo de proyecto completo
- [ ] Tests de performance (load testing)
- [ ] Tests de seguridad (OWASP)

**Auditoría:**
- [ ] Auditoría de performance de queries
- [ ] Auditoría de seguridad
- [ ] Auditoría de accesibilidad (WCAG)

#### Entregables
- Sistema de Auditoría completo
- Centro de notificaciones funcional
- 300+ tests totales pasando
- Reporte de auditoría de seguridad
- Reporte de auditoría de performance

#### Hitos de Despliegue
- Deploy a staging: Audit System

#### Dependencias
- Semana 24: Analytics completo

---

### SEMANA 26: OPTIMIZACIÓN + DOCUMENTACIÓN + PRODUCCIÓN
**Fechas:** 15-21 Junio 2026

#### Módulos a Trabajar
- Optimización general
- Documentación completa
- Despliegue a producción

#### Tareas Principales

**Optimización:**
- [ ] Optimización de queries (N+1, selects innecesarios)
- [ ] Índices de base de datos
- [ ] Caché con Redis (queries frecuentes)
- [ ] Compresión de assets
- [ ] Lazy loading de componentes
- [ ] Code splitting
- [ ] Minificación de JS/CSS

**Documentación:**
- [ ] Documentación completa de APIs (Swagger/OpenAPI)
- [ ] Guía de usuario final (PDF interactivo)
- [ ] Manual técnico para desarrolladores
- [ ] Guía de administración del sistema
- [ ] Diagramas de arquitectura (C4 Model)
- [ ] Runbook para DevOps
- [ ] FAQ y troubleshooting

**Seguridad:**
- [ ] Penetration testing
- [ ] OWASP Top 10 compliance
- [ ] Rate limiting
- [ ] HTTPS enforcement
- [ ] CORS configurado
- [ ] CSP headers
- [ ] Input sanitization audit

**Despliegue a Producción:**
- [ ] Configurar entorno de producción
- [ ] Setup de base de datos de producción
- [ ] Configurar backups automáticos
- [ ] Configurar monitoreo (Sentry, DataDog)
- [ ] Configurar logs centralizados
- [ ] SSL/TLS certificates
- [ ] DNS y CDN (Cloudflare)
- [ ] Smoke tests en producción

**Migración de Datos:**
- [ ] Script de migración de datos legacy
- [ ] Validación de integridad de datos
- [ ] Reconciliación de datos

**Capacitación:**
- [ ] Videos tutoriales (5-10 videos)
- [ ] Sesiones de capacitación con usuarios finales
- [ ] Documentación de casos de uso comunes

#### Entregables
- Sistema optimizado (tiempo de carga <2s)
- Documentación completa (Swagger, PDFs, videos)
- Entorno de producción funcional
- Backups automáticos configurados
- Monitoreo en tiempo real activo
- 10+ videos tutoriales

#### Hitos de Despliegue
- **DEPLOY A PRODUCCIÓN: SISTEMA COMPLETO (6 NIVELES, 14 MÓDULOS, 81 APPS)**
- Go-live oficial
- Plan de soporte post-lanzamiento

#### Dependencias
- Semana 25: Sistema completo en staging

---

## RESUMEN DE DESPLIEGUES INCREMENTALES

### Fase 1-2: Nivel 1 - Estratégico
| Semana | Deploy | Contenido |
|--------|--------|-----------|
| 2 | Staging | Configuración base + Branding |
| 3 | Staging | Organización + RBAC |
| 4 | Staging | Identidad + Planeación |
| 5 | Staging | Gestión Proyectos (PMI) |
| 6 | **Producción** | **Nivel 1 completo** |

### Fase 3: Nivel 2 - Cumplimiento
| Semana | Deploy | Contenido |
|--------|--------|-----------|
| 7 | Staging | Matriz Legal + Requisitos |
| 8 | Staging | Partes Interesadas + Reglamentos |
| 9 | Staging | Contexto + Riesgos + IPEVR |
| 10 | **Producción** | **Nivel 2 completo** |

### Fase 4: Nivel 3 - Torre de Control
| Semana | Deploy | Contenido |
|--------|--------|-----------|
| 11 | Staging | Sistema Documental + Planificación HSEQ |
| 12 | Staging | Calidad + Medicina Laboral |
| 13 | Staging | Seguridad + Accidentalidad |
| 14 | **Producción** | **Nivel 3 completo (HSEQ)** |

### Fase 5: Nivel 4 - Cadena de Valor
| Semana | Deploy | Contenido |
|--------|--------|-----------|
| 15 | Staging | Supply Chain - Proveedores |
| 16 | Staging | Supply Chain - Compras + Inventarios |
| 17 | Staging | Production Ops + Logistics |
| 18 | **Producción** | **Nivel 4 completo** |

### Fase 6: Nivel 5 - Habilitadores
| Semana | Deploy | Contenido |
|--------|--------|-----------|
| 19 | Staging | Talent Hub - Estructura |
| 20 | Staging | Talent Hub - Onboarding + Formación |
| 21 | Staging | Talent Hub - Nómina + Off-boarding |
| 22 | **Producción** | **Nivel 5 completo** |

### Fase 7: Nivel 6 - Inteligencia
| Semana | Deploy | Contenido |
|--------|--------|-----------|
| 23 | Staging | Analytics - Indicadores + Dashboards |
| 24 | Staging | Analytics - Análisis + Informes |
| 25 | Staging | Audit System |
| 26 | **PRODUCCIÓN** | **SISTEMA COMPLETO** |

---

## MÉTRICAS DE PROGRESO

### Por Fase

| Fase | Semanas | Módulos | Apps | Tablas Est. | Tests |
|------|---------|---------|------|-------------|-------|
| Fase 1-2: Estratégico | 1-6 | 1 | 15 | 30 | 150 |
| Fase 3: Cumplimiento | 7-10 | 3 | 12 | 25 | 120 |
| Fase 4: Torre de Control | 11-14 | 1 | 11 | 35 | 140 |
| Fase 5: Cadena de Valor | 15-18 | 4 | 20 | 40 | 140 |
| Fase 6: Habilitadores | 19-22 | 3 | 15 | 30 | 140 |
| Fase 7: Inteligencia | 23-26 | 2 | 8 | 20 | 110 |
| **TOTAL** | **26** | **14** | **81** | **180** | **800** |

### Velocity Estimado

| Semana | Desarrollo (hrs) | Testing (hrs) | Documentación (hrs) | Total |
|--------|------------------|---------------|---------------------|-------|
| Promedio | 120 | 30 | 10 | 160 hrs/semana |

### Equipo Requerido

| Rol | Cantidad | Asignación |
|-----|----------|------------|
| Backend Developer (Django) | 2 | Tiempo completo |
| Frontend Developer (React) | 2 | Tiempo completo |
| QA Engineer | 1 | Tiempo completo |
| DevOps Engineer | 1 | 50% tiempo |
| Product Owner | 1 | 30% tiempo |
| **Total FTE** | **6.8** | |

---

## DEPENDENCIAS CRÍTICAS

### Dependencias Técnicas

1. **Base de datos MySQL 8.0** configurada y optimizada
2. **Redis** para Celery y caché
3. **Celery Workers** para tareas asíncronas
4. **AWS S3** o almacenamiento para archivos
5. **SMTP** para envío de emails
6. **SSL/TLS** para producción

### Dependencias Externas

1. **API DIAN** para facturación electrónica (Semana 18)
2. **Servicios de scraping** para matriz legal (Semana 7)
3. **Firma digital** (proveedor a definir) (Semana 11)
4. **GPS/Telemetría** (opcional, para flota) (Semana 17)

### Dependencias de Datos

1. **Catálogo de 78 peligros GTC-45** (Semana 9)
2. **Tipos de materia prima** (18 códigos) (Semana 15)
3. **Plantillas de documentos** normativos (Semana 11)
4. **Plantillas de informes** legales (Semana 24)

---

## RIESGOS Y MITIGACIÓN

### Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Performance de queries con 180 tablas | Alta | Alto | Índices, caché Redis, optimización continua |
| Complejidad de integraciones DIAN | Media | Alto | Spike técnico semana 17, contingencia manual |
| Escalabilidad del workflow engine | Media | Medio | Usar solución probada (django-viewflow) |
| Migración de datos legacy | Alta | Alto | Testing exhaustivo, rollback plan |

### Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Cambios en requisitos legales (Res.0312) | Media | Medio | Módulos configurables, fácil de adaptar |
| Retraso en capacitación de usuarios | Media | Alto | Videos tutoriales desde semana 11 |
| Resistencia al cambio | Alta | Alto | Despliegue incremental, early adopters |

### Riesgos de Proyecto

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Enfermedad o salida de miembro clave | Media | Alto | Documentación continua, pair programming |
| Subestimación de esfuerzo | Alta | Alto | Buffer de 20% en cada fase, revisión semanal |
| Scope creep | Media | Alto | Change control process, product owner activo |

---

## CRITERIOS DE ACEPTACIÓN

### Por Semana

Cada semana debe cumplir:

- [ ] Todos los modelos Django creados y migrados
- [ ] APIs REST completas y documentadas (Swagger)
- [ ] Frontend funcional con componentes del Design System
- [ ] Tests unitarios pasando (cobertura >80%)
- [ ] Tests de integración pasando
- [ ] Documentación técnica actualizada
- [ ] Deploy a staging exitoso
- [ ] Demo funcional al Product Owner

### Por Fase

Cada fase debe cumplir:

- [ ] Todos los módulos del nivel funcionales
- [ ] Tests E2E pasando para flujos completos
- [ ] Auditoría de seguridad
- [ ] Auditoría de performance
- [ ] Documentación de usuario
- [ ] Deploy a producción exitoso
- [ ] Capacitación a usuarios finales
- [ ] Soporte post-deploy (1 semana)

### Sistema Completo (Semana 26)

- [ ] 800+ tests pasando
- [ ] Cobertura de código >85%
- [ ] Performance: tiempo de carga <2s
- [ ] Performance: API response <200ms (p95)
- [ ] Seguridad: OWASP Top 10 compliant
- [ ] Accesibilidad: WCAG 2.1 AA
- [ ] Documentación completa (Swagger, PDFs, videos)
- [ ] Backups automáticos funcionando
- [ ] Monitoreo en tiempo real activo
- [ ] Uptime >99.9% en staging (últimas 4 semanas)
- [ ] 100 usuarios concurrentes sin degradación

---

## PLAN DE CAPACITACIÓN

### Semana 12: Capacitación HSEQ
- Usuarios: Coordinador HSEQ, Brigadistas
- Duración: 4 horas
- Contenido: Sistema Documental, Medicina Laboral, Seguridad Industrial

### Semana 16: Capacitación Supply Chain
- Usuarios: Coordinador Logística, Compradores
- Duración: 4 horas
- Contenido: Proveedores, Compras, Inventarios

### Semana 18: Capacitación Comercial
- Usuarios: Equipo Comercial, Facturación
- Duración: 4 horas
- Contenido: CRM, Pipeline, Facturación Electrónica

### Semana 21: Capacitación RRHH
- Usuarios: Jefe Talento Humano, Analistas
- Duración: 6 horas
- Contenido: Selección, Onboarding, Capacitaciones, Nómina

### Semana 24: Capacitación Gerencial
- Usuarios: Gerencia, Directores
- Duración: 3 horas
- Contenido: Dashboards, KPIs, Informes

### Semana 26: Capacitación General
- Usuarios: Todos
- Duración: 2 horas
- Contenido: Navegación, funciones comunes, soporte

---

## PLAN DE SOPORTE POST-LANZAMIENTO

### Semana 27-30: Soporte Intensivo
- Equipo de desarrollo disponible 100%
- Hotfixes en <2 horas
- Monitoreo 24/7
- Reuniones diarias con usuarios

### Mes 2-3: Soporte Activo
- Equipo de desarrollo 50%
- Hotfixes en <4 horas
- Monitoreo horario laboral
- Reuniones semanales

### Mes 4+: Soporte Estándar
- Equipo de desarrollo 20%
- SLA: P1 <8h, P2 <24h, P3 <72h
- Releases mensuales
- Reuniones quincenales

---

## HITOS CLAVE

| Hito | Fecha | Descripción |
|------|-------|-------------|
| **Kickoff** | 22 Dic 2025 | Inicio del proyecto |
| **Nivel 1 en Producción** | 1 Feb 2026 | Dirección Estratégica completa |
| **Nivel 2 en Producción** | 1 Mar 2026 | Cumplimiento + Riesgos + Workflows |
| **Nivel 3 en Producción** | 29 Mar 2026 | HSEQ Management completo |
| **Nivel 4 en Producción** | 26 Abr 2026 | Cadena de Valor completa |
| **Nivel 5 en Producción** | 24 May 2026 | Habilitadores completos |
| **Go-Live Completo** | 21 Jun 2026 | Sistema completo en producción |
| **Cierre del Proyecto** | 28 Jun 2026 | Documentación final, lecciones aprendidas |

---

## MÉTRICAS DE ÉXITO

### KPIs del Proyecto

| KPI | Meta | Medición |
|-----|------|----------|
| **On-time Delivery** | 90% de hitos a tiempo | Semanal |
| **Cobertura de Tests** | >85% | Continua |
| **Bugs en Producción** | <5 críticos/mes | Mensual |
| **Uptime** | >99.9% | Continua |
| **Satisfacción Usuarios** | >4/5 | Post-capacitación |
| **Tiempo de Respuesta API** | <200ms (p95) | Continua |
| **Performance Frontend** | <2s First Contentful Paint | Semanal |

### Métricas de Negocio

| Métrica | Meta | Timeframe |
|---------|------|-----------|
| **Adopción de Usuarios** | >80% usuarios activos | Mes 2 |
| **Reducción Tiempo Procesos** | -30% vs manual | Mes 3 |
| **Cumplimiento Normativo** | 100% Res.0312 | Mes 1 |
| **Satisfacción Stakeholders** | >4.5/5 | Mes 3 |

---

## PRÓXIMOS PASOS INMEDIATOS

### Semana 1 - Día 1-3 (22-24 Diciembre)
1. Reunión de kickoff con todo el equipo
2. Setup de entornos de desarrollo para todos
3. Revisión de arquitectura existente
4. Inicio de auditoría de base de datos

### Semana 1 - Día 4-5 (25-26 Diciembre)
1. Completar diagrama ER de base de datos
2. Setup de CI/CD pipeline
3. Configurar Storybook
4. Primer sprint planning para Semana 2

---

**Documento creado:** 22 Diciembre 2025
**Autor:** Documentation Expert
**Versión:** 1.0
**Estado:** Aprobado para ejecución
