import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsMobile } from './useIsMobile';

function PharmacyEnvironment() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.25) * 0.04;
      groupRef.current.rotation.y = Math.sin(t * 0.18) * 0.025;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Background Pharmacy Shelving Wall */}
      <mesh position={[0, 1.5, -4]}>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>

      {/* Shelving Unit */}
      <group position={[0, 1.2, -3.8]}>
        {/* Shelf Board 1 */}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[8, 0.08, 0.4]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.2} roughness={0.3} />
        </mesh>
        {/* Shelf Board 2 */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[8, 0.08, 0.4]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.2} roughness={0.3} />
        </mesh>
        {/* Shelf Board 3 */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[8, 0.08, 0.4]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.2} roughness={0.3} />
        </mesh>

        {/* Organized Medicine Boxes on Shelves (procedural rows) */}
        {[-3, -2, -1, 0, 1, 2, 3].map((x, i) => (
          <React.Fragment key={i}>
            <mesh position={[x + 0.2, 1.4, 0.05]}>
              <boxGeometry args={[0.35, 0.28, 0.2]} />
              <meshStandardMaterial color={i % 3 === 0 ? '#0284c7' : i % 3 === 1 ? '#059669' : '#ffffff'} />
            </mesh>
            <mesh position={[x - 0.2, 0.6, 0.05]}>
              <boxGeometry args={[0.4, 0.3, 0.2]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#ffffff' : '#0284c7'} />
            </mesh>
            <mesh position={[x, -0.2, 0.05]}>
              <boxGeometry args={[0.45, 0.32, 0.2]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#38bdf8' : '#f1f5f9'} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* Pharmacy Dispense Counter */}
      <mesh position={[0, -0.5, -1.8]}>
        <boxGeometry args={[6.5, 0.8, 1.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />
      </mesh>
      {/* Cyan Trim strip on counter */}
      <mesh position={[0, -0.15, -1.04]}>
        <boxGeometry args={[6.5, 0.05, 0.05]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 3]} intensity={0.8} color="#ffffff" />
      <pointLight position={[0, 2, -1]} intensity={0.5} color="#38bdf8" />
    </group>
  );
}

export const HospitalPharmacyScene: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`relative ${className} overflow-hidden pointer-events-none`}>
      <Canvas
        camera={{ position: [0, 0.8, 3.2], fov: 45 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <PharmacyEnvironment />
      </Canvas>
    </div>
  );
};

export default HospitalPharmacyScene;
