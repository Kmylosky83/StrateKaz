/**
 * Componente Certificado de Recoleccion - Documento formal para Ecoaliados
 *
 * Genera un certificado formal en formato A4 que resume las recolecciones
 * de un ecoaliado en un periodo determinado.
 *
 * Firmado por el Representante Legal: Rafael Hernan Ramirez Mosquera
 */
import { forwardRef } from 'react';
import type { CertificadoRecoleccionData } from '../types/recoleccion.types';

interface CertificadoRecoleccionProps {
  certificado: CertificadoRecoleccionData;
}

export const CertificadoRecoleccion = forwardRef<HTMLDivElement, CertificadoRecoleccionProps>(
  ({ certificado }, ref) => {
    // Logo con fallback a default
    const logoUrl = certificado.empresa.logo || '/logo-dark.png';

    const formatFecha = (fecha: string) => {
      const date = new Date(fecha);
      const opciones: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return date.toLocaleDateString('es-CO', opciones);
    };

    const formatFechaCorta = (fecha: string) => {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    return (
      <div
        ref={ref}
        className="bg-white text-black p-6 font-sans"
        style={{
          width: '210mm',
          maxHeight: '297mm',
          fontSize: '11px',
          lineHeight: '1.4',
        }}
      >
        {/* ENCABEZADO CON LOGO - Compacto */}
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt={certificado.empresa.nombre}
              style={{ height: '50px', width: 'auto' }}
            />
            <div>
              <div className="font-bold text-base">{certificado.empresa.nombre}</div>
              <div className="text-xs text-gray-600">NIT: {certificado.empresa.nit}</div>
              <div className="text-xs text-gray-600">{certificado.empresa.direccion}</div>
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div className="font-bold text-black text-sm">{certificado.numero_certificado}</div>
            <div>{formatFecha(certificado.fecha_emision)}</div>
          </div>
        </div>

        {/* TITULO - Compacto */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold uppercase tracking-wide mb-1">
            Certificado de Recolección
          </h1>
          <h2 className="text-base font-semibold text-gray-700">
            Periodo: {certificado.periodo.descripcion}
          </h2>
          <p className="text-xs text-gray-500">
            Del {formatFechaCorta(certificado.periodo.fecha_inicio)} al{' '}
            {formatFechaCorta(certificado.periodo.fecha_fin)}
          </p>
        </div>

        {/* CUERPO DEL CERTIFICADO - Compacto */}
        <div className="mb-4 text-justify" style={{ fontSize: '11px' }}>
          <p className="mb-2">
            <strong>{certificado.empresa.nombre}</strong>, identificada con NIT{' '}
            <strong>{certificado.empresa.nit}</strong>, representada legalmente por{' '}
            <strong>{certificado.empresa.representante_legal}</strong>,
          </p>

          <p className="mb-2 text-center font-bold text-base">CERTIFICA QUE:</p>

          <p className="mb-2">
            El(la) proveedor(a) <strong>{certificado.ecoaliado.razon_social}</strong>, identificado(a)
            con <strong>{certificado.ecoaliado.documento_tipo} {certificado.ecoaliado.documento_numero}</strong>,
            domiciliado(a) en <strong>{certificado.ecoaliado.direccion}, {certificado.ecoaliado.ciudad}, {certificado.ecoaliado.departamento}</strong>,
            ha realizado entregas de Aceite de Cocina Usado (ACU) a nuestra empresa durante el periodo
            comprendido entre el <strong>{formatFecha(certificado.periodo.fecha_inicio)}</strong> y el{' '}
            <strong>{formatFecha(certificado.periodo.fecha_fin)}</strong>, según se detalla a continuación:
          </p>
        </div>

        {/* RESUMEN - Compacto en una fila */}
        <div className="bg-gray-50 border border-gray-300 rounded p-3 mb-4">
          <h3 className="font-bold text-center mb-2 text-sm">RESUMEN DEL PERIODO</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-white rounded border">
              <div className="text-xl font-bold text-primary-600">
                {certificado.resumen.total_recolecciones}
              </div>
              <div className="text-xs text-gray-600">Recolecciones</div>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <div className="text-xl font-bold text-primary-600">
                {certificado.resumen.total_kg.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg
              </div>
              <div className="text-xs text-gray-600">Total Recolectado</div>
            </div>
          </div>
        </div>

        {/* DETALLE DE RECOLECCIONES - Compacto */}
        {certificado.recolecciones.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold mb-2 text-sm">DETALLE DE RECOLECCIONES:</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">Fecha</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Voucher</th>
                  <th className="border border-gray-300 px-2 py-1 text-right">Cantidad (kg)</th>
                </tr>
              </thead>
              <tbody>
                {certificado.recolecciones.map((rec, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-2 py-1">{rec.fecha}</td>
                    <td className="border border-gray-300 px-2 py-1 font-mono" style={{ fontSize: '10px' }}>
                      {rec.codigo_voucher}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right">
                      {rec.cantidad_kg.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 font-bold">
                  <td colSpan={2} className="border border-gray-300 px-2 py-1 text-right">
                    TOTAL:
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    {certificado.resumen.total_kg.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* NOTA AMBIENTAL - Compacta */}
        <div className="bg-green-50 border border-green-200 rounded p-2 mb-4 text-xs">
          <p className="text-green-800 text-center">
            <strong>Nota:</strong> El Aceite de Cocina Usado (ACU) recolectado es procesado y reintegrado
            a la cadena productiva como sub producto, contribuyendo a la economía circular y la protección
            del medio ambiente.
          </p>
        </div>

        {/* FIRMA - Compacta */}
        <div className="mt-8">
          <p className="mb-4 text-xs">
            Se expide el presente certificado a solicitud del interesado para los fines que estime
            convenientes, en la ciudad de Cúcuta, a los {formatFecha(certificado.fecha_emision)}.
          </p>

          <div className="text-center">
            {/* Imagen de firma */}
            <div className="inline-block">
              <img
                src="/firma-repre.png"
                alt="Firma Representante Legal"
                style={{ height: '60px', width: 'auto', marginBottom: '4px' }}
              />
              <div className="border-t-2 border-gray-800 pt-1 px-12">
                <div className="font-bold text-sm">{certificado.empresa.representante_legal}</div>
                <div className="text-xs text-gray-600">Representante Legal</div>
                <div className="text-xs font-semibold">{certificado.empresa.nombre}</div>
              </div>
            </div>
          </div>
        </div>

        {/* PIE DE PAGINA - Compacto */}
        <div className="mt-4 pt-2 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>
            {certificado.empresa.direccion} | Tel: {certificado.empresa.telefono} | NIT: {certificado.empresa.nit}
          </p>
          <p className="mt-1">
            Código: {certificado.numero_certificado}
          </p>
          <p className="mt-2 text-gray-400 text-[10px]">
            Powered by Stratekaz
          </p>
        </div>
      </div>
    );
  }
);

CertificadoRecoleccion.displayName = 'CertificadoRecoleccion';
