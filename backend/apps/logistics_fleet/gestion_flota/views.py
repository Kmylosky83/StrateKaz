"""
Views para Gestión de Flota - Logistics Fleet Management
Sistema de Gestión StrateKaz
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from datetime import timedelta
from decimal import Decimal

from .models import (
    TipoVehiculo, EstadoVehiculo, Vehiculo, DocumentoVehiculo,
    HojaVidaVehiculo, MantenimientoVehiculo, CostoOperacion,
    VerificacionTercero
)
from .serializers import (
    TipoVehiculoSerializer, EstadoVehiculoSerializer,
    VehiculoSerializer, VehiculoListSerializer,
    DocumentoVehiculoSerializer,
    HojaVidaVehiculoSerializer,
    MantenimientoVehiculoSerializer, MantenimientoListSerializer,
    CostoOperacionSerializer, CostoOperacionListSerializer,
    VerificacionTerceroSerializer, VerificacionListSerializer
)


# ==============================================================================
# VIEWSETS DE CATÁLOGOS
# ==============================================================================

class TipoVehiculoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Tipo de Vehículo.

    Endpoints:
    - GET /api/fleet/tipos-vehiculo/ - Listar todos
    - POST /api/fleet/tipos-vehiculo/ - Crear nuevo
    - GET /api/fleet/tipos-vehiculo/{id}/ - Detalle
    - PUT/PATCH /api/fleet/tipos-vehiculo/{id}/ - Actualizar
    - DELETE /api/fleet/tipos-vehiculo/{id}/ - Eliminar
    """
    queryset = TipoVehiculo.objects.all()
    serializer_class = TipoVehiculoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'requiere_refrigeracion', 'requiere_licencia_especial']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']


class EstadoVehiculoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Estado de Vehículo.

    Endpoints estándar CRUD.
    """
    queryset = EstadoVehiculo.objects.all()
    serializer_class = EstadoVehiculoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'disponible_para_ruta', 'requiere_mantenimiento']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'created_at']
    ordering = ['orden', 'nombre']


# ==============================================================================
# VIEWSET PRINCIPAL - VEHÍCULOS
# ==============================================================================

class VehiculoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Vehículo con acciones personalizadas.

    Acciones especiales:
    - GET /api/fleet/vehiculos/disponibles/ - Vehículos disponibles para ruta
    - GET /api/fleet/vehiculos/documentos_vencidos/ - Vehículos con documentos vencidos
    - GET /api/fleet/vehiculos/proximos_mantenimientos/ - Próximos mantenimientos
    - GET /api/fleet/vehiculos/dashboard/ - KPIs de flota
    """
    queryset = Vehiculo.objects.select_related(
        'tipo_vehiculo', 'estado', 'empresa', 'created_by', 'updated_by'
    ).filter(is_active=True)
    serializer_class = VehiculoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = [
        'tipo_vehiculo', 'estado', 'es_propio', 'es_contratado',
        'gps_instalado', 'is_active'
    ]
    search_fields = ['placa', 'marca', 'modelo', 'numero_motor', 'numero_chasis', 'vin']
    ordering_fields = ['placa', 'marca', 'modelo', 'anio', 'km_actual', 'created_at']
    ordering = ['placa']

    def get_serializer_class(self):
        """Usa serializer simplificado para listado."""
        if self.action == 'list':
            return VehiculoListSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        """Filtra por empresa del usuario."""
        queryset = super().get_queryset()
        if self.request.user.empresa:
            queryset = queryset.filter(empresa=self.request.user.empresa)
        return queryset

    def perform_create(self, serializer):
        """Asigna empresa y usuario al crear."""
        serializer.save(
            empresa=self.request.user.empresa,
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """Asigna usuario al actualizar."""
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """
        GET /api/fleet/vehiculos/disponibles/

        Retorna vehículos disponibles para asignar a rutas.
        Criterios:
        - Activos
        - Estado con disponible_para_ruta=True
        - Documentos (SOAT y tecnomecánica) al día
        """
        queryset = self.get_queryset().filter(
            estado__disponible_para_ruta=True
        )

        # Filtrar por documentos al día
        hoy = timezone.now().date()
        queryset = queryset.filter(
            Q(fecha_soat__gte=hoy) & Q(fecha_tecnomecanica__gte=hoy)
        )

        serializer = VehiculoListSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def documentos_vencidos(self, request):
        """
        GET /api/fleet/vehiculos/documentos_vencidos/

        Retorna vehículos con documentos vencidos o próximos a vencer.
        Query params:
        - dias: días de anticipación (default: 30)
        """
        dias = int(request.query_params.get('dias', 30))
        fecha_limite = timezone.now().date() + timedelta(days=dias)

        queryset = self.get_queryset().filter(
            Q(fecha_soat__lte=fecha_limite) |
            Q(fecha_tecnomecanica__lte=fecha_limite)
        )

        vehiculos_alerta = []
        for vehiculo in queryset:
            alertas = []

            if vehiculo.fecha_soat:
                dias_soat = (vehiculo.fecha_soat - timezone.now().date()).days
                if dias_soat < 0:
                    alertas.append(f"SOAT vencido hace {abs(dias_soat)} días")
                elif dias_soat <= dias:
                    alertas.append(f"SOAT vence en {dias_soat} días")

            if vehiculo.fecha_tecnomecanica:
                dias_tecno = (vehiculo.fecha_tecnomecanica - timezone.now().date()).days
                if dias_tecno < 0:
                    alertas.append(f"Tecnomecánica vencida hace {abs(dias_tecno)} días")
                elif dias_tecno <= dias:
                    alertas.append(f"Tecnomecánica vence en {dias_tecno} días")

            if alertas:
                vehiculos_alerta.append({
                    'id': vehiculo.id,
                    'placa': vehiculo.placa,
                    'marca': vehiculo.marca,
                    'modelo': vehiculo.modelo,
                    'fecha_soat': vehiculo.fecha_soat,
                    'fecha_tecnomecanica': vehiculo.fecha_tecnomecanica,
                    'alertas': alertas,
                    'nivel_urgencia': 'CRITICO' if any('vencido' in a for a in alertas) else 'ADVERTENCIA'
                })

        return Response({
            'count': len(vehiculos_alerta),
            'dias_anticipacion': dias,
            'results': vehiculos_alerta
        })

    @action(detail=False, methods=['get'])
    def proximos_mantenimientos(self, request):
        """
        GET /api/fleet/vehiculos/proximos_mantenimientos/

        Retorna mantenimientos programados próximos.
        Query params:
        - dias: días de anticipación (default: 15)
        """
        dias = int(request.query_params.get('dias', 15))
        fecha_limite = timezone.now().date() + timedelta(days=dias)

        mantenimientos = MantenimientoVehiculo.objects.filter(
            vehiculo__empresa=self.request.user.empresa,
            vehiculo__is_active=True,
            estado__in=['PROGRAMADO', 'EN_EJECUCION'],
            fecha_programada__lte=fecha_limite
        ).select_related('vehiculo', 'responsable').order_by('fecha_programada')

        serializer = MantenimientoListSerializer(mantenimientos, many=True)

        return Response({
            'count': mantenimientos.count(),
            'dias_anticipacion': dias,
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        GET /api/fleet/vehiculos/dashboard/

        Retorna KPIs generales de la flota.
        """
        queryset = self.get_queryset()

        # Contadores básicos
        total_vehiculos = queryset.count()
        vehiculos_disponibles = queryset.filter(
            estado__disponible_para_ruta=True
        ).count()

        # Documentos vencidos
        hoy = timezone.now().date()
        documentos_vencidos = queryset.filter(
            Q(fecha_soat__lt=hoy) | Q(fecha_tecnomecanica__lt=hoy)
        ).count()

        # Próximos a vencer (30 días)
        fecha_30_dias = hoy + timedelta(days=30)
        documentos_por_vencer = queryset.filter(
            Q(fecha_soat__range=(hoy, fecha_30_dias)) |
            Q(fecha_tecnomecanica__range=(hoy, fecha_30_dias))
        ).count()

        # Mantenimientos pendientes
        mantenimientos_pendientes = MantenimientoVehiculo.objects.filter(
            vehiculo__empresa=self.request.user.empresa,
            vehiculo__is_active=True,
            estado__in=['PROGRAMADO', 'EN_EJECUCION']
        ).count()

        # Mantenimientos vencidos
        mantenimientos_vencidos = MantenimientoVehiculo.objects.filter(
            vehiculo__empresa=self.request.user.empresa,
            vehiculo__is_active=True,
            estado='PROGRAMADO',
            fecha_programada__lt=hoy
        ).count()

        # Por tipo de vehículo
        por_tipo = queryset.values(
            'tipo_vehiculo__nombre'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')

        # Por estado
        por_estado = queryset.values(
            'estado__nombre', 'estado__color'
        ).annotate(
            cantidad=Count('id')
        ).order_by('-cantidad')

        # Costos del mes
        primer_dia_mes = timezone.now().date().replace(day=1)
        costos_mes = CostoOperacion.objects.filter(
            vehiculo__empresa=self.request.user.empresa,
            fecha__gte=primer_dia_mes,
            is_active=True
        ).aggregate(
            total=Sum('valor'),
            combustible=Sum('valor', filter=Q(tipo_costo='COMBUSTIBLE')),
            mantenimiento_sum=Sum('valor', filter=Q(tipo_costo__in=['LAVADO', 'LUBRICANTES', 'NEUMATICOS']))
        )

        # Verificaciones PESV pendientes
        verificaciones_hoy = VerificacionTercero.objects.filter(
            vehiculo__empresa=self.request.user.empresa,
            fecha__date=hoy,
            is_active=True
        ).count()

        verificaciones_rechazadas = VerificacionTercero.objects.filter(
            vehiculo__empresa=self.request.user.empresa,
            resultado='RECHAZADO',
            fecha__date__gte=hoy - timedelta(days=7),
            is_active=True
        ).count()

        return Response({
            'totales': {
                'total_vehiculos': total_vehiculos,
                'vehiculos_disponibles': vehiculos_disponibles,
                'vehiculos_en_mantenimiento': queryset.filter(
                    estado__requiere_mantenimiento=True
                ).count(),
            },
            'documentacion': {
                'documentos_vencidos': documentos_vencidos,
                'documentos_por_vencer_30_dias': documentos_por_vencer,
            },
            'mantenimientos': {
                'pendientes': mantenimientos_pendientes,
                'vencidos': mantenimientos_vencidos,
            },
            'distribucion': {
                'por_tipo': list(por_tipo),
                'por_estado': list(por_estado),
            },
            'costos_mes_actual': {
                'total': costos_mes['total'] or Decimal('0'),
                'combustible': costos_mes['combustible'] or Decimal('0'),
                'otros': costos_mes['mantenimiento_sum'] or Decimal('0'),
            },
            'pesv': {
                'verificaciones_hoy': verificaciones_hoy,
                'verificaciones_rechazadas_semana': verificaciones_rechazadas,
            }
        })


# ==============================================================================
# VIEWSETS DE DOCUMENTOS Y LEGALES
# ==============================================================================

class DocumentoVehiculoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Documento de Vehículo.
    """
    queryset = DocumentoVehiculo.objects.select_related(
        'vehiculo', 'created_by'
    ).filter(is_active=True)
    serializer_class = DocumentoVehiculoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['vehiculo', 'tipo_documento', 'is_active']
    search_fields = ['vehiculo__placa', 'numero_documento', 'entidad_emisora']
    ordering_fields = ['fecha_vencimiento', 'created_at']
    ordering = ['-fecha_vencimiento']

    def get_queryset(self):
        """Filtra por empresa."""
        queryset = super().get_queryset()
        if self.request.user.empresa:
            queryset = queryset.filter(empresa=self.request.user.empresa)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.empresa,
            created_by=self.request.user
        )


class HojaVidaVehiculoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Hoja de Vida de Vehículo.
    """
    queryset = HojaVidaVehiculo.objects.select_related(
        'vehiculo', 'registrado_por'
    ).filter(is_active=True)
    serializer_class = HojaVidaVehiculoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['vehiculo', 'tipo_evento', 'is_active']
    search_fields = ['vehiculo__placa', 'descripcion', 'proveedor']
    ordering_fields = ['fecha', 'created_at']
    ordering = ['-fecha', '-created_at']

    def get_queryset(self):
        """Filtra por empresa."""
        queryset = super().get_queryset()
        if self.request.user.empresa:
            queryset = queryset.filter(empresa=self.request.user.empresa)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.empresa,
            created_by=self.request.user,
            registrado_por=self.request.user
        )


# ==============================================================================
# VIEWSETS DE MANTENIMIENTO
# ==============================================================================

class MantenimientoVehiculoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Mantenimiento de Vehículo.
    """
    queryset = MantenimientoVehiculo.objects.select_related(
        'vehiculo', 'responsable', 'created_by'
    ).filter(is_active=True)
    serializer_class = MantenimientoVehiculoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['vehiculo', 'tipo', 'estado', 'is_active']
    search_fields = ['vehiculo__placa', 'descripcion', 'proveedor_nombre']
    ordering_fields = ['fecha_programada', 'fecha_ejecucion', 'created_at']
    ordering = ['-fecha_programada']

    def get_serializer_class(self):
        if self.action == 'list':
            return MantenimientoListSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        """Filtra por empresa."""
        queryset = super().get_queryset()
        if self.request.user.empresa:
            queryset = queryset.filter(empresa=self.request.user.empresa)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.empresa,
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


# ==============================================================================
# VIEWSETS DE COSTOS
# ==============================================================================

class CostoOperacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Costo de Operación.
    """
    queryset = CostoOperacion.objects.select_related(
        'vehiculo', 'registrado_por'
    ).filter(is_active=True)
    serializer_class = CostoOperacionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['vehiculo', 'tipo_costo', 'is_active']
    search_fields = ['vehiculo__placa', 'factura_numero', 'observaciones']
    ordering_fields = ['fecha', 'valor', 'created_at']
    ordering = ['-fecha']

    def get_serializer_class(self):
        if self.action == 'list':
            return CostoOperacionListSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        """Filtra por empresa."""
        queryset = super().get_queryset()
        if self.request.user.empresa:
            queryset = queryset.filter(empresa=self.request.user.empresa)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.empresa,
            created_by=self.request.user,
            registrado_por=self.request.user
        )


# ==============================================================================
# VIEWSETS PESV - VERIFICACIONES
# ==============================================================================

class VerificacionTerceroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Verificación de Tercero (PESV).

    Acciones especiales:
    - GET /api/fleet/verificaciones/pendientes/ - Verificaciones pendientes hoy
    - GET /api/fleet/verificaciones/no_conformes/ - Con resultado rechazado
    """
    queryset = VerificacionTercero.objects.select_related(
        'vehiculo', 'inspector', 'created_by'
    ).filter(is_active=True)
    serializer_class = VerificacionTerceroSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['vehiculo', 'tipo', 'resultado', 'is_active']
    search_fields = ['vehiculo__placa', 'inspector_externo', 'observaciones_generales']
    ordering_fields = ['fecha', 'created_at']
    ordering = ['-fecha']

    def get_serializer_class(self):
        if self.action == 'list':
            return VerificacionListSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        """Filtra por empresa."""
        queryset = super().get_queryset()
        if self.request.user.empresa:
            queryset = queryset.filter(empresa=self.request.user.empresa)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.request.user.empresa,
            created_by=self.request.user
        )

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """
        GET /api/fleet/verificaciones/pendientes/

        Retorna verificaciones preoperacionales pendientes para hoy.
        Considera que cada vehículo activo debe tener al menos una
        verificación diaria si fue utilizado.
        """
        hoy = timezone.now().date()

        # Obtener vehículos activos
        vehiculos_activos = Vehiculo.objects.filter(
            empresa=request.user.empresa,
            is_active=True,
            estado__disponible_para_ruta=True
        )

        # Obtener vehículos que ya tienen verificación hoy
        con_verificacion = VerificacionTercero.objects.filter(
            empresa=request.user.empresa,
            fecha__date=hoy,
            tipo='PREOPERACIONAL_DIARIA',
            is_active=True
        ).values_list('vehiculo_id', flat=True)

        # Vehículos sin verificación hoy
        pendientes = vehiculos_activos.exclude(id__in=con_verificacion)

        vehiculos_data = [{
            'id': v.id,
            'placa': v.placa,
            'marca': v.marca,
            'modelo': v.modelo,
            'tipo_nombre': v.tipo_vehiculo.nombre,
            'km_actual': v.km_actual,
        } for v in pendientes]

        return Response({
            'fecha': hoy,
            'count': pendientes.count(),
            'results': vehiculos_data
        })

    @action(detail=False, methods=['get'])
    def no_conformes(self, request):
        """
        GET /api/fleet/verificaciones/no_conformes/

        Retorna verificaciones con resultado RECHAZADO.
        Query params:
        - dias: días hacia atrás (default: 7)
        """
        dias = int(request.query_params.get('dias', 7))
        fecha_desde = timezone.now().date() - timedelta(days=dias)

        queryset = self.get_queryset().filter(
            resultado='RECHAZADO',
            fecha__date__gte=fecha_desde
        ).order_by('-fecha')

        serializer = self.get_serializer(queryset, many=True)

        return Response({
            'count': queryset.count(),
            'dias_consultados': dias,
            'results': serializer.data
        })
