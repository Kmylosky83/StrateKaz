# DESIGN SYSTEM — PDFs StrateKaz SGI

**StrateKaz SGI — Plataforma de Gestión Empresarial 360**
Versión 1.0 — Abril 2026
Elaborado por: Camilo Rubiano Bustos — StrateKaz Consultoría 4.0

---

## Tabla de Contenido

1. [Principio Fundamental](#1-principio-fundamental)
2. [Alcance Universal](#2-alcance-universal)
3. [Paleta de Colores](#3-paleta-de-colores)
4. [Tipografía](#4-tipografía)
5. [Configuración de Página](#5-configuración-de-página)
6. [Header Running](#6-header-running)
7. [Footer Running](#7-footer-running)
8. [Sistema de Headings](#8-sistema-de-headings)
9. [Tablas](#9-tablas)
10. [Callout Boxes (Cajas Informativas)](#10-callout-boxes-cajas-informativas)
11. [Badges de Estado](#11-badges-de-estado)
12. [Líneas Separadoras](#12-líneas-separadoras)
13. [Bloques de Código / Referencia Normativa](#13-bloques-de-código--referencia-normativa)
14. [Listas](#14-listas)
15. [Bloque de Firmas Dinámico](#15-bloque-de-firmas-dinámico)
16. [Sellado X.509 y QR](#16-sellado-x509-y-qr)
17. [Marcas de Agua](#17-marcas-de-agua)
18. [Portada de Documento](#18-portada-de-documento)
19. [Layout por Tipo de Documento](#19-layout-por-tipo-de-documento)
20. [Variables CSS Dinámicas por Tenant](#20-variables-css-dinámicas-por-tenant)
21. [Integración con el Generador Python](#21-integración-con-el-generador-python)
22. [CSS Completo](#22-css-completo)
23. [HTML de Referencia](#23-html-de-referencia)

---

## 1. Principio Fundamental

> **Todo documento que pase por StrateKaz SGI — sin importar su origen — sale con la misma identidad visual profesional.**

El Design System es la capa de presentación que se inyecta como CSS base en el generador WeasyPrint. Los colores del tenant (branding) se aplican de forma sutil en puntos específicos (logo, nombre, acentos), pero el estándar profesional de StrateKaz prevalece siempre. El resultado es un PDF que un auditor ISO, un cliente o un ente regulador reconoce inmediatamente como un documento controlado, confiable y profesional.

---

## 2. Alcance Universal

Este Design System se aplica a **TODO** PDF generado por la plataforma:

| Origen del Documento | Ejemplo | ¿Aplica Design System? |
|---------------------|---------|----------------------|
| Creación manual (wizard) | Política SST, Procedimiento de auditoría | ✅ Sí |
| Formulario auto-generado | Inspección de seguridad, Lista de asistencia | ✅ Sí |
| Acta desde módulo C2 | Acta de COPASST, Acta de Convivencia | ✅ Sí |
| Reporte del sistema | TRD exportada, Listado maestro, Dashboard | ✅ Sí |
| Acta de eliminación | Generada automáticamente por TRD | ✅ Sí |
| **PDF externo adoptado (Camino B)** | Documento PDF subido por el usuario | ❌ **No** — se sirve el PDF original, solo recibe sellado X.509. NO se re-procesa ni se modifica el contenido |
| Documento migrado (archivo físico) | PDF escaneado de archivo físico | ❌ **No** — se archiva el PDF tal cual. Solo metadata |

**Regla:** Si un PDF es **generado** por StrateKaz, lleva el Design System. Los PDFs **adoptados** (Camino B) se sirven tal cual con sellado X.509 añadido, sin modificar su contenido ni apariencia.

> **Política de formato:** El sistema SOLO acepta archivos PDF. No se acepta Word, Excel, ni ningún otro formato. Si el usuario tiene un documento en otro formato, debe convertirlo a PDF antes de subirlo.

---

## 3. Paleta de Colores

### 3.1 Colores Fijos del Sistema (NO cambian por tenant)

Estos colores definen la identidad profesional de StrateKaz SGI y se usan en la estructura del documento (headings, tablas, callouts, footer).

**Primarios del documento:**

| Nombre | HEX | Uso |
|--------|-----|-----|
| `--sk-navy` | `#1B4F72` | Headers H1, bordes de tabla header, líneas principales. El color ancla del documento. |
| `--sk-blue` | `#2E86C1` | Headers H2, bordes laterales de callout info, acentos secundarios. |
| `--sk-blue-light` | `#D6EAF8` | Fondo de filas pares en tablas, fondo de callout info. |
| `--sk-blue-lightest` | `#EBF5FB` | Fondo sutil para secciones destacadas. |

**Texto:**

| Nombre | HEX | Uso |
|--------|-----|-----|
| `--sk-dark` | `#2C3E50` | Texto principal del cuerpo. |
| `--sk-dark-soft` | `#34495E` | Headers H3, texto secundario fuerte. |
| `--sk-gray-600` | `#5A6978` | Texto de apoyo, descripciones. |
| `--sk-gray-500` | `#85929E` | Texto terciario, footer, metadata. |
| `--sk-gray-300` | `#BDC3C7` | Bordes suaves, líneas separadoras secundarias. |
| `--sk-gray-100` | `#EAECEE` | Fondos alternos muy suaves. |
| `--sk-gray-50` | `#F4F6F7` | Fondo de bloques de código/referencia. |

**Semánticos:**

| Nombre | HEX | Fondo | Borde | Uso |
|--------|-----|-------|-------|-----|
| `--sk-success` | `#27AE60` | `#E8F8F5` | `#82E0AA` | Callout OK, badge Publicado, confirmaciones |
| `--sk-warning` | `#E67E22` | `#FEF5E7` | `#F5CBA7` | Callout advertencia, badge En Revisión |
| `--sk-danger` | `#C0392B` | `#FDEDEC` | `#F1948A` | Callout error/crítico, badge Obsoleto |
| `--sk-neutral` | `#85929E` | `#F4F6F7` | `#D5D8DC` | Callout neutro, badge Borrador |

### 3.2 Colores del Tenant (dinámicos)

El branding del tenant se inyecta en puntos específicos, **nunca reemplaza** los colores fijos del sistema:

| Punto de Aplicación | Qué se usa |
|---------------------|-----------|
| Logo en el header | `tenant.logo` (Base64) |
| Nombre de empresa en header | Color `--sk-navy` fijo (NO el color del tenant) |
| Línea superior del header | Puede usar `tenant.primary_color` como acento sutil |
| Estampa X.509 visible | Usa `tenant.primary_color` para el borde de la estampa |
| Marca de agua "COPIA CONTROLADA" | Siempre gris semitransparente, NUNCA color del tenant |

**Razón:** Si cada tenant cambia los colores del documento completo, se pierde la identidad StrateKaz y los documentos se ven inconsistentes entre clientes. El branding del tenant está en el logo y el nombre, no en la estructura visual.

---

## 4. Tipografía

### 4.1 Familias

| Rol | Familia | Fallback | Uso |
|-----|---------|----------|-----|
| **Body** | Arial | Helvetica, Liberation Sans, sans-serif | Texto del cuerpo, párrafos, celdas de tabla |
| **Headings** | Arial Bold | Helvetica Bold, Liberation Sans Bold, sans-serif | Títulos H1-H4, etiquetas de sección |
| **Mono** | Courier New | Courier, Liberation Mono, monospace | Códigos de documento, referencias normativas, bloques técnicos |

> **¿Por qué Arial?** Es profesional, legible en tamaños pequeños (crucial para PDFs), disponible tanto en Windows como en Linux (o su equivalente métrico Liberation Sans). No requiere Google Fonts ni instalación adicional. Segoe UI NO se usa porque solo está disponible en Windows y el servidor de producción es Linux.

### 4.2 Escala de Tamaños

| Token | Tamaño | Uso |
|-------|--------|-----|
| `--sk-text-xs` | 7pt | Footer, metadata mínima, hash de firma |
| `--sk-text-sm` | 8pt | Celdas de tabla, notas al pie, badges |
| `--sk-text-base` | 9.5pt | Texto del cuerpo principal |
| `--sk-text-md` | 10pt | H4, texto enfatizado |
| `--sk-text-lg` | 11pt | H3 |
| `--sk-text-xl` | 13pt | H2 |
| `--sk-text-2xl` | 15pt | H1 |
| `--sk-text-3xl` | 18pt | Título de portada (subtítulo) |
| `--sk-text-4xl` | 22pt | Título de portada (principal) |

### 4.3 Interlineado

| Contexto | Line-height |
|----------|------------|
| Cuerpo del documento | 1.5 |
| Celdas de tabla | 1.3 |
| Headings | 1.2 |
| Footer / header | 1.1 |

---

## 5. Configuración de Página

### 5.1 Página Base

```css
@page {
    size: letter;                          /* 8.5" × 11" (216mm × 279mm) */
    margin: 25mm 20mm 25mm 20mm;           /* Top Right Bottom Left */

    @top-center {
        content: element(page-header);     /* Header running */
    }

    @bottom-center {
        content: element(page-footer);     /* Footer running */
    }
}
```

### 5.2 Área Útil de Contenido

- Ancho útil: `216mm - 20mm - 20mm = 176mm`
- Alto útil: `279mm - 25mm - 25mm = 229mm` (menos header/footer)
- En puntos: ~499pt de ancho

### 5.3 Control de Paginación

```css
h1, h2, h3 { page-break-after: avoid; }    /* No cortar después de heading */
table       { page-break-inside: auto; }    /* Las tablas pueden dividirse */
thead       { display: table-header-group; } /* Repetir header en cada página */
tr          { page-break-inside: avoid; }   /* No cortar fila a la mitad */
.sk-no-break { page-break-inside: avoid; }  /* Clase utilitaria */
.sk-break-before { page-break-before: always; } /* Forzar salto */
```

---

## 6. Header Running

El header aparece en **todas las páginas** del documento.

### 6.1 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo 12mm]  NOMBRE EMPRESA              PR-GE-001         │
│               NIT: 900.123.456-7          Versión 3          │
│                                           ┌──────────┐       │
│                                           │PUBLICADO │       │
│                                           └──────────┘       │
├══════════════════════════════════════════════════════════════╡
│  (línea gruesa 1.5pt en --sk-navy)                          │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 HTML

```html
<div class="page-header">
    <div class="header-left">
        <img class="header-logo" src="{{ tenant.logo_base64 }}" alt="Logo">
        <div>
            <div class="header-empresa">{{ tenant.nombre }}</div>
            <div class="header-nit">NIT: {{ tenant.nit }}</div>
        </div>
    </div>
    <div class="header-right">
        <div class="header-doc-code">{{ documento.codigo }}</div>
        <div class="header-doc-version">Versión {{ documento.version }}</div>
        <span class="sk-badge sk-badge-{{ documento.estado|lower }}">
            {{ documento.get_estado_display }}
        </span>
    </div>
</div>
```

### 6.3 Reglas

- Logo: máximo 12mm × 12mm, `object-fit: contain`.
- Nombre de empresa: `--sk-navy`, bold, 8pt.
- NIT: `--sk-gray-500`, regular, 7pt.
- Código: `font-mono`, `--sk-navy`, bold, 8pt.
- Badge de estado: ver sección 11.
- Línea inferior: `1.5pt solid --sk-navy`.

---

## 7. Footer Running

El footer aparece en **todas las páginas** del documento.

### 7.1 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  (línea 0.75pt en --sk-gray-300)                            │
├──────────────────────────────────────────────────────────────┤
│  StrateKaz |            │  Documento controlado  │  Pág 3/8 │
│  Consultoría 4.0        │  Impreso: 2026-04-05   │          │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 HTML

```html
<div class="page-footer">
    <div class="footer-left">
        <span class="footer-tech">StrateKaz</span>
        <span class="footer-separator">|</span>
        <span class="footer-version">Consultoría 4.0</span>
    </div>
    <div class="footer-center">
        Documento controlado — Impreso: {{ fecha_impresion }}
    </div>
    <div class="footer-right">
        <span class="footer-page"></span>
        <!-- CSS counter genera "Página X de Y" -->
    </div>
</div>
```

### 7.3 Reglas

- "StrateKaz": `--sk-navy`, bold, 7pt. **Siempre presente en todo documento.**
- "|": `--sk-gray-300`, separador visual.
- "Consultoría 4.0": `--sk-gray-500`, regular, 7pt.
- Centro: `--sk-gray-400`, regular, 6.5pt.
- Número de página: CSS counter `counter(page)` de `counter(pages)`.
- Línea superior: `0.75pt solid --sk-gray-300`.

---

## 8. Sistema de Headings

### 8.1 Jerarquía Visual

#### H1 — Sección Principal

- Tamaño: 15pt, bold.
- Color: `--sk-navy` (#1B4F72).
- Borde inferior: `2.5pt solid --sk-navy`.
- Espaciado: 8mm arriba, 5mm abajo.
- Padding inferior: 2mm (entre texto y línea).

```html
<h1 class="sk-h1">1. Objetivo y Alcance</h1>
```

#### H2 — Subsección

- Tamaño: 13pt, bold.
- Color: `--sk-blue` (#2E86C1).
- Borde izquierdo: `2.5pt solid --sk-blue`.
- Padding izquierdo: 3mm.
- Espaciado: 5mm arriba, 3mm abajo.

```html
<h2 class="sk-h2">1.1 Objetivo</h2>
```

#### H3 — Sub-subsección

- Tamaño: 11pt, semibold.
- Color: `--sk-dark-soft` (#34495E).
- Sin borde.
- Espaciado: 3mm arriba, 2mm abajo.

```html
<h3 class="sk-h3">RN-TRD-001: Resolución de tiempo</h3>
```

#### H4 — Etiqueta Interna

- Tamaño: 10pt, semibold.
- Color: `--sk-gray-600`.
- Sin borde, sin espaciado extra.

```html
<h4 class="sk-h4">Requisitos técnicos del escaneo</h4>
```

---

## 9. Tablas

### 9.1 Tabla Estándar

La tabla más usada en documentos SGI. Header con color, filas alternadas, bordes suaves.

```html
<table class="sk-table">
    <thead>
        <tr>
            <th>Campo</th>
            <th>Tipo</th>
            <th>Descripción</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>tipo_documento</strong></td>
            <td>FK → TipoDocumento</td>
            <td>Tipo documental obligatorio</td>
        </tr>
        <tr>
            <td><strong>proceso</strong></td>
            <td>FK → Area</td>
            <td>Proceso SGI, dinámico por tenant</td>
        </tr>
    </tbody>
</table>
```

**Reglas CSS:**

| Elemento | Estilo |
|----------|--------|
| `thead th` | Fondo `--sk-navy`, texto blanco, bold, 8pt, padding 2mm 3mm, centrado |
| `tbody td` | Texto `--sk-dark`, regular, 8pt, padding 1.5mm 3mm, alineado izquierda |
| `tbody tr:nth-child(even)` | Fondo `--sk-gray-50` (#F4F6F7) |
| `tbody tr:nth-child(odd)` | Fondo blanco |
| Bordes | `0.3pt solid --sk-gray-300` en todas las celdas |
| Primera columna bold | Usar `<strong>` dentro del `<td>` si aplica |
| Tabla completa | `border-collapse: collapse`, ancho 100% |

### 9.2 Tabla Compacta

Para tablas con muchas columnas (como el seed TRD):

```html
<table class="sk-table sk-table-compact">
    ...
</table>
```

**Diferencias con estándar:** font-size 7pt, padding 1mm 2mm.

### 9.3 Tabla de Metadatos (2 columnas label-valor)

Para fichas de información al inicio de documentos:

```html
<table class="sk-table-meta">
    <tr><td class="meta-label">Código:</td><td>PR-GE-001</td></tr>
    <tr><td class="meta-label">Versión:</td><td>3</td></tr>
    <tr><td class="meta-label">Fecha aprobación:</td><td>2026-03-15</td></tr>
    <tr><td class="meta-label">Proceso:</td><td>Gestión Estratégica</td></tr>
</table>
```

**Reglas:** Label en `--sk-gray-600` bold, ancho fijo 35mm. Valor en `--sk-dark` regular. Sin bordes visibles, fondo alterno por fila. Sin header `thead`.

---

## 10. Callout Boxes (Cajas Informativas)

Cajas con borde lateral grueso y fondo de color. Son el equivalente a las "cards de info" que se ven en los documentos Word.

### 10.1 Tipos

#### Info (azul)

```html
<div class="sk-callout sk-callout-info">
    <strong>NOTA:</strong> El Acuerdo 004 de 2019 fue derogado por el Acuerdo 001 de 2024.
</div>
```

- Borde izquierdo: `3pt solid --sk-blue` (#2E86C1)
- Fondo: `--sk-blue-lightest` (#EBF5FB)
- Texto: `--sk-dark`, 9pt

#### Éxito (verde)

```html
<div class="sk-callout sk-callout-success">
    <strong>REGLA DE PRIORIDAD:</strong> TRD (tipo+proceso) > TipoDocumento.tiempo_retencion_anos.
</div>
```

- Borde izquierdo: `3pt solid --sk-success` (#27AE60)
- Fondo: `#E8F8F5`

#### Advertencia (naranja)

```html
<div class="sk-callout sk-callout-warning">
    <strong>IMPORTANTE:</strong> Los tiempos de retención no pueden ser inferiores al mínimo legal.
</div>
```

- Borde izquierdo: `3pt solid --sk-warning` (#E67E22)
- Fondo: `#FEF5E7`

#### Peligro / Crítico (rojo)

```html
<div class="sk-callout sk-callout-danger">
    <strong>PRINCIPIO AGN:</strong> Ningún documento se elimina sin acto administrativo trazable.
</div>
```

- Borde izquierdo: `3pt solid --sk-danger` (#C0392B)
- Fondo: `#FDEDEC`

#### Neutral (gris)

```html
<div class="sk-callout sk-callout-neutral">
    Este campo es opcional pero se recomienda completar para trazabilidad.
</div>
```

- Borde izquierdo: `3pt solid --sk-gray-500` (#85929E)
- Fondo: `#F4F6F7`

### 10.2 Reglas CSS Comunes

```css
.sk-callout {
    padding: 3mm 4mm;
    margin: 3mm 0 4mm 0;
    border-radius: 0 2mm 2mm 0;       /* Redondeo solo a la derecha */
    font-size: 9pt;
    line-height: 1.4;
    page-break-inside: avoid;
}
```

---

## 11. Badges de Estado

Etiquetas pequeñas con color que indican estado del documento. Se usan en el header y en tablas.

### 11.1 Definición

| Estado | Clase CSS | Fondo | Texto | Borde |
|--------|-----------|-------|-------|-------|
| BORRADOR | `.sk-badge-borrador` | `#F4F6F7` | `#5A6978` | `#D5D8DC` |
| EN_REVISION | `.sk-badge-en_revision` | `#FEF5E7` | `#E67E22` | `#F5CBA7` |
| APROBADO | `.sk-badge-aprobado` | `#D4EFDF` | `#1E8449` | `#82E0AA` |
| PUBLICADO | `.sk-badge-publicado` | `#E8F8F5` | `#27AE60` | `#82E0AA` |
| OBSOLETO | `.sk-badge-obsoleto` | `#FDEDEC` | `#C0392B` | `#F1948A` |
| ARCHIVADO | `.sk-badge-archivado` | `#EBF5FB` | `#2E86C1` | `#AED6F1` |
| ELIMINADO | `.sk-badge-eliminado` | `#F4F6F7` | `#85929E` | `#BDC3C7` |

### 11.2 CSS

```css
.sk-badge {
    display: inline-block;
    font-family: var(--sk-font-heading);
    font-size: 7pt;
    font-weight: 700;
    padding: 0.5mm 2.5mm;
    border-radius: 1mm;
    border: 0.3pt solid;
    text-transform: uppercase;
    letter-spacing: 0.3pt;
}
```

---

## 12. Líneas Separadoras

### 12.1 Separador Principal

Se usa entre secciones mayores (antes de H1):

```html
<hr class="sk-hr-primary">
```

```css
.sk-hr-primary {
    border: none;
    border-top: 2pt solid var(--sk-navy);
    margin: 6mm 0;
}
```

### 12.2 Separador Suave

Se usa entre sub-secciones o para dividir contenido:

```html
<hr class="sk-hr-soft">
```

```css
.sk-hr-soft {
    border: none;
    border-top: 0.5pt solid var(--sk-gray-300);
    margin: 4mm 0;
}
```

### 12.3 Separador con Acento

Línea decorativa con color de acento (para portadas o destacados):

```html
<hr class="sk-hr-accent">
```

```css
.sk-hr-accent {
    border: none;
    border-top: 3pt solid var(--sk-blue);
    width: 40%;
    margin: 5mm auto;
}
```

---

## 13. Bloques de Código / Referencia Normativa

### 13.1 Bloque de Código

Para mostrar pseudocódigo, configuraciones o scripts:

```html
<div class="sk-code">
    def resolver_retencion(documento):<br>
    &nbsp;&nbsp;trd = TablaRetencionDocumental.objects.filter(...)<br>
    &nbsp;&nbsp;if trd:<br>
    &nbsp;&nbsp;&nbsp;&nbsp;return {'fuente': 'TRD', ...}
</div>
```

```css
.sk-code {
    background: #F4F6F7;
    border: 0.5pt solid #D5D8DC;
    border-left: 3pt solid #85929E;
    border-radius: 0 2mm 2mm 0;
    padding: 3mm 4mm;
    font-family: var(--sk-font-mono);
    font-size: 8pt;
    line-height: 1.4;
    color: var(--sk-dark);
    margin: 3mm 0;
    page-break-inside: avoid;
    white-space: pre-wrap;
}
```

### 13.2 Bloque de Referencia Normativa

Para citar artículos de ley o normas:

```html
<div class="sk-ref-legal">
    <strong>Decreto 1072/2015, Art. 2.2.4.6.12:</strong>
    "El empleador debe mantener los registros de capacitación por un período
    mínimo de veinte (20) años contados a partir del momento en que cese la
    relación laboral del trabajador con la empresa."
</div>
```

```css
.sk-ref-legal {
    background: #EBF5FB;
    border: 0.5pt solid #AED6F1;
    border-radius: 2mm;
    padding: 3mm 4mm;
    font-size: 8.5pt;
    font-style: italic;
    color: #34495E;
    margin: 3mm 0;
}
```

---

## 14. Listas

### 14.1 Lista con Bullets

```html
<ul class="sk-list">
    <li>Modificar tiempos de retención (respetando mínimos legales).</li>
    <li>Agregar series/subseries propias de su actividad.</li>
    <li>Desactivar reglas no aplicables.</li>
</ul>
```

```css
.sk-list {
    padding-left: 6mm;
    margin: 2mm 0 4mm 0;
}
.sk-list li {
    margin-bottom: 1.5mm;
    font-size: 9.5pt;
    line-height: 1.4;
}
.sk-list li::marker {
    color: var(--sk-blue);
    font-weight: bold;
}
```

### 14.2 Lista Numerada

```html
<ol class="sk-list-numbered">
    <li>Buscar en TablaRetencionDocumental.</li>
    <li>Fallback a TipoDocumento.tiempo_retencion_anos.</li>
    <li>Default absoluto: 5 años.</li>
</ol>
```

Mismos estilos que `.sk-list` pero con `list-style-type: decimal` y marker en `--sk-navy`.

---

## 15. Bloque de Firmas Dinámico

### 15.1 Principio

El bloque de firmas se adapta automáticamente al número de firmantes. No es un layout fijo de 3 columnas.

### 15.2 Layouts por Cantidad

#### 1 firmante → Centrado

```
┌──────────────────────────────────────────┐
│              ┌──────────────┐            │
│              │              │            │
│              │   [firma]    │            │
│              │              │            │
│              ├──────────────┤            │
│              │ Nombre       │            │
│              │ Cargo        │            │
│              │ Fecha        │            │
│              │ Hash: a3f2...│            │
│              └──────────────┘            │
└──────────────────────────────────────────┘
```

CSS: `.sk-firmas[data-count="1"]` → `text-align: center`, bloque de firma: `display: inline-block; width: 50%`.

#### 2 firmantes → Dos columnas iguales

```
┌──────────────────────────────────────────┐
│  ┌──────────────┐   ┌──────────────┐    │
│  │   [firma]    │   │   [firma]    │    │
│  ├──────────────┤   ├──────────────┤    │
│  │ Elaboró      │   │ Aprobó       │    │
│  │ Nombre       │   │ Nombre       │    │
│  │ Cargo        │   │ Cargo        │    │
│  └──────────────┘   └──────────────┘    │
└──────────────────────────────────────────┘
```

CSS: `.sk-firmas[data-count="2"]` → `text-align: center`, cada bloque `display: inline-block; width: 45%; margin: 0 3mm`.

#### 3 firmantes → Grid clásico

```
┌──────────────────────────────────────────┐
│ ┌───────────┐ ┌───────────┐ ┌──────────┐│
│ │  ELABORÓ  │ │  REVISÓ   │ │ APROBÓ   ││
│ │  [firma]  │ │  [firma]  │ │ [firma]  ││
│ │  ──────── │ │  ──────── │ │ ──────── ││
│ │  Nombre   │ │  Nombre   │ │ Nombre   ││
│ │  Cargo    │ │  Cargo    │ │ Cargo    ││
│ └───────────┘ └───────────┘ └──────────┘│
└──────────────────────────────────────────┘
```

CSS: `.sk-firmas[data-count="3"]` → `text-align: center`, cada bloque `display: inline-block; width: 30%; margin: 0 1.5mm`.

#### 4+ firmantes → Grid adaptable

CSS: `.sk-firmas[data-count="4"]` y superiores → `text-align: center`, cada bloque `display: inline-block; width: 45%; margin: 0 1.5mm 3mm 1.5mm` (2 x 2). Para 5-6: `width: 30%` (3 x 2).

### 15.3 HTML de un Bloque de Firma Individual

```html
<div class="sk-firma-bloque">
    <div class="sk-firma-etiqueta">ELABORÓ</div>
    <div class="sk-firma-imagen">
        <!-- Estado: FIRMADO -->
        <img src="data:image/png;base64,{{ firma.imagen_base64 }}" class="sk-firma-img">
        <!-- Estado: PENDIENTE -->
        <!-- <div class="sk-firma-pendiente">Pendiente de firma</div> -->
        <!-- Estado: RECHAZADO -->
        <!-- <div class="sk-firma-rechazado">Firma rechazada</div> -->
    </div>
    <div class="sk-firma-linea"></div>
    <div class="sk-firma-nombre">{{ firmante.nombre_completo }}</div>
    <div class="sk-firma-cargo">{{ firmante.cargo }}</div>
    <div class="sk-firma-fecha">{{ firma.fecha|date:"Y-m-d H:i" }}</div>
    <div class="sk-firma-hash">Hash: {{ firma.hash_sha256|truncatechars:16 }}</div>
</div>
```

### 15.4 CSS del Bloque de Firma

```css
.sk-firmas {
    text-align: center;
    margin-top: 8mm;
    padding-top: 5mm;
    border-top: 0.75pt solid var(--sk-gray-300);
    page-break-inside: avoid;
}

.sk-firma-bloque {
    display: inline-block;
    vertical-align: top;
    text-align: center;
    min-width: 40mm;
    margin: 0 2mm;
}
/* Anchos por cantidad de firmantes */
.sk-firmas[data-count="1"] .sk-firma-bloque { width: 50%; }
.sk-firmas[data-count="2"] .sk-firma-bloque { width: 45%; }
.sk-firmas[data-count="3"] .sk-firma-bloque { width: 30%; }
.sk-firmas[data-count="4"] .sk-firma-bloque { width: 45%; margin-bottom: 3mm; }
.sk-firmas[data-count="5"] .sk-firma-bloque,
.sk-firmas[data-count="6"] .sk-firma-bloque { width: 30%; margin-bottom: 3mm; }

.sk-firma-etiqueta {
    font-family: var(--sk-font-heading);
    font-size: 7pt;
    font-weight: 700;
    color: var(--sk-navy);
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    margin-bottom: 2mm;
}

.sk-firma-imagen {
    min-height: 15mm;
    text-align: center;
    line-height: 15mm;
}

.sk-firma-img {
    max-width: 35mm;
    max-height: 15mm;
    object-fit: contain;
}

.sk-firma-pendiente {
    font-size: 7pt;
    color: var(--sk-gray-500);
    font-style: italic;
    padding: 4mm 0;
}

.sk-firma-rechazado {
    font-size: 7pt;
    color: var(--sk-danger);
    font-weight: 700;
    padding: 4mm 0;
}

.sk-firma-linea {
    border-top: 0.75pt solid var(--sk-dark);
    width: 80%;
    margin: 1.5mm auto;
}

.sk-firma-nombre {
    font-size: 8pt;
    font-weight: 700;
    color: var(--sk-dark);
}

.sk-firma-cargo {
    font-size: 7pt;
    color: var(--sk-gray-600);
}

.sk-firma-fecha {
    font-size: 6.5pt;
    color: var(--sk-gray-500);
}

.sk-firma-hash {
    font-family: var(--sk-font-mono);
    font-size: 6pt;
    color: var(--sk-gray-400);
}
```

### 15.5 Lógica Python para Generar el Bloque

```python
def render_bloque_firmas(firmantes):
    """
    firmantes: lista de dicts con keys:
        etiqueta, nombre, cargo, fecha, hash, imagen_base64, estado
    """
    count = len(firmantes)
    html = f'<div class="sk-firmas" data-count="{count}">'
    for f in firmantes:
        html += '<div class="sk-firma-bloque">'
        html += f'<div class="sk-firma-etiqueta">{f["etiqueta"]}</div>'
        html += '<div class="sk-firma-imagen">'
        if f['estado'] == 'FIRMADO':
            html += f'<img class="sk-firma-img" src="{f["imagen_base64"]}">'
        elif f['estado'] == 'PENDIENTE':
            html += '<div class="sk-firma-pendiente">Pendiente de firma</div>'
        elif f['estado'] == 'RECHAZADO':
            html += '<div class="sk-firma-rechazado">Firma rechazada</div>'
        html += '</div>'
        html += '<div class="sk-firma-linea"></div>'
        html += f'<div class="sk-firma-nombre">{f["nombre"]}</div>'
        html += f'<div class="sk-firma-cargo">{f["cargo"]}</div>'
        html += f'<div class="sk-firma-fecha">{f["fecha"]}</div>'
        html += f'<div class="sk-firma-hash">Hash: {f["hash"][:16]}</div>'
        html += '</div>'
    html += '</div>'
    return html
```

---

## 16. Sellado X.509 y QR

### 16.1 Estampa Visible

Aparece en la primera página, esquina inferior izquierda, DESPUÉS del contenido y ANTES del footer:

```html
<div class="sk-sello-x509">
    <div class="sk-sello-titulo">DOCUMENTO CONTROLADO</div>
    <div class="sk-sello-dato"><strong>Código:</strong> {{ doc.codigo }}</div>
    <div class="sk-sello-dato"><strong>Versión:</strong> {{ doc.version }}</div>
    <div class="sk-sello-dato"><strong>Empresa:</strong> {{ tenant.nombre }}</div>
    <div class="sk-sello-dato"><strong>Sellado:</strong> {{ fecha_sellado }}</div>
</div>
```

```css
.sk-sello-x509 {
    border: 1pt solid var(--sk-navy);
    border-radius: 2mm;
    padding: 2mm 3mm;
    font-size: 6.5pt;
    color: var(--sk-dark);
    max-width: 55mm;
    margin-top: 5mm;
}

.sk-sello-titulo {
    font-family: var(--sk-font-heading);
    font-size: 7pt;
    font-weight: 700;
    color: var(--sk-navy);
    text-transform: uppercase;
    letter-spacing: 0.3pt;
    margin-bottom: 1mm;
    border-bottom: 0.5pt solid var(--sk-gray-300);
    padding-bottom: 1mm;
}
```

### 16.2 Código QR

Si se implementa QR con hash SHA-256 de verificación:

```html
<div class="sk-qr-container">
    <img class="sk-qr-img" src="{{ qr_base64 }}" alt="QR Verificación">
    <div class="sk-qr-label">Verificar autenticidad</div>
</div>
```

Tamaño QR: 18mm × 18mm. Posición: junto a la estampa X.509.

---

## 17. Marcas de Agua

### 17.1 Definición por Estado

| Estado | Texto | Color | Rotación |
|--------|-------|-------|----------|
| BORRADOR | "BORRADOR — Documento no aprobado" | `rgba(200,200,200,0.20)` | -35° |
| EN_REVISION | "EN REVISIÓN — Pendiente de aprobación" | `rgba(200,200,200,0.20)` | -35° |
| PUBLICADO | "COPIA CONTROLADA" + fecha + usuario | `rgba(200,200,200,0.15)` | -35° |
| OBSOLETO | "OBSOLETO — Documento fuera de vigencia" | `rgba(220,50,50,0.15)` | -35° |
| ARCHIVADO | "ARCHIVO — Solo consulta" | `rgba(200,200,200,0.15)` | -35° |
| ELIMINADO | "ELIMINADO" | `rgba(220,50,50,0.20)` | -35° |

### 17.2 CSS

```css
.sk-watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-family: var(--sk-font-heading);
    font-size: 48pt;
    font-weight: 900;
    white-space: nowrap;
    z-index: -1;
    pointer-events: none;
}

.sk-watermark-borrador    { color: rgba(200,200,200,0.20); }
.sk-watermark-en_revision { color: rgba(200,200,200,0.20); }
.sk-watermark-publicado   { color: rgba(200,200,200,0.15); }
.sk-watermark-obsoleto    { color: rgba(220,50,50,0.15); }
.sk-watermark-archivado   { color: rgba(200,200,200,0.15); }
.sk-watermark-eliminado   { color: rgba(220,50,50,0.20); }
```

---

## 18. Portada de Documento

Para documentos normativos (políticas, manuales, procedimientos) que requieren portada formal.

### 18.1 Layout

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    [Logo 25mm centrado]                       │
│                    NOMBRE DE LA EMPRESA                       │
│                    NIT: 900.123.456-7                         │
│                                                              │
│               ══════════════════════════                      │
│                                                              │
│                   POLÍTICA DE SEGURIDAD                       │
│                   Y SALUD EN EL TRABAJO                       │
│                                                              │
│               ──────────── ○ ────────────                    │
│                                                              │
│                    Código: POL-SST-001                        │
│                    Versión: 3                                 │
│                    Fecha: 2026-03-15                          │
│                    Proceso: SST                               │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│  StrateKaz | Consultoría 4.0                                 │
│  Documento controlado — Prohibida su reproducción parcial     │
└──────────────────────────────────────────────────────────────┘
```

### 18.2 Regla

Solo se genera portada para documentos donde `tipo_documento.nivel_documento` es `ESTRATEGICO` o `TACTICO`. Los documentos `OPERATIVO` y `SOPORTE` (formatos, registros) NO llevan portada.

---

## 19. Layout por Tipo de Documento

### 19.1 Mapeo Tipo → Secciones del PDF

Cada tipo de documento tiene un orden de secciones predefinido. Todas las secciones usan los componentes del Design System:

| TipoDocumento | Portada | Secciones | Firmas |
|--------------|---------|-----------|--------|
| POL (Política) | ✅ Sí | Portada → Metadatos → Contenido → Firmas → Sello | Elaboró + Revisó + Aprobó |
| MA (Manual) | ✅ Sí | Portada → TOC → Metadatos → Contenido → Firmas → Sello | Elaboró + Revisó + Aprobó |
| PR (Procedimiento) | ✅ Sí | Portada → Objetivo → Alcance → Definiciones → Contenido → Firmas → Sello | Elaboró + Revisó + Aprobó |
| IN (Instructivo) | ❌ No | Metadatos → Objetivo → Contenido → Firmas → Sello | Elaboró + Aprobó |
| GU (Guía) | ❌ No | Metadatos → Contenido → Firmas → Sello | Elaboró + Aprobó |
| PL (Plan) | ✅ Sí | Portada → Metadatos → Cronograma → Responsables → Contenido → Firmas → Sello | Elaboró + Revisó + Aprobó |
| PG (Programa) | ❌ No | Metadatos → Cronograma → Contenido → Firmas → Sello | Elaboró + Aprobó |
| AC (Acta) | ❌ No | Datos reunión → Asistentes (tabla) → Temas → Compromisos → Firmas participantes | Dinámico: todos los asistentes |
| FT (Formato) | ❌ No | Metadatos → Campos del formulario (JSON→tabla) → Firmas | Dinámico: según workflow |
| RG (Registro) | ❌ No | Metadatos → Datos del registro (JSON→tabla) → Firmas | Dinámico: quien registra |
| MT (Matriz) | ❌ No | Metadatos → Tabla de la matriz → Firmas | Elaboró + Aprobó |
| IF (Informe) | ❌ No | Metadatos → Contenido → Conclusiones → Firmas | Elaboró + Revisó |
| RE (Reglamento) | ✅ Sí | Portada → Metadatos → Contenido → Firmas → Sello | Elaboró + Revisó + Aprobó |
| KB (Conocimiento) | ❌ No | Metadatos → Contenido → Tags | Sin firmas |

### 19.2 Formularios Auto-Generados (JSON → PDF)

Cuando un formulario del Form Builder se renderiza a PDF, los campos JSON se convierten a tabla HTML con el Design System:

```python
def render_formulario_json_a_html(datos_formulario, definicion_campos):
    """
    Convierte datos JSON del Form Builder a tabla HTML estilizada.
    """
    html = '<table class="sk-table">'
    html += '<thead><tr><th>Campo</th><th>Valor</th></tr></thead>'
    html += '<tbody>'
    for campo in definicion_campos:
        valor = datos_formulario.get(campo['nombre'], '—')
        if campo['tipo'] == 'FIRMA':
            valor_html = f'<img class="sk-firma-img" src="{valor}">' if valor else '<em>Sin firma</em>'
        elif campo['tipo'] == 'FOTO':
            valor_html = f'<img style="max-width:40mm;max-height:30mm" src="{valor}">' if valor else '<em>Sin foto</em>'
        elif campo['tipo'] == 'CHECKBOX':
            valor_html = '☑ Sí' if valor else '☐ No'
        elif campo['tipo'] == 'SELECT':
            valor_html = str(valor)
        else:
            valor_html = str(valor) if valor else '—'

        html += f'<tr><td><strong>{campo["etiqueta"]}</strong></td><td>{valor_html}</td></tr>'
    html += '</tbody></table>'
    return html
```

### 19.3 PDFs Externos Adoptados (Camino B)

Los PDFs externos adoptados **NO se re-procesan** ni se les aplica el Design System en su contenido:

1. El PDF original se sirve tal cual como `archivo_original`.
2. Se aplica **solo** el sellado X.509 (pyHanko) — firma digital invisible en metadata PDF.
3. El visor en Mi Portal muestra el PDF original.
4. El Design System NO modifica el contenido, apariencia ni estructura del PDF adoptado.
5. Solo se acepta formato PDF. No se acepta Word ni ningún otro formato.

---

## 20. Variables CSS Dinámicas por Tenant

### 20.1 Inyección en Python

```python
def get_tenant_css_vars(tenant):
    """
    Genera el bloque CSS con variables del tenant.
    Se inyecta al inicio del HTML antes de renderizar con WeasyPrint.
    """
    brand = tenant.branding  # Modelo Branding del tenant
    return f"""
    :root {{
        --sk-tenant-primary: {brand.primary_color or '#1B4F72'};
        --sk-tenant-secondary: {brand.secondary_color or '#2E86C1'};
        --sk-tenant-name: '{tenant.nombre}';
        --sk-tenant-nit: '{tenant.nit}';
    }}
    """
```

### 20.2 Puntos de Aplicación del Branding

```css
/* Solo estos puntos usan el color del tenant */
.header-logo-accent {
    border-bottom-color: var(--sk-tenant-primary);
}

.sk-sello-x509 {
    border-color: var(--sk-tenant-primary);
}

/* El resto del documento usa SIEMPRE los colores fijos del sistema */
```

---

## 21. Integración con el Generador Python

### 21.1 Arquitectura

```
DocumentoPDFGenerator (pdf_generator.py)
│
├── __init__(documento)
│   ├── Carga Design System CSS (este archivo → str)
│   ├── Inyecta variables CSS del tenant
│   └── Determina layout por TipoDocumento
│
├── generar_html()
│   ├── render_header()        → page-header
│   ├── render_footer()        → page-footer
│   ├── render_watermark()     → sk-watermark
│   ├── render_portada()       → Solo si nivel ESTRATEGICO/TACTICO
│   ├── render_metadatos()     → sk-table-meta
│   ├── render_contenido()     → Varía por tipo (ver sección 19)
│   ├── render_formulario()    → JSON → HTML tabla (Form Builder)
│   ├── render_firmas()        → Bloque dinámico (1-N firmantes)
│   └── render_sello_x509()    → Estampa visible
│
├── generar_pdf()
│   └── WeasyPrint(html_completo) → bytes PDF
│
└── aplicar_firma_invisible()
    └── pyHanko → firma digital en metadata PDF
```

### 21.2 Carga del CSS

```python
import os

DESIGN_SYSTEM_CSS_PATH = os.path.join(
    os.path.dirname(__file__), 'static', 'css', 'pdf_design_system.css'
)

class DocumentoPDFGenerator:
    def __init__(self, documento):
        self.documento = documento
        self.tenant = documento.empresa
        self._css = self._cargar_design_system()

    def _cargar_design_system(self):
        """Carga el CSS del Design System + variables del tenant."""
        with open(DESIGN_SYSTEM_CSS_PATH, 'r') as f:
            base_css = f.read()
        tenant_vars = get_tenant_css_vars(self.tenant)
        return f'<style>{tenant_vars}\n{base_css}</style>'
```

### 21.3 Template HTML Base

```python
def generar_html(self):
    doc = self.documento
    layout = LAYOUTS_POR_TIPO.get(doc.tipo_documento.codigo, LAYOUT_DEFAULT)

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        {self._css}
    </head>
    <body>
        {self.render_header()}
        {self.render_footer()}
        {self.render_watermark()}

        <div class="sk-content">
            {''.join(getattr(self, f'render_{seccion}')() for seccion in layout['secciones'])}
        </div>

        {self.render_firmas()}
        {self.render_sello_x509()}
    </body>
    </html>
    """
    return html
```

### 21.4 Ubicación del Archivo CSS

```
backend/
  apps/
    gestion_estrategica/
      gestion_documental/
        static/
          css/
            pdf_design_system.css    ← ESTE ARCHIVO
        exporters/
          pdf_generator.py           ← Consume el CSS
```

---

## 22. CSS Completo

El archivo `pdf_design_system.css` debe contener TODOS los estilos definidos en las secciones 5 a 17 de este documento, consolidados en un solo archivo. La estructura del archivo CSS debe ser:

```
/* 1. Variables (:root) */
/* 2. @page configuration */
/* 3. Header running */
/* 4. Footer running */
/* 5. Base typography (body, h1-h4, p, strong) */
/* 6. Tables (.sk-table, .sk-table-compact, .sk-table-meta) */
/* 7. Callout boxes (.sk-callout-info/success/warning/danger/neutral) */
/* 8. Badges (.sk-badge-*) */
/* 9. Separators (.sk-hr-primary/soft/accent) */
/* 10. Code blocks (.sk-code, .sk-ref-legal) */
/* 11. Lists (.sk-list, .sk-list-numbered) */
/* 12. Signature blocks (.sk-firmas, .sk-firma-bloque) */
/* 13. X.509 seal (.sk-sello-x509) */
/* 14. Watermarks (.sk-watermark-*) */
/* 15. Cover page (.sk-portada) */
/* 16. Utilities (.sk-no-break, .sk-break-before, .sk-text-center, etc.) */
```

Cada componente debe ser auto-contenido: usar solo las variables CSS definidas en `:root`, sin dependencias externas.

**Restricciones de compatibilidad WeasyPrint 60.x (OBLIGATORIAS):**
- **NO usar `display: flex`** — reemplazar por `display: inline-block` + `vertical-align: top` + anchos porcentuales.
- **NO usar `display: grid`** — reemplazar por `display: table` + `display: table-cell`.
- **NO usar `gap`** — reemplazar por `margin`.
- **NO usar `Segoe UI`** — usar `Arial, Helvetica, Liberation Sans, sans-serif`.
- Layouts de firmas: `display: inline-block` con `width` por cantidad de firmantes (ver §15.4).
- Layouts de header/footer: `float: left/right` + clearfix `::after { content:''; display:block; clear:both }`.
- Columnas: `display: inline-block; width: 48%` para 2 columnas, `width: 30%` para 3 columnas.

> **NOTA para Claude Code:** Al crear el archivo `pdf_design_system.css`, tomar CADA bloque CSS de las secciones 5-17 de este documento y consolidarlos en un solo archivo ordenado. NO inventar estilos nuevos. Seguir exactamente las especificaciones de color, tamaño, espaciado y comportamiento definidos aquí. NUNCA usar flex ni grid — WeasyPrint 60.x no los soporta.

---

## 23. HTML de Referencia

### 23.1 Estructura Mínima de un PDF StrateKaz

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        /* Variables del tenant (inyectadas dinámicamente) */
        :root {
            --sk-tenant-primary: #1B4F72;
            --sk-tenant-secondary: #2E86C1;
        }
    </style>
    <link rel="stylesheet" href="pdf_design_system.css">
</head>
<body>

    <!-- HEADER RUNNING (aparece en todas las páginas) -->
    <div class="page-header">
        <div class="header-left">
            <img class="header-logo" src="data:image/png;base64,..." alt="Logo">
            <div>
                <div class="header-empresa">Mi Empresa S.A.S.</div>
                <div class="header-nit">NIT: 900.123.456-7</div>
            </div>
        </div>
        <div class="header-right">
            <div class="header-doc-code">PR-GE-001</div>
            <div class="header-doc-version">Versión 3</div>
            <span class="sk-badge sk-badge-publicado">PUBLICADO</span>
        </div>
    </div>

    <!-- FOOTER RUNNING (aparece en todas las páginas) -->
    <div class="page-footer">
        <div class="footer-left">
            <span class="footer-tech">StrateKaz</span>
            <span class="footer-separator">|</span>
            <span class="footer-version">Consultoría 4.0</span>
        </div>
        <div class="footer-center">
            Documento controlado — Impreso: 2026-04-05
        </div>
        <div class="footer-right">
            <span class="footer-page"></span>
        </div>
    </div>

    <!-- MARCA DE AGUA -->
    <div class="sk-watermark sk-watermark-publicado">COPIA CONTROLADA</div>

    <!-- CONTENIDO -->
    <div class="sk-content">

        <h1 class="sk-h1">1. Objetivo</h1>
        <p>Establecer los lineamientos para...</p>

        <div class="sk-callout sk-callout-info">
            <strong>NOTA:</strong> Este procedimiento aplica a todos los procesos del SGI.
        </div>

        <h2 class="sk-h2">1.1 Alcance</h2>
        <p>Aplica a todas las áreas de la organización.</p>

        <table class="sk-table">
            <thead>
                <tr><th>Requisito</th><th>Norma</th><th>Cumplimiento</th></tr>
            </thead>
            <tbody>
                <tr><td><strong>Política SST</strong></td><td>Dto 1072/2015</td><td>Sí</td></tr>
                <tr><td><strong>Matriz de riesgos</strong></td><td>GTC 45</td><td>Sí</td></tr>
            </tbody>
        </table>

        <div class="sk-callout sk-callout-warning">
            <strong>IMPORTANTE:</strong> Los tiempos de retención no pueden ser inferiores al mínimo legal.
        </div>

    </div>

    <!-- BLOQUE DE FIRMAS (3 firmantes) -->
    <div class="sk-firmas" data-count="3">
        <div class="sk-firma-bloque">
            <div class="sk-firma-etiqueta">ELABORÓ</div>
            <div class="sk-firma-imagen">
                <img class="sk-firma-img" src="data:image/png;base64,...">
            </div>
            <div class="sk-firma-linea"></div>
            <div class="sk-firma-nombre">María García López</div>
            <div class="sk-firma-cargo">Coordinadora SST</div>
            <div class="sk-firma-fecha">2026-03-10 14:30</div>
            <div class="sk-firma-hash">Hash: a3f2b7d9e1c04f88</div>
        </div>
        <div class="sk-firma-bloque">
            <div class="sk-firma-etiqueta">REVISÓ</div>
            <div class="sk-firma-imagen">
                <img class="sk-firma-img" src="data:image/png;base64,...">
            </div>
            <div class="sk-firma-linea"></div>
            <div class="sk-firma-nombre">Carlos Pérez Ruiz</div>
            <div class="sk-firma-cargo">Director de Calidad</div>
            <div class="sk-firma-fecha">2026-03-12 09:15</div>
            <div class="sk-firma-hash">Hash: b7d1e9f3a2c58d66</div>
        </div>
        <div class="sk-firma-bloque">
            <div class="sk-firma-etiqueta">APROBÓ</div>
            <div class="sk-firma-imagen">
                <div class="sk-firma-pendiente">Pendiente de firma</div>
            </div>
            <div class="sk-firma-linea"></div>
            <div class="sk-firma-nombre">Ana Martínez</div>
            <div class="sk-firma-cargo">Gerente General</div>
            <div class="sk-firma-fecha">—</div>
            <div class="sk-firma-hash">—</div>
        </div>
    </div>

    <!-- SELLADO X.509 -->
    <div class="sk-sello-x509">
        <div class="sk-sello-titulo">DOCUMENTO CONTROLADO</div>
        <div class="sk-sello-dato"><strong>Código:</strong> PR-GE-001</div>
        <div class="sk-sello-dato"><strong>Versión:</strong> 3</div>
        <div class="sk-sello-dato"><strong>Empresa:</strong> Mi Empresa S.A.S.</div>
        <div class="sk-sello-dato"><strong>Sellado:</strong> 2026-03-15 10:00</div>
    </div>

</body>
</html>
```

---

## Control de Cambios

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Abril 2026 | Camilo Rubiano Bustos | Documento inicial. Design System completo: paleta, tipografía, 14 componentes CSS, firmas dinámicas, layouts por tipo, integración WeasyPrint. |
