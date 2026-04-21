# ARQUITECTURA CASCADA V2 — StrateKaz SGI

**Versión:** 2.0.0
**Fecha:** 2026-03-15
**Estado:** APROBADA (diseño conceptual)
**Autores:** CEO StrateKaz + Claude (análisis conjunto)

---

## Tabla de Contenido

1. [Filosofía](#1-filosofía)
2. [Cascada: 14 Niveles + Infraestructura](#2-cascada-14-niveles--infraestructura)
3. [Detalle por Nivel](#3-detalle-por-nivel)
4. [Módulos de Infraestructura](#4-módulos-de-infraestructura)
5. [Módulo de Configuración](#5-módulo-de-configuración)
6. [Flujo de Datos (quién crea, quién consume)](#6-flujo-de-datos)
7. [Ciclo PHVA](#7-ciclo-phva)
8. [SIDEBAR_LAYERS y Orden Backend/Frontend](#8-sidebar_layers-y-orden)
9. [Plantillas por Industria](#9-plantillas-por-industria)
10. [Activación Granular](#10-activación-granular)
11. [Portales](#11-portales)
12. [Reglas de Independencia](#12-reglas-de-independencia)
13. [Migración desde V1](#13-migración-desde-v1)

---

## 1. Filosofía

### El problema que resolvemos

El 80% de las empresas colombianas compran software de gestión y no lo usan porque los obligan a configurar todo al tiempo: DOFA, riesgos, documentos, indicadores — todo desde el día 1. El resultado: parálisis y abandono.

### La solución: cascada lógica

StrateKaz guía al empresario paso a paso, en el orden natural de constitución y operación de una empresa colombiana. Cada paso consume del anterior, nunca al revés. **Zero circularidad.**

### Principios

| Principio | Descripción |
|-----------|-------------|
| **Cascada** | Cada nivel se construye sobre el anterior |
| **Zero circularidad** | Nivel N nunca necesita de nivel N+1 para funcionar |
| **Una fuente de verdad** | Personas en PI, cosas en Activos, documentos en Gestión Documental |
| **Cargo como centro** | Documentos, EPP, turnos, permisos — todo se asigna al cargo, no a la persona |
| **Consumo, no duplicación** | Los módulos operativos consumen datos maestros, no los recrean |
| **PHVA cerrado** | La cascada es lineal, pero Acciones de Mejora retroalimenta Planificación |
| **Activación progresiva** | El tenant crece activando módulos. La cascada guía el orden, no lo obliga |
| **Backend = Frontend** | El orden en SIDEBAR_LAYERS es idéntico al orden en el sidebar y dashboard |

---

## 2. Cascada: 14 Niveles + Infraestructura

```
 ┌─────────────────────────────────────────────────────────────┐
 │  1. FUNDACIÓN                                               │
 │     Mi Empresa → Contexto e Identidad → Organización        │
 │     → Políticas y Reglamentos                               │
 ├─────────────────────────────────────────────────────────────┤
 │  2. GESTIÓN DOCUMENTAL                                      │
 │     Crear/cargar → Aprobar → Asignar a cargos               │
 ├─────────────────────────────────────────────────────────────┤
 │  3. WORKFLOWS                                               │
 │     Motor transversal de flujos y aprobaciones               │
 ├─────────────────────────────────────────────────────────────┤
 │  4. MI EQUIPO                                               │
 │     Perfiles → Selección → Contratación → Onboarding        │
 │     (entrega de activos, EPP, documentos por cargo)          │
 ├─────────────────────────────────────────────────────────────┤
 │  5. PLANIFICACIÓN OPERATIVA                                 │
 │     Plan de trabajo por proceso → Programas → Recursos  ◄───┼─── retroalimenta
 ├─────────────────────────────────────────────────────────────┤         │
 │  6. PLANEACIÓN ESTRATÉGICA                                  │         │
 │     DOFA → BSC → Proyectos → Gestión del cambio        ◄───┼─── retroalimenta
 ├─────────────────────────────────────────────────────────────┤         │
 │  7. PROTECCIÓN Y CUMPLIMIENTO                               │         │
 │     Legal → Riesgos → IPEVR → Ambiental → Vial → Info      │         │
 ├─────────────────────────────────────────────────────────────┤         │
 │  8. GESTIÓN INTEGRAL (HSEQ)                                 │         │
 │     Medicina → Seguridad → Higiene → Comités → ATEL         │         │
 │     → Emergencias → Ambiental                               │         │
 ├─────────────────────────────────────────────────────────────┤         │
 │  9. CADENA DE VALOR                                         │         │
 │     Supply Chain → Producción → Logística → Ventas/CRM      │         │
 ├─────────────────────────────────────────────────────────────┤         │
 │ 10. TALENTO (gestión continua)                              │         │
 │     Formación → Desempeño → Control Tiempo → Nómina         │         │
 │     → Disciplinario → Off Boarding                          │         │
 ├─────────────────────────────────────────────────────────────┤         │
 │ 11. SOPORTE                                                 │         │
 │     Administración (Activos + Servicios) → Tesorería        │         │
 │     → Contabilidad                                          │         │
 ├─────────────────────────────────────────────────────────────┤         │
 │ 12. INTELIGENCIA                                            │         │
 │     Dashboard → Indicadores → Análisis → Informes           │         │
 ├─────────────────────────────────────────────────────────────┤         │
 │ 13. REVISIÓN POR LA DIRECCIÓN                               │         │
 │     Programación → Actas → Compromisos                      │         │
 ├─────────────────────────────────────────────────────────────┤         │
 │ 14. ACCIONES DE MEJORA (cierre PHVA)                        │         │
 │     NC → Correctivas → Oportunidades                        │         │
 │       → genera Plan de Acción ──────────────────────────────┼────────┘
 │       → genera Proyecto ────────────────────────────────────┼────────┘
 │       → genera Cambio de proceso → FUNDACIÓN                │
 └─────────────────────────────────────────────────────────────┘

 INFRAESTRUCTURA (transversal, siempre disponible):
   → Notificaciones, Tareas, Alertas, Logs

 CONFIGURACIÓN (admin de plataforma):
   → Módulos, Consecutivos, Integraciones, Config Indicadores, Exportación
```

---

## 3. Detalle por Nivel

### Nivel 1: FUNDACIÓN

**Código:** `fundacion`
**Orden:** 10
**Color:** `#3B82F6` (blue)
**Icono:** `Landmark`
**Ruta:** `/fundacion`
**Propósito:** Constituir la empresa — quién soy, dónde estoy, cómo me organizo, qué reglas tengo.

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Mi Empresa** | `mi_empresa` | 1 | `empresa`, `sedes`, `unidades_negocio` | Datos legales (NIT, razón social, sector, actividad económica), ubicaciones físicas, divisiones operativas |
| **Mi Contexto e Identidad** | `contexto_identidad` | 2 | `partes_interesadas`, `analisis_contexto`, `mision_vision`, `valores`, `normas_iso`, `alcance_sig` | Stakeholders (catálogo maestro), análisis del entorno (PESTEL, Porter), identidad corporativa (nace del contexto), normas aplicables y alcance del SIG |
| **Mi Organización** | `organizacion` | 3 | `areas`, `cargos`, `organigrama`, `caracterizaciones`, `mapa_procesos` | Estructura de procesos con objetivos, cargos (con turnos, EPP requerido, documentos, permisos), organigrama visual, fichas SIPOC, mapa de procesos |
| **Mis Políticas y Reglamentos** | `politicas_reglamentos` | 4 | `politicas_obligatorias`, `reglamento_interno`, `contratos_tipo` | Documentos fundacionales obligatorios por ley colombiana, con flujo de firmas |

**Secciones detalladas de cada tab:**

#### Tab 1: Mi Empresa

| Sección | Código | Descripción |
|---------|--------|-------------|
| Empresa | `empresa` | Razón social, NIT, sector económico, actividad CIIU, datos de contacto, branding, configuración regional |
| Sedes | `sedes` | Ubicaciones físicas: dirección, ciudad, departamento, tipo (principal, sucursal, planta, bodega) |
| Unidades de Negocio | `unidades_negocio` | Divisiones operativas de la empresa. Se consumen en Supply Chain, Contabilidad (centros de costo), Presupuesto |

#### Tab 2: Mi Contexto e Identidad

| Sección | Código | Descripción |
|---------|--------|-------------|
| Partes Interesadas | `partes_interesadas` | **Catálogo maestro de stakeholders.** Tipos: Proveedor, Cliente, Colaborador, Entidad (ARL, EPS, gobierno), Comunidad, Consultor. Una sola fuente de verdad — todos los módulos consumen de aquí |
| Análisis del Contexto | `analisis_contexto` | Herramientas de diagnóstico: PCI, POAM, PESTEL, Porter. El empresario entiende su entorno, competencia, oportunidades y amenazas ANTES de definir su identidad |
| Misión y Visión | `mision_vision` | Direccionamiento estratégico. NACE del análisis del contexto — no se inventa en el vacío |
| Valores | `valores` | Principios y valores corporativos |
| Normas | `normas_iso` | Normas ISO y sistemas de gestión que aplica la empresa (9001, 14001, 45001, 27001, etc.) |
| Alcance del SIG | `alcance_sig` | Cobertura geográfica, procesos incluidos, exclusiones del Sistema Integrado de Gestión |

#### Tab 3: Mi Organización

| Sección | Código | Descripción |
|---------|--------|-------------|
| Procesos | `areas` | Estructura jerárquica de áreas y procesos organizacionales. **Cada proceso tiene objetivo, líder, tipo (estratégico, misional, apoyo)** |
| Cargos | `cargos` | Gestión de cargos con: manual de funciones, permisos del sistema, **turno/jornada laboral**, **EPP requerido**, **activos asignables**, **documentos asignados** |
| Organigrama | `organigrama` | Visualización interactiva de la jerarquía de cargos |
| Caracterizaciones | `caracterizaciones` | Ficha SIPOC por proceso: proveedores, entradas, actividades, salidas, clientes. Referencia documentos del proceso (no los alberga) |
| Mapa de Procesos | `mapa_procesos` | Visualización interactiva de la estructura de procesos (estratégicos, misionales, apoyo) |

#### Tab 4: Mis Políticas y Reglamentos

| Sección | Código | Descripción |
|---------|--------|-------------|
| Políticas Obligatorias | `politicas_obligatorias` | Política Integral (SST+Calidad+Ambiental), Política de Habeas Data (Ley 1581/2012), Política de Acoso Laboral (Ley 1010/2006), Política de Desconexión Laboral (Ley 2191/2022), Política de Seguridad de la Información. Con flujo de firma gerencial |
| Reglamento Interno | `reglamento_interno` | Reglamento Interno de Trabajo (CST Art. 104-125). Obligatorio antes del primer empleado |
| Contratos Tipo | `contratos_tipo` | Plantillas de contratos laborales: término fijo, término indefinido, obra o labor, prestación de servicios |

---

### Nivel 2: GESTIÓN DOCUMENTAL

**Código:** `gestion_documental`
**Orden:** 15
**Color:** `#6366F1` (indigo)
**Icono:** `FileText`
**Ruta:** `/gestion-documental`
**Propósito:** Crear, aprobar, versionar y asignar documentos a cargos. Infraestructura documental de todo el sistema.

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Tipos de Documento** | `tipos_documento` | 1 | `tipos_documento` | Clasificación: procedimiento, instructivo, formato, registro, manual, guía, protocolo |
| **Documentos** | `documentos` | 2 | `documentos`, `asignacion_cargos` | Crear o cargar documentos. **Flujo de estados: Borrador → Revisión → Aprobado → Vigente → Obsoleto.** Solo documentos VIGENTES son visibles fuera del gestor. Asignación a cargos: el documento se vincula a uno o más cargos, no a personas |
| **Control de Cambios** | `control_cambios` | 3 | `historial_versiones` | Historial de versiones, quién cambió qué y cuándo |
| **Distribución** | `distribucion` | 4 | `distribucion` | Control de copias y distribución. Registro de lectura y firma por colaborador |

**Flujo de aprobación de documentos:**

```
Líder crea documento (BORRADOR)
    ↓
Revisor asignado valida (REVISIÓN)
    ↓
Gerencia aprueba con firma digital (APROBADO → VIGENTE)
    ↓
Sistema automáticamente:
  → Asigna a cargos configurados
  → Aparece en Mi Portal del colaborador
  → Disponible como referencia en todos los módulos
  → Onboarding lo incluye para nuevos ingresos
    ↓
Cuando se actualiza:
  → Nueva versión entra como BORRADOR
  → Versión anterior se marca OBSOLETA al aprobar la nueva
  → Historial completo se mantiene
```

---

### Nivel 3: WORKFLOWS

**Código:** `workflow_engine`
**Orden:** 18
**Color:** `#8B5CF6` (purple)
**Icono:** `Workflow`
**Ruta:** `/workflows`
**Propósito:** Motor transversal de flujos de aprobación y automatización. Se usa desde Gestión Documental en adelante.

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Diseñador de Flujos** | `disenador_flujos` | 1 | `flujos` | Diseño visual de flujos de trabajo BPMN |
| **Ejecución** | `ejecucion` | 2 | `instancias` | Instancias de flujo en ejecución |
| **Monitoreo** | `monitoreo` | 3 | `metricas` | Métricas de rendimiento de flujos |

**Flujos transversales que alimenta:**

| Módulo | Flujo |
|--------|-------|
| Gestión Documental | Aprobación de documentos |
| Mi Equipo | Aprobación de contratación |
| Supply Chain | Aprobación de órdenes de compra |
| Planeación Estratégica | Aprobación de cambios |
| Soporte | Aprobación de pagos |

---

### Nivel 4: MI EQUIPO

**Código:** `mi_equipo`
**Orden:** 20
**Color:** `#0EA5E9` (sky)
**Icono:** `UserPlus`
**Ruta:** `/mi-equipo`
**Propósito:** Ciclo de vinculación del colaborador — desde el perfil del cargo hasta que está listo para trabajar.

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Perfiles de Cargo** | `perfiles_cargo` | 1 | `perfiles_cargo` | Requisitos, competencias y SST por cargo. Consume cargos de Fundación |
| **Selección y Contratación** | `seleccion_contratacion` | 2 | `vacantes`, `candidatos`, `contratacion` | Publicación de vacantes, evaluación de candidatos, proceso de contratación |
| **Colaboradores** | `colaboradores` | 3 | `directorio`, `hoja_vida`, `contratos` | Directorio de colaboradores activos, información personal/laboral, contratos |
| **Onboarding e Inducción** | `onboarding_induccion` | 4 | `programas_induccion`, `afiliaciones`, `entrega_dotacion` | Programas de inducción, afiliaciones a seguridad social. **Entrega de activos y EPP según cargo** (consume de Administración/Activos e inventario EPP). Documentos por cargo (consume de Gestión Documental) |

**Flujo de onboarding automatizado:**

```
Colaborador creado con cargo "Operario de Planta"
    ↓
Sistema genera checklist automático:
  ☐ Documentos a leer y firmar (de Gestión Documental, asignados al cargo)
  ☐ EPP a entregar (definido en Fundación/Cargos):
      → Casco (serial X) — descontado de inventario
      → Guantes (lote Y) — descontado de inventario
      → Botas (ref Z) — descontado de inventario
  ☐ Activos a asignar (definido en Fundación/Cargos):
      → Computador HP-001 (de Administración/Activos)
  ☐ Afiliaciones: EPS, ARL, Pensión, Caja
  ☐ Inducción: programa asignado al cargo
    ↓
Todo con firma digital del colaborador
    ↓
Onboarding completado → colaborador ACTIVO
```

---

### Nivel 5: PLANIFICACIÓN OPERATIVA

**Código:** `planificacion_operativa`
**Orden:** 25
**Color:** `#0EA5E9` (sky)
**Icono:** `Calendar`
**Ruta:** `/planificacion-operativa`
**Propósito:** Cada proceso define qué va a hacer, con qué recursos y en qué cronograma. Prerequisito para la planeación estratégica.

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Plan de Trabajo** | `plan_trabajo` | 1 | `plan_trabajo` | Cronograma unificado de actividades por proceso. Consume objetivos de procesos definidos en Fundación. Categorías y filtros por proceso, programa, tipo |
| **Programas** | `programas` | 2 | `programas` | Programas de gestión (SST, Ambiental, Calidad, Formación). Sus actividades se integran al Plan de Trabajo |
| **Recursos** | `recursos` | 3 | `recursos_proceso` | Recursos necesarios por proceso. Alimenta Presupuesto en Soporte |

---

### Nivel 6: PLANEACIÓN ESTRATÉGICA

**Código:** `planeacion_estrategica`
**Orden:** 30
**Color:** `#6366F1` (indigo)
**Icono:** `Target`
**Ruta:** `/planeacion-estrategica`
**Propósito:** Con el equipo ya vinculado y los procesos planificados, definir la estrategia de la empresa.

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **DOFA y Estrategias** | `dofa_estrategias` | 1 | `dofa_estrategias` | Matriz DOFA (consume análisis de contexto de Fundación). Formulación de estrategias. Cada estrategia genera Proyecto, Acción o Cambio |
| **Plan Estratégico** | `planeacion` | 2 | `objetivos_bsc`, `mapa_estrategico`, `gestion_cambio` | Objetivos por perspectiva BSC, mapa estratégico visual (causa-efecto), gestión del cambio |
| **Gestión de Proyectos** | `gestion_proyectos` | 3 | `portafolio`, `iniciacion`, `planificacion`, `ejecucion_monitoreo`, `cierre` | Portafolio de proyectos estratégicos. Asignación de responsables (consumen colaboradores de Mi Equipo). Ciclo PMI completo |

**Nota:** El análisis de contexto (PESTEL, PCI, POAM, Porter) se CONSUME de Fundación Tab 2. Aquí solo vive la DOFA como herramienta de decisión estratégica, no de diagnóstico.

---

### Nivel 7: PROTECCIÓN Y CUMPLIMIENTO

**Código:** `proteccion_cumplimiento`
**Orden:** 35
**Color:** `#F59E0B` (amber)
**Icono:** `ShieldCheck`
**Ruta:** `/proteccion`
**Propósito:** Identificar todo lo que puede afectar a la empresa y sus trabajadores ANTES de operar. Blindaje legal obligatorio en Colombia.

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Cumplimiento Legal** | `cumplimiento_legal` | 1 | `normas`, `requisitos`, `reglamentos`, `evaluacion` | Matriz legal (normas, decretos, resoluciones), requisitos legales aplicables, reglamentos internos, evaluación de cumplimiento |
| **Riesgos por Proceso** | `riesgos_procesos` | 2 | `matriz_riesgos`, `controles` | Identificación y valoración de riesgos por proceso (ISO 31000). Controles asociados |
| **IPEVR - Peligros SST** | `ipevr` | 3 | `identificacion_peligros` | Identificación de peligros, evaluación y valoración de riesgos en SST por cargo y actividad (GTC-45) |
| **Aspectos Ambientales** | `aspectos_ambientales` | 4 | `matriz_aspectos` | Aspectos e impactos ambientales significativos (ISO 14001) |
| **Riesgos Viales** | `riesgos_viales` | 5 | `matriz_vial` | Riesgos viales asociados al PESV (Resolución 40595) |
| **Seguridad de la Información** | `seguridad_informacion` | 6 | `activos_info` | Riesgos de seguridad de la información (ISO 27001) |
| **SAGRILAFT/PTEE** | `sagrilaft_ptee` | 7 | `riesgos_laft` | Gestión de riesgos de lavado de activos (si aplica por sector) |

**Consolida lo que hoy son 2 módulos separados:** `motor_cumplimiento` + `motor_riesgos` → un solo módulo de protección integral.

---

### Nivel 8: GESTIÓN INTEGRAL (HSEQ)

**Código:** `gestion_integral`
**Orden:** 40
**Color:** `#10B981` (emerald)
**Icono:** `Shield`
**Ruta:** `/gestion-integral`
**Propósito:** Ejecución diaria de la protección. Protección (nivel 7) identifica QUÉ puede pasar; HSEQ ejecuta CÓMO protegerse en el día a día.

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Medicina Laboral** | `medicina_laboral` | 1 | `examenes_medicos`, `condiciones_salud` | Exámenes médicos ocupacionales, seguimiento de condiciones de salud |
| **Seguridad Industrial** | `seguridad_industrial` | 2 | `inspecciones` | Inspecciones de seguridad industrial. Consume controles de Protección |
| **Higiene Industrial** | `higiene_industrial` | 3 | `mediciones` | Mediciones higiénicas ambientales |
| **Gestión de Comités** | `gestion_comites` | 4 | `comites` | COPASST, Convivencia y otros comités obligatorios |
| **Accidentalidad (ATEL)** | `accidentalidad` | 5 | `registro_atel`, `investigacion` | Registro de accidentes de trabajo y enfermedades laborales, investigación de incidentes |
| **Emergencias** | `emergencias` | 6 | `plan_emergencias` | Plan de prevención, preparación y respuesta ante emergencias |
| **Gestión Ambiental** | `gestion_ambiental` | 7 | `programas_ambientales` | Programas de gestión ambiental operativos |

---

### Nivel 9: CADENA DE VALOR

La cadena de valor agrupa 4 módulos operativos independientes que siguen el flujo natural: **COMPRAR → PRODUCIR → ENTREGAR → VENDER**.

#### 9A: Supply Chain (Cadena de Suministro)

**Código:** `supply_chain`
**Orden:** 50
**Color:** `#10B981` (green)
**Icono:** `Package`
**Ruta:** `/supply-chain`

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Proveedores** | `proveedores` | 1 | `registro_proveedores`, `importacion_proveedores` | **CONSUME de Partes Interesadas (Fundación).** Enriquece con datos comerciales |
| **Precios** | `precios` | 2 | `precios_materia_prima` | Control de precios por tipo de materia prima |
| **Compras** | `compras` | 3 | `ordenes_compra` | Gestión de órdenes de compra. Consume unidades de negocio y sedes de Fundación |
| **Almacenamiento** | `almacenamiento` | 4 | `inventario` | Control de inventario y almacén |
| **Programación** | `programacion_abastecimiento` | 5 | `programacion_sc` | Programación de abastecimiento |
| **Evaluaciones** | `evaluaciones` | 6 | `evaluaciones_prov` | Evaluación periódica de proveedores |
| **Catálogos** | `catalogos` | 7 | `catalogos_sc` | Catálogos dinámicos de la cadena de suministro |

#### 9B: Base de Operaciones (Producción)

**Código:** `production_ops`
**Orden:** 51
**Color:** `#F59E0B` (amber)
**Icono:** `Factory`
**Ruta:** `/produccion`

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Recepción** | `recepcion` | 1 | `recepcion_mp` | Recepción de materia prima |
| **Procesamiento** | `procesamiento` | 2 | `ordenes_produccion` | Gestión de órdenes de producción. **Consume activos tipo "productivo" de Administración** |
| **Mantenimiento Industrial** | `mantenimiento_industrial` | 3 | `plan_mantenimiento` | Mantenimiento preventivo y correctivo de maquinaria. **Consume activos tipo "productivo"** |
| **Producto Terminado** | `producto_terminado` | 4 | `lotes` | Control de producto terminado y lotes |

#### 9C: Logística y Flota

**Código:** `logistics_fleet`
**Orden:** 52
**Color:** `#06B6D4` (cyan)
**Icono:** `Truck`
**Ruta:** `/logistica`

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Gestión Transporte** | `gestion_transporte` | 1 | `rutas` | Gestión de rutas de transporte |
| **Despachos** | `despachos` | 2 | `ordenes_despacho` | Programación y seguimiento de despachos |
| **Gestión de Flota** | `gestion_flota` | 3 | `vehiculos` | **Consume activos tipo "vehículo" de Administración.** SOAT, tecnomecánica, kilometraje |
| **PESV Operativo** | `pesv_operativo` | 4 | `pesv` | Plan Estratégico de Seguridad Vial operativo |

#### 9D: Ventas y CRM

**Código:** `sales_crm`
**Orden:** 53
**Color:** `#F43F5E` (rose)
**Icono:** `TrendingUp`
**Ruta:** `/ventas`

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Gestión de Clientes** | `gestion_clientes` | 1 | `clientes` | **CONSUME de Partes Interesadas (Fundación).** Enriquece con datos comerciales |
| **Pipeline Ventas** | `pipeline_ventas` | 2 | `oportunidades_venta` | Pipeline y oportunidades de venta |
| **Pedidos y Facturación** | `pedidos_facturacion` | 3 | `pedidos` | Gestión de pedidos y facturación |
| **Servicio al Cliente** | `servicio_cliente` | 4 | `pqrs` | Peticiones, quejas, reclamos y sugerencias |

**Futuro: Punto de Venta (POS)** como tab adicional o módulo propio. Consume catálogos de Supply Chain, clientes de PI, alimenta Tesorería y Contabilidad.

---

### Nivel 10: TALENTO (Gestión Continua)

**Código:** `talent_hub`
**Orden:** 60
**Color:** `#8B5CF6` (violet)
**Icono:** `GraduationCap`
**Ruta:** `/talento`
**Propósito:** Gestión del ciclo laboral continuo — desde formación hasta retiro. La vinculación (selección, contratación, onboarding) ya se hizo en MI EQUIPO (nivel 4).

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Formación y Gamificación** | `formacion_reinduccion` | 1 | `plan_formacion`, `capacitaciones`, `reinduccion` | Plan de formación, capacitaciones, reinducción. Incluye Juego SST |
| **Desempeño** | `desempeno` | 2 | `evaluaciones_desempeno`, `planes_desarrollo` | Evaluaciones de desempeño, planes de desarrollo |
| **Control de Tiempo** | `control_tiempo` | 3 | `turnos`, `marcajes`, `ausencias` | **Turnos se configuran en Fundación/Cargos.** Aquí se asignan, registran marcajes y gestionan ausencias |
| **Novedades y Nómina** | `novedades_nomina` | 4 | `registro_novedades`, `liquidacion_nomina`, `prestaciones` | Novedades que afectan liquidación. Cálculo de nómina. **El PAGO se confirma en Tesorería (Soporte)** |
| **Proceso Disciplinario** | `proceso_disciplinario` | 5 | `casos_disciplinarios` | Gestión de procesos disciplinarios |
| **Off Boarding** | `off_boarding` | 6 | `proceso_retiro`, `liquidacion_final`, `paz_salvo` | Proceso de retiro. **Paz y salvo incluye devolución de activos y EPP** → reintegro a inventario |

---

### Nivel 11: SOPORTE

Agrupa 3 sub-módulos de soporte administrativo y financiero.

#### 11A: Administración

**Código:** `administracion`
**Orden:** 70
**Color:** `#F59E0B` (amber)
**Icono:** `Building2`
**Ruta:** `/administracion`

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Activos** | `activos_fijos` | 1 | `inventario_activos`, `hojas_vida`, `depreciacion` | **Catálogo maestro de TODOS los activos** (administrativos, productivos, vehículos, infraestructura). Hoja de vida por activo. Depreciación → alimenta Contabilidad. Tipos: administrativo, productivo, vehículo, infraestructura |
| **Servicios Generales** | `servicios_generales` | 2 | `gestion_servicios` | Mantenimiento de activos administrativos e infraestructura. Gestión de servicios generales |
| **Presupuesto** | `presupuesto` | 3 | `partidas_presupuestales`, `ejecucion_presupuestal` | Consume recursos planificados de Planificación Operativa. Seguimiento ejecución vs presupuesto |

#### 11B: Tesorería

**Código:** `tesoreria`
**Orden:** 71
**Color:** `#10B981` (emerald)
**Icono:** `Wallet`
**Ruta:** `/tesoreria`

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Flujo de Caja** | `flujo_caja` | 1 | `flujo_caja`, `cuentas_bancarias` | Control de ingresos/egresos. **Confirma pagos de:** nómina (Talento), proveedores (Supply Chain), honorarios consultores, servicios |
| **Pagos y Dispersión** | `pagos` | 2 | `pagos_proveedores`, `pagos_nomina`, `pagos_honorarios` | Confirmación y dispersión de pagos. Integración bancaria |

#### 11C: Contabilidad

**Código:** `accounting`
**Orden:** 72
**Color:** `#84CC16` (lime)
**Icono:** `Calculator`
**Ruta:** `/contabilidad`

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Config. Contable** | `config_contable` | 1 | `plan_cuentas`, `centros_costo`, `periodos_contables` | Plan único de cuentas (PUC colombiano), centros de costo (consumen unidades de negocio de Fundación), períodos |
| **Movimientos** | `movimientos` | 2 | `comprobantes`, `libro_diario` | Comprobantes contables, libro diario. **Recibe de:** Tesorería, Nómina, Compras, Ventas, Depreciación |
| **Informes Contables** | `informes_contables` | 3 | `balance_general`, `estado_resultados` | Estados financieros |
| **Integración** | `integracion` | 4 | `integracion_contable` | Integración con otros módulos y sistemas externos |

---

### Nivel 12: INTELIGENCIA

**Código:** `analytics`
**Orden:** 80
**Color:** `#8B5CF6` (purple)
**Icono:** `BarChart3`
**Ruta:** `/analytics`
**Propósito:** Medir, analizar y generar informes. Consume datos de TODOS los módulos operativos.

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Dashboard Gerencial** | `dashboard_gerencial` | 1 | `tableros` | Vista ejecutiva consolidada. KPIs principales |
| **Indicadores por Área** | `indicadores_area` | 2 | `indicadores`, `mediciones` | Indicadores de gestión por área y proceso. Mediciones periódicas |
| **Análisis y Tendencias** | `analisis_tendencias` | 3 | `tendencias` | Proyecciones, comparativos, análisis estadístico |
| **Generador de Informes** | `generador_informes` | 4 | `plantillas_informe` | Plantillas y generación de informes para junta directiva |

---

### Nivel 13: REVISIÓN POR LA DIRECCIÓN

**Código:** `revision_direccion`
**Orden:** 85
**Color:** `#8B5CF6` (purple)
**Icono:** `ClipboardCheck`
**Ruta:** `/revision-direccion`
**Propósito:** Cierre del ciclo gerencial. Consume datos de todos los módulos para revisión ejecutiva.

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **Revisión por la Dirección** | `revision_direccion` | 1 | `programacion`, `actas`, `compromisos` | Programación de revisiones, actas de reunión, compromisos. **Los compromisos generan acciones que retroalimentan la cascada** |

---

### Nivel 14: ACCIONES DE MEJORA

**Código:** `acciones_mejora`
**Orden:** 90
**Color:** `#EF4444` (red)
**Icono:** `TrendingUp`
**Ruta:** `/acciones-mejora`
**Propósito:** Cierre del ciclo PHVA. Recibe hallazgos de cualquier origen y genera planes de acción que retroalimentan la cascada.

| Tab | Código | Orden | Secciones | Descripción |
|-----|--------|-------|-----------|-------------|
| **No Conformidades** | `no_conformidades` | 1 | `no_conformidades` | Registro y tratamiento de NC. Origen: auditorías, inspecciones, quejas, accidentes, indicadores, revisión por la dirección |
| **Acciones Correctivas** | `acciones_correctivas` | 2 | `acciones_correctivas` | Plan de acción para eliminar causas. **Genera:** actividad en Plan de Trabajo (nivel 5), proyecto en Planeación (nivel 6), cambio de proceso en Fundación (nivel 1) |
| **Oportunidades de Mejora** | `oportunidades_mejora` | 3 | `oportunidades_mejora` | Ideas y proyectos de mejora continua. Mismo mecanismo de generación |

**Orígenes de acciones de mejora:**

| Origen | Módulo |
|--------|--------|
| Indicador fuera de meta | Inteligencia |
| Hallazgo de auditoría | Revisión / Auditoría (futuro) |
| Queja o PQRS de cliente | Ventas/CRM |
| Accidente o incidente laboral | HSEQ |
| Hallazgo de inspección | HSEQ |
| Compromiso de revisión gerencial | Revisión por la Dirección |
| Evaluación de cumplimiento legal | Protección y Cumplimiento |
| Evaluación de proveedor deficiente | Supply Chain |

---

## 4. Módulos de Infraestructura

Transversales, siempre disponibles, no forman parte de la cascada lineal.

### Notificaciones y Alertas

**No son un módulo visible en sidebar.** Se acceden desde:
- Campana en el header (notificaciones)
- Mi Portal del colaborador (bandeja de tareas)
- Configuración de alertas (admin)

| Componente | Dónde se muestra | Descripción |
|------------|-----------------|-------------|
| Notificaciones | Header (campana) + Mi Portal | Documento pendiente de firma, tarea asignada, aprobación solicitada |
| Tareas/Recordatorios | Mi Portal | Actividades pendientes del colaborador |
| Alertas configurables | Admin por cargo/rol | Vencimiento de documentos, EPP, contratos, indicadores |

### Centro de Control (Logs)

**Solo visible para administradores y superusuarios.**

| Componente | Descripción |
|------------|-------------|
| Logs de Auditoría | Registro de actividad y trazabilidad |
| Auditoría de Cambios | Quién cambió qué y cuándo |

---

## 5. Módulo de Configuración

**Código:** `configuracion_plataforma`
**Visible solo para:** Administrador del tenant / Superadmin
**Propósito:** Ajustes técnicos de la plataforma que NO son "fundar la empresa".

| Sección | Código | Descripción |
|---------|--------|-------------|
| Módulos del Sistema | `modulos` | Activar/desactivar módulos, tabs, secciones |
| Consecutivos | `consecutivos` | Numeración automática de documentos por tipo |
| Integraciones | `integraciones` | Conexiones con sistemas externos |
| Config. Indicadores | `config_indicadores` | Tipos de indicador, fuentes de datos |
| Exportación | `exportacion` | Exportación de datos e integración con BI externo |

---

## 6. Flujo de Datos

### Quién CREA (fuente de verdad)

| Dato maestro | Se crea en | Código |
|-------------|-----------|--------|
| Empresa, Sedes, Unidades de Negocio | Fundación | `fundacion` |
| Partes Interesadas (todos los tipos) | Fundación | `fundacion` |
| Procesos con objetivos | Fundación | `fundacion` |
| Cargos (con turnos, EPP, documentos, permisos) | Fundación | `fundacion` |
| Documentos controlados | Gestión Documental | `gestion_documental` |
| Flujos de aprobación | Workflows | `workflow_engine` |
| Colaboradores vinculados | Mi Equipo | `mi_equipo` |
| Activos (inventario maestro) | Administración | `administracion` |

### Quién CONSUME

| Módulo consumidor | Qué consume | De dónde |
|-------------------|-------------|----------|
| Supply Chain | Proveedores | Fundación/PI |
| Sales CRM | Clientes | Fundación/PI |
| Mi Equipo | Colaboradores, cargos | Fundación/PI, Fundación/Cargos |
| Mi Equipo/Onboarding | Documentos, EPP, activos | Gestión Documental, Supply Chain, Administración |
| Production Ops | Activos tipo "productivo" | Administración |
| Logistics Fleet | Activos tipo "vehículo" | Administración |
| Planeación Estratégica | Análisis de contexto | Fundación/Contexto |
| Planificación Operativa | Objetivos de procesos | Fundación/Organización |
| Contabilidad | Depreciación, centros de costo | Administración, Fundación/UNeg |
| Tesorería | Nómina calculada, órdenes de compra | Talento, Supply Chain |
| Inteligencia | Datos de TODOS los módulos | Todos (solo lectura) |
| Off Boarding | Activos y EPP asignados | Administración, Mi Equipo |

---

## 7. Ciclo PHVA

```
PLANEAR (P):
  Fundación → Gestión Documental → Workflows → Mi Equipo
  → Planificación Operativa → Planeación Estratégica

HACER (H):
  Protección → HSEQ → Cadena de Valor → Talento → Soporte

VERIFICAR (V):
  Inteligencia → Revisión por la Dirección

ACTUAR (A):
  Acciones de Mejora
    → genera Plan de Acción → vuelve a PLANEAR
    → genera Proyecto → vuelve a PLANEAR
    → genera Cambio de proceso → vuelve a FUNDACIÓN
```

---

## 8. SIDEBAR_LAYERS y Orden

### Configuración Backend (viewsets_config.py)

El orden en `SIDEBAR_LAYERS` debe reflejar exactamente la cascada. El frontend renderiza en el orden que recibe del backend.

```python
SIDEBAR_LAYERS = [
    # ═══ PLANEAR ═══
    {
        'code': 'NIVEL_FUNDACION',
        'name': 'Fundación',
        'icon': 'Landmark',
        'color': '#3B82F6',
        'module_codes': ['fundacion'],
    },
    {
        'code': 'NIVEL_DOCUMENTAL',
        'name': 'Gestión Documental',
        'icon': 'FileText',
        'color': '#6366F1',
        'module_codes': ['gestion_documental'],
    },
    {
        'code': 'NIVEL_WORKFLOWS',
        'name': 'Flujos de Trabajo',
        'icon': 'Workflow',
        'color': '#8B5CF6',
        'module_codes': ['workflow_engine'],
    },
    {
        'code': 'NIVEL_EQUIPO',
        'name': 'Mi Equipo',
        'icon': 'UserPlus',
        'color': '#0EA5E9',
        'module_codes': ['mi_equipo'],
    },
    {
        'code': 'NIVEL_PLANIFICACION',
        'name': 'Planificación',
        'icon': 'Calendar',
        'color': '#0EA5E9',
        'module_codes': ['planificacion_operativa', 'planeacion_estrategica'],
    },
    # ═══ HACER ═══
    {
        'code': 'NIVEL_PROTECCION',
        'name': 'Protección y Cumplimiento',
        'icon': 'ShieldCheck',
        'color': '#F59E0B',
        'module_codes': ['proteccion_cumplimiento'],
    },
    {
        'code': 'NIVEL_HSEQ',
        'name': 'Gestión Integral',
        'icon': 'Shield',
        'color': '#10B981',
        'module_codes': ['gestion_integral'],
    },
    {
        'code': 'NIVEL_CADENA',
        'name': 'Cadena de Valor',
        'icon': 'Package',
        'color': '#10B981',
        'module_codes': ['supply_chain', 'production_ops', 'logistics_fleet', 'sales_crm'],
    },
    {
        'code': 'NIVEL_TALENTO',
        'name': 'Gestión del Talento',
        'icon': 'GraduationCap',
        'color': '#8B5CF6',
        'module_codes': ['talent_hub'],
    },
    {
        'code': 'NIVEL_SOPORTE',
        'name': 'Soporte',
        'icon': 'Building2',
        'color': '#F59E0B',
        'module_codes': ['administracion', 'tesoreria', 'accounting'],
    },
    # ═══ VERIFICAR + ACTUAR ═══
    {
        'code': 'NIVEL_INTELIGENCIA',
        'name': 'Inteligencia',
        'icon': 'BarChart3',
        'color': '#8B5CF6',
        'module_codes': ['analytics', 'revision_direccion', 'acciones_mejora'],
    },
]
```

### Orden en el seed (campo `orden`)

| Nivel | Módulo | Orden | Capa PHVA |
|-------|--------|-------|-----------|
| 1 | `fundacion` | 10 | PLANEAR |
| 2 | `gestion_documental` | 15 | PLANEAR |
| 3 | `workflow_engine` | 18 | PLANEAR |
| 4 | `mi_equipo` | 20 | PLANEAR |
| 5 | `planificacion_operativa` | 25 | PLANEAR |
| 6 | `planeacion_estrategica` | 30 | PLANEAR |
| 7 | `proteccion_cumplimiento` | 35 | HACER |
| 8 | `gestion_integral` | 40 | HACER |
| 9A | `supply_chain` | 50 | HACER |
| 9B | `production_ops` | 51 | HACER |
| 9C | `logistics_fleet` | 52 | HACER |
| 9D | `sales_crm` | 53 | HACER |
| 10 | `talent_hub` | 60 | HACER |
| 11A | `administracion` | 70 | HACER |
| 11B | `tesoreria` | 71 | HACER |
| 11C | `accounting` | 72 | HACER |
| 12 | `analytics` | 80 | VERIFICAR |
| 13 | `revision_direccion` | 85 | VERIFICAR |
| 14 | `acciones_mejora` | 90 | ACTUAR |

### Dashboard

El dashboard agrupa por SIDEBAR_LAYERS y muestra módulos de izquierda a derecha en lanes horizontales, con color por capa. El endpoint `/tree/` incluye `layers` que el frontend usa para agrupar.

---

## 9. Plantillas por Industria

Al crear un tenant, se selecciona la industria y se pre-activan módulos, tabs y secciones relevantes.

### Manufactura

```
✅ Fundación (completo)
✅ Gestión Documental (completo)
✅ Workflows (completo)
✅ Mi Equipo (completo)
✅ Planificación Operativa (completo)
✅ Planeación Estratégica (completo)
✅ Protección y Cumplimiento (completo)
✅ Gestión Integral HSEQ (completo)
✅ Supply Chain (completo)
✅ Production Ops (completo)
✅ Logistics Fleet (completo)
✅ Sales CRM (completo)
✅ Talento (completo)
✅ Administración (completo)
✅ Tesorería (completo)
✅ Contabilidad (completo)
✅ Inteligencia (completo)
✅ Revisión Dirección (completo)
✅ Acciones de Mejora (completo)
→ 19 módulos — plataforma completa
```

### Servicios / Consultoría

```
✅ Fundación (completo)
✅ Gestión Documental (completo)
✅ Workflows (completo)
✅ Mi Equipo (completo)
✅ Planificación Operativa (completo)
✅ Planeación Estratégica (completo)
✅ Protección y Cumplimiento (sin IPEVR pesado, sin ambiental, sin vial, sin LAFT)
❌ Gestión Integral HSEQ (mínimo o desactivado)
❌ Supply Chain (no aplica)
❌ Production Ops (no aplica)
❌ Logistics Fleet (no aplica)
✅ Sales CRM (pipeline + PQRS)
✅ Talento (completo)
✅ Administración (activos + servicios)
✅ Tesorería (completo)
✅ Contabilidad (completo)
✅ Inteligencia (completo)
✅ Revisión Dirección (completo)
✅ Acciones de Mejora (completo)
→ 15 módulos activos
```

### Comercio / Retail

```
✅ Fundación (completo)
✅ Gestión Documental (básico)
✅ Workflows (básico)
✅ Mi Equipo (completo)
✅ Planificación Operativa (básico)
✅ Planeación Estratégica (básico)
✅ Protección y Cumplimiento (básico: legal + riesgos proceso)
❌ Gestión Integral HSEQ (mínimo)
✅ Supply Chain (completo — compras, inventario, proveedores)
❌ Production Ops (no aplica)
❌ Logistics Fleet (opcional)
✅ Sales CRM (completo + futuro POS)
✅ Talento (completo)
✅ Administración (activos)
✅ Tesorería (completo)
✅ Contabilidad (completo)
✅ Inteligencia (completo)
✅ Revisión Dirección (opcional)
✅ Acciones de Mejora (completo)
→ 14 módulos activos
```

### Transporte

```
✅ Fundación (completo)
✅ Gestión Documental (completo)
✅ Workflows (completo)
✅ Mi Equipo (completo)
✅ Planificación Operativa (completo)
✅ Planeación Estratégica (completo)
✅ Protección y Cumplimiento (completo — énfasis en viales y PESV)
✅ Gestión Integral HSEQ (completo — accidentalidad fuerte)
✅ Supply Chain (combustible, repuestos, neumáticos)
❌ Production Ops (no aplica)
✅ Logistics Fleet (completo — módulo principal)
✅ Sales CRM (gestión de clientes de carga)
✅ Talento (completo)
✅ Administración (vehículos como activos principales)
✅ Tesorería (completo)
✅ Contabilidad (completo)
✅ Inteligencia (completo)
✅ Revisión Dirección (completo)
✅ Acciones de Mejora (completo)
→ 18 módulos activos
```

### Construcción

```
✅ Fundación (completo)
✅ Gestión Documental (completo)
✅ Workflows (completo)
✅ Mi Equipo (completo — alta rotación, contratistas)
✅ Planificación Operativa (completo)
✅ Planeación Estratégica (fuerte en proyectos PMI)
✅ Protección y Cumplimiento (completo — IPEVR intensivo, trabajo en alturas)
✅ Gestión Integral HSEQ (completo — máxima prioridad)
✅ Supply Chain (materiales de construcción)
✅ Production Ops (proyectos como "producción")
✅ Logistics Fleet (maquinaria pesada, transporte de materiales)
✅ Sales CRM (licitaciones, contratos)
✅ Talento (completo — formación SST intensiva)
✅ Administración (maquinaria pesada como activos)
✅ Tesorería (completo)
✅ Contabilidad (completo)
✅ Inteligencia (completo)
✅ Revisión Dirección (completo)
✅ Acciones de Mejora (completo)
→ 19 módulos — plataforma completa con énfasis HSEQ
```

### Tecnología / Software

```
✅ Fundación (completo)
✅ Gestión Documental (completo — ISO 27001)
✅ Workflows (completo — CI/CD, cambios)
✅ Mi Equipo (completo)
✅ Planificación Operativa (ágil)
✅ Planeación Estratégica (OKRs más que BSC)
✅ Protección y Cumplimiento (seguridad de la información fuerte, habeas data)
❌ Gestión Integral HSEQ (mínimo — solo ergonomía oficina)
❌ Supply Chain (no aplica)
❌ Production Ops (no aplica)
❌ Logistics Fleet (no aplica)
✅ Sales CRM (pipeline SaaS, soporte)
✅ Talento (completo — formación técnica intensiva)
✅ Administración (equipos de cómputo como activos)
✅ Tesorería (completo)
✅ Contabilidad (completo)
✅ Inteligencia (completo)
✅ Revisión Dirección (completo)
✅ Acciones de Mejora (completo)
→ 14 módulos activos
```

### Personalizado

```
El consultor activa módulo por módulo según la necesidad del tenant.
Cada módulo tiene tabs activables/desactivables.
Cada tab tiene secciones activables/desactivables.
Granularidad total.
```

---

## 10. Activación Granular

### 3 Niveles de activación

```python
# Nivel 1: Módulo completo
SystemModule.is_enabled = True/False

# Nivel 2: Tab individual
ModuleTab.is_enabled = True/False

# Nivel 3: Sección individual
TabSection.is_enabled = True/False
```

### Control desde Admin Global

```python
# Tenant.enabled_modules controla qué módulos ve cada empresa
# Si es None/vacío → todos los módulos habilitados
# Si tiene lista → solo esos módulos
Tenant.enabled_modules = ['fundacion', 'gestion_documental', 'mi_equipo', 'sales_crm']
```

### Ejemplo: Tienda de ropa

```
Tenant: "Modas María SAS"
Industria: Comercio/Retail

enabled_modules: [
    'fundacion',
    'gestion_documental',
    'mi_equipo',
    'supply_chain',
    'sales_crm',
    'talent_hub',
    'administracion',
    'tesoreria',
    'accounting',
    'acciones_mejora',
]

Dentro de Supply Chain, desactiva:
  ❌ Programación (no necesita)
  ❌ Evaluaciones (pocos proveedores)

Dentro de Protección, desactiva:
  ❌ IPEVR (bajo riesgo)
  ❌ Aspectos Ambientales (no aplica)
  ❌ Riesgos Viales (no aplica)
  ❌ SAGRILAFT (no aplica)
```

---

## 11. Portales

Los portales NO son módulos — son **vistas filtradas** del sistema según el tipo de usuario.

| Portal | Usuario | Qué ve |
|--------|---------|--------|
| **Mi Portal** | Cualquier colaborador | Sus documentos, tareas, notificaciones, datos personales, certificados |
| **Mi Equipo** | Jefes (cargo.is_jefatura) | Equipo a cargo, aprobaciones, seguimiento |
| **Portal Proveedores** | Usuarios tipo PROVEEDOR_PORTAL | Sus órdenes, evaluaciones, documentos requeridos |
| **Portal Clientes** | Usuarios tipo CLIENTE_PORTAL | Sus pedidos, PQRS, facturas |
| **Admin Global** | Superadmin | Gestión de tenants, planes, configuración global |

---

## 12. Reglas de Independencia

### Backend

| Regla | Descripción |
|-------|-------------|
| **C2 nunca importa de otro C2** | `apps.get_model()` + `PositiveBigIntegerField` para FK cross-module |
| **Inteligencia solo lee** | Endpoints de solo lectura, nunca escribe en tablas de otros módulos |
| **Acciones de Mejora genera, no importa** | Crea registros en Planificación/Proyectos vía IDs, no FK directos |
| **Todos heredan de TenantModel** | Aislamiento por schema PostgreSQL |
| **Cargo como centro** | Documentos, EPP, turnos, permisos → asignados al cargo, no a la persona |
| **PI como fuente de verdad** | Proveedores, clientes, colaboradores, entidades → se crean en Fundación/PI |
| **Activos como fuente de verdad** | Todos los activos → catálogo maestro en Administración |

### Frontend

| Regla | Descripción |
|-------|-------------|
| **Orden viene del backend** | `SIDEBAR_LAYERS` define el orden, frontend renderiza tal cual |
| **useSelect* hooks** | Consume datos maestros sin importar el módulo de origen |
| **Módulos desactivados = invisibles** | No se renderizan en sidebar ni dashboard |
| **RBAC por cargo** | `canDo(Module, Section, action)` filtra acciones disponibles |

---

## 13. Migración desde V1

### Módulos que cambian de nombre

| V1 (actual) | V2 (nuevo) | Cambio |
|-------------|-----------|--------|
| `motor_cumplimiento` + `motor_riesgos` | `proteccion_cumplimiento` | Fusión en uno |
| `hseq_management` | `gestion_integral` | Renombrado |
| `admin_finance` | `administracion` + `tesoreria` | División en dos |
| `talent_hub` (12 tabs) | `mi_equipo` (4 tabs) + `talent_hub` (6 tabs) | División en dos |
| `audit_system` | Infraestructura + Centro de Control | Sale de sidebar |

### Módulos nuevos

| Módulo | Código | Origen |
|--------|--------|--------|
| Gestión Documental | `gestion_documental` | Sale de `sistema_gestion` |
| Mi Equipo | `mi_equipo` | Sale de `talent_hub` |
| Planificación Operativa | `planificacion_operativa` | Sale de `sistema_gestion` |
| Protección y Cumplimiento | `proteccion_cumplimiento` | Fusión de `motor_cumplimiento` + `motor_riesgos` |
| Acciones de Mejora | `acciones_mejora` | Sale de `sistema_gestion` |
| Administración | `administracion` | Sale de `admin_finance` |
| Tesorería | `tesoreria` | Sale de `admin_finance` |
| Configuración | `configuracion_plataforma` | Sale de `fundacion` Tab 3 |

### Secciones que se mueven

| Sección | De (V1) | A (V2) | Razón |
|---------|---------|--------|-------|
| Partes Interesadas | Fundación/Organización | Fundación/Contexto e Identidad | Es input para entender el entorno |
| Análisis de Contexto | Planeación Estratégica | Fundación/Contexto e Identidad | El empresario lo entiende al fundar |
| Misión/Visión | Fundación/Mi Empresa | Fundación/Contexto e Identidad | Nace del contexto |
| Unidades de Negocio | Supply Chain | Fundación/Mi Empresa | Es estructura constitutiva |
| Módulos del Sistema | Fundación/Mi SIG | Configuración | Es admin de plataforma |
| Consecutivos | Fundación/Mi SIG | Configuración | Es admin de plataforma |
| Integraciones | Fundación/Mi SIG | Configuración | Es admin de plataforma |
| Config. Indicadores | Analytics | Configuración | Es configuración técnica |
| Exportación | Analytics | Configuración | Es herramienta técnica |
| Consultores Externos | Talent Hub | Fundación/PI + Administración | Son proveedores de servicios |
| Turnos (config) | Talent Hub | Fundación/Cargos | Es estructura del cargo |
| Confirmación de pagos | Nómina | Tesorería | Es financiero |

---

## Notas Finales

### Esto NO es solo reorganizar un menú

Es una **metodología de implementación** embebida en software. La cascada guía al empresario colombiano paso a paso, desde constituir su empresa hasta cerrar el ciclo PHVA, cumpliendo la ley desde el día 1.

### El diferenciador de StrateKaz

> "El software que te guía paso a paso para constituir, operar y mejorar tu empresa, cumpliendo la ley colombiana desde el día 1."

Ningún competidor en el mercado colombiano ofrece esto.

### Plan de Sprints — Migración V1 → V2

La migración se ejecuta en 6 sprints incrementales. Cada sprint es desplegable de forma independiente sin romper funcionalidad existente.

#### Sprint CASCADA-S1: Seeds + SIDEBAR_LAYERS (Backend only)
**Objetivo:** El backend refleja la nueva estructura. El sidebar muestra el nuevo orden.
**Riesgo:** Bajo — solo cambia metadata, no modelos ni datos.

- [ ] Actualizar `SIDEBAR_LAYERS` en `viewsets_config.py` ✅ (hecho)
- [ ] Reescribir `seed_estructura_final.py` con los 19 módulos V2
- [ ] Ajustar campo `orden` de cada SystemModule
- [ ] Renombrar módulos: `hseq_management` → `gestion_integral`, etc.
- [ ] Mover secciones entre tabs (contexto → fundación, PI → contexto, etc.)
- [ ] Crear nuevos módulos en seed: `mi_equipo`, `gestion_documental`, `planificacion_operativa`, `proteccion_cumplimiento`, `acciones_mejora`, `administracion`, `tesoreria`
- [ ] Ejecutar `deploy_seeds_all_tenants` en todos los schemas
- [ ] Verificar sidebar con superuser y usuario normal
- [ ] Actualizar `Modules` y `Sections` enums en `frontend/src/constants/permissions.ts`

#### Sprint CASCADA-S2: Fundación reorganizada (4 tabs)
**Objetivo:** Fundación tiene los 4 tabs nuevos con secciones reubicadas.

- [ ] Tab 1 "Mi Empresa": agregar sección `unidades_negocio` (mover de Supply Chain)
- [ ] Tab 2 "Mi Contexto e Identidad": mover `partes_interesadas` desde Tab 3, mover `analisis_contexto` desde Planeación Estratégica, reordenar misión/visión después de contexto
- [ ] Tab 3 "Mi Organización": mantener procesos, cargos, organigrama, caracterizaciones, mapa. Agregar config de turnos y EPP requerido en cargos
- [ ] Tab 4 "Mis Políticas y Reglamentos": nueva UI para políticas obligatorias colombianas + reglamento interno + contratos tipo
- [ ] Frontend: reorganizar pages/components en `features/fundacion/`
- [ ] Eliminar Tab 3 actual "Mi Sistema de Gestión" (módulos/consecutivos/integraciones → Configuración)

#### Sprint CASCADA-S3: Gestión Documental + Mi Equipo (módulos nuevos)
**Objetivo:** Dos módulos nuevos funcionando como independientes.

- [ ] **Gestión Documental**: Extraer de `sistema_gestion/gestion_documental` → módulo propio. Agregar flujo de estados (Borrador→Vigente). Agregar asignación a cargos. Nueva feature `features/gestion-documental/`
- [ ] **Mi Equipo**: Extraer de `talent_hub` tabs 0-3 (perfiles, selección, colaboradores, onboarding). Agregar entrega de activos/EPP en onboarding. Nueva feature `features/mi-equipo/`
- [ ] Backend: crear apps si necesario o reusar apps existentes con nuevo module_code en seed
- [ ] Frontend: mover/crear pages y hooks
- [ ] RBAC: crear section codes nuevos, actualizar CargoSectionAccess

#### Sprint CASCADA-S4: Protección + Planificación Operativa + Acciones de Mejora
**Objetivo:** Módulos fusionados/nuevos funcionando.

- [ ] **Protección y Cumplimiento**: Fusionar `motor_cumplimiento` + `motor_riesgos` → módulo unificado con 7 tabs
- [ ] **Planificación Operativa**: Extraer `plan_trabajo` y `programas` de `sistema_gestion` → módulo propio
- [ ] **Acciones de Mejora**: Extraer `acciones_mejora` de `sistema_gestion` → módulo propio. Agregar generación de planes de acción/proyectos
- [ ] Frontend: crear features para los 3 módulos nuevos
- [ ] Eliminar módulos vacíos (`motor_cumplimiento`, `motor_riesgos`, `sistema_gestion` si quedó vacío)

#### Sprint CASCADA-S5: Soporte reorganizado + Cadena de Valor limpia
**Objetivo:** Admin Finance se divide, Supply Chain se limpia.

- [ ] **Administración**: Extraer activos + servicios generales + presupuesto de `admin_finance`. Catálogo maestro de activos (todos los tipos). Hoja de vida por activo
- [ ] **Tesorería**: Extraer tesorería de `admin_finance`. Agregar confirmación de pagos (nómina, proveedores, honorarios)
- [ ] **Supply Chain**: Eliminar tab `unidades_negocio` (ya en Fundación). Proveedores consume de PI
- [ ] **Talent Hub**: Reducir a 6 tabs (gestión continua). Novedades + Nómina fusionados. Off boarding con paz y salvo + devolución activos
- [ ] Eliminar `admin_finance` (reemplazado por `administracion` + `tesoreria`)

#### Sprint CASCADA-S6: Dashboard + Wizard + Plantillas Industria
**Objetivo:** UX completa de la cascada.

- [ ] Dashboard horizontal por capas PHVA (ya parcialmente hecho)
- [ ] Wizard de autoservicio para Fundación (12 pasos guiados)
- [ ] Progreso por tab ("Mi Empresa 100% ✓")
- [ ] Plantillas por industria en creación de tenant
- [ ] Módulo Configuración (admin): módulos, consecutivos, integraciones, config indicadores
- [ ] Infraestructura: notificaciones/tareas como transversales (no en sidebar)

### Notas de migración

- **No hay migraciones de DB en S1**: solo cambia metadata en SystemModule/ModuleTab/TabSection
- **S2-S5 pueden requerir migraciones** si se crean nuevas apps Django
- **Cada sprint se despliega independiente** — el sistema funciona con la estructura parcialmente migrada
- **RBAC**: cada sprint actualiza `permissions.ts` + seeds de CargoSectionAccess
- **Orden recomendado**: S1 → S2 → S3 → S4 → S5 → S6 (pero S4 y S5 podrían paralelizarse)
