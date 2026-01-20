"""
Servicios para el Centro de Notificaciones

Este módulo proporciona la lógica de negocio para el envío de notificaciones
en el sistema. Es consumido por otros módulos para notificar a los usuarios.

Ejemplo de uso desde otro módulo:
    from apps.audit_system.centro_notificaciones.services import NotificationService

    tipo = TipoNotificacion.objects.get(codigo='NUEVA_TAREA')
    NotificationService.send_notification(
        tipo=tipo,
        usuario=user,
        titulo="Nueva tarea asignada",
        mensaje="Se te ha asignado la tarea: Revisar documentos",
        url="/planeacion/tareas/123"
    )
"""

from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from typing import List, Dict, Optional, Union
from django.contrib.auth import get_user_model
import logging

from .models import (
    Notificacion,
    TipoNotificacion,
    PreferenciaNotificacion,
    NotificacionMasiva,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationService:
    """
    Servicio centralizado para envío de notificaciones.

    Este servicio maneja:
    - Notificaciones individuales a un usuario
    - Notificaciones masivas a múltiples usuarios
    - Respeto de preferencias de usuario (horarios, canales)
    - Envío por múltiples canales (App, Email, Push, SMS)
    - Renderizado de plantillas con variables
    """

    @staticmethod
    def send_notification(
        tipo: TipoNotificacion,
        usuario: User,
        titulo: str,
        mensaje: str,
        url: Optional[str] = None,
        datos_extra: Optional[Dict] = None,
        prioridad: str = 'normal',
        force: bool = False
    ) -> Optional[Notificacion]:
        """
        Envía una notificación individual a un usuario.

        Args:
            tipo: Instancia de TipoNotificacion
            usuario: Instancia de User destinatario
            titulo: Título de la notificación
            mensaje: Cuerpo del mensaje
            url: URL opcional para navegación al hacer clic
            datos_extra: Diccionario opcional con datos JSON adicionales
            prioridad: 'baja' | 'normal' | 'alta' | 'urgente' (default: 'normal')
            force: Si True, ignora preferencias de usuario (default: False)

        Returns:
            Notificacion instance si se creó, None si se bloqueó por preferencias

        Example:
            >>> tipo = TipoNotificacion.objects.get(codigo='NUEVA_TAREA')
            >>> notif = NotificationService.send_notification(
            ...     tipo=tipo,
            ...     usuario=request.user,
            ...     titulo="Nueva tarea asignada",
            ...     mensaje="Revisa la tarea urgente en el módulo de planeación",
            ...     url="/planeacion/tareas/456",
            ...     prioridad='alta'
            ... )
        """
        try:
            # Obtener preferencias del usuario para este tipo
            preferencias = PreferenciaNotificacion.objects.filter(
                usuario=usuario,
                tipo_notificacion=tipo
            ).first()

            # Verificar horario si no es forzado
            if not force and preferencias:
                if not NotificationService._is_within_schedule(preferencias):
                    logger.info(
                        f"Notificación bloqueada por horario para usuario {usuario.id}"
                    )
                    # TODO: Programar para el próximo horario válido
                    return None

            # Crear notificación en app (si el usuario lo permite)
            notificacion = None
            if force or not preferencias or preferencias.recibir_app:
                notificacion = Notificacion.objects.create(
                    tipo=tipo,
                    usuario=usuario,
                    titulo=titulo,
                    mensaje=mensaje,
                    url=url,
                    datos_extra=datos_extra,
                    prioridad=prioridad
                )
                logger.info(f"Notificación creada: {notificacion.id} para usuario {usuario.id}")

            # Enviar por email si aplica
            if tipo.es_email and (force or not preferencias or preferencias.recibir_email):
                NotificationService._send_email_notification(
                    usuario=usuario,
                    titulo=titulo,
                    mensaje=mensaje,
                    url=url
                )

            # Enviar push si aplica
            if tipo.es_push and (force or not preferencias or preferencias.recibir_push):
                NotificationService._send_push_notification(
                    usuario=usuario,
                    titulo=titulo,
                    mensaje=mensaje,
                    datos_extra=datos_extra
                )

            return notificacion

        except Exception as e:
            logger.error(f"Error enviando notificación: {str(e)}", exc_info=True)
            return None

    @staticmethod
    def send_bulk_notification(
        tipo: TipoNotificacion,
        usuarios: Union[List[User], 'QuerySet'],
        titulo: str,
        mensaje: str,
        url: Optional[str] = None,
        datos_extra: Optional[Dict] = None,
        prioridad: str = 'normal'
    ) -> Dict[str, int]:
        """
        Envía notificaciones a múltiples usuarios.

        Args:
            tipo: Instancia de TipoNotificacion
            usuarios: Lista o QuerySet de User instances
            titulo: Título de la notificación
            mensaje: Cuerpo del mensaje
            url: URL opcional para navegación
            datos_extra: Diccionario opcional con datos JSON
            prioridad: 'baja' | 'normal' | 'alta' | 'urgente'

        Returns:
            Dict con estadísticas: {'enviadas': int, 'bloqueadas': int, 'errores': int}

        Example:
            >>> tipo = TipoNotificacion.objects.get(codigo='MANTENIMIENTO_PROGRAMADO')
            >>> usuarios = User.objects.filter(is_active=True)
            >>> stats = NotificationService.send_bulk_notification(
            ...     tipo=tipo,
            ...     usuarios=usuarios,
            ...     titulo="Mantenimiento programado",
            ...     mensaje="El sistema estará en mantenimiento el 25/01 de 2-4am",
            ...     prioridad='alta'
            ... )
            >>> print(f"Enviadas: {stats['enviadas']}, Bloqueadas: {stats['bloqueadas']}")
        """
        stats = {'enviadas': 0, 'bloqueadas': 0, 'errores': 0}

        for usuario in usuarios:
            try:
                notif = NotificationService.send_notification(
                    tipo=tipo,
                    usuario=usuario,
                    titulo=titulo,
                    mensaje=mensaje,
                    url=url,
                    datos_extra=datos_extra,
                    prioridad=prioridad
                )
                if notif:
                    stats['enviadas'] += 1
                else:
                    stats['bloqueadas'] += 1
            except Exception as e:
                logger.error(f"Error enviando a usuario {usuario.id}: {str(e)}")
                stats['errores'] += 1

        logger.info(f"Envío masivo completado: {stats}")
        return stats

    @staticmethod
    def send_notification_by_role(
        tipo: TipoNotificacion,
        cargo_id: int,
        titulo: str,
        mensaje: str,
        url: Optional[str] = None,
        **kwargs
    ) -> Dict[str, int]:
        """
        Envía notificaciones a todos los usuarios con un cargo específico.

        Args:
            tipo: Instancia de TipoNotificacion
            cargo_id: ID del cargo (Cargo model)
            titulo: Título de la notificación
            mensaje: Cuerpo del mensaje
            url: URL opcional
            **kwargs: Argumentos adicionales para send_bulk_notification

        Returns:
            Dict con estadísticas de envío

        Example:
            >>> tipo = TipoNotificacion.objects.get(codigo='CAPACITACION_PROXIMA')
            >>> NotificationService.send_notification_by_role(
            ...     tipo=tipo,
            ...     cargo_id=5,  # ID del cargo "Operario"
            ...     titulo="Capacitación SST obligatoria",
            ...     mensaje="Todos los operarios deben asistir...",
            ...     prioridad='alta'
            ... )
        """
        usuarios = User.objects.filter(cargo_id=cargo_id, is_active=True)
        return NotificationService.send_bulk_notification(
            tipo=tipo,
            usuarios=usuarios,
            titulo=titulo,
            mensaje=mensaje,
            url=url,
            **kwargs
        )

    @staticmethod
    def send_notification_by_area(
        tipo: TipoNotificacion,
        area_id: int,
        titulo: str,
        mensaje: str,
        url: Optional[str] = None,
        **kwargs
    ) -> Dict[str, int]:
        """
        Envía notificaciones a todos los usuarios de un área específica.

        Args:
            tipo: Instancia de TipoNotificacion
            area_id: ID del área (Area model)
            titulo: Título de la notificación
            mensaje: Cuerpo del mensaje
            url: URL opcional
            **kwargs: Argumentos adicionales para send_bulk_notification

        Returns:
            Dict con estadísticas de envío

        Example:
            >>> tipo = TipoNotificacion.objects.get(codigo='REUNION_AREA')
            >>> NotificationService.send_notification_by_area(
            ...     tipo=tipo,
            ...     area_id=3,  # ID del área "Producción"
            ...     titulo="Reunión de área - Viernes 10am",
            ...     mensaje="Asistencia obligatoria para revisar KPIs del mes"
            ... )
        """
        usuarios = User.objects.filter(area_id=area_id, is_active=True)
        return NotificationService.send_bulk_notification(
            tipo=tipo,
            usuarios=usuarios,
            titulo=titulo,
            mensaje=mensaje,
            url=url,
            **kwargs
        )

    @staticmethod
    def render_template(
        template_string: str,
        context: Dict
    ) -> str:
        """
        Renderiza una plantilla con variables.

        Args:
            template_string: String con placeholders {variable}
            context: Diccionario con valores para las variables

        Returns:
            String renderizado

        Example:
            >>> template = "Hola {nombre}, tienes {count} tareas pendientes"
            >>> resultado = NotificationService.render_template(
            ...     template,
            ...     {'nombre': 'Juan', 'count': 5}
            ... )
            >>> print(resultado)
            'Hola Juan, tienes 5 tareas pendientes'
        """
        try:
            return template_string.format(**context)
        except KeyError as e:
            logger.warning(f"Variable faltante en template: {e}")
            return template_string
        except Exception as e:
            logger.error(f"Error renderizando template: {e}")
            return template_string

    @staticmethod
    def _is_within_schedule(preferencias: PreferenciaNotificacion) -> bool:
        """
        Verifica si la hora actual está dentro del horario permitido.

        Args:
            preferencias: Instancia de PreferenciaNotificacion

        Returns:
            True si está dentro del horario o no hay horario configurado
        """
        if not preferencias.horario_inicio or not preferencias.horario_fin:
            return True

        now = timezone.now().time()
        return preferencias.horario_inicio <= now <= preferencias.horario_fin

    @staticmethod
    def _send_email_notification(
        usuario: User,
        titulo: str,
        mensaje: str,
        url: Optional[str] = None
    ) -> bool:
        """
        Envía notificación por email.

        Args:
            usuario: Usuario destinatario
            titulo: Título del email
            mensaje: Cuerpo del mensaje
            url: URL opcional para incluir en el email

        Returns:
            True si se envió correctamente
        """
        try:
            # Construir cuerpo del email
            email_body = mensaje
            if url:
                base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3010')
                full_url = f"{base_url}{url}"
                email_body += f"\n\nVer más: {full_url}"

            # Enviar email
            send_mail(
                subject=f"[StrateKaz] {titulo}",
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[usuario.email],
                fail_silently=False,
            )
            logger.info(f"Email enviado a {usuario.email}")
            return True

        except Exception as e:
            logger.error(f"Error enviando email a {usuario.email}: {str(e)}")
            return False

    @staticmethod
    def _send_push_notification(
        usuario: User,
        titulo: str,
        mensaje: str,
        datos_extra: Optional[Dict] = None
    ) -> bool:
        """
        Envía notificación push.

        TODO: Implementar integración con Firebase Cloud Messaging (FCM)

        Args:
            usuario: Usuario destinatario
            titulo: Título de la notificación push
            mensaje: Cuerpo del mensaje
            datos_extra: Datos adicionales para la notificación

        Returns:
            True si se envió correctamente
        """
        # TODO: Implementar con Firebase Cloud Messaging
        logger.info(f"Push notification pendiente de implementar para usuario {usuario.id}")
        return False

    @staticmethod
    def mark_as_read(notificacion_id: int) -> bool:
        """
        Marca una notificación como leída.

        Args:
            notificacion_id: ID de la notificación

        Returns:
            True si se marcó correctamente
        """
        try:
            notificacion = Notificacion.objects.get(id=notificacion_id)
            notificacion.marcar_leida()
            return True
        except Notificacion.DoesNotExist:
            logger.warning(f"Notificación {notificacion_id} no existe")
            return False

    @staticmethod
    def mark_all_as_read(usuario_id: int) -> int:
        """
        Marca todas las notificaciones de un usuario como leídas.

        Args:
            usuario_id: ID del usuario

        Returns:
            Número de notificaciones marcadas
        """
        count = Notificacion.objects.filter(
            usuario_id=usuario_id,
            esta_leida=False
        ).update(
            esta_leida=True,
            fecha_lectura=timezone.now()
        )
        logger.info(f"{count} notificaciones marcadas como leídas para usuario {usuario_id}")
        return count

    @staticmethod
    def get_unread_count(usuario_id: int) -> int:
        """
        Obtiene el contador de notificaciones no leídas.

        Args:
            usuario_id: ID del usuario

        Returns:
            Número de notificaciones no leídas
        """
        return Notificacion.objects.filter(
            usuario_id=usuario_id,
            esta_leida=False,
            esta_archivada=False
        ).count()
