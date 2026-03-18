/**
 * Página: Administración de Notificaciones (Centro de Control)
 *
 * Solo tabs administrativos:
 * 1. Tipos - CRUD de tipos de notificación
 * 2. Masivas - Envío de notificaciones masivas
 *
 * La bandeja personal y preferencias se encuentran en /perfil/notificaciones.
 *
 * MN-001: Conectado con backend real via React Query hooks
 *
 * @see docs/desarrollo/CATALOGO_VISTAS_UI.md - Vista 2
 */
import { useState } from 'react';
import { Bell, Mail, Settings, Send, Plus, Eye, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert } from '@/components/common/Alert';
import { Input, Select, Textarea, Checkbox } from '@/components/forms';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import {
  useTiposNotificacion,
  useCreateTipoNotificacion,
  useUpdateTipoNotificacion,
  useDeleteTipoNotificacion,
  useCreateNotificacionMasiva,
} from '../hooks/useNotificaciones';
import { useSelectCargos, useSelectUsers, useSelectAreas } from '@/hooks/useSelectLists';
import { TipoNotificacionModal } from '../components';
import { BaseModal } from '@/components/modals/BaseModal';
import { getCategoriaIcon, getCategoriaColor } from '../components/notificacion-utils';
import type { TipoNotificacion } from '../types/notificaciones.types';

// ==================== TIPOS TAB ====================

function TiposTab() {
  const { data: tipos, isLoading, error } = useTiposNotificacion();
  const createTipo = useCreateTipoNotificacion();
  const updateTipo = useUpdateTipoNotificacion();
  const deleteTipo = useDeleteTipoNotificacion();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoNotificacion | null>(null);

  const tiposList = tipos || [];

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este tipo de notificación?')) {
      deleteTipo.mutate(id);
    }
  };

  const handleEdit = (tipo: TipoNotificacion) => {
    setSelectedTipo(tipo);
    setShowEditModal(true);
  };

  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleView = (tipo: TipoNotificacion) => {
    setSelectedTipo(tipo);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 w-10 h-10" />
            <div>
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
            </div>
          </div>
        </div>
        <Card>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse-subtle"
              />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error" message="Error al cargar los tipos de notificación." />;
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Tipos de Notificación
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tiposList.length} tipo{tiposList.length !== 1 ? 's' : ''} configurado
              {tiposList.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tipo
        </Button>
      </div>

      {tiposList.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Categoría
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Canales
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {tiposList.map((tipo: TipoNotificacion) => (
                  <tr
                    key={tipo.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-lg flex-shrink-0',
                            getCategoriaColor(tipo.categoria)
                          )}
                        >
                          {(() => {
                            const Icon = getCategoriaIcon(tipo.categoria);
                            return <Icon className="h-4 w-4" />;
                          })()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {tipo.nombre}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">
                            {tipo.codigo}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="gray" size="sm">
                        {tipo.categoria}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {tipo.es_email && (
                          <div
                            className="p-1 rounded bg-green-100 dark:bg-green-900/30"
                            title="Email"
                          >
                            <Mail className="w-3 h-3 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                        {tipo.es_push && (
                          <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30" title="Push">
                            <Bell className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        {!tipo.es_email && !tipo.es_push && (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={tipo.is_active ? 'success' : 'gray'} size="sm">
                        {tipo.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="p-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          onClick={() => handleView(tipo)}
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="p-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          onClick={() => handleEdit(tipo)}
                          title="Editar"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="p-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(tipo.id)}
                          disabled={deleteTipo.isPending}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Settings className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No hay tipos de notificación
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Crea el primer tipo para definir plantillas de notificación.
            </p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Tipo
            </Button>
          </div>
        </Card>
      )}

      {/* Modal de Creación */}
      <TipoNotificacionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => {
          createTipo.mutate(data, {
            onSuccess: () => {
              setShowCreateModal(false);
            },
          });
        }}
        isLoading={createTipo.isPending}
      />

      {/* Modal de Edición */}
      <TipoNotificacionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTipo(null);
        }}
        tipo={selectedTipo}
        onSubmit={(data) => {
          if (selectedTipo) {
            updateTipo.mutate(
              { id: selectedTipo.id, data },
              {
                onSuccess: () => {
                  setShowEditModal(false);
                  setSelectedTipo(null);
                },
              }
            );
          }
        }}
        isLoading={updateTipo.isPending}
      />

      {/* Modal de Detalle */}
      {selectedTipo && showDetailModal && (
        <BaseModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTipo(null);
          }}
          title="Detalle del Tipo de Notificación"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Código</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTipo.codigo}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Nombre</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTipo.nombre}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Categoría</span>
                <Badge variant="gray" size="sm">
                  {selectedTipo.categoria}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Estado</span>
                <Badge variant={selectedTipo.is_active ? 'success' : 'gray'} size="sm">
                  {selectedTipo.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Descripción</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {selectedTipo.descripcion || 'Sin descripción'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Plantilla Título</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {selectedTipo.plantilla_titulo}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Plantilla Mensaje</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {selectedTipo.plantilla_mensaje}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <Badge variant={selectedTipo.es_email ? 'success' : 'gray'} size="sm">
                {selectedTipo.es_email ? 'Email activo' : 'Email inactivo'}
              </Badge>
              <Badge variant={selectedTipo.es_push ? 'success' : 'gray'} size="sm">
                {selectedTipo.es_push ? 'Push activo' : 'Push inactivo'}
              </Badge>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
}

// ==================== MASIVAS TAB ====================

function MasivasTab() {
  const createMasiva = useCreateNotificacionMasiva();
  const { data: cargosData } = useSelectCargos();
  const cargos = cargosData || [];
  const { data: areasData } = useSelectAreas();
  const { data: usersData } = useSelectUsers();

  const areas = areasData || [];
  const users = usersData || [];

  const [showPreview, setShowPreview] = useState(false);
  const { data: tiposData, isLoading: tiposLoading } = useTiposNotificacion();
  const tipos = tiposData || [];

  const [formData, setFormData] = useState({
    tipo: '',
    titulo: '',
    mensaje: '',
    destinatarios_tipo: 'todos' as 'todos' | 'rol' | 'area' | 'usuarios_especificos',
    cargo_id: '',
    area_id: '',
    usuarios_ids: [] as number[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tipo.trim()) {
      toast.error('Selecciona un tipo de notificación');
      return;
    }
    if (!formData.titulo.trim() || !formData.mensaje.trim()) {
      toast.error('El título y mensaje son requeridos');
      return;
    }
    if (formData.destinatarios_tipo === 'rol' && !formData.cargo_id) {
      toast.error('Debes seleccionar un cargo');
      return;
    }
    if (formData.destinatarios_tipo === 'area' && !formData.area_id) {
      toast.error('Debes seleccionar un área');
      return;
    }
    if (
      formData.destinatarios_tipo === 'usuarios_especificos' &&
      formData.usuarios_ids.length === 0
    ) {
      toast.error('Debes seleccionar al menos un usuario');
      return;
    }

    const payload: any = {
      tipo: parseInt(formData.tipo),
      titulo: formData.titulo,
      mensaje: formData.mensaje,
      destinatarios_tipo: formData.destinatarios_tipo,
    };

    if (formData.destinatarios_tipo === 'rol' && formData.cargo_id) {
      payload.roles = [parseInt(formData.cargo_id)];
    } else if (formData.destinatarios_tipo === 'area' && formData.area_id) {
      payload.areas = [parseInt(formData.area_id)];
    } else if (
      formData.destinatarios_tipo === 'usuarios_especificos' &&
      formData.usuarios_ids.length > 0
    ) {
      payload.usuarios = formData.usuarios_ids;
    }

    createMasiva.mutate(payload, {
      onSuccess: () => {
        setFormData({
          tipo: '',
          titulo: '',
          mensaje: '',
          destinatarios_tipo: 'todos',
          cargo_id: '',
          area_id: '',
          usuarios_ids: [],
        });
        toast.success('Notificación masiva enviada correctamente');
      },
    });
  };

  const getDestinatariosText = () => {
    if (formData.destinatarios_tipo === 'todos') {
      return 'todos los usuarios';
    } else if (formData.destinatarios_tipo === 'rol' && formData.cargo_id) {
      const cargo = cargos.find((c) => c.id === parseInt(formData.cargo_id));
      return cargo ? `usuarios con cargo: ${cargo.label}` : 'seleccionar cargo';
    } else if (formData.destinatarios_tipo === 'area' && formData.area_id) {
      const area = areas.find((a) => a.id === parseInt(formData.area_id));
      return area ? `usuarios del área: ${area.label}` : 'seleccionar área';
    } else if (
      formData.destinatarios_tipo === 'usuarios_especificos' &&
      formData.usuarios_ids.length > 0
    ) {
      return `${formData.usuarios_ids.length} usuario${formData.usuarios_ids.length !== 1 ? 's' : ''} seleccionado${formData.usuarios_ids.length !== 1 ? 's' : ''}`;
    }
    return 'seleccionar destinatarios';
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
          <Send className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Envío de Notificación Masiva
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Envía notificaciones a múltiples usuarios de la organización
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contenido del Mensaje */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Contenido del Mensaje
            </h4>

            <Input
              label="Título de la notificación"
              value={formData.titulo}
              onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ej: Actualización importante del sistema"
              required
            />

            <div>
              <Textarea
                label="Mensaje"
                value={formData.mensaje}
                onChange={(e) => setFormData((prev) => ({ ...prev, mensaje: e.target.value }))}
                rows={4}
                placeholder="Escribe el contenido de la notificación..."
                maxLength={500}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Máximo 500 caracteres. El mensaje se mostrará en todos los canales seleccionados.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Configuración de Envío */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Configuración de Envío
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Tipo de Notificación"
                  value={formData.tipo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value }))}
                  required
                  disabled={tiposLoading}
                >
                  <option value="">
                    {tiposLoading ? 'Cargando tipos...' : 'Seleccione un tipo'}
                  </option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </Select>
                {tipos.length === 0 && !tiposLoading && (
                  <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    No hay tipos de notificación disponibles. Créalos en la pestaña "Tipos".
                  </p>
                )}
              </div>

              <Select
                label="Destinatarios"
                value={formData.destinatarios_tipo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    destinatarios_tipo: e.target.value as
                      | 'todos'
                      | 'rol'
                      | 'area'
                      | 'usuarios_especificos',
                    cargo_id: '',
                    area_id: '',
                    usuarios_ids: [],
                  }))
                }
              >
                <option value="todos">Todos los usuarios</option>
                <option value="rol">Por cargo</option>
                <option value="area">Por área</option>
                <option value="usuarios_especificos">Usuarios específicos</option>
              </Select>
            </div>

            {formData.destinatarios_tipo === 'rol' && (
              <Select
                label="Seleccionar Cargo"
                value={formData.cargo_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, cargo_id: e.target.value }))}
                required
              >
                <option value="">Seleccione un cargo</option>
                {cargos.map((cargo) => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.label}
                  </option>
                ))}
              </Select>
            )}

            {formData.destinatarios_tipo === 'area' && (
              <Select
                label="Seleccionar Área"
                value={formData.area_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, area_id: e.target.value }))}
                required
              >
                <option value="">Seleccione un proceso</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.label}
                  </option>
                ))}
              </Select>
            )}

            {formData.destinatarios_tipo === 'usuarios_especificos' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Seleccionar Usuarios ({formData.usuarios_ids.length} seleccionado
                  {formData.usuarios_ids.length !== 1 ? 's' : ''})
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto bg-white dark:bg-gray-800">
                  {users.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No hay usuarios disponibles
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => {
                        const isSelected = formData.usuarios_ids.includes(user.id);
                        const displayName = user.label;

                        return (
                          <div
                            key={user.id}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700',
                              isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                            )}
                            onClick={() => {
                              if (isSelected) {
                                setFormData((prev) => ({
                                  ...prev,
                                  usuarios_ids: prev.usuarios_ids.filter((id) => id !== user.id),
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  usuarios_ids: [...prev.usuarios_ids, user.id],
                                }));
                              }
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    usuarios_ids: [...prev.usuarios_ids, user.id],
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    usuarios_ids: prev.usuarios_ids.filter((id) => id !== user.id),
                                  }));
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {displayName}
                              </p>
                              {user.extra?.email && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {user.extra.email}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {formData.usuarios_ids.length === 0 && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    Debes seleccionar al menos un usuario
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Acciones */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Se enviará a{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {getDestinatariosText()}
              </span>
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!formData.titulo.trim() || !formData.mensaje.trim()) {
                    toast.error('Completa el título y mensaje para ver la vista previa');
                    return;
                  }
                  setShowPreview(true);
                }}
                disabled={!formData.titulo.trim() || !formData.mensaje.trim()}
              >
                <Eye className="w-4 h-4 mr-2" />
                Vista Previa
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={createMasiva.isPending}
                disabled={createMasiva.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Notificación
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Modal de Vista Previa */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vista Previa de Notificación
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg flex-shrink-0 bg-blue-100 dark:bg-blue-900/30">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {formData.titulo}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                      {formData.mensaje}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Ahora mismo</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Información de Envío</h4>
                <div className="text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Destinatarios:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {getDestinatariosText()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cerrar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowPreview(false);
                  const form = document.querySelector('form') as HTMLFormElement;
                  if (form) {
                    form.requestSubmit();
                  }
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Ahora
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SECTIONS CONFIG ====================

const PAGE_SECTIONS = [
  { code: 'tipos', name: 'Tipos', icon: 'Settings' },
  { code: 'masivas', name: 'Masivas', icon: 'Send' },
];

// ==================== MAIN COMPONENT ====================

export default function NotificacionesPage() {
  const [activeSection, setActiveSection] = useState('tipos');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administración de Notificaciones"
        description="Configura tipos de notificación y envía comunicaciones masivas"
        sections={PAGE_SECTIONS}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        moduleColor="blue"
      />

      {activeSection === 'tipos' && <TiposTab />}
      {activeSection === 'masivas' && <MasivasTab />}
    </div>
  );
}
