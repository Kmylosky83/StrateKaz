"""
Modelos para Gestión de Clientes - Sales CRM
Sistema de Gestión Grasas y Huesos del Norte

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.

Gestiona:
- Clientes con segmentación y scoring
- Contactos de clientes
- Interacciones comerciales
- Evaluación crediticia y comercial
- Multi-tenant (empresa_id en todos los modelos)

Autor: Sistema de Gestión
Fecha: 2025-12-28
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from datetime import timedelta

from apps.core.base_models.base import BaseCompanyModel, OrderedModel


# ==============================================================================
# MODELOS DE CATÁLOGO DINÁMICO
# ==============================================================================

class TipoCliente(OrderedModel):
    """
    Tipo de cliente (catálogo dinámico).

    Ejemplos:
    - EMPRESA
    - PERSONA_NATURAL
    - DISTRIBUIDOR
    - EXPORTACION
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo de cliente (ej: EMPRESA, PERSONA_NATURAL)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de cliente'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del tipo de cliente'
    )
    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='¿Tipo de cliente activo?'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales_crm_tipo_cliente'
        verbose_name = 'Tipo de Cliente'
        verbose_name_plural = 'Tipos de Cliente'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['activo', 'orden']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class EstadoCliente(OrderedModel):
    """
    Estado del cliente (catálogo dinámico).

    Ejemplos:
    - ACTIVO
    - INACTIVO
    - BLOQUEADO
    - PROSPECTO
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del estado (ej: ACTIVO, BLOQUEADO)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del estado'
    )
    color = models.CharField(
        max_length=20,
        default='gray',
        verbose_name='Color',
        help_text='Color para representación visual (success, warning, danger, info, gray)'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción del estado'
    )

    # Reglas de negocio
    permite_ventas = models.BooleanField(
        default=True,
        verbose_name='Permite Ventas',
        help_text='¿El cliente en este estado puede realizar compras?'
    )
    requiere_aprobacion = models.BooleanField(
        default=False,
        verbose_name='Requiere Aprobación',
        help_text='¿Requiere aprobación previa para ventas?'
    )

    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='¿Estado activo?'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales_crm_estado_cliente'
        verbose_name = 'Estado de Cliente'
        verbose_name_plural = 'Estados de Cliente'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['activo', 'orden']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class CanalVenta(OrderedModel):
    """
    Canal de venta (catálogo dinámico).

    Ejemplos:
    - DIRECTO
    - DISTRIBUIDOR
    - ECOMMERCE
    - MAYORISTA
    - EXPORTACION
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del canal (ej: DIRECTO, ECOMMERCE)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del canal de venta'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción del canal de venta'
    )

    # Comisiones
    aplica_comision = models.BooleanField(
        default=False,
        verbose_name='Aplica Comisión',
        help_text='¿Este canal aplica comisión de ventas?'
    )
    porcentaje_comision = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Porcentaje Comisión',
        help_text='Porcentaje de comisión (0-100%)'
    )

    activo = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
        help_text='¿Canal activo?'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales_crm_canal_venta'
        verbose_name = 'Canal de Venta'
        verbose_name_plural = 'Canales de Venta'
        ordering = ['orden', 'nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['activo', 'orden']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ==============================================================================
# MODELOS PRINCIPALES
# ==============================================================================

class Cliente(BaseCompanyModel):
    """
    Registro de clientes.

    Gestiona información completa de clientes incluyendo datos generales,
    comerciales, financieros y estadísticas de compra.
    """
    # Identificación
    codigo_cliente = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código Cliente',
        help_text='Código único del cliente (auto-generado: CLI-XXXXX)'
    )
    tipo_documento = models.CharField(
        max_length=20,
        choices=[
            ('NIT', 'NIT'),
            ('CC', 'Cédula de Ciudadanía'),
            ('CE', 'Cédula de Extranjería'),
            ('PASAPORTE', 'Pasaporte'),
        ],
        verbose_name='Tipo de Documento',
        help_text='Tipo de documento de identificación'
    )
    numero_documento = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name='Número de Documento',
        help_text='Número de documento de identificación'
    )

    # Datos generales
    razon_social = models.CharField(
        max_length=255,
        verbose_name='Razón Social',
        help_text='Nombre legal del cliente'
    )
    nombre_comercial = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Nombre Comercial',
        help_text='Nombre comercial o marca del cliente'
    )

    # Relaciones
    tipo_cliente = models.ForeignKey(
        TipoCliente,
        on_delete=models.PROTECT,
        related_name='clientes',
        verbose_name='Tipo de Cliente',
        help_text='Tipo al que pertenece este cliente'
    )
    estado_cliente = models.ForeignKey(
        EstadoCliente,
        on_delete=models.PROTECT,
        related_name='clientes',
        verbose_name='Estado del Cliente',
        help_text='Estado actual del cliente'
    )
    canal_venta = models.ForeignKey(
        CanalVenta,
        on_delete=models.PROTECT,
        related_name='clientes',
        verbose_name='Canal de Venta',
        help_text='Canal por el que se obtuvo el cliente'
    )
    vendedor_asignado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='clientes_asignados',
        verbose_name='Vendedor Asignado',
        help_text='Vendedor responsable del cliente'
    )

    # Contacto
    telefono = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Teléfono',
        help_text='Teléfono principal'
    )
    email = models.EmailField(
        blank=True,
        verbose_name='Email',
        help_text='Email principal'
    )
    direccion = models.TextField(
        blank=True,
        verbose_name='Dirección',
        help_text='Dirección completa'
    )
    ciudad = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Ciudad',
        help_text='Ciudad donde se encuentra el cliente'
    )
    departamento = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Departamento',
        help_text='Departamento/Estado donde se encuentra'
    )
    pais = models.CharField(
        max_length=100,
        default='Colombia',
        verbose_name='País',
        help_text='País donde se encuentra el cliente'
    )

    # Condiciones comerciales
    plazo_pago_dias = models.PositiveIntegerField(
        default=30,
        verbose_name='Plazo de Pago (días)',
        help_text='Días de plazo para pago de facturas'
    )
    cupo_credito = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Cupo de Crédito',
        help_text='Cupo máximo de crédito aprobado'
    )
    descuento_comercial = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Descuento Comercial %',
        help_text='Porcentaje de descuento comercial (0-100%)'
    )

    # Estadísticas de compra
    fecha_primera_compra = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Primera Compra',
        help_text='Fecha de la primera compra realizada'
    )
    ultima_compra = models.DateField(
        null=True,
        blank=True,
        verbose_name='Última Compra',
        help_text='Fecha de la última compra realizada'
    )
    total_compras_acumulado = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total Compras Acumulado',
        help_text='Monto total de todas las compras del cliente'
    )
    cantidad_pedidos = models.PositiveIntegerField(
        default=0,
        verbose_name='Cantidad de Pedidos',
        help_text='Número total de pedidos realizados'
    )

    # Notas
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones',
        help_text='Observaciones generales sobre el cliente'
    )

    class Meta:
        db_table = 'sales_crm_cliente'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['razon_social']
        unique_together = [['empresa', 'codigo_cliente'], ['empresa', 'numero_documento']]
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['codigo_cliente']),
            models.Index(fields=['numero_documento']),
            models.Index(fields=['tipo_cliente', 'estado_cliente']),
            models.Index(fields=['vendedor_asignado']),
            models.Index(fields=['ultima_compra']),
        ]

    def __str__(self):
        return f"{self.codigo_cliente} - {self.razon_social}"

    def clean(self):
        """Validaciones personalizadas."""
        super().clean()

        # Validar cupo de crédito no negativo
        if self.cupo_credito and self.cupo_credito < 0:
            raise ValidationError({
                'cupo_credito': 'El cupo de crédito no puede ser negativo.'
            })

        # Validar descuento comercial en rango válido
        if self.descuento_comercial and not (0 <= self.descuento_comercial <= 100):
            raise ValidationError({
                'descuento_comercial': 'El descuento comercial debe estar entre 0 y 100%.'
            })

    def save(self, *args, **kwargs):
        """Override para generación de código automático."""
        if not self.codigo_cliente:
            self.codigo_cliente = self._generar_codigo_cliente()
        super().save(*args, **kwargs)

    def _generar_codigo_cliente(self):
        """Genera código único para cliente: CLI-XXXXX."""
        # Obtener último cliente de la empresa
        ultimo = Cliente.objects.filter(
            empresa=self.empresa,
            codigo_cliente__startswith='CLI-'
        ).order_by('-codigo_cliente').first()

        if ultimo:
            try:
                ultimo_numero = int(ultimo.codigo_cliente.split('-')[1])
                numero = ultimo_numero + 1
            except (ValueError, IndexError):
                numero = 1
        else:
            numero = 1

        return f"CLI-{numero:05d}"

    def actualizar_estadisticas_compra(self, monto_pedido, fecha_pedido):
        """
        Actualiza estadísticas de compra del cliente.

        Args:
            monto_pedido: Monto del nuevo pedido
            fecha_pedido: Fecha del pedido
        """
        if not self.fecha_primera_compra:
            self.fecha_primera_compra = fecha_pedido

        self.ultima_compra = fecha_pedido
        self.total_compras_acumulado += monto_pedido
        self.cantidad_pedidos += 1
        self.save(update_fields=[
            'fecha_primera_compra', 'ultima_compra',
            'total_compras_acumulado', 'cantidad_pedidos', 'updated_at'
        ])

    def actualizar_scoring(self):
        """
        Actualiza el scoring del cliente.
        Debe ser llamado periódicamente o tras cambios significativos.
        """
        try:
            scoring = self.scoring
        except ScoringCliente.DoesNotExist:
            scoring = ScoringCliente.objects.create(cliente=self)

        scoring.calcular_puntuacion()

    def get_historial_compras(self):
        """
        Retorna el historial de compras del cliente.

        Returns:
            QuerySet de pedidos del cliente ordenados por fecha
        """
        # TODO: Implementar cuando exista el modelo Pedido
        return []

    @property
    def nombre_completo(self):
        """Retorna el nombre comercial o razón social."""
        return self.nombre_comercial or self.razon_social

    @property
    def dias_sin_comprar(self):
        """Retorna días desde la última compra."""
        if not self.ultima_compra:
            return None
        delta = timezone.now().date() - self.ultima_compra
        return delta.days

    @property
    def ticket_promedio(self):
        """Retorna el ticket promedio de compra."""
        if self.cantidad_pedidos == 0:
            return Decimal('0.00')
        return self.total_compras_acumulado / self.cantidad_pedidos


class ContactoCliente(BaseCompanyModel):
    """
    Contacto de un cliente.

    Registra personas de contacto en la organización del cliente.
    """
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='contactos',
        verbose_name='Cliente',
        help_text='Cliente al que pertenece el contacto'
    )

    # Datos del contacto
    nombre_completo = models.CharField(
        max_length=255,
        verbose_name='Nombre Completo',
        help_text='Nombre completo del contacto'
    )
    cargo = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Cargo',
        help_text='Cargo o posición en la empresa'
    )
    telefono = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Teléfono',
        help_text='Teléfono de contacto'
    )
    email = models.EmailField(
        blank=True,
        verbose_name='Email',
        help_text='Correo electrónico'
    )

    # Flags
    es_principal = models.BooleanField(
        default=False,
        verbose_name='Contacto Principal',
        help_text='¿Es el contacto principal del cliente?'
    )

    # Información adicional
    fecha_cumpleanos = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Cumpleaños',
        help_text='Fecha de cumpleaños del contacto'
    )
    notas = models.TextField(
        blank=True,
        verbose_name='Notas',
        help_text='Notas adicionales sobre el contacto'
    )

    class Meta:
        db_table = 'sales_crm_contacto_cliente'
        verbose_name = 'Contacto de Cliente'
        verbose_name_plural = 'Contactos de Cliente'
        ordering = ['-es_principal', 'nombre_completo']
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['cliente', 'es_principal']),
        ]

    def __str__(self):
        return f"{self.nombre_completo} - {self.cliente.razon_social}"


class SegmentoCliente(BaseCompanyModel):
    """
    Segmento de clientes.

    Permite categorizar clientes según diferentes criterios de negocio.
    """
    codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del segmento (ej: VIP, CORPORATIVO)'
    )
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del segmento'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción del segmento y sus criterios'
    )

    # Criterios de segmentación (dinámicos)
    criterios = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Criterios de Segmentación',
        help_text='Criterios dinámicos para asignación automática (JSON)'
    )

    # Visual
    color = models.CharField(
        max_length=20,
        default='blue',
        verbose_name='Color',
        help_text='Color para representación visual'
    )

    class Meta:
        db_table = 'sales_crm_segmento_cliente'
        verbose_name = 'Segmento de Cliente'
        verbose_name_plural = 'Segmentos de Cliente'
        ordering = ['nombre']
        unique_together = [['empresa', 'codigo']]
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class ClienteSegmento(BaseCompanyModel):
    """
    Relación Muchos a Muchos entre Cliente y Segmento.

    Registra la asignación de clientes a segmentos con auditoría.
    """
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='segmentos',
        verbose_name='Cliente',
        help_text='Cliente asignado al segmento'
    )
    segmento = models.ForeignKey(
        SegmentoCliente,
        on_delete=models.CASCADE,
        related_name='clientes',
        verbose_name='Segmento',
        help_text='Segmento al que pertenece el cliente'
    )

    # Auditoría de asignación
    fecha_asignacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Asignación',
        help_text='Fecha en que se asignó el cliente al segmento'
    )
    asignado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='asignaciones_segmento',
        verbose_name='Asignado por',
        help_text='Usuario que realizó la asignación'
    )

    class Meta:
        db_table = 'sales_crm_cliente_segmento'
        verbose_name = 'Asignación Cliente-Segmento'
        verbose_name_plural = 'Asignaciones Cliente-Segmento'
        ordering = ['-fecha_asignacion']
        unique_together = [['cliente', 'segmento']]
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['cliente', 'segmento']),
            models.Index(fields=['fecha_asignacion']),
        ]

    def __str__(self):
        return f"{self.cliente.razon_social} - {self.segmento.nombre}"


class InteraccionCliente(BaseCompanyModel):
    """
    Interacción con cliente (CRM).

    Registra todas las interacciones comerciales con clientes:
    llamadas, emails, visitas, reuniones, etc.
    """
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='interacciones',
        verbose_name='Cliente',
        help_text='Cliente con el que se tuvo la interacción'
    )

    # Tipo de interacción
    tipo_interaccion = models.CharField(
        max_length=50,
        choices=[
            ('LLAMADA', 'Llamada Telefónica'),
            ('EMAIL', 'Email'),
            ('VISITA', 'Visita al Cliente'),
            ('REUNION', 'Reunión'),
            ('WHATSAPP', 'WhatsApp'),
            ('VIDEOLLAMADA', 'Videollamada'),
            ('OTRO', 'Otro'),
        ],
        db_index=True,
        verbose_name='Tipo de Interacción',
        help_text='Tipo de interacción realizada'
    )

    # Detalles de la interacción
    fecha = models.DateTimeField(
        default=timezone.now,
        verbose_name='Fecha y Hora',
        help_text='Fecha y hora de la interacción'
    )
    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada de la interacción'
    )
    resultado = models.TextField(
        blank=True,
        verbose_name='Resultado',
        help_text='Resultado u outcome de la interacción'
    )

    # Seguimiento
    proxima_accion = models.TextField(
        blank=True,
        verbose_name='Próxima Acción',
        help_text='Acción de seguimiento pendiente'
    )
    fecha_proxima_accion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha Próxima Acción',
        help_text='Fecha programada para el seguimiento'
    )

    # Responsable
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='interacciones_registradas',
        verbose_name='Registrado por',
        help_text='Usuario que registró la interacción'
    )

    class Meta:
        db_table = 'sales_crm_interaccion_cliente'
        verbose_name = 'Interacción con Cliente'
        verbose_name_plural = 'Interacciones con Cliente'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['empresa', 'is_active']),
            models.Index(fields=['cliente', 'fecha']),
            models.Index(fields=['tipo_interaccion', 'fecha']),
            models.Index(fields=['fecha_proxima_accion']),
            models.Index(fields=['registrado_por']),
        ]

    def __str__(self):
        return f"{self.get_tipo_interaccion_display()} - {self.cliente.razon_social} ({self.fecha.strftime('%Y-%m-%d')})"


class ScoringCliente(models.Model):
    """
    Scoring y evaluación crediticia del cliente.

    Calcula un score basado en múltiples factores para evaluar
    la calidad y confiabilidad del cliente.
    """
    cliente = models.OneToOneField(
        Cliente,
        on_delete=models.CASCADE,
        related_name='scoring',
        verbose_name='Cliente',
        help_text='Cliente al que pertenece el scoring'
    )

    # Puntuación total (0-100)
    puntuacion_total = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('100.00'))],
        verbose_name='Puntuación Total',
        help_text='Puntuación total del cliente (0-100)'
    )

    # Componentes del score
    frecuencia_compra = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Score Frecuencia de Compra',
        help_text='Puntuación por frecuencia de compra (0-25)'
    )
    volumen_compra = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Score Volumen de Compra',
        help_text='Puntuación por volumen total comprado (0-25)'
    )
    puntualidad_pago = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Score Puntualidad de Pago',
        help_text='Puntuación por puntualidad en pagos (0-30)'
    )
    antiguedad = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Score Antigüedad',
        help_text='Puntuación por tiempo como cliente (0-20)'
    )

    # Auditoría
    ultima_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización',
        help_text='Fecha de la última actualización del scoring'
    )
    historial_scores = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Historial de Scores',
        help_text='Historial de puntuaciones anteriores [{fecha, puntuacion}]'
    )

    class Meta:
        db_table = 'sales_crm_scoring_cliente'
        verbose_name = 'Scoring de Cliente'
        verbose_name_plural = 'Scorings de Cliente'
        ordering = ['-puntuacion_total']
        indexes = [
            models.Index(fields=['puntuacion_total']),
            models.Index(fields=['ultima_actualizacion']),
        ]

    def __str__(self):
        return f"{self.cliente.razon_social} - Score: {self.puntuacion_total}"

    def calcular_puntuacion(self):
        """
        Calcula el scoring del cliente basado en métricas comerciales.

        Componentes:
        - Frecuencia de compra (25%): Qué tan seguido compra
        - Volumen de compra (25%): Cuánto compra en total
        - Puntualidad de pago (30%): Qué tan bien paga
        - Antigüedad (20%): Tiempo como cliente
        """
        cliente = self.cliente

        # 1. Frecuencia de compra (0-25 puntos)
        if cliente.cantidad_pedidos == 0:
            self.frecuencia_compra = Decimal('0.00')
        else:
            # Calcular pedidos por mes
            if cliente.fecha_primera_compra:
                dias_cliente = (timezone.now().date() - cliente.fecha_primera_compra).days
                meses_cliente = max(dias_cliente / 30, 1)
                pedidos_por_mes = cliente.cantidad_pedidos / meses_cliente

                # Escala: 0-1 pedido/mes = 0-25 puntos
                self.frecuencia_compra = min(Decimal(str(pedidos_por_mes * 25)), Decimal('25.00'))
            else:
                self.frecuencia_compra = Decimal('0.00')

        # 2. Volumen de compra (0-25 puntos)
        # Escala logarítmica: $1M = 10 puntos, $10M = 20 puntos, $100M = 25 puntos
        if cliente.total_compras_acumulado > 0:
            import math
            volumen_log = math.log10(float(cliente.total_compras_acumulado))
            self.volumen_compra = min(Decimal(str(volumen_log * 4)), Decimal('25.00'))
        else:
            self.volumen_compra = Decimal('0.00')

        # 3. Puntualidad de pago (0-30 puntos)
        # TODO: Implementar cuando exista el modelo de pagos
        # Por ahora asignar puntaje base
        self.puntualidad_pago = Decimal('20.00')

        # 4. Antigüedad (0-20 puntos)
        if cliente.fecha_primera_compra:
            dias_cliente = (timezone.now().date() - cliente.fecha_primera_compra).days
            meses_cliente = dias_cliente / 30

            # Escala: 0-24 meses = 0-20 puntos
            self.antiguedad = min(Decimal(str((meses_cliente / 24) * 20)), Decimal('20.00'))
        else:
            self.antiguedad = Decimal('0.00')

        # Calcular puntuación total
        self.puntuacion_total = (
            self.frecuencia_compra +
            self.volumen_compra +
            self.puntualidad_pago +
            self.antiguedad
        )

        # Guardar en historial
        historial_entry = {
            'fecha': timezone.now().isoformat(),
            'puntuacion': float(self.puntuacion_total),
            'componentes': {
                'frecuencia': float(self.frecuencia_compra),
                'volumen': float(self.volumen_compra),
                'puntualidad': float(self.puntualidad_pago),
                'antiguedad': float(self.antiguedad),
            }
        }
        if not isinstance(self.historial_scores, list):
            self.historial_scores = []
        self.historial_scores.append(historial_entry)

        # Mantener solo últimos 12 registros
        self.historial_scores = self.historial_scores[-12:]

        self.save()

    @property
    def nivel_scoring(self):
        """Retorna el nivel cualitativo del scoring."""
        if self.puntuacion_total >= 80:
            return 'EXCELENTE'
        elif self.puntuacion_total >= 60:
            return 'BUENO'
        elif self.puntuacion_total >= 40:
            return 'REGULAR'
        elif self.puntuacion_total >= 20:
            return 'BAJO'
        else:
            return 'MUY_BAJO'

    @property
    def color_nivel(self):
        """Retorna el color según el nivel de scoring."""
        nivel = self.nivel_scoring
        colores = {
            'EXCELENTE': 'success',
            'BUENO': 'info',
            'REGULAR': 'warning',
            'BAJO': 'danger',
            'MUY_BAJO': 'dark',
        }
        return colores.get(nivel, 'gray')
