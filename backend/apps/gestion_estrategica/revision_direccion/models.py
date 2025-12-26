"""
Modelos para Revisión por la Dirección
Basado en ISO 9001:2015, ISO 14001:2015, ISO 45001:2018

Subtabs:
- Programación
- Actas de Revisión
- Seguimiento Compromisos
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

from apps.core.base_models import BaseCompanyModel, AuditModel, SoftDeleteModel, TimestampedModel


class ProgramaRevision(BaseCompanyModel):
    """Programación de revisiones por la dirección"""

    class Frecuencia(models.TextChoices):
        MENSUAL = 'mensual', 'Mensual'
        BIMESTRAL = 'bimestral', 'Bimestral'
        TRIMESTRAL = 'trimestral', 'Trimestral'
        CUATRIMESTRAL = 'cuatrimestral', 'Cuatrimestral'
        SEMESTRAL = 'semestral', 'Semestral'
        ANUAL = 'anual', 'Anual'

    class Estado(models.TextChoices):
        PROGRAMADA = 'programada', 'Programada'
        CONVOCADA = 'convocada', 'Convocada'
        REALIZADA = 'realizada', 'Realizada'
        CANCELADA = 'cancelada', 'Cancelada'
        REPROGRAMADA = 'reprogramada', 'Reprogramada'

    # empresa heredado de BaseCompanyModel
    anio = models.PositiveSmallIntegerField(help_text="Año del programa")
    periodo = models.CharField(max_length=50, help_text="Ej: 'Primer Semestre 2025'")

    frecuencia = models.CharField(
        max_length=20, choices=Frecuencia.choices,
        default=Frecuencia.SEMESTRAL
    )

    # Fechas de la revisión
    fecha_programada = models.DateField()
    fecha_realizada = models.DateField(null=True, blank=True)
    hora_inicio = models.TimeField(null=True, blank=True)
    duracion_estimada_horas = models.DecimalField(
        max_digits=4, decimal_places=1, default=2.0
    )

    lugar = models.CharField(max_length=200, blank=True, help_text="Lugar o sala de reunión")
    modalidad = models.CharField(max_length=50, blank=True, default='presencial')

    estado = models.CharField(
        max_length=20, choices=Estado.choices,
        default=Estado.PROGRAMADA, db_index=True
    )

    # Responsable de convocar
    responsable_convocatoria = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='revisiones_convocadas'
    )

    # Sistemas de gestión a revisar
    incluye_calidad = models.BooleanField(default=True, verbose_name="ISO 9001")
    incluye_sst = models.BooleanField(default=True, verbose_name="ISO 45001/SST")
    incluye_ambiental = models.BooleanField(default=True, verbose_name="ISO 14001")
    incluye_pesv = models.BooleanField(default=False, verbose_name="PESV")
    incluye_seguridad_info = models.BooleanField(default=False, verbose_name="ISO 27001")

    observaciones = models.TextField(blank=True)
    # Campos heredados de BaseCompanyModel: empresa, is_active, deleted_at,
    # created_at, updated_at, created_by, updated_by

    class Meta:
        verbose_name = 'Programa de Revisión'
        verbose_name_plural = 'Programas de Revisión'
        ordering = ['-anio', 'fecha_programada']
        unique_together = ['empresa', 'anio', 'periodo']

    def __str__(self):
        return f"Revisión {self.periodo} - {self.get_estado_display()}"


class ParticipanteRevision(models.Model):
    """Participantes convocados a la revisión"""

    class RolParticipacion(models.TextChoices):
        DIRECCION = 'direccion', 'Alta Dirección'
        LIDER_PROCESO = 'lider_proceso', 'Líder de Proceso'
        RESPONSABLE_SG = 'responsable_sg', 'Responsable SG'
        INVITADO = 'invitado', 'Invitado'
        SECRETARIO = 'secretario', 'Secretario'

    programa = models.ForeignKey(
        ProgramaRevision, on_delete=models.CASCADE, related_name='participantes'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='participaciones_revision'
    )
    rol = models.CharField(
        max_length=20, choices=RolParticipacion.choices,
        default=RolParticipacion.INVITADO
    )
    es_obligatorio = models.BooleanField(default=True)
    confirmo_asistencia = models.BooleanField(default=False)
    asistio = models.BooleanField(default=False)
    observaciones = models.CharField(max_length=300, blank=True)

    class Meta:
        verbose_name = 'Participante de Revisión'
        verbose_name_plural = 'Participantes de Revisión'
        unique_together = ['programa', 'usuario']

    def __str__(self):
        return f"{self.usuario.get_full_name()} - {self.get_rol_display()}"


class TemaRevision(models.Model):
    """Temas/Elementos de entrada para la revisión (según ISO)"""

    class CategoriaISO(models.TextChoices):
        # Entradas según ISO 9001, 14001, 45001
        ESTADO_ACCIONES = 'estado_acciones', 'Estado de acciones de revisiones previas'
        CAMBIOS_CONTEXTO = 'cambios_contexto', 'Cambios en cuestiones externas e internas'
        INFO_DESEMPENO = 'info_desempeno', 'Información sobre el desempeño del SG'
        SATISFACCION_CLIENTE = 'satisfaccion_cliente', 'Satisfacción del cliente y PI'
        OBJETIVOS = 'objetivos', 'Grado de cumplimiento de objetivos'
        NO_CONFORMIDADES = 'no_conformidades', 'No conformidades y acciones correctivas'
        AUDITORIAS = 'auditorias', 'Resultados de auditorías'
        PROVEEDORES = 'proveedores', 'Desempeño de proveedores externos'
        ADECUACION_RECURSOS = 'adecuacion_recursos', 'Adecuación de recursos'
        EFICACIA_ACCIONES = 'eficacia_acciones', 'Eficacia de acciones de riesgos'
        OPORTUNIDADES_MEJORA = 'oportunidades_mejora', 'Oportunidades de mejora'
        # SST específicos
        INCIDENTES = 'incidentes', 'Incidentes, no conformidades, acciones correctivas'
        PARTICIPACION = 'participacion', 'Consulta y participación trabajadores'
        REQUISITOS_LEGALES = 'requisitos_legales', 'Cumplimiento requisitos legales'
        # Otro
        OTRO = 'otro', 'Otro tema'

    programa = models.ForeignKey(
        ProgramaRevision, on_delete=models.CASCADE, related_name='temas'
    )
    categoria = models.CharField(
        max_length=30, choices=CategoriaISO.choices
    )
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)

    # Responsable de presentar el tema
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='temas_revision_asignados'
    )

    # Documento de soporte
    documento_soporte = models.FileField(
        upload_to='revisiones/documentos/', blank=True, null=True
    )

    orden = models.PositiveSmallIntegerField(default=1)
    fue_presentado = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Tema de Revisión'
        verbose_name_plural = 'Temas de Revisión'
        ordering = ['programa', 'orden']

    def __str__(self):
        return f"{self.orden}. {self.titulo}"


class ActaRevision(AuditModel, SoftDeleteModel):
    """Acta de la Revisión por la Dirección"""

    programa = models.OneToOneField(
        ProgramaRevision, on_delete=models.CASCADE, related_name='acta'
    )

    # Encabezado
    numero_acta = models.CharField(max_length=50)
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField(null=True, blank=True)
    lugar = models.CharField(max_length=200)

    # Contenido
    introduccion = models.TextField(blank=True, help_text="Introducción y objetivos de la reunión")
    orden_del_dia = models.TextField(blank=True)

    # Análisis general
    conclusiones_generales = models.TextField(
        blank=True, help_text="Conclusiones generales de la revisión"
    )

    # Decisiones de salida (según ISO)
    decisiones_mejora = models.TextField(
        blank=True, help_text="Oportunidades de mejora identificadas"
    )
    necesidad_cambios = models.TextField(
        blank=True, help_text="Necesidad de cambios en el SG"
    )
    necesidad_recursos = models.TextField(
        blank=True, help_text="Necesidades de recursos"
    )

    # Estado del SG
    evaluacion_sistema = models.CharField(max_length=50, choices=[
        ('adecuado', 'Adecuado'),
        ('parcialmente_adecuado', 'Parcialmente Adecuado'),
        ('no_adecuado', 'No Adecuado'),
    ], default='adecuado')

    observaciones_evaluacion = models.TextField(blank=True)

    # Firmas
    elaborado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='actas_revision_elaboradas'
    )
    fecha_elaboracion = models.DateField(null=True, blank=True)

    revisado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='actas_revision_revisadas'
    )
    fecha_revision = models.DateField(null=True, blank=True)

    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='actas_revision_aprobadas'
    )
    fecha_aprobacion = models.DateField(null=True, blank=True)

    # Documento final
    documento_acta = models.FileField(
        upload_to='revisiones/actas/', blank=True, null=True
    )

    version = models.PositiveSmallIntegerField(default=1)
    # Campos heredados de AuditModel y SoftDeleteModel:
    # created_at, updated_at, created_by, updated_by, is_active, deleted_at

    class Meta:
        verbose_name = 'Acta de Revisión'
        verbose_name_plural = 'Actas de Revisión'
        ordering = ['-fecha']

    def __str__(self):
        return f"Acta {self.numero_acta} - {self.fecha}"


class AnalisisTemaActa(models.Model):
    """Análisis de cada tema en el acta"""
    acta = models.ForeignKey(
        ActaRevision, on_delete=models.CASCADE, related_name='analisis_temas'
    )
    tema = models.ForeignKey(
        TemaRevision, on_delete=models.CASCADE, related_name='analisis'
    )

    presentado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True
    )
    resumen_presentacion = models.TextField(help_text="Resumen de la presentación")
    hallazgos = models.TextField(blank=True, help_text="Hallazgos principales")
    decisiones = models.TextField(blank=True, help_text="Decisiones tomadas")
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Análisis de Tema'
        verbose_name_plural = 'Análisis de Temas'
        unique_together = ['acta', 'tema']

    def __str__(self):
        return f"Análisis: {self.tema.titulo}"


class CompromisoRevision(AuditModel, SoftDeleteModel):
    """Compromisos derivados de la revisión por la dirección"""

    class Estado(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        EN_PROGRESO = 'en_progreso', 'En Progreso'
        COMPLETADO = 'completado', 'Completado'
        VENCIDO = 'vencido', 'Vencido'
        CANCELADO = 'cancelado', 'Cancelado'

    class Prioridad(models.TextChoices):
        ALTA = 'alta', 'Alta'
        MEDIA = 'media', 'Media'
        BAJA = 'baja', 'Baja'

    class TipoCompromiso(models.TextChoices):
        ACCION_CORRECTIVA = 'accion_correctiva', 'Acción Correctiva'
        ACCION_PREVENTIVA = 'accion_preventiva', 'Acción Preventiva'
        MEJORA = 'mejora', 'Oportunidad de Mejora'
        DECISION = 'decision', 'Decisión Directiva'
        ASIGNACION_RECURSO = 'asignacion_recurso', 'Asignación de Recurso'
        CAMBIO_SG = 'cambio_sg', 'Cambio en el Sistema de Gestión'
        OTRO = 'otro', 'Otro'

    acta = models.ForeignKey(
        ActaRevision, on_delete=models.CASCADE, related_name='compromisos'
    )
    tema_relacionado = models.ForeignKey(
        TemaRevision, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='compromisos'
    )

    consecutivo = models.CharField(max_length=30)
    tipo = models.CharField(
        max_length=20, choices=TipoCompromiso.choices,
        default=TipoCompromiso.MEJORA
    )
    descripcion = models.TextField()
    resultado_esperado = models.TextField(blank=True)

    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='compromisos_revision_asignados'
    )

    fecha_compromiso = models.DateField(help_text="Fecha límite de cumplimiento")
    fecha_cumplimiento = models.DateField(null=True, blank=True)

    estado = models.CharField(
        max_length=20, choices=Estado.choices,
        default=Estado.PENDIENTE, db_index=True
    )
    prioridad = models.CharField(
        max_length=10, choices=Prioridad.choices,
        default=Prioridad.MEDIA
    )

    porcentaje_avance = models.PositiveSmallIntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # Evidencias
    evidencia_cumplimiento = models.TextField(blank=True)
    documento_evidencia = models.FileField(
        upload_to='revisiones/evidencias/', blank=True, null=True
    )

    observaciones = models.TextField(blank=True)
    # Campos heredados de AuditModel y SoftDeleteModel:
    # created_at, updated_at, created_by, updated_by, is_active, deleted_at

    class Meta:
        verbose_name = 'Compromiso de Revisión'
        verbose_name_plural = 'Compromisos de Revisión'
        ordering = ['-prioridad', 'fecha_compromiso']

    def __str__(self):
        return f"{self.consecutivo}: {self.descripcion[:50]}"

    @property
    def dias_para_vencer(self):
        from django.utils import timezone
        if self.fecha_compromiso and self.estado not in ['completado', 'cancelado']:
            delta = self.fecha_compromiso - timezone.now().date()
            return delta.days
        return None

    @property
    def esta_vencido(self):
        dias = self.dias_para_vencer
        return dias is not None and dias < 0


class SeguimientoCompromiso(TimestampedModel):
    """Registro de seguimiento a compromisos"""
    compromiso = models.ForeignKey(
        CompromisoRevision, on_delete=models.CASCADE, related_name='seguimientos'
    )
    fecha = models.DateField()
    porcentaje_avance = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    descripcion_avance = models.TextField()
    evidencia = models.FileField(
        upload_to='revisiones/seguimientos/', blank=True, null=True
    )
    observaciones = models.TextField(blank=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='seguimientos_compromiso'
    )
    # created_at heredado de TimestampedModel

    class Meta:
        verbose_name = 'Seguimiento de Compromiso'
        verbose_name_plural = 'Seguimientos de Compromisos'
        ordering = ['-fecha']

    def __str__(self):
        return f"Seguimiento {self.compromiso.consecutivo} - {self.fecha}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Actualizar avance del compromiso
        self.compromiso.porcentaje_avance = self.porcentaje_avance
        if self.porcentaje_avance == 100:
            self.compromiso.estado = CompromisoRevision.Estado.COMPLETADO
            self.compromiso.fecha_cumplimiento = self.fecha
        elif self.porcentaje_avance > 0:
            self.compromiso.estado = CompromisoRevision.Estado.EN_PROGRESO
        self.compromiso.save(update_fields=['porcentaje_avance', 'estado', 'fecha_cumplimiento'])
