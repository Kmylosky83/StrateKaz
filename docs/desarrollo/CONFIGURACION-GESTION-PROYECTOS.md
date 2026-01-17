# Configuración Completada: Gestión de Proyectos (PMI)

## Resumen de Cambios Realizados

### 1. ✅ Registrar URLs en `gestion_estrategica/urls.py`

**Archivo**: `backend/apps/gestion_estrategica/urls.py`

**Cambio realizado**:
```python
# Agregado en línea 21:
path('proyectos/', include('apps.gestion_estrategica.gestion_proyectos.urls')),
```

**Resultado**: La app de gestión de proyectos ahora es accesible en:
- Base URL: `/api/gestion-estrategica/proyectos/`
- Endpoints disponibles:
  - `/api/gestion-estrategica/proyectos/portafolios/`
  - `/api/gestion-estrategica/proyectos/programas/`
  - `/api/gestion-estrategica/proyectos/proyectos/`
  - `/api/gestion-estrategica/proyectos/charters/`
  - `/api/gestion-estrategica/proyectos/interesados/`
  - `/api/gestion-estrategica/proyectos/fases/`
  - `/api/gestion-estrategica/proyectos/actividades/`
  - `/api/gestion-estrategica/proyectos/recursos/`
  - `/api/gestion-estrategica/proyectos/riesgos/`
  - `/api/gestion-estrategica/proyectos/seguimientos/`
  - `/api/gestion-estrategica/proyectos/lecciones/`
  - `/api/gestion-estrategica/proyectos/actas-cierre/`

---

### 2. ✅ Verificar INSTALLED_APPS

**Archivo**: `backend/config/settings.py`

**Estado**: La app YA está registrada en línea 34:
```python
'apps.gestion_estrategica.gestion_proyectos',  # TAB: Gestión Proyectos (PMI)
```

**Confirmación**: ✅ No requiere cambios adicionales.

---

### 3. ✅ Refactorizar Modelos para usar Abstract Models

**Archivo**: `backend/apps/gestion_estrategica/gestion_proyectos/models.py`

#### Modelos Refactorizados

Se refactorizaron 3 modelos principales para heredar de `BaseCompanyModel`:

##### **Portafolio**
- **Antes**: `class Portafolio(models.Model)`
- **Ahora**: `class Portafolio(BaseCompanyModel)`
- **Cambios**:
  - ✅ Hereda automáticamente: `created_at`, `updated_at`, `created_by`, `updated_by`, `is_active`, `deleted_at`, `empresa`
  - ❌ Eliminado: `empresa_id`, `is_active`, `created_at`, `updated_at`, `created_by`
  - 🔄 Actualizado: `unique_together = ['empresa', 'codigo']` (antes: `empresa_id`)
  - 📝 Agregado: `db_table = 'gestion_proyectos_portafolio'`
  - 📝 Agregado: `verbose_name` y `help_text` en todos los campos

##### **Programa**
- **Antes**: `class Programa(models.Model)`
- **Ahora**: `class Programa(BaseCompanyModel)`
- **Cambios**:
  - ✅ Hereda automáticamente: `created_at`, `updated_at`, `created_by`, `updated_by`, `is_active`, `deleted_at`, `empresa`
  - ❌ Eliminado: `empresa_id`, `is_active`, `created_at`, `updated_at`
  - 🔄 Actualizado: `unique_together = ['empresa', 'codigo']` (antes: `empresa_id`)
  - 📝 Agregado: `db_table = 'gestion_proyectos_programa'`
  - 📝 Agregado: `verbose_name` y `help_text` en todos los campos

##### **Proyecto**
- **Antes**: `class Proyecto(models.Model)`
- **Ahora**: `class Proyecto(BaseCompanyModel)`
- **Cambios**:
  - ✅ Hereda automáticamente: `created_at`, `updated_at`, `created_by`, `updated_by`, `is_active`, `deleted_at`, `empresa`
  - ❌ Eliminado: `empresa_id`, `is_active`, `created_at`, `updated_at`, `created_by`
  - 🔄 Actualizado: `unique_together = ['empresa', 'codigo']` (antes: `empresa_id`)
  - 🔄 Actualizado: Índices usan `empresa` en vez de `empresa_id`
  - 📝 Agregado: `db_table = 'gestion_proyectos_proyecto'`
  - 📝 Agregado: `verbose_name` y `help_text` en todos los campos
  - ⚠️ Mantenido: `fecha_propuesta` (auto_now_add=True) - no entra en conflicto

#### Modelos NO Refactorizados

Los siguientes modelos **NO** fueron refactorizados porque obtienen la empresa **indirectamente** a través del modelo `Proyecto`:

- `ProjectCharter` (OneToOne con Proyecto)
- `InteresadoProyecto` (FK a Proyecto)
- `FaseProyecto` (FK a Proyecto)
- `ActividadProyecto` (FK a Proyecto)
- `RecursoProyecto` (FK a Proyecto)
- `RiesgoProyecto` (FK a Proyecto)
- `SeguimientoProyecto` (FK a Proyecto)
- `LeccionAprendida` (FK a Proyecto)
- `ActaCierre` (OneToOne con Proyecto)

**Razón**: Estos modelos dependen del proyecto, por lo que NO necesitan relación directa con `empresa`.

---

## Beneficios de los Cambios

### Eliminación de Código Duplicado
- ❌ **Antes**: Cada modelo definía manualmente `created_at`, `updated_at`, `is_active`, `created_by`, `empresa_id`
- ✅ **Ahora**: Heredados automáticamente de `BaseCompanyModel`

### Auditoría Completa
- `created_by`: Usuario que creó el registro
- `updated_by`: Usuario que actualizó el registro (heredado)
- `created_at`: Fecha/hora de creación
- `updated_at`: Fecha/hora de última modificación

### Soft Delete Integrado
- `is_active`: Flag de activación/desactivación
- `deleted_at`: Timestamp de eliminación lógica
- Métodos: `soft_delete()`, `restore()`, `is_deleted`

### Mejor Organización
- Tablas con nombres explícitos: `gestion_proyectos_*`
- `verbose_name` y `help_text` en español
- Relación FK explícita con `EmpresaConfig`

---

## Archivo de Importación Actualizado

**Línea 15** de `models.py`:
```python
from apps.core.base_models import BaseCompanyModel
```

---

## Próximos Pasos (NO EJECUTAR AHORA)

### 1. Crear Migraciones
```bash
docker compose exec backend python manage.py makemigrations gestion_proyectos
```

### 2. Revisar Migración Generada
- Verificar que Django maneje correctamente el cambio de `empresa_id` a `empresa`
- Confirmar que se mantienen los datos existentes

### 3. Aplicar Migraciones
```bash
docker compose exec backend python manage.py migrate gestion_proyectos
```

### 4. Verificar Serializers
- Actualizar serializers si referencian `empresa_id` directamente
- Cambiar a `empresa` (FK) en filtros y queries

### 5. Actualizar Queries en Código
- Cambiar filtros de `empresa_id=X` a `empresa=empresa_obj`
- Actualizar queries que usen `empresa_id` en anotaciones

---

## Estructura de BaseCompanyModel

```python
class BaseCompanyModel(AuditModel, SoftDeleteModel):
    """
    Modelo base completo para entidades relacionadas con la empresa.

    Hereda:
    - TimestampedModel: created_at, updated_at
    - AuditModel: created_by, updated_by
    - SoftDeleteModel: is_active, deleted_at

    Agrega:
    - empresa: FK a EmpresaConfig
    """

    empresa = models.ForeignKey(
        'gestion_estrategica.EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='%(class)s_set'
    )

    # Métodos heredados:
    # - soft_delete()
    # - restore()
    # - is_deleted (property)
    # - get_empresa_info()
```

---

## Validación de Cambios

### ✅ URLs Configuradas
- Ruta agregada en `gestion_estrategica/urls.py` línea 21

### ✅ App Registrada
- Confirmado en `settings.py` línea 34

### ✅ Modelos Refactorizados
- Portafolio: Hereda de BaseCompanyModel ✅
- Programa: Hereda de BaseCompanyModel ✅
- Proyecto: Hereda de BaseCompanyModel ✅

### ✅ Import Agregado
- `from apps.core.base_models import BaseCompanyModel` línea 15

### ✅ Metadata Actualizada
- `unique_together` usa `empresa` en vez de `empresa_id`
- `db_table` definida para cada modelo
- Índices actualizados

---

## Documentación Adicional

- **Archivo creado**: `backend/apps/gestion_estrategica/gestion_proyectos/REFACTORING_NOTE.md`
- **Contiene**: Detalles técnicos de la refactorización

---

## Notas Importantes

⚠️ **NO se ejecutaron migraciones** como solicitado.
⚠️ Los cambios en modelos requieren ejecutar `makemigrations` y `migrate`.
⚠️ Revisar serializers y viewsets antes de ejecutar en producción.

---

**Fecha de Configuración**: 2025-12-24
**Estado**: ✅ Configuración Completada - Pendiente Migraciones
