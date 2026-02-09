/**
 * useHeroAnimations Hook
 *
 * Manages all typing/rotation animations for the Hero section.
 *
 * Performance optimizations:
 * - Uses requestAnimationFrame instead of setInterval for smoother animations
 * - Pauses all animations when page is not visible (Page Visibility API)
 * - Respects prefers-reduced-motion accessibility setting
 * - Proper cleanup of all animation frames on unmount
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { HERO_CONTENT } from './heroData';
import { shouldReduceMotion } from '@/lib/animations';

export interface HeroAnimationsState {
  currentWordIndex: number;
  displayedWord: string;
  isDeleting: boolean;
  displayedText: string;
  systemProgress: number[];
  isInitialized: boolean;
  currentSystemCategory: number;
  auditCurrentWordIndex: number;
  auditDisplayedWord: string;
  auditIsDeleting: boolean;
  auditIsInitialized: boolean;
}

/**
 * Custom hook that replaces setInterval with requestAnimationFrame
 * for smoother, more efficient typing animations.
 * Automatically pauses when not active (tab hidden, reduced motion, etc.)
 */
const useRAFInterval = (callback: () => void, delay: number, active: boolean = true) => {
  const savedCallback = useRef(callback);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;

    const tick = (time: number) => {
      if (time - lastTimeRef.current >= delay) {
        lastTimeRef.current = time;
        savedCallback.current();
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [delay, active]);
};

/**
 * Hook to detect page visibility (for pausing animations when tab is hidden)
 */
const usePageVisible = (): boolean => {
  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? !document.hidden : true
  );

  useEffect(() => {
    const handleVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return isVisible;
};

export const useHeroAnimations = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedWord, setDisplayedWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [systemProgress, setSystemProgress] = useState(
    HERO_CONTENT.managementSystems.flatMap(category =>
      category.systems.map(() => 0)
    )
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSystemCategory, setCurrentSystemCategory] = useState(0);

  // Audit badge dynamic text states
  const [auditCurrentWordIndex, setAuditCurrentWordIndex] = useState(0);
  const [auditDisplayedWord, setAuditDisplayedWord] = useState('');
  const [auditIsDeleting, setAuditIsDeleting] = useState(false);
  const [auditIsInitialized, setAuditIsInitialized] = useState(false);

  const dynamicWords = HERO_CONTENT.headline.dynamicWords;
  const fullText = HERO_CONTENT.socialProof.text;
  const auditDynamicWords =
    HERO_CONTENT.floatingElements.bottomBadge.dynamicWords;

  const pageVisible = usePageVisible();
  const reduceMotion = shouldReduceMotion();

  // Refs for typing state (avoid stale closures in RAF)
  const wordCharIndex = useRef(0);
  const wordPaused = useRef(false);
  const textCharIndex = useRef(0);
  const textIsDeleting = useRef(false);
  const auditCharIndex = useRef(0);
  const auditPaused = useRef(false);
  const progressStep = useRef(0);

  // Active state: animations run only when page is visible and motion is allowed
  const isActive = pageVisible && !reduceMotion;

  // Initialize with first word
  useEffect(() => {
    if (!isInitialized && dynamicWords.length > 0) {
      setDisplayedWord('');
      setIsInitialized(true);
    }
  }, [isInitialized, dynamicWords]);

  // Professional word rotation animation (using RAF)
  const handleWordType = useCallback(() => {
    if (!isInitialized || wordPaused.current) return;

    const currentWord = dynamicWords[currentWordIndex];

    if (!isDeleting) {
      if (wordCharIndex.current <= currentWord.length) {
        setDisplayedWord(currentWord.slice(0, wordCharIndex.current));
        wordCharIndex.current++;
      } else {
        wordPaused.current = true;
        setTimeout(() => {
          wordPaused.current = false;
          setIsDeleting(true);
          wordCharIndex.current = currentWord.length;
        }, 2000);
      }
    } else {
      if (wordCharIndex.current > 0) {
        wordCharIndex.current--;
        setDisplayedWord(currentWord.slice(0, wordCharIndex.current));
      } else {
        setIsDeleting(false);
        wordCharIndex.current = 0;
        setCurrentWordIndex(prev => (prev + 1) % dynamicWords.length);
      }
    }
  }, [currentWordIndex, isDeleting, dynamicWords, isInitialized]);

  useRAFInterval(handleWordType, isDeleting ? 50 : 100, isActive && isInitialized);

  // Typing animation for social proof
  const handleTextType = useCallback(() => {
    if (!textIsDeleting.current) {
      if (textCharIndex.current <= fullText.length) {
        setDisplayedText(fullText.slice(0, textCharIndex.current));
        textCharIndex.current++;
      } else {
        setTimeout(() => {
          textIsDeleting.current = true;
        }, 2000);
      }
    } else {
      if (textCharIndex.current > 0) {
        textCharIndex.current--;
        setDisplayedText(fullText.slice(0, textCharIndex.current));
      } else {
        textIsDeleting.current = false;
      }
    }
  }, [fullText]);

  useRAFInterval(handleTextType, textIsDeleting.current ? 50 : 100, isActive);

  // Animate system progress bars (one-time, with RAF)
  const targetValues = useRef(
    HERO_CONTENT.managementSystems.flatMap(category =>
      category.systems.map(system => system.target)
    )
  );
  const totalSteps = 80;
  const progressDone = useRef(false);

  const handleProgress = useCallback(() => {
    if (progressDone.current) return;

    if (progressStep.current < totalSteps) {
      const step = progressStep.current;
      setSystemProgress(
        targetValues.current.map(target => Math.round((target * step) / totalSteps))
      );
      progressStep.current++;
    } else {
      progressDone.current = true;
      setSystemProgress(targetValues.current);
    }
  }, []);

  useRAFInterval(handleProgress, 31, isActive && !progressDone.current);

  // Rotate system categories
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCurrentSystemCategory(
        prev => (prev + 1) % HERO_CONTENT.managementSystems.length
      );
    }, 8000);

    return () => clearInterval(timer);
  }, [isActive]);

  // Initialize audit badge
  useEffect(() => {
    if (!auditIsInitialized && auditDynamicWords.length > 0) {
      setAuditDisplayedWord('');
      setAuditIsInitialized(true);
    }
  }, [auditIsInitialized, auditDynamicWords]);

  // Audit badge word rotation animation (using RAF)
  const handleAuditType = useCallback(() => {
    if (!auditIsInitialized || auditPaused.current) return;

    const currentWord = auditDynamicWords[auditCurrentWordIndex];

    if (!auditIsDeleting) {
      if (auditCharIndex.current <= currentWord.length) {
        setAuditDisplayedWord(currentWord.slice(0, auditCharIndex.current));
        auditCharIndex.current++;
      } else {
        auditPaused.current = true;
        setTimeout(() => {
          auditPaused.current = false;
          setAuditIsDeleting(true);
          auditCharIndex.current = currentWord.length;
        }, 3000);
      }
    } else {
      if (auditCharIndex.current > 0) {
        auditCharIndex.current--;
        setAuditDisplayedWord(currentWord.slice(0, auditCharIndex.current));
      } else {
        setAuditIsDeleting(false);
        auditCharIndex.current = 0;
        setAuditCurrentWordIndex(
          prev => (prev + 1) % auditDynamicWords.length
        );
      }
    }
  }, [auditCurrentWordIndex, auditIsDeleting, auditDynamicWords, auditIsInitialized]);

  useRAFInterval(handleAuditType, auditIsDeleting ? 40 : 80, isActive && auditIsInitialized);

  // For reduced motion: show static text immediately
  useEffect(() => {
    if (reduceMotion) {
      if (dynamicWords.length > 0) setDisplayedWord(dynamicWords[0]);
      setDisplayedText(fullText);
      if (auditDynamicWords.length > 0) setAuditDisplayedWord(auditDynamicWords[0]);
      setSystemProgress(targetValues.current);
      progressDone.current = true;
    }
  }, [reduceMotion, dynamicWords, fullText, auditDynamicWords]);

  return {
    currentWordIndex,
    displayedWord,
    isDeleting,
    displayedText,
    systemProgress,
    isInitialized,
    currentSystemCategory,
    auditCurrentWordIndex,
    auditDisplayedWord,
    auditIsDeleting,
    auditIsInitialized,
  };
};
