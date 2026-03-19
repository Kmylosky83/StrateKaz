"""
Serializers para Selección y Contratación - Talent Hub
Sistema de Gestión StrateKaz

100% DINÁMICO: Serializers para API REST del proceso de selección,
candidatos, entrevistas, pruebas y afiliaciones.
"""
from django.db import models
from rest_framework import serializers
from .models import (
    TipoContrato,
    TipoEntidad,
    EntidadSeguridadSocial,
    TipoPrueba,
    VacanteActiva,
    Candidato,
    Entrevista,
    Prueba,
    AfiliacionSS,
    PlantillaPruebaDinamica,
    AsignacionPruebaDinamica,
    EntrevistaAsincronica,
)


# =============================================================================
# CATÁLOGOS
# =============================================================================

class TipoContratoSerializer(serializers.ModelSerializer):
    """Serializer para TipoContrato"""

    class Meta:
        model = TipoContrato
        fields = [
            'id',
            'codigo',
            'nombre',
            'descripcion',
            'requiere_duracion',
            'requiere_objeto',
            'color_badge',
            'orden',
            'is_active',
        ]


class TipoEntidadSerializer(serializers.ModelSerializer):
    """Serializer para TipoEntidad"""

    class Meta:
        model = TipoEntidad
        fields = [
            'id',
            'codigo',
            'nombre',
            'descripcion',
            'es_obligatorio',
            'color_badge',
            'orden',
            'is_active',
        ]


class EntidadSeguridadSocialSerializer(serializers.ModelSerializer):
    """Serializer para EntidadSeguridadSocial"""

    tipo_entidad_nombre = serializers.CharField(
        source='tipo_entidad.nombre',
        read_only=True
    )
    tipo_entidad_codigo = serializers.CharField(
        source='tipo_entidad.codigo',
        read_only=True
    )

    class Meta:
        model = EntidadSeguridadSocial
        fields = [
            'id',
            'tipo_entidad',
            'tipo_entidad_nombre',
            'tipo_entidad_codigo',
            'codigo',
            'nombre',
            'razon_social',
            'nit',
            'telefono',
            'email',
            'sitio_web',
            'orden',
            'is_active',
        ]


class TipoPruebaSerializer(serializers.ModelSerializer):
    """Serializer para TipoPrueba"""

    class Meta:
        model = TipoPrueba
        fields = [
            'id',
            'codigo',
            'nombre',
            'descripcion',
            'permite_calificacion',
            'requiere_archivo',
            'duracion_estimada_minutos',
            'color_badge',
            'orden',
            'is_active',
        ]


# =============================================================================
# VACANTE ACTIVA
# =============================================================================

class VacanteActivaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de VacanteActiva"""

    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True, default='')
    tipo_contrato_nombre = serializers.CharField(
        source='tipo_contrato.nombre',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    prioridad_display = serializers.CharField(
        source='get_prioridad_display',
        read_only=True
    )
    modalidad_display = serializers.CharField(
        source='get_modalidad_display',
        read_only=True
    )
    dias_abierta = serializers.IntegerField(read_only=True)
    total_candidatos = serializers.IntegerField(read_only=True)
    candidatos_activos = serializers.IntegerField(read_only=True)

    class Meta:
        model = VacanteActiva
        fields = [
            'id',
            'cargo',
            'cargo_nombre',
            'codigo_vacante',
            'titulo',
            'cargo_requerido',
            'area',
            'tipo_contrato',
            'tipo_contrato_nombre',
            'estado',
            'estado_display',
            'prioridad',
            'prioridad_display',
            'modalidad',
            'modalidad_display',
            'numero_posiciones',
            'posiciones_cubiertas',
            'fecha_apertura',
            'fecha_cierre_esperada',
            'dias_abierta',
            'total_candidatos',
            'candidatos_activos',
            'publicada_externamente',
            'is_active',
            'created_at',
        ]


class VacanteActivaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para VacanteActiva"""

    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True, default='')
    tipo_contrato = TipoContratoSerializer(read_only=True)
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    prioridad_display = serializers.CharField(
        source='get_prioridad_display',
        read_only=True
    )
    modalidad_display = serializers.CharField(
        source='get_modalidad_display',
        read_only=True
    )
    dias_abierta = serializers.IntegerField(read_only=True)
    total_candidatos = serializers.IntegerField(read_only=True)
    candidatos_activos = serializers.IntegerField(read_only=True)
    candidatos_aprobados = serializers.IntegerField(read_only=True)
    candidatos_contratados = serializers.IntegerField(read_only=True)

    class Meta:
        model = VacanteActiva
        fields = [
            'id',
            'empresa',
            'cargo',
            'cargo_nombre',
            'codigo_vacante',
            'titulo',
            'cargo_requerido',
            'area',
            'descripcion',
            'requisitos_minimos',
            'requisitos_deseables',
            'funciones_principales',
            'competencias_requeridas',
            # Contrato
            'tipo_contrato',
            'salario_minimo',
            'salario_maximo',
            'salario_oculto',
            'beneficios',
            'horario',
            'modalidad',
            'modalidad_display',
            'ubicacion',
            # Gestión
            'numero_posiciones',
            'posiciones_cubiertas',
            'estado',
            'estado_display',
            'prioridad',
            'prioridad_display',
            'fecha_apertura',
            'fecha_cierre_esperada',
            'fecha_cierre_real',
            # Publicación
            'publicada_externamente',
            'url_publicacion',
            # Responsables
            'responsable_proceso',
            'reclutador',
            # Observaciones
            'observaciones',
            'motivo_cierre',
            # Calculados
            'dias_abierta',
            'total_candidatos',
            'candidatos_activos',
            'candidatos_aprobados',
            'candidatos_contratados',
            # Auditoría
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at']


class VacanteActivaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar VacanteActiva"""

    class Meta:
        model = VacanteActiva
        fields = [
            'cargo',
            'codigo_vacante',
            'titulo',
            'cargo_requerido',
            'area',
            'descripcion',
            'requisitos_minimos',
            'requisitos_deseables',
            'funciones_principales',
            'competencias_requeridas',
            'tipo_contrato',
            'salario_minimo',
            'salario_maximo',
            'salario_oculto',
            'beneficios',
            'horario',
            'modalidad',
            'ubicacion',
            'numero_posiciones',
            'estado',
            'prioridad',
            'fecha_apertura',
            'fecha_cierre_esperada',
            'fecha_cierre_real',
            'publicada_externamente',
            'url_publicacion',
            'responsable_proceso',
            'reclutador',
            'observaciones',
            'motivo_cierre',
            'is_active',
        ]


# =============================================================================
# CANDIDATO
# =============================================================================

class CandidatoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Candidatos"""

    vacante_codigo = serializers.CharField(
        source='vacante.codigo_vacante',
        read_only=True
    )
    vacante_titulo = serializers.CharField(
        source='vacante.titulo',
        read_only=True
    )
    nombre_completo = serializers.CharField(read_only=True)
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    origen_display = serializers.CharField(
        source='get_origen_postulacion_display',
        read_only=True
    )
    dias_en_proceso = serializers.IntegerField(read_only=True)

    class Meta:
        model = Candidato
        fields = [
            'id',
            'vacante',
            'vacante_codigo',
            'vacante_titulo',
            'nombres',
            'apellidos',
            'nombre_completo',
            'tipo_documento',
            'numero_documento',
            'email',
            'telefono',
            'ciudad',
            'nivel_educativo',
            'anos_experiencia',
            'estado',
            'estado_display',
            'origen_postulacion',
            'origen_display',
            'fecha_postulacion',
            'dias_en_proceso',
            'calificacion_general',
            'is_active',
        ]


class CandidatoDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Candidato"""

    vacante = VacanteActivaListSerializer(read_only=True)
    nombre_completo = serializers.CharField(read_only=True)
    edad = serializers.IntegerField(read_only=True)
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    origen_display = serializers.CharField(
        source='get_origen_postulacion_display',
        read_only=True
    )
    tipo_documento_display = serializers.CharField(
        source='get_tipo_documento_display',
        read_only=True
    )
    nivel_educativo_display = serializers.CharField(
        source='get_nivel_educativo_display',
        read_only=True
    )
    dias_en_proceso = serializers.IntegerField(read_only=True)
    total_entrevistas = serializers.IntegerField(read_only=True)
    total_pruebas = serializers.IntegerField(read_only=True)

    class Meta:
        model = Candidato
        fields = [
            'id',
            'empresa',
            'vacante',
            # Información personal
            'nombres',
            'apellidos',
            'nombre_completo',
            'tipo_documento',
            'tipo_documento_display',
            'numero_documento',
            'fecha_nacimiento',
            'edad',
            'genero',
            # Contacto
            'email',
            'telefono',
            'telefono_alternativo',
            'ciudad',
            'direccion',
            # Perfil profesional
            'nivel_educativo',
            'nivel_educativo_display',
            'titulo_obtenido',
            'anos_experiencia',
            'anos_experiencia_cargo',
            # Gestión
            'estado',
            'estado_display',
            'origen_postulacion',
            'origen_display',
            'fecha_postulacion',
            'fecha_ultima_actualizacion',
            # Documentos
            'hoja_vida',
            'carta_presentacion',
            # Pretensión
            'pretension_salarial',
            # Disponibilidad
            'fecha_disponibilidad',
            'requiere_reubicacion',
            'disponibilidad_viajes',
            # Referencias
            'referido_por',
            # Evaluación
            'calificacion_general',
            'fortalezas',
            'debilidades',
            'observaciones',
            'motivo_rechazo',
            # Contratación
            'fecha_contratacion',
            'salario_ofrecido',
            # Calculados
            'dias_en_proceso',
            'total_entrevistas',
            'total_pruebas',
            # Auditoría
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at']


class CandidatoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Candidato"""

    class Meta:
        model = Candidato
        fields = [
            'vacante',
            'nombres',
            'apellidos',
            'tipo_documento',
            'numero_documento',
            'fecha_nacimiento',
            'genero',
            'email',
            'telefono',
            'telefono_alternativo',
            'ciudad',
            'direccion',
            'nivel_educativo',
            'titulo_obtenido',
            'anos_experiencia',
            'anos_experiencia_cargo',
            'estado',
            'origen_postulacion',
            'hoja_vida',
            'carta_presentacion',
            'pretension_salarial',
            'fecha_disponibilidad',
            'requiere_reubicacion',
            'disponibilidad_viajes',
            'referido_por',
            'calificacion_general',
            'fortalezas',
            'debilidades',
            'observaciones',
            'motivo_rechazo',
            'fecha_contratacion',
            'salario_ofrecido',
            'is_active',
        ]


# =============================================================================
# ENTREVISTA
# =============================================================================

class EntrevistaSerializer(serializers.ModelSerializer):
    """Serializer completo para Entrevista"""

    candidato_nombre = serializers.CharField(
        source='candidato.nombre_completo',
        read_only=True
    )
    vacante_codigo = serializers.CharField(
        source='candidato.vacante.codigo_vacante',
        read_only=True
    )
    tipo_display = serializers.CharField(
        source='get_tipo_entrevista_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    recomendacion_display = serializers.CharField(
        source='get_recomendacion_display',
        read_only=True
    )
    calificacion_promedio = serializers.FloatField(read_only=True)

    class Meta:
        model = Entrevista
        fields = [
            'id',
            'candidato',
            'candidato_nombre',
            'vacante_codigo',
            'numero_entrevista',
            'tipo_entrevista',
            'tipo_display',
            # Programación
            'fecha_programada',
            'duracion_estimada_minutos',
            'ubicacion',
            # Entrevistadores
            'entrevistador_principal',
            'entrevistadores_adicionales',
            # Estado
            'estado',
            'estado_display',
            'fecha_realizacion',
            'duracion_real_minutos',
            # Evaluación
            'asistio_candidato',
            'calificacion_tecnica',
            'calificacion_competencias',
            'calificacion_general',
            'calificacion_promedio',
            # Retroalimentación
            'fortalezas_identificadas',
            'aspectos_mejorar',
            'observaciones',
            'recomendacion',
            'recomendacion_display',
            # Archivos
            'notas_entrevista',
            # Cancelación
            'motivo_cancelacion',
            'fecha_reprogramada',
            # Auditoría
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'numero_entrevista', 'created_at', 'updated_at']


class EntrevistaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Entrevista"""

    class Meta:
        model = Entrevista
        fields = [
            'candidato',
            'tipo_entrevista',
            'fecha_programada',
            'duracion_estimada_minutos',
            'ubicacion',
            'entrevistador_principal',
            'entrevistadores_adicionales',
            'estado',
            'observaciones',
        ]


# =============================================================================
# PRUEBA
# =============================================================================

class PruebaSerializer(serializers.ModelSerializer):
    """Serializer completo para Prueba"""

    candidato_nombre = serializers.CharField(
        source='candidato.nombre_completo',
        read_only=True
    )
    tipo_prueba_nombre = serializers.CharField(
        source='tipo_prueba.nombre',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = Prueba
        fields = [
            'id',
            'candidato',
            'candidato_nombre',
            'tipo_prueba',
            'tipo_prueba_nombre',
            # Programación
            'fecha_programada',
            'fecha_realizacion',
            'ubicacion',
            'proveedor_externo',
            # Responsable
            'responsable',
            # Estado
            'estado',
            'estado_display',
            # Resultados
            'calificacion',
            'aprobado',
            'puntaje_minimo_aprobacion',
            # Archivos
            'archivo_prueba',
            'archivo_resultado',
            # Observaciones
            'observaciones',
            'recomendaciones',
            'motivo_cancelacion',
            # Costos
            'costo',
            # Auditoría
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PruebaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Prueba"""

    class Meta:
        model = Prueba
        fields = [
            'candidato',
            'tipo_prueba',
            'fecha_programada',
            'ubicacion',
            'proveedor_externo',
            'responsable',
            'estado',
            'puntaje_minimo_aprobacion',
            'archivo_prueba',
            'costo',
            'observaciones',
        ]


# =============================================================================
# AFILIACIÓN SEGURIDAD SOCIAL
# =============================================================================

class AfiliacionSSSerializer(serializers.ModelSerializer):
    """Serializer completo para AfiliacionSS"""

    candidato_nombre = serializers.CharField(
        source='candidato.nombre_completo',
        read_only=True
    )
    entidad_nombre = serializers.CharField(
        source='entidad.nombre',
        read_only=True
    )
    tipo_entidad = serializers.CharField(
        source='entidad.tipo_entidad.codigo',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = AfiliacionSS
        fields = [
            'id',
            'candidato',
            'candidato_nombre',
            'entidad',
            'entidad_nombre',
            'tipo_entidad',
            # Información
            'fecha_solicitud',
            'fecha_afiliacion',
            'numero_afiliacion',
            # Estado
            'estado',
            'estado_display',
            # Responsable
            'responsable_tramite',
            # Documentos
            'documento_afiliacion',
            # Observaciones
            'observaciones',
            'motivo_rechazo',
            # Auditoría
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AfiliacionSSCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear AfiliacionSS"""

    class Meta:
        model = AfiliacionSS
        fields = [
            'candidato',
            'entidad',
            'fecha_solicitud',
            'responsable_tramite',
            'observaciones',
        ]


# =============================================================================
# ESTADÍSTICAS
# =============================================================================

class ProcesoSeleccionEstadisticasSerializer(serializers.Serializer):
    """Serializer para estadísticas del proceso de selección"""
    vacantes_total = serializers.IntegerField()
    vacantes_abiertas = serializers.IntegerField()
    candidatos_total = serializers.IntegerField()
    candidatos_en_proceso = serializers.IntegerField()
    candidatos_aprobados = serializers.IntegerField()
    candidatos_contratados = serializers.IntegerField()
    candidatos_rechazados = serializers.IntegerField()
    entrevistas_programadas = serializers.IntegerField()
    entrevistas_realizadas = serializers.IntegerField()
    pruebas_pendientes = serializers.IntegerField()
    tiempo_promedio_contratacion = serializers.FloatField()


# =============================================================================
# PRUEBAS TÉCNICAS DINÁMICAS
# =============================================================================

class PlantillaPruebaDinamicaListSerializer(serializers.ModelSerializer):
    """Serializer de lista para PlantillaPruebaDinamica"""
    total_campos = serializers.IntegerField(read_only=True)
    puntaje_maximo = serializers.IntegerField(read_only=True)
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name', read_only=True, default=''
    )

    class Meta:
        model = PlantillaPruebaDinamica
        fields = [
            'id', 'nombre', 'descripcion', 'categoria', 'tipo_scoring',
            'duracion_estimada_minutos', 'tiempo_limite_minutos',
            'total_campos', 'puntaje_maximo', 'total_asignaciones',
            'is_active', 'created_by_nombre', 'created_at', 'updated_at',
        ]


class PlantillaPruebaDinamicaDetailSerializer(serializers.ModelSerializer):
    """Serializer de detalle para PlantillaPruebaDinamica (incluye campos)"""
    total_campos = serializers.IntegerField(read_only=True)
    puntaje_maximo = serializers.IntegerField(read_only=True)
    created_by_nombre = serializers.CharField(
        source='created_by.get_full_name', read_only=True, default=''
    )

    class Meta:
        model = PlantillaPruebaDinamica
        fields = [
            'id', 'nombre', 'descripcion', 'instrucciones', 'campos',
            'scoring_config', 'tipo_scoring', 'categoria',
            'duracion_estimada_minutos', 'tiempo_limite_minutos',
            'total_campos', 'puntaje_maximo', 'total_asignaciones',
            'is_active', 'created_by', 'created_by_nombre',
            'created_at', 'updated_at',
        ]


class PlantillaPruebaDinamicaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar PlantillaPruebaDinamica"""

    class Meta:
        model = PlantillaPruebaDinamica
        fields = [
            'nombre', 'descripcion', 'instrucciones', 'campos',
            'scoring_config', 'tipo_scoring', 'categoria',
            'duracion_estimada_minutos', 'tiempo_limite_minutos',
        ]

    def validate_campos(self, value):
        """Valida la estructura de los campos."""
        if not isinstance(value, list):
            raise serializers.ValidationError('Los campos deben ser una lista.')
        for i, campo in enumerate(value):
            if not isinstance(campo, dict):
                raise serializers.ValidationError(
                    f'El campo en posición {i} debe ser un objeto.'
                )
            if not campo.get('nombre_campo'):
                raise serializers.ValidationError(
                    f'El campo en posición {i} requiere nombre_campo.'
                )
            if not campo.get('etiqueta'):
                raise serializers.ValidationError(
                    f'El campo en posición {i} requiere etiqueta.'
                )
            if not campo.get('tipo_campo'):
                raise serializers.ValidationError(
                    f'El campo en posición {i} requiere tipo_campo.'
                )
        return value


class AsignacionPruebaDinamicaListSerializer(serializers.ModelSerializer):
    """Serializer de lista para AsignacionPruebaDinamica"""
    plantilla_nombre = serializers.CharField(
        source='plantilla.nombre', read_only=True
    )
    plantilla_categoria = serializers.CharField(
        source='plantilla.categoria', read_only=True
    )
    candidato_nombre = serializers.CharField(
        source='candidato.nombre_completo', read_only=True
    )
    vacante_titulo = serializers.CharField(
        source='vacante.titulo', read_only=True, default=''
    )
    vacante_codigo = serializers.CharField(
        source='vacante.codigo_vacante', read_only=True, default=''
    )
    estado_display = serializers.CharField(
        source='get_estado_display', read_only=True
    )
    esta_vencida = serializers.BooleanField(read_only=True)
    tiempo_transcurrido_minutos = serializers.IntegerField(read_only=True)
    asignado_por_nombre = serializers.CharField(
        source='asignado_por.get_full_name', read_only=True, default=''
    )

    class Meta:
        model = AsignacionPruebaDinamica
        fields = [
            'id', 'plantilla', 'plantilla_nombre', 'plantilla_categoria',
            'candidato', 'candidato_nombre',
            'vacante', 'vacante_titulo', 'vacante_codigo',
            'token', 'estado', 'estado_display',
            'fecha_asignacion', 'fecha_vencimiento',
            'fecha_inicio', 'fecha_completado',
            'puntaje_obtenido', 'puntaje_maximo', 'porcentaje', 'aprobado',
            'esta_vencida', 'tiempo_transcurrido_minutos',
            'email_enviado', 'asignado_por_nombre',
            'created_at',
        ]


class AsignacionPruebaDinamicaDetailSerializer(AsignacionPruebaDinamicaListSerializer):
    """Serializer de detalle (incluye respuestas y calificación)"""
    plantilla_campos = serializers.JSONField(
        source='plantilla.campos', read_only=True
    )
    plantilla_instrucciones = serializers.CharField(
        source='plantilla.instrucciones', read_only=True
    )
    plantilla_scoring_config = serializers.JSONField(
        source='plantilla.scoring_config', read_only=True
    )

    class Meta(AsignacionPruebaDinamicaListSerializer.Meta):
        fields = AsignacionPruebaDinamicaListSerializer.Meta.fields + [
            'respuestas', 'detalle_calificacion', 'observaciones',
            'ip_address', 'user_agent',
            'plantilla_campos', 'plantilla_instrucciones', 'plantilla_scoring_config',
            'updated_at',
        ]


class AsignacionPruebaDinamicaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear AsignacionPruebaDinamica"""
    dias_vencimiento = serializers.IntegerField(
        write_only=True, required=False, default=7,
        help_text='Días hasta el vencimiento (default: 7)'
    )
    enviar_email = serializers.BooleanField(
        write_only=True, required=False, default=True
    )

    class Meta:
        model = AsignacionPruebaDinamica
        fields = [
            'plantilla', 'candidato', 'vacante',
            'observaciones', 'dias_vencimiento', 'enviar_email',
        ]

    def validate(self, attrs):
        plantilla = attrs.get('plantilla')
        if plantilla and not plantilla.is_active:
            raise serializers.ValidationError(
                {'plantilla': 'La plantilla seleccionada no está activa.'}
            )
        return attrs


class ResponderPruebaDinamicaSerializer(serializers.Serializer):
    """Serializer para que el candidato responda la prueba (público, sin auth)"""
    respuestas = serializers.DictField(
        child=serializers.JSONField(),
        help_text='Respuestas del candidato: {nombre_campo: valor}'
    )


# =============================================================================
# ENTREVISTA ASINCRONICA
# =============================================================================

class EntrevistaAsincronicaListSerializer(serializers.ModelSerializer):
    """Serializer lista para EntrevistaAsincronica"""

    candidato_nombre = serializers.CharField(
        source='candidato.nombre_completo', read_only=True
    )
    vacante_codigo = serializers.CharField(read_only=True)
    estado_display = serializers.CharField(
        source='get_estado_display', read_only=True
    )
    recomendacion_display = serializers.CharField(
        source='get_recomendacion_display', read_only=True
    )
    total_preguntas = serializers.IntegerField(read_only=True)
    total_respuestas = serializers.IntegerField(read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)

    class Meta:
        model = EntrevistaAsincronica
        fields = [
            'id',
            'candidato',
            'candidato_nombre',
            'vacante_codigo',
            'titulo',
            'estado',
            'estado_display',
            'total_preguntas',
            'total_respuestas',
            'token',
            'email_enviado',
            'fecha_envio',
            'fecha_vencimiento',
            'fecha_completado',
            'fecha_evaluacion',
            'calificacion_general',
            'recomendacion',
            'recomendacion_display',
            'esta_vencida',
            'created_at',
        ]


class EntrevistaAsincronicaDetailSerializer(EntrevistaAsincronicaListSerializer):
    """Serializer detalle para EntrevistaAsincronica"""

    evaluador_nombre = serializers.SerializerMethodField()

    class Meta(EntrevistaAsincronicaListSerializer.Meta):
        fields = EntrevistaAsincronicaListSerializer.Meta.fields + [
            'instrucciones',
            'preguntas',
            'respuestas',
            'evaluador',
            'evaluador_nombre',
            'observaciones_evaluador',
            'fortalezas_identificadas',
            'aspectos_mejorar',
            'fecha_inicio',
            'ip_address',
            'user_agent',
            'updated_at',
        ]

    def get_evaluador_nombre(self, obj):
        if obj.evaluador:
            return f"{obj.evaluador.first_name} {obj.evaluador.last_name}".strip() or obj.evaluador.email
        return None


class EntrevistaAsincronicaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear EntrevistaAsincronica"""

    dias_vencimiento = serializers.IntegerField(
        write_only=True, required=False, default=7,
        help_text='Dias hasta el vencimiento (default: 7)'
    )
    enviar_email = serializers.BooleanField(
        write_only=True, required=False, default=True
    )

    class Meta:
        model = EntrevistaAsincronica
        fields = [
            'candidato',
            'titulo',
            'instrucciones',
            'preguntas',
            'dias_vencimiento',
            'enviar_email',
        ]

    def validate_preguntas(self, value):
        """Valida estructura de las preguntas"""
        if not value or not isinstance(value, list):
            raise serializers.ValidationError('Debe incluir al menos una pregunta.')

        tipos_validos = ('texto_corto', 'texto_largo', 'opcion_multiple', 'escala')
        for i, pregunta in enumerate(value):
            if not isinstance(pregunta, dict):
                raise serializers.ValidationError(f'Pregunta {i + 1}: formato invalido.')
            if not pregunta.get('pregunta'):
                raise serializers.ValidationError(f'Pregunta {i + 1}: texto requerido.')
            tipo = pregunta.get('tipo', 'texto_largo')
            if tipo not in tipos_validos:
                raise serializers.ValidationError(
                    f'Pregunta {i + 1}: tipo "{tipo}" no valido. Usar: {tipos_validos}'
                )
            if tipo == 'opcion_multiple' and not pregunta.get('opciones'):
                raise serializers.ValidationError(
                    f'Pregunta {i + 1}: opcion_multiple requiere lista de opciones.'
                )
            # Asegurar que tenga id y orden
            if not pregunta.get('id'):
                pregunta['id'] = f'pregunta_{i + 1}'
            if 'orden' not in pregunta:
                pregunta['orden'] = i + 1

        return value


class EntrevistaAsincronicaPublicSerializer(serializers.ModelSerializer):
    """Serializer publico (sin auth) para que el candidato vea la entrevista"""

    candidato_nombre = serializers.CharField(
        source='candidato.nombre_completo', read_only=True
    )
    empresa_nombre = serializers.SerializerMethodField()

    class Meta:
        model = EntrevistaAsincronica
        fields = [
            'titulo',
            'instrucciones',
            'candidato_nombre',
            'empresa_nombre',
            'preguntas',
            'estado',
            'fecha_vencimiento',
        ]

    def get_empresa_nombre(self, obj):
        if obj.empresa:
            return obj.empresa.name if hasattr(obj.empresa, 'name') else str(obj.empresa)
        return 'StrateKaz'


class ResponderEntrevistaAsincronicaSerializer(serializers.Serializer):
    """Serializer para que el candidato responda la entrevista (publico, sin auth)"""
    respuestas = serializers.DictField(
        child=serializers.CharField(allow_blank=True),
        help_text='Respuestas del candidato: {pregunta_id: respuesta_texto}'
    )


# =============================================================================
# PORTAL PÚBLICO DE VACANTES (AllowAny)
# =============================================================================

class VacantePublicaListSerializer(serializers.ModelSerializer):
    """Serializer público para listado de vacantes - exposición mínima de datos."""

    tipo_contrato_nombre = serializers.CharField(
        source='tipo_contrato.nombre', read_only=True
    )
    modalidad_display = serializers.CharField(
        source='get_modalidad_display', read_only=True
    )
    prioridad_display = serializers.CharField(
        source='get_prioridad_display', read_only=True
    )
    empresa_nombre = serializers.SerializerMethodField()
    rango_salarial = serializers.SerializerMethodField()

    class Meta:
        model = VacanteActiva
        fields = [
            'id',
            'codigo_vacante',
            'titulo',
            'cargo_requerido',
            'area',
            'descripcion',
            'tipo_contrato_nombre',
            'modalidad',
            'modalidad_display',
            'ubicacion',
            'horario',
            'prioridad',
            'prioridad_display',
            'numero_posiciones',
            'posiciones_cubiertas',
            'fecha_apertura',
            'rango_salarial',
            'empresa_nombre',
        ]

    def get_empresa_nombre(self, obj):
        """Obtiene el nombre de la empresa desde EmpresaConfig del tenant."""
        try:
            from django.apps import apps
            EmpresaConfig = apps.get_model('configuracion', 'EmpresaConfig')
            config = EmpresaConfig.objects.first()
            if config:
                return config.razon_social
        except Exception:
            pass
        return 'Empresa'

    def get_rango_salarial(self, obj):
        """Retorna el rango salarial solo si no está oculto."""
        if obj.salario_oculto:
            return None
        result = {}
        if obj.salario_minimo:
            result['minimo'] = str(obj.salario_minimo)
        if obj.salario_maximo:
            result['maximo'] = str(obj.salario_maximo)
        return result if result else None


class VacantePublicaDetailSerializer(VacantePublicaListSerializer):
    """Serializer público detallado para una vacante - incluye requisitos completos."""

    class Meta(VacantePublicaListSerializer.Meta):
        fields = VacantePublicaListSerializer.Meta.fields + [
            'requisitos_minimos',
            'requisitos_deseables',
            'funciones_principales',
            'competencias_requeridas',
            'beneficios',
        ]


class PostulacionPublicaSerializer(serializers.Serializer):
    """Serializer para postulación pública de candidatos externos."""

    vacante_id = serializers.IntegerField()
    nombres = serializers.CharField(max_length=100)
    apellidos = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    telefono = serializers.CharField(max_length=20)
    tipo_documento = serializers.ChoiceField(
        choices=[('CC', 'Cédula de Ciudadanía'), ('CE', 'Cédula de Extranjería'),
                 ('PA', 'Pasaporte'), ('TI', 'Tarjeta de Identidad')],
        default='CC',
    )
    numero_documento = serializers.CharField(max_length=20)
    ciudad = serializers.CharField(max_length=100)
    nivel_educativo = serializers.ChoiceField(
        choices=[
            ('bachiller', 'Bachiller'), ('tecnico', 'Técnico'),
            ('tecnologo', 'Tecnólogo'), ('profesional', 'Profesional'),
            ('especializacion', 'Especialización'), ('maestria', 'Maestría'),
            ('doctorado', 'Doctorado'),
        ],
        required=False,
        default='profesional',
    )
    hoja_vida = serializers.FileField(
        required=True,
        help_text='Hoja de vida en formato PDF, DOC o DOCX (máx. 5MB)',
    )
    carta_presentacion = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Carta de presentación (texto opcional)',
    )

    def validate_vacante_id(self, value):
        """Verifica que la vacante exista, esté abierta y publicada."""
        try:
            vacante = VacanteActiva.objects.get(
                id=value,
                estado='abierta',
                publicada_externamente=True,
                is_active=True,
            )
        except VacanteActiva.DoesNotExist:
            raise serializers.ValidationError(
                'La vacante no existe o no está disponible para postulaciones.'
            )
        return value

    def validate_hoja_vida(self, value):
        """Valida formato y tamaño del archivo."""
        max_size = 5 * 1024 * 1024  # 5MB
        if value.size > max_size:
            raise serializers.ValidationError(
                'El archivo no puede superar los 5 MB.'
            )
        ext = value.name.split('.')[-1].lower()
        if ext not in ('pdf', 'doc', 'docx'):
            raise serializers.ValidationError(
                'Solo se aceptan archivos PDF, DOC o DOCX.'
            )
        return value

    def validate(self, attrs):
        """Verificar que no exista postulación duplicada."""
        vacante_id = attrs.get('vacante_id')
        email = attrs.get('email')
        numero_documento = attrs.get('numero_documento')

        existe = Candidato.objects.filter(
            vacante_id=vacante_id,
            is_active=True,
        ).filter(
            models.Q(email=email) | models.Q(numero_documento=numero_documento)
        ).exists()

        if existe:
            raise serializers.ValidationError(
                'Ya existe una postulación para esta vacante con este email o documento.'
            )
        return attrs
