"""
Modelo de Caracterización de Procesos
Sistema de Gestión StrateKaz

Ficha estructurada SIPOC por proceso/área:
Proveedores → Entradas → Actividades → Salidas → Clientes

REORG-B5: 9 modelos hijos relacionales reemplazan JSONFields.
Cross-module via IntegerField (C1 no importa de C2).

Ubicación: organizacion (C1 - Fundación)
"""
from django.db import models
from django.conf import settings

from apps.core.base_models import AuditModel, SoftDeleteModel


# ==============================================================================
# CONSTANTES
# ==============================================================================

ESTADO_CARACTERIZACION_CHOICES = [
    ('BORRADOR', 'Borrador'),
    ('VIGENTE', 'Vigente'),
    ('EN_REVISION', 'En Revisión'),
    ('OBSOLETO', 'Obsoleto'),
]


# ==============================================================================
# MODELO CARACTERIZACIÓN DE PROCESO
# ==============================================================================

class CaracterizacionProceso(AuditModel, SoftDeleteModel):
    """
    Ficha de caracterización por proceso/área — Metodología SIPOC.

    Cada área/proceso tiene una única ficha que describe su operación:
    objetivo, alcance, entradas/salidas, recursos e indicadores.

    Los campos de referencia cruzada (indicadores, riesgos, documentos)
    son informacionales (JSONField), no FKs, respetando la independencia
    entre capas (C1 no importa de C2).

    Hereda de:
    - AuditModel: created_at, updated_at, created_by, updated_by
    - SoftDeleteModel: is_active, deleted_at, soft_delete(), restore()
    """

    # Proceso caracterizado
    area = models.OneToOneField(
        'organizacion.Area',
        on_delete=models.CASCADE,
        related_name='caracterizacion',
        verbose_name='Proceso / Área',
        help_text='Proceso o área que se caracteriza',
    )
    version = models.PositiveIntegerField(
        default=1,
        verbose_name='Versión',
        help_text='Versión de la ficha de caracterización',
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CARACTERIZACION_CHOICES,
        default='BORRADOR',
        verbose_name='Estado',
    )

    # Información general del proceso
    objetivo = models.TextField(
        blank=True,
        verbose_name='Objetivo del Proceso',
        help_text='Propósito y razón de ser del proceso',
    )
    alcance = models.TextField(
        blank=True,
        verbose_name='Alcance',
        help_text='Límites del proceso: dónde inicia y dónde termina',
    )
    lider_proceso = models.ForeignKey(
        'core.Cargo',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='procesos_liderados',
        verbose_name='Líder del Proceso',
        help_text='Cargo responsable del proceso',
    )

    # SIPOC (JSONField arrays)
    proveedores = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Proveedores (S)',
        help_text='[{"nombre": "...", "tipo": "interno|externo"}]',
    )
    entradas = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Entradas (I)',
        help_text='[{"descripcion": "...", "origen": "..."}]',
    )
    actividades_clave = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Actividades Clave (P)',
        help_text='[{"descripcion": "...", "responsable": "..."}]',
    )
    salidas = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Salidas (O)',
        help_text='[{"descripcion": "...", "destino": "..."}]',
    )
    clientes = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Clientes (C)',
        help_text='[{"nombre": "...", "tipo": "interno|externo"}]',
    )

    # Recursos
    recursos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Recursos',
        help_text='[{"tipo": "humano|tecnologico|fisico|financiero", "descripcion": "..."}]',
    )

    # Referencias cruzadas (informacionales, no FKs)
    indicadores_vinculados = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Indicadores Vinculados',
        help_text='[{"nombre": "...", "formula": "...", "meta": "..."}]',
    )
    riesgos_asociados = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Riesgos Asociados',
        help_text='[{"descripcion": "...", "nivel": "alto|medio|bajo", "tratamiento": "..."}]',
    )
    documentos_referencia = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Documentos de Referencia',
        help_text='[{"codigo": "...", "nombre": "..."}]',
    )

    # Requisitos normativos
    requisitos_normativos = models.TextField(
        blank=True,
        verbose_name='Requisitos Normativos',
        help_text='Requisitos ISO, legales u otros aplicables al proceso',
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
    )

    class Meta:
        db_table = 'organizacion_caracterizacion_proceso'
        verbose_name = 'Caracterización de Proceso'
        verbose_name_plural = 'Caracterizaciones de Procesos'
        ordering = ['area__name']
        indexes = [
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f'Caracterización: {self.area.name} (v{self.version})'


# ==============================================================================
# MODELOS HIJOS — SIPOC RELACIONAL (REORG-B5)
# ==============================================================================

TIPO_PROVEEDOR_CLIENTE_CHOICES = [
    ('interno', 'Interno'),
    ('externo', 'Externo'),
]

TIPO_RECURSO_CHOICES = [
    ('humano', 'Humano'),
    ('tecnologico', 'Tecnológico'),
    ('fisico', 'Físico'),
    ('financiero', 'Financiero'),
]

NIVEL_RIESGO_CHOICES = [
    ('alto', 'Alto'),
    ('medio', 'Medio'),
    ('bajo', 'Bajo'),
]


class CaracterizacionItemBase(models.Model):
    """Base abstracta para ítems de caracterización."""
    caracterizacion = models.ForeignKey(
        CaracterizacionProceso,
        on_delete=models.CASCADE,
        related_name='%(class)ss',
    )
    orden = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['orden', 'id']


class CaracterizacionProveedor(CaracterizacionItemBase):
    """Proveedor SIPOC (S) — puede vincularse a Parte Interesada."""
    nombre = models.CharField(max_length=255)
    tipo = models.CharField(max_length=10, choices=TIPO_PROVEEDOR_CLIENTE_CHOICES, default='externo')
    # Cross-module: PI en C1 (misma capa, IntegerField por convención)
    parte_interesada_id = models.PositiveBigIntegerField(
        null=True, blank=True, db_index=True,
        verbose_name='Parte Interesada',
    )
    parte_interesada_nombre = models.CharField(max_length=255, blank=True)

    class Meta(CaracterizacionItemBase.Meta):
        db_table = 'organizacion_caract_proveedor'
        verbose_name = 'Proveedor SIPOC'

    def __str__(self):
        return self.nombre


class CaracterizacionEntrada(CaracterizacionItemBase):
    """Entrada SIPOC (I)."""
    descripcion = models.CharField(max_length=500)
    origen = models.CharField(max_length=255, blank=True)

    class Meta(CaracterizacionItemBase.Meta):
        db_table = 'organizacion_caract_entrada'
        verbose_name = 'Entrada SIPOC'

    def __str__(self):
        return self.descripcion


class CaracterizacionActividad(CaracterizacionItemBase):
    """Actividad clave SIPOC (P) — puede vincularse a Cargo como responsable."""
    descripcion = models.CharField(max_length=500)
    responsable = models.CharField(max_length=255, blank=True)
    # Cross-module: Cargo en C0
    responsable_cargo_id = models.PositiveBigIntegerField(
        null=True, blank=True, db_index=True,
        verbose_name='Cargo Responsable',
    )
    responsable_cargo_nombre = models.CharField(max_length=255, blank=True)

    class Meta(CaracterizacionItemBase.Meta):
        db_table = 'organizacion_caract_actividad'
        verbose_name = 'Actividad SIPOC'

    def __str__(self):
        return self.descripcion


class CaracterizacionSalida(CaracterizacionItemBase):
    """Salida SIPOC (O)."""
    descripcion = models.CharField(max_length=500)
    destino = models.CharField(max_length=255, blank=True)

    class Meta(CaracterizacionItemBase.Meta):
        db_table = 'organizacion_caract_salida'
        verbose_name = 'Salida SIPOC'

    def __str__(self):
        return self.descripcion


class CaracterizacionCliente(CaracterizacionItemBase):
    """Cliente SIPOC (C) — puede vincularse a Parte Interesada."""
    nombre = models.CharField(max_length=255)
    tipo = models.CharField(max_length=10, choices=TIPO_PROVEEDOR_CLIENTE_CHOICES, default='externo')
    # Cross-module: PI en C1
    parte_interesada_id = models.PositiveBigIntegerField(
        null=True, blank=True, db_index=True,
        verbose_name='Parte Interesada',
    )
    parte_interesada_nombre = models.CharField(max_length=255, blank=True)

    class Meta(CaracterizacionItemBase.Meta):
        db_table = 'organizacion_caract_cliente'
        verbose_name = 'Cliente SIPOC'

    def __str__(self):
        return self.nombre


class CaracterizacionRecurso(CaracterizacionItemBase):
    """Recurso del proceso."""
    tipo = models.CharField(max_length=20, choices=TIPO_RECURSO_CHOICES, default='humano')
    descripcion = models.CharField(max_length=500)

    class Meta(CaracterizacionItemBase.Meta):
        db_table = 'organizacion_caract_recurso'
        verbose_name = 'Recurso'

    def __str__(self):
        return f'{self.get_tipo_display()}: {self.descripcion}'


class CaracterizacionIndicador(CaracterizacionItemBase):
    """Indicador vinculado al proceso (informacional)."""
    nombre = models.CharField(max_length=255)
    formula = models.CharField(max_length=500, blank=True)
    meta = models.CharField(max_length=255, blank=True)
    # Cross-module informacional: Analytics C3
    indicador_id = models.PositiveBigIntegerField(
        null=True, blank=True, db_index=True,
        verbose_name='Indicador (Analytics)',
    )

    class Meta(CaracterizacionItemBase.Meta):
        db_table = 'organizacion_caract_indicador'
        verbose_name = 'Indicador Vinculado'

    def __str__(self):
        return self.nombre


class CaracterizacionRiesgo(CaracterizacionItemBase):
    """Riesgo asociado al proceso (informacional)."""
    descripcion = models.CharField(max_length=500)
    nivel = models.CharField(max_length=10, choices=NIVEL_RIESGO_CHOICES, default='medio')
    tratamiento = models.CharField(max_length=500, blank=True)
    # Cross-module informacional: Motor Riesgos C2
    riesgo_id = models.PositiveBigIntegerField(
        null=True, blank=True, db_index=True,
        verbose_name='Riesgo (Motor Riesgos)',
    )

    class Meta(CaracterizacionItemBase.Meta):
        db_table = 'organizacion_caract_riesgo'
        verbose_name = 'Riesgo Asociado'

    def __str__(self):
        return self.descripcion


class CaracterizacionDocumento(CaracterizacionItemBase):
    """Documento de referencia (informacional)."""
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=255)
    # Cross-module informacional: Gestión Documental C2
    documento_id = models.PositiveBigIntegerField(
        null=True, blank=True, db_index=True,
        verbose_name='Documento (Gestión Documental)',
    )

    class Meta(CaracterizacionItemBase.Meta):
        db_table = 'organizacion_caract_documento'
        verbose_name = 'Documento de Referencia'

    def __str__(self):
        return f'{self.codigo} — {self.nombre}'
