import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { Environment, PerspectiveCamera } from '@react-three/drei';
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

// Face mappings for detecting which face is up
const D6_FACES = [
  { normal: [1, 0, 0], value: 3 },
  { normal: [-1, 0, 0], value: 4 },
  { normal: [0, 1, 0], value: 2 },
  { normal: [0, -1, 0], value: 5 },
  { normal: [0, 0, 1], value: 1 },
  { normal: [0, 0, -1], value: 6 },
];

const PhysicsDice = ({ sides, color, onRollComplete, rollTrigger }: DiceProps) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hasSettled, setHasSettled] = useState(false);
  const settleCheckRef = useRef<number>(0);
  const lastPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());

  const throwDice = useCallback(() => {
    if (!rigidBodyRef.current) return;
    
    setHasSettled(false);
    settleCheckRef.current = 0;
    
    // Reset position
    rigidBodyRef.current.setTranslation({ x: 0, y: 3, z: 0 }, true);
    rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    
    // Apply random impulse
    const impulseX = (Math.random() - 0.5) * 8;
    const impulseY = -2 - Math.random() * 3;
    const impulseZ = (Math.random() - 0.5) * 8;
    
    rigidBodyRef.current.setLinvel({ x: impulseX, y: impulseY, z: impulseZ }, true);
    
    // Apply random angular velocity for spin
    const angularX = (Math.random() - 0.5) * 30;
    const angularY = (Math.random() - 0.5) * 30;
    const angularZ = (Math.random() - 0.5) * 30;
    
    rigidBodyRef.current.setAngvel({ x: angularX, y: angularY, z: angularZ }, true);
  }, []);

  useEffect(() => {
    if (rollTrigger > 0) {
      throwDice();
    }
  }, [rollTrigger, throwDice]);

  useFrame(() => {
    if (!rigidBodyRef.current || hasSettled) return;
    
    const position = rigidBodyRef.current.translation();
    const velocity = rigidBodyRef.current.linvel();
    const angularVel = rigidBodyRef.current.angvel();
    
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
    const angularSpeed = Math.sqrt(angularVel.x ** 2 + angularVel.y ** 2 + angularVel.z ** 2);
    
    // Check if dice has settled
    if (speed < 0.1 && angularSpeed < 0.1 && position.y < 1) {
      settleCheckRef.current++;
      
      if (settleCheckRef.current > 30) { // ~0.5 seconds of being still
        setHasSettled(true);
        
        // Determine result based on which face is up
        if (meshRef.current) {
          const result = determineFaceUp(meshRef.current, sides);
          onRollComplete(result);
        }
      }
    } else {
      settleCheckRef.current = 0;
    }
    
    lastPositionRef.current.set(position.x, position.y, position.z);
  });

  const determineFaceUp = (mesh: THREE.Mesh, sides: number): number => {
    const upVector = new THREE.Vector3(0, 1, 0);
    const quaternion = mesh.quaternion;
    
    if (sides === 6) {
      let maxDot = -Infinity;
      let result = 1;
      
      for (const face of D6_FACES) {
        const faceNormal = new THREE.Vector3(face.normal[0], face.normal[1], face.normal[2]);
        faceNormal.applyQuaternion(quaternion);
        const dot = faceNormal.dot(upVector);
        
        if (dot > maxDot) {
          maxDot = dot;
          result = face.value;
        }
      }
      
      return result;
    }
    
    // For other dice, use random result (proper face detection requires complex geometry analysis)
    return Math.floor(Math.random() * sides) + 1;
  };

  const getGeometry = () => {
    switch (sides) {
      case 4:
        return <tetrahedronGeometry args={[0.5, 0]} />;
      case 6:
        return <boxGeometry args={[0.7, 0.7, 0.7]} />;
      case 8:
        return <octahedronGeometry args={[0.5, 0]} />;
      case 10:
        return <dodecahedronGeometry args={[0.45, 0]} />;
      case 12:
        return <dodecahedronGeometry args={[0.5, 0]} />;
      case 20:
        return <icosahedronGeometry args={[0.5, 0]} />;
      default:
        return <boxGeometry args={[0.7, 0.7, 0.7]} />;
    }
  };

  const diceColor = colorMap[color] || '#eab308';

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="hull"
      restitution={0.3}
      friction={0.8}
      linearDamping={0.5}
      angularDamping={0.5}
      position={[0, 3, 0]}
    >
      <mesh ref={meshRef} castShadow receiveShadow>
        {getGeometry()}
        <meshStandardMaterial
          color={diceColor}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
    </RigidBody>
  );
};

const Table = () => {
  return (
    <RigidBody type="fixed" position={[0, -0.5, 0]}>
      <CuboidCollider args={[5, 0.5, 5]} />
      <mesh receiveShadow>
        <boxGeometry args={[10, 1, 10]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </RigidBody>
  );
};

const Walls = () => {
  return (
    <>
      {/* Back wall */}
      <RigidBody type="fixed" position={[0, 1, -3]}>
        <CuboidCollider args={[5, 2, 0.1]} />
      </RigidBody>
      {/* Front wall */}
      <RigidBody type="fixed" position={[0, 1, 3]}>
        <CuboidCollider args={[5, 2, 0.1]} />
      </RigidBody>
      {/* Left wall */}
      <RigidBody type="fixed" position={[-3, 1, 0]}>
        <CuboidCollider args={[0.1, 2, 5]} />
      </RigidBody>
      {/* Right wall */}
      <RigidBody type="fixed" position={[3, 1, 0]}>
        <CuboidCollider args={[0.1, 2, 5]} />
      </RigidBody>
    </>
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
    <div className="w-full h-48 rounded-lg overflow-hidden bg-gradient-to-b from-secondary/50 to-background">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 5]} fov={45} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-3, 3, -3]} intensity={0.3} color="#f97316" />
        <Environment preset="city" />
        
        <Physics gravity={[0, -20, 0]}>
          <PhysicsDice
            sides={sides}
            color={color}
            onRollComplete={onRollComplete}
            rollTrigger={rollTrigger}
          />
          <Table />
          <Walls />
        </Physics>
      </Canvas>
    </div>
  );
};
