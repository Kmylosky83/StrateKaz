# Guía de Implementación Frontend - Workflow de Firmas Digitales

## 📦 Instalación de Dependencias

```bash
npm install react-signature-canvas
npm install diff
npm install date-fns
npm install recharts  # Para gráficos de estadísticas
```

## 🎨 Componentes Principales

### 1. Modal de Firma Digital

```tsx
// components/FirmaDigitalModal.tsx
import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Trash2, Save } from 'lucide-react';
import { useFirmaDigital } from '../hooks/useFirmaDigital';

interface FirmaDigitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  firmaId: number;
  rolFirma: string;
  documentoNombre: string;
  onSuccess: () => void;
}

export const FirmaDigitalModal: React.FC<FirmaDigitalModalProps> = ({
  isOpen,
  onClose,
  firmaId,
  rolFirma,
  documentoNombre,
  onSuccess
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [observaciones, setObservaciones] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);
  const { firmarDocumento, loading, error } = useFirmaDigital();

  if (!isOpen) return null;

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Por favor, firme antes de guardar');
      return;
    }

    try {
      const firmaBase64 = sigCanvas.current.toDataURL('image/png');
      await firmarDocumento(firmaId, firmaBase64, observaciones);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al firmar:', err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-3xl">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-2xl font-bold">Firma Digital - {rolFirma}</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Documento Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Documento:</strong> {documentoNombre}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Rol:</strong> {rolFirma}
            </p>
          </div>

          {/* Canvas de Firma */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Firma Manuscrita *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  width: 700,
                  height: 200,
                  className: 'signature-canvas'
                }}
                onBegin={() => setIsEmpty(false)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Firme con el mouse o pantalla táctil en el área superior
            </p>
          </div>

          {/* Observaciones */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Ej: Aprobado según criterios técnicos y normativos"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={handleClear}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <Trash2 className="w-4 h-4" />
            Limpiar
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-2"
              disabled={isEmpty || loading}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Firmar Documento'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .signature-canvas {
          width: 100%;
          height: 100%;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};
```

### 2. Lista de Firmas Pendientes

```tsx
// components/FirmasPendientesList.tsx
import React, { useEffect, useState } from 'react';
import { Clock, FileText, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFirmaDigital } from '../hooks/useFirmaDigital';
import { FirmaDigitalModal } from './FirmaDigitalModal';

interface FirmaPendiente {
  id: number;
  rol_firma_display: string;
  fecha_vencimiento: string;
  es_mi_turno: boolean;
  content_object: {
    id: number;
    title: string;
  };
}

export const FirmasPendientesList: React.FC = () => {
  const [firmas, setFirmas] = useState<FirmaPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [firmaSeleccionada, setFirmaSeleccionada] = useState<FirmaPendiente | null>(null);
  const { obtenerFirmasPendientes } = useFirmaDigital();

  useEffect(() => {
    cargarFirmas();
  }, []);

  const cargarFirmas = async () => {
    try {
      const response = await obtenerFirmasPendientes();
      setFirmas(response.results);
    } catch (err) {
      console.error('Error al cargar firmas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFirmar = (firma: FirmaPendiente) => {
    setFirmaSeleccionada(firma);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    cargarFirmas();
  };

  const getUrgenciaColor = (fechaVencimiento: string) => {
    const dias = differenceInDays(new Date(fechaVencimiento), new Date());

    if (dias < 0) return 'text-red-600 bg-red-50';
    if (dias <= 2) return 'text-orange-600 bg-orange-50';
    if (dias <= 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return <div className="text-center py-8">Cargando firmas pendientes...</div>;
  }

  if (firmas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>No tienes firmas pendientes</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          Firmas Pendientes ({firmas.length})
        </h3>
      </div>

      <div className="space-y-3">
        {firmas.map((firma) => {
          const diasRestantes = differenceInDays(
            new Date(firma.fecha_vencimiento),
            new Date()
          );

          return (
            <div
              key={firma.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Título del Documento */}
                  <h4 className="font-medium text-gray-900 mb-1">
                    {firma.content_object.title}
                  </h4>

                  {/* Rol de Firma */}
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Rol:</span> {firma.rol_firma_display}
                  </p>

                  {/* Vencimiento */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm px-2 py-1 rounded ${getUrgenciaColor(firma.fecha_vencimiento)}`}>
                      {diasRestantes < 0
                        ? `Vencida hace ${Math.abs(diasRestantes)} días`
                        : diasRestantes === 0
                        ? 'Vence hoy'
                        : `Vence en ${diasRestantes} días`}
                    </span>
                  </div>

                  {/* Turno */}
                  {!firma.es_mi_turno && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-700">
                        Aún no es tu turno para firmar
                      </span>
                    </div>
                  )}
                </div>

                {/* Botón de Acción */}
                <button
                  onClick={() => handleFirmar(firma)}
                  disabled={!firma.es_mi_turno}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    firma.es_mi_turno
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Firmar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Firma */}
      {firmaSeleccionada && (
        <FirmaDigitalModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          firmaId={firmaSeleccionada.id}
          rolFirma={firmaSeleccionada.rol_firma_display}
          documentoNombre={firmaSeleccionada.content_object.title}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
```

### 3. Visor de Firmas de Documento

```tsx
// components/DocumentoFirmasViewer.tsx
import React, { useEffect, useState } from 'react';
import { Check, X, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';

interface Firma {
  id: number;
  firmante_info: {
    full_name: string;
    cargo_nombre: string;
  };
  rol_firma_display: string;
  orden_firma: number;
  status: string;
  status_display: string;
  fecha_firma: string | null;
  observaciones: string | null;
  firma_manuscrita: string | null;
}

interface DocumentoFirmasViewerProps {
  contentTypeId: number;
  objectId: number;
}

export const DocumentoFirmasViewer: React.FC<DocumentoFirmasViewerProps> = ({
  contentTypeId,
  objectId
}) => {
  const [firmas, setFirmas] = useState<Firma[]>([]);
  const [resumen, setResumen] = useState({
    total: 0,
    firmadas: 0,
    pendientes: 0,
    rechazadas: 0,
    porcentaje_completado: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarFirmas();
  }, [contentTypeId, objectId]);

  const cargarFirmas = async () => {
    try {
      const response = await axios.get(
        `/api/gestion-estrategica/identidad/workflow/firmas-digitales/documento/${contentTypeId}/${objectId}/`
      );

      setFirmas(response.data.firmas);
      setResumen(response.data.resumen);
    } catch (err) {
      console.error('Error al cargar firmas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FIRMADO':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'RECHAZADO':
        return <X className="w-5 h-5 text-red-600" />;
      case 'PENDIENTE':
      case 'DELEGADO':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <User className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FIRMADO':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'RECHAZADO':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'PENDIENTE':
      case 'DELEGADO':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando firmas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Barra de Progreso */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progreso de Firmas
          </span>
          <span className="text-sm font-bold text-blue-600">
            {resumen.porcentaje_completado.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${resumen.porcentaje_completado}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-600">
          <span>Total: {resumen.total}</span>
          <span className="text-green-600">Firmadas: {resumen.firmadas}</span>
          <span className="text-yellow-600">Pendientes: {resumen.pendientes}</span>
          {resumen.rechazadas > 0 && (
            <span className="text-red-600">Rechazadas: {resumen.rechazadas}</span>
          )}
        </div>
      </div>

      {/* Lista de Firmas */}
      <div className="space-y-3">
        {firmas.map((firma) => (
          <div
            key={firma.id}
            className={`border rounded-lg p-4 ${getStatusColor(firma.status)}`}
          >
            <div className="flex items-start gap-3">
              {/* Icono de Estado */}
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(firma.status)}
              </div>

              {/* Información de Firma */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="font-medium text-sm">
                      {firma.rol_firma_display}
                    </span>
                    {firma.orden_firma > 0 && (
                      <span className="ml-2 text-xs bg-white px-2 py-0.5 rounded">
                        Orden: {firma.orden_firma}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium">
                    {firma.status_display}
                  </span>
                </div>

                <p className="text-sm mb-1">
                  <strong>Firmante:</strong> {firma.firmante_info.full_name}
                  {firma.firmante_info.cargo_nombre && (
                    <span className="text-gray-600">
                      {' '}
                      - {firma.firmante_info.cargo_nombre}
                    </span>
                  )}
                </p>

                {firma.fecha_firma && (
                  <p className="text-xs text-gray-600 mb-2">
                    <strong>Firmado:</strong>{' '}
                    {format(new Date(firma.fecha_firma), "d 'de' MMMM 'de' yyyy, HH:mm", {
                      locale: es
                    })}
                  </p>
                )}

                {firma.observaciones && (
                  <p className="text-sm mt-2 p-2 bg-white rounded">
                    <strong>Observaciones:</strong> {firma.observaciones}
                  </p>
                )}

                {/* Firma Manuscrita */}
                {firma.firma_manuscrita && (
                  <div className="mt-2">
                    <img
                      src={firma.firma_manuscrita}
                      alt="Firma manuscrita"
                      className="border border-gray-300 rounded bg-white p-2 max-w-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 4. Comparador de Versiones (Diff)

```tsx
// components/VersionDiffViewer.tsx
import React, { useState, useEffect } from 'react';
import * as Diff from 'diff';
import axios from 'axios';

interface VersionDiffViewerProps {
  versionAId: number;
  versionBId: number;
}

export const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({
  versionAId,
  versionBId
}) => {
  const [diff, setDiff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    compararVersiones();
  }, [versionAId, versionBId]);

  const compararVersiones = async () => {
    try {
      const response = await axios.post(
        '/api/gestion-estrategica/identidad/workflow/historial-versiones/comparar/',
        {
          version_a_id: versionAId,
          version_b_id: versionBId
        }
      );

      setDiff(response.data);
    } catch (err) {
      console.error('Error al comparar versiones:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Comparando versiones...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <h4 className="font-medium text-sm text-gray-700">
            Versión {diff.version_a.version_numero}
          </h4>
          <p className="text-xs text-gray-500">
            {new Date(diff.version_a.created_at).toLocaleDateString('es-CO')}
          </p>
        </div>
        <div>
          <h4 className="font-medium text-sm text-gray-700">
            Versión {diff.version_b.version_numero}
          </h4>
          <p className="text-xs text-gray-500">
            {new Date(diff.version_b.created_at).toLocaleDateString('es-CO')}
          </p>
        </div>
      </div>

      {/* Diferencias */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
          <span className="font-medium text-sm">
            {diff.cantidad_cambios} campos modificados
          </span>
        </div>

        <div className="divide-y divide-gray-200">
          {Object.entries(diff.diferencias).map(([campo, cambio]: [string, any]) => (
            <div key={campo} className="p-4">
              <div className="font-medium text-sm text-gray-700 mb-2">{campo}</div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valor Anterior */}
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <div className="text-xs text-red-700 font-medium mb-1">
                    Anterior
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">
                    {cambio.anterior === null
                      ? '(vacío)'
                      : typeof cambio.anterior === 'object'
                      ? JSON.stringify(cambio.anterior, null, 2)
                      : String(cambio.anterior)}
                  </div>
                </div>

                {/* Valor Actual */}
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="text-xs text-green-700 font-medium mb-1">
                    Actual
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">
                    {cambio.actual === null
                      ? '(vacío)'
                      : typeof cambio.actual === 'object'
                      ? JSON.stringify(cambio.actual, null, 2)
                      : String(cambio.actual)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## 🎯 Hooks Personalizados

### useFirmaDigital

```tsx
// hooks/useFirmaDigital.ts
import { useState } from 'react';
import axios from 'axios';

const API_BASE = '/api/gestion-estrategica/identidad/workflow';

export const useFirmaDigital = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firmarDocumento = async (
    firmaId: number,
    firmaBase64: string,
    observaciones?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE}/firmas-digitales/${firmaId}/firmar/`,
        {
          firma_base64: firmaBase64,
          observaciones
        }
      );

      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al firmar documento';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const rechazarFirma = async (firmaId: number, motivo: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE}/firmas-digitales/${firmaId}/rechazar/`,
        { motivo }
      );

      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al rechazar firma';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const delegarFirma = async (
    firmaId: number,
    nuevoFirmanteId: number,
    motivo: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE}/firmas-digitales/${firmaId}/delegar/`,
        {
          nuevo_firmante_id: nuevoFirmanteId,
          motivo
        }
      );

      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al delegar firma';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const obtenerFirmasPendientes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_BASE}/firmas-digitales/mis-firmas-pendientes/`
      );

      return response.data;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || 'Error al obtener firmas pendientes';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const verificarIntegridad = async (firmaId: number) => {
    try {
      const response = await axios.get(
        `${API_BASE}/firmas-digitales/${firmaId}/verificar-integridad/`
      );

      return response.data;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || 'Error al verificar integridad';
      throw new Error(errorMsg);
    }
  };

  return {
    loading,
    error,
    firmarDocumento,
    rechazarFirma,
    delegarFirma,
    obtenerFirmasPendientes,
    verificarIntegridad
  };
};
```

## 🚀 Ejemplo de Página Completa

```tsx
// pages/PoliticaDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FileText, Users, Clock, History } from 'lucide-react';
import { DocumentoFirmasViewer } from '../components/DocumentoFirmasViewer';
import { FirmasPendientesList } from '../components/FirmasPendientesList';

export const PoliticaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [politica, setPolitica] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState<'contenido' | 'firmas' | 'historial'>('contenido');

  useEffect(() => {
    cargarPolitica();
  }, [id]);

  const cargarPolitica = async () => {
    try {
      const response = await axios.get(
        `/api/gestion-estrategica/identidad/politicas-especificas/${id}/`
      );

      setPolitica(response.data);
    } catch (err) {
      console.error('Error al cargar política:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando política...</div>;
  }

  if (!politica) {
    return <div className="text-center py-8">Política no encontrada</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold">{politica.title}</h1>
            </div>
            <p className="text-sm text-gray-600">
              Código: {politica.code} | Versión: {politica.version}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              politica.status === 'VIGENTE'
                ? 'bg-green-100 text-green-800'
                : politica.status === 'EN_REVISION'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {politica.status_display}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setTabActiva('contenido')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              tabActiva === 'contenido'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contenido
            </div>
          </button>

          <button
            onClick={() => setTabActiva('firmas')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              tabActiva === 'firmas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Firmas
            </div>
          </button>

          <button
            onClick={() => setTabActiva('historial')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              tabActiva === 'historial'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Historial
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {tabActiva === 'contenido' && (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: politica.content }} />
          </div>
        )}

        {tabActiva === 'firmas' && (
          <DocumentoFirmasViewer contentTypeId={45} objectId={parseInt(id!)} />
        )}

        {tabActiva === 'historial' && (
          <div>Historial de versiones (por implementar)</div>
        )}
      </div>
    </div>
  );
};
```

## ✅ Checklist de Implementación Frontend

- [ ] Instalar dependencias (react-signature-canvas, diff, date-fns)
- [ ] Crear componente CanvasFirma
- [ ] Crear modal FirmaDigitalModal
- [ ] Crear lista FirmasPendientesList
- [ ] Crear visor DocumentoFirmasViewer
- [ ] Crear comparador VersionDiffViewer
- [ ] Implementar hook useFirmaDigital
- [ ] Configurar rutas para página de políticas
- [ ] Integrar notificaciones in-app
- [ ] Agregar manejo de errores
- [ ] Pruebas de usuario (UAT)

---

**Contacto**: soporte@stratekaz.com
