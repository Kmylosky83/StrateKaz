"""
Serializers para Gestión Ambiental - HSEQ Management
"""
from rest_framework import serializers
from .models import (
    TipoResiduo, GestorAmbiental, RegistroResiduo,
    Vertimiento, FuenteEmision, RegistroEmision,
    TipoRecurso, ConsumoRecurso, CalculoHuellaCarbono,
    CertificadoAmbiental
)


# ============================================================================
# RESIDUOS
# ============================================================================

class TipoResiduoSerializer(serializers.ModelSerializer):
    """Serializer para tipos de residuos"""

    class Meta:
        model = TipoResiduo
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class GestorAmbientalSerializer(serializers.ModelSerializer):
    """Serializer para gestores ambientales"""
    tipos_residuos_detalle = TipoResiduoSerializer(
        source='tipos_residuos',
        many=True,
        read_only=True
    )
    licencia_vigente = serializers.SerializerMethodField()

    class Meta:
        model = GestorAmbiental
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_licencia_vigente(self, obj):
        """Verifica si la licencia está vigente"""
        return obj.licencia_vigente


class RegistroResiduoSerializer(serializers.ModelSerializer):
    """Serializer para registro de residuos"""
    tipo_residuo_detalle = TipoResiduoSerializer(source='tipo_residuo', read_only=True)
    gestor_detalle = serializers.SerializerMethodField()
    tipo_movimiento_display = serializers.CharField(
        source='get_tipo_movimiento_display',
        read_only=True
    )

    class Meta:
        model = RegistroResiduo
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_gestor_detalle(self, obj):
        """Detalles básicos del gestor"""
        if obj.gestor:
            return {
                'id': obj.gestor.id,
                'razon_social': obj.gestor.razon_social,
                'nit': obj.gestor.nit,
                'tipo_gestor': obj.gestor.get_tipo_gestor_display()
            }
        return None


class RegistroResiduoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear registro de residuos"""

    class Meta:
        model = RegistroResiduo
        fields = [
            'empresa_id', 'fecha', 'tipo_residuo', 'tipo_movimiento',
            'cantidad', 'unidad_medida', 'area_generadora', 'gestor',
            'tratamiento_aplicado', 'numero_manifiesto',
            'certificado_disposicion', 'observaciones', 'registrado_por'
        ]

    def validate(self, data):
        """Validaciones personalizadas"""
        # Si es disposición, requiere gestor
        if data['tipo_movimiento'] == 'DISPOSICION' and not data.get('gestor'):
            raise serializers.ValidationError({
                'gestor': 'Se requiere un gestor ambiental para disposición de residuos'
            })

        # Si es residuo peligroso, requiere tratamiento
        if data['tipo_residuo'].clase == 'PELIGROSO' and not data.get('tratamiento_aplicado'):
            raise serializers.ValidationError({
                'tratamiento_aplicado': 'Se requiere especificar tratamiento para residuos peligrosos'
            })

        return data


# ============================================================================
# VERTIMIENTOS
# ============================================================================

class VertimientoSerializer(serializers.ModelSerializer):
    """Serializer para vertimientos"""
    tipo_vertimiento_display = serializers.CharField(
        source='get_tipo_vertimiento_display',
        read_only=True
    )
    cuerpo_receptor_display = serializers.CharField(
        source='get_cuerpo_receptor_display',
        read_only=True
    )

    class Meta:
        model = Vertimiento
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class VertimientoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear vertimientos con validaciones"""

    class Meta:
        model = Vertimiento
        fields = '__all__'

    def validate(self, data):
        """Validaciones de parámetros según normativa"""
        # Si es vertimiento industrial, requiere parámetros
        if data['tipo_vertimiento'] == 'INDUSTRIAL':
            parametros_requeridos = ['ph', 'dbo5_mg_l', 'dqo_mg_l', 'sst_mg_l']
            faltantes = [p for p in parametros_requeridos if not data.get(p)]

            if faltantes:
                raise serializers.ValidationError({
                    'parametros': f'Parámetros requeridos para vertimiento industrial: {", ".join(faltantes)}'
                })

        # Validar rangos de pH
        if data.get('ph'):
            if data['ph'] < 5 or data['ph'] > 9:
                data['cumple_normativa'] = False

        return data


# ============================================================================
# EMISIONES
# ============================================================================

class FuenteEmisionSerializer(serializers.ModelSerializer):
    """Serializer para fuentes de emisión"""
    tipo_fuente_display = serializers.CharField(
        source='get_tipo_fuente_display',
        read_only=True
    )

    class Meta:
        model = FuenteEmision
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class RegistroEmisionSerializer(serializers.ModelSerializer):
    """Serializer para registros de emisiones"""
    fuente_emision_detalle = FuenteEmisionSerializer(source='fuente_emision', read_only=True)

    class Meta:
        model = RegistroEmision
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


# ============================================================================
# CONSUMO DE RECURSOS
# ============================================================================

class TipoRecursoSerializer(serializers.ModelSerializer):
    """Serializer para tipos de recursos"""
    categoria_display = serializers.CharField(
        source='get_categoria_display',
        read_only=True
    )

    class Meta:
        model = TipoRecurso
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ConsumoRecursoSerializer(serializers.ModelSerializer):
    """Serializer para consumos de recursos"""
    tipo_recurso_detalle = TipoRecursoSerializer(source='tipo_recurso', read_only=True)
    periodo_display = serializers.SerializerMethodField()

    class Meta:
        model = ConsumoRecurso
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'emision_co2_kg']

    def get_periodo_display(self, obj):
        """Formato legible del período"""
        meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        return f"{meses[obj.periodo_month - 1]} {obj.periodo_year}"


class ConsumoRecursoResumenSerializer(serializers.Serializer):
    """Serializer para resumen de consumos por período"""
    periodo_year = serializers.IntegerField()
    periodo_month = serializers.IntegerField()
    tipo_recurso = serializers.CharField()
    total_consumo = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_costo = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_emision_co2 = serializers.DecimalField(max_digits=12, decimal_places=2)


# ============================================================================
# HUELLA DE CARBONO
# ============================================================================

class CalculoHuellaCarbonoSerializer(serializers.ModelSerializer):
    """Serializer para cálculo de huella de carbono"""

    class Meta:
        model = CalculoHuellaCarbono
        fields = '__all__'
        read_only_fields = [
            'created_at', 'updated_at',
            'alcance1_total', 'alcance2_total', 'alcance3_total',
            'huella_total', 'huella_neta', 'huella_per_capita'
        ]


class CalculoHuellaCarbonoDetalleSerializer(serializers.ModelSerializer):
    """Serializer detallado con desglose de alcances"""
    alcances_detalle = serializers.SerializerMethodField()
    distribucion_porcentual = serializers.SerializerMethodField()

    class Meta:
        model = CalculoHuellaCarbono
        fields = '__all__'
        read_only_fields = [
            'created_at', 'updated_at',
            'alcance1_total', 'alcance2_total', 'alcance3_total',
            'huella_total', 'huella_neta', 'huella_per_capita'
        ]

    def get_alcances_detalle(self, obj):
        """Desglose detallado de cada alcance"""
        return {
            'alcance_1': {
                'combustion_estacionaria': float(obj.alcance1_combustion_estacionaria),
                'combustion_movil': float(obj.alcance1_combustion_movil),
                'emisiones_proceso': float(obj.alcance1_emisiones_proceso),
                'emisiones_fugitivas': float(obj.alcance1_emisiones_fugitivas),
                'total': float(obj.alcance1_total)
            },
            'alcance_2': {
                'electricidad': float(obj.alcance2_electricidad),
                'vapor': float(obj.alcance2_vapor),
                'calefaccion': float(obj.alcance2_calefaccion),
                'total': float(obj.alcance2_total)
            },
            'alcance_3': {
                'viajes_negocio': float(obj.alcance3_viajes_negocio),
                'desplazamiento_empleados': float(obj.alcance3_desplazamiento_empleados),
                'transporte_upstream': float(obj.alcance3_transporte_upstream),
                'transporte_downstream': float(obj.alcance3_transporte_downstream),
                'residuos': float(obj.alcance3_residuos),
                'otros': float(obj.alcance3_otros),
                'total': float(obj.alcance3_total)
            }
        }

    def get_distribucion_porcentual(self, obj):
        """Distribución porcentual por alcance"""
        if obj.huella_total > 0:
            return {
                'alcance_1': round(float(obj.alcance1_total / obj.huella_total * 100), 2),
                'alcance_2': round(float(obj.alcance2_total / obj.huella_total * 100), 2),
                'alcance_3': round(float(obj.alcance3_total / obj.huella_total * 100), 2),
            }
        return {'alcance_1': 0, 'alcance_2': 0, 'alcance_3': 0}


class CalcularHuellaInputSerializer(serializers.Serializer):
    """Input para calcular huella de carbono automáticamente"""
    periodo_year = serializers.IntegerField()
    incluir_alcance_3 = serializers.BooleanField(default=True)
    factores_emision_personalizados = serializers.JSONField(required=False)


# ============================================================================
# CERTIFICADOS AMBIENTALES
# ============================================================================

class CertificadoAmbientalSerializer(serializers.ModelSerializer):
    """Serializer para certificados ambientales"""
    tipo_certificado_display = serializers.CharField(
        source='get_tipo_certificado_display',
        read_only=True
    )
    gestor_detalle = serializers.SerializerMethodField()
    esta_vigente = serializers.SerializerMethodField()
    residuos_relacionados_detalle = RegistroResiduoSerializer(
        source='residuos_relacionados',
        many=True,
        read_only=True
    )

    class Meta:
        model = CertificadoAmbiental
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_esta_vigente(self, obj):
        """Verifica si el certificado está vigente"""
        return obj.esta_vigente

    def get_gestor_detalle(self, obj):
        """Detalles del gestor emisor"""
        if obj.gestor:
            return {
                'id': obj.gestor.id,
                'razon_social': obj.gestor.razon_social,
                'nit': obj.gestor.nit
            }
        return None

    def to_representation(self, instance):
        """Agregar estado de vigencia"""
        data = super().to_representation(instance)
        data['esta_vigente'] = instance.esta_vigente
        return data


class GenerarCertificadoSerializer(serializers.Serializer):
    """Serializer para generar certificados de disposición"""
    tipo_certificado = serializers.ChoiceField(
        choices=CertificadoAmbiental.TIPO_CERTIFICADO_CHOICES
    )
    residuos_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="IDs de registros de residuos a certificar"
    )
    gestor_id = serializers.IntegerField()
    descripcion = serializers.CharField(max_length=500)
    observaciones = serializers.CharField(required=False, allow_blank=True)


# ============================================================================
# REPORTES Y ESTADÍSTICAS
# ============================================================================

class EstadisticasAmbientalesSerializer(serializers.Serializer):
    """Serializer para estadísticas ambientales generales"""
    periodo = serializers.CharField()
    residuos = serializers.DictField()
    vertimientos = serializers.DictField()
    emisiones = serializers.DictField()
    consumos = serializers.DictField()
    huella_carbono = serializers.DictField()


class ResumenGestionResiduosSerializer(serializers.Serializer):
    """Resumen de gestión de residuos por período"""
    periodo_inicio = serializers.DateField()
    periodo_fin = serializers.DateField()
    total_residuos_kg = serializers.DecimalField(max_digits=12, decimal_places=2)
    residuos_peligrosos_kg = serializers.DecimalField(max_digits=12, decimal_places=2)
    residuos_reciclables_kg = serializers.DecimalField(max_digits=12, decimal_places=2)
    residuos_organicos_kg = serializers.DecimalField(max_digits=12, decimal_places=2)
    tasa_reciclaje_pct = serializers.DecimalField(max_digits=5, decimal_places=2)
    por_tipo_residuo = serializers.ListField()
    por_area_generadora = serializers.ListField()
