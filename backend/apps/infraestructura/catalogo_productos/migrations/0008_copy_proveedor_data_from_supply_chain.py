"""
Data migration: copia los datos de `supply_chain.gestion_proveedores` a
`catalogo_productos` (refactor Proveedor a CT, 2026-04-21).

Copia:
  - `supply_chain_tipo_proveedor` → `catalogo_productos_tipo_proveedor` (PKs preservados)
  - `supply_chain_proveedor` → `catalogo_productos_proveedor` (PKs preservados)
  - M2M `productos_suministrados` (mismo set de IDs)

Mapeo semántico:
  - `tipo_entidad` (materia_prima/servicio/unidad_interna) se ABANDONA.
  - `tipo_persona` se INFIERE del código de `TipoDocumentoIdentidad`:
    * CC  → 'natural'
    * NIT → 'empresa'
    * otro → 'con_cedula'

Campos que NO se copian (refactor de limpieza total):
  - banco, tipo_cuenta_id, numero_cuenta, titular_cuenta (bancario → Admin/Compras)
  - formas_pago M2M (→ Admin/Compras)
  - dias_plazo_pago (→ Admin/Compras)
  - es_independiente, observaciones, unidad_negocio_*, tipo_entidad
  - modalidad_logistica_id (ahora se asigna en el flujo de precio SC, no en proveedor)

Preservar PKs es crítico: las FKs que apuntan a Proveedor en otras tablas
(VoucherRecepcion, Cotizacion, OrdenCompra, Contrato, PrecioMateriaPrima,
HistorialPrecioProveedor) serán repuntadas en la siguiente migración del
app de cada FK — el PK sigue siendo el mismo tras la copia.
"""
from django.db import migrations


def infer_tipo_persona(tipo_documento):
    """Infiere tipo_persona desde el código del tipo de documento.

    Solo 2 valores posibles post 2026-04-21: 'natural' | 'empresa'.
    """
    if tipo_documento is None:
        return 'empresa'
    codigo = (getattr(tipo_documento, 'codigo', '') or '').upper()
    if codigo == 'NIT':
        return 'empresa'
    # CC, CE, PA, TI, PEP, PPT, RC, NUIP → persona natural
    return 'natural'


def copy_proveedor_data(apps, schema_editor):
    """Copia datos de supply_chain → catalogo_productos (preserva PKs)."""
    ScProveedor = apps.get_model('gestion_proveedores', 'Proveedor')
    ScTipoProveedor = apps.get_model('gestion_proveedores', 'TipoProveedor')
    CtProveedor = apps.get_model('infra_catalogo_productos', 'Proveedor')
    CtTipoProveedor = apps.get_model('infra_catalogo_productos', 'TipoProveedor')
    TipoDocumento = apps.get_model('core', 'TipoDocumentoIdentidad')

    # 1. TipoProveedor — copia 1:1 preservando PKs
    for sc_tp in ScTipoProveedor.objects.all():
        CtTipoProveedor.objects.update_or_create(
            pk=sc_tp.pk,
            defaults={
                'codigo': sc_tp.codigo,
                'nombre': sc_tp.nombre,
                'descripcion': sc_tp.descripcion,
                'requiere_materia_prima': sc_tp.requiere_materia_prima,
                'requiere_modalidad_logistica': sc_tp.requiere_modalidad_logistica,
                'orden': sc_tp.orden,
                'is_active': sc_tp.is_active,
                'created_at': sc_tp.created_at,
                'updated_at': sc_tp.updated_at,
            },
        )

    # 2. Proveedor — incluye soft-deleted (iteramos con _default_manager que en
    #    historical models no aplica custom manager, así trae todo).
    for sc_prov in ScProveedor.objects.all():
        tipo_doc = None
        if sc_prov.tipo_documento_id:
            tipo_doc = TipoDocumento.objects.filter(pk=sc_prov.tipo_documento_id).first()

        ct_prov, _ = CtProveedor.objects.update_or_create(
            pk=sc_prov.pk,
            defaults={
                'codigo_interno': sc_prov.codigo_interno,
                'tipo_persona': infer_tipo_persona(tipo_doc),
                'tipo_proveedor_id': sc_prov.tipo_proveedor_id,
                'razon_social': sc_prov.razon_social,
                'nombre_comercial': sc_prov.nombre_comercial,
                'tipo_documento_id': sc_prov.tipo_documento_id,
                'numero_documento': sc_prov.numero_documento,
                'nit': sc_prov.nit,
                'telefono': sc_prov.telefono,
                'email': sc_prov.email,
                'ciudad': sc_prov.ciudad,
                'departamento_id': sc_prov.departamento_id,
                'direccion': sc_prov.direccion,
                'parte_interesada_id': sc_prov.parte_interesada_id,
                'parte_interesada_nombre': sc_prov.parte_interesada_nombre or '',
                'is_active': sc_prov.is_active,
                # TenantModel — preservar soft-delete + audit + timestamps
                'is_deleted': sc_prov.is_deleted,
                'deleted_at': sc_prov.deleted_at,
                'deleted_by_id': sc_prov.deleted_by_id,
                'created_by_id': sc_prov.created_by_id,
                'updated_by_id': sc_prov.updated_by_id,
                'created_at': sc_prov.created_at,
                'updated_at': sc_prov.updated_at,
            },
        )

        # M2M productos_suministrados (misma FK a catalogo_productos.Producto)
        productos_ids = list(
            sc_prov.productos_suministrados.values_list('pk', flat=True)
        )
        ct_prov.productos_suministrados.set(productos_ids)


def unapply_copy(apps, schema_editor):
    """Rollback: trunca las tablas nuevas. Irreversible en datos reales."""
    CtProveedor = apps.get_model('infra_catalogo_productos', 'Proveedor')
    CtTipoProveedor = apps.get_model('infra_catalogo_productos', 'TipoProveedor')
    CtProveedor.objects.all().delete()
    CtTipoProveedor.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('infra_catalogo_productos', '0007_tipoproveedor_proveedor_and_more'),
        ('gestion_proveedores', '0005_precio_producto_not_null'),
        ('core', '0011_add_orden_to_cargo'),
    ]

    operations = [
        migrations.RunPython(copy_proveedor_data, reverse_code=unapply_copy),
    ]
