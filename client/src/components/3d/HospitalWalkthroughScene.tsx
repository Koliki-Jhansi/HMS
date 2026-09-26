import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsMobile } from './useIsMobile';

export type WalkthroughPhase = 'EXTERIOR_IDLE' | 'WALKING_IN' | 'LOBBY_IDLE';
export type UserHospitalRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

interface HospitalWalkthroughSceneProps {
  phase: WalkthroughPhase;
  targetRole?: UserHospitalRole;
  onArrivedAtLobby?: () => void;
}

export const HospitalWalkthroughScene: React.FC<HospitalWalkthroughSceneProps> = ({
  phase,
  targetRole = 'PATIENT',
  onArrivedAtLobby,
}) => {
  const isMobile = useIsMobile();
  const { camera, mouse } = useThree();

  // Animation Progress tracker (0 to 1)
  const progressRef = useRef(phase === 'LOBBY_IDLE' ? 1 : 0);
  const leftDoorRef = useRef<THREE.Mesh>(null);
  const rightDoorRef = useRef<THREE.Mesh>(null);
  const adminLeftDoorRef = useRef<THREE.Mesh>(null);
  const adminRightDoorRef = useRef<THREE.Mesh>(null);
  const treesRef = useRef<THREE.Group>(null);
  const patientPlantsRef = useRef<THREE.Group>(null);
  const clinicalMonitorsRef = useRef<THREE.Group>(null);
  const operationsScreensRef = useRef<THREE.Group>(null);
  const lobbyLightsRef = useRef<THREE.PointLight>(null);
  const hasTriggeredArrival = useRef(phase === 'LOBBY_IDLE');

  // Define target end-positions based on authenticated role
  const roleWaypoints = useMemo(() => {
    switch (targetRole) {
      case 'DOCTOR':
        return {
          endPos: new THREE.Vector3(3.8, 1.55, -7.5),
          endLook: new THREE.Vector3(5.8, 1.45, -11.0),
        };
      case 'ADMIN':
        return {
          endPos: new THREE.Vector3(0.0, 1.6, -9.6),
          endLook: new THREE.Vector3(0.0, 1.5, -15.0),
        };
      case 'PATIENT':
      default:
        return {
          endPos: new THREE.Vector3(-3.8, 1.55, -7.5),
          endLook: new THREE.Vector3(-5.8, 1.45, -11.0),
        };
    }
  }, [targetRole]);

  // Initialize camera position based on initial phase
  useMemo(() => {
    if (phase === 'LOBBY_IDLE') {
      progressRef.current = 1;
      camera.position.copy(roleWaypoints.endPos);
      camera.lookAt(roleWaypoints.endLook);
    } else {
      progressRef.current = 0;
      camera.position.set(0, 2.2, 18.0);
      camera.lookAt(0, 2.2, 0.0);
    }
  }, [phase, roleWaypoints]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Exterior Trees Natural Sway
    if (treesRef.current) {
      treesRef.current.children.forEach((tree, idx) => {
        tree.rotation.z = Math.sin(time * 1.5 + idx * 0.9) * 0.035;
      });
    }

    // 2. Patient Wing Plants Gentle Breeze
    if (patientPlantsRef.current) {
      patientPlantsRef.current.children.forEach((plant, idx) => {
        plant.rotation.y = Math.sin(time * 0.8 + idx * 1.2) * 0.05;
        plant.rotation.z = Math.sin(time * 1.1 + idx * 0.7) * 0.025;
      });
    }

    // 3. Clinical Wing Monitors Diagnostic Glow Pulse
    if (clinicalMonitorsRef.current) {
      clinicalMonitorsRef.current.children.forEach((m, idx) => {
        const mesh = m as THREE.Mesh;
        if (mesh.material && 'emissiveIntensity' in mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
            0.6 + Math.sin(time * 3.5 + idx * 1.5) * 0.35;
        }
      });
    }

    // 4. Operations Command Center Status Wall Pulse
    if (operationsScreensRef.current) {
      operationsScreensRef.current.children.forEach((s, idx) => {
        const mesh = s as THREE.Mesh;
        if (mesh.material && 'opacity' in mesh.material) {
          (mesh.material as THREE.MeshBasicMaterial).opacity =
            0.85 + Math.sin(time * 2.0 + idx * 0.8) * 0.15;
        }
      });
    }

    // 5. Lobby Ambient Accent Pulse
    if (lobbyLightsRef.current) {
      lobbyLightsRef.current.intensity = 1.6 + Math.sin(time * 1.8) * 0.3;
    }

    if (phase === 'EXTERIOR_IDLE') {
      // Slow continuous environmental camera drift & subtle mouse parallax
      const targetX = mouse.x * 0.7 + Math.sin(time * 0.25) * 0.4;
      const targetY = 2.2 - mouse.y * 0.35 + Math.cos(time * 0.2) * 0.15;
      const targetZ = 18.0 + Math.sin(time * 0.15) * 0.4;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2.0, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 2.0, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.0, delta);
      camera.lookAt(0, 2.3, 0);

      // Doors closed at exterior idle
      if (leftDoorRef.current && rightDoorRef.current) {
        leftDoorRef.current.position.x = THREE.MathUtils.damp(leftDoorRef.current.position.x, -0.75, 4.0, delta);
        rightDoorRef.current.position.x = THREE.MathUtils.damp(rightDoorRef.current.position.x, 0.75, 4.0, delta);
      }
    } else if (phase === 'WALKING_IN') {
      // 4.6s Smooth Continuous Cinematic Camera Journey into Role Wing
      progressRef.current = Math.min(1, progressRef.current + delta * 0.217);
      const p = progressRef.current;

      // Smooth Cubic Ease In-Out
      const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

      // Stage 1: Exterior Walkway (p: 0 -> 0.45, z: 18 -> 3.0)
      // Stage 2: Passing Automatic Doors (p: 0.45 -> 0.65, z: 3.0 -> -1.0)
      // Stage 3: Branching to Role Wing (p: 0.65 -> 1.0, z: -1.0 -> role destination)
      let curX = 0;
      let curY = THREE.MathUtils.lerp(2.2, roleWaypoints.endPos.y, ease);
      let curZ = 18.0;
      let lookX = 0;
      let lookY = THREE.MathUtils.lerp(2.3, roleWaypoints.endLook.y, ease);
      let lookZ = THREE.MathUtils.lerp(0.0, roleWaypoints.endLook.z, ease);

      if (p < 0.6) {
        // Linear forward approach through walkway & doors
        const normP = p / 0.6;
        curZ = THREE.MathUtils.lerp(18.0, 0.0, normP);
        curX = Math.sin(p * Math.PI * 4) * 0.04;
        lookX = 0;
        lookZ = THREE.MathUtils.lerp(0.0, -8.0, normP);
      } else {
        // Entering Lobby & seamlessly steering into the specific role wing
        const wingP = (p - 0.6) / 0.4;
        const wingEase = wingP < 0.5 ? 2 * wingP * wingP : -1 + (4 - 2 * wingP) * wingP;

        curZ = THREE.MathUtils.lerp(0.0, roleWaypoints.endPos.z, wingEase);
        curX = THREE.MathUtils.lerp(0.0, roleWaypoints.endPos.x, wingEase);
        lookX = THREE.MathUtils.lerp(0.0, roleWaypoints.endLook.x, wingEase);
        lookZ = THREE.MathUtils.lerp(-8.0, roleWaypoints.endLook.z, wingEase);
      }

      camera.position.set(curX, curY, curZ);
      camera.lookAt(lookX, lookY, lookZ);

      // Outer Main Glass Doors open at p > 0.42 (camera approaches portal)
      if (leftDoorRef.current && rightDoorRef.current) {
        const doorOpenAmount = p > 0.42 ? 1.6 : 0;
        leftDoorRef.current.position.x = THREE.MathUtils.damp(
          leftDoorRef.current.position.x,
          -0.75 - doorOpenAmount,
          4.5,
          delta
        );
        rightDoorRef.current.position.x = THREE.MathUtils.damp(
          rightDoorRef.current.position.x,
          0.75 + doorOpenAmount,
          4.5,
          delta
        );
      }

      // Admin Center Partition Doors open if user is ADMIN entering operations
      if (adminLeftDoorRef.current && adminRightDoorRef.current) {
        const adminDoorOpen = targetRole === 'ADMIN' && p > 0.72 ? 1.4 : 0;
        adminLeftDoorRef.current.position.x = THREE.MathUtils.damp(
          adminLeftDoorRef.current.position.x,
          -0.85 - adminDoorOpen,
          4.5,
          delta
        );
        adminRightDoorRef.current.position.x = THREE.MathUtils.damp(
          adminRightDoorRef.current.position.x,
          0.85 + adminDoorOpen,
          4.5,
          delta
        );
      }

      // Arrival callback
      if (p >= 0.99 && !hasTriggeredArrival.current) {
        hasTriggeredArrival.current = true;
        if (onArrivedAtLobby) {
          onArrivedAtLobby();
        }
      }
    } else if (phase === 'LOBBY_IDLE') {
      // Role-Specific Atmospheric Idle Behavior
      let targetX = roleWaypoints.endPos.x;
      let targetY = roleWaypoints.endPos.y;
      let targetZ = roleWaypoints.endPos.z;

      if (targetRole === 'PATIENT') {
        // Patient: Calm horizontal breathing drift & natural light parallax
        targetX += mouse.x * 0.35 + Math.sin(time * 0.18) * 0.3;
        targetY += -mouse.y * 0.15 + Math.cos(time * 0.22) * 0.08;
        targetZ += Math.sin(time * 0.14) * 0.15;
      } else if (targetRole === 'DOCTOR') {
        // Doctor: Subtle forward depth drift & clinical perspective
        targetX += mouse.x * 0.4 + Math.sin(time * 0.24) * 0.2;
        targetY += -mouse.y * 0.2 + Math.cos(time * 0.28) * 0.06;
        targetZ += Math.sin(time * 0.2) * 0.25;
      } else {
        // Admin: Slow commanding orbit drift around operations center
        targetX += mouse.x * 0.5 + Math.sin(time * 0.2) * 0.35;
        targetY += -mouse.y * 0.25 + Math.cos(time * 0.2) * 0.1;
        targetZ += Math.cos(time * 0.15) * 0.3;
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2.0, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 2.0, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.0, delta);
      camera.lookAt(roleWaypoints.endLook);

      // Keep doors in their proper open state
      if (leftDoorRef.current && rightDoorRef.current) {
        leftDoorRef.current.position.x = THREE.MathUtils.damp(leftDoorRef.current.position.x, -2.35, 4.0, delta);
        rightDoorRef.current.position.x = THREE.MathUtils.damp(rightDoorRef.current.position.x, 2.35, 4.0, delta);
      }
      if (adminLeftDoorRef.current && adminRightDoorRef.current && targetRole === 'ADMIN') {
        adminLeftDoorRef.current.position.x = THREE.MathUtils.damp(adminLeftDoorRef.current.position.x, -2.25, 4.0, delta);
        adminRightDoorRef.current.position.x = THREE.MathUtils.damp(adminRightDoorRef.current.position.x, 2.25, 4.0, delta);
      }
    }
  });

  return (
    <group>
      {/* =========================================================================
          GLOBAL LIGHTING & ATMOSPHERE
         ========================================================================= */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[12, 18, 14]} intensity={1.4} color="#f8fafc" />
      <pointLight position={[0, 4.5, 2.5]} intensity={2.0} color="#38bdf8" distance={16} />
      <pointLight ref={lobbyLightsRef} position={[0, 3.2, -5.5]} intensity={2.2} color="#e0f2fe" distance={15} />

      {/* Role-Specific Mood Ambient Accent Lights */}
      {/* Patient Healing Wing Soft Teal/Amber Sunlight (Left) */}
      <pointLight position={[-6.0, 3.0, -8.0]} intensity={1.8} color="#2dd4bf" distance={12} />
      <pointLight position={[-8.5, 2.5, -6.0]} intensity={1.5} color="#fde68a" distance={10} />

      {/* Doctor Clinical Wing Crisp Cyan/Blue Light (Right) */}
      <pointLight position={[6.0, 3.0, -8.0]} intensity={2.0} color="#06b6d4" distance={12} />
      <pointLight position={[8.0, 2.8, -10.0]} intensity={1.6} color="#38bdf8" distance={10} />

      {/* Admin Operations Command Center Deep Navy/Blue Accent (Center Back) */}
      <pointLight position={[0, 3.5, -12.0]} intensity={2.5} color="#0284c7" distance={14} />
      <pointLight position={[0, 2.0, -14.5]} intensity={2.0} color="#38bdf8" distance={10} />

      {/* =========================================================================
          EXTERIOR GROUNDS, LAWN, WALKWAY & FOREGROUND ARCHITECTURE
         ========================================================================= */}
      {/* Ground Sub-base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 5]}>
        <planeGeometry args={[60, 50]} />
        <meshStandardMaterial color="#090d16" roughness={0.9} />
      </mesh>

      {/* Landscaped Green Grass Lawns flanking walkway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7.5, -0.02, 10]}>
        <planeGeometry args={[11, 24]} />
        <meshStandardMaterial color="#064e3b" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.5, -0.02, 10]}>
        <planeGeometry args={[11, 24]} />
        <meshStandardMaterial color="#064e3b" roughness={0.85} />
      </mesh>

      {/* Main Illuminated Paved Entrance Walkway (Z = 18 down to Z = 1) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 9.5]}>
        <planeGeometry args={[4.2, 21]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.4} />
      </mesh>

      {/* Walkway Ground Marker LEDs */}
      {[16, 13, 10, 7, 4, 1.5].map((zPos, i) => (
        <group key={`bollard-${i}`}>
          <mesh position={[-2.0, 0.03, zPos]}>
            <boxGeometry args={[0.08, 0.06, 0.7]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh position={[2.0, 0.03, zPos]}>
            <boxGeometry args={[0.08, 0.06, 0.7]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <pointLight position={[-2.0, 0.2, zPos]} color="#38bdf8" intensity={0.4} distance={3} />
          <pointLight position={[2.0, 0.2, zPos]} color="#38bdf8" intensity={0.4} distance={3} />
        </group>
      ))}

      {/* Trees along the exterior walkway with sway animation */}
      <group ref={treesRef}>
        {[16, 11, 6].map((zPos, idx) => (
          <group key={`tree-l-${idx}`} position={[-4.5, 0, zPos]}>
            <mesh position={[0, 1.0, 0]}>
              <cylinderGeometry args={[0.12, 0.16, 2.0, 8]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
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

        {[16, 11, 6].map((zPos, idx) => (
          <group key={`tree-r-${idx}`} position={[4.5, 0, zPos]}>
            <mesh position={[0, 1.0, 0]}>
              <cylinderGeometry args={[0.12, 0.16, 2.0, 8]} />
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

      {/* Walkway Framing Columns / Portico Pillars */}
      <group position={[-2.8, 1.8, 4.0]}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 3.6, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      <group position={[2.8, 1.8, 4.0]}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 3.6, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* =========================================================================
          HOSPITAL FACADE & CANOPY (Z = 0 to 2)
         ========================================================================= */}
      {/* Central Exterior Building Tower */}
      <mesh position={[0, 8.5, 0.0]}>
        <boxGeometry args={[18, 14, 2.0]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Left Wing Facade (Patient Wing) */}
      <mesh position={[-12, 7.0, 0.5]}>
        <boxGeometry args={[8, 11, 2.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Right Wing Facade (Clinical Wing) */}
      <mesh position={[12, 7.0, 0.5]}>
        <boxGeometry args={[8, 11, 2.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Illuminated Glass Windows Bands on Facade */}
      {[4.5, 7.0, 9.5, 12.0].map((yPos, row) => (
        <mesh key={`facade-win-${row}`} position={[0, yPos, 1.05]}>
          <boxGeometry args={[15, 1.2, 0.05]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0369a1"
            emissiveIntensity={row % 2 === 0 ? 0.45 : 0.25}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      ))}

      {/* Entrance Overhead Canopy */}
      <group position={[0, 3.4, 2.2]}>
        <mesh>
          <boxGeometry args={[6.8, 0.35, 4.2]} />
          <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.15, 2.08]}>
          <boxGeometry args={[6.7, 0.08, 0.08]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* Hospital Medical Cross Header Signage */}
      <group position={[0, 4.6, 1.1]}>
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[0.75, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <ringGeometry args={[0.72, 0.78, 32]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.22, 0.85, 0.05]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.85, 0.22, 0.05]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
      </group>

      {/* =========================================================================
          ENTRANCE PORTAL & PHYSICAL AUTOMATIC SLIDING GLASS DOORS (Z = 0.5)
         ========================================================================= */}
      <mesh position={[0, 1.6, 0.5]}>
        <boxGeometry args={[3.8, 3.2, 0.15]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.9} />
      </mesh>

      <mesh position={[-2.4, 1.6, 0.5]}>
        <boxGeometry args={[1.5, 3.2, 0.2]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[2.4, 1.6, 0.5]}>
        <boxGeometry args={[1.5, 3.2, 0.2]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* LEFT AUTOMATIC SLIDING GLASS DOOR */}
      <mesh ref={leftDoorRef} position={[-0.75, 1.5, 0.55]}>
        <boxGeometry args={[1.4, 2.9, 0.06]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          transmission={0.85}
          opacity={0.8}
          transparent
          roughness={0.08}
          metalness={0.9}
          reflectivity={0.9}
        />
      </mesh>

      {/* RIGHT AUTOMATIC SLIDING GLASS DOOR */}
      <mesh ref={rightDoorRef} position={[0.75, 1.5, 0.55]}>
        <boxGeometry args={[1.4, 2.9, 0.06]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          transmission={0.85}
          opacity={0.8}
          transparent
          roughness={0.08}
          metalness={0.9}
          reflectivity={0.9}
        />
      </mesh>

      {/* =========================================================================
          CENTRAL HOSPITAL LOBBY (Z = 0.0 to -8.0)
         ========================================================================= */}
      {/* Central Lobby Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, -5.5]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.2} />
      </mesh>

      {/* Main Lobby Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.8, -8.0]}>
        <planeGeometry args={[26, 18]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>

      {/* Ceiling LED Strips */}
      {[-2, -5, -8, -12].map((zPos, idx) => (
        <group key={`ceil-led-${idx}`} position={[0, 3.78, zPos]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[16, 0.35]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Central Reception Desk */}
      <group position={[0, 0, -5.5]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[4.2, 1.1, 1.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[4.4, 0.08, 1.2]} />
          <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.55, 0.56]}>
          <boxGeometry args={[3.8, 0.12, 0.04]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Reception Sign / Emblem */}
        <mesh position={[0, 0.55, 0.58]}>
          <circleGeometry args={[0.28, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.55, 0.6]}>
          <boxGeometry args={[0.07, 0.32, 0.02]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
        <mesh position={[0, 0.55, 0.6]}>
          <boxGeometry args={[0.32, 0.07, 0.02]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>

        {/* Central Wayfinding Directional Sign */}
        <group position={[0, 2.5, 0.2]}>
          <mesh>
            <boxGeometry args={[3.6, 0.45, 0.1]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[-1.1, 0, 0.06]}>
            <boxGeometry args={[0.9, 0.22, 0.02]} />
            <meshBasicMaterial color="#2dd4bf" />
          </mesh>
          <mesh position={[1.1, 0, 0.06]}>
            <boxGeometry args={[0.9, 0.22, 0.02]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.9, 0.22, 0.02]} />
            <meshBasicMaterial color="#60a5fa" />
          </mesh>
        </group>
      </group>

      {/* =========================================================================
          WING 1: PATIENT CARE & HEALING WING (LEFT: X = -3 to -11, Z = -3 to -14)
         ========================================================================= */}
      {/* Patient Floor - Warm Beechwood/Beige Finish */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7.0, 0.0, -8.5]}>
        <planeGeometry args={[8.5, 14]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>

      {/* Patient Wing Daylight Windows Wall */}
      <mesh position={[-11.2, 1.9, -8.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[14, 3.8]} />
        <meshStandardMaterial color="#93c5fd" emissive="#38bdf8" emissiveIntensity={0.2} roughness={0.1} transparent opacity={0.6} />
      </mesh>

      {/* Patient Wing Header Signboard */}
      <group position={[-6.2, 2.8, -7.5]}>
        <mesh>
          <boxGeometry args={[4.2, 0.6, 0.1]} />
          <meshStandardMaterial color="#042f2e" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.22, 0.06]}>
          <boxGeometry args={[4.0, 0.05, 0.02]} />
          <meshBasicMaterial color="#2dd4bf" />
        </mesh>
      </group>

      {/* Consultation Room Doors (Patient Wing) */}
      {[-5.0, -8.5, -12.0].map((zPos, idx) => (
        <group key={`pat-door-${idx}`} position={[-6.8, 1.4, zPos]}>
          <mesh position={[-1.2, 0, 0]}>
            <boxGeometry args={[0.08, 2.6, 1.4]} />
            <meshStandardMaterial color="#0f766e" roughness={0.4} />
          </mesh>
          <mesh position={[-1.15, 0.8, 0]}>
            <boxGeometry args={[0.04, 0.25, 0.6]} />
            <meshBasicMaterial color="#5eead4" />
          </mesh>
        </group>
      ))}

      {/* Patient Lounge Seating & Warm Planters */}
      <group position={[-5.2, 0.35, -7.0]} rotation={[0, 0.2, 0]}>
        <mesh>
          <boxGeometry args={[2.2, 0.4, 0.9]} />
          <meshStandardMaterial color="#0f766e" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.35, -0.38]}>
          <boxGeometry args={[2.2, 0.45, 0.18]} />
          <meshStandardMaterial color="#14b8a6" roughness={0.6} />
        </mesh>
      </group>

      {/* Patient Greenery Group with Sway */}
      <group ref={patientPlantsRef}>
        {[-4.5, -7.2, -9.8].map((zPos, idx) => (
          <group key={`pat-plant-${idx}`} position={[-8.5, 0, zPos]}>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.3, 0.22, 0.8, 16]} />
              <meshStandardMaterial color="#042f2e" roughness={0.6} />
            </mesh>
            <mesh position={[0, 1.2, 0]}>
              <sphereGeometry args={[0.65, 12, 12]} />
              <meshStandardMaterial color="#059669" roughness={0.7} />
            </mesh>
            <mesh position={[0.15, 1.7, 0]}>
              <sphereGeometry args={[0.45, 10, 10]} />
              <meshStandardMaterial color="#10b981" roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>

      {/* =========================================================================
          WING 2: CLINICAL WING & DOCTORS STATION (RIGHT: X = 3 to 11, Z = -3 to -14)
         ========================================================================= */}
      {/* Doctor Floor - High-tech Polished Tile with Cyan Guide Lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.0, 0.0, -8.5]}>
        <planeGeometry args={[8.5, 14]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.4} />
      </mesh>
      {/* Cyan Guide Strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.2, 0.01, -8.5]}>
        <planeGeometry args={[0.15, 14]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* Clinical Wing Header Signboard */}
      <group position={[6.2, 2.8, -7.5]}>
        <mesh>
          <boxGeometry args={[4.2, 0.6, 0.1]} />
          <meshStandardMaterial color="#082f49" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.22, 0.06]}>
          <boxGeometry args={[4.0, 0.05, 0.02]} />
          <meshBasicMaterial color="#0ea5e9" />
        </mesh>
      </group>

      {/* Doctor Clinical Consultation Suites */}
      {[-5.0, -8.5, -12.0].map((zPos, idx) => (
        <group key={`doc-suite-${idx}`} position={[6.8, 1.4, zPos]}>
          <mesh position={[1.2, 0, 0]}>
            <boxGeometry args={[0.08, 2.6, 1.4]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Digital Room Number Sign */}
          <mesh position={[1.15, 0.8, 0]}>
            <boxGeometry args={[0.04, 0.25, 0.6]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}

      {/* Doctor Clinical Station & Workstation Displays */}
      <group position={[5.4, 0, -7.2]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[2.4, 1.1, 1.0]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[2.5, 0.08, 1.1]} />
          <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.8} />
        </mesh>

        {/* Clinical Diagnostics Monitors */}
        <group ref={clinicalMonitorsRef}>
          {[-0.6, 0.6].map((xOffset, i) => (
            <mesh key={`diag-mon-${i}`} position={[xOffset, 1.5, 0]}>
              <boxGeometry args={[0.7, 0.45, 0.05]} />
              <meshStandardMaterial color="#0369a1" emissive="#0284c7" emissiveIntensity={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </group>

      {/* =========================================================================
          WING 3: HOSPITAL OPERATIONS CENTER (ADMIN: CENTER BACK: Z = -8 to -16)
         ========================================================================= */}
      {/* Admin Operations Center Glass Partition Portal (Z = -8.2) */}
      <mesh position={[0, 1.9, -8.2]}>
        <boxGeometry args={[5.2, 3.8, 0.1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Admin Sliding Glass Doors */}
      <mesh ref={adminLeftDoorRef} position={[-0.85, 1.5, -8.15]}>
        <boxGeometry args={[1.5, 2.9, 0.05]} />
        <meshPhysicalMaterial
          color="#60a5fa"
          transmission={0.85}
          opacity={0.8}
          transparent
          roughness={0.08}
          metalness={0.8}
        />
      </mesh>
      <mesh ref={adminRightDoorRef} position={[0.85, 1.5, -8.15]}>
        <boxGeometry args={[1.5, 2.9, 0.05]} />
        <meshPhysicalMaterial
          color="#60a5fa"
          transmission={0.85}
          opacity={0.8}
          transparent
          roughness={0.08}
          metalness={0.8}
        />
      </mesh>

      {/* Operations Room Floor (Z = -8.2 to -16) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, -12.5]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Operations Header Signboard */}
      <group position={[0, 3.2, -8.4]}>
        <mesh>
          <boxGeometry args={[4.6, 0.5, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.2, 0.05]}>
          <boxGeometry args={[4.4, 0.04, 0.02]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* Back Operations Command Video Wall (Z = -15.8) */}
      <group position={[0, 2.2, -15.8]}>
        <mesh>
          <boxGeometry args={[7.2, 3.2, 0.1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} />
        </mesh>

        {/* Video Wall Multi-Screen Panels */}
        <group ref={operationsScreensRef}>
          {[-2.2, 0, 2.2].map((xPos, col) =>
            [0.6, -0.6].map((yPos, row) => (
              <mesh key={`ops-screen-${col}-${row}`} position={[xPos, yPos, 0.06]}>
                <planeGeometry args={[1.9, 1.0]} />
                <meshBasicMaterial color={col === 1 ? '#0284c7' : '#0369a1'} transparent opacity={0.9} />
              </mesh>
            ))
          )}
        </group>
      </group>

      {/* Operations Command Workstation Desk */}
      <group position={[0, 0, -12.2]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[4.0, 1.1, 1.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[4.2, 0.08, 1.3]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.55, 0.62]}>
          <boxGeometry args={[3.8, 0.08, 0.02]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>
    </group>
  );
};

export default HospitalWalkthroughScene;
