"""
Views para Onboarding e Inducción - Talent Hub
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta

from apps.core.base_models.mixins import get_tenant_empresa

from .models import (
    ModuloInduccion,
    AsignacionPorCargo,
    ItemChecklist,
    ChecklistIngreso,
    EjecucionIntegral,
    EntregaEPP,
    EntregaActivo,
    FirmaDocumento,
)
from .serializers import (
    ModuloInduccionListSerializer,
    ModuloInduccionDetailSerializer,
    ModuloInduccionCreateUpdateSerializer,
    AsignacionPorCargoSerializer,
    ItemChecklistSerializer,
    ChecklistIngresoListSerializer,
    ChecklistIngresoDetailSerializer,
    EjecucionIntegralListSerializer,
    EjecucionIntegralDetailSerializer,
    EjecucionIntegralCreateSerializer,
    EjecucionIntegralUpdateSerializer,
    EntregaEPPListSerializer,
    EntregaEPPDetailSerializer,
    EntregaEPPCreateUpdateSerializer,
    EntregaActivoListSerializer,
    EntregaActivoDetailSerializer,
    EntregaActivoCreateSerializer,
    EntregaActivoDevolucionSerializer,
    FirmaDocumentoListSerializer,
    FirmaDocumentoDetailSerializer,
    FirmaDocumentoCreateUpdateSerializer,
    OnboardingEstadisticasSerializer,
)


class ModuloInduccionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de módulos de inducción."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['tipo_modulo', 'formato_contenido', 'es_obligatorio', 'is_active']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']

    def get_queryset(self):
        return ModuloInduccion.objects.filter(
            is_active=True
        ).select_related('responsable')

    def get_serializer_class(self):
        if self.action == 'list':
            return ModuloInduccionListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ModuloInduccionCreateUpdateSerializer
        return ModuloInduccionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def vigentes(self, request):
        """Retorna solo módulos vigentes."""
        hoy = timezone.now().date()
        queryset = self.get_queryset().filter(
            Q(fecha_vigencia_desde__isnull=True) | Q(fecha_vigencia_desde__lte=hoy),
            Q(fecha_vigencia_hasta__isnull=True) | Q(fecha_vigencia_hasta__gte=hoy)
        )
        serializer = ModuloInduccionListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_tipo(self, request):
        """Retorna módulos agrupados por tipo."""
        queryset = self.get_queryset()
        result = {}
        for tipo, _ in ModuloInduccion._meta.get_field('tipo_modulo').choices:
            modulos = queryset.filter(tipo_modulo=tipo)
            result[tipo] = ModuloInduccionListSerializer(modulos, many=True).data
        return Response(result)


class AsignacionPorCargoViewSet(viewsets.ModelViewSet):
    """ViewSet para asignaciones de módulos por cargo."""
    permission_classes = [IsAuthenticated]
    serializer_class = AsignacionPorCargoSerializer
    filterset_fields = ['cargo', 'modulo', 'es_obligatorio']
    ordering = ['cargo', 'orden_ejecucion']

    def get_queryset(self):
        return AsignacionPorCargo.objects.filter(
            is_active=True
        ).select_related('cargo', 'modulo')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def por_cargo(self, request):
        """Retorna asignaciones para un cargo específico."""
        cargo_id = request.query_params.get('cargo_id')
        if not cargo_id:
            return Response({'error': 'Se requiere cargo_id'}, status=400)

        queryset = self.get_queryset().filter(cargo_id=cargo_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ItemChecklistViewSet(viewsets.ModelViewSet):
    """ViewSet para items de checklist de onboarding."""
    permission_classes = [IsAuthenticated]
    serializer_class = ItemChecklistSerializer
    filterset_fields = ['categoria', 'aplica_a_todos', 'is_active']
    search_fields = ['codigo', 'descripcion']
    ordering = ['categoria', 'orden']

    def get_queryset(self):
        return ItemChecklist.objects.filter(
            is_active=True
        ).prefetch_related('cargos_aplicables')

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)


class ChecklistIngresoViewSet(viewsets.ModelViewSet):
    """ViewSet para seguimiento de checklist por colaborador."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['colaborador', 'estado']
    ordering = ['colaborador', 'item__orden']

    def get_queryset(self):
        return ChecklistIngreso.objects.filter(
            is_active=True
        ).select_related('colaborador', 'item', 'verificado_por')

    def get_serializer_class(self):
        if self.action == 'list':
            return ChecklistIngresoListSerializer
        return ChecklistIngresoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def verificar(self, request, pk=None):
        """Marca un ítem del checklist como verificado."""
        checklist = self.get_object()
        checklist.estado = 'cumplido'
        checklist.verificado_por = request.user
        checklist.fecha_verificacion = timezone.now()
        checklist.fecha_cumplimiento = timezone.now().date()
        checklist.save()
        return Response({'status': 'Verificado exitosamente'})

    @action(detail=False, methods=['get'])
    def por_colaborador(self, request):
        """Retorna checklist completo de un colaborador."""
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response({'error': 'Se requiere colaborador_id'}, status=400)

        queryset = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = ChecklistIngresoListSerializer(queryset, many=True)

        # Calcular resumen
        total = queryset.count()
        cumplidos = queryset.filter(estado='cumplido').count()
        pendientes = queryset.filter(estado='pendiente').count()

        return Response({
            'items': serializer.data,
            'resumen': {
                'total': total,
                'cumplidos': cumplidos,
                'pendientes': pendientes,
                'porcentaje_avance': round((cumplidos / total * 100) if total > 0 else 0, 2)
            }
        })


class EjecucionIntegralViewSet(viewsets.ModelViewSet):
    """ViewSet para ejecución de inducciones."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['colaborador', 'modulo', 'estado']
    ordering = ['colaborador', 'modulo__orden']

    def get_queryset(self):
        return EjecucionIntegral.objects.filter(
            is_active=True
        ).select_related('colaborador', 'modulo', 'facilitador')

    def get_serializer_class(self):
        if self.action == 'list':
            return EjecucionIntegralListSerializer
        if self.action == 'create':
            return EjecucionIntegralCreateSerializer
        if self.action in ['update', 'partial_update']:
            return EjecucionIntegralUpdateSerializer
        return EjecucionIntegralDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        """Marca una inducción como iniciada."""
        ejecucion = self.get_object()
        if ejecucion.estado != 'pendiente':
            return Response({'error': 'Solo se pueden iniciar inducciones pendientes'}, status=400)

        ejecucion.estado = 'en_progreso'
        ejecucion.fecha_inicio = timezone.now()
        ejecucion.save()
        return Response({'status': 'Inducción iniciada'})

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Marca una inducción como completada."""
        ejecucion = self.get_object()
        nota = request.data.get('nota')

        if ejecucion.modulo.requiere_evaluacion and nota is None:
            return Response({'error': 'Se requiere la nota de evaluación'}, status=400)

        ejecucion.estado = 'completado'
        ejecucion.fecha_finalizacion = timezone.now()
        ejecucion.progreso_porcentaje = 100
        if nota is not None:
            ejecucion.nota_obtenida = nota
        ejecucion.save()
        return Response({'status': 'Inducción completada'})

    @action(detail=False, methods=['get'])
    def por_colaborador(self, request):
        """Retorna inducciones de un colaborador."""
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response({'error': 'Se requiere colaborador_id'}, status=400)

        queryset = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = EjecucionIntegralListSerializer(queryset, many=True)

        total = queryset.count()
        completadas = queryset.filter(estado='completado').count()
        en_progreso = queryset.filter(estado='en_progreso').count()
        pendientes = queryset.filter(estado='pendiente').count()
        vencidas = sum(1 for e in queryset if e.esta_vencido)

        return Response({
            'inducciones': serializer.data,
            'resumen': {
                'total': total,
                'completadas': completadas,
                'en_progreso': en_progreso,
                'pendientes': pendientes,
                'vencidas': vencidas,
                'porcentaje_avance': round((completadas / total * 100) if total > 0 else 0, 2)
            }
        })

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """Retorna inducciones vencidas."""
        hoy = timezone.now().date()
        queryset = self.get_queryset().filter(
            estado__in=['pendiente', 'en_progreso'],
            fecha_limite__lt=hoy
        )
        serializer = EjecucionIntegralListSerializer(queryset, many=True)
        return Response(serializer.data)


class EntregaEPPViewSet(viewsets.ModelViewSet):
    """ViewSet para entregas de EPP."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['colaborador', 'tipo_epp', 'recibido_conforme']
    ordering = ['-fecha_entrega']

    def get_queryset(self):
        return EntregaEPP.objects.filter(
            is_active=True
        ).select_related('colaborador', 'entregado_por')

    def get_serializer_class(self):
        if self.action == 'list':
            return EntregaEPPListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return EntregaEPPCreateUpdateSerializer
        return EntregaEPPDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            entregado_por=self.request.user
        )

    @action(detail=False, methods=['get'])
    def por_vencer(self, request):
        """Retorna EPP que están próximos a vencer."""
        dias = int(request.query_params.get('dias', 30))
        fecha_limite = timezone.now().date() + timedelta(days=dias)

        queryset = self.get_queryset().filter(
            fecha_vencimiento__isnull=False,
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=timezone.now().date()
        )
        serializer = EntregaEPPListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_colaborador(self, request):
        """Retorna EPP entregados a un colaborador."""
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response({'error': 'Se requiere colaborador_id'}, status=400)

        queryset = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = EntregaEPPListSerializer(queryset, many=True)
        return Response(serializer.data)


class EntregaActivoViewSet(viewsets.ModelViewSet):
    """ViewSet para entregas de activos."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['colaborador', 'tipo_activo', 'devuelto']
    ordering = ['-fecha_entrega']

    def get_queryset(self):
        return EntregaActivo.objects.filter(
            is_active=True
        ).select_related('colaborador', 'entregado_por', 'recibido_por')

    def get_serializer_class(self):
        if self.action == 'list':
            return EntregaActivoListSerializer
        if self.action == 'create':
            return EntregaActivoCreateSerializer
        if self.action == 'registrar_devolucion':
            return EntregaActivoDevolucionSerializer
        return EntregaActivoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=get_tenant_empresa(),
            created_by=self.request.user,
            entregado_por=self.request.user
        )

    @action(detail=True, methods=['post'])
    def registrar_devolucion(self, request, pk=None):
        """Registra la devolución de un activo."""
        activo = self.get_object()
        serializer = EntregaActivoDevolucionSerializer(activo, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            devuelto=True,
            recibido_por=request.user,
            fecha_devolucion=request.data.get('fecha_devolucion', timezone.now().date())
        )
        return Response({'status': 'Devolución registrada'})

    @action(detail=False, methods=['get'])
    def pendientes_devolucion(self, request):
        """Retorna activos pendientes de devolución."""
        queryset = self.get_queryset().filter(
            devuelto=False,
            colaborador__estado='retirado'
        )
        serializer = EntregaActivoListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_colaborador(self, request):
        """Retorna activos asignados a un colaborador."""
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response({'error': 'Se requiere colaborador_id'}, status=400)

        queryset = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = EntregaActivoListSerializer(queryset, many=True)
        return Response(serializer.data)


class FirmaDocumentoViewSet(viewsets.ModelViewSet):
    """ViewSet para firmas de documentos."""
    permission_classes = [IsAuthenticated]
    filterset_fields = ['colaborador', 'tipo_documento', 'firmado']
    ordering = ['-fecha_firma']

    def get_queryset(self):
        return FirmaDocumento.objects.filter(
            is_active=True
        ).select_related('colaborador', 'testigo')

    def get_serializer_class(self):
        if self.action == 'list':
            return FirmaDocumentoListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return FirmaDocumentoCreateUpdateSerializer
        return FirmaDocumentoDetailSerializer

    def perform_create(self, serializer):
        serializer.save(empresa=get_tenant_empresa(), created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def marcar_firmado(self, request, pk=None):
        """Marca un documento como firmado."""
        documento = self.get_object()
        documento.firmado = True
        documento.testigo = request.user
        if not documento.fecha_firma:
            documento.fecha_firma = timezone.now().date()
        documento.save()
        return Response({'status': 'Documento marcado como firmado'})

    @action(detail=False, methods=['get'])
    def por_colaborador(self, request):
        """Retorna documentos de un colaborador."""
        colaborador_id = request.query_params.get('colaborador_id')
        if not colaborador_id:
            return Response({'error': 'Se requiere colaborador_id'}, status=400)

        queryset = self.get_queryset().filter(colaborador_id=colaborador_id)
        serializer = FirmaDocumentoListSerializer(queryset, many=True)

        total = queryset.count()
        firmados = queryset.filter(firmado=True).count()

        return Response({
            'documentos': serializer.data,
            'resumen': {
                'total': total,
                'firmados': firmados,
                'pendientes': total - firmados
            }
        })

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Retorna documentos pendientes de firma."""
        queryset = self.get_queryset().filter(firmado=False)
        serializer = FirmaDocumentoListSerializer(queryset, many=True)
        return Response(serializer.data)


class OnboardingEstadisticasViewSet(viewsets.ViewSet):
    """ViewSet para estadísticas generales de onboarding."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Retorna estadísticas generales de onboarding."""
        hoy = timezone.now().date()
        inicio_mes = hoy.replace(day=1)

        # Módulos
        total_modulos = ModuloInduccion.objects.filter(is_active=True).count()
        modulos_activos = ModuloInduccion.objects.filter(
            is_active=True
        ).filter(
            Q(fecha_vigencia_desde__isnull=True) | Q(fecha_vigencia_desde__lte=hoy),
            Q(fecha_vigencia_hasta__isnull=True) | Q(fecha_vigencia_hasta__gte=hoy)
        ).count()

        # Inducciones
        inducciones = EjecucionIntegral.objects.filter(is_active=True)
        inducciones_pendientes = inducciones.filter(estado='pendiente').count()
        inducciones_en_progreso = inducciones.filter(estado='en_progreso').count()
        inducciones_completadas_mes = inducciones.filter(
            estado='completado',
            fecha_finalizacion__date__gte=inicio_mes
        ).count()

        # Tasa de cumplimiento (completadas / total asignadas este mes)
        total_asignadas = inducciones.filter(fecha_asignacion__gte=inicio_mes).count()
        tasa_cumplimiento = (inducciones_completadas_mes / total_asignadas * 100) if total_asignadas > 0 else 0

        # EPP por vencer (próximos 30 días)
        fecha_limite = hoy + timedelta(days=30)
        epp_por_vencer = EntregaEPP.objects.filter(
            is_active=True,
            fecha_vencimiento__isnull=False,
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=hoy
        ).count()

        # Activos pendientes de devolución
        activos_pendientes = EntregaActivo.objects.filter(
            is_active=True,
            devuelto=False,
            colaborador__estado='retirado'
        ).count()

        data = {
            'total_modulos': total_modulos,
            'modulos_activos': modulos_activos,
            'inducciones_pendientes': inducciones_pendientes,
            'inducciones_en_progreso': inducciones_en_progreso,
            'inducciones_completadas_mes': inducciones_completadas_mes,
            'tasa_cumplimiento': round(tasa_cumplimiento, 2),
            'epp_por_vencer': epp_por_vencer,
            'activos_pendientes_devolucion': activos_pendientes,
        }

        serializer = OnboardingEstadisticasSerializer(data)
        return Response(serializer.data)
