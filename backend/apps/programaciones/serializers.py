"""
Serializers del módulo Programaciones - API REST
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import serializers
from django.utils import timezone
from django.db.models import Q
from .models import Programacion
from apps.ecoaliados.models import Ecoaliado
from apps.core.models import User
from apps.core.fields import NaiveDateField


# ==================== PROGRAMACION SERIALIZERS ====================

class ProgramacionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de programaciones (campos resumidos)"""

    ecoaliado_codigo = serializers.CharField(source='ecoaliado.codigo', read_only=True)
    ecoaliado_razon_social = serializers.CharField(source='ecoaliado.razon_social', read_only=True)
    ecoaliado_ciudad = serializers.CharField(source='ecoaliado.ciudad', read_only=True)
    programado_por_nombre = serializers.CharField(source='programado_por.get_full_name', read_only=True)
    recolector_asignado_nombre = serializers.CharField(source='recolector_asignado.get_full_name', read_only=True)
    tipo_programacion_display = serializers.CharField(source='get_tipo_programacion_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)
    esta_vencida = serializers.SerializerMethodField(read_only=True)
    cantidad_recolectada_kg = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Programacion
        fields = [
            'id',
            'ecoaliado',
            'ecoaliado_codigo',
            'ecoaliado_razon_social',
            'ecoaliado_ciudad',
            'programado_por',
            'programado_por_nombre',
            'tipo_programacion',
            'tipo_programacion_display',
            'fecha_programada',
            'cantidad_estimada_kg',
            'cantidad_recolectada_kg',
            'recolector_asignado',
            'recolector_asignado_nombre',
            'estado',
            'estado_display',
            'esta_vencida',
            'is_deleted',
            'created_at',
        ]

    def get_esta_vencida(self, obj):
        """Retorna la propiedad esta_vencida del modelo"""
        return obj.esta_vencida

    def get_cantidad_recolectada_kg(self, obj):
        """Retorna la cantidad real recolectada desde la recoleccion asociada"""
        if hasattr(obj, 'recoleccion') and obj.recoleccion:
            return float(obj.recoleccion.cantidad_kg)
        return None


class ProgramacionDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle completo de programación"""

    ecoaliado_detalle = serializers.SerializerMethodField()
    programado_por_nombre = serializers.CharField(source='programado_por.get_full_name', read_only=True)
    recolector_asignado_nombre = serializers.CharField(source='recolector_asignado.get_full_name', read_only=True)
    asignado_por_nombre = serializers.CharField(source='asignado_por.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    tipo_programacion_display = serializers.CharField(source='get_tipo_programacion_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)
    esta_vencida = serializers.SerializerMethodField(read_only=True)

    # Propiedades calculadas
    puede_asignar_recolector = serializers.BooleanField(read_only=True)
    puede_confirmar = serializers.BooleanField(read_only=True)
    puede_iniciar_ruta = serializers.BooleanField(read_only=True)
    puede_completar = serializers.BooleanField(read_only=True)
    puede_cancelar = serializers.BooleanField(read_only=True)
    puede_reprogramar = serializers.BooleanField(read_only=True)

    class Meta:
        model = Programacion
        fields = '__all__'
        read_only_fields = [
            'programado_por',
            'asignado_por',
            'fecha_asignacion',
            'created_by',
            'created_at',
            'updated_at',
            'deleted_at',
        ]

    def get_ecoaliado_detalle(self, obj):
        """Retorna información detallada del ecoaliado"""
        return {
            'id': obj.ecoaliado.id,
            'codigo': obj.ecoaliado.codigo,
            'razon_social': obj.ecoaliado.razon_social,
            'telefono': obj.ecoaliado.telefono,
            'direccion': obj.ecoaliado.direccion,
            'ciudad': obj.ecoaliado.ciudad,
            'departamento': obj.ecoaliado.departamento,
            'comercial_asignado': obj.ecoaliado.comercial_asignado.get_full_name(),
            'tiene_geolocalizacion': obj.ecoaliado.tiene_geolocalizacion,
        }

    def get_esta_vencida(self, obj):
        """Retorna la propiedad esta_vencida del modelo"""
        return obj.esta_vencida


class ProgramacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear programaciones con validaciones específicas"""

    # Usar NaiveDateField para evitar conversión de timezone
    # que causa que la fecha se guarde un día antes
    fecha_programada = NaiveDateField()

    class Meta:
        model = Programacion
        fields = [
            'ecoaliado',
            'tipo_programacion',
            'fecha_programada',
            'cantidad_estimada_kg',
            'observaciones_comercial',
        ]

    def validate_ecoaliado(self, value):
        """Validar que el ecoaliado esté activo y no eliminado"""
        if not value.is_active:
            raise serializers.ValidationError(
                'El ecoaliado debe estar activo para programar recolecciones'
            )
        if value.is_deleted:
            raise serializers.ValidationError(
                'El ecoaliado está eliminado y no puede usarse'
            )
        return value

    def validate_fecha_programada(self, value):
        """Validar que la fecha sea futura"""
        if value < timezone.now().date():
            raise serializers.ValidationError(
                'La fecha programada debe ser igual o posterior a hoy'
            )
        return value

    def validate_cantidad_estimada_kg(self, value):
        """Validar cantidad mayor a 0"""
        if value <= 0:
            raise serializers.ValidationError(
                'La cantidad estimada debe ser mayor a 0'
            )
        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        ecoaliado = attrs.get('ecoaliado')
        fecha_programada = attrs.get('fecha_programada')

        # Validar que no exista otra programación activa para el mismo ecoaliado en la misma fecha
        if ecoaliado and fecha_programada:
            conflictos = Programacion.objects.filter(
                ecoaliado=ecoaliado,
                fecha_programada=fecha_programada,
                deleted_at__isnull=True
            ).exclude(
                estado__in=['CANCELADA', 'REPROGRAMADA']
            )

            if conflictos.exists():
                raise serializers.ValidationError({
                    'fecha_programada': f'Ya existe una programación activa para {ecoaliado.razon_social} en esta fecha'
                })

        return attrs

    def create(self, validated_data):
        """Crear programación con metadatos"""
        # Obtener usuario del contexto
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['programado_por'] = request.user
            validated_data['created_by'] = request.user

        # Estado inicial siempre PROGRAMADA
        validated_data['estado'] = 'PROGRAMADA'

        programacion = Programacion.objects.create(**validated_data)
        return programacion


class ProgramacionUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar programaciones (solo campos permitidos)"""

    # Usar NaiveDateField para evitar conversión de timezone
    fecha_programada = NaiveDateField()

    class Meta:
        model = Programacion
        fields = [
            'fecha_programada',
            'cantidad_estimada_kg',
            'observaciones_comercial',
            'observaciones_logistica',
        ]

    def validate_fecha_programada(self, value):
        """Validar que la fecha sea futura si se está modificando"""
        instance = self.instance
        if instance and instance.estado in ['CONFIRMADA', 'EN_RUTA']:
            # No permitir cambio de fecha si ya está confirmada o en ruta
            if value != instance.fecha_programada:
                raise serializers.ValidationError(
                    'No se puede cambiar la fecha de una programación confirmada o en ruta'
                )
        if value < timezone.now().date():
            raise serializers.ValidationError(
                'La fecha programada debe ser igual o posterior a hoy'
            )
        return value

    def validate_cantidad_estimada_kg(self, value):
        """Validar cantidad mayor a 0"""
        if value <= 0:
            raise serializers.ValidationError(
                'La cantidad estimada debe ser mayor a 0'
            )
        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        instance = self.instance
        fecha_programada = attrs.get('fecha_programada', instance.fecha_programada)

        # Validar que no exista otra programación activa si se cambia la fecha
        if 'fecha_programada' in attrs and attrs['fecha_programada'] != instance.fecha_programada:
            conflictos = Programacion.objects.filter(
                ecoaliado=instance.ecoaliado,
                fecha_programada=fecha_programada,
                deleted_at__isnull=True
            ).exclude(
                Q(estado__in=['CANCELADA', 'REPROGRAMADA']) | Q(pk=instance.pk)
            )

            if conflictos.exists():
                raise serializers.ValidationError({
                    'fecha_programada': f'Ya existe una programación activa para {instance.ecoaliado.razon_social} en esta fecha'
                })

        return attrs


class AsignarRecolectorSerializer(serializers.Serializer):
    """
    Serializer para asignar recolector a una programación
    SOLO Líder Logística puede usar esta acción

    Si la fecha de programación ya pasó, se requiere una nueva fecha (reprogramación implícita)
    """

    recolector_asignado = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(
            cargo__code='recolector_econorte',
            is_active=True,
            deleted_at__isnull=True
        ),
        required=True,
        help_text='ID del recolector a asignar'
    )
    nueva_fecha = NaiveDateField(
        required=False,
        allow_null=True,
        help_text='Nueva fecha de recolección (requerida si la fecha original ya pasó)'
    )
    observaciones_logistica = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Observaciones del líder de logística'
    )

    def validate_recolector_asignado(self, value):
        """Validar que el usuario sea recolector activo"""
        if not value.cargo or value.cargo.code != 'recolector_econorte':
            raise serializers.ValidationError(
                'El usuario debe tener cargo de Recolector Econorte'
            )
        if not value.is_active:
            raise serializers.ValidationError(
                'El recolector debe estar activo'
            )
        return value

    def validate_nueva_fecha(self, value):
        """Validar que la nueva fecha sea hoy o futura"""
        if value:
            from datetime import date
            if value < date.today():
                raise serializers.ValidationError(
                    'La nueva fecha debe ser hoy o una fecha futura'
                )
        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        from datetime import date
        programacion = self.context.get('programacion')
        nueva_fecha = attrs.get('nueva_fecha')
        hoy = date.today()

        if not programacion.puede_asignar_recolector:
            raise serializers.ValidationError(
                'No se puede asignar recolector a esta programación. '
                f'Estado actual: {programacion.get_estado_display()}'
            )

        # Si la fecha de programación ya pasó, se requiere nueva fecha
        if programacion.fecha_programada < hoy:
            if not nueva_fecha:
                raise serializers.ValidationError({
                    'nueva_fecha': 'La fecha de recolección ya pasó. Debe especificar una nueva fecha.',
                    'fecha_vencida': True,
                    'fecha_original': programacion.fecha_programada.isoformat()
                })

        return attrs

    def save(self):
        """
        Asignar recolector y cambiar estado automáticamente:
        - Si la fecha es hoy -> EN_RUTA
        - Si la fecha es futura -> CONFIRMADA
        - Si hay nueva_fecha, actualiza fecha_programada directamente
        """
        from datetime import date
        programacion = self.context.get('programacion')
        usuario = self.context.get('usuario')
        recolector = self.validated_data['recolector_asignado']
        nueva_fecha = self.validated_data.get('nueva_fecha')
        observaciones = self.validated_data.get('observaciones_logistica', '')
        hoy = date.today()

        # Si hay nueva fecha, validar que no exista conflicto (excluyendo la misma programación)
        if nueva_fecha:
            from django.db.models import Q
            conflictos = Programacion.objects.filter(
                ecoaliado=programacion.ecoaliado,
                fecha_programada=nueva_fecha,
                deleted_at__isnull=True
            ).exclude(
                Q(estado__in=['CANCELADA', 'REPROGRAMADA']) | Q(pk=programacion.pk)
            )

            if conflictos.exists():
                raise serializers.ValidationError({
                    'nueva_fecha': f'Ya existe una programación activa para {programacion.ecoaliado.razon_social} en esta fecha'
                })

        # Campos a actualizar
        update_fields = [
            'recolector_asignado',
            'asignado_por',
            'fecha_asignacion',
            'observaciones_logistica',
            'estado',
            'updated_at'
        ]

        # Si hay nueva fecha, actualizar fecha_programada y agregar nota en observaciones
        if nueva_fecha:
            fecha_original = programacion.fecha_programada
            programacion.fecha_programada = nueva_fecha
            # Agregar nota de reprogramación a las observaciones
            nota_reprogramacion = f"[Reprogramado: fecha original {fecha_original} → {nueva_fecha}]"
            if observaciones:
                observaciones = f"{nota_reprogramacion}\n{observaciones}"
            else:
                observaciones = nota_reprogramacion
            update_fields.append('fecha_programada')
            fecha_efectiva = nueva_fecha
        else:
            fecha_efectiva = programacion.fecha_programada

        # Determinar estado automático según fecha efectiva
        # Estados válidos: CONFIRMADA (futura) o EN_RUTA (hoy)
        if fecha_efectiva == hoy:
            nuevo_estado = 'EN_RUTA'
        else:
            nuevo_estado = 'CONFIRMADA'

        # Asignar recolector
        programacion.recolector_asignado = recolector
        programacion.asignado_por = usuario
        programacion.fecha_asignacion = timezone.now()
        programacion.observaciones_logistica = observaciones
        programacion.estado = nuevo_estado

        # Usar update para evitar full_clean que causa error de constraint
        Programacion.objects.filter(pk=programacion.pk).update(
            recolector_asignado=recolector,
            asignado_por=usuario,
            fecha_asignacion=timezone.now(),
            observaciones_logistica=observaciones,
            estado=nuevo_estado,
            fecha_programada=programacion.fecha_programada,
            updated_at=timezone.now()
        )

        # Refrescar la instancia desde la base de datos
        programacion.refresh_from_db()

        return programacion


class CambiarEstadoSerializer(serializers.Serializer):
    """
    Serializer para cambiar estado de programación con validaciones
    """

    nuevo_estado = serializers.ChoiceField(
        choices=Programacion.ESTADO_CHOICES,
        required=True,
        help_text='Nuevo estado de la programación'
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Observaciones del cambio de estado'
    )
    motivo_cancelacion = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Motivo de cancelación (requerido si nuevo_estado es CANCELADA)'
    )

    def validate(self, attrs):
        """Validaciones cruzadas"""
        programacion = self.context.get('programacion')
        usuario = self.context.get('usuario')
        nuevo_estado = attrs.get('nuevo_estado')

        # Validar transición de estado
        puede_cambiar, mensaje = programacion.puede_cambiar_estado(nuevo_estado, usuario)
        if not puede_cambiar:
            raise serializers.ValidationError({'nuevo_estado': mensaje})

        # Si es cancelación, motivo es requerido
        if nuevo_estado == 'CANCELADA':
            motivo = attrs.get('motivo_cancelacion', '').strip()
            if not motivo:
                raise serializers.ValidationError({
                    'motivo_cancelacion': 'El motivo de cancelación es requerido'
                })

        return attrs

    def save(self):
        """Cambiar estado de la programación"""
        programacion = self.context.get('programacion')
        nuevo_estado = self.validated_data['nuevo_estado']
        observaciones = self.validated_data.get('observaciones', '')
        motivo_cancelacion = self.validated_data.get('motivo_cancelacion', '')

        # Cambiar estado
        programacion.estado = nuevo_estado

        # Si es cancelación, guardar motivo
        if nuevo_estado == 'CANCELADA':
            programacion.motivo_cancelacion = motivo_cancelacion

        # Agregar observaciones si las hay
        if observaciones:
            if programacion.observaciones_logistica:
                programacion.observaciones_logistica += f"\n\n[{timezone.now().strftime('%Y-%m-%d %H:%M')}] {observaciones}"
            else:
                programacion.observaciones_logistica = observaciones

        programacion.save(update_fields=['estado', 'motivo_cancelacion', 'observaciones_logistica', 'updated_at'])

        return programacion


class ReprogramarSerializer(serializers.Serializer):
    """
    Serializer para reprogramar una programacion existente
    SOLO Lider Logistica puede usar esta accion

    Permite cambiar la fecha de programaciones en estados:
    - PROGRAMADA, CONFIRMADA, ASIGNADA (cambio de fecha simple)
    - CANCELADA (crea nueva programacion)
    """

    fecha_reprogramada = NaiveDateField(
        required=True,
        help_text='Nueva fecha programada (formato: YYYY-MM-DD)'
    )
    motivo_reprogramacion = serializers.CharField(
        required=True,
        min_length=10,
        max_length=500,
        help_text='Motivo de la reprogramacion'
    )
    mantener_recolector = serializers.BooleanField(
        required=False,
        default=True,
        help_text='Si se mantiene el recolector asignado'
    )

    def validate_fecha_reprogramada(self, value):
        """Validar que la fecha sea hoy o futura"""
        from datetime import date
        if value < date.today():
            raise serializers.ValidationError(
                'La fecha programada debe ser igual o posterior a hoy'
            )
        return value

    def validate(self, attrs):
        """Validaciones cruzadas"""
        programacion = self.context.get('programacion')
        fecha_reprogramada = attrs.get('fecha_reprogramada')

        # Usar la propiedad del modelo para validar si puede reprogramarse
        if not programacion.puede_reprogramar:
            raise serializers.ValidationError(
                f'No se puede reprogramar una programacion en estado {programacion.get_estado_display()}. '
                'Solo se pueden reprogramar programaciones que no estén completadas.'
            )

        # Validar que no exista otra programacion activa en la nueva fecha (excepto la actual)
        conflictos = Programacion.objects.filter(
            ecoaliado=programacion.ecoaliado,
            fecha_programada=fecha_reprogramada,
            deleted_at__isnull=True
        ).exclude(
            pk=programacion.pk
        ).exclude(
            estado__in=['CANCELADA', 'REPROGRAMADA', 'COMPLETADA']
        )

        if conflictos.exists():
            raise serializers.ValidationError({
                'fecha_reprogramada': f'Ya existe una programacion activa para {programacion.ecoaliado.razon_social} en esta fecha'
            })

        return attrs

    def save(self):
        """
        Reprogramar: actualiza fecha y registra motivo.

        Si la programacion estaba vencida (EN_RUTA u otro estado con fecha pasada):
        - Actualiza la fecha
        - Cambia el estado a CONFIRMADA si tiene recolector, PROGRAMADA si no
        """
        from datetime import date
        programacion = self.context.get('programacion')
        usuario = self.context.get('usuario')

        fecha_anterior = programacion.fecha_programada
        nueva_fecha = self.validated_data['fecha_reprogramada']
        mantener_recolector = self.validated_data.get('mantener_recolector', True)
        estaba_vencida = programacion.esta_vencida
        estado_anterior = programacion.estado

        # Actualizar la programacion existente
        programacion.fecha_programada = nueva_fecha

        # Agregar motivo a observaciones logistica
        motivo = self.validated_data['motivo_reprogramacion']
        fecha_str = fecha_anterior.strftime('%d/%m/%Y')
        nueva_fecha_str = nueva_fecha.strftime('%d/%m/%Y')

        if estaba_vencida:
            nota_reprogramacion = f"[{timezone.now().strftime('%d/%m/%Y %H:%M')}] VENCIDA - Reprogramada de {fecha_str} a {nueva_fecha_str}. Estado anterior: {estado_anterior}. Motivo: {motivo}"
        else:
            nota_reprogramacion = f"[{timezone.now().strftime('%d/%m/%Y %H:%M')}] Reprogramada de {fecha_str} a {nueva_fecha_str}. Motivo: {motivo}"

        if programacion.observaciones_logistica:
            programacion.observaciones_logistica = f"{programacion.observaciones_logistica}\n{nota_reprogramacion}"
        else:
            programacion.observaciones_logistica = nota_reprogramacion

        # Si no mantiene recolector, quitar asignacion y volver a PROGRAMADA
        if not mantener_recolector and programacion.recolector_asignado:
            programacion.recolector_asignado = None
            programacion.fecha_asignacion = None
            programacion.estado = 'PROGRAMADA'
        # Si estaba vencida o en EN_RUTA, ajustar estado segun nueva fecha
        elif estaba_vencida or estado_anterior == 'EN_RUTA':
            if programacion.recolector_asignado:
                # Tiene recolector: verificar si la nueva fecha es hoy o futura
                if nueva_fecha == date.today():
                    programacion.estado = 'EN_RUTA'
                else:
                    programacion.estado = 'CONFIRMADA'
            else:
                programacion.estado = 'PROGRAMADA'

        programacion.save()

        return programacion
