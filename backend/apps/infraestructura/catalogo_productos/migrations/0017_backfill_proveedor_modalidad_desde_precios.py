"""
Migración 0017: Backfill de Proveedor.modalidad_logistica desde PrecioMateriaPrima.

Parte del refactor "Modalidad logística al Proveedor" (Fase 1 H-SC-03):
  - PrecioMateriaPrima.modalidad_logistica queda deprecated (se conserva
    la columna por compatibilidad hasta migración de cleanup posterior).
  - Proveedor.modalidad_logistica es la fuente de verdad.

Estrategia del backfill: por cada proveedor, se toma la modalidad más
frecuente en sus PrecioMateriaPrima existentes. Si hay empate, se toma
la primera encontrada. Si el proveedor no tiene precios (o todos tienen
modalidad NULL), se deja el campo en NULL y el admin lo configura
manualmente.

IDEMPOTENTE: si el proveedor ya tiene modalidad_logistica, no se sobreescribe.

Reversible: RunPython.noop en reverso (la columna queda sin datos,
pero los PrecioMateriaPrima.modalidad_logistica están intactos).
"""
from collections import Counter

from django.db import migrations


def backfill_modalidad_desde_precios(apps, schema_editor):
    Proveedor = apps.get_model('infra_catalogo_productos', 'Proveedor')
    PrecioMateriaPrima = apps.get_model('gestion_proveedores', 'PrecioMateriaPrima')

    for prov in Proveedor.objects.filter(modalidad_logistica__isnull=True, is_deleted=False):
        precios = PrecioMateriaPrima.objects.filter(
            proveedor_id=prov.id,
            modalidad_logistica__isnull=False,
        ).values_list('modalidad_logistica_id', flat=True)

        if not precios:
            continue

        # Modalidad más frecuente
        counter = Counter(precios)
        modalidad_id_mas_frecuente, _ = counter.most_common(1)[0]

        prov.modalidad_logistica_id = modalidad_id_mas_frecuente
        prov.save(update_fields=['modalidad_logistica'])


def reverse_noop(apps, schema_editor):
    """No-op: los datos quedan en Proveedor, PrecioMateriaPrima intacto."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('infra_catalogo_productos', '0016_proveedor_modalidad_logistica'),
        # Dependemos de que gestion_proveedores ya tenga PrecioMateriaPrima
        # con el campo modalidad_logistica (0008).
        ('gestion_proveedores', '0008_preciomateriaprima_modalidad_logistica'),
    ]

    operations = [
        migrations.RunPython(
            backfill_modalidad_desde_precios,
            reverse_code=reverse_noop,
        ),
    ]
