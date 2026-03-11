"""
Modelos de Organización - Tab de Dirección Estratégica

Secciones: organigrama, areas, consecutivos, unidades_medida
"""
from django.db import models
from django.conf import settings

from apps.core.base_models import (
    AuditModel,
    SoftDeleteModel,
    OrderedModel
)

# Re-exportar modelos migrados para backward compatibility
from .models_consecutivos import ConsecutivoConfig, CONSECUTIVOS_SISTEMA, TODOS_CONSECUTIVOS_SISTEMA
from .models_unidades import UnidadMedida, CATEGORIA_UNIDAD_CHOICES
from .models_caracterizacion import CaracterizacionProceso

__all__ = [
    'Area',
    'OrganigramaNodePosition',
    'ConsecutivoConfig',
    'CONSECUTIVOS_SISTEMA',
    'TODOS_CONSECUTIVOS_SISTEMA',
    'UnidadMedida',
    'CATEGORIA_UNIDAD_CHOICES',
    'CaracterizacionProceso',
]


class Area(AuditModel, SoftDeleteModel, OrderedModel):
    """
    Modelo para gestionar áreas/departamentos de la organización.

    Estructura jerárquica que permite definir la estructura organizacional
    con centros de costo y responsables asignados.

    Hereda de:
    - AuditModel: created_at, updated_at, created_by, updated_by
    - SoftDeleteModel: is_active, deleted_at, soft_delete(), restore()
    - OrderedModel: orden, move_up(), move_down()
    """
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Código',
        help_text='Código único del área (ej: GER, OPE, ADM)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del área o departamento'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción de las funciones del área'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Área Padre',
        help_text='Área superior en la jerarquía'
    )
    cost_center = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Centro de Costo',
        help_text='Código del centro de costo asociado'
    )
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_areas',
        verbose_name='Responsable',
        help_text='Usuario responsable del área'
    )
    icon = models.CharField(
        max_length=50,
        default='Building2',
        verbose_name='Icono',
        help_text='Nombre del icono Lucide (ej: Building2, Users, Briefcase)'
    )
    color = models.CharField(
        max_length=20,
        default='purple',
        verbose_name='Color',
        help_text='Color del área (ej: purple, blue, green, red, amber, gray)'
    )

    class Meta:
        db_table = 'organizacion_area'
        verbose_name = 'Área'
        verbose_name_plural = 'Áreas'
        ordering = ['orden', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
            models.Index(fields=['parent']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def children_count(self):
        """Cuenta el número de subáreas"""
        return self.children.filter(is_active=True).count()

    @property
    def full_path(self):
        """Retorna la ruta completa del área (ej: Gerencia > Operaciones > Logística)"""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return ' > '.join(path)

    @property
    def level(self):
        """Retorna el nivel de profundidad en la jerarquía (0 = raíz)"""
        level = 0
        parent = self.parent
        while parent:
            level += 1
            parent = parent.parent
        return level

    def get_all_children(self):
        """Retorna todas las subáreas recursivamente"""
        children = list(self.children.filter(is_active=True))
        for child in self.children.filter(is_active=True):
            children.extend(child.get_all_children())
        return children

    def clean(self):
        """Validaciones del modelo"""
        from django.core.exceptions import ValidationError

        # Evitar que un área sea su propio padre
        if self.parent and self.parent.id == self.id:
            raise ValidationError({'parent': 'Un área no puede ser su propio padre.'})

        # Evitar ciclos en la jerarquía
        if self.parent:
            parent = self.parent
            while parent:
                if parent.id == self.id:
                    raise ValidationError({'parent': 'Se detectó un ciclo en la jerarquía de áreas.'})
                parent = parent.parent


class OrganigramaNodePosition(models.Model):
    """
    Posiciones personalizadas de nodos en el organigrama.
    Permite persistir la ubicación de cada nodo cuando el usuario lo arrastra.
    """
    NODE_TYPE_CHOICES = [
        ('cargo', 'Cargo'),
        ('area', 'Área'),
    ]

    node_type = models.CharField(max_length=10, choices=NODE_TYPE_CHOICES)
    node_id = models.IntegerField()
    view_mode = models.CharField(max_length=10)
    direction = models.CharField(max_length=2, default='TB')
    x = models.FloatField()
    y = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'organizacion_node_position'
        verbose_name = 'Posición de Nodo'
        verbose_name_plural = 'Posiciones de Nodos'
        unique_together = ['node_type', 'node_id', 'view_mode', 'direction']

    def __str__(self):
        return f"{self.node_type}-{self.node_id} ({self.view_mode}/{self.direction})"
