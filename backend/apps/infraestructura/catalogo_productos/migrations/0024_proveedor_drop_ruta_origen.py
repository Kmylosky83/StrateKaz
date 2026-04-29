"""
Migración 0022 — H-PROV-DROP — Drop final de Proveedor.ruta_origen.

Cierre del refactor H-SC-RUTA-02. El concepto de "Proveedor espejo" de una
ruta fue eliminado: la Ruta NUNCA es un Proveedor; la asociación entre Ruta
y Proveedores reales vive en RutaParada (M2M con orden + frecuencia_pago).

La migración `supply_chain.catalogos.0007_rutarecoleccion_modo_operacion`
ya rompió el vínculo (`esp.ruta_origen = None` para todos los espejos legacy)
y los marcó visualmente como `[LEGACY ESPEJO - REVISAR]` para que el usuario
los reclasifique desde la UI.

Ningún código LIVE referencia el campo. Drop seguro.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("infra_catalogo_productos", "0023_proveedor_sede_empresa_origen"),
        # Garantiza que el cleanup de espejos corrió antes del drop:
        ("catalogos", "0007_rutarecoleccion_modo_operacion"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="proveedor",
            name="ruta_origen",
        ),
    ]
