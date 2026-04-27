"""
Signals de Configuración Organizacional.

NOTA (H-SC-10): el signal `sincronizar_proveedor_espejo` basado en
`SedeEmpresa.es_proveedor_interno` fue ELIMINADO al mover el concepto
de ruta de recolección desde Fundación a Supply Chain.

H-SC-05 (2026-04-27): se reintroduce sincronización Fundación → CT
mediante `tipo_sede.rol_operacional == 'PROVEEDOR_INTERNO'`. NO se
re-introduce el campo `es_proveedor_interno`; el rol vive en TipoSede.
"""
import logging

from django.apps import apps
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(
    post_save,
    sender='configuracion.SedeEmpresa',
    dispatch_uid='sync_sede_proveedor_interno_h_sc_05',
)
def sync_sede_to_proveedor_interno(sender, instance, created, **kwargs):
    """
    Sincroniza una `SedeEmpresa` con un `Proveedor` interno cuando su
    `tipo_sede.rol_operacional == 'PROVEEDOR_INTERNO'`.

    - Idempotente vía `get_or_create(sede_empresa_origen=instance)`.
    - Solo crea / actualiza; nunca borra el Proveedor si la sede cambia
      de rol (la decisión de desactivar queda en manos del usuario).
    - Mantiene en sync `razon_social`, `nombre_comercial` y `direccion`.
    """
    # Sin tipo_sede no podemos decidir nada.
    if not getattr(instance, 'tipo_sede_id', None):
        return

    tipo_sede = instance.tipo_sede
    if getattr(tipo_sede, 'rol_operacional', None) != 'PROVEEDOR_INTERNO':
        return

    try:
        Proveedor = apps.get_model('catalogo_productos', 'Proveedor')
        TipoDocumentoIdentidad = apps.get_model(
            'core', 'TipoDocumentoIdentidad'
        )
        ConfiguracionEmpresa = apps.get_model(
            'configuracion', 'ConfiguracionEmpresa'
        )
    except LookupError:
        # En entornos donde catalogo_productos no esté instalado, salir limpio.
        return

    # Defaults defensivos para campos required del Proveedor.
    direccion = getattr(instance, 'direccion', '') or ''
    nombre_sede = instance.nombre or 'Proveedor interno'

    # Resolver tipo_documento (NIT > primero activo) — required FK.
    tipo_doc = (
        TipoDocumentoIdentidad.objects.filter(codigo='NIT').first()
        or TipoDocumentoIdentidad.objects.filter(is_active=True).order_by('orden').first()
    )
    if tipo_doc is None:
        logger.warning(
            'sync_sede_to_proveedor_interno: no hay TipoDocumentoIdentidad '
            'disponible; no se puede crear Proveedor para sede id=%s',
            instance.pk,
        )
        return

    # Heredar NIT y razón social de ConfiguracionEmpresa cuando exista.
    empresa = ConfiguracionEmpresa.objects.first()
    nit_empresa = (empresa.nit if empresa else '') or ''
    # numero_documento debe ser único entre activos: usamos un sufijo
    # determinístico por sede para evitar choques si hay varias internas.
    numero_documento = f'{nit_empresa or "INT"}-SEDE-{instance.pk}'

    proveedor, was_created = Proveedor.objects.get_or_create(
        sede_empresa_origen=instance,
        defaults={
            'razon_social': nombre_sede,
            'nombre_comercial': nombre_sede,
            'tipo_documento': tipo_doc,
            'numero_documento': numero_documento,
            'direccion': direccion,
            'is_active': True,
        },
    )

    if was_created:
        return

    # Update: re-sincroniza campos derivados de la sede.
    update_fields = []
    if proveedor.razon_social != nombre_sede:
        proveedor.razon_social = nombre_sede
        update_fields.append('razon_social')
    if proveedor.nombre_comercial != nombre_sede:
        proveedor.nombre_comercial = nombre_sede
        update_fields.append('nombre_comercial')
    if direccion and proveedor.direccion != direccion:
        proveedor.direccion = direccion
        update_fields.append('direccion')

    if update_fields:
        proveedor.save(update_fields=update_fields)
