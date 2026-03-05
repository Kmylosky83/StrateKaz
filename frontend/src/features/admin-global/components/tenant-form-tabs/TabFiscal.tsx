/**
 * Tab Fiscal - NIT, razon social, representante legal, registro mercantil.
 */
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { TIPO_SOCIEDAD_OPTIONS, REGIMEN_OPTIONS } from '@/constants/tenant-options';
import type { TenantTabProps } from './types';

export const TabFiscal = ({ formData, handleChange }: TenantTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="NIT"
        value={formData.nit || ''}
        onChange={(e) => handleChange('nit', e.target.value)}
        placeholder="900.123.456-7"
      />
      <Input
        label="Razon Social"
        value={formData.razon_social || ''}
        onChange={(e) => handleChange('razon_social', e.target.value)}
        placeholder="Mi Empresa S.A.S."
      />
      <Input
        label="Nombre Comercial"
        value={formData.nombre_comercial || ''}
        onChange={(e) => handleChange('nombre_comercial', e.target.value)}
        placeholder="Mi Marca"
      />
      <Input
        label="Representante Legal"
        value={formData.representante_legal || ''}
        onChange={(e) => handleChange('representante_legal', e.target.value)}
        placeholder="Juan Perez"
      />
      <Input
        label="Cedula Representante"
        value={formData.cedula_representante || ''}
        onChange={(e) => handleChange('cedula_representante', e.target.value)}
        placeholder="1234567890"
      />
      <Select
        label="Tipo de Sociedad"
        value={formData.tipo_sociedad || 'SAS'}
        onChange={(e) => handleChange('tipo_sociedad', e.target.value)}
        options={TIPO_SOCIEDAD_OPTIONS}
      />
      <Input
        label="Actividad Economica (CIIU)"
        value={formData.actividad_economica || ''}
        onChange={(e) => handleChange('actividad_economica', e.target.value)}
        placeholder="6201"
      />
      <Select
        label="Regimen Tributario"
        value={formData.regimen_tributario || 'COMUN'}
        onChange={(e) => handleChange('regimen_tributario', e.target.value)}
        options={REGIMEN_OPTIONS}
      />
      <div className="md:col-span-2">
        <Textarea
          label="Descripcion de Actividad"
          value={formData.descripcion_actividad || ''}
          onChange={(e) => handleChange('descripcion_actividad', e.target.value)}
          placeholder="Descripcion de la actividad economica principal..."
          rows={2}
        />
      </div>
      <Input
        label="Matricula Mercantil"
        value={formData.matricula_mercantil || ''}
        onChange={(e) => handleChange('matricula_mercantil', e.target.value)}
        placeholder="000000"
      />
      <Input
        label="Camara de Comercio"
        value={formData.camara_comercio || ''}
        onChange={(e) => handleChange('camara_comercio', e.target.value)}
        placeholder="Bogota"
      />
      <Input
        label="Fecha de Constitucion"
        type="date"
        value={formData.fecha_constitucion || ''}
        onChange={(e) => handleChange('fecha_constitucion', e.target.value || null)}
      />
      <Input
        label="Fecha Inscripcion Registro"
        type="date"
        value={formData.fecha_inscripcion_registro || ''}
        onChange={(e) => handleChange('fecha_inscripcion_registro', e.target.value || null)}
      />
    </div>
  );
};
