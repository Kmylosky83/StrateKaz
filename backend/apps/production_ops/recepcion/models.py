"""
Modelos para Recepción de Materia Prima - Production Ops
Sistema de Gestión StrateKaz

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.

Gestiona:
- Recepción de huesos, sebo, grasa y subproductos cárnicos
- Control de calidad en recepción (acidez, temperatura, pesaje)
- Integración con proveedores y programación de abastecimiento
- Trazabilidad completa con lotes
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

class TipoRecepcion(OrderedModel):
    """
    Tipo de recepción de materia prima (catálogo dinámico).

    Ejemplos:
    - RECEPCION_HUESO_CRUDO
    - RECEPCION_SEBO_PROCESADO
    - RECEPCION_GRASA_CRUDA
    - RECEPCION_SUBPRODUCTOS
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de recepción (ej: RECEPCION_HUESO_CRUDO)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de recepción'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )

    # Controles requeridos según tipo
    requiere_pesaje = models.BooleanField(
        default=True,
        verbose_name='Requiere pesaje',
        help_text='Indica si este tipo requiere registro de peso bruto/neto/tara'
    )
    requiere_acidez = models.BooleanField(
        default=False,
        verbose_name='Requiere medición de acidez',
        help_text='Indica si este tipo requiere prueba de acidez (sebo procesado)'
    )
    requiere_temperatura = models.BooleanField(
        default=False,
        verbose_name='Requiere medición de temperatura',
        help_text='Indica si este tipo requiere registro de temperatura'
    )
    requiere_control_calidad = models.BooleanField(
        default=True,
        verbose_name='Requiere control de calidad',
        help_text='Indica si este tipo requiere controles de calidad adicionales'
    )

    # Estado
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'production_ops_tipo_recepcion'
        verbose_name = 'Tipo de Recepción'
        verbose_name_plural = 'Tipos de Recepción'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.nombre

    def clean(self):
        super().clean()
        # Validar que código sea uppercase
        if self.codigo:
            self.codigo = self.codigo.upper().replace(' ', '_')


class EstadoRecepcion(OrderedModel):
    """
    Estado del proceso de recepción (catálogo dinámico).

    Ejemplos:
    - PENDIENTE (recepción programada)
    - EN_RECEPCION (en proceso de descarga y pesaje)
    - CONTROL_CALIDAD (en verificación de calidad)
    - COMPLETADA (recepción finalizada)
    - RECHAZADA (no cumple estándares)
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
        help_text='Estado por defecto para nuevas recepciones'
    )
    es_final = models.BooleanField(
        default=False,
        verbose_name='Es estado final',
        help_text='Indica que la recepción ha terminado (completada, rechazada o cancelada)'
    )
    permite_edicion = models.BooleanField(
        default=True,
        verbose_name='Permite edición',
        help_text='Indica si la recepción puede editarse en este estado'
    )
    genera_inventario = models.BooleanField(
        default=False,
        verbose_name='Genera inventario',
        help_text='Indica si al llegar a este estado se debe actualizar el inventario'
    )

    # Estado
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'production_ops_estado_recepcion'
        verbose_name = 'Estado de Recepción'
        verbose_name_plural = 'Estados de Recepción'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['is_active']),
            models.Index(fields=['es_inicial']),
        ]

    def __str__(self):
        return self.nombre


class PuntoRecepcion(BaseCompanyModel, OrderedModel):
    """
    Punto físico de recepción de materia prima.

    Ejemplos:
    - BASCULA_PRINCIPAL
    - RAMPA_1
    - ZONA_DESCARGA_A
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del punto de recepción'
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

    # Capacidad y recursos
    capacidad_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Capacidad en KG',
        help_text='Capacidad máxima de recepción en kilogramos'
    )
    bascula_asignada = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Báscula asignada',
        help_text='Identificación de la báscula asociada a este punto'
    )

    class Meta:
        db_table = 'production_ops_punto_recepcion'
        verbose_name = 'Punto de Recepción'
        verbose_name_plural = 'Puntos de Recepción'
        ordering = ['empresa', 'orden', 'nombre']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['empresa', 'is_active']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


# ==============================================================================
# MODELOS PRINCIPALES DE RECEPCIÓN
# ==============================================================================

class Recepcion(BaseCompanyModel):
    """
    Recepción de materia prima - Modelo principal.

    Registra la recepción de huesos, sebo, grasa y subproductos cárnicos
    desde proveedores externos o unidades de negocio internas.
    """
    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código de recepción',
        help_text='Código autogenerado de la recepción'
    )

    # Fechas y horas
    fecha = models.DateField(
        verbose_name='Fecha de recepción',
        help_text='Fecha de la recepción'
    )
    hora_llegada = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora de llegada',
        help_text='Hora en que llegó el vehículo a la planta'
    )
    hora_salida = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Hora de salida',
        help_text='Hora en que salió el vehículo de la planta'
    )

    # Relaciones externas — Desacoplado de Supply Chain (Sprint M1)
    proveedor_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Proveedor',
        help_text='ID del proveedor que entrega la materia prima (supply_chain.Proveedor)'
    )
    proveedor_nombre = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nombre Proveedor',
        help_text='Cache: nombre comercial del proveedor'
    )
    programacion_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Programación',
        help_text='ID de la programación de abastecimiento asociada (supply_chain.Programacion)'
    )

    # Configuración de recepción
    tipo_recepcion = models.ForeignKey(
        TipoRecepcion,
        on_delete=models.PROTECT,
        related_name='recepciones',
        verbose_name='Tipo de recepción'
    )
    punto_recepcion = models.ForeignKey(
        PuntoRecepcion,
        on_delete=models.PROTECT,
        related_name='recepciones',
        verbose_name='Punto de recepción',
        help_text='Ubicación física donde se realiza la recepción'
    )
    estado = models.ForeignKey(
        EstadoRecepcion,
        on_delete=models.PROTECT,
        related_name='recepciones',
        verbose_name='Estado'
    )

    # Información del transporte
    vehiculo_proveedor = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Vehículo del proveedor',
        help_text='Placa o identificación del vehículo (ej: ABC123)'
    )
    conductor_proveedor = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Conductor del proveedor',
        help_text='Nombre del conductor que entrega la materia prima'
    )

    # Pesaje (si aplica)
    peso_bruto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Peso bruto (KG)',
        help_text='Peso del vehículo cargado'
    )
    peso_tara = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Tara (KG)',
        help_text='Peso del vehículo vacío'
    )
    peso_neto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False,
        verbose_name='Peso neto (KG)',
        help_text='Calculado automáticamente: peso_bruto - peso_tara'
    )

    # Control de temperatura (si aplica)
    temperatura_llegada = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Temperatura de llegada (°C)',
        help_text='Temperatura de la materia prima al momento de recepción'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones generales'
    )

    # Responsable
    recibido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='recepciones_recibidas',
        verbose_name='Recibido por',
        help_text='Usuario que registró la recepción'
    )

    class Meta:
        db_table = 'production_ops_recepcion'
        verbose_name = 'Recepción de Materia Prima'
        verbose_name_plural = 'Recepciones de Materia Prima'
        ordering = ['-fecha', '-created_at']
        indexes = [
            models.Index(fields=['empresa', 'codigo']),
            models.Index(fields=['empresa', 'fecha']),
            models.Index(fields=['proveedor_id', 'fecha']),
            models.Index(fields=['estado']),
            models.Index(fields=['programacion_id']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.proveedor_nombre or 'N/A'} - {self.fecha}"

    @staticmethod
    def generar_codigo(empresa_id=None):
        """Genera código REC-YYYY-NNNNN (Sistema A). empresa_id legacy, ignorado."""
        from apps.core.utils.consecutivos import siguiente_consecutivo_scan
        return siguiente_consecutivo_scan(
            Recepcion.objects.all(),
            campo_codigo='codigo',
            prefix='REC',
            padding=5,
            include_year=True,
        )

    @property
    def peso_neto_calculado(self):
        """Calcula el peso neto si existe bruto y tara."""
        if self.peso_bruto is not None and self.peso_tara is not None:
            return self.peso_bruto - self.peso_tara
        return None

    @property
    def duracion_recepcion(self):
        """Calcula la duración de la recepción en minutos."""
        if self.hora_llegada and self.hora_salida:
            from datetime import datetime, timedelta
            llegada = datetime.combine(self.fecha, self.hora_llegada)
            salida = datetime.combine(self.fecha, self.hora_salida)

            # Manejar caso de salida al día siguiente
            if salida < llegada:
                salida += timedelta(days=1)

            delta = salida - llegada
            return int(delta.total_seconds() / 60)  # minutos
        return None

    @property
    def tiene_detalles(self):
        """Verifica si tiene líneas de detalle."""
        return self.detalles.exists()

    @property
    def total_cantidad_detalles(self):
        """Suma total de cantidades de los detalles."""
        return self.detalles.aggregate(
            total=models.Sum('cantidad')
        )['total'] or Decimal('0.00')

    @property
    def total_valor_detalles(self):
        """Suma total del valor de los detalles."""
        return self.detalles.aggregate(
            total=models.Sum('subtotal')
        )['total'] or Decimal('0.00')

    def calcular_peso_neto(self):
        """Calcula y actualiza el peso neto."""
        if self.peso_bruto is not None and self.peso_tara is not None:
            self.peso_neto = self.peso_bruto - self.peso_tara

    def cambiar_estado(self, nuevo_estado, usuario=None):
        """Cambia el estado de la recepción."""
        estado_anterior = self.estado
        self.estado = nuevo_estado

        if usuario:
            self.updated_by = usuario

        self.save(update_fields=['estado', 'updated_by', 'updated_at'])

        # Si el nuevo estado genera inventario, disparar señal
        if nuevo_estado.genera_inventario:
            # TODO: Implementar señal para actualizar inventario
            pass

        return estado_anterior

    def save(self, *args, **kwargs):
        """Override de save para auto-generar código y calcular peso neto."""
        # Generar código si no existe
        if not self.pk and not self.codigo:
            self.codigo = self.generar_codigo(self.empresa_id)

        # Calcular peso neto
        self.calcular_peso_neto()

        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que se tiene proveedor
        if not self.proveedor_id:
            raise ValidationError({
                'proveedor_id': 'Debe indicar el proveedor'
            })

        # Validar que el punto de recepción pertenezca a la misma empresa
        if self.punto_recepcion and self.empresa:
            if self.punto_recepcion.empresa_id != self.empresa_id:
                raise ValidationError({
                    'punto_recepcion': 'El punto de recepción debe pertenecer a la misma empresa'
                })

        # Validar pesaje si es requerido
        if self.tipo_recepcion and self.tipo_recepcion.requiere_pesaje:
            if self.peso_bruto is None:
                raise ValidationError({
                    'peso_bruto': f'El tipo de recepción {self.tipo_recepcion.nombre} requiere peso bruto'
                })
            if self.peso_tara is None:
                raise ValidationError({
                    'peso_tara': f'El tipo de recepción {self.tipo_recepcion.nombre} requiere tara'
                })

        # Validar que peso bruto sea mayor que tara
        if self.peso_bruto is not None and self.peso_tara is not None:
            if self.peso_bruto < self.peso_tara:
                raise ValidationError({
                    'peso_bruto': 'El peso bruto debe ser mayor que la tara'
                })

        # Validar que hora de salida sea posterior a hora de llegada (mismo día)
        if self.hora_llegada and self.hora_salida:
            if self.hora_salida < self.hora_llegada:
                # Permitir si es al día siguiente
                pass  # Se maneja en la propiedad duracion_recepcion


class DetalleRecepcion(models.Model):
    """
    Línea de detalle de una recepción.

    Registra los diferentes tipos de materia prima recibidos en una recepción,
    con sus cantidades, precios y controles de calidad específicos.
    """
    recepcion = models.ForeignKey(
        Recepcion,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Recepción'
    )

    # Desacoplado de Supply Chain (Sprint M1 — Modularización)
    tipo_materia_prima_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='ID Tipo Materia Prima',
        help_text='ID del tipo de materia prima (supply_chain.TipoMateriaPrima)'
    )
    tipo_materia_prima_nombre = models.CharField(
        max_length=150,
        blank=True,
        verbose_name='Nombre Tipo Materia Prima',
        help_text='Cache: nombre del tipo de materia prima'
    )

    # Cantidad
    cantidad = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Cantidad',
        help_text='Cantidad recibida de este tipo de materia prima'
    )
    unidad_medida = models.CharField(
        max_length=20,
        default='KG',
        verbose_name='Unidad de medida',
        help_text='Unidad de medida (KG, TON, LT, etc.)'
    )

    # Controles de calidad específicos (si aplica)
    acidez_medida = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Acidez medida (%)',
        help_text='Porcentaje de acidez medido (solo para sebo procesado)'
    )
    temperatura = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Temperatura (°C)',
        help_text='Temperatura específica de este lote'
    )

    # Precios y totales
    precio_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Precio unitario',
        help_text='Precio por unidad de medida'
    )
    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False,
        verbose_name='Subtotal',
        help_text='Calculado automáticamente: cantidad * precio_unitario'
    )

    # Trazabilidad
    lote_asignado = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Lote asignado',
        help_text='Código de lote para trazabilidad'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones del detalle'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'production_ops_detalle_recepcion'
        verbose_name = 'Detalle de Recepción'
        verbose_name_plural = 'Detalles de Recepción'
        ordering = ['recepcion', 'id']
        indexes = [
            models.Index(fields=['recepcion']),
            models.Index(fields=['tipo_materia_prima_id']),
            models.Index(fields=['lote_asignado']),
        ]

    def __str__(self):
        return f"{self.recepcion.codigo} - {self.tipo_materia_prima_nombre or 'N/A'}: {self.cantidad} {self.unidad_medida}"

    @property
    def cumple_acidez(self):
        """Verifica si la acidez está dentro del rango esperado.

        NOTA post-S7: TipoMateriaPrima fue eliminado. Los rangos de acidez
        son metadata especifica de industria rendering; se reimplementaran
        en production_ops cuando el modulo se active (via ProductoEspecCalidad
        o campo en Producto).
        """
        if self.acidez_medida is None:
            return None
        from django.apps import apps
        try:
            TipoMateriaPrima = apps.get_model('gestion_proveedores', 'TipoMateriaPrima')
        except LookupError:
            return None  # Modelo legacy eliminado; funcionalidad diferida a activacion de production_ops
        tipo = TipoMateriaPrima.objects.filter(id=self.tipo_materia_prima_id).first()
        if tipo and tipo.acidez_min is not None and tipo.acidez_max is not None:
            return tipo.acidez_min <= self.acidez_medida <= tipo.acidez_max
        return None

    def generar_lote(self):
        """Genera código de lote si no existe."""
        if not self.lote_asignado:
            from datetime import date
            hoy = date.today()
            tipo_codigo = (self.tipo_materia_prima_nombre or 'MAT')[:3].upper()
            fecha_str = hoy.strftime('%Y%m%d')

            # Buscar último lote del día para este tipo
            ultimo = DetalleRecepcion.objects.filter(
                lote_asignado__startswith=f"LOTE-{tipo_codigo}-{fecha_str}-",
                tipo_materia_prima_id=self.tipo_materia_prima_id
            ).order_by('-lote_asignado').first()

            if ultimo:
                try:
                    numero = int(ultimo.lote_asignado.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    numero = 1
            else:
                numero = 1

            self.lote_asignado = f"LOTE-{tipo_codigo}-{fecha_str}-{numero:04d}"

    def calcular_subtotal(self):
        """Calcula el subtotal."""
        if self.cantidad and self.precio_unitario:
            self.subtotal = Decimal(str(self.cantidad)) * Decimal(str(self.precio_unitario))

    def save(self, *args, **kwargs):
        """Override de save para auto-calcular subtotal y generar lote."""
        # Calcular subtotal
        self.calcular_subtotal()

        # Generar lote si no existe
        if not self.lote_asignado:
            self.generar_lote()

        super().save(*args, **kwargs)

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que cantidad sea positiva
        if self.cantidad is not None and self.cantidad <= 0:
            raise ValidationError({
                'cantidad': 'La cantidad debe ser mayor a cero'
            })

        # Validar que precio unitario sea positivo
        if self.precio_unitario is not None and self.precio_unitario <= 0:
            raise ValidationError({
                'precio_unitario': 'El precio unitario debe ser mayor a cero'
            })

        # Validar acidez si se requiere
        if self.recepcion and self.recepcion.tipo_recepcion.requiere_acidez:
            if self.acidez_medida is None:
                raise ValidationError({
                    'acidez_medida': 'Este tipo de recepción requiere medición de acidez'
                })


class ControlCalidadRecepcion(models.Model):
    """
    Control de calidad aplicado en la recepción.

    Registra las verificaciones de calidad realizadas sobre la materia prima
    recibida según parámetros configurables dinámicamente.
    """
    recepcion = models.ForeignKey(
        Recepcion,
        on_delete=models.CASCADE,
        related_name='controles_calidad',
        verbose_name='Recepción'
    )

    # Parámetro controlado (dinámico)
    parametro = models.CharField(
        max_length=100,
        verbose_name='Parámetro de control',
        help_text='Parámetro evaluado (ej: acidez, temperatura, color, olor, impurezas, humedad)'
    )

    # Valores esperados y obtenidos
    valor_esperado = models.CharField(
        max_length=200,
        verbose_name='Valor esperado',
        help_text='Valor o rango esperado del parámetro'
    )
    valor_obtenido = models.CharField(
        max_length=200,
        verbose_name='Valor obtenido',
        help_text='Valor real medido u observado'
    )

    # Resultado
    cumple = models.BooleanField(
        verbose_name='Cumple especificación',
        help_text='Indica si el valor obtenido cumple con lo esperado'
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
        related_name='controles_calidad_verificados',
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
        db_table = 'production_ops_control_calidad_recepcion'
        verbose_name = 'Control de Calidad de Recepción'
        verbose_name_plural = 'Controles de Calidad de Recepción'
        ordering = ['recepcion', 'fecha_verificacion']
        indexes = [
            models.Index(fields=['recepcion']),
            models.Index(fields=['parametro']),
            models.Index(fields=['cumple']),
            models.Index(fields=['fecha_verificacion']),
        ]

    def __str__(self):
        estado = "✓ Cumple" if self.cumple else "✗ No cumple"
        return f"{self.recepcion.codigo} - {self.parametro}: {estado}"

    @property
    def estado_cumplimiento(self):
        """Retorna texto del estado de cumplimiento."""
        return "CUMPLE" if self.cumple else "NO_CUMPLE"

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar que parámetro no esté vacío
        if not self.parametro or not self.parametro.strip():
            raise ValidationError({
                'parametro': 'El parámetro de control es obligatorio'
            })

        # Normalizar parámetro a lowercase
        if self.parametro:
            self.parametro = self.parametro.lower().strip()


# ==============================================================================
# SIGNALS Y MÉTODOS DE UTILIDAD
# ==============================================================================

# TODO: Implementar signals para:
# 1. Actualizar inventario cuando recepción cambie a estado COMPLETADA
# 2. Notificar a responsables cuando se rechace una recepción
# 3. Generar alertas de calidad cuando controles no cumplan
# 4. Integrar con módulo de almacenamiento para registro de ubicaciones

# Ejemplo de signal (descomentar cuando se implemente):
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Recepcion)
def actualizar_inventario_recepcion(sender, instance, created, **kwargs):
    '''
    Actualiza el inventario cuando una recepción se completa.
    '''
    if instance.estado.genera_inventario:
        # TODO: Implementar lógica de actualización de inventario
        pass
"""


# ==============================================================================
# PRUEBA DE ACIDEZ — Migrado desde Supply Chain (M1 pattern)
# ==============================================================================

def prueba_acidez_upload_path(instance, filename):
    import os
    from datetime import date
    ext = filename.split('.')[-1]
    today = date.today()
    new_filename = f"foto_{today.strftime('%Y%m%d')}_{instance.proveedor_id or 'temp'}.{ext}"
    return os.path.join('pruebas_acidez', str(today.year), str(today.month).zfill(2), new_filename)


class PruebaAcidez(models.Model):
    """
    Prueba de Acidez — Control de calidad en recepción de sebo procesado.

    Migrado desde supply_chain.gestion_proveedores.
    Usa patrón M1 (PositiveBigIntegerField + CharField cache) para
    referencias cross-C2 a Proveedor y TipoMateriaPrima.
    """
    CALIDAD_SEBO_CHOICES = [
        ('A', 'Calidad A (Acidez < 3%)'),
        ('B', 'Calidad B (Acidez 3-5%)'),
        ('B1', 'Calidad B1 (Acidez 5-8%)'),
        ('B2', 'Calidad B2 (Acidez 8-12%)'),
        ('B4', 'Calidad B4 (Acidez 12-15%)'),
        ('C', 'Calidad C (Acidez > 15%)'),
    ]

    # M1 pattern: referencia cross-C2 a Proveedor (Supply Chain)
    proveedor_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Proveedor'
    )
    proveedor_nombre = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nombre del proveedor'
    )

    fecha_prueba = models.DateTimeField(verbose_name='Fecha de prueba')
    valor_acidez = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Valor de acidez (%)'
    )
    calidad_resultante = models.CharField(
        max_length=2,
        choices=CALIDAD_SEBO_CHOICES,
        verbose_name='Calidad resultante'
    )

    # M1 pattern: referencia cross-C2 a TipoMateriaPrima (Supply Chain)
    tipo_materia_resultante_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='Tipo materia resultante'
    )
    tipo_materia_resultante_nombre = models.CharField(
        max_length=150,
        blank=True,
        verbose_name='Nombre tipo materia resultante'
    )

    foto_prueba = models.ImageField(
        upload_to=prueba_acidez_upload_path,
        verbose_name='Foto de la prueba'
    )
    cantidad_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Cantidad (kg)'
    )
    precio_kg_aplicado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Precio por kg aplicado'
    )
    valor_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Valor total'
    )
    observaciones = models.TextField(blank=True, null=True)
    lote_numero = models.CharField(max_length=50, blank=True, null=True)
    codigo_voucher = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Código de voucher'
    )
    realizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='po_pruebas_acidez_realizadas',
        verbose_name='Realizado por'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'supply_chain_prueba_acidez'
        verbose_name = 'Prueba de Acidez'
        verbose_name_plural = 'Pruebas de Acidez'
        ordering = ['-fecha_prueba', '-created_at']
        indexes = [
            models.Index(fields=['proveedor_id', '-fecha_prueba']),
            models.Index(fields=['calidad_resultante', '-fecha_prueba']),
            models.Index(fields=['codigo_voucher']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"Prueba {self.codigo_voucher} - {self.proveedor_nombre}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def determinar_calidad_y_tipo(self):
        """
        Determina la calidad y tipo de materia prima según acidez.
        Usa apps.get_model() para acceder a TipoMateriaPrima (Supply Chain).
        """
        from django.apps import apps
        try:
            TipoMateriaPrima = apps.get_model('gestion_proveedores', 'TipoMateriaPrima')
        except LookupError:
            return 'C', None, ''

        tipo = TipoMateriaPrima.obtener_por_acidez(self.valor_acidez)
        if tipo:
            calidad_map = {
                'SEBO_PROCESADO_A': 'A',
                'SEBO_PROCESADO_B': 'B',
                'SEBO_PROCESADO_B1': 'B1',
                'SEBO_PROCESADO_B2': 'B2',
                'SEBO_PROCESADO_B4': 'B4',
                'SEBO_PROCESADO_C': 'C',
            }
            calidad = calidad_map.get(tipo.codigo, 'C')
            return calidad, tipo.id, tipo.nombre
        return 'C', None, ''

    @classmethod
    def generar_codigo_voucher(cls):
        """Genera código voucher ACID-YYYY-NNNNN (Sistema A)."""
        from apps.core.utils.consecutivos import siguiente_consecutivo_scan
        return siguiente_consecutivo_scan(
            cls.objects.all(),
            campo_codigo='codigo_voucher',
            prefix='ACID',
            padding=5,
            include_year=True,
        )

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def save(self, *args, **kwargs):
        # Determinar calidad y tipo automáticamente
        if self.valor_acidez is not None:
            calidad, tipo_id, tipo_nombre = self.determinar_calidad_y_tipo()
            self.calidad_resultante = calidad
            self.tipo_materia_resultante_id = tipo_id
            self.tipo_materia_resultante_nombre = tipo_nombre

        # Generar código de voucher
        if not self.codigo_voucher:
            self.codigo_voucher = self.generar_codigo_voucher()

        # Calcular valor total
        if self.cantidad_kg and self.precio_kg_aplicado:
            self.valor_total = Decimal(str(self.cantidad_kg)) * Decimal(str(self.precio_kg_aplicado))

        # Cache nombre del proveedor
        if self.proveedor_id and not self.proveedor_nombre:
            from django.apps import apps
            try:
                Proveedor = apps.get_model('catalogo_productos', 'Proveedor')
                prov = Proveedor.objects.filter(id=self.proveedor_id).values_list('nombre_comercial', flat=True).first()
                if prov:
                    self.proveedor_nombre = prov
            except LookupError:
                pass

        super().save(*args, **kwargs)
