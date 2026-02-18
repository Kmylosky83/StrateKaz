# Solución Migración 0002 - Revisión Dirección

## Problema Original

La tabla `revision_direccion_programarevision` tenía una inconsistencia entre:

1. **Estado de Django (0001_initial)**: Definía `empresa_id` como campo simple con `unique_together`
2. **Realidad de la BD**: Ya tenía una FK `empresa_id` apuntando a `configuracion_empresa` pero sin el índice único

## Diagnóstico

```sql
-- La columna empresa_id ya existía como FK
CONSTRAINT `revision_direccion_p_empresa_id_d2d3a31a_fk_configura`
FOREIGN KEY (`empresa_id`) REFERENCES `configuracion_empresa` (`id`)

-- Pero NO existía el índice único que Django esperaba
-- unique_together definido en 0001_initial línea 354
```

## Solución Implementada

Usamos `SeparateDatabaseAndState` para separar:

### 1. Operaciones de Base de Datos (lo que se ejecuta realmente)

```python
database_operations=[
    migrations.RunSQL(
        sql="""
        ALTER TABLE revision_direccion_programarevision
        ADD UNIQUE INDEX revision_direccion_programarevision_empresa_id_anio_periodo_uniq
        (empresa_id, anio, periodo)
        """,
        reverse_sql="""
        ALTER TABLE revision_direccion_programarevision
        DROP INDEX revision_direccion_programarevision_empresa_id_anio_periodo_uniq
        """,
    ),
]
```

Solo creamos el índice único que faltaba.

### 2. Operaciones de Estado (lo que Django cree que pasó)

```python
state_operations=[
    # 1. Eliminar el unique_together inexistente
    migrations.AlterUniqueTogether(
        name="programarevision",
        unique_together=set(),
    ),
    # 2. Remover el campo empresa_id del estado
    migrations.RemoveField(
        model_name="programarevision",
        name="empresa_id",
    ),
    # 3. Agregar el campo empresa como FK (solo en estado)
    migrations.AddField(
        model_name="programarevision",
        name="empresa",
        field=models.ForeignKey(
            ...
            db_column="empresa_id",  # ← Usar la columna existente
        ),
    ),
    # 4. Establecer el nuevo unique_together
    migrations.AlterUniqueTogether(
        name="programarevision",
        unique_together={("empresa", "anio", "periodo")},
    ),
]
```

Actualizamos el estado de Django para reflejar que `empresa` es una FK (no `empresa_id` simple).

## Resultado

- La BD ahora tiene el índice único: `(empresa_id, anio, periodo)`
- Django ve el campo como `empresa` (FK) mapeado a la columna `empresa_id`
- El modelo `ProgramaRevision` hereda correctamente de `BaseCompanyModel`
- `unique_together = ['empresa', 'anio', 'periodo']` funciona correctamente

## Verificación

```bash
# Ver índices
# Ver campo en Django
docker exec stratekaz_backend python manage.py shell -c \
  "from apps.gestion_estrategica.revision_direccion.models import ProgramaRevision; \
   print('DB column:', ProgramaRevision._meta.get_field('empresa').column)"

# Ver unique_together
docker exec stratekaz_backend python manage.py shell -c \
  "from apps.gestion_estrategica.revision_direccion.models import ProgramaRevision; \
   print('Unique together:', ProgramaRevision._meta.unique_together)"
```

## Por Qué Funciona

`SeparateDatabaseAndState` es la herramienta correcta cuando:

- La estructura real de la BD difiere del estado de Django
- No queremos perder datos
- Necesitamos sincronizar el estado sin alterar la BD existente

En nuestro caso:
- **BD**: Ya tenía la FK, solo faltaba el índice único
- **Django**: Creía que era un campo simple, no una FK

La migración:
1. Crea solo lo que falta en BD (índice único)
2. Actualiza el estado de Django para reflejar la realidad (campo FK)

## Lecciones Aprendidas

1. Siempre verificar el estado real de la BD antes de migrar:
   ```sql
   DESCRIBE tabla;
   SHOW CREATE TABLE tabla;
   ```

2. Usar `SeparateDatabaseAndState` cuando hay divergencia entre BD y Django

3. Especificar `db_column` cuando el nombre del campo Django difiere de la columna BD

4. En MySQL, los índices únicos se crean con `ADD UNIQUE INDEX` no `ADD CONSTRAINT UNIQUE`

## Referencias

- [Django Migrations - SeparateDatabaseAndState](https://docs.djangoproject.com/en/5.0/ref/migration-operations/#django.db.migrations.operations.SeparateDatabaseAndState)
- [BaseCompanyModel](../../core/base_models/base.py)
- [Modelo ProgramaRevision](../models.py)
