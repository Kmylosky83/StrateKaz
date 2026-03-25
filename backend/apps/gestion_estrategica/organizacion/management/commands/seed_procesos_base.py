"""
Seed de Procesos Base — Catálogo estándar ISO 9001/14001/45001

Carga procesos predefinidos clasificados por tipo (estratégico, misional,
apoyo, evaluación) según la estructura típica de SGI colombiano.

Comportamiento idempotente:
- Solo CREA procesos nuevos (si el code no existe en el tenant).
- NUNCA sobrescribe ediciones del admin (nombre, objetivo, color, etc.).
- Si un proceso fue eliminado (soft-delete), NO lo recrea.
- Marca todos los procesos seed como is_system=True (protección contra eliminación).

Uso:
    python manage.py seed_procesos_base
    python manage.py seed_procesos_base --industria manufactura
    python manage.py seed_procesos_base --industria servicios
    python manage.py seed_procesos_base --industria comercio
    python manage.py seed_procesos_base --reset  # Solo elimina procesos del seed
"""
from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context

from apps.gestion_estrategica.organizacion.models import Area
from apps.tenant.models import Tenant


# ══════════════════════════════════════════════════════════════════
# CATÁLOGO BASE — Común a todas las industrias
# ══════════════════════════════════════════════════════════════════
PROCESOS_BASE = [
    # ── ESTRATÉGICOS ──
    {
        'code': 'DIR',
        'name': 'Direccionamiento Estratégico',
        'tipo': 'ESTRATEGICO',
        'objetivo': 'Definir y desplegar la orientación estratégica de la organización',
        'icon': 'Compass',
        'color': 'indigo',
        'orden': 10,
    },
    {
        'code': 'GCA',
        'name': 'Gestión de Calidad',
        'tipo': 'ESTRATEGICO',
        'objetivo': 'Asegurar el cumplimiento de requisitos del SGI y la mejora continua',
        'icon': 'Award',
        'color': 'blue',
        'orden': 20,
    },
    {
        'code': 'COM',
        'name': 'Comunicaciones',
        'tipo': 'ESTRATEGICO',
        'objetivo': 'Gestionar la comunicación interna y externa de la organización',
        'icon': 'Megaphone',
        'color': 'cyan',
        'orden': 30,
    },
    # ── MISIONALES ──
    {
        'code': 'CML',
        'name': 'Gestión Comercial',
        'tipo': 'MISIONAL',
        'objetivo': 'Captar y fidelizar clientes garantizando su satisfacción',
        'icon': 'Handshake',
        'color': 'green',
        'orden': 40,
    },
    {
        'code': 'OPE',
        'name': 'Operaciones',
        'tipo': 'MISIONAL',
        'objetivo': 'Ejecutar las actividades core del negocio cumpliendo estándares de calidad',
        'icon': 'Cog',
        'color': 'green',
        'orden': 50,
    },
    {
        'code': 'LOG',
        'name': 'Logística',
        'tipo': 'MISIONAL',
        'objetivo': 'Gestionar el almacenamiento, transporte y distribución de productos',
        'icon': 'Truck',
        'color': 'teal',
        'orden': 60,
    },
    {
        'code': 'SAC',
        'name': 'Servicio al Cliente',
        'tipo': 'MISIONAL',
        'objetivo': 'Atender PQRS y garantizar la satisfacción postventa',
        'icon': 'HeadphonesIcon',
        'color': 'green',
        'orden': 70,
    },
    # ── APOYO ──
    {
        'code': 'GTH',
        'name': 'Gestión del Talento Humano',
        'tipo': 'APOYO',
        'objetivo': 'Seleccionar, desarrollar y retener el talento de la organización',
        'icon': 'Users',
        'color': 'purple',
        'orden': 80,
    },
    {
        'code': 'SST',
        'name': 'Seguridad y Salud en el Trabajo',
        'tipo': 'APOYO',
        'objetivo': 'Prevenir lesiones y enfermedades laborales según Decreto 1072',
        'icon': 'HardHat',
        'color': 'amber',
        'orden': 90,
    },
    {
        'code': 'GAM',
        'name': 'Gestión Ambiental',
        'tipo': 'APOYO',
        'objetivo': 'Minimizar el impacto ambiental y cumplir la normativa ambiental',
        'icon': 'Leaf',
        'color': 'green',
        'orden': 100,
    },
    {
        'code': 'CMP',
        'name': 'Compras y Abastecimiento',
        'tipo': 'APOYO',
        'objetivo': 'Adquirir bienes y servicios con calidad, oportunidad y costo óptimo',
        'icon': 'ShoppingCart',
        'color': 'orange',
        'orden': 110,
    },
    {
        'code': 'GFI',
        'name': 'Gestión Financiera',
        'tipo': 'APOYO',
        'objetivo': 'Administrar los recursos financieros de manera eficiente',
        'icon': 'DollarSign',
        'color': 'amber',
        'orden': 120,
    },
    {
        'code': 'GTI',
        'name': 'Gestión de Tecnología',
        'tipo': 'APOYO',
        'objetivo': 'Proveer y mantener la infraestructura tecnológica de la organización',
        'icon': 'Monitor',
        'color': 'blue',
        'orden': 130,
    },
    {
        'code': 'JUR',
        'name': 'Gestión Jurídica',
        'tipo': 'APOYO',
        'objetivo': 'Asegurar el cumplimiento legal y la protección jurídica',
        'icon': 'Scale',
        'color': 'gray',
        'orden': 140,
    },
    # ── EVALUACIÓN ──
    {
        'code': 'AUI',
        'name': 'Auditoría Interna',
        'tipo': 'EVALUACION',
        'objetivo': 'Evaluar la conformidad y eficacia del SGI mediante auditorías planificadas',
        'icon': 'ClipboardCheck',
        'color': 'red',
        'orden': 150,
    },
    {
        'code': 'MMA',
        'name': 'Medición y Análisis',
        'tipo': 'EVALUACION',
        'objetivo': 'Monitorear indicadores y analizar datos para la toma de decisiones',
        'icon': 'BarChart3',
        'color': 'purple',
        'orden': 160,
    },
    {
        'code': 'MCO',
        'name': 'Mejora Continua',
        'tipo': 'EVALUACION',
        'objetivo': 'Gestionar acciones correctivas, preventivas y de mejora',
        'icon': 'TrendingUp',
        'color': 'red',
        'orden': 170,
    },
]

# ══════════════════════════════════════════════════════════════════
# PROCESOS ADICIONALES POR INDUSTRIA
# ══════════════════════════════════════════════════════════════════
PROCESOS_MANUFACTURA = [
    {
        'code': 'PRD',
        'name': 'Producción',
        'tipo': 'MISIONAL',
        'objetivo': 'Transformar materias primas en producto terminado con calidad',
        'icon': 'Factory',
        'color': 'green',
        'orden': 51,
    },
    {
        'code': 'MNT',
        'name': 'Mantenimiento',
        'tipo': 'APOYO',
        'objetivo': 'Garantizar la disponibilidad y confiabilidad de equipos e instalaciones',
        'icon': 'Wrench',
        'color': 'orange',
        'orden': 131,
    },
    {
        'code': 'CAL',
        'name': 'Control de Calidad',
        'tipo': 'MISIONAL',
        'objetivo': 'Inspeccionar y asegurar la calidad del producto en cada etapa',
        'icon': 'SearchCheck',
        'color': 'blue',
        'orden': 55,
    },
]

PROCESOS_SERVICIOS = [
    {
        'code': 'DIS',
        'name': 'Diseño del Servicio',
        'tipo': 'MISIONAL',
        'objetivo': 'Diseñar y desarrollar servicios que satisfagan las necesidades del cliente',
        'icon': 'Lightbulb',
        'color': 'cyan',
        'orden': 45,
    },
    {
        'code': 'PRE',
        'name': 'Prestación del Servicio',
        'tipo': 'MISIONAL',
        'objetivo': 'Ejecutar la prestación del servicio cumpliendo los acuerdos con el cliente',
        'icon': 'Briefcase',
        'color': 'green',
        'orden': 51,
    },
]

PROCESOS_COMERCIO = [
    {
        'code': 'IMP',
        'name': 'Importaciones',
        'tipo': 'MISIONAL',
        'objetivo': 'Gestionar la importación de mercancías cumpliendo normativa aduanera',
        'icon': 'Ship',
        'color': 'blue',
        'orden': 45,
    },
    {
        'code': 'ALM',
        'name': 'Almacenamiento y Distribución',
        'tipo': 'MISIONAL',
        'objetivo': 'Almacenar y distribuir productos garantizando su conservación',
        'icon': 'Warehouse',
        'color': 'orange',
        'orden': 55,
    },
]

INDUSTRIAS = {
    'base': PROCESOS_BASE,
    'manufactura': PROCESOS_BASE + PROCESOS_MANUFACTURA,
    'servicios': PROCESOS_BASE + PROCESOS_SERVICIOS,
    'comercio': PROCESOS_BASE + PROCESOS_COMERCIO,
}


class Command(BaseCommand):
    help = 'Carga catálogo base de procesos organizacionales (idempotente, no sobrescribe)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--industria',
            type=str,
            default='base',
            choices=['base', 'manufactura', 'servicios', 'comercio'],
            help='Tipo de industria para procesos adicionales (default: base)',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Elimina solo procesos del seed (is_system) y recrea desde cero',
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

        procesos = INDUSTRIAS[industria]

        self.stdout.write(self.style.MIGRATE_HEADING(
            f'\n  SEED PROCESOS BASE — Industria: {industria.upper()}'
        ))
        self.stdout.write(f'  {len(procesos)} procesos a cargar\n')

        with schema_context('public'):
            tenants = list(Tenant.objects.exclude(schema_name='public'))
            if tenant_filter:
                tenants = [t for t in tenants if t.schema_name == tenant_filter]

        for tenant in tenants:
            self.stdout.write(f'\n  Tenant: {tenant.schema_name}')
            with schema_context(tenant.schema_name):
                self._seed_procesos(procesos, reset)

        self.stdout.write(self.style.SUCCESS('\n  Seed completado.\n'))

    def _seed_procesos(self, procesos, reset):
        seed_codes = [p['code'] for p in procesos]

        if reset:
            # Solo eliminar procesos del seed (hard delete para poder recrear)
            qs = Area.objects.filter(code__in=seed_codes)
            deleted = qs.count()
            qs.hard_delete()
            self.stdout.write(self.style.WARNING(f'    Reset: eliminados {deleted} procesos del seed'))

        created = 0
        skipped = 0

        for proc in procesos:
            # Si el code ya existe (activo o soft-deleted) → skip
            if Area.objects.filter(code=proc['code']).exists():
                skipped += 1
                continue

            Area.objects.create(
                code=proc['code'],
                name=proc['name'],
                tipo=proc['tipo'],
                objetivo=proc['objetivo'],
                icon=proc['icon'],
                color=proc['color'],
                orden=proc['orden'],
                is_system=True,
            )
            created += 1

        # Backfill: marcar procesos seed existentes como is_system=True
        marked = Area.objects.filter(
            code__in=seed_codes, is_system=False
        ).update(is_system=True)

        self.stdout.write(
            f'    Creados: {created} | Omitidos: {skipped}'
            + (f' | Marcados is_system: {marked}' if marked else '')
        )
