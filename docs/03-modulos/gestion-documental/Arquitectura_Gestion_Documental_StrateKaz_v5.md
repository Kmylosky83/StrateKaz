# ARQUITECTURA DEL MÓDULO — GESTIÓN DOCUMENTAL

**StrateKaz SGI — Plataforma de Gestión Empresarial 360**
Versión 5.0 — Abril 2026
Elaborado por: Camilo Rubiano Bustos — StrateKaz Consultoría 4.0

> **Convención:** `[LIVE]` = existe en código y funciona hoy. `[SPRINT N]` = propuesta, se implementa en ese sprint.

---

## Tabla de Contenido

1. [Visión General](#1-visión-general)
2. [Posición en la Arquitectura de Capas](#2-posición-en-la-arquitectura-de-capas)
3. [Estado Actual de Producción](#3-estado-actual-de-producción)
4. [Estructura de Tabs del Módulo](#4-estructura-de-tabs-del-módulo)
5. [Ciclo de Vida del Documento](#5-ciclo-de-vida-del-documento)
6. [Dos Roles del Módulo](#6-dos-roles-del-módulo)
7. [Sistema de Codificación TIPO-PROCESO-NNN](#7-sistema-de-codificación-tipo-proceso-nnn)
8. [Modelo de Visibilidad y Acceso](#8-modelo-de-visibilidad-y-acceso)
9. [Tabla de Retención Documental (TRD)](#9-tabla-de-retención-documental-trd)
10. [Integración BPM → Gestor Documental](#10-integración-bpm--gestor-documental)
11. [Formularios con Firma Secuencial](#11-formularios-con-firma-secuencial)
12. [Patrón de Actas: Módulos C2 Consumiendo GD](#12-patrón-de-actas-módulos-c2-consumiendo-gd)
13. [Generación de PDF — Layout Estandarizado](#13-generación-de-pdf--layout-estandarizado)
14. [Design System y Estándares de UI](#14-design-system-y-estándares-de-ui)
15. [UX/UI — Principios Anti-Fatiga](#15-uxui--principios-anti-fatiga)
16. [Modelos Nuevos y Modificaciones](#16-modelos-nuevos-y-modificaciones)
17. [Roadmap Detallado](#17-roadmap-detallado)
18. [Deuda Técnica Catalogada](#18-deuda-técnica-catalogada)
19. [Instrucciones para Claude Code](#19-instrucciones-para-claude-code)

---

## 1. Visión General

### 1.1 Propósito

El módulo de Gestión Documental es la **capa transversal (CT)** de StrateKaz SGI que resuelve el ciclo de vida completo de la documentación en un Sistema de Gestión Integrado (ISO 9001/14001/45001). Opera en dos roles fundamentales:

- **Creador/Controlador** `[LIVE]`: Para documentos normativos (políticas, procedimientos, instructivos, manuales, guías). Ciclo completo de elaboración, revisión, aprobación con firma digital, distribución controlada y archivo.
- **Notario/Archivo** `[SPRINT 3]`: Para registros operativos generados por otros módulos (HSEQ, Talento Humano, PESV). Recibe PDFs o registros transformados como evidencia archivada para trazabilidad y auditoría.

### 1.2 Inventario del Módulo `[LIVE]`

| Recurso | Cantidad |
|---------|----------|
| Modelos Django | 7 (158 campos) |
| Endpoints API | 45+ |
| Componentes React | 25 (~7,200 líneas) |
| Migraciones | 13 |
| Servicios backend | 5 (documento, OCR, scoring, drive, pdf_sealing) |
| Exporters | 2 (PDF WeasyPrint, DOCX python-docx) |

---

## 2. Posición en la Arquitectura de Capas `[LIVE]`

| Capa | Apps | Regla |
|------|------|-------|
| **C0** | core, tenant, audit_system | Infraestructura base. Nunca se toca en sprints de módulo. |
| **C1** | configuracion, organizacion, identidad, contexto | Fundación. Se configura 1 vez. |
| **CT (Transversal)** | **workflow_engine, gestion_documental** | Servicios consumidos por todo C2. Importan solo de C1. |
| **C2** | HSEQ, Talento Humano, Supply Chain, etc. | Módulos de negocio. Importan de C1 y CT, nunca entre sí. |
| **C3** | analytics, revision_direccion | Inteligencia. Solo lee de C2 y CT. |

**App:** `backend/apps/gestion_estrategica/gestion_documental/`

**Regla de no circularidad:** C2 importa de CT, CT importa de C1. Nunca al revés. GD no sabe nada de COPASST, inspecciones ni accidentes — solo provee infraestructura documental.

---

## 3. Estado Actual de Producción `[LIVE]`

### 3.1 Base de Datos

| Dato | Valor |
|------|-------|
| Tenants activos | 2 (tenant_demo, tenant_grasas_y_huesos) |
| Documentos en tenant_demo | ~5 (fase de QA) |
| Formatos de código coexistentes | `POL-2026-0001` (fallback artesanal) y `PR-001` (ConsecutivoConfig) |
| TipoDocumento seed | 12 tipos con campo `categoria` (DOCUMENTO/FORMULARIO) |
| Procesos (Area) en BD | 17 base + 5-8 por industria del tenant |
| ConsecutivoConfig para docs | Solo 3 de 12 tipos: PR, IN, FT |

### 3.2 Motor de Códigos — Problema Actual

Tres fallbacks conviven, generando **dos formatos distintos:**

| Tipos | Motor | Formato | Thread-safe |
|-------|-------|---------|-------------|
| PR, IN, FT (3 tipos) | ConsecutivoConfig con `select_for_update()` | `PR-001` (sin año) | Sí |
| POL, MA, PL, RE, GU, PG, AC, RG, KB (9 tipos) | Fallback artesanal | `POL-2026-0001` (con año) | **No** |

**Resuelto en Sprint 2** con motor unificado TIPO-PROCESO-NNN.

### 3.3 Brechas Conocidas

| # | Brecha | Severidad | Sprint |
|---|--------|-----------|--------|
| 1 | ~~Acceso a docs CONFIDENCIAL/RESTRINGIDO sin enforcement~~ | ~~Seguridad~~ | **RESUELTO** (2b8261cc) |
| 2 | ~~AceptacionDocumental no se invalida al publicar nueva versión~~ | ~~Funcional~~ | **RESUELTO** (2b8261cc) |
| 3 | ~~Sin notificaciones de vencimiento de documentos~~ | ~~Funcional~~ | **YA EXISTÍA** (tasks.py) |
| 4 | ~~2 formatos de código incompatibles~~ | ~~Certificación~~ | **RESUELTO** (c1a2bc90) |
| 5 | ~~`puestos_aplicacion` campo muerto~~ | ~~Deuda~~ | **DEPRECADO** (c1a2bc90) |
| 6 | Form Builder no genera PDF (datos_formulario → PDF vacío) | Funcional | Sprint 3.5 |
| 7 | Generador PDF monolítico (598 líneas inline) | Mantenibilidad | Sprint 3.5 |
| 8 | Form Builder sin condiciones de visibilidad ni fórmulas | UX | Sprint 4 |

---

## 4. Estructura de Tabs del Módulo `[LIVE]`

La interfaz sigue la anatomía canónica de página:

```
PageHeader title="Gestión Documental" description={activeSectionData.description}
DynamicSections variant="underline" moduleColor={useModuleColor('gestion_documental')}
  Dashboard | Repositorio | En Proceso | Archivo | Configuración
Contenido de la sección activa (switch en GestionDocumentalTab.tsx)
Modales globales (definidos en la PÁGINA, no en la sección)
```

| Tab | Componente | Descripción | Datos |
|-----|-----------|-------------|-------|
| **Dashboard** `[LIVE]` | DashboardDocumentalSection | Métricas: total por estado, cobertura, score, próximos a vencer, registros por módulo origen. Listado maestro exportable. | Agregaciones globales |
| **Repositorio** `[LIVE]` | DocumentosSection | Todos los documentos del tenant (filtrable por estado, tipo, proceso). Toggle cards/list. Panel de cobertura. Búsqueda. | Todos los estados |
| **En Proceso** `[LIVE]` | EnProcesoSection | Sub-tabs: (a) Firmas Pendientes con `es_mi_turno`, (b) Borradores míos, (c) En Revisión. | BORRADOR, EN_REVISION, APROBADO |
| **Archivo** `[LIVE]` | ArchivoSection | Sub-tabs: (a) Historial de Versiones, (b) Distribución y acuses, (c) Obsoletos, (d) Registros Archivados `[SPRINT 3]`. | OBSOLETO, ARCHIVADO + registros |
| **Configuración** `[LIVE]` | TiposPlantillasSection | 12 tipos documentales. Plantillas por tipo. Firmantes por defecto. TRD `[SPRINT 2]`. | Solo rol Admin SGI |

**Retrocompatibilidad:** `normalizeSection()` en `GestionDocumentalTab.tsx` mapea códigos legacy (documentos→repositorio, control_cambios→en_proceso, etc.) para no romper notificaciones existentes.

### 4.1 Integración con Mi Portal `[LIVE]`

- **Mi Portal muestra:** Lecturas pendientes (AceptacionDocumental), firmas pendientes (FirmaDigital con `es_mi_turno=true`). Cada ítem enlaza al documento.
- **Gestor Documental muestra:** Vista completa con filtros, configuración y archivo. Es la vista del administrador/líder de proceso.
- **Endpoints compartidos:** `/api/gestion-documental/aceptaciones/mis-pendientes/` y `/api/workflow-engine/firma-digital/mis-firmas-pendientes/` son consumidos por ambos.

---

## 5. Ciclo de Vida del Documento

### 5.1 Estados y Transiciones `[LIVE]`

| Estado | Acción Entrada | Acción Salida | Quién Decide | Tab Visible |
|--------|---------------|--------------|-------------|------------|
| BORRADOR | Crear / Devolver | enviar-revision | Elaborador | En Proceso |
| EN_REVISION | enviar-revision | aprobar / devolver | Revisor(es) | En Proceso |
| APROBADO | Todas las firmas OK | publicar | Sistema automático | En Proceso |
| PUBLICADO | publicar | marcar-obsoleto | Aprobador / Admin | Repositorio |
| OBSOLETO | marcar-obsoleto / nueva versión | archivar | Sistema / Admin | Archivo |
| ARCHIVADO | Cumple TRD | eliminar (con acta) | Admin SGI | Archivo |

### 5.2 Flujo de Firmas `[LIVE]`

1. El tipo documental define si requiere firma (`requiere_firma=true`) y el nivel de seguridad (1: manuscrita, 2: +TOTP, 3: +TOTP+OTP email).
2. Al enviar a revisión, se crean instancias `FirmaDigital` según plantilla: ELABORÓ (orden 1), REVISÓ (orden 2), APROBÓ (orden 3).
3. El flujo puede ser SECUENCIAL, PARALELO o MIXTO (ConfiguracionFlujoFirma).
4. Cada firma genera hash `SHA-256(trazo + otp + doc_id + version + timestamp_utc + cédula)` en HistorialFirma.
5. Si un firmante rechaza: `FirmaDigital.estado=RECHAZADA`, Documento regresa a BORRADOR, se notifica al elaborador, todas las firmas se resetean a PENDIENTE.
6. Cuando todas las firmas están FIRMADA, el documento transiciona automáticamente a APROBADO.

### 5.3 Distribución y Lectura Verificada `[LIVE]`

Al publicar (APROBADO → PUBLICADO):

- Se crean `AceptacionDocumental` según: `aplica_a_todos`, `cargos_distribucion` (M2M Cargo), `usuarios_autorizados` (M2M User).
- Si `lectura_obligatoria=True`, se distribuye a TODOS los usuarios activos. Signal `post_save` de User auto-asigna a nuevos usuarios que se unan al tenant.
- DocumentoReaderModal trackea: `porcentaje_lectura`, `scroll_data`, `tiempo_lectura_seg`, `ip_address`.
- El usuario confirma lectura explícitamente (botón Aceptar) después de % mínimo de scroll.

### 5.4 Invalidación por Nueva Versión `[SPRINT 1]`

Cuando se publica una nueva versión de un documento, las `AceptacionDocumental` de la versión anterior se invalidan automáticamente y se generan nuevas. Campos nuevos: `version_documento` (FK VersionDocumento), `invalidada` (BooleanField). El endpoint `mis-pendientes` filtra `.filter(invalidada=False)`.

---

## 6. Dos Roles del Módulo

### 6.1 Rol Creador — Documentos Normativos `[LIVE]`

| Código | Tipo | Nivel | Categoría | Firma | Retención |
|--------|------|-------|-----------|-------|-----------|
| POL | Política | Estratégico | DOCUMENTO | Sí | 10 años |
| MA | Manual | Estratégico | DOCUMENTO | Sí | 10 años |
| PL | Plan | Estratégico | DOCUMENTO | Sí | 5 años |
| RE | Reglamento | Estratégico | DOCUMENTO | Sí | 10 años |
| PR | Procedimiento | Táctico | DOCUMENTO | Sí | 7 años |
| GU | Guía | Táctico | DOCUMENTO | No | 5 años |
| PG | Programa | Táctico | DOCUMENTO | Sí | 5 años |
| IN | Instructivo | Operativo | DOCUMENTO | No | 5 años |
| FT | Formato | Operativo | FORMULARIO | No | 3 años |
| AC | Acta | Soporte | FORMULARIO | Sí | 5 años |
| RG | Registro | Soporte | FORMULARIO | No | 3 años |
| KB | Base de Conocimiento | Soporte | FORMULARIO | No | 3 años |

### 6.2 Rol Notario/Archivo — Registros Operativos `[SPRINT 3]`

Los módulos C2 generan datos en su propio flujo. Al completarse, depositan un PDF/registro en GD como evidencia archivada.

**Patrón de ingesta interna (sin circularidad):**

1. C2 completa su proceso (ej: investigación de accidente en HSEQ).
2. C2 llama a `DocumentoService.archivar_registro()` pasando: PDF, tipo='RG', proceso=Area, modulo_origen='hseq', referencia_origen (GenericForeignKey).
3. GD crea Documento con `estado=ARCHIVADO`, `es_auto_generado=True`, sin ciclo de firmas.
4. El registro queda en Archivo > Registros Archivados, filtrable por módulo origen.

**Campos para trazabilidad inversa:** `modulo_origen` (CharField), `referencia_origen_type` (FK ContentType), `referencia_origen_id` (PositiveIntegerField) — implementa GenericForeignKey.

---

## 7. Sistema de Codificación TIPO-PROCESO-NNN

### 7.1 Convención `[SPRINT 2]`

Estándar ISO colombiano: `{TipoDocumento.codigo}-{Area.code}-{NNN}`

| Segmento | Fuente | Ejemplo | Descripción |
|----------|--------|---------|-------------|
| TIPO | TipoDocumento.codigo | PR, POL, IN, FT | Código del tipo documental |
| PROCESO | Area.code | SST, GCA, OPE, DIR | Código del proceso SGI (dinámico por tenant) |
| NNN | ConsecutivoConfig | 001, 002, 003 | Consecutivo por tipo+proceso con `select_for_update()` |

Ejemplos: `PR-SST-001`, `POL-DIR-001`, `IN-OPE-003`, `FT-GAM-012`

### 7.2 Decisiones de Diseño

**Documentos transversales:** Los documentos que aplican a todos los procesos (Política Integral, Manual SGI) usan `proceso=DIR` (Direccionamiento Estratégico) para codificación. La visibilidad multi-proceso se maneja con `areas_aplicacion` (ver sección 8).

**Migración dura:** Los documentos existentes con formato `POL-2026-0001` se recodifican al formato nuevo en una sola migración. El constraint `unique_together = ['empresa_id', 'codigo']` se respeta.

### 7.3 Implementación Técnica

1. Agregar campo `proceso` (FK a `organizacion.Area`) en Documento para codificación.
2. Crear `ConsecutivoConfig` por combinación tipo+proceso con `select_for_update()`.
3. Eliminar los 3 fallbacks actuales y unificar en un único motor thread-safe.
4. Script de migración: inferir proceso de `areas_aplicacion` JSON y asignar FK.
5. `areas_aplicacion` (JSONField) se **MANTIENE** para visibilidad multi-proceso (ver sección 8.2). No se elimina. Pero deja de usarse para codificación.
6. `puestos_aplicacion` se **DEPRECA** — campo muerto sin uso en frontend ni backend.

---

## 8. Modelo de Visibilidad y Acceso

### 8.1 Campos Reales del Modelo Documento

| Campo | Tipo Django | Estado | Propósito |
|-------|------------|--------|-----------|
| `clasificacion` | CharField(choices) | `[LIVE]` | `PUBLICO \| INTERNO \| CONFIDENCIAL \| RESTRINGIDO` (default: INTERNO) |
| `usuarios_autorizados` | ManyToManyField(User) | `[LIVE]` | Usuarios con acceso a docs CONFIDENCIALES/RESTRINGIDOS |
| `aplica_a_todos` | BooleanField(default=False) | `[LIVE]` | Al publicar → distribuir a TODOS los usuarios del tenant |
| `cargos_distribucion` | ManyToManyField(Cargo) | `[LIVE]` | Al publicar → distribuir a usuarios con estos cargos |
| `areas_aplicacion` | JSONField(default=list) | `[LIVE]` | Array de `Area.code` — procesos donde el documento es visible |
| `lectura_obligatoria` | BooleanField(default=False) | `[LIVE]` | Auto-asignar a cada nuevo usuario (signal post_save de User) |
| `responsable_cargo` | FK(Cargo, nullable) | `[LIVE]` | Cargo responsable (solo informativo, sin lógica de permisos) |
| `proceso` | FK(Area) | `[SPRINT 2]` | Proceso principal para codificación TIPO-PROCESO-NNN |

### 8.2 Separación Codificación vs Visibilidad

| Aspecto | Campo | Tipo | Ejemplo |
|---------|-------|------|---------|
| **Codificación** (único) | `proceso` `[SPRINT 2]` | FK a Area | `POL-DIR-001` — el proceso que genera el código |
| **Visibilidad** (múltiple) | `areas_aplicacion` `[LIVE]` | JSONField de Area.code | `["SST","GCA","GAM","GTH"]` — qué procesos pueden consultar |
| **Distribución** (quién lee) | `cargos_distribucion` + `aplica_a_todos` `[LIVE]` | M2M + Boolean | Cargos que reciben lectura al publicar |
| **Seguridad** (quién accede) | `clasificacion` + `usuarios_autorizados` `[LIVE campo, SPRINT 1 enforcement]` | CharField + M2M | Si es CONFIDENCIAL, solo estos usuarios |

**Nota sobre `areas_aplicacion`:** Actualmente guarda strings de texto plano. En Sprint 2 se migra a guardar `Area.code` (strings estandarizados) para que sea filtrable. El FormModal ya trata este campo como single-select.

### 8.3 Niveles en TipoDocumento `[LIVE]`

| Campo | Choices | Uso |
|-------|---------|-----|
| `nivel_documento` | ESTRATEGICO, TACTICO, OPERATIVO, SOPORTE | Jerarquía documental. Se hereda: `documento.tipo_documento.nivel_documento` |
| `categoria` | DOCUMENTO, FORMULARIO | DOCUMENTO = flujo firma normativo. FORMULARIO = form builder operacional |
| `nivel_seguridad_firma` | 1 (manuscrita), 2 (+TOTP), 3 (+TOTP+OTP) | Nivel de seguridad de firma digital |

### 8.4 BRECHA DE SEGURIDAD — Sin Permission Check `[SPRINT 1]`

**Estado actual:** No hay middleware ni mixin que verifique clasificación. Cualquier usuario autenticado del tenant puede ver CUALQUIER documento, incluyendo RESTRINGIDO. Los endpoints `GET /documentos/{id}/`, `GET /export/{id}/pdf/`, `POST /subir-anexo/` NO validan.

**Excepción:** `services_drive.py` sí excluye CONFIDENCIAL/RESTRINGIDO de Drive y verifica `usuarios_autorizados`.

### 8.5 Lógica de Acceso — DocumentoAccessMixin `[SPRINT 1]`

```
SI documento.clasificacion IN ['CONFIDENCIAL', 'RESTRINGIDO']:
    acceso = (request.user IN documento.usuarios_autorizados.all())
             OR (request.user.cargo IN documento.cargos_distribucion.all())
             OR (request.user == documento.elaborado_por)
             OR (request.user == documento.revisado_por)
             OR (request.user == documento.aprobado_por)
    SI NO acceso → Response(status=403)
SINO:
    acceso = True   // PUBLICO e INTERNO son visibles para todo el tenant
```

Aplicar en: `export_documento_pdf`, `export_documento_docx`, `verificar-sellado`, `subir-anexo`, y el retrieve del `DocumentoViewSet`.

---

## 9. Tabla de Retención Documental (TRD) `[SPRINT 2]`

### 9.1 Estado Actual `[LIVE]`

Solo existe `tiempo_retencion_años` (IntegerField) en TipoDocumento. Y en ControlDocumental: `fecha_retiro`, `motivo_retiro`, `fecha_destruccion`, `metodo_destruccion`, `responsable_destruccion`, `acta_destruccion`.

### 9.2 Modelo Propuesto: TablaRetencionDocumental

| Campo | Tipo | Descripción |
|-------|------|-------------|
| tipo_documento | FK → TipoDocumento | Tipo documental |
| proceso | FK → Area | Proceso SGI |
| serie_documental | CharField | Serie según normativa AGN (ej: 'Actas de COPASST') |
| tiempo_gestion_anos | IntegerField | Años en archivo de gestión (acceso frecuente) |
| tiempo_central_anos | IntegerField | Años en archivo central (consulta esporádica) |
| disposicion_final | CharField choices | ELIMINAR, CONSERVAR_PERMANENTE, SELECCIONAR, DIGITALIZAR |
| soporte_legal | TextField | Normativa que justifica (ej: Dto 1072/2015) |
| requiere_acta_destruccion | BooleanField | Si eliminación requiere acta formal |
| activo | BooleanField | Si la regla está vigente |

`unique_together: (tipo_documento, proceso)` — Una regla por combinación por tenant.

Celery beat task semanal: revisa documentos que cumplieron retención, genera notificación al Admin SGI.

Seed pragmático: solo combinaciones tipo x proceso activas del tenant, no todas las posibles.

---

## 10. Integración BPM → Gestor Documental `[SPRINT 7]`

El módulo BPM (`workflow_engine.disenador_flujos`) generará procedimientos automáticamente:

1. El diseñador BPM crea/actualiza un flujo BPMN 2.0.
2. BPM llama a `DocumentoService.crear_desde_modulo()` pasando contenido, tipo='PR', proceso=Area del flujo, `workflow_asociado_id`.
3. Se crea Documento con `estado=BORRADOR`, `es_auto_generado=True`.
4. Entra al ciclo normal: revisión → aprobación → publicación → distribución.
5. Si el flujo BPM se modifica, se genera nueva versión del procedimiento.

### 10.1 Documentos Reemplazados por Automatización

Algunos procedimientos serán reemplazados por funcionalidades del sistema:

- Procedimiento de Control de Documentos → Reemplazado por el propio Gestor Documental
- Procedimiento de Control de Registros → Reemplazado por Form Builder + Archivo
- Procedimiento de Acciones Correctivas → Parcialmente automatizado (módulo AC/AP futuro)
- Procedimiento de Auditoría Interna → Parcialmente automatizado (módulo Auditorías futuro)

---

## 11. Formularios con Firma Secuencial `[SPRINT 4]`

### 11.1 Caso de Uso

Formularios operativos (FT, AC, RG) requieren campos de firma embebidos. Ejemplo: permiso de trabajo en alturas donde firman solicitante, supervisor, rescatista y coordinador en orden secuencial.

### 11.2 Campo FIRMA_WORKFLOW (Tipo #17)

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| tipo_campo | = FIRMA_WORKFLOW | Nuevo tipo #17 en CampoFormulario (los 16 actuales + este) |
| config_firmantes | JSONField | `[{orden: 1, cargo_id: X, etiqueta: 'Solicitante'}, ...]` |
| modo_firma | CharField choices | SECUENCIAL, PARALELO, MIXTO |
| nivel_seguridad | IntegerField 1-3 | Hereda de TipoDocumento o configurable por campo |

### 11.3 Flujo

1. Usuario abre formulario (ej: FT-SST-012 Permiso de Alturas).
2. Llena campos operativos (fecha, ubicación, riesgos, controles).
3. Al llegar al campo FIRMA_WORKFLOW, se crean instancias FirmaDigital via GenericForeignKey (mismo motor de workflow_engine).
4. Primer firmante ve campo activo. Los demás ven campo bloqueado con indicador de turno.
5. Cada firmante usa SignatureModal. Backend valida `es_mi_turno`.
6. Al completar todas las firmas, formulario se marca COMPLETADO y genera PDF con firmas embebidas.
7. Si es archivable, el PDF se deposita via `DocumentoService.archivar_registro()`.

### 11.4 Diferencia con Firma Normativa

| Aspecto | Firma Normativa (docs SGI) | Firma en Formulario (registros) |
|---------|---------------------------|-------------------------------|
| ¿Quién firma? | ELABORÓ/REVISÓ/APROBÓ (roles fijos) | Configurado por formulario |
| ¿Cuándo? | Después de elaborar el documento | Durante el llenado en campo |
| ¿Dónde vive? | FirmaDigital → Documento | FirmaDigital → registro formulario |
| Motor | workflow_engine.firma_digital | workflow_engine.firma_digital (mismo) |
| Resultado | Documento APROBADO → PUBLICADO | Formulario COMPLETADO → PDF archivado |

---

## 12. Patrón de Actas: Módulos C2 Consumiendo GD `[SPRINT 3]`

### 12.1 Ejemplo: Acta de COPASST (HSEQ)

1. HSEQ programa reunión de COPASST (Celery scheduled task).
2. Celery notifica participantes vía centro_notificaciones.
3. Se ejecuta la reunión. HSEQ genera acta con temas, compromisos, asistentes.
4. HSEQ llama a `DocumentoService.crear_desde_modulo()` con tipo='AC', proceso='SST', participantes como firmantes.
5. GD crea Documento BORRADOR, configura FirmaDigital para cada participante.
6. Participantes firman desde Mi Portal.
7. Completadas las firmas: APROBADO → PUBLICADO → distribuido → archivado.

### 12.2 API Pública para Módulos C2

| Método | Uso | Estado |
|--------|-----|--------|
| `DocumentoService.crear_desde_modulo()` | Documento con ciclo de firmas completo. Para actas, procedimientos BPM. | `[SPRINT 3]` |
| `DocumentoService.archivar_registro()` | PDF ya completado directo a ARCHIVADO. Para evidencias, inspecciones. Sin firmas. | `[SPRINT 3]` |

**Regla:** HSEQ (C2) importa de gestion_documental (CT). Nunca al revés.

### 12.3 Módulos que Consumirán

| Módulo C2 | Qué genera | Método GD | Tipo Doc |
|-----------|-----------|-----------|----------|
| HSEQ | Actas COPASST, investigaciones AT | crear_desde_modulo / archivar_registro | AC / RG |
| Talento Humano | Evaluaciones, encuestas, contratos | archivar_registro | RG |
| PESV | Inspecciones vehiculares, profesiogramas | archivar_registro | RG |
| BPM | Procedimientos auto-generados | crear_desde_modulo | PR |
| Auditorías | Informes de auditoría, planes AC | crear_desde_modulo | RG / AC |

---

## 13. Generación de PDF — Layout Estandarizado

### 13.1 Motor Actual `[LIVE]`

**WeasyPrint** (`exporters/pdf_generator.py`, 598 líneas). Genera HTML con CSS inline y compila a PDF. Plantilla construida en Python como strings concatenados, **no como archivo `.html` separado**.

Prioridad de servicio: (1) `archivo_pdf` en disco → servir directo, (2) doc externo → servir original, (3) fallback → generar con WeasyPrint.

### 13.2 Layout Estándar del PDF `[LIVE]`

```
┌─────────────────────────────────────────────┐
│  HEADER (running @top-center)                │
│  [Logo tenant]  Nombre Empresa   Código Doc  │
├─────────────────────────────────────────────┤
│                                             │
│  [Marca de agua rotada -35° semitransparente]│
│                                             │
│  CONTENIDO DEL DOCUMENTO                    │
│  (HTML renderizado desde documento.contenido)│
│                                             │
├─────────────────────────────────────────────┤
│  BLOQUE DE FIRMAS (grid 3 columnas)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ ELABORÓ   │ │ REVISÓ   │ │ APROBÓ   │    │
│  │ [firma]   │ │ [firma]  │ │ [firma]  │    │
│  │ ───────── │ │ ──────── │ │ ──────── │    │
│  │ Nombre    │ │ Nombre   │ │ Nombre   │    │
│  │ Cargo     │ │ Cargo    │ │ Cargo    │    │
│  │ Fecha     │ │ Fecha    │ │ Fecha    │    │
│  │ Hash:a3f2 │ │ Hash:b7d │ │ Hash:c9e │    │
│  └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────┤
│  [Estampa X.509 visible]   [QR SHA-256]     │
├─────────────────────────────────────────────┤
│  FOOTER (running @bottom-center)             │
│  Código | Versión | Estado | Página X de Y   │
└─────────────────────────────────────────────┘
```

### 13.3 Marcas de Agua por Estado `[LIVE]`

| Estado | Texto | Color |
|--------|-------|-------|
| BORRADOR | "BORRADOR — Documento no aprobado" | Gris claro rgba(200,200,200,0.25) |
| EN_REVISION | "EN REVISIÓN — Pendiente de aprobación" | Gris claro |
| PUBLICADO | "COPIA CONTROLADA" + fecha + usuario descarga | Gris claro |
| **OBSOLETO** | **"OBSOLETO — Documento fuera de vigencia"** | **Rojo rgba(220,50,50,0.20)** |

### 13.4 Firmas en el PDF `[LIVE]`

Cada firma muestra: imagen del trazo (canvas base64), línea separadora, nombre, cargo, fecha, hash SHA-256 truncado a 16 chars. Estados: FIRMADO = imagen + datos, PENDIENTE = línea vacía, RECHAZADO = estado rojo + comentario.

### 13.5 Sellado X.509 `[LIVE]`

**Doble:** Estampa visible en página 1 (esquina inferior izquierda) con texto "DOCUMENTO CONTROLADO" + código + versión + empresa + fecha. Y firma digital invisible (metadata PDF) con pyHanko + certificado del tenant.

### 13.6 Brechas del Generador PDF

| # | Brecha | Impacto | Sprint |
|---|--------|---------|--------|
| 1 | **No hay renderizador JSON→PDF.** `datos_formulario` del Form Builder genera PDF vacío. | Formularios sin PDF | Sprint 3.5 |
| 2 | **No hay templates por tipo.** Actas necesitan asistentes, formatos necesitan tabla de campos. | Layout uniforme para todos los tipos | Sprint 5a |
| 3 | **Listado maestro PDF no implementado.** Endpoint acepta `formato=pdf` pero solo retorna JSON. | Sin export PDF de listado maestro | Sprint 5a |
| 4 | **Generador monolítico.** 598 líneas inline en Python. Cada condicional por tipo incrementa complejidad. | Difícil de mantener y testear | Sprint 3.5 |

### 13.7 Refactor del Generador PDF `[SPRINT 3.5]`

**Problema actual:** El generador construye HTML como f-strings dentro de Python (598 líneas). No es testeable unitariamente, un tag HTML mal cerrado produce PDFs rotos sin error, y agregar layout por tipo de documento requiere if/elif cada vez más largos.

**Solución:** Extraer HTML a templates Django en `templates/pdf/`:

```
templates/pdf/
├── base.html                    ← layout base: @page, header, footer, watermark, firmas, QR
├── tipo_documento_normativo.html ← POL, MA, RE (contenido estándar)
├── tipo_procedimiento.html       ← PR, IN, GU (objetivo + alcance + contenido)
├── tipo_formulario.html          ← FT, RG (datos_formulario renderizado como tabla)
├── tipo_acta.html                ← AC (asistentes + temas + compromisos)
├── tipo_plan.html                ← PG, PL (cronograma + responsables)
└── tipo_conocimiento.html        ← KB (contenido + tags, sin firmas)
```

Todos heredan de `base.html` con bloques `{% block contenido %}`. El generador Python pasa de 598 líneas a ~150 (solo lógica de datos + `render_to_string()`).

**`_renderizar_datos_formulario()`:** Método que convierte `datos_formulario` (JSONField) a HTML tabular. Maneja los 17 tipos de campo incluyendo TABLA (sub-tabla), SIGNATURE (imagen base64), SECCION (header), FIRMA_WORKFLOW (grid de firmantes).

### 13.8 Templates PDF por Tipo `[SPRINT 5a]`

| TipoDocumento | Template | Secciones Especiales |
|---------------|----------|---------------------|
| POL, MA, RE | tipo_documento_normativo.html | Header + contenido + firmas (layout estándar) |
| PR, IN, GU | tipo_procedimiento.html | Header + objetivo + alcance + contenido + firmas |
| FT, RG | tipo_formulario.html | Header + datos_formulario como tabla + firmas |
| AC | tipo_acta.html | Header + asistentes + temas + compromisos + firmas participantes |
| PG, PL | tipo_plan.html | Header + cronograma + responsables + contenido + firmas |
| KB | tipo_conocimiento.html | Header + contenido + tags + sin firmas |

---

## 14. Design System y Estándares de UI `[LIVE]`

### 14.1 Stack Visual

| Tecnología | Detalle |
|-----------|---------|
| CSS Framework | Tailwind CSS 3.4 (utility-first). Custom puro, sin MUI/Chakra/shadcn. |
| Iconos | Lucide React. NUNCA emojis en UI de producción. |
| Tipografía | Inter (body) + Montserrat (headings). Google Fonts. |
| Dark Mode | Class-based. Toggle en sidebar. |
| Colores | CSS variables dinámicas por tenant (branding). |
| Utilidades | `cn()` = clsx + twMerge. |

### 14.2 Sistema de 3 Capas de Color

**Capa 1 — Branding del Tenant (dinámico):** `useBrandingConfig()` lee colores de BD, `useDynamicTheme()` genera 11 variantes (50→950), inyecta como CSS vars `--color-primary-500`. Tailwind consume: `bg-primary-600`, `text-primary-700`.

**Mejora `[SPRINT 5b]`:** Secondary también debe ser dinámico. Agregar `secondary_color` al modelo Branding.

**Capa 2 — Color por Módulo:** `useModuleColor('gestion_documental')` → 'indigo'. Se pasa como prop `moduleColor` a StatsGrid, DynamicSections, ViewToggle.

**Capa 3 — Estados Fijos (no cambian):**

| Estado | Color | Uso en GD |
|--------|-------|-----------|
| success (verde) | bg-green-100 text-green-800 | Publicado, Aprobado, Firmado, Lectura completada |
| warning (amarillo) | bg-yellow-100 text-yellow-800 | En Revisión, Pendiente firma, Próximo a vencer |
| danger (rojo) | bg-red-100 text-red-800 | Obsoleto, Rechazado, Vencido, Error OCR |
| info (azul) | bg-blue-100 text-blue-800 | Borrador, En proceso, Informativo |
| gray (neutro) | bg-gray-100 text-gray-800 | Fondos, bordes, texto secundario, Archivado |

### 14.3 Reglas Inviolables

- SIEMPRE `bg-primary-600` (dinámico). NUNCA `bg-pink-600` ni `bg-[#ec268f]`.
- SIEMPRE `variant="success"` en Badge. NUNCA `className="bg-green-100"` directo.
- SIEMPRE pasar `moduleColor` como prop a StatsGrid, DynamicSections, ViewToggle.
- SIEMPRE Lucide React. NUNCA emojis.
- SIEMPRE modales en la PÁGINA, no en la sección.
- NUNCA duplicar niveles: Sidebar = módulos, DynamicSections = secciones, PageTabs = sub-tabs.
- Charts: ÚNICA excepción de colores hardcodeados.

### 14.4 Componentes Clave `[LIVE]`

| Componente | Carpeta | Uso en GD |
|-----------|---------|-----------|
| PageHeader | layout/ | Siempre primer elemento de la página |
| DynamicSections | common/ | Tabs principales del módulo (variant="underline") |
| StatsGrid | layout/ | Métricas del dashboard (moduleColor, columns, variant) |
| ViewToggle | common/ | Toggle cards/lista |
| PageTabs | layout/ | Sub-tabs dentro de sección (variant="underline") |
| BaseModal | modals/ | Todos los modales (sizes: xs→full) |
| Badge | common/ | Estados (variants: success, warning, danger, info, gray) |
| ConfirmDialog | common/ | Confirmación destructiva |
| EmptyState | common/ | Estado vacío con guía |
| ProtectedAction | common/ | Envolver acciones que requieren permiso RBAC |
| ExportButton | common/ | Export PDF/Excel |

---

## 15. UX/UI — Principios Anti-Fatiga

### 15.1 Máximo 2 Clicks al Documento `[SPRINT 4]`

| Tarea Frecuente | Flujo Ideal (2 clicks) | Flujo a Evitar (4+) |
|----------------|----------------------|---------------------|
| Consultar procedimiento | Repositorio → click card = abre PDF | Repositorio → filtrar → buscar → click → modal → tab contenido |
| Firmar documento | Mi Portal badge → Firmar = SignatureModal | GD → En Proceso → sub-tab → buscar → click → Firmar |
| Confirmar lectura | Mi Portal notificación → Leer + Aceptar | GD → En Proceso → buscar → abrir → leer → scroll → aceptar |

### 15.2 Revelación Progresiva por Rol `[SPRINT 5b]`

| Rol | Ve por defecto | No ve |
|-----|---------------|-------|
| Operario/Auxiliar | Mi Portal: lecturas y firmas. Solo docs de su proceso. | Configuración, Dashboard, Archivo |
| Líder de Proceso | Repositorio filtrado. En Proceso. Dashboard de su proceso. | Configuración global |
| Admin SGI / Consultor | Todo: Repositorio global, Dashboard, Configuración, Archivo completo. | — |

### 15.3 Acción Directa desde Cards `[SPRINT 4]`

- Card Repositorio: botón 'Ver PDF' directo (sin pasar por DetailModal). Botón secundario 'Detalle' para metadatos.
- Card firma pendiente: botón 'Firmar' directo si `es_mi_turno=true`. Badge: 'Tu turno' verde o 'Esperando a X' gris.
- Card lectura Mi Portal: botón 'Leer ahora' directo. Barra de progreso del % leído.
- NUNCA modal intermedio para la acción principal.

### 15.4 Búsqueda Inteligente `[SPRINT 4]`

- Input grande y centrado en Repositorio (debounce 300ms) sobre código + título + texto OCR.
- Filtros avanzados colapsados por defecto (accordion). Chips de filtros activos.
- Ctrl+K abre búsqueda global desde cualquier tab.

### 15.5 Feedback Visual Inmediato `[SPRINT 5b]`

- Al firmar: checkmark animado + badge cambia (optimistic update, rollback si falla).
- Al aceptar lectura: barra 100% + toast + card fade-out.
- Carga: skeleton loaders en cards, nunca spinner bloqueante.

### 15.6 Anti-Patrones

| Anti-patrón | Alternativa |
|------------|-------------|
| Modal dentro de modal (3 niveles) | Máximo 2 niveles. Firmar desde card directamente. |
| Formulario con 15+ campos visibles | Wizard 3 pasos: Tipo+Proceso / Contenido / Firmantes. |
| Tabla con 10+ columnas | Card view default. Lista max 6 columnas. |
| Filtros siempre visibles (200px alto) | Buscador prominente + filtros colapsados + chips. |
| Confirmación para cada acción | Solo para destructivas. Guardar borrador sin confirmación. |

---

## 16. Modelos Nuevos y Modificaciones

### 16.1 Modificaciones al Modelo Documento `[SPRINT 2-3]`

| Campo Nuevo | Tipo | Sprint | Propósito |
|------------|------|--------|-----------|
| proceso | FK → organizacion.Area | Sprint 2 | Proceso principal para codificación TIPO-PROCESO-NNN |
| modulo_origen | CharField(50, null) | Sprint 3 | Para registros archivados: 'hseq', 'talento_humano', 'pesv' |
| referencia_origen_type | FK → ContentType, null | Sprint 3 | GenericForeignKey parte 1 — trazabilidad |
| referencia_origen_id | PositiveIntegerField, null | Sprint 3 | GenericForeignKey parte 2 |
| es_reemplazo_automatizado | BooleanField default=False | Sprint 7 | Procedimiento reemplazado por funcionalidad del sistema |
| funcionalidad_reemplazo | CharField, null | Sprint 7 | Referencia a qué módulo/función lo reemplaza |

### 16.2 Modificaciones a AceptacionDocumental `[SPRINT 1]`

| Campo Nuevo | Tipo | Propósito |
|------------|------|-----------|
| version_documento | FK → VersionDocumento, null | Versión específica que se acepta |
| invalidada | BooleanField default=False | True cuando se publica nueva versión |

### 16.3 Nuevo: TablaRetencionDocumental `[SPRINT 2]`

Ver sección 9.2.

### 16.4 Modificación: ConsecutivoConfig `[SPRINT 2]`

Agregar `proceso` (FK Area, nullable). `unique_together` → `(codigo, proceso, tenant)`.

### 16.5 Nuevo: Campo FIRMA_WORKFLOW en CampoFormulario `[SPRINT 4]`

Ver sección 11.2. Tipo #17 con `config_firmantes`, `modo_firma`, `nivel_seguridad`.

### 16.6 Deprecaciones `[SPRINT 2]`

- `puestos_aplicacion` (JSONField) — campo muerto, sin uso en frontend ni backend.
- `areas_aplicacion` como fuente de codificación — se mantiene para visibilidad pero no genera código.
- Migración de `areas_aplicacion` de strings arbitrarios a `Area.code`.

---

## 17. Roadmap Detallado

### Sprint 1 — Seguridad + Funcional Crítico `[COMPLETADO 2026-04-04]`

**Commit:** `2b8261cc`

| # | Tarea | Estado | Detalle |
|---|-------|--------|---------|
| 1.1 | `DocumentoAccessMixin` | DONE | `mixins.py` — aplicado en retrieve, export PDF/DOCX, verificar-sellado, subir/eliminar-anexo |
| 1.2 | Campo `invalidada` en AceptacionDocumental | DONE | Migración `0014_add_invalidada_aceptacion` — `version_documento` CharField ya existía |
| 1.3 | Invalidar aceptaciones al publicar nueva versión | DONE | `DocumentoService.publicar_documento()` + filtro `invalidada=False` en `mis-pendientes` |
| 1.4 | Celery tasks de vencimiento | YA EXISTÍA | Tasks `verificar_documentos_revision_programada` y `notificar_documentos_por_vencer` ya implementadas |
| 1.5 | Badge "Próximo a vencer" en Repositorio | DONE | Cards + list view: "Vence en Xd" (warning) / "Vencido" (danger) para PUBLICADOS |

### Sprint 2 — Codificación + TRD + FK Proceso `[COMPLETADO 2026-04-04]`

**Commits:** `c1a2bc90` (motor + FK + frontend) + `bd2ceeda` (TRD + scripts + tab)
**Objetivo:** SGI certificable ISO con codificación estándar y retención documental formal.

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 2.1 | Campo `proceso` (FK a Area) en Documento | Backend | Migration | FK funcional, nullable para datos existentes |
| 2.2 | Script migración: inferir proceso de `areas_aplicacion` JSON → asignar FK | Backend | Management command | 100% docs con proceso asignado o null explícito |
| 2.3 | Migrar `areas_aplicacion` de strings arbitrarios a `Area.code` | Backend | Management command | JSON contiene solo códigos válidos de Area |
| 2.4 | ConsecutivoConfig: campo `proceso` FK, unique `(codigo, proceso, tenant)` | Backend | Migration + Model | Consecutivos por tipo+proceso con select_for_update |
| 2.5 | Refactorizar `generar_codigo()`: eliminar 3 fallbacks, formato TIPO-PROCESO-NNN | Backend | Service refactor | Nuevos docs generan PR-SST-001; thread-safe |
| 2.6 | Migración dura de códigos existentes al formato nuevo | Backend | Management command | Todos los documentos con código TIPO-PROCESO-NNN |
| 2.7 | Deprecar `puestos_aplicacion`, marcar `areas_aplicacion` como no-codificación | Backend | Serializer update | API documenta deprecación |
| 2.8 | Modelo TablaRetencionDocumental + serializer + viewset + seed pragmático | Backend | Model + CRUD | TRD funcional con seed de combinaciones activas |
| 2.9 | Selector de Proceso en DocumentoFormModal (Select con Area.code) | Frontend | Form field | Al crear, usuario selecciona proceso; código se pre-visualiza |
| 2.10 | Filtro por proceso en Repositorio | Frontend | Filter component | Filtrar repositorio por proceso funciona |
| 2.11 | Tab TRD en Configuración | Frontend | Section component | Admin puede ver/editar TRD por tipo+proceso |

### Sprint 3 — Integración C2 + Archivo

**Objetivo:** El Gestor Documental como notario. Módulos C2 depositan y crean documentos.

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 3.1 | Campos en Documento: `modulo_origen`, `referencia_origen` (GenericFK) | Backend | Migration | GenericFK funcional |
| 3.2 | `DocumentoService.archivar_registro()` | Backend | Service method | C2 puede crear registro archivado con código automático |
| 3.3 | `DocumentoService.crear_desde_modulo()` | Backend | Service method | C2 puede crear doc con ciclo de firmas completo |
| 3.4 | Sub-tab 'Registros Archivados' en ArchivoSection | Frontend | PageTab + list | Filtros por módulo origen, proceso, fechas |
| 3.5 | Comparación de versiones UI (diff side-by-side) | Frontend | Diff component | Usuario ve qué cambió entre versiones |
| 3.6 | Dashboard: widget 'Registros por módulo' | Frontend | Chart component | Dashboard muestra registros por módulo origen |

### Sprint 3.5 — Refactor Generador PDF

**Objetivo:** Extraer HTML inline a templates Django. Prerequisito para Form Builder (Sprint 4) y templates por tipo (Sprint 5a).

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 3.5.1 | Crear `templates/pdf/base.html` con bloques: header, watermark, content, firmas, qr, footer | Backend | Template base | PDF generado idéntico al actual |
| 3.5.2 | Migrar CSS de strings Python a archivo base.html | Backend | CSS cleanup | Estilos centralizados, no duplicados |
| 3.5.3 | Implementar `_renderizar_datos_formulario()`: JSON Form Builder → HTML tabular | Backend | Generator method | Los 17 tipos de campo renderizados (TEXT, TABLA, SIGNATURE, FIRMA_WORKFLOW...) |
| 3.5.4 | Reducir `pdf_generator.py` de 598 líneas a ~150 (solo lógica de datos + `render_to_string`) | Backend | Refactor | Generador usa templates, no strings |
| 3.5.5 | Implementar listado maestro PDF con layout dedicado (tabla agrupada por tipo) | Backend | PDF generator | Export PDF funcional agrupado por tipo |
| 3.5.6 | Tests unitarios: renderizado por tipo, bloque firmas, watermarks, JSON formulario | Backend | Tests | Cobertura de los 6 layouts |

### Sprint 4 — Form Builder + Firma en Formularios + UX

**Objetivo:** Eliminar papel. Formularios con firma secuencial. UX enterprise.

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 4.1 | Tipo #17 FIRMA_WORKFLOW en CampoFormulario | Backend | Model + Migration | Campo configurable con firmantes ordenados |
| 4.2 | Renderizar FIRMA_WORKFLOW en DynamicFormRenderer | Frontend | Form field component | Firmantes visibles, solo el de turno tiene botón activo |
| 4.3 | Integrar SignatureModal con FIRMA_WORKFLOW via GenericFK | Ambos | Integration | Firma guarda en FirmaDigital, actualiza estado |
| 4.4 | Condiciones de visibilidad en DynamicFormRenderer | Frontend | Renderer logic | Campo se muestra/oculta según valor del campo referenciado |
| 4.5 | Fórmulas de cálculo para campos calculados | Frontend | Renderer logic | Campo calculado se actualiza en tiempo real |
| 4.6 | Búsqueda global Ctrl+K con debounce sobre código + título + texto OCR | Frontend | Search component | Búsqueda instantánea desde cualquier tab |
| 4.7 | Filtros colapsados + chips de filtros activos | Frontend | Filter UX | Filtros ocultos, buscador prominente, chips visibles |
| 4.8 | Acción directa desde cards: 'Ver PDF' y 'Firmar' sin modal intermedio | Frontend | Card actions | Click directo abre reader/SignatureModal |
| 4.9 | Wizard de creación 3 pasos (Tipo+Proceso / Contenido / Firmantes) | Frontend | Wizard component | FormModal reemplazado por 3 pasos claros |
| 4.10 | Verificación de sellado X.509 en UI (botón en DetailModal) | Frontend | Button + feedback | Click muestra resultado de verificación |

### Sprint 5a — PDF Templates por Tipo

**Objetivo:** PDF estandarizado y diferenciado por tipo de documento.

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 5a.1 | Template `tipo_procedimiento.html` (PR, IN, GU): objetivo + alcance + contenido | Backend | Template | Procedimientos con estructura ISO |
| 5a.2 | Template `tipo_formulario.html` (FT, RG): datos_formulario como tabla | Backend | Template | Formularios con datos renderizados |
| 5a.3 | Template `tipo_acta.html` (AC): asistentes + temas + compromisos | Backend | Template | Actas con estructura de reunión |
| 5a.4 | Template `tipo_plan.html` (PG, PL): cronograma + responsables | Backend | Template | Planes con layout temporal |
| 5a.5 | Template `tipo_conocimiento.html` (KB): contenido + tags, sin firmas | Backend | Template | KB sin bloque de firmas |
| 5a.6 | Selector de template por `TipoDocumento.codigo` con fallback a base | Backend | Generator logic | Cada tipo usa su template automáticamente |

### Sprint 5b — Design System Polish

**Objetivo:** Consistencia visual, feedback inmediato, revelación progresiva.

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 5b.1 | Secondary color dinámico: campo en Branding + `useDynamicTheme()` genera variantes | Ambos | Model + Hook | Tenant puede cambiar secondary |
| 5b.2 | Auditoría colores hardcodeados: reemplazar por secondary/moduleColor | Frontend | Refactor | Cero hex inline en GD |
| 5b.3 | Optimistic updates en firmas: checkmark instantáneo con rollback | Frontend | TanStack mutation | Feedback en <200ms |
| 5b.4 | Optimistic updates en aceptación de lectura: fade-out + toast | Frontend | TanStack mutation | Card desaparece instantáneamente |
| 5b.5 | Skeleton loaders en todas las vistas del GD | Frontend | Skeleton components | Carga sin spinners bloqueantes |
| 5b.6 | EmptyState personalizado por sección con acción sugerida | Frontend | EmptyState configs | Cada tab vacío muestra guía contextual |
| 5b.7 | Revelación progresiva: ocultar tabs Configuración y Archivo para roles básicos | Frontend | Permission check | Operario solo ve Repositorio + En Proceso + Dashboard |

### Sprint 6 — Búsqueda Avanzada + Mobile

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 6.1 | Búsqueda full-text con PostgreSQL `tsvector` | Backend | Search engine | Búsqueda por relevancia, no solo icontains |
| 6.2 | Mobile-responsive: visor PDF y firma desde móvil | Frontend | Responsive | Firma funcional en pantalla táctil |
| 6.3 | Workflow revisión programada automática (doc vence → borrador v2) | Backend | Task + Service | Al vencer, se crea borrador automáticamente |
| 6.4 | Sincronización Biblioteca Maestra entre tenants | Ambos | Sync service | Plantillas maestras se replican a tenants |

### Sprint 7 — BPM + Futuro

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 7.1 | Integración BPM → auto-generación de procedimientos desde flujos BPMN | Ambos | Integration | BPM genera PR-XXX-NNN en BORRADOR |
| 7.2 | Campos `es_reemplazo_automatizado` + `funcionalidad_reemplazo` en Documento | Backend | Migration | Marcar procedimientos reemplazados por sistema |
| 7.3 | Integración RFC 3161 / Certicámara para estampado cronológico | Backend | Integration | Firma con timestamp server certificado |
| 7.4 | OCR avanzado: clasificación automática de tipo documental por contenido | Backend | ML service | OCR sugiere tipo al ingestar |
| 7.5 | Dashboard BI avanzado (activar app analytics L80) | Ambos | Analytics module | Dashboard con KPIs cross-módulo |

---

## 18. Deuda Técnica Catalogada

| # | Deuda | Severidad | Sprint | Estado |
|---|-------|-----------|--------|--------|
| DT-01 | ~~Acceso CONFIDENCIAL sin enforcement~~ | ~~Crítica~~ | Sprint 1 | **RESUELTO** (2b8261cc) |
| DT-02 | ~~AceptacionDocumental no se invalida al publicar nueva versión~~ | ~~Alta~~ | Sprint 1 | **RESUELTO** (2b8261cc) |
| DT-03 | ~~Sin notificaciones de vencimiento de documentos~~ | ~~Alta~~ | Sprint 1 | **YA EXISTÍA** |
| DT-04 | ~~2 formatos de código incompatibles~~ | ~~Alta~~ | Sprint 2 | **RESUELTO** (c1a2bc90) |
| DT-05 | ~~`puestos_aplicacion` campo muerto~~ | ~~Baja~~ | Sprint 2 | **DEPRECADO** (c1a2bc90) |
| DT-06 | ~~`areas_aplicacion` strings arbitrarios~~ | ~~Media~~ | Sprint 2 | **RESUELTO** (migrar_procesos_gd) |
| DT-07 | Form Builder JSON no genera PDF (datos_formulario → PDF vacío) | Alta | Sprint 3.5 | Pendiente |
| DT-08 | Generador PDF monolítico (598 líneas, inline, no testeable) | Media | Sprint 3.5 | Pendiente |
| DT-09 | Form Builder sin condiciones de visibilidad en UI | Media | Sprint 4 | Pendiente |
| DT-10 | Form Builder sin fórmulas de cálculo en UI | Media | Sprint 4 | Pendiente |
| DT-11 | Comparación de versiones sin UI (endpoint existe, UI no) | Media | Sprint 3 | Pendiente |
| DT-12 | Listado maestro PDF no implementado (solo JSON) | Baja | Sprint 3.5 | Pendiente |
| DT-13 | 322 inline styles → Tailwind en features | Baja | Sprint 5b | Pendiente |
| DT-14 | Secondary color no dinámico (hardcodeado #000000) | Baja | Sprint 5b | Pendiente |
| DT-15 | Búsqueda full-text básica (icontains, sin ranking) | Baja | Sprint 6 | Pendiente |
| DT-16 | Sin revelación progresiva por rol (todos ven todos los tabs) | Baja | Sprint 5b | Pendiente |
| DT-17 | Verificación sellado X.509 sin UI (endpoint existe, botón no) | Baja | Sprint 4 | Pendiente |

---

## 19. Instrucciones para Claude Code

### 19.1 Contexto General (copiar al inicio de cada sesión)

```
El módulo Gestión Documental vive en backend/apps/gestion_estrategica/gestion_documental/.
Es capa CT (Infraestructura Transversal, como workflow_engine).
Stack: Django 5 + DRF + PostgreSQL 15 + django-tenants.
Frontend: React 18 + TypeScript + TanStack Query 5 + Zustand + Tailwind CSS 3.4.
Design System propio en frontend/src/components/ (common/, forms/, layout/, modals/).
Colores dinámicos por tenant via CSS vars. Iconos: Lucide React.
Modales se definen en la PÁGINA, no en la sección.
Usar useModuleColor, DynamicSections, StatsGrid, PageTabs, Badge con variants.
NUNCA hardcodear colores. NUNCA emojis en UI.

Campos reales:
- clasificacion (no clasificacion_acceso) = PUBLICO|INTERNO|CONFIDENCIAL|RESTRINGIDO
- areas_aplicacion = JSONField de Area.code (visibilidad multi-proceso)
- proceso = FK a Area [SPRINT 2] (codificación TIPO-PROCESO-NNN)
- puestos_aplicacion = DEPRECADO (campo muerto)
- lectura_obligatoria = tiene lógica completa con signal post_save de User
- responsable_cargo = solo informativo, sin lógica de permisos
- codigo = unique_together con empresa_id, max_length=50, con index

Retrocompatibilidad: normalizeSection() mapea códigos legacy (documentos→repositorio, control_cambios→en_proceso).
Repositorio muestra TODOS los estados (no solo PUBLICADOS), filtrable por UI.

Lógica de acceso (sección 8.5):
  CONFIDENCIAL/RESTRINGIDO → 403 si user NOT IN usuarios_autorizados AND user.cargo NOT IN cargos_distribucion AND user != elaborado_por|revisado_por|aprobado_por
  PUBLICO/INTERNO → visible para todo el tenant

PDF generator es monolítico (598 líneas inline) hasta Sprint 3.5. Refactor a templates Django planeado.
```

### 19.2 Sprint 1 — Instrucciones

**Tarea 1.1:** Crear `DocumentoAccessMixin` en `gestion_documental/mixins.py`. Método `check_documento_access(self, request, documento)`: lógica de sección 8.5. Aplicar en: `export_documento_pdf`, `export_documento_docx`, endpoints verificar-sellado y subir-anexo, y retrieve del DocumentoViewSet.

**Tarea 1.2-1.3:** Paso 1: Agregar a AceptacionDocumental: `version_documento = FK(VersionDocumento, null=True)`, `invalidada = BooleanField(default=False)`. Migración. Paso 2: En `DocumentoService.publicar()`, después de cambiar estado: invalidar anteriores, crear nuevas con version_documento actual, notificar. Paso 3: `mis-pendientes` filtra `.filter(invalidada=False)`.

**Tarea 1.4-1.5:** Task `verificar_documentos_proximos_a_vencer()` en `tasks.py`. Celery beat crontab domingo 6am. Lógica: docs PUBLICADOS con `fecha_revision_programada` dentro de 30 días. Verificar no duplicar Notificacion. Frontend: Badge `variant="warning"` en cards.

### 19.3 Sprint 2 — Instrucciones

**Tarea 2.1-2.6:** Orden exacto: (1) `proceso = FK('organizacion.Area', null=True, on_delete=PROTECT)`. (2) Command `migrar_procesos.py`: parsear `areas_aplicacion[0]`, buscar Area, asignar FK. (3) Command `migrar_areas_aplicacion.py`: convertir strings arbitrarios a Area.code. (4) ConsecutivoConfig: `proceso = FK(Area, null=True)`, unique `(codigo, proceso)`. (5) `generar_codigo()`: `select_for_update()`, retornar `'{tipo}-{proceso.code}-{n:03d}'`. (6) Command `migrar_codigos.py`: recodificar todos al formato nuevo.

**Tarea 2.8:** Modelo TablaRetencionDocumental. Campos de sección 9.2. Seed: solo combinaciones tipo×proceso que ya tienen documentos.

### 19.4 Sprint 3.5 — Instrucciones

**Tarea 3.5.1-3.5.4:** Crear `templates/pdf/base.html` con estructura del diagrama de sección 13.2. Extraer CSS de strings Python. Implementar `_renderizar_datos_formulario(datos, campos_config)` que itera campos Form Builder y genera HTML tabular. Reducir `pdf_generator.py` usando `render_to_string('pdf/base.html', context)`.

---

*Documento técnico de referencia — StrateKaz Consultoría 4.0*
*Este documento se actualiza con cada sprint completado.*
