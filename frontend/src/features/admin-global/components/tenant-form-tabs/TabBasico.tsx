/**
 * Tab Basico - Datos de identificacion, plan y estado.
 */
import { Users, Database, Calendar } from 'lucide-react';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Checkbox } from '@/components/forms/Checkbox';
import { Button } from '@/components/common/Button';
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
}: TabBasicoProps) => {
  return (
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
            .{import.meta.env.VITE_BASE_DOMAIN || 'localhost'}
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
  );
};
