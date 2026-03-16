"""
Seed de Cargos Base — Catálogo estándar para empresa colombiana

Carga cargos predefinidos por nivel jerárquico como plantilla editable.
El administrador puede renombrar, agregar funciones, asignar permisos
y vincular a procesos después del seed.

NO asigna área (proceso) porque el admin decide a qué proceso va cada cargo.
NO asigna permisos RBAC — eso se configura después.

Uso:
    python manage.py seed_cargos_base
    python manage.py seed_cargos_base --industria manufactura
    python manage.py seed_cargos_base --reset
"""
from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context

from apps.core.models import Cargo
from apps.tenant.models import Tenant


# ══════════════════════════════════════════════════════════════════
# CATÁLOGO BASE — Común a todas las industrias
# ══════════════════════════════════════════════════════════════════
CARGOS_BASE = [
    # ── ESTRATÉGICO ──
    {
        'code': 'GER_GENERAL',
        'name': 'Gerente General',
        'nivel_jerarquico': 'ESTRATEGICO',
        'level': 3,
        'is_jefatura': True,
        'nivel_educativo': 'ESPECIALIZACION',
        'experiencia_requerida': '10_ANOS',
        'objetivo_cargo': 'Dirigir y liderar la organización para el cumplimiento de los objetivos estratégicos',
    },
    {
        'code': 'DIR_CALIDAD',
        'name': 'Director de Calidad',
        'nivel_jerarquico': 'ESTRATEGICO',
        'level': 3,
        'is_jefatura': True,
        'nivel_educativo': 'ESPECIALIZACION',
        'experiencia_requerida': '5_ANOS',
        'objetivo_cargo': 'Garantizar el funcionamiento del Sistema Integrado de Gestión',
    },
    # ── TÁCTICO ──
    {
        'code': 'COORD_HSEQ',
        'name': 'Coordinador HSEQ',
        'nivel_jerarquico': 'TACTICO',
        'level': 2,
        'is_jefatura': True,
        'nivel_educativo': 'PROFESIONAL',
        'experiencia_requerida': '3_ANOS',
        'objetivo_cargo': 'Coordinar la implementación del SG-SST y gestión ambiental',
    },
    {
        'code': 'COORD_RRHH',
        'name': 'Coordinador de Talento Humano',
        'nivel_jerarquico': 'TACTICO',
        'level': 2,
        'is_jefatura': True,
        'nivel_educativo': 'PROFESIONAL',
        'experiencia_requerida': '3_ANOS',
        'objetivo_cargo': 'Gestionar los procesos de selección, desarrollo y bienestar del talento',
    },
    {
        'code': 'COORD_ADMIN',
        'name': 'Coordinador Administrativo',
        'nivel_jerarquico': 'TACTICO',
        'level': 2,
        'is_jefatura': True,
        'nivel_educativo': 'PROFESIONAL',
        'experiencia_requerida': '3_ANOS',
        'objetivo_cargo': 'Administrar los recursos físicos, financieros y de servicios generales',
    },
    {
        'code': 'COORD_COMERCIAL',
        'name': 'Coordinador Comercial',
        'nivel_jerarquico': 'TACTICO',
        'level': 2,
        'is_jefatura': True,
        'nivel_educativo': 'PROFESIONAL',
        'experiencia_requerida': '3_ANOS',
        'objetivo_cargo': 'Liderar la gestión comercial y la relación con clientes',
    },
    {
        'code': 'COORD_LOGISTICA',
        'name': 'Coordinador de Logística',
        'nivel_jerarquico': 'TACTICO',
        'level': 2,
        'is_jefatura': True,
        'nivel_educativo': 'PROFESIONAL',
        'experiencia_requerida': '2_ANOS',
        'objetivo_cargo': 'Coordinar la cadena de abastecimiento, almacenamiento y distribución',
    },
    {
        'code': 'CONTADOR',
        'name': 'Contador',
        'nivel_jerarquico': 'TACTICO',
        'level': 2,
        'is_jefatura': False,
        'nivel_educativo': 'PROFESIONAL',
        'experiencia_requerida': '3_ANOS',
        'objetivo_cargo': 'Gestionar la contabilidad y los estados financieros de la organización',
        'requiere_tarjeta_contador': True,
    },
    # ── OPERATIVO ──
    {
        'code': 'ASIST_ADMIN',
        'name': 'Asistente Administrativo',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'TECNICO',
        'experiencia_requerida': '6_MESES',
        'objetivo_cargo': 'Apoyar las labores administrativas y de gestión documental',
    },
    {
        'code': 'ASIST_CONTABLE',
        'name': 'Auxiliar Contable',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'TECNICO',
        'experiencia_requerida': '1_ANO',
        'objetivo_cargo': 'Registrar movimientos contables y apoyar la gestión financiera',
    },
    {
        'code': 'RECEPCIONISTA',
        'name': 'Recepcionista',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'BACHILLER',
        'experiencia_requerida': '6_MESES',
        'objetivo_cargo': 'Atender visitantes, llamadas y correspondencia',
    },
    {
        'code': 'MENSAJERO',
        'name': 'Mensajero',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'BACHILLER',
        'experiencia_requerida': 'SIN_EXPERIENCIA',
        'objetivo_cargo': 'Realizar diligencias y entregas según las necesidades de la organización',
    },
    {
        'code': 'SERV_GENERALES',
        'name': 'Servicios Generales',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'PRIMARIA',
        'experiencia_requerida': 'SIN_EXPERIENCIA',
        'objetivo_cargo': 'Mantener las instalaciones en condiciones de orden y limpieza',
    },
]

# ══════════════════════════════════════════════════════════════════
# CARGOS ADICIONALES POR INDUSTRIA
# ══════════════════════════════════════════════════════════════════
CARGOS_MANUFACTURA = [
    {
        'code': 'JEFE_PRODUCCION',
        'name': 'Jefe de Producción',
        'nivel_jerarquico': 'TACTICO',
        'level': 2,
        'is_jefatura': True,
        'nivel_educativo': 'PROFESIONAL',
        'experiencia_requerida': '3_ANOS',
        'objetivo_cargo': 'Planificar y supervisar los procesos productivos',
    },
    {
        'code': 'SUPERVISOR_PLANTA',
        'name': 'Supervisor de Planta',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 1,
        'is_jefatura': True,
        'nivel_educativo': 'TECNOLOGO',
        'experiencia_requerida': '2_ANOS',
        'objetivo_cargo': 'Supervisar las operaciones en planta garantizando calidad y seguridad',
    },
    {
        'code': 'OPERARIO',
        'name': 'Operario de Producción',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'BACHILLER',
        'experiencia_requerida': '6_MESES',
        'objetivo_cargo': 'Ejecutar las actividades operativas del proceso productivo',
    },
    {
        'code': 'TECNICO_MANT',
        'name': 'Técnico de Mantenimiento',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'TECNICO',
        'experiencia_requerida': '1_ANO',
        'objetivo_cargo': 'Ejecutar mantenimientos preventivos y correctivos de equipos',
    },
    {
        'code': 'INSPECTOR_CALIDAD',
        'name': 'Inspector de Calidad',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'TECNOLOGO',
        'experiencia_requerida': '1_ANO',
        'objetivo_cargo': 'Inspeccionar producto en proceso y terminado según estándares',
    },
    {
        'code': 'ALMACENISTA',
        'name': 'Almacenista',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'BACHILLER',
        'experiencia_requerida': '6_MESES',
        'objetivo_cargo': 'Gestionar el almacenamiento, despacho e inventarios',
    },
]

CARGOS_SERVICIOS = [
    {
        'code': 'CONSULTOR',
        'name': 'Consultor',
        'nivel_jerarquico': 'TACTICO',
        'level': 2,
        'is_jefatura': False,
        'nivel_educativo': 'PROFESIONAL',
        'experiencia_requerida': '3_ANOS',
        'objetivo_cargo': 'Brindar asesoría especializada a clientes',
    },
    {
        'code': 'ANALISTA',
        'name': 'Analista',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'PROFESIONAL',
        'experiencia_requerida': '1_ANO',
        'objetivo_cargo': 'Analizar información y generar reportes para la toma de decisiones',
    },
]

CARGOS_COMERCIO = [
    {
        'code': 'VENDEDOR',
        'name': 'Vendedor',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'BACHILLER',
        'experiencia_requerida': '6_MESES',
        'objetivo_cargo': 'Atender clientes y cumplir las metas de ventas asignadas',
    },
    {
        'code': 'CAJERO',
        'name': 'Cajero',
        'nivel_jerarquico': 'OPERATIVO',
        'level': 0,
        'is_jefatura': False,
        'nivel_educativo': 'BACHILLER',
        'experiencia_requerida': 'SIN_EXPERIENCIA',
        'objetivo_cargo': 'Gestionar cobros y pagos en el punto de venta',
    },
]

INDUSTRIAS = {
    'base': CARGOS_BASE,
    'manufactura': CARGOS_BASE + CARGOS_MANUFACTURA,
    'servicios': CARGOS_BASE + CARGOS_SERVICIOS,
    'comercio': CARGOS_BASE + CARGOS_COMERCIO,
}


class Command(BaseCommand):
    help = 'Carga catálogo base de cargos organizacionales (editables)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--industria',
            type=str,
            default='base',
            choices=['base', 'manufactura', 'servicios', 'comercio'],
            help='Tipo de industria para cargos adicionales (default: base)',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Elimina TODOS los cargos existentes y recrea desde cero',
        )
        parser.add_argument(
            '--tenant',
            type=str,
            help='Ejecutar solo en un tenant específico (schema_name)',
        )

    def handle(self, *args, **options):
        industria = options['industria']
        reset = options['reset']
        tenant_filter = options.get('tenant')

        cargos = INDUSTRIAS[industria]

        self.stdout.write(self.style.MIGRATE_HEADING(
            f'\n  SEED CARGOS BASE — Industria: {industria.upper()}'
        ))
        self.stdout.write(f'  {len(cargos)} cargos a cargar\n')

        with schema_context('public'):
            tenants = list(Tenant.objects.exclude(schema_name='public'))
            if tenant_filter:
                tenants = [t for t in tenants if t.schema_name == tenant_filter]

        for tenant in tenants:
            self.stdout.write(f'\n  Tenant: {tenant.schema_name}')
            with schema_context(tenant.schema_name):
                self._seed_cargos(cargos, reset)

        self.stdout.write(self.style.SUCCESS('\n  Seed completado.\n'))

    def _seed_cargos(self, cargos, reset):
        if reset:
            # Solo eliminar cargos del seed, no los creados por el usuario
            seed_codes = [c['code'] for c in cargos]
            deleted, _ = Cargo.objects.filter(code__in=seed_codes).delete()
            self.stdout.write(self.style.WARNING(f'    Eliminados {deleted} cargos del seed'))

        created = 0
        updated = 0

        for cargo_data in cargos:
            defaults = {
                'name': cargo_data['name'],
                'nivel_jerarquico': cargo_data['nivel_jerarquico'],
                'level': cargo_data['level'],
                'is_jefatura': cargo_data.get('is_jefatura', False),
                'objetivo_cargo': cargo_data.get('objetivo_cargo', ''),
            }

            # Campos opcionales
            if 'nivel_educativo' in cargo_data:
                defaults['nivel_educativo'] = cargo_data['nivel_educativo']
            if 'experiencia_requerida' in cargo_data:
                defaults['experiencia_requerida'] = cargo_data['experiencia_requerida']
            if cargo_data.get('requiere_tarjeta_contador'):
                defaults['requiere_tarjeta_contador'] = True

            obj, was_created = Cargo.objects.update_or_create(
                code=cargo_data['code'],
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            f'    Creados: {created} | Actualizados: {updated}'
        )
