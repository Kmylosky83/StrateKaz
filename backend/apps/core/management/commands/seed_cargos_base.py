"""
Seed de Cargos Base — Catálogo estándar para empresa colombiana

Carga cargos predefinidos por nivel jerárquico como plantilla editable.
El administrador puede renombrar, agregar funciones, asignar permisos
y vincular a procesos después del seed.

Comportamiento idempotente:
- Solo CREA cargos nuevos (si el code no existe en el tenant).
- NUNCA sobrescribe ediciones del admin (nombre, nivel, objetivo, etc.).
- Si un cargo fue desactivado (is_active=False), NO lo recrea ni reactiva.
- Marca todos los cargos seed como is_system=True (protección contra eliminación).
- Asigna área (proceso) por defecto según CARGO_AREA_MAPPING si no tiene una.

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
# MAPPING CARGO → PROCESO (código de Area)
# Asigna área por defecto en la primera ejecución del seed.
# Si el admin cambia el área después, el seed NO la sobrescribe.
# ══════════════════════════════════════════════════════════════════
CARGO_AREA_MAPPING = {
    # Base
    'GER_GENERAL': 'DIR',       # Gerente → Direccionamiento Estratégico
    'DIR_CALIDAD': 'GCA',       # Director Calidad → Gestión de Calidad
    'COORD_HSEQ': 'SST',       # HSEQ → Seguridad y Salud en el Trabajo
    'COORD_RRHH': 'GTH',       # RRHH → Gestión del Talento Humano
    'COORD_ADMIN': 'GFI',      # Administrativo → Gestión Financiera
    'COORD_COMERCIAL': 'CML',  # Comercial → Gestión Comercial
    'COORD_LOGISTICA': 'LOG',  # Logística → Logística
    'CONTADOR': 'GFI',         # Contador → Gestión Financiera
    'ASIST_ADMIN': 'DIR',      # Asistente Admin → Direccionamiento
    'ASIST_CONTABLE': 'GFI',   # Aux Contable → Gestión Financiera
    'RECEPCIONISTA': 'DIR',    # Recepcionista → Direccionamiento
    'MENSAJERO': 'LOG',        # Mensajero → Logística
    'SERV_GENERALES': 'DIR',   # Servicios Generales → Direccionamiento
    # Manufactura
    'JEFE_PRODUCCION': 'OPE',
    'SUPERVISOR_PLANTA': 'OPE',
    'OPERARIO': 'OPE',
    'TECNICO_MANT': 'OPE',
    'INSPECTOR_CALIDAD': 'GCA',
    'ALMACENISTA': 'LOG',
    # Servicios
    'CONSULTOR': 'OPE',
    'ANALISTA': 'OPE',
    # Comercio
    'VENDEDOR': 'CML',
    'CAJERO': 'CML',
}


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


def _get_area_model():
    """Import lazy para evitar dependencias circulares."""
    from django.apps import apps
    try:
        return apps.get_model('organizacion', 'Area')
    except LookupError:
        return None


class Command(BaseCommand):
    help = 'Carga catálogo base de cargos organizacionales (idempotente, no sobrescribe)'

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
            help='Elimina solo cargos del seed (is_system) y recrea desde cero',
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
        seed_codes = [c['code'] for c in cargos]
        Area = _get_area_model()

        if reset:
            # Solo eliminar cargos del seed marcados como sistema
            deleted, _ = Cargo.objects.filter(
                code__in=seed_codes, is_system=True
            ).delete()
            self.stdout.write(self.style.WARNING(
                f'    Reset: eliminados {deleted} cargos del seed'
            ))

        created = 0
        skipped = 0

        for cargo_data in cargos:
            # Si el code ya existe (activo o inactivo) → skip
            if Cargo.objects.filter(code=cargo_data['code']).exists():
                skipped += 1
                continue

            fields = {
                'code': cargo_data['code'],
                'name': cargo_data['name'],
                'nivel_jerarquico': cargo_data['nivel_jerarquico'],
                'level': cargo_data['level'],
                'is_jefatura': cargo_data.get('is_jefatura', False),
                'objetivo_cargo': cargo_data.get('objetivo_cargo', ''),
                'is_system': False,
            }

            # Campos opcionales
            if 'nivel_educativo' in cargo_data:
                fields['nivel_educativo'] = cargo_data['nivel_educativo']
            if 'experiencia_requerida' in cargo_data:
                fields['experiencia_requerida'] = cargo_data['experiencia_requerida']
            if cargo_data.get('requiere_tarjeta_contador'):
                fields['requiere_tarjeta_contador'] = True

            # Asignar área por mapping
            if Area:
                area_code = CARGO_AREA_MAPPING.get(cargo_data['code'])
                if area_code:
                    area = Area.objects.filter(
                        code=area_code, is_active=True
                    ).first()
                    if area:
                        fields['area'] = area

            Cargo.objects.create(**fields)
            created += 1

        # Fix: desmarcar cargos de negocio que fueron marcados incorrectamente
        # como is_system=True por el backfill anterior. is_system solo aplica
        # en la creación inicial (línea 407) — cargos editados son de negocio.
        unmarked = Cargo.objects.filter(
            code__in=seed_codes, is_system=True
        ).update(is_system=False)
        marked = 0

        # Backfill: asignar área a cargos seed que no tengan una
        linked = 0
        if Area:
            for cargo_data in cargos:
                area_code = CARGO_AREA_MAPPING.get(cargo_data['code'])
                if not area_code:
                    continue
                cargo = Cargo.objects.filter(
                    code=cargo_data['code'], area__isnull=True
                ).first()
                if cargo:
                    area = Area.objects.filter(
                        code=area_code, is_active=True
                    ).first()
                    if area:
                        cargo.area = area
                        cargo.save(update_fields=['area'])
                        linked += 1

        parts = [f'Creados: {created}', f'Omitidos: {skipped}']
        if unmarked:
            parts.append(f'Desmarcados is_system: {unmarked}')
        if linked:
            parts.append(f'Vinculados a área: {linked}')
        self.stdout.write(f'    {" | ".join(parts)}')
