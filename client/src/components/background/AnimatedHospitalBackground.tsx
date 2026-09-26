import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface AnimatedHospitalBackgroundProps {
  image: string;
  movementStrength?: 'subtle' | 'slow' | 'medium' | 'cinematic';
  overlayStrength?: number; // 0 to 1
  overlayGradient?: string;
  blur?: number; // px blur
  duration?: number; // seconds
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedHospitalBackground: React.FC<AnimatedHospitalBackgroundProps> = ({
  image,
  movementStrength = 'slow',
  overlayStrength = 0.35,
  overlayGradient,
  blur = 0,
  duration = 20,
  className = '',
  style,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Define movement amplitudes based on strength preset
  const getMovementVariants = () => {
    if (shouldReduceMotion) {
      return {
        initial: { scale: 1, x: 0, y: 0 },
        animate: { scale: 1, x: 0, y: 0 },
      };
    }

    switch (movementStrength) {
      case 'subtle':
        return {
          initial: { scale: 1.0, x: 0, y: 0 },
          animate: {
            scale: [1.0, 1.025, 1.0],
            x: [0, 8, -6, 0],
            y: [0, -6, 4, 0],
          },
        };
      case 'medium':
        return {
          initial: { scale: 1.02, x: 0, y: 0 },
          animate: {
            scale: [1.02, 1.06, 1.02],
            x: [0, 15, -12, 0],
            y: [0, -10, 8, 0],
          },
        };
      case 'cinematic':
        return {
          initial: { scale: 1.0, x: 0, y: 0 },
          animate: {
            scale: [1.0, 1.08, 1.0],
            x: [0, 20, -15, 0],
            y: [0, -12, 10, 0],
          },
        };
      case 'slow':
      default:
        return {
          initial: { scale: 1.03, x: 0, y: 0 },
          animate: {
            scale: [1.03, 1.055, 1.03],
            x: [0, 10, -8, 0],
            y: [0, -7, 5, 0],
          },
        };
    }
  };

  const variants = getMovementVariants();

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
      style={style}
    >
      {/* Animated Full-Cover Background Image */}
      <motion.div
        className="absolute -inset-[5%] w-[110%] h-[110%] bg-cover bg-center"
        style={{
          backgroundImage: `url(${image})`,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          willChange: 'transform',
        }}
        initial="initial"
        animate="animate"
        variants={{
          initial: variants.initial,
          animate: {
            ...variants.animate,
            transition: shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatType: 'reverse',
                },
          },
        }}
      />

      {/* Layer 1: Semi-Transparent Tone Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundColor: `rgba(15, 23, 42, ${overlayStrength})`,
        }}
      />

      {/* Layer 2: Optional Custom Gradient or Default Readability Gradient */}
      {overlayGradient ? (
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{ background: overlayGradient }}
        />
      ) : (
        <div className="absolute inset-0 pointer-events-none z-[2] bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
      )}
    </div>
  );
};

export default AnimatedHospitalBackground;
