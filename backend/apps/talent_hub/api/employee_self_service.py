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
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

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
        from apps.talent_hub.colaboradores.models import Colaborador
        return Colaborador.objects.filter(user=user, is_active=True).first()

    def get(self, request):
        colaborador = self._get_colaborador(request.user)
        if not colaborador:
            return Response(
                {'error': 'No tiene un perfil de colaborador asociado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ColaboradorESSSerializer(colaborador)
        return Response(serializer.data)

    def put(self, request):
        colaborador = self._get_colaborador(request.user)
        if not colaborador:
            return Response(
                {'error': 'No tiene un perfil de colaborador asociado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = InfoPersonalUpdateESSSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Actualizar solo los campos permitidos
        for field, value in serializer.validated_data.items():
            if hasattr(colaborador, field):
                setattr(colaborador, field, value)
        colaborador.updated_by = request.user
        colaborador.save()

        return Response(ColaboradorESSSerializer(colaborador).data)


class MisVacacionesView(APIView):
    """GET: Saldo y solicitudes. POST: Crear solicitud."""
    permission_classes = [IsAuthenticated]

    def _get_colaborador(self, user):
        if hasattr(user, 'colaborador'):
            return user.colaborador
        from apps.talent_hub.colaboradores.models import Colaborador
        return Colaborador.objects.filter(user=user, is_active=True).first()

    def get(self, request):
        colaborador = self._get_colaborador(request.user)
        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.talent_hub.novedades.models import SolicitudVacaciones, PeriodoVacaciones
        from decimal import Decimal

        # Calcular saldo
        periodos = PeriodoVacaciones.objects.filter(
            colaborador=colaborador, is_active=True
        )
        dias_acum = sum(getattr(p, 'dias_acumulados', 0) or 0 for p in periodos)
        dias_disf = sum(getattr(p, 'dias_disfrutados', 0) or 0 for p in periodos)
        ultimo = periodos.order_by('-fecha_inicio').first()

        solicitudes_pend = SolicitudVacaciones.objects.filter(
            colaborador=colaborador,
            is_active=True,
            estado='pendiente'
        ).count()

        data = {
            'dias_acumulados': Decimal(str(dias_acum)),
            'dias_disfrutados': Decimal(str(dias_disf)),
            'dias_disponibles': Decimal(str(dias_acum - dias_disf)),
            'fecha_ultimo_periodo': getattr(ultimo, 'fecha_inicio', None),
            'solicitudes_pendientes': solicitudes_pend,
        }
        return Response(VacacionesSaldoESSSerializer(data).data)

    def post(self, request):
        colaborador = self._get_colaborador(request.user)
        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SolicitudVacacionesESSSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.talent_hub.novedades.models import SolicitudVacaciones
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
        if hasattr(request.user, 'colaborador'):
            colaborador = request.user.colaborador
        else:
            from apps.talent_hub.colaboradores.models import Colaborador
            colaborador = Colaborador.objects.filter(
                user=request.user, is_active=True
            ).first()

        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SolicitudPermisoESSSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.talent_hub.novedades.models import Permiso
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
        if hasattr(request.user, 'colaborador'):
            colaborador = request.user.colaborador
        else:
            from apps.talent_hub.colaboradores.models import Colaborador
            colaborador = Colaborador.objects.filter(
                user=request.user, is_active=True
            ).first()

        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.talent_hub.nomina.models import LiquidacionNomina
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
        if hasattr(request.user, 'colaborador'):
            colaborador = request.user.colaborador
        else:
            from apps.talent_hub.colaboradores.models import Colaborador
            colaborador = Colaborador.objects.filter(
                user=request.user, is_active=True
            ).first()

        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.talent_hub.formacion_reinduccion.models import EjecucionCapacitacion
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
        if hasattr(request.user, 'colaborador'):
            colaborador = request.user.colaborador
        else:
            from apps.talent_hub.colaboradores.models import Colaborador
            colaborador = Colaborador.objects.filter(
                user=request.user, is_active=True
            ).first()

        if not colaborador:
            return Response({'error': 'Sin perfil asociado.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.talent_hub.desempeno.models import EvaluacionDesempeno
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
