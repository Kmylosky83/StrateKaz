"""
Comando de deploy: Ejecuta seeds críticos en TODOS los tenant schemas.

Automatiza la ejecución de management commands que necesitan correr
en cada schema de tenant después de un deploy.

Uso:
    python manage.py deploy_seeds_all_tenants
    python manage.py deploy_seeds_all_tenants --only roles
    python manage.py deploy_seeds_all_tenants --only unidades
    python manage.py deploy_seeds_all_tenants --tenant demo
    python manage.py deploy_seeds_all_tenants --verbose
"""

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django_tenants.utils import schema_context


class Command(BaseCommand):
    help = 'Ejecuta seeds críticos en todos los tenant schemas (post-deploy)'

    # Seeds que corren en schema PUBLIC (antes de los tenant seeds)
    PUBLIC_SEEDS = [
        ('biblioteca', 'seed_biblioteca_plantillas', [], 'Biblioteca Maestra de plantillas StrateKaz (schema public)'),
    ]

    # Seeds que corren en cada TENANT schema
    AVAILABLE_SEEDS = [
        ('roles', 'init_roles_sugeridos', ['--reset'], 'Roles sugeridos (18 roles normativa colombiana)'),
        ('permisos', 'seed_permisos_rbac', [], 'Permisos RBAC'),
        ('estructura', 'seed_estructura_final', [], 'Estructura de módulos y secciones'),
        ('unidades', 'seed_configuracion_sistema', [], 'Unidades de medida y configuración base'),
        ('notificaciones', 'seed_notification_types', [], 'Tipos de notificación'),
        ('documentos_sgi', 'seed_tipos_documento_sgi', [], 'Tipos de Documento estándar SGI (12 tipos ISO)'),
        ('plantillas_sgi', 'seed_plantillas_sgi', [], 'Plantillas SGI desde Biblioteca Maestra (public → tenant)'),
        ('consecutivos', 'seed_consecutivos_sistema', [], 'Consecutivos del sistema (22 códigos base + módulos)'),
        ('catalogo_productos', 'seed_catalogo_productos_base', [], 'Catálogo de Productos base (12 unidades + 4 categorías raíz)'),
        ('supply_chain', 'seed_supply_chain_catalogs', [], 'Catálogos Supply Chain (tipos proveedor, documentos, departamentos, ciudades)'),
        ('grupos_pi', 'seed_grupos_partes_interesadas', [], 'Grupos de Partes Interesadas (catálogo base ISO 9001 §4.2)'),
        ('tipos_pi', 'seed_tipos_parte_interesada', [], 'Tipos de Partes Interesadas (ejemplos opcionales por grupo)'),
        ('procesos', 'seed_procesos_base', [], 'Catálogo base de procesos organizacionales (17 procesos ISO)'),
        ('cargos', 'seed_cargos_base', [], 'Catálogo base de cargos organizacionales (13 cargos)'),
        # ('juego_sst', 'seed_juego_sst', [], 'Juego SST: Nivel 1 + 10 preguntas quiz (Los Héroes de la Seguridad) [gamificacion]'),
        ('tipos_dofa', 'seed_tipos_analisis_dofa', [], 'Tipos de Análisis DOFA (10 catálogos estándar)'),
        ('tipos_pestel', 'seed_tipos_analisis_pestel', [], 'Tipos de Análisis PESTEL (10 catálogos estándar)'),
        ('preguntas_pci', 'seed_preguntas_pci_poam', [], 'Banco de preguntas PCI-POAM (75 preguntas estándar)'),
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            '--only',
            type=str,
            help=(
                f'Ejecutar solo un seed específico. '
                f'Public: {", ".join(s[0] for s in self.PUBLIC_SEEDS)}. '
                f'Tenant: {", ".join(s[0] for s in self.AVAILABLE_SEEDS)}'
            ),
        )
        parser.add_argument(
            '--tenant',
            type=str,
            help='Ejecutar solo en un tenant específico (schema_name sin prefijo tenant_)',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Mostrar output detallado de cada seed',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Solo mostrar qué se ejecutaría, sin ejecutar',
        )

    def handle(self, *args, **options):
        from apps.tenant.models import Tenant

        only = options.get('only')
        tenant_filter = options.get('tenant')
        verbose = options.get('verbose', False)
        dry_run = options.get('dry_run', False)

        # Filtrar seeds
        all_codes = [s[0] for s in self.PUBLIC_SEEDS] + [s[0] for s in self.AVAILABLE_SEEDS]
        if only:
            is_public = any(s[0] == only for s in self.PUBLIC_SEEDS)
            is_tenant = any(s[0] == only for s in self.AVAILABLE_SEEDS)
            if not is_public and not is_tenant:
                self.stderr.write(self.style.ERROR(
                    f'Seed "{only}" no encontrado. Disponibles: {", ".join(all_codes)}'
                ))
                return
            seeds = [s for s in self.AVAILABLE_SEEDS if s[0] == only] if is_tenant else []
        else:
            seeds = self.AVAILABLE_SEEDS

        # Obtener tenants (excluir public)
        tenants = Tenant.objects.exclude(schema_name='public')
        if tenant_filter:
            schema = f'tenant_{tenant_filter}' if not tenant_filter.startswith('tenant_') else tenant_filter
            tenants = tenants.filter(schema_name=schema)
            if not tenants.exists():
                self.stderr.write(self.style.ERROR(f'Tenant con schema "{schema}" no encontrado.'))
                return

        tenant_list = list(tenants)
        total_ops = len(tenant_list) * len(seeds)

        self.stdout.write(self.style.MIGRATE_HEADING(
            '\n================================================================='
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  DEPLOY SEEDS - Ejecución Multi-Tenant'
        ))
        self.stdout.write(self.style.MIGRATE_HEADING(
            '=================================================================\n'
        ))
        self.stdout.write(f'  Tenants: {len(tenant_list)}')
        self.stdout.write(f'  Seeds: {len(seeds)}')
        self.stdout.write(f'  Total operaciones: {total_ops}')
        if dry_run:
            self.stdout.write(self.style.WARNING('  MODO DRY-RUN (no se ejecutará nada)\n'))
        self.stdout.write('')

        # Mostrar seeds a ejecutar
        for code, cmd, cmd_args, desc in seeds:
            args_str = f' {" ".join(cmd_args)}' if cmd_args else ''
            self.stdout.write(f'  → {code}: {cmd}{args_str} — {desc}')
        self.stdout.write('')

        if dry_run:
            self.stdout.write(self.style.WARNING('\n  Tenants que serían afectados:'))
            for t in tenant_list:
                self.stdout.write(f'    - {t.schema_name} ({t.name})')
            return

        # Fase 1: Seeds en schema public (Biblioteca Maestra, etc.)
        success_count = 0
        error_count = 0

        if not only or only == 'biblioteca':
            self.stdout.write(self.style.MIGRATE_HEADING(
                '\n  ─── Schema PUBLIC (seeds globales) ───'
            ))
            for code, cmd, cmd_args, desc in self.PUBLIC_SEEDS:
                if only and only != code:
                    continue
                try:
                    if dry_run:
                        continue
                    if verbose:
                        self.stdout.write(f'    → Ejecutando: {cmd}...')
                        call_command(cmd, *cmd_args, stdout=self.stdout)
                    else:
                        from io import StringIO
                        out = StringIO()
                        call_command(cmd, *cmd_args, stdout=out)
                    self.stdout.write(self.style.SUCCESS(f'    ✓ {code}'))
                    success_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'    ✗ {code}: {e}'))
                    error_count += 1

            if only == 'biblioteca':
                self.stdout.write(self.style.SUCCESS(
                    f'\n  Public seeds completados: {success_count} exitosos'
                ))
                return

        # Fase 2: Seeds en cada tenant schema
        for tenant in tenant_list:
            self.stdout.write(self.style.MIGRATE_HEADING(
                f'\n  ─── {tenant.name} ({tenant.schema_name}) ───'
            ))

            with schema_context(tenant.schema_name):
                for code, cmd, cmd_args, desc in seeds:
                    try:
                        if verbose:
                            self.stdout.write(f'    → Ejecutando: {cmd}...')
                            call_command(cmd, *cmd_args, stdout=self.stdout)
                        else:
                            # Ejecutar silenciosamente
                            from io import StringIO
                            out = StringIO()
                            call_command(cmd, *cmd_args, stdout=out)

                        self.stdout.write(self.style.SUCCESS(f'    ✓ {code}'))
                        success_count += 1
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'    ✗ {code}: {e}'))
                        error_count += 1

        # Resumen final
        self.stdout.write(self.style.MIGRATE_HEADING(
            '\n─────────────────────────────────────────────────────────────────'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'\n  Deploy completado: {success_count} exitosos'
        ))
        if error_count:
            self.stdout.write(self.style.ERROR(f'  Errores: {error_count}'))
        self.stdout.write('')
