"""
Serializers para ejecucion - workflow_engine
"""
from rest_framework import serializers
from .models import (
    InstanciaFlujo,
    TareaActiva,
    HistorialTarea,
    ArchivoAdjunto,
    NotificacionFlujo
)


class InstanciaFlujoSerializer(serializers.ModelSerializer):
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True)
    nodo_actual_nombre = serializers.CharField(source='nodo_actual.nombre', read_only=True)
    iniciado_por_nombre = serializers.CharField(
        source='iniciado_por.get_full_name',
        read_only=True
    )
    responsable_actual_nombre = serializers.CharField(
        source='responsable_actual.get_full_name',
        read_only=True
    )
    finalizado_por_nombre = serializers.CharField(
        source='finalizado_por.get_full_name',
        read_only=True
    )
    esta_vencida = serializers.BooleanField(read_only=True)
    progreso_porcentaje = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = InstanciaFlujo
        fields = [
            'id',
            'codigo_instancia',
            'titulo',
            'descripcion',
            'plantilla',
            'plantilla_nombre',
            'nodo_actual',
            'nodo_actual_nombre',
            'estado',
            'prioridad',
            'entidad_tipo',
            'entidad_id',
            'data_contexto',
            'variables_flujo',
            'fecha_inicio',
            'fecha_fin',
            'fecha_limite',
            'tiempo_total_horas',
            'iniciado_por',
            'iniciado_por_nombre',
            'responsable_actual',
            'responsable_actual_nombre',
            'finalizado_por',
            'finalizado_por_nombre',
            'motivo_cancelacion',
            'motivo_pausa',
            'observaciones',
            'esta_vencida',
            'progreso_porcentaje',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'tiempo_total_horas']

    def validate(self, data):
        # Si está cancelado, debe tener motivo
        if data.get('estado') == 'CANCELADO' and not data.get('motivo_cancelacion'):
            raise serializers.ValidationError({
                'motivo_cancelacion': 'Debe indicar el motivo de cancelación'
            })
        return data


class TareaActivaSerializer(serializers.ModelSerializer):
    instancia_codigo = serializers.CharField(source='instancia.codigo_instancia', read_only=True)
    instancia_titulo = serializers.CharField(source='instancia.titulo', read_only=True)
    nodo_nombre = serializers.CharField(source='nodo.nombre', read_only=True)
    asignado_a_nombre = serializers.CharField(
        source='asignado_a.get_full_name',
        read_only=True
    )
    asignado_por_nombre = serializers.CharField(
        source='asignado_por.get_full_name',
        read_only=True
    )
    escalada_a_nombre = serializers.CharField(
        source='escalada_a.get_full_name',
        read_only=True
    )
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    esta_vencida = serializers.BooleanField(read_only=True)
    horas_restantes = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = TareaActiva
        fields = [
            'id',
            'instancia',
            'instancia_codigo',
            'instancia_titulo',
            'nodo',
            'nodo_nombre',
            'codigo_tarea',
            'nombre_tarea',
            'descripcion',
            'tipo_tarea',
            'estado',
            'asignado_a',
            'asignado_a_nombre',
            'rol_asignado',
            'asignado_por',
            'asignado_por_nombre',
            'fecha_creacion',
            'fecha_inicio',
            'fecha_completada',
            'fecha_vencimiento',
            'tiempo_ejecucion_horas',
            'formulario_schema',
            'formulario_data',
            'decision',
            'escalada_a',
            'escalada_a_nombre',
            'motivo_escalamiento',
            'motivo_rechazo',
            'observaciones',
            'esta_vencida',
            'horas_restantes',
            'created_by',
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'tiempo_ejecucion_horas']

    def validate(self, data):
        # Si está rechazada, debe tener motivo
        if data.get('estado') == 'RECHAZADA' and not data.get('motivo_rechazo'):
            raise serializers.ValidationError({
                'motivo_rechazo': 'Debe indicar el motivo de rechazo'
            })

        # Si está escalada, debe tener escalada_a
        if data.get('estado') == 'ESCALADA' and not data.get('escalada_a'):
            raise serializers.ValidationError({
                'escalada_a': 'Debe indicar a quién se escaló la tarea'
            })

        return data


class HistorialTareaSerializer(serializers.ModelSerializer):
    tarea_codigo = serializers.CharField(source='tarea.codigo_tarea', read_only=True)
    tarea_nombre = serializers.CharField(source='tarea.nombre_tarea', read_only=True)
    instancia_codigo = serializers.CharField(source='instancia.codigo_instancia', read_only=True)
    usuario_nombre = serializers.CharField(
        source='usuario.get_full_name',
        read_only=True
    )
    asignado_anterior_nombre = serializers.CharField(
        source='asignado_anterior.get_full_name',
        read_only=True
    )
    asignado_nuevo_nombre = serializers.CharField(
        source='asignado_nuevo.get_full_name',
        read_only=True
    )

    class Meta:
        model = HistorialTarea
        fields = [
            'id',
            'tarea',
            'tarea_codigo',
            'tarea_nombre',
            'instancia',
            'instancia_codigo',
            'accion',
            'descripcion',
            'estado_anterior',
            'estado_nuevo',
            'asignado_anterior',
            'asignado_anterior_nombre',
            'asignado_nuevo',
            'asignado_nuevo_nombre',
            'datos_cambio',
            'usuario',
            'usuario_nombre',
            'fecha_accion',
            'observaciones',
        ]
        read_only_fields = ['fecha_accion']


class ArchivoAdjuntoSerializer(serializers.ModelSerializer):
    instancia_codigo = serializers.CharField(source='instancia.codigo_instancia', read_only=True)
    tarea_codigo = serializers.CharField(source='tarea.codigo_tarea', read_only=True)
    subido_por_nombre = serializers.CharField(
        source='subido_por.get_full_name',
        read_only=True
    )
    tamano_legible = serializers.CharField(read_only=True)

    class Meta:
        model = ArchivoAdjunto
        fields = [
            'id',
            'instancia',
            'instancia_codigo',
            'tarea',
            'tarea_codigo',
            'archivo',
            'nombre_original',
            'tipo_archivo',
            'mime_type',
            'tamano_bytes',
            'tamano_legible',
            'titulo',
            'descripcion',
            'metadatos',
            'subido_por',
            'subido_por_nombre',
            'fecha_subida',
        ]
        read_only_fields = ['fecha_subida', 'tamano_legible']

    def validate(self, data):
        # Debe estar asociado a instancia O tarea (no a ambos ni a ninguno)
        instancia = data.get('instancia')
        tarea = data.get('tarea')

        if not instancia and not tarea:
            raise serializers.ValidationError(
                'El archivo debe estar asociado a una instancia o tarea'
            )

        if instancia and tarea:
            raise serializers.ValidationError(
                'El archivo no puede estar asociado a instancia y tarea simultáneamente'
            )

        return data


class NotificacionFlujoSerializer(serializers.ModelSerializer):
    destinatario_nombre = serializers.CharField(
        source='destinatario.get_full_name',
        read_only=True
    )
    destinatario_email = serializers.CharField(
        source='destinatario.email',
        read_only=True
    )
    instancia_codigo = serializers.CharField(source='instancia.codigo_instancia', read_only=True)
    tarea_codigo = serializers.CharField(source='tarea.codigo_tarea', read_only=True)
    generada_por_nombre = serializers.CharField(
        source='generada_por.get_full_name',
        read_only=True
    )
    tiempo_desde_creacion = serializers.CharField(read_only=True)

    class Meta:
        model = NotificacionFlujo
        fields = [
            'id',
            'destinatario',
            'destinatario_nombre',
            'destinatario_email',
            'instancia',
            'instancia_codigo',
            'tarea',
            'tarea_codigo',
            'tipo_notificacion',
            'titulo',
            'mensaje',
            'prioridad',
            'datos_contexto',
            'url_accion',
            'leida',
            'fecha_lectura',
            'enviada_app',
            'enviada_email',
            'email_enviado_exitoso',
            'fecha_envio_email',
            'fecha_creacion',
            'generada_por',
            'generada_por_nombre',
            'tiempo_desde_creacion',
        ]
        read_only_fields = ['fecha_creacion', 'fecha_lectura', 'tiempo_desde_creacion']
