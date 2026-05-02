"""
Modelos de Configuración Dinámica - Identidad Corporativa

Estos modelos reemplazan los CHOICES hardcodeados para cumplir
el principio "100% dinámico desde BD".

Modelos:
- EstadoPolitica: Estados del workflow de políticas
- TipoPolitica: Tipos de políticas configurables
- RolFirmante: Roles de firmantes en workflows
- EstadoFirma: Estados de firmas individuales
"""
from django.db import models
from django.core.validators import RegexValidator
from apps.core.base_models import TimestampedModel, OrderedModel


class EstadoPolitica(TimestampedModel, OrderedModel):
    """
    Estados dinámicos para el workflow de políticas.

    Reemplaza POLICY_STATUS_CHOICES hardcodeado.
    Permite configurar transiciones, colores y comportamientos.

    Estados por defecto:
    - BORRADOR: Política en edición
    - EN_REVISION: En proceso de firma
    - FIRMADO: Firmas completadas, listo para Gestor Documental
    - VIGENTE: Publicada y activa
    - OBSOLETO: Reemplazada por nueva versión
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        validators=[RegexValidator(
            regex=r'^[A-Z_]+$',
            message='El código debe contener solo mayúsculas y guiones bajos'
        )],
        verbose_name='Código',
        help_text='Código único del estado (BORRADOR, EN_REVISION, etc.)'
    )
    label = models.CharField(
        max_length=50,
        verbose_name='Etiqueta',
        help_text='Nombre visible en UI'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción del estado para usuarios'
    )

    # Configuración de UI
    color = models.CharField(
        max_length=20,
        default='gray',
        verbose_name='Color',
        help_text='Color Tailwind (gray, green, yellow, red, blue, purple, orange)'
    )
    bg_color = models.CharField(
        max_length=30,
        default='bg-gray-100',
        verbose_name='Color de fondo',
        help_text='Clase Tailwind para fondo (bg-gray-100, bg-green-100, etc.)'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        default='FileText',
        verbose_name='Icono',
        help_text='Nombre del icono Lucide (FileEdit, Clock, CheckCircle, etc.)'
    )

    # Comportamiento del workflow
    es_editable = models.BooleanField(
        default=True,
        verbose_name='¿Es editable?',
        help_text='Si la política puede editarse en este estado'
    )
    es_estado_inicial = models.BooleanField(
        default=False,
        verbose_name='¿Es estado inicial?',
        help_text='Si es el estado por defecto al crear políticas'
    )
    es_estado_final = models.BooleanField(
        default=False,
        verbose_name='¿Es estado final?',
        help_text='Si es un estado terminal (VIGENTE, OBSOLETO)'
    )
    permite_firma = models.BooleanField(
        default=False,
        verbose_name='¿Permite firma?',
        help_text='Si se pueden iniciar procesos de firma en este estado'
    )
    requiere_firma_completa = models.BooleanField(
        default=False,
        verbose_name='¿Requiere firma completa?',
        help_text='Si requiere todas las firmas para avanzar'
    )

    # Transiciones permitidas (JSON array de códigos)
    transiciones_permitidas = models.JSONField(
        default=list,
        verbose_name='Transiciones Permitidas',
        help_text='Lista de códigos de estados a los que puede transicionar ["EN_REVISION", "OBSOLETO"]'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    class Meta:
        db_table = 'identidad_estado_politica'
        verbose_name = 'Estado de Política'
        verbose_name_plural = 'Estados de Política'
        ordering = ['orden', 'code']

    def __str__(self):
        return f"{self.label} ({self.code})"

    @classmethod
    def get_choices(cls):
        """
        Retorna formato compatible con Django choices.
        Útil para migraciones y validaciones.
        """
        return list(
            cls.objects.filter(is_active=True)
            .order_by('orden')
            .values_list('code', 'label')
        )

    @classmethod
    def get_initial_state(cls):
        """Retorna el estado inicial por defecto."""
        return cls.objects.filter(es_estado_inicial=True, is_active=True).first()

    @classmethod
    def get_by_code(cls, code: str):
        """Obtiene estado por código."""
        return cls.objects.filter(code=code, is_active=True).first()


class TipoPolitica(TimestampedModel, OrderedModel):
    """
    Tipos de políticas configurables.

    Permite crear diferentes tipos de políticas con configuraciones
    específicas de workflow, normas ISO aplicables y firmas requeridas.

    Tipos por defecto:
    - INTEGRAL: Política integral del sistema
    - SST: Política de Seguridad y Salud en el Trabajo
    - CALIDAD: Política de Calidad
    - AMBIENTAL: Política Ambiental
    - SEGURIDAD_INFO: Política de Seguridad de la Información
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        validators=[RegexValidator(
            regex=r'^[A-Z_]+$',
            message='El código debe contener solo mayúsculas y guiones bajos'
        )],
        verbose_name='Código',
        help_text='Código único del tipo (SST, CALIDAD, AMBIENTAL, etc.)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del tipo de política'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Prefijo para códigos de documento
    prefijo_codigo = models.CharField(
        max_length=10,
        default='POL',
        verbose_name='Prefijo de código',
        help_text='Prefijo para códigos en Gestor Documental (POL-SST-001)'
    )

    # Configuración de workflow
    requiere_firma = models.BooleanField(
        default=True,
        verbose_name='¿Requiere firma?',
        help_text='Si las políticas de este tipo requieren firma digital'
    )
    # Fase 0.3.4: flujo_firma_default eliminado
    # Cuando workflow_engine.firma_digital tenga migraciones, agregar:
    # flujo_firma_default = models.ForeignKey(
    #     'infra_firma_digital.ConfiguracionFlujoFirma',
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='tipos_politica_default',
    #     verbose_name='Flujo de firma por defecto'
    # )

    # Normas ISO asociadas por defecto
    normas_iso_default = models.ManyToManyField(
        'configuracion.NormaISO',
        blank=True,
        related_name='tipos_politica_default',
        verbose_name='Normas ISO por defecto',
        help_text='Normas ISO que aplican por defecto a este tipo'
    )

    # Configuración de UI
    icon = models.CharField(
        max_length=50,
        default='FileText',
        verbose_name='Icono',
        help_text='Nombre del icono Lucide'
    )
    color = models.CharField(
        max_length=20,
        default='blue',
        verbose_name='Color',
        help_text='Color para badges y UI'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    class Meta:
        db_table = 'identidad_tipo_politica'
        verbose_name = 'Tipo de Política'
        verbose_name_plural = 'Tipos de Política'
        ordering = ['orden', 'name']

    def __str__(self):
        return self.name


class RolFirmante(TimestampedModel, OrderedModel):
    """
    Roles de firmantes en workflows de firma.

    Reemplaza ROL_FIRMANTE_CHOICES hardcodeado.
    Define los roles disponibles para procesos de firma.

    Roles por defecto:
    - ELABORO: Quien elabora el documento
    - REVISO_TECNICO: Revisión técnica
    - REVISO_JURIDICO: Revisión jurídica
    - APROBO_DIRECTOR: Aprobación de director de área
    - APROBO_GERENTE: Aprobación de gerente
    - APROBO_REPRESENTANTE_LEGAL: Aprobación del representante legal
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        validators=[RegexValidator(
            regex=r'^[A-Z_]+$',
            message='El código debe contener solo mayúsculas y guiones bajos'
        )],
        verbose_name='Código',
        help_text='Código único del rol'
    )
    label = models.CharField(
        max_length=50,
        verbose_name='Etiqueta',
        help_text='Nombre visible en UI'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Tipo de firma que representa
    tipo_firma_documental = models.CharField(
        max_length=20,
        default='VALIDACION',
        verbose_name='Tipo en Gestor Documental',
        help_text='Mapeo al tipo de firma en Sistema Documental (ELABORACION, REVISION, APROBACION)'
    )

    # Configuración
    es_obligatorio = models.BooleanField(
        default=True,
        verbose_name='¿Es obligatorio?',
        help_text='Si este rol es requerido en todos los flujos'
    )
    puede_delegar = models.BooleanField(
        default=False,
        verbose_name='¿Puede delegar?',
        help_text='Si el firmante puede delegar a otro usuario'
    )

    # UI
    icon = models.CharField(
        max_length=50,
        default='User',
        verbose_name='Icono'
    )
    color = models.CharField(
        max_length=20,
        default='gray',
        verbose_name='Color'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    class Meta:
        db_table = 'identidad_rol_firmante'
        verbose_name = 'Rol de Firmante'
        verbose_name_plural = 'Roles de Firmante'
        ordering = ['orden', 'code']

    def __str__(self):
        return self.label

    @classmethod
    def get_choices(cls):
        """Retorna formato compatible con Django choices."""
        return list(
            cls.objects.filter(is_active=True)
            .order_by('orden')
            .values_list('code', 'label')
        )


class EstadoFirma(TimestampedModel, OrderedModel):
    """
    Estados de firmas individuales.

    Reemplaza FIRMA_STATUS_CHOICES hardcodeado.

    Estados por defecto:
    - PENDIENTE: Esperando firma
    - FIRMADO: Firmado exitosamente
    - RECHAZADO: Rechazado por el firmante
    - DELEGADO: Delegado a otro usuario
    - VENCIDO: Tiempo de firma expirado
    - REVOCADO: Firma revocada
    """
    code = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        validators=[RegexValidator(
            regex=r'^[A-Z_]+$',
            message='El código debe contener solo mayúsculas y guiones bajos'
        )],
        verbose_name='Código'
    )
    label = models.CharField(
        max_length=50,
        verbose_name='Etiqueta'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # UI
    color = models.CharField(
        max_length=20,
        default='gray',
        verbose_name='Color'
    )
    bg_color = models.CharField(
        max_length=30,
        default='bg-gray-100',
        verbose_name='Color de fondo'
    )
    icon = models.CharField(
        max_length=50,
        default='Clock',
        verbose_name='Icono'
    )

    # Comportamiento
    es_estado_final = models.BooleanField(
        default=False,
        verbose_name='¿Es estado final?',
        help_text='Si la firma no puede cambiar de este estado'
    )
    es_positivo = models.BooleanField(
        default=False,
        verbose_name='¿Es positivo?',
        help_text='Si este estado representa una acción exitosa (FIRMADO)'
    )
    es_negativo = models.BooleanField(
        default=False,
        verbose_name='¿Es negativo?',
        help_text='Si este estado representa un rechazo (RECHAZADO, VENCIDO)'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    class Meta:
        db_table = 'identidad_estado_firma'
        verbose_name = 'Estado de Firma'
        verbose_name_plural = 'Estados de Firma'
        ordering = ['orden', 'code']

    def __str__(self):
        return self.label

    @classmethod
    def get_choices(cls):
        """Retorna formato compatible con Django choices."""
        return list(
            cls.objects.filter(is_active=True)
            .order_by('orden')
            .values_list('code', 'label')
        )
