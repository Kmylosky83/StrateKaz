import React from 'react';
import { FeatureHeader } from './FeatureHeader';
import { FeatureTabs } from './FeatureTabs';
import { FeatureContent } from './FeatureContent';
import { useFeatureRotation } from './useFeatureRotation';
import { FEATURE_SHOWCASE_CONTENT } from './data';
import { FeatureShowcaseProps } from './types';

/**
 * FeatureShowcase Component
 *
 * Showcases key BPM/ISO features with interactive previews and professional styling.
 * Designed for enterprise users managing ISO 9001, 14001, and 45001 compliance.
 * Features auto-rotating tabs and comprehensive feature demonstrations.
 */
export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  content,
  className = '',
}) => {
  const showcaseContent = { ...FEATURE_SHOWCASE_CONTENT, ...content };

  const { activeFeature, setActiveFeature } = useFeatureRotation(
    showcaseContent.features.length,
    showcaseContent.config.autoRotateInterval
  );

  const currentFeature = showcaseContent.features[activeFeature];

  return (
    <>
      <section
        className={`${showcaseContent.config.sectionSpacing} ${className}`}
      >
        <div className={showcaseContent.config.containerClasses}>
          {/* Section header */}
          <FeatureHeader
            title={showcaseContent.header.title}
            subtitle={showcaseContent.header.subtitle}
          />

          {/* Feature tabs - Mobile optimized */}
          <FeatureTabs
            features={showcaseContent.features}
            activeFeature={activeFeature}
            onFeatureSelect={setActiveFeature}
          />

          {/* Feature showcase */}
          <FeatureContent feature={currentFeature} />
        </div>
      </section>
    </>
  );
};
