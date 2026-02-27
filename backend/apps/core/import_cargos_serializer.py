"""
Serializer de importación masiva de Cargos desde Excel.
Valida y normaliza una fila del archivo antes de crear el Cargo.
"""
from rest_framework import serializers

from .import_cargos_utils import (
    NIVEL_JERARQUICO_MAP,
    NIVEL_EDUCATIVO_MAP,
    EXPERIENCIA_MAP,
    normalizar_valor,
    parsear_entero,
    parsear_bool,
)


class CargoImportRowSerializer(serializers.Serializer):
    """
    Valida una fila del Excel de importación y la convierte a datos listos
    para crear un Cargo.

    Resuelve:
    - area_nombre → area (FK) via lookup por name en el tenant
    - cargo_padre_nombre → parent_cargo (FK) via lookup por name
    - Choices en texto → codes del modelo
    """
    # Identificación (requeridos)
    codigo = serializers.CharField()
    nombre = serializers.CharField()
    nivel_jerarquico = serializers.CharField()

    # Estructura (opcionales)
    area_nombre = serializers.CharField(required=False, allow_blank=True, default='')
    cargo_padre_nombre = serializers.CharField(required=False, allow_blank=True, default='')

    # Descripción
    descripcion = serializers.CharField(required=False, allow_blank=True, default='')

    # Requisitos (opcionales)
    nivel_educativo = serializers.CharField(required=False, allow_blank=True, default='')
    experiencia_requerida = serializers.CharField(required=False, allow_blank=True, default='')

    # Configuración
    cantidad_posiciones = serializers.CharField(required=False, default='1')
    is_jefatura = serializers.CharField(required=False, default='No')

    def validate_codigo(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El código del cargo es requerido.')
        if len(val) > 50:
            raise serializers.ValidationError('El código no puede exceder 50 caracteres.')
        # Normalizar: quitar espacios internos, poner en mayúsculas
        val = val.upper().replace(' ', '_')
        return val

    def validate_nombre(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El nombre del cargo es requerido.')
        if len(val) > 100:
            raise serializers.ValidationError('El nombre no puede exceder 100 caracteres.')
        return val

    def validate_nivel_jerarquico(self, value):
        norm = normalizar_valor(value)
        mapped = NIVEL_JERARQUICO_MAP.get(norm)
        if not mapped:
            raise serializers.ValidationError(
                f'Nivel jerárquico inválido: "{value}". '
                f'Valores válidos: ESTRATEGICO, TACTICO, OPERATIVO, APOYO, EXTERNO'
            )
        return mapped

    def validate_nivel_educativo(self, value):
        val = str(value).strip() if value else ''
        if not val:
            return None
        norm = normalizar_valor(val)
        mapped = NIVEL_EDUCATIVO_MAP.get(norm)
        if not mapped:
            raise serializers.ValidationError(
                f'Nivel educativo inválido: "{value}". '
                f'Valores válidos: PRIMARIA, BACHILLER, TECNICO, TECNOLOGO, PROFESIONAL, '
                f'ESPECIALIZACION, MAESTRIA, DOCTORADO'
            )
        return mapped

    def validate_experiencia_requerida(self, value):
        val = str(value).strip() if value else ''
        if not val:
            return None
        norm = normalizar_valor(val)
        mapped = EXPERIENCIA_MAP.get(norm)
        if not mapped:
            raise serializers.ValidationError(
                f'Experiencia inválida: "{value}". '
                f'Valores válidos: SIN_EXPERIENCIA, 6_MESES, 1_ANO, 2_ANOS, 3_ANOS, 5_ANOS, 10_ANOS'
            )
        return mapped

    def validate(self, attrs):
        # Normalizar valores numéricos y booleanos
        attrs['cantidad_posiciones'] = parsear_entero(attrs.get('cantidad_posiciones', '1'), default=1)
        attrs['is_jefatura'] = parsear_bool(attrs.get('is_jefatura', 'No'))

        # Verificar código único
        from .models import Cargo
        code = attrs.get('codigo')
        if Cargo.objects.filter(code=code).exists():
            raise serializers.ValidationError({
                'codigo': f'Ya existe un cargo con el código "{code}".'
            })

        # Resolver Área por nombre (C1: via apps.get_model, no import directo)
        area_nombre = str(attrs.get('area_nombre', '')).strip()
        if area_nombre:
            try:
                from django.apps import apps as django_apps
                Area = django_apps.get_model('organizacion', 'Area')
                area = Area.objects.get(name__iexact=area_nombre)
                attrs['_area'] = area
            except Exception:
                raise serializers.ValidationError({
                    'area_nombre': (
                        f'No se encontró el área "{area_nombre}". '
                        f'Verifica el nombre exacto en la hoja "Referencia".'
                    )
                })
        else:
            attrs['_area'] = None

        # Resolver Cargo Padre por nombre
        cargo_padre_nombre = str(attrs.get('cargo_padre_nombre', '')).strip()
        if cargo_padre_nombre:
            try:
                parent = Cargo.objects.get(name__iexact=cargo_padre_nombre)
                attrs['_parent_cargo'] = parent
            except Cargo.DoesNotExist:
                raise serializers.ValidationError({
                    'cargo_padre_nombre': (
                        f'No se encontró el cargo padre "{cargo_padre_nombre}". '
                        f'Verifica el nombre exacto en la hoja "Referencia".'
                    )
                })
            except Cargo.MultipleObjectsReturned:
                raise serializers.ValidationError({
                    'cargo_padre_nombre': (
                        f'Se encontraron múltiples cargos con el nombre "{cargo_padre_nombre}". '
                        f'Usa un nombre más específico.'
                    )
                })
        else:
            attrs['_parent_cargo'] = None

        return attrs
