"""
Signals de Catalogos — Supply Chain.

H-SC-10: cuando una RutaRecoleccion marca es_proveedor_interno=True, se
crea automáticamente un Proveedor espejo en catalogo_productos para que
la ruta pueda operar como transportador en vouchers de recepción.
El proveedor espejo NO es editable en nombre/NIT (se gestiona desde la ruta).

Reemplaza el signal análogo que vivía en
`apps.gestion_estrategica.configuracion.signals.sincronizar_proveedor_espejo`
(basado en SedeEmpresa.es_proveedor_interno), eliminado al mover el concepto
de ruta de recolección desde Fundación a Supply Chain.

Comportamiento:
  - es_proveedor_interno True  → crea Proveedor espejo (si no existe) o lo
    reactiva.
  - es_proveedor_interno False → desactiva el Proveedor espejo (sin eliminarlo).
  - El signal es 100% defensivo: nunca bloquea el save de RutaRecoleccion.
"""
import logging

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)

# Código interno con el que se identifica el tipo de documento para unidades internas.
_CODIGO_DOC_UNIDAD_INTERNA = 'NIT'
# Prefijo para el número de documento sintético de los proveedores espejo.
_PREFIJO_DOC_ESPEJO = 'RUTA'


def _obtener_tipo_documento_nit():
    """
    Devuelve el TipoDocumentoIdentidad cuyo codigo sea 'NIT'.
    Si no existe (seed no corrido), devuelve el primero disponible.
    Si no hay ninguno, devuelve None.
    """
    try:
        from apps.core.models import TipoDocumentoIdentidad
        tipo = TipoDocumentoIdentidad.objects.filter(
            codigo=_CODIGO_DOC_UNIDAD_INTERNA
        ).first()
        if tipo is None:
            tipo = TipoDocumentoIdentidad.objects.first()
        return tipo
    except Exception:
        logger.error('Error al buscar TipoDocumentoIdentidad', exc_info=True)
        return None


@receiver(post_save, sender='catalogos.RutaRecoleccion')
def sincronizar_proveedor_espejo_ruta(sender, instance, **kwargs):
    """
    Si es_proveedor_interno=True y no existe Proveedor espejo → crear.
    Si es_proveedor_interno=False y existe Proveedor espejo activo → desactivar.
    """
    # Import tardío para evitar circular con catalogo_productos
    try:
        from apps.catalogo_productos.proveedores.models import (
            Proveedor,
            TipoProveedor,
        )
    except ImportError:
        logger.warning('catalogo_productos no disponible — skip H-SC-10')
        return

    if instance.es_proveedor_interno:
        _activar_o_crear_espejo(instance, Proveedor, TipoProveedor)
    else:
        _desactivar_espejo(instance, Proveedor)


def _activar_o_crear_espejo(ruta, Proveedor, TipoProveedor):
    """Crea el Proveedor espejo o lo reactiva si ya existía desactivado."""
    try:
        # ── ¿Ya existe espejo para esta ruta? ──────────────────────────
        espejo_qs = Proveedor.objects.filter(ruta_origen=ruta)
        if espejo_qs.exists():
            espejo_qs.filter(is_active=False).update(is_active=True)
            logger.info(
                'Proveedor espejo reactivado para RutaRecoleccion pk=%s', ruta.pk
            )
            return

        # ── Buscar TipoProveedor UNIDAD_INTERNA ────────────────────────
        tipo_interno = TipoProveedor.objects.filter(
            codigo='UNIDAD_INTERNA', is_active=True
        ).first()
        if tipo_interno is None:
            tipo_interno, _ = TipoProveedor.objects.get_or_create(
                codigo='UNIDAD_INTERNA',
                defaults={
                    'nombre': 'Unidad de Negocio Interna',
                    'descripcion': (
                        'Unidades propias de la empresa '
                        '(rutas, centros de acopio, plantas)'
                    ),
                    'requiere_materia_prima': False,
                    'requiere_modalidad_logistica': False,
                    'is_active': True,
                },
            )

        tipo_doc = _obtener_tipo_documento_nit()
        if tipo_doc is None:
            logger.error(
                'No hay TipoDocumentoIdentidad disponible — no se puede crear '
                'Proveedor espejo para RutaRecoleccion pk=%s. '
                'Ejecuta los seeds de datos maestros.',
                ruta.pk,
            )
            return

        doc_sintetico = f'{_PREFIJO_DOC_ESPEJO}-{ruta.codigo or ruta.pk}'

        with transaction.atomic():
            Proveedor.objects.create(
                razon_social=ruta.nombre,
                nombre_comercial=ruta.nombre,
                tipo_documento=tipo_doc,
                numero_documento=doc_sintetico,
                tipo_proveedor=tipo_interno,
                ruta_origen=ruta,
                is_active=True,
            )
            logger.info(
                'Proveedor espejo creado para RutaRecoleccion pk=%s (doc=%s)',
                ruta.pk,
                doc_sintetico,
            )

    except Exception:
        logger.error(
            'Error creando/reactivando Proveedor espejo para RutaRecoleccion pk=%s',
            ruta.pk,
            exc_info=True,
        )


def _desactivar_espejo(ruta, Proveedor):
    """Desactiva el Proveedor espejo asociado a la ruta sin eliminarlo."""
    try:
        updated = Proveedor.objects.filter(
            ruta_origen=ruta, is_active=True
        ).update(is_active=False)
        if updated:
            logger.info(
                'Proveedor espejo desactivado para RutaRecoleccion pk=%s', ruta.pk
            )
    except Exception:
        logger.error(
            'Error desactivando Proveedor espejo para RutaRecoleccion pk=%s',
            ruta.pk,
            exc_info=True,
        )
