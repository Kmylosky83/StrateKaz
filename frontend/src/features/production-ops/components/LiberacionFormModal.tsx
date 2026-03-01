/**
 * Modal de formulario para Liberación de Producto Terminado (Control de Calidad)
 * Production Ops - StrateKaz SGI
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Spinner } from '@/components/common';
import { Select, Textarea } from '@/components/forms';
import { useCreateLiberacion, useStocks } from '../hooks/useProductionOps';
import type { Liberacion, CreateLiberacionDTO } from '../types/production-ops.types';
import { useAuthStore } from '@/store/authStore';

interface LiberacionFormModalProps {
  item: Liberacion | null;
  isOpen: boolean;
  onClose: () => void;
}

interface LiberacionFormData {
  stock_producto: number;
  observaciones: string;
}

const INITIAL_FORM: LiberacionFormData = {
  stock_producto: 0,
  observaciones: '',
};

export default function LiberacionFormModal({ item, isOpen, onClose }: LiberacionFormModalProps) {
  const [formData, setFormData] = useState<LiberacionFormData>(INITIAL_FORM);
  const user = useAuthStore((s) => s.user);

  const createMutation = useCreateLiberacion();

  const { data: stocksData } = useStocks({ page_size: 100 });

  const stocks = useMemo(() => {
    const raw = stocksData;
    return Array.isArray(raw) ? raw : (raw?.results ?? []);
  }, [stocksData]);

  const isLoading = createMutation.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        stock_producto: item.stock_producto || 0,
        observaciones: item.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [item, isOpen]);

  const handleChange = (field: keyof LiberacionFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateLiberacionDTO = {
      stock_producto: formData.stock_producto,
      solicitado_por: user?.id || 0,
    };

    createMutation.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Detalle de Liberación' : 'Nueva Solicitud de Liberación'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stock a liberar */}
        <Select
          label="Lote de Producto *"
          value={String(formData.stock_producto || '')}
          onChange={(e) => handleChange('stock_producto', Number(e.target.value))}
          required
          disabled={!!item}
        >
          <option value="">Seleccione un lote...</option>
          {stocks.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.codigo_lote_pt} - {s.producto_nombre}
            </option>
          ))}
        </Select>

        {/* Info del item existente */}
        {item && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Resultado:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {item.resultado}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Solicitado por:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {item.solicitado_por_nombre}
                </span>
              </div>
              {item.aprobado_por_nombre && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Aprobado por:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {item.aprobado_por_nombre}
                  </span>
                </div>
              )}
              {item.fecha_liberacion && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Fecha liberación:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {item.fecha_liberacion}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observaciones */}
        <Textarea
          label="Observaciones"
          value={formData.observaciones}
          onChange={(e) => handleChange('observaciones', e.target.value)}
          rows={3}
          placeholder="Observaciones sobre la solicitud de liberación..."
          disabled={!!item}
        />

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            {item ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!item && (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="small" className="mr-2" />
                  Enviando...
                </>
              ) : (
                'Solicitar Liberación'
              )}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
