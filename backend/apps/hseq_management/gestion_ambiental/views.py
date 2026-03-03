"""
Views para Gestión Ambiental - HSEQ Management
ViewSets con actions personalizadas para generar certificados, calcular huella, etc.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from apps.gestion_estrategica.revision_direccion.services.resumen_mixin import ResumenRevisionMixin

from .models import (
    TipoResiduo, GestorAmbiental, RegistroResiduo,
    Vertimiento, FuenteEmision, RegistroEmision,
    TipoRecurso, ConsumoRecurso, CalculoHuellaCarbono,
    CertificadoAmbiental
)
from .serializers import (
    TipoResiduoSerializer, GestorAmbientalSerializer,
    RegistroResiduoSerializer, RegistroResiduoCreateSerializer,
    VertimientoSerializer, VertimientoCreateSerializer,
    FuenteEmisionSerializer, RegistroEmisionSerializer,
    TipoRecursoSerializer, ConsumoRecursoSerializer,
    CalculoHuellaCarbonoSerializer, CalculoHuellaCarbonoDetalleSerializer,
    CertificadoAmbientalSerializer, GenerarCertificadoSerializer,
    CalcularHuellaInputSerializer, ResumenGestionResiduosSerializer,
    ConsumoRecursoResumenSerializer
)


# ============================================================================
# RESIDUOS
# ============================================================================

class TipoResiduoViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de residuos"""
    queryset = TipoResiduo.objects.all()
    serializer_class = TipoResiduoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['clase', 'activo']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['codigo', 'nombre', 'clase']

    @action(detail=False, methods=['get'])
    def por_clase(self, request):
        """Obtener tipos de residuos agrupados por clase"""
        clases = {}
        for clase_code, clase_name in TipoResiduo.CLASE_RESIDUO_CHOICES:
            tipos = self.queryset.filter(clase=clase_code, activo=True)
            clases[clase_code] = {
                'nombre': clase_name,
                'tipos': TipoResiduoSerializer(tipos, many=True).data,
                'total': tipos.count()
            }
        return Response(clases)


class GestorAmbientalViewSet(viewsets.ModelViewSet):
    """ViewSet para gestores ambientales"""
    queryset = GestorAmbiental.objects.all()
    serializer_class = GestorAmbientalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'tipo_gestor', 'activo']
    search_fields = ['razon_social', 'nit', 'ciudad']
    ordering_fields = ['razon_social', 'tipo_gestor']

    def get_queryset(self):
        """Filtrar por empresa (multi-tenant)"""
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=True, methods=['get'])
    def licencias_vencidas(self, request, pk=None):
        """Verificar si las licencias están vencidas"""
        gestor = self.get_object()
        hoy = timezone.now().date()

        resultado = {
            'gestor': gestor.razon_social,
            'licencia_vigente': gestor.licencia_vigente,
            'fecha_vencimiento': gestor.fecha_vencimiento_licencia,
            'dias_restantes': None,
            'alerta': None
        }

        if gestor.fecha_vencimiento_licencia:
            dias = (gestor.fecha_vencimiento_licencia - hoy).days
            resultado['dias_restantes'] = dias

            if dias < 0:
                resultado['alerta'] = 'VENCIDA'
            elif dias <= 30:
                resultado['alerta'] = 'CRITICO'
            elif dias <= 90:
                resultado['alerta'] = 'PROXIMO_VENCIMIENTO'

        return Response(resultado)


class RegistroResiduoViewSet(ResumenRevisionMixin, viewsets.ModelViewSet):
    """ViewSet para registro de residuos"""
    queryset = RegistroResiduo.objects.select_related(
        'tipo_residuo', 'gestor'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'tipo_movimiento', 'tipo_residuo', 'gestor']
    search_fields = ['area_generadora', 'numero_manifiesto']
    ordering_fields = ['fecha', 'cantidad']

    # ResumenRevisionMixin config
    resumen_date_field = 'fecha'
    resumen_modulo_nombre = 'gestion_ambiental'

    def get_resumen_data(self, queryset, fecha_desde, fecha_hasta):
        """Resumen de gestión ambiental para Revisión por la Dirección."""
        # Residuos generados en período
        generados = queryset.filter(tipo_movimiento='GENERACION')
        total_generado_kg = generados.aggregate(total=Sum('cantidad'))['total'] or 0

        por_tipo_residuo = list(
            generados.values('tipo_residuo__nombre', 'tipo_residuo__clase')
            .annotate(cantidad_total=Sum('cantidad'))
            .order_by('-cantidad_total')[:10]
        )

        # Disposición/Aprovechamiento
        aprovechados = queryset.filter(tipo_movimiento='APROVECHAMIENTO')
        total_aprovechado = aprovechados.aggregate(total=Sum('cantidad'))['total'] or 0
        pct_aprovechamiento = round(
            (float(total_aprovechado) / float(total_generado_kg) * 100), 1
        ) if total_generado_kg > 0 else 0

        # Consumos de recursos en período
        consumos = ConsumoRecurso.objects.filter(
            fecha__range=[fecha_desde, fecha_hasta]
        )
        consumos_por_recurso = list(
            consumos.values('tipo_recurso__nombre')
            .annotate(total_consumo=Sum('cantidad'))
            .order_by('-total_consumo')
        )

        # Certificados ambientales vigentes
        certificados_vigentes = CertificadoAmbiental.objects.filter(
            estado='VIGENTE'
        ).count()

        return {
            'residuos': {
                'total_generado_kg': float(total_generado_kg),
                'por_tipo': por_tipo_residuo,
                'total_aprovechado_kg': float(total_aprovechado),
                'porcentaje_aprovechamiento': pct_aprovechamiento,
            },
            'consumos_recursos': consumos_por_recurso,
            'certificados_vigentes': certificados_vigentes,
        }

    def get_serializer_class(self):
        """Usar serializer diferente para create"""
        if self.action == 'create':
            return RegistroResiduoCreateSerializer
        return RegistroResiduoSerializer

    def get_queryset(self):
        """Filtrar por empresa y rango de fechas"""
        queryset = super().get_queryset()

        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')

        if fecha_inicio:
            queryset = queryset.filter(fecha__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha__lte=fecha_fin)

        return queryset

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen de gestión de residuos"""
        empresa_id = request.query_params.get('empresa_id')
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')

        if not all([empresa_id, fecha_inicio, fecha_fin]):
            return Response({
                'error': 'Se requiere empresa_id, fecha_inicio y fecha_fin'
            }, status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset()

        # Resumen por tipo de residuo
        por_tipo = queryset.values(
            'tipo_residuo__nombre',
            'tipo_residuo__clase'
        ).annotate(
            total_kg=Sum('cantidad'),
            num_registros=Count('id')
        ).order_by('-total_kg')

        # Resumen por área generadora
        por_area = queryset.values('area_generadora').annotate(
            total_kg=Sum('cantidad'),
            num_registros=Count('id')
        ).order_by('-total_kg')

        # Totales por clase
        total_peligrosos = queryset.filter(
            tipo_residuo__clase='PELIGROSO'
        ).aggregate(total=Sum('cantidad'))['total'] or 0

        total_reciclables = queryset.filter(
            tipo_residuo__clase='RECICLABLE'
        ).aggregate(total=Sum('cantidad'))['total'] or 0

        total_organicos = queryset.filter(
            tipo_residuo__clase='ORGANICO'
        ).aggregate(total=Sum('cantidad'))['total'] or 0

        total_general = queryset.aggregate(total=Sum('cantidad'))['total'] or 0

        # Tasa de reciclaje
        tasa_reciclaje = 0
        if total_general > 0:
            tasa_reciclaje = (total_reciclables / total_general) * 100

        data = {
            'periodo_inicio': fecha_inicio,
            'periodo_fin': fecha_fin,
            'total_residuos_kg': float(total_general),
            'residuos_peligrosos_kg': float(total_peligrosos),
            'residuos_reciclables_kg': float(total_reciclables),
            'residuos_organicos_kg': float(total_organicos),
            'tasa_reciclaje_pct': round(tasa_reciclaje, 2),
            'por_tipo_residuo': list(por_tipo),
            'por_area_generadora': list(por_area)
        }

        serializer = ResumenGestionResiduosSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def generar_certificado(self, request):
        """Generar certificado de disposición para residuos seleccionados"""
        serializer = GenerarCertificadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        residuos_ids = data.get('residuos_ids', [])
        gestor_id = data['gestor_id']

        try:
            gestor = GestorAmbiental.objects.get(id=gestor_id)
        except GestorAmbiental.DoesNotExist:
            return Response({
                'error': 'Gestor ambiental no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        # Crear certificado
        numero_certificado = f"CERT-{timezone.now().year}-{uuid.uuid4().hex[:8].upper()}"

        certificado = CertificadoAmbiental.objects.create(
            empresa_id=request.data.get('empresa_id'),
            numero_certificado=numero_certificado,
            tipo_certificado=data['tipo_certificado'],
            emisor=gestor.razon_social,
            gestor=gestor,
            fecha_emision=timezone.now().date(),
            descripcion=data['descripcion'],
            observaciones=data.get('observaciones', ''),
            vigente=True
        )

        # Asociar residuos
        if residuos_ids:
            residuos = RegistroResiduo.objects.filter(id__in=residuos_ids)
            certificado.residuos_relacionados.set(residuos)

            # Calcular cantidad total certificada
            total = residuos.aggregate(total=Sum('cantidad'))['total'] or 0
            certificado.cantidad_certificada = total
            certificado.unidad_medida = 'KG'
            certificado.save()

        return Response({
            'mensaje': 'Certificado generado exitosamente',
            'certificado': CertificadoAmbientalSerializer(certificado).data
        }, status=status.HTTP_201_CREATED)


# ============================================================================
# VERTIMIENTOS
# ============================================================================

class VertimientoViewSet(viewsets.ModelViewSet):
    """ViewSet para vertimientos"""
    queryset = Vertimiento.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'tipo_vertimiento', 'cuerpo_receptor', 'cumple_normativa']
    search_fields = ['punto_vertimiento', 'nombre_cuerpo_receptor']
    ordering_fields = ['fecha_vertimiento']

    def get_serializer_class(self):
        if self.action == 'create':
            return VertimientoCreateSerializer
        return VertimientoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def no_conformes(self, request):
        """Vertimientos que no cumplen normativa"""
        empresa_id = request.query_params.get('empresa_id')
        queryset = self.get_queryset().filter(cumple_normativa=False)

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'total': queryset.count(),
            'vertimientos': serializer.data
        })


# ============================================================================
# EMISIONES
# ============================================================================

class FuenteEmisionViewSet(viewsets.ModelViewSet):
    """ViewSet para fuentes de emisión"""
    queryset = FuenteEmision.objects.all()
    serializer_class = FuenteEmisionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'tipo_fuente', 'activo']
    search_fields = ['codigo', 'nombre', 'proceso_generador']
    ordering_fields = ['codigo', 'nombre']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset


class RegistroEmisionViewSet(viewsets.ModelViewSet):
    """ViewSet para registros de emisiones"""
    queryset = RegistroEmision.objects.select_related('fuente_emision').all()
    serializer_class = RegistroEmisionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'fuente_emision', 'cumple_normativa']
    ordering_fields = ['fecha_medicion']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def no_conformes(self, request):
        """Emisiones que no cumplen normativa"""
        queryset = self.get_queryset().filter(cumple_normativa=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'total': queryset.count(),
            'emisiones': serializer.data
        })


# ============================================================================
# CONSUMO DE RECURSOS
# ============================================================================

class TipoRecursoViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de recursos"""
    queryset = TipoRecurso.objects.all()
    serializer_class = TipoRecursoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['categoria', 'activo']
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['categoria', 'nombre']


class ConsumoRecursoViewSet(viewsets.ModelViewSet):
    """ViewSet para consumos de recursos"""
    queryset = ConsumoRecurso.objects.select_related('tipo_recurso').all()
    serializer_class = ConsumoRecursoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'tipo_recurso', 'periodo_year', 'periodo_month']
    ordering_fields = ['periodo_year', 'periodo_month', 'cantidad_consumida']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def resumen_anual(self, request):
        """Resumen de consumos por año"""
        empresa_id = request.query_params.get('empresa_id')
        year = request.query_params.get('year', timezone.now().year)

        if not empresa_id:
            return Response({
                'error': 'Se requiere empresa_id'
            }, status=status.HTTP_400_BAD_REQUEST)

        consumos = self.get_queryset().filter(
            empresa_id=empresa_id,
            periodo_year=year
        )

        # Agrupar por tipo de recurso
        por_recurso = consumos.values(
            'tipo_recurso__nombre',
            'tipo_recurso__categoria',
            'tipo_recurso__unidad_medida'
        ).annotate(
            total_consumo=Sum('cantidad_consumida'),
            total_costo=Sum('costo_total'),
            total_emision_co2=Sum('emision_co2_kg')
        ).order_by('tipo_recurso__categoria')

        # Por mes
        por_mes = []
        for mes in range(1, 13):
            mes_consumos = consumos.filter(periodo_month=mes)
            por_mes.append({
                'mes': mes,
                'total_costo': float(mes_consumos.aggregate(
                    total=Sum('costo_total'))['total'] or 0),
                'total_emision_co2': float(mes_consumos.aggregate(
                    total=Sum('emision_co2_kg'))['total'] or 0)
            })

        return Response({
            'year': year,
            'por_recurso': list(por_recurso),
            'por_mes': por_mes,
            'total_costo_anual': float(consumos.aggregate(
                total=Sum('costo_total'))['total'] or 0),
            'total_emision_co2_anual': float(consumos.aggregate(
                total=Sum('emision_co2_kg'))['total'] or 0)
        })


# ============================================================================
# HUELLA DE CARBONO
# ============================================================================

class CalculoHuellaCarbonoViewSet(viewsets.ModelViewSet):
    """ViewSet para cálculos de huella de carbono"""
    queryset = CalculoHuellaCarbono.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'periodo_year', 'verificado']
    ordering_fields = ['periodo_year']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CalculoHuellaCarbonoDetalleSerializer
        return CalculoHuellaCarbonoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['post'])
    def calcular_huella(self, request):
        """Calcular huella de carbono automáticamente desde consumos"""
        serializer = CalcularHuellaInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        empresa_id = request.data.get('empresa_id')
        periodo_year = serializer.validated_data['periodo_year']
        incluir_alcance_3 = serializer.validated_data.get('incluir_alcance_3', True)

        # Verificar si ya existe cálculo para este período
        existente = CalculoHuellaCarbono.objects.filter(
            empresa_id=empresa_id,
            periodo_year=periodo_year
        ).first()

        if existente:
            return Response({
                'error': f'Ya existe un cálculo para el año {periodo_year}',
                'calculo_id': existente.id
            }, status=status.HTTP_400_BAD_REQUEST)

        # Obtener consumos del período
        consumos = ConsumoRecurso.objects.filter(
            empresa_id=empresa_id,
            periodo_year=periodo_year
        ).select_related('tipo_recurso')

        # Inicializar cálculo
        calculo = CalculoHuellaCarbono.objects.create(
            empresa_id=empresa_id,
            periodo_year=periodo_year,
            periodo_inicio=datetime(periodo_year, 1, 1).date(),
            periodo_fin=datetime(periodo_year, 12, 31).date(),
            metodologia='GHG Protocol'
        )

        # Calcular Alcance 2: Electricidad
        consumo_electricidad = consumos.filter(
            tipo_recurso__categoria='ENERGIA'
        ).aggregate(total=Sum('emision_co2_kg'))['total'] or 0

        calculo.alcance2_electricidad = Decimal(str(consumo_electricidad)) / 1000  # kg a toneladas

        # Calcular Alcance 1: Combustibles
        consumo_combustibles = consumos.filter(
            tipo_recurso__categoria='COMBUSTIBLE'
        ).aggregate(total=Sum('emision_co2_kg'))['total'] or 0

        calculo.alcance1_combustion_estacionaria = Decimal(str(consumo_combustibles)) / 1000

        # Calcular Alcance 1: Gas
        consumo_gas = consumos.filter(
            tipo_recurso__categoria='GAS'
        ).aggregate(total=Sum('emision_co2_kg'))['total'] or 0

        calculo.alcance1_combustion_estacionaria += Decimal(str(consumo_gas)) / 1000

        # Alcance 3: Residuos (si se incluye)
        if incluir_alcance_3:
            # Obtener residuos del período
            residuos = RegistroResiduo.objects.filter(
                empresa_id=empresa_id,
                fecha__year=periodo_year
            )

            # Factor promedio: 0.5 kg CO2e por kg de residuo
            total_residuos_kg = residuos.aggregate(total=Sum('cantidad'))['total'] or 0
            calculo.alcance3_residuos = Decimal(str(total_residuos_kg)) * Decimal('0.0005')  # a toneladas

        # Guardar (el save automáticamente calcula totales)
        calculo.save()

        return Response({
            'mensaje': 'Huella de carbono calculada exitosamente',
            'calculo': CalculoHuellaCarbonoDetalleSerializer(calculo).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def verificar(self, request, pk=None):
        """Marcar cálculo como verificado"""
        calculo = self.get_object()
        verificador = request.data.get('verificador_externo', '')

        calculo.verificado = True
        calculo.verificador_externo = verificador
        calculo.fecha_verificacion = timezone.now().date()
        calculo.save()

        return Response({
            'mensaje': 'Cálculo verificado exitosamente',
            'calculo': self.get_serializer(calculo).data
        })

    @action(detail=False, methods=['get'])
    def comparativa_anual(self, request):
        """Comparativa de huellas de carbono por años"""
        empresa_id = request.query_params.get('empresa_id')

        if not empresa_id:
            return Response({
                'error': 'Se requiere empresa_id'
            }, status=status.HTTP_400_BAD_REQUEST)

        calculos = self.get_queryset().filter(
            empresa_id=empresa_id
        ).order_by('periodo_year')

        comparativa = []
        for calculo in calculos:
            comparativa.append({
                'year': calculo.periodo_year,
                'huella_total': float(calculo.huella_total),
                'alcance_1': float(calculo.alcance1_total),
                'alcance_2': float(calculo.alcance2_total),
                'alcance_3': float(calculo.alcance3_total),
                'huella_per_capita': float(calculo.huella_per_capita) if calculo.huella_per_capita else None,
                'verificado': calculo.verificado
            })

        return Response({
            'empresa_id': empresa_id,
            'comparativa': comparativa
        })


# ============================================================================
# CERTIFICADOS AMBIENTALES
# ============================================================================

class CertificadoAmbientalViewSet(viewsets.ModelViewSet):
    """ViewSet para certificados ambientales"""
    queryset = CertificadoAmbiental.objects.select_related('gestor').prefetch_related(
        'residuos_relacionados'
    ).all()
    serializer_class = CertificadoAmbientalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['empresa_id', 'tipo_certificado', 'vigente', 'gestor']
    search_fields = ['numero_certificado', 'emisor', 'descripcion']
    ordering_fields = ['fecha_emision', 'fecha_vencimiento']

    def get_queryset(self):
        queryset = super().get_queryset()
        empresa_id = self.request.query_params.get('empresa_id')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        return queryset

    @action(detail=False, methods=['get'])
    def proximos_vencer(self, request):
        """Certificados próximos a vencer (30 días)"""
        hoy = timezone.now().date()
        limite = hoy + timedelta(days=30)

        certificados = self.get_queryset().filter(
            vigente=True,
            fecha_vencimiento__isnull=False,
            fecha_vencimiento__lte=limite,
            fecha_vencimiento__gte=hoy
        )

        serializer = self.get_serializer(certificados, many=True)
        return Response({
            'total': certificados.count(),
            'certificados': serializer.data
        })

    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        """Certificados vencidos"""
        hoy = timezone.now().date()

        certificados = self.get_queryset().filter(
            fecha_vencimiento__isnull=False,
            fecha_vencimiento__lt=hoy
        )

        serializer = self.get_serializer(certificados, many=True)
        return Response({
            'total': certificados.count(),
            'certificados': serializer.data
        })
