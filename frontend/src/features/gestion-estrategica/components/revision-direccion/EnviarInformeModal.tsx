/**
 * EnviarInformeModal — Modal para enviar el informe del acta por correo
 *
 * Permite ingresar destinatarios y un mensaje opcional.
 * El backend genera el PDF y lo adjunta al correo automáticamente.
 */
import { useState, useCallback } from 'react';
import { Mail, Plus, X, Loader2, Send } from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button, Badge } from '@/components/common';
import { Input, Textarea } from '@/components/forms';
import { useEnviarInforme } from '../../hooks/useRevisionDireccion';

interface EnviarInformeModalProps {
  isOpen: boolean;
  onClose: () => void;
  actaId: number;
  actaNumero: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EnviarInformeModal({
  isOpen,
  onClose,
  actaId,
  actaNumero,
}: EnviarInformeModalProps) {
  const [destinatarios, setDestinatarios] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const enviarMutation = useEnviarInforme();

  const handleAddEmail = useCallback(() => {
    const email = emailInput.trim().toLowerCase();

    if (!email) return;

    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Ingrese un correo electrónico válido');
      return;
    }

    if (destinatarios.includes(email)) {
      setEmailError('Este correo ya fue agregado');
      return;
    }

    setDestinatarios((prev) => [...prev, email]);
    setEmailInput('');
    setEmailError('');
  }, [emailInput, destinatarios]);

  const handleRemoveEmail = useCallback((email: string) => {
    setDestinatarios((prev) => prev.filter((e) => e !== email));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddEmail();
      }
    },
    [handleAddEmail]
  );

  const handleSend = useCallback(() => {
    if (destinatarios.length === 0) return;

    enviarMutation.mutate(
      {
        actaId,
        data: {
          destinatarios,
          mensaje: mensaje || undefined,
        },
      },
      {
        onSuccess: () => {
          setDestinatarios([]);
          setMensaje('');
          setEmailInput('');
          onClose();
        },
      }
    );
  }, [actaId, destinatarios, mensaje, enviarMutation, onClose]);

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button variant="ghost" onClick={onClose} disabled={enviarMutation.isPending}>
        Cancelar
      </Button>
      <Button
        onClick={handleSend}
        disabled={destinatarios.length === 0 || enviarMutation.isPending}
        leftIcon={
          enviarMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )
        }
      >
        {enviarMutation.isPending
          ? 'Enviando...'
          : `Enviar a ${destinatarios.length} destinatario(s)`}
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Informe por Correo"
      subtitle={`Acta ${actaNumero}`}
      size="md"
      footer={footer}
    >
      <div className="space-y-5">
        {/* Descripción */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Se generará un PDF del acta de revisión y se enviará como adjunto a los destinatarios
            indicados.
          </p>
        </div>

        {/* Email input */}
        <div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Destinatarios"
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setEmailError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="correo@empresa.com"
                error={emailError}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddEmail}
              className="mb-0.5"
              disabled={!emailInput.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Presione Enter o el botón + para agregar cada correo
          </p>
        </div>

        {/* Lista de destinatarios */}
        {destinatarios.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {destinatarios.map((email) => (
              <Badge key={email} variant="info" size="sm">
                <span className="mr-1">{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  className="ml-0.5 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Mensaje personalizado */}
        <Textarea
          label="Mensaje personalizado (opcional)"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={3}
          placeholder="Estimados, adjunto encontrarán el acta de revisión por la dirección..."
        />
      </div>
    </BaseModal>
  );
}
