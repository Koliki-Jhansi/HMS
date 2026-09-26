import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const HospitalLobbyScene: React.FC<{ interactive?: boolean }> = ({ interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();

  useFrame((state, delta) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      // Extremely slow continuous ambient drift
      const targetRotY = (interactive ? mouse.x * 0.08 : 0) + Math.sin(t * 0.15) * 0.03;
      const targetRotX = (interactive ? -mouse.y * 0.05 : 0) + Math.cos(t * 0.12) * 0.01;
      const targetPosY = Math.sin(t * 0.2) * 0.04;

      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 2, delta);
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 2, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetPosY, 2, delta);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} color="#f0f9ff" />
      <pointLight position={[0, 4, 0]} intensity={1.5} color="#38bdf8" distance={15} />
      <pointLight position={[-4, 2, 2]} intensity={0.8} color="#2dd4bf" distance={10} />
      <pointLight position={[4, 2, 2]} intensity={0.8} color="#818cf8" distance={10} />

      {/* Floor - Polished reflective hospital terrazzo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.7} />
      </mesh>

      {/* Decorative Floor Inlay Rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.99, 0]}>
        <ringGeometry args={[2.8, 3.0, 48]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.99, 0]}>
        <ringGeometry args={[4.2, 4.3, 48]} />
        <meshBasicMaterial color="#0d9488" transparent opacity={0.25} />
      </mesh>

      {/* Back Architectural Wall */}
      <mesh position={[0, 2.5, -6]}>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Wall Paneling & Glowing Medical Cross Logo */}
      <group position={[0, 3.2, -5.9]}>
        {/* Modern Medical Logo Background Badge */}
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[1.2, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <ringGeometry args={[1.15, 1.25, 32]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Glowing Medical Cross */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.3, 1.2, 0.06]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[1.2, 0.3, 0.06]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
      </group>

      {/* Wall Digital Signage Panels */}
      <mesh position={[-4, 3, -5.85]}>
        <boxGeometry args={[2.4, 1.2, 0.1]} />
        <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[4, 3, -5.85]}>
        <boxGeometry args={[2.4, 1.2, 0.1]} />
        <meshStandardMaterial color="#0d9488" emissive="#0f766e" emissiveIntensity={0.6} roughness={0.2} />
      </mesh>

      {/* Ceiling Architectural Canopy & Recessed LED Panels */}
      <mesh position={[0, 6, -1]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 14]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      {[-4, -1.3, 1.3, 4].map((x, i) => (
        <mesh key={`light-${i}`} position={[x, 5.95, -1]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.8, 6]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
      ))}

      {/* Modern Curved Reception Desk */}
      <group position={[0, -0.1, -1.8]}>
        {/* Desk Base */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[2.5, 2.7, 1.1, 32, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Counter Top */}
        <mesh position={[0, 0.58, 0]}>
          <cylinderGeometry args={[2.65, 2.65, 0.08, 32, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.8} />
        </mesh>
        {/* Glowing LED accent ribbon on desk */}
        <mesh position={[0, -0.1, 0.02]}>
          <cylinderGeometry args={[2.52, 2.52, 0.06, 32, 1, false, 0, Math.PI]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Reception computer screens */}
        <mesh position={[-0.8, 0.8, 0.5]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.04]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0.8, 0.8, 0.5]} rotation={[0, -0.2, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.04]} />
          <meshBasicMaterial color="#2dd4bf" />
        </mesh>
      </group>

      {/* Structural Glass / Steel Columns */}
      {[-5, 5].map((colX, i) => (
        <group key={`col-${i}`} position={[colX, 2.5, -2]}>
          <mesh>
            <cylinderGeometry args={[0.35, 0.35, 7, 24]} />
            <meshStandardMaterial color="#475569" roughness={0.2} metalness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.37, 0.37, 0.15, 24]} />
            <meshBasicMaterial color="#0ea5e9" />
          </mesh>
        </group>
      ))}

      {/* Waiting Area Lounge Seating (Left & Right) */}
      {/* Left Lounge */}
      <group position={[-4.5, -0.5, 0.5]} rotation={[0, 0.4, 0]}>
        {/* Sofa Base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.4, 0.4, 0.9]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Sofa Backrest */}
        <mesh position={[0, 0.4, -0.35]}>
          <boxGeometry args={[2.4, 0.5, 0.2]} />
          <meshStandardMaterial color="#0284c7" roughness={0.7} />
        </mesh>
        {/* Coffee Table */}
        <mesh position={[0, -0.1, 0.8]}>
          <cylinderGeometry args={[0.5, 0.5, 0.25, 20]} />
          <meshStandardMaterial color="#334155" roughness={0.1} metalness={0.7} />
        </mesh>
      </group>

      {/* Right Lounge */}
      <group position={[4.5, -0.5, 0.5]} rotation={[0, -0.4, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.4, 0.4, 0.9]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.4, -0.35]}>
          <boxGeometry args={[2.4, 0.5, 0.2]} />
          <meshStandardMaterial color="#0d9488" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.1, 0.8]}>
          <cylinderGeometry args={[0.5, 0.5, 0.25, 20]} />
          <meshStandardMaterial color="#334155" roughness={0.1} metalness={0.7} />
        </mesh>
      </group>

      {/* Modern Indoor Planters (Foreground Left & Right) */}
      <group position={[-2.8, -0.6, 1.2]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.22, 0.6, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        {/* Green Ficus Foliage Spheres */}
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color="#059669" roughness={0.9} />
        </mesh>
        <mesh position={[0.1, 0.6, 0.05]}>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshStandardMaterial color="#10b981" roughness={0.9} />
        </mesh>
      </group>

      <group position={[2.8, -0.6, 1.2]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.22, 0.6, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color="#059669" roughness={0.9} />
        </mesh>
        <mesh position={[-0.1, 0.6, 0.05]}>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshStandardMaterial color="#10b981" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};
