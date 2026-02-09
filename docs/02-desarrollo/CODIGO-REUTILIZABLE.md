# Código Reutilizable

> **Principio:** Antes de escribir código nuevo, verificar si existe funcionalidad similar. Usar abstract models, mixins y hooks genéricos.

## Backend - Abstract Models

**Ubicación:** `backend/apps/core/base_models/base.py`

### Modelos Disponibles

| Modelo | Campos | Uso |
|--------|--------|-----|
| `TimestampedModel` | `created_at`, `updated_at` | Tracking básico de fechas |
| `SoftDeleteModel` | `is_active`, `deleted_at` | Eliminación lógica |
| `AuditModel` | timestamps + `created_by`, `updated_by` | Auditoría de usuario |
| `BaseCompanyModel` | `empresa` + audit + soft_delete | Modelos multi-empresa |
| `OrderedModel` | `orden` | Ordenamiento manual |

### Ejemplos de Uso

```python
from apps.core.base_models import (
    TimestampedModel,
    SoftDeleteModel,
    AuditModel,
    BaseCompanyModel,
    OrderedModel
)

# Modelo básico con timestamps
class MiModelo(TimestampedModel):
    nombre = models.CharField(max_length=100)
    # Incluye automáticamente: created_at, updated_at

# Modelo con soft delete
class Producto(SoftDeleteModel):
    nombre = models.CharField(max_length=100)
    # Incluye: is_active, deleted_at
    # Métodos: soft_delete(), restore()

# Modelo con auditoría completa
class Documento(AuditModel):
    titulo = models.CharField(max_length=200)
    # Incluye: created_at, updated_at, created_by, updated_by

# Modelo completo multi-empresa (RECOMENDADO)
class Area(BaseCompanyModel):
    nombre = models.CharField(max_length=100)
    # Incluye: empresa, timestamps, auditoría, soft_delete

# Modelo con ordenamiento
class MenuItem(OrderedModel):
    nombre = models.CharField(max_length=100)
    # Incluye: orden (PositiveIntegerField) - NOTA: Es 'orden' no 'order'
```

### Combinaciones

```python
# Combinar múltiples abstracts
class CategoriaDocumento(AuditModel, SoftDeleteModel, OrderedModel):
    nombre = models.CharField(max_length=100)
    # Incluye todo: timestamps, audit, soft_delete, orden
```

---

## Backend - ViewSet Mixins

**Ubicación:** `backend/apps/core/mixins.py`

### Mixins Disponibles

| Mixin | Funcionalidad |
|-------|---------------|
| `StandardViewSetMixin` | toggle_active, filter_inactive, bulk_actions, audit |
| `ToggleActiveMixin` | Solo acción toggle_active |
| `BulkActionsMixin` | Acciones en lote (activar, desactivar, eliminar) |
| `AuditMixin` | Auto-asignar created_by, updated_by |

### Ejemplo de Uso

```python
from rest_framework import viewsets
from apps.core.mixins import StandardViewSetMixin, ToggleActiveMixin

class AreaViewSet(StandardViewSetMixin, viewsets.ModelViewSet):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    # Automáticamente incluye:
    # - POST /areas/{id}/toggle_active/
    # - GET /areas/?include_inactive=true
    # - Bulk actions

class ProductoViewSet(ToggleActiveMixin, viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    # Solo incluye toggle_active
```

---

## Frontend - Hooks Reutilizables

**Ubicación:** `frontend/src/hooks/`

### useGenericCRUD

Hook para operaciones CRUD con React Query.

```typescript
import { useGenericCRUD } from '@/hooks/useGenericCRUD';

interface Area {
  id: number;
  nombre: string;
  is_active: boolean;
}

function AreasPage() {
  const {
    data,           // Lista de items
    isLoading,      // Estado de carga
    error,          // Error si existe
    create,         // Mutation para crear
    update,         // Mutation para actualizar
    remove,         // Mutation para eliminar (delete)
    toggleActive,   // Mutation para toggle
    refetch,        // Refrescar datos
  } = useGenericCRUD<Area>({
    queryKey: ['areas'],
    endpoint: '/api/organizacion/areas/',
    entityName: 'Área',  // Para mensajes toast
  });

  // Crear
  const handleCreate = async (data: Partial<Area>) => {
    await create.mutateAsync(data);
  };

  // Actualizar
  const handleUpdate = async (id: number, data: Partial<Area>) => {
    await update.mutateAsync({ id, ...data });
  };

  // Eliminar
  const handleDelete = async (id: number) => {
    await remove.mutateAsync(id);
  };

  // Toggle activo
  const handleToggle = async (id: number) => {
    await toggleActive.mutateAsync(id);
  };
}
```

### useFormModal

Hook para manejo de estado de modales de formulario.

```typescript
import { useFormModal } from '@/hooks/useFormModal';

interface Area {
  id: number;
  nombre: string;
}

function AreasPage() {
  const {
    isOpen,       // Boolean: modal abierto
    mode,         // 'create' | 'edit'
    data,         // Datos del item en edición (null si create)
    openCreate,   // Función para abrir en modo crear
    openEdit,     // Función para abrir en modo editar
    close,        // Función para cerrar
  } = useFormModal<Area>();

  return (
    <>
      <Button onClick={openCreate}>Nueva Área</Button>

      {areas.map(area => (
        <Button onClick={() => openEdit(area)}>Editar</Button>
      ))}

      <AreaFormModal
        isOpen={isOpen}
        mode={mode}
        initialData={data}
        onClose={close}
        onSubmit={handleSubmit}
      />
    </>
  );
}
```

### useConfirmModal

Hook para modales de confirmación.

```typescript
import { useConfirmModal } from '@/hooks/useConfirmModal';

function AreasPage() {
  const {
    isOpen,
    data,         // Item a confirmar
    open,         // Abrir con data
    close,
    confirm,      // Ejecutar acción confirmada
  } = useConfirmModal<Area>();

  const handleDeleteClick = (area: Area) => {
    open(area, async () => {
      await remove.mutateAsync(area.id);
    });
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Eliminar Área"
      message={`¿Está seguro de eliminar "${data?.nombre}"?`}
      onConfirm={confirm}
      onCancel={close}
    />
  );
}
```

---

## Modelos Migrados a Abstract Models

| App | Modelos | Abstract Models |
|-----|---------|-----------------|
| configuracion | EmpresaConfig, SedeEmpresa, IntegracionExterna | TimestampedModel, AuditModel, SoftDeleteModel |
| organizacion | Area, CategoriaDocumento, TipoDocumento, ConsecutivoConfig | AuditModel, TimestampedModel, SoftDeleteModel, OrderedModel |
| identidad | CorporateIdentity, CorporateValue | AuditModel, TimestampedModel, SoftDeleteModel, OrderedModel |
| planeacion | PlanEstrategico, ObjetivoEstrategico, KPI | BaseCompanyModel, AuditModel |
| gestion_proyectos | Portafolio, Programa, Proyecto, Fases, Actividades | BaseCompanyModel, AuditModel, SoftDeleteModel |
| revision_direccion | ProgramaRevision, ActaRevision, CompromisoRevision, SeguimientoCompromiso | BaseCompanyModel, AuditModel, SoftDeleteModel, TimestampedModel |

---

## Cuándo Crear vs Reutilizar

### Usar Abstract Model Existente Si:

- Necesitas timestamps (`created_at`, `updated_at`)
- Necesitas soft delete (`is_active`, `deleted_at`)
- Necesitas auditoría de usuario (`created_by`, `updated_by`)
- Es un modelo multi-empresa
- Necesitas ordenamiento manual

### Crear Nuevo Abstract Model Si:

- Hay 3+ modelos con los mismos campos adicionales
- La funcionalidad es transversal a múltiples apps
- Incluye lógica de negocio reutilizable

### Usar Hook Existente Si:

- Necesitas CRUD básico con React Query
- Necesitas manejo de modales de formulario
- Necesitas confirmaciones de acciones

### Crear Nuevo Hook Si:

- Hay lógica de estado compleja que se repite
- Hay integraciones con APIs específicas reutilizables
- Hay transformaciones de datos comunes

---

## Notas Importantes de Nomenclatura

> **IMPORTANTE:** Revisar [CONVENCIONES-NOMENCLATURA.md](CONVENCIONES-NOMENCLATURA.md) antes de usar estos modelos.

### Campo de Ordenamiento

El campo de ordenamiento en `OrderedModel` se llama **`orden`** (español), no `order`:

```python
# CORRECTO
class AreaViewSet(viewsets.ModelViewSet):
    ordering_fields = ['orden', 'name']
    ordering = ['orden', 'name']

# INCORRECTO - Causará FieldError
class AreaViewSet(viewsets.ModelViewSet):
    ordering = ['order', 'name']  # MAL - campo no existe
```

### Campos de Negocio vs Auditoría

| Tipo | Idioma | Ejemplos |
|------|--------|----------|
| Negocio | Español | `nombre`, `descripcion`, `orden`, `codigo` |
| Auditoría | Inglés | `created_at`, `updated_at`, `created_by` |

---

## Documentación Relacionada

- [ARQUITECTURA-DINAMICA.md](ARQUITECTURA-DINAMICA.md) - Sistema 100% dinámico
- [CONVENCIONES-NOMENCLATURA.md](CONVENCIONES-NOMENCLATURA.md) - Convenciones de nomenclatura
- [POLITICAS-DESARROLLO.md](POLITICAS-DESARROLLO.md) - Políticas de desarrollo
