"""
Views para Activos Fijos - Admin Finance
Sistema de Gestión StrateKaz

ViewSets para:
- Categoría de Activo
- Activo Fijo
- Hoja de Vida de Activo
- Programa de Mantenimiento
- Depreciación
- Baja de Activo

Autor: Sistema de Gestión
Fecha: 2025-12-29
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, Q, F
from decimal import Decimal
from datetime import timedelta

from .models import (
    CategoriaActivo,
    ActivoFijo,
    HojaVidaActivo,
    ProgramaMantenimiento,
    Depreciacion,
    Baja
)
from .serializers import (
    CategoriaActivoSerializer,
    CategoriaActivoListSerializer,
    ActivoFijoSerializer,
    ActivoFijoListSerializer,
    HojaVidaActivoSerializer,
    HojaVidaActivoListSerializer,
    ProgramaMantenimientoSerializer,
    ProgramaMantenimientoListSerializer,
    DepreciacionSerializer,
    DepreciacionListSerializer,
    BajaSerializer,
    BajaListSerializer
)


# ==============================================================================
# VIEWSET: CATEGORÍA DE ACTIVO
# ==============================================================================

class CategoriaActivoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CategoriaActivo.

    Endpoints:
    - list: Listar categorías
    - create: Crear categoría
    - retrieve: Detalle de categoría
    - update: Actualizar categoría
    - partial_update: Actualización parcial
    - destroy: Soft delete de categoría
    - activos_por_categoria: Resumen de activos por categoría
    """

    queryset = CategoriaActivo.objects.select_related('empresa').filter(is_active=True)
    serializer_class = CategoriaActivoSerializer
    filterset_fields = ['metodo_depreciacion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'vida_util_anios']
    ordering = ['codigo']

    def get_serializer_class(self):
        """Usa serializer simplificado para listado."""
        if self.action == 'list':
            return CategoriaActivoListSerializer
        return CategoriaActivoSerializer

    @action(detail=False, methods=['get'], url_path='activos-por-categoria')
    def activos_por_categoria(self, request):
        """Resumen de activos agrupados por categoría."""
        resumen = self.get_queryset().annotate(
            total_activos=Count(
                'activos',
                filter=Q(activos__is_active=True)
            ),
            activos_activos=Count(
                'activos',
                filter=Q(activos__is_active=True, activos__estado='activo')
            ),
            activos_mantenimiento=Count(
                'activos',
                filter=Q(activos__is_active=True, activos__estado='en_mantenimiento')
            ),
            valor_total=Sum(
                'activos__valor_adquisicion',
                filter=Q(activos__is_active=True, activos__estado__in=['activo', 'en_mantenimiento'])
            )
        ).values(
            'id', 'codigo', 'nombre', 'vida_util_anios', 'metodo_depreciacion',
            'total_activos', 'activos_activos', 'activos_mantenimiento', 'valor_total'
        ).order_by('nombre')

        return Response({
            'total_categorias': resumen.count(),
            'categorias': list(resumen)
        })


# ==============================================================================
# VIEWSET: ACTIVO FIJO
# ==============================================================================

class ActivoFijoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para ActivoFijo.

    Endpoints:
    - list: Listar activos
    - create: Crear activo
    - retrieve: Detalle de activo
    - update: Actualizar activo
    - partial_update: Actualización parcial
    - destroy: Soft delete de activo
    - enviar_mantenimiento: Cambiar estado a en_mantenimiento
    - activar: Reactivar activo después de mantenimiento
    - estadisticas: Estadísticas generales de activos
    - resumen_depreciacion: Resumen de depreciación de todos los activos
    - por_ubicacion: Activos agrupados por ubicación
    """

    queryset = ActivoFijo.objects.select_related(
        'empresa', 'categoria', 'area', 'responsable'
    ).filter(is_active=True)
    serializer_class = ActivoFijoSerializer
    filterset_fields = ['categoria', 'estado', 'area', 'responsable']
    search_fields = ['codigo', 'nombre', 'numero_serie', 'marca', 'modelo', 'ubicacion']
    ordering_fields = ['codigo', 'nombre', 'fecha_adquisicion', 'valor_adquisicion']
    ordering = ['-fecha_adquisicion']

    def get_serializer_class(self):
        """Usa serializer simplificado para listado."""
        if self.action == 'list':
            return ActivoFijoListSerializer
        return ActivoFijoSerializer

    @action(detail=True, methods=['post'], url_path='enviar-mantenimiento')
    def enviar_mantenimiento(self, request, pk=None):
        """Envía el activo a mantenimiento."""
        activo = self.get_object()

        if activo.estado != 'activo':
            return Response(
                {'error': 'Solo se pueden enviar a mantenimiento activos en estado activo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        activo.estado = 'en_mantenimiento'
        activo.save()

        # Registrar en hoja de vida
        HojaVidaActivo.objects.create(
            empresa=activo.empresa,
            activo=activo,
            tipo_evento='mantenimiento_preventivo',
            fecha=timezone.now().date(),
            descripcion='Activo enviado a mantenimiento',
            created_by=request.user if request.user.is_authenticated else None
        )

        serializer = self.get_serializer(activo)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        """Reactiva un activo después de mantenimiento."""
        activo = self.get_object()

        if activo.estado != 'en_mantenimiento':
            return Response(
                {'error': 'Solo se pueden activar activos en estado de mantenimiento.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        activo.estado = 'activo'
        activo.save()

        # Registrar en hoja de vida
        HojaVidaActivo.objects.create(
            empresa=activo.empresa,
            activo=activo,
            tipo_evento='reactivacion',
            fecha=timezone.now().date(),
            descripcion='Activo reactivado después de mantenimiento',
            created_by=request.user if request.user.is_authenticated else None
        )

        serializer = self.get_serializer(activo)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas generales de activos."""
        queryset = self.get_queryset()

        # Conteo por estado
        por_estado = queryset.values('estado').annotate(
            total=Count('id')
        ).order_by('estado')

        # Conteo por categoría
        por_categoria = queryset.values(
            'categoria__nombre'
        ).annotate(
            total=Count('id'),
            valor_total=Sum('valor_adquisicion')
        ).order_by('-valor_total')[:10]

        # Totales
        totales = queryset.aggregate(
            total_activos=Count('id'),
            valor_adquisicion_total=Sum('valor_adquisicion'),
            valor_residual_total=Sum('valor_residual')
        )

        # Calcular valor en libros total (aproximación)
        activos_activos = queryset.filter(estado__in=['activo', 'en_mantenimiento'])
        valor_libros_total = sum(a.valor_en_libros for a in activos_activos)

        return Response({
            'total_activos': totales['total_activos'],
            'valor_adquisicion_total': totales['valor_adquisicion_total'] or Decimal('0.00'),
            'valor_residual_total': totales['valor_residual_total'] or Decimal('0.00'),
            'valor_libros_total': valor_libros_total,
            'por_estado': list(por_estado),
            'por_categoria': list(por_categoria)
        })

    @action(detail=False, methods=['get'], url_path='resumen-depreciacion')
    def resumen_depreciacion(self, request):
        """
        Resumen de depreciación de todos los activos.

        Query params opcionales:
        - mes: Mes (1-12)
        - anio: Año
        """
        mes = request.query_params.get('mes', timezone.now().month)
        anio = request.query_params.get('anio', timezone.now().year)

        activos = self.get_queryset().filter(
            estado__in=['activo', 'en_mantenimiento']
        ).select_related('categoria')

        resumen = []
        total_depreciacion = Decimal('0.00')
        total_valor_libros = Decimal('0.00')

        for activo in activos:
            dep_mensual = activo.depreciacion_mensual
            valor_libros = activo.valor_en_libros
            total_depreciacion += dep_mensual
            total_valor_libros += valor_libros

            resumen.append({
                'codigo': activo.codigo,
                'nombre': activo.nombre,
                'categoria': activo.categoria.nombre,
                'valor_adquisicion': activo.valor_adquisicion,
                'depreciacion_mensual': dep_mensual,
                'depreciacion_acumulada': activo.depreciacion_acumulada,
                'valor_en_libros': valor_libros,
                'porcentaje_depreciado': activo.porcentaje_depreciacion
            })

        return Response({
            'periodo': f'{mes:02d}/{anio}',
            'total_activos': len(resumen),
            'depreciacion_mensual_total': total_depreciacion,
            'valor_libros_total': total_valor_libros,
            'activos': resumen
        })

    @action(detail=False, methods=['get'], url_path='por-ubicacion')
    def por_ubicacion(self, request):
        """Activos agrupados por ubicación."""
        resumen = self.get_queryset().exclude(
            ubicacion__isnull=True
        ).exclude(
            ubicacion=''
        ).values('ubicacion').annotate(
            total=Count('id'),
            valor_total=Sum('valor_adquisicion')
        ).order_by('-total')

        return Response({
            'total_ubicaciones': resumen.count(),
            'ubicaciones': list(resumen)
        })


# ==============================================================================
# VIEWSET: HOJA DE VIDA DE ACTIVO
# ==============================================================================

class HojaVidaActivoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para HojaVidaActivo.

    Endpoints:
    - list: Listar eventos de hoja de vida
    - create: Crear evento
    - retrieve: Detalle de evento
    - update: Actualizar evento
    - partial_update: Actualización parcial
    - destroy: Soft delete de evento
    - por_activo: Historial de un activo específico
    - resumen_costos: Resumen de costos de mantenimiento
    """

    queryset = HojaVidaActivo.objects.select_related(
        'empresa', 'activo', 'realizado_por'
    ).filter(is_active=True)
    serializer_class = HojaVidaActivoSerializer
    filterset_fields = ['activo', 'tipo_evento']
    search_fields = ['codigo', 'descripcion']
    ordering_fields = ['fecha', 'costo']
    ordering = ['-fecha']

    def get_serializer_class(self):
        """Usa serializer simplificado para listado."""
        if self.action == 'list':
            return HojaVidaActivoListSerializer
        return HojaVidaActivoSerializer

    @action(detail=False, methods=['get'], url_path='por-activo')
    def por_activo(self, request):
        """
        Historial de eventos de un activo específico.

        Query params requeridos:
        - activo_id: ID del activo
        """
        activo_id = request.query_params.get('activo_id')

        if not activo_id:
            return Response(
                {'error': 'Debe proporcionar activo_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        eventos = self.get_queryset().filter(activo_id=activo_id)
        serializer = HojaVidaActivoListSerializer(eventos, many=True)

        # Totales
        totales = eventos.aggregate(
            total_eventos=Count('id'),
            costo_total=Sum('costo')
        )

        # Eventos por tipo
        por_tipo = eventos.values('tipo_evento').annotate(
            total=Count('id'),
            costo=Sum('costo')
        ).order_by('tipo_evento')

        return Response({
            'activo_id': activo_id,
            'total_eventos': totales['total_eventos'],
            'costo_total': totales['costo_total'] or Decimal('0.00'),
            'por_tipo': list(por_tipo),
            'eventos': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='resumen-costos')
    def resumen_costos(self, request):
        """
        Resumen de costos de mantenimiento.

        Query params opcionales:
        - anio: Año para filtrar
        """
        anio = request.query_params.get('anio', timezone.now().year)

        queryset = self.get_queryset().filter(
            fecha__year=anio,
            tipo_evento__in=['mantenimiento_preventivo', 'mantenimiento_correctivo', 'reparacion']
        )

        # Resumen por tipo
        por_tipo = queryset.values('tipo_evento').annotate(
            total_eventos=Count('id'),
            costo_total=Sum('costo')
        ).order_by('tipo_evento')

        # Resumen por mes
        por_mes = queryset.extra(
            select={'mes': 'MONTH(fecha)'}
        ).values('mes').annotate(
            total_eventos=Count('id'),
            costo_total=Sum('costo')
        ).order_by('mes')

        # Total general
        totales = queryset.aggregate(
            total_eventos=Count('id'),
            costo_total=Sum('costo')
        )

        return Response({
            'anio': anio,
            'total_eventos': totales['total_eventos'],
            'costo_total': totales['costo_total'] or Decimal('0.00'),
            'por_tipo': list(por_tipo),
            'por_mes': list(por_mes)
        })


# ==============================================================================
# VIEWSET: PROGRAMA DE MANTENIMIENTO
# ==============================================================================

class ProgramaMantenimientoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para ProgramaMantenimiento.

    Endpoints:
    - list: Listar programas de mantenimiento
    - create: Crear programa
    - retrieve: Detalle de programa
    - update: Actualizar programa
    - partial_update: Actualización parcial
    - destroy: Soft delete de programa
    - proximos: Mantenimientos próximos a ejecutar
    - vencidos: Mantenimientos vencidos
    - ejecutar: Registrar ejecución de mantenimiento
    """

    queryset = ProgramaMantenimiento.objects.select_related(
        'empresa', 'activo', 'responsable'
    ).filter(is_active=True)
    serializer_class = ProgramaMantenimientoSerializer
    filterset_fields = ['activo', 'tipo', 'estado', 'responsable']
    search_fields = ['activo__codigo', 'activo__nombre', 'descripcion']
    ordering_fields = ['proxima_fecha', 'frecuencia_dias']
    ordering = ['proxima_fecha']

    def get_serializer_class(self):
        """Usa serializer simplificado para listado."""
        if self.action == 'list':
            return ProgramaMantenimientoListSerializer
        return ProgramaMantenimientoSerializer

    @action(detail=False, methods=['get'])
    def proximos(self, request):
        """
        Lista mantenimientos próximos a ejecutar.

        Query params opcionales:
        - dias: Cantidad de días a futuro (default: 30)
        """
        dias = int(request.query_params.get('dias', 30))
        fecha_limite = timezone.now().date() + timedelta(days=dias)

        programas = self.get_queryset().filter(
            proxima_fecha__lte=fecha_limite,
            proxima_fecha__gte=timezone.now().date(),
            estado='activo'
        ).order_by('proxima_fecha')

        serializer = ProgramaMantenimientoListSerializer(programas, many=True)

        return Response({
            'dias': dias,
            'fecha_limite': fecha_limite,
            'total': programas.count(),
            'programas': serializer.data
        })

    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """Lista mantenimientos vencidos (fecha pasada)."""
        programas = self.get_queryset().filter(
            proxima_fecha__lt=timezone.now().date(),
            estado='activo'
        ).order_by('proxima_fecha')

        serializer = ProgramaMantenimientoListSerializer(programas, many=True)

        return Response({
            'total': programas.count(),
            'programas': serializer.data
        })

    @action(detail=True, methods=['post'])
    def ejecutar(self, request, pk=None):
        """
        Registra la ejecución de un mantenimiento.

        Body:
        {
            "fecha_ejecucion": "2024-12-30",
            "costo": 150000.00,
            "descripcion": "Mantenimiento ejecutado correctamente",
            "realizado_por": 1
        }
        """
        programa = self.get_object()

        if programa.estado != 'activo':
            return Response(
                {'error': 'Solo se pueden ejecutar programas activos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        fecha_ejecucion = request.data.get('fecha_ejecucion', timezone.now().date())
        costo = request.data.get('costo', Decimal('0.00'))
        descripcion = request.data.get('descripcion', f'Ejecución de {programa.get_tipo_display()}')
        realizado_por_id = request.data.get('realizado_por')

        # Crear registro en hoja de vida
        tipo_evento = 'mantenimiento_preventivo' if programa.tipo == 'preventivo' else 'mantenimiento_correctivo'

        HojaVidaActivo.objects.create(
            empresa=programa.empresa,
            activo=programa.activo,
            tipo_evento=tipo_evento,
            fecha=fecha_ejecucion,
            descripcion=descripcion,
            costo=costo,
            realizado_por_id=realizado_por_id,
            created_by=request.user if request.user.is_authenticated else None
        )

        # Actualizar programa
        programa.ultima_fecha = fecha_ejecucion
        programa.proxima_fecha = fecha_ejecucion + timedelta(days=programa.frecuencia_dias)
        programa.save()

        serializer = self.get_serializer(programa)
        return Response({
            'mensaje': 'Mantenimiento ejecutado correctamente.',
            'programa': serializer.data
        })


# ==============================================================================
# VIEWSET: DEPRECIACIÓN
# ==============================================================================

class DepreciacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Depreciacion.

    Endpoints:
    - list: Listar registros de depreciación
    - create: Crear registro de depreciación
    - retrieve: Detalle de depreciación
    - update: Actualizar depreciación
    - partial_update: Actualización parcial
    - destroy: Soft delete de depreciación
    - calcular_periodo: Calcular depreciación para un período
    - reporte_mensual: Reporte de depreciación mensual
    - por_activo: Historial de depreciación de un activo
    """

    queryset = Depreciacion.objects.select_related(
        'empresa', 'activo'
    ).filter(is_active=True)
    serializer_class = DepreciacionSerializer
    filterset_fields = ['activo', 'periodo_mes', 'periodo_anio']
    search_fields = ['activo__codigo', 'activo__nombre']
    ordering_fields = ['periodo_anio', 'periodo_mes', 'depreciacion_periodo']
    ordering = ['-periodo_anio', '-periodo_mes']

    def get_serializer_class(self):
        """Usa serializer simplificado para listado."""
        if self.action == 'list':
            return DepreciacionListSerializer
        return DepreciacionSerializer

    @action(detail=False, methods=['post'], url_path='calcular-periodo')
    def calcular_periodo(self, request):
        """
        Calcula la depreciación de todos los activos para un período.

        Body:
        {
            "mes": 12,
            "anio": 2024
        }
        """
        mes = request.data.get('mes', timezone.now().month)
        anio = request.data.get('anio', timezone.now().year)

        # Validar mes
        if not (1 <= mes <= 12):
            return Response(
                {'error': 'El mes debe estar entre 1 y 12.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener activos activos
        activos = ActivoFijo.objects.filter(
            is_active=True,
            estado__in=['activo', 'en_mantenimiento']
        ).select_related('categoria', 'empresa')

        registros_creados = 0
        registros_existentes = 0
        errores = []

        for activo in activos:
            # Verificar si ya existe registro para este período
            existe = Depreciacion.objects.filter(
                activo=activo,
                periodo_mes=mes,
                periodo_anio=anio
            ).exists()

            if existe:
                registros_existentes += 1
                continue

            try:
                # Calcular depreciación
                dep_mensual = activo.depreciacion_mensual
                dep_acumulada = activo.depreciacion_acumulada + dep_mensual
                valor_libros = activo.valor_adquisicion - dep_acumulada

                # No depreciar más allá del valor residual
                if valor_libros < activo.valor_residual:
                    dep_mensual = max(Decimal('0.00'), activo.valor_en_libros - activo.valor_residual)
                    dep_acumulada = activo.valor_adquisicion - activo.valor_residual
                    valor_libros = activo.valor_residual

                Depreciacion.objects.create(
                    empresa=activo.empresa,
                    activo=activo,
                    periodo_mes=mes,
                    periodo_anio=anio,
                    valor_inicial=activo.valor_adquisicion,
                    depreciacion_periodo=dep_mensual,
                    depreciacion_acumulada=dep_acumulada,
                    valor_en_libros=valor_libros,
                    created_by=request.user if request.user.is_authenticated else None
                )
                registros_creados += 1

            except Exception as e:
                errores.append({
                    'activo': activo.codigo,
                    'error': str(e)
                })

        return Response({
            'periodo': f'{mes:02d}/{anio}',
            'registros_creados': registros_creados,
            'registros_existentes': registros_existentes,
            'errores': errores
        })

    @action(detail=False, methods=['get'], url_path='reporte-mensual')
    def reporte_mensual(self, request):
        """
        Reporte de depreciación mensual.

        Query params requeridos:
        - mes: Mes
        - anio: Año
        """
        mes = request.query_params.get('mes')
        anio = request.query_params.get('anio')

        if not mes or not anio:
            return Response(
                {'error': 'Debe proporcionar mes y anio.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        depreciaciones = self.get_queryset().filter(
            periodo_mes=mes,
            periodo_anio=anio
        ).select_related('activo', 'activo__categoria')

        # Por categoría
        por_categoria = depreciaciones.values(
            'activo__categoria__nombre'
        ).annotate(
            total_activos=Count('id'),
            depreciacion_total=Sum('depreciacion_periodo'),
            valor_libros_total=Sum('valor_en_libros')
        ).order_by('activo__categoria__nombre')

        # Totales
        totales = depreciaciones.aggregate(
            total_activos=Count('id'),
            depreciacion_total=Sum('depreciacion_periodo'),
            valor_libros_total=Sum('valor_en_libros')
        )

        serializer = DepreciacionListSerializer(depreciaciones, many=True)

        return Response({
            'periodo': f'{mes:02d}/{anio}',
            'total_activos': totales['total_activos'],
            'depreciacion_total': totales['depreciacion_total'] or Decimal('0.00'),
            'valor_libros_total': totales['valor_libros_total'] or Decimal('0.00'),
            'por_categoria': list(por_categoria),
            'detalle': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='por-activo')
    def por_activo(self, request):
        """
        Historial de depreciación de un activo.

        Query params requeridos:
        - activo_id: ID del activo
        """
        activo_id = request.query_params.get('activo_id')

        if not activo_id:
            return Response(
                {'error': 'Debe proporcionar activo_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        depreciaciones = self.get_queryset().filter(
            activo_id=activo_id
        ).order_by('periodo_anio', 'periodo_mes')

        serializer = DepreciacionListSerializer(depreciaciones, many=True)

        # Totales
        totales = depreciaciones.aggregate(
            total_periodos=Count('id'),
            depreciacion_total=Sum('depreciacion_periodo')
        )

        return Response({
            'activo_id': activo_id,
            'total_periodos': totales['total_periodos'],
            'depreciacion_total': totales['depreciacion_total'] or Decimal('0.00'),
            'historial': serializer.data
        })


# ==============================================================================
# VIEWSET: BAJA DE ACTIVO
# ==============================================================================

class BajaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Baja de activos.

    Endpoints:
    - list: Listar bajas
    - create: Crear baja (da de baja el activo)
    - retrieve: Detalle de baja
    - update: Actualizar baja
    - partial_update: Actualización parcial
    - destroy: Soft delete de baja
    - aprobar: Aprobar baja de activo
    - estadisticas: Estadísticas de bajas por período
    """

    queryset = Baja.objects.select_related(
        'empresa', 'activo', 'aprobado_por'
    ).filter(is_active=True)
    serializer_class = BajaSerializer
    filterset_fields = ['activo', 'motivo', 'aprobado_por']
    search_fields = ['activo__codigo', 'activo__nombre', 'observaciones']
    ordering_fields = ['fecha_baja', 'valor_residual_real']
    ordering = ['-fecha_baja']

    def get_serializer_class(self):
        """Usa serializer simplificado para listado."""
        if self.action == 'list':
            return BajaListSerializer
        return BajaSerializer

    def perform_create(self, serializer):
        """Al crear baja, cambia el estado del activo."""
        baja = serializer.save()

        # Cambiar estado del activo
        activo = baja.activo
        activo.estado = 'dado_baja'
        activo.save()

        # Registrar en hoja de vida
        HojaVidaActivo.objects.create(
            empresa=activo.empresa,
            activo=activo,
            tipo_evento='baja',
            fecha=baja.fecha_baja,
            descripcion=f'Baja de activo - Motivo: {baja.get_motivo_display()}',
            created_by=baja.created_by
        )

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """
        Aprueba una baja de activo.

        Body:
        {
            "aprobado_por": 1
        }
        """
        baja = self.get_object()

        if baja.aprobado_por:
            return Response(
                {'error': 'Esta baja ya ha sido aprobada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        aprobado_por_id = request.data.get('aprobado_por')
        if not aprobado_por_id:
            return Response(
                {'error': 'Debe indicar quién aprueba la baja.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        baja.aprobado_por_id = aprobado_por_id
        baja.fecha_aprobacion = timezone.now()
        baja.save()

        serializer = self.get_serializer(baja)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas de bajas por período.

        Query params opcionales:
        - anio: Año para filtrar
        """
        anio = request.query_params.get('anio', timezone.now().year)

        queryset = self.get_queryset().filter(fecha_baja__year=anio)

        # Por motivo
        por_motivo = queryset.values('motivo').annotate(
            total=Count('id'),
            valor_total=Sum('valor_residual_real')
        ).order_by('motivo')

        # Por mes
        por_mes = queryset.extra(
            select={'mes': 'MONTH(fecha_baja)'}
        ).values('mes').annotate(
            total=Count('id'),
            valor_total=Sum('valor_residual_real')
        ).order_by('mes')

        # Totales
        totales = queryset.aggregate(
            total_bajas=Count('id'),
            valor_total=Sum('valor_residual_real')
        )

        return Response({
            'anio': anio,
            'total_bajas': totales['total_bajas'],
            'valor_total': totales['valor_total'] or Decimal('0.00'),
            'por_motivo': list(por_motivo),
            'por_mes': list(por_mes)
        })
