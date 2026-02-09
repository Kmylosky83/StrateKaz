"""
Modelos Base para StrateKaz

Todos los modelos del sistema deben heredar de estos modelos base
para garantizar consistencia en auditoría, soft-delete y timestamps.

Uso:
    # Para modelos de tenant (la mayoría)
    from utils.models import TenantModel

    class Proyecto(TenantModel):
        nombre = models.CharField(max_length=200)

    # Para modelos compartidos (schema public)
    from utils.models import SharedModel

    class Plan(SharedModel):
        nombre = models.CharField(max_length=100)
"""

from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """
    Modelo abstracto que proporciona campos de timestamp.

    Campos:
        created_at: Fecha/hora de creación (automático)
        updated_at: Fecha/hora de última actualización (automático)
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Fecha de creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Última actualización"
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']


class SoftDeleteQuerySet(models.QuerySet):
    """QuerySet personalizado para soft delete."""

    def active(self):
        """Retorna solo registros no eliminados."""
        return self.filter(is_deleted=False)

    def deleted(self):
        """Retorna solo registros eliminados."""
        return self.filter(is_deleted=True)

    def hard_delete(self):
        """Elimina físicamente los registros."""
        return super().delete()


class SoftDeleteManager(models.Manager):
    """Manager que por defecto excluye registros eliminados."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).active()

    def all_with_deleted(self):
        """Incluye registros eliminados."""
        return SoftDeleteQuerySet(self.model, using=self._db)

    def deleted_only(self):
        """Solo registros eliminados."""
        return SoftDeleteQuerySet(self.model, using=self._db).deleted()


class SoftDeleteModel(models.Model):
    """
    Modelo abstracto que proporciona soft delete.

    En lugar de eliminar físicamente, marca is_deleted=True.

    Campos:
        is_deleted: Indica si está eliminado
        deleted_at: Fecha/hora de eliminación
        deleted_by: Usuario que eliminó
    """

    is_deleted = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Eliminado"
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de eliminación"
    )
    deleted_by = models.ForeignKey(
        'core.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        verbose_name="Eliminado por"
    )

    # Manager por defecto excluye eliminados
    objects = SoftDeleteManager()

    # Manager para incluir eliminados
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def soft_delete(self, user=None):
        """
        Marca el registro como eliminado.

        Args:
            user: Usuario que realiza la eliminación (opcional)
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])

    def restore(self):
        """Restaura un registro eliminado."""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])

    def hard_delete(self):
        """Elimina físicamente el registro."""
        super().delete()

    def delete(self, using=None, keep_parents=False, user=None):
        """Override de delete para hacer soft delete por defecto."""
        self.soft_delete(user=user)


class AuditModel(models.Model):
    """
    Modelo abstracto que proporciona campos de auditoría de usuario.

    Campos:
        created_by: Usuario que creó el registro
        updated_by: Usuario que actualizó por última vez
    """

    created_by = models.ForeignKey(
        'core.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        verbose_name="Creado por"
    )
    updated_by = models.ForeignKey(
        'core.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        verbose_name="Actualizado por"
    )

    class Meta:
        abstract = True


class TenantModel(TimeStampedModel, SoftDeleteModel, AuditModel):
    """
    Modelo base para TODOS los modelos que pertenecen a un tenant.

    Hereda:
        - TimeStampedModel: created_at, updated_at
        - SoftDeleteModel: is_deleted, deleted_at, deleted_by
        - AuditModel: created_by, updated_by

    Uso:
        class Proyecto(TenantModel):
            nombre = models.CharField(max_length=200)

    Nota:
        django-tenants se encarga del aislamiento por schema,
        no es necesario agregar un campo tenant_id.
    """

    class Meta:
        abstract = True


class SharedModel(TimeStampedModel):
    """
    Modelo base para modelos compartidos (schema public).

    Solo incluye timestamps, sin soft-delete ni auditoría de usuario.
    Usado para: Tenant, Plan, TenantUser, TenantDomain

    Uso:
        class Plan(SharedModel):
            nombre = models.CharField(max_length=100)
    """

    class Meta:
        abstract = True


# ==============================================================================
# Mixins opcionales para funcionalidades adicionales
# ==============================================================================

class OrderedModel(models.Model):
    """
    Mixin para modelos que necesitan ordenamiento manual.

    Campos:
        order: Posición en el ordenamiento
    """

    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Orden"
    )

    class Meta:
        abstract = True
        ordering = ['order']

    def move_up(self):
        """Mueve el elemento una posición arriba."""
        if self.order > 0:
            self.order -= 1
            self.save(update_fields=['order'])

    def move_down(self):
        """Mueve el elemento una posición abajo."""
        self.order += 1
        self.save(update_fields=['order'])


class SlugModel(models.Model):
    """
    Mixin para modelos que necesitan un slug único.

    Campos:
        slug: Identificador URL-friendly único
    """

    slug = models.SlugField(
        max_length=255,
        unique=True,
        db_index=True,
        verbose_name="Slug"
    )

    class Meta:
        abstract = True


class ActivableModel(models.Model):
    """
    Mixin para modelos que pueden activarse/desactivarse.

    Campos:
        is_active: Indica si está activo
    """

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Activo"
    )

    class Meta:
        abstract = True

    def activate(self):
        """Activa el registro."""
        self.is_active = True
        self.save(update_fields=['is_active'])

    def deactivate(self):
        """Desactiva el registro."""
        self.is_active = False
        self.save(update_fields=['is_active'])


class CodeModel(models.Model):
    """
    Mixin para modelos que necesitan un código único legible.

    Campos:
        code: Código único (ej: PROJ-001)
    """

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Código"
    )

    class Meta:
        abstract = True


class DescriptionModel(models.Model):
    """
    Mixin para modelos con nombre y descripción.

    Campos:
        name: Nombre del registro
        description: Descripción opcional
    """

    name = models.CharField(
        max_length=255,
        verbose_name="Nombre"
    )
    description = models.TextField(
        blank=True,
        default='',
        verbose_name="Descripción"
    )

    class Meta:
        abstract = True

    def __str__(self):
        return self.name
