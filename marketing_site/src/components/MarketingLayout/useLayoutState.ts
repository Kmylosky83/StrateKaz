import React from 'react';
import { useLocation } from 'react-router-dom';

export const useLayoutState = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showTermsModal, setShowTermsModal] = React.useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = React.useState(false);
  const [showCookiesModal, setShowCookiesModal] = React.useState(false);
  const location = useLocation();

  const isActivePage = (href: string) => {
    return location.pathname === href;
  };

  return {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    showTermsModal,
    setShowTermsModal,
    showPrivacyModal,
    setShowPrivacyModal,
    showCookiesModal,
    setShowCookiesModal,
    isActivePage,
  };
};
