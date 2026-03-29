"""
AuditLogMixin — Registra automáticamente LogCambio en operaciones CRUD.

Uso:
    class MiViewSet(AuditLogMixin, TenantModelViewSetMixin, viewsets.ModelViewSet):
        queryset = MiModelo.objects.all()
        serializer_class = MiSerializer

El mixin captura:
- CREATE: registra todos los campos del objeto creado
- UPDATE/PARTIAL_UPDATE: registra solo los campos que cambiaron (diff)
- DELETE: registra el repr del objeto eliminado

Respeta ConfiguracionAuditoria: si el modelo tiene una configuración
con auditar_creacion=False, la creación no se registra, etc.
Los campos sensibles configurados se omiten del log.
"""
import logging

from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    """Obtiene la IP real del cliente, considerando proxies."""
    if request is None:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


_audit_config_cache = {}


def _get_audit_config(content_type):
    """
    Obtiene la ConfiguracionAuditoria para un ContentType.

    Retorna None si no hay configuración (se audita todo por defecto).
    Cachea en memoria por (app_label, model) — se invalida al reiniciar el proceso.
    """
    cache_key = (content_type.app_label, content_type.model)
    if cache_key in _audit_config_cache:
        return _audit_config_cache[cache_key]

    try:
        from apps.audit_system.logs_sistema.models import ConfiguracionAuditoria
        config = ConfiguracionAuditoria.objects.filter(
            modulo=content_type.app_label,
            modelo=content_type.model,
        ).first()
        _audit_config_cache[cache_key] = config
        return config
    except Exception:
        return None


def _filter_sensitive_fields(changes, config):
    """Elimina campos sensibles del diccionario de cambios."""
    if not config or not config.campos_sensibles:
        return changes
    sensitive = set(config.campos_sensibles)
    return {k: v for k, v in changes.items() if k not in sensitive}


class AuditLogMixin:
    """
    Mixin para ViewSets que registra LogCambio en cada operación CRUD.

    Se inserta ANTES de TenantModelViewSetMixin en el MRO:
        class MiViewSet(AuditLogMixin, TenantModelViewSetMixin, ModelViewSet):

    Atributos opcionales del ViewSet:
        audit_enabled = True/False  (default True)
        audit_exclude_fields = ['campo1', 'campo2']  (campos a ignorar en diff)
    """

    audit_enabled = True
    audit_exclude_fields = []

    def perform_create(self, serializer):
        """Intercepta creación para registrar LogCambio."""
        super().perform_create(serializer)
        if not self.audit_enabled:
            return
        instance = serializer.instance
        if instance and instance.pk:
            self._log_cambio(instance, 'crear', cambios=self._instance_to_dict(instance))

    def perform_update(self, serializer):
        """Intercepta actualización para registrar LogCambio con diff."""
        instance = serializer.instance
        old_values = self._instance_to_dict(instance) if self.audit_enabled else {}
        super().perform_update(serializer)
        if not self.audit_enabled:
            return
        instance.refresh_from_db()
        new_values = self._instance_to_dict(instance)
        cambios = self._compute_diff(old_values, new_values)
        if cambios:
            self._log_cambio(instance, 'modificar', cambios=cambios)

    def perform_destroy(self, instance):
        """Intercepta eliminación para registrar LogCambio."""
        obj_repr = str(instance)
        obj_id = str(instance.pk)
        content_type = ContentType.objects.get_for_model(instance)
        if self.audit_enabled:
            self._log_cambio_raw(
                content_type=content_type,
                object_id=obj_id,
                object_repr=obj_repr,
                accion='eliminar',
                cambios={'eliminado': {'old': obj_repr, 'new': None}},
            )
        super().perform_destroy(instance)

    # ─────────────────────────── helpers ───────────────────────────

    def _log_cambio(self, instance, accion, cambios):
        """Crea un LogCambio para una instancia."""
        content_type = ContentType.objects.get_for_model(instance)
        self._log_cambio_raw(
            content_type=content_type,
            object_id=str(instance.pk),
            object_repr=str(instance)[:500],
            accion=accion,
            cambios=cambios,
        )

    def _log_cambio_raw(self, content_type, object_id, object_repr, accion, cambios):
        """Crea un LogCambio verificando ConfiguracionAuditoria."""
        try:
            from apps.audit_system.logs_sistema.models import LogCambio

            # Verificar configuración de auditoría
            config = _get_audit_config(content_type)
            if config:
                action_map = {
                    'crear': 'auditar_creacion',
                    'modificar': 'auditar_modificacion',
                    'eliminar': 'auditar_eliminacion',
                }
                flag = action_map.get(accion)
                if flag and not getattr(config, flag, True):
                    return  # Auditoría deshabilitada para esta acción

                # Filtrar campos sensibles
                cambios = _filter_sensitive_fields(cambios, config)

            if not cambios:
                return

            request = self.request
            LogCambio.objects.create(
                usuario=request.user if request.user.is_authenticated else None,
                content_type=content_type,
                object_id=object_id,
                object_repr=object_repr[:500],
                accion=accion,
                cambios=cambios,
                ip_address=_get_client_ip(request),
            )
        except Exception as e:
            # Nunca bloquear operación CRUD por un fallo de auditoría
            logger.error(f"Error creando LogCambio ({accion} {object_repr}): {e}")

    def _instance_to_dict(self, instance):
        """Convierte una instancia a dict de campos serializables."""
        data = {}
        exclude = set(self.audit_exclude_fields or [])
        # Campos a excluir siempre (no aportan valor de auditoría)
        exclude.update({'id', 'created_at', 'updated_at', 'deleted_at', 'is_deleted'})

        for field in instance._meta.concrete_fields:
            if field.name in exclude:
                continue
            value = getattr(instance, field.attname, None)
            # Serializar a tipos JSON-safe
            if hasattr(value, 'isoformat'):
                value = value.isoformat()
            elif hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool, type(None))):
                value = str(value)
            data[field.name] = value
        return data

    def _compute_diff(self, old, new):
        """Calcula las diferencias entre dos dicts."""
        diff = {}
        all_keys = set(old.keys()) | set(new.keys())
        exclude = set(self.audit_exclude_fields or [])
        exclude.update({'id', 'created_at', 'updated_at', 'deleted_at', 'is_deleted'})

        for key in all_keys:
            if key in exclude:
                continue
            old_val = old.get(key)
            new_val = new.get(key)
            if old_val != new_val:
                diff[key] = {'old': old_val, 'new': new_val}
        return diff
