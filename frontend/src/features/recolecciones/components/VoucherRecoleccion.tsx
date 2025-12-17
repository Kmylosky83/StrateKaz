/**
 * Componente Voucher de Recoleccion - Entrega a Ecoaliados
 *
 * Genera un voucher para impresion en impresora termica de 55mm (58mm)
 * Se entrega al ecoaliado como comprobante de la recoleccion realizada
 *
 * Incluye:
 * - Logo de Grasas y Huesos del Norte
 * - Unidad EcoNorte
 * - Datos del ecoaliado
 * - Detalle de la recoleccion
 * - Totales y firmas
 */
import { forwardRef } from 'react';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import type { VoucherData } from '../types/recoleccion.types';

interface VoucherRecoleccionProps {
  voucher: VoucherData;
}

export const VoucherRecoleccion = forwardRef<HTMLDivElement, VoucherRecoleccionProps>(
  ({ voucher }, ref) => {
    // Logo con fallback a default
    const logoUrl = voucher.empresa.logo || '/logo-dark.png';

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
            src={logoUrl}
            alt={voucher.empresa.nombre}
            className="mx-auto mb-1"
            style={{ height: '28px', width: 'auto' }}
          />
          <div className="font-bold" style={{ fontSize: '8px' }}>
            {voucher.empresa.nombre}
          </div>
          <div style={{ fontSize: '7px' }}>NIT: {voucher.empresa.nit}</div>
          <div
            className="font-bold mt-1 py-1 bg-gray-100"
            style={{ fontSize: '9px' }}
          >
            UNIDAD ECONORTE
          </div>
        </div>

        {/* TITULO VOUCHER */}
        <div className="text-center font-bold border-b border-dashed border-gray-400 pb-2 mb-2">
          <div style={{ fontSize: '10px' }}>COMPROBANTE DE COMPRA</div>
          <div className="font-bold" style={{ fontSize: '11px' }}>
            {voucher.codigo_voucher}
          </div>
          <div style={{ fontSize: '7px' }}>{formatDateTime(voucher.fecha_recoleccion)}</div>
        </div>

        {/* DATOS ECOALIADO/PROVEEDOR */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-bold mb-1" style={{ fontSize: '8px' }}>
            PROVEEDOR:
          </div>
          <div className="font-bold">{voucher.ecoaliado_info.razon_social}</div>
          <div>NIT: {voucher.ecoaliado_info.nit}</div>
          <div>Cod: {voucher.ecoaliado_info.codigo}</div>
          <div>{voucher.ecoaliado_info.ciudad}</div>
        </div>

        {/* DETALLE RECOLECCION */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-bold mb-1" style={{ fontSize: '8px' }}>
            DETALLE:
          </div>
          <table className="w-full">
            <tbody>
              <tr>
                <td>Cantidad:</td>
                <td className="text-right font-bold" style={{ fontSize: '10px' }}>
                  {voucher.detalle.cantidad_kg.toLocaleString('es-CO')} kg
                </td>
              </tr>
              <tr>
                <td>Precio/kg:</td>
                <td className="text-right">{formatCurrency(voucher.detalle.precio_kg)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TOTAL */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <table className="w-full">
            <tbody>
              <tr className="font-bold" style={{ fontSize: '11px' }}>
                <td>TOTAL:</td>
                <td className="text-right">{formatCurrency(voucher.detalle.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TOTAL EN LETRAS */}
        <div
          className="text-center border-b border-dashed border-gray-400 pb-2 mb-2"
          style={{ fontSize: '7px' }}
        >
          <div className="font-bold">SON:</div>
          <div>{voucher.detalle.total_letras}</div>
        </div>

        {/* RECOLECTOR */}
        <div className="pb-2 mb-2" style={{ fontSize: '8px' }}>
          <div>
            <span className="font-bold">Recolector:</span> {voucher.recolector_nombre}
          </div>
        </div>

        {/* PIE DE PAGINA */}
        <div className="text-center mt-3" style={{ fontSize: '7px' }}>
          <div className="font-bold">*** ORIGINAL CLIENTE ***</div>
          <div>Conserve este comprobante</div>
          <div className="mt-1" style={{ fontSize: '6px' }}>
            www.grasasyhuesos.com
          </div>
        </div>
      </div>
    );
  }
);

VoucherRecoleccion.displayName = 'VoucherRecoleccion';
