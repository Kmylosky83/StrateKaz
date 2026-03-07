"""
Serializers para Gestión de Proyectos (PMI)
"""
from rest_framework import serializers
from .models import (
    Portafolio, Programa, Proyecto, ProjectCharter,
    InteresadoProyecto, FaseProyecto, ActividadProyecto,
    RecursoProyecto, RiesgoProyecto, SeguimientoProyecto,
    LeccionAprendida, ActaCierre
)


class PortafolioSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name', read_only=True
    )
    codigo = serializers.CharField(required=False, allow_blank=True, default='')
    total_programas = serializers.SerializerMethodField()
    total_proyectos = serializers.SerializerMethodField()

    class Meta:
        model = Portafolio
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'empresa']

    def get_validators(self):
        return [
            v for v in super().get_validators()
            if not (hasattr(v, 'fields') and set(v.fields) == {'empresa', 'codigo'})
        ]

    def get_total_programas(self, obj):
        return obj.programas.filter(is_active=True).count()

    def get_total_proyectos(self, obj):
        return sum(p.proyectos.filter(is_active=True).count() for p in obj.programas.all())


class ProgramaSerializer(serializers.ModelSerializer):
    portafolio_nombre = serializers.CharField(
        source='portafolio.nombre', read_only=True
    )
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name', read_only=True
    )
    codigo = serializers.CharField(required=False, allow_blank=True, default='')
    total_proyectos = serializers.SerializerMethodField()

    class Meta:
        model = Programa
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'empresa']

    def get_validators(self):
        return [
            v for v in super().get_validators()
            if not (hasattr(v, 'fields') and set(v.fields) == {'empresa', 'codigo'})
        ]

    def get_total_proyectos(self, obj):
        return obj.proyectos.filter(is_active=True).count()


class ProyectoListSerializer(serializers.ModelSerializer):
    """Serializer ligero para listados"""
    programa_nombre = serializers.CharField(
        source='programa.nombre', read_only=True
    )
    gerente_nombre = serializers.CharField(
        source='gerente_proyecto.get_full_name', read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    tipo_origen_display = serializers.CharField(source='get_tipo_origen_display', read_only=True)

    class Meta:
        model = Proyecto
        fields = [
            'id', 'codigo', 'nombre', 'tipo', 'tipo_display',
            'estado', 'estado_display', 'prioridad', 'prioridad_display',
            'programa', 'programa_nombre', 'gerente_proyecto', 'gerente_nombre',
            'fecha_inicio_plan', 'fecha_fin_plan', 'porcentaje_avance',
            'presupuesto_aprobado', 'costo_real', 'is_active',
            'tipo_origen', 'tipo_origen_display', 'origen_cambio', 'origen_objetivo'
        ]


class ProjectCharterSerializer(serializers.ModelSerializer):
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name', read_only=True
    )

    class Meta:
        model = ProjectCharter
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class InteresadoProyectoSerializer(serializers.ModelSerializer):
    nivel_interes_display = serializers.CharField(
        source='get_nivel_interes_display', read_only=True
    )
    nivel_influencia_display = serializers.CharField(
        source='get_nivel_influencia_display', read_only=True
    )

    class Meta:
        model = InteresadoProyecto
        fields = '__all__'
        read_only_fields = ['created_at']


class FaseProyectoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaseProyecto
        fields = '__all__'
        read_only_fields = ['created_at']


class ActividadProyectoSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name', read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    fase_nombre = serializers.CharField(source='fase.nombre', read_only=True)
    kanban_column_display = serializers.CharField(
        source='get_kanban_column_display', read_only=True
    )

    class Meta:
        model = ActividadProyecto
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class RecursoProyectoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    usuario_nombre = serializers.CharField(
        source='usuario.get_full_name', read_only=True
    )

    class Meta:
        model = RecursoProyecto
        fields = '__all__'
        read_only_fields = ['created_at', 'costo_total']


class RiesgoProyectoSerializer(serializers.ModelSerializer):
    probabilidad_display = serializers.CharField(
        source='get_probabilidad_display', read_only=True
    )
    impacto_display = serializers.CharField(source='get_impacto_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    nivel_riesgo = serializers.IntegerField(read_only=True)
    responsable_nombre = serializers.CharField(
        source='responsable.get_full_name', read_only=True
    )

    class Meta:
        model = RiesgoProyecto
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'fecha_identificacion']


class SeguimientoProyectoSerializer(serializers.ModelSerializer):
    registrado_por_nombre = serializers.CharField(
        source='registrado_por.get_full_name', read_only=True
    )
    spi = serializers.FloatField(read_only=True)
    cpi = serializers.FloatField(read_only=True)

    class Meta:
        model = SeguimientoProyecto
        fields = '__all__'
        read_only_fields = ['created_at']


class LeccionAprendidaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    registrado_por_nombre = serializers.CharField(
        source='registrado_por.get_full_name', read_only=True
    )

    class Meta:
        model = LeccionAprendida
        fields = '__all__'
        read_only_fields = ['created_at', 'fecha_registro']


class ActaCierreSerializer(serializers.ModelSerializer):
    proyecto_codigo = serializers.CharField(source='proyecto.codigo', read_only=True)
    proyecto_nombre = serializers.CharField(source='proyecto.nombre', read_only=True)
    aprobado_por_nombre = serializers.CharField(
        source='aprobado_por.get_full_name', read_only=True
    )

    class Meta:
        model = ActaCierre
        fields = '__all__'
        read_only_fields = ['created_at', 'variacion_presupuesto']


class ProyectoSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle del proyecto"""
    programa_nombre = serializers.CharField(source='programa.nombre', read_only=True)
    sponsor_nombre = serializers.CharField(
        source='sponsor.get_full_name', read_only=True
    )
    gerente_nombre = serializers.CharField(
        source='gerente_proyecto.get_full_name', read_only=True
    )
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)

    # Origen del proyecto (trazabilidad PMI/ISO)
    tipo_origen_display = serializers.CharField(source='get_tipo_origen_display', read_only=True)
    origen_cambio_titulo = serializers.CharField(source='origen_cambio.titulo', read_only=True)
    origen_objetivo_nombre = serializers.CharField(source='origen_objetivo.name', read_only=True)

    # Relaciones anidadas
    charter = ProjectCharterSerializer(read_only=True)
    variacion_costo = serializers.DecimalField(
        max_digits=18, decimal_places=2, read_only=True
    )
    indice_desempeno_costo = serializers.FloatField(read_only=True)

    # Conteos
    total_actividades = serializers.SerializerMethodField()
    total_riesgos = serializers.SerializerMethodField()
    total_recursos = serializers.SerializerMethodField()

    class Meta:
        model = Proyecto
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'fecha_propuesta']

    def get_total_actividades(self, obj):
        return obj.actividades.filter(is_active=True).count()

    def get_total_riesgos(self, obj):
        return obj.riesgos.filter(is_active=True).count()

    def get_total_recursos(self, obj):
        return obj.recursos.filter(is_active=True).count()


class ProyectoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar proyectos"""
    codigo = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Proyecto
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'fecha_propuesta', 'created_by', 'empresa']

    def get_validators(self):
        """Excluir UniqueTogetherValidator de (empresa, codigo) porque empresa
        es read_only y se asigna en perform_create. La unicidad se valida
        explícitamente en validate_codigo."""
        return [
            v for v in super().get_validators()
            if not (
                hasattr(v, 'fields')
                and set(v.fields) == {'empresa', 'codigo'}
            )
        ]

    def validate_codigo(self, value):
        """Valida unicidad de codigo dentro de la empresa (si se proporcionó)."""
        if not value:
            return value  # Vacío → se auto-genera en model.save()

        from apps.core.base_models.mixins import get_tenant_empresa
        empresa = get_tenant_empresa()
        if empresa:
            qs = Proyecto.objects.filter(empresa=empresa, codigo=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    f'Ya existe un proyecto con el código "{value}" en esta empresa.'
                )
        return value


class DashboardProyectosSerializer(serializers.Serializer):
    """Serializer para dashboard de proyectos"""
    total_proyectos = serializers.IntegerField()
    proyectos_por_estado = serializers.DictField()
    proyectos_por_prioridad = serializers.DictField()
    proyectos_criticos = serializers.IntegerField()
    porcentaje_avance_promedio = serializers.FloatField()
    presupuesto_total = serializers.DecimalField(max_digits=18, decimal_places=2)
    costo_total_real = serializers.DecimalField(max_digits=18, decimal_places=2)
