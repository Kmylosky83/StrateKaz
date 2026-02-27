"""
Utilidad para auto-generación de códigos usando ConsecutivoConfig.

Uso en modelos:
    def save(self, *args, **kwargs):
        if not self.pk and not self.codigo:
            from utils.consecutivos import auto_generate_codigo
            auto_generate_codigo(self, 'MI_CONSECUTIVO')
        super().save(*args, **kwargs)
"""
import logging
import time

logger = logging.getLogger(__name__)


def auto_generate_codigo(instance, consecutivo_codigo: str) -> None:
    """
    Si instance.codigo está vacío, genera automáticamente usando ConsecutivoConfig.
    Si ConsecutivoConfig no existe, usa fallback artesanal.

    Args:
        instance: Instancia del modelo (debe tener campo 'codigo' y 'empresa_id')
        consecutivo_codigo: Código del ConsecutivoConfig a usar (ej: 'CICLO_EVALUACION')
    """
    if instance.codigo:
        return  # Usuario proporcionó código, respetar

    # Obtener empresa_id del instance
    empresa_id = getattr(instance, 'empresa_id', None)
    if empresa_id is None:
        empresa = getattr(instance, 'empresa', None)
        if empresa is not None:
            empresa_id = getattr(empresa, 'id', empresa)

    try:
        from apps.gestion_estrategica.organizacion.models_consecutivos import ConsecutivoConfig
        instance.codigo = ConsecutivoConfig.obtener_siguiente_consecutivo(
            consecutivo_codigo, empresa_id
        )
        logger.debug(
            f"Auto-generated codigo '{instance.codigo}' for {instance.__class__.__name__} "
            f"using ConsecutivoConfig '{consecutivo_codigo}'"
        )
    except Exception as e:
        # Fallback: PREFIX + timestamp para evitar bloqueo total
        prefix = consecutivo_codigo[:4].upper()
        fallback = f"{prefix}-{int(time.time()) % 100000:05d}"
        instance.codigo = fallback
        logger.warning(
            f"ConsecutivoConfig '{consecutivo_codigo}' no encontrado para empresa_id={empresa_id}. "
            f"Usando fallback: {fallback}. Error: {e}"
        )
