import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { FlowerEffectsLayer } from '../effects/FlowerEffectsLayer';

interface HospitalAuthBackgroundProps {
  image?: string;
  className?: string;
}

export const HospitalAuthBackground: React.FC<HospitalAuthBackgroundProps> = ({
  image = '/images/hiro/lobby.jpg',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Mouse Parallax Motion Values (Interpolated with smooth spring physics)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 120 };
  const parallaxX = useSpring(mouseX, springConfig);
  const parallaxY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse position from center (-0.5 to 0.5)
      const normX = (e.clientX / window.innerWidth) - 0.5;
      const normY = (e.clientY / window.innerHeight) - 0.5;

      // Move slightly opposite to mouse (max 12px X, 8px Y)
      mouseX.set(-normX * 14);
      mouseY.set(-normY * 9);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY, shouldReduceMotion]);

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      {/* Animated + Parallax Full-Cover Background Layer */}
      <motion.div
        className="absolute -inset-[6%] w-[112%] h-[112%] bg-cover bg-center"
        style={{
          backgroundImage: `url(${image})`,
          x: shouldReduceMotion ? 0 : parallaxX,
          y: shouldReduceMotion ? 0 : parallaxY,
          willChange: 'transform',
        }}
        initial={{ scale: 1.03 }}
        animate={
          shouldReduceMotion
            ? { scale: 1.03 }
            : {
                scale: [1.03, 1.07, 1.03],
                transition: {
                  duration: 20,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                },
              }
        }
      />

      {/* Atmospheric Dark / Cyan Clinical Readability Overlays */}
      <div className="absolute inset-0 bg-slate-950/50 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/80 z-[2]" />

      {/* Flower / Petal Interactive Layer */}
      <FlowerEffectsLayer />
    </div>
  );
};

export default HospitalAuthBackground;
