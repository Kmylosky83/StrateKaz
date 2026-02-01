"""
Generador de PDF para Identidad Corporativa
============================================

Genera documentos PDF profesionales con la identidad corporativa
usando WeasyPrint para renderizado HTML → PDF de alta calidad.

Características:
- Layout profesional A4 con márgenes estándar
- Header/footer con branding corporativo
- Incluye firmas manuscritas digitalizadas
- Versionamiento y metadatos
- Soporte para múltiples secciones

CUMPLIMIENTO:
- ISO 9001: Control de documentos (7.5)
- ISO 45001: Documentación del SGSST
- Decreto 1072: Trazabilidad de políticas SST
"""

import os
import base64
from io import BytesIO
from datetime import datetime
from django.template.loader import render_to_string
from django.conf import settings

# WeasyPrint para conversión HTML → PDF
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False


class IdentidadPDFGenerator:
    """
    Generador de PDFs para documentos de Identidad Corporativa.

    Soporta:
    - Política Integral con firmas
    - Políticas Específicas
    - Documento completo de identidad corporativa
    - Valores Corporativos
    """

    # Configuración de estilos base
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

        h1 {
            color: #1a365d;
            font-size: 18pt;
            font-weight: 700;
            margin-bottom: 16px;
            border-bottom: 2px solid #3182ce;
            padding-bottom: 8px;
        }

        h2 {
            color: #2c5282;
            font-size: 14pt;
            font-weight: 600;
            margin-top: 20px;
            margin-bottom: 10px;
        }

        h3 {
            color: #2d3748;
            font-size: 12pt;
            font-weight: 600;
            margin-top: 16px;
            margin-bottom: 8px;
        }

        .header {
            position: running(header);
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-logo {
            max-height: 40px;
        }

        .header-text {
            font-size: 9pt;
            color: #718096;
            text-align: right;
        }

        .footer {
            position: running(footer);
            padding: 10px 0;
            border-top: 1px solid #e2e8f0;
            font-size: 8pt;
            color: #718096;
            display: flex;
            justify-content: space-between;
        }

        .page-number::after {
            content: "Página " counter(page) " de " counter(pages);
        }

        .document-metadata {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
        }

        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .metadata-item {
            display: flex;
            flex-direction: column;
        }

        .metadata-label {
            font-size: 9pt;
            color: #718096;
            font-weight: 500;
        }

        .metadata-value {
            font-size: 10pt;
            color: #2d3748;
            font-weight: 600;
        }

        .section {
            margin-bottom: 24px;
            page-break-inside: avoid;
        }

        .section-content {
            text-align: justify;
            margin-bottom: 16px;
        }

        .value-card {
            background: #edf2f7;
            border-left: 4px solid #3182ce;
            padding: 12px 16px;
            margin-bottom: 12px;
            border-radius: 0 8px 8px 0;
        }

        .value-name {
            font-weight: 600;
            color: #1a365d;
            margin-bottom: 4px;
        }

        .value-description {
            font-size: 10pt;
            color: #4a5568;
        }

        .signatures-section {
            margin-top: 32px;
            page-break-inside: avoid;
        }

        .signatures-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin-top: 16px;
        }

        .signature-box {
            text-align: center;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            background: #fff;
        }

        .signature-image {
            max-width: 150px;
            max-height: 60px;
            margin-bottom: 8px;
        }

        .signature-line {
            border-top: 1px solid #2d3748;
            margin: 8px 24px;
        }

        .signature-name {
            font-weight: 600;
            font-size: 10pt;
            color: #2d3748;
        }

        .signature-role {
            font-size: 9pt;
            color: #718096;
        }

        .signature-date {
            font-size: 8pt;
            color: #a0aec0;
            margin-top: 4px;
        }

        .signature-pending {
            color: #e53e3e;
            font-style: italic;
            padding: 20px;
        }

        .alcance-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }

        .alcance-table th {
            background: #2c5282;
            color: white;
            padding: 10px;
            font-size: 10pt;
            text-align: left;
        }

        .alcance-table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10pt;
        }

        .alcance-table tr:nth-child(even) {
            background: #f7fafc;
        }

        .certified-badge {
            display: inline-block;
            background: #48bb78;
            color: white;
            font-size: 8pt;
            padding: 2px 8px;
            border-radius: 9999px;
            font-weight: 500;
        }

        .not-certified-badge {
            display: inline-block;
            background: #e2e8f0;
            color: #718096;
            font-size: 8pt;
            padding: 2px 8px;
            border-radius: 9999px;
            font-weight: 500;
        }

        .iso-badge {
            display: inline-block;
            background: #3182ce;
            color: white;
            font-size: 9pt;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: 500;
            margin-right: 8px;
            margin-bottom: 8px;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 9pt;
            font-weight: 500;
        }

        .status-vigente {
            background: #c6f6d5;
            color: #22543d;
        }

        .status-borrador {
            background: #fefcbf;
            color: #744210;
        }

        .status-revision {
            background: #bee3f8;
            color: #2a4365;
        }

        .revision-history {
            margin-top: 24px;
        }

        .revision-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
        }

        .revision-table th {
            background: #4a5568;
            color: white;
            padding: 8px;
            text-align: left;
        }

        .revision-table td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
        }
    """

    def __init__(self, empresa=None):
        """
        Inicializa el generador.

        Args:
            empresa: Instancia de EmpresaConfig (opcional)
        """
        self.empresa = empresa
        self.logo_base64 = None

        if empresa and empresa.logo:
            self._load_logo()

    def _load_logo(self):
        """Carga el logo de la empresa en base64"""
        try:
            if self.empresa.logo and hasattr(self.empresa.logo, 'path'):
                with open(self.empresa.logo.path, 'rb') as f:
                    logo_data = f.read()
                    self.logo_base64 = base64.b64encode(logo_data).decode('utf-8')
        except Exception:
            pass

    def _get_empresa_info(self):
        """Obtiene información de la empresa"""
        if self.empresa:
            return {
                'razon_social': self.empresa.razon_social,
                'nit': self.empresa.nit,
                'nombre_comercial': getattr(self.empresa, 'nombre_comercial', ''),
                'logo_base64': self.logo_base64,
            }
        return {
            'razon_social': 'Empresa',
            'nit': '',
            'nombre_comercial': '',
            'logo_base64': None,
        }

    def generate_politica_integral_pdf(self, politica, firmas=None, historial=None):
        """
        Genera PDF de Política Integral con firmas.

        Args:
            politica: Instancia de PoliticaEspecifica con is_integral_policy=True (v3.1)
            firmas: QuerySet de FirmaDigital (opcional)
            historial: QuerySet de HistorialVersion (opcional)

        Returns:
            BytesIO: Buffer con el PDF generado
        """
        if not WEASYPRINT_AVAILABLE:
            raise ImportError("WeasyPrint no está instalado. Ejecute: pip install weasyprint")

        empresa_info = self._get_empresa_info()

        context = {
            'politica': politica,
            'empresa': empresa_info,
            'firmas': firmas or [],
            'historial': historial or [],
            'fecha_generacion': datetime.now(),
            'documento_tipo': 'Política Integral',
        }

        html_content = self._render_politica_integral_html(context)

        return self._generate_pdf_from_html(html_content)

    def generate_politica_especifica_pdf(self, politica, firmas=None):
        """
        Genera PDF de Política Específica.

        Args:
            politica: Instancia de PoliticaEspecifica
            firmas: QuerySet de FirmaDigital (opcional)

        Returns:
            BytesIO: Buffer con el PDF generado
        """
        if not WEASYPRINT_AVAILABLE:
            raise ImportError("WeasyPrint no está instalado. Ejecute: pip install weasyprint")

        empresa_info = self._get_empresa_info()

        context = {
            'politica': politica,
            'empresa': empresa_info,
            'firmas': firmas or [],
            'fecha_generacion': datetime.now(),
            'documento_tipo': 'Política Específica',
        }

        html_content = self._render_politica_especifica_html(context)

        return self._generate_pdf_from_html(html_content)

    def generate_identidad_completa_pdf(self, identity, include_politicas=True, include_valores=True, include_alcances=True):
        """
        Genera PDF completo de Identidad Corporativa.

        Args:
            identity: Instancia de CorporateIdentity
            include_politicas: Incluir políticas
            include_valores: Incluir valores
            include_alcances: Incluir alcances

        Returns:
            BytesIO: Buffer con el PDF generado
        """
        if not WEASYPRINT_AVAILABLE:
            raise ImportError("WeasyPrint no está instalado. Ejecute: pip install weasyprint")

        empresa_info = self._get_empresa_info()

        context = {
            'identity': identity,
            'empresa': empresa_info,
            'include_politicas': include_politicas,
            'include_valores': include_valores,
            'include_alcances': include_alcances,
            'valores': identity.values.filter(is_active=True).order_by('orden') if include_valores else [],
            'alcances': identity.alcances.filter(is_active=True) if include_alcances else [],
            # v3.1: Usar PoliticaEspecifica con is_integral_policy=True
            'politica_vigente': identity.politicas_especificas.filter(
                status='VIGENTE', is_active=True, is_integral_policy=True
            ).first() if include_politicas else None,
            'politicas_especificas': identity.politicas_especificas.filter(
                status='VIGENTE', is_active=True, is_integral_policy=False
            ) if include_politicas else [],
            'fecha_generacion': datetime.now(),
            'documento_tipo': 'Identidad Corporativa Completa',
        }

        html_content = self._render_identidad_completa_html(context)

        return self._generate_pdf_from_html(html_content)

    def _render_politica_integral_html(self, context):
        """Renderiza HTML de Política Integral"""
        empresa = context['empresa']
        politica = context['politica']
        firmas = context['firmas']

        # Determinar badge de estado
        status_class = {
            'VIGENTE': 'status-vigente',
            'BORRADOR': 'status-borrador',
            'EN_REVISION': 'status-revision',
        }.get(politica.status, 'status-borrador')

        # Construir HTML de firmas
        firmas_html = ''
        if firmas:
            firmas_html = '<div class="signatures-grid">'
            for firma in firmas:
                if firma.status == 'FIRMADO' and firma.firma_manuscrita:
                    firmas_html += f'''
                        <div class="signature-box">
                            <img src="{firma.firma_manuscrita}" class="signature-image" alt="Firma">
                            <div class="signature-line"></div>
                            <div class="signature-name">{firma.firmante.get_full_name()}</div>
                            <div class="signature-role">{firma.get_rol_firma_display()}</div>
                            <div class="signature-date">{firma.fecha_firma.strftime('%d/%m/%Y') if firma.fecha_firma else ''}</div>
                        </div>
                    '''
                else:
                    firmas_html += f'''
                        <div class="signature-box">
                            <div class="signature-pending">Pendiente</div>
                            <div class="signature-line"></div>
                            <div class="signature-name">{firma.firmante.get_full_name()}</div>
                            <div class="signature-role">{firma.get_rol_firma_display()}</div>
                        </div>
                    '''
            firmas_html += '</div>'

        # Logo
        logo_img = f'<img src="data:image/png;base64,{empresa["logo_base64"]}" class="header-logo">' if empresa.get('logo_base64') else ''

        html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>{self.BASE_CSS}</style>
        </head>
        <body>
            <div class="header">
                {logo_img}
                <div class="header-text">
                    <strong>{empresa['razon_social']}</strong><br>
                    NIT: {empresa['nit']}
                </div>
            </div>

            <div class="footer">
                <span>Versión {politica.version} | Generado: {context['fecha_generacion'].strftime('%d/%m/%Y %H:%M')}</span>
                <span class="page-number"></span>
            </div>

            <h1>{politica.title}</h1>

            <div class="document-metadata">
                <div class="metadata-grid">
                    <div class="metadata-item">
                        <span class="metadata-label">Versión</span>
                        <span class="metadata-value">{politica.version}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Estado</span>
                        <span class="status-badge {status_class}">{politica.get_status_display()}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Fecha de Vigencia</span>
                        <span class="metadata-value">{politica.effective_date.strftime('%d/%m/%Y') if politica.effective_date else 'N/A'}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Normas Aplicables</span>
                        <span class="metadata-value">
                            {''.join([f'<span class="iso-badge">{n}</span>' for n in (politica.applicable_standards or [])])}
                        </span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Contenido de la Política</h2>
                <div class="section-content">
                    {politica.content.replace(chr(10), '<br>')}
                </div>
            </div>

            <div class="signatures-section">
                <h2>Firmas de Aprobación</h2>
                {firmas_html if firmas_html else '<p class="signature-pending">No hay firmas registradas</p>'}
            </div>
        </body>
        </html>
        '''

        return html

    def _render_politica_especifica_html(self, context):
        """Renderiza HTML de Política Específica"""
        empresa = context['empresa']
        politica = context['politica']
        firmas = context['firmas']

        status_class = {
            'VIGENTE': 'status-vigente',
            'BORRADOR': 'status-borrador',
            'EN_REVISION': 'status-revision',
        }.get(politica.status, 'status-borrador')

        logo_img = f'<img src="data:image/png;base64,{empresa["logo_base64"]}" class="header-logo">' if empresa.get('logo_base64') else ''

        norma_display = politica.norma_iso.short_name if politica.norma_iso else 'General'

        html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>{self.BASE_CSS}</style>
        </head>
        <body>
            <div class="header">
                {logo_img}
                <div class="header-text">
                    <strong>{empresa['razon_social']}</strong><br>
                    NIT: {empresa['nit']}
                </div>
            </div>

            <div class="footer">
                <span>Código: {politica.code} | Versión {politica.version}</span>
                <span class="page-number"></span>
            </div>

            <h1>{politica.title}</h1>

            <div class="document-metadata">
                <div class="metadata-grid">
                    <div class="metadata-item">
                        <span class="metadata-label">Código</span>
                        <span class="metadata-value">{politica.code}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Versión</span>
                        <span class="metadata-value">{politica.version}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Norma ISO</span>
                        <span class="metadata-value"><span class="iso-badge">{norma_display}</span></span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Estado</span>
                        <span class="status-badge {status_class}">{politica.get_status_display()}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Área Responsable</span>
                        <span class="metadata-value">{politica.area.name if politica.area else 'N/A'}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Fecha de Vigencia</span>
                        <span class="metadata-value">{politica.effective_date.strftime('%d/%m/%Y') if politica.effective_date else 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Contenido</h2>
                <div class="section-content">
                    {politica.content.replace(chr(10), '<br>')}
                </div>
            </div>

            <div class="signatures-section">
                <h2>Aprobación</h2>
                <p>
                    <strong>Aprobada por:</strong> {politica.approved_by.get_full_name() if politica.approved_by else 'Pendiente'}<br>
                    <strong>Fecha:</strong> {politica.approved_at.strftime('%d/%m/%Y %H:%M') if politica.approved_at else 'N/A'}
                </p>
            </div>
        </body>
        </html>
        '''

        return html

    def _render_identidad_completa_html(self, context):
        """Renderiza HTML de Identidad Corporativa Completa"""
        empresa = context['empresa']
        identity = context['identity']
        valores = context.get('valores', [])
        alcances = context.get('alcances', [])
        politica_vigente = context.get('politica_vigente')

        logo_img = f'<img src="data:image/png;base64,{empresa["logo_base64"]}" class="header-logo">' if empresa.get('logo_base64') else ''

        # Sección de valores
        valores_html = ''
        if context['include_valores'] and valores:
            valores_html = '<div class="section"><h2>Valores Corporativos</h2>'
            for valor in valores:
                valores_html += f'''
                    <div class="value-card">
                        <div class="value-name">{valor.name}</div>
                        <div class="value-description">{valor.description}</div>
                    </div>
                '''
            valores_html += '</div>'

        # Sección de alcances
        alcances_html = ''
        if context['include_alcances'] and alcances:
            alcances_html = '''
                <div class="section">
                    <h2>Alcance del Sistema de Gestión</h2>
                    <table class="alcance-table">
                        <tr>
                            <th>Norma ISO</th>
                            <th>Alcance</th>
                            <th>Certificación</th>
                            <th>Organismo</th>
                        </tr>
            '''
            for alcance in alcances:
                cert_badge = '<span class="certified-badge">Certificado</span>' if alcance.is_certified else '<span class="not-certified-badge">No Certificado</span>'
                alcances_html += f'''
                    <tr>
                        <td><span class="iso-badge">{alcance.norma_iso.short_name if alcance.norma_iso else 'N/A'}</span></td>
                        <td>{alcance.scope[:100]}...</td>
                        <td>{cert_badge}</td>
                        <td>{alcance.certification_body or 'N/A'}</td>
                    </tr>
                '''
            alcances_html += '</table></div>'

        # Política integral vigente
        politica_html = ''
        if context['include_politicas'] and politica_vigente:
            politica_html = f'''
                <div class="section">
                    <h2>Política Integral del Sistema de Gestión</h2>
                    <div class="section-content">
                        {politica_vigente.content.replace(chr(10), '<br>')}
                    </div>
                    <p>
                        <strong>Versión:</strong> {politica_vigente.version} |
                        <strong>Vigente desde:</strong> {politica_vigente.effective_date.strftime('%d/%m/%Y') if politica_vigente.effective_date else 'N/A'}
                    </p>
                </div>
            '''

        html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>{self.BASE_CSS}</style>
        </head>
        <body>
            <div class="header">
                {logo_img}
                <div class="header-text">
                    <strong>{empresa['razon_social']}</strong><br>
                    NIT: {empresa['nit']}
                </div>
            </div>

            <div class="footer">
                <span>Identidad Corporativa | v{identity.version}</span>
                <span class="page-number"></span>
            </div>

            <h1>Identidad Corporativa</h1>
            <p style="color: #718096; margin-bottom: 24px;">
                {empresa['razon_social']} | Versión {identity.version} |
                Vigente desde: {identity.effective_date.strftime('%d/%m/%Y')}
            </p>

            <div class="section">
                <h2>Misión</h2>
                <div class="section-content">
                    {identity.mission.replace(chr(10), '<br>')}
                </div>
            </div>

            <div class="section">
                <h2>Visión</h2>
                <div class="section-content">
                    {identity.vision.replace(chr(10), '<br>')}
                </div>
            </div>

            {valores_html}

            {politica_html}

            {alcances_html}

            <div class="revision-history">
                <h2>Control de Documento</h2>
                <p>
                    <strong>Fecha de generación:</strong> {context['fecha_generacion'].strftime('%d/%m/%Y %H:%M')}<br>
                    <strong>Creado por:</strong> {identity.created_by.get_full_name() if identity.created_by else 'Sistema'}<br>
                    <strong>Última actualización:</strong> {identity.updated_at.strftime('%d/%m/%Y %H:%M') if identity.updated_at else 'N/A'}
                </p>
            </div>
        </body>
        </html>
        '''

        return html

    def _generate_pdf_from_html(self, html_content):
        """
        Genera PDF desde contenido HTML.

        Args:
            html_content: String con HTML

        Returns:
            BytesIO: Buffer con PDF
        """
        pdf_buffer = BytesIO()

        html = HTML(string=html_content)
        css = CSS(string=self.BASE_CSS)

        html.write_pdf(pdf_buffer, stylesheets=[css])

        pdf_buffer.seek(0)
        return pdf_buffer


# Función de conveniencia para uso directo
def generar_pdf_politica_integral(politica, empresa=None, firmas=None, historial=None):
    """
    Genera PDF de política integral.

    Args:
        politica: Instancia de PoliticaEspecifica con is_integral_policy=True (v3.1)
        empresa: Instancia de EmpresaConfig (opcional)
        firmas: QuerySet de FirmaDigital (opcional)
        historial: QuerySet de HistorialVersion (opcional)

    Returns:
        BytesIO: Buffer con PDF
    """
    generator = IdentidadPDFGenerator(empresa=empresa)
    return generator.generate_politica_integral_pdf(politica, firmas, historial)


def generar_pdf_identidad_completa(identity, empresa=None, **options):
    """
    Genera PDF de identidad corporativa completa.

    Args:
        identity: Instancia de CorporateIdentity
        empresa: Instancia de EmpresaConfig (opcional)
        **options: include_politicas, include_valores, include_alcances

    Returns:
        BytesIO: Buffer con PDF
    """
    generator = IdentidadPDFGenerator(empresa=empresa)
    return generator.generate_identidad_completa_pdf(identity, **options)
