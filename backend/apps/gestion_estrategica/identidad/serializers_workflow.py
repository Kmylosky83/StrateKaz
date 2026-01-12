"""
Serializers para el sistema de Workflow de Firmas Digitales y Revisión Periódica
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from .models_workflow import (
    FirmaDigital,
    ConfiguracionRevision,
    HistorialVersion,
    ConfiguracionWorkflowFirma,
)
from apps.core.models import Cargo

User = get_user_model()


# =============================================================================
# SERIALIZERS - FIRMA DIGITAL
# =============================================================================

class FirmanteSerializer(serializers.ModelSerializer):
    """Serializer para información del firmante"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'cargo_nombre']
        read_only_fields = fields


class FirmaDigitalSerializer(serializers.ModelSerializer):
    """Serializer principal para FirmaDigital"""
    firmante_info = FirmanteSerializer(source='firmante', read_only=True)
    delegado_por_info = FirmanteSerializer(source='delegado_por', read_only=True)
    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True, allow_null=True)
    rol_firma_display = serializers.CharField(source='get_rol_firma_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    es_mi_turno = serializers.SerializerMethodField()
    esta_vencida = serializers.BooleanField(read_only=True)

    class Meta:
        model = FirmaDigital
        fields = [
            'id',
            'content_type',
            'object_id',
            'firmante',
            'firmante_info',
            'cargo',
            'cargo_nombre',
            'rol_firma',
            'rol_firma_display',
            'orden_firma',
            'firma_manuscrita',
            'firma_hash',
            'status',
            'status_display',
            'fecha_firma',
            'fecha_vencimiento',
            'observaciones',
            'motivo_rechazo',
            'delegado_por',
            'delegado_por_info',
            'fecha_delegacion',
            'motivo_delegacion',
            'ip_address',
            'user_agent',
            'geolocation',
            'es_mi_turno',
            'esta_vencida',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'firma_hash',
            'fecha_firma',
            'ip_address',
            'user_agent',
            'geolocation',
            'created_at',
            'updated_at',
        ]

    def get_es_mi_turno(self, obj):
        """Verifica si es el turno del firmante"""
        return obj.es_mi_turno()


class FirmarDocumentoSerializer(serializers.Serializer):
    """Serializer para firmar un documento"""
    firma_base64 = serializers.CharField(
        required=True,
        help_text='Firma manuscrita en formato base64 (canvas signature)'
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Comentarios u observaciones opcionales'
    )

    def validate_firma_base64(self, value):
        """Valida que la firma esté en formato base64 válido"""
        import base64
        import re

        # Verificar formato data:image/png;base64,xxxxx
        if not value.startswith('data:image/'):
            raise serializers.ValidationError("La firma debe estar en formato base64 con prefijo data:image/")

        try:
            # Extraer la parte base64
            base64_data = re.sub(r'^data:image/\w+;base64,', '', value)
            base64.b64decode(base64_data)
        except Exception:
            raise serializers.ValidationError("La firma no es un base64 válido")

        return value


class RechazarFirmaSerializer(serializers.Serializer):
    """Serializer para rechazar una firma"""
    motivo = serializers.CharField(
        required=True,
        help_text='Motivo del rechazo'
    )


class DelegarFirmaSerializer(serializers.Serializer):
    """Serializer para delegar una firma"""
    nuevo_firmante_id = serializers.IntegerField(
        required=True,
        help_text='ID del usuario que recibirá la delegación'
    )
    motivo = serializers.CharField(
        required=True,
        help_text='Motivo de la delegación'
    )

    def validate_nuevo_firmante_id(self, value):
        """Valida que el usuario exista y esté activo"""
        try:
            user = User.objects.get(id=value, is_active=True)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("El usuario no existe o no está activo")


# =============================================================================
# SERIALIZERS - CONFIGURACIÓN DE REVISIÓN
# =============================================================================

class ConfiguracionRevisionSerializer(serializers.ModelSerializer):
    """Serializer para ConfiguracionRevision"""
    frecuencia_display = serializers.CharField(source='get_frecuencia_display', read_only=True)
    tipo_revision_display = serializers.CharField(source='get_tipo_revision_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable_revision.get_full_name', read_only=True, allow_null=True)
    cargo_nombre = serializers.CharField(source='cargo_responsable.name', read_only=True, allow_null=True)
    dias_restantes = serializers.SerializerMethodField()
    debe_alertar = serializers.SerializerMethodField()

    class Meta:
        model = ConfiguracionRevision
        fields = [
            'id',
            'content_type',
            'object_id',
            'frecuencia',
            'frecuencia_display',
            'dias_personalizados',
            'tipo_revision',
            'tipo_revision_display',
            'auto_renovar',
            'responsable_revision',
            'responsable_nombre',
            'cargo_responsable',
            'cargo_nombre',
            'alertas_dias_previos',
            'alertar_creador',
            'alertar_responsable',
            'destinatarios_adicionales',
            'ultima_revision',
            'proxima_revision',
            'estado',
            'estado_display',
            'habilitado',
            'dias_restantes',
            'debe_alertar',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['estado', 'created_at', 'updated_at']

    def get_dias_restantes(self, obj):
        """Calcula días restantes para la revisión"""
        if not obj.proxima_revision:
            return None
        delta = obj.proxima_revision - timezone.now().date()
        return delta.days

    def get_debe_alertar(self, obj):
        """Verifica si debe enviar alerta"""
        return obj.debe_enviar_alerta()

    def validate(self, attrs):
        """Validaciones personalizadas"""
        frecuencia = attrs.get('frecuencia')
        dias_personalizados = attrs.get('dias_personalizados')

        if frecuencia == 'PERSONALIZADO' and not dias_personalizados:
            raise serializers.ValidationError({
                'dias_personalizados': 'Debe especificar los días para frecuencia personalizada'
            })

        if frecuencia != 'PERSONALIZADO' and dias_personalizados:
            raise serializers.ValidationError({
                'dias_personalizados': 'Los días personalizados solo aplican para frecuencia PERSONALIZADO'
            })

        return attrs


class IniciarRevisionSerializer(serializers.Serializer):
    """Serializer para iniciar una revisión"""
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Observaciones sobre el inicio de la revisión'
    )


# =============================================================================
# SERIALIZERS - HISTORIAL DE VERSIONES
# =============================================================================

class HistorialVersionSerializer(serializers.ModelSerializer):
    """Serializer para HistorialVersion"""
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True, allow_null=True)
    cargo_nombre = serializers.CharField(source='cargo_usuario.name', read_only=True, allow_null=True)
    tiene_cambios = serializers.SerializerMethodField()
    cantidad_cambios = serializers.SerializerMethodField()

    class Meta:
        model = HistorialVersion
        fields = [
            'id',
            'content_type',
            'object_id',
            'version_numero',
            'version_anterior',
            'snapshot_data',
            'tipo_cambio',
            'descripcion_cambio',
            'cambios_diff',
            'usuario',
            'usuario_nombre',
            'cargo_usuario',
            'cargo_nombre',
            'ip_address',
            'user_agent',
            'version_hash',
            'tiene_cambios',
            'cantidad_cambios',
            'created_at',
        ]
        read_only_fields = fields

    def get_tiene_cambios(self, obj):
        """Verifica si la versión tiene cambios"""
        return bool(obj.cambios_diff)

    def get_cantidad_cambios(self, obj):
        """Cuenta la cantidad de cambios"""
        return len(obj.cambios_diff) if obj.cambios_diff else 0


class HistorialVersionResumidoSerializer(serializers.ModelSerializer):
    """Serializer resumido para listados"""
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = HistorialVersion
        fields = [
            'id',
            'version_numero',
            'version_anterior',
            'tipo_cambio',
            'descripcion_cambio',
            'usuario_nombre',
            'created_at',
        ]
        read_only_fields = fields


class CompararVersionesSerializer(serializers.Serializer):
    """Serializer para comparar dos versiones"""
    version_a_id = serializers.IntegerField(
        required=True,
        help_text='ID de la primera versión a comparar'
    )
    version_b_id = serializers.IntegerField(
        required=True,
        help_text='ID de la segunda versión a comparar'
    )

    def validate(self, attrs):
        """Valida que las versiones existan"""
        version_a_id = attrs['version_a_id']
        version_b_id = attrs['version_b_id']

        try:
            HistorialVersion.objects.get(id=version_a_id)
        except HistorialVersion.DoesNotExist:
            raise serializers.ValidationError({
                'version_a_id': 'La versión A no existe'
            })

        try:
            HistorialVersion.objects.get(id=version_b_id)
        except HistorialVersion.DoesNotExist:
            raise serializers.ValidationError({
                'version_b_id': 'La versión B no existe'
            })

        return attrs


class RestaurarVersionSerializer(serializers.Serializer):
    """Serializer para restaurar una versión"""
    confirmar = serializers.BooleanField(
        required=True,
        help_text='Confirmación para restaurar la versión'
    )

    def validate_confirmar(self, value):
        """Valida confirmación"""
        if not value:
            raise serializers.ValidationError("Debe confirmar la restauración")
        return value


# =============================================================================
# SERIALIZERS - CONFIGURACIÓN DE WORKFLOW
# =============================================================================

class ConfiguracionWorkflowFirmaSerializer(serializers.ModelSerializer):
    """Serializer para ConfiguracionWorkflowFirma"""
    tipo_orden_display = serializers.CharField(source='get_tipo_orden_display', read_only=True)
    cantidad_roles = serializers.SerializerMethodField()

    class Meta:
        model = ConfiguracionWorkflowFirma
        fields = [
            'id',
            'nombre',
            'descripcion',
            'tipo_politica',
            'tipo_orden',
            'tipo_orden_display',
            'dias_para_firmar',
            'permitir_delegacion',
            'roles_config',
            'activo',
            'cantidad_roles',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_cantidad_roles(self, obj):
        """Cuenta la cantidad de roles configurados"""
        return len(obj.roles_config) if obj.roles_config else 0

    def validate_roles_config(self, value):
        """Valida la estructura de roles_config"""
        if not isinstance(value, list):
            raise serializers.ValidationError("roles_config debe ser una lista")

        roles_validos = dict(FirmaDigital._meta.get_field('rol_firma').choices)

        for idx, rol in enumerate(value):
            # Validar estructura
            if not isinstance(rol, dict):
                raise serializers.ValidationError(f"El rol en posición {idx} debe ser un objeto")

            # Validar campos requeridos
            if 'rol' not in rol:
                raise serializers.ValidationError(f"El rol en posición {idx} debe tener campo 'rol'")

            if rol['rol'] not in roles_validos:
                raise serializers.ValidationError(
                    f"El rol '{rol['rol']}' no es válido. Opciones: {', '.join(roles_validos.keys())}"
                )

            # Validar orden si está presente
            if 'orden' in rol:
                try:
                    orden = int(rol['orden'])
                    if orden < 0:
                        raise ValueError
                except (ValueError, TypeError):
                    raise serializers.ValidationError(f"El orden del rol en posición {idx} debe ser un entero positivo")

            # Validar cargo_id si está presente
            if 'cargo_id' in rol and rol['cargo_id'] is not None:
                try:
                    Cargo.objects.get(id=rol['cargo_id'])
                except Cargo.DoesNotExist:
                    raise serializers.ValidationError(f"El cargo {rol['cargo_id']} no existe")

            # Validar usuario_id si está presente
            if 'usuario_id' in rol and rol['usuario_id'] is not None:
                try:
                    User.objects.get(id=rol['usuario_id'])
                except User.DoesNotExist:
                    raise serializers.ValidationError(f"El usuario {rol['usuario_id']} no existe")

        return value


class AplicarWorkflowSerializer(serializers.Serializer):
    """Serializer para aplicar un workflow a un documento"""
    workflow_id = serializers.IntegerField(
        required=True,
        help_text='ID de la configuración de workflow a aplicar'
    )

    def validate_workflow_id(self, value):
        """Valida que el workflow exista"""
        try:
            ConfiguracionWorkflowFirma.objects.get(id=value, activo=True)
            return value
        except ConfiguracionWorkflowFirma.DoesNotExist:
            raise serializers.ValidationError("El workflow no existe o no está activo")


# =============================================================================
# SERIALIZERS - ESTADÍSTICAS Y REPORTES
# =============================================================================

class EstadisticasFirmasSerializer(serializers.Serializer):
    """Serializer para estadísticas de firmas"""
    total_firmas = serializers.IntegerField()
    firmadas = serializers.IntegerField()
    pendientes = serializers.IntegerField()
    rechazadas = serializers.IntegerField()
    delegadas = serializers.IntegerField()
    vencidas = serializers.IntegerField()
    porcentaje_completado = serializers.DecimalField(max_digits=5, decimal_places=2)
    tiempo_promedio_firma_horas = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)


class EstadisticasRevisionesSerializer(serializers.Serializer):
    """Serializer para estadísticas de revisiones"""
    total_documentos = serializers.IntegerField()
    vigentes = serializers.IntegerField()
    proximos_vencimiento = serializers.IntegerField()
    vencidas = serializers.IntegerField()
    en_revision = serializers.IntegerField()
    proximas_7_dias = serializers.IntegerField()
    proximas_30_dias = serializers.IntegerField()
