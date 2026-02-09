import React from 'react';
import { Button } from '@components/ui/button';
import {
  X,
  Shield,
  FileText,
  CreditCard,
  Users,
  Scale,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  variant?: 'signup' | 'settings' | 'footer';
}

interface TermSection {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: string;
  highlight?: string;
}

const termsContent: TermSection[] = [
  {
    id: 1,
    title: 'Aceptación de Términos',
    icon: Shield,
    content: `Al acceder y utilizar la plataforma StrateKaz, usted acepta estar sujeto a estos Términos de Uso y todas las leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos términos, no debe utilizar nuestra plataforma.`,
    highlight: `Estos términos constituyen un acuerdo legal vinculante entre usted y StrateKaz. Le recomendamos leer cuidadosamente este documento antes de utilizar nuestros servicios.`,
  },
  {
    id: 2,
    title: 'Uso de la Plataforma',
    icon: Users,
    content: `StrateKaz proporciona herramientas de gestión empresarial y consultoría. El uso de nuestra plataforma está sujeto a las siguientes condiciones:

• Debe proporcionar información precisa y completa al registrarse
• Es responsable de mantener la confidencialidad de su cuenta
• No puede usar la plataforma para actividades ilegales o no autorizadas
• Debe respetar los derechos de propiedad intelectual
• No puede intentar acceder sin autorización a otras cuentas o sistemas`,
  },
  {
    id: 3,
    title: 'Propiedad Intelectual',
    icon: FileText,
    content: `Todo el contenido presente en StrateKaz, incluyendo pero no limitado a texto, gráficos, logos, íconos, imágenes, clips de audio, descargas digitales y compilaciones de datos, es propiedad de StrateKaz o sus proveedores de contenido y está protegido por las leyes de derechos de autor.`,
    highlight: `Se le otorga una licencia limitada, no exclusiva y no transferible para acceder y usar la plataforma para su uso personal o empresarial interno.`,
  },
  {
    id: 4,
    title: 'Servicios y Suscripciones',
    icon: CreditCard,
    content: `StrateKaz ofrece diferentes niveles de servicio:

• Consulta Gratuita: Evaluación inicial sin costo
• Consultoría + Plataforma de Gestión Integral: Servicios integrales con plataforma incluida
• Certificaciones ISO: Procesos especializados con garantía de éxito
• Servicios SST y PESV: Cumplimiento normativo especializado`,
    highlight: `Los precios y características de cada servicio pueden cambiar con previo aviso. Los cambios no afectarán a los contratos activos hasta su renovación.`,
  },
  {
    id: 5,
    title: 'Términos de Pago',
    icon: CreditCard,
    content: `Estructura de Pagos:
• Servicio de consultoría: Facturado mes vencido
• Uso de licencia de plataforma: Mes anticipado según su plan
• Proyectos especiales: 50% anticipo, 30% primer hito, 20% entrega final

Condiciones:
• Pagos vencidos generan interés de mora del 1.5% mensual
• Suspensión de servicios por falta de pago después de 15 días
• Métodos de pago: Transferencia bancaria, consignación, cheques`,
    highlight: `Plataforma de Gestión Integral gratuita disponible SOLO con consultoría activa`,
  },
  {
    id: 6,
    title: 'Limitación de Responsabilidad',
    icon: AlertCircle,
    content: `StrateKaz proporciona servicios de consultoría con 20+ años de experiencia y 100% de éxito en certificaciones. Sin embargo:

Limitaciones:
• Nuestra responsabilidad se limita al valor del contrato
• No somos responsables por decisiones empresariales basadas en nuestras recomendaciones
• Las certificaciones ISO dependen de la decisión final del ente certificador
• No asumimos responsabilidad por eventos de fuerza mayor (paros, desastres naturales)`,
    highlight: `El cliente debe proporcionar información completa y veraz para garantizar el éxito`,
  },
  {
    id: 7,
    title: 'Privacidad y Protección de Datos',
    icon: Shield,
    content: `Su privacidad es importante para nosotros. El uso de nuestra plataforma está también gobernado por nuestra Política de Privacidad, que describe cómo recopilamos, usamos y protegemos su información.

Compromiso:
• Cumplimos con todas las regulaciones aplicables de protección de datos
• Seguimos las leyes colombianas de protección de datos personales
• Su información se utiliza únicamente para prestar nuestros servicios`,
    highlight: `No compartimos datos con terceros sin su consentimiento expreso`,
  },
  {
    id: 8,
    title: 'Jurisdicción y Ley Aplicable',
    icon: Scale,
    content: `Ley Aplicable: Estos términos se rigen por las leyes de la República de Colombia.

Jurisdicción: Cualquier disputa relacionada con estos términos será resuelta en los tribunales competentes de Cúcuta, Norte de Santander, Colombia.`,
    highlight: `Antes de acudir a tribunales, las partes intentarán resolver cualquier disputa mediante mediación de buena fe.`,
  },
];

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
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
              <FileText className='h-5 w-5 text-brand-500' aria-hidden='true' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-white-text font-title'>
                Términos de Servicio
              </h2>
              <p className='text-sm text-white-muted font-content'>
                StrateKaz - Suite Empresarial BPM
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
                  Sin Miedo al Éxito!
                </h3>
                <p className='text-sm text-white-muted font-content'>
                  Con 20+ años de experiencia y 100% de éxito en certificaciones
                  y cumplimiento normativo, nuestro CEO centralizó su
                  conocimiento y experiencia para que te sientas seguro
                  trabajando con StrateKaz. Estos términos protegen tanto tu
                  inversión como nuestro compromiso mutuo hacia el éxito de tu
                  organización.
                </p>
              </div>
            </div>
          </div>

          {/* Terms Sections */}
          {termsContent.map(section => {
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
                  <AlertCircle
                    className='h-4 w-4 text-orange-500'
                    aria-label='Advertencia de términos'
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
                  Acepto los Términos
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
