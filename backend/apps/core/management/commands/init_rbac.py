"""
Management command para inicializar el sistema RBAC dinamico.

Crea los datos base necesarios para el funcionamiento del sistema:
- Modulos de permisos
- Acciones de permisos
- Alcances de permisos
- Tipos de grupos
- Cargos base
- Roles base
- Grupos base

Todos los datos son configurables desde la UI/API despues de creados.

Uso:
    python manage.py init_rbac
    python manage.py init_rbac --reset  # Elimina y recrea todo
    python manage.py init_rbac --verbose  # Muestra detalle
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.core.models import (
    PermisoModulo,
    PermisoAccion,
    PermisoAlcance,
    Permiso,
    GrupoTipo,
    Cargo,
    Role,
    Group,
)


class Command(BaseCommand):
    help = 'Inicializa el sistema RBAC con datos base dinamicos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Elimina todos los datos RBAC y los recrea',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Muestra informacion detallada',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        reset = options['reset']
        verbose = options['verbose']

        if reset:
            self.stdout.write(self.style.WARNING('Reseteando sistema RBAC...'))
            self._reset_rbac()

        # Crear en orden de dependencias
        self._create_modulos(verbose)
        self._create_acciones(verbose)
        self._create_alcances(verbose)
        self._create_tipos_grupo(verbose)
        self._create_permisos_base(verbose)
        self._create_cargos(verbose)
        self._create_roles(verbose)
        self._create_grupos(verbose)

        self.stdout.write(self.style.SUCCESS('Sistema RBAC inicializado correctamente'))
        self._print_summary()

    def _reset_rbac(self):
        """Elimina todos los datos RBAC para recrear desde cero"""
        # Eliminar en orden inverso de dependencias
        Permiso.objects.all().delete()
        Group.objects.all().delete()
        Role.objects.all().delete()
        # No eliminamos Cargo porque puede tener usuarios asignados
        GrupoTipo.objects.all().delete()
        PermisoAlcance.objects.all().delete()
        PermisoAccion.objects.all().delete()
        PermisoModulo.objects.all().delete()
        self.stdout.write('  - Datos RBAC eliminados')

    def _create_modulos(self, verbose):
        """Crea modulos de permisos base"""
        modulos = [
            {'code': 'CORE', 'name': 'Core - Usuarios y Configuracion', 'orden': 1, 'icon': 'mdi-cog'},
            {'code': 'IDENTIDAD', 'name': 'Identidad Corporativa', 'orden': 5, 'icon': 'mdi-certificate'},
            {'code': 'DIRECCION_ESTRATEGICA', 'name': 'Direccion Estrategica', 'orden': 10, 'icon': 'mdi-target'},
            {'code': 'CUMPLIMIENTO', 'name': 'Cumplimiento Normativo', 'orden': 20, 'icon': 'mdi-gavel'},
            {'code': 'RIESGOS', 'name': 'Motor de Riesgos', 'orden': 21, 'icon': 'mdi-alert'},
            {'code': 'WORKFLOWS', 'name': 'Flujos de Trabajo', 'orden': 22, 'icon': 'mdi-sitemap'},
            {'code': 'HSEQ', 'name': 'Gestion HSEQ', 'orden': 30, 'icon': 'mdi-shield-check'},
            {'code': 'SST', 'name': 'Seguridad y Salud en el Trabajo', 'orden': 31, 'icon': 'mdi-hard-hat'},
            {'code': 'CALIDAD', 'name': 'Gestion de Calidad', 'orden': 32, 'icon': 'mdi-certificate'},
            {'code': 'AMBIENTAL', 'name': 'Gestion Ambiental', 'orden': 33, 'icon': 'mdi-leaf'},
            {'code': 'SUPPLY_CHAIN', 'name': 'Cadena de Suministro', 'orden': 40, 'icon': 'mdi-truck-delivery'},
            {'code': 'PROVEEDORES', 'name': 'Gestion de Proveedores', 'orden': 41, 'icon': 'mdi-handshake'},
            {'code': 'COMPRAS', 'name': 'Compras', 'orden': 42, 'icon': 'mdi-cart'},
            {'code': 'ALMACEN', 'name': 'Almacenamiento', 'orden': 43, 'icon': 'mdi-warehouse'},
            {'code': 'OPERACIONES', 'name': 'Operaciones', 'orden': 50, 'icon': 'mdi-factory'},
            {'code': 'RECEPCION', 'name': 'Recepcion de Materiales', 'orden': 51, 'icon': 'mdi-package-down'},
            {'code': 'PROCESAMIENTO', 'name': 'Procesamiento', 'orden': 52, 'icon': 'mdi-cogs'},
            {'code': 'LOGISTICA', 'name': 'Logistica y Flota', 'orden': 60, 'icon': 'mdi-truck'},
            {'code': 'VENTAS', 'name': 'Ventas y CRM', 'orden': 70, 'icon': 'mdi-cash-register'},
            {'code': 'TALENTO', 'name': 'Talento Humano', 'orden': 80, 'icon': 'mdi-account-group'},
            {'code': 'FINANZAS', 'name': 'Finanzas y Tesoreria', 'orden': 90, 'icon': 'mdi-currency-usd'},
            {'code': 'CONTABILIDAD', 'name': 'Contabilidad', 'orden': 91, 'icon': 'mdi-calculator'},
            {'code': 'ANALYTICS', 'name': 'Inteligencia de Negocios', 'orden': 100, 'icon': 'mdi-chart-bar'},
            {'code': 'AUDITORIA', 'name': 'Sistema de Auditorias', 'orden': 110, 'icon': 'mdi-clipboard-check'},
        ]

        created = 0
        for m in modulos:
            obj, was_created = PermisoModulo.objects.update_or_create(
                code=m['code'],
                defaults={'name': m['name'], 'orden': m['orden'], 'icon': m.get('icon')}
            )
            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Modulo: {m["code"]}')

        self.stdout.write(f'Modulos: {created} creados, {len(modulos) - created} existentes')

    def _create_acciones(self, verbose):
        """Crea tipos de acciones base"""
        acciones = [
            {'code': 'VIEW', 'name': 'Ver', 'orden': 1, 'icon': 'mdi-eye'},
            {'code': 'VIEW_LIST', 'name': 'Ver Lista', 'orden': 2, 'icon': 'mdi-format-list-bulleted'},
            {'code': 'VIEW_DETAIL', 'name': 'Ver Detalle', 'orden': 3, 'icon': 'mdi-file-document'},
            {'code': 'CREATE', 'name': 'Crear', 'orden': 10, 'icon': 'mdi-plus'},
            {'code': 'EDIT', 'name': 'Editar', 'orden': 20, 'icon': 'mdi-pencil'},
            {'code': 'DELETE', 'name': 'Eliminar', 'orden': 30, 'icon': 'mdi-delete'},
            {'code': 'APPROVE', 'name': 'Aprobar', 'orden': 40, 'icon': 'mdi-check-circle'},
            {'code': 'REJECT', 'name': 'Rechazar', 'orden': 41, 'icon': 'mdi-close-circle'},
            {'code': 'CANCEL', 'name': 'Cancelar', 'orden': 42, 'icon': 'mdi-cancel'},
            {'code': 'EXPORT', 'name': 'Exportar', 'orden': 50, 'icon': 'mdi-download'},
            {'code': 'IMPORT', 'name': 'Importar', 'orden': 51, 'icon': 'mdi-upload'},
            {'code': 'PRINT', 'name': 'Imprimir', 'orden': 52, 'icon': 'mdi-printer'},
            {'code': 'MANAGE', 'name': 'Administrar', 'orden': 60, 'icon': 'mdi-cog'},
            {'code': 'ASSIGN', 'name': 'Asignar', 'orden': 70, 'icon': 'mdi-account-plus'},
            {'code': 'EXECUTE', 'name': 'Ejecutar', 'orden': 80, 'icon': 'mdi-play'},
            {'code': 'AUDIT', 'name': 'Auditar', 'orden': 90, 'icon': 'mdi-clipboard-check'},
            # Acciones para workflow de firmas digitales
            {'code': 'SIGN', 'name': 'Firmar', 'orden': 100, 'icon': 'mdi-draw'},
            {'code': 'DELEGATE', 'name': 'Delegar Firma', 'orden': 101, 'icon': 'mdi-account-arrow-right'},
            {'code': 'VERIFY', 'name': 'Verificar Firma', 'orden': 102, 'icon': 'mdi-check-decagram'},
        ]

        created = 0
        for a in acciones:
            obj, was_created = PermisoAccion.objects.update_or_create(
                code=a['code'],
                defaults={'name': a['name'], 'orden': a['orden'], 'icon': a.get('icon')}
            )
            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Accion: {a["code"]}')

        self.stdout.write(f'Acciones: {created} creadas, {len(acciones) - created} existentes')

    def _create_alcances(self, verbose):
        """Crea alcances/scopes de permisos"""
        alcances = [
            {'code': 'OWN', 'name': 'Propios', 'nivel': 0, 'description': 'Solo registros creados por el usuario'},
            {'code': 'TEAM', 'name': 'Equipo', 'nivel': 1, 'description': 'Registros del equipo/grupo del usuario'},
            {'code': 'AREA', 'name': 'Area', 'nivel': 2, 'description': 'Registros del area del usuario'},
            {'code': 'SEDE', 'name': 'Sede', 'nivel': 3, 'description': 'Registros de la sede del usuario'},
            {'code': 'EMPRESA', 'name': 'Empresa', 'nivel': 4, 'description': 'Todos los registros de la empresa'},
            {'code': 'ALL', 'name': 'Todos', 'nivel': 5, 'description': 'Todos los registros (multi-empresa)'},
        ]

        created = 0
        for a in alcances:
            obj, was_created = PermisoAlcance.objects.update_or_create(
                code=a['code'],
                defaults={'name': a['name'], 'nivel': a['nivel'], 'description': a.get('description')}
            )
            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Alcance: {a["code"]}')

        self.stdout.write(f'Alcances: {created} creados, {len(alcances) - created} existentes')

    def _create_tipos_grupo(self, verbose):
        """Crea tipos de grupos base"""
        tipos = [
            {'code': 'EQUIPO', 'name': 'Equipo de Trabajo', 'orden': 1, 'icon': 'mdi-account-group', 'color': '#2196F3'},
            {'code': 'COMITE', 'name': 'Comite', 'orden': 2, 'icon': 'mdi-account-multiple', 'color': '#4CAF50'},
            {'code': 'DEPARTAMENTO', 'name': 'Departamento', 'orden': 3, 'icon': 'mdi-domain', 'color': '#FF9800'},
            {'code': 'PROYECTO', 'name': 'Proyecto', 'orden': 4, 'icon': 'mdi-clipboard-list', 'color': '#9C27B0'},
            {'code': 'TEMPORAL', 'name': 'Temporal', 'orden': 5, 'icon': 'mdi-clock-outline', 'color': '#607D8B'},
        ]

        created = 0
        for t in tipos:
            obj, was_created = GrupoTipo.objects.update_or_create(
                code=t['code'],
                defaults={'name': t['name'], 'orden': t['orden'], 'icon': t.get('icon'), 'color': t.get('color')}
            )
            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Tipo Grupo: {t["code"]}')

        self.stdout.write(f'Tipos de Grupo: {created} creados, {len(tipos) - created} existentes')

    def _create_permisos_base(self, verbose):
        """Crea permisos base del sistema"""
        # Obtener referencias
        try:
            modulo_core = PermisoModulo.objects.get(code='CORE')
            accion_view = PermisoAccion.objects.get(code='VIEW')
            accion_create = PermisoAccion.objects.get(code='CREATE')
            accion_edit = PermisoAccion.objects.get(code='EDIT')
            accion_delete = PermisoAccion.objects.get(code='DELETE')
            accion_manage = PermisoAccion.objects.get(code='MANAGE')
            alcance_all = PermisoAlcance.objects.get(code='ALL')
            alcance_empresa = PermisoAlcance.objects.get(code='EMPRESA')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'No se pudieron crear permisos base: {e}'))
            return

        # Permisos de usuarios
        permisos_usuarios = [
            {'code': 'core.users.view', 'name': 'Ver usuarios', 'modulo': modulo_core, 'accion': accion_view, 'alcance': alcance_empresa, 'recurso': 'users'},
            {'code': 'core.users.create', 'name': 'Crear usuarios', 'modulo': modulo_core, 'accion': accion_create, 'alcance': alcance_empresa, 'recurso': 'users'},
            {'code': 'core.users.edit', 'name': 'Editar usuarios', 'modulo': modulo_core, 'accion': accion_edit, 'alcance': alcance_empresa, 'recurso': 'users'},
            {'code': 'core.users.delete', 'name': 'Eliminar usuarios', 'modulo': modulo_core, 'accion': accion_delete, 'alcance': alcance_empresa, 'recurso': 'users'},
            {'code': 'core.users.manage', 'name': 'Administrar usuarios', 'modulo': modulo_core, 'accion': accion_manage, 'alcance': alcance_all, 'recurso': 'users'},
        ]

        # Permisos de roles
        permisos_roles = [
            {'code': 'core.roles.view', 'name': 'Ver roles', 'modulo': modulo_core, 'accion': accion_view, 'alcance': alcance_empresa, 'recurso': 'roles'},
            {'code': 'core.roles.create', 'name': 'Crear roles', 'modulo': modulo_core, 'accion': accion_create, 'alcance': alcance_empresa, 'recurso': 'roles'},
            {'code': 'core.roles.edit', 'name': 'Editar roles', 'modulo': modulo_core, 'accion': accion_edit, 'alcance': alcance_empresa, 'recurso': 'roles'},
            {'code': 'core.roles.delete', 'name': 'Eliminar roles', 'modulo': modulo_core, 'accion': accion_delete, 'alcance': alcance_empresa, 'recurso': 'roles'},
            {'code': 'core.roles.manage', 'name': 'Administrar roles', 'modulo': modulo_core, 'accion': accion_manage, 'alcance': alcance_all, 'recurso': 'roles'},
        ]

        # Permisos de cargos
        permisos_cargos = [
            {'code': 'core.cargos.view', 'name': 'Ver cargos', 'modulo': modulo_core, 'accion': accion_view, 'alcance': alcance_empresa, 'recurso': 'cargos'},
            {'code': 'core.cargos.create', 'name': 'Crear cargos', 'modulo': modulo_core, 'accion': accion_create, 'alcance': alcance_empresa, 'recurso': 'cargos'},
            {'code': 'core.cargos.edit', 'name': 'Editar cargos', 'modulo': modulo_core, 'accion': accion_edit, 'alcance': alcance_empresa, 'recurso': 'cargos'},
            {'code': 'core.cargos.delete', 'name': 'Eliminar cargos', 'modulo': modulo_core, 'accion': accion_delete, 'alcance': alcance_empresa, 'recurso': 'cargos'},
        ]

        # Permisos de configuracion
        permisos_config = [
            {'code': 'core.config.view', 'name': 'Ver configuracion', 'modulo': modulo_core, 'accion': accion_view, 'alcance': alcance_empresa, 'recurso': 'config'},
            {'code': 'core.config.manage', 'name': 'Administrar configuracion', 'modulo': modulo_core, 'accion': accion_manage, 'alcance': alcance_all, 'recurso': 'config'},
        ]

        # ==================== PERMISOS IDENTIDAD CORPORATIVA ====================
        # Obtener modulo y acciones adicionales para identidad
        try:
            modulo_identidad = PermisoModulo.objects.get(code='IDENTIDAD')
            accion_sign = PermisoAccion.objects.get(code='SIGN')
            accion_delegate = PermisoAccion.objects.get(code='DELEGATE')
            accion_verify = PermisoAccion.objects.get(code='VERIFY')
            accion_approve = PermisoAccion.objects.get(code='APPROVE')
            accion_export = PermisoAccion.objects.get(code='EXPORT')
        except Exception:
            modulo_identidad = None

        permisos_identidad = []
        if modulo_identidad:
            permisos_identidad = [
                # Identidad corporativa (mision, vision, politica)
                {'code': 'identidad.identity.view', 'name': 'Ver identidad corporativa', 'modulo': modulo_identidad, 'accion': accion_view, 'alcance': alcance_empresa, 'recurso': 'identity'},
                {'code': 'identidad.identity.create', 'name': 'Crear identidad corporativa', 'modulo': modulo_identidad, 'accion': accion_create, 'alcance': alcance_empresa, 'recurso': 'identity'},
                {'code': 'identidad.identity.edit', 'name': 'Editar identidad corporativa', 'modulo': modulo_identidad, 'accion': accion_edit, 'alcance': alcance_empresa, 'recurso': 'identity'},
                {'code': 'identidad.identity.delete', 'name': 'Eliminar identidad corporativa', 'modulo': modulo_identidad, 'accion': accion_delete, 'alcance': alcance_empresa, 'recurso': 'identity'},
                {'code': 'identidad.identity.approve', 'name': 'Aprobar identidad corporativa', 'modulo': modulo_identidad, 'accion': accion_approve, 'alcance': alcance_empresa, 'recurso': 'identity'},
                {'code': 'identidad.identity.export', 'name': 'Exportar identidad corporativa', 'modulo': modulo_identidad, 'accion': accion_export, 'alcance': alcance_empresa, 'recurso': 'identity'},

                # Valores corporativos
                {'code': 'identidad.values.view', 'name': 'Ver valores corporativos', 'modulo': modulo_identidad, 'accion': accion_view, 'alcance': alcance_empresa, 'recurso': 'values'},
                {'code': 'identidad.values.create', 'name': 'Crear valores corporativos', 'modulo': modulo_identidad, 'accion': accion_create, 'alcance': alcance_empresa, 'recurso': 'values'},
                {'code': 'identidad.values.edit', 'name': 'Editar valores corporativos', 'modulo': modulo_identidad, 'accion': accion_edit, 'alcance': alcance_empresa, 'recurso': 'values'},
                {'code': 'identidad.values.delete', 'name': 'Eliminar valores corporativos', 'modulo': modulo_identidad, 'accion': accion_delete, 'alcance': alcance_empresa, 'recurso': 'values'},

                # Politica integral
                {'code': 'identidad.policy.view', 'name': 'Ver politica integral', 'modulo': modulo_identidad, 'accion': accion_view, 'alcance': alcance_empresa, 'recurso': 'policy'},
                {'code': 'identidad.policy.edit', 'name': 'Editar politica integral', 'modulo': modulo_identidad, 'accion': accion_edit, 'alcance': alcance_empresa, 'recurso': 'policy'},
                {'code': 'identidad.policy.sign', 'name': 'Firmar politica integral', 'modulo': modulo_identidad, 'accion': accion_sign, 'alcance': alcance_empresa, 'recurso': 'policy'},
                {'code': 'identidad.policy.delegate', 'name': 'Delegar firma de politica', 'modulo': modulo_identidad, 'accion': accion_delegate, 'alcance': alcance_empresa, 'recurso': 'policy'},
                {'code': 'identidad.policy.verify', 'name': 'Verificar firma de politica', 'modulo': modulo_identidad, 'accion': accion_verify, 'alcance': alcance_empresa, 'recurso': 'policy'},

                # Showcase publico
                {'code': 'identidad.showcase.view', 'name': 'Ver showcase publico', 'modulo': modulo_identidad, 'accion': accion_view, 'alcance': alcance_empresa, 'recurso': 'showcase'},
                {'code': 'identidad.showcase.manage', 'name': 'Administrar showcase', 'modulo': modulo_identidad, 'accion': accion_manage, 'alcance': alcance_empresa, 'recurso': 'showcase'},
            ]

        all_permisos = permisos_usuarios + permisos_roles + permisos_cargos + permisos_config + permisos_identidad

        created = 0
        for p in all_permisos:
            obj, was_created = Permiso.objects.update_or_create(
                code=p['code'],
                defaults={
                    'name': p['name'],
                    'modulo': p['modulo'],
                    'accion': p['accion'],
                    'alcance': p['alcance'],
                    'recurso': p.get('recurso'),
                }
            )
            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Permiso: {p["code"]}')

        self.stdout.write(f'Permisos: {created} creados, {len(all_permisos) - created} existentes')

    def _create_cargos(self, verbose):
        """Crea cargos base"""
        cargos = [
            # Nivel 3 - Direccion
            {'code': 'gerente_general', 'name': 'Gerente General', 'level': 3, 'nivel_jerarquico': 'ESTRATEGICO'},
            {'code': 'gerente', 'name': 'Gerente', 'level': 3, 'nivel_jerarquico': 'ESTRATEGICO'},
            {'code': 'director', 'name': 'Director', 'level': 3, 'nivel_jerarquico': 'ESTRATEGICO'},

            # Nivel 2 - Coordinacion
            {'code': 'coordinador', 'name': 'Coordinador', 'level': 2, 'nivel_jerarquico': 'TACTICO'},
            {'code': 'jefe_area', 'name': 'Jefe de Area', 'level': 2, 'nivel_jerarquico': 'TACTICO'},
            {'code': 'lider', 'name': 'Lider', 'level': 2, 'nivel_jerarquico': 'TACTICO'},

            # Nivel 1 - Supervision
            {'code': 'supervisor', 'name': 'Supervisor', 'level': 1, 'nivel_jerarquico': 'OPERATIVO'},
            {'code': 'profesional', 'name': 'Profesional', 'level': 1, 'nivel_jerarquico': 'OPERATIVO'},
            {'code': 'analista', 'name': 'Analista', 'level': 1, 'nivel_jerarquico': 'OPERATIVO'},

            # Nivel 0 - Operativo
            {'code': 'tecnico', 'name': 'Tecnico', 'level': 0, 'nivel_jerarquico': 'OPERATIVO'},
            {'code': 'auxiliar', 'name': 'Auxiliar', 'level': 0, 'nivel_jerarquico': 'OPERATIVO'},
            {'code': 'operario', 'name': 'Operario', 'level': 0, 'nivel_jerarquico': 'OPERATIVO'},
        ]

        created = 0
        for c in cargos:
            obj, was_created = Cargo.objects.update_or_create(
                code=c['code'],
                defaults={
                    'name': c['name'],
                    'level': c['level'],
                    'nivel_jerarquico': c.get('nivel_jerarquico', 'OPERATIVO'),
                }
            )
            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Cargo: {c["code"]}')

        self.stdout.write(f'Cargos: {created} creados, {len(cargos) - created} existentes')

    def _create_roles(self, verbose):
        """Crea roles base"""
        roles = [
            {'code': 'superadmin', 'name': 'Super Administrador', 'description': 'Acceso total al sistema'},
            {'code': 'admin', 'name': 'Administrador', 'description': 'Administracion general del sistema'},
            {'code': 'gestor', 'name': 'Gestor', 'description': 'Gestion de registros'},
            {'code': 'aprobador', 'name': 'Aprobador', 'description': 'Aprobacion de registros'},
            {'code': 'auditor', 'name': 'Auditor', 'description': 'Auditoria del sistema'},
            {'code': 'reporteador', 'name': 'Reporteador', 'description': 'Generacion de reportes'},
            {'code': 'visualizador', 'name': 'Visualizador', 'description': 'Solo lectura'},
        ]

        created = 0
        for r in roles:
            obj, was_created = Role.objects.update_or_create(
                code=r['code'],
                defaults={'name': r['name'], 'description': r.get('description')}
            )
            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Rol: {r["code"]}')

        self.stdout.write(f'Roles: {created} creados, {len(roles) - created} existentes')

    def _create_grupos(self, verbose):
        """Crea grupos base"""
        try:
            tipo_equipo = GrupoTipo.objects.get(code='EQUIPO')
            tipo_comite = GrupoTipo.objects.get(code='COMITE')
        except GrupoTipo.DoesNotExist:
            self.stdout.write(self.style.WARNING('No se encontraron tipos de grupo'))
            return

        grupos = [
            {'code': 'equipo_operaciones', 'name': 'Equipo de Operaciones', 'tipo': tipo_equipo},
            {'code': 'equipo_administracion', 'name': 'Equipo de Administracion', 'tipo': tipo_equipo},
            {'code': 'equipo_calidad', 'name': 'Equipo de Calidad', 'tipo': tipo_equipo},
            {'code': 'equipo_sst', 'name': 'Equipo SST', 'tipo': tipo_equipo},
            {'code': 'comite_sst', 'name': 'COPASST', 'tipo': tipo_comite},
            {'code': 'comite_convivencia', 'name': 'Comite de Convivencia', 'tipo': tipo_comite},
        ]

        created = 0
        for g in grupos:
            obj, was_created = Group.objects.update_or_create(
                code=g['code'],
                defaults={'name': g['name'], 'tipo': g.get('tipo')}
            )
            if was_created:
                created += 1
                if verbose:
                    self.stdout.write(f'  + Grupo: {g["code"]}')

        self.stdout.write(f'Grupos: {created} creados, {len(grupos) - created} existentes')

    def _print_summary(self):
        """Imprime resumen del sistema RBAC"""
        self.stdout.write('')
        self.stdout.write(self.style.HTTP_INFO('=== Resumen Sistema RBAC Dinamico ==='))
        self.stdout.write(f'  Modulos de Permisos: {PermisoModulo.objects.filter(is_active=True).count()}')
        self.stdout.write(f'  Tipos de Accion: {PermisoAccion.objects.filter(is_active=True).count()}')
        self.stdout.write(f'  Alcances: {PermisoAlcance.objects.filter(is_active=True).count()}')
        self.stdout.write(f'  Tipos de Grupo: {GrupoTipo.objects.filter(is_active=True).count()}')
        self.stdout.write(f'  Permisos: {Permiso.objects.filter(is_active=True).count()}')
        self.stdout.write(f'  Cargos: {Cargo.objects.filter(is_active=True).count()}')
        self.stdout.write(f'  Roles: {Role.objects.filter(is_active=True).count()}')
        self.stdout.write(f'  Grupos: {Group.objects.filter(is_active=True).count()}')
        self.stdout.write('')
        self.stdout.write('NOTA: Todos estos datos son configurables desde la UI/API')
