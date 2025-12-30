"""
Serializers para Gestión de Flota - Logistics Fleet Management
Sistema de Gestión Grasas y Huesos del Norte
"""
from rest_framework import serializers
from decimal import Decimal
from .models import (
    TipoVehiculo, EstadoVehiculo, Vehiculo, DocumentoVehiculo,
    HojaVidaVehiculo, MantenimientoVehiculo, CostoOperacion,
    VerificacionTercero
)


# ==============================================================================
# SERIALIZERS DE CATÁLOGOS
# ==============================================================================

class TipoVehiculoSerializer(serializers.ModelSerializer):
    """Serializer para Tipo de Vehículo."""
    categoria_licencia_display = serializers.CharField(
        source='get_categoria_licencia_display',
        read_only=True
    )

    class Meta:
        model = TipoVehiculo
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'capacidad_kg', 'capacidad_m3',
            'requiere_refrigeracion', 'requiere_licencia_especial',
            'categoria_licencia', 'categoria_licencia_display',
            'orden', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class EstadoVehiculoSerializer(serializers.ModelSerializer):
    """Serializer para Estado de Vehículo."""

    class Meta:
        model = EstadoVehiculo
        fields = [
            'id', 'codigo', 'nombre', 'color', 'descripcion',
            'disponible_para_ruta', 'requiere_mantenimiento',
            'orden', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


# ==============================================================================
# SERIALIZER PRINCIPAL - VEHÍCULO
# ==============================================================================

class VehiculoSerializer(serializers.ModelSerializer):
    """Serializer para Vehículo."""

    # Read-only fields con información extendida
    tipo_vehiculo_data = TipoVehiculoSerializer(source='tipo_vehiculo', read_only=True)
    estado_data = EstadoVehiculoSerializer(source='estado', read_only=True)

    # Campos calculados
    dias_hasta_vencimiento_soat = serializers.IntegerField(read_only=True)
    dias_hasta_vencimiento_tecnomecanica = serializers.IntegerField(read_only=True)
    documentos_al_dia = serializers.BooleanField(read_only=True)
    disponible_para_operar = serializers.BooleanField(read_only=True)

    # Información de empresa
    empresa_nombre = serializers.CharField(source='empresa.nombre_comercial', read_only=True)

    # Auditoría
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = Vehiculo
        fields = [
            'id', 'empresa', 'empresa_nombre',
            'placa', 'tipo_vehiculo', 'tipo_vehiculo_data',
            'estado', 'estado_data',
            'marca', 'modelo', 'anio', 'color',
            'numero_motor', 'numero_chasis', 'vin',
            'capacidad_kg', 'km_actual',
            'fecha_matricula', 'fecha_soat', 'fecha_tecnomecanica',
            'propietario_nombre', 'propietario_documento',
            'es_propio', 'es_contratado',
            'gps_instalado', 'numero_gps',
            'observaciones',
            # Campos calculados
            'dias_hasta_vencimiento_soat',
            'dias_hasta_vencimiento_tecnomecanica',
            'documentos_al_dia',
            'disponible_para_operar',
            # Auditoría
            'is_active', 'deleted_at',
            'created_by', 'created_by_name',
            'updated_by', 'updated_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'deleted_at',
            'created_by', 'updated_by'
        ]


class VehiculoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de vehículos."""

    tipo_nombre = serializers.CharField(source='tipo_vehiculo.nombre', read_only=True)
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)
    estado_color = serializers.CharField(source='estado.color', read_only=True)
    disponible_para_operar = serializers.BooleanField(read_only=True)
    dias_hasta_vencimiento_soat = serializers.IntegerField(read_only=True)
    dias_hasta_vencimiento_tecnomecanica = serializers.IntegerField(read_only=True)

    class Meta:
        model = Vehiculo
        fields = [
            'id', 'placa', 'marca', 'modelo', 'anio',
            'tipo_vehiculo', 'tipo_nombre',
            'estado', 'estado_nombre', 'estado_color',
            'km_actual', 'capacidad_kg',
            'fecha_soat', 'fecha_tecnomecanica',
            'dias_hasta_vencimiento_soat',
            'dias_hasta_vencimiento_tecnomecanica',
            'disponible_para_operar',
            'is_active'
        ]


# ==============================================================================
# SERIALIZERS DE DOCUMENTOS Y LEGALES
# ==============================================================================

class DocumentoVehiculoSerializer(serializers.ModelSerializer):
    """Serializer para Documento de Vehículo."""

    vehiculo_placa = serializers.CharField(source='vehiculo.placa', read_only=True)
    tipo_documento_display = serializers.CharField(
        source='get_tipo_documento_display',
        read_only=True
    )

    # Campos calculados
    dias_hasta_vencimiento = serializers.IntegerField(read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)
    proximo_a_vencer = serializers.BooleanField(read_only=True)

    # Auditoría
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = DocumentoVehiculo
        fields = [
            'id', 'empresa', 'vehiculo', 'vehiculo_placa',
            'tipo_documento', 'tipo_documento_display',
            'numero_documento', 'fecha_expedicion', 'fecha_vencimiento',
            'entidad_emisora', 'documento_url',
            'observaciones',
            # Campos calculados
            'dias_hasta_vencimiento', 'esta_vencido', 'proximo_a_vencer',
            # Auditoría
            'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class HojaVidaVehiculoSerializer(serializers.ModelSerializer):
    """Serializer para Hoja de Vida de Vehículo."""

    vehiculo_placa = serializers.CharField(source='vehiculo.placa', read_only=True)
    tipo_evento_display = serializers.CharField(
        source='get_tipo_evento_display',
        read_only=True
    )
    registrado_por_name = serializers.CharField(
        source='registrado_por.get_full_name',
        read_only=True
    )

    class Meta:
        model = HojaVidaVehiculo
        fields = [
            'id', 'empresa', 'vehiculo', 'vehiculo_placa',
            'fecha', 'tipo_evento', 'tipo_evento_display',
            'descripcion', 'km_evento',
            'costo', 'proveedor', 'documento_soporte_url',
            'registrado_por', 'registrado_por_name',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


# ==============================================================================
# SERIALIZERS DE MANTENIMIENTO
# ==============================================================================

class MantenimientoVehiculoSerializer(serializers.ModelSerializer):
    """Serializer para Mantenimiento de Vehículo."""

    vehiculo_placa = serializers.CharField(source='vehiculo.placa', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    responsable_name = serializers.CharField(
        source='responsable.get_full_name',
        read_only=True,
        allow_null=True
    )

    # Campo calculado
    esta_vencido = serializers.BooleanField(read_only=True)

    # Auditoría
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = MantenimientoVehiculo
        fields = [
            'id', 'empresa', 'vehiculo', 'vehiculo_placa',
            'tipo', 'tipo_display', 'descripcion',
            'fecha_programada', 'fecha_ejecucion',
            'km_mantenimiento', 'km_proximo_mantenimiento',
            'costo_mano_obra', 'costo_repuestos', 'costo_total',
            'proveedor_nombre', 'factura_numero',
            'responsable', 'responsable_name',
            'estado', 'estado_display',
            'esta_vencido',
            'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'costo_total']


class MantenimientoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de mantenimientos."""

    vehiculo_placa = serializers.CharField(source='vehiculo.placa', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    esta_vencido = serializers.BooleanField(read_only=True)

    class Meta:
        model = MantenimientoVehiculo
        fields = [
            'id', 'vehiculo', 'vehiculo_placa',
            'tipo', 'tipo_display',
            'fecha_programada', 'fecha_ejecucion',
            'estado', 'estado_display',
            'costo_total', 'esta_vencido'
        ]


# ==============================================================================
# SERIALIZERS DE COSTOS
# ==============================================================================

class CostoOperacionSerializer(serializers.ModelSerializer):
    """Serializer para Costo de Operación."""

    vehiculo_placa = serializers.CharField(source='vehiculo.placa', read_only=True)
    tipo_costo_display = serializers.CharField(
        source='get_tipo_costo_display',
        read_only=True
    )
    registrado_por_name = serializers.CharField(
        source='registrado_por.get_full_name',
        read_only=True
    )

    # Campo calculado
    costo_por_km = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = CostoOperacion
        fields = [
            'id', 'empresa', 'vehiculo', 'vehiculo_placa',
            'fecha', 'tipo_costo', 'tipo_costo_display',
            'valor', 'cantidad', 'km_recorridos',
            'consumo_km_litro', 'costo_por_km',
            'factura_numero', 'observaciones',
            'registrado_por', 'registrado_por_name',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'consumo_km_litro']


class CostoOperacionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de costos."""

    vehiculo_placa = serializers.CharField(source='vehiculo.placa', read_only=True)
    tipo_costo_display = serializers.CharField(
        source='get_tipo_costo_display',
        read_only=True
    )

    class Meta:
        model = CostoOperacion
        fields = [
            'id', 'vehiculo', 'vehiculo_placa',
            'fecha', 'tipo_costo', 'tipo_costo_display',
            'valor', 'km_recorridos', 'consumo_km_litro'
        ]


# ==============================================================================
# SERIALIZERS PESV - VERIFICACIONES
# ==============================================================================

class VerificacionTerceroSerializer(serializers.ModelSerializer):
    """Serializer para Verificación de Tercero (PESV)."""

    vehiculo_placa = serializers.CharField(source='vehiculo.placa', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    resultado_display = serializers.CharField(
        source='get_resultado_display',
        read_only=True
    )
    inspector_name = serializers.CharField(
        source='inspector.get_full_name',
        read_only=True,
        allow_null=True
    )

    # Campos calculados
    requiere_accion_inmediata = serializers.BooleanField(read_only=True)
    porcentaje_cumplimiento = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )

    # Auditoría
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = VerificacionTercero
        fields = [
            'id', 'empresa', 'vehiculo', 'vehiculo_placa',
            'fecha', 'tipo', 'tipo_display',
            'inspector', 'inspector_name', 'inspector_externo',
            'checklist_items', 'resultado', 'resultado_display',
            'kilometraje', 'nivel_combustible',
            'observaciones_generales', 'firma_inspector_url',
            'acciones_correctivas',
            'requiere_accion_inmediata', 'porcentaje_cumplimiento',
            'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class VerificacionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de verificaciones."""

    vehiculo_placa = serializers.CharField(source='vehiculo.placa', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    resultado_display = serializers.CharField(
        source='get_resultado_display',
        read_only=True
    )
    requiere_accion_inmediata = serializers.BooleanField(read_only=True)
    porcentaje_cumplimiento = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = VerificacionTercero
        fields = [
            'id', 'vehiculo', 'vehiculo_placa',
            'fecha', 'tipo', 'tipo_display',
            'resultado', 'resultado_display',
            'porcentaje_cumplimiento',
            'requiere_accion_inmediata'
        ]
