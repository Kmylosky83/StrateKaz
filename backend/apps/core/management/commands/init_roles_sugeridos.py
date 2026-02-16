"""
Comando para inicializar roles adicionales sugeridos - Sistema RBAC Híbrido

Crea los 18 roles predefinidos basados en normativa colombiana:

COPASST (5 roles):
- Presidente del COPASST
- Secretario(a) del COPASST
- Representante de los Trabajadores COPASST
- Representante de la Alta Dirección COPASST
- Vigía SST

COCOLA (4 roles):
- Presidente del COCOLA
- Secretario(a) del COCOLA
- Representante de los Trabajadores COCOLA
- Representante de la Alta Dirección COCOLA

Brigadas (5 roles):
- Líder de Brigada
- Líder Control de Incendios
- Líder Evacuación
- Líder Primeros Auxilios
- Brigadista

Sistemas de Gestión (4 roles):
- Líder PESV
- Auditor Interno ISO 9001 | 45001 | 14001
- Responsable del SG-SST
- Director del Sistema Integrado de Gestión

Uso:
    python manage.py init_roles_sugeridos
    python manage.py init_roles_sugeridos --verbose
    python manage.py init_roles_sugeridos --reset
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.core.models import RolAdicional, RolAdicionalPermiso, Permiso


class Command(BaseCommand):
    help = 'Inicializa los 18 roles adicionales predefinidos según normativa colombiana'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Muestra información detallada de cada rol creado',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Elimina roles del sistema existentes y los recrea',
        )

    def handle(self, *args, **options):
        verbose = options['verbose']
        reset = options['reset']

        self.stdout.write(self.style.MIGRATE_HEADING(
            '\n==============================================================='
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  INICIALIZACIÓN DE ROLES ADICIONALES - RBAC HÍBRIDO'
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  18 Roles predefinidos según normativa colombiana'
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '===============================================================\n'
        ))

        if reset:
            self.stdout.write(self.style.WARNING(
                '  Modo RESET: Se eliminarán y recrearán los roles del sistema\n'
            ))
            deleted_count = RolAdicional.objects.filter(is_system=True).delete()[0]
            self.stdout.write(self.style.WARNING(
                f'  {deleted_count} roles eliminados\n'
            ))

        # Definición de roles sugeridos
        roles_sugeridos = self._get_roles_definition()

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for rol_data in roles_sugeridos:
                permisos_codes = rol_data.pop('permisos_sugeridos', [])

                rol, created = RolAdicional.objects.update_or_create(
                    code=rol_data['code'],
                    defaults={
                        **rol_data,
                        'is_system': True,
                    }
                )

                # Asignar permisos si existen en el sistema
                if permisos_codes:
                    permisos_existentes = Permiso.objects.filter(
                        code__in=permisos_codes,
                        is_active=True
                    )

                    # Limpiar permisos anteriores y asignar nuevos
                    RolAdicionalPermiso.objects.filter(rol_adicional=rol).delete()
                    for permiso in permisos_existentes:
                        RolAdicionalPermiso.objects.create(
                            rol_adicional=rol,
                            permiso=permiso
                        )

                    permisos_asignados = permisos_existentes.count()
                    permisos_pendientes = len(permisos_codes) - permisos_asignados
                else:
                    permisos_asignados = 0
                    permisos_pendientes = 0

                if created:
                    created_count += 1
                    status_icon = '+'
                    status_style = self.style.SUCCESS
                    status_text = 'CREADO'
                else:
                    updated_count += 1
                    status_icon = '~'
                    status_style = self.style.WARNING
                    status_text = 'ACTUALIZADO'

                if verbose:
                    self.stdout.write(
                        f'{status_icon} [{status_text}] {rol.nombre} ({rol.code})'
                    )
                    self.stdout.write(
                        f'   Tipo: {rol.get_tipo_display()}'
                    )
                    self.stdout.write(
                        f'   Permisos: {permisos_asignados} asignados, {permisos_pendientes} pendientes'
                    )
                    if rol.requiere_certificacion:
                        self.stdout.write(
                            f'   Certificación: {rol.certificacion_requerida}'
                        )
                    self.stdout.write('')
                else:
                    self.stdout.write(status_style(
                        f'{status_icon} {rol.nombre}'
                    ))

        # Resumen final
        self.stdout.write('')
        self.stdout.write(self.style.MIGRATE_HEADING(
            '---------------------------------------------------------------'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'\n  Proceso completado exitosamente!'
        ))
        self.stdout.write(f'   - Roles creados: {created_count}')
        self.stdout.write(f'   - Roles actualizados: {updated_count}')
        self.stdout.write(f'   - Total roles del sistema: {RolAdicional.objects.filter(is_system=True).count()}')
        self.stdout.write('')
        self.stdout.write(self.style.NOTICE(
            '  Nota: Los permisos marcados como "pendientes" se asignarán'
        ))
        self.stdout.write(self.style.NOTICE(
            '  cuando el sistema de permisos esté completamente configurado.'
        ))
        self.stdout.write('')

    def _get_roles_definition(self):
        """
        Retorna la definición de los 18 roles predefinidos según normativa colombiana.

        Basado en:
        - Decreto 1072/2015 (SG-SST)
        - Resolución 0312/2019 (Estándares mínimos SG-SST)
        - Resolución 2013/1986 (COPASST)
        - Resolución 652/2012 y 1356/2012 (COCOLA)
        - Resolución 1016/1989 (Brigadas)
        - Resolución 40595/2022 (PESV)
        - Normas ISO 9001, 14001, 45001
        """
        return [
            # =================================================================
            # COPASST - Comité Paritario de SST (5 roles)
            # =================================================================
            {
                'code': 'presidente_copasst',
                'nombre': 'Presidente del COPASST',
                'descripcion': (
                    'Preside el Comité Paritario de Seguridad y Salud en el Trabajo. '
                    'Coordina reuniones mensuales, lidera investigación de accidentes '
                    'y firma actas oficiales.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 2013/1986, Decreto 1072/2015 Art. 2.2.4.6.24',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas SG-SST',
                'permisos_sugeridos': ['sst.view_list', 'sst.manage', 'sst.manage_investigations'],
            },
            {
                'code': 'secretario_copasst',
                'nombre': 'Secretario(a) del COPASST',
                'descripcion': (
                    'Elabora las actas de reunión del COPASST, coordina citaciones '
                    'y gestiona documentación del comité.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 2013/1986, Decreto 1072/2015',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas SG-SST',
                'permisos_sugeridos': ['sst.view_list', 'sst.view_own'],
            },
            {
                'code': 'representante_trabajadores_copasst',
                'nombre': 'Representante de los Trabajadores COPASST',
                'descripcion': (
                    'Representa a los trabajadores en el COPASST. Elegido por votación '
                    'de los trabajadores con voz y voto en las reuniones del comité.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 2013/1986, Decreto 1072/2015',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas SG-SST',
                'permisos_sugeridos': ['sst.view_list', 'sst.view_own'],
            },
            {
                'code': 'representante_direccion_copasst',
                'nombre': 'Representante de la Alta Dirección COPASST',
                'descripcion': (
                    'Representa a la Alta Dirección en el COPASST. Designado por el '
                    'empleador con voz y voto en las reuniones del comité.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 2013/1986, Decreto 1072/2015',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas SG-SST',
                'permisos_sugeridos': ['sst.view_list', 'sst.view_own', 'sst.manage'],
            },
            {
                'code': 'vigia_sst',
                'nombre': 'Vigía SST',
                'descripcion': (
                    'Vigía de Seguridad y Salud en el Trabajo para empresas con menos '
                    'de 10 trabajadores. Reemplaza al COPASST en estas empresas.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 0312/2019 Art. 4',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas SG-SST',
                'permisos_sugeridos': ['sst.view_list', 'sst.manage'],
            },

            # =================================================================
            # COCOLA - Comité de Convivencia Laboral (4 roles)
            # =================================================================
            {
                'code': 'presidente_cocola',
                'nombre': 'Presidente del COCOLA',
                'descripcion': (
                    'Preside el Comité de Convivencia Laboral. Lidera reuniones '
                    'trimestrales y recibe quejas de acoso laboral.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 652/2012, Resolución 1356/2012',
                'requiere_certificacion': False,
                'certificacion_requerida': '',
                'permisos_sugeridos': ['users.view_list', 'sst.view_list'],
            },
            {
                'code': 'secretario_cocola',
                'nombre': 'Secretario(a) del COCOLA',
                'descripcion': (
                    'Elabora las actas del COCOLA, gestiona documentación confidencial '
                    'y coordina citaciones del comité.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 652/2012, Resolución 1356/2012',
                'requiere_certificacion': False,
                'certificacion_requerida': '',
                'permisos_sugeridos': ['users.view_list'],
            },
            {
                'code': 'representante_trabajadores_cocola',
                'nombre': 'Representante de los Trabajadores COCOLA',
                'descripcion': (
                    'Representa a los trabajadores en el COCOLA. Elegido por votación '
                    'de los trabajadores con voz y voto en las reuniones del comité.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 652/2012, Resolución 1356/2012',
                'requiere_certificacion': False,
                'certificacion_requerida': '',
                'permisos_sugeridos': ['users.view_list'],
            },
            {
                'code': 'representante_direccion_cocola',
                'nombre': 'Representante de la Alta Dirección COCOLA',
                'descripcion': (
                    'Representa a la Alta Dirección en el COCOLA. Designado por el '
                    'empleador con voz y voto en las reuniones del comité.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 652/2012, Resolución 1356/2012',
                'requiere_certificacion': False,
                'certificacion_requerida': '',
                'permisos_sugeridos': ['users.view_list', 'sst.view_list'],
            },

            # =================================================================
            # BRIGADAS DE EMERGENCIA (5 roles)
            # =================================================================
            {
                'code': 'lider_brigada',
                'nombre': 'Líder de Brigada',
                'descripcion': (
                    'Líder general de la brigada de emergencias. Coordina a todos los '
                    'líderes de área (incendios, evacuación, primeros auxilios) durante emergencias.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 1016/1989 Art. 11, Decreto 1072/2015',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso Brigadas de Emergencia (min. 40h) + Liderazgo',
                'permisos_sugeridos': ['sst.view_list', 'sst.manage'],
            },
            {
                'code': 'lider_control_incendios',
                'nombre': 'Líder Control de Incendios',
                'descripcion': (
                    'Lidera el grupo de control de incendios. Coordina uso de extintores, '
                    'gabinetes y equipos contra incendio.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 1016/1989 Art. 11',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso Brigadas de Emergencia - Énfasis Incendios (min. 20h)',
                'permisos_sugeridos': ['sst.view_list'],
            },
            {
                'code': 'lider_evacuacion',
                'nombre': 'Líder Evacuación',
                'descripcion': (
                    'Lidera el grupo de evacuación. Coordina rutas de evacuación, '
                    'puntos de encuentro y conteo de personal.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 1016/1989 Art. 11',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso Brigadas de Emergencia - Énfasis Evacuación (min. 20h)',
                'permisos_sugeridos': ['sst.view_list'],
            },
            {
                'code': 'lider_primeros_auxilios',
                'nombre': 'Líder Primeros Auxilios',
                'descripcion': (
                    'Lidera el grupo de primeros auxilios. Coordina atención inicial '
                    'de lesionados y traslado a centros de atención.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 1016/1989 Art. 11',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso Primeros Auxilios Avanzados (min. 40h)',
                'permisos_sugeridos': ['sst.view_list'],
            },
            {
                'code': 'brigadista',
                'nombre': 'Brigadista',
                'descripcion': (
                    'Integrante de brigada de emergencias. Capacitado en primeros auxilios, '
                    'evacuación y control de incendios básico.'
                ),
                'tipo': 'LEGAL_OBLIGATORIO',
                'justificacion_legal': 'Resolución 1016/1989 Art. 11',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso Brigadas de Emergencia (min. 20h)',
                'permisos_sugeridos': ['sst.view_list'],
            },

            # =================================================================
            # SISTEMAS DE GESTIÓN (4 roles)
            # =================================================================
            {
                'code': 'lider_pesv',
                'nombre': 'Líder PESV',
                'descripcion': (
                    'Líder del Plan Estratégico de Seguridad Vial. Coordina la '
                    'implementación y seguimiento del PESV organizacional.'
                ),
                'tipo': 'SISTEMA_GESTION',
                'justificacion_legal': 'Resolución 40595/2022 (Mintransporte)',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Curso 50 horas Seguridad Vial',
                'permisos_sugeridos': ['pesv.view_list', 'pesv.manage'],
            },
            {
                'code': 'auditor_interno_sig',
                'nombre': 'Auditor Interno ISO 9001 | 45001 | 14001',
                'descripcion': (
                    'Auditor interno certificado para Sistema Integrado de Gestión: '
                    'Calidad (ISO 9001), SST (ISO 45001) y Ambiental (ISO 14001).'
                ),
                'tipo': 'SISTEMA_GESTION',
                'justificacion_legal': 'ISO 9001:2015, ISO 45001:2018, ISO 14001:2015 Cláusula 9.2',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Formación Auditor Interno SIG (ISO 9001, 45001, 14001)',
                'permisos_sugeridos': ['sgc.view_list', 'sgc.manage_audits', 'sst.view_list', 'sst.manage_audits'],
            },
            {
                'code': 'responsable_sgsst',
                'nombre': 'Responsable del SG-SST',
                'descripcion': (
                    'Responsable del diseño, implementación y mantenimiento del Sistema '
                    'de Gestión de Seguridad y Salud en el Trabajo.'
                ),
                'tipo': 'SISTEMA_GESTION',
                'justificacion_legal': 'Decreto 1072/2015 Art. 2.2.4.6.8',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Licencia SST vigente',
                'permisos_sugeridos': ['sst.view_list', 'sst.manage', 'sst.approve'],
            },
            {
                'code': 'director_sig',
                'nombre': 'Director del Sistema Integrado de Gestión',
                'descripcion': (
                    'Dirige el Sistema Integrado de Gestión organizacional. '
                    'Responsable de la integración de ISO 9001, 14001, 45001 y otros sistemas.'
                ),
                'tipo': 'SISTEMA_GESTION',
                'justificacion_legal': 'ISO 9001:2015, ISO 14001:2015, ISO 45001:2018',
                'requiere_certificacion': True,
                'certificacion_requerida': 'Formación en Sistemas Integrados de Gestión',
                'permisos_sugeridos': ['sgc.view_list', 'sgc.manage', 'sst.view_list', 'sst.manage', 'sga.view_list', 'sga.manage'],
            },
        ]
