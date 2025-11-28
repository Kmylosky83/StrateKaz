"""
Serializers del módulo Proveedores - API REST
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from decimal import Decimal
from .models import (
    UnidadNegocio,
    Proveedor,
    PrecioMateriaPrima,
    HistorialPrecioProveedor,
    CondicionComercialProveedor,
    PruebaAcidez
)
from .constants import (
    CODIGO_MATERIA_PRIMA_CHOICES,
    CODIGOS_MATERIA_PRIMA_VALIDOS,
    CODIGO_A_TIPO_PRINCIPAL,
    JERARQUIA_MATERIA_PRIMA,
)


# ==================== UNIDAD DE NEGOCIO SERIALIZERS ====================

class UnidadNegocioSerializer(serializers.ModelSerializer):
    """Serializer para Unidad de Negocio"""

    tipo_unidad_display = serializers.CharField(source='get_tipo_unidad_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = UnidadNegocio
        fields = [
            'id',
            'codigo',
            'nombre',
            'tipo_unidad',
            'tipo_unidad_display',
            'direccion',
            'ciudad',
            'departamento',
            'responsable',
            'responsable_nombre',
            'is_active',
            'is_deleted',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'deleted_at']

    def validate_codigo(self, value):
        """Validar código único"""
        # Convertir a mayúsculas
        value = value.upper()

        # Verificar unicidad (excepto en update)
        unidad_id = self.instance.id if self.instance else None
        if UnidadNegocio.objects.filter(codigo=value).exclude(id=unidad_id).exists():
            raise serializers.ValidationError('Ya existe una unidad de negocio con este código')

        return value


# ==================== PRECIO MATERIA PRIMA SERIALIZERS ====================

class PrecioMateriaPrimaSerializer(serializers.ModelSerializer):
    """Serializer para precios de materia prima por código completo"""

    tipo_materia_display = serializers.CharField(source='get_tipo_materia_display', read_only=True)
    tipo_principal = serializers.SerializerMethodField(read_only=True)
    tipo_principal_display = serializers.SerializerMethodField(read_only=True)
    modificado_por_nombre = serializers.CharField(source='modificado_por.get_full_name', read_only=True)

    class Meta:
        model = PrecioMateriaPrima
        fields = [
            'id',
            'proveedor',
            'tipo_materia',
            'tipo_materia_display',
            'tipo_principal',
            'tipo_principal_display',
            'precio_kg',
            'modificado_por',
            'modificado_por_nombre',
            'modificado_fecha',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['modificado_fecha', 'created_at', 'updated_at']

    def get_tipo_principal(self, obj):
        """Retorna el código del tipo principal (HUESO, SEBO, CABEZAS, ACU)"""
        return CODIGO_A_TIPO_PRINCIPAL.get(obj.tipo_materia, obj.tipo_materia)

    def get_tipo_principal_display(self, obj):
        """Retorna el nombre legible del tipo principal"""
        tipo_principal = CODIGO_A_TIPO_PRINCIPAL.get(obj.tipo_materia, obj.tipo_materia)
        jerarquia = JERARQUIA_MATERIA_PRIMA.get(tipo_principal, {})
        return jerarquia.get('nombre', tipo_principal)


# ==================== PROVEEDOR SERIALIZERS ====================

class ProveedorListSerializer(serializers.ModelSerializer):
    """Serializer para listado de proveedores (campos resumidos)"""

    tipo_proveedor_display = serializers.CharField(source='get_tipo_proveedor_display', read_only=True)
    subtipo_materia_display = serializers.SerializerMethodField(read_only=True)
    modalidad_logistica_display = serializers.CharField(source='get_modalidad_logistica_display', read_only=True)
    unidad_negocio_nombre = serializers.CharField(source='unidad_negocio.nombre', read_only=True, allow_null=True)
    es_proveedor_materia_prima = serializers.BooleanField(read_only=True)
    created_by_nombre = serializers.SerializerMethodField(read_only=True)
    formas_pago_display = serializers.SerializerMethodField(read_only=True)

    # IMPORTANTE: Incluir precios para mostrar en la tabla
    precios_materia_prima = PrecioMateriaPrimaSerializer(many=True, read_only=True)

    class Meta:
        model = Proveedor
        fields = [
            'id',
            'tipo_proveedor',
            'tipo_proveedor_display',
            'subtipo_materia',
            'subtipo_materia_display',
            'modalidad_logistica',
            'modalidad_logistica_display',
            'nombre_comercial',
            'numero_documento',
            'ciudad',
            'departamento',
            'unidad_negocio',
            'unidad_negocio_nombre',
            'precios_materia_prima',
            'es_proveedor_materia_prima',
            'is_active',
            'created_at',
            # Campos de contacto para vista expandida
            'email',
            'telefono',
            'direccion',
            'observaciones',
            'created_by_nombre',
            # Campos financieros
            'formas_pago',
            'formas_pago_display',
            'dias_plazo_pago',
            'banco',
            'tipo_cuenta',
            'numero_cuenta',
            'titular_cuenta',
        ]

    def get_subtipo_materia_display(self, obj):
        """Retorna los subtipos en formato legible como string separado por comas"""
        subtipos = obj.subtipo_materia_display
        if isinstance(subtipos, list):
            return ', '.join(subtipos)
        return subtipos

    def get_created_by_nombre(self, obj):
        """Retorna el nombre completo de quien creó el proveedor"""
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None

    def get_formas_pago_display(self, obj):
        """Retorna las formas de pago en formato legible"""
        return obj.formas_pago_display


class ProveedorDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle completo de proveedor"""

    tipo_proveedor_display = serializers.CharField(source='get_tipo_proveedor_display', read_only=True)
    subtipo_materia_display = serializers.SerializerMethodField(read_only=True)
    formas_pago_display = serializers.SerializerMethodField(read_only=True)
    modalidad_logistica_display = serializers.CharField(source='get_modalidad_logistica_display', read_only=True)
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)

    unidad_negocio_data = UnidadNegocioSerializer(source='unidad_negocio', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    # Nested precios de materia prima
    precios_materia_prima = PrecioMateriaPrimaSerializer(many=True, read_only=True)

    es_proveedor_materia_prima = serializers.BooleanField(read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Proveedor
        fields = '__all__'
        read_only_fields = [
            'created_at',
            'updated_at',
            'deleted_at',
            'precios_materia_prima',
        ]

    def get_subtipo_materia_display(self, obj):
        """Retorna los subtipos en formato legible"""
        return obj.subtipo_materia_display

    def get_formas_pago_display(self, obj):
        """Retorna las formas de pago en formato legible"""
        return obj.formas_pago_display


class ProveedorCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear proveedores con validaciones según tipo"""

    # Campo write-only para recibir precios por tipo de materia prima
    precios = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text='Lista de precios por tipo de materia: [{"tipo_materia": "SEBO", "precio_kg": "5000.00"}, ...]'
    )

    class Meta:
        model = Proveedor
        fields = [
            'tipo_proveedor',
            'subtipo_materia',
            'modalidad_logistica',
            'nombre_comercial',
            'razon_social',
            'tipo_documento',
            'numero_documento',
            'nit',
            'telefono',
            'email',
            'direccion',
            'ciudad',
            'departamento',
            'unidad_negocio',
            'precios',
            'formas_pago',
            'dias_plazo_pago',
            'banco',
            'tipo_cuenta',
            'numero_cuenta',
            'titular_cuenta',
            'observaciones',
            'is_active',
        ]

    def validate_numero_documento(self, value):
        """Validar número de documento único"""
        if Proveedor.objects.filter(numero_documento=value).exists():
            raise serializers.ValidationError('Ya existe un proveedor con este número de documento')
        return value

    def validate_email(self, value):
        """Validar email si se proporciona"""
        if value and '@' not in value:
            raise serializers.ValidationError('Proporcione un email válido')
        return value

    def validate_precios(self, value):
        """Validar lista de precios"""
        if not value:
            return value

        # Validar estructura de cada precio
        for precio_data in value:
            if 'tipo_materia' not in precio_data:
                raise serializers.ValidationError('Cada precio debe tener "tipo_materia"')
            if 'precio_kg' not in precio_data:
                raise serializers.ValidationError('Cada precio debe tener "precio_kg"')

            # Validar que tipo_materia sea válido
            valid_tipos = [choice[0] for choice in Proveedor.SUBTIPO_MATERIA_CHOICES]
            if precio_data['tipo_materia'] not in valid_tipos:
                raise serializers.ValidationError(
                    f'tipo_materia "{precio_data["tipo_materia"]}" no es válido. '
                    f'Opciones: {", ".join(valid_tipos)}'
                )

            # Validar que precio_kg sea positivo
            try:
                precio_kg = Decimal(str(precio_data['precio_kg']))
                if precio_kg < 0:
                    raise serializers.ValidationError('El precio no puede ser negativo')
            except (ValueError, TypeError):
                raise serializers.ValidationError('precio_kg debe ser un número válido')

        return value

    def validate(self, attrs):
        """Validaciones cruzadas según tipo de proveedor"""
        tipo_proveedor = attrs.get('tipo_proveedor')
        precios = attrs.get('precios', [])

        # Validaciones para MATERIA_PRIMA_EXTERNO
        if tipo_proveedor == 'MATERIA_PRIMA_EXTERNO':
            if not attrs.get('subtipo_materia'):
                raise serializers.ValidationError({
                    'subtipo_materia': 'Debe especificar el tipo de materia prima'
                })
            if not attrs.get('modalidad_logistica'):
                raise serializers.ValidationError({
                    'modalidad_logistica': 'Debe especificar la modalidad logística'
                })

            # NOTA: Los precios son opcionales durante la creación
            # Solo el Gerente o Super Admin puede asignar precios DESPUÉS de la creación
            # Si se proporcionan precios, validar que correspondan a los subtipos
            if precios:
                subtipo_materia = attrs.get('subtipo_materia', [])
                precios_tipos = [p['tipo_materia'] for p in precios]

                for tipo in precios_tipos:
                    if tipo not in subtipo_materia:
                        raise serializers.ValidationError({
                            'precios': f'El tipo de materia "{tipo}" no está en la lista de subtipos del proveedor'
                        })

            if attrs.get('unidad_negocio'):
                raise serializers.ValidationError({
                    'unidad_negocio': 'Proveedor externo no puede tener unidad de negocio'
                })

        # Validaciones para UNIDAD_NEGOCIO
        elif tipo_proveedor == 'UNIDAD_NEGOCIO':
            if not attrs.get('subtipo_materia'):
                raise serializers.ValidationError({
                    'subtipo_materia': 'Debe especificar el tipo de materia prima'
                })

            # NOTA: Los precios de transferencia interna son opcionales durante la creación
            # Solo el Gerente o Super Admin puede asignar precios DESPUÉS de la creación
            # Si se proporcionan precios, validar que correspondan a los subtipos
            if precios:
                subtipo_materia = attrs.get('subtipo_materia', [])
                precios_tipos = [p['tipo_materia'] for p in precios]

                for tipo in precios_tipos:
                    if tipo not in subtipo_materia:
                        raise serializers.ValidationError({
                            'precios': f'El tipo de materia "{tipo}" no está en la lista de subtipos del proveedor'
                        })

            if attrs.get('modalidad_logistica'):
                raise serializers.ValidationError({
                    'modalidad_logistica': 'Unidad de negocio no requiere modalidad logística'
                })

            # Validar que NO se envíe unidad_negocio (debe ser null)
            if attrs.get('unidad_negocio'):
                raise serializers.ValidationError({
                    'unidad_negocio': 'Proveedor tipo UNIDAD_NEGOCIO no debe tener unidad de negocio vinculada (el proveedor mismo ES la unidad)'
                })

        # Validaciones para PRODUCTO_SERVICIO
        elif tipo_proveedor == 'PRODUCTO_SERVICIO':
            if attrs.get('subtipo_materia'):
                raise serializers.ValidationError({
                    'subtipo_materia': 'Proveedor de productos/servicios no tiene tipo de materia'
                })
            if precios:
                raise serializers.ValidationError({
                    'precios': 'Proveedor de productos/servicios no tiene precios por kg'
                })
            if attrs.get('modalidad_logistica'):
                raise serializers.ValidationError({
                    'modalidad_logistica': 'Proveedor de productos/servicios no requiere modalidad logística'
                })
            if attrs.get('unidad_negocio'):
                raise serializers.ValidationError({
                    'unidad_negocio': 'Proveedor de productos/servicios no puede tener unidad de negocio'
                })

        return attrs

    def create(self, validated_data):
        """Crear proveedor con metadatos y precios de materia prima"""
        # Extraer precios antes de crear el proveedor
        precios_data = validated_data.pop('precios', [])

        # Obtener usuario creador del contexto
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        # Crear proveedor
        proveedor = Proveedor.objects.create(**validated_data)

        # Crear registros de PrecioMateriaPrima si es proveedor de materia prima
        if precios_data and proveedor.es_proveedor_materia_prima:
            for precio_info in precios_data:
                PrecioMateriaPrima.objects.create(
                    proveedor=proveedor,
                    tipo_materia=precio_info['tipo_materia'],
                    precio_kg=Decimal(str(precio_info['precio_kg'])),
                    modificado_por=request.user if request and hasattr(request, 'user') else None
                )

                # Crear registro en historial de precios para cada tipo de materia
                if request and hasattr(request, 'user'):
                    HistorialPrecioProveedor.objects.create(
                        proveedor=proveedor,
                        precio_anterior=None,
                        precio_nuevo=Decimal(str(precio_info['precio_kg'])),
                        modificado_por=request.user,
                        motivo=f'Precio inicial de {precio_info["tipo_materia"]} al crear proveedor'
                    )

        return proveedor


class ProveedorUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar proveedores (SIN modificar precio)"""

    class Meta:
        model = Proveedor
        fields = [
            'nombre_comercial',
            'razon_social',
            'telefono',
            'email',
            'direccion',
            'ciudad',
            'departamento',
            'formas_pago',
            'dias_plazo_pago',
            'banco',
            'tipo_cuenta',
            'numero_cuenta',
            'titular_cuenta',
            'observaciones',
            'is_active',
        ]

    def validate_email(self, value):
        """Validar email si se proporciona"""
        if value and '@' not in value:
            raise serializers.ValidationError('Proporcione un email válido')
        return value

    def validate(self, attrs):
        """Validaciones del serializer"""
        return attrs


class CambiarPrecioSerializer(serializers.Serializer):
    """
    Serializer para cambiar precio de proveedor de materia prima por código completo
    SOLO Gerente puede usar esta acción

    Los códigos incluyen la jerarquía completa:
    - HUESO_BLANDO, HUESO_DURO, HUESO_MIXTO
    - SEBO_CRUDO, SEBO_PROCESADO_A, SEBO_PROCESADO_B, etc.
    - CABEZAS
    - ACU
    """

    tipo_materia = serializers.ChoiceField(
        choices=CODIGO_MATERIA_PRIMA_CHOICES,
        required=True,
        help_text='Código de materia prima (ej: HUESO_BLANDO, SEBO_PROCESADO_A)'
    )
    precio_nuevo = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=True,
        help_text='Nuevo precio por kg'
    )
    motivo = serializers.CharField(
        required=True,
        help_text='Justificación del cambio de precio'
    )

    def validate_precio_nuevo(self, value):
        """Validar precio nuevo"""
        if value < 0:
            raise serializers.ValidationError('El precio no puede ser negativo')
        return value

    def validate_motivo(self, value):
        """Validar que el motivo no esté vacío"""
        if not value.strip():
            raise serializers.ValidationError('Debe proporcionar una justificación del cambio')
        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        proveedor = self.context.get('proveedor')
        tipo_materia = attrs.get('tipo_materia')
        precio_nuevo = attrs.get('precio_nuevo')

        # Obtener el tipo principal del código
        tipo_principal = CODIGO_A_TIPO_PRINCIPAL.get(tipo_materia, tipo_materia)

        # Validar que el proveedor maneja ese tipo principal de materia
        if proveedor and proveedor.subtipo_materia:
            if tipo_principal not in proveedor.subtipo_materia:
                tipo_display = dict(CODIGO_MATERIA_PRIMA_CHOICES).get(tipo_materia, tipo_materia)
                raise serializers.ValidationError({
                    'tipo_materia': f'El proveedor no maneja {tipo_display} (tipo principal: {tipo_principal})'
                })

        # Obtener precio actual
        try:
            precio_actual = PrecioMateriaPrima.objects.get(
                proveedor=proveedor,
                tipo_materia=tipo_materia
            )
            if precio_actual.precio_kg == precio_nuevo:
                raise serializers.ValidationError({
                    'precio_nuevo': 'El nuevo precio debe ser diferente al actual'
                })
        except PrecioMateriaPrima.DoesNotExist:
            # Si no existe, se creará uno nuevo
            pass

        return attrs

    def save(self):
        """Actualizar o crear precio y registrar en historial"""
        proveedor = self.context.get('proveedor')
        usuario = self.context.get('usuario')
        tipo_materia = self.validated_data['tipo_materia']
        precio_nuevo = self.validated_data['precio_nuevo']
        motivo = self.validated_data['motivo']

        # Obtener o crear el registro de precio
        precio_obj, created = PrecioMateriaPrima.objects.get_or_create(
            proveedor=proveedor,
            tipo_materia=tipo_materia,
            defaults={
                'precio_kg': precio_nuevo,
                'modificado_por': usuario
            }
        )

        # Guardar precio anterior
        precio_anterior = None if created else precio_obj.precio_kg

        # Si no es nuevo, actualizar
        if not created:
            precio_obj.precio_kg = precio_nuevo
            precio_obj.modificado_por = usuario
            precio_obj.save()

        # Crear registro en historial
        HistorialPrecioProveedor.objects.create(
            proveedor=proveedor,
            tipo_materia=tipo_materia,
            precio_anterior=precio_anterior,
            precio_nuevo=precio_nuevo,
            modificado_por=usuario,
            motivo=motivo
        )

        return precio_obj


# ==================== HISTORIAL PRECIO SERIALIZERS ====================

class HistorialPrecioSerializer(serializers.ModelSerializer):
    """Serializer para historial de precios"""

    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    modificado_por_nombre = serializers.CharField(source='modificado_por.get_full_name', read_only=True)
    variacion_precio = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tipo_cambio = serializers.CharField(read_only=True)
    tipo_materia_display = serializers.CharField(source='get_tipo_materia_display', read_only=True)

    class Meta:
        model = HistorialPrecioProveedor
        fields = [
            'id',
            'proveedor',
            'proveedor_nombre',
            'tipo_materia',
            'tipo_materia_display',
            'precio_anterior',
            'precio_nuevo',
            'variacion_precio',
            'tipo_cambio',
            'modificado_por',
            'modificado_por_nombre',
            'motivo',
            'fecha_modificacion',
            'created_at',
        ]
        read_only_fields = ['created_at', 'fecha_modificacion']


# ==================== CONDICION COMERCIAL SERIALIZERS ====================

class CondicionComercialSerializer(serializers.ModelSerializer):
    """Serializer para condiciones comerciales"""

    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)

    class Meta:
        model = CondicionComercialProveedor
        fields = [
            'id',
            'proveedor',
            'proveedor_nombre',
            'descripcion',
            'valor_acordado',
            'formas_pago',
            'plazo_entrega',
            'garantias',
            'vigencia_desde',
            'vigencia_hasta',
            'esta_vigente',
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Validaciones"""
        # Validar que solo proveedores de PRODUCTO_SERVICIO tengan condiciones
        proveedor = attrs.get('proveedor', self.instance.proveedor if self.instance else None)
        if proveedor and proveedor.tipo_proveedor != 'PRODUCTO_SERVICIO':
            raise serializers.ValidationError({
                'proveedor': 'Solo proveedores de tipo PRODUCTO_SERVICIO pueden tener condiciones comerciales'
            })

        # Validar fechas
        vigencia_desde = attrs.get('vigencia_desde', self.instance.vigencia_desde if self.instance else None)
        vigencia_hasta = attrs.get('vigencia_hasta', self.instance.vigencia_hasta if self.instance else None)

        if vigencia_hasta and vigencia_desde and vigencia_desde > vigencia_hasta:
            raise serializers.ValidationError({
                'vigencia_hasta': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })

        return attrs

    def create(self, validated_data):
        """Crear condición comercial con usuario creador"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        return CondicionComercialProveedor.objects.create(**validated_data)


# ==================== PRUEBA ACIDEZ SERIALIZERS ====================

class PruebaAcidezListSerializer(serializers.ModelSerializer):
    """Serializer para listado de pruebas de acidez"""

    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    calidad_resultante_display = serializers.CharField(source='get_calidad_resultante_display', read_only=True)
    realizado_por_nombre = serializers.CharField(source='realizado_por.get_full_name', read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = PruebaAcidez
        fields = [
            'id',
            'codigo_voucher',
            'proveedor',
            'proveedor_nombre',
            'fecha_prueba',
            'valor_acidez',
            'calidad_resultante',
            'calidad_resultante_display',
            'codigo_materia',
            'cantidad_kg',
            'precio_kg_aplicado',
            'valor_total',
            'realizado_por_nombre',
            'created_at',
            'is_deleted',
        ]


class PruebaAcidezDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle completo de prueba de acidez"""

    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    proveedor_documento = serializers.CharField(source='proveedor.numero_documento', read_only=True)
    calidad_resultante_display = serializers.CharField(source='get_calidad_resultante_display', read_only=True)
    realizado_por_nombre = serializers.CharField(source='realizado_por.get_full_name', read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)
    foto_prueba_url = serializers.SerializerMethodField()

    class Meta:
        model = PruebaAcidez
        fields = '__all__'
        read_only_fields = [
            'calidad_resultante',
            'codigo_materia',
            'codigo_voucher',
            'precio_kg_aplicado',
            'valor_total',
            'created_at',
            'updated_at',
            'deleted_at',
        ]

    def get_foto_prueba_url(self, obj):
        """Retorna la URL completa de la foto"""
        request = self.context.get('request')
        if obj.foto_prueba and hasattr(obj.foto_prueba, 'url'):
            if request:
                return request.build_absolute_uri(obj.foto_prueba.url)
            return obj.foto_prueba.url
        return None


class PruebaAcidezCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear pruebas de acidez"""

    class Meta:
        model = PruebaAcidez
        fields = [
            'proveedor',
            'fecha_prueba',
            'valor_acidez',
            'foto_prueba',
            'cantidad_kg',
            'observaciones',
            'lote_numero',
        ]

    def validate_proveedor(self, value):
        """Validar que el proveedor maneje SEBO"""
        if not value.subtipo_materia or 'SEBO' not in value.subtipo_materia:
            raise serializers.ValidationError(
                'Solo se pueden registrar pruebas de acidez para proveedores de SEBO'
            )
        return value

    def validate_valor_acidez(self, value):
        """Validar rango de acidez"""
        if value < 0:
            raise serializers.ValidationError('El valor de acidez no puede ser negativo')
        if value > 100:
            raise serializers.ValidationError('El valor de acidez no puede ser mayor a 100%')
        return value

    def validate_cantidad_kg(self, value):
        """Validar cantidad positiva"""
        if value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a 0')
        return value

    def create(self, validated_data):
        """Crear prueba de acidez con usuario realizador"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['realizado_por'] = request.user

        # El modelo calculará automáticamente:
        # - calidad_resultante
        # - codigo_materia
        # - codigo_voucher
        # - precio_kg_aplicado (si existe precio configurado)
        # - valor_total

        return PruebaAcidez.objects.create(**validated_data)


class SimularPruebaAcidezSerializer(serializers.Serializer):
    """
    Serializer para simular resultado de prueba de acidez sin crear registro

    Útil para mostrar al usuario qué calidad obtendrá antes de confirmar
    """

    valor_acidez = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=True,
        help_text='Valor de acidez a simular (%)'
    )
    proveedor_id = serializers.IntegerField(
        required=True,
        help_text='ID del proveedor para obtener precio'
    )
    cantidad_kg = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        default=0,
        help_text='Cantidad para calcular valor total (opcional)'
    )

    def validate_valor_acidez(self, value):
        """Validar rango de acidez"""
        if value < 0:
            raise serializers.ValidationError('El valor de acidez no puede ser negativo')
        if value > 100:
            raise serializers.ValidationError('El valor de acidez no puede ser mayor a 100%')
        return value

    def validate_proveedor_id(self, value):
        """Validar que el proveedor existe y maneja SEBO"""
        try:
            proveedor = Proveedor.objects.get(id=value)
            if not proveedor.subtipo_materia or 'SEBO' not in proveedor.subtipo_materia:
                raise serializers.ValidationError(
                    'El proveedor no maneja SEBO'
                )
            self.context['proveedor'] = proveedor
        except Proveedor.DoesNotExist:
            raise serializers.ValidationError('Proveedor no encontrado')
        return value

    def simulate(self):
        """Simular resultado de prueba sin crear registro"""
        valor_acidez = self.validated_data['valor_acidez']
        cantidad_kg = self.validated_data.get('cantidad_kg', 0)
        proveedor = self.context.get('proveedor')

        # Determinar calidad
        calidad, codigo_materia = PruebaAcidez.determinar_calidad(valor_acidez)

        # Obtener precio si existe
        precio_kg = None
        valor_total = None
        precio_existe = False

        if proveedor:
            precio_obj = proveedor.precios_materia_prima.filter(
                tipo_materia=codigo_materia
            ).first()
            if precio_obj:
                precio_kg = float(precio_obj.precio_kg)
                precio_existe = True
                if cantidad_kg > 0:
                    valor_total = float(cantidad_kg) * precio_kg

        # Obtener display de calidad
        calidad_display = dict(PruebaAcidez.CALIDAD_SEBO_CHOICES).get(calidad, calidad)

        return {
            'valor_acidez': float(valor_acidez),
            'calidad_resultante': calidad,
            'calidad_resultante_display': calidad_display,
            'codigo_materia': codigo_materia,
            'precio_kg': precio_kg,
            'precio_existe': precio_existe,
            'cantidad_kg': float(cantidad_kg) if cantidad_kg else None,
            'valor_total': valor_total,
            'mensaje': f'Con {valor_acidez}% de acidez, la calidad es {calidad_display}'
        }
