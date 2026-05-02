"""
Serializers para Gestión Documental - Gestión Estratégica (N1)

Migrado desde: apps.hseq_management.sistema_documental
NOTA: FirmaDocumentoSerializer ha sido eliminado.
Las firmas digitales usan FirmaDigitalSerializer de workflow_engine.firma_digital
"""
from django.apps import apps
from django.urls import reverse
from rest_framework import serializers
from .mixins import check_acceso_documento
from .models import (
    TipoDocumento,
    PlantillaDocumento,
    Documento,
    VersionDocumento,
    CampoFormulario,
    ControlDocumental,
    AceptacionDocumental,
    TablaRetencionDocumental,
)


# =============================================================================
# Helpers Aceptacion Documental
# =============================================================================
def _resolve_documento_archivo_original_url(obj, request):
    """
    Construye URL absoluta al archivo original del documento (PDF externo)
    usando el endpoint de export — JWT-aware y con verificacion de acceso.

    Devuelve None si:
      - el documento no tiene archivo_original
      - el usuario no tiene acceso por clasificacion (Confidencial/Restringido)
      - no hay request en context (caso de serializacion fuera de DRF)
    """
    documento = getattr(obj, 'documento', None)
    if documento is None:
        return None

    archivo = getattr(documento, 'archivo_original', None)
    if not archivo or not getattr(archivo, 'name', ''):
        return None

    if request is None:
        return None

    user = getattr(request, 'user', None)
    if user is None or not user.is_authenticated:
        return None

    if not check_acceso_documento(user, documento):
        return None

    relative = reverse(
        'gestion_documental:export-documento-pdf', kwargs={'pk': documento.pk}
    )
    return request.build_absolute_uri(relative)


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
            'categoria',
            'prefijo_codigo', 'requiere_aprobacion', 'requiere_firma',
            'nivel_seguridad_firma',
            'color_identificacion', 'orden', 'total_documentos'
        ]
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
        }

    def get_total_documentos(self, obj):
        return obj.documentos.count()


class TipoDocumentoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de tipos de documento"""
    nivel_display = serializers.CharField(source='get_nivel_documento_display', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_plantillas = serializers.SerializerMethodField()

    class Meta:
        model = TipoDocumento
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'nivel_documento', 'nivel_display',
            'categoria',
            'prefijo_codigo', 'requiere_aprobacion', 'requiere_firma',
            'nivel_seguridad_firma',
            'tiempo_retencion_años', 'plantilla_por_defecto', 'campos_obligatorios',
            'color_identificacion', 'orden', 'total_plantillas',
            'created_by', 'created_by_nombre', 'updated_by',
            'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at']
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
        }

    def get_total_plantillas(self, obj):
        return obj.plantillas.count()


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
            'es_por_defecto', 'firmantes_por_defecto',
            'plantilla_maestra_codigo', 'es_personalizada',
            'total_documentos'
        ]
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
        }

    def get_total_documentos(self, obj):
        return obj.documentos_generados.count()


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
            'firmantes_por_defecto',
            'plantilla_maestra_codigo', 'es_personalizada',
            'created_by', 'created_by_nombre', 'updated_by',
            'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at']
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
        }

    def validate_firmantes_por_defecto(self, value):
        """Validar que cada firmante tenga cargo_code válido y existente."""
        if not value:
            return value

        Cargo = apps.get_model('core', 'Cargo')
        roles_validos = {'ELABORO', 'REVISO', 'APROBO'}

        for config in value:
            rol = config.get('rol_firma', '')
            if rol not in roles_validos:
                raise serializers.ValidationError(
                    f'Rol de firma "{rol}" no es válido. Opciones: {", ".join(sorted(roles_validos))}'
                )

            cargo_code = config.get('cargo_code', '')
            if not cargo_code:
                raise serializers.ValidationError(
                    'Cada firmante debe tener un cargo asignado (cargo_code)'
                )

            if not Cargo.objects.filter(code=cargo_code, is_active=True).exists():
                raise serializers.ValidationError(
                    f'Cargo "{cargo_code}" no existe o está inactivo'
                )

        return value


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
            'es_obligatorio', 'orden', 'plantilla', 'plantilla_nombre'
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
            'condicion_visible', 'formula_calculo',
            'config_firmantes', 'modo_firma', 'nivel_seguridad_firma',
            'created_by', 'created_by_nombre', 'updated_by',
            'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at']


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
    norma_iso_nombre = serializers.CharField(source='norma_iso.nombre', read_only=True, allow_null=True)
    norma_iso_codigo = serializers.CharField(source='norma_iso.codigo', read_only=True, allow_null=True)
    responsable_cargo_nombre = serializers.CharField(source='responsable_cargo.name', read_only=True, allow_null=True)
    proceso_code = serializers.CharField(source='proceso.code', read_only=True, allow_null=True)
    proceso_nombre = serializers.CharField(source='proceso.name', read_only=True, allow_null=True)
    total_firmas = serializers.SerializerMethodField()
    firmas_pendientes = serializers.SerializerMethodField()

    class Meta:
        model = Documento
        fields = [
            'id', 'codigo', 'titulo', 'tipo_documento', 'tipo_documento_nombre',
            'tipo_documento_codigo', 'version_actual', 'estado', 'estado_display',
            'clasificacion', 'clasificacion_display', 'fecha_creacion', 'fecha_publicacion',
            'fecha_revision_programada', 'elaborado_por', 'elaborado_por_nombre',
            'norma_iso', 'norma_iso_nombre', 'norma_iso_codigo',
            'responsable_cargo', 'responsable_cargo_nombre',
            'proceso', 'proceso_code', 'proceso_nombre',
            'modulo_origen',
            'es_politica_integral', 'lectura_obligatoria',
            'ocr_estado', 'ocr_metadatos', 'es_externo',
            'archivo_original', 'archivo_pdf', 'codigo_legacy',
            'score_cumplimiento',
            'drive_file_id',
            'sellado_estado', 'fecha_sellado',
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
    norma_iso_nombre = serializers.CharField(source='norma_iso.nombre', read_only=True, allow_null=True)
    norma_iso_codigo = serializers.CharField(source='norma_iso.codigo', read_only=True, allow_null=True)
    responsable_cargo_nombre = serializers.CharField(source='responsable_cargo.name', read_only=True, allow_null=True)
    proceso_code = serializers.CharField(source='proceso.code', read_only=True, allow_null=True)
    proceso_nombre = serializers.CharField(source='proceso.name', read_only=True, allow_null=True)
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
            'proceso', 'proceso_code', 'proceso_nombre',
            'areas_aplicacion', 'puestos_aplicacion',
            'archivo_pdf', 'archivos_anexos',
            'documento_padre', 'documento_padre_codigo',
            'numero_descargas', 'numero_impresiones',
            'observaciones', 'motivo_cambio_version',
            'norma_iso', 'norma_iso_nombre', 'norma_iso_codigo',
            'responsable_cargo', 'responsable_cargo_nombre',
            'fecha_expiracion', 'motivo_cambio', 'es_politica_integral', 'lectura_obligatoria',
            'texto_extraido', 'ocr_estado', 'ocr_metadatos',
            'es_externo', 'archivo_original', 'codigo_legacy',
            'trd_aplicada', 'fecha_fin_gestion', 'fecha_fin_central',
            'disposicion_asignada',
            'score_cumplimiento', 'score_detalle', 'score_actualizado_at',
            'drive_file_id', 'drive_exportado_at',
            'pdf_sellado', 'hash_pdf_sellado', 'fecha_sellado',
            'sellado_estado', 'sellado_metadatos',
            'created_by', 'updated_by',
            'created_at', 'updated_at', 'deleted_at',
            'firmas_digitales'
        ]
        read_only_fields = [
            'codigo', 'numero_descargas', 'numero_impresiones',
            'texto_extraido', 'ocr_estado', 'ocr_metadatos',
            'score_cumplimiento', 'score_detalle', 'score_actualizado_at',
            'drive_file_id', 'drive_exportado_at',
            'pdf_sellado', 'hash_pdf_sellado', 'fecha_sellado',
            'sellado_estado', 'sellado_metadatos',
            'created_by', 'updated_by',
            'created_at', 'updated_at', 'deleted_at'
        ]
        extra_kwargs = {
            'contenido': {'required': False, 'allow_blank': True},
        }

    def get_firmas_digitales(self, obj):
        """Obtiene firmas usando FirmaDigital de workflow_engine"""
        from apps.infraestructura.workflow_engine.firma_digital.serializers import FirmaDigitalSerializer
        firmas = obj.get_firmas_digitales()
        return FirmaDigitalSerializer(firmas, many=True).data


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
            'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'deleted_at']


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
            'created_by', 'created_by_nombre', 'updated_by',
            'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at']


# =============================================================================
# Aceptación Documental Serializers (Mejora 3 — Lectura Verificada)
# =============================================================================
class AceptacionDocumentalListSerializer(serializers.ModelSerializer):
    """Serializer para listado de aceptaciones documentales"""
    documento_codigo = serializers.CharField(source='documento.codigo', read_only=True)
    documento_titulo = serializers.CharField(source='documento.titulo', read_only=True)
    documento_contenido = serializers.CharField(source='documento.contenido', read_only=True)
    documento_archivo_original_url = serializers.SerializerMethodField()
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    asignado_por_nombre = serializers.CharField(
        source='asignado_por.get_full_name', read_only=True, allow_null=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    dias_restantes = serializers.SerializerMethodField()

    class Meta:
        model = AceptacionDocumental
        fields = [
            'id', 'documento', 'documento_codigo', 'documento_titulo',
            'documento_contenido', 'documento_archivo_original_url',
            'version_documento', 'usuario', 'usuario_nombre',
            'asignado_por', 'asignado_por_nombre',
            'estado', 'estado_display',
            'fecha_asignacion', 'fecha_limite', 'dias_restantes',
            'porcentaje_lectura', 'tiempo_lectura_seg',
            'fecha_inicio_lectura', 'fecha_aceptacion',
        ]

    def get_dias_restantes(self, obj):
        if not obj.fecha_limite:
            return None
        from django.utils import timezone
        delta = obj.fecha_limite - timezone.now().date()
        return delta.days

    def get_documento_archivo_original_url(self, obj):
        return _resolve_documento_archivo_original_url(
            obj, self.context.get('request')
        )


class AceptacionDocumentalDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de aceptación documental"""
    documento_codigo = serializers.CharField(source='documento.codigo', read_only=True)
    documento_titulo = serializers.CharField(source='documento.titulo', read_only=True)
    documento_contenido = serializers.CharField(source='documento.contenido', read_only=True)
    documento_archivo_original_url = serializers.SerializerMethodField()
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    asignado_por_nombre = serializers.CharField(
        source='asignado_por.get_full_name', read_only=True, allow_null=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = AceptacionDocumental
        fields = [
            'id', 'documento', 'documento_codigo', 'documento_titulo',
            'documento_contenido', 'documento_archivo_original_url',
            'version_documento', 'usuario', 'usuario_nombre',
            'control_documental', 'asignado_por', 'asignado_por_nombre',
            'estado', 'estado_display',
            'fecha_asignacion', 'fecha_limite',
            'fecha_inicio_lectura', 'fecha_aceptacion', 'fecha_rechazo',
            'porcentaje_lectura', 'tiempo_lectura_seg', 'scroll_data',
            'texto_aceptacion', 'motivo_rechazo',
            'ip_address', 'user_agent',
            'created_by', 'updated_by',
            'created_at', 'updated_at', 'deleted_at',
        ]
        read_only_fields = [
            'created_by', 'updated_by',
            'created_at', 'updated_at', 'deleted_at',
            'fecha_asignacion', 'fecha_aceptacion', 'fecha_rechazo',
            'ip_address', 'user_agent',
        ]

    def get_documento_archivo_original_url(self, obj):
        return _resolve_documento_archivo_original_url(
            obj, self.context.get('request')
        )


class AsignarLecturaSerializer(serializers.Serializer):
    """
    Serializer para asignar lectura verificada con soporte RBAC.

    Modos de selección (se pueden combinar):
      - usuario_ids:   IDs individuales (legado + casos especiales)
      - cargo_ids:     IDs de cargos → se resuelven todos los usuarios con ese cargo
      - aplica_a_todos: True → todos los usuarios activos del tenant

    Al menos uno de los tres modos debe estar activo.
    """
    documento_id = serializers.IntegerField()
    usuario_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
    )
    cargo_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
    )
    aplica_a_todos = serializers.BooleanField(required=False, default=False)
    fecha_limite = serializers.DateField(required=False, allow_null=True)

    def validate(self, data):
        if (
            not data.get('usuario_ids')
            and not data.get('cargo_ids')
            and not data.get('aplica_a_todos')
        ):
            raise serializers.ValidationError(
                'Debe especificar al menos un modo: usuario_ids, cargo_ids '
                'o aplica_a_todos=true.'
            )
        return data


# =============================================================================
# Tabla de Retención Documental (TRD) — Sprint 2
# =============================================================================
class TablaRetencionDocumentalSerializer(serializers.ModelSerializer):
    """Serializer para TRD con nombres legibles de tipo y proceso."""
    tipo_documento_codigo = serializers.CharField(source='tipo_documento.codigo', read_only=True)
    tipo_documento_nombre = serializers.CharField(source='tipo_documento.nombre', read_only=True)
    proceso_code = serializers.CharField(source='proceso.code', read_only=True)
    proceso_nombre = serializers.CharField(source='proceso.name', read_only=True)
    disposicion_display = serializers.CharField(source='get_disposicion_final_display', read_only=True)
    tiempo_total = serializers.IntegerField(source='tiempo_total_anos', read_only=True)

    class Meta:
        model = TablaRetencionDocumental
        fields = [
            'id', 'tipo_documento', 'tipo_documento_codigo', 'tipo_documento_nombre',
            'proceso', 'proceso_code', 'proceso_nombre',
            'serie_documental', 'tiempo_gestion_anos', 'tiempo_central_anos',
            'tiempo_total',
            'disposicion_final', 'disposicion_display',
            'soporte_legal', 'requiere_acta_destruccion',
            'created_by', 'updated_by',
            'created_at', 'updated_at', 'deleted_at',
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at']

    # Mínimos legales colombianos (RN-TRD-010)
    MINIMOS_LEGALES = {
        # (tipo_codigo, proceso_code o None) → {'minimo': años, 'norma': str}
        ('RG', 'SST'): {'minimo': 20, 'norma': 'Dto 1072/2015 Art 2.2.4.6.12'},
        ('AC', 'SST'): {'minimo': 10, 'norma': 'Dto 1072/2015 Art 2.2.4.6.21'},
        ('POL', None): {'minimo': 10, 'norma': 'ISO 9001/14001/45001 Cl 7.5'},
        ('MA', None):  {'minimo': 10, 'norma': 'ISO 9001/14001/45001 Cl 7.5'},
        ('RE', None):  {'minimo': 10, 'norma': 'ISO 9001/14001/45001 Cl 7.5'},
        ('PR', None):  {'minimo': 7, 'norma': 'ISO 9001 Cl 7.5'},
        ('PL', 'SST'): {'minimo': 7, 'norma': 'Dto 1072/2015 Art 2.2.4.6.25'},
        ('PG', None):  {'minimo': 5, 'norma': 'ISO 9001 Cl 7.5'},
        ('FT', None):  {'minimo': 4, 'norma': 'Práctica archivística estándar'},
    }

    def validate(self, attrs):
        tipo_doc = attrs.get('tipo_documento') or (self.instance.tipo_documento if self.instance else None)
        proceso = attrs.get('proceso') or (self.instance.proceso if self.instance else None)
        tiempo_gestion = attrs.get('tiempo_gestion_anos', getattr(self.instance, 'tiempo_gestion_anos', 0) if self.instance else 0)
        tiempo_central = attrs.get('tiempo_central_anos', getattr(self.instance, 'tiempo_central_anos', 0) if self.instance else 0)
        tiempo_total = (tiempo_gestion or 0) + (tiempo_central or 0)

        if tipo_doc:
            tipo_code = tipo_doc.codigo
            proceso_code = proceso.code if proceso else None

            # Buscar mínimo exacto (tipo+proceso) → genérico (tipo+None)
            minimo_info = self.MINIMOS_LEGALES.get((tipo_code, proceso_code))
            if not minimo_info:
                minimo_info = self.MINIMOS_LEGALES.get((tipo_code, None))

            if minimo_info and tiempo_total < minimo_info['minimo']:
                raise serializers.ValidationError(
                    f"El tiempo total de retención ({tiempo_total} años) es inferior "
                    f"al mínimo legal ({minimo_info['minimo']} años) según "
                    f"{minimo_info['norma']}."
                )

        return attrs
