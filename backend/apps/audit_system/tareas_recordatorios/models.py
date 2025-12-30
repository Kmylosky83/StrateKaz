"""
Modelos del módulo Tareas y Recordatorios - Audit System
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from apps.core.base_models import TimestampedModel

User = get_user_model()

TIPO_TAREA_CHOICES = [
    ('manual', 'Manual'),
    ('automatica', 'Automática'),
    ('recurrente', 'Recurrente'),
]

PRIORIDAD_TAREA_CHOICES = [
    ('baja', 'Baja'),
    ('normal', 'Normal'),
    ('alta', 'Alta'),
    ('urgente', 'Urgente'),
]

ESTADO_TAREA_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('en_progreso', 'En Progreso'),
    ('completada', 'Completada'),
    ('cancelada', 'Cancelada'),
    ('vencida', 'Vencida'),
]

REPETIR_CHOICES = [
    ('una_vez', 'Una Vez'),
    ('diario', 'Diario'),
    ('semanal', 'Semanal'),
    ('mensual', 'Mensual'),
]

TIPO_EVENTO_CHOICES = [
    ('reunion', 'Reunión'),
    ('capacitacion', 'Capacitación'),
    ('auditoria', 'Auditoría'),
    ('mantenimiento', 'Mantenimiento'),
    ('otro', 'Otro'),
]


class Tarea(TimestampedModel):
    """Tareas pendientes"""
    titulo = models.CharField(max_length=500, verbose_name='Título')
    descripcion = models.TextField(verbose_name='Descripción')
    tipo = models.CharField(max_length=20, choices=TIPO_TAREA_CHOICES, default='manual', db_index=True)
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_TAREA_CHOICES, default='normal', db_index=True)
    estado = models.CharField(max_length=20, choices=ESTADO_TAREA_CHOICES, default='pendiente', db_index=True)
    
    asignado_a = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tareas_asignadas', verbose_name='Asignado a')
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='tareas_creadas', verbose_name='Creado por')
    
    fecha_limite = models.DateTimeField(verbose_name='Fecha Límite', db_index=True)
    fecha_completada = models.DateTimeField(null=True, blank=True, verbose_name='Fecha Completada')
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.CharField(max_length=255, null=True, blank=True)
    url_relacionada = models.CharField(max_length=500, null=True, blank=True, verbose_name='URL Relacionada')
    
    notas = models.TextField(null=True, blank=True, verbose_name='Notas')
    porcentaje_avance = models.PositiveIntegerField(default=0, verbose_name='Porcentaje de Avance')

    class Meta:
        db_table = 'tareas_tarea'
        verbose_name = 'Tarea'
        verbose_name_plural = 'Tareas'
        ordering = ['-fecha_limite']
        indexes = [
            models.Index(fields=['asignado_a', 'estado', '-fecha_limite']),
            models.Index(fields=['prioridad', 'estado']),
        ]

    def __str__(self):
        return f'{self.titulo} - {self.asignado_a.get_full_name()}'

    def completar(self):
        """Marca la tarea como completada"""
        from django.utils import timezone
        self.estado = 'completada'
        self.fecha_completada = timezone.now()
        self.porcentaje_avance = 100
        self.save(update_fields=['estado', 'fecha_completada', 'porcentaje_avance'])


class Recordatorio(TimestampedModel):
    """Recordatorios programados"""
    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE, null=True, blank=True, related_name='recordatorios')
    titulo = models.CharField(max_length=500, verbose_name='Título')
    mensaje = models.TextField(verbose_name='Mensaje')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recordatorios', verbose_name='Usuario')
    
    fecha_recordatorio = models.DateTimeField(verbose_name='Fecha de Recordatorio', db_index=True)
    repetir = models.CharField(max_length=20, choices=REPETIR_CHOICES, default='una_vez')
    dias_repeticion = models.JSONField(null=True, blank=True, help_text='Lista de días para repetición semanal [1,3,5]')
    hora_repeticion = models.TimeField(null=True, blank=True)
    
    esta_activo = models.BooleanField(default=True, db_index=True)
    ultima_ejecucion = models.DateTimeField(null=True, blank=True)
    proxima_ejecucion = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tareas_recordatorio'
        verbose_name = 'Recordatorio'
        verbose_name_plural = 'Recordatorios'
        ordering = ['fecha_recordatorio']

    def __str__(self):
        return f'{self.titulo} - {self.usuario.get_full_name()}'


class EventoCalendario(TimestampedModel):
    """Eventos en calendario"""
    titulo = models.CharField(max_length=500, verbose_name='Título')
    descripcion = models.TextField(null=True, blank=True, verbose_name='Descripción')
    tipo = models.CharField(max_length=20, choices=TIPO_EVENTO_CHOICES, db_index=True)
    
    fecha_inicio = models.DateTimeField(verbose_name='Fecha Inicio', db_index=True)
    fecha_fin = models.DateTimeField(verbose_name='Fecha Fin')
    todo_el_dia = models.BooleanField(default=False, verbose_name='Todo el Día')
    
    ubicacion = models.CharField(max_length=500, null=True, blank=True, verbose_name='Ubicación')
    url_reunion = models.CharField(max_length=500, null=True, blank=True, verbose_name='URL Reunión')
    
    participantes = models.ManyToManyField(User, related_name='eventos_calendario', verbose_name='Participantes')
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='eventos_creados')
    
    color = models.CharField(max_length=20, default='#3b82f6', verbose_name='Color')
    recordar_antes = models.PositiveIntegerField(null=True, blank=True, verbose_name='Recordar Antes (minutos)')

    class Meta:
        db_table = 'tareas_evento_calendario'
        verbose_name = 'Evento de Calendario'
        verbose_name_plural = 'Eventos de Calendario'
        ordering = ['fecha_inicio']

    def __str__(self):
        return f'{self.titulo} - {self.fecha_inicio.strftime("%Y-%m-%d %H:%M")}'


class ComentarioTarea(TimestampedModel):
    """Comentarios en tareas"""
    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE, related_name='comentarios')
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    mensaje = models.TextField(verbose_name='Mensaje')
    archivo_adjunto = models.FileField(upload_to='tareas/comentarios/', null=True, blank=True)

    class Meta:
        db_table = 'tareas_comentario_tarea'
        verbose_name = 'Comentario de Tarea'
        verbose_name_plural = 'Comentarios de Tareas'
        ordering = ['created_at']

    def __str__(self):
        return f'Comentario en {self.tarea.titulo} por {self.usuario.get_full_name() if self.usuario else "Desconocido"}'
