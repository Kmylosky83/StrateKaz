# ARQUITECTURA DEL MÓDULO — GESTIÓN DOCUMENTAL

**StrateKaz SGI — Plataforma de Gestión Empresarial 360**
Versión 4.0 — Abril 2026
Elaborado por: Camilo Rubiano Bustos — StrateKaz Consultoría 4.0

---

## Tabla de Contenido

1. [Visión General](#1-visión-general)
2. [Posición en la Arquitectura de Capas](#2-posición-en-la-arquitectura-de-capas)
3. [Estructura de Tabs del Módulo](#3-estructura-de-tabs-del-módulo)
4. [Ciclo de Vida del Documento](#4-ciclo-de-vida-del-documento)
5. [Dos Roles del Módulo](#5-dos-roles-del-módulo)
6. [Sistema de Codificación TIPO-PROCESO-NNN](#6-sistema-de-codificación-tipo-proceso-nnn)
7. [Modelo de Visibilidad y Acceso](#7-modelo-de-visibilidad-y-acceso)
8. [Tabla de Retención Documental (TRD)](#8-tabla-de-retención-documental-trd)
9. [Integración BPM → Gestor Documental](#9-integración-bpm--gestor-documental)
10. [Formularios con Firma Secuencial](#10-formularios-con-firma-secuencial)
11. [Patrón de Actas: Módulos C2 Consumiendo GD](#11-patrón-de-actas-módulos-c2-consumiendo-gd)
12. [Generación de PDF — Layout Estandarizado](#12-generación-de-pdf--layout-estandarizado)
13. [Design System y Estándares de UI](#13-design-system-y-estándares-de-ui)
14. [UX/UI — Principios Anti-Fatiga](#14-uxui--principios-anti-fatiga)
15. [Modelos Nuevos y Modificaciones](#15-modelos-nuevos-y-modificaciones)
16. [Roadmap Detallado](#16-roadmap-detallado)
17. [Instrucciones para Claude Code](#17-instrucciones-para-claude-code)

---

## 1. Visión General

### 1.1 Propósito

El módulo de Gestión Documental es la **capa transversal (CT)** de StrateKaz SGI que resuelve el ciclo de vida completo de la documentación en un Sistema de Gestión Integrado (ISO 9001/14001/45001). Opera en dos roles fundamentales:

- **Creador/Controlador:** Para documentos normativos (políticas, procedimientos, instructivos, manuales, guías, formatos). Ciclo completo de elaboración, revisión, aprobación con firma digital, distribución controlada y archivo.
- **Notario/Archivo:** Para registros operativos generados por otros módulos (HSEQ, Talento Humano, PESV). Recibe PDFs o registros transformados como evidencia archivada para trazabilidad y auditoría.

### 1.2 Estado Actual

El módulo cuenta con 7 modelos (158 campos), 45+ endpoints API, 25 componentes React (~7,200 líneas), firma digital con workflow secuencial/paralelo, OCR con pdfplumber+tesseract, sellado X.509 con pyHanko, form builder dinámico (16 tipos de campo), lectura verificada con scroll tracking (ISO 7.3), y versionamiento con checksums SHA-256.

---

## 2. Posición en la Arquitectura de Capas

| Capa | Apps | Regla |
|------|------|-------|
| **C0** | Django, PostgreSQL, django-tenants | Infraestructura base |
| **C1** | core, configuracion, organizacion, audit_system | Modelos base. Nadie importa de capas superiores. |
| **CT (Transversal)** | **workflow_engine, gestion_documental** | Servicios consumidos por toda app C2. Importan solo de C1. |
| **C2** | HSEQ, Talento Humano, PESV, BPM, etc. | Módulos de negocio. Importan de C1 y CT, nunca entre sí. |

**App:** `backend/apps/gestion_estrategica/gestion_documental/`

**Regla de no circularidad:** C2 importa de CT, CT importa de C1. Nunca al revés.

---

## 3. Estructura de Tabs del Módulo

La interfaz se organiza en 5 tabs principales, siguiendo la anatomía canónica de página:

```
PageHeader title="Gestión Documental" description={activeSectionData.description}
DynamicSections variant="underline" moduleColor={useModuleColor('gestion_documental')}
  Dashboard | Repositorio | En Proceso | Archivo | Configuración
Contenido de la sección activa (switch)
Modales globales (definidos en la PÁGINA, no en la sección)
```

| Tab | Componente | Descripción Funcional | Datos |
|-----|-----------|----------------------|-------|
| **Repositorio** | DocumentosSection | Vista principal del SGI. Listado maestro de documentos VIGENTES. Filtros por proceso (Area.code), tipo documental, clasificación. Toggle cards/list. Panel de cobertura. Búsqueda full-text OCR. | PUBLICADOS/VIGENTES |
| **En Proceso** | EnProcesoSection | Todo lo que requiere acción. Sub-tabs: (a) Firmas Pendientes con `es_mi_turno`, (b) Borradores míos, (c) En Revisión pendientes. | BORRADOR, EN_REVISION, APROBADO |
| **Configuración** | TiposPlantillasSection | Catálogo de 12 tipos documentales con propiedades. Plantillas por tipo. Firmantes por defecto. TRD por tipo+proceso. | Solo rol Admin SGI |
| **Archivo** | ArchivoSection | Sub-tabs: (a) Historial de Versiones con diff, (b) Distribución y acuses, (c) Obsoletos con marca de agua, (d) Registros Archivados de otros módulos. | OBSOLETO, ARCHIVADO + registros externos |
| **Dashboard** | DashboardDocumentalSection | Métricas: total por estado, cobertura por tipo, score cumplimiento, próximos a vencer, % socialización, registros por módulo origen. Listado maestro exportable (PDF/Excel). | Agregaciones globales |

### 3.1 Integración con Mi Portal

Mi Portal es el punto único del usuario. La integración funciona así:

- **Mi Portal muestra:** Lecturas pendientes (AceptacionDocumental), firmas pendientes (FirmaDigital con `es_mi_turno=true`), documentos nuevos de mi proceso. Cada ítem enlaza al documento.
- **Gestor Documental muestra:** La vista completa con filtros, configuración y archivo. Es la vista del administrador/líder de proceso.
- **Endpoints compartidos:** `/api/gestion-documental/aceptaciones/mis-pendientes/` y `/api/workflow-engine/firma-digital/mis-firmas-pendientes/` son consumidos por ambos.

---

## 4. Ciclo de Vida del Documento

### 4.1 Estados y Transiciones

| Estado | Acción Entrada | Acción Salida | Quién Decide | Tab Visible |
|--------|---------------|--------------|-------------|------------|
| BORRADOR | Crear / Devolver | enviar-revision | Elaborador | En Proceso |
| EN_REVISION | enviar-revision | aprobar / devolver | Revisor(es) | En Proceso |
| APROBADO | Todas las firmas OK | publicar | Sistema automático | En Proceso |
| PUBLICADO | publicar | marcar-obsoleto | Aprobador / Admin | Repositorio |
| OBSOLETO | marcar-obsoleto / nueva versión | archivar | Sistema / Admin | Archivo |
| ARCHIVADO | Cumple TRD | eliminar (con acta) | Admin SGI | Archivo |

### 4.2 Flujo de Firmas (Detalle)

1. El tipo documental define si requiere firma (`requiere_firma=true`) y el nivel de seguridad (1: manuscrita, 2: +TOTP, 3: +TOTP+OTP email).
2. Al enviar a revisión, se crean instancias `FirmaDigital` según plantilla: ELABORÓ (orden 1), REVISÓ (orden 2), APROBÓ (orden 3).
3. El flujo puede ser SECUENCIAL, PARALELO o MIXTO (ConfiguracionFlujoFirma).
4. Cada firma genera hash `SHA-256(trazo + otp + doc_id + version + timestamp_utc + cédula)` almacenado en HistorialFirma.
5. Si un firmante rechaza: `FirmaDigital.estado=RECHAZADA`, Documento regresa a BORRADOR, se notifica al elaborador, todas las firmas se resetean a PENDIENTE.
6. Cuando todas las firmas están en FIRMADA, el documento transiciona automáticamente a APROBADO.

### 4.3 Distribución y Lectura Verificada

Al publicar un documento (APROBADO → PUBLICADO):

- Se crean `AceptacionDocumental` según configuración: `aplica_a_todos`, `cargos_distribucion` (M2M a Cargo), `usuarios_autorizados` (M2M a User).
- Si `lectura_obligatoria=True`, se distribuye a TODOS los usuarios activos del tenant, y un signal `post_save` de User auto-asigna a nuevos usuarios.
- El visor PDF (DocumentoReaderModal) trackea: `porcentaje_lectura`, `scroll_data`, `tiempo_lectura_seg`, `ip_address`.
- El usuario confirma lectura explícitamente (botón Aceptar) después de alcanzar un % mínimo de scroll.

**DECISIÓN CRÍTICA PENDIENTE (Sprint 1):** Cuando se publica una nueva versión, las `AceptacionDocumental` de la versión anterior deben invalidarse y generarse nuevas. Esto NO está implementado.

---

## 5. Dos Roles del Módulo

### 5.1 Rol Creador — Documentos Normativos

El Gestor Documental es dueño del ciclo de vida de los 12 tipos documentales SGI:

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

### 5.2 Rol Notario/Archivo — Registros Operativos

Los módulos C2 (HSEQ, Talento Humano, PESV) generan datos en su propio flujo. Al completarse, depositan un PDF o registro en el Gestor Documental como evidencia archivada.

**Patrón de ingesta interna (sin circularidad):**

1. El módulo C2 completa su proceso (ej: investigación de accidente en HSEQ).
2. C2 llama a `DocumentoService.archivar_registro()` pasando: PDF, tipo='RG', proceso=Area, modulo_origen='hseq', referencia_origen (GenericForeignKey).
3. GD crea Documento con `estado=ARCHIVADO`, `es_auto_generado=True`, sin ciclo de firmas.
4. El registro queda en Archivo > Registros Archivados, filtrable por módulo origen.

**Campos para trazabilidad inversa (GenericForeignKey):** `modulo_origen` (CharField), `referencia_origen_type` (FK ContentType), `referencia_origen_id` (PositiveIntegerField).

---

## 6. Sistema de Codificación TIPO-PROCESO-NNN

### 6.1 Convención

Estándar ISO colombiano: `{TipoDocumento.codigo}-{Area.code}-{NNN}`

| Segmento | Fuente | Ejemplo | Descripción |
|----------|--------|---------|-------------|
| TIPO | TipoDocumento.codigo | PR, POL, IN, FT | Código del tipo documental |
| PROCESO | Area.code | SST, GCA, OPE, DIR | Código del proceso SGI (dinámico por tenant) |
| NNN | ConsecutivoConfig | 001, 002, 003 | Consecutivo por tipo+proceso con `select_for_update()` |

Ejemplos:

- `PR-SST-001` → Procedimiento #1 de Seguridad y Salud en el Trabajo
- `POL-DIR-001` → Política Integral del SGI (DIR = Direccionamiento Estratégico)
- `IN-OPE-003` → Instructivo #3 de Operaciones
- `FT-GAM-012` → Formato #12 de Gestión Ambiental

### 6.2 Decisiones de Diseño

**Documentos transversales:** Los documentos que aplican a todos los procesos (Política Integral, Manual SGI) usan `proceso=DIR` (Direccionamiento Estratégico) para codificación. La visibilidad multi-proceso se maneja con `areas_aplicacion` (ver sección 7).

**Procesos dinámicos por tenant:** `Area.code` es configurable desde el seed y editable por el admin del tenant. Si una empresa no tiene "Direccionamiento Estratégico" sino "Gestión Gerencial", el código del proceso refleja su estructura real.

**Migración dura:** Los documentos existentes con formato `POL-2026-0001` se recodifican al nuevo formato en una sola migración. El constraint `unique_together = ['empresa_id', 'codigo']` se respeta. No hay campo legacy.

### 6.3 Implementación Técnica

1. Agregar campo `proceso` (FK a `organizacion.Area`) en Documento para codificación.
2. Crear `ConsecutivoConfig` por combinación tipo+proceso con `select_for_update()`.
3. Eliminar los 3 fallbacks actuales y unificar en un único motor.
4. Script de migración: inferir proceso de `areas_aplicacion` JSON (ya se trata como single select en el FormModal) y asignar FK.
5. `areas_aplicacion` (JSONField) se **MANTIENE** para visibilidad multi-proceso. No se elimina. Pero deja de usarse para codificación.
6. `puestos_aplicacion` se **DEPRECA** — campo muerto sin uso en frontend ni backend.

---

## 7. Modelo de Visibilidad y Acceso

### 7.1 Campos Reales del Modelo Documento

| Campo | Tipo Django | Propósito |
|-------|------------|-----------|
| `clasificacion` | CharField(choices) | `PUBLICO \| INTERNO \| CONFIDENCIAL \| RESTRINGIDO` (default: INTERNO) |
| `usuarios_autorizados` | ManyToManyField(User) | Usuarios con acceso a docs CONFIDENCIALES/RESTRINGIDOS |
| `aplica_a_todos` | BooleanField(default=False) | Al publicar → distribuir a TODOS los usuarios del tenant |
| `cargos_distribucion` | ManyToManyField(Cargo) | Al publicar → distribuir a usuarios con estos cargos |
| `areas_aplicacion` | JSONField(default=list) | Áreas/procesos donde aplica (array de strings para visibilidad) |
| `lectura_obligatoria` | BooleanField(default=False) | Auto-asignar a cada nuevo usuario (signal post_save de User) |
| `responsable_cargo` | FK(Cargo, nullable) | Cargo responsable (solo informativo) |
| `proceso` | FK(Area) **[NUEVO]** | Proceso principal para codificación TIPO-PROCESO-NNN |

### 7.2 Separación Codificación vs Visibilidad

| Aspecto | Campo | Ejemplo |
|---------|-------|---------|
| **Codificación** (único) | `proceso` (FK a Area) | `POL-DIR-001` — el proceso que genera el código |
| **Visibilidad** (múltiple) | `areas_aplicacion` (JSON array) | `["SST","GCA","GAM","GTH"]` — qué procesos pueden consultar |
| **Distribución** (quién lee) | `cargos_distribucion` + `aplica_a_todos` | Cargos que reciben lectura obligatoria |
| **Seguridad** (quién accede) | `clasificacion` + `usuarios_autorizados` | Si es CONFIDENCIAL, solo estos usuarios |

### 7.3 Niveles en TipoDocumento

| Campo | Choices | Uso |
|-------|---------|-----|
| `nivel_documento` | ESTRATEGICO, TACTICO, OPERATIVO, SOPORTE | Define jerarquía documental. Herencia: `documento.tipo_documento.nivel_documento` |
| `categoria` | DOCUMENTO, FORMULARIO | DOCUMENTO = flujo firma normativo. FORMULARIO = form builder operacional |
| `nivel_seguridad_firma` | 1 (manuscrita), 2 (+TOTP), 3 (+TOTP+OTP) | Nivel de seguridad de firma digital |

### 7.4 BRECHA DE SEGURIDAD — Sin Permission Check

**Estado actual:** No hay middleware ni mixin que verifique clasificación. Cualquier usuario autenticado del tenant puede ver CUALQUIER documento, incluyendo RESTRINGIDO. Los endpoints `GET /documentos/{id}/`, `GET /export/documento/{id}/pdf/`, `POST /subir-anexo/` NO validan.

**Excepción:** `services_drive.py` sí excluye CONFIDENCIAL/RESTRINGIDO de exportaciones a Drive y verifica `usuarios_autorizados`.

**Solución (Sprint 1):** Crear `DocumentoAccessMixin` que valide: si `documento.clasificacion in ['CONFIDENCIAL', 'RESTRINGIDO']`, verificar que `request.user` esté en `documento.usuarios_autorizados.all()` o que `request.user.cargo` esté en `documento.cargos_distribucion.all()`. Retornar 403 si no cumple.

---

## 8. Tabla de Retención Documental (TRD)

### 8.1 Estado Actual

Solo existe `tiempo_retencion_años` (IntegerField) en TipoDocumento. Y en ControlDocumental: `fecha_retiro`, `motivo_retiro`, `fecha_destruccion`, `metodo_destruccion`, `responsable_destruccion`, `acta_destruccion` (FileField).

### 8.2 Modelo Propuesto: TablaRetencionDocumental

| Campo | Tipo | Descripción |
|-------|------|-------------|
| tipo_documento | FK → TipoDocumento | Tipo documental (PR, POL, FT, etc.) |
| proceso | FK → Area | Proceso SGI al que aplica |
| serie_documental | CharField | Serie según normativa AGN (ej: 'Actas de COPASST') |
| tiempo_gestion_anos | IntegerField | Años en archivo de gestión (acceso frecuente) |
| tiempo_central_anos | IntegerField | Años en archivo central (consulta esporádica) |
| disposicion_final | CharField choices | ELIMINAR, CONSERVAR_PERMANENTE, SELECCIONAR, DIGITALIZAR |
| soporte_legal | TextField | Normativa que justifica (ej: Dto 1072/2015) |
| requiere_acta_destruccion | BooleanField | Si la eliminación requiere acta formal |
| activo | BooleanField | Si esta regla está vigente |

`unique_together: (tipo_documento, proceso)` — Una regla por combinación tipo+proceso por tenant.

Celery beat task semanal: revisa documentos que cumplieron retención, genera notificación al Admin SGI.

Seed pragmático: solo combinaciones tipo×proceso activas del tenant, no todas las combinaciones posibles.

---

## 9. Integración BPM → Gestor Documental

El módulo BPM (`workflow_engine.disenador_flujos`) genera procedimientos automáticamente:

1. El diseñador BPM crea/actualiza un flujo BPMN 2.0.
2. BPM llama a `DocumentoService.crear_desde_modulo()` pasando contenido, tipo='PR', proceso=Area del flujo, `workflow_asociado_id`.
3. Se crea Documento con `estado=BORRADOR`, `es_auto_generado=True`.
4. El documento entra al ciclo normal: revisión → aprobación → publicación → distribución.
5. Si el flujo BPM se modifica, se genera nueva versión del procedimiento.

### 9.1 Documentos Reemplazados por Automatización

Algunos procedimientos serán reemplazados por funcionalidades del sistema:

- Procedimiento de Control de Documentos → Reemplazado por el propio Gestor Documental
- Procedimiento de Control de Registros → Reemplazado por Form Builder + Archivo
- Procedimiento de Acciones Correctivas → Parcialmente automatizado por módulo AC/AP (futuro)
- Procedimiento de Auditoría Interna → Parcialmente automatizado por módulo Auditorías (futuro)

---

## 10. Formularios con Firma Secuencial

### 10.1 Caso de Uso

Los formularios operativos (FT, AC, RG) requieren campos de firma embebidos. Ejemplo: permiso de trabajo en alturas donde firman el solicitante, el supervisor, el rescatista y el coordinador, cada uno en orden secuencial.

### 10.2 Campo FIRMA_WORKFLOW (Tipo #17)

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| tipo_campo | = FIRMA_WORKFLOW | Nuevo tipo #17 en CampoFormulario |
| config_firmantes | JSONField | `[{orden: 1, cargo_id: X, etiqueta: 'Solicitante'}, ...]` |
| modo_firma | CharField choices | SECUENCIAL, PARALELO, MIXTO |
| nivel_seguridad | IntegerField 1-3 | Hereda de TipoDocumento o configurable por campo |

### 10.3 Flujo

1. Usuario abre el formulario (ej: FT-SST-012 Permiso de Alturas).
2. Llena campos operativos (fecha, ubicación, equipo, riesgos, controles).
3. Al llegar al campo FIRMA_WORKFLOW, se crean instancias FirmaDigital via GenericForeignKey (mismo motor de workflow_engine).
4. Primer firmante ve su campo activo. Los demás ven campo bloqueado con indicador de turno.
5. Cada firmante usa SignatureModal. Backend valida `es_mi_turno`.
6. Al completar todas las firmas, formulario se marca COMPLETADO y genera PDF con firmas embebidas.
7. Si es archivable, el PDF se deposita via `DocumentoService.archivar_registro()`.

### 10.4 Diferencia con Firma Normativa

| Aspecto | Firma Normativa (docs SGI) | Firma en Formulario (registros) |
|---------|---------------------------|-------------------------------|
| ¿Quién firma? | ELABORÓ/REVISÓ/APROBÓ (roles fijos) | Configurado por formulario |
| ¿Cuándo? | Después de elaborar el documento | Durante el llenado en campo |
| ¿Dónde vive? | FirmaDigital → Documento | FirmaDigital → registro formulario |
| Motor | workflow_engine.firma_digital | workflow_engine.firma_digital (mismo) |
| Resultado | Documento APROBADO → PUBLICADO | Formulario COMPLETADO → PDF archivado |

---

## 11. Patrón de Actas: Módulos C2 Consumiendo GD

### 11.1 Ejemplo: Acta de COPASST (HSEQ)

1. HSEQ programa reunión de COPASST (Celery scheduled task).
2. Celery notifica participantes vía centro_notificaciones.
3. Se ejecuta la reunión. HSEQ genera acta con temas, compromisos, asistentes.
4. HSEQ llama a `DocumentoService.crear_desde_modulo()` con contenido del acta, tipo='AC', proceso='SST', participantes como firmantes.
5. GD crea Documento BORRADOR, configura FirmaDigital para cada participante.
6. Participantes firman desde Mi Portal.
7. Completadas las firmas: APROBADO → PUBLICADO → distribuido → archivado.

### 11.2 API Pública para Módulos C2

| Método | Uso |
|--------|-----|
| `DocumentoService.crear_desde_modulo()` | Documento con ciclo de firmas completo. Para actas, procedimientos BPM. |
| `DocumentoService.archivar_registro()` | PDF ya completado directo a ARCHIVADO. Para evidencias, inspecciones. Sin firmas. |

**Regla:** HSEQ (C2) importa de gestion_documental (CT). Nunca al revés. GD no sabe nada de COPASST.

### 11.3 Módulos que Consumirán

| Módulo C2 | Qué genera | Método GD | Tipo Doc |
|-----------|-----------|-----------|----------|
| HSEQ | Actas COPASST, investigaciones AT | crear_desde_modulo / archivar_registro | AC / RG |
| Talento Humano | Evaluaciones, encuestas, contratos | archivar_registro | RG |
| PESV | Inspecciones vehiculares, profesiogramas | archivar_registro | RG |
| BPM | Procedimientos auto-generados | crear_desde_modulo | PR |
| Auditorías | Informes de auditoría, planes AC | crear_desde_modulo | RG / AC |

---

## 12. Generación de PDF — Layout Estandarizado

### 12.1 Motor Actual

**WeasyPrint** (`exporters/pdf_generator.py`, 598 líneas). Genera HTML con CSS inline y compila a PDF. Plantilla construida en Python, no en archivo `.html` separado.

Prioridad de servicio: (1) `archivo_pdf` en disco → servir directo, (2) doc externo → servir original, (3) fallback → generar con WeasyPrint.

### 12.2 Layout Estándar del PDF

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

### 12.3 Datos de Fundación del Tenant

El PDF consume los datos de Fundación (configuración del tenant): logo (Base64), nombre de la empresa, NIT. Estos se inyectan en el header del PDF y en la estampa X.509. Colores del branding del tenant se aplican al layout.

### 12.4 Marcas de Agua por Estado

| Estado | Texto | Color |
|--------|-------|-------|
| BORRADOR | "BORRADOR — Documento no aprobado" | Gris claro rgba(200,200,200,0.25) |
| EN_REVISION | "EN REVISIÓN — Pendiente de aprobación" | Gris claro |
| PUBLICADO | "COPIA CONTROLADA" + fecha + usuario descarga | Gris claro |
| **OBSOLETO** | **"OBSOLETO — Documento fuera de vigencia"** | **Rojo rgba(220,50,50,0.20)** |

### 12.5 Firmas en el PDF

Cada firma muestra: imagen del trazo (canvas data:image/png;base64), línea separadora, nombre completo, cargo, fecha de firma, hash SHA-256 truncado a 16 caracteres. Estados: FIRMADO = imagen + datos, PENDIENTE = línea vacía + "Pendiente de firma", RECHAZADO = estado rojo + comentario.

### 12.6 Sellado X.509

**Doble:** Estampa visible en página 1 (esquina inferior izquierda) con texto "DOCUMENTO CONTROLADO" + código + versión + empresa + fecha. Y firma digital invisible (metadata PDF) con pyHanko + certificado del tenant.

### 12.7 Brechas Identificadas

1. **No hay renderizador JSON→PDF para formularios.** Si un documento tiene `datos_formulario` (Form Builder) pero no `contenido` HTML, el PDF sale vacío. **Falta:** `_renderizar_datos_formulario()` que convierta JSON a HTML tabular antes de WeasyPrint.

2. **No hay templates por TipoDocumento.** Las actas necesitan lista de asistentes, los formatos necesitan tabla de campos. **Propuesta:** Sistema de templates HTML por `TipoDocumento.codigo` con fallback al layout genérico.

3. **Listado maestro PDF no implementado.** El endpoint acepta `formato=pdf` pero solo retorna JSON. **Falta:** Layout PDF dedicado con tabla de documentos agrupados por tipo.

### 12.8 Propuesta: Secciones PDF por Tipo (Diccionario Inline)

Se mantiene el generador actual inline en Python. Se agrega un diccionario `SECCIONES_POR_TIPO` que define qué secciones renderizar y en qué orden según `TipoDocumento.codigo`:

| TipoDocumento | Secciones Renderizadas |
|---------------|----------------------|
| PR, IN, GU | objetivo → alcance → definiciones → contenido → firmas |
| AC | datos_reunion → asistentes → temas → compromisos → firmas_participantes |
| FT, RG | datos_formulario (JSON→HTML tabular) → firmas |
| POL, MA, RE | contenido → firmas (layout estándar) |
| PG, PL | cronograma → responsables → contenido → firmas |
| KB | contenido → tags (sin firmas) |

Cada sección tiene su método `_renderizar_seccion_X()` dentro de `DocumentoPDFGenerator`. Todos heredan el layout base (header, footer, watermark, estampa X.509). Fallback a `['contenido', 'firmas']` si el tipo no tiene mapeo específico.

---

## 13. Design System y Estándares de UI

### 13.1 Stack Visual

| Tecnología | Detalle |
|-----------|---------|
| CSS Framework | Tailwind CSS 3.4 (utility-first). Custom puro, sin MUI/Chakra/shadcn. |
| Iconos | Lucide React. NUNCA emojis en UI de producción. |
| Tipografía | Inter (body) + Montserrat (headings). Google Fonts. |
| Dark Mode | Class-based. Toggle en sidebar. |
| Colores | CSS variables dinámicas por tenant (branding). |
| Utilidades | `cn()` = clsx + twMerge. |

### 13.2 Sistema de 3 Capas de Color

**Capa 1 — Branding del Tenant (dinámico):** `useBrandingConfig()` lee colores de BD (tabla Branding), `useDynamicTheme()` genera 11 variantes (50→950), inyecta como CSS vars `--color-primary-500`. Tailwind consume: `bg-primary-600`, `text-primary-700`.

**MEJORA:** Secondary también debe ser dinámico. Agregar `secondary_color` al modelo Branding. Generar `--color-secondary-50` hasta `--color-secondary-950`.

**Capa 2 — Color por Módulo:** `useModuleColor('gestion_documental')` → 'indigo'. Se pasa como prop `moduleColor` a StatsGrid, DynamicSections, ViewToggle.

**Capa 3 — Estados Fijos (no cambian):**

| Estado | Color | Uso en GD |
|--------|-------|-----------|
| success (verde) | bg-green-100 text-green-800 | Publicado, Aprobado, Firmado, Lectura completada |
| warning (amarillo) | bg-yellow-100 text-yellow-800 | En Revisión, Pendiente firma, Próximo a vencer |
| danger (rojo) | bg-red-100 text-red-800 | Obsoleto, Rechazado, Vencido, Error OCR |
| info (azul) | bg-blue-100 text-blue-800 | Borrador, En proceso, Informativo |
| gray (neutro) | bg-gray-100 text-gray-800 | Fondos, bordes, texto secundario, Archivado |

### 13.3 Reglas Inviolables

- SIEMPRE `bg-primary-600` (dinámico). NUNCA `bg-pink-600` ni `bg-[#ec268f]`.
- SIEMPRE `variant="success"` en Badge. NUNCA `className="bg-green-100"` directo.
- SIEMPRE pasar `moduleColor` como prop.
- SIEMPRE Lucide React. NUNCA emojis.
- SIEMPRE modales en la PÁGINA, no en la sección.
- NUNCA duplicar niveles: Sidebar = módulos, DynamicSections = secciones, PageTabs = sub-tabs.
- Charts: ÚNICA excepción de colores hardcodeados.

### 13.4 Componentes Clave

| Componente | Carpeta | Uso en GD |
|-----------|---------|-----------|
| Button | common/ | Acciones (Crear, Firmar, Publicar). Variantes: primary, secondary, danger, ghost. |
| Badge | common/ | Estados de documento. Variantes: success, warning, danger, info, gray. |
| Card | common/ | Vista cards del repositorio. |
| StatsGrid | layout/ | Métricas del dashboard. Props: stats[], moduleColor, columns, variant. |
| ViewToggle | common/ | Toggle cards/lista. |
| BaseModal | modals/ | Sizes: xs, sm, md, lg, xl, full. |
| FormModal | modals/ | Hereda BaseModal + submit/loading. |
| DynamicSections | layout/ | Tabs principales. |
| PageTabs | layout/ | Sub-tabs dentro de sección. |
| ExportButton | common/ | Export PDF/Excel. |
| ConfirmDialog | common/ | Confirmación destructiva. |
| EmptyState | common/ | Estado vacío con guía. |

---

## 14. UX/UI — Principios Anti-Fatiga

El usuario típico es personal administrativo no técnico. El principal riesgo es la cantidad de clicks para llegar a un documento.

### 14.1 Máximo 2 Clicks al Documento

| Tarea Frecuente | Flujo Ideal (2 clicks) | Flujo a Evitar (4+) |
|----------------|----------------------|---------------------|
| Consultar procedimiento | Repositorio → click card = abre PDF | Repositorio → filtrar → buscar → click → modal → tab contenido |
| Firmar documento | Mi Portal badge → Firmar = SignatureModal | GD → En Proceso → sub-tab → buscar → click → Firmar |
| Confirmar lectura | Mi Portal notificación → Leer + Aceptar | GD → En Proceso → buscar → abrir → leer → scroll → aceptar |

### 14.2 Revelación Progresiva por Rol

| Rol | Ve por defecto | Accede si lo necesita |
|-----|---------------|----------------------|
| Operario/Auxiliar | Mi Portal: lecturas y firmas pendientes. Solo docs de su proceso. | Nada más. No ve Configuración, Dashboard ni Archivo. |
| Líder de Proceso | Repositorio filtrado a su proceso. En Proceso. Dashboard de su proceso. | Archivo para histórico. No ve Configuración global. |
| Admin SGI / Consultor | Todo: Repositorio global, Dashboard, Configuración, Archivo completo. | Biblioteca Maestra, exportaciones avanzadas. |

### 14.3 Acción Directa desde Cards

- Card Repositorio: botón 'Ver PDF' directo (abre DocumentoReaderModal sin pasar por DetailModal). Botón secundario 'Detalle' para metadatos.
- Card firma pendiente: botón 'Firmar' directo si `es_mi_turno=true`. Badge: 'Tu turno' verde o 'Esperando a X' gris.
- Card lectura Mi Portal: botón 'Leer ahora' directo. Barra de progreso del % leído.
- NUNCA modal intermedio para la acción principal.

### 14.4 Búsqueda Inteligente como Atajo

- Input grande y centrado en Repositorio.
- Búsqueda instantánea (debounce 300ms) sobre código + título + texto OCR.
- Filtros avanzados colapsados por defecto (accordion). Chips de filtros activos.
- Ctrl+K abre búsqueda global desde cualquier tab.

### 14.5 Feedback Visual Inmediato

- Al firmar: checkmark animado + badge cambia a 'Firmado' (optimistic update, rollback si falla).
- Al aceptar lectura: barra 100% + toast + card fade-out de pendientes.
- Al publicar: confetti sutil o checkmark (es un logro).
- Carga: skeleton loaders en cards, nunca spinner bloqueante.

### 14.6 Zero-Config para Usuario Básico

- Tipo documental define automáticamente: firma, plantilla, firmantes, retención, codificación.
- Area del usuario filtra repositorio a "mis documentos".
- Notificaciones llegan solas a Mi Portal.
- Distribución por cargo asigna lecturas automáticamente.

### 14.7 Anti-Patrones a Evitar

| Anti-patrón | Alternativa |
|------------|-------------|
| Modal dentro de modal (3 niveles) | Máximo 2 niveles. Firmar desde card directamente. |
| Formulario con 15+ campos visibles | Wizard 3 pasos: Tipo+Proceso / Contenido / Firmantes. |
| Tabla con 10+ columnas | Card view default. Lista con max 6 columnas. |
| Filtros siempre visibles (200px alto) | Buscador prominente + filtros colapsados + chips. |
| Confirmación para cada acción | ConfirmDialog solo para destructivas. Guardar borrador sin confirmación. |
| Toast para cada micro-acción | Toast solo para acciones completadas. No para guardar borrador. |
| Página vacía sin guía | EmptyState con icono + mensaje + acción sugerida. |

---

## 15. Modelos Nuevos y Modificaciones

### 15.1 Modificaciones al Modelo Documento

| Campo Nuevo | Tipo | Propósito |
|------------|------|-----------|
| proceso | FK → organizacion.Area | Proceso principal para codificación TIPO-PROCESO-NNN |
| modulo_origen | CharField(50, null) | Para registros archivados: 'hseq', 'talento_humano', 'pesv' |
| referencia_origen_type | FK → ContentType, null | GenericForeignKey parte 1 — trazabilidad al objeto original |
| referencia_origen_id | PositiveIntegerField, null | GenericForeignKey parte 2 |
| es_reemplazo_automatizado | BooleanField default=False | Procedimiento reemplazado por funcionalidad del sistema |
| funcionalidad_reemplazo | CharField, null | Referencia a qué módulo/función lo reemplaza |

### 15.2 Modificaciones a AceptacionDocumental

| Campo Nuevo | Tipo | Propósito |
|------------|------|-----------|
| version_documento | FK → VersionDocumento, null | Versión específica que se acepta |
| invalidada | BooleanField default=False | True cuando se publica nueva versión |

### 15.3 Nuevo: TablaRetencionDocumental

Ver sección 8.2.

### 15.4 Modificación: ConsecutivoConfig

Agregar campo `proceso` (FK a Area, nullable). `unique_together` cambia a `(codigo, proceso, tenant)`.

### 15.5 Nuevo: Campo FIRMA_WORKFLOW en CampoFormulario

Ver sección 10.2. Tipo #17 con `config_firmantes`, `modo_firma`, `nivel_seguridad`.

### 15.6 Deprecaciones

- `puestos_aplicacion` (JSONField) — campo muerto, sin uso en frontend ni backend.
- `areas_aplicacion` como fuente de codificación — se mantiene para visibilidad pero no genera código.

---

## 16. Roadmap Detallado

### Sprint 1 — Seguridad + Funcional Crítico

**Objetivo:** Cerrar brechas de seguridad y funcionalidad básica.

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 1.1 | Crear `DocumentoAccessMixin`: validar `clasificacion` + `usuarios_autorizados` en export PDF, verificar-sellado, subir-anexo | Backend | Permission mixin | 403 si usuario no autorizado accede a doc CONFIDENCIAL/RESTRINGIDO |
| 1.2 | Resetear AceptacionDocumental al publicar nueva versión: invalidar anteriores, crear nuevas, notificar | Backend | Migration + Service | Al publicar v2, acuses de v1 quedan invalidados; nuevos creados |
| 1.3 | Agregar campos `version_documento` (FK) e `invalidada` (Bool) a AceptacionDocumental | Backend | Migration | Campo FK funcional, `mis-pendientes` excluye invalidadas |
| 1.4 | Celery beat task semanal: notificar docs próximos a vencer (30 días) | Backend | Task + TipoNotificacion seed | Notificación creada sin duplicados |
| 1.5 | Badge 'Próximo a vencer' en cards del Repositorio y Dashboard | Frontend | Badge warning | Docs con `fecha_proxima_revision` < 30 días muestran badge amarillo |

### Sprint 2 — Codificación + TRD + FK Proceso

**Objetivo:** SGI certificable ISO con codificación estándar.

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 2.1 | Agregar campo `proceso` (FK a Area) en Documento | Backend | Migration | FK funcional, nullable para datos existentes |
| 2.2 | Script migración: inferir proceso de `areas_aplicacion` JSON → asignar FK | Backend | Management command | 100% docs con proceso asignado o null explícito |
| 2.3 | Modificar ConsecutivoConfig: campo proceso FK, unique (codigo, proceso, tenant) | Backend | Migration + Model | Consecutivos por tipo+proceso con select_for_update |
| 2.4 | Refactorizar `generar_codigo()`: eliminar 3 fallbacks, formato TIPO-PROCESO-NNN | Backend | Service refactor | Nuevos docs generan PR-SST-001; thread-safe |
| 2.5 | Migración dura de códigos existentes al formato nuevo | Backend | Management command | Todos los documentos con código TIPO-PROCESO-NNN |
| 2.6 | Deprecar `puestos_aplicacion`, marcar `areas_aplicacion` como no-codificación | Backend | Serializer update | API documenta deprecación |
| 2.7 | Crear modelo TablaRetencionDocumental + serializer + viewset + seed pragmático | Backend | Model + CRUD | TRD funcional con seed de combinaciones activas |
| 2.8 | Selector de Proceso en DocumentoFormModal (Select con Area.code) | Frontend | Form field | Al crear, usuario selecciona proceso; código se pre-visualiza |
| 2.9 | Filtro por proceso en Repositorio | Frontend | Filter component | Filtrar repositorio por proceso funciona |
| 2.10 | Tab TRD en Configuración | Frontend | Section component | Admin puede ver/editar TRD por tipo+proceso |

### Sprint 3 — Integración C2 + Archivo

**Objetivo:** El Gestor Documental como notario.

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 3.1 | Campos nuevos en Documento: modulo_origen, referencia_origen (GenericFK) | Backend | Migration | GenericFK funcional |
| 3.2 | `DocumentoService.archivar_registro()` | Backend | Service method | C2 puede crear registro archivado con código automático |
| 3.3 | `DocumentoService.crear_desde_modulo()` | Backend | Service method | C2 puede crear doc con ciclo de firmas completo |
| 3.4 | Sub-tab 'Registros Archivados' en ArchivoSection | Frontend | PageTab + list | Filtros por módulo origen, proceso, fechas |
| 3.5 | Comparación de versiones UI (diff side-by-side) | Frontend | Diff component | Usuario ve qué cambió entre versiones |
| 3.6 | Dashboard: widget 'Registros por módulo' | Frontend | Chart component | Dashboard muestra registros por módulo origen |

### Sprint 4 — Form Builder + Firma en Formularios + UX

**Objetivo:** Eliminar papel. Formularios con firma secuencial.

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 4.1 | Tipo #17 FIRMA_WORKFLOW en CampoFormulario | Backend | Model + Migration | Campo configurable con firmantes ordenados |
| 4.2 | Renderizar FIRMA_WORKFLOW en DynamicFormRenderer | Frontend | Form field component | Firmantes visibles, solo el de turno tiene botón activo |
| 4.3 | Integrar SignatureModal con FIRMA_WORKFLOW via GenericFK | Ambos | Integration | Firma guarda en FirmaDigital, actualiza estado |
| 4.4 | Condiciones de visibilidad en DynamicFormRenderer | Frontend | Renderer logic | Campo se muestra/oculta según valor del campo referenciado |
| 4.5 | Fórmulas de cálculo para campos calculados | Frontend | Renderer logic | Campo calculado se actualiza en tiempo real |
| 4.6 | Búsqueda global Ctrl+K con debounce | Frontend | Search component | Búsqueda instantánea desde cualquier tab |
| 4.7 | Filtros colapsados + chips de filtros activos | Frontend | Filter UX | Filtros ocultos, buscador prominente, chips visibles |
| 4.8 | Acción directa desde cards: 'Ver PDF' y 'Firmar' sin modal intermedio | Frontend | Card actions | Click directo abre reader/SignatureModal |
| 4.9 | Wizard de creación 3 pasos (Tipo+Proceso / Contenido / Firmantes) | Frontend | Wizard component | FormModal de 423 líneas reemplazado por 3 pasos |
| 4.10 | Verificación de sellado X.509 en UI | Frontend | Button + feedback | Click muestra resultado de verificación |

### Sprint 5 — PDF Templates + Design System

**Objetivo:** PDF estandarizado por tipo. Consistencia visual.

| # | Tarea | Capa | Entregable | Criterio de Aceptación |
|---|-------|------|-----------|----------------------|
| 5.1 | `_renderizar_datos_formulario()`: JSON Form Builder → HTML tabular | Backend | Generator method | Formularios generan PDF con datos renderizados |
| 5.2 | Sistema de templates PDF por TipoDocumento.codigo | Backend | Template system | Actas con asistentes, formatos con tabla, procedimientos con objetivo/alcance |
| 5.3 | Listado maestro PDF con layout dedicado | Backend | PDF generator | Export PDF funcional agrupado por tipo |
| 5.4 | Secondary color dinámico: campo en Branding + useDynamicTheme | Ambos | Model + Hook + Config | Tenant cambia secondary y UI refleja |
| 5.5 | Auditoría colores hardcodeados: reemplazar por secondary | Frontend | Refactor | Cero hex inline en GD |
| 5.6 | Optimistic updates en firmas y aceptación de lectura | Frontend | TanStack mutations | Feedback en <200ms con rollback |
| 5.7 | Skeleton loaders en todas las vistas | Frontend | Skeleton components | Carga sin spinners bloqueantes |
| 5.8 | EmptyState personalizado por sección | Frontend | EmptyState configs | Cada tab vacío muestra guía contextual |
| 5.9 | Revelación progresiva: ocultar tabs por rol | Frontend | Permission check | Operario solo ve Repositorio + En Proceso + Dashboard |

### Sprint 6 — Futuro (Post-MVP)

| # | Tarea | Prioridad | Dependencia |
|---|-------|-----------|------------|
| 6.1 | Sincronización Biblioteca Maestra entre tenants | Baja | Sprint 2 + Sandbox |
| 6.2 | Búsqueda full-text con PostgreSQL tsvector | Media | Sprint 4.6 |
| 6.3 | OCR avanzado: clasificación automática por contenido | Baja | Sprint 2 |
| 6.4 | Generación automática procedimientos desde BPM (flujo completo) | Media | Sprint 3.3 |
| 6.5 | Dashboard BI avanzado (app analytics L50) | Baja | Sprint 3.6 |
| 6.6 | Mobile-responsive: visor PDF y firma desde móvil | Alta | Sprint 4 |
| 6.7 | Workflow revisión programada automática (doc vence → borrador v2) | Media | Sprint 1.4 + Sprint 2 |

---

## 17. Instrucciones para Claude Code

### 17.1 Contexto General (copiar al inicio de cada sesión)

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
El campo de clasificación se llama "clasificacion" (no "clasificacion_acceso").
areas_aplicacion (JSONField) se mantiene para visibilidad. proceso (FK Area) se usa para codificación.
puestos_aplicacion está deprecado.
lectura_obligatoria tiene lógica completa con signal post_save de User.
codigo es unique_together con empresa_id, max_length=50, con index.
```

### 17.2 Sprint 1 — Instrucciones

**Tarea 1.1:** Crear `DocumentoAccessMixin` en `gestion_documental/mixins.py`. Método `check_documento_access(self, request, documento)`: si `documento.clasificacion in ['CONFIDENCIAL', 'RESTRINGIDO']`, verificar `request.user in documento.usuarios_autorizados.all()` o `request.user.cargo in documento.cargos_distribucion.all()`. Si no cumple, `raise PermissionDenied('No tiene permiso')`. Aplicar en: `DocumentoExportView`, endpoints de verificar-sellado y subir-anexo.

**Tarea 1.2-1.3:** Paso 1: Agregar a AceptacionDocumental: `version_documento = FK(VersionDocumento, null=True)`, `invalidada = BooleanField(default=False)`. Migración. Paso 2: En `DocumentoService.publicar()`, después de cambiar estado: `AceptacionDocumental.objects.filter(documento=doc, invalidada=False).update(invalidada=True)`, crear nuevas con `version_documento=version_actual`, notificar. Paso 3: En `mis-pendientes`, filtrar `.filter(invalidada=False)`.

**Tarea 1.4-1.5:** Crear `tasks.py` con `verificar_documentos_proximos_a_vencer()`. Celery beat crontab domingo 6am. Lógica: `Documento.objects.filter(estado='PUBLICADO', fecha_proxima_revision__lte=now()+timedelta(days=30), fecha_proxima_revision__gte=now())`. Verificar no duplicar Notificacion. Frontend: Badge `variant="warning"` text="Vence pronto" si `fecha_proxima_revision` < 30 días.

### 17.3 Sprint 2 — Instrucciones

**Tarea 2.1-2.5:** Orden exacto: (1) `proceso = ForeignKey('organizacion.Area', null=True, on_delete=PROTECT)`. Makemigrations. (2) Management command `migrar_procesos.py`: parsear `areas_aplicacion[0]`, buscar Area, asignar FK. (3) ConsecutivoConfig: agregar `proceso = FK(Area, null=True)`, unique `(codigo, proceso)`. (4) `generar_codigo()`: buscar/crear ConsecutivoConfig con tipo+proceso, `select_for_update()`, retornar `'{tipo.codigo}-{proceso.code}-{str(n).zfill(3)}'`. (5) Management command `migrar_codigos.py`: para cada documento, recalcular código con nuevo formato, update. Verificar unique constraint.

**Tarea 2.7:** Modelo TablaRetencionDocumental en `models.py`. Campos exactos de sección 8.2. Serializer con `ModelSerializer`. ViewSet con `ModelViewSet`. Seed: management command que crea registros solo para combinaciones tipo×proceso que ya tienen documentos.

### 17.4 Sprint 4 — Instrucciones UX

**Tarea 4.8:** En DocumentosSection, card de documento: botón primario 'Ver PDF' (icono FileText de Lucide, `onClick={() => onViewPdf(doc.id)}`) sin DetailModal. Botón ghost 'Detalle' (icono Info) para DetailModal. En EnProcesoSection, sub-tab Firmas: botón 'Firmar' (icono PenTool, `disabled={!firma.es_mi_turno}`) abre SignatureModal directo. Badge: `es_mi_turno ? variant="success" text="Tu turno" : variant="gray" text={"Esperando a " + firma.siguiente_firmante}`.

**Tarea 4.9:** Wizard 3 pasos en FormModal size="lg": Paso 1 (Clasificación): Select TipoDocumento + Select Proceso (Area). Preview código generado. Paso 2 (Contenido): Editor o DynamicFormRenderer según categoría. Paso 3 (Revisión): Resumen + AsignarFirmantesModal + distribución. 'Guardar borrador' desde paso 1. 'Guardar y enviar a revisión' solo paso 3.

### 17.5 Sprint 5 — Instrucciones PDF

**Tarea 5.1:** En `pdf_generator.py`, agregar método `_renderizar_datos_formulario(datos_formulario, campos_config)`: iterar campos del Form Builder, generar HTML tabular `<table>` con label-valor. Manejar los 16 tipos de campo incluyendo TABLA (sub-tabla), SIGNATURE (imagen base64), SECCION (header). Inyectar antes del bloque de firmas.

**Tarea 5.2:** En `pdf_generator.py`, crear diccionario `SECCIONES_POR_TIPO` que mapee `TipoDocumento.codigo` a lista de secciones ordenadas (ej: `'PR': ['objetivo', 'alcance', 'definiciones', 'contenido', 'firmas']`, `'AC': ['datos_reunion', 'asistentes', 'temas', 'compromisos', 'firmas']`, `'FT': ['datos_formulario_renderizado', 'firmas']`, `'default': ['contenido', 'firmas']`). Crear un método `_renderizar_seccion_X()` por cada sección. El método principal `generar_html()` consulta el tipo del documento, obtiene la lista de secciones, y llama cada renderizador en orden. Mantener todo inline en Python (compatible con el generador actual de 598 líneas). NO crear archivos de template Django separados.

---

*Documento técnico de referencia — StrateKaz Consultoría 4.0*
*Este documento se actualiza con cada sprint completado.*
