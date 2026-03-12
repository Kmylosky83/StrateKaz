/**
 * FormBuilder - Constructor visual de formularios dinamicos
 *
 * Generico y reutilizable — no acoplado a GD.
 * Layout 3 columnas: Palette | FieldList | Editor/Preview
 *
 * @example
 * <FormBuilder
 *   campos={localCampos}
 *   onCamposChange={setLocalCampos}
 *   showPreview
 * />
 */
import { useState, useCallback } from 'react';
import { Eye, Settings2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { FieldPalette } from './FieldPalette';
import { FieldList } from './FieldList';
import { FieldEditor } from './FieldEditor';
import { FormPreview } from './FormPreview';
import { createEmptyCampo, type CampoFormulario, type TipoCampoFormulario } from './types';

export interface FormBuilderProps {
  campos: Partial<CampoFormulario>[];
  onCamposChange: (campos: Partial<CampoFormulario>[]) => void;
  readOnly?: boolean;
  showPreview?: boolean;
}

type RightPanel = 'editor' | 'preview';

export function FormBuilder({
  campos,
  onCamposChange,
  readOnly = false,
  showPreview = true,
}: FormBuilderProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>('editor');

  const selectedCampo = selectedIndex !== null ? campos[selectedIndex] : null;

  // ==================== HANDLERS ====================

  const handleAddField = useCallback(
    (tipo: TipoCampoFormulario) => {
      const newCampo = createEmptyCampo(tipo, campos.length);
      const updated = [...campos, newCampo];
      onCamposChange(updated);
      setSelectedIndex(updated.length - 1);
      setRightPanel('editor');
    },
    [campos, onCamposChange]
  );

  const handleRemoveField = useCallback(
    (index: number) => {
      const updated = campos.filter((_, i) => i !== index).map((c, i) => ({ ...c, orden: i }));
      onCamposChange(updated);
      if (selectedIndex === index) {
        setSelectedIndex(null);
      } else if (selectedIndex !== null && selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1);
      }
    },
    [campos, onCamposChange, selectedIndex]
  );

  const handleUpdateField = useCallback(
    (updatedCampo: Partial<CampoFormulario>) => {
      if (selectedIndex === null) return;
      const updated = [...campos];
      updated[selectedIndex] = updatedCampo;
      onCamposChange(updated);
    },
    [campos, onCamposChange, selectedIndex]
  );

  const handleReorder = useCallback(
    (reordered: Partial<CampoFormulario>[]) => {
      onCamposChange(reordered);
    },
    [onCamposChange]
  );

  // ==================== RENDER ====================

  return (
    <div className="flex h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Left: Palette */}
      {!readOnly && (
        <div className="w-52 shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-2">
          <FieldPalette onAddField={handleAddField} disabled={readOnly} />
        </div>
      )}

      {/* Center: Field List */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-gray-700">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Campos ({campos.length})
          </p>
        </div>
        <FieldList
          campos={campos}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onReorder={handleReorder}
          onRemove={handleRemoveField}
          disabled={readOnly}
        />
      </div>

      {/* Right: Editor or Preview */}
      <div className="w-80 shrink-0 flex flex-col min-w-0">
        {/* Toggle bar */}
        {showPreview && (
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setRightPanel('editor')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                rightPanel === 'editor'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Propiedades
            </button>
            <button
              type="button"
              onClick={() => setRightPanel('preview')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                rightPanel === 'preview'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              Vista previa
            </button>
          </div>
        )}

        {/* Panel content */}
        <div className="flex-1 overflow-hidden">
          {rightPanel === 'editor' ? (
            selectedCampo ? (
              <FieldEditor campo={selectedCampo} onChange={handleUpdateField} allCampos={campos} />
            ) : (
              <div className="flex items-center justify-center h-full text-center p-4">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Selecciona un campo para editar sus propiedades
                </p>
              </div>
            )
          ) : (
            <FormPreview campos={campos} />
          )}
        </div>
      </div>
    </div>
  );
}
