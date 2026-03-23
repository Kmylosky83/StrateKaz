/**
 * Modal para Crear/Editar Empresas (Tenants).
 * Orquesta 7 tabs (sub-componentes en ./tenant-form-tabs/).
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, FileText, Phone, MapPin, Palette, Smartphone, Boxes } from 'lucide-react';

import { toast } from 'sonner';
import { Button } from '@/components/common/Button';
import { Tabs, Tab } from '@/components/common/Tabs';
import { useCreateTenant, useUpdateTenant, usePlans, useTenant } from '../hooks/useAdminGlobal';
import type { Tenant, CreateTenantDTO, UpdateTenantDTO } from '../types';
import {
  TabBasico,
  TabFiscal,
  TabContacto,
  TabRegional,
  TabBranding,
  TabPwa,
  TabModulos,
  createInitialFormData,
  tenantToFormData,
  buildFormDataWithFiles,
} from './tenant-form-tabs';
import type { AdminInitialData } from './tenant-form-tabs';

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant | null;
  onCreationStarted?: (id: number, name: string) => void;
}

type TabId = 'basico' | 'fiscal' | 'contacto' | 'regional' | 'branding' | 'pwa' | 'modulos';

/** Mapeo de campos del backend al tab que los contiene (para auto-navegación en errores) */
const FIELD_TAB_MAP: Record<string, TabId> = {
  // Administrador inicial
  admin_email: 'basico',
  admin_first_name: 'basico',
  admin_last_name: 'basico',
  admin_cargo_name: 'basico',
  // Básico
  name: 'basico',
  code: 'basico',
  subdomain: 'basico',
  plan: 'basico',
  tier: 'basico',
  max_users: 'basico',
  max_storage_gb: 'basico',
  is_active: 'basico',
  is_trial: 'basico',
  trial_ends_at: 'basico',
  subscription_ends_at: 'basico',
  notes: 'basico',
  // Fiscal
  nit: 'fiscal',
  razon_social: 'fiscal',
  nombre_comercial: 'fiscal',
  representante_legal: 'fiscal',
  cedula_representante: 'fiscal',
  tipo_sociedad: 'fiscal',
  actividad_economica: 'fiscal',
  regimen_tributario: 'fiscal',
  descripcion_actividad: 'fiscal',
  matricula_mercantil: 'fiscal',
  camara_comercio: 'fiscal',
  fecha_constitucion: 'fiscal',
  fecha_inscripcion_registro: 'fiscal',
  // Contacto
  direccion_fiscal: 'contacto',
  ciudad: 'contacto',
  departamento: 'contacto',
  pais: 'contacto',
  codigo_postal: 'contacto',
  telefono_principal: 'contacto',
  telefono_secundario: 'contacto',
  email_corporativo: 'contacto',
  sitio_web: 'contacto',
  // Regional
  zona_horaria: 'regional',
  formato_fecha: 'regional',
  moneda: 'regional',
  simbolo_moneda: 'regional',
  separador_miles: 'regional',
  separador_decimales: 'regional',
  // Branding
  primary_color: 'branding',
  secondary_color: 'branding',
  logo: 'branding',
  logo_white: 'branding',
  logo_dark: 'branding',
  favicon: 'branding',
  login_background: 'branding',
  // PWA
  pwa_name: 'pwa',
  pwa_short_name: 'pwa',
  pwa_description: 'pwa',
  pwa_theme_color: 'pwa',
  pwa_background_color: 'pwa',
  pwa_icon_192: 'pwa',
  pwa_icon_512: 'pwa',
  pwa_icon_maskable: 'pwa',
  // Módulos
  enabled_modules: 'modulos',
};

/** Labels legibles de los tabs para mensajes de error */
const TAB_LABELS: Record<TabId, string> = {
  basico: 'Básico',
  fiscal: 'Fiscal',
  contacto: 'Contacto',
  regional: 'Regional',
  branding: 'Branding',
  pwa: 'PWA',
  modulos: 'Módulos',
};

/**
 * Parsea la respuesta de error 400 de DRF.
 * DRF retorna: { "campo": ["Mensaje de error"] } o { "campo": "Mensaje" }
 * Retorna null si no es un error de validación de campos.
 */
const parseApiFieldErrors = (data: Record<string, unknown>): Record<string, string> | null => {
  if (!data || typeof data !== 'object') return null;
  // Si tiene 'detail' es un error genérico, no de campo
  if ('detail' in data && Object.keys(data).length === 1) return null;

  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(data)) {
    if (field === 'detail' || field === 'non_field_errors') continue;
    if (Array.isArray(messages) && messages.length > 0) {
      fieldErrors[field] = String(messages[0]);
    } else if (typeof messages === 'string') {
      fieldErrors[field] = messages;
    }
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
};

const TABS: Tab[] = [
  { id: 'basico', label: 'Basico', icon: <Building2 className="h-4 w-4" /> },
  { id: 'fiscal', label: 'Fiscal', icon: <FileText className="h-4 w-4" /> },
  { id: 'contacto', label: 'Contacto', icon: <Phone className="h-4 w-4" /> },
  { id: 'regional', label: 'Regional', icon: <MapPin className="h-4 w-4" /> },
  { id: 'branding', label: 'Branding', icon: <Palette className="h-4 w-4" /> },
  { id: 'pwa', label: 'PWA', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'modulos', label: 'Modulos', icon: <Boxes className="h-4 w-4" /> },
];

export const TenantFormModal = ({
  isOpen,
  onClose,
  tenant,
  onCreationStarted,
}: TenantFormModalProps) => {
  const isEditing = !!tenant;
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const { data: plans } = usePlans();

  // Fetch full tenant detail when editing (list endpoint uses TenantMinimalSerializer
  // which doesn't include fiscal, contact, regional, PWA, branding fields)
  const { data: fullTenant, isLoading: isLoadingDetail } = useTenant(tenant?.id ?? 0);

  const [activeTab, setActiveTab] = useState<TabId>('basico');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado para el administrador inicial (solo al crear)
  const [adminData, setAdminData] = useState<AdminInitialData>({
    admin_mode: 'new',
    admin_email: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_cargo_name: 'Administrador General',
  });

  // Estados para archivos de imagen
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoWhiteFile, setLogoWhiteFile] = useState<File | null>(null);
  const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [loginBackgroundFile, setLoginBackgroundFile] = useState<File | null>(null);
  const [pwaIcon192File, setPwaIcon192File] = useState<File | null>(null);
  const [pwaIcon512File, setPwaIcon512File] = useState<File | null>(null);
  const [pwaIconMaskableFile, setPwaIconMaskableFile] = useState<File | null>(null);

  // Estados para marcar eliminacion de imagenes
  const [clearImages, setClearImages] = useState<Record<string, boolean>>({});

  // Form data con todos los campos del Tenant
  const [formData, setFormData] = useState<UpdateTenantDTO & CreateTenantDTO>(
    createInitialFormData()
  );

  // Reset form when modal opens (new tenant) or clear state when closing
  useEffect(() => {
    if (!isOpen) return;

    if (!tenant) {
      const trialDate = new Date();
      trialDate.setDate(trialDate.getDate() + 14);
      setFormData(createInitialFormData(trialDate));
    }
    setActiveTab('basico');
    setErrors({});
    setAdminData({
      admin_mode: 'new',
      admin_email: '',
      admin_first_name: '',
      admin_last_name: '',
      admin_cargo_name: 'Administrador General',
    });
    setLogoFile(null);
    setLogoWhiteFile(null);
    setLogoDarkFile(null);
    setFaviconFile(null);
    setLoginBackgroundFile(null);
    setPwaIcon192File(null);
    setPwaIcon512File(null);
    setPwaIconMaskableFile(null);
    setClearImages({});
  }, [isOpen, tenant]);

  // Populate form when full tenant detail loads (editing mode)
  useEffect(() => {
    if (isOpen && fullTenant) {
      setFormData(tenantToFormData(fullTenant));
    }
  }, [isOpen, fullTenant]);

  // Handlers
  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const generateCode = () => {
    if (formData.name) {
      let code = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+/, '')
        .slice(0, 20);
      if (code && !/^[a-z]/.test(code)) {
        code = 'e_' + code;
      }
      handleChange('code', code);
    }
  };

  const generateSubdomain = () => {
    if (formData.name) {
      const subdomain = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 30);
      handleChange('subdomain', subdomain);
    }
  };

  const handleAdminChange = (field: keyof AdminInitialData, value: string) => {
    setAdminData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleModuleToggle = (moduleCode: string) => {
    const currentModules = formData.enabled_modules || [];
    const isEnabled = currentModules.includes(moduleCode);
    handleChange(
      'enabled_modules',
      isEnabled ? currentModules.filter((m) => m !== moduleCode) : [...currentModules, moduleCode]
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditing) {
      if (!formData.code?.trim()) {
        newErrors.code = 'El codigo es requerido';
      } else if (!/^[a-z][a-z0-9_]*$/.test(formData.code)) {
        newErrors.code = 'Debe empezar con letra. Solo minusculas, numeros y guion bajo';
      }
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!isEditing) {
      if (!formData.subdomain?.trim()) {
        newErrors.subdomain = 'El subdominio es requerido';
      } else if (!/^[a-z0-9]+$/.test(formData.subdomain)) {
        newErrors.subdomain = 'Solo letras minusculas y numeros';
      }
    }

    if (formData.is_trial && !formData.trial_ends_at) {
      newErrors.trial_ends_at = 'Fecha de fin de trial requerida';
    }

    // Validación del administrador inicial (solo al crear)
    if (!isEditing) {
      if (!adminData.admin_email?.trim()) {
        newErrors.admin_email = 'El email del administrador es requerido';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.admin_email)) {
        newErrors.admin_email = 'Email inválido';
      }
      if (adminData.admin_mode === 'new') {
        if (!adminData.admin_first_name?.trim()) {
          newErrors.admin_first_name = 'El nombre es requerido';
        }
        if (!adminData.admin_last_name?.trim()) {
          newErrors.admin_last_name = 'El apellido es requerido';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const imageFiles = {
      logo: logoFile,
      logo_white: logoWhiteFile,
      logo_dark: logoDarkFile,
      favicon: faviconFile,
      login_background: loginBackgroundFile,
      pwa_icon_192: pwaIcon192File,
      pwa_icon_512: pwaIcon512File,
      pwa_icon_maskable: pwaIconMaskableFile,
    };
    const hasFiles =
      Object.values(imageFiles).some(Boolean) || Object.values(clearImages).some(Boolean);

    try {
      if (isEditing && tenant) {
        const data = hasFiles
          ? buildFormDataWithFiles(formData, imageFiles, clearImages)
          : formData;
        await updateTenant.mutateAsync({ id: tenant.id, data });
        onClose();
      } else {
        const createPayload: CreateTenantDTO & Partial<AdminInitialData> = {
          ...(formData as CreateTenantDTO),
          ...adminData,
        };
        const response = await createTenant.mutateAsync(createPayload as CreateTenantDTO);
        onCreationStarted?.(response.id, response.name);
        onClose();
      }
    } catch (error: unknown) {
      // Parsear errores de validación 400 del backend y mapearlos a campos
      const axiosError = error as {
        response?: { status?: number; data?: Record<string, unknown> };
      };

      if (axiosError.response?.status === 400 && axiosError.response.data) {
        const fieldErrors = parseApiFieldErrors(axiosError.response.data);

        if (fieldErrors) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));

          // Navegar al tab del primer campo con error
          const firstErrorField = Object.keys(fieldErrors)[0];
          const targetTab = FIELD_TAB_MAP[firstErrorField];
          if (targetTab) setActiveTab(targetTab);

          // Toast informativo con los tabs afectados
          const affectedTabs = [
            ...new Set(
              Object.keys(fieldErrors)
                .map((f) => FIELD_TAB_MAP[f])
                .filter(Boolean)
                .map((t) => TAB_LABELS[t])
            ),
          ];
          toast.error(`Errores de validación en: ${affectedTabs.join(', ')}`, {
            description: 'Revisa los campos marcados en rojo',
          });
          return; // Evitar que el hook muestre un toast genérico duplicado
        }
      }
      // Para errores no-400 el hook ya muestra toast genérico
    }
  };

  const isLoading = createTenant.isPending || updateTenant.isPending;
  const effectiveTenant = fullTenant || tenant;

  if (!isOpen) return null;

  const sharedTabProps = { formData, handleChange, errors, isEditing };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basico':
        return (
          <TabBasico
            {...sharedTabProps}
            plans={plans}
            generateCode={generateCode}
            generateSubdomain={generateSubdomain}
            adminData={!isEditing ? adminData : undefined}
            onAdminChange={!isEditing ? handleAdminChange : undefined}
          />
        );
      case 'fiscal':
        return <TabFiscal {...sharedTabProps} />;
      case 'contacto':
        return <TabContacto {...sharedTabProps} />;
      case 'regional':
        return <TabRegional {...sharedTabProps} />;
      case 'branding':
        return (
          <TabBranding
            {...sharedTabProps}
            logoFile={logoFile}
            setLogoFile={setLogoFile}
            logoWhiteFile={logoWhiteFile}
            setLogoWhiteFile={setLogoWhiteFile}
            logoDarkFile={logoDarkFile}
            setLogoDarkFile={setLogoDarkFile}
            faviconFile={faviconFile}
            setFaviconFile={setFaviconFile}
            loginBackgroundFile={loginBackgroundFile}
            setLoginBackgroundFile={setLoginBackgroundFile}
            effectiveTenant={effectiveTenant}
            clearImages={clearImages}
            setClearImages={setClearImages}
          />
        );
      case 'pwa':
        return (
          <TabPwa
            {...sharedTabProps}
            pwaIcon192File={pwaIcon192File}
            setPwaIcon192File={setPwaIcon192File}
            pwaIcon512File={pwaIcon512File}
            setPwaIcon512File={setPwaIcon512File}
            pwaIconMaskableFile={pwaIconMaskableFile}
            setPwaIconMaskableFile={setPwaIconMaskableFile}
            effectiveTenant={effectiveTenant}
            clearImages={clearImages}
            setClearImages={setClearImages}
          />
        );
      case 'modulos':
        return <TabModulos {...sharedTabProps} handleModuleToggle={handleModuleToggle} />;
      default:
        return null;
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isEditing
                    ? 'Actualiza la configuracion completa'
                    : 'Crea una nueva empresa en la plataforma'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-4 flex-shrink-0">
            <Tabs
              tabs={TABS}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as TabId)}
              variant="pills"
            />
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-4 relative">
              {isEditing && isLoadingDetail ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Cargando datos de la empresa...
                    </p>
                  </div>
                </div>
              ) : (
                renderTabContent()
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || (isEditing && isLoadingDetail)}
              >
                {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Empresa'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default TenantFormModal;
