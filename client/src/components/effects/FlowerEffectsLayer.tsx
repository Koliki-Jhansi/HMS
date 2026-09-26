import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface PetalData {
  id: string;
  x: number;
  y: number;
  angle: number;
  distance: number;
  scale: number;
  rotation: number;
  color: string;
  duration: number;
}

interface BloomData {
  id: string;
  x: number;
  y: number;
  petals: PetalData[];
}

interface AmbientPetal {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  duration: number;
}

const PETAL_COLORS = [
  '#fbcfe8', // soft pink
  '#ffffff', // crisp white
  '#bae6fd', // light cyan blue
  '#e0e7ff', // soft lavender / ice blue
  '#fed7aa', // gentle peach
];

export const FlowerEffectsLayer: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [blooms, setBlooms] = useState<BloomData[]>([]);
  const [ambientPetals, setAmbientPetals] = useState<AmbientPetal[]>([]);

  // Spawn flower bloom on click/tap on decorative background
  const handleGlobalClick = useCallback(
    (e: MouseEvent | TouchEvent) => {
      // 1. Check if clicking on an interactive element
      const target = e.target as HTMLElement | null;
      if (
        !target ||
        target.closest('button, input, select, textarea, a, [role="button"], label, form')
      ) {
        return;
      }

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      } else {
        return;
      }

      const bloomId = `bloom-${Date.now()}-${Math.random()}`;
      const petalCount = window.innerWidth < 768 ? 6 : 9;
      const newPetals: PetalData[] = [];

      for (let i = 0; i < petalCount; i++) {
        const baseAngle = (i / petalCount) * Math.PI * 2;
        const angle = baseAngle + (Math.random() - 0.5) * 0.4;
        const distance = (window.innerWidth < 768 ? 40 : 65) + Math.random() * 45;
        const scale = 0.7 + Math.random() * 0.5;
        const rotation = (Math.random() - 0.5) * 240;
        const color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
        const duration = 1.6 + Math.random() * 0.8;

        newPetals.push({
          id: `${bloomId}-petal-${i}`,
          x: clientX,
          y: clientY,
          angle,
          distance,
          scale,
          rotation,
          color,
          duration,
        });
      }

      const newBloom: BloomData = {
        id: bloomId,
        x: clientX,
        y: clientY,
        petals: newPetals,
      };

      setBlooms((prev) => [...prev.slice(-4), newBloom]); // Keep at most 5 concurrent blooms for top performance

      // Auto cleanup bloom after animation
      setTimeout(() => {
        setBlooms((prev) => prev.filter((b) => b.id !== bloomId));
      }, 2600);
    },
    []
  );

  useEffect(() => {
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [handleGlobalClick]);

  // Spawn gentle ambient petal every 5-7 seconds
  useEffect(() => {
    if (shouldReduceMotion) return;

    const interval = setInterval(() => {
      const id = `ambient-${Date.now()}`;
      const startX = Math.random() * window.innerWidth;
      const startY = -20;
      const endX = startX + (Math.random() - 0.5) * 150;
      const endY = window.innerHeight + 30;
      const color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
      const duration = 10 + Math.random() * 6;

      setAmbientPetals((prev) => [...prev.slice(-3), { id, startX, startY, endX, endY, color, duration }]);

      setTimeout(() => {
        setAmbientPetals((prev) => prev.filter((p) => p.id !== id));
      }, duration * 1000);
    }, 5500);

    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden select-none">
      {/* Click / Tap Blooms */}
      <AnimatePresence>
        {blooms.map((bloom) => (
          <React.Fragment key={bloom.id}>
            {/* Center Glowing Flower Stamen */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.25, 0.8, 0],
                opacity: [0, 1, 0.8, 0],
              }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: bloom.x - 10,
                top: bloom.y - 10,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #fde047 0%, rgba(56, 189, 248, 0.6) 60%, transparent 100%)',
                boxShadow: '0 0 15px rgba(253, 224, 71, 0.8)',
              }}
            />

            {/* Delicate Spreading Petals */}
            {bloom.petals.map((petal) => {
              const targetX = Math.cos(petal.angle) * petal.distance;
              const targetY = Math.sin(petal.angle) * petal.distance + (petal.angle > 0 ? 15 : -10);

              return (
                <motion.div
                  key={petal.id}
                  initial={{
                    x: petal.x,
                    y: petal.y,
                    scale: 0.2,
                    opacity: 0.9,
                    rotate: 0,
                  }}
                  animate={{
                    x: petal.x + targetX,
                    y: petal.y + targetY,
                    scale: [0.2, petal.scale, petal.scale * 0.8, 0],
                    opacity: [0.9, 1, 0.7, 0],
                    rotate: petal.rotation,
                  }}
                  transition={{
                    duration: petal.duration,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 14,
                    height: 20,
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                    backgroundColor: petal.color,
                    boxShadow: `0 2px 8px ${petal.color}88`,
                    transformOrigin: 'bottom center',
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </AnimatePresence>

      {/* Ambient Floating Petals */}
      <AnimatePresence>
        {ambientPetals.map((petal) => (
          <motion.div
            key={petal.id}
            initial={{
              x: petal.startX,
              y: petal.startY,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              x: petal.endX,
              y: petal.endY,
              opacity: [0, 0.7, 0.7, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: petal.duration,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: 12,
              height: 18,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              backgroundColor: petal.color,
              boxShadow: `0 2px 6px ${petal.color}66`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FlowerEffectsLayer;
