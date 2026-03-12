/**
 * Modal Generador de Actas de Revisión por Dirección (ISO 9.3)
 *
 * Funcionalidades:
 * - Selección de programación de revisión
 * - Elementos de entrada según ISO 9.3.2
 * - Análisis y discusión
 * - Decisiones y acciones según ISO 9.3.3
 * - Lista de participantes con asistencia
 * - Generación de compromisos derivados
 */
import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { Alert } from '@/components/common/Alert';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Badge } from '@/components/common/Badge';
import { toast } from 'sonner';
import {
  useProgramasRevision,
  useActaByProgramacion,
  useCreateActa,
  useUpdateActa,
  useProgramacionChoices,
  useActaChoices,
} from '../../hooks/useRevisionDireccion';
import type {
  ActaRevision,
  CreateActaRevisionDTO,
  CreateElementoEntradaDTO,
  CreateDecisionResultadoDTO,
  CreateCompromisoAccionDTO,
  CreateParticipanteActaDTO,
  EntradaCategoria,
  TipoDecision,
  PrioridadCompromiso,
  AsistenciaEstado,
} from '../../types/revisionDireccion';
import type { Tab } from '@/components/common';
import { FileText, Users, ListChecks, Target, AlertCircle, Calendar } from 'lucide-react';

interface GeneradorActaModalProps {
  acta: ActaRevision | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType =
  | 'general'
  | 'participantes'
  | 'elementos'
  | 'analisis'
  | 'decisiones'
  | 'compromisos';

const TABS: Tab[] = [
  { id: 'general', label: 'General', icon: <FileText className="w-4 h-4" /> },
  { id: 'participantes', label: 'Participantes', icon: <Users className="w-4 h-4" /> },
  { id: 'elementos', label: 'Elementos de Entrada', icon: <ListChecks className="w-4 h-4" /> },
  { id: 'analisis', label: 'Análisis', icon: <AlertCircle className="w-4 h-4" /> },
  { id: 'decisiones', label: 'Decisiones', icon: <Target className="w-4 h-4" /> },
  { id: 'compromisos', label: 'Compromisos', icon: <Calendar className="w-4 h-4" /> },
];

export const GeneradorActaModal = ({ acta, isOpen, onClose }: GeneradorActaModalProps) => {
  const isEditing = acta !== null;

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [selectedProgramacionId, setSelectedProgramacionId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // General
    programacion: 0,
    fecha_revision: '',
    hora_inicio: '',
    hora_fin: '',
    ubicacion: '',
    presidente: undefined as number | undefined,
    secretario: undefined as number | undefined,

    // Participantes
    participantes: [] as CreateParticipanteActaDTO[],

    // Elementos de Entrada (ISO 9.3.2)
    elementos_entrada: [] as CreateElementoEntradaDTO[],

    // Análisis y Discusión
    analisis_discusion: '',
    puntos_discutidos: '',

    // Decisiones y Resultados (ISO 9.3.3)
    decisiones: [] as CreateDecisionResultadoDTO[],

    // Compromisos
    compromisos: [] as CreateCompromisoAccionDTO[],
  });

  // Queries
  const { data: programaciones } = useProgramasRevision({ estado: 'PROGRAMADA' });
  const { data: _programacionChoices } = useProgramacionChoices();
  const { data: actaChoices } = useActaChoices();
  const { data: actaExistente } = useActaByProgramacion(selectedProgramacionId || 0);

  // Mutations
  const createMutation = useCreateActa();
  const updateMutation = useUpdateActa();

  // Cargar datos del acta existente
  useEffect(() => {
    if (acta) {
      setSelectedProgramacionId(acta.programacion);
      setFormData({
        programacion: acta.programacion,
        fecha_revision: acta.fecha_revision,
        hora_inicio: acta.hora_inicio,
        hora_fin: acta.hora_fin || '',
        ubicacion: acta.ubicacion || '',
        presidente: acta.presidente || undefined,
        secretario: acta.secretario || undefined,
        participantes: acta.participantes.map((p) => ({
          usuario: p.usuario || undefined,
          nombre_externo: p.nombre_externo || undefined,
          rol_reunion: p.rol_reunion,
          asistencia: p.asistencia,
          hora_llegada: p.hora_llegada || undefined,
          observaciones: p.observaciones || undefined,
        })),
        elementos_entrada: acta.elementos_entrada.map((e) => ({
          categoria: e.categoria,
          titulo: e.titulo,
          descripcion: e.descripcion,
          fuente_informacion: e.fuente_informacion || undefined,
          responsable_presentacion: e.responsable_presentacion || undefined,
          order: e.order,
        })),
        analisis_discusion: acta.analisis_discusion || '',
        puntos_discutidos: acta.puntos_discutidos || '',
        decisiones: acta.decisiones.map((d) => ({
          tipo_decision: d.tipo_decision,
          descripcion: d.descripcion,
          justificacion: d.justificacion || undefined,
          impacto_esperado: d.impacto_esperado || undefined,
          recursos_necesarios: d.recursos_necesarios || undefined,
          responsable: d.responsable || undefined,
          fecha_limite: d.fecha_limite || undefined,
          prioridad: d.prioridad,
          order: d.order,
        })),
        compromisos: acta.compromisos.map((c) => ({
          descripcion: c.descripcion,
          objetivo: c.objetivo || undefined,
          responsable: c.responsable,
          fecha_limite: c.fecha_limite,
          prioridad: c.prioridad,
          relacionado_decision: c.relacionado_decision || undefined,
          relacionado_entrada: c.relacionado_entrada || undefined,
        })),
      });
    } else {
      resetForm();
    }
    setActiveTab('general');
  }, [acta]);

  const resetForm = () => {
    setSelectedProgramacionId(null);
    setFormData({
      programacion: 0,
      fecha_revision: new Date().toISOString().split('T')[0],
      hora_inicio: '',
      hora_fin: '',
      ubicacion: '',
      presidente: undefined,
      secretario: undefined,
      participantes: [],
      elementos_entrada: [],
      analisis_discusion: '',
      puntos_discutidos: '',
      decisiones: [],
      compromisos: [],
    });
  };

  const handleProgramacionChange = (programacionId: number) => {
    setSelectedProgramacionId(programacionId);
    const programacion = programaciones?.results.find((p) => p.id === programacionId);
    if (programacion) {
      setFormData((prev) => ({
        ...prev,
        programacion: programacionId,
        fecha_revision: programacion.fecha_programada,
        hora_inicio: programacion.hora_inicio,
        hora_fin: programacion.hora_fin || '',
        ubicacion: programacion.ubicacion || '',
        // Importar participantes convocados
        participantes: programacion.convocados.map((c) => ({
          usuario: c.usuario || undefined,
          nombre_externo: c.nombre_externo || undefined,
          rol_reunion: c.rol_reunion,
          asistencia: 'CONFIRMADA' as AsistenciaEstado,
        })),
      }));
    }
  };

  // Elementos de Entrada
  const addElementoEntrada = () => {
    setFormData((prev) => ({
      ...prev,
      elementos_entrada: [
        ...prev.elementos_entrada,
        {
          categoria: 'DESEMPENO_PROCESOS' as EntradaCategoria,
          titulo: '',
          descripcion: '',
          order: prev.elementos_entrada.length,
        },
      ],
    }));
  };

  const removeElementoEntrada = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      elementos_entrada: prev.elementos_entrada.filter((_, i) => i !== index),
    }));
  };

  const updateElementoEntrada = (index: number, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      elementos_entrada: prev.elementos_entrada.map((e, i) =>
        i === index ? { ...e, [field]: value } : e
      ),
    }));
  };

  // Decisiones
  const addDecision = () => {
    setFormData((prev) => ({
      ...prev,
      decisiones: [
        ...prev.decisiones,
        {
          tipo_decision: 'MEJORA_SISTEMA' as TipoDecision,
          descripcion: '',
          prioridad: 'MEDIA' as PrioridadCompromiso,
          order: prev.decisiones.length,
        },
      ],
    }));
  };

  const removeDecision = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      decisiones: prev.decisiones.filter((_, i) => i !== index),
    }));
  };

  const updateDecision = (index: number, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      decisiones: prev.decisiones.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    }));
  };

  // Compromisos
  const addCompromiso = () => {
    setFormData((prev) => ({
      ...prev,
      compromisos: [
        ...prev.compromisos,
        {
          descripcion: '',
          responsable: 0,
          fecha_limite: '',
          prioridad: 'MEDIA' as PrioridadCompromiso,
        },
      ],
    }));
  };

  const removeCompromiso = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      compromisos: prev.compromisos.filter((_, i) => i !== index),
    }));
  };

  const updateCompromiso = (index: number, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      compromisos: prev.compromisos.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.programacion) {
      toast.error('Debe seleccionar una programación de revisión');
      return;
    }

    const actaData: CreateActaRevisionDTO = {
      programacion: formData.programacion,
      fecha_revision: formData.fecha_revision,
      hora_inicio: formData.hora_inicio,
      hora_fin: formData.hora_fin || undefined,
      ubicacion: formData.ubicacion || undefined,
      presidente: formData.presidente,
      secretario: formData.secretario,
      participantes: formData.participantes.length > 0 ? formData.participantes : undefined,
      elementos_entrada:
        formData.elementos_entrada.length > 0 ? formData.elementos_entrada : undefined,
      analisis_discusion: formData.analisis_discusion || undefined,
      puntos_discutidos: formData.puntos_discutidos || undefined,
      decisiones: formData.decisiones.length > 0 ? formData.decisiones : undefined,
      compromisos: formData.compromisos.length > 0 ? formData.compromisos : undefined,
    };

    if (isEditing && acta) {
      await updateMutation.mutateAsync({ id: acta.id, data: actaData });
    } else {
      await createMutation.mutateAsync(actaData);
    }

    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const programacionOptions =
    programaciones?.results.map((p) => ({
      value: p.id,
      label: `${p.codigo} - ${p.nombre} (${new Date(p.fecha_programada).toLocaleDateString()})`,
    })) || [];

  const categoriaOptions = actaChoices?.categorias_entrada || [];
  const tipoDecisionOptions = actaChoices?.tipos_decision || [];
  const prioridadOptions = actaChoices?.prioridades || [];

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="primary"
        onClick={handleSubmit}
        disabled={isLoading || !formData.programacion}
        isLoading={isLoading}
      >
        {isEditing ? 'Actualizar Acta' : 'Generar Acta'}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? 'Editar Acta de Revisión por Dirección'
          : 'Generar Acta de Revisión por Dirección'
      }
      subtitle="ISO 9.3 - Revisión por la Dirección"
      size="4xl"
      footer={footer}
    >
      <div className="space-y-6">
        {actaExistente && !isEditing && (
          <Alert
            variant="warning"
            message="Esta programación ya tiene un acta generada. Puede editarla o crear una nueva versión."
          />
        )}

        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as TabType)}
          variant="pills"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <Select
                label="Programación de Revisión *"
                value={formData.programacion}
                onChange={(e) => handleProgramacionChange(Number(e.target.value))}
                options={programacionOptions}
                disabled={isEditing}
                required
                helpText="Seleccione la programación de revisión existente"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Fecha de Revisión *"
                  type="date"
                  value={formData.fecha_revision}
                  onChange={(e) => setFormData({ ...formData, fecha_revision: e.target.value })}
                  required
                />
                <Input
                  label="Ubicación"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  placeholder="Sala de juntas, enlace virtual, etc."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Hora de Inicio *"
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  required
                />
                <Input
                  label="Hora de Fin"
                  type="time"
                  value={formData.hora_fin}
                  onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                />
              </div>

              <Alert
                variant="info"
                message="Los participantes se cargarán automáticamente desde la programación seleccionada. Puede modificarlos en la siguiente pestaña."
              />
            </div>
          )}

          {/* TAB: PARTICIPANTES */}
          {activeTab === 'participantes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Lista de Participantes</h3>
                <Badge variant="info">{formData.participantes.length} participantes</Badge>
              </div>

              <div className="space-y-2">
                {formData.participantes.map((participante, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          {participante.nombre_externo || `Usuario ${participante.usuario}`}
                        </p>
                        <p className="text-sm text-gray-600">{participante.rol_reunion}</p>
                      </div>
                      <Badge
                        variant={
                          participante.asistencia === 'ASISTIO'
                            ? 'success'
                            : participante.asistencia === 'NO_ASISTIO'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {participante.asistencia}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {formData.participantes.length === 0 && (
                <Alert
                  variant="warning"
                  message="Seleccione una programación para cargar participantes"
                />
              )}
            </div>
          )}

          {/* TAB: ELEMENTOS DE ENTRADA (ISO 9.3.2) */}
          {activeTab === 'elementos' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Elementos de Entrada (ISO 9.3.2)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addElementoEntrada}>
                  + Agregar Elemento
                </Button>
              </div>

              <Alert
                variant="info"
                message="La revisión debe incluir información sobre: estado de acciones anteriores, cambios externos/internos, desempeño de procesos, satisfacción del cliente, no conformidades, resultados de auditorías, etc."
              />

              <div className="space-y-4">
                {formData.elementos_entrada.map((elemento, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <Select
                        label="Categoría"
                        value={elemento.categoria}
                        onChange={(e) =>
                          updateElementoEntrada(
                            index,
                            'categoria',
                            e.target.value as EntradaCategoria
                          )
                        }
                        options={categoriaOptions}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeElementoEntrada(index)}
                      >
                        Eliminar
                      </Button>
                    </div>

                    <Input
                      label="Título"
                      value={elemento.titulo}
                      onChange={(e) => updateElementoEntrada(index, 'titulo', e.target.value)}
                      placeholder="Ej: Resultados de auditoría interna Q1 2025"
                      required
                    />

                    <Textarea
                      label="Descripción"
                      value={elemento.descripcion}
                      onChange={(e) => updateElementoEntrada(index, 'descripcion', e.target.value)}
                      placeholder="Describa el elemento de entrada..."
                      rows={3}
                      required
                    />

                    <Input
                      label="Fuente de Información"
                      value={elemento.fuente_informacion || ''}
                      onChange={(e) =>
                        updateElementoEntrada(index, 'fuente_informacion', e.target.value)
                      }
                      placeholder="Ej: Informe de auditoría IA-2025-001"
                    />
                  </div>
                ))}
              </div>

              {formData.elementos_entrada.length === 0 && (
                <Alert variant="warning" message="Debe agregar al menos un elemento de entrada" />
              )}
            </div>
          )}

          {/* TAB: ANÁLISIS Y DISCUSIÓN */}
          {activeTab === 'analisis' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Análisis y Discusión</h3>

              <Textarea
                label="Análisis de la Información"
                value={formData.analisis_discusion}
                onChange={(e) => setFormData({ ...formData, analisis_discusion: e.target.value })}
                placeholder="Análisis detallado de los elementos de entrada presentados..."
                rows={6}
              />

              <Textarea
                label="Puntos Discutidos"
                value={formData.puntos_discutidos}
                onChange={(e) => setFormData({ ...formData, puntos_discutidos: e.target.value })}
                placeholder="Principales puntos discutidos durante la revisión..."
                rows={6}
              />
            </div>
          )}

          {/* TAB: DECISIONES (ISO 9.3.3) */}
          {activeTab === 'decisiones' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Decisiones y Resultados (ISO 9.3.3)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addDecision}>
                  + Agregar Decisión
                </Button>
              </div>

              <Alert
                variant="info"
                message="Las decisiones deben incluir: mejoras al sistema de gestión, cambios en productos/servicios, y necesidades de recursos."
              />

              <div className="space-y-4">
                {formData.decisiones.map((decision, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3 bg-blue-50">
                    <div className="flex justify-between items-start gap-4">
                      <Select
                        label="Tipo de Decisión"
                        value={decision.tipo_decision}
                        onChange={(e) =>
                          updateDecision(index, 'tipo_decision', e.target.value as TipoDecision)
                        }
                        options={tipoDecisionOptions}
                        required
                      />
                      <Select
                        label="Prioridad"
                        value={decision.prioridad}
                        onChange={(e) =>
                          updateDecision(index, 'prioridad', e.target.value as PrioridadCompromiso)
                        }
                        options={prioridadOptions}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDecision(index)}
                      >
                        Eliminar
                      </Button>
                    </div>

                    <Textarea
                      label="Descripción de la Decisión"
                      value={decision.descripcion}
                      onChange={(e) => updateDecision(index, 'descripcion', e.target.value)}
                      placeholder="Describa la decisión tomada..."
                      rows={3}
                      required
                    />

                    <Input
                      label="Fecha Límite"
                      type="date"
                      value={decision.fecha_limite || ''}
                      onChange={(e) => updateDecision(index, 'fecha_limite', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: COMPROMISOS */}
          {activeTab === 'compromisos' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Compromisos y Acciones Derivadas</h3>
                <Button type="button" variant="outline" size="sm" onClick={addCompromiso}>
                  + Agregar Compromiso
                </Button>
              </div>

              <Alert
                variant="info"
                message="Genere compromisos concretos con responsables y fechas límite para dar seguimiento a las decisiones tomadas."
              />

              <div className="space-y-4">
                {formData.compromisos.map((compromiso, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3 bg-green-50">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Compromiso {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCompromiso(index)}
                      >
                        Eliminar
                      </Button>
                    </div>

                    <Textarea
                      label="Descripción del Compromiso"
                      value={compromiso.descripcion}
                      onChange={(e) => updateCompromiso(index, 'descripcion', e.target.value)}
                      placeholder="Describa el compromiso..."
                      rows={2}
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Fecha Límite *"
                        type="date"
                        value={compromiso.fecha_limite}
                        onChange={(e) => updateCompromiso(index, 'fecha_limite', e.target.value)}
                        required
                      />
                      <Select
                        label="Prioridad *"
                        value={compromiso.prioridad}
                        onChange={(e) =>
                          updateCompromiso(
                            index,
                            'prioridad',
                            e.target.value as PrioridadCompromiso
                          )
                        }
                        options={prioridadOptions}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              {formData.compromisos.length === 0 && (
                <Alert
                  variant="warning"
                  message="Se recomienda generar al menos un compromiso de seguimiento"
                />
              )}
            </div>
          )}
        </form>
      </div>
    </BaseModal>
  );
};
