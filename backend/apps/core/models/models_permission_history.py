"""
Historial de Cambios de Permisos - Sistema RBAC StrateKaz v4.1

Registra todos los cambios en permisos para auditoría completa,
cumpliendo con requisitos de trazabilidad y normativas de seguridad.

Características:
- Registro de quién, cuándo y qué cambió
- Valores antes/después para cada cambio
- Contexto de la solicitud (IP, User-Agent)
- Soporte para GenericForeignKey (cualquier modelo)
"""
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db.models import JSONField


class PermissionChangeLog(models.Model):
    """
    Registro de cambios en permisos del sistema.

    Registra cualquier modificación en:
    - CargoSectionAccess (permisos de cargo por sección)
    - RolAdicional (roles adicionales)
    - UserRolAdicional (asignación de roles a usuarios)
    - PermissionTemplate (plantillas de permisos)
    - Cualquier otro modelo relacionado con permisos

    Uso:
        PermissionChangeLog.log_change(
            request=request,
            obj=cargo_section_access,
            action='UPDATED',
            old_value={'can_view': True, 'can_edit': False},
            new_value={'can_view': True, 'can_edit': True},
            changed_fields=['can_edit'],
            notes='Actualizado vía API'
        )
    """

    ACTION_CHOICES = [
        ('CREATED', 'Creado'),
        ('UPDATED', 'Actualizado'),
        ('DELETED', 'Eliminado'),
        ('GRANTED', 'Permiso Otorgado'),
        ('REVOKED', 'Permiso Revocado'),
        ('TEMPLATE_APPLIED', 'Plantilla Aplicada'),
        ('BULK_UPDATE', 'Actualización Masiva'),
        ('PROPAGATED', 'Propagado Automáticamente'),
        ('INHERITED', 'Heredado'),
        ('EXPIRED', 'Expirado'),
    ]

    ENTITY_TYPE_CHOICES = [
        ('cargo', 'Cargo'),
        ('user', 'Usuario'),
        ('role', 'Rol'),
        ('rol_adicional', 'Rol Adicional'),
        ('group', 'Grupo'),
        ('section', 'Sección'),
        ('template', 'Plantilla'),
    ]

    # ==========================================================================
    # QUIÉN HIZO EL CAMBIO
    # ==========================================================================
    changed_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permission_changes_made',
        verbose_name='Modificado por',
        help_text='Usuario que realizó el cambio (NULL si fue automático)'
    )

    # ==========================================================================
    # CUÁNDO
    # ==========================================================================
    changed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha del cambio'
    )

    # ==========================================================================
    # QUÉ OBJETO CAMBIÓ (GenericForeignKey)
    # ==========================================================================
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de objeto',
        help_text='Tipo de modelo que fue modificado'
    )
    object_id = models.PositiveIntegerField(
        verbose_name='ID del objeto',
        help_text='ID del registro modificado'
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # ==========================================================================
    # TIPO DE ACCIÓN
    # ==========================================================================
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        db_index=True,
        verbose_name='Acción',
        help_text='Tipo de cambio realizado'
    )

    # ==========================================================================
    # ENTIDAD AFECTADA (para búsquedas rápidas)
    # ==========================================================================
    affected_entity_type = models.CharField(
        max_length=50,
        choices=ENTITY_TYPE_CHOICES,
        db_index=True,
        verbose_name='Tipo de entidad',
        help_text='Tipo de entidad afectada por el cambio'
    )
    affected_entity_id = models.PositiveIntegerField(
        db_index=True,
        verbose_name='ID de entidad afectada'
    )
    affected_entity_name = models.CharField(
        max_length=200,
        verbose_name='Nombre de entidad',
        help_text='Nombre legible de la entidad afectada'
    )

    # ==========================================================================
    # VALORES ANTES/DESPUÉS
    # ==========================================================================
    old_value = JSONField(
        null=True,
        blank=True,
        verbose_name='Valor anterior',
        help_text='Estado del objeto antes del cambio'
    )
    new_value = JSONField(
        null=True,
        blank=True,
        verbose_name='Valor nuevo',
        help_text='Estado del objeto después del cambio'
    )
    changed_fields = JSONField(
        default=list,
        blank=True,
        verbose_name='Campos modificados',
        help_text='Lista de nombres de campos que cambiaron'
    )

    # ==========================================================================
    # CONTEXTO DE LA SOLICITUD
    # ==========================================================================
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='Dirección IP',
        help_text='IP desde donde se realizó el cambio'
    )
    user_agent = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='User Agent',
        help_text='Navegador/cliente que realizó la solicitud'
    )
    request_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        db_index=True,
        verbose_name='ID de solicitud',
        help_text='ID único de la solicitud (para correlacionar múltiples cambios)'
    )

    # ==========================================================================
    # INFORMACIÓN ADICIONAL
    # ==========================================================================
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas',
        help_text='Notas o justificación del cambio'
    )
    is_automatic = models.BooleanField(
        default=False,
        verbose_name='Es automático',
        help_text='Si el cambio fue realizado por un proceso automático (signal, cron)'
    )

    # ==========================================================================
    # EMPRESA (multi-tenant)
    # ==========================================================================
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='permission_change_logs',
        verbose_name='Empresa'
    )

    class Meta:
        db_table = 'core_permission_change_log'
        verbose_name = 'Log de Cambio de Permiso'
        verbose_name_plural = 'Logs de Cambios de Permisos'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['changed_at']),
            models.Index(fields=['changed_by', 'changed_at']),
            models.Index(fields=['affected_entity_type', 'affected_entity_id']),
            models.Index(fields=['action', 'changed_at']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['empresa', 'changed_at']),
        ]

    def __str__(self):
        user = self.changed_by.get_full_name() if self.changed_by else 'Sistema'
        return f"{self.get_action_display()} - {self.affected_entity_type}:{self.affected_entity_name} por {user}"

    @classmethod
    def log_change(
        cls,
        request,
        obj,
        action: str,
        old_value: dict = None,
        new_value: dict = None,
        changed_fields: list = None,
        notes: str = None,
        is_automatic: bool = False,
    ):
        """
        Helper para registrar un cambio de permisos.

        Args:
            request: HttpRequest (puede ser None para cambios automáticos)
            obj: Objeto modificado (CargoSectionAccess, RolAdicional, etc.)
            action: Tipo de acción (ver ACTION_CHOICES)
            old_value: Valor anterior del objeto
            new_value: Valor nuevo del objeto
            changed_fields: Lista de campos que cambiaron
            notes: Notas adicionales
            is_automatic: Si fue un cambio automático

        Returns:
            PermissionChangeLog: Instancia creada
        """
        # Obtener información de la entidad afectada
        entity_type, entity_id, entity_name = cls._get_affected_entity(obj)

        # Obtener información del request
        user = None
        ip_address = None
        user_agent = None
        request_id = None
        empresa = None

        if request:
            if hasattr(request, 'user') and request.user.is_authenticated:
                user = request.user
                try:
                    from apps.core.base_models.mixins import get_tenant_empresa
                    empresa = get_tenant_empresa(auto_create=False)
                except Exception:
                    pass
            ip_address = cls._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
            request_id = request.META.get('HTTP_X_REQUEST_ID')

        return cls.objects.create(
            changed_by=user,
            content_type=ContentType.objects.get_for_model(obj),
            object_id=obj.pk,
            action=action,
            affected_entity_type=entity_type,
            affected_entity_id=entity_id,
            affected_entity_name=entity_name,
            old_value=old_value,
            new_value=new_value,
            changed_fields=changed_fields or [],
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            notes=notes,
            is_automatic=is_automatic,
            empresa=empresa,
        )

    @classmethod
    def log_bulk_change(
        cls,
        request,
        objects: list,
        action: str,
        entity_type: str,
        notes: str = None,
    ):
        """
        Registra un cambio masivo de permisos.

        Args:
            request: HttpRequest
            objects: Lista de objetos afectados
            action: Tipo de acción
            entity_type: Tipo de entidad
            notes: Notas

        Returns:
            PermissionChangeLog: Instancia del log masivo
        """
        if not objects:
            return None

        # Crear un registro representativo del cambio masivo
        first_obj = objects[0]
        entity_type_detected, entity_id, entity_name = cls._get_affected_entity(first_obj)

        return cls.log_change(
            request=request,
            obj=first_obj,
            action=action,
            new_value={
                'count': len(objects),
                'affected_ids': [obj.pk for obj in objects[:100]],  # Limitar a 100
            },
            notes=notes or f'Cambio masivo de {len(objects)} registros',
        )

    @classmethod
    def _get_affected_entity(cls, obj) -> tuple:
        """
        Extrae información de la entidad afectada por el cambio.

        Returns:
            tuple: (entity_type, entity_id, entity_name)
        """
        from apps.core.models import CargoSectionAccess, UserRolAdicional

        model_name = type(obj).__name__

        if model_name == 'CargoSectionAccess':
            return 'cargo', obj.cargo_id, str(obj.cargo)
        elif model_name == 'UserRolAdicional':
            return 'user', obj.user_id, str(obj.user)
        elif model_name == 'RolAdicional':
            return 'rol_adicional', obj.pk, obj.nombre
        elif model_name == 'Cargo':
            return 'cargo', obj.pk, obj.name
        elif model_name == 'User':
            return 'user', obj.pk, obj.get_full_name() or obj.email
        elif model_name == 'Role':
            return 'role', obj.pk, obj.name
        elif model_name == 'Group':
            return 'group', obj.pk, obj.name
        elif model_name == 'TabSection':
            return 'section', obj.pk, obj.name
        elif model_name == 'PermissionTemplate':
            return 'template', obj.pk, obj.name
        else:
            return model_name.lower(), obj.pk, str(obj)

    @classmethod
    def _get_client_ip(cls, request) -> str | None:
        """Obtiene la IP del cliente desde el request."""
        if not request:
            return None

        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')

    @classmethod
    def get_history_for_entity(cls, entity_type: str, entity_id: int, limit: int = 50):
        """
        Obtiene el historial de cambios para una entidad específica.

        Args:
            entity_type: Tipo de entidad (cargo, user, etc.)
            entity_id: ID de la entidad
            limit: Máximo de registros a retornar

        Returns:
            QuerySet de PermissionChangeLog
        """
        return cls.objects.filter(
            affected_entity_type=entity_type,
            affected_entity_id=entity_id
        ).select_related('changed_by')[:limit]

    @classmethod
    def get_recent_changes(cls, user=None, days: int = 7, limit: int = 100):
        """
        Obtiene cambios recientes, opcionalmente filtrados por usuario.

        Args:
            user: Usuario que realizó los cambios (opcional)
            days: Número de días a buscar
            limit: Máximo de registros

        Returns:
            QuerySet de PermissionChangeLog
        """
        from django.utils import timezone
        from datetime import timedelta

        since = timezone.now() - timedelta(days=days)
        queryset = cls.objects.filter(changed_at__gte=since)

        if user:
            queryset = queryset.filter(changed_by=user)

        return queryset.select_related('changed_by')[:limit]

    def get_changes_summary(self) -> str:
        """Genera un resumen legible de los cambios."""
        if not self.changed_fields:
            return f'{self.get_action_display()} en {self.affected_entity_name}'

        changes = []
        for field in self.changed_fields:
            old_val = self.old_value.get(field) if self.old_value else None
            new_val = self.new_value.get(field) if self.new_value else None
            changes.append(f'{field}: {old_val} → {new_val}')

        return f'{self.get_action_display()}: ' + ', '.join(changes)
