"""
Serializers para Datos Maestros Compartidos — Core (C0)

Departamentos, Ciudades y Tipos de Documento de Identidad.
"""
from rest_framework import serializers
from apps.core.models import TipoDocumentoIdentidad, Departamento, Ciudad


class TipoDocumentoIdentidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDocumentoIdentidad
        fields = ['id', 'codigo', 'nombre', 'orden', 'is_active']
        read_only_fields = ['id']


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = ['id', 'codigo', 'nombre', 'codigo_dane', 'orden', 'is_active']
        read_only_fields = ['id']


class CiudadSerializer(serializers.ModelSerializer):
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)

    class Meta:
        model = Ciudad
        fields = [
            'id', 'departamento', 'departamento_nombre', 'codigo', 'nombre',
            'codigo_dane', 'es_capital', 'orden', 'is_active'
        ]
        read_only_fields = ['id']
