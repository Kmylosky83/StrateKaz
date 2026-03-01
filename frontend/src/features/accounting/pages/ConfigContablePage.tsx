/**
 * Página: Configuración Contable
 *
 * Gestión del Plan Único de Cuentas (PUC) Colombia:
 * - Plan de Cuentas: Árbol jerárquico de cuentas
 * - Tipos de Documento: Tipos de comprobantes contables
 * - Terceros: Registro de terceros para contabilidad
 * - Centros de Costo: Estructura de centros de costo
 */
import { useState } from 'react';
import {
  BookOpen,
  FileText,
  Users,
  Building2,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import {
  Card,
  Button,
  Badge,
  Tabs,
  Spinner,
  SectionToolbar,
  EmptyState,
  ConfirmDialog,
} from '@/components/common';
import { Input, Select } from '@/components/forms';
import type {
  CuentaContableTree,
  CentroCostoContableTree,
  CuentaContable,
  TipoDocumentoContable,
  Tercero,
  CentroCostoContable,
} from '../types';
import {
  usePlanesCuentas,
  useCuentasArbol,
  useTiposDocumento,
  useTerceros,
  useCentrosCostoContable,
  useDeleteCuentaContable,
  useDeleteTercero,
  useDeleteCentroCosto,
} from '../hooks';
import CuentaContableFormModal from '../components/CuentaContableFormModal';
import TipoDocumentoFormModal from '../components/TipoDocumentoFormModal';
import TerceroFormModal from '../components/TerceroFormModal';
import CentroCostoContableFormModal from '../components/CentroCostoContableFormModal';

const dec = (v: string | number | null | undefined): number => Number(v ?? 0);

const extractResults = <T,>(data: unknown): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const d = data as { results?: T[] };
  return d.results ?? [];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);

// ==================== TREE COMPONENTS ====================

const CuentaTreeItem = ({
  cuenta,
  level = 0,
  onEdit,
}: {
  cuenta: CuentaContableTree;
  level?: number;
  onEdit: (id: number) => void;
}) => {
  const [expanded, setExpanded] = useState(level < 1);
  const hasChildren = cuenta.children && cuenta.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <span className="font-mono text-sm font-medium text-primary-600 w-20">{cuenta.codigo}</span>
        <span className="flex-1 text-sm text-gray-900 dark:text-white">{cuenta.nombre}</span>

        <Badge variant={cuenta.naturaleza === 'debito' ? 'primary' : 'success'} size="sm">
          {cuenta.naturaleza === 'debito' ? 'Débito' : 'Crédito'}
        </Badge>

        <Badge variant={cuenta.acepta_movimientos ? 'warning' : 'secondary'} size="sm">
          {cuenta.acepta_movimientos ? 'Movimiento' : 'Título'}
        </Badge>

        {cuenta.saldo_final && dec(cuenta.saldo_final) !== 0 && (
          <span className="text-xs font-mono text-gray-500">
            {formatCurrency(dec(cuenta.saldo_final))}
          </span>
        )}

        <Button variant="ghost" size="sm" className="p-1" onClick={() => onEdit(cuenta.id)}>
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>

      {expanded && hasChildren && (
        <div>
          {cuenta.children.map((hijo) => (
            <CuentaTreeItem key={hijo.id} cuenta={hijo} level={level + 1} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
};

const CentroCostoTreeItem = ({
  centro,
  level = 0,
  onEdit,
}: {
  centro: CentroCostoContableTree;
  level?: number;
  onEdit: (id: number) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = centro.children && centro.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <span className="font-mono text-sm font-medium text-primary-600 w-20">{centro.codigo}</span>
        <span className="flex-1 text-sm text-gray-900 dark:text-white">{centro.nombre}</span>
        <Badge variant="secondary" size="sm">
          {centro.tipo_centro}
        </Badge>
        {dec(centro.presupuesto_anual) > 0 && (
          <span className="text-xs font-mono text-gray-500">
            {formatCurrency(dec(centro.presupuesto_anual))}
          </span>
        )}
        <Button variant="ghost" size="sm" className="p-1" onClick={() => onEdit(centro.id)}>
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
      {expanded &&
        hasChildren &&
        centro.children.map((sub) => (
          <CentroCostoTreeItem key={sub.id} centro={sub} level={level + 1} onEdit={onEdit} />
        ))}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function ConfigContablePage() {
  // Modal states
  const [cuentaModal, setCuentaModal] = useState(false);
  const [cuentaItem, setCuentaItem] = useState<CuentaContable | null>(null);
  const [tipoDocModal, setTipoDocModal] = useState(false);
  const [tipoDocItem, setTipoDocItem] = useState<TipoDocumentoContable | null>(null);
  const [terceroModal, setTerceroModal] = useState(false);
  const [terceroItem, setTerceroItem] = useState<Tercero | null>(null);
  const [centroModal, setCentroModal] = useState(false);
  const [centroItem, setCentroItem] = useState<CentroCostoContable | null>(null);

  // Delete states
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<'tipo' | 'tercero' | 'centro' | null>(null);

  // Filter states
  const [filtroTipoTercero, setFiltroTipoTercero] = useState('');

  // Data hooks
  const { data: planesData } = usePlanesCuentas();
  const planes = extractResults(planesData);
  const planActivo = planes.find((p) => p.es_activo);

  const { data: arbolData, isLoading: loadingArbol } = useCuentasArbol(
    planActivo ? { plan_cuentas: planActivo.id } : undefined
  );
  const arbol: CuentaContableTree[] = Array.isArray(arbolData) ? arbolData : [];
  const totalCuentas = planActivo?.total_cuentas ?? 0;

  const { data: tiposData, isLoading: loadingTipos } = useTiposDocumento();
  const tipos = extractResults(tiposData);

  const terceroParams: Record<string, unknown> = {};
  if (filtroTipoTercero) terceroParams.tipo_tercero = filtroTipoTercero;
  const { data: tercerosData, isLoading: loadingTerceros } = useTerceros(terceroParams);
  const terceros = extractResults(tercerosData);

  const { data: centrosData, isLoading: loadingCentros } = useCentrosCostoContable();
  const centros = extractResults(centrosData);

  // Delete mutations
  const deleteTipoMut = useDeleteCuentaContable();
  const deleteTerceroMut = useDeleteTercero();
  const deleteCentroMut = useDeleteCentroCosto();

  const handleDelete = () => {
    if (!deleteId || !deleteType) return;
    const opts = {
      onSuccess: () => {
        setDeleteId(null);
        setDeleteType(null);
      },
    };
    if (deleteType === 'tercero') deleteTerceroMut.mutate(deleteId, opts);
    else if (deleteType === 'centro') deleteCentroMut.mutate(deleteId, opts);
    else deleteTipoMut.mutate(deleteId, opts);
  };

  const tabs = [
    {
      id: 'plan-cuentas',
      label: 'Plan de Cuentas',
      icon: <BookOpen className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <SectionToolbar
            actions={[
              {
                label: 'Nueva Cuenta',
                onClick: () => {
                  setCuentaItem(null);
                  setCuentaModal(true);
                },
                variant: 'primary' as const,
              },
            ]}
          />

          {loadingArbol ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : arbol.length === 0 ? (
            <EmptyState
              title="Sin cuentas registradas"
              description="No hay cuentas en el plan de cuentas activo"
              actionLabel="Crear Cuenta"
              onAction={() => {
                setCuentaItem(null);
                setCuentaModal(true);
              }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500 uppercase">
                  <span className="w-5" />
                  <span className="w-20">Código</span>
                  <span className="flex-1">Nombre de la Cuenta</span>
                  <span className="w-16">Naturaleza</span>
                  <span className="w-20">Tipo</span>
                  <span className="w-16">Acciones</span>
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto p-2">
                {arbol.map((cuenta) => (
                  <CuentaTreeItem
                    key={cuenta.id}
                    cuenta={cuenta}
                    onEdit={(id) => {
                      setCuentaItem({ id } as CuentaContable);
                      setCuentaModal(true);
                    }}
                  />
                ))}
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Total: {totalCuentas} cuentas</span>
            <span>
              {planActivo?.nombre ?? 'Sin plan activo'} ({planActivo?.tipo_plan_display ?? '-'})
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'tipos-documento',
      label: 'Tipos de Documento',
      icon: <FileText className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <SectionToolbar
            actions={[
              {
                label: 'Nuevo Tipo',
                onClick: () => {
                  setTipoDocItem(null);
                  setTipoDocModal(true);
                },
                variant: 'primary' as const,
              },
            ]}
          />

          {loadingTipos ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : tipos.length === 0 ? (
            <EmptyState
              title="Sin tipos de documento"
              description="No hay tipos de documento contable registrados"
              actionLabel="Crear Tipo"
              onAction={() => {
                setTipoDocItem(null);
                setTipoDocModal(true);
              }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Clase
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Prefijo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Consecutivo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Aprobación
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tipos.map((tipo) => (
                    <tr key={tipo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600">
                        {tipo.codigo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {tipo.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {tipo.clase_documento_display}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {tipo.prefijo || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {tipo.consecutivo_actual}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tipo.requiere_aprobacion ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={tipo.is_active ? 'success' : 'danger'} size="sm">
                          {tipo.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            onClick={() => {
                              setTipoDocItem(tipo as unknown as TipoDocumentoContable);
                              setTipoDocModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: 'terceros',
      label: 'Terceros',
      icon: <Users className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Select
              label=""
              value={filtroTipoTercero}
              onChange={(e) => setFiltroTipoTercero(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="proveedor">Proveedores</option>
              <option value="cliente">Clientes</option>
              <option value="empleado">Empleados</option>
              <option value="otro">Otros</option>
            </Select>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setTerceroItem(null);
                setTerceroModal(true);
              }}
            >
              Nuevo Tercero
            </Button>
          </div>

          {loadingTerceros ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : terceros.length === 0 ? (
            <EmptyState
              title="Sin terceros registrados"
              description="No hay terceros contables registrados"
              actionLabel="Crear Tercero"
              onAction={() => {
                setTerceroItem(null);
                setTerceroModal(true);
              }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Identificación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Razón Social
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Persona
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ciudad
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {terceros.map((tercero) => (
                    <tr key={tercero.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">
                            {tercero.identificacion_completa}
                          </span>
                          <span className="text-xs text-gray-500">
                            {tercero.tipo_identificacion_display}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {tercero.razon_social}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            tercero.tipo_tercero === 'cliente'
                              ? 'success'
                              : tercero.tipo_tercero === 'proveedor'
                                ? 'primary'
                                : tercero.tipo_tercero === 'empleado'
                                  ? 'warning'
                                  : 'secondary'
                          }
                          size="sm"
                        >
                          {tercero.tipo_tercero_display}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tercero.tipo_persona}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tercero.ciudad || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={tercero.is_active ? 'success' : 'danger'} size="sm">
                          {tercero.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            onClick={() => {
                              setTerceroItem(tercero as unknown as Tercero);
                              setTerceroModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 text-red-500"
                            onClick={() => {
                              setDeleteId(tercero.id);
                              setDeleteType('tercero');
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: 'centros-costo',
      label: 'Centros de Costo',
      icon: <Building2 className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <SectionToolbar
            actions={[
              {
                label: 'Nuevo Centro',
                onClick: () => {
                  setCentroItem(null);
                  setCentroModal(true);
                },
                variant: 'primary' as const,
              },
            ]}
          />

          {loadingCentros ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : centros.length === 0 ? (
            <EmptyState
              title="Sin centros de costo"
              description="No hay centros de costo registrados"
              actionLabel="Crear Centro"
              onAction={() => {
                setCentroItem(null);
                setCentroModal(true);
              }}
            />
          ) : (
            <Card variant="bordered" padding="none">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Centro Padre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Responsable
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Presupuesto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {centros.map((centro) => (
                    <tr key={centro.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-mono text-sm font-medium text-primary-600">
                        {centro.codigo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {centro.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {centro.tipo_centro_display}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {centro.centro_padre_codigo || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {centro.responsable_nombre || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {dec(centro.presupuesto_anual) > 0
                          ? formatCurrency(dec(centro.presupuesto_anual))
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={centro.is_active ? 'success' : 'danger'} size="sm">
                          {centro.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            onClick={() => {
                              setCentroItem(centro as unknown as CentroCostoContable);
                              setCentroModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 text-red-500"
                            onClick={() => {
                              setDeleteId(centro.id);
                              setDeleteType('centro');
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración Contable"
        description="Plan Único de Cuentas (PUC) Colombia y parámetros del sistema contable"
      />

      <Tabs tabs={tabs} defaultTab="plan-cuentas" />

      {/* Modals */}
      <CuentaContableFormModal
        item={cuentaItem}
        isOpen={cuentaModal}
        onClose={() => {
          setCuentaModal(false);
          setCuentaItem(null);
        }}
      />
      <TipoDocumentoFormModal
        item={tipoDocItem}
        isOpen={tipoDocModal}
        onClose={() => {
          setTipoDocModal(false);
          setTipoDocItem(null);
        }}
      />
      <TerceroFormModal
        item={terceroItem}
        isOpen={terceroModal}
        onClose={() => {
          setTerceroModal(false);
          setTerceroItem(null);
        }}
      />
      <CentroCostoContableFormModal
        item={centroItem}
        isOpen={centroModal}
        onClose={() => {
          setCentroModal(false);
          setCentroItem(null);
        }}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => {
          setDeleteId(null);
          setDeleteType(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar registro"
        message="¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
