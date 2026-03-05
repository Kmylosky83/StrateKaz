/**
 * Tab Contacto - Direccion, telefonos, email, sitio web.
 */
import { Phone, Globe } from 'lucide-react';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { DEPARTAMENTOS_OPTIONS } from '@/constants/tenant-options';
import type { TenantTabProps } from './types';

export const TabContacto = ({ formData, handleChange }: TenantTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Textarea
          label="Direccion Fiscal"
          value={formData.direccion_fiscal || ''}
          onChange={(e) => handleChange('direccion_fiscal', e.target.value)}
          placeholder="Calle 100 # 19-61"
          rows={2}
        />
      </div>
      <Input
        label="Ciudad"
        value={formData.ciudad || ''}
        onChange={(e) => handleChange('ciudad', e.target.value)}
        placeholder="Bogota"
      />
      <Select
        label="Departamento"
        value={formData.departamento || ''}
        onChange={(e) => handleChange('departamento', e.target.value)}
        options={[{ value: '', label: 'Seleccionar...' }, ...DEPARTAMENTOS_OPTIONS]}
      />
      <Input
        label="Pais"
        value={formData.pais || 'Colombia'}
        onChange={(e) => handleChange('pais', e.target.value)}
      />
      <Input
        label="Codigo Postal"
        value={formData.codigo_postal || ''}
        onChange={(e) => handleChange('codigo_postal', e.target.value)}
        placeholder="110111"
      />
      <Input
        label="Telefono Principal"
        value={formData.telefono_principal || ''}
        onChange={(e) => handleChange('telefono_principal', e.target.value)}
        placeholder="+57 601 1234567"
        leftIcon={<Phone className="h-4 w-4" />}
      />
      <Input
        label="Telefono Secundario"
        value={formData.telefono_secundario || ''}
        onChange={(e) => handleChange('telefono_secundario', e.target.value)}
        placeholder="+57 300 1234567"
        leftIcon={<Phone className="h-4 w-4" />}
      />
      <Input
        label="Email Corporativo"
        type="email"
        value={formData.email_corporativo || ''}
        onChange={(e) => handleChange('email_corporativo', e.target.value)}
        placeholder="contacto@miempresa.com"
      />
      <Input
        label="Sitio Web"
        value={formData.sitio_web || ''}
        onChange={(e) => handleChange('sitio_web', e.target.value)}
        placeholder="https://www.miempresa.com"
        leftIcon={<Globe className="h-4 w-4" />}
      />
    </div>
  );
};
