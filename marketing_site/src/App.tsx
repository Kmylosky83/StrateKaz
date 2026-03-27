import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MarketingLayout } from '@components/MarketingLayout';
import { ScrollToTop } from '@/utils/ScrollToTop';
import { WebVitalsDebugger } from '@components/WebVitalsDebugger';
import { webVitalsMonitor } from '@/utils/webVitals';

// Lazy loading for pages
const LandingPage = React.lazy(() => import('@pages/LandingPage'));
const PricingPage = React.lazy(() => import('@pages/PricingPage'));
const ContactPage = React.lazy(() => import('@pages/ContactPage'));
const ResourcesPage = React.lazy(() => import('@pages/ResourcesPage'));


// Simple loading fallback - minimal to avoid duplicate loaders
const PageLoader: React.FC = () => <div className='min-h-screen' />;

const App: React.FC = () => {
  // Initialize Web Vitals monitoring
  useEffect(() => {
    webVitalsMonitor.init();
  }, []);

  return (
    <MarketingLayout>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/precios' element={<PricingPage />} />
          <Route path='/contacto' element={<ContactPage />} />
          <Route path='/recursos' element={<ResourcesPage />} />

          {/* Redirects from old English routes */}
          <Route path='/pricing' element={<Navigate to='/precios' replace />} />
          <Route path='/contact' element={<Navigate to='/contacto' replace />} />

          {/* Catch all — redirect to home */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Suspense>
      {import.meta.env.DEV && <WebVitalsDebugger />}
    </MarketingLayout>
  );
};

export default App;
