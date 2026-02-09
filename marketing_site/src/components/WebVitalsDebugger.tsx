import React, { useState, useEffect } from 'react';
import { webVitalsMonitor } from '@/utils/webVitals';

interface WebVitalsDebuggerProps {
  show?: boolean;
}

export const WebVitalsDebugger: React.FC<WebVitalsDebuggerProps> = ({
  show = !import.meta.env.PROD,
}) => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!show) return;

    const updateMetrics = () => {
      setMetrics(webVitalsMonitor.getStoredMetrics());
      setSummary(webVitalsMonitor.getPerformanceSummary());
    };

    // Update initially
    updateMetrics();

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-500';
      case 'needs-improvement':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') return value.toFixed(3);
    return `${value}ms`;
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className='fixed bottom-4 right-4 z-50 bg-black text-white min-h-[44px] min-w-[44px] rounded-full shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center'
        title='Toggle Web Vitals Debugger'
      >
        📊
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className='fixed bottom-16 right-4 z-50 bg-black text-white p-4 rounded-lg shadow-xl max-w-sm max-h-96 overflow-auto text-xs'>
          <div className='flex justify-between items-center mb-3'>
            <h3 className='font-bold text-sm'>Web Vitals Debug</h3>
            <button
              onClick={() => webVitalsMonitor.clearStoredMetrics()}
              className='text-red-400 hover:text-red-300 min-h-[44px] min-w-[44px] flex items-center justify-center'
              title='Clear stored metrics'
            >
              🗑️
            </button>
          </div>

          {/* Summary */}
          {Object.keys(summary).length > 0 && (
            <div className='mb-4'>
              <h4 className='font-semibold mb-2'>Summary</h4>
              {Object.entries(summary).map(([name, data]: [string, any]) => (
                <div key={name} className='mb-2 p-2 bg-gray-800 rounded'>
                  <div className='font-medium'>{name}</div>
                  <div>Avg: {formatValue(name, data.average)}</div>
                  <div className='flex gap-2 text-xs'>
                    <span className='text-green-500'>
                      ✅{data.ratings.good}
                    </span>
                    <span className='text-yellow-500'>
                      ⚠️{data.ratings['needs-improvement']}
                    </span>
                    <span className='text-red-500'>❌{data.ratings.poor}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent metrics */}
          <div>
            <h4 className='font-semibold mb-2'>Recent Metrics</h4>
            {metrics.slice(-10).map((metric, index) => (
              <div key={index} className='mb-1 p-1 bg-gray-800 rounded'>
                <div className='flex justify-between'>
                  <span className='font-medium'>{metric.name}</span>
                  <span className={getRatingColor(metric.rating)}>
                    {formatValue(metric.name, metric.value)}
                  </span>
                </div>
                <div className='text-gray-400 text-xs'>
                  {new Date(metric.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {metrics.length === 0 && (
            <div className='text-gray-400 text-center py-4'>
              No metrics collected yet.
              <br />
              Navigate the site to see data.
            </div>
          )}
        </div>
      )}
    </>
  );
};
