import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsMobile } from './useIsMobile';

function RoomEnvironment() {
  const isMobile = useIsMobile();
  const groupRef = useRef<THREE.Group>(null);
  const ecgLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.4) * 0.05;
      groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.03;
    }
    if (ecgLightRef.current) {
      ecgLightRef.current.intensity = 0.8 + Math.sin(t * 3.5) * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Back Wall */}
      <mesh position={[0, 1.5, -4]}>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color="#f0fdf4" roughness={0.7} />
      </mesh>

      {/* Decorative Wall Accent Panel */}
      <mesh position={[0, 1.8, -3.95]}>
        <boxGeometry args={[4, 2.5, 0.05]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.5} />
      </mesh>

      {/* Window looking out */}
      <mesh position={[-4, 2, -3.9]}>
        <planeGeometry args={[2.5, 3]} />
        <meshStandardMaterial color="#bae6fd" roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Ceiling Lights */}
      <mesh position={[0, 3.8, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 0.4]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Hospital Bed Base */}
      <group position={[0, -0.4, -1.8]}>
        {/* Mattress frame */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[1.6, 0.3, 3.2]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>
        {/* Mattress */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[1.5, 0.3, 3.1]} />
          <meshStandardMaterial color="#0284c7" roughness={0.6} />
        </mesh>
        {/* Elevated Headrest & Pillow */}
        <mesh position={[0, 0.85, -1]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[1.3, 0.15, 0.8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        {/* Bed Rails */}
        <mesh position={[0.78, 0.65, 0]}>
          <boxGeometry args={[0.04, 0.3, 2.2]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.78, 0.65, 0]}>
          <boxGeometry args={[0.04, 0.3, 2.2]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Vital Signs Patient Monitor on Stand */}
      <group position={[1.6, 0.4, -2.2]}>
        {/* Pole */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 2.2, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Monitor Screen Body */}
        <mesh position={[0, 1.1, 0]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.8, 0.55, 0.12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
        {/* Monitor Display Screen */}
        <mesh position={[-0.03, 1.1, 0.07]} rotation={[0, -0.3, 0]}>
          <planeGeometry args={[0.72, 0.47]} />
          <meshBasicMaterial color="#064e3b" />
        </mesh>
        {/* Glowing ECG Wave Line Graphic */}
        <mesh position={[-0.03, 1.1, 0.08]} rotation={[0, -0.3, 0]}>
          <planeGeometry args={[0.65, 0.1]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <pointLight ref={ecgLightRef} position={[-0.03, 1.1, 0.2]} color="#10b981" intensity={1} distance={2.5} />
      </group>

      {/* IV Drip Pole */}
      <group position={[-1.5, 0.5, -2.4]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2.6, 10]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* IV Bag */}
        <mesh position={[0.15, 1.1, 0]}>
          <boxGeometry args={[0.16, 0.28, 0.06]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.65} roughness={0.1} />
        </mesh>
      </group>

      {/* Lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-2, 3, -1]} intensity={0.4} color="#bae6fd" />
    </group>
  );
}

export const HospitalRoomScene: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`relative ${className} overflow-hidden pointer-events-none`}>
      <Canvas
        camera={{ position: [0, 0.8, 3.2], fov: 45 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <RoomEnvironment />
      </Canvas>
    </div>
  );
};

export default HospitalRoomScene;
