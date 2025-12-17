# -*- coding: utf-8 -*-
"""
Views del módulo Recepciones - Sistema de Gestión Grasas y Huesos del Norte

Este módulo gestiona el proceso de recepción de materia prima en planta.
Soporta DOS tipos de origen:

1. UNIDAD_INTERNA (Econorte):
   - Iniciar recepción: Agrupa recolecciones de un recolector
   - Registrar pesaje: Registra peso real en báscula
   - Confirmar: Aplica prorrateo de merma y actualiza recolecciones
   - Pasar a STANDBY: Material listo para siguiente proceso

2. PROVEEDOR_EXTERNO:
   - Iniciar recepción: Selecciona proveedor y tipo materia prima
   - Registrar prueba acidez: Para ACU y SEBO_PROCESADO
   - Registrar pesaje: Peso interno o externo certificado
   - Confirmar y pasar a STANDBY

Flujos comunes:
- Cancelar: Cancela recepción en caso de error
- Estadísticas: Métricas por origen, estado, periodo
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Count, Q
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError
from datetime import timedelta, datetime
from decimal import Decimal

from .models import RecepcionMateriaPrima, RecepcionDetalle
from .serializers import (
    RecepcionListSerializer,
    RecepcionDetailSerializer,
    IniciarRecepcionSerializer,
    IniciarRecepcionProveedorExternoSerializer,
    RegistrarPesajeSerializer,
    ConfirmarRecepcionSerializer,
    CancelarRecepcionSerializer,
    AsociarPruebaAcidezSerializer,
    PasarStandbySerializer,
    RecepcionEstadisticasSerializer,
    RecoleccionPendienteSerializer,
)
from .permissions import (
    PuedeVerRecepciones,
    PuedeIniciarRecepcion,
    PuedeRegistrarPesaje,
    PuedeConfirmarRecepcion,
    PuedeCancelarRecepcion,
    PuedeVerEstadisticas,
)


class RecepcionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Recepciones de Materia Prima
    Soporta DOS tipos de origen: UNIDAD_INTERNA y PROVEEDOR_EXTERNO

    Endpoints UNIDAD_INTERNA (Econorte):
    - GET    /api/recepciones/                          - Lista de recepciones
    - GET    /api/recepciones/{id}/                     - Detalle de recepción
    - POST   /api/recepciones/iniciar/                  - Iniciar recepción (agrupa recolecciones)
    - POST   /api/recepciones/{id}/registrar-pesaje/    - Registrar peso en báscula
    - POST   /api/recepciones/{id}/confirmar/           - Confirmar (prorrateo merma)
    - POST   /api/recepciones/{id}/pasar-standby/       - Pasar a STANDBY
    - POST   /api/recepciones/{id}/cancelar/            - Cancelar recepción
    - GET    /api/recepciones/pendientes/               - Recolecciones sin recepción

    Endpoints PROVEEDOR_EXTERNO:
    - POST   /api/recepciones/iniciar-proveedor/        - Iniciar recepción proveedor externo
    - POST   /api/recepciones/{id}/asociar-acidez/      - Asociar/crear prueba de acidez
    - POST   /api/recepciones/{id}/registrar-pesaje/    - Registrar peso (interno o externo)
    - POST   /api/recepciones/{id}/confirmar/           - Confirmar recepción
    - POST   /api/recepciones/{id}/pasar-standby/       - Pasar a STANDBY
    - GET    /api/recepciones/proveedores-disponibles/  - Proveedores de materia prima

    Endpoints comunes:
    - GET    /api/recepciones/estadisticas/             - Estadísticas de recepciones
    - GET    /api/recepciones/tipos-materia-prima/      - Lista de tipos de materia prima

    Permisos por acción:
    - list/retrieve: PuedeVerRecepciones (recolector sus propias, líder logística+)
    - iniciar/iniciar_proveedor: PuedeIniciarRecepcion (líder logística, gerente)
    - registrar_pesaje: PuedeRegistrarPesaje (líder logística, gerente)
    - confirmar: PuedeConfirmarRecepcion (líder logística, gerente)
    - cancelar: PuedeCancelarRecepcion (gerente, superadmin)
    - pendientes: PuedeIniciarRecepcion (líder logística, gerente)
    - estadisticas: PuedeVerEstadisticas (líderes, gerente)
    """

    serializer_class = RecepcionListSerializer

    def get_permissions(self):
        """
        Retorna los permisos según la acción
        """
        if self.action in ['iniciar', 'iniciar_proveedor']:
            permission_classes = [PuedeIniciarRecepcion]
        elif self.action in ['registrar_pesaje', 'asociar_acidez']:
            permission_classes = [PuedeRegistrarPesaje]
        elif self.action in ['confirmar', 'pasar_standby']:
            permission_classes = [PuedeConfirmarRecepcion]
        elif self.action == 'cancelar':
            permission_classes = [PuedeCancelarRecepcion]
        elif self.action == 'estadisticas':
            permission_classes = [PuedeVerEstadisticas]
        elif self.action in ['pendientes', 'proveedores_disponibles', 'tipos_materia_prima']:
            permission_classes = [PuedeIniciarRecepcion]
        elif self.action in ['list', 'retrieve', 'por_recolector']:
            permission_classes = [PuedeVerRecepciones]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filtra recepciones según el rol del usuario:
        - Recolector: Solo sus recepciones (como recolector)
        - Líder Logística: Todas las recepciones
        - Gerente/SuperAdmin: Todas las recepciones
        """
        user = self.request.user
        queryset = RecepcionMateriaPrima.objects.select_related(
            'recolector', 'proveedor_externo', 'recibido_por',
            'created_by', 'cancelado_por', 'prueba_acidez'
        ).prefetch_related(
            'detalles__recoleccion__ecoaliado'
        ).filter(deleted_at__isnull=True)

        # Filtrar por rol
        if user.cargo:
            cargo_code = user.cargo.code
            if cargo_code == 'recolector_econorte':
                # Recolector solo ve sus recepciones (UNIDAD_INTERNA)
                queryset = queryset.filter(
                    origen_recepcion='UNIDAD_INTERNA',
                    recolector=user
                )

        # Aplicar filtros de query params
        queryset = self._aplicar_filtros(queryset)

        return queryset.order_by('-fecha_recepcion')

    def _aplicar_filtros(self, queryset):
        """Aplica filtros desde query params"""
        params = self.request.query_params

        # Filtro por origen
        origen = params.get('origen')
        if origen:
            queryset = queryset.filter(origen_recepcion=origen)

        # Filtro por tipo de materia prima
        tipo_materia = params.get('tipo_materia_prima')
        if tipo_materia:
            queryset = queryset.filter(tipo_materia_prima=tipo_materia)

        # Filtro por recolector (UNIDAD_INTERNA)
        recolector_id = params.get('recolector')
        if recolector_id:
            queryset = queryset.filter(recolector_id=recolector_id)

        # Filtro por proveedor externo
        proveedor_id = params.get('proveedor')
        if proveedor_id:
            queryset = queryset.filter(proveedor_externo_id=proveedor_id)

        # Filtro por estado
        estado = params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        # Filtro por fecha desde
        fecha_desde = params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_recepcion__date__gte=fecha_desde)

        # Filtro por fecha hasta
        fecha_hasta = params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_recepcion__date__lte=fecha_hasta)

        # Búsqueda general
        search = params.get('search')
        if search:
            queryset = queryset.filter(
                Q(codigo_recepcion__icontains=search) |
                Q(recolector__first_name__icontains=search) |
                Q(recolector__last_name__icontains=search) |
                Q(proveedor_externo__nombre_comercial__icontains=search) |
                Q(proveedor_externo__razon_social__icontains=search) |
                Q(numero_ticket_bascula__icontains=search)
            )

        return queryset

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'retrieve':
            return RecepcionDetailSerializer
        if self.action == 'iniciar':
            return IniciarRecepcionSerializer
        if self.action == 'iniciar_proveedor':
            return IniciarRecepcionProveedorExternoSerializer
        if self.action == 'registrar_pesaje':
            return RegistrarPesajeSerializer
        if self.action == 'confirmar':
            return ConfirmarRecepcionSerializer
        if self.action == 'cancelar':
            return CancelarRecepcionSerializer
        if self.action == 'asociar_acidez':
            return AsociarPruebaAcidezSerializer
        if self.action == 'pasar_standby':
            return PasarStandbySerializer
        return RecepcionListSerializer

    def create(self, request, *args, **kwargs):
        """
        NO usar este endpoint directamente.
        Usar POST /api/recepciones/iniciar/ para iniciar recepciones.
        """
        return Response(
            {'detail': 'Usar POST /api/recepciones/iniciar/ para iniciar recepciones'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def iniciar(self, request):
        """
        Inicia una nueva recepción de materia prima

        Proceso:
        1. Valida recolector y recolecciones seleccionadas
        2. Crea RecepcionMateriaPrima con estado INICIADA
        3. Crea RecepcionDetalle por cada recolección
        4. Calcula peso_esperado_kg y valor_esperado_total
        5. Marca recolecciones como EN_RECEPCION

        Payload:
        {
            "recolector_id": 123,
            "recolecciones_ids": [456, 457, 458],
            "observaciones_recepcion": "Material en buen estado"
        }

        Response:
        - 201: Recepción creada exitosamente
        - 400: Error de validación
        - 403: Sin permisos
        """
        serializer = IniciarRecepcionSerializer(
            data=request.data,
            context={
                'request': request,
                'usuario': request.user,
            }
        )

        if serializer.is_valid():
            recepcion = serializer.save()

            return Response({
                'message': 'Recepción iniciada exitosamente',
                'recepcion': RecepcionDetailSerializer(recepcion).data,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='registrar-pesaje')
    @transaction.atomic
    def registrar_pesaje(self, request, pk=None):
        """
        Registra el peso en báscula para una recepción INICIADA

        Proceso:
        1. Valida que recepción esté en estado INICIADA
        2. Registra peso_real_kg y fecha_pesaje
        3. Calcula merma_kg y porcentaje_merma
        4. Cambia estado a PESADA

        Payload:
        {
            "peso_bascula_kg": 1234.50,
            "numero_ticket_bascula": "TICKET-001",
            "observaciones_merma": "Merma normal por evaporación"
        }

        Response:
        - 200: Pesaje registrado exitosamente
        - 400: Error de validación o estado incorrecto
        - 403: Sin permisos
        - 404: Recepción no encontrada
        """
        recepcion = self.get_object()

        # Verificar que puede pesar
        if not recepcion.puede_pesar:
            return Response(
                {
                    'detail': f'La recepción no puede ser pesada. Estado actual: {recepcion.get_estado_display()}',
                    'estado_actual': recepcion.estado,
                    'puede_pesar': False
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = RegistrarPesajeSerializer(
            recepcion,
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            try:
                recepcion = serializer.save()

                return Response({
                    'message': 'Pesaje registrado exitosamente',
                    'recepcion': RecepcionDetailSerializer(recepcion).data,
                    'merma': {
                        'merma_kg': float(recepcion.merma_kg),
                        'porcentaje_merma': float(recepcion.porcentaje_merma),
                        'peso_esperado_kg': float(recepcion.peso_esperado_kg),
                        'peso_real_kg': float(recepcion.peso_real_kg),
                    }
                }, status=status.HTTP_200_OK)

            except DjangoValidationError as e:
                return Response(
                    {'detail': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def confirmar(self, request, pk=None):
        """
        Confirma la recepción y aplica prorrateo de merma

        Proceso:
        1. Valida que recepción esté en estado PESADA
        2. Calcula factor de merma = peso_real / peso_esperado
        3. Aplica prorrateo a cada RecepcionDetalle:
           - peso_real = peso_esperado × factor_merma
           - merma_kg = peso_esperado - peso_real
           - precio_real_kg = valor_esperado / peso_real
           - valor_real = valor_esperado (se mantiene)
        4. Actualiza recolecciones asociadas:
           - estado = RECIBIDA
           - peso_recibido_kg = peso_real
           - fecha_recepcion_planta = ahora
        5. Cambia estado recepción a CONFIRMADA
        6. Calcula valor_real_total

        Payload (opcional):
        {
            "tanque_destino": "TANQUE-ACU-01"
        }

        Response:
        - 200: Recepción confirmada exitosamente
        - 400: Error de validación o estado incorrecto
        - 403: Sin permisos
        - 404: Recepción no encontrada
        """
        recepcion = self.get_object()

        # Verificar que puede confirmar
        if not recepcion.puede_confirmar:
            return Response(
                {
                    'detail': f'La recepción no puede ser confirmada. Estado actual: {recepcion.get_estado_display()}',
                    'estado_actual': recepcion.estado,
                    'puede_confirmar': False
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ConfirmarRecepcionSerializer(
            recepcion,
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            try:
                recepcion = serializer.save()

                return Response({
                    'message': 'Recepción confirmada exitosamente',
                    'recepcion': RecepcionDetailSerializer(recepcion).data,
                    'resumen_prorrateo': {
                        'total_recolecciones': recepcion.cantidad_recolecciones,
                        'peso_esperado_total_kg': float(recepcion.peso_esperado_kg),
                        'peso_real_total_kg': float(recepcion.peso_real_kg),
                        'merma_total_kg': float(recepcion.merma_kg),
                        'porcentaje_merma': float(recepcion.porcentaje_merma),
                        'valor_esperado_total': float(recepcion.valor_esperado_total),
                        'valor_real_total': float(recepcion.valor_real_total),
                    }
                }, status=status.HTTP_200_OK)

            except DjangoValidationError as e:
                return Response(
                    {'detail': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def cancelar(self, request, pk=None):
        """
        Cancela una recepción

        Solo se pueden cancelar recepciones en estado INICIADA o PESADA.
        Recepciones CONFIRMADAS no pueden cancelarse.

        Proceso:
        1. Valida que recepción puede cancelarse
        2. Cambia estado a CANCELADA
        3. Registra motivo, usuario y fecha de cancelación
        4. Revierte estado de recolecciones a COMPLETADA

        Payload:
        {
            "motivo_cancelacion": "Error en el pesaje"
        }

        Response:
        - 200: Recepción cancelada exitosamente
        - 400: Error de validación o estado incorrecto
        - 403: Sin permisos
        - 404: Recepción no encontrada
        """
        recepcion = self.get_object()

        # Verificar que puede cancelar
        if not recepcion.puede_cancelar:
            return Response(
                {
                    'detail': f'La recepción no puede ser cancelada. Estado actual: {recepcion.get_estado_display()}',
                    'estado_actual': recepcion.estado,
                    'puede_cancelar': False
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CancelarRecepcionSerializer(
            recepcion,
            data=request.data,
            context={'request': request, 'usuario': request.user}
        )

        if serializer.is_valid():
            try:
                recepcion = serializer.save()

                return Response({
                    'message': 'Recepción cancelada exitosamente',
                    'recepcion': RecepcionDetailSerializer(recepcion).data,
                }, status=status.HTTP_200_OK)

            except DjangoValidationError as e:
                return Response(
                    {'detail': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """
        Obtiene recolecciones completadas sin recepción (disponibles para recepcionar)

        Filtra recolecciones que:
        - Estado = COMPLETADA (recolectadas pero no recibidas en planta)
        - No tienen recepción asociada (detalle_recepcion = None)
        - deleted_at = null

        Query params opcionales:
        - recolector: ID del recolector (para filtrar por recolector específico)
        - fecha_desde: Fecha inicial (YYYY-MM-DD)
        - fecha_hasta: Fecha final (YYYY-MM-DD)

        Response:
        {
            "count": 15,
            "recolecciones": [
                {
                    "id": 123,
                    "codigo_voucher": "REC-20241204-0001",
                    "ecoaliado": {...},
                    "recolector": {...},
                    "fecha_recoleccion": "2024-12-04T10:30:00Z",
                    "cantidad_kg": 450.50,
                    "precio_kg": 1500.00,
                    "valor_total": 675750.00
                },
                ...
            ]
        }
        """
        from apps.recolecciones.models import Recoleccion

        # Base queryset: recolecciones existentes sin recepción activa
        # Las recolecciones se crean cuando se completan, no tienen campo 'estado'
        queryset = Recoleccion.objects.select_related(
            'ecoaliado', 'recolector', 'programacion'
        ).filter(
            deleted_at__isnull=True
        ).exclude(
            # Excluir recolecciones que ya tienen recepción activa (no cancelada)
            detalle_recepcion__recepcion__estado__in=['INICIADA', 'PESADA', 'CONFIRMADA', 'STANDBY']
        )

        # Aplicar filtros opcionales
        recolector_id = request.query_params.get('recolector')
        if recolector_id:
            queryset = queryset.filter(recolector_id=recolector_id)

        fecha_desde = request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_recoleccion__date__gte=fecha_desde)

        fecha_hasta = request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_recoleccion__date__lte=fecha_hasta)

        # Ordenar por recolector y fecha
        queryset = queryset.order_by('recolector', '-fecha_recoleccion')

        # Serializar
        serializer = RecoleccionPendienteSerializer(queryset, many=True)

        return Response({
            'count': queryset.count(),
            'recolecciones': serializer.data,
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtiene estadísticas de recepciones

        Query params opcionales:
        - fecha_desde: Fecha inicial (YYYY-MM-DD)
        - fecha_hasta: Fecha final (YYYY-MM-DD)
        - estado: Estado de recepciones (INICIADA, PESADA, CONFIRMADA, CANCELADA)

        Response:
        {
            "total_recepciones": 50,
            "recepciones_por_estado": {
                "INICIADA": 2,
                "PESADA": 3,
                "CONFIRMADA": 43,
                "CANCELADA": 2
            },
            "total_kg_esperados": 25000.00,
            "total_kg_recibidos": 24500.00,
            "merma_total_kg": 500.00,
            "porcentaje_merma_promedio": 2.00,
            "total_recolecciones_recibidas": 150,
            "total_valor_esperado": 37500000.00,
            "total_valor_real": 37500000.00,
            "recepciones_hoy": 3,
            "recepciones_semana": 12,
            "recepciones_mes": 50
        }
        """
        queryset = self.get_queryset()

        # Fechas para estadísticas temporales
        hoy = timezone.now().date()
        inicio_semana = hoy - timedelta(days=hoy.weekday())
        inicio_mes = hoy.replace(day=1)

        # Estadísticas generales
        stats = queryset.aggregate(
            total_recepciones=Count('id'),
            total_kg_esperados=Sum('peso_esperado_kg'),
            total_kg_recibidos=Sum('peso_real_kg'),
            merma_total_kg=Sum('merma_kg'),
            porcentaje_merma_promedio=Avg('porcentaje_merma'),
            total_recolecciones_recibidas=Sum('cantidad_recolecciones'),
            total_valor_esperado=Sum('valor_esperado_total'),
            total_valor_real=Sum('valor_real_total'),
        )

        # Recepciones por estado
        recepciones_por_estado = {}
        for estado_code, estado_name in RecepcionMateriaPrima.ESTADO_CHOICES:
            recepciones_por_estado[estado_code] = queryset.filter(
                estado=estado_code
            ).count()

        stats['recepciones_por_estado'] = recepciones_por_estado

        # Recepciones por periodo
        stats['recepciones_hoy'] = queryset.filter(
            fecha_recepcion__date=hoy
        ).count()

        stats['recepciones_semana'] = queryset.filter(
            fecha_recepcion__date__gte=inicio_semana
        ).count()

        stats['recepciones_mes'] = queryset.filter(
            fecha_recepcion__date__gte=inicio_mes
        ).count()

        # Manejar valores nulos
        for key in stats:
            if key == 'recepciones_por_estado':
                continue
            if stats[key] is None:
                stats[key] = Decimal('0') if isinstance(stats.get(key), Decimal) or 'kg' in key or 'valor' in key or 'promedio' in key else 0

        serializer = RecepcionEstadisticasSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-recolector/(?P<recolector_id>[^/.]+)')
    def por_recolector(self, request, recolector_id=None):
        """
        Obtiene recepciones de un recolector específico

        Response:
        - 200: Lista de recepciones del recolector
        """
        queryset = self.get_queryset().filter(recolector_id=recolector_id)

        # Paginación
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        offset = (page - 1) * page_size

        total = queryset.count()
        recepciones = queryset[offset:offset + page_size]

        serializer = RecepcionListSerializer(recepciones, many=True)

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': serializer.data,
        })

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete de recepción (solo gerente/superadmin)

        Solo se pueden eliminar recepciones en estado INICIADA o CANCELADA.
        Recepciones CONFIRMADAS no pueden eliminarse.
        """
        if not request.user.cargo or request.user.cargo.code not in ['gerente', 'superadmin']:
            return Response(
                {'detail': 'Solo gerentes pueden eliminar recepciones'},
                status=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()

        if instance.estado == 'CONFIRMADA':
            return Response(
                {'detail': 'No se puede eliminar una recepción confirmada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            instance.soft_delete()
            return Response(
                {'message': 'Recepción eliminada exitosamente'},
                status=status.HTTP_204_NO_CONTENT
            )
        except DjangoValidationError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    # ============ ENDPOINTS PARA PROVEEDOR EXTERNO ============

    @action(detail=False, methods=['post'], url_path='iniciar-proveedor')
    @transaction.atomic
    def iniciar_proveedor(self, request):
        """
        Inicia una nueva recepción de materia prima de PROVEEDOR_EXTERNO

        Proceso:
        1. Valida proveedor externo y tipo de materia prima
        2. Crea RecepcionMateriaPrima con estado INICIADA
        3. Si es ACU o SEBO_PROCESADO, puede requerir prueba de acidez antes de pesar

        Payload:
        {
            "proveedor_id": 123,
            "tipo_materia_prima": "HUESO_CRUDO",
            "peso_esperado_kg": 1500.00,  // O usar peso_externo
            "usa_peso_externo": false,
            "peso_externo_kg": null,
            "numero_certificado_peso": null,
            "observaciones_recepcion": "Material en buen estado"
        }

        Response:
        - 201: Recepción creada exitosamente
        - 400: Error de validación
        - 403: Sin permisos
        """
        serializer = IniciarRecepcionProveedorExternoSerializer(
            data=request.data,
            context={
                'request': request,
                'usuario': request.user,
            }
        )

        if serializer.is_valid():
            recepcion = serializer.save()

            return Response({
                'message': 'Recepción de proveedor externo iniciada exitosamente',
                'recepcion': RecepcionDetailSerializer(recepcion).data,
                'requiere_prueba_acidez': recepcion.requiere_prueba_acidez,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='asociar-acidez')
    @transaction.atomic
    def asociar_acidez(self, request, pk=None):
        """
        Asocia o crea una prueba de acidez para una recepción

        Solo aplica para recepciones de ACU o SEBO_PROCESADO.
        Debe hacerse antes del pesaje.

        Payload para crear nueva prueba:
        {
            "crear_prueba": true,
            "valor_acidez": 4.5,
            "cantidad_kg": 1500.00,
            "observaciones": "Prueba realizada en laboratorio"
        }

        Payload para asociar prueba existente:
        {
            "prueba_acidez_id": 123
        }

        Response:
        - 200: Prueba asociada exitosamente
        - 400: Error de validación o recepción no requiere acidez
        """
        recepcion = self.get_object()

        if not recepcion.requiere_prueba_acidez:
            return Response(
                {'detail': 'Esta recepción no requiere prueba de acidez'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if recepcion.tiene_prueba_acidez:
            return Response(
                {'detail': 'La recepción ya tiene una prueba de acidez asociada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AsociarPruebaAcidezSerializer(
            recepcion,
            data=request.data,
            context={
                'request': request,
                'usuario': request.user,
                'recepcion': recepcion,
            }
        )

        if serializer.is_valid():
            try:
                recepcion = serializer.save()

                return Response({
                    'message': 'Prueba de acidez asociada exitosamente',
                    'recepcion': RecepcionDetailSerializer(recepcion).data,
                    'puede_pesar': recepcion.puede_pesar,
                }, status=status.HTTP_200_OK)

            except DjangoValidationError as e:
                return Response(
                    {'detail': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='pasar-standby')
    @transaction.atomic
    def pasar_standby(self, request, pk=None):
        """
        Pasa una recepción CONFIRMADA a estado STANDBY

        El estado STANDBY indica que el producto está listo para el siguiente proceso
        (producción, almacenamiento en lote, etc.)

        Payload (opcional):
        {
            "observaciones": "Material almacenado en tanque 3"
        }

        Response:
        - 200: Recepción pasada a STANDBY exitosamente
        - 400: Error de validación o estado incorrecto
        """
        recepcion = self.get_object()

        if not recepcion.puede_pasar_standby:
            return Response(
                {
                    'detail': f'La recepción no puede pasar a STANDBY. Estado actual: {recepcion.get_estado_display()}',
                    'estado_actual': recepcion.estado,
                    'puede_pasar_standby': False
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = PasarStandbySerializer(
            recepcion,
            data=request.data,
            context={'request': request, 'recepcion': recepcion}
        )

        if serializer.is_valid():
            try:
                recepcion = serializer.save()

                return Response({
                    'message': 'Recepción pasada a STANDBY exitosamente',
                    'recepcion': RecepcionDetailSerializer(recepcion).data,
                }, status=status.HTTP_200_OK)

            except DjangoValidationError as e:
                return Response(
                    {'detail': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='proveedores-disponibles')
    def proveedores_disponibles(self, request):
        """
        Lista de proveedores de materia prima disponibles para recepción

        Response:
        {
            "count": 10,
            "proveedores": [
                {
                    "id": 1,
                    "codigo_interno": "MP-0001",
                    "nombre_comercial": "Proveedor ABC",
                    "subtipo_materia": ["HUESO", "SEBO"],
                    "modalidad_logistica": "ENTREGA_PLANTA"
                },
                ...
            ]
        }
        """
        from apps.proveedores.models import Proveedor

        proveedores = Proveedor.objects.filter(
            tipo_proveedor='MATERIA_PRIMA_EXTERNO',
            is_active=True,
            deleted_at__isnull=True
        ).values(
            'id', 'codigo_interno', 'nombre_comercial',
            'razon_social', 'subtipo_materia', 'modalidad_logistica'
        ).order_by('nombre_comercial')

        return Response({
            'count': proveedores.count(),
            'proveedores': list(proveedores),
        })

    @action(detail=False, methods=['get'], url_path='tipos-materia-prima')
    def tipos_materia_prima(self, request):
        """
        Lista de tipos de materia prima disponibles

        Response:
        {
            "tipos": [
                {"codigo": "HUESO_CRUDO", "nombre": "Hueso Crudo", "categoria": "HUESO"},
                {"codigo": "ACU", "nombre": "Aceite de Cocina Usado", "categoria": "OTROS"},
                ...
            ]
        }
        """
        from apps.proveedores.constants import (
            CODIGO_MATERIA_PRIMA_CHOICES,
            CODIGO_A_TIPO_PRINCIPAL
        )

        tipos = []
        for codigo, nombre in CODIGO_MATERIA_PRIMA_CHOICES:
            tipos.append({
                'codigo': codigo,
                'nombre': nombre,
                'categoria': CODIGO_A_TIPO_PRINCIPAL.get(codigo, 'OTROS'),
                'requiere_acidez': codigo in ['ACU', 'SEBO_PROCESADO',
                                               'SEBO_PROCESADO_A', 'SEBO_PROCESADO_B',
                                               'SEBO_PROCESADO_B1', 'SEBO_PROCESADO_B2',
                                               'SEBO_PROCESADO_B4', 'SEBO_PROCESADO_C']
            })

        return Response({
            'count': len(tipos),
            'tipos': tipos,
        })
