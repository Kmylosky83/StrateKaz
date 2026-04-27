"""
Modelo ImpresoraTermica — sub-app catalogo_productos.impresoras (CT-layer).

Catalogo de impresoras termicas asignables por usuario o por sede. Es base
para el flujo de impresion de vouchers (recepcion, recoleccion, liquidacion)
desde el navegador via Web Bluetooth (H-SC-01 followup).
"""
from django.conf import settings
from django.db import models

from utils.models import TenantModel


class ImpresoraTermica(TenantModel):
    """Catalogo de impresoras termicas del tenant.

    Una impresora puede asignarse a:
      - un usuario (impresora personal — opera en su sesion)
      - una sede (impresora compartida — la usa cualquiera en esa sede)
      - ambas / ninguna (regla de uso definida en frontend)

    `direccion` interpreta segun `tipo_conexion`:
      - BLUETOOTH: MAC del dispositivo (ej: 00:11:22:33:44:55)
      - USB: ruta del dispositivo (ej: /dev/usb/lp0)
      - RED: IP:puerto (ej: 192.168.1.50:9100)
    """

    class TipoConexion(models.TextChoices):
        BLUETOOTH = 'BLUETOOTH', 'Bluetooth'
        USB = 'USB', 'USB'
        RED = 'RED', 'Red'

    class AnchoPapel(models.IntegerChoices):
        MM_58 = 58, '58mm'
        MM_80 = 80, '80mm'

    class Encoding(models.TextChoices):
        UTF8 = 'UTF8', 'UTF-8'
        CP437 = 'CP437', 'CP437'
        CP858 = 'CP858', 'CP858'

    nombre = models.CharField(max_length=100)
    tipo_conexion = models.CharField(
        max_length=20,
        choices=TipoConexion.choices,
    )
    direccion = models.CharField(
        max_length=100,
        help_text='MAC para BT, ruta USB, IP:puerto para RED.',
    )
    ancho_papel = models.IntegerField(
        choices=AnchoPapel.choices,
        default=AnchoPapel.MM_80,
    )
    encoding = models.CharField(
        max_length=10,
        choices=Encoding.choices,
        default=Encoding.CP858,
    )
    usuario_asignado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='impresoras_personales',
        help_text='Si esta seteado, es impresora personal del usuario.',
    )
    sede = models.ForeignKey(
        'configuracion.SedeEmpresa',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='impresoras',
        help_text='Si esta seteado, es impresora compartida de la sede.',
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        app_label = 'impresoras'
        verbose_name = 'Impresora termica'
        verbose_name_plural = 'Impresoras termicas'
        ordering = ['nombre']

    def __str__(self):
        return f'{self.nombre} ({self.get_tipo_conexion_display()})'
