/**
 * Componente ImageUpload para subir/previsualizar imagenes en el TenantFormModal.
 */
import { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/common/Button';

export interface ImageUploadProps {
  label: string;
  value: File | null;
  previewUrl?: string | null;
  onChange: (file: File | null) => void;
  onClear?: () => void;
  accept?: string;
  hint?: string;
  darkPreview?: boolean;
}

export const ImageUpload = ({
  label,
  value,
  previewUrl,
  onChange,
  onClear,
  accept = 'image/*',
  hint,
  darkPreview = false,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      setCleared(false);
      return () => URL.revokeObjectURL(url);
    } else if (previewUrl && !cleared) {
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }
  }, [value, previewUrl, cleared]);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
    if (file) setCleared(false);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
    setPreview(null);
    setCleared(true);
    onClear?.();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative inline-block">
          <div
            className={`p-3 rounded-lg border-2 border-dashed ${
              darkPreview
                ? 'bg-gray-800 border-gray-600'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
            }`}
          >
            <img src={preview} alt={label} className="h-14 max-w-[150px] object-contain" />
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 !p-1 !min-h-0 rounded-full"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          onClick={handleClick}
          className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Upload className="h-5 w-5 text-gray-400 mb-1" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Click para subir</span>
        </Button>
      )}

      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
};
