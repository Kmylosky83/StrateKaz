# Generated manually for performance optimization
# Migration: Add missing indexes to critical ForeignKey fields

from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Agrega índices de rendimiento para módulo de almacenamiento.

    Problemas resueltos:
    - Índices para consultas de disponibilidad de inventario
    - Índices para kardex y trazabilidad de movimientos
    - Índices para alertas de stock
    """

    dependencies = [
        ('almacenamiento', '0002_initial'),
    ]

    operations = [
        # =====================================================
        # ÍNDICES COMPUESTOS PARA INVENTARIO
        # =====================================================

        # Consultas de disponibilidad por almacén y producto
        migrations.AddIndex(
            model_name='inventario',
            index=models.Index(
                fields=['almacen', 'producto_codigo', 'estado'],
                name='idx_inv_alm_prod_estado'
            ),
        ),

        # Filtros por tipo de producto
        migrations.AddIndex(
            model_name='inventario',
            index=models.Index(
                fields=['producto_tipo', 'almacen', 'estado'],
                name='idx_inv_tipo_alm_estado'
            ),
        ),

        # Alertas de vencimiento
        migrations.AddIndex(
            model_name='inventario',
            index=models.Index(
                fields=['fecha_vencimiento', 'estado'],
                name='idx_inv_venc_estado'
            ),
        ),

        # =====================================================
        # ÍNDICES COMPUESTOS PARA MOVIMIENTOS DE INVENTARIO
        # =====================================================

        # Kardex por producto y almacén
        migrations.AddIndex(
            model_name='movimientoinventario',
            index=models.Index(
                fields=['almacen_destino', 'producto_codigo', '-fecha_movimiento'],
                name='idx_mov_kardex'
            ),
        ),

        # Trazabilidad por documento de referencia
        migrations.AddIndex(
            model_name='movimientoinventario',
            index=models.Index(
                fields=['documento_referencia', '-fecha_movimiento'],
                name='idx_mov_doc_fecha'
            ),
        ),

        # Movimientos por empresa
        migrations.AddIndex(
            model_name='movimientoinventario',
            index=models.Index(
                fields=['empresa', 'tipo_movimiento', '-fecha_movimiento'],
                name='idx_mov_emp_tipo_fecha'
            ),
        ),

        # =====================================================
        # ÍNDICES PARA ALERTAS DE STOCK
        # =====================================================

        # Alertas activas por empresa
        migrations.AddIndex(
            model_name='alertastock',
            index=models.Index(
                fields=['empresa', 'tipo_alerta', 'resuelta'],
                name='idx_alerta_emp_tipo'
            ),
        ),

        # Alertas pendientes
        migrations.AddIndex(
            model_name='alertastock',
            index=models.Index(
                fields=['resuelta', '-fecha_generacion'],
                name='idx_alerta_pend_fecha'
            ),
        ),

        # =====================================================
        # ÍNDICES PARA CONFIGURACIÓN DE STOCK
        # =====================================================

        # Configuración por empresa y almacén
        migrations.AddIndex(
            model_name='configuracionstock',
            index=models.Index(
                fields=['empresa', 'almacen'],
                name='idx_confstock_emp_alm'
            ),
        ),
    ]
