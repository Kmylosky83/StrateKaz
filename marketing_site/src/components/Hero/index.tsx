import React from 'react';
import { HeroBackground } from './HeroBackground';
import { HeroContent } from './HeroContent';
import { HeroDashboard } from './HeroDashboard';
import { useHeroAnimations } from './useHeroAnimations';

export const Hero: React.FC = () => {
  const {
    displayedWord,
    displayedText,
    systemProgress,
    currentSystemCategory,
    auditDisplayedWord,
  } = useHeroAnimations();

  return (
    <HeroBackground>
      {/* Left column - Content */}
      <HeroContent displayedWord={displayedWord} />

      {/* Right column - Dashboard */}
      <HeroDashboard
        systemProgress={systemProgress}
        currentSystemCategory={currentSystemCategory}
        displayedText={displayedText}
        auditDisplayedWord={auditDisplayedWord}
      />
    </HeroBackground>
  );
};
