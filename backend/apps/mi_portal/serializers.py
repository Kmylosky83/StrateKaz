"""
Serializers para Mi Portal — Employee Self-Service (ESS).

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

    # Campos editables por el colaborador (ESS)
    email_personal = serializers.CharField(read_only=True, default='')
    celular = serializers.SerializerMethodField()           # Colaborador.telefono_movil
    telefono = serializers.SerializerMethodField()          # InfoPersonal.telefono_fijo
    direccion = serializers.SerializerMethodField()         # InfoPersonal.direccion
    ciudad = serializers.SerializerMethodField()            # InfoPersonal.ciudad
    contacto_emergencia_nombre = serializers.SerializerMethodField()
    contacto_emergencia_telefono = serializers.SerializerMethodField()
    contacto_emergencia_parentesco = serializers.SerializerMethodField()

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
