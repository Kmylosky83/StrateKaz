/**
 * CredencialesEditor - Editor de credenciales con seguridad
 *
 * Características:
 * - Valores enmascarados por defecto
 * - Botón "Mostrar/Ocultar" para revelar valores
 * - Validación según método de autenticación
 * - Soporte para múltiples tipos de credenciales
 */
import { useState } from 'react';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/common/Button';
import { Eye, EyeOff, Key, Lock } from 'lucide-react';

export type MetodoAutenticacion =
  | 'API_KEY'
  | 'API_KEY_SECRET'
  | 'OAUTH2'
  | 'BASIC_AUTH'
  | 'BEARER_TOKEN'
  | 'SERVICE_ACCOUNT'
  | 'CERTIFICADO';

export interface CredencialesData {
  api_key?: string;
  api_secret?: string;
  username?: string;
  password?: string;
  bearer_token?: string;
  service_account_json?: string;
  certificado?: string;
  certificado_password?: string;
  client_id?: string;
  client_secret?: string;
  oauth_token?: string;
  refresh_token?: string;
}

export interface CredencialesEditorProps {
  metodo: MetodoAutenticacion;
  valores: CredencialesData;
  onChange: (valores: CredencialesData) => void;
  isEditing?: boolean;
  canReveal?: boolean;
  disabled?: boolean;
}

export const CredencialesEditor = ({
  metodo,
  valores,
  onChange,
  isEditing = false,
  canReveal = false,
  disabled = false,
}: CredencialesEditorProps) => {
  const [showValues, setShowValues] = useState(false);

  const handleChange = (field: keyof CredencialesData, value: string) => {
    onChange({
      ...valores,
      [field]: value,
    });
  };

  const maskValue = (value: string | undefined): string => {
    if (!value) return '';
    if (!isEditing || showValues) return value;
    return '••••••••••••••••';
  };

  const getInputType = (fieldName: string): 'text' | 'password' => {
    if (!isEditing) return 'text';
    if (showValues) return 'text';

    const passwordFields = ['password', 'api_secret', 'bearer_token', 'certificado_password'];
    return passwordFields.includes(fieldName) ? 'password' : 'text';
  };

  const renderFields = () => {
    switch (metodo) {
      case 'API_KEY':
        return (
          <Input
            label="API Key *"
            value={maskValue(valores.api_key)}
            onChange={(e) => handleChange('api_key', e.target.value)}
            type={getInputType('api_key')}
            leftIcon={<Key className="h-4 w-4" />}
            placeholder="sk_live_..."
            disabled={disabled}
            required
            helperText="Clave de API proporcionada por el proveedor"
          />
        );

      case 'API_KEY_SECRET':
        return (
          <div className="space-y-4">
            <Input
              label="API Key *"
              value={maskValue(valores.api_key)}
              onChange={(e) => handleChange('api_key', e.target.value)}
              type={getInputType('api_key')}
              leftIcon={<Key className="h-4 w-4" />}
              placeholder="pk_..."
              disabled={disabled}
              required
            />
            <Input
              label="API Secret *"
              value={maskValue(valores.api_secret)}
              onChange={(e) => handleChange('api_secret', e.target.value)}
              type={getInputType('api_secret')}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="sk_..."
              disabled={disabled}
              required
              helperText="Secreto que acompaña a la API Key"
            />
          </div>
        );

      case 'BASIC_AUTH':
        return (
          <div className="space-y-4">
            <Input
              label="Usuario *"
              value={valores.username || ''}
              onChange={(e) => handleChange('username', e.target.value)}
              type="text"
              placeholder="usuario@empresa.com"
              disabled={disabled}
              required
            />
            <Input
              label="Contraseña *"
              value={maskValue(valores.password)}
              onChange={(e) => handleChange('password', e.target.value)}
              type={getInputType('password')}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
              disabled={disabled}
              required
            />
          </div>
        );

      case 'BEARER_TOKEN':
        return (
          <Input
            label="Bearer Token *"
            value={maskValue(valores.bearer_token)}
            onChange={(e) => handleChange('bearer_token', e.target.value)}
            type={getInputType('bearer_token')}
            leftIcon={<Key className="h-4 w-4" />}
            placeholder="eyJhbGci..."
            disabled={disabled}
            required
            helperText="Token de acceso (JWT o similar)"
          />
        );

      case 'OAUTH2':
        return (
          <div className="space-y-4">
            <Input
              label="Client ID *"
              value={valores.client_id || ''}
              onChange={(e) => handleChange('client_id', e.target.value)}
              type="text"
              placeholder="client_id_..."
              disabled={disabled}
              required
            />
            <Input
              label="Client Secret *"
              value={maskValue(valores.client_secret)}
              onChange={(e) => handleChange('client_secret', e.target.value)}
              type={getInputType('client_secret')}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="client_secret_..."
              disabled={disabled}
              required
            />
            <Input
              label="OAuth Token"
              value={maskValue(valores.oauth_token)}
              onChange={(e) => handleChange('oauth_token', e.target.value)}
              type={getInputType('oauth_token')}
              placeholder="access_token_..."
              disabled={disabled}
              helperText="Se generará automáticamente al autorizar"
            />
            <Input
              label="Refresh Token"
              value={maskValue(valores.refresh_token)}
              onChange={(e) => handleChange('refresh_token', e.target.value)}
              type={getInputType('refresh_token')}
              placeholder="refresh_token_..."
              disabled={disabled}
              helperText="Token para renovar el acceso"
            />
          </div>
        );

      case 'SERVICE_ACCOUNT':
        return (
          <Textarea
            label="Service Account JSON *"
            value={maskValue(valores.service_account_json)}
            onChange={(e) => handleChange('service_account_json', e.target.value)}
            placeholder='{"type": "service_account", "project_id": "...","private_key": "..."}'
            rows={8}
            disabled={disabled}
            required
            helperText="Archivo JSON completo de la cuenta de servicio"
          />
        );

      case 'CERTIFICADO':
        return (
          <div className="space-y-4">
            <Textarea
              label="Certificado (PEM) *"
              value={maskValue(valores.certificado)}
              onChange={(e) => handleChange('certificado', e.target.value)}
              placeholder="-----BEGIN CERTIFICATE-----..."
              rows={6}
              disabled={disabled}
              required
            />
            <Input
              label="Contraseña del Certificado"
              value={maskValue(valores.certificado_password)}
              onChange={(e) => handleChange('certificado_password', e.target.value)}
              type={getInputType('certificado_password')}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
              disabled={disabled}
              helperText="Solo si el certificado está protegido"
            />
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            Selecciona un método de autenticación para configurar las credenciales.
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón mostrar/ocultar solo en modo edición y si tiene permiso */}
      {isEditing && canReveal && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowValues(!showValues)}
            leftIcon={showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          >
            {showValues ? 'Ocultar valores' : 'Mostrar valores'}
          </Button>
        </div>
      )}

      {/* Campos dinámicos según método */}
      {renderFields()}
    </div>
  );
};
