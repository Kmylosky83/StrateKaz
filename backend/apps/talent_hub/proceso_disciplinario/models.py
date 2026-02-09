"""
Modelos de Proceso Disciplinario - Talent Hub
Sistema de Gestión StrateKaz

Cumplimiento Ley 2466/2025 (Reforma Laboral Colombia):
- Art.7: Mínimo 5 días hábiles entre citación y diligencia de descargos
- Derecho a representante sindical o acompañante
- Derecho de apelación en descargos
- Gestión de pruebas estructurada
- Notificaciones formales con acuse de recibo
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

# Ley 2466/2025 - Nuevos choices
TIPO_ACOMPANANTE_CHOICES = [
    ('ninguno', 'Ninguno'),
    ('sindical', 'Representante Sindical'),
    ('abogado', 'Abogado'),
    ('companero', 'Compañero de Trabajo'),
]

TIPO_NOTIFICACION_DISCIPLINARIA_CHOICES = [
    ('citacion_descargos', 'Citación a Descargos'),
    ('notificacion_sancion', 'Notificación de Sanción'),
    ('notificacion_apelacion', 'Notificación de Apelación'),
    ('notificacion_resultado', 'Notificación de Resultado'),
]

TIPO_PRUEBA_CHOICES = [
    ('documental', 'Documental'),
    ('testimonial', 'Testimonial'),
    ('tecnica', 'Técnica'),
    ('fotografica', 'Fotográfica'),
    ('video', 'Video'),
]

PRESENTADA_POR_CHOICES = [
    ('empresa', 'Empresa'),
    ('colaborador', 'Colaborador'),
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

    # === Ley 2466/2025 - Campos de acompañamiento ===
    tipo_acompanante = models.CharField(
        max_length=20,
        choices=TIPO_ACOMPANANTE_CHOICES,
        default='ninguno',
        verbose_name='Tipo de Acompañante',
        help_text='Ley 2466/2025: Derecho a acompañante en diligencia de descargos'
    )
    nombre_acompanante = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nombre del Acompañante'
    )
    representante_sindical = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Representante Sindical',
        help_text='Nombre del representante sindical presente'
    )

    # === Ley 2466/2025 - Apelación en descargos ===
    apelado = models.BooleanField(
        default=False,
        verbose_name='Apelado',
        help_text='El colaborador apeló la decisión del descargo'
    )
    fecha_apelacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Apelación'
    )
    motivo_apelacion = models.TextField(
        blank=True,
        verbose_name='Motivo de Apelación'
    )
    resultado_apelacion = models.CharField(
        max_length=15,
        choices=RESULTADO_APELACION_CHOICES,
        default='pendiente',
        verbose_name='Resultado Apelación'
    )
    resuelto_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='descargos_resueltos',
        verbose_name='Resuelto Por'
    )

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

    @property
    def tiene_acompanante(self):
        return self.tipo_acompanante != 'ninguno'

    def clean(self):
        if self.estado == 'realizado' and not self.fecha_descargo:
            raise ValidationError({'fecha_descargo': 'Debe especificar la fecha del descargo realizado.'})
        if self.decision != 'pendiente' and not self.justificacion_decision:
            raise ValidationError({'justificacion_decision': 'Debe justificar la decisión tomada.'})

        # Ley 2466/2025 Art.7: Mínimo 5 días entre creación y citación
        if self.fecha_citacion and not self.pk:
            fecha_creacion = timezone.now().date()
            dias_diferencia = (self.fecha_citacion - fecha_creacion).days
            if dias_diferencia < 5:
                raise ValidationError({
                    'fecha_citacion': 'Mínimo 5 días hábiles entre la citación y la diligencia (Ley 2466/2025 Art.7).'
                })

        # Validar apelación
        if self.apelado and not self.fecha_apelacion:
            raise ValidationError({'fecha_apelacion': 'Debe especificar la fecha de apelación.'})


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


class NotificacionDisciplinaria(BaseCompanyModel):
    """
    Notificación formal del proceso disciplinario.

    Ley 2466/2025: Registro de notificaciones con acuse de recibo
    para citaciones, sanciones y apelaciones.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='notificaciones_disciplinarias'
    )
    descargo = models.ForeignKey(
        Descargo,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notificaciones'
    )
    memorando = models.ForeignKey(
        Memorando,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notificaciones'
    )
    tipo = models.CharField(
        max_length=30,
        choices=TIPO_NOTIFICACION_DISCIPLINARIA_CHOICES,
        db_index=True,
        verbose_name='Tipo de Notificación'
    )
    contenido = models.TextField(
        verbose_name='Contenido de la Notificación'
    )
    fecha_entrega = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Entrega'
    )
    acuse_recibo = models.BooleanField(
        default=False,
        verbose_name='Acuse de Recibo',
        help_text='El colaborador firmó acuse de recibo'
    )
    fecha_acuse = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Acuse'
    )
    testigo_entrega = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Testigo de Entrega'
    )
    archivo_soporte = models.FileField(
        upload_to='proceso_disciplinario/notificaciones/',
        null=True,
        blank=True,
        verbose_name='Archivo Soporte'
    )

    class Meta:
        db_table = 'talent_hub_notificacion_disciplinaria'
        verbose_name = 'Notificación Disciplinaria'
        verbose_name_plural = 'Notificaciones Disciplinarias'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa', 'colaborador']),
            models.Index(fields=['tipo']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.colaborador.get_nombre_corto()}"

    def clean(self):
        if self.acuse_recibo and not self.fecha_acuse:
            raise ValidationError({'fecha_acuse': 'Debe registrar la fecha del acuse de recibo.'})
        if not self.descargo and not self.memorando:
            raise ValidationError('Debe asociar la notificación a un descargo o memorando.')


class PruebaDisciplinaria(BaseCompanyModel):
    """
    Pruebas del proceso disciplinario.

    Ley 2466/2025: Gestión estructurada de pruebas presentadas
    por empresa y colaborador durante descargos.
    """

    descargo = models.ForeignKey(
        Descargo,
        on_delete=models.CASCADE,
        related_name='pruebas'
    )
    tipo_prueba = models.CharField(
        max_length=15,
        choices=TIPO_PRUEBA_CHOICES,
        verbose_name='Tipo de Prueba'
    )
    descripcion = models.TextField(
        verbose_name='Descripción'
    )
    presentada_por = models.CharField(
        max_length=15,
        choices=PRESENTADA_POR_CHOICES,
        verbose_name='Presentada Por'
    )
    archivo = models.FileField(
        upload_to='proceso_disciplinario/pruebas/',
        null=True,
        blank=True,
        verbose_name='Archivo'
    )
    fecha_presentacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Presentación'
    )
    admitida = models.BooleanField(
        null=True,
        blank=True,
        verbose_name='Admitida',
        help_text='Nulo=pendiente, True=admitida, False=rechazada'
    )
    observaciones_admision = models.TextField(
        blank=True,
        verbose_name='Observaciones de Admisión'
    )

    class Meta:
        db_table = 'talent_hub_prueba_disciplinaria'
        verbose_name = 'Prueba Disciplinaria'
        verbose_name_plural = 'Pruebas Disciplinarias'
        ordering = ['-fecha_presentacion']
        indexes = [
            models.Index(fields=['descargo', 'presentada_por']),
        ]

    def __str__(self):
        return f"{self.get_tipo_prueba_display()} - {self.get_presentada_por_display()}"


# =============================================================================
# DENUNCIA ACOSO LABORAL - Ley 1010/2006
# =============================================================================

TIPO_ACOSO_CHOICES = [
    ('maltrato', 'Maltrato Laboral'),
    ('persecucion', 'Persecución Laboral'),
    ('discriminacion', 'Discriminación Laboral'),
    ('entorpecimiento', 'Entorpecimiento Laboral'),
    ('inequidad', 'Inequidad Laboral'),
    ('desproteccion', 'Desprotección Laboral'),
]

ESTADO_DENUNCIA_CHOICES = [
    ('recibida', 'Recibida'),
    ('investigacion', 'En Investigación'),
    ('comite', 'Remitida a Comité de Convivencia'),
    ('resolucion', 'En Resolución'),
    ('cerrada', 'Cerrada'),
    ('archivada', 'Archivada'),
]


class DenunciaAcosoLaboral(BaseCompanyModel):
    """
    Denuncia de Acoso Laboral según Ley 1010/2006.

    Permite registro de denuncias anónimas o nominadas.
    Se integra con el Comité de Convivencia Laboral y puede
    enlazarse con el reglamento interno de trabajo vigente.

    Referencia: motor_cumplimiento.reglamentos_internos.Reglamento
    (FK unidireccional N5 → N2, sin dependencia circular)
    """

    # Denunciante (nullable para denuncias anónimas)
    denunciante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='denuncias_acoso_realizadas',
        verbose_name='Denunciante',
        help_text='Usuario que realiza la denuncia (vacío = anónima)'
    )
    es_anonima = models.BooleanField(
        default=False,
        verbose_name='Denuncia Anónima',
        help_text='Si la denuncia se realiza de forma anónima'
    )

    # Denunciado
    denunciado = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.PROTECT,
        related_name='denuncias_acoso_recibidas',
        verbose_name='Denunciado',
        help_text='Colaborador denunciado por acoso laboral'
    )

    # Clasificación
    tipo_acoso = models.CharField(
        max_length=20,
        choices=TIPO_ACOSO_CHOICES,
        db_index=True,
        verbose_name='Tipo de Acoso',
        help_text='Modalidad de acoso según Art. 2 Ley 1010/2006'
    )

    # Hechos
    descripcion_hechos = models.TextField(
        verbose_name='Descripción de los Hechos',
        help_text='Descripción detallada de los hechos de acoso'
    )
    fecha_hechos = models.DateField(
        verbose_name='Fecha de los Hechos',
        help_text='Fecha aproximada de los hechos denunciados'
    )
    lugar_hechos = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Lugar de los Hechos',
        help_text='Lugar donde ocurrieron los hechos'
    )
    testigos = models.ManyToManyField(
        'colaboradores.Colaborador',
        blank=True,
        related_name='testigo_en_denuncias_acoso',
        verbose_name='Testigos',
        help_text='Colaboradores testigos de los hechos'
    )

    # Evidencia
    evidencia = models.FileField(
        upload_to='talent_hub/acoso_laboral/evidencias/',
        null=True,
        blank=True,
        verbose_name='Evidencia',
        help_text='Archivo de evidencia (correos, fotos, grabaciones permitidas)'
    )

    # Estado y seguimiento
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_DENUNCIA_CHOICES,
        default='recibida',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado actual de la denuncia'
    )
    comite_convivencia_notificado = models.BooleanField(
        default=False,
        verbose_name='Comité de Convivencia Notificado',
        help_text='Si el Comité de Convivencia Laboral ha sido notificado'
    )
    fecha_notificacion_comite = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Notificación al Comité',
        help_text='Fecha en que se notificó al Comité de Convivencia'
    )

    # Resolución
    resolucion = models.TextField(
        blank=True,
        verbose_name='Resolución',
        help_text='Resolución o decisión tomada sobre la denuncia'
    )
    medidas_correctivas = models.JSONField(
        default=list,
        verbose_name='Medidas Correctivas',
        help_text='Lista de medidas correctivas adoptadas'
    )
    fecha_cierre = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cierre',
        help_text='Fecha de cierre de la denuncia'
    )

    # Enlace con reglamento interno (FK unidireccional N5 → N2)
    reglamento_aplicable = models.ForeignKey(
        'reglamentos_internos.Reglamento',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
        verbose_name='Reglamento Aplicable',
        help_text='Reglamento interno de trabajo que sustenta las medidas'
    )

    class Meta:
        db_table = 'talent_hub_denuncia_acoso_laboral'
        verbose_name = 'Denuncia de Acoso Laboral'
        verbose_name_plural = 'Denuncias de Acoso Laboral'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa', 'estado']),
            models.Index(fields=['empresa', 'tipo_acoso']),
            models.Index(fields=['denunciado']),
            models.Index(fields=['fecha_hechos']),
        ]

    def __str__(self):
        tipo = self.get_tipo_acoso_display()
        origen = 'Anónima' if self.es_anonima else str(self.denunciante or 'Sin asignar')
        return f"Denuncia {tipo} - {origen} ({self.get_estado_display()})"
