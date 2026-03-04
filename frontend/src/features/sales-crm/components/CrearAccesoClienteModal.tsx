/**
 * CrearAccesoClienteModal - Modal para crear acceso al portal de clientes
 *
 * Crea un usuario con cargo CLIENTE_PORTAL vinculado al cliente.
 * El usuario recibirá un email para configurar su contraseña.
 */
import { useState, useMemo, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Alert } from '@/components/common/Alert';
import { Shield, Mail, Check, Globe } from 'lucide-react';
import { useCrearAccesoCliente } from '../hooks';
import type { ClienteList } from '../types';

interface CrearAccesoClienteModalProps {
  cliente: ClienteList | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CrearAccesoClienteModal({
  cliente,
  isOpen,
  onClose,
}: CrearAccesoClienteModalProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const crearAccesoMutation = useCrearAccesoCliente();

  // Auto-suggest username based on cliente name
  const suggested = useMemo(() => {
    if (!cliente) return { email: '', username: '' };
    const nombre = (cliente.nombre_comercial || cliente.razon_social || '').toLowerCase().trim();
    if (!nombre) return { email: '', username: '' };
    const normalize = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '');
    const base = normalize(nombre);
    return { email: '', username: base };
  }, [cliente]);

  // Pre-fill on open
  useEffect(() => {
    if (isOpen && cliente) {
      setEmail(cliente.email || '');
      setUsername(suggested.username);
    }
  }, [isOpen, cliente, suggested]);

  const isValid = useMemo(() => {
    return email.trim().length > 0 && email.includes('@') && username.trim().length > 0;
  }, [email, username]);

  const handleSubmit = async () => {
    if (!cliente || !isValid) return;
    await crearAccesoMutation.mutateAsync({
      id: cliente.id,
      email: email.trim(),
      username: username.trim(),
    });
    onClose();
  };

  const nombre = cliente ? cliente.nombre_comercial || cliente.razon_social : '';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Acceso al Portal"
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
          message={
            <div className="flex items-start gap-2">
              <Globe size={16} className="mt-0.5 shrink-0" />
              <span>
                Se creará acceso al <strong>Portal de Clientes</strong> donde podrá consultar su
                información, pedidos, facturas y estado de cuenta.
              </span>
            </div>
          }
        />

        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Shield size={16} className="text-gray-500 shrink-0" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            El usuario recibirá un enlace para configurar su contraseña. El enlace expira en 7 días.
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
