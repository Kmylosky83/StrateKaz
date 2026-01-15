"""
Seed de configuracion dinamica para Identidad Corporativa

Pobla las tablas de configuracion con los valores por defecto
que anteriormente estaban hardcodeados como CHOICES.

Uso:
    python manage.py seed_config_identidad
    python manage.py seed_config_identidad --force  # Sobrescribe existentes
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.gestion_estrategica.identidad.models_config import (
    EstadoPolitica,
    TipoPolitica,
    RolFirmante,
    EstadoFirma,
)
from apps.gestion_estrategica.identidad.models_workflow_firmas import ConfiguracionFlujoFirma


class Command(BaseCommand):
    help = 'Pobla la configuración dinámica de Identidad Corporativa'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Sobrescribe registros existentes',
        )

    def handle(self, *args, **options):
        force = options['force']

        with transaction.atomic():
            self._seed_estados_politica(force)
            self._seed_tipos_politica(force)
            self._seed_roles_firmante(force)
            self._seed_estados_firma(force)
            self._seed_flujos_firma(force)

        self.stdout.write(self.style.SUCCESS(
            'Configuracion de Identidad Corporativa poblada exitosamente'
        ))

    def _seed_estados_politica(self, force: bool):
        """Pobla estados de política."""
        estados = [
            {
                'code': 'BORRADOR',
                'label': 'Borrador',
                'description': 'Política en edición, no visible para usuarios',
                'color': 'gray',
                'bg_color': 'bg-gray-100',
                'icon': 'FileEdit',
                'es_editable': True,
                'es_estado_inicial': True,
                'es_estado_final': False,
                'permite_firma': True,
                'requiere_firma_completa': False,
                'transiciones_permitidas': ['EN_REVISION', 'OBSOLETO'],
                'orden': 1,
            },
            {
                'code': 'EN_REVISION',
                'label': 'En Revision',
                'description': 'En proceso de revision tecnica por el cargo revisor',
                'color': 'yellow',
                'bg_color': 'bg-yellow-100',
                'icon': 'Eye',
                'es_editable': False,
                'es_estado_inicial': False,
                'es_estado_final': False,
                'permite_firma': True,
                'requiere_firma_completa': False,
                'transiciones_permitidas': ['EN_APROBACION', 'RECHAZADO', 'BORRADOR'],
                'orden': 2,
            },
            {
                'code': 'EN_APROBACION',
                'label': 'En Aprobacion',
                'description': 'Revisada, pendiente de aprobacion final por el cargo aprobador',
                'color': 'amber',
                'bg_color': 'bg-amber-100',
                'icon': 'ClipboardCheck',
                'es_editable': False,
                'es_estado_inicial': False,
                'es_estado_final': False,
                'permite_firma': True,
                'requiere_firma_completa': False,
                'transiciones_permitidas': ['POR_CODIFICAR', 'RECHAZADO', 'BORRADOR'],
                'orden': 3,
            },
            {
                'code': 'POR_CODIFICAR',
                'label': 'Por Codificar',
                'description': 'Aprobada, pendiente de codificacion y publicacion en Gestor Documental',
                'color': 'purple',
                'bg_color': 'bg-purple-100',
                'icon': 'FileCode',
                'es_editable': False,
                'es_estado_inicial': False,
                'es_estado_final': False,
                'permite_firma': False,
                'requiere_firma_completa': False,
                'transiciones_permitidas': ['VIGENTE'],
                'orden': 4,
            },
            {
                'code': 'VIGENTE',
                'label': 'Vigente',
                'description': 'Politica activa y publicada en el Gestor Documental',
                'color': 'green',
                'bg_color': 'bg-green-100',
                'icon': 'CheckCircle',
                'es_editable': False,
                'es_estado_inicial': False,
                'es_estado_final': True,
                'permite_firma': False,
                'requiere_firma_completa': False,
                'transiciones_permitidas': ['OBSOLETO'],
                'orden': 5,
            },
            {
                'code': 'OBSOLETO',
                'label': 'Obsoleto',
                'description': 'Politica reemplazada por una version mas reciente',
                'color': 'slate',
                'bg_color': 'bg-slate-100',
                'icon': 'Archive',
                'es_editable': False,
                'es_estado_inicial': False,
                'es_estado_final': True,
                'permite_firma': False,
                'requiere_firma_completa': False,
                'transiciones_permitidas': [],
                'orden': 6,
            },
            {
                'code': 'RECHAZADO',
                'label': 'Rechazado',
                'description': 'Politica rechazada en revision o aprobacion, requiere correcciones',
                'color': 'red',
                'bg_color': 'bg-red-100',
                'icon': 'XCircle',
                'es_editable': True,
                'es_estado_inicial': False,
                'es_estado_final': False,
                'permite_firma': False,
                'requiere_firma_completa': False,
                'transiciones_permitidas': ['BORRADOR'],
                'orden': 99,
            },
        ]

        for estado_data in estados:
            code = estado_data['code']
            exists = EstadoPolitica.objects.filter(code=code).exists()

            if exists and not force:
                self.stdout.write(f'  - EstadoPolitica {code} ya existe, omitiendo')
                continue

            EstadoPolitica.objects.update_or_create(
                code=code,
                defaults=estado_data
            )
            action = 'actualizado' if exists else 'creado'
            self.stdout.write(f'  [OK] EstadoPolitica {code} {action}')

    def _seed_tipos_politica(self, force: bool):
        """Pobla tipos de política."""
        tipos = [
            {
                'code': 'INTEGRAL',
                'name': 'Política Integral',
                'description': 'Política integral del sistema de gestión que cubre múltiples normas',
                'prefijo_codigo': 'POL-INT',
                'requiere_firma': True,
                'icon': 'Shield',
                'color': 'purple',
                'orden': 1,
            },
            {
                'code': 'SST',
                'name': 'Política de SST',
                'description': 'Política de Seguridad y Salud en el Trabajo',
                'prefijo_codigo': 'POL-SST',
                'requiere_firma': True,
                'icon': 'HardHat',
                'color': 'orange',
                'orden': 2,
            },
            {
                'code': 'CALIDAD',
                'name': 'Política de Calidad',
                'description': 'Política del Sistema de Gestión de Calidad',
                'prefijo_codigo': 'POL-CAL',
                'requiere_firma': True,
                'icon': 'Award',
                'color': 'blue',
                'orden': 3,
            },
            {
                'code': 'AMBIENTAL',
                'name': 'Política Ambiental',
                'description': 'Política del Sistema de Gestión Ambiental',
                'prefijo_codigo': 'POL-AMB',
                'requiere_firma': True,
                'icon': 'Leaf',
                'color': 'green',
                'orden': 4,
            },
            {
                'code': 'SEGURIDAD_INFO',
                'name': 'Política de Seguridad de la Información',
                'description': 'Política del Sistema de Gestión de Seguridad de la Información',
                'prefijo_codigo': 'POL-SEG',
                'requiere_firma': True,
                'icon': 'Lock',
                'color': 'red',
                'orden': 5,
            },
            {
                'code': 'VIAL',
                'name': 'Política de Seguridad Vial',
                'description': 'Política del Plan Estratégico de Seguridad Vial (PESV)',
                'prefijo_codigo': 'POL-VIA',
                'requiere_firma': True,
                'icon': 'Car',
                'color': 'yellow',
                'orden': 6,
            },
            {
                'code': 'ANTISOBORNO',
                'name': 'Politica Antisoborno',
                'description': 'Politica del Sistema de Gestion Antisoborno',
                'prefijo_codigo': 'POL-ASB',
                'requiere_firma': True,
                'icon': 'Scale',
                'color': 'indigo',
                'orden': 7,
            },
            {
                'code': 'CONTABLE',
                'name': 'Politica Contable',
                'description': 'Politicas contables y financieras de la organizacion',
                'prefijo_codigo': 'POL-CON',
                'requiere_firma': True,
                'icon': 'Calculator',
                'color': 'teal',
                'orden': 8,
            },
            {
                'code': 'ADMINISTRATIVA',
                'name': 'Politica Administrativa',
                'description': 'Politicas administrativas y de gestion organizacional',
                'prefijo_codigo': 'POL-ADM',
                'requiere_firma': True,
                'icon': 'Briefcase',
                'color': 'slate',
                'orden': 9,
            },
            {
                'code': 'OTRAS',
                'name': 'Otras Politicas',
                'description': 'Otras politicas organizacionales no categorizadas',
                'prefijo_codigo': 'POL-OTR',
                'requiere_firma': True,
                'icon': 'FileText',
                'color': 'gray',
                'orden': 99,
            },
        ]

        for tipo_data in tipos:
            code = tipo_data['code']
            exists = TipoPolitica.objects.filter(code=code).exists()

            if exists and not force:
                self.stdout.write(f'  - TipoPolitica {code} ya existe, omitiendo')
                continue

            TipoPolitica.objects.update_or_create(
                code=code,
                defaults=tipo_data
            )
            action = 'actualizado' if exists else 'creado'
            self.stdout.write(f'  [OK] TipoPolitica {code} {action}')

    def _seed_roles_firmante(self, force: bool):
        """Pobla roles de firmante."""
        roles = [
            {
                'code': 'ELABORO',
                'label': 'Elaboró',
                'description': 'Persona que elabora el documento',
                'tipo_firma_documental': 'ELABORACION',
                'es_obligatorio': True,
                'puede_delegar': False,
                'icon': 'Edit',
                'color': 'gray',
                'orden': 1,
            },
            {
                'code': 'REVISO_TECNICO',
                'label': 'Revisó (Técnico)',
                'description': 'Revisión técnica del contenido',
                'tipo_firma_documental': 'REVISION',
                'es_obligatorio': False,
                'puede_delegar': True,
                'icon': 'Search',
                'color': 'blue',
                'orden': 2,
            },
            {
                'code': 'REVISO_JURIDICO',
                'label': 'Revisó (Jurídico)',
                'description': 'Revisión jurídica del contenido',
                'tipo_firma_documental': 'REVISION',
                'es_obligatorio': False,
                'puede_delegar': True,
                'icon': 'Scale',
                'color': 'purple',
                'orden': 3,
            },
            {
                'code': 'APROBO_DIRECTOR',
                'label': 'Aprobó (Director)',
                'description': 'Aprobación del director del área',
                'tipo_firma_documental': 'APROBACION',
                'es_obligatorio': False,
                'puede_delegar': True,
                'icon': 'UserCheck',
                'color': 'green',
                'orden': 4,
            },
            {
                'code': 'APROBO_GERENTE',
                'label': 'Aprobó (Gerente)',
                'description': 'Aprobación del gerente',
                'tipo_firma_documental': 'APROBACION',
                'es_obligatorio': False,
                'puede_delegar': True,
                'icon': 'UserCheck',
                'color': 'green',
                'orden': 5,
            },
            {
                'code': 'APROBO_REPRESENTANTE_LEGAL',
                'label': 'Aprobó (Rep. Legal)',
                'description': 'Aprobación del representante legal',
                'tipo_firma_documental': 'APROBACION',
                'es_obligatorio': True,
                'puede_delegar': False,
                'icon': 'Shield',
                'color': 'red',
                'orden': 6,
            },
        ]

        for rol_data in roles:
            code = rol_data['code']
            exists = RolFirmante.objects.filter(code=code).exists()

            if exists and not force:
                self.stdout.write(f'  - RolFirmante {code} ya existe, omitiendo')
                continue

            RolFirmante.objects.update_or_create(
                code=code,
                defaults=rol_data
            )
            action = 'actualizado' if exists else 'creado'
            self.stdout.write(f'  [OK] RolFirmante {code} {action}')

    def _seed_estados_firma(self, force: bool):
        """Pobla estados de firma."""
        estados = [
            {
                'code': 'PENDIENTE',
                'label': 'Pendiente',
                'description': 'Esperando la firma del usuario',
                'color': 'gray',
                'bg_color': 'bg-gray-100',
                'icon': 'Clock',
                'es_estado_final': False,
                'es_positivo': False,
                'es_negativo': False,
                'orden': 1,
            },
            {
                'code': 'FIRMADO',
                'label': 'Firmado',
                'description': 'Documento firmado exitosamente',
                'color': 'green',
                'bg_color': 'bg-green-100',
                'icon': 'CheckCircle',
                'es_estado_final': True,
                'es_positivo': True,
                'es_negativo': False,
                'orden': 2,
            },
            {
                'code': 'RECHAZADO',
                'label': 'Rechazado',
                'description': 'Firma rechazada por el usuario',
                'color': 'red',
                'bg_color': 'bg-red-100',
                'icon': 'XCircle',
                'es_estado_final': True,
                'es_positivo': False,
                'es_negativo': True,
                'orden': 3,
            },
            {
                'code': 'DELEGADO',
                'label': 'Delegado',
                'description': 'Firma delegada a otro usuario',
                'color': 'purple',
                'bg_color': 'bg-purple-100',
                'icon': 'UserPlus',
                'es_estado_final': False,
                'es_positivo': False,
                'es_negativo': False,
                'orden': 4,
            },
            {
                'code': 'VENCIDO',
                'label': 'Vencido',
                'description': 'Tiempo de firma expirado',
                'color': 'orange',
                'bg_color': 'bg-orange-100',
                'icon': 'AlertTriangle',
                'es_estado_final': True,
                'es_positivo': False,
                'es_negativo': True,
                'orden': 5,
            },
            {
                'code': 'REVOCADO',
                'label': 'Revocado',
                'description': 'Firma revocada después de firmada',
                'color': 'red',
                'bg_color': 'bg-red-100',
                'icon': 'Ban',
                'es_estado_final': True,
                'es_positivo': False,
                'es_negativo': True,
                'orden': 6,
            },
        ]

        for estado_data in estados:
            code = estado_data['code']
            exists = EstadoFirma.objects.filter(code=code).exists()

            if exists and not force:
                self.stdout.write(f'  - EstadoFirma {code} ya existe, omitiendo')
                continue

            EstadoFirma.objects.update_or_create(
                code=code,
                defaults=estado_data
            )
            action = 'actualizado' if exists else 'creado'
            self.stdout.write(f'  [OK] EstadoFirma {code} {action}')

    def _seed_flujos_firma(self, force: bool):
        """Pobla flujos de firma por defecto."""
        self.stdout.write('Creando flujos de firma...')

        flujos = [
            {
                'nombre': 'Flujo Estandar - Politicas Especificas',
                'descripcion': 'Flujo de firma para politicas especificas: Elaboro -> Reviso -> Aprobo',
                'tipo_politica': 'ESPECIFICA',
                'pasos_firma': [
                    {
                        'orden': 1,
                        'rol_firmante': 'ELABORO',
                        'es_obligatorio': True,
                        'puede_delegar': False,
                        'dias_limite': 5,
                    },
                    {
                        'orden': 2,
                        'rol_firmante': 'REVISO_TECNICO',
                        'es_obligatorio': True,
                        'puede_delegar': True,
                        'dias_limite': 3,
                    },
                    {
                        'orden': 3,
                        'rol_firmante': 'APROBO_GERENTE',
                        'es_obligatorio': True,
                        'puede_delegar': False,
                        'dias_limite': 3,
                    },
                ],
                'es_activo': True,
                'requiere_firma_secuencial': True,
            },
            {
                'nombre': 'Flujo Estandar - Politica Integral',
                'descripcion': 'Flujo de firma para politica integral: Elaboro -> Reviso Juridico -> Gerente -> Rep Legal',
                'tipo_politica': 'INTEGRAL',
                'pasos_firma': [
                    {
                        'orden': 1,
                        'rol_firmante': 'ELABORO',
                        'es_obligatorio': True,
                        'puede_delegar': False,
                        'dias_limite': 5,
                    },
                    {
                        'orden': 2,
                        'rol_firmante': 'REVISO_JURIDICO',
                        'es_obligatorio': True,
                        'puede_delegar': True,
                        'dias_limite': 5,
                    },
                    {
                        'orden': 3,
                        'rol_firmante': 'APROBO_GERENTE',
                        'es_obligatorio': True,
                        'puede_delegar': False,
                        'dias_limite': 3,
                    },
                    {
                        'orden': 4,
                        'rol_firmante': 'APROBO_REPRESENTANTE_LEGAL',
                        'es_obligatorio': True,
                        'puede_delegar': False,
                        'dias_limite': 3,
                    },
                ],
                'es_activo': True,
                'requiere_firma_secuencial': True,
            },
        ]

        for flujo_data in flujos:
            nombre = flujo_data['nombre']
            tipo = flujo_data['tipo_politica']
            exists = ConfiguracionFlujoFirma.objects.filter(
                nombre=nombre,
                tipo_politica=tipo
            ).exists()

            if exists and not force:
                self.stdout.write(f'  - Flujo "{nombre}" ya existe, omitiendo')
                continue

            ConfiguracionFlujoFirma.objects.update_or_create(
                nombre=nombre,
                tipo_politica=tipo,
                defaults={
                    'descripcion': flujo_data['descripcion'],
                    'pasos_firma': flujo_data['pasos_firma'],
                    'es_activo': flujo_data['es_activo'],
                    'requiere_firma_secuencial': flujo_data['requiere_firma_secuencial'],
                }
            )
            action = 'actualizado' if exists else 'creado'
            self.stdout.write(f'  [OK] Flujo "{nombre}" {action}')
