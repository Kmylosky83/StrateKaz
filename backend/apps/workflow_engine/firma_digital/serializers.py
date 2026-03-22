"""
Serializers del módulo Firma Digital - Workflow Engine
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from .models import (
    ConfiguracionFlujoFirma,
    FlowNode,
    FirmaDigital,
    HistorialFirma,
    DelegacionFirma,
    ConfiguracionRevision,
    AlertaRevision,
    HistorialVersion
)

User = get_user_model()


# ==============================================================================
# CONFIGURACIÓN DE FLUJOS
# ==============================================================================

class FlowNodeSerializer(serializers.ModelSerializer):
    """Serializer para nodos de flujo"""

    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True)
    rol_firma_display = serializers.CharField(source='get_rol_firma_display', read_only=True)

    class Meta:
        model = FlowNode
        fields = [
            'id', 'orden', 'grupo', 'rol_firma', 'rol_firma_display',
            'cargo', 'cargo_nombre', 'cargos_alternativos',
            'es_requerido', 'permite_rechazo', 'created_at'
        ]


class ConfiguracionFlujoFirmaSerializer(serializers.ModelSerializer):
    """Serializer para configuración de flujos de firma"""

    nodos = FlowNodeSerializer(many=True, read_only=True)
    tipo_flujo_display = serializers.CharField(source='get_tipo_flujo_display', read_only=True)
    total_nodos = serializers.IntegerField(source='nodos.count', read_only=True)

    class Meta:
        model = ConfiguracionFlujoFirma
        fields = [
            'id', 'nombre', 'codigo', 'descripcion',
            'tipo_flujo', 'tipo_flujo_display', 'configuracion_nodos',
            'permite_delegacion', 'dias_max_firma', 'requiere_comentario_rechazo',
            'nodos', 'total_nodos',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


class ConfiguracionFlujoFirmaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear flujos con nodos"""

    nodos = FlowNodeSerializer(many=True, required=False)

    class Meta:
        model = ConfiguracionFlujoFirma
        fields = [
            'id', 'nombre', 'codigo', 'descripcion',
            'tipo_flujo', 'configuracion_nodos',
            'permite_delegacion', 'dias_max_firma', 'requiere_comentario_rechazo',
            'nodos'
        ]

    def create(self, validated_data):
        nodos_data = validated_data.pop('nodos', [])
        flujo = ConfiguracionFlujoFirma.objects.create(**validated_data)

        # Crear nodos
        for nodo_data in nodos_data:
            FlowNode.objects.create(configuracion_flujo=flujo, **nodo_data)

        return flujo


# ==============================================================================
# FIRMA DIGITAL
# ==============================================================================

class FirmaDigitalSerializer(serializers.ModelSerializer):
    """Serializer para firmas digitales"""

    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True)
    rol_firma_display = serializers.CharField(source='get_rol_firma_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    delegante_nombre = serializers.CharField(source='delegante.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = FirmaDigital
        fields = [
            'id', 'content_type', 'object_id',
            'configuracion_flujo', 'nodo_flujo',
            'usuario', 'usuario_nombre', 'cargo', 'cargo_nombre',
            'rol_firma', 'rol_firma_display',
            'firma_imagen', 'documento_hash', 'firma_hash',
            'fecha_firma', 'ip_address', 'user_agent', 'geolocalizacion',
            'estado', 'estado_display', 'orden', 'comentarios',
            'es_delegada', 'delegante', 'delegante_nombre',
            'created_at'
        ]
        read_only_fields = ['fecha_firma', 'firma_hash', 'created_at']


class FirmaDigitalCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear firmas digitales"""

    class Meta:
        model = FirmaDigital
        fields = [
            'content_type', 'object_id', 'configuracion_flujo',
            'rol_firma', 'firma_imagen', 'documento_hash',
            'ip_address', 'user_agent', 'geolocalizacion', 'comentarios'
        ]

    def validate_firma_imagen(self, value):
        """Validar formato base64 de la firma"""
        if not value.startswith('data:image'):
            raise serializers.ValidationError("La firma debe estar en formato base64 data URI")
        return value

    def create(self, validated_data):
        # El usuario y cargo se obtienen del request
        request = self.context.get('request')
        validated_data['usuario'] = request.user
        validated_data['cargo'] = request.user.cargo

        return super().create(validated_data)


class HistorialFirmaSerializer(serializers.ModelSerializer):
    """Serializer para historial de firmas"""

    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    accion_display = serializers.CharField(source='get_accion_display', read_only=True)

    class Meta:
        model = HistorialFirma
        fields = [
            'id', 'firma', 'accion', 'accion_display',
            'usuario', 'usuario_nombre', 'descripcion', 'metadatos',
            'ip_address', 'created_at'
        ]
        read_only_fields = ['created_at']


# ==============================================================================
# DELEGACIÓN
# ==============================================================================

class DelegacionFirmaSerializer(serializers.ModelSerializer):
    """Serializer para delegaciones de firma"""

    delegante_nombre = serializers.CharField(source='delegante.get_full_name', read_only=True)
    delegado_nombre = serializers.CharField(source='delegado.get_full_name', read_only=True)
    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True)
    esta_vigente = serializers.SerializerMethodField()
    dias_restantes = serializers.SerializerMethodField()

    class Meta:
        model = DelegacionFirma
        fields = [
            'id', 'delegante', 'delegante_nombre', 'delegado', 'delegado_nombre',
            'cargo', 'cargo_nombre', 'roles_delegados',
            'fecha_inicio', 'fecha_fin', 'motivo',
            'esta_activa', 'esta_vigente', 'dias_restantes',
            'fecha_revocacion', 'motivo_revocacion',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'fecha_revocacion']

    def get_esta_vigente(self, obj):
        return obj.is_vigente()

    def get_dias_restantes(self, obj):
        from django.utils import timezone
        if obj.is_vigente():
            delta = obj.fecha_fin - timezone.now()
            return delta.days
        return 0


# ==============================================================================
# REVISIÓN PERIÓDICA
# ==============================================================================

class ConfiguracionRevisionSerializer(serializers.ModelSerializer):
    """Serializer para configuración de revisión periódica"""

    frecuencia_display = serializers.CharField(source='get_frecuencia_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable_revision.nombre', read_only=True)
    escalamiento_nombre = serializers.CharField(source='responsable_escalamiento.nombre', read_only=True, allow_null=True)

    class Meta:
        model = ConfiguracionRevision
        fields = [
            'id', 'nombre', 'descripcion',
            'frecuencia', 'frecuencia_display', 'dias_personalizados',
            'dias_alerta_1', 'dias_alerta_2', 'dias_alerta_3',
            'alerta_dia_vencimiento', 'alertas_post_vencimiento', 'dias_escalamiento',
            'responsable_revision', 'responsable_nombre',
            'responsable_escalamiento', 'escalamiento_nombre',
            'renovacion_automatica', 'requiere_revision_contenido', 'flujo_firma_renovacion',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        """Validar que si es personalizado, tenga días"""
        if data.get('frecuencia') == 'PERSONALIZADO' and not data.get('dias_personalizados'):
            raise serializers.ValidationError({
                'dias_personalizados': 'Debe especificar días personalizados para frecuencia personalizada'
            })
        return data


class AlertaRevisionSerializer(serializers.ModelSerializer):
    """Serializer para alertas de revisión"""

    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    destinatarios_nombres = serializers.SerializerMethodField()
    atendida_por_nombre = serializers.CharField(source='atendida_por.get_full_name', read_only=True, allow_null=True)
    dias_hasta_vencimiento = serializers.SerializerMethodField()

    class Meta:
        model = AlertaRevision
        fields = [
            'id', 'content_type', 'object_id',
            'configuracion_revision', 'tipo_alerta',
            'fecha_vencimiento', 'fecha_programada', 'fecha_envio',
            'destinatarios', 'destinatarios_nombres',
            'estado', 'estado_display',
            'atendida_por', 'atendida_por_nombre', 'fecha_atencion', 'notas_atencion',
            'tarea', 'notificacion', 'dias_hasta_vencimiento',
            'created_at'
        ]
        read_only_fields = ['created_at', 'fecha_envio', 'fecha_atencion']

    def get_destinatarios_nombres(self, obj):
        return [user.get_full_name() for user in obj.destinatarios.all()]

    def get_dias_hasta_vencimiento(self, obj):
        from django.utils import timezone
        delta = obj.fecha_vencimiento - timezone.now().date()
        return delta.days


# ==============================================================================
# VERSIONAMIENTO
# ==============================================================================

class HistorialVersionSerializer(serializers.ModelSerializer):
    """Serializer para historial de versiones"""

    tipo_cambio_display = serializers.CharField(source='get_tipo_cambio_display', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario_version.get_full_name', read_only=True)
    total_firmas = serializers.IntegerField(source='firmas.count', read_only=True)
    tamano_contenido = serializers.SerializerMethodField()

    class Meta:
        model = HistorialVersion
        fields = [
            'id', 'content_type', 'object_id',
            'version', 'version_anterior', 'tipo_cambio', 'tipo_cambio_display',
            'titulo', 'contenido_hash', 'tamano_contenido',
            'motivo_cambio', 'cambios_realizados',
            'fecha_version', 'usuario_version', 'usuario_nombre',
            'estado_documento', 'total_firmas',
            'archivo_pdf', 'archivo_original',
            'created_at'
        ]
        read_only_fields = ['contenido_hash', 'fecha_version', 'created_at']

    def get_tamano_contenido(self, obj):
        """Retorna el tamaño del contenido en caracteres"""
        return len(obj.contenido) if obj.contenido else 0


class HistorialVersionDetailSerializer(HistorialVersionSerializer):
    """Serializer detallado con contenido completo"""

    firmas = FirmaDigitalSerializer(many=True, read_only=True)
    comparacion = serializers.SerializerMethodField()

    class Meta(HistorialVersionSerializer.Meta):
        fields = HistorialVersionSerializer.Meta.fields + ['contenido', 'diff_texto', 'firmas', 'comparacion']

    def get_comparacion(self, obj):
        """Obtiene la comparación con la versión anterior"""
        return obj.comparar_con_anterior()


class VersionComparisonSerializer(serializers.Serializer):
    """Serializer para comparación entre versiones"""

    version_1 = serializers.CharField()
    version_2 = serializers.CharField()
    diff_html = serializers.CharField(read_only=True)
    cambios = serializers.JSONField(read_only=True)


# ==============================================================================
# ACCIONES DE WORKFLOW
# ==============================================================================

class IniciarRevisionSerializer(serializers.Serializer):
    """Serializer para iniciar proceso de revisión"""

    configuracion_flujo_id = serializers.UUIDField(required=True)
    comentarios = serializers.CharField(required=False, allow_blank=True)


class FirmarDocumentoSerializer(serializers.Serializer):
    """Serializer para firmar documento"""

    firma_imagen = serializers.CharField(required=True)
    rol_firma = serializers.ChoiceField(choices=['ELABORO', 'REVISO', 'APROBO', 'VALIDO', 'AUTORIZO'])
    comentarios = serializers.CharField(required=False, allow_blank=True)
    geolocalizacion = serializers.JSONField(required=False, allow_null=True)


class RechazarDocumentoSerializer(serializers.Serializer):
    """Serializer para rechazar documento"""

    motivo = serializers.CharField(required=True, min_length=10)
    comentarios_adicionales = serializers.CharField(required=False, allow_blank=True)


class DelegarFirmaSerializer(serializers.Serializer):
    """Serializer para delegar firma"""

    delegado_id = serializers.UUIDField(required=True)
    roles_delegados = serializers.ListField(
        child=serializers.CharField(),
        required=True
    )
    fecha_inicio = serializers.DateTimeField(required=True)
    fecha_fin = serializers.DateTimeField(required=True)
    motivo = serializers.CharField(required=True)

    def validate(self, data):
        if data['fecha_inicio'] >= data['fecha_fin']:
            raise serializers.ValidationError("La fecha de inicio debe ser anterior a la fecha de fin")
        return data


class FirmarFirmaActionSerializer(serializers.Serializer):
    """Serializer para la accion firmar sobre una FirmaDigital existente (detail action)"""

    firma_base64 = serializers.CharField(required=True, help_text='Imagen de firma en base64/DataURL')
    firma_hash = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    observaciones = serializers.CharField(required=False, allow_blank=True, default='')
    ip_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    user_agent = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    # 2FA reconfirmación al firmar (ISO 27001)
    totp_code = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=6,
        help_text='Código TOTP de 6 dígitos (requerido para nivel_firma >= 2)'
    )
    email_otp_code = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=6,
        help_text='Código OTP enviado por email (alternativa para nivel_firma >= 3)'
    )


class RechazarFirmaActionSerializer(serializers.Serializer):
    """Serializer para rechazar una FirmaDigital existente (detail action)"""

    motivo = serializers.CharField(required=True, min_length=5)


class DelegarFirmaActionSerializer(serializers.Serializer):
    """Serializer para delegar una FirmaDigital existente a otro usuario (detail action)"""

    nuevo_firmante_id = serializers.IntegerField(required=True)
    motivo = serializers.CharField(required=True, min_length=5)


class RevocarDelegacionSerializer(serializers.Serializer):
    """Serializer para revocar delegación"""

    motivo = serializers.CharField(required=True)


class ConfigurarRevisionSerializer(serializers.Serializer):
    """Serializer para configurar revisión periódica"""

    configuracion_revision_id = serializers.UUIDField(required=True)
    fecha_vigencia = serializers.DateField(required=False, allow_null=True)


class RenovarPoliticaSerializer(serializers.Serializer):
    """Serializer para renovar política"""

    tipo_renovacion = serializers.ChoiceField(
        choices=['SIMPLE', 'CON_CAMBIOS'],
        required=True
    )
    cambios = serializers.JSONField(required=False, allow_null=True)
    motivo = serializers.CharField(required=False, allow_blank=True)
    tipo_version = serializers.ChoiceField(
        choices=['MAJOR', 'MINOR', 'PATCH'],
        required=False,
        default='PATCH'
    )


class VerificarIntegridadSerializer(serializers.Serializer):
    """Serializer para verificar integridad de firma"""

    firma_id = serializers.UUIDField(required=True)
    contenido_actual = serializers.CharField(required=True)


class AsignarFirmantesSerializer(serializers.Serializer):
    """
    Serializer para asignar firmantes a un documento en estado BORRADOR.

    Crea batch de FirmaDigital registros en estado PENDIENTE.
    """

    content_type = serializers.IntegerField(
        required=True,
        help_text='ContentType ID del modelo Documento'
    )
    object_id = serializers.UUIDField(
        required=True,
        help_text='UUID del documento'
    )
    firmantes = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        min_length=1,
        help_text='Lista de firmantes: [{usuario_id, cargo_id, rol_firma, orden}]'
    )

    def validate_firmantes(self, value):
        """Validar estructura de cada firmante."""
        from .models import ROL_FIRMA_CHOICES

        roles_validos = [r[0] for r in ROL_FIRMA_CHOICES]
        required_fields = ['usuario_id', 'cargo_id', 'rol_firma', 'orden']

        for idx, firmante in enumerate(value):
            for field in required_fields:
                if field not in firmante:
                    raise serializers.ValidationError(
                        f'Firmante {idx + 1}: campo "{field}" es requerido'
                    )

            if firmante['rol_firma'] not in roles_validos:
                raise serializers.ValidationError(
                    f'Firmante {idx + 1}: rol_firma inválido "{firmante["rol_firma"]}". '
                    f'Opciones: {roles_validos}'
                )

        # Validar orden único
        ordenes = [f['orden'] for f in value]
        if len(ordenes) != len(set(ordenes)):
            raise serializers.ValidationError(
                'Los valores de "orden" deben ser únicos entre firmantes'
            )

        return value
