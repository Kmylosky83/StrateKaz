"""
Serializers para Gestión de Proveedores - Supply Chain
Sistema de Gestión StrateKaz

100% DINÁMICO: Serializers usan modelos de catálogo dinámicos.
"""
from rest_framework import serializers
from decimal import Decimal

from .models import (
    # Catálogos dinámicos
    CategoriaMateriaPrima,
    TipoMateriaPrima,
    TipoProveedor,
    ModalidadLogistica,
    FormaPago,
    TipoCuentaBancaria,
    TipoDocumentoIdentidad,
    Departamento,
    Ciudad,
    # Modelos principales
    UnidadNegocio,
    Proveedor,
    PrecioMateriaPrima,
    HistorialPrecioProveedor,
    CondicionComercialProveedor,
    PruebaAcidez,
    # Evaluación
    CriterioEvaluacion,
    EvaluacionProveedor,
    DetalleEvaluacion,
)


# ==============================================================================
# SERIALIZERS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

class CategoriaMateriaPrimaSerializer(serializers.ModelSerializer):
    """Serializer para categorías de materia prima."""

    class Meta:
        model = CategoriaMateriaPrima
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'orden', 'is_active']
        read_only_fields = ['id']


class TipoMateriaPrimaSerializer(serializers.ModelSerializer):
    """Serializer para tipos de materia prima."""

    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)

    class Meta:
        model = TipoMateriaPrima
        fields = [
            'id', 'categoria', 'categoria_nombre', 'codigo', 'nombre',
            'descripcion', 'acidez_min', 'acidez_max', 'codigo_legacy',
            'orden', 'is_active'
        ]
        read_only_fields = ['id']


class TipoMateriaPrimaListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listas."""

    class Meta:
        model = TipoMateriaPrima
        fields = ['id', 'codigo', 'nombre']


class TipoProveedorSerializer(serializers.ModelSerializer):
    """Serializer para tipos de proveedor."""

    class Meta:
        model = TipoProveedor
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'requiere_materia_prima', 'requiere_modalidad_logistica',
            'orden', 'is_active'
        ]
        read_only_fields = ['id']


class ModalidadLogisticaSerializer(serializers.ModelSerializer):
    """Serializer para modalidades logísticas."""

    class Meta:
        model = ModalidadLogistica
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'orden', 'is_active']
        read_only_fields = ['id']


class FormaPagoSerializer(serializers.ModelSerializer):
    """Serializer para formas de pago."""

    class Meta:
        model = FormaPago
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'orden', 'is_active']
        read_only_fields = ['id']


class TipoCuentaBancariaSerializer(serializers.ModelSerializer):
    """Serializer para tipos de cuenta bancaria."""

    class Meta:
        model = TipoCuentaBancaria
        fields = ['id', 'codigo', 'nombre', 'orden', 'is_active']
        read_only_fields = ['id']


class TipoDocumentoIdentidadSerializer(serializers.ModelSerializer):
    """Serializer para tipos de documento."""

    class Meta:
        model = TipoDocumentoIdentidad
        fields = ['id', 'codigo', 'nombre', 'orden', 'is_active']
        read_only_fields = ['id']


class DepartamentoSerializer(serializers.ModelSerializer):
    """Serializer para departamentos."""

    class Meta:
        model = Departamento
        fields = ['id', 'codigo', 'nombre', 'codigo_dane', 'orden', 'is_active']
        read_only_fields = ['id']


class CiudadSerializer(serializers.ModelSerializer):
    """Serializer para ciudades."""

    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)

    class Meta:
        model = Ciudad
        fields = [
            'id', 'departamento', 'departamento_nombre', 'codigo', 'nombre',
            'codigo_dane', 'es_capital', 'orden', 'is_active'
        ]
        read_only_fields = ['id']


# ==============================================================================
# SERIALIZERS DE UNIDAD DE NEGOCIO
# ==============================================================================

class UnidadNegocioSerializer(serializers.ModelSerializer):
    """Serializer para Unidad de Negocio."""

    tipo_unidad_display = serializers.CharField(source='get_tipo_unidad_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = UnidadNegocio
        fields = [
            'id', 'codigo', 'nombre', 'tipo_unidad', 'tipo_unidad_display',
            'direccion', 'ciudad', 'departamento', 'departamento_nombre',
            'responsable', 'responsable_nombre',
            'is_active', 'is_deleted', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_codigo(self, value):
        """Validar código único."""
        value = value.upper()
        unidad_id = self.instance.id if self.instance else None
        if UnidadNegocio.objects.filter(codigo=value).exclude(id=unidad_id).exists():
            raise serializers.ValidationError('Ya existe una unidad de negocio con este código')
        return value


# ==============================================================================
# SERIALIZERS DE PRECIO MATERIA PRIMA
# ==============================================================================

class PrecioMateriaPrimaSerializer(serializers.ModelSerializer):
    """Serializer para precios de materia prima."""

    tipo_materia_nombre = serializers.CharField(source='tipo_materia.nombre', read_only=True)
    tipo_materia_codigo = serializers.CharField(source='tipo_materia.codigo', read_only=True)
    categoria_nombre = serializers.CharField(source='tipo_materia.categoria.nombre', read_only=True)
    modificado_por_nombre = serializers.CharField(source='modificado_por.get_full_name', read_only=True)

    class Meta:
        model = PrecioMateriaPrima
        fields = [
            'id', 'proveedor', 'tipo_materia', 'tipo_materia_nombre',
            'tipo_materia_codigo', 'categoria_nombre', 'precio_kg',
            'modificado_por', 'modificado_por_nombre', 'modificado_fecha',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'modificado_fecha', 'created_at', 'updated_at']


# ==============================================================================
# SERIALIZERS DE PROVEEDOR
# ==============================================================================

class ProveedorListSerializer(serializers.ModelSerializer):
    """Serializer para listado de proveedores (campos resumidos)."""

    tipo_proveedor_nombre = serializers.CharField(source='tipo_proveedor.nombre', read_only=True)
    tipo_proveedor_codigo = serializers.CharField(source='tipo_proveedor.codigo', read_only=True)
    modalidad_logistica_nombre = serializers.CharField(
        source='modalidad_logistica.nombre', read_only=True, allow_null=True
    )
    unidad_negocio_nombre = serializers.CharField(
        source='unidad_negocio.nombre', read_only=True, allow_null=True
    )
    departamento_nombre = serializers.CharField(
        source='departamento.nombre', read_only=True, allow_null=True
    )
    tipo_documento_nombre = serializers.CharField(source='tipo_documento.nombre', read_only=True)
    es_proveedor_materia_prima = serializers.BooleanField(read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    # Tipos de materia prima (M2M)
    tipos_materia_prima_display = serializers.SerializerMethodField()

    # Formas de pago (M2M)
    formas_pago_display = serializers.SerializerMethodField()

    # Precios de materia prima
    precios_materia_prima = PrecioMateriaPrimaSerializer(many=True, read_only=True)

    # Acceso al sistema
    usuarios_vinculados_count = serializers.IntegerField(read_only=True, default=0)
    tiene_acceso = serializers.SerializerMethodField()

    class Meta:
        model = Proveedor
        fields = [
            'id', 'codigo_interno', 'tipo_proveedor', 'tipo_proveedor_nombre',
            'tipo_proveedor_codigo', 'tipos_materia_prima', 'tipos_materia_prima_display',
            'modalidad_logistica', 'modalidad_logistica_nombre',
            'nombre_comercial', 'razon_social', 'tipo_documento', 'tipo_documento_nombre',
            'numero_documento', 'nit', 'telefono', 'email', 'direccion', 'ciudad',
            'departamento', 'departamento_nombre',
            'unidad_negocio', 'unidad_negocio_nombre',
            'formas_pago', 'formas_pago_display', 'dias_plazo_pago',
            'banco', 'tipo_cuenta', 'numero_cuenta', 'titular_cuenta',
            'precios_materia_prima', 'es_proveedor_materia_prima',
            'observaciones', 'is_active', 'created_by_nombre', 'created_at',
            'usuarios_vinculados_count', 'tiene_acceso',
        ]

    def get_tiene_acceso(self, obj):
        """Retorna True si el proveedor tiene al menos un usuario activo."""
        if hasattr(obj, 'usuarios_vinculados_count'):
            return obj.usuarios_vinculados_count > 0
        return obj.usuarios_vinculados.filter(is_active=True).exists()

    def get_tipos_materia_prima_display(self, obj):
        """Retorna nombres de tipos de materia prima."""
        return [t.nombre for t in obj.tipos_materia_prima.all()]

    def get_formas_pago_display(self, obj):
        """Retorna nombres de formas de pago."""
        return [f.nombre for f in obj.formas_pago.all()]


class ProveedorDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle completo de proveedor."""

    tipo_proveedor_data = TipoProveedorSerializer(source='tipo_proveedor', read_only=True)
    tipos_materia_prima_data = TipoMateriaPrimaListSerializer(
        source='tipos_materia_prima', many=True, read_only=True
    )
    modalidad_logistica_data = ModalidadLogisticaSerializer(
        source='modalidad_logistica', read_only=True
    )
    tipo_documento_data = TipoDocumentoIdentidadSerializer(source='tipo_documento', read_only=True)
    departamento_data = DepartamentoSerializer(source='departamento', read_only=True)
    unidad_negocio_data = UnidadNegocioSerializer(source='unidad_negocio', read_only=True)
    formas_pago_data = FormaPagoSerializer(source='formas_pago', many=True, read_only=True)
    tipo_cuenta_data = TipoCuentaBancariaSerializer(source='tipo_cuenta', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    precios_materia_prima = PrecioMateriaPrimaSerializer(many=True, read_only=True)
    es_proveedor_materia_prima = serializers.BooleanField(read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Proveedor
        fields = '__all__'
        read_only_fields = ['id', 'codigo_interno', 'created_at', 'updated_at', 'deleted_at']


class ProveedorCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear proveedores con validaciones dinámicas."""

    # Campo write-only para recibir precios por tipo de materia prima
    precios = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text='Lista de precios: [{"tipo_materia_id": 1, "precio_kg": "5000.00"}, ...]'
    )

    class Meta:
        model = Proveedor
        fields = [
            'tipo_proveedor', 'tipos_materia_prima', 'modalidad_logistica',
            'nombre_comercial', 'razon_social', 'tipo_documento', 'numero_documento', 'nit',
            'telefono', 'email', 'direccion', 'ciudad', 'departamento',
            'unidad_negocio', 'formas_pago', 'dias_plazo_pago',
            'banco', 'tipo_cuenta', 'numero_cuenta', 'titular_cuenta',
            'precios', 'observaciones', 'is_active'
        ]

    def validate_numero_documento(self, value):
        """Validar número de documento único."""
        if Proveedor.objects.filter(numero_documento=value).exists():
            raise serializers.ValidationError('Ya existe un proveedor con este número de documento')
        return value

    def validate_email(self, value):
        """Validar email si se proporciona."""
        if value and '@' not in value:
            raise serializers.ValidationError('Proporcione un email válido')
        return value

    def validate_precios(self, value):
        """Validar lista de precios."""
        if not value:
            return value

        for precio_data in value:
            if 'tipo_materia_id' not in precio_data:
                raise serializers.ValidationError('Cada precio debe tener "tipo_materia_id"')
            if 'precio_kg' not in precio_data:
                raise serializers.ValidationError('Cada precio debe tener "precio_kg"')

            # Validar que tipo_materia existe
            tipo_id = precio_data['tipo_materia_id']
            if not TipoMateriaPrima.objects.filter(id=tipo_id, is_active=True).exists():
                raise serializers.ValidationError(f'Tipo de materia prima {tipo_id} no existe o no está activo')

            # Validar precio positivo
            try:
                precio_kg = Decimal(str(precio_data['precio_kg']))
                if precio_kg < 0:
                    raise serializers.ValidationError('El precio no puede ser negativo')
            except (ValueError, TypeError):
                raise serializers.ValidationError('precio_kg debe ser un número válido')

        return value

    def validate(self, attrs):
        """Validaciones cruzadas según tipo de proveedor."""
        tipo_proveedor = attrs.get('tipo_proveedor')

        if tipo_proveedor:
            # Validar modalidad logística si es requerida
            if tipo_proveedor.requiere_modalidad_logistica and not attrs.get('modalidad_logistica'):
                raise serializers.ValidationError({
                    'modalidad_logistica': 'Este tipo de proveedor requiere modalidad logística'
                })

            # Validar tipos de materia prima si es requerido
            if tipo_proveedor.requiere_materia_prima:
                tipos_mp = attrs.get('tipos_materia_prima', [])
                if not tipos_mp:
                    raise serializers.ValidationError({
                        'tipos_materia_prima': 'Este tipo de proveedor requiere especificar tipos de materia prima'
                    })

        return attrs

    def create(self, validated_data):
        """Crear proveedor con precios."""
        precios_data = validated_data.pop('precios', [])
        tipos_mp = validated_data.pop('tipos_materia_prima', [])
        formas_pago = validated_data.pop('formas_pago', [])

        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        proveedor = Proveedor.objects.create(**validated_data)

        # Agregar tipos de materia prima (M2M)
        if tipos_mp:
            proveedor.tipos_materia_prima.set(tipos_mp)

        # Agregar formas de pago (M2M)
        if formas_pago:
            proveedor.formas_pago.set(formas_pago)

        # Crear precios de materia prima
        if precios_data and proveedor.es_proveedor_materia_prima:
            for precio_info in precios_data:
                tipo_materia = TipoMateriaPrima.objects.get(id=precio_info['tipo_materia_id'])
                PrecioMateriaPrima.objects.create(
                    proveedor=proveedor,
                    tipo_materia=tipo_materia,
                    precio_kg=Decimal(str(precio_info['precio_kg'])),
                    modificado_por=request.user if request and hasattr(request, 'user') else None
                )

                # Crear registro en historial
                if request and hasattr(request, 'user'):
                    HistorialPrecioProveedor.objects.create(
                        proveedor=proveedor,
                        tipo_materia=tipo_materia,
                        precio_anterior=None,
                        precio_nuevo=Decimal(str(precio_info['precio_kg'])),
                        modificado_por=request.user,
                        motivo=f'Precio inicial de {tipo_materia.nombre} al crear proveedor'
                    )

        return proveedor


class ProveedorUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar proveedores (SIN modificar precio)."""

    class Meta:
        model = Proveedor
        fields = [
            'nombre_comercial', 'razon_social', 'telefono', 'email',
            'direccion', 'ciudad', 'departamento',
            'formas_pago', 'dias_plazo_pago',
            'banco', 'tipo_cuenta', 'numero_cuenta', 'titular_cuenta',
            'observaciones', 'is_active'
        ]

    def validate_email(self, value):
        if value and '@' not in value:
            raise serializers.ValidationError('Proporcione un email válido')
        return value


class CambiarPrecioSerializer(serializers.Serializer):
    """
    Serializer para cambiar precio de proveedor de materia prima.
    SOLO Gerente puede usar esta acción.
    """

    tipo_materia_id = serializers.IntegerField(
        required=True,
        help_text='ID del tipo de materia prima'
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
        if value < 0:
            raise serializers.ValidationError('El precio no puede ser negativo')
        return value

    def validate_motivo(self, value):
        if not value.strip():
            raise serializers.ValidationError('Debe proporcionar una justificación del cambio')
        return value

    def validate_tipo_materia_id(self, value):
        if not TipoMateriaPrima.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Tipo de materia prima no existe o no está activo')
        return value

    def validate(self, attrs):
        proveedor = self.context.get('proveedor')
        tipo_materia_id = attrs.get('tipo_materia_id')
        precio_nuevo = attrs.get('precio_nuevo')

        # Validar que el proveedor maneja ese tipo de materia
        if proveedor:
            tipo_materia = TipoMateriaPrima.objects.get(id=tipo_materia_id)
            if not proveedor.tipos_materia_prima.filter(id=tipo_materia_id).exists():
                raise serializers.ValidationError({
                    'tipo_materia_id': f'El proveedor no maneja {tipo_materia.nombre}'
                })

            # Verificar si el precio es diferente al actual
            try:
                precio_actual = PrecioMateriaPrima.objects.get(
                    proveedor=proveedor,
                    tipo_materia_id=tipo_materia_id
                )
                if precio_actual.precio_kg == precio_nuevo:
                    raise serializers.ValidationError({
                        'precio_nuevo': 'El nuevo precio debe ser diferente al actual'
                    })
            except PrecioMateriaPrima.DoesNotExist:
                pass

        return attrs

    def save(self):
        proveedor = self.context.get('proveedor')
        usuario = self.context.get('usuario')
        tipo_materia_id = self.validated_data['tipo_materia_id']
        precio_nuevo = self.validated_data['precio_nuevo']
        motivo = self.validated_data['motivo']

        tipo_materia = TipoMateriaPrima.objects.get(id=tipo_materia_id)

        precio_obj, created = PrecioMateriaPrima.objects.get_or_create(
            proveedor=proveedor,
            tipo_materia=tipo_materia,
            defaults={
                'precio_kg': precio_nuevo,
                'modificado_por': usuario
            }
        )

        precio_anterior = None if created else precio_obj.precio_kg

        if not created:
            precio_obj.precio_kg = precio_nuevo
            precio_obj.modificado_por = usuario
            precio_obj.save()

        HistorialPrecioProveedor.objects.create(
            proveedor=proveedor,
            tipo_materia=tipo_materia,
            precio_anterior=precio_anterior,
            precio_nuevo=precio_nuevo,
            modificado_por=usuario,
            motivo=motivo
        )

        return precio_obj


# ==============================================================================
# SERIALIZER PARA CREAR ACCESO AL SISTEMA
# ==============================================================================

class CrearAccesoProveedorSerializer(serializers.Serializer):
    """
    Serializer para crear acceso al sistema para un proveedor.

    - Consultores/Contratistas: cargo_id requerido (acceso a módulos internos)
    - Otros tipos: cargo_id opcional (se asigna cargo portal automáticamente)
    """

    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True, max_length=150)
    cargo_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        default=None,
        help_text='ID del cargo. Solo requerido para consultores/contratistas.'
    )

    def validate_cargo_id(self, value):
        if value is None:
            return value
        from django.apps import apps
        Cargo = apps.get_model('core', 'Cargo')
        try:
            Cargo.objects.get(id=value, is_active=True)
        except Cargo.DoesNotExist:
            raise serializers.ValidationError('Cargo no encontrado o no válido.')
        return value

    def validate_username(self, value):
        value = value.strip()
        if ' ' in value:
            raise serializers.ValidationError('El nombre de usuario no puede contener espacios.')
        if len(value) < 3:
            raise serializers.ValidationError('El nombre de usuario debe tener al menos 3 caracteres.')
        return value


# ==============================================================================
# SERIALIZERS DE HISTORIAL DE PRECIOS
# ==============================================================================

class HistorialPrecioSerializer(serializers.ModelSerializer):
    """Serializer para historial de precios."""

    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    tipo_materia_nombre = serializers.CharField(source='tipo_materia.nombre', read_only=True)
    modificado_por_nombre = serializers.CharField(source='modificado_por.get_full_name', read_only=True)
    variacion_precio = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tipo_cambio = serializers.CharField(read_only=True)

    class Meta:
        model = HistorialPrecioProveedor
        fields = [
            'id', 'proveedor', 'proveedor_nombre', 'tipo_materia', 'tipo_materia_nombre',
            'precio_anterior', 'precio_nuevo', 'variacion_precio', 'tipo_cambio',
            'modificado_por', 'modificado_por_nombre', 'motivo',
            'fecha_modificacion', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'fecha_modificacion']


# ==============================================================================
# SERIALIZERS DE CONDICIONES COMERCIALES
# ==============================================================================

class CondicionComercialSerializer(serializers.ModelSerializer):
    """Serializer para condiciones comerciales."""

    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)

    class Meta:
        model = CondicionComercialProveedor
        fields = [
            'id', 'proveedor', 'proveedor_nombre', 'descripcion', 'valor_acordado',
            'forma_pago', 'plazo_entrega', 'garantias',
            'vigencia_desde', 'vigencia_hasta', 'esta_vigente',
            'created_by', 'created_by_nombre', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate(self, attrs):
        proveedor = attrs.get('proveedor', self.instance.proveedor if self.instance else None)
        if proveedor and not proveedor.tipo_proveedor.codigo == 'PRODUCTO_SERVICIO':
            # Solo advertencia, no error
            pass

        vigencia_desde = attrs.get('vigencia_desde', self.instance.vigencia_desde if self.instance else None)
        vigencia_hasta = attrs.get('vigencia_hasta', self.instance.vigencia_hasta if self.instance else None)

        if vigencia_hasta and vigencia_desde and vigencia_desde > vigencia_hasta:
            raise serializers.ValidationError({
                'vigencia_hasta': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return CondicionComercialProveedor.objects.create(**validated_data)


# ==============================================================================
# SERIALIZERS DE PRUEBA DE ACIDEZ
# ==============================================================================

class PruebaAcidezListSerializer(serializers.ModelSerializer):
    """Serializer para listado de pruebas de acidez."""

    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    calidad_resultante_display = serializers.CharField(source='get_calidad_resultante_display', read_only=True)
    tipo_materia_nombre = serializers.CharField(source='tipo_materia_resultante.nombre', read_only=True)
    realizado_por_nombre = serializers.CharField(source='realizado_por.get_full_name', read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = PruebaAcidez
        fields = [
            'id', 'codigo_voucher', 'proveedor', 'proveedor_nombre',
            'fecha_prueba', 'valor_acidez', 'calidad_resultante', 'calidad_resultante_display',
            'tipo_materia_resultante', 'tipo_materia_nombre',
            'cantidad_kg', 'precio_kg_aplicado', 'valor_total',
            'realizado_por_nombre', 'created_at', 'is_deleted'
        ]


class PruebaAcidezDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de prueba de acidez."""

    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    proveedor_documento = serializers.CharField(source='proveedor.numero_documento', read_only=True)
    calidad_resultante_display = serializers.CharField(source='get_calidad_resultante_display', read_only=True)
    tipo_materia_nombre = serializers.CharField(source='tipo_materia_resultante.nombre', read_only=True)
    realizado_por_nombre = serializers.CharField(source='realizado_por.get_full_name', read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)
    foto_prueba_url = serializers.SerializerMethodField()

    class Meta:
        model = PruebaAcidez
        fields = '__all__'
        read_only_fields = [
            'calidad_resultante', 'tipo_materia_resultante', 'codigo_voucher',
            'precio_kg_aplicado', 'valor_total', 'created_at', 'updated_at', 'deleted_at'
        ]

    def get_foto_prueba_url(self, obj):
        request = self.context.get('request')
        if obj.foto_prueba and hasattr(obj.foto_prueba, 'url'):
            if request:
                return request.build_absolute_uri(obj.foto_prueba.url)
            return obj.foto_prueba.url
        return None


class PruebaAcidezCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear pruebas de acidez."""

    class Meta:
        model = PruebaAcidez
        fields = [
            'proveedor', 'fecha_prueba', 'valor_acidez', 'foto_prueba',
            'cantidad_kg', 'observaciones', 'lote_numero'
        ]

    def validate_proveedor(self, value):
        # Validar que el proveedor maneje SEBO (buscar por categoría)
        tipos_sebo = TipoMateriaPrima.objects.filter(
            categoria__codigo__icontains='SEBO',
            is_active=True
        )
        if not value.tipos_materia_prima.filter(id__in=tipos_sebo.values_list('id', flat=True)).exists():
            raise serializers.ValidationError(
                'Solo se pueden registrar pruebas de acidez para proveedores de SEBO'
            )
        return value

    def validate_valor_acidez(self, value):
        if value < 0:
            raise serializers.ValidationError('El valor de acidez no puede ser negativo')
        if value > 100:
            raise serializers.ValidationError('El valor de acidez no puede ser mayor a 100%')
        return value

    def validate_cantidad_kg(self, value):
        if value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a 0')
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['realizado_por'] = request.user
        return PruebaAcidez.objects.create(**validated_data)


class SimularPruebaAcidezSerializer(serializers.Serializer):
    """Serializer para simular resultado de prueba de acidez sin crear registro."""

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
        if value < 0:
            raise serializers.ValidationError('El valor de acidez no puede ser negativo')
        if value > 100:
            raise serializers.ValidationError('El valor de acidez no puede ser mayor a 100%')
        return value

    def validate_proveedor_id(self, value):
        try:
            proveedor = Proveedor.objects.get(id=value)
            # Validar que maneja SEBO
            tipos_sebo = TipoMateriaPrima.objects.filter(
                categoria__codigo__icontains='SEBO',
                is_active=True
            )
            if not proveedor.tipos_materia_prima.filter(id__in=tipos_sebo.values_list('id', flat=True)).exists():
                raise serializers.ValidationError('El proveedor no maneja SEBO')
            self.context['proveedor'] = proveedor
        except Proveedor.DoesNotExist:
            raise serializers.ValidationError('Proveedor no encontrado')
        return value

    def simulate(self):
        valor_acidez = self.validated_data['valor_acidez']
        cantidad_kg = self.validated_data.get('cantidad_kg', 0)
        proveedor = self.context.get('proveedor')

        # Determinar tipo de materia prima según acidez
        tipo_materia = TipoMateriaPrima.obtener_por_acidez(float(valor_acidez))

        precio_kg = None
        valor_total = None
        precio_existe = False

        if proveedor and tipo_materia:
            precio_obj = proveedor.precios_materia_prima.filter(
                tipo_materia=tipo_materia
            ).first()
            if precio_obj:
                precio_kg = float(precio_obj.precio_kg)
                precio_existe = True
                if cantidad_kg > 0:
                    valor_total = float(cantidad_kg) * precio_kg

        # Determinar calidad
        calidad_map = {
            'SEBO_PROCESADO_A': ('A', 'Calidad A'),
            'SEBO_PROCESADO_B': ('B', 'Calidad B'),
            'SEBO_PROCESADO_B1': ('B1', 'Calidad B1'),
            'SEBO_PROCESADO_B2': ('B2', 'Calidad B2'),
            'SEBO_PROCESADO_B4': ('B4', 'Calidad B4'),
            'SEBO_PROCESADO_C': ('C', 'Calidad C'),
        }

        calidad = 'C'
        calidad_display = 'Calidad C'
        if tipo_materia and tipo_materia.codigo in calidad_map:
            calidad, calidad_display = calidad_map[tipo_materia.codigo]

        return {
            'valor_acidez': float(valor_acidez),
            'calidad_resultante': calidad,
            'calidad_resultante_display': calidad_display,
            'tipo_materia': tipo_materia.nombre if tipo_materia else None,
            'tipo_materia_id': tipo_materia.id if tipo_materia else None,
            'precio_kg': precio_kg,
            'precio_existe': precio_existe,
            'cantidad_kg': float(cantidad_kg) if cantidad_kg else None,
            'valor_total': valor_total,
            'mensaje': f'Con {valor_acidez}% de acidez, la calidad es {calidad_display}'
        }


# ==============================================================================
# SERIALIZERS DE EVALUACIÓN DE PROVEEDORES
# ==============================================================================

class CriterioEvaluacionSerializer(serializers.ModelSerializer):
    """Serializer para criterios de evaluación."""

    aplica_a_tipos = serializers.SerializerMethodField()

    class Meta:
        model = CriterioEvaluacion
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'peso',
            'aplica_a_tipo', 'aplica_a_tipos', 'orden', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_aplica_a_tipos(self, obj):
        return [{'id': t.id, 'nombre': t.nombre} for t in obj.aplica_a_tipo.all()]


class DetalleEvaluacionSerializer(serializers.ModelSerializer):
    """Serializer para detalle de evaluación."""

    criterio_nombre = serializers.CharField(source='criterio.nombre', read_only=True)
    criterio_peso = serializers.DecimalField(
        source='criterio.peso', max_digits=5, decimal_places=2, read_only=True
    )

    class Meta:
        model = DetalleEvaluacion
        fields = [
            'id', 'evaluacion', 'criterio', 'criterio_nombre', 'criterio_peso',
            'calificacion', 'observaciones', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EvaluacionProveedorSerializer(serializers.ModelSerializer):
    """Serializer para evaluación de proveedores."""

    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    evaluado_por_nombre = serializers.CharField(source='evaluado_por.get_full_name', read_only=True)
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name', read_only=True, allow_null=True
    )
    detalles = DetalleEvaluacionSerializer(many=True, read_only=True)

    class Meta:
        model = EvaluacionProveedor
        fields = [
            'id', 'proveedor', 'proveedor_nombre', 'periodo', 'fecha_evaluacion',
            'estado', 'estado_display', 'calificacion_total', 'observaciones',
            'evaluado_por', 'evaluado_por_nombre',
            'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'detalles', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'calificacion_total', 'created_at', 'updated_at']
