# -*- coding: utf-8 -*-
"""
Serializers del modulo Recepciones - Sistema de Gestion Grasas y Huesos del Norte
"""
from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from .models import RecepcionMateriaPrima, RecepcionDetalle
from apps.recolecciones.models import Recoleccion
from apps.core.models import User


class RecepcionDetalleSerializer(serializers.ModelSerializer):
    """
    Serializer para los detalles de cada recoleccion en la recepcion
    """

    # Datos de la recoleccion asociada
    recoleccion_codigo = serializers.CharField(source='recoleccion.codigo_voucher', read_only=True)
    ecoaliado_nombre = serializers.CharField(source='recoleccion.ecoaliado.razon_social', read_only=True)
    ecoaliado_codigo = serializers.CharField(source='recoleccion.ecoaliado.codigo', read_only=True)
    tiene_merma_aplicada = serializers.BooleanField(read_only=True)
    diferencia_valor = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = RecepcionDetalle
        fields = [
            'id',
            'recepcion',
            'recoleccion',
            'recoleccion_codigo',
            'ecoaliado_nombre',
            'ecoaliado_codigo',
            # Datos esperados
            'peso_esperado_kg',
            'precio_esperado_kg',
            'valor_esperado',
            # Datos reales (despues de merma)
            'peso_real_kg',
            'merma_kg',
            'porcentaje_merma',
            'precio_real_kg',
            'valor_real',
            # Proporcion en el lote
            'proporcion_lote',
            # Propiedades calculadas
            'tiene_merma_aplicada',
            'diferencia_valor',
            # Observaciones
            'observaciones',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'peso_real_kg',
            'merma_kg',
            'porcentaje_merma',
            'precio_real_kg',
            'valor_real',
            'proporcion_lote',
        ]


class RecepcionListSerializer(serializers.ModelSerializer):
    """
    Serializer para listado de recepciones
    Campos basicos para visualizacion rapida
    Soporta ambos origenes: UNIDAD_INTERNA y PROVEEDOR_EXTERNO
    """

    # Campos de origen
    origen_recepcion_display = serializers.CharField(source='get_origen_recepcion_display', read_only=True)
    tipo_materia_prima_display = serializers.CharField(source='get_tipo_materia_prima_display', read_only=True)
    nombre_origen = serializers.CharField(read_only=True)

    # Campos de recolector (solo UNIDAD_INTERNA)
    recolector_nombre = serializers.SerializerMethodField()

    # Campos de proveedor externo (solo PROVEEDOR_EXTERNO)
    proveedor_externo_nombre = serializers.SerializerMethodField()

    recibido_por_nombre = serializers.CharField(source='recibido_por.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Propiedades
    is_deleted = serializers.BooleanField(read_only=True)
    es_unidad_interna = serializers.BooleanField(read_only=True)
    es_proveedor_externo = serializers.BooleanField(read_only=True)
    requiere_prueba_acidez = serializers.BooleanField(read_only=True)
    tiene_prueba_acidez = serializers.BooleanField(read_only=True)
    puede_pesar = serializers.BooleanField(read_only=True)
    puede_confirmar = serializers.BooleanField(read_only=True)
    puede_pasar_standby = serializers.BooleanField(read_only=True)
    puede_cancelar = serializers.BooleanField(read_only=True)
    es_editable = serializers.BooleanField(read_only=True)

    def get_recolector_nombre(self, obj):
        if obj.recolector:
            return obj.recolector.get_full_name()
        return None

    def get_proveedor_externo_nombre(self, obj):
        if obj.proveedor_externo:
            return obj.proveedor_externo.nombre_comercial
        return None

    class Meta:
        model = RecepcionMateriaPrima
        fields = [
            'id',
            'codigo_recepcion',
            # Origen
            'origen_recepcion',
            'origen_recepcion_display',
            'tipo_materia_prima',
            'tipo_materia_prima_display',
            'nombre_origen',
            # Recolector (UNIDAD_INTERNA)
            'recolector',
            'recolector_nombre',
            # Proveedor (PROVEEDOR_EXTERNO)
            'proveedor_externo',
            'proveedor_externo_nombre',
            # Usuario que recibe
            'recibido_por',
            'recibido_por_nombre',
            # Fechas
            'fecha_recepcion',
            'fecha_pesaje',
            'fecha_confirmacion',
            # Pesos
            'peso_esperado_kg',
            'peso_real_kg',
            'usa_peso_externo',
            'peso_externo_kg',
            'merma_kg',
            'porcentaje_merma',
            'cantidad_recolecciones',
            # Valores
            'valor_esperado_total',
            'valor_real_total',
            # Estado
            'estado',
            'estado_display',
            'is_deleted',
            # Propiedades
            'es_unidad_interna',
            'es_proveedor_externo',
            'requiere_prueba_acidez',
            'tiene_prueba_acidez',
            'puede_pesar',
            'puede_confirmar',
            'puede_pasar_standby',
            'puede_cancelar',
            'es_editable',
            'created_at',
        ]


class RecepcionDetailSerializer(serializers.ModelSerializer):
    """
    Serializer para detalle completo de recepcion
    Incluye todos los detalles de recolecciones anidados
    Soporta ambos origenes: UNIDAD_INTERNA y PROVEEDOR_EXTERNO
    """

    # Campos de origen
    origen_recepcion_display = serializers.CharField(source='get_origen_recepcion_display', read_only=True)
    tipo_materia_prima_display = serializers.CharField(source='get_tipo_materia_prima_display', read_only=True)
    nombre_origen = serializers.CharField(read_only=True)

    # Campos de recolector (solo UNIDAD_INTERNA)
    recolector_nombre = serializers.SerializerMethodField()
    recolector_documento = serializers.SerializerMethodField()

    # Campos de proveedor externo (solo PROVEEDOR_EXTERNO)
    proveedor_externo_nombre = serializers.SerializerMethodField()
    proveedor_externo_documento = serializers.SerializerMethodField()

    # Prueba de acidez (si aplica)
    prueba_acidez_detalle = serializers.SerializerMethodField()

    recibido_por_nombre = serializers.CharField(source='recibido_por.get_full_name', read_only=True)
    created_by_nombre = serializers.SerializerMethodField()
    cancelado_por_nombre = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Detalles anidados (solo UNIDAD_INTERNA)
    detalles = RecepcionDetalleSerializer(many=True, read_only=True)

    # Propiedades
    is_deleted = serializers.BooleanField(read_only=True)
    es_unidad_interna = serializers.BooleanField(read_only=True)
    es_proveedor_externo = serializers.BooleanField(read_only=True)
    requiere_prueba_acidez = serializers.BooleanField(read_only=True)
    tiene_prueba_acidez = serializers.BooleanField(read_only=True)
    puede_pesar = serializers.BooleanField(read_only=True)
    puede_confirmar = serializers.BooleanField(read_only=True)
    puede_pasar_standby = serializers.BooleanField(read_only=True)
    puede_cancelar = serializers.BooleanField(read_only=True)
    es_editable = serializers.BooleanField(read_only=True)

    def get_recolector_nombre(self, obj):
        if obj.recolector:
            return obj.recolector.get_full_name()
        return None

    def get_recolector_documento(self, obj):
        if obj.recolector:
            return getattr(obj.recolector, 'document_number', None)
        return None

    def get_proveedor_externo_nombre(self, obj):
        if obj.proveedor_externo:
            return obj.proveedor_externo.nombre_comercial
        return None

    def get_proveedor_externo_documento(self, obj):
        if obj.proveedor_externo:
            return obj.proveedor_externo.numero_documento
        return None

    def get_prueba_acidez_detalle(self, obj):
        if obj.prueba_acidez:
            return {
                'id': obj.prueba_acidez.id,
                'codigo_voucher': obj.prueba_acidez.codigo_voucher,
                'valor_acidez': str(obj.prueba_acidez.valor_acidez),
                'calidad_resultante': obj.prueba_acidez.calidad_resultante,
                'codigo_materia': obj.prueba_acidez.codigo_materia,
                'fecha_prueba': obj.prueba_acidez.fecha_prueba,
            }
        return None

    def get_created_by_nombre(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None

    def get_cancelado_por_nombre(self, obj):
        if obj.cancelado_por:
            return obj.cancelado_por.get_full_name()
        return None

    class Meta:
        model = RecepcionMateriaPrima
        fields = [
            'id',
            'codigo_recepcion',
            # Origen
            'origen_recepcion',
            'origen_recepcion_display',
            'tipo_materia_prima',
            'tipo_materia_prima_display',
            'nombre_origen',
            # Relaciones - Recolector (UNIDAD_INTERNA)
            'recolector',
            'recolector_nombre',
            'recolector_documento',
            # Relaciones - Proveedor (PROVEEDOR_EXTERNO)
            'proveedor_externo',
            'proveedor_externo_nombre',
            'proveedor_externo_documento',
            # Prueba de acidez
            'prueba_acidez',
            'prueba_acidez_detalle',
            # Usuario que recibe
            'recibido_por',
            'recibido_por_nombre',
            # Fechas
            'fecha_recepcion',
            'fecha_pesaje',
            'fecha_confirmacion',
            # Pesos y calculos
            'peso_esperado_kg',
            'peso_real_kg',
            'usa_peso_externo',
            'peso_externo_kg',
            'numero_certificado_peso',
            'merma_kg',
            'porcentaje_merma',
            'cantidad_recolecciones',
            # Valores monetarios
            'valor_esperado_total',
            'valor_real_total',
            # Estado
            'estado',
            'estado_display',
            # Informacion adicional
            'observaciones_recepcion',
            'observaciones_merma',
            'numero_ticket_bascula',
            'tanque_destino',
            # Cancelacion
            'motivo_cancelacion',
            'cancelado_por',
            'cancelado_por_nombre',
            'fecha_cancelacion',
            # Detalles (solo UNIDAD_INTERNA)
            'detalles',
            # Propiedades
            'is_deleted',
            'es_unidad_interna',
            'es_proveedor_externo',
            'requiere_prueba_acidez',
            'tiene_prueba_acidez',
            'puede_pesar',
            'puede_confirmar',
            'puede_pasar_standby',
            'puede_cancelar',
            'es_editable',
            # Auditoria
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
            'deleted_at',
        ]


class IniciarRecepcionSerializer(serializers.Serializer):
    """
    Serializer para crear nueva recepcion agrupando varias recolecciones

    Flujo:
    1. Recolector llega a planta con N recolecciones
    2. Se seleccionan las recolecciones a incluir
    3. Se crea la recepcion en estado INICIADA
    4. Sistema calcula peso esperado (suma de recolecciones)
    5. Siguiente paso: registrar pesaje en bascula
    """

    recolector_id = serializers.IntegerField(
        help_text='ID del recolector que entrega el material'
    )
    recoleccion_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text='Lista de IDs de recolecciones a incluir en la recepcion'
    )
    observaciones_recepcion = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text='Observaciones sobre el estado del material o condiciones de entrega'
    )

    def validate_recolector_id(self, value):
        """Valida que el recolector exista y tenga cargo correcto"""
        try:
            recolector = User.objects.select_related('cargo').get(
                pk=value,
                is_active=True,
                cargo__code='recolector_econorte'
            )
        except User.DoesNotExist:
            raise serializers.ValidationError(
                'El recolector no existe o no tiene el cargo de Recolector Econorte'
            )

        self.context['recolector'] = recolector
        return value

    def validate_recoleccion_ids(self, value):
        """Valida que las recolecciones existan y no esten ya recibidas"""
        if not value:
            raise serializers.ValidationError('Debe seleccionar al menos una recoleccion')

        # Obtener recolecciones
        recolecciones = Recoleccion.objects.filter(
            id__in=value,
            deleted_at__isnull=True
        ).select_related('ecoaliado', 'recolector')

        # Verificar que todas existan
        if recolecciones.count() != len(value):
            raise serializers.ValidationError(
                'Algunas recolecciones no existen o fueron eliminadas'
            )

        # Verificar que ninguna este ya en una recepcion activa
        ya_recibidas = []
        for rec in recolecciones:
            if hasattr(rec, 'detalle_recepcion'):
                detalle = rec.detalle_recepcion
                if detalle.recepcion.estado != 'CANCELADA':
                    ya_recibidas.append(rec.codigo_voucher)

        if ya_recibidas:
            raise serializers.ValidationError(
                f'Las siguientes recolecciones ya estan en una recepcion: {", ".join(ya_recibidas)}'
            )

        self.context['recolecciones'] = list(recolecciones)
        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        recolector = self.context.get('recolector')
        recolecciones = self.context.get('recolecciones')
        usuario = self.context.get('usuario')

        if not recolector or not recolecciones:
            raise serializers.ValidationError('Datos incompletos para iniciar recepcion')

        if not usuario:
            raise serializers.ValidationError('Usuario no autenticado')

        # Verificar que todas las recolecciones sean del mismo recolector
        recolectores_diferentes = set(r.recolector_id for r in recolecciones)
        if len(recolectores_diferentes) > 1:
            raise serializers.ValidationError(
                'Todas las recolecciones deben ser del mismo recolector'
            )

        # Verificar que el recolector de las recolecciones coincida con el indicado
        if recolecciones[0].recolector_id != recolector.id:
            raise serializers.ValidationError(
                f'Las recolecciones no pertenecen al recolector {recolector.get_full_name()}'
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        """
        Crea la recepcion y los detalles de cada recoleccion
        """
        recolector = self.context['recolector']
        recolecciones = self.context['recolecciones']
        usuario = self.context['usuario']

        # Calcular peso y valor esperado total
        peso_esperado = sum(Decimal(str(r.cantidad_kg)) for r in recolecciones)
        valor_esperado = sum(Decimal(str(r.valor_total)) for r in recolecciones)

        # Crear recepcion
        recepcion = RecepcionMateriaPrima.objects.create(
            recolector=recolector,
            recibido_por=usuario,
            fecha_recepcion=timezone.now(),
            peso_esperado_kg=peso_esperado,
            valor_esperado_total=valor_esperado,
            cantidad_recolecciones=len(recolecciones),
            observaciones_recepcion=validated_data.get('observaciones_recepcion', ''),
            estado='INICIADA',
            created_by=usuario,
        )

        # Crear detalles por cada recoleccion
        for recoleccion in recolecciones:
            RecepcionDetalle.objects.create(
                recepcion=recepcion,
                recoleccion=recoleccion,
                peso_esperado_kg=recoleccion.cantidad_kg,
                precio_esperado_kg=recoleccion.precio_kg,
                valor_esperado=recoleccion.valor_total,
            )

        return recepcion


class RegistrarPesajeSerializer(serializers.Serializer):
    """
    Serializer para registrar el peso en bascula

    Flujo:
    1. Recepcion en estado INICIADA
    2. Material se pesa en bascula de planta
    3. Se registra peso real
    4. Sistema calcula merma automaticamente
    5. Estado cambia a PESADA
    """

    peso_real_kg = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
        help_text='Peso real medido en bascula de la planta'
    )
    numero_ticket_bascula = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=50,
        help_text='Numero del ticket de pesaje de la bascula'
    )
    observaciones_merma = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text='Observaciones sobre la merma detectada'
    )

    def validate_peso_real_kg(self, value):
        """Valida que el peso sea positivo y razonable"""
        if value <= 0:
            raise serializers.ValidationError('El peso debe ser mayor a 0')

        # Obtener recepcion del contexto
        recepcion = self.context.get('recepcion')
        if recepcion:
            # Validar que no exceda el esperado en mas del 10%
            margen_aceptable = Decimal('0.10')  # 10%
            peso_maximo = recepcion.peso_esperado_kg * (Decimal('1.00') + margen_aceptable)

            if value > peso_maximo:
                raise serializers.ValidationError(
                    f'El peso real ({value} kg) no puede exceder el esperado '
                    f'({recepcion.peso_esperado_kg} kg) en mas del {margen_aceptable*100}%'
                )

        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        recepcion = self.context.get('recepcion')

        if not recepcion:
            raise serializers.ValidationError('Recepcion no encontrada')

        if not recepcion.puede_pesar:
            raise serializers.ValidationError(
                f'La recepcion no puede ser pesada. Estado actual: {recepcion.get_estado_display()}'
            )

        return attrs

    def update(self, recepcion, validated_data):
        """
        Actualiza la recepcion registrando el pesaje
        """
        peso_bascula = validated_data['peso_real_kg']
        numero_ticket = validated_data.get('numero_ticket_bascula')
        observaciones = validated_data.get('observaciones_merma')

        # Llamar al metodo del modelo que maneja la logica de pesaje
        recepcion.registrar_pesaje(
            peso_bascula=peso_bascula,
            numero_ticket=numero_ticket,
            observaciones=observaciones
        )

        return recepcion


class ConfirmarRecepcionSerializer(serializers.Serializer):
    """
    Serializer para confirmar la recepcion y aplicar prorrateo de merma

    Flujo:
    1. Recepcion en estado PESADA
    2. Se confirma la recepcion
    3. Sistema aplica prorrateo ponderado de merma a cada recoleccion
    4. Se actualizan pesos y valores reales
    5. Recolecciones quedan marcadas con merma aplicada
    6. Estado cambia a CONFIRMADA
    7. Producto pasa al tanque de ACU
    """

    tanque_destino = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=50,
        help_text='Identificador del tanque de ACU donde se almacena'
    )

    def validate(self, attrs):
        """Validaciones"""
        recepcion = self.context.get('recepcion')

        if not recepcion:
            raise serializers.ValidationError('Recepcion no encontrada')

        if not recepcion.puede_confirmar:
            raise serializers.ValidationError(
                f'La recepcion no puede ser confirmada. Estado actual: {recepcion.get_estado_display()}'
            )

        return attrs

    @transaction.atomic
    def update(self, recepcion, validated_data):
        """
        Confirma la recepcion aplicando el prorrateo de merma
        """
        # Actualizar tanque destino si se proporciono
        if validated_data.get('tanque_destino'):
            recepcion.tanque_destino = validated_data['tanque_destino']
            recepcion.save(update_fields=['tanque_destino'])

        # Llamar al metodo del modelo que aplica el prorrateo
        recepcion.confirmar_recepcion()

        return recepcion


class CancelarRecepcionSerializer(serializers.Serializer):
    """
    Serializer para cancelar una recepcion

    Puede cancelarse si esta en estado INICIADA o PESADA
    No se puede cancelar si ya esta CONFIRMADA
    """

    motivo_cancelacion = serializers.CharField(
        required=True,
        max_length=1000,
        help_text='Razon por la cual se cancela la recepcion'
    )

    def validate_motivo_cancelacion(self, value):
        """Valida que se proporcione un motivo"""
        if not value or not value.strip():
            raise serializers.ValidationError('Debe proporcionar un motivo de cancelacion')
        return value.strip()

    def validate(self, attrs):
        """Validaciones"""
        recepcion = self.context.get('recepcion')
        usuario = self.context.get('usuario')

        if not recepcion:
            raise serializers.ValidationError('Recepcion no encontrada')

        if not usuario:
            raise serializers.ValidationError('Usuario no autenticado')

        if not recepcion.puede_cancelar:
            raise serializers.ValidationError(
                f'La recepcion no puede ser cancelada. Estado actual: {recepcion.get_estado_display()}'
            )

        return attrs

    def update(self, recepcion, validated_data):
        """
        Cancela la recepcion
        """
        usuario = self.context['usuario']
        motivo = validated_data['motivo_cancelacion']

        # Llamar al metodo del modelo
        recepcion.cancelar(usuario=usuario, motivo=motivo)

        return recepcion


class RecepcionEstadisticasSerializer(serializers.Serializer):
    """Serializer para estadisticas de recepciones"""

    total_recepciones = serializers.IntegerField()
    recepciones_por_estado = serializers.DictField(child=serializers.IntegerField())
    total_kg_esperados = serializers.DecimalField(max_digits=15, decimal_places=2, allow_null=True)
    total_kg_recibidos = serializers.DecimalField(max_digits=15, decimal_places=2, allow_null=True)
    merma_total_kg = serializers.DecimalField(max_digits=15, decimal_places=2, allow_null=True)
    porcentaje_merma_promedio = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    total_recolecciones_recibidas = serializers.IntegerField(allow_null=True)
    total_valor_esperado = serializers.DecimalField(max_digits=15, decimal_places=2, allow_null=True)
    total_valor_real = serializers.DecimalField(max_digits=15, decimal_places=2, allow_null=True)
    recepciones_hoy = serializers.IntegerField()
    recepciones_semana = serializers.IntegerField()
    recepciones_mes = serializers.IntegerField()


class RecepcionResumenSerializer(serializers.Serializer):
    """
    Serializer para resumen de recepcion antes de confirmar
    Muestra el impacto del prorrateo de merma
    """

    recepcion_id = serializers.IntegerField()
    codigo_recepcion = serializers.CharField()
    estado = serializers.CharField()
    peso_esperado_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    peso_real_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    merma_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    porcentaje_merma = serializers.DecimalField(max_digits=5, decimal_places=2)
    cantidad_recolecciones = serializers.IntegerField()
    valor_esperado_total = serializers.DecimalField(max_digits=12, decimal_places=2)

    # Impacto por detalle
    detalles_impacto = serializers.ListField(
        child=serializers.DictField(),
        help_text='Lista con el impacto de la merma en cada recoleccion'
    )


class RecoleccionPendienteSerializer(serializers.Serializer):
    """
    Serializer para recolecciones pendientes de recepcion
    Usado en el endpoint GET /api/recepciones/pendientes/

    IMPORTANTE: Estructura anidada que coincide con el tipo del frontend
    """

    id = serializers.IntegerField()
    codigo_voucher = serializers.CharField()
    fecha_recoleccion = serializers.DateTimeField()
    cantidad_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    precio_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    valor_total = serializers.DecimalField(max_digits=12, decimal_places=2)

    # Ecoaliado - estructura anidada para coincidir con frontend
    ecoaliado = serializers.SerializerMethodField()
    # Recolector - estructura anidada para coincidir con frontend
    recolector = serializers.SerializerMethodField()

    def get_ecoaliado(self, obj):
        """Retorna objeto ecoaliado con estructura esperada por el frontend"""
        if obj.ecoaliado:
            return {
                'id': obj.ecoaliado.id,
                'codigo': obj.ecoaliado.codigo,
                'razon_social': obj.ecoaliado.razon_social,
            }
        return None

    def get_recolector(self, obj):
        """Retorna objeto recolector con estructura esperada por el frontend"""
        if obj.recolector:
            return {
                'id': obj.recolector.id,
                'nombre_completo': obj.recolector.get_full_name(),
            }
        return None


class IniciarRecepcionProveedorExternoSerializer(serializers.Serializer):
    """
    Serializer para crear recepcion de PROVEEDOR_EXTERNO

    Flujo:
    1. Seleccionar proveedor externo
    2. Seleccionar tipo de materia prima
    3. Si ACU o SEBO_PROCESADO → Registrar prueba de acidez (opcional al inicio)
    4. Indicar peso esperado o usar peso externo
    5. Se crea la recepcion en estado INICIADA
    """

    proveedor_id = serializers.IntegerField(
        help_text='ID del proveedor externo que entrega el material'
    )
    tipo_materia_prima = serializers.CharField(
        max_length=25,
        help_text='Codigo de tipo de materia prima (ej: HUESO_CRUDO, ACU, SEBO_PROCESADO)'
    )
    peso_esperado_kg = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text='Peso esperado declarado por el proveedor'
    )
    usa_peso_externo = serializers.BooleanField(
        default=False,
        help_text='Si el proveedor trae peso certificado de bascula externa'
    )
    peso_externo_kg = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text='Peso certificado por bascula externa'
    )
    numero_certificado_peso = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        help_text='Numero del certificado de la bascula externa'
    )
    observaciones_recepcion = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text='Observaciones sobre el material o condiciones de entrega'
    )

    def validate_proveedor_id(self, value):
        """Valida que el proveedor exista y sea de materia prima"""
        from apps.proveedores.models import Proveedor

        try:
            proveedor = Proveedor.objects.get(
                pk=value,
                is_active=True,
                deleted_at__isnull=True,
                tipo_proveedor='MATERIA_PRIMA_EXTERNO'
            )
        except Proveedor.DoesNotExist:
            raise serializers.ValidationError(
                'El proveedor no existe o no es un proveedor de materia prima'
            )

        self.context['proveedor'] = proveedor
        return value

    def validate_tipo_materia_prima(self, value):
        """Valida que el tipo de materia prima sea valido"""
        from apps.proveedores.constants import CODIGOS_MATERIA_PRIMA_VALIDOS

        if value not in CODIGOS_MATERIA_PRIMA_VALIDOS:
            raise serializers.ValidationError(
                f'Codigo de materia prima "{value}" no es valido'
            )
        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        proveedor = self.context.get('proveedor')
        usuario = self.context.get('usuario')

        if not proveedor:
            raise serializers.ValidationError('Proveedor no encontrado')

        if not usuario:
            raise serializers.ValidationError('Usuario no autenticado')

        # Validar peso externo
        if attrs.get('usa_peso_externo'):
            if not attrs.get('peso_externo_kg'):
                raise serializers.ValidationError({
                    'peso_externo_kg': 'Si usa peso externo, debe especificar el peso certificado'
                })
            if not attrs.get('numero_certificado_peso'):
                raise serializers.ValidationError({
                    'numero_certificado_peso': 'Si usa peso externo, debe especificar el numero de certificado'
                })
        else:
            if not attrs.get('peso_esperado_kg'):
                raise serializers.ValidationError({
                    'peso_esperado_kg': 'Debe especificar el peso esperado'
                })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        """
        Crea la recepcion de proveedor externo
        """
        proveedor = self.context['proveedor']
        usuario = self.context['usuario']

        usa_peso_externo = validated_data.get('usa_peso_externo', False)

        # Determinar peso esperado
        if usa_peso_externo:
            peso_esperado = validated_data['peso_externo_kg']
        else:
            peso_esperado = validated_data['peso_esperado_kg']

        # Crear recepcion
        recepcion = RecepcionMateriaPrima.objects.create(
            origen_recepcion='PROVEEDOR_EXTERNO',
            proveedor_externo=proveedor,
            tipo_materia_prima=validated_data['tipo_materia_prima'],
            recibido_por=usuario,
            fecha_recepcion=timezone.now(),
            peso_esperado_kg=peso_esperado,
            usa_peso_externo=usa_peso_externo,
            peso_externo_kg=validated_data.get('peso_externo_kg'),
            numero_certificado_peso=validated_data.get('numero_certificado_peso', ''),
            cantidad_recolecciones=0,  # No tiene recolecciones
            observaciones_recepcion=validated_data.get('observaciones_recepcion', ''),
            estado='INICIADA',
            created_by=usuario,
        )

        return recepcion


class AsociarPruebaAcidezSerializer(serializers.Serializer):
    """
    Serializer para asociar una prueba de acidez a una recepcion

    Se usa para ACU y SEBO_PROCESADO antes de pesar
    """

    prueba_acidez_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='ID de una prueba de acidez existente'
    )

    # Datos para crear prueba de acidez nueva
    crear_prueba = serializers.BooleanField(
        default=False,
        help_text='Si se debe crear una nueva prueba de acidez'
    )
    valor_acidez = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
        help_text='Porcentaje de acidez medido en la prueba'
    )
    cantidad_kg = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text='Cantidad de kg del material (para prueba de acidez)'
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text='Observaciones de la prueba'
    )

    def validate(self, attrs):
        """Validaciones"""
        recepcion = self.context.get('recepcion')
        usuario = self.context.get('usuario')

        if not recepcion:
            raise serializers.ValidationError('Recepcion no encontrada')

        if not usuario:
            raise serializers.ValidationError('Usuario no autenticado')

        if not recepcion.requiere_prueba_acidez:
            raise serializers.ValidationError(
                'Esta recepcion no requiere prueba de acidez'
            )

        if recepcion.tiene_prueba_acidez:
            raise serializers.ValidationError(
                'La recepcion ya tiene una prueba de acidez asociada'
            )

        if attrs.get('crear_prueba'):
            if not attrs.get('valor_acidez'):
                raise serializers.ValidationError({
                    'valor_acidez': 'Debe especificar el valor de acidez'
                })

        return attrs

    @transaction.atomic
    def update(self, recepcion, validated_data):
        """
        Asocia o crea una prueba de acidez para la recepcion
        """
        from apps.proveedores.models import PruebaAcidez

        usuario = self.context['usuario']

        if validated_data.get('crear_prueba'):
            # Crear nueva prueba de acidez
            prueba = PruebaAcidez.objects.create(
                proveedor=recepcion.proveedor_externo,
                fecha_prueba=timezone.now(),
                valor_acidez=validated_data['valor_acidez'],
                cantidad_kg=validated_data.get('cantidad_kg', recepcion.peso_esperado_kg),
                observaciones=validated_data.get('observaciones', ''),
                realizado_por=usuario,
            )
            recepcion.prueba_acidez = prueba

            # Si se determino una calidad especifica, actualizar tipo_materia_prima
            if prueba.codigo_materia:
                recepcion.tipo_materia_prima = prueba.codigo_materia

        elif validated_data.get('prueba_acidez_id'):
            prueba = PruebaAcidez.objects.get(pk=validated_data['prueba_acidez_id'])
            recepcion.prueba_acidez = prueba

            if prueba.codigo_materia:
                recepcion.tipo_materia_prima = prueba.codigo_materia

        recepcion.save()
        return recepcion


class PasarStandbySerializer(serializers.Serializer):
    """
    Serializer para pasar una recepcion a estado STANDBY

    El estado STANDBY indica que el producto esta listo para el siguiente proceso
    """

    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text='Observaciones adicionales al pasar a standby'
    )

    def validate(self, attrs):
        """Validaciones"""
        recepcion = self.context.get('recepcion')

        if not recepcion:
            raise serializers.ValidationError('Recepcion no encontrada')

        if not recepcion.puede_pasar_standby:
            raise serializers.ValidationError(
                f'La recepcion no puede pasar a STANDBY. Estado actual: {recepcion.get_estado_display()}'
            )

        return attrs

    def update(self, recepcion, validated_data):
        """
        Pasa la recepcion a estado STANDBY
        """
        observaciones = validated_data.get('observaciones')

        if observaciones:
            # Agregar observaciones al campo existente
            if recepcion.observaciones_recepcion:
                recepcion.observaciones_recepcion += f'\n[STANDBY] {observaciones}'
            else:
                recepcion.observaciones_recepcion = f'[STANDBY] {observaciones}'
            recepcion.save(update_fields=['observaciones_recepcion'])

        # Llamar al metodo del modelo
        recepcion.pasar_a_standby()

        return recepcion
