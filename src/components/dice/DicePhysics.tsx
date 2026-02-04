import { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { RapierRigidBody } from '@react-three/rapier';

const tokenVarMap: Record<string, string> = {
  green: '--token-green',
  blue: '--token-blue',
  purple: '--token-purple',
  orange: '--token-orange',
  red: '--token-red',
  yellow: '--token-yellow',
};

const cssVarToCssHsl = (varName: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;
  // Expected format: "210 85% 58%"
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length < 3) return fallback;
  const h = Number.parseFloat(parts[0]);
  const s = Number.parseFloat(parts[1].replace('%', ''));
  const l = Number.parseFloat(parts[2].replace('%', ''));
  if ([h, s, l].some((n) => Number.isNaN(n))) return fallback;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

interface PhysicsDiceProps {
  sides: number;
  color: string;
  shouldRoll: boolean;
  onSettled: (result: number) => void;
}

const PhysicsDice = ({ sides, color, shouldRoll, onSettled }: PhysicsDiceProps) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const hasRolledRef = useRef(false);
  const settleCountRef = useRef(0);
  const hasSettledRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);

  const diceColor = useMemo(() => {
    const tokenVar = tokenVarMap[color] ?? '--primary';
    return cssVarToCssHsl(tokenVar, 'hsl(38, 90%, 55%)');
  }, [color]);

  // Reset refs when shouldRoll changes to true
  useEffect(() => {
    if (shouldRoll && !hasRolledRef.current) {
      hasRolledRef.current = true;
      hasSettledRef.current = false;
      settleCountRef.current = 0;

      // Failsafe: never let the UI get stuck in "Lanzando..."
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = window.setTimeout(() => {
        if (!hasSettledRef.current) {
          hasSettledRef.current = true;
          const result = Math.floor(Math.random() * sides) + 1;
          onSettled(result);
        }
      }, 6500);
      
      // Delay throw slightly to ensure physics is ready
      const timeout = setTimeout(() => {
        if (rigidBodyRef.current) {
          // Position at top
          rigidBodyRef.current.setTranslation({ x: 0, y: 2, z: 0 }, true);
          
          // Random rotation
          const rx = Math.random() * Math.PI;
          const ry = Math.random() * Math.PI;
          const rz = Math.random() * Math.PI;
          const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
          rigidBodyRef.current.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
          
          // Apply velocity
          rigidBodyRef.current.setLinvel({ 
            x: (Math.random() - 0.5) * 3, 
            y: -3, 
            z: (Math.random() - 0.5) * 3 
          }, true);
          
          // Apply spin
          rigidBodyRef.current.setAngvel({ 
            x: (Math.random() - 0.5) * 15, 
            y: (Math.random() - 0.5) * 15, 
            z: (Math.random() - 0.5) * 15 
          }, true);
        }
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [shouldRoll]);

  // Reset when shouldRoll becomes false (ready for next roll)
  useEffect(() => {
    if (!shouldRoll) {
      hasRolledRef.current = false;
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    }
  }, [shouldRoll]);

  useFrame(() => {
    if (!rigidBodyRef.current || !shouldRoll || hasSettledRef.current) return;
    
    const vel = rigidBodyRef.current.linvel();
    const angVel = rigidBodyRef.current.angvel();
    
    const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
    const angSpeed = Math.sqrt(angVel.x ** 2 + angVel.y ** 2 + angVel.z ** 2);
    
    if (speed < 0.1 && angSpeed < 0.1) {
      settleCountRef.current++;
      if (settleCountRef.current > 60) {
        hasSettledRef.current = true;
        if (fallbackTimerRef.current) {
          window.clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        const result = Math.floor(Math.random() * sides) + 1;
        onSettled(result);
      }
    } else {
      settleCountRef.current = 0;
    }
  });

  const getGeometry = () => {
    switch (sides) {
      case 4: return <tetrahedronGeometry args={[0.35, 0]} />;
      case 6: return <boxGeometry args={[0.45, 0.45, 0.45]} />;
      case 8: return <octahedronGeometry args={[0.35, 0]} />;
      case 10: return <dodecahedronGeometry args={[0.32, 0]} />;
      case 12: return <dodecahedronGeometry args={[0.35, 0]} />;
      case 20: return <icosahedronGeometry args={[0.35, 0]} />;
      default: return <boxGeometry args={[0.45, 0.45, 0.45]} />;
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="hull"
      restitution={0.3}
      friction={0.7}
      linearDamping={0.4}
      angularDamping={0.4}
      position={[0, 2, 0]}
    >
      <mesh castShadow>
        {getGeometry()}
        <meshStandardMaterial
          color={diceColor}
          metalness={0.2}
          roughness={0.5}
        />
      </mesh>
    </RigidBody>
  );
};

const DiceTray = () => {
  const feltColor = useMemo(() => cssVarToCssHsl('--board-bg', 'hsl(220, 22%, 5%)'), []);
  const wallColor = useMemo(() => cssVarToCssHsl('--toolbar-bg', 'hsl(220, 18%, 9%)'), []);

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed" position={[0, 0, 0]}>
        <CuboidCollider args={[1.5, 0.1, 1.5]} />
      </RigidBody>
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[3, 0.2, 3]} />
        <meshStandardMaterial color={feltColor} />
      </mesh>

      {/* Walls */}
      <RigidBody type="fixed" position={[0, 0.4, -1.5]}>
        <CuboidCollider args={[1.5, 0.5, 0.1]} />
      </RigidBody>
      <mesh position={[0, 0.4, -1.5]}>
        <boxGeometry args={[3, 1, 0.2]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <RigidBody type="fixed" position={[0, 0.4, 1.5]}>
        <CuboidCollider args={[1.5, 0.5, 0.1]} />
      </RigidBody>
      <mesh position={[0, 0.4, 1.5]}>
        <boxGeometry args={[3, 1, 0.2]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <RigidBody type="fixed" position={[-1.5, 0.4, 0]}>
        <CuboidCollider args={[0.1, 0.5, 1.5]} />
      </RigidBody>
      <mesh position={[-1.5, 0.4, 0]}>
        <boxGeometry args={[0.2, 1, 3]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <RigidBody type="fixed" position={[1.5, 0.4, 0]}>
        <CuboidCollider args={[0.1, 0.5, 1.5]} />
      </RigidBody>
      <mesh position={[1.5, 0.4, 0]}>
        <boxGeometry args={[0.2, 1, 3]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
    </group>
  );
};

interface DicePhysicsSceneProps {
  sides: number;
  color: string;
  isRolling: boolean;
  onRollComplete: (result: number) => void;
}

export const DicePhysicsScene = ({ sides, color, isRolling, onRollComplete }: DicePhysicsSceneProps) => {
  const accentColor = useMemo(() => cssVarToCssHsl('--accent', 'hsl(32, 95%, 48%)'), []);

  return (
    <div className="w-full h-44 rounded-lg overflow-hidden border border-border/50 bg-background">
      <Canvas 
        shadows 
        gl={{ antialias: true, powerPreference: 'default' }}
      >
        <PerspectiveCamera makeDefault position={[0, 4, 3.5]} fov={35} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 5, 2]} intensity={1} castShadow />
        <pointLight position={[-2, 3, -2]} intensity={0.3} color={accentColor} />
        
        <Physics gravity={[0, -12, 0]}>
          <PhysicsDice
            sides={sides}
            color={color}
            shouldRoll={isRolling}
            onSettled={onRollComplete}
          />
          <DiceTray />
        </Physics>
      </Canvas>
    </div>
  );
};
