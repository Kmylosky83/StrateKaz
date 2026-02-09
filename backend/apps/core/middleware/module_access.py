"""
Middleware para validar que los módulos estén activos antes de permitir acceso a APIs.

Mapea URL prefixes a module codes y valida SystemModule.is_enabled.
Si el módulo está desactivado, retorna 403 Forbidden.

URLs excluidas: /api/core/, /api/tenant/, /api/auth/, /api/health/, /admin/
"""
import logging
from django.http import JsonResponse
from django.db import connection

logger = logging.getLogger('apps')

# Mapeo de prefijos de URL a códigos de módulo en SystemModule
# Sincronizado con config/urls.py y seed_estructura_final.py
URL_TO_MODULE_CODE = {
    'api/gestion-estrategica/': 'gestion_estrategica',
    'api/configuracion/': 'gestion_estrategica',
    'api/organizacion/': 'gestion_estrategica',
    'api/identidad/': 'gestion_estrategica',
    'api/planeacion/': 'gestion_estrategica',
    'api/encuestas-dofa/': 'gestion_estrategica',
    'api/proyectos/': 'gestion_estrategica',
    'api/revision-direccion/': 'gestion_estrategica',
    'api/cumplimiento/': 'motor_cumplimiento',
    'api/riesgos/': 'motor_riesgos',
    'api/workflows/': 'workflow_engine',
    'api/hseq/': 'hseq_management',
    'api/supply-chain/': 'supply_chain',
    'api/production-ops/': 'production_ops',
    'api/logistics-fleet/': 'logistics_fleet',
    'api/sales-crm/': 'sales_crm',
    'api/talent-hub/': 'talent_hub',
    'api/admin-finance/': 'admin_finance',
    'api/accounting/': 'accounting',
    'api/analytics/': 'analytics',
    'api/audit/': 'audit_system',
}

# Prefijos que NUNCA se bloquean (infraestructura)
EXCLUDED_PREFIXES = (
    'api/core/',
    'api/tenant/',
    'api/auth/',
    'api/health/',
    'api/schema/',
    'api/docs/',
    'api/redoc/',
    'admin/',
    'static/',
    'media/',
)


class ModuleAccessMiddleware:
    """
    Middleware que valida acceso a APIs basándose en si el módulo está activo.

    Flujo:
    1. Extrae el prefix de la URL
    2. Lo mapea a un module_code
    3. Consulta SystemModule.is_enabled para ese código
    4. Si está desactivado → 403

    Solo actúa en schemas de tenant (no en schema public).
    Cache de módulos por request para evitar N+1 queries.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Solo interceptar requests a la API
        path = request.path_info.lstrip('/')

        # Excluir rutas de infraestructura
        if not path.startswith('api/') or path.startswith(EXCLUDED_PREFIXES):
            return self.get_response(request)

        # Solo validar en schemas de tenant (no en public)
        schema_name = getattr(connection, 'schema_name', 'public')
        if schema_name == 'public':
            return self.get_response(request)

        # Encontrar el módulo correspondiente a esta URL
        module_code = self._get_module_code(path)
        if not module_code:
            # URL no mapeada a ningún módulo → permitir (puede ser un endpoint custom)
            return self.get_response(request)

        # Verificar si el módulo está activo
        if not self._is_module_enabled(module_code):
            logger.warning(
                f'Acceso bloqueado a módulo desactivado: {module_code} '
                f'(path: {path}, schema: {schema_name})'
            )
            return JsonResponse(
                {
                    'error': 'Módulo no disponible',
                    'detail': f'El módulo solicitado no está activo en esta empresa.',
                    'module_code': module_code,
                },
                status=403,
            )

        return self.get_response(request)

    def _get_module_code(self, path: str) -> str | None:
        """Extrae el module_code basándose en el prefix de la URL."""
        for prefix, code in URL_TO_MODULE_CODE.items():
            if path.startswith(prefix):
                return code
        return None

    def _is_module_enabled(self, module_code: str) -> bool:
        """
        Verifica si un módulo está habilitado en el schema actual.

        Usa la tabla core_system_module directamente para evitar
        imports circulares con models.
        """
        try:
            from apps.core.models import SystemModule
            return SystemModule.objects.filter(
                code=module_code,
                is_enabled=True,
            ).exists()
        except Exception:
            # Si hay error (ej: tabla no existe aún), permitir acceso
            return True
