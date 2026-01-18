"""
Serializers para Gestión Documental - Gestión Estratégica (N1)

Migrado desde: apps.hseq_management.sistema_documental
NOTA: FirmaDocumentoSerializer ha sido eliminado.
Las firmas digitales usan FirmaDigitalSerializer de workflow_engine.firma_digital
"""
from rest_framework import serializers
from .models import (
    TipoDocumento,
    PlantillaDocumento,
    Documento,
    VersionDocumento,
    CampoFormulario,
    ControlDocumental
)


# =============================================================================
# Tipo Documento Serializers
# =============================================================================
class TipoDocumentoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de tipos de documento"""
    nivel_display = serializers.CharField(source='get_nivel_documento_display', read_only=True)
    total_documentos = serializers.SerializerMethodField()

    class Meta:
        model = TipoDocumento
        fields = [
            'id', 'codigo', 'nombre', 'nivel_documento', 'nivel_display',
            'prefijo_codigo', 'requiere_aprobacion', 'requiere_firma',
            'color_identificacion', 'is_active', 'orden', 'total_documentos'
        ]

    def get_total_documentos(self, obj):
        return obj.documentos.filter(empresa_id=obj.empresa_id).count()


class TipoDocumentoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de tipos de documento"""
    nivel_display = serializers.CharField(source='get_nivel_documento_display', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_plantillas = serializers.SerializerMethodField()

    class Meta:
        model = TipoDocumento
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'nivel_documento', 'nivel_display',
            'prefijo_codigo', 'requiere_aprobacion', 'requiere_firma',
            'tiempo_retencion_años', 'plantilla_por_defecto', 'campos_obligatorios',
            'color_identificacion', 'is_active', 'orden', 'total_plantillas',
            'empresa_id', 'created_by', 'created_by_nombre', 'created_at', 'updated_at'
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']

    def get_total_plantillas(self, obj):
        return obj.plantillas.filter(empresa_id=obj.empresa_id).count()


# =============================================================================
# Plantilla Documento Serializers
# =============================================================================
class PlantillaDocumentoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de plantillas"""
    tipo_documento_nombre = serializers.CharField(source='tipo_documento.nombre', read_only=True)
    tipo_plantilla_display = serializers.CharField(source='get_tipo_plantilla_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    total_documentos = serializers.SerializerMethodField()

    class Meta:
        model = PlantillaDocumento
        fields = [
            'id', 'codigo', 'nombre', 'tipo_documento', 'tipo_documento_nombre',
            'tipo_plantilla', 'tipo_plantilla_display', 'version', 'estado', 'estado_display',
            'es_por_defecto', 'total_documentos'
        ]

    def get_total_documentos(self, obj):
        return obj.documentos_generados.filter(empresa_id=obj.empresa_id).count()


class PlantillaDocumentoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de plantillas"""
    tipo_documento_nombre = serializers.CharField(source='tipo_documento.nombre', read_only=True)
    tipo_plantilla_display = serializers.CharField(source='get_tipo_plantilla_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = PlantillaDocumento
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'tipo_documento', 'tipo_documento_nombre',
            'tipo_plantilla', 'tipo_plantilla_display', 'contenido_plantilla',
            'variables_disponibles', 'estilos_css', 'encabezado', 'pie_pagina',
            'version', 'estado', 'estado_display', 'es_por_defecto',
            'empresa_id', 'created_by', 'created_by_nombre', 'created_at', 'updated_at'
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']


# =============================================================================
# Campo Formulario Serializers
# =============================================================================
class CampoFormularioListSerializer(serializers.ModelSerializer):
    """Serializer para listado de campos de formulario"""
    tipo_campo_display = serializers.CharField(source='get_tipo_campo_display', read_only=True)
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True, allow_null=True)

    class Meta:
        model = CampoFormulario
        fields = [
            'id', 'nombre_campo', 'etiqueta', 'tipo_campo', 'tipo_campo_display',
            'es_obligatorio', 'orden', 'plantilla', 'plantilla_nombre', 'is_active'
        ]


class CampoFormularioDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de campos de formulario"""
    tipo_campo_display = serializers.CharField(source='get_tipo_campo_display', read_only=True)
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True, allow_null=True)
    tipo_documento_nombre = serializers.CharField(source='tipo_documento.nombre', read_only=True, allow_null=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = CampoFormulario
        fields = [
            'id', 'plantilla', 'plantilla_nombre', 'tipo_documento', 'tipo_documento_nombre',
            'nombre_campo', 'etiqueta', 'tipo_campo', 'tipo_campo_display',
            'descripcion', 'placeholder', 'valor_por_defecto', 'opciones',
            'es_obligatorio', 'validacion_regex', 'mensaje_validacion',
            'valor_minimo', 'valor_maximo', 'longitud_minima', 'longitud_maxima',
            'columnas_tabla', 'orden', 'ancho_columna', 'clase_css',
            'condicion_visible', 'is_active',
            'empresa_id', 'created_by', 'created_by_nombre', 'created_at', 'updated_at'
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']


# =============================================================================
# Documento Serializers
# =============================================================================
class DocumentoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de documentos"""
    tipo_documento_nombre = serializers.CharField(source='tipo_documento.nombre', read_only=True)
    tipo_documento_codigo = serializers.CharField(source='tipo_documento.codigo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    clasificacion_display = serializers.CharField(source='get_clasificacion_display', read_only=True)
    elaborado_por_nombre = serializers.CharField(source='elaborado_por.get_full_name', read_only=True)
    total_firmas = serializers.SerializerMethodField()
    firmas_pendientes = serializers.SerializerMethodField()

    class Meta:
        model = Documento
        fields = [
            'id', 'codigo', 'titulo', 'tipo_documento', 'tipo_documento_nombre',
            'tipo_documento_codigo', 'version_actual', 'estado', 'estado_display',
            'clasificacion', 'clasificacion_display', 'fecha_creacion', 'fecha_publicacion',
            'fecha_revision_programada', 'elaborado_por', 'elaborado_por_nombre',
            'total_firmas', 'firmas_pendientes'
        ]

    def get_total_firmas(self, obj):
        """Cuenta firmas usando FirmaDigital de workflow_engine"""
        return obj.get_firmas_digitales().count()

    def get_firmas_pendientes(self, obj):
        """Cuenta firmas pendientes usando FirmaDigital de workflow_engine"""
        return obj.get_firmas_digitales().filter(estado='PENDIENTE').count()


class DocumentoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de documentos"""
    tipo_documento_nombre = serializers.CharField(source='tipo_documento.nombre', read_only=True)
    plantilla_nombre = serializers.CharField(source='plantilla.nombre', read_only=True, allow_null=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    clasificacion_display = serializers.CharField(source='get_clasificacion_display', read_only=True)
    elaborado_por_nombre = serializers.CharField(source='elaborado_por.get_full_name', read_only=True)
    revisado_por_nombre = serializers.CharField(source='revisado_por.get_full_name', read_only=True, allow_null=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True, allow_null=True)
    documento_padre_codigo = serializers.CharField(source='documento_padre.codigo', read_only=True, allow_null=True)
    firmas_digitales = serializers.SerializerMethodField()

    class Meta:
        model = Documento
        fields = [
            'id', 'codigo', 'titulo', 'tipo_documento', 'tipo_documento_nombre',
            'plantilla', 'plantilla_nombre', 'resumen', 'contenido', 'datos_formulario',
            'palabras_clave', 'version_actual', 'numero_revision', 'estado', 'estado_display',
            'clasificacion', 'clasificacion_display',
            'fecha_creacion', 'fecha_aprobacion', 'fecha_publicacion', 'fecha_vigencia',
            'fecha_revision_programada', 'fecha_obsolescencia',
            'elaborado_por', 'elaborado_por_nombre',
            'revisado_por', 'revisado_por_nombre',
            'aprobado_por', 'aprobado_por_nombre',
            'areas_aplicacion', 'puestos_aplicacion',
            'archivo_pdf', 'archivos_anexos',
            'documento_padre', 'documento_padre_codigo',
            'numero_descargas', 'numero_impresiones',
            'observaciones', 'motivo_cambio_version',
            'empresa_id', 'created_at', 'updated_at',
            'firmas_digitales'
        ]
        read_only_fields = [
            'numero_descargas', 'numero_impresiones',
            'empresa_id', 'created_at', 'updated_at'
        ]

    def get_firmas_digitales(self, obj):
        """Obtiene firmas usando FirmaDigital de workflow_engine"""
        from apps.workflow_engine.firma_digital.serializers import FirmaDigitalListSerializer
        firmas = obj.get_firmas_digitales()
        return FirmaDigitalListSerializer(firmas, many=True).data


# =============================================================================
# Version Documento Serializers
# =============================================================================
class VersionDocumentoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de versiones de documentos"""
    documento_codigo = serializers.CharField(source='documento.codigo', read_only=True)
    documento_titulo = serializers.CharField(source='documento.titulo', read_only=True)
    tipo_cambio_display = serializers.CharField(source='get_tipo_cambio_display', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)

    class Meta:
        model = VersionDocumento
        fields = [
            'id', 'documento', 'documento_codigo', 'documento_titulo',
            'numero_version', 'tipo_cambio', 'tipo_cambio_display',
            'fecha_version', 'creado_por', 'creado_por_nombre',
            'is_version_actual'
        ]


class VersionDocumentoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de versiones de documentos"""
    documento_codigo = serializers.CharField(source='documento.codigo', read_only=True)
    documento_titulo = serializers.CharField(source='documento.titulo', read_only=True)
    tipo_cambio_display = serializers.CharField(source='get_tipo_cambio_display', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = VersionDocumento
        fields = [
            'id', 'documento', 'documento_codigo', 'documento_titulo',
            'numero_version', 'tipo_cambio', 'tipo_cambio_display',
            'contenido_snapshot', 'datos_formulario_snapshot',
            'descripcion_cambios', 'cambios_detectados',
            'fecha_version', 'creado_por', 'creado_por_nombre',
            'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'archivo_pdf_version', 'is_version_actual', 'checksum',
            'empresa_id'
        ]
        read_only_fields = ['empresa_id']


# =============================================================================
# Control Documental Serializers
# =============================================================================
class ControlDocumentalListSerializer(serializers.ModelSerializer):
    """Serializer para listado de controles documentales"""
    documento_codigo = serializers.CharField(source='documento.codigo', read_only=True)
    documento_titulo = serializers.CharField(source='documento.titulo', read_only=True)
    tipo_control_display = serializers.CharField(source='get_tipo_control_display', read_only=True)
    medio_display = serializers.CharField(source='get_medio_distribucion_display', read_only=True)
    total_usuarios = serializers.SerializerMethodField()

    class Meta:
        model = ControlDocumental
        fields = [
            'id', 'documento', 'documento_codigo', 'documento_titulo',
            'tipo_control', 'tipo_control_display', 'fecha_distribucion',
            'medio_distribucion', 'medio_display', 'total_usuarios',
            'numero_copias_impresas', 'numero_copias_controladas'
        ]

    def get_total_usuarios(self, obj):
        return obj.usuarios_distribucion.count()


class ControlDocumentalDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de controles documentales"""
    documento_codigo = serializers.CharField(source='documento.codigo', read_only=True)
    documento_titulo = serializers.CharField(source='documento.titulo', read_only=True)
    version_documento_numero = serializers.CharField(source='version_documento.numero_version', read_only=True, allow_null=True)
    tipo_control_display = serializers.CharField(source='get_tipo_control_display', read_only=True)
    medio_display = serializers.CharField(source='get_medio_distribucion_display', read_only=True)
    documento_sustituto_codigo = serializers.CharField(source='documento_sustituto.codigo', read_only=True, allow_null=True)
    responsable_destruccion_nombre = serializers.CharField(source='responsable_destruccion.get_full_name', read_only=True, allow_null=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ControlDocumental
        fields = [
            'id', 'documento', 'documento_codigo', 'documento_titulo',
            'version_documento', 'version_documento_numero',
            'tipo_control', 'tipo_control_display',
            'fecha_distribucion', 'medio_distribucion', 'medio_display',
            'areas_distribucion', 'numero_copias_impresas', 'numero_copias_controladas',
            'fecha_retiro', 'motivo_retiro', 'documento_sustituto', 'documento_sustituto_codigo',
            'confirmaciones_recepcion', 'fecha_destruccion', 'metodo_destruccion',
            'responsable_destruccion', 'responsable_destruccion_nombre', 'acta_destruccion',
            'observaciones',
            'empresa_id', 'created_by', 'created_by_nombre', 'created_at', 'updated_at'
        ]
        read_only_fields = ['empresa_id', 'created_by', 'created_at', 'updated_at']


# =============================================================================
# INTEGRACIÓN CON MÓDULO DE IDENTIDAD CORPORATIVA
# =============================================================================

class FirmaInfoSerializer(serializers.Serializer):
    """Serializer para información de firma recibida desde Identidad"""
    orden = serializers.IntegerField()
    rol = serializers.CharField()
    rol_display = serializers.CharField()
    cargo_id = serializers.IntegerField()
    cargo_nombre = serializers.CharField()
    usuario_id = serializers.IntegerField(allow_null=True)
    usuario_nombre = serializers.CharField(allow_null=True)
    fecha_firma = serializers.CharField(allow_null=True)
    firma_hash = serializers.CharField(allow_null=True)


class RecibirPoliticaSerializer(serializers.Serializer):
    """
    Serializer para recibir políticas desde el módulo de Identidad Corporativa.

    Este serializer procesa los datos enviados por el endpoint
    /identidad/politicas-especificas/{id}/enviar-a-documental/

    El Gestor Documental se encarga de:
    1. Crear/obtener TipoDocumento "POLITICA"
    2. Generar código único (POL-SST-001, etc.)
    3. Crear el Documento con estado APROBADO (ya viene firmado)
    4. Registrar las firmas usando FirmaDigital de workflow_engine
    5. Publicar el documento automáticamente
    """
    # Origen e identificación
    origen = serializers.CharField(
        help_text="Módulo de origen (ej: IDENTIDAD_CORPORATIVA)"
    )
    tipo_origen = serializers.CharField(
        help_text="Tipo de documento de origen (ej: POLITICA_ESPECIFICA)"
    )
    politica_id = serializers.IntegerField(
        help_text="ID de la política en el módulo de origen"
    )
    empresa_id = serializers.IntegerField(
        help_text="ID de la empresa (multi-tenant)"
    )

    # Contenido del documento
    titulo = serializers.CharField(
        max_length=255,
        help_text="Título de la política"
    )
    contenido = serializers.CharField(
        help_text="Contenido completo de la política en HTML"
    )
    version = serializers.CharField(
        max_length=20,
        default='1.0',
        help_text="Versión de la política"
    )

    # Clasificación y metadatos
    norma_iso_code = serializers.CharField(
        max_length=20,
        default='GEN',
        help_text="Código de la norma ISO aplicable (SST, CA, QMS, etc.)"
    )
    area_id = serializers.IntegerField(
        allow_null=True,
        required=False,
        help_text="ID del área responsable"
    )
    area_nombre = serializers.CharField(
        allow_null=True,
        required=False,
        help_text="Nombre del área responsable"
    )
    palabras_clave = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        help_text="Palabras clave para búsqueda"
    )
    clasificacion = serializers.ChoiceField(
        choices=[
            ('PUBLICO', 'Público'),
            ('INTERNO', 'Interno'),
            ('CONFIDENCIAL', 'Confidencial'),
            ('RESTRINGIDO', 'Restringido'),
        ],
        default='INTERNO',
        help_text="Clasificación de seguridad"
    )
    areas_aplicacion = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
        help_text="IDs de áreas donde aplica"
    )
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text="Observaciones adicionales"
    )

    # Información de firmas
    firmas = FirmaInfoSerializer(
        many=True,
        required=False,
        default=list,
        help_text="Lista de firmas completadas"
    )
    proceso_firma_id = serializers.IntegerField(
        allow_null=True,
        required=False,
        help_text="ID del proceso de firma en Identidad"
    )
    fecha_firma_completada = serializers.CharField(
        allow_null=True,
        required=False,
        help_text="Fecha de completado del proceso de firma"
    )

    # Usuario solicitante
    solicitado_por = serializers.IntegerField(
        help_text="ID del usuario que envía la política"
    )
    solicitado_por_nombre = serializers.CharField(
        help_text="Nombre del usuario que envía la política"
    )
    fecha_solicitud = serializers.CharField(
        help_text="Fecha/hora de la solicitud ISO 8601"
    )

    # Versionamiento - Para actualizaciones de políticas existentes
    es_actualizacion = serializers.BooleanField(
        required=False,
        default=False,
        help_text="True si es una nueva versión de una política existente"
    )
    documento_anterior_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="ID del documento anterior (si es actualización)"
    )
    codigo_existente = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Código existente del documento (si es actualización, se mantiene)"
    )
    version_anterior = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Versión anterior de la política"
    )
    motivo_cambio = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text="Motivo del cambio de versión"
    )
