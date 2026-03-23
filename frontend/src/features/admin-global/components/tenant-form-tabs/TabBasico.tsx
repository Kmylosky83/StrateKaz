/**
 * Tab Basico - Datos de identificacion, plan, estado y administrador inicial.
 */
import { Users, Database, Calendar, UserCog, Mail, User } from 'lucide-react';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { TIER_OPTIONS } from './constants';
import type { TabBasicoProps } from './types';

export const TabBasico = ({
  formData,
  handleChange,
  errors,
  isEditing,
  plans,
  generateCode,
  generateSubdomain,
  adminData,
  onAdminChange,
}: TabBasicoProps) => {
  const adminMode = adminData?.admin_mode ?? 'new';

  return (
    <div className="space-y-5">
      {/* ══════════════════════════════════════════════════════════════════════
        Sección: Administrador Inicial (solo al crear)
    ══════════════════════════════════════════════════════════════════════ */}
      {!isEditing && onAdminChange && (
        <Card variant="bordered" padding="none" className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Administrador Inicial
            </span>
          </div>
          <div className="p-4 space-y-4">
            {/* Selector de modo */}
            <div className="flex gap-3">
              <label
                className={`flex-1 flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 cursor-pointer transition-colors ${
                  adminMode === 'new'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="admin_mode"
                  value="new"
                  checked={adminMode === 'new'}
                  onChange={() => onAdminChange('admin_mode', 'new')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Crear administrador nuevo
                </span>
              </label>
              <label
                className={`flex-1 flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 cursor-pointer transition-colors ${
                  adminMode === 'existing'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="admin_mode"
                  value="existing"
                  checked={adminMode === 'existing'}
                  onChange={() => onAdminChange('admin_mode', 'existing')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Asignar admin existente
                </span>
              </label>
            </div>

            {/* Campos según modo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Input
                  label={
                    adminMode === 'new'
                      ? 'Email del administrador *'
                      : 'Email del usuario existente *'
                  }
                  type="email"
                  value={adminData?.admin_email ?? ''}
                  onChange={(e) => onAdminChange('admin_email', e.target.value)}
                  error={errors.admin_email}
                  placeholder="admin@empresa.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                />
              </div>

              {adminMode === 'new' && (
                <>
                  <Input
                    label="Nombre *"
                    value={adminData?.admin_first_name ?? ''}
                    onChange={(e) => onAdminChange('admin_first_name', e.target.value)}
                    error={errors.admin_first_name}
                    placeholder="Juan"
                    leftIcon={<User className="h-4 w-4" />}
                  />
                  <Input
                    label="Apellido *"
                    value={adminData?.admin_last_name ?? ''}
                    onChange={(e) => onAdminChange('admin_last_name', e.target.value)}
                    error={errors.admin_last_name}
                    placeholder="Pérez"
                  />
                </>
              )}

              <div className={adminMode === 'new' ? 'md:col-span-2' : 'md:col-span-2'}>
                <Input
                  label="Cargo del administrador"
                  value={adminData?.admin_cargo_name ?? 'Administrador General'}
                  onChange={(e) => onAdminChange('admin_cargo_name', e.target.value)}
                  placeholder="Administrador General"
                  leftIcon={<UserCog className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
        Sección: Datos de identificación, plan y estado
    ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre de la empresa *"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => {
            if (!formData.code) generateCode();
            if (!formData.subdomain) generateSubdomain();
          }}
          error={errors.name}
          placeholder="Mi Empresa S.A.S."
        />
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Codigo unico *"
              value={formData.code || ''}
              onChange={(e) => handleChange('code', e.target.value)}
              disabled={isEditing}
              error={errors.code}
              placeholder="mi_empresa"
            />
          </div>
          {!isEditing && (
            <Button type="button" variant="outline" onClick={generateCode} className="mb-0">
              Auto
            </Button>
          )}
        </div>
        <div>
          <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subdominio *
          </p>
          <div className="flex">
            <div className="flex-1">
              <Input
                value={formData.subdomain || ''}
                onChange={(e) => handleChange('subdomain', e.target.value)}
                disabled={isEditing}
                error={errors.subdomain}
                placeholder="miempresa"
                className="rounded-r-none"
              />
            </div>
            <span className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap self-start mt-0">
              .{import.meta.env.VITE_BASE_DOMAIN || 'stratekaz.com'}
            </span>
          </div>
        </div>
        <Select
          label="Plan"
          value={formData.plan ?? ''}
          onChange={(e) =>
            handleChange('plan', e.target.value === '' ? null : Number(e.target.value))
          }
          options={[
            { value: '', label: 'Sin plan asignado' },
            ...(plans?.map((p) => ({
              value: p.id,
              label: `${p.name} - $${p.price_monthly}/mes`,
            })) || []),
          ]}
        />
        <Select
          label="Tier"
          value={formData.tier || 'starter'}
          onChange={(e) => handleChange('tier', e.target.value)}
          options={TIER_OPTIONS}
        />
        <Input
          label="Maximo de usuarios"
          type="number"
          value={formData.max_users || 5}
          onChange={(e) => handleChange('max_users', Number(e.target.value))}
          min={1}
          leftIcon={<Users className="h-4 w-4" />}
        />
        <Input
          label="Almacenamiento (GB)"
          type="number"
          value={formData.max_storage_gb || 5}
          onChange={(e) => handleChange('max_storage_gb', Number(e.target.value))}
          min={1}
          leftIcon={<Database className="h-4 w-4" />}
        />
        <div className="flex items-center gap-6">
          <Checkbox
            label="Empresa activa"
            checked={formData.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
          />
          <Checkbox
            label="Periodo de prueba"
            checked={formData.is_trial}
            onChange={(e) => handleChange('is_trial', e.target.checked)}
          />
        </div>
        {formData.is_trial && (
          <Input
            label="Fin del trial *"
            type="date"
            value={formData.trial_ends_at || ''}
            onChange={(e) => handleChange('trial_ends_at', e.target.value)}
            error={errors.trial_ends_at}
            leftIcon={<Calendar className="h-4 w-4" />}
          />
        )}
        <Input
          label="Fin de suscripcion"
          type="date"
          value={formData.subscription_ends_at || ''}
          onChange={(e) => handleChange('subscription_ends_at', e.target.value)}
          leftIcon={<Calendar className="h-4 w-4" />}
        />
        <div className="md:col-span-2">
          <Textarea
            label="Notas internas"
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Notas internas sobre esta empresa..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );
};
