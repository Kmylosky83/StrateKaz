"""
Plantillas de Permisos - Sistema RBAC StrateKaz v4.1

Permite definir conjuntos predefinidos de permisos que pueden
aplicarse rapidamente a cargos, facilitando la gestión masiva
y estandarización de permisos.

Mejores prácticas implementadas:
- Plantillas predefinidas (Admin, Viewer, Editor, Manager)
- Excepciones por sección (overrides)
- Exclusiones de secciones
- Auditoría completa de aplicaciones
"""
from django.db import models
from django.db.models import JSONField
from django.utils import timezone


class PermissionTemplate(models.Model):
    """
    Plantilla de permisos predefinida.

    Permite crear conjuntos de permisos reutilizables que pueden
    aplicarse a múltiples cargos de forma rápida y consistente.

    Ejemplos de uso:
    - Admin: Acceso total a todas las secciones
    - Viewer: Solo lectura en todas las secciones
    - Editor: Ver y editar, sin crear ni eliminar
    - Manager: Todo excepto eliminar
    - Custom: Configuración personalizada por empresa

    Flujo de aplicación:
    1. Admin selecciona plantilla
    2. Selecciona cargo(s) destino
    3. Sistema aplica permisos por defecto
    4. Respeta overrides y exclusiones
    5. Registra aplicación para auditoría
    """

    TEMPLATE_TYPE_CHOICES = [
        ('ADMIN', 'Administrador - Acceso Total'),
        ('VIEWER', 'Visualizador - Solo Lectura'),
        ('EDITOR', 'Editor - Ver y Editar'),
        ('MANAGER', 'Gestor - Sin Eliminar'),
        ('CUSTOM', 'Personalizado'),
    ]

    # ==========================================================================
    # IDENTIFICACIÓN
    # ==========================================================================
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la plantilla (ej: admin, viewer, editor)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la plantilla'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada de qué permisos otorga esta plantilla'
    )
    template_type = models.CharField(
        max_length=20,
        choices=TEMPLATE_TYPE_CHOICES,
        default='CUSTOM',
        db_index=True,
        verbose_name='Tipo de Plantilla'
    )

    # ==========================================================================
    # PERMISOS POR DEFECTO
    # ==========================================================================
    default_can_view = models.BooleanField(
        default=True,
        verbose_name='Ver por defecto',
        help_text='Permiso de visualización para todas las secciones'
    )
    default_can_create = models.BooleanField(
        default=False,
        verbose_name='Crear por defecto',
        help_text='Permiso de creación para todas las secciones'
    )
    default_can_edit = models.BooleanField(
        default=False,
        verbose_name='Editar por defecto',
        help_text='Permiso de edición para todas las secciones'
    )
    default_can_delete = models.BooleanField(
        default=False,
        verbose_name='Eliminar por defecto',
        help_text='Permiso de eliminación para todas las secciones'
    )

    # ==========================================================================
    # EXCEPCIONES Y EXCLUSIONES
    # ==========================================================================
    section_overrides = JSONField(
        default=dict,
        blank=True,
        verbose_name='Excepciones por Sección',
        help_text=(
            'Permisos específicos que sobreescriben los valores por defecto. '
            'Formato: {"section_code": {"can_view": true, "can_create": false, ...}}'
        )
    )
    excluded_sections = JSONField(
        default=list,
        blank=True,
        verbose_name='Secciones Excluidas',
        help_text=(
            'Lista de códigos de secciones donde NO se aplicará esta plantilla. '
            'Formato: ["section_code1", "section_code2"]'
        )
    )

    # ==========================================================================
    # CONFIGURACIÓN
    # ==========================================================================
    is_system = models.BooleanField(
        default=False,
        verbose_name='Es del sistema',
        help_text='Las plantillas del sistema no pueden eliminarse ni modificarse'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activa',
        help_text='Solo las plantillas activas pueden aplicarse'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización en la lista'
    )

    # ==========================================================================
    # EMPRESA (multi-tenant)
    # ==========================================================================
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='permission_templates',
        verbose_name='Empresa',
        help_text='Empresa propietaria. NULL = plantilla global del sistema'
    )

    # ==========================================================================
    # AUDITORÍA
    # ==========================================================================
    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permission_templates_created',
        verbose_name='Creado por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )

    class Meta:
        db_table = 'core_permission_template'
        verbose_name = 'Plantilla de Permisos'
        verbose_name_plural = 'Plantillas de Permisos'
        ordering = ['orden', 'template_type', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['template_type', 'is_active']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"

    def clean(self):
        """Validaciones del modelo."""
        from django.core.exceptions import ValidationError

        # Validar formato de section_overrides
        if self.section_overrides:
            valid_keys = {'can_view', 'can_create', 'can_edit', 'can_delete', 'custom_actions'}
            for section_code, perms in self.section_overrides.items():
                if not isinstance(perms, dict):
                    raise ValidationError({
                        'section_overrides': f'El valor para "{section_code}" debe ser un diccionario'
                    })
                invalid_keys = set(perms.keys()) - valid_keys
                if invalid_keys:
                    raise ValidationError({
                        'section_overrides': f'Claves inválidas en "{section_code}": {invalid_keys}'
                    })

        # Validar formato de excluded_sections
        if self.excluded_sections:
            if not isinstance(self.excluded_sections, list):
                raise ValidationError({
                    'excluded_sections': 'Debe ser una lista de códigos de sección'
                })

    def get_permissions_for_section(self, section_code: str) -> dict | None:
        """
        Obtiene los permisos que esta plantilla asigna a una sección.

        Args:
            section_code: Código de la sección

        Returns:
            dict con permisos o None si la sección está excluida
        """
        # Verificar exclusiones
        if section_code in (self.excluded_sections or []):
            return None

        # Valores por defecto
        permissions = {
            'can_view': self.default_can_view,
            'can_create': self.default_can_create,
            'can_edit': self.default_can_edit,
            'can_delete': self.default_can_delete,
            'custom_actions': {},
        }

        # Aplicar overrides si existen
        overrides = self.section_overrides or {}
        if section_code in overrides:
            section_perms = overrides[section_code]
            permissions.update({
                k: v for k, v in section_perms.items()
                if k in permissions
            })

        return permissions

    def apply_to_cargo(self, cargo, user=None, replace: bool = True) -> tuple:
        """
        Aplica esta plantilla a un cargo, creando/actualizando CargoSectionAccess.

        Args:
            cargo: Instancia de Cargo
            user: Usuario que aplica la plantilla (para auditoría)
            replace: Si True, elimina accesos existentes primero

        Returns:
            tuple: (created_count, updated_count, skipped_count)
        """
        from apps.core.models import TabSection, CargoSectionAccess
        from django.db import transaction

        sections = TabSection.objects.filter(is_enabled=True)
        created_count = 0
        updated_count = 0
        skipped_count = 0

        with transaction.atomic():
            # Opcionalmente eliminar accesos existentes
            if replace:
                CargoSectionAccess.objects.filter(cargo=cargo).delete()

            for section in sections:
                permissions = self.get_permissions_for_section(section.code)

                if permissions is None:
                    skipped_count += 1
                    continue

                # Solo crear acceso si tiene al menos can_view
                if not permissions.get('can_view', False):
                    skipped_count += 1
                    continue

                access, created = CargoSectionAccess.objects.update_or_create(
                    cargo=cargo,
                    section=section,
                    defaults={
                        'can_view': permissions['can_view'],
                        'can_create': permissions['can_create'],
                        'can_edit': permissions['can_edit'],
                        'can_delete': permissions['can_delete'],
                        'custom_actions': permissions.get('custom_actions', {}),
                        'granted_by': user,
                    }
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            # Registrar aplicación
            PermissionTemplateApplication.objects.create(
                template=self,
                cargo=cargo,
                applied_by=user,
                sections_created=created_count,
                sections_updated=updated_count,
                sections_skipped=skipped_count,
                replace_mode=replace,
            )

        return created_count, updated_count, skipped_count

    def preview_for_cargo(self, cargo) -> list:
        """
        Genera una vista previa de los permisos que se aplicarían.

        Args:
            cargo: Instancia de Cargo

        Returns:
            list de dict con información de cada sección
        """
        from apps.core.models import TabSection

        sections = TabSection.objects.filter(
            is_enabled=True
        ).select_related('tab__module').order_by(
            'tab__module__orden', 'tab__orden', 'orden'
        )

        preview = []
        for section in sections:
            permissions = self.get_permissions_for_section(section.code)
            preview.append({
                'section_id': section.id,
                'section_code': section.code,
                'section_name': section.name,
                'module_code': section.tab.module.code,
                'module_name': section.tab.module.name,
                'tab_code': section.tab.code,
                'tab_name': section.tab.name,
                'permissions': permissions,
                'excluded': permissions is None,
            })

        return preview


class PermissionTemplateApplication(models.Model):
    """
    Registro de aplicación de plantillas a cargos (auditoría).

    Mantiene un historial completo de cuándo y por quién se aplicaron
    plantillas, permitiendo trazabilidad y cumplimiento normativo.
    """
    template = models.ForeignKey(
        PermissionTemplate,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name='Plantilla'
    )
    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.CASCADE,
        related_name='template_applications',
        verbose_name='Cargo'
    )
    applied_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha de aplicación'
    )
    applied_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='template_applications_made',
        verbose_name='Aplicado por'
    )
    sections_created = models.PositiveIntegerField(
        default=0,
        verbose_name='Secciones creadas'
    )
    sections_updated = models.PositiveIntegerField(
        default=0,
        verbose_name='Secciones actualizadas'
    )
    sections_skipped = models.PositiveIntegerField(
        default=0,
        verbose_name='Secciones omitidas'
    )
    replace_mode = models.BooleanField(
        default=True,
        verbose_name='Modo reemplazo',
        help_text='Si se eliminaron permisos anteriores antes de aplicar'
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas',
        help_text='Notas adicionales sobre la aplicación'
    )

    class Meta:
        db_table = 'core_permission_template_application'
        verbose_name = 'Aplicación de Plantilla'
        verbose_name_plural = 'Aplicaciones de Plantillas'
        ordering = ['-applied_at']
        indexes = [
            models.Index(fields=['template', 'applied_at']),
            models.Index(fields=['cargo', 'applied_at']),
            models.Index(fields=['applied_by', 'applied_at']),
        ]

    def __str__(self):
        return f"{self.template.name} → {self.cargo.name} ({self.applied_at.strftime('%Y-%m-%d %H:%M')})"

    @property
    def total_sections_affected(self) -> int:
        """Total de secciones afectadas por la aplicación."""
        return self.sections_created + self.sections_updated
