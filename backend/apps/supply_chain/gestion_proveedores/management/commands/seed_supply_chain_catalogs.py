"""
Seed Command: seed_supply_chain_catalogs
Sistema StrateKaz - Catálogos ESTRUCTURALES UNIVERSALES para Supply Chain.

Doctrina: este seed SOLO contiene data aplicable a cualquier industria
(B2B genérico colombiano). Data específica de industria (tipos de
materia prima concretos tipo "Sebo Bovino", "Aceite Vegetal", etc.)
NO va aquí — va en seeds dedicados por industria o en data demo.

Contenido universal:
- Tipos de Documento de Identidad (CC, NIT, CE, etc.)
- Tipos de Proveedor (Materia Prima, Productos/Servicios, etc.)
- Modalidades Logísticas (Entrega en planta, etc.)
- Tipos de Almacén (bodega, silo, tanque, etc.)

NO incluido (migrado o fuera de scope):
- **Departamentos y Ciudades**: ahora en `seed_geografia_colombia` (Core C0)
  con el catálogo DIVIPOLA completo (33 deptos + 1,104 municipios).
  Se eliminó de este seed el 2026-04-22 para evitar duplicación.
- Categorías de Materia Prima — depende de industria.
- Tipos de Materia Prima concretos — depende de industria.

Uso:
    python manage.py seed_supply_chain_catalogs
    python manage.py seed_supply_chain_catalogs --dry-run

Para cargar data demo de industria rendering/agroindustria en tenant_demo:
    python manage.py seed_supply_chain_demo_data

Este comando es idempotente - puede ejecutarse múltiples veces sin duplicar.
"""
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Crea catálogos base para Supply Chain (tipos proveedor, documentos, departamentos, etc.)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra lo que se haría sin ejecutar cambios'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)

        if dry_run:
            self.stdout.write(self.style.WARNING('=== MODO DRY-RUN ===\n'))

        total_created = 0
        total_updated = 0

        # 1. Tipos de Documento de Identidad
        c, u = self._seed_tipo_documento(dry_run)
        total_created += c
        total_updated += u

        # 2. Tipos de Proveedor (vive en catalogo_productos desde 2026-04-21)
        c, u = self._seed_tipo_proveedor(dry_run)
        total_created += c
        total_updated += u

        # 3. Modalidades Logísticas (se queda en SC)
        c, u = self._seed_modalidad_logistica(dry_run)
        total_created += c
        total_updated += u

        # 4. Tipos de Almacén (universal — tipos físicos de almacenamiento)
        c, u = self._seed_tipo_almacen(dry_run)
        total_created += c
        total_updated += u

        # NOTA (2026-04-22): Departamentos y Ciudades migrados a
        # seed_geografia_colombia (Core C0). Este seed ya no los puebla.
        # NOTA: CategoriaMateriaPrima y TipoMateriaPrima NO se siembran aquí.
        # Son específicos de industria (ver seed_supply_chain_demo_data).

        # Resumen
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'=== RESUMEN: {total_created} creados, {total_updated} actualizados ==='
        ))

    def _seed_model(self, model_class, data_list, label, dry_run):
        """Helper genérico para seed de catálogos."""
        self.stdout.write(f'\n--- {label} ---')
        created = 0
        updated = 0

        for item in data_list:
            codigo = item.pop('codigo')
            if not dry_run:
                obj, was_created = model_class.objects.update_or_create(
                    codigo=codigo,
                    defaults=item
                )
                if was_created:
                    created += 1
                else:
                    updated += 1
            else:
                exists = model_class.objects.filter(codigo=codigo).exists()
                if exists:
                    updated += 1
                else:
                    created += 1
            # Re-add codigo for logging
            item['codigo'] = codigo

        self.stdout.write(self.style.SUCCESS(f'   Creados: {created} | Actualizados: {updated}'))
        return created, updated

    def _seed_tipo_documento(self, dry_run):
        from apps.core.models import TipoDocumentoIdentidad
        data = [
            {'codigo': 'CC', 'nombre': 'Cédula de Ciudadanía', 'orden': 1},
            {'codigo': 'NIT', 'nombre': 'NIT', 'orden': 2},
            {'codigo': 'CE', 'nombre': 'Cédula de Extranjería', 'orden': 3},
            {'codigo': 'PA', 'nombre': 'Pasaporte', 'orden': 4},
            {'codigo': 'TI', 'nombre': 'Tarjeta de Identidad', 'orden': 5},
            {'codigo': 'PEP', 'nombre': 'Permiso Especial de Permanencia', 'orden': 6},
            {'codigo': 'PPT', 'nombre': 'Permiso por Protección Temporal', 'orden': 7},
            {'codigo': 'RC', 'nombre': 'Registro Civil', 'orden': 8},
            {'codigo': 'NUIP', 'nombre': 'NUIP', 'orden': 9},
        ]
        return self._seed_model(TipoDocumentoIdentidad, data, 'Tipos de Documento de Identidad', dry_run)

    def _seed_tipo_proveedor(self, dry_run):
        from apps.catalogo_productos.models import TipoProveedor
        data = [
            {
                'codigo': 'MATERIA_PRIMA',
                'nombre': 'Proveedor de Materia Prima',
                'descripcion': 'Suministra materias primas para producción',
                'requiere_materia_prima': True,
                'requiere_modalidad_logistica': True,
                'tipos_productos_permitidos': ['MATERIA_PRIMA'],
                'orden': 1,
            },
            {
                'codigo': 'PRODUCTOS_SERVICIOS',
                'nombre': 'Proveedor de Productos y Servicios',
                'descripcion': 'Suministra productos terminados o servicios profesionales',
                'requiere_materia_prima': False,
                'requiere_modalidad_logistica': False,
                'tipos_productos_permitidos': ['PRODUCTO_TERMINADO', 'INSUMO', 'SERVICIO'],
                'orden': 2,
            },
            {
                'codigo': 'UNIDAD_NEGOCIO',
                'nombre': 'Unidad de Negocio',
                'descripcion': 'Proveedor que es una unidad de negocio propia o filial',
                'requiere_materia_prima': True,
                'requiere_modalidad_logistica': True,
                'tipos_productos_permitidos': ['MATERIA_PRIMA', 'PRODUCTO_TERMINADO'],
                'orden': 3,
            },
            {
                'codigo': 'TRANSPORTISTA',
                'nombre': 'Transportista',
                'descripcion': 'Proveedor de servicios de transporte y logística',
                'requiere_materia_prima': False,
                'requiere_modalidad_logistica': True,
                'tipos_productos_permitidos': ['SERVICIO'],
                'orden': 4,
            },
            {
                'codigo': 'CONSULTOR',
                'nombre': 'Consultor / Asesor',
                'descripcion': 'Proveedor de servicios de consultoría, auditoría o asesoría',
                'requiere_materia_prima': False,
                'requiere_modalidad_logistica': False,
                'tipos_productos_permitidos': ['SERVICIO'],
                'orden': 5,
            },
            {
                'codigo': 'CONTRATISTA',
                'nombre': 'Contratista',
                'descripcion': 'Proveedor de obras civiles, mantenimiento u otros contratos',
                'requiere_materia_prima': False,
                'requiere_modalidad_logistica': False,
                'tipos_productos_permitidos': ['SERVICIO'],
                'orden': 6,
            },
        ]
        return self._seed_model(TipoProveedor, data, 'Tipos de Proveedor', dry_run)

    # FormaPago y TipoCuentaBancaria eliminados (refactor 2026-04-21).
    # Cuando Admin/Compras entre a LIVE re-implementarán estos catálogos.

    def _seed_tipo_almacen(self, dry_run):
        from apps.supply_chain.catalogos.models import TipoAlmacen
        data = [
            {'codigo': 'BODEGA', 'nombre': 'Bodega', 'descripcion': 'Bodega cerrada de uso general', 'icono': 'Warehouse', 'orden': 1},
            {'codigo': 'TANQUE', 'nombre': 'Tanque', 'descripcion': 'Tanque para almacenamiento de líquidos', 'icono': 'Cylinder', 'orden': 2},
            {'codigo': 'SILO', 'nombre': 'Silo', 'descripcion': 'Silo para material a granel', 'icono': 'Container', 'orden': 3},
            {'codigo': 'PATIO', 'nombre': 'Patio de Acopio', 'descripcion': 'Área al aire libre para acopio', 'icono': 'Square', 'orden': 4},
            {'codigo': 'CONTENEDOR', 'nombre': 'Contenedor', 'descripcion': 'Contenedor cerrado trasladable', 'icono': 'Box', 'orden': 5},
            {'codigo': 'CUARTO_FRIO', 'nombre': 'Cuarto Frío', 'descripcion': 'Cuarto frío para productos perecederos (refrigeración/congelación)', 'icono': 'Snowflake', 'orden': 6},
            {'codigo': 'PALLET', 'nombre': 'Pallet', 'descripcion': 'Ubicación tipo pallet/estiba para producto paletizado', 'icono': 'Package', 'orden': 7},
        ]
        return self._seed_model(TipoAlmacen, data, 'Tipos de Almacén', dry_run)

    def _seed_modalidad_logistica(self, dry_run):
        from apps.supply_chain.gestion_proveedores.models import ModalidadLogistica
        data = [
            {'codigo': 'ENTREGA_PLANTA', 'nombre': 'Entrega en Planta', 'descripcion': 'El proveedor entrega en las instalaciones de la empresa', 'orden': 1},
            {'codigo': 'COMPRA_PUNTO', 'nombre': 'Compra en Punto', 'descripcion': 'La empresa recoge en el punto del proveedor', 'orden': 2},
            {'codigo': 'TRANSPORTE_PROPIO', 'nombre': 'Transporte Propio', 'descripcion': 'Transporte con vehículos propios de la empresa', 'orden': 3},
            {'codigo': 'TRANSPORTE_TERCERO', 'nombre': 'Transporte Tercero', 'descripcion': 'Transporte mediante transportista contratado', 'orden': 4},
            {'codigo': 'ENVIO_NACIONAL', 'nombre': 'Envío Nacional', 'descripcion': 'Despacho por empresa de mensajería o carga', 'orden': 5},
        ]
        return self._seed_model(ModalidadLogistica, data, 'Modalidades Logísticas', dry_run)
