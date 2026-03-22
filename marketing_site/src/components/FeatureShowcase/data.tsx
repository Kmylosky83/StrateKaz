import { Shield, FileSignature, Workflow, BarChart3, HardHat, Users } from 'lucide-react';
import { FeatureShowcaseContent } from './types';

export const FEATURE_SHOWCASE_CONTENT: FeatureShowcaseContent = {
  header: {
    title: 'Todo lo que tu Empresa Necesita',
    subtitle:
      'Desde Seguridad Laboral y Talento Humano hasta Firma Digital y Business Intelligence | 84+ módulos integrados',
  },
  features: [
    {
      id: 'sst',
      icon: <HardHat className='h-8 w-8' aria-hidden='true' />,
      title: 'Seguridad y Salud en el Trabajo',
      color: 'red',
      description:
        'SG-SST completo según Decreto 1072 y Resolución 0312. Accidentalidad, higiene industrial, medicina laboral, emergencias y gestión de comités COPASST/CCL.',
      metrics: {
        primary: 'SG-SST',
        secondary: 'Decreto 1072 | Res. 0312',
      },
      benefits: [
        'Gestión de accidentalidad e incidentes',
        'Matriz IPEVR según GTC-45',
        'Medicina laboral y exámenes ocupacionales',
        'Plan de emergencias y simulacros',
      ],
      preview: (
        <div className='bg-black-card-soft border border-black-border rounded-xl p-3 sm:p-4 lg:p-6 h-[160px] sm:h-[200px] flex flex-col justify-center'>
          <div className='space-y-3 sm:space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <HardHat className='w-4 h-4 sm:w-5 sm:h-5 text-system-red-500' aria-hidden='true' />
                <span className='text-xs sm:text-sm font-semibold text-white-text'>SG-SST</span>
              </div>
              <span className='text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full'>Cumpliendo</span>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div className='bg-gradient-to-br from-red-500/20 to-red-600/30 p-2 rounded-lg border border-red-500/40 text-center'>
                <div className='text-base sm:text-lg font-bold text-red-400'>0</div>
                <div className='text-xs text-red-300'>Accidentes</div>
              </div>
              <div className='bg-gradient-to-br from-green-500/20 to-green-600/30 p-2 rounded-lg border border-green-500/40 text-center'>
                <div className='text-base sm:text-lg font-bold text-green-400'>95%</div>
                <div className='text-xs text-green-300'>Cumplimiento</div>
              </div>
            </div>
            <div className='bg-black-hover-soft p-3 rounded-lg border border-red-500/30'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-xs font-medium text-white-text-soft'>Decreto 1072</span>
                <span className='text-xs text-green-400'>Conforme</span>
              </div>
              <div className='w-full bg-neutral-800 rounded-full h-1.5'>
                <div className='bg-gradient-to-r from-red-500 to-orange-400 h-1.5 rounded-full' style={{ width: '95%' }} />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'talento-humano',
      icon: <Users className='h-8 w-8' aria-hidden='true' />,
      title: 'Talento Humano Integral',
      color: 'orange',
      description:
        'Ciclo completo del colaborador: selección, contratación, onboarding, formación, desempeño, nómina y offboarding. Todo integrado con SST.',
      metrics: {
        primary: 'HCM',
        secondary: 'ciclo completo del colaborador',
      },
      benefits: [
        'Selección y contratación digital',
        'Evaluación de desempeño 360°',
        'Gestión de nómina integrada',
        'Formación y reinducción programada',
      ],
      preview: (
        <div className='bg-black-card-soft border border-black-border rounded-xl p-3 sm:p-4 lg:p-6 h-[160px] sm:h-[200px] flex flex-col justify-center'>
          <div className='space-y-3 sm:space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Users className='w-4 h-4 sm:w-5 sm:h-5 text-system-orange-500' aria-hidden='true' />
                <span className='text-xs sm:text-sm font-semibold text-white-text'>Talento Humano</span>
              </div>
              <span className='text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full'>Activo</span>
            </div>
            <div className='grid grid-cols-3 gap-2'>
              <div className='bg-gradient-to-br from-orange-500/20 to-orange-600/30 p-2 rounded-lg border border-orange-500/40 text-center'>
                <div className='text-xs font-bold text-orange-400'>48</div>
                <div className='text-xs text-orange-300 hidden sm:block'>Empleados</div>
              </div>
              <div className='bg-gradient-to-br from-green-500/20 to-green-600/30 p-2 rounded-lg border border-green-500/40 text-center'>
                <div className='text-xs font-bold text-green-400'>92%</div>
                <div className='text-xs text-green-300 hidden sm:block'>Desempeño</div>
              </div>
              <div className='bg-gradient-to-br from-blue-500/20 to-blue-600/30 p-2 rounded-lg border border-blue-500/40 text-center'>
                <div className='text-xs font-bold text-blue-400'>3</div>
                <div className='text-xs text-blue-300 hidden sm:block'>Vacantes</div>
              </div>
            </div>
            <div className='bg-black-hover-soft p-3 rounded-lg border border-orange-500/30'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-xs font-medium text-white-text-soft'>Formación Q1</span>
                <span className='text-xs text-green-400'>78% completado</span>
              </div>
              <div className='w-full bg-neutral-800 rounded-full h-1.5'>
                <div className='bg-gradient-to-r from-orange-500 to-yellow-400 h-1.5 rounded-full' style={{ width: '78%' }} />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'firma-digital',
      icon: <FileSignature className='h-8 w-8' aria-hidden='true' />,
      title: 'Firma Digital SHA-256',
      color: 'purple',
      description:
        'Firma manuscrita en canvas, verificación criptográfica SHA-256, delegación de autoridad, versionado semántico y auditoría completa de cada documento.',
      metrics: {
        primary: 'SHA-256',
        secondary: 'verificación criptográfica',
      },
      benefits: [
        'Firma manuscrita digital en canvas',
        'Hash SHA-256 con verificación instantánea',
        'Delegación de firma con control temporal',
        'Versionado semántico de documentos',
      ],
      preview: (
        <div className='bg-black-card-soft border border-black-border rounded-xl p-3 sm:p-4 lg:p-6 h-[160px] sm:h-[200px] flex flex-col justify-center'>
          <div className='space-y-3 sm:space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <FileSignature
                  className='w-4 h-4 sm:w-5 sm:h-5 text-system-purple-500'
                  aria-hidden='true'
                />
                <span className='text-xs sm:text-sm font-semibold text-white-text'>
                  Documento Firmado
                </span>
              </div>
              <span className='text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full'>
                Verificado
              </span>
            </div>
            <div className='bg-black-hover-soft p-3 rounded-lg border border-purple-500/30'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-xs font-medium text-white-text-soft'>
                  Hash SHA-256
                </span>
                <span className='text-xs text-green-400'>Válido</span>
              </div>
              <div className='font-mono text-xs text-purple-400 break-all'>
                a7f3b2c1...e9d4f8a2
              </div>
            </div>
            <div className='grid grid-cols-3 gap-2'>
              <div className='bg-gradient-to-br from-purple-500/20 to-purple-600/30 p-2 rounded-lg border border-purple-500/40 text-center'>
                <div className='text-xs font-bold text-purple-400'>v2.1.0</div>
                <div className='text-xs text-purple-300 hidden sm:block'>
                  Versión
                </div>
              </div>
              <div className='bg-gradient-to-br from-green-500/20 to-green-600/30 p-2 rounded-lg border border-green-500/40 text-center'>
                <div className='text-xs font-bold text-green-400'>3</div>
                <div className='text-xs text-green-300 hidden sm:block'>
                  Firmas
                </div>
              </div>
              <div className='bg-gradient-to-br from-blue-500/20 to-blue-600/30 p-2 rounded-lg border border-blue-500/40 text-center'>
                <div className='w-3 h-3 mx-auto mb-1'>
                  <div className='w-full h-full bg-blue-500 rounded-full animate-pulse' />
                </div>
                <div className='text-xs text-blue-300 hidden sm:block'>
                  Audit
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'debida-diligencia',
      icon: <Shield className='h-8 w-8' aria-hidden='true' />,
      title: 'SAGRILAFT & Debida Diligencia',
      color: 'red',
      description:
        'Sistema completo de prevención LA/FT con KYC automatizado, screening PEP, perfilamiento de riesgo y monitoreo continuo según normativa colombiana.',
      metrics: {
        primary: 'KYC',
        secondary: 'automatizado + PEP screening',
      },
      benefits: [
        'KYC | Conocimiento del cliente automatizado',
        'Screening PEP en listas restrictivas',
        'Perfilamiento de riesgo por contraparte',
        'Reportes para UIAF y compliance officer',
      ],
      preview: (
        <div className='bg-black-card-soft border border-black-border rounded-xl p-3 sm:p-4 lg:p-6 h-[160px] sm:h-[200px] flex flex-col justify-center'>
          <div className='space-y-3 sm:space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Shield
                  className='w-4 h-4 sm:w-5 sm:h-5 text-system-red-500'
                  aria-hidden='true'
                />
                <span className='text-xs sm:text-sm font-semibold text-white-text'>
                  Debida Diligencia
                </span>
              </div>
              <span className='text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full'>
                SAGRILAFT
              </span>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div className='bg-gradient-to-br from-green-500/20 to-green-600/30 p-2 rounded-lg border border-green-500/40 text-center'>
                <div className='text-base sm:text-lg font-bold text-green-400'>
                  OK
                </div>
                <div className='text-xs text-green-300'>KYC Verificado</div>
              </div>
              <div className='bg-gradient-to-br from-red-500/20 to-red-600/30 p-2 rounded-lg border border-red-500/40 text-center'>
                <div className='text-base sm:text-lg font-bold text-red-400'>
                  0
                </div>
                <div className='text-xs text-red-300'>Alertas PEP</div>
              </div>
            </div>
            <div className='bg-black-hover-soft p-3 rounded-lg border border-red-500/30'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-xs font-medium text-white-text-soft'>
                  Nivel de Riesgo
                </span>
                <span className='text-xs text-green-400'>Bajo</span>
              </div>
              <div className='w-full bg-neutral-800 rounded-full h-1.5'>
                <div
                  className='bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full'
                  style={{ width: '25%' }}
                />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'workflow-engine',
      icon: <Workflow className='h-8 w-8' aria-hidden='true' />,
      title: 'Workflow Engine BPMN 2.0',
      color: 'blue',
      description:
        'Motor de flujos con diseñador visual BPMN, gateways secuenciales/paralelos, SLA con escalamiento automático y firma digital integrada.',
      metrics: {
        primary: 'BPMN 2.0',
        secondary: 'con gateways y SLA',
      },
      benefits: [
        'Diseñador visual drag & drop',
        'Gateways secuenciales, paralelos y mixtos',
        'SLA con escalamiento automático',
        'Firma digital integrada en aprobaciones',
      ],
      preview: (
        <div className='bg-black-card-soft border border-black-border rounded-xl p-3 sm:p-4 lg:p-6 h-[160px] sm:h-[200px] flex flex-col justify-center'>
          <div className='space-y-3 sm:space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Workflow
                  className='w-4 h-4 sm:w-5 sm:h-5 text-system-blue-500'
                  aria-hidden='true'
                />
                <span className='text-xs sm:text-sm font-semibold text-white-text'>
                  Flujo de Aprobación
                </span>
              </div>
              <span className='text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full'>
                3 de 5 pasos
              </span>
            </div>
            <div className='flex items-center justify-between gap-1'>
              {['Solicitud', 'Revisión', 'Firma', 'QA', 'Cierre'].map(
                (step, i) => (
                  <div key={step} className='flex items-center flex-1'>
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                        i < 3
                          ? 'bg-blue-500/30 border-blue-500 text-blue-400'
                          : i === 3
                            ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 animate-pulse'
                            : 'bg-neutral-800 border-neutral-600 text-neutral-500'
                      }`}
                    >
                      {i + 1}
                    </div>
                    {i < 4 && (
                      <div
                        className={`flex-1 h-0.5 mx-0.5 ${i < 3 ? 'bg-blue-500' : 'bg-neutral-700'}`}
                      />
                    )}
                  </div>
                )
              )}
            </div>
            <div className='bg-black-hover-soft p-2 sm:p-3 rounded-lg border border-blue-500/30'>
              <div className='flex justify-between items-center'>
                <span className='text-xs font-medium text-white-text-soft'>
                  SLA: 48h máximo
                </span>
                <span className='text-xs text-blue-400'>
                  12h restantes
                </span>
              </div>
              <div className='w-full bg-neutral-800 rounded-full h-1.5 mt-1.5'>
                <div
                  className='bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full'
                  style={{ width: '75%' }}
                />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'analytics-bi',
      icon: <BarChart3 className='h-8 w-8' aria-hidden='true' />,
      title: 'Analytics & Business Intelligence',
      color: 'green',
      description:
        'Indicadores por área, dashboard gerencial en tiempo real, análisis de tendencias, generador de informes y exportación multi-formato.',
      metrics: {
        primary: 'Real-Time',
        secondary: 'dashboards gerenciales',
      },
      benefits: [
        'KPIs por área con metas y alertas',
        'Dashboard gerencial en tiempo real',
        'Análisis de tendencias predictivo',
        'Exportación PDF, Excel, API',
      ],
      preview: (
        <div className='bg-black-card-soft border border-black-border rounded-xl p-3 sm:p-4 lg:p-6 h-[160px] sm:h-[200px] flex flex-col justify-center'>
          <div className='space-y-2 sm:space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <BarChart3
                  className='w-4 h-4 sm:w-5 sm:h-5 text-system-green-500'
                  aria-hidden='true'
                />
                <span className='text-xs sm:text-sm font-semibold text-white-text'>
                  Dashboard Gerencial
                </span>
              </div>
              <span className='text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full'>
                Tiempo Real
              </span>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div className='bg-gradient-to-br from-green-500/10 to-green-500/20 p-2 sm:p-3 rounded-lg border border-green-500/30'>
                <div className='text-base sm:text-lg font-bold text-green-400'>
                  98%
                </div>
                <div className='text-xs text-green-300'>Cumplimiento</div>
              </div>
              <div className='bg-gradient-to-br from-blue-500/10 to-blue-500/20 p-2 sm:p-3 rounded-lg border border-blue-500/30'>
                <div className='text-base sm:text-lg font-bold text-blue-400'>
                  24
                </div>
                <div className='text-xs text-blue-300'>KPIs Activos</div>
              </div>
            </div>
            <div className='flex space-x-1'>
              {[85, 92, 78, 95, 88, 91, 97].map((height, i) => (
                <div
                  key={i}
                  className='flex-1 h-6 sm:h-8 bg-neutral-800 rounded-sm overflow-hidden'
                >
                  <div
                    className={`w-full bg-gradient-to-t from-green-500 to-emerald-400 ${i === 6 ? 'animate-pulse' : ''}`}
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
