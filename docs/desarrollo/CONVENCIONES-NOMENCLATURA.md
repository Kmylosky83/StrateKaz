# Convenciones de Nomenclatura

> **Documento creado:** 25 Diciembre 2025
> **Última actualización:** 25 Diciembre 2025
> **Propósito:** Evitar inconsistencias entre backend, frontend y documentación

Este documento define las convenciones de nomenclatura para mantener consistencia en todo el proyecto.

---

## REGLA DE ORO

```
┌─────────────────────────────────────────────────────────────────────┐
│  NOMENCLATURA ESTÁNDAR - Proyecto StrateKaz (Colombia)              │
├─────────────────────────────────────────────────────────────────────┤
│  • Formato general:        snake_case (nunca camelCase)             │
│  • Campos de auditoría:    INGLÉS (created_at, updated_at, is_*)    │
│  • Campos de negocio:      ESPAÑOL (nombre, descripcion, fecha_*)   │
│  • Valores de enums:       minúsculas (propuesto, ejecucion)        │
│  • URLs de API:            kebab-case (/revision-direccion/)        │
│  • Labels UI:              Español capitalizado ("En Ejecución")    │
│  • TypeScript:             SINCRONIZADO con backend (idéntico)      │
└─────────────────────────────────────────────────────────────────────┘
```

### ¿Por qué esta convención?

| Tipo de Campo | Idioma | Justificación |
|--------------|--------|---------------|
| **Auditoría** | Inglés | Son patrones universales de ingeniería. Todos los desarrolladores (locales e internacionales) reconocen `created_at`, `is_active`. Facilita uso de librerías y documentación. |
| **Negocio** | Español | El dominio de negocio es colombiano. Stakeholders, reportes, documentación legal y normativa (Decreto 1072, Resolución 0312, ISO) están en español. |
| **Enums** | minúsculas | Consistencia con valores almacenados en BD. Evita errores de sincronización backend-frontend. |

### Campos en Inglés (Estándar Técnico)

```python
# Campos de auditoría y estado - SIEMPRE en inglés
created_at      # Fecha de creación
updated_at      # Fecha de actualización
created_by      # Usuario que creó
updated_by      # Usuario que actualizó
deleted_at      # Soft delete
is_active       # Estado activo/inactivo
is_system       # Dato del sistema
is_default      # Valor por defecto
```

### Campos en Español (Dominio de Negocio)

```python
# Campos de negocio - SIEMPRE en español
nombre          # Nombre del recurso
descripcion     # Descripción
codigo          # Código identificador
fecha_inicio    # Fecha de inicio
fecha_fin       # Fecha de fin
estado          # Estado del recurso (propuesto, ejecucion)
prioridad       # Prioridad (alta, media, baja)
responsable     # Usuario responsable
empresa         # Empresa (multi-tenant)
orden           # Orden de visualización
observaciones   # Notas adicionales
```

---

## 1. Campos en Modelos Django

### 1.1. Campos de Ordenamiento

| Aspecto | Convención |
|---------|-----------|
| **Nombre del campo** | `orden` (español) |
| **Tipo** | `PositiveIntegerField` |
| **Abstract Model** | `OrderedModel` |

```python
# CORRECTO
class MiModelo(OrderedModel):
    nombre = models.CharField(max_length=100)
    # Hereda: orden (PositiveIntegerField)

# INCORRECTO - No usar 'order'
class MiModelo(models.Model):
    order = models.PositiveIntegerField()  # MAL
```

### 1.2. Campos de Auditoría

| Campo | Idioma | Razón |
|-------|--------|-------|
| `created_at` | Inglés | Estándar Django/DRF |
| `updated_at` | Inglés | Estándar Django/DRF |
| `created_by` | Inglés | Estándar Django/DRF |
| `updated_by` | Inglés | Estándar Django/DRF |
| `deleted_at` | Inglés | Estándar soft delete |

### 1.3. Campos de Negocio

| Convención | Ejemplos |
|-----------|----------|
| Español | `nombre`, `descripcion`, `fecha_inicio`, `empresa` |

```python
# CORRECTO
class Proyecto(BaseCompanyModel):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    fecha_inicio_plan = models.DateField(null=True)
    porcentaje_avance = models.DecimalField(...)
```

---

## 2. Códigos de Identificación

### 2.1. Códigos de Tabs y Secciones (ModuleTab, TabSection)

| Aspecto | Convención | Ejemplo |
|---------|-----------|---------|
| **Formato** | snake_case | `identidad`, `revision_direccion` |
| **Idioma** | Español | `planeacion`, `gestion_proyectos` |
| **Longitud** | 3-30 caracteres | - |
| **Sin prefijos redundantes** | Usar código corto | `identidad` (no `identidad_corporativa`) |

```python
# CORRECTO
ModuleTab.objects.create(
    code='identidad',           # Código corto
    name='Identidad Corporativa',  # Nombre descriptivo
)

ModuleTab.objects.create(
    code='revision_direccion',
    name='Revisión por Dirección',
)

# INCORRECTO - Código redundante
ModuleTab.objects.create(
    code='identidad_corporativa',  # MAL - redundante con name
    name='Identidad Corporativa',
)
```

### 2.2. Códigos de Módulos (SystemModule)

| Convención | Ejemplos |
|-----------|----------|
| snake_case en español | `gestion_estrategica`, `motor_cumplimiento` |
| snake_case en inglés (legacy) | `hseq_management`, `workflow_engine` |

---

## 3. URLs de API

### 3.1. Estructura General

```
/api/{app}/{recurso}/
/api/{app}/{recurso}/{id}/
/api/{app}/{recurso}/{id}/{accion}/
```

### 3.2. Convenciones

| Aspecto | Convención | Ejemplo |
|---------|-----------|---------|
| **Separadores** | kebab-case (guiones) | `/revision-direccion/` |
| **Recursos** | Plural en español | `/proyectos/`, `/revisiones/` |
| **Apps** | Sin prefijo de módulo padre | `/api/proyectos/` (no `/api/gestion-estrategica/proyectos/`) |

### 3.3. Mapeo Apps → URLs

| App Django | URL Base |
|-----------|----------|
| `gestion_estrategica.organizacion` | `/api/organizacion/` |
| `gestion_estrategica.identidad` | `/api/identidad/` |
| `gestion_estrategica.planeacion` | `/api/planeacion/` |
| `gestion_estrategica.gestion_proyectos` | `/api/proyectos/` |
| `gestion_estrategica.revision_direccion` | `/api/revision-direccion/` |

### 3.4. Frontend API Clients

```typescript
// CORRECTO - Usar URL directa de la app
const BASE_URL = '/proyectos';
const BASE_URL = '/revision-direccion';

// INCORRECTO - No usar prefijo de módulo
const BASE_URL = '/gestion-estrategica/proyectos';  // MAL
```

---

## 4. Enums y Choices

### 4.1. Backend (Django TextChoices)

| Aspecto | Convención |
|---------|-----------|
| **Nombre de clase** | MAYÚSCULAS (constante Python) |
| **Valor almacenado** | minúsculas con guión bajo |
| **Label** | Capitalizado para UI |

```python
# CORRECTO
class Estado(models.TextChoices):
    PROPUESTO = 'propuesto', 'Propuesto'
    EN_EJECUCION = 'ejecucion', 'En Ejecución'
    COMPLETADO = 'completado', 'Completado'

class Prioridad(models.TextChoices):
    ALTA = 'alta', 'Alta'
    MEDIA = 'media', 'Media'
    BAJA = 'baja', 'Baja'
```

### 4.2. Frontend (TypeScript)

**IMPORTANTE:** Los tipos TypeScript deben coincidir con los valores del backend (minúsculas).

```typescript
// CORRECTO - Sincronizado con backend
export type EstadoProyecto =
  | 'propuesto'
  | 'iniciacion'
  | 'planificacion'
  | 'ejecucion'
  | 'completado';

export type PrioridadProyecto = 'alta' | 'media' | 'baja';

// INCORRECTO - No usar MAYÚSCULAS
export type EstadoProyecto = 'PROPUESTO' | 'EJECUCION';  // MAL
```

### 4.3. Checklist de Sincronización

Al crear nuevos enums:

1. Definir en backend con valores en **minúsculas**
2. Crear tipo TypeScript con **los mismos valores**
3. Verificar que serializers expongan el valor correcto
4. Probar endpoint para confirmar formato

---

## 5. Interfaces TypeScript

### 5.1. Nombres de Campos

| Backend (Django) | Frontend (TypeScript) | Notas |
|-----------------|----------------------|-------|
| `orden` | `orden` | Mantener igual |
| `codigo` | `codigo` | Mantener igual |
| `nombre` | `nombre` | Mantener igual |
| `created_at` | `created_at` | Mantener igual |

```typescript
// CORRECTO - Coincidir con serializer
export interface Proyecto {
  id: number;
  codigo: string;      // Igual que backend
  nombre: string;      // Igual que backend
  porcentaje_avance: number;  // Igual que backend
  created_at: string;
}

// INCORRECTO - No traducir campos
export interface Proyecto {
  code: string;        // MAL - backend usa 'codigo'
  name: string;        // MAL - backend usa 'nombre'
  progress: number;    // MAL - backend usa 'porcentaje_avance'
}
```

---

## 6. ViewSets y Ordenamiento

### 6.1. Configuración de Ordering

```python
# CORRECTO - Usar nombre real del campo
class AreaViewSet(viewsets.ModelViewSet):
    ordering_fields = ['orden', 'name', 'code']
    ordering = ['orden', 'name']  # Campo real: 'orden'

# INCORRECTO - Campo inexistente
class AreaViewSet(viewsets.ModelViewSet):
    ordering = ['order', 'name']  # MAL - campo es 'orden'
```

---

## 7. Resumen Rápido

| Contexto | Convención | Ejemplo |
|----------|-----------|---------|
| Campo ordenamiento | `orden` (español) | `models.PositiveIntegerField()` |
| Campo negocio | Español | `nombre`, `fecha_inicio` |
| Campo auditoría | Inglés | `created_at`, `updated_at` |
| Código de tab | snake_case corto | `identidad`, `planeacion` |
| URL de API | kebab-case | `/revision-direccion/` |
| Enum backend | minúsculas | `'propuesto'`, `'ejecucion'` |
| Tipo TypeScript | minúsculas (sync) | `'propuesto' \| 'ejecucion'` |

---

## 8. Errores Comunes a Evitar

### 8.1. Error: Campo 'order' vs 'orden'

```python
# ERROR: FieldError: Cannot resolve keyword 'order'
ordering = ['order', 'name']

# SOLUCIÓN
ordering = ['orden', 'name']
```

### 8.2. Error: Códigos de tabs duplicados

```python
# ERROR: Tabs duplicados en sidebar
code='identidad'           # Migración
code='identidad_corporativa'  # Seed - CREA DUPLICADO

# SOLUCIÓN: Usar siempre el mismo código
code='identidad'  # Consistente en migración y seeds
```

### 8.3. Error: Enums no coinciden

```typescript
// ERROR: TypeScript no reconoce valor del backend
// Backend devuelve: { estado: 'propuesto' }
// Frontend espera: 'PROPUESTO'

// SOLUCIÓN: Sincronizar tipos
export type Estado = 'propuesto' | 'ejecucion';  // Minúsculas
```

### 8.4. Error: URL de API incorrecta

```typescript
// ERROR: 404 Not Found
const BASE_URL = '/gestion-estrategica/revision-direccion';

// SOLUCIÓN: Usar URL directa
const BASE_URL = '/revision-direccion';
```

---

## 9. Checklist para Nuevos Desarrollos

Al crear nuevos modelos/endpoints:

- [ ] Campos de ordenamiento usan `orden` (no `order`)
- [ ] Campos de negocio en español
- [ ] Campos de auditoría en inglés (`created_at`, `is_active`)
- [ ] Códigos de tabs en snake_case sin redundancia
- [ ] URLs de API en kebab-case
- [ ] Enums con valores en minúsculas
- [ ] Tipos TypeScript sincronizados con backend
- [ ] ViewSets usan nombres de campos reales en ordering

---

## 10. Inconsistencias Conocidas (Legacy)

Los siguientes módulos tienen inconsistencias históricas que se mantendrán por compatibilidad:

### 10.1. Módulo `identidad` (Migrar en futuro)

| Actual (Inglés) | Debería ser (Español) | Estado |
|----------------|----------------------|--------|
| `CorporateIdentity` | `IdentidadCorporativa` | Legacy - mantener |
| `mission`, `vision` | `mision`, `vision` | Legacy - mantener |
| `CorporateValue` | `ValorCorporativo` | Legacy - mantener |

**Nota:** Las URLs ya están en español (`/api/identidad/identidad/`). Solo los modelos y campos internos usan inglés.

### 10.2. Módulo `planeacion` (Migrar en futuro)

| Actual (Inglés) | Debería ser (Español) | Estado |
|----------------|----------------------|--------|
| `StrategicPlan` | `PlanEstrategico` | Legacy - mantener |
| `StrategicObjective` | `ObjetivoEstrategico` | Legacy - mantener |
| `name`, `description` | `nombre`, `descripcion` | Legacy - mantener |

**Nota:** Las URLs ya están en español (`/api/planeacion/planes/`).

### 10.3. Módulos Consistentes (Referencia)

Estos módulos siguen correctamente la convención:

- `gestion_proyectos`: Modelos y campos en español (`Proyecto`, `codigo`, `nombre`)
- `revision_direccion`: Modelos y campos en español (`ProgramaRevision`, `fecha_programada`)
- `organizacion`: Modelos y campos en español (`Area`, `TipoDocumento`, `orden`)

---

## 11. Plan de Migración (Opcional)

Si se decide migrar los módulos legacy a español completo:

### Fase 1: Preparación
1. Crear migraciones que renombren campos
2. Actualizar serializers con `source=` para compatibilidad temporal
3. Actualizar tipos TypeScript

### Fase 2: Ejecución
1. Aplicar migraciones en desarrollo
2. Actualizar frontend
3. Probar exhaustivamente
4. Aplicar en producción

### Fase 3: Limpieza
1. Remover alias `source=` de serializers
2. Actualizar documentación

**Decisión actual:** Mantener legacy por compatibilidad. Nuevos desarrollos siguen la convención español.

---

**Última actualización:** 25 Diciembre 2025
