/**
 * Utilidad de Exportación para Actas de Revisión por la Dirección
 *
 * Genera PDF profesional con formato según ISO 9001:2015, ISO 14001:2015, ISO 45001:2018
 *
 * Características:
 * - Encabezado con logo de empresa y branding
 * - Secciones estructuradas según normas ISO
 * - Lista de participantes con checkbox de asistencia
 * - Tabla de compromisos derivados
 * - Espacios para firmas (Elaborado, Revisado, Aprobado)
 * - Pie de página con consecutivo, fecha y número de página
 */

import { jsPDF } from 'jspdf';
import type { ActaRevision } from '../types/revision-direccion.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Interfaz extendida del Acta con todos los datos necesarios para generar el PDF
 */
export interface ActaRevisionExpandida extends ActaRevision {
  // Datos del programa
  programa_data: {
    anio: number;
    periodo: string;
    fecha_programada: string;
    fecha_realizada?: string;
    lugar: string;
    incluye_calidad: boolean;
    incluye_sst: boolean;
    incluye_ambiental: boolean;
    incluye_pesv: boolean;
    incluye_seguridad_info: boolean;
  };
  // Participantes con detalles completos
  participantes: Array<{
    id: number;
    usuario_nombre: string;
    rol_display: string;
    asistio: boolean;
    cargo?: string;
  }>;
  // Temas analizados
  temas_analizados: Array<{
    orden: number;
    categoria_display: string;
    titulo: string;
    presentado_por_nombre?: string;
    resumen_presentacion: string;
    hallazgos: string;
    decisiones: string;
  }>;
  // Compromisos
  compromisos_lista: Array<{
    consecutivo: string;
    tipo_display: string;
    descripcion: string;
    responsable_nombre?: string;
    fecha_compromiso: string;
    prioridad_display: string;
    estado_display: string;
  }>;
  // Campos adicionales para PDF
  introduccion?: string;
  orden_del_dia?: string;
  conclusiones_generales?: string;
  decisiones_mejora?: string;
  necesidad_cambios?: string;
  necesidad_recursos?: string;
  evaluacion_sistema?: 'adecuado' | 'parcialmente_adecuado' | 'no_adecuado';
  observaciones_evaluacion?: string;
  elaborado_por_nombre?: string;
  fecha_elaboracion?: string;
  revisado_por_nombre?: string;
  fecha_revision_acta?: string;
  // Branding (logo de empresa)
  empresa_logo?: string;
  empresa_nombre?: string;
}

// =============================================================================
// TIPOS DE ERROR
// =============================================================================

export class ExportActaError extends Error {
  constructor(
    message: string,
    public readonly type: 'VALIDATION' | 'GENERATION' | 'DOWNLOAD' | 'UNKNOWN' = 'UNKNOWN',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ExportActaError';
  }
}

// =============================================================================
// CONSTANTES DE DISEÑO
// =============================================================================

const PAGE_CONFIG = {
  format: 'a4' as const,
  orientation: 'portrait' as const,
  unit: 'mm' as const,
};

const COLORS = {
  primary: '#1e40af', // blue-800
  secondary: '#64748b', // slate-500
  text: '#1e293b', // slate-800
  textLight: '#475569', // slate-600
  border: '#cbd5e1', // slate-300
  background: '#f8fafc', // slate-50
  success: '#22c55e', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
};

const MARGINS = {
  top: 20,
  bottom: 20,
  left: 20,
  right: 20,
};

const FONTS = {
  title: 16,
  subtitle: 14,
  heading: 12,
  body: 10,
  small: 8,
};

// =============================================================================
// FUNCIÓN PRINCIPAL DE EXPORTACIÓN
// =============================================================================

/**
 * Exporta el acta de revisión por la dirección a PDF
 */
export const exportActaToPDF = async (
  acta: ActaRevisionExpandida,
  options: {
    includeParticipants?: boolean;
    includeAnalysis?: boolean;
    includeCommitments?: boolean;
    includeSignatures?: boolean;
  } = {}
): Promise<void> => {
  const {
    includeParticipants = true,
    includeAnalysis = true,
    includeCommitments = true,
    includeSignatures = true,
  } = options;

  try {
    // Validar datos del acta
    validateActaData(acta);

    // Crear documento PDF
    const pdf = new jsPDF(PAGE_CONFIG);
    let currentY = MARGINS.top;

    // 1. Encabezado con logo y título
    currentY = addHeader(pdf, acta, currentY);
    currentY += 5;

    // 2. Información general del acta
    currentY = addGeneralInfo(pdf, acta, currentY);
    currentY += 5;

    // 3. Participantes (si se incluyen)
    if (includeParticipants && acta.participantes && acta.participantes.length > 0) {
      currentY = checkPageBreak(pdf, currentY, 40);
      currentY = addParticipants(pdf, acta.participantes, currentY);
      currentY += 5;
    }

    // 4. Introducción y Orden del Día
    if (acta.introduccion || acta.orden_del_dia) {
      currentY = checkPageBreak(pdf, currentY, 30);
      currentY = addIntroduction(pdf, acta, currentY);
      currentY += 5;
    }

    // 5. Análisis de Temas (si se incluyen)
    if (includeAnalysis && acta.temas_analizados && acta.temas_analizados.length > 0) {
      currentY = checkPageBreak(pdf, currentY, 40);
      currentY = addThemeAnalysis(pdf, acta.temas_analizados, currentY);
      currentY += 5;
    }

    // 6. Conclusiones y Decisiones
    if (acta.conclusiones_generales || acta.decisiones_mejora) {
      currentY = checkPageBreak(pdf, currentY, 40);
      currentY = addConclusions(pdf, acta, currentY);
      currentY += 5;
    }

    // 7. Evaluación del Sistema
    currentY = checkPageBreak(pdf, currentY, 25);
    currentY = addSystemEvaluation(pdf, acta, currentY);
    currentY += 5;

    // 8. Compromisos (si se incluyen)
    if (includeCommitments && acta.compromisos_lista && acta.compromisos_lista.length > 0) {
      currentY = checkPageBreak(pdf, currentY, 60);
      currentY = addCommitments(pdf, acta.compromisos_lista, currentY);
      currentY += 5;
    }

    // 9. Firmas (si se incluyen)
    if (includeSignatures) {
      // Asegurar que las firmas estén en una nueva página si no hay espacio
      checkPageBreak(pdf, currentY, 80, true);
      addSignatures(pdf, acta, currentY);
    }

    // Agregar pie de página a todas las páginas
    addFooter(pdf, acta);

    // Descargar PDF
    const filename = `Acta_Revision_${acta.numero_acta.replace(/\//g, '-')}_${formatDateForFilename()}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Error al exportar acta a PDF:', error);

    // Determinar tipo de error
    let errorType: ExportActaError['type'] = 'UNKNOWN';
    let errorMessage = 'No se pudo exportar el acta a PDF';

    if (error instanceof Error) {
      if (error.message.includes('validación')) {
        errorType = 'VALIDATION';
        errorMessage = error.message;
      } else if (error.message.includes('generar') || error.message.includes('jsPDF')) {
        errorType = 'GENERATION';
        errorMessage = 'Error al generar el archivo PDF. Intenta de nuevo.';
      } else if (error.message.includes('download') || error.message.includes('save')) {
        errorType = 'DOWNLOAD';
        errorMessage = 'Error al descargar el archivo. Verifica los permisos del navegador.';
      }
    }

    throw new ExportActaError(errorMessage, errorType, error instanceof Error ? error : undefined);
  }
};

// =============================================================================
// FUNCIONES DE VALIDACIÓN
// =============================================================================

function validateActaData(acta: ActaRevisionExpandida): void {
  if (!acta) {
    throw new Error('Los datos del acta son requeridos para la validación');
  }

  if (!acta.numero_acta) {
    throw new Error('El número de acta es requerido para la validación');
  }

  if (!acta.fecha_revision) {
    throw new Error('La fecha del acta es requerida para la validación');
  }
}

// =============================================================================
// FUNCIONES DE RENDERIZADO DE SECCIONES
// =============================================================================

/**
 * Agrega el encabezado del documento con logo y título
 */
function addHeader(pdf: jsPDF, acta: ActaRevisionExpandida, yPos: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = yPos;

  // Logo (si existe)
  if (acta.empresa_logo) {
    try {
      // Nota: En una implementación real, necesitarías cargar y convertir la imagen
      // Por ahora, dejamos espacio para el logo
      const logoSize = 20;
      // pdf.addImage(acta.empresa_logo, 'PNG', MARGINS.left, y, logoSize, logoSize);

      // Texto del nombre de empresa (temporal hasta tener logo)
      if (acta.empresa_nombre) {
        pdf.setFontSize(FONTS.subtitle);
        pdf.setTextColor(COLORS.primary);
        pdf.setFont('helvetica', 'bold');
        pdf.text(acta.empresa_nombre, MARGINS.left, y + 5);
      }

      y += logoSize + 5;
    } catch (error) {
      console.warn('No se pudo cargar el logo:', error);
      y += 5;
    }
  }

  // Línea decorativa
  pdf.setDrawColor(COLORS.primary);
  pdf.setLineWidth(0.5);
  pdf.line(MARGINS.left, y, pageWidth - MARGINS.right, y);
  y += 8;

  // Título del documento
  pdf.setFontSize(FONTS.title);
  pdf.setTextColor(COLORS.text);
  pdf.setFont('helvetica', 'bold');
  const title = 'ACTA DE REVISIÓN POR LA DIRECCIÓN';
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, y);
  y += 8;

  // Número de acta
  pdf.setFontSize(FONTS.heading);
  pdf.setTextColor(COLORS.textLight);
  pdf.setFont('helvetica', 'normal');
  const actaNumber = `Acta No. ${acta.numero_acta}`;
  const numberWidth = pdf.getTextWidth(actaNumber);
  pdf.text(actaNumber, (pageWidth - numberWidth) / 2, y);
  y += 8;

  // Línea decorativa inferior
  pdf.setDrawColor(COLORS.border);
  pdf.setLineWidth(0.2);
  pdf.line(MARGINS.left, y, pageWidth - MARGINS.right, y);
  y += 5;

  return y;
}

/**
 * Agrega información general del acta
 */
function addGeneralInfo(pdf: jsPDF, acta: ActaRevisionExpandida, yPos: number): number {
  let y = yPos;
  const leftCol = MARGINS.left;
  const rightCol = pdf.internal.pageSize.getWidth() / 2 + 5;

  pdf.setFontSize(FONTS.body);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.text);

  // Columna izquierda
  pdf.text('Fecha:', leftCol, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDate(acta.fecha_revision), leftCol + 20, y);
  y += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Hora Inicio:', leftCol, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(acta.hora_inicio, leftCol + 20, y);

  if (acta.hora_fin) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Hora Fin:', leftCol + 60, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(acta.hora_fin, leftCol + 78, y);
  }
  y += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Lugar:', leftCol, y);
  pdf.setFont('helvetica', 'normal');
  const lugarText = pdf.splitTextToSize(acta.programa_data.lugar, 80);
  pdf.text(lugarText, leftCol + 20, y);
  y += lugarText.length * 5;

  // Columna derecha - Sistemas revisados
  let rightY = yPos;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Sistemas de Gestión Revisados:', rightCol, rightY);
  rightY += 6;

  pdf.setFontSize(FONTS.small);
  pdf.setFont('helvetica', 'normal');

  const sistemas = [];
  if (acta.programa_data.incluye_calidad) sistemas.push('☑ ISO 9001:2015 (Calidad)');
  if (acta.programa_data.incluye_sst) sistemas.push('☑ ISO 45001:2018 (SST)');
  if (acta.programa_data.incluye_ambiental) sistemas.push('☑ ISO 14001:2015 (Ambiental)');
  if (acta.programa_data.incluye_pesv) sistemas.push('☑ PESV');
  if (acta.programa_data.incluye_seguridad_info) sistemas.push('☑ ISO 27001 (Seg. Información)');

  sistemas.forEach((sistema) => {
    pdf.text(sistema, rightCol, rightY);
    rightY += 4;
  });

  return Math.max(y, rightY) + 3;
}

/**
 * Agrega lista de participantes
 */
function addParticipants(
  pdf: jsPDF,
  participants: Array<{
    usuario_nombre: string;
    rol_display: string;
    asistio: boolean;
    cargo?: string;
  }>,
  yPos: number
): number {
  let y = yPos;

  // Título de sección
  pdf.setFontSize(FONTS.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary);
  pdf.text('PARTICIPANTES', MARGINS.left, y);
  y += 7;

  // Tabla de participantes
  const tableConfig = {
    startX: MARGINS.left,
    startY: y,
    colWidths: [10, 60, 50, 50],
    rowHeight: 7,
  };

  // Encabezados
  pdf.setFillColor(COLORS.background);
  pdf.rect(
    tableConfig.startX,
    y,
    tableConfig.colWidths.reduce((a, b) => a + b, 0),
    tableConfig.rowHeight,
    'F'
  );

  pdf.setFontSize(FONTS.small);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.text);

  let x = tableConfig.startX + 2;
  pdf.text('✓', x, y + 5);
  x += tableConfig.colWidths[0];
  pdf.text('Nombre', x, y + 5);
  x += tableConfig.colWidths[1];
  pdf.text('Rol', x, y + 5);
  x += tableConfig.colWidths[2];
  pdf.text('Cargo', x, y + 5);

  y += tableConfig.rowHeight;

  // Filas de datos
  pdf.setFont('helvetica', 'normal');
  participants.forEach((participant, index) => {
    // Alternar color de fondo
    if (index % 2 === 0) {
      pdf.setFillColor(COLORS.background);
      pdf.rect(
        tableConfig.startX,
        y,
        tableConfig.colWidths.reduce((a, b) => a + b, 0),
        tableConfig.rowHeight,
        'F'
      );
    }

    x = tableConfig.startX + 2;

    // Checkbox de asistencia
    pdf.setDrawColor(COLORS.border);
    pdf.rect(x, y + 1, 3, 3);
    if (participant.asistio) {
      pdf.setTextColor(COLORS.success);
      pdf.text('✓', x + 0.5, y + 4);
      pdf.setTextColor(COLORS.text);
    }

    x += tableConfig.colWidths[0];
    pdf.text(participant.usuario_nombre, x, y + 5);

    x += tableConfig.colWidths[1];
    pdf.text(participant.rol_display, x, y + 5);

    x += tableConfig.colWidths[2];
    pdf.text(participant.cargo || '-', x, y + 5);

    y += tableConfig.rowHeight;
  });

  // Borde de la tabla
  pdf.setDrawColor(COLORS.border);
  pdf.rect(
    tableConfig.startX,
    tableConfig.startY,
    tableConfig.colWidths.reduce((a, b) => a + b, 0),
    (participants.length + 1) * tableConfig.rowHeight
  );

  return y + 3;
}

/**
 * Agrega introducción y orden del día
 */
function addIntroduction(pdf: jsPDF, acta: ActaRevisionExpandida, yPos: number): number {
  let y = yPos;

  if (acta.introduccion) {
    // Título
    pdf.setFontSize(FONTS.heading);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primary);
    pdf.text('INTRODUCCIÓN', MARGINS.left, y);
    y += 7;

    // Contenido
    pdf.setFontSize(FONTS.body);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.text);
    const introLines = pdf.splitTextToSize(
      acta.introduccion,
      pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right
    );
    pdf.text(introLines, MARGINS.left, y);
    y += introLines.length * 5 + 5;
  }

  if (acta.orden_del_dia) {
    y = checkPageBreak(pdf, y, 20);

    // Título
    pdf.setFontSize(FONTS.heading);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.primary);
    pdf.text('ORDEN DEL DÍA', MARGINS.left, y);
    y += 7;

    // Contenido
    pdf.setFontSize(FONTS.body);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.text);
    const agendaLines = pdf.splitTextToSize(
      acta.orden_del_dia,
      pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right
    );
    pdf.text(agendaLines, MARGINS.left, y);
    y += agendaLines.length * 5;
  }

  return y;
}

/**
 * Agrega análisis de temas
 */
function addThemeAnalysis(
  pdf: jsPDF,
  themes: Array<{
    orden: number;
    categoria_display: string;
    titulo: string;
    presentado_por_nombre?: string;
    resumen_presentacion: string;
    hallazgos: string;
    decisiones: string;
  }>,
  yPos: number
): number {
  let y = yPos;

  // Título de sección
  pdf.setFontSize(FONTS.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary);
  pdf.text('ANÁLISIS DE TEMAS REVISADOS', MARGINS.left, y);
  y += 7;

  themes.forEach((theme, index) => {
    // Verificar espacio para nuevo tema
    y = checkPageBreak(pdf, y, 35);

    // Número y título del tema
    pdf.setFontSize(FONTS.body);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.text);
    pdf.text(`${theme.orden}. ${theme.titulo}`, MARGINS.left, y);
    y += 5;

    // Categoría y presentador
    pdf.setFontSize(FONTS.small);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(COLORS.textLight);
    pdf.text(`Categoría: ${theme.categoria_display}`, MARGINS.left + 5, y);
    if (theme.presentado_por_nombre) {
      pdf.text(`| Presentado por: ${theme.presentado_por_nombre}`, MARGINS.left + 60, y);
    }
    y += 6;

    // Resumen
    if (theme.resumen_presentacion) {
      pdf.setFontSize(FONTS.body);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.text);
      const resumenLines = pdf.splitTextToSize(
        theme.resumen_presentacion,
        pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right - 5
      );
      pdf.text(resumenLines, MARGINS.left + 5, y);
      y += resumenLines.length * 4 + 3;
    }

    // Hallazgos
    if (theme.hallazgos) {
      y = checkPageBreak(pdf, y, 15);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.textLight);
      pdf.text('Hallazgos:', MARGINS.left + 5, y);
      y += 4;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.text);
      const hallazgosLines = pdf.splitTextToSize(
        theme.hallazgos,
        pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right - 10
      );
      pdf.text(hallazgosLines, MARGINS.left + 10, y);
      y += hallazgosLines.length * 4 + 2;
    }

    // Decisiones
    if (theme.decisiones) {
      y = checkPageBreak(pdf, y, 15);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.textLight);
      pdf.text('Decisiones:', MARGINS.left + 5, y);
      y += 4;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.text);
      const decisionesLines = pdf.splitTextToSize(
        theme.decisiones,
        pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right - 10
      );
      pdf.text(decisionesLines, MARGINS.left + 10, y);
      y += decisionesLines.length * 4 + 2;
    }

    // Separador entre temas
    if (index < themes.length - 1) {
      pdf.setDrawColor(COLORS.border);
      pdf.setLineWidth(0.1);
      pdf.line(MARGINS.left + 5, y, pdf.internal.pageSize.getWidth() - MARGINS.right, y);
      y += 4;
    }
  });

  return y;
}

/**
 * Agrega conclusiones y decisiones
 */
function addConclusions(pdf: jsPDF, acta: ActaRevisionExpandida, yPos: number): number {
  let y = yPos;

  // Título de sección
  pdf.setFontSize(FONTS.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary);
  pdf.text('CONCLUSIONES Y DECISIONES', MARGINS.left, y);
  y += 7;

  pdf.setFontSize(FONTS.body);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.text);

  // Conclusiones generales
  if (acta.conclusiones_generales) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Conclusiones Generales:', MARGINS.left, y);
    y += 5;

    pdf.setFont('helvetica', 'normal');
    const conclusionesLines = pdf.splitTextToSize(
      acta.conclusiones_generales,
      pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right - 5
    );
    pdf.text(conclusionesLines, MARGINS.left + 5, y);
    y += conclusionesLines.length * 5 + 3;
  }

  // Oportunidades de mejora
  if (acta.decisiones_mejora) {
    y = checkPageBreak(pdf, y, 15);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Oportunidades de Mejora:', MARGINS.left, y);
    y += 5;

    pdf.setFont('helvetica', 'normal');
    const mejoraLines = pdf.splitTextToSize(
      acta.decisiones_mejora,
      pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right - 5
    );
    pdf.text(mejoraLines, MARGINS.left + 5, y);
    y += mejoraLines.length * 5 + 3;
  }

  // Necesidad de cambios
  if (acta.necesidad_cambios) {
    y = checkPageBreak(pdf, y, 15);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Necesidad de Cambios en el SG:', MARGINS.left, y);
    y += 5;

    pdf.setFont('helvetica', 'normal');
    const cambiosLines = pdf.splitTextToSize(
      acta.necesidad_cambios,
      pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right - 5
    );
    pdf.text(cambiosLines, MARGINS.left + 5, y);
    y += cambiosLines.length * 5 + 3;
  }

  // Necesidad de recursos
  if (acta.necesidad_recursos) {
    y = checkPageBreak(pdf, y, 15);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Necesidades de Recursos:', MARGINS.left, y);
    y += 5;

    pdf.setFont('helvetica', 'normal');
    const recursosLines = pdf.splitTextToSize(
      acta.necesidad_recursos,
      pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right - 5
    );
    pdf.text(recursosLines, MARGINS.left + 5, y);
    y += recursosLines.length * 5;
  }

  return y;
}

/**
 * Agrega evaluación del sistema
 */
function addSystemEvaluation(pdf: jsPDF, acta: ActaRevisionExpandida, yPos: number): number {
  let y = yPos;

  // Título de sección
  pdf.setFontSize(FONTS.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary);
  pdf.text('EVALUACIÓN DEL SISTEMA DE GESTIÓN', MARGINS.left, y);
  y += 7;

  // Resultado de evaluación
  pdf.setFontSize(FONTS.body);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Estado del Sistema:', MARGINS.left, y);

  // Color según evaluación
  let evaluacionColor = COLORS.text;
  let evaluacionText = 'Adecuado';

  switch (acta.evaluacion_sistema) {
    case 'adecuado':
      evaluacionColor = COLORS.success;
      evaluacionText = 'ADECUADO';
      break;
    case 'parcialmente_adecuado':
      evaluacionColor = COLORS.warning;
      evaluacionText = 'PARCIALMENTE ADECUADO';
      break;
    case 'no_adecuado':
      evaluacionColor = COLORS.danger;
      evaluacionText = 'NO ADECUADO';
      break;
  }

  pdf.setTextColor(evaluacionColor);
  pdf.text(evaluacionText, MARGINS.left + 40, y);
  pdf.setTextColor(COLORS.text);
  y += 7;

  // Observaciones
  if (acta.observaciones_evaluacion) {
    pdf.setFont('helvetica', 'normal');
    const obsLines = pdf.splitTextToSize(
      acta.observaciones_evaluacion,
      pdf.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right - 5
    );
    pdf.text(obsLines, MARGINS.left + 5, y);
    y += obsLines.length * 5;
  }

  return y;
}

/**
 * Agrega tabla de compromisos
 */
function addCommitments(
  pdf: jsPDF,
  commitments: Array<{
    consecutivo: string;
    tipo_display: string;
    descripcion: string;
    responsable_nombre?: string;
    fecha_compromiso: string;
    prioridad_display: string;
    estado_display: string;
  }>,
  yPos: number
): number {
  let y = yPos;

  // Título de sección
  pdf.setFontSize(FONTS.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary);
  pdf.text('COMPROMISOS Y ACCIONES DERIVADAS', MARGINS.left, y);
  y += 7;

  // Configuración de tabla
  const tableConfig = {
    startX: MARGINS.left,
    startY: y,
    colWidths: [18, 25, 65, 35, 27],
    rowHeight: 7,
  };

  // Encabezados
  pdf.setFillColor(COLORS.background);
  pdf.rect(
    tableConfig.startX,
    y,
    tableConfig.colWidths.reduce((a, b) => a + b, 0),
    tableConfig.rowHeight,
    'F'
  );

  pdf.setFontSize(FONTS.small);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.text);

  let x = tableConfig.startX + 2;
  pdf.text('No.', x, y + 5);
  x += tableConfig.colWidths[0];
  pdf.text('Tipo', x, y + 5);
  x += tableConfig.colWidths[1];
  pdf.text('Descripción', x, y + 5);
  x += tableConfig.colWidths[2];
  pdf.text('Responsable', x, y + 5);
  x += tableConfig.colWidths[3];
  pdf.text('Fecha Límite', x, y + 5);

  y += tableConfig.rowHeight;

  // Filas de datos
  pdf.setFont('helvetica', 'normal');
  commitments.forEach((commitment, index) => {
    // Verificar espacio y hacer salto de página si es necesario
    if (y > pdf.internal.pageSize.getHeight() - MARGINS.bottom - 20) {
      pdf.addPage();
      y = MARGINS.top;

      // Re-dibujar encabezados en nueva página
      pdf.setFillColor(COLORS.background);
      pdf.rect(
        tableConfig.startX,
        y,
        tableConfig.colWidths.reduce((a, b) => a + b, 0),
        tableConfig.rowHeight,
        'F'
      );

      pdf.setFontSize(FONTS.small);
      pdf.setFont('helvetica', 'bold');
      let headerX = tableConfig.startX + 2;
      pdf.text('No.', headerX, y + 5);
      headerX += tableConfig.colWidths[0];
      pdf.text('Tipo', headerX, y + 5);
      headerX += tableConfig.colWidths[1];
      pdf.text('Descripción', headerX, y + 5);
      headerX += tableConfig.colWidths[2];
      pdf.text('Responsable', headerX, y + 5);
      headerX += tableConfig.colWidths[3];
      pdf.text('Fecha Límite', headerX, y + 5);

      y += tableConfig.rowHeight;
      pdf.setFont('helvetica', 'normal');
    }

    // Alternar color de fondo
    if (index % 2 === 0) {
      pdf.setFillColor(COLORS.background);
      pdf.rect(
        tableConfig.startX,
        y,
        tableConfig.colWidths.reduce((a, b) => a + b, 0),
        tableConfig.rowHeight,
        'F'
      );
    }

    x = tableConfig.startX + 2;
    pdf.text(commitment.consecutivo, x, y + 5);

    x += tableConfig.colWidths[0];
    const tipoText = pdf.splitTextToSize(commitment.tipo_display, tableConfig.colWidths[1] - 4);
    pdf.text(tipoText[0], x, y + 5);

    x += tableConfig.colWidths[1];
    const descText = pdf.splitTextToSize(commitment.descripcion, tableConfig.colWidths[2] - 4);
    pdf.text(descText[0] + (descText.length > 1 ? '...' : ''), x, y + 5);

    x += tableConfig.colWidths[2];
    pdf.text(commitment.responsable_nombre || '-', x, y + 5);

    x += tableConfig.colWidths[3];
    pdf.text(formatDate(commitment.fecha_compromiso), x, y + 5);

    y += tableConfig.rowHeight;
  });

  // Borde de la tabla
  pdf.setDrawColor(COLORS.border);
  const totalHeight = (commitments.length + 1) * tableConfig.rowHeight;
  pdf.rect(
    tableConfig.startX,
    tableConfig.startY,
    tableConfig.colWidths.reduce((a, b) => a + b, 0),
    totalHeight
  );

  return y + 3;
}

/**
 * Agrega sección de firmas
 */
function addSignatures(pdf: jsPDF, acta: ActaRevisionExpandida, yPos: number): number {
  let y = yPos;
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Título de sección
  pdf.setFontSize(FONTS.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary);
  pdf.text('FIRMAS', MARGINS.left, y);
  y += 10;

  // Configuración de columnas de firma
  const signatureWidth = 50;
  const signatureHeight = 25;
  const signatureGap = 10;
  const totalWidth = signatureWidth * 3 + signatureGap * 2;
  const startX = (pageWidth - totalWidth) / 2;

  const signatures = [
    {
      label: 'Elaborado por',
      name: acta.elaborado_por_nombre || '_____________________',
      date: acta.fecha_elaboracion ? formatDate(acta.fecha_elaboracion) : '_____________',
    },
    {
      label: 'Revisado por',
      name: acta.revisado_por_nombre || '_____________________',
      date: acta.fecha_revision_acta ? formatDate(acta.fecha_revision_acta) : '_____________',
    },
    {
      label: 'Aprobado por',
      name: acta.aprobada_por_name || '_____________________',
      date: acta.fecha_aprobacion ? formatDate(acta.fecha_aprobacion) : '_____________',
    },
  ];

  signatures.forEach((sig, index) => {
    const x = startX + index * (signatureWidth + signatureGap);

    // Espacio para firma (línea)
    pdf.setDrawColor(COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.line(x, y + signatureHeight, x + signatureWidth, y + signatureHeight);

    // Nombre del firmante
    pdf.setFontSize(FONTS.small);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(COLORS.text);
    const nameWidth = pdf.getTextWidth(sig.name);
    pdf.text(sig.name, x + (signatureWidth - nameWidth) / 2, y + signatureHeight + 5);

    // Rol/Label
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(COLORS.textLight);
    const labelWidth = pdf.getTextWidth(sig.label);
    pdf.text(sig.label, x + (signatureWidth - labelWidth) / 2, y + signatureHeight + 9);

    // Fecha
    pdf.setFont('helvetica', 'normal');
    const dateText = `Fecha: ${sig.date}`;
    const dateWidth = pdf.getTextWidth(dateText);
    pdf.text(dateText, x + (signatureWidth - dateWidth) / 2, y + signatureHeight + 13);
  });

  return y + signatureHeight + 18;
}

/**
 * Agrega pie de página a todas las páginas
 */
function addFooter(pdf: jsPDF, acta: ActaRevisionExpandida): void {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    const footerY = pageHeight - MARGINS.bottom + 10;

    // Línea superior del pie
    pdf.setDrawColor(COLORS.border);
    pdf.setLineWidth(0.2);
    pdf.line(MARGINS.left, footerY - 3, pageWidth - MARGINS.right, footerY - 3);

    // Texto del pie
    pdf.setFontSize(FONTS.small);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.textLight);

    // Izquierda: Número de acta
    pdf.text(`Acta: ${acta.numero_acta}`, MARGINS.left, footerY);

    // Centro: Fecha de generación
    const generatedText = `Generado: ${formatDate(new Date().toISOString())}`;
    const genWidth = pdf.getTextWidth(generatedText);
    pdf.text(generatedText, (pageWidth - genWidth) / 2, footerY);

    // Derecha: Número de página
    const pageText = `Página ${i} de ${pageCount}`;
    const pageWidth2 = pdf.getTextWidth(pageText);
    pdf.text(pageText, pageWidth - MARGINS.right - pageWidth2, footerY);
  }
}

// =============================================================================
// UTILIDADES AUXILIARES
// =============================================================================

/**
 * Verifica si hay espacio suficiente en la página actual
 * Si no hay espacio, agrega una nueva página
 */
function checkPageBreak(
  pdf: jsPDF,
  currentY: number,
  requiredSpace: number,
  forceNewPage: boolean = false
): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const availableSpace = pageHeight - currentY - MARGINS.bottom;

  if (forceNewPage || availableSpace < requiredSpace) {
    pdf.addPage();
    return MARGINS.top;
  }

  return currentY;
}

/**
 * Formatea fecha para mostrar en el PDF
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch {
    return dateString;
  }
}

/**
 * Formatea fecha para nombre de archivo
 */
function formatDateForFilename(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}
