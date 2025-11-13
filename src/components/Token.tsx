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

export const Token = ({ id, x, y, color, name, isSelected, onMove, onClick }: TokenProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const tokenRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - x,
      y: e.clientY - y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
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
  }, [isDragging, dragStart, id, onMove]);

  return (
    <div
      ref={tokenRef}
      className="absolute cursor-move"
      style={{
        left: x - 25,
        top: y - 25,
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
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-card-foreground border border-border"
      >
        {name}
      </div>
    </div>
  );
};
