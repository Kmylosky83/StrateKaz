# Solución: Migración de Campo empresa_id a FK

## Problema Identificado

Las apps `revision_direccion` y `gestion_proyectos` tenían una inconsistencia entre el estado de Django y la estructura real de la base de datos:

- **Estado de Django (migrations/0001_initial.py)**: Definía `empresa_id` como `PositiveBigIntegerField` con `unique_together`
- **Realidad de la BD**: Ya tenía `empresa_id` como FK hacia `configuracion_empresa` (creada automáticamente por herencia de `BaseCompanyModel`)

## Causa Raíz

Cuando se generó la migración inicial `0001_initial.py`, Django no reconoció que el modelo heredaba de `BaseCompanyModel` que ya define el campo `empresa` como FK. Esto creó una divergencia:

1. El modelo en `models.py` hereda de `BaseCompanyModel` (tiene FK `empresa`)
2. La migración `0001_initial.py` generó un campo simple `empresa_id`
3. Al ejecutar la migración, Django creó la FK automáticamente por herencia
4. Quedaron inconsistentes: Django creía que era campo simple, pero BD tenía FK

## Solución Implementada

### 1. revision_direccion

#### Migración 0002
Usamos `SeparateDatabaseAndState` para sincronizar:

**Operaciones de Base de Datos:**
```python
migrations.RunSQL(
    sql="""
    ALTER TABLE revision_direccion_programarevision
    ADD UNIQUE INDEX revision_direccion_programarevision_empresa_id_anio_periodo_uniq
    (empresa_id, anio, periodo)
    """
)
```
Solo agregamos el índice único que faltaba (el `unique_together`).

**Operaciones de Estado:**
```python
# 1. Eliminar unique_together inexistente
migrations.AlterUniqueTogether(name="programarevision", unique_together=set())

# 2. Remover campo empresa_id del estado
migrations.RemoveField(model_name="programarevision", name="empresa_id")

# 3. Agregar campo empresa como FK (en estado)
migrations.AddField(
    model_name="programarevision",
    name="empresa",
    field=models.ForeignKey(..., db_column="empresa_id")
)

# 4. Establecer nuevo unique_together
migrations.AlterUniqueTogether(
    name="programarevision",
    unique_together={("empresa", "anio", "periodo")}
)
```

Actualizamos el estado de Django para reflejar que `empresa` es FK.

#### Migración 0003
Removió el `db_column="empresa_id"` explícito (Django lo infiere automáticamente):

```python
migrations.SeparateDatabaseAndState(
    database_operations=[],  # No cambia BD
    state_operations=[
        migrations.AlterField(
            model_name="programarevision",
            name="empresa",
            field=models.ForeignKey(...)  # Sin db_column
        )
    ]
)
```

### 2. gestion_proyectos

#### Migración 0002
Similar a revision_direccion, pero sin necesidad de crear índices (ya existían):

```python
migrations.SeparateDatabaseAndState(
    database_operations=[],  # No cambia BD
    state_operations=[
        migrations.AlterField(model_name="portafolio", name="empresa", ...),
        migrations.AlterField(model_name="programa", name="empresa", ...),
        migrations.AlterField(model_name="proyecto", name="empresa", ...),
    ]
)
```

## Verificación

### Estado Final de la Base de Datos

```sql
-- revision_direccion_programarevision
CONSTRAINT `revision_direccion_p_empresa_id_d2d3a31a_fk_configura`
FOREIGN KEY (`empresa_id`) REFERENCES `configuracion_empresa` (`id`)

UNIQUE KEY `revision_direccion_programarevision_empresa_id_anio_periodo_uniq`
(`empresa_id`, `anio`, `periodo`)

-- gestion_proyectos_portafolio
CONSTRAINT `gestion_proyectos_po_empresa_id_0ee8352c_fk_configura`
FOREIGN KEY (`empresa_id`) REFERENCES `configuracion_empresa` (`id`)

UNIQUE KEY `gestion_proyectos_portafolio_empresa_id_codigo_e596b5da_uniq`
(`empresa_id`, `codigo`)
```

### Estado de Django ORM

```python
# revision_direccion.ProgramaRevision
ProgramaRevision._meta.get_field('empresa')
# → ForeignKey to configuracion.EmpresaConfig
ProgramaRevision._meta.get_field('empresa').column
# → 'empresa_id'
ProgramaRevision._meta.unique_together
# → (('empresa', 'anio', 'periodo'),)

# Similar para gestion_proyectos
```

## Lecciones Aprendidas

### 1. Verificar Estructura Real de BD Antes de Migrar

Siempre ejecutar:
```sql
DESCRIBE tabla;
SHOW CREATE TABLE tabla;
SHOW INDEXES FROM tabla;
```

### 2. Uso de SeparateDatabaseAndState

Es la herramienta correcta cuando:
- Hay divergencia entre estado de Django y realidad de BD
- No queremos perder datos
- Necesitamos sincronizar sin alterar estructura existente

### 3. db_column Explícito vs Implícito

Django infiere automáticamente que un FK llamado `empresa` usa columna `empresa_id`. Solo especificar `db_column` cuando sea necesario (nombres no estándar).

### 4. Índices Únicos en MySQL

En MySQL, crear índices únicos con:
```sql
ALTER TABLE tabla ADD UNIQUE INDEX nombre_idx (col1, col2);
```
No con `ADD CONSTRAINT UNIQUE`.

### 5. Herencia de BaseCompanyModel

Cuando un modelo hereda de `BaseCompanyModel`:
- Ya tiene el campo `empresa` como FK
- La migración inicial debe reconocerlo
- Si no, usar `SeparateDatabaseAndState` para corregir

## Archivos Modificados

### revision_direccion
- `migrations/0002_alter_programarevision_unique_together_and_more.py` - Creado índice único y sincronizado estado
- `migrations/0003_alter_programarevision_empresa.py` - Removido db_column explícito
- `migrations/README_MIGRACION_0002.md` - Documentación técnica

### gestion_proyectos
- `migrations/0002_alter_portafolio_empresa_alter_programa_empresa_and_more.py` - Sincronizado estado

## Comando de Verificación

```bash
# Ver estado de migraciones
docker exec grasas_huesos_backend python manage.py showmigrations revision_direccion gestion_proyectos

# Verificar que no hay cambios pendientes
docker exec grasas_huesos_backend python manage.py makemigrations --check

# Probar consultas ORM
docker exec grasas_huesos_backend python manage.py shell -c "
from apps.gestion_estrategica.revision_direccion.models import ProgramaRevision
print('Empresa field:', ProgramaRevision._meta.get_field('empresa'))
print('DB column:', ProgramaRevision._meta.get_field('empresa').column)
"
```

## Referencias

- [Django SeparateDatabaseAndState](https://docs.djangoproject.com/en/5.0/ref/migration-operations/#django.db.migrations.operations.SeparateDatabaseAndState)
- [BaseCompanyModel](../backend/apps/core/base_models/base.py)
- [Django Migrations - Best Practices](https://docs.djangoproject.com/en/5.0/topics/migrations/)

## Estado Final

- Todas las migraciones aplicadas correctamente
- Base de datos con FKs e índices correctos
- Estado de Django sincronizado con realidad de BD
- ORM funcionando correctamente
- Sin cambios pendientes en makemigrations
