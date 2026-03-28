/**
 * Modal para Crear/Editar Planes
 *
 * Formulario para gestión de planes desde Admin Global.
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, DollarSign, Users, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import { AVAILABLE_MODULES, DEFAULT_ENABLED_MODULES } from '@/constants/modules';
import { useCreatePlan, useUpdatePlan } from '../hooks/useAdminGlobal';
import type { Plan, CreatePlanDTO } from '../types';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan | null;
}

export const PlanFormModal = ({ isOpen, onClose, plan }: PlanFormModalProps) => {
  const isEditing = !!plan;
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  const [formData, setFormData] = useState<CreatePlanDTO>({
    code: '',
    name: '',
    description: '',
    max_users: 10,
    max_storage_gb: 5,
    price_monthly: '0',
    price_yearly: '0',
    features: [...DEFAULT_ENABLED_MODULES],
    is_active: true,
    is_default: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del plan si es edición
  useEffect(() => {
    if (plan) {
      setFormData({
        code: plan.code,
        name: plan.name,
        description: plan.description || '',
        max_users: plan.max_users,
        max_storage_gb: plan.max_storage_gb,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        features: plan.features || [],
        is_active: plan.is_active,
        is_default: plan.is_default,
      });
    } else {
      // Reset form para nuevo plan
      setFormData({
        code: '',
        name: '',
        description: '',
        max_users: 10,
        max_storage_gb: 5,
        price_monthly: '0',
        price_yearly: '0',
        features: [...DEFAULT_ENABLED_MODULES],
        is_active: true,
        is_default: false,
      });
    }
    setErrors({});
  }, [plan, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFeatureToggle = (featureCode: string) => {
    setFormData((prev) => {
      const currentFeatures = prev.features ?? [];
      return {
        ...prev,
        features: currentFeatures.includes(featureCode)
          ? currentFeatures.filter((f) => f !== featureCode)
          : [...currentFeatures, featureCode],
      };
    });
  };

  const generateCode = () => {
    if (formData.name) {
      const code = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 20);
      setFormData((prev) => ({ ...prev, code }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditing && !formData.code?.trim()) {
      newErrors.code = 'El código es requerido';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if ((formData.max_users ?? 0) < 0) {
      newErrors.max_users = 'Debe ser 0 o mayor';
    }

    if (parseFloat(formData.price_monthly ?? '0') < 0) {
      newErrors.price_monthly = 'El precio no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditing && plan) {
        await updatePlan.mutateAsync({ id: plan.id, data: formData });
      } else {
        await createPlan.mutateAsync(formData);
      }
      onClose();
    } catch {
      // Error manejado por el hook
    }
  };

  const isLoading = createPlan.isPending || updatePlan.isPending;

  if (!isOpen) return null;

  // Usar Portal para renderizar fuera del stacking context de Framer Motion
  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <CreditCard className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Editar Plan' : 'Nuevo Plan'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isEditing ? 'Actualiza los datos del plan' : 'Crea un nuevo plan de suscripción'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Nombre y Código */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => !formData.code && generateCode()}
                error={errors.name}
                placeholder="Pro"
              />

              <Input
                label="Código *"
                name="code"
                value={formData.code}
                onChange={handleChange}
                disabled={isEditing}
                error={errors.code}
                placeholder="pro"
              />
            </div>

            {/* Descripción */}
            <Textarea
              label="Descripción"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              resize="none"
              placeholder="Plan para empresas medianas..."
            />

            {/* Precios */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Precio Mensual"
                type="number"
                name="price_monthly"
                value={formData.price_monthly}
                onChange={handleChange}
                min={0}
                step="0.01"
                error={errors.price_monthly}
                leftIcon={<DollarSign className="h-4 w-4" />}
              />

              <Input
                label="Precio Anual"
                type="number"
                name="price_yearly"
                value={formData.price_yearly}
                onChange={handleChange}
                min={0}
                step="0.01"
                leftIcon={<DollarSign className="h-4 w-4" />}
              />
            </div>

            {/* Límites */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Máx. Usuarios (0=ilimitado)"
                type="number"
                name="max_users"
                value={formData.max_users}
                onChange={handleChange}
                min={0}
                error={errors.max_users}
                leftIcon={<Users className="h-4 w-4" />}
              />

              <Input
                label="Almacenamiento GB"
                type="number"
                name="max_storage_gb"
                value={formData.max_storage_gb}
                onChange={handleChange}
                min={0}
                leftIcon={<HardDrive className="h-4 w-4" />}
              />
            </div>

            {/* Módulos */}
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Módulos Incluidos
              </p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_MODULES.map((mod) => (
                  <Button
                    key={mod.code}
                    type="button"
                    size="sm"
                    variant={(formData.features ?? []).includes(mod.code) ? 'primary' : 'ghost'}
                    onClick={() => handleFeatureToggle(mod.code)}
                    className="rounded-full text-sm"
                  >
                    {mod.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Opciones */}
            <div className="flex gap-6">
              <Checkbox
                label="Activo"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <Checkbox
                label="Plan por defecto"
                name="is_default"
                checked={formData.is_default}
                onChange={handleChange}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Plan'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default PlanFormModal;
