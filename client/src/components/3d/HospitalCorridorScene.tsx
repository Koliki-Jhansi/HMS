import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const HospitalCorridorScene: React.FC<{ interactive?: boolean }> = ({ interactive = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();

  useFrame((state, delta) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      const targetRotY = (interactive ? mouse.x * 0.06 : 0) + Math.sin(t * 0.1) * 0.02;
      const targetPosZ = (t * 0.2) % 6; // slow continuous smooth corridor progression loop

      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 2, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetPosZ, 1, delta);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[0, 6, 2]} intensity={1.2} color="#f0f9ff" />
      <pointLight position={[0, 3, 0]} intensity={1.5} color="#38bdf8" distance={10} />
      <pointLight position={[0, 3, -6]} intensity={1.5} color="#2dd4bf" distance={10} />

      {/* Floor - Polished Clinical Terrazzo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, -5]}>
        <planeGeometry args={[10, 30]} />
        <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.7} />
      </mesh>

      {/* Floor Wayfinding Track Lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.8, -0.99, -5]}>
        <planeGeometry args={[0.08, 30]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.8, -0.99, -5]}>
        <planeGeometry args={[0.08, 30]} />
        <meshBasicMaterial color="#0d9488" transparent opacity={0.6} />
      </mesh>

      {/* Left Corridor Wall */}
      <mesh position={[-3, 1.5, -5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[30, 5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Right Corridor Wall */}
      <mesh position={[3, 1.5, -5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[30, 5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Ceiling & Linear Recessed LED strips */}
      <mesh position={[0, 4, -5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 30]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      <mesh position={[-0.8, 3.95, -5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 30]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[0.8, 3.95, -5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 30]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>

      {/* Consultation Room Doors (Left & Right along hallway) */}
      {[-12, -6, 0, 6].map((z, idx) => (
        <group key={`door-set-${idx}`}>
          {/* Left Door */}
          <group position={[-2.95, 0.6, z]}>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[1.6, 2.8, 0.05]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
            </mesh>
            {/* Room Number Light Badge */}
            <mesh position={[0.05, 1.2, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.6, 0.25, 0.02]} />
              <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} />
            </mesh>
          </group>

          {/* Right Door */}
          <group position={[2.95, 0.6, z]}>
            <mesh rotation={[0, -Math.PI / 2, 0]}>
              <boxGeometry args={[1.6, 2.8, 0.05]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
            </mesh>
            <mesh position={[-0.05, 1.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <boxGeometry args={[0.6, 0.25, 0.02]} />
              <meshStandardMaterial color="#0d9488" emissive="#0d9488" emissiveIntensity={0.6} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Overhead Directional Signage */}
      <group position={[0, 3.2, -3]}>
        <mesh>
          <boxGeometry args={[3.2, 0.6, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[3.0, 0.45]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
      </group>
    </group>
  );
};
