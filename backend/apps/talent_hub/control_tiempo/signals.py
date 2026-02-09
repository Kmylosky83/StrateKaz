"""
Signals para Control de Tiempo - Talent Hub
Notificaciones automáticas para horas extra cerca del límite.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

from .models import HoraExtra


@receiver(post_save, sender=HoraExtra)
def verificar_limite_horas_extra(sender, instance, created, **kwargs):
    """Verifica si el colaborador está cerca del límite semanal de HE."""
    if not instance.is_active:
        return

    try:
        # Calcular total semanal
        fecha = instance.fecha
        dia_semana = fecha.weekday()
        inicio_semana = fecha - timedelta(days=dia_semana)
        fin_semana = inicio_semana + timedelta(days=6)

        total_semana = HoraExtra.objects.filter(
            colaborador=instance.colaborador,
            fecha__gte=inicio_semana,
            fecha__lte=fin_semana,
            is_active=True,
            estado__in=['pendiente', 'aprobada']
        ).values_list('horas_trabajadas', flat=True)

        horas_acumuladas = sum(total_semana) if total_semana else Decimal('0')

        # Si supera 10 horas (80% del límite de 12), notificar
        if horas_acumuladas >= Decimal('10.00'):
            from apps.talent_hub.services import NotificadorTH
            NotificadorTH.notificar_horas_extra_limite(
                instance.colaborador,
                horas_acumuladas
            )
    except Exception:
        pass
