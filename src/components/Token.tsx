import { useState, useRef, useEffect } from 'react';
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
  isSelected: boolean;
  isCurrentTurn: boolean;
  combatMode: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onClick: () => void;
  onDelete: () => void;
  onMarkDead: () => void;
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
  id, x, y, color, name, size, status, conditions: tokenConditions, isSelected, isCurrentTurn, combatMode,
  onMove, onClick, onDelete, onMarkDead, mapContainerRef 
}: TokenProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, tokenX: 0, tokenY: 0 });
  const [showActions, setShowActions] = useState(false);
  const tokenRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    
    if (!mapContainerRef.current) return;
    
    // Don't allow dragging dead/inactive tokens
    if (status !== 'active') return;
    
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
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, id, onMove, mapContainerRef]);

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

  return (
    <TooltipProvider>
      <div
        ref={tokenRef}
        className={`absolute ${status === 'active' ? 'cursor-move' : 'cursor-not-allowed'}`}
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
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
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
          className={`w-full h-full rounded-full ${colorClasses[displayColor]} border-2 ${
            isSelected ? 'border-primary' : 'border-foreground/30'
          } transition-all duration-200 flex items-center justify-center font-bold text-white shadow-lg relative`}
          style={{
            boxShadow: isSelected 
              ? '0 0 0 3px hsl(var(--primary) / 0.3), 0 4px 12px rgba(0, 0, 0, 0.5)' 
              : isCurrentTurn 
              ? '0 0 15px hsl(var(--primary) / 0.6)' 
              : 'var(--token-shadow)',
            fontSize: size * 0.4,
          }}
        >
          {isDead ? <Skull className="w-1/2 h-1/2" /> : name.charAt(0).toUpperCase()}
        </div>
        
        {/* Token name label */}
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-card-foreground border border-border pointer-events-none"
          style={{ fontSize: Math.max(10, size * 0.2) }}
        >
          {name}
          {isDead && ' 💀'}
          {isInactive && ' ⏸️'}
        </div>

        {/* Quick action buttons */}
        {showActions && status === 'active' && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkDead();
              }}
              className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
              title="Marcar como muerto"
            >
              <Skull className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 bg-destructive hover:bg-destructive/80 rounded text-destructive-foreground transition-colors"
              title="Eliminar token"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
