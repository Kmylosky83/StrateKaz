/**
 * Utilidades de Exportación para el Organigrama
 *
 * Usa html-to-image para PNG y jsPDF para PDF
 *
 * Mejoras implementadas:
 * - Manejo de errores específico por tipo
 * - Soporte para forzar light mode durante exportación
 * - Mensajes de error descriptivos
 */

import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { ExportOptions, OrganigramaStats } from '../types/organigrama.types';

// =============================================================================
// TIPOS DE ERROR
// =============================================================================

export class ExportError extends Error {
  constructor(
    message: string,
    public readonly type: 'PERMISSION' | 'RENDER' | 'DOWNLOAD' | 'UNKNOWN' = 'UNKNOWN',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

// =============================================================================
// CONSTANTES
// =============================================================================

const EXPORT_PADDING = 20;
const TITLE_HEIGHT = 60;
const LEGEND_HEIGHT = 80;
const DATE_HEIGHT = 30;

// =============================================================================
// UTILIDADES DE TEMA
// =============================================================================

/**
 * Fuerza light mode temporalmente para evitar problemas con dark mode en exportación
 * Retorna función de cleanup para restaurar el tema original
 */
const forceLightModeTemporarily = (): (() => void) => {
  const htmlElement = document.documentElement;
  const hadDarkMode = htmlElement.classList.contains('dark');

  if (hadDarkMode) {
    htmlElement.classList.remove('dark');
  }

  // Retornar función para restaurar el tema original
  return () => {
    if (hadDarkMode) {
      htmlElement.classList.add('dark');
    }
  };
};

// =============================================================================
// EXPORTAR A PNG
// =============================================================================

/**
 * Exporta el canvas del organigrama a PNG
 * Captura directamente el ReactFlow completo sin clonar
 */
export const exportToPng = async (
  element: HTMLElement,
  options: ExportOptions,
  stats?: OrganigramaStats,
  title?: string
): Promise<void> => {
  // Forzar light mode temporalmente
  const restoreTheme = forceLightModeTemporarily();

  try {
    // Buscar el contenedor principal de ReactFlow (no el viewport)
    const reactFlowContainer = element.closest('.react-flow') as HTMLElement;
    if (!reactFlowContainer) {
      throw new Error('No se encontró el contenedor de ReactFlow');
    }

    // Ocultar temporalmente elementos que no queremos en la exportación
    const minimap = reactFlowContainer.querySelector('.react-flow__minimap') as HTMLElement;
    const controls = reactFlowContainer.querySelector('.react-flow__controls') as HTMLElement;
    const panel = reactFlowContainer.querySelector('.react-flow__panel') as HTMLElement;

    const hiddenElements: HTMLElement[] = [];
    [minimap, controls, panel].forEach(el => {
      if (el) {
        el.style.display = 'none';
        hiddenElements.push(el);
      }
    });

    // Generar imagen directamente del contenedor ReactFlow
    const dataUrl = await Promise.race([
      toPng(reactFlowContainer, {
        quality: options.quality,
        pixelRatio: options.quality,
        backgroundColor: '#ffffff',
        filter: (node) => {
          // Excluir minimapa, controles y paneles
          if (node instanceof Element) {
            const className = node.className?.toString() || '';
            if (
              className.includes('react-flow__minimap') ||
              className.includes('react-flow__controls') ||
              className.includes('react-flow__panel')
            ) {
              return false;
            }
          }
          return true;
        },
      }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout al generar imagen')), 30000)
      ),
    ]);

    // Restaurar elementos ocultos
    hiddenElements.forEach(el => {
      el.style.display = '';
    });

    // Si necesitamos agregar título/fecha/leyenda, crear un canvas compuesto
    if (options.includeTitle || options.includeDate || options.includeLegend) {
      const finalDataUrl = await addHeaderAndLegend(dataUrl, options, stats, title);
      downloadFile(finalDataUrl, `organigrama_${formatDateForFilename()}.png`);
    } else {
      downloadFile(dataUrl, `organigrama_${formatDateForFilename()}.png`);
    }
  } catch (error) {
    console.error('Error al exportar a PNG:', error);

    // Determinar tipo de error
    let errorType: ExportError['type'] = 'UNKNOWN';
    let errorMessage = 'No se pudo exportar el organigrama a PNG';

    if (error instanceof Error) {
      if (error.message.includes('Timeout')) {
        errorType = 'RENDER';
        errorMessage = 'La exportación tardó demasiado. Intenta con un organigrama más pequeño.';
      } else if (error.message.includes('permission') || error.message.includes('SecurityError')) {
        errorType = 'PERMISSION';
        errorMessage = 'No se tienen los permisos necesarios para exportar. Verifica la configuración del navegador.';
      } else if (error.message.includes('render') || error.message.includes('canvas')) {
        errorType = 'RENDER';
        errorMessage = 'Error al renderizar el organigrama. Intenta ajustar el zoom o el tamaño.';
      }
    }

    throw new ExportError(errorMessage, errorType, error instanceof Error ? error : undefined);
  } finally {
    // Restaurar tema
    restoreTheme();
  }
};

/**
 * Agrega título, fecha y leyenda a una imagen existente usando Canvas
 */
const addHeaderAndLegend = async (
  imageDataUrl: string,
  options: ExportOptions,
  stats?: OrganigramaStats,
  title?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calcular dimensiones adicionales
      let headerHeight = 0;
      let footerHeight = 0;
      const padding = EXPORT_PADDING;

      if (options.includeTitle) headerHeight += 40;
      if (options.includeDate) headerHeight += 25;
      if (options.includeLegend) footerHeight += 60;

      // Crear canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + headerHeight + footerHeight + padding * 2;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'));
        return;
      }

      // Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let yPos = padding;

      // Título
      if (options.includeTitle && title) {
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, yPos + 28);
        yPos += 40;
      }

      // Fecha
      if (options.includeDate) {
        ctx.font = '14px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        const dateText = `Generado el ${new Date().toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`;
        ctx.fillText(dateText, canvas.width / 2, yPos + 18);
        yPos += 25;
      }

      // Imagen del organigrama
      ctx.drawImage(img, padding, yPos);
      yPos += img.height + 10;

      // Leyenda
      if (options.includeLegend && stats) {
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';

        // Niveles jerárquicos
        const levels = [
          { label: 'Estratégico', color: '#ef4444' },
          { label: 'Táctico', color: '#3b82f6' },
          { label: 'Operativo', color: '#22c55e' },
          { label: 'Apoyo', color: '#a855f7' },
        ];

        const legendWidth = levels.length * 100;
        let xPos = (canvas.width - legendWidth) / 2;

        levels.forEach(({ label, color }) => {
          // Círculo de color
          ctx.beginPath();
          ctx.arc(xPos + 8, yPos, 6, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          // Texto
          ctx.fillStyle = '#4b5563';
          ctx.textAlign = 'left';
          ctx.fillText(label, xPos + 20, yPos + 4);
          xPos += 100;
        });

        yPos += 25;

        // Stats
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        const statsText = `Áreas: ${stats.areas_activas}/${stats.total_areas} | Cargos: ${stats.cargos_activos}/${stats.total_cargos} | Usuarios: ${stats.total_usuarios}`;
        ctx.fillText(statsText, canvas.width / 2, yPos);
        yPos += 20;
      }

      // Footer: Powered by StrateKaz
      ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'center';
      ctx.fillText('Powered by StrateKaz', canvas.width / 2, canvas.height - padding / 2);

      resolve(canvas.toDataURL('image/png', 1.0));
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen para composición'));
    };

    img.src = imageDataUrl;
  });
};

// =============================================================================
// EXPORTAR A PDF
// =============================================================================

/**
 * Exporta el canvas del organigrama a PDF
 */
export const exportToPdf = async (
  element: HTMLElement,
  options: ExportOptions,
  stats?: OrganigramaStats,
  title?: string
): Promise<void> => {
  // Forzar light mode temporalmente
  const restoreTheme = forceLightModeTemporarily();

  try {
    // Generar imagen PNG primero con timeout
    const dataUrl = await Promise.race([
      toPng(element, {
        quality: options.quality,
        pixelRatio: options.quality,
        backgroundColor: '#ffffff',
      }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout al generar imagen')), 30000)
      ),
    ]);

    // Crear PDF
    const pdf = new jsPDF({
      orientation: options.orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    let yPosition = margin;

    // Agregar título
    if (options.includeTitle && title) {
      pdf.setFontSize(18);
      pdf.setTextColor(17, 24, 39); // gray-900
      pdf.text(title, pageWidth / 2, yPosition + 8, { align: 'center' });
      yPosition += 15;
    }

    // Agregar fecha
    if (options.includeDate) {
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128); // gray-500
      const dateText = `Generado el ${new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`;
      pdf.text(dateText, pageWidth / 2, yPosition + 5, { align: 'center' });
      yPosition += 12;
    }

    // Calcular dimensiones de la imagen
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => (img.onload = resolve));

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (img.height * imgWidth) / img.width;

    // Agregar imagen
    const availableHeight = pageHeight - yPosition - margin - (options.includeLegend ? 25 : 0);
    const finalHeight = Math.min(imgHeight, availableHeight);
    const finalWidth = (img.width * finalHeight) / img.height;

    pdf.addImage(
      dataUrl,
      'PNG',
      (pageWidth - finalWidth) / 2,
      yPosition,
      finalWidth,
      finalHeight
    );

    yPosition += finalHeight + 5;

    // Agregar leyenda
    if (options.includeLegend && stats) {
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);

      const legendText = [
        `Total Áreas: ${stats.total_areas} (${stats.areas_activas} activas)`,
        `Total Cargos: ${stats.total_cargos} (${stats.cargos_activos} activos)`,
        `Total Usuarios: ${stats.total_usuarios}`,
      ].join(' | ');

      pdf.text(legendText, pageWidth / 2, pageHeight - margin - 5, { align: 'center' });
    }

    // Footer: Powered by StrateKaz
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175); // gray-400
    pdf.setFont('helvetica', 'italic');
    pdf.text('Powered by StrateKaz', pageWidth / 2, pageHeight - 3, { align: 'center' });

    // Descargar
    pdf.save(`organigrama_${formatDateForFilename()}.pdf`);
  } catch (error) {
    console.error('Error al exportar a PDF:', error);

    // Determinar tipo de error
    let errorType: ExportError['type'] = 'UNKNOWN';
    let errorMessage = 'No se pudo exportar el organigrama a PDF';

    if (error instanceof Error) {
      if (error.message.includes('Timeout')) {
        errorType = 'RENDER';
        errorMessage = 'La exportación tardó demasiado. Intenta con un organigrama más pequeño.';
      } else if (error.message.includes('permission') || error.message.includes('SecurityError')) {
        errorType = 'PERMISSION';
        errorMessage = 'No se tienen los permisos necesarios para exportar. Verifica la configuración del navegador.';
      } else if (error.message.includes('render') || error.message.includes('canvas')) {
        errorType = 'RENDER';
        errorMessage = 'Error al renderizar el organigrama. Intenta ajustar el zoom o el tamaño.';
      } else if (error.message.includes('jsPDF') || error.message.includes('PDF')) {
        errorType = 'DOWNLOAD';
        errorMessage = 'Error al generar el archivo PDF. Intenta exportar como PNG.';
      }
    }

    throw new ExportError(errorMessage, errorType, error instanceof Error ? error : undefined);
  } finally {
    // Restaurar tema
    restoreTheme();
  }
};

// =============================================================================
// FUNCIÓN PRINCIPAL DE EXPORTACIÓN
// =============================================================================

/**
 * Exporta el organigrama según las opciones especificadas
 */
export const exportOrganigrama = async (
  element: HTMLElement,
  options: ExportOptions,
  stats?: OrganigramaStats,
  title: string = 'Organigrama Organizacional',
  empresaNombre?: string
): Promise<void> => {
  // Si hay nombre de empresa, usarlo en el título
  const finalTitle = empresaNombre ? `${title} - ${empresaNombre}` : title;

  if (options.format === 'png') {
    await exportToPng(element, options, stats, finalTitle);
  } else {
    await exportToPdf(element, options, stats, finalTitle);
  }
};

// =============================================================================
// UTILIDADES AUXILIARES
// =============================================================================

/**
 * Crea elemento de leyenda para exportación PNG
 */
const createLegendElement = (stats?: OrganigramaStats): HTMLElement => {
  const legend = document.createElement('div');
  legend.style.marginTop = '20px';
  legend.style.padding = '15px';
  legend.style.borderTop = '1px solid #e5e7eb';

  // Colores de nivel
  const colors = [
    { label: 'Estratégico', color: '#ef4444' },
    { label: 'Táctico', color: '#3b82f6' },
    { label: 'Operativo', color: '#22c55e' },
    { label: 'Apoyo', color: '#a855f7' },
  ];

  const colorRow = document.createElement('div');
  colorRow.style.display = 'flex';
  colorRow.style.justifyContent = 'center';
  colorRow.style.gap = '20px';
  colorRow.style.marginBottom = '10px';

  colors.forEach(({ label, color }) => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '6px';

    const dot = document.createElement('span');
    dot.style.width = '12px';
    dot.style.height = '12px';
    dot.style.borderRadius = '50%';
    dot.style.backgroundColor = color;

    const text = document.createElement('span');
    text.style.fontSize = '12px';
    text.style.color = '#4b5563';
    text.textContent = label;

    item.appendChild(dot);
    item.appendChild(text);
    colorRow.appendChild(item);
  });

  legend.appendChild(colorRow);

  // Estadísticas
  if (stats) {
    const statsRow = document.createElement('div');
    statsRow.style.textAlign = 'center';
    statsRow.style.fontSize = '11px';
    statsRow.style.color = '#6b7280';
    statsRow.textContent = `Áreas: ${stats.areas_activas}/${stats.total_areas} | Cargos: ${stats.cargos_activos}/${stats.total_cargos} | Usuarios: ${stats.total_usuarios}`;
    legend.appendChild(statsRow);
  }

  return legend;
};

/**
 * Descarga un archivo desde un data URL
 */
const downloadFile = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

/**
 * Formatea fecha para nombre de archivo
 */
const formatDateForFilename = (): string => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
};
