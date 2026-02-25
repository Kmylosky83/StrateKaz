/**
 * AvatarUploadModal - Modal para subir foto de perfil
 * Movido desde features/perfil/components/ — componente compartido
 *
 * Características:
 * - Drag & drop para subir imagen
 * - Preview de imagen seleccionada
 * - Validación de formato (JPG, PNG, WebP) y tamaño (2MB)
 * - Loading state durante upload
 * - Integración con BaseModal del Design System
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { useUploadPhoto } from '@/hooks/useUploadPhoto';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const AvatarUploadModal = ({ isOpen, onClose }: AvatarUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhotoMutation = useUploadPhoto();

  // Cleanup preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setValidationError(null);
      setDragActive(false);
    }
  }, [isOpen]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return 'Formato de imagen no válido. Use JPG, PNG o WebP';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'El tamaño de la imagen no debe superar 2MB';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setValidationError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        const error = validateFile(file);
        if (error) {
          setValidationError(error);
          setSelectedFile(null);
          setPreviewUrl(null);
          return;
        }
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setValidationError(null);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    },
    [previewUrl]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadPhotoMutation.mutateAsync(selectedFile);
      onClose();
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar foto de perfil"
      subtitle="Sube una imagen en formato JPG, PNG o WebP (máximo 2MB)"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={uploadPhotoMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadPhotoMutation.isPending}
            isLoading={uploadPhotoMutation.isPending}
          >
            {uploadPhotoMutation.isPending ? 'Subiendo...' : 'Subir foto'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Preview o Drop Zone */}
        {previewUrl ? (
          <div className="relative">
            <div className="aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 p-1.5 bg-danger-600 text-white rounded-full hover:bg-danger-700 transition-colors"
              aria-label="Eliminar imagen"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              {selectedFile?.name} ({(selectedFile!.size / 1024).toFixed(0)} KB)
            </p>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center
              transition-colors cursor-pointer
              ${
                dragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                {dragActive ? (
                  <Upload className="h-8 w-8 text-primary-500" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {dragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz click'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  JPG, PNG o WebP (máximo 2MB)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error de validación */}
        {validationError && (
          <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
            <p className="text-sm text-danger-700 dark:text-danger-400">{validationError}</p>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Recomendaciones:
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Usa una imagen cuadrada para mejores resultados</li>
            <li>• Tamaño mínimo recomendado: 200x200 píxeles</li>
            <li>• La imagen se mostrará en tu perfil y en el menú de usuario</li>
          </ul>
        </div>
      </div>
    </BaseModal>
  );
};
