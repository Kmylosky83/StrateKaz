"""
Modelos para Sistema Documental - HSEQ Management
Sistema de gestión documental integral con control de versiones, firmas digitales y flujos de aprobación
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal

User = get_user_model()


class TipoDocumento(models.Model):
    """
    Catálogo de tipos de documentos configurables
    Ejemplos: Procedimiento, Instructivo, Formato, Manual, Política, etc.
    """
    NIVEL_DOCUMENTO_CHOICES = [
        ('ESTRATEGICO', 'Estratégico'),
        ('TACTICO', 'Táctico'),
        ('OPERATIVO', 'Operativo'),
        ('SOPORTE', 'Soporte'),
    ]

    codigo = models.CharField(
        max_length=20,
        verbose_name='Código',
        help_text='Código único del tipo (ej: PR, IN, FT, MA)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del Tipo'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    nivel_documento = models.CharField(
        max_length=20,
        choices=NIVEL_DOCUMENTO_CHOICES,
        default='OPERATIVO',
        verbose_name='Nivel del Documento'
    )
    prefijo_codigo = models.CharField(
        max_length=10,
        verbose_name='Prefijo para Códigos',
        help_text='Prefijo para generar códigos automáticos (ej: PR-, IN-)'
    )
    requiere_aprobacion = models.BooleanField(
        default=True,
        verbose_name='Requiere Aprobación'
    )
    requiere_firma = models.BooleanField(
        default=True,
        verbose_name='Requiere Firma Digital'
    )
    tiempo_retencion_años = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1)],
        verbose_name='Tiempo de Retención (años)',
        help_text='Años que debe conservarse el documento'
    )
    plantilla_por_defecto = models.TextField(
        blank=True,
        verbose_name='Plantilla HTML por Defecto',
        help_text='Template HTML base para este tipo de documento'
    )
    campos_obligatorios = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Campos Obligatorios',
        help_text='Lista de campos que son obligatorios para este tipo'
    )
    color_identificacion = models.CharField(
        max_length=7,
        default='#3498db',
        verbose_name='Color de Identificación',
        help_text='Color HEX para identificar visualmente el tipo'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de visualización'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='hseq_tipos_documento_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'documental_tipo_documento'
        verbose_name = 'Tipo de Documento'
        verbose_name_plural = 'Tipos de Documentos'
        ordering = ['orden', 'codigo']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'is_active']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class PlantillaDocumento(models.Model):
    """
    Plantillas base con estructura predefinida para generación de documentos
    """
    TIPO_PLANTILLA_CHOICES = [
        ('HTML', 'HTML'),
        ('MARKDOWN', 'Markdown'),
        ('FORMULARIO', 'Formulario Dinámico'),
    ]

    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('ACTIVA', 'Activa'),
        ('OBSOLETA', 'Obsoleta'),
    ]

    codigo = models.CharField(
        max_length=50,
        verbose_name='Código de Plantilla'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Plantilla'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    tipo_documento = models.ForeignKey(
        TipoDocumento,
        on_delete=models.PROTECT,
        related_name='plantillas',
        verbose_name='Tipo de Documento'
    )
    tipo_plantilla = models.CharField(
        max_length=20,
        choices=TIPO_PLANTILLA_CHOICES,
        default='HTML',
        verbose_name='Tipo de Plantilla'
    )
    contenido_plantilla = models.TextField(
        verbose_name='Contenido de la Plantilla',
        help_text='HTML, Markdown o JSON con estructura del formulario'
    )
    variables_disponibles = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Variables Disponibles',
        help_text='Variables que se pueden usar en la plantilla {{variable}}'
    )
    estilos_css = models.TextField(
        blank=True,
        verbose_name='Estilos CSS',
        help_text='CSS personalizado para la plantilla'
    )
    encabezado = models.TextField(
        blank=True,
        verbose_name='Encabezado',
        help_text='HTML para encabezado del documento'
    )
    pie_pagina = models.TextField(
        blank=True,
        verbose_name='Pie de Página',
        help_text='HTML para pie de página del documento'
    )
    version = models.CharField(
        max_length=20,
        default='1.0',
        verbose_name='Versión de la Plantilla'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR',
        verbose_name='Estado'
    )
    es_por_defecto = models.BooleanField(
        default=False,
        verbose_name='¿Es Plantilla por Defecto?'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='plantillas_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'documental_plantilla_documento'
        verbose_name = 'Plantilla de Documento'
        verbose_name_plural = 'Plantillas de Documentos'
        ordering = ['-es_por_defecto', 'nombre']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo_documento']),
            models.Index(fields=['empresa_id', 'estado']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre} (v{self.version})"


class Documento(models.Model):
    """
    Documentos del sistema con control de versiones completo
    """
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('EN_REVISION', 'En Revisión'),
        ('APROBADO', 'Aprobado'),
        ('PUBLICADO', 'Publicado'),
        ('OBSOLETO', 'Obsoleto'),
        ('ARCHIVADO', 'Archivado'),
    ]

    CLASIFICACION_CHOICES = [
        ('PUBLICO', 'Público'),
        ('INTERNO', 'Interno'),
        ('CONFIDENCIAL', 'Confidencial'),
        ('RESTRINGIDO', 'Restringido'),
    ]

    # Identificación
    codigo = models.CharField(
        max_length=50,
        verbose_name='Código del Documento',
        help_text='Código único generado automáticamente'
    )
    titulo = models.CharField(
        max_length=255,
        verbose_name='Título del Documento'
    )
    tipo_documento = models.ForeignKey(
        TipoDocumento,
        on_delete=models.PROTECT,
        related_name='documentos',
        verbose_name='Tipo de Documento'
    )
    plantilla = models.ForeignKey(
        PlantillaDocumento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_generados',
        verbose_name='Plantilla Usada'
    )

    # Contenido
    resumen = models.TextField(
        blank=True,
        verbose_name='Resumen',
        help_text='Resumen ejecutivo del documento'
    )
    contenido = models.TextField(
        verbose_name='Contenido del Documento',
        help_text='Contenido completo en HTML o Markdown'
    )
    datos_formulario = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Datos del Formulario',
        help_text='Datos capturados si es un formulario dinámico'
    )
    palabras_clave = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Palabras Clave',
        help_text='Tags para búsqueda'
    )

    # Versionamiento
    version_actual = models.CharField(
        max_length=20,
        default='1.0',
        verbose_name='Versión Actual'
    )
    numero_revision = models.IntegerField(
        default=0,
        verbose_name='Número de Revisión',
        help_text='Contador de revisiones/modificaciones'
    )

    # Estado y flujo
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR',
        verbose_name='Estado',
        db_index=True
    )
    clasificacion = models.CharField(
        max_length=20,
        choices=CLASIFICACION_CHOICES,
        default='INTERNO',
        verbose_name='Clasificación de Seguridad'
    )

    # Fechas importantes
    fecha_creacion = models.DateField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    fecha_aprobacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )
    fecha_publicacion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Publicación'
    )
    fecha_vigencia = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Vigencia',
        help_text='Fecha desde la cual el documento está vigente'
    )
    fecha_revision_programada = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Revisión Programada'
    )
    fecha_obsolescencia = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Obsolescencia'
    )

    # Responsables
    elaborado_por = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='documentos_elaborados',
        verbose_name='Elaborado por'
    )
    revisado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_revisados',
        verbose_name='Revisado por'
    )
    aprobado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_aprobados',
        verbose_name='Aprobado por'
    )

    # Control de distribución
    areas_aplicacion = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Áreas de Aplicación',
        help_text='Áreas de la empresa donde aplica el documento'
    )
    puestos_aplicacion = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Puestos de Aplicación',
        help_text='Puestos de trabajo que deben conocer este documento'
    )
    usuarios_autorizados = models.ManyToManyField(
        User,
        blank=True,
        related_name='documentos_autorizados',
        verbose_name='Usuarios Autorizados',
        help_text='Usuarios con acceso a documentos confidenciales/restringidos'
    )

    # Archivos adjuntos
    archivo_pdf = models.FileField(
        upload_to='documentos/pdf/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Archivo PDF',
        help_text='Versión PDF del documento'
    )
    archivos_anexos = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Archivos Anexos',
        help_text='Lista de archivos anexos al documento'
    )

    # Relaciones
    documento_padre = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_relacionados',
        verbose_name='Documento Padre'
    )
    documentos_referenciados = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=False,
        related_name='referenciado_por',
        verbose_name='Documentos Referenciados'
    )

    # Estadísticas
    numero_descargas = models.IntegerField(
        default=0,
        verbose_name='Número de Descargas'
    )
    numero_impresiones = models.IntegerField(
        default=0,
        verbose_name='Número de Impresiones'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )
    motivo_cambio_version = models.TextField(
        blank=True,
        verbose_name='Motivo del Cambio de Versión'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'documental_documento'
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'
        ordering = ['-fecha_publicacion', 'codigo']
        unique_together = ['empresa_id', 'codigo']
        indexes = [
            models.Index(fields=['empresa_id', 'tipo_documento']),
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['empresa_id', 'clasificacion']),
            models.Index(fields=['fecha_revision_programada']),
            models.Index(fields=['codigo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.titulo} (v{self.version_actual})"


class VersionDocumento(models.Model):
    """
    Historial de versiones de documentos con control de cambios completo
    """
    TIPO_CAMBIO_CHOICES = [
        ('CREACION', 'Creación'),
        ('REVISION_MENOR', 'Revisión Menor'),
        ('REVISION_MAYOR', 'Revisión Mayor'),
        ('CORRECCION', 'Corrección'),
        ('ACTUALIZACION', 'Actualización'),
    ]

    documento = models.ForeignKey(
        Documento,
        on_delete=models.CASCADE,
        related_name='versiones',
        verbose_name='Documento'
    )
    numero_version = models.CharField(
        max_length=20,
        verbose_name='Número de Versión'
    )
    tipo_cambio = models.CharField(
        max_length=20,
        choices=TIPO_CAMBIO_CHOICES,
        default='REVISION_MENOR',
        verbose_name='Tipo de Cambio'
    )

    # Snapshot del contenido
    contenido_snapshot = models.TextField(
        verbose_name='Snapshot del Contenido',
        help_text='Copia completa del contenido en esta versión'
    )
    datos_formulario_snapshot = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Snapshot de Datos del Formulario'
    )

    # Detalles del cambio
    descripcion_cambios = models.TextField(
        verbose_name='Descripción de Cambios',
        help_text='Detalle de qué se modificó en esta versión'
    )
    cambios_detectados = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Cambios Detectados',
        help_text='Lista automática de diferencias con versión anterior'
    )

    # Información de versión
    fecha_version = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de la Versión'
    )
    creado_por = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='versiones_documento_creadas',
        verbose_name='Creado por'
    )
    aprobado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='versiones_documento_aprobadas',
        verbose_name='Aprobado por'
    )
    fecha_aprobacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Aprobación'
    )

    # Archivos
    archivo_pdf_version = models.FileField(
        upload_to='documentos/versiones/pdf/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Archivo PDF de la Versión'
    )

    # Estado
    is_version_actual = models.BooleanField(
        default=False,
        verbose_name='¿Es Versión Actual?'
    )

    # Checksum para integridad
    checksum = models.CharField(
        max_length=64,
        blank=True,
        verbose_name='Checksum SHA-256',
        help_text='Hash para verificar integridad del contenido'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    class Meta:
        db_table = 'documental_version_documento'
        verbose_name = 'Versión de Documento'
        verbose_name_plural = 'Versiones de Documentos'
        ordering = ['-fecha_version']
        unique_together = ['documento', 'numero_version']
        indexes = [
            models.Index(fields=['empresa_id', 'documento']),
            models.Index(fields=['fecha_version']),
        ]

    def __str__(self):
        return f"{self.documento.codigo} - Versión {self.numero_version}"


class CampoFormulario(models.Model):
    """
    Campos dinámicos configurables para Form Builder
    """
    TIPO_CAMPO_CHOICES = [
        ('TEXT', 'Texto Corto'),
        ('TEXTAREA', 'Texto Largo'),
        ('NUMBER', 'Número'),
        ('DATE', 'Fecha'),
        ('DATETIME', 'Fecha y Hora'),
        ('SELECT', 'Lista Desplegable'),
        ('MULTISELECT', 'Selección Múltiple'),
        ('RADIO', 'Opción Única'),
        ('CHECKBOX', 'Casillas de Verificación'),
        ('FILE', 'Archivo'),
        ('EMAIL', 'Email'),
        ('PHONE', 'Teléfono'),
        ('URL', 'URL'),
        ('SIGNATURE', 'Firma'),
        ('TABLA', 'Tabla Dinámica'),
        ('SECCION', 'Sección/Separador'),
    ]

    plantilla = models.ForeignKey(
        PlantillaDocumento,
        on_delete=models.CASCADE,
        related_name='campos_formulario',
        verbose_name='Plantilla',
        null=True,
        blank=True,
        help_text='Plantilla a la que pertenece (si aplica)'
    )
    tipo_documento = models.ForeignKey(
        TipoDocumento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='campos_personalizados',
        verbose_name='Tipo de Documento'
    )

    # Identificación
    nombre_campo = models.CharField(
        max_length=100,
        verbose_name='Nombre del Campo',
        help_text='Nombre interno del campo (sin espacios)'
    )
    etiqueta = models.CharField(
        max_length=200,
        verbose_name='Etiqueta',
        help_text='Texto que se muestra al usuario'
    )
    tipo_campo = models.CharField(
        max_length=20,
        choices=TIPO_CAMPO_CHOICES,
        verbose_name='Tipo de Campo'
    )

    # Configuración
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción/Ayuda',
        help_text='Texto de ayuda para el usuario'
    )
    placeholder = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Placeholder',
        help_text='Texto de ejemplo en el campo'
    )
    valor_por_defecto = models.TextField(
        blank=True,
        verbose_name='Valor por Defecto'
    )

    # Opciones (para SELECT, RADIO, etc.)
    opciones = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Opciones',
        help_text='Lista de opciones para campos de selección'
    )

    # Validaciones
    es_obligatorio = models.BooleanField(
        default=False,
        verbose_name='¿Es Obligatorio?'
    )
    validacion_regex = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Expresión Regular de Validación'
    )
    mensaje_validacion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Mensaje de Error de Validación'
    )
    valor_minimo = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Valor Mínimo',
        help_text='Para campos numéricos o de fecha'
    )
    valor_maximo = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Valor Máximo'
    )
    longitud_minima = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Longitud Mínima',
        help_text='Para campos de texto'
    )
    longitud_maxima = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Longitud Máxima'
    )

    # Configuración de tabla dinámica
    columnas_tabla = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Columnas de Tabla',
        help_text='Definición de columnas si tipo_campo es TABLA'
    )

    # Diseño
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de aparición en el formulario'
    )
    ancho_columna = models.IntegerField(
        default=12,
        validators=[MinValueValidator(1)],
        verbose_name='Ancho de Columna',
        help_text='Ancho en sistema de 12 columnas (1-12)'
    )
    clase_css = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Clase CSS Personalizada'
    )

    # Visibilidad condicional
    condicion_visible = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Condición de Visibilidad',
        help_text='Regla JSON para mostrar/ocultar campo condicionalmente'
    )

    # Estado
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='campos_formulario_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'documental_campo_formulario'
        verbose_name = 'Campo de Formulario'
        verbose_name_plural = 'Campos de Formulario'
        ordering = ['orden', 'nombre_campo']
        indexes = [
            models.Index(fields=['empresa_id', 'plantilla']),
            models.Index(fields=['empresa_id', 'tipo_documento']),
        ]

    def __str__(self):
        return f"{self.etiqueta} ({self.tipo_campo})"


class FirmaDocumento(models.Model):
    """
    Registro de firmas digitales en documentos
    """
    TIPO_FIRMA_CHOICES = [
        ('ELABORACION', 'Elaboración'),
        ('REVISION', 'Revisión'),
        ('APROBACION', 'Aprobación'),
        ('CONFORMIDAD', 'Conformidad'),
        ('VALIDACION', 'Validación'),
    ]

    ESTADO_FIRMA_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('FIRMADO', 'Firmado'),
        ('RECHAZADO', 'Rechazado'),
        ('REVOCADO', 'Revocado'),
    ]

    documento = models.ForeignKey(
        Documento,
        on_delete=models.CASCADE,
        related_name='firmas',
        verbose_name='Documento'
    )
    version_documento = models.ForeignKey(
        VersionDocumento,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='firmas',
        verbose_name='Versión del Documento'
    )

    # Información de la firma
    tipo_firma = models.CharField(
        max_length=20,
        choices=TIPO_FIRMA_CHOICES,
        verbose_name='Tipo de Firma'
    )
    firmante = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='firmas_realizadas',
        verbose_name='Firmante'
    )
    cargo_firmante = models.CharField(
        max_length=200,
        verbose_name='Cargo del Firmante',
        help_text='Cargo al momento de la firma'
    )

    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_FIRMA_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado de la Firma'
    )

    # Detalles de la firma
    fecha_solicitud = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Solicitud'
    )
    fecha_firma = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Firma'
    )

    # Firma digital
    firma_digital = models.TextField(
        blank=True,
        verbose_name='Firma Digital',
        help_text='Imagen o hash de la firma'
    )
    certificado_digital = models.TextField(
        blank=True,
        verbose_name='Certificado Digital',
        help_text='Certificado o token de validación'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='Dirección IP',
        help_text='IP desde donde se firmó'
    )
    user_agent = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='User Agent',
        help_text='Navegador usado para firmar'
    )

    # Geolocalización (opcional)
    latitud = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name='Latitud'
    )
    longitud = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name='Longitud'
    )

    # Observaciones
    comentarios = models.TextField(
        blank=True,
        verbose_name='Comentarios',
        help_text='Comentarios del firmante'
    )
    motivo_rechazo = models.TextField(
        blank=True,
        verbose_name='Motivo de Rechazo',
        help_text='Si fue rechazado, motivo del rechazo'
    )

    # Orden de firma
    orden_firma = models.IntegerField(
        default=1,
        verbose_name='Orden de Firma',
        help_text='Secuencia en el flujo de firmas (1, 2, 3...)'
    )

    # Validación
    checksum_documento = models.CharField(
        max_length=64,
        blank=True,
        verbose_name='Checksum del Documento',
        help_text='Hash del documento al momento de firmar'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'documental_firma_documento'
        verbose_name = 'Firma de Documento'
        verbose_name_plural = 'Firmas de Documentos'
        ordering = ['orden_firma', 'fecha_solicitud']
        indexes = [
            models.Index(fields=['empresa_id', 'documento']),
            models.Index(fields=['empresa_id', 'firmante']),
            models.Index(fields=['empresa_id', 'estado']),
            models.Index(fields=['fecha_firma']),
        ]

    def __str__(self):
        return f"{self.get_tipo_firma_display()} - {self.firmante.get_full_name()} - {self.documento.codigo}"


class ControlDocumental(models.Model):
    """
    Control de distribución, obsolescencia y trazabilidad de documentos
    """
    TIPO_CONTROL_CHOICES = [
        ('DISTRIBUCION', 'Control de Distribución'),
        ('ACTUALIZACION', 'Actualización de Versión'),
        ('RETIRO', 'Retiro/Obsolescencia'),
        ('DESTRUCCION', 'Destrucción'),
        ('ARCHIVO', 'Archivo'),
    ]

    MEDIO_DISTRIBUCION_CHOICES = [
        ('DIGITAL', 'Digital'),
        ('IMPRESO', 'Impreso'),
        ('MIXTO', 'Mixto'),
    ]

    documento = models.ForeignKey(
        Documento,
        on_delete=models.CASCADE,
        related_name='controles',
        verbose_name='Documento'
    )
    version_documento = models.ForeignKey(
        VersionDocumento,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='controles',
        verbose_name='Versión del Documento'
    )

    # Tipo de control
    tipo_control = models.CharField(
        max_length=20,
        choices=TIPO_CONTROL_CHOICES,
        verbose_name='Tipo de Control'
    )

    # Distribución
    fecha_distribucion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Distribución'
    )
    medio_distribucion = models.CharField(
        max_length=20,
        choices=MEDIO_DISTRIBUCION_CHOICES,
        default='DIGITAL',
        verbose_name='Medio de Distribución'
    )
    areas_distribucion = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Áreas de Distribución',
        help_text='Áreas que recibieron el documento'
    )
    usuarios_distribucion = models.ManyToManyField(
        User,
        blank=True,
        related_name='documentos_recibidos',
        verbose_name='Usuarios que Recibieron el Documento'
    )
    numero_copias_impresas = models.IntegerField(
        default=0,
        verbose_name='Número de Copias Impresas'
    )
    numero_copias_controladas = models.IntegerField(
        default=0,
        verbose_name='Número de Copias Controladas',
        help_text='Copias con número de serie'
    )

    # Control de obsolescencia
    fecha_retiro = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Retiro'
    )
    motivo_retiro = models.TextField(
        blank=True,
        verbose_name='Motivo de Retiro/Obsolescencia'
    )
    documento_sustituto = models.ForeignKey(
        Documento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_sustituidos',
        verbose_name='Documento Sustituto'
    )

    # Confirmaciones de recepción
    confirmaciones_recepcion = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Confirmaciones de Recepción',
        help_text='Lista de usuarios que confirmaron recepción'
    )

    # Destrucción
    fecha_destruccion = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de Destrucción'
    )
    metodo_destruccion = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Método de Destrucción',
        help_text='Cómo se destruyó el documento físico/digital'
    )
    responsable_destruccion = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='destrucciones_documentos',
        verbose_name='Responsable de Destrucción'
    )
    acta_destruccion = models.FileField(
        upload_to='documentos/actas_destruccion/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Acta de Destrucción'
    )

    # Observaciones
    observaciones = models.TextField(
        blank=True,
        verbose_name='Observaciones'
    )

    # Multi-tenancy
    empresa_id = models.PositiveBigIntegerField(
        db_index=True,
        verbose_name='Empresa ID'
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='controles_documentales_created',
        verbose_name='Creado por'
    )

    class Meta:
        db_table = 'documental_control_documental'
        verbose_name = 'Control Documental'
        verbose_name_plural = 'Controles Documentales'
        ordering = ['-fecha_distribucion']
        indexes = [
            models.Index(fields=['empresa_id', 'documento']),
            models.Index(fields=['empresa_id', 'tipo_control']),
            models.Index(fields=['fecha_distribucion']),
            models.Index(fields=['fecha_retiro']),
        ]

    def __str__(self):
        return f"{self.get_tipo_control_display()} - {self.documento.codigo} - {self.fecha_distribucion}"
