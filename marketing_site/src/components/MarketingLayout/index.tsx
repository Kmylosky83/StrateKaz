import React, { Suspense, useState, useEffect } from 'react';
import { TermsOfServiceModal } from '../TermsOfServiceModal';
import { PrivacyPolicyModal } from '../PrivacyPolicyModal';
import { CookiesPolicyModal } from '../CookiesPolicyModal';
import { MarketingLayoutProps } from './types';
import { Header } from './Header';
import { Footer } from './Footer';
import { useLayoutState } from './useLayoutState';

// Lazy-load Three.js background to reduce initial bundle (~700KB)
const ThreeBackground = React.lazy(() => import('../ThreeBackground'));

export const MarketingLayout: React.FC<MarketingLayoutProps> = ({
  children,
}) => {
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    showTermsModal,
    setShowTermsModal,
    showPrivacyModal,
    setShowPrivacyModal,
    showCookiesModal,
    setShowCookiesModal,
    isActivePage,
  } = useLayoutState();

  // Defer Three.js load until after first paint
  const [loadBackground, setLoadBackground] = useState(false);
  useEffect(() => {
    const id = 'requestIdleCallback' in window
      ? (window as any).requestIdleCallback(() => setLoadBackground(true), { timeout: 1500 })
      : setTimeout(() => setLoadBackground(true), 500);
    return () => {
      if ('requestIdleCallback' in window) {
        (window as any).cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
    };
  }, []);

  return (
    <div className='min-h-screen bg-black-deep overflow-x-hidden relative'>
      {/* 3D Background (lazy-loaded after first paint) */}
      {loadBackground && (
        <Suspense fallback={<div className="fixed inset-0 z-[1] pointer-events-none" />}>
          <ThreeBackground />
        </Suspense>
      )}

      <div className='relative z-10'>
        <Header
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isActivePage={isActivePage}
        />

        {/* Main Content */}
        <main className='pt-14 sm:pt-16'>{children}</main>

        <Footer
          showTermsModal={showTermsModal}
          setShowTermsModal={setShowTermsModal}
          showPrivacyModal={showPrivacyModal}
          setShowPrivacyModal={setShowPrivacyModal}
          showCookiesModal={showCookiesModal}
          setShowCookiesModal={setShowCookiesModal}
        />
      </div>

      {/* Terms of Service Modal */}
      <TermsOfServiceModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        variant='footer'
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        variant='footer'
      />

      {/* Cookies Policy Modal */}
      <CookiesPolicyModal
        isOpen={showCookiesModal}
        onClose={() => setShowCookiesModal(false)}
        variant='footer'
      />
    </div>
  );
};
