import React from 'react';

/**
 * Interface for feature metrics
 */
export interface FeatureMetrics {
  /** Primary metric value */
  primary: string;
  /** Secondary metric description */
  secondary: string;
}

/**
 * Interface for individual feature
 */
export interface Feature {
  /** Unique identifier for the feature */
  id: string;
  /** Icon component to display */
  icon: React.ReactNode;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Color theme for the feature */
  color: string;
  /** Performance metrics */
  metrics: FeatureMetrics;
  /** Interactive preview component */
  preview: React.ReactNode;
  /** List of feature benefits */
  benefits: string[];
  /** Feature image path (optional) */
  image?: string;
  /** Feature image alt text (optional) */
  imageAlt?: string;
}

/**
 * Interface for feature showcase content structure
 */
export interface FeatureShowcaseContent {
  /** Section header configuration */
  header: {
    /** Main title */
    title: string;
    /** Subtitle/description */
    subtitle: string;
  };
  /** Array of features to showcase */
  features: Feature[];
  /** Component configuration */
  config: {
    /** Auto-rotation interval in milliseconds */
    autoRotateInterval: number;
    /** Section spacing classes */
    sectionSpacing: string;
    /** Container classes for responsive layout */
    containerClasses: string;
  };
}

/**
 * Props for FeatureShowcase component
 */
export interface FeatureShowcaseProps {
  /** Optional content override */
  content?: Partial<FeatureShowcaseContent>;
  /** Additional CSS classes */
  className?: string;
}
