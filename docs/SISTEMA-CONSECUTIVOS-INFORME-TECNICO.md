# Sistema de Consecutivos - Informe Técnico Completo

**Sistema de Gestión: Grasas y Huesos del Norte**
**Fecha:** Diciembre 15, 2025
**Versión del Sistema:** 1.0
**Autor:** Documentación Técnica

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura General](#2-arquitectura-general)
3. [Modelos de Datos (Backend)](#3-modelos-de-datos-backend)
4. [API Endpoints](#4-api-endpoints)
5. [Lógica de Generación de Consecutivos](#5-lógica-de-generación-de-consecutivos)
6. [Integración con Módulos](#6-integración-con-módulos)
7. [Frontend - Componentes e Integración](#7-frontend---componentes-e-integración)
8. [Migraciones y Datos Iniciales](#8-migraciones-y-datos-iniciales)
9. [Configuración y Ejemplos Prácticos](#9-configuración-y-ejemplos-prácticos)
10. [Consideraciones de Seguridad y Performance](#10-consideraciones-de-seguridad-y-performance)

---

## 1. Resumen Ejecutivo

El Sistema de Consecutivos de Grasas y Huesos del Norte es un servicio centralizado que proporciona generación automática de códigos únicos para documentos y entidades del sistema. Esta solución reemplaza los métodos hardcodeados anteriores, ofreciendo:

- **Configurabilidad total** por tipo de documento
- **Thread-safety** mediante transacciones atómicas y bloqueos SELECT FOR UPDATE
- **Reinicio automático** anual, mensual o sin reinicio
- **Formato flexible** con prefijos, sufijos, separadores y fechas
- **Integración con áreas/procesos** para códigos jerárquicos
- **33+ tipos de documentos predefinidos** listos para usar

### Ubicación del Código

**Backend:**
- Modelos: `backend/apps/gestion_estrategica/organizacion/models.py`
- Serializers: `backend/apps/gestion_estrategica/organizacion/serializers.py`
- Views: `backend/apps/gestion_estrategica/organizacion/views.py`
- URLs: `backend/apps/gestion_estrategica/organizacion/urls.py`
- Migraciones: `backend/apps/gestion_estrategica/organizacion/migrations/`

**Frontend:**
- API Client: `frontend/src/features/gestion-estrategica/api/organizacionApi.ts`
- Types: `frontend/src/features/gestion-estrategica/types/strategic.types.ts`
- Componentes: `frontend/src/features/gestion-estrategica/components/`

---

## 2. Arquitectura General

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │ ConsecutivosTab  │  │ Consecutivo     │  │ organizacion   │ │
│  │                  │→ │ FormModal       │→ │ Api.ts         │ │
│  │ (CRUD UI)        │  │ (Crear/Editar)  │  │ (API Client)   │ │
│  └──────────────────┘  └─────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Django REST Framework)              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           ConsecutivoConfigViewSet                       │   │
│  │  GET/POST/PUT/DELETE /api/organizacion/consecutivos/    │   │
│  │  POST /api/organizacion/consecutivos/generate_by_type/  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ConsecutivoConfigSerializer                 │   │
│  │  - Validación de datos                                   │   │
│  │  - Formato de ejemplo                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                ConsecutivoConfig (Model)                 │   │
│  │  - get_next_number() [Thread-safe]                      │   │
│  │  - format_number()                                       │   │
│  │  - generate_next()                                       │   │
│  │  - obtener_siguiente_consecutivo() [Class Method]       │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓                        ↓                               │
│  ┌─────────────┐         ┌──────────────┐                       │
│  │TipoDocumento│         │    Area      │                       │
│  │  (33 tipos) │         │  (Procesos)  │                       │
│  └─────────────┘         └──────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BASE DE DATOS (PostgreSQL)                 │
├─────────────────────────────────────────────────────────────────┤
│  organizacion_tipo_documento                                    │
│  organizacion_consecutivo_config                                │
│  organizacion_area                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Generación de Consecutivos

```
┌────────────────────────────────────────────────────────────────┐
│ 1. Módulo cliente solicita consecutivo                        │
│    (Recolección, Recepción, Proveedor, etc.)                  │
└────────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────────┐
│ 2. ConsecutivoConfig.obtener_siguiente_consecutivo()          │
│    - Busca configuración por tipo_documento.code              │
│    - Verifica que esté activa                                 │
└────────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────────┐
│ 3. get_next_number() [ATOMIC TRANSACTION]                     │
│    ┌────────────────────────────────────────────────────┐     │
│    │ SELECT FOR UPDATE (Lock de fila para thread-safe) │     │
│    │ - Verifica si debe reiniciar (año/mes)            │     │
│    │ - Reinicia current_number = 0 si aplica           │     │
│    │ - Incrementa current_number += 1                  │     │
│    │ - Guarda en BD                                     │     │
│    └────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────────┐
│ 4. format_number(number, date)                                │
│    - Construye partes: [prefix, area, fecha, numero, suffix] │
│    - Une con separador                                        │
│    - Retorna consecutivo formateado                           │
└────────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────────┐
│ 5. Módulo cliente usa el consecutivo                          │
│    - Asigna al campo correspondiente                          │
│    - Guarda el documento/entidad                              │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Modelos de Datos (Backend)

### 3.1 TipoDocumento

Define los tipos de documentos configurables por la empresa.

**Ubicación:** `backend/apps/gestion_estrategica/organizacion/models.py`

#### Campos

| Campo | Tipo | Descripción | Validación |
|-------|------|-------------|------------|
| `id` | BigAutoField | ID autogenerado | PK, auto |
| `code` | CharField(30) | Código único del tipo | UNIQUE, INDEX, requerido |
| `name` | CharField(100) | Nombre descriptivo | Requerido |
| `category` | CharField(20) | Categoría del documento | Choices, INDEX |
| `description` | TextField | Descripción opcional | Opcional |
| `is_system` | BooleanField | Indica si es del sistema | Default: False |
| `is_active` | BooleanField | Estado activo/inactivo | Default: True, INDEX |
| `order` | PositiveIntegerField | Orden de visualización | Default: 0 |
| `created_at` | DateTimeField | Fecha de creación | auto_now_add |
| `updated_at` | DateTimeField | Fecha de actualización | auto_now |

#### Categorías Disponibles

```python
CATEGORY_CHOICES = [
    ('OPERACIONAL', 'Operacional'),
    ('NORMATIVO', 'Sistema de Gestión'),
    ('CALIDAD_SST', 'Calidad y SST'),
    ('MAESTRO', 'Datos Maestros'),
    ('ANALISIS', 'Pruebas/Análisis'),
]
```

#### Relaciones

- **OneToOne → ConsecutivoConfig** (related_name='consecutivo_config')

#### Métodos

- `__str__()`: Retorna `"{code} - {name}"`

#### Ejemplo de Datos

```python
{
    "id": 1,
    "code": "RECOLECCION",
    "name": "Recolección / Voucher",
    "category": "OPERACIONAL",
    "description": "Voucher de recolección de materia prima de ecoaliados",
    "is_system": True,
    "is_active": True,
    "order": 1,
    "created_at": "2025-12-13T10:30:00Z",
    "updated_at": "2025-12-13T10:30:00Z"
}
```

---

### 3.2 ConsecutivoConfig

Configuración de numeración automática centralizada.

**Ubicación:** `backend/apps/gestion_estrategica/organizacion/models.py`

#### Campos

| Campo | Tipo | Descripción | Validación |
|-------|------|-------------|------------|
| `id` | BigAutoField | ID autogenerado | PK, auto |
| `tipo_documento` | OneToOneField | Tipo de documento asociado | PROTECT, requerido |
| `prefix` | CharField(10) | Prefijo del consecutivo | Requerido |
| `suffix` | CharField(10) | Sufijo opcional | Opcional |
| `current_number` | IntegerField | Número actual del consecutivo | Default: 0 |
| `padding` | IntegerField | Dígitos con relleno de ceros | Default: 5 |
| `include_year` | BooleanField | Incluir año (YYYY) | Default: True |
| `include_month` | BooleanField | Incluir mes (YYYYMM) | Default: False |
| `include_day` | BooleanField | Incluir día (YYYYMMDD) | Default: False |
| `separator` | CharField(1) | Separador entre partes | Choices, Default: '-' |
| `area` | ForeignKey | Área/proceso asociado | SET_NULL, opcional |
| `include_area` | BooleanField | Incluir código de área | Default: False |
| `reset_yearly` | BooleanField | Reiniciar cada año | Default: True |
| `reset_monthly` | BooleanField | Reiniciar cada mes | Default: False |
| `last_reset_date` | DateField | Última fecha de reinicio | Opcional |
| `is_active` | BooleanField | Estado activo/inactivo | Default: True |
| `created_at` | DateTimeField | Fecha de creación | auto_now_add |
| `updated_at` | DateTimeField | Fecha de actualización | auto_now |

#### Opciones de Separador

```python
SEPARATOR_CHOICES = [
    ('-', 'Guión (-)'),
    ('/', 'Diagonal (/)'),
    ('_', 'Guión bajo (_)'),
    ('', 'Sin separador'),
]
```

#### Relaciones

- **OneToOne ← TipoDocumento** (related_name='consecutivo_config')
- **ForeignKey → Area** (related_name='consecutivos', SET_NULL)

#### Métodos Principales

##### `get_next_number()` - Thread-safe

Obtiene el siguiente número consecutivo de forma segura en entornos concurrentes.

```python
def get_next_number(self):
    """Obtiene el siguiente número consecutivo (thread-safe)."""
    from django.db import transaction

    with transaction.atomic():
        # SELECT FOR UPDATE: Bloquea la fila para evitar race conditions
        config = ConsecutivoConfig.objects.select_for_update().get(pk=self.pk)
        today = timezone.now().date()
        should_reset = False

        # Verificar si debe reiniciar por año
        if config.reset_yearly and config.last_reset_date:
            if config.last_reset_date.year < today.year:
                should_reset = True

        # Verificar si debe reiniciar por mes
        if config.reset_monthly and config.last_reset_date:
            if (config.last_reset_date.year < today.year or
                config.last_reset_date.month < today.month):
                should_reset = True

        # Ejecutar reinicio si aplica
        if should_reset:
            config.current_number = 0
            config.last_reset_date = today

        # Incrementar y guardar
        config.current_number += 1
        config.save(update_fields=['current_number', 'last_reset_date', 'updated_at'])

        return config.current_number
```

**Características:**
- ✅ **Thread-safe**: Usa `select_for_update()` para bloquear la fila
- ✅ **Transacción atómica**: Garantiza consistencia en BD
- ✅ **Reinicio automático**: Detecta cambios de año/mes
- ✅ **Performance**: Solo actualiza campos necesarios

##### `format_number(number=None, date=None)`

Formatea el número consecutivo según la configuración.

```python
def format_number(self, number=None, date=None):
    """Formatea el número consecutivo según la configuración."""
    if number is None:
        number = self.current_number
    if date is None:
        date = timezone.now().date()

    sep = self.separator or ''
    parts = [self.prefix]

    # Agregar área si está configurado
    if self.include_area and self.area:
        parts.append(self.area.code)

    # Agregar fecha según configuración
    if self.include_day:
        parts.append(date.strftime('%Y%m%d'))
    elif self.include_month:
        parts.append(f"{date.year}{str(date.month).zfill(2)}")
    elif self.include_year:
        parts.append(str(date.year))

    # Agregar número con padding
    parts.append(str(number).zfill(self.padding))

    result = sep.join(parts)

    # Agregar sufijo si existe
    if self.suffix:
        result = f"{result}{sep}{self.suffix}"

    return result
```

**Ejemplos de salida:**
- `prefix="REC"`, `include_day=True`, `separator="-"`, `padding=4` → `REC-20251215-0001`
- `prefix="FAC"`, `include_year=True`, `separator="-"`, `padding=6` → `FAC-2025-000001`
- `prefix="MP"`, `include_area=False`, `separator="-"`, `padding=4` → `MP-0001`

##### `generate_next()`

Genera el siguiente consecutivo completo (número + formato).

```python
def generate_next(self):
    """Genera el siguiente consecutivo completo."""
    next_number = self.get_next_number()
    return self.format_number(next_number)
```

##### `obtener_siguiente_consecutivo(tipo_documento_code, area_code=None)` - Class Method

Método de clase para obtener consecutivos desde cualquier módulo.

```python
@classmethod
def obtener_siguiente_consecutivo(cls, tipo_documento_code, area_code=None):
    """
    Servicio centralizado para obtener el siguiente consecutivo.

    Args:
        tipo_documento_code: Código del tipo de documento
        area_code: Código del área opcional

    Returns:
        str: Consecutivo formateado completo
    """
    try:
        config = cls.objects.select_related('tipo_documento', 'area').get(
            tipo_documento__code=tipo_documento_code
        )
    except cls.DoesNotExist:
        raise cls.DoesNotExist(
            f"No existe configuración de consecutivo para '{tipo_documento_code}'. "
            f"Debe crear una configuración en Organización > Consecutivos."
        )

    if not config.is_active:
        raise ValueError(f"El consecutivo para '{tipo_documento_code}' está inactivo.")

    # Si se proporciona area_code, buscar el área
    original_area = config.area
    if area_code and config.include_area:
        try:
            config.area = Area.objects.get(code=area_code, is_active=True)
        except Area.DoesNotExist:
            pass  # Mantener área original

    try:
        consecutivo = config.generate_next()
    finally:
        config.area = original_area

    return consecutivo
```

**Uso desde otros módulos:**

```python
from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

# Generar consecutivo de recolección
codigo = ConsecutivoConfig.obtener_siguiente_consecutivo('RECOLECCION')
# Retorna: "REC-20251215-0001"

# Generar consecutivo de proveedor
codigo = ConsecutivoConfig.obtener_siguiente_consecutivo('PROVEEDOR_MP')
# Retorna: "MP-0001"
```

#### Ejemplo de Datos

```python
{
    "id": 1,
    "tipo_documento": {
        "id": 1,
        "code": "RECOLECCION",
        "name": "Recolección / Voucher"
    },
    "prefix": "REC",
    "suffix": None,
    "current_number": 127,
    "padding": 4,
    "include_year": False,
    "include_month": False,
    "include_day": True,
    "separator": "-",
    "area": None,
    "include_area": False,
    "reset_yearly": False,
    "reset_monthly": False,
    "last_reset_date": "2025-12-15",
    "is_active": True,
    "created_at": "2025-12-13T10:30:00Z",
    "updated_at": "2025-12-15T14:25:00Z"
}
```

**Consecutivo generado:** `REC-20251215-0128`

---

### 3.3 Area

Define las áreas/departamentos de la organización. Puede usarse en consecutivos jerárquicos.

**Ubicación:** `backend/apps/gestion_estrategica/organizacion/models.py`

#### Campos Relevantes para Consecutivos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BigAutoField | ID autogenerado |
| `code` | CharField(20) | Código único del área (ej: GER, OPE, ADM) |
| `name` | CharField(100) | Nombre del área |
| `parent` | ForeignKey | Área padre (jerarquía) |
| `is_active` | BooleanField | Estado activo/inactivo |

#### Relación con Consecutivos

- **ForeignKey ← ConsecutivoConfig** (related_name='consecutivos')

#### Ejemplo de Uso

Si un consecutivo tiene `include_area=True` y `area.code='SST'`:

```python
# Configuración
prefix = "NC"
include_year = True
include_area = True
area.code = "SST"
separator = "-"
padding = 4

# Resultado: NC-SST-2025-0001
```

---

## 4. API Endpoints

**Base URL:** `/api/organizacion/`

### 4.1 Tipos de Documento

#### GET `/api/organizacion/tipos-documento/`

Lista todos los tipos de documento.

**Query Parameters:**
- `category`: Filtrar por categoría (`OPERACIONAL`, `NORMATIVO`, etc.)
- `is_active`: Filtrar por estado (`true`/`false`)
- `is_system`: Filtrar por tipos del sistema (`true`/`false`)
- `search`: Búsqueda por código o nombre

**Response:**
```json
{
  "count": 33,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "code": "RECOLECCION",
      "name": "Recolección / Voucher",
      "category": "OPERACIONAL",
      "category_display": "Operacional",
      "is_active": true
    }
  ]
}
```

#### GET `/api/organizacion/tipos-documento/{id}/`

Detalle de un tipo de documento.

**Response:**
```json
{
  "id": 1,
  "code": "RECOLECCION",
  "name": "Recolección / Voucher",
  "category": "OPERACIONAL",
  "category_display": "Operacional",
  "description": "Voucher de recolección de materia prima",
  "is_system": true,
  "is_active": true,
  "order": 1,
  "has_consecutivo": true,
  "created_at": "2025-12-13T10:30:00Z",
  "updated_at": "2025-12-13T10:30:00Z"
}
```

#### POST `/api/organizacion/tipos-documento/`

Crear un nuevo tipo de documento (solo para tipos personalizados).

**Request Body:**
```json
{
  "code": "TIPO_CUSTOM",
  "name": "Tipo Personalizado",
  "category": "OPERACIONAL",
  "description": "Descripción opcional",
  "is_active": true,
  "order": 99
}
```

#### PUT/PATCH `/api/organizacion/tipos-documento/{id}/`

Actualizar un tipo de documento existente.

#### DELETE `/api/organizacion/tipos-documento/{id}/`

Eliminar un tipo de documento (solo si no es del sistema y no tiene consecutivo).

#### GET `/api/organizacion/tipos-documento/choices/`

Obtener opciones para formularios.

**Response:**
```json
{
  "categories": [
    {"value": "OPERACIONAL", "label": "Operacional"},
    {"value": "NORMATIVO", "label": "Sistema de Gestión"},
    {"value": "CALIDAD_SST", "label": "Calidad y SST"},
    {"value": "MAESTRO", "label": "Datos Maestros"},
    {"value": "ANALISIS", "label": "Pruebas/Análisis"}
  ]
}
```

---

### 4.2 Consecutivos

#### GET `/api/organizacion/consecutivos/`

Lista todas las configuraciones de consecutivos.

**Query Parameters:**
- `is_active`: Filtrar por estado (`true`/`false`)
- `tipo_documento__category`: Filtrar por categoría del tipo de documento
- `area`: Filtrar por área (ID)
- `search`: Búsqueda por prefijo, código o nombre de tipo

**Response:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "tipo_documento": 1,
      "tipo_documento_code": "RECOLECCION",
      "tipo_documento_name": "Recolección / Voucher",
      "prefix": "REC",
      "current_number": 127,
      "area_code": null,
      "is_active": true,
      "ejemplo": "REC-20251215-0128"
    }
  ]
}
```

#### GET `/api/organizacion/consecutivos/{id}/`

Detalle de una configuración de consecutivo.

**Response:**
```json
{
  "id": 1,
  "tipo_documento": 1,
  "tipo_documento_code": "RECOLECCION",
  "tipo_documento_name": "Recolección / Voucher",
  "prefix": "REC",
  "suffix": null,
  "current_number": 127,
  "padding": 4,
  "include_year": false,
  "include_month": false,
  "include_day": true,
  "separator": "-",
  "separator_display": "Guión (-)",
  "area": null,
  "area_code": null,
  "area_name": null,
  "include_area": false,
  "reset_yearly": false,
  "reset_monthly": false,
  "last_reset_date": "2025-12-15",
  "is_active": true,
  "ejemplo_formato": "REC-20251215-0001",
  "created_at": "2025-12-13T10:30:00Z",
  "updated_at": "2025-12-15T14:25:00Z"
}
```

#### POST `/api/organizacion/consecutivos/`

Crear una nueva configuración de consecutivo.

**Request Body:**
```json
{
  "tipo_documento": 5,
  "prefix": "FAC",
  "suffix": null,
  "padding": 6,
  "include_year": true,
  "include_month": false,
  "include_day": false,
  "separator": "-",
  "area": null,
  "include_area": false,
  "reset_yearly": true,
  "reset_monthly": false,
  "is_active": true
}
```

**Response:** Same as GET detail

#### PUT/PATCH `/api/organizacion/consecutivos/{id}/`

Actualizar una configuración de consecutivo.

**Note:** El campo `current_number` es read-only y solo puede modificarse mediante el endpoint de generación.

#### DELETE `/api/organizacion/consecutivos/{id}/`

Eliminar una configuración de consecutivo.

#### GET `/api/organizacion/consecutivos/choices/`

Obtener opciones para formularios.

**Response:**
```json
{
  "separators": [
    {"value": "-", "label": "Guión (-)"},
    {"value": "/", "label": "Diagonal (/)"},
    {"value": "_", "label": "Guión bajo (_)"},
    {"value": "", "label": "Sin separador"}
  ],
  "tipos_documento": [
    {"value": 1, "label": "RECOLECCION - Recolección / Voucher"},
    {"value": 2, "label": "RECEPCION - Recepción de Materia Prima"}
  ],
  "areas": [
    {"value": 1, "label": "GER - Gerencia"},
    {"value": 2, "label": "SST - Seguridad y Salud en el Trabajo"}
  ]
}
```

#### POST `/api/organizacion/consecutivos/{id}/generate/`

Generar el siguiente consecutivo para una configuración específica.

**Request:** (vacío)

**Response:**
```json
{
  "consecutivo": "REC-20251215-0128",
  "current_number": 128
}
```

**Errores:**
- `400 Bad Request`: Consecutivo inactivo
- `404 Not Found`: Configuración no encontrada

#### POST `/api/organizacion/consecutivos/generate_by_type/`

**Endpoint principal** para generar consecutivos desde cualquier módulo.

**Request Body:**
```json
{
  "tipo_documento_code": "RECOLECCION",
  "area_code": null
}
```

**Response:**
```json
{
  "consecutivo": "REC-20251215-0128"
}
```

**Errores:**
- `400 Bad Request`: `tipo_documento_code` requerido o consecutivo inactivo
- `404 Not Found`: No existe configuración para el tipo de documento

**Ejemplo de uso con cURL:**
```bash
curl -X POST http://localhost:8000/api/organizacion/consecutivos/generate_by_type/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tipo_documento_code": "PROVEEDOR_MP"
  }'
```

---

### 4.3 Áreas

#### GET `/api/organizacion/areas/`

Lista todas las áreas.

**Query Parameters:**
- `is_active`: Filtrar por estado
- `parent`: Filtrar por área padre (ID)
- `show_inactive`: Incluir áreas inactivas (`true`/`false`)
- `search`: Búsqueda por código, nombre, descripción

**Response:**
```json
{
  "count": 8,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "code": "GER",
      "name": "Gerencia",
      "parent": null,
      "parent_name": null,
      "is_active": true
    }
  ]
}
```

#### GET `/api/organizacion/areas/tree/`

Obtener árbol jerárquico completo de áreas.

**Response:**
```json
[
  {
    "id": 1,
    "code": "GER",
    "name": "Gerencia",
    "children": [
      {
        "id": 2,
        "code": "OPE",
        "name": "Operaciones",
        "children": []
      }
    ]
  }
]
```

---

## 5. Lógica de Generación de Consecutivos

### 5.1 Algoritmo Paso a Paso

```
INICIO GenerarConsecutivo(tipo_documento_code)

  1. VALIDAR configuración existe
     └─ ConsecutivoConfig.objects.get(tipo_documento__code=tipo_documento_code)
     └─ Si NO existe → Lanzar DoesNotExist
     └─ Si is_active=False → Lanzar ValueError

  2. INICIAR transacción atómica
     └─ transaction.atomic()

  3. BLOQUEAR fila (SELECT FOR UPDATE)
     └─ config = ConsecutivoConfig.objects.select_for_update().get(pk=self.pk)
     └─ Previene race conditions en concurrencia

  4. OBTENER fecha actual
     └─ today = timezone.now().date()

  5. VERIFICAR si debe reiniciar
     a) Si reset_yearly=True Y last_reset_date.year < today.year
        └─ should_reset = True
     b) Si reset_monthly=True Y (año diferente O mes diferente)
        └─ should_reset = True

  6. EJECUTAR reinicio si aplica
     └─ Si should_reset:
        ├─ current_number = 0
        └─ last_reset_date = today

  7. INCREMENTAR número
     └─ current_number += 1

  8. GUARDAR cambios en BD
     └─ save(update_fields=['current_number', 'last_reset_date', 'updated_at'])

  9. FORMATEAR consecutivo
     a) parts = [prefix]
     b) Si include_area Y area existe → parts.append(area.code)
     c) Si include_day → parts.append("YYYYMMDD")
        O Si include_month → parts.append("YYYYMM")
        O Si include_year → parts.append("YYYY")
     d) parts.append(str(number).zfill(padding))
     e) result = separator.join(parts)
     f) Si suffix → result += separator + suffix

 10. RETORNAR consecutivo formateado
     └─ return result (ej: "REC-20251215-0128")

FIN
```

### 5.2 Thread-Safety y Concurrencia

El sistema garantiza thread-safety mediante:

#### 5.2.1 SELECT FOR UPDATE

```python
config = ConsecutivoConfig.objects.select_for_update().get(pk=self.pk)
```

**Comportamiento:**
- Bloquea la fila en la base de datos
- Otros threads esperan hasta que se libere el lock
- Previene race conditions donde dos requests generen el mismo número

**Ejemplo de escenario concurrente:**

```
Thread A                          Thread B
├─ START transaction             ├─ START transaction
├─ SELECT FOR UPDATE (LOCK)      ├─ SELECT FOR UPDATE (WAIT...)
├─ current_number = 100          │
├─ current_number += 1 = 101     │
├─ SAVE (101)                    │
├─ COMMIT (RELEASE LOCK)         │
                                 ├─ (LOCK ACQUIRED)
                                 ├─ current_number = 101
                                 ├─ current_number += 1 = 102
                                 ├─ SAVE (102)
                                 ├─ COMMIT
```

✅ **Resultado:** Thread A obtiene 101, Thread B obtiene 102 (sin duplicados)

#### 5.2.2 Transacciones Atómicas

```python
with transaction.atomic():
    # Todas las operaciones son atómicas
    # Si algo falla, se hace rollback completo
```

**Garantías:**
- Consistencia de datos
- Rollback automático en caso de error
- Aislamiento de operaciones

### 5.3 Reinicio Anual y Mensual

#### 5.3.1 Reinicio Anual

```python
if config.reset_yearly and config.last_reset_date:
    if config.last_reset_date.year < today.year:
        should_reset = True
```

**Ejemplo:**
```
last_reset_date: 2024-12-31
today: 2025-01-01
Resultado: Reinicia a current_number = 0
```

#### 5.3.2 Reinicio Mensual

```python
if config.reset_monthly and config.last_reset_date:
    if (config.last_reset_date.year < today.year or
        config.last_reset_date.month < today.month):
        should_reset = True
```

**Ejemplo:**
```
last_reset_date: 2025-11-30
today: 2025-12-01
Resultado: Reinicia a current_number = 0
```

#### 5.3.3 Sin Reinicio

Si `reset_yearly=False` y `reset_monthly=False`:
- El número incrementa indefinidamente
- Útil para códigos de clientes, proveedores, etc.

### 5.4 Formato del Consecutivo

#### Componentes del Formato

```
[PREFIX] [SEPARADOR] [AREA] [SEPARADOR] [FECHA] [SEPARADOR] [NUMERO] [SEPARADOR] [SUFFIX]
```

#### Ejemplos de Formatos

| Config | Resultado |
|--------|-----------|
| `prefix="REC"`, `include_day=True`, `separator="-"`, `padding=4` | `REC-20251215-0001` |
| `prefix="FAC"`, `include_year=True`, `separator="-"`, `padding=6` | `FAC-2025-000001` |
| `prefix="MP"`, `separator="-"`, `padding=4` | `MP-0001` |
| `prefix="NC"`, `include_area=True`, `area="SST"`, `include_year=True` | `NC-SST-2025-0001` |
| `prefix="PROC"`, `include_area=True`, `area="CAL"`, `separator="-"`, `padding=3` | `PROC-CAL-001` |
| `prefix="OC"`, `include_month=True`, `separator="/"`, `padding=5` | `OC/202512/00001` |

---

## 6. Integración con Módulos

### 6.1 Recolecciones

**Archivo:** `backend/apps/recolecciones/models.py`

#### Uso del Consecutivo

```python
@classmethod
def generar_codigo_voucher(cls, max_retries=5):
    """
    Genera un codigo unico para el voucher de forma thread-safe.

    Usa el sistema centralizado de consecutivos (ConsecutivoConfig)
    que ya implementa select_for_update() y manejo de reinicio automático.

    Formato: REC-YYYYMMDD-XXXX (ej: REC-20241125-0001)
    """
    from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

    try:
        # El servicio centralizado ya es thread-safe con select_for_update()
        return ConsecutivoConfig.obtener_siguiente_consecutivo('RECOLECCION')
    except ConsecutivoConfig.DoesNotExist:
        # Fallback al método legacy si no existe configuración
        # (código legacy omitido por brevedad)
        ...
```

#### Campo en Modelo

```python
class Recoleccion(models.Model):
    codigo_voucher = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Codigo de voucher',
        help_text='Codigo unico del voucher generado (formato: REC-YYYYMMDD-XXXX)'
    )
```

#### Flujo de Creación

```
1. Usuario registra recolección
2. Sistema llama: codigo = Recoleccion.generar_codigo_voucher()
3. ConsecutivoConfig genera: "REC-20251215-0128"
4. Se asigna al campo codigo_voucher
5. Se guarda la recolección
```

---

### 6.2 Recepciones

**Archivo:** `backend/apps/recepciones/models.py`

#### Uso del Consecutivo

```python
@classmethod
def generar_codigo_recepcion(cls):
    """
    Genera un código único para la recepción.

    Usa el sistema centralizado de consecutivos (ConsecutivoConfig).
    Formato: RMP-YYYYMMDD-XXXX (ej: RMP-20241204-0001)
    """
    from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

    try:
        return ConsecutivoConfig.obtener_siguiente_consecutivo('RECEPCION')
    except ConsecutivoConfig.DoesNotExist:
        # Fallback al método legacy
        ...
```

#### Campo en Modelo

```python
class RecepcionMateriaPrima(models.Model):
    codigo_recepcion = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código de recepción',
        help_text='Código único de la recepción (formato: RMP-YYYYMMDD-XXXX)'
    )
```

---

### 6.3 Proveedores

**Archivo:** `backend/apps/proveedores/models.py`

#### Uso del Consecutivo

```python
@staticmethod
def generar_codigo_interno(tipo_proveedor):
    """
    Genera el siguiente código interno único para un proveedor según su tipo.

    Usa el sistema centralizado de consecutivos (ConsecutivoConfig).

    Prefijos:
    - MP: Materia Prima (MATERIA_PRIMA_EXTERNO y UNIDAD_NEGOCIO) -> PROVEEDOR_MP
    - PS: Productos y Servicios (PRODUCTO_SERVICIO) -> PROVEEDOR_PS

    Formato: MP-0001, PS-0001, etc.
    """
    from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

    # Determinar tipo de documento según tipo de proveedor
    if tipo_proveedor == 'PRODUCTO_SERVICIO':
        document_type = 'PROVEEDOR_PS'
    else:
        # MATERIA_PRIMA_EXTERNO y UNIDAD_NEGOCIO usan PROVEEDOR_MP
        document_type = 'PROVEEDOR_MP'

    try:
        return ConsecutivoConfig.obtener_siguiente_consecutivo(document_type)
    except ConsecutivoConfig.DoesNotExist:
        # Fallback al método legacy
        ...
```

#### Campo en Modelo

```python
class Proveedor(models.Model):
    codigo_interno = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código interno',
        help_text='Código único autogenerado (MP-0001 para materia prima, PS-0001 para productos/servicios)'
    )
```

---

### 6.4 Otros Módulos que Pueden Usar Consecutivos

Los siguientes tipos de documento están preconfigurados y listos para usar:

#### Operacionales
- `LOTE`: Lotes de producción
- `DESPACHO`: Despachos de producto terminado
- `FACTURA`: Facturas de venta
- `ORDEN_COMPRA`: Órdenes de compra
- `REQUISICION`: Requisiciones de materiales
- `REMISION`: Remisiones
- `COTIZACION`: Cotizaciones
- `ORDEN_TRABAJO`: Órdenes de trabajo
- `ACTA_COMITE`: Actas de comités

#### Sistema de Gestión
- `PROCEDIMIENTO`: Procedimientos documentados (ej: PROC-SST-001)
- `INSTRUCTIVO`: Instructivos de trabajo (ej: INST-CAL-001)
- `FORMATO`: Formatos controlados (ej: FORM-SST-001)
- `PROTOCOLO`: Protocolos
- `MANUAL`: Manuales
- `PROGRAMA`: Programas de gestión
- `PLAN`: Planes estratégicos

#### Calidad y SST
- `NO_CONFORMIDAD`: No conformidades (ej: NC-SST-2025-0001)
- `ACCION_CORRECTIVA`: Acciones correctivas
- `ACCION_PREVENTIVA`: Acciones preventivas
- `ACCION_MEJORA`: Acciones de mejora
- `INCIDENTE`: Reportes de incidentes
- `ACCIDENTE`: Reportes de accidentes
- `INVESTIGACION`: Investigaciones
- `AUDITORIA`: Auditorías
- `CAPACITACION`: Capacitaciones

#### Datos Maestros
- `CLIENTE`: Códigos de clientes
- `ECOALIADO`: Códigos de ecoaliados (ej: ECO-0001)

#### Análisis
- `PRUEBA_ACIDEZ`: Pruebas de acidez (ej: ACID-20251215-0001)
- `ANALISIS_CALIDAD`: Análisis de calidad

---

## 7. Frontend - Componentes e Integración

### 7.1 API Client

**Archivo:** `frontend/src/features/gestion-estrategica/api/organizacionApi.ts`

#### Funciones Principales

```typescript
export const consecutivosApi = {
  // Listar todos los consecutivos
  getAll: async (filters?: ConsecutivoFilters): Promise<PaginatedResponse<ConsecutivoConfigList>> => {
    const response = await axiosInstance.get(`${BASE_URL}/consecutivos/`, { params: filters });
    return response.data;
  },

  // Obtener detalle por ID
  getById: async (id: number): Promise<ConsecutivoConfig> => {
    const response = await axiosInstance.get(`${BASE_URL}/consecutivos/${id}/`);
    return response.data;
  },

  // Crear nuevo consecutivo
  create: async (data: CreateConsecutivoDTO): Promise<ConsecutivoConfig> => {
    const response = await axiosInstance.post(`${BASE_URL}/consecutivos/`, data);
    return response.data;
  },

  // Actualizar consecutivo
  update: async (id: number, data: UpdateConsecutivoDTO): Promise<ConsecutivoConfig> => {
    const response = await axiosInstance.patch(`${BASE_URL}/consecutivos/${id}/`, data);
    return response.data;
  },

  // Eliminar consecutivo
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/consecutivos/${id}/`);
  },

  // Obtener opciones para formularios
  getChoices: async (): Promise<{
    separators: SelectOption[];
    tipos_documento: SelectOption[];
    areas: SelectOption[];
  }> => {
    const response = await axiosInstance.get(`${BASE_URL}/consecutivos/choices/`);
    return response.data;
  },

  // Generar consecutivo por ID
  generate: async (id: number): Promise<GenerateConsecutivoResponse> => {
    const response = await axiosInstance.post(`${BASE_URL}/consecutivos/${id}/generate/`);
    return response.data;
  },

  // Generar consecutivo por tipo de documento (PRINCIPAL)
  generateByType: async (tipoDocumentoCode: string, areaCode?: string): Promise<GenerateConsecutivoResponse> => {
    const response = await axiosInstance.post(`${BASE_URL}/consecutivos/generate_by_type/`, {
      tipo_documento_code: tipoDocumentoCode,
      area_code: areaCode,
    });
    return response.data;
  },
};
```

---

### 7.2 Tipos TypeScript

**Archivo:** `frontend/src/features/gestion-estrategica/api/organizacionApi.ts`

```typescript
export interface ConsecutivoConfig {
  id: number;
  tipo_documento: number;
  tipo_documento_code: string;
  tipo_documento_name: string;
  prefix: string;
  suffix?: string;
  current_number: number;
  padding: number;
  include_year: boolean;
  include_month: boolean;
  include_day: boolean;
  separator: string;
  separator_display: string;
  area?: number;
  area_code?: string;
  area_name?: string;
  include_area: boolean;
  reset_yearly: boolean;
  reset_monthly: boolean;
  last_reset_date?: string;
  is_active: boolean;
  ejemplo_formato: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConsecutivoDTO {
  tipo_documento: number;
  prefix: string;
  suffix?: string;
  padding?: number;
  include_year?: boolean;
  include_month?: boolean;
  include_day?: boolean;
  separator?: string;
  area?: number;
  include_area?: boolean;
  reset_yearly?: boolean;
  reset_monthly?: boolean;
  is_active?: boolean;
}

export interface GenerateConsecutivoResponse {
  consecutivo: string;
  current_number?: number;
}
```

---

### 7.3 Componentes UI

#### ConsecutivosSection

**Ubicación:** `frontend/src/features/gestion-estrategica/components/ConsecutivosSection.tsx`

Componente principal que muestra y gestiona las configuraciones de consecutivos.

**Características:**
- Tabla con lista de consecutivos configurados
- Filtros por categoría, estado, tipo de documento
- Vista previa del formato en cada fila
- Botones para crear, editar, eliminar
- Generación de prueba de consecutivos

#### ConsecutivoFormModal

**Ubicación:** `frontend/src/features/gestion-estrategica/components/modals/ConsecutivoFormModal.tsx`

Modal para crear/editar configuraciones de consecutivos.

**Campos del formulario:**
- Tipo de Documento (select)
- Prefijo (text)
- Sufijo (text, opcional)
- Padding (number, 1-10)
- Incluir Año (checkbox)
- Incluir Mes (checkbox)
- Incluir Día (checkbox)
- Separador (select: -, /, _, ninguno)
- Incluir Área (checkbox)
- Área (select, condicional)
- Reinicio Anual (checkbox)
- Reinicio Mensual (checkbox)
- Estado Activo (checkbox)

**Vista previa en tiempo real:**
El modal muestra un ejemplo del consecutivo generado mientras el usuario configura.

---

### 7.4 Hooks Personalizados

#### useStrategic

**Ubicación:** `frontend/src/features/gestion-estrategica/hooks/useStrategic.ts`

```typescript
// Hook para gestionar consecutivos
export const useConsecutivos = () => {
  const [consecutivos, setConsecutivos] = useState<ConsecutivoConfigList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsecutivos = async (filters?: ConsecutivoFilters) => {
    setLoading(true);
    try {
      const data = await consecutivosApi.getAll(filters);
      setConsecutivos(data.results);
    } catch (err) {
      setError('Error al cargar consecutivos');
    } finally {
      setLoading(false);
    }
  };

  const createConsecutivo = async (data: CreateConsecutivoDTO) => {
    const newConsecutivo = await consecutivosApi.create(data);
    setConsecutivos([...consecutivos, newConsecutivo]);
    return newConsecutivo;
  };

  return {
    consecutivos,
    loading,
    error,
    fetchConsecutivos,
    createConsecutivo,
  };
};
```

---

## 8. Migraciones y Datos Iniciales

### 8.1 Lista de Migraciones

**App:** `gestion_estrategica/organizacion`

1. **`0001_initial.py`**
   - Crea modelo Area

2. **`0002_tipodocumento_consecutivoconfig.py`**
   - Crea modelos TipoDocumento y ConsecutivoConfig
   - Define relaciones OneToOne y ForeignKey

3. **`0003_populate_tipos_documento.py`**
   - Puebla 33 tipos de documento predefinidos del sistema

**App anterior:** `core` (migrados)

- **`0010_extend_consecutivo_config.py`**: Extensión de modelo (legacy)
- **`0011_populate_initial_consecutivos.py`**: Población de consecutivos iniciales (legacy)
- **`0012_move_consecutivos_to_organizacion.py`**: Migración de datos a nueva app
- **`0013_delete_consecutivoconfig_and_more.py`**: Eliminación de modelos legacy

---

### 8.2 Tipos de Documento Predefinidos (Los 33)

**Migración:** `0003_populate_tipos_documento.py`

#### OPERACIONAL (11 tipos)

| Code | Name | Order |
|------|------|-------|
| RECOLECCION | Recolección / Voucher | 1 |
| RECEPCION | Recepción de Materia Prima | 2 |
| LOTE | Lote de Producción | 3 |
| DESPACHO | Despacho | 4 |
| FACTURA | Factura | 5 |
| ORDEN_COMPRA | Orden de Compra | 6 |
| REQUISICION | Requisición | 7 |
| REMISION | Remisión | 8 |
| COTIZACION | Cotización | 9 |
| ORDEN_TRABAJO | Orden de Trabajo | 10 |
| ACTA_COMITE | Acta de Comité | 11 |

#### NORMATIVO (7 tipos)

| Code | Name | Order |
|------|------|-------|
| PROCEDIMIENTO | Procedimiento | 1 |
| INSTRUCTIVO | Instructivo | 2 |
| FORMATO | Formato | 3 |
| PROTOCOLO | Protocolo | 4 |
| MANUAL | Manual | 5 |
| PROGRAMA | Programa | 6 |
| PLAN | Plan | 7 |

#### CALIDAD_SST (9 tipos)

| Code | Name | Order |
|------|------|-------|
| NO_CONFORMIDAD | No Conformidad | 1 |
| ACCION_CORRECTIVA | Acción Correctiva | 2 |
| ACCION_PREVENTIVA | Acción Preventiva | 3 |
| ACCION_MEJORA | Acción de Mejora | 4 |
| INCIDENTE | Reporte de Incidente | 5 |
| ACCIDENTE | Reporte de Accidente | 6 |
| INVESTIGACION | Investigación | 7 |
| AUDITORIA | Auditoría | 8 |
| CAPACITACION | Capacitación | 9 |

#### MAESTRO (4 tipos)

| Code | Name | Order |
|------|------|-------|
| PROVEEDOR_MP | Código Proveedor Materia Prima | 1 |
| PROVEEDOR_PS | Código Proveedor Productos/Servicios | 2 |
| CLIENTE | Código Cliente | 3 |
| ECOALIADO | Código Ecoaliado | 4 |

#### ANALISIS (2 tipos)

| Code | Name | Order |
|------|------|-------|
| PRUEBA_ACIDEZ | Prueba de Acidez | 1 |
| ANALISIS_CALIDAD | Análisis de Calidad | 2 |

**Total:** 33 tipos predefinidos, todos con `is_system=True`

---

### 8.3 Configuraciones Iniciales de Consecutivos

Las siguientes configuraciones se crean automáticamente para los módulos existentes:

| Tipo Documento | Prefix | Formato | Reinicio | Ejemplo |
|----------------|--------|---------|----------|---------|
| RECOLECCION | REC | REC-YYYYMMDD-XXXX | No | REC-20251215-0001 |
| RECEPCION | RMP | RMP-YYYYMMDD-XXXX | No | RMP-20251215-0001 |
| FACTURA | FAC | FAC-YYYY-XXXXXX | Anual | FAC-2025-000001 |
| ORDEN_COMPRA | OC | OC-YYYY-XXXXX | Anual | OC-2025-00001 |
| PROVEEDOR_MP | MP | MP-XXXX | No | MP-0001 |
| PROVEEDOR_PS | PS | PS-XXXX | No | PS-0001 |
| ECOALIADO | ECO | ECO-XXXX | No | ECO-0001 |
| PRUEBA_ACIDEZ | ACID | ACID-YYYYMMDD-XXXX | No | ACID-20251215-0001 |

---

## 9. Configuración y Ejemplos Prácticos

### 9.1 Crear una Nueva Configuración

#### Ejemplo 1: Órdenes de Trabajo Mensuales

**Requisito:** Códigos de órdenes de trabajo que reinicien cada mes.

**Configuración:**
```python
{
    "tipo_documento": <ID de ORDEN_TRABAJO>,
    "prefix": "OT",
    "suffix": None,
    "padding": 4,
    "include_year": False,
    "include_month": True,
    "include_day": False,
    "separator": "/",
    "area": None,
    "include_area": False,
    "reset_yearly": False,
    "reset_monthly": True,
    "is_active": True
}
```

**Resultado:**
- Enero 2025: `OT/202501/0001`, `OT/202501/0002`, ...
- Febrero 2025: `OT/202502/0001`, `OT/202502/0002`, ...

---

#### Ejemplo 2: Procedimientos por Área

**Requisito:** Procedimientos con código de área del sistema de gestión.

**Configuración:**
```python
{
    "tipo_documento": <ID de PROCEDIMIENTO>,
    "prefix": "PROC",
    "suffix": None,
    "padding": 3,
    "include_year": False,
    "include_month": False,
    "include_day": False,
    "separator": "-",
    "area": <ID de área SST>,
    "include_area": True,
    "reset_yearly": False,
    "reset_monthly": False,
    "is_active": True
}
```

**Resultado:**
- `PROC-SST-001`
- `PROC-SST-002`
- `PROC-CAL-001` (si se cambia el área a Calidad)

---

#### Ejemplo 3: Facturas con Sufijo

**Requisito:** Facturas con sufijo de sede.

**Configuración:**
```python
{
    "tipo_documento": <ID de FACTURA>,
    "prefix": "FAC",
    "suffix": "BOG",
    "padding": 6,
    "include_year": True,
    "include_month": False,
    "include_day": False,
    "separator": "-",
    "area": None,
    "include_area": False,
    "reset_yearly": True,
    "reset_monthly": False,
    "is_active": True
}
```

**Resultado:**
- `FAC-2025-000001-BOG`
- `FAC-2025-000002-BOG`
- En 2026: `FAC-2026-000001-BOG` (reinicia)

---

### 9.2 Uso desde Python

#### Generar Consecutivo Básico

```python
from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

# Generar consecutivo de recolección
codigo = ConsecutivoConfig.obtener_siguiente_consecutivo('RECOLECCION')
print(codigo)  # REC-20251215-0128
```

#### Generar Consecutivo con Área

```python
# Generar consecutivo de procedimiento para área SST
codigo = ConsecutivoConfig.obtener_siguiente_consecutivo('PROCEDIMIENTO', area_code='SST')
print(codigo)  # PROC-SST-001
```

#### Manejo de Errores

```python
from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

try:
    codigo = ConsecutivoConfig.obtener_siguiente_consecutivo('TIPO_INEXISTENTE')
except ConsecutivoConfig.DoesNotExist as e:
    print(f"Error: {e}")
    # Error: No existe configuración de consecutivo para 'TIPO_INEXISTENTE'.
    #        Debe crear una configuración en Organización > Consecutivos.

try:
    codigo = ConsecutivoConfig.obtener_siguiente_consecutivo('FACTURA')
except ValueError as e:
    print(f"Error: {e}")
    # Error: El consecutivo para 'FACTURA' está inactivo.
```

---

### 9.3 Uso desde Frontend

#### Generar Consecutivo en Formulario

```typescript
import { consecutivosApi } from '@/features/gestion-estrategica/api/organizacionApi';

const handleGenerateConsecutivo = async () => {
  try {
    const response = await consecutivosApi.generateByType('RECOLECCION');
    console.log(response.consecutivo); // "REC-20251215-0128"

    // Usar en el formulario
    setFormData({
      ...formData,
      codigo_voucher: response.consecutivo
    });
  } catch (error) {
    console.error('Error al generar consecutivo:', error);
  }
};
```

#### Crear Nueva Configuración

```typescript
import { consecutivosApi } from '@/features/gestion-estrategica/api/organizacionApi';

const createNewConfig = async () => {
  const data = {
    tipo_documento: 5, // ID de FACTURA
    prefix: 'FAC',
    padding: 6,
    include_year: true,
    separator: '-',
    reset_yearly: true,
    is_active: true
  };

  try {
    const config = await consecutivosApi.create(data);
    console.log('Configuración creada:', config);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 10. Consideraciones de Seguridad y Performance

### 10.1 Seguridad

#### Validaciones de Entrada

✅ **OneToOneField para tipo_documento**: Garantiza que cada tipo tenga máximo una configuración
✅ **Validación de is_active**: Previene generación de consecutivos inactivos
✅ **Protección PROTECT en ForeignKey**: No permite eliminar tipo_documento si tiene consecutivo

#### Permisos

- Las configuraciones de consecutivos solo deben ser modificables por administradores
- La generación de consecutivos es automática (no requiere permisos especiales)

#### Auditoría

- Todos los cambios se registran con `created_at` y `updated_at`
- El campo `current_number` es read-only desde la API (solo se modifica por generación)

---

### 10.2 Performance

#### Índices de Base de Datos

```python
class Meta:
    indexes = [
        models.Index(fields=['tipo_documento']),
        models.Index(fields=['is_active']),
    ]
```

✅ Consultas rápidas por tipo de documento
✅ Filtros eficientes por estado activo

#### Optimizaciones de Query

```python
# Uso de select_related para reducir queries
config = cls.objects.select_related('tipo_documento', 'area').get(
    tipo_documento__code=tipo_documento_code
)
```

✅ Evita N+1 queries
✅ Carga relaciones en una sola consulta

#### Transacciones Cortas

```python
with transaction.atomic():
    config = ConsecutivoConfig.objects.select_for_update().get(pk=self.pk)
    config.current_number += 1
    config.save(update_fields=['current_number', 'last_reset_date', 'updated_at'])
```

✅ Solo actualiza campos necesarios
✅ Transacción rápida para minimizar locks

#### Caching (Recomendación Futura)

Actualmente NO implementado, pero se recomienda:

```python
from django.core.cache import cache

# Cache de configuraciones activas (5 minutos)
cache_key = f'consecutivo_config_{tipo_documento_code}'
config = cache.get(cache_key)

if not config:
    config = ConsecutivoConfig.objects.get(tipo_documento__code=tipo_documento_code)
    cache.set(cache_key, config, 300)  # 5 minutos
```

⚠️ **Importante:** Invalidar cache al actualizar configuración

---

### 10.3 Escalabilidad

#### Concurrencia Masiva

El sistema está diseñado para soportar alta concurrencia:

- ✅ SELECT FOR UPDATE garantiza locks a nivel de fila
- ✅ Transacciones atómicas previenen inconsistencias
- ✅ Reintentos automáticos en caso de IntegrityError (en métodos legacy)

#### Migración a Múltiples Bases de Datos

Si en el futuro se requiere:

```python
# Configurar base de datos específica para consecutivos
class ConsecutivoConfig(models.Model):
    class Meta:
        app_label = 'organizacion'
        db_table = 'organizacion_consecutivo_config'

    # Usar router de BD
    def save(self, *args, **kwargs):
        using = kwargs.pop('using', 'consecutivos_db')
        super().save(using=using, *args, **kwargs)
```

---

### 10.4 Monitoreo y Troubleshooting

#### Logs Recomendados

```python
import logging

logger = logging.getLogger(__name__)

def get_next_number(self):
    try:
        with transaction.atomic():
            config = ConsecutivoConfig.objects.select_for_update().get(pk=self.pk)
            # ... lógica ...
            logger.info(f"Consecutivo generado: {config.tipo_documento.code} = {config.current_number}")
    except Exception as e:
        logger.error(f"Error generando consecutivo: {e}")
        raise
```

#### Queries de Diagnóstico

```sql
-- Ver configuraciones activas
SELECT
    t.code,
    t.name,
    c.prefix,
    c.current_number,
    c.last_reset_date
FROM organizacion_consecutivo_config c
INNER JOIN organizacion_tipo_documento t ON c.tipo_documento_id = t.id
WHERE c.is_active = true;

-- Detectar configuraciones sin uso
SELECT
    t.code,
    c.current_number,
    c.created_at,
    c.updated_at
FROM organizacion_consecutivo_config c
INNER JOIN organizacion_tipo_documento t ON c.tipo_documento_id = t.id
WHERE c.current_number = 0
  AND c.created_at < NOW() - INTERVAL '30 days';
```

---

## Apéndices

### A. Glosario

- **Consecutivo**: Código único generado automáticamente para documentos o entidades
- **Thread-safe**: Seguro para ejecución concurrente sin race conditions
- **SELECT FOR UPDATE**: Mecanismo de bloqueo de filas en base de datos
- **Padding**: Relleno con ceros a la izquierda (ej: 0001, 0002)
- **Tipo de Documento**: Categoría de documento configurable en el sistema
- **Reinicio**: Acción de volver el contador a 0 (anual, mensual o sin reinicio)

### B. Referencias

- **Django Documentation - select_for_update()**: https://docs.djangoproject.com/en/5.0/ref/models/querysets/#select-for-update
- **Django REST Framework**: https://www.django-rest-framework.org/
- **PostgreSQL Row Locking**: https://www.postgresql.org/docs/current/explicit-locking.html

### C. Historial de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-12-13 | 1.0 | Sistema inicial de consecutivos creado |
| 2025-12-14 | 1.1 | Migración de modelos a app `organizacion` |
| 2025-12-15 | 1.2 | Documentación técnica completa |

---

**Fin del Informe Técnico**

**Generado el:** 15 de Diciembre de 2025
**Contacto Técnico:** Equipo de Desarrollo - Grasas y Huesos del Norte
