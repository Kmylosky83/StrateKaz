"""
Serializers del módulo Ecoaliados - API REST
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from decimal import Decimal
from .models import Ecoaliado, HistorialPrecioEcoaliado
from apps.proveedores.models import Proveedor
from apps.core.models import User


# ==================== ECOALIADO SERIALIZERS ====================

class EcoaliadoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de ecoaliados (campos resumidos)"""

    unidad_negocio_nombre = serializers.CharField(source='unidad_negocio.nombre_comercial', read_only=True)
    comercial_asignado_nombre = serializers.CharField(source='comercial_asignado.get_full_name', read_only=True)
    documento_tipo_display = serializers.CharField(source='get_documento_tipo_display', read_only=True)
    tiene_geolocalizacion = serializers.BooleanField(read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Ecoaliado
        fields = [
            'id',
            'codigo',
            'razon_social',
            'documento_tipo',
            'documento_tipo_display',
            'documento_numero',
            'unidad_negocio',
            'unidad_negocio_nombre',
            'comercial_asignado',
            'comercial_asignado_nombre',
            'telefono',
            'email',
            'ciudad',
            'departamento',
            'precio_compra_kg',
            'tiene_geolocalizacion',
            'is_active',
            'is_deleted',
            'created_at',
        ]


class EcoaliadoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle completo de ecoaliado"""

    unidad_negocio_nombre = serializers.CharField(source='unidad_negocio.nombre_comercial', read_only=True)
    comercial_asignado_nombre = serializers.CharField(source='comercial_asignado.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    documento_tipo_display = serializers.CharField(source='get_documento_tipo_display', read_only=True)
    tiene_geolocalizacion = serializers.BooleanField(read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)

    # Historial de precios reciente (últimos 5 cambios)
    historial_precios_reciente = serializers.SerializerMethodField()

    class Meta:
        model = Ecoaliado
        fields = '__all__'
        read_only_fields = [
            'codigo',
            'created_by',
            'created_at',
            'updated_at',
            'deleted_at',
        ]

    def get_historial_precios_reciente(self, obj):
        """Retorna los últimos 5 cambios de precio"""
        historial = obj.historial_precios.select_related('modificado_por').order_by('-fecha_modificacion')[:5]
        return HistorialPrecioEcoaliadoSerializer(historial, many=True).data


class EcoaliadoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear ecoaliados con validaciones específicas"""

    class Meta:
        model = Ecoaliado
        fields = [
            'razon_social',
            'documento_tipo',
            'documento_numero',
            'unidad_negocio',
            'telefono',
            'email',
            'direccion',
            'ciudad',
            'departamento',
            'latitud',
            'longitud',
            'precio_compra_kg',
            'comercial_asignado',
            'observaciones',
            'is_active',
        ]

    def validate_documento_numero(self, value):
        """Validar documento único"""
        if Ecoaliado.objects.filter(documento_numero=value).exists():
            raise serializers.ValidationError('Ya existe un ecoaliado con este número de documento')
        return value

    def validate_email(self, value):
        """Validar email si se proporciona"""
        if value and '@' not in value:
            raise serializers.ValidationError('Proporcione un email válido')
        return value

    def validate_precio_compra_kg(self, value):
        """Validar precio no negativo"""
        if value < 0:
            raise serializers.ValidationError('El precio no puede ser negativo')
        return value

    def validate_unidad_negocio(self, value):
        """Validar que la unidad de negocio sea UNIDAD_NEGOCIO y maneje ACU"""
        if value.tipo_proveedor != 'UNIDAD_NEGOCIO':
            raise serializers.ValidationError(
                'Debe seleccionar una Unidad de Negocio válida (tipo UNIDAD_NEGOCIO)'
            )

        # Verificar que maneje ACU
        if not value.subtipo_materia or 'ACU' not in value.subtipo_materia:
            raise serializers.ValidationError(
                'La Unidad de Negocio debe manejar ACU (Aceite Comestible Usado)'
            )

        return value

    def validate_comercial_asignado(self, value):
        """Validar que el comercial tenga cargo lider_com_econorte o comercial_econorte"""
        if not value.cargo:
            raise serializers.ValidationError(
                'El usuario seleccionado no tiene cargo asignado'
            )

        cargos_permitidos = ['lider_com_econorte', 'comercial_econorte']
        if value.cargo.code not in cargos_permitidos:
            raise serializers.ValidationError(
                f'El comercial debe tener cargo de Líder Comercial o Comercial Econorte. '
                f'Cargo actual: {value.cargo.name}'
            )

        if not value.is_active:
            raise serializers.ValidationError(
                'El comercial seleccionado no está activo'
            )

        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        # Validar coordenadas GPS
        latitud = attrs.get('latitud')
        longitud = attrs.get('longitud')

        if latitud is not None:
            if not (-90 <= latitud <= 90):
                raise serializers.ValidationError({
                    'latitud': 'La latitud debe estar entre -90 y 90 grados'
                })

        if longitud is not None:
            if not (-180 <= longitud <= 180):
                raise serializers.ValidationError({
                    'longitud': 'La longitud debe estar entre -180 y 180 grados'
                })

        return attrs

    def create(self, validated_data):
        """Crear ecoaliado con metadatos"""
        # Obtener usuario creador del contexto
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        # Crear ecoaliado (el código se genera automáticamente en el modelo)
        ecoaliado = Ecoaliado.objects.create(**validated_data)

        # Crear registro inicial en historial de precios
        if request and hasattr(request, 'user'):
            HistorialPrecioEcoaliado.objects.create(
                ecoaliado=ecoaliado,
                precio_anterior=None,
                precio_nuevo=ecoaliado.precio_compra_kg,
                tipo_cambio='CREACION',
                justificacion=f'Precio inicial al crear ecoaliado por {request.user.get_full_name()}',
                modificado_por=request.user
            )

        return ecoaliado


class EcoaliadoUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar ecoaliados (NO permite cambiar código ni documento_numero)"""

    class Meta:
        model = Ecoaliado
        fields = [
            'razon_social',
            'unidad_negocio',
            'telefono',
            'email',
            'direccion',
            'ciudad',
            'departamento',
            'latitud',
            'longitud',
            'comercial_asignado',
            'observaciones',
            'is_active',
        ]

    def validate_email(self, value):
        """Validar email si se proporciona"""
        if value and '@' not in value:
            raise serializers.ValidationError('Proporcione un email válido')
        return value

    def validate_unidad_negocio(self, value):
        """Validar que la unidad de negocio sea UNIDAD_NEGOCIO y maneje ACU"""
        if value.tipo_proveedor != 'UNIDAD_NEGOCIO':
            raise serializers.ValidationError(
                'Debe seleccionar una Unidad de Negocio válida (tipo UNIDAD_NEGOCIO)'
            )

        # Verificar que maneje ACU
        if not value.subtipo_materia or 'ACU' not in value.subtipo_materia:
            raise serializers.ValidationError(
                'La Unidad de Negocio debe manejar ACU (Aceite Comestible Usado)'
            )

        return value

    def validate_comercial_asignado(self, value):
        """Validar que el comercial tenga cargo lider_com_econorte o comercial_econorte"""
        if not value.cargo:
            raise serializers.ValidationError(
                'El usuario seleccionado no tiene cargo asignado'
            )

        cargos_permitidos = ['lider_com_econorte', 'comercial_econorte']
        if value.cargo.code not in cargos_permitidos:
            raise serializers.ValidationError(
                f'El comercial debe tener cargo de Líder Comercial o Comercial Econorte. '
                f'Cargo actual: {value.cargo.name}'
            )

        if not value.is_active:
            raise serializers.ValidationError(
                'El comercial seleccionado no está activo'
            )

        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        # Validar coordenadas GPS
        latitud = attrs.get('latitud')
        longitud = attrs.get('longitud')

        if latitud is not None:
            if not (-90 <= latitud <= 90):
                raise serializers.ValidationError({
                    'latitud': 'La latitud debe estar entre -90 y 90 grados'
                })

        if longitud is not None:
            if not (-180 <= longitud <= 180):
                raise serializers.ValidationError({
                    'longitud': 'La longitud debe estar entre -180 y 180 grados'
                })

        return attrs


class CambiarPrecioEcoaliadoSerializer(serializers.Serializer):
    """
    Serializer para cambiar precio de ecoaliado
    SOLO Líder Comercial, Gerente o SuperAdmin pueden usar esta acción
    """

    precio_nuevo = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=True,
        help_text='Nuevo precio de compra por kg'
    )
    justificacion = serializers.CharField(
        required=True,
        help_text='Justificación del cambio de precio'
    )

    def validate_precio_nuevo(self, value):
        """Validar precio nuevo"""
        if value < 0:
            raise serializers.ValidationError('El precio no puede ser negativo')
        return value

    def validate_justificacion(self, value):
        """Validar que la justificación no esté vacía"""
        if not value.strip():
            raise serializers.ValidationError('Debe proporcionar una justificación del cambio')
        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        ecoaliado = self.context.get('ecoaliado')
        precio_nuevo = attrs.get('precio_nuevo')

        # Validar que el nuevo precio sea diferente al actual
        if ecoaliado and ecoaliado.precio_compra_kg == precio_nuevo:
            raise serializers.ValidationError({
                'precio_nuevo': 'El nuevo precio debe ser diferente al actual'
            })

        return attrs

    def save(self):
        """Actualizar precio y registrar en historial"""
        ecoaliado = self.context.get('ecoaliado')
        usuario = self.context.get('usuario')
        precio_nuevo = self.validated_data['precio_nuevo']
        justificacion = self.validated_data['justificacion']

        # Guardar precio anterior
        precio_anterior = ecoaliado.precio_compra_kg

        # Determinar tipo de cambio
        if precio_nuevo > precio_anterior:
            tipo_cambio = 'AUMENTO'
        elif precio_nuevo < precio_anterior:
            tipo_cambio = 'DISMINUCION'
        else:
            tipo_cambio = 'AJUSTE'

        # Actualizar precio en ecoaliado
        ecoaliado.precio_compra_kg = precio_nuevo
        ecoaliado.save(update_fields=['precio_compra_kg', 'updated_at'])

        # Crear registro en historial
        historial = HistorialPrecioEcoaliado.objects.create(
            ecoaliado=ecoaliado,
            precio_anterior=precio_anterior,
            precio_nuevo=precio_nuevo,
            tipo_cambio=tipo_cambio,
            justificacion=justificacion,
            modificado_por=usuario
        )

        return historial


# ==================== HISTORIAL PRECIO SERIALIZERS ====================

class HistorialPrecioEcoaliadoSerializer(serializers.ModelSerializer):
    """Serializer para historial de precios de ecoaliados"""

    ecoaliado_codigo = serializers.CharField(source='ecoaliado.codigo', read_only=True)
    ecoaliado_razon_social = serializers.CharField(source='ecoaliado.razon_social', read_only=True)
    modificado_por_nombre = serializers.CharField(source='modificado_por.get_full_name', read_only=True)
    tipo_cambio_display = serializers.CharField(source='get_tipo_cambio_display', read_only=True)

    # Campos calculados
    diferencia_precio = serializers.SerializerMethodField()
    porcentaje_cambio = serializers.SerializerMethodField()

    class Meta:
        model = HistorialPrecioEcoaliado
        fields = [
            'id',
            'ecoaliado',
            'ecoaliado_codigo',
            'ecoaliado_razon_social',
            'precio_anterior',
            'precio_nuevo',
            'diferencia_precio',
            'porcentaje_cambio',
            'tipo_cambio',
            'tipo_cambio_display',
            'justificacion',
            'modificado_por',
            'modificado_por_nombre',
            'fecha_modificacion',
        ]
        read_only_fields = ['fecha_modificacion']

    def get_diferencia_precio(self, obj):
        """Calcula la diferencia de precio"""
        if obj.precio_anterior:
            return float(obj.precio_nuevo - obj.precio_anterior)
        return None

    def get_porcentaje_cambio(self, obj):
        """Calcula el porcentaje de cambio"""
        if obj.precio_anterior and obj.precio_anterior > 0:
            return round(float(((obj.precio_nuevo - obj.precio_anterior) / obj.precio_anterior) * 100), 2)
        return None
