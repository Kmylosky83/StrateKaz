"""
Abstract Base Models - Sistema de Gestión Grasas y Huesos del Norte
=====================================================================

Modelos base abstractos reutilizables para eliminar duplicación de código
y estandarizar patrones comunes en el proyecto.

Define:
- TimestampedModel: Timestamps automáticos (created_at, updated_at)
- SoftDeleteModel: Eliminación lógica (is_active, deleted_at)
- AuditModel: Auditoría de usuario (created_by, updated_by)
- BaseCompanyModel: Modelo base completo con empresa, auditoría y soft delete
- HierarchicalModel: Estructuras jerárquicas con parent/children
- OrderedModel: Ordenamiento personalizado con campo "orden"

Uso:
    from apps.core.base_models import BaseCompanyModel

    class MiModelo(BaseCompanyModel):
        nombre = models.CharField(max_length=100)
        # Hereda automáticamente:
        # - empresa (FK a EmpresaConfig)
        # - created_at, updated_at
        # - created_by, updated_by
        # - is_active, deleted_at
        # - método soft_delete()

Referencias:
- REFACTORING-PLAN.md: Plan maestro de refactorización
- Django Abstract Models: https://docs.djangoproject.com/en/4.2/topics/db/models/#abstract-base-classes

Autor: Sistema de Gestión
Fecha: 2025-12-24
"""

from django.db import models
from django.conf import settings
from django.utils import timezone


class TimestampedModel(models.Model):
    """
    Modelo abstracto base con timestamps automáticos.

    Agrega campos de auditoría de tiempo que se gestionan automáticamente:
    - created_at: Se establece automáticamente al crear el registro
    - updated_at: Se actualiza automáticamente cada vez que se guarda
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación',
        help_text='Fecha y hora de creación del registro (automático)',
        db_index=True
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización',
        help_text='Fecha y hora de la última actualización (automático)',
        db_index=True
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']


class SoftDeleteModel(models.Model):
    """
    Modelo abstracto base con eliminación lógica (Soft Delete).

    Implementa el patrón de soft delete donde los registros nunca se eliminan
    físicamente de la base de datos, sino que se marcan como inactivos.
    """

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='Indica si el registro está activo o ha sido eliminado lógicamente'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Eliminación',
        help_text='Fecha y hora de eliminación lógica (null = no eliminado)',
        db_index=True
    )

    class Meta:
        abstract = True

    def soft_delete(self):
        """Elimina lógicamente el registro."""
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_active', 'deleted_at', 'updated_at'])

    def restore(self):
        """Restaura un registro eliminado lógicamente."""
        self.is_active = True
        self.deleted_at = None
        self.save(update_fields=['is_active', 'deleted_at', 'updated_at'])

    @property
    def is_deleted(self):
        """Propiedad de conveniencia para verificar si está eliminado."""
        return self.deleted_at is not None


class AuditModel(TimestampedModel):
    """
    Modelo abstracto base con auditoría de usuario.

    Extiende TimestampedModel agregando tracking de qué usuario creó/modificó
    cada registro.
    """

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='%(class)s_created',
        null=True,
        blank=True,
        verbose_name='Creado por',
        help_text='Usuario que creó el registro'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='%(class)s_updated',
        null=True,
        blank=True,
        verbose_name='Actualizado por',
        help_text='Usuario que realizó la última actualización'
    )

    class Meta:
        abstract = True


class BaseCompanyModel(AuditModel, SoftDeleteModel):
    """
    Modelo base completo para entidades relacionadas con la empresa.

    Este es el modelo base más utilizado en el proyecto. Combina:
    - Timestamps (created_at, updated_at) de TimestampedModel
    - Auditoría (created_by, updated_by) de AuditModel
    - Soft Delete (is_active, deleted_at) de SoftDeleteModel
    - Foreign Key a EmpresaConfig (empresa)
    """

    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='%(class)s_set',
        verbose_name='Empresa',
        help_text='Empresa a la que pertenece este registro',
        default=1  # Default temporal para migraciones
    )

    class Meta:
        abstract = True

    def get_empresa_info(self):
        """Método de conveniencia para obtener información de la empresa."""
        if self.empresa:
            return {
                'razon_social': self.empresa.razon_social,
                'nit': self.empresa.nit,
                'nombre_comercial': self.empresa.nombre_comercial,
            }
        return None


class HierarchicalModel(models.Model):
    """
    Modelo abstracto base para estructuras jerárquicas tipo árbol.

    Implementa el patrón de auto-referencia para modelar jerarquías
    como organigramas, categorías anidadas, estructuras de carpetas, etc.
    """

    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Padre',
        help_text='Elemento padre en la jerarquía (null si es raíz)'
    )
    level = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name='Nivel',
        help_text='Nivel en la jerarquía (0 = raíz)'
    )
    path = models.CharField(
        max_length=500,
        blank=True,
        db_index=True,
        verbose_name='Ruta',
        help_text='Ruta completa en formato /id/id/id para consultas eficientes'
    )

    class Meta:
        abstract = True
        ordering = ['path']

    def save(self, *args, **kwargs):
        """Override de save para auto-calcular level y path."""
        if self.parent:
            self.level = self.parent.level + 1
        else:
            self.level = 0

        if not self.pk:
            self.path = ''
            super().save(*args, **kwargs)

        if self.parent:
            self.path = f"{self.parent.path}/{self.pk}"
        else:
            self.path = f"/{self.pk}"

        super().save(update_fields=['level', 'path'])

    def get_ancestors(self):
        """Obtiene todos los ancestros (padres, abuelos, etc.) del elemento."""
        if not self.parent:
            return self.__class__.objects.none()
        ids = [int(id) for id in self.path.split('/') if id and int(id) != self.pk]
        return self.__class__.objects.filter(pk__in=ids).order_by('level')

    def get_descendants(self):
        """Obtiene todos los descendientes (hijos, nietos, etc.) del elemento."""
        return self.__class__.objects.filter(
            path__startswith=self.path
        ).exclude(pk=self.pk)

    def get_siblings(self, include_self=False):
        """Obtiene todos los hermanos (elementos con el mismo padre)."""
        siblings = self.__class__.objects.filter(parent=self.parent)
        if not include_self:
            siblings = siblings.exclude(pk=self.pk)
        return siblings

    @property
    def is_root(self):
        """Verifica si el elemento es raíz (no tiene padre)."""
        return self.parent is None

    @property
    def is_leaf(self):
        """Verifica si el elemento es hoja (no tiene hijos)."""
        return not self.children.exists()


class OrderedModel(models.Model):
    """
    Modelo abstracto base con orden personalizable.

    Agrega campo 'orden' para permitir ordenamiento manual de registros
    independientemente del orden de creación o alfabético.
    """

    orden = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name='Orden',
        help_text='Orden de visualización (menor número = primero)'
    )

    class Meta:
        abstract = True
        ordering = ['orden', 'id']

    def move_up(self):
        """Mueve el elemento una posición arriba (decrementa orden)."""
        if self.orden <= 0:
            return False
        try:
            above = self.__class__.objects.filter(
                orden__lt=self.orden
            ).order_by('-orden').first()
            if above:
                above_orden = above.orden
                above.orden = self.orden
                self.orden = above_orden
                above.save(update_fields=['orden'])
                self.save(update_fields=['orden'])
                return True
        except Exception:
            pass
        return False

    def move_down(self):
        """Mueve el elemento una posición abajo (incrementa orden)."""
        try:
            below = self.__class__.objects.filter(
                orden__gt=self.orden
            ).order_by('orden').first()
            if below:
                below_orden = below.orden
                below.orden = self.orden
                self.orden = below_orden
                below.save(update_fields=['orden'])
                self.save(update_fields=['orden'])
                return True
        except Exception:
            pass
        return False


__all__ = [
    'TimestampedModel',
    'SoftDeleteModel',
    'AuditModel',
    'BaseCompanyModel',
    'HierarchicalModel',
    'OrderedModel',
]
