"""
Select Lists API — Endpoints genericos para dropdowns compartidos.

Capa 0 (Plataforma): Estos endpoints proveen datos que multiples
modulos necesitan para dropdowns/selects, sin crear dependencias
cruzadas entre modulos de Capa 2.

Patron: GET /api/core/select-lists/{entidad}/
Respuesta: [{"id": 1, "label": "...", "extra": {...}}]

Regla: Cada modulo de C2 llama a estos endpoints en vez de importar
hooks/modelos de otro modulo de C2.
"""
from django.apps import apps
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


def _safe_get_model(app_label, model_name):
    """Obtiene un modelo de forma segura sin importar directamente."""
    try:
        return apps.get_model(app_label, model_name)
    except LookupError:
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_colaboradores(request):
    """
    Lista de colaboradores activos para dropdowns.
    Usado por: HSEQ (accidentalidad, medicina), Analytics (responsable KPI)
    """
    Colaborador = _safe_get_model('colaboradores', 'Colaborador')
    if not Colaborador:
        return Response([])

    qs = Colaborador.objects.filter(
        is_active=True
    ).select_related('cargo').values(
        'id', 'primer_nombre', 'segundo_nombre',
        'primer_apellido', 'segundo_apellido',
        'numero_identificacion', 'cargo__name', 'cargo_id', 'usuario_id'
    ).order_by('primer_apellido', 'primer_nombre')[:500]

    results = []
    for c in qs:
        nombre = f"{c['primer_nombre'] or ''} {c['primer_apellido'] or ''}".strip()
        if c['segundo_apellido']:
            nombre += f" {c['segundo_apellido']}"
        results.append({
            'id': c['id'],
            'label': nombre,
            'extra': {
                'documento': c.get('numero_identificacion', '') or '',
                'cargo': c.get('cargo__name', '') or '',
                'cargo_id': str(c['cargo_id']) if c.get('cargo_id') else '',
                'usuario_id': str(c['usuario_id']) if c.get('usuario_id') else '',
            }
        })

    return Response(results)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_areas(request):
    """
    Lista de areas activas para dropdowns.
    Usado por: HSEQ (comites), Analytics (indicadores), Audit (alertas)
    """
    Area = _safe_get_model('organizacion', 'Area')
    if not Area:
        return Response([])

    qs = Area.objects.values('id', 'name', 'code').order_by('name')[:200]

    return Response([
        {'id': a['id'], 'label': a['name'], 'extra': {'code': a['code']}}
        for a in qs
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_proveedores(request):
    """
    Lista de proveedores activos para dropdowns.
    Usado por: Admin Finance (pagos), Production Ops (recepcion)
    """
    Proveedor = _safe_get_model('gestion_proveedores', 'Proveedor')
    if not Proveedor:
        return Response([])

    qs = Proveedor.objects.filter(
        is_active=True
    ).values(
        'id', 'razon_social', 'nit', 'tipo_proveedor__nombre'
    ).order_by('razon_social')[:500]

    return Response([
        {
            'id': p['id'],
            'label': p['razon_social'],
            'extra': {
                'nit': p.get('nit', ''),
                'tipo': p.get('tipo_proveedor__nombre', ''),
            }
        }
        for p in qs
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_clientes(request):
    """
    Lista de clientes activos para dropdowns.
    Usado por: Admin Finance (cuentas por cobrar), Sales CRM
    """
    Cliente = _safe_get_model('gestion_clientes', 'Cliente')
    if not Cliente:
        return Response([])

    qs = Cliente.objects.filter(
        is_active=True
    ).values(
        'id', 'razon_social', 'nit'
    ).order_by('razon_social')[:500]

    return Response([
        {
            'id': c['id'],
            'label': c['razon_social'],
            'extra': {'nit': c.get('nit', '')}
        }
        for c in qs
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_users(request):
    """
    Lista de usuarios activos para dropdowns.
    Usado por: Workflows (asignacion), Audit (tareas)
    """
    User = apps.get_model('core', 'User')
    qs = User.objects.filter(
        is_active=True
    ).values(
        'id', 'first_name', 'last_name', 'email', 'cargo__name'
    ).order_by('first_name', 'last_name')[:500]

    return Response([
        {
            'id': u['id'],
            'label': f"{u['first_name'] or ''} {u['last_name'] or ''}".strip() or u['email'],
            'extra': {
                'email': u['email'],
                'cargo': u.get('cargo__name', ''),
            }
        }
        for u in qs
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_cargos(request):
    """
    Lista de cargos para dropdowns (excluye system cargos).
    Usado por: Talent Hub (colaboradores), GE (DOFA, PESTEL, encuestas),
    Supply Chain (crear acceso), Audit (notificaciones)
    """
    Cargo = apps.get_model('core', 'Cargo')
    qs = Cargo.objects.filter(
        is_system=False,
        is_active=True,
    ).values(
        'id', 'name', 'code', 'rol_sistema__name', 'rol_sistema__code'
    ).order_by('name')[:200]

    return Response([
        {
            'id': c['id'],
            'label': c['name'],
            'extra': {
                'code': c.get('code', ''),
                'rol': c.get('rol_sistema__name', ''),
                'rol_code': c.get('rol_sistema__code', ''),
            }
        }
        for c in qs
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_roles(request):
    """
    Lista de roles del sistema para dropdowns.
    Usado por: Users (asignacion de roles)
    """
    Role = _safe_get_model('core', 'Role')
    if not Role:
        return Response([])

    qs = Role.objects.values(
        'id', 'name', 'code'
    ).order_by('name')[:50]

    return Response([
        {
            'id': r['id'],
            'label': r['name'],
            'extra': {'code': r.get('code', '')}
        }
        for r in qs
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_departamentos(request):
    """
    Lista de departamentos activos para dropdowns.
    Usado por: Supply Chain (proveedores), Talent Hub (colaboradores)
    """
    Departamento = apps.get_model('core', 'Departamento')
    qs = Departamento.objects.filter(
        is_active=True
    ).values(
        'id', 'codigo', 'nombre', 'codigo_dane'
    ).order_by('nombre')[:200]

    return Response([
        {
            'id': d['id'],
            'label': d['nombre'],
            'extra': {
                'codigo': d.get('codigo', ''),
                'codigo_dane': d.get('codigo_dane', ''),
            }
        }
        for d in qs
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_ciudades(request):
    """
    Lista de ciudades activas para dropdowns.
    Soporta filtro por departamento: ?departamento_id=X
    Usado por: Supply Chain (proveedores), Talent Hub (colaboradores)
    """
    Ciudad = apps.get_model('core', 'Ciudad')
    qs = Ciudad.objects.filter(
        is_active=True
    ).select_related('departamento').values(
        'id', 'codigo', 'nombre', 'departamento__nombre', 'departamento_id'
    ).order_by('nombre')

    departamento_id = request.query_params.get('departamento_id')
    if departamento_id:
        qs = qs.filter(departamento_id=departamento_id)

    qs = qs[:500]

    return Response([
        {
            'id': c['id'],
            'label': c['nombre'],
            'extra': {
                'codigo': c.get('codigo', ''),
                'departamento': c.get('departamento__nombre', ''),
                'departamento_id': c.get('departamento_id'),
            }
        }
        for c in qs
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_tipos_materia_prima(request):
    """
    Lista de tipos de materia prima activos para dropdowns.
    Usado por: Production Ops (pruebas de acidez, recepción)
    """
    TipoMateriaPrima = _safe_get_model('gestion_proveedores', 'TipoMateriaPrima')
    if not TipoMateriaPrima:
        return Response([])

    qs = TipoMateriaPrima.objects.filter(
        is_active=True
    ).values(
        'id', 'codigo', 'nombre', 'acidez_min', 'acidez_max',
        'categoria__nombre'
    ).order_by('categoria__nombre', 'nombre')[:200]

    return Response([
        {
            'id': t['id'],
            'label': f"{t['nombre']} ({t['codigo']})",
            'extra': {
                'codigo': t.get('codigo', ''),
                'categoria': t.get('categoria__nombre', ''),
                'acidez_min': str(t['acidez_min']) if t.get('acidez_min') is not None else '',
                'acidez_max': str(t['acidez_max']) if t.get('acidez_max') is not None else '',
            }
        }
        for t in qs
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_tipos_documento(request):
    """
    Lista de tipos de documento de identidad activos para dropdowns.
    Usado por: Supply Chain (proveedores), Talent Hub (colaboradores)
    """
    TipoDocumento = apps.get_model('core', 'TipoDocumentoIdentidad')
    qs = TipoDocumento.objects.filter(
        is_active=True
    ).values(
        'id', 'codigo', 'nombre'
    ).order_by('orden', 'nombre')[:50]

    return Response([
        {
            'id': t['id'],
            'label': f"{t['codigo']} - {t['nombre']}",
            'extra': {'codigo': t.get('codigo', '')}
        }
        for t in qs
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def select_tipos_epp(request):
    """
    Lista de tipos de EPP activos para dropdowns.
    Usado por: Configuración (Cargo SST), HSEQ (entregas EPP), Supply Chain (inventario)
    """
    TipoEPP = _safe_get_model('seguridad_industrial', 'TipoEPP')
    if not TipoEPP:
        return Response([])

    qs = TipoEPP.objects.filter(
        activo=True
    ).values(
        'id', 'codigo', 'nombre', 'categoria',
        'vida_util_dias', 'normas_aplicables'
    ).order_by('categoria', 'nombre')[:200]

    return Response([
        {
            'id': t['id'],
            'label': t['nombre'],
            'extra': {
                'codigo': t.get('codigo', ''),
                'categoria': t.get('categoria', ''),
                'vida_util_dias': t.get('vida_util_dias'),
                'normas': t.get('normas_aplicables', ''),
            }
        }
        for t in qs
    ])
