"""
Serializers para Multi-Tenant System
"""
from rest_framework import serializers
from apps.tenant.models import Tenant, TenantUser, TenantUserAccess, TenantDomain, Plan


class PlanSerializer(serializers.ModelSerializer):
    """Serializer para Plan"""

    class Meta:
        model = Plan
        fields = [
            'id', 'code', 'name', 'description',
            'max_users', 'max_storage_gb',
            'price_monthly', 'price_yearly',
            'features', 'is_active', 'is_default',
        ]
        read_only_fields = ['id']


class TenantSerializer(serializers.ModelSerializer):
    """Serializer para Tenant"""

    plan_name = serializers.CharField(source='plan.name', read_only=True, allow_null=True)
    full_domain = serializers.CharField(read_only=True)
    is_subscription_valid = serializers.BooleanField(read_only=True)
    effective_max_users = serializers.IntegerField(read_only=True)
    effective_modules = serializers.ListField(read_only=True)

    class Meta:
        model = Tenant
        fields = [
            'id', 'code', 'name', 'nit',
            'subdomain', 'custom_domain', 'full_domain',
            'db_name', 'db_host', 'db_port',
            'plan', 'plan_name',
            'max_users', 'max_storage_gb', 'tier', 'enabled_modules',
            'effective_max_users', 'effective_modules',
            'is_active', 'is_trial', 'trial_ends_at', 'subscription_ends_at',
            'is_subscription_valid',
            'logo_url', 'primary_color',
            'backup_enabled', 'backup_retention_days',
            'created_at', 'updated_at', 'notes',
        ]
        read_only_fields = ['id', 'db_name', 'created_at', 'updated_at']


class TenantMinimalSerializer(serializers.ModelSerializer):
    """Serializer mínimo para Tenant (usado en listas)"""

    class Meta:
        model = Tenant
        fields = [
            'id', 'code', 'name', 'subdomain',
            'logo_url', 'primary_color', 'is_active',
        ]


class TenantUserAccessSerializer(serializers.ModelSerializer):
    """Serializer para acceso de usuario a tenant"""

    tenant = TenantMinimalSerializer(read_only=True)

    class Meta:
        model = TenantUserAccess
        fields = ['tenant', 'role', 'is_active', 'created_at']


class TenantUserSerializer(serializers.ModelSerializer):
    """Serializer para TenantUser"""

    accesses = TenantUserAccessSerializer(many=True, read_only=True)
    tenant_count = serializers.SerializerMethodField()

    class Meta:
        model = TenantUser
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'phone', 'is_active', 'is_superadmin',
            'last_login', 'last_tenant',
            'accesses', 'tenant_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'last_login', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def get_tenant_count(self, obj):
        return obj.tenants.count()


class UserTenantsSerializer(serializers.ModelSerializer):
    """
    Serializer para obtener los tenants de un usuario.
    Usado en el endpoint /tenant/users/me/
    """

    tenants = serializers.SerializerMethodField()

    class Meta:
        model = TenantUser
        fields = ['id', 'email', 'first_name', 'last_name', 'last_tenant', 'tenants']

    def get_tenants(self, obj):
        accesses = obj.accesses.filter(
            is_active=True,
            tenant__is_active=True
        ).select_related('tenant')

        return [
            {
                'tenant': TenantMinimalSerializer(access.tenant).data,
                'role': access.role,
                'is_active': access.is_active,
            }
            for access in accesses
        ]


class TenantDomainSerializer(serializers.ModelSerializer):
    """Serializer para dominios adicionales"""

    class Meta:
        model = TenantDomain
        fields = ['id', 'domain', 'is_primary', 'is_active', 'ssl_enabled', 'created_at']
        read_only_fields = ['id', 'created_at']
