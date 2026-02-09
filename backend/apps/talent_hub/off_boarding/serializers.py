"""
Serializers de Off-Boarding - Talent Hub

Serializers para la gestión completa del proceso de retiro de colaboradores
según legislación colombiana.
"""
from rest_framework import serializers
from decimal import Decimal
from datetime import timedelta

from .models import (
    TipoRetiro,
    ProcesoRetiro,
    ChecklistRetiro,
    PazSalvo,
    ExamenEgreso,
    EntrevistaRetiro,
    LiquidacionFinal,
    CertificadoTrabajo
)


# =============================================================================
# TIPO DE RETIRO
# =============================================================================

class TipoRetiroListSerializer(serializers.ModelSerializer):
    """Serializer para listado de tipos de retiro."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    es_voluntario = serializers.BooleanField(read_only=True)
    es_despido = serializers.BooleanField(read_only=True)

    class Meta:
        model = TipoRetiro
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'tipo_display',
            'requiere_indemnizacion', 'requiere_preaviso', 'dias_preaviso',
            'requiere_autorizacion', 'requiere_entrevista_salida',
            'es_voluntario', 'es_despido', 'orden'
        ]
        read_only_fields = ['id']


class TipoRetiroDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para tipo de retiro."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    es_voluntario = serializers.BooleanField(read_only=True)
    es_despido = serializers.BooleanField(read_only=True)

    class Meta:
        model = TipoRetiro
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class TipoRetiroCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de tipos de retiro."""

    class Meta:
        model = TipoRetiro
        fields = [
            'codigo', 'nombre', 'descripcion', 'tipo',
            'requiere_indemnizacion', 'formula_indemnizacion',
            'requiere_preaviso', 'dias_preaviso',
            'requiere_autorizacion', 'requiere_entrevista_salida', 'orden'
        ]

    def validate_codigo(self, value):
        """Validar que el código sea único por empresa."""
        empresa = self.context['request'].user.empresa
        if TipoRetiro.objects.filter(empresa=empresa, codigo=value, is_active=True).exists():
            raise serializers.ValidationError(
                f"Ya existe un tipo de retiro con el código '{value}'."
            )
        return value


# =============================================================================
# PROCESO DE RETIRO
# =============================================================================

class ProcesoRetiroListSerializer(serializers.ModelSerializer):
    """Serializer para listado de procesos de retiro."""

    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    colaborador_identificacion = serializers.CharField(source='colaborador.numero_identificacion', read_only=True)
    tipo_retiro_nombre = serializers.CharField(source='tipo_retiro.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    motivo_retiro_display = serializers.CharField(source='get_motivo_retiro_display', read_only=True)
    nombre_proceso = serializers.CharField(read_only=True)
    esta_completado = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProcesoRetiro
        fields = [
            'id', 'colaborador', 'colaborador_nombre', 'colaborador_identificacion',
            'tipo_retiro', 'tipo_retiro_nombre', 'nombre_proceso',
            'fecha_notificacion', 'fecha_ultimo_dia_trabajo', 'fecha_retiro_efectivo',
            'motivo_retiro', 'motivo_retiro_display', 'estado', 'estado_display',
            'progreso_porcentaje', 'esta_completado', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProcesoRetiroDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para proceso de retiro."""

    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_retiro_nombre = serializers.CharField(source='tipo_retiro.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    motivo_retiro_display = serializers.CharField(source='get_motivo_retiro_display', read_only=True)
    nombre_proceso = serializers.CharField(read_only=True)
    responsable_nombre = serializers.CharField(source='responsable_proceso.get_full_name', read_only=True)
    autorizado_por_nombre = serializers.CharField(source='autorizado_por.get_full_name', read_only=True)
    cerrado_por_nombre = serializers.CharField(source='cerrado_por.get_full_name', read_only=True)

    # Contadores de items completados
    items_checklist_total = serializers.SerializerMethodField()
    items_checklist_completados = serializers.SerializerMethodField()
    paz_salvos_total = serializers.SerializerMethodField()
    paz_salvos_aprobados = serializers.SerializerMethodField()

    class Meta:
        model = ProcesoRetiro
        fields = '__all__'
        read_only_fields = [
            'id', 'empresa', 'progreso_porcentaje',
            'checklist_completado', 'paz_salvo_completo',
            'examen_egreso_realizado', 'entrevista_realizada',
            'liquidacion_aprobada', 'autorizado_por', 'fecha_autorizacion',
            'cerrado_por', 'fecha_cierre',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]

    def get_items_checklist_total(self, obj):
        """Total de items en checklist."""
        return obj.items_checklist.filter(is_active=True).count()

    def get_items_checklist_completados(self, obj):
        """Items completados en checklist."""
        return obj.items_checklist.filter(is_active=True, estado='completado').count()

    def get_paz_salvos_total(self, obj):
        """Total de paz y salvos."""
        return obj.paz_salvos.filter(is_active=True).count()

    def get_paz_salvos_aprobados(self, obj):
        """Paz y salvos aprobados."""
        return obj.paz_salvos.filter(is_active=True, estado='aprobado').count()


class ProcesoRetiroCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de procesos de retiro."""

    class Meta:
        model = ProcesoRetiro
        fields = [
            'colaborador', 'tipo_retiro', 'fecha_notificacion',
            'fecha_ultimo_dia_trabajo', 'motivo_retiro', 'motivo_detallado',
            'justa_causa_detalle', 'responsable_proceso', 'observaciones'
        ]

    def validate(self, data):
        """Validar que no exista proceso activo para el mismo colaborador."""
        empresa = self.context['request'].user.empresa
        colaborador = data.get('colaborador')

        # Verificar que no haya proceso activo
        if ProcesoRetiro.objects.filter(
            empresa=empresa,
            colaborador=colaborador,
            estado__in=['iniciado', 'checklist_pendiente', 'paz_salvo_pendiente',
                       'examen_pendiente', 'entrevista_pendiente', 'liquidacion_pendiente'],
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                "El colaborador ya tiene un proceso de retiro activo."
            )

        # Validar fechas
        if data['fecha_ultimo_dia_trabajo'] < data['fecha_notificacion']:
            raise serializers.ValidationError({
                'fecha_ultimo_dia_trabajo': 'El último día de trabajo no puede ser anterior a la fecha de notificación.'
            })

        return data


# =============================================================================
# CHECKLIST DE RETIRO
# =============================================================================

class ChecklistRetiroListSerializer(serializers.ModelSerializer):
    """Serializer para listado de checklist de retiro."""

    tipo_item_display = serializers.CharField(source='get_tipo_item_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_area_display = serializers.CharField(source='get_responsable_area_display', read_only=True)
    validado_por_nombre = serializers.CharField(source='validado_por.get_full_name', read_only=True)
    esta_completado = serializers.BooleanField(read_only=True)

    class Meta:
        model = ChecklistRetiro
        fields = [
            'id', 'proceso_retiro', 'tipo_item', 'tipo_item_display',
            'descripcion', 'estado', 'estado_display',
            'responsable_area', 'responsable_area_display',
            'validado_por', 'validado_por_nombre', 'fecha_validacion',
            'esta_completado', 'orden'
        ]
        read_only_fields = ['id']


class ChecklistRetiroDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para checklist de retiro."""

    tipo_item_display = serializers.CharField(source='get_tipo_item_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_area_display = serializers.CharField(source='get_responsable_area_display', read_only=True)
    validado_por_nombre = serializers.CharField(source='validado_por.get_full_name', read_only=True)

    class Meta:
        model = ChecklistRetiro
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'validado_por', 'fecha_validacion',
                           'created_at', 'updated_at', 'created_by', 'updated_by']


class ChecklistRetiroCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de checklist de retiro."""

    class Meta:
        model = ChecklistRetiro
        fields = [
            'proceso_retiro', 'tipo_item', 'descripcion', 'detalles',
            'responsable_area', 'evidencia', 'observaciones', 'orden'
        ]


# =============================================================================
# PAZ Y SALVO
# =============================================================================

class PazSalvoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de paz y salvos."""

    area_display = serializers.CharField(source='get_area_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)
    esta_aprobado = serializers.BooleanField(read_only=True)
    esta_rechazado = serializers.BooleanField(read_only=True)

    class Meta:
        model = PazSalvo
        fields = [
            'id', 'proceso_retiro', 'area', 'area_display', 'descripcion_area',
            'estado', 'estado_display', 'responsable', 'responsable_nombre',
            'aprobado_por', 'aprobado_por_nombre', 'fecha_aprobacion',
            'esta_aprobado', 'esta_rechazado', 'pendientes'
        ]
        read_only_fields = ['id']


class PazSalvoDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para paz y salvo."""

    area_display = serializers.CharField(source='get_area_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)

    class Meta:
        model = PazSalvo
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'aprobado_por', 'fecha_aprobacion',
                           'created_at', 'updated_at', 'created_by', 'updated_by']


class PazSalvoCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de paz y salvos."""

    class Meta:
        model = PazSalvo
        fields = [
            'proceso_retiro', 'area', 'descripcion_area', 'responsable',
            'pendientes', 'observaciones'
        ]

    def validate(self, data):
        """Validar que no exista paz y salvo duplicado para el área."""
        proceso = data.get('proceso_retiro')
        area = data.get('area')

        if PazSalvo.objects.filter(
            proceso_retiro=proceso,
            area=area,
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                f"Ya existe un paz y salvo para el área {area}."
            )

        return data


# =============================================================================
# EXAMEN DE EGRESO
# =============================================================================

class ExamenEgresoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de exámenes de egreso."""

    colaborador_nombre = serializers.CharField(
        source='proceso_retiro.colaborador.get_nombre_completo',
        read_only=True
    )
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)
    es_apto = serializers.BooleanField(read_only=True)
    tiene_enfermedad_laboral = serializers.BooleanField(read_only=True)

    class Meta:
        model = ExamenEgreso
        fields = [
            'id', 'proceso_retiro', 'colaborador_nombre', 'fecha_examen',
            'entidad_prestadora', 'medico_evaluador', 'resultado', 'resultado_display',
            'es_apto', 'enfermedad_laboral_identificada', 'tiene_enfermedad_laboral',
            'requiere_seguimiento'
        ]
        read_only_fields = ['id']


class ExamenEgresoDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para examen de egreso."""

    colaborador_nombre = serializers.CharField(
        source='proceso_retiro.colaborador.get_nombre_completo',
        read_only=True
    )
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)
    es_apto = serializers.BooleanField(read_only=True)
    tiene_enfermedad_laboral = serializers.BooleanField(read_only=True)

    class Meta:
        model = ExamenEgreso
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class ExamenEgresoCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de exámenes de egreso."""

    class Meta:
        model = ExamenEgreso
        fields = [
            'proceso_retiro', 'fecha_examen', 'entidad_prestadora',
            'medico_evaluador', 'licencia_medico', 'resultado', 'concepto_medico',
            'hallazgos_clinicos', 'diagnostico_egreso', 'comparacion_examen_ingreso',
            'enfermedad_laboral_identificada', 'enfermedad_laboral_detalle',
            'recomendaciones', 'requiere_seguimiento', 'certificado_medico',
            'examenes_adjuntos', 'observaciones'
        ]

    def validate_proceso_retiro(self, value):
        """Validar que no exista examen duplicado."""
        if ExamenEgreso.objects.filter(proceso_retiro=value, is_active=True).exists():
            raise serializers.ValidationError(
                "Ya existe un examen de egreso para este proceso de retiro."
            )
        return value


# =============================================================================
# ENTREVISTA DE RETIRO
# =============================================================================

class EntrevistaRetiroListSerializer(serializers.ModelSerializer):
    """Serializer para listado de entrevistas de retiro."""

    colaborador_nombre = serializers.CharField(
        source='proceso_retiro.colaborador.get_nombre_completo',
        read_only=True
    )
    entrevistador_nombre = serializers.CharField(source='entrevistador.get_full_name', read_only=True)
    motivo_principal_display = serializers.CharField(source='get_motivo_principal_retiro_display', read_only=True)
    modalidad_display = serializers.CharField(source='get_modalidad_display', read_only=True)
    promedio_evaluacion = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    evaluacion_positiva = serializers.BooleanField(read_only=True)

    class Meta:
        model = EntrevistaRetiro
        fields = [
            'id', 'proceso_retiro', 'colaborador_nombre', 'fecha_entrevista',
            'entrevistador', 'entrevistador_nombre', 'modalidad', 'modalidad_display',
            'satisfaccion_general', 'promedio_evaluacion', 'evaluacion_positiva',
            'motivo_principal_retiro', 'motivo_principal_display',
            'volveria_trabajar', 'recomendaria_empresa'
        ]
        read_only_fields = ['id']


class EntrevistaRetiroDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para entrevista de retiro."""

    colaborador_nombre = serializers.CharField(
        source='proceso_retiro.colaborador.get_nombre_completo',
        read_only=True
    )
    entrevistador_nombre = serializers.CharField(source='entrevistador.get_full_name', read_only=True)
    motivo_principal_display = serializers.CharField(source='get_motivo_principal_retiro_display', read_only=True)
    modalidad_display = serializers.CharField(source='get_modalidad_display', read_only=True)
    promedio_evaluacion = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    evaluacion_positiva = serializers.BooleanField(read_only=True)

    class Meta:
        model = EntrevistaRetiro
        fields = '__all__'
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at', 'created_by', 'updated_by']


class EntrevistaRetiroCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de entrevistas de retiro."""

    class Meta:
        model = EntrevistaRetiro
        fields = [
            'proceso_retiro', 'fecha_entrevista', 'entrevistador', 'modalidad',
            'satisfaccion_general', 'evaluacion_liderazgo', 'evaluacion_clima_laboral',
            'evaluacion_remuneracion', 'evaluacion_desarrollo', 'evaluacion_equilibrio_vida',
            'motivo_principal_retiro', 'motivo_detallado', 'aspectos_positivos',
            'aspectos_mejorar', 'sugerencias', 'volveria_trabajar',
            'justificacion_recontratacion', 'recomendaria_empresa',
            'analisis_entrevistador', 'recomendaciones_organizacion',
            'acta_entrevista', 'observaciones'
        ]

    def validate_proceso_retiro(self, value):
        """Validar que no exista entrevista duplicada."""
        if EntrevistaRetiro.objects.filter(proceso_retiro=value, is_active=True).exists():
            raise serializers.ValidationError(
                "Ya existe una entrevista de retiro para este proceso."
            )
        return value


# =============================================================================
# LIQUIDACIÓN FINAL
# =============================================================================

class LiquidacionFinalListSerializer(serializers.ModelSerializer):
    """Serializer para listado de liquidaciones finales."""

    colaborador_nombre = serializers.CharField(
        source='proceso_retiro.colaborador.get_nombre_completo',
        read_only=True
    )
    esta_aprobada = serializers.BooleanField(read_only=True)
    esta_pagada = serializers.BooleanField(read_only=True)
    tiempo_servicio_anios = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = LiquidacionFinal
        fields = [
            'id', 'proceso_retiro', 'colaborador_nombre', 'fecha_liquidacion',
            'salario_base', 'tiempo_servicio_anios', 'total_devengados',
            'total_deducciones', 'neto_pagar', 'aplica_indemnizacion',
            'valor_indemnizacion', 'esta_aprobada', 'esta_pagada',
            'fecha_pago', 'metodo_pago'
        ]
        read_only_fields = ['id']


class LiquidacionFinalDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para liquidación final."""

    colaborador_nombre = serializers.CharField(
        source='proceso_retiro.colaborador.get_nombre_completo',
        read_only=True
    )
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    esta_aprobada = serializers.BooleanField(read_only=True)
    esta_pagada = serializers.BooleanField(read_only=True)
    tiempo_servicio_anios = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = LiquidacionFinal
        fields = '__all__'
        read_only_fields = [
            'id', 'empresa', 'cesantias_causadas', 'cesantias_pendientes',
            'intereses_cesantias', 'prima_causada', 'prima_pendiente',
            'dias_vacaciones_causados', 'dias_vacaciones_pendientes',
            'valor_vacaciones', 'total_devengados', 'total_deducciones',
            'neto_pagar', 'aprobado_por', 'fecha_aprobacion',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]


class LiquidacionFinalCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de liquidaciones finales."""

    class Meta:
        model = LiquidacionFinal
        fields = [
            'proceso_retiro', 'fecha_liquidacion', 'fecha_ingreso', 'fecha_retiro',
            'salario_base', 'salario_promedio', 'dias_trabajados_total',
            'cesantias_pagadas', 'prima_pagada', 'dias_vacaciones_disfrutados',
            'aplica_indemnizacion', 'bonificaciones', 'otros_devengados',
            'detalle_otros_devengados', 'prestamos_pendientes',
            'libranzas_pendientes', 'otras_deducciones',
            'detalle_otras_deducciones', 'observaciones'
        ]

    def validate_proceso_retiro(self, value):
        """Validar que no exista liquidación duplicada."""
        if LiquidacionFinal.objects.filter(proceso_retiro=value, is_active=True).exists():
            raise serializers.ValidationError(
                "Ya existe una liquidación final para este proceso de retiro."
            )
        return value

    def validate(self, data):
        """Validar fechas."""
        if data['fecha_retiro'] < data['fecha_ingreso']:
            raise serializers.ValidationError({
                'fecha_retiro': 'La fecha de retiro no puede ser anterior a la fecha de ingreso.'
            })
        return data


# =============================================================================
# CERTIFICADO DE TRABAJO - Art. 57 y 62 CST
# =============================================================================

class CertificadoTrabajoListSerializer(serializers.ModelSerializer):
    """Serializer de lista para certificados de trabajo."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_certificado_display = serializers.CharField(source='get_tipo_certificado_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    generado_por_nombre = serializers.CharField(source='generado_por.get_full_name', read_only=True)

    class Meta:
        model = CertificadoTrabajo
        fields = [
            'id', 'colaborador', 'colaborador_nombre',
            'tipo_certificado', 'tipo_certificado_display',
            'fecha_solicitud', 'fecha_expedicion',
            'estado', 'estado_display',
            'generado_por_nombre', 'created_at'
        ]
        read_only_fields = ['id', 'fecha_solicitud', 'created_at']


class CertificadoTrabajoDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para certificados de trabajo."""
    colaborador_nombre = serializers.CharField(source='colaborador.get_nombre_completo', read_only=True)
    tipo_certificado_display = serializers.CharField(source='get_tipo_certificado_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    generado_por_nombre = serializers.CharField(source='generado_por.get_full_name', read_only=True)

    class Meta:
        model = CertificadoTrabajo
        fields = '__all__'
        read_only_fields = [
            'id', 'empresa', 'fecha_solicitud',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]


class CertificadoTrabajoCreateSerializer(serializers.ModelSerializer):
    """Serializer de creacion para certificados de trabajo."""

    class Meta:
        model = CertificadoTrabajo
        fields = [
            'colaborador', 'tipo_certificado', 'dirigido_a',
            'incluir_cargo', 'incluir_salario', 'incluir_funciones',
            'informacion_adicional'
        ]
