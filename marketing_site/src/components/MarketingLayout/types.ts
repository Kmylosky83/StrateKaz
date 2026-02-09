export interface MarketingLayoutProps {
  children: React.ReactNode;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; 'aria-label'?: string }>;
  isExternal?: boolean;
}

export interface FooterLink {
  name: string;
  href: string;
}

export interface FooterLinks {
  services: FooterLink[];
  clients: FooterLink[];
  coverage: FooterLink[];
  company: FooterLink[];
}

export interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isActivePage: (href: string) => boolean;
}

export interface FooterProps {
  showTermsModal: boolean;
  setShowTermsModal: (show: boolean) => void;
  showPrivacyModal: boolean;
  setShowPrivacyModal: (show: boolean) => void;
  showCookiesModal: boolean;
  setShowCookiesModal: (show: boolean) => void;
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isActivePage: (href: string) => boolean;
}
