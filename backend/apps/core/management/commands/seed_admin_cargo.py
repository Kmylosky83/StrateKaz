"""
Seed Command: seed_admin_cargo
Sistema StrateKaz - Creacion de Cargos de Sistema (ADMIN y USUARIO)

Este comando crea:
1. Un cargo "Administrador" (ADMIN) con nivel ESTRATEGICO y permisos completos (CRUD)
2. Un cargo "Usuario" (USUARIO) con nivel OPERATIVO y permisos solo-lectura (can_view)
3. CargoSectionAccess para TODAS las secciones para ambos cargos

El cargo ADMIN se asigna automaticamente cuando un usuario accede al tenant por primera vez
via el sistema HybridJWTAuthentication. El admin del tenant puede luego cambiar el cargo
a USUARIO u otro cargo personalizado.

Uso:
    python manage.py seed_admin_cargo
    python manage.py seed_admin_cargo --dry-run

Este comando es idempotente - puede ejecutarse multiples veces sin duplicar datos.
Se ejecuta automaticamente durante la creacion de nuevos tenants.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.core.models import (
    Cargo,
    CargoSectionAccess,
    TabSection,
)


class Command(BaseCommand):
    help = 'Crea los cargos de sistema ADMIN (permisos completos) y USUARIO (solo lectura)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--assign-to-first-user',
            action='store_true',
            help='[DEPRECATED] La asignacion ahora es automatica al primer acceso'
        )
        parser.add_argument(
            '--assign-to-user',
            type=str,
            help='[DEPRECATED] La asignacion ahora es automatica al primer acceso'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra lo que se haria sin ejecutar cambios'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        assign_to_first = options.get('assign_to_first_user', False)
        assign_to_email = options.get('assign_to_user')

        if dry_run:
            self.stdout.write(self.style.WARNING('=== MODO DRY-RUN - No se realizaran cambios ===\n'))

        # =====================================================================
        # 1. CREAR O ACTUALIZAR CARGO ADMINISTRADOR
        # =====================================================================
        self.stdout.write('\n1. Creando/actualizando cargo Administrador...')

        cargo_defaults = {
            'name': 'Administrador',
            'description': 'Cargo con permisos completos de administracion del sistema. '
                          'Tiene acceso a todas las secciones y puede realizar todas las acciones.',
            'nivel_jerarquico': 'ESTRATEGICO',
            'level': 3,  # Direccion
            'is_jefatura': True,
            'is_system': True,
            'is_active': True,
            'objetivo_cargo': 'Administrar y configurar todos los aspectos del sistema de gestion, '
                             'incluyendo usuarios, permisos, modulos y configuraciones generales.',
            'funciones_responsabilidades': [
                'Gestionar usuarios y permisos del sistema',
                'Configurar modulos y funcionalidades',
                'Administrar la estructura organizacional',
                'Supervisar la integridad de los datos',
                'Gestionar configuraciones de empresa y branding',
                'Administrar integraciones y conexiones externas',
            ],
            'autoridad_autonomia': 'Autoridad total sobre la configuracion y administracion del sistema. '
                                   'Puede crear, modificar y eliminar cualquier registro del sistema.',
        }

        if not dry_run:
            cargo, created = Cargo.objects.update_or_create(
                code='ADMIN',
                defaults=cargo_defaults
            )
            action = 'Creado' if created else 'Actualizado'
            self.stdout.write(self.style.SUCCESS(f'   {action} cargo: {cargo.name} ({cargo.code})'))
        else:
            cargo = Cargo.objects.filter(code='ADMIN').first()
            if cargo:
                self.stdout.write(f'   [DRY-RUN] Actualizaria cargo existente: ADMIN')
            else:
                self.stdout.write(f'   [DRY-RUN] Crearia cargo: Administrador (ADMIN)')

        # =====================================================================
        # 2. CREAR CARGOSECTIONACCESS PARA TODAS LAS SECCIONES
        # =====================================================================
        self.stdout.write('\n2. Asignando permisos completos a todas las secciones...')

        # Obtener todas las secciones activas
        all_sections = TabSection.objects.filter(is_enabled=True).select_related(
            'tab__module'
        ).order_by('tab__module__orden', 'tab__orden', 'orden')

        self.stdout.write(f'   Total de secciones encontradas: {all_sections.count()}')

        created_count = 0
        updated_count = 0

        for section in all_sections:
            access_defaults = {
                'can_view': True,
                'can_create': True,
                'can_edit': True,
                'can_delete': True,
                'custom_actions': {},  # Se pueden agregar acciones custom si es necesario
            }

            if not dry_run:
                access, created = CargoSectionAccess.objects.update_or_create(
                    cargo=cargo,
                    section=section,
                    defaults=access_defaults
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1
            else:
                existing = CargoSectionAccess.objects.filter(
                    cargo__code='ADMIN',
                    section=section
                ).exists()
                if existing:
                    updated_count += 1
                else:
                    created_count += 1

        if dry_run:
            self.stdout.write(f'   [DRY-RUN] Se crearian {created_count} accesos')
            self.stdout.write(f'   [DRY-RUN] Se actualizarian {updated_count} accesos')
        else:
            self.stdout.write(self.style.SUCCESS(f'   Creados: {created_count} accesos'))
            self.stdout.write(self.style.SUCCESS(f'   Actualizados: {updated_count} accesos'))

        # =====================================================================
        # 3. CREAR O ACTUALIZAR CARGO USUARIO (SOLO LECTURA)
        # =====================================================================
        self.stdout.write('\n3. Creando/actualizando cargo Usuario (solo lectura)...')

        usuario_cargo_defaults = {
            'name': 'Usuario',
            'description': 'Cargo con permisos de solo lectura. '
                          'Puede visualizar toda la informacion pero no puede crear, editar ni eliminar.',
            'nivel_jerarquico': 'OPERATIVO',
            'level': 1,  # Operativo
            'is_jefatura': False,
            'is_system': True,
            'is_active': True,
            'objetivo_cargo': 'Consultar y monitorear la informacion del sistema de gestion '
                             'sin capacidad de modificar registros.',
            'funciones_responsabilidades': [
                'Consultar informacion del sistema',
                'Visualizar reportes y dashboards',
                'Monitorear indicadores y metricas',
                'Revisar documentos y registros',
            ],
            'autoridad_autonomia': 'Acceso de solo lectura. No puede crear, modificar ni eliminar registros.',
        }

        if not dry_run:
            usuario_cargo, usuario_created = Cargo.objects.update_or_create(
                code='USUARIO',
                defaults=usuario_cargo_defaults
            )
            action = 'Creado' if usuario_created else 'Actualizado'
            self.stdout.write(self.style.SUCCESS(f'   {action} cargo: {usuario_cargo.name} ({usuario_cargo.code})'))
        else:
            usuario_cargo = Cargo.objects.filter(code='USUARIO').first()
            if usuario_cargo:
                self.stdout.write(f'   [DRY-RUN] Actualizaria cargo existente: USUARIO')
            else:
                self.stdout.write(f'   [DRY-RUN] Crearia cargo: Usuario (USUARIO)')

        # =====================================================================
        # 4. CREAR CARGOSECTIONACCESS PARA USUARIO (SOLO CAN_VIEW)
        # =====================================================================
        self.stdout.write('\n4. Asignando permisos de solo lectura a cargo USUARIO...')

        usuario_created_count = 0
        usuario_updated_count = 0

        for section in all_sections:
            access_defaults = {
                'can_view': True,
                'can_create': False,
                'can_edit': False,
                'can_delete': False,
                'custom_actions': {},
            }

            if not dry_run:
                access, created = CargoSectionAccess.objects.update_or_create(
                    cargo=usuario_cargo,
                    section=section,
                    defaults=access_defaults
                )
                if created:
                    usuario_created_count += 1
                else:
                    usuario_updated_count += 1
            else:
                existing = CargoSectionAccess.objects.filter(
                    cargo__code='USUARIO',
                    section=section
                ).exists()
                if existing:
                    usuario_updated_count += 1
                else:
                    usuario_created_count += 1

        if dry_run:
            self.stdout.write(f'   [DRY-RUN] Se crearian {usuario_created_count} accesos (solo lectura)')
            self.stdout.write(f'   [DRY-RUN] Se actualizarian {usuario_updated_count} accesos (solo lectura)')
        else:
            self.stdout.write(self.style.SUCCESS(f'   Creados: {usuario_created_count} accesos (solo lectura)'))
            self.stdout.write(self.style.SUCCESS(f'   Actualizados: {usuario_updated_count} accesos (solo lectura)'))

        # =====================================================================
        # NOTA: La asignacion del cargo es automatica
        # =====================================================================
        # El cargo ADMIN se asigna automaticamente cuando un usuario accede
        # al tenant por primera vez, via HybridJWTAuthentication.
        # Ver: apps/tenant/authentication.py -> _create_user_from_tenant_user()
        if assign_to_first or assign_to_email:
            self.stdout.write(self.style.WARNING(
                '\n[NOTA] Las opciones --assign-to-first-user y --assign-to-user estan deprecadas.'
            ))
            self.stdout.write(
                '   El cargo ADMIN se asigna automaticamente al primer usuario que accede al tenant.'
            )

        # =====================================================================
        # RESUMEN FINAL
        # =====================================================================
        self.stdout.write('\n' + '=' * 60)
        if dry_run:
            self.stdout.write(self.style.WARNING('MODO DRY-RUN COMPLETADO - No se realizaron cambios'))
        else:
            self.stdout.write(self.style.SUCCESS('SEED ADMIN CARGO COMPLETADO EXITOSAMENTE'))

        # Mostrar resumen de permisos por modulo
        self.stdout.write('\nResumen de accesos por modulo:')

        if not dry_run and cargo:
            from collections import Counter
            module_counts = Counter()
            for section in all_sections:
                module_counts[section.tab.module.name] += 1

            for module_name, count in module_counts.most_common():
                self.stdout.write(f'   - {module_name}: {count} secciones')
        else:
            # En dry-run, mostrar igual
            from collections import Counter
            module_counts = Counter()
            for section in all_sections:
                module_counts[section.tab.module.name] += 1

            for module_name, count in module_counts.most_common():
                self.stdout.write(f'   - {module_name}: {count} secciones')

        self.stdout.write('')
