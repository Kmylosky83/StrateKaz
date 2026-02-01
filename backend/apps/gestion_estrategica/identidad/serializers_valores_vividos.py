"""
Serializers para Valores Corporativos Vividos
==============================================

API para gestionar la conexión entre valores corporativos y acciones.
"""

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model

from .models_valores_vividos import (
    ValorVivido,
    ConfiguracionMetricaValor,
    CATEGORIA_ACCION_CHOICES,
    TIPO_VINCULO_CHOICES,
    IMPACTO_CHOICES,
)
from .models import CorporateValue

User = get_user_model()


# =============================================================================
# SERIALIZERS DE LECTURA
# =============================================================================

class ValorCorporativoMiniSerializer(serializers.ModelSerializer):
    """Serializer mínimo de valor corporativo para listas"""

    class Meta:
        model = CorporateValue
        fields = ['id', 'name', 'icon', 'description']
        read_only_fields = fields


class ValorVividoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de valores vividos"""
    valor_nombre = serializers.CharField(source='valor.name', read_only=True)
    valor_icon = serializers.CharField(source='valor.icon', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_accion_display', read_only=True)
    tipo_vinculo_display = serializers.CharField(source='get_tipo_vinculo_display', read_only=True)
    impacto_display = serializers.CharField(source='get_impacto_display', read_only=True)
    accion_titulo = serializers.CharField(read_only=True)
    vinculado_por_nombre = serializers.CharField(source='vinculado_por.get_full_name', read_only=True, allow_null=True)
    area_nombre = serializers.CharField(source='area.name', read_only=True, allow_null=True)
    content_type_label = serializers.SerializerMethodField()

    class Meta:
        model = ValorVivido
        fields = [
            'id',
            'valor',
            'valor_nombre',
            'valor_icon',
            'content_type',
            'content_type_label',
            'object_id',
            'accion_titulo',
            'categoria_accion',
            'categoria_display',
            'tipo_vinculo',
            'tipo_vinculo_display',
            'impacto',
            'impacto_display',
            'puntaje',
            'fecha_vinculacion',
            'vinculado_por_nombre',
            'area_nombre',
            'verificado',
            'created_at',
        ]
        read_only_fields = fields

    def get_content_type_label(self, obj):
        """Obtiene label legible del content type"""
        return f"{obj.content_type.app_label}.{obj.content_type.model}"


class ValorVividoDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado de valor vivido"""
    valor_info = ValorCorporativoMiniSerializer(source='valor', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_accion_display', read_only=True)
    tipo_vinculo_display = serializers.CharField(source='get_tipo_vinculo_display', read_only=True)
    impacto_display = serializers.CharField(source='get_impacto_display', read_only=True)
    accion_titulo = serializers.CharField(read_only=True)
    vinculado_por_info = serializers.SerializerMethodField()
    verificado_por_info = serializers.SerializerMethodField()
    area_nombre = serializers.CharField(source='area.name', read_only=True, allow_null=True)
    content_type_info = serializers.SerializerMethodField()

    class Meta:
        model = ValorVivido
        fields = [
            'id',
            'valor',
            'valor_info',
            'content_type',
            'content_type_info',
            'object_id',
            'accion_titulo',
            'categoria_accion',
            'categoria_display',
            'tipo_vinculo',
            'tipo_vinculo_display',
            'impacto',
            'impacto_display',
            'puntaje',
            'fecha_vinculacion',
            'justificacion',
            'evidencia',
            'archivo_evidencia',
            'vinculado_por',
            'vinculado_por_info',
            'area',
            'area_nombre',
            'metadata',
            'verificado',
            'verificado_por',
            'verificado_por_info',
            'fecha_verificacion',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'metadata', 'verificado', 'verificado_por',
            'fecha_verificacion', 'created_at', 'updated_at'
        ]

    def get_vinculado_por_info(self, obj):
        if obj.vinculado_por:
            return {
                'id': obj.vinculado_por.id,
                'nombre': obj.vinculado_por.get_full_name(),
                'email': obj.vinculado_por.email,
            }
        return None

    def get_verificado_por_info(self, obj):
        if obj.verificado_por:
            return {
                'id': obj.verificado_por.id,
                'nombre': obj.verificado_por.get_full_name(),
            }
        return None

    def get_content_type_info(self, obj):
        return {
            'id': obj.content_type.id,
            'app_label': obj.content_type.app_label,
            'model': obj.content_type.model,
            'label': f"{obj.content_type.app_label}.{obj.content_type.model}",
        }


# =============================================================================
# SERIALIZERS DE ESCRITURA
# =============================================================================

class VincularValorSerializer(serializers.Serializer):
    """Serializer para vincular un valor a una acción"""
    valor_id = serializers.IntegerField(
        required=True,
        help_text='ID del valor corporativo'
    )
    content_type = serializers.CharField(
        required=True,
        help_text='Content type en formato app_label.model (ej: planeacion.proyecto)'
    )
    object_id = serializers.IntegerField(
        required=True,
        help_text='ID del objeto/acción a vincular'
    )
    categoria_accion = serializers.ChoiceField(
        choices=CATEGORIA_ACCION_CHOICES,
        required=True,
        help_text='Categoría de la acción'
    )
    tipo_vinculo = serializers.ChoiceField(
        choices=TIPO_VINCULO_CHOICES,
        default='REFLEJA',
        help_text='Tipo de vínculo con el valor'
    )
    impacto = serializers.ChoiceField(
        choices=IMPACTO_CHOICES,
        default='MEDIO',
        help_text='Nivel de impacto'
    )
    justificacion = serializers.CharField(
        required=True,
        help_text='Justificación del vínculo'
    )
    evidencia = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Descripción de la evidencia'
    )
    area_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='ID del área responsable'
    )

    def validate_valor_id(self, value):
        """Valida que el valor exista"""
        try:
            CorporateValue.objects.get(id=value, is_active=True)
        except CorporateValue.DoesNotExist:
            raise serializers.ValidationError("El valor corporativo no existe o está inactivo")
        return value

    def validate_content_type(self, value):
        """Valida y convierte el content type"""
        try:
            app_label, model = value.lower().split('.')
            ct = ContentType.objects.get(app_label=app_label, model=model)
            return ct
        except (ValueError, ContentType.DoesNotExist):
            raise serializers.ValidationError(
                "Content type inválido. Usar formato: app_label.model"
            )

    def validate(self, attrs):
        """Validación cruzada"""
        content_type = attrs['content_type']
        object_id = attrs['object_id']

        # Verificar que el objeto existe
        model_class = content_type.model_class()
        if not model_class.objects.filter(id=object_id).exists():
            raise serializers.ValidationError({
                'object_id': f"No existe {content_type.model} con ID {object_id}"
            })

        # Verificar que no exista ya el vínculo
        if ValorVivido.objects.filter(
            valor_id=attrs['valor_id'],
            content_type=content_type,
            object_id=object_id,
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                "Este valor ya está vinculado a esta acción"
            )

        return attrs

    def create(self, validated_data):
        """Crea el vínculo"""
        request = self.context.get('request')
        user = request.user if request else None

        area = None
        if validated_data.get('area_id'):
            from apps.gestion_estrategica.organizacion.models import Area
            area = Area.objects.filter(id=validated_data['area_id']).first()

        valor_vivido = ValorVivido.objects.create(
            valor_id=validated_data['valor_id'],
            content_type=validated_data['content_type'],
            object_id=validated_data['object_id'],
            categoria_accion=validated_data['categoria_accion'],
            tipo_vinculo=validated_data.get('tipo_vinculo', 'REFLEJA'),
            impacto=validated_data.get('impacto', 'MEDIO'),
            justificacion=validated_data['justificacion'],
            evidencia=validated_data.get('evidencia', ''),
            vinculado_por=user,
            area=area,
            created_by=user,
            updated_by=user,
        )

        return valor_vivido


class VincularMultiplesValoresSerializer(serializers.Serializer):
    """Serializer para vincular múltiples valores a una acción"""
    valores_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text='Lista de IDs de valores corporativos'
    )
    content_type = serializers.CharField(
        required=True,
        help_text='Content type en formato app_label.model'
    )
    object_id = serializers.IntegerField(
        required=True,
        help_text='ID del objeto/acción'
    )
    categoria_accion = serializers.ChoiceField(
        choices=CATEGORIA_ACCION_CHOICES,
        required=True
    )
    tipo_vinculo = serializers.ChoiceField(
        choices=TIPO_VINCULO_CHOICES,
        default='REFLEJA'
    )
    impacto = serializers.ChoiceField(
        choices=IMPACTO_CHOICES,
        default='MEDIO'
    )
    justificacion = serializers.CharField(required=True)

    def validate_valores_ids(self, value):
        """Valida que los valores existan"""
        valores_existentes = CorporateValue.objects.filter(
            id__in=value,
            is_active=True
        ).values_list('id', flat=True)

        if len(valores_existentes) != len(value):
            no_encontrados = set(value) - set(valores_existentes)
            raise serializers.ValidationError(
                f"Los siguientes valores no existen: {list(no_encontrados)}"
            )

        return value

    def validate_content_type(self, value):
        try:
            app_label, model = value.lower().split('.')
            return ContentType.objects.get(app_label=app_label, model=model)
        except (ValueError, ContentType.DoesNotExist):
            raise serializers.ValidationError("Content type inválido")


class ActualizarValorVividoSerializer(serializers.ModelSerializer):
    """Serializer para actualizar un valor vivido"""

    class Meta:
        model = ValorVivido
        fields = [
            'tipo_vinculo',
            'impacto',
            'justificacion',
            'evidencia',
            'archivo_evidencia',
            'area',
        ]

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)


class VerificarValorVividoSerializer(serializers.Serializer):
    """Serializer para verificar un valor vivido"""
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Observaciones de la verificación'
    )


# =============================================================================
# SERIALIZERS DE ESTADÍSTICAS (BI)
# =============================================================================

class EstadisticasValorSerializer(serializers.Serializer):
    """Serializer para estadísticas por valor"""
    valor__id = serializers.IntegerField()
    valor__name = serializers.CharField()
    valor__icon = serializers.CharField(allow_null=True)
    total_acciones = serializers.IntegerField()
    impacto_bajo = serializers.IntegerField()
    impacto_medio = serializers.IntegerField()
    impacto_alto = serializers.IntegerField()
    impacto_muy_alto = serializers.IntegerField()
    porcentaje_alto_impacto = serializers.SerializerMethodField()

    def get_porcentaje_alto_impacto(self, obj):
        total = obj.get('total_acciones', 0)
        if total == 0:
            return 0
        alto = obj.get('impacto_alto', 0) + obj.get('impacto_muy_alto', 0)
        return round((alto / total) * 100, 2)


class TendenciaMensualSerializer(serializers.Serializer):
    """Serializer para tendencia mensual"""
    mes = serializers.DateField()
    valor__id = serializers.IntegerField()
    valor__name = serializers.CharField()
    total = serializers.IntegerField()


class RankingCategoriaSerializer(serializers.Serializer):
    """Serializer para ranking de categorías"""
    categoria_accion = serializers.CharField()
    categoria_display = serializers.SerializerMethodField()
    total = serializers.IntegerField()
    porcentaje = serializers.FloatField()

    def get_categoria_display(self, obj):
        categorias_dict = dict(CATEGORIA_ACCION_CHOICES)
        return categorias_dict.get(obj['categoria_accion'], obj['categoria_accion'])


class ValorSubrepresentadoSerializer(serializers.Serializer):
    """Serializer para valores subrepresentados"""
    valor_id = serializers.IntegerField()
    valor_nombre = serializers.CharField()
    total_acciones = serializers.IntegerField()
    deficit = serializers.IntegerField()
    porcentaje_cumplimiento = serializers.FloatField()


class ResumenValoresVividosSerializer(serializers.Serializer):
    """Serializer para resumen general"""
    total_vinculos = serializers.IntegerField()
    total_valores_activos = serializers.IntegerField()
    valores_con_acciones = serializers.IntegerField()
    valores_sin_acciones = serializers.IntegerField()
    promedio_acciones_por_valor = serializers.FloatField()
    puntaje_promedio = serializers.FloatField()
    por_impacto = serializers.DictField()
    por_categoria = serializers.ListField()
    top_valores = serializers.ListField()
    valores_subrepresentados = serializers.ListField()


# =============================================================================
# SERIALIZER DE CONFIGURACIÓN DE MÉTRICAS
# =============================================================================

class ConfiguracionMetricaValorSerializer(serializers.ModelSerializer):
    """Serializer para configuración de métricas"""

    class Meta:
        model = ConfiguracionMetricaValor
        fields = [
            'id',
            'empresa',
            'acciones_minimas_mensual',
            'puntaje_minimo_promedio',
            'alertar_valores_bajos',
            'umbral_alerta_acciones',
            'categorias_prioritarias',
            'pesos_tipo_vinculo',
            'meses_analisis',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'empresa', 'created_at', 'updated_at']
