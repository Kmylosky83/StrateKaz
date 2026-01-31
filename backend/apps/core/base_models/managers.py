"""
Managers personalizados para el sistema multi-tenant y soft delete.

Este módulo proporciona managers que:
1. Filtran automáticamente registros eliminados (soft delete)
2. Proveen métodos para acceder a registros eliminados cuando sea necesario
3. Implementan QuerySets personalizados con métodos de soft delete
"""
from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    """
    QuerySet con métodos de soft delete.

    Proporciona métodos para eliminar, restaurar y consultar
    registros eliminados de forma segura.
    """

    def delete(self):
        """
        Soft delete: marca registros como eliminados sin borrarlos.

        Returns:
            int: Número de registros actualizados
        """
        return self.update(
            is_active=False,
            deleted_at=timezone.now()
        )

    def hard_delete(self):
        """
        Hard delete: elimina registros permanentemente.

        ⚠️ PRECAUCIÓN: Esta operación es irreversible.
        Solo usar para limpieza de datos o cumplimiento normativo.

        Returns:
            tuple: (número eliminados, diccionario por tipo)
        """
        return super().delete()

    def restore(self):
        """
        Restaurar registros eliminados.

        Returns:
            int: Número de registros restaurados
        """
        return self.update(
            is_active=True,
            deleted_at=None,
            deleted_by=None
        )

    def active_only(self):
        """Filtrar solo registros activos."""
        return self.filter(is_active=True, deleted_at__isnull=True)

    def deleted_only(self):
        """Filtrar solo registros eliminados."""
        return self.filter(is_active=False)


class ActiveManager(models.Manager):
    """
    Manager que excluye registros eliminados (soft delete).

    Solo retorna registros con is_active=True y deleted_at=NULL.
    Este debería ser el manager por defecto para la mayoría de consultas.

    Uso:
        class MyModel(SoftDeleteModel):
            objects = ActiveManager()  # Solo activos
            all_objects = AllObjectsManager()  # Todos
    """

    def get_queryset(self):
        """Retorna solo registros activos no eliminados."""
        return SoftDeleteQuerySet(self.model, using=self._db).filter(
            is_active=True,
            deleted_at__isnull=True
        )


class AllObjectsManager(models.Manager):
    """
    Manager que retorna TODOS los registros, incluyendo eliminados.

    ⚠️ PRECAUCIÓN: Usar solo para:
    - Auditoría y reportes
    - Panel de administración
    - Restauración de registros

    Uso:
        MyModel.all_objects.all()  # Incluye eliminados
        MyModel.all_objects.deleted_only()  # Solo eliminados
    """

    def get_queryset(self):
        """Retorna todos los registros sin filtrar."""
        return SoftDeleteQuerySet(self.model, using=self._db)

    def deleted_only(self):
        """Retorna solo registros eliminados."""
        return self.get_queryset().filter(is_active=False)

    def active_only(self):
        """Retorna solo registros activos."""
        return self.get_queryset().filter(
            is_active=True,
            deleted_at__isnull=True
        )


class SoftDeleteManager(models.Manager):
    """
    Manager con soporte completo de soft delete.

    Combina las funcionalidades de ActiveManager con métodos
    adicionales para acceder a registros eliminados.

    Uso:
        class MyModel(models.Model):
            objects = SoftDeleteManager()

        MyModel.objects.all()  # Solo activos
        MyModel.objects.all_with_deleted()  # Todos
        MyModel.objects.deleted_only()  # Solo eliminados
    """

    def get_queryset(self):
        """Retorna solo registros activos por defecto."""
        return SoftDeleteQuerySet(self.model, using=self._db).filter(
            is_active=True,
            deleted_at__isnull=True
        )

    def all_with_deleted(self):
        """
        Retorna todos los registros incluyendo eliminados.

        Returns:
            QuerySet: Todos los registros sin filtrar
        """
        return SoftDeleteQuerySet(self.model, using=self._db)

    def deleted_only(self):
        """
        Retorna solo registros eliminados.

        Returns:
            QuerySet: Solo registros con is_active=False
        """
        return SoftDeleteQuerySet(self.model, using=self._db).filter(
            is_active=False
        )

    def restore(self, pk):
        """
        Restaurar un registro específico por su PK.

        Args:
            pk: Primary key del registro a restaurar

        Returns:
            int: 1 si se restauró, 0 si no se encontró
        """
        return self.all_with_deleted().filter(pk=pk).restore()


# Alias para compatibilidad
DefaultManager = ActiveManager
