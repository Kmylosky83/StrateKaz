"""
Tests para las brechas H-GD-A1, H-GD-A2 y H-GD-M3.

H-GD-A1: PDFSealingService._obtener_pdf_base() debe priorizar
         archivo_original cuando documento.es_externo=True.
H-GD-A2: DocumentoViewSet.get_queryset incluye texto_extraido en el
         SearchVector sólo si la confianza OCR es >= 0.7.
H-GD-M3: OcrService respeta settings.OCR_MAX_PAGES.

Patrón obligatorio: BaseTenantTestCase (apps.core.tests.base) — tests
sobre TENANT_APPS deben correr en schema real de tenant.
"""

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from apps.core.tests.base import BaseTenantTestCase

from apps.infraestructura.gestion_documental.models import (
    Documento,
    TipoDocumento,
)
from apps.infraestructura.gestion_documental.services.pdf_sealing import (
    PDFSealingService,
)
from apps.infraestructura.gestion_documental.services_ocr import OcrService


# Header mínimo de PDF (firma %PDF-1.4 + EOF). pyHanko no lo procesa
# en estos tests porque sólo testeamos el helper _obtener_pdf_base.
PDF_HEADER_ORIGINAL = (
    b'%PDF-1.4\n'
    b'%\xe2\xe3\xcf\xd3\n'
    b'ORIGINAL_CONTENT_MARKER\n'
    b'%%EOF\n'
)
PDF_HEADER_GENERADO = (
    b'%PDF-1.4\n'
    b'%\xe2\xe3\xcf\xd3\n'
    b'GENERADO_CONTENT_MARKER\n'
    b'%%EOF\n'
)


def _make_tipo_documento(user):
    """Crea un TipoDocumento mínimo para tests."""
    return TipoDocumento.objects.create(
        codigo='PR',
        nombre='Procedimiento',
        prefijo_codigo='PR-',
        created_by=user,
    )


class TestObtenerPdfBaseAdoptado(BaseTenantTestCase):
    """
    H-GD-A1: para documentos adoptados (es_externo=True), el sellado debe
    leer el PDF subido por el usuario (archivo_original), NO el archivo_pdf
    que pudiese haberse generado como preview.
    """

    def setUp(self):
        super().setUp()
        self.user = self.create_user()
        self.tipo = _make_tipo_documento(self.user)

    def _crear_documento_externo(self, con_archivo_pdf=False):
        doc = Documento.objects.create(
            codigo='PR-EXT-001',
            titulo='Manual adoptado externamente',
            tipo_documento=self.tipo,
            estado='BORRADOR',
            clasificacion='INTERNO',
            elaborado_por=self.user,
            es_externo=True,
            archivo_original=SimpleUploadedFile(
                'manual_externo.pdf',
                PDF_HEADER_ORIGINAL,
                content_type='application/pdf',
            ),
        )
        if con_archivo_pdf:
            doc.archivo_pdf = SimpleUploadedFile(
                'preview_generado.pdf',
                PDF_HEADER_GENERADO,
                content_type='application/pdf',
            )
            doc.save(update_fields=['archivo_pdf'])
        return doc

    def test_externo_solo_con_archivo_original_usa_original(self):
        doc = self._crear_documento_externo(con_archivo_pdf=False)
        buffer, fuente = PDFSealingService._obtener_pdf_base(doc)
        contenido = buffer.read()
        self.assertEqual(fuente, 'archivo_original')
        self.assertIn(b'ORIGINAL_CONTENT_MARKER', contenido)
        self.assertNotIn(b'GENERADO_CONTENT_MARKER', contenido)

    def test_externo_con_ambos_archivos_prefiere_archivo_original(self):
        """
        Caso bug original: doc adoptado tenía además un archivo_pdf
        preview generado y el helper viejo elegía el preview en lugar
        del PDF subido por el usuario.
        """
        doc = self._crear_documento_externo(con_archivo_pdf=True)
        buffer, fuente = PDFSealingService._obtener_pdf_base(doc)
        contenido = buffer.read()
        self.assertEqual(fuente, 'archivo_original')
        self.assertIn(b'ORIGINAL_CONTENT_MARKER', contenido)
        self.assertNotIn(b'GENERADO_CONTENT_MARKER', contenido)


class TestObtenerPdfBaseInterno(BaseTenantTestCase):
    """
    H-GD-A1: documentos internos (es_externo=False) sí deben usar
    archivo_pdf cuando existe, y caer a generado_html en su defecto.
    """

    def setUp(self):
        super().setUp()
        self.user = self.create_user()
        self.tipo = _make_tipo_documento(self.user)

    def test_interno_con_archivo_pdf_usa_archivo_pdf(self):
        doc = Documento.objects.create(
            codigo='PR-INT-001',
            titulo='Procedimiento interno',
            tipo_documento=self.tipo,
            estado='BORRADOR',
            clasificacion='INTERNO',
            elaborado_por=self.user,
            es_externo=False,
            archivo_pdf=SimpleUploadedFile(
                'procedimiento.pdf',
                PDF_HEADER_GENERADO,
                content_type='application/pdf',
            ),
        )
        buffer, fuente = PDFSealingService._obtener_pdf_base(doc)
        contenido = buffer.read()
        self.assertEqual(fuente, 'archivo_pdf')
        self.assertIn(b'GENERADO_CONTENT_MARKER', contenido)


class TestSearchVectorTextoExtraidoConfianza(BaseTenantTestCase):
    """
    H-GD-A2: la búsqueda full-text incluye texto_extraido como peso D
    sólo cuando ocr_metadatos.confianza >= 0.7. Documentos con OCR
    pobre no aparecen en resultados que dependan del texto extraído.
    """

    def setUp(self):
        super().setUp()
        # Superuser para bypass RBAC en este test (foco: ranking de
        # SearchVector, no permisos granulares).
        self.user = self.create_user(is_superuser=True, is_staff=True)
        self.headers = self.authenticate_as(self.user)
        self.tipo = _make_tipo_documento(self.user)
        # ModuleAccessMiddleware exige SystemModule 'fundacion' habilitado
        # porque /api/gestion-estrategica/ se mapea a 'fundacion'.
        from apps.core.models import SystemModule
        SystemModule.objects.get_or_create(
            code='fundacion',
            defaults={'name': 'Fundacion', 'is_enabled': True},
        )

    def _crear_doc_con_ocr(self, codigo, titulo, texto, confianza):
        return Documento.objects.create(
            codigo=codigo,
            titulo=titulo,
            tipo_documento=self.tipo,
            estado='PUBLICADO',
            clasificacion='INTERNO',
            elaborado_por=self.user,
            texto_extraido=texto,
            ocr_estado='COMPLETADO',
            ocr_metadatos={
                'metodo': 'tesseract',
                'confianza': confianza,
                'paginas_procesadas': 1,
                'total_paginas': 1,
                'duracion_seg': 1.0,
                'error': None,
            },
        )

    def test_alta_confianza_aparece_en_busqueda(self):
        """OCR de alta calidad: la palabra del texto_extraido debe encontrarse."""
        doc_buena = self._crear_doc_con_ocr(
            codigo='PR-OK-001',
            titulo='Documento bien escaneado',
            texto='palabraunicabuenacalidad evidencia auditoria',
            confianza=0.95,
        )
        url = '/api/gestion-estrategica/gestion-documental/documentos/?buscar=palabraunicabuenacalidad'
        response = self.client.get(url, **self.headers)
        self.assertEqual(response.status_code, 200, response.content)
        data = response.json()
        ids = {d['id'] for d in data.get('results', data)}
        self.assertIn(doc_buena.id, ids)

    def test_baja_confianza_no_aparece_por_texto_extraido(self):
        """OCR ruidoso: NO debe aparecer si la palabra sólo está en texto_extraido."""
        # Documento con texto extraído ruidoso (confianza baja)
        doc_malo = self._crear_doc_con_ocr(
            codigo='PR-MAL-001',
            titulo='Otro documento',
            texto='palabraruidosaocrmalo',
            confianza=0.3,
        )
        # Otro documento bueno para asegurar que la búsqueda funciona
        doc_bueno = self._crear_doc_con_ocr(
            codigo='PR-OK-002',
            titulo='Documento limpio',
            texto='palabraruidosaocrmalo evidencia',
            confianza=0.9,
        )
        url = '/api/gestion-estrategica/gestion-documental/documentos/?buscar=palabraruidosaocrmalo'
        response = self.client.get(url, **self.headers)
        self.assertEqual(response.status_code, 200, response.content)
        data = response.json()
        ids = {d['id'] for d in data.get('results', data)}
        # El documento de baja confianza NO debe aparecer
        self.assertNotIn(doc_malo.id, ids)
        # El documento de alta confianza SÍ debe aparecer
        self.assertIn(doc_bueno.id, ids)

    def test_alta_confianza_ranking_por_texto(self):
        """
        Cuando dos documentos contienen la palabra en texto_extraido pero
        sólo uno tiene confianza alta, el de confianza alta debe rankear
        primero (no se filtra el otro porque coincide por título o por
        otro campo, pero el ranking debe priorizar al limpio).
        """
        doc_alto = self._crear_doc_con_ocr(
            codigo='PR-RANK-001',
            titulo='Limpio',
            texto='kazterminoexclusivo presente con alta confianza',
            confianza=0.9,
        )
        doc_bajo = self._crear_doc_con_ocr(
            codigo='PR-RANK-002',
            titulo='Sucio',
            texto='kazterminoexclusivo apenas legible',
            confianza=0.4,
        )
        url = '/api/gestion-estrategica/gestion-documental/documentos/?buscar=kazterminoexclusivo'
        response = self.client.get(url, **self.headers)
        self.assertEqual(response.status_code, 200, response.content)
        data = response.json()
        results = data.get('results', data)
        ids = [d['id'] for d in results]
        # El doc_alto debe aparecer; doc_bajo no debe rankear por el texto.
        self.assertIn(doc_alto.id, ids)
        self.assertNotIn(doc_bajo.id, ids)


class TestOcrMaxPagesConfigurable(BaseTenantTestCase):
    """
    H-GD-M3: OcrService respeta settings.OCR_MAX_PAGES.
    Smoke test: el helper _max_pages() refleja el setting en runtime.
    """

    def test_default_es_200(self):
        # Sin override: default = 200
        self.assertEqual(OcrService._max_pages(), 200)

    @override_settings(OCR_MAX_PAGES=50)
    def test_override_settings_se_respeta(self):
        self.assertEqual(OcrService._max_pages(), 50)

    @override_settings(OCR_MAX_PAGES=500)
    def test_override_settings_subir_limite(self):
        self.assertEqual(OcrService._max_pages(), 500)
