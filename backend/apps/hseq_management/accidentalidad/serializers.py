"""
Serializers para Accidentalidad (ATEL) - HSEQ Management
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()
from .models import (
    AccidenteTrabajo,
    EnfermedadLaboral,
    IncidenteTrabajo,
    InvestigacionATEL,
    CausaRaiz,
    LeccionAprendida,
    PlanAccionATEL,
    AccionPlan
)


class AccidenteTrabajoSerializer(serializers.ModelSerializer):
    """Serializer para Accidentes de Trabajo"""

    trabajador_nombre = serializers.CharField(source='trabajador.get_full_name', read_only=True)
    reportado_por_nombre = serializers.CharField(source='reportado_por.get_full_name', read_only=True)
    gravedad_display = serializers.CharField(source='get_gravedad_display', read_only=True)
    tipo_evento_display = serializers.CharField(source='get_tipo_evento_display', read_only=True)
    tipo_lesion_display = serializers.CharField(source='get_tipo_lesion_display', read_only=True)
    parte_cuerpo_display = serializers.CharField(source='get_parte_cuerpo_display', read_only=True)

    # Indicador si tiene investigación
    tiene_investigacion = serializers.SerializerMethodField()

    class Meta:
        model = AccidenteTrabajo
        fields = '__all__'
        read_only_fields = [
            'codigo_at',
            'fecha_reporte_interno',
            'fecha_actualizacion',
        ]

    def get_tiene_investigacion(self, obj):
        return hasattr(obj, 'investigacion')

    def validate(self, data):
        # Validar que si es mortal, se especifique la fecha de muerte
        if data.get('mortal') and not data.get('fecha_muerte'):
            raise serializers.ValidationError({
                'fecha_muerte': 'Debe especificar la fecha de muerte para accidentes mortales'
            })

        # Validar que empresa_id venga del request
        request = self.context.get('request')
        if request and hasattr(request.user, 'empresa_id'):
            data['empresa_id'] = request.user.empresa_id

        return data


class AccidenteTrabajoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""

    trabajador_nombre = serializers.CharField(source='trabajador.get_full_name', read_only=True)
    gravedad_display = serializers.CharField(source='get_gravedad_display', read_only=True)
    tipo_evento_display = serializers.CharField(source='get_tipo_evento_display', read_only=True)
    tiene_investigacion = serializers.SerializerMethodField()

    class Meta:
        model = AccidenteTrabajo
        fields = [
            'id',
            'codigo_at',
            'fecha_evento',
            'trabajador',
            'trabajador_nombre',
            'tipo_evento',
            'tipo_evento_display',
            'gravedad',
            'gravedad_display',
            'dias_incapacidad',
            'mortal',
            'requiere_investigacion',
            'tiene_investigacion',
            'reportado_arl',
        ]

    def get_tiene_investigacion(self, obj):
        return hasattr(obj, 'investigacion')


class EnfermedadLaboralSerializer(serializers.ModelSerializer):
    """Serializer para Enfermedades Laborales"""

    trabajador_nombre = serializers.CharField(source='trabajador.get_full_name', read_only=True)
    reportado_por_nombre = serializers.CharField(source='reportado_por.get_full_name', read_only=True)
    tipo_enfermedad_display = serializers.CharField(source='get_tipo_enfermedad_display', read_only=True)
    estado_calificacion_display = serializers.CharField(source='get_estado_calificacion_display', read_only=True)
    tiene_investigacion = serializers.SerializerMethodField()

    class Meta:
        model = EnfermedadLaboral
        fields = '__all__'
        read_only_fields = [
            'codigo_el',
            'fecha_reporte_interno',
            'fecha_actualizacion',
        ]

    def get_tiene_investigacion(self, obj):
        return hasattr(obj, 'investigacion')

    def validate(self, data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'empresa_id'):
            data['empresa_id'] = request.user.empresa_id
        return data


class IncidenteTrabajoSerializer(serializers.ModelSerializer):
    """Serializer para Incidentes de Trabajo"""

    reportado_por_nombre = serializers.CharField(source='reportado_por.get_full_name', read_only=True)
    tipo_incidente_display = serializers.CharField(source='get_tipo_incidente_display', read_only=True)
    potencial_gravedad_display = serializers.CharField(source='get_potencial_gravedad_display', read_only=True)
    tiene_investigacion = serializers.SerializerMethodField()

    class Meta:
        model = IncidenteTrabajo
        fields = '__all__'
        read_only_fields = [
            'codigo_incidente',
            'fecha_reporte',
            'fecha_actualizacion',
        ]

    def get_tiene_investigacion(self, obj):
        return hasattr(obj, 'investigacion')

    def validate(self, data):
        # Validar que si hubo daños materiales, se especifique la descripción
        if data.get('hubo_danos_materiales') and not data.get('descripcion_danos'):
            raise serializers.ValidationError({
                'descripcion_danos': 'Debe describir los daños materiales'
            })

        request = self.context.get('request')
        if request and hasattr(request.user, 'empresa_id'):
            data['empresa_id'] = request.user.empresa_id

        return data


class CausaRaizSerializer(serializers.ModelSerializer):
    """Serializer para Causas Raíz"""

    tipo_causa_display = serializers.CharField(source='get_tipo_causa_display', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)

    class Meta:
        model = CausaRaiz
        fields = '__all__'
        read_only_fields = ['fecha_creacion']

    def validate(self, data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'empresa_id'):
            data['empresa_id'] = request.user.empresa_id
        return data


class InvestigacionATELSerializer(serializers.ModelSerializer):
    """Serializer para Investigaciones ATEL"""

    lider_investigacion_nombre = serializers.CharField(source='lider_investigacion.get_full_name', read_only=True)
    equipo_investigacion_nombres = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    metodologia_display = serializers.CharField(source='get_metodologia_display', read_only=True)

    # Datos del evento relacionado
    evento_codigo = serializers.SerializerMethodField()
    evento_tipo = serializers.SerializerMethodField()

    # Nested serializers para causas raíz
    causas_raiz = CausaRaizSerializer(many=True, read_only=True)

    # Contadores
    total_causas = serializers.SerializerMethodField()
    total_planes_accion = serializers.SerializerMethodField()
    total_lecciones = serializers.SerializerMethodField()

    class Meta:
        model = InvestigacionATEL
        fields = '__all__'
        read_only_fields = [
            'codigo_investigacion',
            'fecha_creacion',
            'fecha_actualizacion',
        ]

    def get_equipo_investigacion_nombres(self, obj):
        return [miembro.get_full_name() for miembro in obj.equipo_investigacion.all()]

    def get_evento_codigo(self, obj):
        if obj.accidente_trabajo:
            return obj.accidente_trabajo.codigo_at
        elif obj.enfermedad_laboral:
            return obj.enfermedad_laboral.codigo_el
        elif obj.incidente_trabajo:
            return obj.incidente_trabajo.codigo_incidente
        return None

    def get_evento_tipo(self, obj):
        if obj.accidente_trabajo:
            return 'Accidente de Trabajo'
        elif obj.enfermedad_laboral:
            return 'Enfermedad Laboral'
        elif obj.incidente_trabajo:
            return 'Incidente de Trabajo'
        return None

    def get_total_causas(self, obj):
        return obj.causas_raiz.count()

    def get_total_planes_accion(self, obj):
        return obj.planes_accion.count()

    def get_total_lecciones(self, obj):
        return obj.lecciones_aprendidas.count()

    def validate(self, data):
        # Validar que solo haya un tipo de evento relacionado
        eventos = [
            data.get('accidente_trabajo'),
            data.get('enfermedad_laboral'),
            data.get('incidente_trabajo')
        ]
        eventos_presentes = [e for e in eventos if e is not None]

        if len(eventos_presentes) != 1:
            raise serializers.ValidationError(
                'Debe relacionar exactamente un evento (AT, EL o Incidente)'
            )

        request = self.context.get('request')
        if request and hasattr(request.user, 'empresa_id'):
            data['empresa_id'] = request.user.empresa_id

        return data


class LeccionAprendidaSerializer(serializers.ModelSerializer):
    """Serializer para Lecciones Aprendidas"""

    investigacion_codigo = serializers.CharField(source='investigacion.codigo_investigacion', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    estado_divulgacion_display = serializers.CharField(source='get_estado_divulgacion_display', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    divulgado_por_nombre = serializers.CharField(source='divulgado_por.get_full_name', read_only=True)

    class Meta:
        model = LeccionAprendida
        fields = '__all__'
        read_only_fields = [
            'codigo_leccion',
            'fecha_creacion',
            'fecha_actualizacion',
        ]

    def validate(self, data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'empresa_id'):
            data['empresa_id'] = request.user.empresa_id
        return data


class AccionPlanSerializer(serializers.ModelSerializer):
    """Serializer para Acciones de Plan"""

    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    verificado_por_nombre = serializers.CharField(source='verificado_por.get_full_name', read_only=True)
    tipo_accion_display = serializers.CharField(source='get_tipo_accion_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    causa_raiz_descripcion = serializers.CharField(source='causa_raiz.descripcion', read_only=True)

    # Indicadores
    dias_restantes = serializers.SerializerMethodField()
    esta_vencida = serializers.SerializerMethodField()

    class Meta:
        model = AccionPlan
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']

    def get_dias_restantes(self, obj):
        from datetime import date
        if obj.estado in ['COMPLETADA', 'VERIFICADA', 'CANCELADA']:
            return None
        delta = obj.fecha_compromiso - date.today()
        return delta.days

    def get_esta_vencida(self, obj):
        from datetime import date
        if obj.estado in ['COMPLETADA', 'VERIFICADA', 'CANCELADA']:
            return False
        return obj.fecha_compromiso < date.today()

    def validate(self, data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'empresa_id'):
            data['empresa_id'] = request.user.empresa_id
        return data


class PlanAccionATELSerializer(serializers.ModelSerializer):
    """Serializer para Planes de Acción ATEL"""

    investigacion_codigo = serializers.CharField(source='investigacion.codigo_investigacion', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    verificado_por_nombre = serializers.CharField(source='verificado_por.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    # Nested serializer para acciones
    acciones = AccionPlanSerializer(many=True, read_only=True)

    # Contadores y estadísticas
    total_acciones = serializers.SerializerMethodField()
    acciones_completadas = serializers.SerializerMethodField()
    acciones_pendientes = serializers.SerializerMethodField()
    acciones_vencidas = serializers.SerializerMethodField()
    dias_restantes = serializers.SerializerMethodField()
    esta_vencido = serializers.SerializerMethodField()

    class Meta:
        model = PlanAccionATEL
        fields = '__all__'
        read_only_fields = [
            'codigo_plan',
            'fecha_creacion',
            'fecha_actualizacion',
        ]

    def get_total_acciones(self, obj):
        return obj.acciones.count()

    def get_acciones_completadas(self, obj):
        return obj.acciones.filter(estado__in=['COMPLETADA', 'VERIFICADA']).count()

    def get_acciones_pendientes(self, obj):
        return obj.acciones.filter(estado__in=['PENDIENTE', 'EN_PROGRESO']).count()

    def get_acciones_vencidas(self, obj):
        from datetime import date
        return obj.acciones.filter(
            estado__in=['PENDIENTE', 'EN_PROGRESO'],
            fecha_compromiso__lt=date.today()
        ).count()

    def get_dias_restantes(self, obj):
        from datetime import date
        if obj.estado in ['COMPLETADO', 'VERIFICADO', 'CERRADO', 'CANCELADO']:
            return None
        delta = obj.fecha_compromiso - date.today()
        return delta.days

    def get_esta_vencido(self, obj):
        from datetime import date
        if obj.estado in ['COMPLETADO', 'VERIFICADO', 'CERRADO', 'CANCELADO']:
            return False
        return obj.fecha_compromiso < date.today()

    def validate(self, data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'empresa_id'):
            data['empresa_id'] = request.user.empresa_id
        return data


# Serializers simplificados para listados
class InvestigacionATELListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de investigaciones"""

    lider_investigacion_nombre = serializers.CharField(source='lider_investigacion.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    evento_codigo = serializers.SerializerMethodField()
    evento_tipo = serializers.SerializerMethodField()
    total_causas = serializers.SerializerMethodField()

    class Meta:
        model = InvestigacionATEL
        fields = [
            'id',
            'codigo_investigacion',
            'fecha_inicio',
            'fecha_limite',
            'fecha_completada',
            'estado',
            'estado_display',
            'lider_investigacion',
            'lider_investigacion_nombre',
            'metodologia',
            'evento_codigo',
            'evento_tipo',
            'total_causas',
            'aprobada',
        ]

    def get_evento_codigo(self, obj):
        if obj.accidente_trabajo:
            return obj.accidente_trabajo.codigo_at
        elif obj.enfermedad_laboral:
            return obj.enfermedad_laboral.codigo_el
        elif obj.incidente_trabajo:
            return obj.incidente_trabajo.codigo_incidente
        return None

    def get_evento_tipo(self, obj):
        if obj.accidente_trabajo:
            return 'AT'
        elif obj.enfermedad_laboral:
            return 'EL'
        elif obj.incidente_trabajo:
            return 'INC'
        return None

    def get_total_causas(self, obj):
        return obj.causas_raiz.count()


class PlanAccionATELListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de planes de acción"""

    investigacion_codigo = serializers.CharField(source='investigacion.codigo_investigacion', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    total_acciones = serializers.SerializerMethodField()
    acciones_completadas = serializers.SerializerMethodField()

    class Meta:
        model = PlanAccionATEL
        fields = [
            'id',
            'codigo_plan',
            'nombre_plan',
            'investigacion',
            'investigacion_codigo',
            'responsable',
            'responsable_nombre',
            'fecha_inicio',
            'fecha_compromiso',
            'estado',
            'estado_display',
            'porcentaje_avance',
            'total_acciones',
            'acciones_completadas',
            'verificado',
        ]

    def get_total_acciones(self, obj):
        return obj.acciones.count()

    def get_acciones_completadas(self, obj):
        return obj.acciones.filter(estado__in=['COMPLETADA', 'VERIFICADA']).count()
