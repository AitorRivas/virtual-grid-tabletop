import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

interface DiceMeshProps {
  sides: number;
  isRolling: boolean;
  color: string;
}

const DiceMesh = ({ sides, isRolling, color }: DiceMeshProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [targetRotation, setTargetRotation] = useState({ x: 0, y: 0, z: 0 });
  
  useEffect(() => {
    if (!isRolling) {
      setTargetRotation({
        x: Math.random() * Math.PI * 2,
        y: Math.random() * Math.PI * 2,
        z: Math.random() * Math.PI * 2,
      });
    }
  }, [isRolling]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (isRolling) {
        groupRef.current.rotation.x += delta * 15;
        groupRef.current.rotation.y += delta * 12;
        groupRef.current.rotation.z += delta * 8;
      } else {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          targetRotation.x,
          delta * 5
        );
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotation.y,
          delta * 5
        );
        groupRef.current.rotation.z = THREE.MathUtils.lerp(
          groupRef.current.rotation.z,
          targetRotation.z,
          delta * 5
        );
      }
    }
  });

  const getGeometry = () => {
    switch (sides) {
      case 4:
        return <tetrahedronGeometry args={[0.8, 0]} />;
      case 6:
        return <boxGeometry args={[1, 1, 1]} />;
      case 8:
        return <octahedronGeometry args={[0.8, 0]} />;
      case 10:
        return <dodecahedronGeometry args={[0.7, 0]} />;
      case 12:
        return <dodecahedronGeometry args={[0.8, 0]} />;
      case 20:
        return <icosahedronGeometry args={[0.8, 0]} />;
      default:
        return <icosahedronGeometry args={[0.8, 0]} />;
    }
  };

  const colorMap: Record<string, string> = {
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#a855f7',
    orange: '#f97316',
    red: '#ef4444',
    yellow: '#eab308',
  };

  const diceColor = colorMap[color] || '#eab308';

  return (
    <Float 
      speed={isRolling ? 0 : 2} 
      rotationIntensity={isRolling ? 0 : 0.2} 
      floatIntensity={isRolling ? 0 : 0.3}
    >
      <group ref={groupRef}>
        <mesh castShadow>
          {getGeometry()}
          <meshStandardMaterial
            color={diceColor}
            metalness={0.4}
            roughness={0.3}
            envMapIntensity={1.2}
          />
        </mesh>
        {/* Subtle edge glow */}
        <mesh scale={1.02}>
          {getGeometry()}
          <meshBasicMaterial
            color={diceColor}
            transparent
            opacity={0.15}
          />
        </mesh>
      </group>
    </Float>
  );
};

interface Dice3DProps {
  sides: number;
  isRolling: boolean;
  color: string;
}

export const Dice3D = ({ sides, isRolling, color }: Dice3DProps) => {
  return (
    <div className="w-16 h-16">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-3, -3, -3]} intensity={0.4} color="#f97316" />
        <Environment preset="city" />
        <DiceMesh sides={sides} isRolling={isRolling} color={color} />
      </Canvas>
    </div>
  );
};
