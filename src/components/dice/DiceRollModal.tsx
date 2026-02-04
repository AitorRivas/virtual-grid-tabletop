import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import type { RapierRigidBody } from '@react-three/rapier';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─────────────────────────────────────────────────────────────────────────────
   Utility: convert CSS var HSL to a CSS hsl() string for Three.js
   ───────────────────────────────────────────────────────────────────────────── */
const tokenVarMap: Record<string, string> = {
  green: '--token-green',
  blue: '--token-blue',
  purple: '--token-purple',
  orange: '--token-orange',
  red: '--token-red',
  yellow: '--token-yellow',
};

const cssVarToHsl = (varName: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length < 3) return fallback;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace('%', ''));
  const l = parseFloat(parts[2].replace('%', ''));
  if ([h, s, l].some((n) => Number.isNaN(n))) return fallback;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/* ─────────────────────────────────────────────────────────────────────────────
   PhysicsDice – the actual 3D die
   ───────────────────────────────────────────────────────────────────────────── */
interface PhysicsDiceProps {
  sides: number;
  color: string;
  onSettled: (result: number) => void;
}

const PhysicsDice = ({ sides, color, onSettled }: PhysicsDiceProps) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const settleCountRef = useRef(0);
  const hasSettledRef = useRef(false);
  const thrownRef = useRef(false);

  const diceColor = useMemo(() => {
    const tokenVar = tokenVarMap[color] ?? '--primary';
    return cssVarToHsl(tokenVar, 'hsl(38, 90%, 55%)');
  }, [color]);

  // Throw dice on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (rigidBodyRef.current && !thrownRef.current) {
        thrownRef.current = true;
        rigidBodyRef.current.setTranslation({ x: 0, y: 3, z: 0 }, true);

        const rx = Math.random() * Math.PI * 2;
        const ry = Math.random() * Math.PI * 2;
        const rz = Math.random() * Math.PI * 2;
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
        rigidBodyRef.current.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);

        rigidBodyRef.current.setLinvel(
          { x: (Math.random() - 0.5) * 4, y: -4, z: (Math.random() - 0.5) * 4 },
          true
        );
        rigidBodyRef.current.setAngvel(
          {
            x: (Math.random() - 0.5) * 20,
            y: (Math.random() - 0.5) * 20,
            z: (Math.random() - 0.5) * 20,
          },
          true
        );
      }
    }, 150);

    // Failsafe
    const failsafe = setTimeout(() => {
      if (!hasSettledRef.current) {
        hasSettledRef.current = true;
        onSettled(Math.floor(Math.random() * sides) + 1);
      }
    }, 7000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(failsafe);
    };
  }, [sides, onSettled]);

  useFrame(() => {
    if (!rigidBodyRef.current || hasSettledRef.current) return;

    const vel = rigidBodyRef.current.linvel();
    const angVel = rigidBodyRef.current.angvel();
    const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
    const angSpeed = Math.sqrt(angVel.x ** 2 + angVel.y ** 2 + angVel.z ** 2);

    if (speed < 0.08 && angSpeed < 0.08) {
      settleCountRef.current++;
      if (settleCountRef.current > 50) {
        hasSettledRef.current = true;
        const result = Math.floor(Math.random() * sides) + 1;
        onSettled(result);
      }
    } else {
      settleCountRef.current = 0;
    }
  });

  const getGeometry = () => {
    switch (sides) {
      case 4:
        return <tetrahedronGeometry args={[0.7, 0]} />;
      case 6:
        return <boxGeometry args={[0.9, 0.9, 0.9]} />;
      case 8:
        return <octahedronGeometry args={[0.7, 0]} />;
      case 10:
        return <dodecahedronGeometry args={[0.65, 0]} />;
      case 12:
        return <dodecahedronGeometry args={[0.7, 0]} />;
      case 20:
        return <icosahedronGeometry args={[0.7, 0]} />;
      default:
        return <boxGeometry args={[0.9, 0.9, 0.9]} />;
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="hull"
      restitution={0.35}
      friction={0.6}
      linearDamping={0.5}
      angularDamping={0.5}
      position={[0, 3, 0]}
    >
      <mesh>
        {getGeometry()}
        <meshStandardMaterial color={diceColor} metalness={0.25} roughness={0.45} />
      </mesh>
    </RigidBody>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   DiceTray – floor + walls
   ───────────────────────────────────────────────────────────────────────────── */
const DiceTray = () => {
  const feltColor = useMemo(() => cssVarToHsl('--board-bg', 'hsl(220, 22%, 5%)'), []);
  const wallColor = useMemo(() => cssVarToHsl('--toolbar-bg', 'hsl(220, 18%, 9%)'), []);

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed" position={[0, 0, 0]}>
        <CuboidCollider args={[3, 0.1, 3]} />
      </RigidBody>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[6, 0.2, 6]} />
        <meshStandardMaterial color={feltColor} />
      </mesh>

      {/* Walls */}
      {(
        [
          { pos: [0, 0.6, -3], size: [6, 1.2, 0.2] },
          { pos: [0, 0.6, 3], size: [6, 1.2, 0.2] },
          { pos: [-3, 0.6, 0], size: [0.2, 1.2, 6] },
          { pos: [3, 0.6, 0], size: [0.2, 1.2, 6] },
        ] as { pos: [number, number, number]; size: [number, number, number] }[]
      ).map(({ pos, size }, idx) => (
        <group key={idx}>
          <RigidBody type="fixed" position={pos}>
            <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
          </RigidBody>
          <mesh position={pos}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   ResultOverlay – shows result text once settled
   ───────────────────────────────────────────────────────────────────────────── */
interface ResultOverlayProps {
  result: number;
  sides: number;
  onClose: () => void;
}

const ResultOverlay = ({ result, sides, onClose }: ResultOverlayProps) => {
  const isCritical = sides === 20 && result === 20;
  const isFumble = sides === 20 && result === 1;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div
        className={`text-7xl md:text-9xl font-black animate-scale-in ${
          isCritical
            ? 'text-token-green drop-shadow-[0_0_40px_hsl(var(--token-green)/0.6)]'
            : isFumble
            ? 'text-destructive drop-shadow-[0_0_40px_hsl(var(--destructive)/0.6)]'
            : 'text-primary drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]'
        }`}
      >
        {result}
        {isCritical && <Sparkles className="inline w-12 h-12 ml-2 text-token-yellow" />}
      </div>
      {isCritical && (
        <span className="absolute top-1/2 mt-20 text-xl font-bold text-token-green">
          ¡Crítico Natural!
        </span>
      )}
      {isFumble && (
        <span className="absolute top-1/2 mt-20 text-xl font-bold text-destructive">
          Pifia Natural
        </span>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   DiceRollModal – fullscreen modal
   ───────────────────────────────────────────────────────────────────────────── */
interface DiceRollModalProps {
  open: boolean;
  rollId: number;
  sides: number;
  color: string;
  onComplete: (result: number) => void;
  onClose: () => void;
}

export const DiceRollModal = ({ open, rollId, sides, color, onComplete, onClose }: DiceRollModalProps) => {
  const [result, setResult] = useState<number | null>(null);
  const accentColor = useMemo(() => cssVarToHsl('--accent', 'hsl(32, 95%, 48%)'), []);
  const [webglError, setWebglError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setResult(null);
      setWebglError(null);
    }
  }, [open, rollId]);

  const handleSettled = useCallback(
    (r: number) => {
      setResult(r);
      onComplete(r);
    },
    [onComplete]
  );

  const handleOverlayClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div
      className={
        `fixed inset-0 z-[100] transition-opacity duration-150 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`
      }
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={result !== null ? handleOverlayClose : undefined}
      />

      {/* Content */}
      <div className="absolute inset-0 p-4 md:p-8 flex items-center justify-center">
        <div className="relative w-full h-full max-w-none max-h-none rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
            <div className="text-sm font-semibold text-foreground">
              Tirada 3D — d{sides}
              {webglError ? <span className="ml-2 text-destructive">(WebGL)</span> : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="bg-card/40 backdrop-blur border border-border/50"
              onClick={handleOverlayClose}
            >
              Cerrar
            </Button>
          </div>

          {result !== null && <ResultOverlay result={result} sides={sides} onClose={handleOverlayClose} />}

          {webglError ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div className="max-w-lg space-y-2">
                <p className="text-lg font-semibold text-foreground">No se pudo renderizar el dado 3D.</p>
                <p className="text-sm text-muted-foreground">{webglError}</p>
                <p className="text-xs text-muted-foreground">
                  Si estás en modo ahorro de energía o con aceleración por hardware desactivada, actívala y recarga.
                </p>
              </div>
            </div>
          ) : (
            <Canvas
              style={{ width: '100%', height: '100%' }}
              dpr={1}
              camera={{ position: [0, 7, 8], fov: 42, near: 0.1, far: 120 }}
              gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
              onCreated={(state) => {
                state.camera.lookAt(0, 0, 0);
                state.camera.updateProjectionMatrix();

                // Detect context loss early and show a proper message
                const canvas = state.gl.domElement;
                const onLost = (e: Event) => {
                  e.preventDefault?.();
                  setWebglError('Se perdió el contexto WebGL (posible limitación del dispositivo o demasiados contextos).');
                };
                const onError = () => {
                  setWebglError('Error inicializando WebGL en este navegador/dispositivo.');
                };

                canvas.addEventListener('webglcontextlost', onLost as EventListener, false);
                canvas.addEventListener('webglcontextcreationerror', onError as EventListener, false);

                return () => {
                  canvas.removeEventListener('webglcontextlost', onLost as EventListener);
                  canvas.removeEventListener('webglcontextcreationerror', onError as EventListener);
                };
              }}
            >
              <hemisphereLight intensity={0.9} />
              <directionalLight position={[4, 10, 6]} intensity={1.6} />
              <pointLight position={[-4, 6, -4]} intensity={0.8} color={accentColor} />

              <Physics gravity={[0, -14, 0]}>
                {/* Keyed so each roll re-throws without recreating the WebGL context */}
                <PhysicsDice key={rollId} sides={sides} color={color} onSettled={handleSettled} />
                <DiceTray />
              </Physics>
            </Canvas>
          )}

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-muted-foreground text-sm z-20">
            {result === null ? `Lanzando d${sides}…` : 'Pulsa “Cerrar” o toca fuera para salir'}
          </p>
        </div>
      </div>
    </div>
  );
};
