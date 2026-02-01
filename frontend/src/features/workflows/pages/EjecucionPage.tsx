import { useState } from 'react';
import { Play, ArrowLeft, Clock, AlertCircle, CheckCircle2, User, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/layout';

// Mock data
const mockTasks = [
  {
    id: '1',
    title: 'Aprobar solicitud de compra #SC-2024-001',
    workflow: 'Compras',
    assignee: 'Juan Pérez',
    dueDate: '2024-12-24',
    priority: 'high',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Revisar documento de calidad',
    workflow: 'Control de Calidad',
    assignee: 'María González',
    dueDate: '2024-12-25',
    priority: 'medium',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Validar certificado de proveedor',
    workflow: 'Proveedores',
    assignee: 'Carlos Rodríguez',
    dueDate: '2024-12-23',
    priority: 'high',
    status: 'in_progress',
  },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border border-red-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
    case 'low':
      return 'bg-green-100 text-green-700 border border-green-300';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-300';
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Media';
    case 'low':
      return 'Baja';
    default:
      return priority;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'in_progress':
      return <Play className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

type TabType = 'pending' | 'in_progress' | 'completed';

export default function EjecucionPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  const tabs = [
    { id: 'pending', label: 'Pendientes' },
    { id: 'in_progress', label: 'En Proceso' },
    { id: 'completed', label: 'Completadas' },
  ];

  const filteredTasks = mockTasks.filter(t => t.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Ejecución y Tareas"
        description="Bandeja de trabajo y gestión de tareas pendientes"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">8</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Proceso</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">3</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Play className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completadas Hoy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">12</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vencidas</p>
              <p className="text-2xl font-bold text-red-600">2</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Task List */}
      <Card>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bandeja de Trabajo</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Tareas asignadas y procesos en ejecución</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task Content */}
        <div className="p-6 space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p>No hay tareas en esta categoría</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <Card
                key={task.id}
                className={`hover:shadow-md transition-shadow ${
                  task.status === 'in_progress' ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${
                          task.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
                        }`}>
                          {getStatusIcon(task.status)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{task.workflow}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <User className="h-4 w-4" />
                          <span>{task.assignee}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>Vence: {task.dueDate}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={task.status === 'in_progress' ? 'primary' : 'primary'}
                      >
                        {task.status === 'in_progress' ? 'Completar' : 'Procesar'}
                      </Button>
                      <Button size="sm" variant="outline">
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <Play className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Gestión de Tareas y Ejecución
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>Bandeja de trabajo unificada para todas las tareas pendientes</li>
                <li>Notificaciones automáticas de nuevas asignaciones</li>
                <li>Priorización por urgencia y SLAs</li>
                <li>Seguimiento de tiempo de respuesta</li>
                <li>Historial de acciones y comentarios</li>
                <li>Delegación y reasignación de tareas</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
