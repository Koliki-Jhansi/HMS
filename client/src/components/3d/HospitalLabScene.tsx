import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsMobile } from './useIsMobile';

function LabEnvironment() {
  const groupRef = useRef<THREE.Group>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.3) * 0.04;
      groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.025;
    }
    if (glowLightRef.current) {
      glowLightRef.current.intensity = 0.9 + Math.sin(t * 2) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Clean Lab Tile Back Wall */}
      <mesh position={[0, 1.2, -4]}>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Lab Counter / Bench */}
      <mesh position={[0, -0.4, -1.8]}>
        <boxGeometry args={[7, 0.8, 1.8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.2} />
      </mesh>
      {/* Bench top trim */}
      <mesh position={[0, 0.02, -1.8]}>
        <boxGeometry args={[7.1, 0.06, 1.85]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Modern Microscope Silhouette Object */}
      <group position={[-1.2, 0.4, -1.5]}>
        {/* Base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.4, 0.08, 0.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Arm */}
        <mesh position={[0, 0.3, -0.15]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.08, 0.55, 0.12]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Eyepieces */}
        <mesh position={[0, 0.6, -0.05]} rotation={[-0.4, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.25, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Objective lenses */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.04, 0.15, 12]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Glass Beakers & Test Tubes with Glowing Reagents */}
      <group position={[1.4, 0.25, -1.4]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.32, 16]} />
          <meshPhysicalMaterial color="#38bdf8" transmission={0.7} opacity={0.8} transparent roughness={0.1} />
        </mesh>
        <mesh position={[0.4, 0.08, 0.1]}>
          <cylinderGeometry args={[0.08, 0.1, 0.26, 16]} />
          <meshPhysicalMaterial color="#34d399" transmission={0.7} opacity={0.8} transparent roughness={0.1} />
        </mesh>
        <pointLight ref={glowLightRef} position={[0.2, 0.2, 0.1]} color="#38bdf8" intensity={1} distance={2} />
      </group>

      {/* Ceiling Linear Light */}
      <mesh position={[0, 3.5, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 0.3]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 5, 3]} intensity={0.8} color="#f8fafc" />
    </group>
  );
}

export const HospitalLabScene: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`relative ${className} overflow-hidden pointer-events-none`}>
      <Canvas
        camera={{ position: [0, 0.7, 2.8], fov: 45 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <LabEnvironment />
      </Canvas>
    </div>
  );
};

export default HospitalLabScene;
