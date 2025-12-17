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

    # ============ CALIDAD Y ACIDEZ (para ACU y Sebo Procesado) ============
    porcentaje_acidez = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Porcentaje de acidez (%)',
        help_text='Porcentaje de acidez del ACU/Sebo (0-100%)'
    )
    calidad = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        verbose_name='Calidad',
        help_text='Calidad determinada por acidez: A (1-5%), B (5.1-8%), B1 (8.1-10%), B2 (10.1-15%), B4 (15.1-20%), C (>20%)'
    )
    requiere_prueba_acidez = models.BooleanField(
        default=True,
        verbose_name='Requiere prueba de acidez',
        help_text='Indica si la recoleccion requiere prueba de acidez (ACU y Sebo Procesado)'
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
        Genera un codigo unico para el voucher de forma thread-safe.

        Usa el sistema centralizado de consecutivos (ConsecutivoConfig)
        que ya implementa select_for_update() y manejo de reinicio automático.

        Formato: REC-YYYYMMDD-XXXX (ej: REC-20241125-0001)

        Args:
            max_retries: Numero maximo de intentos (default: 5)

        Returns:
            str: Codigo de voucher unico

        Raises:
            IntegrityError: Si no se pudo generar un codigo unico despues de max_retries
        """
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

        try:
            # El servicio centralizado ya es thread-safe con select_for_update()
            return ConsecutivoConfig.obtener_siguiente_consecutivo('RECOLECCION')
        except ConsecutivoConfig.DoesNotExist:
            # Fallback al método legacy si no existe configuración
            # Esto permite que el sistema funcione durante la migración
            from datetime import date
            hoy = date.today()
            prefijo = f"REC-{hoy.strftime('%Y%m%d')}-"

            for attempt in range(max_retries):
                try:
                    with transaction.atomic():
                        ultimo = cls.objects.select_for_update().filter(
                            codigo_voucher__startswith=prefijo
                        ).order_by('-codigo_voucher').first()

                        if ultimo:
                            try:
                                numero = int(ultimo.codigo_voucher.split('-')[-1]) + 1
                            except (ValueError, IndexError):
                                numero = 1
                        else:
                            numero = 1

                        codigo = f"{prefijo}{numero:04d}"

                        if not cls.objects.filter(codigo_voucher=codigo).exists():
                            return codigo
                        else:
                            numero += 1
                            codigo = f"{prefijo}{numero:04d}"
                            if not cls.objects.filter(codigo_voucher=codigo).exists():
                                return codigo

                except IntegrityError:
                    if attempt < max_retries - 1:
                        wait_time = (2 ** attempt) * 0.01
                        time.sleep(wait_time)
                        continue
                    else:
                        raise

            raise IntegrityError(
                f"No se pudo generar un codigo de voucher unico despues de {max_retries} intentos"
            )

    def calcular_valor_total(self):
        """Calcula el valor total basado en cantidad y precio"""
        if self.cantidad_kg and self.precio_kg:
            return Decimal(str(self.cantidad_kg)) * Decimal(str(self.precio_kg))
        return Decimal('0')

    def calcular_calidad_por_acidez(self):
        """
        Determina la calidad basándose en el porcentaje de acidez.
        Rangos:
        - A: 1-5%
        - B: 5.1-8%
        - B1: 8.1-10%
        - B2: 10.1-15%
        - B4: 15.1-20%
        - C: >20%
        """
        if self.porcentaje_acidez is None:
            return None

        acidez = float(self.porcentaje_acidez)

        if acidez <= 5:
            return 'A'
        elif acidez <= 8:
            return 'B'
        elif acidez <= 10:
            return 'B1'
        elif acidez <= 15:
            return 'B2'
        elif acidez <= 20:
            return 'B4'
        else:
            return 'C'

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

        # Calcular valor total SOLO si no esta establecido
        # Esto permite que el serializer pase un valor_total diferente (valor real pagado)
        if self.cantidad_kg and self.precio_kg and not self.valor_total:
            self.valor_total = self.calcular_valor_total()

        # Auto-calcular calidad basada en acidez
        if self.porcentaje_acidez is not None and not self.calidad:
            self.calidad = self.calcular_calidad_por_acidez()

        # Ejecutar validaciones solo si es nuevo registro
        # Omitir full_clean si skip_validation esta en kwargs
        skip_validation = kwargs.pop('skip_validation', False)
        if not self.pk and not skip_validation:
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


class CertificadoRecoleccion(models.Model):
    """
    Modelo para almacenar certificados de recoleccion emitidos

    Guarda un registro permanente de cada certificado generado,
    permitiendo auditoria, reimpresion y consulta historica.
    """

    PERIODO_CHOICES = [
        ('mensual', 'Mensual'),
        ('bimestral', 'Bimestral'),
        ('trimestral', 'Trimestral'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual'),
        ('personalizado', 'Personalizado'),
    ]

    # ============ IDENTIFICADOR UNICO ============
    numero_certificado = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Numero de certificado',
        help_text='Codigo unico del certificado (formato: CERT-CODIGO-TIMESTAMP)'
    )

    # ============ ECOALIADO ============
    ecoaliado = models.ForeignKey(
        Ecoaliado,
        on_delete=models.PROTECT,
        related_name='certificados',
        verbose_name='Ecoaliado',
        help_text='Ecoaliado al que se emite el certificado'
    )

    # ============ PERIODO ============
    periodo = models.CharField(
        max_length=20,
        choices=PERIODO_CHOICES,
        verbose_name='Tipo de periodo'
    )
    fecha_inicio = models.DateField(
        verbose_name='Fecha inicio del periodo'
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha fin del periodo'
    )
    descripcion_periodo = models.CharField(
        max_length=100,
        verbose_name='Descripcion del periodo',
        help_text='Ej: Enero 2025, Primer Semestre 2025'
    )

    # ============ RESUMEN ============
    total_recolecciones = models.PositiveIntegerField(
        default=0,
        verbose_name='Total de recolecciones'
    )
    total_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        verbose_name='Total kilogramos'
    )
    total_valor = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0'),
        verbose_name='Valor total pagado'
    )
    promedio_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0'),
        verbose_name='Promedio kg por recoleccion'
    )
    precio_promedio_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0'),
        verbose_name='Precio promedio por kg'
    )

    # ============ DATOS JSON COMPLETOS ============
    datos_certificado = models.JSONField(
        verbose_name='Datos completos del certificado',
        help_text='JSON con todos los datos para reimprimir el certificado'
    )

    # ============ AUDITORIA ============
    emitido_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificados_emitidos',
        verbose_name='Emitido por'
    )
    fecha_emision = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de emision'
    )

    # ============ SOFT DELETE ============
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de eliminacion'
    )

    class Meta:
        db_table = 'recolecciones_certificado'
        verbose_name = 'Certificado de Recoleccion'
        verbose_name_plural = 'Certificados de Recoleccion'
        ordering = ['-fecha_emision']
        indexes = [
            models.Index(fields=['ecoaliado', 'fecha_emision']),
            models.Index(fields=['numero_certificado']),
            models.Index(fields=['periodo', 'fecha_inicio', 'fecha_fin']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.numero_certificado} - {self.ecoaliado.razon_social}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])
