/**
 * Modal genérico para crear/editar ítems de catálogo.
 *
 * Adapta los campos según el tipo de catálogo recibido.
 * Patrón: BaseModal + useState + create/update mutations.
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Switch } from '@/components/forms/Switch';
import { Button } from '@/components/common/Button';
import type { SimpleCatalogItem } from '../../types/config-admin.types';

export type CatalogType =
  | 'unidad_medida'
  | 'tipo_contrato'
  | 'tipo_documento_identidad'
  | 'norma_iso'
  | 'tipo_epp'
  | 'tipo_examen'
  | 'tipo_inspeccion'
  | 'tipo_residuo'
  | 'forma_pago';

interface CatalogFormModalProps {
  catalogType: CatalogType;
  item: SimpleCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCreate: ReturnType<typeof import('@tanstack/react-query').useMutation>;
  onUpdate: ReturnType<typeof import('@tanstack/react-query').useMutation>;
}

interface FormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  orden: number;
  categoria: string;
}

const CATALOG_LABELS: Record<CatalogType, { singular: string; feminine: boolean }> = {
  unidad_medida: { singular: 'Unidad de Medida', feminine: true },
  tipo_contrato: { singular: 'Tipo de Contrato', feminine: false },
  tipo_documento_identidad: { singular: 'Tipo de Documento', feminine: false },
  norma_iso: { singular: 'Norma ISO', feminine: true },
  tipo_epp: { singular: 'Tipo de EPP', feminine: false },
  tipo_examen: { singular: 'Tipo de Examen', feminine: false },
  tipo_inspeccion: { singular: 'Tipo de Inspección', feminine: true },
  tipo_residuo: { singular: 'Tipo de Residuo', feminine: false },
  forma_pago: { singular: 'Forma de Pago', feminine: true },
};

const UNIDAD_CATEGORIA_OPTIONS = [
  { value: 'MASA', label: 'Masa' },
  { value: 'VOLUMEN', label: 'Volumen' },
  { value: 'LONGITUD', label: 'Longitud' },
  { value: 'AREA', label: 'Área' },
  { value: 'CANTIDAD', label: 'Cantidad' },
  { value: 'TIEMPO', label: 'Tiempo' },
  { value: 'CONTENEDOR', label: 'Contenedor' },
  { value: 'OTRO', label: 'Otro' },
];

const EPP_CATEGORIA_OPTIONS = [
  { value: 'CABEZA', label: 'Protección de Cabeza' },
  { value: 'OJOS_CARA', label: 'Protección de Ojos y Cara' },
  { value: 'AUDITIVA', label: 'Protección Auditiva' },
  { value: 'RESPIRATORIA', label: 'Protección Respiratoria' },
  { value: 'MANOS', label: 'Protección de Manos' },
  { value: 'PIES', label: 'Protección de Pies' },
  { value: 'CUERPO', label: 'Protección del Cuerpo' },
  { value: 'CAIDAS', label: 'Protección contra Caídas' },
  { value: 'OTROS', label: 'Otros' },
];

const RESIDUO_CLASE_OPTIONS = [
  { value: 'PELIGROSO', label: 'Peligroso' },
  { value: 'NO_PELIGROSO', label: 'No Peligroso' },
  { value: 'RECICLABLE', label: 'Reciclable' },
  { value: 'ORGANICO', label: 'Orgánico' },
  { value: 'RAEE', label: 'RAEE' },
  { value: 'RCD', label: 'RCD' },
  { value: 'ESPECIAL', label: 'Especial' },
];

const defaultForm: FormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  orden: 0,
  categoria: '',
};

export const CatalogFormModal = ({
  catalogType,
  item,
  isOpen,
  onClose,
  onCreate,
  onUpdate,
}: CatalogFormModalProps) => {
  const isEdit = !!item;
  const label = CATALOG_LABELS[catalogType];
  const isLoading = onCreate.isPending || onUpdate.isPending;

  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && item && !isInitialized) {
      setFormData({
        codigo:
          ((item as Record<string, unknown>).codigo as string) ||
          ((item as Record<string, unknown>).code as string) ||
          '',
        nombre:
          ((item as Record<string, unknown>).nombre as string) ||
          ((item as Record<string, unknown>).name as string) ||
          '',
        descripcion:
          ((item as Record<string, unknown>).descripcion as string) ||
          ((item as Record<string, unknown>).description as string) ||
          '',
        orden: (item.orden as number) || 0,
        categoria:
          ((item as Record<string, unknown>).categoria as string) ||
          ((item as Record<string, unknown>).category as string) ||
          '',
      });
      setIsInitialized(true);
    }
    if (isOpen && !item && !isInitialized) {
      setFormData(defaultForm);
      setIsInitialized(true);
    }
    if (!isOpen) {
      setIsInitialized(false);
      setErrors({});
    }
  }, [isOpen, item, isInitialized]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (needsCodigo && !formData.codigo.trim()) newErrors.codigo = 'El código es requerido';
    if (needsCategoria && !formData.categoria) newErrors.categoria = 'La categoría es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const needsCodigo = !['norma_iso'].includes(catalogType);
  const needsCategoria = ['unidad_medida', 'tipo_epp', 'tipo_residuo'].includes(catalogType);

  const getCategoriaOptions = () => {
    switch (catalogType) {
      case 'unidad_medida':
        return UNIDAD_CATEGORIA_OPTIONS;
      case 'tipo_epp':
        return EPP_CATEGORIA_OPTIONS;
      case 'tipo_residuo':
        return RESIDUO_CLASE_OPTIONS;
      default:
        return [];
    }
  };

  const buildPayload = () => {
    const base: Record<string, unknown> = {};

    // Campos según tipo de catálogo
    switch (catalogType) {
      case 'tipo_contrato':
        base.name = formData.nombre.trim();
        base.code = formData.codigo.trim().toUpperCase();
        base.descripcion = formData.descripcion.trim() || undefined;
        base.orden = formData.orden || undefined;
        break;
      case 'norma_iso':
        base.name = formData.nombre.trim();
        base.description = formData.descripcion.trim() || undefined;
        base.category = formData.categoria || undefined;
        base.orden = formData.orden || undefined;
        break;
      case 'unidad_medida':
        base.nombre = formData.nombre.trim();
        base.abreviatura = formData.codigo.trim().toUpperCase();
        base.categoria = formData.categoria;
        base.descripcion = formData.descripcion.trim() || undefined;
        break;
      case 'tipo_residuo':
        base.codigo = formData.codigo.trim().toUpperCase();
        base.nombre = formData.nombre.trim();
        base.descripcion = formData.descripcion.trim() || undefined;
        base.clase = formData.categoria;
        break;
      default:
        base.codigo = formData.codigo.trim().toUpperCase();
        base.nombre = formData.nombre.trim();
        base.descripcion = formData.descripcion.trim() || undefined;
        base.orden = formData.orden || undefined;
        if (needsCategoria) base.categoria = formData.categoria;
        break;
    }

    return base;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = buildPayload();

    try {
      if (isEdit && item) {
        await (
          onUpdate as { mutateAsync: (args: { id: number; data: unknown }) => Promise<unknown> }
        ).mutateAsync({ id: item.id, data: payload });
      } else {
        await (onCreate as { mutateAsync: (data: unknown) => Promise<unknown> }).mutateAsync(
          payload
        );
      }
      onClose();
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const codigoLabel = catalogType === 'unidad_medida' ? 'Abreviatura *' : 'Código *';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEdit
          ? `Editar ${label.singular}`
          : `${label.feminine ? 'Nueva' : 'Nuevo'} ${label.singular}`
      }
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre *"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            error={errors.nombre}
          />
          {needsCodigo && (
            <Input
              label={codigoLabel}
              value={formData.codigo}
              onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
              error={errors.codigo}
              className="uppercase"
            />
          )}
        </div>

        {needsCategoria && (
          <Select
            label="Categoría *"
            value={formData.categoria}
            onChange={(e) => handleChange('categoria', e.target.value)}
            options={[{ value: '', label: 'Seleccionar...' }, ...getCategoriaOptions()]}
            error={errors.categoria}
          />
        )}

        <Input
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
        />

        <Input
          label="Orden"
          type="number"
          value={String(formData.orden)}
          onChange={(e) => handleChange('orden', parseInt(e.target.value) || 0)}
          min={0}
        />
      </div>
    </BaseModal>
  );
};
