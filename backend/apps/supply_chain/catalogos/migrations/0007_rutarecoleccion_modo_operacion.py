"""
H-SC-RUTA-02 — Refactor conceptual Ruta-Proveedor.

1. Agrega `modo_operacion` (PASS_THROUGH | SEMI_AUTONOMA) a RutaRecoleccion.
2. Backfill: rutas existentes quedan en PASS_THROUGH (default conservador).
   Las que tenían `es_proveedor_interno=True` y un Proveedor espejo asociado
   reciben tag pendiente de revisión por el usuario.
3. Elimina `es_proveedor_interno` (concepto deprecado: la Ruta nunca es Proveedor).
4. Cleanup data: los Proveedores espejo (con `ruta_origen != null` y
   `numero_documento` empezando en 'RUTA-') se desactivan y reciben prefijo
   '[LEGACY ESPEJO - REVISAR]' para que el usuario los reclasifique.

NO se eliminan los Proveedores espejo (puede haber FK references desde
VoucherRecepcion/Precios). El usuario debe limpiarlos manualmente desde la UI
después de recrearlos como proveedores reales con NIT real.
"""
from django.db import migrations, models


def cleanup_proveedores_espejo(apps, schema_editor):
    """Marca espejos legacy como inactivos + agrega prefijo visual."""
    Proveedor = apps.get_model('catalogo_productos', 'Proveedor')
    espejos = Proveedor.objects.filter(
        ruta_origen__isnull=False,
        numero_documento__startswith='RUTA-',
    )
    for esp in espejos:
        if not esp.nombre_comercial.startswith('[LEGACY ESPEJO'):
            esp.nombre_comercial = f'[LEGACY ESPEJO - REVISAR] {esp.nombre_comercial}'[:200]
            esp.razon_social = f'[LEGACY ESPEJO - REVISAR] {esp.razon_social}'[:200]
        esp.is_active = False
        esp.ruta_origen = None  # Romper el vínculo: el FK queda como deuda en próxima migración
        esp.save(update_fields=['nombre_comercial', 'razon_social', 'is_active', 'ruta_origen'])


def restore_es_proveedor_interno(apps, schema_editor):
    """Reverse no-op: el campo se reagrega automáticamente vía AddField inverso."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("catalogos", "0006_rutarecoleccion_codigo_blank"),
        ("catalogo_productos", "0020_proveedor_drop_sede_empresa_origen"),
    ]

    operations = [
        # 1. Agregar modo_operacion (default PASS_THROUGH para todas las existentes)
        migrations.AddField(
            model_name="rutarecoleccion",
            name="modo_operacion",
            field=models.CharField(
                choices=[
                    ("PASS_THROUGH", "Pass-through (empresa paga directo)"),
                    ("SEMI_AUTONOMA", "Semi-autónoma (ruta con caja propia)"),
                ],
                default="PASS_THROUGH",
                db_index=True,
                help_text=(
                    "PASS_THROUGH: empresa paga directo al productor. "
                    "SEMI_AUTONOMA: la ruta tiene caja propia con doble precio."
                ),
                max_length=20,
                verbose_name="Modo de operación",
            ),
        ),
        # 2. Cleanup de espejos legacy ANTES de eliminar es_proveedor_interno
        migrations.RunPython(
            cleanup_proveedores_espejo,
            reverse_code=restore_es_proveedor_interno,
        ),
        # 3. Eliminar es_proveedor_interno (concepto deprecado)
        migrations.RemoveField(
            model_name="rutarecoleccion",
            name="es_proveedor_interno",
        ),
    ]
