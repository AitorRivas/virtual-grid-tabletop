import { useState, useRef, useEffect } from 'react';
import { TokenColor } from './MapViewer';

interface TokenProps {
  id: string;
  x: number;
  y: number;
  color: TokenColor;
  name: string;
  isSelected: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onClick: () => void;
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
};

export const Token = ({ id, x, y, color, name, isSelected, onMove, onClick, mapContainerRef }: TokenProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, tokenX: 0, tokenY: 0 });
  const tokenRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    
    if (!mapContainerRef.current) return;
    
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
      
      // Convert pixel delta to percentage delta
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

  return (
    <div
      ref={tokenRef}
      className="absolute cursor-move"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        width: 50,
        height: 50,
        zIndex: isSelected ? 100 : 50,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Token circle */}
      <div
        className={`w-full h-full rounded-full ${colorClasses[color]} border-2 ${
          isSelected ? 'border-primary' : 'border-foreground/30'
        } transition-all duration-200 flex items-center justify-center font-bold text-white shadow-lg`}
        style={{
          boxShadow: isSelected 
            ? '0 0 0 3px hsl(var(--primary) / 0.3), 0 4px 12px rgba(0, 0, 0, 0.5)' 
            : 'var(--token-shadow)',
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      
      {/* Token name label */}
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-card-foreground border border-border pointer-events-none"
      >
        {name}
      </div>
    </div>
  );
};
