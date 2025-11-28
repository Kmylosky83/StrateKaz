import { useState } from 'react';
import { MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { GeolocationCoordinates, GeolocationError } from '../types/ecoaliado.types';

interface GeolocationButtonProps {
  onCoordsCapture: (coords: GeolocationCoordinates) => void;
  currentCoords?: { latitude?: number | null; longitude?: number | null };
  disabled?: boolean;
}

export const GeolocationButton = ({
  onCoordsCapture,
  currentCoords,
  disabled,
}: GeolocationButtonProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedCoords, setCapturedCoords] = useState<GeolocationCoordinates | null>(null);

  const hasCurrentCoords = currentCoords?.latitude && currentCoords?.longitude;

  const handleCapture = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setIsCapturing(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: GeolocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        setCapturedCoords(coords);
        onCoordsCapture(coords);
        setIsCapturing(false);
      },
      (error: GeolocationPositionError) => {
        let errorMessage = 'Error al capturar ubicación';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permisos de ubicación denegados. Por favor habilita el acceso.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Verifica tu conexión GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
            break;
        }

        setError(errorMessage);
        setIsCapturing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const displayCoords = capturedCoords || (hasCurrentCoords ? currentCoords : null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCapture}
          disabled={disabled || isCapturing}
          className="flex-shrink-0"
        >
          {isCapturing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Capturando...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              {displayCoords ? 'Recapturar Ubicación GPS' : 'Capturar Ubicación GPS'}
            </>
          )}
        </Button>

        {displayCoords && !error && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ubicación capturada</span>
          </div>
        )}
      </div>

      {/* Mostrar coordenadas capturadas */}
      {displayCoords && !error && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                Coordenadas GPS
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-green-700 dark:text-green-300">Latitud:</span>
                  <p className="font-mono font-semibold text-green-900 dark:text-green-100">
                    {displayCoords.latitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <span className="text-green-700 dark:text-green-300">Longitud:</span>
                  <p className="font-mono font-semibold text-green-900 dark:text-green-100">
                    {displayCoords.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
              {displayCoords.accuracy && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Precisión: ±{Math.round(displayCoords.accuracy)} metros
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mostrar error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                Error de Geolocalización
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Información si no hay coordenadas */}
      {!displayCoords && !error && !isCapturing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-100 mb-1">
                Captura GPS Opcional
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Haz clic en el botón para capturar la ubicación actual del ecoaliado. Esto es
                opcional pero ayuda a ubicarlo en el mapa.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
