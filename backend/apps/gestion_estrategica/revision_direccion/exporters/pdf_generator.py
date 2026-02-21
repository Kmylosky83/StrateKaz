"""
Generador de PDF para Actas de Revisión por la Dirección
=========================================================
Genera PDFs profesionales de actas de revisión por la dirección
usando WeasyPrint (HTML -> PDF).

Patrón: Idéntico a gestion_documental/exporters/pdf_generator.py
"""
import base64
from io import BytesIO
from datetime import datetime

try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False


class ActaRevisionPDFGenerator:
    """Genera PDFs de actas de revisión por la dirección."""

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
        .page-number::after { content: "Página " counter(page) " de " counter(pages); }

        .document-metadata { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        .metadata-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .metadata-item { display: flex; flex-direction: column; }
        .metadata-label { font-size: 9pt; color: #718096; font-weight: 500; }
        .metadata-value { font-size: 10pt; color: #2d3748; font-weight: 600; }

        .section { margin-bottom: 24px; }
        .section-content { text-align: justify; margin-bottom: 16px; }

        .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 9pt; font-weight: 600; }
        .badge-adecuado { background: #c6f6d5; color: #276749; }
        .badge-parcialmente_adecuado { background: #fefcbf; color: #975a16; }
        .badge-no_adecuado { background: #fed7d7; color: #9b2c2c; }

        .badge-COMPLETADO { background: #c6f6d5; color: #276749; }
        .badge-EN_PROGRESO { background: #bee3f8; color: #2b6cb0; }
        .badge-PENDIENTE { background: #fefcbf; color: #975a16; }
        .badge-VENCIDO { background: #fed7d7; color: #9b2c2c; }
        .badge-CANCELADO { background: #e2e8f0; color: #4a5568; }

        .badge-ALTA { background: #fed7d7; color: #9b2c2c; }
        .badge-MEDIA { background: #fefcbf; color: #975a16; }
        .badge-BAJA { background: #c6f6d5; color: #276749; }

        .iso-badge { display: inline-block; background: #3182ce; color: white; font-size: 9pt; padding: 4px 12px; border-radius: 4px; font-weight: 500; margin-right: 8px; margin-bottom: 8px; }

        .tema-card { background: #f7fafc; border-left: 4px solid #3182ce; padding: 12px 16px; margin-bottom: 16px; border-radius: 0 8px 8px 0; page-break-inside: avoid; }
        .tema-title { font-weight: 600; color: #1a365d; margin-bottom: 4px; font-size: 11pt; }
        .tema-categoria { font-size: 9pt; color: #718096; margin-bottom: 8px; }
        .tema-field { margin-bottom: 8px; }
        .tema-field-label { font-size: 9pt; color: #718096; font-weight: 500; }
        .tema-field-value { font-size: 10pt; color: #2d3748; }

        .compromiso-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .compromiso-table th { background: #2c5282; color: white; padding: 10px; font-size: 10pt; text-align: left; }
        .compromiso-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 10pt; }
        .compromiso-table tr:nth-child(even) { background: #f7fafc; }

        .participantes-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .participantes-table th { background: #2c5282; color: white; padding: 8px; font-size: 10pt; text-align: left; }
        .participantes-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 10pt; }
        .participantes-table tr:nth-child(even) { background: #f7fafc; }

        .firma-section { margin-top: 48px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; page-break-inside: avoid; }
        .firma-box { text-align: center; padding-top: 48px; border-top: 1px solid #2d3748; }
        .firma-nombre { font-weight: 600; color: #1a365d; font-size: 10pt; }
        .firma-cargo { font-size: 9pt; color: #718096; }
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

    def _format_date(self, date_val):
        if date_val:
            return date_val.strftime('%d/%m/%Y')
        return 'N/A'

    def _format_time(self, time_val):
        if time_val:
            return time_val.strftime('%H:%M')
        return 'N/A'

    def _get_evaluacion_label(self, evaluacion):
        labels = {
            'adecuado': 'Adecuado',
            'parcialmente_adecuado': 'Parcialmente Adecuado',
            'no_adecuado': 'No Adecuado',
        }
        return labels.get(evaluacion, evaluacion or 'N/A')

    def generate_acta_pdf(self, acta):
        """
        Genera PDF de un acta de revisión por la dirección.

        Args:
            acta: Instancia de ActaRevision con relaciones precargadas

        Returns:
            BytesIO: Buffer con el PDF generado
        """
        if not WEASYPRINT_AVAILABLE:
            raise ImportError("WeasyPrint no está instalado. Ejecute: pip install weasyprint")

        empresa_info = self._get_empresa_info()
        programa = acta.programa

        # Construir secciones
        logo_img = (
            f'<img src="data:image/png;base64,{empresa_info["logo_base64"]}" class="header-logo">'
            if empresa_info.get('logo_base64') else ''
        )

        # ISO badges
        iso_badges = ''
        if programa.incluye_calidad:
            iso_badges += '<span class="iso-badge">ISO 9001</span>'
        if programa.incluye_sst:
            iso_badges += '<span class="iso-badge">ISO 45001/SST</span>'
        if programa.incluye_ambiental:
            iso_badges += '<span class="iso-badge">ISO 14001</span>'
        if programa.incluye_pesv:
            iso_badges += '<span class="iso-badge">PESV</span>'
        if programa.incluye_seguridad_info:
            iso_badges += '<span class="iso-badge">ISO 27001</span>'

        # Participantes
        participantes = programa.participantes.select_related('usuario').order_by('rol')
        participantes_html = self._render_participantes(participantes)

        # Temas y análisis
        analisis_temas = acta.analisis_temas.select_related('tema', 'presentado_por').order_by('tema__orden')
        temas_html = self._render_analisis_temas(analisis_temas)

        # Compromisos
        compromisos = acta.compromisos.select_related('responsable', 'tema_relacionado').order_by('fecha_compromiso')
        compromisos_html = self._render_compromisos(compromisos)

        # Evaluación del sistema
        evaluacion_label = self._get_evaluacion_label(acta.evaluacion_sistema)

        # Firmas
        firmas_html = self._render_firmas(acta)

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
                    <strong>{empresa_info['razon_social']}</strong><br>
                    NIT: {empresa_info['nit']}<br>
                    Acta {acta.numero_acta}
                </div>
            </div>

            <div class="footer">
                <span>Acta {acta.numero_acta} | Revisión por la Dirección</span>
                <span class="page-number"></span>
            </div>

            <h1>Acta de Revisión por la Dirección</h1>
            <p style="color: #718096; margin-bottom: 8px;">
                {empresa_info['razon_social']} | Acta No. {acta.numero_acta} | Versión {acta.version}
            </p>
            <div style="margin-bottom: 24px;">{iso_badges}</div>

            <div class="document-metadata">
                <div class="metadata-grid">
                    <div class="metadata-item">
                        <span class="metadata-label">No. Acta</span>
                        <span class="metadata-value">{acta.numero_acta}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Fecha</span>
                        <span class="metadata-value">{self._format_date(acta.fecha)}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Hora Inicio</span>
                        <span class="metadata-value">{self._format_time(acta.hora_inicio)}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Hora Fin</span>
                        <span class="metadata-value">{self._format_time(acta.hora_fin)}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Lugar</span>
                        <span class="metadata-value">{acta.lugar}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Evaluación del Sistema</span>
                        <span class="metadata-value">
                            <span class="badge badge-{acta.evaluacion_sistema}">{evaluacion_label}</span>
                        </span>
                    </div>
                </div>
            </div>

            {self._render_text_section('Introducción', acta.introduccion)}
            {self._render_text_section('Orden del Día', acta.orden_del_dia)}

            {participantes_html}

            {temas_html}

            {self._render_text_section('Conclusiones Generales', acta.conclusiones_generales)}
            {self._render_text_section('Decisiones de Mejora', acta.decisiones_mejora)}
            {self._render_text_section('Necesidad de Cambios', acta.necesidad_cambios)}
            {self._render_text_section('Necesidad de Recursos', acta.necesidad_recursos)}
            {self._render_text_section('Observaciones sobre la Evaluación', acta.observaciones_evaluacion)}

            {compromisos_html}

            {firmas_html}

            <div class="section" style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <p style="font-size: 8pt; color: #a0aec0;">
                    Documento generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} |
                    {empresa_info['razon_social']} |
                    Revisión por la Dirección StrateKaz
                </p>
            </div>
        </body>
        </html>
        '''

        pdf_buffer = BytesIO()
        html_doc = HTML(string=html)
        css = CSS(string=self.BASE_CSS)
        html_doc.write_pdf(pdf_buffer, stylesheets=[css])
        pdf_buffer.seek(0)
        return pdf_buffer

    def _render_text_section(self, title, content):
        """Renderiza una sección de texto si tiene contenido."""
        if not content:
            return ''
        formatted = content.replace('\n', '<br>')
        return f'''
            <div class="section">
                <h2>{title}</h2>
                <div class="section-content">{formatted}</div>
            </div>
        '''

    def _render_participantes(self, participantes):
        """Renderiza tabla de participantes."""
        if not participantes:
            return ''

        rol_labels = {
            'DIRECCION': 'Alta Dirección',
            'LIDER_PROCESO': 'Líder de Proceso',
            'RESPONSABLE_SG': 'Responsable SG',
            'INVITADO': 'Invitado',
            'SECRETARIO': 'Secretario',
        }

        rows = ''
        for p in participantes:
            nombre = p.usuario.get_full_name() if p.usuario else 'N/A'
            rol = rol_labels.get(p.rol, p.rol)
            asistio = '✓' if p.asistio else '✗'
            rows += f'''
                <tr>
                    <td>{nombre}</td>
                    <td>{rol}</td>
                    <td style="text-align: center;">{asistio}</td>
                    <td>{p.observaciones or ''}</td>
                </tr>
            '''

        return f'''
            <div class="section">
                <h2>Participantes</h2>
                <table class="participantes-table">
                    <tr>
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th style="text-align: center;">Asistió</th>
                        <th>Observaciones</th>
                    </tr>
                    {rows}
                </table>
            </div>
        '''

    def _render_analisis_temas(self, analisis_temas):
        """Renderiza el análisis por tema."""
        if not analisis_temas:
            return ''

        cards = ''
        for analisis in analisis_temas:
            tema = analisis.tema
            presentado = analisis.presentado_por.get_full_name() if analisis.presentado_por else 'N/A'

            fields = ''
            if analisis.resumen_presentacion:
                fields += f'''
                    <div class="tema-field">
                        <div class="tema-field-label">Resumen de la Presentación</div>
                        <div class="tema-field-value">{analisis.resumen_presentacion.replace(chr(10), '<br>')}</div>
                    </div>
                '''
            if analisis.hallazgos:
                fields += f'''
                    <div class="tema-field">
                        <div class="tema-field-label">Hallazgos</div>
                        <div class="tema-field-value">{analisis.hallazgos.replace(chr(10), '<br>')}</div>
                    </div>
                '''
            if analisis.decisiones:
                fields += f'''
                    <div class="tema-field">
                        <div class="tema-field-label">Decisiones</div>
                        <div class="tema-field-value">{analisis.decisiones.replace(chr(10), '<br>')}</div>
                    </div>
                '''
            if analisis.observaciones:
                fields += f'''
                    <div class="tema-field">
                        <div class="tema-field-label">Observaciones</div>
                        <div class="tema-field-value">{analisis.observaciones.replace(chr(10), '<br>')}</div>
                    </div>
                '''

            cards += f'''
                <div class="tema-card">
                    <div class="tema-title">{tema.titulo}</div>
                    <div class="tema-categoria">{tema.get_categoria_display()} | Presentado por: {presentado}</div>
                    {fields}
                </div>
            '''

        return f'''
            <div class="section">
                <h2>Análisis de Temas (Entradas ISO 9001 Cláusula 9.3)</h2>
                {cards}
            </div>
        '''

    def _render_compromisos(self, compromisos):
        """Renderiza tabla de compromisos."""
        if not compromisos:
            return ''

        tipo_labels = {
            'ACCION_CORRECTIVA': 'Acción Correctiva',
            'ACCION_PREVENTIVA': 'Acción Preventiva',
            'MEJORA': 'Mejora',
            'DECISION': 'Decisión',
            'ASIGNACION_RECURSO': 'Asignación de Recurso',
            'CAMBIO_SG': 'Cambio al SG',
            'OTRO': 'Otro',
        }

        rows = ''
        for c in compromisos:
            responsable = c.responsable.get_full_name() if c.responsable else 'N/A'
            tipo = tipo_labels.get(c.tipo, c.tipo)
            estado_display = c.get_estado_display() if hasattr(c, 'get_estado_display') else c.estado
            rows += f'''
                <tr>
                    <td>{c.consecutivo}</td>
                    <td>{tipo}</td>
                    <td style="max-width: 200px;">{c.descripcion[:120]}{'...' if len(c.descripcion) > 120 else ''}</td>
                    <td>{responsable}</td>
                    <td>{self._format_date(c.fecha_compromiso)}</td>
                    <td><span class="badge badge-{c.estado}">{estado_display}</span></td>
                    <td style="text-align: center;">{c.porcentaje_avance}%</td>
                </tr>
            '''

        return f'''
            <div class="section">
                <h2>Compromisos y Salidas (ISO 9001 Cláusula 9.3.3)</h2>
                <table class="compromiso-table">
                    <tr>
                        <th>No.</th>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th>Responsable</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Avance</th>
                    </tr>
                    {rows}
                </table>
            </div>
        '''

    def _render_firmas(self, acta):
        """Renderiza sección de firmas."""
        firmas = []

        if acta.elaborado_por:
            firmas.append({
                'nombre': acta.elaborado_por.get_full_name(),
                'cargo': 'Elaboró',
                'fecha': self._format_date(acta.fecha_elaboracion),
            })
        if acta.revisado_por:
            firmas.append({
                'nombre': acta.revisado_por.get_full_name(),
                'cargo': 'Revisó',
                'fecha': self._format_date(acta.fecha_revision),
            })
        if acta.aprobado_por:
            firmas.append({
                'nombre': acta.aprobado_por.get_full_name(),
                'cargo': 'Aprobó',
                'fecha': self._format_date(acta.fecha_aprobacion),
            })

        if not firmas:
            return ''

        boxes = ''
        for f in firmas:
            boxes += f'''
                <div class="firma-box">
                    <div class="firma-nombre">{f['nombre']}</div>
                    <div class="firma-cargo">{f['cargo']}</div>
                    <div class="firma-cargo">{f['fecha']}</div>
                </div>
            '''

        return f'''
            <div class="firma-section">
                {boxes}
            </div>
        '''
