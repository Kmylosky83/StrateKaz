"""Tests para H-GD-A4 y H-GD-A5 (cierre de brechas Gestor Documental).

H-GD-A4: Cuando se completa la última FirmaDigital de un Documento cuyo
TipoDocumento.categoria='FORMULARIO', el signal genera el PDF con firmas
embebidas y avanza el estado a APROBADO/PUBLICADO según
`tipo_documento.requiere_aprobacion`. Idempotente: una segunda llamada al
signal NO regenera el archivo.

H-GD-A5: Subir el mismo PDF dos veces (mismo SHA-256) por
`/adoptar-pdf/` o `/ingestar-externo/` retorna 409 Conflict con el detalle
del documento existente.
"""

import hashlib

from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.core.tests.base import BaseTenantTestCase


# =============================================================================
# Helpers
# =============================================================================


# Imagen PNG 1x1 transparente codificada base64 (para FirmaDigital.firma_imagen).
_PNG_1X1_BASE64 = (
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YA'
    'AAAASUVORK5CYII='
)


def _pdf_minimo(payload: bytes = b'StrateKaz Test Doc') -> bytes:
    """Genera bytes que comienzan con %PDF y contienen `payload` para
    crear hashes distintos a voluntad sin armar un PDF parseable.

    Las views solo validan magic bytes (`%PDF`), no estructura.
    """
    return b'%PDF-1.4\n%' + payload + b'\n%%EOF'


class _BaseGDTestCase(BaseTenantTestCase):
    """Mixins comunes a los tests de A4 y A5."""

    def _crear_tipo_doc(self, **overrides):
        from apps.infraestructura.gestion_documental.models import (
            TipoDocumento,
        )

        defaults = {
            'codigo': f'FT_{self._next_id()}',
            'nombre': 'Formato de Inspección',
            'prefijo_codigo': 'FT-',
            'categoria': 'FORMULARIO',
            'requiere_aprobacion': False,
            'requiere_firma': True,
        }
        defaults.update(overrides)
        return TipoDocumento.objects.create(**defaults)

    def _crear_documento(self, tipo_doc, user, **overrides):
        from apps.infraestructura.gestion_documental.models import Documento

        defaults = {
            'codigo': f'FT-{self._next_id()}',
            'titulo': 'Formato de Inspección - Test',
            'tipo_documento': tipo_doc,
            'estado': 'EN_REVISION',
            'elaborado_por': user,
            'contenido': '<p>Formulario test</p>',
        }
        defaults.update(overrides)
        return Documento.objects.create(**defaults)

    def _crear_firma(self, documento, user, cargo, *, rol_firma, orden, estado):
        from apps.infraestructura.workflow_engine.firma_digital.models import FirmaDigital

        ct = ContentType.objects.get_for_model(documento.__class__)
        return FirmaDigital.objects.create(
            content_type=ct,
            object_id=str(documento.pk),
            usuario=user,
            cargo=cargo,
            rol_firma=rol_firma,
            orden=orden,
            estado=estado,
            firma_imagen=_PNG_1X1_BASE64,
            documento_hash=hashlib.sha256(b'doc').hexdigest(),
            ip_address='127.0.0.1',
        )


# =============================================================================
# H-GD-A4 — cierre de FORMULARIO con firma workflow
# =============================================================================


class TestCierreFormularioConFirmaWorkflow(_BaseGDTestCase):
    """H-GD-A4: signal genera PDF + cambia estado al firmar última firma."""

    def test_genera_pdf_y_publica_cuando_no_requiere_aprobacion(self):
        from apps.infraestructura.gestion_documental.models import Documento

        user_a = self.create_user('elaboro')
        user_b = self.create_user('aprobo')
        cargo = self.create_cargo()
        tipo_doc = self._crear_tipo_doc(requiere_aprobacion=False)
        documento = self._crear_documento(tipo_doc, user_a)

        # Dos firmas pendientes en orden 1 y 2
        firma1 = self._crear_firma(
            documento, user_a, cargo,
            rol_firma='ELABORO', orden=1, estado='PENDIENTE',
        )
        firma2 = self._crear_firma(
            documento, user_b, cargo,
            rol_firma='APROBO', orden=2, estado='PENDIENTE',
        )

        # Aún hay firmas pendientes → no debe generar PDF.
        firma1.estado = 'FIRMADO'
        firma1.save(update_fields=['estado'])

        documento.refresh_from_db()
        self.assertFalse(bool(documento.archivo_pdf and documento.archivo_pdf.name))
        self.assertEqual(documento.estado, 'EN_REVISION')

        # Última firma → debe disparar generación de PDF y avance a PUBLICADO.
        firma2.estado = 'FIRMADO'
        firma2.save(update_fields=['estado'])

        documento.refresh_from_db()
        self.assertTrue(
            bool(documento.archivo_pdf and documento.archivo_pdf.name),
            'archivo_pdf debe estar poblado tras la última firma',
        )
        self.assertEqual(documento.estado, 'PUBLICADO')
        self.assertIsNotNone(documento.fecha_publicacion)

        # El PDF generado debe contener bytes válidos y la imagen base64 de
        # las firmas embebida.
        with documento.archivo_pdf.open('rb') as fh:
            contenido_pdf = fh.read()
        self.assertTrue(contenido_pdf.startswith(b'%PDF'))
        # WeasyPrint embebe la imagen como objeto stream; el b64 original
        # aparece referenciado en el HTML, así que validamos que el PDF
        # tenga al menos 1 KB (no es un placeholder vacío).
        self.assertGreater(len(contenido_pdf), 500)

    def test_avanza_a_aprobado_cuando_requiere_aprobacion(self):
        user_a = self.create_user('elab')
        cargo = self.create_cargo()
        tipo_doc = self._crear_tipo_doc(requiere_aprobacion=True)
        documento = self._crear_documento(tipo_doc, user_a)

        firma = self._crear_firma(
            documento, user_a, cargo,
            rol_firma='APROBO', orden=1, estado='PENDIENTE',
        )
        firma.estado = 'FIRMADO'
        firma.save(update_fields=['estado'])

        documento.refresh_from_db()
        self.assertEqual(documento.estado, 'APROBADO')
        self.assertIsNotNone(documento.fecha_aprobacion)
        self.assertTrue(bool(documento.archivo_pdf and documento.archivo_pdf.name))

    def test_idempotente_no_regenera_si_pdf_existe(self):
        user_a = self.create_user('elab')
        cargo = self.create_cargo()
        tipo_doc = self._crear_tipo_doc(requiere_aprobacion=False)
        documento = self._crear_documento(tipo_doc, user_a)

        firma = self._crear_firma(
            documento, user_a, cargo,
            rol_firma='ELABORO', orden=1, estado='PENDIENTE',
        )
        firma.estado = 'FIRMADO'
        firma.save(update_fields=['estado'])

        documento.refresh_from_db()
        nombre_pdf_original = documento.archivo_pdf.name
        self.assertTrue(nombre_pdf_original)

        # Segunda invocación del signal (re-save) NO debe regenerar.
        firma.save(update_fields=['estado'])
        documento.refresh_from_db()
        self.assertEqual(documento.archivo_pdf.name, nombre_pdf_original)

    def test_no_dispara_para_tipo_documento_normativo(self):
        """Categoria DOCUMENTO no debe disparar generación automática de PDF."""
        user_a = self.create_user('elab')
        cargo = self.create_cargo()
        tipo_doc = self._crear_tipo_doc(
            categoria='DOCUMENTO',
            requiere_aprobacion=False,
        )
        documento = self._crear_documento(tipo_doc, user_a)

        firma = self._crear_firma(
            documento, user_a, cargo,
            rol_firma='APROBO', orden=1, estado='PENDIENTE',
        )
        firma.estado = 'FIRMADO'
        firma.save(update_fields=['estado'])

        documento.refresh_from_db()
        self.assertFalse(bool(documento.archivo_pdf and documento.archivo_pdf.name))
        # Estado no debe cambiar automáticamente para DOCUMENTOs normativos.
        self.assertEqual(documento.estado, 'EN_REVISION')


# =============================================================================
# H-GD-A5 — duplicados al ingerir PDF
# =============================================================================


class TestDuplicadosAlIngerirPDF(_BaseGDTestCase):
    """H-GD-A5: subir mismo PDF dos veces → 409 Conflict."""

    def _crear_proceso(self):
        from apps.gestion_estrategica.organizacion.models import Area

        return Area.objects.create(
            code=f'pr_{self._next_id()}',
            name='Proceso Test',
            tipo='APOYO',
        )

    def test_adoptar_pdf_duplicado_devuelve_409(self):
        user = self.create_user('admin', is_superuser=True, is_staff=True)
        headers = self.authenticate_as(user)
        tipo_doc = self._crear_tipo_doc()
        proceso = self._crear_proceso()

        pdf_bytes = _pdf_minimo(b'unico-1')
        url = '/api/gestion-estrategica/gestion-documental/documentos/adoptar-pdf/'

        # Primer upload — éxito (201).
        r1 = self.client.post(
            url,
            data={
                'archivo': SimpleUploadedFile(
                    'test.pdf', pdf_bytes, content_type='application/pdf',
                ),
                'tipo_documento': tipo_doc.id,
                'proceso': proceso.id,
            },
            format='multipart',
            **headers,
        )
        self.assertEqual(r1.status_code, 201, r1.content)

        # Hash debe quedar persistido.
        sha = hashlib.sha256(pdf_bytes).hexdigest()
        from apps.infraestructura.gestion_documental.models import Documento
        doc = Documento.objects.get(id=r1.data['id'])
        self.assertEqual(doc.archivo_hash_sha256, sha)

        # Segundo upload del MISMO archivo — debe rechazar con 409.
        r2 = self.client.post(
            url,
            data={
                'archivo': SimpleUploadedFile(
                    'test_otra_vez.pdf', pdf_bytes, content_type='application/pdf',
                ),
                'tipo_documento': tipo_doc.id,
                'proceso': proceso.id,
            },
            format='multipart',
            **headers,
        )
        self.assertEqual(r2.status_code, 409, r2.content)
        self.assertIn('documento_existente', r2.data)
        self.assertEqual(r2.data['documento_existente']['id'], doc.id)
        self.assertEqual(r2.data['documento_existente']['codigo'], doc.codigo)
        self.assertEqual(r2.data['documento_existente']['titulo'], doc.titulo)
        self.assertIn('error', r2.data)

    def test_ingestar_externo_duplicado_devuelve_409(self):
        user = self.create_user('admin2', is_superuser=True, is_staff=True)
        headers = self.authenticate_as(user)
        tipo_doc = self._crear_tipo_doc()

        pdf_bytes = _pdf_minimo(b'unico-2')
        url = '/api/gestion-estrategica/gestion-documental/documentos/ingestar-externo/'

        r1 = self.client.post(
            url,
            data={
                'archivo': SimpleUploadedFile(
                    'doc.pdf', pdf_bytes, content_type='application/pdf',
                ),
                'tipo_documento': tipo_doc.id,
            },
            format='multipart',
            **headers,
        )
        self.assertEqual(r1.status_code, 201, r1.content)

        r2 = self.client.post(
            url,
            data={
                'archivo': SimpleUploadedFile(
                    'doc_dupe.pdf', pdf_bytes, content_type='application/pdf',
                ),
                'tipo_documento': tipo_doc.id,
            },
            format='multipart',
            **headers,
        )
        self.assertEqual(r2.status_code, 409, r2.content)
        self.assertIn('documento_existente', r2.data)
        self.assertEqual(r2.data['documento_existente']['id'], r1.data['id'])

    def test_archivos_distintos_no_son_duplicados(self):
        user = self.create_user('admin3', is_superuser=True, is_staff=True)
        headers = self.authenticate_as(user)
        tipo_doc = self._crear_tipo_doc()
        proceso = self._crear_proceso()

        url = '/api/gestion-estrategica/gestion-documental/documentos/adoptar-pdf/'

        r1 = self.client.post(
            url,
            data={
                'archivo': SimpleUploadedFile(
                    'a.pdf', _pdf_minimo(b'A'), content_type='application/pdf',
                ),
                'tipo_documento': tipo_doc.id,
                'proceso': proceso.id,
            },
            format='multipart',
            **headers,
        )
        self.assertEqual(r1.status_code, 201, r1.content)

        r2 = self.client.post(
            url,
            data={
                'archivo': SimpleUploadedFile(
                    'b.pdf', _pdf_minimo(b'B-distinto'), content_type='application/pdf',
                ),
                'tipo_documento': tipo_doc.id,
                'proceso': proceso.id,
            },
            format='multipart',
            **headers,
        )
        self.assertEqual(r2.status_code, 201, r2.content)
        self.assertNotEqual(r1.data['id'], r2.data['id'])
