"""
Serializers para Employee Self-Service (ESS) - Portal Empleado.

Versiones limitadas que solo exponen datos propios del empleado,
excluyendo información sensible de otros colaboradores.

Mapeo de modelos:
  Colaborador: email_personal, telefono_movil, foto
  InfoPersonal (OneToOne via info_personal):
    direccion, ciudad, telefono_fijo,
    nombre_contacto_emergencia, telefono_contacto_emergencia,
    parentesco_contacto_emergencia
"""
from rest_framework import serializers


class ColaboradorESSSerializer(serializers.Serializer):
    """Perfil del colaborador — solo lectura, datos propios."""

    id = serializers.IntegerField(read_only=True)
    nombre_completo = serializers.SerializerMethodField()
    numero_identificacion = serializers.CharField(read_only=True)
    tipo_identificacion = serializers.CharField(read_only=True)
    cargo_nombre = serializers.SerializerMethodField()
    area_nombre = serializers.SerializerMethodField()
    fecha_ingreso = serializers.DateField(read_only=True)
    estado = serializers.CharField(read_only=True)

    # Avatar — URL absoluta cuando hay request en contexto
    foto_url = serializers.SerializerMethodField()

    # Email del usuario del sistema (read-only)
    email = serializers.SerializerMethodField()

    # Campos editables por el colaborador (ESS) ─────────────────────────────
    email_personal = serializers.CharField(read_only=True, default='')
    celular = serializers.SerializerMethodField()           # Colaborador.telefono_movil
    telefono = serializers.SerializerMethodField()          # InfoPersonal.telefono_fijo
    direccion = serializers.SerializerMethodField()         # InfoPersonal.direccion
    ciudad = serializers.SerializerMethodField()            # InfoPersonal.ciudad
    contacto_emergencia_nombre = serializers.SerializerMethodField()
    contacto_emergencia_telefono = serializers.SerializerMethodField()
    contacto_emergencia_parentesco = serializers.SerializerMethodField()

    # ── Helpers directos ─────────────────────────────────────────────────────

    def get_nombre_completo(self, obj):
        return obj.get_nombre_completo()

    def get_cargo_nombre(self, obj):
        return obj.cargo.name if obj.cargo else None

    def get_area_nombre(self, obj):
        return obj.area.name if obj.area else None

    def get_email(self, obj):
        if hasattr(obj, 'usuario') and obj.usuario:
            return obj.usuario.email
        return None

    def get_foto_url(self, obj):
        if not obj.foto:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.foto.url)
        return obj.foto.url

    def get_celular(self, obj):
        return getattr(obj, 'telefono_movil', '') or ''

    # ── InfoPersonal helpers ─────────────────────────────────────────────────

    def _get_info(self, obj):
        return getattr(obj, 'info_personal', None)

    def get_telefono(self, obj):
        info = self._get_info(obj)
        return (getattr(info, 'telefono_fijo', '') or '') if info else ''

    def get_direccion(self, obj):
        info = self._get_info(obj)
        return (getattr(info, 'direccion', '') or '') if info else ''

    def get_ciudad(self, obj):
        info = self._get_info(obj)
        return (getattr(info, 'ciudad', '') or '') if info else ''

    def get_contacto_emergencia_nombre(self, obj):
        info = self._get_info(obj)
        return (getattr(info, 'nombre_contacto_emergencia', '') or '') if info else ''

    def get_contacto_emergencia_telefono(self, obj):
        info = self._get_info(obj)
        return (getattr(info, 'telefono_contacto_emergencia', '') or '') if info else ''

    def get_contacto_emergencia_parentesco(self, obj):
        info = self._get_info(obj)
        return (getattr(info, 'parentesco_contacto_emergencia', '') or '') if info else ''


class InfoPersonalUpdateESSSerializer(serializers.Serializer):
    """
    Campos que el empleado puede actualizar de su perfil.

    Mapeo backend:
      celular        → Colaborador.telefono_movil
      email_personal → Colaborador.email_personal
      telefono       → InfoPersonal.telefono_fijo
      direccion      → InfoPersonal.direccion
      ciudad         → InfoPersonal.ciudad
      contacto_emergencia_nombre    → InfoPersonal.nombre_contacto_emergencia
      contacto_emergencia_telefono  → InfoPersonal.telefono_contacto_emergencia
      contacto_emergencia_parentesco→ InfoPersonal.parentesco_contacto_emergencia
    """
    celular = serializers.CharField(max_length=15, required=False, allow_blank=True)
    email_personal = serializers.EmailField(max_length=254, required=False, allow_blank=True)
    telefono = serializers.CharField(max_length=15, required=False, allow_blank=True)
    direccion = serializers.CharField(max_length=200, required=False, allow_blank=True)
    ciudad = serializers.CharField(max_length=100, required=False, allow_blank=True)
    contacto_emergencia_nombre = serializers.CharField(max_length=200, required=False, allow_blank=True)
    contacto_emergencia_telefono = serializers.CharField(max_length=15, required=False, allow_blank=True)
    contacto_emergencia_parentesco = serializers.CharField(max_length=50, required=False, allow_blank=True)


# ── Serializers restantes ────────────────────────────────────────────────────

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
