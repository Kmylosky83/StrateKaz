"""Serializers para Proveedores (CT-layer)."""
from rest_framework import serializers

from apps.catalogo_productos.models import Producto

from .models import Proveedor, TipoProveedor


# ==============================================================================
# CATÁLOGO
# ==============================================================================

class TipoProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoProveedor
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'requiere_materia_prima', 'requiere_modalidad_logistica',
            'orden', 'is_active',
        ]


# ==============================================================================
# PROVEEDOR
# ==============================================================================

class ProveedorListSerializer(serializers.ModelSerializer):
    """Serializer ligero para listados (sin M2M, con displays básicos)."""

    tipo_persona_display = serializers.CharField(
        source='get_tipo_persona_display', read_only=True,
    )
    tipo_proveedor_nombre = serializers.CharField(
        source='tipo_proveedor.nombre', read_only=True, default=None,
    )
    tipo_documento_nombre = serializers.CharField(
        source='tipo_documento.nombre', read_only=True,
    )
    departamento_nombre = serializers.CharField(
        source='departamento.nombre', read_only=True, default=None,
    )
    # 2026-04-22: ciudad es FK al catálogo canónico Ciudad (H-CAT-05 cerrado).
    # Se expone el nombre como campo legible sin romper el contrato del API
    # (clientes que leían `ciudad` como string reciben el nombre; al crear/editar
    # deben enviar el id numérico).
    ciudad_nombre = serializers.CharField(
        source='ciudad.nombre', read_only=True, default=None,
    )

    class Meta:
        model = Proveedor
        fields = [
            'id',
            'codigo_interno',
            'tipo_persona', 'tipo_persona_display',
            'tipo_proveedor', 'tipo_proveedor_nombre',
            'razon_social', 'nombre_comercial',
            'tipo_documento', 'tipo_documento_nombre',
            'numero_documento', 'nit',
            'telefono', 'email',
            'ciudad', 'ciudad_nombre',
            'departamento', 'departamento_nombre',
            'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'codigo_interno', 'created_at', 'updated_at']


class ProveedorDetailSerializer(ProveedorListSerializer):
    """Serializer completo con M2M y datos de parte interesada."""

    productos_suministrados = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=True,
    )

    class Meta(ProveedorListSerializer.Meta):
        fields = ProveedorListSerializer.Meta.fields + [
            'direccion',
            'productos_suministrados',
            'parte_interesada_id', 'parte_interesada_nombre',
        ]


class ProveedorCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/editar. Recibe `productos_suministrados` como
    lista de IDs.
    """
    productos_suministrados = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.filter(is_deleted=False, tipo='MATERIA_PRIMA'),
        many=True,
        required=False,
    )

    class Meta:
        model = Proveedor
        fields = [
            'id',
            'tipo_persona',
            'tipo_proveedor',
            'razon_social', 'nombre_comercial',
            'tipo_documento', 'numero_documento', 'nit',
            'telefono', 'email',
            'ciudad', 'departamento', 'direccion',
            'productos_suministrados',
            'parte_interesada_id', 'parte_interesada_nombre',
            'is_active',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        # Unicidad de numero_documento entre no-eliminados.
        numero_doc = attrs.get('numero_documento')
        if numero_doc:
            qs = Proveedor.objects.filter(
                numero_documento=numero_doc, is_deleted=False,
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'numero_documento': 'Ya existe un proveedor activo con este número de documento.',
                })
        return super().validate(attrs)
