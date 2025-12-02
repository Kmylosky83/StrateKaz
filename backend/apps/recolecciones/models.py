# -*- coding: utf-8 -*-
"""
Modelos del modulo Recolecciones - Sistema de Gestion Grasas y Huesos del Norte

Este modulo registra las recolecciones completadas asociadas a programaciones.
Cuando un recolector completa una programacion, se crea un registro de Recoleccion
con los datos reales de la operacion.
"""
from django.db import models, transaction, IntegrityError
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
import time
from apps.core.models import User
from apps.ecoaliados.models import Ecoaliado
from apps.programaciones.models import Programacion


class Recoleccion(models.Model):
    """
    Modelo Recoleccion - Registro de recoleccion completada

    Se crea cuando el recolector registra una recoleccion desde una programacion
    en estado EN_RUTA. Contiene los datos reales de la operacion:
    - Cantidad recolectada (kg)
    - Precio por kg (tomado del ecoaliado al momento de la recoleccion)
    - Valor total pagado
    - Observaciones del recolector
    """

    # ============ RELACIONES ============
    programacion = models.OneToOneField(
        Programacion,
        on_delete=models.PROTECT,
        related_name='recoleccion',
        verbose_name='Programacion',
        help_text='Programacion asociada a esta recoleccion'
    )
    ecoaliado = models.ForeignKey(
        Ecoaliado,
        on_delete=models.PROTECT,
        related_name='recolecciones',
        verbose_name='Ecoaliado',
        help_text='Ecoaliado donde se realizo la recoleccion'
    )
    recolector = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='recolecciones_realizadas',
        verbose_name='Recolector',
        help_text='Recolector que realizo la recoleccion'
    )

    # ============ DATOS DE LA RECOLECCION ============
    fecha_recoleccion = models.DateTimeField(
        verbose_name='Fecha de recoleccion',
        help_text='Fecha y hora en que se realizo la recoleccion'
    )
    cantidad_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Cantidad recolectada (kg)',
        help_text='Cantidad real recolectada en kilogramos'
    )
    precio_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio por kg (COP)',
        help_text='Precio por kilogramo al momento de la recoleccion'
    )
    valor_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Valor total pagado (COP)',
        help_text='Valor total pagado = cantidad_kg * precio_kg'
    )

    # ============ INFORMACION ADICIONAL ============
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Notas del recolector sobre la recoleccion'
    )

    # ============ CODIGO DE VOUCHER ============
    codigo_voucher = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Codigo de voucher',
        help_text='Codigo unico del voucher generado (formato: REC-YYYYMMDD-XXXX)'
    )

    # ============ AUDITORIA ============
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recolecciones_registradas',
        verbose_name='Registrado por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de registro'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualizacion'
    )

    # ============ SOFT DELETE ============
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de eliminacion',
        help_text='Fecha de eliminacion logica (soft delete)'
    )

    class Meta:
        db_table = 'recolecciones_recoleccion'
        verbose_name = 'Recoleccion'
        verbose_name_plural = 'Recolecciones'
        ordering = ['-fecha_recoleccion', '-created_at']
        indexes = [
            models.Index(fields=['ecoaliado', 'fecha_recoleccion']),
            models.Index(fields=['recolector', 'fecha_recoleccion']),
            models.Index(fields=['codigo_voucher']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"Recoleccion {self.codigo_voucher} - {self.ecoaliado.codigo} ({self.cantidad_kg} kg)"

    @property
    def is_deleted(self):
        """Verifica si la recoleccion esta eliminada logicamente"""
        return self.deleted_at is not None

    @classmethod
    def generar_codigo_voucher(cls, max_retries=5):
        """
        Genera un codigo unico para el voucher de forma thread-safe
        Formato: REC-YYYYMMDD-XXXX (ej: REC-20241125-0001)

        Implementa retry logic para manejar race conditions cuando
        multiples recolecciones se crean simultaneamente.

        Args:
            max_retries: Numero maximo de intentos (default: 5)

        Returns:
            str: Codigo de voucher unico

        Raises:
            IntegrityError: Si no se pudo generar un codigo unico despues de max_retries
        """
        from datetime import date
        hoy = date.today()
        prefijo = f"REC-{hoy.strftime('%Y%m%d')}-"

        for attempt in range(max_retries):
            try:
                # Usar transaccion atomica con bloqueo
                with transaction.atomic():
                    # Bloquear la tabla para lectura exclusiva del ultimo registro
                    # Esto previene que otra transaccion concurrente lea el mismo valor
                    ultimo = cls.objects.select_for_update().filter(
                        codigo_voucher__startswith=prefijo
                    ).order_by('-codigo_voucher').first()

                    if ultimo:
                        # Extraer el numero y sumarle 1
                        try:
                            numero = int(ultimo.codigo_voucher.split('-')[-1]) + 1
                        except (ValueError, IndexError):
                            numero = 1
                    else:
                        numero = 1

                    codigo = f"{prefijo}{numero:04d}"

                    # Verificar que no exista (doble verificacion)
                    if not cls.objects.filter(codigo_voucher=codigo).exists():
                        return codigo
                    else:
                        # Si existe, incrementar y reintentar
                        numero += 1
                        codigo = f"{prefijo}{numero:04d}"

                        # Verificar de nuevo
                        if not cls.objects.filter(codigo_voucher=codigo).exists():
                            return codigo

            except IntegrityError:
                # Si hay conflicto, esperar un tiempo aleatorio y reintentar
                if attempt < max_retries - 1:
                    # Espera exponencial con jitter: 0.01s, 0.02s, 0.04s, 0.08s, 0.16s
                    wait_time = (2 ** attempt) * 0.01
                    time.sleep(wait_time)
                    continue
                else:
                    raise

        # Si llegamos aqui, todos los intentos fallaron
        raise IntegrityError(
            f"No se pudo generar un codigo de voucher unico despues de {max_retries} intentos"
        )

    def calcular_valor_total(self):
        """Calcula el valor total basado en cantidad y precio"""
        if self.cantidad_kg and self.precio_kg:
            return Decimal(str(self.cantidad_kg)) * Decimal(str(self.precio_kg))
        return Decimal('0')

    def clean(self):
        """Validaciones personalizadas"""
        # Validar cantidad
        if self.cantidad_kg is not None and self.cantidad_kg <= 0:
            raise ValidationError({
                'cantidad_kg': 'La cantidad debe ser mayor a 0'
            })

        # Validar precio
        if self.precio_kg is not None and self.precio_kg <= 0:
            raise ValidationError({
                'precio_kg': 'El precio debe ser mayor a 0'
            })

        # Validar que la programacion este en estado EN_RUTA o COMPLETADA
        if self.programacion:
            if self.programacion.estado not in ['EN_RUTA', 'COMPLETADA']:
                raise ValidationError({
                    'programacion': f'La programacion debe estar EN_RUTA para registrar recoleccion. Estado actual: {self.programacion.get_estado_display()}'
                })

        # Validar que el recolector sea el asignado a la programacion
        if self.programacion and self.recolector:
            if self.programacion.recolector_asignado != self.recolector:
                # Permitir si es lider logistico o superior
                if self.recolector.cargo and self.recolector.cargo.code not in ['lider_log_econorte', 'gerente', 'superadmin']:
                    raise ValidationError({
                        'recolector': 'Solo el recolector asignado puede registrar la recoleccion'
                    })

    def soft_delete(self):
        """Eliminacion logica de la recoleccion"""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        """Restaura una recoleccion eliminada logicamente"""
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def save(self, *args, **kwargs):
        """
        Guarda la recoleccion con generacion thread-safe del codigo de voucher
        """
        # Generar codigo de voucher si no existe (thread-safe)
        if not self.codigo_voucher:
            self.codigo_voucher = self.generar_codigo_voucher()

        # Calcular valor total
        if self.cantidad_kg and self.precio_kg:
            self.valor_total = self.calcular_valor_total()

        # Ejecutar validaciones solo si es nuevo registro
        if not self.pk:
            self.full_clean()

        # Guardar con transaccion atomica para asegurar consistencia
        # Si hay IntegrityError en codigo_voucher, se propagara
        try:
            super().save(*args, **kwargs)
        except IntegrityError as e:
            # Si el error es por codigo_voucher duplicado, regenerar
            if 'codigo_voucher' in str(e).lower() or 'unique' in str(e).lower():
                # Reintentar con nuevo codigo
                self.codigo_voucher = self.generar_codigo_voucher()
                super().save(*args, **kwargs)
            else:
                raise
