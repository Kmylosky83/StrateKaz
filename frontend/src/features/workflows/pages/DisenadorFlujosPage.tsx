import { GitBranch, Plus, ArrowLeft, MousePointer2, Move, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/layout';

const flowComponents = [
  { id: 'start', label: 'Inicio' },
  { id: 'task', label: 'Tarea' },
  { id: 'decision', label: 'Decisión' },
  { id: 'approval', label: 'Aprobación' },
  { id: 'notification', label: 'Notificación' },
  { id: 'end', label: 'Fin' },
];

export default function DisenadorFlujosPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Diseñador de Flujos"
        description="Canvas visual para crear y configurar flujos de trabajo"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Flujo
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Toolbar Sidebar */}
        <Card className="lg:col-span-1">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Componentes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Arrastra para agregar al flujo</p>
          </div>
          <div className="p-4 space-y-3">
            {flowComponents.map((component) => (
              <div
                key={component.id}
                className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 cursor-move hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{component.label}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Canvas Area */}
        <Card className="lg:col-span-3">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Canvas de Diseño</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Diseñador visual de flujos de trabajo (React Flow)
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <MousePointer2 className="h-4 w-4 mr-2" />
                  Seleccionar
                </Button>
                <Button variant="outline" size="sm">
                  <Move className="h-4 w-4 mr-2" />
                  Mover
                </Button>
              </div>
            </div>
          </div>
          <div className="p-0">
            <div className="h-[600px] bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900 relative">
              {/* Grid Pattern */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(147, 51, 234, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(147, 51, 234, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />

              {/* Placeholder Message */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-purple-200 dark:border-purple-700">
                      <GitBranch className="h-16 w-16 text-purple-400 dark:text-purple-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Diseñador Visual de Flujos
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                      Esta área utilizará <span className="font-semibold text-purple-600 dark:text-purple-400">React Flow</span> para
                      crear flujos de trabajo mediante drag & drop
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center pt-4">
                    <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-sm text-purple-700 dark:text-purple-300 font-medium">
                      Nodos personalizables
                    </div>
                    <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-sm text-purple-700 dark:text-purple-300 font-medium">
                      Conexiones inteligentes
                    </div>
                    <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-sm text-purple-700 dark:text-purple-300 font-medium">
                      Validación automática
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <GitBranch className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Características del Diseñador
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>Editor visual drag & drop con React Flow</li>
                <li>Nodos personalizables: tareas, aprobaciones, decisiones, notificaciones</li>
                <li>Configuración de reglas de negocio y condiciones</li>
                <li>Asignación de responsables y roles</li>
                <li>Definición de SLAs y tiempos límite</li>
                <li>Validación de flujos antes de activación</li>
                <li>Versionamiento de flujos</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
