/**
 * Tab Fiscal - NIT, razon social, representante legal, registro mercantil.
 */
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { TIPO_SOCIEDAD_OPTIONS, REGIMEN_OPTIONS } from '@/constants/tenant-options';
import type { TenantTabProps } from './types';

export const TabFiscal = ({ formData, handleChange, errors }: TenantTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="NIT"
        value={formData.nit || ''}
        onChange={(e) => handleChange('nit', e.target.value)}
        placeholder="900.123.456-7"
        error={errors.nit}
      />
      <Input
        label="Razón Social"
        value={formData.razon_social || ''}
        onChange={(e) => handleChange('razon_social', e.target.value)}
        placeholder="Mi Empresa S.A.S."
        error={errors.razon_social}
      />
      <Input
        label="Nombre Comercial"
        value={formData.nombre_comercial || ''}
        onChange={(e) => handleChange('nombre_comercial', e.target.value)}
        placeholder="Mi Marca"
        error={errors.nombre_comercial}
      />
      <Input
        label="Representante Legal"
        value={formData.representante_legal || ''}
        onChange={(e) => handleChange('representante_legal', e.target.value)}
        placeholder="Juan Pérez"
        error={errors.representante_legal}
      />
      <Input
        label="Cédula Representante"
        value={formData.cedula_representante || ''}
        onChange={(e) => handleChange('cedula_representante', e.target.value)}
        placeholder="1234567890"
        error={errors.cedula_representante}
      />
      <Select
        label="Tipo de Sociedad"
        value={formData.tipo_sociedad || 'SAS'}
        onChange={(e) => handleChange('tipo_sociedad', e.target.value)}
        options={[...TIPO_SOCIEDAD_OPTIONS]}
        error={errors.tipo_sociedad}
      />
      <Input
        label="Actividad Económica (CIIU)"
        value={formData.actividad_economica || ''}
        onChange={(e) => handleChange('actividad_economica', e.target.value)}
        placeholder="6201"
        error={errors.actividad_economica}
      />
      <Select
        label="Régimen Tributario"
        value={formData.regimen_tributario || 'COMUN'}
        onChange={(e) => handleChange('regimen_tributario', e.target.value)}
        options={[...REGIMEN_OPTIONS]}
        error={errors.regimen_tributario}
      />
      <div className="md:col-span-2">
        <Textarea
          label="Descripción de Actividad"
          value={formData.descripcion_actividad || ''}
          onChange={(e) => handleChange('descripcion_actividad', e.target.value)}
          placeholder="Descripción de la actividad económica principal..."
          rows={2}
          error={errors.descripcion_actividad}
        />
      </div>
      <Input
        label="Matrícula Mercantil"
        value={formData.matricula_mercantil || ''}
        onChange={(e) => handleChange('matricula_mercantil', e.target.value)}
        placeholder="000000"
        error={errors.matricula_mercantil}
      />
      <Input
        label="Cámara de Comercio"
        value={formData.camara_comercio || ''}
        onChange={(e) => handleChange('camara_comercio', e.target.value)}
        placeholder="Bogotá"
        error={errors.camara_comercio}
      />
      <Input
        label="Fecha de Constitución"
        type="date"
        value={formData.fecha_constitucion || ''}
        onChange={(e) => handleChange('fecha_constitucion', e.target.value || null)}
        error={errors.fecha_constitucion}
      />
      <Input
        label="Fecha Inscripción Registro"
        type="date"
        value={formData.fecha_inscripcion_registro || ''}
        onChange={(e) => handleChange('fecha_inscripcion_registro', e.target.value || null)}
        error={errors.fecha_inscripcion_registro}
      />
    </div>
  );
};
