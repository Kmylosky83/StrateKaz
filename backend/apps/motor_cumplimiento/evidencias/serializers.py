"""
Serializers para Evidencias Centralizadas.
"""
from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType

from .models import Evidencia, HistorialEvidencia

# Tamaño máximo: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024


class HistorialEvidenciaSerializer(serializers.ModelSerializer):
    """Serializer para historial de evidencia (read-only)."""

    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = HistorialEvidencia
        fields = [
            'id', 'accion', 'usuario', 'usuario_nombre',
            'comentario', 'datos_anteriores', 'fecha',
        ]

    def get_usuario_nombre(self, obj):
        if obj.usuario:
            return obj.usuario.get_full_name() or obj.usuario.email
        return 'Sistema'


class EvidenciaListSerializer(serializers.ModelSerializer):
    """Serializer ligero para listados."""

    subido_por_nombre = serializers.SerializerMethodField()
    aprobado_por_nombre = serializers.SerializerMethodField()
    tamano_legible = serializers.CharField(read_only=True)
    es_imagen = serializers.BooleanField(read_only=True)
    es_pdf = serializers.BooleanField(read_only=True)
    entity_label = serializers.SerializerMethodField()

    class Meta:
        model = Evidencia
        fields = [
            'id', 'titulo', 'descripcion', 'archivo', 'nombre_original',
            'mime_type', 'tamano_bytes', 'tamano_legible', 'checksum_sha256',
            'categoria', 'estado', 'normas_relacionadas', 'tags',
            'fecha_vigencia', 'es_imagen', 'es_pdf',
            'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'motivo_rechazo',
            'subido_por', 'subido_por_nombre',
            'content_type', 'object_id', 'entity_label',
            'created_at', 'updated_at',
        ]

    def get_subido_por_nombre(self, obj):
        if obj.subido_por:
            return obj.subido_por.get_full_name() or obj.subido_por.email
        return ''

    def get_aprobado_por_nombre(self, obj):
        if obj.aprobado_por:
            return obj.aprobado_por.get_full_name() or obj.aprobado_por.email
        return ''

    def get_entity_label(self, obj):
        """Intenta obtener una representación legible del objeto vinculado."""
        try:
            entity = obj.content_object
            if entity is None:
                return f"{obj.content_type.model}:{obj.object_id}"
            if hasattr(entity, 'codigo'):
                return str(entity.codigo)
            return str(entity)[:80]
        except Exception:
            return f"{obj.content_type.model}:{obj.object_id}"


class EvidenciaDetailSerializer(EvidenciaListSerializer):
    """Serializer completo con historial incluido."""

    historial = HistorialEvidenciaSerializer(many=True, read_only=True)

    class Meta(EvidenciaListSerializer.Meta):
        fields = EvidenciaListSerializer.Meta.fields + ['historial']


class EvidenciaCreateSerializer(serializers.Serializer):
    """
    Serializer para crear evidencias (multipart/form-data).

    Campos requeridos: archivo, titulo, entity_type, entity_id
    entity_type: "app_label.model" (ej: "calidad.noconformidad")
    """

    archivo = serializers.FileField(required=True)
    titulo = serializers.CharField(max_length=255)
    descripcion = serializers.CharField(required=False, default='', allow_blank=True)
    categoria = serializers.ChoiceField(
        choices=Evidencia.CATEGORIA_CHOICES, default='OTRO'
    )
    normas_relacionadas = serializers.JSONField(required=False, default=list)
    tags = serializers.JSONField(required=False, default=list)
    fecha_vigencia = serializers.DateField(required=False, allow_null=True)

    entity_type = serializers.CharField(
        help_text='Formato: app_label.model (ej: calidad.noconformidad)'
    )
    entity_id = serializers.IntegerField(
        help_text='ID del objeto al que se vincula'
    )

    def validate_archivo(self, value):
        if value.size > MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f'El archivo excede el tamaño máximo de {MAX_FILE_SIZE // (1024*1024)} MB.'
            )
        return value

    def validate_entity_type(self, value):
        parts = value.split('.')
        if len(parts) != 2:
            raise serializers.ValidationError(
                'Formato debe ser app_label.model (ej: calidad.noconformidad)'
            )
        app_label, model = parts
        try:
            ContentType.objects.get_by_natural_key(app_label, model)
        except ContentType.DoesNotExist:
            raise serializers.ValidationError(
                f'Tipo de entidad no encontrado: {value}'
            )
        return value


class EvidenciaUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar metadata de evidencia."""

    class Meta:
        model = Evidencia
        fields = [
            'titulo', 'descripcion', 'categoria',
            'normas_relacionadas', 'tags', 'fecha_vigencia',
        ]


class RechazarEvidenciaSerializer(serializers.Serializer):
    """Serializer para rechazar una evidencia con motivo."""

    motivo = serializers.CharField(
        required=True,
        help_text='Motivo del rechazo'
    )
