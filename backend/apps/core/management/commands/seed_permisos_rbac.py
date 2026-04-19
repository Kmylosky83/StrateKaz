"""
Management command para crear permisos CRUD del sistema RBAC v3.3.

IMPORTANTE: Los permisos deben corresponder 1:1 con las secciones de TabSection.
Cada sección que permite acciones (CRUD) debe tener sus permisos correspondientes.

Formato de permisos: "modulo.seccion.accion"
- modulo: código del SystemModule (ej: fundacion, planeacion_estrategica)
- seccion: código del TabSection (ej: empresa, sedes, mision_vision)
- accion: view, create, update, delete

Uso:
    python manage.py seed_permisos_rbac
    python manage.py seed_permisos_rbac --verbose
    python manage.py seed_permisos_rbac --dry-run
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.core.models import (
    PermisoModulo,
    PermisoAccion,
    PermisoAlcance,
    Permiso,
)


# =============================================================================
# MAPEO COMPLETO: SECCIONES → PERMISOS
# Cada entrada representa una sección de TabSection con sus permisos CRUD
# =============================================================================

SECCIONES_PERMISOS = {
    # =========================================================================
    # C1 — FUNDACIÓN
    # =========================================================================
    'fundacion': {
        'name': 'Fundación',
        'orden': 10,
        'icon': 'mdi-landmark',
        'secciones': [
            # Tab: Configuración
            {'code': 'empresa', 'name': 'Datos de Empresa', 'acciones': ['view', 'update']},
            {'code': 'sedes', 'name': 'Sedes', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'integraciones', 'name': 'Integraciones', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'branding', 'name': 'Branding', 'acciones': ['view', 'update']},
            {'code': 'modulos', 'name': 'Módulos y Funciones', 'acciones': ['view', 'update']},

            # Tab: Organización
            {'code': 'areas', 'name': 'Áreas', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'cargos', 'name': 'Cargos', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'organigrama', 'name': 'Organigrama', 'acciones': ['view', 'update']},
            {'code': 'colaboradores', 'name': 'Colaboradores', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'roles', 'name': 'Control de Acceso', 'acciones': ['view', 'create', 'update', 'delete']},

            # Tab: Identidad Corporativa
            {'code': 'mision_vision', 'name': 'Misión y Visión', 'acciones': ['view', 'update']},
            {'code': 'valores', 'name': 'Valores Corporativos', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'politicas', 'name': 'Políticas', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # C2 — PLANEACIÓN ESTRATÉGICA
    # =========================================================================
    'planeacion_estrategica': {
        'name': 'Planeación Estratégica',
        'orden': 11,
        'icon': 'mdi-target',
        'secciones': [
            {'code': 'contexto', 'name': 'Contexto Organizacional', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'dofa', 'name': 'Análisis DOFA', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'pestel', 'name': 'Análisis PESTEL', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'porter', 'name': '5 Fuerzas de Porter', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'plan_estrategico', 'name': 'Plan Estratégico', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'objetivos', 'name': 'Objetivos Estratégicos', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: cumplimiento
    # =========================================================================
    'cumplimiento': {
        'name': 'Cumplimiento Normativo',
        'orden': 20,
        'icon': 'mdi-gavel',
        'secciones': [
            {'code': 'matriz_legal', 'name': 'Matriz Legal', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'requisitos_legales', 'name': 'Requisitos Legales', 'acciones': ['view', 'create', 'update', 'delete']},
            # partes_interesadas ELIMINADO — fuente canónica en contexto (C1)
            {'code': 'reglamentos_internos', 'name': 'Reglamentos Internos', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: motor_riesgos
    # =========================================================================
    'motor_riesgos': {
        'name': 'Motor de Riesgos',
        'orden': 21,
        'icon': 'mdi-alert',
        'secciones': [
            {'code': 'riesgos_procesos', 'name': 'Riesgos y Oportunidades', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'ipevr', 'name': 'IPEVR (GTC-45)', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'aspectos_ambientales', 'name': 'Aspectos Ambientales', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'riesgos_viales', 'name': 'Riesgos Viales', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'sagrilaft_ptee', 'name': 'SAGRILAFT/PTEE', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'seguridad_informacion', 'name': 'Seguridad Información', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: workflows
    # =========================================================================
    'workflows': {
        'name': 'Flujos de Trabajo',
        'orden': 22,
        'icon': 'mdi-sitemap',
        'secciones': [
            {'code': 'disenador_flujos', 'name': 'Diseñador de Flujos', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'ejecucion', 'name': 'Ejecución', 'acciones': ['view', 'update']},
            {'code': 'monitoreo', 'name': 'Monitoreo', 'acciones': ['view']},
            {'code': 'firma_digital', 'name': 'Firma Digital', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: hseq
    # =========================================================================
    'hseq': {
        'name': 'Gestión HSEQ',
        'orden': 30,
        'icon': 'mdi-shield-check',
        'secciones': [
            {'code': 'sistema_documental', 'name': 'Sistema Documental', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'planificacion_sistema', 'name': 'Planificación Sistema', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'calidad', 'name': 'Calidad', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'medicina_laboral', 'name': 'Medicina Laboral', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'seguridad_industrial', 'name': 'Seguridad Industrial', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'higiene_industrial', 'name': 'Higiene Industrial', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'gestion_comites', 'name': 'Gestión de Comités', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'accidentalidad', 'name': 'Accidentalidad (ATEL)', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'emergencias', 'name': 'Emergencias', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'gestion_ambiental', 'name': 'Gestión Ambiental', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'mejora_continua', 'name': 'Mejora Continua', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: supply_chain
    # =========================================================================
    'supply_chain': {
        'name': 'Cadena de Suministro',
        'orden': 40,
        'icon': 'mdi-truck-delivery',
        'secciones': [
            {'code': 'gestion_proveedores', 'name': 'Gestión Proveedores', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'catalogos', 'name': 'Catálogos', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'compras', 'name': 'Compras', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'almacenamiento', 'name': 'Almacenamiento', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'recepcion', 'name': 'Recepción', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'liquidaciones', 'name': 'Liquidaciones', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: operaciones
    # =========================================================================
    'operaciones': {
        'name': 'Operaciones',
        'orden': 50,
        'icon': 'mdi-factory',
        'secciones': [
            {'code': 'recepcion', 'name': 'Recepción', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'procesamiento', 'name': 'Procesamiento', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'mantenimiento_industrial', 'name': 'Mantenimiento Industrial', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'producto_terminado', 'name': 'Producto Terminado', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: logistica
    # =========================================================================
    'logistica': {
        'name': 'Logística y Flota',
        'orden': 60,
        'icon': 'mdi-truck',
        'secciones': [
            {'code': 'gestion_transporte', 'name': 'Gestión Transporte', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'despachos', 'name': 'Despachos', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'gestion_flota', 'name': 'Gestión de Flota', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'pesv_operativo', 'name': 'PESV Operativo', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: ventas_crm
    # =========================================================================
    'ventas_crm': {
        'name': 'Ventas y CRM',
        'orden': 70,
        'icon': 'mdi-cash-register',
        'secciones': [
            {'code': 'gestion_clientes', 'name': 'Gestión de Clientes', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'pipeline_ventas', 'name': 'Pipeline Ventas', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'pedidos_facturacion', 'name': 'Pedidos y Facturación', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'servicio_cliente', 'name': 'Servicio al Cliente', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: talento_humano
    # =========================================================================
    'talento_humano': {
        'name': 'Talento Humano',
        'orden': 80,
        'icon': 'mdi-account-group',
        'secciones': [
            {'code': 'estructura_cargos', 'name': 'Estructura de Cargos', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'seleccion_contratacion', 'name': 'Selección/Contratación', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'colaboradores_th', 'name': 'Colaboradores', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'onboarding_induccion', 'name': 'Onboarding/Inducción', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'formacion_reinduccion', 'name': 'Formación/Reinducción', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'desempeno', 'name': 'Desempeño', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'control_tiempo', 'name': 'Control de Tiempo', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'novedades', 'name': 'Novedades', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'proceso_disciplinario', 'name': 'Proceso Disciplinario', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'nomina', 'name': 'Nómina', 'acciones': ['view', 'create', 'update']},
            {'code': 'off_boarding', 'name': 'Off Boarding', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: finanzas
    # =========================================================================
    'finanzas': {
        'name': 'Finanzas y Tesorería',
        'orden': 90,
        'icon': 'mdi-currency-usd',
        'secciones': [
            {'code': 'tesoreria', 'name': 'Tesorería', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'presupuesto', 'name': 'Presupuesto', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'activos_fijos', 'name': 'Activos Fijos', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'servicios_generales', 'name': 'Servicios Generales', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: contabilidad
    # =========================================================================
    'contabilidad': {
        'name': 'Contabilidad',
        'orden': 91,
        'icon': 'mdi-calculator',
        'secciones': [
            {'code': 'config_contable', 'name': 'Config. Contable', 'acciones': ['view', 'update']},
            {'code': 'movimientos', 'name': 'Movimientos', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'informes_contables', 'name': 'Informes Contables', 'acciones': ['view']},
            {'code': 'integracion_contable', 'name': 'Integración', 'acciones': ['view', 'update']},
        ]
    },

    # =========================================================================
    # MÓDULO: analytics
    # =========================================================================
    'analytics': {
        'name': 'Inteligencia de Negocios',
        'orden': 100,
        'icon': 'mdi-chart-bar',
        'secciones': [
            {'code': 'config_indicadores', 'name': 'Config. Indicadores', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'dashboard_gerencial', 'name': 'Dashboard Gerencial', 'acciones': ['view']},
            {'code': 'indicadores_area', 'name': 'Indicadores por Área', 'acciones': ['view']},
            {'code': 'analisis_tendencias', 'name': 'Análisis y Tendencias', 'acciones': ['view']},
            {'code': 'generador_informes', 'name': 'Generador Informes', 'acciones': ['view', 'create']},
            {'code': 'acciones_indicador', 'name': 'Acciones x Indicador', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'exportacion_integracion', 'name': 'Exportación/Integración', 'acciones': ['view', 'create']},
        ]
    },

    # =========================================================================
    # C3 — REVISIÓN POR LA DIRECCIÓN
    # =========================================================================
    'revision_direccion': {
        'name': 'Revisión por la Dirección',
        'orden': 105,
        'icon': 'mdi-clipboard-check',
        'secciones': [
            {'code': 'programacion', 'name': 'Programación', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'actas', 'name': 'Actas', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'compromisos', 'name': 'Compromisos', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # C3 — CENTRO DE CONTROL
    # =========================================================================
    'auditoria': {
        'name': 'Centro de Control',
        'orden': 110,
        'icon': 'mdi-clipboard-check',
        'secciones': [
            {'code': 'logs_sistema', 'name': 'Logs del Sistema', 'acciones': ['view']},
            {'code': 'centro_notificaciones', 'name': 'Centro Notificaciones', 'acciones': ['view', 'update']},
            {'code': 'config_alertas', 'name': 'Config. Alertas', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'tareas_recordatorios', 'name': 'Tareas/Recordatorios', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },

    # =========================================================================
    # MÓDULO: core (Sistema)
    # =========================================================================
    'core': {
        'name': 'Core - Sistema',
        'orden': 1,
        'icon': 'mdi-cog',
        'secciones': [
            {'code': 'usuarios', 'name': 'Usuarios', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'permisos', 'name': 'Permisos', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'roles_sistema', 'name': 'Roles', 'acciones': ['view', 'create', 'update', 'delete']},
            {'code': 'grupos_sistema', 'name': 'Grupos', 'acciones': ['view', 'create', 'update', 'delete']},
        ]
    },
}


class Command(BaseCommand):
    help = 'Crea permisos CRUD para el sistema RBAC v3.3 - Mapeo 1:1 con secciones'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Muestra información detallada',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Solo muestra qué se crearía, sin ejecutar',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        verbose = options['verbose']
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('Modo DRY-RUN: No se crearán registros'))

        # Asegurar datos base
        self._ensure_base_data(verbose, dry_run)

        # Crear permisos por módulo
        total_created = 0
        total_updated = 0

        for modulo_code, modulo_data in SECCIONES_PERMISOS.items():
            created, updated = self._create_modulo_permisos(
                modulo_code, modulo_data, verbose, dry_run
            )
            total_created += created
            total_updated += updated

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(
                f'\nPermisos RBAC v3.3 creados: {total_created} nuevos, {total_updated} actualizados'
            ))
        else:
            self.stdout.write(self.style.WARNING('\nDRY-RUN completado'))

        self._print_summary()

    def _ensure_base_data(self, verbose, dry_run):
        """Asegura que existen las acciones base"""
        acciones = [
            {'code': 'view', 'name': 'Ver', 'orden': 1, 'icon': 'mdi-eye'},
            {'code': 'create', 'name': 'Crear', 'orden': 2, 'icon': 'mdi-plus'},
            {'code': 'update', 'name': 'Actualizar', 'orden': 3, 'icon': 'mdi-pencil'},
            {'code': 'delete', 'name': 'Eliminar', 'orden': 4, 'icon': 'mdi-delete'},
        ]

        alcances = [
            {'code': 'empresa', 'name': 'Empresa', 'nivel': 4, 'description': 'Todos los registros de la empresa'},
        ]

        if not dry_run:
            for a in acciones:
                PermisoAccion.objects.update_or_create(
                    code=a['code'],
                    defaults={'name': a['name'], 'orden': a['orden'], 'icon': a.get('icon')}
                )

            for alc in alcances:
                PermisoAlcance.objects.update_or_create(
                    code=alc['code'],
                    defaults={'name': alc['name'], 'nivel': alc['nivel'], 'description': alc.get('description')}
                )

    def _create_modulo_permisos(self, modulo_code, modulo_data, verbose, dry_run):
        """Crea permisos para un módulo completo"""
        self.stdout.write(self.style.HTTP_INFO(f'\n{modulo_data["name"]}:'))

        created_count = 0
        updated_count = 0

        # Crear/obtener módulo
        if not dry_run:
            modulo, _ = PermisoModulo.objects.update_or_create(
                code=modulo_code,
                defaults={
                    'name': modulo_data['name'],
                    'orden': modulo_data['orden'],
                    'icon': modulo_data.get('icon')
                }
            )
            alcance = PermisoAlcance.objects.get(code='empresa')

        # Crear permisos por sección
        for seccion in modulo_data['secciones']:
            for accion in seccion['acciones']:
                code = f"{modulo_code}.{seccion['code']}.{accion}"
                name = f"{self._get_accion_verbo(accion)} {seccion['name']}"

                if dry_run:
                    self.stdout.write(f'  [DRY] {code}')
                    continue

                try:
                    accion_obj = PermisoAccion.objects.get(code=accion)

                    obj, was_created = Permiso.objects.update_or_create(
                        code=code,
                        defaults={
                            'name': name,
                            'modulo': modulo,
                            'accion': accion_obj,
                            'alcance': alcance,
                            'recurso': seccion['code'],
                            'description': f"{self._get_accion_verbo(accion)} en {seccion['name']}",
                            'is_active': True,
                        }
                    )

                    if was_created:
                        created_count += 1
                        if verbose:
                            self.stdout.write(f'  + {code}')
                    else:
                        updated_count += 1
                        if verbose:
                            self.stdout.write(f'  ~ {code}')

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  Error: {code} - {str(e)}'))

        if not dry_run:
            total_permisos = sum(len(s['acciones']) for s in modulo_data['secciones'])
            self.stdout.write(f'  {created_count} creados, {updated_count} actualizados (de {total_permisos} total)')

        return created_count, updated_count

    def _get_accion_verbo(self, accion):
        """Convierte código de acción a verbo en español"""
        verbos = {
            'view': 'Ver',
            'create': 'Crear',
            'update': 'Actualizar',
            'delete': 'Eliminar',
        }
        return verbos.get(accion, accion.capitalize())

    def _print_summary(self):
        """Imprime resumen de permisos"""
        self.stdout.write('')
        self.stdout.write(self.style.HTTP_INFO('=' * 50))
        self.stdout.write(self.style.HTTP_INFO('RESUMEN PERMISOS RBAC v3.3'))
        self.stdout.write(self.style.HTTP_INFO('=' * 50))

        total_secciones = 0
        total_permisos_esperados = 0

        for modulo_code, modulo_data in SECCIONES_PERMISOS.items():
            secciones = len(modulo_data['secciones'])
            permisos = sum(len(s['acciones']) for s in modulo_data['secciones'])
            total_secciones += secciones
            total_permisos_esperados += permisos

            # Contar en BD
            bd_count = Permiso.objects.filter(
                modulo__code=modulo_code, is_active=True
            ).count()

            status = '[OK]' if bd_count == permisos else f'[!] ({bd_count})'
            self.stdout.write(f'  {modulo_data["name"]}: {secciones} secciones, {permisos} permisos {status}')

        self.stdout.write('')
        self.stdout.write(f'  TOTAL: {total_secciones} secciones, {total_permisos_esperados} permisos esperados')

        total_bd = Permiso.objects.filter(is_active=True).count()
        self.stdout.write(f'  EN BD: {total_bd} permisos activos')

        self.stdout.write('')
        self.stdout.write('Formato de código: "modulo.seccion.accion"')
        self.stdout.write('Ejemplo: "fundacion.empresa.update"')
        self.stdout.write('')
        self.stdout.write('NOTA: El código de sección debe coincidir con TabSection.code')
