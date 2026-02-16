/**
 * Modal para crear/editar Encuestas DOFA + PCI-POAM
 *
 * Soporta dos modos:
 * - Libre: preguntas manuales (F/D)
 * - PCI-POAM: 75 preguntas estandar auto-cargadas (F/D + O/A)
 *
 * Para PCI-POAM:
 * - Tab "Temas" muestra preview agrupado por capacidad/factor (read-only)
 * - Temas se auto-generan al crear
 * - Permite vincular analisis PESTEL ademas de DOFA
 */
import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  Calendar,
  Users,
  Building2,
  Briefcase,
  Link2,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import {
  useCreateEncuesta,
  useUpdateEncuesta,
  useEncuesta,
  useTemasEncuesta,
  useCreateTema,
  useDeleteTema,
  useParticipantes,
  useAddParticipante,
  useDeleteParticipante,
  usePreguntasContexto,
} from '../../hooks/useEncuestas';
import {
  useAnalisisDofa,
  useAnalisisPestel,
  useCreateAnalisisDofa,
  useCreateAnalisisPestel,
} from '../../hooks/useContexto';
import { useAreas } from '../../hooks/useAreas';
import { useColaboradoresActivos } from '@/features/talent-hub/hooks/useColaboradores';
import { useCargos } from '@/features/configuracion/hooks/useCargos';
import type {
  EncuestaDofa,
  CreateEncuestaDTO,
  UpdateEncuestaDTO,
  TemaEncuesta,
  CreateTemaDTO,
  ParticipanteEncuesta,
  CreateParticipanteDTO,
  TipoParticipante,
  TipoEncuesta,
  PreguntaContexto,
} from '../../types/encuestas.types';

// =============================================================================
// INTERFACES
// =============================================================================

interface EncuestaFormModalProps {
  encuesta: EncuestaDofa | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTipoEncuesta?: TipoEncuesta;
}

interface FormData {
  tipo_encuesta: TipoEncuesta;
  analisis_dofa: string;
  analisis_pestel: string;
  titulo: string;
  descripcion: string;
  es_publica: boolean;
  requiere_justificacion: boolean;
  fecha_inicio: string;
  fecha_cierre: string;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const defaultFormData: FormData = {
  tipo_encuesta: 'libre',
  analisis_dofa: '',
  analisis_pestel: '',
  titulo: '',
  descripcion: '',
  es_publica: false,
  requiere_justificacion: true,
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_cierre: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

const TIPO_PARTICIPANTE_OPTIONS: {
  value: TipoParticipante;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'usuario', label: 'Usuario Especifico', icon: Users },
  { value: 'area', label: 'Todos del Area', icon: Building2 },
  { value: 'cargo', label: 'Todos del Cargo', icon: Briefcase },
];

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const EncuestaFormModal = ({
  encuesta,
  isOpen,
  onClose,
  defaultTipoEncuesta,
}: EncuestaFormModalProps) => {
  // Estado local para encuesta recién creada (permite agregar temas sin cerrar modal)
  const [createdEncuesta, setCreatedEncuesta] = useState<EncuestaDofa | null>(null);

  // Usar encuesta prop o la recién creada
  const currentEncuesta = encuesta || createdEncuesta;
  const isEditing = currentEncuesta !== null;

  const [formData, setFormData] = useState<FormData>({
    ...defaultFormData,
    tipo_encuesta: defaultTipoEncuesta || 'libre',
  });
  const [activeTab, setActiveTab] = useState<'datos' | 'temas' | 'participantes'>('datos');
  const [copiedLink, setCopiedLink] = useState(false);

  const isPciPoam = formData.tipo_encuesta === 'pci_poam';

  // Estado para nuevo tema
  const [newTema, setNewTema] = useState<CreateTemaDTO>({
    titulo: '',
    descripcion: '',
    area: undefined,
    orden: 0,
  });

  // Estado para nuevo participante
  const [newParticipante, setNewParticipante] = useState<{
    tipo: TipoParticipante;
    usuario?: number;
    area?: number;
    cargo?: number;
  }>({
    tipo: 'usuario',
  });

  // Queries
  const { data: encuestaDetail } = useEncuesta(currentEncuesta?.id);
  const { data: analisisData } = useAnalisisDofa({}, 1, 100);
  const { data: pestelData } = useAnalisisPestel({}, 1, 100);
  const { data: preguntasData } = usePreguntasContexto();
  const { data: areasData } = useAreas();
  const { data: colaboradoresData } = useColaboradoresActivos();
  const { data: cargosData } = useCargos();
  const { data: temasData } = useTemasEncuesta(currentEncuesta?.id);
  const { data: participantesData } = useParticipantes(
    currentEncuesta?.id ? { encuesta: currentEncuesta.id } : undefined
  );

  // Agrupar preguntas PCI-POAM por categoría para preview
  const preguntasAgrupadas = useMemo(() => {
    if (!preguntasData) return {};
    const grupos: Record<string, PreguntaContexto[]> = {};
    for (const p of preguntasData) {
      const key =
        p.perfil === 'pci' ? p.capacidad_pci_display || 'PCI' : p.factor_poam_display || 'POAM';
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(p);
    }
    return grupos;
  }, [preguntasData]);

  // Mutations
  const createMutation = useCreateEncuesta();
  const updateMutation = useUpdateEncuesta();
  const createTemaMutation = useCreateTema();
  const deleteTemaMutation = useDeleteTema();
  const addParticipanteMutation = useAddParticipante();
  const deleteParticipanteMutation = useDeleteParticipante();
  const createAnalisisDofaMutation = useCreateAnalisisDofa();
  const createAnalisisPestelMutation = useCreateAnalisisPestel();

  // Cargar datos al editar
  useEffect(() => {
    if (isEditing && encuestaDetail) {
      setFormData({
        tipo_encuesta: encuestaDetail.tipo_encuesta || 'libre',
        analisis_dofa: encuestaDetail.analisis_dofa.toString(),
        analisis_pestel: encuestaDetail.analisis_pestel?.toString() || '',
        titulo: encuestaDetail.titulo,
        descripcion: encuestaDetail.descripcion || '',
        es_publica: encuestaDetail.es_publica,
        requiere_justificacion: encuestaDetail.requiere_justificacion,
        fecha_inicio: encuestaDetail.fecha_inicio.split('T')[0],
        fecha_cierre: encuestaDetail.fecha_cierre.split('T')[0],
      });
    } else if (!isEditing) {
      setFormData({
        ...defaultFormData,
        tipo_encuesta: defaultTipoEncuesta || 'libre',
      });
      setActiveTab('datos');
    }
  }, [encuestaDetail, isEditing, isOpen, defaultTipoEncuesta]);

  // Reset estado al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      setCreatedEncuesta(null);
      setActiveTab('datos');
    }
  }, [isOpen]);

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && currentEncuesta) {
      const updateData: UpdateEncuestaDTO = {
        titulo: formData.titulo,
        descripcion: formData.descripcion || undefined,
        es_publica: formData.es_publica,
        requiere_justificacion: formData.requiere_justificacion,
        fecha_inicio: formData.fecha_inicio,
        fecha_cierre: formData.fecha_cierre,
        analisis_pestel: formData.analisis_pestel ? parseInt(formData.analisis_pestel) : null,
      };
      await updateMutation.mutateAsync({ id: currentEncuesta.id, data: updateData });
      onClose();
    } else {
      const createData: CreateEncuestaDTO = {
        tipo_encuesta: formData.tipo_encuesta,
        analisis_dofa: parseInt(formData.analisis_dofa),
        analisis_pestel: formData.analisis_pestel ? parseInt(formData.analisis_pestel) : null,
        titulo: formData.titulo,
        descripcion: formData.descripcion || undefined,
        es_publica: formData.es_publica,
        requiere_justificacion: formData.requiere_justificacion,
        fecha_inicio: formData.fecha_inicio,
        fecha_cierre: formData.fecha_cierre,
      };
      const newEncuesta = await createMutation.mutateAsync(createData);
      setCreatedEncuesta(newEncuesta);
      // PCI-POAM: temas auto-generados, ir a participantes. Libre: ir a temas
      setActiveTab(formData.tipo_encuesta === 'pci_poam' ? 'participantes' : 'temas');
    }
  };

  // Cerrar y finalizar
  const handleClose = () => {
    setCreatedEncuesta(null);
    onClose();
  };

  const handleAddTema = async () => {
    if (!currentEncuesta?.id || !newTema.titulo.trim()) return;

    await createTemaMutation.mutateAsync({
      encuestaId: currentEncuesta.id,
      data: {
        ...newTema,
        orden: (temasData?.results?.length || 0) + 1,
      },
    });

    setNewTema({ titulo: '', descripcion: '', area: undefined, orden: 0 });
  };

  const handleDeleteTema = async (tema: TemaEncuesta) => {
    if (!currentEncuesta?.id) return;
    await deleteTemaMutation.mutateAsync({ id: tema.id, encuestaId: currentEncuesta.id });
  };

  const handleAddParticipante = async () => {
    if (!currentEncuesta?.id) return;

    const data: CreateParticipanteDTO = {
      tipo: newParticipante.tipo,
      usuario: newParticipante.tipo === 'usuario' ? newParticipante.usuario : undefined,
      area: newParticipante.tipo === 'area' ? newParticipante.area : undefined,
      cargo: newParticipante.tipo === 'cargo' ? newParticipante.cargo : undefined,
    };

    await addParticipanteMutation.mutateAsync({
      encuestaId: currentEncuesta.id,
      data,
    });

    setNewParticipante({ tipo: 'usuario' });
  };

  const handleDeleteParticipante = async (participante: ParticipanteEncuesta) => {
    if (!currentEncuesta?.id) return;
    await deleteParticipanteMutation.mutateAsync({
      id: participante.id,
      encuestaId: currentEncuesta.id,
    });
  };

  const handleQuickCreateDofa = async () => {
    const year = new Date().getFullYear();
    const result = await createAnalisisDofaMutation.mutateAsync({
      nombre: `Análisis DOFA ${year}`,
      fecha_analisis: new Date().toISOString().split('T')[0],
      periodo: `${year}`,
    });
    setFormData((prev) => ({ ...prev, analisis_dofa: result.id.toString() }));
  };

  const handleQuickCreatePestel = async () => {
    const year = new Date().getFullYear();
    const result = await createAnalisisPestelMutation.mutateAsync({
      nombre: `Análisis PESTEL ${year}`,
      fecha_analisis: new Date().toISOString().split('T')[0],
      periodo: `${year}`,
    });
    setFormData((prev) => ({ ...prev, analisis_pestel: result.id.toString() }));
  };

  const handleCopyLink = () => {
    if (encuestaDetail?.enlace_publico) {
      navigator.clipboard.writeText(window.location.origin + encuestaDetail.enlace_publico);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Options
  const analisisOptions =
    analisisData?.results?.map((a: any) => ({
      value: a.id.toString(),
      label: a.nombre,
    })) || [];

  const pestelOptions =
    pestelData?.results?.map((a: any) => ({
      value: a.id.toString(),
      label: a.nombre || a.titulo || `PESTEL #${a.id}`,
    })) || [];

  const areaOptions =
    areasData?.results?.map((a) => ({
      value: a.id.toString(),
      label: a.name,
    })) || [];

  // Options para colaboradores (usuarios activos)
  const colaboradorOptions =
    (colaboradoresData as any)?.results?.map((c: any) => ({
      value: c.user?.id?.toString() || c.id?.toString(),
      label:
        c.nombre_completo ||
        `${c.nombres || ''} ${c.apellidos || ''}`.trim() ||
        c.numero_identificacion,
    })) || [];

  // Options para cargos
  const cargoOptions =
    cargosData?.results?.map((c: any) => ({
      value: c.id.toString(),
      label: c.nombre,
    })) || [];

  // Temas y participantes
  const temas = temasData?.results || [];
  const participantes = participantesData?.results || [];

  // Footer con botones - cambia según el estado
  const footer = (
    <>
      <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
        {createdEncuesta ? 'Finalizar' : 'Cancelar'}
      </Button>
      {activeTab === 'datos' && (
        <Button
          type="submit"
          variant="primary"
          onClick={handleSubmit}
          disabled={isLoading || !formData.titulo || (!isEditing && !formData.analisis_dofa)}
          isLoading={isLoading}
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Encuesta'}
        </Button>
      )}
    </>
  );

  // Renderizar tabs
  const renderTabs = () => (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      {[
        { key: 'datos', label: 'Datos Basicos', disabled: false },
        {
          key: 'temas',
          label: isPciPoam
            ? `Preguntas (${temas.length || preguntasData?.length || 75})`
            : `Temas (${temas.length})`,
          disabled: false,
        },
        {
          key: 'participantes',
          label: `Participantes (${participantes.length})`,
          disabled: !isEditing,
        },
      ].map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => !tab.disabled && setActiveTab(tab.key as typeof activeTab)}
          disabled={tab.disabled}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === tab.key
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : tab.disabled
                ? 'border-transparent text-gray-400 cursor-not-allowed'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  // Renderizar contenido segun tab activo
  const renderContent = () => {
    switch (activeTab) {
      case 'datos':
        return renderDatosTab();
      case 'temas':
        return renderTemasTab();
      case 'participantes':
        return renderParticipantesTab();
      default:
        return null;
    }
  };

  // Tab: Datos Basicos
  const renderDatosTab = () => (
    <div className="space-y-6">
      {/* Seccion: Tipo de Encuesta */}
      {!isEditing && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Tipo de Encuesta
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: 'libre' as TipoEncuesta,
                label: 'Encuesta Libre',
                desc: 'Preguntas personalizadas (F/D)',
                icon: ClipboardList,
              },
              {
                value: 'pci_poam' as TipoEncuesta,
                label: 'PCI-POAM',
                desc: '75 preguntas estandar (F/D/O/A)',
                icon: FileText,
              },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      tipo_encuesta: opt.value,
                      titulo:
                        opt.value === 'pci_poam' && !formData.titulo
                          ? 'Diagnostico PCI-POAM'
                          : formData.titulo,
                      es_publica: opt.value === 'pci_poam' ? true : formData.es_publica,
                    })
                  }
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                    formData.tipo_encuesta === opt.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 mt-0.5 ${
                      formData.tipo_encuesta === opt.value
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Seccion: Analisis DOFA + PESTEL asociados */}
      {!isEditing && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Analisis Asociados
          </h4>

          {/* DOFA selector con creación rápida */}
          <div>
            {analisisOptions.length > 0 ? (
              <Select
                label="Analisis DOFA *"
                value={formData.analisis_dofa}
                onChange={(e) => setFormData({ ...formData, analisis_dofa: e.target.value })}
                options={[{ value: '', label: 'Seleccione un analisis...' }, ...analisisOptions]}
                required
              />
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Analisis DOFA *
                </label>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                    No hay analisis DOFA creados. Necesitas al menos uno para vincular la encuesta.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleQuickCreateDofa}
                    isLoading={createAnalisisDofaMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Crear Analisis DOFA {new Date().getFullYear()}
                  </Button>
                </div>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              La encuesta alimentara este analisis DOFA
            </p>
          </div>

          {/* PESTEL selector con creación rápida (solo PCI-POAM) */}
          {isPciPoam && (
            <div>
              {pestelOptions.length > 0 ? (
                <Select
                  label="Analisis PESTEL (opcional)"
                  value={formData.analisis_pestel}
                  onChange={(e) => setFormData({ ...formData, analisis_pestel: e.target.value })}
                  options={[{ value: '', label: 'Sin PESTEL asociado' }, ...pestelOptions]}
                />
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Analisis PESTEL (opcional)
                  </label>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      No hay analisis PESTEL. Crea uno para que las preguntas POAM alimenten ambos
                      analisis.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleQuickCreatePestel}
                      isLoading={createAnalisisPestelMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Crear Analisis PESTEL {new Date().getFullYear()}
                    </Button>
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Las preguntas POAM (O/A) tambien alimentaran este analisis PESTEL
              </p>
            </div>
          )}
        </div>
      )}

      {/* Seccion: Informacion General */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Informacion General
        </h4>

        <Input
          label="Titulo de la Encuesta *"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          placeholder={
            isPciPoam
              ? 'Ej: Diagnostico PCI-POAM 2026'
              : 'Ej: Encuesta de Contexto Organizacional Q1 2026'
          }
          required
        />

        <Textarea
          label="Descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Descripcion de la encuesta para los participantes..."
          rows={3}
        />
      </div>

      {/* Seccion: Vigencia */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Vigencia
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Fecha de Inicio *"
            value={formData.fecha_inicio}
            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
            required
          />
          <Input
            type="date"
            label="Fecha de Cierre *"
            value={formData.fecha_cierre}
            onChange={(e) => setFormData({ ...formData, fecha_cierre: e.target.value })}
            required
            min={formData.fecha_inicio}
          />
        </div>
      </div>

      {/* Seccion: Configuracion */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Configuracion
        </h4>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Encuesta Publica</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cualquiera con el enlace puede responder (anonimo)
            </p>
          </div>
          <Switch
            checked={formData.es_publica}
            onChange={(e) => setFormData({ ...formData, es_publica: e.target.checked })}
          />
        </div>

        {/* Enlace publico */}
        {isEditing && encuestaDetail?.es_publica && encuestaDetail?.enlace_publico && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Enlace Publico
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={window.location.origin + encuestaDetail.enlace_publico}
                readOnly
                className="flex-1 text-xs font-mono"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleCopyLink}>
                {copiedLink ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Requiere Justificacion
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Los participantes deben explicar su clasificacion
            </p>
          </div>
          <Switch
            checked={formData.requiere_justificacion}
            onChange={(e) => setFormData({ ...formData, requiere_justificacion: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );

  // Tab: Temas
  const renderTemasTab = () => {
    // PCI-POAM: mostrar preview de preguntas agrupadas (si no es edición con temas ya creados)
    const showPciPoamPreview = isPciPoam && !isEditing;
    const showPciPoamCreated = isPciPoam && isEditing;

    return (
      <div className="space-y-6">
        {showPciPoamPreview ? (
          <>
            <Alert
              variant="info"
              message={`Se auto-generaran ${preguntasData?.length || 75} temas desde el banco de preguntas PCI-POAM al crear la encuesta.`}
            />
            {/* Preview agrupado por capacidad/factor */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(preguntasAgrupadas).map(([grupo, preguntas]) => (
                <div key={grupo}>
                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Badge variant={preguntas[0]?.perfil === 'pci' ? 'info' : 'warning'} size="sm">
                      {preguntas[0]?.perfil === 'pci' ? 'PCI' : 'POAM'}
                    </Badge>
                    {grupo}
                    <span className="text-xs text-gray-400 font-normal">
                      ({preguntas.length} preguntas)
                    </span>
                  </h5>
                  <div className="space-y-1 ml-4">
                    {preguntas.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-start gap-2 py-1.5 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <span className="text-xs font-mono text-gray-400 mt-0.5 min-w-[50px]">
                          {p.codigo}
                        </span>
                        <span>{p.texto}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : showPciPoamCreated ? (
          <>
            <Alert
              variant="success"
              message={`${temas.length} temas auto-generados desde el banco PCI-POAM. Estos temas no se pueden modificar.`}
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {temas.map((tema, index) => (
                <div
                  key={tema.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-xs font-mono text-gray-400 min-w-[50px]">
                    {tema.pregunta_codigo || `#${index + 1}`}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {tema.titulo}
                  </span>
                  {tema.clasificacion_esperada && (
                    <Badge
                      variant={tema.clasificacion_esperada === 'fd' ? 'info' : 'warning'}
                      size="sm"
                    >
                      {tema.clasificacion_esperada === 'fd' ? 'F/D' : 'O/A'}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <Alert
              variant="info"
              message="Los temas son los aspectos organizacionales que los participantes evaluaran como fortaleza o debilidad."
            />

            {/* Lista de temas */}
            <div className="space-y-2">
              {temas.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay temas agregados</p>
                </div>
              ) : (
                temas.map((tema, index) => (
                  <div
                    key={tema.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {tema.titulo}
                        </p>
                        {tema.area_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Area: {tema.area_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTema(tema)}
                      disabled={currentEncuesta?.estado !== 'borrador'}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Agregar nuevo tema */}
            {currentEncuesta?.estado === 'borrador' && (
              <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg space-y-4">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agregar Nuevo Tema
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Titulo del Tema"
                    value={newTema.titulo}
                    onChange={(e) => setNewTema({ ...newTema, titulo: e.target.value })}
                    placeholder="Ej: Comunicacion Interna"
                  />
                  <Select
                    label="Area (opcional)"
                    value={newTema.area?.toString() || ''}
                    onChange={(e) =>
                      setNewTema({
                        ...newTema,
                        area: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    options={[{ value: '', label: 'General' }, ...areaOptions]}
                  />
                </div>
                <Textarea
                  label="Descripcion (opcional)"
                  value={newTema.descripcion || ''}
                  onChange={(e) => setNewTema({ ...newTema, descripcion: e.target.value })}
                  placeholder="Descripcion para ayudar a los participantes..."
                  rows={2}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTema}
                  disabled={!newTema.titulo.trim() || createTemaMutation.isPending}
                  isLoading={createTemaMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Tema
                </Button>
              </div>
            )}

            {currentEncuesta?.estado !== 'borrador' && (
              <Alert
                variant="warning"
                message="Los temas solo pueden modificarse mientras la encuesta esta en borrador."
              />
            )}
          </>
        )}
      </div>
    );
  };

  // Tab: Participantes
  const renderParticipantesTab = () => (
    <div className="space-y-6">
      {formData.es_publica && (
        <Alert
          variant="info"
          message="Esta encuesta es publica. Cualquier persona con el enlace puede responder de forma anonima. Los participantes agregados aqui recibiran notificacion pero no es obligatorio agregarlos."
        />
      )}

      {/* Lista de participantes */}
      <div className="space-y-2">
        {participantes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay participantes agregados</p>
          </div>
        ) : (
          participantes.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                  {p.tipo === 'usuario' && <Users className="h-4 w-4" />}
                  {p.tipo === 'area' && <Building2 className="h-4 w-4" />}
                  {p.tipo === 'cargo' && <Briefcase className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {p.usuario_nombre || p.area_nombre || p.cargo_nombre || 'Sin nombre'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{p.tipo_display}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    p.estado === 'completado'
                      ? 'success'
                      : p.estado === 'en_progreso'
                        ? 'warning'
                        : 'gray'
                  }
                  size="sm"
                >
                  {p.estado_display || p.estado}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteParticipante(p)}
                  disabled={currentEncuesta?.estado !== 'borrador'}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Agregar nuevo participante */}
      {currentEncuesta?.estado === 'borrador' && (
        <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg space-y-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Agregar Participante
          </h5>

          <div className="flex gap-2 mb-4">
            {TIPO_PARTICIPANTE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewParticipante({ tipo: opt.value })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    newParticipante.tipo === opt.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selector segun tipo */}
          {newParticipante.tipo === 'area' && (
            <Select
              label="Seleccione el Area"
              value={newParticipante.area?.toString() || ''}
              onChange={(e) =>
                setNewParticipante({
                  ...newParticipante,
                  area: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              options={[{ value: '', label: 'Seleccione...' }, ...areaOptions]}
            />
          )}

          {newParticipante.tipo === 'usuario' && (
            <Select
              label="Seleccione el Colaborador"
              value={newParticipante.usuario?.toString() || ''}
              onChange={(e) =>
                setNewParticipante({
                  ...newParticipante,
                  usuario: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              options={[
                { value: '', label: 'Seleccione un colaborador...' },
                ...colaboradorOptions,
              ]}
              helperText={
                colaboradorOptions.length === 0
                  ? 'No hay colaboradores activos disponibles'
                  : undefined
              }
            />
          )}

          {newParticipante.tipo === 'cargo' && (
            <Select
              label="Seleccione el Cargo"
              value={newParticipante.cargo?.toString() || ''}
              onChange={(e) =>
                setNewParticipante({
                  ...newParticipante,
                  cargo: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              options={[{ value: '', label: 'Seleccione un cargo...' }, ...cargoOptions]}
              helperText="Todos los colaboradores con este cargo seran invitados"
            />
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddParticipante}
            disabled={
              addParticipanteMutation.isPending ||
              (newParticipante.tipo === 'area' && !newParticipante.area) ||
              (newParticipante.tipo === 'usuario' && !newParticipante.usuario) ||
              (newParticipante.tipo === 'cargo' && !newParticipante.cargo)
            }
            isLoading={addParticipanteMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Participante
          </Button>
        </div>
      )}

      {currentEncuesta?.estado !== 'borrador' && (
        <Alert
          variant="warning"
          message="Los participantes solo pueden modificarse mientras la encuesta esta en borrador."
        />
      )}
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? `Editar Encuesta ${currentEncuesta?.tipo_encuesta === 'pci_poam' ? 'PCI-POAM' : 'DOFA'}`
          : isPciPoam
            ? 'Nueva Encuesta PCI-POAM'
            : 'Nueva Encuesta DOFA'
      }
      subtitle={
        isPciPoam
          ? 'Diagnostico de contexto con 75 preguntas estandar PCI-POAM'
          : 'Recopila opiniones de colaboradores sobre fortalezas y debilidades'
      }
      size="3xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit}>
        {isEditing && renderTabs()}
        {renderContent()}
      </form>
    </BaseModal>
  );
};

export default EncuestaFormModal;
