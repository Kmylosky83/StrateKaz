"""
Modelos para Workflow de Firma Digital de Políticas
Sistema de Gestión StrateKaz

Cumplimiento:
- ISO 9001:2015 - Cláusula 5.2 (Política de Calidad)
- ISO 45001:2018 - Cláusula 5.2 (Política de SST)
- Decreto 1072/2015 - Política de SST

Features:
- Firma digital manuscrita (canvas signature)
- Workflow de firma múltiple (elaboró, revisó, aprobó)
- Verificación de integridad (hash SHA-256)
- Historial completo de firmas
- Almacenamiento seguro
- Revocación de firmas
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
import hashlib
import json

from apps.core.base_models import TimestampedModel


# ==============================================================================
# CHOICES
# ==============================================================================

ROL_FIRMANTE_CHOICES = [
    ('ELABORO', 'Elaboró'),
    ('REVISO_TECNICO', 'Revisó Técnico'),
    ('REVISO_JURIDICO', 'Revisó Jurídico'),
    ('APROBO_DIRECTOR', 'Aprobó Director'),
    ('APROBO_GERENTE', 'Aprobó Gerente'),
    ('APROBO_REPRESENTANTE_LEGAL', 'Aprobó Representante Legal'),
]

ESTADO_FIRMA_CHOICES = [
    ('PENDIENTE', 'Pendiente'),
    ('FIRMADO', 'Firmado'),
    ('RECHAZADO', 'Rechazado'),
    ('REVOCADO', 'Revocado'),
]

TIPO_POLITICA_FIRMABLE_CHOICES = [
    ('INTEGRAL', 'Política Integral'),
    ('ESPECIFICA', 'Política Específica'),
]


# ==============================================================================
# MODELOS DE WORKFLOW DE FIRMA
# ==============================================================================

class ConfiguracionFlujoFirma(TimestampedModel):
    """
    Configuración de flujos de firma por tipo de política.

    Define qué roles deben firmar y en qué orden para cada tipo de política.
    Permite configuración flexible por empresa/organización.
    """

    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Flujo',
        help_text='Nombre descriptivo del flujo de firma'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    tipo_politica = models.CharField(
        max_length=20,
        choices=TIPO_POLITICA_FIRMABLE_CHOICES,
        verbose_name='Tipo de Política',
        db_index=True
    )

    # Configuración de firmantes requeridos (JSON)
    pasos_firma = models.JSONField(
        default=list,
        verbose_name='Pasos de Firma',
        help_text='''
        Lista ordenada de pasos de firma. Formato:
        [
            {
                "orden": 1,
                "rol_firmante": "ELABORO",
                "rol_cargo_id": "uuid",  // ID del cargo que debe firmar
                "es_opcional": false,
                "puede_delegar": false
            },
            {
                "orden": 2,
                "rol_firmante": "REVISO_TECNICO",
                "rol_cargo_id": "uuid",
                "es_opcional": false,
                "puede_delegar": true
            },
            {
                "orden": 3,
                "rol_firmante": "APROBO_GERENTE",
                "rol_cargo_id": "uuid",
                "es_opcional": false,
                "puede_delegar": false
            }
        ]
        '''
    )

    # Normas ISO aplicables
    normas_iso = models.ManyToManyField(
        'configuracion.NormaISO',
        blank=True,
        related_name='flujos_firma',
        verbose_name='Normas ISO'
    )

    # Control
    es_activo = models.BooleanField(
        default=True,
        verbose_name='Activo',
        db_index=True
    )
    requiere_firma_secuencial = models.BooleanField(
        default=True,
        verbose_name='Requiere Firma Secuencial',
        help_text='Si es True, las firmas deben seguir el orden estricto'
    )

    class Meta:
        db_table = 'identidad_config_flujo_firma'
        verbose_name = 'Configuración de Flujo de Firma'
        verbose_name_plural = 'Configuraciones de Flujos de Firma'
        ordering = ['tipo_politica', 'nombre']

    def __str__(self):
        return f'{self.nombre} ({self.get_tipo_politica_display()})'

    def validar_pasos(self):
        """Valida la estructura de pasos_firma"""
        if not isinstance(self.pasos_firma, list):
            raise ValidationError('pasos_firma debe ser una lista')

        ordenes = set()
        for paso in self.pasos_firma:
            if 'orden' not in paso or 'rol_firmante' not in paso:
                raise ValidationError('Cada paso debe tener orden y rol_firmante')

            if paso['orden'] in ordenes:
                raise ValidationError(f'Orden duplicado: {paso["orden"]}')

            ordenes.add(paso['orden'])

    def clean(self):
        self.validar_pasos()

    @property
    def total_pasos(self):
        """Total de pasos de firma"""
        return len(self.pasos_firma)

    @property
    def pasos_obligatorios(self):
        """Número de pasos obligatorios"""
        return len([p for p in self.pasos_firma if not p.get('es_opcional', False)])


class ProcesoFirmaPolitica(TimestampedModel):
    """
    Proceso de firma para una política (v3.1 - unificado).

    Gestiona el workflow completo de firmas para una política,
    desde inicio hasta finalización o rechazo.

    NOTA v3.1: Consolidado para usar solo PoliticaEspecifica.
    Las políticas integrales se identifican con is_integral_policy=True.
    """

    # Política asociada (unificado v3.1)
    politica = models.ForeignKey(
        'identidad.PoliticaEspecifica',
        on_delete=models.CASCADE,
        related_name='procesos_firma',
        verbose_name='Política',
        null=True,
        blank=True
    )

    # Configuración del flujo
    flujo_firma = models.ForeignKey(
        ConfiguracionFlujoFirma,
        on_delete=models.PROTECT,
        related_name='procesos',
        verbose_name='Flujo de Firma'
    )

    # Estado del proceso
    estado = models.CharField(
        max_length=20,
        choices=[
            ('EN_PROCESO', 'En Proceso'),
            ('COMPLETADO', 'Completado'),
            ('RECHAZADO', 'Rechazado'),
            ('CANCELADO', 'Cancelado'),
        ],
        default='EN_PROCESO',
        verbose_name='Estado',
        db_index=True
    )

    # Control de progreso
    paso_actual = models.PositiveIntegerField(
        default=1,
        verbose_name='Paso Actual',
        help_text='Número del paso actual en el flujo'
    )

    # Fechas clave
    fecha_inicio = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Inicio'
    )
    fecha_completado = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Completado'
    )

    # Usuario que inició el proceso
    iniciado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='procesos_firma_iniciados',
        verbose_name='Iniciado Por'
    )

    # Hash del contenido original (para detectar cambios)
    contenido_hash = models.CharField(
        max_length=64,
        verbose_name='Hash del Contenido',
        help_text='SHA-256 del contenido de la política al iniciar el proceso'
    )

    # Observaciones generales
    observaciones = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones'
    )

    class Meta:
        db_table = 'identidad_proceso_firma_politica'
        verbose_name = 'Proceso de Firma de Política'
        verbose_name_plural = 'Procesos de Firma de Políticas'
        ordering = ['-fecha_inicio']
        indexes = [
            models.Index(fields=['estado', '-fecha_inicio']),
        ]

    def __str__(self):
        return f'Firma: {self.politica} - {self.get_estado_display()}'

    def clean(self):
        """Validación de coherencia (v3.1 - simplificado)"""
        if not self.politica_id:
            raise ValidationError('Debe asociarse a una política')

    def get_politica(self):
        """Retorna la política asociada (v3.1 - unificado)"""
        return self.politica

    def get_politica_display(self):
        """Retorna string display de la política"""
        return str(self.politica) if self.politica else 'N/A'

    @property
    def is_integral_policy(self):
        """Indica si la política es integral (v3.1)"""
        return self.politica.is_integral_policy if self.politica else False

    def calcular_hash_contenido(self):
        """Calcula el hash SHA-256 del contenido de la política"""
        if not self.politica:
            return None
        return hashlib.sha256(self.politica.content.encode('utf-8')).hexdigest()

    def verificar_integridad(self):
        """Verifica que el contenido no haya cambiado"""
        hash_actual = self.calcular_hash_contenido()
        return hash_actual == self.contenido_hash

    def save(self, *args, **kwargs):
        # Calcular hash al crear
        if not self.pk and not self.contenido_hash:
            self.contenido_hash = self.calcular_hash_contenido()

        super().save(*args, **kwargs)

    @property
    def firmas_completadas(self):
        """Número de firmas completadas"""
        return self.firmas.filter(estado='FIRMADO').count()

    @property
    def firmas_pendientes(self):
        """Número de firmas pendientes"""
        return self.firmas.filter(estado='PENDIENTE').count()

    @property
    def progreso_porcentaje(self):
        """Porcentaje de progreso del proceso"""
        total = self.flujo_firma.total_pasos
        if total == 0:
            return 0
        return int((self.firmas_completadas / total) * 100)

    def avanzar_paso(self):
        """Avanza al siguiente paso del flujo"""
        if self.paso_actual < self.flujo_firma.total_pasos:
            self.paso_actual += 1
            self.save(update_fields=['paso_actual'])

    def completar(self):
        """Marca el proceso como completado"""
        self.estado = 'COMPLETADO'
        self.fecha_completado = timezone.now()
        self.save(update_fields=['estado', 'fecha_completado'])

        # Actualizar estado de la política a VIGENTE
        politica = self.get_politica()
        if politica:
            politica.status = 'VIGENTE'
            politica.effective_date = timezone.now().date()
            politica.save(update_fields=['status', 'effective_date'])

    def rechazar(self, motivo=None):
        """Marca el proceso como rechazado"""
        self.estado = 'RECHAZADO'
        if motivo:
            self.observaciones = f'{self.observaciones or ""}\n\nRECHAZADO: {motivo}'.strip()
        self.save(update_fields=['estado', 'observaciones'])


class FirmaPolitica(TimestampedModel):
    """
    Firma individual dentro de un proceso de firma.

    Almacena la firma manuscrita digitalizada, metadatos y
    garantiza la integridad y no repudio.
    """

    proceso_firma = models.ForeignKey(
        ProcesoFirmaPolitica,
        on_delete=models.CASCADE,
        related_name='firmas',
        verbose_name='Proceso de Firma'
    )

    # Información del paso
    orden = models.PositiveIntegerField(
        verbose_name='Orden',
        help_text='Orden del paso en el flujo'
    )
    rol_firmante = models.CharField(
        max_length=30,
        choices=ROL_FIRMANTE_CHOICES,
        verbose_name='Rol del Firmante'
    )

    # Firmante
    cargo = models.ForeignKey(
        'core.Cargo',
        on_delete=models.PROTECT,
        related_name='firmas_politicas',
        verbose_name='Cargo',
        help_text='Cargo que debe firmar'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='firmas_politicas',
        verbose_name='Usuario',
        help_text='Usuario que firmó (persona física)'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_FIRMA_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado',
        db_index=True
    )

    # Firma manuscrita digitalizada (canvas signature)
    firma_imagen = models.TextField(
        blank=True,
        null=True,
        verbose_name='Firma (Base64)',
        help_text='Imagen de la firma en formato Base64 (data URL)'
    )

    # Verificación de integridad
    firma_hash = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        verbose_name='Hash de Firma',
        help_text='SHA-256 de la firma + metadata para verificación'
    )

    # Metadata de la firma
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP Address',
        help_text='Dirección IP desde donde se firmó'
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name='User Agent',
        help_text='Navegador/dispositivo usado para firmar'
    )
    geolocalizacion = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Geolocalización',
        help_text='Coordenadas GPS si están disponibles'
    )

    # Fechas
    fecha_asignacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Asignación'
    )
    fecha_firma = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Firma'
    )
    fecha_limite = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha Límite',
        help_text='Fecha límite para firmar (SLA)'
    )

    # Rechazo/Revocación
    fecha_rechazo = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Rechazo'
    )
    motivo_rechazo = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de Rechazo'
    )
    fecha_revocacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Revocación'
    )
    motivo_revocacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de Revocación'
    )
    revocado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='firmas_revocadas',
        verbose_name='Revocado Por'
    )

    # Comentarios
    comentarios = models.TextField(
        blank=True,
        null=True,
        verbose_name='Comentarios',
        help_text='Comentarios opcionales del firmante'
    )

    # Delegación
    es_delegada = models.BooleanField(
        default=False,
        verbose_name='Es Delegada',
        help_text='Indica si esta firma fue delegada'
    )
    delegado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='firmas_delegadas',
        verbose_name='Delegado Por'
    )

    class Meta:
        db_table = 'identidad_firma_politica'
        verbose_name = 'Firma de Política'
        verbose_name_plural = 'Firmas de Políticas'
        ordering = ['proceso_firma', 'orden']
        unique_together = [['proceso_firma', 'orden']]
        indexes = [
            models.Index(fields=['estado', 'fecha_limite']),
            models.Index(fields=['usuario', '-fecha_firma']),
            models.Index(fields=['cargo', 'estado']),
        ]

    def __str__(self):
        return f'{self.get_rol_firmante_display()} - {self.cargo.name} ({self.get_estado_display()})'

    def firmar(self, usuario, firma_base64, ip_address=None, user_agent=None, comentarios=None):
        """
        Registra la firma del usuario.

        Args:
            usuario: Usuario que firma
            firma_base64: Imagen de la firma en Base64
            ip_address: IP desde donde se firma
            user_agent: Navegador/dispositivo
            comentarios: Comentarios opcionales
        """
        if self.estado != 'PENDIENTE':
            raise ValidationError('Solo se pueden firmar documentos pendientes')

        # Verificar que el usuario tiene permiso
        if usuario not in self.cargo.usuarios.all():
            raise ValidationError(f'El usuario no pertenece al cargo {self.cargo.name}')

        # Registrar firma
        self.usuario = usuario
        self.firma_imagen = firma_base64
        self.estado = 'FIRMADO'
        self.fecha_firma = timezone.now()

        if ip_address:
            self.ip_address = ip_address
        if user_agent:
            self.user_agent = user_agent
        if comentarios:
            self.comentarios = comentarios

        # Calcular hash de integridad
        self.firma_hash = self._calcular_hash()

        self.save()

        # Verificar si el proceso puede avanzar
        self._verificar_avance_proceso()

    def rechazar(self, usuario, motivo):
        """Rechaza la firma (devuelve el proceso)"""
        if self.estado != 'PENDIENTE':
            raise ValidationError('Solo se pueden rechazar firmas pendientes')

        self.estado = 'RECHAZADO'
        self.fecha_rechazo = timezone.now()
        self.motivo_rechazo = motivo
        self.usuario = usuario
        self.save()

        # Marcar proceso como rechazado
        self.proceso_firma.rechazar(motivo)

    def revocar(self, usuario_revoca, motivo):
        """Revoca una firma ya registrada (caso excepcional)"""
        if self.estado != 'FIRMADO':
            raise ValidationError('Solo se pueden revocar firmas completadas')

        self.estado = 'REVOCADO'
        self.fecha_revocacion = timezone.now()
        self.motivo_revocacion = motivo
        self.revocado_por = usuario_revoca
        self.save()

    def _calcular_hash(self):
        """Calcula hash SHA-256 de la firma + metadata"""
        data = {
            'proceso_id': str(self.proceso_firma.id),
            'orden': self.orden,
            'cargo_id': str(self.cargo.id),
            'usuario_id': str(self.usuario.id) if self.usuario else None,
            'fecha_firma': self.fecha_firma.isoformat() if self.fecha_firma else None,
            'firma_imagen': self.firma_imagen[:100],  # Primeros 100 chars
        }

        json_data = json.dumps(data, sort_keys=True)
        return hashlib.sha256(json_data.encode('utf-8')).hexdigest()

    def verificar_integridad(self):
        """Verifica la integridad de la firma"""
        hash_actual = self._calcular_hash()
        return hash_actual == self.firma_hash

    def _verificar_avance_proceso(self):
        """Verifica si el proceso puede avanzar al siguiente paso"""
        proceso = self.proceso_firma

        # Si es firma secuencial, verificar que es el paso actual
        if proceso.flujo_firma.requiere_firma_secuencial:
            if self.orden == proceso.paso_actual:
                # Ver si hay más pasos
                if proceso.paso_actual < proceso.flujo_firma.total_pasos:
                    proceso.avanzar_paso()
                else:
                    # Último paso completado
                    proceso.completar()
        else:
            # Firma paralela: verificar si todos los pasos están completos
            total_firmas = proceso.firmas.count()
            firmas_completadas = proceso.firmas.filter(estado='FIRMADO').count()

            if firmas_completadas == total_firmas:
                proceso.completar()

    @property
    def esta_vencida(self):
        """Indica si la firma está vencida"""
        if self.estado != 'PENDIENTE' or not self.fecha_limite:
            return False
        return timezone.now() > self.fecha_limite

    @property
    def dias_para_vencer(self):
        """Días restantes para firmar"""
        if not self.fecha_limite or self.estado != 'PENDIENTE':
            return None

        delta = self.fecha_limite - timezone.now()
        return delta.days


class HistorialFirmaPolitica(TimestampedModel):
    """
    Historial completo de cambios en firmas.

    Registro inmutable de todas las acciones realizadas en el workflow.
    Cumple con requisitos de auditoría ISO 9001 (7.5.3) e ISO 45001 (7.5).
    """

    firma = models.ForeignKey(
        FirmaPolitica,
        on_delete=models.CASCADE,
        related_name='historial',
        verbose_name='Firma'
    )

    accion = models.CharField(
        max_length=50,
        verbose_name='Acción',
        help_text='Acción realizada (ASIGNADO, FIRMADO, RECHAZADO, REVOCADO)'
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='historial_firmas',
        verbose_name='Usuario'
    )

    detalles = models.JSONField(
        default=dict,
        verbose_name='Detalles',
        help_text='Detalles adicionales de la acción en formato JSON'
    )

    fecha = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha'
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP Address'
    )

    class Meta:
        db_table = 'identidad_historial_firma_politica'
        verbose_name = 'Historial de Firma'
        verbose_name_plural = 'Historiales de Firmas'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['firma', '-fecha']),
        ]

    def __str__(self):
        return f'{self.accion} - {self.usuario} - {self.fecha}'
