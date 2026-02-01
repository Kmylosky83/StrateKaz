"""
Serializers para Programación de Abastecimiento - Supply Chain
Sistema de Gestión StrateKaz

100% DINÁMICO: Serializers usan modelos de catálogo dinámicos.
"""
from rest_framework import serializers
from decimal import Decimal
from datetime import datetime

from apps.supply_chain.catalogos.models import UnidadMedida
from .models import (
    # Catálogos dinámicos
    TipoOperacion,
    EstadoProgramacion,
    EstadoEjecucion,
    EstadoLiquidacion,
    # Modelos principales
    Programacion,
    AsignacionRecurso,
    Ejecucion,
    Liquidacion,
)


# ==============================================================================
# SERIALIZERS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

class TipoOperacionSerializer(serializers.ModelSerializer):
    """Serializer para tipos de operación."""

    class Meta:
        model = TipoOperacion
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'requiere_vehiculo', 'requiere_conductor', 'color_hex',
            'orden', 'is_active'
        ]
        read_only_fields = ['id']


class EstadoProgramacionSerializer(serializers.ModelSerializer):
    """Serializer para estados de programación."""

    class Meta:
        model = EstadoProgramacion
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'es_estado_inicial', 'es_estado_final', 'color_hex',
            'orden', 'is_active'
        ]
        read_only_fields = ['id']


class UnidadMedidaSerializer(serializers.ModelSerializer):
    """Serializer para unidades de medida."""

    class Meta:
        model = UnidadMedida
        fields = [
            'id', 'codigo', 'nombre', 'simbolo', 'tipo', 'descripcion',
            'factor_conversion_kg', 'orden', 'is_active'
        ]
        read_only_fields = ['id']


class EstadoEjecucionSerializer(serializers.ModelSerializer):
    """Serializer para estados de ejecución."""

    class Meta:
        model = EstadoEjecucion
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'es_estado_inicial', 'es_estado_final', 'color_hex',
            'orden', 'is_active'
        ]
        read_only_fields = ['id']


class EstadoLiquidacionSerializer(serializers.ModelSerializer):
    """Serializer para estados de liquidación."""

    class Meta:
        model = EstadoLiquidacion
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'permite_edicion',
            'es_estado_inicial', 'es_estado_final', 'color_hex',
            'orden', 'is_active'
        ]
        read_only_fields = ['id']


# ==============================================================================
# SERIALIZERS DE ASIGNACIÓN DE RECURSOS
# ==============================================================================

class AsignacionRecursoSerializer(serializers.ModelSerializer):
    """Serializer para asignación de recursos."""

    conductor_nombre = serializers.CharField(
        source='conductor.get_full_name',
        read_only=True,
        allow_null=True
    )
    asignado_por_nombre = serializers.CharField(
        source='asignado_por.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = AsignacionRecurso
        fields = [
            'id', 'programacion', 'vehiculo', 'conductor', 'conductor_nombre',
            'fecha_asignacion', 'observaciones',
            'asignado_por', 'asignado_por_nombre',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'fecha_asignacion', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Validaciones según tipo de operación."""
        programacion = attrs.get('programacion', self.instance.programacion if self.instance else None)

        if programacion:
            tipo_op = programacion.tipo_operacion

            # Validar vehículo requerido
            if tipo_op.requiere_vehiculo and not attrs.get('vehiculo'):
                raise serializers.ValidationError({
                    'vehiculo': f'El tipo de operación {tipo_op.nombre} requiere asignación de vehículo'
                })

            # Validar conductor requerido
            if tipo_op.requiere_conductor and not attrs.get('conductor'):
                raise serializers.ValidationError({
                    'conductor': f'El tipo de operación {tipo_op.nombre} requiere asignación de conductor'
                })

        return attrs


# ==============================================================================
# SERIALIZERS DE EJECUCIÓN
# ==============================================================================

class EjecucionListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listado de ejecuciones."""

    programacion_codigo = serializers.CharField(source='programacion.codigo', read_only=True)
    proveedor_nombre = serializers.CharField(
        source='programacion.proveedor.nombre_comercial',
        read_only=True
    )
    unidad_medida_simbolo = serializers.CharField(source='unidad_medida.simbolo', read_only=True)
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    ejecutado_por_nombre = serializers.CharField(source='ejecutado_por.get_full_name', read_only=True)
    kilometros_recorridos = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    duracion_horas = serializers.FloatField(read_only=True)
    tiene_liquidacion = serializers.BooleanField(read_only=True)

    class Meta:
        model = Ejecucion
        fields = [
            'id', 'programacion', 'programacion_codigo', 'proveedor_nombre',
            'fecha_inicio', 'fecha_fin', 'cantidad_recolectada',
            'unidad_medida', 'unidad_medida_simbolo',
            'kilometros_recorridos', 'duracion_horas',
            'estado', 'estado_nombre', 'ejecutado_por_nombre',
            'tiene_liquidacion', 'created_at'
        ]


class EjecucionDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de ejecución."""

    programacion_data = serializers.SerializerMethodField()
    unidad_medida_data = UnidadMedidaSerializer(source='unidad_medida', read_only=True)
    estado_data = EstadoEjecucionSerializer(source='estado', read_only=True)
    ejecutado_por_nombre = serializers.CharField(source='ejecutado_por.get_full_name', read_only=True)
    kilometros_recorridos = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    duracion_horas = serializers.FloatField(read_only=True)
    tiene_liquidacion = serializers.BooleanField(read_only=True)

    class Meta:
        model = Ejecucion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_programacion_data(self, obj):
        """Datos básicos de la programación."""
        return {
            'id': obj.programacion.id,
            'codigo': obj.programacion.codigo,
            'tipo_operacion': obj.programacion.tipo_operacion.nombre,
            'proveedor': obj.programacion.proveedor.nombre_comercial,
            'fecha_programada': obj.programacion.fecha_programada,
        }


class EjecucionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear ejecuciones."""

    class Meta:
        model = Ejecucion
        fields = [
            'programacion', 'fecha_inicio', 'fecha_fin',
            'kilometraje_inicial', 'kilometraje_final',
            'cantidad_recolectada', 'unidad_medida',
            'estado', 'observaciones'
        ]

    def validate_programacion(self, value):
        """Validar que la programación no tenga ya una ejecución."""
        if hasattr(value, 'ejecucion'):
            raise serializers.ValidationError(
                'Esta programación ya tiene una ejecución registrada'
            )
        return value

    def validate(self, attrs):
        """Validaciones cruzadas."""
        # Validar fechas
        fecha_inicio = attrs.get('fecha_inicio')
        fecha_fin = attrs.get('fecha_fin')

        if fecha_inicio and fecha_fin and fecha_fin < fecha_inicio:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha de finalización debe ser posterior a la fecha de inicio'
            })

        # Validar kilometraje
        km_inicial = attrs.get('kilometraje_inicial')
        km_final = attrs.get('kilometraje_final')

        if km_inicial and km_final and km_final < km_inicial:
            raise serializers.ValidationError({
                'kilometraje_final': 'El kilometraje final debe ser mayor o igual al inicial'
            })

        # Validar cantidad
        cantidad = attrs.get('cantidad_recolectada')
        if cantidad is not None and cantidad <= 0:
            raise serializers.ValidationError({
                'cantidad_recolectada': 'La cantidad debe ser mayor a cero'
            })

        return attrs

    def create(self, validated_data):
        """Crear ejecución y registrar usuario."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['ejecutado_por'] = request.user

        return Ejecucion.objects.create(**validated_data)


# ==============================================================================
# SERIALIZERS DE LIQUIDACIÓN
# ==============================================================================

class LiquidacionListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listado de liquidaciones."""

    programacion_codigo = serializers.CharField(
        source='ejecucion.programacion.codigo',
        read_only=True
    )
    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    liquidado_por_nombre = serializers.CharField(
        source='liquidado_por.get_full_name',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True,
        allow_null=True
    )
    esta_aprobada = serializers.BooleanField(read_only=True)
    puede_editar = serializers.BooleanField(read_only=True)

    class Meta:
        model = Liquidacion
        fields = [
            'id', 'ejecucion', 'programacion_codigo', 'proveedor_nombre',
            'fecha_liquidacion', 'cantidad', 'precio_unitario',
            'subtotal', 'deducciones', 'valor_total',
            'estado', 'estado_nombre', 'genera_cxp', 'numero_cxp',
            'liquidado_por_nombre', 'aprobado_por_nombre', 'fecha_aprobacion',
            'esta_aprobada', 'puede_editar', 'created_at'
        ]


class LiquidacionDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de liquidación."""

    ejecucion_data = serializers.SerializerMethodField()
    proveedor_data = serializers.SerializerMethodField()
    estado_data = EstadoLiquidacionSerializer(source='estado', read_only=True)
    liquidado_por_nombre = serializers.CharField(
        source='liquidado_por.get_full_name',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True,
        allow_null=True
    )
    esta_aprobada = serializers.BooleanField(read_only=True)
    puede_editar = serializers.BooleanField(read_only=True)

    class Meta:
        model = Liquidacion
        fields = '__all__'
        read_only_fields = [
            'subtotal', 'valor_total', 'created_at', 'updated_at', 'fecha_liquidacion'
        ]

    def get_ejecucion_data(self, obj):
        """Datos de la ejecución."""
        ejecucion = obj.ejecucion
        return {
            'id': ejecucion.id,
            'programacion_codigo': ejecucion.programacion.codigo,
            'cantidad_recolectada': str(ejecucion.cantidad_recolectada),
            'unidad_medida': ejecucion.unidad_medida.simbolo,
            'fecha_inicio': ejecucion.fecha_inicio,
            'fecha_fin': ejecucion.fecha_fin,
        }

    def get_proveedor_data(self, obj):
        """Datos del proveedor."""
        proveedor = obj.proveedor
        return {
            'id': proveedor.id,
            'codigo_interno': proveedor.codigo_interno,
            'nombre_comercial': proveedor.nombre_comercial,
            'numero_documento': proveedor.numero_documento,
        }


class LiquidacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear liquidaciones."""

    class Meta:
        model = Liquidacion
        fields = [
            'ejecucion', 'precio_unitario', 'cantidad',
            'deducciones', 'detalle_deducciones',
            'estado', 'genera_cxp', 'observaciones'
        ]

    def validate_ejecucion(self, value):
        """Validar que la ejecución no tenga ya una liquidación."""
        if hasattr(value, 'liquidacion'):
            raise serializers.ValidationError(
                'Esta ejecución ya tiene una liquidación registrada'
            )
        return value

    def validate_precio_unitario(self, value):
        """Validar que el precio sea positivo."""
        if value <= 0:
            raise serializers.ValidationError('El precio unitario debe ser mayor a cero')
        return value

    def validate_cantidad(self, value):
        """Validar que la cantidad sea positiva."""
        if value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a cero')
        return value

    def validate(self, attrs):
        """Validaciones cruzadas."""
        ejecucion = attrs.get('ejecucion')
        cantidad = attrs.get('cantidad')
        precio_unitario = attrs.get('precio_unitario')
        deducciones = attrs.get('deducciones', Decimal('0.00'))

        # Validar que la cantidad coincida con la ejecución
        if ejecucion and cantidad:
            if cantidad != ejecucion.cantidad_recolectada:
                raise serializers.ValidationError({
                    'cantidad': f'La cantidad debe coincidir con la cantidad recolectada ({ejecucion.cantidad_recolectada})'
                })

        # Validar que deducciones no sean mayores al subtotal
        if precio_unitario and cantidad and deducciones:
            subtotal = Decimal(str(precio_unitario)) * Decimal(str(cantidad))
            if Decimal(str(deducciones)) > subtotal:
                raise serializers.ValidationError({
                    'deducciones': 'Las deducciones no pueden ser mayores al subtotal'
                })

        return attrs

    def create(self, validated_data):
        """Crear liquidación y registrar usuario."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['liquidado_por'] = request.user

        return Liquidacion.objects.create(**validated_data)


class LiquidacionUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar liquidaciones."""

    class Meta:
        model = Liquidacion
        fields = [
            'precio_unitario', 'cantidad', 'deducciones',
            'detalle_deducciones', 'observaciones'
        ]

    def validate(self, attrs):
        """Validar que se pueda editar según el estado."""
        instance = self.instance

        if instance and instance.estado and not instance.estado.permite_edicion:
            raise serializers.ValidationError(
                f'No se puede modificar la liquidación en estado {instance.estado.nombre}'
            )

        # Validaciones de valores
        precio = attrs.get('precio_unitario', instance.precio_unitario if instance else None)
        cantidad = attrs.get('cantidad', instance.cantidad if instance else None)
        deducciones = attrs.get('deducciones', instance.deducciones if instance else Decimal('0.00'))

        if precio and precio <= 0:
            raise serializers.ValidationError({
                'precio_unitario': 'El precio unitario debe ser mayor a cero'
            })

        if cantidad and cantidad <= 0:
            raise serializers.ValidationError({
                'cantidad': 'La cantidad debe ser mayor a cero'
            })

        # Validar deducciones vs subtotal
        if precio and cantidad and deducciones:
            subtotal = Decimal(str(precio)) * Decimal(str(cantidad))
            if Decimal(str(deducciones)) > subtotal:
                raise serializers.ValidationError({
                    'deducciones': 'Las deducciones no pueden ser mayores al subtotal'
                })

        return attrs


# ==============================================================================
# SERIALIZERS DE PROGRAMACIÓN
# ==============================================================================

class ProgramacionListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listado de programaciones."""

    empresa_nombre = serializers.CharField(source='empresa.razon_social', read_only=True)
    sede_nombre = serializers.CharField(source='sede.nombre', read_only=True)
    tipo_operacion_nombre = serializers.CharField(source='tipo_operacion.nombre', read_only=True)
    tipo_operacion_color = serializers.CharField(source='tipo_operacion.color_hex', read_only=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    estado_color = serializers.CharField(source='estado.color_hex', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)
    tiene_ejecucion = serializers.BooleanField(read_only=True)
    tiene_liquidacion = serializers.BooleanField(read_only=True)

    class Meta:
        model = Programacion
        fields = [
            'id', 'codigo', 'empresa', 'empresa_nombre',
            'sede', 'sede_nombre',
            'tipo_operacion', 'tipo_operacion_nombre', 'tipo_operacion_color',
            'fecha_programada', 'fecha_ejecucion',
            'proveedor', 'proveedor_nombre',
            'responsable', 'responsable_nombre',
            'estado', 'estado_nombre', 'estado_color',
            'observaciones', 'created_by_nombre', 'created_at',
            'is_deleted', 'tiene_ejecucion', 'tiene_liquidacion'
        ]


class ProgramacionDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de programación."""

    empresa_data = serializers.SerializerMethodField()
    sede_data = serializers.SerializerMethodField()
    tipo_operacion_data = TipoOperacionSerializer(source='tipo_operacion', read_only=True)
    proveedor_data = serializers.SerializerMethodField()
    responsable_data = serializers.SerializerMethodField()
    estado_data = EstadoProgramacionSerializer(source='estado', read_only=True)
    asignacion_recurso = AsignacionRecursoSerializer(read_only=True)
    ejecucion = EjecucionDetailSerializer(read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)
    tiene_ejecucion = serializers.BooleanField(read_only=True)
    tiene_liquidacion = serializers.BooleanField(read_only=True)

    class Meta:
        model = Programacion
        fields = '__all__'
        read_only_fields = ['codigo', 'created_at', 'updated_at', 'deleted_at']

    def get_empresa_data(self, obj):
        """Datos de la empresa."""
        return {
            'id': obj.empresa.id,
            'razon_social': obj.empresa.razon_social,
            'nit': obj.empresa.nit,
        }

    def get_sede_data(self, obj):
        """Datos de la sede."""
        return {
            'id': obj.sede.id,
            'codigo': obj.sede.codigo,
            'nombre': obj.sede.nombre,
            'direccion': obj.sede.direccion,
            'ciudad': obj.sede.ciudad,
        }

    def get_proveedor_data(self, obj):
        """Datos del proveedor."""
        proveedor = obj.proveedor
        return {
            'id': proveedor.id,
            'codigo_interno': proveedor.codigo_interno,
            'nombre_comercial': proveedor.nombre_comercial,
            'numero_documento': proveedor.numero_documento,
            'telefono': proveedor.telefono,
            'direccion': proveedor.direccion,
        }

    def get_responsable_data(self, obj):
        """Datos del responsable."""
        return {
            'id': obj.responsable.id,
            'nombre_completo': obj.responsable.get_full_name(),
            'email': obj.responsable.email,
        }


class ProgramacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear programaciones."""

    class Meta:
        model = Programacion
        fields = [
            'empresa', 'sede', 'tipo_operacion', 'fecha_programada',
            'proveedor', 'responsable', 'estado', 'observaciones'
        ]

    def validate_proveedor(self, value):
        """Validar que el proveedor esté activo."""
        if not value.is_active:
            raise serializers.ValidationError('El proveedor no está activo')
        return value

    def validate_sede(self, value):
        """Validar que la sede esté activa."""
        if not value.is_active:
            raise serializers.ValidationError('La sede no está activa')
        return value

    def validate_tipo_operacion(self, value):
        """Validar que el tipo de operación esté activo."""
        if not value.is_active:
            raise serializers.ValidationError('El tipo de operación no está activo')
        return value

    def validate_estado(self, value):
        """Validar que el estado esté activo."""
        if not value.is_active:
            raise serializers.ValidationError('El estado no está activo')
        return value

    def create(self, validated_data):
        """Crear programación y registrar usuario."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        return Programacion.objects.create(**validated_data)


class ProgramacionUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar programaciones."""

    class Meta:
        model = Programacion
        fields = [
            'fecha_programada', 'fecha_ejecucion', 'responsable',
            'estado', 'observaciones'
        ]

    def validate_estado(self, value):
        """Validar que el estado esté activo."""
        if not value.is_active:
            raise serializers.ValidationError('El estado no está activo')
        return value
