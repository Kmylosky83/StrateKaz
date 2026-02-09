# Convenciones de Nomenclatura

> **Version:** 2.0.0 | **Fecha:** 2026-02-06
> **Proposito:** Estandar unico de nomenclatura para todo el proyecto

---

## REGLA DE ORO

```
+-----------------------------------------------------------------------+
|  NOMENCLATURA ESTANDAR - Proyecto StrateKaz                            |
+-----------------------------------------------------------------------+
|  TODO EL CODIGO EN INGLES. ESPANOL SOLO EN UI LABELS.                  |
+-----------------------------------------------------------------------+
|  * Campos de modelo:      INGLES (name, description, start_date)       |
|  * Campos de auditoria:   INGLES (created_at, updated_at, is_active)   |
|  * Enums/Choices:         INGLES MAYUSCULA (STRATEGIC, ACTIVE)         |
|  * URLs de API:           kebab-case (/risk-assessment/)               |
|  * Codigos de modulos:    snake_case (motor_cumplimiento)              |
|  * TypeScript:            SINCRONIZADO con backend (identico)          |
|  * UI Labels:             ESPANOL (verbose_name, help_text, placeholders) |
+-----------------------------------------------------------------------+
```

### Por que todo en ingles?

| Aspecto | Justificacion |
|---------|---------------|
| **Profesional** | Estandar de la industria (Shopify, Stripe, Rappi, MercadoLibre) |
| **Escalable** | Equipos internacionales pueden contribuir sin barrera idiomatica |
| **Ecosistema** | Django, DRF, React, TypeScript - toda la documentacion es en ingles |
| **Consistencia** | Una sola regla: ingles. Sin ambiguedad ni decisiones caso por caso |
| **Dominio colombiano** | Se refleja en UI labels (verbose_name, help_text) no en codigo |

---

## 1. Campos en Modelos Django

### 1.1. Nuevos Desarrollos (OBLIGATORIO)

```python
# CORRECTO - Todo en ingles
class Project(BaseCompanyModel):
    name = models.CharField(max_length=200, verbose_name='Nombre')
    description = models.TextField(blank=True, verbose_name='Descripcion')
    start_date = models.DateField(null=True, verbose_name='Fecha de inicio')
    end_date = models.DateField(null=True, verbose_name='Fecha de fin')
    status = models.CharField(max_length=20, verbose_name='Estado')
    priority = models.CharField(max_length=20, verbose_name='Prioridad')
    responsible = models.ForeignKey(User, verbose_name='Responsable')
    notes = models.TextField(blank=True, verbose_name='Observaciones')
    order = models.PositiveIntegerField(default=0, verbose_name='Orden')

# INCORRECTO - No usar espanol en campos
class Proyecto(BaseCompanyModel):
    nombre = models.CharField(...)       # MAL
    descripcion = models.TextField(...)  # MAL
    fecha_inicio = models.DateField(...) # MAL
```

### 1.2. Campos de Auditoria (sin cambios)

| Campo | Tipo | Notas |
|-------|------|-------|
| `created_at` | DateTimeField(auto_now_add) | Timestamps |
| `updated_at` | DateTimeField(auto_now) | Timestamps |
| `created_by` | FK(User) | Auditoria |
| `updated_by` | FK(User) | Auditoria |
| `is_active` | BooleanField | Soft delete |
| `deleted_at` | DateTimeField | Soft delete |

### 1.3. Abstract Models

| Modelo | Hereda | Campos |
|--------|--------|--------|
| `TimestampedModel` | - | created_at, updated_at |
| `SoftDeleteModel` | - | is_active, deleted_at |
| `AuditModel` | TimestampedModel | + created_by, updated_by |
| `BaseCompanyModel` | AuditModel + SoftDeleteModel | + empresa (FK) |
| `OrderedModel` | - | orden (legacy) |
| `HierarchicalModel` | - | parent, level, path |

---

## 2. Categorias de Modulos

Las categorias del SystemModule son en **INGLES MAYUSCULA**:

| Categoria | UI Label | Color |
|-----------|----------|-------|
| `STRATEGIC` | Nivel Estrategico | purple |
| `COMPLIANCE` | Motores del Sistema | teal |
| `INTEGRATED` | Gestion Integral | orange |
| `OPERATIONAL` | Nivel Misional | blue |
| `SUPPORT` | Nivel de Apoyo | green |
| `INTELLIGENCE` | Inteligencia de Negocio | purple |

```python
# Backend
CATEGORY_CHOICES = [
    ('STRATEGIC', 'Nivel Estrategico'),
    ('COMPLIANCE', 'Motores del Sistema'),
    ('INTEGRATED', 'Gestion Integral'),
    ('OPERATIONAL', 'Nivel Misional'),
    ('SUPPORT', 'Nivel de Apoyo'),
    ('INTELLIGENCE', 'Inteligencia de Negocio'),
]
```

```typescript
// Frontend
export type ModuleCategory =
  | 'STRATEGIC'
  | 'COMPLIANCE'
  | 'INTEGRATED'
  | 'OPERATIONAL'
  | 'SUPPORT'
  | 'INTELLIGENCE';
```

---

## 3. Enums y Choices

### 3.1. Nuevos Desarrollos

| Aspecto | Convencion |
|---------|------------|
| **Valor almacenado** | INGLES MAYUSCULA |
| **Label (verbose)** | Espanol capitalizado |

```python
# CORRECTO - Nuevos desarrollos
class Status(models.TextChoices):
    DRAFT = 'DRAFT', 'Borrador'
    IN_PROGRESS = 'IN_PROGRESS', 'En Progreso'
    COMPLETED = 'COMPLETED', 'Completado'
    CANCELLED = 'CANCELLED', 'Cancelado'

class Priority(models.TextChoices):
    HIGH = 'HIGH', 'Alta'
    MEDIUM = 'MEDIUM', 'Media'
    LOW = 'LOW', 'Baja'
```

```typescript
// Frontend sincronizado
export type Status = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
```

### 3.2. Legacy (Existentes - NO modificar)

Muchos modelos existentes usan valores en espanol minuscula (`propuesto`, `ejecucion`, `alta`).
**NO modificar enums existentes.** Solo aplicar ingles a nuevos desarrollos.

---

## 4. Codigos de Identificacion

### 4.1. Codigos de Modulos (SystemModule.code)

| Convencion | Ejemplos |
|-----------|----------|
| snake_case | `gestion_estrategica`, `motor_cumplimiento`, `hseq_management` |

### 4.2. Codigos de Tabs y Secciones

| Aspecto | Convencion | Ejemplo |
|---------|------------|---------|
| **Formato** | snake_case | `identidad`, `revision_direccion` |
| **Longitud** | 3-30 caracteres | - |
| **Sin prefijos redundantes** | Codigo corto | `identidad` (no `identidad_corporativa`) |

---

## 5. URLs de API

### 5.1. Estructura

```
/api/{resource}/
/api/{resource}/{id}/
/api/{resource}/{id}/{action}/
```

### 5.2. Convenciones

| Aspecto | Convencion | Ejemplo |
|---------|------------|---------|
| **Separadores** | kebab-case | `/revision-direccion/` |
| **Sin prefijo de modulo** | URL directa de app | `/api/proyectos/` |

### 5.3. Frontend API Clients

```typescript
// CORRECTO
const BASE_URL = '/proyectos';
const BASE_URL = '/revision-direccion';

// INCORRECTO
const BASE_URL = '/gestion-estrategica/proyectos';  // MAL
```

---

## 6. Interfaces TypeScript

### 6.1. Regla: Coincidir con Backend

```typescript
// Los campos deben ser IDENTICOS al serializer
export interface SystemModule {
  id: number;
  code: string;
  name: string;
  category: ModuleCategory;
  is_enabled: boolean;
  created_at: string;
}
```

---

## 7. Checklist para Nuevos Desarrollos

Al crear nuevos modelos/endpoints:

- [ ] Campos de modelo en INGLES (name, description, status)
- [ ] verbose_name en ESPANOL
- [ ] Campos de auditoria heredados de abstract models
- [ ] Enums con valores en INGLES MAYUSCULA
- [ ] Codigos de tabs en snake_case sin redundancia
- [ ] URLs de API en kebab-case
- [ ] Tipos TypeScript sincronizados con backend
- [ ] ViewSets usan nombres de campos reales en ordering

---

## 8. Legacy: Campos Existentes en Espanol

Los siguientes campos existen en espanol en modelos legacy. **NO se modifican** por ahora, pero nuevos desarrollos deben usar ingles:

| Campo Legacy (Espanol) | Equivalente Nuevo (Ingles) | Archivos |
|------------------------|---------------------------|----------|
| `nombre` | `name` | ~196 archivos |
| `descripcion` | `description` | ~239 archivos |
| `codigo` | `code` | ~213 archivos |
| `empresa` | `company` | ~160 archivos |
| `orden` | `order` | ~73 archivos |
| `estado` | `status` | ~141 archivos |
| `responsable` | `responsible` / `assigned_to` | ~61 archivos |
| `observaciones` | `notes` | ~176 archivos |
| `activo` | `is_active` | ~21 archivos |
| `creado_por` | `created_by` | ~21 archivos |

### Roadmap de Migracion

Esta migracion se ejecutara en fases futuras cuando haya ventana de mantenimiento:

1. **Fase A**: Renombrar campos en modelos con `RenameField` migrations
2. **Fase B**: Actualizar serializers con `source=` temporal
3. **Fase C**: Actualizar tipos TypeScript
4. **Fase D**: Remover aliases `source=`

**Prioridad**: Baja. Los campos legacy funcionan correctamente.

---

## 9. Errores Comunes

### 9.1. Mezclar idiomas en campos nuevos

```python
# MAL - Campo nuevo en espanol
class NuevoModelo(BaseCompanyModel):
    nombre_proyecto = models.CharField(...)  # MAL

# BIEN
class NuevoModelo(BaseCompanyModel):
    project_name = models.CharField(verbose_name='Nombre del proyecto')
```

### 9.2. Enums nuevos en espanol

```python
# MAL
class TipoNuevo(models.TextChoices):
    ACTIVO = 'activo', 'Activo'  # MAL

# BIEN
class NewType(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Activo'
```

### 9.3. Categorias con valores viejos

```typescript
// MAL - Valores obsoletos
category: 'ESTRATEGICO'  // MAL
category: 'CUMPLIMIENTO' // MAL
category: 'OPERATIVO'    // MAL

// BIEN - Valores actuales
category: 'STRATEGIC'     // BIEN
category: 'COMPLIANCE'    // BIEN
category: 'OPERATIONAL'   // BIEN
```

---

**Ultima actualizacion:** 2026-02-06
