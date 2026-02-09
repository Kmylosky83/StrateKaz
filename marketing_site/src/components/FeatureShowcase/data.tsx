import { Users, Workflow, FileCheck, Award } from 'lucide-react';
import { FeatureShowcaseContent } from './types';

export const FEATURE_SHOWCASE_CONTENT: FeatureShowcaseContent = {
  header: {
    title: 'Servicios Profesionales',
    subtitle:
      'Soluciones integrales para el crecimiento y desarrollo de tu organización',
  },
  features: [
    {
      id: 'consultoria-iso',
      icon: <Award className='h-8 w-8' aria-hidden='true' />,
      title: 'Consultoría ISO',
      color: 'blue',
      description:
        'Asesoría especializada para diseño, implementación y certificación de sistemas de gestión ISO 9001, 14001 y 45001.',
      metrics: {
        primary: '100%',
        secondary: 'éxito en certificación',
      },
      benefits: [
        'Diagnóstico organizacional completo',
        'Diseño de procesos personalizados',
        'Acompañamiento en certificación',
        'Optimización de recursos',
      ],
      preview: (
        <div className='bg-black-card-soft border border-black-border rounded-xl p-3 sm:p-4 lg:p-6 h-[160px] sm:h-[200px] flex flex-col justify-center'>
          <div className='space-y-3 sm:space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Award
                  className='w-4 h-4 sm:w-5 sm:h-5 text-system-blue-500'
                  aria-hidden='true'
                />
                <span className='text-xs sm:text-sm font-semibold text-white-text'>
                  Sistema de Gestión
                </span>
              </div>
              <span className='text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full'>
                Implementando
              </span>
            </div>
            <div className='grid grid-cols-3 gap-1 sm:gap-2'>
              <div className='bg-gradient-to-br from-blue-500/20 to-blue-600/30 p-2 sm:p-3 rounded-lg border border-blue-500/40 text-center'>
                <div className='w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-1'>
                  <div className='w-full h-full bg-blue-500 rounded-full animate-pulse' />
                </div>
                <div className='text-xs font-bold text-blue-400'>ISO 9001</div>
                <div className='text-xs text-blue-300 hidden sm:block'>
                  Calidad
                </div>
              </div>
              <div className='bg-gradient-to-br from-green-500/20 to-green-600/30 p-2 sm:p-3 rounded-lg border border-green-500/40 text-center'>
                <div className='w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-1'>
                  <div className='w-full h-full bg-green-500 rounded-full' />
                </div>
                <div className='text-xs font-bold text-green-400'>
                  ISO 14001
                </div>
                <div className='text-xs text-green-300 hidden sm:block'>
                  Ambiental
                </div>
              </div>
              <div className='bg-gradient-to-br from-orange-500/20 to-orange-600/30 p-2 sm:p-3 rounded-lg border border-orange-500/40 text-center'>
                <div className='w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-1'>
                  <div className='w-full h-full bg-neutral-600 rounded-full' />
                </div>
                <div className='text-xs font-bold text-orange-400'>
                  ISO 45001
                </div>
                <div className='text-xs text-orange-300 hidden sm:block'>
                  SST
                </div>
              </div>
            </div>
            <div className='bg-black-hover-soft p-2 sm:p-3 rounded-lg border border-black-border'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-xs font-medium text-white-text-soft'>
                  Progreso de Certificación
                </span>
                <span className='text-xs text-blue-400'>78% Completo</span>
              </div>
              <div className='w-full bg-neutral-800 rounded-full h-1.5 sm:h-2'>
                <div
                  className='bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 sm:h-2 rounded-full relative overflow-hidden'
                  style={{ width: '78%' }}
                >
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]' />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'auditorias-internas',
      icon: <FileCheck className='h-8 w-8' aria-hidden='true' />,
      title: 'Auditorías Internas',
      color: 'green',
      description:
        'Evaluaciones exhaustivas y sistemáticas para garantizar el cumplimiento y mejora continua de sus sistemas de gestión.',
      metrics: {
        primary: '500+',
        secondary: 'auditorías realizadas',
      },
      benefits: [
        'Plan de auditoría personalizado',
        'Evaluación de conformidad',
        'Identificación de oportunidades',
        'Informes detallados y accionables',
      ],
      preview: (
        <div className='bg-black-card-soft border border-black-border rounded-xl p-3 sm:p-4 lg:p-6 h-[160px] sm:h-[200px] flex flex-col justify-center'>
          <div className='space-y-3 sm:space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <FileCheck
                  className='w-4 h-4 sm:w-5 sm:h-5 text-system-red-500'
                  aria-hidden='true'
                />
                <span className='text-xs sm:text-sm font-semibold text-white-text'>
                  Auditoría en Curso
                </span>
              </div>
              <span className='text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full'>
                Día 3 de 5
              </span>
            </div>
            <div className='space-y-2 sm:space-y-3'>
              <div className='grid grid-cols-2 gap-2'>
                <div className='bg-gradient-to-br from-green-500/20 to-green-600/30 p-2 rounded-lg border border-green-500/40 text-center'>
                  <div className='text-base sm:text-lg font-bold text-green-400'>
                    12
                  </div>
                  <div className='text-xs text-green-300'>Conformidades</div>
                </div>
                <div className='bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 p-2 rounded-lg border border-yellow-500/40 text-center'>
                  <div className='text-base sm:text-lg font-bold text-yellow-400'>
                    3
                  </div>
                  <div className='text-xs text-yellow-300'>
                    No Conformidades
                  </div>
                </div>
              </div>
              <div className='bg-black-hover-soft p-3 rounded-lg border border-red-500/30'>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-xs font-medium text-white-text-soft'>
                    Proceso Evaluado
                  </span>
                  <span className='text-xs text-red-400'>Alta Prioridad</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='flex-1'>
                    <div className='text-xs text-white-text-soft mb-1'>
                      Gestión de Calidad - Sección 4.2.3
                    </div>
                    <div className='w-full bg-neutral-800 rounded-full h-1.5'>
                      <div
                        className='bg-gradient-to-r from-red-500 to-orange-500 h-1.5 rounded-full animate-pulse'
                        style={{ width: '60%' }}
                      />
                    </div>
                  </div>
                  <div className='w-2 h-2 bg-red-500 rounded-full animate-ping' />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'capacitacion-empresarial',
      icon: <Users className='h-8 w-8' aria-hidden='true' />,
      title: 'Capacitación Empresarial',
      color: 'yellow',
      description:
        'Programas de formación especializados para desarrollar competencias en sistemas de gestión y liderazgo organizacional.',
      metrics: {
        primary: '2,000+',
        secondary: 'profesionales capacitados',
      },
      benefits: [
        'Programas a medida',
        'Metodologías prácticas',
        'Certificación de competencias',
        'Material didáctico especializado',
      ],
      preview: (
        <div className='bg-black-card-soft border border-black-border rounded-xl p-3 sm:p-4 lg:p-6 h-[160px] sm:h-[200px] flex flex-col justify-center'>
          <div className='space-y-2 sm:space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Users
                  className='w-4 h-4 sm:w-5 sm:h-5 text-system-orange-500'
                  aria-hidden='true'
                />
                <span className='text-xs sm:text-sm font-semibold text-white-text'>
                  Programa de Capacitación
                </span>
              </div>
              <span className='text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full'>
                24 Participantes
              </span>
            </div>
            <div className='space-y-3'>
              <div className='bg-black-hover-soft rounded-lg p-3 border border-black-border'>
                <div className='flex justify-between items-center mb-1'>
                  <span className='text-xs font-medium text-white-text-soft'>
                    Módulo 1: Fundamentos ISO
                  </span>
                  <span className='text-xs text-green-400'>✓ Completo</span>
                </div>
                <div className='w-full bg-neutral-800 rounded-full h-1.5'>
                  <div
                    className='bg-green-500 h-1.5 rounded-full'
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className='bg-black-hover-soft rounded-lg p-3 border border-blue-500/30'>
                <div className='flex justify-between items-center mb-1'>
                  <span className='text-xs font-medium text-white-text-soft'>
                    Módulo 2: Implementación
                  </span>
                  <span className='text-xs text-blue-400'>En curso</span>
                </div>
                <div className='w-full bg-neutral-800 rounded-full h-1.5'>
                  <div
                    className='bg-blue-500 h-1.5 rounded-full animate-pulse'
                    style={{ width: '65%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'gestion-proyectos',
      icon: <Workflow className='h-8 w-8' aria-hidden='true' />,
      title: 'Gestión de Proyectos',
      color: 'purple',
      description:
        'Implementación y seguimiento de proyectos de transformación organizacional con metodologías ágiles y tradicionales.',
      metrics: {
        primary: '95%',
        secondary: 'proyectos exitosos',
      },
      benefits: [
        'Planificación estratégica',
        'Gestión de recursos y riesgos',
        'Seguimiento de indicadores',
        'Entregables garantizados',
      ],
      preview: (
        <div className='bg-black-card-soft border border-black-border rounded-xl p-3 sm:p-4 lg:p-6 h-[160px] sm:h-[200px] flex flex-col justify-center'>
          <div className='space-y-2 sm:space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Workflow
                  className='w-4 h-4 sm:w-5 sm:h-5 text-system-purple-500'
                  aria-hidden='true'
                />
                <span className='text-xs sm:text-sm font-semibold text-white-text'>
                  Proyecto ISO 9001
                </span>
              </div>
              <span className='text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full'>
                75% Completado
              </span>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div className='bg-gradient-to-br from-purple-500/10 to-purple-500/20 p-2 sm:p-3 rounded-lg border border-purple-500/30'>
                <div className='text-base sm:text-lg font-bold text-purple-400'>
                  12
                </div>
                <div className='text-xs text-purple-300'>Tareas Activas</div>
              </div>
              <div className='bg-gradient-to-br from-green-500/10 to-green-500/20 p-2 sm:p-3 rounded-lg border border-green-500/30'>
                <div className='text-base sm:text-lg font-bold text-green-400'>
                  36
                </div>
                <div className='text-xs text-green-300'>Completadas</div>
              </div>
            </div>
            <div className='flex space-x-1'>
              {[100, 100, 100, 80, 60, 0, 0].map((height, i) => (
                <div
                  key={i}
                  className='flex-1 h-6 sm:h-8 bg-neutral-800 rounded-sm overflow-hidden'
                >
                  <div
                    className={`w-full ${height > 0 ? 'bg-gradient-to-t from-purple-500 to-purple-400' : 'bg-neutral-700'} ${height === 80 ? 'animate-pulse' : ''}`}
                    style={{
                      height: `${height}%`,
                      marginTop: `${100 - height}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ],
  config: {
    autoRotateInterval: 5000,
    sectionSpacing: 'py-section-xs lg:py-section-sm',
    containerClasses: 'container-responsive',
  },
};
