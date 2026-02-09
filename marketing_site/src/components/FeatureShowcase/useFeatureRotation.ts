/**
 * useFeatureRotation Hook
 *
 * Manages auto-rotation of feature showcase items.
 * Pauses when page is not visible (Page Visibility API) to save resources.
 */
import { useState, useEffect } from 'react';

export const useFeatureRotation = (
  featuresLength: number,
  autoRotateInterval: number
) => {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const startRotation = () => {
      interval = setInterval(() => {
        setActiveFeature(prev => (prev + 1) % featuresLength);
      }, autoRotateInterval);
    };

    const stopRotation = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopRotation();
      } else {
        startRotation();
      }
    };

    // Start rotation if page is visible
    if (!document.hidden) {
      startRotation();
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopRotation();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [featuresLength, autoRotateInterval]);

  return { activeFeature, setActiveFeature };
};
