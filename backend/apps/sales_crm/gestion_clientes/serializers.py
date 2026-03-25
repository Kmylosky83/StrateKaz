"""
Serializers para Gestión de Clientes - Sales CRM
Sistema de Gestión StrateKaz

Serializers para API REST de gestión de clientes, contactos,
interacciones y segmentación.

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from decimal import Decimal

from .models import (
    TipoCliente,
    EstadoCliente,
    CanalVenta,
    Cliente,
    ContactoCliente,
    SegmentoCliente,
    ClienteSegmento,
    InteraccionCliente,
    ScoringCliente
)

User = get_user_model()


# ==============================================================================
# SERIALIZERS DE CATÁLOGOS
# ==============================================================================

class TipoClienteSerializer(serializers.ModelSerializer):
    """Serializer para tipos de cliente."""

    class Meta:
        model = TipoCliente
        fields = [
            'id',
            'codigo',
            'nombre',
            'descripcion',
            'activo',
            'orden',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class EstadoClienteSerializer(serializers.ModelSerializer):
    """Serializer para estados de cliente."""

    class Meta:
        model = EstadoCliente
        fields = [
            'id',
            'codigo',
            'nombre',
            'color',
            'descripcion',
            'permite_ventas',
            'requiere_aprobacion',
            'activo',
            'orden',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class CanalVentaSerializer(serializers.ModelSerializer):
    """Serializer para canales de venta."""

    class Meta:
        model = CanalVenta
        fields = [
            'id',
            'codigo',
            'nombre',
            'descripcion',
            'aplica_comision',
            'porcentaje_comision',
            'activo',
            'orden',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


# ==============================================================================
# SERIALIZERS PRINCIPALES - CLIENTES
# ==============================================================================

class ClienteListSerializer(serializers.ModelSerializer):
    """Serializer para listado de clientes."""

    tipo_cliente_nombre = serializers.CharField(source='tipo_cliente.nombre', read_only=True)
    estado_cliente_nombre = serializers.CharField(source='estado_cliente.nombre', read_only=True)
    estado_cliente_color = serializers.CharField(source='estado_cliente.color', read_only=True)
    canal_venta_nombre = serializers.CharField(source='canal_venta.nombre', read_only=True)
    vendedor_nombre = serializers.CharField(source='vendedor_asignado.get_full_name', read_only=True)
    dias_sin_comprar = serializers.IntegerField(read_only=True)
    ticket_promedio = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = Cliente
        fields = [
            'id',
            'codigo_cliente',
            'numero_documento',
            'razon_social',
            'nombre_comercial',
            'tipo_cliente',
            'tipo_cliente_nombre',
            'estado_cliente',
            'estado_cliente_nombre',
            'estado_cliente_color',
            'canal_venta',
            'canal_venta_nombre',
            'vendedor_asignado',
            'vendedor_nombre',
            'telefono',
            'email',
            'ciudad',
            'ultima_compra',
            'total_compras_acumulado',
            'cantidad_pedidos',
            'dias_sin_comprar',
            'ticket_promedio',
            'parte_interesada_id',
            'parte_interesada_nombre',
            'is_active',
        ]


class ScoringClienteSerializer(serializers.ModelSerializer):
    """Serializer para scoring de cliente."""

    nivel_scoring = serializers.CharField(read_only=True)
    color_nivel = serializers.CharField(read_only=True)

    class Meta:
        model = ScoringCliente
        fields = [
            'id',
            'cliente',
            'puntuacion_total',
            'frecuencia_compra',
            'volumen_compra',
            'puntualidad_pago',
            'antiguedad',
            'nivel_scoring',
            'color_nivel',
            'ultima_actualizacion',
            'historial_scores',
        ]
        read_only_fields = [
            'puntuacion_total', 'frecuencia_compra', 'volumen_compra',
            'puntualidad_pago', 'antiguedad', 'ultima_actualizacion'
        ]


class ContactoClienteSerializer(serializers.ModelSerializer):
    """Serializer para contactos de cliente."""

    class Meta:
        model = ContactoCliente
        fields = [
            'id',
            'empresa',
            'cliente',
            'nombre_completo',
            'cargo',
            'telefono',
            'email',
            'es_principal',
            'fecha_cumpleanos',
            'notas',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer completo para cliente."""

    tipo_cliente_data = TipoClienteSerializer(source='tipo_cliente', read_only=True)
    estado_cliente_data = EstadoClienteSerializer(source='estado_cliente', read_only=True)
    canal_venta_data = CanalVentaSerializer(source='canal_venta', read_only=True)
    vendedor_nombre = serializers.CharField(source='vendedor_asignado.get_full_name', read_only=True)
    contactos = ContactoClienteSerializer(many=True, read_only=True)
    scoring_data = ScoringClienteSerializer(source='scoring', read_only=True)
    nombre_completo = serializers.CharField(read_only=True)
    dias_sin_comprar = serializers.IntegerField(read_only=True)
    ticket_promedio = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = Cliente
        fields = [
            'id',
            'empresa',
            'codigo_cliente',
            'tipo_documento',
            'numero_documento',
            'razon_social',
            'nombre_comercial',
            'tipo_cliente',
            'tipo_cliente_data',
            'estado_cliente',
            'estado_cliente_data',
            'canal_venta',
            'canal_venta_data',
            'vendedor_asignado',
            'vendedor_nombre',
            'telefono',
            'email',
            'direccion',
            'ciudad',
            'departamento',
            'pais',
            'plazo_pago_dias',
            'cupo_credito',
            'descuento_comercial',
            'fecha_primera_compra',
            'ultima_compra',
            'total_compras_acumulado',
            'cantidad_pedidos',
            'observaciones',
            'parte_interesada_id',
            'parte_interesada_nombre',
            'contactos',
            'scoring_data',
            'nombre_completo',
            'dias_sin_comprar',
            'ticket_promedio',
            'is_active',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'codigo_cliente', 'fecha_primera_compra', 'ultima_compra',
            'total_compras_acumulado', 'cantidad_pedidos',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def validate_email(self, value):
        """Validar formato y dominio DNS/MX del email."""
        if not value:
            return value
        from apps.core.utils import validate_email_domain
        try:
            validate_email_domain(value)
        except Exception as e:
            raise serializers.ValidationError(
                str(e.message if hasattr(e, 'message') else e)
            )
        return value


# ==============================================================================
# SERIALIZERS DE SEGMENTACIÓN
# ==============================================================================

class SegmentoClienteSerializer(serializers.ModelSerializer):
    """Serializer para segmentos de cliente."""

    cantidad_clientes = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = SegmentoCliente
        fields = [
            'id',
            'empresa',
            'codigo',
            'nombre',
            'descripcion',
            'criterios',
            'color',
            'cantidad_clientes',
            'is_active',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_cantidad_clientes(self, obj):
        """Obtiene la cantidad de clientes en el segmento."""
        return obj.clientes.filter(is_active=True).count()


class ClienteSegmentoSerializer(serializers.ModelSerializer):
    """Serializer para asignación cliente-segmento."""

    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    segmento_nombre = serializers.CharField(source='segmento.nombre', read_only=True)
    segmento_color = serializers.CharField(source='segmento.color', read_only=True)
    asignado_por_nombre = serializers.CharField(source='asignado_por.get_full_name', read_only=True)

    class Meta:
        model = ClienteSegmento
        fields = [
            'id',
            'empresa',
            'cliente',
            'cliente_nombre',
            'segmento',
            'segmento_nombre',
            'segmento_color',
            'fecha_asignacion',
            'asignado_por',
            'asignado_por_nombre',
            'is_active',
        ]
        read_only_fields = ['fecha_asignacion', 'asignado_por']


# ==============================================================================
# SERIALIZERS DE INTERACCIONES
# ==============================================================================

class InteraccionClienteListSerializer(serializers.ModelSerializer):
    """Serializer para listado de interacciones."""

    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    tipo_interaccion_display = serializers.CharField(source='get_tipo_interaccion_display', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)

    class Meta:
        model = InteraccionCliente
        fields = [
            'id',
            'cliente',
            'cliente_nombre',
            'tipo_interaccion',
            'tipo_interaccion_display',
            'fecha',
            'descripcion',
            'resultado',
            'proxima_accion',
            'fecha_proxima_accion',
            'registrado_por',
            'registrado_por_nombre',
        ]


class InteraccionClienteSerializer(serializers.ModelSerializer):
    """Serializer completo para interacción."""

    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    tipo_interaccion_display = serializers.CharField(source='get_tipo_interaccion_display', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = InteraccionCliente
        fields = [
            'id',
            'empresa',
            'cliente',
            'cliente_nombre',
            'tipo_interaccion',
            'tipo_interaccion_display',
            'fecha',
            'descripcion',
            'resultado',
            'proxima_accion',
            'fecha_proxima_accion',
            'registrado_por',
            'registrado_por_nombre',
            'is_active',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


# ==============================================================================
# SERIALIZERS DE ACCIONES
# ==============================================================================

class ActualizarScoringSerializer(serializers.Serializer):
    """Serializer para actualizar scoring de cliente."""

    message = serializers.CharField(read_only=True)
    scoring = ScoringClienteSerializer(read_only=True)


class AsignarSegmentoSerializer(serializers.Serializer):
    """Serializer para asignar segmento a cliente."""

    segmento_id = serializers.IntegerField()

    def validate_segmento_id(self, value):
        """Valida que el segmento exista."""
        try:
            SegmentoCliente.objects.get(id=value, is_active=True)
        except SegmentoCliente.DoesNotExist:
            raise serializers.ValidationError("El segmento no existe o está inactivo.")
        return value


# ==============================================================================
# SERIALIZERS DE PORTAL DE CLIENTES
# ==============================================================================

class CrearAccesoClienteSerializer(serializers.Serializer):
    """
    Serializer para crear acceso al portal de clientes.

    Crea un usuario con cargo CLIENTE_PORTAL vinculado al cliente.
    """

    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True, max_length=150)

    def validate_username(self, value):
        """Valida que el username no contenga caracteres inválidos."""
        if not value.replace('_', '').replace('-', '').replace('.', '').isalnum():
            raise serializers.ValidationError(
                "El nombre de usuario solo puede contener letras, números, guiones, puntos y guiones bajos."
            )
        return value


class MiClienteSerializer(serializers.ModelSerializer):
    """
    Serializer read-only para el portal de clientes (mi-cliente/).
    Muestra datos del cliente sin información interna (vendedor, scoring).
    """

    tipo_cliente_nombre = serializers.CharField(source='tipo_cliente.nombre', read_only=True)
    estado_cliente_nombre = serializers.CharField(source='estado_cliente.nombre', read_only=True)
    estado_cliente_color = serializers.CharField(source='estado_cliente.color', read_only=True)
    contactos = ContactoClienteSerializer(many=True, read_only=True)
    nombre_completo = serializers.CharField(read_only=True)

    class Meta:
        model = Cliente
        fields = [
            'id',
            'codigo_cliente',
            'tipo_documento',
            'numero_documento',
            'razon_social',
            'nombre_comercial',
            'tipo_cliente_nombre',
            'estado_cliente_nombre',
            'estado_cliente_color',
            'telefono',
            'email',
            'direccion',
            'ciudad',
            'departamento',
            'pais',
            'plazo_pago_dias',
            'cupo_credito',
            'descuento_comercial',
            'contactos',
            'nombre_completo',
            'is_active',
            'created_at',
        ]
