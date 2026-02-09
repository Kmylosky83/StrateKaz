import React from 'react';
import { TermsOfServiceModal } from '../TermsOfServiceModal';
import { PrivacyPolicyModal } from '../PrivacyPolicyModal';
import { CookiesPolicyModal } from '../CookiesPolicyModal';
import { MarketingLayoutProps } from './types';
import { Header } from './Header';
import { Footer } from './Footer';
import { useLayoutState } from './useLayoutState';

import { ThreeBackground } from '../ThreeBackground';

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

  return (
    <div className='min-h-screen bg-black-deep overflow-x-hidden relative'>
      {/* 3D Background */}
      <ThreeBackground />

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
