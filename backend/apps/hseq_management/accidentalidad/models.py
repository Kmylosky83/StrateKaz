"""
Modelos para Accidentalidad (ATEL) - HSEQ Management
Gestión de Accidentes de Trabajo y Enfermedades Laborales
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class AccidenteTrabajo(models.Model):
    """
    Accidente de Trabajo (AT)
    Evento súbito que ocasiona lesión, enfermedad o muerte durante el trabajo
    """

    TIPO_LESION_CHOICES = [
        ('CONTUSION', 'Contusión'),
        ('CORTE', 'Corte/Laceración'),
        ('FRACTURA', 'Fractura'),
        ('QUEMADURA', 'Quemadura'),
        ('AMPUTACION', 'Amputación'),
        ('ESGUINCE', 'Esguince'),
        ('LUXACION', 'Luxación'),
        ('TRAUMA_CRANEO', 'Trauma Craneoencefálico'),
        ('HERIDA', 'Herida'),
        ('PICADURA', 'Picadura/Mordedura'),
        ('INTOXICACION', 'Intoxicación'),
        ('ASFIXIA', 'Asfixia'),
        ('QUEMADURA_QUIMICA', 'Quemadura Química'),
        ('ELECTROCUCION', 'Electrocución'),
        ('OTRO', 'Otro'),
    ]

    PARTE_CUERPO_CHOICES = [
        ('CABEZA', 'Cabeza'),
        ('OJO_DERECHO', 'Ojo Derecho'),
        ('OJO_IZQUIERDO', 'Ojo Izquierdo'),
        ('OIDO_DERECHO', 'Oído Derecho'),
        ('OIDO_IZQUIERDO', 'Oído Izquierdo'),
        ('CARA', 'Cara'),
        ('CUELLO', 'Cuello'),
        ('TORAX', 'Tórax'),
        ('ABDOMEN', 'Abdomen'),
        ('ESPALDA_SUPERIOR', 'Espalda Superior'),
        ('ESPALDA_INFERIOR', 'Espalda Inferior/Lumbar'),
        ('HOMBRO_DERECHO', 'Hombro Derecho'),
        ('HOMBRO_IZQUIERDO', 'Hombro Izquierdo'),
        ('BRAZO_DERECHO', 'Brazo Derecho'),
        ('BRAZO_IZQUIERDO', 'Brazo Izquierdo'),
        ('CODO_DERECHO', 'Codo Derecho'),
        ('CODO_IZQUIERDO', 'Codo Izquierdo'),
        ('ANTEBRAZO_DERECHO', 'Antebrazo Derecho'),
        ('ANTEBRAZO_IZQUIERDO', 'Antebrazo Izquierdo'),
        ('MUNECA_DERECHA', 'Muñeca Derecha'),
        ('MUNECA_IZQUIERDA', 'Muñeca Izquierda'),
        ('MANO_DERECHA', 'Mano Derecha'),
        ('MANO_IZQUIERDA', 'Mano Izquierda'),
        ('DEDOS_MANO_DERECHA', 'Dedos Mano Derecha'),
        ('DEDOS_MANO_IZQUIERDA', 'Dedos Mano Izquierda'),
        ('CADERA', 'Cadera'),
        ('PELVIS', 'Pelvis'),
        ('MUSLO_DERECHO', 'Muslo Derecho'),
        ('MUSLO_IZQUIERDO', 'Muslo Izquierdo'),
        ('RODILLA_DERECHA', 'Rodilla Derecha'),
        ('RODILLA_IZQUIERDA', 'Rodilla Izquierda'),
        ('PIERNA_DERECHA', 'Pierna Derecha'),
        ('PIERNA_IZQUIERDA', 'Pierna Izquierda'),
        ('TOBILLO_DERECHO', 'Tobillo Derecho'),
        ('TOBILLO_IZQUIERDO', 'Tobillo Izquierdo'),
        ('PIE_DERECHO', 'Pie Derecho'),
        ('PIE_IZQUIERDO', 'Pie Izquierdo'),
        ('DEDOS_PIE_DERECHO', 'Dedos Pie Derecho'),
        ('DEDOS_PIE_IZQUIERDO', 'Dedos Pie Izquierdo'),
        ('MULTIPLES', 'Múltiples Partes'),
        ('SISTEMICO', 'Sistémico/Interno'),
    ]

    GRAVEDAD_CHOICES = [
        ('LEVE', 'Leve - Sin incapacidad o < 10 días'),
        ('MODERADO', 'Moderado - 10 a 30 días'),
        ('GRAVE', 'Grave - > 30 días o secuela'),
        ('MORTAL', 'Mortal'),
    ]

    TIPO_EVENTO_CHOICES = [
        ('CAIDA_MISMO_NIVEL', 'Caída a nivel'),
        ('CAIDA_DISTINTO_NIVEL', 'Caída a distinto nivel'),
        ('GOLPE_OBJETO', 'Golpe por objeto'),
        ('ATRAPAMIENTO', 'Atrapamiento'),
        ('SOBREESFUERZO', 'Sobreesfuerzo'),
        ('EXPOSICION_SUSTANCIA', 'Exposición a sustancia'),
        ('CONTACTO_ELECTRICO', 'Contacto eléctrico'),
        ('CONTACTO_TEMPERATURA', 'Contacto con temperatura extrema'),
        ('ACCIDENTE_TRANSITO', 'Accidente de tránsito en misión'),
        ('VIOLENCIA', 'Violencia'),
        ('OTRO', 'Otro'),
    ]

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa',
        help_text='ID de la empresa (multi-tenant)'
    )

    # Identificación
    codigo_at = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código AT',
        help_text='Código único del accidente (ej: AT-2025-001)'
    )

    # Datos del evento
    fecha_evento = models.DateTimeField(
        verbose_name='Fecha y Hora del Evento',
        help_text='Fecha y hora exacta del accidente'
    )
    lugar_evento = models.CharField(
        max_length=255,
        verbose_name='Lugar del Evento',
        help_text='Ubicación específica donde ocurrió el accidente'
    )
    descripcion_evento = models.TextField(
        verbose_name='Descripción del Evento',
        help_text='Descripción detallada de cómo ocurrió el accidente'
    )
    tipo_evento = models.CharField(
        max_length=50,
        choices=TIPO_EVENTO_CHOICES,
        verbose_name='Tipo de Evento'
    )

    # Trabajador afectado
    trabajador = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='accidentes_trabajo',
        verbose_name='Trabajador Afectado'
    )
    cargo_trabajador = models.CharField(
        max_length=100,
        verbose_name='Cargo',
        help_text='Cargo del trabajador al momento del accidente'
    )

    # Datos de la lesión
    tipo_lesion = models.CharField(
        max_length=50,
        choices=TIPO_LESION_CHOICES,
        verbose_name='Tipo de Lesión'
    )
    parte_cuerpo = models.CharField(
        max_length=50,
        choices=PARTE_CUERPO_CHOICES,
        verbose_name='Parte del Cuerpo Afectada'
    )
    descripcion_lesion = models.TextField(
        verbose_name='Descripción de la Lesión',
        help_text='Descripción médica de la lesión'
    )

    # Gravedad y consecuencias
    gravedad = models.CharField(
        max_length=20,
        choices=GRAVEDAD_CHOICES,
        verbose_name='Gravedad'
    )
    dias_incapacidad = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Días de Incapacidad',
        help_text='Días de incapacidad laboral'
    )
    mortal = models.BooleanField(
        default=False,
        verbose_name='Mortal',
        help_text='¿El accidente resultó en muerte?'
    )
    fecha_muerte = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Muerte',
        help_text='Fecha y hora de muerte (si aplica)'
    )

    # Atención médica
    centro_atencion = models.CharField(
        max_length=255,
        verbose_name='Centro de Atención Médica',
        help_text='IPS o centro médico donde fue atendido'
    )
    diagnostico_medico = models.TextField(
        verbose_name='Diagnóstico Médico',
        help_text='Diagnóstico oficial del médico tratante'
    )

    # Reporte a autoridades
    reportado_arl = models.BooleanField(
        default=False,
        verbose_name='Reportado a ARL',
        help_text='¿Fue reportado a la ARL?'
    )
    fecha_reporte_arl = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha Reporte ARL'
    )
    numero_caso_arl = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de Caso ARL'
    )
    calificacion_origen = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Calificación de Origen',
        help_text='Calificación por Junta de Calificación'
    )

    # Testigos
    testigos = models.TextField(
        blank=True,
        verbose_name='Testigos',
        help_text='Nombres de testigos presenciales'
    )

    # Relación con investigación
    requiere_investigacion = models.BooleanField(
        default=True,
        verbose_name='Requiere Investigación'
    )

    # Auditoría
    reportado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='accidentes_reportados',
        verbose_name='Reportado Por'
    )
    fecha_reporte_interno = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha Reporte Interno'
    )
    actualizado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accidentes_actualizados',
        verbose_name='Actualizado Por'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha Actualización'
    )

    class Meta:
        db_table = 'hseq_accidentes_trabajo'
        verbose_name = 'Accidente de Trabajo'
        verbose_name_plural = 'Accidentes de Trabajo'
        ordering = ['-fecha_evento']
        indexes = [
            models.Index(fields=['empresa_id', 'fecha_evento']),
            models.Index(fields=['empresa_id', 'gravedad']),
            models.Index(fields=['empresa_id', 'mortal']),
            models.Index(fields=['trabajador', 'fecha_evento']),
            models.Index(fields=['codigo_at']),
        ]

    def __str__(self):
        return f"{self.codigo_at} - {self.trabajador} - {self.get_gravedad_display()}"

    def save(self, *args, **kwargs):
        # Auto-generar código si no existe
        if not self.codigo_at:
            year = timezone.now().year
            last_at = AccidenteTrabajo.objects.filter(
                empresa_id=self.empresa_id,
                codigo_at__startswith=f'AT-{year}-'
            ).order_by('-codigo_at').first()

            if last_at:
                last_number = int(last_at.codigo_at.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1

            self.codigo_at = f'AT-{year}-{new_number:04d}'

        super().save(*args, **kwargs)


class EnfermedadLaboral(models.Model):
    """
    Enfermedad Laboral (EL)
    Enfermedad contraída como resultado de la exposición a factores de riesgo
    """

    TIPO_ENFERMEDAD_CHOICES = [
        ('RESPIRATORIA', 'Enfermedad Respiratoria'),
        ('PIEL', 'Enfermedad de la Piel'),
        ('AUDITIVA', 'Enfermedad Auditiva'),
        ('VISUAL', 'Enfermedad Visual'),
        ('MUSCULOESQUELETICA', 'Enfermedad Musculoesquelética'),
        ('NEUROLOGICA', 'Enfermedad Neurológica'),
        ('MENTAL', 'Enfermedad Mental'),
        ('CARDIOVASCULAR', 'Enfermedad Cardiovascular'),
        ('INTOXICACION_CRONICA', 'Intoxicación Crónica'),
        ('CANCER_OCUPACIONAL', 'Cáncer Ocupacional'),
        ('OTRA', 'Otra'),
    ]

    ESTADO_CALIFICACION_CHOICES = [
        ('PENDIENTE', 'Pendiente de Calificación'),
        ('PROVISIONAL', 'Calificación Provisional'),
        ('DEFINITIVA_LABORAL', 'Definitiva - Origen Laboral'),
        ('DEFINITIVA_COMUN', 'Definitiva - Origen Común'),
        ('EN_CONTROVERSIA', 'En Controversia'),
    ]

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # Identificación
    codigo_el = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código EL'
    )

    # Trabajador afectado
    trabajador = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='enfermedades_laborales',
        verbose_name='Trabajador Afectado'
    )
    cargo_trabajador = models.CharField(
        max_length=100,
        verbose_name='Cargo'
    )

    # Datos de la enfermedad
    fecha_diagnostico = models.DateField(
        verbose_name='Fecha de Diagnóstico'
    )
    tipo_enfermedad = models.CharField(
        max_length=50,
        choices=TIPO_ENFERMEDAD_CHOICES,
        verbose_name='Tipo de Enfermedad'
    )
    diagnostico_cie10 = models.CharField(
        max_length=20,
        verbose_name='Código CIE-10',
        help_text='Código de diagnóstico CIE-10'
    )
    diagnostico_descripcion = models.TextField(
        verbose_name='Descripción del Diagnóstico'
    )

    # Exposición
    factor_riesgo = models.TextField(
        verbose_name='Factor de Riesgo',
        help_text='Factor de riesgo al cual estuvo expuesto'
    )
    tiempo_exposicion = models.CharField(
        max_length=100,
        verbose_name='Tiempo de Exposición',
        help_text='Tiempo estimado de exposición al riesgo'
    )
    descripcion_exposicion = models.TextField(
        verbose_name='Descripción de la Exposición',
        help_text='Detalle de las condiciones de exposición'
    )

    # Calificación
    estado_calificacion = models.CharField(
        max_length=50,
        choices=ESTADO_CALIFICACION_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado de Calificación'
    )
    fecha_calificacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Calificación'
    )
    porcentaje_pcl = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Porcentaje PCL (Pérdida Capacidad Laboral)',
        help_text='Porcentaje de pérdida de capacidad laboral'
    )

    # Entidad calificadora
    entidad_calificadora = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Entidad Calificadora',
        help_text='ARL, EPS o Junta de Calificación'
    )
    numero_dictamen = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de Dictamen'
    )

    # Reporte
    reportado_arl = models.BooleanField(
        default=False,
        verbose_name='Reportado a ARL'
    )
    fecha_reporte_arl = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Reporte ARL'
    )
    numero_caso_arl = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de Caso ARL'
    )

    # Investigación
    requiere_investigacion = models.BooleanField(
        default=True,
        verbose_name='Requiere Investigación'
    )

    # Auditoría
    reportado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='enfermedades_reportadas',
        verbose_name='Reportado Por'
    )
    fecha_reporte_interno = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha Reporte Interno'
    )
    actualizado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enfermedades_actualizadas',
        verbose_name='Actualizado Por'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha Actualización'
    )

    class Meta:
        db_table = 'hseq_enfermedades_laborales'
        verbose_name = 'Enfermedad Laboral'
        verbose_name_plural = 'Enfermedades Laborales'
        ordering = ['-fecha_diagnostico']
        indexes = [
            models.Index(fields=['empresa_id', 'fecha_diagnostico']),
            models.Index(fields=['empresa_id', 'estado_calificacion']),
            models.Index(fields=['trabajador', 'fecha_diagnostico']),
        ]

    def __str__(self):
        return f"{self.codigo_el} - {self.trabajador} - {self.get_tipo_enfermedad_display()}"

    def save(self, *args, **kwargs):
        if not self.codigo_el:
            year = timezone.now().year
            last_el = EnfermedadLaboral.objects.filter(
                empresa_id=self.empresa_id,
                codigo_el__startswith=f'EL-{year}-'
            ).order_by('-codigo_el').first()

            if last_el:
                last_number = int(last_el.codigo_el.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1

            self.codigo_el = f'EL-{year}-{new_number:04d}'

        super().save(*args, **kwargs)


class IncidenteTrabajo(models.Model):
    """
    Incidente de Trabajo
    Evento no deseado que bajo circunstancias diferentes pudo causar lesión
    """

    TIPO_INCIDENTE_CHOICES = [
        ('CASI_ACCIDENTE', 'Casi Accidente'),
        ('CONDICION_INSEGURA', 'Condición Insegura'),
        ('ACTO_INSEGURO', 'Acto Inseguro'),
        ('DANO_PROPIEDAD', 'Daño a Propiedad'),
        ('DERRAME', 'Derrame de Sustancia'),
        ('OTRO', 'Otro'),
    ]

    POTENCIAL_GRAVEDAD_CHOICES = [
        ('BAJO', 'Potencial Bajo'),
        ('MEDIO', 'Potencial Medio'),
        ('ALTO', 'Potencial Alto'),
        ('CRITICO', 'Potencial Crítico'),
    ]

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # Identificación
    codigo_incidente = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código Incidente'
    )

    # Datos del evento
    fecha_evento = models.DateTimeField(
        verbose_name='Fecha y Hora del Evento'
    )
    lugar_evento = models.CharField(
        max_length=255,
        verbose_name='Lugar del Evento'
    )
    tipo_incidente = models.CharField(
        max_length=50,
        choices=TIPO_INCIDENTE_CHOICES,
        verbose_name='Tipo de Incidente'
    )
    descripcion_evento = models.TextField(
        verbose_name='Descripción del Evento'
    )

    # Potencial de daño
    potencial_gravedad = models.CharField(
        max_length=20,
        choices=POTENCIAL_GRAVEDAD_CHOICES,
        verbose_name='Potencial de Gravedad',
        help_text='Gravedad potencial si hubiera ocurrido lesión'
    )
    consecuencias_potenciales = models.TextField(
        verbose_name='Consecuencias Potenciales',
        help_text='Qué pudo haber pasado'
    )

    # Personas involucradas
    reportado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='incidentes_trabajo_reportados',
        verbose_name='Reportado Por'
    )
    personas_involucradas = models.TextField(
        blank=True,
        verbose_name='Personas Involucradas',
        help_text='Trabajadores que presenciaron o estuvieron cerca'
    )

    # Daños materiales
    hubo_danos_materiales = models.BooleanField(
        default=False,
        verbose_name='¿Hubo Daños Materiales?'
    )
    descripcion_danos = models.TextField(
        blank=True,
        verbose_name='Descripción de Daños',
        help_text='Descripción de daños a equipos, instalaciones, etc.'
    )
    costo_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Costo Estimado',
        help_text='Costo estimado de daños materiales'
    )

    # Investigación
    requiere_investigacion = models.BooleanField(
        default=True,
        verbose_name='Requiere Investigación'
    )

    # Auditoría
    fecha_reporte = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Reporte'
    )
    actualizado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incidentes_actualizados',
        verbose_name='Actualizado Por'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha Actualización'
    )

    class Meta:
        db_table = 'hseq_incidentes_trabajo'
        verbose_name = 'Incidente de Trabajo'
        verbose_name_plural = 'Incidentes de Trabajo'
        ordering = ['-fecha_evento']
        indexes = [
            models.Index(fields=['empresa_id', 'fecha_evento']),
            models.Index(fields=['empresa_id', 'tipo_incidente']),
            models.Index(fields=['empresa_id', 'potencial_gravedad']),
        ]

    def __str__(self):
        return f"{self.codigo_incidente} - {self.get_tipo_incidente_display()}"

    def save(self, *args, **kwargs):
        if not self.codigo_incidente:
            year = timezone.now().year
            last_inc = IncidenteTrabajo.objects.filter(
                empresa_id=self.empresa_id,
                codigo_incidente__startswith=f'INC-{year}-'
            ).order_by('-codigo_incidente').first()

            if last_inc:
                last_number = int(last_inc.codigo_incidente.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1

            self.codigo_incidente = f'INC-{year}-{new_number:04d}'

        super().save(*args, **kwargs)


class InvestigacionATEL(models.Model):
    """
    Investigación de Accidentes, Enfermedades e Incidentes
    """

    ESTADO_CHOICES = [
        ('INICIADA', 'Iniciada'),
        ('EN_PROGRESO', 'En Progreso'),
        ('COMPLETADA', 'Completada'),
        ('CERRADA', 'Cerrada'),
        ('CANCELADA', 'Cancelada'),
    ]

    METODOLOGIA_CHOICES = [
        ('ARBOL_CAUSAS', 'Árbol de Causas'),
        ('CINCO_PORQUES', '5 Porqués'),
        ('ISHIKAWA', 'Diagrama de Ishikawa (Espina de Pescado)'),
        ('TAPROOT', 'TapRoot'),
        ('OTRA', 'Otra Metodología'),
    ]

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # Identificación
    codigo_investigacion = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código de Investigación'
    )

    # Relación con evento
    accidente_trabajo = models.OneToOneField(
        AccidenteTrabajo,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='investigacion',
        verbose_name='Accidente de Trabajo'
    )
    enfermedad_laboral = models.OneToOneField(
        EnfermedadLaboral,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='investigacion',
        verbose_name='Enfermedad Laboral'
    )
    incidente_trabajo = models.OneToOneField(
        IncidenteTrabajo,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='investigacion',
        verbose_name='Incidente de Trabajo'
    )

    # Metodología
    metodologia = models.CharField(
        max_length=50,
        choices=METODOLOGIA_CHOICES,
        verbose_name='Metodología de Investigación'
    )

    # Equipo investigador
    lider_investigacion = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='investigaciones_lideradas',
        verbose_name='Líder de Investigación'
    )
    equipo_investigacion = models.ManyToManyField(
        'core.User',
        related_name='investigaciones_participadas',
        verbose_name='Equipo de Investigación',
        help_text='Miembros del equipo investigador'
    )

    # Fechas
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio'
    )
    fecha_limite = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Límite',
        help_text='Fecha límite para completar la investigación'
    )
    fecha_completada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Completada'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='INICIADA',
        verbose_name='Estado'
    )

    # Datos de la investigación
    descripcion_hechos = models.TextField(
        verbose_name='Descripción de los Hechos',
        help_text='Reconstrucción detallada de lo ocurrido'
    )

    # Árbol de causas o análisis estructurado
    analisis_datos = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Datos de Análisis',
        help_text='JSON con estructura del análisis (árbol, 5 porqués, etc.)'
    )

    # Conclusiones
    conclusiones = models.TextField(
        blank=True,
        verbose_name='Conclusiones',
        help_text='Conclusiones de la investigación'
    )
    recomendaciones = models.TextField(
        blank=True,
        verbose_name='Recomendaciones',
        help_text='Recomendaciones generales'
    )

    # Archivos adjuntos
    # Nota: Los archivos específicos se pueden manejar con un modelo relacionado o FileField

    # Aprobación
    aprobada = models.BooleanField(
        default=False,
        verbose_name='Aprobada'
    )
    aprobada_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='investigaciones_aprobadas',
        verbose_name='Aprobada Por'
    )
    fecha_aprobacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    # Auditoría
    creado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='investigaciones_creadas',
        verbose_name='Creado Por'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    actualizado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='investigaciones_actualizadas',
        verbose_name='Actualizado Por'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha Actualización'
    )

    class Meta:
        db_table = 'hseq_investigaciones_atel'
        verbose_name = 'Investigación ATEL'
        verbose_name_plural = 'Investigaciones ATEL'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'fecha_inicio']),
            models.Index(fields=['lider_investigacion', 'estado']),
        ]

    def __str__(self):
        return f"{self.codigo_investigacion} - {self.get_estado_display()}"

    def save(self, *args, **kwargs):
        if not self.codigo_investigacion:
            year = timezone.now().year
            last_inv = InvestigacionATEL.objects.filter(
                empresa_id=self.empresa_id,
                codigo_investigacion__startswith=f'INV-{year}-'
            ).order_by('-codigo_investigacion').first()

            if last_inv:
                last_number = int(last_inv.codigo_investigacion.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1

            self.codigo_investigacion = f'INV-{year}-{new_number:04d}'

        super().save(*args, **kwargs)


class CausaRaiz(models.Model):
    """
    Causas Raíz identificadas en la investigación
    """

    TIPO_CAUSA_CHOICES = [
        ('INMEDIATA_ACTO', 'Causa Inmediata - Acto Inseguro'),
        ('INMEDIATA_CONDICION', 'Causa Inmediata - Condición Insegura'),
        ('BASICA_PERSONAL', 'Causa Básica - Factores Personales'),
        ('BASICA_TRABAJO', 'Causa Básica - Factores del Trabajo'),
        ('ORGANIZACIONAL', 'Causa Organizacional'),
    ]

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # Relación con investigación
    investigacion = models.ForeignKey(
        InvestigacionATEL,
        on_delete=models.CASCADE,
        related_name='causas_raiz',
        verbose_name='Investigación'
    )

    # Tipo de causa
    tipo_causa = models.CharField(
        max_length=50,
        choices=TIPO_CAUSA_CHOICES,
        verbose_name='Tipo de Causa'
    )

    # Descripción
    descripcion = models.TextField(
        verbose_name='Descripción de la Causa',
        help_text='Descripción detallada de la causa identificada'
    )

    # Evidencia
    evidencia = models.TextField(
        blank=True,
        verbose_name='Evidencia',
        help_text='Evidencia que soporta esta causa'
    )

    # Prioridad
    prioridad = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Prioridad',
        help_text='1 = Más importante, 5 = Menos importante'
    )

    # Auditoría
    creado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Creado Por'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )

    class Meta:
        db_table = 'hseq_causas_raiz'
        verbose_name = 'Causa Raíz'
        verbose_name_plural = 'Causas Raíz'
        ordering = ['investigacion', 'prioridad']
        indexes = [
            models.Index(fields=['empresa_id', 'investigacion']),
            models.Index(fields=['investigacion', 'tipo_causa']),
        ]

    def __str__(self):
        return f"{self.get_tipo_causa_display()} - {self.investigacion.codigo_investigacion}"


class LeccionAprendida(models.Model):
    """
    Lecciones Aprendidas derivadas de investigaciones
    """

    CATEGORIA_CHOICES = [
        ('TECNICA', 'Técnica/Operativa'),
        ('COMPORTAMENTAL', 'Comportamental'),
        ('ORGANIZACIONAL', 'Organizacional'),
        ('COMUNICACION', 'Comunicación'),
        ('CAPACITACION', 'Capacitación'),
        ('EQUIPOS', 'Equipos y Herramientas'),
        ('PROCEDIMIENTOS', 'Procedimientos'),
        ('OTRA', 'Otra'),
    ]

    ESTADO_DIVULGACION_CHOICES = [
        ('PENDIENTE', 'Pendiente de Divulgación'),
        ('PROGRAMADA', 'Divulgación Programada'),
        ('DIVULGADA', 'Divulgada'),
        ('ARCHIVADA', 'Archivada'),
    ]

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # Identificación
    codigo_leccion = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código de Lección'
    )

    # Relación con investigación
    investigacion = models.ForeignKey(
        InvestigacionATEL,
        on_delete=models.CASCADE,
        related_name='lecciones_aprendidas',
        verbose_name='Investigación'
    )

    # Categoría
    categoria = models.CharField(
        max_length=50,
        choices=CATEGORIA_CHOICES,
        verbose_name='Categoría'
    )

    # Contenido de la lección
    titulo = models.CharField(
        max_length=255,
        verbose_name='Título',
        help_text='Título descriptivo de la lección'
    )
    situacion = models.TextField(
        verbose_name='Situación',
        help_text='¿Qué pasó?'
    )
    causa = models.TextField(
        verbose_name='Causa',
        help_text='¿Por qué pasó?'
    )
    leccion = models.TextField(
        verbose_name='Lección',
        help_text='¿Qué aprendimos?'
    )
    recomendacion = models.TextField(
        verbose_name='Recomendación',
        help_text='¿Qué debemos hacer diferente?'
    )

    # Aplicabilidad
    areas_aplicables = models.TextField(
        verbose_name='Áreas Aplicables',
        help_text='Áreas o departamentos donde aplica esta lección'
    )
    puestos_trabajo_aplicables = models.TextField(
        blank=True,
        verbose_name='Puestos de Trabajo Aplicables'
    )

    # Divulgación
    estado_divulgacion = models.CharField(
        max_length=20,
        choices=ESTADO_DIVULGACION_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado de Divulgación'
    )
    fecha_divulgacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Divulgación'
    )
    metodo_divulgacion = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Método de Divulgación',
        help_text='Charla, correo, cartelera, capacitación, etc.'
    )
    personas_divulgadas = models.TextField(
        blank=True,
        verbose_name='Personas Divulgadas',
        help_text='Listado o descripción de personas que recibieron la divulgación'
    )
    evidencia_divulgacion = models.TextField(
        blank=True,
        verbose_name='Evidencia de Divulgación',
        help_text='Referencias a documentos, fotos, listas de asistencia, etc.'
    )

    # Auditoría
    creado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='lecciones_creadas',
        verbose_name='Creado Por'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    divulgado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lecciones_divulgadas',
        verbose_name='Divulgado Por'
    )
    actualizado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lecciones_actualizadas',
        verbose_name='Actualizado Por'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha Actualización'
    )

    class Meta:
        db_table = 'hseq_lecciones_aprendidas'
        verbose_name = 'Lección Aprendida'
        verbose_name_plural = 'Lecciones Aprendidas'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['empresa_id', 'estado_divulgacion']),
            models.Index(fields=['empresa_id', 'categoria']),
            models.Index(fields=['investigacion']),
        ]

    def __str__(self):
        return f"{self.codigo_leccion} - {self.titulo}"

    def save(self, *args, **kwargs):
        if not self.codigo_leccion:
            year = timezone.now().year
            last_leccion = LeccionAprendida.objects.filter(
                empresa_id=self.empresa_id,
                codigo_leccion__startswith=f'LA-{year}-'
            ).order_by('-codigo_leccion').first()

            if last_leccion:
                last_number = int(last_leccion.codigo_leccion.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1

            self.codigo_leccion = f'LA-{year}-{new_number:04d}'

        super().save(*args, **kwargs)


class PlanAccionATEL(models.Model):
    """
    Plan de Acción Correctiva derivado de investigación ATEL
    """

    ESTADO_CHOICES = [
        ('PLANIFICADO', 'Planificado'),
        ('EN_EJECUCION', 'En Ejecución'),
        ('COMPLETADO', 'Completado'),
        ('VERIFICADO', 'Verificado'),
        ('CERRADO', 'Cerrado'),
        ('CANCELADO', 'Cancelado'),
    ]

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # Identificación
    codigo_plan = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código del Plan'
    )

    # Relación con investigación
    investigacion = models.ForeignKey(
        InvestigacionATEL,
        on_delete=models.CASCADE,
        related_name='planes_accion',
        verbose_name='Investigación'
    )

    # Datos del plan
    nombre_plan = models.CharField(
        max_length=255,
        verbose_name='Nombre del Plan',
        help_text='Título descriptivo del plan de acción'
    )
    objetivo = models.TextField(
        verbose_name='Objetivo',
        help_text='Objetivo del plan de acción'
    )

    # Responsable
    responsable = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='planes_accion_responsable',
        verbose_name='Responsable del Plan'
    )

    # Fechas
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio'
    )
    fecha_compromiso = models.DateField(
        verbose_name='Fecha Compromiso',
        help_text='Fecha comprometida para completar todas las acciones'
    )
    fecha_completado = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Completado'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PLANIFICADO',
        verbose_name='Estado'
    )

    # Recursos
    recursos_necesarios = models.TextField(
        blank=True,
        verbose_name='Recursos Necesarios',
        help_text='Recursos humanos, materiales, financieros necesarios'
    )
    presupuesto_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Presupuesto Estimado'
    )

    # Seguimiento
    porcentaje_avance = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Porcentaje de Avance',
        help_text='Porcentaje de avance del plan'
    )
    observaciones_seguimiento = models.TextField(
        blank=True,
        verbose_name='Observaciones de Seguimiento'
    )

    # Verificación
    verificado = models.BooleanField(
        default=False,
        verbose_name='Verificado'
    )
    verificado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='planes_accion_verificados',
        verbose_name='Verificado Por'
    )
    fecha_verificacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Verificación'
    )
    efectividad = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Evaluación de Efectividad',
        help_text='Descripción de la efectividad de las acciones'
    )

    # Auditoría
    creado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='planes_accion_creados',
        verbose_name='Creado Por'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    actualizado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='planes_accion_actualizados',
        verbose_name='Actualizado Por'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha Actualización'
    )

    class Meta:
        db_table = 'hseq_planes_accion_atel'
        verbose_name = 'Plan de Acción ATEL'
        verbose_name_plural = 'Planes de Acción ATEL'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'fecha_compromiso']),
            models.Index(fields=['investigacion']),
            models.Index(fields=['responsable', 'estado']),
        ]

    def __str__(self):
        return f"{self.codigo_plan} - {self.nombre_plan}"

    def save(self, *args, **kwargs):
        if not self.codigo_plan:
            year = timezone.now().year
            last_plan = PlanAccionATEL.objects.filter(
                empresa_id=self.empresa_id,
                codigo_plan__startswith=f'PA-{year}-'
            ).order_by('-codigo_plan').first()

            if last_plan:
                last_number = int(last_plan.codigo_plan.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1

            self.codigo_plan = f'PA-{year}-{new_number:04d}'

        super().save(*args, **kwargs)


class AccionPlan(models.Model):
    """
    Acciones individuales dentro de un Plan de Acción
    """

    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROGRESO', 'En Progreso'),
        ('COMPLETADA', 'Completada'),
        ('VERIFICADA', 'Verificada'),
        ('CANCELADA', 'Cancelada'),
    ]

    TIPO_ACCION_CHOICES = [
        ('ELIMINACION', 'Eliminación del Peligro'),
        ('SUSTITUCION', 'Sustitución'),
        ('CONTROL_INGENIERIA', 'Control de Ingeniería'),
        ('CONTROL_ADMINISTRATIVO', 'Control Administrativo'),
        ('EPP', 'Equipos de Protección Personal'),
        ('CAPACITACION', 'Capacitación/Formación'),
        ('PROCEDIMIENTO', 'Revisión de Procedimiento'),
        ('SENALIZACION', 'Señalización'),
        ('INSPECCION', 'Inspección/Mantenimiento'),
        ('OTRA', 'Otra'),
    ]

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='ID Empresa'
    )

    # Relación con plan
    plan_accion = models.ForeignKey(
        PlanAccionATEL,
        on_delete=models.CASCADE,
        related_name='acciones',
        verbose_name='Plan de Acción'
    )

    # Orden dentro del plan
    orden = models.PositiveIntegerField(
        default=1,
        verbose_name='Orden',
        help_text='Orden de ejecución dentro del plan'
    )

    # Tipo de acción
    tipo_accion = models.CharField(
        max_length=50,
        choices=TIPO_ACCION_CHOICES,
        verbose_name='Tipo de Acción',
        help_text='Jerarquía de controles según ISO 45001'
    )

    # Descripción
    descripcion = models.TextField(
        verbose_name='Descripción de la Acción',
        help_text='Qué se va a hacer'
    )

    # Causa que atiende
    causa_raiz = models.ForeignKey(
        CausaRaiz,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acciones',
        verbose_name='Causa Raíz que Atiende'
    )

    # Responsable
    responsable = models.ForeignKey(
        'core.User',
        on_delete=models.PROTECT,
        related_name='acciones_plan_atel_responsable',
        verbose_name='Responsable'
    )

    # Fechas
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio'
    )
    fecha_compromiso = models.DateField(
        verbose_name='Fecha Compromiso',
        help_text='Fecha comprometida para completar esta acción'
    )
    fecha_completada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Completada'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado'
    )

    # Recursos
    recursos = models.TextField(
        blank=True,
        verbose_name='Recursos',
        help_text='Recursos específicos para esta acción'
    )
    costo_estimado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Costo Estimado'
    )

    # Evidencia
    evidencia_implementacion = models.TextField(
        blank=True,
        verbose_name='Evidencia de Implementación',
        help_text='Descripción de evidencias (fotos, documentos, etc.)'
    )

    # Verificación
    verificado = models.BooleanField(
        default=False,
        verbose_name='Verificado'
    )
    verificado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acciones_verificadas',
        verbose_name='Verificado Por'
    )
    fecha_verificacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Verificación'
    )
    observaciones_verificacion = models.TextField(
        blank=True,
        verbose_name='Observaciones de Verificación'
    )

    # Auditoría
    creado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='acciones_creadas',
        verbose_name='Creado Por'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    actualizado_por = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acciones_actualizadas',
        verbose_name='Actualizado Por'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha Actualización'
    )

    class Meta:
        db_table = 'hseq_acciones_plan'
        verbose_name = 'Acción del Plan'
        verbose_name_plural = 'Acciones del Plan'
        ordering = ['plan_accion', 'orden']
        indexes = [
            models.Index(fields=['empresa_id', 'plan_accion']),
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['responsable', 'estado']),
            models.Index(fields=['plan_accion', 'orden']),
        ]

    def __str__(self):
        return f"{self.plan_accion.codigo_plan} - Acción {self.orden}: {self.descripcion[:50]}"
