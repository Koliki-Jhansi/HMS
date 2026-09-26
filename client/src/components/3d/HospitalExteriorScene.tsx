import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface HospitalExteriorProps {
  isEntering?: boolean;
  onWalkthroughComplete?: () => void;
}

export const HospitalExteriorScene: React.FC<HospitalExteriorProps> = ({
  isEntering = false,
  onWalkthroughComplete,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftDoorRef = useRef<THREE.Mesh>(null);
  const rightDoorRef = useRef<THREE.Mesh>(null);
  const treesGroupRef = useRef<THREE.Group>(null);

  const { camera, mouse } = useThree();
  const walkthroughProgress = useRef(0);
  const hasCompleted = useRef(false);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Gentle tree sway animation
    if (treesGroupRef.current) {
      treesGroupRef.current.children.forEach((tree, idx) => {
        tree.rotation.z = Math.sin(t * 1.2 + idx * 0.8) * 0.03;
      });
    }

    if (!isEntering) {
      // Continuous slow camera drift and subtle mouse parallax
      const targetCamX = mouse.x * 0.8 + Math.sin(t * 0.2) * 0.4;
      const targetCamY = 2.4 + -mouse.y * 0.4 + Math.cos(t * 0.15) * 0.15;
      const targetCamZ = 16 + Math.sin(t * 0.1) * 0.5;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 1.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 1.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 1.5, delta);
      camera.lookAt(0, 3, 0);

      // Doors closed
      if (leftDoorRef.current && rightDoorRef.current) {
        leftDoorRef.current.position.x = THREE.MathUtils.damp(leftDoorRef.current.position.x, -0.65, 3, delta);
        rightDoorRef.current.position.x = THREE.MathUtils.damp(rightDoorRef.current.position.x, 0.65, 3, delta);
      }
    } else {
      // 4.5s Cinematic Forward Walkthrough
      walkthroughProgress.current = Math.min(1, walkthroughProgress.current + delta * 0.22);
      const p = walkthroughProgress.current;

      // Easing curve
      const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

      // Camera transitions: from z=16 down to z=-1 (inside lobby)
      const curZ = THREE.MathUtils.lerp(16, -1.2, ease);
      const curY = THREE.MathUtils.lerp(2.4, 1.3, ease);
      const curX = THREE.MathUtils.lerp(0, 0, ease);

      camera.position.set(curX, curY, curZ);
      camera.lookAt(0, 1.8, -10);

      // Automatic glass doors slide open when camera is close (p > 0.45)
      if (leftDoorRef.current && rightDoorRef.current) {
        const doorTargetX = p > 0.45 ? 1.8 : 0;
        leftDoorRef.current.position.x = THREE.MathUtils.damp(
          leftDoorRef.current.position.x,
          -0.65 - doorTargetX,
          5,
          delta
        );
        rightDoorRef.current.position.x = THREE.MathUtils.damp(
          rightDoorRef.current.position.x,
          0.65 + doorTargetX,
          5,
          delta
        );
      }

      // Check completion
      if (p >= 0.98 && !hasCompleted.current) {
        hasCompleted.current = true;
        if (onWalkthroughComplete) {
          onWalkthroughComplete();
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Lighting - Twilight / High Tech Clinical Exterior */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={1.5} color="#f8fafc" />
      <pointLight position={[0, 4, 2]} intensity={2.2} color="#38bdf8" distance={18} />
      <pointLight position={[-6, 2, 8]} intensity={1.0} color="#0d9488" distance={12} />
      <pointLight position={[6, 2, 8]} intensity={1.0} color="#0284c7" distance={12} />

      {/* Ground Lawn & Walkway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#090d16" roughness={0.9} />
      </mesh>

      {/* Landscaped Green Grass Lawns */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7, -0.03, 7]}>
        <planeGeometry args={[10, 20]} />
        <meshStandardMaterial color="#064e3b" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7, -0.03, 7]}>
        <planeGeometry args={[10, 20]} />
        <meshStandardMaterial color="#064e3b" roughness={0.85} />
      </mesh>

      {/* Main Illuminated Paved Entrance Walkway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 7]}>
        <planeGeometry args={[4, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Walkway LED Inground Guide Markers */}
      {[-8, -5, -2, 1, 4, 7, 10, 13].map((z, i) => (
        <group key={`marker-${i}`}>
          <mesh position={[-1.9, 0.02, z]}>
            <boxGeometry args={[0.08, 0.04, 0.6]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh position={[1.9, 0.02, z]}>
            <boxGeometry args={[0.08, 0.04, 0.6]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}

      {/* ========================================================
          HOSPITAL MAIN ARCHITECTURAL COMPLEX
         ======================================================== */}
      {/* Central Tower Building */}
      <mesh position={[0, 7.5, -4]}>
        <boxGeometry args={[16, 15, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Left Medical Wing */}
      <mesh position={[-11, 6, -3]}>
        <boxGeometry args={[8, 12, 9]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Right Specialty Wing */}
      <mesh position={[11, 6, -3]}>
        <boxGeometry args={[8, 12, 9]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Curtain Wall Glass Window Bands on Central Tower */}
      {Array.from({ length: 5 }).map((_, row) => (
        <group key={`win-row-${row}`} position={[0, 4 + row * 2.2, 1.02]}>
          <mesh position={[0, 0, -4.95]}>
            <boxGeometry args={[14.5, 1.4, 0.1]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#0369a1"
              emissiveIntensity={row % 2 === 0 ? 0.45 : 0.25}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
        </group>
      ))}

      {/* Left & Right Wing Window Grids */}
      {Array.from({ length: 4 }).map((_, row) => (
        <group key={`left-win-${row}`}>
          <mesh position={[-11, 3.5 + row * 2.2, 1.55]}>
            <boxGeometry args={[6.8, 1.3, 0.1]} />
            <meshStandardMaterial color="#0d9488" emissive="#0f766e" emissiveIntensity={0.35} roughness={0.2} />
          </mesh>
          <mesh position={[11, 3.5 + row * 2.2, 1.55]}>
            <boxGeometry args={[6.8, 1.3, 0.1]} />
            <meshStandardMaterial color="#0369a1" emissive="#0284c7" emissiveIntensity={0.35} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Grand Entrance Canopy (Overhead structure) */}
      <group position={[0, 3.2, 0.8]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[6.5, 0.35, 3.5]} />
          <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Glowing Trim on Canopy */}
        <mesh position={[0, -0.15, 1.72]}>
          <boxGeometry args={[6.4, 0.08, 0.08]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Support Steel Beams */}
        <mesh position={[-2.9, -1.6, 1.5]}>
          <cylinderGeometry args={[0.1, 0.1, 3.2, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[2.9, -1.6, 1.5]}>
          <cylinderGeometry args={[0.1, 0.1, 3.2, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Hospital Neon / LED Signage on Entrance Header */}
      <group position={[0, 4.4, 1.1]}>
        {/* Glowing Emblem Badge */}
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[0.7, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <ringGeometry args={[0.68, 0.74, 32]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Glowing Medical Cross */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.2, 0.8, 0.05]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.8, 0.2, 0.05]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
      </group>

      {/* Entrance Glass Portal Frame */}
      <mesh position={[0, 1.5, 0.95]}>
        <boxGeometry args={[3.4, 3.0, 0.1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Interior Lobby Peeking through entrance glass */}
      <mesh position={[0, 1.5, -0.5]}>
        <planeGeometry args={[5, 3]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
      <pointLight position={[0, 2, -1]} intensity={2.5} color="#e0f2fe" distance={6} />

      {/* Automatic Sliding Glass Doors */}
      <mesh ref={leftDoorRef} position={[-0.65, 1.4, 1.0]}>
        <boxGeometry args={[1.2, 2.7, 0.05]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.65} roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh ref={rightDoorRef} position={[0.65, 1.4, 1.0]}>
        <boxGeometry args={[1.2, 2.7, 0.05]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.65} roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Architectural Streetlamps & Trees */}
      <group ref={treesGroupRef}>
        {/* Left Side Trees */}
        {[-3, 2, 7, 12].map((z, idx) => (
          <group key={`tree-left-${idx}`} position={[-5.5, 0, z]}>
            {/* Trunk */}
            <mesh position={[0, 1.0, 0]}>
              <cylinderGeometry args={[0.12, 0.16, 2, 8]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
            {/* Procedural Foliage Canopies */}
            <mesh position={[0, 2.4, 0]}>
              <sphereGeometry args={[1.1, 10, 10]} />
              <meshStandardMaterial color="#065f46" roughness={0.8} />
            </mesh>
            <mesh position={[0.2, 3.1, 0.1]}>
              <sphereGeometry args={[0.8, 10, 10]} />
              <meshStandardMaterial color="#047857" roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Right Side Trees */}
        {[-3, 2, 7, 12].map((z, idx) => (
          <group key={`tree-right-${idx}`} position={[5.5, 0, z]}>
            <mesh position={[0, 1.0, 0]}>
              <cylinderGeometry args={[0.12, 0.16, 2, 8]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.4, 0]}>
              <sphereGeometry args={[1.1, 10, 10]} />
              <meshStandardMaterial color="#065f46" roughness={0.8} />
            </mesh>
            <mesh position={[-0.2, 3.1, 0.1]}>
              <sphereGeometry args={[0.8, 10, 10]} />
              <meshStandardMaterial color="#047857" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Subtle Ambient Sky Backdrop / Atmosphere */}
      <mesh position={[0, 12, -25]}>
        <planeGeometry args={[100, 50]} />
        <meshBasicMaterial color="#030712" />
      </mesh>
    </group>
  );
};
