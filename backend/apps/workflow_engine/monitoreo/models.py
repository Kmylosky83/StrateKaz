from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class MetricaFlujo(models.Model):
    PERIODO_CHOICES = [('mensual', 'Mensual'), ('trimestral', 'Trimestral'), ('anual', 'Anual')]
    plantilla = models.ForeignKey('disenador_flujos.PlantillaFlujo', on_delete=models.CASCADE, related_name='metricas')
    periodo = models.CharField(max_length=20, choices=PERIODO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    total_instancias = models.IntegerField(default=0)
    instancias_completadas = models.IntegerField(default=0)
    instancias_canceladas = models.IntegerField(default=0)
    tiempo_promedio_dias = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tareas_totales = models.IntegerField(default=0)
    tareas_completadas = models.IntegerField(default=0)
    tareas_rechazadas = models.IntegerField(default=0)
    cuellos_botella = models.JSONField(default=dict)
    empresa_id = models.PositiveBigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'workflow_metrica_flujo'
        unique_together = [['plantilla', 'periodo', 'fecha_inicio', 'empresa_id']]
    def __str__(self):
        return f"{self.plantilla.nombre} - {self.periodo}"


class AlertaFlujo(models.Model):
    TIPO_CHOICES = [('retraso', 'Retraso'), ('escalamiento', 'Escalamiento'), ('error', 'Error'), ('vencimiento', 'Vencimiento')]
    SEVERIDAD_CHOICES = [('baja', 'Baja'), ('media', 'Media'), ('alta', 'Alta'), ('critica', 'Crítica')]
    ESTADO_CHOICES = [('activa', 'Activa'), ('atendida', 'Atendida'), ('ignorada', 'Ignorada')]
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    severidad = models.CharField(max_length=20, choices=SEVERIDAD_CHOICES)
    instancia = models.ForeignKey('ejecucion.InstanciaFlujo', on_delete=models.CASCADE, related_name='alertas')
    tarea = models.ForeignKey('ejecucion.TareaActiva', on_delete=models.SET_NULL, null=True, blank=True, related_name='alertas')
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField()
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    fecha_atencion = models.DateTimeField(null=True, blank=True)
    atendida_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='alertas_atendidas')
    acciones_tomadas = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activa')
    empresa_id = models.PositiveBigIntegerField()
    class Meta:
        db_table = 'workflow_alerta_flujo'
    def __str__(self):
        return self.titulo


class ReglaSLA(models.Model):
    ACCION_CHOICES = [('notificar', 'Notificar'), ('escalar', 'Escalar'), ('reasignar', 'Reasignar')]
    plantilla = models.ForeignKey('disenador_flujos.PlantillaFlujo', on_delete=models.CASCADE, related_name='reglas_sla')
    nodo = models.ForeignKey('disenador_flujos.NodoFlujo', on_delete=models.CASCADE, null=True, blank=True, related_name='reglas_sla')
    nombre = models.CharField(max_length=255)
    tiempo_limite_horas = models.IntegerField()
    tiempo_alerta_horas = models.IntegerField()
    accion_vencimiento = models.CharField(max_length=20, choices=ACCION_CHOICES, default='notificar')
    destinatarios_alerta = models.TextField()
    is_active = models.BooleanField(default=True)
    empresa_id = models.PositiveBigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'workflow_regla_sla'
    def __str__(self):
        return self.nombre


class DashboardWidget(models.Model):
    TIPO_CHOICES = [('kpi', 'KPI'), ('grafico', 'Gráfico'), ('lista', 'Lista'), ('tabla', 'Tabla')]
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dashboard_widgets')
    tipo_widget = models.CharField(max_length=20, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=255)
    configuracion = models.JSONField(default=dict)
    posicion_x = models.IntegerField(default=0)
    posicion_y = models.IntegerField(default=0)
    ancho = models.IntegerField(default=4)
    alto = models.IntegerField(default=4)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'workflow_dashboard_widget'
    def __str__(self):
        return self.titulo


class ReporteAutomatico(models.Model):
    FRECUENCIA_CHOICES = [('diario', 'Diario'), ('semanal', 'Semanal'), ('mensual', 'Mensual')]
    FORMATO_CHOICES = [('pdf', 'PDF'), ('excel', 'Excel'), ('csv', 'CSV')]
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    plantillas_incluidas = models.ManyToManyField('disenador_flujos.PlantillaFlujo', related_name='reportes_automaticos')
    frecuencia = models.CharField(max_length=20, choices=FRECUENCIA_CHOICES)
    destinatarios = models.TextField()
    formato = models.CharField(max_length=10, choices=FORMATO_CHOICES)
    ultimo_envio = models.DateTimeField(null=True, blank=True)
    proximo_envio = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    empresa_id = models.PositiveBigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'workflow_reporte_automatico'
    def __str__(self):
        return self.nombre
