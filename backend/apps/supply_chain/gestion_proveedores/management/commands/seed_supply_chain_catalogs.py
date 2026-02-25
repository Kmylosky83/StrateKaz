"""
Seed Command: seed_supply_chain_catalogs
Sistema StrateKaz - Catálogos para Supply Chain / Gestión de Proveedores

Crea los catálogos base necesarios para el funcionamiento del módulo:
- Tipos de Documento de Identidad (CC, NIT, CE, etc.)
- Tipos de Proveedor (Materia Prima, Productos/Servicios, etc.)
- Formas de Pago (Contado, Transferencia, Crédito, etc.)
- Tipos de Cuenta Bancaria (Ahorros, Corriente)
- Modalidades Logísticas (Entrega en planta, etc.)
- Departamentos de Colombia (33 departamentos)
- Ciudades principales por departamento

Uso:
    python manage.py seed_supply_chain_catalogs
    python manage.py seed_supply_chain_catalogs --dry-run
    python manage.py seed_supply_chain_catalogs --skip-geo  (omite departamentos y ciudades)

Este comando es idempotente - puede ejecutarse múltiples veces sin duplicar datos.
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
        parser.add_argument(
            '--skip-geo',
            action='store_true',
            help='Omitir departamentos y ciudades'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        skip_geo = options.get('skip_geo', False)

        if dry_run:
            self.stdout.write(self.style.WARNING('=== MODO DRY-RUN ===\n'))

        total_created = 0
        total_updated = 0

        # 1. Tipos de Documento de Identidad
        c, u = self._seed_tipo_documento(dry_run)
        total_created += c
        total_updated += u

        # 2. Tipos de Proveedor
        c, u = self._seed_tipo_proveedor(dry_run)
        total_created += c
        total_updated += u

        # 3. Formas de Pago
        c, u = self._seed_forma_pago(dry_run)
        total_created += c
        total_updated += u

        # 4. Tipos de Cuenta Bancaria
        c, u = self._seed_tipo_cuenta(dry_run)
        total_created += c
        total_updated += u

        # 5. Modalidades Logísticas
        c, u = self._seed_modalidad_logistica(dry_run)
        total_created += c
        total_updated += u

        # 6. Departamentos y Ciudades
        if not skip_geo:
            c, u = self._seed_departamentos(dry_run)
            total_created += c
            total_updated += u

            c, u = self._seed_ciudades(dry_run)
            total_created += c
            total_updated += u
        else:
            self.stdout.write(self.style.WARNING('\n--- Departamentos y ciudades omitidos (--skip-geo) ---'))

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
        from apps.supply_chain.gestion_proveedores.models import TipoDocumentoIdentidad
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
        from apps.supply_chain.gestion_proveedores.models import TipoProveedor
        data = [
            {
                'codigo': 'MATERIA_PRIMA',
                'nombre': 'Proveedor de Materia Prima',
                'descripcion': 'Suministra materias primas para producción',
                'requiere_materia_prima': True,
                'requiere_modalidad_logistica': True,
                'orden': 1,
            },
            {
                'codigo': 'PRODUCTOS_SERVICIOS',
                'nombre': 'Proveedor de Productos y Servicios',
                'descripcion': 'Suministra productos terminados o servicios profesionales',
                'requiere_materia_prima': False,
                'requiere_modalidad_logistica': False,
                'orden': 2,
            },
            {
                'codigo': 'UNIDAD_NEGOCIO',
                'nombre': 'Unidad de Negocio',
                'descripcion': 'Proveedor que es una unidad de negocio propia o filial',
                'requiere_materia_prima': True,
                'requiere_modalidad_logistica': True,
                'orden': 3,
            },
            {
                'codigo': 'TRANSPORTISTA',
                'nombre': 'Transportista',
                'descripcion': 'Proveedor de servicios de transporte y logística',
                'requiere_materia_prima': False,
                'requiere_modalidad_logistica': True,
                'orden': 4,
            },
            {
                'codigo': 'CONSULTOR',
                'nombre': 'Consultor / Asesor',
                'descripcion': 'Proveedor de servicios de consultoría, auditoría o asesoría',
                'requiere_materia_prima': False,
                'requiere_modalidad_logistica': False,
                'orden': 5,
            },
            {
                'codigo': 'CONTRATISTA',
                'nombre': 'Contratista',
                'descripcion': 'Proveedor de obras civiles, mantenimiento u otros contratos',
                'requiere_materia_prima': False,
                'requiere_modalidad_logistica': False,
                'orden': 6,
            },
        ]
        return self._seed_model(TipoProveedor, data, 'Tipos de Proveedor', dry_run)

    def _seed_forma_pago(self, dry_run):
        from apps.supply_chain.gestion_proveedores.models import FormaPago
        data = [
            {'codigo': 'CONTADO', 'nombre': 'Contado', 'descripcion': 'Pago al momento de la entrega', 'orden': 1},
            {'codigo': 'TRANSFERENCIA', 'nombre': 'Transferencia Bancaria', 'descripcion': 'Pago por transferencia electrónica', 'orden': 2},
            {'codigo': 'CHEQUE', 'nombre': 'Cheque', 'descripcion': 'Pago con cheque', 'orden': 3},
            {'codigo': 'CREDITO_15', 'nombre': 'Crédito 15 días', 'descripcion': 'Pago a 15 días', 'orden': 4},
            {'codigo': 'CREDITO_30', 'nombre': 'Crédito 30 días', 'descripcion': 'Pago a 30 días', 'orden': 5},
            {'codigo': 'CREDITO_60', 'nombre': 'Crédito 60 días', 'descripcion': 'Pago a 60 días', 'orden': 6},
            {'codigo': 'CREDITO_90', 'nombre': 'Crédito 90 días', 'descripcion': 'Pago a 90 días', 'orden': 7},
            {'codigo': 'CONSIGNACION', 'nombre': 'Consignación', 'descripcion': 'Pago por consignación bancaria', 'orden': 8},
        ]
        return self._seed_model(FormaPago, data, 'Formas de Pago', dry_run)

    def _seed_tipo_cuenta(self, dry_run):
        from apps.supply_chain.gestion_proveedores.models import TipoCuentaBancaria
        data = [
            {'codigo': 'AHORROS', 'nombre': 'Cuenta de Ahorros', 'orden': 1},
            {'codigo': 'CORRIENTE', 'nombre': 'Cuenta Corriente', 'orden': 2},
        ]
        return self._seed_model(TipoCuentaBancaria, data, 'Tipos de Cuenta Bancaria', dry_run)

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

    def _seed_departamentos(self, dry_run):
        from apps.supply_chain.gestion_proveedores.models import Departamento
        # 33 departamentos de Colombia con códigos DANE
        data = [
            {'codigo': 'AMAZONAS', 'nombre': 'Amazonas', 'codigo_dane': '91', 'orden': 1},
            {'codigo': 'ANTIOQUIA', 'nombre': 'Antioquia', 'codigo_dane': '05', 'orden': 2},
            {'codigo': 'ARAUCA', 'nombre': 'Arauca', 'codigo_dane': '81', 'orden': 3},
            {'codigo': 'ATLANTICO', 'nombre': 'Atlántico', 'codigo_dane': '08', 'orden': 4},
            {'codigo': 'BOGOTA', 'nombre': 'Bogotá D.C.', 'codigo_dane': '11', 'orden': 5},
            {'codigo': 'BOLIVAR', 'nombre': 'Bolívar', 'codigo_dane': '13', 'orden': 6},
            {'codigo': 'BOYACA', 'nombre': 'Boyacá', 'codigo_dane': '15', 'orden': 7},
            {'codigo': 'CALDAS', 'nombre': 'Caldas', 'codigo_dane': '17', 'orden': 8},
            {'codigo': 'CAQUETA', 'nombre': 'Caquetá', 'codigo_dane': '18', 'orden': 9},
            {'codigo': 'CASANARE', 'nombre': 'Casanare', 'codigo_dane': '85', 'orden': 10},
            {'codigo': 'CAUCA', 'nombre': 'Cauca', 'codigo_dane': '19', 'orden': 11},
            {'codigo': 'CESAR', 'nombre': 'Cesar', 'codigo_dane': '20', 'orden': 12},
            {'codigo': 'CHOCO', 'nombre': 'Chocó', 'codigo_dane': '27', 'orden': 13},
            {'codigo': 'CORDOBA', 'nombre': 'Córdoba', 'codigo_dane': '23', 'orden': 14},
            {'codigo': 'CUNDINAMARCA', 'nombre': 'Cundinamarca', 'codigo_dane': '25', 'orden': 15},
            {'codigo': 'GUAINIA', 'nombre': 'Guainía', 'codigo_dane': '94', 'orden': 16},
            {'codigo': 'GUAVIARE', 'nombre': 'Guaviare', 'codigo_dane': '95', 'orden': 17},
            {'codigo': 'HUILA', 'nombre': 'Huila', 'codigo_dane': '41', 'orden': 18},
            {'codigo': 'LA_GUAJIRA', 'nombre': 'La Guajira', 'codigo_dane': '44', 'orden': 19},
            {'codigo': 'MAGDALENA', 'nombre': 'Magdalena', 'codigo_dane': '47', 'orden': 20},
            {'codigo': 'META', 'nombre': 'Meta', 'codigo_dane': '50', 'orden': 21},
            {'codigo': 'NARINO', 'nombre': 'Nariño', 'codigo_dane': '52', 'orden': 22},
            {'codigo': 'NORTE_SANTANDER', 'nombre': 'Norte de Santander', 'codigo_dane': '54', 'orden': 23},
            {'codigo': 'PUTUMAYO', 'nombre': 'Putumayo', 'codigo_dane': '86', 'orden': 24},
            {'codigo': 'QUINDIO', 'nombre': 'Quindío', 'codigo_dane': '63', 'orden': 25},
            {'codigo': 'RISARALDA', 'nombre': 'Risaralda', 'codigo_dane': '66', 'orden': 26},
            {'codigo': 'SAN_ANDRES', 'nombre': 'San Andrés y Providencia', 'codigo_dane': '88', 'orden': 27},
            {'codigo': 'SANTANDER', 'nombre': 'Santander', 'codigo_dane': '68', 'orden': 28},
            {'codigo': 'SUCRE', 'nombre': 'Sucre', 'codigo_dane': '70', 'orden': 29},
            {'codigo': 'TOLIMA', 'nombre': 'Tolima', 'codigo_dane': '73', 'orden': 30},
            {'codigo': 'VALLE_CAUCA', 'nombre': 'Valle del Cauca', 'codigo_dane': '76', 'orden': 31},
            {'codigo': 'VAUPES', 'nombre': 'Vaupés', 'codigo_dane': '97', 'orden': 32},
            {'codigo': 'VICHADA', 'nombre': 'Vichada', 'codigo_dane': '99', 'orden': 33},
        ]
        return self._seed_model(Departamento, data, 'Departamentos de Colombia', dry_run)

    def _seed_ciudades(self, dry_run):
        from apps.supply_chain.gestion_proveedores.models import Ciudad, Departamento

        self.stdout.write('\n--- Ciudades principales ---')
        created = 0
        updated = 0

        # Ciudades principales por departamento (capitales + ciudades relevantes)
        ciudades_data = {
            'AMAZONAS': [('LETICIA', 'Leticia', '91001', True)],
            'ANTIOQUIA': [
                ('MEDELLIN', 'Medellín', '05001', True),
                ('BELLO', 'Bello', '05088', False),
                ('ENVIGADO', 'Envigado', '05266', False),
                ('ITAGUI', 'Itagüí', '05360', False),
                ('RIONEGRO', 'Rionegro', '05615', False),
                ('APARTADO', 'Apartadó', '05045', False),
                ('TURBO', 'Turbo', '05837', False),
                ('CAUCASIA', 'Caucasia', '05154', False),
            ],
            'ARAUCA': [('ARAUCA_CITY', 'Arauca', '81001', True)],
            'ATLANTICO': [
                ('BARRANQUILLA', 'Barranquilla', '08001', True),
                ('SOLEDAD', 'Soledad', '08758', False),
                ('MALAMBO', 'Malambo', '08433', False),
            ],
            'BOGOTA': [('BOGOTA_CITY', 'Bogotá D.C.', '11001', True)],
            'BOLIVAR': [
                ('CARTAGENA', 'Cartagena de Indias', '13001', True),
                ('MAGANGUE', 'Magangué', '13430', False),
            ],
            'BOYACA': [
                ('TUNJA', 'Tunja', '15001', True),
                ('DUITAMA', 'Duitama', '15238', False),
                ('SOGAMOSO', 'Sogamoso', '15759', False),
            ],
            'CALDAS': [
                ('MANIZALES', 'Manizales', '17001', True),
                ('LA_DORADA', 'La Dorada', '17380', False),
            ],
            'CAQUETA': [('FLORENCIA', 'Florencia', '18001', True)],
            'CASANARE': [('YOPAL', 'Yopal', '85001', True)],
            'CAUCA': [
                ('POPAYAN', 'Popayán', '19001', True),
                ('SANTANDER_QUILICHAO', 'Santander de Quilichao', '19698', False),
            ],
            'CESAR': [
                ('VALLEDUPAR', 'Valledupar', '20001', True),
                ('AGUACHICA', 'Aguachica', '20011', False),
            ],
            'CHOCO': [('QUIBDO', 'Quibdó', '27001', True)],
            'CORDOBA': [
                ('MONTERIA', 'Montería', '23001', True),
                ('LORICA', 'Lorica', '23417', False),
                ('CERETE', 'Cereté', '23162', False),
            ],
            'CUNDINAMARCA': [
                ('SOACHA', 'Soacha', '25754', False),
                ('ZIPAQUIRA', 'Zipaquirá', '25899', False),
                ('FACATATIVA', 'Facatativá', '25269', False),
                ('GIRARDOT', 'Girardot', '25307', False),
                ('CHIA', 'Chía', '25175', False),
                ('FUSAGASUGA', 'Fusagasugá', '25290', False),
                ('MOSQUERA', 'Mosquera', '25473', False),
                ('MADRID', 'Madrid', '25430', False),
            ],
            'GUAINIA': [('INIRIDA', 'Inírida', '94001', True)],
            'GUAVIARE': [('SAN_JOSE_GUAVIARE', 'San José del Guaviare', '95001', True)],
            'HUILA': [
                ('NEIVA', 'Neiva', '41001', True),
                ('PITALITO', 'Pitalito', '41551', False),
                ('GARZON', 'Garzón', '41298', False),
            ],
            'LA_GUAJIRA': [
                ('RIOHACHA', 'Riohacha', '44001', True),
                ('MAICAO', 'Maicao', '44430', False),
            ],
            'MAGDALENA': [
                ('SANTA_MARTA', 'Santa Marta', '47001', True),
                ('CIENAGA', 'Ciénaga', '47189', False),
            ],
            'META': [
                ('VILLAVICENCIO', 'Villavicencio', '50001', True),
                ('ACACIAS', 'Acacías', '50006', False),
                ('GRANADA_META', 'Granada', '50313', False),
            ],
            'NARINO': [
                ('PASTO', 'Pasto', '52001', True),
                ('TUMACO', 'Tumaco', '52835', False),
                ('IPIALES', 'Ipiales', '52356', False),
            ],
            'NORTE_SANTANDER': [
                ('CUCUTA', 'Cúcuta', '54001', True),
                ('OCANA', 'Ocaña', '54498', False),
            ],
            'PUTUMAYO': [('MOCOA', 'Mocoa', '86001', True)],
            'QUINDIO': [
                ('ARMENIA', 'Armenia', '63001', True),
                ('CALARCA', 'Calarcá', '63130', False),
            ],
            'RISARALDA': [
                ('PEREIRA', 'Pereira', '66001', True),
                ('DOSQUEBRADAS', 'Dosquebradas', '66170', False),
            ],
            'SAN_ANDRES': [('SAN_ANDRES_CITY', 'San Andrés', '88001', True)],
            'SANTANDER': [
                ('BUCARAMANGA', 'Bucaramanga', '68001', True),
                ('FLORIDABLANCA', 'Floridablanca', '68276', False),
                ('GIRON', 'Girón', '68307', False),
                ('PIEDECUESTA', 'Piedecuesta', '68547', False),
                ('BARRANCABERMEJA', 'Barrancabermeja', '68081', False),
            ],
            'SUCRE': [
                ('SINCELEJO', 'Sincelejo', '70001', True),
                ('COROZAL', 'Corozal', '70215', False),
            ],
            'TOLIMA': [
                ('IBAGUE', 'Ibagué', '73001', True),
                ('ESPINAL', 'Espinal', '73268', False),
            ],
            'VALLE_CAUCA': [
                ('CALI', 'Cali', '76001', True),
                ('BUENAVENTURA', 'Buenaventura', '76109', False),
                ('PALMIRA', 'Palmira', '76520', False),
                ('TULUA', 'Tuluá', '76834', False),
                ('BUGA', 'Buga', '76111', False),
                ('CARTAGO', 'Cartago', '76147', False),
                ('YUMBO', 'Yumbo', '76892', False),
                ('JAMUNDI', 'Jamundí', '76364', False),
            ],
            'VAUPES': [('MITU', 'Mitú', '97001', True)],
            'VICHADA': [('PUERTO_CARRENO', 'Puerto Carreño', '99001', True)],
        }

        orden_global = 0
        for depto_codigo, ciudades in ciudades_data.items():
            try:
                depto = Departamento.objects.get(codigo=depto_codigo)
            except Departamento.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f'   [!] Departamento {depto_codigo} no encontrado, omitiendo ciudades'
                ))
                continue

            for ciudad_codigo, nombre, dane, es_capital in ciudades:
                orden_global += 1
                defaults = {
                    'departamento': depto,
                    'nombre': nombre,
                    'codigo_dane': dane,
                    'es_capital': es_capital,
                    'orden': orden_global,
                    'is_active': True,
                }
                if not dry_run:
                    _, was_created = Ciudad.objects.update_or_create(
                        codigo=ciudad_codigo,
                        defaults=defaults
                    )
                    if was_created:
                        created += 1
                    else:
                        updated += 1
                else:
                    exists = Ciudad.objects.filter(codigo=ciudad_codigo).exists()
                    if exists:
                        updated += 1
                    else:
                        created += 1

        self.stdout.write(self.style.SUCCESS(f'   Creados: {created} | Actualizados: {updated}'))
        return created, updated
