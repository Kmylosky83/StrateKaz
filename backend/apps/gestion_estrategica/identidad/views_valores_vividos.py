"""
ViewSets para Valores Corporativos Vividos
==========================================

API para gestionar la conexión entre valores corporativos y acciones,
incluyendo estadísticas para el módulo de BI.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import GranularActionPermission
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.db.models import Count, Avg, Q
from datetime import timedelta

from .models_valores_vividos import (
    ValorVivido,
    ConfiguracionMetricaValor,
    obtener_valores_de_accion,
    obtener_acciones_de_valor,
)
from .models import CorporateValue
from .serializers_valores_vividos import (
    ValorVividoListSerializer,
    ValorVividoDetailSerializer,
    VincularValorSerializer,
    VincularMultiplesValoresSerializer,
    ActualizarValorVividoSerializer,
    VerificarValorVividoSerializer,
    EstadisticasValorSerializer,
    TendenciaMensualSerializer,
    RankingCategoriaSerializer,
    ValorSubrepresentadoSerializer,
    ResumenValoresVividosSerializer,
    ConfiguracionMetricaValorSerializer,
)
from apps.core.base_models.mixins import get_tenant_empresa


class ValorVividoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Valores Vividos.

    Endpoints:
    - GET /valores-vividos/ - Listar vínculos valor-acción
    - POST /valores-vividos/ - Crear vínculo
    - GET /valores-vividos/{id}/ - Detalle de vínculo
    - PUT /valores-vividos/{id}/ - Actualizar vínculo
    - DELETE /valores-vividos/{id}/ - Eliminar vínculo

    Acciones:
    - POST /valores-vividos/vincular/ - Vincular valor a acción
    - POST /valores-vividos/vincular-multiples/ - Vincular múltiples valores
    - POST /valores-vividos/{id}/verificar/ - Verificar vínculo
    - GET /valores-vividos/por-accion/{content_type}/{object_id}/ - Valores de una acción
    - GET /valores-vividos/por-valor/{valor_id}/ - Acciones de un valor

    Estadísticas (BI):
    - GET /valores-vividos/estadisticas/ - Estadísticas generales
    - GET /valores-vividos/tendencia/ - Tendencia mensual
    - GET /valores-vividos/ranking-categorias/ - Ranking de categorías
    - GET /valores-vividos/subrepresentados/ - Valores con pocas acciones
    - GET /valores-vividos/resumen/ - Resumen ejecutivo
    """

    queryset = ValorVivido.objects.activos()
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'valores'
    filterset_fields = [
        'valor', 'categoria_accion', 'tipo_vinculo', 'impacto', 'verificado', 'area'
    ]
    search_fields = ['justificacion', 'metadata__titulo']
    ordering_fields = ['fecha_vinculacion', 'puntaje', 'created_at']
    ordering = ['-fecha_vinculacion']

    def get_serializer_class(self):
        if self.action == 'list':
            return ValorVividoListSerializer
        if self.action == 'vincular':
            return VincularValorSerializer
        if self.action == 'vincular_multiples':
            return VincularMultiplesValoresSerializer
        if self.action in ['update', 'partial_update']:
            return ActualizarValorVividoSerializer
        if self.action == 'verificar':
            return VerificarValorVividoSerializer
        return ValorVividoDetailSerializer

    def get_queryset(self):
        """Tenant schema isolation handles data separation."""
        return super().get_queryset()

    # =========================================================================
    # ACCIONES DE VINCULACIÓN
    # =========================================================================

    @action(detail=False, methods=['post'])
    def vincular(self, request):
        """
        Vincula un valor corporativo a una acción.

        Body:
        {
            "valor_id": 1,
            "content_type": "planeacion.proyecto",
            "object_id": 123,
            "categoria_accion": "PROYECTO",
            "tipo_vinculo": "REFLEJA",
            "impacto": "ALTO",
            "justificacion": "Este proyecto ejemplifica nuestro valor de innovación..."
        }
        """
        serializer = VincularValorSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        valor_vivido = serializer.save()

        return Response(
            {
                "message": "Valor vinculado exitosamente",
                "valor_vivido": ValorVividoDetailSerializer(valor_vivido).data
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'], url_path='vincular-multiples')
    def vincular_multiples(self, request):
        """
        Vincula múltiples valores a una misma acción.

        Body:
        {
            "valores_ids": [1, 2, 3],
            "content_type": "planeacion.proyecto",
            "object_id": 123,
            "categoria_accion": "PROYECTO",
            "tipo_vinculo": "REFLEJA",
            "impacto": "ALTO",
            "justificacion": "Este proyecto ejemplifica nuestros valores..."
        }
        """
        serializer = VincularMultiplesValoresSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user = request.user

        vinculos_creados = []
        vinculos_existentes = []

        for valor_id in data['valores_ids']:
            # Verificar si ya existe
            if ValorVivido.objects.filter(
                valor_id=valor_id,
                content_type=data['content_type'],
                object_id=data['object_id'],
                is_active=True
            ).exists():
                vinculos_existentes.append(valor_id)
                continue

            valor_vivido = ValorVivido.objects.create(
                valor_id=valor_id,
                content_type=data['content_type'],
                object_id=data['object_id'],
                categoria_accion=data['categoria_accion'],
                tipo_vinculo=data.get('tipo_vinculo', 'REFLEJA'),
                impacto=data.get('impacto', 'MEDIO'),
                justificacion=data['justificacion'],
                vinculado_por=user,
                created_by=user,
                updated_by=user,
            )
            vinculos_creados.append(valor_vivido)

        return Response({
            "message": f"{len(vinculos_creados)} valores vinculados exitosamente",
            "creados": len(vinculos_creados),
            "existentes": vinculos_existentes,
            "vinculos": ValorVividoListSerializer(vinculos_creados, many=True).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def verificar(self, request, pk=None):
        """
        Verifica un vínculo valor-acción (validación por supervisor).

        Body:
        {
            "observaciones": "Verificado correctamente"
        }
        """
        valor_vivido = self.get_object()

        if valor_vivido.verificado:
            return Response(
                {"error": "Este vínculo ya fue verificado"},
                status=status.HTTP_400_BAD_REQUEST
            )

        valor_vivido.verificar(request.user)

        return Response({
            "message": "Vínculo verificado exitosamente",
            "valor_vivido": ValorVividoDetailSerializer(valor_vivido).data
        })

    @action(detail=False, methods=['get'], url_path='por-accion/(?P<content_type_str>[^/.]+)/(?P<object_id>[^/.]+)')
    def por_accion(self, request, content_type_str=None, object_id=None):
        """
        Obtiene todos los valores vinculados a una acción específica.

        URL: /valores-vividos/por-accion/{app_label.model}/{object_id}/
        Ejemplo: /valores-vividos/por-accion/planeacion.proyecto/123/
        """
        try:
            app_label, model = content_type_str.lower().split('.')
            content_type = ContentType.objects.get(app_label=app_label, model=model)
        except (ValueError, ContentType.DoesNotExist):
            return Response(
                {"error": "Content type inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )

        valores = ValorVivido.objects.filter(
            content_type=content_type,
            object_id=object_id,
            is_active=True
        ).select_related('valor')

        return Response({
            "count": valores.count(),
            "accion": {
                "content_type": content_type_str,
                "object_id": object_id
            },
            "valores": ValorVividoListSerializer(valores, many=True).data
        })

    @action(detail=False, methods=['get'], url_path='por-valor/(?P<valor_id>[^/.]+)')
    def por_valor(self, request, valor_id=None):
        """
        Obtiene todas las acciones vinculadas a un valor específico.

        URL: /valores-vividos/por-valor/{valor_id}/

        Query params:
        - categoria: Filtrar por categoría
        - fecha_desde: Fecha inicio (YYYY-MM-DD)
        - fecha_hasta: Fecha fin (YYYY-MM-DD)
        """
        valor = get_object_or_404(CorporateValue, pk=valor_id, is_active=True)

        categoria = request.query_params.get('categoria')
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        acciones = obtener_acciones_de_valor(
            valor_id=valor_id,
            categoria=categoria,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta
        )

        # Agrupar por categoría
        por_categoria = acciones.values('categoria_accion').annotate(
            total=Count('id')
        ).order_by('-total')

        return Response({
            "valor": {
                "id": valor.id,
                "name": valor.name,
                "icon": valor.icon,
            },
            "total_acciones": acciones.count(),
            "por_categoria": list(por_categoria),
            "acciones": ValorVividoListSerializer(acciones[:50], many=True).data  # Limitar a 50
        })

    # =========================================================================
    # ESTADÍSTICAS PARA BI
    # =========================================================================

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Estadísticas por valor corporativo.

        Query params:
        - fecha_desde: Fecha inicio (YYYY-MM-DD)
        - fecha_hasta: Fecha fin (YYYY-MM-DD)

        Response:
        [
            {
                "valor__id": 1,
                "valor__name": "Innovación",
                "total_acciones": 25,
                "impacto_bajo": 5,
                "impacto_medio": 10,
                "impacto_alto": 7,
                "impacto_muy_alto": 3
            },
            ...
        ]
        """
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        empresa = get_tenant_empresa(auto_create=False)
        empresa_id = empresa.id if empresa else None

        stats = ValorVivido.objects.estadisticas_por_valor(
            empresa_id=empresa_id,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta
        )

        serializer = EstadisticasValorSerializer(stats, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def tendencia(self, request):
        """
        Tendencia mensual de valores vividos.

        Query params:
        - meses: Cantidad de meses (default: 12)

        Response:
        [
            {"mes": "2024-01-01", "valor__id": 1, "valor__name": "Innovación", "total": 5},
            ...
        ]
        """
        meses = int(request.query_params.get('meses', 12))

        empresa = get_tenant_empresa(auto_create=False)
        empresa_id = empresa.id if empresa else None

        tendencia = ValorVivido.objects.tendencia_mensual(
            empresa_id=empresa_id,
            meses=meses
        )

        serializer = TendenciaMensualSerializer(tendencia, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='ranking-categorias')
    def ranking_categorias(self, request):
        """
        Ranking de categorías de acciones.

        Query params:
        - valor_id: Filtrar por valor (opcional)

        Response:
        [
            {"categoria_accion": "PROYECTO", "total": 25, "porcentaje": 35.5},
            {"categoria_accion": "ACCION_MEJORA", "total": 20, "porcentaje": 28.4},
            ...
        ]
        """
        valor_id = request.query_params.get('valor_id')

        empresa = get_tenant_empresa(auto_create=False)
        empresa_id = empresa.id if empresa else None

        ranking = ValorVivido.objects.ranking_categorias(
            valor_id=valor_id,
            empresa_id=empresa_id
        )

        serializer = RankingCategoriaSerializer(ranking, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def subrepresentados(self, request):
        """
        Valores con pocas acciones vinculadas.

        Query params:
        - umbral: Cantidad mínima esperada (default: 5)

        Response:
        [
            {
                "valor_id": 3,
                "valor_nombre": "Sostenibilidad",
                "total_acciones": 2,
                "deficit": 3,
                "porcentaje_cumplimiento": 40.0
            },
            ...
        ]
        """
        umbral = int(request.query_params.get('umbral', 5))

        empresa = get_tenant_empresa(auto_create=False)
        empresa_id = empresa.id if empresa else None

        subrepresentados = ValorVivido.objects.valores_subrepresentados(
            empresa_id=empresa_id,
            umbral_minimo=umbral
        )

        serializer = ValorSubrepresentadoSerializer(subrepresentados, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """
        Resumen ejecutivo de valores vividos (dashboard BI).

        Response:
        {
            "total_vinculos": 150,
            "total_valores_activos": 8,
            "valores_con_acciones": 6,
            "valores_sin_acciones": 2,
            "promedio_acciones_por_valor": 18.75,
            "puntaje_promedio": 6.5,
            "por_impacto": {"BAJO": 20, "MEDIO": 80, "ALTO": 40, "MUY_ALTO": 10},
            "por_categoria": [...],
            "top_valores": [...],
            "valores_subrepresentados": [...]
        }
        """
        empresa = get_tenant_empresa(auto_create=False)
        empresa_id = empresa.id if empresa else None

        qs = ValorVivido.objects.activos()

        # Estadísticas básicas
        total_vinculos = qs.count()

        # Contar valores activos
        total_valores = CorporateValue.objects.filter(is_active=True).count()
        valores_con_acciones = qs.values('valor_id').distinct().count()
        valores_sin_acciones = total_valores - valores_con_acciones

        # Promedio de acciones por valor
        promedio = total_vinculos / total_valores if total_valores > 0 else 0

        # Puntaje promedio
        puntaje_promedio = qs.aggregate(avg=Avg('puntaje'))['avg'] or 0

        # Por impacto
        por_impacto = dict(qs.values('impacto').annotate(
            total=Count('id')
        ).values_list('impacto', 'total'))

        # Top 5 valores
        top_valores = list(qs.values('valor__id', 'valor__name', 'valor__icon').annotate(
            total=Count('id')
        ).order_by('-total')[:5])

        # Ranking de categorías (top 5)
        por_categoria = list(qs.values('categoria_accion').annotate(
            total=Count('id')
        ).order_by('-total')[:5])

        # Subrepresentados
        if empresa_id:
            subrepresentados = ValorVivido.objects.valores_subrepresentados(
                empresa_id=empresa_id,
                umbral_minimo=5
            )[:3]
        else:
            subrepresentados = []

        data = {
            'total_vinculos': total_vinculos,
            'total_valores_activos': total_valores,
            'valores_con_acciones': valores_con_acciones,
            'valores_sin_acciones': valores_sin_acciones,
            'promedio_acciones_por_valor': round(promedio, 2),
            'puntaje_promedio': round(puntaje_promedio, 2),
            'por_impacto': por_impacto,
            'por_categoria': por_categoria,
            'top_valores': top_valores,
            'valores_subrepresentados': subrepresentados,
        }

        return Response(data)


class ConfiguracionMetricaValorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para configuración de métricas de valores.

    Solo administradores pueden modificar la configuración.
    """

    queryset = ConfiguracionMetricaValor.objects.all()
    serializer_class = ConfiguracionMetricaValorSerializer
    permission_classes = [IsAuthenticated, GranularActionPermission]
    section_code = 'valores'

    def get_queryset(self):
        """Filtrar por empresa del tenant actual."""
        qs = super().get_queryset()
        empresa = get_tenant_empresa(auto_create=False)
        if empresa:
            qs = qs.filter(empresa_id=empresa.id)
        return qs

    @action(detail=False, methods=['get'])
    def mi_configuracion(self, request):
        """
        Obtiene la configuración de la empresa del usuario.
        Si no existe, crea una con valores por defecto.
        """
        # Obtener empresa del usuario autenticado
        try:
            from apps.gestion_estrategica.configuracion.models import EmpresaConfig
            empresa = EmpresaConfig.objects.first()

            config, created = ConfiguracionMetricaValor.objects.get_or_create(
                empresa=empresa,
                defaults={
                    'acciones_minimas_mensual': 5,
                    'puntaje_minimo_promedio': 5.0,
                    'alertar_valores_bajos': True,
                    'umbral_alerta_acciones': 3,
                    'categorias_prioritarias': ['PROYECTO', 'ACCION_MEJORA', 'GESTION_CAMBIO'],
                    'pesos_tipo_vinculo': {
                        'REFLEJA': 1.0,
                        'PROMUEVE': 0.8,
                        'RESULTADO': 0.9,
                        'MEJORA': 1.2,
                    },
                    'meses_analisis': 12,
                }
            )

            return Response({
                "created": created,
                "configuracion": ConfiguracionMetricaValorSerializer(config).data
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
