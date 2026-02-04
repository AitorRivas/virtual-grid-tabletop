import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

interface DiceMeshProps {
  sides: number;
  isRolling: boolean;
  result: number;
  color: string;
}

const DiceMesh = ({ sides, isRolling, color }: DiceMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [targetRotation, setTargetRotation] = useState({ x: 0, y: 0, z: 0 });
  
  useEffect(() => {
    if (!isRolling) {
      // Set final rotation when rolling stops
      setTargetRotation({
        x: Math.random() * Math.PI * 2,
        y: Math.random() * Math.PI * 2,
        z: Math.random() * Math.PI * 2,
      });
    }
  }, [isRolling]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      if (isRolling) {
        // Fast spinning during roll
        meshRef.current.rotation.x += delta * 15;
        meshRef.current.rotation.y += delta * 12;
        meshRef.current.rotation.z += delta * 8;
      } else {
        // Smooth interpolation to final position
        meshRef.current.rotation.x = THREE.MathUtils.lerp(
          meshRef.current.rotation.x,
          targetRotation.x,
          delta * 5
        );
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
          meshRef.current.rotation.y,
          targetRotation.y,
          delta * 5
        );
        meshRef.current.rotation.z = THREE.MathUtils.lerp(
          meshRef.current.rotation.z,
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
        // D10 approximated with dodecahedron
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

  return (
    <Float 
      speed={isRolling ? 0 : 2} 
      rotationIntensity={isRolling ? 0 : 0.2} 
      floatIntensity={isRolling ? 0 : 0.3}
    >
      <mesh ref={meshRef} castShadow>
        {getGeometry()}
        <meshStandardMaterial
          color={colorMap[color] || '#eab308'}
          metalness={0.3}
          roughness={0.4}
          envMapIntensity={1}
        />
      </mesh>
      {/* Edge highlight */}
      <mesh ref={meshRef}>
        {getGeometry()}
        <meshBasicMaterial
          color={colorMap[color] || '#eab308'}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </Float>
  );
};

interface Dice3DProps {
  sides: number;
  isRolling: boolean;
  result: number;
  color: string;
}

export const Dice3D = ({ sides, isRolling, result, color }: Dice3DProps) => {
  return (
    <div className="w-16 h-16 relative">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#f97316" />
        <Environment preset="city" />
        <DiceMesh sides={sides} isRolling={isRolling} result={result} color={color} />
      </Canvas>
      {/* Result overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span 
          className={`text-lg font-bold drop-shadow-lg transition-opacity duration-300 ${
            isRolling ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ 
            textShadow: '0 0 8px rgba(0,0,0,0.8), 0 0 16px rgba(0,0,0,0.6)',
            color: 'white'
          }}
        >
          {result}
        </span>
      </div>
    </div>
  );
};
