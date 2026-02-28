"""
Views de Control de Tiempo - Talent Hub
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Avg, Count, Q
from django.shortcuts import get_object_or_404

from apps.core.base_models.mixins import get_tenant_empresa

from .models import (
    Turno, AsignacionTurno, RegistroAsistencia, MarcajeTiempo,
    HoraExtra, ConsolidadoAsistencia, ConfiguracionRecargo
)
from .serializers import (
    TurnoListSerializer, TurnoDetailSerializer,
    AsignacionTurnoSerializer,
    RegistroAsistenciaSerializer, RegistrarEntradaSerializer,
    RegistrarSalidaSerializer, JustificarAsistenciaSerializer,
    MarcajeTiempoSerializer, MarcajeCreateSerializer, MarcajeQRSerializer,
    HoraExtraSerializer, AprobarHoraExtraSerializer, RechazarHoraExtraSerializer,
    ConsolidadoAsistenciaSerializer, GenerarConsolidadoSerializer,
    ConfiguracionRecargoSerializer, EstadisticasAsistenciaSerializer
)


class TurnoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de turnos"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Turno.objects.filter(
            is_active=True
        ).order_by('codigo')

    def get_serializer_class(self):
        if self.action == 'list':
            return TurnoListSerializer
        return TurnoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class AsignacionTurnoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de asignaciones de turno"""
    permission_classes = [IsAuthenticated]
    serializer_class = AsignacionTurnoSerializer

    def get_queryset(self):
        qs = AsignacionTurno.objects.filter(
            is_active=True
        ).select_related('colaborador', 'turno')

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            qs = qs.filter(colaborador_id=colaborador_id)

        vigente = self.request.query_params.get('vigente')
        if vigente == 'true':
            hoy = timezone.now().date()
            qs = qs.filter(
                fecha_inicio__lte=hoy
            ).filter(
                Q(fecha_fin__isnull=True) | Q(fecha_fin__gte=hoy)
            )

        return qs.order_by('-fecha_inicio')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class RegistroAsistenciaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de registros de asistencia"""
    permission_classes = [IsAuthenticated]
    serializer_class = RegistroAsistenciaSerializer

    def get_queryset(self):
        qs = RegistroAsistencia.objects.filter(
            is_active=True
        ).select_related('colaborador', 'turno', 'registrado_por')

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            qs = qs.filter(colaborador_id=colaborador_id)

        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)

        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        return qs.order_by('-fecha')

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            registrado_por=self.request.user,
            created_by=self.request.user
        )

    @action(detail=False, methods=['post'], url_path='registrar-entrada')
    def registrar_entrada(self, request):
        """Registra entrada de un colaborador."""
        serializer = RegistrarEntradaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        empresa = get_tenant_empresa()

        colaborador_id = data['colaborador_id']
        turno_id = data['turno_id']
        fecha = data['fecha']
        hora_entrada = data['hora_entrada']

        # Obtener o crear el registro del día
        registro, created = RegistroAsistencia.objects.get_or_create(
            colaborador_id=colaborador_id,
            fecha=fecha,
            defaults={
                'empresa': empresa,
                'turno_id': turno_id,
                'hora_entrada': hora_entrada,
                'estado': 'presente',
                'observaciones': data.get('observaciones', ''),
                'registrado_por': request.user,
                'created_by': request.user,
            }
        )

        if not created:
            # Si ya existe, actualizar la hora de entrada
            registro.hora_entrada = hora_entrada
            registro.turno_id = turno_id
            if data.get('observaciones'):
                registro.observaciones = data['observaciones']
            registro.save()

        # Crear marcaje asociado
        MarcajeTiempo.objects.create(
            empresa=empresa,
            colaborador_id=colaborador_id,
            tipo=MarcajeTiempo.TipoMarcaje.ENTRADA,
            metodo=MarcajeTiempo.MetodoMarcaje.MANUAL,
            fecha_hora=timezone.datetime.combine(fecha, hora_entrada),
            registro_asistencia=registro,
            ip_address=_get_client_ip(request),
            created_by=request.user,
        )

        return Response(
            RegistroAsistenciaSerializer(registro).data,
            status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], url_path='registrar-salida')
    def registrar_salida(self, request, pk=None):
        """Registra salida de un colaborador."""
        registro = self.get_object()

        serializer = RegistrarSalidaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        hora_salida = serializer.validated_data['hora_salida']
        observaciones = serializer.validated_data.get('observaciones', '')

        registro.hora_salida = hora_salida
        if observaciones:
            registro.observaciones = observaciones
        registro.updated_by = request.user
        registro.save()

        # Crear marcaje de salida
        MarcajeTiempo.objects.create(
            empresa=registro.empresa,
            colaborador=registro.colaborador,
            tipo=MarcajeTiempo.TipoMarcaje.SALIDA,
            metodo=MarcajeTiempo.MetodoMarcaje.MANUAL,
            fecha_hora=timezone.datetime.combine(registro.fecha, hora_salida),
            registro_asistencia=registro,
            ip_address=_get_client_ip(request),
            created_by=request.user,
        )

        return Response(RegistroAsistenciaSerializer(registro).data)

    @action(detail=True, methods=['post'])
    def justificar(self, request, pk=None):
        """Justifica una ausencia o tardanza."""
        registro = self.get_object()

        serializer = JustificarAsistenciaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        registro.justificacion = serializer.validated_data['justificacion']
        nuevo_estado = serializer.validated_data.get('nuevo_estado')
        if nuevo_estado:
            registro.estado = nuevo_estado
        registro.updated_by = request.user
        registro.save(update_fields=['justificacion', 'estado', 'updated_by', 'updated_at'])

        return Response(RegistroAsistenciaSerializer(registro).data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de asistencia del período."""
        empresa = get_tenant_empresa()
        qs = RegistroAsistencia.objects.filter(empresa=empresa, is_active=True)

        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        colaborador_id = request.query_params.get('colaborador')

        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)
        if colaborador_id:
            qs = qs.filter(colaborador_id=colaborador_id)

        total = qs.count()
        conteos = qs.values('estado').annotate(total=Count('id'))
        estado_map = {item['estado']: item['total'] for item in conteos}

        total_horas = sum(
            float(r.horas_trabajadas) for r in qs.filter(estado__in=['presente', 'tardanza'])
        )
        total_tardanza = qs.aggregate(Sum('minutos_tardanza'))['minutos_tardanza__sum'] or 0

        porcentaje = 0
        if total > 0:
            presentes = estado_map.get('presente', 0) + estado_map.get('tardanza', 0)
            porcentaje = round((presentes / total) * 100, 2)

        data = {
            'total_registros': total,
            'presentes': estado_map.get('presente', 0),
            'ausentes': estado_map.get('ausente', 0),
            'tardanzas': estado_map.get('tardanza', 0),
            'permisos': estado_map.get('permiso', 0),
            'incapacidades': estado_map.get('incapacidad', 0),
            'vacaciones': estado_map.get('vacaciones', 0),
            'licencias': estado_map.get('licencia', 0),
            'porcentaje_asistencia': porcentaje,
            'total_minutos_tardanza': total_tardanza,
            'total_horas_trabajadas': round(total_horas, 2),
        }

        return Response(data)


class MarcajeTiempoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para marcajes de tiempo."""
    permission_classes = [IsAuthenticated]
    serializer_class = MarcajeTiempoSerializer

    def get_queryset(self):
        qs = MarcajeTiempo.objects.filter(
            is_active=True
        ).select_related('colaborador', 'registro_asistencia')

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            qs = qs.filter(colaborador_id=colaborador_id)

        fecha = self.request.query_params.get('fecha')
        if fecha:
            qs = qs.filter(fecha_hora__date=fecha)

        return qs.order_by('-fecha_hora')

    @action(detail=False, methods=['post'])
    def marcar(self, request):
        """Registra un marcaje de entrada o salida (web/manual)."""
        serializer = MarcajeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        empresa = get_tenant_empresa()

        # Verificar que el colaborador pertenece a la empresa
        try:
            Colaborador = _get_colaborador_model()
            colaborador = Colaborador.objects.get(id=data['colaborador_id'], empresa=empresa, is_active=True)
        except Exception:
            return Response(
                {'detail': 'Colaborador no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        ahora = timezone.now()
        fecha_hoy = ahora.date()

        marcaje = MarcajeTiempo.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo=data['tipo'],
            metodo=data.get('metodo', MarcajeTiempo.MetodoMarcaje.WEB),
            fecha_hora=ahora,
            latitud=data.get('latitud'),
            longitud=data.get('longitud'),
            ip_address=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            created_by=request.user,
        )

        # Vincular al RegistroAsistencia del día si existe
        try:
            registro = RegistroAsistencia.objects.get(
                colaborador=colaborador,
                fecha=fecha_hoy,
                is_active=True
            )
            marcaje.registro_asistencia = registro

            # Actualizar la hora según el tipo de marcaje
            hora_actual = ahora.time()
            if data['tipo'] == MarcajeTiempo.TipoMarcaje.ENTRADA and not registro.hora_entrada:
                registro.hora_entrada = hora_actual
                registro.updated_by = request.user
                registro.save()
            elif data['tipo'] == MarcajeTiempo.TipoMarcaje.SALIDA:
                registro.hora_salida = hora_actual
                registro.updated_by = request.user
                registro.save()
            elif data['tipo'] == MarcajeTiempo.TipoMarcaje.SALIDA_ALMUERZO and not registro.hora_entrada_almuerzo:
                registro.hora_entrada_almuerzo = hora_actual
                registro.updated_by = request.user
                registro.save()
            elif data['tipo'] == MarcajeTiempo.TipoMarcaje.ENTRADA_ALMUERZO and not registro.hora_salida_almuerzo:
                registro.hora_salida_almuerzo = hora_actual
                registro.updated_by = request.user
                registro.save()

            marcaje.save(update_fields=['registro_asistencia'])
        except RegistroAsistencia.DoesNotExist:
            pass

        return Response(MarcajeTiempoSerializer(marcaje).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='marcar-qr')
    def marcar_qr(self, request):
        """Registra un marcaje usando el código QR del turno."""
        serializer = MarcajeQRSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        qr_token = data['qr_token']

        try:
            turno = Turno.objects.get(qr_token=qr_token, is_active=True)
        except Turno.DoesNotExist:
            return Response(
                {'detail': 'Código QR inválido o turno inactivo.'},
                status=status.HTTP_404_NOT_FOUND
            )

        empresa = get_tenant_empresa()

        # Buscar colaborador del usuario autenticado
        try:
            Colaborador = _get_colaborador_model()
            colaborador = Colaborador.objects.get(
                usuario=request.user,
                empresa=empresa,
                is_active=True
            )
        except Exception:
            return Response(
                {'detail': 'Usuario no tiene perfil de colaborador.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ahora = timezone.now()
        fecha_hoy = ahora.date()

        marcaje = MarcajeTiempo.objects.create(
            empresa=empresa,
            colaborador=colaborador,
            tipo=data['tipo'],
            metodo=MarcajeTiempo.MetodoMarcaje.QR,
            fecha_hora=ahora,
            latitud=data.get('latitud'),
            longitud=data.get('longitud'),
            ip_address=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            created_by=request.user,
        )

        # Vincular o crear registro de asistencia
        hora_actual = ahora.time()
        if data['tipo'] == MarcajeTiempo.TipoMarcaje.ENTRADA:
            registro, created = RegistroAsistencia.objects.get_or_create(
                colaborador=colaborador,
                fecha=fecha_hoy,
                defaults={
                    'empresa': empresa,
                    'turno': turno,
                    'hora_entrada': hora_actual,
                    'estado': 'presente',
                    'registrado_por': request.user,
                    'created_by': request.user,
                }
            )
            if not created and not registro.hora_entrada:
                registro.hora_entrada = hora_actual
                registro.updated_by = request.user
                registro.save()
        else:
            try:
                registro = RegistroAsistencia.objects.get(
                    colaborador=colaborador,
                    fecha=fecha_hoy,
                    is_active=True
                )
                if data['tipo'] == MarcajeTiempo.TipoMarcaje.SALIDA:
                    registro.hora_salida = hora_actual
                    registro.updated_by = request.user
                    registro.save()
            except RegistroAsistencia.DoesNotExist:
                registro = None

        if registro:
            marcaje.registro_asistencia = registro
            marcaje.save(update_fields=['registro_asistencia'])

        return Response(
            {
                'marcaje': MarcajeTiempoSerializer(marcaje).data,
                'turno': turno.nombre,
                'mensaje': f'Marcaje de {marcaje.get_tipo_display()} registrado exitosamente.'
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'], url_path='mis-marcajes')
    def mis_marcajes(self, request):
        """Retorna los marcajes del colaborador autenticado."""
        empresa = get_tenant_empresa()

        try:
            Colaborador = _get_colaborador_model()
            colaborador = Colaborador.objects.get(
                usuario=request.user,
                empresa=empresa,
                is_active=True
            )
        except Exception:
            return Response(
                {'detail': 'Usuario no tiene perfil de colaborador.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        fecha = request.query_params.get('fecha')
        qs = MarcajeTiempo.objects.filter(
            colaborador=colaborador,
            is_active=True
        )
        if fecha:
            qs = qs.filter(fecha_hora__date=fecha)
        else:
            # Por defecto, mostrar los del día actual
            qs = qs.filter(fecha_hora__date=timezone.now().date())

        return Response(MarcajeTiempoSerializer(qs, many=True).data)


class HoraExtraViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de horas extras"""
    permission_classes = [IsAuthenticated]
    serializer_class = HoraExtraSerializer

    def get_queryset(self):
        qs = HoraExtra.objects.filter(
            is_active=True
        ).select_related('colaborador', 'aprobado_por')

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            qs = qs.filter(colaborador_id=colaborador_id)

        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        tipo = self.request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo=tipo)

        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)

        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)

        return qs.order_by('-fecha')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprueba una hora extra."""
        hora_extra = self.get_object()

        if hora_extra.estado != 'pendiente':
            return Response(
                {'detail': f'No se puede aprobar. Estado actual: {hora_extra.get_estado_display()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        hora_extra.aprobar(request.user)
        return Response(HoraExtraSerializer(hora_extra).data)

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechaza una hora extra."""
        hora_extra = self.get_object()

        if hora_extra.estado != 'pendiente':
            return Response(
                {'detail': f'No se puede rechazar. Estado actual: {hora_extra.get_estado_display()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = RechazarHoraExtraSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        motivo = serializer.validated_data.get('motivo', '')
        hora_extra.rechazar(request.user, motivo)
        return Response(HoraExtraSerializer(hora_extra).data)


class ConsolidadoAsistenciaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de consolidados"""
    permission_classes = [IsAuthenticated]
    serializer_class = ConsolidadoAsistenciaSerializer

    def get_queryset(self):
        qs = ConsolidadoAsistencia.objects.filter(
            is_active=True
        ).select_related('colaborador', 'cerrado_por')

        colaborador_id = self.request.query_params.get('colaborador')
        if colaborador_id:
            qs = qs.filter(colaborador_id=colaborador_id)

        anio = self.request.query_params.get('anio')
        if anio:
            qs = qs.filter(anio=anio)

        mes = self.request.query_params.get('mes')
        if mes:
            qs = qs.filter(mes=mes)

        cerrado = self.request.query_params.get('cerrado')
        if cerrado is not None:
            qs = qs.filter(cerrado=(cerrado.lower() == 'true'))

        return qs.order_by('-anio', '-mes')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def generar(self, request):
        """Genera o recalcula un consolidado para un período y colaborador."""
        serializer = GenerarConsolidadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        empresa = get_tenant_empresa()
        anio = data['anio']
        mes = data['mes']
        colaborador_id = data.get('colaborador_id')

        if colaborador_id:
            # Generar para un colaborador específico
            Colaborador = _get_colaborador_model()
            try:
                colaborador = Colaborador.objects.get(
                    id=colaborador_id, empresa=empresa, is_active=True
                )
            except Exception:
                return Response(
                    {'detail': 'Colaborador no encontrado.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            consolidado, created = ConsolidadoAsistencia.objects.get_or_create(
                colaborador=colaborador,
                anio=anio,
                mes=mes,
                defaults={
                    'empresa': empresa,
                    'created_by': request.user,
                }
            )

            if consolidado.cerrado:
                return Response(
                    {'detail': 'El consolidado está cerrado. Reabrirlo primero.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            consolidado.calcular_estadisticas()
            return Response(
                ConsolidadoAsistenciaSerializer(consolidado).data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        else:
            # Generar para todos los colaboradores activos
            Colaborador = _get_colaborador_model()
            colaboradores = Colaborador.objects.filter(empresa=empresa, is_active=True)
            resultados = []

            for colaborador in colaboradores:
                consolidado, created = ConsolidadoAsistencia.objects.get_or_create(
                    colaborador=colaborador,
                    anio=anio,
                    mes=mes,
                    defaults={
                        'empresa': empresa,
                        'created_by': request.user,
                    }
                )
                if not consolidado.cerrado:
                    consolidado.calcular_estadisticas()
                resultados.append(consolidado)

            return Response(
                ConsolidadoAsistenciaSerializer(resultados, many=True).data,
                status=status.HTTP_200_OK
            )

    @action(detail=True, methods=['post'], url_path='cerrar-mes')
    def cerrar_mes(self, request, pk=None):
        """Cierra el consolidado del mes."""
        consolidado = self.get_object()

        if consolidado.cerrado:
            return Response(
                {'detail': 'El consolidado ya está cerrado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        consolidado.cerrar_mes(request.user)
        return Response(ConsolidadoAsistenciaSerializer(consolidado).data)

    @action(detail=True, methods=['post'], url_path='reabrir-mes')
    def reabrir_mes(self, request, pk=None):
        """Reabre el consolidado del mes."""
        consolidado = self.get_object()

        if not consolidado.cerrado:
            return Response(
                {'detail': 'El consolidado no está cerrado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        consolidado.reabrir_mes(request.user)
        return Response(ConsolidadoAsistenciaSerializer(consolidado).data)


class ConfiguracionRecargoViewSet(viewsets.ModelViewSet):
    """ViewSet para configuración de recargos (Ley 2466/2025)"""
    permission_classes = [IsAuthenticated]
    serializer_class = ConfiguracionRecargoSerializer

    def get_queryset(self):
        return ConfiguracionRecargo.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


# =============================================================================
# Helpers
# =============================================================================

def _get_client_ip(request):
    """Obtiene la IP del cliente del request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _get_colaborador_model():
    """Obtiene el modelo Colaborador de forma segura."""
    from django.apps import apps
    return apps.get_model('colaboradores', 'Colaborador')
