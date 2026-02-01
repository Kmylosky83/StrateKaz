"""
Modelos de Proceso Disciplinario - Talent Hub
Sistema de Gestión StrateKaz
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.core.base_models import BaseCompanyModel

# Constantes
GRAVEDAD_FALTA_CHOICES = [
    ('leve', 'Leve'),
    ('grave', 'Grave'),
    ('muy_grave', 'Muy Grave'),
]

SANCION_SUGERIDA_CHOICES = [
    ('llamado_atencion', 'Llamado de Atención'),
    ('memorando', 'Memorando'),
    ('suspension', 'Suspensión'),
    ('terminacion', 'Terminación de Contrato'),
]

TIPO_LLAMADO_CHOICES = [
    ('verbal', 'Verbal'),
    ('escrito', 'Escrito'),
]

ESTADO_DESCARGO_CHOICES = [
    ('citado', 'Citado'),
    ('realizado', 'Realizado'),
    ('no_asistio', 'No Asistió'),
    ('aplazado', 'Aplazado'),
]

DECISION_DESCARGO_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('absuelto', 'Absuelto'),
    ('sancionado', 'Sancionado'),
]

SANCION_APLICADA_CHOICES = [
    ('amonestacion', 'Amonestación Escrita'),
    ('suspension', 'Suspensión'),
]

RESULTADO_APELACION_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('confirmado', 'Confirmado'),
    ('modificado', 'Modificado'),
    ('revocado', 'Revocado'),
]


class TipoFalta(BaseCompanyModel):
    """Catálogo de tipos de faltas disciplinarias"""
    
    codigo = models.CharField(max_length=20, verbose_name='Código')
    nombre = models.CharField(max_length=200, verbose_name='Nombre de la Falta')
    descripcion = models.TextField(verbose_name='Descripción Detallada')
    gravedad = models.CharField(max_length=15, choices=GRAVEDAD_FALTA_CHOICES, default='leve', db_index=True)
    sancion_sugerida = models.CharField(max_length=20, choices=SANCION_SUGERIDA_CHOICES)
    reincidencia_agrava = models.BooleanField(default=True)
    dias_prescripcion = models.PositiveIntegerField(default=30)
    articulo_reglamento = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'talent_hub_tipo_falta'
        verbose_name = 'Tipo de Falta'
        verbose_name_plural = 'Tipos de Falta'
        ordering = ['gravedad', 'codigo']
        unique_together = [['empresa', 'codigo']]
        indexes = [
            models.Index(fields=['empresa', 'gravedad']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def es_grave(self):
        return self.gravedad in ['grave', 'muy_grave']


class LlamadoAtencion(BaseCompanyModel):
    """Llamado de Atención - Primer nivel de sanción disciplinaria"""
    
    colaborador = models.ForeignKey('colaboradores.Colaborador', on_delete=models.PROTECT, related_name='llamados_atencion')
    tipo_falta = models.ForeignKey(TipoFalta, on_delete=models.PROTECT, related_name='llamados_atencion')
    fecha_falta = models.DateField(db_index=True)
    descripcion_hechos = models.TextField()
    tipo = models.CharField(max_length=10, choices=TIPO_LLAMADO_CHOICES, default='verbal')
    testigos = models.TextField(blank=True)
    compromiso_colaborador = models.TextField(blank=True)
    fecha_llamado = models.DateTimeField(auto_now_add=True, db_index=True)
    realizado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='llamados_realizados')
    firmado_colaborador = models.BooleanField(default=False)
    fecha_firma = models.DateTimeField(null=True, blank=True)
    archivo_soporte = models.FileField(upload_to='proceso_disciplinario/llamados/', null=True, blank=True)

    class Meta:
        db_table = 'talent_hub_llamado_atencion'
        verbose_name = 'Llamado de Atención'
        verbose_name_plural = 'Llamados de Atención'
        ordering = ['-fecha_llamado']
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['fecha_falta']),
            models.Index(fields=['tipo']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.get_tipo_display()} ({self.fecha_falta})"

    @property
    def dias_desde_falta(self):
        return (self.fecha_llamado.date() - self.fecha_falta).days

    @property
    def esta_firmado(self):
        return self.firmado_colaborador and self.fecha_firma is not None

    def clean(self):
        if self.fecha_falta > timezone.now().date():
            raise ValidationError({'fecha_falta': 'La fecha de la falta no puede ser futura.'})
        if self.tipo_falta:
            dias = (timezone.now().date() - self.fecha_falta).days
            if dias > self.tipo_falta.dias_prescripcion:
                raise ValidationError({'fecha_falta': f'La falta prescribió. Máximo {self.tipo_falta.dias_prescripcion} días.'})


class Descargo(BaseCompanyModel):
    """Proceso de Descargos - Debido proceso disciplinario"""
    
    colaborador = models.ForeignKey('colaboradores.Colaborador', on_delete=models.PROTECT, related_name='descargos')
    tipo_falta = models.ForeignKey(TipoFalta, on_delete=models.PROTECT, related_name='descargos')
    llamado_atencion_previo = models.ForeignKey(LlamadoAtencion, on_delete=models.SET_NULL, null=True, blank=True, related_name='descargos')
    fecha_citacion = models.DateField(db_index=True)
    hora_citacion = models.TimeField()
    lugar_citacion = models.CharField(max_length=200)
    descripcion_cargos = models.TextField()
    fecha_descargo = models.DateTimeField(null=True, blank=True)
    descargo_colaborador = models.TextField(blank=True)
    pruebas_presentadas = models.TextField(blank=True)
    testigos_colaborador = models.TextField(blank=True)
    testigos_empresa = models.TextField(blank=True)
    estado = models.CharField(max_length=15, choices=ESTADO_DESCARGO_CHOICES, default='citado', db_index=True)
    decision = models.CharField(max_length=15, choices=DECISION_DESCARGO_CHOICES, default='pendiente', db_index=True)
    justificacion_decision = models.TextField(blank=True)
    decidido_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name='descargos_decididos')
    fecha_decision = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'talent_hub_descargo'
        verbose_name = 'Descargo'
        verbose_name_plural = 'Descargos'
        ordering = ['-fecha_citacion']
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['fecha_citacion']),
            models.Index(fields=['estado']),
            models.Index(fields=['decision']),
        ]

    def __str__(self):
        return f"Descargo - {self.colaborador.get_nombre_corto()} ({self.fecha_citacion})"

    @property
    def asistio_descargo(self):
        return self.estado == 'realizado'

    @property
    def decision_tomada(self):
        return self.decision != 'pendiente'

    @property
    def fue_sancionado(self):
        return self.decision == 'sancionado'

    def clean(self):
        if self.estado == 'realizado' and not self.fecha_descargo:
            raise ValidationError({'fecha_descargo': 'Debe especificar la fecha del descargo realizado.'})
        if self.decision != 'pendiente' and not self.justificacion_decision:
            raise ValidationError({'justificacion_decision': 'Debe justificar la decisión tomada.'})


class Memorando(BaseCompanyModel):
    """Memorando Disciplinario - Sanción formal"""
    
    colaborador = models.ForeignKey('colaboradores.Colaborador', on_delete=models.PROTECT, related_name='memorandos')
    descargo = models.ForeignKey(Descargo, on_delete=models.SET_NULL, null=True, blank=True, related_name='memorandos')
    numero_memorando = models.CharField(max_length=50)
    fecha_memorando = models.DateField(db_index=True)
    tipo_falta = models.ForeignKey(TipoFalta, on_delete=models.PROTECT, related_name='memorandos')
    descripcion = models.TextField()
    sancion_aplicada = models.CharField(max_length=15, choices=SANCION_APLICADA_CHOICES)
    dias_suspension = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    fecha_inicio_suspension = models.DateField(null=True, blank=True)
    fecha_fin_suspension = models.DateField(null=True, blank=True)
    apelado = models.BooleanField(default=False)
    fecha_apelacion = models.DateField(null=True, blank=True)
    resultado_apelacion = models.CharField(max_length=15, choices=RESULTADO_APELACION_CHOICES, default='pendiente')
    firmado_colaborador = models.BooleanField(default=False)
    fecha_firma = models.DateTimeField(null=True, blank=True)
    archivo_memorando = models.FileField(upload_to='proceso_disciplinario/memorandos/')
    elaborado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='memorandos_elaborados')

    class Meta:
        db_table = 'talent_hub_memorando'
        verbose_name = 'Memorando'
        verbose_name_plural = 'Memorandos'
        ordering = ['-fecha_memorando']
        unique_together = [['empresa', 'numero_memorando']]
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['numero_memorando']),
            models.Index(fields=['fecha_memorando']),
            models.Index(fields=['sancion_aplicada']),
        ]

    def __str__(self):
        return f"{self.numero_memorando} - {self.colaborador.get_nombre_corto()}"

    @property
    def es_suspension(self):
        return self.sancion_aplicada == 'suspension'

    @property
    def suspension_vigente(self):
        if not self.es_suspension or not self.fecha_fin_suspension:
            return False
        hoy = timezone.now().date()
        return self.fecha_inicio_suspension <= hoy <= self.fecha_fin_suspension

    @property
    def esta_firmado(self):
        return self.firmado_colaborador and self.fecha_firma is not None

    def clean(self):
        if self.sancion_aplicada == 'suspension':
            if not self.dias_suspension:
                raise ValidationError({'dias_suspension': 'Debe especificar días de suspensión.'})
            if not self.fecha_inicio_suspension:
                raise ValidationError({'fecha_inicio_suspension': 'Debe especificar fecha de inicio.'})
            if not self.fecha_fin_suspension:
                raise ValidationError({'fecha_fin_suspension': 'Debe especificar fecha de fin.'})
            if self.fecha_fin_suspension < self.fecha_inicio_suspension:
                raise ValidationError({'fecha_fin_suspension': 'Fecha fin no puede ser anterior a inicio.'})
        if self.apelado and not self.fecha_apelacion:
            raise ValidationError({'fecha_apelacion': 'Debe especificar fecha de apelación.'})

    def save(self, *args, **kwargs):
        if self.es_suspension and self.dias_suspension and self.fecha_inicio_suspension:
            from datetime import timedelta
            self.fecha_fin_suspension = self.fecha_inicio_suspension + timedelta(days=self.dias_suspension - 1)
        super().save(*args, **kwargs)


class HistorialDisciplinario(BaseCompanyModel):
    """Historial Disciplinario - Vista consolidada por colaborador"""
    
    colaborador = models.OneToOneField('colaboradores.Colaborador', on_delete=models.CASCADE, related_name='historial_disciplinario')
    total_llamados_atencion = models.PositiveIntegerField(default=0)
    total_descargos = models.PositiveIntegerField(default=0)
    total_memorandos = models.PositiveIntegerField(default=0)
    total_suspensiones = models.PositiveIntegerField(default=0)
    dias_suspension_acumulados = models.PositiveIntegerField(default=0)
    ultima_falta = models.DateField(null=True, blank=True)
    ultima_sancion = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = 'talent_hub_historial_disciplinario'
        verbose_name = 'Historial Disciplinario'
        verbose_name_plural = 'Historiales Disciplinarios'
        ordering = ['-ultima_sancion', '-ultima_falta']
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
        ]

    def __str__(self):
        return f"Historial - {self.colaborador.get_nombre_completo()}"

    @property
    def tiene_antecedentes(self):
        return self.total_llamados_atencion > 0 or self.total_memorandos > 0 or self.total_suspensiones > 0

    @property
    def nivel_riesgo(self):
        if self.total_suspensiones >= 2 or self.total_memorandos >= 3:
            return 'alto'
        elif self.total_memorandos >= 1 or self.total_llamados_atencion >= 3:
            return 'medio'
        elif self.total_llamados_atencion > 0:
            return 'bajo'
        return 'sin_antecedentes'

    def actualizar_contadores(self):
        self.total_llamados_atencion = self.colaborador.llamados_atencion.filter(is_active=True).count()
        self.total_descargos = self.colaborador.descargos.filter(is_active=True).count()
        self.total_memorandos = self.colaborador.memorandos.filter(is_active=True).count()
        memorandos_suspension = self.colaborador.memorandos.filter(is_active=True, sancion_aplicada='suspension')
        self.total_suspensiones = memorandos_suspension.count()
        self.dias_suspension_acumulados = sum(m.dias_suspension or 0 for m in memorandos_suspension)
        ultimo_llamado = self.colaborador.llamados_atencion.filter(is_active=True).order_by('-fecha_falta').first()
        if ultimo_llamado:
            self.ultima_falta = ultimo_llamado.fecha_falta
        ultimo_memorando = self.colaborador.memorandos.filter(is_active=True).order_by('-fecha_memorando').first()
        if ultimo_memorando:
            self.ultima_sancion = ultimo_memorando.fecha_memorando
        self.save()
