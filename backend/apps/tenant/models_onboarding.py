"""
Onboarding de Tenant - StrateKaz

Rastrea el progreso de configuración inicial de cada empresa cliente.
Vive en schema 'public' (compartido), junto al modelo Tenant.

Ciclo de vida:
1. Tenant se crea con schema_status = 'pending'
2. Celery crea el schema y pone schema_status = 'ready'
3. La señal post_save crea automáticamente TenantOnboarding
4. El admin va completando pasos hasta que is_complete = True
"""
import logging

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


class TenantOnboarding(models.Model):
    """
    Rastrea el progreso de onboarding a nivel de empresa.
    Vive en schema 'public'. Se crea automáticamente cuando
    Tenant.schema_status pasa a 'ready'.

    Los campos booleanos son calculados por OnboardingService.compute()
    consultando los datos reales del schema del tenant.
    """

    tenant = models.OneToOneField(
        'tenant.Tenant',
        on_delete=models.CASCADE,
        related_name='onboarding',
        verbose_name='Empresa',
    )

    # ------------------------------------------------------------------
    # Pasos calculados (computed desde datos del schema del tenant)
    # ------------------------------------------------------------------
    datos_empresa_completos = models.BooleanField(
        default=False,
        verbose_name='Datos de empresa completos',
        help_text='True cuando EmpresaConfig tiene NIT y razón social',
    )
    estructura_definida = models.BooleanField(
        default=False,
        verbose_name='Estructura organizacional definida',
        help_text='True cuando existe al menos un Área y un Cargo',
    )
    identidad_configurada = models.BooleanField(
        default=False,
        verbose_name='Identidad corporativa configurada',
        help_text='True cuando CorporateIdentity tiene misión y visión',
    )
    sedes_configuradas = models.BooleanField(
        default=False,
        verbose_name='Sedes configuradas',
        help_text='True cuando existe al menos una SedeEmpresa',
    )
    valores_definidos = models.BooleanField(
        default=False,
        verbose_name='Valores corporativos definidos',
        help_text='True cuando existe al menos un CorporateValue',
    )
    admin_perfil_completo = models.BooleanField(
        default=False,
        verbose_name='Perfil del administrador completo',
        help_text='True cuando el admin tiene foto y firma guardada',
    )
    primer_colaborador_invitado = models.BooleanField(
        default=False,
        verbose_name='Primer colaborador invitado',
        help_text='True cuando existe al menos un usuario activo no administrador',
    )
    primer_registro_modulo = models.BooleanField(
        default=False,
        verbose_name='Primer registro en un módulo',
        help_text='Marcador exploratorio — se activa manualmente o via evento futuro',
    )

    # ------------------------------------------------------------------
    # Control
    # ------------------------------------------------------------------
    completado_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de finalización',
        help_text='Se establece automáticamente cuando is_complete = True',
    )
    dismissed = models.BooleanField(
        default=False,
        verbose_name='Descartado',
        help_text='El administrador cerró el banner de onboarding manualmente',
    )

    # ------------------------------------------------------------------
    # Timestamps
    # ------------------------------------------------------------------
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado en')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado en')

    class Meta:
        db_table = 'tenant_onboarding'
        verbose_name = 'Onboarding de Empresa'
        verbose_name_plural = 'Onboardings de Empresas'

    def __str__(self):
        return f'Onboarding — {self.tenant.name} ({self.overall_progress}%)'

    # ------------------------------------------------------------------
    # Propiedades calculadas
    # ------------------------------------------------------------------

    @property
    def _step_fields(self) -> list:
        """Lista ordenada de campos de pasos booleanos."""
        return [
            self.datos_empresa_completos,
            self.estructura_definida,
            self.identidad_configurada,
            self.sedes_configuradas,
            self.valores_definidos,
            self.admin_perfil_completo,
            self.primer_colaborador_invitado,
            self.primer_registro_modulo,
        ]

    @property
    def done_count(self) -> int:
        """Número de pasos completados."""
        return sum(1 for f in self._step_fields if f)

    @property
    def total(self) -> int:
        """Total de pasos del onboarding de empresa."""
        return 8

    @property
    def overall_progress(self) -> int:
        """Porcentaje de avance (0–100)."""
        return int((self.done_count / self.total) * 100) if self.total else 0

    @property
    def is_complete(self) -> bool:
        """True cuando todos los pasos están completados."""
        return self.done_count == self.total


# ==============================================================================
# SEÑAL: Crear TenantOnboarding cuando el schema queda listo
# ==============================================================================

@receiver(post_save, sender='tenant.Tenant')
def create_tenant_onboarding_on_ready(sender, instance, created, **kwargs):
    """
    Crea TenantOnboarding automáticamente cuando Tenant.schema_status
    cambia a 'ready'.

    Solo actúa cuando:
    - El campo schema_status está en update_fields (cambio explícito), O
    - Es un objeto recién creado con schema_status = 'ready' (poco común).

    Evita crear duplicados vía get_or_create.
    """
    # Verificar que el schema esté listo
    if instance.schema_status != 'ready':
        return

    # Solo reaccionar a cambios explícitos (update_fields) o creaciones nuevas
    update_fields = kwargs.get('update_fields')
    if update_fields is not None and 'schema_status' not in update_fields:
        return

    try:
        onboarding, was_created = TenantOnboarding.objects.get_or_create(
            tenant=instance
        )
        if was_created:
            logger.info(
                'TenantOnboarding creado para tenant "%s" (id=%s)',
                instance.name,
                instance.pk,
            )
    except Exception as exc:
        logger.error(
            'Error al crear TenantOnboarding para tenant "%s" (id=%s): %s',
            instance.name,
            instance.pk,
            exc,
            exc_info=True,
        )
