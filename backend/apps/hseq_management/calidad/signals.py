"""
Signals para Gestión de Calidad
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import NoConformidad, AccionCorrectiva, SolicitudCambio


@receiver(pre_save, sender=NoConformidad)
def no_conformidad_cambio_estado(sender, instance, **kwargs):
    """
    Registrar cambios de estado en No Conformidades
    """
    if instance.pk:
        try:
            old_instance = NoConformidad.objects.get(pk=instance.pk)

            # Si cambió a EN_ANALISIS, registrar fecha
            if old_instance.estado != 'EN_ANALISIS' and instance.estado == 'EN_ANALISIS':
                if not instance.fecha_analisis:
                    from django.utils import timezone
                    instance.fecha_analisis = timezone.now().date()

            # Si cambió a VERIFICACION, registrar fecha
            if old_instance.estado != 'VERIFICACION' and instance.estado == 'VERIFICACION':
                if not instance.fecha_verificacion:
                    from django.utils import timezone
                    instance.fecha_verificacion = timezone.now().date()

        except NoConformidad.DoesNotExist:
            pass


@receiver(post_save, sender=AccionCorrectiva)
def accion_correctiva_creada(sender, instance, created, **kwargs):
    """
    Cuando se crea una acción correctiva, actualizar estado de NC
    """
    if created and instance.no_conformidad:
        nc = instance.no_conformidad
        if nc.estado == 'EN_ANALISIS':
            nc.estado = 'EN_TRATAMIENTO'
            nc.save()


@receiver(pre_save, sender=SolicitudCambio)
def solicitud_cambio_revision(sender, instance, **kwargs):
    """
    Actualizar estado automáticamente según aprobaciones
    """
    if instance.pk:
        try:
            old_instance = SolicitudCambio.objects.get(pk=instance.pk)

            # Si se asignó revisado_por, cambiar a EN_REVISION
            if not old_instance.revisado_por and instance.revisado_por:
                if instance.estado == 'SOLICITADA':
                    instance.estado = 'EN_REVISION'

            # Si se aprobó, cambiar estado
            if not old_instance.aprobado_por and instance.aprobado_por:
                if instance.estado == 'EN_REVISION':
                    instance.estado = 'APROBADA'

        except SolicitudCambio.DoesNotExist:
            pass
