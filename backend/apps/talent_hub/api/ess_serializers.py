"""
Serializers para Employee Self-Service (ESS) - Portal Empleado.

Versiones limitadas que solo exponen datos propios del empleado,
excluyendo información sensible de otros colaboradores.
"""
from rest_framework import serializers


class ColaboradorESSSerializer(serializers.Serializer):
    """Perfil del colaborador - solo lectura, datos propios."""
    id = serializers.IntegerField(read_only=True)
    nombre_completo = serializers.SerializerMethodField()
    numero_identificacion = serializers.CharField(read_only=True)
    tipo_identificacion = serializers.CharField(read_only=True)
    cargo_nombre = serializers.SerializerMethodField()
    area_nombre = serializers.SerializerMethodField()
    sede_nombre = serializers.SerializerMethodField()
    fecha_ingreso = serializers.DateField(read_only=True)
    estado = serializers.CharField(read_only=True)
    foto = serializers.ImageField(read_only=True)
    email = serializers.SerializerMethodField()
    telefono = serializers.SerializerMethodField()

    def get_nombre_completo(self, obj):
        return obj.get_nombre_completo()

    def get_cargo_nombre(self, obj):
        return obj.cargo.name if obj.cargo else None

    def get_area_nombre(self, obj):
        return obj.area.name if obj.area else None

    def get_sede_nombre(self, obj):
        return None

    def get_email(self, obj):
        return obj.usuario.email if hasattr(obj, 'usuario') and obj.usuario else None

    def get_telefono(self, obj):
        return getattr(obj, 'telefono_personal', None) or getattr(obj, 'telefono', None)


class InfoPersonalUpdateESSSerializer(serializers.Serializer):
    """Campos que el empleado puede actualizar de su perfil."""
    telefono_personal = serializers.CharField(max_length=20, required=False, allow_blank=True)
    direccion = serializers.CharField(max_length=300, required=False, allow_blank=True)
    barrio = serializers.CharField(max_length=100, required=False, allow_blank=True)
    ciudad = serializers.CharField(max_length=100, required=False, allow_blank=True)
    contacto_emergencia_nombre = serializers.CharField(max_length=200, required=False, allow_blank=True)
    contacto_emergencia_telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    contacto_emergencia_parentesco = serializers.CharField(max_length=50, required=False, allow_blank=True)


class VacacionesSaldoESSSerializer(serializers.Serializer):
    """Saldo de vacaciones del empleado."""
    dias_acumulados = serializers.DecimalField(max_digits=6, decimal_places=2)
    dias_disfrutados = serializers.DecimalField(max_digits=6, decimal_places=2)
    dias_disponibles = serializers.DecimalField(max_digits=6, decimal_places=2)
    fecha_ultimo_periodo = serializers.DateField(allow_null=True)
    solicitudes_pendientes = serializers.IntegerField()


class SolicitudVacacionesESSSerializer(serializers.Serializer):
    """Serializer para solicitar vacaciones desde ESS."""
    fecha_inicio = serializers.DateField()
    fecha_fin = serializers.DateField()
    dias_solicitados = serializers.IntegerField(min_value=1)
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['fecha_fin'] < attrs['fecha_inicio']:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha de fin debe ser posterior a la de inicio.'
            })
        return attrs


class SolicitudPermisoESSSerializer(serializers.Serializer):
    """Serializer para solicitar permiso desde ESS."""
    tipo_permiso = serializers.CharField(max_length=50)
    fecha = serializers.DateField()
    hora_inicio = serializers.TimeField(required=False, allow_null=True)
    hora_fin = serializers.TimeField(required=False, allow_null=True)
    motivo = serializers.CharField()


class RecibosNominaESSSerializer(serializers.Serializer):
    """Recibos de nómina del empleado."""
    id = serializers.IntegerField()
    periodo = serializers.CharField()
    fecha_liquidacion = serializers.DateField()
    salario_base = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_devengado = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_deducciones = serializers.DecimalField(max_digits=12, decimal_places=2)
    neto_pagar = serializers.DecimalField(max_digits=12, decimal_places=2)


class CapacitacionESSSerializer(serializers.Serializer):
    """Capacitaciones del empleado."""
    id = serializers.IntegerField()
    nombre = serializers.CharField()
    fecha_inicio = serializers.DateField(allow_null=True)
    fecha_fin = serializers.DateField(allow_null=True)
    estado = serializers.CharField()
    calificacion = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    certificado_url = serializers.CharField(allow_null=True, allow_blank=True)


class EvaluacionResumenESSSerializer(serializers.Serializer):
    """Resumen de evaluación de desempeño del empleado."""
    id = serializers.IntegerField()
    periodo = serializers.CharField()
    calificacion_general = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    estado = serializers.CharField()
    fecha_evaluacion = serializers.DateField(allow_null=True)
