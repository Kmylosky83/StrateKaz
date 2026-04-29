"""
Serializers para Recepción de Materia Prima - Production Ops
Sistema de Gestión StrateKaz

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
    PruebaAcidez,
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

    # tipo_materia_prima_nombre viene del modelo directamente (campo cache — Sprint M1)
    tipo_materia_prima_codigo = serializers.SerializerMethodField()
    cumple_acidez = serializers.BooleanField(read_only=True)

    def get_tipo_materia_prima_codigo(self, obj):
        """Lazy load del código del tipo de materia prima."""
        if not obj.tipo_materia_prima_id:
            return None
        try:
            from django.apps import apps
            TipoMateriaPrima = apps.get_model('gestion_proveedores', 'TipoMateriaPrima')
            return TipoMateriaPrima.objects.filter(
                id=obj.tipo_materia_prima_id
            ).values_list('codigo', flat=True).first()
        except LookupError:
            return None

    class Meta:
        model = DetalleRecepcion
        fields = [
            'id', 'recepcion', 'tipo_materia_prima_id', 'tipo_materia_prima_nombre',
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

    # proveedor_nombre viene del modelo directamente (campo cache — Sprint M1)
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
            'proveedor_id', 'proveedor_nombre',
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
        """Datos básicos del proveedor (lazy load — Sprint M1 Modularización)."""
        if not obj.proveedor_id:
            return None
        try:
            from django.apps import apps
            Proveedor = apps.get_model('infra_catalogo_productos', 'Proveedor')
            proveedor = Proveedor.objects.filter(id=obj.proveedor_id).first()
            if proveedor:
                return {
                    'id': proveedor.id,
                    'codigo_interno': proveedor.codigo_interno,
                    'nombre_comercial': proveedor.nombre_comercial,
                    'nit': proveedor.nit,
                    'telefono': proveedor.telefono,
                }
        except LookupError:
            pass
        return {
            'id': obj.proveedor_id,
            'nombre_comercial': obj.proveedor_nombre,
        }

    def get_programacion_data(self, obj):
        """Datos de programación si existe (lazy load — Sprint M1)."""
        if not obj.programacion_id:
            return None
        try:
            from django.apps import apps
            Programacion = apps.get_model('programacion_abastecimiento', 'ProgramacionAbastecimiento')
            prog = Programacion.objects.filter(id=obj.programacion_id).first()
            if prog:
                return {
                    'id': prog.id,
                    'codigo': prog.codigo,
                    'fecha_programada': prog.fecha_programada,
                }
        except LookupError:
            pass
        return {'id': obj.programacion_id}


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
            'proveedor_id', 'proveedor_nombre', 'programacion_id',
            'tipo_recepcion', 'punto_recepcion', 'estado',
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
        from django.apps import apps

        detalles_data = validated_data.pop('detalles_data', [])
        controles_data = validated_data.pop('controles_data', [])

        request = self.context.get('request')

        # Crear recepción
        recepcion = Recepcion.objects.create(**validated_data)

        # Crear detalles (desacoplado de Supply Chain — Sprint M1)
        TipoMateriaPrima = apps.get_model('gestion_proveedores', 'TipoMateriaPrima')
        for detalle_info in detalles_data:
            tipo_materia = TipoMateriaPrima.objects.get(
                id=detalle_info['tipo_materia_prima_id']
            )
            DetalleRecepcion.objects.create(
                recepcion=recepcion,
                tipo_materia_prima_id=tipo_materia.id,
                tipo_materia_prima_nombre=tipo_materia.nombre,
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


# ==============================================================================
# SERIALIZERS DE PRUEBA DE ACIDEZ (Migrado desde Supply Chain)
# ==============================================================================

class PruebaAcidezListSerializer(serializers.ModelSerializer):
    """Serializer para listado de pruebas de acidez."""
    calidad_resultante_display = serializers.CharField(
        source='get_calidad_resultante_display', read_only=True
    )
    realizado_por_nombre = serializers.CharField(
        source='realizado_por.get_full_name', read_only=True
    )
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = PruebaAcidez
        fields = [
            'id', 'codigo_voucher', 'proveedor_id', 'proveedor_nombre',
            'fecha_prueba', 'valor_acidez', 'calidad_resultante',
            'calidad_resultante_display',
            'tipo_materia_resultante_id', 'tipo_materia_resultante_nombre',
            'cantidad_kg', 'precio_kg_aplicado', 'valor_total',
            'realizado_por_nombre', 'created_at', 'is_deleted'
        ]


class PruebaAcidezDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de prueba de acidez."""
    calidad_resultante_display = serializers.CharField(
        source='get_calidad_resultante_display', read_only=True
    )
    realizado_por_nombre = serializers.CharField(
        source='realizado_por.get_full_name', read_only=True
    )
    is_deleted = serializers.BooleanField(read_only=True)
    foto_prueba_url = serializers.SerializerMethodField()

    class Meta:
        model = PruebaAcidez
        fields = '__all__'
        read_only_fields = [
            'calidad_resultante', 'tipo_materia_resultante_id',
            'tipo_materia_resultante_nombre', 'proveedor_nombre',
            'codigo_voucher', 'precio_kg_aplicado', 'valor_total',
            'created_at', 'updated_at', 'deleted_at'
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
            'proveedor_id', 'fecha_prueba', 'valor_acidez', 'foto_prueba',
            'cantidad_kg', 'observaciones', 'lote_numero'
        ]

    def validate_proveedor_id(self, value):
        from django.apps import apps
        try:
            Proveedor = apps.get_model('infra_catalogo_productos', 'Proveedor')
            proveedor = Proveedor.objects.get(id=value)
        except Exception:
            raise serializers.ValidationError('Proveedor no encontrado')

        # Validar que el proveedor maneje SEBO
        TipoMateriaPrima = apps.get_model('gestion_proveedores', 'TipoMateriaPrima')
        tipos_sebo = TipoMateriaPrima.objects.filter(
            categoria__codigo__icontains='SEBO', is_active=True
        )
        if not proveedor.tipos_materia_prima.filter(
            id__in=tipos_sebo.values_list('id', flat=True)
        ).exists():
            raise serializers.ValidationError(
                'Solo se pueden registrar pruebas de acidez para proveedores de SEBO'
            )
        # Cache nombre
        self.context['proveedor_nombre'] = proveedor.nombre_comercial
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
        validated_data['proveedor_nombre'] = self.context.get('proveedor_nombre', '')
        return PruebaAcidez.objects.create(**validated_data)


class SimularPruebaAcidezSerializer(serializers.Serializer):
    """Serializer para simular resultado de prueba sin crear registro."""
    valor_acidez = serializers.DecimalField(max_digits=5, decimal_places=2, required=True)
    proveedor_id = serializers.IntegerField(required=True)
    cantidad_kg = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=0
    )

    def validate_valor_acidez(self, value):
        if value < 0:
            raise serializers.ValidationError('El valor de acidez no puede ser negativo')
        if value > 100:
            raise serializers.ValidationError('El valor de acidez no puede ser mayor a 100%')
        return value

    def validate_proveedor_id(self, value):
        from django.apps import apps
        try:
            Proveedor = apps.get_model('infra_catalogo_productos', 'Proveedor')
            proveedor = Proveedor.objects.get(id=value)
            TipoMateriaPrima = apps.get_model('gestion_proveedores', 'TipoMateriaPrima')
            tipos_sebo = TipoMateriaPrima.objects.filter(
                categoria__codigo__icontains='SEBO', is_active=True
            )
            if not proveedor.tipos_materia_prima.filter(
                id__in=tipos_sebo.values_list('id', flat=True)
            ).exists():
                raise serializers.ValidationError('El proveedor no maneja SEBO')
            self.context['proveedor'] = proveedor
        except Proveedor.DoesNotExist:
            raise serializers.ValidationError('Proveedor no encontrado')
        return value

    def simulate(self):
        from django.apps import apps
        valor_acidez = self.validated_data['valor_acidez']
        cantidad_kg = self.validated_data.get('cantidad_kg', 0)
        proveedor = self.context.get('proveedor')

        TipoMateriaPrima = apps.get_model('gestion_proveedores', 'TipoMateriaPrima')
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
