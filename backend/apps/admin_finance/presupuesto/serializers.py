"""
Serializers para Presupuesto - Admin Finance
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import (
    CentroCosto, Rubro, PresupuestoPorArea,
    Aprobacion, Ejecucion
)


# ==============================================================================
# SERIALIZERS DE CENTRO DE COSTO
# ==============================================================================

class CentroCostoSerializer(serializers.ModelSerializer):
    """Serializer para Centro de Costo."""

    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    area_nombre = serializers.CharField(
        source='area.nombre',
        read_only=True,
        allow_null=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = CentroCosto
        fields = [
            'id', 'empresa', 'codigo', 'nombre', 'descripcion',
            'area', 'area_nombre', 'responsable', 'responsable_nombre',
            'estado', 'estado_display',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def validate_codigo(self, value):
        """Validar formato de código."""
        if not value.startswith('CC-'):
            raise serializers.ValidationError(
                'El código debe seguir el formato CC-XXX (ej: CC-001)'
            )
        return value


class CentroCostoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de centros de costo."""

    area_nombre = serializers.CharField(source='area.nombre', read_only=True, allow_null=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = CentroCosto
        fields = ['id', 'codigo', 'nombre', 'area_nombre', 'estado', 'estado_display']


# ==============================================================================
# SERIALIZERS DE RUBRO
# ==============================================================================

class RubroSerializer(serializers.ModelSerializer):
    """Serializer para Rubro Presupuestal."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    rubro_padre_nombre = serializers.CharField(
        source='rubro_padre.nombre',
        read_only=True,
        allow_null=True
    )

    # Nested para sub-rubros
    subrubros = serializers.SerializerMethodField()

    class Meta:
        model = Rubro
        fields = [
            'id', 'empresa', 'codigo', 'nombre', 'tipo', 'tipo_display',
            'categoria', 'categoria_display', 'descripcion',
            'rubro_padre', 'rubro_padre_nombre', 'subrubros',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'codigo',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def get_subrubros(self, obj):
        """Obtiene los sub-rubros."""
        if obj.subrubros.exists():
            return RubroListSerializer(obj.subrubros.all(), many=True).data
        return []


class RubroListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de rubros."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = Rubro
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'tipo_display',
            'categoria', 'categoria_display'
        ]


# ==============================================================================
# SERIALIZERS DE PRESUPUESTO POR ÁREA
# ==============================================================================

class PresupuestoPorAreaSerializer(serializers.ModelSerializer):
    """Serializer para Presupuesto Por Área."""

    saldo_disponible = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    porcentaje_ejecucion = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Relaciones nested (read only)
    area_nombre = serializers.CharField(
        source='area.nombre',
        read_only=True,
        allow_null=True
    )
    centro_costo_nombre = serializers.CharField(
        source='centro_costo.nombre',
        read_only=True,
        allow_null=True
    )
    rubro_nombre = serializers.CharField(
        source='rubro.nombre',
        read_only=True
    )
    rubro_tipo = serializers.CharField(
        source='rubro.tipo',
        read_only=True
    )

    class Meta:
        model = PresupuestoPorArea
        fields = [
            'id', 'empresa', 'codigo',
            'area', 'area_nombre',
            'centro_costo', 'centro_costo_nombre',
            'rubro', 'rubro_nombre', 'rubro_tipo',
            'anio', 'monto_asignado', 'monto_ejecutado',
            'saldo_disponible', 'porcentaje_ejecucion',
            'estado', 'estado_display', 'observaciones',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'codigo', 'saldo_disponible', 'porcentaje_ejecucion',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        # Validar que al menos área o centro de costo esté presente
        if not data.get('area') and not data.get('centro_costo'):
            raise serializers.ValidationError(
                'Debe especificar al menos un área o centro de costo.'
            )

        # Validar montos
        if data.get('monto_ejecutado', 0) > data.get('monto_asignado', 0):
            raise serializers.ValidationError({
                'monto_ejecutado': 'El monto ejecutado no puede ser mayor al monto asignado.'
            })

        # Validar año
        anio = data.get('anio')
        if anio and (anio < 2020 or anio > 2100):
            raise serializers.ValidationError({
                'anio': 'El año debe estar entre 2020 y 2100.'
            })

        return data


class PresupuestoPorAreaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de presupuestos."""

    saldo_disponible = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    porcentaje_ejecucion = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    area_nombre = serializers.CharField(
        source='area.nombre',
        read_only=True,
        allow_null=True
    )
    centro_costo_nombre = serializers.CharField(
        source='centro_costo.nombre',
        read_only=True,
        allow_null=True
    )
    rubro_nombre = serializers.CharField(source='rubro.nombre', read_only=True)

    class Meta:
        model = PresupuestoPorArea
        fields = [
            'id', 'codigo', 'area_nombre', 'centro_costo_nombre',
            'rubro_nombre', 'anio', 'monto_asignado', 'monto_ejecutado',
            'saldo_disponible', 'porcentaje_ejecucion', 'estado', 'estado_display'
        ]


# ==============================================================================
# SERIALIZERS DE APROBACIÓN
# ==============================================================================

class AprobacionSerializer(serializers.ModelSerializer):
    """Serializer para Aprobación de Presupuesto."""

    nivel_aprobacion_display = serializers.CharField(
        source='get_nivel_aprobacion_display',
        read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Relaciones nested (read only)
    presupuesto_codigo = serializers.CharField(
        source='presupuesto.codigo',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Aprobacion
        fields = [
            'id', 'empresa',
            'presupuesto', 'presupuesto_codigo',
            'nivel_aprobacion', 'nivel_aprobacion_display', 'orden',
            'aprobado_por', 'aprobado_por_nombre',
            'fecha_aprobacion', 'estado', 'estado_display',
            'observaciones',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'aprobado_por', 'fecha_aprobacion',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        # Validar que el presupuesto esté en estado pendiente_aprobacion
        presupuesto = data.get('presupuesto')
        if presupuesto and presupuesto.estado not in ['borrador', 'pendiente_aprobacion']:
            raise serializers.ValidationError({
                'presupuesto': f'El presupuesto debe estar en estado Borrador o Pendiente de Aprobación. Estado actual: {presupuesto.get_estado_display()}'
            })

        return data


class AprobacionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de aprobaciones."""

    nivel_aprobacion_display = serializers.CharField(
        source='get_nivel_aprobacion_display',
        read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    presupuesto_codigo = serializers.CharField(source='presupuesto.codigo', read_only=True)
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Aprobacion
        fields = [
            'id', 'presupuesto_codigo', 'nivel_aprobacion', 'nivel_aprobacion_display',
            'orden', 'aprobado_por_nombre', 'fecha_aprobacion',
            'estado', 'estado_display'
        ]


# ==============================================================================
# SERIALIZERS DE EJECUCIÓN
# ==============================================================================

class EjecucionSerializer(serializers.ModelSerializer):
    """Serializer para Ejecución Presupuestal."""

    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Relaciones nested (read only)
    presupuesto_codigo = serializers.CharField(
        source='presupuesto.codigo',
        read_only=True
    )
    presupuesto_area = serializers.CharField(
        source='presupuesto.area.nombre',
        read_only=True,
        allow_null=True
    )
    presupuesto_rubro = serializers.CharField(
        source='presupuesto.rubro.nombre',
        read_only=True
    )
    presupuesto_saldo_disponible = serializers.DecimalField(
        source='presupuesto.saldo_disponible',
        max_digits=15,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = Ejecucion
        fields = [
            'id', 'empresa', 'codigo',
            'presupuesto', 'presupuesto_codigo', 'presupuesto_area',
            'presupuesto_rubro', 'presupuesto_saldo_disponible',
            'fecha', 'monto', 'concepto',
            'documento_soporte', 'numero_documento',
            'estado', 'estado_display', 'observaciones',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'codigo',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        presupuesto = data.get('presupuesto')
        monto = data.get('monto')
        estado = data.get('estado', 'ejecutado')

        if presupuesto and monto and estado == 'ejecutado':
            # Validar que el presupuesto esté aprobado o vigente
            if presupuesto.estado not in ['aprobado', 'vigente']:
                raise serializers.ValidationError({
                    'presupuesto': f'El presupuesto debe estar Aprobado o Vigente. Estado actual: {presupuesto.get_estado_display()}'
                })

            # Validar que no exceda el saldo disponible
            saldo_disponible = presupuesto.saldo_disponible
            if monto > saldo_disponible:
                raise serializers.ValidationError({
                    'monto': f'El monto ({monto}) excede el saldo disponible del presupuesto ({saldo_disponible})'
                })

        return data


class EjecucionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de ejecuciones."""

    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    presupuesto_codigo = serializers.CharField(source='presupuesto.codigo', read_only=True)
    presupuesto_area = serializers.CharField(
        source='presupuesto.area.nombre',
        read_only=True,
        allow_null=True
    )
    presupuesto_rubro = serializers.CharField(source='presupuesto.rubro.nombre', read_only=True)

    class Meta:
        model = Ejecucion
        fields = [
            'id', 'codigo', 'fecha', 'monto', 'concepto',
            'presupuesto_codigo', 'presupuesto_area', 'presupuesto_rubro',
            'estado', 'estado_display'
        ]
