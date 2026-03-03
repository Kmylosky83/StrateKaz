/**
 * CrearAccesoProveedorModal — Modal para crear acceso al sistema a un proveedor existente
 *
 * Lógica por tipo de proveedor:
 * - CONSULTOR, CONTRATISTA (servicios profesionales):
 *   - Con cargo → profesional colocado (acceso a módulos internos)
 *   - Sin cargo → representante de firma (solo Portal Proveedor + Mis Profesionales)
 * - Resto (MP, Productos, Transportista, Unidad Negocio):
 *   Solo acceso al Portal Proveedores. Cargo automático "Proveedor - Portal".
 *
 * Permite múltiples usuarios por proveedor.
 */
import { useState, useMemo, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Alert } from '@/components/common/Alert';
import { Shield, Mail, Check, Briefcase, Globe, Users } from 'lucide-react';
import { useCrearAccesoProveedor } from '../hooks/useProveedores';
import { useSelectCargos } from '@/hooks/useSelectLists';
import type { ProveedorList } from '../types';

// Tipos de proveedor que pueden tener cargo interno (opcional)
const TIPOS_PROFESIONALES = ['CONSULTOR', 'CONTRATISTA'];

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
  const { data: cargosData } = useSelectCargos();

  const cargos = cargosData || [];

  // ¿Este tipo de proveedor puede tener cargo interno?
  const esProfesional = useMemo(
    () => proveedor && TIPOS_PROFESIONALES.includes(proveedor.tipo_proveedor_codigo),
    [proveedor]
  );

  // Auto-suggest username based on proveedor name
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

  // Validación: email + username siempre requeridos. Cargo es OPCIONAL para profesionales.
  const isValid = useMemo(() => {
    return email.trim().length > 0 && email.includes('@') && username.trim().length > 0;
  }, [email, username]);

  const handleSubmit = async () => {
    if (!proveedor || !isValid) return;
    await crearAccesoMutation.mutateAsync({
      id: proveedor.id,
      email: email.trim(),
      username: username.trim(),
      // Solo enviar cargo_id si se seleccionó uno
      cargo_id: cargoId !== '' ? (cargoId as number) : undefined,
    });
    onClose();
  };

  const nombre = proveedor ? proveedor.nombre_comercial || proveedor.razon_social : '';
  const tipoNombre = proveedor?.tipo_proveedor_nombre || '';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Acceso al Sistema"
      subtitle={`${nombre} — ${tipoNombre}`}
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
        {/* Mensaje según tipo de acceso */}
        {esProfesional ? (
          <Alert
            variant="info"
            message={
              <div className="flex items-start gap-2">
                <Briefcase size={16} className="mt-0.5 shrink-0" />
                <span>
                  <strong>{tipoNombre}</strong> — Puedes crear dos tipos de acceso:
                  <br />
                  <strong>• Con cargo:</strong> Profesional colocado con acceso a módulos internos.
                  <br />
                  <strong>• Sin cargo:</strong> Representante de la firma con acceso solo al Portal.
                </span>
              </div>
            }
          />
        ) : (
          <Alert
            variant="info"
            message={
              <div className="flex items-start gap-2">
                <Globe size={16} className="mt-0.5 shrink-0" />
                <span>
                  <strong>{tipoNombre}</strong> — Se creará acceso al Portal de Proveedores donde
                  podrá consultar su información, contratos y evaluaciones.
                </span>
              </div>
            }
          />
        )}

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

        {/* Cargo: visible para consultores/contratistas (OPCIONAL) */}
        {esProfesional && (
          <>
            <Select
              label="Cargo en la Empresa (opcional)"
              value={cargoId}
              onChange={(e) => setCargoId(e.target.value ? Number(e.target.value) : '')}
              helperText="Sin cargo = representante de firma (solo Portal). Con cargo = profesional con acceso a módulos."
            >
              <option value="">Sin cargo — Solo Portal Proveedor</option>
              {cargos.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.label}
                </option>
              ))}
            </Select>

            {cargoId === '' && (
              <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Users size={16} className="text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Este usuario será <strong>representante de la firma</strong> y podrá gestionar los
                  profesionales colocados desde el tab &quot;Mis Profesionales&quot; en su Portal.
                </p>
              </div>
            )}
          </>
        )}

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
