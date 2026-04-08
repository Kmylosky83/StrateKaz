---
name: Gestión Documental — Arquitectura y Decisiones
description: Capa CT CERRADA. Sprints 1-11 completados. 8 modelos, 203 campos, 21 migraciones, 55+ endpoints. Camino B, Design System PDF 99.5%, TRD 33 reglas, estado ELIMINADO. CI GREEN.
type: project
---

## Decisión Arquitectónica Central (v5 — Dos Roles)

**Rol 1 — Creador/Controlador** `[LIVE]`: Documentos normativos con ciclo de firmas
- POL, MA, PL, RE, PR, GU, PG, IN (categoria=DOCUMENTO)
- Ciclo: BORRADOR→EN_REVISION→APROBADO→PUBLICADO→OBSOLETO→ARCHIVADO

**Rol 2 — Notario/Archivo** `[LIVE Sprint 3]`: Registros operacionales de otros módulos
- FT, AC, RG, KB (categoria=FORMULARIO)
- `DocumentoService.archivar_registro()` → estado=ARCHIVADO sin firmas
- `DocumentoService.crear_desde_modulo()` → estado=BORRADOR con FirmaDigital
- GenericFK: modulo_origen + referencia_origen para trazabilidad

**Registros operacionales** → se depositan desde módulos C2 (L30+):
- Inspecciones SST → HSEQ Management
- Facturas, cotizaciones → Contabilidad / Admin Finance
- Recibos de nómina → Talent Hub
- Registros de proveedores → Supply Chain

**En L15 (current state):** Todo va a Gestión Documental filtrado por proceso/área como workaround temporal. Cuando se activen L30+, los registros operacionales migrarán a sus módulos.

**Why:** Evitar mezclar documentos normativos (versionados, controlados, con flujo aprobación) con registros operacionales (fill-in forms, sin versión, contexto de módulo específico).

---

## 3 Caminos de Creación de Documentos (2026-04-03 p4)

| Camino | Nombre | Tab origen | Descripción |
|--------|--------|-----------|-------------|
| A | Crear | Repositorio | Crear con editor (con/sin plantilla), flujo completo hasta PUBLICADO |
| B | Ingestar → Digitalizar | Repositorio | Subir PDF externo, OCR extrae texto, editar contenido, flujo normal |
| C | Ingestar → Registrar | Archivo (futuro) | Subir PDF externo directo a Archivo, sin flujo — solo clasificar |

### Campos clave por camino
- `archivo_original`: PDF subido (inmutable, trazabilidad) — Caminos B y C
- `texto_extraido`: Salida OCR (pdfplumber → tesseract fallback) — Camino B
- `contenido`: HTML editable (editor TipTap) — Caminos A y B
- `archivo_pdf`: PDF generado por WeasyPrint al publicar — Camino A y B
- `es_externo`: Boolean, true para Caminos B y C

### Propiedad de tabs por estado
- **Repositorio**: BORRADOR (fábrica de documentos)
- **En Proceso**: EN_REVISION, APROBADO (workflow, aprobación, firma)
- **Archivo**: PUBLICADO, OBSOLETO, ARCHIVADO (bodega de documentos)

---

## OCR — Pipeline de Extracción (2026-04-03 p4)

- **Two-tier**: pdfplumber (PDFs digitales) → tesseract fallback (PDFs escaneados)
- `MIN_TEXT_PER_PAGE = 50` chars umbral
- Tarea Celery: `procesar_ocr_documento` → llena `texto_extraido`, `ocr_estado`, `ocr_metadatos`
- **Docker**: `pdfplumber==0.11.4` instalado manualmente en backend + celery containers
- **Dockerfile**: `tesseract-ocr` + `tesseract-ocr-spa` + `poppler-utils` en stage production
- **"Usar texto OCR"**: Botón en modal edición convierte texto_extraido a HTML y carga en editor

---

## Roles de Firma — ISO 7.5 (3 roles)

**Solo 3 roles** (reducidos de 5, sesión 2026-04-03 p4):
- **ELABORO** (Elaboró) — quien crea/redacta
- **REVISO** (Revisó) — quien revisa contenido
- **APROBO** (Aprobó) — quien aprueba formalmente

**Eliminados:** VALIDO, AUTORIZO — no son estándar ISO 7.5.
**Archivos modificados:** `ROL_FIRMA_CHOICES` (firma_digital/models.py), serializers (3 archivos), pdf_generator.py, seed_workflows.py, types TS, AsignarFirmantesModal, FirmantesEditor, useWorkflowFirmas.
**Migración:** `firma_digital/0008_reduce_rol_firma_choices`

---

## RBAC — Section Codes reales

| ViewSet | section_code | Acceso |
|---------|-------------|--------|
| TipoDocumentoViewSet | `configuracion` | Configurar tipos y plantillas |
| PlantillaDocumentoViewSet | `configuracion` | Gestionar plantillas |
| CampoFormularioViewSet | `configuracion` | Campos de formulario |
| DocumentoViewSet | `repositorio` | Crear/gestionar documentos activos |
| AceptacionDocumentalViewSet | `repositorio` | Distribución y lecturas |
| VersionDocumentoViewSet | `archivo` | Historial de versiones |
| ControlDocumentalViewSet | `archivo` | Control de cambios |

**NUNCA usar `section_code = 'documentos'`** — ese código no existe en TabSection.
Fix aplicado: commit `57aa2bc8`

---

## Sidebar — ¿3 Niveles?

**NO necesita 3 niveles** (como Fundación).
- Gestión Documental es 1 módulo con 5 secciones internas (tabs)
- RBAC por sección ya existe via `CargoSectionAccess` con los section_codes arriba
- Fundación tiene 3 niveles porque sus sub-apps son conceptualmente módulos independientes (Configuración, Estructura, Identidad, Contexto)

---

## Flujo UX por Tab

### Tab 1: Dashboard (section: dashboard)
- Stats globales: Documentos publicados, En proceso, Score global
- Score Global = % de tipos con al menos 1 doc publicado / total tipos activos
- Acceso rápido a acciones frecuentes
- **Bug pendiente:** Score Global sin tooltip/explicación

### Tab 2: Repositorio (section: repositorio)
- StatsGrid 4 columnas: Total, Publicados, En Proceso, Por Vencer
- Tabla con filtros por tipo/área/proceso/estado
- Modal DocumentoDetailModal al hacer clic en fila
- **Bug pendiente:** Estadística "Archivo" cuenta todos los estados, no solo PUBLICADO+OBSOLETO+ARCHIVADO

### Tab 3: En Proceso (section: en_proceso)
- PageTabs con 3 sub-tabs: Firmas Pendientes (mi turno), Borradores, En Revisión
- Badge dinámico con conteo por sub-tab

### Tab 4: Configuración (section: configuracion)
- PageTabs con 2 sub-tabs: Tipos de Documento, Plantillas
- Solo roles con acceso a `configuracion` ven esta sección

### Tab 5: Archivo (section: archivo)
- Documentos OBSOLETOS y ARCHIVADOS
- Historial de versiones, control de cambios
- Vista read-only (no acciones de flujo)

---

## DocumentoDetailModal — Estructura (Read-Only, sesión 2026-04-03 p4)

**Modal de Ver es 100% read-only** — todas las acciones de workflow se eliminaron.
Las acciones se hacen desde los botones de la tabla en DocumentosSection.

1. **Header compacto**: Código · Tipo · Estado badge · Clasificación · Fecha · MetaSep separators
2. **WorkflowStepper**: BORRADOR → EN_REVISION → APROBADO → PUBLICADO (color-coded)
   - OBSOLETO/ARCHIVADO: badge especial en lugar de stepper
   - PENDIENTE/PROCESANDO sellado: spinner amber visible
3. **Tabs internos**: Detalle | Contenido | Versiones | Firmantes | Distribución
4. **Contenido tab**: `pdfUrl = documento.archivo_pdf || documento.archivo_original` — iframe para ambos
5. **Info tab**: Link "PDF Original Ingestado" + botón descarga si `archivo_original` existe

### Acciones desde tabla (DocumentosSection)
| Acción | Orden | Condición |
|--------|-------|-----------|
| Ver | 1 | Siempre |
| Editar | 2 | BORRADOR |
| Solicitar Firmas | 3 | BORRADOR |
| Eliminar | 4 | BORRADOR |

### Filtros en Repositorio
- Búsqueda texto (código + título)
- Tipo de Documento (dropdown)
- Proceso (dropdown, desde Fundación/áreas)

---

## PDF Generation (WeasyPrint)

**CRÍTICO:** WeasyPrint 60.x NO soporta `display:flex` ni `display:grid`.
Usar exclusivamente:
- `float: left/right` + clearfix `::after { content:''; display:block; clear:both }`
- `display: inline-block; width: 48%` para columnas de 2
- `display: table; width: 100%` + `display: table-cell` para layouts complejos
- Fuentes: `Arial, Helvetica, sans-serif` (NO 'Segoe UI' — solo disponible en Windows)

**PDF de documento ingresado vs generado:**
- Si `archivo_pdf` existe → link de descarga directa del archivo original
- Si NO existe (doc creado desde plantilla/editor) → generar con WeasyPrint
- **Bug pendiente:** botón PDF siempre llama WeasyPrint aunque exista `archivo_pdf`

---

## Sellado Digital (pyhanko + X.509)

**Dependencias:** `pyhanko==0.25.2`, `pyhanko-certvalidator==0.26.4`
**Certificado:** Auto-firmado RSA 2048, ruta `{MEDIA_ROOT}/certificados/{schema}/certificado.pem`
**Generación:** `python manage.py tenant_command generar_certificado_x509 --schema=SCHEMA`
**tenant_demo:** Certificado válido hasta 2031-04-02 ✓

**sellado_estado field:** PENDIENTE | PROCESANDO | COMPLETADO | ERROR | NO_APLICA
- PENDIENTE/PROCESANDO → spinner amber en DocumentoDetailModal
- COMPLETADO → badge verde + botón descargar PDF sellado

---

## Bugs UX Audit 2026-04-03 — TODOS RESUELTOS

| # | Bug | Componente | Estado |
|---|-----|-----------|--------|
| GD-1 | Stats "Archivo" cuenta todos estados | DashboardDocumentalSection | **RESUELTO** (52cea98a) |
| GD-2 | PDF button llama WeasyPrint aunque exista archivo_pdf | views_export.py | **RESUELTO** (52cea98a) |
| GD-3 | "Solicitar Firmantes" visible en EN_REVISION | DocumentoDetailModal | **RESUELTO** (modal read-only) |
| GD-4 | Ingesta Masiva hardcodea tipo = FT | IngestaMasivaModal | **RESUELTO** (c5e6c43e) |
| GD-5 | Elaborado por vacío en ingesta | DocumentoDetailModal | **RESUELTO** (52cea98a — usa elaborado_por_nombre) |
| GD-6 | Score Global sin tooltip | DashboardDocumentalSection | **RESUELTO** (c5e6c43e) |
| GD-7 | Campo proceso/área no visible en formularios | Create/IngestModal | **RESUELTO** (Proceso dropdown) |

## Flujo Ingestar → Digitalizar (commit 7a893025)

### TipoDocumento.categoria
- `DOCUMENTO` (default): POL, MA, PL, RE, PR, GU, PG, IN → flujo de firma normativo
- `FORMULARIO`: FT, AC, RG, KB → constructor de formularios (separado, NO en GD)
- Migración: `gestion_documental/0013_add_categoria_to_tipo_documento`
- IngestarExternoModal filtra solo `categoria=DOCUMENTO`

### Endpoint POST /documentos/{id}/digitalizar/
- Validaciones: `es_externo=True`, `estado=BORRADOR`
- Body: `{titulo, secciones:[{id,label,contenido}], responsables_cargo_ids:[int]}`
- Acción 1: marca original como OBSOLETO (DocumentoService.marcar_obsoleto)
- Acción 2: crea nuevo BORRADOR con contenido HTML estructurado + `documento_padre` apuntando al original

### DigitalizarModal
- Botón "Digitalizar" (Wand2 icon) visible en DocumentosSection para `es_externo=True` + BORRADOR
- Panel split: 42% PDF iframe + OCR texto colapsable | 58% formulario
- Secciones sugeridas por tipo (POL/MA/PL/RE/PR/GU/PG/IN → arrays en SECCIONES_POR_TIPO)
- Responsables: multi-select por cargo (chips toggle) via useSelectCargos
- Labels de sección editables, agregar/quitar secciones custom

### Fixes adicionales (sesión 2026-04-03 p4)
| Fix | Descripción | Migración/Commit |
|-----|------------|-----------------|
| F-1 | `contenido` blank=True (docs externos sin contenido) | `gestion_documental/0012_contenido_blank_true` |
| F-2 | Serializer `extra_kwargs` allow_blank contenido | serializers.py |
| F-3 | try/catch en DocumentoFormModal.onSubmit | DocumentoFormModal.tsx |
| F-4 | Firma roles 5→3 (ISO 7.5) | `firma_digital/0008_reduce_rol_firma_choices` |
| F-5 | Proceso campo single-select (era multi) | FormModal + IngestarModal |
| F-6 | Filtros tipo+proceso en Repositorio | DocumentosSection.tsx |
| F-7 | OCR: pdfplumber+tesseract instalados Docker | Dockerfile + containers |
| F-8 | "Usar texto OCR" button en modal edición | DocumentoFormModal.tsx |
| F-9 | Modal Ver read-only + header profesional | DocumentoDetailModal.tsx |
| F-10 | archivo_original visible en iframe+info | DocumentoDetailModal.tsx |

---

## Sprints Completados (2026-04-05)

### Sprint 1 (2b8261cc) — Seguridad + Funcional
- DocumentoAccessMixin: CONFIDENCIAL/RESTRINGIDO → 403 en 6 endpoints
- AceptacionDocumental.invalidada: al publicar v2 invalida acuses anteriores
- Badge "Vence en Xd" / "Vencido" en Repositorio cards+list
- Celery tasks de vencimiento ya existían (verificado)

### Sprint 2 (c1a2bc90+bd2ceeda) — Codificación TIPO-PROCESO-NNN
- Motor unificado: ConsecutivoConfig compuesto auto-creado (PR-SST→PR-SST-001)
- Documento.proceso FK a Area + selector con preview código en FormModal
- TablaRetencionDocumental modelo+CRUD+ruta /trd/
- Scripts: migrar_procesos_gd, migrar_codigos_gd (--dry-run)
- areas_aplicacion mantiene para visibilidad, proceso para codificación

### Sprint 4 (934a7fad) — Form Builder + FIRMA_WORKFLOW + UX ✅
- **4.1 Backend**: `CampoFormulario.tipo_campo` += `FIRMA_WORKFLOW`; nuevos campos: `config_firmantes` JSON, `modo_firma` (SECUENCIAL/PARALELO/MIXTO), `nivel_seguridad_firma` 1-3. Migración 0019.
- **4.2 DynamicFormRenderer**: `FirmaWorkflowField` — stepper visual PENDIENTE/FIRMADO/RECHAZADO, `InlineSignatureCanvas` embebido, respeta `modo_firma`. `FormBuilder/types.ts`: paleta grupo Especial con `GitMerge` icon.
- **4.6 GDSearchModal**: Ctrl+K, client-side filter sobre `useDocumentos()` (código+título), nav teclado Arrow+Enter+Esc, 12 resultados.
- **4.7 Filtros colapsados**: `DocumentosSection` — búsqueda siempre visible + panel colapsable + chips activos dismissibles.
- **4.9 Wizard 3 pasos**: `DocumentoFormModal` reescrito — paso 1 (título/tipo/proceso/clasificación/live código preview), paso 2 (plantilla/contenido), paso 3 (resumen+fechas+observaciones). Edición mantiene form plano.
- **4.10 Verificar X.509**: botón "Verificar" en `DocumentoDetailModal` para docs con `sellado_estado=COMPLETADO`.

### Sprint 3 (8175ba69) — Integración C2 + Archivo
- Documento: modulo_origen + GenericFK (referencia_origen_type/id)
- DocumentoService.archivar_registro() — PDF→ARCHIVADO sin firmas
- DocumentoService.crear_desde_modulo() — BORRADOR con FirmaDigital
- ArchivoSection: sub-tab "Registros Externos" filtra por modulo_origen
- Dashboard: widget registros archivados por módulo

### Sprint 3.5 (8c59ded5) — Refactor PDF Generator ✅
- `pdf_generator.py`: 598→260 líneas. `render_to_string('pdf/gestion_documental/documento.html', context)`
- Templates: `base_weasyprint.html` + `documento.html` + 4 partials (`_watermark`, `_firmas`, `_qr`, `_formulario`)
- `_preparar_campos_formulario()`: maneja 17 tipos incluyendo SECCION, TABLA, SIGNATURE, DATE, FILE
- `utils/storage.py`: 5 aliases module-level para FileField upload_to (resuelve serialización migración)
- Migración 0018: AlterField 5 FileFields a aliases module-level

### Sprint 5 (aa727939) — PDF Templates por Tipo + Listado Maestro + Comparación Versiones + UX Polish ✅

**5a — Backend PDF:**
- `_tipo_especifico.html`: encabezados tipo-específicos para PR/MA/POL/GU/PL/RE/PG/IN/AC (colores por tipo)
- `listado_maestro.html`: template WeasyPrint — resumen global (total/tipos/publicados/obsoletos) + tabla por tipo
- `pdf_generator.py`: `generate_listado_maestro_pdf()` + `tipo_codigo`, `tipo_categoria`, `proceso_nombre`, `areas_aplicacion_str` en contexto
- `views.py`: `listado_maestro` soporta `?formato=pdf` (attachment) y `?estado=` multi-valor

**5a — Frontend Comparación + Listado:**
- `VersionDiffModal`: diff side-by-side `cambios_detectados` (campo/anterior/nuevo) + snapshots contenido rojo/verde
- `VersionTimeline`: botón "Comparar" para cada versión no-primera (usa `useCompararVersiones` hook)
- `VigentesTab`: botón "Listado Maestro PDF" con descarga blob automática
- `listadoMaestroPdf()` en API client (`responseType: 'blob'`)

**5b — Design System Polish:**
- `TableSkeleton` reemplaza `Spinner` en DocumentosSection, EnProcesoSection (3 tabs), ArchivoSection
- `EmptyState` VigentesTab contextual: búsqueda vs vacío
- **Revelación progresiva**: `DashboardDocumentalSection` oculta Resumen del Sistema y CoberturaPanel a usuarios sin `archivo.view` / `repositorio.view`
- **Optimistic updates**: `useAceptarLectura` y `useRechazarLectura` eliminan item de `mis-pendientes` inmediatamente con rollback en error via `onMutate`/`onError`

### Sprint 6 (160862e1) — Mobile + tsvector + Revisión Auto + Search Global ✅ CI #840 GREEN

**6.1 Mobile responsive:**
- `DocumentoDetailModal`: iframe `h-[40vh] sm:h-[60vh]`, content `max-h-[40vh] sm:max-h-[55vh]`
- `DocumentoReaderModal`: content `max-h-[40vh] sm:max-h-[55vh]`, footer `flex-wrap`
- `ArchivoSection VigentesTab`: toolbar `flex-col sm:flex-row`, button `w-full sm:w-auto`

**6.2 Full-text search tsvector (backend):**
- `SearchVector(codigo, peso=A) + SearchVector(titulo, peso=A) + SearchVector(resumen, peso=B) + SearchVector(proceso__name, peso=C) + SearchVector(tipo_documento__nombre, peso=C)`
- `SearchQuery(buscar, config='spanish')`, threshold `rank__gt=0.01` OR `icontains` fallback
- `VigentesTab`: debounce 350ms → server-side si ≥3 chars, client-side para <3
- **Fix param**: hook `useDocumentos` usaba `search?` (roto) → renombrado a `buscar?` (correcto)

**6.3 Revisión automática Celery:**
- `DocumentoService.iniciar_revision_automatica(doc_id, empresa_id)`: snapshot `VersionDocumento` → `PUBLICADO→BORRADOR` → versión 1.0→2.0 (major bump)
- Task: `documental.crear_borradores_revision_automatica`, queue `compliance`, daily 7:00AM
- Notifica elaborador vía `DOCUMENTO_REVISION_INICIADA`

**6.4 SearchModal global (Deuda #21 RESUELTO):**
- `useQuery` TanStack Query → `GET /gestion-estrategica/gestion-documental/documentos/?buscar=X&page_size=6`
- `useNavigate` → `/gestion-documental/documentos?documento_id={id}` + `onClose()` + `onChange('')`
- Badges estado con `ESTADO_COLORS` / `ESTADO_LABELS`

**Bugs encontrados en CI (sesión 2026-04-04):**
- `import { Modal }` → debe ser `import { BaseModal }` — barrel NO exporta `Modal` (fd0b5298)
- `Spinner` importado pero sin uso en `EnProcesoSection.tsx` → ESLint `no-unused-vars` (160862e1)

**Pendiente Sprint 7 (Post-MVP):** OCR avanzado, BPM auto-gen, FIRMA_WORKFLOW↔SignatureModal GenericFK

### Sprint 7a (50c7e989+7ca1b26d) — Auditoría E2E + TRD + Hallazgos (2026-04-05) ✅

**7a.1 Dashboard fixes:**
- `canDo()` corregido a 3 params → Ana ve Archivo/Distribución/Cobertura (antes ocultos)
- Score Global: `truncate` → `leading-tight` (fórmula completa visible)
- Eliminada card "Flujo activo" redundante → grid 2 cols (Archivo + Distribución)
- StatsGrid navega a sub-tab correcto (`en_proceso:borradores`) via `handleNavigateToSection`

**7a.2 TRD completa:**
- Frontend: tabla CRUD + formulario inline crear regla + badge contador
- Seed: `seed_trd` command — 17 reglas AGN PyME colombiana (Dto 1072, Res 0312, ISO)
- `resolver_retencion()` en DocumentoService — TRD (tipo+proceso) > fallback TipoDocumento
- Task `procesar_retencion_documentos` refactorizada para usar `resolver_retencion()`
- Default `requiere_acta_destruccion` corregido True→False
- Doc referencia: `docs/03-modulos/gestion-documental/REGLAS_TRD_STRATEKAZ_SGI.md`

**7a.3 Hallazgos E2E corregidos:**
- H1: Repositorio ordena por `-created_at` (más recientes primero)
- H2: Responsables Digitalizar → dropdown searchable con chips (era 23 chips sueltos)
- H3: Tab Contenido docs externos → mensaje "use Digitalizar"
- H4: Hook firmas no polling si usuario no tiene permiso firma_digital (evita 403)
- H5: Listado Maestro PDF alineado a Design System colores (--sk-navy, --sk-blue)

**7a.4 Fixes infraestructura:**
- `pydyf==0.10.0` pinned (0.11+ rompe WeasyPrint 60.x PDF generation)
- PDF generator fallback: EmpresaConfig → Tenant (logo + razón social + NIT de Admin Global)
- Progreso lectura nunca decrementa (`max()` en backend registrar-progreso)

### Sprint 8 (ee4081f9) — Camino B: Adopción PDF Externo ✅

**Decisión: Solo PDF** — Camino C (Word) eliminado. Política absoluta: solo se acepta PDF.

- **Backend**: Endpoint `adoptar-pdf` (POST) — valida solo PDF (magic bytes `%PDF`), 10MB max, cuota storage, genera código TIPO-PROCESO-NNN, guarda `codigo_legacy`, crea FirmaDigital con validación unicidad usuario, dispara OCR async
- **Campo `codigo_legacy`**: CharField nullable, indexado, buscable por tsvector peso 'A'. Migración 0020.
- **tsvector actualizado**: `codigo_legacy` en búsqueda principal + avanzada + fallback icontains
- **Frontend**: `AdoptarPdfModal` (drag&drop, tipo, proceso, clasificación, código legacy), `useAdoptarPdf()` hook, botón "Adoptar PDF" en DocumentosSection
- **Fix E2E**: `procesosData?.results ?? []` — useAreas retorna paginado (commit 20918b20)

### Sprint 9 (ee4081f9) — Design System PDF Completo ✅

- **`pdf_design_system.css`**: 16,862 chars. Paleta sk-navy/sk-blue, tipografía Arial (NO Segoe UI), badges, callouts, tablas, firmas (inline-block NO flex), watermarks, portada, sello X.509 (float NO flex), utilities. 100% WeasyPrint 60.x compatible.
- **Spike `element()`**: Confirmado que `position: running()` funciona en WeasyPrint 60.2 con running headers/footers en 3+ páginas
- **`base_weasyprint.html`**: Carga `design_system_css` dinámicamente via contexto Django
- **Templates actualizados**: `documento.html` (header/footer running, portada ESTRATÉGICO/TÁCTICO, metadata sk-*, badges sk-badge-*), `_firmas.html` (sk-firmas[data-count] inline-block), `_watermark.html` (sk-watermark-{estado}), `_qr.html` (sk-sello-x509 + sk-qr-container float)
- **`pdf_generator.py`**: `_load_design_system_css()`, `nivel_documento` en contexto, `design_system_css` para listado maestro

### Sprint 10 (ee4081f9) — TRD Fase 2 + Integridad de Firmas ✅

- **Campos TRD en Documento**: `trd_aplicada` (FK), `fecha_fin_gestion`, `fecha_fin_central`, `disposicion_asignada`, `acta_eliminacion` (FK self). Migración 0021.
- **Estado ELIMINADO**: Agregado a ESTADO_CHOICES. Eliminación lógica, no visible en vistas normales.
- **`asignar_trd_automatica()`**: Asigna `trd_aplicada` al crear (informativo), calcula fechas solo al ARCHIVADO (cuando empieza el reloj de retención). Usa `dateutil.relativedelta`.
- **Validación APROBÓ obligatorio**: `publicar_documento()` verifica FirmaDigital con `rol='APROBO'` y `estado='FIRMADA'` antes de publicar.
- **Validación mínimos legales**: Serializer TRD con diccionario `MINIMOS_LEGALES` (Dto 1072, Res 2346, ISO 9001). Rechaza si `tiempo_total < minimo`.
- **Frontend**: `EstadoDocumento += 'ELIMINADO'`, campos TRD en interfaz Documento.

### Sprint 11 (ee4081f9) — Compresión + Almacenamiento ✅

- **`pdf_compression.py`**: Ghostscript `/ebook` 150 DPI, fallback graceful si gs no instalado, conserva original si comprimido es mayor.
- **Dockerfile**: `ghostscript` agregado a dependencias runtime.
- **Cuotas**: Ya existentes via `check_storage_quota()` + `Tenant.max_storage_gb`.

### Fix CI (212fe549 + 20918b20) — WeasyPrint + ESLint + AdoptarPdfModal ✅

- **Root cause CI #841-#847**: Dependabot subió weasyprint 60.2→68.1 pero pydyf pinneado a 0.10.0. Conflicto pip.
- **Fix**: Pin `weasyprint==60.2` en requirements.txt. Relajar requirements-dev.txt a rangos.
- **ESLint**: `totalPendientes` unused en DashboardDocumentalSection.
- **CI #850**: GREEN (17m 42s). Primer verde desde #840.

**Pendiente Post-MVP:** OCR avanzado, BPM auto-gen, FIRMA_WORKFLOW↔SignatureModal GenericFK

### Fixes UX Críticos (b9d111fa + 9ca3e9ae) — 2026-04-06 ✅ CI #852

**Flujo `lectura_obligatoria` validado E2E:**
- Backend: modelo `AceptacionDocumental`, signal al publicar, endpoint `registrar-progreso`, endpoint `aceptar-lectura`, `GET /mis-pendientes/`
- Frontend: `LecturasPendientesTab` en Mi Portal, `DocumentoReaderModal` con scroll tracking

**Bug DocumentoReaderModal — 90% nunca alcanzado (RESUELTO):**
- Root cause: `TOTAL_SECCIONES = 10` hardcoded. Docs con <10 secciones HTML → máx porcentaje < 90% → checkbox siempre deshabilitado
- Fix: `totalSeccionesDisplay` state + `totalSeccionesRef` ref. El observer lee `sectionElements.length` real del DOM al montar
- `guardarProgreso` usa `totalSeccionesRef.current` (evita loop de re-renders)
- Caso edge: 0 secciones → porcentaje = 100% (documento sin contenido trackeable)

**PublicarModal (nuevo componente):**
- `PublicarModal.tsx` — reemplaza ConfirmDialog genérico con modal completo
- Campos: `lectura_obligatoria` (checkbox), `aplica_a_todos` (radio: todos/por área), `fecha_vigencia` (DatePicker)
- Conecta directo a `usePublicarDocumento` hook → endpoint `POST /publicar/`

**Superadmin crear documentos (excepción temporal):**
- Frontend: `!isSuperAdmin` guard eliminado → botón "Nuevo Documento" visible para superadmin
- Backend `perform_create`: `if not user.is_superuser and not getattr(user, 'cargo', None)` — exime a superadmin del check de cargo
- Motivo: excepción temporal mientras se configuran consultores/proveedores externos con cargo propio

**PdfIframe — HEAD fetch antes de iframe (RESUELTO):**
- Root cause: Nginx con `try_files $uri /index.html` → archivo faltante en `/media/` → Nginx sirve React SPA (HTML 200) → page 404 de React aparece dentro del `<iframe>`
- Fix: `PdfIframe` sub-component, `fetch(url, { method: 'HEAD' })` → evalúa `res.ok && ct.includes('pdf')`
  - OK: render iframe
  - Error: mensaje "No se puede previsualizar" + enlace "Abrir en nueva pestaña"
  - Loading: `<Spinner>`
- Ubicación: `DocumentoDetailModal.tsx` antes de `export function DocumentoDetailModal`

---

## Documentación de Cierre GD (auditoría 2026-04-05)

| Documento | Ubicación | Versión |
|-----------|-----------|---------|
| Arquitectura GD v5.1 | `docs/03-modulos/gestion-documental/Arquitectura_Gestion_Documental_StrateKaz_v5.md` | v5.1 post-cierre |
| Design System PDF | `docs/02-desarrollo/frontend/DESIGN_SYSTEM_PDF_STRATEKAZ_SGI.md` | 99.5% alineado |
| Reglas TRD | `docs/03-modulos/gestion-documental/REGLAS_TRD_STRATEKAZ_SGI.md` | Actualizado RN-TRD-006 |

**Eliminados:** PLAN_CIERRE_GD (obsoleto — sprints ejecutados), Arquitectura_v4 (reemplazada), Lineamientos_GD.docx (sin rastrear).

---

## Docker Local — Setup Requerido por Tenant

Comandos necesarios en tenant nuevo para que Gestión Documental funcione:
```bash
# 1. RBAC (secciones + permisos base)
docker compose exec backend python manage.py tenant_command init_rbac --schema=SCHEMA

# 2. Tipos de documento SGI (semilla estándar)
docker compose exec backend python manage.py tenant_command seed_tipos_documento_sgi --schema=SCHEMA

# 3. Certificado X.509 para sellado
docker compose exec backend python manage.py tenant_command generar_certificado_x509 --schema=SCHEMA

# 4. TRD — Reglas de retención AGN (33 reglas base)
docker compose exec backend python manage.py tenant_command seed_trd --schema=SCHEMA
```

**Why:** init_rbac crea las TabSections; sin ellas, CargoSectionAccess falla y todos los endpoints devuelven 403.
