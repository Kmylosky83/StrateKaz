"""
Management command para crear roles plantilla con CargoSectionAccess predefinidos.

Crea 4 perfiles tipo con permisos escalonados para empresas colombianas:
1. TEMPLATE_GERENTE     — Nivel ESTRATEGICO: acceso total + acciones especiales
2. TEMPLATE_COORDINADOR — Nivel TACTICO: CRUD sin delete global + aprobar/exportar
3. TEMPLATE_ANALISTA    — Nivel OPERATIVO+: view+create + edit en su área
4. TEMPLATE_OPERATIVO   — Nivel OPERATIVO básico: view + create en registros

Uso:
    docker compose exec backend python manage.py seed_rbac_templates
    docker compose exec backend python manage.py seed_rbac_templates --apply-to-existing
    docker compose exec backend python manage.py seed_rbac_templates --tenant=stratekaz_demo
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django_tenants.utils import schema_context

from apps.core.models import (
    Cargo,
    CargoSectionAccess,
    TabSection,
)


# ============================================================================
# CONFIGURACIÓN DE PLANTILLAS
# ============================================================================

# Secciones con datos sensibles donde delete requiere nivel estratégico
SENSITIVE_SECTIONS = {
    'empresa', 'sedes', 'mision_vision', 'valores', 'normas_iso',
    'alcance_sig', 'areas', 'cargos', 'partes_interesadas',
}

# Secciones operativas donde un coordinador puede eliminar registros
OPERATIONAL_DELETE_SECTIONS = {
    'vacantes', 'candidatos', 'contratacion', 'directorio',
    'hoja_vida', 'contratos', 'programas_induccion', 'afiliaciones',
    'entrega_dotacion', 'documentos', 'tipos_documento',
    'instancias', 'flujos',
}

# Secciones donde un analista puede editar (formularios y registros directos)
ANALYST_EDIT_SECTIONS = {
    'documentos', 'control_cambios', 'distribucion',
    'vacantes', 'candidatos', 'contratacion',
    'directorio', 'hoja_vida', 'contratos',
    'programas_induccion', 'afiliaciones', 'entrega_dotacion',
    'instancias', 'flujos', 'metricas',
    'perfiles_cargo',
}

# Secciones donde un operativo puede crear registros
OPERATIVE_CREATE_SECTIONS = {
    'documentos', 'instancias',
    'vacantes', 'candidatos',
    'programas_induccion', 'afiliaciones', 'entrega_dotacion',
}

# Custom actions por nivel
CUSTOM_ACTIONS_ESTRATEGICO = {'aprobar': True, 'exportar': True, 'firmar': True}
CUSTOM_ACTIONS_TACTICO = {'aprobar': True, 'exportar': True}
CUSTOM_ACTIONS_OPERATIVO_PLUS = {'exportar': True}

# ============================================================================
# DEFINICIONES DE PLANTILLAS
# ============================================================================
TEMPLATES = [
    {
        'code': 'TEMPLATE_GERENTE',
        'name': 'Gerente / Director (Plantilla)',
        'nivel_jerarquico': 'ESTRATEGICO',
        'description': (
            'Plantilla de permisos nivel estratégico. '
            'Acceso completo (ver, crear, editar, eliminar) a todas las secciones. '
            'Acciones especiales: aprobar, exportar, firmar.'
        ),
    },
    {
        'code': 'TEMPLATE_COORDINADOR',
        'name': 'Coordinador / Jefe (Plantilla)',
        'nivel_jerarquico': 'TACTICO',
        'description': (
            'Plantilla de permisos nivel táctico. '
            'Ver, crear y editar en todas las secciones. '
            'Eliminar solo en secciones operativas. '
            'Acciones especiales: aprobar, exportar.'
        ),
    },
    {
        'code': 'TEMPLATE_ANALISTA',
        'name': 'Analista / Profesional (Plantilla)',
        'nivel_jerarquico': 'OPERATIVO',
        'description': (
            'Plantilla de permisos nivel operativo con responsabilidades. '
            'Ver y crear en la mayoría de secciones. '
            'Editar solo en secciones de trabajo directo. '
            'Acción especial: exportar.'
        ),
    },
    {
        'code': 'TEMPLATE_OPERATIVO',
        'name': 'Operativo / Auxiliar (Plantilla)',
        'nivel_jerarquico': 'OPERATIVO',
        'description': (
            'Plantilla de permisos nivel operativo básico. '
            'Solo visualización en la mayoría de secciones. '
            'Crear solo en formularios y registros operativos. '
            'Sin acciones especiales.'
        ),
    },
]


def _get_permissions_for_template(template_code, section_code):
    """
    Calcula los permisos CRUD + custom_actions para una sección
    según la plantilla indicada.

    Returns:
        dict: {can_view, can_create, can_edit, can_delete, custom_actions}
    """
    if template_code == 'TEMPLATE_GERENTE':
        return {
            'can_view': True,
            'can_create': True,
            'can_edit': True,
            'can_delete': True,
            'custom_actions': CUSTOM_ACTIONS_ESTRATEGICO,
        }

    if template_code == 'TEMPLATE_COORDINADOR':
        can_delete = section_code in OPERATIONAL_DELETE_SECTIONS
        return {
            'can_view': True,
            'can_create': True,
            'can_edit': True,
            'can_delete': can_delete,
            'custom_actions': CUSTOM_ACTIONS_TACTICO,
        }

    if template_code == 'TEMPLATE_ANALISTA':
        can_edit = section_code in ANALYST_EDIT_SECTIONS
        return {
            'can_view': True,
            'can_create': True,
            'can_edit': can_edit,
            'can_delete': False,
            'custom_actions': CUSTOM_ACTIONS_OPERATIVO_PLUS,
        }

    if template_code == 'TEMPLATE_OPERATIVO':
        can_create = section_code in OPERATIVE_CREATE_SECTIONS
        return {
            'can_view': True,
            'can_create': can_create,
            'can_edit': False,
            'can_delete': False,
            'custom_actions': {},
        }

    # Fallback: solo lectura
    return {
        'can_view': True,
        'can_create': False,
        'can_edit': False,
        'can_delete': False,
        'custom_actions': {},
    }


class Command(BaseCommand):
    help = (
        'Crea roles plantilla (TEMPLATE_*) con CargoSectionAccess predefinidos. '
        'Idempotente: no duplica registros existentes.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply-to-existing',
            action='store_true',
            dest='apply_to_existing',
            help=(
                'Copia los permisos de cada plantilla a los cargos existentes '
                'del mismo nivel_jerarquico que NO tengan CargoSectionAccess.'
            ),
        )
        parser.add_argument(
            '--tenant',
            type=str,
            default=None,
            help='Schema name del tenant específico. Si no se indica, aplica a todos.',
        )

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.MIGRATE_HEADING(
            '  SEED RBAC TEMPLATES — Roles Plantilla con CargoSectionAccess'
        ))
        self.stdout.write('=' * 70)

        apply_existing = options['apply_to_existing']
        tenant_filter = options.get('tenant')

        from apps.tenant.models import Tenant
        with schema_context('public'):
            tenants = Tenant.objects.exclude(schema_name='public')
            if tenant_filter:
                tenants = tenants.filter(schema_name=tenant_filter)
            tenants = list(tenants)

        if not tenants:
            self.stdout.write(self.style.WARNING(
                '\n  [WARN] No hay tenants activos. Nada que configurar.'
            ))
            return

        for tenant in tenants:
            self.stdout.write(f'\n  --- Tenant: {tenant.schema_name} ---')
            with schema_context(tenant.schema_name):
                self._seed_templates(apply_existing)

        self.stdout.write(self.style.SUCCESS('\n  Seed RBAC templates completado.'))

    def _seed_templates(self, apply_existing):
        """Crea las plantillas y sus CargoSectionAccess en el schema actual."""
        sections = list(
            TabSection.objects.filter(is_enabled=True)
            .select_related('tab__module')
            .order_by('tab__module__orden', 'tab__orden', 'orden')
        )

        if not sections:
            self.stdout.write(self.style.WARNING(
                '    [WARN] No hay TabSection habilitadas. Ejecute seed_estructura_final primero.'
            ))
            return

        for tmpl in TEMPLATES:
            cargo = self._ensure_cargo(tmpl)
            created, skipped = self._ensure_section_accesses(cargo, tmpl['code'], sections)
            self.stdout.write(
                f"    {tmpl['code']}: {created} accesos creados, {skipped} ya existían"
            )

            if apply_existing:
                applied = self._apply_to_existing_cargos(cargo, tmpl, sections)
                if applied:
                    self.stdout.write(
                        f"      → Aplicado a {applied} cargo(s) existentes sin permisos"
                    )

    def _ensure_cargo(self, tmpl):
        """Crea o actualiza el cargo plantilla."""
        cargo, created = Cargo.objects.update_or_create(
            code=tmpl['code'],
            defaults={
                'name': tmpl['name'],
                'nivel_jerarquico': tmpl['nivel_jerarquico'],
                'is_active': True,
                'description': tmpl.get('description', ''),
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(
                f"    [+] Cargo creado: {cargo.code}"
            ))
        return cargo

    @transaction.atomic
    def _ensure_section_accesses(self, cargo, template_code, sections):
        """Crea CargoSectionAccess para cada sección (idempotente)."""
        created_count = 0
        skipped_count = 0

        for section in sections:
            perms = _get_permissions_for_template(template_code, section.code)

            _, created = CargoSectionAccess.objects.get_or_create(
                cargo=cargo,
                section=section,
                defaults={
                    'can_view': perms['can_view'],
                    'can_create': perms['can_create'],
                    'can_edit': perms['can_edit'],
                    'can_delete': perms['can_delete'],
                    'custom_actions': perms['custom_actions'],
                },
            )

            if created:
                created_count += 1
            else:
                skipped_count += 1

        return created_count, skipped_count

    def _apply_to_existing_cargos(self, template_cargo, tmpl, sections):
        """
        Copia permisos de la plantilla a cargos existentes del mismo nivel
        que NO tengan ningún CargoSectionAccess.
        """
        target_cargos = Cargo.objects.filter(
            nivel_jerarquico=tmpl['nivel_jerarquico'],
            is_active=True,
        ).exclude(
            code__startswith='TEMPLATE_',
        )

        applied_count = 0
        for cargo in target_cargos:
            # Solo aplicar si el cargo no tiene NINGUN acceso definido
            existing_count = CargoSectionAccess.objects.filter(cargo=cargo).count()
            if existing_count > 0:
                continue

            self._ensure_section_accesses(cargo, tmpl['code'], sections)
            applied_count += 1

        return applied_count
