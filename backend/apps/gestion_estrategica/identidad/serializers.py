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
from apps.gestion_estrategica.organizacion.models import Area


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

class ProcesoAreaSerializer(serializers.ModelSerializer):
    """Serializer resumido para áreas/procesos cubiertos"""
    full_path = serializers.ReadOnlyField()
    level = serializers.ReadOnlyField()

    class Meta:
        model = Area
        fields = ['id', 'code', 'name', 'full_path', 'level', 'icon', 'color']


class CorporateIdentitySerializer(serializers.ModelSerializer):
    """
    Serializer para Identidad Corporativa

    v3.1: Campos legacy de integral_policy eliminados.
    La Política Integral se gestiona desde PoliticaEspecifica con is_integral_policy=True.

    v4.2: Nuevo campo procesos_cubiertos (ManyToMany con Area).
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

    # Nuevo: procesos_cubiertos (ManyToMany)
    procesos_cubiertos = ProcesoAreaSerializer(many=True, read_only=True)

    class Meta:
        model = CorporateIdentity
        fields = [
            'id', 'mission', 'vision',
            'effective_date', 'version', 'is_active',
            # Campos de alcance del SIG
            'declara_alcance', 'alcance_general', 'alcance_geografico',
            'alcance_procesos', 'alcance_exclusiones',
            'procesos_cubiertos',  # Nuevo: lista de áreas
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

    v4.2: Nuevo campo procesos_cubiertos_ids para selección múltiple de áreas.
    """

    # Campo de escritura para IDs de procesos/áreas
    procesos_cubiertos_ids = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.filter(is_active=True),
        many=True,
        write_only=True,
        source='procesos_cubiertos',
        required=False,
        help_text='IDs de las áreas/procesos cubiertos por el SIG'
    )

    class Meta:
        model = CorporateIdentity
        fields = [
            'mission', 'vision',
            'effective_date', 'version', 'is_active',
            # Campos de alcance del SIG
            'declara_alcance', 'alcance_general', 'alcance_geografico',
            'alcance_procesos', 'alcance_exclusiones',
            'procesos_cubiertos_ids'  # Nuevo: escribir IDs de áreas
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

    def create(self, validated_data):
        """Crear identidad con procesos cubiertos"""
        procesos = validated_data.pop('procesos_cubiertos', [])
        instance = super().create(validated_data)
        if procesos:
            instance.procesos_cubiertos.set(procesos)
        return instance

    def update(self, instance, validated_data):
        """Actualizar identidad con procesos cubiertos"""
        procesos = validated_data.pop('procesos_cubiertos', None)
        instance = super().update(instance, validated_data)
        if procesos is not None:
            instance.procesos_cubiertos.set(procesos)
        return instance


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

    VALIDACIÓN DE TRANSICIONES:
    Las transiciones de estado están controladas por EstadoPolitica.transiciones_permitidas.
    Solo se permiten transiciones definidas en la configuración dinámica.
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

    def validate_status(self, value):
        """
        Valida que la transición de estado sea permitida.

        Usa EstadoPolitica.transiciones_permitidas para verificar
        que el nuevo estado esté en la lista de transiciones válidas
        desde el estado actual.
        """
        # Solo validar en actualizaciones (instance existe)
        if not self.instance:
            return value

        # Si el estado no cambia, no hay nada que validar
        current_status = self.instance.status
        if current_status == value:
            return value

        # Importar modelo de configuración
        from apps.gestion_estrategica.identidad.models_config import EstadoPolitica

        # Obtener configuración del estado actual
        estado_actual = EstadoPolitica.objects.filter(
            code=current_status,
            is_active=True
        ).first()

        if not estado_actual:
            # Si no hay configuración, permitir (fallback para compatibilidad)
            return value

        # Verificar si la transición está permitida
        transiciones_permitidas = estado_actual.transiciones_permitidas or []

        if value not in transiciones_permitidas:
            raise serializers.ValidationError(
                f"No se permite la transición de '{current_status}' a '{value}'. "
                f"Transiciones permitidas: {', '.join(transiciones_permitidas) or 'ninguna'}"
            )

        return value


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
# NOTA: El workflow de firmas se maneja en Gestor Documental
# =============================================================================
# Los serializers de firma (IniciarFirmaSerializer, FirmarDocumentoSerializer,
# RechazarFirmaSerializer, EnviarADocumentalSerializer) fueron eliminados.
#
# Identidad solo crea políticas en BORRADOR y las envía a Gestor Documental
# usando el endpoint enviar-a-gestion/.
# =============================================================================
