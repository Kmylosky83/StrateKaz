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
│ NIVEL 2: CUMPLIMIENTO                                   ✅ Backend  │
│   ├── motor_cumplimiento/  ├── motor_riesgos/                      │
│   └── workflow_engine/                                              │
├─────────────────────────────────────────────────────────────────────┤
│ NIVEL 3: TORRE DE CONTROL                               ✅ Backend  │
│   └── hseq_management/                                              │
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

**Estado:** ✅ Backend
**Color:** Blue

| Tab | Descripción |
|-----|-------------|
| **Contexto** | Análisis FODA, PESTEL |
| **Riesgos y Oportunidades** | Matriz de riesgos estratégicos |
| **IPEVR** | Identificación de peligros y evaluación de riesgos |
| **Aspectos Ambientales** | Matriz de aspectos e impactos |
| **Riesgos Viales** | Matriz PESV |
| **SAGRILAFT** | Lavado de activos |
| **Seguridad Info** | ISO 27001 |

### Motor de Workflows (`workflow_engine`)

**Estado:** ✅ Backend
**Color:** Blue

| Tab | Descripción |
|-----|-------------|
| **Diseñador de Flujos** | Editor visual de workflows |
| **Ejecución** | Instancias en ejecución |
| **Monitoreo** | Dashboard de flujos |

---

## Nivel 3: Torre de Control

### Gestión HSEQ (`hseq_management`)

**Estado:** ✅ Backend (11 tabs)
**Color:** Green

| Tab | Descripción |
|-----|-------------|
| **Sistema Documental** | Control de documentos y registros |
| **Planificación** | Plan anual HSEQ |
| **Calidad** | Gestión de calidad ISO 9001 |
| **Medicina Laboral** | Exámenes, vigilancia epidemiológica |
| **Seguridad Industrial** | Inspecciones, EPP, permisos trabajo |
| **Higiene Industrial** | Mediciones, monitoreo exposición |
| **Comités** | COPASST, Convivencia, Brigadas |
| **Accidentalidad** | Investigación AT/EL, indicadores |
| **Emergencias** | Plan emergencias, simulacros |
| **Gestión Ambiental** | ISO 14001, residuos, vertimientos |
| **Mejora Continua** | NC, AC, AP, Auditorías |

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
