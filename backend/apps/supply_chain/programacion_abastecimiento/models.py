"""
Modelos para Programación de Abastecimiento - Supply Chain
Sistema de Gestión Grasas y Huesos del Norte

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.

Gestiona:
- Programación de operaciones de recolección y compra
- Asignación de recursos (vehículos, conductores)
- Ejecución de programaciones
- Liquidación económica de operaciones
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from apps.supply_chain.catalogos.models import UnidadMedida


# ==============================================================================
# MODELOS DE CATÁLOGO DINÁMICO
# ==============================================================================

class TipoOperacion(models.Model):
    """
    Tipo de operación de abastecimiento (dinámico).
    Ejemplos: RECOLECCION, COMPRA_DIRECTA, COMPRA_PUNTO, ENTREGA_PROVEEDOR
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo (ej: RECOLECCION, COMPRA_DIRECTA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de operación'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    requiere_vehiculo = models.BooleanField(
        default=False,
        verbose_name='Requiere vehículo',
        help_text='Indica si este tipo de operación requiere asignación de vehículo'
    )
    requiere_conductor = models.BooleanField(
        default=False,
        verbose_name='Requiere conductor',
        help_text='Indica si este tipo de operación requiere asignación de conductor'
    )
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)',
        help_text='Color para identificación visual en calendario (ej: #FF5733)'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_tipo_operacion'
        verbose_name = 'Tipo de Operación'
        verbose_name_plural = 'Tipos de Operación'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class EstadoProgramacion(models.Model):
    """
    Estado de la programación (dinámico).
    Ejemplos: PENDIENTE, CONFIRMADA, EN_PROCESO, COMPLETADA, CANCELADA
    """
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
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    es_estado_inicial = models.BooleanField(
        default=False,
        verbose_name='Es estado inicial',
        help_text='Estado por defecto para nuevas programaciones'
    )
    es_estado_final = models.BooleanField(
        default=False,
        verbose_name='Es estado final',
        help_text='Indica que la programación ha terminado (completada o cancelada)'
    )
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_estado_programacion'
        verbose_name = 'Estado de Programación'
        verbose_name_plural = 'Estados de Programación'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class EstadoEjecucion(models.Model):
    """
    Estado de la ejecución (dinámico).
    Ejemplos: INICIADA, EN_PROCESO, COMPLETADA, CON_NOVEDAD, PAUSADA
    """
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
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    es_estado_inicial = models.BooleanField(default=False)
    es_estado_final = models.BooleanField(default=False)
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_estado_ejecucion'
        verbose_name = 'Estado de Ejecución'
        verbose_name_plural = 'Estados de Ejecución'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class EstadoLiquidacion(models.Model):
    """
    Estado de la liquidación (dinámico).
    Ejemplos: PENDIENTE, APROBADA, PAGADA, ANULADA, RECHAZADA
    """
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
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    permite_edicion = models.BooleanField(
        default=True,
        verbose_name='Permite edición',
        help_text='Indica si la liquidación puede editarse en este estado'
    )
    es_estado_inicial = models.BooleanField(default=False)
    es_estado_final = models.BooleanField(default=False)
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_estado_liquidacion'
        verbose_name = 'Estado de Liquidación'
        verbose_name_plural = 'Estados de Liquidación'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


# ==============================================================================
# MODELOS PRINCIPALES
# ==============================================================================

class Programacion(models.Model):
    """
    Programación de operaciones de abastecimiento.

    Gestiona la planificación de recolecciones, compras directas y otras
    operaciones de abastecimiento de materia prima.
    """
    # Identificación y código
    codigo = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código',
        help_text='Código autogenerado de la programación'
    )

    # Relación con empresa y sede (usando modelos del sistema)
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.PROTECT,
        related_name='programaciones_abastecimiento',
        verbose_name='Empresa',
        help_text='Configuración de empresa'
    )
    sede = models.ForeignKey(
        'configuracion.SedeEmpresa',
        on_delete=models.PROTECT,
        related_name='programaciones_abastecimiento',
        verbose_name='Sede',
        help_text='Sede donde se realiza la operación'
    )

    # Tipo de operación (dinámico)
    tipo_operacion = models.ForeignKey(
        TipoOperacion,
        on_delete=models.PROTECT,
        related_name='programaciones',
        verbose_name='Tipo de operación'
    )

    # Fechas
    fecha_programada = models.DateTimeField(
        verbose_name='Fecha programada',
        help_text='Fecha y hora programada para la operación'
    )
    fecha_ejecucion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de ejecución',
        help_text='Fecha y hora real de ejecución'
    )

    # Proveedor
    proveedor = models.ForeignKey(
        'gestion_proveedores.Proveedor',
        on_delete=models.PROTECT,
        related_name='programaciones',
        verbose_name='Proveedor'
    )

    # Responsable
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='programaciones_responsable',
        verbose_name='Responsable',
        help_text='Usuario responsable de la programación'
    )

    # Estado (dinámico)
    estado = models.ForeignKey(
        EstadoProgramacion,
        on_delete=models.PROTECT,
        related_name='programaciones',
        verbose_name='Estado'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones generales'
    )

    # Auditoría
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='programaciones_creadas'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_chain_programacion'
        verbose_name = 'Programación de Abastecimiento'
        verbose_name_plural = 'Programaciones de Abastecimiento'
        ordering = ['-fecha_programada', '-created_at']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['fecha_programada']),
            models.Index(fields=['estado']),
            models.Index(fields=['proveedor']),
            models.Index(fields=['sede']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.tipo_operacion.nombre} - {self.proveedor.nombre_comercial}"

    @staticmethod
    def generar_codigo():
        """Genera código único de programación."""
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        try:
            return ConsecutivoConfig.obtener_siguiente_consecutivo('PROGRAMACION_ABASTECIMIENTO')
        except ConsecutivoConfig.DoesNotExist:
            # Fallback
            from datetime import date
            hoy = date.today()
            prefijo = f"PROG-{hoy.strftime('%Y%m%d')}-"

            ultimo = Programacion.objects.filter(
                codigo__startswith=prefijo
            ).order_by('-codigo').first()

            if ultimo:
                try:
                    numero = int(ultimo.codigo.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1

            return f"{prefijo}{numero:04d}"

    @property
    def is_deleted(self):
        """Verifica si está eliminada (soft delete)."""
        return self.deleted_at is not None

    @property
    def tiene_ejecucion(self):
        """Verifica si tiene ejecución asociada."""
        return hasattr(self, 'ejecucion') and self.ejecucion is not None

    @property
    def tiene_liquidacion(self):
        """Verifica si tiene liquidación asociada."""
        return self.tiene_ejecucion and hasattr(self.ejecucion, 'liquidacion')

    def soft_delete(self):
        """Elimina lógicamente la programación."""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        """Restaura una programación eliminada."""
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def save(self, *args, **kwargs):
        """Genera código automáticamente al crear."""
        if not self.pk and not self.codigo:
            self.codigo = self.generar_codigo()
        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que el proveedor esté activo
        if self.proveedor and not self.proveedor.is_active:
            raise ValidationError({
                'proveedor': 'El proveedor no está activo'
            })

        # Validar que la sede esté activa
        if self.sede and not self.sede.is_active:
            raise ValidationError({
                'sede': 'La sede no está activa'
            })


class AsignacionRecurso(models.Model):
    """
    Recursos asignados a una programación (vehículos, conductores).

    Permite asignar recursos necesarios para la ejecución de la programación.
    """
    programacion = models.OneToOneField(
        Programacion,
        on_delete=models.CASCADE,
        related_name='asignacion_recurso',
        verbose_name='Programación'
    )

    # Vehículo (opcional según tipo de operación)
    vehiculo = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Vehículo',
        help_text='Identificación del vehículo asignado (placa, código interno, etc.)'
    )

    # Conductor (opcional según tipo de operación)
    conductor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='asignaciones_conductor',
        verbose_name='Conductor',
        help_text='Usuario asignado como conductor'
    )

    # Fechas
    fecha_asignacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de asignación'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones de asignación'
    )

    # Auditoría
    asignado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='asignaciones_realizadas',
        verbose_name='Asignado por'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_asignacion_recurso'
        verbose_name = 'Asignación de Recurso'
        verbose_name_plural = 'Asignaciones de Recursos'
        ordering = ['-fecha_asignacion']

    def __str__(self):
        recursos = []
        if self.vehiculo:
            recursos.append(f"Veh: {self.vehiculo}")
        if self.conductor:
            recursos.append(f"Cond: {self.conductor.get_full_name()}")
        recursos_str = ", ".join(recursos) if recursos else "Sin recursos"
        return f"{self.programacion.codigo} - {recursos_str}"

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que se asignen recursos según el tipo de operación
        if self.programacion:
            tipo_op = self.programacion.tipo_operacion

            if tipo_op.requiere_vehiculo and not self.vehiculo:
                raise ValidationError({
                    'vehiculo': f'El tipo de operación {tipo_op.nombre} requiere asignación de vehículo'
                })

            if tipo_op.requiere_conductor and not self.conductor:
                raise ValidationError({
                    'conductor': f'El tipo de operación {tipo_op.nombre} requiere asignación de conductor'
                })


class Ejecucion(models.Model):
    """
    Registro de ejecución de una programación.

    Captura los datos reales de la operación ejecutada:
    fechas, kilometraje, cantidades recolectadas, etc.
    """
    programacion = models.OneToOneField(
        Programacion,
        on_delete=models.PROTECT,
        related_name='ejecucion',
        verbose_name='Programación'
    )

    # Fechas y horas reales
    fecha_inicio = models.DateTimeField(
        verbose_name='Fecha y hora de inicio'
    )
    fecha_fin = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha y hora de finalización'
    )

    # Kilometraje (para operaciones con vehículo)
    kilometraje_inicial = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Kilometraje inicial',
        help_text='Kilometraje del vehículo al inicio de la operación'
    )
    kilometraje_final = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Kilometraje final',
        help_text='Kilometraje del vehículo al final de la operación'
    )

    # Cantidad recolectada/comprada
    cantidad_recolectada = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Cantidad recolectada/comprada',
        help_text='Cantidad de materia prima obtenida'
    )
    unidad_medida = models.ForeignKey(
        UnidadMedida,
        on_delete=models.PROTECT,
        related_name='ejecuciones',
        verbose_name='Unidad de medida'
    )

    # Estado de la ejecución (dinámico)
    estado = models.ForeignKey(
        EstadoEjecucion,
        on_delete=models.PROTECT,
        related_name='ejecuciones',
        verbose_name='Estado'
    )

    # Responsable de la ejecución
    ejecutado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ejecuciones_realizadas',
        verbose_name='Ejecutado por',
        help_text='Usuario que realizó/registró la ejecución'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones de ejecución'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_ejecucion'
        verbose_name = 'Ejecución de Programación'
        verbose_name_plural = 'Ejecuciones de Programaciones'
        ordering = ['-fecha_inicio', '-created_at']
        indexes = [
            models.Index(fields=['programacion']),
            models.Index(fields=['fecha_inicio']),
            models.Index(fields=['estado']),
            models.Index(fields=['ejecutado_por']),
        ]

    def __str__(self):
        return f"Ejecución {self.programacion.codigo} - {self.cantidad_recolectada} {self.unidad_medida.simbolo}"

    @property
    def kilometros_recorridos(self):
        """Calcula kilómetros recorridos."""
        if self.kilometraje_inicial and self.kilometraje_final:
            return self.kilometraje_final - self.kilometraje_inicial
        return None

    @property
    def duracion_horas(self):
        """Calcula duración en horas."""
        if self.fecha_inicio and self.fecha_fin:
            delta = self.fecha_fin - self.fecha_inicio
            return delta.total_seconds() / 3600  # Convertir a horas
        return None

    @property
    def tiene_liquidacion(self):
        """Verifica si tiene liquidacion asociada."""
        return hasattr(self, 'liquidacion') and self.liquidacion is not None

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que fecha_fin sea posterior a fecha_inicio
        if self.fecha_inicio and self.fecha_fin:
            if self.fecha_fin < self.fecha_inicio:
                raise ValidationError({
                    'fecha_fin': 'La fecha de finalización debe ser posterior a la fecha de inicio'
                })

        # Validar kilometraje
        if self.kilometraje_inicial and self.kilometraje_final:
            if self.kilometraje_final < self.kilometraje_inicial:
                raise ValidationError({
                    'kilometraje_final': 'El kilometraje final debe ser mayor o igual al inicial'
                })

        # Validar cantidad recolectada
        if self.cantidad_recolectada is not None and self.cantidad_recolectada <= 0:
            raise ValidationError({
                'cantidad_recolectada': 'La cantidad debe ser mayor a cero'
            })


class Liquidacion(models.Model):
    """
    Liquidación económica de la operación.

    Calcula el valor a pagar al proveedor por la materia prima
    recolectada/comprada según la ejecución real.
    """
    ejecucion = models.OneToOneField(
        Ejecucion,
        on_delete=models.PROTECT,
        related_name='liquidacion',
        verbose_name='Ejecución'
    )

    # Datos de liquidación
    fecha_liquidacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de liquidación'
    )

    precio_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Precio unitario',
        help_text='Precio por unidad de medida acordado con el proveedor'
    )
    cantidad = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name='Cantidad',
        help_text='Cantidad a liquidar (debe coincidir con cantidad recolectada)'
    )
    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False,
        verbose_name='Subtotal',
        help_text='Calculado automáticamente: precio_unitario * cantidad'
    )

    # Deducciones
    deducciones = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Deducciones',
        help_text='Monto total de deducciones aplicadas'
    )
    detalle_deducciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Detalle de deducciones',
        help_text='Descripción detallada de las deducciones aplicadas'
    )

    # Valor total
    valor_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False,
        verbose_name='Valor total',
        help_text='Calculado automáticamente: subtotal - deducciones'
    )

    # Responsables
    liquidado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='liquidaciones_realizadas',
        verbose_name='Liquidado por',
        help_text='Usuario que realizó la liquidación'
    )
    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='liquidaciones_aprobadas',
        verbose_name='Aprobado por',
        help_text='Usuario que aprobó la liquidación'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de aprobación'
    )

    # Estado (dinámico)
    estado = models.ForeignKey(
        EstadoLiquidacion,
        on_delete=models.PROTECT,
        related_name='liquidaciones',
        verbose_name='Estado'
    )

    # Integración contable
    genera_cxp = models.BooleanField(
        default=False,
        verbose_name='Genera cuenta por pagar',
        help_text='Indica si esta liquidación genera una cuenta por pagar en contabilidad'
    )
    numero_cxp = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Número de CxP',
        help_text='Número de la cuenta por pagar generada (si aplica)'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones de liquidación'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_liquidacion'
        verbose_name = 'Liquidación'
        verbose_name_plural = 'Liquidaciones'
        ordering = ['-fecha_liquidacion', '-created_at']
        indexes = [
            models.Index(fields=['ejecucion']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_liquidacion']),
            models.Index(fields=['liquidado_por']),
            models.Index(fields=['aprobado_por']),
            models.Index(fields=['genera_cxp']),
        ]

    def __str__(self):
        return f"Liquidación {self.ejecucion.programacion.codigo} - ${self.valor_total}"

    def calcular_totales(self):
        """Calcula subtotal y valor total."""
        if self.precio_unitario and self.cantidad:
            self.subtotal = Decimal(str(self.precio_unitario)) * Decimal(str(self.cantidad))
            self.valor_total = self.subtotal - Decimal(str(self.deducciones or 0))

    @property
    def proveedor(self):
        """Obtiene el proveedor de la programación."""
        return self.ejecucion.programacion.proveedor

    @property
    def puede_editar(self):
        """Verifica si la liquidación puede editarse según su estado."""
        return self.estado.permite_edicion if self.estado else True

    @property
    def esta_aprobada(self):
        """Verifica si la liquidación está aprobada."""
        return self.aprobado_por is not None and self.fecha_aprobacion is not None

    def aprobar(self, usuario):
        """Aprueba la liquidación."""
        self.aprobado_por = usuario
        self.fecha_aprobacion = timezone.now()

        # Cambiar estado a APROBADA si existe ese estado
        try:
            estado_aprobada = EstadoLiquidacion.objects.get(codigo='APROBADA', is_active=True)
            self.estado = estado_aprobada
        except EstadoLiquidacion.DoesNotExist:
            pass

        self.save()

    def save(self, *args, **kwargs):
        """Calcula totales automáticamente antes de guardar."""
        self.calcular_totales()
        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que la cantidad coincida con la cantidad recolectada
        if self.ejecucion and self.cantidad:
            if self.cantidad != self.ejecucion.cantidad_recolectada:
                raise ValidationError({
                    'cantidad': f'La cantidad debe coincidir con la cantidad recolectada ({self.ejecucion.cantidad_recolectada})'
                })

        # Validar que precio unitario sea positivo
        if self.precio_unitario is not None and self.precio_unitario <= 0:
            raise ValidationError({
                'precio_unitario': 'El precio unitario debe ser mayor a cero'
            })

        # Validar que deducciones no sean mayores al subtotal
        if self.precio_unitario and self.cantidad and self.deducciones:
            subtotal_calc = Decimal(str(self.precio_unitario)) * Decimal(str(self.cantidad))
            if Decimal(str(self.deducciones)) > subtotal_calc:
                raise ValidationError({
                    'deducciones': 'Las deducciones no pueden ser mayores al subtotal'
                })

        # Validar que no se pueda editar si el estado no lo permite
        if self.pk and self.estado and not self.estado.permite_edicion:
            # Verificar si hubo cambios en campos críticos
            original = Liquidacion.objects.get(pk=self.pk)
            campos_criticos = ['precio_unitario', 'cantidad', 'deducciones']

            for campo in campos_criticos:
                if getattr(self, campo) != getattr(original, campo):
                    raise ValidationError(
                        f'No se puede modificar la liquidación en estado {self.estado.nombre}'
                    )
