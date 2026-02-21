"""
Serializers para Estructura de Cargos - Talent Hub
Sistema de Gestión StrateKaz

100% DINÁMICO: Serializers para API REST de profesiogramas, competencias,
requisitos especiales y vacantes.
"""
from rest_framework import serializers
from .models import Profesiograma, MatrizCompetencia, RequisitoEspecial, Vacante


# =============================================================================
# SERIALIZERS BÁSICOS (para relaciones anidadas)
# =============================================================================

class CargoBasicoSerializer(serializers.Serializer):
    """Serializer básico para FK de Cargo"""
    id = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(source='name', read_only=True)
    codigo = serializers.CharField(read_only=True)


class AreaBasicaSerializer(serializers.Serializer):
    """Serializer básico para FK de Area"""
    id = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(source='name', read_only=True)
    codigo = serializers.CharField(read_only=True)


class UserBasicoSerializer(serializers.Serializer):
    """Serializer básico para FK de User"""
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


# =============================================================================
# MATRIZ DE COMPETENCIA
# =============================================================================

class MatrizCompetenciaSerializer(serializers.ModelSerializer):
    """Serializer completo para MatrizCompetencia"""

    tipo_competencia_display = serializers.CharField(
        source='get_tipo_competencia_display',
        read_only=True
    )
    nivel_requerido_display = serializers.CharField(
        source='get_nivel_requerido_display',
        read_only=True
    )
    criticidad_display = serializers.CharField(
        source='get_criticidad_display',
        read_only=True
    )
    es_excluyente = serializers.BooleanField(read_only=True)

    class Meta:
        model = MatrizCompetencia
        fields = [
            'id',
            'profesiograma',
            'tipo_competencia',
            'tipo_competencia_display',
            'nombre_competencia',
            'descripcion',
            'nivel_requerido',
            'nivel_requerido_display',
            'criticidad',
            'criticidad_display',
            'peso_evaluacion',
            'indicadores_nivel_basico',
            'indicadores_nivel_intermedio',
            'indicadores_nivel_avanzado',
            'indicadores_nivel_experto',
            'forma_desarrollo',
            'recursos_recomendados',
            'observaciones',
            'es_excluyente',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MatrizCompetenciaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar MatrizCompetencia"""

    class Meta:
        model = MatrizCompetencia
        fields = [
            'profesiograma',
            'tipo_competencia',
            'nombre_competencia',
            'descripcion',
            'nivel_requerido',
            'criticidad',
            'peso_evaluacion',
            'indicadores_nivel_basico',
            'indicadores_nivel_intermedio',
            'indicadores_nivel_avanzado',
            'indicadores_nivel_experto',
            'forma_desarrollo',
            'recursos_recomendados',
            'observaciones',
            'is_active',
        ]


# =============================================================================
# REQUISITO ESPECIAL
# =============================================================================

class RequisitoEspecialSerializer(serializers.ModelSerializer):
    """Serializer completo para RequisitoEspecial"""

    tipo_requisito_display = serializers.CharField(
        source='get_tipo_requisito_display',
        read_only=True
    )
    criticidad_display = serializers.CharField(
        source='get_criticidad_display',
        read_only=True
    )
    es_obligatorio_legal = serializers.BooleanField(read_only=True)

    class Meta:
        model = RequisitoEspecial
        fields = [
            'id',
            'profesiograma',
            'tipo_requisito',
            'tipo_requisito_display',
            'nombre_requisito',
            'descripcion',
            'criticidad',
            'criticidad_display',
            'es_renovable',
            'vigencia_meses',
            'entidad_emisora',
            'requiere_documento_soporte',
            'tipo_documento_soporte',
            'base_legal',
            'observaciones',
            'es_obligatorio_legal',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RequisitoEspecialCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar RequisitoEspecial"""

    class Meta:
        model = RequisitoEspecial
        fields = [
            'profesiograma',
            'tipo_requisito',
            'nombre_requisito',
            'descripcion',
            'criticidad',
            'es_renovable',
            'vigencia_meses',
            'entidad_emisora',
            'requiere_documento_soporte',
            'tipo_documento_soporte',
            'base_legal',
            'observaciones',
            'is_active',
        ]


# =============================================================================
# PROFESIOGRAMA
# =============================================================================

class ProfesiogramaListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Profesiogramas"""

    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True)
    area_nombre = serializers.CharField(source='area.name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    nivel_educativo_display = serializers.CharField(
        source='get_nivel_educativo_minimo_display',
        read_only=True
    )
    esta_vigente = serializers.BooleanField(read_only=True)
    total_competencias = serializers.IntegerField(read_only=True)
    total_requisitos_especiales = serializers.IntegerField(read_only=True)

    class Meta:
        model = Profesiograma
        fields = [
            'id',
            'codigo',
            'nombre',
            'cargo',
            'cargo_nombre',
            'area',
            'area_nombre',
            'version',
            'estado',
            'estado_display',
            'nivel_educativo_minimo',
            'nivel_educativo_display',
            'experiencia_minima',
            'esta_vigente',
            'total_competencias',
            'total_requisitos_especiales',
            'fecha_vigencia_inicio',
            'fecha_vigencia_fin',
            'is_active',
            'created_at',
        ]


class ProfesiogramaDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Profesiograma"""

    cargo = CargoBasicoSerializer(read_only=True)
    area = AreaBasicaSerializer(read_only=True)
    aprobado_por = UserBasicoSerializer(read_only=True)
    competencias = MatrizCompetenciaSerializer(many=True, read_only=True)
    requisitos_especiales = RequisitoEspecialSerializer(many=True, read_only=True)

    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    nivel_educativo_display = serializers.CharField(
        source='get_nivel_educativo_minimo_display',
        read_only=True
    )
    experiencia_display = serializers.CharField(
        source='get_experiencia_minima_display',
        read_only=True
    )
    esta_vigente = serializers.BooleanField(read_only=True)
    total_competencias = serializers.IntegerField(read_only=True)
    total_requisitos_especiales = serializers.IntegerField(read_only=True)

    class Meta:
        model = Profesiograma
        fields = [
            'id',
            'empresa',
            'codigo',
            'nombre',
            'descripcion',
            'version',
            'estado',
            'estado_display',
            # Relaciones
            'cargo',
            'area',
            # Requisitos académicos
            'nivel_educativo_minimo',
            'nivel_educativo_display',
            'titulo_requerido',
            'areas_conocimiento',
            'formacion_complementaria',
            # Experiencia
            'experiencia_minima',
            'experiencia_display',
            'experiencia_especifica',
            'experiencia_cargos_similares',
            # Competencias (resumen)
            'competencias_tecnicas_resumen',
            'competencias_blandas_resumen',
            # SST
            'examenes_medicos_ingreso',
            'examenes_medicos_periodicos',
            'periodicidad_examenes',
            'restricciones_medicas',
            'factores_riesgo',
            'epp_requeridos',
            # Certificaciones
            'requiere_licencia_conduccion',
            'categoria_licencia',
            'otras_certificaciones',
            # Condiciones
            'jornada_laboral',
            'disponibilidad_viajar',
            'disponibilidad_turnos',
            'condiciones_especiales',
            # Aprobación
            'fecha_aprobacion',
            'aprobado_por',
            'fecha_vigencia_inicio',
            'fecha_vigencia_fin',
            # Observaciones
            'observaciones',
            # Calculados
            'esta_vigente',
            'total_competencias',
            'total_requisitos_especiales',
            # Relaciones anidadas
            'competencias',
            'requisitos_especiales',
            # Auditoría
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at']


class ProfesiogramaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Profesiograma"""

    class Meta:
        model = Profesiograma
        fields = [
            'cargo',
            'area',
            'codigo',
            'nombre',
            'descripcion',
            'version',
            'estado',
            'nivel_educativo_minimo',
            'titulo_requerido',
            'areas_conocimiento',
            'formacion_complementaria',
            'experiencia_minima',
            'experiencia_especifica',
            'experiencia_cargos_similares',
            'competencias_tecnicas_resumen',
            'competencias_blandas_resumen',
            'examenes_medicos_ingreso',
            'examenes_medicos_periodicos',
            'periodicidad_examenes',
            'restricciones_medicas',
            'factores_riesgo',
            'epp_requeridos',
            'requiere_licencia_conduccion',
            'categoria_licencia',
            'otras_certificaciones',
            'jornada_laboral',
            'disponibilidad_viajar',
            'disponibilidad_turnos',
            'condiciones_especiales',
            'fecha_aprobacion',
            'aprobado_por',
            'fecha_vigencia_inicio',
            'fecha_vigencia_fin',
            'observaciones',
            'is_active',
        ]


# =============================================================================
# VACANTE
# =============================================================================

class VacanteListSerializer(serializers.ModelSerializer):
    """Serializer para listado de Vacantes"""

    cargo_nombre = serializers.CharField(source='cargo.name', read_only=True)
    area_nombre = serializers.CharField(source='area.name', read_only=True)
    profesiograma_codigo = serializers.CharField(
        source='profesiograma.codigo',
        read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    motivo_display = serializers.CharField(
        source='get_motivo_vacante_display',
        read_only=True
    )
    prioridad_display = serializers.CharField(
        source='get_prioridad_display',
        read_only=True
    )
    tipo_contrato_display = serializers.CharField(
        source='get_tipo_contrato_display',
        read_only=True
    )
    esta_abierta = serializers.BooleanField(read_only=True)
    posiciones_pendientes = serializers.IntegerField(read_only=True)
    dias_abierta = serializers.IntegerField(read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)

    class Meta:
        model = Vacante
        fields = [
            'id',
            'codigo',
            'titulo_vacante',
            'cargo',
            'cargo_nombre',
            'area',
            'area_nombre',
            'profesiograma',
            'profesiograma_codigo',
            'motivo_vacante',
            'motivo_display',
            'cantidad_posiciones',
            'posiciones_cubiertas',
            'posiciones_pendientes',
            'estado',
            'estado_display',
            'prioridad',
            'prioridad_display',
            'tipo_contrato',
            'tipo_contrato_display',
            'fecha_apertura',
            'fecha_cierre_estimada',
            'esta_abierta',
            'dias_abierta',
            'esta_vencida',
            'is_active',
            'created_at',
        ]


class VacanteDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Vacante"""

    cargo = CargoBasicoSerializer(read_only=True)
    area = AreaBasicaSerializer(read_only=True)
    profesiograma = ProfesiogramaListSerializer(read_only=True)
    aprobado_por = UserBasicoSerializer(read_only=True)
    responsable_reclutamiento = UserBasicoSerializer(read_only=True)

    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    motivo_display = serializers.CharField(
        source='get_motivo_vacante_display',
        read_only=True
    )
    prioridad_display = serializers.CharField(
        source='get_prioridad_display',
        read_only=True
    )
    tipo_contrato_display = serializers.CharField(
        source='get_tipo_contrato_display',
        read_only=True
    )
    esta_abierta = serializers.BooleanField(read_only=True)
    posiciones_pendientes = serializers.IntegerField(read_only=True)
    dias_abierta = serializers.IntegerField(read_only=True)
    esta_vencida = serializers.BooleanField(read_only=True)

    class Meta:
        model = Vacante
        fields = [
            'id',
            'empresa',
            'codigo',
            'titulo_vacante',
            'descripcion',
            # Relaciones
            'cargo',
            'area',
            'profesiograma',
            # Motivo y cantidad
            'motivo_vacante',
            'motivo_display',
            'cantidad_posiciones',
            'posiciones_cubiertas',
            'posiciones_pendientes',
            # Estado
            'estado',
            'estado_display',
            'prioridad',
            'prioridad_display',
            # Condiciones
            'tipo_contrato',
            'tipo_contrato_display',
            'salario_minimo',
            'salario_maximo',
            'salario_a_convenir',
            'beneficios_adicionales',
            # Fechas
            'fecha_apertura',
            'fecha_cierre_estimada',
            'fecha_cierre_real',
            'fecha_incorporacion_deseada',
            # Aprobación
            'aprobado_por',
            'fecha_aprobacion',
            # Publicación
            'publicar_externamente',
            'canales_publicacion',
            # Responsable
            'responsable_reclutamiento',
            # Observaciones
            'observaciones',
            'motivo_cierre',
            # Calculados
            'esta_abierta',
            'dias_abierta',
            'esta_vencida',
            # Auditoría
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at']


class VacanteCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar Vacante"""

    class Meta:
        model = Vacante
        fields = [
            'cargo',
            'area',
            'profesiograma',
            'codigo',
            'titulo_vacante',
            'descripcion',
            'motivo_vacante',
            'cantidad_posiciones',
            'posiciones_cubiertas',
            'estado',
            'prioridad',
            'tipo_contrato',
            'salario_minimo',
            'salario_maximo',
            'salario_a_convenir',
            'beneficios_adicionales',
            'fecha_apertura',
            'fecha_cierre_estimada',
            'fecha_cierre_real',
            'fecha_incorporacion_deseada',
            'aprobado_por',
            'fecha_aprobacion',
            'publicar_externamente',
            'canales_publicacion',
            'responsable_reclutamiento',
            'observaciones',
            'motivo_cierre',
            'is_active',
        ]


# =============================================================================
# ESTADÍSTICAS
# =============================================================================

class ProfesiogramaEstadisticasSerializer(serializers.Serializer):
    """Serializer para estadísticas de profesiogramas"""
    total = serializers.IntegerField()
    vigentes = serializers.IntegerField()
    por_estado = serializers.DictField()
    por_nivel_educativo = serializers.DictField()


class VacanteEstadisticasSerializer(serializers.Serializer):
    """Serializer para estadísticas de vacantes"""
    total = serializers.IntegerField()
    abiertas = serializers.IntegerField()
    cerradas = serializers.IntegerField()
    por_estado = serializers.DictField()
    por_prioridad = serializers.DictField()
    posiciones_totales = serializers.IntegerField()
    posiciones_cubiertas = serializers.IntegerField()
    posiciones_pendientes = serializers.IntegerField()
