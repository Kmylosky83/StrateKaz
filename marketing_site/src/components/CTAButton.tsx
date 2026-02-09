import React from 'react';
import { Button, ButtonProps } from '@components/ui/button';
import { ArrowRight, Play, CheckCircle, Download } from 'lucide-react';
import { cn } from '@utils/cn';

// Color configuration for CTA buttons
const CTA_COLORS = {
  primary: {
    bg: 'bg-brand-500',
    hover: 'hover:bg-brand-600',
    border: 'border-brand-500',
    text: 'text-white',
  },
  secondary: {
    bg: 'bg-black-card',
    hover: 'hover:bg-black-hover',
    border: 'border-black-border-soft',
    text: 'text-white-muted hover:text-white-text',
  },
  accent: {
    bg: 'bg-brand-500/10',
    hover: 'hover:bg-brand-500/20',
    border: 'border-brand-500/30',
    text: 'text-brand-500',
  },
} as const;

export interface CTAButtonProps extends ButtonProps {
  intent?: 'trial' | 'demo' | 'contact' | 'download';
  urgency?: boolean;
  conversion?: boolean;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
  intent = 'trial',
  urgency = false,
  conversion = false,
  className,
  children,
  ...props
}) => {
  const getButtonContent = () => {
    switch (intent) {
      case 'trial':
        return {
          text: children || 'Start Free Trial',
          icon: (
            <ArrowRight
              className='h-5 w-5 group-hover:translate-x-1 transition-transform'
              aria-hidden='true'
            />
          ),
          variant: 'primary' as const,
        };
      case 'demo':
        return {
          text: children || 'Watch Demo',
          icon: <Play className='h-5 w-5' aria-hidden='true' />,
          variant: 'ghost' as const,
        };
      case 'contact':
        return {
          text: children || 'Contact Sales',
          icon: (
            <ArrowRight
              className='h-5 w-5 group-hover:translate-x-1 transition-transform'
              aria-hidden='true'
            />
          ),
          variant: 'secondary' as const,
        };
      case 'download':
        return {
          text: children || 'Download Guide',
          icon: <Download className='h-5 w-5' aria-hidden='true' />,
          variant: 'outline' as const,
        };
      default:
        return {
          text: children || 'Get Started',
          icon: (
            <ArrowRight
              className='h-5 w-5 group-hover:translate-x-1 transition-transform'
              aria-hidden='true'
            />
          ),
          variant: 'primary' as const,
        };
    }
  };

  const { text, icon, variant } = getButtonContent();

  return (
    <div className='relative group'>
      {urgency && (
        <div className='absolute -top-8 left-1/2 transform -translate-x-1/2 bg-error-600 text-white text-xs px-3 py-2 rounded-full animate-pulse min-h-[28px] flex items-center'>
          Limited Time!
        </div>
      )}

      <Button
        variant={variant}
        size='lg'
        className={cn(
          'group relative overflow-hidden',
          conversion && 'shadow-brand hover:shadow-brand border-brand-200',
          urgency && 'animate-bounce-subtle',
          className
        )}
        rightIcon={icon}
        {...props}
      >
        {/* Shimmer effect for high-conversion buttons */}
        {conversion && (
          <div className='absolute inset-0 -top-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000' />
        )}

        {text}
      </Button>
    </div>
  );
};

// Specialized CTA components for common use cases
export const TrialCTA: React.FC<Omit<CTAButtonProps, 'intent'>> = props => (
  <CTAButton intent='trial' conversion {...props} />
);

export const DemoCTA: React.FC<Omit<CTAButtonProps, 'intent'>> = props => (
  <CTAButton intent='demo' {...props} />
);

export const ContactCTA: React.FC<Omit<CTAButtonProps, 'intent'>> = props => (
  <CTAButton intent='contact' {...props} />
);

// Floating CTA for scroll-triggered display
export const FloatingCTA: React.FC<{
  visible: boolean;
  onTrialClick: () => void;
  onDemoClick: () => void;
}> = ({ visible, onTrialClick, onDemoClick }) => {
  if (!visible) return null;

  return (
    <div className='fixed bottom-6 right-6 z-50 animate-slide-up'>
      <div className='bg-black-card border border-black-border rounded-2xl shadow-2xl p-4 space-y-3 max-w-xs'>
        <div className='text-sm font-medium text-white-text font-title'>
          ¿Listo para empezar?
        </div>
        <div className='flex space-x-2'>
          <Button
            size='sm'
            onClick={onTrialClick}
            className={`${CTA_COLORS.primary.bg} ${CTA_COLORS.primary.hover} ${CTA_COLORS.primary.text} ${CTA_COLORS.primary.border}`}
          >
            Consulta Gratuita
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={onDemoClick}
            leftIcon={<Play className='h-4 w-4' aria-hidden='true' />}
            className={`${CTA_COLORS.secondary.text} ${CTA_COLORS.secondary.hover} border ${CTA_COLORS.secondary.border}`}
          >
            Demo
          </Button>
        </div>
      </div>
    </div>
  );
};

// Exit-intent popup CTA
export const ExitIntentCTA: React.FC<{
  visible: boolean;
  onClose: () => void;
  onTrialClick: () => void;
}> = ({ visible, onClose, onTrialClick }) => {
  if (!visible) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black-deep/80 backdrop-blur-sm animate-fade-in'>
      <div className='bg-black-card border border-black-border rounded-2xl shadow-2xl max-w-md mx-4 p-8 animate-scale-in'>
        <div className='text-center space-y-6'>
          <div
            className={`w-16 h-16 ${CTA_COLORS.accent.bg} rounded-full flex items-center justify-center mx-auto`}
          >
            <CheckCircle
              className={`h-8 w-8 ${CTA_COLORS.accent.text}`}
              aria-label='Éxito garantizado'
            />
          </div>

          <div className='space-y-2'>
            <h3 className='text-fluid-xl lg:text-fluid-2xl font-bold text-white-text font-title'>
              ¡Espera! No te pierdas esto
            </h3>
            <p className='text-white-muted font-content'>
              Únete a las 500+ empresas que ya optimizan sus procesos con
              StrateKaz. 20+ años de experiencia y 100% de éxito te esperan.
            </p>
          </div>

          <div className='space-y-3'>
            <Button
              fullWidth
              onClick={onTrialClick}
              className={`${CTA_COLORS.primary.bg} ${CTA_COLORS.primary.hover} ${CTA_COLORS.primary.text} ${CTA_COLORS.primary.border}`}
            >
              Consulta Gratuita
            </Button>
            <button
              onClick={onClose}
              className={`w-full text-sm ${CTA_COLORS.secondary.text} font-content min-h-[44px] flex items-center justify-center transition-colors duration-200`}
            >
              Tal vez después
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
