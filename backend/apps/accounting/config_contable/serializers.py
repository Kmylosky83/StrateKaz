"""
Serializers para config_contable - accounting
Sistema de Gestión StrateKaz
"""
from rest_framework import serializers
from .models import (
    PlanCuentas, CuentaContable, TipoDocumentoContable,
    Tercero, CentroCostoContable, ConfiguracionModulo
)


class PlanCuentasListSerializer(serializers.ModelSerializer):
    tipo_plan_display = serializers.CharField(source='get_tipo_plan_display', read_only=True)
    total_cuentas = serializers.IntegerField(read_only=True)

    class Meta:
        model = PlanCuentas
        fields = ['id', 'nombre', 'version', 'tipo_plan', 'tipo_plan_display', 'fecha_inicio_vigencia', 'fecha_fin_vigencia', 'es_activo', 'total_cuentas', 'created_at']


class PlanCuentasSerializer(serializers.ModelSerializer):
    tipo_plan_display = serializers.CharField(source='get_tipo_plan_display', read_only=True)
    total_cuentas = serializers.SerializerMethodField()

    class Meta:
        model = PlanCuentas
        fields = ['id', 'empresa', 'nombre', 'version', 'tipo_plan', 'tipo_plan_display', 'fecha_inicio_vigencia', 'fecha_fin_vigencia', 'es_activo', 'descripcion', 'total_cuentas', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def get_total_cuentas(self, obj):
        return obj.cuentas.count()


class CuentaContableListSerializer(serializers.ModelSerializer):
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    naturaleza_display = serializers.CharField(source='get_naturaleza_display', read_only=True)
    clase_cuenta_display = serializers.CharField(source='get_clase_cuenta_display', read_only=True)
    saldo_final = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True)
    cuenta_padre_codigo = serializers.CharField(source='cuenta_padre.codigo', read_only=True)

    class Meta:
        model = CuentaContable
        fields = ['id', 'codigo', 'nombre', 'nivel', 'nivel_display', 'naturaleza', 'naturaleza_display', 'tipo_cuenta', 'clase_cuenta', 'clase_cuenta_display', 'acepta_movimientos', 'saldo_debito', 'saldo_credito', 'saldo_final', 'cuenta_padre', 'cuenta_padre_codigo', 'is_active']


class CuentaContableSerializer(serializers.ModelSerializer):
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    naturaleza_display = serializers.CharField(source='get_naturaleza_display', read_only=True)
    tipo_cuenta_display = serializers.CharField(source='get_tipo_cuenta_display', read_only=True)
    clase_cuenta_display = serializers.CharField(source='get_clase_cuenta_display', read_only=True)
    saldo_final = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True)
    es_cuenta_titulo = serializers.BooleanField(read_only=True)
    plan_cuentas_nombre = serializers.CharField(source='plan_cuentas.nombre', read_only=True)
    cuenta_padre_codigo = serializers.CharField(source='cuenta_padre.codigo', read_only=True)
    total_subcuentas = serializers.SerializerMethodField()

    class Meta:
        model = CuentaContable
        fields = ['id', 'empresa', 'plan_cuentas', 'plan_cuentas_nombre', 'codigo', 'nombre', 'descripcion', 'cuenta_padre', 'cuenta_padre_codigo', 'nivel', 'nivel_display', 'naturaleza', 'naturaleza_display', 'tipo_cuenta', 'tipo_cuenta_display', 'clase_cuenta', 'clase_cuenta_display', 'exige_tercero', 'exige_centro_costo', 'exige_base_retencion', 'permite_saldo_negativo', 'acepta_movimientos', 'saldo_debito', 'saldo_credito', 'saldo_final', 'es_cuenta_titulo', 'modulo_origen', 'total_subcuentas', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['saldo_debito', 'saldo_credito', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_total_subcuentas(self, obj):
        return obj.subcuentas.count()


class CuentaContableTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    saldo_final = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True)

    class Meta:
        model = CuentaContable
        fields = ['id', 'codigo', 'nombre', 'nivel', 'naturaleza', 'tipo_cuenta', 'clase_cuenta', 'acepta_movimientos', 'saldo_final', 'children']

    def get_children(self, obj):
        subcuentas = obj.subcuentas.filter(is_active=True).order_by('codigo')
        return CuentaContableTreeSerializer(subcuentas, many=True).data


class TipoDocumentoContableListSerializer(serializers.ModelSerializer):
    clase_documento_display = serializers.CharField(source='get_clase_documento_display', read_only=True)

    class Meta:
        model = TipoDocumentoContable
        fields = ['id', 'codigo', 'nombre', 'clase_documento', 'clase_documento_display', 'prefijo', 'consecutivo_actual', 'requiere_aprobacion', 'afecta_contabilidad', 'is_active']


class TipoDocumentoContableSerializer(serializers.ModelSerializer):
    clase_documento_display = serializers.CharField(source='get_clase_documento_display', read_only=True)
    siguiente_consecutivo = serializers.SerializerMethodField()

    class Meta:
        model = TipoDocumentoContable
        fields = ['id', 'empresa', 'codigo', 'nombre', 'clase_documento', 'clase_documento_display', 'prefijo', 'consecutivo_actual', 'usa_periodo_numeracion', 'requiere_aprobacion', 'afecta_contabilidad', 'descripcion', 'siguiente_consecutivo', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['consecutivo_actual', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_siguiente_consecutivo(self, obj):
        return obj.consecutivo_actual + 1


class TerceroListSerializer(serializers.ModelSerializer):
    tipo_identificacion_display = serializers.CharField(source='get_tipo_identificacion_display', read_only=True)
    tipo_tercero_display = serializers.CharField(source='get_tipo_tercero_display', read_only=True)
    identificacion_completa = serializers.CharField(read_only=True)

    class Meta:
        model = Tercero
        fields = ['id', 'tipo_identificacion', 'tipo_identificacion_display', 'numero_identificacion', 'identificacion_completa', 'razon_social', 'nombre_comercial', 'tipo_tercero', 'tipo_tercero_display', 'tipo_persona', 'ciudad', 'is_active']


class TerceroSerializer(serializers.ModelSerializer):
    tipo_identificacion_display = serializers.CharField(source='get_tipo_identificacion_display', read_only=True)
    tipo_tercero_display = serializers.CharField(source='get_tipo_tercero_display', read_only=True)
    tipo_persona_display = serializers.CharField(source='get_tipo_persona_display', read_only=True)
    regimen_display = serializers.CharField(source='get_regimen_display', read_only=True)
    identificacion_completa = serializers.CharField(read_only=True)

    class Meta:
        model = Tercero
        fields = ['id', 'empresa', 'tipo_identificacion', 'tipo_identificacion_display', 'numero_identificacion', 'digito_verificacion', 'identificacion_completa', 'razon_social', 'nombre_comercial', 'tipo_tercero', 'tipo_tercero_display', 'tipo_persona', 'tipo_persona_display', 'responsable_iva', 'regimen', 'regimen_display', 'gran_contribuyente', 'autoretenedor', 'direccion', 'ciudad', 'telefono', 'email', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


class CentroCostoContableListSerializer(serializers.ModelSerializer):
    tipo_centro_display = serializers.CharField(source='get_tipo_centro_display', read_only=True)
    centro_padre_codigo = serializers.CharField(source='centro_padre.codigo', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)

    class Meta:
        model = CentroCostoContable
        fields = ['id', 'codigo', 'nombre', 'tipo_centro', 'tipo_centro_display', 'centro_padre', 'centro_padre_codigo', 'responsable', 'responsable_nombre', 'presupuesto_anual', 'is_active']


class CentroCostoContableSerializer(serializers.ModelSerializer):
    tipo_centro_display = serializers.CharField(source='get_tipo_centro_display', read_only=True)
    centro_padre_codigo = serializers.CharField(source='centro_padre.codigo', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    total_subcentros = serializers.SerializerMethodField()

    class Meta:
        model = CentroCostoContable
        fields = ['id', 'empresa', 'codigo', 'nombre', 'centro_padre', 'centro_padre_codigo', 'tipo_centro', 'tipo_centro_display', 'responsable', 'responsable_nombre', 'presupuesto_anual', 'descripcion', 'total_subcentros', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']

    def get_total_subcentros(self, obj):
        return obj.subcentros.count()


class CentroCostoContableTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = CentroCostoContable
        fields = ['id', 'codigo', 'nombre', 'tipo_centro', 'presupuesto_anual', 'children']

    def get_children(self, obj):
        subcentros = obj.subcentros.filter(is_active=True).order_by('codigo')
        return CentroCostoContableTreeSerializer(subcentros, many=True).data


class ConfiguracionModuloSerializer(serializers.ModelSerializer):
    plan_cuentas_nombre = serializers.CharField(source='plan_cuentas_activo.nombre', read_only=True)
    cuenta_utilidad_codigo = serializers.CharField(source='cuenta_utilidad_ejercicio.codigo', read_only=True)
    cuenta_perdida_codigo = serializers.CharField(source='cuenta_perdida_ejercicio.codigo', read_only=True)
    cuenta_ganancias_codigo = serializers.CharField(source='cuenta_ganancias_retenidas.codigo', read_only=True)
    ejercicio_abierto = serializers.BooleanField(read_only=True)

    class Meta:
        model = ConfiguracionModulo
        fields = ['id', 'empresa', 'plan_cuentas_activo', 'plan_cuentas_nombre', 'periodo_actual', 'fecha_inicio_ejercicio', 'fecha_fin_ejercicio', 'ultimo_periodo_cerrado', 'permite_modificar_periodos_cerrados', 'cuenta_utilidad_ejercicio', 'cuenta_utilidad_codigo', 'cuenta_perdida_ejercicio', 'cuenta_perdida_codigo', 'cuenta_ganancias_retenidas', 'cuenta_ganancias_codigo', 'contabiliza_automatico_pagos', 'contabiliza_automatico_recaudos', 'contabiliza_automatico_nomina', 'contabiliza_automatico_inventarios', 'decimales_moneda', 'exige_cuadre_comprobantes', 'exige_centro_costo_gastos', 'ejercicio_abierto', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by']
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
