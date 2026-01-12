/**
 * Alerta de cambios pendientes con botones de acción
 */
import { AlertCircle, RotateCcw, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import type { ChangesAlertProps } from './types';

export const ChangesAlert = ({ hasChanges, onSave, onReset, isSaving }: ChangesAlertProps) => {
  if (!hasChanges) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg',
        'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
      )}
    >
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">Hay cambios sin guardar</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onReset} disabled={isSaving}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Descartar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
};
