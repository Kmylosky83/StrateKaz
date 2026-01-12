"""
Modelos para Procesamiento de Materia Prima - Production Ops
Sistema de Gestión StrateKaz

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.

Gestiona:
- Órdenes de producción para procesamiento de huesos, sebo y grasa
- Lotes de producción con trazabilidad completa
- Consumo de materia prima desde recepción
- Control de calidad en proceso
- Multi-tenant (empresa_id en todos los modelos)

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal

from apps.core.base_models import BaseCompanyModel, OrderedModel


# ==============================================================================
# MODELOS DE CATÁLOGO DINÁMICO
# ==============================================================================

class TipoProceso(OrderedModel):
    """
    Tipo de proceso de producción (catálogo dinámico).

    Ejemplos:
    - COCCION_HUESO
    - FUNDICION_SEBO
    - REFINACION_GRASA
    - MOLIENDA
    - PRENSADO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de proceso (ej: COCCION_HUESO)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de proceso'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )

    # Parámetros del proceso
    tiempo_estimado_horas = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Tiempo estimado (horas)',
        help_text='Duración estimada del proceso en horas'
    )
    requiere_temperatura = models.BooleanField(
        default=False,
        verbose_name='Requiere control de temperatura',
        help_text='Indica si este proceso requiere medición de temperatura'
    )
    requiere_presion = models.BooleanField(
        default=False,
        verbose_name='Requiere control de presión',
        help_text='Indica si este proceso requiere medición de presión'
    )

    # Producto resultante
    producto_resultante = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Producto resultante',
        help_text='Tipo de producto que resulta de este proceso (ej: Harina de hueso, Sebo refinado)'
    )

    # Estado
    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'production_ops_tipo_proceso'
        verbose_name = 'Tipo de Proceso'
        verbose_name_plural = 'Tipos de Proceso'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['activo']),
        ]

    def __str__(self):
        return self.nombre

    def clean(self):
        super().clean()
        # Validar que código sea uppercase
        if self.codigo:
            self.codigo = self.codigo.upper().replace(' ', '_')


class EstadoProceso(OrderedModel):
    """
    Estado del proceso de producción (catálogo dinámico).

    Ejemplos:
    - PROGRAMADA (orden creada)
    - EN_PROCESO (en ejecución)
    - COMPLETADA (proceso finalizado)
    - PAUSADA
    - CANCELADA
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
    color = models.CharField(
        max_length=7,
        default='#6C757D',
        verbose_name='Color (HEX)',
        help_text='Color para visualización (ej: #28A745 para verde)'
    )

    # Configuración de flujo
    es_inicial = models.BooleanField(
        default=False,
        verbose_name='Es estado inicial',
        help_text='Estado por defecto para nuevas órdenes'
    )
    es_final = models.BooleanField(
        default=False,
        verbose_name='Es estado final',
        help_text='Indica que el proceso ha terminado (completado o cancelado)'
    )
    permite_edicion = models.BooleanField(
        default=True,
        verbose_name='Permite edición',
        help_text='Indica si la orden puede editarse en este estado'
    )

    # Estado
    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'production_ops_estado_proceso'
        verbose_name = 'Estado de Proceso'
        verbose_name_plural = 'Estados de Proceso'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['activo']),
            models.Index(fields=['es_inicial']),
        ]

    def __str__(self):
        return self.nombre


class LineaProduccion(BaseCompanyModel, OrderedModel):
    """
    Línea de producción física.

    Representa las líneas/equipos disponibles para procesamiento.

    Ejemplos:
    - LINEA_COCCION_1
    - PRENSA_HIDRAULICA_A
    - REFINADORA_PRINCIPAL
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único de la línea de producción'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    ubicacion = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Ubicación física',
        help_text='Descripción de la ubicación dentro de la planta'
    )

    # Capacidad
    capacidad_kg_hora = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Capacidad (KG/hora)',
        help_text='Capacidad de procesamiento en kilogramos por hora'
    )

    # Compatibilidad con tipos de proceso
    tipo_proceso_compatible = models.ManyToManyField(
        TipoProceso,
        related_name='lineas_compatibles',
        blank=True,
        verbose_name='Tipos de proceso compatibles',
        help_text='Tipos de proceso que se pueden ejecutar en esta línea'
    )

    class Meta:
        db_table = 'production_ops_linea_produccion'
        verbose_name = 'Línea de Producción'
        verbose_name_plural = 'Líneas de Producción'
        ordering = ['empresa', 'orden', 'nombre']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

    @property
    def cantidad_tipos_compatibles(self):
        """Retorna la cantidad de tipos de proceso compatibles."""
        return self.tipo_proceso_compatible.filter(activo=True).count()

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que código sea uppercase
        if self.codigo:
            self.codigo = self.codigo.upper().replace(' ', '_')


# ==============================================================================
# MODELOS PRINCIPALES DE PROCESAMIENTO
# ==============================================================================

class OrdenProduccion(BaseCompanyModel):
    """
    Orden de producción - Modelo principal.

    Registra la planificación y ejecución de procesos productivos
    para transformar materia prima en productos intermedios o finales.
    """
    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código de orden',
        help_text='Código autogenerado de la orden de producción'
    )

    # Fechas
    fecha_programada = models.DateField(
        verbose_name='Fecha programada',
        help_text='Fecha en que se planifica ejecutar el proceso'
    )
    fecha_inicio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha y hora de inicio real',
        help_text='Momento en que realmente inició el proceso'
    )
    fecha_fin = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha y hora de finalización',
        help_text='Momento en que finalizó el proceso'
    )

    # Configuración del proceso
    tipo_proceso = models.ForeignKey(
        TipoProceso,
        on_delete=models.PROTECT,
        related_name='ordenes',
        verbose_name='Tipo de proceso'
    )
    linea_produccion = models.ForeignKey(
        LineaProduccion,
        on_delete=models.PROTECT,
        related_name='ordenes',
        verbose_name='Línea de producción asignada'
    )
    estado = models.ForeignKey(
        EstadoProceso,
        on_delete=models.PROTECT,
        related_name='ordenes',
        verbose_name='Estado'
    )

    # Origen de la materia prima (opcional - puede venir de recepción)
    recepcion_origen = models.ForeignKey(
        'recepcion.Recepcion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordenes_procesamiento',
        verbose_name='Recepción de origen',
        help_text='Recepción de materia prima asociada (si aplica)'
    )

    # Cantidades
    cantidad_programada = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Cantidad programada (KG)',
        help_text='Cantidad de materia prima a procesar planificada'
    )
    cantidad_real = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name='Cantidad real procesada (KG)',
        help_text='Cantidad real de materia prima procesada'
    )

    # Prioridad
    prioridad = models.PositiveSmallIntegerField(
        default=3,
        verbose_name='Prioridad',
        help_text='Prioridad de la orden (1=Muy Alta, 2=Alta, 3=Media, 4=Baja, 5=Muy Baja)',
        choices=[
            (1, 'Muy Alta'),
            (2, 'Alta'),
            (3, 'Media'),
            (4, 'Baja'),
            (5, 'Muy Baja'),
        ]
    )

    # Responsable
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ordenes_produccion_responsable',
        verbose_name='Responsable',
        help_text='Usuario responsable de ejecutar la orden'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones generales'
    )

    class Meta:
        db_table = 'production_ops_orden_produccion'
        verbose_name = 'Orden de Producción'
        verbose_name_plural = 'Órdenes de Producción'
        ordering = ['-fecha_programada', '-prioridad', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['empresa', 'fecha_programada']),
            models.Index(fields=['tipo_proceso', 'fecha_programada']),
            models.Index(fields=['estado']),
            models.Index(fields=['linea_produccion', 'fecha_programada']),
            models.Index(fields=['prioridad']),
            models.Index(fields=['recepcion_origen']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.tipo_proceso.nombre} - {self.fecha_programada}"

    @staticmethod
    def generar_codigo(empresa_id):
        """Genera código único de orden de producción desde gestión documental."""
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        return ConsecutivoConfig.obtener_siguiente_consecutivo(
            'ORDEN_PRODUCCION',
            empresa_id=empresa_id
        )

    @property
    def duracion_proceso_horas(self):
        """Calcula la duración real del proceso en horas."""
        if self.fecha_inicio and self.fecha_fin:
            delta = self.fecha_fin - self.fecha_inicio
            return round(delta.total_seconds() / 3600, 2)  # horas
        return None

    @property
    def porcentaje_completado(self):
        """Calcula el porcentaje de completado basado en cantidad real vs programada."""
        if self.cantidad_programada and self.cantidad_real:
            return round((self.cantidad_real / self.cantidad_programada) * 100, 2)
        return Decimal('0.00')

    @property
    def tiene_lotes(self):
        """Verifica si tiene lotes de producción."""
        return self.lotes.exists()

    @property
    def cantidad_lotes(self):
        """Retorna la cantidad de lotes generados."""
        return self.lotes.count()

    @property
    def total_cantidad_producida(self):
        """Suma total de cantidad producida en lotes."""
        from django.db.models import Sum
        return self.lotes.aggregate(
            total=Sum('cantidad_salida')
        )['total'] or Decimal('0.00')

    @property
    def rendimiento_promedio(self):
        """Calcula el rendimiento promedio de los lotes."""
        from django.db.models import Avg
        return self.lotes.aggregate(
            promedio=Avg('porcentaje_rendimiento')
        )['promedio'] or Decimal('0.00')

    def iniciar_proceso(self, usuario=None):
        """Inicia la ejecución del proceso."""
        if self.estado.codigo != 'PROGRAMADA':
            raise ValidationError('Solo se pueden iniciar órdenes en estado PROGRAMADA')

        self.fecha_inicio = timezone.now()

        # Cambiar a estado EN_PROCESO
        estado_en_proceso = EstadoProceso.objects.filter(
            codigo='EN_PROCESO',
            activo=True
        ).first()

        if estado_en_proceso:
            self.estado = estado_en_proceso

        if usuario:
            self.updated_by = usuario

        self.save(update_fields=['fecha_inicio', 'estado', 'updated_by', 'updated_at'])

    def finalizar_proceso(self, usuario=None):
        """Finaliza el proceso."""
        if self.estado.codigo != 'EN_PROCESO':
            raise ValidationError('Solo se pueden finalizar órdenes en estado EN_PROCESO')

        self.fecha_fin = timezone.now()

        # Cambiar a estado COMPLETADA
        estado_completada = EstadoProceso.objects.filter(
            codigo='COMPLETADA',
            activo=True
        ).first()

        if estado_completada:
            self.estado = estado_completada

        if usuario:
            self.updated_by = usuario

        self.save(update_fields=['fecha_fin', 'estado', 'updated_by', 'updated_at'])

    def save(self, *args, **kwargs):
        """Override de save para auto-generar código."""
        # Generar código si no existe
        if not self.pk and not self.codigo:
            self.codigo = self.generar_codigo(self.empresa_id)

        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que la línea pertenezca a la misma empresa
        if self.linea_produccion and self.empresa:
            if self.linea_produccion.empresa_id != self.empresa_id:
                raise ValidationError({
                    'linea_produccion': 'La línea de producción debe pertenecer a la misma empresa'
                })

        # Validar compatibilidad de tipo de proceso con línea
        if self.tipo_proceso and self.linea_produccion:
            if self.linea_produccion.tipo_proceso_compatible.exists():
                if not self.linea_produccion.tipo_proceso_compatible.filter(
                    id=self.tipo_proceso.id
                ).exists():
                    raise ValidationError({
                        'tipo_proceso': f'El tipo de proceso {self.tipo_proceso.nombre} '
                                       f'no es compatible con la línea {self.linea_produccion.nombre}'
                    })

        # Validar que cantidad sea positiva
        if self.cantidad_programada is not None and self.cantidad_programada <= 0:
            raise ValidationError({
                'cantidad_programada': 'La cantidad programada debe ser mayor a cero'
            })

        # Validar que fecha fin sea posterior a fecha inicio
        if self.fecha_inicio and self.fecha_fin:
            if self.fecha_fin < self.fecha_inicio:
                raise ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio'
                })


class LoteProduccion(models.Model):
    """
    Lote de producción generado.

    Registra cada lote producido dentro de una orden de producción,
    con trazabilidad de materia prima consumida y producto obtenido.
    """
    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código de lote',
        help_text='Código autogenerado del lote: LOTE-PROC-YYYYMMDD-NNNN'
    )

    # Orden de producción asociada
    orden_produccion = models.ForeignKey(
        OrdenProduccion,
        on_delete=models.CASCADE,
        related_name='lotes',
        verbose_name='Orden de producción'
    )

    # Materia prima entrada
    materia_prima_entrada = models.CharField(
        max_length=200,
        verbose_name='Tipo de materia prima entrada',
        help_text='Descripción del tipo de materia prima procesada'
    )
    cantidad_entrada = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Cantidad entrada (KG)',
        help_text='Cantidad de materia prima ingresada al proceso'
    )

    # Producto salida
    producto_salida = models.CharField(
        max_length=200,
        verbose_name='Tipo de producto salida',
        help_text='Descripción del producto obtenido'
    )
    cantidad_salida = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Cantidad salida (KG)',
        help_text='Cantidad de producto obtenido'
    )

    # Merma y rendimiento
    merma_kg = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        editable=False,
        verbose_name='Merma (KG)',
        help_text='Calculado automáticamente: cantidad_entrada - cantidad_salida'
    )
    porcentaje_rendimiento = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        editable=False,
        verbose_name='Rendimiento (%)',
        help_text='Calculado automáticamente: (cantidad_salida / cantidad_entrada) * 100'
    )

    # Fecha y hora de producción
    fecha_produccion = models.DateField(
        verbose_name='Fecha de producción'
    )
    hora_inicio = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora de inicio del lote'
    )
    hora_fin = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora de finalización del lote'
    )

    # Operador
    operador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='lotes_produccion_operados',
        verbose_name='Operador',
        help_text='Usuario que operó la producción del lote'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'production_ops_lote_produccion'
        verbose_name = 'Lote de Producción'
        verbose_name_plural = 'Lotes de Producción'
        ordering = ['-fecha_produccion', '-created_at']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['orden_produccion', 'fecha_produccion']),
            models.Index(fields=['fecha_produccion']),
            models.Index(fields=['operador']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.producto_salida}: {self.cantidad_salida} KG"

    @staticmethod
    def generar_codigo():
        """Genera código único de lote de producción desde gestión documental."""
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        return ConsecutivoConfig.obtener_siguiente_consecutivo('LOTE_PRODUCCION')

    @property
    def duracion_produccion_horas(self):
        """Calcula la duración de la producción del lote en horas."""
        if self.hora_inicio and self.hora_fin:
            from datetime import datetime, timedelta
            inicio = datetime.combine(self.fecha_produccion, self.hora_inicio)
            fin = datetime.combine(self.fecha_produccion, self.hora_fin)

            # Manejar caso de fin al día siguiente
            if fin < inicio:
                fin += timedelta(days=1)

            delta = fin - inicio
            return round(delta.total_seconds() / 3600, 2)  # horas
        return None

    @property
    def tiene_consumos(self):
        """Verifica si tiene consumos de materia prima registrados."""
        return self.consumos.exists()

    @property
    def total_costo_materia_prima(self):
        """Suma total del costo de materia prima consumida."""
        from django.db.models import Sum
        return self.consumos.aggregate(
            total=Sum('costo_total')
        )['total'] or Decimal('0.00')

    @property
    def tiene_controles_calidad(self):
        """Verifica si tiene controles de calidad."""
        return self.controles_calidad.exists()

    @property
    def todos_controles_cumplen(self):
        """Verifica si todos los controles de calidad cumplen."""
        if not self.tiene_controles_calidad:
            return None
        return not self.controles_calidad.filter(cumple=False).exists()

    def calcular_merma(self):
        """Calcula la merma del lote."""
        if self.cantidad_entrada and self.cantidad_salida:
            self.merma_kg = self.cantidad_entrada - self.cantidad_salida

    def calcular_rendimiento(self):
        """Calcula el porcentaje de rendimiento del lote."""
        if self.cantidad_entrada and self.cantidad_salida:
            if self.cantidad_entrada > 0:
                rendimiento = (self.cantidad_salida / self.cantidad_entrada) * 100
                self.porcentaje_rendimiento = round(rendimiento, 2)
            else:
                self.porcentaje_rendimiento = Decimal('0.00')

    def save(self, *args, **kwargs):
        """Override de save para auto-generar código y calcular valores."""
        # Generar código si no existe
        if not self.pk and not self.codigo:
            self.codigo = self.generar_codigo()

        # Calcular merma y rendimiento
        self.calcular_merma()
        self.calcular_rendimiento()

        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que cantidades sean positivas
        if self.cantidad_entrada is not None and self.cantidad_entrada <= 0:
            raise ValidationError({
                'cantidad_entrada': 'La cantidad de entrada debe ser mayor a cero'
            })

        if self.cantidad_salida is not None and self.cantidad_salida < 0:
            raise ValidationError({
                'cantidad_salida': 'La cantidad de salida no puede ser negativa'
            })

        # Validar que cantidad de salida no exceda entrada
        if self.cantidad_entrada and self.cantidad_salida:
            if self.cantidad_salida > self.cantidad_entrada:
                raise ValidationError({
                    'cantidad_salida': 'La cantidad de salida no puede ser mayor a la entrada'
                })


class ConsumoMateriaPrima(models.Model):
    """
    Consumo de materia prima en un lote de producción.

    Registra las materias primas consumidas en la producción de un lote,
    con trazabilidad de lotes de origen desde recepción.
    """
    lote_produccion = models.ForeignKey(
        LoteProduccion,
        on_delete=models.CASCADE,
        related_name='consumos',
        verbose_name='Lote de producción'
    )

    # Tipo de materia prima consumida
    tipo_materia_prima = models.ForeignKey(
        'gestion_proveedores.TipoMateriaPrima',
        on_delete=models.PROTECT,
        related_name='consumos_procesamiento',
        verbose_name='Tipo de materia prima'
    )

    # Cantidad consumida
    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Cantidad consumida',
        help_text='Cantidad de materia prima consumida'
    )
    unidad_medida = models.CharField(
        max_length=20,
        default='KG',
        verbose_name='Unidad de medida',
        help_text='Unidad de medida (KG, TON, LT, etc.)'
    )

    # Costeo
    costo_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Costo unitario',
        help_text='Costo por unidad de medida'
    )
    costo_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False,
        verbose_name='Costo total',
        help_text='Calculado automáticamente: cantidad * costo_unitario'
    )

    # Trazabilidad
    lote_origen = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Lote de origen',
        help_text='Código de lote desde recepción (trazabilidad)'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'production_ops_consumo_materia_prima'
        verbose_name = 'Consumo de Materia Prima'
        verbose_name_plural = 'Consumos de Materia Prima'
        ordering = ['lote_produccion', 'id']
        indexes = [
            models.Index(fields=['lote_produccion']),
            models.Index(fields=['tipo_materia_prima']),
            models.Index(fields=['lote_origen']),
        ]

    def __str__(self):
        return f"{self.lote_produccion.codigo} - {self.tipo_materia_prima.nombre}: {self.cantidad} {self.unidad_medida}"

    def calcular_costo_total(self):
        """Calcula el costo total del consumo."""
        if self.cantidad and self.costo_unitario:
            self.costo_total = Decimal(str(self.cantidad)) * Decimal(str(self.costo_unitario))

    def save(self, *args, **kwargs):
        """Override de save para auto-calcular costo total."""
        # Calcular costo total
        self.calcular_costo_total()

        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que cantidad sea positiva
        if self.cantidad is not None and self.cantidad <= 0:
            raise ValidationError({
                'cantidad': 'La cantidad debe ser mayor a cero'
            })

        # Validar que costo unitario sea positivo
        if self.costo_unitario is not None and self.costo_unitario < 0:
            raise ValidationError({
                'costo_unitario': 'El costo unitario no puede ser negativo'
            })


class ControlCalidadProceso(models.Model):
    """
    Control de calidad en proceso de producción.

    Registra las verificaciones de calidad realizadas durante el procesamiento,
    con parámetros configurables dinámicamente.
    """
    lote_produccion = models.ForeignKey(
        LoteProduccion,
        on_delete=models.CASCADE,
        related_name='controles_calidad',
        verbose_name='Lote de producción'
    )

    # Parámetro controlado (dinámico)
    parametro = models.CharField(
        max_length=100,
        verbose_name='Parámetro de control',
        help_text='Parámetro evaluado (ej: temperatura, presion, tiempo, humedad, acidez_final)',
        choices=[
            ('temperatura', 'Temperatura'),
            ('presion', 'Presión'),
            ('tiempo', 'Tiempo de proceso'),
            ('humedad', 'Humedad'),
            ('acidez_final', 'Acidez final'),
            ('color', 'Color'),
            ('textura', 'Textura'),
            ('granulometria', 'Granulometría'),
            ('otro', 'Otro'),
        ]
    )

    # Valores de control
    valor_minimo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Valor mínimo',
        help_text='Valor mínimo aceptable del parámetro'
    )
    valor_maximo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Valor máximo',
        help_text='Valor máximo aceptable del parámetro'
    )
    valor_obtenido = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Valor obtenido',
        help_text='Valor real medido del parámetro'
    )

    # Resultado
    cumple = models.BooleanField(
        editable=False,
        verbose_name='Cumple especificación',
        help_text='Calculado automáticamente: valor_obtenido dentro del rango'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones del control'
    )

    # Responsable de la verificación
    verificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='controles_calidad_proceso_verificados',
        verbose_name='Verificado por',
        help_text='Usuario que realizó la verificación'
    )
    fecha_verificacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de verificación'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'production_ops_control_calidad_proceso'
        verbose_name = 'Control de Calidad de Proceso'
        verbose_name_plural = 'Controles de Calidad de Proceso'
        ordering = ['lote_produccion', 'fecha_verificacion']
        indexes = [
            models.Index(fields=['lote_produccion']),
            models.Index(fields=['parametro']),
            models.Index(fields=['cumple']),
            models.Index(fields=['fecha_verificacion']),
        ]

    def __str__(self):
        estado = "✓ Cumple" if self.cumple else "✗ No cumple"
        return f"{self.lote_produccion.codigo} - {self.get_parametro_display()}: {estado}"

    @property
    def estado_cumplimiento(self):
        """Retorna texto del estado de cumplimiento."""
        return "CUMPLE" if self.cumple else "NO_CUMPLE"

    def evaluar_cumplimiento(self):
        """Evalúa si el valor obtenido cumple con el rango especificado."""
        if self.valor_obtenido is None:
            self.cumple = False
            return

        # Si no hay límites definidos, se considera que cumple
        if self.valor_minimo is None and self.valor_maximo is None:
            self.cumple = True
            return

        # Verificar rango
        cumple_min = True
        cumple_max = True

        if self.valor_minimo is not None:
            cumple_min = self.valor_obtenido >= self.valor_minimo

        if self.valor_maximo is not None:
            cumple_max = self.valor_obtenido <= self.valor_maximo

        self.cumple = cumple_min and cumple_max

    def save(self, *args, **kwargs):
        """Override de save para auto-evaluar cumplimiento."""
        # Evaluar cumplimiento
        self.evaluar_cumplimiento()

        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que si hay mínimo y máximo, mínimo sea menor que máximo
        if self.valor_minimo is not None and self.valor_maximo is not None:
            if self.valor_minimo > self.valor_maximo:
                raise ValidationError({
                    'valor_minimo': 'El valor mínimo debe ser menor que el valor máximo'
                })

        # Normalizar parámetro a lowercase
        if self.parametro:
            self.parametro = self.parametro.lower().strip()
