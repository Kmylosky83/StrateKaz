"""
Data migration: consolidar UnidadMedida legacy (organizacion) en el canonico
(catalogo_productos). Se ejecuta por-tenant (tabla configuracion_unidad_medida
vive en cada schema tenant).

Estrategia:
  1. Pass 1: para cada legacy, match por nombre case-insensitive en canonico.
     - Si existe: enriquecer campos vacios del canonico (no sobrescribir)
     - Si NO existe: crear nuevo canonico con todos los campos.
     - Registrar mapping old_legacy_id -> new_canonico_id en SedeEmpresa (*)
  2. Pass 2: resolver FK unidad_base en el canonico usando el mapping.
  3. Pass 3: reasignar FK SedeEmpresa.unidad_capacidad_id (legacy_id -> canonico_id).
     Esto se hace aqui (no en un AlterField aparte) porque Django aun
     tiene apuntada la FK a organizacion.UnidadMedida; el AlterField real
     sucede en una migracion posterior de `configuracion`.

Mapping categoria legacy -> tipo canonico:
  MASA -> PESO, CANTIDAD -> UNIDAD, resto identidad.

Reversible: no-op (se conserva el backup pre-consolidacion).
"""
from django.db import migrations


TIPO_MAP = {
    'MASA': 'PESO',
    'VOLUMEN': 'VOLUMEN',
    'LONGITUD': 'LONGITUD',
    'AREA': 'AREA',
    'CANTIDAD': 'UNIDAD',
    'TIEMPO': 'TIEMPO',
    'CONTENEDOR': 'CONTENEDOR',
    'OTRO': 'OTRO',
}


def migrar_unidades_legacy(apps, schema_editor):
    UMCan = apps.get_model('catalogo_productos', 'UnidadMedida')
    try:
        UMOrg = apps.get_model('organizacion', 'UnidadMedida')
    except LookupError:
        # App legacy no presente en este schema (p.ej. public) — nada que migrar
        return

    try:
        SedeEmpresa = apps.get_model('configuracion', 'SedeEmpresa')
    except LookupError:
        SedeEmpresa = None

    # Pass 1: crear/enriquecer canonicos (sin FK unidad_base aun)
    id_mapping = {}
    legacy_qs = UMOrg.objects.all()
    # Filtrar soft-deleted si existe el campo
    if hasattr(UMOrg, 'deleted_at'):
        legacy_qs = legacy_qs.filter(deleted_at__isnull=True)

    for legacy in legacy_qs:
        tipo_canonico = TIPO_MAP.get(legacy.categoria, 'OTRO')
        existing = UMCan.objects.filter(
            nombre__iexact=legacy.nombre,
            is_deleted=False,
        ).first()

        if existing:
            # Enriquecer solo campos vacios; no sobrescribir valores reales del canonico
            changed = False
            if not existing.simbolo and legacy.simbolo:
                existing.simbolo = legacy.simbolo
                changed = True
            if not existing.nombre_plural and legacy.nombre_plural:
                existing.nombre_plural = legacy.nombre_plural
                changed = True
            if not existing.descripcion and legacy.descripcion:
                existing.descripcion = legacy.descripcion
                changed = True
            # decimales_display tiene default=2, respetarlo salvo que legacy sea distinto
            if legacy.decimales_display is not None and existing.decimales_display == 2:
                existing.decimales_display = legacy.decimales_display
                changed = True
            if legacy.prefiere_notacion_cientifica and not existing.prefiere_notacion_cientifica:
                existing.prefiere_notacion_cientifica = True
                changed = True
            # usar_separador_miles tiene default True; solo cambiar si legacy lo tiene en False
            if not legacy.usar_separador_miles and existing.usar_separador_miles:
                existing.usar_separador_miles = False
                changed = True
            if changed:
                existing.save(update_fields=[
                    'simbolo', 'nombre_plural', 'descripcion',
                    'decimales_display', 'prefiere_notacion_cientifica',
                    'usar_separador_miles', 'updated_at',
                ])
            id_mapping[legacy.pk] = existing.pk
        else:
            # Si legacy esta inactivo (is_active=False), lo saltamos — no migramos
            # registros desactivados al canonico (evita contaminar con data zombie).
            if hasattr(legacy, 'is_active') and not legacy.is_active:
                continue
            new_obj = UMCan.objects.create(
                nombre=legacy.nombre,
                nombre_plural=legacy.nombre_plural or '',
                abreviatura=legacy.simbolo or legacy.codigo.lower(),
                simbolo=legacy.simbolo or '',
                descripcion=legacy.descripcion or '',
                tipo=tipo_canonico,
                factor_conversion=legacy.factor_conversion,
                es_base=(not legacy.unidad_base_id),
                decimales_display=legacy.decimales_display or 2,
                prefiere_notacion_cientifica=legacy.prefiere_notacion_cientifica,
                usar_separador_miles=legacy.usar_separador_miles,
                orden=legacy.orden_display or 0,
                is_system=legacy.es_sistema,
            )
            id_mapping[legacy.pk] = new_obj.pk

    # Pass 2: resolver FK unidad_base en canonico via mapping
    for legacy in legacy_qs:
        if not legacy.unidad_base_id:
            continue
        can_id = id_mapping.get(legacy.pk)
        base_can_id = id_mapping.get(legacy.unidad_base_id)
        if can_id and base_can_id:
            UMCan.objects.filter(pk=can_id).update(unidad_base_id=base_can_id)

    # Pass 3: reasignar SedeEmpresa.unidad_capacidad_id (legacy_id -> canonico_id)
    # Nota: la FK sigue apuntando a organizacion.UnidadMedida a nivel Django,
    # pero el INT _id_ es compatible mientras la columna no cambie de tipo.
    # El AlterField del target se aplica en una migracion posterior de `configuracion`.
    if SedeEmpresa is not None and id_mapping:
        for old_id, new_id in id_mapping.items():
            if old_id != new_id:
                SedeEmpresa.objects.filter(unidad_capacidad_id=old_id).update(
                    unidad_capacidad_id=new_id
                )


def noop(apps, schema_editor):
    """Reverse: no-op. Restaurar via backup si necesario."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo_productos', '0005_unidadmedida_decimales_display_and_more'),
    ]

    operations = [
        migrations.RunPython(migrar_unidades_legacy, reverse_code=noop),
    ]
