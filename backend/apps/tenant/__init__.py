"""
Tenant App - StrateKaz Multi-Tenant System

Esta aplicación maneja la arquitectura multi-tenant con BD por cliente:
- Empresa (Tenant): Registro de cada empresa/cliente
- Plan: Planes de suscripción
- TenantMiddleware: Detección de tenant por subdominio
- DatabaseRouter: Routing dinámico de BD
"""
default_app_config = 'apps.tenant.apps.TenantConfig'
