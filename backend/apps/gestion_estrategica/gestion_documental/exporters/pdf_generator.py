"""
Generador de PDF para Gestión Documental
=========================================
Genera PDFs profesionales de documentos del sistema de gestión
usando WeasyPrint (HTML -> PDF).

Incluye:
- Firmas digitales manuscritas incrustadas (canvas → Base64)
- Código QR verificable con hash SHA-256
- Watermarks dinámicos según estado (BORRADOR, COPIA CONTROLADA, OBSOLETO)
- Metadata grid ISO (código, versión, estado, clasificación)

Patrón: Idéntico a identidad/exporters/pdf_generator.py
"""
import base64
import hashlib
from io import BytesIO
from datetime import datetime

try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False

try:
    import qrcode
    from qrcode.image.svg import SvgPathImage
    QRCODE_AVAILABLE = True
except ImportError:
    QRCODE_AVAILABLE = False


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

        /* --- Bloque de firmas digitales --- */
        .firmas-section { margin-top: 40px; border-top: 2px solid #2d3748; padding-top: 20px; page-break-inside: avoid; }
        .firmas-title { font-size: 12pt; font-weight: 700; color: #1a365d; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
        .firmas-grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
        .firma-card { flex: 1 1 200px; max-width: 32%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; background: #fafafa; }
        .firma-card-header { font-size: 9pt; font-weight: 700; color: #2c5282; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
        .firma-imagen { width: 160px; height: 60px; object-fit: contain; margin: 0 auto 8px; display: block; }
        .firma-linea { border-bottom: 1px solid #2d3748; width: 80%; margin: 0 auto 8px; }
        .firma-nombre { font-size: 10pt; font-weight: 600; color: #2d3748; }
        .firma-cargo { font-size: 8pt; color: #718096; margin-top: 2px; }
        .firma-fecha { font-size: 7pt; color: #a0aec0; margin-top: 4px; }
        .firma-hash { font-size: 6pt; color: #cbd5e0; font-family: monospace; margin-top: 2px; word-break: break-all; }
        .firma-pendiente { font-style: italic; color: #a0aec0; font-size: 9pt; padding: 20px 0; }

        /* --- QR verificable --- */
        .qr-section { margin-top: 24px; display: flex; align-items: center; gap: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        .qr-code { width: 80px; height: 80px; }
        .qr-info { font-size: 7pt; color: #a0aec0; line-height: 1.4; }
        .qr-hash { font-family: monospace; font-size: 6.5pt; color: #718096; word-break: break-all; }
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

        # Marca de agua dinámica según estado del documento
        watermark_html = ''
        watermark_css = ''
        usuario_nombre = usuario.get_full_name() if usuario else 'N/A'
        fecha_descarga = datetime.now().strftime('%d/%m/%Y %H:%M')

        if documento.estado == 'BORRADOR':
            watermark_css = self.WATERMARK_CSS
            watermark_html = (
                '<div class="watermark">'
                'BORRADOR<br>'
                '<span style="font-size: 14pt;">Documento no aprobado — Solo uso interno</span>'
                '</div>'
            )
        elif documento.estado == 'EN_REVISION':
            watermark_css = self.WATERMARK_CSS
            watermark_html = (
                '<div class="watermark">'
                'EN REVISIÓN<br>'
                '<span style="font-size: 14pt;">Pendiente de aprobación</span>'
                '</div>'
            )
        elif documento.estado == 'PUBLICADO':
            watermark_css = self.WATERMARK_CSS
            watermark_html = (
                f'<div class="watermark">'
                f'COPIA CONTROLADA<br>'
                f'<span style="font-size: 14pt;">{fecha_descarga} — {usuario_nombre}</span>'
                f'</div>'
            )
        elif documento.estado == 'OBSOLETO':
            watermark_css = self.WATERMARK_CSS.replace(
                'rgba(200, 200, 200, 0.25)', 'rgba(220, 50, 50, 0.20)'
            )
            watermark_html = (
                '<div class="watermark">'
                'OBSOLETO<br>'
                '<span style="font-size: 14pt;">Documento fuera de vigencia</span>'
                '</div>'
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

            {self._generar_bloque_firmas(documento)}

            {self._generar_bloque_qr(documento, empresa_info)}

            <div class="section" style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                <p style="font-size: 8pt; color: #a0aec0;">
                    Documento generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} |
                    {empresa_info['razon_social']} |
                    Gestión Documental StrateKaz
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

    # =========================================================================
    # Bloque de firmas digitales manuscritas
    # =========================================================================

    def _generar_bloque_firmas(self, documento):
        """
        Genera HTML con las firmas digitales manuscritas del documento.
        Muestra imagen de firma (canvas), nombre, cargo, fecha y hash truncado.
        Si la firma está pendiente, muestra placeholder con línea.
        """
        try:
            firmas = documento.get_firmas_digitales().select_related(
                'usuario', 'cargo'
            ).order_by('orden', 'created_at')
        except Exception:
            return ''

        if not firmas.exists():
            return ''

        ROL_LABELS = {
            'ELABORO': 'Elaboró',
            'REVISO': 'Revisó',
            'APROBO': 'Aprobó',
            'VALIDO': 'Validó',
            'AUTORIZO': 'Autorizó',
        }

        cards_html = ''
        for firma in firmas:
            rol_label = ROL_LABELS.get(firma.rol_firma, firma.rol_firma)
            nombre = firma.usuario.get_full_name() if firma.usuario else 'N/A'
            cargo_nombre = firma.cargo.nombre if firma.cargo else ''
            fecha_str = (
                firma.fecha_firma.strftime('%d/%m/%Y %H:%M')
                if firma.fecha_firma else ''
            )
            hash_short = firma.firma_hash[:16] if firma.firma_hash else ''

            if firma.estado == 'FIRMADO' and firma.firma_imagen:
                # Firma completada — mostrar imagen del canvas
                # firma_imagen puede ser data:image/png;base64,... o solo base64
                img_src = firma.firma_imagen
                if not img_src.startswith('data:'):
                    img_src = f'data:image/png;base64,{img_src}'

                cards_html += f'''
                <div class="firma-card">
                    <div class="firma-card-header">{rol_label}</div>
                    <img src="{img_src}" class="firma-imagen" alt="Firma {rol_label}" />
                    <div class="firma-linea"></div>
                    <div class="firma-nombre">{nombre}</div>
                    <div class="firma-cargo">{cargo_nombre}</div>
                    <div class="firma-fecha">{fecha_str}</div>
                    <div class="firma-hash">Hash: {hash_short}...</div>
                </div>
                '''
            elif firma.estado == 'RECHAZADO':
                cards_html += f'''
                <div class="firma-card" style="border-color: #fc8181;">
                    <div class="firma-card-header" style="color: #c53030;">
                        {rol_label} — RECHAZADA
                    </div>
                    <div class="firma-pendiente">Firma rechazada</div>
                    <div class="firma-linea"></div>
                    <div class="firma-nombre">{nombre}</div>
                    <div class="firma-cargo">{cargo_nombre}</div>
                    <div class="firma-fecha" style="color: #c53030;">
                        {firma.comentarios or 'Sin motivo especificado'}
                    </div>
                </div>
                '''
            else:
                # Pendiente, delegada o expirada
                estado_label = {
                    'PENDIENTE': 'Pendiente de firma',
                    'DELEGADO': 'Delegada',
                    'EXPIRADO': 'Expirada',
                }.get(firma.estado, 'Pendiente')

                cards_html += f'''
                <div class="firma-card">
                    <div class="firma-card-header">{rol_label}</div>
                    <div class="firma-pendiente">{estado_label}</div>
                    <div class="firma-linea"></div>
                    <div class="firma-nombre">{nombre}</div>
                    <div class="firma-cargo">{cargo_nombre}</div>
                </div>
                '''

        return f'''
        <div class="firmas-section">
            <div class="firmas-title">Control de Firmas</div>
            <div class="firmas-grid">
                {cards_html}
            </div>
        </div>
        '''

    # =========================================================================
    # QR verificable con hash SHA-256
    # =========================================================================

    def _generar_bloque_qr(self, documento, empresa_info):
        """
        Genera código QR con URL de verificación + hash del contenido.
        El QR contiene una URL que permite verificar la autenticidad del documento.
        Incluye hash SHA-256 del contenido para detección de alteraciones.
        """
        if not QRCODE_AVAILABLE:
            return ''

        # Calcular hash del contenido actual
        contenido_raw = (documento.contenido or '') + (documento.codigo or '')
        doc_hash = hashlib.sha256(contenido_raw.encode('utf-8')).hexdigest()

        # URL de verificación (apunta a la app)
        base_url = 'https://app.stratekaz.com'
        verificacion_url = (
            f'{base_url}/verificar-documento'
            f'?codigo={documento.codigo}'
            f'&version={documento.version_actual}'
            f'&hash={doc_hash[:16]}'
        )

        try:
            # Generar QR como PNG Base64
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=4,
                border=1,
            )
            qr.add_data(verificacion_url)
            qr.make(fit=True)

            qr_buffer = BytesIO()
            img = qr.make_image(fill_color='#2d3748', back_color='white')
            img.save(qr_buffer, format='PNG')
            qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode('utf-8')

            fecha_gen = datetime.now().strftime('%d/%m/%Y %H:%M')

            return f'''
            <div class="qr-section">
                <img src="data:image/png;base64,{qr_base64}" class="qr-code"
                     alt="QR Verificación" />
                <div class="qr-info">
                    <strong>Verificación de autenticidad</strong><br>
                    Escanee el código QR para verificar este documento.<br>
                    <span class="qr-hash">SHA-256: {doc_hash}</span><br>
                    {documento.codigo} | v{documento.version_actual} |
                    {empresa_info['razon_social']}<br>
                    Generado: {fecha_gen}
                </div>
            </div>
            '''
        except Exception:
            # Si falla la generación del QR, solo mostrar hash
            return f'''
            <div class="qr-section">
                <div class="qr-info">
                    <strong>Verificación de autenticidad</strong><br>
                    <span class="qr-hash">SHA-256: {doc_hash}</span><br>
                    {documento.codigo} | v{documento.version_actual}
                </div>
            </div>
            '''
