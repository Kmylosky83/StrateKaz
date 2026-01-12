# Generated manually for performance optimization
# Migration: Add missing indexes to critical ForeignKey fields

from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Agrega índices faltantes identificados en auditoría de rendimiento.

    Problemas resueltos:
    - ForeignKey sin db_index en campos frecuentemente consultados
    - Índices compuestos para reportes y filtros comunes

    Impacto esperado:
    - Mejora 20-30x en consultas de filtrado por tipo/categoría
    - Mejora significativa en reportes por ubicación geográfica
    """

    dependencies = [
        ('gestion_proveedores', '0001_initial'),
    ]

    operations = [
        # =====================================================
        # ÍNDICES INDIVIDUALES EN FOREIGNKEYS CRÍTICAS
        # =====================================================

        # TipoMateriaPrima.categoria - Filtros por categoría (HUESO, SEBO, etc.)
        migrations.AddIndex(
            model_name='tipomateriaprima',
            index=models.Index(fields=['categoria'], name='idx_tipomp_categoria'),
        ),

        # Ciudad.departamento - Búsquedas geográficas
        migrations.AddIndex(
            model_name='ciudad',
            index=models.Index(fields=['departamento'], name='idx_ciudad_depto'),
        ),

        # UnidadNegocio.tipo_unidad - Filtros por tipo de sede
        migrations.AddIndex(
            model_name='unidadnegocio',
            index=models.Index(fields=['tipo_unidad'], name='idx_unidad_tipo'),
        ),

        # =====================================================
        # ÍNDICES COMPUESTOS PARA PROVEEDOR
        # =====================================================

        # Reportes por ubicación geográfica y tipo
        migrations.AddIndex(
            model_name='proveedor',
            index=models.Index(
                fields=['departamento', 'tipo_proveedor', 'is_active'],
                name='idx_prov_depto_tipo_act'
            ),
        ),

        # Filtros por modalidad logística
        migrations.AddIndex(
            model_name='proveedor',
            index=models.Index(
                fields=['modalidad_logistica', 'is_active'],
                name='idx_prov_modal_activo'
            ),
        ),

        # Búsqueda por unidad de negocio
        migrations.AddIndex(
            model_name='proveedor',
            index=models.Index(
                fields=['unidad_negocio', 'is_active'],
                name='idx_prov_unidad_activo'
            ),
        ),

        # =====================================================
        # ÍNDICES PARA EVALUACIONES DE PROVEEDOR
        # =====================================================

        # Historial de evaluaciones por proveedor y fecha
        migrations.AddIndex(
            model_name='evaluacionproveedor',
            index=models.Index(
                fields=['proveedor', '-fecha_evaluacion'],
                name='idx_eval_prov_fecha'
            ),
        ),

        # Evaluaciones pendientes de revisión
        migrations.AddIndex(
            model_name='evaluacionproveedor',
            index=models.Index(
                fields=['requiere_seguimiento', 'proxima_evaluacion'],
                name='idx_eval_seguimiento'
            ),
        ),

        # =====================================================
        # ÍNDICES PARA PRUEBAS DE ACIDEZ
        # =====================================================

        # Reportes de calidad por proveedor
        migrations.AddIndex(
            model_name='pruebaacidez',
            index=models.Index(
                fields=['proveedor', 'calidad_resultante', '-fecha_prueba'],
                name='idx_acidez_prov_cal'
            ),
        ),

        # Trazabilidad por tipo de materia resultante
        migrations.AddIndex(
            model_name='pruebaacidez',
            index=models.Index(
                fields=['tipo_materia_resultante', '-fecha_prueba'],
                name='idx_acidez_tipo_fecha'
            ),
        ),

        # =====================================================
        # ÍNDICES PARA PRECIOS DE MATERIA PRIMA
        # =====================================================

        # Precios vigentes por tipo de materia
        migrations.AddIndex(
            model_name='preciomateriaprima',
            index=models.Index(
                fields=['tipo_materia_prima', 'is_vigente', '-fecha_vigencia'],
                name='idx_precio_tipo_vig'
            ),
        ),
    ]
