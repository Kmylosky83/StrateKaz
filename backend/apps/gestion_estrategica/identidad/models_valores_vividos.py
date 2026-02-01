"""
Sistema de Valores Corporativos Vividos
=======================================

Modelo genérico para conectar Valores Corporativos con acciones reales
de la organización, permitiendo medir qué tan "vividos" son los valores.

ARQUITECTURA ABIERTA:
Usa GenericForeignKey para conectarse a CUALQUIER acción del sistema:
- Gestión del Cambio (GestionCambio)
- Proyectos (Proyecto)
- Acciones Correctivas (AccionCorrectiva)
- Acciones de Mejora (AccionMejora)
- Objetivos Estratégicos (StrategicObjective)
- KPIs (KPIObjetivo)
- Cualquier modelo futuro...

FLUJO:
1. Usuario crea/completa una acción (ej: Proyecto, Acción Correctiva)
2. Sistema o usuario vincula valores corporativos a esa acción
3. Módulo de BI consume estas conexiones para medir:
   - ¿Cuántas acciones reflejan cada valor?
   - ¿Qué áreas "viven" más cada valor?
   - ¿Qué tendencia tienen los valores en el tiempo?
   - ¿Qué valores están subrepresentados?

CUMPLIMIENTO:
- ISO 9001: Valores y cultura organizacional
- Decreto 1072: Cultura de seguridad
- OKR/BSC: Alineación estratégica
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Count, Avg, Q, F
from django.db.models.functions import TruncMonth, TruncQuarter, TruncYear

from apps.core.base_models import TimestampedModel, AuditModel, SoftDeleteModel


# =============================================================================
# CHOICES
# =============================================================================

IMPACTO_CHOICES = [
    ('BAJO', 'Bajo'),
    ('MEDIO', 'Medio'),
    ('ALTO', 'Alto'),
    ('MUY_ALTO', 'Muy Alto'),
]

TIPO_VINCULO_CHOICES = [
    ('REFLEJA', 'Refleja el valor'),           # La acción ejemplifica el valor
    ('PROMUEVE', 'Promueve el valor'),         # La acción fomenta el valor
    ('RESULTADO', 'Resultado del valor'),      # La acción es consecuencia del valor
    ('MEJORA', 'Mejora el valor'),             # La acción fortalece el valor
]

CATEGORIA_ACCION_CHOICES = [
    # Gestión Estratégica
    ('PROYECTO', 'Proyecto'),
    ('OBJETIVO', 'Objetivo Estratégico'),
    ('INICIATIVA', 'Iniciativa'),
    # Mejora Continua
    ('ACCION_CORRECTIVA', 'Acción Correctiva'),
    ('ACCION_PREVENTIVA', 'Acción Preventiva'),
    ('ACCION_MEJORA', 'Acción de Mejora'),
    ('OPORTUNIDAD_MEJORA', 'Oportunidad de Mejora'),
    # Gestión del Cambio
    ('GESTION_CAMBIO', 'Gestión del Cambio'),
    # SST
    ('INVESTIGACION_INCIDENTE', 'Investigación de Incidente'),
    ('INSPECCION', 'Inspección'),
    # Auditoría
    ('HALLAZGO_AUDITORIA', 'Hallazgo de Auditoría'),
    ('NO_CONFORMIDAD', 'No Conformidad'),
    # PESV
    ('ACCION_PESV', 'Acción PESV'),
    # Otros
    ('OTRO', 'Otro'),
]


# =============================================================================
# MANAGER CON MÉTODOS DE CONSULTA PARA BI
# =============================================================================

class ValorVividoManager(models.Manager):
    """Manager con métodos especializados para consultas de BI"""

    def get_queryset(self):
        return super().get_queryset().select_related(
            'valor', 'content_type', 'vinculado_por'
        )

    def activos(self):
        """Solo registros activos"""
        return self.get_queryset().filter(is_active=True)

    def por_valor(self, valor_id):
        """Filtrar por valor corporativo"""
        return self.activos().filter(valor_id=valor_id)

    def por_categoria(self, categoria):
        """Filtrar por categoría de acción"""
        return self.activos().filter(categoria_accion=categoria)

    def por_empresa(self, empresa_id):
        """Filtrar por empresa (multi-tenant)"""
        return self.activos().filter(valor__identity__empresa_id=empresa_id)

    def estadisticas_por_valor(self, empresa_id=None, fecha_desde=None, fecha_hasta=None):
        """
        Estadísticas agregadas por valor corporativo.

        Returns:
            QuerySet con: valor_id, valor_nombre, total_acciones,
            impacto_promedio, por_categoria
        """
        qs = self.activos()

        if empresa_id:
            qs = qs.filter(valor__identity__empresa_id=empresa_id)

        if fecha_desde:
            qs = qs.filter(fecha_vinculacion__gte=fecha_desde)

        if fecha_hasta:
            qs = qs.filter(fecha_vinculacion__lte=fecha_hasta)

        return qs.values(
            'valor__id',
            'valor__name',
            'valor__icon'
        ).annotate(
            total_acciones=Count('id'),
            impacto_bajo=Count('id', filter=Q(impacto='BAJO')),
            impacto_medio=Count('id', filter=Q(impacto='MEDIO')),
            impacto_alto=Count('id', filter=Q(impacto='ALTO')),
            impacto_muy_alto=Count('id', filter=Q(impacto='MUY_ALTO')),
        ).order_by('-total_acciones')

    def tendencia_mensual(self, empresa_id=None, meses=12):
        """
        Tendencia mensual de valores vividos.

        Returns:
            QuerySet con: mes, valor_id, total_acciones
        """
        from datetime import timedelta

        qs = self.activos()
        fecha_inicio = timezone.now() - timedelta(days=meses * 30)

        if empresa_id:
            qs = qs.filter(valor__identity__empresa_id=empresa_id)

        return qs.filter(
            fecha_vinculacion__gte=fecha_inicio
        ).annotate(
            mes=TruncMonth('fecha_vinculacion')
        ).values(
            'mes', 'valor__id', 'valor__name'
        ).annotate(
            total=Count('id')
        ).order_by('mes', 'valor__name')

    def ranking_categorias(self, valor_id=None, empresa_id=None):
        """
        Ranking de categorías de acciones por cantidad.

        Returns:
            QuerySet con: categoria_accion, total, porcentaje
        """
        qs = self.activos()

        if valor_id:
            qs = qs.filter(valor_id=valor_id)

        if empresa_id:
            qs = qs.filter(valor__identity__empresa_id=empresa_id)

        total_general = qs.count() or 1

        return qs.values('categoria_accion').annotate(
            total=Count('id'),
        ).annotate(
            porcentaje=F('total') * 100.0 / total_general
        ).order_by('-total')

    def valores_subrepresentados(self, empresa_id, umbral_minimo=5):
        """
        Identifica valores con pocas acciones vinculadas.

        Args:
            empresa_id: ID de la empresa
            umbral_minimo: Cantidad mínima esperada de acciones

        Returns:
            Lista de valores con menos acciones de las esperadas
        """
        from .models import CorporateValue

        # Obtener todos los valores activos
        valores = CorporateValue.objects.filter(
            identity__empresa_id=empresa_id,
            is_active=True
        )

        # Contar acciones por valor
        stats = self.activos().filter(
            valor__identity__empresa_id=empresa_id
        ).values('valor_id').annotate(
            total=Count('id')
        )

        stats_dict = {s['valor_id']: s['total'] for s in stats}

        # Identificar subrepresentados
        subrepresentados = []
        for valor in valores:
            total = stats_dict.get(valor.id, 0)
            if total < umbral_minimo:
                subrepresentados.append({
                    'valor_id': valor.id,
                    'valor_nombre': valor.name,
                    'total_acciones': total,
                    'deficit': umbral_minimo - total,
                    'porcentaje_cumplimiento': (total / umbral_minimo * 100) if umbral_minimo > 0 else 0
                })

        return sorted(subrepresentados, key=lambda x: x['total_acciones'])


# =============================================================================
# MODELO PRINCIPAL: VALOR VIVIDO (CONEXIÓN GENÉRICA)
# =============================================================================

class ValorVivido(AuditModel, SoftDeleteModel):
    """
    Conexión genérica entre un Valor Corporativo y cualquier acción del sistema.

    Permite vincular valores a:
    - Proyectos
    - Acciones correctivas/preventivas/mejora
    - Gestión del cambio
    - Investigación de incidentes
    - Hallazgos de auditoría
    - Cualquier modelo futuro...

    CARACTERÍSTICAS:
    - GenericForeignKey para máxima flexibilidad
    - Categorización de acciones
    - Nivel de impacto
    - Tipo de vínculo (refleja, promueve, resultado, mejora)
    - Evidencia y justificación
    - Métricas para BI
    """

    # Relación con el valor corporativo
    valor = models.ForeignKey(
        'identidad.CorporateValue',
        on_delete=models.CASCADE,
        related_name='acciones_vinculadas',
        verbose_name='Valor Corporativo',
        db_index=True
    )

    # Relación genérica con cualquier acción
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de Acción',
        help_text='Modelo de la acción vinculada (Proyecto, AccionCorrectiva, etc.)'
    )
    object_id = models.PositiveIntegerField(
        verbose_name='ID de la Acción'
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Categorización (para facilitar filtros en BI)
    categoria_accion = models.CharField(
        max_length=30,
        choices=CATEGORIA_ACCION_CHOICES,
        default='OTRO',
        verbose_name='Categoría de Acción',
        db_index=True,
        help_text='Categoría de la acción vinculada para reportes'
    )

    # Tipo de vínculo
    tipo_vinculo = models.CharField(
        max_length=20,
        choices=TIPO_VINCULO_CHOICES,
        default='REFLEJA',
        verbose_name='Tipo de Vínculo',
        help_text='Cómo se relaciona la acción con el valor'
    )

    # Nivel de impacto
    impacto = models.CharField(
        max_length=20,
        choices=IMPACTO_CHOICES,
        default='MEDIO',
        verbose_name='Nivel de Impacto',
        db_index=True,
        help_text='Qué tan significativo es el impacto en el valor'
    )

    # Puntaje numérico (para cálculos de BI)
    puntaje = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name='Puntaje',
        help_text='Puntaje de 1-10 para cálculos de BI'
    )

    # Fecha del vínculo (puede ser diferente a created_at)
    fecha_vinculacion = models.DateField(
        default=timezone.now,
        verbose_name='Fecha de Vinculación',
        db_index=True,
        help_text='Fecha en que se realizó la vinculación'
    )

    # Justificación
    justificacion = models.TextField(
        verbose_name='Justificación',
        help_text='Por qué esta acción refleja/promueve este valor'
    )

    # Evidencia (opcional)
    evidencia = models.TextField(
        blank=True,
        null=True,
        verbose_name='Evidencia',
        help_text='Descripción de la evidencia que soporta el vínculo'
    )
    archivo_evidencia = models.FileField(
        upload_to='valores_vividos/evidencias/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Archivo de Evidencia'
    )

    # Usuario que realizó la vinculación
    vinculado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='valores_vinculados',
        verbose_name='Vinculado por'
    )

    # Área responsable (desnormalizado para reportes rápidos)
    area = models.ForeignKey(
        'organizacion.Area',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='valores_vividos',
        verbose_name='Área',
        help_text='Área responsable de la acción'
    )

    # Metadatos para BI
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadatos',
        help_text='Datos adicionales para reportes (título acción, código, etc.)'
    )

    # Verificación/validación
    verificado = models.BooleanField(
        default=False,
        verbose_name='Verificado',
        help_text='Si el vínculo ha sido verificado por un supervisor'
    )
    verificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='valores_verificados',
        verbose_name='Verificado por'
    )
    fecha_verificacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Verificación'
    )

    objects = ValorVividoManager()

    class Meta:
        db_table = 'identidad_valor_vivido'
        verbose_name = 'Valor Vivido'
        verbose_name_plural = 'Valores Vividos'
        ordering = ['-fecha_vinculacion', '-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id'], name='valor_vivido_content_idx'),
            models.Index(fields=['valor', 'fecha_vinculacion'], name='valor_vivido_valor_fecha_idx'),
            models.Index(fields=['categoria_accion', 'impacto'], name='valor_vivido_cat_imp_idx'),
            models.Index(fields=['area', 'fecha_vinculacion'], name='valor_vivido_area_fecha_idx'),
        ]
        unique_together = [
            ['valor', 'content_type', 'object_id'],  # Un valor por acción
        ]

    def __str__(self):
        return f"{self.valor.name} ← {self.get_categoria_accion_display()} ({self.get_impacto_display()})"

    def save(self, *args, **kwargs):
        """Auto-poblar metadatos del objeto vinculado"""
        if not self.metadata and self.content_object:
            self.metadata = self._extraer_metadata()

        # Auto-asignar puntaje según impacto
        if not self.pk:
            impacto_puntaje = {
                'BAJO': 2,
                'MEDIO': 5,
                'ALTO': 8,
                'MUY_ALTO': 10,
            }
            self.puntaje = impacto_puntaje.get(self.impacto, 5)

        super().save(*args, **kwargs)

    def _extraer_metadata(self):
        """Extrae metadatos del objeto vinculado para reportes"""
        obj = self.content_object
        if not obj:
            return {}

        metadata = {
            'model': f"{obj._meta.app_label}.{obj._meta.model_name}",
        }

        # Intentar extraer campos comunes
        for campo in ['titulo', 'title', 'nombre', 'name', 'codigo', 'code']:
            if hasattr(obj, campo):
                metadata['titulo'] = getattr(obj, campo)
                break

        for campo in ['descripcion', 'description']:
            if hasattr(obj, campo):
                valor = getattr(obj, campo)
                if valor:
                    metadata['descripcion'] = valor[:200]  # Limitar longitud
                break

        if hasattr(obj, 'created_at'):
            metadata['fecha_creacion'] = obj.created_at.isoformat()

        if hasattr(obj, 'status'):
            metadata['estado'] = obj.status

        return metadata

    def verificar(self, usuario):
        """Marca el vínculo como verificado"""
        self.verificado = True
        self.verificado_por = usuario
        self.fecha_verificacion = timezone.now()
        self.save(update_fields=['verificado', 'verificado_por', 'fecha_verificacion', 'updated_at'])

    @property
    def accion_titulo(self):
        """Obtiene el título de la acción vinculada"""
        if self.metadata and 'titulo' in self.metadata:
            return self.metadata['titulo']

        obj = self.content_object
        if obj:
            for campo in ['titulo', 'title', 'nombre', 'name']:
                if hasattr(obj, campo):
                    return getattr(obj, campo)

        return f"{self.get_categoria_accion_display()} #{self.object_id}"


# =============================================================================
# MODELO: CONFIGURACIÓN DE MÉTRICAS DE VALORES (PARA BI)
# =============================================================================

class ConfiguracionMetricaValor(TimestampedModel):
    """
    Configuración de métricas y umbrales para el módulo de BI.

    Define cómo medir y alertar sobre el cumplimiento de valores.
    """

    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='metricas_valores',
        verbose_name='Empresa'
    )

    # Umbrales generales
    acciones_minimas_mensual = models.PositiveIntegerField(
        default=5,
        verbose_name='Acciones Mínimas por Mes',
        help_text='Cantidad mínima de acciones esperadas por valor por mes'
    )
    puntaje_minimo_promedio = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=5.0,
        verbose_name='Puntaje Mínimo Promedio',
        help_text='Puntaje promedio mínimo esperado (1-10)'
    )

    # Alertas
    alertar_valores_bajos = models.BooleanField(
        default=True,
        verbose_name='Alertar Valores Bajos',
        help_text='Enviar alertas cuando un valor tiene pocas acciones'
    )
    umbral_alerta_acciones = models.PositiveIntegerField(
        default=3,
        verbose_name='Umbral de Alerta (acciones)',
        help_text='Enviar alerta si un valor tiene menos de N acciones en el mes'
    )

    # Configuración de categorías prioritarias
    categorias_prioritarias = models.JSONField(
        default=list,
        verbose_name='Categorías Prioritarias',
        help_text='Lista de categorías de acciones que tienen mayor peso'
    )

    # Pesos por tipo de vínculo
    pesos_tipo_vinculo = models.JSONField(
        default=dict,
        verbose_name='Pesos por Tipo de Vínculo',
        help_text='Multiplicadores por tipo de vínculo (ej: {"REFLEJA": 1.0, "PROMUEVE": 0.8})'
    )

    # Período de análisis
    meses_analisis = models.PositiveSmallIntegerField(
        default=12,
        verbose_name='Meses de Análisis',
        help_text='Cantidad de meses a considerar para tendencias'
    )

    class Meta:
        db_table = 'identidad_config_metrica_valor'
        verbose_name = 'Configuración de Métrica de Valor'
        verbose_name_plural = 'Configuraciones de Métricas de Valores'
        unique_together = [['empresa']]

    def __str__(self):
        return f"Métricas de Valores - {self.empresa.razon_social}"

    def get_peso_tipo_vinculo(self, tipo):
        """Obtiene el peso multiplicador para un tipo de vínculo"""
        pesos_default = {
            'REFLEJA': 1.0,
            'PROMUEVE': 0.8,
            'RESULTADO': 0.9,
            'MEJORA': 1.2,
        }

        if self.pesos_tipo_vinculo:
            return self.pesos_tipo_vinculo.get(tipo, pesos_default.get(tipo, 1.0))

        return pesos_default.get(tipo, 1.0)


# =============================================================================
# FUNCIONES AUXILIARES PARA VINCULAR VALORES
# =============================================================================

def vincular_valor_a_accion(valor, accion, categoria, tipo_vinculo='REFLEJA',
                             impacto='MEDIO', justificacion='', usuario=None, area=None):
    """
    Función auxiliar para vincular un valor corporativo a una acción.

    Args:
        valor: Instancia de CorporateValue o ID
        accion: Instancia del modelo de acción (Proyecto, AccionCorrectiva, etc.)
        categoria: Categoría de la acción (de CATEGORIA_ACCION_CHOICES)
        tipo_vinculo: Tipo de vínculo (de TIPO_VINCULO_CHOICES)
        impacto: Nivel de impacto (de IMPACTO_CHOICES)
        justificacion: Justificación del vínculo
        usuario: Usuario que realiza el vínculo
        area: Área responsable

    Returns:
        ValorVivido: Instancia creada o existente
    """
    from .models import CorporateValue

    # Obtener valor si se pasó ID
    if isinstance(valor, int):
        valor = CorporateValue.objects.get(id=valor)

    # Obtener content type
    content_type = ContentType.objects.get_for_model(accion)

    # Crear o actualizar
    valor_vivido, created = ValorVivido.objects.update_or_create(
        valor=valor,
        content_type=content_type,
        object_id=accion.id,
        defaults={
            'categoria_accion': categoria,
            'tipo_vinculo': tipo_vinculo,
            'impacto': impacto,
            'justificacion': justificacion,
            'vinculado_por': usuario,
            'area': area,
            'created_by': usuario,
            'updated_by': usuario,
        }
    )

    return valor_vivido


def desvincular_valor_de_accion(valor, accion):
    """
    Desvincula un valor de una acción (soft delete).

    Args:
        valor: Instancia de CorporateValue o ID
        accion: Instancia del modelo de acción

    Returns:
        bool: True si se desvinculó, False si no existía
    """
    from .models import CorporateValue

    if isinstance(valor, int):
        valor = CorporateValue.objects.get(id=valor)

    content_type = ContentType.objects.get_for_model(accion)

    try:
        valor_vivido = ValorVivido.objects.get(
            valor=valor,
            content_type=content_type,
            object_id=accion.id,
            is_active=True
        )
        valor_vivido.soft_delete()
        return True
    except ValorVivido.DoesNotExist:
        return False


def obtener_valores_de_accion(accion):
    """
    Obtiene todos los valores vinculados a una acción.

    Args:
        accion: Instancia del modelo de acción

    Returns:
        QuerySet de ValorVivido
    """
    content_type = ContentType.objects.get_for_model(accion)

    return ValorVivido.objects.filter(
        content_type=content_type,
        object_id=accion.id,
        is_active=True
    ).select_related('valor')


def obtener_acciones_de_valor(valor_id, categoria=None, fecha_desde=None, fecha_hasta=None):
    """
    Obtiene todas las acciones vinculadas a un valor.

    Args:
        valor_id: ID del valor corporativo
        categoria: Filtrar por categoría (opcional)
        fecha_desde: Fecha inicio (opcional)
        fecha_hasta: Fecha fin (opcional)

    Returns:
        QuerySet de ValorVivido
    """
    qs = ValorVivido.objects.filter(
        valor_id=valor_id,
        is_active=True
    ).select_related('content_type')

    if categoria:
        qs = qs.filter(categoria_accion=categoria)

    if fecha_desde:
        qs = qs.filter(fecha_vinculacion__gte=fecha_desde)

    if fecha_hasta:
        qs = qs.filter(fecha_vinculacion__lte=fecha_hasta)

    return qs.order_by('-fecha_vinculacion')
