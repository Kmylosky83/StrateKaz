import React from 'react';
import { Button } from '@components/ui/button';
import {
  X,
  Cookie,
  Settings,
  BarChart3,
  Globe,
  Eye,
  UserCheck,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

interface CookiesPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  variant?: 'signup' | 'settings' | 'footer';
}

interface CookieSection {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: string;
  highlight?: string;
}

const cookiesContent: CookieSection[] = [
  {
    id: 1,
    title: '¿Qué son las Cookies?',
    icon: Cookie,
    content: `Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio web. Estas nos ayudan a ofrecerte una mejor experiencia de usuario, recordar tus preferencias y mejorar continuamente nuestros servicios.

Tipos de cookies que utilizamos:
• Cookies esenciales: Necesarias para el funcionamiento básico del sitio
• Cookies de preferencias: Recuerdan tus configuraciones personales
• Cookies analíticas: Nos ayudan a entender cómo usas nuestra plataforma
• Cookies de marketing: Para mostrarte contenido más relevante`,
    highlight: `Siempre respetamos tu privacidad y te damos control total sobre las cookies que aceptas.`,
  },
  {
    id: 2,
    title: 'Cookies Esenciales',
    icon: Settings,
    content: `Estas cookies son fundamentales para el funcionamiento de StrateKaz y no pueden desactivarse:

• Autenticación: Mantienen tu sesión activa mientras usas la plataforma
• Seguridad: Protegen contra ataques y actividades maliciosas
• Configuración: Guardan tus preferencias de idioma y configuración regional
• Funcionalidad: Permiten que las características básicas funcionen correctamente

Duración: Estas cookies se eliminan automáticamente cuando cierras tu navegador (cookies de sesión) o después de un período específico.`,
    highlight: `Estas cookies no recopilan información personal identificable y son necesarias para brindarte nuestros servicios.`,
  },
  {
    id: 3,
    title: 'Cookies Analíticas',
    icon: BarChart3,
    content: `Utilizamos cookies analíticas para entender mejor cómo interactúas con StrateKaz:

• Google Analytics: Mide el tráfico y comportamiento en el sitio web
• Métricas de uso: Páginas más visitadas, tiempo de permanencia, rutas de navegación
• Optimización: Identificamos áreas de mejora en la experiencia del usuario
• Rendimiento: Monitoreamos la velocidad y funcionamiento de la plataforma

Estas cookies nos ayudan a:
• Mejorar el diseño y funcionalidad de StrateKaz
• Crear contenido más relevante para nuestros usuarios
• Optimizar el rendimiento técnico de la plataforma`,
    highlight: `Todos los datos analíticos se procesan de forma agregada y anónima, protegiendo tu identidad personal.`,
  },
  {
    id: 4,
    title: 'Cookies de Preferencias',
    icon: UserCheck,
    content: `Estas cookies personalizan tu experiencia en StrateKaz:

• Tema visual: Recordamos si prefieres tema claro u oscuro
• Idioma: Mantenemos tu idioma preferido para futuras visitas
• Configuración de dashboard: Guardamos la disposición de tus widgets personalizados
• Filtros y vistas: Recordamos tus preferencias de visualización de datos
• Notificaciones: Respetamos tus configuraciones de alertas y avisos

Beneficios para ti:
• No necesitas reconfigurar la plataforma en cada visita
• Tu experiencia se adapta automáticamente a tus necesidades
• Ahorro de tiempo al mantener tus configuraciones favoritas`,
    highlight: `Puedes cambiar estas preferencias en cualquier momento desde tu panel de configuración.`,
  },
  {
    id: 5,
    title: 'Cookies de Marketing',
    icon: Eye,
    content: `Utilizamos cookies de marketing para ofrecerte contenido más relevante:

• Redes sociales: Permiten compartir contenido en LinkedIn, Twitter, etc.
• Publicidad dirigida: Muestran anuncios relacionados con tus intereses profesionales
• Seguimiento de conversiones: Miden la efectividad de nuestras campañas
• Retargeting: Te muestran información relevante sobre servicios de StrateKaz

Socios de confianza:
• LinkedIn Business Solutions
• Google Ads (solo para empresas B2B)
• Facebook Business (contenido empresarial)`,
    highlight: `Puedes desactivar estas cookies en cualquier momento sin afectar la funcionalidad principal de StrateKaz.`,
  },
  {
    id: 6,
    title: 'Control de Cookies',
    icon: Settings,
    content: `Tienes control total sobre las cookies que utilizamos:

Opciones disponibles:
• Aceptar todas: Permite el uso de todos los tipos de cookies
• Solo esenciales: Únicamente cookies necesarias para el funcionamiento
• Personalizar: Selecciona específicamente qué tipos de cookies permitir
• Rechazar no esenciales: Bloquea cookies analíticas y de marketing

Gestión desde tu navegador:
• Chrome: Configuración > Privacidad y seguridad > Cookies
• Firefox: Preferencias > Privacidad y seguridad
• Safari: Preferencias > Privacidad
• Edge: Configuración > Cookies y permisos del sitio`,
    highlight: `Cambiar tus preferencias de cookies puede afectar algunas funcionalidades de StrateKaz.`,
  },
  {
    id: 7,
    title: 'Cookies de Terceros',
    icon: Globe,
    content: `Algunos servicios integrados pueden establecer sus propias cookies:

Servicios externos que utilizamos:
• Google Analytics: Para análisis de tráfico web
• Google Fonts: Para tipografías optimizadas
• Cloudflare: Para seguridad y rendimiento del sitio
• HubSpot: Para gestión de leads y comunicaciones
• Stripe: Para procesamiento seguro de pagos (cuando aplique)

Cada servicio tiene sus propias políticas:
• Respetamos las configuraciones de privacidad que elijas
• Proporcionamos enlaces a las políticas de cookies de terceros
• No compartimos datos personales sin tu consentimiento`,
    highlight: `Puedes revisar las políticas de privacidad de estos servicios en sus respectivos sitios web.`,
  },
  {
    id: 8,
    title: 'Actualizaciones de Política',
    icon: RefreshCw,
    content: `Mantenemos esta política actualizada para reflejar cambios en nuestros servicios:

• Te notificaremos sobre cambios importantes mediante email
• Las actualizaciones menores se publicarán en nuestro sitio web
• Siempre puedes revisar la versión más reciente aquí
• La fecha de última actualización aparece al final de esta política

Compromiso con la transparencia:
• Explicamos claramente cualquier nuevo uso de cookies
• Te damos tiempo para revisar los cambios antes de implementarlos
• Mantenemos un historial de versiones disponible bajo solicitud`,
    highlight: `Tu uso continuado de StrateKaz después de las actualizaciones constituye aceptación de los cambios.`,
  },
];

export const CookiesPolicyModal: React.FC<CookiesPolicyModalProps> = ({
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
              <Cookie className='h-5 w-5 text-brand-500' aria-hidden='true' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-white-text font-title'>
                Política de Cookies
              </h2>
              <p className='text-sm text-white-muted font-content'>
                StrateKaz - Gestión de Cookies y Preferencias
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
                  Tu Control, Nuestra Transparencia
                </h3>
                <p className='text-sm text-white-muted font-content'>
                  En StrateKaz utilizamos cookies para mejorar tu experiencia,
                  personalizar contenido y analizar el uso de nuestra
                  plataforma. Siempre respetamos tu privacidad y te damos
                  control total sobre qué cookies aceptar. Esta política te
                  explica todo de manera transparente.
                </p>
              </div>
            </div>
          </div>

          {/* Cookie Sections */}
          {cookiesContent.map(section => {
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
                  <Cookie
                    className='h-4 w-4 text-orange-500'
                    aria-label='Advertencia de cookies'
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
                  Acepto las Cookies
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
