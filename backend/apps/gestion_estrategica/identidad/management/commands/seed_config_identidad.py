"""
Seed de configuración dinámica para Identidad Corporativa

Pobla las tablas de configuración con los valores por defecto
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
# Fase 0.3.4: Usar ConfiguracionFlujoFirma del sistema universal
from apps.infraestructura.workflow_engine.firma_digital.models import ConfiguracionFlujoFirma


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
            'Configuración de Identidad Corporativa poblada exitosamente'
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
                'label': 'En Revisión',
                'description': 'En proceso de revisión técnica por el cargo revisor',
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
                'label': 'En Aprobación',
                'description': 'Revisada, pendiente de aprobación final por el cargo aprobador',
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
                'description': 'Aprobada, pendiente de codificación y publicación en Gestor Documental',
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
                'description': 'Política activa y publicada en el Gestor Documental',
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
                'description': 'Política reemplazada por una versión más reciente',
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
                'description': 'Política rechazada en revisión o aprobación, requiere correcciones',
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
                'name': 'Política Antisoborno',
                'description': 'Política del Sistema de Gestión Antisoborno',
                'prefijo_codigo': 'POL-ASB',
                'requiere_firma': True,
                'icon': 'Scale',
                'color': 'indigo',
                'orden': 7,
            },
            {
                'code': 'CONTABLE',
                'name': 'Política Contable',
                'description': 'Políticas contables y financieras de la organización',
                'prefijo_codigo': 'POL-CON',
                'requiere_firma': True,
                'icon': 'Calculator',
                'color': 'teal',
                'orden': 8,
            },
            {
                'code': 'ADMINISTRATIVA',
                'name': 'Política Administrativa',
                'description': 'Políticas administrativas y de gestión organizacional',
                'prefijo_codigo': 'POL-ADM',
                'requiere_firma': True,
                'icon': 'Briefcase',
                'color': 'slate',
                'orden': 9,
            },
            {
                'code': 'OTRAS',
                'name': 'Otras Políticas',
                'description': 'Otras políticas organizacionales no categorizadas',
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
        """
        Pobla roles de firmante genéricos.

        NOTA: Se usan 3 roles genéricos porque el CARGO específico
        (Director, Gerente, Coordinador SST, etc.) se selecciona
        dinámicamente desde el modal consumiendo los Cargos de Organización.

        El rol indica la FUNCIÓN en el flujo, no el cargo específico.
        """
        # Eliminar roles legacy específicos primero
        roles_legacy = [
            'REVISO_TECNICO', 'REVISO_JURIDICO',
            'APROBO_DIRECTOR', 'APROBO_GERENTE', 'APROBO_REPRESENTANTE_LEGAL'
        ]
        deleted = RolFirmante.objects.filter(code__in=roles_legacy).delete()
        if deleted[0] > 0:
            self.stdout.write(f'  [CLEANUP] {deleted[0]} roles legacy eliminados')

        roles = [
            {
                'code': 'ELABORO',
                'label': 'Elaboró',
                'description': 'Usuario que elabora/crea el documento (automático)',
                'tipo_firma_documental': 'ELABORACION',
                'es_obligatorio': True,
                'puede_delegar': False,
                'icon': 'Edit',
                'color': 'gray',
                'orden': 1,
            },
            {
                'code': 'REVISO',
                'label': 'Revisó',
                'description': 'Cargo seleccionado para revisión (técnica o jurídica)',
                'tipo_firma_documental': 'REVISION',
                'es_obligatorio': True,
                'puede_delegar': True,
                'icon': 'Search',
                'color': 'blue',
                'orden': 2,
            },
            {
                'code': 'APROBO',
                'label': 'Aprobó',
                'description': 'Cargo seleccionado para aprobación final',
                'tipo_firma_documental': 'APROBACION',
                'es_obligatorio': True,
                'puede_delegar': False,
                'icon': 'CheckCircle',
                'color': 'green',
                'orden': 3,
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
        """
        Pobla flujo de firma genérico para políticas.

        NOTA: Solo se crea 1 flujo genérico porque los firmantes específicos
        (revisor, aprobador) se seleccionan dinámicamente desde el modal de UI
        consumiendo los Cargos creados en Organización.

        El flujo genérico define la estructura base:
        - Elaboró (automático: usuario actual)
        - Revisó (seleccionable desde modal)
        - Aprobó (seleccionable desde modal)
        """
        self.stdout.write('Creando flujo de firma genérico para políticas...')

        codigo = 'FLUJO-POL-GEN'
        nombre = 'Flujo Genérico - Políticas'

        # Configuración de nodos según el modelo ConfiguracionFlujoFirma
        configuracion_nodos = [
            {
                'orden': 1,
                'rol': 'ELABORO',
                'cargo_id': None,  # Se asigna dinámicamente (usuario actual)
                'requerido': True,
                'descripcion': 'Usuario que crea/edita la política (automático)',
            },
            {
                'orden': 2,
                'rol': 'REVISO',
                'cargo_id': None,  # Se selecciona desde modal
                'requerido': True,
                'descripcion': 'Cargo seleccionado para revisión técnica/jurídica',
            },
            {
                'orden': 3,
                'rol': 'APROBO',
                'cargo_id': None,  # Se selecciona desde modal
                'requerido': True,
                'descripcion': 'Cargo seleccionado para aprobación final',
            },
        ]

        exists = ConfiguracionFlujoFirma.objects.filter(codigo=codigo).exists()

        if exists and not force:
            self.stdout.write(f'  - Flujo "{nombre}" ya existe, omitiendo')
            return

        ConfiguracionFlujoFirma.objects.update_or_create(
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'descripcion': (
                    'Flujo genérico para todas las políticas. '
                    'Los cargos de Revisión y Aprobación se seleccionan '
                    'dinámicamente desde el modal al iniciar el proceso de firma.'
                ),
                'tipo_flujo': 'SECUENCIAL',
                'configuracion_nodos': configuracion_nodos,
                'permite_delegacion': True,
                'dias_max_firma': 5,
                'requiere_comentario_rechazo': True,
            }
        )
        action = 'actualizado' if exists else 'creado'
        self.stdout.write(f'  [OK] Flujo "{nombre}" ({codigo}) {action}')

        # Eliminar flujos legacy si existen
        flujos_legacy = ConfiguracionFlujoFirma.objects.filter(
            codigo__in=['FLUJO-POL-ESP', 'FLUJO-POL-INT']
        )
        if flujos_legacy.exists():
            count = flujos_legacy.count()
            flujos_legacy.delete()
            self.stdout.write(f'  [CLEANUP] {count} flujos legacy eliminados')
