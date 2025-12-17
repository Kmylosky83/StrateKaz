"""
Modelos del módulo Planeación Estratégica - Dirección Estratégica

Secciones: plan_estrategico, objetivos, mapa_estrategico
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class StrategicPlan(models.Model):
    """
    Plan Estratégico

    Contiene el mapa estratégico y la planificación por períodos.
    """

    PERIOD_CHOICES = [
        ('ANUAL', 'Anual'),
        ('BIANUAL', 'Bianual'),
        ('TRIANUAL', 'Trianual'),
        ('QUINQUENAL', 'Quinquenal'),
    ]

    name = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre del plan estratégico (ej: Plan Estratégico 2024-2026)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción y alcance del plan'
    )
    period_type = models.CharField(
        max_length=20,
        choices=PERIOD_CHOICES,
        default='ANUAL',
        verbose_name='Tipo de período'
    )
    start_date = models.DateField(
        verbose_name='Fecha de inicio',
        help_text='Fecha de inicio del plan'
    )
    end_date = models.DateField(
        verbose_name='Fecha de fin',
        help_text='Fecha de finalización del plan'
    )
    strategic_map_image = models.ImageField(
        upload_to='strategic_plans/maps/',
        blank=True,
        null=True,
        verbose_name='Imagen del Mapa Estratégico'
    )
    strategic_map_description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción del Mapa Estratégico'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='plans_approved',
        verbose_name='Aprobado por'
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de aprobación'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='plans_created',
        verbose_name='Creado por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'planeacion_strategic_plan'
        verbose_name = 'Plan Estratégico'
        verbose_name_plural = 'Planes Estratégicos'
        ordering = ['-start_date']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_active:
            StrategicPlan.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    @property
    def progress(self):
        """Calcula el progreso general del plan basado en sus objetivos"""
        objectives = self.objectives.filter(is_active=True)
        if not objectives.exists():
            return 0
        total = objectives.count()
        completed = objectives.filter(progress=100).count()
        return round((completed / total) * 100, 1)

    @classmethod
    def get_active(cls):
        """Obtiene el plan estratégico activo"""
        return cls.objects.filter(is_active=True).first()


class StrategicObjective(models.Model):
    """
    Objetivos Estratégicos

    Objetivos etiquetados con perspectiva BSC y vinculación a normas ISO.
    """

    BSC_PERSPECTIVE_CHOICES = [
        ('FINANCIERA', 'Financiera'),
        ('CLIENTES', 'Clientes'),
        ('PROCESOS', 'Procesos Internos'),
        ('APRENDIZAJE', 'Aprendizaje y Crecimiento'),
    ]

    ISO_STANDARD_CHOICES = [
        ('ISO_9001', 'ISO 9001 - Calidad'),
        ('ISO_14001', 'ISO 14001 - Ambiental'),
        ('ISO_45001', 'ISO 45001 - SST'),
        ('ISO_27001', 'ISO 27001 - Seguridad de la Información'),
        ('PESV', 'PESV - Plan Estratégico de Seguridad Vial'),
        ('SG_SST', 'SG-SST - Sistema de Gestión SST'),
        ('NINGUNO', 'Sin vinculación normativa'),
    ]

    STATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROGRESO', 'En Progreso'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
        ('RETRASADO', 'Retrasado'),
    ]

    plan = models.ForeignKey(
        StrategicPlan,
        on_delete=models.CASCADE,
        related_name='objectives',
        verbose_name='Plan Estratégico'
    )
    code = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del objetivo (ej: OE-001)'
    )
    name = models.CharField(
        max_length=300,
        verbose_name='Nombre',
        help_text='Nombre del objetivo estratégico'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del objetivo'
    )
    bsc_perspective = models.CharField(
        max_length=20,
        choices=BSC_PERSPECTIVE_CHOICES,
        db_index=True,
        verbose_name='Perspectiva BSC',
        help_text='Perspectiva del Balanced Scorecard'
    )
    iso_standards = models.JSONField(
        default=list,
        verbose_name='Normas ISO',
        help_text='Lista de normas ISO vinculadas'
    )
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='objectives_responsible',
        verbose_name='Responsable'
    )
    responsible_cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='objectives_responsible',
        verbose_name='Cargo Responsable'
    )
    target_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Meta',
        help_text='Valor meta del indicador'
    )
    current_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Valor Actual',
        help_text='Valor actual del indicador'
    )
    unit = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Unidad',
        help_text='Unidad de medida (%, $, unidades, etc.)'
    )
    progress = models.IntegerField(
        default=0,
        verbose_name='Progreso %',
        help_text='Porcentaje de avance (0-100)'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDIENTE',
        db_index=True,
        verbose_name='Estado'
    )
    start_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de inicio'
    )
    due_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha límite'
    )
    completed_at = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de completado'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Orden'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='objectives_created',
        verbose_name='Creado por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'planeacion_strategic_objective'
        verbose_name = 'Objetivo Estratégico'
        verbose_name_plural = 'Objetivos Estratégicos'
        ordering = ['bsc_perspective', 'order', 'code']
        unique_together = [['plan', 'code']]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def update_progress(self):
        """Actualiza el progreso basado en valor actual vs meta"""
        if self.target_value and self.current_value:
            progress = (float(self.current_value) / float(self.target_value)) * 100
            self.progress = min(100, max(0, round(progress)))
            if self.progress >= 100:
                self.status = 'COMPLETADO'
                self.completed_at = timezone.now().date()
            elif self.progress > 0:
                self.status = 'EN_PROGRESO'
            self.save(update_fields=['progress', 'status', 'completed_at'])
