import React from 'react';

export interface ServicePackage {
  id: string;
  title: string;
  description: string;
  timeline: string;
  investment: string;
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
  includes: string[];
  deliverables: string[];
  industries: string[];
}

export interface UserProfile {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
  useCases: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  category: string;
  items: FAQItem[];
}

export type TabType = 'services' | 'profiles' | 'faq';

export interface ColorClasses {
  bg: string;
  text: string;
  border: string;
  ring: string;
  hoverBorder: string;
  hoverShadow: string;
  badge: string;
  button: string;
  buttonHover: string;
}
