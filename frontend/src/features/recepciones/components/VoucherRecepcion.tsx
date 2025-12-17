/**
 * Componente Voucher de Recepcion - Comprobante de Recepción en Planta
 *
 * Genera un voucher para impresion en impresora termica de 55mm (58mm)
 * Se imprime al confirmar una recepción de materia prima
 *
 * Incluye:
 * - Logo de Grasas y Huesos del Norte
 * - Código de recepción
 * - Datos del recolector
 * - Resumen de recolecciones
 * - Producto (ACU) y calidad si aplica
 * - Pesos (esperado, real, merma)
 * - Firma
 */
import { forwardRef } from 'react';
import { formatDateTime, formatWeight, formatPercentage } from '@/utils/formatters';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import type { RecepcionDetallada } from '../types/recepcion.types';

interface VoucherRecepcionProps {
  recepcion: RecepcionDetallada;
}

export const VoucherRecepcion = forwardRef<HTMLDivElement, VoucherRecepcionProps>(
  ({ recepcion }, ref) => {
    // Branding dinámico
    const { logo, companyName } = useBrandingConfig();

    // Calcular calidad promedio de las recolecciones (si tienen acidez)
    const calidadInfo = calcularCalidadPromedio(recepcion);

    return (
      <div
        ref={ref}
        className="bg-white text-black p-2 font-mono"
        style={{
          width: '55mm',
          maxWidth: '55mm',
          fontSize: '9px',
          lineHeight: '1.3',
        }}
      >
        {/* LOGO Y ENCABEZADO */}
        <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
          {/* Logo */}
          <img
            src={logo}
            alt={companyName}
            className="mx-auto mb-1"
            style={{ height: '28px', width: 'auto' }}
          />
          <div className="font-bold" style={{ fontSize: '8px' }}>
            {companyName}
          </div>
          <div style={{ fontSize: '7px' }}>NIT: 901.428.464-0</div>
          <div
            className="font-bold mt-1 py-1 bg-gray-100"
            style={{ fontSize: '9px' }}
          >
            RECEPCION EN PLANTA
          </div>
        </div>

        {/* CODIGO Y FECHA */}
        <div className="text-center font-bold border-b border-dashed border-gray-400 pb-2 mb-2">
          <div style={{ fontSize: '10px' }}>COMPROBANTE DE RECEPCION</div>
          <div className="font-bold" style={{ fontSize: '11px' }}>
            {recepcion.codigo_recepcion}
          </div>
          <div style={{ fontSize: '7px' }}>
            {formatDateTime(recepcion.fecha_confirmacion || recepcion.fecha_recepcion)}
          </div>
        </div>

        {/* RECOLECTOR */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-bold mb-1" style={{ fontSize: '8px' }}>
            RECOLECTOR:
          </div>
          <div className="font-bold">{recepcion.recolector_nombre}</div>
          <div>Doc: {recepcion.recolector_documento}</div>
        </div>

        {/* PRODUCTO Y CALIDAD */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-bold mb-1" style={{ fontSize: '8px' }}>
            PRODUCTO:
          </div>
          <div className="font-bold" style={{ fontSize: '10px' }}>
            ACU - Aceite Comestible Usado
          </div>
          {calidadInfo && (
            <div className="mt-1 py-1 text-center bg-gray-100">
              <span className="font-bold" style={{ fontSize: '10px' }}>
                Calidad: {calidadInfo.calidad}
              </span>
              {calidadInfo.acidezPromedio && (
                <span style={{ fontSize: '8px' }}>
                  {' '}({calidadInfo.acidezPromedio.toFixed(2)}% acidez)
                </span>
              )}
            </div>
          )}
        </div>

        {/* RESUMEN DE RECOLECCIONES */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-bold mb-1" style={{ fontSize: '8px' }}>
            DETALLE ({recepcion.cantidad_recolecciones} recolecciones):
          </div>
          <table className="w-full" style={{ fontSize: '8px' }}>
            <thead>
              <tr>
                <th className="text-left">Codigo</th>
                <th className="text-right">Kg</th>
              </tr>
            </thead>
            <tbody>
              {recepcion.detalles.slice(0, 8).map((detalle) => (
                <tr key={detalle.id}>
                  <td>{detalle.recoleccion_codigo}</td>
                  <td className="text-right">{formatWeight(detalle.peso_esperado_kg)}</td>
                </tr>
              ))}
              {recepcion.detalles.length > 8 && (
                <tr>
                  <td colSpan={2} className="text-center text-gray-500">
                    ... y {recepcion.detalles.length - 8} mas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PESOS */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-bold mb-1" style={{ fontSize: '8px' }}>
            PESOS:
          </div>
          <table className="w-full">
            <tbody>
              <tr>
                <td>Peso Esperado:</td>
                <td className="text-right">{formatWeight(recepcion.peso_esperado_kg)}</td>
              </tr>
              <tr className="font-bold" style={{ fontSize: '10px' }}>
                <td>Peso Real:</td>
                <td className="text-right">{formatWeight(recepcion.peso_real_kg || 0)}</td>
              </tr>
              <tr style={{ color: '#dc2626' }}>
                <td>Merma:</td>
                <td className="text-right">
                  {formatWeight(recepcion.merma_kg)} ({formatPercentage(recepcion.porcentaje_merma)})
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TICKET BASCULA */}
        {recepcion.numero_ticket_bascula && (
          <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
            <div style={{ fontSize: '8px' }}>
              <span className="font-bold">Ticket Bascula:</span> {recepcion.numero_ticket_bascula}
            </div>
          </div>
        )}

        {/* OBSERVACIONES */}
        {recepcion.observaciones_merma && (
          <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
            <div className="font-bold mb-1" style={{ fontSize: '8px' }}>
              OBSERVACIONES:
            </div>
            <div style={{ fontSize: '7px' }}>{recepcion.observaciones_merma}</div>
          </div>
        )}

        {/* FIRMAS */}
        <div className="pt-4 mt-2">
          <div className="flex justify-between" style={{ fontSize: '7px' }}>
            <div className="text-center flex-1">
              <div className="border-t border-gray-400 pt-1 mx-2">
                Recolector
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="border-t border-gray-400 pt-1 mx-2">
                Recibido por
              </div>
            </div>
          </div>
        </div>

        {/* RECIBIDO POR */}
        <div className="text-center mt-2" style={{ fontSize: '8px' }}>
          <div>
            <span className="font-bold">Recibido por:</span> {recepcion.recibido_por_nombre}
          </div>
        </div>

        {/* PIE DE PAGINA */}
        <div className="text-center mt-3" style={{ fontSize: '7px' }}>
          <div className="font-bold">*** COPIA PLANTA ***</div>
          <div>Estado: {recepcion.estado_display}</div>
          <div className="mt-1" style={{ fontSize: '6px' }}>
            www.grasasyhuesos.com
          </div>
        </div>
      </div>
    );
  }
);

VoucherRecepcion.displayName = 'VoucherRecepcion';

/**
 * Calcula la calidad promedio basándose en las recolecciones
 * Actualmente asume ACU, pero puede extenderse para otros productos
 */
function calcularCalidadPromedio(recepcion: RecepcionDetallada): {
  calidad: string;
  acidezPromedio: number | null;
} | null {
  // Por ahora retornamos null - en el futuro se puede calcular
  // basándose en los campos porcentaje_acidez de las recolecciones
  // cuando se implemente completamente el flujo

  // Placeholder: revisar si hay datos de acidez disponibles
  // en las observaciones o en campos futuros

  return null;
}
