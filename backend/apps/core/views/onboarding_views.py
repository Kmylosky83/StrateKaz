"""
Vistas de Onboarding y Completitud de Perfil - StrateKaz

B1: OnboardingView       GET  /api/core/onboarding/
                         (pasos + progreso del usuario autenticado)

B1: OnboardingDismissView POST /api/core/onboarding/dismiss/
                         (descartar widget de onboarding)

B2: ProfileCompletenessView GET /api/core/profile-completeness/
                         (porcentaje de perfil + campos faltantes)

Ambas vistas consumen OnboardingService.compute() como única fuente
de verdad. El servicio cachea en Redis por 5 minutos.
"""
import logging

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.services.onboarding_service import OnboardingService

logger = logging.getLogger(__name__)


# =============================================================================
# HELPERS
# =============================================================================

def _build_steps_response(onboarding) -> list:
    """
    Combina la definición estática de pasos con el estado calculado.

    Cada paso retornado incluye link y cta_text según la convención del
    frontend (Lucide icon, ruta interna).

    Args:
        onboarding: instancia de UserOnboarding actualizada por compute()

    Returns:
        Lista de dicts con todos los campos que espera el frontend.
    """
    # Links y CTA por clave de paso
    _STEP_META = {
        'empresa':          {'link': '/fundacion/mi-empresa',            'cta_text': 'Configurar empresa'},
        'sedes':            {'link': '/fundacion/sedes',                 'cta_text': 'Agregar sede'},
        'identidad':        {'link': '/fundacion/identidad-corporativa', 'cta_text': 'Completar identidad'},
        'valores':          {'link': '/fundacion/valores-corporativos',  'cta_text': 'Agregar valores'},
        'estructura':       {'link': '/fundacion/estructura-organizacional', 'cta_text': 'Crear estructura'},
        'perfil':           {'link': '/mi-portal?tab=perfil',            'cta_text': 'Completar perfil'},
        'invitar':          {'link': '/configuracion/usuarios',          'cta_text': 'Invitar colaborador'},
        'emergencia':       {'link': '/mi-portal?tab=perfil',            'cta_text': 'Registrar contacto'},
        'firma':            {'link': '/mi-portal?tab=firma',             'cta_text': 'Configurar firma'},
        'primer_documento': {'link': '/gestion-documental',              'cta_text': 'Crear documento'},
        'primer_lectura':   {'link': '/mi-portal?tab=lecturas',          'cta_text': 'Ver lecturas'},
        'politicas':        {'link': '/mi-portal?tab=lecturas',          'cta_text': 'Leer políticas'},
        'hseq':             {'link': '/mi-portal?tab=hseq',              'cta_text': 'Verificar HSEQ'},
    }

    steps_def = OnboardingService.get_steps_definition(onboarding.onboarding_type)
    steps_completed = onboarding.steps_completed or {}

    result = []
    for step in steps_def:
        key = step['key']
        meta = _STEP_META.get(key, {'link': '/dashboard', 'cta_text': 'Ir'})
        result.append({
            'key':         key,
            'label':       step['label'],
            'description': step['description'],
            'icon':        step['icon'],
            'completed':   bool(steps_completed.get(key, False)),
            'link':        meta['link'],
            'cta_text':    meta['cta_text'],
        })
    return result


def _build_missing_fields(onboarding) -> list:
    """
    Construye la lista de campos de perfil que el usuario no ha completado,
    ordenada por peso descendente (primero los que más aportan).

    Args:
        onboarding: instancia de UserOnboarding actualizada por compute()

    Returns:
        Lista de dicts {field, label, weight} para los campos incompletos.
    """
    _FIELD_META = {
        'photo':           {'label': 'Foto de perfil',           'weight': 10},
        'firma':           {'label': 'Firma digital',            'weight': 15},
        'emergencia':      {'label': 'Contacto de emergencia',   'weight': 15},
        'email_personal':  {'label': 'Correo personal',          'weight': 10},
        'celular':         {'label': 'Número de celular',        'weight': 10},
        'direccion':       {'label': 'Dirección de residencia',  'weight': 10},
        'ciudad':          {'label': 'Ciudad de residencia',     'weight':  5},
        'nombre_completo': {'label': 'Nombre completo',          'weight': 10},
        'documento':       {'label': 'Número de documento',      'weight': 15},
    }

    # Determinar qué campos están completos
    user = onboarding.user
    completed_fields = set()

    if onboarding.has_photo:
        completed_fields.add('photo')
    if onboarding.has_firma:
        completed_fields.add('firma')
    if onboarding.has_emergencia:
        completed_fields.add('emergencia')

    # nombre_completo
    nombre = (
        f"{getattr(user, 'first_name', '') or ''} "
        f"{getattr(user, 'last_name', '') or ''}"
    ).strip()
    if nombre:
        completed_fields.add('nombre_completo')

    # documento
    if getattr(user, 'document_number', ''):
        completed_fields.add('documento')

    # Campos desde Colaborador (acceso directo respetando C2)
    try:
        colaborador = getattr(user, 'colaborador', None)
        if colaborador:
            if getattr(colaborador, 'email_personal', ''):
                completed_fields.add('email_personal')
            if getattr(colaborador, 'telefono_movil', ''):
                completed_fields.add('celular')
            info = getattr(colaborador, 'info_personal', None)
            if info:
                if getattr(info, 'direccion', ''):
                    completed_fields.add('direccion')
                if getattr(info, 'ciudad', ''):
                    completed_fields.add('ciudad')
    except Exception as exc:
        logger.debug(
            'No se pudieron leer campos de Colaborador para missing_fields User %s: %s',
            getattr(user, 'pk', '?'), exc,
        )

    missing = [
        {'field': field, **meta}
        for field, meta in _FIELD_META.items()
        if field not in completed_fields
    ]
    # Ordenar por peso descendente para mostrar los más impactantes primero
    missing.sort(key=lambda x: x['weight'], reverse=True)
    return missing


def _build_next_action(missing_fields: list) -> dict | None:
    """
    Retorna la acción más impactante pendiente (primer campo de missing_fields).

    Se asigna un link específico según el campo para dirigir al usuario
    directamente al lugar donde puede completarlo.
    """
    if not missing_fields:
        return None

    _FIELD_LINKS = {
        'photo':           '/mi-portal?tab=perfil',
        'firma':           '/mi-portal?tab=firma',
        'emergencia':      '/mi-portal?tab=perfil',
        'email_personal':  '/mi-portal?tab=perfil',
        'celular':         '/mi-portal?tab=perfil',
        'direccion':       '/mi-portal?tab=perfil',
        'ciudad':          '/mi-portal?tab=perfil',
        'nombre_completo': '/mi-portal?tab=perfil',
        'documento':       '/mi-portal?tab=perfil',
    }

    top = missing_fields[0]
    return {
        'field': top['field'],
        'label': top['label'],
        'link':  _FIELD_LINKS.get(top['field'], '/mi-portal?tab=perfil'),
    }


# =============================================================================
# B1 — ONBOARDING VIEW
# =============================================================================

class OnboardingView(APIView):
    """
    Progreso de onboarding del usuario autenticado.

    GET /api/core/onboarding/

    Llama a OnboardingService.compute() para recalcular el estado y retorna
    los pasos enriquecidos con estado de completitud, link y CTA.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Obtener progreso de onboarding',
        description=(
            'Calcula y retorna el progreso de onboarding del usuario autenticado. '
            'Los resultados se cachean en Redis por 5 minutos. '
            'Los pasos varían según el tipo de usuario (admin, jefe, empleado, proveedor, cliente).'
        ),
        responses={
            200: OpenApiResponse(
                description='Progreso de onboarding',
                examples=[
                    OpenApiExample(
                        'Onboarding admin en progreso',
                        value={
                            'onboarding_type': 'admin',
                            'steps': [
                                {
                                    'key': 'empresa',
                                    'label': 'Configura tu empresa',
                                    'description': 'Ingresa el NIT y razón social en Configuración General.',
                                    'icon': 'Building2',
                                    'completed': True,
                                    'link': '/fundacion/mi-empresa',
                                    'cta_text': 'Configurar empresa',
                                },
                            ],
                            'done_count': 3,
                            'total': 8,
                            'overall_progress': 37,
                            'profile_percentage': 60,
                            'completed': False,
                            'dismissed': False,
                        },
                    ),
                ],
            ),
        },
        tags=['Onboarding'],
    )
    def get(self, request):
        """
        GET /api/core/onboarding/

        Retorna el progreso de onboarding con pasos enriquecidos.
        """
        try:
            onboarding = OnboardingService.compute(request.user)
        except Exception as exc:
            logger.error(
                'Error al calcular onboarding para User %s: %s',
                request.user.pk, exc, exc_info=True,
            )
            return Response(
                {'error': 'No se pudo calcular el onboarding. Intenta nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        steps = _build_steps_response(onboarding)
        done_count = sum(1 for s in steps if s['completed'])
        total = len(steps)
        overall_progress = round((done_count / total) * 100) if total else 0

        return Response({
            'onboarding_type':    onboarding.onboarding_type,
            'steps':              steps,
            'done_count':         done_count,
            'total':              total,
            'overall_progress':   overall_progress,
            'profile_percentage': onboarding.profile_percentage,
            'completed':          done_count == total and total > 0,
            'dismissed':          onboarding.dismissed,
        })


# =============================================================================
# B1 — ONBOARDING DISMISS VIEW
# =============================================================================

class OnboardingDismissView(APIView):
    """
    Descartar el widget de onboarding.

    POST /api/core/onboarding/dismiss/

    Marca UserOnboarding.dismissed = True para que el frontend deje de
    mostrar el widget. La acción es reversible: se puede resetear desde
    el panel de administración si el usuario desea ver el onboarding de nuevo.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Descartar onboarding',
        description=(
            'Marca el onboarding del usuario como descartado. '
            'El widget de onboarding dejará de mostrarse en el dashboard.'
        ),
        request=None,
        responses={
            200: OpenApiResponse(
                description='Onboarding descartado',
                examples=[
                    OpenApiExample(
                        'Descartado exitosamente',
                        value={'dismissed': True},
                    ),
                ],
            ),
        },
        tags=['Onboarding'],
    )
    def post(self, request):
        """
        POST /api/core/onboarding/dismiss/

        Descarta el widget de onboarding para el usuario actual.
        Crea UserOnboarding si no existe.
        """
        from django.apps import apps
        UserOnboarding = apps.get_model('core', 'UserOnboarding')

        try:
            onboarding, _ = UserOnboarding.objects.get_or_create(user=request.user)
            onboarding.dismissed = True
            onboarding.save(update_fields=['dismissed', 'updated_at'])

            # Invalidar cache para que el próximo GET refleje el cambio
            OnboardingService.invalidate_cache(request.user.pk)

            logger.info(
                'Onboarding descartado por User %s (%s)',
                request.user.pk, request.user.email,
            )
        except Exception as exc:
            logger.error(
                'Error al descartar onboarding para User %s: %s',
                request.user.pk, exc, exc_info=True,
            )
            return Response(
                {'error': 'No se pudo descartar el onboarding. Intenta nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({'dismissed': True})


# =============================================================================
# B2 — PROFILE COMPLETENESS VIEW
# =============================================================================

class ProfileCompletenessView(APIView):
    """
    Completitud del perfil del usuario autenticado.

    GET /api/core/profile-completeness/

    Reutiliza OnboardingService.compute() para obtener el porcentaje de
    perfil ponderado y calcula los campos faltantes con sus pesos.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Obtener completitud de perfil',
        description=(
            'Calcula el porcentaje de completitud del perfil del usuario autenticado '
            'y retorna los campos pendientes ordenados por impacto (peso descendente). '
            'Los resultados se cachean en Redis por 5 minutos junto con el onboarding.'
        ),
        responses={
            200: OpenApiResponse(
                description='Completitud del perfil',
                examples=[
                    OpenApiExample(
                        'Perfil parcialmente completado',
                        value={
                            'percentage': 65,
                            'missing_fields': [
                                {'field': 'firma',      'label': 'Firma digital',          'weight': 15},
                                {'field': 'emergencia', 'label': 'Contacto de emergencia', 'weight': 15},
                                {'field': 'documento',  'label': 'Número de documento',    'weight': 15},
                            ],
                            'next_action': {
                                'field': 'firma',
                                'label': 'Firma digital',
                                'link':  '/mi-portal?tab=firma',
                            },
                        },
                    ),
                    OpenApiExample(
                        'Perfil 100% completado',
                        value={
                            'percentage': 100,
                            'missing_fields': [],
                            'next_action': None,
                        },
                    ),
                ],
            ),
        },
        tags=['Onboarding'],
    )
    def get(self, request):
        """
        GET /api/core/profile-completeness/

        Retorna el porcentaje de perfil, los campos faltantes y la siguiente
        acción recomendada.
        """
        try:
            onboarding = OnboardingService.compute(request.user)
        except Exception as exc:
            logger.error(
                'Error al calcular completitud de perfil para User %s: %s',
                request.user.pk, exc, exc_info=True,
            )
            return Response(
                {'error': 'No se pudo calcular la completitud del perfil. Intenta nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        missing_fields = _build_missing_fields(onboarding)
        next_action = _build_next_action(missing_fields)

        return Response({
            'percentage':     onboarding.profile_percentage,
            'missing_fields': missing_fields,
            'next_action':    next_action,
        })


# =============================================================================
# D1 — MARK STEP (para pasos manuales como primer_lectura)
# =============================================================================

# Pasos que pueden marcarse manualmente via este endpoint
_MARKABLE_STEPS = {'primer_lectura'}


class OnboardingMarkStepView(APIView):
    """
    Marcar un paso de onboarding como completado manualmente.

    POST /api/core/onboarding/mark-step/

    Body: {"step": "primer_lectura"}

    Solo permite marcar pasos que no tienen verificación automática
    (e.g. primer_lectura se completa cuando el usuario visita Mi Portal).
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Marcar paso de onboarding como completado',
        description=(
            'Marca un paso de onboarding como completado manualmente. '
            'Solo admite pasos sin verificación automática.'
        ),
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'step': {
                        'type': 'string',
                        'description': 'Clave del paso a marcar',
                        'enum': list(_MARKABLE_STEPS),
                    },
                },
                'required': ['step'],
            },
        },
        responses={
            200: OpenApiResponse(
                description='Paso marcado como completado',
                examples=[
                    OpenApiExample(
                        'Paso marcado',
                        value={'step': 'primer_lectura', 'marked': True},
                    ),
                ],
            ),
            400: OpenApiResponse(description='Paso no válido'),
        },
        tags=['Onboarding'],
    )
    def post(self, request):
        """
        POST /api/core/onboarding/mark-step/

        Marca un paso de onboarding como completado en steps_completed.
        """
        step_key = (request.data.get('step') or '').strip()

        if step_key not in _MARKABLE_STEPS:
            return Response(
                {'error': f'Paso no válido. Pasos permitidos: {", ".join(sorted(_MARKABLE_STEPS))}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.apps import apps
        UserOnboarding = apps.get_model('core', 'UserOnboarding')

        try:
            onboarding, _ = UserOnboarding.objects.get_or_create(user=request.user)
            steps = onboarding.steps_completed or {}
            steps[step_key] = True
            onboarding.steps_completed = steps
            onboarding.save(update_fields=['steps_completed', 'updated_at'])

            OnboardingService.invalidate_cache(request.user.pk)

            logger.info(
                'Paso "%s" marcado como completado por User %s (%s)',
                step_key, request.user.pk, request.user.email,
            )
        except Exception as exc:
            logger.error(
                'Error al marcar paso "%s" para User %s: %s',
                step_key, request.user.pk, exc, exc_info=True,
            )
            return Response(
                {'error': 'No se pudo marcar el paso. Intenta nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({'step': step_key, 'marked': True})


# =============================================================================
# D3 — REOPEN (reabrir checklist descartado)
# =============================================================================

class OnboardingReopenView(APIView):
    """
    Reabrir el checklist de onboarding previamente descartado.

    POST /api/core/onboarding/reopen/

    Setea UserOnboarding.dismissed = False para que el widget reaparezca.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Reabrir checklist de onboarding',
        description=(
            'Revierte el descarte del checklist de onboarding. '
            'El widget de pasos volverá a mostrarse en el dashboard.'
        ),
        request=None,
        responses={
            200: OpenApiResponse(
                description='Checklist reabierto',
                examples=[
                    OpenApiExample(
                        'Reabierto exitosamente',
                        value={'dismissed': False},
                    ),
                ],
            ),
        },
        tags=['Onboarding'],
    )
    def post(self, request):
        """
        POST /api/core/onboarding/reopen/

        Reabre el checklist de onboarding para el usuario actual.
        """
        from django.apps import apps
        UserOnboarding = apps.get_model('core', 'UserOnboarding')

        try:
            onboarding, _ = UserOnboarding.objects.get_or_create(user=request.user)
            onboarding.dismissed = False
            onboarding.save(update_fields=['dismissed', 'updated_at'])

            OnboardingService.invalidate_cache(request.user.pk)

            logger.info(
                'Onboarding reabierto por User %s (%s)',
                request.user.pk, request.user.email,
            )
        except Exception as exc:
            logger.error(
                'Error al reabrir onboarding para User %s: %s',
                request.user.pk, exc, exc_info=True,
            )
            return Response(
                {'error': 'No se pudo reabrir el checklist. Intenta nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({'dismissed': False})
