"""
Serializers para riesgos_viales - PESV (Plan Estratégico de Seguridad Vial)
Basado en Resolución 40595/2022 - Ministerio de Transporte de Colombia
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    TipoRiesgoVial,
    RiesgoVial,
    ControlVial,
    IncidenteVial,
    InspeccionVehiculo
)

User = get_user_model()


# ==================== TIPO RIESGO VIAL SERIALIZERS ====================

class TipoRiesgoVialSerializer(serializers.ModelSerializer):
    """
    Serializer para catálogo de tipos de riesgos viales
    """
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)

    class Meta:
        model = TipoRiesgoVial
        fields = [
            'id',
            'codigo',
            'categoria',
            'categoria_display',
            'nombre',
            'descripcion',
            'consecuencias_posibles',
            'marco_legal',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_codigo(self, value):
        """Validar código único"""
        value = value.upper()
        instance_id = self.instance.id if self.instance else None

        if TipoRiesgoVial.objects.filter(codigo=value).exclude(id=instance_id).exists():
            raise serializers.ValidationError('Ya existe un tipo de riesgo con este código')

        return value


# ==================== RIESGO VIAL SERIALIZERS ====================

class RiesgoVialListSerializer(serializers.ModelSerializer):
    """
    Serializer para listado de riesgos viales
    """
    tipo_riesgo_nombre = serializers.CharField(source='tipo_riesgo.nombre', read_only=True)
    tipo_riesgo_categoria = serializers.CharField(source='tipo_riesgo.get_categoria_display', read_only=True)
    nivel_riesgo_display = serializers.CharField(source='get_nivel_riesgo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    # Propiedades calculadas
    requiere_accion_inmediata = serializers.BooleanField(read_only=True)
    porcentaje_reduccion = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = RiesgoVial
        fields = [
            'id',
            'codigo',
            'tipo_riesgo',
            'tipo_riesgo_nombre',
            'tipo_riesgo_categoria',
            'descripcion',
            'proceso_afectado',
            'tipo_vehiculo',
            # Evaluación inherente
            'frecuencia',
            'probabilidad',
            'severidad',
            'valoracion_riesgo',
            'nivel_riesgo',
            'nivel_riesgo_display',
            # Evaluación residual
            'nivel_residual',
            'porcentaje_reduccion',
            # Responsable y estado
            'responsable',
            'responsable_nombre',
            'estado',
            'estado_display',
            'fecha_identificacion',
            'fecha_revision',
            # Propiedades
            'requiere_accion_inmediata',
            # Auditoría
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]


class RiesgoVialDetailSerializer(serializers.ModelSerializer):
    """
    Serializer para detalle completo de riesgo vial
    """
    tipo_riesgo_data = TipoRiesgoVialSerializer(source='tipo_riesgo', read_only=True)
    nivel_riesgo_display = serializers.CharField(source='get_nivel_riesgo_display', read_only=True)
    nivel_residual_display = serializers.CharField(source='get_nivel_residual_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    efectividad_controles_display = serializers.CharField(source='get_efectividad_controles_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    # Propiedades calculadas
    requiere_accion_inmediata = serializers.BooleanField(read_only=True)
    porcentaje_reduccion = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = RiesgoVial
        fields = '__all__'
        read_only_fields = [
            'valoracion_riesgo',
            'nivel_riesgo',
            'valoracion_residual',
            'nivel_residual',
            'created_at',
            'updated_at',
        ]


class RiesgoVialCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar riesgos viales
    """

    class Meta:
        model = RiesgoVial
        fields = [
            'codigo',
            'tipo_riesgo',
            'descripcion',
            'proceso_afectado',
            'rutas_afectadas',
            'tipo_vehiculo',
            # Evaluación inherente
            'frecuencia',
            'probabilidad',
            'severidad',
            # Controles
            'controles_actuales',
            'efectividad_controles',
            # Evaluación residual
            'frecuencia_residual',
            'probabilidad_residual',
            'severidad_residual',
            # Responsable y estado
            'responsable',
            'estado',
            'fecha_identificacion',
            'fecha_evaluacion',
            'fecha_revision',
            'observaciones',
            'empresa_id',
        ]

    def validate(self, attrs):
        """Validaciones cruzadas"""
        # Validar que código sea único dentro de la empresa
        codigo = attrs.get('codigo')
        empresa_id = attrs.get('empresa_id')

        if codigo and empresa_id:
            instance_id = self.instance.id if self.instance else None
            if RiesgoVial.objects.filter(
                empresa_id=empresa_id,
                codigo=codigo
            ).exclude(id=instance_id).exists():
                raise serializers.ValidationError({
                    'codigo': 'Ya existe un riesgo vial con este código en la empresa'
                })

        # Validar evaluación residual completa o ninguna
        residual_fields = [
            attrs.get('frecuencia_residual'),
            attrs.get('probabilidad_residual'),
            attrs.get('severidad_residual')
        ]

        residual_count = sum(1 for field in residual_fields if field is not None)
        if 0 < residual_count < 3:
            raise serializers.ValidationError(
                'Debe completar toda la evaluación residual (frecuencia, probabilidad y severidad) o dejarla vacía'
            )

        return attrs

    def create(self, validated_data):
        """Crear riesgo vial con usuario creador"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        return RiesgoVial.objects.create(**validated_data)


# ==================== CONTROL VIAL SERIALIZERS ====================

class ControlVialListSerializer(serializers.ModelSerializer):
    """
    Serializer para listado de controles viales
    """
    riesgo_vial_codigo = serializers.CharField(source='riesgo_vial.codigo', read_only=True)
    riesgo_vial_descripcion = serializers.CharField(source='riesgo_vial.descripcion', read_only=True)
    tipo_control_display = serializers.CharField(source='get_tipo_control_display', read_only=True)
    momento_aplicacion_display = serializers.CharField(source='get_momento_aplicacion_display', read_only=True)
    jerarquia_display = serializers.CharField(source='get_jerarquia_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    # Propiedad calculada
    esta_atrasado = serializers.BooleanField(read_only=True)

    class Meta:
        model = ControlVial
        fields = [
            'id',
            'riesgo_vial',
            'riesgo_vial_codigo',
            'riesgo_vial_descripcion',
            'codigo',
            'nombre',
            'descripcion',
            'tipo_control',
            'tipo_control_display',
            'momento_aplicacion',
            'momento_aplicacion_display',
            'jerarquia',
            'jerarquia_display',
            'responsable',
            'responsable_nombre',
            'area_responsable',
            'estado',
            'estado_display',
            'fecha_propuesta',
            'fecha_implementacion_programada',
            'fecha_implementacion_real',
            'costo_estimado',
            'costo_real',
            'efectividad_verificada',
            'esta_atrasado',
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]


class ControlVialDetailSerializer(serializers.ModelSerializer):
    """
    Serializer para detalle completo de control vial
    """
    riesgo_vial_data = RiesgoVialListSerializer(source='riesgo_vial', read_only=True)
    tipo_control_display = serializers.CharField(source='get_tipo_control_display', read_only=True)
    momento_aplicacion_display = serializers.CharField(source='get_momento_aplicacion_display', read_only=True)
    jerarquia_display = serializers.CharField(source='get_jerarquia_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    esta_atrasado = serializers.BooleanField(read_only=True)

    class Meta:
        model = ControlVial
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ControlVialCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar controles viales
    """

    class Meta:
        model = ControlVial
        fields = [
            'riesgo_vial',
            'codigo',
            'nombre',
            'descripcion',
            'tipo_control',
            'momento_aplicacion',
            'jerarquia',
            'responsable',
            'area_responsable',
            'fecha_propuesta',
            'fecha_implementacion_programada',
            'fecha_implementacion_real',
            'estado',
            'costo_estimado',
            'costo_real',
            'recursos_necesarios',
            'indicador_efectividad',
            'efectividad_verificada',
            'fecha_verificacion',
            'resultado_verificacion',
            'documentos_soporte',
            'evidencias',
            'observaciones',
            'empresa_id',
        ]

    def validate(self, attrs):
        """Validaciones cruzadas"""
        # Validar código único dentro de la empresa
        codigo = attrs.get('codigo')
        empresa_id = attrs.get('empresa_id')

        if codigo and empresa_id:
            instance_id = self.instance.id if self.instance else None
            if ControlVial.objects.filter(
                empresa_id=empresa_id,
                codigo=codigo
            ).exclude(id=instance_id).exists():
                raise serializers.ValidationError({
                    'codigo': 'Ya existe un control vial con este código en la empresa'
                })

        # Validar fechas
        fecha_propuesta = attrs.get('fecha_propuesta', self.instance.fecha_propuesta if self.instance else None)
        fecha_implementacion_programada = attrs.get('fecha_implementacion_programada')
        fecha_implementacion_real = attrs.get('fecha_implementacion_real')

        if fecha_implementacion_programada and fecha_propuesta:
            if fecha_implementacion_programada < fecha_propuesta:
                raise serializers.ValidationError({
                    'fecha_implementacion_programada': 'No puede ser anterior a la fecha de propuesta'
                })

        if fecha_implementacion_real and fecha_propuesta:
            if fecha_implementacion_real < fecha_propuesta:
                raise serializers.ValidationError({
                    'fecha_implementacion_real': 'No puede ser anterior a la fecha de propuesta'
                })

        return attrs

    def create(self, validated_data):
        """Crear control vial con usuario creador"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        return ControlVial.objects.create(**validated_data)


# ==================== INCIDENTE VIAL SERIALIZERS ====================

class IncidenteVialListSerializer(serializers.ModelSerializer):
    """
    Serializer para listado de incidentes viales
    """
    tipo_incidente_display = serializers.CharField(source='get_tipo_incidente_display', read_only=True)
    gravedad_display = serializers.CharField(source='get_gravedad_display', read_only=True)
    estado_investigacion_display = serializers.CharField(source='get_estado_investigacion_display', read_only=True)
    investigador_nombre = serializers.CharField(source='investigador.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    # Propiedades calculadas
    es_accidente_grave = serializers.BooleanField(read_only=True)
    dias_investigacion_abierta = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = IncidenteVial
        fields = [
            'id',
            'numero_incidente',
            'tipo_incidente',
            'tipo_incidente_display',
            'gravedad',
            'gravedad_display',
            'fecha_incidente',
            'ubicacion',
            'municipio',
            'departamento',
            'conductor_nombre',
            'conductor_identificacion',
            'vehiculo_placa',
            'vehiculo_tipo',
            'numero_lesionados',
            'numero_fallecidos',
            'costo_estimado_daños',
            'autoridades_notificadas',
            'estado_investigacion',
            'estado_investigacion_display',
            'investigador',
            'investigador_nombre',
            'fecha_inicio_investigacion',
            'fecha_cierre_investigacion',
            'es_accidente_grave',
            'dias_investigacion_abierta',
            'created_by_nombre',
            'created_at',
            'updated_at',
        ]


class IncidenteVialDetailSerializer(serializers.ModelSerializer):
    """
    Serializer para detalle completo de incidente vial
    """
    tipo_incidente_display = serializers.CharField(source='get_tipo_incidente_display', read_only=True)
    gravedad_display = serializers.CharField(source='get_gravedad_display', read_only=True)
    estado_investigacion_display = serializers.CharField(source='get_estado_investigacion_display', read_only=True)
    investigador_nombre = serializers.CharField(source='investigador.get_full_name', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)

    # Riesgos relacionados
    riesgos_relacionados_data = RiesgoVialListSerializer(
        source='riesgos_relacionados',
        many=True,
        read_only=True
    )

    # Propiedades calculadas
    es_accidente_grave = serializers.BooleanField(read_only=True)
    dias_investigacion_abierta = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = IncidenteVial
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class IncidenteVialCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar incidentes viales
    """

    class Meta:
        model = IncidenteVial
        fields = [
            'numero_incidente',
            'tipo_incidente',
            'gravedad',
            'fecha_incidente',
            'ubicacion',
            'municipio',
            'departamento',
            'coordenadas',
            # Involucrados
            'conductor_nombre',
            'conductor_identificacion',
            'conductor_licencia',
            'vehiculo_placa',
            'vehiculo_tipo',
            # Descripción
            'descripcion_hechos',
            'condiciones_climaticas',
            'condiciones_via',
            'condiciones_vehiculo',
            # Consecuencias
            'numero_lesionados',
            'numero_fallecidos',
            'descripcion_lesiones',
            # Daños
            'daños_vehiculo_propio',
            'daños_terceros',
            'costo_estimado_daños',
            # Autoridades
            'autoridades_notificadas',
            'numero_informe_policial',
            'comparendo_numero',
            # Investigación
            'estado_investigacion',
            'investigador',
            'fecha_inicio_investigacion',
            'fecha_cierre_investigacion',
            'causas_inmediatas',
            'causas_basicas',
            'causas_raiz',
            # Relaciones
            'riesgos_relacionados',
            # Lecciones
            'lecciones_aprendidas',
            'acciones_correctivas',
            # Evidencias
            'evidencias_fotograficas',
            'documentos_adjuntos',
            'empresa_id',
        ]

    def validate(self, attrs):
        """Validaciones cruzadas"""
        # Validar número único dentro de la empresa
        numero_incidente = attrs.get('numero_incidente')
        empresa_id = attrs.get('empresa_id')

        if numero_incidente and empresa_id:
            instance_id = self.instance.id if self.instance else None
            if IncidenteVial.objects.filter(
                empresa_id=empresa_id,
                numero_incidente=numero_incidente
            ).exclude(id=instance_id).exists():
                raise serializers.ValidationError({
                    'numero_incidente': 'Ya existe un incidente vial con este número en la empresa'
                })

        # Validar fechas de investigación
        fecha_inicio = attrs.get('fecha_inicio_investigacion')
        fecha_cierre = attrs.get('fecha_cierre_investigacion')
        fecha_incidente = attrs.get('fecha_incidente', self.instance.fecha_incidente if self.instance else None)

        if fecha_inicio and fecha_incidente:
            if fecha_inicio.date() < fecha_incidente.date():
                raise serializers.ValidationError({
                    'fecha_inicio_investigacion': 'No puede ser anterior a la fecha del incidente'
                })

        if fecha_cierre and fecha_inicio:
            if fecha_cierre < fecha_inicio:
                raise serializers.ValidationError({
                    'fecha_cierre_investigacion': 'No puede ser anterior a la fecha de inicio de investigación'
                })

        # Validar datos de lesiones
        numero_lesionados = attrs.get('numero_lesionados', 0)
        numero_fallecidos = attrs.get('numero_fallecidos', 0)
        gravedad = attrs.get('gravedad')

        if numero_fallecidos > 0 and gravedad != 'FATAL':
            raise serializers.ValidationError({
                'gravedad': 'Si hay fallecidos, la gravedad debe ser FATAL'
            })

        if numero_lesionados > 0 and gravedad == 'SOLO_DAÑOS':
            raise serializers.ValidationError({
                'gravedad': 'Si hay lesionados, la gravedad no puede ser SOLO_DAÑOS'
            })

        return attrs

    def create(self, validated_data):
        """Crear incidente vial con usuario creador"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        # Extraer riesgos relacionados (ManyToMany)
        riesgos_relacionados = validated_data.pop('riesgos_relacionados', [])

        incidente = IncidenteVial.objects.create(**validated_data)

        if riesgos_relacionados:
            incidente.riesgos_relacionados.set(riesgos_relacionados)

        return incidente

    def update(self, instance, validated_data):
        """Actualizar incidente vial"""
        # Extraer riesgos relacionados si están presentes
        riesgos_relacionados = validated_data.pop('riesgos_relacionados', None)

        # Actualizar campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Actualizar riesgos relacionados si se proporcionaron
        if riesgos_relacionados is not None:
            instance.riesgos_relacionados.set(riesgos_relacionados)

        return instance


# ==================== INSPECCIÓN VEHÍCULO SERIALIZERS ====================

class InspeccionVehiculoListSerializer(serializers.ModelSerializer):
    """
    Serializer para listado de inspecciones de vehículos
    """
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    inspeccion_confirmada_por_nombre = serializers.CharField(
        source='inspeccion_confirmada_por.get_full_name',
        read_only=True
    )

    # Propiedad calculada
    porcentaje_conformidad = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = InspeccionVehiculo
        fields = [
            'id',
            'numero_inspeccion',
            'fecha_inspeccion',
            'vehiculo_placa',
            'vehiculo_tipo',
            'conductor_nombre',
            'conductor_identificacion',
            'odometro',
            'resultado',
            'resultado_display',
            'observaciones',
            'requiere_mantenimiento',
            'fecha_mantenimiento_programado',
            'mantenimiento_completado',
            'porcentaje_conformidad',
            'created_by_nombre',
            'inspeccion_confirmada_por_nombre',
            'fecha_confirmacion',
            'created_at',
        ]


class InspeccionVehiculoDetailSerializer(serializers.ModelSerializer):
    """
    Serializer para detalle completo de inspección de vehículo
    """
    resultado_display = serializers.CharField(source='get_resultado_display', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    inspeccion_confirmada_por_nombre = serializers.CharField(
        source='inspeccion_confirmada_por.get_full_name',
        read_only=True
    )

    porcentaje_conformidad = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = InspeccionVehiculo
        fields = '__all__'
        read_only_fields = ['fecha_inspeccion', 'resultado', 'created_at', 'updated_at']


class InspeccionVehiculoCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear inspecciones de vehículos
    El resultado se calcula automáticamente según el checklist
    """

    class Meta:
        model = InspeccionVehiculo
        fields = [
            'numero_inspeccion',
            'vehiculo_placa',
            'vehiculo_tipo',
            'conductor_nombre',
            'conductor_identificacion',
            'odometro',
            # Checklist completo
            'estado_carroceria',
            'limpieza_vehiculo',
            'luces_delanteras',
            'luces_traseras',
            'luces_direccionales',
            'luces_freno',
            'luces_emergencia',
            'espejo_retrovisor_int',
            'espejo_lateral_izq',
            'espejo_lateral_der',
            'estado_llantas',
            'llanta_repuesto',
            'freno_servicio',
            'freno_emergencia',
            'sistema_direccion',
            'sistema_suspension',
            'nivel_aceite_motor',
            'nivel_refrigerante',
            'nivel_liquido_frenos',
            'nivel_liquido_direccion',
            'limpiabrisas',
            'parabrisas',
            'cinturones_seguridad',
            'bocina',
            'alarma_reversa',
            'extintor',
            'botiquin',
            'kit_carretera',
            'chaleco_reflectivo',
            'soat_vigente',
            'revision_tecnomecanica',
            'tarjeta_propiedad',
            # Observaciones
            'observaciones',
            'items_rechazados',
            'empresa_id',
        ]

    def validate(self, attrs):
        """Validaciones cruzadas"""
        # Validar número único dentro de la empresa
        numero_inspeccion = attrs.get('numero_inspeccion')
        empresa_id = attrs.get('empresa_id')

        if numero_inspeccion and empresa_id:
            if InspeccionVehiculo.objects.filter(
                empresa_id=empresa_id,
                numero_inspeccion=numero_inspeccion
            ).exists():
                raise serializers.ValidationError({
                    'numero_inspeccion': 'Ya existe una inspección con este número en la empresa'
                })

        return attrs

    def create(self, validated_data):
        """Crear inspección con usuario creador"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        # El modelo calculará automáticamente el resultado en el método save()
        return InspeccionVehiculo.objects.create(**validated_data)
