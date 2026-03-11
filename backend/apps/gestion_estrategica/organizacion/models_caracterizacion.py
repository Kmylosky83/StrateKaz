"""
Modelo de Caracterización de Procesos
Sistema de Gestión StrateKaz

Ficha estructurada SIPOC por proceso/área:
Proveedores → Entradas → Actividades → Salidas → Clientes

Características:
- OneToOne con Area (cada proceso tiene una sola ficha)
- JSONField para arrays SIPOC y referencias cruzadas
- Sin dependencias cross-módulo (solo referencias informativas)

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
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='procesos_liderados',
        verbose_name='Líder del Proceso',
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
