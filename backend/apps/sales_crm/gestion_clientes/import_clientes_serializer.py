"""
Serializer de importación masiva de Clientes desde Excel.
Valida y normaliza una fila del archivo antes de crear el Cliente.
"""
from rest_framework import serializers

from .import_clientes_utils import (
    TIPO_DOCUMENTO_MAP,
    normalizar_valor,
    parsear_entero,
    parsear_decimal,
)


class ClienteImportRowSerializer(serializers.Serializer):
    """
    Valida una fila del Excel de importación y la convierte a datos listos
    para crear un Cliente.

    Resuelve:
    - tipo_documento → choice validado
    - tipo_cliente_nombre → tipo_cliente (FK) via lookup
    - canal_venta_nombre → canal_venta (FK) via lookup
    """
    # Requeridos
    tipo_documento = serializers.CharField()
    numero_documento = serializers.CharField()
    razon_social = serializers.CharField()
    tipo_cliente_nombre = serializers.CharField()
    canal_venta_nombre = serializers.CharField()

    # Opcionales
    nombre_comercial = serializers.CharField(required=False, allow_blank=True, default='')
    telefono = serializers.CharField(required=False, allow_blank=True, default='')
    email = serializers.CharField(required=False, allow_blank=True, default='')
    direccion = serializers.CharField(required=False, allow_blank=True, default='')
    ciudad = serializers.CharField(required=False, allow_blank=True, default='')
    departamento = serializers.CharField(required=False, allow_blank=True, default='')
    plazo_pago_dias = serializers.CharField(required=False, default='30')
    cupo_credito = serializers.CharField(required=False, default='0')
    descuento_comercial = serializers.CharField(required=False, default='0')
    observaciones = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_tipo_documento(self, value):
        norm = normalizar_valor(value)
        mapped = TIPO_DOCUMENTO_MAP.get(norm)
        if not mapped:
            raise serializers.ValidationError(
                f'Tipo de documento inválido: "{value}". '
                f'Valores válidos: NIT, CC, CE, PASAPORTE'
            )
        return mapped

    def validate_numero_documento(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('El número de documento es requerido.')
        if len(val) > 20:
            raise serializers.ValidationError('El número de documento no puede exceder 20 caracteres.')
        return val

    def validate_razon_social(self, value):
        val = str(value).strip()
        if not val:
            raise serializers.ValidationError('La razón social es requerida.')
        if len(val) > 255:
            raise serializers.ValidationError('La razón social no puede exceder 255 caracteres.')
        return val

    def validate(self, attrs):
        # Normalizar valores numéricos
        attrs['plazo_pago_dias'] = parsear_entero(attrs.get('plazo_pago_dias', '30'), default=30)
        attrs['cupo_credito'] = parsear_decimal(attrs.get('cupo_credito', '0'), default='0.00')
        attrs['descuento_comercial'] = parsear_decimal(attrs.get('descuento_comercial', '0'), default='0.00')

        from .models import Cliente, TipoCliente, EstadoCliente, CanalVenta
        from apps.core.base_models.mixins import get_tenant_empresa

        empresa = get_tenant_empresa()

        # Verificar número de documento único en la empresa
        numero_doc = attrs.get('numero_documento')
        if Cliente.objects.filter(empresa=empresa, numero_documento=numero_doc, is_active=True).exists():
            raise serializers.ValidationError({
                'numero_documento': f'Ya existe un cliente con el documento "{numero_doc}".'
            })

        # Resolver Tipo de Cliente por nombre
        tipo_cliente_nombre = str(attrs.get('tipo_cliente_nombre', '')).strip()
        if tipo_cliente_nombre:
            try:
                tipo_cliente = TipoCliente.objects.get(nombre__iexact=tipo_cliente_nombre, activo=True)
                attrs['_tipo_cliente'] = tipo_cliente
            except TipoCliente.DoesNotExist:
                # Intentar match por código
                norm = normalizar_valor(tipo_cliente_nombre)
                try:
                    tipo_cliente = TipoCliente.objects.get(codigo__iexact=norm, activo=True)
                    attrs['_tipo_cliente'] = tipo_cliente
                except TipoCliente.DoesNotExist:
                    raise serializers.ValidationError({
                        'tipo_cliente_nombre': (
                            f'No se encontró el tipo de cliente "{tipo_cliente_nombre}". '
                            f'Verifica el nombre exacto en la hoja "Referencia".'
                        )
                    })
        else:
            raise serializers.ValidationError({
                'tipo_cliente_nombre': 'El tipo de cliente es requerido.'
            })

        # Resolver Canal de Venta por nombre
        canal_venta_nombre = str(attrs.get('canal_venta_nombre', '')).strip()
        if canal_venta_nombre:
            try:
                canal_venta = CanalVenta.objects.get(nombre__iexact=canal_venta_nombre, activo=True)
                attrs['_canal_venta'] = canal_venta
            except CanalVenta.DoesNotExist:
                # Intentar match por código
                norm = normalizar_valor(canal_venta_nombre)
                try:
                    canal_venta = CanalVenta.objects.get(codigo__iexact=norm, activo=True)
                    attrs['_canal_venta'] = canal_venta
                except CanalVenta.DoesNotExist:
                    raise serializers.ValidationError({
                        'canal_venta_nombre': (
                            f'No se encontró el canal de venta "{canal_venta_nombre}". '
                            f'Verifica el nombre exacto en la hoja "Referencia".'
                        )
                    })
        else:
            raise serializers.ValidationError({
                'canal_venta_nombre': 'El canal de venta es requerido.'
            })

        # Resolver Estado Cliente (default: primer estado activo)
        try:
            estado_default = EstadoCliente.objects.filter(activo=True).first()
            attrs['_estado_cliente'] = estado_default
        except Exception:
            attrs['_estado_cliente'] = None

        # Guardar empresa para uso posterior
        attrs['_empresa'] = empresa

        return attrs
