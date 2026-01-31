"""
Database Router para Multi-Tenant System

Este router direcciona las queries a la BD correcta:
- BD Master: Modelos de tenant (Tenant, TenantUser, Plan)
- BD Tenant: Todos los demás modelos operativos
"""
from apps.tenant.middleware import get_current_tenant


class TenantDatabaseRouter:
    """
    Router que direcciona queries según el tenant actual.

    - Modelos en app 'tenant' → BD master (default)
    - Otros modelos → BD del tenant actual
    """

    # Apps que siempre van a la BD master
    MASTER_APPS = [
        'tenant',
        'admin',
        'contenttypes',
        'sessions',
        'auth',  # Solo para superusuarios de Django admin
    ]

    # Modelos específicos que van a master (por si hay modelos mixtos)
    MASTER_MODELS = [
        'tenant.Tenant',
        'tenant.TenantUser',
        'tenant.TenantUserAccess',
        'tenant.TenantDomain',
        'tenant.Plan',
    ]

    def db_for_read(self, model, **hints):
        """Determina qué BD usar para lectura"""
        return self._get_db_for_model(model)

    def db_for_write(self, model, **hints):
        """Determina qué BD usar para escritura"""
        return self._get_db_for_model(model)

    def allow_relation(self, obj1, obj2, **hints):
        """
        Permite relaciones entre objetos de la misma BD.
        """
        db1 = self._get_db_for_model(obj1._meta.model)
        db2 = self._get_db_for_model(obj2._meta.model)

        if db1 and db2:
            return db1 == db2
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Determina dónde ejecutar migraciones.

        - Apps de master → solo en 'default'
        - Apps de tenant → en todas las BDs de tenant
        """
        if app_label in self.MASTER_APPS:
            return db == 'default'

        # Para apps de tenant, migrar en BD default solo si no hay tenant activo
        # (durante manage.py migrate inicial)
        if db == 'default':
            return True  # Permitir migrar en default como fallback

        return True  # Permitir migrar en BDs de tenant

    def _get_db_for_model(self, model):
        """
        Determina la BD para un modelo específico.
        """
        app_label = model._meta.app_label
        model_name = f"{app_label}.{model.__name__}"

        # Verificar si es un modelo de master
        if app_label in self.MASTER_APPS:
            return 'default'

        if model_name in self.MASTER_MODELS:
            return 'default'

        # Para otros modelos, usar la BD del tenant actual
        tenant = get_current_tenant()

        if tenant:
            return f"tenant_{tenant.id}"

        # Si no hay tenant, usar default (para comandos de manage.py)
        return 'default'


class TenantAwareManager:
    """
    Mixin para managers que deben ser conscientes del tenant.

    Uso:
        class MiModeloManager(TenantAwareManager, models.Manager):
            pass
    """

    def get_queryset(self):
        """
        Retorna queryset usando la BD del tenant actual.
        """
        tenant = get_current_tenant()

        if tenant:
            return super().get_queryset().using(f"tenant_{tenant.id}")

        return super().get_queryset()
