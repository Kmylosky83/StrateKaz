"""
Tenant App - StrateKaz Multi-Tenant System

Esta aplicación maneja la arquitectura multi-tenant con PostgreSQL Schemas:
- Tenant: Registro de cada empresa/cliente (hereda de TenantMixin)
- Domain: Dominios asociados a tenants (hereda de DomainMixin)
- Plan: Planes de suscripción
- TenantUser: Usuarios globales con acceso a múltiples tenants

Arquitectura:
- Schema 'public': Tenant, Domain, Plan, TenantUser (compartidos)
- Schema 'tenant_xxx': Todos los modelos de negocio (aislados por tenant)
"""
default_app_config = 'apps.tenant.apps.TenantConfig'
