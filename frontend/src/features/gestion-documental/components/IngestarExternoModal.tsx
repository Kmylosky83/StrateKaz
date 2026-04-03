/**
 * Modal para ingestar documentos PDF externos al sistema.
 * Sube el PDF, crea un Documento en BORRADOR, y dispara OCR async.
 *
 * Opcionalmente permite asociar una plantilla para alinear el documento
 * al formato estándar de StrateKaz en la edición posterior.
 */
import { useState, useCallback, useRef, useMemo } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Spinner } from '@/components/common';
import { Input, Select } from '@/components/forms';
import { Upload, FileText, X } from 'lucide-react';
import {
  useTiposDocumento,
  usePlantillasDocumento,
  useIngestarExterno,
} from '../hooks/useGestionDocumental';
import { useAreas } from '@/features/gestion-estrategica/hooks/useAreas';
import type { ClasificacionDocumento } from '../types/gestion-documental.types';

interface IngestarExternoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CLASIFICACION_OPTIONS = [
  { value: 'PUBLICO', label: 'Público' },
  { value: 'INTERNO', label: 'Interno' },
  { value: 'CONFIDENCIAL', label: 'Confidencial' },
  { value: 'RESTRINGIDO', label: 'Restringido' },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function IngestarExternoModal({ isOpen, onClose }: IngestarExternoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<string>('');
  const [plantillaId, setPlantillaId] = useState<string>('');
  const [clasificacion, setClasificacion] = useState<ClasificacionDocumento>('INTERNO');
  const [areasAplicacion, setAreasAplicacion] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tipos = [] } = useTiposDocumento();
  const { data: plantillas = [] } = usePlantillasDocumento({ estado: 'ACTIVA' });
  const { data: procesosData } = useAreas({ is_active: true });
  const ingestarMutation = useIngestarExterno();

  const tipoOptions = tipos.map((t) => ({
    value: String(t.id),
    label: `${t.codigo} - ${t.nombre}`,
  }));

  // Filtrar plantillas por tipo de documento seleccionado
  const filteredPlantillas = useMemo(() => {
    if (!tipoDocumento) return [];
    return (
      plantillas as {
        id: number;
        nombre: string;
        tipo_documento?: { id: number } | number;
        tipo_plantilla?: string;
      }[]
    ).filter((p) => {
      const tipoId = typeof p.tipo_documento === 'object' ? p.tipo_documento?.id : p.tipo_documento;
      return tipoId === Number(tipoDocumento);
    });
  }, [plantillas, tipoDocumento]);

  const validateFile = useCallback((f: File): string => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      return 'Solo se aceptan archivos PDF';
    }
    if (f.size > MAX_FILE_SIZE) {
      return 'El archivo excede el tamaño máximo de 50 MB';
    }
    return '';
  }, []);

  const handleFileSelect = useCallback(
    (f: File) => {
      const error = validateFile(f);
      if (error) {
        setFileError(error);
        return;
      }
      setFileError('');
      setFile(f);
      if (!titulo) {
        // Auto-fill título desde nombre del archivo (sin extensión)
        const name = f.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
        setTitulo(name);
      }
    },
    [titulo, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect]
  );

  const handleSubmit = async () => {
    if (!file || !titulo.trim() || !tipoDocumento) return;

    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('titulo', titulo.trim());
    formData.append('tipo_documento', tipoDocumento);
    formData.append('clasificacion', clasificacion);
    if (areasAplicacion.length > 0) {
      formData.append('areas_aplicacion', JSON.stringify(areasAplicacion));
    }
    if (plantillaId) {
      formData.append('plantilla', plantillaId);
    }

    await ingestarMutation.mutateAsync(formData);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setTitulo('');
    setTipoDocumento('');
    setPlantillaId('');
    setClasificacion('INTERNO');
    setAreasAplicacion([]);
    setFileError('');
    setDragOver(false);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ingestar Documento Externo"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || !titulo.trim() || !tipoDocumento || ingestarMutation.isPending}
          >
            {ingestarMutation.isPending ? (
              <>
                <Spinner size="sm" /> Subiendo...
              </>
            ) : (
              'Ingestar y Procesar OCR'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Dropzone */}
        <div
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600'
          } ${file ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={24} className="text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFileError('');
                }}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div>
              <Upload size={40} className="mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Arrastra un archivo PDF aquí o{' '}
                <button
                  type="button"
                  className="text-blue-600 underline hover:text-blue-700"
                  onClick={() => inputRef.current?.click()}
                >
                  selecciona uno
                </button>
              </p>
              <p className="mt-1 text-xs text-gray-400">Solo PDF, máximo 50 MB</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
              e.target.value = '';
            }}
          />
        </div>
        {fileError && <p className="text-sm text-red-500">{fileError}</p>}

        {/* Formulario */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Título del documento *"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nombre del documento"
            />
          </div>
          <Select
            label="Tipo de documento *"
            value={tipoDocumento}
            onChange={(e) => {
              setTipoDocumento(e.target.value);
              setPlantillaId(''); // Reset plantilla al cambiar tipo
            }}
            options={tipoOptions}
            placeholder="Seleccionar tipo..."
          />
          <Select
            label="Clasificación"
            value={clasificacion}
            onChange={(e) => setClasificacion(e.target.value as ClasificacionDocumento)}
            options={CLASIFICACION_OPTIONS}
          />
          <div className="sm:col-span-2">
            <Select
              label="Proceso"
              value={areasAplicacion[0] || ''}
              onChange={(e) => {
                setAreasAplicacion(e.target.value ? [e.target.value] : []);
              }}
            >
              <option value="">Sin proceso asignado</option>
              {(procesosData?.results || []).map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.tipo_display})
                </option>
              ))}
            </Select>
          </div>
          {filteredPlantillas.length > 0 && (
            <div className="sm:col-span-2">
              <Select
                label="Plantilla (opcional)"
                value={plantillaId}
                onChange={(e) => setPlantillaId(e.target.value)}
              >
                <option value="">Sin plantilla — solo ingestar</option>
                {filteredPlantillas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                    {p.tipo_plantilla === 'FORMULARIO' ? ' (Formulario)' : ''}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Al asociar una plantilla, podrá alinear el documento al formato estándar en la
                edición posterior.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          El texto del PDF se extraerá automáticamente en segundo plano. Recibirá una notificación
          cuando el proceso finalice.
        </p>
      </div>
    </BaseModal>
  );
}
