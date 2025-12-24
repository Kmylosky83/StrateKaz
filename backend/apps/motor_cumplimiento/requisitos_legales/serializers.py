from rest_framework import serializers
from .models import TipoRequisito, RequisitoLegal, EmpresaRequisito, AlertaVencimiento


class TipoRequisitoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoRequisito
        fields = "__all__"


class RequisitoLegalSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source="tipo.nombre", read_only=True)

    class Meta:
        model = RequisitoLegal
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class EmpresaRequisitoSerializer(serializers.ModelSerializer):
    requisito_nombre = serializers.CharField(source="requisito.nombre", read_only=True)
    responsable_nombre = serializers.CharField(source="responsable.get_full_name", read_only=True)
    dias_para_vencer = serializers.IntegerField(read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)

    class Meta:
        model = EmpresaRequisito
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class AlertaVencimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertaVencimiento
        fields = "__all__"
        read_only_fields = ["created_at"]
