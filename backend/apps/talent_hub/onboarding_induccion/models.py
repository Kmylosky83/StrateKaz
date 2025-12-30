"""
Modelos de Onboarding e Inducción - Talent Hub
Sistema de Gestión Grasas y Huesos del Norte

Gestión del proceso de incorporación de nuevos colaboradores:
- ModuloInduccion: Contenido de inducción configurable
- AsignacionPorCargo: Módulos asignados según cargo
- ChecklistIngreso: Lista de verificación de ingreso
- EjecucionIntegral: Seguimiento de proceso de inducción
- EntregaEPP: Registro de entrega de equipos de protección
- EntregaActivo: Registro de entrega de activos
- FirmaDocumento: Documentos firmados durante onboarding
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal

from apps.core.base_models import BaseCompanyModel


# =============================================================================
# OPCIONES Y CONSTANTES
# =============================================================================

TIPO_MODULO_CHOICES = [
    ('induccion_general', 'Inducción General'),
    ('induccion_especifica', 'Inducción Específica'),
    ('reinduccion', 'Reinducción'),
    ('sst', 'Seguridad y Salud en el Trabajo'),
    ('calidad', 'Sistema de Calidad'),
    ('ambiente', 'Gestión Ambiental'),
    ('etica', 'Código de Ética'),
    ('pesv', 'Seguridad Vial'),
    ('otro', 'Otro'),
]

FORMATO_CONTENIDO_CHOICES = [
    ('video', 'Video'),
    ('presentacion', 'Presentación'),
    ('documento', 'Documento PDF'),
    ('quiz', 'Cuestionario'),
    ('actividad', 'Actividad Práctica'),
    ('presencial', 'Sesión Presencial'),
    ('mixto', 'Mixto'),
]

ESTADO_EJECUCION_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('en_progreso', 'En Progreso'),
    ('completado', 'Completado'),
    ('reprobado', 'Reprobado'),
    ('cancelado', 'Cancelado'),
]

ESTADO_CHECKLIST_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('cumplido', 'Cumplido'),
    ('no_aplica', 'No Aplica'),
    ('incompleto', 'Incompleto'),
]

TIPO_DOCUMENTO_FIRMA_CHOICES = [
    ('contrato', 'Contrato de Trabajo'),
    ('reglamento_interno', 'Reglamento Interno de Trabajo'),
    ('politica_datos', 'Política de Tratamiento de Datos'),
    ('politica_sst', 'Política SST'),
    ('acuerdo_confidencialidad', 'Acuerdo de Confidencialidad'),
    ('autorizacion_descuento', 'Autorización de Descuentos'),
    ('compromiso_cumplimiento', 'Compromiso de Cumplimiento'),
    ('otro', 'Otro Documento'),
]

TIPO_EPP_CHOICES = [
    ('casco', 'Casco de Seguridad'),
    ('gafas', 'Gafas de Protección'),
    ('guantes', 'Guantes'),
    ('botas', 'Botas de Seguridad'),
    ('overol', 'Overol'),
    ('protector_auditivo', 'Protector Auditivo'),
    ('mascarilla', 'Mascarilla/Respirador'),
    ('arnes', 'Arnés de Seguridad'),
    ('chaleco', 'Chaleco Reflectivo'),
    ('otro', 'Otro'),
]

TIPO_ACTIVO_CHOICES = [
    ('computador', 'Computador'),
    ('celular', 'Celular Corporativo'),
    ('radio', 'Radio de Comunicación'),
    ('vehiculo', 'Vehículo'),
    ('herramienta', 'Herramienta'),
    ('uniforme', 'Uniforme'),
    ('carnet', 'Carnet/Credencial'),
    ('llaves', 'Llaves'),
    ('tarjeta_acceso', 'Tarjeta de Acceso'),
    ('otro', 'Otro'),
]


# =============================================================================
# MÓDULO DE INDUCCIÓN
# =============================================================================

class ModuloInduccion(BaseCompanyModel):
    """
    Módulo de Inducción - Contenido configurable de capacitación inicial.

    Define los módulos de contenido que se utilizan en el proceso de inducción,
    reinducción o capacitación inicial de colaboradores.
    """

    codigo = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Código del Módulo',
        help_text='Código único del módulo (ej: IND-001)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Módulo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    tipo_modulo = models.CharField(
        max_length=20,
        choices=TIPO_MODULO_CHOICES,
        default='induccion_general',
        db_index=True,
        verbose_name='Tipo de Módulo'
    )
    formato_contenido = models.CharField(
        max_length=20,
        choices=FORMATO_CONTENIDO_CHOICES,
        default='presentacion',
        verbose_name='Formato del Contenido'
    )

    # Duración
    duracion_minutos = models.PositiveIntegerField(
        default=30,
        verbose_name='Duración (minutos)',
        help_text='Tiempo estimado para completar el módulo'
    )

    # Evaluación
    requiere_evaluacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Evaluación'
    )
    nota_minima_aprobacion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('70.00'),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Nota Mínima Aprobación (%)'
    )
    intentos_permitidos = models.PositiveIntegerField(
        default=3,
        verbose_name='Intentos Permitidos'
    )

    # Contenido
    contenido_url = models.URLField(
        blank=True,
        verbose_name='URL del Contenido',
        help_text='Enlace al video o recurso externo'
    )
    archivo_contenido = models.FileField(
        upload_to='onboarding/modulos/',
        null=True,
        blank=True,
        verbose_name='Archivo de Contenido'
    )
    preguntas_evaluacion = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Preguntas de Evaluación',
        help_text='Lista de preguntas en formato JSON'
    )

    # Vigencia
    fecha_vigencia_desde = models.DateField(
        null=True,
        blank=True,
        verbose_name='Vigente Desde'
    )
    fecha_vigencia_hasta = models.DateField(
        null=True,
        blank=True,
        verbose_name='Vigente Hasta'
    )

    # Orden y Obligatoriedad
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden de Ejecución'
    )
    es_obligatorio = models.BooleanField(
        default=True,
        verbose_name='Es Obligatorio'
    )

    # Responsable
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modulos_induccion_responsable',
        verbose_name='Responsable del Módulo'
    )

    class Meta:
        db_table = 'talent_hub_modulo_induccion'
        verbose_name = 'Módulo de Inducción'
        verbose_name_plural = 'Módulos de Inducción'
        ordering = ['orden', 'nombre']
        unique_together = ['empresa', 'codigo']
        indexes = [
            models.Index(fields=['empresa', 'tipo_modulo']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def esta_vigente(self):
        """Verifica si el módulo está vigente."""
        from django.utils import timezone
        hoy = timezone.now().date()
        if self.fecha_vigencia_desde and hoy < self.fecha_vigencia_desde:
            return False
        if self.fecha_vigencia_hasta and hoy > self.fecha_vigencia_hasta:
            return False
        return True


# =============================================================================
# ASIGNACIÓN POR CARGO
# =============================================================================

class AsignacionPorCargo(BaseCompanyModel):
    """
    Asignación por Cargo - Define qué módulos aplican a cada cargo.

    Relaciona módulos de inducción con cargos específicos para automatizar
    la asignación de contenido según el perfil del colaborador.
    """

    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.CASCADE,
        related_name='asignaciones_induccion',
        verbose_name='Cargo'
    )
    modulo = models.ForeignKey(
        ModuloInduccion,
        on_delete=models.CASCADE,
        related_name='asignaciones_cargo',
        verbose_name='Módulo de Inducción'
    )

    es_obligatorio = models.BooleanField(
        default=True,
        verbose_name='Es Obligatorio para este Cargo'
    )
    dias_para_completar = models.PositiveIntegerField(
        default=30,
        verbose_name='Días para Completar',
        help_text='Días desde el ingreso para completar el módulo'
    )
    orden_ejecucion = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden de Ejecución'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_asignacion_cargo_modulo'
        verbose_name = 'Asignación por Cargo'
        verbose_name_plural = 'Asignaciones por Cargo'
        unique_together = ['cargo', 'modulo']
        ordering = ['cargo', 'orden_ejecucion']

    def __str__(self):
        return f"{self.cargo} - {self.modulo.nombre}"


# =============================================================================
# CHECKLIST DE INGRESO
# =============================================================================

class ItemChecklist(BaseCompanyModel):
    """
    Item de Checklist - Elementos configurables del checklist de ingreso.

    Define los ítems que deben verificarse durante el proceso de onboarding.
    """

    codigo = models.CharField(
        max_length=20,
        verbose_name='Código del Item'
    )
    descripcion = models.CharField(
        max_length=300,
        verbose_name='Descripción del Item'
    )

    categoria = models.CharField(
        max_length=50,
        choices=[
            ('documentos', 'Documentación'),
            ('afiliaciones', 'Afiliaciones'),
            ('equipos', 'Equipos y Herramientas'),
            ('accesos', 'Accesos y Credenciales'),
            ('capacitacion', 'Capacitación'),
            ('otros', 'Otros'),
        ],
        default='documentos',
        verbose_name='Categoría'
    )

    requiere_adjunto = models.BooleanField(
        default=False,
        verbose_name='Requiere Archivo Adjunto'
    )
    requiere_fecha = models.BooleanField(
        default=False,
        verbose_name='Requiere Fecha'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    aplica_a_todos = models.BooleanField(
        default=True,
        verbose_name='Aplica a Todos los Cargos'
    )
    cargos_aplicables = models.ManyToManyField(
        'core.Cargo',
        blank=True,
        related_name='items_checklist_aplicables',
        verbose_name='Cargos Aplicables',
        help_text='Solo si no aplica a todos'
    )

    class Meta:
        db_table = 'talent_hub_item_checklist'
        verbose_name = 'Item de Checklist'
        verbose_name_plural = 'Items de Checklist'
        ordering = ['categoria', 'orden']
        unique_together = ['empresa', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"


class ChecklistIngreso(BaseCompanyModel):
    """
    Checklist de Ingreso - Seguimiento de lista de verificación por colaborador.

    Registra el estado de cada ítem del checklist para un colaborador específico.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='checklist_ingreso',
        verbose_name='Colaborador'
    )
    item = models.ForeignKey(
        ItemChecklist,
        on_delete=models.PROTECT,
        related_name='ejecuciones',
        verbose_name='Item de Checklist'
    )

    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CHECKLIST_CHOICES,
        default='pendiente',
        db_index=True,
        verbose_name='Estado'
    )

    fecha_cumplimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cumplimiento'
    )
    archivo_adjunto = models.FileField(
        upload_to='onboarding/checklist/',
        null=True,
        blank=True,
        verbose_name='Archivo Adjunto'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    verificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checklist_verificados',
        verbose_name='Verificado Por'
    )
    fecha_verificacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Verificación'
    )

    class Meta:
        db_table = 'talent_hub_checklist_ingreso'
        verbose_name = 'Checklist de Ingreso'
        verbose_name_plural = 'Checklists de Ingreso'
        unique_together = ['colaborador', 'item']
        ordering = ['colaborador', 'item__orden']

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.item.descripcion}"


# =============================================================================
# EJECUCIÓN INTEGRAL (Proceso de Inducción)
# =============================================================================

class EjecucionIntegral(BaseCompanyModel):
    """
    Ejecución Integral - Seguimiento del proceso de inducción por colaborador.

    Registra el avance de cada módulo de inducción para un colaborador específico.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='ejecuciones_induccion',
        verbose_name='Colaborador'
    )
    modulo = models.ForeignKey(
        ModuloInduccion,
        on_delete=models.PROTECT,
        related_name='ejecuciones',
        verbose_name='Módulo de Inducción'
    )

    # Estado y Fechas
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_EJECUCION_CHOICES,
        default='pendiente',
        db_index=True,
        verbose_name='Estado'
    )
    fecha_asignacion = models.DateField(
        auto_now_add=True,
        verbose_name='Fecha de Asignación'
    )
    fecha_limite = models.DateField(
        verbose_name='Fecha Límite'
    )
    fecha_inicio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Inicio'
    )
    fecha_finalizacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Finalización'
    )

    # Progreso
    progreso_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Progreso (%)'
    )
    tiempo_dedicado_minutos = models.PositiveIntegerField(
        default=0,
        verbose_name='Tiempo Dedicado (min)'
    )

    # Evaluación
    nota_obtenida = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Nota Obtenida'
    )
    intentos_realizados = models.PositiveIntegerField(
        default=0,
        verbose_name='Intentos Realizados'
    )
    respuestas_evaluacion = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Respuestas de Evaluación'
    )

    # Retroalimentación
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    retroalimentacion_colaborador = models.TextField(
        blank=True,
        verbose_name='Retroalimentación del Colaborador'
    )

    # Facilitador
    facilitador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inducciones_facilitadas',
        verbose_name='Facilitador'
    )

    class Meta:
        db_table = 'talent_hub_ejecucion_integral'
        verbose_name = 'Ejecución de Inducción'
        verbose_name_plural = 'Ejecuciones de Inducción'
        unique_together = ['colaborador', 'modulo']
        ordering = ['colaborador', 'modulo__orden']
        indexes = [
            models.Index(fields=['colaborador', 'estado']),
            models.Index(fields=['fecha_limite']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.modulo.nombre}"

    @property
    def esta_vencido(self):
        """Verifica si la ejecución está vencida."""
        from django.utils import timezone
        if self.estado in ['completado', 'cancelado']:
            return False
        return timezone.now().date() > self.fecha_limite

    @property
    def aprobo(self):
        """Verifica si aprobó el módulo."""
        if not self.modulo.requiere_evaluacion:
            return self.estado == 'completado'
        if self.nota_obtenida is None:
            return False
        return self.nota_obtenida >= self.modulo.nota_minima_aprobacion


# =============================================================================
# ENTREGA DE EPP
# =============================================================================

class EntregaEPP(BaseCompanyModel):
    """
    Entrega de EPP - Registro de entrega de Equipos de Protección Personal.

    Documenta la entrega de elementos de protección al colaborador durante
    el proceso de onboarding o reposiciones posteriores.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='entregas_epp',
        verbose_name='Colaborador'
    )

    tipo_epp = models.CharField(
        max_length=25,
        choices=TIPO_EPP_CHOICES,
        verbose_name='Tipo de EPP'
    )
    descripcion = models.CharField(
        max_length=200,
        verbose_name='Descripción del EPP'
    )
    marca = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Marca'
    )
    referencia = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Referencia/Modelo'
    )
    talla = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Talla'
    )
    cantidad = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad'
    )

    fecha_entrega = models.DateField(
        verbose_name='Fecha de Entrega',
        db_index=True
    )
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Vencimiento/Reposición'
    )

    # Entregado por
    entregado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='epp_entregados',
        verbose_name='Entregado Por'
    )

    # Conformidad
    recibido_conforme = models.BooleanField(
        default=True,
        verbose_name='Recibido Conforme'
    )
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Acta de Entrega
    acta_entrega = models.FileField(
        upload_to='onboarding/actas_epp/',
        null=True,
        blank=True,
        verbose_name='Acta de Entrega Firmada'
    )

    class Meta:
        db_table = 'talent_hub_entrega_epp'
        verbose_name = 'Entrega de EPP'
        verbose_name_plural = 'Entregas de EPP'
        ordering = ['-fecha_entrega']
        indexes = [
            models.Index(fields=['colaborador', 'tipo_epp']),
            models.Index(fields=['fecha_entrega']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.get_tipo_epp_display()} ({self.fecha_entrega})"

    @property
    def requiere_reposicion(self):
        """Verifica si el EPP requiere reposición."""
        if not self.fecha_vencimiento:
            return False
        from django.utils import timezone
        return timezone.now().date() >= self.fecha_vencimiento


# =============================================================================
# ENTREGA DE ACTIVOS
# =============================================================================

class EntregaActivo(BaseCompanyModel):
    """
    Entrega de Activo - Registro de entrega de activos empresariales.

    Documenta la entrega de herramientas, equipos y otros activos al
    colaborador durante el onboarding.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='entregas_activos',
        verbose_name='Colaborador'
    )

    tipo_activo = models.CharField(
        max_length=20,
        choices=TIPO_ACTIVO_CHOICES,
        verbose_name='Tipo de Activo'
    )
    descripcion = models.CharField(
        max_length=200,
        verbose_name='Descripción del Activo'
    )
    codigo_activo = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Código del Activo',
        help_text='Código de inventario interno'
    )
    serial = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de Serie'
    )
    marca = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Marca'
    )
    modelo = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Modelo'
    )

    # Valor
    valor_activo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Valor del Activo (COP)'
    )

    # Fechas
    fecha_entrega = models.DateField(
        verbose_name='Fecha de Entrega',
        db_index=True
    )
    fecha_devolucion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Devolución'
    )

    # Estado
    estado_entrega = models.CharField(
        max_length=20,
        choices=[
            ('nuevo', 'Nuevo'),
            ('buen_estado', 'Buen Estado'),
            ('uso_normal', 'Uso Normal'),
            ('desgastado', 'Desgastado'),
        ],
        default='nuevo',
        verbose_name='Estado al Entregar'
    )
    estado_devolucion = models.CharField(
        max_length=20,
        choices=[
            ('buen_estado', 'Buen Estado'),
            ('uso_normal', 'Uso Normal'),
            ('desgastado', 'Desgastado'),
            ('danado', 'Dañado'),
            ('perdido', 'Perdido'),
        ],
        blank=True,
        verbose_name='Estado al Devolver'
    )

    # Entrega
    entregado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activos_entregados',
        verbose_name='Entregado Por'
    )
    recibido_conforme = models.BooleanField(
        default=True,
        verbose_name='Recibido Conforme'
    )

    # Devolución
    recibido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activos_recibidos',
        verbose_name='Recibido Por (Devolución)'
    )
    devuelto = models.BooleanField(
        default=False,
        verbose_name='Devuelto'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Actas
    acta_entrega = models.FileField(
        upload_to='onboarding/actas_activos/',
        null=True,
        blank=True,
        verbose_name='Acta de Entrega'
    )
    acta_devolucion = models.FileField(
        upload_to='onboarding/actas_activos/',
        null=True,
        blank=True,
        verbose_name='Acta de Devolución'
    )

    class Meta:
        db_table = 'talent_hub_entrega_activo'
        verbose_name = 'Entrega de Activo'
        verbose_name_plural = 'Entregas de Activos'
        ordering = ['-fecha_entrega']
        indexes = [
            models.Index(fields=['colaborador', 'tipo_activo']),
            models.Index(fields=['codigo_activo']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.get_tipo_activo_display()} ({self.descripcion})"

    @property
    def esta_pendiente_devolucion(self):
        """Verifica si el activo está pendiente de devolución."""
        return not self.devuelto and self.colaborador.estado == 'retirado'


# =============================================================================
# FIRMA DE DOCUMENTOS
# =============================================================================

class FirmaDocumento(BaseCompanyModel):
    """
    Firma de Documento - Registro de documentos firmados durante onboarding.

    Documenta la firma de contratos, políticas y otros documentos requeridos
    durante el proceso de incorporación.
    """

    colaborador = models.ForeignKey(
        'colaboradores.Colaborador',
        on_delete=models.CASCADE,
        related_name='firmas_documentos',
        verbose_name='Colaborador'
    )

    tipo_documento = models.CharField(
        max_length=30,
        choices=TIPO_DOCUMENTO_FIRMA_CHOICES,
        verbose_name='Tipo de Documento'
    )
    nombre_documento = models.CharField(
        max_length=200,
        verbose_name='Nombre del Documento'
    )
    version = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Versión del Documento'
    )

    # Documento
    documento = models.FileField(
        upload_to='onboarding/documentos/',
        null=True,
        blank=True,
        verbose_name='Documento Original'
    )
    documento_firmado = models.FileField(
        upload_to='onboarding/documentos_firmados/',
        null=True,
        blank=True,
        verbose_name='Documento Firmado'
    )

    # Firma
    fecha_firma = models.DateField(
        verbose_name='Fecha de Firma',
        db_index=True
    )
    firmado = models.BooleanField(
        default=False,
        verbose_name='Firmado'
    )
    metodo_firma = models.CharField(
        max_length=20,
        choices=[
            ('fisico', 'Firma Física'),
            ('digital', 'Firma Digital'),
            ('electronica', 'Firma Electrónica'),
        ],
        default='fisico',
        verbose_name='Método de Firma'
    )

    # Testigo/Validador
    testigo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_testificados',
        verbose_name='Testigo/Validador'
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'talent_hub_firma_documento'
        verbose_name = 'Firma de Documento'
        verbose_name_plural = 'Firmas de Documentos'
        ordering = ['-fecha_firma']
        indexes = [
            models.Index(fields=['colaborador', 'tipo_documento']),
            models.Index(fields=['fecha_firma']),
        ]

    def __str__(self):
        return f"{self.colaborador.get_nombre_corto()} - {self.nombre_documento}"
