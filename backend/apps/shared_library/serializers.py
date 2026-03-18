from rest_framework import serializers
from .models import BibliotecaPlantilla


class BibliotecaPlantillaListSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(
        source='get_categoria_display', read_only=True
    )
    industria_display = serializers.CharField(
        source='get_industria_display', read_only=True
    )

    class Meta:
        model = BibliotecaPlantilla
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'tipo_documento_codigo', 'categoria', 'categoria_display',
            'industria', 'industria_display', 'norma_iso_codigo',
            'version', 'is_active', 'orden',
        ]


class BibliotecaPlantillaDetailSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(
        source='get_categoria_display', read_only=True
    )
    industria_display = serializers.CharField(
        source='get_industria_display', read_only=True
    )

    class Meta:
        model = BibliotecaPlantilla
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'tipo_documento_codigo', 'contenido_plantilla',
            'variables_disponibles', 'estilos_css', 'encabezado', 'pie_pagina',
            'categoria', 'categoria_display',
            'industria', 'industria_display', 'norma_iso_codigo',
            'version', 'is_active', 'orden',
            'created_at', 'updated_at',
        ]
