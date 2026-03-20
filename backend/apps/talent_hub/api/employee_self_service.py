"""
Employee Self-Service (ESS) - Portal Empleado.

Vistas que permiten al empleado:
- Ver su perfil y actualizar datos personales
- Ver recibos de nómina
- Solicitar vacaciones y permisos
- Ver capacitaciones y evaluaciones
- Ver documentos pendientes de firma

Seguridad: Todas las vistas filtran por request.user,
nunca aceptan IDs del cliente para acceder a datos de otros.
"""
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

logger = logging.getLogger('apps')

from apps.core.utils.impersonation import get_effective_user

from .ess_serializers import (
    ColaboradorESSSerializer,
    InfoPersonalUpdateESSSerializer,
    VacacionesSaldoESSSerializer,
    SolicitudVacacionesESSSerializer,
    SolicitudPermisoESSSerializer,
    RecibosNominaESSSerializer,
    CapacitacionESSSerializer,
    EvaluacionResumenESSSerializer,
)


class MiPerfilView(APIView):
    """GET: Ver perfil propio. PUT: Actualizar datos personales."""
    permission_classes = [IsAuthenticated]

    def _get_colaborador(self, user):
        """Obtiene el colaborador asociado al usuario actual."""
        if hasattr(user, 'colaborador'):
            return user.colaborador
        from apps.mi_equipo.colaboradores.models import Colaborador
        return Colaborador.objects.filter(usuario=user, is_active=True).first()

    def get(self, request):
        try:
            colaborador = self._get_colaborador(get_effective_user(request))
            if not colaborador:
                return Response(
                    {'error': 'No tiene un perfil de colaborador asociado.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            serializer = ColaboradorESSSerializer(colaborador, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            logger.error(f'mi-perfil GET error: {type(e).__name__}: {e}', exc_info=True)
            return Response(
                {'error': f'{type(e).__name__}: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request):
        colaborador = self._get_colaborador(get_effective_user(request))
        if not colaborador:
            return Response(
                {'error': 'No tiene un perfil de colaborador asociado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = InfoPersonalUpdateESSSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # ── Campos directos en Colaborador ───────────────────────────────────
        # celular → telefono_movil | email_personal → email_personal
        colaborador_dirty = False
        if 'celular' in data:
            colaborador.telefono_movil = data['celular']
            colaborador_dirty = True
        if 'email_personal' in data:
            colaborador.email_personal = data['email_personal']
            colaborador_dirty = True

        if colaborador_dirty:
            colaborador.updated_by = request.user
            colaborador.save(
                update_fields=['telefono_movil', 'email_personal', 'updated_by', 'updated_at']
            )

        # ── Campos en InfoPersonal (OneToOne via info_personal) ──────────────
        INFO_FIELD_MAP = {
            'telefono': 'telefono_fijo',
            'direccion': 'direccion',
            'ciudad': 'ciudad',
            'contacto_emergencia_nombre': 'nombre_contacto_emergencia',
            'contacto_emergencia_telefono': 'telefono_contacto_emergencia',
            'contacto_emergencia_parentesco': 'parentesco_contacto_emergencia',
        }
        info_updates = {
            INFO_FIELD_MAP[k]: v
            for k, v in data.items()
            if k in INFO_FIELD_MAP
        }

        if info_updates:
            from apps.mi_equipo.colaboradores.models import InfoPersonal
            info_personal, _ = InfoPersonal.objects.get_or_create(
                colaborador=colaborador,
                defaults={
                    'empresa': colaborador.empresa,
                    'created_by': request.user,
                    'updated_by': request.user,
                },
            )
            for field, value in info_updates.items():
                setattr(info_personal, field, value)
            info_personal.updated_by = request.user
            info_personal.save(
                update_fields=list(info_updates.keys()) + ['updated_by', 'updated_at']
            )

        # Refrescar desde DB para que los SerializerMethodField lean valores actualizados
        colaborador.refresh_from_db()
        return Response(
            ColaboradorESSSerializer(colaborador, context={'request': request}).data
        )


class MisVacacionesView(APIView):
    """GET: Saldo y solicitudes. POST: Crear solicitud."""
    permission_classes = [IsAuthenticated]

    def _get_colaborador(self, user):
        if hasattr(user, 'colaborador'):
            return user.colaborador
        from apps.mi_equipo.colaboradores.models import Colaborador
        return Colaborador.objects.filter(usuario=user, is_active=True).first()

    def get(self, request):
        colaborador = self._get_colaborador(get_effective_user(request))
        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            from apps.talent_hub.novedades.models import SolicitudVacaciones, PeriodoVacaciones
        except (ImportError, RuntimeError):
            # App novedades no está en INSTALLED_APPS (L60)
            return Response(VacacionesSaldoESSSerializer({
                'dias_acumulados': 0, 'dias_disfrutados': 0,
                'dias_disponibles': 0, 'fecha_ultimo_periodo': None,
                'solicitudes_pendientes': 0,
            }).data)

        from decimal import Decimal

        # Calcular saldo
        periodos = PeriodoVacaciones.objects.filter(
            colaborador=colaborador, is_active=True
        )
        dias_acum = sum(getattr(p, 'dias_acumulados', 0) or 0 for p in periodos)
        dias_disf = sum(getattr(p, 'dias_disfrutados', 0) or 0 for p in periodos)
        ultimo = periodos.order_by('-ultimo_corte').first()

        solicitudes_pend = SolicitudVacaciones.objects.filter(
            colaborador=colaborador,
            is_active=True,
            estado='pendiente'
        ).count()

        data = {
            'dias_acumulados': Decimal(str(dias_acum)),
            'dias_disfrutados': Decimal(str(dias_disf)),
            'dias_disponibles': Decimal(str(dias_acum - dias_disf)),
            'fecha_ultimo_periodo': getattr(ultimo, 'ultimo_corte', None),
            'solicitudes_pendientes': solicitudes_pend,
        }
        return Response(VacacionesSaldoESSSerializer(data).data)

    def post(self, request):
        colaborador = self._get_colaborador(get_effective_user(request))
        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            from apps.talent_hub.novedades.models import SolicitudVacaciones
        except (ImportError, RuntimeError):
            return Response(
                {'error': 'Módulo de vacaciones no disponible aún.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        serializer = SolicitudVacacionesESSSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        solicitud = SolicitudVacaciones.objects.create(
            colaborador=colaborador,
            empresa=colaborador.empresa,
            fecha_inicio=serializer.validated_data['fecha_inicio'],
            fecha_fin=serializer.validated_data['fecha_fin'],
            dias_solicitados=serializer.validated_data['dias_solicitados'],
            observaciones=serializer.validated_data.get('observaciones', ''),
            estado='pendiente',
            created_by=request.user,
            updated_by=request.user,
        )

        return Response(
            {'id': solicitud.id, 'mensaje': 'Solicitud creada exitosamente.'},
            status=status.HTTP_201_CREATED
        )


class SolicitarPermisoView(APIView):
    """POST: Crear solicitud de permiso."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        effective_user = get_effective_user(request)
        if hasattr(effective_user, 'colaborador'):
            colaborador = effective_user.colaborador
        else:
            from apps.mi_equipo.colaboradores.models import Colaborador
            colaborador = Colaborador.objects.filter(
                usuario=effective_user, is_active=True
            ).first()

        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            from apps.talent_hub.novedades.models import Permiso
        except (ImportError, RuntimeError):
            return Response(
                {'error': 'Módulo de permisos no disponible aún.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        serializer = SolicitudPermisoESSSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        permiso = Permiso.objects.create(
            colaborador=colaborador,
            empresa=colaborador.empresa,
            tipo=serializer.validated_data['tipo_permiso'],
            fecha=serializer.validated_data['fecha'],
            hora_inicio=serializer.validated_data.get('hora_inicio'),
            hora_fin=serializer.validated_data.get('hora_fin'),
            motivo=serializer.validated_data['motivo'],
            estado='pendiente',
            created_by=request.user,
            updated_by=request.user,
        )

        return Response(
            {'id': permiso.id, 'mensaje': 'Permiso solicitado exitosamente.'},
            status=status.HTTP_201_CREATED
        )


class MisRecibosView(APIView):
    """GET: Recibos de nómina propios."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        effective_user = get_effective_user(request)
        if hasattr(effective_user, 'colaborador'):
            colaborador = effective_user.colaborador
        else:
            from apps.mi_equipo.colaboradores.models import Colaborador
            colaborador = Colaborador.objects.filter(
                usuario=effective_user, is_active=True
            ).first()

        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            from apps.talent_hub.nomina.models import LiquidacionNomina
        except (ImportError, RuntimeError):
            # App nomina no está en INSTALLED_APPS (L60)
            return Response(RecibosNominaESSSerializer([], many=True).data)

        liquidaciones = LiquidacionNomina.objects.filter(
            colaborador=colaborador,
            is_active=True,
        ).order_by('-created_at')[:24]  # Últimos 24 meses

        data = []
        for liq in liquidaciones:
            data.append({
                'id': liq.id,
                'periodo': str(getattr(liq, 'periodo', '')),
                'fecha_liquidacion': getattr(liq, 'fecha_liquidacion', liq.created_at.date()),
                'salario_base': getattr(liq, 'salario_base', 0),
                'total_devengado': getattr(liq, 'total_devengado', 0),
                'total_deducciones': getattr(liq, 'total_deducciones', 0),
                'neto_pagar': getattr(liq, 'neto_pagar', 0),
            })

        return Response(RecibosNominaESSSerializer(data, many=True).data)


class MisCapacitacionesView(APIView):
    """GET: Historial de capacitaciones propias."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        effective_user = get_effective_user(request)
        if hasattr(effective_user, 'colaborador'):
            colaborador = effective_user.colaborador
        else:
            from apps.mi_equipo.colaboradores.models import Colaborador
            colaborador = Colaborador.objects.filter(
                usuario=effective_user, is_active=True
            ).first()

        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            from apps.talent_hub.formacion_reinduccion.models import EjecucionCapacitacion
        except (ImportError, RuntimeError):
            # App formacion_reinduccion no está en INSTALLED_APPS (L60)
            return Response(CapacitacionESSSerializer([], many=True).data)

        ejecuciones = EjecucionCapacitacion.objects.filter(
            colaborador=colaborador,
            is_active=True,
        ).select_related('programacion').order_by('-created_at')[:20]

        data = []
        for ejec in ejecuciones:
            prog = ejec.programacion if hasattr(ejec, 'programacion') else None
            data.append({
                'id': ejec.id,
                'nombre': str(prog) if prog else str(ejec),
                'fecha_inicio': getattr(prog, 'fecha_inicio', None),
                'fecha_fin': getattr(prog, 'fecha_fin', None),
                'estado': getattr(ejec, 'estado', ''),
                'calificacion': getattr(ejec, 'calificacion', None),
                'certificado_url': None,
            })

        return Response(CapacitacionESSSerializer(data, many=True).data)


class MiEvaluacionView(APIView):
    """GET: Evaluaciones de desempeño propias."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        effective_user = get_effective_user(request)
        if hasattr(effective_user, 'colaborador'):
            colaborador = effective_user.colaborador
        else:
            from apps.mi_equipo.colaboradores.models import Colaborador
            colaborador = Colaborador.objects.filter(
                usuario=effective_user, is_active=True
            ).first()

        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            from apps.talent_hub.desempeno.models import EvaluacionDesempeno
        except (ImportError, RuntimeError):
            # App desempeno no está en INSTALLED_APPS (L60)
            return Response(EvaluacionResumenESSSerializer([], many=True).data)

        evaluaciones = EvaluacionDesempeno.objects.filter(
            colaborador=colaborador,
            is_active=True,
        ).order_by('-created_at')[:5]

        data = []
        for ev in evaluaciones:
            data.append({
                'id': ev.id,
                'periodo': str(getattr(ev, 'ciclo', '')),
                'calificacion_general': getattr(ev, 'calificacion_general', None),
                'estado': getattr(ev, 'estado', ''),
                'fecha_evaluacion': getattr(ev, 'fecha_evaluacion', None),
            })

        return Response(EvaluacionResumenESSSerializer(data, many=True).data)
