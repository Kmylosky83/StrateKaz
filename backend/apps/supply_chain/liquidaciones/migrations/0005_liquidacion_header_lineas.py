"""
Migración H-SC-12: refactor Liquidacion a header+lineas.

Antes:
- Liquidacion OneToOne a VoucherLineaMP (1 liquidación por línea)
- Campos económicos en el header: precio_kg_aplicado, peso_neto_kg,
  subtotal, ajuste_calidad_pct, ajuste_calidad_monto, total_liquidado

Después:
- Liquidacion OneToOne a VoucherRecepcion (1 liquidación por voucher)
- LiquidacionLinea con detalle económico por cada VoucherLineaMP
- PagoLiquidacion para ciclo de pago

Estrategia de data migration (idempotente):
1. Crear LiquidacionLinea y PagoLiquidacion (vacíos).
2. Agregar campos nuevos a Liquidacion nullable.
3. Data migration:
   - Agrupar Liquidacion legacy por voucher (via linea.voucher_id).
   - Para cada grupo: elegir la primera como header, migrar sus datos
     económicos a una LiquidacionLinea y crear LiquidacionLinea para
     cada una de las otras liquidaciones del grupo, luego borrarlas.
   - Asignar voucher_id, codigo, numero al header.
   - Recalcular totales del header.
   - Mapear estado PENDIENTE → BORRADOR.
4. Hacer voucher NOT NULL y unique, codigo NOT NULL unique, numero NOT NULL.
5. Eliminar campos legacy: linea, precio_kg_aplicado, peso_neto_kg,
   ajuste_calidad_pct, ajuste_calidad_monto, total_liquidado.
6. Renombrar db_table a supply_chain_liquidacion.
7. Actualizar choices de estado (PENDIENTE → BORRADOR).
"""
from decimal import Decimal

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def consolidar_liquidaciones_legacy(apps, schema_editor):
    """
    Consolida N liquidaciones legacy (1 por línea) en 1 liquidación
    (header) con N LiquidacionLinea (detalle).

    Idempotente: si un Liquidacion ya tiene voucher asignado (nueva
    estructura), se salta.
    """
    Liquidacion = apps.get_model('liquidaciones', 'Liquidacion')
    LiquidacionLinea = apps.get_model('liquidaciones', 'LiquidacionLinea')
    VoucherLineaMP = apps.get_model('sc_recepcion', 'VoucherLineaMP')

    # Agrupar liquidaciones legacy por voucher_id (via linea.voucher_id)
    grupos = {}
    legacy_qs = Liquidacion.objects.filter(voucher__isnull=True).order_by('id')
    for liq in legacy_qs:
        if liq.linea_id is None:
            continue
        try:
            linea = VoucherLineaMP.objects.get(pk=liq.linea_id)
        except VoucherLineaMP.DoesNotExist:
            continue
        grupos.setdefault(linea.voucher_id, []).append((liq, linea))

    contador = 0
    for voucher_id, items in grupos.items():
        contador += 1
        # Primera liquidación del grupo = header consolidado
        header, header_linea = items[0]
        header.voucher_id = voucher_id
        header.codigo = f'LIQ-{contador:04d}'
        header.numero = contador
        # Mapear estado legacy PENDIENTE → BORRADOR
        if header.estado == 'PENDIENTE':
            header.estado = 'BORRADOR'
        header.save()

        # Crear LiquidacionLinea para cada liquidación legacy del grupo
        subtotal_total = Decimal('0.00')
        ajuste_total = Decimal('0.00')
        monto_final_total = Decimal('0.00')

        for liq_legacy, linea_legacy in items:
            cantidad = liq_legacy.peso_neto_kg or Decimal('0.000')
            precio = liq_legacy.precio_kg_aplicado or Decimal('0.00')
            ajuste_pct = liq_legacy.ajuste_calidad_pct or Decimal('0.00')
            monto_base = (cantidad * precio).quantize(Decimal('0.01'))
            # Legacy: ajuste era siempre descuento (-). Lo preservamos con
            # signo negativo para ser fiel al cálculo anterior.
            ajuste_monto_abs = (
                monto_base * ajuste_pct / Decimal('100')
            ).quantize(Decimal('0.01'))
            ajuste_monto_signed = -ajuste_monto_abs  # legacy = descuento
            # Equivalente: pct como negativo para signo consistente
            ajuste_pct_signed = -ajuste_pct if ajuste_pct > 0 else Decimal('0.00')
            monto_final = monto_base + ajuste_monto_signed

            LiquidacionLinea.objects.create(
                liquidacion_id=header.id,
                voucher_linea_id=linea_legacy.id,
                cantidad=cantidad,
                precio_unitario=precio,
                monto_base=monto_base,
                ajuste_calidad_pct=ajuste_pct_signed,
                ajuste_calidad_monto=ajuste_monto_signed,
                monto_final=monto_final,
                observaciones=liq_legacy.observaciones or '',
            )
            subtotal_total += monto_base
            ajuste_total += ajuste_monto_signed
            monto_final_total += monto_final

            # Borrar las liquidaciones legacy que NO son el header
            if liq_legacy.id != header.id:
                liq_legacy.delete()

        # Recalcular totales del header
        header.subtotal = subtotal_total
        header.ajuste_calidad_total = ajuste_total
        header.total = monto_final_total
        header.save()


def revertir_consolidacion(apps, schema_editor):
    """Reverse no-op: la consolidación es destructiva y no tiene reverso fiable."""
    pass


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        (
            'liquidaciones',
            '0004_rename_supply_chai_linea_liq_idx_supply_chai_linea_i_470f02_idx_and_more',
        ),
        ('sc_recepcion', '0006_qc_configurable'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ───────────────────────────────────────────────────────────────
        # 1. Crear LiquidacionLinea (vacío inicialmente)
        # ───────────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='LiquidacionLinea',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'created_at',
                    models.DateTimeField(
                        auto_now_add=True,
                        db_index=True,
                        verbose_name='Fecha de creación',
                    ),
                ),
                (
                    'updated_at',
                    models.DateTimeField(
                        auto_now=True, verbose_name='Última actualización'
                    ),
                ),
                (
                    'is_deleted',
                    models.BooleanField(
                        db_index=True, default=False, verbose_name='Eliminado'
                    ),
                ),
                (
                    'deleted_at',
                    models.DateTimeField(
                        blank=True, null=True, verbose_name='Fecha de eliminación'
                    ),
                ),
                (
                    'cantidad',
                    models.DecimalField(
                        decimal_places=3,
                        help_text='Peso neto de la línea del voucher (kg).',
                        max_digits=14,
                        verbose_name='Cantidad',
                    ),
                ),
                (
                    'precio_unitario',
                    models.DecimalField(
                        decimal_places=2,
                        help_text='Precio por kg del producto para este proveedor.',
                        max_digits=14,
                        verbose_name='Precio unitario',
                    ),
                ),
                (
                    'monto_base',
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal('0.00'),
                        editable=False,
                        help_text='cantidad × precio_unitario',
                        max_digits=14,
                        verbose_name='Monto base',
                    ),
                ),
                (
                    'ajuste_calidad_pct',
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal('0.00'),
                        help_text='% positivo = premio, negativo = descuento.',
                        max_digits=5,
                        verbose_name='Ajuste por calidad (%)',
                    ),
                ),
                (
                    'ajuste_calidad_monto',
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal('0.00'),
                        editable=False,
                        max_digits=14,
                        verbose_name='Ajuste por calidad (monto)',
                    ),
                ),
                (
                    'monto_final',
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal('0.00'),
                        editable=False,
                        help_text='monto_base + ajuste_calidad_monto',
                        max_digits=14,
                        verbose_name='Monto final',
                    ),
                ),
                (
                    'observaciones',
                    models.TextField(
                        blank=True, default='', verbose_name='Observaciones'
                    ),
                ),
                (
                    'created_by',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to=settings.AUTH_USER_MODEL,
                        verbose_name='Creado por',
                    ),
                ),
                (
                    'deleted_by',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to=settings.AUTH_USER_MODEL,
                        verbose_name='Eliminado por',
                    ),
                ),
                (
                    'updated_by',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to=settings.AUTH_USER_MODEL,
                        verbose_name='Actualizado por',
                    ),
                ),
                (
                    'liquidacion',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='lineas_liquidacion',
                        to='liquidaciones.liquidacion',
                        verbose_name='Liquidación',
                    ),
                ),
                (
                    'voucher_linea',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='liquidacion_linea',
                        to='sc_recepcion.voucherlineamp',
                        verbose_name='Línea del voucher',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Línea de liquidación',
                'verbose_name_plural': 'Líneas de liquidación',
                'db_table': 'supply_chain_liquidacion_linea',
                'ordering': ['id'],
            },
        ),
        # ───────────────────────────────────────────────────────────────
        # 2. Agregar campos nuevos a Liquidacion (nullable para data mig)
        # ───────────────────────────────────────────────────────────────
        migrations.AddField(
            model_name='liquidacion',
            name='voucher',
            field=models.OneToOneField(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='liquidacion',
                to='sc_recepcion.voucherrecepcion',
                verbose_name='Voucher de recepción',
            ),
        ),
        migrations.AddField(
            model_name='liquidacion',
            name='codigo',
            field=models.CharField(
                null=True,
                editable=False,
                db_index=True,
                max_length=30,
                verbose_name='Código',
            ),
        ),
        migrations.AddField(
            model_name='liquidacion',
            name='numero',
            field=models.PositiveIntegerField(
                null=True,
                editable=False,
                help_text='Consecutivo interno LIQ-NNNN',
            ),
        ),
        migrations.AddField(
            model_name='liquidacion',
            name='ajuste_calidad_total',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('0.00'),
                max_digits=14,
                help_text='Suma de ajuste_calidad_monto de las líneas.',
                verbose_name='Ajuste por calidad total',
            ),
        ),
        migrations.AddField(
            model_name='liquidacion',
            name='total',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('0.00'),
                max_digits=14,
                help_text='Suma de monto_final de las líneas.',
                verbose_name='Total',
            ),
        ),
        migrations.AddField(
            model_name='liquidacion',
            name='fecha_aprobacion',
            field=models.DateTimeField(
                null=True, blank=True, verbose_name='Fecha de aprobación'
            ),
        ),
        migrations.AddField(
            model_name='liquidacion',
            name='aprobado_por',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='liquidaciones_aprobadas',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Aprobado por',
            ),
        ),
        # ───────────────────────────────────────────────────────────────
        # 3. Data migration: consolidar legacy
        # ───────────────────────────────────────────────────────────────
        migrations.RunPython(
            consolidar_liquidaciones_legacy, revertir_consolidacion
        ),
        # ───────────────────────────────────────────────────────────────
        # 4. Eliminar índices legacy antes de drop fields
        # ───────────────────────────────────────────────────────────────
        migrations.RemoveIndex(
            model_name='liquidacion',
            name='supply_chai_linea_i_470f02_idx',
        ),
        migrations.RemoveIndex(
            model_name='liquidacion',
            name='supply_chai_estado_41a0db_idx',
        ),
        # ───────────────────────────────────────────────────────────────
        # 5. Eliminar campos legacy de Liquidacion
        # ───────────────────────────────────────────────────────────────
        migrations.RemoveField(
            model_name='liquidacion',
            name='linea',
        ),
        migrations.RemoveField(
            model_name='liquidacion',
            name='precio_kg_aplicado',
        ),
        migrations.RemoveField(
            model_name='liquidacion',
            name='peso_neto_kg',
        ),
        migrations.RemoveField(
            model_name='liquidacion',
            name='ajuste_calidad_pct',
        ),
        migrations.RemoveField(
            model_name='liquidacion',
            name='ajuste_calidad_monto',
        ),
        migrations.RemoveField(
            model_name='liquidacion',
            name='total_liquidado',
        ),
        # ───────────────────────────────────────────────────────────────
        # 6. Alterar estado choices + default (PENDIENTE → BORRADOR)
        # ───────────────────────────────────────────────────────────────
        migrations.AlterField(
            model_name='liquidacion',
            name='estado',
            field=models.CharField(
                choices=[
                    ('BORRADOR', 'Borrador'),
                    ('APROBADA', 'Aprobada — lista para pago'),
                    ('PAGADA', 'Pagada'),
                    ('ANULADA', 'Anulada'),
                ],
                db_index=True,
                default='BORRADOR',
                max_length=20,
                verbose_name='Estado',
            ),
        ),
        # ───────────────────────────────────────────────────────────────
        # 7. Hacer campos nuevos NOT NULL + unique donde aplica
        # ───────────────────────────────────────────────────────────────
        migrations.AlterField(
            model_name='liquidacion',
            name='voucher',
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='liquidacion',
                to='sc_recepcion.voucherrecepcion',
                verbose_name='Voucher de recepción',
            ),
        ),
        migrations.AlterField(
            model_name='liquidacion',
            name='codigo',
            field=models.CharField(
                max_length=30,
                unique=True,
                editable=False,
                db_index=True,
                verbose_name='Código',
            ),
        ),
        migrations.AlterField(
            model_name='liquidacion',
            name='numero',
            field=models.PositiveIntegerField(
                editable=False,
                help_text='Consecutivo interno LIQ-NNNN',
            ),
        ),
        # ───────────────────────────────────────────────────────────────
        # 8. Renombrar db_table + agregar índice nuevo
        # ───────────────────────────────────────────────────────────────
        migrations.AlterModelTable(
            name='liquidacion',
            table='supply_chain_liquidacion',
        ),
        migrations.AddIndex(
            model_name='liquidacion',
            index=models.Index(
                fields=['estado', '-created_at'],
                name='sc_liquida_estado_idx',
            ),
        ),
        # ───────────────────────────────────────────────────────────────
        # 9. Crear PagoLiquidacion
        # ───────────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='PagoLiquidacion',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'created_at',
                    models.DateTimeField(
                        auto_now_add=True,
                        db_index=True,
                        verbose_name='Fecha de creación',
                    ),
                ),
                (
                    'updated_at',
                    models.DateTimeField(
                        auto_now=True, verbose_name='Última actualización'
                    ),
                ),
                (
                    'is_deleted',
                    models.BooleanField(
                        db_index=True, default=False, verbose_name='Eliminado'
                    ),
                ),
                (
                    'deleted_at',
                    models.DateTimeField(
                        blank=True, null=True, verbose_name='Fecha de eliminación'
                    ),
                ),
                ('fecha_pago', models.DateField(verbose_name='Fecha de pago')),
                (
                    'metodo',
                    models.CharField(
                        choices=[
                            ('EFECTIVO', 'Efectivo'),
                            ('TRANSFERENCIA', 'Transferencia Bancaria'),
                            ('CHEQUE', 'Cheque'),
                            ('PSE', 'PSE'),
                            ('OTRO', 'Otro'),
                        ],
                        max_length=20,
                        verbose_name='Método de pago',
                    ),
                ),
                (
                    'referencia',
                    models.CharField(
                        blank=True,
                        default='',
                        max_length=100,
                        verbose_name='Referencia / N° comprobante',
                    ),
                ),
                (
                    'monto_pagado',
                    models.DecimalField(
                        decimal_places=2,
                        help_text='Debe coincidir con el total de la liquidación.',
                        max_digits=14,
                        verbose_name='Monto pagado',
                    ),
                ),
                (
                    'observaciones',
                    models.TextField(
                        blank=True, default='', verbose_name='Observaciones'
                    ),
                ),
                (
                    'created_by',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to=settings.AUTH_USER_MODEL,
                        verbose_name='Creado por',
                    ),
                ),
                (
                    'deleted_by',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to=settings.AUTH_USER_MODEL,
                        verbose_name='Eliminado por',
                    ),
                ),
                (
                    'updated_by',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to=settings.AUTH_USER_MODEL,
                        verbose_name='Actualizado por',
                    ),
                ),
                (
                    'liquidacion',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='pago',
                        to='liquidaciones.liquidacion',
                        verbose_name='Liquidación',
                    ),
                ),
                (
                    'registrado_por',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='pagos_liquidacion_registrados',
                        to=settings.AUTH_USER_MODEL,
                        verbose_name='Registrado por',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Pago de liquidación',
                'verbose_name_plural': 'Pagos de liquidación',
                'db_table': 'supply_chain_pago_liquidacion',
                'ordering': ['-fecha_pago', '-created_at'],
            },
        ),
    ]
