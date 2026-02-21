"""
Serializers para Onboarding e Inducción - Talent Hub
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from .models import (
    ModuloInduccion,
    AsignacionPorCargo,
    ItemChecklist,
    ChecklistIngreso,
    EjecucionIntegral,
    EntregaEPP,
    EntregaActivo,
    FirmaDocumento,
)


# =============================================================================
# MÓDULO DE INDUCCIÓN
# =============================================================================

class ModuloInduccionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de módulos de inducción."""
    tipo_modulo_display = serializers.CharField(source='get_tipo_modulo_display', read_only=True)
    formato_display = serializers.CharField(source='get_formato_contenido_display', read_only=True)

    class Meta:
        model = ModuloInduccion
        fields = [
            'id', 'codigo', 'nombre', 'tipo_modulo', 'tipo_modulo_display',
            'formato_contenido', 'formato_display', 'duracion_minutos',
            'requiere_evaluacion', 'es_obligatorio', 'orden', 'is_active',
        ]


class ModuloInduccionDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de módulo de inducción."""
    tipo_modulo_display = serializers.CharField(source='get_tipo_modulo_display', read_only=True)
    formato_display = serializers.CharField(source='get_formato_contenido_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)

    class Meta:
        model = ModuloInduccion
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class ModuloInduccionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar módulos de inducción."""

    class Meta:
        model = ModuloInduccion
        fields = [
            'codigo', 'nombre', 'descripcion', 'tipo_modulo', 'formato_contenido',
            'duracion_minutos', 'requiere_evaluacion', 'nota_minima_aprobacion',
            'intentos_permitidos', 'contenido_url', 'archivo_contenido',
            'preguntas_evaluacion', 'fecha_vigencia_desde', 'fecha_vigencia_hasta',
            'orden', 'es_obligatorio', 'responsable',
        ]


# =============================================================================
# ASIGNACIÓN POR CARGO
# =============================================================================

class AsignacionPorCargoSerializer(serializers.ModelSerializer):
    """Serializer para asignaciones de módulos por cargo."""
    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True)
    modulo_nombre = serializers.CharField(source='modulo.nombre', read_only=True)

    class Meta:
        model = AsignacionPorCargo
        fields = [
            'id', 'cargo', 'cargo_nombre', 'modulo', 'modulo_nombre',
            'es_obligatorio', 'dias_para_completar', 'orden_ejecucion',
            'observaciones', 'is_active',
        ]
        read_only_fields = ['empresa', 'created_at', 'updated_at']


# =============================================================================
# CHECKLIST
# =============================================================================

class ItemChecklistSerializer(serializers.ModelSerializer):
    """Serializer para items de checklist."""
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = ItemChecklist
        fields = [
            'id', 'codigo', 'descripcion', 'categoria', 'categoria_display',
            'requiere_adjunto', 'requiere_fecha', 'orden', 'aplica_a_todos',
            'cargos_aplicables', 'is_active',
        ]
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class ChecklistIngresoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de checklist de ingreso."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_corto', read_only=True)
    item_descripcion = serializers.CharField(source='item.descripcion', read_only=True)
    item_categoria = serializers.CharField(source='item.get_categoria_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = ChecklistIngreso
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'item', 'item_descripcion',
            'item_categoria', 'estado', 'estado_display', 'fecha_cumplimiento',
        ]


class ChecklistIngresoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de checklist de ingreso."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    item_descripcion = serializers.CharField(source='item.descripcion', read_only=True)
    verificado_por_nombre = serializers.CharField(source='verificado_por.get_full_name', read_only=True)

    class Meta:
        model = ChecklistIngreso
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


# =============================================================================
# EJECUCIÓN INTEGRAL
# =============================================================================

class EjecucionIntegralListSerializer(serializers.ModelSerializer):
    """Serializer para listado de ejecuciones de inducción."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_corto', read_only=True)
    modulo_nombre = serializers.CharField(source='modulo.nombre', read_only=True)
    modulo_tipo = serializers.CharField(source='modulo.get_tipo_modulo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)
    aprobo = serializers.BooleanField(read_only=True)

    class Meta:
        model = EjecucionIntegral
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'modulo', 'modulo_nombre',
            'modulo_tipo', 'estado', 'estado_display', 'fecha_asignacion',
            'fecha_limite', 'progreso_porcentaje', 'nota_obtenida',
            'esta_vencido', 'aprobo',
        ]


class EjecucionIntegralDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de ejecución de inducción."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    modulo_info = ModuloInduccionListSerializer(source='modulo', read_only=True)
    facilitador_nombre = serializers.CharField(source='facilitador.get_full_name', read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)
    aprobo = serializers.BooleanField(read_only=True)

    class Meta:
        model = EjecucionIntegral
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at', 'fecha_asignacion']


class EjecucionIntegralCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear ejecución de inducción."""

    class Meta:
        model = EjecucionIntegral
        fields = ['colaborador', 'modulo', 'fecha_limite', 'facilitador', 'observaciones']


class EjecucionIntegralUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar progreso de ejecución."""

    class Meta:
        model = EjecucionIntegral
        fields = [
            'estado', 'fecha_inicio', 'fecha_finalizacion', 'progreso_porcentaje',
            'tiempo_dedicado_minutos', 'nota_obtenida', 'intentos_realizados',
            'respuestas_evaluacion', 'observaciones', 'retroalimentacion_colaborador',
        ]


# =============================================================================
# ENTREGA DE EPP
# =============================================================================

class EntregaEPPListSerializer(serializers.ModelSerializer):
    """Serializer para listado de entregas de EPP."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_corto', read_only=True)
    tipo_epp_display = serializers.CharField(source='get_tipo_epp_display', read_only=True)
    requiere_reposicion = serializers.BooleanField(read_only=True)

    class Meta:
        model = EntregaEPP
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'tipo_epp', 'tipo_epp_display',
            'descripcion', 'cantidad', 'fecha_entrega', 'fecha_vencimiento',
            'recibido_conforme', 'requiere_reposicion',
        ]


class EntregaEPPDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de entrega de EPP."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_epp_display = serializers.CharField(source='get_tipo_epp_display', read_only=True)
    entregado_por_nombre = serializers.CharField(source='entregado_por.get_full_name', read_only=True)
    requiere_reposicion = serializers.BooleanField(read_only=True)

    class Meta:
        model = EntregaEPP
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class EntregaEPPCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar entregas de EPP."""

    class Meta:
        model = EntregaEPP
        fields = [
            'colaborador', 'tipo_epp', 'descripcion', 'marca', 'referencia',
            'talla', 'cantidad', 'fecha_entrega', 'fecha_vencimiento',
            'entregado_por', 'recibido_conforme', 'observaciones', 'acta_entrega',
        ]


# =============================================================================
# ENTREGA DE ACTIVOS
# =============================================================================

class EntregaActivoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de entregas de activos."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_corto', read_only=True)
    tipo_activo_display = serializers.CharField(source='get_tipo_activo_display', read_only=True)
    esta_pendiente_devolucion = serializers.BooleanField(read_only=True)

    class Meta:
        model = EntregaActivo
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'tipo_activo', 'tipo_activo_display',
            'descripcion', 'codigo_activo', 'fecha_entrega', 'devuelto',
            'estado_entrega', 'esta_pendiente_devolucion',
        ]


class EntregaActivoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de entrega de activo."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_activo_display = serializers.CharField(source='get_tipo_activo_display', read_only=True)
    entregado_por_nombre = serializers.CharField(source='entregado_por.get_full_name', read_only=True)
    recibido_por_nombre = serializers.CharField(source='recibido_por.get_full_name', read_only=True)
    esta_pendiente_devolucion = serializers.BooleanField(read_only=True)

    class Meta:
        model = EntregaActivo
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class EntregaActivoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear entrega de activo."""

    class Meta:
        model = EntregaActivo
        fields = [
            'colaborador', 'tipo_activo', 'descripcion', 'codigo_activo', 'serial',
            'marca', 'modelo', 'valor_activo', 'fecha_entrega', 'estado_entrega',
            'entregado_por', 'recibido_conforme', 'observaciones', 'acta_entrega',
        ]


class EntregaActivoDevolucionSerializer(serializers.ModelSerializer):
    """Serializer para registrar devolución de activo."""

    class Meta:
        model = EntregaActivo
        fields = [
            'fecha_devolucion', 'estado_devolucion', 'recibido_por',
            'devuelto', 'observaciones', 'acta_devolucion',
        ]


# =============================================================================
# FIRMA DE DOCUMENTOS
# =============================================================================

class FirmaDocumentoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de firmas de documentos."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_corto', read_only=True)
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)

    class Meta:
        model = FirmaDocumento
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'tipo_documento',
            'tipo_documento_display', 'nombre_documento', 'fecha_firma',
            'firmado', 'metodo_firma',
        ]


class FirmaDocumentoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de firma de documento."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)
    testigo_nombre = serializers.CharField(source='testigo.get_full_name', read_only=True)

    class Meta:
        model = FirmaDocumento
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']


class FirmaDocumentoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar firmas de documentos."""

    class Meta:
        model = FirmaDocumento
        fields = [
            'colaborador', 'tipo_documento', 'nombre_documento', 'version',
            'documento', 'documento_firmado', 'fecha_firma', 'firmado',
            'metodo_firma', 'testigo', 'observaciones',
        ]


# =============================================================================
# ESTADÍSTICAS
# =============================================================================

class OnboardingEstadisticasSerializer(serializers.Serializer):
    """Serializer para estadísticas de onboarding."""
    total_modulos = serializers.IntegerField()
    modulos_activos = serializers.IntegerField()
    inducciones_pendientes = serializers.IntegerField()
    inducciones_en_progreso = serializers.IntegerField()
    inducciones_completadas_mes = serializers.IntegerField()
    tasa_cumplimiento = serializers.DecimalField(max_digits=5, decimal_places=2)
    epp_por_vencer = serializers.IntegerField()
    activos_pendientes_devolucion = serializers.IntegerField()
