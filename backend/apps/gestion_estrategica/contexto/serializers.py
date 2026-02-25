"""
Serializers para Contexto Organizacional - Gestión Estratégica
==============================================================

Serializers para los modelos de análisis estratégico del contexto organizacional.

Modelos soportados:
- AnalisisDOFA: Análisis DOFA consolidado
- FactorDOFA: Factores individuales del análisis DOFA
- EstrategiaTOWS: Estrategias derivadas de la Matriz TOWS
- AnalisisPESTEL: Análisis PESTEL del entorno externo
- FactorPESTEL: Factores individuales del análisis PESTEL
- FuerzaPorter: Análisis de las 5 Fuerzas de Porter
- TipoParteInteresada: Catálogo de tipos de stakeholders
- ParteInteresada: Partes interesadas (stakeholders)
- RequisitoParteInteresada: Requisitos de partes interesadas
- MatrizComunicacion: Matriz de comunicación

Autor: Sistema ERP StrateKaz
Fecha: 2025-12-26
Actualizado: 2026-01-24 - Migrado a app independiente
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import (
    TipoAnalisisDOFA,
    AnalisisDOFA,
    FactorDOFA,
    EstrategiaTOWS,
    TipoAnalisisPESTEL,
    AnalisisPESTEL,
    FactorPESTEL,
    FuerzaPorter,
    GrupoParteInteresada,  # NUEVO (Sprint 17)
    TipoParteInteresada,
    ParteInteresada,
    RequisitoParteInteresada,
    MatrizComunicacion
)
from apps.gestion_estrategica.organizacion.models import Area

User = get_user_model()


# ============================================================================
# SERIALIZERS AUXILIARES
# ============================================================================

class AreaLightSerializer(serializers.ModelSerializer):
    """Serializer ligero para Area"""
    class Meta:
        model = Area
        fields = ['id', 'codigo', 'nombre', 'nivel']


class TipoAnalisisDOFASerializer(serializers.ModelSerializer):
    """Serializer para TipoAnalisisDOFA (catálogo global)."""

    class Meta:
        model = TipoAnalisisDOFA
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'icono', 'color', 'orden', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class FactorDOFASerializer(serializers.ModelSerializer):
    """Serializer para FactorDOFA."""

    # Relación con Area
    area = AreaLightSerializer(read_only=True)
    area_id = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.filter(is_active=True),
        source='area',
        write_only=True,
        required=False,
        allow_null=True
    )

    # Display fields
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    impacto_display = serializers.CharField(source='get_impacto_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = FactorDOFA
        fields = [
            'id', 'analisis', 'tipo', 'tipo_display', 'descripcion',
            'area', 'area_id', 'area_afectada',
            'impacto', 'impacto_display', 'evidencias',
            'fuente', 'votos_fortaleza', 'votos_debilidad',
            'orden', 'is_active',
            'empresa', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'created_by', 'empresa',
            'votos_fortaleza', 'votos_debilidad'
        ]


class AnalisisDOFASerializer(serializers.ModelSerializer):
    """Serializer para AnalisisDOFA."""

    # Tipo de análisis (catálogo global)
    tipo_analisis_nombre = serializers.CharField(source='tipo_analisis.nombre', read_only=True)
    tipo_analisis_codigo = serializers.CharField(source='tipo_analisis.codigo', read_only=True)
    tipo_analisis_icono = serializers.CharField(source='tipo_analisis.icono', read_only=True)
    tipo_analisis_color = serializers.CharField(source='tipo_analisis.color', read_only=True)

    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    # Responsable ahora es FK a Cargo (más estable organizacionalmente)
    responsable_nombre = serializers.CharField(source='responsable.name', read_only=True)
    aprobado_por_name = serializers.CharField(source='aprobado_por.get_full_name', read_only=True)
    factores = FactorDOFASerializer(many=True, read_only=True)
    total_factores = serializers.SerializerMethodField()
    total_estrategias = serializers.SerializerMethodField()

    class Meta:
        model = AnalisisDOFA
        fields = [
            'id', 'tipo_analisis', 'tipo_analisis_nombre', 'tipo_analisis_codigo',
            'tipo_analisis_icono', 'tipo_analisis_color',
            'nombre', 'fecha_analisis', 'periodo', 'responsable',
            'responsable_nombre', 'estado', 'estado_display', 'observaciones',
            'aprobado_por', 'aprobado_por_name', 'fecha_aprobacion',
            'empresa', 'created_at', 'updated_at', 'created_by',
            'factores', 'total_factores', 'total_estrategias'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']

    def get_total_factores(self, obj) -> int:
        """Retorna el total de factores asociados."""
        return obj.factores.count()

    def get_total_estrategias(self, obj) -> int:
        """Retorna el total de estrategias asociadas."""
        return obj.estrategias.count()


class EstrategiaTOWSSerializer(serializers.ModelSerializer):
    """Serializer para EstrategiaTOWS."""

    # Relación con Area responsable
    area_responsable = AreaLightSerializer(read_only=True)
    area_responsable_id = serializers.PrimaryKeyRelatedField(
        queryset=Area.objects.filter(is_active=True),
        source='area_responsable',
        write_only=True,
        required=False,
        allow_null=True
    )

    # Display fields
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    # Responsable ahora es FK a Cargo (más estable organizacionalmente)
    responsable_name = serializers.CharField(source='responsable.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    # Computed fields
    dias_restantes = serializers.SerializerMethodField()

    class Meta:
        model = EstrategiaTOWS
        fields = [
            'id', 'analisis', 'tipo', 'tipo_display', 'descripcion', 'objetivo',
            'responsable', 'responsable_name',
            'area_responsable', 'area_responsable_id',
            'fecha_implementacion', 'fecha_limite',
            'prioridad', 'prioridad_display', 'estado', 'estado_display',
            'recursos_necesarios', 'indicadores_exito', 'progreso_porcentaje',
            'is_active', 'empresa', 'created_at', 'updated_at',
            'created_by', 'created_by_name', 'dias_restantes'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']

    def get_dias_restantes(self, obj) -> int | None:
        """Calcula los días restantes hasta la fecha límite."""
        if obj.fecha_limite:
            from datetime import date
            delta = obj.fecha_limite - date.today()
            return delta.days
        return None


class FactorPESTELSerializer(serializers.ModelSerializer):
    """Serializer para FactorPESTEL."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    tendencia_display = serializers.CharField(source='get_tendencia_display', read_only=True)
    impacto_display = serializers.CharField(source='get_impacto_display', read_only=True)
    probabilidad_display = serializers.CharField(source='get_probabilidad_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = FactorPESTEL
        fields = [
            'id', 'analisis', 'tipo', 'tipo_display', 'descripcion',
            'tendencia', 'tendencia_display', 'impacto', 'impacto_display',
            'probabilidad', 'probabilidad_display', 'implicaciones', 'fuentes',
            'orden', 'empresa', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']


class TipoAnalisisPESTELSerializer(serializers.ModelSerializer):
    """Serializer para TipoAnalisisPESTEL (catálogo global)."""

    class Meta:
        model = TipoAnalisisPESTEL
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'icono', 'color', 'orden', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AnalisisPESTELSerializer(serializers.ModelSerializer):
    """Serializer para AnalisisPESTEL."""

    # Tipo de análisis (catálogo global)
    tipo_analisis_nombre = serializers.CharField(source='tipo_analisis.nombre', read_only=True)
    tipo_analisis_codigo = serializers.CharField(source='tipo_analisis.codigo', read_only=True)
    tipo_analisis_icono = serializers.CharField(source='tipo_analisis.icono', read_only=True)
    tipo_analisis_color = serializers.CharField(source='tipo_analisis.color', read_only=True)

    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    # Responsable ahora es FK a Cargo (más estable organizacionalmente)
    responsable_nombre = serializers.CharField(source='responsable.name', read_only=True)
    factores = FactorPESTELSerializer(many=True, read_only=True)
    total_factores = serializers.SerializerMethodField()
    distribucion_factores = serializers.SerializerMethodField()

    class Meta:
        model = AnalisisPESTEL
        fields = [
            'id', 'tipo_analisis', 'tipo_analisis_nombre', 'tipo_analisis_codigo',
            'tipo_analisis_icono', 'tipo_analisis_color',
            'nombre', 'fecha_analisis', 'periodo', 'responsable',
            'responsable_nombre', 'estado', 'estado_display', 'conclusiones',
            'empresa', 'created_at', 'updated_at', 'created_by',
            'factores', 'total_factores', 'distribucion_factores'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']

    def get_total_factores(self, obj) -> int:
        """Retorna el total de factores asociados."""
        return obj.factores.count()

    def get_distribucion_factores(self, obj) -> dict:
        """Retorna la distribución de factores por tipo."""
        from django.db.models import Count
        distribucion = obj.factores.values('tipo').annotate(
            total=Count('id')
        ).order_by('tipo')
        return {item['tipo']: item['total'] for item in distribucion}


class FuerzaPorterSerializer(serializers.ModelSerializer):
    """Serializer para FuerzaPorter."""

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_factores = serializers.SerializerMethodField()

    class Meta:
        model = FuerzaPorter
        fields = [
            'id', 'tipo', 'tipo_display', 'nivel', 'nivel_display',
            'descripcion', 'factores', 'fecha_analisis', 'periodo',
            'implicaciones_estrategicas', 'empresa', 'created_at',
            'updated_at', 'created_by', 'created_by_name', 'total_factores'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']

    def get_total_factores(self, obj) -> int:
        """Retorna el total de factores en el campo JSON."""
        if isinstance(obj.factores, list):
            return len(obj.factores)
        return 0


# ============================================================================
# SERIALIZERS PARTES INTERESADAS (Stakeholders)
# ============================================================================

class GrupoParteInteresadaSerializer(serializers.ModelSerializer):
    """
    Serializer para GrupoParteInteresada (Sprint 17).

    Catálogo de grupos macro de partes interesadas.
    """

    class Meta:
        model = GrupoParteInteresada
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'icono', 'color', 'orden', 'es_sistema',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TipoParteInteresadaSerializer(serializers.ModelSerializer):
    """
    Serializer para TipoParteInteresada (actualizado Sprint 17).

    Ahora incluye relación con GrupoParteInteresada.
    """

    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    # NUEVO: Grupo relacionado (Sprint 17)
    grupo_nombre = serializers.CharField(source='grupo.nombre', read_only=True)
    grupo_codigo = serializers.CharField(source='grupo.codigo', read_only=True)
    grupo_icono = serializers.CharField(source='grupo.icono', read_only=True)
    grupo_color = serializers.CharField(source='grupo.color', read_only=True)

    class Meta:
        model = TipoParteInteresada
        fields = [
            'id', 'codigo', 'nombre',
            'grupo', 'grupo_nombre', 'grupo_codigo', 'grupo_icono', 'grupo_color',
            'categoria', 'categoria_display',
            'descripcion', 'orden', 'es_sistema',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ParteInteresadaSerializer(serializers.ModelSerializer):
    """
    Serializer para ParteInteresada (actualizado Sprint 17).

    CAMBIOS SPRINT 17:
    - Responsable en la empresa (Colaborador/Cargo/Área)
    - Impacto bidireccional (PI→Empresa + Empresa→PI)
    - Temas de interés bidireccionales
    - Grupo del tipo (jerarquía)

    Incluye campos de:
    - Información básica y de contacto
    - Matriz poder-interés (MEJORADA)
    - Comunicación (canal y frecuencia)
    - ISO 9001:2015 Cláusula 4.2 (necesidades, expectativas, requisitos)
    - Sistemas de gestión relacionados (dinámico desde NormaISO)
    """

    # Tipo y Grupo relacionados (Sprint 17 - jerarquía)
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    tipo_categoria = serializers.CharField(source='tipo.categoria', read_only=True)
    grupo_nombre = serializers.CharField(source='tipo.grupo.nombre', read_only=True, allow_null=True)
    grupo_codigo = serializers.CharField(source='tipo.grupo.codigo', read_only=True, allow_null=True)
    grupo_icono = serializers.CharField(source='tipo.grupo.icono', read_only=True, allow_null=True)
    grupo_color = serializers.CharField(source='tipo.grupo.color', read_only=True, allow_null=True)

    # Display fields (Sprint 17 - actualizados)
    nivel_influencia_pi_display = serializers.CharField(source='get_nivel_influencia_pi_display', read_only=True)
    nivel_influencia_empresa_display = serializers.CharField(source='get_nivel_influencia_empresa_display', read_only=True)
    nivel_interes_display = serializers.CharField(source='get_nivel_interes_display', read_only=True)
    canal_principal_display = serializers.CharField(source='get_canal_principal_display', read_only=True)
    frecuencia_comunicacion_display = serializers.CharField(source='get_frecuencia_comunicacion_display', read_only=True)

    # responsable_empresa_nombre viene del modelo directamente (campo cache — Sprint M1)
    cargo_responsable_nombre = serializers.CharField(
        source='cargo_responsable.name',
        read_only=True,
        allow_null=True
    )
    area_responsable_nombre = serializers.CharField(
        source='area_responsable.nombre',
        read_only=True,
        allow_null=True
    )

    # Computed fields
    cuadrante_matriz = serializers.CharField(read_only=True)

    # Normas relacionadas (M2M dinámico)
    normas_relacionadas_detail = serializers.SerializerMethodField()

    # Auditoría
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ParteInteresada
        fields = [
            # Identificación
            'id', 'tipo', 'tipo_nombre', 'tipo_categoria',
            'grupo_nombre', 'grupo_codigo', 'grupo_icono', 'grupo_color',  # NUEVO (Sprint 17)
            'nombre', 'descripcion',
            # Contacto PI
            'representante', 'cargo_representante',
            'telefono', 'email', 'direccion', 'sitio_web',
            # Responsables en la Empresa (NUEVO - Sprint 17)
            'responsable_empresa_id', 'responsable_empresa_nombre',
            'cargo_responsable', 'cargo_responsable_nombre',
            'area_responsable', 'area_responsable_nombre',
            # Matriz poder-interés (MEJORADO - Sprint 17)
            'nivel_influencia_pi', 'nivel_influencia_pi_display',  # Renombrado
            'nivel_influencia_empresa', 'nivel_influencia_empresa_display',  # NUEVO
            'nivel_interes', 'nivel_interes_display',
            'cuadrante_matriz',
            # Temas de Interés (NUEVO - Sprint 17)
            'temas_interes_pi', 'temas_interes_empresa',
            # Comunicación
            'canal_principal', 'canal_principal_display',
            'canales_adicionales',
            'frecuencia_comunicacion', 'frecuencia_comunicacion_display',
            # ISO 9001:2015 Cláusula 4.2
            'necesidades', 'expectativas', 'requisitos_pertinentes', 'es_requisito_legal',
            # Sistemas de gestión relacionados - Legacy (deprecados)
            'relacionado_sst', 'relacionado_ambiental',
            'relacionado_calidad', 'relacionado_pesv',
            # Sistemas de gestión relacionados - Dinámico
            'normas_relacionadas', 'normas_relacionadas_detail',
            # Auditoría
            'empresa', 'is_active', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']

    def get_normas_relacionadas_detail(self, obj):
        """Retorna detalles de las normas relacionadas."""
        return [
            {
                'id': norma.id,
                'code': norma.code,
                'name': norma.name,
                'short_name': norma.short_name,
                'icon': norma.icon,
                'color': norma.color,
            }
            for norma in obj.normas_relacionadas.all()
        ]


class RequisitoParteInteresadaSerializer(serializers.ModelSerializer):
    """Serializer para RequisitoParteInteresada."""

    # Display fields
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    parte_interesada_nombre = serializers.CharField(source='parte_interesada.nombre', read_only=True)

    # Auditoría
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = RequisitoParteInteresada
        fields = [
            'id', 'parte_interesada', 'parte_interesada_nombre',
            'tipo', 'tipo_display', 'descripcion',
            'prioridad', 'prioridad_display',
            'como_se_aborda', 'proceso_relacionado', 'indicador_seguimiento',
            'cumple', 'evidencia_cumplimiento', 'fecha_ultima_revision',
            'empresa', 'is_active', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']


class MatrizComunicacionSerializer(serializers.ModelSerializer):
    """
    Serializer para MatrizComunicacion.

    ISO 9001:2015 Cláusula 7.4 - Comunicación
    Ahora usa FK a Cargo (más estable) y M2M con NormaISO (dinámico).
    """

    # Display fields
    parte_interesada_nombre = serializers.CharField(source='parte_interesada.nombre', read_only=True)
    cuando_display = serializers.CharField(source='get_cuando_comunicar_display', read_only=True)
    como_display = serializers.CharField(source='get_como_comunicar_display', read_only=True)
    # Responsable ahora es FK a Cargo
    responsable_nombre = serializers.CharField(source='responsable.name', read_only=True)

    # Normas aplicables (M2M dinámico)
    normas_aplicables_lista = serializers.SerializerMethodField()

    # Auditoría
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = MatrizComunicacion
        fields = [
            'id', 'parte_interesada', 'parte_interesada_nombre',
            'que_comunicar', 'cuando_comunicar', 'cuando_display',
            'como_comunicar', 'como_display',
            'responsable', 'responsable_nombre', 'registro_evidencia',
            # Campos nuevos
            'normas_aplicables', 'normas_aplicables_lista',
            'es_obligatoria', 'observaciones',
            # Auditoría
            'empresa', 'is_active', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']

    def get_normas_aplicables_lista(self, obj) -> list:
        """Retorna lista de normas aplicables con código y nombre."""
        return list(obj.normas_aplicables.values('id', 'code', 'name'))
