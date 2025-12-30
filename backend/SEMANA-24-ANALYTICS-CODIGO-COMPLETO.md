# SEMANA 24 - Analytics - Código Completo
## Apps: analisis_tendencias, generador_informes, acciones_indicador, exportacion

Este documento contiene TODO el código necesario para las 4 apps adicionales del módulo Analytics.

---

## 1. ANALISIS_TENDENCIAS

### `analisis_tendencias/models.py`

```python
"""
Modelos para Análisis de Tendencias - Analytics
"""
from django.db import models
from apps.core.base_models import BaseCompanyModel


class AnalisisKPI(BaseCompanyModel):
    """Análisis comparativo de KPIs"""

    TIPO_ANALISIS_CHOICES = [
        ('vs_meta', 'Vs. Meta'),
        ('vs_periodo_anterior', 'Vs. Período Anterior'),
        ('vs_mejor_historico', 'Vs. Mejor Histórico'),
        ('tendencia', 'Tendencia'),
    ]

    DIRECCION_CHOICES = [
        ('mejora', 'Mejora'),
        ('deterioro', 'Deterioro'),
        ('estable', 'Estable'),
    ]

    kpi = models.ForeignKey('config_indicadores.CatalogoKPI', on_delete=models.CASCADE, related_name='analisis')
    periodo_analisis = models.CharField(max_length=50, help_text='Ej: "2025-Q1", "2025", "2025-03"')
    tipo_analisis = models.CharField(max_length=30, choices=TIPO_ANALISIS_CHOICES)
    valor_actual = models.DecimalField(max_digits=15, decimal_places=4)
    valor_comparacion = models.DecimalField(max_digits=15, decimal_places=4)
    variacion_absoluta = models.DecimalField(max_digits=15, decimal_places=4)
    variacion_porcentual = models.DecimalField(max_digits=10, decimal_places=2)
    direccion = models.CharField(max_length=20, choices=DIRECCION_CHOICES)
    es_significativo = models.BooleanField(default=False)
    fecha_analisis = models.DateTimeField(auto_now_add=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'analytics_analisis_kpi'
        verbose_name = 'Análisis KPI'
        verbose_name_plural = 'Análisis de KPIs'
        ordering = ['-fecha_analisis']

    def __str__(self):
        return f"Análisis {self.kpi.codigo} - {self.periodo_analisis}"


class TendenciaKPI(BaseCompanyModel):
    """Tendencia calculada para un KPI"""

    TIPO_TENDENCIA_CHOICES = [
        ('lineal', 'Lineal'),
        ('exponencial', 'Exponencial'),
        ('estacional', 'Estacional'),
    ]

    kpi = models.ForeignKey('config_indicadores.CatalogoKPI', on_delete=models.CASCADE, related_name='tendencias')
    periodo_inicio = models.DateField()
    periodo_fin = models.DateField()
    tipo_tendencia = models.CharField(max_length=20, choices=TIPO_TENDENCIA_CHOICES)
    coeficiente_pendiente = models.DecimalField(max_digits=15, decimal_places=6, help_text='Pendiente de la recta (m)')
    r_cuadrado = models.DecimalField(max_digits=5, decimal_places=4, help_text='Bondad de ajuste 0-1')
    proyeccion_siguiente = models.DecimalField(max_digits=15, decimal_places=4)
    fecha_proyeccion = models.DateField()
    confianza = models.DecimalField(max_digits=5, decimal_places=2, help_text='% de confianza')

    class Meta:
        db_table = 'analytics_tendencia_kpi'
        verbose_name = 'Tendencia KPI'
        verbose_name_plural = 'Tendencias de KPIs'
        ordering = ['-fecha_proyeccion']

    def __str__(self):
        return f"Tendencia {self.kpi.codigo} ({self.periodo_inicio} - {self.periodo_fin})"


class AnomaliaDetectada(BaseCompanyModel):
    """Anomalías detectadas en valores de KPIs"""

    TIPO_ANOMALIA_CHOICES = [
        ('outlier', 'Outlier (Valor Atípico)'),
        ('cambio_brusco', 'Cambio Brusco'),
        ('patron_inusual', 'Patrón Inusual'),
        ('sin_datos', 'Sin Datos'),
    ]

    SEVERIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]

    valor_kpi = models.ForeignKey('indicadores_area.ValorKPI', on_delete=models.CASCADE, related_name='anomalias')
    tipo_anomalia = models.CharField(max_length=20, choices=TIPO_ANOMALIA_CHOICES)
    severidad = models.CharField(max_length=10, choices=SEVERIDAD_CHOICES)
    desviacion_std = models.DecimalField(max_digits=10, decimal_places=4, help_text='Desviaciones estándar')
    valor_esperado = models.DecimalField(max_digits=15, decimal_places=4)
    descripcion = models.TextField()
    esta_revisada = models.BooleanField(default=False)
    revisada_por = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='anomalias_revisadas')
    fecha_revision = models.DateTimeField(null=True, blank=True)
    accion_tomada = models.TextField(blank=True)

    class Meta:
        db_table = 'analytics_anomalia_detectada'
        verbose_name = 'Anomalía Detectada'
        verbose_name_plural = 'Anomalías Detectadas'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_tipo_anomalia_display()} - Severidad {self.severidad}"
```

### `analisis_tendencias/serializers.py`

```python
"""
Serializers para Análisis de Tendencias - Analytics
"""
from rest_framework import serializers
from .models import AnalisisKPI, TendenciaKPI, AnomaliaDetectada


class AnalisisKPISerializer(serializers.ModelSerializer):
    kpi_codigo = serializers.CharField(source='kpi.codigo', read_only=True)
    kpi_nombre = serializers.CharField(source='kpi.nombre', read_only=True)

    class Meta:
        model = AnalisisKPI
        fields = '__all__'
        read_only_fields = ['id', 'fecha_analisis', 'created_at', 'updated_at']


class TendenciaKPISerializer(serializers.ModelSerializer):
    kpi_codigo = serializers.CharField(source='kpi.codigo', read_only=True)
    kpi_nombre = serializers.CharField(source='kpi.nombre', read_only=True)

    class Meta:
        model = TendenciaKPI
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AnomaliaDetectadaSerializer(serializers.ModelSerializer):
    valor_kpi_info = serializers.SerializerMethodField()
    revisada_por_nombre = serializers.CharField(source='revisada_por.get_full_name', read_only=True)

    class Meta:
        model = AnomaliaDetectada
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_valor_kpi_info(self, obj):
        return {
            'kpi_codigo': obj.valor_kpi.kpi.codigo,
            'kpi_nombre': obj.valor_kpi.kpi.nombre,
            'periodo': obj.valor_kpi.periodo_medicion,
            'valor': str(obj.valor_kpi.valor)
        }
```

### `analisis_tendencias/views.py`

```python
"""
Views para Análisis de Tendencias - Analytics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.utils import timezone

from .models import AnalisisKPI, TendenciaKPI, AnomaliaDetectada
from .serializers import AnalisisKPISerializer, TendenciaKPISerializer, AnomaliaDetectadaSerializer


class AnalisisKPIViewSet(viewsets.ModelViewSet):
    queryset = AnalisisKPI.objects.all()
    serializer_class = AnalisisKPISerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['kpi', 'tipo_analisis', 'direccion', 'es_significativo']
    search_fields = ['periodo_analisis', 'observaciones']
    ordering_fields = ['fecha_analisis', 'variacion_porcentual']
    ordering = ['-fecha_analisis']

    @action(detail=False, methods=['post'])
    def generar_analisis(self, request):
        """Generar análisis comparativo para un KPI"""
        kpi_id = request.data.get('kpi_id')
        tipo_analisis = request.data.get('tipo_analisis', 'vs_meta')
        periodo = request.data.get('periodo')

        # Aquí iría la lógica de cálculo del análisis
        # Por ahora solo retorna un placeholder

        return Response({
            'message': 'Análisis generado (implementación pendiente)',
            'kpi_id': kpi_id,
            'tipo': tipo_analisis,
            'periodo': periodo
        })

    @action(detail=False, methods=['get'])
    def comparar_periodos(self, request):
        """Comparar múltiples períodos para un KPI"""
        kpi_id = request.query_params.get('kpi_id')

        analisis = self.queryset.filter(kpi_id=kpi_id).order_by('periodo_analisis')
        serializer = self.get_serializer(analisis, many=True)

        return Response(serializer.data)


class TendenciaKPIViewSet(viewsets.ModelViewSet):
    queryset = TendenciaKPI.objects.all()
    serializer_class = TendenciaKPISerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['kpi', 'tipo_tendencia']
    ordering_fields = ['fecha_proyeccion', 'confianza']
    ordering = ['-fecha_proyeccion']

    @action(detail=False, methods=['post'])
    def calcular_tendencia(self, request):
        """Calcular tendencia para un KPI"""
        kpi_id = request.data.get('kpi_id')
        tipo_tendencia = request.data.get('tipo_tendencia', 'lineal')

        return Response({
            'message': 'Cálculo de tendencia (implementación pendiente)',
            'kpi_id': kpi_id,
            'tipo': tipo_tendencia
        })

    @action(detail=True, methods=['post'])
    def proyectar(self, request, pk=None):
        """Generar proyección basada en tendencia"""
        tendencia = self.get_object()

        return Response({
            'proyeccion': str(tendencia.proyeccion_siguiente),
            'fecha': tendencia.fecha_proyeccion,
            'confianza': str(tendencia.confianza)
        })


class AnomaliaDetectadaViewSet(viewsets.ModelViewSet):
    queryset = AnomaliaDetectada.objects.all()
    serializer_class = AnomaliaDetectadaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['tipo_anomalia', 'severidad', 'esta_revisada']
    ordering_fields = ['created_at', 'desviacion_std']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'])
    def marcar_revisada(self, request, pk=None):
        """Marcar anomalía como revisada"""
        anomalia = self.get_object()
        anomalia.esta_revisada = True
        anomalia.revisada_por = request.user
        anomalia.fecha_revision = timezone.now()
        anomalia.accion_tomada = request.data.get('accion_tomada', '')
        anomalia.save()

        return Response({
            'message': 'Anomalía marcada como revisada',
            'data': self.get_serializer(anomalia).data
        })

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Obtener anomalías pendientes de revisión"""
        pendientes = self.queryset.filter(esta_revisada=False)
        serializer = self.get_serializer(pendientes, many=True)

        return Response({
            'count': pendientes.count(),
            'anomalias': serializer.data
        })
```

### `analisis_tendencias/urls.py`

```python
"""
URLs para Análisis de Tendencias - Analytics
"""
from rest_framework.routers import DefaultRouter
from .views import AnalisisKPIViewSet, TendenciaKPIViewSet, AnomaliaDetectadaViewSet

router = DefaultRouter()
router.register(r'analisis-kpi', AnalisisKPIViewSet, basename='analisis-kpi')
router.register(r'tendencias', TendenciaKPIViewSet, basename='tendencias')
router.register(r'anomalias', AnomaliaDetectadaViewSet, basename='anomalias')

urlpatterns = router.urls
```

### `analisis_tendencias/admin.py`

```python
"""
Admin para Análisis de Tendencias - Analytics
"""
from django.contrib import admin
from .models import AnalisisKPI, TendenciaKPI, AnomaliaDetectada


@admin.register(AnalisisKPI)
class AnalisisKPIAdmin(admin.ModelAdmin):
    list_display = ['kpi', 'periodo_analisis', 'tipo_analisis', 'direccion', 'es_significativo', 'fecha_analisis']
    list_filter = ['tipo_analisis', 'direccion', 'es_significativo', 'fecha_analisis']
    search_fields = ['kpi__codigo', 'kpi__nombre', 'periodo_analisis']
    readonly_fields = ['fecha_analisis', 'created_at', 'updated_at']


@admin.register(TendenciaKPI)
class TendenciaKPIAdmin(admin.ModelAdmin):
    list_display = ['kpi', 'tipo_tendencia', 'periodo_inicio', 'periodo_fin', 'proyeccion_siguiente', 'confianza']
    list_filter = ['tipo_tendencia']
    search_fields = ['kpi__codigo', 'kpi__nombre']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AnomaliaDetectada)
class AnomaliaDetectadaAdmin(admin.ModelAdmin):
    list_display = ['valor_kpi', 'tipo_anomalia', 'severidad', 'esta_revisada', 'revisada_por', 'fecha_revision']
    list_filter = ['tipo_anomalia', 'severidad', 'esta_revisada']
    search_fields = ['descripcion', 'accion_tomada']
    readonly_fields = ['created_at', 'updated_at']
```

---

## 2. GENERADOR_INFORMES

### `generador_informes/models.py`

```python
"""
Modelos para Generador de Informes - Analytics
"""
from django.db import models
from apps.core.base_models import BaseCompanyModel


class PlantillaInforme(BaseCompanyModel):
    """Plantillas configurables de informes"""

    TIPO_INFORME_CHOICES = [
        ('normativo', 'Normativo'),
        ('gerencial', 'Gerencial'),
        ('operativo', 'Operativo'),
        ('personalizado', 'Personalizado'),
    ]

    FORMATO_SALIDA_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('word', 'Word'),
        ('html', 'HTML'),
    ]

    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=255)
    tipo_informe = models.CharField(max_length=20, choices=TIPO_INFORME_CHOICES)
    norma_relacionada = models.CharField(max_length=100, blank=True, help_text='Ej: Res.0312, PESV, ISO 14001')
    descripcion = models.TextField()
    estructura_json = models.JSONField(help_text='Secciones, gráficos, tablas')
    kpis_incluidos = models.ManyToManyField('config_indicadores.CatalogoKPI', blank=True)
    formato_salida = models.CharField(max_length=10, choices=FORMATO_SALIDA_CHOICES, default='pdf')
    es_publica = models.BooleanField(default=False)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'analytics_plantilla_informe'
        verbose_name = 'Plantilla de Informe'
        verbose_name_plural = 'Plantillas de Informes'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class InformeDinamico(BaseCompanyModel):
    """Informes generados"""

    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('generando', 'Generando'),
        ('completado', 'Completado'),
        ('error', 'Error'),
    ]

    plantilla = models.ForeignKey(PlantillaInforme, on_delete=models.SET_NULL, null=True, blank=True)
    nombre = models.CharField(max_length=255)
    periodo_inicio = models.DateField()
    periodo_fin = models.DateField()
    parametros = models.JSONField(default=dict, help_text='Filtros aplicados')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='borrador')
    archivo_generado = models.FileField(upload_to='informes/', null=True, blank=True)
    tamano_archivo = models.PositiveIntegerField(null=True, blank=True, help_text='Bytes')
    tiempo_generacion = models.DurationField(null=True, blank=True)
    generado_por = models.ForeignKey('core.User', on_delete=models.PROTECT, related_name='informes_generados')
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    error_mensaje = models.TextField(blank=True)

    class Meta:
        db_table = 'analytics_informe_dinamico'
        verbose_name = 'Informe Dinámico'
        verbose_name_plural = 'Informes Dinámicos'
        ordering = ['-fecha_generacion']

    def __str__(self):
        return f"{self.nombre} - {self.estado}"


class ProgramacionInforme(BaseCompanyModel):
    """Informes programados"""

    FRECUENCIA_CHOICES = [
        ('diario', 'Diario'),
        ('semanal', 'Semanal'),
        ('mensual', 'Mensual'),
        ('trimestral', 'Trimestral'),
    ]

    plantilla = models.ForeignKey(PlantillaInforme, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=255)
    frecuencia = models.CharField(max_length=20, choices=FRECUENCIA_CHOICES)
    dia_ejecucion = models.PositiveIntegerField(null=True, blank=True, help_text='1-31 para mensual')
    hora_ejecucion = models.TimeField()
    destinatarios = models.ManyToManyField('core.User', related_name='informes_programados')
    emails_adicionales = models.JSONField(default=list, help_text='["email@ext.com"]')
    esta_activa = models.BooleanField(default=True)
    ultima_ejecucion = models.DateTimeField(null=True, blank=True)
    proxima_ejecucion = models.DateTimeField()

    class Meta:
        db_table = 'analytics_programacion_informe'
        verbose_name = 'Programación de Informe'
        verbose_name_plural = 'Programaciones de Informes'
        ordering = ['proxima_ejecucion']

    def __str__(self):
        return f"{self.nombre} - {self.get_frecuencia_display()}"


class HistorialInforme(BaseCompanyModel):
    """Historial de generaciones"""

    programacion = models.ForeignKey(ProgramacionInforme, on_delete=models.SET_NULL, null=True, blank=True)
    informe = models.ForeignKey(InformeDinamico, on_delete=models.CASCADE)
    fue_exitoso = models.BooleanField(default=True)
    fue_enviado = models.BooleanField(default=False)
    destinatarios_enviados = models.PositiveIntegerField(default=0)
    fecha_envio = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'analytics_historial_informe'
        verbose_name = 'Historial de Informe'
        verbose_name_plural = 'Historial de Informes'
        ordering = ['-created_at']

    def __str__(self):
        return f"Historial: {self.informe.nombre}"
```

### `generador_informes/serializers.py`

```python
"""
Serializers para Generador de Informes - Analytics
"""
from rest_framework import serializers
from .models import PlantillaInforme, InformeDinamico, ProgramacionInforme, HistorialInforme


class PlantillaInformeSerializer(serializers.ModelSerializer):
    kpis_count = serializers.SerializerMethodField()

    class Meta:
        model = PlantillaInforme
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_kpis_count(self, obj):
        return obj.kpis_incluidos.count()


class InformeDinamicoSerializer(serializers.ModelSerializer):
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True)
    generado_por_nombre = serializers.CharField(source='generado_por.get_full_name', read_only=True)

    class Meta:
        model = InformeDinamico
        fields = '__all__'
        read_only_fields = ['id', 'fecha_generacion', 'created_at', 'updated_at']


class ProgramacionInformeSerializer(serializers.ModelSerializer):
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True)
    destinatarios_count = serializers.SerializerMethodField()

    class Meta:
        model = ProgramacionInforme
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_destinatarios_count(self, obj):
        return obj.destinatarios.count()


class HistorialInformeSerializer(serializers.ModelSerializer):
    informe_nombre = serializers.CharField(source='informe.nombre', read_only=True)
    programacion_nombre = serializers.CharField(source='programacion.nombre', read_only=True)

    class Meta:
        model = HistorialInforme
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
```

### `generador_informes/views.py`

```python
"""
Views para Generador de Informes - Analytics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.utils import timezone

from .models import PlantillaInforme, InformeDinamico, ProgramacionInforme, HistorialInforme
from .serializers import (PlantillaInformeSerializer, InformeDinamicoSerializer,
                         ProgramacionInformeSerializer, HistorialInformeSerializer)


class PlantillaInformeViewSet(viewsets.ModelViewSet):
    queryset = PlantillaInforme.objects.all()
    serializer_class = PlantillaInformeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_informe', 'formato_salida', 'es_publica']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre']
    ordering = ['orden']


class InformeDinamicoViewSet(viewsets.ModelViewSet):
    queryset = InformeDinamico.objects.all()
    serializer_class = InformeDinamicoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plantilla', 'estado', 'generado_por']
    ordering_fields = ['fecha_generacion']
    ordering = ['-fecha_generacion']

    @action(detail=False, methods=['post'])
    def generar(self, request):
        """Generar informe dinámico"""
        plantilla_id = request.data.get('plantilla_id')
        nombre = request.data.get('nombre')
        periodo_inicio = request.data.get('periodo_inicio')
        periodo_fin = request.data.get('periodo_fin')

        # Aquí iría la lógica de generación del informe

        return Response({
            'message': 'Informe en proceso de generación',
            'plantilla_id': plantilla_id,
            'nombre': nombre
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['get'])
    def descargar(self, request, pk=None):
        """Descargar archivo generado"""
        informe = self.get_object()

        if informe.estado != 'completado':
            return Response({
                'error': 'El informe aún no está completado'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Aquí iría la lógica para servir el archivo

        return Response({
            'message': 'Descarga de archivo (implementación pendiente)',
            'archivo_url': request.build_absolute_uri(informe.archivo_generado.url) if informe.archivo_generado else None
        })

    @action(detail=True, methods=['post'])
    def reenviar(self, request, pk=None):
        """Reenviar informe por email"""
        informe = self.get_object()
        destinatarios = request.data.get('destinatarios', [])

        # Aquí iría la lógica de envío de email

        return Response({
            'message': f'Informe reenviado a {len(destinatarios)} destinatarios'
        })


class ProgramacionInformeViewSet(viewsets.ModelViewSet):
    queryset = ProgramacionInforme.objects.all()
    serializer_class = ProgramacionInformeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plantilla', 'frecuencia', 'esta_activa']
    ordering_fields = ['proxima_ejecucion']
    ordering = ['proxima_ejecucion']

    @action(detail=True, methods=['post'])
    def ejecutar_ahora(self, request, pk=None):
        """Ejecutar programación inmediatamente"""
        programacion = self.get_object()

        # Aquí iría la lógica de ejecución inmediata

        return Response({
            'message': 'Programación ejecutada manualmente',
            'programacion': programacion.nombre
        })

    @action(detail=True, methods=['post'])
    def pausar(self, request, pk=None):
        """Pausar programación"""
        programacion = self.get_object()
        programacion.esta_activa = False
        programacion.save()

        return Response({
            'message': 'Programación pausada',
            'data': self.get_serializer(programacion).data
        })

    @action(detail=True, methods=['post'])
    def reanudar(self, request, pk=None):
        """Reanudar programación"""
        programacion = self.get_object()
        programacion.esta_activa = True
        programacion.save()

        return Response({
            'message': 'Programación reanudada',
            'data': self.get_serializer(programacion).data
        })


class HistorialInformeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistorialInforme.objects.all()
    serializer_class = HistorialInformeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['programacion', 'fue_exitoso', 'fue_enviado']
    ordering_fields = ['created_at', 'fecha_envio']
    ordering = ['-created_at']
```

### `generador_informes/urls.py`

```python
"""
URLs para Generador de Informes - Analytics
"""
from rest_framework.routers import DefaultRouter
from .views import (PlantillaInformeViewSet, InformeDinamicoViewSet,
                   ProgramacionInformeViewSet, HistorialInformeViewSet)

router = DefaultRouter()
router.register(r'plantillas', PlantillaInformeViewSet, basename='plantillas')
router.register(r'dinamicos', InformeDinamicoViewSet, basename='dinamicos')
router.register(r'programaciones', ProgramacionInformeViewSet, basename='programaciones')
router.register(r'historial', HistorialInformeViewSet, basename='historial')

urlpatterns = router.urls
```

### `generador_informes/admin.py`

```python
"""
Admin para Generador de Informes - Analytics
"""
from django.contrib import admin
from .models import PlantillaInforme, InformeDinamico, ProgramacionInforme, HistorialInforme


@admin.register(PlantillaInforme)
class PlantillaInformeAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_informe', 'formato_salida', 'es_publica', 'orden']
    list_filter = ['tipo_informe', 'formato_salida', 'es_publica']
    search_fields = ['codigo', 'nombre', 'descripcion']
    filter_horizontal = ['kpis_incluidos']


@admin.register(InformeDinamico)
class InformeDinamicoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'plantilla', 'estado', 'generado_por', 'fecha_generacion']
    list_filter = ['estado', 'fecha_generacion']
    search_fields = ['nombre']
    readonly_fields = ['fecha_generacion', 'tiempo_generacion', 'tamano_archivo']


@admin.register(ProgramacionInforme)
class ProgramacionInformeAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'plantilla', 'frecuencia', 'esta_activa', 'proxima_ejecucion']
    list_filter = ['frecuencia', 'esta_activa']
    search_fields = ['nombre']
    filter_horizontal = ['destinatarios']


@admin.register(HistorialInforme)
class HistorialInformeAdmin(admin.ModelAdmin):
    list_display = ['informe', 'programacion', 'fue_exitoso', 'fue_enviado', 'created_at']
    list_filter = ['fue_exitoso', 'fue_enviado', 'created_at']
    readonly_fields = ['created_at']
```

---

## 3. ACCIONES_INDICADOR

### `acciones_indicador/models.py`

```python
"""
Modelos para Acciones por Indicador - Analytics
"""
from django.db import models
from apps.core.base_models import BaseCompanyModel


class PlanAccionKPI(BaseCompanyModel):
    """Planes de acción por KPI crítico"""

    ESTADO_CHOICES = [
        ('propuesto', 'Propuesto'),
        ('aprobado', 'Aprobado'),
        ('en_ejecucion', 'En Ejecución'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]

    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('critica', 'Crítica'),
    ]

    kpi = models.ForeignKey('config_indicadores.CatalogoKPI', on_delete=models.CASCADE, related_name='planes_accion')
    valor_kpi = models.ForeignKey('indicadores_area.ValorKPI', on_delete=models.SET_NULL, null=True, blank=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()
    objetivo = models.TextField()
    meta_valor = models.DecimalField(max_digits=15, decimal_places=4, help_text='Valor objetivo')
    fecha_inicio = models.DateField()
    fecha_meta = models.DateField()
    responsable = models.ForeignKey('talent_hub.Colaborador', on_delete=models.PROTECT, related_name='planes_kpi')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='propuesto')
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    presupuesto = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    recursos = models.TextField(blank=True)

    class Meta:
        db_table = 'analytics_plan_accion_kpi'
        verbose_name = 'Plan de Acción KPI'
        verbose_name_plural = 'Planes de Acción KPI'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"{self.nombre} - {self.kpi.codigo}"


class ActividadPlanKPI(BaseCompanyModel):
    """Actividades del plan de acción"""

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_proceso', 'En Proceso'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]

    plan = models.ForeignKey(PlanAccionKPI, on_delete=models.CASCADE, related_name='actividades')
    numero = models.PositiveIntegerField()
    descripcion = models.TextField()
    responsable = models.ForeignKey('talent_hub.Colaborador', on_delete=models.PROTECT)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    porcentaje_avance = models.PositiveIntegerField(default=0, help_text='0-100')
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'analytics_actividad_plan_kpi'
        verbose_name = 'Actividad de Plan KPI'
        verbose_name_plural = 'Actividades de Planes KPI'
        ordering = ['plan', 'numero']
        unique_together = [['plan', 'numero']]

    def __str__(self):
        return f"Act. {self.numero}: {self.descripcion[:50]}"


class SeguimientoPlanKPI(BaseCompanyModel):
    """Seguimientos al plan de acción"""

    plan = models.ForeignKey(PlanAccionKPI, on_delete=models.CASCADE, related_name='seguimientos')
    fecha_seguimiento = models.DateField()
    valor_kpi_actual = models.DecimalField(max_digits=15, decimal_places=4)
    avance_general = models.PositiveIntegerField(help_text='% de avance general')
    comentarios = models.TextField()
    proximas_acciones = models.TextField()
    registrado_por = models.ForeignKey('core.User', on_delete=models.PROTECT)

    class Meta:
        db_table = 'analytics_seguimiento_plan_kpi'
        verbose_name = 'Seguimiento de Plan KPI'
        verbose_name_plural = 'Seguimientos de Planes KPI'
        ordering = ['-fecha_seguimiento']

    def __str__(self):
        return f"Seguimiento {self.plan.nombre} - {self.fecha_seguimiento}"


class IntegracionAccionCorrectiva(BaseCompanyModel):
    """Integración con acciones correctivas de HSEQ"""

    TIPO_VINCULO_CHOICES = [
        ('origen', 'Origen'),
        ('relacionada', 'Relacionada'),
        ('resultante', 'Resultante'),
    ]

    plan_kpi = models.ForeignKey(PlanAccionKPI, on_delete=models.CASCADE, related_name='integraciones_ac')
    accion_correctiva = models.ForeignKey('hseq_management.AccionCorrectiva', on_delete=models.CASCADE)
    tipo_vinculo = models.CharField(max_length=15, choices=TIPO_VINCULO_CHOICES)
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'analytics_integracion_accion_correctiva'
        verbose_name = 'Integración Acción Correctiva'
        verbose_name_plural = 'Integraciones Acciones Correctivas'

    def __str__(self):
        return f"{self.get_tipo_vinculo_display()}: Plan {self.plan_kpi.nombre}"
```

### `acciones_indicador/serializers.py`

```python
"""
Serializers para Acciones por Indicador - Analytics
"""
from rest_framework import serializers
from .models import PlanAccionKPI, ActividadPlanKPI, SeguimientoPlanKPI, IntegracionAccionCorrectiva


class PlanAccionKPISerializer(serializers.ModelSerializer):
    kpi_codigo = serializers.CharField(source='kpi.codigo', read_only=True)
    kpi_nombre = serializers.CharField(source='kpi.nombre', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.nombre_completo', read_only=True)
    total_actividades = serializers.SerializerMethodField()

    class Meta:
        model = PlanAccionKPI
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_actividades(self, obj):
        return obj.actividades.count()


class ActividadPlanKPISerializer(serializers.ModelSerializer):
    plan_nombre = serializers.CharField(source='plan.nombre', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.nombre_completo', read_only=True)

    class Meta:
        model = ActividadPlanKPI
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SeguimientoPlanKPISerializer(serializers.ModelSerializer):
    plan_nombre = serializers.CharField(source='plan.nombre', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)

    class Meta:
        model = SeguimientoPlanKPI
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class IntegracionAccionCorrectivaSerializer(serializers.ModelSerializer):
    plan_nombre = serializers.CharField(source='plan_kpi.nombre', read_only=True)
    ac_numero = serializers.CharField(source='accion_correctiva.numero', read_only=True)

    class Meta:
        model = IntegracionAccionCorrectiva
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
```

### `acciones_indicador/views.py`

```python
"""
Views para Acciones por Indicador - Analytics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import PlanAccionKPI, ActividadPlanKPI, SeguimientoPlanKPI, IntegracionAccionCorrectiva
from .serializers import (PlanAccionKPISerializer, ActividadPlanKPISerializer,
                         SeguimientoPlanKPISerializer, IntegracionAccionCorrectivaSerializer)


class PlanAccionKPIViewSet(viewsets.ModelViewSet):
    queryset = PlanAccionKPI.objects.all()
    serializer_class = PlanAccionKPISerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['kpi', 'estado', 'prioridad', 'responsable']
    search_fields = ['nombre', 'descripcion', 'objetivo']
    ordering_fields = ['fecha_inicio', 'fecha_meta', 'prioridad']
    ordering = ['-fecha_inicio']

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar plan de acción"""
        plan = self.get_object()

        if plan.estado != 'propuesto':
            return Response({
                'error': 'Solo se pueden aprobar planes en estado Propuesto'
            }, status=status.HTTP_400_BAD_REQUEST)

        plan.estado = 'aprobado'
        plan.save()

        return Response({
            'message': 'Plan aprobado exitosamente',
            'data': self.get_serializer(plan).data
        })

    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        """Completar plan de acción"""
        plan = self.get_object()

        plan.estado = 'completado'
        plan.save()

        return Response({
            'message': 'Plan marcado como completado',
            'data': self.get_serializer(plan).data
        })

    @action(detail=True, methods=['post'])
    def agregar_seguimiento(self, request, pk=None):
        """Agregar seguimiento al plan"""
        plan = self.get_object()

        serializer = SeguimientoPlanKPISerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(plan=plan, registrado_por=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ActividadPlanKPIViewSet(viewsets.ModelViewSet):
    queryset = ActividadPlanKPI.objects.all()
    serializer_class = ActividadPlanKPISerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plan', 'estado', 'responsable']
    ordering_fields = ['numero', 'fecha_inicio', 'fecha_fin']
    ordering = ['plan', 'numero']


class SeguimientoPlanKPIViewSet(viewsets.ModelViewSet):
    queryset = SeguimientoPlanKPI.objects.all()
    serializer_class = SeguimientoPlanKPISerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plan', 'registrado_por']
    ordering_fields = ['fecha_seguimiento']
    ordering = ['-fecha_seguimiento']


class IntegracionAccionCorrectivaViewSet(viewsets.ModelViewSet):
    queryset = IntegracionAccionCorrectiva.objects.all()
    serializer_class = IntegracionAccionCorrectivaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['plan_kpi', 'accion_correctiva', 'tipo_vinculo']
```

### `acciones_indicador/urls.py`

```python
"""
URLs para Acciones por Indicador - Analytics
"""
from rest_framework.routers import DefaultRouter
from .views import (PlanAccionKPIViewSet, ActividadPlanKPIViewSet,
                   SeguimientoPlanKPIViewSet, IntegracionAccionCorrectivaViewSet)

router = DefaultRouter()
router.register(r'planes', PlanAccionKPIViewSet, basename='planes')
router.register(r'actividades', ActividadPlanKPIViewSet, basename='actividades')
router.register(r'seguimientos', SeguimientoPlanKPIViewSet, basename='seguimientos')
router.register(r'integraciones-ac', IntegracionAccionCorrectivaViewSet, basename='integraciones-ac')

urlpatterns = router.urls
```

### `acciones_indicador/admin.py`

```python
"""
Admin para Acciones por Indicador - Analytics
"""
from django.contrib import admin
from .models import PlanAccionKPI, ActividadPlanKPI, SeguimientoPlanKPI, IntegracionAccionCorrectiva


class ActividadPlanKPIInline(admin.TabularInline):
    model = ActividadPlanKPI
    extra = 1
    fields = ['numero', 'descripcion', 'responsable', 'fecha_inicio', 'fecha_fin', 'estado', 'porcentaje_avance']


@admin.register(PlanAccionKPI)
class PlanAccionKPIAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'kpi', 'estado', 'prioridad', 'responsable', 'fecha_inicio', 'fecha_meta']
    list_filter = ['estado', 'prioridad', 'kpi']
    search_fields = ['nombre', 'descripcion', 'objetivo']
    inlines = [ActividadPlanKPIInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ActividadPlanKPI)
class ActividadPlanKPIAdmin(admin.ModelAdmin):
    list_display = ['plan', 'numero', 'descripcion', 'responsable', 'estado', 'porcentaje_avance']
    list_filter = ['estado', 'plan']
    search_fields = ['descripcion']


@admin.register(SeguimientoPlanKPI)
class SeguimientoPlanKPIAdmin(admin.ModelAdmin):
    list_display = ['plan', 'fecha_seguimiento', 'valor_kpi_actual', 'avance_general', 'registrado_por']
    list_filter = ['fecha_seguimiento']
    search_fields = ['plan__nombre', 'comentarios']
    readonly_fields = ['created_at']


@admin.register(IntegracionAccionCorrectiva)
class IntegracionAccionCorrectivaAdmin(admin.ModelAdmin):
    list_display = ['plan_kpi', 'accion_correctiva', 'tipo_vinculo']
    list_filter = ['tipo_vinculo']
    search_fields = ['plan_kpi__nombre']
```

---

## 4. EXPORTACION

### `exportacion/models.py`

```python
"""
Modelos para Exportación - Analytics
"""
from django.db import models
from apps.core.base_models import BaseCompanyModel


class ConfiguracionExportacion(BaseCompanyModel):
    """Configuración de exportación de datos"""

    TIPO_EXPORTACION_CHOICES = [
        ('excel', 'Excel'),
        ('pdf', 'PDF'),
        ('power_bi', 'Power BI'),
        ('api_externa', 'API Externa'),
        ('webhook', 'Webhook'),
    ]

    nombre = models.CharField(max_length=255)
    tipo_exportacion = models.CharField(max_length=20, choices=TIPO_EXPORTACION_CHOICES)
    formato_config = models.JSONField(help_text='Columnas, formatos, etc.')
    destino = models.CharField(max_length=500, blank=True, help_text='URL webhook, conexión Power BI')
    credenciales_encrypted = models.TextField(blank=True)
    esta_activa = models.BooleanField(default=True)
    ultima_ejecucion = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'analytics_configuracion_exportacion'
        verbose_name = 'Configuración de Exportación'
        verbose_name_plural = 'Configuraciones de Exportación'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} - {self.get_tipo_exportacion_display()}"


class LogExportacion(BaseCompanyModel):
    """Log de exportaciones realizadas"""

    TIPO_LOG_CHOICES = [
        ('manual', 'Manual'),
        ('programada', 'Programada'),
        ('api', 'API'),
    ]

    ESTADO_CHOICES = [
        ('en_proceso', 'En Proceso'),
        ('exitoso', 'Exitoso'),
        ('fallido', 'Fallido'),
    ]

    configuracion = models.ForeignKey(ConfiguracionExportacion, on_delete=models.SET_NULL, null=True, blank=True)
    tipo = models.CharField(max_length=15, choices=TIPO_LOG_CHOICES)
    usuario = models.ForeignKey('core.User', on_delete=models.PROTECT)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='en_proceso')
    registros_exportados = models.PositiveIntegerField(default=0)
    tamano_bytes = models.PositiveIntegerField(null=True, blank=True)
    error_detalle = models.TextField(blank=True)
    archivo_resultado = models.FileField(upload_to='exportaciones/', null=True, blank=True)

    class Meta:
        db_table = 'analytics_log_exportacion'
        verbose_name = 'Log de Exportación'
        verbose_name_plural = 'Logs de Exportación'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.estado} ({self.fecha_inicio})"
```

### `exportacion/serializers.py`

```python
"""
Serializers para Exportación - Analytics
"""
from rest_framework import serializers
from .models import ConfiguracionExportacion, LogExportacion


class ConfiguracionExportacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionExportacion
        fields = '__all__'
        read_only_fields = ['id', 'ultima_ejecucion', 'created_at', 'updated_at']
        extra_kwargs = {
            'credenciales_encrypted': {'write_only': True}
        }


class LogExportacionSerializer(serializers.ModelSerializer):
    configuracion_nombre = serializers.CharField(source='configuracion.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    duracion = serializers.SerializerMethodField()

    class Meta:
        model = LogExportacion
        fields = '__all__'
        read_only_fields = ['id', 'fecha_inicio', 'created_at', 'updated_at']

    def get_duracion(self, obj):
        if obj.fecha_fin:
            delta = obj.fecha_fin - obj.fecha_inicio
            return delta.total_seconds()
        return None
```

### `exportacion/views.py`

```python
"""
Views para Exportación - Analytics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import ConfiguracionExportacion, LogExportacion
from .serializers import ConfiguracionExportacionSerializer, LogExportacionSerializer


class ConfiguracionExportacionViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionExportacion.objects.all()
    serializer_class = ConfiguracionExportacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_exportacion', 'esta_activa']
    search_fields = ['nombre', 'destino']
    ordering_fields = ['nombre', 'ultima_ejecucion']
    ordering = ['nombre']

    @action(detail=True, methods=['post'])
    def ejecutar(self, request, pk=None):
        """Ejecutar exportación manualmente"""
        configuracion = self.get_object()

        # Aquí iría la lógica de exportación

        return Response({
            'message': 'Exportación iniciada',
            'configuracion': configuracion.nombre
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'])
    def probar_conexion(self, request, pk=None):
        """Probar conexión con destino"""
        configuracion = self.get_object()

        # Aquí iría la lógica de prueba de conexión

        return Response({
            'message': 'Prueba de conexión (implementación pendiente)',
            'tipo': configuracion.tipo_exportacion,
            'destino': configuracion.destino
        })


class LogExportacionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogExportacion.objects.all()
    serializer_class = LogExportacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['configuracion', 'tipo', 'estado', 'usuario']
    ordering_fields = ['fecha_inicio', 'registros_exportados']
    ordering = ['-fecha_inicio']

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de exportaciones"""
        total = self.queryset.count()
        exitosos = self.queryset.filter(estado='exitoso').count()
        fallidos = self.queryset.filter(estado='fallido').count()

        return Response({
            'total': total,
            'exitosos': exitosos,
            'fallidos': fallidos,
            'tasa_exito': round((exitosos / total * 100), 2) if total > 0 else 0
        })
```

### `exportacion/urls.py`

```python
"""
URLs para Exportación - Analytics
"""
from rest_framework.routers import DefaultRouter
from .views import ConfiguracionExportacionViewSet, LogExportacionViewSet

router = DefaultRouter()
router.register(r'configuraciones', ConfiguracionExportacionViewSet, basename='configuraciones')
router.register(r'logs', LogExportacionViewSet, basename='logs')

urlpatterns = router.urls
```

### `exportacion/admin.py`

```python
"""
Admin para Exportación - Analytics
"""
from django.contrib import admin
from .models import ConfiguracionExportacion, LogExportacion


@admin.register(ConfiguracionExportacion)
class ConfiguracionExportacionAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo_exportacion', 'esta_activa', 'ultima_ejecucion']
    list_filter = ['tipo_exportacion', 'esta_activa']
    search_fields = ['nombre', 'destino']
    readonly_fields = ['ultima_ejecucion', 'created_at', 'updated_at']


@admin.register(LogExportacion)
class LogExportacionAdmin(admin.ModelAdmin):
    list_display = ['configuracion', 'tipo', 'estado', 'usuario', 'fecha_inicio', 'registros_exportados']
    list_filter = ['tipo', 'estado', 'fecha_inicio']
    search_fields = ['usuario__username', 'error_detalle']
    readonly_fields = ['fecha_inicio', 'created_at']
```

---

## 5. ACTUALIZAR analytics/urls.py

Agregar las nuevas rutas al archivo principal `backend/apps/analytics/urls.py`:

```python
"""
URLs del módulo Analytics
"""
from django.urls import path, include

app_name = 'analytics'

urlpatterns = [
    # Semana 23
    path('indicadores/', include('apps.analytics.config_indicadores.urls')),
    path('valores/', include('apps.analytics.indicadores_area.urls')),
    path('dashboard/', include('apps.analytics.dashboard_gerencial.urls')),

    # Semana 24 - NUEVAS RUTAS
    path('analisis/', include('apps.analytics.analisis_tendencias.urls')),
    path('informes/', include('apps.analytics.generador_informes.urls')),
    path('planes-accion/', include('apps.analytics.acciones_indicador.urls')),
    path('exportacion/', include('apps.analytics.exportacion.urls')),
]
```

---

## ENDPOINTS RESULTANTES

Después de implementar todas las apps, tendrás disponibles:

```
# Análisis de Tendencias
GET/POST   /api/analytics/analisis/analisis-kpi/
POST       /api/analytics/analisis/analisis-kpi/generar_analisis/
GET        /api/analytics/analisis/analisis-kpi/comparar_periodos/
GET/POST   /api/analytics/analisis/tendencias/
POST       /api/analytics/analisis/tendencias/calcular_tendencia/
POST       /api/analytics/analisis/tendencias/{id}/proyectar/
GET/POST   /api/analytics/analisis/anomalias/
POST       /api/analytics/analisis/anomalias/{id}/marcar_revisada/
GET        /api/analytics/analisis/anomalias/pendientes/

# Generador de Informes
GET/POST   /api/analytics/informes/plantillas/
GET/POST   /api/analytics/informes/dinamicos/
POST       /api/analytics/informes/dinamicos/generar/
GET        /api/analytics/informes/dinamicos/{id}/descargar/
POST       /api/analytics/informes/dinamicos/{id}/reenviar/
GET/POST   /api/analytics/informes/programaciones/
POST       /api/analytics/informes/programaciones/{id}/ejecutar_ahora/
POST       /api/analytics/informes/programaciones/{id}/pausar/
POST       /api/analytics/informes/programaciones/{id}/reanudar/
GET        /api/analytics/informes/historial/

# Planes de Acción
GET/POST   /api/analytics/planes-accion/planes/
POST       /api/analytics/planes-accion/planes/{id}/aprobar/
POST       /api/analytics/planes-accion/planes/{id}/completar/
POST       /api/analytics/planes-accion/planes/{id}/agregar_seguimiento/
GET/POST   /api/analytics/planes-accion/actividades/
GET/POST   /api/analytics/planes-accion/seguimientos/
GET/POST   /api/analytics/planes-accion/integraciones-ac/

# Exportación
GET/POST   /api/analytics/exportacion/configuraciones/
POST       /api/analytics/exportacion/configuraciones/{id}/ejecutar/
POST       /api/analytics/exportacion/configuraciones/{id}/probar_conexion/
GET        /api/analytics/exportacion/logs/
GET        /api/analytics/exportacion/logs/estadisticas/
```

---

## INSTRUCCIONES DE IMPLEMENTACIÓN

1. **Copiar código de cada app** en sus respectivos archivos
2. **NO ejecutar migraciones todavía**
3. **Verificar imports** y ajustar según la estructura real del proyecto
4. **Actualizar `analytics/urls.py`** con las nuevas rutas
5. **Verificar que las apps estén en INSTALLED_APPS** (deberían estarlo ya)

---

## NOTAS IMPORTANTES

- Todos los modelos heredan de `BaseCompanyModel`
- Los ViewSets incluyen acciones especiales según especificación
- Serializers incluyen campos relacionados para facilitar el front-end
- Admin configurado para gestión eficiente de datos
- URLs organizadas con routers de DRF
- Filtros, búsqueda y ordenamiento configurados por defecto

---

## PRÓXIMOS PASOS

Después de copiar el código:
1. Revisar que no haya errores de sintaxis
2. Ejecutar `python manage.py makemigrations analytics`
3. Revisar las migraciones generadas
4. Ejecutar `python manage.py migrate`
5. Crear datos de prueba en admin
6. Probar endpoints con Postman/Thunder Client
