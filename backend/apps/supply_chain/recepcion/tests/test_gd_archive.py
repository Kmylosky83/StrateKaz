"""
Tests H-SC-GD-ARCHIVE — archivado del voucher en GD al aprobar.

Verifica:
  - Aprobar un voucher dispara `archivar_en_gd` y popula
    `documento_archivado_id`.
  - Re-aprobar es idempotente (no crea documento nuevo).
  - Si no existe TipoDocumento(RG) o Area, no rompe la aprobación
    (graceful degradation — el voucher es la fuente de verdad operativa).

Patrón obligatorio: BaseTenantTestCase con schema real.
"""
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from apps.catalogo_productos.models import (
    CategoriaProducto,
    Producto,
    Proveedor,
    TipoProveedor,
    UnidadMedida,
)
from apps.core.models import TipoDocumentoIdentidad
from apps.core.tests.base import BaseTenantTestCase
from apps.supply_chain.catalogos.models import Almacen, TipoAlmacen
from apps.supply_chain.recepcion.models import VoucherLineaMP, VoucherRecepcion


class TestVoucherGDArchive(BaseTenantTestCase):
    """H-SC-GD-ARCHIVE: voucher.archivar_en_gd() + signal post-aprobación."""

    def setUp(self):
        super().setUp()
        self.user = self.create_user()
        self.tipo_doc, _ = TipoDocumentoIdentidad.objects.get_or_create(
            codigo='NIT', defaults={'nombre': 'NIT', 'orden': 1},
        )
        self.tipo_prov = TipoProveedor.objects.create(
            codigo='MP-GDA', nombre='Proveedor MP', requiere_materia_prima=True, orden=1,
        )
        self.proveedor = Proveedor.objects.create(
            tipo_proveedor=self.tipo_prov,
            nombre_comercial='Proveedor GDA',
            razon_social='Proveedor GDA S.A.S.',
            tipo_documento=self.tipo_doc,
            numero_documento='900222111',
        )
        self.tipo_almacen = TipoAlmacen.objects.create(
            codigo='SILO-GDA', nombre='Silo GDA', orden=1,
        )
        self.almacen = Almacen.objects.create(
            codigo='SIL-GDA-01',
            nombre='Silo GDA 01',
            tipo_almacen=self.tipo_almacen,
            permite_recepcion=True,
        )
        self.categoria = CategoriaProducto.objects.create(nombre='MP GDA', orden=1)
        self.unidad = UnidadMedida.objects.create(
            nombre='Kilo GDA', abreviatura='kg-gda', tipo='PESO', es_base=True,
        )
        self.producto = Producto.objects.create(
            codigo='GDA-MP-A',
            nombre='Materia GDA',
            categoria=self.categoria,
            unidad_medida=self.unidad,
            tipo='MATERIA_PRIMA',
        )
        self.voucher = VoucherRecepcion.objects.create(
            proveedor=self.proveedor,
            modalidad_entrega='DIRECTO',
            fecha_viaje=date(2026, 4, 27),
            almacen_destino=self.almacen,
            operador_bascula=self.user,
        )
        VoucherLineaMP.objects.create(
            voucher=self.voucher,
            producto=self.producto,
            peso_bruto_kg=Decimal('800.000'),
            peso_tara_kg=Decimal('30.000'),
        )

    def test_voucher_aprobado_archiva_en_gd(self):
        """
        Al aprobar un voucher, si TipoDocumento(RG) y Area existen, se debe
        crear un Documento en GD y popular `documento_archivado_id`.
        """
        # Mock para evitar dependencia de seeds GD en el tenant de test.
        with patch(
            'apps.supply_chain.recepcion.models.VoucherRecepcion.archivar_en_gd'
        ) as mock_archivar:
            # Simular que archivar populó el campo
            def _fake_archivar(usuario):
                self.voucher.documento_archivado_id = 42
                self.voucher.save(update_fields=['documento_archivado_id'])
                return None
            mock_archivar.side_effect = _fake_archivar

            self.voucher.aprobar()
            self.voucher.refresh_from_db()

            # El signal debe haber invocado archivar_en_gd
            self.assertTrue(mock_archivar.called)
            self.assertEqual(self.voucher.documento_archivado_id, 42)

    def test_voucher_doble_aprobacion_es_idempotente(self):
        """
        Aprobar dos veces no debe re-archivar (la segunda llamada al signal
        chequea documento_archivado_id ya poblado y retorna).
        """
        # Simular que ya se archivó previamente
        self.voucher.documento_archivado_id = 99
        self.voucher.save(update_fields=['documento_archivado_id'])

        with patch(
            'apps.supply_chain.recepcion.models.VoucherRecepcion.archivar_en_gd'
        ) as mock_archivar:
            self.voucher.aprobar()  # primera vez (cambia estado)
            # En aprobar() idempotente — la segunda llamada no hace save,
            # pero el signal solo dispara en post_save. Re-llamar aprobar
            # cuando ya está APROBADO retorna sin save → no dispara signal.
            self.voucher.aprobar()  # segunda vez (no-op por estado)

            # archivar_en_gd no debe haberse invocado (skipped por
            # documento_archivado_id ya poblado en el signal handler).
            self.assertFalse(
                mock_archivar.called,
                'archivar_en_gd no debería invocarse cuando ya hay documento.',
            )

    def test_archivar_en_gd_es_idempotente_a_nivel_metodo(self):
        """
        El método archivar_en_gd debe retornar None inmediatamente si el
        campo documento_archivado_id ya está poblado, sin tocar GD.
        """
        self.voucher.documento_archivado_id = 7
        self.voucher.save(update_fields=['documento_archivado_id'])

        with patch(
            'apps.supply_chain.recepcion.services.VoucherPDFService.generar_pdf_carta'
        ) as mock_pdf:
            result = self.voucher.archivar_en_gd(usuario=self.user)
            self.assertIsNone(result)
            self.assertFalse(
                mock_pdf.called,
                'No debería generarse PDF si ya hay documento archivado.',
            )

    def test_archivar_en_gd_no_rompe_si_falta_tipo_documento(self):
        """
        Si TipoDocumento(RG) no existe en el tenant, archivar_en_gd debe
        retornar None silenciosamente (graceful degradation).
        """
        # Sin seeds de GD en este tenant de test, TipoDocumento.objects.filter
        # retornará empty → archivar_en_gd retorna None sin excepción.
        result = self.voucher.archivar_en_gd(usuario=self.user)
        # Puede ser None por TipoDocumento o por Area faltante — ambos
        # son rutas válidas de graceful degradation.
        self.assertIsNone(result)
        # El voucher NO debe haber quedado con documento_archivado_id
        self.voucher.refresh_from_db()
        self.assertIsNone(self.voucher.documento_archivado_id)
