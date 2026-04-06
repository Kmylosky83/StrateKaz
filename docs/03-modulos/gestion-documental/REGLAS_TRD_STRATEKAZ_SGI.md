# REGLAS PARA LA TABLA DE RETENCIÓN DOCUMENTAL (TRD)

**StrateKaz SGI — Plataforma de Gestión Empresarial 360**
Versión 1.0 — Abril 2026
Elaborado por: Camilo Rubiano Bustos — StrateKaz Consultoría 4.0

> Marco normativo vigente: Acuerdo 001/2024 (AGN) | Ley 594/2000 | Decreto 1080/2015 | Decreto 1072/2015

---

## Tabla de Contenido

1. [Objetivo y Alcance](#1-objetivo-y-alcance)
2. [Arquitectura del Modelo TRD](#2-arquitectura-del-modelo-trd-en-stratekaz-sgi)
3. [Reglas de Negocio de la TRD](#3-reglas-de-negocio-de-la-trd)
4. [Mapeo Automático TRD para Registros C2](#4-mapeo-automático-trd-para-registros-generados-por-módulos-c2)
5. [Migración de Archivo Físico a Digital](#5-migración-de-archivo-físico-a-digital)
6. [Estructura AGN Simplificada para PyMEs](#6-estructura-agn-simplificada-para-pymes)
7. [Seed Inicial para PyMEs Colombianas](#7-seed-inicial-para-pymes-colombianas-con-sgi)
8. [Instrucciones Técnicas para Implementación](#8-instrucciones-técnicas-para-implementación)
9. [Glosario](#9-glosario)
10. [Control de Cambios](#10-control-de-cambios)

---

## 1. Objetivo y Alcance

### 1.1 Objetivo

Establecer las reglas de negocio, estructura técnica y criterios normativos que gobiernan la Tabla de Retención Documental (TRD) dentro de la plataforma StrateKaz SGI, garantizando el cumplimiento del marco regulatorio colombiano y la gestión automatizada del ciclo de vida documental.

### 1.2 Alcance

Este documento tiene doble propósito:

- **Reglas técnicas para la plataforma:** Definen cómo el modelo `TablaRetencionDocumental`, la task Celery y los endpoints API deben operar para automatizar retención, alertas y disposición final.
- **Documento entregable para clientes:** Sirve como guía para que las PyMEs colombianas configuren sus TRD dentro de StrateKaz SGI, con un seed inicial alineado al SGI (ISO 9001/14001/45001), SG-SST y PESV.

### 1.3 Marco Normativo Vigente

| Norma | Alcance |
|-------|---------|
| **Acuerdo 001 de 2024 (AGN)** | Acuerdo Único de la Función Archivística. **Deroga Acuerdo 004/2019.** Define etapas, instructivo y formato TRD (Anexo 6). |
| **Ley 594 de 2000** | Ley General de Archivos. Art. 24: obligatoriedad de TRD para entidades del Estado. Referente para empresas privadas con SGI. |
| **Decreto 1080 de 2015** | Decreto Único Reglamentario Sector Cultura. Art. 2.8.2.2.2: registro de valoración en TRD. Art. 2.8.2.2.5: eliminación de documentos. |
| **Decreto 1072 de 2015** | Decreto Único Reglamentario del Sector Trabajo. Define tiempos de conservación de registros SST (20 años mínimo para algunos). |
| **Resolución 0312 de 2019** | Estándares mínimos SG-SST. Evidencias documentales requeridas por estándar. |
| **Resolución 40595 de 2024** | Actualización estándares mínimos SST y PESV. Nuevos requisitos documentales. |
| **Ley 1581 de 2012** | Protección de datos personales. Impacta retención de documentos con datos sensibles. |
| **Resolución 2346 de 2007** | Historias clínicas ocupacionales: conservación mínima 20 años. |
| **ISO 9001/14001/45001** | Cláusulas 7.5 (Información documentada): control, retención y disposición. |

> ⚠️ **NOTA:** El Acuerdo 004 de 2019 fue derogado por el Acuerdo 001 de 2024. Todas las referencias en el sistema deben apuntar a la normativa vigente.

---

## 2. Arquitectura del Modelo TRD en StrateKaz SGI

### 2.1 Modelo Actual: `TablaRetencionDocumental`

El modelo ya existe en código dentro de la app `gestion_documental` y opera con la siguiente estructura:

| Campo | Tipo Django | Descripción / Regla |
|-------|-------------|---------------------|
| `tipo_documento` | FK → TipoDocumento | Tipo documental (PR, POL, FT, AC, MA, etc.). Obligatorio. |
| `proceso` | FK → Area | Proceso SGI al que aplica. Dinámico por tenant. Obligatorio. |
| `serie_documental` | CharField | Serie según nomenclatura AGN (ej: ACTAS, MANUALES, PROCEDIMIENTOS). |
| `tiempo_gestion_anos` | IntegerField | Años en archivo de gestión (acceso frecuente). Mínimo: 0. |
| `tiempo_central_anos` | IntegerField | Años en archivo central (consulta esporádica). Mínimo: 0. |
| `disposicion_final` | CharField choices | `ELIMINAR` \| `CONSERVAR_PERMANENTE` \| `SELECCIONAR` \| `DIGITALIZAR` |
| `soporte_legal` | TextField | Normativa que justifica la retención. Campo libre pero recomendado. |
| `requiere_acta_destruccion` | BooleanField | Si la eliminación requiere acta formal firmada. Default: `False`. |
| `activo` | BooleanField | Si esta regla está vigente. Default: `True`. |
| `empresa_id` | FK (tenant) | Aislamiento multi-tenant. Automático. |

#### Restricciones del modelo

- `unique_together`: `(tipo_documento, proceso, empresa_id)` — Una sola regla por combinación tipo+proceso por tenant.
- Property `tiempo_total_anos`: Retorna `tiempo_gestion_anos + tiempo_central_anos`.
- ViewSet filtra `activo=True` por defecto. RBAC: sección `configuracion`.
- Endpoint: `/api/gestion-documental/trd/` — CRUD completo (GET, POST, PUT, PATCH, DELETE).

### 2.2 Relación con `TipoDocumento.tiempo_retencion_anos`

Existe un campo global `TipoDocumento.tiempo_retencion_anos` (IntegerField, default=5, min=1) que define la retención genérica por tipo documental. Este campo funciona como **FALLBACK** cuando no existe una regla TRD específica para la combinación tipo+proceso.

> ✅ **REGLA DE PRIORIDAD:** TRD (tipo+proceso) > TipoDocumento.tiempo_retencion_anos (solo tipo). La TRD siempre tiene prioridad cuando existe una regla activa para la combinación específica.

---

## 3. Reglas de Negocio de la TRD

### 3.1 Reglas de Retención

#### RN-TRD-001: Resolución de tiempo de retención

Cuando el sistema necesita determinar el tiempo de retención de un documento, debe seguir esta lógica de resolución (prioridad descendente):

- **Paso 1:** Buscar en `TablaRetencionDocumental` una regla activa donde `tipo_documento = doc.tipo_documento AND proceso = doc.proceso AND activo = True`.
- **Paso 2 (Fallback):** Si no existe regla TRD, usar `doc.tipo_documento.tiempo_retencion_anos` como tiempo total, asignándolo 100% a archivo central, disposición `CONSERVAR_PERMANENTE`.
- **Paso 3 (Default absoluto):** Si tampoco existe tiempo en TipoDocumento, aplicar 5 años de retención total con disposición `CONSERVAR_PERMANENTE`.

```python
def resolver_retencion(documento):
    trd = TablaRetencionDocumental.objects.filter(
        tipo_documento=documento.tipo_documento,
        proceso=documento.proceso,
        activo=True,
        empresa_id=documento.empresa_id
    ).first()
    if trd:
        return {
            'gestion': trd.tiempo_gestion_anos,
            'central': trd.tiempo_central_anos,
            'total': trd.tiempo_total_anos,
            'disposicion': trd.disposicion_final,
            'requiere_acta': trd.requiere_acta_destruccion,
            'fuente': 'TRD'
        }
    fallback = documento.tipo_documento.tiempo_retencion_anos or 5
    return {
        'gestion': 0, 'central': fallback, 'total': fallback,
        'disposicion': 'CONSERVAR_PERMANENTE',
        'requiere_acta': False, 'fuente': 'FALLBACK'
    }
```

#### RN-TRD-002: Cálculo de fechas de retención

Las fechas de retención se calculan a partir del momento en que el documento entra en estado `ARCHIVADO` (`fecha_archivado`):

- `fecha_fin_gestion = fecha_archivado + tiempo_gestion_anos`
- `fecha_fin_central = fecha_fin_gestion + tiempo_central_anos`
- `fecha_disposicion_final = fecha_fin_central` (momento de ejecutar la disposición)

Para documentos que nunca se archivan explícitamente (ej: OBSOLETO directo), usar fecha de cambio a OBSOLETO como referencia.

#### RN-TRD-003: Fases del archivo

El sistema debe distinguir tres fases de archivo, mapeadas al ciclo de vida del documento:

| Fase | Estado Documento | Acceso | Acción Automática |
|------|-----------------|--------|-------------------|
| **Gestión** | ARCHIVADO (reciente) | Consulta frecuente, búsqueda activa | Ninguna — acceso normal |
| **Central** | ARCHIVADO (antiguo) | Consulta esporádica, solo lectura | Mover a sección "Archivo Central" |
| **Disposición Final** | ARCHIVADO (vencido) | Según disposición | Notificación + acción según regla |

### 3.2 Reglas de Disposición Final

#### RN-TRD-004: Tipos de disposición final

| Disposición | Acción del Sistema | Ejemplo de Uso |
|-------------|-------------------|----------------|
| **ELIMINAR (E)** | Marca el documento como ELIMINABLE. Requiere aprobación del Admin SGI. Si `requiere_acta_destruccion=True`, genera acta de eliminación automática. | Formatos de inspección sin valor histórico, listas de chequeo operativas |
| **CONSERVAR_PERMANENTE (CT)** | El documento permanece en archivo central indefinidamente. No se elimina nunca. Cambia etiqueta a "Archivo Histórico". | Políticas, manuales del SGI, actas de COPASST, historias clínicas ocupacionales |
| **SELECCIONAR (S)** | Admin SGI evalúa cuáles documentos de la serie conservar como muestra representativa y cuáles eliminar. Sistema genera listado para revisión. | Manuales de funciones (conservar última versión), informes periódicos |
| **DIGITALIZAR (D)** | Si el original es físico, generar copia digital certificada antes de eliminar el físico. En StrateKaz SGI (nativo digital), equivale a `CONSERVAR_PERMANENTE`. | Documentos históricos migrados de papel (ver sección 5) |

#### RN-TRD-005: Proceso de eliminación

La eliminación de documentos **NUNCA** es automática. El sistema debe:

- Generar notificación al Admin SGI cuando un documento alcanza su fecha de disposición final con disposición `ELIMINAR`.
- Si `requiere_acta_destruccion = True`: generar automáticamente un borrador de Acta de Eliminación Documental (tipo AC) vía `DocumentoService.crear_desde_modulo()` con los datos del lote de documentos a eliminar.
- El Admin SGI debe aprobar explícitamente la eliminación. El acta debe ser firmada digitalmente antes de ejecutar.
- Los documentos eliminados **no se borran físicamente**: se marcan como estado `ELIMINADO` (nuevo estado) y se ocultan de las vistas normales, pero permanecen en BD para trazabilidad de auditoría.
- El registro de eliminación queda en `audit_system` con: fecha, usuario que aprobó, acta de referencia, listado de documentos eliminados.

> 🔴 **PRINCIPIO AGN:** "Transparencia y máxima divulgación" (Decreto 1080/2015 Art. 2.8.2.2.5). Ningún documento se elimina sin acto administrativo trazable.

### 3.3 Reglas de Alertas y Automatización

#### RN-TRD-006: Task Celery — Gap crítico a corregir

La task actual `procesar_retencion_documentos` usa **SOLO** `TipoDocumento.tiempo_retencion_anos`. Debe refactorizarse para consultar primero la TRD:

```python
# ANTES (actual — INCORRECTO):
tiempo = doc.tipo_documento.tiempo_retencion_anos

# DESPUÉS (correcto — con TRD):
retencion = resolver_retencion(doc)  # Función RN-TRD-001
tiempo = retencion['total']
```

#### RN-TRD-007: Umbrales de notificación

La task Celery (semanal, lunes 6AM, queue `compliance`) debe generar notificaciones con estos umbrales:

| Umbral | Tipo | Destinatario | Acción |
|--------|------|-------------|--------|
| 90 días antes | ALERTA | Elaborador + Responsable proceso | Notificación informativa amarilla |
| 30 días antes | URGENTE | Elaborador + Admin SGI | Notificación urgente naranja |
| Día 0 (vencido) | CRÍTICO | Admin SGI | Según disposición: archivar/notificar eliminación |
| Transición gestión→central | INFO | Admin SGI | Mover documento a sección Archivo Central |

#### RN-TRD-008: No duplicar notificaciones

Si ya existe una notificación activa (no leída / no resuelta) para el mismo documento y mismo umbral, la task NO debe crear otra. Validar con:

```python
Notificacion.objects.filter(
    tipo='DOCUMENTO_RETENCION',
    referencia_id=doc.id,
    leida=False
).exists()
```

### 3.4 Reglas de Configuración por Tenant

#### RN-TRD-009: Aislamiento multi-tenant

Cada tenant (empresa) tiene su propia configuración TRD. El seed inicial carga reglas por defecto para los tipos y procesos estándar, pero el Admin SGI de cada empresa puede:

- Modificar tiempos de retención (siempre respetando mínimos legales).
- Agregar series/subseries propias de su actividad económica.
- Desactivar reglas no aplicables (`activo=False`), pero NO eliminarlas.
- La eliminación de reglas TRD solo es posible si no hay documentos asociados a esa combinación tipo+proceso.

#### RN-TRD-010: Mínimos legales no negociables

El sistema debe validar que los tiempos configurados no sean inferiores a los mínimos legales colombianos:

| Tipo de Documento | Mínimo Legal | Fundamento |
|-------------------|-------------|------------|
| Historias clínicas ocupacionales | 20 años | Res 2346/2007 Art 17 |
| Registros de capacitación SST | 20 años | Dto 1072/2015 Art 2.2.4.6.12 |
| Registros investigación AT/EL | 20 años | Dto 1072/2015; Res 1401/2007 |
| Actas COPASST | 10 años | Dto 1072/2015 Art 2.2.4.6.21 |
| Políticas del SGI | 10 años | ISO 9001/14001/45001 Cl 7.5 |
| Matrices de riesgo | 10 años | Dto 1072/2015 Art 2.2.4.6.15 |
| Documentos con datos personales | Según finalidad | Ley 1581/2012 Art 17(e) |
| Plan de emergencias | 7 años | Dto 1072/2015 Art 2.2.4.6.25 |
| Procedimientos del SGI | 7 años | ISO 9001 Cl 7.5 |
| Formatos operativos (sin valor histórico) | 4 años | Práctica archivística estándar |

> 🔴 **VALIDACIÓN EN SERIALIZER:** Si el Admin intenta guardar un `tiempo_total` < mínimo legal para un tipo de documento crítico, el serializer debe rechazar con mensaje: _"El tiempo total de retención ({X} años) es inferior al mínimo legal ({Y} años) según {norma}."_

---

## 4. Mapeo Automático TRD para Registros Generados por Módulos C2

### 4.1 Principio: Todo Registro Nace con TRD Asignada

Cuando un módulo C2 (HSEQ, Talento Humano, PESV, BPM) genera un documento —ya sea vía `DocumentoService.crear_desde_modulo()` o `DocumentoService.archivar_registro()`— el sistema **debe asignar automáticamente** la regla TRD correspondiente sin intervención del usuario.

### 4.2 Lógica de Mapeo Automático

El mapeo se ejecuta en el momento de creación del documento, dentro de `DocumentoService`:

```python
def asignar_trd_automatica(documento):
    """
    Se ejecuta automáticamente al crear/archivar un documento.
    Busca la regla TRD por tipo_documento + proceso del documento.
    """
    trd = TablaRetencionDocumental.objects.filter(
        tipo_documento=documento.tipo_documento,
        proceso=documento.proceso,
        activo=True,
        empresa_id=documento.empresa_id
    ).first()

    if trd:
        documento.trd_aplicada = trd
        documento.fecha_fin_gestion = calcular_fecha(
            documento.fecha_archivado, trd.tiempo_gestion_anos
        )
        documento.fecha_fin_central = calcular_fecha(
            documento.fecha_fin_gestion, trd.tiempo_central_anos
        )
        documento.disposicion_asignada = trd.disposicion_final
    else:
        # Fallback: usar TipoDocumento.tiempo_retencion_anos
        documento.trd_aplicada = None  # Marca que no hay TRD específica
        documento.disposicion_asignada = 'CONSERVAR_PERMANENTE'
        # Se loguea en dashboard "sin regla TRD"

    documento.save(update_fields=[
        'trd_aplicada', 'fecha_fin_gestion',
        'fecha_fin_central', 'disposicion_asignada'
    ])
```

### 4.3 Flujo por Tipo de Origen

#### Actas (desde módulos C2)

Cuando HSEQ genera un Acta de COPASST o Talento genera un Acta de Convivencia:

1. El módulo C2 llama a `DocumentoService.crear_desde_modulo(tipo='AC', proceso=proceso_sst)`.
2. El documento entra al Gestor Documental con estado según flujo (si necesita firmas → `BORRADOR`, si es acta auto-generada → `ARCHIVADO`).
3. `asignar_trd_automatica()` busca la regla TRD para `AC + SST` → encuentra: 2 años gestión + 8 años central + CT.
4. Las fechas de retención se calculan y almacenan en el documento.
5. La task Celery semanal monitorea estas fechas automáticamente.

#### Registros operativos (inspecciones, capacitaciones, EPP)

Cuando SST registra una inspección de seguridad o una entrega de EPP:

1. El módulo C2 llama a `DocumentoService.archivar_registro(tipo='FT', proceso=proceso_sst, archivo=pdf_bytes)`.
2. El documento entra **directo** a estado `ARCHIVADO` con `es_auto_generado=True`.
3. `asignar_trd_automatica()` busca la regla TRD para `FT + SST` → encuentra: 1 año gestión + 3 años central + E (con acta).
4. A los 4 años totales, la task Celery notifica al Admin SGI para ejecutar eliminación con acta.

#### Formularios llenados (Form Builder)

Cuando un operario llena un formulario dinámico desde cualquier módulo:

1. El formulario se renderiza a PDF por el generador estandarizado.
2. Se archiva vía `archivar_registro(tipo='RG', proceso=proceso_del_formulario)`.
3. La TRD aplica según la combinación `RG + proceso`.

### 4.4 Dashboard "Sin Regla TRD"

Para documentos donde no existe una regla TRD específica (fallback activado), el sistema debe:

- Marcar el documento con `trd_aplicada = NULL`.
- Agregar entrada al dashboard de Admin SGI bajo sección **"Documentos sin TRD específica"**.
- Mostrar: código del documento, tipo, proceso, fecha de creación, y un botón "Crear regla TRD" que pre-llena el formulario de TRD con el tipo y proceso del documento.
- Este dashboard permite al Admin SGI detectar combinaciones tipo+proceso que necesitan regla TRD propia.

> ✅ **REGLA:** El fallback a `TipoDocumento.tiempo_retencion_anos` garantiza que ningún documento queda sin retención. Pero el dashboard "Sin regla TRD" permite al Admin cerrar esas brechas proactivamente.

### 4.5 Campos Nuevos en Modelo Documento

Para soportar el mapeo automático, agregar al modelo `Documento`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `trd_aplicada` | FK → TablaRetencionDocumental (nullable) | Regla TRD aplicada. NULL = fallback. |
| `fecha_fin_gestion` | DateField (nullable) | Fecha calculada de fin de fase gestión. |
| `fecha_fin_central` | DateField (nullable) | Fecha calculada de fin de fase central. |
| `disposicion_asignada` | CharField choices (nullable) | Disposición final asignada al momento del archivo. |

---

## 5. Migración de Archivo Físico a Digital

### 5.1 Contexto

La mayoría de PyMEs colombianas que adoptan StrateKaz SGI vienen de un sistema documental basado en papel (carpetas AZ, archivadores, legajos). El proceso de migración requiere reglas claras para:

- Digitalizar el archivo histórico vigente.
- Clasificar los documentos digitalizados dentro de la estructura TRD.
- Determinar qué se conserva, qué se elimina y qué se digitaliza del archivo físico.

### 5.2 Principios de la Migración

1. **No todo se digitaliza.** Solo se digitalizan documentos que aún tienen valor legal, administrativo o histórico según la TRD. Un formato de inspección de hace 6 años con disposición ELIMINAR y retención total de 4 años ya cumplió su ciclo y puede destruirse sin digitalizar.

2. **La TRD manda.** Antes de escanear un solo documento, la empresa debe tener su TRD configurada en StrateKaz SGI. La TRD determina qué vale la pena digitalizar.

3. **Calidad sobre cantidad.** Un PDF mal escaneado sin metadatos es peor que no tenerlo. Cada documento digitalizado debe tener: resolución mínima 200 DPI, formato PDF/A, metadatos completos (tipo, proceso, fecha, código).

### 5.3 Fases de la Migración

#### Fase 1: Inventario del Archivo Físico

Antes de digitalizar, levantar inventario de lo que existe:

| Dato a Recoger | Ejemplo |
|----------------|---------|
| Ubicación física | Archivador 3, Cajón 2, Carpeta "SST 2020" |
| Serie documental | ACTAS |
| Tipo documental | Acta de COPASST |
| Proceso asociado | SST |
| Rango de fechas | Ene 2020 — Dic 2022 |
| Volumen aproximado | ~48 actas (mensuales × 2 años) |
| Estado de conservación | Bueno / Regular / Deteriorado |

> 💡 **TIP:** StrateKaz SGI puede generar un formulario de inventario desde el Form Builder para que el equipo lo llene en campo con tablet/celular.

#### Fase 2: Valoración con TRD

Con el inventario listo, cruzar contra la TRD:

| Resultado del Cruce | Acción |
|---------------------|--------|
| Documento dentro de período de retención + disposición CT | **Digitalizar obligatoriamente** |
| Documento dentro de período de retención + disposición E | **Digitalizar** (aún tiene valor legal) |
| Documento fuera de período de retención + disposición CT | **Digitalizar** (conservación permanente) |
| Documento fuera de período de retención + disposición E | **No digitalizar.** Generar acta de eliminación y destruir. |
| Documento fuera de período de retención + disposición S | **Seleccionar:** digitalizar muestra representativa, destruir el resto. |
| Documento sin TRD aplicable | **Valorar caso a caso.** En duda, digitalizar. |

#### Fase 3: Digitalización e Ingesta

Proceso técnico de escaneo e ingesta al sistema:

**Requisitos técnicos del escaneo:**
- Resolución mínima: 200 DPI (300 DPI recomendado para documentos con texto pequeño).
- Formato: PDF (el sistema lo convierte internamente si es necesario).
- Color: Escala de grises para documentos de texto. Color para documentos con firmas, sellos o fotografías.
- OCR: Recomendado para documentos de texto, permite búsqueda full-text posterior.

**Ingesta al sistema:**
- Usar la funcionalidad de **ingesta masiva por lote** del Gestor Documental.
- Cada documento se ingesta vía `DocumentoService.archivar_registro()` con:
  - `tipo_documento`: según clasificación del inventario.
  - `proceso`: según clasificación del inventario.
  - `modulo_origen`: `'MIGRACION_FISICA'` (identificador especial para rastrear documentos migrados).
  - `fecha_archivado`: fecha original del documento (NO la fecha de escaneo).
  - `metadata_migracion`: JSON con datos de procedencia física (ubicación, estado, operador de escaneo).
- El sistema ejecuta `asignar_trd_automatica()` sobre cada documento ingresado.
- Las fechas de retención se calculan desde la `fecha_archivado` original, no desde la fecha de ingesta.

#### Fase 4: Conciliación y Destrucción del Físico

Una vez completada la digitalización de un lote:

1. **Verificación de integridad:** El Admin SGI verifica que todos los documentos del lote están correctamente digitalizados, con metadatos completos y legibles.
2. **Generación de acta de migración:** El sistema genera un Acta de Migración Documental (tipo AC) que lista todos los documentos migrados del lote, con su ubicación física original y su nuevo código digital.
3. **Período de coexistencia:** Se recomienda mantener el archivo físico por un período mínimo de 6 meses después de la migración completa, como respaldo.
4. **Destrucción del físico:** Pasado el período de coexistencia, generar Acta de Eliminación Documental para el archivo físico. La destrucción debe ser segura (trituración para documentos confidenciales).

### 5.4 Reglas Específicas para Documentos Migrados

#### RN-MIG-001: Identificación de origen

Todo documento migrado desde archivo físico debe tener `modulo_origen = 'MIGRACION_FISICA'`. Esto permite:
- Filtrar documentos migrados en el listado maestro.
- Reportes de avance de migración.
- Auditoría de completitud del archivo digital vs. físico.

#### RN-MIG-002: Fecha de referencia para retención

La fecha de retención de un documento migrado se calcula desde su **fecha original** (fecha del documento físico), NO desde la fecha de escaneo/ingesta. Si un acta de COPASST es de enero 2020 y se escanea en abril 2026, la retención se cuenta desde enero 2020.

#### RN-MIG-003: Documentos deteriorados

Si un documento físico está deteriorado y no es legible al 100%:
- Digitalizar lo que sea posible.
- Marcar el documento digital con `observaciones = 'Documento fuente deteriorado. Digitalización parcial.'`.
- Si el documento es de conservación permanente (CT), conservar también el original físico.

#### RN-MIG-004: Firmas en documentos migrados

Los documentos físicos migrados conservan sus firmas manuscritas en la imagen escaneada. El sistema NO aplica firma digital X.509 ni sellado pyHanko sobre documentos migrados. El PDF escaneado es la evidencia tal cual existía en físico.

### 5.5 Cronograma Típico de Migración

Para una PyME típica (50-200 empleados, 5-10 años de operación):

| Fase | Duración Estimada | Responsable |
|------|-------------------|-------------|
| Inventario del archivo físico | 1-2 semanas | Auxiliar administrativo + Consultor StrateKaz |
| Configuración TRD en el sistema | 1-3 días | Admin SGI (con seed como base) |
| Valoración con TRD | 2-3 días | Consultor StrateKaz + Líder de proceso |
| Digitalización e ingesta | 2-6 semanas | Auxiliar + validación del Admin SGI |
| Conciliación y verificación | 1 semana | Admin SGI |
| Período de coexistencia | 6 meses | (monitoreo pasivo) |
| Destrucción del archivo físico | 1-2 días | Admin SGI + Acta formal |

---

## 6. Estructura AGN Simplificada para PyMEs

### 6.1 Mapeo AGN → StrateKaz SGI

El formato oficial del AGN (Acuerdo 001 de 2024, Anexo 6) define columnas específicas para las TRD de entidades públicas. Para PyMEs privadas con SGI, StrateKaz SGI implementa un modelo híbrido: la estructura completa del AGN vive en el backend, pero la interfaz de usuario simplifica la experiencia:

| Concepto AGN | Campo StrateKaz | Interfaz Usuario |
|-------------|----------------|-----------------|
| Código Dependencia | `proceso` (FK → Area) | Selector de proceso (dinámico) |
| Serie Documental | `serie_documental` | Campo de texto con autocompletado |
| Subserie Documental | Implícito en `tipo_documento` | Se infiere del TipoDocumento |
| Tipos Documentales | `tipo_documento` (FK) | Selector filtrado por serie |
| Retención Archivo Gestión | `tiempo_gestion_anos` | Input numérico (años) |
| Retención Archivo Central | `tiempo_central_anos` | Input numérico (años) |
| Disposición Final (CT/E/S/D) | `disposicion_final` | Selector con 4 opciones |
| Procedimiento | `soporte_legal` + `requiere_acta` | Textarea + toggle de acta |
| Convenciones | N/A (en header del PDF) | Leyenda automática en exportación |

### 6.2 Lo que StrateKaz Agrega sobre el Formato AGN

Campos propios de la plataforma que no existen en el formato AGN estándar pero añaden valor para la automatización:

- **`requiere_acta_destruccion`:** Automatiza la generación de actas de eliminación (requisito de Decreto 1080/2015).
- **`activo`:** Permite desactivar reglas sin perder histórico.
- **`empresa_id` (tenant):** Aislamiento total entre empresas.
- **Task Celery automatizada:** El AGN exige revisión periódica; StrateKaz la automatiza semanalmente.
- **`tiempo_total_anos` (property):** Cálculo derivado que simplifica reportes.
- **`trd_aplicada` en Documento:** Trazabilidad directa de qué regla TRD gobierna cada documento.
- **Dashboard "Sin regla TRD":** Gestión proactiva de brechas de configuración.

---

## 7. Seed Inicial para PyMEs Colombianas con SGI

Este seed carga las reglas TRD por defecto cuando se activa el módulo de Gestión Documental en un nuevo tenant. Cubre las series documentales típicas de una PyME con Sistema de Gestión Integrado (ISO 9001/14001/45001), SG-SST y PESV.

### 7.1 Convenciones de Disposición Final

- **CT** = Conservación Total (permanente)
- **E** = Eliminación (con o sin acta según regla)
- **S** = Selección (muestra representativa)
- **D** = Digitalización (para documentos de origen físico)

### 7.2 Códigos de Proceso (referencia dinámica)

Los códigos de proceso dependen de la configuración del tenant. Los códigos usados en este seed son los típicos del seed de organización:

- **GE** = Gestión Estratégica / Gerencial
- **SST** = Seguridad y Salud en el Trabajo
- **TH** = Talento Humano / Gestión Humana
- **PESV** = Plan Estratégico de Seguridad Vial
- **GA** = Gestión Ambiental

### 7.3 Tabla de Seed TRD

| Serie | Subserie | Tipo | Proc. | Gest. | Cent. | Disp. | Soporte Legal | Acta |
|-------|----------|------|-------|-------|-------|-------|---------------|------|
| ACTAS | Actas de Comité COPASST | AC | SST | 2 | 8 | CT | Dto 1072/2015 Art 2.2.4.6.21; Res 0312/2019 | No |
| ACTAS | Actas de Comité de Convivencia | AC | TH | 2 | 5 | E | Ley 1010/2006 Art 9; Res 652/2012 | Sí |
| ACTAS | Actas Revisión por la Dirección | AC | GE | 2 | 8 | CT | ISO 9001:2015 Cláusula 9.3 | No |
| ACTAS | Actas de Comité de Seguridad Vial | AC | PESV | 2 | 5 | CT | Res 40595/2024; Ley 1503/2011 | No |
| MANUALES | Manual del SGI | MA | GE | 0 | 10 | CT | ISO 9001/14001/45001; Dto 1072/2015 | No |
| MANUALES | Manual de Funciones | MA | TH | 0 | 10 | S | Dto 1083/2015 | No |
| PLANES | Plan de Emergencias | PL | SST | 2 | 5 | S | Dto 1072/2015 Art 2.2.4.6.25 | Sí |
| PLANES | Plan Estratégico de Seguridad Vial | PL | PESV | 2 | 8 | CT | Ley 1503/2011; Res 40595/2024 | No |
| PLANES | Plan de Gestión Ambiental | PL | GA | 2 | 5 | S | ISO 14001:2015 Cl 6.2 | Sí |
| POLÍTICAS | Política SST | POL | SST | 0 | 10 | CT | Dto 1072/2015 Art 2.2.4.6.5 | No |
| POLÍTICAS | Política de Calidad | POL | GE | 0 | 10 | CT | ISO 9001:2015 Cl 5.2 | No |
| POLÍTICAS | Política Ambiental | POL | GA | 0 | 10 | CT | ISO 14001:2015 Cl 5.2 | No |
| POLÍTICAS | Política de Protección de Datos | POL | GE | 0 | 10 | CT | Ley 1581/2012; Dto 1377/2013 | No |
| PROCEDIMIENTOS | Procedimiento de Auditorías Internas | PR | GE | 2 | 5 | E | ISO 19011:2018; ISO 9001 Cl 9.2 | Sí |
| PROCEDIMIENTOS | Procedimiento Acciones Correctivas | PR | GE | 2 | 5 | E | ISO 9001 Cl 10.2 | Sí |
| PROCEDIMIENTOS | Procedimiento Investigación AT/EL | PR | SST | 2 | 8 | CT | Dto 1072/2015 Art 2.2.4.6.32; Res 1401/2007 | No |
| PROCEDIMIENTOS | Procedimiento Gestión del Cambio | PR | GE | 2 | 5 | E | ISO 9001 Cl 6.3; ISO 45001 Cl 8.1.3 | Sí |
| FORMATOS | Formato Inspección de Seguridad | FT | SST | 1 | 3 | E | Dto 1072/2015 Art 2.2.4.6.12 | Sí |
| FORMATOS | Formato Entrega EPP | FT | SST | 1 | 3 | E | Dto 1072/2015 Art 2.2.4.6.24 | Sí |
| FORMATOS | Formato Lista de Asistencia | FT | TH | 1 | 2 | E | Dto 1072/2015 Art 2.2.4.6.11 | Sí |
| FORMATOS | Formato Reporte Condiciones Inseguras | FT | SST | 1 | 3 | E | Dto 1072/2015 Art 2.2.4.6.12 | Sí |
| FORMATOS | Formato Inspección Vehicular | FT | PESV | 1 | 3 | E | Res 40595/2024 | Sí |
| REGISTROS | Registros de Capacitación SST | RG | SST | 2 | 20 | CT | Dto 1072/2015 Art 2.2.4.6.12; Res 0312 Est 2.11 | No |
| REGISTROS | Historias Clínicas Ocupacionales | RG | SST | 0 | 20 | CT | Res 2346/2007 Art 17; Ley 594/2000 | No |
| REGISTROS | Registros de Investigación AT/EL | RG | SST | 2 | 20 | CT | Dto 1072/2015 Art 2.2.4.6.32; Res 1401/2007 | No |
| REGISTROS | Registros de Auditoría | RG | GE | 2 | 5 | S | ISO 9001 Cl 9.2.2 | Sí |
| MATRICES | Matriz de Riesgos y Peligros | MT | SST | 0 | 10 | CT | Dto 1072/2015 Art 2.2.4.6.15; GTC 45 | No |
| MATRICES | Matriz de Aspectos Ambientales | MT | GA | 0 | 10 | CT | ISO 14001 Cl 6.1.2 | No |
| MATRICES | Matriz Legal | MT | GE | 0 | 10 | CT | Dto 1072/2015 Art 2.2.4.6.8 | No |
| PROGRAMAS | Programa de Capacitación SST | PG | SST | 2 | 5 | E | Dto 1072/2015 Art 2.2.4.6.11 | Sí |
| PROGRAMAS | Programa de Vigilancia Epidemiológica | PG | SST | 2 | 10 | CT | Dto 1072/2015 Art 2.2.4.6.24 | No |
| INFORMES | Informe Revisión por la Dirección | IF | GE | 2 | 5 | S | ISO 9001 Cl 9.3.3 | Sí |
| INFORMES | Informe de Rendición de Cuentas SST | IF | SST | 2 | 5 | E | Dto 1072/2015 Art 2.2.4.6.31 | Sí |

> 📝 **NOTA:** Este seed es una base recomendada. Cada empresa debe ajustar series, tiempos y disposiciones según su actividad económica, tamaño y normativa sectorial específica. El Admin SGI puede agregar, modificar o desactivar reglas desde el módulo de configuración.

---

## 8. Instrucciones Técnicas para Implementación

Esta sección contiene las instrucciones precisas para que el equipo de desarrollo (Claude Code agents) implemente las correcciones y mejoras al sistema TRD.

### 8.1 Corrección Crítica: Conectar Task Celery a la TRD

> 🔴 **PRIORIDAD: ALTA.** La task `procesar_retencion_documentos` actualmente ignora la TRD. Sin esta corrección, la TRD no tiene efecto real en el sistema.

#### Paso 1: Crear función `resolver_retencion()`

**Ubicación:** `backend/apps/gestion_estrategica/gestion_documental/services.py` (o `utils.py`)

Implementar la función exactamente como se define en RN-TRD-001 (sección 3.1). Debe recibir un `Documento` y retornar un diccionario con `gestion`, `central`, `total`, `disposicion`, `requiere_acta` y `fuente`.

#### Paso 2: Refactorizar task Celery

**Archivo:** la task `procesar_retencion_documentos`.

Cambio: Reemplazar la línea que usa `doc.tipo_documento.tiempo_retencion_anos` por la llamada a `resolver_retencion(doc)`.

Mantener los umbrales actuales (90d alerta, 30d urgente, día 0 crítico) pero agregar:

- Umbral de transición gestión → central: cuando `fecha_archivado + tiempo_gestion_anos` se cumple.
- Usar `disposicion_final` de la TRD para determinar la acción en día 0 (no siempre archivar).
- Respetar RN-TRD-008 (no duplicar notificaciones).

#### Paso 3: Validación de mínimos legales en serializer

**Archivo:** serializer de `TablaRetencionDocumental`.

Agregar validación en `validate()` que compare `tiempo_total` contra una tabla de mínimos legales (ver RN-TRD-010). Implementar como diccionario configurable, no hardcoded en el serializer.

### 8.2 Campos Nuevos en Modelo Documento

Agregar al modelo `Documento` los campos de la sección 4.5:

```python
# Nuevos campos para mapeo TRD automático
trd_aplicada = models.ForeignKey(
    'TablaRetencionDocumental',
    on_delete=models.SET_NULL,
    null=True, blank=True,
    verbose_name='Regla TRD Aplicada'
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

### 8.3 Función `asignar_trd_automatica()`

Ubicación: `DocumentoService`.

Implementar como se define en sección 4.2. Llamar automáticamente desde:
- `DocumentoService.crear_desde_modulo()` — después de crear el documento.
- `DocumentoService.archivar_registro()` — después de archivar el registro.
- Transición a estado `ARCHIVADO` — para documentos que pasan por el ciclo completo.

### 8.4 Seed Data

Crear management command: `python manage.py seed_trd`

Comportamiento:

- Ejecutar SOLO si `TablaRetencionDocumental.objects.filter(empresa_id=tenant).count() == 0`.
- Mapear códigos de proceso (GE, SST, TH, PESV, GA) a las `Area` del tenant actual. Si un proceso no existe, skip con warning.
- Mapear códigos de tipo (PR, POL, FT, etc.) a `TipoDocumento` del tenant. Si un tipo no existe, skip con warning.
- Cargar los 33 registros del seed (sección 7.3) como reglas activas.
- Log de resumen: X reglas creadas, Y omitidas por proceso inexistente, Z omitidas por tipo inexistente.

### 8.5 Nuevo Estado: ELIMINADO

Agregar `ELIMINADO` al choice de estado del `Documento` (después de ARCHIVADO). Un documento ELIMINADO:

- No aparece en ninguna vista normal (listado maestro, búsqueda, mi portal).
- Solo visible desde panel de admin o reporte de auditoría.
- Conserva todos sus datos, archivos y metadatos. Es una eliminación **lógica**, NO física.
- Tiene referencia al Acta de Eliminación (FK nullable a Documento tipo AC).

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

### 8.6 Soporte para Migración Física

Agregar campo `metadata_migracion` al modelo `Documento`:

```python
metadata_migracion = models.JSONField(
    null=True, blank=True,
    verbose_name='Metadatos de migración física',
    help_text='Datos de procedencia: ubicación física, estado, operador'
)
```

Estructura esperada del JSON:

```json
{
    "ubicacion_fisica": "Archivador 3, Cajón 2",
    "estado_conservacion": "BUENO",
    "operador_escaneo": "María García",
    "fecha_escaneo": "2026-04-10",
    "resolucion_dpi": 300,
    "observaciones": "Documento completo, sin deterioro"
}
```

Crear valor especial para `modulo_origen`: `'MIGRACION_FISICA'`.

### 8.7 Exportación PDF de la TRD

Crear endpoint `GET /api/gestion-documental/trd/exportar-pdf/` que genere un PDF con formato AGN simplificado:

- **Header:** Logo + nombre + NIT del tenant (datos de Fundación).
- **Título:** "TABLA DE RETENCIÓN DOCUMENTAL".
- **Agrupado por** `serie_documental`.
- **Columnas:** Código Proceso | Serie | Subserie (TipoDocumento) | Gestión (años) | Central (años) | Total | Disposición | Soporte Legal.
- **Footer:** Convenciones (CT, E, S, D) + fecha de generación + "StrateKaz | Consultoría 4.0".
- Usar WeasyPrint con el template estandarizado del módulo.

### 8.8 Dashboard "Sin Regla TRD"

Crear endpoint `GET /api/gestion-documental/trd/sin-regla/` que retorne:

```json
{
    "total_sin_trd": 12,
    "por_combinacion": [
        {
            "tipo_documento_codigo": "AC",
            "tipo_documento_nombre": "Acta",
            "proceso_codigo": "COM",
            "proceso_nombre": "Comercial",
            "cantidad_documentos": 5,
            "usando_fallback": true,
            "tiempo_fallback": 5
        }
    ]
}
```

Agregar componente React en la sección de Configuración TRD que muestre este dashboard con botón "Crear regla" por cada combinación detectada.

---

## 9. Glosario

| Término | Definición |
|---------|-----------|
| **TRD** | Tabla de Retención Documental. Instrumento archivístico que establece tiempos de conservación y disposición final por serie documental. |
| **Serie Documental** | Agrupación de documentos del mismo tipo producidos por una dependencia en desarrollo de sus funciones. |
| **Subserie Documental** | Subgrupo dentro de una serie, con características más específicas. |
| **Archivo de Gestión** | Fase donde los documentos están en uso activo y consulta frecuente. |
| **Archivo Central** | Fase de conservación para documentos con consulta esporádica, pendientes de disposición final. |
| **Disposición Final** | Decisión sobre el destino del documento al cumplir su tiempo de retención. |
| **Valoración Documental** | Proceso de análisis para determinar valores primarios (administrativo, legal, fiscal) y secundarios (histórico, científico) de los documentos. |
| **RUSD** | Registro Único de Series Documentales del AGN. |
| **Convalidación** | Certificación por parte del AGN o Consejo Territorial de que la TRD cumple requisitos técnicos. |
| **SGI** | Sistema de Gestión Integrado (ISO 9001 + 14001 + 45001). |
| **Módulo C2** | Módulo de negocio en la arquitectura de capas StrateKaz (HSEQ, Talento, PESV, BPM). |
| **Capa CT** | Capa Transversal en la arquitectura StrateKaz. El Gestor Documental y el Workflow Engine viven aquí. |
| **Admin SGI** | Rol de usuario con permisos de configuración del sistema de gestión. |

---

## 10. Control de Cambios

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Abril 2026 | Camilo Rubiano Bustos | Documento inicial. 10 reglas de negocio TRD, 4 reglas de migración, seed 33 registros SGI/SST/PESV, mapeo automático C2, instrucciones de implementación. |
