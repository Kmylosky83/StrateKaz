"""
Factory para creación de usuarios externos (proveedores, clientes).

Centraliza la lógica duplicada en:
- gestion_proveedores.viewsets._create_user_for_proveedor
- gestion_clientes.views._send_setup_email + inline user creation
- colaboradores.views._create_user_for_colaborador

Uso:
    from apps.core.utils.user_factory import create_external_user, send_setup_password_email

    user = create_external_user(
        email='user@example.com',
        username='user.name',
        first_name='Nombre',
        last_name='Apellido',
        cargo=cargo_obj,
        created_by=request.user,
        proveedor=proveedor_obj,  # o cliente=cliente_obj
        document_number='123456',
    )
    send_setup_password_email(user, entity_name='Empresa XYZ', cargo_name='Consultor')
"""
import uuid
import logging
from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.utils import timezone

logger = logging.getLogger(__name__)


def create_external_user(
    *,
    email,
    username,
    first_name,
    last_name='',
    cargo,
    created_by,
    document_number='',
    document_type='CC',
    phone='',
    fecha_ingreso=None,
    proveedor=None,
    cliente=None,
):
    """
    Crea un User con password temporal + token de setup.

    Returns:
        tuple: (user, setup_token)
    """
    from apps.core.models import User

    temp_password = uuid.uuid4().hex

    # Generar document_number único si ya existe
    if document_number and User.objects.filter(document_number=document_number).exists():
        document_number = f'{document_number}-{uuid.uuid4().hex[:6]}'

    new_user = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        cargo=cargo,
        document_type=document_type,
        document_number=document_number,
        phone=phone or '',
        is_active=True,
        created_by=created_by,
    )

    if fecha_ingreso:
        new_user.fecha_ingreso = fecha_ingreso
    if proveedor:
        new_user.proveedor = proveedor
    if cliente:
        new_user.cliente = cliente

    new_user._from_contratacion = True
    new_user.set_password(temp_password)

    # Setup token
    setup_token = uuid.uuid4().hex
    new_user.password_setup_token = setup_token
    new_user.password_setup_expires = timezone.now() + timedelta(
        hours=User.PASSWORD_SETUP_EXPIRY_HOURS
    )
    new_user.save()

    return new_user, setup_token


def send_setup_password_email(user, *, entity_name, cargo_name=''):
    """
    Envía email de configuración de contraseña vía Celery task.

    Args:
        user: User instance (must have password_setup_token set)
        entity_name: Nombre de la empresa/entidad para el email
        cargo_name: Nombre del cargo asignado
    """
    try:
        from apps.core.tasks import send_setup_password_email_task

        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://app.stratekaz.com')
        tenant_id = getattr(connection.tenant, 'id', '')
        setup_url = (
            f"{frontend_url}/setup-password"
            f"?token={user.password_setup_token}"
            f"&email={user.email}"
            f"&tenant_id={tenant_id}"
        )

        try:
            primary_color = connection.tenant.primary_color or '#3b82f6'
            secondary_color = connection.tenant.secondary_color or '#1e40af'
        except Exception:
            primary_color = '#3b82f6'
            secondary_color = '#1e40af'

        send_setup_password_email_task.delay(
            user_email=user.email,
            user_name=user.get_full_name() or user.first_name or user.username or entity_name,
            tenant_name=entity_name,
            cargo_name=cargo_name,
            setup_url=setup_url,
            expiry_hours=user.PASSWORD_SETUP_EXPIRY_HOURS,
            primary_color=primary_color,
            secondary_color=secondary_color,
        )
        logger.info(
            'Setup email sent to %s for User %s',
            user.email, user.id,
        )
    except Exception as e:
        logger.error(
            'Error sending setup email for User %s: %s',
            user.id, e, exc_info=True,
        )
