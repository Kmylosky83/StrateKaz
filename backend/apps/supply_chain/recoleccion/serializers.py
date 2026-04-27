"""
Serializers para Recolección en Ruta — H-SC-RUTA-02 refactor 2 (1=1 parada).

H-SC-TALONARIO (2026-04-27): expone origen_registro, numero_talonario,
registrado_por_planta. Agrega TranscribirTalonarioSerializer + ParadaTalonarioSerializer
para el endpoint de registro post-hoc desde planta.
"""
from rest_framework import serializers

from .models import VoucherRecoleccion


class VoucherRecoleccionSerializer(serializers.ModelSerializer):
    """Voucher atómico = 1 parada visitada."""

    codigo = serializers.CharField(required=False, allow_blank=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    origen_registro_display = serializers.CharField(
        source='get_origen_registro_display', read_only=True,
    )
    ruta_codigo = serializers.CharField(source='ruta.codigo', read_only=True)
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial', read_only=True,
    )
    proveedor_codigo = serializers.CharField(
        source='proveedor.codigo_interno', read_only=True,
    )
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    operador_nombre = serializers.CharField(
        source='operador.get_full_name', read_only=True,
    )
    operador_cargo = serializers.SerializerMethodField()
    registrado_por_planta_nombre = serializers.CharField(
        source='registrado_por_planta.get_full_name', read_only=True,
    )

    class Meta:
        model = VoucherRecoleccion
        fields = [
            'id', 'codigo',
            'ruta', 'ruta_codigo', 'ruta_nombre',
            'fecha_recoleccion',
            'proveedor', 'proveedor_codigo', 'proveedor_nombre',
            'producto', 'producto_codigo', 'producto_nombre',
            'cantidad',
            'operador', 'operador_nombre', 'operador_cargo',
            'origen_registro', 'origen_registro_display',
            'numero_talonario',
            'registrado_por_planta', 'registrado_por_planta_nombre',
            'estado', 'estado_display',
            'notas',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'operador', 'registrado_por_planta',
            'created_at', 'updated_at',
        ]

    def get_operador_cargo(self, obj):
        operador = obj.operador
        if operador is None:
            return None
        try:
            colab = getattr(operador, 'colaborador', None)
            if colab and colab.cargo:
                return colab.cargo.nombre
            cargo = getattr(operador, 'cargo', None)
            if cargo:
                return getattr(cargo, 'nombre', None) or getattr(cargo, 'name', None)
        except AttributeError:
            return None
        return None

    def validate_cantidad(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a cero.')
        return value


# ══════════════════════════════════════════════════════════════════════
# H-SC-TALONARIO — Transcripción post-hoc desde planta
# ══════════════════════════════════════════════════════════════════════


class ParadaTalonarioSerializer(serializers.Serializer):
    """Una parada del talonario manual (sin precio, atómica)."""

    proveedor_id = serializers.IntegerField(min_value=1)
    producto_id = serializers.IntegerField(min_value=1)
    cantidad_kg = serializers.DecimalField(
        max_digits=12, decimal_places=3, min_value=0,
    )
    numero_talonario = serializers.CharField(
        max_length=50, required=False, allow_blank=True, default='',
    )
    notas = serializers.CharField(
        required=False, allow_blank=True, default='',
    )

    def validate_cantidad_kg(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError(
                'La cantidad debe ser mayor a cero.'
            )
        return value


class TranscribirTalonarioSerializer(serializers.Serializer):
    """
    Body del endpoint POST /supply-chain/recoleccion/vouchers/transcribir-talonario/.

    Crea N VoucherRecoleccion atómicamente con origen=TRANSCRIPCION_PLANTA y
    registrado_por_planta=request.user. Cada parada debe corresponder a una
    parada activa de la ruta (validación contra RutaParada).
    """

    ruta_id = serializers.IntegerField(min_value=1)
    fecha_recoleccion = serializers.DateField()
    paradas = ParadaTalonarioSerializer(many=True, allow_empty=False)
    operador_id = serializers.IntegerField(
        required=False, allow_null=True, min_value=1,
        help_text=(
            'Opcional: usuario operador físico que recolectó (si se conoce). '
            'Si no se provee, queda NULL y la trazabilidad recae en '
            'registrado_por_planta.'
        ),
    )

    def validate(self, attrs):
        from apps.supply_chain.catalogos.models import (
            RutaParada,
            RutaRecoleccion,
        )

        ruta_id = attrs['ruta_id']
        if not RutaRecoleccion.objects.filter(pk=ruta_id).exists():
            raise serializers.ValidationError(
                {'ruta_id': f'La ruta {ruta_id} no existe.'}
            )

        proveedor_ids_pedidos = {p['proveedor_id'] for p in attrs['paradas']}
        paradas_activas = set(
            RutaParada.objects.filter(
                ruta_id=ruta_id,
                is_active=True,
                proveedor_id__in=proveedor_ids_pedidos,
            ).values_list('proveedor_id', flat=True)
        )
        no_son_paradas = proveedor_ids_pedidos - paradas_activas
        if no_son_paradas:
            raise serializers.ValidationError(
                {
                    'paradas': (
                        f'Los siguientes proveedores no son paradas activas '
                        f'de la ruta {ruta_id}: {sorted(no_son_paradas)}. '
                        'Agrégalos primero como paradas o corrige el talonario.'
                    )
                }
            )

        # Validar que los productos existen.
        from apps.catalogo_productos.models import Producto

        producto_ids_pedidos = {p['producto_id'] for p in attrs['paradas']}
        producto_ids_existentes = set(
            Producto.objects.filter(
                pk__in=producto_ids_pedidos,
            ).values_list('id', flat=True)
        )
        productos_inexistentes = producto_ids_pedidos - producto_ids_existentes
        if productos_inexistentes:
            raise serializers.ValidationError(
                {
                    'paradas': (
                        f'Los siguientes productos no existen: '
                        f'{sorted(productos_inexistentes)}.'
                    )
                }
            )

        return attrs
