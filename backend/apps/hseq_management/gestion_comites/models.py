"""
Modelos para Gestión de Comités HSEQ
Maneja comités dinámicos (COPASST, COCOLA, CSV, Brigadas, etc.)
con reuniones, actas, votaciones y seguimiento de compromisos.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class TipoComite(models.Model):
    """
    Configuración de tipos de comités (100% dinámico).
    Ejemplos: COPASST, COCOLA, CSV, Brigadas, Comité de Convivencia, etc.
    """
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )
    codigo = models.CharField(
        max_length=20,
        help_text="Código único del tipo de comité (ej: COPASST, COCOLA, CSV)"
    )
    nombre = models.CharField(
        max_length=200,
        help_text="Nombre del tipo de comité"
    )
    descripcion = models.TextField(
        blank=True,
        help_text="Descripción y alcance del comité"
    )
    normativa_base = models.CharField(
        max_length=500,
        blank=True,
        help_text="Marco normativo que regula este comité (ej: Resolución 2013 de 1986)"
    )

    # Configuración de periodicidad
    periodicidad_reuniones = models.CharField(
        max_length=20,
        choices=[
            ('MENSUAL', 'Mensual'),
            ('BIMESTRAL', 'Bimestral'),
            ('TRIMESTRAL', 'Trimestral'),
            ('SEMESTRAL', 'Semestral'),
            ('ANUAL', 'Anual'),
            ('PERSONALIZADO', 'Personalizado'),
        ],
        default='MENSUAL',
        help_text="Frecuencia de reuniones ordinarias"
    )

    # Configuración de miembros
    num_minimo_miembros = models.PositiveIntegerField(
        default=2,
        help_text="Número mínimo de miembros requerido"
    )
    num_maximo_miembros = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Número máximo de miembros permitido"
    )
    requiere_eleccion = models.BooleanField(
        default=True,
        help_text="Si requiere proceso de elección de miembros"
    )
    duracion_periodo_meses = models.PositiveIntegerField(
        default=24,
        help_text="Duración del periodo en meses (ej: 24 para COPASST)"
    )

    # Roles configurables
    roles_disponibles = models.JSONField(
        default=list,
        help_text="Roles disponibles en el comité (ej: ['Presidente', 'Secretario', 'Representante'])"
    )

    # Configuración de quorum
    requiere_quorum = models.BooleanField(
        default=True,
        help_text="Si requiere quorum mínimo para sesionar"
    )
    porcentaje_quorum = models.PositiveIntegerField(
        default=50,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Porcentaje mínimo de asistencia para quorum"
    )

    activo = models.BooleanField(
        default=True,
        help_text="Si el tipo de comité está activo"
    )

    class Meta:
        db_table = 'hseq_tipo_comite'
        verbose_name = 'Tipo de Comité'
        verbose_name_plural = 'Tipos de Comité'
        unique_together = [['empresa_id', 'codigo']]
        ordering = ['empresa_id', 'nombre']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Comite(models.Model):
    """
    Comités activos con periodo vigente y miembros asignados.
    """
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )
    tipo_comite = models.ForeignKey(
        TipoComite,
        on_delete=models.PROTECT,
        related_name='comites',
        help_text="Tipo de comité"
    )
    codigo_comite = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único del comité (ej: COPASST-2024-2026)"
    )
    nombre = models.CharField(
        max_length=200,
        help_text="Nombre del comité activo"
    )

    # Periodo
    fecha_inicio = models.DateField(
        help_text="Fecha de inicio del periodo"
    )
    fecha_fin = models.DateField(
        help_text="Fecha de finalización del periodo"
    )
    periodo_descripcion = models.CharField(
        max_length=100,
        help_text="Descripción del periodo (ej: 2024-2026)"
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('CONFORMACION', 'En Conformación'),
            ('ACTIVO', 'Activo'),
            ('SUSPENDIDO', 'Suspendido'),
            ('FINALIZADO', 'Finalizado'),
        ],
        default='CONFORMACION',
        help_text="Estado del comité"
    )

    # Acta de conformación
    acta_conformacion = models.FileField(
        upload_to='comites/actas_conformacion/',
        null=True,
        blank=True,
        help_text="Acta de conformación del comité"
    )
    fecha_conformacion = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de conformación oficial"
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        help_text="Observaciones generales del comité"
    )

    class Meta:
        db_table = 'hseq_comite'
        verbose_name = 'Comité'
        verbose_name_plural = 'Comités'
        ordering = ['empresa_id', '-fecha_inicio']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['tipo_comite', 'estado']),
            models.Index(fields=['fecha_inicio', 'fecha_fin']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.periodo_descripcion})"

    @property
    def esta_vigente(self):
        """Verifica si el comité está vigente."""
        from django.utils import timezone
        hoy = timezone.now().date()
        return self.fecha_inicio <= hoy <= self.fecha_fin and self.estado == 'ACTIVO'

    @property
    def num_miembros(self):
        """Retorna el número de miembros activos."""
        return self.miembros.filter(activo=True).count()

    def cumple_quorum(self, num_asistentes):
        """Verifica si se cumple el quorum con el número de asistentes."""
        if not self.tipo_comite.requiere_quorum:
            return True

        total_miembros = self.num_miembros
        if total_miembros == 0:
            return False

        porcentaje_asistencia = (num_asistentes / total_miembros) * 100
        return porcentaje_asistencia >= self.tipo_comite.porcentaje_quorum


class MiembroComite(models.Model):
    """
    Miembros de un comité con rol asignado.
    """
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )
    comite = models.ForeignKey(
        Comite,
        on_delete=models.CASCADE,
        related_name='miembros',
        help_text="Comité al que pertenece"
    )
    empleado_id = models.IntegerField(
        db_index=True,
        help_text="ID del empleado miembro del comité"
    )
    empleado_nombre = models.CharField(
        max_length=200,
        help_text="Nombre completo del empleado (denormalizado)"
    )
    empleado_cargo = models.CharField(
        max_length=200,
        blank=True,
        help_text="Cargo del empleado (denormalizado)"
    )

    # Rol en el comité
    rol = models.CharField(
        max_length=50,
        help_text="Rol en el comité (ej: Presidente, Secretario, Representante)"
    )
    es_principal = models.BooleanField(
        default=True,
        help_text="Si es miembro principal (False = suplente)"
    )

    # Representación
    representa_a = models.CharField(
        max_length=100,
        blank=True,
        help_text="A quién representa (ej: Empleador, Trabajadores)"
    )

    # Vigencia
    fecha_inicio = models.DateField(
        help_text="Fecha de inicio como miembro"
    )
    fecha_fin = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de finalización como miembro"
    )
    activo = models.BooleanField(
        default=True,
        help_text="Si el miembro está activo"
    )

    # Elección (si aplica)
    numero_votos = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Número de votos obtenidos en elección"
    )
    acta_eleccion = models.FileField(
        upload_to='comites/actas_eleccion/',
        null=True,
        blank=True,
        help_text="Acta de elección del miembro"
    )

    # Motivo de retiro
    motivo_retiro = models.CharField(
        max_length=200,
        blank=True,
        help_text="Motivo de retiro del comité"
    )

    class Meta:
        db_table = 'hseq_miembro_comite'
        verbose_name = 'Miembro de Comité'
        verbose_name_plural = 'Miembros de Comité'
        ordering = ['comite', '-es_principal', 'rol', 'empleado_nombre']
        indexes = [
            models.Index(fields=['empresa_id', 'activo']),
            models.Index(fields=['comite', 'activo']),
            models.Index(fields=['empleado_id']),
        ]

    def __str__(self):
        tipo = "Principal" if self.es_principal else "Suplente"
        return f"{self.empleado_nombre} - {self.rol} ({tipo})"


class Reunion(models.Model):
    """
    Reuniones programadas y realizadas del comité.
    """
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )
    comite = models.ForeignKey(
        Comite,
        on_delete=models.CASCADE,
        related_name='reuniones',
        help_text="Comité que realiza la reunión"
    )
    numero_reunion = models.CharField(
        max_length=50,
        help_text="Número correlativo de la reunión (ej: 001/2024)"
    )

    # Tipo y clasificación
    tipo = models.CharField(
        max_length=20,
        choices=[
            ('ORDINARIA', 'Ordinaria'),
            ('EXTRAORDINARIA', 'Extraordinaria'),
        ],
        default='ORDINARIA',
        help_text="Tipo de reunión"
    )

    # Programación
    fecha_programada = models.DateField(
        help_text="Fecha programada para la reunión"
    )
    hora_inicio_programada = models.TimeField(
        help_text="Hora de inicio programada"
    )
    hora_fin_programada = models.TimeField(
        null=True,
        blank=True,
        help_text="Hora de finalización programada"
    )

    # Realización
    fecha_realizada = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha real de la reunión"
    )
    hora_inicio_real = models.TimeField(
        null=True,
        blank=True,
        help_text="Hora real de inicio"
    )
    hora_fin_real = models.TimeField(
        null=True,
        blank=True,
        help_text="Hora real de finalización"
    )

    # Ubicación
    lugar = models.CharField(
        max_length=200,
        help_text="Lugar donde se realiza la reunión"
    )
    modalidad = models.CharField(
        max_length=20,
        choices=[
            ('PRESENCIAL', 'Presencial'),
            ('VIRTUAL', 'Virtual'),
            ('HIBRIDA', 'Híbrida'),
        ],
        default='PRESENCIAL',
        help_text="Modalidad de la reunión"
    )
    enlace_virtual = models.URLField(
        blank=True,
        help_text="Enlace para reunión virtual"
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('PROGRAMADA', 'Programada'),
            ('EN_CURSO', 'En Curso'),
            ('REALIZADA', 'Realizada'),
            ('CANCELADA', 'Cancelada'),
            ('REPROGRAMADA', 'Reprogramada'),
        ],
        default='PROGRAMADA',
        help_text="Estado de la reunión"
    )

    # Quorum
    cumple_quorum = models.BooleanField(
        default=False,
        help_text="Si se cumplió el quorum"
    )
    num_asistentes = models.PositiveIntegerField(
        default=0,
        help_text="Número de asistentes"
    )

    # Agenda
    agenda = models.TextField(
        help_text="Agenda de la reunión"
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        help_text="Observaciones de la reunión"
    )
    motivo_cancelacion = models.CharField(
        max_length=500,
        blank=True,
        help_text="Motivo de cancelación o reprogramación"
    )

    class Meta:
        db_table = 'hseq_reunion'
        verbose_name = 'Reunión'
        verbose_name_plural = 'Reuniones'
        ordering = ['comite', '-fecha_programada']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['comite', 'fecha_programada']),
            models.Index(fields=['fecha_programada']),
        ]

    def __str__(self):
        return f"Reunión {self.numero_reunion} - {self.comite.nombre}"

    @property
    def duracion_minutos(self):
        """Calcula la duración de la reunión en minutos."""
        if self.hora_inicio_real and self.hora_fin_real:
            from datetime import datetime
            inicio = datetime.combine(self.fecha_realizada or self.fecha_programada, self.hora_inicio_real)
            fin = datetime.combine(self.fecha_realizada or self.fecha_programada, self.hora_fin_real)
            duracion = fin - inicio
            return int(duracion.total_seconds() / 60)
        return None


class AsistenciaReunion(models.Model):
    """
    Registro de asistencia a reuniones.
    """
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )
    reunion = models.ForeignKey(
        Reunion,
        on_delete=models.CASCADE,
        related_name='asistencias',
        help_text="Reunión"
    )
    miembro = models.ForeignKey(
        MiembroComite,
        on_delete=models.CASCADE,
        related_name='asistencias',
        help_text="Miembro del comité"
    )

    asistio = models.BooleanField(
        default=False,
        help_text="Si asistió a la reunión"
    )
    hora_llegada = models.TimeField(
        null=True,
        blank=True,
        help_text="Hora de llegada"
    )
    excusa = models.CharField(
        max_length=500,
        blank=True,
        help_text="Excusa por inasistencia"
    )
    excusa_justificada = models.BooleanField(
        default=False,
        help_text="Si la excusa fue justificada"
    )

    observaciones = models.TextField(
        blank=True,
        help_text="Observaciones sobre la asistencia"
    )

    class Meta:
        db_table = 'hseq_asistencia_reunion'
        verbose_name = 'Asistencia a Reunión'
        verbose_name_plural = 'Asistencias a Reuniones'
        unique_together = [['reunion', 'miembro']]
        ordering = ['reunion', 'miembro']
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['reunion']),
            models.Index(fields=['miembro']),
        ]

    def __str__(self):
        estado = "Asistió" if self.asistio else "No asistió"
        return f"{self.miembro.empleado_nombre} - {estado}"


class ActaReunion(models.Model):
    """
    Actas de reuniones con temas tratados, decisiones y compromisos.
    """
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )
    reunion = models.OneToOneField(
        Reunion,
        on_delete=models.CASCADE,
        related_name='acta',
        help_text="Reunión a la que corresponde el acta"
    )
    numero_acta = models.CharField(
        max_length=50,
        unique=True,
        help_text="Número de acta (ej: ACTA-COPASST-001/2024)"
    )

    # Contenido
    desarrollo = models.TextField(
        help_text="Desarrollo de la reunión y temas tratados"
    )
    conclusiones = models.TextField(
        blank=True,
        help_text="Conclusiones de la reunión"
    )
    decisiones = models.TextField(
        blank=True,
        help_text="Decisiones tomadas"
    )

    # Próxima reunión
    proxima_reunion_fecha = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha programada para próxima reunión"
    )
    proxima_reunion_agenda = models.TextField(
        blank=True,
        help_text="Temas para próxima reunión"
    )

    # Aprobación
    estado = models.CharField(
        max_length=20,
        choices=[
            ('BORRADOR', 'Borrador'),
            ('REVISION', 'En Revisión'),
            ('APROBADA', 'Aprobada'),
            ('RECHAZADA', 'Rechazada'),
        ],
        default='BORRADOR',
        help_text="Estado del acta"
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha de aprobación del acta"
    )
    aprobada_por_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID del usuario que aprobó el acta"
    )
    aprobada_por_nombre = models.CharField(
        max_length=200,
        blank=True,
        help_text="Nombre del usuario que aprobó (denormalizado)"
    )

    # Archivo
    archivo_pdf = models.FileField(
        upload_to='comites/actas/',
        null=True,
        blank=True,
        help_text="Archivo PDF del acta firmada"
    )

    # Firmas digitales (JSON con datos de firmantes)
    firmas = models.JSONField(
        default=list,
        help_text="Lista de firmas digitales del acta"
    )

    observaciones_revision = models.TextField(
        blank=True,
        help_text="Observaciones durante la revisión"
    )

    class Meta:
        db_table = 'hseq_acta_reunion'
        verbose_name = 'Acta de Reunión'
        verbose_name_plural = 'Actas de Reunión'
        ordering = ['reunion__comite', '-reunion__fecha_programada']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['reunion']),
            models.Index(fields=['numero_acta']),
        ]

    def __str__(self):
        return f"{self.numero_acta} - {self.reunion.comite.nombre}"


class Compromiso(models.Model):
    """
    Compromisos derivados de actas con seguimiento de cumplimiento.
    """
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )
    acta = models.ForeignKey(
        ActaReunion,
        on_delete=models.CASCADE,
        related_name='compromisos',
        help_text="Acta de la que se deriva el compromiso"
    )
    numero_compromiso = models.CharField(
        max_length=50,
        help_text="Número del compromiso"
    )

    # Descripción
    descripcion = models.TextField(
        help_text="Descripción del compromiso"
    )
    tipo = models.CharField(
        max_length=50,
        choices=[
            ('ACCION', 'Acción a ejecutar'),
            ('SEGUIMIENTO', 'Seguimiento'),
            ('VERIFICACION', 'Verificación'),
            ('INVESTIGACION', 'Investigación'),
            ('CAPACITACION', 'Capacitación'),
            ('INSPECCION', 'Inspección'),
            ('OTRO', 'Otro'),
        ],
        default='ACCION',
        help_text="Tipo de compromiso"
    )

    # Responsable
    responsable_id = models.IntegerField(
        db_index=True,
        help_text="ID del responsable del compromiso"
    )
    responsable_nombre = models.CharField(
        max_length=200,
        help_text="Nombre del responsable (denormalizado)"
    )
    area_responsable = models.CharField(
        max_length=200,
        blank=True,
        help_text="Área responsable"
    )

    # Plazos
    fecha_compromiso = models.DateField(
        help_text="Fecha en que se adquirió el compromiso"
    )
    fecha_limite = models.DateField(
        help_text="Fecha límite de cumplimiento"
    )
    fecha_cierre = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de cierre del compromiso"
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('PENDIENTE', 'Pendiente'),
            ('EN_PROCESO', 'En Proceso'),
            ('COMPLETADO', 'Completado'),
            ('VENCIDO', 'Vencido'),
            ('CANCELADO', 'Cancelado'),
        ],
        default='PENDIENTE',
        help_text="Estado del compromiso"
    )
    porcentaje_avance = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Porcentaje de avance del compromiso"
    )

    # Prioridad
    prioridad = models.CharField(
        max_length=20,
        choices=[
            ('BAJA', 'Baja'),
            ('MEDIA', 'Media'),
            ('ALTA', 'Alta'),
            ('CRITICA', 'Crítica'),
        ],
        default='MEDIA',
        help_text="Prioridad del compromiso"
    )

    # Evidencias
    evidencias = models.JSONField(
        default=list,
        help_text="Lista de evidencias del cumplimiento"
    )

    # Verificación
    verificado_por_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID del usuario que verificó el cumplimiento"
    )
    verificado_por_nombre = models.CharField(
        max_length=200,
        blank=True,
        help_text="Nombre del verificador (denormalizado)"
    )
    fecha_verificacion = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de verificación"
    )
    observaciones_verificacion = models.TextField(
        blank=True,
        help_text="Observaciones de la verificación"
    )

    # Seguimiento
    observaciones = models.TextField(
        blank=True,
        help_text="Observaciones generales del compromiso"
    )

    class Meta:
        db_table = 'hseq_compromiso'
        verbose_name = 'Compromiso'
        verbose_name_plural = 'Compromisos'
        ordering = ['acta__reunion__comite', '-fecha_limite']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['acta']),
            models.Index(fields=['responsable_id']),
            models.Index(fields=['fecha_limite']),
            models.Index(fields=['estado', 'fecha_limite']),
        ]

    def __str__(self):
        return f"{self.numero_compromiso} - {self.descripcion[:50]}"

    @property
    def esta_vencido(self):
        """Verifica si el compromiso está vencido."""
        from django.utils import timezone
        if self.estado in ['COMPLETADO', 'CANCELADO']:
            return False
        return self.fecha_limite < timezone.now().date()

    @property
    def dias_para_vencimiento(self):
        """Calcula días para vencimiento (negativo si está vencido)."""
        from django.utils import timezone
        delta = self.fecha_limite - timezone.now().date()
        return delta.days


class SeguimientoCompromiso(models.Model):
    """
    Seguimiento detallado de compromisos.
    """
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )
    compromiso = models.ForeignKey(
        Compromiso,
        on_delete=models.CASCADE,
        related_name='seguimientos',
        help_text="Compromiso al que se hace seguimiento"
    )

    fecha_seguimiento = models.DateField(
        help_text="Fecha del seguimiento"
    )
    avance_reportado = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Porcentaje de avance reportado"
    )

    descripcion_avance = models.TextField(
        help_text="Descripción del avance realizado"
    )
    evidencias = models.JSONField(
        default=list,
        help_text="Evidencias del avance"
    )

    dificultades = models.TextField(
        blank=True,
        help_text="Dificultades encontradas"
    )
    requiere_apoyo = models.BooleanField(
        default=False,
        help_text="Si requiere apoyo adicional"
    )
    tipo_apoyo_requerido = models.CharField(
        max_length=500,
        blank=True,
        help_text="Tipo de apoyo requerido"
    )

    registrado_por_id = models.IntegerField(
        help_text="ID del usuario que registró el seguimiento"
    )
    registrado_por_nombre = models.CharField(
        max_length=200,
        help_text="Nombre del usuario (denormalizado)"
    )

    class Meta:
        db_table = 'hseq_seguimiento_compromiso'
        verbose_name = 'Seguimiento de Compromiso'
        verbose_name_plural = 'Seguimientos de Compromisos'
        ordering = ['compromiso', '-fecha_seguimiento']
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['compromiso', 'fecha_seguimiento']),
        ]

    def __str__(self):
        return f"Seguimiento {self.compromiso.numero_compromiso} - {self.fecha_seguimiento}"


class Votacion(models.Model):
    """
    Votaciones realizadas en el comité.
    """
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )
    comite = models.ForeignKey(
        Comite,
        on_delete=models.CASCADE,
        related_name='votaciones',
        help_text="Comité que realiza la votación"
    )
    reunion = models.ForeignKey(
        Reunion,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='votaciones',
        help_text="Reunión en la que se realiza la votación (opcional)"
    )
    numero_votacion = models.CharField(
        max_length=50,
        help_text="Número de la votación"
    )

    # Descripción
    titulo = models.CharField(
        max_length=300,
        help_text="Título de la votación"
    )
    descripcion = models.TextField(
        help_text="Descripción detallada del tema a votar"
    )
    tipo = models.CharField(
        max_length=50,
        choices=[
            ('ELECCION', 'Elección de miembros'),
            ('DECISION', 'Decisión del comité'),
            ('APROBACION', 'Aprobación de documento'),
            ('OTRO', 'Otro'),
        ],
        default='DECISION',
        help_text="Tipo de votación"
    )

    # Periodo de votación
    fecha_inicio = models.DateTimeField(
        help_text="Fecha y hora de inicio de votación"
    )
    fecha_fin = models.DateTimeField(
        help_text="Fecha y hora de cierre de votación"
    )

    # Configuración
    es_secreta = models.BooleanField(
        default=False,
        help_text="Si la votación es secreta"
    )
    requiere_mayoria_simple = models.BooleanField(
        default=True,
        help_text="Si requiere mayoría simple (50%+1)"
    )
    porcentaje_mayoria_requerido = models.PositiveIntegerField(
        default=50,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Porcentaje de mayoría requerido"
    )
    permite_abstencion = models.BooleanField(
        default=True,
        help_text="Si permite abstención"
    )

    # Opciones de votación (JSON)
    opciones = models.JSONField(
        default=list,
        help_text="Opciones de votación (ej: [{'id': 1, 'texto': 'A favor'}, ...])"
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=[
            ('PROGRAMADA', 'Programada'),
            ('EN_CURSO', 'En Curso'),
            ('CERRADA', 'Cerrada'),
            ('CANCELADA', 'Cancelada'),
        ],
        default='PROGRAMADA',
        help_text="Estado de la votación"
    )

    # Resultados
    total_votos_emitidos = models.PositiveIntegerField(
        default=0,
        help_text="Total de votos emitidos"
    )
    resultados = models.JSONField(
        default=dict,
        help_text="Resultados de la votación"
    )
    opcion_ganadora = models.CharField(
        max_length=500,
        blank=True,
        help_text="Opción ganadora"
    )

    # Cierre
    fecha_cierre_real = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha real de cierre"
    )
    cerrada_por_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID del usuario que cerró la votación"
    )

    observaciones = models.TextField(
        blank=True,
        help_text="Observaciones de la votación"
    )

    class Meta:
        db_table = 'hseq_votacion'
        verbose_name = 'Votación'
        verbose_name_plural = 'Votaciones'
        ordering = ['comite', '-fecha_inicio']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['comite', 'fecha_inicio']),
            models.Index(fields=['reunion']),
        ]

    def __str__(self):
        return f"{self.numero_votacion} - {self.titulo}"

    @property
    def esta_activa(self):
        """Verifica si la votación está activa."""
        from django.utils import timezone
        ahora = timezone.now()
        return (
            self.estado == 'EN_CURSO' and
            self.fecha_inicio <= ahora <= self.fecha_fin
        )


class VotoMiembro(models.Model):
    """
    Votos individuales de miembros del comité.
    """
    empresa_id = models.IntegerField(
        db_index=True,
        help_text="ID de la empresa (multi-tenant)"
    )
    votacion = models.ForeignKey(
        Votacion,
        on_delete=models.CASCADE,
        related_name='votos',
        help_text="Votación"
    )
    miembro = models.ForeignKey(
        MiembroComite,
        on_delete=models.CASCADE,
        related_name='votos',
        help_text="Miembro que emite el voto"
    )

    # Voto
    fecha_voto = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha y hora del voto"
    )
    opcion_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID de la opción votada"
    )
    opcion_texto = models.CharField(
        max_length=500,
        blank=True,
        help_text="Texto de la opción votada (denormalizado)"
    )

    # Abstención
    es_abstencion = models.BooleanField(
        default=False,
        help_text="Si es una abstención"
    )
    justificacion_abstencion = models.TextField(
        blank=True,
        help_text="Justificación de la abstención"
    )

    # Comentarios
    comentarios = models.TextField(
        blank=True,
        help_text="Comentarios adicionales del voto"
    )

    # Anonimización (para votaciones secretas)
    voto_hash = models.CharField(
        max_length=64,
        blank=True,
        help_text="Hash del voto para votaciones secretas"
    )

    class Meta:
        db_table = 'hseq_voto_miembro'
        verbose_name = 'Voto de Miembro'
        verbose_name_plural = 'Votos de Miembros'
        unique_together = [['votacion', 'miembro']]
        ordering = ['votacion', 'fecha_voto']
        indexes = [
            models.Index(fields=['empresa_id']),
            models.Index(fields=['votacion']),
            models.Index(fields=['miembro']),
        ]

    def __str__(self):
        if self.es_abstencion:
            return f"{self.miembro.empleado_nombre} - Abstención"
        return f"{self.miembro.empleado_nombre} - {self.opcion_texto}"
