"""
Biblioteca Maestra — Plantillas compartidas multi-tenant (Fase 8).
Vive en schema public (SHARED_APPS). Los tenants copian plantillas
a su PlantillaDocumento local via endpoint importar-a-tenant.
"""

from django.db import models
from utils.models import SharedModel


class BibliotecaPlantilla(SharedModel):
    """
    Plantilla maestra disponible para todos los tenants.
    Schema: public (accesible desde cualquier tenant).
    """

    CATEGORIA_CHOICES = [
        ('PROCEDIMIENTO', 'Procedimiento'),
        ('FORMATO', 'Formato'),
        ('MANUAL', 'Manual'),
        ('POLITICA', 'Política'),
        ('INSTRUCTIVO', 'Instructivo'),
    ]

    INDUSTRIA_CHOICES = [
        ('GENERAL', 'General (todas las industrias)'),
        ('ALIMENTOS', 'Alimentos y Bebidas'),
        ('CONSTRUCCION', 'Construcción'),
        ('MANUFACTURA', 'Manufactura'),
        ('SERVICIOS', 'Servicios'),
        ('SALUD', 'Salud'),
        ('TECNOLOGIA', 'Tecnología'),
    ]

    codigo = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Código',
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Plantilla',
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
    )
    tipo_documento_codigo = models.CharField(
        max_length=20,
        verbose_name='Código Tipo Documento',
        help_text='Código del TipoDocumento (PR, IN, FT, MA, POL)',
    )
    contenido_plantilla = models.TextField(
        blank=True,
        verbose_name='Contenido de la Plantilla',
        help_text='HTML/Markdown con {{variables}} para sustitución',
    )
    variables_disponibles = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Variables Disponibles',
    )
    estilos_css = models.TextField(
        blank=True,
        verbose_name='Estilos CSS',
    )
    encabezado = models.TextField(
        blank=True,
        verbose_name='Encabezado',
    )
    pie_pagina = models.TextField(
        blank=True,
        verbose_name='Pie de Página',
    )
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIA_CHOICES,
        default='PROCEDIMIENTO',
        db_index=True,
        verbose_name='Categoría',
    )
    industria = models.CharField(
        max_length=20,
        choices=INDUSTRIA_CHOICES,
        default='GENERAL',
        db_index=True,
        verbose_name='Industria',
    )
    norma_iso_codigo = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Norma ISO',
        help_text='ISO9001, ISO14001, ISO45001, ISO27001',
    )
    version = models.CharField(
        max_length=20,
        default='1.0',
        verbose_name='Versión',
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activa',
    )
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden',
    )

    class Meta:
        db_table = 'shared_biblioteca_plantilla'
        verbose_name = 'Plantilla de Biblioteca'
        verbose_name_plural = 'Plantillas de Biblioteca'
        ordering = ['categoria', 'orden', 'nombre']

    def __str__(self):
        return f'{self.codigo} - {self.nombre} ({self.industria})'
