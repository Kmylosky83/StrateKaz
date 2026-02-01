# Generated manually for Migration 1 - Centro de Notificaciones
# Relaciones ManyToMany para NotificacionMasiva

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('centro_notificaciones', '0001_initial'),
        ('core', '0002_initial'),  # Para Cargo (roles)
        ('organizacion', '0001_initial'),  # Para Area
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ==================================================================
        # M2M: NotificacionMasiva.roles -> core.Cargo
        # ==================================================================
        migrations.AddField(
            model_name='notificacionmasiva',
            name='roles',
            field=models.ManyToManyField(
                blank=True,
                related_name='notificaciones_masivas',
                to='core.cargo',
                verbose_name='Roles'
            ),
        ),
        # ==================================================================
        # M2M: NotificacionMasiva.areas -> organizacion.Area
        # ==================================================================
        migrations.AddField(
            model_name='notificacionmasiva',
            name='areas',
            field=models.ManyToManyField(
                blank=True,
                related_name='notificaciones_masivas',
                to='organizacion.area',
                verbose_name='Áreas'
            ),
        ),
        # ==================================================================
        # M2M: NotificacionMasiva.usuarios -> User
        # ==================================================================
        migrations.AddField(
            model_name='notificacionmasiva',
            name='usuarios',
            field=models.ManyToManyField(
                blank=True,
                related_name='notificaciones_masivas_recibidas',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Usuarios'
            ),
        ),
    ]
