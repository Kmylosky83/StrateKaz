"""
Modelos del módulo Firma Digital - Workflow Engine
Sistema de Gestión StrateKaz

Sistema profesional de firma digital manuscrita con workflow completo
para políticas y documentos normativos (ISO 9001, ISO 45001, Decreto 1072)

Define:
- ConfiguracionFlujoFirma: Configuración de flujos de firma personalizables
- FirmaDigital: Firmas digitales manuscritas con hash SHA-256
- HistorialFirma: Trazabilidad completa de firmas
- DelegacionFirma: Delegación temporal de autoridad de firma
- ConfiguracionRevision: Configuración de ciclos de revisión periódica
- AlertaRevision: Alertas automáticas de revisión
- HistorialVersion: Versionamiento semántico y comparación de versiones
- FlowNode: Nodos del flujo de firma (secuencial/paralelo)
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from utils.models import TenantModel
import hashlib
import json
from decimal import Decimal


# ==============================================================================
# CHOICES
# ==============================================================================

TIPO_FLUJO_CHOICES = [
    ('SECUENCIAL', 'Secuencial (orden obligatorio)'),
    ('PARALELO', 'Paralelo (todos simultáneamente)'),
    ('MIXTO', 'Mixto (combinación)'),
]

ROL_FIRMA_CHOICES = [
    ('ELABORO', 'Elaboró'),
    ('REVISO', 'Revisó'),
    ('APROBO', 'Aprobó'),
    ('VALIDO', 'Validó'),
    ('AUTORIZO', 'Autorizó'),
]

ESTADO_FIRMA_CHOICES = [
    ('PENDIENTE', 'Pendiente'),
    ('FIRMADO', 'Firmado'),
    ('RECHAZADO', 'Rechazado'),
    ('DELEGADO', 'Delegado'),
    ('EXPIRADO', 'Expirado'),
]

FRECUENCIA_REVISION_CHOICES = [
    ('ANUAL', 'Anual (12 meses)'),
    ('SEMESTRAL', 'Semestral (6 meses)'),
    ('CUATRIMESTRAL', 'Cuatrimestral (4 meses)'),
    ('TRIMESTRAL', 'Trimestral (3 meses)'),
    ('BIMESTRAL', 'Bimestral (2 meses)'),
    ('MENSUAL', 'Mensual (1 mes)'),
    ('PERSONALIZADO', 'Personalizado (días específicos)'),
]

TIPO_VERSION_CHOICES = [
    ('MAJOR', 'Mayor (cambio sustancial)'),
    ('MINOR', 'Menor (ajuste importante)'),
    ('PATCH', 'Parche (corrección menor)'),
]

ESTADO_ALERTA_CHOICES = [
    ('PROGRAMADA', 'Programada'),
    ('ENVIADA', 'Enviada'),
    ('ATENDIDA', 'Atendida'),
    ('VENCIDA', 'Vencida'),
]


# ==============================================================================
# MODELOS DE CONFIGURACIÓN
# ==============================================================================

class ConfiguracionFlujoFirma(TenantModel):
    """
    Configuración de flujos de firma personalizables por tipo de documento.

    Permite definir:
    - Tipo de flujo (secuencial, paralelo, mixto)
    - Roles participantes y orden
    - Reglas de validación
    - Delegación permitida
    """

    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Flujo',
        help_text='Ej: Flujo Estándar ISO, Flujo Políticas SST'
    )
    codigo = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Código',
        help_text='Código único del flujo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Configuración del flujo
    tipo_flujo = models.CharField(
        max_length=20,
        choices=TIPO_FLUJO_CHOICES,
        default='SECUENCIAL',
        verbose_name='Tipo de Flujo'
    )

    # JSON con configuración de nodos
    # Ejemplo secuencial:
    # [
    #   {"orden": 1, "rol": "ELABORO", "cargo_id": "uuid", "requerido": true},
    #   {"orden": 2, "rol": "REVISO", "cargo_id": "uuid", "requerido": true},
    #   {"orden": 3, "rol": "APROBO", "cargo_id": "uuid", "requerido": true}
    # ]
    # Ejemplo paralelo:
    # [
    #   {"grupo": "REVISION", "rol": "REVISO", "cargo_ids": ["uuid1", "uuid2"], "todos_requeridos": false}
    # ]
    configuracion_nodos = models.JSONField(
        verbose_name='Configuración de Nodos',
        help_text='Configuración JSON de nodos del flujo'
    )

    # Reglas
    permite_delegacion = models.BooleanField(
        default=True,
        verbose_name='Permite Delegación'
    )
    dias_max_firma = models.PositiveIntegerField(
        default=5,
        verbose_name='Días Máximos para Firmar',
        help_text='Días máximos que un usuario tiene para firmar antes de escalar'
    )
    requiere_comentario_rechazo = models.BooleanField(
        default=True,
        verbose_name='Requiere Comentario al Rechazar'
    )

    # Aplicación
    aplica_a_content_types = models.ManyToManyField(
        ContentType,
        related_name='flujos_firma',
        verbose_name='Aplica a Tipos de Contenido',
        help_text='Tipos de documentos que usan este flujo'
    )

    class Meta:
        db_table = 'workflow_configuracion_flujo_firma'
        verbose_name = 'Configuración de Flujo de Firma'
        verbose_name_plural = 'Configuraciones de Flujos de Firma'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_flujo_display()})"

    def get_siguiente_firmante(self, firma_actual_orden):
        """Obtiene el siguiente firmante en flujo secuencial"""
        if self.tipo_flujo != 'SECUENCIAL':
            return None

        nodos = self.configuracion_nodos
        for nodo in nodos:
            if nodo.get('orden', 0) > firma_actual_orden:
                return nodo
        return None

    def validar_orden_firma(self, usuario, orden_propuesto):
        """Valida si el usuario puede firmar en el orden propuesto"""
        if self.tipo_flujo == 'PARALELO':
            return True  # En paralelo no hay orden

        # En secuencial, verificar que sea su turno
        nodos = self.configuracion_nodos
        for nodo in nodos:
            if nodo.get('orden') == orden_propuesto:
                # Verificar si el usuario tiene el cargo requerido
                cargo_id = nodo.get('cargo_id')
                return str(usuario.cargo_id) == cargo_id if usuario.cargo_id else False

        return False


class FlowNode(TenantModel):
    """
    Nodos individuales de un flujo de firma.

    Representa cada paso del flujo con sus participantes y reglas.
    """

    configuracion_flujo = models.ForeignKey(
        ConfiguracionFlujoFirma,
        on_delete=models.CASCADE,
        related_name='nodos',
        verbose_name='Configuración de Flujo'
    )

    orden = models.PositiveIntegerField(
        verbose_name='Orden',
        help_text='Orden en el flujo (para flujos secuenciales)'
    )
    grupo = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Grupo',
        help_text='Grupo de nodos paralelos'
    )

    rol_firma = models.CharField(
        max_length=20,
        choices=ROL_FIRMA_CHOICES,
        verbose_name='Rol de Firma'
    )

    # Puede ser cargo específico o lista de cargos
    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='nodos_flujo_firma',
        verbose_name='Cargo'
    )
    cargos_alternativos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Cargos Alternativos',
        help_text='Lista de IDs de cargos que también pueden firmar'
    )

    es_requerido = models.BooleanField(
        default=True,
        verbose_name='Es Requerido'
    )
    permite_rechazo = models.BooleanField(
        default=True,
        verbose_name='Permite Rechazo'
    )

    class Meta:
        db_table = 'workflow_flow_node'
        verbose_name = 'Nodo de Flujo'
        verbose_name_plural = 'Nodos de Flujo'
        ordering = ['orden']
        unique_together = [['configuracion_flujo', 'orden']]

    def __str__(self):
        return f"{self.configuracion_flujo.nombre} - {self.get_rol_firma_display()} (Orden {self.orden})"


# ==============================================================================
# MODELOS DE FIRMA DIGITAL
# ==============================================================================

class FirmaDigital(TenantModel):
    """
    Firma digital manuscrita con hash SHA-256.

    Almacena firmas digitales capturadas desde canvas signature,
    con verificación de integridad mediante hash criptográfico.

    Uso GenericForeignKey para poder firmar cualquier tipo de documento:
    - Documentos del sistema documental (gestion_documental.Documento)
    - Procedimientos
    - etc.
    """

    # GenericForeignKey para firmar cualquier documento
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de Documento'
    )
    object_id = models.UUIDField(
        verbose_name='ID del Documento'
    )
    documento = GenericForeignKey('content_type', 'object_id')

    # Configuración y flujo
    configuracion_flujo = models.ForeignKey(
        ConfiguracionFlujoFirma,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='firmas',
        verbose_name='Configuración de Flujo',
        help_text='Null cuando se auto-asigna desde plantilla sin flujo formal',
    )
    nodo_flujo = models.ForeignKey(
        FlowNode,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='firmas',
        verbose_name='Nodo del Flujo'
    )

    # Firmante
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='firmas_digitales',
        verbose_name='Usuario Firmante',
        db_index=True
    )
    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        related_name='firmas_digitales',
        verbose_name='Cargo al momento de firmar'
    )
    rol_firma = models.CharField(
        max_length=20,
        choices=ROL_FIRMA_CHOICES,
        verbose_name='Rol de Firma',
        db_index=True
    )

    # Firma manuscrita (canvas signature)
    firma_imagen = models.TextField(
        verbose_name='Firma Imagen (Base64)',
        help_text='Imagen de la firma en formato Base64 desde canvas'
    )

    # Integridad y seguridad
    documento_hash = models.CharField(
        max_length=64,
        verbose_name='Hash del Documento',
        help_text='SHA-256 hash del contenido del documento al momento de firmar'
    )
    firma_hash = models.CharField(
        max_length=64,
        verbose_name='Hash de la Firma',
        help_text='SHA-256 hash de la firma completa para verificación'
    )
    hash_verificacion = models.CharField(
        max_length=64,
        blank=True,
        default='',
        verbose_name='Hash de Verificación Extendido',
        help_text='SHA-256(trazo + otp + doc_id + version + timestamp_utc + cédula) — ISO 27001'
    )

    # Metadatos de firma
    fecha_firma = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha y Hora de Firma',
        db_index=True
    )
    ip_address = models.GenericIPAddressField(
        verbose_name='Dirección IP',
        help_text='IP desde donde se firmó'
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent',
        help_text='Navegador y sistema operativo'
    )
    geolocalizacion = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Geolocalización',
        help_text='Coordenadas GPS si están disponibles'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_FIRMA_CHOICES,
        default='FIRMADO',
        verbose_name='Estado',
        db_index=True
    )

    # Orden en flujo secuencial
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden de Firma'
    )

    # Comentarios
    comentarios = models.TextField(
        blank=True,
        verbose_name='Comentarios',
        help_text='Comentarios adicionales del firmante'
    )

    # Delegación
    es_delegada = models.BooleanField(
        default=False,
        verbose_name='Es Firma Delegada'
    )
    delegante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='firmas_delegadas',
        verbose_name='Delegante'
    )

    class Meta:
        db_table = 'workflow_firma_digital'
        verbose_name = 'Firma Digital'
        verbose_name_plural = 'Firmas Digitales'
        ordering = ['orden', '-fecha_firma']
        indexes = [
            models.Index(fields=['content_type', 'object_id', 'estado']),
            models.Index(fields=['usuario', '-fecha_firma']),
            models.Index(fields=['cargo', 'rol_firma']),
            models.Index(fields=['estado', '-fecha_firma']),
        ]

    def __str__(self):
        return f"Firma {self.get_rol_firma_display()} por {self.usuario.get_full_name()} - {self.fecha_firma.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        """Override save para generar hashes automáticamente"""
        if not self.firma_hash:
            self.firma_hash = self.calcular_firma_hash()
        super().save(*args, **kwargs)

    def calcular_documento_hash(self, contenido_documento):
        """Calcula SHA-256 hash del documento"""
        if isinstance(contenido_documento, str):
            contenido_documento = contenido_documento.encode('utf-8')
        return hashlib.sha256(contenido_documento).hexdigest()

    def calcular_firma_hash(self):
        """Calcula SHA-256 hash de la firma completa"""
        firma_data = {
            'usuario_id': str(self.usuario.id),
            'rol': self.rol_firma,
            'fecha': self.fecha_firma.isoformat() if hasattr(self, 'fecha_firma') else timezone.now().isoformat(),
            'documento_hash': self.documento_hash,
            'firma_imagen': self.firma_imagen[:100],  # Solo primeros 100 chars para performance
        }
        firma_string = json.dumps(firma_data, sort_keys=True)
        return hashlib.sha256(firma_string.encode('utf-8')).hexdigest()

    def verificar_integridad(self, contenido_documento_actual):
        """Verifica si la firma sigue siendo válida comparando hashes"""
        hash_actual = self.calcular_documento_hash(contenido_documento_actual)
        return hash_actual == self.documento_hash

    def invalidar(self, motivo=""):
        """Invalida la firma (por cambios en el documento)"""
        self.estado = 'EXPIRADO'
        if motivo:
            self.comentarios += f"\n[INVALIDADA: {motivo}]"
        self.save(update_fields=['estado', 'comentarios'])


class HistorialFirma(TenantModel):
    """
    Historial completo de firmas para auditoría.

    Registra TODAS las acciones relacionadas con firmas:
    - Firma exitosa
    - Rechazo
    - Delegación
    - Invalidación
    - Intentos fallidos
    """

    firma = models.ForeignKey(
        FirmaDigital,
        on_delete=models.CASCADE,
        related_name='historial',
        verbose_name='Firma'
    )

    ACCION_CHOICES = [
        ('FIRMA_CREADA', 'Firma Creada'),
        ('FIRMA_VALIDADA', 'Firma Validada'),
        ('FIRMA_RECHAZADA', 'Firma Rechazada'),
        ('FIRMA_DELEGADA', 'Firma Delegada'),
        ('FIRMA_INVALIDADA', 'Firma Invalidada'),
        ('INTENTO_NO_AUTORIZADO', 'Intento No Autorizado'),
        ('HASH_VERIFICADO', 'Hash Verificado'),
        ('HASH_INVALIDO', 'Hash Inválido'),
    ]

    accion = models.CharField(
        max_length=30,
        choices=ACCION_CHOICES,
        verbose_name='Acción',
        db_index=True
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='historial_firmas',
        verbose_name='Usuario'
    )

    descripcion = models.TextField(
        verbose_name='Descripción',
        help_text='Descripción detallada de la acción'
    )

    metadatos = models.JSONField(
        default=dict,
        verbose_name='Metadatos',
        help_text='Datos adicionales de contexto'
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='Dirección IP'
    )

    class Meta:
        db_table = 'workflow_historial_firma'
        verbose_name = 'Historial de Firma'
        verbose_name_plural = 'Historial de Firmas'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['firma', '-created_at']),
            models.Index(fields=['accion', '-created_at']),
        ]

    def __str__(self):
        return f"{self.get_accion_display()} - {self.usuario.get_full_name()} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"


class DelegacionFirma(TenantModel):
    """
    Delegación temporal de autoridad de firma.

    Permite que un usuario delegue su autoridad de firma a otro usuario
    por un período determinado (ej: vacaciones, ausencias).
    """

    delegante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='delegaciones_otorgadas',
        verbose_name='Delegante'
    )
    delegado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='delegaciones_recibidas',
        verbose_name='Delegado'
    )

    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        related_name='delegaciones_firma',
        verbose_name='Cargo Delegado'
    )

    # Alcance de la delegación
    roles_delegados = models.JSONField(
        default=list,
        verbose_name='Roles Delegados',
        help_text='Lista de roles de firma que se delegan (ELABORO, REVISO, APROBO)'
    )

    # Tipos de documento específicos (opcional - si está vacío aplica a todos)
    tipos_documento = models.ManyToManyField(
        ContentType,
        blank=True,
        related_name='delegaciones_firma',
        verbose_name='Tipos de Documento',
        help_text='Si está vacío, aplica a todos los tipos'
    )

    # Vigencia
    fecha_inicio = models.DateTimeField(
        verbose_name='Fecha de Inicio',
        db_index=True
    )
    fecha_fin = models.DateTimeField(
        verbose_name='Fecha de Fin',
        db_index=True
    )

    motivo = models.TextField(
        verbose_name='Motivo de la Delegación'
    )

    # Estado
    esta_activa = models.BooleanField(
        default=True,
        verbose_name='Está Activa',
        db_index=True
    )
    fecha_revocacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Revocación'
    )
    motivo_revocacion = models.TextField(
        blank=True,
        verbose_name='Motivo de Revocación'
    )

    class Meta:
        db_table = 'workflow_delegacion_firma'
        verbose_name = 'Delegación de Firma'
        verbose_name_plural = 'Delegaciones de Firma'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['delegante', 'esta_activa', 'fecha_fin']),
            models.Index(fields=['delegado', 'esta_activa', 'fecha_fin']),
        ]

    def __str__(self):
        return f"{self.delegante.get_full_name()} → {self.delegado.get_full_name()} ({self.fecha_inicio.strftime('%Y-%m-%d')} a {self.fecha_fin.strftime('%Y-%m-%d')})"

    def is_vigente(self):
        """Verifica si la delegación está vigente"""
        now = timezone.now()
        return (
            self.esta_activa and
            self.fecha_inicio <= now <= self.fecha_fin and
            not self.fecha_revocacion
        )

    def revocar(self, motivo=""):
        """Revoca la delegación antes de tiempo"""
        self.esta_activa = False
        self.fecha_revocacion = timezone.now()
        self.motivo_revocacion = motivo
        self.save(update_fields=['esta_activa', 'fecha_revocacion', 'motivo_revocacion'])

    def puede_firmar_documento(self, content_type, rol_firma):
        """Verifica si esta delegación permite firmar un documento específico"""
        if not self.is_vigente():
            return False

        # Verificar rol
        if rol_firma not in self.roles_delegados:
            return False

        # Verificar tipo de documento (si hay restricción)
        if self.tipos_documento.exists():
            return self.tipos_documento.filter(pk=content_type.pk).exists()

        return True


# ==============================================================================
# MODELOS DE REVISIÓN PERIÓDICA
# ==============================================================================

class ConfiguracionRevision(TenantModel):
    """
    Configuración de ciclos de revisión periódica para políticas.

    Define:
    - Frecuencia de revisión (anual, semestral, etc.)
    - Alertas automáticas (30, 15, 7 días antes)
    - Responsables de revisión
    - Workflow de renovación
    """

    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Configuración'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    # Frecuencia
    frecuencia = models.CharField(
        max_length=20,
        choices=FRECUENCIA_REVISION_CHOICES,
        verbose_name='Frecuencia de Revisión',
        db_index=True
    )
    dias_personalizados = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Días Personalizados',
        help_text='Solo si frecuencia es PERSONALIZADO'
    )

    # Alertas (días antes del vencimiento)
    dias_alerta_1 = models.PositiveIntegerField(
        default=30,
        verbose_name='Primera Alerta (días antes)'
    )
    dias_alerta_2 = models.PositiveIntegerField(
        default=15,
        verbose_name='Segunda Alerta (días antes)'
    )
    dias_alerta_3 = models.PositiveIntegerField(
        default=7,
        verbose_name='Tercera Alerta (días antes)'
    )

    # Alertas el día del vencimiento
    alerta_dia_vencimiento = models.BooleanField(
        default=True,
        verbose_name='Alerta el Día del Vencimiento'
    )

    # Alertas después del vencimiento
    alertas_post_vencimiento = models.BooleanField(
        default=True,
        verbose_name='Alertas Post Vencimiento'
    )
    dias_escalamiento = models.PositiveIntegerField(
        default=7,
        verbose_name='Días para Escalamiento',
        help_text='Días después del vencimiento para escalar a niveles superiores'
    )

    # Responsables
    responsable_revision = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        related_name='configuraciones_revision_responsable',
        verbose_name='Cargo Responsable de Revisión'
    )
    responsable_escalamiento = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='configuraciones_revision_escalamiento',
        verbose_name='Cargo para Escalamiento'
    )

    # Workflow de renovación
    renovacion_automatica = models.BooleanField(
        default=False,
        verbose_name='Renovación Automática',
        help_text='Si es True, renueva automáticamente sin cambios'
    )
    requiere_revision_contenido = models.BooleanField(
        default=True,
        verbose_name='Requiere Revisión de Contenido'
    )
    flujo_firma_renovacion = models.ForeignKey(
        ConfiguracionFlujoFirma,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='configuraciones_revision',
        verbose_name='Flujo de Firma para Renovación'
    )

    # Aplicación
    aplica_a_content_types = models.ManyToManyField(
        ContentType,
        related_name='configuraciones_revision',
        verbose_name='Aplica a Tipos de Contenido'
    )

    class Meta:
        db_table = 'workflow_configuracion_revision'
        verbose_name = 'Configuración de Revisión'
        verbose_name_plural = 'Configuraciones de Revisión'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_frecuencia_display()})"

    def calcular_proxima_revision(self, fecha_base=None):
        """Calcula la próxima fecha de revisión desde una fecha base"""
        from dateutil.relativedelta import relativedelta

        if fecha_base is None:
            fecha_base = timezone.now().date()

        if self.frecuencia == 'ANUAL':
            return fecha_base + relativedelta(years=1)
        elif self.frecuencia == 'SEMESTRAL':
            return fecha_base + relativedelta(months=6)
        elif self.frecuencia == 'CUATRIMESTRAL':
            return fecha_base + relativedelta(months=4)
        elif self.frecuencia == 'TRIMESTRAL':
            return fecha_base + relativedelta(months=3)
        elif self.frecuencia == 'BIMESTRAL':
            return fecha_base + relativedelta(months=2)
        elif self.frecuencia == 'MENSUAL':
            return fecha_base + relativedelta(months=1)
        elif self.frecuencia == 'PERSONALIZADO' and self.dias_personalizados:
            return fecha_base + relativedelta(days=self.dias_personalizados)

        # Default: 1 año
        return fecha_base + relativedelta(years=1)

    def get_fechas_alertas(self, fecha_vencimiento):
        """Obtiene las fechas de todas las alertas configuradas"""
        from datetime import timedelta

        alertas = []

        if self.dias_alerta_1:
            alertas.append({
                'tipo': 'ALERTA_1',
                'fecha': fecha_vencimiento - timedelta(days=self.dias_alerta_1),
                'dias_antes': self.dias_alerta_1
            })

        if self.dias_alerta_2:
            alertas.append({
                'tipo': 'ALERTA_2',
                'fecha': fecha_vencimiento - timedelta(days=self.dias_alerta_2),
                'dias_antes': self.dias_alerta_2
            })

        if self.dias_alerta_3:
            alertas.append({
                'tipo': 'ALERTA_3',
                'fecha': fecha_vencimiento - timedelta(days=self.dias_alerta_3),
                'dias_antes': self.dias_alerta_3
            })

        if self.alerta_dia_vencimiento:
            alertas.append({
                'tipo': 'DIA_VENCIMIENTO',
                'fecha': fecha_vencimiento,
                'dias_antes': 0
            })

        return alertas


class AlertaRevision(TenantModel):
    """
    Alertas automáticas de revisión de políticas.

    Registra y gestiona alertas programadas para recordar
    la revisión periódica de políticas y documentos.
    """

    # Documento asociado
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de Documento'
    )
    object_id = models.UUIDField(
        verbose_name='ID del Documento'
    )
    documento = GenericForeignKey('content_type', 'object_id')

    configuracion_revision = models.ForeignKey(
        ConfiguracionRevision,
        on_delete=models.CASCADE,
        related_name='alertas',
        verbose_name='Configuración de Revisión'
    )

    # Tipo de alerta
    tipo_alerta = models.CharField(
        max_length=30,
        verbose_name='Tipo de Alerta',
        help_text='ALERTA_1, ALERTA_2, ALERTA_3, DIA_VENCIMIENTO, POST_VENCIMIENTO'
    )

    # Fechas
    fecha_vencimiento = models.DateField(
        verbose_name='Fecha de Vencimiento',
        db_index=True
    )
    fecha_programada = models.DateTimeField(
        verbose_name='Fecha Programada de Alerta',
        db_index=True
    )
    fecha_envio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Envío'
    )

    # Destinatarios
    destinatarios = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='alertas_revision',
        verbose_name='Destinatarios'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_ALERTA_CHOICES,
        default='PROGRAMADA',
        verbose_name='Estado',
        db_index=True
    )

    # Respuesta
    atendida_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas_revision_atendidas',
        verbose_name='Atendida Por'
    )
    fecha_atencion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Atención'
    )
    notas_atencion = models.TextField(
        blank=True,
        verbose_name='Notas de Atención'
    )

    # Tarea asociada
    tarea = models.ForeignKey(
        'tareas_recordatorios.Tarea',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas_revision',
        verbose_name='Tarea Asociada'
    )

    # Notificación asociada
    notificacion = models.ForeignKey(
        'centro_notificaciones.Notificacion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas_revision',
        verbose_name='Notificación Asociada'
    )

    class Meta:
        db_table = 'workflow_alerta_revision'
        verbose_name = 'Alerta de Revisión'
        verbose_name_plural = 'Alertas de Revisión'
        ordering = ['fecha_programada']
        indexes = [
            models.Index(fields=['estado', 'fecha_programada']),
            models.Index(fields=['content_type', 'object_id', 'estado']),
            models.Index(fields=['fecha_vencimiento']),
        ]

    def __str__(self):
        return f"Alerta {self.tipo_alerta} - Vence: {self.fecha_vencimiento}"

    def enviar(self):
        """Envía la alerta a los destinatarios"""
        from apps.audit_system.centro_notificaciones.models import Notificacion, TipoNotificacion
        from apps.audit_system.tareas_recordatorios.models import Tarea

        if self.estado != 'PROGRAMADA':
            return False

        # Crear tarea para el responsable
        responsable = self.configuracion_revision.responsable_revision
        usuarios_responsables = responsable.usuarios_activos.all() if hasattr(responsable, 'usuarios_activos') else []

        if usuarios_responsables:
            tarea = Tarea.objects.create(
                titulo=f"Revisión de {self.documento}: {self.tipo_alerta}",
                descripcion=f"Revisar y actualizar el documento que vence el {self.fecha_vencimiento}",
                tipo='automatica',
                prioridad='alta' if self.tipo_alerta in ['ALERTA_3', 'DIA_VENCIMIENTO'] else 'normal',
                estado='pendiente',
                asignado_a=usuarios_responsables[0],
                creado_por=None,
                fecha_limite=timezone.now() + timezone.timedelta(days=7),
                content_type=self.content_type,
                object_id=str(self.object_id)
            )
            self.tarea = tarea

        # Crear notificación para cada destinatario
        from apps.audit_system.centro_notificaciones.services import NotificationService

        doc_titulo = str(self.documento) if self.documento else f'Documento #{self.object_id}'
        prioridad = 'alta' if self.tipo_alerta in ['ALERTA_3', 'DIA_VENCIMIENTO', 'POST_VENCIMIENTO'] else 'normal'
        ultima_notificacion = None

        for destinatario in self.destinatarios.all():
            ultima_notificacion = NotificationService.send_notification(
                tipo_codigo='DOCUMENTO_REVISION',
                usuario=destinatario,
                titulo=f'Revision requerida: {doc_titulo}',
                mensaje=f'El documento "{doc_titulo}" requiere revision. Vence el {self.fecha_vencimiento}. Alerta: {self.tipo_alerta}.',
                url='/sistema-gestion/documentos',
                prioridad=prioridad,
                datos_extra={
                    'tipo_alerta': self.tipo_alerta,
                    'fecha_vencimiento': str(self.fecha_vencimiento),
                    'documento_titulo': doc_titulo,
                },
            )

        if ultima_notificacion:
            self.notificacion = ultima_notificacion

        self.estado = 'ENVIADA'
        self.fecha_envio = timezone.now()
        self.save(update_fields=['estado', 'fecha_envio', 'tarea', 'notificacion'])

        return True

    def marcar_atendida(self, usuario, notas=""):
        """Marca la alerta como atendida"""
        self.estado = 'ATENDIDA'
        self.atendida_por = usuario
        self.fecha_atencion = timezone.now()
        self.notas_atencion = notas
        self.save(update_fields=['estado', 'atendida_por', 'fecha_atencion', 'notas_atencion'])


# ==============================================================================
# MODELOS DE VERSIONAMIENTO
# ==============================================================================

class HistorialVersion(TenantModel):
    """
    Historial de versiones de políticas y documentos.

    Implementa versionamiento semántico (MAJOR.MINOR.PATCH) con:
    - Comparación visual entre versiones (diff)
    - Historial de cambios
    - Rastreabilidad completa
    """

    # Documento versionado
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name='Tipo de Documento'
    )
    object_id = models.UUIDField(
        verbose_name='ID del Documento'
    )
    documento = GenericForeignKey('content_type', 'object_id')

    # Versión
    version = models.CharField(
        max_length=20,
        verbose_name='Versión',
        help_text='Versión en formato semántico: MAJOR.MINOR.PATCH',
        db_index=True
    )
    version_anterior = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Versión Anterior'
    )

    tipo_cambio = models.CharField(
        max_length=10,
        choices=TIPO_VERSION_CHOICES,
        verbose_name='Tipo de Cambio'
    )

    # Contenido
    titulo = models.CharField(
        max_length=500,
        verbose_name='Título'
    )
    contenido = models.TextField(
        verbose_name='Contenido Completo',
        help_text='Snapshot del contenido en esta versión'
    )
    contenido_hash = models.CharField(
        max_length=64,
        verbose_name='Hash del Contenido'
    )

    # Cambios
    motivo_cambio = models.TextField(
        verbose_name='Motivo del Cambio',
        help_text='Descripción de por qué se hizo este cambio'
    )
    cambios_realizados = models.JSONField(
        default=list,
        verbose_name='Cambios Realizados',
        help_text='Lista detallada de cambios: [{"campo": "X", "anterior": "A", "nuevo": "B"}]'
    )

    # Diff
    diff_texto = models.TextField(
        blank=True,
        verbose_name='Diff de Texto',
        help_text='Diff en formato unificado para comparación visual'
    )

    # Metadatos
    fecha_version = models.DateTimeField(
        verbose_name='Fecha de Versión',
        db_index=True
    )
    usuario_version = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='versiones_documentos',
        verbose_name='Usuario'
    )

    # Estado en esta versión
    estado_documento = models.CharField(
        max_length=20,
        verbose_name='Estado del Documento en esta Versión'
    )

    # Firmas en esta versión
    firmas = models.ManyToManyField(
        FirmaDigital,
        blank=True,
        related_name='versiones',
        verbose_name='Firmas de esta Versión'
    )

    # Archivos
    archivo_pdf = models.FileField(
        upload_to='versiones/pdf/',
        blank=True,
        null=True,
        verbose_name='Archivo PDF de esta Versión'
    )
    archivo_original = models.FileField(
        upload_to='versiones/original/',
        blank=True,
        null=True,
        verbose_name='Archivo Original'
    )

    class Meta:
        db_table = 'workflow_historial_version'
        verbose_name = 'Historial de Versión'
        verbose_name_plural = 'Historial de Versiones'
        ordering = ['-fecha_version']
        indexes = [
            models.Index(fields=['content_type', 'object_id', '-fecha_version']),
            models.Index(fields=['version']),
            models.Index(fields=['usuario_version', '-fecha_version']),
        ]
        unique_together = [['content_type', 'object_id', 'version']]

    def __str__(self):
        return f"v{self.version} - {self.titulo} ({self.fecha_version.strftime('%Y-%m-%d')})"

    def save(self, *args, **kwargs):
        """Override save para generar hash del contenido"""
        if not self.contenido_hash:
            self.contenido_hash = hashlib.sha256(self.contenido.encode('utf-8')).hexdigest()
        super().save(*args, **kwargs)

    @classmethod
    def crear_version(cls, documento, tipo_cambio, motivo, cambios, usuario):
        """
        Crea una nueva versión del documento.

        Args:
            documento: Instancia del documento a versionar
            tipo_cambio: MAJOR, MINOR o PATCH
            motivo: Descripción del motivo del cambio
            cambios: Lista de cambios realizados
            usuario: Usuario que realiza el cambio

        Returns:
            HistorialVersion: Nueva versión creada
        """
        from django.contrib.contenttypes.models import ContentType

        # Obtener versión actual
        version_actual = getattr(documento, 'version', '1.0.0')
        nueva_version = cls.incrementar_version(version_actual, tipo_cambio)

        # Crear snapshot
        content_type = ContentType.objects.get_for_model(documento)

        version = cls.objects.create(
            content_type=content_type,
            object_id=documento.pk,
            version=nueva_version,
            version_anterior=version_actual,
            tipo_cambio=tipo_cambio,
            titulo=getattr(documento, 'title', getattr(documento, 'nombre', str(documento))),
            contenido=getattr(documento, 'content', getattr(documento, 'contenido', '')),
            motivo_cambio=motivo,
            cambios_realizados=cambios,
            fecha_version=timezone.now(),
            usuario_version=usuario,
            estado_documento=getattr(documento, 'status', getattr(documento, 'estado', '')),
            created_by=usuario
        )

        # Calcular diff si existe versión anterior
        version_anterior_obj = cls.objects.filter(
            content_type=content_type,
            object_id=documento.pk,
            version=version_actual
        ).first()

        if version_anterior_obj:
            version.diff_texto = cls.calcular_diff(
                version_anterior_obj.contenido,
                version.contenido
            )
            version.save(update_fields=['diff_texto'])

        # Actualizar versión en el documento
        documento.version = nueva_version
        documento.save(update_fields=['version'])

        return version

    @staticmethod
    def incrementar_version(version_actual, tipo_cambio):
        """Incrementa la versión según el tipo de cambio"""
        try:
            partes = version_actual.split('.')
            major = int(partes[0]) if len(partes) > 0 else 1
            minor = int(partes[1]) if len(partes) > 1 else 0
            patch = int(partes[2]) if len(partes) > 2 else 0

            if tipo_cambio == 'MAJOR':
                major += 1
                minor = 0
                patch = 0
            elif tipo_cambio == 'MINOR':
                minor += 1
                patch = 0
            else:  # PATCH
                patch += 1

            return f"{major}.{minor}.{patch}"
        except (ValueError, IndexError, AttributeError):
            return "1.0.0"

    @staticmethod
    def calcular_diff(texto_anterior, texto_nuevo):
        """Calcula diff entre dos textos"""
        import difflib

        lineas_anterior = texto_anterior.splitlines(keepends=True)
        lineas_nuevo = texto_nuevo.splitlines(keepends=True)

        diff = difflib.unified_diff(
            lineas_anterior,
            lineas_nuevo,
            lineterm='',
            fromfile='Versión Anterior',
            tofile='Versión Nueva'
        )

        return '\n'.join(diff)

    def comparar_con_anterior(self):
        """Obtiene la comparación con la versión anterior"""
        if not self.version_anterior:
            return None

        version_anterior = HistorialVersion.objects.filter(
            content_type=self.content_type,
            object_id=self.object_id,
            version=self.version_anterior
        ).first()

        if not version_anterior:
            return None

        return {
            'version_anterior': self.version_anterior,
            'version_nueva': self.version,
            'diff': self.diff_texto,
            'cambios': self.cambios_realizados,
            'motivo': self.motivo_cambio
        }
