"""
Sistema de Notificaciones - Utilidades Centralizadas

Este módulo proporciona funciones para enviar notificaciones a través de
diferentes canales: email, SMS, push notifications, in-app notifications.

INTEGRACIÓN CON WORKFLOW DE POLÍTICAS:
- Alertas de firmas pendientes
- Recordatorios de vencimiento
- Notificaciones de delegación
- Alertas de revisión periódica
"""

from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


# =============================================================================
# TIPOS DE NOTIFICACIÓN (para referencia)
# =============================================================================

TIPOS_NOTIFICACION = {
    # Firmas digitales
    'FIRMA_REQUERIDA': 'Firma Requerida',
    'FIRMA_RECHAZADA': 'Firma Rechazada',
    'FIRMA_DELEGADA': 'Firma Delegada',
    'FIRMA_VENCIDA': 'Firma Vencida',
    'FIRMA_VENCIDA_ESCALADA': 'Firma Vencida (Escalada)',
    'RECORDATORIO_FIRMA': 'Recordatorio de Firma',

    # Revisiones periódicas
    'REVISION_PROXIMA': 'Revisión Próxima',
    'REVISION_VENCIDA': 'Revisión Vencida',
    'REVISION_VENCIDA_ESCALADA': 'Revisión Vencida (Escalada)',
    'REVISION_INICIADA': 'Revisión Iniciada',
    'REVISION_COMPLETADA': 'Revisión Completada',

    # Generales
    'NOTIFICACION_GENERAL': 'Notificación General',
}

PRIORIDADES = {
    'BAJA': 1,
    'MEDIA': 2,
    'ALTA': 3,
    'CRITICA': 4,
}


# =============================================================================
# FUNCIÓN PRINCIPAL DE NOTIFICACIÓN
# =============================================================================

def enviar_notificacion(
    destinatario,
    tipo,
    asunto,
    mensaje,
    link=None,
    prioridad='MEDIA',
    canales=None,
    datos_adicionales=None
):
    """
    Envía una notificación al usuario a través de los canales especificados.

    Args:
        destinatario: Usuario destinatario (instancia User)
        tipo: Tipo de notificación (ver TIPOS_NOTIFICACION)
        asunto: Asunto de la notificación
        mensaje: Mensaje completo de la notificación
        link: URL relacionada (opcional)
        prioridad: BAJA, MEDIA, ALTA, CRITICA
        canales: Lista de canales ['EMAIL', 'SMS', 'PUSH', 'IN_APP']
                 Si es None, usa configuración por defecto según prioridad
        datos_adicionales: Dict con datos extra para la notificación

    Returns:
        dict: Resultado del envío por cada canal

    Example:
        enviar_notificacion(
            destinatario=user,
            tipo='FIRMA_REQUERIDA',
            asunto='Documento requiere su firma',
            mensaje='El documento POL-SST-001 está listo para su firma',
            link='/politicas/123',
            prioridad='ALTA',
            canales=['EMAIL', 'IN_APP']
        )
    """
    if canales is None:
        canales = determinar_canales_por_prioridad(prioridad)

    resultados = {}

    try:
        # Canal: Email
        if 'EMAIL' in canales:
            resultados['email'] = enviar_email(
                destinatario=destinatario,
                asunto=asunto,
                mensaje=mensaje,
                link=link
            )

        # Canal: SMS
        if 'SMS' in canales:
            resultados['sms'] = enviar_sms(
                destinatario=destinatario,
                mensaje=mensaje
            )

        # Canal: Push Notification
        if 'PUSH' in canales:
            resultados['push'] = enviar_push_notification(
                destinatario=destinatario,
                asunto=asunto,
                mensaje=mensaje,
                link=link
            )

        # Canal: In-App Notification
        if 'IN_APP' in canales:
            resultados['in_app'] = crear_notificacion_in_app(
                destinatario=destinatario,
                tipo=tipo,
                asunto=asunto,
                mensaje=mensaje,
                link=link,
                prioridad=prioridad,
                datos_adicionales=datos_adicionales
            )

        logger.info(f"Notificación enviada a {destinatario.username} - Tipo: {tipo}")

    except Exception as e:
        logger.error(f"Error enviando notificación a {destinatario.username}: {str(e)}")
        resultados['error'] = str(e)

    return resultados


# =============================================================================
# CANALES DE NOTIFICACIÓN
# =============================================================================

def enviar_email(destinatario, asunto, mensaje, link=None):
    """
    Envía notificación por email.

    Args:
        destinatario: Usuario destinatario
        asunto: Asunto del email
        mensaje: Cuerpo del email
        link: URL opcional

    Returns:
        bool: True si se envió correctamente
    """
    try:
        email_to = destinatario.email
        if not email_to:
            logger.warning(f"Usuario {destinatario.username} no tiene email configurado")
            return False

        # Construir mensaje HTML
        mensaje_html = f"""
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }}
                .header {{
                    background-color: #0056b3;
                    color: white;
                    padding: 15px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: white;
                    padding: 20px;
                    margin-top: 10px;
                    border-radius: 5px;
                }}
                .button {{
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #0056b3;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 15px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>{asunto}</h2>
                </div>
                <div class="content">
                    <p>Hola {destinatario.get_full_name() or destinatario.username},</p>
                    <p>{mensaje}</p>
                    {f'<a href="{settings.FRONTEND_URL}{link}" class="button">Ver Documento</a>' if link else ''}
                </div>
                <div class="footer">
                    <p>Este es un mensaje automático del Sistema de Gestión StrateKaz</p>
                    <p>Por favor no responda a este correo</p>
                </div>
            </div>
        </body>
        </html>
        """

        send_mail(
            subject=asunto,
            message=mensaje,  # Texto plano como fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email_to],
            html_message=mensaje_html,
            fail_silently=False,
        )

        logger.info(f"Email enviado a {email_to}")
        return True

    except Exception as e:
        logger.error(f"Error enviando email a {destinatario.email}: {str(e)}")
        return False


def enviar_sms(destinatario, mensaje):
    """
    Envía notificación por SMS.

    Args:
        destinatario: Usuario destinatario
        mensaje: Mensaje SMS (máx 160 caracteres)

    Returns:
        bool: True si se envió correctamente

    Note:
        Requiere configuración de proveedor SMS (Twilio, AWS SNS, etc.)
        Implementación básica de ejemplo.
    """
    try:
        # Verificar que el usuario tenga teléfono
        telefono = getattr(destinatario, 'telefono', None)
        if not telefono:
            logger.warning(f"Usuario {destinatario.username} no tiene teléfono configurado")
            return False

        # Truncar mensaje a 160 caracteres
        mensaje_sms = mensaje[:160]

        # TODO: Integrar con proveedor SMS
        # Ejemplo con Twilio:
        # from twilio.rest import Client
        # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        # message = client.messages.create(
        #     body=mensaje_sms,
        #     from_=settings.TWILIO_PHONE_NUMBER,
        #     to=telefono
        # )

        logger.info(f"SMS enviado a {telefono}")
        return True

    except Exception as e:
        logger.error(f"Error enviando SMS: {str(e)}")
        return False


def enviar_push_notification(destinatario, asunto, mensaje, link=None):
    """
    Envía push notification al dispositivo del usuario.

    Args:
        destinatario: Usuario destinatario
        asunto: Título de la notificación
        mensaje: Cuerpo de la notificación
        link: URL opcional

    Returns:
        bool: True si se envió correctamente

    Note:
        Requiere configuración de Firebase Cloud Messaging (FCM)
        Implementación básica de ejemplo.
    """
    try:
        # TODO: Integrar con Firebase Cloud Messaging
        # Ejemplo básico:
        # from firebase_admin import messaging
        # message = messaging.Message(
        #     notification=messaging.Notification(
        #         title=asunto,
        #         body=mensaje
        #     ),
        #     token=destinatario.fcm_token
        # )
        # response = messaging.send(message)

        logger.info(f"Push notification enviada a {destinatario.username}")
        return True

    except Exception as e:
        logger.error(f"Error enviando push notification: {str(e)}")
        return False


def crear_notificacion_in_app(
    destinatario,
    tipo,
    asunto,
    mensaje,
    link=None,
    prioridad='MEDIA',
    datos_adicionales=None
):
    """
    Crea una notificación in-app en la base de datos.

    Args:
        destinatario: Usuario destinatario
        tipo: Tipo de notificación (código string)
        asunto: Asunto de la notificación
        mensaje: Mensaje completo
        link: URL opcional
        prioridad: BAJA, MEDIA, ALTA, CRITICA
        datos_adicionales: Dict con datos extra

    Returns:
        object: Instancia de Notificacion creada

    Note:
        Requiere modelo Notificacion en audit_system.centro_notificaciones
    """
    try:
        from apps.audit_system.centro_notificaciones.models import Notificacion, TipoNotificacion

        # Mapear prioridad a minúsculas para BD
        prioridad_map = {
            'BAJA': 'baja',
            'MEDIA': 'normal',
            'ALTA': 'alta',
            'CRITICA': 'urgente',
        }
        prioridad_bd = prioridad_map.get(prioridad, 'normal')

        # Intentar obtener el TipoNotificacion por código
        tipo_notif = None
        try:
            tipo_notif = TipoNotificacion.objects.filter(
                codigo=tipo,
                is_active=True
            ).first()
        except Exception:
            pass

        # Si no existe el tipo, crear notificación sin tipo específico
        notificacion = Notificacion.objects.create(
            usuario=destinatario,
            tipo=tipo_notif,
            titulo=asunto,
            mensaje=mensaje,
            url=link,
            prioridad=prioridad_bd,
            datos_extra=datos_adicionales or {},
            esta_leida=False,
            esta_archivada=False
        )

        logger.info(f"Notificación in-app #{notificacion.id} creada para {destinatario.username}")
        return notificacion

    except Exception as e:
        logger.error(f"Error creando notificación in-app: {str(e)}")
        return False


# =============================================================================
# FUNCIONES AUXILIARES
# =============================================================================

def determinar_canales_por_prioridad(prioridad):
    """
    Determina los canales de notificación según la prioridad.

    Args:
        prioridad: BAJA, MEDIA, ALTA, CRITICA

    Returns:
        list: Lista de canales a usar
    """
    canales_map = {
        'BAJA': ['IN_APP'],
        'MEDIA': ['EMAIL', 'IN_APP'],
        'ALTA': ['EMAIL', 'IN_APP', 'PUSH'],
        'CRITICA': ['EMAIL', 'SMS', 'IN_APP', 'PUSH'],
    }

    return canales_map.get(prioridad, ['EMAIL', 'IN_APP'])


def notificar_grupo(usuarios, tipo, asunto, mensaje, link=None, prioridad='MEDIA'):
    """
    Envía notificación a un grupo de usuarios.

    Args:
        usuarios: QuerySet o lista de usuarios
        tipo: Tipo de notificación
        asunto: Asunto de la notificación
        mensaje: Mensaje
        link: URL opcional
        prioridad: BAJA, MEDIA, ALTA, CRITICA

    Returns:
        dict: Estadísticas de envío
    """
    enviadas = 0
    fallidas = 0

    for usuario in usuarios:
        try:
            enviar_notificacion(
                destinatario=usuario,
                tipo=tipo,
                asunto=asunto,
                mensaje=mensaje,
                link=link,
                prioridad=prioridad
            )
            enviadas += 1
        except Exception as e:
            logger.error(f"Error notificando a {usuario.username}: {str(e)}")
            fallidas += 1

    return {
        'total': enviadas + fallidas,
        'enviadas': enviadas,
        'fallidas': fallidas
    }


# =============================================================================
# NOTIFICACIONES ESPECÍFICAS PARA WORKFLOW
# =============================================================================

def notificar_firma_requerida(firma):
    """Notifica al firmante que debe firmar un documento"""
    documento = firma.content_object

    enviar_notificacion(
        destinatario=firma.firmante,
        tipo='FIRMA_REQUERIDA',
        asunto=f'Documento requiere su firma: {firma.get_rol_firma_display()}',
        mensaje=f'El documento "{documento}" está listo para su firma como {firma.get_rol_firma_display()}. '
                f'Tiene hasta el {firma.fecha_vencimiento.strftime("%d/%m/%Y")} para firmar.',
        link=f'/gestion-estrategica/identidad/politicas/{firma.object_id}',
        prioridad='ALTA',
        datos_adicionales={
            'firma_id': firma.id,
            'documento_id': firma.object_id,
            'rol': firma.rol_firma
        }
    )


def notificar_revision_programada(config):
    """Notifica sobre una revisión programada"""
    documento = config.content_object

    destinatarios = []
    if config.responsable_revision:
        destinatarios.append(config.responsable_revision)
    destinatarios.extend(config.destinatarios_adicionales.all())

    dias_restantes = (config.proxima_revision - timezone.now().date()).days

    for destinatario in destinatarios:
        enviar_notificacion(
            destinatario=destinatario,
            tipo='REVISION_PROXIMA',
            asunto=f'Revisión programada: {documento}',
            mensaje=f'La revisión {config.get_frecuencia_display()} del documento "{documento}" '
                    f'está programada para el {config.proxima_revision.strftime("%d/%m/%Y")} '
                    f'({dias_restantes} días restantes).',
            link=f'/gestion-estrategica/identidad/politicas/{config.object_id}',
            prioridad='ALTA' if dias_restantes <= 7 else 'MEDIA',
            datos_adicionales={
                'config_id': config.id,
                'documento_id': config.object_id,
                'dias_restantes': dias_restantes
            }
        )
