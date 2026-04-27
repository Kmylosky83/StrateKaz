"""H-SC-GD-ARCHIVE: tests del archivado en Gestion Documental
al completar un VoucherRecoleccion.

Cobertura:
  - Al completar el voucher, se intenta archivar y queda
    documento_archivado_id seteado.
  - Doble completar (idempotencia): el segundo intento NO crea otro Documento.
  - Si el archivado falla (mock excepcion), la transicion del voucher NO se rompe.
"""
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from apps.core.tests.base import BaseTenantTestCase
from apps.core.models import TipoDocumentoIdentidad
from apps.supply_chain.catalogos.models import RutaRecoleccion
from apps.supply_chain.recoleccion.models import VoucherRecoleccion


def _crear_proveedor(numero, nombre='Productor GD'):
    tipo_doc, _ = TipoDocumentoIdentidad.objects.get_or_create(
        codigo='CC',
        defaults={'nombre': 'Cédula de Ciudadanía', 'orden': 1, 'is_active': True},
    )
    from apps.catalogo_productos.proveedores.models import Proveedor
    return Proveedor.objects.create(
        razon_social=nombre,
        nombre_comercial=nombre,
        tipo_persona=Proveedor.TipoPersona.NATURAL,
        tipo_documento=tipo_doc,
        numero_documento=numero,
    )


def _crear_voucher_borrador(test_case, codigo_doc='CC1', codigo_prod='PROD-GD'):
    user = test_case.create_user('op-gd')
    ruta = RutaRecoleccion.objects.create(nombre='Ruta GD')
    prov = _crear_proveedor(codigo_doc)
    from apps.catalogo_productos.models import Producto
    prod = Producto.objects.create(
        codigo=codigo_prod, nombre='Leche cruda GD', tipo='MATERIA_PRIMA',
    )
    voucher = VoucherRecoleccion.objects.create(
        ruta=ruta, fecha_recoleccion=date.today(),
        proveedor=prov, producto=prod, cantidad=Decimal('120'),
        operador=user,
    )
    return user, voucher


class TestVoucherCompletadoIntentaArchivarEnGd(BaseTenantTestCase):
    def test_voucher_completado_intenta_archivar_en_gd(self):
        user, voucher = _crear_voucher_borrador(self, codigo_doc='10001')
        headers = self.authenticate_as(user)

        # Mock de DocumentoService.archivar_registro para evitar dependencias
        # de proceso/Area/PDF reales.
        fake_doc = type('FakeDoc', (), {'id': 9999})()
        target = (
            'apps.gestion_estrategica.gestion_documental.services.'
            'documento_service.DocumentoService.archivar_registro'
        )
        with patch(target, return_value=fake_doc) as mock_archivar:
            # Tambien stub el resolver de proceso para no requerir Areas
            with patch(
                'apps.supply_chain.recoleccion.services._resolver_proceso_default',
                return_value=type('FakeArea', (), {'id': 1, 'name': 'Test'})(),
            ):
                # Mock WeasyPrint para no renderizar PDF real en test
                with patch(
                    'apps.supply_chain.recoleccion.services.HTML',
                ) as mock_html:
                    mock_html.return_value.write_pdf.return_value = b'%PDF-fake'
                    response = self.client.post(
                        f'/api/supply-chain/recoleccion/vouchers/{voucher.id}/completar/',
                        **headers,
                    )

        self.assertEqual(response.status_code, 200)
        voucher.refresh_from_db()
        self.assertEqual(voucher.estado, VoucherRecoleccion.Estado.COMPLETADO)
        self.assertEqual(voucher.documento_archivado_id, 9999)
        mock_archivar.assert_called_once()


class TestVoucherDobleCompletarNoDuplica(BaseTenantTestCase):
    def test_voucher_doble_completar_no_duplica(self):
        """Idempotente: si ya esta archivado, no crea otro Documento."""
        from apps.supply_chain.recoleccion.services import archivar_voucher_en_gd

        user, voucher = _crear_voucher_borrador(self, codigo_doc='10002')
        # Simular que ya fue archivado previamente.
        voucher.documento_archivado_id = 555
        voucher.save(update_fields=['documento_archivado_id'])

        target = (
            'apps.gestion_estrategica.gestion_documental.services.'
            'documento_service.DocumentoService.archivar_registro'
        )
        with patch(target) as mock_archivar:
            result = archivar_voucher_en_gd(voucher, user)

        self.assertIsNone(result)
        mock_archivar.assert_not_called()
        voucher.refresh_from_db()
        self.assertEqual(voucher.documento_archivado_id, 555)


class TestArchivadoFallaSilenciosoNoRompeCompletar(BaseTenantTestCase):
    def test_archivado_falla_silencioso_no_rompe_completar(self):
        """Si GD falla, la transicion del voucher debe completarse igual."""
        user, voucher = _crear_voucher_borrador(self, codigo_doc='10003')
        headers = self.authenticate_as(user)

        target = (
            'apps.gestion_estrategica.gestion_documental.services.'
            'documento_service.DocumentoService.archivar_registro'
        )
        with patch(target, side_effect=RuntimeError('GD caido')):
            with patch(
                'apps.supply_chain.recoleccion.services._resolver_proceso_default',
                return_value=type('FakeArea', (), {'id': 1, 'name': 'Test'})(),
            ):
                with patch(
                    'apps.supply_chain.recoleccion.services.HTML',
                ) as mock_html:
                    mock_html.return_value.write_pdf.return_value = b'%PDF-fake'
                    response = self.client.post(
                        f'/api/supply-chain/recoleccion/vouchers/{voucher.id}/completar/',
                        **headers,
                    )

        # La transicion debe haberse hecho, pero documento_archivado_id queda en None.
        self.assertEqual(response.status_code, 200)
        voucher.refresh_from_db()
        self.assertEqual(voucher.estado, VoucherRecoleccion.Estado.COMPLETADO)
        self.assertIsNone(voucher.documento_archivado_id)
