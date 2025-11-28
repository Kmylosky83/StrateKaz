# -*- coding: utf-8 -*-
"""
Serializers del modulo Recolecciones - Sistema de Gestion Grasas y Huesos del Norte
"""
from rest_framework import serializers
from django.utils import timezone
from decimal import Decimal
from .models import Recoleccion
from apps.programaciones.models import Programacion
from apps.ecoaliados.models import Ecoaliado


class RecoleccionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de recolecciones"""

    ecoaliado_codigo = serializers.CharField(source='ecoaliado.codigo', read_only=True)
    ecoaliado_razon_social = serializers.CharField(source='ecoaliado.razon_social', read_only=True)
    ecoaliado_ciudad = serializers.CharField(source='ecoaliado.ciudad', read_only=True)
    recolector_nombre = serializers.CharField(source='recolector.get_full_name', read_only=True)
    programacion_codigo = serializers.SerializerMethodField()
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Recoleccion
        fields = [
            'id',
            'codigo_voucher',
            'programacion',
            'programacion_codigo',
            'ecoaliado',
            'ecoaliado_codigo',
            'ecoaliado_razon_social',
            'ecoaliado_ciudad',
            'recolector',
            'recolector_nombre',
            'fecha_recoleccion',
            'cantidad_kg',
            'precio_kg',
            'valor_total',
            'is_deleted',
            'created_at',
        ]

    def get_programacion_codigo(self, obj):
        """Obtiene el codigo de la programacion si existe"""
        if obj.programacion:
            return f"PROG-{obj.programacion.id:06d}"
        return None


class RecoleccionDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle completo de recoleccion"""

    ecoaliado_detalle = serializers.SerializerMethodField()
    recolector_nombre = serializers.CharField(source='recolector.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    programacion_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Recoleccion
        fields = [
            'id',
            'codigo_voucher',
            'programacion',
            'programacion_detalle',
            'ecoaliado',
            'ecoaliado_detalle',
            'recolector',
            'recolector_nombre',
            'fecha_recoleccion',
            'cantidad_kg',
            'precio_kg',
            'valor_total',
            'observaciones',
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
            'deleted_at',
        ]

    def get_ecoaliado_detalle(self, obj):
        """Obtiene datos relevantes del ecoaliado"""
        if obj.ecoaliado:
            return {
                'id': obj.ecoaliado.id,
                'codigo': obj.ecoaliado.codigo,
                'razon_social': obj.ecoaliado.razon_social,
                'nit': obj.ecoaliado.nit,
                'ciudad': obj.ecoaliado.ciudad,
                'direccion': obj.ecoaliado.direccion,
                'telefono': obj.ecoaliado.telefono,
                'precio_actual_kg': float(obj.ecoaliado.precio_compra_kg) if obj.ecoaliado.precio_compra_kg else None,
            }
        return None

    def get_programacion_detalle(self, obj):
        """Obtiene datos de la programacion asociada"""
        if obj.programacion:
            return {
                'id': obj.programacion.id,
                'codigo': f"PROG-{obj.programacion.id:06d}",
                'fecha_programada': obj.programacion.fecha_programada,
                'cantidad_estimada_kg': float(obj.programacion.cantidad_estimada_kg) if obj.programacion.cantidad_estimada_kg else None,
                'estado': obj.programacion.estado,
            }
        return None


class RegistrarRecoleccionSerializer(serializers.Serializer):
    """
    Serializer para registrar una nueva recoleccion desde una programacion EN_RUTA

    Flujo:
    1. Recolector abre programacion EN_RUTA
    2. Digita cantidad_kg pesada en bascula
    3. Sistema calcula valor_total = cantidad_kg * ecoaliado.precio_compra_kg
    4. Se crea Recoleccion y se marca Programacion como COMPLETADA
    5. Se genera voucher para impresion
    """

    programacion_id = serializers.IntegerField(
        help_text='ID de la programacion a completar'
    )
    cantidad_kg = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0.01'),
        help_text='Cantidad recolectada en kilogramos'
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text='Observaciones del recolector'
    )

    def validate_programacion_id(self, value):
        """Valida que la programacion exista y este en estado correcto"""
        try:
            programacion = Programacion.objects.select_related(
                'ecoaliado', 'recolector_asignado'
            ).get(pk=value, deleted_at__isnull=True)
        except Programacion.DoesNotExist:
            raise serializers.ValidationError('La programacion no existe o fue eliminada')

        # Validar estado - debe ser EN_RUTA
        if programacion.estado != 'EN_RUTA':
            raise serializers.ValidationError(
                f'La programacion debe estar EN_RUTA para registrar recoleccion. Estado actual: {programacion.get_estado_display()}'
            )

        # Validar que no tenga ya una recoleccion
        if hasattr(programacion, 'recoleccion') and programacion.recoleccion:
            raise serializers.ValidationError(
                'Esta programacion ya tiene una recoleccion registrada'
            )

        # Guardar programacion para uso posterior
        self.context['programacion'] = programacion
        return value

    def validate(self, attrs):
        """Validaciones generales"""
        programacion = self.context.get('programacion')
        usuario = self.context.get('usuario')

        if not programacion:
            raise serializers.ValidationError({
                'programacion_id': 'Programacion no encontrada'
            })

        if not usuario:
            raise serializers.ValidationError({
                'detail': 'Usuario no autenticado'
            })

        # Validar que el usuario sea el recolector asignado o tenga permisos superiores
        if programacion.recolector_asignado != usuario:
            if usuario.cargo and usuario.cargo.code not in ['lider_log_econorte', 'gerente', 'superadmin']:
                raise serializers.ValidationError({
                    'detail': 'Solo el recolector asignado puede registrar esta recoleccion'
                })

        # Validar que el ecoaliado tenga precio configurado
        if not programacion.ecoaliado.precio_compra_kg or programacion.ecoaliado.precio_compra_kg <= 0:
            raise serializers.ValidationError({
                'detail': f'El ecoaliado {programacion.ecoaliado.razon_social} no tiene precio de compra configurado'
            })

        return attrs

    def create(self, validated_data):
        """
        Crea la recoleccion y actualiza la programacion a COMPLETADA
        """
        programacion = self.context['programacion']
        usuario = self.context['usuario']
        cantidad_kg = validated_data['cantidad_kg']
        observaciones = validated_data.get('observaciones', '')

        # Obtener precio del ecoaliado
        precio_kg = programacion.ecoaliado.precio_compra_kg

        # Calcular valor total (redondear a 2 decimales para evitar error de validación)
        valor_total = (Decimal(str(cantidad_kg)) * Decimal(str(precio_kg))).quantize(Decimal('0.01'))

        # Crear recoleccion
        recoleccion = Recoleccion.objects.create(
            programacion=programacion,
            ecoaliado=programacion.ecoaliado,
            recolector=programacion.recolector_asignado,
            fecha_recoleccion=timezone.now(),
            cantidad_kg=cantidad_kg,
            precio_kg=precio_kg,
            valor_total=valor_total,
            observaciones=observaciones,
            created_by=usuario,
        )

        # Actualizar programacion a COMPLETADA
        Programacion.objects.filter(pk=programacion.pk).update(
            estado='COMPLETADA',
            updated_at=timezone.now()
        )

        return recoleccion


class VoucherRecoleccionSerializer(serializers.ModelSerializer):
    """
    Serializer para generar datos del voucher de impresion

    Incluye toda la informacion necesaria para imprimir:
    - Datos de la empresa
    - Datos del ecoaliado
    - Detalle de la recoleccion
    - Totales
    """

    empresa = serializers.SerializerMethodField()
    ecoaliado_info = serializers.SerializerMethodField()
    recolector_nombre = serializers.CharField(source='recolector.get_full_name', read_only=True)
    detalle = serializers.SerializerMethodField()

    class Meta:
        model = Recoleccion
        fields = [
            'id',
            'codigo_voucher',
            'fecha_recoleccion',
            'empresa',
            'ecoaliado_info',
            'recolector_nombre',
            'detalle',
        ]

    def get_empresa(self, obj):
        """Datos de la empresa para el encabezado del voucher"""
        return {
            'nombre': 'GRASAS Y HUESOS DEL NORTE S.A.S.',
            'nit': '900.XXX.XXX-X',  # TODO: Configurar desde settings
            'direccion': 'Calle XX # XX-XX, Barranquilla',
            'telefono': '(605) XXX XXXX',
        }

    def get_ecoaliado_info(self, obj):
        """Datos del ecoaliado para el voucher"""
        if obj.ecoaliado:
            return {
                'codigo': obj.ecoaliado.codigo,
                'razon_social': obj.ecoaliado.razon_social,
                'nit': obj.ecoaliado.nit,
                'direccion': obj.ecoaliado.direccion,
                'ciudad': obj.ecoaliado.ciudad,
            }
        return None

    def get_detalle(self, obj):
        """Detalle de la recoleccion para el voucher"""
        return {
            'cantidad_kg': float(obj.cantidad_kg),
            'precio_kg': float(obj.precio_kg),
            'subtotal': float(obj.valor_total),
            'iva': 0,  # Sin IVA para compra de ACU
            'total': float(obj.valor_total),
            'total_letras': self._numero_a_letras(float(obj.valor_total)),
        }

    def _numero_a_letras(self, numero):
        """Convierte numero a letras (simplificado)"""
        # TODO: Implementar conversion completa
        return f"{numero:,.0f} PESOS M/CTE".replace(',', '.')


class RecoleccionEstadisticasSerializer(serializers.Serializer):
    """Serializer para estadisticas de recolecciones"""

    total_recolecciones = serializers.IntegerField()
    total_kg_recolectados = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_valor_pagado = serializers.DecimalField(max_digits=15, decimal_places=2)
    promedio_kg_por_recoleccion = serializers.DecimalField(max_digits=10, decimal_places=2)
    promedio_valor_por_recoleccion = serializers.DecimalField(max_digits=12, decimal_places=2)
    recolecciones_hoy = serializers.IntegerField()
    recolecciones_semana = serializers.IntegerField()
    recolecciones_mes = serializers.IntegerField()
