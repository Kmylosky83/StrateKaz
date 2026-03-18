"""
Generador de PDF para Gestion Documental
=========================================
Genera PDFs profesionales de documentos del sistema de gestion
usando WeasyPrint (HTML -> PDF).

Patron: Identico a identidad/exporters/pdf_generator.py
"""
import base64
from io import BytesIO
from datetime import datetime

try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False


class DocumentoPDFGenerator:
    """Genera PDFs de documentos del sistema de gestion documental."""

    BASE_CSS = """
        @page {
            size: A4;
            margin: 2cm 1.5cm;
            @top-center {
                content: element(header);
            }
            @bottom-center {
                content: element(footer);
            }
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333;
        }

        h1 { color: #1a365d; font-size: 18pt; font-weight: 700; margin-bottom: 16px; border-bottom: 2px solid #3182ce; padding-bottom: 8px; }
        h2 { color: #2c5282; font-size: 14pt; font-weight: 600; margin-top: 20px; margin-bottom: 10px; }
        h3 { color: #2d3748; font-size: 12pt; font-weight: 600; margin-top: 16px; margin-bottom: 8px; }

        .header { position: running(header); padding: 10px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .header-logo { max-height: 40px; }
        .header-text { font-size: 9pt; color: #718096; text-align: right; }

        .footer { position: running(footer); padding: 10px 0; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #718096; display: flex; justify-content: space-between; }
        .page-number::after { content: "Pagina " counter(page) " de " counter(pages); }

        .document-metadata { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        .metadata-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .metadata-item { display: flex; flex-direction: column; }
        .metadata-label { font-size: 9pt; color: #718096; font-weight: 500; }
        .metadata-value { font-size: 10pt; color: #2d3748; font-weight: 600; }

        .estado-badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 9pt; font-weight: 600; }
        .estado-BORRADOR { background: #e2e8f0; color: #4a5568; }
        .estado-EN_REVISION { background: #fefcbf; color: #975a16; }
        .estado-APROBADO { background: #c6f6d5; color: #276749; }
        .estado-PUBLICADO { background: #c6f6d5; color: #276749; }
        .estado-OBSOLETO { background: #fed7d7; color: #9b2c2c; }

        .section { margin-bottom: 24px; }
        .section-content { text-align: justify; margin-bottom: 16px; }

        .contenido-documento { margin-top: 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .contenido-documento img { max-width: 100%; height: auto; }
        .contenido-documento table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        .contenido-documento table th, .contenido-documento table td { padding: 8px; border: 1px solid #e2e8f0; font-size: 10pt; }
        .contenido-documento table th { background: #f7fafc; font-weight: 600; }
    """

    def __init__(self, empresa=None):
        self.empresa = empresa
        self.logo_base64 = None
        if empresa and hasattr(empresa, 'logo') and empresa.logo:
            self._load_logo()

    def _load_logo(self):
        try:
            if self.empresa.logo and hasattr(self.empresa.logo, 'path'):
                with open(self.empresa.logo.path, 'rb') as f:
                    self.logo_base64 = base64.b64encode(f.read()).decode('utf-8')
        except Exception:
            pass

    def _get_empresa_info(self):
        if self.empresa:
            return {
                'razon_social': self.empresa.razon_social or 'Empresa',
                'nit': self.empresa.nit or '',
                'logo_base64': self.logo_base64,
            }
        return {'razon_social': 'Empresa', 'nit': '', 'logo_base64': None}

    WATERMARK_CSS = """
        .watermark {
            position: fixed;
            top: 40%;
            left: 10%;
            width: 80%;
            text-align: center;
            transform: rotate(-35deg);
            font-size: 48pt;
            color: rgba(200, 200, 200, 0.25);
            font-weight: 900;
            letter-spacing: 8px;
            z-index: -1;
            pointer-events: none;
        }
    """

    def generate_documento_pdf(self, documento, usuario=None):
        """
        Genera PDF de un documento del sistema de gestión.

        Args:
            documento: Instancia de Documento
            usuario: Usuario que solicita la copia (para marca de agua)

        Returns:
            BytesIO: Buffer con el PDF generado
        """
        if not WEASYPRINT_AVAILABLE:
            raise ImportError("WeasyPrint no está instalado. Ejecute: pip install weasyprint")

        empresa_info = self._get_empresa_info()

        # Aplicar CSS de plantilla si existe
        custom_css = ''
        encabezado_html = ''
        pie_pagina_html = ''
        if documento.plantilla:
            if documento.plantilla.estilos_css:
                custom_css = documento.plantilla.estilos_css
            if documento.plantilla.encabezado:
                encabezado_html = documento.plantilla.encabezado
            if documento.plantilla.pie_pagina:
                pie_pagina_html = documento.plantilla.pie_pagina

        # Sustituir variables en contenido
        contenido = self._sustituir_variables(documento)

        logo_img = (
            f'<img src="data:image/png;base64,{empresa_info["logo_base64"]}" class="header-logo">'
            if empresa_info.get('logo_base64') else ''
        )

        estado_display = documento.get_estado_display()
        clasificacion_display = documento.get_clasificacion_display()

        # Marca de agua para copias controladas (docs PUBLICADOS)
        watermark_html = ''
        watermark_css = ''
        if documento.estado == 'PUBLICADO':
            usuario_nombre = usuario.get_full_name() if usuario else 'N/A'
            fecha_descarga = datetime.now().strftime('%d/%m/%Y %H:%M')
            watermark_css = self.WATERMARK_CSS
            watermark_html = (
                f'<div class="watermark">'
                f'COPIA CONTROLADA<br>'
                f'<span style="font-size: 14pt;">{fecha_descarga} — {usuario_nombre}</span>'
                f'</div>'
            )

        html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>{self.BASE_CSS}</style>
            <style>{watermark_css}</style>
            <style>{custom_css}</style>
        </head>
        <body>
            {watermark_html}
            <div class="header">
                {logo_img}
                <div class="header-text">
                    <strong>{empresa_info['razon_social']}</strong><br>
                    NIT: {empresa_info['nit']}<br>
                    {documento.codigo}
                </div>
            </div>

            <div class="footer">
                <span>{documento.codigo} | v{documento.version_actual}</span>
                <span class="page-number"></span>
            </div>

            {encabezado_html}

            <h1>{documento.titulo}</h1>

            <div class="document-metadata">
                <div class="metadata-grid">
                    <div class="metadata-item">
                        <span class="metadata-label">Codigo</span>
                        <span class="metadata-value">{documento.codigo}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Version</span>
                        <span class="metadata-value">{documento.version_actual}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Estado</span>
                        <span class="metadata-value">
                            <span class="estado-badge estado-{documento.estado}">{estado_display}</span>
                        </span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Clasificacion</span>
                        <span class="metadata-value">{clasificacion_display}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Tipo</span>
                        <span class="metadata-value">{documento.tipo_documento.nombre}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Elaborado por</span>
                        <span class="metadata-value">{documento.elaborado_por.get_full_name()}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Revisado por</span>
                        <span class="metadata-value">{documento.revisado_por.get_full_name() if documento.revisado_por else 'N/A'}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Aprobado por</span>
                        <span class="metadata-value">{documento.aprobado_por.get_full_name() if documento.aprobado_por else 'N/A'}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Fecha Publicacion</span>
                        <span class="metadata-value">{documento.fecha_publicacion.strftime('%d/%m/%Y') if documento.fecha_publicacion else 'N/A'}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Fecha Vigencia</span>
                        <span class="metadata-value">{documento.fecha_vigencia.strftime('%d/%m/%Y') if documento.fecha_vigencia else 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="contenido-documento">
                {contenido}
            </div>

            {pie_pagina_html}

            <div class="section" style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <p style="font-size: 8pt; color: #a0aec0;">
                    Documento generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} |
                    {empresa_info['razon_social']} |
                    Gestion Documental StrateKaz
                </p>
            </div>
        </body>
        </html>
        '''

        pdf_buffer = BytesIO()
        html_doc = HTML(string=html)
        css = CSS(string=self.BASE_CSS + custom_css)
        html_doc.write_pdf(pdf_buffer, stylesheets=[css])
        pdf_buffer.seek(0)
        return pdf_buffer

    def _sustituir_variables(self, documento):
        """Sustituye variables {{var}} en el contenido del documento."""
        contenido = documento.contenido or ''
        empresa_info = self._get_empresa_info()

        variables = {
            '{{codigo}}': documento.codigo or '',
            '{{titulo}}': documento.titulo or '',
            '{{version}}': documento.version_actual or '',
            '{{estado}}': documento.get_estado_display(),
            '{{empresa}}': empresa_info['razon_social'],
            '{{nit}}': empresa_info['nit'],
            '{{fecha_publicacion}}': (
                documento.fecha_publicacion.strftime('%d/%m/%Y')
                if documento.fecha_publicacion else ''
            ),
            '{{fecha_vigencia}}': (
                documento.fecha_vigencia.strftime('%d/%m/%Y')
                if documento.fecha_vigencia else ''
            ),
            '{{elaborado_por}}': (
                documento.elaborado_por.get_full_name()
                if documento.elaborado_por else ''
            ),
            '{{revisado_por}}': (
                documento.revisado_por.get_full_name()
                if documento.revisado_por else ''
            ),
            '{{aprobado_por}}': (
                documento.aprobado_por.get_full_name()
                if documento.aprobado_por else ''
            ),
        }

        for var, value in variables.items():
            contenido = contenido.replace(var, value)

        return contenido
