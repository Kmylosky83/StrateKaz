"""
Mi Equipo — Portal Jefe (MSS - Manager Self-Service).

Vistas desacopladas que permiten al jefe/supervisor:
- Ver su equipo directo
- Aprobar/rechazar solicitudes de vacaciones y permisos
- Ver consolidado de asistencia del equipo
- Ver estado de evaluaciones de desempeño

Consume modelos de talent_hub via apps.get_model() (regla C2→C2).
Seguridad: Filtra colaboradores por área del jefe.
"""
import logging

from django.apps import apps
from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import (
    ColaboradorEquipoSerializer,
    AprobacionPendienteSerializer,
    AprobarRechazarSerializer,
    AsistenciaEquipoSerializer,
    EvaluacionEquipoSerializer,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Helpers — sin import directo de talent_hub
# =============================================================================

def _get_colaborador_model():
    """Obtiene modelo Colaborador via apps.get_model()."""
    return apps.get_model('colaboradores', 'Colaborador')


def _get_jefe_colaborador(user):
    """Obtiene el colaborador asociado al usuario (jefe)."""
    if hasattr(user, 'colaborador'):
        return user.colaborador

    Colaborador = _get_colaborador_model()
    return Colaborador.objects.filter(
        usuario=user, is_active=True
    ).select_related('cargo', 'area').first()


def _get_equipo(jefe_colaborador):
    """
    Obtiene los colaboradores del equipo del jefe.

    Equipo = colaboradores activos en la misma área con cargo de menor nivel.
    Si jefe no tiene área asignada, retorna vacío (seguridad: nunca retorna todos).
    """
    Colaborador = _get_colaborador_model()

    if not jefe_colaborador or not jefe_colaborador.cargo:
        return Colaborador.objects.none()

    # Seguridad: si el jefe no tiene área, NO retornar todos los colaboradores
    if not jefe_colaborador.area:
        return Colaborador.objects.none()

    filters = Q(
        is_active=True,
        estado='activo',
        area=jefe_colaborador.area,
    )

    # Excluir al propio jefe
    filters &= ~Q(pk=jefe_colaborador.pk)

    return Colaborador.objects.filter(filters).select_related(
        'cargo', 'area', 'usuario',
    )


# =============================================================================
# Views — Portal Jefe (MSS)
# =============================================================================

class MiEquipoView(APIView):
    """GET /api/mi-equipo/ — Listado de mi equipo directo."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        jefe = _get_jefe_colaborador(request.user)
        if not jefe:
            return Response(
                {'error': 'No tiene un perfil de colaborador asociado.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        equipo = _get_equipo(jefe)
        data = []
        for col in equipo:
            # Foto: priorizar foto del colaborador, fallback a usuario
            foto_url = None
            if hasattr(col, 'foto') and col.foto:
                foto_url = col.foto.url
            elif col.usuario and hasattr(col.usuario, 'photo') and col.usuario.photo:
                foto_url = col.usuario.photo.url

            data.append({
                'id': col.id,
                'nombre_completo': str(col),
                'numero_identificacion': getattr(col, 'numero_identificacion', ''),
                'cargo_nombre': str(col.cargo) if col.cargo else '',
                'is_externo': getattr(col, 'is_externo', False),
                'estado': getattr(col, 'estado', 'activo'),
                'fecha_ingreso': getattr(col, 'fecha_ingreso', None),
                'foto_url': foto_url,
            })

        return Response(ColaboradorEquipoSerializer(data, many=True).data)


class AprobacionesPendientesView(APIView):
    """GET /api/mi-equipo/aprobaciones/ — Solicitudes pendientes."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        jefe = _get_jefe_colaborador(request.user)
        if not jefe:
            return Response(
                {'error': 'No tiene un perfil de colaborador asociado.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        equipo = _get_equipo(jefe)
        equipo_ids = list(equipo.values_list('id', flat=True))
        pendientes = []

        # Solicitudes de vacaciones
        try:
            SolicitudVacaciones = apps.get_model('novedades', 'SolicitudVacaciones')
            vacaciones = SolicitudVacaciones.objects.filter(
                colaborador_id__in=equipo_ids,
                is_active=True,
                estado='solicitada',  # FIX: era 'pendiente', modelo usa 'solicitada'
            ).select_related('colaborador')

            for sol in vacaciones:
                # FIX: usar dias_habiles (property) o dias_calendario (field)
                dias = getattr(sol, 'dias_habiles', None) or getattr(sol, 'dias_calendario', '?')
                fecha_inicio = getattr(sol, 'fecha_inicio', '')
                fecha_fin = getattr(sol, 'fecha_fin', '')
                pendientes.append({
                    'id': sol.id,
                    'tipo': 'vacaciones',
                    'colaborador_nombre': str(sol.colaborador),
                    'fecha_solicitud': sol.created_at,
                    'detalle': f'{dias} días ({fecha_inicio} - {fecha_fin})',
                    'estado': sol.estado,
                })
        except LookupError:
            logger.debug('Modelo SolicitudVacaciones no disponible (app novedades no instalada)')

        # Permisos
        try:
            Permiso = apps.get_model('novedades', 'Permiso')
            permisos = Permiso.objects.filter(
                colaborador_id__in=equipo_ids,
                is_active=True,
                estado='solicitado',  # FIX: era 'pendiente', modelo usa 'solicitado'
            ).select_related('colaborador')

            for perm in permisos:
                tipo_permiso = getattr(perm, 'tipo', '')
                fecha = getattr(perm, 'fecha', '')
                pendientes.append({
                    'id': perm.id,
                    'tipo': 'permiso',
                    'colaborador_nombre': str(perm.colaborador),
                    'fecha_solicitud': perm.created_at,
                    'detalle': f'{tipo_permiso} - {fecha}',
                    'estado': perm.estado,
                })
        except LookupError:
            logger.debug('Modelo Permiso no disponible (app novedades no instalada)')

        # Ordenar por fecha más reciente
        pendientes.sort(key=lambda x: x['fecha_solicitud'], reverse=True)

        return Response(AprobacionPendienteSerializer(pendientes, many=True).data)


class AprobarSolicitudView(APIView):
    """POST /api/mi-equipo/aprobar/<tipo>/<id>/ — Aprobar o rechazar."""
    permission_classes = [IsAuthenticated]

    def post(self, request, tipo, solicitud_id):
        jefe = _get_jefe_colaborador(request.user)
        if not jefe:
            return Response(
                {'error': 'No tiene un perfil de colaborador asociado.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AprobarRechazarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        accion = serializer.validated_data['accion']
        observaciones = serializer.validated_data.get('observaciones', '')

        equipo_ids = list(_get_equipo(jefe).values_list('id', flat=True))

        if tipo == 'vacaciones':
            SolicitudVacaciones = apps.get_model('novedades', 'SolicitudVacaciones')
            try:
                solicitud = SolicitudVacaciones.objects.get(
                    id=solicitud_id,
                    colaborador_id__in=equipo_ids,
                    is_active=True,
                    estado='solicitada',  # FIX: era 'pendiente'
                )
            except SolicitudVacaciones.DoesNotExist:
                return Response(
                    {'error': 'Solicitud no encontrada o no pertenece a su equipo.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            solicitud.estado = 'aprobada' if accion == 'aprobar' else 'rechazada'
            if hasattr(solicitud, 'observaciones'):
                solicitud.observaciones = observaciones
            solicitud.updated_by = request.user
            solicitud.save()

        elif tipo == 'permiso':
            Permiso = apps.get_model('novedades', 'Permiso')
            try:
                solicitud = Permiso.objects.get(
                    id=solicitud_id,
                    colaborador_id__in=equipo_ids,
                    is_active=True,
                    estado='solicitado',  # FIX: era 'pendiente'
                )
            except Permiso.DoesNotExist:
                return Response(
                    {'error': 'Solicitud no encontrada o no pertenece a su equipo.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            solicitud.estado = 'aprobado' if accion == 'aprobar' else 'rechazado'
            if hasattr(solicitud, 'observaciones'):
                solicitud.observaciones = observaciones
            solicitud.updated_by = request.user
            solicitud.save()

        else:
            return Response(
                {'error': f'Tipo de solicitud no soportado: {tipo}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'mensaje': f'Solicitud {accion}da exitosamente.',
            'id': solicitud_id,
        })


class AsistenciaEquipoView(APIView):
    """
    GET /api/mi-equipo/asistencia/ — Consolidado de asistencia.

    STUB: Retorna estructura con ceros. Integrar con control_tiempo al activar L60.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        jefe = _get_jefe_colaborador(request.user)
        if not jefe:
            return Response(
                {'error': 'No tiene un perfil de colaborador asociado.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        equipo = _get_equipo(jefe)
        data = [
            {
                'colaborador_id': col.id,
                'colaborador_nombre': str(col),
                'dias_trabajados': 0,
                'dias_ausencia': 0,
                'horas_extra': 0.0,
                'tardanzas': 0,
            }
            for col in equipo
        ]

        return Response(AsistenciaEquipoSerializer(data, many=True).data)


class EvaluacionesEquipoView(APIView):
    """
    GET /api/mi-equipo/evaluaciones/ — Estado de evaluaciones.

    STUB parcial: Intenta leer EvaluacionDesempeno si existe (L60).
    Si no está instalada la app, retorna sin_evaluacion.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        jefe = _get_jefe_colaborador(request.user)
        if not jefe:
            return Response(
                {'error': 'No tiene un perfil de colaborador asociado.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        equipo = _get_equipo(jefe)
        data = []

        for col in equipo:
            ev_data = {
                'colaborador_id': col.id,
                'colaborador_nombre': str(col),
                'evaluacion_id': None,
                'estado': 'sin_evaluacion',
                'calificacion_general': None,
                'fecha_evaluacion': None,
            }

            try:
                EvaluacionDesempeno = apps.get_model('desempeno', 'EvaluacionDesempeno')
                ultima_eval = EvaluacionDesempeno.objects.filter(
                    colaborador=col, is_active=True,
                ).order_by('-created_at').first()

                if ultima_eval:
                    ev_data['evaluacion_id'] = ultima_eval.id
                    ev_data['estado'] = getattr(ultima_eval, 'estado', '')
                    calif = getattr(ultima_eval, 'calificacion_general', None)
                    ev_data['calificacion_general'] = float(calif) if calif else None
                    ev_data['fecha_evaluacion'] = getattr(ultima_eval, 'fecha_evaluacion', None)
            except LookupError:
                pass  # App desempeno no instalada todavía (L60)

            data.append(ev_data)

        return Response(EvaluacionEquipoSerializer(data, many=True).data)
