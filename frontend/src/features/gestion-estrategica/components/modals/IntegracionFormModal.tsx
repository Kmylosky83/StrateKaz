/**
 * Modal para crear/editar Integraciones Externas
 *
 * Formulario completo para gestión de integraciones con todos los campos:
 * - Identificación (nombre, tipo_servicio, proveedor, descripción)
 * - Configuración (ambiente, URL base, timeout, reintentos)
 * - Autenticación (método, credenciales)
 * - Estado (activo/inactivo)
 *
 * Usa Design System:
 * - BaseModal para el contenedor
 * - Input, Select, Textarea para formulario
 * - Switch para opciones booleanas
 * - Button para acciones
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import {
  useCreateIntegracion,
  useUpdateIntegracion,
  useIntegracion,
  useIntegracionChoices,
} from '../../hooks/useStrategic';
import type {
  IntegracionExternaList,
  TipoServicio,
  Proveedor,
  MetodoAutenticacion,
  Ambiente,
  CreateIntegracionDTO,
  UpdateIntegracionDTO,
} from '../../types/strategic.types';

interface IntegracionFormModalProps {
  integracion: IntegracionExternaList | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  nombre: string;
  descripcion: string;
  tipo_servicio: TipoServicio;
  proveedor: Proveedor;
  ambiente: Ambiente;
  metodo_autenticacion: MetodoAutenticacion;
  url_base: string;
  timeout_segundos: string;
  reintentos_max: string;
  is_active: boolean;
  // Credenciales (solo para crear o actualizar)
  api_key: string;
  api_secret: string;
  username: string;
  password: string;
}

const defaultFormData: FormData = {
  nombre: '',
  descripcion: '',
  tipo_servicio: 'EMAIL',
  proveedor: 'GMAIL',
  ambiente: 'SANDBOX',
  metodo_autenticacion: 'API_KEY',
  url_base: '',
  timeout_segundos: '30',
  reintentos_max: '3',
  is_active: true,
  api_key: '',
  api_secret: '',
  username: '',
  password: '',
};

// Opción genérica que siempre aparece como fallback en todos los tipos
const PERSONALIZADO_OPTION = { value: 'PERSONALIZADO' as Proveedor, label: 'Personalizado' };

// Mapeo de tipos de servicio a proveedores compatibles (sincronizado con backend)
const PROVEEDOR_POR_TIPO: Record<TipoServicio, { value: Proveedor; label: string }[]> = {
  // ── Comunicación ──
  EMAIL: [
    { value: 'GMAIL', label: 'Gmail / Google Workspace' },
    { value: 'OUTLOOK', label: 'Outlook / Microsoft 365' },
    { value: 'SENDGRID', label: 'SendGrid' },
    { value: 'SES', label: 'Amazon SES' },
    { value: 'SMTP_CUSTOM', label: 'SMTP Personalizado' },
  ],
  SMS: [
    { value: 'TWILIO', label: 'Twilio' },
    { value: 'MESSAGEBIRD', label: 'MessageBird' },
    { value: 'INFOBIP', label: 'Infobip' },
    PERSONALIZADO_OPTION,
  ],
  WHATSAPP: [
    { value: 'WHATSAPP_BUSINESS', label: 'WhatsApp Business API' },
    { value: 'TWILIO', label: 'Twilio (WhatsApp)' },
    PERSONALIZADO_OPTION,
  ],
  NOTIFICACIONES: [
    { value: 'FIREBASE', label: 'Firebase Cloud Messaging' },
    { value: 'ONESIGNAL', label: 'OneSignal' },
    PERSONALIZADO_OPTION,
  ],
  // ── Tributario ──
  FACTURACION: [
    { value: 'DIAN', label: 'DIAN (Directo)' },
    { value: 'CARVAJAL', label: 'Carvajal Tecnología' },
    { value: 'SIIGO', label: 'Siigo' },
    { value: 'ALEGRA', label: 'Alegra' },
  ],
  NOMINA: [
    { value: 'SIIGO', label: 'Siigo' },
    { value: 'ALEGRA', label: 'Alegra' },
    PERSONALIZADO_OPTION,
  ],
  RADIAN: [
    { value: 'DIAN', label: 'DIAN RADIAN' },
    { value: 'CARVAJAL', label: 'Carvajal Tecnología' },
    PERSONALIZADO_OPTION,
  ],
  // ── Archivos ──
  ALMACENAMIENTO: [
    { value: 'GOOGLE_DRIVE', label: 'Google Drive' },
    { value: 'AWS_S3', label: 'Amazon S3' },
    { value: 'AZURE_BLOB', label: 'Azure Blob Storage' },
    { value: 'GCS', label: 'Google Cloud Storage' },
  ],
  CDN: [
    { value: 'CLOUDFLARE', label: 'Cloudflare' },
    { value: 'AWS_CLOUDFRONT', label: 'AWS CloudFront' },
    PERSONALIZADO_OPTION,
  ],
  BACKUP: [
    { value: 'AWS_S3', label: 'Amazon S3' },
    { value: 'AZURE_BLOB', label: 'Azure Blob' },
    { value: 'GOOGLE_DRIVE', label: 'Google Drive' },
    PERSONALIZADO_OPTION,
  ],
  // ── Analítica ──
  BI: [
    { value: 'POWER_BI', label: 'Power BI' },
    { value: 'METABASE', label: 'Metabase' },
    { value: 'GOOGLE_LOOKER', label: 'Google Looker Studio' },
    { value: 'GOOGLE_SHEETS', label: 'Google Sheets' },
  ],
  ANALYTICS: [
    { value: 'GOOGLE_ANALYTICS', label: 'Google Analytics' },
    { value: 'MIXPANEL', label: 'Mixpanel' },
    PERSONALIZADO_OPTION,
  ],
  // ── Financiero ──
  PAGOS: [
    { value: 'WOMPI', label: 'Wompi' },
    { value: 'PAYU', label: 'PayU Latam' },
    { value: 'MERCADOPAGO', label: 'MercadoPago' },
    PERSONALIZADO_OPTION,
  ],
  PSE: [
    { value: 'ACH_COLOMBIA', label: 'ACH Colombia' },
    { value: 'EVERTEC', label: 'Evertec' },
    PERSONALIZADO_OPTION,
  ],
  BANCARIO: [
    { value: 'BANCOLOMBIA', label: 'Bancolombia API' },
    { value: 'DAVIVIENDA', label: 'Davivienda' },
    { value: 'BBVA', label: 'BBVA Colombia' },
    PERSONALIZADO_OPTION,
  ],
  // ── Geolocalización ──
  MAPAS: [
    { value: 'GOOGLE_MAPS', label: 'Google Maps Platform' },
    { value: 'MAPBOX', label: 'Mapbox' },
    { value: 'OSM', label: 'OpenStreetMap' },
  ],
  RASTREO: [
    { value: 'RUNT', label: 'RUNT' },
    { value: 'MINTRANSPORTE', label: 'MinTransporte' },
    PERSONALIZADO_OPTION,
  ],
  // ── Legal y Cumplimiento ──
  FIRMA_DIGITAL: [
    { value: 'CERTICAMARA', label: 'Certicámara' },
    { value: 'GSE', label: 'GSE' },
    { value: 'ANDES_SCD', label: 'Andes SCD' },
  ],
  OFAC: [
    { value: 'DOW_JONES', label: 'Dow Jones Risk & Compliance' },
    { value: 'REFINITIV', label: 'Refinitiv World-Check' },
    PERSONALIZADO_OPTION,
  ],
  SAGRILAFT: [
    { value: 'INFOLAFT', label: 'Infolaft' },
    { value: 'TRANSPARENCIA_CO', label: 'Transparencia Colombia' },
    PERSONALIZADO_OPTION,
  ],
  // ── Inteligencia Artificial ──
  IA: [
    { value: 'OPENAI', label: 'OpenAI (GPT)' },
    { value: 'ANTHROPIC', label: 'Anthropic (Claude)' },
    { value: 'GOOGLE_AI', label: 'Google AI (Gemini)' },
    PERSONALIZADO_OPTION,
  ],
  OCR: [
    { value: 'GOOGLE_VISION', label: 'Google Cloud Vision' },
    { value: 'AWS_TEXTRACT', label: 'AWS Textract' },
    PERSONALIZADO_OPTION,
  ],
  // ── Sistemas ──
  ERP: [
    { value: 'SIIGO', label: 'Siigo' },
    { value: 'ALEGRA', label: 'Alegra' },
    { value: 'WORLD_OFFICE', label: 'World Office' },
    { value: 'SAP', label: 'SAP' },
  ],
  CRM: [
    { value: 'HUBSPOT', label: 'HubSpot' },
    { value: 'SALESFORCE', label: 'Salesforce' },
    { value: 'ZOHO', label: 'Zoho CRM' },
    PERSONALIZADO_OPTION,
  ],
  // ── Genéricos ──
  API_TERCEROS: [PERSONALIZADO_OPTION],
  WEBHOOK: [PERSONALIZADO_OPTION],
  OTRO: [PERSONALIZADO_OPTION],
};

// Tipos de servicio organizados por categoría
const TIPO_SERVICIO_OPTIONS = [
  // Comunicación
  { value: 'EMAIL', label: 'Correo Electrónico' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'NOTIFICACIONES', label: 'Notificaciones Push' },
  // Tributario
  { value: 'FACTURACION', label: 'Facturación Electrónica' },
  { value: 'NOMINA', label: 'Nómina Electrónica' },
  { value: 'RADIAN', label: 'RADIAN' },
  // Archivos
  { value: 'ALMACENAMIENTO', label: 'Almacenamiento en la Nube' },
  { value: 'CDN', label: 'CDN' },
  { value: 'BACKUP', label: 'Backup y Recuperación' },
  // Analítica
  { value: 'BI', label: 'Business Intelligence' },
  { value: 'ANALYTICS', label: 'Analytics y Métricas' },
  // Financiero
  { value: 'PAGOS', label: 'Pasarela de Pagos' },
  { value: 'PSE', label: 'PSE' },
  { value: 'BANCARIO', label: 'Integración Bancaria' },
  // Geolocalización
  { value: 'MAPAS', label: 'Mapas y Geocodificación' },
  { value: 'RASTREO', label: 'Rastreo GPS' },
  // Legal y Cumplimiento
  { value: 'FIRMA_DIGITAL', label: 'Firma Digital Certificada' },
  { value: 'OFAC', label: 'OFAC / Listas Restrictivas' },
  { value: 'SAGRILAFT', label: 'SAGRILAFT / SARLAFT' },
  // Inteligencia Artificial
  { value: 'IA', label: 'Inteligencia Artificial' },
  { value: 'OCR', label: 'Reconocimiento OCR' },
  // Sistemas
  { value: 'ERP', label: 'Integración ERP' },
  { value: 'CRM', label: 'Integración CRM' },
  // Otros
  { value: 'API_TERCEROS', label: 'API de Terceros' },
  { value: 'WEBHOOK', label: 'Webhooks' },
  { value: 'OTRO', label: 'Otro Servicio' },
];

const METODO_AUTENTICACION_OPTIONS = [
  { value: 'API_KEY', label: 'API Key' },
  { value: 'OAUTH2', label: 'OAuth 2.0' },
  { value: 'BASIC_AUTH', label: 'Usuario y Contraseña' },
  { value: 'SERVICE_ACCOUNT', label: 'Cuenta de Servicio' },
  { value: 'CERTIFICATE', label: 'Certificado Digital' },
];

const AMBIENTE_OPTIONS = [
  { value: 'SANDBOX', label: 'Sandbox / Pruebas' },
  { value: 'PRODUCCION', label: 'Producción' },
];

export const IntegracionFormModal = ({
  integracion,
  isOpen,
  onClose,
}: IntegracionFormModalProps) => {
  const isEditing = integracion !== null;

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [showCredentials, setShowCredentials] = useState(!isEditing);

  // Queries y mutations
  const { data: integracionDetail } = useIntegracion(integracion?.id || 0);
  const { data: choices } = useIntegracionChoices();
  const createMutation = useCreateIntegracion();
  const updateMutation = useUpdateIntegracion();

  // Cargar datos al editar
  useEffect(() => {
    if (isEditing && integracionDetail) {
      setFormData({
        nombre: integracionDetail.nombre,
        descripcion: integracionDetail.descripcion || '',
        tipo_servicio: integracionDetail.tipo_servicio,
        proveedor: integracionDetail.proveedor,
        ambiente: integracionDetail.ambiente,
        metodo_autenticacion: integracionDetail.metodo_autenticacion,
        url_base: integracionDetail.url_base || '',
        timeout_segundos: integracionDetail.timeout_segundos?.toString() || '30',
        reintentos_max: integracionDetail.reintentos_max?.toString() || '3',
        is_active: integracionDetail.is_active,
        api_key: '',
        api_secret: '',
        username: '',
        password: '',
      });
      setShowCredentials(false);
    } else if (!isEditing) {
      setFormData(defaultFormData);
      setShowCredentials(true);
    }
  }, [integracionDetail, isEditing]);

  // Actualizar proveedor cuando cambia tipo de servicio
  useEffect(() => {
    const proveedoresDisponibles =
      PROVEEDOR_POR_TIPO[formData.tipo_servicio]?.length > 0
        ? PROVEEDOR_POR_TIPO[formData.tipo_servicio]
        : [PERSONALIZADO_OPTION];
    const proveedorActualValido = proveedoresDisponibles.some(
      (p) => p.value === formData.proveedor
    );
    if (!proveedorActualValido) {
      setFormData((prev) => ({ ...prev, proveedor: proveedoresDisponibles[0].value }));
    }
  }, [formData.tipo_servicio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && integracion) {
      const updateData: UpdateIntegracionDTO = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        ambiente: formData.ambiente,
        url_base: formData.url_base || undefined,
        timeout_segundos: parseInt(formData.timeout_segundos) || 30,
        reintentos_max: parseInt(formData.reintentos_max) || 3,
        is_active: formData.is_active,
      };
      await updateMutation.mutateAsync({
        id: integracion.id,
        data: updateData,
      });
    } else {
      // Construir credenciales según método de autenticación
      const credenciales: Record<string, string> = {};
      if (formData.metodo_autenticacion === 'API_KEY') {
        credenciales.api_key = formData.api_key;
        if (formData.api_secret) credenciales.api_secret = formData.api_secret;
      } else if (formData.metodo_autenticacion === 'BASIC_AUTH') {
        credenciales.username = formData.username;
        credenciales.password = formData.password;
      } else if (formData.metodo_autenticacion === 'OAUTH2') {
        credenciales.client_id = formData.api_key;
        credenciales.client_secret = formData.api_secret;
      } else if (formData.metodo_autenticacion === 'SERVICE_ACCOUNT') {
        credenciales.service_account_json = formData.api_key;
      }

      const createData: CreateIntegracionDTO = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        tipo_servicio: formData.tipo_servicio,
        proveedor: formData.proveedor,
        ambiente: formData.ambiente,
        metodo_autenticacion: formData.metodo_autenticacion,
        url_base: formData.url_base,
        credenciales,
        timeout_segundos: parseInt(formData.timeout_segundos) || 30,
        reintentos_max: parseInt(formData.reintentos_max) || 3,
        is_active: formData.is_active,
      };
      await createMutation.mutateAsync(createData);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Opciones de proveedores según tipo seleccionado (siempre incluye Personalizado como fallback)
  const proveedorOptions =
    PROVEEDOR_POR_TIPO[formData.tipo_servicio]?.length > 0
      ? PROVEEDOR_POR_TIPO[formData.tipo_servicio]
      : [PERSONALIZADO_OPTION];

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.nombre || !formData.url_base}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Integración'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Integración' : 'Nueva Integración Externa'}
      subtitle="Configure la conexión con el servicio externo"
      size="xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección: Identificación */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Identificación del Servicio
          </h4>

          <Input
            label="Nombre de la Integración *"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Gmail Corporativo"
            required
            helperText="Nombre descriptivo para identificar esta integración"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Servicio *"
              value={formData.tipo_servicio}
              onChange={(e) =>
                setFormData({ ...formData, tipo_servicio: e.target.value as TipoServicio })
              }
              options={TIPO_SERVICIO_OPTIONS}
              required
              disabled={isEditing}
            />
            <Select
              label="Proveedor *"
              value={formData.proveedor}
              onChange={(e) => setFormData({ ...formData, proveedor: e.target.value as Proveedor })}
              options={proveedorOptions}
              required
              disabled={isEditing}
            />
          </div>

          <Textarea
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción del propósito de esta integración..."
            rows={2}
          />
        </div>

        {/* Sección: Configuración */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Configuración de Conexión
          </h4>

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Ambiente *"
              value={formData.ambiente}
              onChange={(e) => setFormData({ ...formData, ambiente: e.target.value as Ambiente })}
              options={AMBIENTE_OPTIONS}
              required
            />
            <Input
              label="Timeout (seg)"
              type="number"
              min="5"
              max="300"
              value={formData.timeout_segundos}
              onChange={(e) => setFormData({ ...formData, timeout_segundos: e.target.value })}
            />
            <Input
              label="Reintentos Max"
              type="number"
              min="0"
              max="10"
              value={formData.reintentos_max}
              onChange={(e) => setFormData({ ...formData, reintentos_max: e.target.value })}
            />
          </div>

          <Input
            label="URL Base *"
            value={formData.url_base}
            onChange={(e) => setFormData({ ...formData, url_base: e.target.value })}
            placeholder="https://api.servicio.com/v1"
            required
            helperText="URL base de la API del servicio"
          />
        </div>

        {/* Sección: Autenticación */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Autenticación
            </h4>
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCredentials(!showCredentials)}
              >
                {showCredentials ? 'Ocultar Credenciales' : 'Actualizar Credenciales'}
              </Button>
            )}
          </div>

          <Select
            label="Método de Autenticación *"
            value={formData.metodo_autenticacion}
            onChange={(e) =>
              setFormData({
                ...formData,
                metodo_autenticacion: e.target.value as MetodoAutenticacion,
              })
            }
            options={METODO_AUTENTICACION_OPTIONS}
            required
            disabled={isEditing}
          />

          {showCredentials && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                Las credenciales se almacenan de forma encriptada.
              </p>

              {formData.metodo_autenticacion === 'API_KEY' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="API Key *"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="••••••••••••••••"
                    required={!isEditing}
                  />
                  <Input
                    label="API Secret"
                    type="password"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    placeholder="••••••••••••••••"
                  />
                </div>
              )}

              {formData.metodo_autenticacion === 'BASIC_AUTH' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Usuario *"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="usuario@empresa.com"
                    required={!isEditing}
                  />
                  <Input
                    label="Contraseña *"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••••••"
                    required={!isEditing}
                  />
                </div>
              )}

              {formData.metodo_autenticacion === 'OAUTH2' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Client ID *"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="tu-client-id"
                    required={!isEditing}
                  />
                  <Input
                    label="Client Secret *"
                    type="password"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    placeholder="••••••••••••••••"
                    required={!isEditing}
                  />
                </div>
              )}

              {formData.metodo_autenticacion === 'SERVICE_ACCOUNT' && (
                <Textarea
                  label="JSON de Cuenta de Servicio *"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder='{"type": "service_account", ...}'
                  rows={4}
                  required={!isEditing}
                />
              )}

              {formData.metodo_autenticacion === 'CERTIFICATE' && (
                <Alert
                  variant="info"
                  message="Para certificados digitales, suba el archivo .p12/.pfx y proporcione la contraseña del certificado."
                />
              )}
            </div>
          )}
        </div>

        {/* Estado activo */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Integración Activa
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Desactive para pausar temporalmente esta integración
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
        </div>

        {formData.ambiente === 'PRODUCCION' && (
          <Alert
            variant="warning"
            title="Ambiente de Producción"
            message="Esta integración se configurará para producción. Asegúrese de que las credenciales y la URL sean correctas."
          />
        )}
      </form>
    </BaseModal>
  );
};
