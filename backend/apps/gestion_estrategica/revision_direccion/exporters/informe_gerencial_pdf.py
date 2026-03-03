"""
Generador de PDF para Informe Gerencial — Revisión por la Dirección
====================================================================
Genera PDF profesional del informe consolidado de todos los módulos C2,
siguiendo ISO 9001:2015 Cláusula 9.3 (Revisión por la Dirección).

Usa WeasyPrint (HTML -> PDF).
"""
import base64
from io import BytesIO
from datetime import date, datetime

try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False


class InformeGerencialPDFGenerator:
    """Genera PDF del informe gerencial consolidado."""

    BASE_CSS = """
        @page {
            size: A4;
            margin: 2cm 1.5cm;
            @top-center { content: element(header); }
            @bottom-center { content: element(footer); }
        }
        @page :first {
            @top-center { content: none; }
            @bottom-center { content: none; }
            margin: 0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #333;
        }

        h1 { color: #1a365d; font-size: 16pt; font-weight: 700; margin-bottom: 12px;
             border-bottom: 2px solid #3182ce; padding-bottom: 6px; }
        h2 { color: #2c5282; font-size: 13pt; font-weight: 600; margin-top: 18px; margin-bottom: 8px; }
        h3 { color: #2d3748; font-size: 11pt; font-weight: 600; margin-top: 14px; margin-bottom: 6px; }

        .header { position: running(header); padding: 8px 0; border-bottom: 1px solid #e2e8f0;
                   display: flex; justify-content: space-between; align-items: center; }
        .header-logo { max-height: 36px; }
        .header-text { font-size: 8pt; color: #718096; text-align: right; }

        .footer { position: running(footer); padding: 8px 0; border-top: 1px solid #e2e8f0;
                   font-size: 7pt; color: #718096; display: flex; justify-content: space-between; }
        .page-number::after { content: "Página " counter(page) " de " counter(pages); }

        /* Cover page */
        .cover-page { height: 100vh; display: flex; flex-direction: column; justify-content: center;
                       align-items: center; text-align: center; background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
                       color: white; page-break-after: always; }
        .cover-logo { max-height: 80px; margin-bottom: 40px; }
        .cover-title { font-size: 28pt; font-weight: 700; margin-bottom: 16px; }
        .cover-subtitle { font-size: 16pt; font-weight: 400; opacity: 0.9; margin-bottom: 32px; }
        .cover-period { font-size: 12pt; opacity: 0.8; padding: 12px 24px; border: 1px solid rgba(255,255,255,0.3);
                         border-radius: 8px; }
        .cover-date { font-size: 10pt; opacity: 0.7; margin-top: 40px; }

        /* Resumen ejecutivo */
        .resumen-box { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px;
                        padding: 16px; margin-bottom: 20px; }
        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
        .stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 6px;
                      padding: 12px; text-align: center; }
        .stat-value { font-size: 20pt; font-weight: 700; color: #2c5282; }
        .stat-label { font-size: 8pt; color: #718096; margin-top: 4px; }

        /* Módulos */
        .modulo-section { margin-bottom: 20px; page-break-inside: avoid; }
        .modulo-header { background: #2c5282; color: white; padding: 8px 14px; border-radius: 6px 6px 0 0;
                          font-weight: 600; font-size: 11pt; }
        .modulo-body { background: #f7fafc; border: 1px solid #e2e8f0; border-top: none;
                        padding: 14px; border-radius: 0 0 6px 6px; }
        .modulo-no-data { color: #a0aec0; font-style: italic; text-align: center; padding: 12px; }

        .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .data-table th { background: #edf2f7; padding: 6px 10px; font-size: 9pt; text-align: left;
                          color: #4a5568; font-weight: 600; }
        .data-table td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 9pt; }
        .data-table tr:nth-child(even) { background: #f7fafc; }

        .kpi-row { display: flex; justify-content: space-between; align-items: center;
                    padding: 4px 0; border-bottom: 1px solid #edf2f7; }
        .kpi-label { font-size: 9pt; color: #4a5568; }
        .kpi-value { font-size: 10pt; font-weight: 600; color: #2d3748; }

        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px;
                  font-size: 8pt; font-weight: 600; }
        .badge-green { background: #c6f6d5; color: #276749; }
        .badge-yellow { background: #fefcbf; color: #975a16; }
        .badge-red { background: #fed7d7; color: #9b2c2c; }
        .badge-blue { background: #bee3f8; color: #2b6cb0; }

        .iso-badges { margin-bottom: 16px; }
        .iso-badge { display: inline-block; background: #3182ce; color: white; font-size: 8pt;
                      padding: 3px 10px; border-radius: 4px; font-weight: 500; margin-right: 6px; }

        .firma-section { margin-top: 40px; display: grid; grid-template-columns: repeat(3, 1fr);
                          gap: 20px; page-break-inside: avoid; }
        .firma-box { text-align: center; padding-top: 40px; border-top: 1px solid #2d3748; }
        .firma-nombre { font-weight: 600; color: #1a365d; font-size: 9pt; }
        .firma-cargo { font-size: 8pt; color: #718096; }
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

    def _format_date(self, d):
        if isinstance(d, (date, datetime)):
            return d.strftime('%d/%m/%Y')
        return str(d) if d else 'N/A'

    def generate_informe_pdf(self, programa, informe_data, fecha_desde, fecha_hasta):
        """
        Genera PDF del informe gerencial consolidado.

        Args:
            programa: ProgramaRevision instance
            informe_data: dict from RevisionDireccionAggregator.consolidar()
            fecha_desde: date
            fecha_hasta: date

        Returns:
            BytesIO con el PDF
        """
        if not WEASYPRINT_AVAILABLE:
            raise ImportError("WeasyPrint no está instalado.")

        empresa_info = self._get_empresa_info()
        modulos = informe_data.get('modulos', {})
        resumen = informe_data.get('resumen_ejecutivo', {})

        logo_img = (
            f'<img src="data:image/png;base64,{empresa_info["logo_base64"]}" class="header-logo">'
            if empresa_info.get('logo_base64') else ''
        )
        cover_logo = (
            f'<img src="data:image/png;base64,{empresa_info["logo_base64"]}" class="cover-logo">'
            if empresa_info.get('logo_base64') else ''
        )

        # ISO badges
        iso_badges = ''
        if programa.incluye_calidad:
            iso_badges += '<span class="iso-badge">ISO 9001:2015</span>'
        if programa.incluye_sst:
            iso_badges += '<span class="iso-badge">ISO 45001:2018</span>'
        if programa.incluye_ambiental:
            iso_badges += '<span class="iso-badge">ISO 14001:2015</span>'
        if programa.incluye_pesv:
            iso_badges += '<span class="iso-badge">PESV</span>'
        if programa.incluye_seguridad_info:
            iso_badges += '<span class="iso-badge">ISO 27001</span>'

        # Build module sections
        modulos_html = self._render_all_modules(modulos)

        html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>{self.BASE_CSS}</style>
        </head>
        <body>
            <!-- Cover Page -->
            <div class="cover-page">
                {cover_logo}
                <div class="cover-title">Informe Gerencial</div>
                <div class="cover-subtitle">Revisión por la Dirección</div>
                <div class="cover-period">
                    Período: {self._format_date(fecha_desde)} — {self._format_date(fecha_hasta)}
                </div>
                <div class="cover-date">
                    {empresa_info['razon_social']}<br>
                    NIT: {empresa_info['nit']}<br>
                    Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}
                </div>
            </div>

            <!-- Header/Footer (running elements) -->
            <div class="header">
                {logo_img}
                <div class="header-text">
                    <strong>{empresa_info['razon_social']}</strong><br>
                    Informe Gerencial — Revisión por la Dirección
                </div>
            </div>
            <div class="footer">
                <span>Período: {self._format_date(fecha_desde)} — {self._format_date(fecha_hasta)}</span>
                <span class="page-number"></span>
            </div>

            <!-- Resumen Ejecutivo -->
            <h1>Resumen Ejecutivo</h1>
            <div class="iso-badges">{iso_badges}</div>

            <div class="resumen-box">
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-value">{resumen.get('total_modulos', 14)}</div>
                        <div class="stat-label">Módulos Evaluados</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{resumen.get('modulos_disponibles', 0)}</div>
                        <div class="stat-label">Módulos Disponibles</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{resumen.get('modulos_con_error', 0)}</div>
                        <div class="stat-label">Módulos Sin Datos</div>
                    </div>
                </div>
                <p style="font-size: 9pt; color: #4a5568;">
                    Este informe consolida el desempeño de los sistemas de gestión conforme a los requisitos
                    de la cláusula 9.3 de ISO 9001:2015, ISO 14001:2015 e ISO 45001:2018.
                    El período evaluado corresponde del {self._format_date(fecha_desde)} al {self._format_date(fecha_hasta)}.
                </p>
            </div>

            <!-- Módulos -->
            {modulos_html}

            <!-- Firmas -->
            <div class="firma-section">
                <div class="firma-box">
                    <div class="firma-nombre">________________________</div>
                    <div class="firma-cargo">Elaboró</div>
                </div>
                <div class="firma-box">
                    <div class="firma-nombre">________________________</div>
                    <div class="firma-cargo">Revisó</div>
                </div>
                <div class="firma-box">
                    <div class="firma-nombre">________________________</div>
                    <div class="firma-cargo">Aprobó</div>
                </div>
            </div>

            <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <p style="font-size: 7pt; color: #a0aec0; text-align: center;">
                    Documento generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} |
                    {empresa_info['razon_social']} |
                    Sistema Integrado de Gestión StrateKaz
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

    def _render_all_modules(self, modulos: dict) -> str:
        """Renderiza todas las secciones de módulos."""
        sections = [
            ('cumplimiento_legal', '1. Cumplimiento Legal', self._render_cumplimiento),
            ('riesgos_oportunidades', '2. Riesgos y Oportunidades', self._render_riesgos),
            ('accidentalidad_sst', '3. Accidentalidad y SST', self._render_accidentalidad),
            ('auditorias_mejora_continua', '4. Auditorías y Mejora Continua', self._render_auditorias),
            ('gestion_ambiental', '5. Gestión Ambiental', self._render_ambiental),
            ('calidad_no_conformidades', '6. No Conformidades y Calidad', self._render_calidad),
            ('gestion_comites', '7. Gestión de Comités', self._render_comites),
            ('proveedores', '8. Desempeño de Proveedores', self._render_proveedores),
            ('formacion_capacitacion', '9. Formación y Capacitación', self._render_formacion),
            ('talento_humano', '10. Talento Humano', self._render_talento),
            ('satisfaccion_cliente', '11. Satisfacción del Cliente', self._render_satisfaccion),
            ('presupuesto_recursos', '12. Presupuesto y Recursos', self._render_presupuesto),
            ('planeacion_estrategica', '13. Planeación Estratégica', self._render_planeacion),
            ('contexto_organizacional', '14. Contexto Organizacional', self._render_contexto),
        ]

        html = '<h1>Detalle por Módulo</h1>'
        for key, title, renderer in sections:
            mod = modulos.get(key, {})
            disponible = mod.get('disponible', False)
            data = mod.get('data', {})

            html += f'<div class="modulo-section"><div class="modulo-header">{title}</div>'
            html += '<div class="modulo-body">'

            if not disponible:
                html += '<div class="modulo-no-data">Módulo no disponible o sin datos en el período.</div>'
            else:
                try:
                    html += renderer(data)
                except Exception:
                    html += '<div class="modulo-no-data">Error al procesar datos del módulo.</div>'

            html += '</div></div>'

        return html

    def _render_kpi_row(self, label, value, suffix=''):
        return f'''
            <div class="kpi-row">
                <span class="kpi-label">{label}</span>
                <span class="kpi-value">{value}{suffix}</span>
            </div>
        '''

    def _pct_badge(self, value):
        if value >= 80:
            return f'<span class="badge badge-green">{value}%</span>'
        elif value >= 50:
            return f'<span class="badge badge-yellow">{value}%</span>'
        return f'<span class="badge badge-red">{value}%</span>'

    # --- Module renderers ---

    def _render_cumplimiento(self, d):
        return (
            self._render_kpi_row('Total requisitos', d.get('total_requisitos', 0))
            + self._render_kpi_row('Vigentes', d.get('vigentes', 0))
            + self._render_kpi_row('Vencidos', d.get('vencidos', 0))
            + self._render_kpi_row('Próximos a vencer (30d)', d.get('proximos_vencer_30d', 0))
            + self._render_kpi_row('Cumplimiento', self._pct_badge(d.get('porcentaje_cumplimiento', 0)))
            + self._render_kpi_row('Nuevos en período', d.get('nuevos_en_periodo', 0))
        )

    def _render_riesgos(self, d):
        niveles = d.get('por_nivel_residual', {})
        return (
            self._render_kpi_row('Total riesgos', d.get('total_riesgos', 0))
            + self._render_kpi_row('Críticos', niveles.get('CRITICO', 0))
            + self._render_kpi_row('Altos', niveles.get('ALTO', 0))
            + self._render_kpi_row('Moderados', niveles.get('MODERADO', 0))
            + self._render_kpi_row('Bajos', niveles.get('BAJO', 0))
            + self._render_kpi_row('Tratamientos activos', d.get('tratamientos_activos', 0))
            + self._render_kpi_row('Oportunidades', d.get('total_oportunidades', 0))
        )

    def _render_accidentalidad(self, d):
        grav = d.get('por_gravedad', {})
        return (
            self._render_kpi_row('Total accidentes', d.get('total_accidentes', 0))
            + self._render_kpi_row('Días de incapacidad', d.get('total_dias_incapacidad', 0))
            + self._render_kpi_row('Leves', grav.get('leves', 0))
            + self._render_kpi_row('Moderados', grav.get('moderados', 0))
            + self._render_kpi_row('Graves', grav.get('graves', 0))
            + self._render_kpi_row('Mortales', grav.get('mortales', 0))
            + self._render_kpi_row('Incidentes', d.get('total_incidentes', 0))
            + self._render_kpi_row('Enfermedades laborales', d.get('total_enfermedades_laborales', 0))
        )

    def _render_auditorias(self, d):
        h = d.get('hallazgos', {})
        return (
            self._render_kpi_row('Total auditorías', d.get('total_auditorias', 0))
            + self._render_kpi_row('Total hallazgos', h.get('total', 0))
            + self._render_kpi_row('Hallazgos cerrados', h.get('cerrados', 0))
            + self._render_kpi_row('% Cierre hallazgos', self._pct_badge(h.get('porcentaje_cierre', 0)))
        )

    def _render_ambiental(self, d):
        return (
            self._render_kpi_row('Residuos generados', f"{d.get('residuos_generados_kg', 0)}", ' kg')
            + self._render_kpi_row('Residuos aprovechados', f"{d.get('residuos_aprovechados_kg', 0)}", ' kg')
            + self._render_kpi_row('% Aprovechamiento', self._pct_badge(d.get('porcentaje_aprovechamiento', 0)))
            + self._render_kpi_row('Certificados vigentes', d.get('certificados_vigentes', 0))
        )

    def _render_calidad(self, d):
        ac = d.get('acciones_correctivas', {})
        return (
            self._render_kpi_row('Total no conformidades', d.get('total_no_conformidades', 0))
            + self._render_kpi_row('Abiertas', d.get('abiertas', 0))
            + self._render_kpi_row('Cerradas', d.get('cerradas', 0))
            + self._render_kpi_row('Acciones correctivas', ac.get('total', 0))
            + self._render_kpi_row('Acciones verificadas', ac.get('verificadas', 0))
            + self._render_kpi_row('% Efectividad', self._pct_badge(ac.get('porcentaje_efectividad', 0)))
        )

    def _render_comites(self, d):
        return (
            self._render_kpi_row('Reuniones programadas', d.get('reuniones_programadas', 0))
            + self._render_kpi_row('Reuniones realizadas', d.get('reuniones_realizadas', 0))
            + self._render_kpi_row('% Cumplimiento', self._pct_badge(d.get('porcentaje_cumplimiento', 0)))
            + self._render_kpi_row('Asistencia promedio', d.get('asistencia_promedio', 0))
            + self._render_kpi_row('Compromisos cumplidos', f"{d.get('compromisos_cumplidos', 0)}/{d.get('compromisos_total', 0)}")
        )

    def _render_proveedores(self, d):
        cal = d.get('calificacion_promedio')
        return (
            self._render_kpi_row('Proveedores activos', d.get('total_activos', 0))
            + self._render_kpi_row('Nuevos en período', d.get('nuevos_en_periodo', 0))
            + self._render_kpi_row('Evaluaciones realizadas', d.get('evaluaciones_completadas', 0))
            + self._render_kpi_row('Calificación promedio', f"{cal:.1f}" if cal else 'N/A')
        )

    def _render_formacion(self, d):
        return (
            self._render_kpi_row('Programaciones', d.get('programaciones_total', 0))
            + self._render_kpi_row('Completadas', d.get('programaciones_completadas', 0))
            + self._render_kpi_row('% Ejecución', self._pct_badge(d.get('porcentaje_ejecucion', 0)))
            + self._render_kpi_row('Total horas', d.get('total_horas', 0))
            + self._render_kpi_row('% Asistencia', self._pct_badge(d.get('porcentaje_asistencia', 0)))
        )

    def _render_talento(self, d):
        return (
            self._render_kpi_row('Colaboradores activos', d.get('total_activos', 0))
            + self._render_kpi_row('Nuevos ingresos', d.get('nuevos_ingresos', 0))
            + self._render_kpi_row('Retiros', d.get('retiros', 0))
            + self._render_kpi_row('Tasa de rotación', f"{d.get('tasa_rotacion', 0)}%")
        )

    def _render_satisfaccion(self, d):
        nps = d.get('nps_promedio')
        return (
            self._render_kpi_row('Total PQRS', d.get('total_pqrs', 0))
            + self._render_kpi_row('Resueltas', d.get('resueltas', 0))
            + self._render_kpi_row('Tiempo promedio respuesta', f"{d.get('tiempo_promedio_respuesta', 0)} días")
            + self._render_kpi_row('Encuestas respondidas', d.get('encuestas_respondidas', 0))
            + self._render_kpi_row('NPS promedio', f"{nps:.1f}" if nps else 'N/A')
        )

    def _render_presupuesto(self, d):
        return (
            self._render_kpi_row('Total asignado', f"${d.get('total_asignado', 0):,.0f}")
            + self._render_kpi_row('Total ejecutado', f"${d.get('total_ejecutado', 0):,.0f}")
            + self._render_kpi_row('Saldo disponible', f"${d.get('saldo_disponible', 0):,.0f}")
            + self._render_kpi_row('% Ejecución', self._pct_badge(d.get('porcentaje_ejecucion', 0)))
        )

    def _render_planeacion(self, d):
        return (
            self._render_kpi_row('Total objetivos', d.get('total_objetivos', 0))
            + self._render_kpi_row('Completados', d.get('completados', 0))
            + self._render_kpi_row('Retrasados', d.get('retrasados', 0))
            + self._render_kpi_row('Avance global', self._pct_badge(d.get('avance_global', 0)))
            + self._render_kpi_row('Total KPIs', d.get('total_kpis', 0))
        )

    def _render_contexto(self, d):
        return (
            self._render_kpi_row('Análisis DOFA', d.get('analisis_dofa', 0))
            + self._render_kpi_row('Análisis PESTEL', d.get('analisis_pestel', 0))
            + self._render_kpi_row('Partes interesadas', d.get('partes_interesadas_total', 0))
            + self._render_kpi_row('Nuevas PI en período', d.get('partes_interesadas_nuevas', 0))
        )
