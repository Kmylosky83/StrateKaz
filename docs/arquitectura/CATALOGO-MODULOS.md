# Catálogo de Módulos del Sistema

El sistema implementa una arquitectura de **monolito modular** organizada en 6 niveles jerárquicos con 14 módulos.

## Diagrama General

```
┌─────────────────────────────────────────────────────────────────────┐
│ NIVEL 1: ESTRATÉGICO                                    ✅ Completo │
│   └── gestion_estrategica/                                          │
│         ├── configuracion/  ├── organizacion/  ├── identidad/      │
│         ├── planeacion/  ├── gestion_proyectos/  └── revision/     │
├─────────────────────────────────────────────────────────────────────┤
│ NIVEL 2: CUMPLIMIENTO                                   ✅ Completo │
│   ├── motor_cumplimiento/  ├── motor_riesgos/                      │
│   └── workflow_engine/                                              │
├─────────────────────────────────────────────────────────────────────┤
│ NIVEL 3: TORRE DE CONTROL                       🔄 En Progreso 90% │
│   └── hseq_management/ (S11-S14 Backend ✅, Frontend pendiente)     │
├─────────────────────────────────────────────────────────────────────┤
│ NIVEL 4: CADENA DE VALOR                                ⚠️ Legacy   │
│   ├── supply_chain/  ├── production_ops/                           │
│   ├── logistics_fleet/  └── sales_crm/                             │
├─────────────────────────────────────────────────────────────────────┤
│ NIVEL 5: HABILITADORES                                  🔜 Próximo  │
│   ├── talent_hub/  ├── admin_finance/  └── accounting/             │
├─────────────────────────────────────────────────────────────────────┤
│ NIVEL 6: INTELIGENCIA                                   🔜 Próximo  │
│   ├── analytics/  └── audit_system/                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Nivel 1: Estratégico

### Dirección Estratégica (`gestion_estrategica`)

**Estado:** ✅ Completo (Semana 6)
**Color:** Purple

| Tab | Secciones | Descripción |
|-----|-----------|-------------|
| **Configuración** | Empresa, Branding, Sedes, Integraciones | Config general del sistema |
| **Organización** | Áreas, Cargos, Organigrama, Roles, Documentos | Estructura organizacional |
| **Identidad** | Misión/Visión, Valores, Política Integral | Identidad corporativa |
| **Planeación** | Planes, Objetivos BSC, KPIs | Planeación estratégica |
| **Proyectos PMI** | Portafolios, Programas, Proyectos, Kanban | Gestión de proyectos |
| **Revisión Dirección** | Programación, Actas, Compromisos | ISO 9.3 |

**Componentes Implementados:**
- Identidad Corporativa (misión, visión, valores, política integral)
- Planeación Estratégica (planes, objetivos BSC, KPIs)
- Gestión de Proyectos PMI (portafolios, programas, proyectos, Kanban)
- Revisión por Dirección ISO 9.3 (programación, actas, compromisos, PDF)

---

## Nivel 2: Cumplimiento

### Motor de Cumplimiento (`motor_cumplimiento`)

**Estado:** ✅ Backend
**Color:** Blue

| Tab | Descripción |
|-----|-------------|
| **Matriz Legal** | Requisitos legales aplicables |
| **Requisitos Legales** | Detalle de requisitos |
| **Partes Interesadas** | Stakeholders y sus requisitos |
| **Reglamentos Internos** | Normativa interna |

### Motor de Riesgos (`motor_riesgos`)

**Estado:** ✅ Backend + Frontend (Semana 9-10)
**Color:** Blue

| Tab | Descripción | Estado |
|-----|-------------|--------|
| **Contexto** | Análisis DOFA, PESTEL, Porter | ✅ Completo |
| **Riesgos y Oportunidades** | Matriz de riesgos estratégicos | ✅ Completo |
| **IPEVR** | GTC-45, 78 peligros, matriz 5x5 | ✅ Completo |
| **Aspectos Ambientales** | ISO 14001, matriz impactos | ✅ Completo |
| **Riesgos Viales** | PESV Res. 40595/2022, 5 pilares | ✅ Completo |
| **SAGRILAFT** | Lavado de activos | 🔜 Semana 10.5 |
| **Seguridad Info** | ISO 27001 | 🔜 Semana 10.5 |

**Componentes Frontend Implementados (Semana 9-10):**
- Contexto: MatrizDOFAVisual, EstrategiasTOWSGrid, PESTELChart, PorterDiagram
- Riesgos: MapaCalorRiesgos (5x5), RiesgoCard
- IPEVR: MatrizGTC45Table (7 categorías, 78 peligros), NivelRiesgoIndicator
- Aspectos Ambientales: 5 subtabs (Categorías, Aspectos, Impactos, Programas, Monitoreos)
- Riesgos Viales: 5 subtabs con MatrizRiesgoVisual, PilaresPESVNavigator, ChecklistInspeccion (32 items)

### Motor de Workflows (`workflow_engine`)

**Estado:** ✅ Backend + Frontend Types (Semana 10)
**Color:** Blue

| Tab | Descripción | Estado |
|-----|-------------|--------|
| **Diseñador de Flujos** | Editor visual BPMN | ✅ Backend + Types |
| **Ejecución** | Instancias en ejecución | ✅ Backend + Types |
| **Monitoreo** | Dashboard de flujos, SLA | ✅ Backend + Types |

**Arquitectura Workflow Engine:**
- 3 sub-apps: disenador_flujos (7 modelos), ejecucion (5 modelos), monitoreo (5 modelos)
- 17 modelos totales con soporte BPMN
- Gateways paralelos y exclusivos
- Evaluador de condiciones dinámico (AND/OR)
- Versionamiento automático de plantillas
- Notificaciones multi-canal (APP + EMAIL)
- SLA tracking con alertas automáticas

---

## Nivel 3: Torre de Control

### Gestión HSEQ (`hseq_management`)

**Estado:** 🔄 En Progreso (90%) - Backend S11-S14 ✅, Frontend S14 pendiente
**Color:** Green

| Tab | Descripción | Estado |
|-----|-------------|--------|
| **Sistema Documental** | Control de documentos y registros | ✅ S11 |
| **Planificación** | Plan anual HSEQ | ✅ S11 |
| **Calidad** | Gestión de calidad ISO 9001 | ✅ S12 |
| **Medicina Laboral** | Exámenes, vigilancia epidemiológica | ✅ S12 |
| **Seguridad Industrial** | Inspecciones, EPP, permisos trabajo | ✅ S13 |
| **Accidentalidad** | Investigación AT/EL, indicadores | ✅ S13 |
| **Emergencias** | Plan emergencias, simulacros, brigadas | ✅ S14 Backend |
| **Comités** | COPASST, Convivencia, Brigadas | ✅ S14 Backend |
| **Gestión Ambiental** | ISO 14001, residuos, vertimientos | ✅ S14 Backend |
| **Mejora Continua** | Auditorías, Hallazgos, Evaluación Cumplimiento | ✅ S14 Backend |

**Componentes Implementados (Semanas 11-14):**
- Sistema Documental: 7 modelos (TipoDocumento, PlantillaDocumento, Documento, VersionDocumento, CampoFormulario, FirmaDocumento, ControlDocumental)
- Planificación: 6 modelos (PlanTrabajoAnual, ActividadPlan, ObjetivoSistema, ProgramaGestion, ActividadPrograma, SeguimientoCronograma)
- Calidad: 5 modelos (NoConformidad, AccionCorrectiva, SalidaNoConforme, SolicitudCambio, ControlCambio)
- Medicina Laboral: 7 modelos (TipoExamen, ExamenMedico, RestriccionMedica, ProgramaVigilancia, CasoVigilancia, DiagnosticoOcupacional, EstadisticaMedica)
- Seguridad Industrial: 9 modelos (TipoPermisoTrabajo, PermisoTrabajo, TipoInspeccion, PlantillaInspeccion, Inspeccion, ItemInspeccion, TipoEPP, EntregaEPP, ProgramaSeguridad)
- Accidentalidad: 8 modelos (AccidenteTrabajo, EnfermedadLaboral, IncidenteTrabajo, InvestigacionATEL, CausaRaiz, LeccionAprendida, PlanAccionATEL, AccionPlan)
- Emergencias: 7 modelos (AnalisisVulnerabilidad, PlanEmergencia, PlanoEvacuacion, Brigada, Brigadista, Simulacro, RecursoEmergencia)
- Gestión Ambiental: 11 modelos (Aspectos, Impactos, Residuos, Vertimientos, Emisiones, Programas ambientales)
- Comités: 5 modelos (TipoComite, Comite, MiembroComite, ActaComite, Votacion)
- Mejora Continua: 4 modelos (ProgramaAuditoria, Auditoria, Hallazgo, EvaluacionCumplimiento)

---

## Nivel 4: Cadena de Valor

### Cadena de Suministro (`supply_chain`)

**Estado:** ⚠️ Legacy (refactor pendiente)
**Color:** Orange

| Tab | Descripción |
|-----|-------------|
| **Proveedores** | Gestión de proveedores |
| **Catálogos** | Productos y servicios |
| **Compras** | Órdenes de compra |
| **Almacenamiento** | Inventarios |
| **Liquidaciones** | Liquidación a proveedores |

### Operaciones de Producción (`production_ops`)

**Estado:** ⚠️ Legacy (refactor pendiente)
**Color:** Orange

| Tab | Descripción |
|-----|-------------|
| **Recepción** | Recepción de materia prima |
| **Lotes** | Control de lotes |
| **Procesamiento** | Órdenes de producción |
| **Mantenimiento** | Mantenimiento de equipos |

### Logística y Flota (`logistics_fleet`)

**Estado:** 🔜 Próximo
**Color:** Orange

| Tab | Descripción |
|-----|-------------|
| **Transporte** | Rutas y viajes |
| **Despachos** | Órdenes de despacho |
| **Flota Vehicular** | Gestión de vehículos |
| **PESV Operativo** | Control vial operativo |

### Ventas y CRM (`sales_crm`)

**Estado:** 🔜 Próximo
**Color:** Orange

| Tab | Descripción |
|-----|-------------|
| **Clientes** | Gestión de clientes |
| **Pipeline** | Oportunidades de venta |
| **Facturación** | Facturas electrónicas |
| **PQRS** | Quejas, reclamos, sugerencias |

---

## Nivel 5: Habilitadores

### Centro de Talento (`talent_hub`)

**Estado:** 🔜 Próximo
**Color:** Cyan

| Tab | Descripción |
|-----|-------------|
| **Colaboradores** | Gestión de personal |
| **Formación** | Capacitaciones |
| **Nómina** | Procesamiento nómina |
| **Desempeño** | Evaluación de desempeño |
| **Bienestar** | Programas de bienestar |

### Administración y Finanzas (`admin_finance`)

**Estado:** 🔜 Próximo
**Color:** Cyan

| Tab | Descripción |
|-----|-------------|
| **Tesorería** | Flujo de caja, bancos |
| **Presupuesto** | Control presupuestal |
| **Activos Fijos** | Inventario de activos |
| **Servicios Generales** | Servicios internos |

### Contabilidad (`accounting`)

**Estado:** 🔜 Activable
**Color:** Cyan

| Tab | Descripción |
|-----|-------------|
| **Plan de Cuentas** | PUC Colombia |
| **Movimientos** | Comprobantes contables |
| **Informes** | Estados financieros |
| **Cierre** | Cierre contable |

---

## Nivel 6: Inteligencia

### Analítica (`analytics`)

**Estado:** 🔜 Próximo
**Color:** Indigo

| Tab | Descripción |
|-----|-------------|
| **Indicadores** | KPIs del sistema |
| **Dashboard Gerencial** | Cuadro de mando |
| **Reportes** | Generador de reportes |
| **Benchmarking** | Comparación sectorial |

### Sistema de Auditoría (`audit_system`)

**Estado:** 🔜 Próximo
**Color:** Indigo

| Tab | Descripción |
|-----|-------------|
| **Logs de Sistema** | Trazabilidad de acciones |
| **Notificaciones** | Centro de notificaciones |
| **Centro de Alertas** | Alertas configurables |
| **Auditoría** | Programa de auditorías |

---

## Tipos de Materia Prima

El sistema maneja 18 tipos de materia prima:

| Categoría | Tipos |
|-----------|-------|
| **HUESO** | Hueso Crudo, Hueso Cocinado, Hueso Frito, Carnaza |
| **SEBO CRUDO** | Sebo de Res, Sebo de Cerdo, Grasa de Pollo, Chicharrón, Recorte de Grasa |
| **SEBO PROCESADO** | Sebo Fundido Res, Sebo Fundido Cerdo, Manteca Cerdo, Grasa Fundida Pollo, Aceite Reciclado, Aceite Trampa Grasa |
| **OTROS** | Vísceras, Sangre, Residuos Orgánicos |

---

## Roadmap de Desarrollo

Ver [CRONOGRAMA-26-SEMANAS.md](../planificacion/CRONOGRAMA-26-SEMANAS.md) para el plan detallado de desarrollo por semanas.

---

## Documentación Relacionada

- [DATABASE-ARCHITECTURE.md](DATABASE-ARCHITECTURE.md) - 154 tablas documentadas
- [ARQUITECTURA-DINAMICA.md](../desarrollo/ARQUITECTURA-DINAMICA.md) - Sistema dinámico
