"""
Modelos para catálogos de Supply Chain
Sistema de Gestión StrateKaz
"""
from django.conf import settings
from django.db import models
from django.db.models import Q

from utils.models import TenantModel


class RutaRecoleccion(TenantModel):
    """
    Ruta de recolección de materia prima.

    Recurso logístico propio de la empresa que recolecta MP desde productores
    externos. **La Ruta NUNCA es un Proveedor** — es solo el vehículo +
    recorrido. Los proveedores reales viven en `catalogo_productos.Proveedor`
    con NIT/datos reales y se asocian a la ruta vía `RutaParada`.

    Modos de operación (H-SC-RUTA-02 — refactor 2026-04-25):
      - PASS_THROUGH: la empresa paga directo a cada productor visitado.
        La ruta solo recolecta; el flujo de dinero es 1-a-1 empresa↔productor.
      - SEMI_AUTONOMA: la ruta tiene caja propia. Compra al productor con un
        precio interno y "vende" a la empresa con otro precio mayor (la
        diferencia financia los gastos operativos de la ruta). Doble registro
        de precio en `PrecioRutaSemiAutonoma`.

    En ambos modos los documentos legales salen a nombre de la empresa (no de
    la ruta). La diferencia es el flujo de dinero y el control gerencial.

    Histórico: el signal `sincronizar_proveedor_espejo_ruta` que creaba
    Proveedores espejo automáticos fue eliminado en este refactor por
    contaminar el catálogo con NITs sintéticos ('RUTA-RUTA-XXX').
    """

    class ModoOperacion(models.TextChoices):
        # Códigos en inglés se mantienen por estabilidad (migrados en 0007).
        # Labels en español (es-co).
        PASS_THROUGH = 'PASS_THROUGH', 'Directa (empresa paga al productor)'
        SEMI_AUTONOMA = 'SEMI_AUTONOMA', 'Semi-autónoma (ruta con caja propia)'

    codigo = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        blank=True,
        verbose_name='Código',
        help_text='Código único de la ruta (ej: RUTA-001). Se auto-genera si viene vacío.',
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre descriptivo de la ruta',
    )
    descripcion = models.TextField(
        blank=True,
        default='',
        verbose_name='Descripción',
    )
    modo_operacion = models.CharField(
        max_length=20,
        choices=ModoOperacion.choices,
        default=ModoOperacion.PASS_THROUGH,
        db_index=True,
        verbose_name='Modo de operación',
        help_text=(
            'PASS_THROUGH: empresa paga directo al productor. '
            'SEMI_AUTONOMA: la ruta tiene caja propia con doble precio.'
        ),
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
    )

    # ─── H-SC-RUTA-RBAC-INSTANCIA — object-level RBAC ─────────────────
    # Object-level access: solo los conductores asignados ven y operan
    # esta ruta (vouchers de recolección, paradas, liquidaciones derivadas).
    # Superusuarios y cargos con permiso elevado ven todas las rutas
    # (filtro en queryset, no en modelo). El RBAC por sección sigue activo
    # como primera capa; esta es la segunda capa (por instancia).
    conductor_principal = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rutas_principales',
        verbose_name='Conductor principal',
        help_text=(
            'Usuario responsable de la ruta (operador habitual). '
            'Solo él y los conductores adicionales ven la ruta.'
        ),
    )
    conductores_adicionales = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='rutas_adicionales',
        verbose_name='Conductores adicionales',
        help_text=(
            'Otros usuarios autorizados a ver y gestionar esta ruta '
            '(ej: backup, supervisor de ruta).'
        ),
    )

    class Meta:
        db_table = 'supply_chain_ruta_recoleccion'
        verbose_name = 'Ruta de Recolección'
        verbose_name_plural = 'Rutas de Recolección'
        ordering = ['codigo']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self._generate_code()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_code(cls):
        """Genera código secuencial RUTA-001, RUTA-002... dentro del tenant.

        Patrón espejo de Almacen._generate_code (H-SC-09). El schema-per-tenant
        garantiza unicidad por empresa sin necesidad de FK explícita.
        """
        last = cls.objects.order_by('-id').values_list('codigo', flat=True).first()
        if last and last.startswith('RUTA-'):
            try:
                num = int(last.split('-')[1]) + 1
            except (ValueError, IndexError):
                num = cls.objects.count() + 1
        else:
            num = cls.objects.count() + 1
        return f'RUTA-{num:03d}'


class RutaParada(TenantModel):
    """
    Parada de una Ruta de Recolección — vínculo M2M Ruta ↔ Proveedor (H-SC-RUTA-02).

    Una RutaParada representa la asociación entre una ruta y un proveedor que
    esa ruta visita. Lleva un `orden` sugerido (no restrictivo) en el recorrido.

    NOTA (refactor 2026-04-26): el campo `frecuencia_pago` fue eliminado.
    La frecuencia de pago es decisión del momento de la liquidación
    (acumulativa, semanal/quincenal/mensual decidida por el liquidador), no
    una camisa de fuerza por parada.

    Constraint: un proveedor solo puede ser parada de UNA ruta. Si dos rutas
    visitan al mismo productor, eso debería ser excepcional y manejarse aparte
    (re-asignación, no duplicación).
    """

    ruta = models.ForeignKey(
        RutaRecoleccion,
        on_delete=models.CASCADE,
        related_name='paradas',
        verbose_name='Ruta',
    )
    proveedor = models.ForeignKey(
        'infra_catalogo_productos.Proveedor',
        on_delete=models.PROTECT,
        related_name='paradas_ruta',
        verbose_name='Proveedor (productor visitado)',
        help_text='Proveedor real con NIT/datos reales que la ruta visita.',
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden de visita (sugerido)',
        help_text='Secuencia sugerida en el recorrido (0 = primera). No restrictivo.',
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activa',
    )
    notas = models.TextField(
        blank=True,
        default='',
        verbose_name='Notas operativas',
        help_text='Notas internas de logística para esta parada.',
    )

    class Meta:
        db_table = 'supply_chain_ruta_parada'
        verbose_name = 'Parada de Ruta'
        verbose_name_plural = 'Paradas de Ruta'
        ordering = ['ruta', 'orden']
        constraints = [
            models.UniqueConstraint(
                fields=['proveedor'],
                condition=Q(is_deleted=False),
                name='uq_ruta_parada_proveedor_unico',
            ),
        ]
        indexes = [
            models.Index(fields=['ruta', 'orden']),
            models.Index(fields=['proveedor']),
        ]

    def __str__(self):
        return f"{self.ruta.codigo} → {self.proveedor.nombre_comercial} (#{self.orden})"


class PrecioRutaSemiAutonoma(TenantModel):
    """
    Precio interno de una ruta en modo SEMI_AUTONOMA — doble registro.

    Aplica solo a rutas con `modo_operacion=SEMI_AUTONOMA`. Registra:
      - `precio_ruta_paga_proveedor`: lo que la ruta le paga al productor
        (negociado por la ruta, varía por proveedor).
      - `precio_empresa_paga_ruta`: lo que la empresa le paga a la ruta por
        kg de ese producto+proveedor (precio interno mayor; la diferencia
        cubre los gastos operativos de la ruta).

    Constraint: un (ruta, proveedor, producto) tiene UN precio vigente activo.
    Cambios futuros se modelan creando un nuevo registro y desactivando el
    anterior (no histórico explícito por ahora — se puede agregar después).

    Para rutas PASS_THROUGH no se usa este modelo: el precio único vive
    en `gestion_proveedores.PrecioMateriaPrima` (proveedor↔producto).
    """

    ruta = models.ForeignKey(
        RutaRecoleccion,
        on_delete=models.CASCADE,
        related_name='precios_internos',
        verbose_name='Ruta',
    )
    proveedor = models.ForeignKey(
        'infra_catalogo_productos.Proveedor',
        on_delete=models.PROTECT,
        related_name='precios_ruta_semi',
        verbose_name='Proveedor (productor)',
    )
    producto = models.ForeignKey(
        'infra_catalogo_productos.Producto',
        on_delete=models.PROTECT,
        related_name='precios_ruta_semi',
        verbose_name='Producto (MP)',
    )
    precio_ruta_paga_proveedor = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio que la ruta paga al productor (por kg)',
    )
    precio_empresa_paga_ruta = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio que la empresa paga a la ruta (por kg)',
        help_text='Debe ser >= precio_ruta_paga_proveedor (la diferencia es el ingreso operativo de la ruta).',
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Vigente',
    )
    notas = models.TextField(
        blank=True,
        default='',
        verbose_name='Notas internas',
    )

    class Meta:
        db_table = 'supply_chain_precio_ruta_semi'
        verbose_name = 'Precio Ruta Semi-Autónoma'
        verbose_name_plural = 'Precios Rutas Semi-Autónomas'
        ordering = ['ruta', 'proveedor', 'producto']
        constraints = [
            models.UniqueConstraint(
                fields=['ruta', 'proveedor', 'producto'],
                condition=Q(is_deleted=False, is_active=True),
                name='uq_precio_ruta_semi_vigente',
            ),
        ]
        indexes = [
            models.Index(fields=['ruta', 'producto']),
            models.Index(fields=['proveedor', 'producto']),
        ]

    def __str__(self):
        return (
            f"{self.ruta.codigo} | {self.proveedor.nombre_comercial} | "
            f"{self.producto.nombre}: ruta paga ${self.precio_ruta_paga_proveedor}, "
            f"empresa paga ${self.precio_empresa_paga_ruta}"
        )

    @property
    def margen_ruta(self):
        """Diferencia que queda como ingreso operativo de la ruta."""
        return self.precio_empresa_paga_ruta - self.precio_ruta_paga_proveedor

    def clean(self):
        from django.core.exceptions import ValidationError
        super().clean()
        if self.precio_ruta_paga_proveedor is not None and self.precio_ruta_paga_proveedor < 0:
            raise ValidationError({
                'precio_ruta_paga_proveedor': 'El precio no puede ser negativo.',
            })
        if self.precio_empresa_paga_ruta is not None and self.precio_empresa_paga_ruta < 0:
            raise ValidationError({
                'precio_empresa_paga_ruta': 'El precio no puede ser negativo.',
            })
        if (
            self.precio_ruta_paga_proveedor is not None
            and self.precio_empresa_paga_ruta is not None
            and self.precio_empresa_paga_ruta < self.precio_ruta_paga_proveedor
        ):
            raise ValidationError({
                'precio_empresa_paga_ruta': (
                    'El precio que la empresa paga a la ruta debe ser >= al precio '
                    'que la ruta paga al productor (la diferencia es el ingreso de la ruta).'
                ),
            })
        # Validar que la ruta es SEMI_AUTONOMA
        if self.ruta_id and self.ruta.modo_operacion != RutaRecoleccion.ModoOperacion.SEMI_AUTONOMA:
            raise ValidationError({
                'ruta': (
                    f'PrecioRutaSemiAutonoma solo aplica a rutas con modo SEMI_AUTONOMA. '
                    f'La ruta "{self.ruta.codigo}" está en modo {self.ruta.get_modo_operacion_display()}.'
                ),
            })


class TipoAlmacen(models.Model):
    """
    Tipo de almacenamiento físico (catálogo universal, no tenant).

    Define la clasificación de cómo se almacena el inventario:
    silo (granel líquido/sólido), contenedor, pallet (estibado), piso (suelto).

    Usado por: Almacen.tipo_almacen (FK nullable, backward compat con almacenes existentes).
    """
    codigo = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name='Código',
        help_text='Código único (ej: SILO, CONTENEDOR, PALLET, PISO)'
    )
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    icono = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Icono',
        help_text='Nombre de ícono Lucide React (ej: Cylinder, Package, Layers, Grid)'
    )
    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supply_chain_tipo_almacen'
        verbose_name = 'Tipo de Almacén'
        verbose_name_plural = 'Tipos de Almacén'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class Almacen(TenantModel):
    """
    Almacenes del tenant para almacenamiento de inventario.

    Hereda de TenantModel: el schema-per-tenant reemplaza la FK empresa
    (doctrina modular-tenancy). Se migró desde BaseCompanyModel en S6.
    """
    codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name='Código',
        help_text='Código único del almacén (ej: ALM-001)'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre',
        help_text='Nombre del almacén'
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )
    direccion = models.TextField(
        blank=True,
        verbose_name='Dirección'
    )
    es_principal = models.BooleanField(
        default=False,
        verbose_name='Es principal',
        help_text='Indica si es el almacén principal'
    )
    permite_despacho = models.BooleanField(
        default=True,
        verbose_name='Permite despacho'
    )
    permite_recepcion = models.BooleanField(
        default=True,
        verbose_name='Permite recepción'
    )
    tipo_almacen = models.ForeignKey(
        TipoAlmacen,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='almacenes',
        verbose_name='Tipo de almacén',
        help_text='Clasificación de cómo se almacena (silo / contenedor / pallet / piso)'
    )
    sede = models.ForeignKey(
        'configuracion.SedeEmpresa',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='almacenes',
        verbose_name='Sede',
        help_text='Sede física donde vive este almacén',
    )
    capacidad_maxima = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Capacidad máxima',
        help_text='Capacidad máxima numérica (la unidad se define por tipo_almacen o la unidad de medida del producto)'
    )
    # is_active: semántica de negocio (almacén operativamente activo),
    # independiente del soft-delete de TenantModel.
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Activo',
    )

    class Meta:
        verbose_name = 'Almacén'
        verbose_name_plural = 'Almacenes'
        ordering = ['codigo']
        db_table = 'supply_chain_almacen'
        constraints = [
            models.UniqueConstraint(
                fields=['codigo'],
                condition=Q(is_deleted=False),
                name='uq_almacen_codigo_active',
            ),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self._generate_code()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_code(cls):
        """Genera código secuencial ALM-001, ALM-002, etc. dentro del tenant."""
        last = cls.objects.order_by('-id').values_list('codigo', flat=True).first()
        if last and last.startswith('ALM-'):
            try:
                num = int(last.split('-')[1]) + 1
            except (ValueError, IndexError):
                num = cls.objects.count() + 1
        else:
            num = cls.objects.count() + 1
        return f'ALM-{num:03d}'
