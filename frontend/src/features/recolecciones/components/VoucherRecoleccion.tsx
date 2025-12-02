/**
 * Componente Voucher de Recoleccion
 *
 * Genera un voucher para impresion en impresora termica (80mm)
 * Incluye:
 * - Datos de la empresa
 * - Datos del ecoaliado
 * - Detalle de la recoleccion
 * - Totales
 */
import { forwardRef } from 'react';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import type { VoucherData } from '../types/recoleccion.types';

interface VoucherRecoleccionProps {
  voucher: VoucherData;
}

export const VoucherRecoleccion = forwardRef<HTMLDivElement, VoucherRecoleccionProps>(
  ({ voucher }, ref) => {

    return (
      <div
        ref={ref}
        className="bg-white text-black p-4 font-mono text-xs"
        style={{ width: '80mm', maxWidth: '80mm' }}
      >
        {/* ENCABEZADO EMPRESA */}
        <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-bold text-sm">{voucher.empresa.nombre}</div>
          <div>NIT: {voucher.empresa.nit}</div>
          <div>{voucher.empresa.direccion}</div>
          <div>Tel: {voucher.empresa.telefono}</div>
        </div>

        {/* TITULO VOUCHER */}
        <div className="text-center font-bold border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="text-sm">COMPROBANTE DE RECOLECCION</div>
          <div className="text-lg">{voucher.codigo_voucher}</div>
          <div className="text-[10px]">{formatDateTime(voucher.fecha_recoleccion)}</div>
        </div>

        {/* DATOS ECOALIADO */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-bold mb-1">PROVEEDOR:</div>
          <div>{voucher.ecoaliado_info.razon_social}</div>
          <div>NIT: {voucher.ecoaliado_info.nit}</div>
          <div>Cod: {voucher.ecoaliado_info.codigo}</div>
          {voucher.ecoaliado_info.direccion && (
            <div>{voucher.ecoaliado_info.direccion}</div>
          )}
          <div>{voucher.ecoaliado_info.ciudad}</div>
        </div>

        {/* DETALLE RECOLECCION */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-bold mb-1">DETALLE:</div>
          <table className="w-full">
            <tbody>
              <tr>
                <td>Cantidad:</td>
                <td className="text-right font-bold">
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

        {/* TOTALES */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <table className="w-full">
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td className="text-right">{formatCurrency(voucher.detalle.subtotal)}</td>
              </tr>
              <tr>
                <td>IVA:</td>
                <td className="text-right">{formatCurrency(voucher.detalle.iva)}</td>
              </tr>
              <tr className="font-bold text-sm">
                <td>TOTAL:</td>
                <td className="text-right">{formatCurrency(voucher.detalle.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TOTAL EN LETRAS */}
        <div className="text-center text-[10px] border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-bold">SON:</div>
          <div>{voucher.detalle.total_letras}</div>
        </div>

        {/* RECOLECTOR */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <div>Recolector: {voucher.recolector_nombre}</div>
        </div>

        {/* FIRMAS */}
        <div className="mt-8 pt-4">
          <div className="flex justify-between">
            <div className="text-center flex-1">
              <div className="border-t border-black w-24 mx-auto mb-1"></div>
              <div className="text-[10px]">ENTREGA</div>
            </div>
            <div className="text-center flex-1">
              <div className="border-t border-black w-24 mx-auto mb-1"></div>
              <div className="text-[10px]">RECIBE</div>
            </div>
          </div>
        </div>

        {/* PIE DE PAGINA */}
        <div className="text-center mt-4 text-[10px]">
          <div>*** ORIGINAL ***</div>
          <div>Gracias por su preferencia</div>
        </div>
      </div>
    );
  }
);

VoucherRecoleccion.displayName = 'VoucherRecoleccion';
