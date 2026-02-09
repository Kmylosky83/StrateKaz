/**
 * Página: Configuración de Indicadores
 *
 * CRUD completo para la configuración de KPIs con 4 tabs:
 * - Catálogo KPIs
 * - Fichas Técnicas
 * - Metas
 * - Semáforos
 *
 * Datos reales desde hooks TanStack Query.
 */
import { useState } from 'react';
import {
  BarChart3,
  FileText,
  Target,
  Palette,
  Plus,
  Edit,
  Trash2,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  useCatalogosKPI,
  useFichasTecnicas,
  useMetasKPI,
  useSemaforos,
  useDeleteCatalogoKPI,
  useDeleteFichaTecnica,
  useDeleteMetaKPI,
  useDeleteSemaforo,
} from '../hooks/useAnalytics';
import { CatalogoKPIFormModal } from '../components/CatalogoKPIFormModal';
import { FichaTecnicaFormModal } from '../components/FichaTecnicaFormModal';
import { MetaKPIFormModal } from '../components/MetaKPIFormModal';
import { SemaforoFormModal } from '../components/SemaforoFormModal';
import type {
  CatalogoKPI,
  FichaTecnicaKPI,
  MetaKPI,
  ConfiguracionSemaforo,
} from '../types';

// ==================== UTILITY FUNCTIONS ====================

const getCategoriaColor = (categoria: string) => {
  const colors: Record<string, string> = {
    sst: 'bg-orange-100 text-orange-800',
    pesv: 'bg-blue-100 text-blue-800',
    ambiental: 'bg-green-100 text-green-800',
    calidad: 'bg-purple-100 text-purple-800',
    financiero: 'bg-indigo-100 text-indigo-800',
    operacional: 'bg-cyan-100 text-cyan-800',
    rrhh: 'bg-pink-100 text-pink-800',
    comercial: 'bg-teal-100 text-teal-800',
  };
  return colors[categoria] || 'bg-gray-100 text-gray-800';
};

// ==================== SECTIONS ====================

interface CatalogoSectionProps {
  onEdit: (item: CatalogoKPI) => void;
  onNew: () => void;
}

const CatalogoKPISection = ({ onEdit, onNew }: CatalogoSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: catalogosData, isLoading } = useCatalogosKPI();
  const deleteMutation = useDeleteCatalogoKPI();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const catalogos = Array.isArray(catalogosData) ? catalogosData : [];
  const filtered = catalogos.filter(
    (k: CatalogoKPI) =>
      !searchTerm ||
      k.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[200px]"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar KPIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>
          Nuevo KPI
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<BarChart3 className="w-12 h-12" />} title="Sin indicadores" description="Cree su primer KPI para comenzar" />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BSC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frecuencia</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((kpi: CatalogoKPI) => (
                  <tr key={kpi.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{kpi.codigo}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{kpi.nombre}</td>
                    <td className="px-6 py-4">
                      <Badge variant="gray" size="sm" className={getCategoriaColor(kpi.categoria)}>{kpi.categoria.toUpperCase()}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 capitalize">{kpi.tipo_indicador}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 capitalize">{kpi.perspectiva_bsc}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 capitalize">{kpi.frecuencia_medicion}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={kpi.activo ? 'success' : 'gray'} size="sm">{kpi.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(kpi)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(kpi.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
        title="Eliminar KPI"
        message="¿Está seguro de eliminar este indicador? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

const FichasTecnicasSection = ({ kpis, onEdit, onNew }: { kpis: CatalogoKPI[]; onEdit: (item: FichaTecnicaKPI) => void; onNew: () => void }) => {
  const { data: fichasData, isLoading } = useFichasTecnicas();
  const deleteMutation = useDeleteFichaTecnica();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fichas = Array.isArray(fichasData) ? fichasData : [];

  if (isLoading) return <div className="flex items-center justify-center min-h-[200px]"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fichas Técnicas de KPIs</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>Nueva Ficha</Button>
      </div>

      {fichas.length === 0 ? (
        <EmptyState icon={<FileText className="w-12 h-12" />} title="Sin fichas técnicas" description="Cree fichas técnicas para documentar sus KPIs" />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {fichas.map((ficha: FichaTecnicaKPI) => (
            <Card key={ficha.id} variant="bordered" padding="md">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{ficha.kpi_nombre}</h4>
                    <p className="text-sm text-gray-500">{ficha.kpi_codigo}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(ficha)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(ficha.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Fórmula</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1 font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">{ficha.formula}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Fuente de Datos</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">{ficha.fuente_datos}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Responsable de Medición</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{ficha.responsable_nombre}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
        title="Eliminar Ficha Técnica" message="¿Está seguro de eliminar esta ficha técnica?" confirmLabel="Eliminar" variant="danger" isLoading={deleteMutation.isPending} />
    </div>
  );
};

const MetasSection = ({ kpis, onEdit, onNew }: { kpis: CatalogoKPI[]; onEdit: (item: MetaKPI) => void; onNew: () => void }) => {
  const { data: metasData, isLoading } = useMetasKPI();
  const deleteMutation = useDeleteMetaKPI();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const metas = Array.isArray(metasData) ? metasData : [];

  if (isLoading) return <div className="flex items-center justify-center min-h-[200px]"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Metas por KPI</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>Nueva Meta</Button>
      </div>

      {metas.length === 0 ? (
        <EmptyState icon={<Target className="w-12 h-12" />} title="Sin metas" description="Configure metas para evaluar el desempeño de sus KPIs" />
      ) : (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KPI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periodo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mínima</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Esperada</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Óptima</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {metas.map((meta: MetaKPI) => (
                  <tr key={meta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4"><p className="text-sm font-medium text-gray-900 dark:text-white">{meta.kpi_nombre}</p><p className="text-xs text-gray-500">{meta.kpi_codigo}</p></td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{meta.periodo}</td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">{meta.meta_minima}</td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-primary-600">{meta.meta_esperada}</td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-green-600">{meta.meta_optima}</td>
                    <td className="px-6 py-4 text-center"><Badge variant={meta.activa ? 'success' : 'gray'} size="sm">{meta.activa ? 'Activa' : 'Inactiva'}</Badge></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(meta)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(meta.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
        title="Eliminar Meta" message="¿Está seguro de eliminar esta meta?" confirmLabel="Eliminar" variant="danger" isLoading={deleteMutation.isPending} />
    </div>
  );
};

const SemaforosSection = ({ kpis, onEdit, onNew }: { kpis: CatalogoKPI[]; onEdit: (item: ConfiguracionSemaforo) => void; onNew: () => void }) => {
  const { data: semaforosData, isLoading } = useSemaforos();
  const deleteMutation = useDeleteSemaforo();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const semaforos = Array.isArray(semaforosData) ? semaforosData : [];

  if (isLoading) return <div className="flex items-center justify-center min-h-[200px]"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuración de Semáforos</h3>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>Nuevo Semáforo</Button>
      </div>

      {semaforos.length === 0 ? (
        <EmptyState icon={<Palette className="w-12 h-12" />} title="Sin semáforos" description="Configure umbrales de semáforo para evaluar visualmente sus KPIs" />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {semaforos.map((semaforo: ConfiguracionSemaforo) => (
            <Card key={semaforo.id} variant="bordered" padding="md">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{semaforo.kpi_nombre}</h4>
                    <p className="text-sm text-gray-500">{semaforo.kpi_codigo}</p>
                    {semaforo.logica_inversa && <Badge variant="info" size="sm" className="mt-2">Lógica Inversa</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(semaforo)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(semaforo.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Verde', color: 'bg-green-500', min: semaforo.umbral_verde_min, max: semaforo.umbral_verde_max, desc: 'Óptimo' },
                    { label: 'Amarillo', color: 'bg-yellow-500', min: semaforo.umbral_amarillo_min, max: semaforo.umbral_amarillo_max, desc: 'Alerta' },
                    { label: 'Rojo', color: 'bg-red-500', min: semaforo.umbral_rojo_min, max: semaforo.umbral_rojo_max, desc: 'Crítico' },
                  ].map((u) => (
                    <div key={u.label} className="flex items-center gap-3">
                      <div className={`w-16 h-16 ${u.color} rounded-lg flex items-center justify-center`}>
                        <span className="text-white font-bold">{u.label}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{u.min ?? 0} - {u.max ?? '∞'}</p>
                        <p className="text-xs text-gray-500">{u.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
        title="Eliminar Semáforo" message="¿Está seguro de eliminar esta configuración?" confirmLabel="Eliminar" variant="danger" isLoading={deleteMutation.isPending} />
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function ConfigIndicadoresPage() {
  const [activeTab, setActiveTab] = useState('catalogo');

  const [selectedCatalogo, setSelectedCatalogo] = useState<CatalogoKPI | null>(null);
  const [showCatalogoModal, setShowCatalogoModal] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<FichaTecnicaKPI | null>(null);
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<MetaKPI | null>(null);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [selectedSemaforo, setSelectedSemaforo] = useState<ConfiguracionSemaforo | null>(null);
  const [showSemaforoModal, setShowSemaforoModal] = useState(false);

  const { data: kpisData } = useCatalogosKPI();
  const kpis: CatalogoKPI[] = Array.isArray(kpisData) ? kpisData : [];

  const tabs = [
    { id: 'catalogo', label: 'Catálogo KPIs', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'fichas', label: 'Fichas Técnicas', icon: <FileText className="w-4 h-4" /> },
    { id: 'metas', label: 'Metas', icon: <Target className="w-4 h-4" /> },
    { id: 'semaforos', label: 'Semáforos', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Configuración de Indicadores" description="Administración del catálogo de KPIs, fichas técnicas, metas y semáforos" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="mt-6">
        {activeTab === 'catalogo' && <CatalogoKPISection onNew={() => { setSelectedCatalogo(null); setShowCatalogoModal(true); }} onEdit={(item) => { setSelectedCatalogo(item); setShowCatalogoModal(true); }} />}
        {activeTab === 'fichas' && <FichasTecnicasSection kpis={kpis} onNew={() => { setSelectedFicha(null); setShowFichaModal(true); }} onEdit={(item) => { setSelectedFicha(item); setShowFichaModal(true); }} />}
        {activeTab === 'metas' && <MetasSection kpis={kpis} onNew={() => { setSelectedMeta(null); setShowMetaModal(true); }} onEdit={(item) => { setSelectedMeta(item); setShowMetaModal(true); }} />}
        {activeTab === 'semaforos' && <SemaforosSection kpis={kpis} onNew={() => { setSelectedSemaforo(null); setShowSemaforoModal(true); }} onEdit={(item) => { setSelectedSemaforo(item); setShowSemaforoModal(true); }} />}
      </div>

      <CatalogoKPIFormModal item={selectedCatalogo} isOpen={showCatalogoModal} onClose={() => { setShowCatalogoModal(false); setSelectedCatalogo(null); }} />
      <FichaTecnicaFormModal item={selectedFicha} kpis={kpis} isOpen={showFichaModal} onClose={() => { setShowFichaModal(false); setSelectedFicha(null); }} />
      <MetaKPIFormModal item={selectedMeta} kpis={kpis} isOpen={showMetaModal} onClose={() => { setShowMetaModal(false); setSelectedMeta(null); }} />
      <SemaforoFormModal item={selectedSemaforo} kpis={kpis} isOpen={showSemaforoModal} onClose={() => { setShowSemaforoModal(false); setSelectedSemaforo(null); }} />
    </div>
  );
}
