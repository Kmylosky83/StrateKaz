"""
Datos Maestros Compartidos — Core (C0)

Catálogos geográficos y de documentos que son usados por múltiples módulos C2.
Migrados desde supply_chain.gestion_proveedores para evitar dependencias cruzadas.

Mantienen las mismas db_table para compatibilidad con datos existentes.
"""
from django.db import models


class TipoDocumentoIdentidad(models.Model):
    """
    Tipo de documento de identidad (dinámico).
    Ejemplos: CC, CE, NIT, PASSPORT
    """
    codigo = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_tipo_documento_identidad'
        verbose_name = 'Tipo de Documento de Identidad'
        verbose_name_plural = 'Tipos de Documento de Identidad'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Departamento(models.Model):
    """
    Departamentos de Colombia (dinámico).
    Catálogo de departamentos para geolocalización.
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código del departamento (ej: ANTIOQUIA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    codigo_dane = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name='Código DANE'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_departamento'
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class Ciudad(models.Model):
    """
    Ciudades de Colombia (dinámico).
    """
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.PROTECT,
        related_name='ciudades',
        verbose_name='Departamento'
    )
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    codigo_dane = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name='Código DANE'
    )
    es_capital = models.BooleanField(default=False)
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_ciudad'
        verbose_name = 'Ciudad'
        verbose_name_plural = 'Ciudades'
        ordering = ['departamento__nombre', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.departamento.nombre})"
