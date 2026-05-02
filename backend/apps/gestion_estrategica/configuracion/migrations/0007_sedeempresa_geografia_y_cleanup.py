"""
Migración 0007: SedeEmpresa — geografía FK + cleanup de roles (H-SC-10).

Cambios:
  1. Agrega campo temporal `ciudad_fk` (FK a core.Ciudad, null).
  2. Data migration: mapea ciudad CharField + departamento (choices) → ciudad_fk
     usando (departamento_codigo, slug_nombre) contra el catálogo DIVIPOLA.
     Registros sin match quedan con ciudad_fk=NULL (warning por stdout).
  3. Remove index compuesto (departamento, ciudad).
  4. Remove index compuesto (tipo_unidad, es_unidad_negocio).
  5. RemoveField `ciudad` (CharField).
  6. RenameField `ciudad_fk` → `ciudad`.
  7. RemoveField `departamento` (CharField) — se deriva de ciudad.departamento.
  8. RemoveField `tipo_unidad` — el rol operativo vive ahora en
     TipoSede.rol_operacional (fusionado en migración 0006).
  9. RemoveField `es_proveedor_interno` — el concepto migró a
     catalogos.RutaRecoleccion.es_proveedor_interno.
 10. AddIndex (ciudad) y (es_unidad_negocio) individuales.

Precondición:
  - `seed_geografia_colombia` debe haber corrido para que el catálogo
    core.Ciudad esté poblado con los 1,104 municipios.
"""
import re
import unicodedata

import django.db.models.deletion
from django.db import migrations, models


def _slug(s: str) -> str:
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode('ascii')
    s = s.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '_', s)
    return s.strip('_')


def map_ciudad_string_to_fk(apps, schema_editor):
    SedeEmpresa = apps.get_model('configuracion', 'SedeEmpresa')
    Ciudad = apps.get_model('core', 'Ciudad')
    Departamento = apps.get_model('core', 'Departamento')

    # Index departamentos por codigo (ej: 'CUNDINAMARCA')
    depts_por_codigo = {
        d.codigo.upper(): d.id for d in Departamento.objects.all()
    }
    # Index ciudades por (dept_id, slug_nombre)
    ciudades_index: dict[tuple[int, str], int] = {}
    for c in Ciudad.objects.all().values('id', 'departamento_id', 'nombre'):
        key = (c['departamento_id'], _slug(c['nombre']))
        ciudades_index[key] = c['id']

    mapped = 0
    unmapped = 0
    empty = 0
    warnings: list[str] = []

    for s in SedeEmpresa.objects.all().only(
        'id', 'codigo', 'nombre', 'ciudad', 'departamento'
    ):
        ciudad_str = (s.ciudad or '').strip()
        dept_str = (s.departamento or '').strip().upper()
        if not ciudad_str or not dept_str:
            empty += 1
            continue
        dept_id = depts_por_codigo.get(dept_str)
        if dept_id is None:
            unmapped += 1
            warnings.append(
                f'  [UNMAPPED] Sede id={s.id} "{s.nombre}": '
                f'departamento="{dept_str}" no está en catálogo'
            )
            continue
        slug_nombre = _slug(ciudad_str)
        ciudad_id = ciudades_index.get((dept_id, slug_nombre))
        if ciudad_id:
            SedeEmpresa.objects.filter(pk=s.pk).update(ciudad_fk_id=ciudad_id)
            mapped += 1
        else:
            unmapped += 1
            warnings.append(
                f'  [UNMAPPED] Sede id={s.id} "{s.nombre}": '
                f'ciudad="{ciudad_str}" depto="{dept_str}" no encontrada en catálogo'
            )

    print(
        f'\n  [SedeEmpresa.ciudad → FK] Mapeadas: {mapped} | '
        f'No mapeadas: {unmapped} | Vacías (ignoradas): {empty}'
    )
    if warnings:
        print('  Registros con ciudad_fk=NULL (revisar manualmente):')
        for w in warnings[:20]:
            print(w)
        if len(warnings) > 20:
            print(f'  ... y {len(warnings) - 20} más.')


def reverse_noop(apps, schema_editor):
    """Noop reverso (los datos mapeados permanecen)."""
    return


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0006_tiposede_rol_operacional'),
        ('core', '0001_initial'),
        # Dependemos de que el voucher ya no apunte a SedeEmpresa como ruta
        # (uneg_transportista eliminado) y de que Proveedor ya no tenga
        # sede_empresa_origen — así los choices tipo_unidad y
        # es_proveedor_interno se pueden eliminar sin referencias activas.
        ('sc_recepcion', '0004_voucher_ruta_recoleccion'),
        ('infra_catalogo_productos', '0020_proveedor_drop_sede_empresa_origen'),
    ]

    operations = [
        # 1. Remove indexes que referencian campos a eliminar.
        migrations.RemoveIndex(
            model_name='sedeempresa',
            name='configuraci_departa_dacde3_idx',
        ),
        migrations.RemoveIndex(
            model_name='sedeempresa',
            name='configuraci_tipo_un_ef564e_idx',
        ),

        # 2. Add ciudad_fk (temporal).
        migrations.AddField(
            model_name='sedeempresa',
            name='ciudad_fk',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='sedes',
                to='core.ciudad',
                verbose_name='Ciudad',
            ),
        ),

        # 3. Backfill ciudad_fk desde CharField ciudad + departamento.
        migrations.RunPython(map_ciudad_string_to_fk, reverse_noop),

        # 4. Drop ciudad CharField.
        migrations.RemoveField(
            model_name='sedeempresa',
            name='ciudad',
        ),

        # 5. Rename ciudad_fk → ciudad.
        migrations.RenameField(
            model_name='sedeempresa',
            old_name='ciudad_fk',
            new_name='ciudad',
        ),

        # 6. Drop departamento CharField (derivado de ciudad.departamento).
        migrations.RemoveField(
            model_name='sedeempresa',
            name='departamento',
        ),

        # 7. Drop tipo_unidad (rol vive ahora en TipoSede.rol_operacional).
        migrations.RemoveField(
            model_name='sedeempresa',
            name='tipo_unidad',
        ),

        # 8. Drop es_proveedor_interno (concepto movido a RutaRecoleccion).
        migrations.RemoveField(
            model_name='sedeempresa',
            name='es_proveedor_interno',
        ),

        # 9. Add new indexes.
        migrations.AddIndex(
            model_name='sedeempresa',
            index=models.Index(
                fields=['ciudad'], name='configuraci_ciudad__23b27b_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='sedeempresa',
            index=models.Index(
                fields=['es_unidad_negocio'],
                name='configuraci_es_unid_872652_idx',
            ),
        ),
    ]
