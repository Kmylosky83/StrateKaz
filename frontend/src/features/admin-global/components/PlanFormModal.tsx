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
    price_monthly: 0,
    price_yearly: 0,
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
        price_monthly: parseFloat(plan.price_monthly),
        price_yearly: parseFloat(plan.price_yearly),
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
        price_monthly: 0,
        price_yearly: 0,
        features: [...DEFAULT_ENABLED_MODULES],
        is_active: true,
        is_default: false,
      });
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

  const handleFeatureToggle = (featureCode: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(featureCode)
        ? prev.features.filter((f) => f !== featureCode)
        : [...prev.features, featureCode],
    }));
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

    if (formData.max_users < 0) {
      newErrors.max_users = 'Debe ser 0 o mayor';
    }

    if (formData.price_monthly < 0) {
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
    } catch (error) {
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => !formData.code && generateCode()}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                    text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500
                    ${errors.name ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Pro"
                />
                {errors.name && <p className="text-xs text-danger-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={isEditing}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                    text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500
                    ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}
                    ${errors.code ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="pro"
                />
                {errors.code && <p className="text-xs text-danger-500 mt-1">{errors.code}</p>}
              </div>
            </div>

            {/* Descripción */}
            <div>
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
                placeholder="Plan para empresas medianas..."
              />
            </div>

            {/* Precios */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <DollarSign className="inline h-4 w-4" /> Precio Mensual
                </label>
                <input
                  type="number"
                  name="price_monthly"
                  value={formData.price_monthly}
                  onChange={handleChange}
                  min={0}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <DollarSign className="inline h-4 w-4" /> Precio Anual
                </label>
                <input
                  type="number"
                  name="price_yearly"
                  value={formData.price_yearly}
                  onChange={handleChange}
                  min={0}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Límites */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Users className="inline h-4 w-4" /> Máx. Usuarios (0=ilimitado)
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
                  <HardDrive className="inline h-4 w-4" /> Almacenamiento GB
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

            {/* Módulos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Módulos Incluidos
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_MODULES.map((mod) => (
                  <button
                    key={mod.code}
                    type="button"
                    onClick={() => handleFeatureToggle(mod.code)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${formData.features.includes(mod.code)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {mod.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Opciones */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Activo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Plan por defecto</span>
              </label>
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
