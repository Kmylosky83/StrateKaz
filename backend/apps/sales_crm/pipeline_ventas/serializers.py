"""
Serializers para Pipeline de Ventas - Sales CRM
"""

from rest_framework import serializers
from .models import (
    EtapaVenta, MotivoPerdida, FuenteOportunidad,
    Oportunidad, SeguimientoOportunidad, Cotizacion,
    DetalleCotizacion, HistorialEtapa
)
from decimal import Decimal


class EtapaVentaSerializer(serializers.ModelSerializer):
    """Serializer para etapas de venta"""

    class Meta:
        model = EtapaVenta
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'color', 'probabilidad_cierre',
            'es_inicial', 'es_ganada', 'es_perdida', 'es_final', 'permite_edicion',
            'activo', 'orden', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MotivoPerdidaSerializer(serializers.ModelSerializer):
    """Serializer para motivos de pérdida"""

    class Meta:
        model = MotivoPerdida
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'activo', 'orden',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class FuenteOportunidadSerializer(serializers.ModelSerializer):
    """Serializer para fuentes de oportunidad"""

    class Meta:
        model = FuenteOportunidad
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'activo', 'orden',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class HistorialEtapaSerializer(serializers.ModelSerializer):
    """Serializer para historial de cambios de etapa"""

    etapa_anterior_nombre = serializers.CharField(source='etapa_anterior.nombre', read_only=True)
    etapa_nueva_nombre = serializers.CharField(source='etapa_nueva.nombre', read_only=True)
    cambiado_por_nombre = serializers.CharField(source='cambiado_por.get_full_name', read_only=True)

    class Meta:
        model = HistorialEtapa
        fields = [
            'id', 'oportunidad', 'etapa_anterior', 'etapa_anterior_nombre',
            'etapa_nueva', 'etapa_nueva_nombre', 'fecha_cambio',
            'cambiado_por', 'cambiado_por_nombre', 'observaciones',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class SeguimientoOportunidadSerializer(serializers.ModelSerializer):
    """Serializer para seguimientos de oportunidad"""

    tipo_actividad_display = serializers.CharField(source='get_tipo_actividad_display', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)
    oportunidad_codigo = serializers.CharField(source='oportunidad.codigo', read_only=True)

    class Meta:
        model = SeguimientoOportunidad
        fields = [
            'id', 'oportunidad', 'oportunidad_codigo', 'fecha', 'tipo_actividad',
            'tipo_actividad_display', 'descripcion', 'resultado', 'proxima_accion',
            'fecha_proxima', 'registrado_por', 'registrado_por_nombre',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class OportunidadListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de oportunidades"""

    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    vendedor_nombre = serializers.CharField(source='vendedor.get_full_name', read_only=True)
    etapa_nombre = serializers.CharField(source='etapa_actual.nombre', read_only=True)
    etapa_color = serializers.CharField(source='etapa_actual.color', read_only=True)
    fuente_nombre = serializers.CharField(source='fuente.nombre', read_only=True)

    # Campos calculados
    esta_activa = serializers.BooleanField(read_only=True)
    dias_en_pipeline = serializers.IntegerField(read_only=True)

    class Meta:
        model = Oportunidad
        fields = [
            'id', 'codigo', 'nombre', 'cliente', 'cliente_nombre',
            'vendedor', 'vendedor_nombre', 'etapa_actual', 'etapa_nombre', 'etapa_color',
            'fuente', 'fuente_nombre', 'valor_estimado', 'moneda',
            'fecha_creacion', 'fecha_cierre_estimada', 'fecha_cierre_real',
            'probabilidad_cierre', 'esta_activa', 'dias_en_pipeline',
            'created_at', 'updated_at'
        ]


class OportunidadDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de oportunidad"""

    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    vendedor_nombre = serializers.CharField(source='vendedor.get_full_name', read_only=True)
    etapa_nombre = serializers.CharField(source='etapa_actual.nombre', read_only=True)
    etapa_color = serializers.CharField(source='etapa_actual.color', read_only=True)
    fuente_nombre = serializers.CharField(source='fuente.nombre', read_only=True)
    motivo_perdida_nombre = serializers.CharField(source='motivo_perdida.nombre', read_only=True, allow_null=True)

    # Campos calculados
    esta_activa = serializers.BooleanField(read_only=True)
    dias_en_pipeline = serializers.IntegerField(read_only=True)

    # Relaciones anidadas
    seguimientos = SeguimientoOportunidadSerializer(many=True, read_only=True)
    historial_etapas = HistorialEtapaSerializer(many=True, read_only=True)
    cotizaciones_count = serializers.IntegerField(source='cotizaciones.count', read_only=True)

    class Meta:
        model = Oportunidad
        fields = [
            'id', 'codigo', 'nombre', 'cliente', 'cliente_nombre',
            'vendedor', 'vendedor_nombre', 'etapa_actual', 'etapa_nombre', 'etapa_color',
            'fuente', 'fuente_nombre', 'valor_estimado', 'moneda',
            'fecha_creacion', 'fecha_cierre_estimada', 'fecha_cierre_real',
            'probabilidad_cierre', 'motivo_perdida', 'motivo_perdida_nombre',
            'descripcion', 'notas', 'esta_activa', 'dias_en_pipeline',
            'seguimientos', 'historial_etapas', 'cotizaciones_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['codigo', 'empresa', 'probabilidad_cierre', 'created_at', 'updated_at']


class OportunidadCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/editar oportunidades"""

    class Meta:
        model = Oportunidad
        fields = [
            'id', 'nombre', 'cliente', 'vendedor', 'etapa_actual', 'fuente',
            'valor_estimado', 'moneda', 'fecha_cierre_estimada',
            'motivo_perdida', 'descripcion', 'notas'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        """Validaciones de negocio"""

        # Validar fecha de cierre estimada no sea en el pasado
        from django.utils import timezone
        if attrs.get('fecha_cierre_estimada'):
            if attrs['fecha_cierre_estimada'] < timezone.now().date():
                raise serializers.ValidationError({
                    'fecha_cierre_estimada': 'La fecha de cierre estimada no puede ser en el pasado'
                })

        # Si tiene motivo_perdida, debe estar en etapa perdida
        if attrs.get('motivo_perdida'):
            etapa = attrs.get('etapa_actual')
            if etapa and not etapa.es_perdida:
                raise serializers.ValidationError({
                    'motivo_perdida': 'Solo se puede especificar motivo de pérdida en etapas perdidas'
                })

        return attrs


class DetalleCotizacionSerializer(serializers.ModelSerializer):
    """Serializer para detalles de cotización"""

    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = DetalleCotizacion
        fields = [
            'id', 'cotizacion', 'producto', 'producto_nombre',
            'descripcion_producto', 'cantidad', 'unidad_medida',
            'precio_unitario', 'descuento_linea', 'subtotal',
            'orden', 'notas', 'created_at', 'updated_at'
        ]
        read_only_fields = ['empresa', 'subtotal', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Validaciones de detalle"""

        # Si está editando, obtener la instancia actual
        if self.instance:
            producto = attrs.get('producto', self.instance.producto)
            cantidad = attrs.get('cantidad', self.instance.cantidad)
            precio_unitario = attrs.get('precio_unitario', self.instance.precio_unitario)
        else:
            producto = attrs.get('producto')
            cantidad = attrs.get('cantidad')
            precio_unitario = attrs.get('precio_unitario')

        # Copiar descripción del producto si no se proporciona
        if not attrs.get('descripcion_producto') and producto:
            attrs['descripcion_producto'] = producto.nombre

        # Validar cantidad positiva
        if cantidad and cantidad <= 0:
            raise serializers.ValidationError({
                'cantidad': 'La cantidad debe ser mayor a cero'
            })

        # Validar precio no negativo
        if precio_unitario and precio_unitario < 0:
            raise serializers.ValidationError({
                'precio_unitario': 'El precio no puede ser negativo'
            })

        return attrs


class CotizacionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de cotizaciones"""

    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    vendedor_nombre = serializers.CharField(source='vendedor.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    oportunidad_codigo = serializers.CharField(source='oportunidad.codigo', read_only=True, allow_null=True)

    # Campos calculados
    esta_vencida = serializers.BooleanField(read_only=True)
    cantidad_lineas = serializers.IntegerField(source='detalles.count', read_only=True)

    class Meta:
        model = Cotizacion
        fields = [
            'id', 'codigo', 'oportunidad', 'oportunidad_codigo',
            'cliente', 'cliente_nombre', 'vendedor', 'vendedor_nombre',
            'fecha_cotizacion', 'fecha_vencimiento', 'estado', 'estado_display',
            'total', 'esta_vencida', 'cantidad_lineas',
            'created_at', 'updated_at'
        ]


class CotizacionDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de cotización con detalles anidados"""

    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    vendedor_nombre = serializers.CharField(source='vendedor.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    oportunidad_codigo = serializers.CharField(source='oportunidad.codigo', read_only=True, allow_null=True)

    # Campos calculados
    esta_vencida = serializers.BooleanField(read_only=True)

    # Detalles anidados
    detalles = DetalleCotizacionSerializer(many=True, read_only=True)

    class Meta:
        model = Cotizacion
        fields = [
            'id', 'codigo', 'oportunidad', 'oportunidad_codigo',
            'cliente', 'cliente_nombre', 'vendedor', 'vendedor_nombre',
            'fecha_cotizacion', 'fecha_vencimiento', 'dias_validez',
            'estado', 'estado_display', 'subtotal', 'descuento_porcentaje',
            'descuento_valor', 'impuestos', 'total', 'terminos_condiciones',
            'observaciones', 'esta_vencida', 'detalles',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'codigo', 'empresa', 'subtotal', 'descuento_valor',
            'impuestos', 'total', 'created_at', 'updated_at'
        ]


class CotizacionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/editar cotizaciones"""

    detalles = DetalleCotizacionSerializer(many=True, required=False)

    class Meta:
        model = Cotizacion
        fields = [
            'id', 'oportunidad', 'cliente', 'vendedor',
            'fecha_cotizacion', 'dias_validez', 'descuento_porcentaje',
            'terminos_condiciones', 'observaciones', 'detalles'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        """Validaciones de cotización"""

        from django.utils import timezone

        # Validar fecha cotización no en el futuro
        fecha_cotizacion = attrs.get('fecha_cotizacion', timezone.now().date())
        if fecha_cotizacion > timezone.now().date():
            raise serializers.ValidationError({
                'fecha_cotizacion': 'La fecha de cotización no puede ser en el futuro'
            })

        # Validar días de validez
        dias_validez = attrs.get('dias_validez', 15)
        if dias_validez <= 0:
            raise serializers.ValidationError({
                'dias_validez': 'Los días de validez deben ser mayores a cero'
            })

        # Validar descuento
        descuento = attrs.get('descuento_porcentaje', Decimal('0.00'))
        if descuento < 0 or descuento > 100:
            raise serializers.ValidationError({
                'descuento_porcentaje': 'El descuento debe estar entre 0 y 100'
            })

        return attrs

    def create(self, validated_data):
        """Crear cotización con detalles"""

        detalles_data = validated_data.pop('detalles', [])
        cotizacion = Cotizacion.objects.create(**validated_data)

        # Crear detalles
        for i, detalle_data in enumerate(detalles_data):
            detalle_data['orden'] = i + 1
            DetalleCotizacion.objects.create(
                cotizacion=cotizacion,
                empresa=cotizacion.empresa,
                **detalle_data
            )

        # Recalcular totales
        cotizacion.calcular_totales()

        return cotizacion

    def update(self, instance, validated_data):
        """Actualizar cotización"""

        detalles_data = validated_data.pop('detalles', None)

        # Actualizar campos de cotización
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si se proporcionan detalles, reemplazar todos
        if detalles_data is not None:
            # Eliminar detalles existentes
            instance.detalles.all().delete()

            # Crear nuevos detalles
            for i, detalle_data in enumerate(detalles_data):
                detalle_data['orden'] = i + 1
                DetalleCotizacion.objects.create(
                    cotizacion=instance,
                    empresa=instance.empresa,
                    **detalle_data
                )

            # Recalcular totales
            instance.calcular_totales()

        return instance


class CambiarEtapaSerializer(serializers.Serializer):
    """Serializer para cambiar etapa de oportunidad"""

    etapa_nueva = serializers.PrimaryKeyRelatedField(
        queryset=EtapaVenta.objects.filter(activo=True)
    )
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate_etapa_nueva(self, value):
        """Validar que la etapa esté activa"""
        if not value.activo:
            raise serializers.ValidationError("La etapa seleccionada no está activa")
        return value


class CerrarPerdidaSerializer(serializers.Serializer):
    """Serializer para cerrar oportunidad como perdida"""

    motivo_perdida = serializers.PrimaryKeyRelatedField(
        queryset=MotivoPerdida.objects.filter(activo=True)
    )
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate_motivo_perdida(self, value):
        """Validar que el motivo esté activo"""
        if not value.activo:
            raise serializers.ValidationError("El motivo de pérdida seleccionado no está activo")
        return value


class DashboardPipelineSerializer(serializers.Serializer):
    """Serializer para dashboard del pipeline"""

    # Resumen general
    total_oportunidades = serializers.IntegerField()
    total_activas = serializers.IntegerField()
    total_cerradas_ganadas = serializers.IntegerField()
    total_cerradas_perdidas = serializers.IntegerField()

    # Valores
    valor_total_pipeline = serializers.DecimalField(max_digits=15, decimal_places=2)
    valor_ponderado = serializers.DecimalField(max_digits=15, decimal_places=2)
    valor_ganado = serializers.DecimalField(max_digits=15, decimal_places=2)
    valor_perdido = serializers.DecimalField(max_digits=15, decimal_places=2)

    # Tasas
    tasa_conversion = serializers.DecimalField(max_digits=5, decimal_places=2)
    tasa_perdida = serializers.DecimalField(max_digits=5, decimal_places=2)

    # Promedios
    ticket_promedio = serializers.DecimalField(max_digits=15, decimal_places=2)
    dias_promedio_cierre = serializers.IntegerField()

    # Por etapa
    oportunidades_por_etapa = serializers.ListField(child=serializers.DictField())

    # Por fuente
    oportunidades_por_fuente = serializers.ListField(child=serializers.DictField())

    # Motivos de pérdida
    motivos_perdida = serializers.ListField(child=serializers.DictField())
