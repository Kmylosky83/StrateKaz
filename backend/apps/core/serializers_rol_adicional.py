"""
Serializers para Roles Adicionales - Sistema RBAC Híbrido
Sistema de Gestión StrateKaz

Serializers para:
- RolAdicional CRUD
- UsuarioRolAdicional (asignación)
- Gestión de certificaciones
- Plantillas sugeridas
"""
from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from .models import (
    RolAdicional, RolAdicionalPermiso, UsuarioRolAdicional,
    Permiso, Cargo, User
)
from .serializers_rbac import PermisoListSerializer, CargoListRBACSerializer


# =============================================================================
# SERIALIZERS DE ROL ADICIONAL
# =============================================================================

class RolAdicionalListSerializer(serializers.ModelSerializer):
    """Serializer para listado de roles adicionales"""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    permisos_count = serializers.SerializerMethodField()
    usuarios_count = serializers.SerializerMethodField()
    usuarios_vigentes_count = serializers.SerializerMethodField()
    cargos_compatibles_count = serializers.SerializerMethodField()

    class Meta:
        model = RolAdicional
        fields = [
            'id', 'code', 'nombre', 'descripcion', 'tipo', 'tipo_display',
            'requiere_certificacion', 'requiere_aprobacion',
            'is_system', 'is_active',
            'permisos_count', 'usuarios_count', 'usuarios_vigentes_count',
            'cargos_compatibles_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_permisos_count(self, obj):
        return obj.permisos.filter(is_active=True).count()

    def get_usuarios_count(self, obj):
        return obj.usuarios_count()

    def get_usuarios_vigentes_count(self, obj):
        return obj.usuarios_vigentes_count()

    def get_cargos_compatibles_count(self, obj):
        return obj.cargos_compatibles.filter(is_active=True).count()


class RolAdicionalDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado de rol adicional con permisos y cargos"""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    permisos = PermisoListSerializer(many=True, read_only=True)
    cargos_compatibles = CargoListRBACSerializer(many=True, read_only=True)
    permisos_count = serializers.SerializerMethodField()
    usuarios_count = serializers.SerializerMethodField()
    usuarios_vigentes_count = serializers.SerializerMethodField()
    usuarios_asignados = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = RolAdicional
        fields = [
            # Identificación
            'id', 'code', 'nombre', 'descripcion', 'tipo', 'tipo_display',
            # Permisos
            'permisos', 'permisos_count',
            # Metadata legal
            'justificacion_legal', 'requiere_certificacion', 'certificacion_requerida',
            'vigencia_certificacion_dias',
            # Requisitos
            'requisitos_minimos', 'cargos_compatibles', 'requiere_aprobacion',
            # Control
            'is_system', 'is_active',
            # Estadísticas
            'usuarios_count', 'usuarios_vigentes_count', 'usuarios_asignados',
            # Auditoría
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_permisos_count(self, obj):
        return obj.permisos.filter(is_active=True).count()

    def get_usuarios_count(self, obj):
        return obj.usuarios_count()

    def get_usuarios_vigentes_count(self, obj):
        return obj.usuarios_vigentes_count()

    def get_usuarios_asignados(self, obj):
        """Lista simplificada de usuarios con este rol (primeros 20)"""
        asignaciones = obj.usuario_roles_adicionales.select_related('usuario').filter(
            usuario__is_active=True,
            usuario__deleted_at__isnull=True,
            is_active=True
        )[:20]

        return [{
            'usuario_id': a.usuario.id,
            'username': a.usuario.username,
            'full_name': a.usuario.get_full_name() or a.usuario.username,
            'estado': a.estado,
            'fecha_asignacion': a.fecha_asignacion,
            'fecha_expiracion': a.fecha_expiracion,
            'is_vigente': a.is_vigente,
            'certificado_vigente': a.certificado_vigente,
        } for a in asignaciones]


class RolAdicionalCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear roles adicionales"""

    permiso_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de permisos a asignar'
    )
    cargo_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de cargos compatibles'
    )

    class Meta:
        model = RolAdicional
        fields = [
            'code', 'nombre', 'descripcion', 'tipo',
            'justificacion_legal', 'requiere_certificacion', 'certificacion_requerida',
            'vigencia_certificacion_dias', 'requisitos_minimos',
            'requiere_aprobacion', 'is_active',
            'permiso_ids', 'cargo_ids',
        ]

    def validate_code(self, value):
        if RolAdicional.objects.filter(code=value).exists():
            raise serializers.ValidationError('Este código de rol ya existe')
        return value.upper()

    @transaction.atomic
    def create(self, validated_data):
        permiso_ids = validated_data.pop('permiso_ids', [])
        cargo_ids = validated_data.pop('cargo_ids', [])

        user = self.context['request'].user if 'request' in self.context else None
        validated_data['created_by'] = user

        rol_adicional = RolAdicional.objects.create(**validated_data)

        # Asignar permisos
        if permiso_ids:
            permisos = Permiso.objects.filter(id__in=permiso_ids, is_active=True)
            for permiso in permisos:
                RolAdicionalPermiso.objects.create(
                    rol_adicional=rol_adicional,
                    permiso=permiso,
                    granted_by=user
                )

        # Asignar cargos compatibles
        if cargo_ids:
            cargos = Cargo.objects.filter(id__in=cargo_ids, is_active=True)
            rol_adicional.cargos_compatibles.set(cargos)

        return rol_adicional


class RolAdicionalUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar roles adicionales"""

    permiso_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de permisos (reemplaza los existentes)'
    )
    cargo_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='Lista de IDs de cargos compatibles (reemplaza los existentes)'
    )

    class Meta:
        model = RolAdicional
        fields = [
            'nombre', 'descripcion', 'tipo',
            'justificacion_legal', 'requiere_certificacion', 'certificacion_requerida',
            'vigencia_certificacion_dias', 'requisitos_minimos',
            'requiere_aprobacion', 'is_active',
            'permiso_ids', 'cargo_ids',
        ]

    def validate(self, attrs):
        instance = self.instance
        if instance and instance.is_system:
            # Los roles del sistema solo pueden modificar is_active
            allowed_fields = {'is_active', 'descripcion'}
            changed_fields = set(attrs.keys()) - allowed_fields
            if changed_fields:
                raise serializers.ValidationError(
                    f'Los roles del sistema no pueden modificar: {", ".join(changed_fields)}'
                )
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        permiso_ids = validated_data.pop('permiso_ids', None)
        cargo_ids = validated_data.pop('cargo_ids', None)

        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        user = self.context['request'].user if 'request' in self.context else None

        # Si se proporcionaron permisos, reemplazar
        if permiso_ids is not None and not instance.is_system:
            # Eliminar permisos existentes
            RolAdicionalPermiso.objects.filter(rol_adicional=instance).delete()

            # Agregar nuevos permisos
            permisos = Permiso.objects.filter(id__in=permiso_ids, is_active=True)
            for permiso in permisos:
                RolAdicionalPermiso.objects.create(
                    rol_adicional=instance,
                    permiso=permiso,
                    granted_by=user
                )

        # Si se proporcionaron cargos, reemplazar
        if cargo_ids is not None:
            cargos = Cargo.objects.filter(id__in=cargo_ids, is_active=True)
            instance.cargos_compatibles.set(cargos)

        return instance


class RolAdicionalPlantillaSerializer(serializers.Serializer):
    """Serializer para plantillas sugeridas de roles adicionales"""

    code = serializers.CharField()
    nombre = serializers.CharField()
    descripcion = serializers.CharField()
    tipo = serializers.ChoiceField(choices=RolAdicional.TIPO_CHOICES)
    justificacion_legal = serializers.CharField(allow_blank=True)
    requiere_certificacion = serializers.BooleanField()
    certificacion_requerida = serializers.CharField(allow_blank=True, allow_null=True)
    vigencia_certificacion_dias = serializers.IntegerField(allow_null=True)
    requisitos_minimos = serializers.ListField(child=serializers.CharField())
    permisos_sugeridos = serializers.ListField(child=serializers.CharField())


# =============================================================================
# SERIALIZERS DE ASIGNACIÓN (UsuarioRolAdicional)
# =============================================================================

class UsuarioRolAdicionalListSerializer(serializers.ModelSerializer):
    """Serializer para listado de asignaciones usuario-rol"""

    usuario_nombre = serializers.CharField(
        source='usuario.get_full_name',
        read_only=True
    )
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    rol_nombre = serializers.CharField(source='rol_adicional.nombre', read_only=True)
    rol_tipo = serializers.CharField(source='rol_adicional.tipo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    is_vigente = serializers.BooleanField(read_only=True)
    certificado_vigente = serializers.SerializerMethodField()
    dias_hasta_expiracion = serializers.IntegerField(read_only=True)

    class Meta:
        model = UsuarioRolAdicional
        fields = [
            'id', 'usuario', 'usuario_nombre', 'usuario_username',
            'rol_adicional', 'rol_nombre', 'rol_tipo',
            'estado', 'estado_display', 'is_vigente',
            'fecha_asignacion', 'fecha_inicio', 'fecha_expiracion',
            'dias_hasta_expiracion',
            'certificado_numero', 'certificado_vigencia', 'certificado_vigente',
            'requiere_aprobacion', 'is_active',
        ]
        read_only_fields = ['fecha_asignacion']

    def get_certificado_vigente(self, obj):
        return obj.certificado_vigente


class UsuarioRolAdicionalDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado de asignación usuario-rol"""

    usuario_detail = serializers.SerializerMethodField()
    rol_adicional_detail = RolAdicionalListSerializer(source='rol_adicional', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    is_vigente = serializers.BooleanField(read_only=True)
    certificado_vigente = serializers.SerializerMethodField()
    dias_hasta_expiracion = serializers.IntegerField(read_only=True)
    dias_hasta_expiracion_certificado = serializers.IntegerField(read_only=True)
    asignado_por_nombre = serializers.CharField(
        source='asignado_por.get_full_name',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name',
        read_only=True
    )

    class Meta:
        model = UsuarioRolAdicional
        fields = [
            # Relaciones
            'id', 'usuario', 'usuario_detail', 'rol_adicional', 'rol_adicional_detail',
            # Vigencia
            'estado', 'estado_display', 'is_vigente',
            'fecha_asignacion', 'fecha_inicio', 'fecha_expiracion',
            'dias_hasta_expiracion',
            # Certificación
            'certificado_numero', 'certificado_entidad', 'certificado_vigencia',
            'certificado_documento', 'certificado_vigente', 'dias_hasta_expiracion_certificado',
            # Aprobación
            'requiere_aprobacion', 'aprobado_por', 'aprobado_por_nombre',
            'fecha_aprobacion', 'motivo_rechazo',
            # Control
            'is_active', 'asignado_por', 'asignado_por_nombre', 'notas', 'updated_at',
        ]
        read_only_fields = ['fecha_asignacion', 'updated_at']

    def get_certificado_vigente(self, obj):
        return obj.certificado_vigente

    def get_usuario_detail(self, obj):
        return {
            'id': obj.usuario.id,
            'username': obj.usuario.username,
            'full_name': obj.usuario.get_full_name() or obj.usuario.username,
            'email': obj.usuario.email,
            'cargo': obj.usuario.cargo.name if obj.usuario.cargo else None,
            'cargo_code': obj.usuario.cargo.code if obj.usuario.cargo else None,
        }


class AsignarRolAdicionalSerializer(serializers.Serializer):
    """Serializer para asignar rol adicional a usuario"""

    rol_adicional_id = serializers.IntegerField(
        help_text='ID del rol adicional a asignar'
    )
    fecha_inicio = serializers.DateField(
        required=False,
        allow_null=True,
        help_text='Fecha desde la cual el rol es efectivo'
    )
    fecha_expiracion = serializers.DateField(
        required=False,
        allow_null=True,
        help_text='Fecha de expiración del rol'
    )
    certificado_numero = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        help_text='Número de certificado o licencia'
    )
    certificado_entidad = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text='Entidad certificadora'
    )
    certificado_vigencia = serializers.DateField(
        required=False,
        allow_null=True,
        help_text='Fecha de vencimiento del certificado'
    )
    notas = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Notas u observaciones'
    )

    def validate_rol_adicional_id(self, value):
        if not RolAdicional.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('El rol adicional no existe o está inactivo')
        return value

    def validate(self, attrs):
        rol_adicional_id = attrs.get('rol_adicional_id')
        rol = RolAdicional.objects.get(id=rol_adicional_id)

        # Validar certificación si es requerida
        if rol.requiere_certificacion:
            if not attrs.get('certificado_numero'):
                raise serializers.ValidationError({
                    'certificado_numero': 'Este rol requiere número de certificado'
                })
            if not attrs.get('certificado_vigencia'):
                raise serializers.ValidationError({
                    'certificado_vigencia': 'Este rol requiere fecha de vigencia del certificado'
                })

        return attrs


class QuitarRolAdicionalSerializer(serializers.Serializer):
    """Serializer para quitar rol adicional de usuario"""

    rol_adicional_id = serializers.IntegerField(
        help_text='ID del rol adicional a quitar'
    )
    motivo = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Motivo de la remoción'
    )


class AprobarRolAdicionalSerializer(serializers.Serializer):
    """Serializer para aprobar/rechazar asignación de rol"""

    accion = serializers.ChoiceField(
        choices=['APROBAR', 'RECHAZAR'],
        help_text='Acción a realizar'
    )
    motivo = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Motivo (requerido para rechazo)'
    )

    def validate(self, attrs):
        if attrs['accion'] == 'RECHAZAR' and not attrs.get('motivo'):
            raise serializers.ValidationError({
                'motivo': 'El motivo es requerido para rechazar'
            })
        return attrs


class RenovarCertificadoSerializer(serializers.Serializer):
    """Serializer para renovar certificado"""

    certificado_numero = serializers.CharField(
        max_length=100,
        help_text='Nuevo número de certificado'
    )
    certificado_vigencia = serializers.DateField(
        help_text='Nueva fecha de vigencia'
    )
    certificado_entidad = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text='Entidad certificadora'
    )
    certificado_documento = serializers.FileField(
        required=False,
        allow_null=True,
        help_text='Archivo PDF del nuevo certificado'
    )

    def validate_certificado_vigencia(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError(
                'La fecha de vigencia debe ser futura'
            )
        return value


# =============================================================================
# SERIALIZERS DE ESTADÍSTICAS
# =============================================================================

class RolesAdicionalesStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de roles adicionales"""

    total_roles = serializers.IntegerField()
    roles_activos = serializers.IntegerField()
    roles_por_tipo = serializers.DictField()
    roles_con_certificacion = serializers.IntegerField()
    total_asignaciones = serializers.IntegerField()
    asignaciones_vigentes = serializers.IntegerField()
    asignaciones_pendientes = serializers.IntegerField()
    asignaciones_proximas_expirar = serializers.IntegerField()
    certificados_proximos_expirar = serializers.IntegerField()
