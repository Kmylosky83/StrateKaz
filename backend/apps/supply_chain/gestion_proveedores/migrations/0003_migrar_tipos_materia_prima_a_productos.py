"""
Data migration: unificar TipoMateriaPrima + CategoriaMateriaPrima en el
canonico catalogo_productos.Producto + CategoriaProducto.

Doctrina (CLAUDE.md + decision Camilo S7): supply_chain NO debe tener
su propio catalogo de productos. catalogo_productos es source-of-truth
unico. Proveedor.productos_suministrados reemplaza Proveedor.tipos_materia_prima.

Estrategia (por-tenant):
  1. Para cada CategoriaMateriaPrima, crear CategoriaProducto equivalente
     (match por nombre case-insensitive; enriquecer si ya existe).
     Construir mapping {cat_mp_id: cat_prod_id}.
  2. Para cada TipoMateriaPrima, crear Producto (tipo='MATERIA_PRIMA')
     equivalente (match por nombre case-insensitive; enriquecer si existe).
     Construir mapping {tipo_mp_id: producto_id}. Asignar categoria del
     mapping anterior. Usar UnidadMedida 'Kilogramo' por default si no
     hay otra indicada.
  3. Para cada Proveedor, poblar productos_suministrados M2M usando el
     mapping a partir de tipos_materia_prima (M2M legacy).
  4. Para cada PrecioMateriaPrima, poblar FK `producto` desde `tipo_materia`.
  5. Para cada HistorialPrecioProveedor, poblar FK `producto` desde
     `tipo_materia`.

Reversible: no-op. Restaurar via backup si necesario.

Nota: el RemoveField/RemoveModel del legacy viene en migracion posterior
(0004) una vez el codigo FE/BE use solo el canonico.
"""
from django.db import migrations


def migrar_tipos_a_productos(apps, schema_editor):
    # Modelos legacy (solo presentes en schemas tenant)
    try:
        CategoriaMateriaPrima = apps.get_model('gestion_proveedores', 'CategoriaMateriaPrima')
        TipoMateriaPrima = apps.get_model('gestion_proveedores', 'TipoMateriaPrima')
        Proveedor = apps.get_model('gestion_proveedores', 'Proveedor')
        PrecioMP = apps.get_model('gestion_proveedores', 'PrecioMateriaPrima')
        HistorialPrecio = apps.get_model('gestion_proveedores', 'HistorialPrecioProveedor')
    except LookupError:
        # Schema sin gestion_proveedores (public) — nada que migrar
        return

    # Modelos canonicos
    CategoriaProducto = apps.get_model('infra_catalogo_productos', 'CategoriaProducto')
    Producto = apps.get_model('infra_catalogo_productos', 'Producto')
    UnidadMedida = apps.get_model('infra_catalogo_productos', 'UnidadMedida')

    # Unidad default para productos migrados (kg es estandar para MP)
    unidad_default = UnidadMedida.objects.filter(
        nombre__iexact='Kilogramo', is_deleted=False,
    ).first()
    if not unidad_default:
        unidad_default = UnidadMedida.objects.filter(is_deleted=False).first()
    if not unidad_default:
        # Schema sin unidades — saltar migracion
        return

    # -------------------------------------------------------------
    # Paso 1: Migrar Categorias
    # -------------------------------------------------------------
    cat_mapping = {}  # cat_mp_id -> cat_prod_id
    for cat_mp in CategoriaMateriaPrima.objects.all():
        existing = CategoriaProducto.objects.filter(
            nombre__iexact=cat_mp.nombre,
            is_deleted=False,
        ).first()
        if existing:
            if not existing.descripcion and cat_mp.descripcion:
                existing.descripcion = cat_mp.descripcion
                existing.save(update_fields=['descripcion', 'updated_at'])
            cat_mapping[cat_mp.id] = existing.id
        else:
            new_cat = CategoriaProducto.objects.create(
                nombre=cat_mp.nombre,
                descripcion=cat_mp.descripcion or '',
                codigo=cat_mp.codigo or '',
                orden=cat_mp.orden or 0,
                is_system=False,
            )
            cat_mapping[cat_mp.id] = new_cat.id

    # -------------------------------------------------------------
    # Paso 2: Migrar Tipos -> Productos (tipo=MATERIA_PRIMA)
    # -------------------------------------------------------------
    tipo_mapping = {}  # tipo_mp_id -> producto_id
    for tipo_mp in TipoMateriaPrima.objects.all():
        existing = Producto.objects.filter(
            nombre__iexact=tipo_mp.nombre,
            is_deleted=False,
        ).first()
        if existing:
            # Enriquecer campos vacios
            changed = False
            if not existing.descripcion and tipo_mp.descripcion:
                existing.descripcion = tipo_mp.descripcion
                changed = True
            if existing.tipo != 'MATERIA_PRIMA':
                existing.tipo = 'MATERIA_PRIMA'
                changed = True
            if changed:
                existing.save(update_fields=['descripcion', 'tipo', 'updated_at'])
            tipo_mapping[tipo_mp.id] = existing.id
        else:
            categoria_id = cat_mapping.get(tipo_mp.categoria_id)
            # Usar el codigo del legacy como codigo del producto (son unicos).
            # En migracion historical el save() override no genera codigo
            # auto, asi que hay que pasarlo explicito.
            codigo_producto = tipo_mp.codigo or f'MP-LEG-{tipo_mp.id}'
            # Garantizar unicidad si ya existe (improbable pero defensivo)
            if Producto.objects.filter(codigo=codigo_producto).exists():
                codigo_producto = f'{codigo_producto}-{tipo_mp.id}'
            new_prod = Producto.objects.create(
                codigo=codigo_producto,
                nombre=tipo_mp.nombre,
                descripcion=tipo_mp.descripcion or '',
                categoria_id=categoria_id,
                unidad_medida=unidad_default,
                tipo='MATERIA_PRIMA',
                notas=(
                    f'Migrado desde TipoMateriaPrima legacy (codigo: {tipo_mp.codigo}). '
                    f'Acidez: [{tipo_mp.acidez_min or "-"}, {tipo_mp.acidez_max or "-"}]'
                    if (tipo_mp.acidez_min or tipo_mp.acidez_max)
                    else f'Migrado desde TipoMateriaPrima legacy (codigo: {tipo_mp.codigo}).'
                ),
            )
            tipo_mapping[tipo_mp.id] = new_prod.id

    # -------------------------------------------------------------
    # Paso 3: Poblar Proveedor.productos_suministrados M2M
    # -------------------------------------------------------------
    for proveedor in Proveedor.objects.prefetch_related('tipos_materia_prima').all():
        old_tipos = list(proveedor.tipos_materia_prima.values_list('id', flat=True))
        if not old_tipos:
            continue
        producto_ids = [
            tipo_mapping[old_id]
            for old_id in old_tipos
            if old_id in tipo_mapping
        ]
        if producto_ids:
            proveedor.productos_suministrados.add(*producto_ids)

    # -------------------------------------------------------------
    # Paso 4: Poblar PrecioMateriaPrima.producto
    # -------------------------------------------------------------
    for precio in PrecioMP.objects.filter(tipo_materia__isnull=False, producto__isnull=True):
        producto_id = tipo_mapping.get(precio.tipo_materia_id)
        if producto_id:
            precio.producto_id = producto_id
            precio.save(update_fields=['producto', 'updated_at'])

    # -------------------------------------------------------------
    # Paso 5: Poblar HistorialPrecioProveedor.producto
    # -------------------------------------------------------------
    for hist in HistorialPrecio.objects.filter(tipo_materia__isnull=False, producto__isnull=True):
        producto_id = tipo_mapping.get(hist.tipo_materia_id)
        if producto_id:
            hist.producto_id = producto_id
            hist.save(update_fields=['producto', 'updated_at'])


def noop(apps, schema_editor):
    """Reverse: no-op. Restaurar via backup si necesario."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('gestion_proveedores', '0002_proveedor_productos_suministrados_and_more'),
        ('infra_catalogo_productos', '0006_migrar_unidades_desde_legacy'),
    ]

    operations = [
        migrations.RunPython(migrar_tipos_a_productos, reverse_code=noop),
    ]
