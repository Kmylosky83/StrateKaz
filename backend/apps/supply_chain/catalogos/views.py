"""
Views para catalogos - supply_chain
"""
from datetime import timedelta
from decimal import Decimal

from django.apps import apps as django_apps
from django.db.models import Count, F, Max, Q, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Almacen, RutaRecoleccion, TipoAlmacen
from .serializers import (
    AlertaDashboardSerializer,
    AlmacenDashboardHeaderSerializer,
    AlmacenSerializer,
    AlmacenStatsSerializer,
    InventarioPorProductoSerializer,
    KardexMovimientoSerializer,
    ResumenGeneralSerializer,
    RutaRecoleccionSerializer,
    TipoAlmacenSerializer,
)


class RutaRecoleccionViewSet(viewsets.ModelViewSet):
    """CRUD de Rutas de Recolección (H-SC-RUTA-02)."""

    queryset = RutaRecoleccion.objects.all()
    serializer_class = RutaRecoleccionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'modo_operacion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'created_at']
    ordering = ['codigo']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class TipoAlmacenViewSet(viewsets.ModelViewSet):
    """CRUD para Tipos de Almacén (silo / contenedor / pallet / piso)."""
    queryset = TipoAlmacen.objects.filter(is_active=True)
    serializer_class = TipoAlmacenSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['orden', 'nombre', 'codigo']


# ==============================================================================
# HELPERS — dashboard de almacén
# ==============================================================================

def _get_model_safe(app_label: str, model_name: str):
    """Lookup defensivo — retorna None si el modelo no está instalado.

    Necesario para dependencias en paralelo con otro agente que implementa
    el sistema de mediciones de QC (MedicionCalidad).
    """
    try:
        return django_apps.get_model(app_label, model_name)
    except LookupError:
        return None


def _calcular_calidad_promedio_por_producto(almacen_id: int) -> dict[int, list[dict]]:
    """
    Calcula promedios ponderados de QC agrupados por (producto, parámetro).

    La ponderación usa el peso_neto_kg de cada VoucherLineaMP que alimentó
    el Inventario del almacén. Ruta:
        MovimientoInventario(almacen_destino=almacen, origen_tipo='VoucherLineaMP')
          -> VoucherLineaMP(pk=origen_id)
            -> VoucherLineaMP.measurements  (aún no implementado)

    Retorna dict {producto_id: [ {parameter_code, parameter_name, weighted_avg,
    unit, dominant_range}, ... ]}.

    Si el modelo de mediciones (MedicionCalidad) no existe todavía, retorna
    dict vacío y el caller expone calidad_promedio=[] por producto.
    """
    MedicionCalidad = _get_model_safe('recepcion', 'MedicionCalidad')
    if MedicionCalidad is None:
        # Fallback a nombre alternativo potencial
        MedicionCalidad = _get_model_safe('supply_chain_recepcion', 'MedicionCalidad')
    if MedicionCalidad is None:
        return {}

    VoucherLineaMP = _get_model_safe('recepcion', 'VoucherLineaMP')
    if VoucherLineaMP is None:
        return {}

    # Confirmar que la relación 'measurements' existe en VoucherLineaMP.
    # Si el otro agente aún no la conectó, devolvemos dict vacío.
    if not hasattr(VoucherLineaMP, 'measurements'):
        return {}

    # IDs de líneas que alimentaron este almacén (desde MovimientoInventario)
    MovimientoInventario = django_apps.get_model(
        'almacenamiento', 'MovimientoInventario',
    )
    linea_ids = list(
        MovimientoInventario.objects.filter(
            almacen_destino_id=almacen_id,
            origen_tipo='VoucherLineaMP',
            origen_id__isnull=False,
        ).values_list('origen_id', flat=True).distinct()
    )
    if not linea_ids:
        return {}

    # Agregado ponderado por (producto, parámetro).
    # Accedemos a mediciones vía lookup inverso; estructura asumida:
    #   MedicionCalidad.linea (FK a VoucherLineaMP)
    #   MedicionCalidad.parameter (FK a ProductoEspecCalidadParametro)
    #   MedicionCalidad.measured_value (Decimal)
    # Si el agente paralelo usó otros nombres, este query-side falla
    # silenciosamente al primer AttributeError y devolvemos {}.
    try:
        qs = (
            MedicionCalidad.objects.filter(linea_id__in=linea_ids)
            .values(
                'linea__producto_id',
                'parameter_id',
                'parameter__nombre_parametro',
                'parameter__unidad',
            )
            .annotate(
                peso_total=Sum('linea__peso_neto_kg'),
                valor_ponderado=Sum(F('linea__peso_neto_kg') * F('measured_value')),
            )
        )
        rows = list(qs)
    except Exception:
        return {}

    resultado: dict[int, list[dict]] = {}
    for row in rows:
        producto_id = row['linea__producto_id']
        peso = row['peso_total'] or Decimal('0')
        if peso == 0:
            continue
        weighted_avg = (row['valor_ponderado'] or Decimal('0')) / peso
        entry = {
            'parameter_code': str(row['parameter_id']),
            'parameter_name': row.get('parameter__nombre_parametro') or '',
            'weighted_avg': weighted_avg.quantize(Decimal('0.0001')),
            'unit': row.get('parameter__unidad') or '',
            'dominant_range': None,
        }
        resultado.setdefault(producto_id, []).append(entry)
    return resultado


class AlmacenViewSet(viewsets.ModelViewSet):
    """CRUD para Almacenes.

    Filtros extra (H-SC-07):
    - ?para_recepcion=1: filtra almacenes habilitados para recepción en la
      sede del operador (request.user.sede_asignada). Si el user no tiene
      sede_asignada, cae al fallback de todos los permite_recepcion activos.
    - ?sede=<id>: filtra almacenes de una sede específica (usado por UI de
      "almacenes de esta sede").

    Actions extra (lectura agregada — dashboard operativo):
    - GET /almacenes/<id>/dashboard/         — stats + inventario + alertas.
    - GET /almacenes/<id>/kardex/            — histórico de movimientos.
    - GET /almacenes/resumen-general/        — stats globales del tenant.
    """
    queryset = Almacen.objects.all()
    serializer_class = AlmacenSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'es_principal', 'permite_despacho', 'permite_recepcion',
        'tipo_almacen', 'sede', 'is_active',
    ]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre']

    def get_queryset(self):
        qs = super().get_queryset().select_related(
            'tipo_almacen', 'sede', 'created_by', 'updated_by',
        )

        params = self.request.query_params

        # ?para_recepcion=1 → filtrar por sede del operador + permite_recepcion.
        if params.get('para_recepcion') in ('1', 'true', 'True'):
            user = self.request.user
            sede_usuario = getattr(user, 'sede_asignada', None)
            qs = qs.filter(permite_recepcion=True, is_active=True)
            if sede_usuario is not None:
                qs = qs.filter(sede=sede_usuario)
            # Si el user no tiene sede_asignada, cae al fallback de todos
            # los permite_recepcion activos (ya aplicado arriba).

        # ?sede=<id> ya lo resuelve filterset_fields, no-op aquí.
        return qs

    # ==========================================================================
    # ACTIONS — dashboard (lectura agregada)
    # ==========================================================================

    @action(detail=True, methods=['get'], url_path='dashboard')
    def dashboard(self, request, pk=None):
        """Dashboard operativo del almacén: stats + inventario + alertas."""
        almacen = self.get_object()

        # Imports tardíos: evitan acoplar catalogos con almacenamiento al cargar.
        from apps.supply_chain.almacenamiento.models import (
            AlertaStock,
            Inventario,
            MovimientoInventario,
        )
        from apps.supply_chain.recepcion.models import VoucherRecepcion

        # ── Stats ────────────────────────────────────────────────────────
        inv_qs = Inventario.objects.filter(almacen=almacen)
        total_cantidad = inv_qs.aggregate(
            total=Sum('cantidad_disponible'),
        )['total'] or Decimal('0')

        productos_distintos = inv_qs.values('producto_id').distinct().count()

        capacidad = almacen.capacidad_maxima or Decimal('0')
        if capacidad > 0:
            ocupacion_pct = (total_cantidad / capacidad) * Decimal('100')
            ocupacion_pct = ocupacion_pct.quantize(Decimal('0.01'))
        else:
            ocupacion_pct = Decimal('0.00')

        hace_30d = timezone.now() - timedelta(days=30)
        movimientos_30d = MovimientoInventario.objects.filter(
            Q(almacen_origen=almacen) | Q(almacen_destino=almacen),
            fecha_movimiento__gte=hace_30d,
        ).count()

        ultima_recepcion = VoucherRecepcion.objects.filter(
            almacen_destino=almacen,
            estado=VoucherRecepcion.EstadoVoucher.APROBADO,
        ).aggregate(fecha=Max('created_at'))['fecha']

        stats = {
            'total_cantidad': total_cantidad,
            'ocupacion_porcentaje': ocupacion_pct,
            'productos_distintos': productos_distintos,
            'ultima_recepcion': ultima_recepcion,
            'movimientos_30d': movimientos_30d,
        }

        # ── Inventario por producto ──────────────────────────────────────
        calidad_por_producto = _calcular_calidad_promedio_por_producto(almacen.pk)

        inv_por_producto_qs = (
            inv_qs
            .select_related('producto', 'producto__unidad_medida')
            .values(
                'producto_id',
                'producto__codigo',
                'producto__nombre',
                'producto__unidad_medida__abreviatura',
            )
            .annotate(cantidad_total=Sum('cantidad_disponible'))
            .order_by('producto__codigo')
        )
        inventario_por_producto = [
            {
                'producto_id': row['producto_id'],
                'producto_codigo': row['producto__codigo'] or '',
                'producto_nombre': row['producto__nombre'] or '',
                'cantidad_total': row['cantidad_total'] or Decimal('0'),
                'unidad_medida': row['producto__unidad_medida__abreviatura'] or '',
                'calidad_promedio': calidad_por_producto.get(row['producto_id'], []),
            }
            for row in inv_por_producto_qs
        ]

        # ── Alertas activas ──────────────────────────────────────────────
        alertas_qs = (
            AlertaStock.objects.filter(almacen=almacen, resuelta=False)
            .select_related('tipo_alerta', 'inventario__producto')
            .order_by('-fecha_generacion')[:50]
        )
        alertas_activas = [
            {
                'id': a.pk,
                'tipo': a.tipo_alerta.codigo if a.tipo_alerta_id else '',
                'producto_nombre': (
                    a.inventario.producto.nombre
                    if a.inventario_id and a.inventario.producto_id
                    else ''
                ),
                'mensaje': a.mensaje or '',
                'criticidad': a.criticidad or '',
                'fecha_generacion': a.fecha_generacion,
            }
            for a in alertas_qs
        ]

        data = {
            'almacen': AlmacenDashboardHeaderSerializer(almacen).data,
            'stats': AlmacenStatsSerializer(stats).data,
            'inventario_por_producto': InventarioPorProductoSerializer(
                inventario_por_producto, many=True,
            ).data,
            'alertas_activas': AlertaDashboardSerializer(
                alertas_activas, many=True,
            ).data,
        }
        return Response(data)

    @action(detail=True, methods=['get'], url_path='kardex')
    def kardex(self, request, pk=None):
        """Histórico paginado de movimientos del almacén."""
        almacen = self.get_object()

        from apps.supply_chain.almacenamiento.models import MovimientoInventario

        params = request.query_params
        qs = (
            MovimientoInventario.objects.filter(
                Q(almacen_origen=almacen) | Q(almacen_destino=almacen),
            )
            .select_related(
                'tipo_movimiento',
                'producto',
                'unidad_medida',
                'almacen_origen',
                'almacen_destino',
                'registrado_por',
            )
            .order_by('-fecha_movimiento', '-created_at')
        )

        producto_id = params.get('producto')
        if producto_id:
            try:
                qs = qs.filter(producto_id=int(producto_id))
            except (TypeError, ValueError):
                pass

        desde = params.get('desde')
        if desde:
            qs = qs.filter(fecha_movimiento__date__gte=desde)

        hasta = params.get('hasta')
        if hasta:
            qs = qs.filter(fecha_movimiento__date__lte=hasta)

        # Filtro por tipo: acepta código (ENTRADA/SALIDA) o afectación
        tipo = params.get('tipo_movimiento')
        if tipo:
            qs = qs.filter(
                Q(tipo_movimiento__codigo__iexact=tipo)
                | Q(tipo_movimiento__afecta_stock__iexact=tipo),
            )

        page = self.paginate_queryset(qs)
        movimientos = page if page is not None else list(qs)

        data = [
            {
                'id': m.pk,
                'codigo': m.codigo,
                'fecha_movimiento': m.fecha_movimiento,
                'tipo_movimiento_codigo': (
                    m.tipo_movimiento.codigo if m.tipo_movimiento_id else ''
                ),
                'tipo_movimiento_nombre': (
                    m.tipo_movimiento.nombre if m.tipo_movimiento_id else ''
                ),
                'afecta_stock': (
                    m.tipo_movimiento.afecta_stock if m.tipo_movimiento_id else ''
                ),
                'producto_id': m.producto_id,
                'producto_codigo': m.producto.codigo if m.producto_id else '',
                'producto_nombre': m.producto.nombre if m.producto_id else '',
                'cantidad': m.cantidad,
                'unidad_medida': (
                    m.unidad_medida.abreviatura if m.unidad_medida_id else ''
                ),
                'almacen_origen_id': m.almacen_origen_id,
                'almacen_origen_nombre': (
                    m.almacen_origen.nombre if m.almacen_origen_id else ''
                ),
                'almacen_destino_id': m.almacen_destino_id,
                'almacen_destino_nombre': (
                    m.almacen_destino.nombre if m.almacen_destino_id else ''
                ),
                'documento_referencia': m.documento_referencia or '',
                'observaciones': m.observaciones or '',
                'registrado_por_nombre': (
                    m.registrado_por.get_full_name()
                    if m.registrado_por_id and m.registrado_por.get_full_name()
                    else (m.registrado_por.email if m.registrado_por_id else '')
                ),
            }
            for m in movimientos
        ]

        serialized = KardexMovimientoSerializer(data, many=True).data
        if page is not None:
            return self.get_paginated_response(serialized)
        return Response(serialized)

    @action(detail=False, methods=['get'], url_path='resumen-general')
    def resumen_general(self, request):
        """Stats globales del tenant (todos los almacenes) + detalle por almacén."""
        from apps.supply_chain.almacenamiento.models import AlertaStock, Inventario, MovimientoInventario
        from django.utils import timezone
        from datetime import timedelta

        almacenes_qs = Almacen.objects.filter(is_active=True).select_related(
            'tipo_almacen', 'sede',
        )
        total_almacenes = almacenes_qs.count()

        inv_qs = Inventario.objects.filter(almacen__in=almacenes_qs)
        total_cantidad_global = inv_qs.aggregate(
            total=Sum('cantidad_disponible'),
        )['total'] or Decimal('0')
        total_productos_stock = inv_qs.values('producto_id').distinct().count()

        alertas_pendientes = AlertaStock.objects.filter(
            almacen__in=almacenes_qs,
            resuelta=False,
        ).count()

        # Stats por almacén (para listado FE) + ocupación promedio global
        ahora = timezone.now()
        hace_7d = ahora - timedelta(days=7)
        ocupaciones = []
        almacenes_data = []
        for alm in almacenes_qs:
            stock = inv_qs.filter(almacen=alm).aggregate(
                total=Sum('cantidad_disponible'),
            )['total'] or Decimal('0')
            productos_count = (
                inv_qs.filter(almacen=alm).values('producto_id').distinct().count()
            )
            cap = alm.capacidad_maxima or Decimal('0')
            if cap > 0:
                ocupacion_pct = ((stock / cap) * Decimal('100')).quantize(Decimal('0.01'))
                ocupaciones.append(ocupacion_pct)
            else:
                ocupacion_pct = None

            ultima_mov = (
                MovimientoInventario.objects
                .filter(almacen_destino=alm)
                .order_by('-fecha_movimiento')
                .values_list('fecha_movimiento', flat=True)
                .first()
            )
            dias_desde = (ahora.date() - ultima_mov.date()).days if ultima_mov else None

            alertas_alm = AlertaStock.objects.filter(
                almacen=alm, resuelta=False,
            ).count()

            almacenes_data.append({
                'id': alm.id,
                'codigo': alm.codigo,
                'nombre': alm.nombre,
                'is_active': alm.is_active,
                'tipo_almacen_nombre': alm.tipo_almacen.nombre if alm.tipo_almacen else None,
                'sede_nombre': alm.sede.nombre if alm.sede else None,
                'cantidad_total': stock,
                'capacidad_maxima': cap if cap > 0 else None,
                'ocupacion_pct': ocupacion_pct,
                'productos_distintos': productos_count,
                'ultima_recepcion': ultima_mov,
                'dias_desde_ultima_recepcion': dias_desde,
                'alertas_activas': alertas_alm,
            })

        if ocupaciones:
            ocupacion_promedio = sum(ocupaciones, Decimal('0')) / Decimal(len(ocupaciones))
            ocupacion_promedio = ocupacion_promedio.quantize(Decimal('0.01'))
        else:
            ocupacion_promedio = Decimal('0.00')

        # Top 5 productos globales
        top_qs = (
            inv_qs
            .values(
                'producto_id',
                'producto__codigo',
                'producto__nombre',
            )
            .annotate(
                cantidad_total=Sum('cantidad_disponible'),
                almacenes_count=Count('almacen_id', distinct=True),
            )
            .order_by('-cantidad_total')[:5]
        )
        top_productos = [
            {
                'producto_id': row['producto_id'],
                'producto_codigo': row['producto__codigo'] or '',
                'producto_nombre': row['producto__nombre'] or '',
                'cantidad_total': row['cantidad_total'] or Decimal('0'),
                'almacenes_count': row['almacenes_count'] or 0,
            }
            for row in top_qs
        ]

        data = {
            'total_almacenes': total_almacenes,
            'total_productos_stock': total_productos_stock,
            'total_cantidad_global': total_cantidad_global,
            'alertas_pendientes': alertas_pendientes,
            'ocupacion_promedio': ocupacion_promedio,
            'top_productos': top_productos,
            'almacenes': almacenes_data,
        }
        return Response(ResumenGeneralSerializer(data).data)
