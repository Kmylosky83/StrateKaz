from rest_framework import serializers
from .models import TipoReglamento, Reglamento, VersionReglamento, PublicacionReglamento, SocializacionReglamento


class TipoReglamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoReglamento
        fields = "__all__"


class ReglamentoSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source="tipo.nombre", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    aprobado_por_nombre = serializers.CharField(source="aprobado_por.get_full_name", read_only=True)

    class Meta:
        model = Reglamento
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class VersionReglamentoSerializer(serializers.ModelSerializer):
    elaborado_por_nombre = serializers.CharField(source="elaborado_por.get_full_name", read_only=True)

    class Meta:
        model = VersionReglamento
        fields = "__all__"
        read_only_fields = ["created_at"]


class PublicacionReglamentoSerializer(serializers.ModelSerializer):
    medio_display = serializers.CharField(source="get_medio_display", read_only=True)
    publicado_por_nombre = serializers.CharField(source="publicado_por.get_full_name", read_only=True)

    class Meta:
        model = PublicacionReglamento
        fields = "__all__"
        read_only_fields = ["created_at"]


class SocializacionReglamentoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    facilitador_nombre = serializers.CharField(source="facilitador.get_full_name", read_only=True)

    class Meta:
        model = SocializacionReglamento
        fields = "__all__"
        read_only_fields = ["created_at"]
