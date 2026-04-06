/**
 * AdoptarPdfModal — Camino B: Adoptar PDF externo al ciclo de firmas.
 *
 * Sube un PDF existente, asigna código StrateKaz (TIPO-PROCESO-NNN),
 * guarda código legacy opcional, y crea documento BORRADOR listo para
 * asignar firmantes y entrar al ciclo de aprobación → publicación.
 *
 * Solo acepta PDF. No se acepta Word ni ningún otro formato.
 */
import { useState, useCallback, useRef } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Spinner } from '@/components/common';
import { Input, Select } from '@/components/forms';
import { Upload, FileText, X, FileCheck } from 'lucide-react';
import { useTiposDocumento, useAdoptarPdf } from '../hooks/useGestionDocumental';
import { useAreas } from '@/features/gestion-estrategica/hooks/useAreas';
import type { ClasificacionDocumento } from '../types/gestion-documental.types';

interface AdoptarPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CLASIFICACION_OPTIONS = [
  { value: 'PUBLICO', label: 'Público' },
  { value: 'INTERNO', label: 'Interno' },
  { value: 'CONFIDENCIAL', label: 'Confidencial' },
  { value: 'RESTRINGIDO', label: 'Restringido' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function AdoptarPdfModal({ isOpen, onClose }: AdoptarPdfModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<string>('');
  const [proceso, setProceso] = useState<string>('');
  const [clasificacion, setClasificacion] = useState<ClasificacionDocumento>('INTERNO');
  const [codigoLegacy, setCodigoLegacy] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tipos = [] } = useTiposDocumento();
  const { data: procesosData } = useAreas({ is_active: true });
  const adoptarMutation = useAdoptarPdf();

  const procesos = procesosData?.results ?? [];

  // Solo tipos con categoría DOCUMENTO (normativos, no formularios)
  const tiposDocumento = tipos.filter((t) => !t.categoria || t.categoria === 'DOCUMENTO');

  const resetForm = useCallback(() => {
    setFile(null);
    setTitulo('');
    setTipoDocumento('');
    setProceso('');
    setClasificacion('INTERNO');
    setCodigoLegacy('');
    setFileError('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const validateFile = useCallback((f: File): boolean => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Solo se aceptan archivos PDF. Convierta su documento a PDF antes de subirlo.');
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError('El archivo excede el tamaño máximo de 10 MB');
      return false;
    }
    if (f.type && f.type !== 'application/pdf') {
      setFileError('Solo se aceptan archivos PDF.');
      return false;
    }
    setFileError('');
    return true;
  }, []);

  const handleFileSelect = useCallback(
    (f: File) => {
      if (validateFile(f)) {
        setFile(f);
        if (!titulo) {
          setTitulo(f.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' '));
        }
      }
    },
    [validateFile, titulo]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleSubmit = async () => {
    if (!file || !tipoDocumento || !proceso || !titulo.trim()) return;

    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('titulo', titulo.trim());
    formData.append('tipo_documento', tipoDocumento);
    formData.append('proceso', proceso);
    formData.append('clasificacion', clasificacion);
    if (codigoLegacy.trim()) {
      formData.append('codigo_legacy', codigoLegacy.trim());
    }

    try {
      await adoptarMutation.mutateAsync(formData);
      handleClose();
    } catch {
      // Error manejado por el hook
    }
  };

  const canSubmit = file && titulo.trim() && tipoDocumento && proceso && !adoptarMutation.isPending;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Adoptar documento PDF" size="lg">
      <div className="space-y-4">
        {/* Zona de carga */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
              : file
                ? 'border-green-300 bg-green-50 dark:bg-green-900/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileCheck className="w-8 h-8 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFileError('');
                }}
                className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Arrastre un archivo PDF aquí o{' '}
                <button
                  type="button"
                  className="text-primary-600 hover:underline font-medium"
                  onClick={() => inputRef.current?.click()}
                >
                  seleccione uno
                </button>
              </p>
              <p className="text-xs text-gray-400 mt-1">Solo PDF, máximo 10 MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
              e.target.value = '';
            }}
          />
        </div>
        {fileError && <p className="text-sm text-red-600 dark:text-red-400">{fileError}</p>}

        {/* Campos del documento */}
        <Input
          label="Título del documento"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: Procedimiento de trabajo seguro en alturas"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de documento"
            value={tipoDocumento}
            onChange={(e) => setTipoDocumento(e.target.value)}
            required
          >
            <option value="">Seleccione tipo</option>
            {tiposDocumento.map((t) => (
              <option key={t.id} value={t.id}>
                {t.codigo} — {t.nombre}
              </option>
            ))}
          </Select>

          <Select
            label="Proceso"
            value={proceso}
            onChange={(e) => setProceso(e.target.value)}
            required
          >
            <option value="">Seleccione proceso</option>
            {procesos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Clasificación"
            value={clasificacion}
            onChange={(e) => setClasificacion(e.target.value as ClasificacionDocumento)}
          >
            {CLASIFICACION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>

          <Input
            label="Código original (opcional)"
            value={codigoLegacy}
            onChange={(e) => setCodigoLegacy(e.target.value)}
            placeholder="Ej: PR-FT-SG-002"
          />
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-3 text-sm text-blue-700 dark:text-blue-300">
          <FileText className="inline w-4 h-4 mr-1 -mt-0.5" />
          Al adoptar, el sistema asigna un código StrateKaz automáticamente. Puede asignar firmantes
          después desde la tabla de documentos.
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {adoptarMutation.isPending ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Adoptando...
            </>
          ) : (
            'Adoptar documento'
          )}
        </Button>
      </div>
    </BaseModal>
  );
}
