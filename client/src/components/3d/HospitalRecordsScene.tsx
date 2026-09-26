import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsMobile } from './useIsMobile';

function DigitalRecordsEnvironment() {
  const isMobile = useIsMobile();
  const groupRef = useRef<THREE.Group>(null);
  const particleCount = isMobile ? 30 : 65;

  // Generate matrix points for medical digital stream
  const points = useMemo(() => {
    const coords: [number, number, number][] = [];
    for (let i = 0; i < particleCount; i++) {
      coords.push([
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 6 - 1,
      ]);
    }
    return coords;
  }, [particleCount]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.04;
      groupRef.current.position.y = Math.sin(t * 0.3) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Background Deep Slate Gradient Backing */}
      <mesh position={[0, 0, -4.5]}>
        <planeGeometry args={[16, 8]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* Floating Holographic Medical Data Panels */}
      <group position={[-2.5, 0.4, -2]}>
        <mesh>
          <planeGeometry args={[2.2, 1.4]} />
          <meshBasicMaterial color="#0284c7" wireframe transparent opacity={0.35} />
        </mesh>
      </group>

      <group position={[2.6, -0.2, -1.8]}>
        <mesh>
          <planeGeometry args={[2.4, 1.6]} />
          <meshBasicMaterial color="#0d9488" wireframe transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Center Medical Grid */}
      <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -1.2, -1]}>
        <planeGeometry args={[14, 8, 14, 8]} />
        <meshBasicMaterial color="#0369a1" wireframe transparent opacity={0.25} />
      </mesh>

      {/* Medical Pulsing Nodes */}
      {points.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#38bdf8' : '#34d399'} />
        </mesh>
      ))}

      {/* Ambient and Accent Glow */}
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 2, 0]} intensity={1.2} color="#38bdf8" distance={8} />
      <pointLight position={[3, -1, 1]} intensity={0.8} color="#2dd4bf" distance={6} />
    </group>
  );
}

export const HospitalRecordsScene: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`relative ${className} overflow-hidden pointer-events-none`}>
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 50 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <DigitalRecordsEnvironment />
      </Canvas>
    </div>
  );
};

export default HospitalRecordsScene;
