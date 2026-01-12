# Generated manually for performance optimization
# Migration: Add missing indexes to critical ForeignKey fields

from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Agrega índices de rendimiento para módulo de compras.

    Problemas resueltos:
    - Índices compuestos para dashboard de requisiciones
    - Índices para filtros por sede y empresa
    - Índices para trazabilidad de detalles
    """

    dependencies = [
        ('compras', '0001_initial'),
    ]

    operations = [
        # =====================================================
        # ÍNDICES COMPUESTOS PARA REQUISICIONES
        # =====================================================

        # Dashboard: requisiciones por estado, prioridad y urgencia
        migrations.AddIndex(
            model_name='requisicion',
            index=models.Index(
                fields=['estado', 'prioridad', 'fecha_requerida'],
                name='idx_req_estado_prior_fecha'
            ),
        ),

        # Reportes por sede
        migrations.AddIndex(
            model_name='requisicion',
            index=models.Index(
                fields=['sede', 'estado', '-fecha_solicitud'],
                name='idx_req_sede_estado'
            ),
        ),

        # Filtros por empresa
        migrations.AddIndex(
            model_name='requisicion',
            index=models.Index(
                fields=['empresa', 'estado'],
                name='idx_req_empresa_estado'
            ),
        ),

        # =====================================================
        # ÍNDICES PARA DETALLES DE REQUISICIÓN
        # =====================================================

        # Búsqueda de detalles por requisición (FK sin índice)
        migrations.AddIndex(
            model_name='detallerequisicion',
            index=models.Index(
                fields=['requisicion'],
                name='idx_detreq_requisicion'
            ),
        ),

        # =====================================================
        # ÍNDICES COMPUESTOS PARA ÓRDENES DE COMPRA
        # =====================================================

        # Órdenes pendientes de recepción por proveedor
        migrations.AddIndex(
            model_name='ordencompra',
            index=models.Index(
                fields=['estado', 'proveedor', 'fecha_entrega_esperada'],
                name='idx_oc_estado_prov_fecha'
            ),
        ),

        # Reportes por sede y estado
        migrations.AddIndex(
            model_name='ordencompra',
            index=models.Index(
                fields=['sede', 'estado', '-fecha_orden'],
                name='idx_oc_sede_estado'
            ),
        ),

        # Filtros por empresa
        migrations.AddIndex(
            model_name='ordencompra',
            index=models.Index(
                fields=['empresa', 'estado'],
                name='idx_oc_empresa_estado'
            ),
        ),

        # =====================================================
        # ÍNDICES PARA DETALLES DE ORDEN DE COMPRA
        # =====================================================

        # Búsqueda de detalles por orden (FK sin índice)
        migrations.AddIndex(
            model_name='detalleordencompra',
            index=models.Index(
                fields=['orden_compra'],
                name='idx_detoc_orden'
            ),
        ),

        # =====================================================
        # ÍNDICES PARA COTIZACIONES
        # =====================================================

        # Cotizaciones por estado y fecha de vencimiento
        migrations.AddIndex(
            model_name='cotizacion',
            index=models.Index(
                fields=['estado', 'fecha_vencimiento'],
                name='idx_cot_estado_venc'
            ),
        ),

        # =====================================================
        # ÍNDICES PARA CONTRATOS
        # =====================================================

        # Contratos por empresa
        migrations.AddIndex(
            model_name='contrato',
            index=models.Index(
                fields=['empresa', 'estado'],
                name='idx_contrato_empresa'
            ),
        ),

        # Contratos por fecha de vencimiento (alertas)
        migrations.AddIndex(
            model_name='contrato',
            index=models.Index(
                fields=['estado', 'fecha_fin'],
                name='idx_contrato_venc'
            ),
        ),
    ]
