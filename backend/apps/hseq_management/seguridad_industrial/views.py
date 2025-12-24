"""
Views para Seguridad Industrial
ViewSets con acciones personalizadas para gestión de seguridad
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import (
    TipoPermisoTrabajo, PermisoTrabajo,
    TipoInspeccion, PlantillaInspeccion, Inspeccion, ItemInspeccion,
    TipoEPP, EntregaEPP,
    ProgramaSeguridad
)
from .serializers import (
    TipoPermisoTrabajoSerializer, PermisoTrabajoSerializer, PermisoTrabajoListSerializer,
    TipoInspeccionSerializer, PlantillaInspeccionSerializer,
    InspeccionSerializer, InspeccionListSerializer, ItemInspeccionSerializer,
    InspeccionCreateSerializer,
    TipoEPPSerializer, EntregaEPPSerializer, EntregaEPPListSerializer,
    ProgramaSeguridadSerializer, ProgramaSeguridadListSerializer,
    AprobarPermisoSerializer, CerrarPermisoSerializer,
    GenerarHallazgoSerializer, CompletarInspeccionSerializer
)
from apps.core.models import User


# =============================================================================
# PERMISOS DE TRABAJO
# =============================================================================

class TipoPermisoTrabajoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tipos de permisos de trabajo
    """
    queryset = TipoPermisoTrabajo.objects.filter(activo=True)
    serializer_class = TipoPermisoTrabajoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Ordenar por orden y nombre
        return queryset.order_by('orden', 'nombre')


class PermisoTrabajoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para permisos de trabajo
    Incluye acciones: aprobar_permiso, cerrar_permiso
    """
    queryset = PermisoTrabajo.objects.all()
    serializer_class = PermisoTrabajoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'estado', 'tipo_permiso']
    search_fields = ['numero_permiso', 'ubicacion', 'descripcion_trabajo']
    ordering_fields = ['fecha_inicio', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filtrar por empresa del usuario
        if hasattr(user, 'empresa_id'):
            queryset = queryset.filter(empresa_id=user.empresa_id)

        # Filtros adicionales por query params
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset.select_related(
            'tipo_permiso', 'solicitante', 'ejecutor', 'supervisor'
        ).order_by('-fecha_inicio')

    def get_serializer_class(self):
        if self.action == 'list':
            return PermisoTrabajoListSerializer
        return PermisoTrabajoSerializer

    @action(detail=True, methods=['post'])
    def aprobar_permiso(self, request, pk=None):
        """
        Aprobar permiso de trabajo (SST u Operaciones)
        """
        permiso = self.get_object()
        serializer = AprobarPermisoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tipo_aprobacion = serializer.validated_data['tipo_aprobacion']

        # Verificar que el permiso esté en estado pendiente
        if permiso.estado not in ['BORRADOR', 'PENDIENTE_APROBACION']:
            return Response(
                {'error': 'El permiso no está en estado para aprobación'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Aprobar según tipo
        colaborador = get_object_or_404(
            Colaborador,
            user=request.user
        )

        if tipo_aprobacion == 'SST':
            permiso.autorizado_sst = True
            permiso.autorizado_sst_por = colaborador
            permiso.autorizado_sst_fecha = timezone.now()
        elif tipo_aprobacion == 'OPERACIONES':
            permiso.autorizado_operaciones = True
            permiso.autorizado_operaciones_por = colaborador
            permiso.autorizado_operaciones_fecha = timezone.now()

        # Cambiar estado si todas las aprobaciones requeridas están completas
        if permiso.tipo_permiso.requiere_autorizacion_sst and not permiso.autorizado_sst:
            permiso.estado = 'PENDIENTE_APROBACION'
        elif permiso.tipo_permiso.requiere_autorizacion_operaciones and not permiso.autorizado_operaciones:
            permiso.estado = 'PENDIENTE_APROBACION'
        else:
            permiso.estado = 'APROBADO'

        permiso.save()

        return Response({
            'message': f'Permiso aprobado por {tipo_aprobacion}',
            'permiso': PermisoTrabajoSerializer(permiso).data
        })

    @action(detail=True, methods=['post'])
    def cerrar_permiso(self, request, pk=None):
        """
        Cerrar permiso de trabajo completado
        """
        permiso = self.get_object()
        serializer = CerrarPermisoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verificar que el permiso esté aprobado o en ejecución
        if permiso.estado not in ['APROBADO', 'EN_EJECUCION']:
            return Response(
                {'error': 'El permiso no está en estado para cierre'},
                status=status.HTTP_400_BAD_REQUEST
            )

        colaborador = get_object_or_404(
            Colaborador,
            user=request.user
        )

        permiso.estado = 'COMPLETADO'
        permiso.fecha_cierre = timezone.now()
        permiso.cerrado_por = colaborador
        permiso.hubo_incidente = serializer.validated_data.get('hubo_incidente', False)
        permiso.descripcion_incidente = serializer.validated_data.get('descripcion_incidente', '')
        permiso.observaciones_cierre = serializer.validated_data.get('observaciones_cierre', '')

        permiso.save()

        return Response({
            'message': 'Permiso cerrado exitosamente',
            'permiso': PermisoTrabajoSerializer(permiso).data
        })

    @action(detail=True, methods=['post'])
    def iniciar_ejecucion(self, request, pk=None):
        """
        Iniciar ejecución del permiso
        """
        permiso = self.get_object()

        if permiso.estado != 'APROBADO':
            return Response(
                {'error': 'El permiso debe estar aprobado para iniciar ejecución'},
                status=status.HTTP_400_BAD_REQUEST
            )

        permiso.estado = 'EN_EJECUCION'
        permiso.save()

        return Response({
            'message': 'Ejecución iniciada',
            'permiso': PermisoTrabajoSerializer(permiso).data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtener estadísticas de permisos de trabajo
        """
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset()

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        total = queryset.count()
        por_estado = {}
        for estado_code, estado_name in PermisoTrabajo.ESTADO_CHOICES:
            count = queryset.filter(estado=estado_code).count()
            por_estado[estado_code] = {
                'nombre': estado_name,
                'cantidad': count
            }

        activos = queryset.filter(
            estado__in=['APROBADO', 'EN_EJECUCION'],
            fecha_inicio__lte=timezone.now(),
            fecha_fin__gte=timezone.now()
        ).count()

        return Response({
            'total': total,
            'por_estado': por_estado,
            'activos': activos,
            'vencidos': queryset.filter(estado='VENCIDO').count()
        })


# =============================================================================
# INSPECCIONES
# =============================================================================

class TipoInspeccionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tipos de inspecciones
    """
    queryset = TipoInspeccion.objects.filter(activo=True)
    serializer_class = TipoInspeccionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Filtrar por empresa del usuario
        if hasattr(user, 'empresa_id'):
            queryset = queryset.filter(empresa_id=user.empresa_id)

        return queryset.order_by('orden', 'nombre')


class PlantillaInspeccionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para plantillas de inspección
    """
    queryset = PlantillaInspeccion.objects.filter(activo=True)
    serializer_class = PlantillaInspeccionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'tipo_inspeccion']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if hasattr(user, 'empresa_id'):
            queryset = queryset.filter(empresa_id=user.empresa_id)

        return queryset.select_related('tipo_inspeccion')


class InspeccionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para inspecciones
    Incluye acciones: completar_inspeccion, generar_hallazgo
    """
    queryset = Inspeccion.objects.all()
    serializer_class = InspeccionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'estado', 'tipo_inspeccion']
    search_fields = ['numero_inspeccion', 'ubicacion']
    ordering_fields = ['fecha_programada', 'fecha_realizada']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if hasattr(user, 'empresa_id'):
            queryset = queryset.filter(empresa_id=user.empresa_id)

        return queryset.select_related(
            'tipo_inspeccion', 'plantilla', 'inspector'
        ).prefetch_related('items_inspeccion').order_by('-fecha_programada')

    def get_serializer_class(self):
        if self.action == 'list':
            return InspeccionListSerializer
        elif self.action == 'crear_desde_plantilla':
            return InspeccionCreateSerializer
        return InspeccionSerializer

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def crear_desde_plantilla(self, request):
        """
        Crear inspección desde una plantilla con todos sus items
        """
        serializer = InspeccionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Obtener plantilla
        plantilla = get_object_or_404(
            PlantillaInspeccion,
            id=data['plantilla_id'],
            empresa_id=data['empresa_id']
        )

        # Crear inspección
        inspeccion = Inspeccion.objects.create(
            empresa_id=data['empresa_id'],
            tipo_inspeccion_id=data['tipo_inspeccion_id'],
            plantilla=plantilla,
            fecha_programada=data['fecha_programada'],
            ubicacion=data['ubicacion'],
            area=data.get('area', ''),
            inspector_id=data['inspector_id'],
            acompanante_id=data.get('acompanante_id'),
            estado='PROGRAMADA'
        )

        # Crear items desde la plantilla
        items_creados = []
        for item_plantilla in plantilla.items:
            item = ItemInspeccion.objects.create(
                inspeccion=inspeccion,
                item_plantilla_id=item_plantilla['id'],
                categoria=item_plantilla.get('categoria', ''),
                descripcion=item_plantilla['descripcion'],
                es_critico=item_plantilla.get('es_critico', False),
                resultado='CONFORME'  # Default
            )
            items_creados.append(item)

        return Response({
            'message': 'Inspección creada exitosamente',
            'inspeccion': InspeccionSerializer(inspeccion).data,
            'items_creados': len(items_creados)
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def completar_inspeccion(self, request, pk=None):
        """
        Completar inspección con resultados de items
        """
        inspeccion = self.get_object()
        serializer = CompletarInspeccionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if inspeccion.estado not in ['PROGRAMADA', 'EN_PROCESO']:
            return Response(
                {'error': 'La inspección no está en estado para completar'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        # Actualizar items
        for item_data in data['items']:
            item_id = item_data.get('id')
            item = get_object_or_404(
                ItemInspeccion,
                id=item_id,
                inspeccion=inspeccion
            )

            item.resultado = item_data.get('resultado', 'CONFORME')
            item.calificacion = item_data.get('calificacion')
            item.observaciones = item_data.get('observaciones', '')
            item.accion_requerida = item_data.get('accion_requerida', '')
            item.foto = item_data.get('foto', '')
            item.save()

        # Calcular cumplimiento
        inspeccion.porcentaje_cumplimiento = inspeccion.calcular_cumplimiento()
        inspeccion.resultado_global = inspeccion.clasificar_resultado()

        # Contar hallazgos
        hallazgos = inspeccion.items_inspeccion.filter(
            resultado__in=['NO_CONFORME', 'OBSERVACION']
        )
        inspeccion.numero_hallazgos = hallazgos.count()
        inspeccion.numero_hallazgos_criticos = hallazgos.filter(es_critico=True).count()
        inspeccion.tiene_hallazgos = hallazgos.exists()

        # Actualizar estado y observaciones
        inspeccion.estado = 'COMPLETADA'
        inspeccion.fecha_realizada = timezone.now()
        inspeccion.observaciones_generales = data.get('observaciones_generales', '')
        inspeccion.recomendaciones = data.get('recomendaciones', '')
        inspeccion.fotos = data.get('fotos', [])

        inspeccion.save()

        return Response({
            'message': 'Inspección completada exitosamente',
            'inspeccion': InspeccionSerializer(inspeccion).data
        })

    @action(detail=True, methods=['post'])
    def generar_hallazgo(self, request, pk=None):
        """
        Generar hallazgo/no conformidad desde item de inspección
        """
        inspeccion = self.get_object()
        serializer = GenerarHallazgoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Obtener item
        item = get_object_or_404(
            ItemInspeccion,
            id=data['item_inspeccion_id'],
            inspeccion=inspeccion
        )

        # TODO: Integrar con módulo de hallazgos/no conformidades cuando esté disponible
        # Por ahora solo marcamos el item
        item.genera_hallazgo = True
        item.save()

        # Actualizar contadores de inspección
        inspeccion.tiene_hallazgos = True
        inspeccion.numero_hallazgos = inspeccion.items_inspeccion.filter(
            genera_hallazgo=True
        ).count()
        inspeccion.save()

        return Response({
            'message': 'Hallazgo generado exitosamente',
            'item': ItemInspeccionSerializer(item).data,
            'hallazgo_data': data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtener estadísticas de inspecciones
        """
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset()

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        total = queryset.count()
        completadas = queryset.filter(estado='COMPLETADA').count()
        pendientes = queryset.filter(estado='PROGRAMADA').count()
        con_hallazgos = queryset.filter(tiene_hallazgos=True).count()

        # Promedio de cumplimiento
        completadas_qs = queryset.filter(
            estado='COMPLETADA',
            porcentaje_cumplimiento__isnull=False
        )
        promedio_cumplimiento = 0
        if completadas_qs.exists():
            from django.db.models import Avg
            promedio_cumplimiento = completadas_qs.aggregate(
                Avg('porcentaje_cumplimiento')
            )['porcentaje_cumplimiento__avg'] or 0

        return Response({
            'total': total,
            'completadas': completadas,
            'pendientes': pendientes,
            'con_hallazgos': con_hallazgos,
            'promedio_cumplimiento': round(promedio_cumplimiento, 2)
        })


# =============================================================================
# EPP
# =============================================================================

class TipoEPPViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tipos de EPP
    """
    queryset = TipoEPP.objects.filter(activo=True)
    serializer_class = TipoEPPSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['categoria']

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.order_by('categoria', 'orden', 'nombre')


class EntregaEPPViewSet(viewsets.ModelViewSet):
    """
    ViewSet para entregas de EPP
    """
    queryset = EntregaEPP.objects.all()
    serializer_class = EntregaEPPSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'estado', 'colaborador', 'tipo_epp']
    search_fields = ['numero_entrega', 'colaborador__nombre_completo']
    ordering_fields = ['fecha_entrega', 'fecha_reposicion_programada']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if hasattr(user, 'empresa_id'):
            queryset = queryset.filter(empresa_id=user.empresa_id)

        return queryset.select_related(
            'tipo_epp', 'colaborador', 'entregado_por'
        ).order_by('-fecha_entrega')

    def get_serializer_class(self):
        if self.action == 'list':
            return EntregaEPPListSerializer
        return EntregaEPPSerializer

    @action(detail=True, methods=['post'])
    def registrar_devolucion(self, request, pk=None):
        """
        Registrar devolución de EPP
        """
        entrega = self.get_object()

        if entrega.estado != 'EN_USO':
            return Response(
                {'error': 'El EPP no está en uso'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = request.data.get('motivo_devolucion', '')
        estado_nuevo = request.data.get('estado', 'DEVUELTO')

        entrega.estado = estado_nuevo
        entrega.fecha_devolucion = timezone.now().date()
        entrega.motivo_devolucion = motivo
        entrega.save()

        return Response({
            'message': 'Devolución registrada exitosamente',
            'entrega': EntregaEPPSerializer(entrega).data
        })

    @action(detail=False, methods=['get'])
    def proximas_reposiciones(self, request):
        """
        Obtener EPPs que próximamente requieren reposición
        """
        from datetime import date, timedelta

        empresa_id = request.query_params.get('empresa_id')
        dias = int(request.query_params.get('dias', 30))

        queryset = self.get_queryset().filter(
            estado='EN_USO',
            fecha_reposicion_programada__isnull=False,
            fecha_reposicion_programada__lte=date.today() + timedelta(days=dias)
        )

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        serializer = EntregaEPPListSerializer(queryset, many=True)
        return Response({
            'total': queryset.count(),
            'entregas': serializer.data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de entregas de EPP
        """
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset()

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        total = queryset.count()
        en_uso = queryset.filter(estado='EN_USO').count()
        vencidos = queryset.filter(estado='VENCIDO').count()

        # Por tipo de EPP
        from django.db.models import Count
        por_tipo = queryset.values(
            'tipo_epp__nombre', 'tipo_epp__categoria'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')[:10]

        return Response({
            'total': total,
            'en_uso': en_uso,
            'vencidos': vencidos,
            'por_tipo': list(por_tipo)
        })


# =============================================================================
# PROGRAMAS DE SEGURIDAD
# =============================================================================

class ProgramaSeguridadViewSet(viewsets.ModelViewSet):
    """
    ViewSet para programas de seguridad
    """
    queryset = ProgramaSeguridad.objects.filter(activo=True)
    serializer_class = ProgramaSeguridadSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'estado', 'tipo_programa']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['fecha_inicio', 'porcentaje_avance']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if hasattr(user, 'empresa_id'):
            queryset = queryset.filter(empresa_id=user.empresa_id)

        return queryset.select_related('responsable').order_by('-fecha_inicio')

    def get_serializer_class(self):
        if self.action == 'list':
            return ProgramaSeguridadListSerializer
        return ProgramaSeguridadSerializer

    @action(detail=True, methods=['post'])
    def actualizar_avance(self, request, pk=None):
        """
        Actualizar porcentaje de avance del programa
        """
        programa = self.get_object()

        # Calcular avance desde actividades
        avance = programa.calcular_avance()
        programa.porcentaje_avance = avance

        # Actualizar estado si está completo
        if avance >= 100:
            programa.estado = 'COMPLETADO'

        programa.save()

        return Response({
            'message': 'Avance actualizado',
            'porcentaje_avance': avance,
            'programa': ProgramaSeguridadSerializer(programa).data
        })

    @action(detail=True, methods=['post'])
    def registrar_revision(self, request, pk=None):
        """
        Registrar revisión del programa
        """
        programa = self.get_object()

        resultado = request.data.get('resultado', '')

        programa.fecha_ultima_revision = timezone.now().date()
        programa.resultado_ultima_revision = resultado
        programa.save()

        return Response({
            'message': 'Revisión registrada',
            'programa': ProgramaSeguridadSerializer(programa).data
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de programas de seguridad
        """
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset()

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        total = queryset.count()
        en_ejecucion = queryset.filter(estado='EN_EJECUCION').count()
        completados = queryset.filter(estado='COMPLETADO').count()

        # Promedio de avance
        from django.db.models import Avg
        promedio_avance = queryset.aggregate(
            Avg('porcentaje_avance')
        )['porcentaje_avance__avg'] or 0

        return Response({
            'total': total,
            'en_ejecucion': en_ejecucion,
            'completados': completados,
            'promedio_avance': round(promedio_avance, 2)
        })
