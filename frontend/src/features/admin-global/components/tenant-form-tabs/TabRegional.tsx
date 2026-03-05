/**
 * Tab Regional - Zona horaria, formato de fecha, moneda.
 */
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { ZONA_HORARIA_OPTIONS, FORMATO_FECHA_OPTIONS, MONEDA_OPTIONS } from './constants';
import type { TenantTabProps } from './types';

export const TabRegional = ({ formData, handleChange }: TenantTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select
        label="Zona Horaria"
        value={formData.zona_horaria || 'America/Bogota'}
        onChange={(e) => handleChange('zona_horaria', e.target.value)}
        options={ZONA_HORARIA_OPTIONS}
      />
      <Select
        label="Formato de Fecha"
        value={formData.formato_fecha || 'DD/MM/YYYY'}
        onChange={(e) => handleChange('formato_fecha', e.target.value)}
        options={FORMATO_FECHA_OPTIONS}
      />
      <Select
        label="Moneda"
        value={formData.moneda || 'COP'}
        onChange={(e) => handleChange('moneda', e.target.value)}
        options={MONEDA_OPTIONS}
      />
      <Input
        label="Simbolo de Moneda"
        value={formData.simbolo_moneda || '$'}
        onChange={(e) => handleChange('simbolo_moneda', e.target.value)}
        placeholder="$"
      />
      <Input
        label="Separador de Miles"
        value={formData.separador_miles || '.'}
        onChange={(e) => handleChange('separador_miles', e.target.value)}
        placeholder="."
        maxLength={1}
      />
      <Input
        label="Separador de Decimales"
        value={formData.separador_decimales || ','}
        onChange={(e) => handleChange('separador_decimales', e.target.value)}
        placeholder=","
        maxLength={1}
      />
    </div>
  );
};
