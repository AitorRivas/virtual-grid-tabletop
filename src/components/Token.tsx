import { useState, useRef, useEffect } from 'react';
import { Trash2, Skull } from 'lucide-react';
import { TokenColor, TokenStatus } from './MapViewer';

interface TokenProps {
  id: string;
  x: number;
  y: number;
  color: TokenColor;
  name: string;
  size: number;
  status: TokenStatus;
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
  id, x, y, color, name, size, status, isSelected, isCurrentTurn, combatMode,
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

  return (
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
  );
};
