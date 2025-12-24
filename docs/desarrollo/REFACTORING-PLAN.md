# PLAN DE REFACTORING - OPCIÓN C (Híbrido)

**Fecha:** 24 Diciembre 2025
**Estado:** ACTIVO - PRIORITARIO
**Estrategia:** Crear base reutilizable + Continuar desarrollo + Migración gradual

---

## Resumen Ejecutivo

### Diagnóstico de Código Duplicado

| Área | Duplicación | Líneas Afectadas | Prioridad |
|------|-------------|------------------|-----------|
| Backend (Django) | 35-40% | ~5,250 líneas | ALTA |
| Frontend (React) | ~25% | ~4,350 líneas | ALTA |
| **Total** | **~30%** | **~9,600 líneas** | - |

### Problemas Críticos Identificados

1. **23+ modelos** repiten `created_at`, `updated_at`, `created_by`, `is_active`
2. **6 ViewSets** repiten acción `toggle_active` idéntica
3. **188 instancias** de `queryClient.invalidateQueries` repetidas
4. **15+ modales** con estructura 95% idéntica
5. **3 implementaciones** conflictivas de `usePermissions`

---

## Fase 1: Base Reutilizable (Inmediato)

### 1.1 Abstract Models (Backend)

**Archivo:** `backend/apps/core/models/base.py`

```python
from django.db import models
from django.conf import settings


class TimestampedModel(models.Model):
    """Modelo base con timestamps automáticos."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """Modelo base con soft delete."""
    is_active = models.BooleanField(default=True, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        from django.utils import timezone
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_active', 'deleted_at'])


class AuditModel(TimestampedModel):
    """Modelo base con auditoría de usuario."""
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='%(class)s_created',
        null=True, blank=True
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='%(class)s_updated',
        null=True, blank=True
    )

    class Meta:
        abstract = True


class BaseCompanyModel(AuditModel, SoftDeleteModel):
    """Modelo base completo para entidades de empresa."""
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='%(class)s_set'
    )

    class Meta:
        abstract = True


class HierarchicalModel(models.Model):
    """Modelo base para estructuras jerárquicas."""
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='children'
    )
    level = models.PositiveIntegerField(default=0)
    path = models.CharField(max_length=500, blank=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if self.parent:
            self.level = self.parent.level + 1
            self.path = f"{self.parent.path}/{self.pk}" if self.pk else self.parent.path
        else:
            self.level = 0
            self.path = str(self.pk) if self.pk else ''
        super().save(*args, **kwargs)


class OrderedModel(models.Model):
    """Modelo base con orden personalizable."""
    orden = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        abstract = True
        ordering = ['orden']
```

**Tiempo estimado:** 1 hora
**Impacto:** Elimina ~2,000 líneas duplicadas

---

### 1.2 ViewSet Mixins (Backend)

**Archivo:** `backend/apps/core/mixins.py`

```python
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


class ToggleActiveMixin:
    """Mixin para toggle de estado activo/inactivo."""

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        instance = self.get_object()
        instance.is_active = not instance.is_active
        instance.save(update_fields=['is_active'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FilterInactiveMixin:
    """Mixin para filtrar registros inactivos por defecto."""

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('include_inactive') != 'true':
            qs = qs.filter(is_active=True)
        return qs


class ValidateBeforeDeleteMixin:
    """Mixin para validar dependencias antes de eliminar."""

    protected_relations = []  # Override en subclase

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        for relation in self.protected_relations:
            if getattr(instance, relation).exists():
                return Response(
                    {'error': f'No se puede eliminar: tiene {relation} asociados'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return super().destroy(request, *args, **kwargs)


class BulkActionsMixin:
    """Mixin para acciones masivas."""

    @action(detail=False, methods=['post'])
    def bulk_activate(self, request):
        ids = request.data.get('ids', [])
        updated = self.get_queryset().filter(id__in=ids).update(is_active=True)
        return Response({'updated': updated})

    @action(detail=False, methods=['post'])
    def bulk_deactivate(self, request):
        ids = request.data.get('ids', [])
        updated = self.get_queryset().filter(id__in=ids).update(is_active=False)
        return Response({'updated': updated})


class AuditMixin:
    """Mixin para auditoría automática de usuario."""

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
```

**Tiempo estimado:** 30 minutos
**Impacto:** Elimina ~800 líneas duplicadas en ViewSets

---

### 1.3 Hooks Genéricos (Frontend)

**Archivo:** `frontend/src/hooks/useGenericCRUD.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CRUDOptions<T> {
  queryKey: string[];
  endpoint: string;
  entityName: string;
  onSuccess?: (data: T) => void;
}

export function useGenericCRUD<T extends { id: number }>({
  queryKey,
  endpoint,
  entityName,
  onSuccess,
}: CRUDOptions<T>) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  const { data, isLoading, error } = useQuery<T[]>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Error fetching data');
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: Partial<T>) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) throw new Error('Error creating');
      return response.json();
    },
    onSuccess: (data) => {
      invalidate();
      toast.success(`${entityName} creado exitosamente`);
      onSuccess?.(data);
    },
    onError: () => toast.error(`Error al crear ${entityName}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<T> & { id: number }) => {
      const response = await fetch(`${endpoint}${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error updating');
      return response.json();
    },
    onSuccess: (data) => {
      invalidate();
      toast.success(`${entityName} actualizado exitosamente`);
      onSuccess?.(data);
    },
    onError: () => toast.error(`Error al actualizar ${entityName}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${endpoint}${id}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error deleting');
    },
    onSuccess: () => {
      invalidate();
      toast.success(`${entityName} eliminado exitosamente`);
    },
    onError: () => toast.error(`Error al eliminar ${entityName}`),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${endpoint}${id}/toggle_active/`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Error toggling');
      return response.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success(`Estado de ${entityName} actualizado`);
    },
    onError: () => toast.error(`Error al cambiar estado`),
  });

  return {
    // Data
    data: data ?? [],
    isLoading,
    error,

    // Mutations
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,

    // States
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Utils
    invalidate,
  };
}
```

**Archivo:** `frontend/src/hooks/useFormModal.ts`

```typescript
import { useState, useCallback } from 'react';

interface FormModalState<T> {
  isOpen: boolean;
  mode: 'create' | 'edit';
  data: T | null;
}

export function useFormModal<T>() {
  const [state, setState] = useState<FormModalState<T>>({
    isOpen: false,
    mode: 'create',
    data: null,
  });

  const openCreate = useCallback(() => {
    setState({ isOpen: true, mode: 'create', data: null });
  }, []);

  const openEdit = useCallback((data: T) => {
    setState({ isOpen: true, mode: 'edit', data });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, mode: 'create', data: null });
  }, []);

  return {
    ...state,
    openCreate,
    openEdit,
    close,
    isEditing: state.mode === 'edit',
  };
}
```

**Tiempo estimado:** 1 hora
**Impacto:** Elimina ~3,000 líneas duplicadas en hooks

---

## Fase 2: Migración Gradual

### 2.1 Orden de Migración Backend

| Prioridad | App | Modelos | Complejidad |
|-----------|-----|---------|-------------|
| 1 | `configuracion` | EmpresaConfig, SedeEmpresa | Baja |
| 2 | `organizacion` | AreaFuncional, Cargo, NivelJerarquico | Media |
| 3 | `roles` | Rol, Permiso | Baja |
| 4 | Resto | Según necesidad | Variable |

### 2.2 Checklist de Migración por Modelo

```markdown
- [ ] Cambiar herencia a abstract model apropiado
- [ ] Eliminar campos duplicados (created_at, updated_at, etc.)
- [ ] Actualizar imports
- [ ] Crear migración
- [ ] Actualizar tests
- [ ] Verificar serializers
```

### 2.3 Orden de Migración Frontend

| Prioridad | Hook/Componente | Reemplaza | Archivos Afectados |
|-----------|-----------------|-----------|-------------------|
| 1 | useGenericCRUD | useCargos, useAreas, etc. | ~15 |
| 2 | useFormModal | Estados de modal duplicados | ~12 |
| 3 | GenericDataTable | Tablas duplicadas | ~8 |

---

## Fase 3: Nuevos Desarrollos

### Regla de Oro

> **ANTES de escribir código nuevo:**
> 1. ¿Existe un abstract model que pueda heredar?
> 2. ¿Existe un mixin que provea esta funcionalidad?
> 3. ¿Existe un hook genérico que pueda usar?
> 4. Si la respuesta es NO a todo, ¿debería crear uno reutilizable?

### Checklist para Nuevos Modelos

```markdown
## Nuevo Modelo: [NombreModelo]

### Herencia
- [ ] Hereda de `BaseCompanyModel` (si pertenece a empresa)
- [ ] Hereda de `TimestampedModel` (mínimo requerido)
- [ ] Hereda de `SoftDeleteModel` (si necesita soft delete)
- [ ] Hereda de `HierarchicalModel` (si es jerárquico)

### ViewSet
- [ ] Usa `ToggleActiveMixin`
- [ ] Usa `FilterInactiveMixin`
- [ ] Usa `AuditMixin`

### Tests
- [ ] Tests heredan de `BaseModelTestCase`
- [ ] Tests de API heredan de `BaseAPITestCase`
```

### Checklist para Nuevos Componentes

```markdown
## Nuevo Componente: [NombreComponente]

### Hooks
- [ ] Usa `useGenericCRUD` para operaciones CRUD
- [ ] Usa `useFormModal` para modales de formulario
- [ ] Usa `useOptimisticMutation` para UX optimista

### Estructura
- [ ] Extiende componente base si aplica
- [ ] Reutiliza componentes de `common/`
- [ ] No duplica lógica existente
```

---

## Archivos Creados

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `backend/apps/core/models/base.py` | Abstract models (6 clases) | ✅ COMPLETADO |
| `backend/apps/core/models/__init__.py` | Exports del paquete | ✅ COMPLETADO |
| `backend/apps/core/mixins.py` | ViewSet mixins (8 clases) | ✅ COMPLETADO |
| `frontend/src/hooks/useGenericCRUD.ts` | Hook CRUD genérico | ✅ COMPLETADO |
| `frontend/src/hooks/useFormModal.ts` | Hook para modales | ✅ COMPLETADO |
| `frontend/src/hooks/index.ts` | Barrel exports | ✅ COMPLETADO |
| `frontend/src/hooks/useOptimisticMutation.ts` | Hook optimista | PENDIENTE |
| `docs/desarrollo/GUIA-REUTILIZACION.md` | Guía de uso | PENDIENTE |

---

## Métricas de Éxito

### Objetivo: Reducir duplicación del 30% al <10%

| Métrica | Antes | Después (Objetivo) |
|---------|-------|-------------------|
| Líneas duplicadas Backend | ~5,250 | <1,500 |
| Líneas duplicadas Frontend | ~4,350 | <1,200 |
| Modelos sin abstract base | 23+ | 0 |
| ViewSets sin mixins | 6+ | 0 |
| Hooks duplicados | 7 | 0 |

### KPIs de Seguimiento

- **Tiempo de desarrollo** de nuevas features: -30%
- **Bugs por código duplicado**: -80%
- **Tiempo de onboarding**: -40%

---

## Timeline de Implementación

### Semana Actual (Inmediato) - COMPLETADO 24/12/2025

- [x] Crear `base.py` con abstract models
- [x] Crear `mixins.py` con ViewSet mixins
- [x] Crear `useGenericCRUD.ts`
- [x] Crear `useFormModal.ts`

### Próximas 2 Semanas
- [ ] Migrar modelos de `configuracion`
- [ ] Migrar modelos de `organizacion`
- [ ] Consolidar hooks de frontend

### Próximo Mes
- [ ] Completar migración de todos los modelos
- [ ] Eliminar código duplicado legacy
- [ ] Documentar patrones en Storybook

---

## Referencias

- [Django Abstract Models](https://docs.djangoproject.com/en/4.2/topics/db/models/#abstract-base-classes)
- [DRF Mixins](https://www.django-rest-framework.org/api-guide/viewsets/#viewset-actions)
- [React Query Patterns](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [COMPONENTES-CATALOGO.md](./COMPONENTES-CATALOGO.md)

---

**Documento creado:** 24 Diciembre 2025
**Última actualización:** 24 Diciembre 2025
**Versión:** 1.0
