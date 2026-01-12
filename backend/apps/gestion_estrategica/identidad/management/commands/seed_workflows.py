"""
Script para crear workflows predefinidos del sistema.

Usage:
    python manage.py seed_workflows

Este comando crea:
1. Workflows de firma predefinidos para políticas SST, Calidad, Ambiental
2. Ejemplos de configuración de revisión periódica
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.gestion_estrategica.identidad.models_workflow import (
    ConfiguracionWorkflowFirma,
    FIRMA_ROL_CHOICES,
)
from apps.core.models import Cargo

User = get_user_model()


class Command(BaseCommand):
    help = 'Crea workflows predefinidos para el sistema de firmas'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando creación de workflows predefinidos...\n')

        try:
            # Obtener usuario admin para created_by
            admin_user = User.objects.filter(is_staff=True).first()
            if not admin_user:
                self.stdout.write(
                    self.style.WARNING(
                        'No se encontró usuario administrador. Creando workflows sin usuario.'
                    )
                )

            # 1. Workflow Política SST (Decreto 1072)
            self.crear_workflow_sst(admin_user)

            # 2. Workflow Política Integral (Multi-norma)
            self.crear_workflow_politica_integral(admin_user)

            # 3. Workflow Política Calidad (ISO 9001)
            self.crear_workflow_calidad(admin_user)

            # 4. Workflow Política Ambiental (ISO 14001)
            self.crear_workflow_ambiental(admin_user)

            # 5. Workflow Política Seguridad de la Información (ISO 27001)
            self.crear_workflow_seguridad_info(admin_user)

            # 6. Workflow Simple (2 firmas)
            self.crear_workflow_simple(admin_user)

            # 7. Workflow Paralelo (Comités)
            self.crear_workflow_paralelo(admin_user)

            self.stdout.write(
                self.style.SUCCESS('\n[OK] Workflows predefinidos creados exitosamente')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\n[ERROR] Error al crear workflows: {str(e)}')
            )
            raise

    def crear_workflow_sst(self, admin_user):
        """
        Workflow para Política SST según Decreto 1072/2015

        Flujo:
        1. Elaboró: Coordinador SST
        2. Revisó: Gerente HSEQ
        3. Revisó: COPASST (representante)
        4. Aprobó: Gerente General / Representante Legal
        """
        self.stdout.write('Creando Workflow Política SST (Decreto 1072)...')

        # Buscar cargos típicos
        cargo_coordinador_sst = Cargo.objects.filter(
            code__icontains='COORD_SST'
        ).first() or Cargo.objects.filter(
            name__icontains='Coordinador SST'
        ).first()

        cargo_gerente_hseq = Cargo.objects.filter(
            code__icontains='GERENTE_HSEQ'
        ).first() or Cargo.objects.filter(
            name__icontains='Gerente HSEQ'
        ).first()

        cargo_gerente_general = Cargo.objects.filter(
            code__icontains='GERENTE_GENERAL'
        ).first() or Cargo.objects.filter(
            name__icontains='Gerente General'
        ).first()

        roles_config = [
            {
                'rol': 'ELABORO',
                'nombre': 'Elaboró',
                'orden': 1,
                'obligatorio': True,
                'cargo_id': cargo_coordinador_sst.id if cargo_coordinador_sst else None,
                'usuario_id': None,
                'descripcion': 'Coordinador SST elabora la política según Decreto 1072'
            },
            {
                'rol': 'REVISO',
                'nombre': 'Revisó (HSEQ)',
                'orden': 2,
                'obligatorio': True,
                'cargo_id': cargo_gerente_hseq.id if cargo_gerente_hseq else None,
                'usuario_id': None,
                'descripcion': 'Gerente HSEQ revisa cumplimiento normativo'
            },
            {
                'rol': 'REVISO',
                'nombre': 'Revisó (COPASST)',
                'orden': 3,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Representante COPASST o Vigía SST'
            },
            {
                'rol': 'APROBO',
                'nombre': 'Aprobó',
                'orden': 4,
                'obligatorio': True,
                'cargo_id': cargo_gerente_general.id if cargo_gerente_general else None,
                'usuario_id': None,
                'descripcion': 'Gerente General / Representante Legal aprueba'
            }
        ]

        workflow, created = ConfiguracionWorkflowFirma.objects.update_or_create(
            nombre='Workflow Política SST',
            defaults={
                'descripcion': (
                    'Workflow estándar para políticas de Seguridad y Salud en el Trabajo '
                    'según Decreto 1072/2015 y Resolución 0312/2019. '
                    'Requiere firma del Coordinador SST, Gerente HSEQ, COPASST y Representante Legal.'
                ),
                'tipo_politica': 'ESPECIFICA',
                'tipo_orden': 'SECUENCIAL',
                'dias_para_firmar': 5,
                'permitir_delegacion': True,
                'roles_config': roles_config,
                'activo': True,
                'created_by': admin_user,
                'updated_by': admin_user,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('  [OK] Workflow Política SST creado'))
        else:
            self.stdout.write(self.style.WARNING('  [UPD] Workflow Política SST actualizado'))

    def crear_workflow_politica_integral(self, admin_user):
        """
        Workflow para Política Integral del Sistema de Gestión

        Flujo:
        1. Elaboró: Representante de la Dirección / Gerente HSEQ
        2. Revisó: Coordinador Calidad
        3. Revisó: Coordinador SST
        4. Revisó: Coordinador Ambiental
        5. Aprobó: Alta Dirección / Gerente General
        """
        self.stdout.write('Creando Workflow Política Integral...')

        roles_config = [
            {
                'rol': 'ELABORO',
                'nombre': 'Elaboró',
                'orden': 1,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Representante de la Dirección elabora política integral'
            },
            {
                'rol': 'REVISO',
                'nombre': 'Revisó (Calidad)',
                'orden': 2,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Coordinador Calidad revisa alineación con ISO 9001'
            },
            {
                'rol': 'REVISO',
                'nombre': 'Revisó (SST)',
                'orden': 3,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Coordinador SST revisa alineación con ISO 45001'
            },
            {
                'rol': 'REVISO',
                'nombre': 'Revisó (Ambiental)',
                'orden': 4,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Coordinador Ambiental revisa alineación con ISO 14001'
            },
            {
                'rol': 'APROBO',
                'nombre': 'Aprobó',
                'orden': 5,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Alta Dirección aprueba política integral'
            }
        ]

        workflow, created = ConfiguracionWorkflowFirma.objects.update_or_create(
            nombre='Workflow Política Integral',
            defaults={
                'descripcion': (
                    'Workflow para la Política Integral del Sistema de Gestión. '
                    'Incluye revisión de coordinadores de Calidad, SST y Ambiental. '
                    'Cumple con ISO 9001, ISO 45001, ISO 14001.'
                ),
                'tipo_politica': 'INTEGRAL',
                'tipo_orden': 'SECUENCIAL',
                'dias_para_firmar': 7,
                'permitir_delegacion': True,
                'roles_config': roles_config,
                'activo': True,
                'created_by': admin_user,
                'updated_by': admin_user,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('  [OK] Workflow Política Integral creado'))
        else:
            self.stdout.write(self.style.WARNING('  [UPD] Workflow Política Integral actualizado'))

    def crear_workflow_calidad(self, admin_user):
        """Workflow para Política de Calidad (ISO 9001)"""
        self.stdout.write('Creando Workflow Política Calidad (ISO 9001)...')

        roles_config = [
            {
                'rol': 'ELABORO',
                'nombre': 'Elaboró',
                'orden': 1,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Coordinador de Calidad elabora política'
            },
            {
                'rol': 'REVISO',
                'nombre': 'Revisó',
                'orden': 2,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Gerente de Operaciones revisa'
            },
            {
                'rol': 'APROBO',
                'nombre': 'Aprobó',
                'orden': 3,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Alta Dirección aprueba'
            }
        ]

        workflow, created = ConfiguracionWorkflowFirma.objects.update_or_create(
            nombre='Workflow Política Calidad',
            defaults={
                'descripcion': (
                    'Workflow para políticas de Calidad según ISO 9001:2015. '
                    'Requiere elaboración, revisión y aprobación por Alta Dirección.'
                ),
                'tipo_politica': 'ESPECIFICA',
                'tipo_orden': 'SECUENCIAL',
                'dias_para_firmar': 5,
                'permitir_delegacion': True,
                'roles_config': roles_config,
                'activo': True,
                'created_by': admin_user,
                'updated_by': admin_user,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('  [OK] Workflow Política Calidad creado'))
        else:
            self.stdout.write(self.style.WARNING('  [UPD] Workflow Política Calidad actualizado'))

    def crear_workflow_ambiental(self, admin_user):
        """Workflow para Política Ambiental (ISO 14001)"""
        self.stdout.write('Creando Workflow Política Ambiental (ISO 14001)...')

        roles_config = [
            {
                'rol': 'ELABORO',
                'nombre': 'Elaboró',
                'orden': 1,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Coordinador Ambiental elabora política'
            },
            {
                'rol': 'REVISO',
                'nombre': 'Revisó',
                'orden': 2,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Gerente HSEQ revisa'
            },
            {
                'rol': 'APROBO',
                'nombre': 'Aprobó',
                'orden': 3,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Alta Dirección aprueba'
            }
        ]

        workflow, created = ConfiguracionWorkflowFirma.objects.update_or_create(
            nombre='Workflow Política Ambiental',
            defaults={
                'descripcion': (
                    'Workflow para políticas ambientales según ISO 14001:2015. '
                    'Incluye revisión de coordinador ambiental y aprobación por Alta Dirección.'
                ),
                'tipo_politica': 'ESPECIFICA',
                'tipo_orden': 'SECUENCIAL',
                'dias_para_firmar': 5,
                'permitir_delegacion': True,
                'roles_config': roles_config,
                'activo': True,
                'created_by': admin_user,
                'updated_by': admin_user,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('  [OK] Workflow Política Ambiental creado'))
        else:
            self.stdout.write(self.style.WARNING('  [UPD] Workflow Política Ambiental actualizado'))

    def crear_workflow_seguridad_info(self, admin_user):
        """Workflow para Política de Seguridad de la Información (ISO 27001)"""
        self.stdout.write('Creando Workflow Política Seguridad Info (ISO 27001)...')

        roles_config = [
            {
                'rol': 'ELABORO',
                'nombre': 'Elaboró',
                'orden': 1,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Coordinador de Seguridad de la Información elabora'
            },
            {
                'rol': 'REVISO',
                'nombre': 'Revisó',
                'orden': 2,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Gerente de TI revisa'
            },
            {
                'rol': 'APROBO',
                'nombre': 'Aprobó',
                'orden': 3,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Alta Dirección aprueba'
            }
        ]

        workflow, created = ConfiguracionWorkflowFirma.objects.update_or_create(
            nombre='Workflow Política Seguridad Información',
            defaults={
                'descripcion': (
                    'Workflow para políticas de seguridad de la información según ISO 27001:2022. '
                    'Requiere revisión técnica de TI y aprobación por Alta Dirección.'
                ),
                'tipo_politica': 'ESPECIFICA',
                'tipo_orden': 'SECUENCIAL',
                'dias_para_firmar': 5,
                'permitir_delegacion': True,
                'roles_config': roles_config,
                'activo': True,
                'created_by': admin_user,
                'updated_by': admin_user,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('  [OK] Workflow Política Seguridad Info creado'))
        else:
            self.stdout.write(self.style.WARNING('  [UPD] Workflow Política Seguridad Info actualizado'))

    def crear_workflow_simple(self, admin_user):
        """Workflow simple de 2 firmas (Elaboró y Aprobó)"""
        self.stdout.write('Creando Workflow Simple (2 firmas)...')

        roles_config = [
            {
                'rol': 'ELABORO',
                'nombre': 'Elaboró',
                'orden': 1,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Responsable elabora el documento'
            },
            {
                'rol': 'APROBO',
                'nombre': 'Aprobó',
                'orden': 2,
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Jefe inmediato aprueba'
            }
        ]

        workflow, created = ConfiguracionWorkflowFirma.objects.update_or_create(
            nombre='Workflow Simple',
            defaults={
                'descripcion': (
                    'Workflow simplificado de 2 firmas: Elaboró y Aprobó. '
                    'Útil para políticas internas de área o procedimientos operativos.'
                ),
                'tipo_politica': 'ESPECIFICA',
                'tipo_orden': 'SECUENCIAL',
                'dias_para_firmar': 3,
                'permitir_delegacion': True,
                'roles_config': roles_config,
                'activo': True,
                'created_by': admin_user,
                'updated_by': admin_user,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('  [OK] Workflow Simple creado'))
        else:
            self.stdout.write(self.style.WARNING('  [UPD] Workflow Simple actualizado'))

    def crear_workflow_paralelo(self, admin_user):
        """
        Workflow paralelo para revisión de comités

        Flujo:
        - 3 revisiones paralelas (orden 0)
        - 1 aprobación final (orden 1)
        """
        self.stdout.write('Creando Workflow Paralelo (Comités)...')

        roles_config = [
            {
                'rol': 'REVISO',
                'nombre': 'Revisó (Comité Calidad)',
                'orden': 0,  # Paralelo
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Representante Comité de Calidad'
            },
            {
                'rol': 'REVISO',
                'nombre': 'Revisó (Comité SST)',
                'orden': 0,  # Paralelo
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Representante COPASST'
            },
            {
                'rol': 'REVISO',
                'nombre': 'Revisó (Comité Convivencia)',
                'orden': 0,  # Paralelo
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Representante Comité de Convivencia'
            },
            {
                'rol': 'APROBO',
                'nombre': 'Aprobó',
                'orden': 1,  # Después de todas las paralelas
                'obligatorio': True,
                'cargo_id': None,
                'usuario_id': None,
                'descripcion': 'Alta Dirección aprueba después de revisión de comités'
            }
        ]

        workflow, created = ConfiguracionWorkflowFirma.objects.update_or_create(
            nombre='Workflow Paralelo Comités',
            defaults={
                'descripcion': (
                    'Workflow con firmas paralelas para revisión por múltiples comités. '
                    'Los comités pueden firmar en cualquier orden, y luego Alta Dirección aprueba.'
                ),
                'tipo_politica': 'ESPECIFICA',
                'tipo_orden': 'PARALELO',
                'dias_para_firmar': 7,
                'permitir_delegacion': True,
                'roles_config': roles_config,
                'activo': True,
                'created_by': admin_user,
                'updated_by': admin_user,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('  [OK] Workflow Paralelo creado'))
        else:
            self.stdout.write(self.style.WARNING('  [UPD] Workflow Paralelo actualizado'))
