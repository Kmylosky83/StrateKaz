from rest_framework import serializers
from .models import TipoRuta, EstadoDespacho, Ruta, Conductor, ProgramacionRuta, Despacho, DetalleDespacho, Manifiesto

class TipoRutaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoRuta
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'es_recoleccion', 'es_entrega', 'es_transferencia', 'requiere_cadena_frio', 'activo', 'orden', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class EstadoDespachoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoDespacho
        fields = ['id', 'codigo', 'nombre', 'color', 'descripcion', 'en_transito', 'es_final', 'permite_edicion', 'activo', 'orden', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class RutaSerializer(serializers.ModelSerializer):
    tipo_ruta_nombre = serializers.CharField(source='tipo_ruta.nombre', read_only=True)
    class Meta:
        model = Ruta
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']

class ConductorSerializer(serializers.ModelSerializer):
    licencia_vigente = serializers.BooleanField(read_only=True)
    esta_activo = serializers.BooleanField(read_only=True)
    class Meta:
        model = Conductor
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']

class ProgramacionRutaSerializer(serializers.ModelSerializer):
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)
    conductor_nombre = serializers.CharField(source='conductor.nombre_completo', read_only=True)
    class Meta:
        model = ProgramacionRuta
        fields = '__all__'
        read_only_fields = ['codigo', 'km_recorridos', 'empresa', 'created_at', 'updated_at']

class DetalleDespachoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleDespacho
        fields = '__all__'
        read_only_fields = ['empresa', 'created_at', 'updated_at']

class DespachoSerializer(serializers.ModelSerializer):
    detalles = DetalleDespachoSerializer(many=True, read_only=True)
    estado_nombre = serializers.CharField(source='estado_despacho.nombre', read_only=True)
    class Meta:
        model = Despacho
        fields = '__all__'
        read_only_fields = ['codigo', 'empresa', 'created_at', 'updated_at']

class ManifiestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manifiesto
        fields = '__all__'
        read_only_fields = ['numero_manifiesto', 'empresa', 'created_at', 'updated_at']
