"""
Signals de Colaboradores - Auto-creacion desde User

Cuando se crea un usuario con cargo asignado, se genera automaticamente
un registro Colaborador vinculado para que Mi Portal (ESS) funcione.
"""
import logging
from datetime import date

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

logger = logging.getLogger(__name__)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def auto_create_colaborador(sender, instance, created, **kwargs):
    """
    Crea automaticamente un Colaborador cuando se crea un User con cargo.

    Requisitos para auto-creacion:
    - Usuario recien creado (created=True)
    - Cargo asignado (user.cargo is not None)
    - Cargo con area asignada (user.cargo.area is not None)
    - No existe Colaborador previo para este usuario
    - Existe EmpresaConfig en el tenant actual

    Si alguno falta, se logea un warning y se omite la creacion.
    """
    if not created:
        return

    user = instance

    # Requisito: usuario debe tener cargo asignado
    if not user.cargo:
        return

    # Requisito: cargo debe tener area asignada
    if not user.cargo.area:
        logger.warning(
            'Auto-create Colaborador omitido para User %s (%s): '
            'El cargo "%s" no tiene area asignada.',
            user.id, user.email, user.cargo.name
        )
        return

    # Verificar que no exista ya un Colaborador vinculado
    from .models import Colaborador
    if Colaborador.objects.filter(usuario=user).exists():
        return

    # Obtener empresa del tenant actual (en multi-tenant, cada schema tiene 1 sola)
    from apps.gestion_estrategica.configuracion.models import EmpresaConfig
    empresa = EmpresaConfig.objects.first()
    if not empresa:
        logger.warning(
            'Auto-create Colaborador omitido para User %s (%s): '
            'No hay EmpresaConfig en el tenant actual.',
            user.id, user.email
        )
        return

    # Mapeo de document_type User -> Colaborador
    doc_type_map = {
        'CC': 'CC', 'CE': 'CE', 'TI': 'TI',
        'PA': 'PA', 'PEP': 'PEP', 'PPT': 'PPT',
    }

    try:
        colaborador = Colaborador.objects.create(
            empresa=empresa,
            usuario=user,
            primer_nombre=user.first_name or user.username,
            primer_apellido=user.last_name or '',
            numero_identificacion=user.document_number or f'PEND-{user.id}',
            tipo_documento=doc_type_map.get(user.document_type, 'CC'),
            cargo=user.cargo,
            area=user.cargo.area,
            fecha_ingreso=date.today(),
            tipo_contrato='indefinido',
            salario=0,  # Placeholder - requiere configuracion manual
            estado='activo',
            created_by=user,
        )
        logger.info(
            'Colaborador #%s creado automaticamente para User %s (%s)',
            colaborador.id, user.id, user.email
        )
    except Exception as e:
        logger.error(
            'Error al crear Colaborador para User %s (%s): %s',
            user.id, user.email, e,
            exc_info=True
        )
