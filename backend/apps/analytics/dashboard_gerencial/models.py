"""
Modelos para Dashboard Gerencial - Analytics
============================================

Define la configuración de dashboards:
- VistaDashboard: Vistas configurables de dashboard
- WidgetDashboard: Widgets individuales (KPI cards, gráficos, etc.)
- FavoritoDashboard: Dashboards favoritos por usuario
"""
from django.db import models
from django.conf import settings
from apps.core.base_models import BaseCompanyModel, OrderedModel


class VistaDashboard(BaseCompanyModel, OrderedModel):
    """
    Vistas de dashboard configurables.
    Define diferentes perspectivas para visualizar KPIs.
    """

    PERSPECTIVA_BSC_CHOICES = [
        ('financiera', 'Perspectiva Financiera'),
        ('cliente', 'Perspectiva del Cliente'),
        ('procesos', 'Perspectiva de Procesos Internos'),
        ('aprendizaje', 'Perspectiva de Aprendizaje y Crecimiento'),
        ('general', 'General'),
    ]

    nombre = models.CharField(
        max_length=255,
        verbose_name='Nombre',
        help_text='Nombre de la vista de dashboard'
    )
    codigo = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Código',
        help_text='Código único de la vista (ej: DASH-FINANCIERO)'
    )
    perspectiva_bsc = models.CharField(
        max_length=20,
        choices=PERSPECTIVA_BSC_CHOICES,
        verbose_name='Perspectiva BSC',
        help_text='Perspectiva del Balanced Scorecard'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción de la vista y su propósito'
    )
    es_publica = models.BooleanField(
        default=True,
        verbose_name='¿Es Pública?',
        help_text='True = visible para todos, False = solo para roles específicos'
    )
    roles_permitidos = models.ManyToManyField(
        'core.Rol',
        blank=True,
        related_name='dashboards_permitidos',
        verbose_name='Roles Permitidos',
        help_text='Roles que pueden ver esta vista (solo si no es pública)'
    )

    class Meta:
        db_table = 'analytics_vista_dashboard'
        verbose_name = 'Vista de Dashboard'
        verbose_name_plural = 'Vistas de Dashboard'
        ordering = ['orden', 'nombre']
        unique_together = [['empresa', 'codigo']]
        indexes = [
            models.Index(fields=['empresa', 'perspectiva_bsc']),
            models.Index(fields=['empresa', 'es_publica']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class WidgetDashboard(BaseCompanyModel, OrderedModel):
    """
    Widgets individuales dentro de una vista de dashboard.
    Cada widget puede mostrar uno o más KPIs.
    """

    TIPO_WIDGET_CHOICES = [
        ('kpi_card', 'Tarjeta de KPI'),
        ('grafico_linea', 'Gráfico de Línea'),
        ('grafico_barra', 'Gráfico de Barras'),
        ('grafico_pie', 'Gráfico de Pastel'),
        ('tabla', 'Tabla de Datos'),
        ('gauge', 'Medidor (Gauge)'),
        ('mapa_calor', 'Mapa de Calor'),
    ]

    vista = models.ForeignKey(
        VistaDashboard,
        on_delete=models.CASCADE,
        related_name='widgets',
        verbose_name='Vista de Dashboard'
    )
    tipo_widget = models.CharField(
        max_length=20,
        choices=TIPO_WIDGET_CHOICES,
        verbose_name='Tipo de Widget',
        help_text='Tipo de visualización del widget'
    )
    titulo = models.CharField(
        max_length=255,
        verbose_name='Título',
        help_text='Título que se mostrará en el widget'
    )
    kpis = models.ManyToManyField(
        'config_indicadores.CatalogoKPI',
        related_name='widgets',
        verbose_name='KPIs',
        help_text='KPIs que se mostrarán en este widget'
    )
    configuracion = models.JSONField(
        default=dict,
        verbose_name='Configuración',
        help_text='Configuración específica del widget (colores, escala, etc.)'
    )

    # Posición en grid layout (12 columnas)
    posicion_x = models.PositiveIntegerField(
        default=0,
        verbose_name='Posición X',
        help_text='Columna inicial (0-11)'
    )
    posicion_y = models.PositiveIntegerField(
        default=0,
        verbose_name='Posición Y',
        help_text='Fila inicial (0-N)'
    )
    ancho = models.PositiveIntegerField(
        default=4,
        verbose_name='Ancho',
        help_text='Ancho en columnas (1-12)'
    )
    alto = models.PositiveIntegerField(
        default=1,
        verbose_name='Alto',
        help_text='Alto en filas'
    )

    class Meta:
        db_table = 'analytics_widget_dashboard'
        verbose_name = 'Widget de Dashboard'
        verbose_name_plural = 'Widgets de Dashboard'
        ordering = ['vista', 'orden']
        indexes = [
            models.Index(fields=['empresa', 'vista']),
            models.Index(fields=['vista', 'orden']),
        ]

    def __str__(self):
        return f"{self.vista.codigo} - {self.titulo}"


class FavoritoDashboard(models.Model):
    """
    Dashboards favoritos marcados por usuarios.
    Permite a cada usuario marcar sus vistas preferidas.
    """

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dashboards_favoritos',
        verbose_name='Usuario'
    )
    vista = models.ForeignKey(
        VistaDashboard,
        on_delete=models.CASCADE,
        related_name='favoritos',
        verbose_name='Vista de Dashboard'
    )
    es_default = models.BooleanField(
        default=False,
        verbose_name='¿Dashboard por Defecto?',
        help_text='True = se abre automáticamente al acceder a Analytics'
    )
    fecha_agregado = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha Agregado'
    )

    class Meta:
        db_table = 'analytics_favorito_dashboard'
        verbose_name = 'Dashboard Favorito'
        verbose_name_plural = 'Dashboards Favoritos'
        ordering = ['-es_default', '-fecha_agregado']
        unique_together = [['usuario', 'vista']]
        indexes = [
            models.Index(fields=['usuario', 'es_default']),
        ]

    def __str__(self):
        return f"{self.usuario.email} - {self.vista.nombre}"

    def save(self, *args, **kwargs):
        """Override save para asegurar un solo dashboard default por usuario."""
        if self.es_default:
            # Quitar es_default de otros favoritos del mismo usuario
            FavoritoDashboard.objects.filter(
                usuario=self.usuario,
                es_default=True
            ).exclude(pk=self.pk).update(es_default=False)
        super().save(*args, **kwargs)
