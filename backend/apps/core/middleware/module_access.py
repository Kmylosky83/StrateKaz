"""
Middleware para validar que los módulos estén activos antes de permitir acceso a APIs.

Mapea URL prefixes a module codes y valida SystemModule.is_enabled.
Si el módulo está desactivado, retorna 403 Forbidden.

URLs excluidas: /api/core/, /api/tenant/, /api/auth/, /api/health/, /admin/

Soporte multi-módulo: una URL puede mapearse a varios module_codes (lista).
Basta con que UNO esté habilitado para permitir acceso.
Ejemplo: /api/talent-hub/ → ['talent_hub', 'mi_equipo']
"""
import logging
from django.http import JsonResponse
from django.db import connection

logger = logging.getLogger('apps')

# Mapeo de prefijos de URL a códigos de módulo en SystemModule
# Sincronizado con config/urls.py y seed_estructura_final.py
#
# Valor puede ser str (un módulo) o list[str] (cualquiera de ellos habilita acceso).
# Mi Equipo (L20) usa endpoints de talent-hub para colaboradores, selección y
# onboarding. Si mi_equipo está habilitado, se permite acceso a /api/talent-hub/.
URL_TO_MODULE_CODE: dict[str, str | list[str]] = {
    # C1 — Fundación
    'api/configuracion/': 'fundacion',
    'api/organizacion/': 'fundacion',
    'api/identidad/': 'fundacion',
    'api/encuestas-dofa/': 'fundacion',  # DOFA = Contexto Organizacional (C1)
    # C2 — Planeación Estratégica
    'api/planeacion/': 'planeacion_estrategica',
    'api/proyectos/': 'planeacion_estrategica',
    # C3 — Revisión por la Dirección
    'api/revision-direccion/': 'revision_direccion',
    # Legacy (redirige a fundacion para compatibilidad)
    'api/gestion-estrategica/': 'fundacion',
    # C2 — Otros módulos
    'api/cumplimiento/': 'motor_cumplimiento',
    'api/riesgos/': 'motor_riesgos',
    'api/workflows/': 'workflow_engine',
    'api/hseq/': 'hseq_management',
    'api/supply-chain/': 'supply_chain',
    'api/production-ops/': 'production_ops',
    'api/logistics-fleet/': 'logistics_fleet',
    'api/sales-crm/': 'sales_crm',
    'api/talent-hub/': ['talent_hub', 'mi_equipo'],
    'api/mi-equipo/': 'mi_equipo',
    'api/administracion/': 'administracion',
    'api/tesoreria/': 'tesoreria',
    'api/accounting/': 'accounting',
    'api/analytics/': 'analytics',
    'api/audit/': 'audit_system',
    # Gestión Documental
    'api/gestion-documental/': 'sistema_gestion',
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

        # Encontrar el/los módulo(s) correspondientes a esta URL
        module_codes = self._get_module_codes(path)
        if not module_codes:
            # URL no mapeada a ningún módulo → permitir (puede ser un endpoint custom)
            return self.get_response(request)

        # Verificar si al menos un módulo está activo
        if not self._is_any_module_enabled(module_codes):
            logger.warning(
                f'Acceso bloqueado a módulo(s) desactivado(s): {module_codes} '
                f'(path: {path}, schema: {schema_name})'
            )
            return JsonResponse(
                {
                    'error': 'Módulo no disponible',
                    'detail': 'El módulo solicitado no está activo en esta empresa.',
                    'module_code': module_codes[0],
                },
                status=403,
            )

        return self.get_response(request)

    def _get_module_codes(self, path: str) -> list[str] | None:
        """Extrae los module_codes aplicables basándose en el prefix de la URL."""
        for prefix, codes in URL_TO_MODULE_CODE.items():
            if path.startswith(prefix):
                if isinstance(codes, list):
                    return codes
                return [codes]
        return None

    def _is_any_module_enabled(self, module_codes: list[str]) -> bool:
        """
        Verifica si AL MENOS UNO de los módulos está habilitado.

        Para URLs multi-módulo (ej: talent-hub compartido con mi_equipo),
        basta con que uno esté activo.
        """
        try:
            from apps.core.models import SystemModule
            return SystemModule.objects.filter(
                code__in=module_codes,
                is_enabled=True,
            ).exists()
        except Exception:
            # Si hay error (ej: tabla no existe aún), permitir acceso
            return True
