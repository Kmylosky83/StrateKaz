"""
Signals para Selección y Contratación - Talent Hub

1. Notificación de contratos firmados.
2. Auto-creación de VacanteActiva desde Cargo (cuando cantidad_posiciones > 0).
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

from .models import HistorialContrato

logger = logging.getLogger(__name__)


@receiver(post_save, sender=HistorialContrato)
def notificar_contrato_creado(sender, instance, created, **kwargs):
    """Notifica cuando se firma un contrato."""
    if instance.firmado and instance.fecha_firma:
        try:
            from apps.talent_hub.services import NotificadorTH
            NotificadorTH.notificar_contrato_firmado(instance)
        except Exception:
            pass


@receiver(post_save, sender='core.Cargo')
def auto_crear_vacante_desde_cargo(sender, instance, created, **kwargs):
    """
    Crea VacanteActiva automáticamente al crear un Cargo con posiciones.

    Solo se ejecuta en creación (created=True).
    Genera 1 VacanteActiva vinculada al cargo nuevo.
    """
    if not created:
        return

    cargo = instance

    # Solo si hay posiciones configuradas
    if not cargo.cantidad_posiciones or cargo.cantidad_posiciones < 1:
        return

    # No crear vacantes para cargos del sistema
    if getattr(cargo, 'is_system', False):
        return

    try:
        from .models import VacanteActiva, TipoContrato
        from apps.core.base_models.mixins import get_tenant_empresa

        empresa = get_tenant_empresa(auto_create=True)
        if not empresa:
            return

        # Buscar tipo de contrato por defecto
        tipo_contrato = TipoContrato.objects.filter(is_active=True).first()
        if not tipo_contrato:
            logger.warning(
                'Auto-crear vacante omitido para Cargo %s: no hay TipoContrato configurado.',
                cargo.code
            )
            return

        # Generar código único
        from django.utils import timezone
        year = timezone.now().year
        ultimo = VacanteActiva.objects.filter(
            codigo_vacante__startswith=f'VAC-{year}-'
        ).order_by('-codigo_vacante').first()

        if ultimo:
            try:
                num = int(ultimo.codigo_vacante.split('-')[-1]) + 1
            except (ValueError, IndexError):
                num = 1
        else:
            num = 1

        codigo = f'VAC-{year}-{num:04d}'

        # Construir requisitos desde el cargo
        requisitos = []
        if cargo.nivel_educativo:
            requisitos.append(f'Educación: {cargo.get_nivel_educativo_display()}')
        if cargo.experiencia_requerida:
            requisitos.append(f'Experiencia: {cargo.get_experiencia_requerida_display()}')

        area_nombre = cargo.area.name if cargo.area else ''

        VacanteActiva.objects.create(
            empresa=empresa,
            cargo=cargo,
            codigo_vacante=codigo,
            titulo=cargo.name,
            cargo_requerido=cargo.name,
            area=area_nombre,
            descripcion=cargo.objetivo_cargo or f'Posición de {cargo.name}',
            requisitos_minimos='\n'.join(requisitos) if requisitos else 'Ver manual del cargo',
            funciones_principales=cargo.objetivo_cargo or 'Ver manual del cargo',
            tipo_contrato=tipo_contrato,
            numero_posiciones=cargo.cantidad_posiciones,
            estado='abierta',
            prioridad='media',
            modalidad='presencial',
            horario='Lunes a Viernes 8:00 AM - 5:00 PM',
            ubicacion=area_nombre,
            responsable_proceso_id=cargo.created_by_id,
        )

        logger.info(
            'VacanteActiva %s creada automáticamente para Cargo %s (%s posiciones)',
            codigo, cargo.code, cargo.cantidad_posiciones
        )

    except Exception as e:
        logger.error(
            'Error al auto-crear vacante para Cargo %s: %s',
            cargo.code, e,
            exc_info=True
        )
