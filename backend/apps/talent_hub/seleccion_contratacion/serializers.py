"""
Serializers para Selección y Contratación - Talent Hub
Sistema de Gestión StrateKaz

100% DINÁMICO: Serializers para API REST del proceso de selección,
candidatos, entrevistas, pruebas y afiliaciones.
"""
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
