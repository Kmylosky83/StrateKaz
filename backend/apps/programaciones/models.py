"""
Modelos del módulo Programaciones - Sistema de Gestión Grasas y Huesos del Norte
"""
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q
from apps.core.models import User
from apps.ecoaliados.models import Ecoaliado


class Programacion(models.Model):
    """
    Modelo Programacion - Programación de recolección en ecoaliados

    Flujo de estados:
    1. PROGRAMADA: Creada por comercial
    2. CONFIRMADA: Líder logística asigna recolector
    3. EN_RUTA: Fecha llegó o recolector inicia
    4. COMPLETADA: Recolector completó la recolección
    5. CANCELADA: No se pudo realizar
    6. REPROGRAMADA: Se creó nueva desde cancelada
    """

    TIPO_CHOICES = [
        ('PROGRAMADA', 'Programada'),
        ('INMEDIATA', 'Inmediata'),
    ]

    ESTADO_CHOICES = [
        ('PROGRAMADA', 'Programada'),
        ('CONFIRMADA', 'Confirmada'),
        ('EN_RUTA', 'En Ruta'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
        ('REPROGRAMADA', 'Reprogramada'),
    ]

    # ============ RELACIONES ============
    ecoaliado = models.ForeignKey(
        Ecoaliado,
        on_delete=models.PROTECT,
        related_name='programaciones',
        verbose_name='Ecoaliado',
        help_text='Ecoaliado donde se realizará la recolección'
    )
    programado_por = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='programaciones_creadas',
        verbose_name='Programado por',
        help_text='Usuario que creó la programación (comercial)'
    )

    # ============ TIPO DE PROGRAMACIÓN ============
    tipo_programacion = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default='PROGRAMADA',
        verbose_name='Tipo de programación',
        help_text='Tipo de programación: regular o inmediata'
    )

    # ============ DATOS DE PROGRAMACIÓN INICIAL ============
    fecha_programada = models.DateField(
        verbose_name='Fecha programada',
        help_text='Fecha programada para la recolección'
    )
    cantidad_estimada_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Cantidad estimada (kg)',
        help_text='Cantidad estimada a recolectar en kilogramos'
    )
    observaciones_comercial = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones del comercial',
        help_text='Notas adicionales del comercial'
    )

    # ============ ASIGNACIÓN POR LOGÍSTICA ============
    recolector_asignado = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='programaciones_asignadas',
        limit_choices_to={
            'cargo__code': 'recolector_econorte',
            'is_active': True
        },
        verbose_name='Recolector asignado',
        help_text='Recolector asignado a esta programación'
    )
    asignado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='programaciones_asignadas_por',
        verbose_name='Asignado por',
        help_text='Usuario que asignó el recolector (líder logística)'
    )
    fecha_asignacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de asignación',
        help_text='Fecha y hora en que se asignó el recolector'
    )
    observaciones_logistica = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones de logística',
        help_text='Notas adicionales del líder logística'
    )

    # ============ ESTADOS ============
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PROGRAMADA',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado actual de la programación'
    )
    motivo_cancelacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de cancelación',
        help_text='Razón por la cual se canceló la programación'
    )

    # Relación con reprogramación
    programacion_origen = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reprogramaciones',
        verbose_name='Programación origen',
        help_text='Programación desde la cual se reprogramó'
    )

    # ============ AUDITORÍA ============
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='programaciones_creadas_audit',
        verbose_name='Creado por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de eliminación',
        help_text='Fecha de eliminación lógica (soft delete)'
    )

    class Meta:
        db_table = 'programaciones_programacion'
        verbose_name = 'Programación'
        verbose_name_plural = 'Programaciones'
        ordering = ['-fecha_programada', '-created_at']
        indexes = [
            models.Index(fields=['ecoaliado', 'fecha_programada']),
            models.Index(fields=['programado_por', 'estado']),
            models.Index(fields=['recolector_asignado', 'estado']),
            models.Index(fields=['estado', 'fecha_programada']),
            models.Index(fields=['deleted_at']),
        ]
        # Constraint: Una programación por ecoaliado por día
        constraints = [
            models.UniqueConstraint(
                fields=['ecoaliado', 'fecha_programada'],
                condition=Q(deleted_at__isnull=True) & ~Q(estado='CANCELADA') & ~Q(estado='REPROGRAMADA'),
                name='unique_programacion_ecoaliado_fecha'
            )
        ]

    def __str__(self):
        return f"Programación {self.ecoaliado.codigo} - {self.fecha_programada} ({self.get_estado_display()})"

    @property
    def is_deleted(self):
        """Verifica si la programación está eliminada lógicamente"""
        return self.deleted_at is not None

    @property
    def esta_vencida(self):
        """
        Determina si la programación está vencida:
        - Fecha programada ya pasó (fecha_programada < hoy)
        - Estado NO es terminal (COMPLETADA, CANCELADA, REPROGRAMADA)

        Una programación vencida es aquella que debió ejecutarse
        pero no se completó a tiempo, independientemente de si tiene
        recolector asignado o no.
        """
        from datetime import date
        # Estados terminales no pueden estar vencidos
        estados_terminales = ['COMPLETADA', 'CANCELADA', 'REPROGRAMADA']
        if self.estado in estados_terminales:
            return False
        # Si la fecha ya pasó y no está en estado terminal, está vencida
        return self.fecha_programada < date.today()

    @property
    def puede_asignar_recolector(self):
        """Verifica si se puede asignar un recolector"""
        return self.estado == 'PROGRAMADA' and not self.is_deleted

    @property
    def puede_confirmar(self):
        """Verifica si se puede confirmar (cambiar a CONFIRMADA)"""
        return (
            self.estado == 'PROGRAMADA'
            and self.recolector_asignado is not None
            and not self.is_deleted
        )

    @property
    def puede_iniciar_ruta(self):
        """Verifica si se puede iniciar la ruta (cambiar a EN_RUTA)"""
        return (
            self.estado == 'CONFIRMADA'
            and self.recolector_asignado is not None
            and not self.is_deleted
        )

    @property
    def puede_completar(self):
        """
        Verifica si se puede completar.

        NO se puede completar si:
        - No está en estado EN_RUTA
        - Está eliminada
        - Está VENCIDA (la fecha ya pasó)

        Si una programación está vencida, debe ser reprogramada, no completada.
        """
        if self.is_deleted:
            return False
        if self.estado != 'EN_RUTA':
            return False
        # Si está vencida, no se puede completar - debe reprogramarse
        if self.esta_vencida:
            return False
        return True

    @property
    def puede_cancelar(self):
        """Verifica si se puede cancelar"""
        return self.estado in ['PROGRAMADA', 'CONFIRMADA', 'EN_RUTA'] and not self.is_deleted

    @property
    def puede_reprogramar(self):
        """
        Verifica si se puede reprogramar.

        Se puede reprogramar si:
        - Estado es CANCELADA (reprogramación tradicional)
        - Está VENCIDA (fecha pasó sin completarse, con o sin recolector)
        - Estado es PROGRAMADA, CONFIRMADA o EN_RUTA (antes de completar)

        NO se puede reprogramar si:
        - Está eliminada
        - Estado es COMPLETADA o REPROGRAMADA (estados terminales)
        """
        if self.is_deleted:
            return False
        # Estados terminales no se pueden reprogramar
        if self.estado in ['COMPLETADA', 'REPROGRAMADA']:
            return False
        # Si está vencida, SIEMPRE se puede reprogramar
        if self.esta_vencida:
            return True
        # Estados que permiten reprogramación normal
        return self.estado in ['PROGRAMADA', 'CONFIRMADA', 'CANCELADA', 'EN_RUTA']

    def puede_cambiar_estado(self, nuevo_estado, usuario):
        """
        Valida si el usuario puede cambiar el estado según las reglas de negocio

        Args:
            nuevo_estado (str): Estado al que se quiere cambiar
            usuario (User): Usuario que intenta el cambio

        Returns:
            tuple: (bool, str) - (puede_cambiar, mensaje_error)
        """
        if self.is_deleted:
            return False, "No se puede cambiar el estado de una programación eliminada"

        # Validar transiciones de estado
        transiciones_validas = {
            'PROGRAMADA': ['CONFIRMADA', 'CANCELADA'],
            'CONFIRMADA': ['EN_RUTA', 'CANCELADA'],
            'EN_RUTA': ['COMPLETADA', 'CANCELADA'],
            'CANCELADA': ['REPROGRAMADA'],
        }

        if nuevo_estado not in transiciones_validas.get(self.estado, []):
            return False, f"No se puede cambiar de {self.get_estado_display()} a {dict(self.ESTADO_CHOICES)[nuevo_estado]}"

        # Validar permisos por rol
        if not usuario.cargo:
            return False, "El usuario no tiene cargo asignado"

        cargo_code = usuario.cargo.code

        # CONFIRMADA: Solo líder logística
        if nuevo_estado == 'CONFIRMADA':
            if cargo_code not in ['lider_logistica_econorte', 'gerente', 'admin']:
                return False, "Solo el Líder de Logística puede confirmar programaciones"
            if not self.recolector_asignado:
                return False, "Debe asignar un recolector antes de confirmar"

        # EN_RUTA: Recolector asignado o líder logística
        if nuevo_estado == 'EN_RUTA':
            if cargo_code == 'recolector_econorte':
                if self.recolector_asignado != usuario:
                    return False, "Solo el recolector asignado puede iniciar la ruta"
            elif cargo_code not in ['lider_logistica_econorte', 'gerente', 'admin']:
                return False, "Solo el recolector asignado o Líder de Logística puede iniciar la ruta"

        # COMPLETADA/CANCELADA desde EN_RUTA: Solo recolector asignado o líder logística
        if self.estado == 'EN_RUTA' and nuevo_estado in ['COMPLETADA', 'CANCELADA']:
            if cargo_code == 'recolector_econorte':
                if self.recolector_asignado != usuario:
                    return False, "Solo el recolector asignado puede completar o cancelar"
            elif cargo_code not in ['lider_logistica_econorte', 'gerente', 'admin']:
                return False, "Solo el recolector asignado o Líder de Logística puede completar o cancelar"

        # CANCELADA: Líder comercial, líder logística o superior
        if nuevo_estado == 'CANCELADA':
            if cargo_code not in ['lider_com_econorte', 'lider_logistica_econorte', 'recolector_econorte', 'gerente', 'admin']:
                return False, "No tiene permisos para cancelar programaciones"

        # REPROGRAMADA: Solo líder logística o superior
        if nuevo_estado == 'REPROGRAMADA':
            if cargo_code not in ['lider_logistica_econorte', 'gerente', 'admin']:
                return False, "Solo el Líder de Logística puede reprogramar"

        return True, ""

    def soft_delete(self):
        """Eliminación lógica de la programación"""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        """Restaura una programación eliminada lógicamente"""
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def clean(self):
        """Validaciones personalizadas"""
        # Validar que el ecoaliado esté activo
        if self.ecoaliado and not self.ecoaliado.is_active:
            raise ValidationError({
                'ecoaliado': 'El ecoaliado debe estar activo'
            })

        # Validar cantidad estimada
        if self.cantidad_estimada_kg and self.cantidad_estimada_kg <= 0:
            raise ValidationError({
                'cantidad_estimada_kg': 'La cantidad estimada debe ser mayor a 0'
            })

        # Validar fecha programada (debe ser futura al crear)
        if not self.pk and self.fecha_programada:
            if self.fecha_programada < timezone.now().date():
                raise ValidationError({
                    'fecha_programada': 'La fecha programada debe ser futura'
                })

        # Validar que no exista otra programación activa para el mismo ecoaliado en la misma fecha
        if self.ecoaliado and self.fecha_programada:
            conflictos = Programacion.objects.filter(
                ecoaliado=self.ecoaliado,
                fecha_programada=self.fecha_programada,
                deleted_at__isnull=True
            ).exclude(
                Q(estado__in=['CANCELADA', 'REPROGRAMADA']) | Q(pk=self.pk)
            )

            if conflictos.exists():
                raise ValidationError({
                    'fecha_programada': f'Ya existe una programación activa para {self.ecoaliado.razon_social} en esta fecha'
                })

        # Validar recolector si está asignado
        if self.recolector_asignado:
            if not self.recolector_asignado.cargo or self.recolector_asignado.cargo.code != 'recolector_econorte':
                raise ValidationError({
                    'recolector_asignado': 'El usuario debe tener cargo de Recolector Econorte'
                })
            if not self.recolector_asignado.is_active:
                raise ValidationError({
                    'recolector_asignado': 'El recolector debe estar activo'
                })

    def save(self, *args, **kwargs):
        # Ejecutar validaciones
        self.full_clean()
        super().save(*args, **kwargs)
