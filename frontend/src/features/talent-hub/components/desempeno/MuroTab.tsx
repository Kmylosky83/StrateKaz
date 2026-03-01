/**
 * MuroTab - Muro social de reconocimientos
 */
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { SectionHeader } from '@/components/common/SectionHeader';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { MessageSquare, Heart, Star, Award } from 'lucide-react';
import { useMuroReconocimientos, useMuroDestacados, useDarLike } from '../../hooks/useDesempeno';

export const MuroTab = () => {
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: publicaciones, isLoading } = useMuroReconocimientos();
  const { data: destacados } = useMuroDestacados();
  const likeMutation = useDarLike();

  const items = Array.isArray(publicaciones) ? publicaciones : [];
  const destacadosList = Array.isArray(destacados) ? destacados : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <MessageSquare className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Muro de Reconocimientos"
        description="Celebra los logros y reconocimientos del equipo"
        variant="compact"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Publicaciones */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center">
              <Spinner size="lg" className="mx-auto" />
              <p className="mt-3 text-sm text-gray-500">Cargando muro...</p>
            </div>
          ) : items.length === 0 ? (
            <Card className="p-8">
              <EmptyState
                icon={<MessageSquare className="h-12 w-12 text-gray-300" />}
                title="Muro vacio"
                description="Los reconocimientos publicados apareceran aqui."
              />
            </Card>
          ) : (
            items.map((pub) => (
              <Card key={pub.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {pub.titulo}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {new Date(pub.fecha_publicacion).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {pub.es_destacado && (
                    <Badge variant="warning" size="sm">
                      <Star size={12} className="mr-1" />
                      Destacado
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{pub.mensaje}</p>

                {pub.reconocimiento_info && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-3">
                    <Award size={20} className="text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                        {pub.reconocimiento_info.colaborador_nombre}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {pub.reconocimiento_info.tipo_nombre} - {pub.reconocimiento_info.motivo}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => likeMutation.mutate(String(pub.id))}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 !px-1 !py-1 !min-h-0"
                  >
                    <Heart size={16} className={pub.likes > 0 ? 'fill-red-500 text-red-500' : ''} />
                    <span>{pub.likes}</span>
                  </Button>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <MessageSquare size={16} />
                    <span>{pub.comentarios_count}</span>
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Sidebar - Destacados */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-amber-500" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Destacados</h4>
            </div>

            {destacadosList.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay publicaciones destacadas
              </p>
            ) : (
              <div className="space-y-3">
                {destacadosList.slice(0, 5).map((dest) => (
                  <div key={dest.id} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                      {dest.titulo}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 line-clamp-2">
                      {dest.mensaje}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-amber-600">
                      <span className="flex items-center gap-1">
                        <Heart size={12} /> {dest.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} /> {dest.comentarios_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-primary-500" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Como funciona
              </h4>
            </div>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <p>1. Nomina a un colaborador desde la tab Reconocimientos</p>
              <p>2. Un administrador aprueba la nominacion</p>
              <p>3. Se entrega el reconocimiento al colaborador</p>
              <p>4. Si es publico, se publica automaticamente en el muro</p>
              <p>5. El equipo puede dar "me gusta" y comentar</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
