"""
Seed canónico de Geografía de Colombia — Core C0 (datos maestros universales).

Puebla los catálogos `apps.core.Departamento` (33 entidades) y
`apps.core.Ciudad` (~1,104 municipios) con datos DIVIPOLA del DANE.

Fuente primaria:
    - 33 departamentos con códigos DIVIPOLA oficiales (2 dígitos).
    - 1,104 ciudades de `marcovega/colombia-json` (MIT) — nombres oficiales
      DIVIPOLA, sin códigos municipales (pendiente de fuente oficial XLSX DANE
      completa — deuda en H-CAT-07).

Características:
    - Idempotente: `update_or_create` por `codigo` (natural key).
    - Transaccional: todo el seed en una transacción atómica por tenant.
    - Bogotá D.C. agregado como entidad de primer nivel (Distrito Capital),
      independiente de Cundinamarca. La ciudad "Bogotá" del JSON se
      re-atribuye al Distrito Capital (no a Cundinamarca).

Códigos:
    - Departamento.codigo = DIVIPOLA 2 dígitos (ej: "05" Antioquia, "11" Bogotá D.C.)
    - Departamento.codigo_dane = mismo DIVIPOLA (igual al código).
    - Ciudad.codigo = slug único `{depto_codigo}_{slug_nombre}` (ej: "05_medellin").
    - Ciudad.codigo_dane = None por ahora — se poblará cuando se integre el
      CSV oficial DANE con DIVIPOLA 5 dígitos municipal completo.

Uso:
    python manage.py seed_geografia_colombia
    python manage.py seed_geografia_colombia --dry-run

Debe correrse en cada schema de tenant via deploy_seeds_all_tenants.

Historia:
    2026-04-22: Promoción de 81 → 1,104 ciudades. Creado como seed canónico
    de Core; retira la responsabilidad de seed_supply_chain_catalogs (que
    históricamente cargaba solo 81 ciudades principales).
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction


# Códigos DIVIPOLA oficiales del DANE (33 entidades de primer nivel).
# Fuente: https://www.dane.gov.co/index.php/sistema-estadistico-nacional-sen/normas-y-estandares/divipola
# Bogotá D.C. es un Distrito Capital, NO municipio de Cundinamarca.
DEPARTAMENTOS_DIVIPOLA = [
    {'codigo': '05', 'nombre': 'Antioquia'},
    {'codigo': '08', 'nombre': 'Atlántico'},
    {'codigo': '11', 'nombre': 'Bogotá D.C.'},
    {'codigo': '13', 'nombre': 'Bolívar'},
    {'codigo': '15', 'nombre': 'Boyacá'},
    {'codigo': '17', 'nombre': 'Caldas'},
    {'codigo': '18', 'nombre': 'Caquetá'},
    {'codigo': '19', 'nombre': 'Cauca'},
    {'codigo': '20', 'nombre': 'Cesar'},
    {'codigo': '23', 'nombre': 'Córdoba'},
    {'codigo': '25', 'nombre': 'Cundinamarca'},
    {'codigo': '27', 'nombre': 'Chocó'},
    {'codigo': '41', 'nombre': 'Huila'},
    {'codigo': '44', 'nombre': 'La Guajira'},
    {'codigo': '47', 'nombre': 'Magdalena'},
    {'codigo': '50', 'nombre': 'Meta'},
    {'codigo': '52', 'nombre': 'Nariño'},
    {'codigo': '54', 'nombre': 'Norte de Santander'},
    {'codigo': '63', 'nombre': 'Quindío'},
    {'codigo': '66', 'nombre': 'Risaralda'},
    {'codigo': '68', 'nombre': 'Santander'},
    {'codigo': '70', 'nombre': 'Sucre'},
    {'codigo': '73', 'nombre': 'Tolima'},
    {'codigo': '76', 'nombre': 'Valle del Cauca'},
    {'codigo': '81', 'nombre': 'Arauca'},
    {'codigo': '85', 'nombre': 'Casanare'},
    {'codigo': '86', 'nombre': 'Putumayo'},
    {'codigo': '88', 'nombre': 'San Andrés y Providencia'},
    {'codigo': '91', 'nombre': 'Amazonas'},
    {'codigo': '94', 'nombre': 'Guainía'},
    {'codigo': '95', 'nombre': 'Guaviare'},
    {'codigo': '97', 'nombre': 'Vaupés'},
    {'codigo': '99', 'nombre': 'Vichada'},
]

# Capitales oficiales por departamento — se marcan con es_capital=True.
CAPITALES = {
    '05': 'Medellín',
    '08': 'Barranquilla',
    '11': 'Bogotá',
    '13': 'Cartagena',
    '15': 'Tunja',
    '17': 'Manizales',
    '18': 'Florencia',
    '19': 'Popayán',
    '20': 'Valledupar',
    '23': 'Montería',
    '25': 'Zipaquirá',  # Cundinamarca tiene capital administrativa; Bogotá es DC separado
    '27': 'Quibdó',
    '41': 'Neiva',
    '44': 'Riohacha',
    '47': 'Santa Marta',
    '50': 'Villavicencio',
    '52': 'Pasto',
    '54': 'Cúcuta',
    '63': 'Armenia',
    '66': 'Pereira',
    '68': 'Bucaramanga',
    '70': 'Sincelejo',
    '73': 'Ibagué',
    '76': 'Cali',
    '81': 'Arauca',
    '85': 'Yopal',
    '86': 'Mocoa',
    '88': 'San Andrés',
    '91': 'Leticia',
    '94': 'Inírida',
    '95': 'San José del Guaviare',
    '97': 'Mitú',
    '99': 'Puerto Carreño',
}

# Bogotá D.C. — único municipio del distrito (se agrega manualmente).
CIUDAD_BOGOTA_DC = 'Bogotá'


def _slug(s: str) -> str:
    """Normaliza a slug ASCII lowercase sin acentos."""
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii')
    s = s.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '_', s)
    return s.strip('_')


def _load_json_data() -> list[dict]:
    """Lee el JSON de municipios y devuelve la lista de deptos→ciudades."""
    data_path = Path(__file__).parent / 'data' / 'geografia_colombia.json'
    with data_path.open('r', encoding='utf-8') as f:
        return json.load(f)


class Command(BaseCommand):
    help = (
        'Siembra catálogos canónicos de Geografía Colombia '
        '(33 departamentos DIVIPOLA + ~1,104 municipios). Idempotente.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué haría sin ejecutar cambios',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        from apps.core.models import Departamento, Ciudad

        dry_run = options['dry_run']

        # Header
        self.stdout.write('')
        self.stdout.write(self.style.MIGRATE_HEADING(
            '=== SEED GEOGRAFÍA COLOMBIA (DIVIPOLA) ==='
        ))
        if dry_run:
            self.stdout.write(self.style.WARNING('  MODO DRY-RUN (sin cambios)'))

        # ────────────────────────────────────────────────────────────
        # FASE 1 — Departamentos (33 con códigos DIVIPOLA oficiales)
        #
        # Lookup natural key: nombre_normalizado (para preservar IDs de
        # registros existentes con códigos legacy tipo "ANTIOQUIA" que
        # tienen FKs apuntando a ellos). Se UPDATE el `codigo` al DIVIPOLA
        # oficial sin crear nuevos registros.
        # ────────────────────────────────────────────────────────────
        self.stdout.write('\n--- Departamentos (33) ---')
        dept_created, dept_updated = 0, 0
        dept_by_code: dict[str, Departamento] = {}

        # Pre-cargar existentes por nombre normalizado (case + acentos insensitive)
        existing_depts = list(Departamento.objects.all())
        depts_by_normalized_name = {_slug(d.nombre): d for d in existing_depts}

        for idx, item in enumerate(DEPARTAMENTOS_DIVIPOLA):
            code = item['codigo']
            nombre = item['nombre']
            slug_key = _slug(nombre)

            existing = depts_by_normalized_name.get(slug_key)

            if dry_run:
                if existing:
                    dept_updated += 1
                else:
                    dept_created += 1
                continue

            if existing:
                # Preservar ID: solo actualizar campos
                existing.codigo = code
                existing.nombre = nombre
                existing.codigo_dane = code
                existing.orden = idx
                existing.is_active = True
                existing.save(update_fields=[
                    'codigo', 'nombre', 'codigo_dane', 'orden', 'is_active'
                ])
                dept_by_code[code] = existing
                dept_updated += 1
            else:
                obj = Departamento.objects.create(
                    codigo=code,
                    nombre=nombre,
                    codigo_dane=code,
                    orden=idx,
                    is_active=True,
                )
                dept_by_code[code] = obj
                dept_created += 1

        self.stdout.write(self.style.SUCCESS(
            f'  Creados: {dept_created} | Actualizados: {dept_updated}'
        ))

        # ────────────────────────────────────────────────────────────
        # FASE 2 — Ciudades (~1,104 municipios del JSON + Bogotá D.C.)
        #
        # Lookup natural key: (departamento_id, nombre_normalizado).
        # Permite preservar IDs de ciudades legacy que ya tenían FKs
        # apuntando desde Proveedor u otros modelos.
        # ────────────────────────────────────────────────────────────
        self.stdout.write('\n--- Ciudades / Municipios ---')
        city_created, city_updated, city_skipped = 0, 0, 0

        json_data = _load_json_data()

        # Mapeo nombre_departamento (JSON marcovega) → codigo DIVIPOLA.
        name_to_code = {d['nombre']: d['codigo'] for d in DEPARTAMENTOS_DIVIPOLA}

        # Pre-cargar ciudades existentes, indexadas por (dept_id, slug_nombre)
        if dry_run:
            existing_cities_index = {}
        else:
            existing_cities_index = {
                (c.departamento_id, _slug(c.nombre)): c
                for c in Ciudad.objects.select_related('departamento').all()
            }

        for dept_block in json_data:
            dept_name = dept_block['departamento']
            dept_code = name_to_code.get(dept_name)
            if not dept_code:
                self.stdout.write(self.style.WARNING(
                    f'  [SKIP] Depto no mapeado: "{dept_name}"'
                ))
                continue

            if dry_run:
                dept_obj = None
            else:
                dept_obj = dept_by_code.get(dept_code)

            # Deduplicación dentro del JSON por depto (fuente marcovega tiene
            # "Chibolo" duplicado en Magdalena; posibles futuros duplicados).
            seen_slugs_in_dept: set[str] = set()

            for city_name_raw in dept_block['ciudades']:
                city_name = city_name_raw.strip()

                # Regla: Bogotá se atribuye a Bogotá D.C. (11), NO a Cundinamarca (25).
                if city_name == CIUDAD_BOGOTA_DC and dept_code == '25':
                    city_skipped += 1
                    continue

                slug = _slug(city_name)
                if slug in seen_slugs_in_dept:
                    # Duplicado del JSON source — saltamos silenciosamente.
                    continue
                seen_slugs_in_dept.add(slug)

                city_code = f'{dept_code}_{slug}'
                es_capital = (CAPITALES.get(dept_code, '') == city_name)

                if dry_run:
                    city_created += 1
                    continue

                existing = existing_cities_index.get((dept_obj.id, slug))
                if existing:
                    # Preservar ID: update campos
                    existing.codigo = city_code
                    existing.nombre = city_name
                    existing.es_capital = es_capital
                    existing.is_active = True
                    existing.save(update_fields=[
                        'codigo', 'nombre', 'es_capital', 'is_active'
                    ])
                    city_updated += 1
                else:
                    Ciudad.objects.create(
                        codigo=city_code,
                        departamento=dept_obj,
                        nombre=city_name,
                        es_capital=es_capital,
                        is_active=True,
                    )
                    city_created += 1

        # ────────────────────────────────────────────────────────────
        # FASE 3 — Bogotá D.C. (ciudad única del Distrito Capital)
        # ────────────────────────────────────────────────────────────
        if not dry_run:
            bogota_dc = dept_by_code['11']
            slug_bogota = _slug('Bogotá')
            existing = existing_cities_index.get((bogota_dc.id, slug_bogota))
            if existing:
                existing.codigo = '11_bogota'
                existing.nombre = 'Bogotá'
                existing.es_capital = True
                existing.is_active = True
                existing.save()
                city_updated += 1
            else:
                Ciudad.objects.create(
                    codigo='11_bogota',
                    departamento=bogota_dc,
                    nombre='Bogotá',
                    es_capital=True,
                    is_active=True,
                )
                city_created += 1

        self.stdout.write(self.style.SUCCESS(
            f'  Creados: {city_created} | Actualizados: {city_updated}'
        ))
        if city_skipped:
            self.stdout.write(self.style.NOTICE(
                f'  Re-atribuidos a Bogotá D.C. (skipped en Cundinamarca): {city_skipped}'
            ))

        # Totales
        self.stdout.write('')
        self.stdout.write(self.style.MIGRATE_HEADING('=== RESUMEN ==='))
        self.stdout.write(
            f'  Departamentos: {dept_created} creados | {dept_updated} actualizados '
            f'(total: {len(DEPARTAMENTOS_DIVIPOLA)})'
        )
        self.stdout.write(
            f'  Ciudades: {city_created} creadas | {city_updated} actualizadas '
            f'(total esperado: ~1,104)'
        )
        self.stdout.write('')
