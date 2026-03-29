"""
Services: AuditSystem — Contrato público del módulo.

Otros módulos NUNCA importan directamente de sub-apps de audit_system.
En su lugar, usan estos services como API interna.

Uso:
    from apps.audit_system.services import AuditSystemService

    # Registrar acceso
    AuditSystemService.log_acceso(user, request, 'login')

    # Registrar cambio manual (fuera de ViewSet)
    AuditSystemService.log_cambio(user, instance, 'modificar', cambios, request)

    # Registrar consulta sensible
    AuditSystemService.log_consulta(user, request, 'riesgos', '/api/riesgos/')

    # Crear notificación
    AuditSystemService.crear_notificacion(user, tipo_code, titulo, mensaje)
"""
import logging

logger = logging.getLogger(__name__)


class AuditSystemService:
    """Contrato público del módulo audit_system."""

    # ═══════════════════════════════════════════════════
    # LOGS DE ACCESO
    # ═══════════════════════════════════════════════════

    @staticmethod
    def log_acceso(usuario, request, tipo_evento, fue_exitoso=True, mensaje_error=None):
        """
        Registra un evento de acceso al sistema.

        Args:
            usuario: User instance (o None para login fallido)
            request: HttpRequest
            tipo_evento: 'login' | 'logout' | 'login_fallido' | 'sesion_expirada' | 'cambio_password'
            fue_exitoso: bool
            mensaje_error: str opcional
        """
        try:
            from apps.audit_system.logs_sistema.signals import _create_log_acceso
            _create_log_acceso(usuario, request, tipo_evento, fue_exitoso, mensaje_error)
        except Exception as e:
            logger.error(f"AuditSystemService.log_acceso error: {e}")

    # ═══════════════════════════════════════════════════
    # LOGS DE CAMBIOS
    # ═══════════════════════════════════════════════════

    @staticmethod
    def log_cambio(usuario, instance, accion, cambios, request=None):
        """
        Registra un cambio en un modelo (para uso fuera de ViewSets).

        Args:
            usuario: User que realizó el cambio
            instance: Instancia del modelo modificado
            accion: 'crear' | 'modificar' | 'eliminar'
            cambios: dict con formato {"campo": {"old": val, "new": val}}
            request: HttpRequest opcional (para obtener IP)
        """
        try:
            from django.contrib.contenttypes.models import ContentType
            from apps.audit_system.logs_sistema.models import LogCambio
            from apps.audit_system.logs_sistema.mixins import _get_client_ip, _get_audit_config, _filter_sensitive_fields

            content_type = ContentType.objects.get_for_model(instance)

            # Verificar configuración
            config = _get_audit_config(content_type)
            if config:
                action_map = {
                    'crear': 'auditar_creacion',
                    'modificar': 'auditar_modificacion',
                    'eliminar': 'auditar_eliminacion',
                }
                flag = action_map.get(accion)
                if flag and not getattr(config, flag, True):
                    return
                cambios = _filter_sensitive_fields(cambios, config)

            if not cambios:
                return

            LogCambio.objects.create(
                usuario=usuario,
                content_type=content_type,
                object_id=str(instance.pk),
                object_repr=str(instance)[:500],
                accion=accion,
                cambios=cambios,
                ip_address=_get_client_ip(request) if request else None,
            )
        except Exception as e:
            logger.error(f"AuditSystemService.log_cambio error: {e}")

    # ═══════════════════════════════════════════════════
    # LOGS DE CONSULTAS
    # ═══════════════════════════════════════════════════

    @staticmethod
    def log_consulta(usuario, request, modulo, endpoint, parametros=None,
                     registros_accedidos=0, fue_exportacion=False, formato_exportacion=None):
        """
        Registra una consulta o exportación sensible.

        Args:
            usuario: User que realizó la consulta
            request: HttpRequest
            modulo: str — nombre del módulo consultado
            endpoint: str — URL del endpoint
            parametros: dict — filtros/params de la consulta
            registros_accedidos: int
            fue_exportacion: bool
            formato_exportacion: 'excel' | 'pdf' | 'csv' | 'json'
        """
        try:
            from apps.audit_system.logs_sistema.models import LogConsulta
            from apps.audit_system.logs_sistema.mixins import _get_client_ip

            LogConsulta.objects.create(
                usuario=usuario,
                modulo=modulo,
                endpoint=endpoint[:500],
                parametros=parametros or {},
                registros_accedidos=registros_accedidos,
                fue_exportacion=fue_exportacion,
                formato_exportacion=formato_exportacion,
                ip_address=_get_client_ip(request),
            )
        except Exception as e:
            logger.error(f"AuditSystemService.log_consulta error: {e}")

    # ═══════════════════════════════════════════════════
    # NOTIFICACIONES
    # ═══════════════════════════════════════════════════

    @staticmethod
    def crear_notificacion(usuario, tipo_code, titulo, mensaje, url_accion=None, prioridad='media'):
        """
        Crea una notificación in-app para un usuario.

        Args:
            usuario: User destinatario
            tipo_code: str código del TipoNotificacion (ej: 'sistema', 'tarea', 'alerta')
            titulo: str
            mensaje: str
            url_accion: str opcional — URL para el botón de acción
            prioridad: 'baja' | 'media' | 'alta' | 'urgente'
        """
        try:
            from apps.audit_system.centro_notificaciones.models import (
                TipoNotificacion, Notificacion,
            )

            tipo = TipoNotificacion.objects.filter(codigo=tipo_code).first()
            Notificacion.objects.create(
                usuario=usuario,
                tipo=tipo,
                titulo=titulo[:200],
                mensaje=mensaje,
                url_accion=url_accion or '',
                prioridad=prioridad,
            )
        except Exception as e:
            logger.error(f"AuditSystemService.crear_notificacion error: {e}")

    # ═══════════════════════════════════════════════════
    # ALERTAS
    # ═══════════════════════════════════════════════════

    @staticmethod
    def crear_alerta(tipo_alerta_id, titulo, descripcion, severidad='media',
                     modulo=None, objeto_id=None, datos_contexto=None):
        """
        Genera una alerta manualmente (las automáticas se crean via Celery).

        Args:
            tipo_alerta_id: int — ID del TipoAlerta
            titulo: str
            descripcion: str
            severidad: 'baja' | 'media' | 'alta' | 'critica'
            modulo: str opcional
            objeto_id: str opcional
            datos_contexto: dict opcional
        """
        try:
            from apps.audit_system.config_alertas.models import AlertaGenerada

            AlertaGenerada.objects.create(
                tipo_alerta_id=tipo_alerta_id,
                titulo=titulo[:200],
                descripcion=descripcion,
                severidad=severidad,
                modulo=modulo or '',
                objeto_id=objeto_id or '',
                datos_contexto=datos_contexto or {},
            )
        except Exception as e:
            logger.error(f"AuditSystemService.crear_alerta error: {e}")
