/**
 * Modal para Crear/Editar Planes de Suscripción
 *
 * Formulario para gestión de planes desde Admin Global.
 */
import { useState, useEffect } from 'react';
import { X, CreditCard, Users, HardDrive, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common';
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
    max_storage_gb: 10,
    price_monthly: '0.00',
    price_yearly: '0.00',
    features: [],
    is_active: true,
    is_default: false,
  });

  const [featuresInput, setFeaturesInput] = useState('');
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
        features: plan.features,
        is_active: plan.is_active,
        is_default: plan.is_default,
      });
      setFeaturesInput(plan.features.join(', '));
    } else {
      // Reset form para nuevo plan
      setFormData({
        code: '',
        name: '',
        description: '',
        max_users: 10,
        max_storage_gb: 10,
        price_monthly: '0.00',
        price_yearly: '0.00',
        features: [],
        is_active: true,
        is_default: false,
      });
      setFeaturesInput('');
    }
    setErrors({});
  }, [plan, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  const handleFeaturesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeaturesInput(e.target.value);
    // Parsear features separadas por coma
    const features = e.target.value
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    setFormData((prev) => ({ ...prev, features }));
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

    if (!formData.code?.trim()) {
      newErrors.code = 'El código es requerido';
    } else if (!/^[a-z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'Solo letras minúsculas, números y guiones bajos';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es requerido';
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

  return (
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
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl"
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
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Información del Plan
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del plan *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => {
                      if (!formData.code) generateCode();
                    }}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                      text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500
                      ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Plan Profesional"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Código único *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      disabled={isEditing}
                      className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                        text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500
                        ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}
                        ${errors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="pro"
                    />
                    {!isEditing && (
                      <Button type="button" variant="outline" onClick={generateCode}>
                        Auto
                      </Button>
                    )}
                  </div>
                  {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Descripción del plan..."
                  />
                </div>
              </div>
            </div>

            {/* Precios */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Precios
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio mensual (COP)
                  </label>
                  <input
                    type="text"
                    name="price_monthly"
                    value={formData.price_monthly}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="99000.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio anual (COP)
                  </label>
                  <input
                    type="text"
                    name="price_yearly"
                    value={formData.price_yearly}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="990000.00"
                  />
                </div>
              </div>
            </div>

            {/* Límites */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Límites
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Máximo de usuarios (0 = ilimitado)
                  </label>
                  <input
                    type="number"
                    name="max_users"
                    value={formData.max_users}
                    onChange={handleChange}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Almacenamiento GB (0 = ilimitado)
                  </label>
                  <input
                    type="number"
                    name="max_storage_gb"
                    value={formData.max_storage_gb}
                    onChange={handleChange}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Módulos incluidos
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Features (separadas por coma)
                </label>
                <input
                  type="text"
                  value={featuresInput}
                  onChange={handleFeaturesChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  placeholder="SST, PESV, Calidad, Ambiental"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.features?.length || 0} módulos configurados
                </p>
              </div>
            </div>

            {/* Estado */}
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Plan activo
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Plan por defecto
                </label>
              </div>
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
};

export default PlanFormModal;
