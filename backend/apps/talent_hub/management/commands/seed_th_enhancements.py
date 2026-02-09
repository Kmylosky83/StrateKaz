"""
Seed command para Talent Hub Enhancements.

Crea:
1. TipoNotificacion con codigos TH_*
2. ConfiguracionRecargo (6 tipos HE, con fases Ley 2466)
3. ModuleTab (mi_portal, mi_equipo)
4. TabSection (5 ESS + 3 MSS)
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal


# ============================================================================
# DATOS: Tipos de Notificacion TH
# ============================================================================

NOTIFICATION_TYPES = [
    {
        'codigo': 'TH_CITACION_DESCARGOS',
        'nombre': 'Citacion a descargos',
        'descripcion': 'Notifica al colaborador que ha sido citado a descargos.',
        'categoria': 'alerta',
        'color': 'red',
        'icono': 'AlertTriangle',
        'plantilla_titulo': 'Citacion a Descargos',
        'plantilla_mensaje': 'Ha sido citado a descargos. Revise los detalles.',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_SANCION_APLICADA',
        'nombre': 'Sancion aplicada',
        'descripcion': 'Notifica al colaborador que se le aplico una sancion.',
        'categoria': 'alerta',
        'color': 'red',
        'icono': 'AlertCircle',
        'plantilla_titulo': 'Sancion Aplicada',
        'plantilla_mensaje': 'Se ha aplicado una sancion disciplinaria.',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_CONTRATO_POR_VENCER',
        'nombre': 'Contrato por vencer',
        'descripcion': 'Alerta de contrato proximo a vencer.',
        'categoria': 'recordatorio',
        'color': 'yellow',
        'icono': 'FileWarning',
        'plantilla_titulo': 'Contrato por Vencer',
        'plantilla_mensaje': 'El contrato de {colaborador} vence en {dias} dias.',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'TH_CONTRATO_FIRMADO',
        'nombre': 'Contrato firmado',
        'descripcion': 'Confirmacion de firma de contrato.',
        'categoria': 'sistema',
        'color': 'green',
        'icono': 'FileCheck',
        'plantilla_titulo': 'Contrato Firmado',
        'plantilla_mensaje': 'El contrato ha sido firmado exitosamente.',
        'es_email': False,
        'es_push': True,
    },
    {
        'codigo': 'TH_VACACIONES_SOLICITUD',
        'nombre': 'Solicitud de vacaciones',
        'descripcion': 'Un colaborador solicito vacaciones.',
        'categoria': 'aprobacion',
        'color': 'blue',
        'icono': 'Calendar',
        'plantilla_titulo': 'Solicitud de Vacaciones',
        'plantilla_mensaje': '{colaborador} solicito vacaciones del {inicio} al {fin}.',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_VACACIONES_APROBADAS',
        'nombre': 'Vacaciones aprobadas',
        'descripcion': 'Las vacaciones fueron aprobadas.',
        'categoria': 'sistema',
        'color': 'green',
        'icono': 'CalendarCheck',
        'plantilla_titulo': 'Vacaciones Aprobadas',
        'plantilla_mensaje': 'Su solicitud de vacaciones ha sido aprobada.',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_VACACIONES_RECHAZADAS',
        'nombre': 'Vacaciones rechazadas',
        'descripcion': 'Las vacaciones fueron rechazadas.',
        'categoria': 'sistema',
        'color': 'red',
        'icono': 'CalendarX',
        'plantilla_titulo': 'Vacaciones Rechazadas',
        'plantilla_mensaje': 'Su solicitud de vacaciones ha sido rechazada.',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_PERMISO_SOLICITUD',
        'nombre': 'Solicitud de permiso',
        'descripcion': 'Un colaborador solicito un permiso.',
        'categoria': 'aprobacion',
        'color': 'blue',
        'icono': 'FileText',
        'plantilla_titulo': 'Solicitud de Permiso',
        'plantilla_mensaje': '{colaborador} solicito un permiso para {fecha}.',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_INCAPACIDAD_REGISTRADA',
        'nombre': 'Incapacidad registrada',
        'descripcion': 'Se registro una incapacidad.',
        'categoria': 'alerta',
        'color': 'orange',
        'icono': 'HeartPulse',
        'plantilla_titulo': 'Incapacidad Registrada',
        'plantilla_mensaje': 'Se registro incapacidad de {colaborador}.',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'TH_CAPACITACION_PROGRAMADA',
        'nombre': 'Capacitacion programada',
        'descripcion': 'Se programo una nueva capacitacion.',
        'categoria': 'recordatorio',
        'color': 'purple',
        'icono': 'GraduationCap',
        'plantilla_titulo': 'Capacitacion Programada',
        'plantilla_mensaje': 'Tiene una capacitacion programada: {nombre}.',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_EVALUACION_PENDIENTE',
        'nombre': 'Evaluacion pendiente',
        'descripcion': 'Tiene una evaluacion de desempeno pendiente.',
        'categoria': 'tarea',
        'color': 'teal',
        'icono': 'ClipboardCheck',
        'plantilla_titulo': 'Evaluacion de Desempeno Pendiente',
        'plantilla_mensaje': 'Tiene una evaluacion de desempeno pendiente.',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_ONBOARDING_TAREA',
        'nombre': 'Tarea de onboarding',
        'descripcion': 'Tiene tareas de onboarding pendientes.',
        'categoria': 'tarea',
        'color': 'green',
        'icono': 'ListChecks',
        'plantilla_titulo': 'Tarea de Onboarding',
        'plantilla_mensaje': 'Tiene tareas de onboarding pendientes.',
        'es_email': True,
        'es_push': True,
    },
    {
        'codigo': 'TH_PERIODO_PRUEBA',
        'nombre': 'Periodo de prueba por vencer',
        'descripcion': 'El periodo de prueba de un colaborador esta por finalizar.',
        'categoria': 'recordatorio',
        'color': 'yellow',
        'icono': 'Clock',
        'plantilla_titulo': 'Periodo de Prueba',
        'plantilla_mensaje': 'El periodo de prueba de {colaborador} finaliza en {dias} dias.',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'TH_HORAS_EXTRA_LIMITE',
        'nombre': 'Limite de horas extra',
        'descripcion': 'Un colaborador esta cerca del limite semanal de horas extra.',
        'categoria': 'alerta',
        'color': 'orange',
        'icono': 'AlertTriangle',
        'plantilla_titulo': 'Limite de Horas Extra',
        'plantilla_mensaje': '{colaborador} tiene {horas}h extra esta semana (limite: 12h).',
        'es_email': True,
        'es_push': False,
    },
    {
        'codigo': 'TH_NOMINA_LIQUIDADA',
        'nombre': 'Nomina liquidada',
        'descripcion': 'Su recibo de nomina esta disponible.',
        'categoria': 'sistema',
        'color': 'green',
        'icono': 'DollarSign',
        'plantilla_titulo': 'Recibo de Nomina Disponible',
        'plantilla_mensaje': 'Su recibo de nomina del periodo {periodo} esta disponible.',
        'es_email': True,
        'es_push': True,
    },
]

# ============================================================================
# DATOS: Configuracion Recargo (Ley 2466/2025)
# ============================================================================

RECARGO_CONFIGS = [
    {
        'tipo_hora_extra': 'extra_diurna',
        'factor_vigente': Decimal('1.25'),
        'factor_fase_1': Decimal('1.25'),
        'factor_fase_2': Decimal('1.25'),
        'factor_fase_3': Decimal('1.25'),
    },
    {
        'tipo_hora_extra': 'extra_nocturna',
        'factor_vigente': Decimal('1.75'),
        'factor_fase_1': Decimal('1.75'),
        'factor_fase_2': Decimal('1.75'),
        'factor_fase_3': Decimal('1.75'),
    },
    {
        'tipo_hora_extra': 'extra_dominical_diurna',
        'factor_vigente': Decimal('2.00'),
        'factor_fase_1': Decimal('2.00'),
        'factor_fase_2': Decimal('2.00'),
        'factor_fase_3': Decimal('2.00'),
    },
    {
        'tipo_hora_extra': 'extra_dominical_nocturna',
        'factor_vigente': Decimal('2.50'),
        'factor_fase_1': Decimal('2.50'),
        'factor_fase_2': Decimal('2.50'),
        'factor_fase_3': Decimal('2.50'),
    },
    {
        'tipo_hora_extra': 'recargo_nocturno',
        'factor_vigente': Decimal('1.35'),
        'factor_fase_1': Decimal('1.35'),
        'factor_fase_2': Decimal('1.35'),
        'factor_fase_3': Decimal('1.35'),
    },
    {
        'tipo_hora_extra': 'recargo_dominical',
        'factor_vigente': Decimal('1.75'),
        'factor_fase_1': Decimal('1.80'),
        'factor_fase_2': Decimal('1.90'),
        'factor_fase_3': Decimal('2.00'),
    },
]


class Command(BaseCommand):
    help = 'Seed Talent Hub enhancements: notification types, recargo configs, RBAC tabs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--company-id', type=int, help='ID de la empresa (usa la primera si no se especifica)'
        )

    def handle(self, *args, **options):
        company_id = options.get('company_id')

        if not company_id:
            from apps.gestion_estrategica.configuracion.models import EmpresaConfig
            empresa = EmpresaConfig.objects.first()
            if not empresa:
                self.stdout.write(self.style.ERROR('No hay empresa configurada.'))
                return
            company_id = empresa.id
            self.stdout.write(f'Usando empresa ID: {company_id}')

        with transaction.atomic():
            self._seed_notification_types(company_id)
            self._seed_recargo_configs(company_id)
            self._seed_rbac_tabs()

        self.stdout.write(self.style.SUCCESS('\nSeed TH Enhancements completado.'))

    def _seed_notification_types(self, company_id):
        """Crea TipoNotificacion con codigos TH_*."""
        self.stdout.write('\n--- Tipos de Notificacion TH ---')
        created = 0
        skipped = 0

        try:
            from apps.audit_system.centro_notificaciones.models import TipoNotificacion
        except ImportError:
            self.stdout.write(self.style.WARNING('TipoNotificacion no disponible, saltando.'))
            return

        for data in NOTIFICATION_TYPES:
            data_copy = {**data, 'empresa_id': company_id}
            codigo = data_copy['codigo']

            if TipoNotificacion.objects.filter(codigo=codigo, empresa_id=company_id).exists():
                self.stdout.write(f'  [SKIP] {codigo}')
                skipped += 1
                continue

            TipoNotificacion.objects.create(**data_copy)
            self.stdout.write(self.style.SUCCESS(f'  [OK] {codigo}'))
            created += 1

        self.stdout.write(f'  Creados: {created}, Existentes: {skipped}')

    def _seed_recargo_configs(self, company_id):
        """Crea ConfiguracionRecargo para los 6 tipos de HE."""
        self.stdout.write('\n--- Configuracion Recargos (Ley 2466) ---')
        created = 0
        skipped = 0

        try:
            from apps.talent_hub.control_tiempo.models import ConfiguracionRecargo
        except ImportError:
            self.stdout.write(self.style.WARNING('ConfiguracionRecargo no disponible, saltando.'))
            return

        for data in RECARGO_CONFIGS:
            tipo = data['tipo_hora_extra']

            if ConfiguracionRecargo.objects.filter(
                tipo_hora_extra=tipo, empresa_id=company_id
            ).exists():
                self.stdout.write(f'  [SKIP] {tipo}')
                skipped += 1
                continue

            ConfiguracionRecargo.objects.create(empresa_id=company_id, **data)
            self.stdout.write(self.style.SUCCESS(f'  [OK] {tipo}'))
            created += 1

        self.stdout.write(f'  Creados: {created}, Existentes: {skipped}')

    def _seed_rbac_tabs(self):
        """Crea ModuleTab y TabSection para ESS y MSS."""
        self.stdout.write('\n--- RBAC Tabs (Mi Portal / Mi Equipo) ---')

        try:
            from apps.core.models.models_system_modules import (
                SystemModule,
                ModuleTab,
                TabSection,
            )
        except ImportError:
            self.stdout.write(self.style.WARNING('SystemModule no disponible, saltando.'))
            return

        # Buscar SystemModule de talent_hub
        th_module = SystemModule.objects.filter(code='talent_hub').first()
        if not th_module:
            self.stdout.write(self.style.WARNING(
                '  SystemModule talent_hub no existe. Ejecute seed de modulos primero.'
            ))
            return

        # Mi Portal (ESS)
        mi_portal_tab, created = ModuleTab.objects.get_or_create(
            module=th_module,
            code='mi_portal',
            defaults={
                'name': 'Mi Portal',
                'description': 'Portal de autoservicio del empleado',
                'icon': 'UserCircle',
                'route': '/mi-portal',
                'orden': 90,
                'is_enabled': True,
                'is_core': True,
            }
        )
        self.stdout.write(
            self.style.SUCCESS(f'  [{"CREATED" if created else "EXISTS"}] Tab: mi_portal')
        )

        # Secciones de Mi Portal
        ess_sections = [
            ('mi_perfil', 'Mi Perfil', 'User', 1),
            ('mis_vacaciones', 'Mis Vacaciones', 'Calendar', 2),
            ('mis_permisos', 'Mis Permisos', 'FileText', 3),
            ('mis_recibos', 'Mis Recibos', 'DollarSign', 4),
            ('mis_capacitaciones', 'Mis Capacitaciones', 'GraduationCap', 5),
        ]

        for code, name, icon, orden in ess_sections:
            _, created = TabSection.objects.get_or_create(
                tab=mi_portal_tab,
                code=code,
                defaults={
                    'name': name,
                    'icon': icon,
                    'orden': orden,
                    'is_enabled': True,
                    'is_core': True,
                }
            )
            self.stdout.write(f'    [{"OK" if created else "SKIP"}] Section: {code}')

        # Mi Equipo (MSS)
        mi_equipo_tab, created = ModuleTab.objects.get_or_create(
            module=th_module,
            code='mi_equipo',
            defaults={
                'name': 'Mi Equipo',
                'description': 'Portal de gestion de equipo para jefes',
                'icon': 'Users',
                'route': '/mi-equipo',
                'orden': 91,
                'is_enabled': True,
                'is_core': True,
            }
        )
        self.stdout.write(
            self.style.SUCCESS(f'  [{"CREATED" if created else "EXISTS"}] Tab: mi_equipo')
        )

        # Secciones de Mi Equipo
        mss_sections = [
            ('equipo_resumen', 'Mi Equipo', 'Users', 1),
            ('aprobaciones', 'Aprobaciones', 'ClipboardCheck', 2),
            ('evaluaciones_equipo', 'Evaluaciones', 'BarChart3', 3),
        ]

        for code, name, icon, orden in mss_sections:
            _, created = TabSection.objects.get_or_create(
                tab=mi_equipo_tab,
                code=code,
                defaults={
                    'name': name,
                    'icon': icon,
                    'orden': orden,
                    'is_enabled': True,
                    'is_core': True,
                }
            )
            self.stdout.write(f'    [{"OK" if created else "SKIP"}] Section: {code}')
