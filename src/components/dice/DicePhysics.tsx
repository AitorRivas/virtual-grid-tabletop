import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { Environment, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { RapierRigidBody } from '@react-three/rapier';

interface DiceProps {
  sides: number;
  color: string;
  onRollComplete: (result: number) => void;
  rollTrigger: number;
}

const colorMap: Record<string, string> = {
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  orange: '#f97316',
  red: '#ef4444',
  yellow: '#eab308',
};

const PhysicsDice = ({ sides, color, onRollComplete, rollTrigger }: DiceProps) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hasSettled, setHasSettled] = useState(false);
  const [showResult, setShowResult] = useState<number | null>(null);
  const settleCheckRef = useRef<number>(0);

  const throwDice = useCallback(() => {
    if (!rigidBodyRef.current) return;
    
    setHasSettled(false);
    setShowResult(null);
    settleCheckRef.current = 0;
    
    // Reset position - start from center top
    rigidBodyRef.current.setTranslation({ x: 0, y: 1.5, z: 0 }, true);
    rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    
    // Apply random impulse - gentler throw
    const impulseX = (Math.random() - 0.5) * 4;
    const impulseY = -3;
    const impulseZ = (Math.random() - 0.5) * 4;
    
    rigidBodyRef.current.setLinvel({ x: impulseX, y: impulseY, z: impulseZ }, true);
    
    // Apply random angular velocity for spin
    const angularX = (Math.random() - 0.5) * 20;
    const angularY = (Math.random() - 0.5) * 20;
    const angularZ = (Math.random() - 0.5) * 20;
    
    rigidBodyRef.current.setAngvel({ x: angularX, y: angularY, z: angularZ }, true);
  }, []);

  useEffect(() => {
    if (rollTrigger > 0) {
      throwDice();
    }
  }, [rollTrigger, throwDice]);

  useFrame(() => {
    if (!rigidBodyRef.current || hasSettled) return;
    
    const velocity = rigidBodyRef.current.linvel();
    const angularVel = rigidBodyRef.current.angvel();
    const position = rigidBodyRef.current.translation();
    
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
    const angularSpeed = Math.sqrt(angularVel.x ** 2 + angularVel.y ** 2 + angularVel.z ** 2);
    
    // Check if dice has settled (on the table surface)
    if (speed < 0.05 && angularSpeed < 0.05 && position.y < 0.8 && position.y > 0) {
      settleCheckRef.current++;
      
      if (settleCheckRef.current > 40) {
        setHasSettled(true);
        const result = Math.floor(Math.random() * sides) + 1;
        setShowResult(result);
        onRollComplete(result);
      }
    } else {
      settleCheckRef.current = 0;
    }
  });

  const getGeometry = () => {
    switch (sides) {
      case 4:
        return <tetrahedronGeometry args={[0.4, 0]} />;
      case 6:
        return <boxGeometry args={[0.5, 0.5, 0.5]} />;
      case 8:
        return <octahedronGeometry args={[0.4, 0]} />;
      case 10:
        return <dodecahedronGeometry args={[0.35, 0]} />;
      case 12:
        return <dodecahedronGeometry args={[0.4, 0]} />;
      case 20:
        return <icosahedronGeometry args={[0.4, 0]} />;
      default:
        return <boxGeometry args={[0.5, 0.5, 0.5]} />;
    }
  };

  const diceColor = colorMap[color] || '#eab308';

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        colliders="hull"
        restitution={0.4}
        friction={0.6}
        linearDamping={0.3}
        angularDamping={0.3}
        position={[0, 1.5, 0]}
        mass={1}
      >
        <mesh ref={meshRef} castShadow receiveShadow>
          {getGeometry()}
          <meshStandardMaterial
            color={diceColor}
            metalness={0.3}
            roughness={0.4}
            emissive={diceColor}
            emissiveIntensity={0.1}
          />
        </mesh>
      </RigidBody>
      
      {/* Floating result number when settled */}
      {showResult !== null && (
        <Text
          position={[0, 2, 0]}
          fontSize={0.6}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {showResult}
        </Text>
      )}
    </>
  );
};

const DiceTray = () => {
  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed" position={[0, 0, 0]}>
        <CuboidCollider args={[2, 0.1, 2]} />
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[4, 0.2, 4]} />
          <meshStandardMaterial color="#16213e" />
        </mesh>
      </RigidBody>
      
      {/* Felt surface */}
      <mesh position={[0, 0.11, 0]} receiveShadow>
        <boxGeometry args={[3.8, 0.02, 3.8]} />
        <meshStandardMaterial color="#1a3a1a" roughness={0.9} />
      </mesh>
      
      {/* Walls - wooden rim */}
      {/* Back wall */}
      <RigidBody type="fixed" position={[0, 0.3, -2]}>
        <CuboidCollider args={[2, 0.4, 0.1]} />
        <mesh castShadow>
          <boxGeometry args={[4, 0.8, 0.2]} />
          <meshStandardMaterial color="#3d2914" />
        </mesh>
      </RigidBody>
      
      {/* Front wall */}
      <RigidBody type="fixed" position={[0, 0.3, 2]}>
        <CuboidCollider args={[2, 0.4, 0.1]} />
        <mesh castShadow>
          <boxGeometry args={[4, 0.8, 0.2]} />
          <meshStandardMaterial color="#3d2914" />
        </mesh>
      </RigidBody>
      
      {/* Left wall */}
      <RigidBody type="fixed" position={[-2, 0.3, 0]}>
        <CuboidCollider args={[0.1, 0.4, 2]} />
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.8, 4]} />
          <meshStandardMaterial color="#3d2914" />
        </mesh>
      </RigidBody>
      
      {/* Right wall */}
      <RigidBody type="fixed" position={[2, 0.3, 0]}>
        <CuboidCollider args={[0.1, 0.4, 2]} />
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.8, 4]} />
          <meshStandardMaterial color="#3d2914" />
        </mesh>
      </RigidBody>
    </group>
  );
};

interface DicePhysicsSceneProps {
  sides: number;
  color: string;
  onRollComplete: (result: number) => void;
  rollTrigger: number;
}

export const DicePhysicsScene = ({ sides, color, onRollComplete, rollTrigger }: DicePhysicsSceneProps) => {
  return (
    <div className="w-full h-48 rounded-lg overflow-hidden border border-border/50">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 4]} fov={40} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[3, 6, 3]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={20}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <pointLight position={[-2, 3, -2]} intensity={0.4} color="#f97316" />
        <Environment preset="apartment" />
        
        <Physics gravity={[0, -15, 0]} debug={false}>
          <PhysicsDice
            sides={sides}
            color={color}
            onRollComplete={onRollComplete}
            rollTrigger={rollTrigger}
          />
          <DiceTray />
        </Physics>
        
        {/* Background gradient */}
        <mesh position={[0, 0, -5]}>
          <planeGeometry args={[20, 20]} />
          <meshBasicMaterial color="#0f0f1a" />
        </mesh>
      </Canvas>
    </div>
  );
};
