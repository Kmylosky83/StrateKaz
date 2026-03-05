/**
 * Modal para Crear/Editar Empresas (Tenants).
 * Orquesta 7 tabs (sub-componentes en ./tenant-form-tabs/).
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, FileText, Phone, MapPin, Palette, Smartphone, Boxes } from 'lucide-react';

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

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant | null;
  onCreationStarted?: (id: number, name: string) => void;
}

type TabId = 'basico' | 'fiscal' | 'contacto' | 'regional' | 'branding' | 'pwa' | 'modulos';

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
        const response = await createTenant.mutateAsync(formData as CreateTenantDTO);
        onCreationStarted?.(response.id, response.name);
        onClose();
      }
    } catch {
      // Error handled by hook
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
