/**
 * Modal para Crear/Editar Empresas (Tenants)
 *
 * Formulario completo con tabs profesionales para gestión de tenants.
 * Usa el Design System de StrateKaz (Modal, Tabs, Input, Select, Button).
 *
 * ARQUITECTURA:
 * - Tab 1: Datos Basicos (identificacion, plan, estado)
 * - Tab 2: Datos Fiscales (NIT, razon social, representante)
 * - Tab 3: Contacto (direccion, telefonos, email)
 * - Tab 4: Regional (zona horaria, formato fecha, moneda)
 * - Tab 5: Branding (logos, colores, imagenes)
 * - Tab 6: PWA (configuracion de app movil, iconos)
 * - Tab 7: Modulos (seleccion de modulos habilitados)
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  Globe,
  FileText,
  Phone,
  MapPin,
  Palette,
  Smartphone,
  Boxes,
  Check,
  Users,
  Database,
  Calendar,
  Scale,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/common/Button';
import { Tabs, Tab } from '@/components/common/Tabs';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { AVAILABLE_MODULES, DEFAULT_ENABLED_MODULES } from '@/constants/modules';
import { useCreateTenant, useUpdateTenant, usePlans, useTenant } from '../hooks/useAdminGlobal';
import type { Tenant, CreateTenantDTO, UpdateTenantDTO, TenantTier } from '../types';
import { TenantCreationProgress } from './TenantCreationProgress';
import { useAuthStore } from '@/store/authStore';

// =============================================================================
// IMAGE UPLOAD COMPONENT
// =============================================================================

interface ImageUploadProps {
  label: string;
  value: File | null;
  previewUrl?: string | null;
  onChange: (file: File | null) => void;
  onClear?: () => void;
  accept?: string;
  hint?: string;
  darkPreview?: boolean;
}

const ImageUpload = ({
  label,
  value,
  previewUrl,
  onChange,
  onClear,
  accept = 'image/*',
  hint,
  darkPreview = false,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      setCleared(false);
      return () => URL.revokeObjectURL(url);
    } else if (previewUrl && !cleared) {
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }
  }, [value, previewUrl, cleared]);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
    if (file) setCleared(false);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
    setPreview(null);
    setCleared(true);
    onClear?.();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative inline-block">
          <div
            className={`p-3 rounded-lg border-2 border-dashed ${
              darkPreview
                ? 'bg-gray-800 border-gray-600'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
            }`}
          >
            <img src={preview} alt={label} className="h-14 max-w-[150px] object-contain" />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Upload className="h-5 w-5 text-gray-400 mb-1" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Click para subir</span>
        </button>
      )}

      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
};

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant | null;
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

const TIER_OPTIONS = [
  { value: 'starter', label: 'Starter' },
  { value: 'small', label: 'Pequena' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
  { value: 'enterprise', label: 'Enterprise' },
];

const TIPO_SOCIEDAD_OPTIONS = [
  { value: 'SAS', label: 'S.A.S. - Sociedad por Acciones Simplificada' },
  { value: 'SA', label: 'S.A. - Sociedad Anonima' },
  { value: 'LTDA', label: 'Ltda. - Sociedad Limitada' },
  { value: 'SCA', label: 'Sociedad en Comandita por Acciones' },
  { value: 'SC', label: 'Sociedad en Comandita Simple' },
  { value: 'COLECTIVA', label: 'Sociedad Colectiva' },
  { value: 'ESAL', label: 'Entidad Sin Animo de Lucro' },
  { value: 'PERSONA_NATURAL', label: 'Persona Natural' },
  { value: 'SUCURSAL_EXTRANJERA', label: 'Sucursal de Sociedad Extranjera' },
  { value: 'OTRO', label: 'Otro' },
];

const REGIMEN_OPTIONS = [
  { value: 'COMUN', label: 'Regimen Comun (Responsable de IVA)' },
  { value: 'SIMPLE', label: 'Regimen Simple de Tributacion (RST)' },
  { value: 'NO_RESPONSABLE', label: 'No Responsable de IVA' },
  { value: 'ESPECIAL', label: 'Regimen Tributario Especial' },
  { value: 'GRAN_CONTRIBUYENTE', label: 'Gran Contribuyente' },
];

const DEPARTAMENTOS_OPTIONS = [
  { value: 'AMAZONAS', label: 'Amazonas' },
  { value: 'ANTIOQUIA', label: 'Antioquia' },
  { value: 'ARAUCA', label: 'Arauca' },
  { value: 'ATLANTICO', label: 'Atlantico' },
  { value: 'BOLIVAR', label: 'Bolivar' },
  { value: 'BOYACA', label: 'Boyaca' },
  { value: 'CALDAS', label: 'Caldas' },
  { value: 'CAQUETA', label: 'Caqueta' },
  { value: 'CASANARE', label: 'Casanare' },
  { value: 'CAUCA', label: 'Cauca' },
  { value: 'CESAR', label: 'Cesar' },
  { value: 'CHOCO', label: 'Choco' },
  { value: 'CORDOBA', label: 'Cordoba' },
  { value: 'CUNDINAMARCA', label: 'Cundinamarca' },
  { value: 'GUAINIA', label: 'Guainia' },
  { value: 'GUAVIARE', label: 'Guaviare' },
  { value: 'HUILA', label: 'Huila' },
  { value: 'LA_GUAJIRA', label: 'La Guajira' },
  { value: 'MAGDALENA', label: 'Magdalena' },
  { value: 'META', label: 'Meta' },
  { value: 'NARINO', label: 'Narino' },
  { value: 'NORTE_DE_SANTANDER', label: 'Norte de Santander' },
  { value: 'PUTUMAYO', label: 'Putumayo' },
  { value: 'QUINDIO', label: 'Quindio' },
  { value: 'RISARALDA', label: 'Risaralda' },
  { value: 'SAN_ANDRES', label: 'San Andres y Providencia' },
  { value: 'SANTANDER', label: 'Santander' },
  { value: 'SUCRE', label: 'Sucre' },
  { value: 'TOLIMA', label: 'Tolima' },
  { value: 'VALLE_DEL_CAUCA', label: 'Valle del Cauca' },
  { value: 'VAUPES', label: 'Vaupes' },
  { value: 'VICHADA', label: 'Vichada' },
];

const ZONA_HORARIA_OPTIONS = [
  { value: 'America/Bogota', label: 'Colombia (America/Bogota)' },
  { value: 'America/New_York', label: 'Este EEUU (America/New_York)' },
  { value: 'America/Los_Angeles', label: 'Pacifico EEUU (America/Los_Angeles)' },
  { value: 'America/Mexico_City', label: 'Mexico (America/Mexico_City)' },
  { value: 'Europe/Madrid', label: 'Espana (Europe/Madrid)' },
  { value: 'UTC', label: 'UTC' },
];

const FORMATO_FECHA_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2024)' },
];

const MONEDA_OPTIONS = [
  { value: 'COP', label: 'Peso Colombiano (COP)' },
  { value: 'USD', label: 'Dolar Estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

// AVAILABLE_MODULES y DEFAULT_ENABLED_MODULES importados de @/constants/modules

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  STRATEGIC: { label: 'Nivel Estrategico', icon: <Scale className="h-4 w-4" /> },
  COMPLIANCE: { label: 'Motores de Cumplimiento', icon: <FileText className="h-4 w-4" /> },
  INTEGRATED: { label: 'Gestion Integral', icon: <Building2 className="h-4 w-4" /> },
  OPERATIONAL: { label: 'Operaciones', icon: <Database className="h-4 w-4" /> },
  SUPPORT: { label: 'Soporte', icon: <Users className="h-4 w-4" /> },
  INTELLIGENCE: { label: 'Inteligencia', icon: <Globe className="h-4 w-4" /> },
};

// =============================================================================
// COMPONENT
// =============================================================================

export const TenantFormModal = ({ isOpen, onClose, tenant }: TenantFormModalProps) => {
  const isEditing = !!tenant;
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const { data: plans } = usePlans();
  const refreshTenantProfile = useAuthStore((state) => state.refreshTenantProfile);

  // Fetch full tenant detail when editing (list endpoint uses TenantMinimalSerializer
  // which doesn't include fiscal, contact, regional, PWA, branding fields)
  const { data: fullTenant, isLoading: isLoadingDetail } = useTenant(tenant?.id ?? 0);

  const [activeTab, setActiveTab] = useState<TabId>('basico');
  const [creatingTenant, setCreatingTenant] = useState<{ id: number; name: string } | null>(null);
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

  // Estados para marcar eliminación de imágenes
  const [clearImages, setClearImages] = useState<Record<string, boolean>>({});

  // Form data con todos los campos del Tenant
  const [formData, setFormData] = useState<UpdateTenantDTO & CreateTenantDTO>({
    // Basico
    code: '',
    name: '',
    subdomain: '',
    plan: null,
    tier: 'starter',
    max_users: 5,
    max_storage_gb: 5,
    is_active: true,
    is_trial: true,
    trial_ends_at: '',
    subscription_ends_at: '',
    notes: '',
    // Fiscal
    nit: '',
    razon_social: '',
    nombre_comercial: '',
    representante_legal: '',
    cedula_representante: '',
    tipo_sociedad: 'SAS',
    actividad_economica: '',
    descripcion_actividad: '',
    regimen_tributario: 'COMUN',
    // Contacto
    direccion_fiscal: '',
    ciudad: '',
    departamento: '',
    pais: 'Colombia',
    codigo_postal: '',
    telefono_principal: '',
    telefono_secundario: '',
    email_corporativo: '',
    sitio_web: '',
    // Registro Mercantil
    matricula_mercantil: '',
    camara_comercio: '',
    fecha_constitucion: null,
    fecha_inscripcion_registro: null,
    // Regional
    zona_horaria: 'America/Bogota',
    formato_fecha: 'DD/MM/YYYY',
    moneda: 'COP',
    simbolo_moneda: '$',
    separador_miles: '.',
    separador_decimales: ',',
    // Branding
    primary_color: '#6366F1',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    sidebar_color: '#1E293B',
    background_color: '#F5F5F5',
    company_slogan: '',
    // PWA
    pwa_name: '',
    pwa_short_name: '',
    pwa_description: '',
    pwa_theme_color: '#6366F1',
    pwa_background_color: '#FFFFFF',
    // Modulos
    enabled_modules: DEFAULT_ENABLED_MODULES,
  });

  // Helper to populate form from tenant data
  const populateFormFromTenant = (t: Tenant) => {
    setFormData({
      code: t.code || '',
      name: t.name || '',
      subdomain: t.subdomain || '',
      plan: t.plan || null,
      tier: t.tier || 'starter',
      max_users: t.max_users ?? 5,
      max_storage_gb: t.max_storage_gb ?? 5,
      is_active: t.is_active ?? true,
      is_trial: t.is_trial ?? false,
      trial_ends_at: t.trial_ends_at?.split('T')[0] || '',
      subscription_ends_at: t.subscription_ends_at?.split('T')[0] || '',
      notes: t.notes || '',
      nit: t.nit || '',
      razon_social: t.razon_social || '',
      nombre_comercial: t.nombre_comercial || '',
      representante_legal: t.representante_legal || '',
      cedula_representante: t.cedula_representante || '',
      tipo_sociedad: t.tipo_sociedad || 'SAS',
      actividad_economica: t.actividad_economica || '',
      descripcion_actividad: t.descripcion_actividad || '',
      regimen_tributario: t.regimen_tributario || 'COMUN',
      direccion_fiscal: t.direccion_fiscal || '',
      ciudad: t.ciudad || '',
      departamento: t.departamento || '',
      pais: t.pais || 'Colombia',
      codigo_postal: t.codigo_postal || '',
      telefono_principal: t.telefono_principal || '',
      telefono_secundario: t.telefono_secundario || '',
      email_corporativo: t.email_corporativo || '',
      sitio_web: t.sitio_web || '',
      matricula_mercantil: t.matricula_mercantil || '',
      camara_comercio: t.camara_comercio || '',
      fecha_constitucion: t.fecha_constitucion?.split('T')[0] || null,
      fecha_inscripcion_registro: t.fecha_inscripcion_registro?.split('T')[0] || null,
      zona_horaria: t.zona_horaria || 'America/Bogota',
      formato_fecha: t.formato_fecha || 'DD/MM/YYYY',
      moneda: t.moneda || 'COP',
      simbolo_moneda: t.simbolo_moneda || '$',
      separador_miles: t.separador_miles || '.',
      separador_decimales: t.separador_decimales || ',',
      primary_color: t.primary_color || '#6366F1',
      secondary_color: t.secondary_color || '#10B981',
      accent_color: t.accent_color || '#F59E0B',
      sidebar_color: t.sidebar_color || '#1E293B',
      background_color: t.background_color || '#F5F5F5',
      company_slogan: t.company_slogan || '',
      pwa_name: t.pwa_name || '',
      pwa_short_name: t.pwa_short_name || '',
      pwa_description: t.pwa_description || '',
      pwa_theme_color: t.pwa_theme_color || '#6366F1',
      pwa_background_color: t.pwa_background_color || '#FFFFFF',
      enabled_modules: t.enabled_modules || DEFAULT_ENABLED_MODULES,
    });
  };

  // Reset form when modal opens (new tenant) or clear state when closing
  useEffect(() => {
    if (!isOpen) return;

    if (!tenant) {
      // Reset for new tenant
      const trialDate = new Date();
      trialDate.setDate(trialDate.getDate() + 14);

      setFormData({
        code: '',
        name: '',
        subdomain: '',
        plan: null,
        tier: 'starter',
        max_users: 5,
        max_storage_gb: 5,
        is_active: true,
        is_trial: true,
        trial_ends_at: trialDate.toISOString().split('T')[0],
        subscription_ends_at: '',
        notes: '',
        nit: '',
        razon_social: '',
        nombre_comercial: '',
        representante_legal: '',
        cedula_representante: '',
        tipo_sociedad: 'SAS',
        actividad_economica: '',
        descripcion_actividad: '',
        regimen_tributario: 'COMUN',
        direccion_fiscal: '',
        ciudad: '',
        departamento: '',
        pais: 'Colombia',
        codigo_postal: '',
        telefono_principal: '',
        telefono_secundario: '',
        email_corporativo: '',
        sitio_web: '',
        matricula_mercantil: '',
        camara_comercio: '',
        fecha_constitucion: null,
        fecha_inscripcion_registro: null,
        zona_horaria: 'America/Bogota',
        formato_fecha: 'DD/MM/YYYY',
        moneda: 'COP',
        simbolo_moneda: '$',
        separador_miles: '.',
        separador_decimales: ',',
        primary_color: '#6366F1',
        secondary_color: '#10B981',
        accent_color: '#F59E0B',
        sidebar_color: '#1E293B',
        background_color: '#F5F5F5',
        company_slogan: '',
        pwa_name: '',
        pwa_short_name: '',
        pwa_description: '',
        pwa_theme_color: '#6366F1',
        pwa_background_color: '#FFFFFF',
        enabled_modules: DEFAULT_ENABLED_MODULES,
      });
    }
    setActiveTab('basico');
    setErrors({});
    // Reset file states
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
  // This runs after useTenant() returns the complete data from GET /tenants/{id}/
  useEffect(() => {
    if (isOpen && fullTenant) {
      populateFormFromTenant(fullTenant);
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

    // Verificar si hay archivos para subir
    const hasFiles =
      logoFile ||
      logoWhiteFile ||
      logoDarkFile ||
      faviconFile ||
      loginBackgroundFile ||
      pwaIcon192File ||
      pwaIcon512File ||
      pwaIconMaskableFile ||
      Object.values(clearImages).some(Boolean);

    try {
      if (isEditing && tenant) {
        if (hasFiles) {
          // Usar FormData para enviar archivos
          const formDataToSend = new FormData();

          // Campos inmutables que el backend rechaza en update (PATCH)
          const EXCLUDED_FIELDS = ['code', 'subdomain', 'notes'];

          // Agregar campos de texto (excluyendo inmutables)
          Object.entries(formData).forEach(([key, value]) => {
            if (EXCLUDED_FIELDS.includes(key)) return;
            if (value !== null && value !== undefined && value !== '') {
              if (Array.isArray(value)) {
                formDataToSend.append(key, JSON.stringify(value));
              } else {
                formDataToSend.append(key, String(value));
              }
            }
          });

          // Agregar archivos nuevos
          if (logoFile) formDataToSend.append('logo', logoFile);
          if (logoWhiteFile) formDataToSend.append('logo_white', logoWhiteFile);
          if (logoDarkFile) formDataToSend.append('logo_dark', logoDarkFile);
          if (faviconFile) formDataToSend.append('favicon', faviconFile);
          if (loginBackgroundFile) formDataToSend.append('login_background', loginBackgroundFile);
          if (pwaIcon192File) formDataToSend.append('pwa_icon_192', pwaIcon192File);
          if (pwaIcon512File) formDataToSend.append('pwa_icon_512', pwaIcon512File);
          if (pwaIconMaskableFile) formDataToSend.append('pwa_icon_maskable', pwaIconMaskableFile);

          // Marcar campos a eliminar
          Object.entries(clearImages).forEach(([key, value]) => {
            if (value) formDataToSend.append(`${key}_clear`, 'true');
          });

          await updateTenant.mutateAsync({ id: tenant.id, data: formDataToSend });
        } else {
          await updateTenant.mutateAsync({ id: tenant.id, data: formData });
        }
        onClose();
      } else {
        const response = await createTenant.mutateAsync(formData as CreateTenantDTO);
        setCreatingTenant({ id: response.id, name: response.name });
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleCreationComplete = () => {
    setCreatingTenant(null);
    // Refrescar lista de tenants accesibles en el header (TenantSwitcher)
    refreshTenantProfile();
    onClose();
  };

  const isLoading = createTenant.isPending || updateTenant.isPending;

  // Use full detail data for image previews (fallback to list data)
  const effectiveTenant = fullTenant || tenant;

  if (!isOpen) return null;

  if (creatingTenant) {
    return (
      <TenantCreationProgress
        tenantId={creatingTenant.id}
        tenantName={creatingTenant.name}
        onComplete={handleCreationComplete}
        onClose={handleCreationComplete}
      />
    );
  }

  // =============================================================================
  // RENDER TABS CONTENT
  // =============================================================================

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basico':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de la empresa *"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => {
                if (!formData.code) generateCode();
                if (!formData.subdomain) generateSubdomain();
              }}
              error={errors.name}
              placeholder="Mi Empresa S.A.S."
            />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Codigo unico *"
                  value={formData.code || ''}
                  onChange={(e) => handleChange('code', e.target.value)}
                  disabled={isEditing}
                  error={errors.code}
                  placeholder="mi_empresa"
                />
              </div>
              {!isEditing && (
                <Button type="button" variant="outline" onClick={generateCode} className="mb-0">
                  Auto
                </Button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subdominio *
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={formData.subdomain || ''}
                  onChange={(e) => handleChange('subdomain', e.target.value)}
                  disabled={isEditing}
                  className={`flex-1 px-3 py-2 border rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${
                    isEditing ? 'opacity-50 cursor-not-allowed' : ''
                  } ${errors.subdomain ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="miempresa"
                />
                <span className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-500 dark:text-gray-400 text-sm">
                  .stratekaz.com
                </span>
              </div>
              {errors.subdomain && (
                <p className="text-xs text-danger-600 mt-1">{errors.subdomain}</p>
              )}
            </div>
            <Select
              label="Plan"
              value={formData.plan ?? ''}
              onChange={(e) =>
                handleChange('plan', e.target.value === '' ? null : Number(e.target.value))
              }
              options={[
                { value: '', label: 'Sin plan asignado' },
                ...(plans?.map((p) => ({
                  value: p.id,
                  label: `${p.name} - $${p.price_monthly}/mes`,
                })) || []),
              ]}
            />
            <Select
              label="Tier"
              value={formData.tier || 'starter'}
              onChange={(e) => handleChange('tier', e.target.value)}
              options={TIER_OPTIONS}
            />
            <Input
              label="Maximo de usuarios"
              type="number"
              value={formData.max_users || 5}
              onChange={(e) => handleChange('max_users', Number(e.target.value))}
              min={1}
              leftIcon={<Users className="h-4 w-4" />}
            />
            <Input
              label="Almacenamiento (GB)"
              type="number"
              value={formData.max_storage_gb || 5}
              onChange={(e) => handleChange('max_storage_gb', Number(e.target.value))}
              min={1}
              leftIcon={<Database className="h-4 w-4" />}
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Empresa activa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_trial}
                  onChange={(e) => handleChange('is_trial', e.target.checked)}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Periodo de prueba</span>
              </label>
            </div>
            {formData.is_trial && (
              <Input
                label="Fin del trial *"
                type="date"
                value={formData.trial_ends_at || ''}
                onChange={(e) => handleChange('trial_ends_at', e.target.value)}
                error={errors.trial_ends_at}
                leftIcon={<Calendar className="h-4 w-4" />}
              />
            )}
            <Input
              label="Fin de suscripcion"
              type="date"
              value={formData.subscription_ends_at || ''}
              onChange={(e) => handleChange('subscription_ends_at', e.target.value)}
              leftIcon={<Calendar className="h-4 w-4" />}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Notas internas"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Notas internas sobre esta empresa..."
                rows={2}
              />
            </div>
          </div>
        );

      case 'fiscal':
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

      case 'contacto':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Textarea
                label="Direccion Fiscal"
                value={formData.direccion_fiscal || ''}
                onChange={(e) => handleChange('direccion_fiscal', e.target.value)}
                placeholder="Calle 100 # 19-61"
                rows={2}
              />
            </div>
            <Input
              label="Ciudad"
              value={formData.ciudad || ''}
              onChange={(e) => handleChange('ciudad', e.target.value)}
              placeholder="Bogota"
            />
            <Select
              label="Departamento"
              value={formData.departamento || ''}
              onChange={(e) => handleChange('departamento', e.target.value)}
              options={[{ value: '', label: 'Seleccionar...' }, ...DEPARTAMENTOS_OPTIONS]}
            />
            <Input
              label="Pais"
              value={formData.pais || 'Colombia'}
              onChange={(e) => handleChange('pais', e.target.value)}
            />
            <Input
              label="Codigo Postal"
              value={formData.codigo_postal || ''}
              onChange={(e) => handleChange('codigo_postal', e.target.value)}
              placeholder="110111"
            />
            <Input
              label="Telefono Principal"
              value={formData.telefono_principal || ''}
              onChange={(e) => handleChange('telefono_principal', e.target.value)}
              placeholder="+57 601 1234567"
              leftIcon={<Phone className="h-4 w-4" />}
            />
            <Input
              label="Telefono Secundario"
              value={formData.telefono_secundario || ''}
              onChange={(e) => handleChange('telefono_secundario', e.target.value)}
              placeholder="+57 300 1234567"
              leftIcon={<Phone className="h-4 w-4" />}
            />
            <Input
              label="Email Corporativo"
              type="email"
              value={formData.email_corporativo || ''}
              onChange={(e) => handleChange('email_corporativo', e.target.value)}
              placeholder="contacto@miempresa.com"
            />
            <Input
              label="Sitio Web"
              value={formData.sitio_web || ''}
              onChange={(e) => handleChange('sitio_web', e.target.value)}
              placeholder="https://www.miempresa.com"
              leftIcon={<Globe className="h-4 w-4" />}
            />
          </div>
        );

      case 'regional':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Zona Horaria"
              value={formData.zona_horaria || 'America/Bogota'}
              onChange={(e) => handleChange('zona_horaria', e.target.value)}
              options={ZONA_HORARIA_OPTIONS}
            />
            <Select
              label="Formato de Fecha"
              value={formData.formato_fecha || 'DD/MM/YYYY'}
              onChange={(e) => handleChange('formato_fecha', e.target.value)}
              options={FORMATO_FECHA_OPTIONS}
            />
            <Select
              label="Moneda"
              value={formData.moneda || 'COP'}
              onChange={(e) => handleChange('moneda', e.target.value)}
              options={MONEDA_OPTIONS}
            />
            <Input
              label="Simbolo de Moneda"
              value={formData.simbolo_moneda || '$'}
              onChange={(e) => handleChange('simbolo_moneda', e.target.value)}
              placeholder="$"
            />
            <Input
              label="Separador de Miles"
              value={formData.separador_miles || '.'}
              onChange={(e) => handleChange('separador_miles', e.target.value)}
              placeholder="."
              maxLength={1}
            />
            <Input
              label="Separador de Decimales"
              value={formData.separador_decimales || ','}
              onChange={(e) => handleChange('separador_decimales', e.target.value)}
              placeholder=","
              maxLength={1}
            />
          </div>
        );

      case 'branding':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Slogan de la Empresa"
                value={formData.company_slogan || ''}
                onChange={(e) => handleChange('company_slogan', e.target.value)}
                placeholder="Innovacion con proposito"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color Primario
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primary_color || '#6366F1'}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  value={formData.primary_color || '#6366F1'}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  placeholder="#6366F1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color Secundario
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.secondary_color || '#10B981'}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  value={formData.secondary_color || '#10B981'}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  placeholder="#10B981"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color de Acento
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.accent_color || '#F59E0B'}
                  onChange={(e) => handleChange('accent_color', e.target.value)}
                  className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  value={formData.accent_color || '#F59E0B'}
                  onChange={(e) => handleChange('accent_color', e.target.value)}
                  placeholder="#F59E0B"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color del Sidebar
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.sidebar_color || '#1E293B'}
                  onChange={(e) => handleChange('sidebar_color', e.target.value)}
                  className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  value={formData.sidebar_color || '#1E293B'}
                  onChange={(e) => handleChange('sidebar_color', e.target.value)}
                  placeholder="#1E293B"
                />
              </div>
            </div>
            {/* Seccion de Logos - Solo en edicion */}
            {isEditing && (
              <>
                <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Logos e Imagenes
                  </h4>
                </div>
                <ImageUpload
                  label="Logo Principal"
                  value={logoFile}
                  previewUrl={effectiveTenant?.logo}
                  onChange={setLogoFile}
                  onClear={() => setClearImages((prev) => ({ ...prev, logo: true }))}
                  accept="image/png,image/jpeg,image/svg+xml"
                  hint="Para fondos claros (PNG, JPG, SVG)"
                />
                <ImageUpload
                  label="Logo Blanco"
                  value={logoWhiteFile}
                  previewUrl={effectiveTenant?.logo_white}
                  onChange={setLogoWhiteFile}
                  onClear={() => setClearImages((prev) => ({ ...prev, logo_white: true }))}
                  accept="image/png,image/svg+xml"
                  hint="Para fondos oscuros (PNG, SVG)"
                  darkPreview
                />
                <ImageUpload
                  label="Logo Modo Oscuro"
                  value={logoDarkFile}
                  previewUrl={effectiveTenant?.logo_dark}
                  onChange={setLogoDarkFile}
                  onClear={() => setClearImages((prev) => ({ ...prev, logo_dark: true }))}
                  accept="image/png,image/svg+xml"
                  hint="Para el tema oscuro (PNG, SVG)"
                  darkPreview
                />
                <ImageUpload
                  label="Favicon"
                  value={faviconFile}
                  previewUrl={effectiveTenant?.favicon}
                  onChange={setFaviconFile}
                  onClear={() => setClearImages((prev) => ({ ...prev, favicon: true }))}
                  accept="image/png,image/x-icon"
                  hint="Icono del navegador (32x32 PNG)"
                />
                <div className="md:col-span-2">
                  <ImageUpload
                    label="Fondo de Login"
                    value={loginBackgroundFile}
                    previewUrl={effectiveTenant?.login_background}
                    onChange={setLoginBackgroundFile}
                    onClear={() => setClearImages((prev) => ({ ...prev, login_background: true }))}
                    accept="image/png,image/jpeg,image/webp"
                    hint="Imagen de fondo para la pagina de login (1920x1080 recomendado)"
                  />
                </div>
              </>
            )}
            {!isEditing && (
              <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los logos se pueden subir despues de crear la empresa.
                </p>
              </div>
            )}
          </div>
        );

      case 'pwa':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de la App (PWA)"
              value={formData.pwa_name || ''}
              onChange={(e) => handleChange('pwa_name', e.target.value)}
              placeholder="Mi Empresa - ERP"
              helperText="Nombre completo de la aplicacion"
            />
            <Input
              label="Nombre Corto (max 12 caracteres)"
              value={formData.pwa_short_name || ''}
              onChange={(e) => handleChange('pwa_short_name', e.target.value)}
              placeholder="MiEmpresa"
              maxLength={12}
              helperText="Nombre para el icono del dispositivo"
            />
            <div className="md:col-span-2">
              <Textarea
                label="Descripcion de la App"
                value={formData.pwa_description || ''}
                onChange={(e) => handleChange('pwa_description', e.target.value)}
                placeholder="Sistema de gestion empresarial..."
                rows={2}
                helperText="Descripcion para tiendas de apps"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color del Tema (PWA)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.pwa_theme_color || '#6366F1'}
                  onChange={(e) => handleChange('pwa_theme_color', e.target.value)}
                  className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  value={formData.pwa_theme_color || '#6366F1'}
                  onChange={(e) => handleChange('pwa_theme_color', e.target.value)}
                  placeholder="#6366F1"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Color de la barra de estado del navegador
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color de Fondo (PWA)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.pwa_background_color || '#FFFFFF'}
                  onChange={(e) => handleChange('pwa_background_color', e.target.value)}
                  className="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  value={formData.pwa_background_color || '#FFFFFF'}
                  onChange={(e) => handleChange('pwa_background_color', e.target.value)}
                  placeholder="#FFFFFF"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Color de fondo durante la carga de la app
              </p>
            </div>
            {/* Seccion de Iconos PWA - Solo en edicion */}
            {isEditing && (
              <>
                <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Iconos de la App
                  </h4>
                </div>
                <ImageUpload
                  label="Icono 192x192"
                  value={pwaIcon192File}
                  previewUrl={effectiveTenant?.pwa_icon_192}
                  onChange={setPwaIcon192File}
                  onClear={() => setClearImages((prev) => ({ ...prev, pwa_icon_192: true }))}
                  accept="image/png"
                  hint="PNG 192x192 px"
                />
                <ImageUpload
                  label="Icono 512x512"
                  value={pwaIcon512File}
                  previewUrl={effectiveTenant?.pwa_icon_512}
                  onChange={setPwaIcon512File}
                  onClear={() => setClearImages((prev) => ({ ...prev, pwa_icon_512: true }))}
                  accept="image/png"
                  hint="PNG 512x512 px"
                />
                <ImageUpload
                  label="Icono Maskable"
                  value={pwaIconMaskableFile}
                  previewUrl={effectiveTenant?.pwa_icon_maskable}
                  onChange={setPwaIconMaskableFile}
                  onClear={() => setClearImages((prev) => ({ ...prev, pwa_icon_maskable: true }))}
                  accept="image/png"
                  hint="PNG 512x512 con padding para safe zone"
                />
              </>
            )}
            {!isEditing && (
              <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los iconos PWA se pueden subir despues de crear la empresa.
                </p>
              </div>
            )}
          </div>
        );

      case 'modulos':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selecciona los modulos que estaran disponibles para esta empresa.
              </p>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formData.enabled_modules?.length || 0} de {AVAILABLE_MODULES.length}
              </span>
            </div>

            <div className="space-y-4">
              {Object.keys(CATEGORY_LABELS).map((category) => {
                const categoryModules = AVAILABLE_MODULES.filter((m) => m.category === category);
                if (categoryModules.length === 0) return null;

                const categoryInfo = CATEGORY_LABELS[category];

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      {categoryInfo.icon}
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {categoryInfo.label}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {categoryModules.map((module) => {
                        const isEnabled = formData.enabled_modules?.includes(module.code) ?? false;
                        return (
                          <button
                            key={module.code}
                            type="button"
                            onClick={() => handleModuleToggle(module.code)}
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left text-sm ${
                              isEnabled
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center ${
                                isEnabled
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            >
                              {isEnabled && <Check className="h-3 w-3" />}
                            </div>
                            <span
                              className={`truncate ${
                                isEnabled
                                  ? 'text-primary-700 dark:text-primary-300 font-medium'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {module.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {formData.enabled_modules?.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Ningun modulo seleccionado. La empresa no vera ningun modulo en el sidebar.
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  // Usar Portal para renderizar fuera del stacking context de Framer Motion
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
          {/* Header - Fixed */}
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

          {/* Tabs - Fixed */}
          <div className="px-4 pt-4 flex-shrink-0">
            <Tabs
              tabs={TABS}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as TabId)}
              variant="pills"
            />
          </div>

          {/* Form Content - Scrollable */}
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

            {/* Footer - Fixed */}
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
