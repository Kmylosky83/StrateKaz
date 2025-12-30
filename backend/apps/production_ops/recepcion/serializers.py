"""
Serializers para Recepción de Materia Prima - Production Ops
Sistema de Gestión Grasas y Huesos del Norte

100% DINÁMICO: Serializers usan modelos de catálogo dinámicos.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone

from .models import (
    TipoRecepcion,
    EstadoRecepcion,
    PuntoRecepcion,
    Recepcion,
    DetalleRecepcion,
    ControlCalidadRecepcion,
)


# ==============================================================================
# SERIALIZERS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

class TipoRecepcionSerializer(serializers.ModelSerializer):
    """Serializer para Tipos de Recepción."""

    class Meta:
        model = TipoRecepcion
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'requiere_pesaje', 'requiere_acidez', 'requiere_temperatura',
            'requiere_control_calidad', 'orden', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TipoRecepcionListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listados."""

    class Meta:
        model = TipoRecepcion
        fields = ['id', 'codigo', 'nombre']


class EstadoRecepcionSerializer(serializers.ModelSerializer):
    """Serializer para Estados de Recepción."""

    class Meta:
        model = EstadoRecepcion
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'color',
            'es_inicial', 'es_final', 'permite_edicion', 'genera_inventario',
            'orden', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EstadoRecepcionListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listados."""

    class Meta:
        model = EstadoRecepcion
        fields = ['id', 'codigo', 'nombre', 'color']


class PuntoRecepcionSerializer(serializers.ModelSerializer):
    """Serializer para Puntos de Recepción."""

    class Meta:
        model = PuntoRecepcion
        fields = [
            'id', 'empresa', 'codigo', 'nombre', 'descripcion', 'ubicacion',
            'capacidad_kg', 'bascula_asignada', 'orden', 'is_active',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']


class PuntoRecepcionListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listados."""

    class Meta:
        model = PuntoRecepcion
        fields = ['id', 'codigo', 'nombre', 'ubicacion']


# ==============================================================================
# SERIALIZERS DE DETALLE Y CONTROL DE CALIDAD
# ==============================================================================

class DetalleRecepcionSerializer(serializers.ModelSerializer):
    """Serializer para Detalle de Recepción."""

    tipo_materia_prima_nombre = serializers.CharField(
        source='tipo_materia_prima.nombre', read_only=True
    )
    tipo_materia_prima_codigo = serializers.CharField(
        source='tipo_materia_prima.codigo', read_only=True
    )
    cumple_acidez = serializers.BooleanField(read_only=True)

    class Meta:
        model = DetalleRecepcion
        fields = [
            'id', 'recepcion', 'tipo_materia_prima', 'tipo_materia_prima_nombre',
            'tipo_materia_prima_codigo', 'cantidad', 'unidad_medida',
            'acidez_medida', 'cumple_acidez', 'temperatura',
            'precio_unitario', 'subtotal', 'lote_asignado', 'observaciones',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'subtotal', 'created_at', 'updated_at']

    def validate_cantidad(self, value):
        """Validar que cantidad sea positiva."""
        if value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a cero')
        return value

    def validate_precio_unitario(self, value):
        """Validar que precio unitario sea positivo."""
        if value <= 0:
            raise serializers.ValidationError('El precio unitario debe ser mayor a cero')
        return value

    def validate_acidez_medida(self, value):
        """Validar rango de acidez."""
        if value is not None:
            if value < 0 or value > 100:
                raise serializers.ValidationError('La acidez debe estar entre 0 y 100%')
        return value


class ControlCalidadRecepcionSerializer(serializers.ModelSerializer):
    """Serializer para Control de Calidad de Recepción."""

    verificado_por_nombre = serializers.CharField(
        source='verificado_por.get_full_name', read_only=True
    )
    estado_cumplimiento = serializers.CharField(read_only=True)

    class Meta:
        model = ControlCalidadRecepcion
        fields = [
            'id', 'recepcion', 'parametro', 'valor_esperado', 'valor_obtenido',
            'cumple', 'observaciones', 'verificado_por', 'verificado_por_nombre',
            'fecha_verificacion', 'estado_cumplimiento', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'fecha_verificacion', 'created_at', 'updated_at']

    def validate_parametro(self, value):
        """Validar que parámetro no esté vacío."""
        if not value or not value.strip():
            raise serializers.ValidationError('El parámetro de control es obligatorio')
        return value.lower().strip()


# ==============================================================================
# SERIALIZERS DE RECEPCIÓN
# ==============================================================================

class RecepcionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de recepciones (campos resumidos)."""

    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial', read_only=True
    )
    tipo_recepcion_nombre = serializers.CharField(
        source='tipo_recepcion.nombre', read_only=True
    )
    punto_recepcion_nombre = serializers.CharField(
        source='punto_recepcion.nombre', read_only=True
    )
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    estado_color = serializers.CharField(source='estado.color', read_only=True)
    recibido_por_nombre = serializers.CharField(
        source='recibido_por.get_full_name', read_only=True
    )
    tiene_detalles = serializers.BooleanField(read_only=True)
    total_cantidad_detalles = serializers.DecimalField(
        max_digits=10, decimal_places=3, read_only=True
    )
    total_valor_detalles = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    duracion_recepcion = serializers.IntegerField(read_only=True)

    class Meta:
        model = Recepcion
        fields = [
            'id', 'codigo', 'fecha', 'hora_llegada', 'hora_salida',
            'proveedor', 'proveedor_nombre',
            'tipo_recepcion', 'tipo_recepcion_nombre',
            'punto_recepcion', 'punto_recepcion_nombre',
            'estado', 'estado_nombre', 'estado_color',
            'vehiculo_proveedor', 'conductor_proveedor',
            'peso_bruto', 'peso_tara', 'peso_neto',
            'temperatura_llegada', 'tiene_detalles',
            'total_cantidad_detalles', 'total_valor_detalles',
            'duracion_recepcion', 'recibido_por_nombre',
            'created_at', 'is_active'
        ]


class RecepcionDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle completo de recepción."""

    proveedor_data = serializers.SerializerMethodField()
    tipo_recepcion_data = TipoRecepcionListSerializer(source='tipo_recepcion', read_only=True)
    punto_recepcion_data = PuntoRecepcionListSerializer(source='punto_recepcion', read_only=True)
    estado_data = EstadoRecepcionListSerializer(source='estado', read_only=True)
    recibido_por_nombre = serializers.CharField(
        source='recibido_por.get_full_name', read_only=True
    )
    programacion_data = serializers.SerializerMethodField()

    # Nested detalles y controles
    detalles = DetalleRecepcionSerializer(many=True, read_only=True)
    controles_calidad = ControlCalidadRecepcionSerializer(many=True, read_only=True)

    # Propiedades calculadas
    peso_neto_calculado = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    duracion_recepcion = serializers.IntegerField(read_only=True)
    tiene_detalles = serializers.BooleanField(read_only=True)
    total_cantidad_detalles = serializers.DecimalField(
        max_digits=10, decimal_places=3, read_only=True
    )
    total_valor_detalles = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = Recepcion
        fields = '__all__'
        read_only_fields = [
            'id', 'codigo', 'peso_neto', 'created_at', 'updated_at',
            'created_by', 'updated_by'
        ]

    def get_proveedor_data(self, obj):
        """Datos básicos del proveedor."""
        return {
            'id': obj.proveedor.id,
            'codigo_interno': obj.proveedor.codigo_interno,
            'nombre_comercial': obj.proveedor.nombre_comercial,
            'nit': obj.proveedor.nit,
            'telefono': obj.proveedor.telefono,
        }

    def get_programacion_data(self, obj):
        """Datos de programación si existe."""
        if obj.programacion:
            return {
                'id': obj.programacion.id,
                'codigo': obj.programacion.codigo,
                'fecha_programada': obj.programacion.fecha_programada,
            }
        return None


class RecepcionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear recepciones con validaciones."""

    # Campos write-only para recibir detalles y controles
    detalles_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text='Lista de detalles: [{"tipo_materia_prima_id": 1, "cantidad": 100, ...}, ...]'
    )
    controles_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text='Lista de controles: [{"parametro": "acidez", "valor_esperado": "< 5%", ...}, ...]'
    )

    class Meta:
        model = Recepcion
        fields = [
            'empresa', 'fecha', 'hora_llegada', 'hora_salida',
            'proveedor', 'programacion', 'tipo_recepcion', 'punto_recepcion', 'estado',
            'vehiculo_proveedor', 'conductor_proveedor',
            'peso_bruto', 'peso_tara', 'temperatura_llegada',
            'observaciones', 'recibido_por',
            'detalles_data', 'controles_data', 'is_active'
        ]

    def validate(self, attrs):
        """Validaciones cruzadas."""
        tipo_recepcion = attrs.get('tipo_recepcion')
        punto_recepcion = attrs.get('punto_recepcion')
        empresa = attrs.get('empresa')

        # Validar que punto de recepción pertenezca a la misma empresa
        if punto_recepcion and empresa:
            if punto_recepcion.empresa_id != empresa.id:
                raise serializers.ValidationError({
                    'punto_recepcion': 'El punto de recepción debe pertenecer a la misma empresa'
                })

        # Validar pesaje si es requerido
        if tipo_recepcion and tipo_recepcion.requiere_pesaje:
            if attrs.get('peso_bruto') is None:
                raise serializers.ValidationError({
                    'peso_bruto': f'El tipo de recepción {tipo_recepcion.nombre} requiere peso bruto'
                })
            if attrs.get('peso_tara') is None:
                raise serializers.ValidationError({
                    'peso_tara': f'El tipo de recepción {tipo_recepcion.nombre} requiere tara'
                })

        # Validar que peso bruto sea mayor que tara
        peso_bruto = attrs.get('peso_bruto')
        peso_tara = attrs.get('peso_tara')
        if peso_bruto is not None and peso_tara is not None:
            if peso_bruto < peso_tara:
                raise serializers.ValidationError({
                    'peso_bruto': 'El peso bruto debe ser mayor que la tara'
                })

        # Validar temperatura si es requerida
        if tipo_recepcion and tipo_recepcion.requiere_temperatura:
            if attrs.get('temperatura_llegada') is None:
                raise serializers.ValidationError({
                    'temperatura_llegada': f'El tipo de recepción {tipo_recepcion.nombre} requiere temperatura'
                })

        return attrs

    def validate_detalles_data(self, value):
        """Validar lista de detalles."""
        if not value:
            return value

        for detalle_data in value:
            if 'tipo_materia_prima_id' not in detalle_data:
                raise serializers.ValidationError('Cada detalle debe tener "tipo_materia_prima_id"')
            if 'cantidad' not in detalle_data:
                raise serializers.ValidationError('Cada detalle debe tener "cantidad"')
            if 'precio_unitario' not in detalle_data:
                raise serializers.ValidationError('Cada detalle debe tener "precio_unitario"')

            # Validar cantidad positiva
            try:
                cantidad = Decimal(str(detalle_data['cantidad']))
                if cantidad <= 0:
                    raise serializers.ValidationError('La cantidad debe ser mayor a cero')
            except (ValueError, TypeError):
                raise serializers.ValidationError('cantidad debe ser un número válido')

            # Validar precio positivo
            try:
                precio = Decimal(str(detalle_data['precio_unitario']))
                if precio <= 0:
                    raise serializers.ValidationError('El precio_unitario debe ser mayor a cero')
            except (ValueError, TypeError):
                raise serializers.ValidationError('precio_unitario debe ser un número válido')

        return value

    def validate_controles_data(self, value):
        """Validar lista de controles de calidad."""
        if not value:
            return value

        for control_data in value:
            if 'parametro' not in control_data:
                raise serializers.ValidationError('Cada control debe tener "parametro"')
            if 'valor_esperado' not in control_data:
                raise serializers.ValidationError('Cada control debe tener "valor_esperado"')
            if 'valor_obtenido' not in control_data:
                raise serializers.ValidationError('Cada control debe tener "valor_obtenido"')
            if 'cumple' not in control_data:
                raise serializers.ValidationError('Cada control debe tener "cumple"')

        return value

    def create(self, validated_data):
        """Crear recepción con detalles y controles."""
        from apps.supply_chain.gestion_proveedores.models import TipoMateriaPrima

        detalles_data = validated_data.pop('detalles_data', [])
        controles_data = validated_data.pop('controles_data', [])

        request = self.context.get('request')

        # Crear recepción
        recepcion = Recepcion.objects.create(**validated_data)

        # Crear detalles
        for detalle_info in detalles_data:
            tipo_materia = TipoMateriaPrima.objects.get(
                id=detalle_info['tipo_materia_prima_id']
            )
            DetalleRecepcion.objects.create(
                recepcion=recepcion,
                tipo_materia_prima=tipo_materia,
                cantidad=Decimal(str(detalle_info['cantidad'])),
                unidad_medida=detalle_info.get('unidad_medida', 'KG'),
                acidez_medida=detalle_info.get('acidez_medida'),
                temperatura=detalle_info.get('temperatura'),
                precio_unitario=Decimal(str(detalle_info['precio_unitario'])),
                observaciones=detalle_info.get('observaciones', '')
            )

        # Crear controles de calidad
        for control_info in controles_data:
            ControlCalidadRecepcion.objects.create(
                recepcion=recepcion,
                parametro=control_info['parametro'].lower().strip(),
                valor_esperado=control_info['valor_esperado'],
                valor_obtenido=control_info['valor_obtenido'],
                cumple=control_info['cumple'],
                observaciones=control_info.get('observaciones', ''),
                verificado_por=request.user if request and hasattr(request, 'user') else recepcion.recibido_por
            )

        return recepcion


class RecepcionUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar recepciones (sin cambiar estado)."""

    class Meta:
        model = Recepcion
        fields = [
            'hora_llegada', 'hora_salida', 'vehiculo_proveedor', 'conductor_proveedor',
            'peso_bruto', 'peso_tara', 'temperatura_llegada', 'observaciones', 'is_active'
        ]

    def validate(self, attrs):
        """Validaciones cruzadas."""
        instance = self.instance

        # Validar que el estado permita edición
        if instance and not instance.estado.permite_edicion:
            raise serializers.ValidationError(
                f'No se puede editar la recepción en estado {instance.estado.nombre}'
            )

        # Validar pesaje
        peso_bruto = attrs.get('peso_bruto', instance.peso_bruto if instance else None)
        peso_tara = attrs.get('peso_tara', instance.peso_tara if instance else None)

        if peso_bruto is not None and peso_tara is not None:
            if peso_bruto < peso_tara:
                raise serializers.ValidationError({
                    'peso_bruto': 'El peso bruto debe ser mayor que la tara'
                })

        return attrs


class CambiarEstadoSerializer(serializers.Serializer):
    """Serializer para cambiar estado de recepción."""

    estado_id = serializers.IntegerField(
        required=True,
        help_text='ID del nuevo estado'
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Observaciones del cambio de estado'
    )

    def validate_estado_id(self, value):
        """Validar que el estado existe y está activo."""
        try:
            estado = EstadoRecepcion.objects.get(id=value, is_active=True)
            self.context['nuevo_estado'] = estado
        except EstadoRecepcion.DoesNotExist:
            raise serializers.ValidationError('Estado no encontrado o no está activo')
        return value

    def validate(self, attrs):
        """Validaciones cruzadas."""
        recepcion = self.context.get('recepcion')
        nuevo_estado = self.context.get('nuevo_estado')

        if recepcion and nuevo_estado:
            # No permitir cambiar a un estado final si ya está en uno
            if recepcion.estado.es_final:
                raise serializers.ValidationError(
                    f'La recepción ya está en estado final: {recepcion.estado.nombre}'
                )

        return attrs


class RegistrarControlCalidadSerializer(serializers.Serializer):
    """Serializer para registrar control de calidad en recepción existente."""

    parametro = serializers.CharField(required=True)
    valor_esperado = serializers.CharField(required=True)
    valor_obtenido = serializers.CharField(required=True)
    cumple = serializers.BooleanField(required=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate_parametro(self, value):
        """Normalizar parámetro."""
        if not value or not value.strip():
            raise serializers.ValidationError('El parámetro es obligatorio')
        return value.lower().strip()
