import React from 'react';
import {
  Mail,
  Phone,
  Clock,
  CheckCircle,
  Rocket,
  Sparkles,
  Users,
  Shield,
  Award,
  Plane,
  MapPin,
} from 'lucide-react';
import { BRAND_COLORS } from '@/config/theme.config';

interface City {
  name: string;
  x: number; // Posición horizontal en porcentaje
  y: number; // Posición vertical en porcentaje
  delay: number; // Delay de animación
  active: boolean; // Si ya está activa la presencia de StrateKaz
}

const cities: City[] = [
  { name: 'Tibú', x: 85, y: 20, delay: 0, active: true },
  { name: 'Cúcuta', x: 80, y: 25, delay: 1, active: true },
  { name: 'Bucaramanga', x: 70, y: 35, delay: 2, active: true },
  { name: 'Bogotá', x: 50, y: 50, delay: 3, active: true },
  { name: 'Medellín', x: 30, y: 40, delay: 4, active: false },
  { name: 'Cali', x: 20, y: 70, delay: 5, active: false },
  { name: 'Mocoa', x: 40, y: 85, delay: 6, active: true },
  { name: 'Barranquilla', x: 15, y: 15, delay: 7, active: false },
];

/**
 * PresenceMapSection Component
 *
 * Interactive map showing StrateKaz presence across Colombian cities
 * with contact information and trust indicators.
 */
export const PresenceMapSection: React.FC = () => {
  const [currentCityIndex, setCurrentCityIndex] = React.useState(0);
  const [planePosition, setPlanePosition] = React.useState({
    x: cities[0].x,
    y: cities[0].y,
  });

  // Funciones dinámicas para estilos sin hardcodear
  const getCityDotColor = (city: City, isActive: boolean) => {
    if (isActive) {
      return city.active ? 'bg-green-500' : 'bg-brand-500';
    }
    return city.active ? 'bg-green-500' : 'bg-white-muted';
  };

  const getCityTextColor = (city: City, isActive: boolean) => {
    if (isActive) {
      return city.active
        ? 'text-green-500 font-semibold'
        : 'text-brand-500 font-semibold';
    }
    return city.active ? 'text-green-400' : 'text-white-muted';
  };

  // Animación del avión simple y ordenada
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCityIndex(prev => {
        const nextIndex = (prev + 1) % cities.length;
        setPlanePosition({ x: cities[nextIndex].x, y: cities[nextIndex].y });
        return nextIndex;
      });
    }, 3000); // Cambiar de ciudad cada 3 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <section className='py-section-sm lg:py-section-md'>
      <div className='container-responsive'>
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center gap-3 mb-4'>
            <MapPin
              className='h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-brand-500'
              aria-label='Ubicaciones de presencia'
            />
            <h2 className='text-fluid-2xl lg:text-fluid-3xl font-bold text-white-text'>
              <span className='sm:hidden'>Presencia Nacional</span>
              <span className='hidden sm:inline'>
                Impacto en Diferentes Ciudades
              </span>
            </h2>
          </div>
          <div className='hidden sm:block container-content'>
            <p className='text-xl text-white-muted'>
              Hemos llegado a diferentes ciudades del territorio nacional y
              llegaremos a muchas más.
            </p>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-8 items-center'>
          {/* Map Animation */}
          <div className='relative h-[400px] lg:h-[500px] bg-gradient-to-br from-black-card via-black-card-soft to-black-hover rounded-2xl border border-black-border overflow-hidden'>
            {/* Map background pattern */}
            <div className='absolute inset-0 opacity-10'>
              <div
                className='absolute inset-0'
                style={{
                  backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 20px,
                  rgba(${BRAND_COLORS.primaryRgb}, 0.1) 20px,
                  rgba(${BRAND_COLORS.primaryRgb}, 0.1) 21px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 20px,
                  rgba(${BRAND_COLORS.primaryRgb}, 0.1) 20px,
                  rgba(${BRAND_COLORS.primaryRgb}, 0.1) 21px
                )`,
                }}
              ></div>
            </div>

            {/* Status Indicator - Bottom Right Corner */}
            <div className='absolute bottom-4 right-4 z-40 bg-black-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-black-border'>
              <div className='flex items-center space-x-2'>
                {cities[currentCityIndex].active ? (
                  <>
                    <CheckCircle
                      className='h-5 w-5 text-green-500 animate-pulse'
                      aria-hidden='true'
                    />
                    <span className='text-green-500 font-semibold text-sm'>
                      StrateKaz
                    </span>
                    <Rocket
                      className='h-4 w-4 text-green-500'
                      aria-hidden='true'
                    />
                  </>
                ) : (
                  <>
                    <Sparkles
                      className='h-5 w-5 text-brand-500 animate-pulse'
                      aria-hidden='true'
                    />
                    <span className='text-brand-300 font-medium text-sm'>
                      Próximamente
                    </span>
                  </>
                )}
              </div>
              <div className='text-xs text-white-muted mt-1'>
                {cities[currentCityIndex].name}
              </div>
            </div>
            {/* Cities */}
            {cities.map((city, index) => (
              <div
                key={city.name}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${currentCityIndex === index ? 'scale-125 z-20' : 'z-10'
                  }`}
                style={{ left: `${city.x}%`, top: `${city.y}%` }}
              >
                <div className='relative'>
                  {/* Pulso permanente para ciudades activas */}
                  {city.active && (
                    <div className='absolute -top-0.5 -left-0.5 w-5 h-5 bg-green-500 rounded-full animate-ping opacity-75' />
                  )}
                  {/* Punto principal */}
                  <div
                    className={`relative w-4 h-4 rounded-full transition-all duration-500 ${getCityDotColor(
                      city,
                      currentCityIndex === index
                    )}`}
                  />
                  {/* Pulso adicional cuando está seleccionado */}
                  {currentCityIndex === index && (
                    <div
                      className={`absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full animate-ping ${city.active ? 'bg-green-500' : 'bg-brand-500'
                        }`}
                    />
                  )}
                  <span
                    className={`absolute top-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap transition-all duration-500 ${getCityTextColor(
                      city,
                      currentCityIndex === index
                    )}`}
                  >
                    {city.name}
                  </span>
                </div>
              </div>
            ))}

            {/* Flying Plane */}
            <div
              className='absolute transform -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-[3000ms] ease-in-out'
              style={{
                left: `${planePosition.x}%`,
                top: `${planePosition.y}%`,
              }}
            >
              <Plane
                className='h-8 w-8 text-blue-500 transform rotate-45'
                aria-label='Expansión de servicios'
              />
            </div>

            {/* Connection Lines */}
            <svg className='absolute inset-0 w-full h-full pointer-events-none opacity-40'>
              {cities.map((city, index) => {
                const nextCity = cities[(index + 1) % cities.length];
                return (
                  <line
                    key={`line-${index}`}
                    x1={`${city.x}%`}
                    y1={`${city.y}%`}
                    x2={`${nextCity.x}%`}
                    y2={`${nextCity.y}%`}
                    stroke={BRAND_COLORS.primary}
                    strokeWidth='2'
                    strokeDasharray='8,4'
                  />
                );
              })}
            </svg>
          </div>

          {/* Contact Information */}
          <div className='space-y-6 flex flex-col items-center text-center'>
            <div className='w-full'>
              <h3 className='text-fluid-xl lg:text-fluid-2xl font-bold text-white-text mb-4'>
                Contáctanos
              </h3>
              <div className='space-y-3'>
                <div className='flex items-center justify-center space-x-3'>
                  <Phone
                    className='h-6 w-6 text-white-text'
                    aria-hidden='true'
                  />
                  <div className='text-left'>
                    <div className='font-medium text-white-text'>WhatsApp</div>
                    <a
                      href='https://wa.me/573115351944'
                      className='text-white-muted hover:text-brand-600 transition-colors min-h-[44px] flex items-center'
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      +57 311 535 1944
                    </a>
                  </div>
                </div>

                <div className='flex items-center justify-center space-x-3'>
                  <Mail
                    className='h-6 w-6 text-white-text'
                    aria-hidden='true'
                  />
                  <div className='text-left'>
                    <div className='font-medium text-white-text'>Email</div>
                    <a
                      href='mailto:info@stratekaz.com'
                      className='text-white-muted hover:text-brand-600 transition-colors min-h-[44px] flex items-center'
                    >
                      info@stratekaz.com
                    </a>
                  </div>
                </div>

                <div className='flex items-start justify-center space-x-3'>
                  <Clock
                    className='h-6 w-6 text-white-text mt-1'
                    aria-hidden='true'
                  />
                  <div className='text-left'>
                    <div className='font-medium text-white-text'>Horarios</div>
                    <div className='text-white-muted text-sm'>
                      Lunes - Viernes: 8 AM - 5 PM COT
                      <br />
                      Soporte 24/7 para clientes Enterprise
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className='bg-black-card-soft rounded-xl p-4 border border-black-border w-fit text-left'>
              <h4 className='font-semibold text-white-text mb-3 text-center'>
                ¿Por qué elegir StrateKaz?
              </h4>
              <div className='space-y-2.5'>
                <div className='flex items-center space-x-3'>
                  <Users
                    className='h-5 w-5 text-success-600'
                    aria-hidden='true'
                  />
                  <span className='text-sm text-white-muted'>
                    20+ años de experiencia
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <Shield
                    className='h-5 w-5 text-success-600'
                    aria-hidden='true'
                  />
                  <span className='text-sm text-white-muted'>
                    Plataforma de Gestión Integral incluida gratis
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <Award
                    className='h-5 w-5 text-success-600'
                    aria-hidden='true'
                  />
                  <span className='text-sm text-white-muted'>
                    100% éxito en certificaciones
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <div className='relative'>
                    <Rocket
                      className='h-5 w-5 text-brand-500 animate-pulse'
                      aria-hidden='true'
                    />
                    <div className='absolute -top-1 -right-1 w-2 h-2 bg-brand-400 rounded-full animate-ping' />
                  </div>
                  <span className='text-sm text-white-muted animate-bounce'>
                    ¡Sin Miedo al Éxito!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PresenceMapSection;
