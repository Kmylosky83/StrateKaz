"""
Modelos para Gestión de Proyectos (PMI)
Estructura basada en PMBOK 7ma edición

Subtabs:
- Portafolio
- Iniciación (Charter)
- Planificación
- Ejecución/Monitoreo
- Cierre
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Portafolio(models.Model):
    """Agrupación estratégica de programas y proyectos"""
    empresa_id = models.PositiveBigIntegerField(default=1, db_index=True)
    codigo = models.CharField(max_length=20)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    objetivo_estrategico = models.TextField(blank=True, help_text="Objetivo estratégico al que contribuye")
    presupuesto_asignado = models.DecimalField(
        max_digits=18, decimal_places=2, default=0,
        help_text="Presupuesto total del portafolio"
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='portafolios_responsable'
    )
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='portafolios_creados'
    )

    class Meta:
        verbose_name = 'Portafolio'
        verbose_name_plural = 'Portafolios'
        unique_together = ['empresa_id', 'codigo']
        ordering = ['nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Programa(models.Model):
    """Agrupación de proyectos relacionados"""
    empresa_id = models.PositiveBigIntegerField(default=1, db_index=True)
    portafolio = models.ForeignKey(
        Portafolio, on_delete=models.CASCADE, related_name='programas'
    )
    codigo = models.CharField(max_length=20)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='programas_responsable'
    )
    presupuesto = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Programa'
        verbose_name_plural = 'Programas'
        unique_together = ['empresa_id', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Proyecto(models.Model):
    """Proyecto individual - Entidad principal"""

    class Estado(models.TextChoices):
        PROPUESTO = 'propuesto', 'Propuesto'
        INICIACION = 'iniciacion', 'Iniciación'
        PLANIFICACION = 'planificacion', 'Planificación'
        EJECUCION = 'ejecucion', 'Ejecución'
        MONITOREO = 'monitoreo', 'Monitoreo y Control'
        CIERRE = 'cierre', 'Cierre'
        COMPLETADO = 'completado', 'Completado'
        CANCELADO = 'cancelado', 'Cancelado'
        SUSPENDIDO = 'suspendido', 'Suspendido'

    class Prioridad(models.TextChoices):
        ALTA = 'alta', 'Alta'
        MEDIA = 'media', 'Media'
        BAJA = 'baja', 'Baja'

    class TipoProyecto(models.TextChoices):
        MEJORA = 'mejora', 'Mejora Continua'
        IMPLEMENTACION = 'implementacion', 'Implementación'
        DESARROLLO = 'desarrollo', 'Desarrollo'
        INFRAESTRUCTURA = 'infraestructura', 'Infraestructura'
        NORMATIVO = 'normativo', 'Cumplimiento Normativo'
        OTRO = 'otro', 'Otro'

    empresa_id = models.PositiveBigIntegerField(default=1, db_index=True)
    programa = models.ForeignKey(
        Programa, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='proyectos'
    )
    codigo = models.CharField(max_length=30)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    tipo = models.CharField(
        max_length=20, choices=TipoProyecto.choices,
        default=TipoProyecto.MEJORA
    )
    estado = models.CharField(
        max_length=20, choices=Estado.choices,
        default=Estado.PROPUESTO, db_index=True
    )
    prioridad = models.CharField(
        max_length=10, choices=Prioridad.choices,
        default=Prioridad.MEDIA
    )

    # Fechas
    fecha_propuesta = models.DateField(auto_now_add=True)
    fecha_inicio_plan = models.DateField(null=True, blank=True)
    fecha_fin_plan = models.DateField(null=True, blank=True)
    fecha_inicio_real = models.DateField(null=True, blank=True)
    fecha_fin_real = models.DateField(null=True, blank=True)

    # Recursos
    presupuesto_estimado = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    presupuesto_aprobado = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    costo_real = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Avance
    porcentaje_avance = models.PositiveSmallIntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # Responsables
    sponsor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='proyectos_sponsor'
    )
    gerente_proyecto = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='proyectos_gerente'
    )

    # Justificación
    justificacion = models.TextField(blank=True, help_text="Justificación del proyecto")
    beneficios_esperados = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='proyectos_creados'
    )

    class Meta:
        verbose_name = 'Proyecto'
        verbose_name_plural = 'Proyectos'
        unique_together = ['empresa_id', 'codigo']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'prioridad']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def variacion_costo(self):
        """CV = EV - AC (Earned Value - Actual Cost)"""
        return self.presupuesto_aprobado * (self.porcentaje_avance / 100) - self.costo_real

    @property
    def indice_desempeno_costo(self):
        """CPI = EV / AC"""
        if self.costo_real > 0:
            ev = self.presupuesto_aprobado * (self.porcentaje_avance / 100)
            return round(ev / float(self.costo_real), 2)
        return 1.0


class ProjectCharter(models.Model):
    """Acta de Constitución del Proyecto - Fase de Iniciación"""
    proyecto = models.OneToOneField(
        Proyecto, on_delete=models.CASCADE, related_name='charter'
    )

    # Información del Proyecto
    proposito = models.TextField(help_text="Propósito o justificación del proyecto")
    objetivos_medibles = models.TextField(help_text="Objetivos medibles y criterios de éxito")
    requisitos_alto_nivel = models.TextField(blank=True)
    descripcion_alto_nivel = models.TextField(blank=True)

    # Límites
    supuestos = models.TextField(blank=True, help_text="Supuestos del proyecto")
    restricciones = models.TextField(blank=True, help_text="Restricciones del proyecto")

    # Hitos principales
    hitos_clave = models.TextField(blank=True, help_text="Hitos principales del proyecto")

    # Riesgos de alto nivel
    riesgos_alto_nivel = models.TextField(blank=True)

    # Presupuesto resumido
    resumen_presupuesto = models.TextField(blank=True)

    # Cronograma resumido
    resumen_cronograma = models.TextField(blank=True)

    # Criterios de éxito
    criterios_exito = models.TextField(blank=True)

    # Aprobación
    fecha_aprobacion = models.DateField(null=True, blank=True)
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='charters_aprobados'
    )
    observaciones_aprobacion = models.TextField(blank=True)

    version = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Project Charter'
        verbose_name_plural = 'Project Charters'

    def __str__(self):
        return f"Charter - {self.proyecto.codigo}"


class InteresadoProyecto(models.Model):
    """Stakeholders del proyecto"""

    class NivelInteres(models.TextChoices):
        ALTO = 'alto', 'Alto'
        MEDIO = 'medio', 'Medio'
        BAJO = 'bajo', 'Bajo'

    class NivelInfluencia(models.TextChoices):
        ALTA = 'alta', 'Alta'
        MEDIA = 'media', 'Media'
        BAJA = 'baja', 'Baja'

    proyecto = models.ForeignKey(
        Proyecto, on_delete=models.CASCADE, related_name='interesados'
    )
    nombre = models.CharField(max_length=200)
    cargo_rol = models.CharField(max_length=100, blank=True)
    organizacion = models.CharField(max_length=200, blank=True)
    contacto = models.CharField(max_length=200, blank=True)

    nivel_interes = models.CharField(
        max_length=10, choices=NivelInteres.choices, default=NivelInteres.MEDIO
    )
    nivel_influencia = models.CharField(
        max_length=10, choices=NivelInfluencia.choices, default=NivelInfluencia.MEDIA
    )

    requisitos = models.TextField(blank=True, help_text="Requisitos o expectativas principales")
    estrategia_gestion = models.TextField(blank=True, help_text="Estrategia de gestión")

    is_internal = models.BooleanField(default=True, help_text="Interesado interno o externo")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Interesado del Proyecto'
        verbose_name_plural = 'Interesados del Proyecto'
        ordering = ['-nivel_influencia', '-nivel_interes']

    def __str__(self):
        return f"{self.nombre} - {self.proyecto.codigo}"


class FaseProyecto(models.Model):
    """Fases del proyecto para planificación"""
    proyecto = models.ForeignKey(
        Proyecto, on_delete=models.CASCADE, related_name='fases'
    )
    orden = models.PositiveSmallIntegerField(default=1)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    fecha_inicio_plan = models.DateField(null=True, blank=True)
    fecha_fin_plan = models.DateField(null=True, blank=True)
    fecha_inicio_real = models.DateField(null=True, blank=True)
    fecha_fin_real = models.DateField(null=True, blank=True)
    porcentaje_avance = models.PositiveSmallIntegerField(default=0)
    entregables = models.TextField(blank=True, help_text="Entregables de la fase")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Fase del Proyecto'
        verbose_name_plural = 'Fases del Proyecto'
        ordering = ['proyecto', 'orden']
        unique_together = ['proyecto', 'orden']

    def __str__(self):
        return f"Fase {self.orden}: {self.nombre}"


class ActividadProyecto(models.Model):
    """Actividades/Tareas del proyecto - WBS"""

    class Estado(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        EN_PROGRESO = 'en_progreso', 'En Progreso'
        COMPLETADA = 'completada', 'Completada'
        BLOQUEADA = 'bloqueada', 'Bloqueada'
        CANCELADA = 'cancelada', 'Cancelada'

    proyecto = models.ForeignKey(
        Proyecto, on_delete=models.CASCADE, related_name='actividades'
    )
    fase = models.ForeignKey(
        FaseProyecto, on_delete=models.CASCADE,
        null=True, blank=True, related_name='actividades'
    )
    codigo_wbs = models.CharField(max_length=50, blank=True, help_text="Código WBS: 1.1.1")
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)

    estado = models.CharField(
        max_length=20, choices=Estado.choices, default=Estado.PENDIENTE
    )

    # Fechas
    fecha_inicio_plan = models.DateField(null=True, blank=True)
    fecha_fin_plan = models.DateField(null=True, blank=True)
    fecha_inicio_real = models.DateField(null=True, blank=True)
    fecha_fin_real = models.DateField(null=True, blank=True)

    # Duración y esfuerzo
    duracion_estimada_dias = models.PositiveSmallIntegerField(default=1)
    esfuerzo_estimado_horas = models.DecimalField(
        max_digits=8, decimal_places=2, default=0
    )

    # Avance
    porcentaje_avance = models.PositiveSmallIntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # Asignación
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='actividades_proyecto'
    )

    # Dependencias
    predecesoras = models.ManyToManyField(
        'self', symmetrical=False, blank=True,
        related_name='sucesoras'
    )

    prioridad = models.PositiveSmallIntegerField(default=5)
    notas = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Actividad del Proyecto'
        verbose_name_plural = 'Actividades del Proyecto'
        ordering = ['proyecto', 'codigo_wbs', 'prioridad']

    def __str__(self):
        return f"{self.codigo_wbs} {self.nombre}" if self.codigo_wbs else self.nombre


class RecursoProyecto(models.Model):
    """Recursos asignados al proyecto"""

    class TipoRecurso(models.TextChoices):
        HUMANO = 'humano', 'Recurso Humano'
        MATERIAL = 'material', 'Material'
        EQUIPO = 'equipo', 'Equipo'
        SERVICIO = 'servicio', 'Servicio'

    proyecto = models.ForeignKey(
        Proyecto, on_delete=models.CASCADE, related_name='recursos'
    )
    tipo = models.CharField(max_length=20, choices=TipoRecurso.choices)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)

    # Para recursos humanos
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='asignaciones_proyecto'
    )
    rol_proyecto = models.CharField(max_length=100, blank=True)
    dedicacion_porcentaje = models.PositiveSmallIntegerField(
        default=100, validators=[MaxValueValidator(100)]
    )

    # Costos
    costo_unitario = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    costo_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Recurso del Proyecto'
        verbose_name_plural = 'Recursos del Proyecto'

    def __str__(self):
        return f"{self.nombre} - {self.proyecto.codigo}"

    def save(self, *args, **kwargs):
        self.costo_total = self.costo_unitario * self.cantidad
        super().save(*args, **kwargs)


class RiesgoProyecto(models.Model):
    """Riesgos del proyecto"""

    class Probabilidad(models.TextChoices):
        MUY_ALTA = 'muy_alta', 'Muy Alta (>80%)'
        ALTA = 'alta', 'Alta (60-80%)'
        MEDIA = 'media', 'Media (40-60%)'
        BAJA = 'baja', 'Baja (20-40%)'
        MUY_BAJA = 'muy_baja', 'Muy Baja (<20%)'

    class Impacto(models.TextChoices):
        MUY_ALTO = 'muy_alto', 'Muy Alto'
        ALTO = 'alto', 'Alto'
        MEDIO = 'medio', 'Medio'
        BAJO = 'bajo', 'Bajo'
        MUY_BAJO = 'muy_bajo', 'Muy Bajo'

    class TipoRiesgo(models.TextChoices):
        AMENAZA = 'amenaza', 'Amenaza'
        OPORTUNIDAD = 'oportunidad', 'Oportunidad'

    class EstrategiaRespuesta(models.TextChoices):
        # Para amenazas
        EVITAR = 'evitar', 'Evitar'
        TRANSFERIR = 'transferir', 'Transferir'
        MITIGAR = 'mitigar', 'Mitigar'
        ACEPTAR = 'aceptar', 'Aceptar'
        # Para oportunidades
        EXPLOTAR = 'explotar', 'Explotar'
        COMPARTIR = 'compartir', 'Compartir'
        MEJORAR = 'mejorar', 'Mejorar'

    proyecto = models.ForeignKey(
        Proyecto, on_delete=models.CASCADE, related_name='riesgos'
    )
    codigo = models.CharField(max_length=20)
    tipo = models.CharField(
        max_length=15, choices=TipoRiesgo.choices, default=TipoRiesgo.AMENAZA
    )
    descripcion = models.TextField()
    causa = models.TextField(blank=True)
    efecto = models.TextField(blank=True, help_text="Impacto si se materializa")

    probabilidad = models.CharField(
        max_length=15, choices=Probabilidad.choices, default=Probabilidad.MEDIA
    )
    impacto = models.CharField(
        max_length=15, choices=Impacto.choices, default=Impacto.MEDIO
    )

    estrategia = models.CharField(
        max_length=15, choices=EstrategiaRespuesta.choices,
        null=True, blank=True
    )
    plan_respuesta = models.TextField(blank=True)

    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='riesgos_proyecto'
    )

    # Estado
    is_materializado = models.BooleanField(default=False)
    fecha_identificacion = models.DateField(auto_now_add=True)
    fecha_materializacion = models.DateField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Riesgo del Proyecto'
        verbose_name_plural = 'Riesgos del Proyecto'
        unique_together = ['proyecto', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.descripcion[:50]}"

    @property
    def nivel_riesgo(self):
        """Calcula nivel de riesgo (P x I)"""
        valores_prob = {
            'muy_alta': 5, 'alta': 4, 'media': 3, 'baja': 2, 'muy_baja': 1
        }
        valores_imp = {
            'muy_alto': 5, 'alto': 4, 'medio': 3, 'bajo': 2, 'muy_bajo': 1
        }
        return valores_prob.get(self.probabilidad, 3) * valores_imp.get(self.impacto, 3)


class SeguimientoProyecto(models.Model):
    """Registro de seguimiento/avance del proyecto - Monitoreo"""
    proyecto = models.ForeignKey(
        Proyecto, on_delete=models.CASCADE, related_name='seguimientos'
    )
    fecha = models.DateField()
    porcentaje_avance = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    costo_acumulado = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Estado general
    estado_general = models.CharField(max_length=20, choices=[
        ('verde', 'En Plan (Verde)'),
        ('amarillo', 'En Riesgo (Amarillo)'),
        ('rojo', 'Crítico (Rojo)'),
    ], default='verde')

    logros_periodo = models.TextField(blank=True, help_text="Logros del período")
    problemas_encontrados = models.TextField(blank=True)
    acciones_correctivas = models.TextField(blank=True)
    proximas_actividades = models.TextField(blank=True)

    # Indicadores EVM (Earned Value Management)
    valor_planificado = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_ganado = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    costo_actual = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    observaciones = models.TextField(blank=True)
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='seguimientos_proyecto'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Seguimiento del Proyecto'
        verbose_name_plural = 'Seguimientos del Proyecto'
        ordering = ['-fecha']
        unique_together = ['proyecto', 'fecha']

    def __str__(self):
        return f"Seguimiento {self.proyecto.codigo} - {self.fecha}"

    @property
    def spi(self):
        """Schedule Performance Index = EV / PV"""
        if self.valor_planificado > 0:
            return round(float(self.valor_ganado / self.valor_planificado), 2)
        return 1.0

    @property
    def cpi(self):
        """Cost Performance Index = EV / AC"""
        if self.costo_actual > 0:
            return round(float(self.valor_ganado / self.costo_actual), 2)
        return 1.0


class LeccionAprendida(models.Model):
    """Lecciones aprendidas del proyecto - Cierre"""

    class Tipo(models.TextChoices):
        EXITO = 'exito', 'Caso de Éxito'
        PROBLEMA = 'problema', 'Problema Encontrado'
        MEJORA = 'mejora', 'Oportunidad de Mejora'
        BUENA_PRACTICA = 'buena_practica', 'Buena Práctica'

    proyecto = models.ForeignKey(
        Proyecto, on_delete=models.CASCADE, related_name='lecciones'
    )
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    titulo = models.CharField(max_length=200)
    situacion = models.TextField(help_text="Descripción de la situación")
    accion_tomada = models.TextField(blank=True, help_text="Qué se hizo")
    resultado = models.TextField(blank=True, help_text="Cuál fue el resultado")
    recomendacion = models.TextField(help_text="Recomendación para futuros proyectos")

    area_conocimiento = models.CharField(max_length=100, blank=True)
    tags = models.CharField(max_length=300, blank=True, help_text="Tags separados por coma")

    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='lecciones_registradas'
    )
    fecha_registro = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Lección Aprendida'
        verbose_name_plural = 'Lecciones Aprendidas'
        ordering = ['-fecha_registro']

    def __str__(self):
        return f"{self.titulo} - {self.proyecto.codigo}"


class ActaCierre(models.Model):
    """Acta de cierre del proyecto"""
    proyecto = models.OneToOneField(
        Proyecto, on_delete=models.CASCADE, related_name='acta_cierre'
    )

    fecha_cierre = models.DateField()

    # Cumplimiento de objetivos
    objetivos_cumplidos = models.TextField(help_text="Objetivos alcanzados")
    objetivos_no_cumplidos = models.TextField(blank=True, help_text="Objetivos no alcanzados y razones")

    # Entregables
    entregables_completados = models.TextField()
    entregables_pendientes = models.TextField(blank=True)

    # Resultados financieros
    presupuesto_final = models.DecimalField(max_digits=18, decimal_places=2)
    costo_final = models.DecimalField(max_digits=18, decimal_places=2)
    variacion_presupuesto = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Resultados de tiempo
    duracion_planificada_dias = models.PositiveIntegerField(default=0)
    duracion_real_dias = models.PositiveIntegerField(default=0)

    # Evaluación general
    evaluacion_general = models.TextField(blank=True)
    recomendaciones_futuras = models.TextField(blank=True)

    # Aprobación
    aprobado_por_sponsor = models.BooleanField(default=False)
    fecha_aprobacion = models.DateField(null=True, blank=True)
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='actas_cierre_aprobadas'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='actas_cierre_creadas'
    )

    class Meta:
        verbose_name = 'Acta de Cierre'
        verbose_name_plural = 'Actas de Cierre'

    def __str__(self):
        return f"Cierre - {self.proyecto.codigo}"

    def save(self, *args, **kwargs):
        self.variacion_presupuesto = self.presupuesto_final - self.costo_final
        super().save(*args, **kwargs)
