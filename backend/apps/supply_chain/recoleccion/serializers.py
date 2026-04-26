"""
Serializers para Recolección en Ruta — H-SC-RUTA-02.
"""
from rest_framework import serializers

from .models import VoucherRecoleccion, LineaVoucherRecoleccion


class LineaVoucherRecoleccionSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial', read_only=True
    )
    proveedor_codigo = serializers.CharField(
        source='proveedor.codigo_interno', read_only=True
    )
    producto_nombre = serializers.CharField(
        source='producto.nombre', read_only=True
    )
    producto_codigo = serializers.CharField(
        source='producto.codigo', read_only=True
    )

    class Meta:
        model = LineaVoucherRecoleccion
        fields = [
            'id', 'voucher',
            'proveedor', 'proveedor_nombre', 'proveedor_codigo',
            'producto', 'producto_nombre', 'producto_codigo',
            'cantidad', 'notas',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a cero.')
        return value

    def validate(self, attrs):
        """Verifica que el proveedor sea una parada activa de la ruta del voucher."""
        from apps.supply_chain.catalogos.models import RutaParada

        voucher = attrs.get('voucher') or (self.instance and self.instance.voucher)
        proveedor = attrs.get('proveedor')

        if voucher and proveedor:
            es_parada = RutaParada.objects.filter(
                ruta=voucher.ruta,
                proveedor=proveedor,
                is_active=True,
                is_deleted=False,
            ).exists()
            if not es_parada:
                # Mensaje informativo — no bloqueamos: el frontend puede
                # ofrecer el botón "Asignar como parada de esta ruta" como
                # parte del flujo. Esto es solo defensa-in-depth para evitar
                # confusión. Si el usuario lo asigna explícitamente desde el
                # frontend, debe haber creado la parada antes.
                raise serializers.ValidationError({
                    'proveedor': (
                        f'El proveedor "{proveedor.nombre_comercial}" no es '
                        f'una parada activa de la ruta "{voucher.ruta.codigo}". '
                        f'Asígnelo como parada antes de registrar la línea.'
                    )
                })
        return attrs


class VoucherRecoleccionSerializer(serializers.ModelSerializer):
    """Serializer principal — incluye líneas anidadas read-only."""

    codigo = serializers.CharField(required=False, allow_blank=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    ruta_codigo = serializers.CharField(source='ruta.codigo', read_only=True)
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)
    operador_nombre = serializers.CharField(source='operador.get_full_name', read_only=True)
    operador_cargo = serializers.SerializerMethodField()
    lineas = LineaVoucherRecoleccionSerializer(many=True, read_only=True)
    total_lineas = serializers.IntegerField(read_only=True)
    total_kilos = serializers.DecimalField(
        max_digits=14, decimal_places=3, read_only=True
    )

    class Meta:
        model = VoucherRecoleccion
        fields = [
            'id', 'codigo',
            'ruta', 'ruta_codigo', 'ruta_nombre',
            'fecha_recoleccion',
            'operador', 'operador_nombre', 'operador_cargo',
            'estado', 'estado_display',
            'notas',
            'lineas', 'total_lineas', 'total_kilos',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'operador', 'created_at', 'updated_at']

    def get_operador_cargo(self, obj):
        """Cargo del operador desde su Colaborador (si existe)."""
        try:
            colaborador = getattr(obj.operador, 'colaborador', None)
            if colaborador and colaborador.cargo:
                return colaborador.cargo.nombre
        except Exception:
            pass
        return None
