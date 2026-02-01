"""
Modelos para Medicina Laboral - HSEQ Management

Sistema de gestión de medicina laboral y vigilancia epidemiológica
Incluye:
- Tipos de exámenes médicos
- Exámenes médicos ocupacionales
- Restricciones médicas
- Programas de vigilancia epidemiológica (PVE)
- Casos en vigilancia
- Diagnósticos ocupacionales
- Estadísticas médicas
"""
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal


class TipoExamen(models.Model):
    """
    Catálogo de tipos de exámenes médicos ocupacionales

    Define los diferentes tipos de exámenes según la normativa colombiana:
    - Ingreso: evaluación inicial al colaborador
    - Periódico: según periodicidad definida por nivel de riesgo
    - Egreso: al finalizar vínculo laboral
    - Post-incapacidad: tras ausencia prolongada
    - Retiro: equivalente a egreso
    - Cambio de ocupación: al modificar funciones/exposición
    """

    TIPO_CHOICES = [
        ('INGRESO', 'Examen de Ingreso'),
        ('PERIODICO', 'Examen Periódico'),
        ('EGRESO', 'Examen de Egreso'),
        ('POST_INCAPACIDAD', 'Post-Incapacidad'),
        ('RETIRO', 'Examen de Retiro'),
        ('CAMBIO_OCUPACION', 'Cambio de Ocupación'),
    ]

    PERIODICIDAD_CHOICES = [
        ('UNICO', 'Único (ingreso/egreso)'),
        ('ANUAL', 'Anual'),
        ('BIENAL', 'Bienal (cada 2 años)'),
        ('TRIENAL', 'Trienal (cada 3 años)'),
        ('PERSONALIZADO', 'Personalizado'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de examen'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de examen'
    )
    tipo = models.CharField(
        max_length=30,
        choices=TIPO_CHOICES,
        verbose_name='Tipo',
        help_text='Clasificación del examen'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del examen'
    )

    # Configuración
    periodicidad = models.CharField(
        max_length=20,
        choices=PERIODICIDAD_CHOICES,
        default='UNICO',
        verbose_name='Periodicidad',
        help_text='Frecuencia de realización del examen'
    )
    meses_periodicidad = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Meses de Periodicidad',
        help_text='Número de meses para periodicidad personalizada'
    )

    # Pruebas incluidas
    incluye_clinico = models.BooleanField(
        default=True,
        verbose_name='Incluye Examen Clínico',
        help_text='Si incluye evaluación clínica general'
    )
    incluye_laboratorio = models.BooleanField(
        default=False,
        verbose_name='Incluye Laboratorio',
        help_text='Si incluye exámenes de laboratorio'
    )
    incluye_paraclinicos = models.BooleanField(
        default=False,
        verbose_name='Incluye Paraclínicos',
        help_text='Si incluye estudios paraclínicos (RX, ECG, etc.)'
    )
    incluye_audiometria = models.BooleanField(
        default=False,
        verbose_name='Incluye Audiometría',
        help_text='Si incluye evaluación audiométrica'
    )
    incluye_visiometria = models.BooleanField(
        default=False,
        verbose_name='Incluye Visiometría',
        help_text='Si incluye evaluación de agudeza visual'
    )
    incluye_espirometria = models.BooleanField(
        default=False,
        verbose_name='Incluye Espirometría',
        help_text='Si incluye prueba de función pulmonar'
    )

    # Normativa
    enfasis_osteomuscular = models.BooleanField(
        default=False,
        verbose_name='Énfasis Osteomuscular',
        help_text='Evaluación especial de sistema osteomuscular'
    )
    enfasis_cardiovascular = models.BooleanField(
        default=False,
        verbose_name='Énfasis Cardiovascular',
        help_text='Evaluación especial de sistema cardiovascular'
    )
    enfasis_respiratorio = models.BooleanField(
        default=False,
        verbose_name='Énfasis Respiratorio',
        help_text='Evaluación especial de sistema respiratorio'
    )
    enfasis_neurologico = models.BooleanField(
        default=False,
        verbose_name='Énfasis Neurológico',
        help_text='Evaluación especial de sistema neurológico'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Observaciones adicionales sobre el tipo de examen'
    )

    # Estado
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo',
        help_text='Si el tipo de examen está activo'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')

    class Meta:
        db_table = 'medicina_laboral_tipo_examen'
        verbose_name = 'Tipo de Examen'
        verbose_name_plural = 'Tipos de Exámenes'
        ordering = ['tipo', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['tipo', 'is_active']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.nombre}"

    def clean(self):
        """Validaciones personalizadas"""
        if self.periodicidad == 'PERSONALIZADO' and not self.meses_periodicidad:
            raise ValidationError({
                'meses_periodicidad': 'Debe especificar los meses para periodicidad personalizada'
            })


class ExamenMedico(models.Model):
    """
    Registro de exámenes médicos ocupacionales realizados

    Almacena la información de cada examen médico realizado a un colaborador,
    incluyendo resultados, concepto médico y recomendaciones.
    Multi-tenant con empresa_id.
    """

    CONCEPTO_CHOICES = [
        ('APTO', 'Apto'),
        ('APTO_CON_RESTRICCIONES', 'Apto con Restricciones'),
        ('NO_APTO_TEMPORAL', 'No Apto Temporal'),
        ('NO_APTO_PERMANENTE', 'No Apto Permanente'),
        ('PENDIENTE', 'Pendiente'),
    ]

    ESTADO_CHOICES = [
        ('PROGRAMADO', 'Programado'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
        ('VENCIDO', 'Vencido'),
    ]

    # Multi-tenant
    empresa_id = models.PositiveIntegerField(
        db_index=True,
        verbose_name='ID Empresa',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Identificación
    numero_examen = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Número de Examen',
        help_text='Número único del examen'
    )

    # Relaciones
    tipo_examen = models.ForeignKey(
        TipoExamen,
        on_delete=models.PROTECT,
        related_name='examenes',
        verbose_name='Tipo de Examen'
    )
    colaborador_id = models.PositiveIntegerField(
        db_index=True,
        verbose_name='ID Colaborador',
        help_text='ID del colaborador evaluado'
    )
    cargo_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='ID Cargo',
        help_text='ID del cargo del colaborador al momento del examen'
    )

    # Programación
    fecha_programada = models.DateField(
        verbose_name='Fecha Programada',
        help_text='Fecha programada para el examen'
    )
    fecha_realizado = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Realizado',
        help_text='Fecha en que se realizó el examen'
    )

    # Proveedor
    entidad_prestadora = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Entidad Prestadora',
        help_text='IPS o entidad que realizó el examen'
    )
    medico_evaluador = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Médico Evaluador',
        help_text='Nombre del médico que realizó la evaluación'
    )
    licencia_medica = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Licencia Médica',
        help_text='Número de licencia del médico evaluador'
    )

    # Resultados
    concepto_aptitud = models.CharField(
        max_length=30,
        choices=CONCEPTO_CHOICES,
        default='PENDIENTE',
        verbose_name='Concepto de Aptitud',
        help_text='Concepto médico sobre aptitud laboral'
    )
    hallazgos_relevantes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Hallazgos Relevantes',
        help_text='Hallazgos médicos relevantes'
    )
    recomendaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Recomendaciones',
        help_text='Recomendaciones médicas'
    )

    # Diagnósticos
    diagnosticos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Diagnósticos',
        help_text='Lista de diagnósticos CIE-10 (JSON array de {codigo, nombre})'
    )

    # Restricciones
    requiere_restricciones = models.BooleanField(
        default=False,
        verbose_name='Requiere Restricciones',
        help_text='Si el examen generó restricciones médicas'
    )
    restricciones_temporales = models.TextField(
        blank=True,
        null=True,
        verbose_name='Restricciones Temporales',
        help_text='Restricciones temporales indicadas'
    )
    restricciones_permanentes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Restricciones Permanentes',
        help_text='Restricciones permanentes indicadas'
    )

    # Seguimiento
    requiere_seguimiento = models.BooleanField(
        default=False,
        verbose_name='Requiere Seguimiento',
        help_text='Si requiere seguimiento médico'
    )
    tipo_seguimiento = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Tipo de Seguimiento',
        help_text='Tipo de seguimiento requerido'
    )
    fecha_proximo_control = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Próximo Control',
        help_text='Fecha del próximo control médico'
    )

    # Archivos adjuntos
    archivo_resultado = models.FileField(
        upload_to='medicina_laboral/examenes/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Archivo Resultado',
        help_text='PDF del resultado del examen'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PROGRAMADO',
        verbose_name='Estado',
        help_text='Estado del examen'
    )

    # Costos
    costo_examen = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Costo del Examen',
        help_text='Costo del examen médico'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Observaciones adicionales'
    )

    # Auditoría
    created_by_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Creado Por',
        help_text='ID del usuario que creó el registro'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')

    class Meta:
        db_table = 'medicina_laboral_examen_medico'
        verbose_name = 'Examen Médico'
        verbose_name_plural = 'Exámenes Médicos'
        ordering = ['-fecha_programada']
        indexes = [
            models.Index(fields=['empresa_id', 'colaborador_id']),
            models.Index(fields=['numero_examen']),
            models.Index(fields=['estado', 'fecha_programada']),
            models.Index(fields=['concepto_aptitud']),
            models.Index(fields=['fecha_realizado']),
        ]

    def __str__(self):
        return f"{self.numero_examen} - {self.tipo_examen.nombre}"

    def clean(self):
        """Validaciones personalizadas"""
        if self.estado == 'COMPLETADO' and not self.fecha_realizado:
            raise ValidationError({
                'fecha_realizado': 'Debe especificar la fecha de realización para exámenes completados'
            })

        if self.concepto_aptitud != 'PENDIENTE' and not self.fecha_realizado:
            raise ValidationError({
                'concepto_aptitud': 'No puede asignar concepto sin fecha de realización'
            })

    def save(self, *args, **kwargs):
        """Override save para generar número de examen"""
        if not self.numero_examen:
            # Generar número único
            year = timezone.now().year
            count = ExamenMedico.objects.filter(
                empresa_id=self.empresa_id,
                created_at__year=year
            ).count() + 1
            self.numero_examen = f"EXM-{year}-{count:05d}"
        super().save(*args, **kwargs)


class RestriccionMedica(models.Model):
    """
    Restricciones médicas por colaborador

    Gestiona las restricciones médicas temporales y permanentes
    asignadas a los colaboradores, con seguimiento y control.
    """

    TIPO_RESTRICCION_CHOICES = [
        ('TEMPORAL', 'Temporal'),
        ('PERMANENTE', 'Permanente'),
        ('CONDICIONAL', 'Condicional'),
    ]

    CATEGORIA_CHOICES = [
        ('CARGA', 'Manipulación de Cargas'),
        ('POSTURA', 'Posturas'),
        ('MOVIMIENTO', 'Movimientos Repetitivos'),
        ('ALTURA', 'Trabajo en Alturas'),
        ('ESPACIOS_CONFINADOS', 'Espacios Confinados'),
        ('QUIMICOS', 'Exposición a Químicos'),
        ('RUIDO', 'Exposición a Ruido'),
        ('TEMPERATURA', 'Temperaturas Extremas'),
        ('JORNADA', 'Jornada Laboral'),
        ('OTRAS', 'Otras'),
    ]

    ESTADO_CHOICES = [
        ('ACTIVA', 'Activa'),
        ('VENCIDA', 'Vencida'),
        ('LEVANTADA', 'Levantada'),
        ('CANCELADA', 'Cancelada'),
    ]

    # Multi-tenant
    empresa_id = models.PositiveIntegerField(
        db_index=True,
        verbose_name='ID Empresa',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Identificación
    codigo_restriccion = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la restricción'
    )

    # Relaciones
    examen_medico = models.ForeignKey(
        ExamenMedico,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='restricciones',
        verbose_name='Examen Médico',
        help_text='Examen médico que originó la restricción'
    )
    colaborador_id = models.PositiveIntegerField(
        db_index=True,
        verbose_name='ID Colaborador',
        help_text='ID del colaborador'
    )
    cargo_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='ID Cargo',
        help_text='ID del cargo actual del colaborador'
    )

    # Clasificación
    tipo_restriccion = models.CharField(
        max_length=20,
        choices=TIPO_RESTRICCION_CHOICES,
        verbose_name='Tipo de Restricción'
    )
    categoria = models.CharField(
        max_length=30,
        choices=CATEGORIA_CHOICES,
        verbose_name='Categoría'
    )

    # Descripción
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada de la restricción'
    )
    actividades_restringidas = models.TextField(
        verbose_name='Actividades Restringidas',
        help_text='Detalle de actividades que no puede realizar'
    )

    # Vigencia
    fecha_inicio = models.DateField(
        verbose_name='Fecha Inicio',
        help_text='Fecha de inicio de la restricción'
    )
    fecha_fin = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Fin',
        help_text='Fecha de fin (solo para restricciones temporales)'
    )

    # Médico
    medico_ordena = models.CharField(
        max_length=200,
        verbose_name='Médico que Ordena',
        help_text='Nombre del médico que ordenó la restricción'
    )
    licencia_medica = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Licencia Médica'
    )

    # Seguimiento
    requiere_evaluacion_periodica = models.BooleanField(
        default=False,
        verbose_name='Requiere Evaluación Periódica',
        help_text='Si requiere evaluación médica periódica'
    )
    frecuencia_evaluacion_meses = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Frecuencia Evaluación (meses)',
        help_text='Cada cuántos meses debe evaluarse'
    )
    proxima_evaluacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próxima Evaluación'
    )

    # Gestión
    ajuste_realizado = models.BooleanField(
        default=False,
        verbose_name='Ajuste Realizado',
        help_text='Si se realizó ajuste en el puesto de trabajo'
    )
    descripcion_ajuste = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción del Ajuste',
        help_text='Detalle del ajuste realizado'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='ACTIVA',
        verbose_name='Estado'
    )
    fecha_levantamiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Levantamiento',
        help_text='Fecha en que se levantó la restricción'
    )
    motivo_levantamiento = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo Levantamiento'
    )

    # Documento soporte
    archivo_soporte = models.FileField(
        upload_to='medicina_laboral/restricciones/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Archivo Soporte',
        help_text='Documento médico de soporte'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )

    # Auditoría
    created_by_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Creado Por'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')

    class Meta:
        db_table = 'medicina_laboral_restriccion_medica'
        verbose_name = 'Restricción Médica'
        verbose_name_plural = 'Restricciones Médicas'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['empresa_id', 'colaborador_id']),
            models.Index(fields=['codigo_restriccion']),
            models.Index(fields=['estado', 'fecha_fin']),
            models.Index(fields=['tipo_restriccion', 'categoria']),
        ]

    def __str__(self):
        return f"{self.codigo_restriccion} - {self.get_tipo_restriccion_display()}"

    def clean(self):
        """Validaciones personalizadas"""
        if self.tipo_restriccion == 'TEMPORAL' and not self.fecha_fin:
            raise ValidationError({
                'fecha_fin': 'Las restricciones temporales deben tener fecha de fin'
            })

        if self.tipo_restriccion == 'PERMANENTE' and self.fecha_fin:
            raise ValidationError({
                'fecha_fin': 'Las restricciones permanentes no deben tener fecha de fin'
            })

    @property
    def esta_vigente(self):
        """Verifica si la restricción está vigente"""
        if self.estado != 'ACTIVA':
            return False
        if self.fecha_fin and self.fecha_fin < timezone.now().date():
            return False
        return True


class ProgramaVigilancia(models.Model):
    """
    Programas de Vigilancia Epidemiológica (PVE)

    Define los programas de vigilancia epidemiológica según los riesgos
    identificados en la organización (osteomuscular, cardiovascular, etc.)
    """

    TIPO_CHOICES = [
        ('OSTEOMUSCULAR', 'Desórdenes Osteomusculares'),
        ('CARDIOVASCULAR', 'Riesgo Cardiovascular'),
        ('AUDITIVO', 'Conservación Auditiva'),
        ('RESPIRATORIO', 'Riesgo Respiratorio'),
        ('VISUAL', 'Conservación Visual'),
        ('PSICOSOCIAL', 'Riesgo Psicosocial'),
        ('DERMATOLOGICO', 'Riesgo Dermatológico'),
        ('BIOLOGICO', 'Riesgo Biológico'),
        ('QUIMICO', 'Exposición a Químicos'),
        ('OTRO', 'Otro'),
    ]

    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('INACTIVO', 'Inactivo'),
        ('EN_REVISION', 'En Revisión'),
    ]

    # Multi-tenant
    empresa_id = models.PositiveIntegerField(
        db_index=True,
        verbose_name='ID Empresa',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del programa'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Programa'
    )
    tipo = models.CharField(
        max_length=30,
        choices=TIPO_CHOICES,
        verbose_name='Tipo de Programa'
    )

    # Descripción
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción del programa'
    )
    objetivo = models.TextField(
        verbose_name='Objetivo',
        help_text='Objetivo del programa de vigilancia'
    )
    alcance = models.TextField(
        blank=True,
        null=True,
        verbose_name='Alcance',
        help_text='Alcance del programa'
    )

    # Población objetivo
    cargos_aplicables = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Cargos Aplicables',
        help_text='Lista de IDs de cargos a los que aplica (JSON array)'
    )
    areas_aplicables = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Áreas Aplicables',
        help_text='Lista de IDs de áreas a las que aplica (JSON array)'
    )

    # Actividades
    actividades_vigilancia = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Actividades de Vigilancia',
        help_text='Lista de actividades del programa (JSON array)'
    )

    # Periodicidad
    frecuencia_evaluacion_meses = models.PositiveIntegerField(
        default=12,
        verbose_name='Frecuencia Evaluación (meses)',
        help_text='Cada cuántos meses se evalúa'
    )

    # Indicadores
    indicadores = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Indicadores',
        help_text='Indicadores de seguimiento del programa (JSON array)'
    )

    # Vigencia
    fecha_inicio = models.DateField(
        verbose_name='Fecha Inicio',
        help_text='Fecha de inicio del programa'
    )
    fecha_revision = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Revisión',
        help_text='Fecha de última revisión'
    )
    proxima_revision = models.DateField(
        null=True,
        blank=True,
        verbose_name='Próxima Revisión'
    )

    # Responsables
    responsable_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='ID Responsable',
        help_text='ID del usuario responsable del programa'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='ACTIVO',
        verbose_name='Estado'
    )

    # Documentación
    archivo_programa = models.FileField(
        upload_to='medicina_laboral/programas/%Y/',
        null=True,
        blank=True,
        verbose_name='Archivo del Programa',
        help_text='Documento del programa de vigilancia'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )

    # Auditoría
    created_by_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Creado Por'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')

    class Meta:
        db_table = 'medicina_laboral_programa_vigilancia'
        verbose_name = 'Programa de Vigilancia Epidemiológica'
        verbose_name_plural = 'Programas de Vigilancia Epidemiológica'
        ordering = ['tipo', 'nombre']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo']),
            models.Index(fields=['codigo']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def casos_activos_count(self):
        """Cuenta casos activos en este programa"""
        return self.casos.filter(estado='ACTIVO').count()


class CasoVigilancia(models.Model):
    """
    Casos en vigilancia epidemiológica

    Gestiona los casos individuales en seguimiento dentro de un
    programa de vigilancia epidemiológica.
    """

    SEVERIDAD_CHOICES = [
        ('LEVE', 'Leve'),
        ('MODERADA', 'Moderada'),
        ('SEVERA', 'Severa'),
        ('CRITICA', 'Crítica'),
    ]

    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('EN_SEGUIMIENTO', 'En Seguimiento'),
        ('CONTROLADO', 'Controlado'),
        ('CERRADO', 'Cerrado'),
        ('CANCELADO', 'Cancelado'),
    ]

    # Multi-tenant
    empresa_id = models.PositiveIntegerField(
        db_index=True,
        verbose_name='ID Empresa',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Identificación
    numero_caso = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Número de Caso',
        help_text='Número único del caso'
    )

    # Relaciones
    programa = models.ForeignKey(
        ProgramaVigilancia,
        on_delete=models.PROTECT,
        related_name='casos',
        verbose_name='Programa de Vigilancia'
    )
    colaborador_id = models.PositiveIntegerField(
        db_index=True,
        verbose_name='ID Colaborador',
        help_text='ID del colaborador en seguimiento'
    )
    cargo_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='ID Cargo'
    )

    # Identificación del caso
    fecha_apertura = models.DateField(
        verbose_name='Fecha Apertura',
        help_text='Fecha de apertura del caso'
    )
    descripcion_caso = models.TextField(
        verbose_name='Descripción del Caso',
        help_text='Descripción detallada del caso'
    )

    # Clasificación
    severidad = models.CharField(
        max_length=20,
        choices=SEVERIDAD_CHOICES,
        verbose_name='Severidad'
    )

    # Diagnósticos relacionados
    diagnosticos_cie10 = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Diagnósticos CIE-10',
        help_text='Lista de diagnósticos relacionados (JSON array)'
    )

    # Factores de riesgo
    factores_riesgo_identificados = models.TextField(
        blank=True,
        null=True,
        verbose_name='Factores de Riesgo Identificados'
    )
    exposicion_laboral = models.TextField(
        blank=True,
        null=True,
        verbose_name='Exposición Laboral',
        help_text='Descripción de la exposición laboral relacionada'
    )

    # Plan de intervención
    plan_intervencion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Plan de Intervención',
        help_text='Plan de intervención y control'
    )
    acciones_implementadas = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Acciones Implementadas',
        help_text='Lista de acciones implementadas (JSON array)'
    )

    # Seguimientos
    seguimientos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Seguimientos',
        help_text='Registro de seguimientos (JSON array de {fecha, descripcion, responsable})'
    )

    # Control
    fecha_ultimo_seguimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Último Seguimiento'
    )
    fecha_proximo_seguimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Próximo Seguimiento'
    )

    # Cierre
    fecha_cierre = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Cierre'
    )
    motivo_cierre = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de Cierre'
    )
    resultado_final = models.TextField(
        blank=True,
        null=True,
        verbose_name='Resultado Final',
        help_text='Resultado y conclusiones del caso'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='ACTIVO',
        verbose_name='Estado'
    )

    # Archivos
    archivo_adjunto = models.FileField(
        upload_to='medicina_laboral/casos/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Archivo Adjunto'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )

    # Auditoría
    created_by_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Creado Por'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')

    class Meta:
        db_table = 'medicina_laboral_caso_vigilancia'
        verbose_name = 'Caso en Vigilancia'
        verbose_name_plural = 'Casos en Vigilancia'
        ordering = ['-fecha_apertura']
        indexes = [
            models.Index(fields=['empresa_id', 'colaborador_id']),
            models.Index(fields=['numero_caso']),
            models.Index(fields=['programa', 'estado']),
            models.Index(fields=['severidad', 'estado']),
        ]

    def __str__(self):
        return f"{self.numero_caso} - {self.programa.nombre}"

    def save(self, *args, **kwargs):
        """Override save para generar número de caso"""
        if not self.numero_caso:
            year = timezone.now().year
            count = CasoVigilancia.objects.filter(
                empresa_id=self.empresa_id,
                created_at__year=year
            ).count() + 1
            self.numero_caso = f"PVE-{year}-{count:05d}"
        super().save(*args, **kwargs)

    def registrar_seguimiento(self, descripcion, responsable_id):
        """Registra un nuevo seguimiento en el caso"""
        nuevo_seguimiento = {
            'fecha': timezone.now().date().isoformat(),
            'descripcion': descripcion,
            'responsable_id': responsable_id
        }
        if not self.seguimientos:
            self.seguimientos = []
        self.seguimientos.append(nuevo_seguimiento)
        self.fecha_ultimo_seguimiento = timezone.now().date()
        self.save(update_fields=['seguimientos', 'fecha_ultimo_seguimiento', 'updated_at'])

    def cerrar_caso(self, motivo, resultado, user_id):
        """Cierra el caso de vigilancia"""
        self.estado = 'CERRADO'
        self.fecha_cierre = timezone.now().date()
        self.motivo_cierre = motivo
        self.resultado_final = resultado
        self.save(update_fields=[
            'estado', 'fecha_cierre', 'motivo_cierre',
            'resultado_final', 'updated_at'
        ])


class DiagnosticoOcupacional(models.Model):
    """
    Catálogo de diagnósticos ocupacionales

    Gestiona los diagnósticos según CIE-10 con clasificación
    de origen ocupacional o no ocupacional.
    """

    ORIGEN_CHOICES = [
        ('OCUPACIONAL', 'Ocupacional'),
        ('COMUN', 'Común'),
        ('AMBOS', 'Ambos'),
    ]

    # Identificación CIE-10
    codigo_cie10 = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código CIE-10',
        help_text='Código de diagnóstico según CIE-10'
    )
    nombre = models.CharField(
        max_length=300,
        verbose_name='Nombre del Diagnóstico'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )

    # Clasificación
    categoria = models.CharField(
        max_length=10,
        verbose_name='Categoría CIE-10',
        help_text='Categoría principal del CIE-10'
    )
    origen = models.CharField(
        max_length=20,
        choices=ORIGEN_CHOICES,
        default='COMUN',
        verbose_name='Origen',
        help_text='Clasificación según origen'
    )

    # Relación con riesgos
    riesgos_relacionados = models.TextField(
        blank=True,
        null=True,
        verbose_name='Riesgos Relacionados',
        help_text='Riesgos laborales asociados a este diagnóstico'
    )

    # Configuración
    requiere_vigilancia = models.BooleanField(
        default=False,
        verbose_name='Requiere Vigilancia Epidemiológica',
        help_text='Si amerita inclusión en PVE'
    )
    programa_vigilancia_sugerido = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Programa Vigilancia Sugerido'
    )

    # Notificación
    requiere_reporte_arl = models.BooleanField(
        default=False,
        verbose_name='Requiere Reporte a ARL',
        help_text='Si debe reportarse a la ARL'
    )
    requiere_reporte_secretaria = models.BooleanField(
        default=False,
        verbose_name='Requiere Reporte a Secretaría',
        help_text='Si debe reportarse a Secretaría de Salud'
    )

    # Estado
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')

    class Meta:
        db_table = 'medicina_laboral_diagnostico_ocupacional'
        verbose_name = 'Diagnóstico Ocupacional'
        verbose_name_plural = 'Diagnósticos Ocupacionales'
        ordering = ['codigo_cie10']
        indexes = [
            models.Index(fields=['codigo_cie10']),
            models.Index(fields=['origen', 'is_active']),
            models.Index(fields=['requiere_vigilancia']),
        ]

    def __str__(self):
        return f"{self.codigo_cie10} - {self.nombre}"


class EstadisticaMedica(models.Model):
    """
    Estadísticas médicas consolidadas

    Almacena consolidados mensuales de indicadores de medicina laboral
    para análisis y reportes.
    """

    # Multi-tenant
    empresa_id = models.PositiveIntegerField(
        db_index=True,
        verbose_name='ID Empresa',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Período
    anio = models.PositiveIntegerField(
        verbose_name='Año',
        help_text='Año del consolidado'
    )
    mes = models.PositiveIntegerField(
        verbose_name='Mes',
        help_text='Mes del consolidado (1-12)'
    )

    # Población
    total_colaboradores = models.PositiveIntegerField(
        default=0,
        verbose_name='Total Colaboradores',
        help_text='Total de colaboradores activos en el período'
    )

    # Exámenes médicos
    examenes_realizados = models.PositiveIntegerField(
        default=0,
        verbose_name='Exámenes Realizados'
    )
    examenes_ingreso = models.PositiveIntegerField(
        default=0,
        verbose_name='Exámenes de Ingreso'
    )
    examenes_periodicos = models.PositiveIntegerField(
        default=0,
        verbose_name='Exámenes Periódicos'
    )
    examenes_egreso = models.PositiveIntegerField(
        default=0,
        verbose_name='Exámenes de Egreso'
    )

    # Conceptos de aptitud
    aptos = models.PositiveIntegerField(
        default=0,
        verbose_name='Aptos'
    )
    aptos_con_restricciones = models.PositiveIntegerField(
        default=0,
        verbose_name='Aptos con Restricciones'
    )
    no_aptos_temporal = models.PositiveIntegerField(
        default=0,
        verbose_name='No Aptos Temporal'
    )
    no_aptos_permanente = models.PositiveIntegerField(
        default=0,
        verbose_name='No Aptos Permanente'
    )

    # Restricciones
    restricciones_activas = models.PositiveIntegerField(
        default=0,
        verbose_name='Restricciones Activas'
    )
    restricciones_nuevas = models.PositiveIntegerField(
        default=0,
        verbose_name='Restricciones Nuevas en el Mes'
    )
    restricciones_levantadas = models.PositiveIntegerField(
        default=0,
        verbose_name='Restricciones Levantadas'
    )

    # Vigilancia epidemiológica
    casos_vigilancia_activos = models.PositiveIntegerField(
        default=0,
        verbose_name='Casos en Vigilancia Activos'
    )
    casos_nuevos = models.PositiveIntegerField(
        default=0,
        verbose_name='Casos Nuevos'
    )
    casos_cerrados = models.PositiveIntegerField(
        default=0,
        verbose_name='Casos Cerrados'
    )

    # Diagnósticos
    diagnosticos_ocupacionales = models.PositiveIntegerField(
        default=0,
        verbose_name='Diagnósticos Ocupacionales'
    )
    diagnosticos_comunes = models.PositiveIntegerField(
        default=0,
        verbose_name='Diagnósticos Comunes'
    )

    # Top diagnósticos del mes
    top_diagnosticos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Top Diagnósticos',
        help_text='Top 10 diagnósticos del mes (JSON array)'
    )

    # Indicadores calculados
    porcentaje_aptitud = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='% Aptitud',
        help_text='Porcentaje de aptos sin restricciones'
    )
    porcentaje_cobertura_examenes = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='% Cobertura Exámenes',
        help_text='Porcentaje de cobertura de exámenes médicos'
    )

    # Costos
    costo_total_examenes = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Costo Total Exámenes'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )

    # Auditoría
    created_by_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Generado Por'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha Generación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha Actualización')

    class Meta:
        db_table = 'medicina_laboral_estadistica'
        verbose_name = 'Estadística Médica'
        verbose_name_plural = 'Estadísticas Médicas'
        ordering = ['-anio', '-mes']
        unique_together = [('empresa_id', 'anio', 'mes')]
        indexes = [
            models.Index(fields=['empresa_id', 'anio', 'mes']),
            models.Index(fields=['anio', 'mes']),
        ]

    def __str__(self):
        return f"Estadística {self.anio}-{self.mes:02d}"

    def calcular_indicadores(self):
        """Calcula indicadores automáticos"""
        if self.total_colaboradores > 0:
            # Porcentaje de aptitud
            self.porcentaje_aptitud = (
                Decimal(self.aptos) / Decimal(self.total_colaboradores) * Decimal('100')
            ).quantize(Decimal('0.01'))

            # Cobertura de exámenes
            self.porcentaje_cobertura_examenes = (
                Decimal(self.examenes_realizados) / Decimal(self.total_colaboradores) * Decimal('100')
            ).quantize(Decimal('0.01'))

        self.save(update_fields=['porcentaje_aptitud', 'porcentaje_cobertura_examenes', 'updated_at'])
