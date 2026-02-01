/**
 * Modal para Crear/Editar Empresas (Tenants)
 *
 * Formulario completo para gestión de tenants desde Admin Global.
 */
import { useState, useEffect } from 'react';
import { X, Building2, Globe, Database, Calendar, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common';
import { TENANT_DEFAULTS } from '@/constants/brand';
import { useCreateTenant, useUpdateTenant, usePlans } from '../hooks/useAdminGlobal';
import type { Tenant, CreateTenantDTO, TenantTier } from '../types';

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant | null;
}

const TIER_OPTIONS: { value: TenantTier; label: string }[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'small', label: 'Pequeña' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
  { value: 'enterprise', label: 'Enterprise' },
];

export const TenantFormModal = ({ isOpen, onClose, tenant }: TenantFormModalProps) => {
  const isEditing = !!tenant;
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const { data: plans } = usePlans();

  const [formData, setFormData] = useState<CreateTenantDTO>({
    code: '',
    name: '',
    nit: '',
    subdomain: '',
    plan: undefined,
    tier: 'starter',
    max_users: TENANT_DEFAULTS.maxUsers,
    max_storage_gb: TENANT_DEFAULTS.maxStorageGb,
    enabled_modules: [...TENANT_DEFAULTS.enabledModules],
    is_active: true,
    is_trial: true,
    trial_ends_at: '',
    subscription_ends_at: '',
    primary_color: TENANT_DEFAULTS.primaryColor,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del tenant si es edición
  useEffect(() => {
    if (tenant) {
      setFormData({
        code: tenant.code,
        name: tenant.name,
        nit: tenant.nit || '',
        subdomain: tenant.subdomain,
        plan: tenant.plan || undefined,
        tier: tenant.tier,
        max_users: tenant.max_users,
        max_storage_gb: tenant.max_storage_gb,
        enabled_modules: tenant.enabled_modules,
        is_active: tenant.is_active,
        is_trial: tenant.is_trial,
        trial_ends_at: tenant.trial_ends_at?.split('T')[0] || '',
        subscription_ends_at: tenant.subscription_ends_at?.split('T')[0] || '',
        primary_color: tenant.primary_color,
        notes: tenant.notes || '',
      });
    } else {
      // Reset form para nueva empresa
      setFormData({
        code: '',
        name: '',
        nit: '',
        subdomain: '',
        plan: undefined,
        tier: 'starter',
        max_users: TENANT_DEFAULTS.maxUsers,
        max_storage_gb: TENANT_DEFAULTS.maxStorageGb,
        enabled_modules: [...TENANT_DEFAULTS.enabledModules],
        is_active: true,
        is_trial: true,
        trial_ends_at: getDefaultTrialDate(),
        subscription_ends_at: '',
        primary_color: TENANT_DEFAULTS.primaryColor,
        notes: '',
      });
    }
    setErrors({});
  }, [tenant, isOpen]);

  const getDefaultTrialDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + TENANT_DEFAULTS.trialDays);
    return date.toISOString().split('T')[0];
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
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

  const generateSubdomain = () => {
    if (formData.name) {
      const subdomain = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 30);
      setFormData((prev) => ({ ...prev, subdomain }));
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

    if (!formData.subdomain?.trim()) {
      newErrors.subdomain = 'El subdominio es requerido';
    } else if (!/^[a-z0-9]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Solo letras minúsculas y números';
    }

    if (formData.is_trial && !formData.trial_ends_at) {
      newErrors.trial_ends_at = 'Fecha de fin de trial requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditing && tenant) {
        await updateTenant.mutateAsync({ id: tenant.id, data: formData });
      } else {
        await createTenant.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      // Error manejado por el hook
    }
  };

  const isLoading = createTenant.isPending || updateTenant.isPending;

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
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isEditing ? 'Actualiza los datos de la empresa' : 'Crea una nueva empresa en la plataforma'}
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
                <Building2 className="h-4 w-4" />
                Información Básica
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de la empresa *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => {
                      if (!formData.code) generateCode();
                      if (!formData.subdomain) generateSubdomain();
                    }}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                      text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500
                      ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Mi Empresa S.A.S."
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
                        text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500
                        ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}
                        ${errors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="mi_empresa"
                    />
                    {!isEditing && (
                      <Button type="button" variant="outline" onClick={generateCode}>
                        Auto
                      </Button>
                    )}
                  </div>
                  {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NIT
                  </label>
                  <input
                    type="text"
                    name="nit"
                    value={formData.nit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="900.123.456-7"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan
                  </label>
                  <select
                    name="plan"
                    value={formData.plan || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Sin plan asignado</option>
                    {plans?.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price_monthly}/mes
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dominio */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Dominio y Acceso
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subdominio *
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={handleChange}
                      disabled={isEditing}
                      className={`flex-1 px-3 py-2 border rounded-l-lg bg-white dark:bg-gray-700
                        text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500
                        ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}
                        ${errors.subdomain ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="miempresa"
                    />
                    <span className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                      .stratekaz.com
                    </span>
                  </div>
                  {errors.subdomain && <p className="text-xs text-red-500 mt-1">{errors.subdomain}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tier
                  </label>
                  <select
                    name="tier"
                    value={formData.tier}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    {TIER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Límites */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Límites
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Máximo de usuarios
                  </label>
                  <input
                    type="number"
                    name="max_users"
                    value={formData.max_users}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Almacenamiento (GB)
                  </label>
                  <input
                    type="number"
                    name="max_storage_gb"
                    value={formData.max_storage_gb}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Suscripción */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Suscripción
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_trial"
                    checked={formData.is_trial}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Período de prueba (Trial)
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Empresa activa
                  </label>
                </div>

                {formData.is_trial && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fin del trial *
                    </label>
                    <input
                      type="date"
                      name="trial_ends_at"
                      value={formData.trial_ends_at}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                        text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500
                        ${errors.trial_ends_at ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.trial_ends_at && (
                      <p className="text-xs text-red-500 mt-1">{errors.trial_ends_at}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fin de suscripción
                  </label>
                  <input
                    type="date"
                    name="subscription_ends_at"
                    value={formData.subscription_ends_at}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Personalización */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Personalización
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color primario
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="primary_color"
                      value={formData.primary_color}
                      onChange={handleChange}
                      className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primary_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      placeholder={TENANT_DEFAULTS.primaryColor}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas internas
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Notas internas sobre esta empresa..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Empresa'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TenantFormModal;
