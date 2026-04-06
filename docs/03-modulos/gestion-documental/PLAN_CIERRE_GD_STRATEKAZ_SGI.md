# PLAN DE CIERRE — MÓDULO GESTIÓN DOCUMENTAL

**StrateKaz SGI — Plataforma de Gestión Empresarial 360**
Versión 2.0 — Abril 2026
Elaborado por: Camilo Rubiano Bustos — StrateKaz Consultoría 4.0

> **Contexto:** Este plan consolida las decisiones funcionales tomadas en la auditoría del módulo GD (Sprint 7a completado, ~85% del roadmap v5) y las traduce en instrucciones ejecutables para Claude Code. El objetivo es llevar el módulo al estado "certificable ISO" y listo para recepción de clientes en producción.

---

## Tabla de Contenido

1. [Estado Actual y Gaps Identificados](#1-estado-actual-y-gaps-identificados)
2. [Decisiones de Diseño Confirmadas](#2-decisiones-de-diseño-confirmadas)
3. [Sprint 8 — Camino B: Adopción de PDFs Externos](#3-sprint-8--camino-b-adopción-de-pdfs-externos)
4. [Sprint 9 — Design System PDF Completo](#4-sprint-9--design-system-pdf-completo)
5. [Sprint 10 — TRD Fase 2 + Integridad de Firmas](#5-sprint-10--trd-fase-2--integridad-de-firmas)
6. [Sprint 11 — Compresión y Almacenamiento](#6-sprint-11--compresión-y-almacenamiento)
7. [Actualización de Documentos Existentes](#7-actualización-de-documentos-existentes)
8. [Checklist de Cierre del Módulo](#8-checklist-de-cierre-del-módulo)

---

## 1. Estado Actual y Gaps Identificados

### 1.1 Sprints Completados (7 de 10+)

| Sprint | Descripción | Commit | Estado |
|--------|------------|--------|--------|
| **1** | Seguridad + Funcional (AccessMixin, invalidar aceptaciones, badges vencimiento) | `2b8261cc` | **DONE** |
| **2** | Codificación TIPO-PROCESO-NNN + TRD modelo + FK proceso | `c1a2bc90` | **DONE** |
| **3** | Integración C2 + Archivo (archivar_registro, crear_desde_modulo, GenericFK) | `8175ba69` | **DONE** |
| **3.5** | Refactor PDF Generator (598→260 líneas, templates Django, Form Builder→PDF) | `8c59ded5` | **DONE** |
| **4** | Form Builder FIRMA_WORKFLOW + Wizard 3 pasos + Ctrl+K + filtros colapsados | `934a7fad` | **DONE** |
| **5** | PDF Templates por tipo + Listado Maestro + VersionDiffModal + Optimistic updates | `aa727939` | **DONE** |
| **6** | Mobile responsive + tsvector search + Revisión automática Celery + SearchModal global | `160862e1` | **DONE** |
| **7a** | Auditoría E2E + TRD seed 17 reglas + 5 hallazgos + pydyf pin + PDF fallback | `7ca1b26d` | **DONE** |

### 1.2 Gaps para Cierre

| # | Gap | Prioridad | Sprint |
|---|-----|-----------|--------|
| G-01 | Camino B: PDFs externos al ciclo de firmas y publicación | **CRÍTICA** | Sprint 8 |
| G-02 | Design System PDF completo (implementar DESIGN_SYSTEM_PDF_STRATEKAZ_SGI.md) | **CRÍTICA** | Sprint 9 |
| G-03 | TRD fase 2: campos en Documento + asignar_trd_automatica() + estado ELIMINADO | **ALTA** | Sprint 10 |
| G-04 | Validación de firma única por usuario por documento | **ALTA** | Sprint 10 |
| G-05 | Campo codigo_legacy para documentos adoptados | **ALTA** | Sprint 8 |
| G-06 | Compresión automática de PDFs al upload | **MEDIA** | Sprint 11 |
| G-07 | Cuotas de almacenamiento por tenant | **MEDIA** | Sprint 11 |
| G-08 | Actualización de deuda técnica en Arquitectura v5 (§18) | **BAJA** | Sprint 8 |

---

## 2. Decisiones de Diseño Confirmadas

Las siguientes decisiones fueron tomadas durante la auditoría y son **vinculantes** para la implementación:

### 2.1 Solo PDF — Política Absoluta
- **Regla absoluta:** El sistema SOLO acepta archivos PDF. No se acepta Word, Excel, ni ningún otro formato.
- El PDF es el documento oficial: sobre él se calcula el hash, se aplica el sellado X.509, se ejecutan las firmas.
- Si el usuario tiene un documento en Word, debe convertirlo a PDF antes de subirlo. El sistema rechaza cualquier archivo que no sea PDF.

### 2.2 Dos Caminos de Ingreso
- **Camino A:** Creación nativa (wizard + editor TipTap + Design System PDF). Ya existe y funciona. `[LIVE]`
- **Camino B:** Adopción de PDF existente. El sistema lo adopta sin modificar contenido, le asigna código StrateKaz, y lo incorpora al ciclo de firmas → publicación → distribución. **PENDIENTE.**

### 2.3 Codificación y Legacy
- Todo documento recibe código StrateKaz (TIPO-PROCESO-NNN) al ingresar.
- El código original de la empresa se guarda en campo `codigo_legacy` (CharField, nullable, indexado, buscable por tsvector).
- En header PDF, sellado X.509 y listado maestro siempre aparece el código StrateKaz.

### 2.4 Firmas
- Solo APROBÓ dispara publicación. ELABORÓ solo o REVISÓ solo NO publican.
- Un mismo usuario NO puede ocupar dos roles de firma en el mismo documento.
- Aprobación directa (1 firma, solo APROBÓ) es válida para nivel estratégico.
- El permiso se controla por RBAC (`documento.aprobar`), no por cargo.

### 2.5 Distribución
- Clasificación de acceso (PÚBLICO, INTERNO, CONFIDENCIAL, RESTRINGIDO) controla quién ve.
- Mi Portal muestra solo lo que le aplica al usuario.
- Lectura obligatoria genera AceptacionDocumental con tracking de scroll y tiempo.

### 2.6 Registros Históricos
- Entran por patrón Notario/Archivo → directo a ARCHIVADO sin firmas.
- Se organizan por proceso y tipo documental.

### 2.7 Compresión
- Todo PDF se comprime automáticamente al ingresar (Ghostscript, 150 DPI).
- Solo se guarda la versión comprimida (si es menor que el original).
- Hash y sellado se calculan sobre el comprimido.

### 2.8 Almacenamiento
- Por plan: Básico 2GB, Profesional 5GB, Empresarial 15GB.
- Límite por archivo: 10 MB.
- Alertas al 80% y 90%.

### 2.9 Restricciones CSS para WeasyPrint 60.x
- **NO usar `display: flex` ni `display: grid`** — WeasyPrint 60.x no los soporta.
- Usar exclusivamente: `float: left/right` + clearfix, `display: inline-block`, `display: table/table-cell`.
- Fuentes: `Arial, Helvetica, sans-serif` (NO 'Segoe UI' — solo disponible en Windows).
- Esta restricción aplica a TODO el CSS del Design System PDF y a los templates Django de generación.

---

## 3. Sprint 8 — Camino B: Adopción de PDFs Externos

**Objetivo:** Habilitar el ingreso de documentos PDF existentes al ciclo completo (firmas → publicación → distribución → Mi Portal).

### Tarea 8.0 — Spike: Verificar `element()` en WeasyPrint 60.1

**Antes de cualquier implementación del Sprint 9**, ejecutar prueba de 30 minutos:

```python
# Crear HTML mínimo con element() para header running
html_test = """
<style>
    .page-header { position: running(pageHeader); }
    @page { @top-center { content: element(pageHeader); } }
</style>
<div class="page-header">HEADER TEST</div>
<p>Contenido de prueba...</p>
"""
# Generar PDF con WeasyPrint y verificar si el header aparece
```

**Resultado esperado:** Si `element()` funciona → Sprint 9 usa running headers. Si NO funciona → Sprint 9 usa `position: fixed` con padding-top en `@page` y el header se repite con `display: table-header-group` dentro de una tabla envolvente.

**Este spike es prerequisito bloqueante para Sprint 9.** El resultado determina la estrategia de header/footer.

### Tarea 8.1 — Campo `codigo_legacy` en Documento

**Archivo:** modelo `Documento`.

```python
# Agregar al modelo Documento:
codigo_legacy = models.CharField(
    max_length=100,
    null=True, blank=True,
    db_index=True,
    verbose_name='Código original de la empresa',
    help_text='Código del documento antes de ingresar al sistema StrateKaz'
)
```

- Agregar al `search_vector` del tsvector con peso 'A' para que sea buscable.
- Mostrar en el detalle del documento como campo de metadata (no en el header).
- Agregar al FormModal del wizard como campo opcional (solo visible cuando `es_externo=True`).
- Migración: ningún dato existente requiere migración.

### Tarea 8.2 — Camino B: Flujo de adopción PDF

**Backend — Acción en DocumentoViewSet:**

1. Crear acción `adoptar_pdf` (POST) que reciba:
   - `archivo` (File, solo PDF — validar content-type `application/pdf` + magic bytes `%PDF`)
   - `tipo_documento` (FK)
   - `proceso` (FK)
   - `codigo_legacy` (opcional)
   - `clasificacion` (default INTERNO)
   - `firmantes` (lista de {usuario, rol})

2. El endpoint debe:
   - **Rechazar** cualquier archivo que no sea PDF con mensaje: "Solo se aceptan archivos PDF. Si su documento está en otro formato, conviértalo a PDF antes de subirlo."
   - Crear Documento con `estado=BORRADOR`, `es_externo=True`.
   - Asignar código StrateKaz automáticamente (motor TIPO-PROCESO-NNN existente).
   - Guardar el PDF en `archivo_original`.
   - Ejecutar OCR asíncrono para extraer texto (task Celery existente).
   - Crear las instancias de `FirmaDigital` según firmantes asignados.
   - Retornar el documento creado con su código.

3. **Ajuste en el motor de firmas:**
   - Para documentos con `es_externo=True`:
     - El botón "Ver documento" en el modal de firma debe abrir el `archivo_original`, no generar PDF desde HTML.
     - La firma se aplica sobre el hash del `archivo_original`.
     - El sellado X.509 (pyHanko) se aplica directamente sobre el `archivo_original`.

4. **Ajuste en publicación:**
   - Al publicar un documento externo, el PDF que se distribuye es el `archivo_original` (con sellado X.509 añadido), NO un PDF generado desde template.
   - El visor en Mi Portal muestra este PDF.

**Frontend — Wizard simplificado:**

5. Agregar en "Repositorio" un botón "Adoptar PDF existente" que abra un modal/wizard de 3 pasos:
   - Paso 1: Subir archivo (drag & drop, solo acepta `.pdf`).
   - Paso 2: Asignar tipo, proceso, clasificación, código legacy (opcional).
   - Paso 3: Asignar firmantes (mismo componente `AsignarFirmantesModal` existente).
   - Al guardar, llama al endpoint `adoptar_pdf`.

### Tarea 8.3 — Actualizar tsvector para incluir `codigo_legacy`

**Archivo:** señal o trigger que actualiza `search_vector`.

Agregar `codigo_legacy` al vector de búsqueda con peso 'A' (máximo), para que si alguien busca "PR-FT-SG-002" encuentre el documento aunque ahora se llame PR-SST-003.

### Tarea 8.4 — Actualizar deuda técnica en documentación

**Instrucción para actualización del documento `Arquitectura_Gestion_Documental_StrateKaz_v5.md`, sección §18:**

Los siguientes items deben cambiar de "Pendiente" a "RESUELTO":

| DT# | Estado Actual en Doc | Estado Real | Sprint que lo resolvió |
|-----|---------------------|-------------|----------------------|
| DT-07 | Pendiente | **PARCIAL** (Sprint 3.5 lo avanzó, Form Builder→PDF funciona) | Sprint 3.5 |
| DT-08 | Pendiente | **RESUELTO** | Sprint 3.5 (refactor a templates Django) |
| DT-11 | Pendiente | **RESUELTO** | Sprint 5 (VersionDiffModal) |
| DT-12 | Pendiente | **RESUELTO** | Sprint 5 (Listado Maestro) |
| DT-15 | Pendiente | **RESUELTO** | Sprint 6 (tsvector full-text) |
| DT-16 | Pendiente | **RESUELTO** | Sprint 5b (revelación progresiva) |
| DT-17 | Pendiente | **RESUELTO** | Sprint 4 (verificación X.509 UI) |

Agregar nuevas deudas:

| DT# | Deuda | Severidad | Sprint |
|-----|-------|-----------|--------|
| DT-18 | Campo `codigo_legacy` faltante para documentos adoptados | Alta | Sprint 8 |
| DT-19 | Camino B no implementado (PDF externo al ciclo de firmas) | Crítica | Sprint 8 |
| DT-20 | Design System PDF no implementado en generador WeasyPrint | Alta | Sprint 9 |
| DT-21 | TRD fase 2: campos en Documento + asignar_trd_automatica() | Alta | Sprint 10 |
| DT-22 | Validación de firma única por usuario por documento | Alta | Sprint 10 |
| DT-23 | Compresión automática de PDFs al upload | Media | Sprint 11 |

---

## 4. Sprint 9 — Design System PDF Completo

**Objetivo:** Implementar el Design System definido en `DESIGN_SYSTEM_PDF_STRATEKAZ_SGI.md` como CSS real en el generador WeasyPrint, respetando las restricciones de WeasyPrint 60.x.

> **Documento de referencia:** `DESIGN_SYSTEM_PDF_STRATEKAZ_SGI.md` — contiene 22 secciones con paleta, tipografía, @page, header/footer running, portada, callout boxes, badges, firmas, sellado, marcas de agua, layouts por tipo, CSS completo y HTML de referencia.

> **PREREQUISITO:** Tarea 8.0 (spike `element()`) debe estar completada antes de iniciar este sprint.

### Tarea 9.1 — Crear `pdf_design_system.css`

**Ubicación:** `backend/apps/gestion_estrategica/gestion_documental/static/css/pdf_design_system.css`

**Instrucción:** Tomar CADA bloque CSS de las secciones 3 a 17 del documento `DESIGN_SYSTEM_PDF_STRATEKAZ_SGI.md` y consolidarlos en un solo archivo:

```
/* 1. Variables (:root) — Sección 3 del doc */
/* 2. @page configuration — Sección 5 */
/* 3. Header running — Sección 6 */
/* 4. Footer running — Sección 7 */
/* 5. Base typography — Sección 4 + 8 */
/* 6. Tables — Sección 9 */
/* 7. Callout boxes — Sección 10 */
/* 8. Badges — Sección 11 */
/* 9. Separators — Sección 12 */
/* 10. Code blocks — Sección 13 */
/* 11. Lists — Sección 14 */
/* 12. Signature blocks — Sección 15 */
/* 13. X.509 seal — Sección 16 */
/* 14. Watermarks — Sección 17 */
/* 15. Cover page — Sección 18 */
/* 16. Utilities */
```

**Restricciones WeasyPrint 60.x (OBLIGATORIAS):**
- **NO usar `display: flex`** — reemplazar por `float: left` + clearfix `::after { content:''; display:block; clear:both }`.
- **NO usar `display: grid`** — reemplazar por `display: table` + `display: table-cell`.
- **NO usar `gap`** — reemplazar por `margin`.
- **Firmas** (§15 del Design System): El doc usa `display: flex` — reescribir como `display: inline-block` con `width: 30%` para 3 firmantes, `width: 45%` para 2, `width: 100%` para 1. Separar con `margin-right`.
- **Sello X.509** (§16): El doc usa `display: flex` — reescribir como `float: left` (estampa) + `float: right` (QR) + clearfix.
- **Tipografía**: Usar `Arial, Helvetica, sans-serif` como familia principal. NO usar `Segoe UI` (no disponible en servidor Linux). El doc de Design System menciona Segoe UI como primera opción — ignorar y usar Arial.
- Verificar resultado del spike `element()` (Tarea 8.0) para decidir estrategia de header/footer running.

### Tarea 9.2 — Refactorizar `pdf_generator.py` para usar Design System

**Archivo:** `backend/apps/gestion_estrategica/gestion_documental/exporters/pdf_generator.py`

1. Cargar `pdf_design_system.css` como CSS base para TODOS los PDFs generados por el sistema (Camino A + actas C2).
2. Refactorizar los templates Django existentes (`base_weasyprint.html`, `documento.html`, partials) para usar las clases CSS del Design System:
   - `<h1 class="sk-h1">` en lugar de estilos inline.
   - `<table class="sk-table">` en lugar de tablas con estilos inline.
   - `<div class="sk-callout sk-callout-info">` para notas.
   - Usar el HTML de referencia de la sección §23 como guía de estructura.

3. Implementar header con el layout de la sección §6:
   - Logo del tenant (base64), nombre, NIT a la izquierda (`float: left`).
   - Código del documento, versión y badge de estado a la derecha (`float: right`).
   - Línea inferior 1.5pt en `--sk-navy`.
   - Clearfix después del contenedor.

4. Implementar footer con el layout de la sección §7:
   - "StrateKaz | Consultoría 4.0" a la izquierda (`float: left`).
   - "Documento controlado — Impreso: {fecha}" al centro (`display: inline-block; width: 34%; text-align: center`).
   - "Página X de Y" a la derecha (`float: right`) — CSS counter.

5. Implementar marcas de agua de la sección §17:
   - PUBLICADO → "COPIA CONTROLADA"
   - BORRADOR → "BORRADOR — NO DISTRIBUIR"
   - OBSOLETO → "OBSOLETO — NO USAR"

6. Implementar bloque de firmas de la sección §15 (con layout `inline-block`, NO flex):
   - Dinámico: 1, 2 o 3 firmantes.
   - Imagen de firma, nombre, cargo, fecha, hash.
   - Pendientes muestran "Pendiente de firma".

7. Implementar sello X.509 de la sección §16 (con layout `float`, NO flex).

8. **NO aplicar Design System a documentos adoptados** (Camino B). Para documentos con `es_externo=True`, el PDF que se sirve es el `archivo_original` con sellado X.509 añadido, sin pasar por el generador de templates.

### Tarea 9.3 — Portada de documento

**Referencia:** Sección §18 del Design System.

Implementar portada solo para documentos de nivel ESTRATÉGICO y TÁCTICO (políticas, manuales, procedimientos, planes, programas, reglamentos). Los documentos OPERATIVOS y SOPORTE (formatos, registros, actas, KB) NO llevan portada.

### Tarea 9.4 — Verificación visual

Generar PDFs de prueba para cada tipo documental (PR, POL, FT, AC, MA, PL, IN, GU, PG, RE, RG, KB) y verificar:
- Header/footer aparece en todas las páginas.
- Tablas no se cortan a mitad de fila.
- Firmas se renderizan correctamente con 1, 2 y 3 firmantes (layout `inline-block`).
- Badge de estado es correcto.
- Marca de agua es legible pero no interfiere con el contenido.
- Sellado X.509 se renderiza al final del documento.
- Logo del tenant no se solapa con NIT ni nombre.
- Fuente es Arial (no Segoe UI).

---

## 5. Sprint 10 — TRD Fase 2 + Integridad de Firmas

**Objetivo:** Completar la implementación de TRD con auto-asignación, estado ELIMINADO y validación de mínimos legales. Agregar validación de integridad de firmas.

### Tarea 10.1 — Campos TRD en modelo Documento

**Referencia:** `REGLAS_TRD_STRATEKAZ_SGI.md`, sección §4.5.

```python
# Agregar al modelo Documento:
trd_aplicada = models.ForeignKey(
    'TablaRetencionDocumental',
    on_delete=models.SET_NULL,
    null=True, blank=True,
    verbose_name='Regla TRD aplicada'
)
fecha_fin_gestion = models.DateField(
    null=True, blank=True,
    verbose_name='Fecha fin archivo de gestión'
)
fecha_fin_central = models.DateField(
    null=True, blank=True,
    verbose_name='Fecha fin archivo central'
)
disposicion_asignada = models.CharField(
    max_length=25,
    choices=DISPOSICION_CHOICES,
    null=True, blank=True,
    verbose_name='Disposición final asignada'
)
```

### Tarea 10.2 — Función `asignar_trd_automatica()`

**Referencia:** `REGLAS_TRD_STRATEKAZ_SGI.md`, sección §4.2.

**Ubicación:** `DocumentoService`.

**Regla de timing — Dos momentos distintos:**

1. **Al crear el documento** (cualquier camino): asignar solo `trd_aplicada` y `disposicion_asignada` (informativo, para mostrar en UI qué TRD aplica). NO calcular fechas.

2. **Al transicionar a ARCHIVADO**: calcular `fecha_fin_gestion` y `fecha_fin_central` a partir de la fecha de archivo. Porque el reloj de retención empieza cuando el documento entra al archivo, no cuando se crea.

```python
def asignar_trd_automatica(documento, calcular_fechas=False):
    """
    Paso 1 (siempre): Asigna trd_aplicada y disposicion_asignada.
    Paso 2 (solo si calcular_fechas=True): Calcula fechas de retención.
    """
    retencion = resolver_retencion(documento)
    documento.trd_aplicada = retencion.get('trd_obj')  # FK o None
    documento.disposicion_asignada = retencion['disposicion']

    if calcular_fechas and documento.fecha_archivado:
        documento.fecha_fin_gestion = calcular_fecha(
            documento.fecha_archivado, retencion['gestion']
        )
        documento.fecha_fin_central = calcular_fecha(
            documento.fecha_fin_gestion, retencion['central']
        )

    documento.save(update_fields=[
        'trd_aplicada', 'disposicion_asignada',
        'fecha_fin_gestion', 'fecha_fin_central'
    ])
```

**Llamar desde:**
- `DocumentoService.crear_desde_modulo()` → `calcular_fechas=False`
- `DocumentoService.archivar_registro()` → `calcular_fechas=True` (entra directo a ARCHIVADO)
- Transición a ARCHIVADO (ciclo normal) → `calcular_fechas=True`
- Endpoint `adoptar_pdf` (Sprint 8) → `calcular_fechas=False`

### Tarea 10.3 — Estado ELIMINADO

**Referencia:** `REGLAS_TRD_STRATEKAZ_SGI.md`, sección §3.2 (RN-TRD-005).

```python
# Agregar a ESTADO_CHOICES:
('ELIMINADO', 'Eliminado'),

# Nuevo campo:
acta_eliminacion = models.ForeignKey(
    'self',
    on_delete=models.SET_NULL,
    null=True, blank=True,
    related_name='documentos_eliminados',
    verbose_name='Acta de eliminación'
)
```

- Documento ELIMINADO NO aparece en ninguna vista normal (repositorio, búsqueda, Mi Portal).
- Solo visible desde panel de admin o reporte de auditoría.
- Es eliminación LÓGICA, conserva todos los datos en BD.
- Badge ELIMINADO ya definido en §11 del Design System PDF.

### Tarea 10.4 — Validación de mínimos legales en serializer

**Referencia:** `REGLAS_TRD_STRATEKAZ_SGI.md`, sección §3.4 (RN-TRD-010).

Agregar validación en `validate()` del serializer de `TablaRetencionDocumental`:

```python
MINIMOS_LEGALES = {
    'RG_SST_capacitacion': {'minimo': 20, 'norma': 'Dto 1072/2015 Art 2.2.4.6.12'},
    'RG_SST_investigacion': {'minimo': 20, 'norma': 'Dto 1072/2015; Res 1401/2007'},
    'RG_SST_clinica': {'minimo': 20, 'norma': 'Res 2346/2007 Art 17'},
    'AC_SST': {'minimo': 10, 'norma': 'Dto 1072/2015 Art 2.2.4.6.21'},
    'POL_cualquier': {'minimo': 10, 'norma': 'ISO 9001/14001/45001 Cl 7.5'},
    'MT_cualquier': {'minimo': 10, 'norma': 'Dto 1072/2015 Art 2.2.4.6.15'},
    'PR_cualquier': {'minimo': 7, 'norma': 'ISO 9001 Cl 7.5'},
    'PL_SST': {'minimo': 7, 'norma': 'Dto 1072/2015 Art 2.2.4.6.25'},
    'FT_cualquier': {'minimo': 4, 'norma': 'Práctica archivística estándar'},
}
```

Implementar como diccionario configurable. Si el Admin intenta guardar `tiempo_total < minimo`, rechazar con mensaje: "El tiempo total de retención ({X} años) es inferior al mínimo legal ({Y} años) según {norma}."

### Tarea 10.5 — Refactorizar task Celery para usar TRD

**Referencia:** `REGLAS_TRD_STRATEKAZ_SGI.md`, sección §3.3 (RN-TRD-006 a RN-TRD-008).

Cambiar `procesar_retencion_documentos` para usar `resolver_retencion()` en lugar del campo directo de TipoDocumento. Implementar umbrales de notificación: 90 días (ALERTA), 30 días (URGENTE), día 0 (CRÍTICO), transición gestión→central (INFO). Respetar RN-TRD-008 (no duplicar notificaciones).

### Tarea 10.6 — Validación de firma única por usuario por documento

**Archivo:** serializer o validación en el endpoint de asignación de firmantes.

```python
def validar_firmantes(documento, firmantes):
    """
    Valida que un mismo usuario no esté asignado a más de un rol
    de firma en el mismo documento.
    """
    usuarios = [f['usuario_id'] for f in firmantes]
    if len(usuarios) != len(set(usuarios)):
        raise ValidationError(
            'Un mismo usuario no puede ocupar dos roles de firma en el mismo documento. '
            'Si necesita crear y aprobar, asígnese solo como APROBÓ (aprobación directa).'
        )
```

Aplicar en:
- Wizard de creación (paso de asignación de firmantes).
- Endpoint de adopción PDF (Sprint 8).
- Cualquier endpoint que modifique firmantes de un documento.

### Tarea 10.7 — Validación de publicación solo con APROBÓ

**Archivo:** `DocumentoService.publicar()` o señal de transición de estado.

```python
def validar_publicacion(documento):
    """
    Verifica que existe al menos una firma con rol APROBÓ
    completada antes de permitir la publicación.
    """
    firma_aprobacion = FirmaDigital.objects.filter(
        documento=documento,
        rol='APROBO',
        estado='FIRMADA'
    ).exists()

    if not firma_aprobacion:
        raise ValidationError(
            'El documento no puede publicarse sin la firma de aprobación (APROBÓ). '
            'Verifique que el flujo de firmas incluya el rol APROBÓ.'
        )
```

---

## 6. Sprint 11 — Compresión y Almacenamiento

**Objetivo:** Implementar compresión automática y cuotas de almacenamiento por tenant.

### Tarea 11.1 — Compresión automática de PDFs

**Dependencia:** Ghostscript (`apt-get install -y ghostscript`).

```python
import subprocess
import tempfile

def comprimir_pdf(pdf_bytes, dpi=150):
    """Comprime PDF a resolución especificada usando Ghostscript."""
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_in:
        tmp_in.write(pdf_bytes)
        tmp_in_path = tmp_in.name

    tmp_out_path = tmp_in_path.replace('.pdf', '_compressed.pdf')

    subprocess.run([
        'gs', '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=/ebook',  # 150 DPI
        '-dNOPAUSE', '-dBATCH', '-dQUIET',
        f'-sOutputFile={tmp_out_path}',
        tmp_in_path
    ], check=True, timeout=120)

    with open(tmp_out_path, 'rb') as f:
        return f.read()
```

- Aplicar en TODOS los puntos de ingreso: `adoptar_pdf`, `archivar_registro`, `crear_desde_modulo`.
- Si el comprimido es MAYOR que el original (PDFs ya optimizados), conservar el original.
- Límite por archivo: rechazar archivos > 10 MB antes de compresión con mensaje descriptivo.

### Tarea 11.2 — Modelo de cuotas por tenant

```python
class CuotaAlmacenamiento(models.Model):
    empresa = models.OneToOneField('core.Empresa', on_delete=models.CASCADE)
    cuota_bytes = models.BigIntegerField(
        default=2_147_483_648,  # 2 GB
        verbose_name='Cuota de almacenamiento (bytes)'
    )
    uso_actual_bytes = models.BigIntegerField(default=0)

    @property
    def porcentaje_uso(self):
        if self.cuota_bytes == 0:
            return 100
        return round((self.uso_actual_bytes / self.cuota_bytes) * 100, 1)

    @property
    def alerta_80(self):
        return self.porcentaje_uso >= 80

    @property
    def alerta_90(self):
        return self.porcentaje_uso >= 90

    @property
    def cuota_excedida(self):
        return self.uso_actual_bytes >= self.cuota_bytes
```

- Actualizar `uso_actual_bytes` en cada upload y cada eliminación.
- Si `cuota_excedida`, rechazar upload con mensaje: "El espacio de almacenamiento de su empresa está lleno. Contacte al administrador para ampliar su plan."
- Mostrar barra de uso en el Dashboard del GD para Admin SGI.

---

## 7. Actualización de Documentos Existentes

### 7.1 Actualizaciones a `Arquitectura_Gestion_Documental_StrateKaz_v5.md`

Además de la actualización de §18 (Tarea 8.4), agregar:

**Nueva sección §3.4 — Caminos de Ingreso:**
Documentar los 2 caminos oficiales (A y B) como política de ingreso del módulo. Especificar que SOLO se acepta PDF.

**Actualizar §5.1 — Estados:**
Agregar estado `ELIMINADO` después de ARCHIVADO en la tabla de estados y transiciones.

**Actualizar §7 — Codificación:**
Agregar subsección sobre `codigo_legacy` y su relación con documentos adoptados.

**Actualizar §13 — Generación de PDF:**
Marcar como `[COMPLETADO]` la implementación del Design System completo (post Sprint 9).

**Agregar §20 — Política de Almacenamiento:**
Documentar planes, cuotas y compresión automática.

### 7.2 Actualizaciones a `DESIGN_SYSTEM_PDF_STRATEKAZ_SGI.md`

**Correcciones obligatorias:**

1. **§2 (Alcance Universal):** Agregar nota: documentos adoptados (Camino B) NO pasan por el Design System en su contenido, solo reciben sellado X.509. El Design System aplica solo a PDFs generados por el sistema (Camino A y actas C2).

2. **§4.1 (Tipografía):** Cambiar familia principal de `Segoe UI` a `Arial, Helvetica, sans-serif`. Segoe UI no está disponible en servidores Linux.

3. **§15 (Firmas):** Reescribir CSS de `display: flex` a `display: inline-block` con anchos porcentuales. WeasyPrint 60.x no soporta flex.

4. **§16 (Sellado X.509):** Reescribir CSS de `display: flex` a `float: left/right` + clearfix. WeasyPrint 60.x no soporta flex.

5. **§22 (CSS Completo):** Auditar TODOS los bloques CSS y reemplazar cualquier uso de flex o grid por alternativas compatibles (float, inline-block, table-cell).

### 7.3 Actualizaciones a `REGLAS_TRD_STRATEKAZ_SGI.md`

Agregar en §4.3 (Flujo por Tipo de Origen):
- Nuevo flujo: "Documentos adoptados (Camino B)" que describe cómo `asignar_trd_automatica()` aplica al momento de adopción (solo `trd_aplicada`, sin fechas hasta ARCHIVADO).

---

## 8. Checklist de Cierre del Módulo

### 8.1 Funcional — Bloqueante para Producción

| # | Item | Sprint | Verificación |
|---|------|--------|-------------|
| 1 | Camino B funciona: PDF externo → firmas → publicación → Mi Portal | 8 | Subir PDF real, asignar 2 firmantes, firmar, verificar en Mi Portal |
| 2 | Archivos no-PDF son rechazados con mensaje claro | 8 | Intentar subir .docx, .xlsx — debe rechazar |
| 3 | Código StrateKaz se asigna al adoptar, código legacy se guarda y es buscable | 8 | Buscar por código legacy en SearchModal |
| 4 | Design System completo en PDFs generados (Camino A) | 9 | Generar PDF de cada tipo y verificar visualmente |
| 5 | Header/footer aparece en todas las páginas | 9 | PDF de 5+ páginas con header/footer consistente |
| 6 | Firma única por usuario validada (rechazo si duplica) | 10 | Intentar asignar mismo usuario como ELABORÓ y APROBÓ |
| 7 | Solo APROBÓ puede publicar | 10 | Documento con solo ELABORÓ no puede pasar a PUBLICADO |
| 8 | Visor PDF embebido funciona para consulta y lectura obligatoria | 8 | Abrir documento en Mi Portal, aceptar lectura |
| 9 | TRD auto-asignada al crear documento (informativo) | 10 | Crear documento, verificar campo trd_aplicada |
| 10 | TRD fechas calculadas al archivar | 10 | Archivar documento, verificar fecha_fin_gestion y fecha_fin_central |
| 11 | Compresión automática reduce tamaño de PDFs escaneados | 11 | Subir PDF de 8MB, verificar que se guarda < 3MB |

### 8.2 No Bloqueante — Prioridad Media/Baja

| # | Item | Sprint | Verificación |
|---|------|--------|-------------|
| 12 | Validación mínimos legales en TRD | 10 | Intentar crear TRD con 2 años para historias clínicas (debe rechazar) |
| 13 | Estado ELIMINADO funciona con acta | 10 | Eliminar documento, verificar acta generada, doc oculto de vistas |
| 14 | Cuotas de almacenamiento por tenant | 11 | Llenar cuota, verificar rechazo de upload |
| 15 | Dashboard "Sin regla TRD" | 10 | Crear documento sin TRD, verificar que aparece en dashboard |
| 16 | Deuda técnica actualizada en documentación | 8 | Revisar §18 de Arquitectura v5 |

### 8.3 Orden de Ejecución Recomendado

```
Tarea 8.0   →  Sprint 8  →  Sprint 9  →  Sprint 10  →  Sprint 11
(Spike CSS)    (Camino B)   (Design)     (TRD+Firmas)  (Compresión)
 30 min         ~2-3 días   ~5-7 días    ~3-4 días     ~2-3 días
```

Tiempo estimado total: **13-18 días de desarrollo** con un agente Claude Code dedicado.

---

## Control de Cambios

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Abril 2026 | Camilo Rubiano Bustos | Plan inicial de cierre. 4 sprints (8-11), 23 tareas, checklist de 16 verificaciones. |
| 2.0 | Abril 2026 | Camilo Rubiano Bustos | **7 correcciones aplicadas:** (1) Eliminado Camino C — política solo PDF, no se acepta Word. (2) Corregida restricción CSS: NO flex ni grid en WeasyPrint 60.x, usar float/inline-block/table-cell. (3) Agregado spike `element()` como prerequisito bloqueante para Sprint 9. (4) Eliminado campo redundante `origen_documento` — se usa `es_externo` existente. (5) TRD timing corregido: `trd_aplicada` al crear (informativo), fechas solo al ARCHIVADO. (6) Eliminado rclone del plan de cierre (es post-MVP). (7) Tipografía corregida a Arial (no Segoe UI). Checklist renumerado. |

---

*Documento técnico de referencia — StrateKaz Consultoría 4.0*
*Las instrucciones de este plan se ejecutan con los documentos de referencia: Arquitectura v5, DESIGN_SYSTEM_PDF y REGLAS_TRD.*
