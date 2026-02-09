"""
API para Sincronización de Secciones - RBAC StrateKaz v4.1

Proporciona endpoints para que el frontend obtenga la estructura
de secciones y genere tipos automáticamente.

Endpoints:
- GET /api/core/sections/all/ - Todas las secciones
- GET /api/core/sections/typescript/ - Genera código TypeScript
- GET /api/core/sections/user-access/ - Accesos del usuario actual
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from apps.core.models import SystemModule, ModuleTab, TabSection


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_sections(request):
    """
    GET /api/core/sections/all/

    Retorna todas las secciones del sistema para sincronización con frontend.

    Query params:
    - module: Filtrar por código de módulo
    - include_disabled: Incluir secciones deshabilitadas (solo admin)

    Response:
    {
        "sections": [
            {
                "id": 1,
                "code": "empresa",
                "name": "Datos de Empresa",
                "description": "...",
                "module_code": "gestion_estrategica",
                "module_name": "Direccion Estratégica",
                "tab_code": "configuracion",
                "tab_name": "Configuración",
                "icon": "Building2",
                "orden": 1,
                "is_core": false,
                "supported_actions": ["enviar", "aprobar"],
                "full_path": "gestion_estrategica.configuracion.empresa"
            },
            ...
        ],
        "modules": [
            {"code": "gestion_estrategica", "name": "Direccion Estratégica", "icon": "Target"},
            ...
        ],
        "version": "2024.01.15.1430",
        "total_sections": 85,
        "generated_at": "2024-01-15T14:30:00Z"
    }
    """
    # Filtros opcionales
    module_filter = request.query_params.get('module')
    include_disabled = (
        request.query_params.get('include_disabled', 'false').lower() == 'true'
        and request.user.is_superuser
    )

    # Query de secciones
    sections_qs = TabSection.objects.select_related('tab__module')

    if not include_disabled:
        sections_qs = sections_qs.filter(
            is_enabled=True,
            tab__is_enabled=True,
            tab__module__is_enabled=True
        )

    if module_filter:
        sections_qs = sections_qs.filter(tab__module__code=module_filter)

    sections_qs = sections_qs.order_by(
        'tab__module__orden',
        'tab__orden',
        'orden'
    )

    # Query de módulos
    modules_qs = SystemModule.objects.filter(is_enabled=True).order_by('orden')

    # Construir respuesta
    sections_data = [
        {
            'id': s.id,
            'code': s.code,
            'name': s.name,
            'description': s.description or '',
            'module_code': s.tab.module.code,
            'module_name': s.tab.module.name,
            'tab_code': s.tab.code,
            'tab_name': s.tab.name,
            'icon': s.icon or '',
            'orden': s.orden,
            'is_core': s.is_core,
            'is_enabled': s.is_enabled,
            'supported_actions': s.supported_actions or [],
            'full_path': f"{s.tab.module.code}.{s.tab.code}.{s.code}",
        }
        for s in sections_qs
    ]

    modules_data = [
        {
            'code': m.code,
            'name': m.name,
            'icon': m.icon or '',
            'orden': m.orden,
        }
        for m in modules_qs
    ]

    # Versión basada en última actualización
    latest_update = sections_qs.order_by('-updated_at').first()
    version = (
        latest_update.updated_at.strftime('%Y.%m.%d.%H%M')
        if latest_update and hasattr(latest_update, 'updated_at')
        else timezone.now().strftime('%Y.%m.%d.%H%M')
    )

    return Response({
        'sections': sections_data,
        'modules': modules_data,
        'version': version,
        'total_sections': len(sections_data),
        'total_modules': len(modules_data),
        'generated_at': timezone.now().isoformat(),
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_section_codes_typescript(request):
    """
    GET /api/core/sections/typescript/

    Genera código TypeScript con constantes de secciones.

    El frontend puede llamar este endpoint y guardar la respuesta
    como archivo .ts para mantener sincronización automática.

    Response:
    {
        "typescript": "export const SectionCodes = {...}",
        "sections_count": 85,
        "modules_count": 14,
        "generated_at": "2024-01-15T14:30:00Z"
    }
    """
    sections = TabSection.objects.filter(
        is_enabled=True
    ).select_related('tab__module').order_by(
        'tab__module__orden',
        'tab__orden',
        'orden'
    )

    modules = SystemModule.objects.filter(is_enabled=True).order_by('orden')

    # Agrupar secciones por módulo
    modules_dict = {}
    for s in sections:
        module_code = s.tab.module.code.upper().replace('-', '_')
        if module_code not in modules_dict:
            modules_dict[module_code] = []
        modules_dict[module_code].append({
            'code_upper': s.code.upper().replace('-', '_'),
            'code_value': s.code,
            'name': s.name,
        })

    # Generar TypeScript
    timestamp = timezone.now().isoformat()

    ts_code = f'''/**
 * ARCHIVO AUTOGENERADO - NO EDITAR MANUALMENTE
 *
 * Generado desde: GET /api/core/sections/typescript/
 * Última actualización: {timestamp}
 *
 * Para regenerar, ejecutar:
 * curl -H "Authorization: Token <token>" http://localhost:8000/api/core/sections/typescript/ | jq -r '.typescript' > src/constants/sections.generated.ts
 */

// =============================================================================
// CÓDIGOS DE MÓDULOS
// =============================================================================
export const ModuleCodes = {{
'''

    for m in modules:
        code_upper = m.code.upper().replace('-', '_')
        ts_code += f"  {code_upper}: '{m.code}',\n"

    ts_code += '} as const;\n\n'
    ts_code += 'export type ModuleCode = typeof ModuleCodes[keyof typeof ModuleCodes];\n\n'

    # Secciones
    ts_code += '''// =============================================================================
// CÓDIGOS DE SECCIONES
// =============================================================================
export const SectionCodes = {
'''

    for module_code, sections_list in modules_dict.items():
        ts_code += f'  // {module_code}\n'
        for s in sections_list:
            ts_code += f"  {s['code_upper']}: '{s['code_value']}',  // {s['name']}\n"

    ts_code += '} as const;\n\n'
    ts_code += 'export type SectionCode = typeof SectionCodes[keyof typeof SectionCodes];\n\n'

    # Mapeo de secciones por módulo
    ts_code += '''// =============================================================================
// MAPEO DE SECCIONES POR MÓDULO
// =============================================================================
export const SectionsByModule: Record<ModuleCode, SectionCode[]> = {
'''

    for m in modules:
        module_code_upper = m.code.upper().replace('-', '_')
        module_sections = modules_dict.get(module_code_upper, [])
        section_refs = ', '.join([
            f"SectionCodes.{s['code_upper']}"
            for s in module_sections
        ])
        ts_code += f"  [ModuleCodes.{module_code_upper}]: [{section_refs}],\n"

    ts_code += '};\n'

    return Response({
        'typescript': ts_code,
        'sections_count': sections.count(),
        'modules_count': modules.count(),
        'generated_at': timestamp,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_section_access(request):
    """
    GET /api/core/sections/user-access/

    Retorna los accesos a secciones del usuario actual.

    Response:
    {
        "user_id": 1,
        "is_superuser": false,
        "cargo": {
            "id": 5,
            "code": "gerente_general",
            "name": "Gerente General",
            "nivel": "ESTRATEGICO"
        },
        "accesses": {
            "1": {
                "section_code": "empresa",
                "can_view": true,
                "can_create": true,
                "can_edit": true,
                "can_delete": false,
                "custom_actions": {}
            },
            ...
        },
        "accessible_sections": [1, 2, 3, 5, 7],
        "total_accessible": 5,
        "cached": true
    }
    """
    from apps.core.services.permission_service import CombinedPermissionService
    from apps.core.services.permission_cache import PermissionCacheService

    user = request.user

    # Verificar si está en cache
    is_cached = PermissionCacheService.get_user_section_access(user.id) is not None

    # Obtener todos los permisos
    all_access = CombinedPermissionService.get_all_section_permissions(user)

    # Filtrar secciones accesibles (can_view=True)
    accessible_sections = [
        int(sid) for sid, access in all_access.items()
        if access.get('can_view', False)
    ]

    # Información del cargo
    cargo_info = None
    if user.cargo:
        cargo_info = {
            'id': user.cargo.id,
            'code': user.cargo.code,
            'name': user.cargo.name,
            'nivel': user.cargo.nivel_jerarquico,
        }

    return Response({
        'user_id': user.id,
        'is_superuser': user.is_superuser,
        'cargo': cargo_info,
        'accesses': all_access,
        'accessible_sections': accessible_sections,
        'total_accessible': len(accessible_sections),
        'total_sections': len(all_access),
        'cached': is_cached,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invalidate_user_cache(request):
    """
    POST /api/core/sections/invalidate-cache/

    Invalida el cache de permisos del usuario actual.
    Útil después de cambios de permisos para forzar recarga.

    Response:
    {
        "message": "Cache invalidado",
        "user_id": 1
    }
    """
    from apps.core.services.permission_cache import PermissionCacheService

    user = request.user
    PermissionCacheService.invalidate_user(user.id)

    return Response({
        'message': 'Cache invalidado',
        'user_id': user.id,
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def invalidate_cargo_cache(request):
    """
    POST /api/core/sections/invalidate-cargo-cache/

    Invalida el cache de permisos de un cargo y todos sus usuarios.
    Solo para administradores.

    Body:
    {
        "cargo_id": 5
    }

    Response:
    {
        "message": "Cache invalidado para cargo y usuarios",
        "cargo_id": 5
    }
    """
    from apps.core.services.permission_cache import PermissionCacheService

    cargo_id = request.data.get('cargo_id')
    if not cargo_id:
        return Response(
            {'error': 'cargo_id es requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )

    PermissionCacheService.invalidate_cargo(cargo_id)

    return Response({
        'message': 'Cache invalidado para cargo y usuarios',
        'cargo_id': cargo_id,
    })
