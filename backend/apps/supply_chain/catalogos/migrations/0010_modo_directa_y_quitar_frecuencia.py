"""
Refactor 2026-04-26 (H-SC-RUTA-02 ajustes post-deploy):
1. PASS_THROUGH label: "Pass-through (empresa paga directo)" → "Directa
   (empresa paga al productor)" — UX en español.
2. Eliminar `frecuencia_pago` de RutaParada — la frecuencia es decisión
   del momento de liquidación (acumulativa), no camisa de fuerza por parada.
3. Renombrar ModalidadLogistica 'COMPRA_PUNTO' label "Compra en Punto" →
   "Recolección en Punto" (data migration en gestion_proveedores).
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogos", "0009_precio_ruta_semi"),
    ]

    operations = [
        migrations.AlterField(
            model_name="rutarecoleccion",
            name="modo_operacion",
            field=models.CharField(
                choices=[
                    ("PASS_THROUGH", "Directa (empresa paga al productor)"),
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
        migrations.RemoveField(
            model_name="rutaparada",
            name="frecuencia_pago",
        ),
        migrations.AlterField(
            model_name="rutaparada",
            name="orden",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Secuencia sugerida en el recorrido (0 = primera). No restrictivo.",
                verbose_name="Orden de visita (sugerido)",
            ),
        ),
    ]
