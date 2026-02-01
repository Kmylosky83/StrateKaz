from rest_framework import serializers
from .models import TipoParteInteresada, ParteInteresada, RequisitoParteInteresada, MatrizComunicacion


class TipoParteInteresadaSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source="get_categoria_display", read_only=True)

    class Meta:
        model = TipoParteInteresada
        fields = "__all__"


class ParteInteresadaSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source="tipo.nombre", read_only=True)
    nivel_influencia_display = serializers.CharField(source="get_nivel_influencia_display", read_only=True)
    nivel_interes_display = serializers.CharField(source="get_nivel_interes_display", read_only=True)

    class Meta:
        model = ParteInteresada
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class RequisitoParteInteresadaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    prioridad_display = serializers.CharField(source="get_prioridad_display", read_only=True)

    class Meta:
        model = RequisitoParteInteresada
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class MatrizComunicacionSerializer(serializers.ModelSerializer):
    parte_interesada_nombre = serializers.CharField(source="parte_interesada.nombre", read_only=True)
    cuando_display = serializers.CharField(source="get_cuando_comunicar_display", read_only=True)
    como_display = serializers.CharField(source="get_como_comunicar_display", read_only=True)
    responsable_nombre = serializers.CharField(source="responsable.get_full_name", read_only=True)

    class Meta:
        model = MatrizComunicacion
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]
