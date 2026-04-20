"""
Seed Command: seed_supply_chain_demo_data
Sistema StrateKaz — Data DEMO de industria rendering/agroindustria.

ATENCION: Este seed NO corre en deploy_seeds_all_tenants. Solo se ejecuta
MANUAL y explícitamente para tenants de demostración o tenants reales de
industria de rendering/grasas que quieran plantilla inicial.

Contenido (6 categorías + 12 tipos de materia prima):
- Categorías: Grasas y Aceites, Huesos y Subproductos, Pieles y Cueros,
  Químicos e Insumos, Empaques, Otros
- Tipos MP: Sebo Bovino, Sebo Porcino, Grasa de Ave, Aceite Vegetal,
  Hueso Bovino, Hueso Porcino, Harina de Hueso, Cuero Crudo, Piel
  Porcina, Soda Cáustica, Caja de Cartón, Tambor Plástico

Doctrina:
- Tenants nuevos arrancan SIN tipos MP específicos (seed universal
  `seed_supply_chain_catalogs` solo tiene estructura).
- El admin del tenant agrega sus categorías y tipos MP desde
  `/supply-chain/catalogos` según su industria real.
- Este seed demo existe para acelerar provisioning de `tenant_demo`
  y eventualmente de clientes de industria rendering que lo pidan.

Uso:
    python manage.py seed_supply_chain_demo_data --tenant tenant_demo
    python manage.py seed_supply_chain_demo_data --all-tenants  (NO recomendado)
    python manage.py seed_supply_chain_demo_data --dry-run

Idempotente: usa update_or_create por codigo. Si el admin editó nombres
o descripciones, NO se sobrescribe (ver comportamiento de _seed_model).

Futuro: ver H-S7-seed-industrias-templates para wizard UI de plantillas
por industria (rendering, manufactura, servicios, retail, farmacéutica).
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django_tenants.utils import schema_context

from apps.tenant.models import Tenant


CATEGORIAS_RENDERING = [
    {'codigo': 'GRASAS_ACEITES', 'nombre': 'Grasas y Aceites', 'descripcion': 'Grasas animales, aceites vegetales, derivados lipídicos', 'orden': 1},
    {'codigo': 'HUESOS_SUBPRODUCTOS', 'nombre': 'Huesos y Subproductos', 'descripcion': 'Huesos, harina de hueso, calcio y subproductos óseos', 'orden': 2},
    {'codigo': 'PIELES_CUEROS', 'nombre': 'Pieles y Cueros', 'descripcion': 'Pieles crudas, cueros en proceso, subproductos dérmicos', 'orden': 3},
    {'codigo': 'QUIMICOS_INSUMOS', 'nombre': 'Químicos e Insumos', 'descripcion': 'Productos químicos industriales, insumos de proceso', 'orden': 4},
    {'codigo': 'EMPAQUES', 'nombre': 'Empaques', 'descripcion': 'Material de empaque, envases, etiquetas', 'orden': 5},
    {'codigo': 'OTROS', 'nombre': 'Otros', 'descripcion': 'Otras categorías no clasificadas', 'orden': 99},
]

TIPOS_MP_RENDERING = [
    # (codigo, nombre, categoria_codigo, orden)
    ('SEBO_BOVINO_CRUDO', 'Sebo Bovino Crudo', 'GRASAS_ACEITES', 1),
    ('SEBO_PORCINO', 'Sebo Porcino', 'GRASAS_ACEITES', 2),
    ('GRASA_AVE', 'Grasa de Ave', 'GRASAS_ACEITES', 3),
    ('ACEITE_VEGETAL', 'Aceite Vegetal', 'GRASAS_ACEITES', 4),
    ('HUESO_BOVINO', 'Hueso Bovino', 'HUESOS_SUBPRODUCTOS', 5),
    ('HUESO_PORCINO', 'Hueso Porcino', 'HUESOS_SUBPRODUCTOS', 6),
    ('HARINA_HUESO', 'Harina de Hueso', 'HUESOS_SUBPRODUCTOS', 7),
    ('CUERO_CRUDO', 'Cuero Crudo', 'PIELES_CUEROS', 8),
    ('PIEL_PORCINA', 'Piel Porcina', 'PIELES_CUEROS', 9),
    ('SODA_CAUSTICA', 'Soda Cáustica', 'QUIMICOS_INSUMOS', 10),
    ('CAJA_CARTON', 'Caja de Cartón', 'EMPAQUES', 11),
    ('TAMBOR_PLASTICO', 'Tambor Plástico', 'EMPAQUES', 12),
]


class Command(BaseCommand):
    help = 'Carga data DEMO de industria rendering (categorías + tipos MP) en un tenant específico'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            help='Schema name del tenant (ej: tenant_demo). Requerido salvo que uses --all-tenants.',
        )
        parser.add_argument(
            '--all-tenants',
            action='store_true',
            help='Ejecutar en TODOS los tenants. NO recomendado — solo para migraciones especiales.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra lo que se haría sin ejecutar cambios',
        )

    def handle(self, *args, **options):
        tenant_filter = options.get('tenant')
        all_tenants = options.get('all_tenants', False)
        dry_run = options.get('dry_run', False)

        if not tenant_filter and not all_tenants:
            raise CommandError(
                'Debe especificar --tenant <schema_name> o --all-tenants.\n'
                'Recomendado: --tenant tenant_demo'
            )

        if all_tenants:
            tenants = list(Tenant.objects.exclude(schema_name='public'))
            self.stdout.write(self.style.WARNING(
                f'ATENCIÓN: ejecutando seed demo en {len(tenants)} tenants. '
                '¿Estás seguro? Ctrl+C para cancelar en 5s...'
            ))
            import time
            time.sleep(5)
        else:
            try:
                tenants = [Tenant.objects.get(schema_name=tenant_filter)]
            except Tenant.DoesNotExist:
                raise CommandError(f'Tenant con schema "{tenant_filter}" no encontrado.')

        if dry_run:
            self.stdout.write(self.style.WARNING('=== MODO DRY-RUN ===\n'))

        for tenant in tenants:
            self.stdout.write(self.style.MIGRATE_HEADING(
                f'\n  ─── {tenant.name} ({tenant.schema_name}) ───'
            ))
            with schema_context(tenant.schema_name):
                self._seed_tenant(dry_run)

        self.stdout.write(self.style.SUCCESS('\n  Seed demo completado.\n'))

    @transaction.atomic
    def _seed_tenant(self, dry_run):
        # 1. Categorías
        cats_created, cats_updated = self._seed_categorias(dry_run)
        # 2. Tipos MP (dependen de categorías)
        mp_created, mp_updated = self._seed_tipos_mp(dry_run)

        self.stdout.write(self.style.SUCCESS(
            f'    ✓ Categorías: {cats_created} creadas / {cats_updated} actualizadas'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'    ✓ Tipos MP: {mp_created} creados / {mp_updated} actualizados'
        ))

    def _seed_categorias(self, dry_run):
        from apps.supply_chain.gestion_proveedores.models import CategoriaMateriaPrima

        created = 0
        updated = 0
        for data in CATEGORIAS_RENDERING:
            codigo = data['codigo']
            defaults = {k: v for k, v in data.items() if k != 'codigo'}
            defaults['is_active'] = True

            if not dry_run:
                _, was_created = CategoriaMateriaPrima.objects.update_or_create(
                    codigo=codigo,
                    defaults=defaults,
                )
                if was_created:
                    created += 1
                else:
                    updated += 1
            else:
                exists = CategoriaMateriaPrima.objects.filter(codigo=codigo).exists()
                if exists:
                    updated += 1
                else:
                    created += 1

        return created, updated

    def _seed_tipos_mp(self, dry_run):
        from apps.supply_chain.gestion_proveedores.models import (
            TipoMateriaPrima,
            CategoriaMateriaPrima,
        )

        # Mapear categorías por código
        cats = {c.codigo: c for c in CategoriaMateriaPrima.objects.all()}

        created = 0
        updated = 0
        for codigo, nombre, cat_codigo, orden in TIPOS_MP_RENDERING:
            categoria = cats.get(cat_codigo)
            if categoria is None:
                if not dry_run:
                    self.stdout.write(self.style.WARNING(
                        f'    [!] Categoría {cat_codigo} no encontrada, omitiendo {codigo}'
                    ))
                continue

            defaults = {
                'nombre': nombre,
                'categoria': categoria,
                'orden': orden,
                'is_active': True,
            }

            if not dry_run:
                _, was_created = TipoMateriaPrima.objects.update_or_create(
                    codigo=codigo,
                    defaults=defaults,
                )
                if was_created:
                    created += 1
                else:
                    updated += 1
            else:
                exists = TipoMateriaPrima.objects.filter(codigo=codigo).exists()
                if exists:
                    updated += 1
                else:
                    created += 1

        return created, updated
