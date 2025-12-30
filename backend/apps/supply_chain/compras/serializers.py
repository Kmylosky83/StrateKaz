"""
Serializers para Gestión de Compras - Supply Chain
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import (
    EstadoRequisicion, EstadoCotizacion, EstadoOrdenCompra,
    TipoContrato, PrioridadRequisicion, Moneda, EstadoContrato,
    EstadoMaterial, Requisicion, DetalleRequisicion, Cotizacion,
    EvaluacionCotizacion, OrdenCompra, DetalleOrdenCompra,
    Contrato, RecepcionCompra
)
from apps.supply_chain.gestion_proveedores.models import Proveedor
from apps.gestion_estrategica.configuracion.models import EmpresaConfig, SedeEmpresa


# ==============================================================================
# SERIALIZERS DE CATÁLOGOS DINÁMICOS
# ==============================================================================

class EstadoRequisicionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoRequisicion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class EstadoCotizacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoCotizacion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class EstadoOrdenCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoOrdenCompra
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class TipoContratoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoContrato
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PrioridadRequisicionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrioridadRequisicion
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class MonedaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Moneda
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class EstadoContratoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoContrato
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class EstadoMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoMaterial
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


# ==============================================================================
# SERIALIZERS DE DETALLES
# ==============================================================================

class DetalleRequisicionSerializer(serializers.ModelSerializer):
    valor_estimado_total = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = DetalleRequisicion
        fields = [
            'id', 'requisicion', 'producto_servicio', 'descripcion',
            'cantidad', 'unidad_medida', 'especificaciones',
            'precio_estimado', 'valor_estimado_total',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a cero")
        return value

    def validate_precio_estimado(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("El precio estimado no puede ser negativo")
        return value


class DetalleOrdenCompraSerializer(serializers.ModelSerializer):
    cantidad_pendiente = serializers.DecimalField(
        max_digits=12,
        decimal_places=3,
        read_only=True
    )
    porcentaje_recibido = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    esta_completo = serializers.BooleanField(read_only=True)

    class Meta:
        model = DetalleOrdenCompra
        fields = [
            'id', 'orden_compra', 'producto_servicio', 'descripcion',
            'cantidad_solicitada', 'cantidad_recibida', 'unidad_medida',
            'precio_unitario', 'subtotal', 'cantidad_pendiente',
            'porcentaje_recibido', 'esta_completo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['subtotal', 'created_at', 'updated_at']

    def validate_cantidad_solicitada(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad solicitada debe ser mayor a cero")
        return value

    def validate_precio_unitario(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio unitario debe ser mayor a cero")
        return value


# ==============================================================================
# SERIALIZERS PRINCIPALES
# ==============================================================================

class RequisicionListSerializer(serializers.ModelSerializer):
    """Serializer para listar requisiciones (solo campos esenciales)"""
    solicitante_nombre = serializers.CharField(
        source='solicitante.get_full_name',
        read_only=True
    )
    estado_nombre = serializers.CharField(
        source='estado.nombre',
        read_only=True
    )
    estado_color = serializers.CharField(
        source='estado.color_hex',
        read_only=True
    )
    prioridad_nombre = serializers.CharField(
        source='prioridad.nombre',
        read_only=True
    )
    prioridad_color = serializers.CharField(
        source='prioridad.color_hex',
        read_only=True
    )
    esta_aprobada = serializers.BooleanField(read_only=True)
    puede_editar = serializers.BooleanField(read_only=True)

    class Meta:
        model = Requisicion
        fields = [
            'id', 'codigo', 'fecha_solicitud', 'fecha_requerida',
            'area_solicitante', 'solicitante', 'solicitante_nombre',
            'estado', 'estado_nombre', 'estado_color',
            'prioridad', 'prioridad_nombre', 'prioridad_color',
            'esta_aprobada', 'puede_editar', 'created_at'
        ]


class RequisicionSerializer(serializers.ModelSerializer):
    """Serializer completo para requisiciones"""
    detalles = DetalleRequisicionSerializer(many=True, read_only=True)
    solicitante_nombre = serializers.CharField(
        source='solicitante.get_full_name',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True
    )
    estado_nombre = serializers.CharField(
        source='estado.nombre',
        read_only=True
    )
    prioridad_nombre = serializers.CharField(
        source='prioridad.nombre',
        read_only=True
    )
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )
    sede_nombre = serializers.CharField(
        source='sede.nombre',
        read_only=True
    )
    esta_aprobada = serializers.BooleanField(read_only=True)
    puede_editar = serializers.BooleanField(read_only=True)
    tiene_cotizaciones = serializers.BooleanField(read_only=True)
    tiene_orden_compra = serializers.BooleanField(read_only=True)

    class Meta:
        model = Requisicion
        fields = [
            'id', 'codigo', 'empresa', 'empresa_nombre', 'sede', 'sede_nombre',
            'solicitante', 'solicitante_nombre', 'area_solicitante',
            'fecha_solicitud', 'fecha_requerida', 'justificacion',
            'estado', 'estado_nombre', 'prioridad', 'prioridad_nombre',
            'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'observaciones', 'detalles', 'esta_aprobada', 'puede_editar',
            'tiene_cotizaciones', 'tiene_orden_compra',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'codigo', 'fecha_solicitud', 'solicitante',
            'aprobado_por', 'fecha_aprobacion',
            'created_by', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        validated_data['solicitante'] = self.context['request'].user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class RequisicionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar requisiciones con detalles"""
    detalles = DetalleRequisicionSerializer(many=True)

    class Meta:
        model = Requisicion
        fields = [
            'empresa', 'sede', 'area_solicitante', 'fecha_requerida',
            'justificacion', 'estado', 'prioridad', 'observaciones', 'detalles'
        ]

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        validated_data['solicitante'] = self.context['request'].user
        validated_data['created_by'] = self.context['request'].user

        requisicion = Requisicion.objects.create(**validated_data)

        for detalle_data in detalles_data:
            DetalleRequisicion.objects.create(requisicion=requisicion, **detalle_data)

        return requisicion

    def update(self, instance, validated_data):
        detalles_data = validated_data.pop('detalles', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if detalles_data is not None:
            instance.detalles.all().delete()
            for detalle_data in detalles_data:
                DetalleRequisicion.objects.create(requisicion=instance, **detalle_data)

        return instance


class CotizacionListSerializer(serializers.ModelSerializer):
    """Serializer para listar cotizaciones"""
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial',
        read_only=True
    )
    estado_nombre = serializers.CharField(
        source='estado.nombre',
        read_only=True
    )
    estado_color = serializers.CharField(
        source='estado.color_hex',
        read_only=True
    )
    moneda_simbolo = serializers.CharField(
        source='moneda.simbolo',
        read_only=True
    )
    esta_vigente = serializers.BooleanField(read_only=True)
    tiene_evaluacion = serializers.BooleanField(read_only=True)

    class Meta:
        model = Cotizacion
        fields = [
            'id', 'numero_cotizacion', 'fecha_cotizacion', 'fecha_vencimiento',
            'proveedor', 'proveedor_nombre', 'estado', 'estado_nombre',
            'estado_color', 'moneda', 'moneda_simbolo', 'total',
            'esta_vigente', 'tiene_evaluacion', 'created_at'
        ]


class CotizacionSerializer(serializers.ModelSerializer):
    """Serializer completo para cotizaciones"""
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial',
        read_only=True
    )
    estado_nombre = serializers.CharField(
        source='estado.nombre',
        read_only=True
    )
    moneda_nombre = serializers.CharField(
        source='moneda.nombre',
        read_only=True
    )
    requisicion_codigo = serializers.CharField(
        source='requisicion.codigo',
        read_only=True
    )
    esta_vigente = serializers.BooleanField(read_only=True)
    tiene_evaluacion = serializers.BooleanField(read_only=True)
    puede_evaluar = serializers.BooleanField(read_only=True)

    class Meta:
        model = Cotizacion
        fields = [
            'id', 'requisicion', 'requisicion_codigo', 'proveedor',
            'proveedor_nombre', 'numero_cotizacion', 'fecha_cotizacion',
            'fecha_vencimiento', 'moneda', 'moneda_nombre', 'subtotal',
            'impuestos', 'total', 'tiempo_entrega_dias', 'condiciones_pago',
            'archivo_cotizacion', 'estado', 'estado_nombre', 'observaciones',
            'esta_vigente', 'tiene_evaluacion', 'puede_evaluar',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['total', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class EvaluacionCotizacionSerializer(serializers.ModelSerializer):
    """Serializer para evaluación de cotizaciones"""
    cotizacion_numero = serializers.CharField(
        source='cotizacion.numero_cotizacion',
        read_only=True
    )
    evaluado_por_nombre = serializers.CharField(
        source='evaluado_por.get_full_name',
        read_only=True
    )

    class Meta:
        model = EvaluacionCotizacion
        fields = [
            'id', 'cotizacion', 'cotizacion_numero', 'evaluado_por',
            'evaluado_por_nombre', 'fecha_evaluacion', 'criterios_evaluacion',
            'puntaje_total', 'recomendacion', 'observaciones',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'puntaje_total', 'evaluado_por', 'fecha_evaluacion',
            'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        validated_data['evaluado_por'] = self.context['request'].user
        return super().create(validated_data)

    def validate_criterios_evaluacion(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Los criterios deben ser un objeto JSON")
        return value


class OrdenCompraListSerializer(serializers.ModelSerializer):
    """Serializer para listar órdenes de compra"""
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial',
        read_only=True
    )
    estado_nombre = serializers.CharField(
        source='estado.nombre',
        read_only=True
    )
    estado_color = serializers.CharField(
        source='estado.color_hex',
        read_only=True
    )
    moneda_simbolo = serializers.CharField(
        source='moneda.simbolo',
        read_only=True
    )
    esta_aprobada = serializers.BooleanField(read_only=True)
    porcentaje_recibido = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = OrdenCompra
        fields = [
            'id', 'numero_orden', 'fecha_orden', 'fecha_entrega_esperada',
            'proveedor', 'proveedor_nombre', 'estado', 'estado_nombre',
            'estado_color', 'moneda', 'moneda_simbolo', 'total',
            'esta_aprobada', 'porcentaje_recibido', 'created_at'
        ]


class OrdenCompraSerializer(serializers.ModelSerializer):
    """Serializer completo para órdenes de compra"""
    detalles = DetalleOrdenCompraSerializer(many=True, read_only=True)
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial',
        read_only=True
    )
    estado_nombre = serializers.CharField(
        source='estado.nombre',
        read_only=True
    )
    moneda_nombre = serializers.CharField(
        source='moneda.nombre',
        read_only=True
    )
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )
    sede_nombre = serializers.CharField(
        source='sede.nombre',
        read_only=True
    )
    requisicion_codigo = serializers.CharField(
        source='requisicion.codigo',
        read_only=True
    )
    cotizacion_numero = serializers.CharField(
        source='cotizacion.numero_cotizacion',
        read_only=True
    )
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True
    )
    esta_aprobada = serializers.BooleanField(read_only=True)
    puede_editar = serializers.BooleanField(read_only=True)
    puede_recibir = serializers.BooleanField(read_only=True)
    porcentaje_recibido = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = OrdenCompra
        fields = [
            'id', 'numero_orden', 'empresa', 'empresa_nombre', 'sede', 'sede_nombre',
            'requisicion', 'requisicion_codigo', 'cotizacion', 'cotizacion_numero',
            'proveedor', 'proveedor_nombre', 'fecha_orden', 'fecha_entrega_esperada',
            'estado', 'estado_nombre', 'moneda', 'moneda_nombre',
            'subtotal', 'impuestos', 'descuento', 'total',
            'condiciones_pago', 'lugar_entrega',
            'creado_por', 'creado_por_nombre', 'aprobado_por', 'aprobado_por_nombre',
            'fecha_aprobacion', 'observaciones', 'detalles',
            'esta_aprobada', 'puede_editar', 'puede_recibir', 'porcentaje_recibido',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'numero_orden', 'fecha_orden', 'total', 'creado_por',
            'aprobado_por', 'fecha_aprobacion', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        validated_data['creado_por'] = self.context['request'].user
        return super().create(validated_data)


class OrdenCompraCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar órdenes con detalles"""
    detalles = DetalleOrdenCompraSerializer(many=True)

    class Meta:
        model = OrdenCompra
        fields = [
            'empresa', 'sede', 'requisicion', 'cotizacion', 'proveedor',
            'fecha_entrega_esperada', 'estado', 'moneda', 'subtotal',
            'impuestos', 'descuento', 'condiciones_pago', 'lugar_entrega',
            'observaciones', 'detalles'
        ]

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        validated_data['creado_por'] = self.context['request'].user

        orden = OrdenCompra.objects.create(**validated_data)

        for detalle_data in detalles_data:
            DetalleOrdenCompra.objects.create(orden_compra=orden, **detalle_data)

        return orden

    def update(self, instance, validated_data):
        detalles_data = validated_data.pop('detalles', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if detalles_data is not None:
            instance.detalles.all().delete()
            for detalle_data in detalles_data:
                DetalleOrdenCompra.objects.create(orden_compra=instance, **detalle_data)

        return instance


class ContratoListSerializer(serializers.ModelSerializer):
    """Serializer para listar contratos"""
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial',
        read_only=True
    )
    tipo_contrato_nombre = serializers.CharField(
        source='tipo_contrato.nombre',
        read_only=True
    )
    estado_nombre = serializers.CharField(
        source='estado.nombre',
        read_only=True
    )
    estado_color = serializers.CharField(
        source='estado.color_hex',
        read_only=True
    )
    esta_vigente = serializers.BooleanField(read_only=True)

    class Meta:
        model = Contrato
        fields = [
            'id', 'numero_contrato', 'proveedor', 'proveedor_nombre',
            'tipo_contrato', 'tipo_contrato_nombre', 'fecha_inicio',
            'fecha_fin', 'valor_total', 'estado', 'estado_nombre',
            'estado_color', 'esta_vigente', 'created_at'
        ]


class ContratoSerializer(serializers.ModelSerializer):
    """Serializer completo para contratos"""
    proveedor_nombre = serializers.CharField(
        source='proveedor.nombre_comercial',
        read_only=True
    )
    tipo_contrato_nombre = serializers.CharField(
        source='tipo_contrato.nombre',
        read_only=True
    )
    estado_nombre = serializers.CharField(
        source='estado.nombre',
        read_only=True
    )
    moneda_nombre = serializers.CharField(
        source='moneda.nombre',
        read_only=True
    )
    empresa_nombre = serializers.CharField(
        source='empresa.razon_social',
        read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True
    )
    esta_vigente = serializers.BooleanField(read_only=True)
    dias_restantes = serializers.IntegerField(read_only=True)
    puede_generar_ordenes = serializers.BooleanField(read_only=True)

    class Meta:
        model = Contrato
        fields = [
            'id', 'empresa', 'empresa_nombre', 'proveedor', 'proveedor_nombre',
            'tipo_contrato', 'tipo_contrato_nombre', 'numero_contrato', 'objeto',
            'fecha_inicio', 'fecha_fin', 'valor_total', 'moneda', 'moneda_nombre',
            'condiciones', 'archivo_contrato', 'estado', 'estado_nombre',
            'responsable', 'responsable_nombre', 'observaciones',
            'esta_vigente', 'dias_restantes', 'puede_generar_ordenes',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def validate(self, data):
        if data['fecha_fin'] <= data['fecha_inicio']:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha de finalización debe ser posterior a la fecha de inicio'
            })
        return data


class RecepcionCompraListSerializer(serializers.ModelSerializer):
    """Serializer para listar recepciones"""
    orden_compra_numero = serializers.CharField(
        source='orden_compra.numero_orden',
        read_only=True
    )
    proveedor_nombre = serializers.CharField(
        source='orden_compra.proveedor.nombre_comercial',
        read_only=True
    )
    estado_material_nombre = serializers.CharField(
        source='estado_material.nombre',
        read_only=True
    )
    recibido_por_nombre = serializers.CharField(
        source='recibido_por.get_full_name',
        read_only=True
    )

    class Meta:
        model = RecepcionCompra
        fields = [
            'id', 'orden_compra', 'orden_compra_numero', 'proveedor_nombre',
            'numero_remision', 'fecha_recepcion', 'cantidad_recibida',
            'estado_material', 'estado_material_nombre',
            'recibido_por', 'recibido_por_nombre', 'created_at'
        ]


class RecepcionCompraSerializer(serializers.ModelSerializer):
    """Serializer completo para recepciones"""
    orden_compra_numero = serializers.CharField(
        source='orden_compra.numero_orden',
        read_only=True
    )
    proveedor_nombre = serializers.CharField(
        source='orden_compra.proveedor.nombre_comercial',
        read_only=True
    )
    estado_material_nombre = serializers.CharField(
        source='estado_material.nombre',
        read_only=True
    )
    recibido_por_nombre = serializers.CharField(
        source='recibido_por.get_full_name',
        read_only=True
    )
    material_conforme = serializers.BooleanField(read_only=True)
    requiere_accion = serializers.BooleanField(read_only=True)

    class Meta:
        model = RecepcionCompra
        fields = [
            'id', 'orden_compra', 'orden_compra_numero', 'proveedor_nombre',
            'numero_remision', 'fecha_recepcion', 'recibido_por',
            'recibido_por_nombre', 'cantidad_recibida', 'estado_material',
            'estado_material_nombre', 'observaciones',
            'genera_movimiento_inventario', 'numero_movimiento_inventario',
            'material_conforme', 'requiere_accion',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'recibido_por', 'numero_movimiento_inventario',
            'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        validated_data['recibido_por'] = self.context['request'].user
        return super().create(validated_data)

    def validate_cantidad_recibida(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad recibida debe ser mayor a cero")
        return value
