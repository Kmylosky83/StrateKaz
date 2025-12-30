# Consolidación del Modelo UnidadMedida

**Fecha**: 2025-12-28
**Objetivo**: Eliminar modelos duplicados de UnidadMedida y centralizar en `supply_chain.catalogos`

## Problema Identificado

Se encontraron 3 definiciones del modelo `UnidadMedida` en diferentes módulos:

1. `backend/apps/supply_chain/catalogos/models.py` (CENTRALIZADO)
2. `backend/apps/supply_chain/programacion_abastecimiento/models.py` (DUPLICADO - eliminado)
3. `backend/apps/supply_chain/almacenamiento/models.py` (DUPLICADO - eliminado)

## Cambios Realizados

### 1. Modelo Centralizado (catalogos/models.py)

El modelo centralizado en `catalogos/models.py` es el único que debe existir:

```python
class UnidadMedida(models.Model):
    codigo = models.CharField(max_length=20, unique=True, db_index=True)
    nombre = models.CharField(max_length=100)
    simbolo = models.CharField(max_length=10)  # Nombre del campo estándar
    tipo = models.CharField(max_length=20, choices=[...])
    descripcion = models.TextField(blank=True, null=True)
    factor_conversion_kg = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)

    @property
    def abreviatura(self):
        """Alias para compatibilidad con código existente"""
        return self.simbolo
```

**Nota**: Se agregó la property `abreviatura` para compatibilidad con código que usaba este campo en los modelos duplicados.

### 2. Eliminación de Modelos Duplicados

#### A. backend/apps/supply_chain/almacenamiento/models.py

**ANTES**:
- Tenía clase `UnidadMedida` completa (líneas 222-274)

**DESPUÉS**:
- Eliminada la clase completa
- Agregada importación: `from apps.supply_chain.catalogos.models import UnidadMedida`

**Cambios en referencias**:
- `self.unidad_medida.abreviatura` → `self.unidad_medida.simbolo` (en método `__str__` de Inventario)

#### B. backend/apps/supply_chain/programacion_abastecimiento/models.py

**ANTES**:
- No tenía clase `UnidadMedida` local (ya usaba la importación correcta)

**DESPUÉS**:
- Sin cambios (ya estaba correcto)

### 3. Actualización de Serializers

#### A. backend/apps/supply_chain/almacenamiento/serializers.py

**Cambios**:
```python
# Importación actualizada
from apps.supply_chain.catalogos.models import UnidadMedida

# Serializer actualizado para compatibilidad
class UnidadMedidaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    abreviatura = serializers.CharField(source='simbolo', read_only=True)  # Compatibilidad

    class Meta:
        model = UnidadMedida
        fields = [
            'id', 'codigo', 'nombre', 'simbolo', 'abreviatura', 'tipo', 'tipo_display',
            'factor_conversion_kg', 'orden', 'is_active', 'created_at', 'updated_at'
        ]
```

**Referencias actualizadas**:
- `source='unidad_medida.abreviatura'` → `source='unidad_medida.simbolo'` (en múltiples serializers)

#### B. backend/apps/supply_chain/programacion_abastecimiento/serializers.py

**Cambios**:
```python
# Importación actualizada
from apps.supply_chain.catalogos.models import UnidadMedida

# Serializer actualizado
class UnidadMedidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadMedida
        fields = [
            'id', 'codigo', 'nombre', 'simbolo', 'tipo', 'descripcion',
            'factor_conversion_kg', 'orden', 'is_active'
        ]
```

### 4. Actualización de Views

#### A. backend/apps/supply_chain/almacenamiento/views.py

```python
# Importación actualizada
from apps.supply_chain.catalogos.models import UnidadMedida
from .models import (
    TipoMovimientoInventario,
    EstadoInventario,
    TipoAlerta,
    Inventario,
    MovimientoInventario,
    Kardex,
    AlertaStock,
    ConfiguracionStock,
)
```

#### B. backend/apps/supply_chain/programacion_abastecimiento/views.py

```python
# Importación actualizada
from apps.supply_chain.catalogos.models import UnidadMedida
from .models import (
    TipoOperacion,
    EstadoProgramacion,
    EstadoEjecucion,
    EstadoLiquidacion,
    Programacion,
    AsignacionRecurso,
    Ejecucion,
    Liquidacion,
)
```

### 5. Actualización de Admin

#### A. backend/apps/supply_chain/almacenamiento/admin.py

```python
# Importación actualizada
from apps.supply_chain.catalogos.models import UnidadMedida

# Eliminado registro duplicado
# @admin.register(UnidadMedida) - ELIMINADO
# UnidadMedida se administra desde catalogos.admin
```

#### B. backend/apps/supply_chain/programacion_abastecimiento/admin.py

```python
# Importación actualizada
from apps.supply_chain.catalogos.models import UnidadMedida

# Eliminado registro duplicado
# @admin.register(UnidadMedida) - ELIMINADO
# UnidadMedida se administra desde catalogos.admin
```

#### C. backend/apps/supply_chain/catalogos/admin.py

**NUEVO - Registro centralizado**:
```python
from django.contrib import admin
from .models import UnidadMedida, Almacen


class CatalogoBaseAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'orden', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering = ['orden', 'nombre']
    list_editable = ['orden', 'is_active']


@admin.register(UnidadMedida)
class UnidadMedidaAdmin(CatalogoBaseAdmin):
    list_display = ['codigo', 'nombre', 'simbolo', 'tipo', 'factor_conversion_kg', 'orden', 'is_active']
    list_filter = ['is_active', 'tipo']
    search_fields = ['codigo', 'nombre', 'simbolo']
    list_editable = ['orden', 'is_active']


@admin.register(Almacen)
class AlmacenAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'empresa', 'es_principal', 'permite_recepcion', 'permite_despacho', 'is_active']
    list_filter = ['empresa', 'es_principal', 'permite_recepcion', 'permite_despacho', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['codigo']
```

## Archivos Modificados

### Eliminados/Modificados
1. ✅ `backend/apps/supply_chain/almacenamiento/models.py`
   - Eliminada clase `UnidadMedida`
   - Agregada importación centralizada

2. ✅ `backend/apps/supply_chain/almacenamiento/serializers.py`
   - Actualizada importación
   - Agregado campo `abreviatura` como alias de `simbolo` para compatibilidad

3. ✅ `backend/apps/supply_chain/almacenamiento/views.py`
   - Actualizada importación

4. ✅ `backend/apps/supply_chain/almacenamiento/admin.py`
   - Actualizada importación
   - Eliminado registro de admin duplicado

5. ✅ `backend/apps/supply_chain/programacion_abastecimiento/serializers.py`
   - Actualizada importación
   - Actualizado serializer para usar campo `simbolo`

6. ✅ `backend/apps/supply_chain/programacion_abastecimiento/views.py`
   - Actualizada importación

7. ✅ `backend/apps/supply_chain/programacion_abastecimiento/admin.py`
   - Actualizada importación
   - Eliminado registro de admin duplicado

### Creados/Actualizados
8. ✅ `backend/apps/supply_chain/catalogos/admin.py`
   - Creado registro de admin para UnidadMedida
   - Creado registro de admin para Almacen

## Compatibilidad

### Campo `abreviatura` vs `simbolo`

El modelo centralizado usa el campo `simbolo`, pero se mantiene compatibilidad con código existente que usaba `abreviatura`:

1. **Property en el modelo**: `abreviatura` → retorna `simbolo`
2. **Serializers**: Campo `abreviatura` mapeado a `source='simbolo'`
3. **Referencias en templates/código**: Actualizar gradualmente de `abreviatura` a `simbolo`

## Próximos Pasos

### Migraciones de Base de Datos

1. **Verificar impacto**:
   ```bash
   python manage.py makemigrations catalogos almacenamiento programacion_abastecimiento --dry-run
   ```

2. **Crear migraciones**:
   ```bash
   python manage.py makemigrations catalogos almacenamiento programacion_abastecimiento
   ```

3. **Aplicar migraciones**:
   ```bash
   python manage.py migrate
   ```

### Verificación

1. **Tests**: Ejecutar tests de supply_chain
   ```bash
   pytest backend/apps/supply_chain/*/tests/
   ```

2. **Admin**: Verificar que UnidadMedida aparezca solo en catalogos/admin

3. **API**: Verificar endpoints:
   - `/api/supply-chain/catalogos/unidades-medida/`
   - `/api/supply-chain/almacenamiento/inventarios/`
   - `/api/supply-chain/programacion-abastecimiento/ejecuciones/`

## Beneficios

1. **Eliminación de duplicación**: Un solo modelo UnidadMedida
2. **Centralización**: Todos los catálogos compartidos en un solo lugar
3. **Mantenibilidad**: Cambios en UnidadMedida se reflejan en todos los módulos
4. **Consistencia**: Misma estructura de datos en toda la aplicación
5. **Admin simplificado**: Un solo punto de administración para unidades de medida

## Notas Técnicas

- **db_table**: `supply_chain_unidad_medida` (sin cambios)
- **Relaciones**: ForeignKey a `catalogos.UnidadMedida` desde múltiples apps
- **Índices**: Se mantienen los mismos índices de base de datos
- **Constraints**: unique en `codigo`, índices en `is_active`

## Referencias

- Modelo centralizado: `backend/apps/supply_chain/catalogos/models.py`
- Admin centralizado: `backend/apps/supply_chain/catalogos/admin.py`
- Documentación de arquitectura: `docs/arquitectura/DATABASE-ARCHITECTURE.md`
