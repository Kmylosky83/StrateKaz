# -*- coding: utf-8 -*-
"""
Modelos del módulo Recepciones - Sistema de Gestión Grasas y Huesos del Norte

Este módulo gestiona la recepción de materia prima en planta.

Soporta DOS tipos de origen:
1. UNIDAD_INTERNA (Econorte): Recolecciones de ecoaliados
   - Agrupa múltiples recolecciones de un recolector
   - Calcula merma mediante prorrateo ponderado

2. PROVEEDOR_EXTERNO: Proveedores externos de materia prima
   - Recepción directa de proveedor externo
   - Soporta 18 tipos de materia prima
   - Integra Prueba de Acidez para ACU y SEBO_PROCESADO

Flujo de proceso UNIDAD_INTERNA:
1. Recolector llega a planta con N recolecciones
2. Se pesa todo el lote en báscula (peso real)
3. Se compara con peso esperado (suma de recolecciones)
4. Diferencia = MERMA
5. Merma se prorratea de forma ponderada entre recolecciones
6. Precio real por kg se ajusta según merma
7. Recolecciones quedan "RECIBIDAS" y forman un LOTE
8. Producto pasa a STANDBY

Flujo de proceso PROVEEDOR_EXTERNO:
1. Seleccionar tipo de materia prima
2. Si ACU o SEBO_PROCESADO → Prueba de Acidez
3. Pesaje (interno o peso externo certificado)
4. Generar voucher
5. Producto pasa a STANDBY para siguiente proceso
"""
from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal, ROUND_HALF_UP
from apps.core.models import User
from apps.recolecciones.models import Recoleccion
from apps.proveedores.constants import CODIGO_MATERIA_PRIMA_CHOICES, CODIGOS_MATERIA_PRIMA_VALIDOS


class RecepcionMateriaPrima(models.Model):
    """
    Modelo RecepcionMateriaPrima - Lote de recepción en planta

    Soporta DOS tipos de origen:
    1. UNIDAD_INTERNA: Agrupa múltiples recolecciones de un recolector Econorte
    2. PROVEEDOR_EXTERNO: Recepción directa de proveedor externo

    Registra el peso real en báscula y calcula la merma total del lote.
    La merma se distribuye proporcionalmente entre las recolecciones (solo UNIDAD_INTERNA).

    Estados:
    - INICIADA: Recepción creada, en proceso de pesaje
    - PESADA: Peso en báscula registrado, merma calculada
    - CONFIRMADA: Recepción confirmada, recolecciones actualizadas
    - STANDBY: Producto recibido esperando siguiente proceso
    - CANCELADA: Recepción cancelada (error en proceso)
    """

    ESTADO_CHOICES = [
        ('INICIADA', 'Iniciada'),
        ('PESADA', 'Pesada'),
        ('CONFIRMADA', 'Confirmada'),
        ('STANDBY', 'En Espera'),
        ('CANCELADA', 'Cancelada'),
    ]

    ORIGEN_CHOICES = [
        ('UNIDAD_INTERNA', 'Unidad Interna (Econorte)'),
        ('PROVEEDOR_EXTERNO', 'Proveedor Externo'),
    ]

    # ============ IDENTIFICACIÓN ============
    codigo_recepcion = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código de recepción',
        help_text='Código único de la recepción (formato: RMP-YYYYMMDD-XXXX)'
    )

    # ============ ORIGEN DE LA RECEPCIÓN ============
    origen_recepcion = models.CharField(
        max_length=20,
        choices=ORIGEN_CHOICES,
        default='UNIDAD_INTERNA',
        db_index=True,
        verbose_name='Origen de recepción',
        help_text='Origen del material: Unidad Interna (Econorte) o Proveedor Externo'
    )

    tipo_materia_prima = models.CharField(
        max_length=25,
        choices=CODIGO_MATERIA_PRIMA_CHOICES,
        null=True,
        blank=True,
        verbose_name='Tipo de materia prima',
        help_text='Código específico de materia prima (solo para PROVEEDOR_EXTERNO o si aplica)'
    )

    # ============ RELACIONES ============
    recolector = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='recepciones_entregadas',
        limit_choices_to={
            'cargo__code': 'recolector_econorte',
            'is_active': True
        },
        null=True,
        blank=True,
        verbose_name='Recolector',
        help_text='Recolector que entrega el material (solo UNIDAD_INTERNA)'
    )

    proveedor_externo = models.ForeignKey(
        'proveedores.Proveedor',
        on_delete=models.PROTECT,
        related_name='recepciones_proveedor',
        null=True,
        blank=True,
        verbose_name='Proveedor Externo',
        help_text='Proveedor externo que entrega el material (solo PROVEEDOR_EXTERNO)'
    )

    # Referencia a la prueba de acidez (para ACU y SEBO_PROCESADO)
    prueba_acidez = models.ForeignKey(
        'proveedores.PruebaAcidez',
        on_delete=models.SET_NULL,
        related_name='recepciones',
        null=True,
        blank=True,
        verbose_name='Prueba de Acidez',
        help_text='Prueba de acidez asociada (solo para ACU y SEBO_PROCESADO)'
    )

    recibido_por = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='recepciones_recibidas',
        verbose_name='Recibido por',
        help_text='Usuario que recibe en planta (líder logística, operario)'
    )

    # ============ FECHA Y HORA ============
    fecha_recepcion = models.DateTimeField(
        verbose_name='Fecha y hora de recepción',
        help_text='Fecha y hora en que inicia la recepción'
    )

    fecha_pesaje = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha y hora de pesaje',
        help_text='Fecha y hora del pesaje en báscula'
    )

    fecha_confirmacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha y hora de confirmación',
        help_text='Fecha y hora de confirmación de la recepción'
    )

    # ============ PESOS Y CÁLCULOS ============
    peso_esperado_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Peso esperado (kg)',
        help_text='Suma de todos los kg de las recolecciones incluidas (UNIDAD_INTERNA) o peso declarado (PROVEEDOR_EXTERNO)'
    )

    peso_real_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Peso real en báscula (kg)',
        help_text='Peso real medido en báscula de la planta'
    )

    # Campo para peso externo certificado (solo PROVEEDOR_EXTERNO)
    usa_peso_externo = models.BooleanField(
        default=False,
        verbose_name='Usa peso externo',
        help_text='Si es True, el proveedor trae peso certificado de báscula externa'
    )

    peso_externo_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Peso externo certificado (kg)',
        help_text='Peso certificado por báscula externa (solo PROVEEDOR_EXTERNO)'
    )

    numero_certificado_peso = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número de certificado de peso',
        help_text='Número del certificado de la báscula externa'
    )

    merma_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Merma total (kg)',
        help_text='Diferencia entre peso esperado y peso real (positivo = pérdida)'
    )

    porcentaje_merma = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Porcentaje de merma (%)',
        help_text='(Merma / Peso esperado) x 100'
    )

    # ============ CONTEO DE RECOLECCIONES ============
    cantidad_recolecciones = models.PositiveIntegerField(
        default=0,
        verbose_name='Cantidad de recolecciones',
        help_text='Número total de recolecciones incluidas en esta recepción'
    )

    # ============ VALORES MONETARIOS ============
    valor_esperado_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Valor esperado total (COP)',
        help_text='Suma del valor total de todas las recolecciones'
    )

    valor_real_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Valor real total (COP)',
        help_text='Valor real después de aplicar merma prorrateada'
    )

    # ============ ESTADO ============
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='INICIADA',
        db_index=True,
        verbose_name='Estado',
        help_text='Estado actual de la recepción'
    )

    # ============ INFORMACIÓN ADICIONAL ============
    observaciones_recepcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones de recepción',
        help_text='Notas sobre el estado del material, condiciones de entrega, etc.'
    )

    observaciones_merma = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones sobre merma',
        help_text='Explicación o justificación de la merma detectada'
    )

    numero_ticket_bascula = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número de ticket de báscula',
        help_text='Número del ticket de pesaje de la báscula'
    )

    # ============ DESTINO DEL PRODUCTO ============
    tanque_destino = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Tanque destino',
        help_text='Identificador del tanque de ACU donde se almacena'
    )

    # ============ MOTIVO DE CANCELACIÓN ============
    motivo_cancelacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de cancelación',
        help_text='Razón por la cual se canceló la recepción'
    )

    cancelado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recepciones_canceladas',
        verbose_name='Cancelado por'
    )

    fecha_cancelacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de cancelación'
    )

    # ============ AUDITORÍA ============
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recepciones_registradas',
        verbose_name='Registrado por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de registro'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    # ============ SOFT DELETE ============
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de eliminación',
        help_text='Fecha de eliminación lógica (soft delete)'
    )

    class Meta:
        db_table = 'recepciones_recepcion_materia_prima'
        verbose_name = 'Recepción de Materia Prima'
        verbose_name_plural = 'Recepciones de Materia Prima'
        ordering = ['-fecha_recepcion', '-created_at']
        indexes = [
            models.Index(fields=['codigo_recepcion']),
            models.Index(fields=['origen_recepcion', 'estado']),
            models.Index(fields=['recolector', 'fecha_recepcion']),
            models.Index(fields=['proveedor_externo', 'fecha_recepcion']),
            models.Index(fields=['recibido_por', 'fecha_recepcion']),
            models.Index(fields=['estado', 'fecha_recepcion']),
            models.Index(fields=['tipo_materia_prima']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        if self.origen_recepcion == 'UNIDAD_INTERNA' and self.recolector:
            origen_str = self.recolector.get_full_name()
        elif self.origen_recepcion == 'PROVEEDOR_EXTERNO' and self.proveedor_externo:
            origen_str = self.proveedor_externo.nombre_comercial
        else:
            origen_str = self.get_origen_recepcion_display()
        return f"{self.codigo_recepcion} - {origen_str} ({self.get_estado_display()})"

    @property
    def is_deleted(self):
        """Verifica si la recepción está eliminada lógicamente"""
        return self.deleted_at is not None

    @property
    def es_unidad_interna(self):
        """Verifica si la recepción es de Unidad Interna (Econorte)"""
        return self.origen_recepcion == 'UNIDAD_INTERNA'

    @property
    def es_proveedor_externo(self):
        """Verifica si la recepción es de Proveedor Externo"""
        return self.origen_recepcion == 'PROVEEDOR_EXTERNO'

    @property
    def requiere_prueba_acidez(self):
        """
        Verifica si la recepción requiere prueba de acidez.
        Aplica para ACU y cualquier tipo de SEBO_PROCESADO.
        """
        if not self.tipo_materia_prima:
            return False
        tipos_con_acidez = ['ACU', 'SEBO_PROCESADO', 'SEBO_PROCESADO_A',
                           'SEBO_PROCESADO_B', 'SEBO_PROCESADO_B1',
                           'SEBO_PROCESADO_B2', 'SEBO_PROCESADO_B4',
                           'SEBO_PROCESADO_C']
        return self.tipo_materia_prima in tipos_con_acidez

    @property
    def tiene_prueba_acidez(self):
        """Verifica si ya tiene prueba de acidez asociada"""
        return self.prueba_acidez is not None

    @property
    def puede_pesar(self):
        """Verifica si se puede registrar el peso en báscula"""
        if self.is_deleted or self.estado != 'INICIADA':
            return False
        # Para proveedor externo con materiales que requieren acidez, debe tener la prueba
        if self.es_proveedor_externo and self.requiere_prueba_acidez:
            return self.tiene_prueba_acidez
        return True

    @property
    def puede_confirmar(self):
        """Verifica si se puede confirmar la recepción"""
        return self.estado == 'PESADA' and not self.is_deleted

    @property
    def puede_pasar_standby(self):
        """Verifica si se puede pasar la recepción a STANDBY"""
        return self.estado == 'CONFIRMADA' and not self.is_deleted

    @property
    def puede_cancelar(self):
        """Verifica si se puede cancelar la recepción"""
        return self.estado in ['INICIADA', 'PESADA'] and not self.is_deleted

    @property
    def es_editable(self):
        """Verifica si la recepción es editable"""
        return self.estado in ['INICIADA', 'PESADA'] and not self.is_deleted

    @property
    def nombre_origen(self):
        """Retorna el nombre del origen (recolector o proveedor)"""
        if self.es_unidad_interna and self.recolector:
            return self.recolector.get_full_name()
        elif self.es_proveedor_externo and self.proveedor_externo:
            return self.proveedor_externo.nombre_comercial
        return None

    @classmethod
    def generar_codigo_recepcion(cls):
        """
        Genera un código único para la recepción.

        Usa el sistema centralizado de consecutivos (ConsecutivoConfig).
        Formato: RMP-YYYYMMDD-XXXX (ej: RMP-20241204-0001)
        """
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig

        try:
            return ConsecutivoConfig.obtener_siguiente_consecutivo('RECEPCION')
        except ConsecutivoConfig.DoesNotExist:
            # Fallback al método legacy si no existe configuración
            from datetime import date
            hoy = date.today()
            prefijo = f"RMP-{hoy.strftime('%Y%m%d')}-"

            ultimo = cls.objects.filter(
                codigo_recepcion__startswith=prefijo
            ).order_by('-codigo_recepcion').first()

            if ultimo:
                try:
                    numero = int(ultimo.codigo_recepcion.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1

            return f"{prefijo}{numero:04d}"

    def calcular_peso_esperado(self):
        """
        Calcula el peso esperado sumando todas las recolecciones asociadas
        """
        total = Decimal('0.00')
        for detalle in self.detalles.all():
            total += detalle.peso_esperado_kg
        return total

    def calcular_valor_esperado(self):
        """
        Calcula el valor esperado sumando todas las recolecciones asociadas
        """
        total = Decimal('0.00')
        for detalle in self.detalles.all():
            total += detalle.valor_esperado
        return total

    def calcular_merma(self):
        """
        Calcula la merma total del lote
        Merma = Peso esperado - Peso real

        Returns:
            tuple: (merma_kg, porcentaje_merma)
        """
        if not self.peso_real_kg or not self.peso_esperado_kg:
            return Decimal('0.00'), Decimal('0.00')

        merma = self.peso_esperado_kg - self.peso_real_kg

        # Calcular porcentaje
        if self.peso_esperado_kg > 0:
            porcentaje = (merma / self.peso_esperado_kg) * Decimal('100.00')
        else:
            porcentaje = Decimal('0.00')

        return merma, porcentaje

    def registrar_pesaje(self, peso_bascula, numero_ticket=None, observaciones=None):
        """
        Registra el peso en báscula y calcula la merma

        Args:
            peso_bascula (Decimal): Peso medido en báscula
            numero_ticket (str, optional): Número de ticket de báscula
            observaciones (str, optional): Observaciones sobre la merma

        Returns:
            bool: True si el pesaje fue exitoso

        Raises:
            ValidationError: Si el estado no permite pesaje o datos inválidos
        """
        if not self.puede_pesar:
            raise ValidationError('La recepción no puede ser pesada en su estado actual')

        if peso_bascula <= 0:
            raise ValidationError('El peso en báscula debe ser mayor a 0')

        # Registrar peso
        self.peso_real_kg = peso_bascula
        self.numero_ticket_bascula = numero_ticket
        self.fecha_pesaje = timezone.now()

        # Calcular merma
        self.merma_kg, self.porcentaje_merma = self.calcular_merma()

        # Agregar observaciones sobre merma
        if observaciones:
            self.observaciones_merma = observaciones

        # Cambiar estado
        self.estado = 'PESADA'

        self.save()

        return True

    @transaction.atomic
    def confirmar_recepcion(self):
        """
        Confirma la recepción y aplica el prorrateo de merma a las recolecciones

        - Calcula el peso y valor real de cada recolección aplicando el prorrateo
        - Actualiza los detalles de recepción
        - Marca las recolecciones como RECIBIDAS
        - Cambia el estado a CONFIRMADA

        Returns:
            bool: True si la confirmación fue exitosa

        Raises:
            ValidationError: Si el estado no permite confirmación
        """
        if not self.puede_confirmar:
            raise ValidationError('La recepción no puede ser confirmada en su estado actual')

        # Prorratear merma entre todas las recolecciones
        self._prorratear_merma()

        # Marcar recepción como confirmada
        self.fecha_confirmacion = timezone.now()
        self.estado = 'CONFIRMADA'

        # Calcular valor real total
        self.valor_real_total = sum(
            detalle.valor_real for detalle in self.detalles.all()
        )

        self.save()

        return True

    def _prorratear_merma(self):
        """
        Prorrateo ponderado de merma entre las recolecciones del lote

        Fórmula:
        - Factor de merma = Peso real / Peso esperado
        - Peso real recolección = Peso esperado recolección * Factor de merma
        - Merma recolección = Peso esperado - Peso real
        - Precio real/kg = Valor original / Peso real
        - Valor real = Peso real * Precio real/kg
        """
        if not self.peso_real_kg or not self.peso_esperado_kg:
            raise ValidationError('Debe registrar el peso en báscula antes de confirmar')

        if self.peso_esperado_kg == 0:
            raise ValidationError('El peso esperado no puede ser 0')

        # Factor de merma (proporción del peso real respecto al esperado)
        factor_merma = self.peso_real_kg / self.peso_esperado_kg

        # Aplicar prorrateo a cada detalle
        for detalle in self.detalles.all():
            detalle.aplicar_merma(factor_merma)

    def pasar_a_standby(self):
        """
        Pasa la recepción a estado STANDBY (En espera de siguiente proceso)

        El estado STANDBY indica que:
        - El material ya fue recibido y pesado
        - La recepción está confirmada
        - El producto está listo para el siguiente proceso (producción, lote, etc.)

        Returns:
            bool: True si la transición fue exitosa

        Raises:
            ValidationError: Si el estado no permite la transición
        """
        if not self.puede_pasar_standby:
            raise ValidationError('La recepción debe estar CONFIRMADA para pasar a STANDBY')

        self.estado = 'STANDBY'
        self.save()

        return True

    def cancelar(self, usuario, motivo):
        """
        Cancela la recepción

        Args:
            usuario (User): Usuario que cancela
            motivo (str): Motivo de cancelación

        Returns:
            bool: True si la cancelación fue exitosa

        Raises:
            ValidationError: Si el estado no permite cancelación
        """
        if not self.puede_cancelar:
            raise ValidationError('La recepción no puede ser cancelada en su estado actual')

        self.estado = 'CANCELADA'
        self.motivo_cancelacion = motivo
        self.cancelado_por = usuario
        self.fecha_cancelacion = timezone.now()

        self.save()

        return True

    def soft_delete(self):
        """Eliminación lógica de la recepción"""
        if self.estado == 'CONFIRMADA':
            raise ValidationError('No se puede eliminar una recepción confirmada')

        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        """Restaura una recepción eliminada lógicamente"""
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def clean(self):
        """Validaciones personalizadas según el origen de la recepción"""

        # ============ VALIDACIONES PARA UNIDAD_INTERNA ============
        if self.origen_recepcion == 'UNIDAD_INTERNA':
            # Debe tener recolector
            if not self.recolector:
                raise ValidationError({
                    'recolector': 'Recepción de Unidad Interna requiere un recolector'
                })

            # Validar cargo del recolector
            if self.recolector and (
                not self.recolector.cargo or
                self.recolector.cargo.code != 'recolector_econorte'
            ):
                raise ValidationError({
                    'recolector': 'El usuario debe tener cargo de Recolector Econorte'
                })

            # No debe tener proveedor externo
            if self.proveedor_externo:
                raise ValidationError({
                    'proveedor_externo': 'Recepción de Unidad Interna no debe tener proveedor externo'
                })

        # ============ VALIDACIONES PARA PROVEEDOR_EXTERNO ============
        elif self.origen_recepcion == 'PROVEEDOR_EXTERNO':
            # Debe tener proveedor externo
            if not self.proveedor_externo:
                raise ValidationError({
                    'proveedor_externo': 'Recepción de Proveedor Externo requiere un proveedor'
                })

            # Debe tener tipo de materia prima
            if not self.tipo_materia_prima:
                raise ValidationError({
                    'tipo_materia_prima': 'Debe especificar el tipo de materia prima'
                })

            # Validar que el tipo de materia prima sea válido
            if self.tipo_materia_prima and self.tipo_materia_prima not in CODIGOS_MATERIA_PRIMA_VALIDOS:
                raise ValidationError({
                    'tipo_materia_prima': f'Código de materia prima "{self.tipo_materia_prima}" no es válido'
                })

            # No debe tener recolector
            if self.recolector:
                raise ValidationError({
                    'recolector': 'Recepción de Proveedor Externo no debe tener recolector'
                })

            # Validar prueba de acidez para ACU y SEBO_PROCESADO
            if self.tipo_materia_prima in ['ACU', 'SEBO_PROCESADO', 'SEBO_PROCESADO_A',
                                            'SEBO_PROCESADO_B', 'SEBO_PROCESADO_B1',
                                            'SEBO_PROCESADO_B2', 'SEBO_PROCESADO_B4',
                                            'SEBO_PROCESADO_C']:
                # La prueba de acidez es opcional al crear, pero requerida para confirmar
                pass  # Se valida en confirmar_recepcion si no tiene prueba

            # Validar peso externo
            if self.usa_peso_externo:
                if not self.peso_externo_kg:
                    raise ValidationError({
                        'peso_externo_kg': 'Si usa peso externo, debe especificar el peso certificado'
                    })
                if not self.numero_certificado_peso:
                    raise ValidationError({
                        'numero_certificado_peso': 'Si usa peso externo, debe especificar el número de certificado'
                    })

        # ============ VALIDACIONES COMUNES ============
        # Validar peso real (debe ser menor o igual al esperado + margen)
        if self.peso_real_kg and self.peso_esperado_kg:
            margen_aceptable = Decimal('0.10')  # 10% de margen superior
            if self.peso_real_kg > self.peso_esperado_kg * (Decimal('1.00') + margen_aceptable):
                raise ValidationError({
                    'peso_real_kg': f'El peso real no puede exceder el esperado en más de {margen_aceptable*100}%'
                })

    def save(self, *args, **kwargs):
        """Guarda la recepción con generación automática de código"""
        # Generar código si no existe
        if not self.codigo_recepcion:
            self.codigo_recepcion = self.generar_codigo_recepcion()

        # Para UNIDAD_INTERNA: calcular peso esperado de recolecciones
        if self.origen_recepcion == 'UNIDAD_INTERNA':
            if not self.peso_esperado_kg or self.peso_esperado_kg == 0:
                self.peso_esperado_kg = self.calcular_peso_esperado()

            if not self.valor_esperado_total or self.valor_esperado_total == 0:
                self.valor_esperado_total = self.calcular_valor_esperado()

        # Para PROVEEDOR_EXTERNO: el peso esperado se establece manualmente
        # Si usa peso externo, usar ese como peso esperado inicial
        elif self.origen_recepcion == 'PROVEEDOR_EXTERNO':
            if self.usa_peso_externo and self.peso_externo_kg:
                if not self.peso_esperado_kg or self.peso_esperado_kg == 0:
                    self.peso_esperado_kg = self.peso_externo_kg

        # Validaciones
        self.full_clean()

        super().save(*args, **kwargs)


class RecepcionDetalle(models.Model):
    """
    Modelo RecepcionDetalle - Detalle de recolecciones incluidas en la recepción

    Cada registro vincula una recolección específica a una recepción y almacena:
    - Datos originales de la recolección (peso, precio, valor)
    - Datos ajustados después del prorrateo de merma
    - Cálculos de merma específica de esta recolección
    """

    # ============ RELACIONES ============
    recepcion = models.ForeignKey(
        RecepcionMateriaPrima,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Recepción',
        help_text='Recepción a la que pertenece este detalle'
    )

    recoleccion = models.OneToOneField(
        Recoleccion,
        on_delete=models.PROTECT,
        related_name='detalle_recepcion',
        verbose_name='Recolección',
        help_text='Recolección incluida en esta recepción'
    )

    # ============ DATOS ORIGINALES (ESPERADOS) ============
    peso_esperado_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Peso esperado (kg)',
        help_text='Peso original registrado en la recolección'
    )

    precio_esperado_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio esperado por kg (COP)',
        help_text='Precio por kg registrado en la recolección'
    )

    valor_esperado = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Valor esperado (COP)',
        help_text='Valor total original de la recolección'
    )

    # ============ DATOS REALES (DESPUÉS DE MERMA) ============
    peso_real_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Peso real (kg)',
        help_text='Peso real después de aplicar prorrateo de merma'
    )

    merma_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Merma (kg)',
        help_text='Merma prorrateada para esta recolección'
    )

    porcentaje_merma = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Porcentaje de merma (%)',
        help_text='Porcentaje de merma aplicado (igual para todas las recolecciones del lote)'
    )

    precio_real_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio real por kg (COP)',
        help_text='Precio ajustado por kg después de merma (valor_esperado / peso_real)'
    )

    valor_real = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Valor real (COP)',
        help_text='Valor real después de ajustar por merma'
    )

    # ============ PROPORCIÓN EN EL LOTE ============
    proporcion_lote = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        default=Decimal('0.0000'),
        verbose_name='Proporción en el lote',
        help_text='Porcentaje que representa esta recolección del total (peso_esperado/total_lote)'
    )

    # ============ OBSERVACIONES ============
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones',
        help_text='Notas específicas sobre esta recolección en la recepción'
    )

    # ============ AUDITORÍA ============
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de registro'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        db_table = 'recepciones_recepcion_detalle'
        verbose_name = 'Detalle de Recepción'
        verbose_name_plural = 'Detalles de Recepción'
        ordering = ['recepcion', '-peso_esperado_kg']
        indexes = [
            models.Index(fields=['recepcion', 'recoleccion']),
            models.Index(fields=['recoleccion']),
        ]

    def __str__(self):
        return (
            f"Detalle {self.recepcion.codigo_recepcion} - "
            f"{self.recoleccion.codigo_voucher} ({self.peso_esperado_kg} kg)"
        )

    @property
    def tiene_merma_aplicada(self):
        """Verifica si ya se aplicó la merma"""
        return self.peso_real_kg is not None

    @property
    def diferencia_valor(self):
        """Calcula la diferencia en valor por la merma"""
        if self.valor_real is not None:
            return self.valor_esperado - self.valor_real
        return Decimal('0.00')

    def calcular_proporcion_lote(self):
        """
        Calcula qué porcentaje representa esta recolección del lote total
        """
        if not self.recepcion or not self.recepcion.peso_esperado_kg:
            return Decimal('0.0000')

        if self.recepcion.peso_esperado_kg == 0:
            return Decimal('0.0000')

        proporcion = (self.peso_esperado_kg / self.recepcion.peso_esperado_kg)
        # Redondear a 4 decimales
        return proporcion.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)

    def aplicar_merma(self, factor_merma):
        """
        Aplica el prorrateo de merma a esta recolección

        Args:
            factor_merma (Decimal): Factor de merma (peso_real_total / peso_esperado_total)

        Cálculos:
        - Peso real = Peso esperado × Factor de merma
        - Merma = Peso esperado - Peso real
        - Porcentaje merma = (Merma / Peso esperado) × 100
        - Precio real/kg = Valor esperado / Peso real
        - Valor real = Peso real × Precio real/kg = Valor esperado (se mantiene)

        NOTA IMPORTANTE: El valor esperado se mantiene igual porque el ecoaliado
        ya recibió ese dinero. La merma solo afecta el peso real recibido en planta.
        """
        if factor_merma <= 0 or factor_merma > 1:
            raise ValidationError('El factor de merma debe estar entre 0 y 1')

        # Calcular peso real aplicando el factor de merma
        self.peso_real_kg = (self.peso_esperado_kg * factor_merma).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )

        # Calcular merma en kg
        self.merma_kg = (self.peso_esperado_kg - self.peso_real_kg).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )

        # Calcular porcentaje de merma
        if self.peso_esperado_kg > 0:
            self.porcentaje_merma = (
                (self.merma_kg / self.peso_esperado_kg) * Decimal('100.00')
            ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        else:
            self.porcentaje_merma = Decimal('0.00')

        # Calcular precio real por kg (ajustado por merma)
        # Precio real/kg = Valor esperado / Peso real
        if self.peso_real_kg > 0:
            self.precio_real_kg = (self.valor_esperado / self.peso_real_kg).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
        else:
            self.precio_real_kg = Decimal('0.00')

        # El valor real se mantiene igual al esperado
        # porque el ecoaliado ya recibió el pago
        self.valor_real = self.valor_esperado

        # Calcular proporción en el lote
        self.proporcion_lote = self.calcular_proporcion_lote()

        self.save()

    def clean(self):
        """Validaciones personalizadas"""
        # Validar que la recolección no esté ya en otra recepción activa
        if self.recoleccion:
            existe = RecepcionDetalle.objects.filter(
                recoleccion=self.recoleccion
            ).exclude(
                recepcion__estado='CANCELADA'
            ).exclude(
                pk=self.pk
            ).exists()

            if existe:
                raise ValidationError({
                    'recoleccion': 'Esta recolección ya está incluida en otra recepción activa'
                })

        # Validar que los datos esperados coincidan con la recolección
        if self.recoleccion:
            if self.peso_esperado_kg != self.recoleccion.cantidad_kg:
                raise ValidationError({
                    'peso_esperado_kg': 'El peso esperado debe coincidir con la cantidad de la recolección'
                })

            if self.precio_esperado_kg != self.recoleccion.precio_kg:
                raise ValidationError({
                    'precio_esperado_kg': 'El precio esperado debe coincidir con el precio de la recolección'
                })

            if self.valor_esperado != self.recoleccion.valor_total:
                raise ValidationError({
                    'valor_esperado': 'El valor esperado debe coincidir con el valor total de la recolección'
                })

    def save(self, *args, **kwargs):
        """Guarda el detalle con validaciones"""
        # Si no hay datos esperados, tomarlos de la recolección
        if self.recoleccion and not self.peso_esperado_kg:
            self.peso_esperado_kg = self.recoleccion.cantidad_kg
            self.precio_esperado_kg = self.recoleccion.precio_kg
            self.valor_esperado = self.recoleccion.valor_total

        # Calcular proporción
        if not self.proporcion_lote or self.proporcion_lote == 0:
            self.proporcion_lote = self.calcular_proporcion_lote()

        # Validaciones
        self.full_clean()

        super().save(*args, **kwargs)
