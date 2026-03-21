import React, { Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MarketingLayout } from '@components/MarketingLayout';
import { ScrollToTop } from '@/utils/ScrollToTop';
import { WebVitalsDebugger } from '@components/WebVitalsDebugger';
import { webVitalsMonitor } from '@/utils/webVitals';

// Lazy loading for pages
const LandingPage = React.lazy(() => import('@pages/LandingPage'));
const PricingPage = React.lazy(() => import('@pages/PricingPage'));
const ContactPage = React.lazy(() => import('@pages/ContactPage'));


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
          <Route path='/pricing' element={<PricingPage />} />
          <Route path='/contact' element={<ContactPage />} />

          {/* Catch all route - redirect to home */}
          <Route path='*' element={<LandingPage />} />
        </Routes>
      </Suspense>
      {import.meta.env.DEV && <WebVitalsDebugger />}
    </MarketingLayout>
  );
};

export default App;
