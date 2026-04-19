"""
Seed: Catálogo de Productos — bases universales del sistema.

Crea en cada tenant:
  - 12 Unidades de Medida estándar (SI + comerciales) con is_system=True
  - 4 Categorías raíz (MP, Insumos, PT, Servicios) con is_system=True

Idempotente — usa update_or_create con unique por campo natural.
No toca registros con is_system=False (personalizados por el tenant).
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.apps import apps


UNIDADES_SISTEMA = [
    # PESO
    {'nombre': 'Kilogramo', 'abreviatura': 'kg', 'tipo': 'PESO', 'factor_conversion': '1.000000', 'es_base': True, 'orden': 1},
    {'nombre': 'Gramo', 'abreviatura': 'g', 'tipo': 'PESO', 'factor_conversion': '0.001000', 'es_base': False, 'orden': 2},
    {'nombre': 'Tonelada', 'abreviatura': 't', 'tipo': 'PESO', 'factor_conversion': '1000.000000', 'es_base': False, 'orden': 3},
    # VOLUMEN
    {'nombre': 'Litro', 'abreviatura': 'L', 'tipo': 'VOLUMEN', 'factor_conversion': '1.000000', 'es_base': True, 'orden': 1},
    {'nombre': 'Mililitro', 'abreviatura': 'mL', 'tipo': 'VOLUMEN', 'factor_conversion': '0.001000', 'es_base': False, 'orden': 2},
    {'nombre': 'Metro cúbico', 'abreviatura': 'm³', 'tipo': 'VOLUMEN', 'factor_conversion': '1000.000000', 'es_base': False, 'orden': 3},
    # LONGITUD
    {'nombre': 'Metro', 'abreviatura': 'm', 'tipo': 'LONGITUD', 'factor_conversion': '1.000000', 'es_base': True, 'orden': 1},
    {'nombre': 'Centímetro', 'abreviatura': 'cm', 'tipo': 'LONGITUD', 'factor_conversion': '0.010000', 'es_base': False, 'orden': 2},
    # UNIDAD
    {'nombre': 'Unidad', 'abreviatura': 'und', 'tipo': 'UNIDAD', 'factor_conversion': '1.000000', 'es_base': True, 'orden': 1},
    {'nombre': 'Caja', 'abreviatura': 'caja', 'tipo': 'UNIDAD', 'factor_conversion': None, 'es_base': False, 'orden': 2},
    {'nombre': 'Paquete', 'abreviatura': 'pqt', 'tipo': 'UNIDAD', 'factor_conversion': None, 'es_base': False, 'orden': 3},
    {'nombre': 'Docena', 'abreviatura': 'dz', 'tipo': 'UNIDAD', 'factor_conversion': '12.000000', 'es_base': False, 'orden': 4},
]


CATEGORIAS_RAIZ = [
    {'nombre': 'Materias Primas', 'codigo': 'MP', 'orden': 1, 'descripcion': 'Materiales que entran a producción y se transforman en el producto final'},
    {'nombre': 'Insumos', 'codigo': 'INS', 'orden': 2, 'descripcion': 'Materiales de consumo interno que no se transforman (empaques, etiquetas, limpieza)'},
    {'nombre': 'Productos Terminados', 'codigo': 'PT', 'orden': 3, 'descripcion': 'Productos finales que la empresa vende'},
    {'nombre': 'Servicios', 'codigo': 'SRV', 'orden': 4, 'descripcion': 'Servicios contratados o prestados (intangibles)'},
]


class Command(BaseCommand):
    help = 'Crea unidades de medida y categorías base del catálogo de productos (is_system=True)'

    @transaction.atomic
    def handle(self, *args, **options):
        UnidadMedida = apps.get_model('catalogo_productos', 'UnidadMedida')
        CategoriaProducto = apps.get_model('catalogo_productos', 'CategoriaProducto')

        unidades_creadas, unidades_actualizadas = 0, 0
        for data in UNIDADES_SISTEMA:
            defaults = {**data, 'is_system': True}
            _, created = UnidadMedida.objects.update_or_create(
                nombre=data['nombre'],
                is_deleted=False,
                defaults=defaults,
            )
            if created:
                unidades_creadas += 1
            else:
                unidades_actualizadas += 1

        self.stdout.write(self.style.SUCCESS(
            f'    ✓ Unidades de Medida: {unidades_creadas} creadas, '
            f'{unidades_actualizadas} actualizadas (total: {len(UNIDADES_SISTEMA)})'
        ))

        categorias_creadas, categorias_actualizadas = 0, 0
        for data in CATEGORIAS_RAIZ:
            defaults = {**data, 'parent': None, 'is_system': True}
            _, created = CategoriaProducto.objects.update_or_create(
                nombre=data['nombre'],
                parent=None,
                is_deleted=False,
                defaults=defaults,
            )
            if created:
                categorias_creadas += 1
            else:
                categorias_actualizadas += 1

        self.stdout.write(self.style.SUCCESS(
            f'    ✓ Categorías raíz: {categorias_creadas} creadas, '
            f'{categorias_actualizadas} actualizadas (total: {len(CATEGORIAS_RAIZ)})'
        ))
