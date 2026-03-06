"""
Modelos para Seguridad Industrial - HSEQ Management
Gestión de permisos de trabajo, inspecciones, EPP y programas de seguridad
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


# =============================================================================
# PERMISOS DE TRABAJO
# =============================================================================

class TipoPermisoTrabajo(models.Model):
    """
    Catálogo de tipos de permisos de trabajo
    (Altura, Espacio Confinado, Trabajo en Caliente, etc.)
    """
    codigo = models.CharField(
        max_length=20,
        unique=True,
        help_text="Código único del tipo de permiso (ej: ALT, ESC, CAL)"
    )
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    color = models.CharField(
        max_length=7,
        default='#3B82F6',
        help_text="Color para identificación visual (hex)"
    )

    # Configuración
    requiere_autorizacion_sst = models.BooleanField(
        default=True,
        help_text="Requiere autorización del responsable SST"
    )
    requiere_autorizacion_operaciones = models.BooleanField(
        default=False,
        help_text="Requiere autorización de operaciones"
    )
    duracion_maxima_horas = models.IntegerField(
        default=8,
        validators=[MinValueValidator(1), MaxValueValidator(24)],
        help_text="Duración máxima permitida en horas"
    )

    # Checklist de seguridad
    checklist_items = models.JSONField(
        default=list,
        help_text="Lista de items de verificación ['Item 1', 'Item 2', ...]"
    )

    # Equipos/Elementos requeridos
    epp_requeridos = models.JSONField(
        default=list,
        help_text="EPP requeridos ['Casco', 'Arnés', ...]"
    )

    orden = models.IntegerField(default=0)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'hseq_tipo_permiso_trabajo'
        verbose_name = 'Tipo de Permiso de Trabajo'
        verbose_name_plural = 'Tipos de Permisos de Trabajo'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class PermisoTrabajo(models.Model):
    """
    Permisos de trabajo para actividades de alto riesgo
    """
    # Multi-tenant
    empresa_id = models.IntegerField(db_index=True)

    # Identificación
    numero_permiso = models.CharField(
        max_length=50,
        unique=True,
        help_text="Número único del permiso (auto-generado)"
    )
    tipo_permiso = models.ForeignKey(
        TipoPermisoTrabajo,
        on_delete=models.PROTECT,
        related_name='permisos'
    )

    # Ubicación y descripción
    ubicacion = models.CharField(
        max_length=200,
        help_text="Área o ubicación donde se realizará el trabajo"
    )
    descripcion_trabajo = models.TextField(
        help_text="Descripción detallada del trabajo a realizar"
    )

    # Fechas y horarios
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    duracion_horas = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0.5)],
        editable=False
    )

    # Personal
    solicitante = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='permisos_solicitados',
        help_text="Colaborador que solicita el permiso"
    )
    ejecutor = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='permisos_ejecutados',
        help_text="Colaborador que ejecutará el trabajo",
        null=True,
        blank=True
    )
    supervisor = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='permisos_supervisados',
        help_text="Supervisor responsable"
    )

    # Autorizaciones
    autorizado_sst = models.BooleanField(default=False)
    autorizado_sst_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permisos_autorizados_sst'
    )
    autorizado_sst_fecha = models.DateTimeField(null=True, blank=True)

    autorizado_operaciones = models.BooleanField(default=False)
    autorizado_operaciones_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permisos_autorizados_ops'
    )
    autorizado_operaciones_fecha = models.DateTimeField(null=True, blank=True)

    # Checklist de seguridad
    checklist_verificado = models.JSONField(
        default=dict,
        help_text="Estado de verificación del checklist {'item': True/False}"
    )

    # EPP utilizado
    epp_verificado = models.JSONField(
        default=list,
        help_text="EPP verificado como utilizado"
    )

    # Condiciones especiales
    requiere_vigilia = models.BooleanField(
        default=False,
        help_text="Requiere persona de vigilia durante el trabajo"
    )
    vigilia = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permisos_vigilia',
        help_text="Persona asignada como vigilia"
    )

    # Estado
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('PENDIENTE_APROBACION', 'Pendiente Aprobación'),
        ('APROBADO', 'Aprobado'),
        ('EN_EJECUCION', 'En Ejecución'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
        ('VENCIDO', 'Vencido'),
    ]
    estado = models.CharField(
        max_length=30,
        choices=ESTADO_CHOICES,
        default='BORRADOR',
        db_index=True
    )

    # Cierre
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    cerrado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permisos_cerrados'
    )
    observaciones_cierre = models.TextField(blank=True)

    # Incidentes/Hallazgos
    hubo_incidente = models.BooleanField(default=False)
    descripcion_incidente = models.TextField(blank=True)

    # Adjuntos
    documentos = models.JSONField(
        default=list,
        help_text="URLs de documentos adjuntos"
    )

    class Meta:
        db_table = 'hseq_permiso_trabajo'
        verbose_name = 'Permiso de Trabajo'
        verbose_name_plural = 'Permisos de Trabajo'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'fecha_inicio']),
            models.Index(fields=['numero_permiso']),
        ]

    def __str__(self):
        return f"{self.numero_permiso} - {self.tipo_permiso.nombre}"

    def save(self, *args, **kwargs):
        # Calcular duración
        if self.fecha_inicio and self.fecha_fin:
            delta = self.fecha_fin - self.fecha_inicio
            self.duracion_horas = delta.total_seconds() / 3600

        # Auto-generar número de permiso
        if not self.numero_permiso:
            from django.utils import timezone
            year = timezone.now().year
            # Contar permisos del año
            count = PermisoTrabajo.objects.filter(
                empresa_id=self.empresa_id,
                created_at__year=year
            ).count() + 1
            self.numero_permiso = f"PT-{year}-{count:05d}"

        super().save(*args, **kwargs)

    @property
    def esta_activo(self):
        """Verifica si el permiso está activo"""
        now = timezone.now()
        return (
            self.estado in ['APROBADO', 'EN_EJECUCION'] and
            self.fecha_inicio <= now <= self.fecha_fin
        )

    @property
    def esta_vencido(self):
        """Verifica si el permiso está vencido"""
        return timezone.now() > self.fecha_fin and self.estado not in ['COMPLETADO', 'CANCELADO']

    @property
    def puede_aprobar(self):
        """Verifica si puede ser aprobado"""
        return self.estado == 'PENDIENTE_APROBACION'


# =============================================================================
# INSPECCIONES
# =============================================================================

class TipoInspeccion(models.Model):
    """
    Tipos de inspecciones configurables por empresa
    (Equipos, EPP, Vehículos, Instalaciones, etc.)
    """
    empresa_id = models.IntegerField(db_index=True)

    codigo = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    # Frecuencia recomendada
    FRECUENCIA_CHOICES = [
        ('DIARIA', 'Diaria'),
        ('SEMANAL', 'Semanal'),
        ('QUINCENAL', 'Quincenal'),
        ('MENSUAL', 'Mensual'),
        ('TRIMESTRAL', 'Trimestral'),
        ('SEMESTRAL', 'Semestral'),
        ('ANUAL', 'Anual'),
        ('EVENTUAL', 'Eventual'),
    ]
    frecuencia_recomendada = models.CharField(
        max_length=20,
        choices=FRECUENCIA_CHOICES,
        default='MENSUAL'
    )

    # Responsables por defecto
    area_responsable = models.CharField(
        max_length=100,
        blank=True,
        help_text="Área responsable de realizar la inspección"
    )

    activo = models.BooleanField(default=True)
    orden = models.IntegerField(default=0)

    class Meta:
        db_table = 'hseq_tipo_inspeccion'
        verbose_name = 'Tipo de Inspección'
        verbose_name_plural = 'Tipos de Inspecciones'
        ordering = ['empresa_id', 'orden', 'nombre']
        unique_together = [['empresa_id', 'codigo']]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class PlantillaInspeccion(models.Model):
    """
    Plantillas de inspección con items a verificar
    """
    empresa_id = models.IntegerField(db_index=True)

    tipo_inspeccion = models.ForeignKey(
        TipoInspeccion,
        on_delete=models.CASCADE,
        related_name='plantillas'
    )

    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)

    # Items de verificación
    items = models.JSONField(
        default=list,
        help_text="""
        Lista de items: [
            {
                'id': 1,
                'categoria': 'General',
                'descripcion': 'Item a verificar',
                'es_critico': false,
                'criterio_cumplimiento': 'Descripción del criterio'
            }
        ]
        """
    )

    # Configuración de calificación
    requiere_calificacion_numerica = models.BooleanField(
        default=False,
        help_text="Requiere calificación numérica además de cumple/no cumple"
    )
    escala_minima = models.IntegerField(default=0)
    escala_maxima = models.IntegerField(default=10)

    # Umbrales
    umbral_critico = models.IntegerField(
        default=60,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Porcentaje de cumplimiento por debajo del cual es crítico"
    )

    version = models.IntegerField(default=1)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'hseq_plantilla_inspeccion'
        verbose_name = 'Plantilla de Inspección'
        verbose_name_plural = 'Plantillas de Inspecciones'
        ordering = ['tipo_inspeccion', '-version']

    def __str__(self):
        return f"{self.nombre} (v{self.version})"


class Inspeccion(models.Model):
    """
    Inspecciones realizadas
    """
    empresa_id = models.IntegerField(db_index=True)

    # Identificación
    numero_inspeccion = models.CharField(
        max_length=50,
        unique=True,
        help_text="Número único de inspección (auto-generado)"
    )
    tipo_inspeccion = models.ForeignKey(
        TipoInspeccion,
        on_delete=models.PROTECT,
        related_name='inspecciones'
    )
    plantilla = models.ForeignKey(
        PlantillaInspeccion,
        on_delete=models.PROTECT,
        related_name='inspecciones'
    )

    # Programación
    fecha_programada = models.DateField()
    fecha_realizada = models.DateTimeField(null=True, blank=True)

    # Ubicación
    ubicacion = models.CharField(
        max_length=200,
        help_text="Lugar específico de la inspección"
    )
    area = models.CharField(max_length=100, blank=True)

    # Responsables
    inspector = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='inspecciones_realizadas'
    )
    acompanante = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inspecciones_acompanadas',
        help_text="Persona que acompaña la inspección"
    )

    # Estado
    ESTADO_CHOICES = [
        ('PROGRAMADA', 'Programada'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PROGRAMADA',
        db_index=True
    )

    # Resultados
    porcentaje_cumplimiento = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    calificacion_general = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Clasificación de resultado
    RESULTADO_CHOICES = [
        ('SATISFACTORIO', 'Satisfactorio'),
        ('ACEPTABLE', 'Aceptable'),
        ('DEFICIENTE', 'Deficiente'),
        ('CRITICO', 'Crítico'),
    ]
    resultado_global = models.CharField(
        max_length=20,
        choices=RESULTADO_CHOICES,
        blank=True
    )

    # Hallazgos
    tiene_hallazgos = models.BooleanField(default=False)
    numero_hallazgos = models.IntegerField(default=0)
    numero_hallazgos_criticos = models.IntegerField(default=0)

    # Observaciones
    observaciones_generales = models.TextField(blank=True)
    recomendaciones = models.TextField(blank=True)

    # Evidencias
    fotos = models.JSONField(
        default=list,
        help_text="URLs de fotos de la inspección"
    )
    documentos = models.JSONField(
        default=list,
        help_text="URLs de documentos adjuntos"
    )

    class Meta:
        db_table = 'hseq_inspeccion'
        verbose_name = 'Inspección'
        verbose_name_plural = 'Inspecciones'
        ordering = ['-fecha_programada']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'fecha_programada']),
            models.Index(fields=['numero_inspeccion']),
        ]

    def __str__(self):
        return f"{self.numero_inspeccion} - {self.tipo_inspeccion.nombre}"

    def save(self, *args, **kwargs):
        # Auto-generar número de inspección
        if not self.numero_inspeccion:
            from django.utils import timezone
            year = timezone.now().year
            tipo_codigo = self.tipo_inspeccion.codigo
            count = Inspeccion.objects.filter(
                empresa_id=self.empresa_id,
                tipo_inspeccion=self.tipo_inspeccion,
                created_at__year=year
            ).count() + 1
            self.numero_inspeccion = f"INS-{tipo_codigo}-{year}-{count:04d}"

        super().save(*args, **kwargs)

    def calcular_cumplimiento(self):
        """Calcula el porcentaje de cumplimiento basado en los items"""
        items = self.items_inspeccion.all()
        if not items.exists():
            return 0

        total_items = items.count()
        items_conformes = items.filter(resultado='CONFORME').count()
        items_na = items.filter(resultado='NO_APLICA').count()

        # Excluir NA del cálculo
        items_aplicables = total_items - items_na
        if items_aplicables == 0:
            return 100

        porcentaje = (items_conformes / items_aplicables) * 100
        return round(porcentaje, 2)

    def clasificar_resultado(self):
        """Clasifica el resultado según el porcentaje de cumplimiento"""
        if self.porcentaje_cumplimiento is None:
            return None

        if self.porcentaje_cumplimiento >= 90:
            return 'SATISFACTORIO'
        elif self.porcentaje_cumplimiento >= 70:
            return 'ACEPTABLE'
        elif self.porcentaje_cumplimiento >= 50:
            return 'DEFICIENTE'
        else:
            return 'CRITICO'


class ItemInspeccion(models.Model):
    """
    Items verificados en cada inspección
    """
    inspeccion = models.ForeignKey(
        Inspeccion,
        on_delete=models.CASCADE,
        related_name='items_inspeccion'
    )

    # Referencia al item de la plantilla
    item_plantilla_id = models.IntegerField(
        help_text="ID del item en la plantilla"
    )
    categoria = models.CharField(max_length=100)
    descripcion = models.TextField()
    es_critico = models.BooleanField(default=False)

    # Resultado
    RESULTADO_CHOICES = [
        ('CONFORME', 'Conforme'),
        ('NO_CONFORME', 'No Conforme'),
        ('NO_APLICA', 'No Aplica'),
        ('OBSERVACION', 'Observación'),
    ]
    resultado = models.CharField(
        max_length=20,
        choices=RESULTADO_CHOICES
    )

    # Calificación numérica (opcional)
    calificacion = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )

    # Detalles
    observaciones = models.TextField(blank=True)
    accion_requerida = models.TextField(
        blank=True,
        help_text="Acción correctiva o preventiva requerida"
    )

    # Evidencia
    foto = models.URLField(
        blank=True,
        help_text="URL de foto del item inspeccionado"
    )

    # Seguimiento
    genera_hallazgo = models.BooleanField(
        default=False,
        help_text="Si genera hallazgo/no conformidad"
    )
    hallazgo_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID del hallazgo generado"
    )

    class Meta:
        db_table = 'hseq_item_inspeccion'
        verbose_name = 'Item de Inspección'
        verbose_name_plural = 'Items de Inspección'
        ordering = ['item_plantilla_id']

    def __str__(self):
        return f"{self.inspeccion.numero_inspeccion} - Item {self.item_plantilla_id}"


# =============================================================================
# CONTROL DE EPP
# =============================================================================

class TipoEPP(models.Model):
    """
    Catálogo de tipos de EPP (Equipos de Protección Personal)
    """
    codigo = models.CharField(
        max_length=20,
        unique=True,
        help_text="Código único del tipo de EPP"
    )
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    # Categoría
    CATEGORIA_CHOICES = [
        ('CABEZA', 'Protección de Cabeza'),
        ('OJOS_CARA', 'Protección de Ojos y Cara'),
        ('AUDITIVA', 'Protección Auditiva'),
        ('RESPIRATORIA', 'Protección Respiratoria'),
        ('MANOS', 'Protección de Manos'),
        ('PIES', 'Protección de Pies'),
        ('CUERPO', 'Protección del Cuerpo'),
        ('CAIDAS', 'Protección contra Caídas'),
        ('OTROS', 'Otros'),
    ]
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_CHOICES
    )

    # Vida útil
    vida_util_dias = models.IntegerField(
        null=True,
        blank=True,
        help_text="Vida útil en días (para programar reposición)"
    )

    # Normativas
    normas_aplicables = models.TextField(
        blank=True,
        help_text="Normas técnicas aplicables (ej: ANSI Z87.1, EN 166)"
    )

    # Control
    requiere_talla = models.BooleanField(default=False)
    tallas_disponibles = models.JSONField(
        default=list,
        help_text="Tallas disponibles ['S', 'M', 'L', 'XL']"
    )

    es_desechable = models.BooleanField(default=False)
    requiere_capacitacion = models.BooleanField(
        default=False,
        help_text="Requiere capacitación para su uso"
    )

    activo = models.BooleanField(default=True)
    orden = models.IntegerField(default=0)

    class Meta:
        db_table = 'hseq_tipo_epp'
        verbose_name = 'Tipo de EPP'
        verbose_name_plural = 'Tipos de EPP'
        ordering = ['categoria', 'orden', 'nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class EntregaEPP(models.Model):
    """
    Registro de entregas de EPP a colaboradores
    """
    empresa_id = models.IntegerField(db_index=True)

    # Identificación
    numero_entrega = models.CharField(
        max_length=50,
        unique=True,
        help_text="Número único de entrega (auto-generado)"
    )

    # Beneficiario
    colaborador = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='entregas_epp'
    )

    # Cross-module: Cargo del colaborador al momento de la entrega
    cargo_id_ref = models.PositiveBigIntegerField(
        null=True, blank=True, db_index=True,
        verbose_name='Cargo (referencia)',
        help_text='ID del cargo en core.Cargo al momento de la entrega'
    )
    cargo_nombre = models.CharField(
        max_length=200, blank=True,
        verbose_name='Cargo (nombre)',
        help_text='Nombre del cargo (cache para display sin join)'
    )

    # EPP entregado
    tipo_epp = models.ForeignKey(
        TipoEPP,
        on_delete=models.PROTECT,
        related_name='entregas'
    )

    # Detalles del elemento
    marca = models.CharField(max_length=100, blank=True)
    modelo = models.CharField(max_length=100, blank=True)
    talla = models.CharField(max_length=10, blank=True)
    serial = models.CharField(
        max_length=100,
        blank=True,
        help_text="Número de serie del elemento (si aplica)"
    )

    # Cantidad
    cantidad = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )

    # Fechas
    fecha_entrega = models.DateField()
    fecha_reposicion_programada = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha programada para reposición"
    )

    # Entrega
    entregado_por = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='epps_entregados',
        help_text="Persona que entrega el EPP"
    )

    # Capacitación
    capacitacion_realizada = models.BooleanField(
        default=False,
        help_text="Se realizó capacitación sobre el uso"
    )
    fecha_capacitacion = models.DateField(null=True, blank=True)

    # Estado
    ESTADO_CHOICES = [
        ('EN_USO', 'En Uso'),
        ('DEVUELTO', 'Devuelto'),
        ('EXTRAVIADO', 'Extraviado'),
        ('DANADO', 'Dañado'),
        ('VENCIDO', 'Vencido'),
    ]
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='EN_USO',
        db_index=True
    )

    # Devolución
    fecha_devolucion = models.DateField(null=True, blank=True)
    motivo_devolucion = models.TextField(blank=True)

    # Observaciones
    observaciones = models.TextField(blank=True)

    # Firma digital del colaborador (base64 o URL)
    firma_colaborador = models.TextField(
        blank=True,
        help_text="Firma digital del colaborador que recibe"
    )

    # Documentos
    foto_entrega = models.URLField(blank=True)
    documentos = models.JSONField(default=list)

    class Meta:
        db_table = 'hseq_entrega_epp'
        verbose_name = 'Entrega de EPP'
        verbose_name_plural = 'Entregas de EPP'
        ordering = ['-fecha_entrega']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'colaborador', 'estado']),
            models.Index(fields=['numero_entrega']),
        ]

    def __str__(self):
        return f"{self.numero_entrega} - {self.tipo_epp.nombre} - {self.colaborador}"

    def save(self, *args, **kwargs):
        # Auto-generar número de entrega
        if not self.numero_entrega:
            from django.utils import timezone
            year = timezone.now().year
            count = EntregaEPP.objects.filter(
                empresa_id=self.empresa_id,
                created_at__year=year
            ).count() + 1
            self.numero_entrega = f"EPP-{year}-{count:05d}"

        # Calcular fecha de reposición si tiene vida útil
        if not self.fecha_reposicion_programada and self.tipo_epp.vida_util_dias:
            from datetime import timedelta
            self.fecha_reposicion_programada = (
                self.fecha_entrega + timedelta(days=self.tipo_epp.vida_util_dias)
            )

        # Auto-populate cargo del colaborador si no se proporcionó
        if not self.cargo_id_ref and self.colaborador_id:
            try:
                user = self.colaborador
                if hasattr(user, 'cargo') and user.cargo:
                    self.cargo_id_ref = user.cargo_id
                    self.cargo_nombre = user.cargo.name
            except Exception:
                pass

        super().save(*args, **kwargs)

    @property
    def requiere_reposicion(self):
        """Verifica si requiere reposición"""
        if not self.fecha_reposicion_programada:
            return False
        from datetime import date, timedelta
        # Alertar 30 días antes
        return date.today() >= (self.fecha_reposicion_programada - timedelta(days=30))


# =============================================================================
# PROGRAMAS DE SEGURIDAD
# =============================================================================

class ProgramaSeguridad(models.Model):
    """
    Programas de seguridad industrial con actividades planificadas
    """
    empresa_id = models.IntegerField(db_index=True)

    # Identificación
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()

    # Tipo de programa
    TIPO_CHOICES = [
        ('PREVENCION_RIESGOS', 'Prevención de Riesgos'),
        ('CAPACITACION', 'Capacitación y Entrenamiento'),
        ('VIGILANCIA_SALUD', 'Vigilancia de la Salud'),
        ('INSPECCION', 'Inspección y Mantenimiento'),
        ('PREPARACION_EMERGENCIAS', 'Preparación para Emergencias'),
        ('INVESTIGACION_INCIDENTES', 'Investigación de Incidentes'),
        ('MEJORA_CONTINUA', 'Mejora Continua'),
        ('OTRO', 'Otro'),
    ]
    tipo_programa = models.CharField(
        max_length=30,
        choices=TIPO_CHOICES
    )

    # Alcance
    alcance = models.TextField(
        help_text="Alcance del programa (áreas, procesos, personal)"
    )

    # Responsables
    responsable = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='programas_seguridad_responsable'
    )
    equipo_apoyo = models.ManyToManyField(
        'core.User',
        blank=True,
        related_name='programas_seguridad_apoyo',
        help_text="Equipo de apoyo del programa"
    )

    # Periodo
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()

    # Objetivos
    objetivos = models.JSONField(
        default=list,
        help_text="Lista de objetivos del programa"
    )

    # Indicadores
    indicadores = models.JSONField(
        default=list,
        help_text="""
        Indicadores de seguimiento: [
            {
                'nombre': 'Nombre del indicador',
                'meta': 90,
                'unidad': '%',
                'frecuencia': 'MENSUAL'
            }
        ]
        """
    )

    # Actividades
    actividades = models.JSONField(
        default=list,
        help_text="""
        Actividades planificadas: [
            {
                'id': 1,
                'nombre': 'Actividad',
                'descripcion': 'Descripción',
                'responsable_id': 123,
                'fecha_inicio': '2024-01-01',
                'fecha_fin': '2024-01-31',
                'estado': 'PENDIENTE',
                'porcentaje_avance': 0
            }
        ]
        """
    )

    # Recursos
    presupuesto_asignado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    presupuesto_ejecutado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    recursos_requeridos = models.TextField(
        blank=True,
        help_text="Descripción de recursos necesarios"
    )

    # Estado
    ESTADO_CHOICES = [
        ('PLANIFICADO', 'Planificado'),
        ('EN_EJECUCION', 'En Ejecución'),
        ('PAUSADO', 'Pausado'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PLANIFICADO',
        db_index=True
    )

    # Seguimiento
    porcentaje_avance = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    fecha_ultima_revision = models.DateField(null=True, blank=True)
    resultado_ultima_revision = models.TextField(blank=True)

    # Documentación
    documentos = models.JSONField(
        default=list,
        help_text="Documentos del programa (manuales, procedimientos, etc.)"
    )

    # Normativa
    normativa_aplicable = models.TextField(
        blank=True,
        help_text="Normativa o estándares aplicables"
    )

    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'hseq_programa_seguridad'
        verbose_name = 'Programa de Seguridad'
        verbose_name_plural = 'Programas de Seguridad'
        ordering = ['-fecha_inicio']
        unique_together = [['empresa_id', 'codigo']]
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'fecha_inicio']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def calcular_avance(self):
        """Calcula el porcentaje de avance basado en las actividades"""
        if not self.actividades:
            return 0

        total_actividades = len(self.actividades)
        avance_total = sum(
            actividad.get('porcentaje_avance', 0)
            for actividad in self.actividades
        )

        return round(avance_total / total_actividades, 2) if total_actividades > 0 else 0

    @property
    def esta_vigente(self):
        """Verifica si el programa está vigente"""
        from datetime import date
        today = date.today()
        return self.fecha_inicio <= today <= self.fecha_fin

    @property
    def dias_restantes(self):
        """Calcula días restantes del programa"""
        from datetime import date
        if self.fecha_fin < date.today():
            return 0
        return (self.fecha_fin - date.today()).days
