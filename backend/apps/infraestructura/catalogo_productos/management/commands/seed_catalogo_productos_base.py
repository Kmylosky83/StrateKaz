"""
Seed: Catálogo de Productos — bases universales del sistema.

Crea en cada tenant:
  - 12 Unidades de Medida estándar (SI + comerciales) con is_system=True

Las categorías NO se seedean: quedan 100% a criterio del tenant. La
clasificación funcional (Materia prima / Insumo / PT / Servicio) vive en el
enum Producto.tipo, por lo que seedear categorías raíz con los mismos nombres
era redundante. Cada tenant crea sus categorías según su taxonomía de negocio
(ej: "Grasas Animales > Sebo Vacuno").

Incluye cleanup defensivo que elimina las categorías raíz generadas por
versiones anteriores del seed (solo si no tienen dependencias).

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

# Categorías raíz que versiones anteriores del seed creaban con is_system=True.
# Se limpian defensivamente si no tienen productos ni subcategorías creados.
LEGACY_CATEGORIAS_RAIZ = ['Materias Primas', 'Insumos', 'Productos Terminados', 'Servicios']


class Command(BaseCommand):
    help = 'Crea unidades de medida base del catálogo de productos (is_system=True)'

    @transaction.atomic
    def handle(self, *args, **options):
        UnidadMedida = apps.get_model('infra_catalogo_productos', 'UnidadMedida')
        CategoriaProducto = apps.get_model('infra_catalogo_productos', 'CategoriaProducto')

        # Cleanup defensivo: borrar categorías raíz del seed legacy si están vacías
        legacy_vacias = CategoriaProducto.objects.filter(
            nombre__in=LEGACY_CATEGORIAS_RAIZ,
            parent__isnull=True,
            is_system=True,
            is_deleted=False,
            subcategorias__isnull=True,
            productos__isnull=True,
        ).distinct()
        eliminadas = legacy_vacias.count()
        if eliminadas:
            legacy_vacias.delete()
            self.stdout.write(self.style.WARNING(
                f'    ⚠ {eliminadas} categorías raíz legacy eliminadas (vacías)'
            ))

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
