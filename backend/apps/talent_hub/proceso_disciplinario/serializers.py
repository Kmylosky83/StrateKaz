"""
Serializers para proceso_disciplinario - Talent Hub

Serializers para gestión completa del proceso disciplinario.
"""
from rest_framework import serializers
from django.utils import timezone

from .models import (
    TipoFalta, LlamadoAtencion, Descargo, Memorando, HistorialDisciplinario,
    NotificacionDisciplinaria, PruebaDisciplinaria, DenunciaAcosoLaboral
)


# =============================================================================
# TIPO DE FALTA SERIALIZERS
# =============================================================================

class TipoFaltaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de tipos de falta."""

    gravedad_display = serializers.CharField(source='get_gravedad_display', read_only=True)
    sancion_sugerida_display = serializers.CharField(
        source='get_sancion_sugerida_display',
        read_only=True
    )

    class Meta:
        model = TipoFalta
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'gravedad', 'gravedad_display',
            'sancion_sugerida', 'sancion_sugerida_display',
            'reincidencia_agrava', 'dias_prescripcion',
            'articulo_reglamento', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TipoFaltaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para tipo de falta."""

    gravedad_display = serializers.CharField(source='get_gravedad_display', read_only=True)
    sancion_sugerida_display = serializers.CharField(
        source='get_sancion_sugerida_display',
        read_only=True
    )
    es_falta_grave = serializers.BooleanField(read_only=True)
    requiere_descargos = serializers.BooleanField(read_only=True)

    # Estadísticas
    total_llamados = serializers.SerializerMethodField()
    total_descargos = serializers.SerializerMethodField()
    total_memorandos = serializers.SerializerMethodField()

    class Meta:
        model = TipoFalta
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_total_llamados(self, obj):
        """Total de llamados de atención por esta falta."""
        return obj.llamados_atencion.filter(is_active=True).count()

    def get_total_descargos(self, obj):
        """Total de descargos por esta falta."""
        return obj.descargos.filter(is_active=True).count()

    def get_total_memorandos(self, obj):
        """Total de memorandos por esta falta."""
        return obj.memorandos.filter(is_active=True).count()


class TipoFaltaCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de tipo de falta."""

    class Meta:
        model = TipoFalta
        fields = [
            'codigo', 'nombre', 'descripcion',
            'gravedad', 'sancion_sugerida',
            'reincidencia_agrava', 'dias_prescripcion',
            'articulo_reglamento'
        ]

    def validate_codigo(self, value):
        """Validar que el código sea único para la empresa."""
        empresa = self.context['request'].user.empresa
        if TipoFalta.objects.filter(empresa=empresa, codigo=value, is_active=True).exists():
            raise serializers.ValidationError("Ya existe un tipo de falta con este código.")
        return value.upper()


# =============================================================================
# LLAMADO DE ATENCIÓN SERIALIZERS
# =============================================================================

class LlamadoAtencionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de llamados de atención."""

    colaborador_nombre = serializers.CharField(
        source='colaborador.get_nombre_completo',
        read_only=True
    )
    colaborador_identificacion = serializers.CharField(
        source='colaborador.numero_identificacion',
        read_only=True
    )
    tipo_falta_nombre = serializers.CharField(source='tipo_falta.nombre', read_only=True)
    tipo_falta_gravedad = serializers.CharField(source='tipo_falta.gravedad', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    realizado_por_nombre = serializers.CharField(
        source='realizado_por.get_full_name',
        read_only=True
    )

    class Meta:
        model = LlamadoAtencion
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'colaborador_identificacion',
            'tipo_falta', 'tipo_falta_nombre', 'tipo_falta_gravedad',
            'fecha_falta', 'fecha_llamado',
            'tipo', 'tipo_display',
            'realizado_por_nombre',
            'firmado_colaborador', 'is_active',
            'created_at'
        ]
        read_only_fields = ['created_at']


class LlamadoAtencionDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para llamado de atención."""

    colaborador_info = serializers.SerializerMethodField()
    tipo_falta_info = serializers.SerializerMethodField()
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    realizado_por_nombre = serializers.CharField(
        source='realizado_por.get_full_name',
        read_only=True
    )
    es_escrito = serializers.BooleanField(read_only=True)
    requiere_firma = serializers.BooleanField(read_only=True)
    esta_firmado = serializers.BooleanField(read_only=True)

    class Meta:
        model = LlamadoAtencion
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_colaborador_info(self, obj):
        """Información básica del colaborador."""
        return {
            'id': obj.colaborador.id,
            'nombre_completo': obj.colaborador.get_nombre_completo(),
            'numero_identificacion': obj.colaborador.numero_identificacion,
            'cargo': obj.colaborador.cargo.nombre if obj.colaborador.cargo else None,
            'area': obj.colaborador.area.nombre if obj.colaborador.area else None,
        }

    def get_tipo_falta_info(self, obj):
        """Información del tipo de falta."""
        return {
            'id': obj.tipo_falta.id,
            'codigo': obj.tipo_falta.codigo,
            'nombre': obj.tipo_falta.nombre,
            'gravedad': obj.tipo_falta.gravedad,
            'gravedad_display': obj.tipo_falta.get_gravedad_display(),
        }


class LlamadoAtencionCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de llamado de atención."""

    class Meta:
        model = LlamadoAtencion
        fields = [
            'colaborador', 'tipo_falta', 'fecha_falta', 'descripcion_hechos',
            'tipo', 'testigos', 'compromiso_colaborador', 'fecha_llamado',
            'realizado_por', 'firmado_colaborador', 'fecha_firma',
            'archivo_soporte'
        ]

    def validate(self, attrs):
        """Validaciones cruzadas."""
        # Validar que fecha_llamado no sea anterior a fecha_falta
        if attrs.get('fecha_llamado') and attrs.get('fecha_falta'):
            if attrs['fecha_llamado'] < attrs['fecha_falta']:
                raise serializers.ValidationError({
                    'fecha_llamado': 'La fecha del llamado no puede ser anterior a la fecha de la falta.'
                })

        # Si es escrito y firmado, debe tener fecha de firma
        if attrs.get('tipo') == 'escrito' and attrs.get('firmado_colaborador'):
            if not attrs.get('fecha_firma'):
                raise serializers.ValidationError({
                    'fecha_firma': 'Debe registrar la fecha de firma para llamados escritos firmados.'
                })

        return attrs


# =============================================================================
# DESCARGO SERIALIZERS
# =============================================================================

class DescargoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de descargos."""

    colaborador_nombre = serializers.CharField(
        source='colaborador.get_nombre_completo',
        read_only=True
    )
    tipo_falta_nombre = serializers.CharField(source='tipo_falta.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    decision_display = serializers.CharField(source='get_decision_display', read_only=True)
    tipo_acompanante_display = serializers.CharField(
        source='get_tipo_acompanante_display', read_only=True
    )

    class Meta:
        model = Descargo
        fields = [
            'id', 'colaborador', 'colaborador_nombre',
            'tipo_falta', 'tipo_falta_nombre',
            'fecha_citacion', 'fecha_descargo',
            'estado', 'estado_display',
            'decision', 'decision_display',
            'tipo_acompanante', 'tipo_acompanante_display',
            'apelado', 'resultado_apelacion',
            'created_at'
        ]
        read_only_fields = ['created_at']


class DescargoDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para descargo."""

    colaborador_info = serializers.SerializerMethodField()
    tipo_falta_info = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    decision_display = serializers.CharField(source='get_decision_display', read_only=True)
    tipo_acompanante_display = serializers.CharField(
        source='get_tipo_acompanante_display', read_only=True
    )
    resultado_apelacion_display = serializers.CharField(
        source='get_resultado_apelacion_display', read_only=True
    )
    decidido_por_nombre = serializers.CharField(
        source='decidido_por.get_full_name',
        read_only=True
    )
    resuelto_por_nombre = serializers.CharField(
        source='resuelto_por.get_full_name',
        read_only=True,
        default=None
    )
    esta_pendiente = serializers.BooleanField(read_only=True)
    fue_realizado = serializers.BooleanField(read_only=True)
    tiene_decision = serializers.BooleanField(read_only=True)
    fue_sancionado = serializers.BooleanField(read_only=True)
    tiene_acompanante = serializers.BooleanField(read_only=True)

    # Pruebas y notificaciones asociadas
    pruebas = serializers.SerializerMethodField()
    notificaciones = serializers.SerializerMethodField()

    class Meta:
        model = Descargo
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_colaborador_info(self, obj):
        """Información básica del colaborador."""
        return {
            'id': obj.colaborador.id,
            'nombre_completo': obj.colaborador.get_nombre_completo(),
            'numero_identificacion': obj.colaborador.numero_identificacion,
            'cargo': obj.colaborador.cargo.nombre if obj.colaborador.cargo else None,
        }

    def get_tipo_falta_info(self, obj):
        """Información del tipo de falta."""
        return {
            'id': obj.tipo_falta.id,
            'codigo': obj.tipo_falta.codigo,
            'nombre': obj.tipo_falta.nombre,
            'gravedad': obj.tipo_falta.gravedad,
        }

    def get_pruebas(self, obj):
        """Pruebas asociadas al descargo."""
        pruebas = obj.pruebas.filter(is_active=True)
        return PruebaDisciplinariaSerializer(pruebas, many=True).data

    def get_notificaciones(self, obj):
        """Notificaciones asociadas al descargo."""
        notificaciones = obj.notificaciones.filter(is_active=True)
        return NotificacionDisciplinariaSerializer(notificaciones, many=True).data


class DescargoCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de descargo (citación)."""

    class Meta:
        model = Descargo
        fields = [
            'colaborador', 'tipo_falta', 'llamado_atencion_previo',
            'fecha_citacion', 'fecha_descargo', 'hora_citacion',
            'lugar_citacion', 'descripcion_cargos',
            'tipo_acompanante', 'nombre_acompanante', 'representante_sindical',
        ]

    def validate(self, attrs):
        """Validaciones."""
        # Validar que fecha_descargo sea posterior a fecha_citacion
        if attrs.get('fecha_descargo') and attrs.get('fecha_citacion'):
            if attrs['fecha_descargo'] < attrs['fecha_citacion']:
                raise serializers.ValidationError({
                    'fecha_descargo': 'La fecha del descargo debe ser posterior a la citación.'
                })

        # Ley 2466/2025: Mínimo 5 días entre hoy y la citación (solo para nuevos)
        if not self.instance and attrs.get('fecha_citacion'):
            hoy = timezone.now().date()
            dias = (attrs['fecha_citacion'] - hoy).days
            if dias < 5:
                raise serializers.ValidationError({
                    'fecha_citacion': 'Mínimo 5 días hábiles entre la citación y la diligencia (Ley 2466/2025 Art.7).'
                })

        # Si tiene acompañante, debe indicar nombre
        tipo_acomp = attrs.get('tipo_acompanante', 'ninguno')
        if tipo_acomp != 'ninguno' and not attrs.get('nombre_acompanante'):
            raise serializers.ValidationError({
                'nombre_acompanante': 'Debe indicar el nombre del acompañante.'
            })

        return attrs


class RegistrarDescargoSerializer(serializers.Serializer):
    """Serializer para registrar el descargo realizado."""

    fecha_descargo_realizado = serializers.DateField()
    descargo_colaborador = serializers.CharField(allow_blank=True, required=False)
    pruebas_presentadas = serializers.CharField(allow_blank=True, required=False)
    testigos_colaborador = serializers.CharField(allow_blank=True, required=False)
    testigos_empresa = serializers.CharField(allow_blank=True, required=False)
    estado = serializers.ChoiceField(choices=['realizado', 'no_asistio'])


class DecidirDescargoSerializer(serializers.Serializer):
    """Serializer para registrar la decisión del descargo."""

    decision = serializers.ChoiceField(choices=['absuelto', 'sancionado'])
    justificacion_decision = serializers.CharField()
    fecha_decision = serializers.DateField()


# =============================================================================
# MEMORANDO SERIALIZERS
# =============================================================================

class MemorandoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de memorandos."""

    colaborador_nombre = serializers.CharField(
        source='colaborador.get_nombre_completo',
        read_only=True
    )
    tipo_falta_nombre = serializers.CharField(source='tipo_falta.nombre', read_only=True)
    sancion_aplicada_display = serializers.CharField(
        source='get_sancion_aplicada_display',
        read_only=True
    )
    elaborado_por_nombre = serializers.CharField(
        source='elaborado_por.get_full_name',
        read_only=True
    )

    class Meta:
        model = Memorando
        fields = [
            'id', 'numero_memorando', 'fecha_memorando',
            'colaborador', 'colaborador_nombre',
            'tipo_falta', 'tipo_falta_nombre',
            'sancion_aplicada', 'sancion_aplicada_display',
            'dias_suspension', 'apelado', 'firmado_colaborador',
            'elaborado_por_nombre',
            'created_at'
        ]
        read_only_fields = ['created_at']


class MemorandoDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para memorando."""

    colaborador_info = serializers.SerializerMethodField()
    tipo_falta_info = serializers.SerializerMethodField()
    sancion_aplicada_display = serializers.CharField(
        source='get_sancion_aplicada_display',
        read_only=True
    )
    resultado_apelacion_display = serializers.CharField(
        source='get_resultado_apelacion_display',
        read_only=True
    )
    elaborado_por_nombre = serializers.CharField(
        source='elaborado_por.get_full_name',
        read_only=True
    )
    es_suspension = serializers.BooleanField(read_only=True)
    suspension_activa = serializers.BooleanField(read_only=True)
    puede_apelar = serializers.BooleanField(read_only=True)

    class Meta:
        model = Memorando
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_colaborador_info(self, obj):
        """Información básica del colaborador."""
        return {
            'id': obj.colaborador.id,
            'nombre_completo': obj.colaborador.get_nombre_completo(),
            'numero_identificacion': obj.colaborador.numero_identificacion,
            'cargo': obj.colaborador.cargo.nombre if obj.colaborador.cargo else None,
        }

    def get_tipo_falta_info(self, obj):
        """Información del tipo de falta."""
        return {
            'id': obj.tipo_falta.id,
            'codigo': obj.tipo_falta.codigo,
            'nombre': obj.tipo_falta.nombre,
            'gravedad': obj.tipo_falta.gravedad,
        }


class MemorandoCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de memorando."""

    class Meta:
        model = Memorando
        fields = [
            'colaborador', 'descargo', 'numero_memorando', 'fecha_memorando',
            'tipo_falta', 'descripcion', 'sancion_aplicada',
            'dias_suspension', 'fecha_inicio_suspension', 'fecha_fin_suspension',
            'archivo_memorando', 'elaborado_por'
        ]

    def validate_numero_memorando(self, value):
        """Validar que el número de memorando sea único para la empresa."""
        empresa = self.context['request'].user.empresa
        if Memorando.objects.filter(empresa=empresa, numero_memorando=value, is_active=True).exists():
            raise serializers.ValidationError("Ya existe un memorando con este número.")
        return value

    def validate(self, attrs):
        """Validaciones cruzadas."""
        # Si es suspensión, validar días y fechas
        if attrs.get('sancion_aplicada') == 'suspension':
            if not attrs.get('dias_suspension'):
                raise serializers.ValidationError({
                    'dias_suspension': 'Debe especificar los días de suspensión.'
                })
            if not attrs.get('fecha_inicio_suspension') or not attrs.get('fecha_fin_suspension'):
                raise serializers.ValidationError({
                    'fecha_inicio_suspension': 'Debe especificar las fechas de suspensión.'
                })

            # Validar coherencia de fechas
            if attrs['fecha_fin_suspension'] < attrs['fecha_inicio_suspension']:
                raise serializers.ValidationError({
                    'fecha_fin_suspension': 'La fecha de fin debe ser posterior al inicio.'
                })

        return attrs


class ApelarMemorandoSerializer(serializers.Serializer):
    """Serializer para registrar apelación de memorando."""

    fecha_apelacion = serializers.DateField()


class ResolverApelacionSerializer(serializers.Serializer):
    """Serializer para resolver apelación."""

    resultado_apelacion = serializers.ChoiceField(
        choices=['confirmado', 'modificado', 'revocado']
    )


# =============================================================================
# HISTORIAL DISCIPLINARIO SERIALIZERS
# =============================================================================

class HistorialDisciplinarioSerializer(serializers.ModelSerializer):
    """Serializer para historial disciplinario."""

    colaborador_nombre = serializers.CharField(
        source='colaborador.get_nombre_completo',
        read_only=True
    )
    colaborador_identificacion = serializers.CharField(
        source='colaborador.numero_identificacion',
        read_only=True
    )
    colaborador_cargo = serializers.CharField(
        source='colaborador.cargo.nombre',
        read_only=True
    )
    tiene_antecedentes = serializers.BooleanField(read_only=True)
    nivel_riesgo = serializers.CharField(read_only=True)

    class Meta:
        model = HistorialDisciplinario
        fields = '__all__'
        read_only_fields = [
            'empresa', 'colaborador',
            'total_llamados_atencion', 'total_descargos', 'total_memorandos',
            'total_suspensiones', 'dias_suspension_acumulados',
            'ultima_falta', 'ultima_sancion',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]


class HistorialDisciplinarioDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado con registros completos."""

    colaborador_info = serializers.SerializerMethodField()
    tiene_antecedentes = serializers.BooleanField(read_only=True)
    nivel_riesgo = serializers.CharField(read_only=True)

    # Registros recientes
    llamados_recientes = serializers.SerializerMethodField()
    descargos_recientes = serializers.SerializerMethodField()
    memorandos_recientes = serializers.SerializerMethodField()

    class Meta:
        model = HistorialDisciplinario
        fields = '__all__'
        read_only_fields = [
            'empresa', 'colaborador',
            'total_llamados_atencion', 'total_descargos', 'total_memorandos',
            'total_suspensiones', 'dias_suspension_acumulados',
            'ultima_falta', 'ultima_sancion',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def get_colaborador_info(self, obj):
        """Información completa del colaborador."""
        return {
            'id': obj.colaborador.id,
            'nombre_completo': obj.colaborador.get_nombre_completo(),
            'numero_identificacion': obj.colaborador.numero_identificacion,
            'cargo': obj.colaborador.cargo.nombre if obj.colaborador.cargo else None,
            'area': obj.colaborador.area.nombre if obj.colaborador.area else None,
            'estado': obj.colaborador.estado,
        }

    def get_llamados_recientes(self, obj):
        """Últimos 5 llamados de atención."""
        llamados = obj.colaborador.llamados_atencion.filter(
            is_active=True
        ).order_by('-fecha_llamado')[:5]
        return LlamadoAtencionListSerializer(llamados, many=True).data

    def get_descargos_recientes(self, obj):
        """Últimos 5 descargos."""
        descargos = obj.colaborador.descargos.filter(
            is_active=True
        ).order_by('-fecha_descargo')[:5]
        return DescargoListSerializer(descargos, many=True).data

    def get_memorandos_recientes(self, obj):
        """Últimos 5 memorandos."""
        memorandos = obj.colaborador.memorandos.filter(
            is_active=True
        ).order_by('-fecha_memorando')[:5]
        return MemorandoListSerializer(memorandos, many=True).data


# =============================================================================
# NOTIFICACIÓN DISCIPLINARIA SERIALIZERS (Ley 2466/2025)
# =============================================================================

class NotificacionDisciplinariaSerializer(serializers.ModelSerializer):
    """Serializer para notificaciones disciplinarias."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    colaborador_nombre = serializers.CharField(
        source='colaborador.get_nombre_completo', read_only=True
    )

    class Meta:
        model = NotificacionDisciplinaria
        fields = [
            'id', 'colaborador', 'colaborador_nombre',
            'descargo', 'memorando',
            'tipo', 'tipo_display', 'contenido',
            'fecha_entrega', 'acuse_recibo', 'fecha_acuse',
            'testigo_entrega', 'archivo_soporte',
            'created_at',
        ]
        read_only_fields = ['created_at']


class NotificacionDisciplinariaCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de notificación disciplinaria."""

    class Meta:
        model = NotificacionDisciplinaria
        fields = [
            'colaborador', 'descargo', 'memorando',
            'tipo', 'contenido', 'fecha_entrega',
            'testigo_entrega', 'archivo_soporte',
        ]

    def validate(self, attrs):
        if not attrs.get('descargo') and not attrs.get('memorando'):
            raise serializers.ValidationError(
                'Debe asociar la notificación a un descargo o memorando.'
            )
        return attrs


# =============================================================================
# PRUEBA DISCIPLINARIA SERIALIZERS (Ley 2466/2025)
# =============================================================================

class PruebaDisciplinariaSerializer(serializers.ModelSerializer):
    """Serializer para pruebas disciplinarias."""

    tipo_prueba_display = serializers.CharField(
        source='get_tipo_prueba_display', read_only=True
    )
    presentada_por_display = serializers.CharField(
        source='get_presentada_por_display', read_only=True
    )

    class Meta:
        model = PruebaDisciplinaria
        fields = [
            'id', 'descargo',
            'tipo_prueba', 'tipo_prueba_display',
            'descripcion',
            'presentada_por', 'presentada_por_display',
            'archivo', 'fecha_presentacion',
            'admitida', 'observaciones_admision',
            'created_at',
        ]
        read_only_fields = ['fecha_presentacion', 'created_at']


class PruebaDisciplinariaCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de prueba disciplinaria."""

    class Meta:
        model = PruebaDisciplinaria
        fields = [
            'descargo', 'tipo_prueba', 'descripcion',
            'presentada_por', 'archivo',
        ]


class ApelarDescargoSerializer(serializers.Serializer):
    """Serializer para registrar apelación de descargo (Ley 2466/2025)."""

    motivo_apelacion = serializers.CharField()
    fecha_apelacion = serializers.DateField()


class ResolverApelacionDescargoSerializer(serializers.Serializer):
    """Serializer para resolver apelación de descargo."""

    resultado_apelacion = serializers.ChoiceField(
        choices=['confirmado', 'modificado', 'revocado']
    )
    justificacion = serializers.CharField(required=False, allow_blank=True)


# =============================================================================
# DENUNCIA ACOSO LABORAL - Ley 1010/2006
# =============================================================================

class DenunciaAcosoLaboralListSerializer(serializers.ModelSerializer):
    """Serializer de lista para denuncias de acoso laboral."""
    denunciado_nombre = serializers.CharField(source='denunciado.get_nombre_completo', read_only=True)
    tipo_acoso_display = serializers.CharField(source='get_tipo_acoso_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    testigos_count = serializers.SerializerMethodField()

    class Meta:
        model = DenunciaAcosoLaboral
        fields = [
            'id', 'es_anonima', 'denunciado', 'denunciado_nombre',
            'tipo_acoso', 'tipo_acoso_display',
            'fecha_hechos', 'estado', 'estado_display',
            'comite_convivencia_notificado', 'testigos_count',
            'created_at'
        ]
        read_only_fields = ['created_at']

    def get_testigos_count(self, obj):
        return obj.testigos.count()


class DenunciaAcosoLaboralDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para denuncias de acoso laboral."""
    denunciado_nombre = serializers.CharField(source='denunciado.get_nombre_completo', read_only=True)
    tipo_acoso_display = serializers.CharField(source='get_tipo_acoso_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    testigos_count = serializers.SerializerMethodField()

    class Meta:
        model = DenunciaAcosoLaboral
        fields = '__all__'
        read_only_fields = [
            'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def get_testigos_count(self, obj):
        return obj.testigos.count()


class DenunciaAcosoLaboralCreateSerializer(serializers.ModelSerializer):
    """Serializer de creación para denuncias de acoso laboral."""

    class Meta:
        model = DenunciaAcosoLaboral
        fields = [
            'es_anonima', 'denunciado', 'tipo_acoso',
            'descripcion_hechos', 'fecha_hechos', 'lugar_hechos',
            'testigos', 'evidencia'
        ]

    def validate(self, data):
        """Validaciones."""
        # Si es anónima, no asignar denunciante
        if data.get('es_anonima'):
            return data
        return data

    def create(self, validated_data):
        """Asignar denunciante si no es anónima."""
        testigos = validated_data.pop('testigos', [])
        request = self.context.get('request')
        if request and not validated_data.get('es_anonima'):
            validated_data['denunciante'] = request.user
        instance = super().create(validated_data)
        if testigos:
            instance.testigos.set(testigos)
        return instance


class CambiarEstadoDenunciaSerializer(serializers.Serializer):
    """Serializer para cambiar estado de una denuncia."""
    estado = serializers.ChoiceField(
        choices=['recibida', 'investigacion', 'comite', 'resolucion', 'cerrada', 'archivada']
    )
    observacion = serializers.CharField(required=False, allow_blank=True)
