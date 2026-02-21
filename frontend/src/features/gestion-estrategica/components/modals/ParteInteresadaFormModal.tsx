/**
 * Modal para crear/editar Parte Interesada (Stakeholder)
 *
 * Formulario completo para gestion de stakeholders segun ISO 9001:2015 Clausula 4.2:
 * - Datos basicos: tipo, nombre, descripcion
 * - Canales de comunicacion: tipo canal, valor (email, telefono, etc)
 * - Clasificacion: nivel de influencia, nivel de interes
 * - ISO 9001: Necesidades, Expectativas, Requisitos pertinentes
 * - Sistemas relacionados: SST, Ambiental, Calidad, PESV
 *
 * El contacto es generalizado por categoria (no una persona especifica)
 * para permitir comunicaciones automatizadas por tipo de stakeholder.
 *
 * Usa Design System dinamico sin colores hardcoded
 */
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Shield,
  AlertTriangle,
  Zap,
  Target,
  MessageSquare,
  FileText,
  ClipboardCheck,
  Globe,
  ShoppingCart,
  Truck,
  TrendingUp,
  Landmark,
  Leaf,
  UserCircle,
  Briefcase,
  LayoutGrid,
} from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import {
  useTiposParteInteresada,
  useParteInteresadaMutation,
  type ParteInteresada,
} from '../../hooks/usePartesInteresadas';
import { useNormasISO } from '../../hooks/useNormasISO';
import { useAreas } from '../../hooks/useAreas'; // Sprint 17
import { useColaboradores } from '@/features/talent-hub/hooks'; // Sprint 17
import { useCargos } from '@/features/configuracion/hooks'; // Sprint 17
import { DynamicIcon } from '@/components/common';
import { Badge } from '@/components/common/Badge'; // Sprint 17

// =============================================================================
// INTERFACES
// =============================================================================

interface ParteInteresadaFormModalProps {
  parteInteresada: ParteInteresada | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  tipo: string;
  nombre: string;
  descripcion: string;
  // Canales de comunicacion (alineados con backend Django)
  canal_principal:
    | 'email'
    | 'telefono'
    | 'reunion'
    | 'videoconferencia'
    | 'whatsapp'
    | 'portal_web'
    | 'redes_sociales'
    | 'correspondencia'
    | 'otro';
  canales_adicionales: string[];
  email_contacto: string;
  telefono_contacto: string;
  direccion: string;
  sitio_web: string;
  // Datos de contacto opcionales (representante general, no obligatorio)
  representante: string;
  cargo_representante: string;
  // Matriz Poder-Interes (ACTUALIZADO Sprint 17 - Bidireccional)
  nivel_influencia_pi: 'alta' | 'media' | 'baja'; // Renombrado: PI → Empresa (PODER)
  nivel_influencia_empresa: 'alta' | 'media' | 'baja'; // NUEVO: Empresa → PI
  nivel_interes: 'alto' | 'medio' | 'bajo';
  // Temas de Interés (NUEVO Sprint 17 - Bidireccional)
  temas_interes_pi: string; // Qué le interesa a la PI de la empresa
  temas_interes_empresa: string; // Qué le interesa a la empresa de la PI
  // Responsables en la Empresa (NUEVO Sprint 17)
  responsable_empresa: number | null; // FK Colaborador
  cargo_responsable: number | null; // FK Cargo
  area_responsable: number | null; // FK Area
  // ISO 9001:2015 Clausula 4.2 - Campos requeridos
  necesidades: string;
  expectativas: string;
  requisitos_pertinentes: string;
  es_requisito_legal: boolean;
  // Frecuencia de comunicacion (alineados con backend Django)
  frecuencia_comunicacion:
    | 'diaria'
    | 'semanal'
    | 'quincenal'
    | 'mensual'
    | 'bimestral'
    | 'trimestral'
    | 'semestral'
    | 'anual'
    | 'segun_necesidad';
  // Sistemas de gestión relacionados (dinámico)
  normas_relacionadas: number[];
}

// =============================================================================
// CONSTANTES
// =============================================================================

const defaultFormData: FormData = {
  tipo: '',
  nombre: '',
  descripcion: '',
  canal_principal: 'email',
  canales_adicionales: [],
  email_contacto: '',
  telefono_contacto: '',
  direccion: '',
  sitio_web: '',
  representante: '',
  cargo_representante: '',
  nivel_influencia_pi: 'media',
  nivel_influencia_empresa: 'media',
  nivel_interes: 'medio',
  temas_interes_pi: '',
  temas_interes_empresa: '',
  responsable_empresa: null,
  cargo_responsable: null,
  area_responsable: null,
  necesidades: '',
  expectativas: '',
  requisitos_pertinentes: '',
  es_requisito_legal: false,
  frecuencia_comunicacion: 'mensual',
  normas_relacionadas: [],
};

const CANALES_COMUNICACION = [
  { value: 'email', label: 'Correo Electronico', icon: Mail },
  { value: 'telefono', label: 'Telefono', icon: Phone },
  { value: 'reunion', label: 'Reunion Presencial', icon: Building2 },
  { value: 'videoconferencia', label: 'Videoconferencia', icon: Globe },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'portal_web', label: 'Portal Web', icon: Globe },
  { value: 'redes_sociales', label: 'Redes Sociales', icon: MessageSquare },
  { value: 'correspondencia', label: 'Correspondencia Fisica', icon: Mail },
  { value: 'otro', label: 'Otro', icon: MessageSquare },
];

const FRECUENCIAS_COMUNICACION = [
  { value: 'diaria', label: 'Diaria' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'segun_necesidad', label: 'Segun necesidad' },
];

const NIVELES_INFLUENCIA = [
  { value: 'alta', label: 'Alta', description: 'Poder significativo sobre decisiones' },
  { value: 'media', label: 'Media', description: 'Influencia moderada' },
  { value: 'baja', label: 'Baja', description: 'Influencia limitada' },
];

const NIVELES_INTERES = [
  { value: 'alto', label: 'Alto', description: 'Muy interesado en los resultados' },
  { value: 'medio', label: 'Medio', description: 'Interes moderado' },
  { value: 'bajo', label: 'Bajo', description: 'Poco interes' },
];

// Configuracion de cuadrantes para visualizacion
const CUADRANTE_INFO: Record<
  string,
  { label: string; color: string; icon: React.ElementType; description: string }
> = {
  gestionar_cerca: {
    label: 'Gestionar de Cerca',
    color: 'text-red-600',
    icon: Zap,
    description: 'Alta influencia + Alto interés: Máxima atención',
  },
  mantener_satisfecho: {
    label: 'Mantener Satisfecho',
    color: 'text-amber-600',
    icon: Shield,
    description: 'Alta influencia + Bajo interes: Satisfacer necesidades',
  },
  mantener_informado: {
    label: 'Mantener Informado',
    color: 'text-blue-600',
    icon: Target,
    description: 'Baja influencia + Alto interes: Comunicacion activa',
  },
  monitorear: {
    label: 'Monitorear',
    color: 'text-gray-500',
    icon: AlertTriangle,
    description: 'Baja influencia + Bajo interes: Supervision minima',
  },
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

// FIX Sprint 17: Wrapper memo para evitar re-renders del form en cada keystroke
const ParteInteresadaFormModalComponent = ({
  parteInteresada,
  isOpen,
  onClose,
  onSuccess,
}: ParteInteresadaFormModalProps) => {
  const isEditing = parteInteresada !== null;

  // Form state
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [error, setError] = useState<string | null>(null);

  // Queries
  const { data: tipos, isLoading: isLoadingTipos } = useTiposParteInteresada();
  const { data: normasData, isLoading: isLoadingNormas } = useNormasISO();
  // Sprint 17: Queries para responsables
  const { data: areasData } = useAreas();
  const { data: colaboradoresData } = useColaboradores();
  const { data: cargosData } = useCargos();

  // Lista de normas disponibles - memoizada para evitar re-renders
  const normasDisponibles = useMemo(() => normasData?.results || [], [normasData?.results]);

  // Mutations
  const { create, update, isCreating, isUpdating } = useParteInteresadaMutation();

  // Cargar datos al editar
  useEffect(() => {
    if (isEditing && parteInteresada) {
      setFormData({
        tipo: parteInteresada.tipo.toString(),
        nombre: parteInteresada.nombre || '',
        descripcion: parteInteresada.descripcion || '',
        canal_principal: parteInteresada.canal_principal || 'email',
        canales_adicionales: parteInteresada.canales_adicionales || [],
        email_contacto: parteInteresada.email || '',
        telefono_contacto: parteInteresada.telefono || '',
        direccion: parteInteresada.direccion || '',
        sitio_web: parteInteresada.sitio_web || '',
        representante: parteInteresada.representante || '',
        cargo_representante: parteInteresada.cargo_representante || '',
        // Sprint 17: Campos bidireccionales
        nivel_influencia_pi: parteInteresada.nivel_influencia_pi,
        nivel_influencia_empresa: parteInteresada.nivel_influencia_empresa,
        nivel_interes: parteInteresada.nivel_interes,
        temas_interes_pi: parteInteresada.temas_interes_pi || '',
        temas_interes_empresa: parteInteresada.temas_interes_empresa || '',
        // Sprint 17: Responsables
        responsable_empresa: parteInteresada.responsable_empresa,
        cargo_responsable: parteInteresada.cargo_responsable,
        area_responsable: parteInteresada.area_responsable,
        // ISO
        necesidades: parteInteresada.necesidades || '',
        expectativas: parteInteresada.expectativas || '',
        requisitos_pertinentes: parteInteresada.requisitos_pertinentes || '',
        es_requisito_legal: parteInteresada.es_requisito_legal || false,
        frecuencia_comunicacion: parteInteresada.frecuencia_comunicacion || 'mensual',
        // Usar normas_relacionadas del backend o array vacío
        normas_relacionadas: (parteInteresada as any).normas_relacionadas || [],
      });
    } else if (!isEditing) {
      setFormData(defaultFormData);
    }
    setError(null);
  }, [parteInteresada, isEditing, isOpen]);

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validacion basica
    if (!formData.tipo) {
      setError('Debe seleccionar un tipo de parte interesada');
      return;
    }
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      const dataToSubmit = {
        tipo: parseInt(formData.tipo),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        // Mapeo de campos nuevos a los existentes en el backend
        email: formData.email_contacto.trim() || undefined,
        telefono: formData.telefono_contacto.trim() || undefined,
        direccion: formData.direccion.trim() || undefined,
        representante: formData.representante.trim() || undefined,
        cargo_representante: formData.cargo_representante.trim() || undefined,
        // Campos ISO 9001:2015 y comunicación
        canal_principal: formData.canal_principal,
        sitio_web: formData.sitio_web.trim() || undefined,
        necesidades: formData.necesidades.trim() || undefined,
        expectativas: formData.expectativas.trim() || undefined,
        requisitos_pertinentes: formData.requisitos_pertinentes.trim() || undefined,
        es_requisito_legal: formData.es_requisito_legal,
        frecuencia_comunicacion: formData.frecuencia_comunicacion,
        // Sprint 17: Impacto bidireccional
        nivel_influencia_pi: formData.nivel_influencia_pi,
        nivel_influencia_empresa: formData.nivel_influencia_empresa,
        nivel_interes: formData.nivel_interes,
        // Sprint 17: Temas bidireccionales
        temas_interes_pi: formData.temas_interes_pi.trim() || undefined,
        temas_interes_empresa: formData.temas_interes_empresa.trim() || undefined,
        // Sprint 17: Responsables
        responsable_empresa: formData.responsable_empresa || undefined,
        cargo_responsable: formData.cargo_responsable || undefined,
        area_responsable: formData.area_responsable || undefined,
        // Sistemas de gestión relacionados (dinámico)
        normas_relacionadas: formData.normas_relacionadas,
      };

      if (isEditing && parteInteresada) {
        await update({ id: parteInteresada.id, data: dataToSubmit });
      } else {
        await create(dataToSubmit);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la parte interesada');
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  // Handler para toggle de normas - memoizado para evitar re-renders
  const handleNormaToggle = useCallback((normaId: number) => {
    setFormData((prev) => ({
      ...prev,
      normas_relacionadas: prev.normas_relacionadas.includes(normaId)
        ? prev.normas_relacionadas.filter((id) => id !== normaId)
        : [...prev.normas_relacionadas, normaId],
    }));
  }, []);

  // Handler genérico para cambios de campo - evita crear nuevas funciones en cada render
  const handleFieldChange = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // FIX Sprint 17: Handlers memoizados para inputs de texto (evita re-crear funciones)
  const createTextInputHandler = useCallback(
    (field: keyof FormData) => {
      return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleFieldChange(field, e.target.value);
      };
    },
    [handleFieldChange]
  );

  const createSelectHandler = useCallback(
    (field: keyof FormData) => {
      return (e: React.ChangeEvent<HTMLSelectElement>) => {
        handleFieldChange(field, e.target.value);
      };
    },
    [handleFieldChange]
  );

  // Handlers individuales memoizados
  const handleNombreChange = useMemo(
    () => createTextInputHandler('nombre'),
    [createTextInputHandler]
  );
  const handleDescripcionChange = useMemo(
    () => createTextInputHandler('descripcion'),
    [createTextInputHandler]
  );
  const handleEmailChange = useMemo(
    () => createTextInputHandler('email_contacto'),
    [createTextInputHandler]
  );
  const handleTelefonoChange = useMemo(
    () => createTextInputHandler('telefono_contacto'),
    [createTextInputHandler]
  );
  const handleDireccionChange = useMemo(
    () => createTextInputHandler('direccion'),
    [createTextInputHandler]
  );
  const handleSitioWebChange = useMemo(
    () => createTextInputHandler('sitio_web'),
    [createTextInputHandler]
  );
  const handleRepresentanteChange = useMemo(
    () => createTextInputHandler('representante'),
    [createTextInputHandler]
  );
  const handleCargoRepresentanteChange = useMemo(
    () => createTextInputHandler('cargo_representante'),
    [createTextInputHandler]
  );
  const handleTemasInteresPiChange = useMemo(
    () => createTextInputHandler('temas_interes_pi'),
    [createTextInputHandler]
  );
  const handleTemasInteresEmpresaChange = useMemo(
    () => createTextInputHandler('temas_interes_empresa'),
    [createTextInputHandler]
  );
  const handleNecesidadesChange = useMemo(
    () => createTextInputHandler('necesidades'),
    [createTextInputHandler]
  );
  const handleExpectativasChange = useMemo(
    () => createTextInputHandler('expectativas'),
    [createTextInputHandler]
  );
  const handleRequisitosChange = useMemo(
    () => createTextInputHandler('requisitos_pertinentes'),
    [createTextInputHandler]
  );

  const isLoading = isCreating || isUpdating;

  // Opciones de tipo - memoizadas
  const tipoOptions = useMemo(
    () => [
      { value: '', label: 'Seleccione un tipo' },
      ...(tipos?.map((t) => ({
        value: t.id.toString(),
        label: `${t.nombre} (${t.categoria_display})`,
      })) || []),
    ],
    [tipos]
  );

  // Sprint 17: Tipo seleccionado (para mostrar badge de grupo)
  const tipoSeleccionado = useMemo(() => {
    return tipos?.find((t) => t.id.toString() === formData.tipo);
  }, [tipos, formData.tipo]);

  // Sprint 17: Opciones de responsables - memoizadas
  const colaboradorOptions = useMemo(
    () => [
      { value: '', label: 'Sin asignar' },
      ...(Array.isArray(colaboradoresData)
        ? colaboradoresData
        : colaboradoresData?.results || []
      ).map((c) => ({
        value: c.id.toString(),
        label: `${c.nombre_completo} - ${c.cargo_nombre || 'Sin cargo'}`,
      })),
    ],
    [colaboradoresData]
  );

  const cargoOptions = useMemo(
    () => [
      { value: '', label: 'Sin asignar' },
      ...(Array.isArray(cargosData) ? cargosData : cargosData?.results || []).map((c) => ({
        value: c.id.toString(),
        label: c.nombre,
      })),
    ],
    [cargosData]
  );

  const areaOptions = useMemo(
    () => [
      { value: '', label: 'Sin asignar' },
      ...(Array.isArray(areasData) ? areasData : areasData?.results || []).map((a) => ({
        value: a.id.toString(),
        label: a.nombre,
      })),
    ],
    [areasData]
  );

  // Calcular cuadrante basado en influencia e interes - memoizado
  const { cuadrante, cuadranteInfo, CuadranteIcon } = useMemo(() => {
    const influenciaAlta = formData.nivel_influencia_pi === 'alta'; // Sprint 17: Renombrado
    const interesAlto = formData.nivel_interes === 'alto';

    let cuad: string;
    if (influenciaAlta && interesAlto) cuad = 'gestionar_cerca';
    else if (influenciaAlta && !interesAlto) cuad = 'mantener_satisfecho';
    else if (!influenciaAlta && interesAlto) cuad = 'mantener_informado';
    else cuad = 'monitorear';

    const info = CUADRANTE_INFO[cuad];
    return { cuadrante: cuad, cuadranteInfo: info, CuadranteIcon: info.icon };
  }, [formData.nivel_influencia_pi, formData.nivel_interes]);

  // Sprint 17: Mapeo de iconos de grupos (Lucide)
  const GRUPO_ICONS: Record<string, React.ElementType> = {
    Users,
    Building2,
    ShoppingCart,
    Truck,
    TrendingUp,
    MapPin,
    Landmark,
    Globe,
    Leaf,
  };

  // Footer con botones
  const footer = (
    <>
      <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.nombre || !formData.tipo}
        isLoading={isLoading}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Stakeholder'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Parte Interesada' : 'Nueva Parte Interesada'}
      subtitle="ISO 9001:2015 Clausula 4.2 - Partes Interesadas"
      size="2xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alerta de error */}
        {error && <Alert variant="error" message={error} closable onClose={() => setError(null)} />}

        {/* Seccion: Identificacion */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Users className="h-4 w-4" />
            Identificacion
          </h4>

          <Select
            label="Tipo de Parte Interesada *"
            value={formData.tipo}
            onChange={(e) => handleFieldChange('tipo', e.target.value)}
            options={tipoOptions}
            disabled={isLoadingTipos}
            helperText="Categoria segun relacion con la organizacion"
          />

          {/* Sprint 17: Badge de grupo (read-only) */}
          {tipoSeleccionado?.grupo_nombre && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Grupo:</span>
              <Badge
                variant="outline"
                className="flex items-center gap-1.5"
                style={{
                  borderColor: tipoSeleccionado.grupo_color,
                  color: tipoSeleccionado.grupo_color,
                }}
              >
                {GRUPO_ICONS[tipoSeleccionado.grupo_icono] &&
                  React.createElement(GRUPO_ICONS[tipoSeleccionado.grupo_icono], {
                    className: 'h-3.5 w-3.5',
                  })}
                <span>{tipoSeleccionado.grupo_nombre}</span>
              </Badge>
            </div>
          )}

          <Input
            id="pi-nombre"
            label="Nombre *"
            value={formData.nombre}
            onChange={handleNombreChange}
            placeholder="Ej: Ministerio de Trabajo, Clientes Corporativos, Sindicato"
            required
          />

          <Textarea
            id="pi-descripcion"
            label="Descripción"
            value={formData.descripcion}
            onChange={handleDescripcionChange}
            placeholder="Descripción de esta parte interesada y su rol en relación con la organización..."
            rows={2}
          />
        </div>

        {/* Seccion: Canales de Comunicacion */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Canales de Comunicacion
          </h4>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Datos de contacto generales para comunicaciones con esta categoria de stakeholder
          </p>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Canales de Comunicaci&oacute;n
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Seleccione todos los canales aplicables. El primero seleccionado ser&aacute; el canal
              principal.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CANALES_COMUNICACION.map((canal) => {
                const Icon = canal.icon;
                const isSelected =
                  formData.canal_principal === canal.value ||
                  formData.canales_adicionales.includes(canal.value);
                const isPrincipal = formData.canal_principal === canal.value;
                return (
                  <label
                    key={canal.value}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          // Deseleccionar: si es el principal, mover el siguiente adicional
                          if (isPrincipal) {
                            const nextCanal = formData.canales_adicionales[0];
                            if (nextCanal) {
                              handleFieldChange('canal_principal', nextCanal);
                              handleFieldChange(
                                'canales_adicionales',
                                formData.canales_adicionales.filter((c) => c !== nextCanal)
                              );
                            }
                            // Si no hay adicionales, no deseleccionar (al menos 1 requerido)
                          } else {
                            handleFieldChange(
                              'canales_adicionales',
                              formData.canales_adicionales.filter((c) => c !== canal.value)
                            );
                          }
                        } else {
                          // Seleccionar como adicional
                          handleFieldChange('canales_adicionales', [
                            ...formData.canales_adicionales,
                            canal.value,
                          ]);
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{canal.label}</span>
                    {isPrincipal && (
                      <span className="ml-auto text-[10px] font-semibold uppercase text-primary-600 dark:text-primary-400">
                        Principal
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
          <Select
            label="Frecuencia de Comunicaci&oacute;n"
            value={formData.frecuencia_comunicacion}
            onChange={(e) => handleFieldChange('frecuencia_comunicacion', e.target.value)}
            options={FRECUENCIAS_COMUNICACION}
            helperText="Periodicidad recomendada"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="pi-email"
              type="email"
              label="Email de Contacto"
              value={formData.email_contacto}
              onChange={handleEmailChange}
              placeholder="contacto@stakeholder.com"
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Input
              id="pi-telefono"
              type="tel"
              label="Telefono de Contacto"
              value={formData.telefono_contacto}
              onChange={handleTelefonoChange}
              placeholder="+57 300 123 4567"
              leftIcon={<Phone className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="pi-direccion"
              label="Dirección"
              value={formData.direccion}
              onChange={handleDireccionChange}
              placeholder="Direccion fisica"
              leftIcon={<MapPin className="h-4 w-4" />}
            />
            <Input
              id="pi-sitio-web"
              label="Sitio Web / Portal"
              value={formData.sitio_web}
              onChange={handleSitioWebChange}
              placeholder="https://..."
              leftIcon={<Globe className="h-4 w-4" />}
            />
          </div>

          {/* Contacto especifico (opcional) */}
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
              Agregar contacto especifico (opcional)
            </summary>
            <div className="grid grid-cols-2 gap-4 mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              <Input
                id="pi-representante"
                label="Nombre del Contacto"
                value={formData.representante}
                onChange={handleRepresentanteChange}
                placeholder="Nombre de persona de contacto"
              />
              <Input
                id="pi-cargo-representante"
                label="Cargo / Rol"
                value={formData.cargo_representante}
                onChange={handleCargoRepresentanteChange}
                placeholder="Cargo o rol del contacto"
              />
            </div>
          </details>
        </div>

        {/* Seccion: Impacto Bidireccional (Sprint 17) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <Target className="h-4 w-4" />
            Impacto Bidireccional (Poder)
          </h4>

          <Alert
            variant="info"
            message="Evalúa el impacto en AMBAS direcciones: ¿Cuánto poder tiene la PI sobre la empresa? ¿Cuánto poder tiene la empresa sobre la PI?"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Impacto PI → Empresa (PODER de la PI) *"
              value={formData.nivel_influencia_pi}
              onChange={(e) => handleFieldChange('nivel_influencia_pi', e.target.value)}
              options={NIVELES_INFLUENCIA.map((n) => ({
                value: n.value,
                label: n.label,
              }))}
              helperText="¿Cuánto puede afectar la PI a la empresa?"
            />
            <Select
              label="Impacto Empresa → PI (PODER de la Empresa) *"
              value={formData.nivel_influencia_empresa}
              onChange={(e) => handleFieldChange('nivel_influencia_empresa', e.target.value)}
              options={NIVELES_INFLUENCIA.map((n) => ({
                value: n.value,
                label: n.label,
              }))}
              helperText="¿Cuánto puede afectar la empresa a la PI?"
            />
          </div>

          <div className="col-span-2">
            <Select
              label="Nivel de Interés de la PI *"
              value={formData.nivel_interes}
              onChange={(e) => handleFieldChange('nivel_interes', e.target.value)}
              options={NIVELES_INTERES.map((n) => ({
                value: n.value,
                label: n.label,
              }))}
              helperText="¿Qué tan interesada está la PI en las actividades de la empresa?"
            />
          </div>

          {/* Indicador visual del cuadrante */}
          <div
            className={`p-4 rounded-lg border-2 ${
              cuadrante === 'gestionar_cerca'
                ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                : cuadrante === 'mantener_satisfecho'
                  ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800'
                  : cuadrante === 'mantener_informado'
                    ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  cuadrante === 'gestionar_cerca'
                    ? 'bg-red-100 dark:bg-red-900/40'
                    : cuadrante === 'mantener_satisfecho'
                      ? 'bg-amber-100 dark:bg-amber-900/40'
                      : cuadrante === 'mantener_informado'
                        ? 'bg-blue-100 dark:bg-blue-900/40'
                        : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <CuadranteIcon className={`h-5 w-5 ${cuadranteInfo.color}`} />
              </div>
              <div>
                <p className={`font-medium ${cuadranteInfo.color}`}>{cuadranteInfo.label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {cuadranteInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seccion: Temas de Interés Bidireccionales (Sprint 17 - NUEVO) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Temas de Interés
          </h4>

          <Textarea
            id="pi-temas-interes-pi"
            label="Temas de Interés PARA la PI"
            value={formData.temas_interes_pi}
            onChange={handleTemasInteresPiChange}
            placeholder="¿Qué le interesa a esta PI de la empresa? Ej: Estabilidad laboral, oportunidades de crecimiento, condiciones de trabajo..."
            rows={2}
            helperText="Lo que espera o busca la PI de la organización"
          />

          <Textarea
            id="pi-temas-interes-empresa"
            label="Temas de Interés PARA la Empresa"
            value={formData.temas_interes_empresa}
            onChange={handleTemasInteresEmpresaChange}
            placeholder="¿Qué le interesa a la empresa de esta PI? Ej: Productividad, compromiso, cumplimiento normativo..."
            rows={2}
            helperText="Lo que espera o busca la empresa de esta PI"
          />
        </div>

        {/* Seccion: Responsables en la Empresa (Sprint 17 - NUEVO) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Responsable en la Empresa
          </h4>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Asigne el colaborador, cargo y/o área responsable de gestionar la relación con esta
            parte interesada
          </p>

          <Select
            label="Colaborador Responsable"
            value={formData.responsable_empresa?.toString() || ''}
            onChange={(e) =>
              handleFieldChange(
                'responsable_empresa',
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            options={colaboradorOptions}
            helperText="Persona asignada para gestionar esta PI"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Cargo Responsable"
              value={formData.cargo_responsable?.toString() || ''}
              onChange={(e) =>
                handleFieldChange(
                  'cargo_responsable',
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              options={cargoOptions}
              helperText="Alternativa si no hay colaborador específico"
            />
            <Select
              label="Área Responsable"
              value={formData.area_responsable?.toString() || ''}
              onChange={(e) =>
                handleFieldChange(
                  'area_responsable',
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              options={areaOptions}
              helperText="Área que gestiona esta relación"
            />
          </div>
        </div>

        {/* Seccion: ISO 9001:2015 - Necesidades y Expectativas */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Necesidades y Expectativas (ISO 9001 Clausula 4.2)
          </h4>

          <Alert
            variant="info"
            message="Identifique que necesita y espera esta parte interesada de la organizacion, y cuales de estos se convierten en requisitos del SGC."
          />

          <Textarea
            id="pi-necesidades"
            label="Necesidades"
            value={formData.necesidades}
            onChange={handleNecesidadesChange}
            placeholder="¿Que necesita esta parte interesada de la organizacion? Ej: Productos de calidad, cumplimiento normativo, informacion oportuna..."
            rows={2}
            helperText="Lo que requieren para cumplir sus objetivos"
          />

          <Textarea
            id="pi-expectativas"
            label="Expectativas"
            value={formData.expectativas}
            onChange={handleExpectativasChange}
            placeholder="¿Que espera obtener de la organizacion? Ej: Servicio confiable, comunicacion proactiva, mejora continua..."
            rows={2}
            helperText="Lo que esperan recibir mas alla de lo minimo"
          />

          <Textarea
            id="pi-requisitos"
            label="Requisitos Pertinentes"
            value={formData.requisitos_pertinentes}
            onChange={handleRequisitosChange}
            placeholder="¿Cuales necesidades/expectativas se convierten en requisitos del SGC? Ej: Certificacion ISO, tiempos de entrega..."
            rows={2}
            helperText="Requisitos que la organizacion debe cumplir"
          />

          <Switch
            label="Es requisito legal/reglamentario"
            description="Marque si alguno de los requisitos tiene caracter legal obligatorio"
            checked={formData.es_requisito_legal}
            onCheckedChange={(checked) => handleFieldChange('es_requisito_legal', checked)}
          />
        </div>

        {/* Seccion: Sistemas de Gestion Relacionados */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Sistemas de Gestion Relacionados
          </h4>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Seleccione los sistemas con los que esta parte interesada tiene relacion directa
          </p>

          {isLoadingNormas ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : normasDisponibles.length === 0 ? (
            <Alert
              variant="info"
              message="No hay normas o sistemas de gestion configurados. Configure las normas en Configuracion > Normas ISO."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {normasDisponibles.map((norma) => {
                const isSelected = formData.normas_relacionadas.includes(norma.id);
                return (
                  <button
                    key={norma.id}
                    type="button"
                    onClick={() => handleNormaToggle(norma.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                      ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-lg
                        ${
                          isSelected
                            ? 'bg-primary-100 dark:bg-primary-800/40'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }
                      `}
                      style={{ backgroundColor: isSelected ? `${norma.color}20` : undefined }}
                    >
                      <DynamicIcon
                        name={norma.icon || 'FileCheck'}
                        className="h-5 w-5"
                        style={{
                          color:
                            norma.color ||
                            (isSelected ? 'var(--color-primary-600)' : 'currentColor'),
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isSelected
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {norma.short_name || norma.code}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {norma.name}
                      </p>
                    </div>
                    <div
                      className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }
                    `}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </BaseModal>
  );
};

// FIX Sprint 17: Export con React.memo para evitar re-renders innecesarios
export const ParteInteresadaFormModal = memo(ParteInteresadaFormModalComponent);
export default ParteInteresadaFormModal;
