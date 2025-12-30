"""
Modelos para Servicio al Cliente - Sales CRM
Sistema de Gestión Grasas y Huesos del Norte

100% DINÁMICO: Todos los catálogos se gestionan desde la base de datos.

Gestiona:
- PQRS (Peticiones, Quejas, Reclamos, Sugerencias, Felicitaciones)
- Seguimiento de casos
- Encuestas de satisfacción (NPS - Net Promoter Score)
- Programa de fidelización
- Gestión de puntos por compras
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import timedelta


# ==============================================================================
# MODELOS DE CATÁLOGO DINÁMICO (OrderedModel pattern)
# ==============================================================================

class TipoPQRS(models.Model):
    """
    Tipo de PQRS (dinámico).
    Ejemplos: PETICION, QUEJA, RECLAMO, SUGERENCIA, FELICITACION
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del tipo (ej: QUEJA, RECLAMO, SUGERENCIA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre descriptivo del tipo de PQRS'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    tiempo_respuesta_dias = models.PositiveIntegerField(
        default=15,
        verbose_name='Tiempo de respuesta (días)',
        help_text='Días hábiles para responder según normativa'
    )
    requiere_investigacion = models.BooleanField(
        default=False,
        verbose_name='Requiere investigación',
        help_text='Indica si este tipo requiere investigación formal'
    )
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)',
        help_text='Color para identificación visual'
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
        db_table = 'crm_tipo_pqrs'
        verbose_name = 'Tipo de PQRS'
        verbose_name_plural = 'Tipos de PQRS'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class EstadoPQRS(models.Model):
    """
    Estado de PQRS (dinámico).
    Ejemplos: RECIBIDA, EN_PROCESO, ESCALADA, RESUELTA, CERRADA
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
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Color (HEX)'
    )
    es_inicial = models.BooleanField(
        default=False,
        verbose_name='Es estado inicial',
        help_text='Estado por defecto para nuevas PQRS'
    )
    es_final = models.BooleanField(
        default=False,
        verbose_name='Es estado final',
        help_text='Indica que la PQRS ha terminado su ciclo'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crm_estado_pqrs'
        verbose_name = 'Estado de PQRS'
        verbose_name_plural = 'Estados de PQRS'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class PrioridadPQRS(models.Model):
    """
    Prioridad de PQRS (dinámico).
    Ejemplos: BAJA, MEDIA, ALTA, CRITICA, URGENTE
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
    nivel = models.PositiveIntegerField(
        verbose_name='Nivel de prioridad',
        help_text='1=Más baja, valores mayores=Mayor prioridad'
    )
    tiempo_sla_horas = models.PositiveIntegerField(
        default=72,
        verbose_name='Tiempo SLA (horas)',
        help_text='Horas máximas para respuesta según prioridad'
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
        db_table = 'crm_prioridad_pqrs'
        verbose_name = 'Prioridad de PQRS'
        verbose_name_plural = 'Prioridades de PQRS'
        ordering = ['-nivel', 'nombre']

    def __str__(self):
        return self.nombre


class CanalRecepcion(models.Model):
    """
    Canal de recepción de PQRS (dinámico).
    Ejemplos: EMAIL, TELEFONO, PRESENCIAL, WEB, WHATSAPP, CORREO_FISICO
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
    icono = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre del icono para UI'
    )
    orden = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crm_canal_recepcion'
        verbose_name = 'Canal de Recepción'
        verbose_name_plural = 'Canales de Recepción'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class NivelSatisfaccion(models.Model):
    """
    Nivel de satisfacción del cliente (dinámico).
    Ejemplos: MUY_INSATISFECHO (1), INSATISFECHO (2), NEUTRAL (3), SATISFECHO (4), MUY_SATISFECHO (5)
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
    valor_numerico = models.PositiveIntegerField(
        verbose_name='Valor numérico',
        help_text='Valor de 1 a 5 para cálculos'
    )
    emoji = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name='Emoji',
        help_text='Emoji representativo (ej: 😞, 😐, 😊)'
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
        db_table = 'crm_nivel_satisfaccion'
        verbose_name = 'Nivel de Satisfacción'
        verbose_name_plural = 'Niveles de Satisfacción'
        ordering = ['valor_numerico', 'orden']

    def __str__(self):
        return f"{self.nombre} ({self.valor_numerico})"


# ==============================================================================
# MODELOS PRINCIPALES
# ==============================================================================

class PQRS(models.Model):
    """
    PQRS: Peticiones, Quejas, Reclamos, Sugerencias, Felicitaciones.

    Sistema de gestión de comunicaciones con clientes según normativa colombiana.
    """
    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código',
        help_text='Código autogenerado PQRS-YYYY-####'
    )
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.PROTECT,
        related_name='pqrs_recibidas',
        verbose_name='Empresa'
    )

    # Información del cliente (puede ser anónimo)
    cliente = models.ForeignKey(
        'gestion_clientes.Cliente',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pqrs',
        verbose_name='Cliente'
    )
    contacto_nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del contacto'
    )
    contacto_email = models.EmailField(
        blank=True,
        null=True,
        verbose_name='Email de contacto'
    )
    contacto_telefono = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Teléfono de contacto'
    )

    # Clasificación
    tipo = models.ForeignKey(
        TipoPQRS,
        on_delete=models.PROTECT,
        related_name='pqrs',
        verbose_name='Tipo'
    )
    estado = models.ForeignKey(
        EstadoPQRS,
        on_delete=models.PROTECT,
        related_name='pqrs',
        verbose_name='Estado'
    )
    prioridad = models.ForeignKey(
        PrioridadPQRS,
        on_delete=models.PROTECT,
        related_name='pqrs',
        verbose_name='Prioridad'
    )
    canal_recepcion = models.ForeignKey(
        CanalRecepcion,
        on_delete=models.PROTECT,
        related_name='pqrs',
        verbose_name='Canal de recepción'
    )

    # Contenido
    asunto = models.CharField(
        max_length=255,
        verbose_name='Asunto'
    )
    descripcion = models.TextField(
        verbose_name='Descripción detallada'
    )

    # Fechas y SLA
    fecha_radicacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de radicación'
    )
    fecha_vencimiento_sla = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Fecha vencimiento SLA',
        help_text='Calculada automáticamente según tipo y prioridad'
    )
    fecha_respuesta = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Fecha de respuesta'
    )
    dias_respuesta = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='Días de respuesta',
        help_text='Días calendario entre radicación y respuesta'
    )

    # Asignación
    asignado_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pqrs_asignadas',
        verbose_name='Asignado a'
    )
    escalado_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pqrs_escaladas',
        verbose_name='Escalado a',
        help_text='Usuario al que se escaló el caso'
    )

    # Relaciones con otros módulos
    producto_relacionado = models.ForeignKey(
        'producto_terminado.ProductoTerminado',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pqrs',
        verbose_name='Producto relacionado'
    )
    pedido_relacionado = models.ForeignKey(
        'pedidos_facturacion.Pedido',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pqrs',
        verbose_name='Pedido relacionado'
    )

    # Solución
    solucion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Solución dada',
        help_text='Descripción de la solución implementada'
    )
    satisfaccion_cliente = models.ForeignKey(
        NivelSatisfaccion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pqrs_evaluadas',
        verbose_name='Satisfacción del cliente'
    )

    # Integración con mejora continua
    requiere_accion_correctiva = models.BooleanField(
        default=False,
        verbose_name='Requiere acción correctiva',
        help_text='Para quejas graves que requieren mejora continua'
    )
    accion_correctiva_generada = models.ForeignKey(
        'calidad.NoConformidad',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pqrs_origen',
        verbose_name='Acción correctiva generada'
    )

    # Auditoría
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones internas'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pqrs_creadas'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'crm_pqrs'
        verbose_name = 'PQRS'
        verbose_name_plural = 'PQRS'
        ordering = ['-fecha_radicacion', '-created_at']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['empresa']),
            models.Index(fields=['cliente']),
            models.Index(fields=['tipo']),
            models.Index(fields=['estado']),
            models.Index(fields=['prioridad']),
            models.Index(fields=['fecha_radicacion']),
            models.Index(fields=['asignado_a']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.asunto}"

    @staticmethod
    def generar_codigo():
        """Genera código único de PQRS."""
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        try:
            return ConsecutivoConfig.obtener_siguiente_consecutivo('PQRS')
        except:
            from datetime import date
            hoy = date.today()
            prefijo = f"PQRS-{hoy.strftime('%Y')}-"

            ultimo = PQRS.objects.filter(
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
        return self.deleted_at is not None

    @property
    def esta_vencida(self):
        """Verifica si la PQRS está fuera del SLA"""
        if self.fecha_vencimiento_sla and not self.fecha_respuesta:
            return timezone.now() > self.fecha_vencimiento_sla
        return False

    @property
    def horas_restantes_sla(self):
        """Calcula horas restantes para cumplir SLA"""
        if self.fecha_vencimiento_sla and not self.fecha_respuesta:
            delta = self.fecha_vencimiento_sla - timezone.now()
            return int(delta.total_seconds() / 3600)
        return None

    @property
    def porcentaje_tiempo_sla(self):
        """Porcentaje de tiempo transcurrido del SLA"""
        if not self.fecha_vencimiento_sla:
            return 0

        tiempo_total = (self.fecha_vencimiento_sla - self.fecha_radicacion).total_seconds()
        if self.fecha_respuesta:
            tiempo_usado = (self.fecha_respuesta - self.fecha_radicacion).total_seconds()
        else:
            tiempo_usado = (timezone.now() - self.fecha_radicacion).total_seconds()

        if tiempo_total > 0:
            porcentaje = (tiempo_usado / tiempo_total) * 100
            return min(round(porcentaje, 1), 100)
        return 0

    def calcular_sla(self):
        """Calcula la fecha de vencimiento del SLA"""
        if self.prioridad:
            horas = self.prioridad.tiempo_sla_horas
        elif self.tipo:
            dias = self.tipo.tiempo_respuesta_dias
            horas = dias * 24
        else:
            horas = 72  # Default 3 días

        self.fecha_vencimiento_sla = self.fecha_radicacion + timedelta(hours=horas)

    def asignar(self, usuario):
        """Asigna la PQRS a un usuario"""
        self.asignado_a = usuario
        try:
            estado_proceso = EstadoPQRS.objects.get(codigo='EN_PROCESO', is_active=True)
            self.estado = estado_proceso
        except EstadoPQRS.DoesNotExist:
            pass
        self.save()

    def escalar(self, usuario):
        """Escala la PQRS a un usuario superior"""
        self.escalado_a = usuario
        try:
            estado_escalada = EstadoPQRS.objects.get(codigo='ESCALADA', is_active=True)
            self.estado = estado_escalada
        except EstadoPQRS.DoesNotExist:
            pass
        self.save()

    def resolver(self, solucion, usuario):
        """Marca la PQRS como resuelta"""
        self.solucion = solucion
        self.fecha_respuesta = timezone.now()

        # Calcular días de respuesta
        delta = self.fecha_respuesta - self.fecha_radicacion
        self.dias_respuesta = delta.days

        try:
            estado_resuelta = EstadoPQRS.objects.get(codigo='RESUELTA', is_active=True)
            self.estado = estado_resuelta
        except EstadoPQRS.DoesNotExist:
            pass

        self.save()

    def cerrar(self):
        """Cierra la PQRS"""
        try:
            estado_cerrada = EstadoPQRS.objects.get(codigo='CERRADA', is_active=True)
            self.estado = estado_cerrada
            self.save()
        except EstadoPQRS.DoesNotExist:
            pass

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            self.codigo = self.generar_codigo()

        # Calcular SLA si no existe
        if not self.fecha_vencimiento_sla:
            self.calcular_sla()

        super().save(*args, **kwargs)


class SeguimientoPQRS(models.Model):
    """
    Seguimiento y trazabilidad de una PQRS.
    Registra todas las acciones realizadas en el caso.
    """
    TIPO_ACCION_CHOICES = [
        ('COMENTARIO', 'Comentario'),
        ('LLAMADA', 'Llamada telefónica'),
        ('EMAIL', 'Correo electrónico'),
        ('VISITA', 'Visita presencial'),
        ('ESCALAMIENTO', 'Escalamiento'),
        ('ASIGNACION', 'Asignación'),
        ('RESOLUCION', 'Resolución'),
        ('CIERRE', 'Cierre'),
    ]

    pqrs = models.ForeignKey(
        PQRS,
        on_delete=models.CASCADE,
        related_name='seguimientos',
        verbose_name='PQRS'
    )
    fecha = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha'
    )
    tipo_accion = models.CharField(
        max_length=20,
        choices=TIPO_ACCION_CHOICES,
        verbose_name='Tipo de acción'
    )
    descripcion = models.TextField(
        verbose_name='Descripción'
    )
    es_visible_cliente = models.BooleanField(
        default=True,
        verbose_name='Visible para el cliente',
        help_text='Indica si esta acción es visible para el cliente'
    )
    archivo_adjunto = models.FileField(
        upload_to='pqrs/seguimientos/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Archivo adjunto'
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='seguimientos_pqrs',
        verbose_name='Registrado por'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crm_seguimiento_pqrs'
        verbose_name = 'Seguimiento de PQRS'
        verbose_name_plural = 'Seguimientos de PQRS'
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.pqrs.codigo} - {self.get_tipo_accion_display()} - {self.fecha.strftime('%Y-%m-%d %H:%M')}"


class EncuestaSatisfaccion(models.Model):
    """
    Encuesta de satisfacción del cliente.
    Incluye cálculo de NPS (Net Promoter Score).
    """
    ESTADO_CHOICES = [
        ('ENVIADA', 'Enviada'),
        ('RESPONDIDA', 'Respondida'),
        ('VENCIDA', 'Vencida'),
        ('CANCELADA', 'Cancelada'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name='Código',
        help_text='Código autogenerado ENC-YYYY-####'
    )
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.PROTECT,
        related_name='encuestas_satisfaccion',
        verbose_name='Empresa'
    )

    # Cliente y relaciones
    cliente = models.ForeignKey(
        'gestion_clientes.Cliente',
        on_delete=models.PROTECT,
        related_name='encuestas_satisfaccion',
        verbose_name='Cliente'
    )
    pedido = models.ForeignKey(
        'pedidos_facturacion.Pedido',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='encuestas_satisfaccion',
        verbose_name='Pedido'
    )
    factura = models.ForeignKey(
        'pedidos_facturacion.Factura',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='encuestas_satisfaccion',
        verbose_name='Factura'
    )

    # Fechas
    fecha_envio = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de envío'
    )
    fecha_respuesta = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Fecha de respuesta'
    )
    fecha_vencimiento = models.DateTimeField(
        verbose_name='Fecha de vencimiento',
        help_text='Fecha límite para responder'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='ENVIADA',
        verbose_name='Estado'
    )

    # Resultados principales
    satisfaccion_general = models.ForeignKey(
        NivelSatisfaccion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='encuestas',
        verbose_name='Satisfacción general'
    )
    nps_score = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='NPS Score',
        help_text='Net Promoter Score: 0-10 (¿Recomendaría nuestro servicio?)'
    )

    # Comentarios
    comentarios = models.TextField(
        blank=True,
        null=True,
        verbose_name='Comentarios del cliente'
    )
    sugerencias = models.TextField(
        blank=True,
        null=True,
        verbose_name='Sugerencias de mejora'
    )

    # Auditoría
    enviada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='encuestas_enviadas',
        verbose_name='Enviada por'
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones internas'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'crm_encuesta_satisfaccion'
        verbose_name = 'Encuesta de Satisfacción'
        verbose_name_plural = 'Encuestas de Satisfacción'
        ordering = ['-fecha_envio']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['empresa']),
            models.Index(fields=['cliente']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_envio']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.cliente}"

    @staticmethod
    def generar_codigo():
        """Genera código único de encuesta."""
        from apps.gestion_estrategica.organizacion.models import ConsecutivoConfig
        try:
            return ConsecutivoConfig.obtener_siguiente_consecutivo('ENCUESTA_SATISFACCION')
        except:
            from datetime import date
            hoy = date.today()
            prefijo = f"ENC-{hoy.strftime('%Y')}-"

            ultimo = EncuestaSatisfaccion.objects.filter(
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
        return self.deleted_at is not None

    @property
    def esta_vencida(self):
        """Verifica si la encuesta está vencida"""
        if self.estado == 'RESPONDIDA':
            return False
        return timezone.now() > self.fecha_vencimiento

    @property
    def categoria_nps(self):
        """Categoriza el cliente según NPS"""
        if self.nps_score is None:
            return None

        if self.nps_score >= 9:
            return 'PROMOTOR'  # Muy probable que recomiende
        elif self.nps_score >= 7:
            return 'PASIVO'  # Satisfecho pero no entusiasta
        else:
            return 'DETRACTOR'  # Insatisfecho, puede dañar la marca

    def responder(self, satisfaccion, nps_score, comentarios='', sugerencias=''):
        """Registra la respuesta de la encuesta"""
        self.satisfaccion_general = satisfaccion
        self.nps_score = nps_score
        self.comentarios = comentarios
        self.sugerencias = sugerencias
        self.fecha_respuesta = timezone.now()
        self.estado = 'RESPONDIDA'
        self.save()

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            self.codigo = self.generar_codigo()

        # Establecer fecha de vencimiento si no existe (7 días por defecto)
        if not self.fecha_vencimiento:
            self.fecha_vencimiento = timezone.now() + timedelta(days=7)

        # Actualizar estado si está vencida
        if self.estado == 'ENVIADA' and self.esta_vencida:
            self.estado = 'VENCIDA'

        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if self.nps_score is not None and (self.nps_score < 0 or self.nps_score > 10):
            raise ValidationError({'nps_score': 'El NPS debe estar entre 0 y 10'})


class PreguntaEncuesta(models.Model):
    """
    Pregunta configurable para encuestas de satisfacción.
    Permite crear encuestas personalizadas.
    """
    TIPO_RESPUESTA_CHOICES = [
        ('ESCALA', 'Escala (1-5)'),
        ('TEXTO', 'Texto libre'),
        ('OPCION_MULTIPLE', 'Opción múltiple'),
        ('SI_NO', 'Sí/No'),
    ]

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    pregunta = models.TextField(
        verbose_name='Pregunta'
    )
    tipo_respuesta = models.CharField(
        max_length=20,
        choices=TIPO_RESPUESTA_CHOICES,
        verbose_name='Tipo de respuesta'
    )
    opciones = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Opciones de respuesta',
        help_text='Para opción múltiple: ["Opción 1", "Opción 2", ...]'
    )
    es_obligatoria = models.BooleanField(
        default=False,
        verbose_name='Es obligatoria'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activa'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crm_pregunta_encuesta'
        verbose_name = 'Pregunta de Encuesta'
        verbose_name_plural = 'Preguntas de Encuesta'
        ordering = ['orden', 'pregunta']

    def __str__(self):
        return self.pregunta[:100]


class RespuestaEncuesta(models.Model):
    """
    Respuesta a una pregunta de encuesta.
    """
    encuesta = models.ForeignKey(
        EncuestaSatisfaccion,
        on_delete=models.CASCADE,
        related_name='respuestas',
        verbose_name='Encuesta'
    )
    pregunta = models.ForeignKey(
        PreguntaEncuesta,
        on_delete=models.PROTECT,
        related_name='respuestas',
        verbose_name='Pregunta'
    )
    respuesta_texto = models.TextField(
        blank=True,
        null=True,
        verbose_name='Respuesta (texto)'
    )
    respuesta_valor = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='Respuesta (valor numérico)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crm_respuesta_encuesta'
        verbose_name = 'Respuesta de Encuesta'
        verbose_name_plural = 'Respuestas de Encuesta'
        unique_together = [['encuesta', 'pregunta']]

    def __str__(self):
        return f"{self.encuesta.codigo} - {self.pregunta.codigo}"


class ProgramaFidelizacion(models.Model):
    """
    Programa de fidelización de clientes.
    Define niveles y beneficios según puntos acumulados.
    """
    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Código'
    )
    empresa = models.ForeignKey(
        'configuracion.EmpresaConfig',
        on_delete=models.PROTECT,
        related_name='programas_fidelizacion',
        verbose_name='Empresa'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del programa'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )

    # Configuración de acumulación
    puntos_por_compra = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('1.00'),
        verbose_name='Puntos por $1.000',
        help_text='Puntos otorgados por cada $1.000 de compra'
    )
    valor_punto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('100.00'),
        verbose_name='Valor del punto ($)',
        help_text='Valor en pesos de cada punto para canjes'
    )

    # Niveles de fidelización
    nivel_bronce_puntos = models.PositiveIntegerField(
        default=0,
        verbose_name='Puntos para nivel Bronce'
    )
    nivel_plata_puntos = models.PositiveIntegerField(
        default=1000,
        verbose_name='Puntos para nivel Plata'
    )
    nivel_oro_puntos = models.PositiveIntegerField(
        default=5000,
        verbose_name='Puntos para nivel Oro'
    )

    # Beneficios por nivel (JSON)
    beneficios_bronce = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Beneficios nivel Bronce',
        help_text='["Descuento 5%", "Envío gratis pedidos >$100.000"]'
    )
    beneficios_plata = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Beneficios nivel Plata'
    )
    beneficios_oro = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Beneficios nivel Oro'
    )

    # Vigencia
    fecha_inicio = models.DateField(
        verbose_name='Fecha de inicio'
    )
    fecha_fin = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de finalización'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )

    # Auditoría
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='programas_fidelizacion_creados'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crm_programa_fidelizacion'
        verbose_name = 'Programa de Fidelización'
        verbose_name_plural = 'Programas de Fidelización'
        ordering = ['-created_at']

    def __str__(self):
        return self.nombre

    @property
    def esta_vigente(self):
        """Verifica si el programa está vigente"""
        from datetime import date
        hoy = date.today()
        vigente = hoy >= self.fecha_inicio
        if self.fecha_fin:
            vigente = vigente and hoy <= self.fecha_fin
        return vigente and self.is_active


class PuntosFidelizacion(models.Model):
    """
    Puntos acumulados de un cliente en un programa de fidelización.
    """
    NIVEL_CHOICES = [
        ('BRONCE', 'Bronce'),
        ('PLATA', 'Plata'),
        ('ORO', 'Oro'),
    ]

    cliente = models.ForeignKey(
        'gestion_clientes.Cliente',
        on_delete=models.CASCADE,
        related_name='puntos_fidelizacion',
        verbose_name='Cliente'
    )
    programa = models.ForeignKey(
        ProgramaFidelizacion,
        on_delete=models.CASCADE,
        related_name='puntos_clientes',
        verbose_name='Programa'
    )

    # Puntos
    puntos_acumulados = models.PositiveIntegerField(
        default=0,
        verbose_name='Puntos acumulados totales'
    )
    puntos_canjeados = models.PositiveIntegerField(
        default=0,
        verbose_name='Puntos canjeados'
    )
    puntos_disponibles = models.PositiveIntegerField(
        default=0,
        verbose_name='Puntos disponibles'
    )

    # Nivel actual
    nivel_actual = models.CharField(
        max_length=10,
        choices=NIVEL_CHOICES,
        default='BRONCE',
        verbose_name='Nivel actual'
    )
    fecha_nivel = models.DateField(
        auto_now_add=True,
        verbose_name='Fecha de nivel actual',
        help_text='Fecha en que alcanzó el nivel actual'
    )

    # Auditoría
    ultima_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crm_puntos_fidelizacion'
        verbose_name = 'Puntos de Fidelización'
        verbose_name_plural = 'Puntos de Fidelización'
        unique_together = [['cliente', 'programa']]
        indexes = [
            models.Index(fields=['cliente']),
            models.Index(fields=['programa']),
            models.Index(fields=['nivel_actual']),
        ]

    def __str__(self):
        return f"{self.cliente} - {self.programa.nombre} ({self.puntos_disponibles} pts)"

    def actualizar_nivel(self):
        """Actualiza el nivel según puntos acumulados"""
        programa = self.programa
        nivel_anterior = self.nivel_actual

        if self.puntos_acumulados >= programa.nivel_oro_puntos:
            self.nivel_actual = 'ORO'
        elif self.puntos_acumulados >= programa.nivel_plata_puntos:
            self.nivel_actual = 'PLATA'
        else:
            self.nivel_actual = 'BRONCE'

        # Actualizar fecha si cambió de nivel
        if nivel_anterior != self.nivel_actual:
            self.fecha_nivel = timezone.now().date()

    def acumular(self, puntos, factura=None, descripcion=''):
        """Acumula puntos al cliente"""
        self.puntos_acumulados += puntos
        self.puntos_disponibles += puntos
        self.actualizar_nivel()
        self.save()

        # Registrar movimiento
        MovimientoPuntos.objects.create(
            puntos_cliente=self,
            tipo='ACUMULACION',
            puntos=puntos,
            factura=factura,
            descripcion=descripcion
        )

    def canjear(self, puntos, descripcion=''):
        """Canjea puntos del cliente"""
        if puntos > self.puntos_disponibles:
            raise ValidationError('Puntos insuficientes para canjear')

        self.puntos_canjeados += puntos
        self.puntos_disponibles -= puntos
        self.save()

        # Registrar movimiento
        MovimientoPuntos.objects.create(
            puntos_cliente=self,
            tipo='CANJE',
            puntos=-puntos,
            descripcion=descripcion
        )

    @property
    def puntos_para_siguiente_nivel(self):
        """Puntos que faltan para alcanzar el siguiente nivel"""
        if self.nivel_actual == 'ORO':
            return 0  # Ya está en el nivel máximo
        elif self.nivel_actual == 'PLATA':
            return max(0, self.programa.nivel_oro_puntos - self.puntos_acumulados)
        else:  # BRONCE
            return max(0, self.programa.nivel_plata_puntos - self.puntos_acumulados)


class MovimientoPuntos(models.Model):
    """
    Movimiento de puntos de fidelización.
    Trazabilidad completa de acumulaciones, canjes y ajustes.
    """
    TIPO_CHOICES = [
        ('ACUMULACION', 'Acumulación por compra'),
        ('CANJE', 'Canje de puntos'),
        ('EXPIRACION', 'Expiración'),
        ('AJUSTE', 'Ajuste manual'),
        ('BONIFICACION', 'Bonificación'),
    ]

    puntos_cliente = models.ForeignKey(
        PuntosFidelizacion,
        on_delete=models.CASCADE,
        related_name='movimientos',
        verbose_name='Puntos cliente'
    )
    fecha = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha'
    )
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        verbose_name='Tipo de movimiento'
    )
    puntos = models.IntegerField(
        verbose_name='Puntos',
        help_text='Positivo para acumulación, negativo para canje/expiración'
    )
    factura = models.ForeignKey(
        'pedidos_facturacion.Factura',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movimientos_puntos',
        verbose_name='Factura'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movimientos_puntos_registrados',
        verbose_name='Registrado por'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'crm_movimiento_puntos'
        verbose_name = 'Movimiento de Puntos'
        verbose_name_plural = 'Movimientos de Puntos'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['puntos_cliente']),
            models.Index(fields=['tipo']),
            models.Index(fields=['fecha']),
        ]

    def __str__(self):
        signo = '+' if self.puntos >= 0 else ''
        return f"{self.puntos_cliente.cliente} - {self.get_tipo_display()} {signo}{self.puntos} pts"
