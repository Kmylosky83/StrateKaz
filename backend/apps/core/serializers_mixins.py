"""
Mixins reutilizables para serializers del sistema StrateKaz.

Este modulo centraliza metodos comunes que se repiten en multiples serializers
del proyecto, eliminando duplicacion y promoviendo consistencia.

Proporcionan funcionalidad comun como:
- Obtener nombres de usuarios (creador, editor, firmante, responsable, aprobador)
- Campos de auditoria (created_by, updated_by, timestamps)
- Campos de firma digital
- Manejo de URLs absolutas para archivos
- Campos de estado con display
- Formateo de fechas
- Relaciones anidadas comunes (areas, cargos, normas ISO)

Uso basico:
    from apps.core.serializers_mixins import AuditFieldsMixin, SignatureFieldsMixin

    class MiSerializer(AuditFieldsMixin, serializers.ModelSerializer):
        created_by_name = serializers.SerializerMethodField()
        updated_by_name = serializers.SerializerMethodField()

        class Meta:
            model = MiModelo
            fields = [..., 'created_by_name', 'updated_by_name']

Patrones de uso:
    - Heredar del mixin ANTES de ModelSerializer
    - Declarar los campos SerializerMethodField correspondientes
    - Incluir los campos en Meta.fields

Autor: StrateKaz Development Team
Fecha: 2024
Version: 2.0.0
"""
from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any, Union


# =============================================================================
# MIXIN BASE: DISPLAY DE USUARIOS
# =============================================================================

class UserDisplayMixin:
    """
    Mixin base para obtener nombres de usuario de forma consistente.

    Proporciona metodos estaticos reutilizables para obtener informacion
    de usuarios en diferentes formatos.

    Este mixin es la base para otros mixins que necesitan mostrar
    nombres de usuarios (AuditFieldsMixin, SignatureFieldsMixin, etc.).

    Metodos disponibles:
        - get_user_display_name(user): Retorna nombre completo o username
        - get_user_info(user): Retorna dict con id, username, full_name, email
        - get_user_initials(user): Retorna iniciales del usuario

    Ejemplo:
        class MiSerializer(UserDisplayMixin, serializers.ModelSerializer):
            def get_cualquier_campo(self, obj):
                return self.get_user_display_name(obj.cualquier_usuario)
    """

    @staticmethod
    def get_user_display_name(user) -> Optional[str]:
        """
        Retorna el nombre completo del usuario o username como fallback.

        Esta es la funcion estandar para mostrar nombres de usuario en
        todo el sistema, garantizando consistencia.

        Args:
            user: Instancia de User o None

        Returns:
            str o None: Nombre completo si existe, username como fallback,
                       o None si no hay usuario

        Ejemplo:
            >>> user.first_name = "Juan"
            >>> user.last_name = "Perez"
            >>> get_user_display_name(user)
            'Juan Perez'

            >>> user.first_name = ""
            >>> user.username = "jperez"
            >>> get_user_display_name(user)
            'jperez'
        """
        if not user:
            return None
        return user.get_full_name() or user.username

    @staticmethod
    def get_user_info(user) -> Optional[Dict[str, Any]]:
        """
        Retorna un diccionario con informacion basica del usuario.

        Util cuando necesitas mas que solo el nombre, por ejemplo
        para mostrar avatares o enlaces al perfil.

        Args:
            user: Instancia de User o None

        Returns:
            dict o None: Diccionario con {id, username, full_name, email}
                        o None si no hay usuario

        Ejemplo:
            {
                'id': 123,
                'username': 'jperez',
                'full_name': 'Juan Perez',
                'email': 'jperez@empresa.com'
            }
        """
        if not user:
            return None
        return {
            'id': user.id,
            'username': user.username,
            'full_name': user.get_full_name() or user.username,
            'email': user.email,
        }

    @staticmethod
    def get_user_initials(user) -> Optional[str]:
        """
        Retorna las iniciales del usuario (maximo 2 caracteres).

        Util para avatares o indicadores visuales compactos.

        Args:
            user: Instancia de User o None

        Returns:
            str o None: Iniciales en mayusculas o None si no hay usuario

        Ejemplo:
            >>> user.first_name = "Juan"
            >>> user.last_name = "Perez"
            >>> get_user_initials(user)
            'JP'
        """
        if not user:
            return None

        full_name = user.get_full_name()
        if full_name:
            parts = full_name.split()
            if len(parts) >= 2:
                return f"{parts[0][0]}{parts[-1][0]}".upper()
            elif parts:
                return parts[0][:2].upper()

        return user.username[:2].upper()


# =============================================================================
# MIXIN: CAMPOS DE AUDITORIA (created_by, updated_by)
# =============================================================================

class CreatedByMixin(UserDisplayMixin):
    """
    Mixin para obtener el nombre del usuario creador.

    Requiere que el modelo tenga un campo 'created_by' ForeignKey a User.

    Uso:
        class MiSerializer(CreatedByMixin, serializers.ModelSerializer):
            created_by_name = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [..., 'created_by_name']

    Campos proporcionados:
        - get_created_by_name(obj): Nombre del creador
        - get_created_by_info(obj): Dict completo del creador
    """

    def get_created_by_name(self, obj) -> Optional[str]:
        """Obtiene el nombre del usuario que creo el registro."""
        return self.get_user_display_name(getattr(obj, 'created_by', None))

    def get_created_by_info(self, obj) -> Optional[Dict[str, Any]]:
        """Obtiene informacion completa del usuario que creo el registro."""
        return self.get_user_info(getattr(obj, 'created_by', None))


class UpdatedByMixin(UserDisplayMixin):
    """
    Mixin para obtener el nombre del usuario que actualizo.

    Requiere que el modelo tenga un campo 'updated_by' ForeignKey a User.

    Uso:
        class MiSerializer(UpdatedByMixin, serializers.ModelSerializer):
            updated_by_name = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [..., 'updated_by_name']
    """

    def get_updated_by_name(self, obj) -> Optional[str]:
        """Obtiene el nombre del usuario que actualizo el registro."""
        return self.get_user_display_name(getattr(obj, 'updated_by', None))

    def get_updated_by_info(self, obj) -> Optional[Dict[str, Any]]:
        """Obtiene informacion completa del usuario que actualizo el registro."""
        return self.get_user_info(getattr(obj, 'updated_by', None))


class AuditFieldsMixin(CreatedByMixin, UpdatedByMixin):
    """
    Mixin completo para campos de auditoria.

    Combina CreatedByMixin y UpdatedByMixin para modelos con ambos campos.
    Requiere que el modelo tenga campos 'created_by' y 'updated_by'.

    Uso:
        class MiSerializer(AuditFieldsMixin, serializers.ModelSerializer):
            created_by_name = serializers.SerializerMethodField()
            updated_by_name = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [..., 'created_by_name', 'updated_by_name']

    Campos proporcionados:
        - get_created_by_name(obj)
        - get_created_by_info(obj)
        - get_updated_by_name(obj)
        - get_updated_by_info(obj)
    """
    pass


# =============================================================================
# MIXIN: CAMPOS DE FIRMA DIGITAL
# =============================================================================

class SignatureFieldsMixin(UserDisplayMixin):
    """
    Mixin para campos relacionados con firmas digitales.

    Soporta multiples nombres de campo comunes en el sistema:
    - policy_signed_by (CorporateIdentity)
    - signed_by (PoliticaIntegral, otros)
    - firmante (FirmaDigital)

    Uso:
        class MiSerializer(SignatureFieldsMixin, serializers.ModelSerializer):
            signed_by_name = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [..., 'signed_by_name']

    Campos proporcionados:
        - get_signed_by_name(obj): Busca en varios campos posibles
        - get_policy_signed_by_name(obj): Especifico para policy_signed_by
        - get_firmante_name(obj): Especifico para firmante
        - get_signature_info(obj): Info completa de la firma
    """

    def get_signed_by_name(self, obj) -> Optional[str]:
        """
        Obtiene el nombre de quien firmo.

        Busca en varios campos posibles para mayor flexibilidad:
        1. policy_signed_by
        2. signed_by
        3. firmante
        """
        signer = (
            getattr(obj, 'policy_signed_by', None) or
            getattr(obj, 'signed_by', None) or
            getattr(obj, 'firmante', None)
        )
        return self.get_user_display_name(signer)

    def get_policy_signed_by_name(self, obj) -> Optional[str]:
        """Obtiene el nombre de quien firmo la politica (alias especifico)."""
        return self.get_user_display_name(getattr(obj, 'policy_signed_by', None))

    def get_firmante_name(self, obj) -> Optional[str]:
        """Obtiene el nombre del firmante (campo en espanol)."""
        return self.get_user_display_name(getattr(obj, 'firmante', None))

    def get_signature_info(self, obj) -> Optional[Dict[str, Any]]:
        """
        Obtiene informacion completa de la firma.

        Returns:
            dict o None: {
                'signer': info del firmante,
                'signed_at': fecha de firma,
                'signature_hash': hash de la firma,
                'is_signed': bool
            }
        """
        signer = (
            getattr(obj, 'policy_signed_by', None) or
            getattr(obj, 'signed_by', None) or
            getattr(obj, 'firmante', None)
        )

        if not signer:
            return None

        signed_at = (
            getattr(obj, 'policy_signed_at', None) or
            getattr(obj, 'signed_at', None) or
            getattr(obj, 'fecha_firma', None)
        )

        signature_hash = (
            getattr(obj, 'policy_signature_hash', None) or
            getattr(obj, 'signature_hash', None) or
            getattr(obj, 'hash_firma', None)
        )

        return {
            'signer': self.get_user_info(signer),
            'signed_at': signed_at.isoformat() if signed_at else None,
            'signature_hash': signature_hash,
            'is_signed': True
        }


# =============================================================================
# MIXIN: CAMPOS DE RESPONSABLE
# =============================================================================

class ResponsibleFieldsMixin(UserDisplayMixin):
    """
    Mixin para campos relacionados con responsables.

    Soporta multiples nombres de campo:
    - responsible (ingles)
    - responsable (espanol)
    - responsable_revision

    Tambien soporta campos de cargo del responsable.

    Uso:
        class MiSerializer(ResponsibleFieldsMixin, serializers.ModelSerializer):
            responsible_name = serializers.SerializerMethodField()
            responsible_cargo_name = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [..., 'responsible_name', 'responsible_cargo_name']
    """

    def get_responsible_name(self, obj) -> Optional[str]:
        """Obtiene el nombre del responsable."""
        responsible = (
            getattr(obj, 'responsible', None) or
            getattr(obj, 'responsable', None) or
            getattr(obj, 'responsable_revision', None)
        )
        return self.get_user_display_name(responsible)

    def get_responsable_name(self, obj) -> Optional[str]:
        """Alias en espanol para get_responsible_name."""
        return self.get_responsible_name(obj)

    def get_responsible_cargo_name(self, obj) -> Optional[str]:
        """
        Obtiene el nombre del cargo del responsable.

        Busca en campos como responsible_cargo, responsable_cargo, cargo_responsable.
        """
        cargo = (
            getattr(obj, 'responsible_cargo', None) or
            getattr(obj, 'responsable_cargo', None) or
            getattr(obj, 'cargo_responsable', None)
        )
        if cargo:
            return getattr(cargo, 'name', None) or getattr(cargo, 'nombre', None)
        return None

    def get_responsible_info(self, obj) -> Optional[Dict[str, Any]]:
        """
        Obtiene informacion completa del responsable incluyendo cargo.

        Returns:
            dict o None: {
                'user': info del usuario,
                'cargo': nombre del cargo
            }
        """
        responsible = (
            getattr(obj, 'responsible', None) or
            getattr(obj, 'responsable', None)
        )

        if not responsible:
            return None

        return {
            'user': self.get_user_info(responsible),
            'cargo': self.get_responsible_cargo_name(obj)
        }


# =============================================================================
# MIXIN: CAMPOS DE APROBACION
# =============================================================================

class ApprovalFieldsMixin(UserDisplayMixin):
    """
    Mixin para campos relacionados con aprobaciones.

    Soporta campos:
    - approved_by (ingles)
    - aprobado_por (espanol)

    Uso:
        class MiSerializer(ApprovalFieldsMixin, serializers.ModelSerializer):
            approved_by_name = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [..., 'approved_by_name']
    """

    def get_approved_by_name(self, obj) -> Optional[str]:
        """Obtiene el nombre de quien aprobo."""
        approver = (
            getattr(obj, 'approved_by', None) or
            getattr(obj, 'aprobado_por', None)
        )
        return self.get_user_display_name(approver)

    def get_aprobado_por_name(self, obj) -> Optional[str]:
        """Alias en espanol para get_approved_by_name."""
        return self.get_approved_by_name(obj)

    def get_approval_info(self, obj) -> Optional[Dict[str, Any]]:
        """
        Obtiene informacion completa de la aprobacion.

        Returns:
            dict o None: {
                'approver': info del aprobador,
                'approved_at': fecha de aprobacion
            }
        """
        approver = (
            getattr(obj, 'approved_by', None) or
            getattr(obj, 'aprobado_por', None)
        )

        if not approver:
            return None

        approved_at = (
            getattr(obj, 'approved_at', None) or
            getattr(obj, 'fecha_aprobacion', None) or
            getattr(obj, 'aprobado_at', None)
        )

        return {
            'approver': self.get_user_info(approver),
            'approved_at': approved_at.isoformat() if approved_at else None
        }


# =============================================================================
# MIXIN: CAMPOS DE REVISION (Elaborado, Revisado, Aprobado)
# =============================================================================

class DocumentReviewFieldsMixin(UserDisplayMixin):
    """
    Mixin para campos de revision de documentos (patron comun en HSEQ).

    Soporta el patron: elaborado_por, revisado_por, aprobado_por

    Uso:
        class MiSerializer(DocumentReviewFieldsMixin, serializers.ModelSerializer):
            elaborado_por_nombre = serializers.SerializerMethodField()
            revisado_por_nombre = serializers.SerializerMethodField()
            aprobado_por_nombre = serializers.SerializerMethodField()
    """

    def get_elaborado_por_nombre(self, obj) -> Optional[str]:
        """Obtiene el nombre de quien elaboro el documento."""
        return self.get_user_display_name(getattr(obj, 'elaborado_por', None))

    def get_revisado_por_nombre(self, obj) -> Optional[str]:
        """Obtiene el nombre de quien reviso el documento."""
        return self.get_user_display_name(getattr(obj, 'revisado_por', None))

    def get_aprobado_por_nombre(self, obj) -> Optional[str]:
        """Obtiene el nombre de quien aprobo el documento."""
        return self.get_user_display_name(getattr(obj, 'aprobado_por', None))


# =============================================================================
# MIXIN: CAMPOS DE MANAGER/GERENTE
# =============================================================================

class ManagerFieldsMixin(UserDisplayMixin):
    """
    Mixin para campos relacionados con gerentes/managers de areas.

    Soporta campos:
    - manager (ingles)
    - gerente (espanol)
    - jefe

    Uso:
        class MiSerializer(ManagerFieldsMixin, serializers.ModelSerializer):
            manager_name = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [..., 'manager_name']
    """

    def get_manager_name(self, obj) -> Optional[str]:
        """Obtiene el nombre del gerente/manager."""
        manager = (
            getattr(obj, 'manager', None) or
            getattr(obj, 'gerente', None) or
            getattr(obj, 'jefe', None)
        )
        return self.get_user_display_name(manager)

    def get_gerente_name(self, obj) -> Optional[str]:
        """Alias en espanol para get_manager_name."""
        return self.get_manager_name(obj)


# =============================================================================
# MIXIN: URLs ABSOLUTAS PARA ARCHIVOS
# =============================================================================

class FileUrlMixin:
    """
    Mixin para construir URLs absolutas de archivos.

    Util para campos FileField e ImageField. Garantiza que las URLs
    sean absolutas para uso en el frontend.

    Uso:
        class MiSerializer(FileUrlMixin, serializers.ModelSerializer):
            logo_url = serializers.SerializerMethodField()

            def get_logo_url(self, obj):
                return self.build_absolute_url(obj.logo)

    Metodos disponibles:
        - build_absolute_url(file_field): Construye URL absoluta
        - build_file_info(file_field, include_size=False): Info completa del archivo
    """

    def build_absolute_url(self, file_field) -> Optional[str]:
        """
        Construye URL absoluta para un campo de archivo.

        Args:
            file_field: Campo FileField o ImageField

        Returns:
            str o None: URL absoluta del archivo o None si no hay archivo

        Ejemplo:
            def get_documento_url(self, obj):
                return self.build_absolute_url(obj.archivo_documento)
        """
        if not file_field:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(file_field.url)
        return file_field.url

    def build_file_info(self, file_field, include_size: bool = False) -> Optional[Dict[str, Any]]:
        """
        Construye informacion completa de un archivo.

        Args:
            file_field: Campo FileField o ImageField
            include_size: Si incluir el tamano del archivo

        Returns:
            dict o None: {
                'url': URL absoluta,
                'name': nombre del archivo,
                'size': tamano en bytes (opcional)
            }
        """
        if not file_field:
            return None

        info = {
            'url': self.build_absolute_url(file_field),
            'name': file_field.name.split('/')[-1] if file_field.name else None,
        }

        if include_size:
            try:
                info['size'] = file_field.size
            except Exception:
                info['size'] = None

        return info

    # Alias para compatibilidad con codigo existente
    _build_absolute_url = build_absolute_url


# =============================================================================
# MIXIN: ASIGNACION AUTOMATICA DE USUARIO EN CREATE/UPDATE
# =============================================================================

class AutoUserAssignMixin:
    """
    Mixin para asignar automaticamente el usuario actual en create/update.

    Asigna:
    - created_by en create()
    - updated_by en update()

    Requiere que el contexto del serializer contenga 'request'.

    Uso:
        class MiSerializer(AutoUserAssignMixin, serializers.ModelSerializer):
            class Meta:
                model = MiModelo
                fields = [...]

    Nota: Este mixin debe heredarse ANTES de ModelSerializer para que
    los metodos create() y update() funcionen correctamente.
    """

    def create(self, validated_data):
        """Asigna created_by automaticamente al crear."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user
            # Algunos modelos tambien usan updated_by en creacion
            if hasattr(self.Meta.model, 'updated_by'):
                validated_data['updated_by'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Asigna updated_by automaticamente al actualizar."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)


# =============================================================================
# MIXIN: CAMPOS RELACIONADOS CON AREAS
# =============================================================================

class AreaFieldsMixin:
    """
    Mixin para campos relacionados con areas organizacionales.

    Soporta campos:
    - area
    - parent / area_padre (para jerarquias)

    Uso:
        class MiSerializer(AreaFieldsMixin, serializers.ModelSerializer):
            area_name = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [..., 'area_name']
    """

    def get_area_name(self, obj) -> Optional[str]:
        """Obtiene el nombre del area."""
        area = getattr(obj, 'area', None)
        if area:
            return getattr(area, 'name', None) or getattr(area, 'nombre', None)
        return None

    def get_area_nombre(self, obj) -> Optional[str]:
        """Alias en espanol para get_area_name."""
        return self.get_area_name(obj)

    def get_parent_area_name(self, obj) -> Optional[str]:
        """Obtiene el nombre del area padre."""
        parent = getattr(obj, 'parent', None) or getattr(obj, 'area_padre', None)
        if parent:
            return getattr(parent, 'name', None) or getattr(parent, 'nombre', None)
        return None

    def get_area_info(self, obj) -> Optional[Dict[str, Any]]:
        """
        Obtiene informacion completa del area.

        Returns:
            dict o None: {
                'id': id del area,
                'name': nombre,
                'code': codigo,
                'icon': icono,
                'color': color
            }
        """
        area = getattr(obj, 'area', None)
        if not area:
            return None

        return {
            'id': area.id,
            'name': getattr(area, 'name', None) or getattr(area, 'nombre', None),
            'code': getattr(area, 'code', None) or getattr(area, 'codigo', None),
            'icon': getattr(area, 'icon', None),
            'color': getattr(area, 'color', None),
        }


# =============================================================================
# MIXIN: CAMPOS RELACIONADOS CON CARGOS
# =============================================================================

class CargoFieldsMixin:
    """
    Mixin para campos relacionados con cargos.

    Uso:
        class MiSerializer(CargoFieldsMixin, serializers.ModelSerializer):
            cargo_name = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [..., 'cargo_name']
    """

    def get_cargo_name(self, obj) -> Optional[str]:
        """Obtiene el nombre del cargo."""
        cargo = getattr(obj, 'cargo', None)
        if cargo:
            return getattr(cargo, 'name', None) or getattr(cargo, 'nombre', None)
        return None

    def get_cargo_nombre(self, obj) -> Optional[str]:
        """Alias en espanol para get_cargo_name."""
        return self.get_cargo_name(obj)

    def get_cargo_info(self, obj) -> Optional[Dict[str, Any]]:
        """
        Obtiene informacion completa del cargo.

        Returns:
            dict o None: {
                'id': id del cargo,
                'name': nombre,
                'code': codigo,
                'area': info del area
            }
        """
        cargo = getattr(obj, 'cargo', None)
        if not cargo:
            return None

        area = getattr(cargo, 'area', None)
        area_info = None
        if area:
            area_info = {
                'id': area.id,
                'name': getattr(area, 'name', None) or getattr(area, 'nombre', None),
            }

        return {
            'id': cargo.id,
            'name': getattr(cargo, 'name', None) or getattr(cargo, 'nombre', None),
            'code': getattr(cargo, 'code', None) or getattr(cargo, 'codigo', None),
            'area': area_info,
        }


# =============================================================================
# MIXIN COMBINADO: AUDITORIA COMPLETA
# =============================================================================

class FullAuditMixin(AuditFieldsMixin, ResponsibleFieldsMixin, ApprovalFieldsMixin):
    """
    Mixin completo para campos de auditoria, responsable y aprobacion.

    Incluye todos los campos de:
    - AuditFieldsMixin (created_by, updated_by)
    - ResponsibleFieldsMixin (responsible, responsible_cargo)
    - ApprovalFieldsMixin (approved_by)

    Uso:
        class MiSerializer(FullAuditMixin, serializers.ModelSerializer):
            created_by_name = serializers.SerializerMethodField()
            updated_by_name = serializers.SerializerMethodField()
            responsible_name = serializers.SerializerMethodField()
            approved_by_name = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [
                    ..., 'created_by_name', 'updated_by_name',
                    'responsible_name', 'approved_by_name'
                ]
    """
    pass


# =============================================================================
# MIXIN: CAMPOS COMUNES DE LISTADO
# =============================================================================

class CommonListFieldsMixin(UserDisplayMixin):
    """
    Mixin con campos comunes para serializers de listado.

    Proporciona metodos para obtener conteos, estados y displays comunes.

    Metodos disponibles:
        - get_is_active_display(obj): 'Activo' o 'Inactivo'
        - get_status_badge(obj): Info para badge de estado
    """

    def get_is_active_display(self, obj) -> Optional[str]:
        """
        Retorna 'Activo' o 'Inactivo' segun is_active.

        Returns:
            str o None: 'Activo', 'Inactivo', o None si el campo no existe
        """
        is_active = getattr(obj, 'is_active', None)
        if is_active is None:
            return None
        return 'Activo' if is_active else 'Inactivo'

    def get_status_badge(self, obj) -> Optional[Dict[str, str]]:
        """
        Retorna informacion para un badge de estado.

        Returns:
            dict o None: {
                'label': texto del estado,
                'color': color sugerido (success, warning, danger, info)
            }
        """
        is_active = getattr(obj, 'is_active', None)
        if is_active is None:
            return None

        return {
            'label': 'Activo' if is_active else 'Inactivo',
            'color': 'success' if is_active else 'danger'
        }


# =============================================================================
# MIXIN: SOFT DELETE
# =============================================================================

class SoftDeleteMixin:
    """
    Mixin para modelos con soft delete.

    Proporciona campos computados relacionados con eliminacion suave.

    Uso:
        class MiSerializer(SoftDeleteMixin, serializers.ModelSerializer):
            is_deleted = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [..., 'is_deleted']
    """

    def get_is_deleted(self, obj) -> bool:
        """Verifica si el registro esta eliminado (soft delete)."""
        deleted_at = getattr(obj, 'deleted_at', None)
        return deleted_at is not None

    def get_deleted_info(self, obj) -> Optional[Dict[str, Any]]:
        """
        Obtiene informacion de eliminacion si aplica.

        Returns:
            dict o None: {
                'is_deleted': bool,
                'deleted_at': fecha,
                'deleted_by': info del usuario
            }
        """
        deleted_at = getattr(obj, 'deleted_at', None)
        if not deleted_at:
            return None

        deleted_by = getattr(obj, 'deleted_by', None)

        return {
            'is_deleted': True,
            'deleted_at': deleted_at.isoformat() if deleted_at else None,
            'deleted_by': self.get_user_info(deleted_by) if hasattr(self, 'get_user_info') else None
        }


# =============================================================================
# MIXIN: INFORMACION DE LISTA DE USUARIOS
# =============================================================================

class UserListInfoMixin(UserDisplayMixin):
    """
    Mixin para obtener lista de usuarios con informacion.

    Util para campos ManyToMany de usuarios como participantes,
    miembros de equipo, etc.

    Uso:
        class MiSerializer(UserListInfoMixin, serializers.ModelSerializer):
            participantes_info = serializers.SerializerMethodField()

            def get_participantes_info(self, obj):
                return self.get_users_list_info(obj.participantes.all())
    """

    def get_users_list_info(self, users_queryset) -> List[Dict[str, Any]]:
        """
        Retorna lista de diccionarios con info de usuarios.

        Args:
            users_queryset: QuerySet de usuarios

        Returns:
            list: Lista de diccionarios con {id, username, full_name, initials}

        Ejemplo:
            [
                {'id': 1, 'username': 'jperez', 'full_name': 'Juan Perez', 'initials': 'JP'},
                {'id': 2, 'username': 'mgomez', 'full_name': 'Maria Gomez', 'initials': 'MG'}
            ]
        """
        return [
            {
                'id': user.id,
                'username': user.username,
                'full_name': user.get_full_name() or user.username,
                'initials': self.get_user_initials(user),
            }
            for user in users_queryset
        ]

    def get_users_names_list(self, users_queryset) -> List[str]:
        """
        Retorna lista simple de nombres de usuarios.

        Args:
            users_queryset: QuerySet de usuarios

        Returns:
            list: Lista de strings con nombres completos

        Ejemplo:
            ['Juan Perez', 'Maria Gomez']
        """
        return [
            user.get_full_name() or user.username
            for user in users_queryset
        ]

    def get_users_count(self, users_queryset) -> int:
        """Retorna la cantidad de usuarios en el queryset."""
        return users_queryset.count()


# =============================================================================
# MIXIN: NORMA ISO
# =============================================================================

class NormaISOFieldsMixin:
    """
    Mixin para campos relacionados con normas ISO.

    Uso:
        class MiSerializer(NormaISOFieldsMixin, serializers.ModelSerializer):
            norma_iso_code = serializers.SerializerMethodField()
            norma_iso_name = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [..., 'norma_iso_code', 'norma_iso_name']
    """

    def get_norma_iso_code(self, obj) -> Optional[str]:
        """Obtiene el codigo de la norma ISO."""
        norma = getattr(obj, 'norma_iso', None)
        if norma:
            return getattr(norma, 'code', None)
        return None

    def get_norma_iso_name(self, obj) -> Optional[str]:
        """Obtiene el nombre de la norma ISO."""
        norma = getattr(obj, 'norma_iso', None)
        if norma:
            return getattr(norma, 'short_name', None) or getattr(norma, 'name', None)
        return None

    def get_norma_iso_info(self, obj) -> Optional[Dict[str, Any]]:
        """
        Obtiene informacion completa de la norma ISO.

        Returns:
            dict o None: {
                'id': id,
                'code': codigo,
                'name': nombre,
                'short_name': nombre corto,
                'icon': icono,
                'color': color
            }
        """
        norma = getattr(obj, 'norma_iso', None)
        if not norma:
            return None

        return {
            'id': norma.id,
            'code': getattr(norma, 'code', None),
            'name': getattr(norma, 'name', None),
            'short_name': getattr(norma, 'short_name', None),
            'icon': getattr(norma, 'icon', None),
            'color': getattr(norma, 'color', None),
        }


# =============================================================================
# MIXIN: FORMATEO DE FECHAS
# =============================================================================

class TimestampMixin:
    """
    Mixin para formateo consistente de fechas y timestamps.

    Proporciona metodos para diferentes formatos de fecha usados en el sistema.

    Formatos disponibles:
        - ISO 8601: 2024-01-15T10:30:00Z
        - Fecha simple: 2024-01-15
        - Fecha legible: 15 de enero de 2024
        - Fecha y hora: 15/01/2024 10:30

    Uso:
        class MiSerializer(TimestampMixin, serializers.ModelSerializer):
            fecha_formateada = serializers.SerializerMethodField()

            def get_fecha_formateada(self, obj):
                return self.format_date_readable(obj.created_at)
    """

    @staticmethod
    def format_datetime_iso(dt: Optional[datetime]) -> Optional[str]:
        """
        Formatea datetime a ISO 8601.

        Args:
            dt: datetime o None

        Returns:
            str o None: '2024-01-15T10:30:00Z'
        """
        if not dt:
            return None
        return dt.isoformat()

    @staticmethod
    def format_date_simple(dt: Optional[Union[datetime, date]]) -> Optional[str]:
        """
        Formatea fecha simple YYYY-MM-DD.

        Args:
            dt: datetime, date o None

        Returns:
            str o None: '2024-01-15'
        """
        if not dt:
            return None
        if isinstance(dt, datetime):
            return dt.date().isoformat()
        return dt.isoformat()

    @staticmethod
    def format_date_readable(dt: Optional[Union[datetime, date]], locale: str = 'es') -> Optional[str]:
        """
        Formatea fecha de forma legible.

        Args:
            dt: datetime, date o None
            locale: idioma ('es' para espanol)

        Returns:
            str o None: '15 de enero de 2024'
        """
        if not dt:
            return None

        if isinstance(dt, datetime):
            dt = dt.date()

        meses_es = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ]

        if locale == 'es':
            return f"{dt.day} de {meses_es[dt.month - 1]} de {dt.year}"

        return dt.strftime('%B %d, %Y')

    @staticmethod
    def format_datetime_short(dt: Optional[datetime]) -> Optional[str]:
        """
        Formatea fecha y hora corta.

        Args:
            dt: datetime o None

        Returns:
            str o None: '15/01/2024 10:30'
        """
        if not dt:
            return None
        return dt.strftime('%d/%m/%Y %H:%M')

    @staticmethod
    def get_relative_time(dt: Optional[datetime]) -> Optional[str]:
        """
        Retorna tiempo relativo (hace X minutos, hace X horas, etc).

        Args:
            dt: datetime o None

        Returns:
            str o None: 'hace 5 minutos', 'hace 2 horas', 'hace 3 dias'
        """
        if not dt:
            return None

        now = timezone.now() if timezone.is_aware(dt) else datetime.now()
        diff = now - dt

        seconds = diff.total_seconds()

        if seconds < 60:
            return 'hace un momento'
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"hace {minutes} {'minuto' if minutes == 1 else 'minutos'}"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"hace {hours} {'hora' if hours == 1 else 'horas'}"
        elif seconds < 604800:
            days = int(seconds / 86400)
            return f"hace {days} {'dia' if days == 1 else 'dias'}"
        elif seconds < 2592000:
            weeks = int(seconds / 604800)
            return f"hace {weeks} {'semana' if weeks == 1 else 'semanas'}"
        else:
            months = int(seconds / 2592000)
            return f"hace {months} {'mes' if months == 1 else 'meses'}"

    @staticmethod
    def get_days_until(dt: Optional[Union[datetime, date]]) -> Optional[int]:
        """
        Calcula dias restantes hasta una fecha.

        Args:
            dt: datetime, date o None

        Returns:
            int o None: numero de dias (negativo si ya paso)
        """
        if not dt:
            return None

        if isinstance(dt, datetime):
            dt = dt.date()

        today = date.today()
        return (dt - today).days


# =============================================================================
# MIXIN: ESTADO CON COLORES
# =============================================================================

class StatusDisplayMixin:
    """
    Mixin para mostrar estados con colores y iconos.

    Util para campos de estado que necesitan representacion visual.

    Uso:
        class MiSerializer(StatusDisplayMixin, serializers.ModelSerializer):
            status_info = serializers.SerializerMethodField()

            def get_status_info(self, obj):
                return self.get_status_with_color(
                    obj.status,
                    obj.get_status_display()
                )
    """

    # Mapeo de estados comunes a colores
    STATUS_COLORS = {
        # Estados de documentos
        'BORRADOR': 'gray',
        'DRAFT': 'gray',
        'EN_REVISION': 'yellow',
        'REVIEW': 'yellow',
        'PENDIENTE': 'yellow',
        'PENDING': 'yellow',
        'APROBADO': 'green',
        'APPROVED': 'green',
        'PUBLICADO': 'blue',
        'PUBLISHED': 'blue',
        'VIGENTE': 'green',
        'ACTIVE': 'green',
        'OBSOLETO': 'red',
        'OBSOLETE': 'red',
        'ARCHIVADO': 'gray',
        'ARCHIVED': 'gray',

        # Estados de tareas/objetivos
        'NO_INICIADO': 'gray',
        'NOT_STARTED': 'gray',
        'EN_PROGRESO': 'blue',
        'IN_PROGRESS': 'blue',
        'COMPLETADO': 'green',
        'COMPLETED': 'green',
        'CANCELADO': 'red',
        'CANCELLED': 'red',
        'ATRASADO': 'red',
        'DELAYED': 'red',

        # Estados de firmas
        'FIRMADO': 'green',
        'SIGNED': 'green',
        'SIN_FIRMAR': 'yellow',
        'UNSIGNED': 'yellow',
        'RECHAZADO': 'red',
        'REJECTED': 'red',
    }

    def get_status_with_color(
        self,
        status_code: Optional[str],
        status_display: Optional[str],
        custom_colors: Optional[Dict[str, str]] = None
    ) -> Optional[Dict[str, str]]:
        """
        Retorna estado con color asignado.

        Args:
            status_code: Codigo del estado (ej: 'APROBADO')
            status_display: Texto a mostrar (ej: 'Aprobado')
            custom_colors: Mapeo personalizado de colores

        Returns:
            dict o None: {
                'code': codigo,
                'label': texto,
                'color': color
            }
        """
        if not status_code:
            return None

        colors = {**self.STATUS_COLORS, **(custom_colors or {})}
        color = colors.get(status_code.upper(), 'gray')

        return {
            'code': status_code,
            'label': status_display or status_code,
            'color': color
        }


# =============================================================================
# MIXIN: EMPRESA/TENANT
# =============================================================================

class EmpresaFieldsMixin:
    """
    Mixin para campos relacionados con la empresa (multi-tenant).

    Uso:
        class MiSerializer(EmpresaFieldsMixin, serializers.ModelSerializer):
            empresa_name = serializers.SerializerMethodField()
    """

    def get_empresa_name(self, obj) -> Optional[str]:
        """Obtiene el nombre de la empresa."""
        empresa = getattr(obj, 'empresa', None)
        if empresa:
            return (
                getattr(empresa, 'nombre_comercial', None) or
                getattr(empresa, 'razon_social', None) or
                getattr(empresa, 'name', None)
            )
        return None

    def get_empresa_id(self, obj) -> Optional[int]:
        """Obtiene el ID de la empresa."""
        empresa = getattr(obj, 'empresa', None)
        if empresa:
            return empresa.id
        return getattr(obj, 'empresa_id', None)


# =============================================================================
# MIXIN COMBINADO: SERIALIZER BASE COMPLETO
# =============================================================================

class BaseSerializerMixin(
    AuditFieldsMixin,
    FileUrlMixin,
    TimestampMixin,
    SoftDeleteMixin,
    CommonListFieldsMixin
):
    """
    Mixin base que combina las funcionalidades mas comunes.

    Incluye:
    - AuditFieldsMixin (created_by, updated_by)
    - FileUrlMixin (URLs de archivos)
    - TimestampMixin (formateo de fechas)
    - SoftDeleteMixin (eliminacion suave)
    - CommonListFieldsMixin (estados comunes)

    Uso:
        class MiSerializer(BaseSerializerMixin, serializers.ModelSerializer):
            created_by_name = serializers.SerializerMethodField()
            updated_by_name = serializers.SerializerMethodField()
            documento_url = serializers.SerializerMethodField()

            class Meta:
                model = MiModelo
                fields = [...]

            def get_documento_url(self, obj):
                return self.build_absolute_url(obj.documento)
    """
    pass


# =============================================================================
# EXPORTACIONES CONVENIENTES
# =============================================================================

__all__ = [
    # Base
    'UserDisplayMixin',

    # Auditoria
    'CreatedByMixin',
    'UpdatedByMixin',
    'AuditFieldsMixin',

    # Firma
    'SignatureFieldsMixin',

    # Responsable
    'ResponsibleFieldsMixin',

    # Aprobacion
    'ApprovalFieldsMixin',

    # Revision de documentos
    'DocumentReviewFieldsMixin',

    # Manager
    'ManagerFieldsMixin',

    # Archivos
    'FileUrlMixin',

    # Auto asignacion
    'AutoUserAssignMixin',

    # Areas y Cargos
    'AreaFieldsMixin',
    'CargoFieldsMixin',

    # Combinados
    'FullAuditMixin',

    # Utilidades
    'CommonListFieldsMixin',
    'SoftDeleteMixin',
    'UserListInfoMixin',
    'NormaISOFieldsMixin',

    # Formateo
    'TimestampMixin',
    'StatusDisplayMixin',

    # Empresa/Tenant
    'EmpresaFieldsMixin',

    # Base completo
    'BaseSerializerMixin',
]
