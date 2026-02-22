"""
Servicio de Email para Notificaciones
Sistema de Gestión StrateKaz

Servicio centralizado que:
1. Lee la configuración de IntegracionExterna (EMAIL type)
2. Configura Django email backend dinámicamente
3. Envía emails usando templates HTML

Uso:
    from apps.audit_system.centro_notificaciones.email_service import EmailService

    # Enviar notificación de firma pendiente
    EmailService.send_signature_pending(
        to_email='usuario@empresa.com',
        user_name='Juan Pérez',
        document_title='Política Integral v2.0',
        action_url='https://app.stratekaz.com/firmas/123'
    )
"""
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.core.mail.backends.smtp import EmailBackend as SMTPBackend
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """
    Servicio de Email centralizado con soporte para:
    - Configuración dinámica desde IntegracionExterna
    - Templates HTML responsive
    - Fallback a settings.py
    """

    @classmethod
    def get_email_config(cls):
        """
        Obtiene la configuración de email activa desde IntegracionExterna.

        Returns:
            dict: Configuración de email o None si no está configurada
        """
        try:
            from apps.gestion_estrategica.configuracion.models import IntegracionExterna

            # Buscar integración de email activa
            integracion = IntegracionExterna.objects.filter(
                tipo_servicio__code='EMAIL',
                is_active=True
            ).first()

            # tipo_servicio_legacy fue eliminado en migracion 0004

            if integracion:
                return {
                    'host': integracion.get_config_value('host', settings.EMAIL_HOST),
                    'port': int(integracion.get_config_value('port', settings.EMAIL_PORT)),
                    'use_tls': integracion.get_config_value('use_tls', settings.EMAIL_USE_TLS),
                    'username': integracion.get_credential('username') or settings.EMAIL_HOST_USER,
                    'password': integracion.get_credential('password') or settings.EMAIL_HOST_PASSWORD,
                    'from_email': integracion.get_config_value('from_email', settings.DEFAULT_FROM_EMAIL),
                    'from_name': integracion.get_config_value('from_name', 'StrateKaz'),
                }
        except Exception as e:
            logger.warning(f"No se pudo obtener config de IntegracionExterna: {e}")

        # Fallback a settings
        return {
            'host': settings.EMAIL_HOST,
            'port': settings.EMAIL_PORT,
            'use_tls': settings.EMAIL_USE_TLS,
            'username': settings.EMAIL_HOST_USER,
            'password': settings.EMAIL_HOST_PASSWORD,
            'from_email': getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@stratekaz.com'),
            'from_name': 'StrateKaz',
        }

    @classmethod
    def get_connection(cls):
        """Obtiene una conexión SMTP con la configuración dinámica."""
        config = cls.get_email_config()

        return SMTPBackend(
            host=config['host'],
            port=config['port'],
            username=config['username'],
            password=config['password'],
            use_tls=config.get('use_tls', True),
            fail_silently=False,
        )

    @classmethod
    def send_email(cls, to_email, subject, template_name, context, from_email=None):
        """
        Envía un email usando template HTML.

        Args:
            to_email: Email destino (str o list)
            subject: Asunto del email
            template_name: Nombre del template (sin path ni extensión)
            context: Diccionario de contexto para el template
            from_email: Email remitente (opcional, usa config si no se especifica)

        Returns:
            bool: True si se envió correctamente
        """
        try:
            config = cls.get_email_config()

            if not from_email:
                from_name = config.get('from_name', 'StrateKaz')
                from_email_addr = config.get('from_email', 'noreply@stratekaz.com')
                from_email = f"{from_name} <{from_email_addr}>"

            # Agregar variables globales al contexto
            context.setdefault('frontend_url', getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com'))
            context.setdefault('current_year', str(__import__('datetime').date.today().year))

            # Renderizar template
            template_path = f"emails/{template_name}.html"
            html_content = render_to_string(template_path, context)

            # Crear email con alternativa HTML
            to_list = [to_email] if isinstance(to_email, str) else to_email

            msg = EmailMultiAlternatives(
                subject=f"{settings.EMAIL_SUBJECT_PREFIX}{subject}",
                body=html_content,  # Fallback texto plano
                from_email=from_email,
                to=to_list,
                connection=cls.get_connection(),
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()

            logger.info(f"Email enviado a {to_email}: {subject}")
            return True

        except Exception as e:
            logger.error(f"Error enviando email a {to_email}: {e}")
            return False

    # =========================================================================
    # MÉTODOS DE CONVENIENCIA PARA FIRMAS
    # =========================================================================

    @classmethod
    def send_signature_pending(cls, to_email, user_name, document_title, action_url,
                               document_type=None, requested_by=None, due_date=None, message=None):
        """Envía notificación de firma pendiente."""
        return cls.send_email(
            to_email=to_email,
            subject=f"Firma Pendiente: {document_title}",
            template_name="signature_pending",
            context={
                'user_name': user_name,
                'document_title': document_title,
                'document_type': document_type,
                'requested_by': requested_by,
                'due_date': due_date,
                'message': message,
                'action_url': action_url,
            }
        )

    @classmethod
    def send_signature_completed(cls, to_email, user_name, document_title, signed_by,
                                 signed_at, action_url, signature_hash=None):
        """Envía notificación de firma completada."""
        return cls.send_email(
            to_email=to_email,
            subject=f"Firma Completada: {document_title}",
            template_name="signature_completed",
            context={
                'user_name': user_name,
                'document_title': document_title,
                'signed_by': signed_by,
                'signed_at': signed_at,
                'signature_hash': signature_hash,
                'action_url': action_url,
            }
        )

    @classmethod
    def send_signature_rejected(cls, to_email, user_name, document_title, rejected_by,
                                rejected_at, action_url, rejection_reason=None):
        """Envía notificación de firma rechazada."""
        return cls.send_email(
            to_email=to_email,
            subject=f"Firma Rechazada: {document_title}",
            template_name="signature_rejected",
            context={
                'user_name': user_name,
                'document_title': document_title,
                'rejected_by': rejected_by,
                'rejected_at': rejected_at,
                'rejection_reason': rejection_reason,
                'action_url': action_url,
            }
        )

    @classmethod
    def send_signature_reminder(cls, to_email, user_name, document_title, action_url,
                                days_pending=None, due_date=None, requested_by=None):
        """Envía recordatorio de firma pendiente."""
        return cls.send_email(
            to_email=to_email,
            subject=f"Recordatorio: Firma Pendiente - {document_title}",
            template_name="signature_reminder",
            context={
                'user_name': user_name,
                'document_title': document_title,
                'days_pending': days_pending,
                'due_date': due_date,
                'requested_by': requested_by,
                'action_url': action_url,
            }
        )

    @classmethod
    def send_delegation_notification(cls, to_email, user_name, document_title, delegated_by,
                                     action_url, delegation_reason=None, expiry_date=None):
        """Envía notificación de delegación de firma."""
        return cls.send_email(
            to_email=to_email,
            subject=f"Delegación de Firma: {document_title}",
            template_name="delegation_notification",
            context={
                'user_name': user_name,
                'document_title': document_title,
                'delegated_by': delegated_by,
                'delegation_reason': delegation_reason,
                'expiry_date': expiry_date,
                'action_url': action_url,
            }
        )
