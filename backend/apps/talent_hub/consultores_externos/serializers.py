"""
Serializers para Consultores Externos - Talent Hub
Sistema de Gestión StrateKaz

Consulta usuarios vinculados a proveedores tipo CONSULTOR/CONTRATISTA.
No tiene modelos propios — serializa el modelo User de Core (C0).
"""
from rest_framework import serializers
from django.apps import apps


class ConsultorExternoListSerializer(serializers.Serializer):
    """Serializer para listado de consultores externos."""

    # User fields
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    full_name = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    last_login = serializers.DateTimeField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)

    # Cargo info
    cargo_id = serializers.IntegerField(source='cargo.id', read_only=True, default=None)
    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True, default=None)
    cargo_code = serializers.CharField(source='cargo.code', read_only=True, default=None)

    # Proveedor info (firma)
    proveedor_id = serializers.IntegerField(source='proveedor.id', read_only=True)
    firma_nombre = serializers.CharField(
        source='proveedor.nombre_comercial', read_only=True
    )
    tipo_consultor = serializers.CharField(
        source='proveedor.tipo_proveedor.codigo', read_only=True
    )
    tipo_consultor_nombre = serializers.CharField(
        source='proveedor.tipo_proveedor.nombre', read_only=True
    )
    es_independiente = serializers.BooleanField(
        source='proveedor.es_independiente', read_only=True
    )
    es_portal_only = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        name = obj.get_full_name()
        return name if name else obj.username

    def get_es_portal_only(self, obj):
        return obj.cargo and obj.cargo.code == 'PROVEEDOR_PORTAL'


class ConsultorExternoDetailSerializer(ConsultorExternoListSerializer):
    """Serializer detallado de consultor externo — agrega campos extra."""

    # Contacto
    phone = serializers.CharField(read_only=True, default=None)
    document_number = serializers.CharField(read_only=True, default=None)

    # Firma info extendida
    firma_razon_social = serializers.CharField(
        source='proveedor.razon_social', read_only=True
    )
    firma_email = serializers.EmailField(
        source='proveedor.email', read_only=True, default=None
    )
    firma_telefono = serializers.CharField(
        source='proveedor.telefono', read_only=True, default=None
    )


class ConsultorExternoEstadisticasSerializer(serializers.Serializer):
    """Serializer para estadísticas de consultores externos."""

    total = serializers.IntegerField()
    activos = serializers.IntegerField()
    inactivos = serializers.IntegerField()
    independientes = serializers.IntegerField()
    de_firma = serializers.IntegerField()
    consultores = serializers.IntegerField()
    contratistas = serializers.IntegerField()
