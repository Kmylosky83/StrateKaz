/**
 * NetworkBackground Component
 *
 * Animated 3D network background using Three.js
 * Synchronized with marketing_site ThreeBackground for visual consistency
 *
 * Performance optimizations:
 * - IntersectionObserver to pause when off-screen
 * - Adaptive particle count for mobile devices
 * - Reduced motion support for accessibility
 * - GPU-optimized with depthWrite:false, alphaTest, setDrawRange
 * - Lazy loaded via React.lazy in LoginPage
 */
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_CONFIG, isLowPerformanceDevice, shouldReduceMotion } from '@/lib/animations';

interface NetworkBackgroundProps {
  /** Primary brand color for particles and connections */
  brandColor?: string;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: THREE.Color;
  scale: number;
}

interface NetworkAnimationProps {
  brandColor: string;
  isVisible: boolean;
  particleCount: number;
}

const NetworkAnimation = ({ brandColor, isVisible, particleCount }: NetworkAnimationProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Generate circle texture for particles
  const circleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // Initial particles state - regenerates when brandColor or count changes
  const particles = useMemo<Particle[]>(() => {
    const temp: Particle[] = [];
    const primary = new THREE.Color(brandColor);
    const white = new THREE.Color('#ffffff');

    for (let i = 0; i < particleCount; i++) {
      // Color mix: ~70% Primary, ~30% White for visual variety
      const isPrimary = Math.random() > 1 - PARTICLE_CONFIG.primaryColorRatio;
      const color = isPrimary ? primary : white;

      temp.push({
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 60,
        z: (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * PARTICLE_CONFIG.speed,
        vy: (Math.random() - 0.5) * PARTICLE_CONFIG.speed,
        vz: (Math.random() - 0.5) * PARTICLE_CONFIG.speed,
        color: color,
        scale: Math.random() * 0.5 + 0.5,
      });
    }
    return temp;
  }, [particleCount, brandColor]);

  // Buffer geometries
  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    particles.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      colors[i * 3] = p.color.r;
      colors[i * 3 + 1] = p.color.g;
      colors[i * 3 + 2] = p.color.b;
    });

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [particles, particleCount]);

  const linesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const maxConnections = particleCount * particleCount;
    const positions = new Float32Array(maxConnections * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [particleCount]);

  const connectionDistSq = PARTICLE_CONFIG.connectionDistance * PARTICLE_CONFIG.connectionDistance;

  useFrame(() => {
    // Skip animation when not visible (performance optimization)
    if (!isVisible || !pointsRef.current || !linesRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const linePositions = linesRef.current.geometry.attributes.position.array as Float32Array;

    let lineVertexIndex = 0;

    // Update positions
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      // Bounce off boundaries
      if (p.x < -50 || p.x > 50) p.vx *= -1;
      if (p.y < -30 || p.y > 30) p.vy *= -1;
      if (p.z < -20 || p.z > 20) p.vz *= -1;

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      // Check connections
      for (let j = i + 1; j < particleCount; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dz = p.z - p2.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < connectionDistSq) {
          linePositions[lineVertexIndex++] = p.x;
          linePositions[lineVertexIndex++] = p.y;
          linePositions[lineVertexIndex++] = p.z;

          linePositions[lineVertexIndex++] = p2.x;
          linePositions[lineVertexIndex++] = p2.y;
          linePositions[lineVertexIndex++] = p2.z;
        }
      }
    }

    // Update Points
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Update Lines
    linesRef.current.geometry.setDrawRange(0, lineVertexIndex / 3);
    linesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef} geometry={pointsGeometry}>
        <pointsMaterial
          map={circleTexture}
          color={0xffffff}
          size={0.6}
          transparent
          opacity={0.8}
          sizeAttenuation
          vertexColors={true}
          depthWrite={false}
          alphaTest={0.5}
        />
      </points>
      <lineSegments ref={linesRef} geometry={linesGeometry}>
        <lineBasicMaterial color={brandColor} transparent opacity={0.12} depthWrite={false} />
      </lineSegments>
    </>
  );
};

/**
 * NetworkBackground Component
 * Full-screen animated background for login/auth pages
 *
 * @param brandColor - Primary brand color (defaults to StrateKaz pink)
 */
export const NetworkBackground = ({
  brandColor = PARTICLE_CONFIG.brandColor,
}: NetworkBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const reduceMotion = shouldReduceMotion();

  // Adaptive particle count based on device performance
  const particleCount = useMemo(() => {
    if (reduceMotion) return 0; // No particles for reduced motion
    return isLowPerformanceDevice() ? PARTICLE_CONFIG.mobileCount : PARTICLE_CONFIG.desktopCount;
  }, [reduceMotion]);

  // IntersectionObserver to pause when off-screen
  const handleVisibility = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      setIsVisible(entry.isIntersecting);
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleVisibility, {
      threshold: 0.1,
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [handleVisibility]);

  // For reduced motion: show static dark background only
  if (reduceMotion || particleCount === 0) {
    return <div className="fixed inset-0 z-0 pointer-events-none bg-neutral-950" />;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none bg-neutral-950"
      style={{ contain: 'layout style paint' }}
    >
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <NetworkAnimation
          brandColor={brandColor}
          isVisible={isVisible}
          particleCount={particleCount}
        />
      </Canvas>
    </div>
  );
};

export default NetworkBackground;
