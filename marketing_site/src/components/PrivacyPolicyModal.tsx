import React from 'react';
import { Button } from '@components/ui/button';
import {
  X,
  Shield,
  Database,
  Eye,
  Lock,
  UserCheck,
  Trash2,
  Mail,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  variant?: 'signup' | 'settings' | 'footer';
}

interface PrivacySection {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: string;
  highlight?: string;
}

const privacyContent: PrivacySection[] = [
  {
    id: 1,
    title: 'Compromiso con tu Privacidad',
    icon: Shield,
    content: `En StrateKaz, la protección de tus datos personales es nuestra prioridad. Esta política describe cómo recopilamos, usamos, almacenamos y protegemos tu información de acuerdo con las leyes colombianas de protección de datos personales (Ley 1581 de 2012 y sus decretos reglamentarios).`,
    highlight: `Tu control es absoluto: Tienes derecho a conocer, actualizar, rectificar y solicitar la supresión de tus datos personales en cualquier momento.`,
  },
  {
    id: 2,
    title: 'Información que Recopilamos',
    icon: Database,
    content: `Recopilamos únicamente la información necesaria para brindarte nuestros servicios:

• Datos de Identificación: Nombre, correo electrónico, teléfono
• Datos de la Empresa: NIT, razón social, sector empresarial
• Datos de Uso: Páginas visitadas, funciones utilizadas
• Datos Técnicos: Dirección IP, navegador, dispositivo

Propósitos específicos:
• Crear y gestionar tu cuenta de usuario
• Personalizar servicios empresariales
• Mejorar experiencia de usuario
• Garantizar seguridad y soporte técnico`,
  },
  {
    id: 3,
    title: 'Cómo Usamos tu Información',
    icon: Eye,
    content: `Utilizamos tus datos personales exclusivamente para:

• Proporcionar y mantener nuestros servicios de gestión empresarial
• Personalizar tu experiencia en la plataforma StrateKaz
• Enviarte notificaciones importantes sobre tu cuenta
• Cumplir con obligaciones legales y regulatorias
• Mejorar nuestros productos y servicios
• Prevenir fraudes y garantizar la seguridad de la plataforma`,
    highlight: `Nunca vendemos tus datos: No comercializamos, vendemos ni compartimos tus datos personales con terceros para fines de marketing sin tu consentimiento explícito.`,
  },
  {
    id: 4,
    title: 'Seguridad de los Datos',
    icon: Lock,
    content: `Implementamos medidas de seguridad técnicas y organizativas de última generación:

• Encriptación: Todos los datos sensibles se encriptan en tránsito y reposo
• Acceso Restringido: Solo personal autorizado puede acceder a datos personales
• Monitoreo Continuo: Sistemas de detección de intrusiones 24/7
• Respaldos Seguros: Copias de seguridad encriptadas y geográficamente distribuidas
• Auditorías Regulares: Evaluaciones periódicas de seguridad por terceros`,
    highlight: `Manejamos los estándares de la norma ISO 27001 para garantizar los más altos niveles de seguridad de la información.`,
  },
  {
    id: 5,
    title: 'Tus Derechos ARCO',
    icon: UserCheck,
    content: `Como titular de los datos, tienes derecho a:

• Acceder: Conocer qué datos personales tenemos sobre ti
• Rectificar: Corregir datos inexactos o incompletos
• Cancelar: Solicitar la eliminación de tus datos
• Oponerte: Oponerte al tratamiento de tus datos para fines específicos
• Portabilidad: Recibir tus datos en un formato estructurado
• Revocar: Retirar tu consentimiento en cualquier momento`,
    highlight: `Para ejercer estos derechos, contáctanos en info@stratekaz.com o al +57 311 535 1944 con el asunto "Derechos ARCO".`,
  },
  {
    id: 6,
    title: 'Retención y Eliminación de Datos',
    icon: Trash2,
    content: `Conservamos tus datos personales solo durante el tiempo necesario:

• Mientras mantengas una cuenta activa en StrateKaz
• Para cumplir con obligaciones legales (hasta 10 años para datos contables)
• Para resolver disputas o hacer cumplir nuestros acuerdos`,
    highlight: `Una vez que ya no sean necesarios, los datos se eliminarán de forma segura o se anonimizarán de manera irreversible.`,
  },
  {
    id: 7,
    title: 'Comunicaciones y Marketing',
    icon: Mail,
    content: `Solo te enviaremos comunicaciones de marketing si has dado tu consentimiento explícito. Puedes darte de baja en cualquier momento usando el enlace en nuestros correos o ajustando tus preferencias en tu cuenta.`,
    highlight: `Las comunicaciones relacionadas con el servicio (como alertas de seguridad o cambios en términos) no pueden desactivarse mientras mantengas una cuenta activa.`,
  },
  {
    id: 8,
    title: 'Cambios en esta Política',
    icon: RefreshCw,
    content: `Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos por correo electrónico o mediante un aviso destacado en nuestra plataforma.`,
    highlight: `La fecha de "Última actualización" al inicio indica la versión más reciente de esta política.`,
  },
];

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  variant = 'footer',
}) => {
  const [activeSection, setActiveSection] = React.useState<number | null>(null);
  const [hasScrolledToEnd, setHasScrolledToEnd] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setHasScrolledToEnd(isAtBottom);
    }
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  if (!isOpen) return null;

  const showAcceptButton = variant === 'signup' && onAccept;
  const requireScrollValidation = variant === 'signup';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black-deep/80 backdrop-blur-sm p-4'>
      <div className='bg-black-card border border-black-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-black-border'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center'>
              <Shield className='h-5 w-5 text-brand-500' aria-hidden='true' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-white-text font-title'>
                Política de Privacidad
              </h2>
              <p className='text-sm text-white-muted font-content'>
                StrateKaz - Protección de Datos Personales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='min-w-[44px] min-h-[44px] rounded-lg bg-black-hover border border-black-border-soft text-white-muted hover:text-white-text hover:bg-black-border transition-all duration-200 flex items-center justify-center'
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </button>
        </div>

        {/* Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className='flex-1 overflow-y-auto p-6 space-y-4'
        >
          {/* Introduction */}
          <div className='bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 mb-6'>
            <div className='flex items-start space-x-3'>
              <CheckCircle
                className='h-5 w-5 text-brand-500 mt-0.5 flex-shrink-0'
                aria-label='Información importante'
              />
              <div>
                <h3 className='font-semibold text-white-text font-title mb-2'>
                  Tu Privacidad, Nuestra Responsabilidad
                </h3>
                <div className='container-content'>
                  <p className='text-sm text-white-muted font-content'>
                    Con 20+ años de experiencia y 100% de éxito en
                    certificaciones y cumplimiento normativo, protegemos tus
                    datos personales con los más altos estándares de seguridad.
                    Esta política de privacidad te explica cómo cuidamos tu
                    información de manera transparente y responsable.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Sections */}
          {privacyContent.map(section => {
            const IconComponent = section.icon;
            const isActive = activeSection === section.id;

            return (
              <div
                key={section.id}
                className='border border-black-border-soft rounded-xl overflow-hidden'
              >
                <button
                  onClick={() => setActiveSection(isActive ? null : section.id)}
                  className='w-full min-h-[44px] p-4 text-left bg-black-card-soft hover:bg-black-hover transition-all duration-200 flex items-center justify-between'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='w-8 h-8 bg-black-border rounded-lg flex items-center justify-center'>
                      <IconComponent
                        className='h-4 w-4 text-brand-500'
                        aria-hidden='true'
                      />
                    </div>
                    <span className='font-medium text-white-text font-title'>
                      {section.id}. {section.title}
                    </span>
                  </div>
                  <div
                    className={`transform transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`}
                  >
                    <svg
                      className='w-4 h-4 text-white-muted'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      aria-hidden='true'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </div>
                </button>

                {isActive && (
                  <div className='p-4 border-t border-black-border-soft bg-black-card'>
                    <div className='prose prose-sm max-w-none'>
                      <div className='container-content'>
                        <div className='text-white-muted font-content leading-relaxed whitespace-pre-line'>
                          {section.content}
                        </div>
                      </div>
                      {section.highlight && (
                        <div className='mt-4 p-3 bg-brand-500/10 border border-brand-500/30 rounded-lg'>
                          <div className='flex items-start space-x-2'>
                            <div className='w-1.5 h-1.5 bg-brand-500 rounded-full mt-2 flex-shrink-0 animate-pulse' />
                            <div className='container-content'>
                              <div className='text-brand-300 font-content text-sm leading-relaxed whitespace-pre-line'>
                                {section.highlight}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Footer info */}
          <div className='mt-8 pt-6 border-t border-black-border-soft text-center'>
            <p className='text-sm text-white-muted font-content'>
              © 2026 StrateKaz | Marca Kmylosky | Todos los derechos
              reservados.
            </p>
            <p className='text-xs text-white-muted-soft font-content mt-2'>
              Última actualización: Febrero 2026 | Versión 1.1
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className='p-6 border-t border-black-border'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-white-muted font-content'>
              {requireScrollValidation && !hasScrolledToEnd && (
                <span className='flex items-center space-x-2'>
                  <Shield
                    className='h-4 w-4 text-orange-500'
                    aria-label='Advertencia de privacidad'
                  />
                  <span>Desplázate hasta el final para continuar</span>
                </span>
              )}
            </div>

            <div className='flex items-center space-x-3'>
              <Button
                variant='ghost'
                onClick={onClose}
                className='text-white-muted hover:text-white-text'
              >
                {showAcceptButton ? 'Cancelar' : 'Cerrar'}
              </Button>

              {showAcceptButton && (
                <Button
                  onClick={handleAccept}
                  disabled={requireScrollValidation && !hasScrolledToEnd}
                  className='bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Acepto la Política
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
