"""
Serializers del módulo Identidad Corporativa - Dirección Estratégica

Serializers para:
- CorporateIdentity: Identidad corporativa
- CorporateValue: Valores corporativos
- AlcanceSistema: Alcance del sistema de gestión
- PoliticaEspecifica: Políticas (integrales y específicas) - v3.1 unificado

NOTA v3.1: PoliticaIntegral ha sido consolidado en PoliticaEspecifica.
Las políticas integrales se identifican con is_integral_policy=True.
"""
from rest_framework import serializers
from .models import (
    CorporateIdentity, CorporateValue, AlcanceSistema,
    PoliticaEspecifica
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

    v3.1: Campos legacy de integral_policy eliminados.
    La Política Integral se gestiona desde PoliticaEspecifica con is_integral_policy=True.
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
            # Campos de alcance del SIG
            'declara_alcance', 'alcance_general', 'alcance_geografico',
            'alcance_procesos', 'alcance_exclusiones',
            # Relaciones
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

    v4.0: Incluye campos de alcance del sistema integrado de gestión.
    El campo declara_alcance controla si se muestra la sección de alcance.
    """

    class Meta:
        model = CorporateIdentity
        fields = [
            'mission', 'vision',
            'effective_date', 'version', 'is_active',
            # Campos de alcance del SIG
            'declara_alcance', 'alcance_general', 'alcance_geografico',
            'alcance_procesos', 'alcance_exclusiones'
        ]

    def validate(self, data):
        """
        Validación: Si declara_alcance=True, alcance_general es requerido.
        """
        declara_alcance = data.get('declara_alcance', False)
        alcance_general = data.get('alcance_general')

        if declara_alcance and not alcance_general:
            raise serializers.ValidationError({
                'alcance_general': 'El alcance general es requerido cuando se declara alcance.'
            })

        return data


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
# POLÍTICA UNIFICADA (Específica + Integral)
# =============================================================================

class PoliticaEspecificaSerializer(serializers.ModelSerializer):
    """
    Serializer para Política (unificado v3.1)

    Soporta tanto políticas específicas como integrales.
    Las políticas integrales se identifican con is_integral_policy=True.

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
    is_signed = serializers.ReadOnlyField()

    class Meta:
        model = PoliticaEspecifica
        fields = [
            'id', 'identity', 'norma_iso', 'norma_iso_code', 'norma_iso_name',
            'code', 'documento_id',
            'title', 'content', 'area', 'area_name',
            'responsible', 'responsible_name',
            'responsible_cargo', 'responsible_cargo_name',
            'version', 'status', 'status_display',
            'effective_date', 'expiry_date', 'review_date', 'needs_review',
            'approved_by', 'approved_by_name', 'approved_at',
            'signature_hash', 'is_signed',
            'change_reason', 'is_integral_policy',
            'document_file', 'keywords', 'orden', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'code', 'documento_id',
            'approved_by', 'approved_at', 'signature_hash', 'is_signed',
            'created_by', 'created_at', 'updated_at', 'needs_review'
        ]


class PoliticaEspecificaCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar Política (unificado v3.1)

    Soporta tanto políticas específicas como integrales.
    Para crear una política integral, establecer is_integral_policy=True.

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
            'status', 'effective_date', 'expiry_date', 'review_date',
            'change_reason', 'is_integral_policy',
            'document_file', 'keywords', 'orden', 'is_active'
        ]


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


class SignPoliticaSerializer(serializers.Serializer):
    """
    Serializer para firmar digitalmente la política (v3.1)

    Usado principalmente para políticas integrales que requieren
    firma digital con hash de integridad.
    """
    confirm = serializers.BooleanField(
        required=True,
        help_text="Confirmar la firma digital de la política"
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError(
                "Debe confirmar la firma de la política"
            )
        return value


class PublishPoliticaSerializer(serializers.Serializer):
    """
    Serializer para publicar la política (v3.1)

    Cambia el estado a VIGENTE. Para políticas integrales,
    obsoleta automáticamente las versiones vigentes anteriores.
    """
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
# WORKFLOW DE FIRMAS - POLÍTICAS
# =============================================================================

class FirmanteSeleccionSerializer(serializers.Serializer):
    """
    Serializer para un firmante seleccionado.

    Soporta dos modos:
    1. Por cargo (cargo_id): Notifica a TODOS los usuarios del cargo (recomendado)
    2. Por usuario (usuario_id): Notifica a un usuario específico (legacy)
    """
    rol_firmante = serializers.ChoiceField(
        choices=['ELABORO', 'REVISO_TECNICO', 'REVISO_JURIDICO', 'APROBO_DIRECTOR', 'APROBO_GERENTE', 'APROBO_REPRESENTANTE_LEGAL'],
        help_text="Rol del firmante en el proceso"
    )
    usuario_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="ID del usuario que firmará (modo legacy)"
    )
    cargo_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="ID del cargo que firmará. Notifica a TODOS los usuarios del cargo (modo recomendado)"
    )

    def validate(self, data):
        """Valida que se proporcione usuario_id o cargo_id, pero no ambos"""
        usuario_id = data.get('usuario_id')
        cargo_id = data.get('cargo_id')

        if not usuario_id and not cargo_id:
            raise serializers.ValidationError(
                "Debe proporcionar usuario_id o cargo_id"
            )

        if usuario_id and cargo_id:
            raise serializers.ValidationError(
                "No puede proporcionar usuario_id y cargo_id al mismo tiempo"
            )

        return data


class IniciarFirmaPoliticaSerializer(serializers.Serializer):
    """
    Serializer para iniciar el proceso de firma de una política.

    Soporta tres modos:
    1. Modo automático (flujo_firma_id): Usa un flujo predefinido con cargos fijos
    2. Modo por cargo (firmantes con cargo_id): Selecciona CARGOS para firma
       - Notifica a TODOS los usuarios del cargo
       - Cualquier usuario del cargo puede firmar
    3. Modo legacy (firmantes con usuario_id): Selecciona usuarios específicos

    En todos los modos:
    - ELABORO: Automático (usuario actual)
    """
    flujo_firma_id = serializers.IntegerField(
        required=False,
        help_text="ID del flujo de firma a utilizar. Si no se proporciona y no hay firmantes, usa el flujo por defecto."
    )
    firmantes = FirmanteSeleccionSerializer(
        many=True,
        required=False,
        help_text=(
            "Lista de firmantes seleccionados. "
            "Cada firmante puede tener cargo_id (recomendado) o usuario_id (legacy). "
            "Formato: [{rol_firmante: 'REVISO_TECNICO', cargo_id: 3}, {rol_firmante: 'APROBO_GERENTE', cargo_id: 1}]"
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

        from django.contrib.auth import get_user_model
        from apps.core.models import Cargo
        User = get_user_model()

        for firmante in value:
            # Validar usuario si se proporcionó
            if firmante.get('usuario_id'):
                if not User.objects.filter(id=firmante['usuario_id'], is_active=True).exists():
                    raise serializers.ValidationError(
                        f"El usuario con ID {firmante['usuario_id']} no existe o no está activo"
                    )

            # Validar cargo si se proporcionó
            if firmante.get('cargo_id'):
                try:
                    cargo = Cargo.objects.get(id=firmante['cargo_id'], is_active=True)
                    # Verificar que el cargo tiene al menos un usuario
                    usuarios_count = User.objects.filter(cargo=cargo, is_active=True).count()
                    if usuarios_count == 0:
                        raise serializers.ValidationError(
                            f"El cargo '{cargo.name}' no tiene usuarios activos asignados"
                        )
                except Cargo.DoesNotExist:
                    raise serializers.ValidationError(
                        f"El cargo con ID {firmante['cargo_id']} no existe o no está activo"
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
