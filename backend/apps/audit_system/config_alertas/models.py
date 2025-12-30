"""
Modelos del módulo Configuración de Alertas - Audit System
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from apps.core.base_models import BaseCompanyModel, TimestampedModel

User = get_user_model()

CATEGORIA_ALERTA_CHOICES = [
    ('vencimiento', 'Vencimiento'),
    ('umbral', 'Umbral'),
    ('evento', 'Evento'),
    ('inactividad', 'Inactividad'),
    ('cumplimiento', 'Cumplimiento'),
]

SEVERIDAD_CHOICES = [
    ('info', 'Información'),
    ('warning', 'Advertencia'),
    ('danger', 'Peligro'),
    ('critical', 'Crítico'),
]

FRECUENCIA_CHOICES = [
    ('cada_hora', 'Cada Hora'),
    ('diario', 'Diario'),
    ('semanal', 'Semanal'),
]

NOTIFICAR_A_CHOICES = [
    ('responsable', 'Responsable'),
    ('jefe', 'Jefe Inmediato'),
    ('area', 'Área'),
    ('rol_especifico', 'Rol Específico'),
    ('usuarios_especificos', 'Usuarios Específicos'),
]

class TipoAlerta(BaseCompanyModel):
    """Tipos de alerta configurables"""
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    categoria = models.CharField(max_length=20, choices=CATEGORIA_ALERTA_CHOICES, db_index=True)
    severidad_default = models.CharField(max_length=10, choices=SEVERIDAD_CHOICES, default='warning')
    modulo_origen = models.CharField(max_length=100)
    modelo_origen = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'alertas_tipo_alerta'
        verbose_name = 'Tipo de Alerta'
        verbose_name_plural = 'Tipos de Alerta'

    def __str__(self):
        return f'{self.nombre} ({self.categoria})'


class ConfiguracionAlerta(BaseCompanyModel):
    """Configuración de alertas por tipo"""
    tipo_alerta = models.ForeignKey(TipoAlerta, on_delete=models.CASCADE, related_name='configuraciones')
    nombre = models.CharField(max_length=200)
    condicion = models.JSONField(help_text='Condición de activación en formato JSON')
    dias_anticipacion = models.PositiveIntegerField(null=True, blank=True)
    frecuencia_verificacion = models.CharField(max_length=20, choices=FRECUENCIA_CHOICES, default='diario')
    notificar_a = models.CharField(max_length=30, choices=NOTIFICAR_A_CHOICES)
    roles = models.ManyToManyField('core.Cargo', blank=True, related_name='configuraciones_alerta')
    usuarios = models.ManyToManyField(User, blank=True, related_name='configuraciones_alerta')
    crear_tarea = models.BooleanField(default=False)
    enviar_email = models.BooleanField(default=True)

    class Meta:
        db_table = 'alertas_configuracion_alerta'
        verbose_name = 'Configuración de Alerta'
        verbose_name_plural = 'Configuraciones de Alertas'

    def __str__(self):
        return self.nombre


class AlertaGenerada(TimestampedModel):
    """Alertas generadas por el sistema"""
    configuracion = models.ForeignKey(ConfiguracionAlerta, on_delete=models.CASCADE, related_name='alertas_generadas')
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.CharField(max_length=255, null=True, blank=True)
    titulo = models.CharField(max_length=500)
    mensaje = models.TextField()
    severidad = models.CharField(max_length=10, choices=SEVERIDAD_CHOICES, db_index=True)
    fecha_vencimiento = models.DateTimeField(null=True, blank=True)
    esta_atendida = models.BooleanField(default=False, db_index=True)
    atendida_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='alertas_atendidas')
    fecha_atencion = models.DateTimeField(null=True, blank=True)
    accion_tomada = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'alertas_alerta_generada'
        verbose_name = 'Alerta Generada'
        verbose_name_plural = 'Alertas Generadas'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.titulo} - {self.severidad}'


class EscalamientoAlerta(BaseCompanyModel):
    """Escalamiento de alertas no atendidas"""
    configuracion_alerta = models.ForeignKey(ConfiguracionAlerta, on_delete=models.CASCADE, related_name='escalamientos')
    nivel = models.PositiveIntegerField()
    horas_espera = models.PositiveIntegerField()
    notificar_a = models.CharField(max_length=30, choices=[
        ('jefe_inmediato', 'Jefe Inmediato'),
        ('gerente_area', 'Gerente de Área'),
        ('gerente_general', 'Gerente General'),
    ])
    usuarios_adicionales = models.ManyToManyField(User, blank=True, related_name='escalamientos_alerta')
    mensaje_escalamiento = models.TextField()

    class Meta:
        db_table = 'alertas_escalamiento_alerta'
        verbose_name = 'Escalamiento de Alerta'
        verbose_name_plural = 'Escalamientos de Alertas'
        ordering = ['configuracion_alerta', 'nivel']

    def __str__(self):
        return f'Nivel {self.nivel} - {self.configuracion_alerta.nombre}'
