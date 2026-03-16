"""
Serializers para Activos Fijos - Admin Finance
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import (
    CategoriaActivo, ActivoFijo, HojaVidaActivo,
    ProgramaMantenimiento, Depreciacion, Baja
)


# ==============================================================================
# SERIALIZERS DE CATEGORÍA DE ACTIVO
# ==============================================================================

class CategoriaActivoSerializer(serializers.ModelSerializer):
    """Serializer para CategoriaActivo."""

    metodo_depreciacion_display = serializers.CharField(
        source='get_metodo_depreciacion_display',
        read_only=True
    )
    vida_util_meses = serializers.IntegerField(read_only=True)
    cantidad_activos = serializers.SerializerMethodField()

    class Meta:
        model = CategoriaActivo
        fields = [
            'id', 'empresa', 'codigo', 'nombre', 'descripcion',
            'vida_util_anios', 'vida_util_meses',
            'metodo_depreciacion', 'metodo_depreciacion_display',
            'cantidad_activos',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_cantidad_activos(self, obj):
        """Retorna la cantidad de activos en esta categoría."""
        return obj.activos.filter(is_active=True, estado__in=['activo', 'en_mantenimiento']).count()


class CategoriaActivoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de categorías."""

    metodo_depreciacion_display = serializers.CharField(
        source='get_metodo_depreciacion_display',
        read_only=True
    )

    class Meta:
        model = CategoriaActivo
        fields = [
            'id', 'codigo', 'nombre', 'vida_util_anios',
            'metodo_depreciacion', 'metodo_depreciacion_display'
        ]


# ==============================================================================
# SERIALIZERS DE ACTIVO FIJO
# ==============================================================================

class ActivoFijoSerializer(serializers.ModelSerializer):
    """Serializer para ActivoFijo."""

    # Properties calculadas
    valor_depreciable = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    depreciacion_mensual = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    depreciacion_acumulada = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    valor_en_libros = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    meses_desde_adquisicion = serializers.IntegerField(read_only=True)
    porcentaje_depreciacion = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )

    # Displays
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Relaciones nested (read only)
    categoria_nombre = serializers.CharField(
        source='categoria.nombre',
        read_only=True
    )
    categoria_codigo = serializers.CharField(
        source='categoria.codigo',
        read_only=True
    )
    area_nombre = serializers.CharField(
        source='area.name',
        read_only=True,
        allow_null=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = ActivoFijo
        fields = [
            'id', 'empresa', 'codigo',
            'categoria', 'categoria_codigo', 'categoria_nombre',
            'nombre', 'descripcion',
            'numero_serie', 'marca', 'modelo',
            'fecha_adquisicion', 'valor_adquisicion', 'valor_residual',
            'valor_depreciable', 'depreciacion_mensual',
            'depreciacion_acumulada', 'valor_en_libros',
            'meses_desde_adquisicion', 'porcentaje_depreciacion',
            'ubicacion', 'area', 'area_nombre',
            'responsable', 'responsable_nombre',
            'estado', 'estado_display', 'observaciones',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'codigo', 'valor_depreciable', 'depreciacion_mensual',
            'depreciacion_acumulada', 'valor_en_libros', 'meses_desde_adquisicion',
            'porcentaje_depreciacion', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        # Validar valor residual
        if 'valor_residual' in data and 'valor_adquisicion' in data:
            if data['valor_residual'] > data['valor_adquisicion']:
                raise serializers.ValidationError({
                    'valor_residual': 'El valor residual no puede ser mayor al valor de adquisición.'
                })

        # Validar que no se modifique un activo dado de baja
        if self.instance and self.instance.estado == 'dado_baja':
            raise serializers.ValidationError(
                'No se puede modificar un activo que está dado de baja.'
            )

        return data


class ActivoFijoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de activos."""

    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    area_nombre = serializers.CharField(
        source='area.name',
        read_only=True,
        allow_null=True
    )
    valor_en_libros = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = ActivoFijo
        fields = [
            'id', 'codigo', 'nombre', 'categoria_nombre', 'area_nombre',
            'fecha_adquisicion', 'valor_adquisicion', 'valor_en_libros',
            'estado', 'estado_display', 'ubicacion'
        ]


# ==============================================================================
# SERIALIZERS DE HOJA DE VIDA
# ==============================================================================

class HojaVidaActivoSerializer(serializers.ModelSerializer):
    """Serializer para HojaVidaActivo."""

    tipo_evento_display = serializers.CharField(
        source='get_tipo_evento_display',
        read_only=True
    )
    activo_codigo = serializers.CharField(
        source='activo.codigo',
        read_only=True
    )
    activo_nombre = serializers.CharField(
        source='activo.nombre',
        read_only=True
    )
    realizado_por_nombre = serializers.CharField(
        source='realizado_por.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = HojaVidaActivo
        fields = [
            'id', 'empresa', 'codigo',
            'activo', 'activo_codigo', 'activo_nombre',
            'tipo_evento', 'tipo_evento_display', 'fecha', 'descripcion',
            'costo', 'realizado_por', 'realizado_por_nombre',
            'documento_soporte',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'codigo',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        # Validar que el activo no esté dado de baja
        activo = data.get('activo') or (self.instance.activo if self.instance else None)
        if activo and activo.estado == 'dado_baja':
            raise serializers.ValidationError({
                'activo': 'No se pueden registrar eventos en un activo dado de baja.'
            })

        return data


class HojaVidaActivoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de hojas de vida."""

    tipo_evento_display = serializers.CharField(
        source='get_tipo_evento_display',
        read_only=True
    )
    activo_codigo = serializers.CharField(source='activo.codigo', read_only=True)

    class Meta:
        model = HojaVidaActivo
        fields = [
            'id', 'codigo', 'activo_codigo',
            'tipo_evento', 'tipo_evento_display',
            'fecha', 'descripcion', 'costo'
        ]


# ==============================================================================
# SERIALIZERS DE PROGRAMA DE MANTENIMIENTO
# ==============================================================================

class ProgramaMantenimientoSerializer(serializers.ModelSerializer):
    """Serializer para ProgramaMantenimiento."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)
    dias_para_mantenimiento = serializers.IntegerField(read_only=True)

    activo_codigo = serializers.CharField(source='activo.codigo', read_only=True)
    activo_nombre = serializers.CharField(source='activo.nombre', read_only=True)
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = ProgramaMantenimiento
        fields = [
            'id', 'empresa',
            'activo', 'activo_codigo', 'activo_nombre',
            'tipo', 'tipo_display', 'descripcion',
            'frecuencia_dias', 'ultima_fecha', 'proxima_fecha',
            'dias_para_mantenimiento', 'esta_vencido',
            'responsable', 'responsable_nombre',
            'estado', 'estado_display', 'observaciones',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'esta_vencido', 'dias_para_mantenimiento',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        # Validar que el activo no esté dado de baja
        activo = data.get('activo') or (self.instance.activo if self.instance else None)
        if activo and activo.estado == 'dado_baja':
            raise serializers.ValidationError({
                'activo': 'No se puede programar mantenimiento en un activo dado de baja.'
            })

        return data


class ProgramaMantenimientoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de programas de mantenimiento."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    activo_codigo = serializers.CharField(source='activo.codigo', read_only=True)
    dias_para_mantenimiento = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProgramaMantenimiento
        fields = [
            'id', 'activo_codigo', 'tipo', 'tipo_display',
            'proxima_fecha', 'dias_para_mantenimiento',
            'estado', 'estado_display'
        ]


# ==============================================================================
# SERIALIZERS DE DEPRECIACIÓN
# ==============================================================================

class DepreciacionSerializer(serializers.ModelSerializer):
    """Serializer para Depreciacion."""

    activo_codigo = serializers.CharField(source='activo.codigo', read_only=True)
    activo_nombre = serializers.CharField(source='activo.nombre', read_only=True)
    periodo_label = serializers.SerializerMethodField()

    class Meta:
        model = Depreciacion
        fields = [
            'id', 'empresa',
            'activo', 'activo_codigo', 'activo_nombre',
            'periodo_mes', 'periodo_anio', 'periodo_label',
            'valor_inicial', 'depreciacion_periodo',
            'depreciacion_acumulada', 'valor_en_libros',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def get_periodo_label(self, obj):
        """Retorna el período en formato legible."""
        return f"{obj.periodo_mes:02d}/{obj.periodo_anio}"

    def validate(self, data):
        """Validaciones generales."""
        # Validar que el activo no esté dado de baja
        activo = data.get('activo') or (self.instance.activo if self.instance else None)
        if activo and activo.estado == 'dado_baja':
            raise serializers.ValidationError({
                'activo': 'No se puede depreciar un activo dado de baja.'
            })

        # Validar mes
        if 'periodo_mes' in data and (data['periodo_mes'] < 1 or data['periodo_mes'] > 12):
            raise serializers.ValidationError({
                'periodo_mes': 'El mes debe estar entre 1 y 12.'
            })

        return data


class DepreciacionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de depreciaciones."""

    activo_codigo = serializers.CharField(source='activo.codigo', read_only=True)
    periodo_label = serializers.SerializerMethodField()

    class Meta:
        model = Depreciacion
        fields = [
            'id', 'activo_codigo', 'periodo_label',
            'depreciacion_periodo', 'depreciacion_acumulada', 'valor_en_libros'
        ]

    def get_periodo_label(self, obj):
        """Retorna el período en formato legible."""
        return f"{obj.periodo_mes:02d}/{obj.periodo_anio}"


# ==============================================================================
# SERIALIZERS DE BAJA
# ==============================================================================

class BajaSerializer(serializers.ModelSerializer):
    """Serializer para Baja."""

    motivo_display = serializers.CharField(source='get_motivo_display', read_only=True)
    diferencia_valor_residual = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )

    activo_codigo = serializers.CharField(source='activo.codigo', read_only=True)
    activo_nombre = serializers.CharField(source='activo.nombre', read_only=True)
    activo_valor_residual_estimado = serializers.DecimalField(
        source='activo.valor_residual',
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Baja
        fields = [
            'id', 'empresa',
            'activo', 'activo_codigo', 'activo_nombre',
            'activo_valor_residual_estimado',
            'fecha_baja', 'motivo', 'motivo_display',
            'valor_residual_real', 'diferencia_valor_residual',
            'acta_baja', 'observaciones',
            'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'empresa', 'diferencia_valor_residual',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate(self, data):
        """Validaciones generales."""
        # Validar que el activo no esté ya dado de baja
        activo = data.get('activo') or (self.instance.activo if self.instance else None)
        if activo and activo.estado == 'dado_baja' and not self.instance:
            raise serializers.ValidationError({
                'activo': 'El activo ya está dado de baja.'
            })

        return data


class BajaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de bajas."""

    motivo_display = serializers.CharField(source='get_motivo_display', read_only=True)
    activo_codigo = serializers.CharField(source='activo.codigo', read_only=True)
    activo_nombre = serializers.CharField(source='activo.nombre', read_only=True)

    class Meta:
        model = Baja
        fields = [
            'id', 'activo_codigo', 'activo_nombre',
            'fecha_baja', 'motivo', 'motivo_display',
            'valor_residual_real'
        ]
