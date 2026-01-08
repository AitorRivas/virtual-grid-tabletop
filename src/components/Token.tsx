import { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Skull } from 'lucide-react';
import { TokenColor, TokenStatus } from './MapViewer';
import { getConditionById } from '@/data/conditions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TokenProps {
  id: string;
  x: number;
  y: number;
  color: TokenColor;
  name: string;
  size: number;
  status: TokenStatus;
  conditions: string[];
  hpMax: number;
  hpCurrent: number;
  imageUrl?: string;
  rotation?: number;
  isSelected: boolean;
  isCurrentTurn: boolean;
  combatMode: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onClick: () => void;
  onDelete: () => void;
  onMarkDead: () => void;
  onRotate: (id: string, rotation: number) => void;
  mapContainerRef: React.RefObject<HTMLDivElement>;
}

const colorClasses: Record<TokenColor, string> = {
  red: 'bg-token-red',
  blue: 'bg-token-blue',
  green: 'bg-token-green',
  yellow: 'bg-token-yellow',
  purple: 'bg-token-purple',
  orange: 'bg-token-orange',
  pink: 'bg-token-pink',
  cyan: 'bg-token-cyan',
  black: 'bg-gray-800',
};

export const Token = ({ 
  id, x, y, color, name, size, status, conditions: tokenConditions, hpMax, hpCurrent, imageUrl, rotation = 0, isSelected, isCurrentTurn, combatMode,
  onMove, onClick, onDelete, onMarkDead, onRotate, mapContainerRef 
}: TokenProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, tokenX: 0, tokenY: 0 });
  const [rotationStart, setRotationStart] = useState({ angle: 0, rotation: 0 });
  const [showActions, setShowActions] = useState(false);
  const tokenRef = useRef<HTMLDivElement>(null);

  // Calculate angle from center of token to mouse position
  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    if (!tokenRef.current) return 0;
    const rect = tokenRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  }, []);

  // Check if mouse is on the edge of the token (for rotation)
  const isOnEdge = useCallback((clientX: number, clientY: number) => {
    if (!tokenRef.current) return false;
    const rect = tokenRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;
    const distance = Math.sqrt(
      Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
    );
    // Consider "edge" as the outer 25% of the radius
    return distance > radius * 0.65 && distance < radius * 1.2;
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    
    if (!mapContainerRef.current) return;
    
    // Don't allow interactions with dead/inactive tokens
    if (status !== 'active') return;
    
    // Check if clicking on edge for rotation
    if (isOnEdge(e.clientX, e.clientY)) {
      setIsRotating(true);
      setRotationStart({
        angle: calculateAngle(e.clientX, e.clientY),
        rotation: rotation,
      });
      return;
    }
    
    // Otherwise, start dragging
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      tokenX: x,
      tokenY: y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isRotating) {
        const currentAngle = calculateAngle(e.clientX, e.clientY);
        const angleDiff = currentAngle - rotationStart.angle;
        let newRotation = (rotationStart.rotation + angleDiff) % 360;
        if (newRotation < 0) newRotation += 360;
        onRotate(id, newRotation);
        return;
      }
      
      if (!isDragging || !mapContainerRef.current) return;
      
      const rect = mapContainerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;
      
      const newX = Math.max(0, Math.min(100, dragStart.tokenX + deltaXPercent));
      const newY = Math.max(0, Math.min(100, dragStart.tokenY + deltaYPercent));
      
      onMove(id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsRotating(false);
    };

    if (isDragging || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isRotating, dragStart, rotationStart, id, onMove, onRotate, mapContainerRef, calculateAngle]);

  // Update cursor based on position
  const handleMouseMoveForCursor = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (status !== 'active') return;
    const target = e.currentTarget;
    if (isOnEdge(e.clientX, e.clientY)) {
      target.style.cursor = 'grab';
    } else {
      target.style.cursor = 'move';
    }
  }, [status, isOnEdge]);

  const isDead = status === 'dead';
  const isInactive = status === 'inactive';
  const displayColor = isDead ? 'black' : color;

  // Get active conditions data
  const activeConditionsData = tokenConditions
    .map(id => getConditionById(id))
    .filter(Boolean);

  // Show max 5 icons around the token (6th position for +X indicator)
  const visibleConditions = activeConditionsData.slice(0, 5);
  const hasMoreConditions = activeConditionsData.length > 5;

  // Calculate HP percentage for the bar
  const hpPercentage = Math.max(0, Math.min(100, (hpCurrent / hpMax) * 100));
  const hpColor = hpCurrent / hpMax > 0.5 
    ? 'hsl(142, 76%, 36%)' 
    : hpCurrent / hpMax > 0.25 
    ? 'hsl(45, 93%, 47%)'
    : 'hsl(0, 84%, 60%)';

  return (
    <TooltipProvider>
      <div
        ref={tokenRef}
        className={`absolute ${status === 'active' ? '' : 'cursor-not-allowed'}`}
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          width: size,
          height: size,
          zIndex: isSelected ? 100 : isCurrentTurn ? 90 : 50,
          opacity: isDead || isInactive ? 0.5 : 1,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveForCursor}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Rotation indicator ring - shown when selected or rotating */}
        {status === 'active' && (isSelected || isRotating) && (
          <div 
            className="absolute inset-[-4px] rounded-full border-2 border-dashed pointer-events-none transition-opacity"
            style={{
              borderColor: 'hsl(var(--primary) / 0.5)',
              opacity: isRotating ? 1 : 0.5,
            }}
          />
        )}

        {/* Current turn indicator */}
        {isCurrentTurn && (
          <div 
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              border: '3px solid hsl(var(--primary))',
              boxShadow: '0 0 20px hsl(var(--primary) / 0.5)',
            }}
          />
        )}

        {/* Condition icons around the token */}
        {(visibleConditions.length > 0 || hasMoreConditions) && (
          <div className="absolute inset-0 pointer-events-none">
            {visibleConditions.map((condition, index) => {
              if (!condition) return null;
              const Icon = condition.icon;
              const angle = (index * 60) - 90; // Start from top, space 60 degrees apart
              const iconSize = Math.max(16, size * 0.25); // Scale with token size, min 16px
              const radius = size / 2 + iconSize / 2 + 4; // Dynamic radius based on icon size
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              
              return (
                <Tooltip key={condition.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute rounded-full flex items-center justify-center shadow-md border border-foreground/20 pointer-events-auto"
                      style={{
                        width: iconSize,
                        height: iconSize,
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        backgroundColor: `hsl(${condition.color})`,
                      }}
                    >
                      <div style={{ width: iconSize * 0.6, height: iconSize * 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon className="text-white w-full h-full" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold">{condition.nameEs}</p>
                    <p className="text-muted-foreground">{condition.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            {hasMoreConditions && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="absolute rounded-full flex items-center justify-center shadow-md border border-foreground/20 bg-secondary text-secondary-foreground font-bold pointer-events-auto"
                    style={{
                      width: Math.max(16, size * 0.25),
                      height: Math.max(16, size * 0.25),
                      fontSize: Math.max(10, size * 0.15),
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${Math.cos((5 * 60 - 90) * Math.PI / 180) * (size / 2 + Math.max(16, size * 0.25) / 2 + 4)}px), calc(-50% + ${Math.sin((5 * 60 - 90) * Math.PI / 180) * (size / 2 + Math.max(16, size * 0.25) / 2 + 4)}px))`,
                    }}
                  >
                    +{activeConditionsData.length - 5}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-h-48 overflow-y-auto">
                  <p className="font-semibold mb-1">Más estados:</p>
                  {activeConditionsData.slice(5).map(c => (
                    <p key={c?.id} className="text-xs">{c?.nameEs}</p>
                  ))}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
        
        {/* Token circle */}
        <div
          className={`w-full h-full rounded-full ${!imageUrl ? colorClasses[displayColor] : ''} border-2 ${
            isSelected ? 'border-primary' : 'border-foreground/30'
          } transition-all duration-200 flex items-center justify-center font-bold text-white shadow-lg relative overflow-hidden`}
          style={{
            boxShadow: isSelected 
              ? '0 0 0 3px hsl(var(--primary) / 0.3), 0 4px 12px rgba(0, 0, 0, 0.5)' 
              : isCurrentTurn 
              ? '0 0 15px hsl(var(--primary) / 0.6)' 
              : 'var(--token-shadow)',
            fontSize: size * 0.4,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {imageUrl ? (
            <>
              <img 
                src={imageUrl} 
                alt={name}
                className="w-full h-full object-cover rounded-full"
                draggable={false}
              />
              {isDead && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                  <Skull className="w-1/2 h-1/2 text-white" style={{ transform: `rotate(-${rotation}deg)` }} />
                </div>
              )}
            </>
          ) : (
            isDead ? <Skull className="w-1/2 h-1/2" /> : name.charAt(0).toUpperCase()
          )}
        </div>
        
        {/* HP Bar underneath the token */}
        {hpMax > 0 && status === 'active' && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden border border-foreground/30 bg-secondary"
            style={{
              top: size + 4,
              width: size * 0.8,
              height: Math.max(4, size * 0.08),
            }}
          >
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${hpPercentage}%`,
                backgroundColor: hpColor
              }}
            />
          </div>
        )}
        
        {/* Token name label - positioned below HP bar */}
        <div
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-card-foreground border border-border pointer-events-none"
          style={{ 
            top: hpMax > 0 && status === 'active' ? size + Math.max(4, size * 0.08) + 8 : size + 4,
            fontSize: Math.max(10, size * 0.2) 
          }}
        >
          {name}
          {isDead && ' 💀'}
          {isInactive && ' ⏸️'}
        </div>

        {/* Quick action buttons - positioned well above the token */}
        {showActions && status === 'active' && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 flex gap-1 z-[110]"
            style={{ top: -32 }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkDead();
              }}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors shadow-lg"
              title="Marcar como muerto"
            >
              <Skull className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 bg-destructive hover:bg-destructive/80 rounded text-destructive-foreground transition-colors shadow-lg"
              title="Eliminar token"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Rotation hint tooltip - shown when hovering on edge */}
        {isRotating && (
          <div 
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-card-foreground border border-border whitespace-nowrap z-[120]"
          >
            {Math.round(rotation)}°
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
