/**
 * CrearAccesoProveedorModal — Modal para crear acceso al sistema a un proveedor existente
 *
 * Se usa desde la tabla de proveedores cuando un proveedor no tiene usuario vinculado.
 * Envía email de configuración de contraseña al correo proporcionado.
 */
import { useState, useMemo, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Alert } from '@/components/common/Alert';
import { Shield, Mail, Check } from 'lucide-react';
import { useCrearAccesoProveedor } from '../hooks/useProveedores';
import { useCargos } from '@/features/configuracion/hooks/useCargos';
import type { ProveedorList } from '../types';

interface CrearAccesoProveedorModalProps {
  proveedor: ProveedorList | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CrearAccesoProveedorModal({
  proveedor,
  isOpen,
  onClose,
}: CrearAccesoProveedorModalProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [cargoId, setCargoId] = useState<number | ''>('');
  const crearAccesoMutation = useCrearAccesoProveedor();
  const { data: cargosData } = useCargos();

  const cargos = Array.isArray(cargosData) ? cargosData : (cargosData?.results ?? []);

  // Auto-suggest based on proveedor name
  const suggested = useMemo(() => {
    if (!proveedor) return { email: '', username: '' };
    const nombre = (proveedor.nombre_comercial || proveedor.razon_social || '')
      .toLowerCase()
      .trim();
    if (!nombre) return { email: '', username: '' };
    const normalize = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '');
    const base = normalize(nombre);
    return { email: '', username: base };
  }, [proveedor]);

  // Pre-fill on open
  useEffect(() => {
    if (isOpen && proveedor) {
      setEmail(proveedor.email || '');
      setUsername(suggested.username);
      setCargoId('');
    }
  }, [isOpen, proveedor, suggested]);

  const isValid =
    email.trim().length > 0 && email.includes('@') && username.trim().length > 0 && cargoId !== '';

  const handleSubmit = async () => {
    if (!proveedor || !isValid || cargoId === '') return;
    await crearAccesoMutation.mutateAsync({
      id: proveedor.id,
      email: email.trim(),
      username: username.trim(),
      cargo_id: cargoId as number,
    });
    onClose();
  };

  const nombre = proveedor ? proveedor.nombre_comercial || proveedor.razon_social : '';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Acceso al Sistema"
      subtitle={nombre}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={crearAccesoMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || crearAccesoMutation.isPending}
          >
            {crearAccesoMutation.isPending ? (
              'Creando...'
            ) : (
              <>
                <Check size={16} className="mr-1" />
                Crear Acceso
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Alert
          variant="info"
          message={`Se creará una cuenta de acceso para el proveedor "${nombre}". Se enviará un correo electrónico para configurar la contraseña.`}
        />

        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Shield size={16} className="text-gray-500 shrink-0" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            El usuario recibirá un enlace para configurar su contraseña. El enlace expira en 72
            horas.
          </p>
        </div>

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@empresa.com"
          required
        />

        <Input
          label="Nombre de Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={suggested.username || 'nombre.usuario'}
          required
        />

        {/* Cargo dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cargo <span className="text-red-500">*</span>
          </label>
          <select
            value={cargoId}
            onChange={(e) => setCargoId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            required
          >
            <option value="">Seleccionar cargo...</option>
            {cargos.map((cargo: { id: number; name: string }) => (
              <option key={cargo.id} value={cargo.id}>
                {cargo.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            El cargo determina los permisos y acceso a módulos del usuario.
          </p>
        </div>

        {email && email.includes('@') && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Mail size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Se enviará un correo a <strong>{email}</strong> con un enlace para configurar la
              contraseña.
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
