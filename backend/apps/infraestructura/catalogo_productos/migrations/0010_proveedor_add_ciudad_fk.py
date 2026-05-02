"""
Migración 0010: Convertir Proveedor.ciudad de CharField a ForeignKey(Ciudad).

Fase A de 2 migraciones (0010 + 0011):
    - 0010: Agrega campo temporal `ciudad_ref` como FK(Ciudad, null=True) y
      corre data migration que intenta mapear el string actual de `ciudad`
      a un ID del catálogo canónico.
    - 0011: Elimina `ciudad` CharField y renombra `ciudad_ref` → `ciudad`.

Política de data migration:
    - Mapeo por (departamento_id, slug_nombre) cuando ambos están presentes.
    - Si no matchea (nombre inconsistente, ciudad que no está en el catálogo
      o departamento NULL), `ciudad_ref` queda NULL y se emite warning en el
      stdout del seed para que el admin corrija manualmente.
    - IDEMPOTENTE: se puede re-correr; los ya mapeados no se tocan.

Precondición:
    - Ejecutar `seed_geografia_colombia` antes de esta migración para garantizar
      que el catálogo `apps.core.Ciudad` está poblado con los 1,104 municipios.

Histórico:
    2026-04-22: Creación. Cierra H-CAT-05 para Proveedor.ciudad.
"""
from __future__ import annotations

import re
import unicodedata

from django.db import migrations, models


def _slug(s: str) -> str:
    """Slug ASCII lowercase sin acentos (mismo que seed_geografia_colombia)."""
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii')
    s = s.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '_', s)
    return s.strip('_')


def map_ciudad_string_to_fk(apps, schema_editor):
    """
    Para cada Proveedor con `ciudad` string no vacío y `departamento` FK,
    intenta resolver el ID de Ciudad por (departamento_id, slug(nombre)).
    Si no matchea, `ciudad_ref` queda NULL y se imprime una línea de
    advertencia para auditoría manual.
    """
    Proveedor = apps.get_model('infra_catalogo_productos', 'Proveedor')
    Ciudad = apps.get_model('core', 'Ciudad')

    # Pre-index ciudades por (dept_id, slug_nombre) para O(1) lookup
    ciudades_index: dict[tuple[int, str], int] = {}
    for c in Ciudad.objects.all().values('id', 'departamento_id', 'nombre'):
        key = (c['departamento_id'], _slug(c['nombre']))
        ciudades_index[key] = c['id']

    mapped = 0
    unmapped = 0
    empty = 0
    warnings: list[str] = []

    # Solo procesar proveedores no soft-deleted con ciudad string no vacía
    qs = Proveedor.objects.filter(is_deleted=False)
    for p in qs.only('id', 'nombre_comercial', 'ciudad', 'departamento_id'):
        ciudad_str = (p.ciudad or '').strip()
        if not ciudad_str:
            empty += 1
            continue

        if not p.departamento_id:
            unmapped += 1
            warnings.append(
                f'  [UNMAPPED] Proveedor id={p.id} "{p.nombre_comercial}": '
                f'ciudad="{ciudad_str}" sin departamento_id'
            )
            continue

        slug_nombre = _slug(ciudad_str)
        ciudad_id = ciudades_index.get((p.departamento_id, slug_nombre))
        if ciudad_id:
            Proveedor.objects.filter(pk=p.pk).update(ciudad_ref_id=ciudad_id)
            mapped += 1
        else:
            unmapped += 1
            warnings.append(
                f'  [UNMAPPED] Proveedor id={p.id} "{p.nombre_comercial}": '
                f'ciudad="{ciudad_str}" dept_id={p.departamento_id} '
                f'no encontrada en catálogo Ciudad'
            )

    # Reporte (sale en stdout durante migrate)
    print(f'\n  [Proveedor.ciudad → FK] Mapeados: {mapped} | '
          f'No mapeados: {unmapped} | Vacíos (ignorados): {empty}')
    if warnings:
        print('  Registros que quedaron con ciudad_ref=NULL (revisar manualmente):')
        for w in warnings[:20]:  # cap a 20 líneas para no saturar logs
            print(w)
        if len(warnings) > 20:
            print(f'  ... y {len(warnings) - 20} más.')


def reverse_noop(apps, schema_editor):
    """Reversa: no elimina los mapeos (por seguridad en rollback)."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('infra_catalogo_productos', '0009_alter_proveedor_tipo_persona'),
        ('core', '0001_initial'),  # asegura que Ciudad existe
    ]

    operations = [
        migrations.AddField(
            model_name='proveedor',
            name='ciudad_ref',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=models.deletion.PROTECT,
                related_name='proveedores_ct',
                to='core.ciudad',
                verbose_name='Ciudad',
            ),
        ),
        migrations.RunPython(map_ciudad_string_to_fk, reverse_noop),
    ]
