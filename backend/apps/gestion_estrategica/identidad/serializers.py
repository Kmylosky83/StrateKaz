"""
Serializers del módulo Identidad Corporativa - Dirección Estratégica

Serializers para:
- CorporateIdentity: Identidad corporativa
- CorporateValue: Valores corporativos
- AlcanceSistema: Alcance del sistema de gestión
- PoliticaIntegral: Política integral con versionamiento
- PoliticaEspecifica: Políticas específicas por área/módulo
"""
from rest_framework import serializers
from .models import (
    CorporateIdentity, CorporateValue, AlcanceSistema,
    PoliticaIntegral, PoliticaEspecifica
)


# =============================================================================
# VALORES CORPORATIVOS
# =============================================================================

class CorporateValueSerializer(serializers.ModelSerializer):
    """Serializer para Valores Corporativos"""

    class Meta:
        model = CorporateValue
        fields = [
            'id', 'identity', 'name', 'description',
            'icon', 'orden', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# =============================================================================
# IDENTIDAD CORPORATIVA
# =============================================================================

class CorporateIdentitySerializer(serializers.ModelSerializer):
    """
    Serializer para Identidad Corporativa

    v3.0: Campos legacy de integral_policy eliminados.
    La Política Integral se gestiona desde PoliticaIntegralSerializer.
    """

    values = CorporateValueSerializer(many=True, read_only=True)
    alcances = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    values_count = serializers.SerializerMethodField()
    alcances_count = serializers.SerializerMethodField()
    politicas_count = serializers.SerializerMethodField()

    class Meta:
        model = CorporateIdentity
        fields = [
            'id', 'mission', 'vision',
            'effective_date', 'version', 'is_active',
            'values', 'alcances', 'values_count', 'alcances_count',
            'politicas_count', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at'
        ]

    def get_alcances(self, obj):
        alcances = obj.alcances.filter(is_active=True)
        return AlcanceSistemaListSerializer(alcances, many=True).data

    def get_values_count(self, obj):
        return obj.values.filter(is_active=True).count()

    def get_alcances_count(self, obj):
        return obj.alcances.filter(is_active=True).count()

    def get_politicas_count(self, obj):
        return obj.politicas_especificas.filter(is_active=True).count()


class CorporateIdentityCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar Identidad Corporativa

    v3.0: Solo misión, visión y metadatos.
    La Política Integral se gestiona por separado con workflow.
    """

    class Meta:
        model = CorporateIdentity
        fields = [
            'mission', 'vision',
            'effective_date', 'version', 'is_active'
        ]


# =============================================================================
# ALCANCE DEL SISTEMA
# =============================================================================

class AlcanceSistemaListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listas de alcances"""
    norma_iso_code = serializers.CharField(
        source='norma_iso.code',
        read_only=True
    )
    norma_iso_name = serializers.CharField(
        source='norma_iso.short_name',
        read_only=True
    )
    is_certificate_valid = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()

    class Meta:
        model = AlcanceSistema
        fields = [
            'id', 'norma_iso', 'norma_iso_code', 'norma_iso_name',
            'is_certified', 'is_certificate_valid', 'days_until_expiry',
            'certification_body', 'expiry_date', 'is_active'
        ]


class AlcanceSistemaSerializer(serializers.ModelSerializer):
    """Serializer completo para Alcance del Sistema"""
    norma_iso_code = serializers.CharField(
        source='norma_iso.code',
        read_only=True
    )
    norma_iso_name = serializers.CharField(
        source='norma_iso.short_name',
        read_only=True
    )
    is_certificate_valid = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = AlcanceSistema
        fields = [
            'id', 'identity', 'norma_iso', 'norma_iso_code', 'norma_iso_name',
            'scope', 'exclusions', 'exclusion_justification',
            'is_certified', 'is_certificate_valid', 'certification_date',
            'certification_body', 'certificate_number', 'expiry_date',
            'days_until_expiry', 'last_audit_date', 'next_audit_date',
            'certificate_file', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'is_certificate_valid', 'days_until_expiry'
        ]


class AlcanceSistemaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Alcance del Sistema"""

    class Meta:
        model = AlcanceSistema
        fields = [
            'identity', 'norma_iso', 'scope', 'exclusions',
            'exclusion_justification', 'is_certified', 'certification_date',
            'certification_body', 'certificate_number', 'expiry_date',
            'last_audit_date', 'next_audit_date', 'certificate_file', 'is_active'
        ]


# =============================================================================
# POLÍTICA INTEGRAL
# =============================================================================

class PoliticaIntegralSerializer(serializers.ModelSerializer):
    """Serializer para Política Integral"""
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    is_signed = serializers.ReadOnlyField()
    signed_by_name = serializers.CharField(
        source='signed_by.get_full_name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = PoliticaIntegral
        fields = [
            'id', 'identity', 'version', 'title', 'content',
            'status', 'status_display', 'effective_date', 'expiry_date',
            'review_date', 'signed_by', 'signed_by_name', 'signed_at', 'signature_hash',
            'is_signed', 'applicable_standards', 'document_file',
            'change_reason', 'orden', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'signed_by', 'signed_at', 'signature_hash',
            'is_signed', 'created_by', 'created_at', 'updated_at'
        ]


class PoliticaIntegralCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Política Integral"""

    class Meta:
        model = PoliticaIntegral
        fields = [
            'identity', 'version', 'title', 'content', 'status',
            'effective_date', 'expiry_date', 'applicable_standards',
            'document_file', 'change_reason', 'review_date', 'orden', 'is_active'
        ]


class SignPoliticaIntegralSerializer(serializers.Serializer):
    """Serializer para firmar la política integral"""
    confirm = serializers.BooleanField(
        required=True,
        help_text="Confirmar la firma de la política"
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError(
                "Debe confirmar la firma de la política"
            )
        return value


class PublishPoliticaIntegralSerializer(serializers.Serializer):
    """Serializer para publicar la política integral"""
    confirm = serializers.BooleanField(
        required=True,
        help_text="Confirmar la publicación de la política"
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError(
                "Debe confirmar la publicación de la política"
            )
        return value


# =============================================================================
# POLÍTICA ESPECÍFICA
# =============================================================================

class PoliticaEspecificaSerializer(serializers.ModelSerializer):
    """
    Serializer para Política Específica

    NOTA SOBRE EL CAMPO `code`:
    El código oficial de la política (ej: POL-SST-001) es ASIGNADO por el
    Gestor Documental cuando la política firmada se envía para publicación.
    Este campo es NULL hasta que la política sea publicada.

    Flujo: BORRADOR → EN_REVISION → FIRMADO → Enviar a Documental → VIGENTE (con código)
    """
    norma_iso_code = serializers.CharField(
        source='norma_iso.code',
        read_only=True
    )
    norma_iso_name = serializers.CharField(
        source='norma_iso.short_name',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    area_name = serializers.CharField(
        source='area.nombre',
        read_only=True
    )
    responsible_name = serializers.CharField(
        source='responsible.get_full_name',
        read_only=True
    )
    responsible_cargo_name = serializers.CharField(
        source='responsible_cargo.name',
        read_only=True
    )
    approved_by_name = serializers.CharField(
        source='approved_by.get_full_name',
        read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )
    needs_review = serializers.ReadOnlyField()

    class Meta:
        model = PoliticaEspecifica
        fields = [
            'id', 'identity', 'norma_iso', 'norma_iso_code', 'norma_iso_name',
            'code', 'documento_id',  # code y documento_id son asignados por Gestor Documental
            'title', 'content', 'area', 'area_name',
            'responsible', 'responsible_name',
            'responsible_cargo', 'responsible_cargo_name',
            'version', 'status', 'status_display',
            'effective_date', 'review_date', 'needs_review',
            'approved_by', 'approved_by_name', 'approved_at',
            'document_file', 'keywords', 'orden', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'code', 'documento_id',  # code es read-only (asignado por Gestor Documental)
            'approved_by', 'approved_at',
            'created_by', 'created_at', 'updated_at', 'needs_review'
        ]


class PoliticaEspecificaCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar Política Específica.

    IMPORTANTE: El campo 'code' NO está incluido aquí porque:
    - El código oficial (POL-SST-001, etc.) es asignado por el Gestor Documental
    - Solo se asigna cuando la política FIRMADA se envía para publicación
    - Flujo: BORRADOR → EN_REVISION → FIRMADO → Enviar a Documental → VIGENTE (con código)
    """

    class Meta:
        model = PoliticaEspecifica
        fields = [
            'identity', 'norma_iso', 'title', 'content',
            'area', 'responsible', 'responsible_cargo', 'version',
            'status', 'effective_date', 'review_date',
            'document_file', 'keywords', 'orden', 'is_active'
        ]
        # code y documento_id son read-only, asignados por el Gestor Documental


class ApprovePoliticaEspecificaSerializer(serializers.Serializer):
    """Serializer para aprobar política específica"""
    confirm = serializers.BooleanField(
        required=True,
        help_text="Confirmar la aprobación de la política"
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError(
                "Debe confirmar la aprobación de la política"
            )
        return value


# =============================================================================
# WORKFLOW DE FIRMAS - POLÍTICAS
# =============================================================================

class FirmanteSeleccionSerializer(serializers.Serializer):
    """Serializer para un firmante seleccionado manualmente"""
    rol_firmante = serializers.ChoiceField(
        choices=['ELABORO', 'REVISO_TECNICO', 'REVISO_JURIDICO', 'APROBO_DIRECTOR', 'APROBO_GERENTE', 'APROBO_REPRESENTANTE_LEGAL'],
        help_text="Rol del firmante en el proceso"
    )
    usuario_id = serializers.IntegerField(
        help_text="ID del usuario que firmará"
    )


class IniciarFirmaPoliticaSerializer(serializers.Serializer):
    """
    Serializer para iniciar el proceso de firma de una política.

    Soporta dos modos:
    1. Modo automático (flujo_firma_id): Usa un flujo predefinido con cargos fijos
    2. Modo manual (firmantes): El creador selecciona quién revisa y aprueba

    En modo manual:
    - ELABORO: Automático (usuario actual)
    - REVISO_*: Seleccionado por el creador
    - APROBO_*: Seleccionado por el creador
    """
    flujo_firma_id = serializers.IntegerField(
        required=False,
        help_text="ID del flujo de firma a utilizar. Si no se proporciona y no hay firmantes manuales, usa el flujo por defecto."
    )
    firmantes = FirmanteSeleccionSerializer(
        many=True,
        required=False,
        help_text=(
            "Lista de firmantes seleccionados manualmente. "
            "Si se proporciona, ignora flujo_firma_id. "
            "Formato: [{rol_firmante: 'REVISO_TECNICO', usuario_id: 5}, {rol_firmante: 'APROBO_GERENTE', usuario_id: 1}]"
        )
    )

    def validate_firmantes(self, value):
        """Valida la lista de firmantes"""
        if not value:
            return value

        # Verificar que no hay roles duplicados
        roles = [f['rol_firmante'] for f in value]
        if len(roles) != len(set(roles)):
            raise serializers.ValidationError("No puede haber roles duplicados en los firmantes")

        # Verificar que los usuarios existen
        from django.contrib.auth import get_user_model
        User = get_user_model()

        for firmante in value:
            if not User.objects.filter(id=firmante['usuario_id'], is_active=True).exists():
                raise serializers.ValidationError(
                    f"El usuario con ID {firmante['usuario_id']} no existe o no está activo"
                )

        return value


class FirmarPoliticaSerializer(serializers.Serializer):
    """Serializer para registrar una firma en una política"""
    firma_id = serializers.IntegerField(
        required=True,
        help_text="ID de la firma (FirmaPolitica) a completar"
    )
    firma_imagen = serializers.CharField(
        required=True,
        help_text="Imagen de la firma en formato Base64 (data URL)"
    )
    comentarios = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Comentarios opcionales del firmante"
    )


class RechazarFirmaPoliticaSerializer(serializers.Serializer):
    """Serializer para rechazar una firma"""
    firma_id = serializers.IntegerField(
        required=True,
        help_text="ID de la firma (FirmaPolitica) a rechazar"
    )
    motivo = serializers.CharField(
        required=True,
        min_length=10,
        help_text="Motivo del rechazo (mínimo 10 caracteres)"
    )


class FirmaPoliticaSerializer(serializers.Serializer):
    """Serializer para mostrar una firma individual"""
    id = serializers.IntegerField(read_only=True)
    orden = serializers.IntegerField(read_only=True)
    rol_firmante = serializers.CharField(read_only=True)
    rol_firmante_display = serializers.CharField(source='get_rol_firmante_display', read_only=True)
    cargo_id = serializers.IntegerField(source='cargo.id', read_only=True)
    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True)
    usuario_id = serializers.IntegerField(source='usuario.id', read_only=True, allow_null=True)
    usuario_nombre = serializers.SerializerMethodField()
    estado = serializers.CharField(read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    fecha_firma = serializers.DateTimeField(read_only=True)
    fecha_rechazo = serializers.DateTimeField(read_only=True)
    motivo_rechazo = serializers.CharField(read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)
    dias_para_vencer = serializers.IntegerField(read_only=True)

    def get_usuario_nombre(self, obj):
        if obj.usuario:
            return obj.usuario.get_full_name()
        return None


class ProcesoFirmaPoliticaSerializer(serializers.Serializer):
    """Serializer para mostrar el proceso de firma completo"""
    id = serializers.IntegerField(read_only=True)
    estado = serializers.CharField(read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    paso_actual = serializers.IntegerField(read_only=True)
    total_pasos = serializers.IntegerField(source='flujo_firma.total_pasos', read_only=True)
    firmas_completadas = serializers.IntegerField(read_only=True)
    firmas_pendientes = serializers.IntegerField(read_only=True)
    progreso = serializers.IntegerField(source='progreso_porcentaje', read_only=True)
    fecha_inicio = serializers.DateTimeField(read_only=True)
    fecha_completado = serializers.DateTimeField(read_only=True)
    iniciado_por_nombre = serializers.CharField(source='iniciado_por.get_full_name', read_only=True)
    firmas = FirmaPoliticaSerializer(many=True, read_only=True)


class EnviarADocumentalSerializer(serializers.Serializer):
    """
    Serializer para enviar una política firmada al Gestor Documental.

    El Gestor Documental se encargará de:
    - Asignar código oficial (POL-SST-001, etc.)
    - Crear el documento en el sistema documental
    - Generar el PDF de visualización
    - Publicar y distribuir el documento
    """
    tipo_documento_id = serializers.IntegerField(
        required=False,
        help_text="ID del TipoDocumento en Gestor Documental. Si no se proporciona, se crea tipo POLITICA automáticamente."
    )
    clasificacion = serializers.ChoiceField(
        choices=[
            ('PUBLICO', 'Público'),
            ('INTERNO', 'Interno'),
            ('CONFIDENCIAL', 'Confidencial'),
            ('RESTRINGIDO', 'Restringido'),
        ],
        default='INTERNO',
        help_text="Clasificación de seguridad del documento"
    )
    areas_aplicacion = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
        help_text="IDs de áreas donde aplica la política"
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Observaciones adicionales para el Gestor Documental"
    )
