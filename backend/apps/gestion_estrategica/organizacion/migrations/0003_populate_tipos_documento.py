# Data migration to populate initial TipoDocumento records
from django.db import migrations


def create_tipos_documento(apps, schema_editor):
    """Crea los tipos de documento iniciales del sistema."""
    TipoDocumento = apps.get_model('organizacion', 'TipoDocumento')

    tipos = [
        # --- Operacionales ---
        {'code': 'RECOLECCION', 'name': 'Recolección / Voucher', 'category': 'OPERACIONAL', 'is_system': True, 'order': 1},
        {'code': 'RECEPCION', 'name': 'Recepción de Materia Prima', 'category': 'OPERACIONAL', 'is_system': True, 'order': 2},
        {'code': 'LOTE', 'name': 'Lote de Producción', 'category': 'OPERACIONAL', 'is_system': True, 'order': 3},
        {'code': 'DESPACHO', 'name': 'Despacho', 'category': 'OPERACIONAL', 'is_system': True, 'order': 4},
        {'code': 'FACTURA', 'name': 'Factura', 'category': 'OPERACIONAL', 'is_system': True, 'order': 5},
        {'code': 'ORDEN_COMPRA', 'name': 'Orden de Compra', 'category': 'OPERACIONAL', 'is_system': True, 'order': 6},
        {'code': 'REQUISICION', 'name': 'Requisición', 'category': 'OPERACIONAL', 'is_system': True, 'order': 7},
        {'code': 'REMISION', 'name': 'Remisión', 'category': 'OPERACIONAL', 'is_system': True, 'order': 8},
        {'code': 'COTIZACION', 'name': 'Cotización', 'category': 'OPERACIONAL', 'is_system': True, 'order': 9},
        {'code': 'ORDEN_TRABAJO', 'name': 'Orden de Trabajo', 'category': 'OPERACIONAL', 'is_system': True, 'order': 10},
        {'code': 'ACTA_COMITE', 'name': 'Acta de Comité', 'category': 'OPERACIONAL', 'is_system': True, 'order': 11},

        # --- Sistema de Gestión (Normativos) ---
        {'code': 'PROCEDIMIENTO', 'name': 'Procedimiento', 'category': 'NORMATIVO', 'is_system': True, 'order': 1},
        {'code': 'INSTRUCTIVO', 'name': 'Instructivo', 'category': 'NORMATIVO', 'is_system': True, 'order': 2},
        {'code': 'FORMATO', 'name': 'Formato', 'category': 'NORMATIVO', 'is_system': True, 'order': 3},
        {'code': 'PROTOCOLO', 'name': 'Protocolo', 'category': 'NORMATIVO', 'is_system': True, 'order': 4},
        {'code': 'MANUAL', 'name': 'Manual', 'category': 'NORMATIVO', 'is_system': True, 'order': 5},
        {'code': 'PROGRAMA', 'name': 'Programa', 'category': 'NORMATIVO', 'is_system': True, 'order': 6},
        {'code': 'PLAN', 'name': 'Plan', 'category': 'NORMATIVO', 'is_system': True, 'order': 7},

        # --- Calidad y SST ---
        {'code': 'NO_CONFORMIDAD', 'name': 'No Conformidad', 'category': 'CALIDAD_SST', 'is_system': True, 'order': 1},
        {'code': 'ACCION_CORRECTIVA', 'name': 'Acción Correctiva', 'category': 'CALIDAD_SST', 'is_system': True, 'order': 2},
        {'code': 'ACCION_PREVENTIVA', 'name': 'Acción Preventiva', 'category': 'CALIDAD_SST', 'is_system': True, 'order': 3},
        {'code': 'ACCION_MEJORA', 'name': 'Acción de Mejora', 'category': 'CALIDAD_SST', 'is_system': True, 'order': 4},
        {'code': 'INCIDENTE', 'name': 'Reporte de Incidente', 'category': 'CALIDAD_SST', 'is_system': True, 'order': 5},
        {'code': 'ACCIDENTE', 'name': 'Reporte de Accidente', 'category': 'CALIDAD_SST', 'is_system': True, 'order': 6},
        {'code': 'INVESTIGACION', 'name': 'Investigación', 'category': 'CALIDAD_SST', 'is_system': True, 'order': 7},
        {'code': 'AUDITORIA', 'name': 'Auditoría', 'category': 'CALIDAD_SST', 'is_system': True, 'order': 8},
        {'code': 'CAPACITACION', 'name': 'Capacitación', 'category': 'CALIDAD_SST', 'is_system': True, 'order': 9},

        # --- Datos Maestros ---
        {'code': 'PROVEEDOR_MP', 'name': 'Código Proveedor Materia Prima', 'category': 'MAESTRO', 'is_system': True, 'order': 1},
        {'code': 'PROVEEDOR_PS', 'name': 'Código Proveedor Productos/Servicios', 'category': 'MAESTRO', 'is_system': True, 'order': 2},
        {'code': 'CLIENTE', 'name': 'Código Cliente', 'category': 'MAESTRO', 'is_system': True, 'order': 3},
        {'code': 'ECOALIADO', 'name': 'Código Ecoaliado', 'category': 'MAESTRO', 'is_system': True, 'order': 4},

        # --- Pruebas/Análisis ---
        {'code': 'PRUEBA_ACIDEZ', 'name': 'Prueba de Acidez', 'category': 'ANALISIS', 'is_system': True, 'order': 1},
        {'code': 'ANALISIS_CALIDAD', 'name': 'Análisis de Calidad', 'category': 'ANALISIS', 'is_system': True, 'order': 2},
    ]

    for tipo in tipos:
        TipoDocumento.objects.get_or_create(
            code=tipo['code'],
            defaults={
                'name': tipo['name'],
                'category': tipo['category'],
                'is_system': tipo['is_system'],
                'is_active': True,
                'order': tipo['order'],
            }
        )


def reverse_tipos_documento(apps, schema_editor):
    """Elimina los tipos de documento del sistema (solo para rollback)."""
    TipoDocumento = apps.get_model('organizacion', 'TipoDocumento')
    TipoDocumento.objects.filter(is_system=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('organizacion', '0002_tipodocumento_consecutivoconfig'),
    ]

    operations = [
        migrations.RunPython(create_tipos_documento, reverse_tipos_documento),
    ]
