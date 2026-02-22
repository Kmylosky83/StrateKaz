/**
 * CrearAccesoModal - Modal para crear acceso al sistema a un colaborador existente
 *
 * Se usa desde la lista de colaboradores cuando un empleado no tiene usuario.
 * Envia email de configuración de contraseña al correo corporativo.
 */
import { useState, useMemo, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Alert } from '@/components/common/Alert';
import { Shield, Mail, Check } from 'lucide-react';
import { useCrearAccesoColaborador } from '../../hooks/useColaboradores';
import type { Colaborador } from '../../types';

interface CrearAccesoModalProps {
  colaborador: Colaborador | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CrearAccesoModal({ colaborador, isOpen, onClose }: CrearAccesoModalProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const crearAccesoMutation = useCrearAccesoColaborador();

  // Auto-suggest based on colaborador name
  const suggested = useMemo(() => {
    if (!colaborador) return { email: '', username: '' };
    const nombre = (colaborador.primer_nombre || '').toLowerCase().trim();
    const apellido = (colaborador.primer_apellido || '').toLowerCase().trim();
    if (!nombre || !apellido) return { email: '', username: '' };
    const normalize = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '');
    const base = `${normalize(nombre)}.${normalize(apellido)}`;
    return { email: `${base}@empresa.com`, username: base };
  }, [colaborador]);

  // Pre-fill on open
  useEffect(() => {
    if (isOpen && colaborador) {
      setEmail(suggested.email);
      setUsername(suggested.username);
    }
  }, [isOpen, colaborador, suggested]);

  const isValid = email.trim().length > 0 && email.includes('@') && username.trim().length > 0;

  const handleSubmit = async () => {
    if (!colaborador || !isValid) return;
    await crearAccesoMutation.mutateAsync({
      id: String(colaborador.id),
      email_corporativo: email.trim(),
      username: username.trim(),
    });
    onClose();
  };

  const nombre = colaborador ? `${colaborador.primer_nombre} ${colaborador.primer_apellido}` : '';

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
          message={`Se creará una cuenta de acceso para ${nombre}. Se enviará un correo electrónico para configurar la contraseña.`}
        />

        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Shield size={16} className="text-gray-500 shrink-0" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            El colaborador recibirá un enlace para configurar su contraseña. El enlace expira en 72
            horas.
          </p>
        </div>

        <Input
          label="Email Corporativo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={suggested.email || 'correo@empresa.com'}
          required
        />

        <Input
          label="Nombre de Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={suggested.username || 'nombre.apellido'}
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
