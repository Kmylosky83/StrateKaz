"""
Factory para creación centralizada de usuarios con setup de contraseña.

Centraliza la lógica duplicada en:
- mi_equipo/colaboradores/views._create_user_for_colaborador
- gestion_proveedores/viewsets._create_user_for_proveedor  (L50+)
- gestion_clientes/views._send_setup_email  (L53+)

Uso:
    from apps.core.utils.user_factory import UserSetupFactory

    user, token = UserSetupFactory.create_user_with_setup(
        email='user@example.com',
        username='user.name',
        first_name='Nombre',
        last_name='Apellido',
        cargo=cargo_obj,
        created_by=request.user,
    )
    UserSetupFactory.send_setup_email(
        user,
        entity_name='Empresa XYZ',
        cargo_name='Coordinador HSEQ',
    )
"""
import uuid
import logging
from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.utils import timezone

logger = logging.getLogger(__name__)


class UserSetupFactory:
    """
    Centraliza la creación de User + token de setup de contraseña.

    Funciona desde cualquier viewset (Colaborador, Proveedor, Cliente)
    sin duplicar lógica de token, email o resolución de tenant.
    """

    @staticmethod
    def create_user_with_setup(
        *,
        email,
        username,
        first_name,
        last_name='',
        cargo=None,
        created_by=None,
        document_number='',
        document_type='CC',
        phone='',
        fecha_ingreso=None,
        proveedor=None,
        cliente=None,
        skip_contratacion_signal=True,
        **extra_fields,
    ):
        """
        Crea un User con password temporal + token de setup.

        El token se almacena en texto plano en password_setup_token
        para compatibilidad con setup_password_views.py que hace
        User.objects.get(password_setup_token=token).

        Token se almacena hasheado (SHA-256) via set_password_setup_token().
        El raw token se retorna para enviarlo por email.

        Args:
            email: Email del usuario (se usa para login)
            username: Nombre de usuario único
            first_name: Primer nombre
            last_name: Apellido
            cargo: Instancia de Cargo (FK)
            created_by: User que crea el registro
            document_number: Número de documento
            document_type: Tipo de documento (CC, CE, etc.)
            phone: Teléfono
            fecha_ingreso: Fecha de ingreso laboral
            proveedor: Instancia o PK del proveedor (L50+)
            cliente: Instancia o PK del cliente (L53+)
            skip_contratacion_signal: Si True, marca _from_contratacion
                para evitar signal duplicado en vacantes
            **extra_fields: Campos adicionales para el User

        Returns:
            tuple: (user, raw_token) — raw_token va en el email
        """
        from apps.core.models import User

        temp_password = uuid.uuid4().hex

        # Evitar colisión de document_number
        if (
            document_number
            and User.objects.filter(
                document_number=document_number
            ).exists()
        ):
            document_number = (
                f'{document_number}-{uuid.uuid4().hex[:6]}'
            )

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
            **extra_fields,
        )

        if fecha_ingreso:
            new_user.fecha_ingreso = fecha_ingreso
        if proveedor:
            new_user.proveedor_id_ext = (
                proveedor
                if isinstance(proveedor, int)
                else proveedor.pk
            )
        if cliente:
            new_user.cliente_id_ext = (
                cliente
                if isinstance(cliente, int)
                else cliente.pk
            )

        if skip_contratacion_signal:
            new_user._from_contratacion = True

        new_user.set_password(temp_password)

        # Setup token ANTES del save: así el signal post_save ve el
        # token y NO envía welcome email duplicado, y el token se
        # persiste en BD en un solo INSERT.
        raw_token = new_user.set_password_setup_token()
        new_user.save()

        logger.info(
            'User #%s creado con setup token (email=%s, cargo=%s)',
            new_user.pk,
            email,
            getattr(cargo, 'code', 'N/A'),
        )

        return new_user, raw_token

    @staticmethod
    def send_setup_email(
        user,
        *,
        raw_token=None,
        entity_name=None,
        cargo_name='',
        empresa=None,
    ):
        """
        Envía email de configuración de contraseña vía Celery task.

        Resuelve tenant_name con esta prioridad:
        1. entity_name (argumento explícito)
        2. empresa.razon_social (ConfiguracionGeneral del tenant)
        3. connection.tenant.name
        4. Fallback: 'StrateKaz'

        Args:
            user: User instance (debe tener password_setup_token)
            raw_token: Token sin hashear (para la URL del email).
                Si no se pasa, se genera uno nuevo y se persiste.
            entity_name: Nombre explícito de la empresa/entidad
            cargo_name: Nombre del cargo asignado
            empresa: ConfiguracionGeneral (opcional, para razon_social)
        """
        try:
            from apps.core.tasks import (
                send_setup_password_email_task,
            )

            # Resolver nombre del tenant
            resolved_name = _resolve_entity_name(
                entity_name=entity_name, empresa=empresa
            )

            # Si no se pasó raw_token, regenerar (y persistir)
            if not raw_token:
                raw_token = user.set_password_setup_token()
                user.save(
                    update_fields=[
                        'password_setup_token',
                        'password_setup_expires',
                    ]
                )

            tenant_frontend_url = _resolve_tenant_frontend_url()
            (
                tenant_id,
                _name,
                primary_color,
                secondary_color,
            ) = _resolve_tenant_context()

            setup_url = (
                f"{tenant_frontend_url}/setup-password"
                f"?token={raw_token}"
                f"&email={user.email}"
                f"&tenant_id={tenant_id}"
            )

            send_setup_password_email_task.delay(
                user_email=user.email,
                user_name=(
                    user.get_full_name()
                    or user.first_name
                    or user.username
                ),
                tenant_name=resolved_name,
                cargo_name=cargo_name,
                setup_url=setup_url,
                expiry_hours=user.PASSWORD_SETUP_EXPIRY_HOURS,
                primary_color=primary_color,
                secondary_color=secondary_color,
            )
            logger.info(
                'Setup email enviado a %s para User #%s',
                user.email,
                user.pk,
            )
        except Exception as e:
            # No re-raise: el usuario ya fue creado, el email puede
            # reenviarse manualmente. Pero sí loguear como error.
            logger.error(
                'Error enviando email de setup para User #%s (%s): %s',
                user.pk,
                user.email,
                e,
                exc_info=True,
            )


# ═══════════════════════════════════════════════════
# Helpers internos
# ═══════════════════════════════════════════════════


def _resolve_entity_name(*, entity_name=None, empresa=None):
    """
    Resuelve el nombre de la entidad con prioridad:
    1. entity_name explícito
    2. empresa.razon_social (si no es placeholder)
    3. connection.tenant.name
    4. 'StrateKaz'
    """
    if entity_name:
        return entity_name

    if empresa:
        razon = getattr(empresa, 'razon_social', None)
        if razon and razon != 'Empresa Sin Configurar':
            return razon

    current_tenant = getattr(connection, 'tenant', None)
    tenant_name = getattr(current_tenant, 'name', None)
    if tenant_name:
        return tenant_name

    return 'StrateKaz'


def _resolve_tenant_context():
    """
    Resuelve datos del tenant actual de forma robusta.

    Returns:
        tuple: (tenant_id, tenant_name, primary_color, secondary_color)
    """
    current_tenant = getattr(connection, 'tenant', None)
    tenant_id = getattr(current_tenant, 'id', None) or ''
    tenant_name = getattr(current_tenant, 'name', None) or ''
    primary_color = (
        getattr(current_tenant, 'primary_color', '#ec268f')
        or '#ec268f'
    )
    secondary_color = (
        getattr(current_tenant, 'secondary_color', '#000000')
        or '#000000'
    )

    # Fallback robusto si connection.tenant no tiene datos
    if not tenant_id or not tenant_name:
        try:
            from apps.tenant.models import Tenant

            current_schema = getattr(
                connection, 'schema_name', 'public'
            )
            if current_schema != 'public':
                t = Tenant.objects.filter(
                    schema_name=current_schema
                ).first()
                if t:
                    tenant_id = tenant_id or t.id
                    tenant_name = tenant_name or t.name
                    primary_color = t.primary_color or primary_color
                    secondary_color = (
                        t.secondary_color or secondary_color
                    )
        except Exception:
            pass

    return (
        tenant_id,
        tenant_name or 'StrateKaz',
        primary_color,
        secondary_color,
    )


def _resolve_tenant_frontend_url():
    """
    Resuelve la URL del frontend para el tenant actual.

    En producción, usa el dominio primario del tenant (ej: empresa.stratekaz.com).
    En desarrollo, usa FRONTEND_URL (localhost:3010).

    Returns:
        str: URL base del frontend (sin trailing slash)
    """
    frontend_url = getattr(
        settings, 'FRONTEND_URL', 'http://localhost:3010'
    )

    # En desarrollo (localhost), no intentar resolver dominios
    if 'localhost' in frontend_url or '127.0.0.1' in frontend_url:
        return frontend_url.rstrip('/')

    # En producción, intentar resolver el dominio del tenant
    try:
        current_tenant = getattr(connection, 'tenant', None)
        tenant_domain = None

        if current_tenant and hasattr(current_tenant, 'primary_domain'):
            tenant_domain = current_tenant.primary_domain

        # Fallback: buscar en BD
        if not tenant_domain:
            from apps.tenant.models import Tenant

            current_schema = getattr(
                connection, 'schema_name', 'public'
            )
            if current_schema != 'public':
                t = Tenant.objects.filter(
                    schema_name=current_schema
                ).first()
                if t:
                    tenant_domain = t.primary_domain

        if tenant_domain:
            # Determinar protocolo: HTTPS en producción, HTTP si contiene localhost
            protocol = 'https'
            return f"{protocol}://{tenant_domain}"

    except Exception:
        pass

    # Fallback: usar FRONTEND_URL como último recurso
    return frontend_url.rstrip('/')


# ═══════════════════════════════════════════════════
# Funciones legacy — mantener para backward compat
# hasta que L50/L53 se desplieguen y migren
# ═══════════════════════════════════════════════════

# Alias para imports existentes
create_external_user = UserSetupFactory.create_user_with_setup
send_setup_password_email = UserSetupFactory.send_setup_email
