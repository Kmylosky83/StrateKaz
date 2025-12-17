/**
 * TestConnectionButton - Botón reutilizable para probar conexión
 *
 * Estados:
 * - idle: Botón listo para usar
 * - loading: Probando conexión
 * - success: Conexión exitosa
 * - error: Error en conexión
 */
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { Wifi, Check, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type ConnectionTestState = 'idle' | 'loading' | 'success' | 'error';

export interface TestConnectionButtonProps {
  /** Función que ejecuta el test de conexión */
  onTest: () => Promise<{ success: boolean; message?: string }>;
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg';
  /** Texto del botón */
  label?: string;
  /** Si debe mostrar el mensaje de resultado */
  showResultMessage?: boolean;
  /** Clases adicionales */
  className?: string;
  /** Si el botón está deshabilitado */
  disabled?: boolean;
}

export const TestConnectionButton = ({
  onTest,
  size = 'md',
  label = 'Probar Conexión',
  showResultMessage = true,
  className,
  disabled = false,
}: TestConnectionButtonProps) => {
  const [state, setState] = useState<ConnectionTestState>('idle');
  const [resultMessage, setResultMessage] = useState<string>('');

  const handleTest = async () => {
    setState('loading');
    setResultMessage('');

    try {
      const result = await onTest();

      if (result.success) {
        setState('success');
        setResultMessage(result.message || 'Conexión exitosa');

        // Volver a idle después de 3 segundos
        setTimeout(() => {
          setState('idle');
          setResultMessage('');
        }, 3000);
      } else {
        setState('error');
        setResultMessage(result.message || 'Error al conectar');

        // Volver a idle después de 5 segundos
        setTimeout(() => {
          setState('idle');
        }, 5000);
      }
    } catch (error) {
      setState('error');
      setResultMessage(
        error instanceof Error ? error.message : 'Error desconocido al probar conexión'
      );

      // Volver a idle después de 5 segundos
      setTimeout(() => {
        setState('idle');
      }, 5000);
    }
  };

  const getButtonProps = () => {
    switch (state) {
      case 'loading':
        return {
          variant: 'outline' as const,
          leftIcon: <Wifi className="h-4 w-4 animate-pulse" />,
          children: 'Probando...',
          disabled: true,
        };
      case 'success':
        return {
          variant: 'outline' as const,
          leftIcon: <Check className="h-4 w-4" />,
          children: 'Conexión Exitosa',
          disabled: true,
          className: 'border-success-500 text-success-700 dark:text-success-400',
        };
      case 'error':
        return {
          variant: 'outline' as const,
          leftIcon: <X className="h-4 w-4" />,
          children: 'Error de Conexión',
          disabled: true,
          className: 'border-danger-500 text-danger-700 dark:text-danger-400',
        };
      default:
        return {
          variant: 'outline' as const,
          leftIcon: <Wifi className="h-4 w-4" />,
          children: label,
          disabled: disabled,
        };
    }
  };

  const buttonProps = getButtonProps();

  return (
    <div className="space-y-3">
      <Button
        {...buttonProps}
        size={size}
        onClick={handleTest}
        className={cn(buttonProps.className, className)}
      />

      {showResultMessage && resultMessage && (
        <Alert
          variant={state === 'success' ? 'success' : 'error'}
          message={resultMessage}
          closable
          onClose={() => {
            setResultMessage('');
            setState('idle');
          }}
        />
      )}
    </div>
  );
};
