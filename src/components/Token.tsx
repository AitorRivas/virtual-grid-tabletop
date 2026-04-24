import { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Skull, Eye, EyeOff, Heart } from 'lucide-react';
import { TokenColor, TokenStatus } from './MapViewer';
import { getConditionById } from '@/data/conditions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { CombatTokenTooltipContent, type CombatTooltipData } from './CombatTokenTooltipContent';

interface FloatingNumber {
  id: string;
  value: number;
  type: 'damage' | 'heal' | 'crit';
}

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
  isActiveInitiative?: boolean;
  hidden?: boolean;
  /** When true, hidden visuals (semi-transparent + EyeOff badge) are applied. Player view passes false to never render hidden tokens at all. */
  showHiddenStyle?: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onClick: () => void;
  onDelete: () => void;
  onMarkDead: () => void;
  onRevive?: () => void;
  onRotate: (id: string, rotation: number) => void;
  onToggleHidden?: () => void;
  mapContainerRef: React.RefObject<HTMLDivElement>;
  /** When provided (DM + combat active + entity has stats), shows a hover card with categorized actions/traits. */
  combatTooltip?: CombatTooltipData | null;
  /** When true, the HP bar underneath the token is not rendered (used by Player View to hide enemy/NPC HP). */
  hideHpBar?: boolean;
  /** When true, the token is read-only: no hover action buttons (kill/delete/hide) are shown. */
  readOnly?: boolean;
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
  id, x, y, color, name, size, status, conditions: tokenConditions, hpMax, hpCurrent, imageUrl, rotation = 0, isSelected, isActiveInitiative = false,
  hidden = false, showHiddenStyle = false,
  onMove, onClick, onDelete, onMarkDead, onRevive, onRotate, onToggleHidden, mapContainerRef,
  combatTooltip = null,
  hideHpBar = false,
  readOnly = false,
}: TokenProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, tokenX: 0, tokenY: 0 });
  const [rotationStart, setRotationStart] = useState({ angle: 0, rotation: 0 });
  const [showActions, setShowActions] = useState(false);
  const [flashType, setFlashType] = useState<'damage' | 'heal' | null>(null);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const prevHpRef = useRef(hpCurrent);
  const tokenRef = useRef<HTMLDivElement>(null);

  // Detect HP changes and trigger visual feedback
  useEffect(() => {
    const prevHp = prevHpRef.current;
    if (prevHp !== hpCurrent && prevHp !== undefined) {
      const delta = hpCurrent - prevHp;
      if (delta < 0) {
        // Damage
        const isCrit = Math.abs(delta) >= hpMax * 0.3; // 30%+ of max HP = crit
        setFlashType('damage');
        const floatId = Date.now().toString();
        setFloatingNumbers(prev => [...prev, { id: floatId, value: delta, type: isCrit ? 'crit' : 'damage' }]);
        setTimeout(() => setFlashType(null), 500);
        setTimeout(() => setFloatingNumbers(prev => prev.filter(f => f.id !== floatId)), 1200);
      } else if (delta > 0) {
        // Heal
        setFlashType('heal');
        const floatId = Date.now().toString();
        setFloatingNumbers(prev => [...prev, { id: floatId, value: delta, type: 'heal' }]);
        setTimeout(() => setFlashType(null), 500);
        setTimeout(() => setFloatingNumbers(prev => prev.filter(f => f.id !== floatId)), 1200);
      }
    }
    prevHpRef.current = hpCurrent;
  }, [hpCurrent, hpMax]);

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
    return distance > radius * 0.65 && distance < radius * 1.2;
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow right-click to bubble up so wrapping ContextMenuTrigger can capture it.
    if (e.button === 2) return;
    e.stopPropagation();
    onClick();
    
    if (!mapContainerRef.current) return;
    if (status !== 'active') return;
    if (readOnly) return;
    
    if (isOnEdge(e.clientX, e.clientY)) {
      setIsRotating(true);
      setRotationStart({
        angle: calculateAngle(e.clientX, e.clientY),
        rotation: rotation,
      });
      return;
    }
    
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

  const handleMouseMoveForCursor = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (status !== 'active' || readOnly) return;
    const target = e.currentTarget;
    if (isOnEdge(e.clientX, e.clientY)) {
      target.style.cursor = 'grab';
    } else {
      target.style.cursor = 'move';
    }
  }, [status, isOnEdge, readOnly]);

  const isDead = status === 'dead';
  const isInactive = status === 'inactive';
  const displayColor = isDead ? 'black' : color;

  const activeConditionsData = tokenConditions
    .map(id => getConditionById(id))
    .filter(Boolean);

  const visibleConditions = activeConditionsData.slice(0, 5);
  const hasMoreConditions = activeConditionsData.length > 5;

  const hpPercentage = Math.max(0, Math.min(100, (hpCurrent / hpMax) * 100));
  const hpColor = hpCurrent / hpMax > 0.5 
    ? 'hsl(142, 76%, 36%)' 
    : hpCurrent / hpMax > 0.25 
    ? 'hsl(45, 93%, 47%)'
    : 'hsl(0, 84%, 60%)';

  // Determine flash animation class
  const flashClass = flashType === 'damage' ? 'animate-damage-flash' : flashType === 'heal' ? 'animate-heal-flash' : '';

  return (
    <TooltipProvider>
      <div
        ref={tokenRef}
        data-token-id={id}
        className={`absolute ${status === 'active' ? '' : 'cursor-not-allowed'}`}
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          width: size,
          height: size,
          zIndex: isSelected ? 100 : 50,
          opacity: hidden && showHiddenStyle ? 0.4 : (isDead || isInactive ? 0.5 : 1),
          filter: hidden && showHiddenStyle ? 'grayscale(0.4)' : undefined,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveForCursor}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Hidden indicator badge (DM-only) */}
        {hidden && showHiddenStyle && (
          <div
            className="absolute -top-1 -right-1 z-[105] bg-card/95 border border-border rounded-full p-1 shadow-lg pointer-events-none"
            title="Token oculto a los jugadores"
          >
            <EyeOff className="w-3 h-3 text-muted-foreground" />
          </div>
        )}
        {/* Initiative active halo */}
        {isActiveInitiative && status === 'active' && (
          <>
            <div className="absolute inset-[-10px] rounded-full border-2 border-primary/80 animate-initiative-pulse pointer-events-none" />
            <div className="absolute inset-[-4px] rounded-full border border-primary bg-primary/10 animate-initiative-glow pointer-events-none" />
          </>
        )}

        {/* Rotation indicator ring */}
        {status === 'active' && (isSelected || isRotating) && (
          <div 
            className="absolute inset-[-4px] rounded-full border-2 border-dashed pointer-events-none transition-opacity"
            style={{
              borderColor: 'hsl(var(--primary) / 0.5)',
              opacity: isRotating ? 1 : 0.5,
            }}
          />
        )}

        {/* Condition icons around the token */}
        {(visibleConditions.length > 0 || hasMoreConditions) && (
          <div className="absolute inset-0 pointer-events-none">
            {visibleConditions.map((condition, index) => {
              if (!condition) return null;
              const Icon = condition.icon;
              const angle = (index * 60) - 90;
              const iconSize = Math.max(16, size * 0.25);
              const radius = size / 2 + iconSize / 2 + 4;
              const cx = Math.cos((angle * Math.PI) / 180) * radius;
              const cy = Math.sin((angle * Math.PI) / 180) * radius;
              
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
                        transform: `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`,
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
        
        {/* Token circle (wrapped in HoverCard when combat tooltip available and token is alive) */}
        {combatTooltip && !isDead ? (
          <HoverCard openDelay={150} closeDelay={80}>
            <HoverCardTrigger asChild>
              <div
                className={`w-full h-full rounded-full ${!imageUrl ? colorClasses[displayColor] : ''} border-2 ${
                  isSelected ? 'border-primary' : 'border-foreground/30'
                } transition-all duration-200 flex items-center justify-center font-bold text-white shadow-lg relative overflow-hidden ${flashClass}`}
                style={{
                  boxShadow: isSelected 
                    ? '0 0 0 3px hsl(var(--primary) / 0.3), 0 4px 12px rgba(0, 0, 0, 0.5)' 
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
                {floatingNumbers.some(f => f.type === 'crit') && (
                  <div className="absolute inset-0 rounded-full animate-crit-burst pointer-events-none"
                    style={{ border: '3px solid hsl(0, 84%, 60%)', background: 'hsl(0, 84%, 60% / 0.15)' }}
                  />
                )}
              </div>
            </HoverCardTrigger>
            <HoverCardContent
              side="right"
              align="start"
              sideOffset={12}
              className={`w-auto p-3 bg-card/95 backdrop-blur-sm border-border shadow-2xl pointer-events-none ${
                isActiveInitiative ? 'ring-2 ring-[hsl(48,95%,55%)]/60' : ''
              }`}
            >
              <CombatTokenTooltipContent data={combatTooltip} />
            </HoverCardContent>
          </HoverCard>
        ) : (
          <div
            className={`w-full h-full rounded-full ${!imageUrl ? colorClasses[displayColor] : ''} border-2 ${
              isSelected ? 'border-primary' : 'border-foreground/30'
            } transition-all duration-200 flex items-center justify-center font-bold text-white shadow-lg relative overflow-hidden ${flashClass}`}
            style={{
              boxShadow: isSelected 
                ? '0 0 0 3px hsl(var(--primary) / 0.3), 0 4px 12px rgba(0, 0, 0, 0.5)' 
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
            {floatingNumbers.some(f => f.type === 'crit') && (
              <div className="absolute inset-0 rounded-full animate-crit-burst pointer-events-none"
                style={{ border: '3px solid hsl(0, 84%, 60%)', background: 'hsl(0, 84%, 60% / 0.15)' }}
              />
            )}
          </div>
        )}
        
        {/* Floating damage/heal numbers */}
        {floatingNumbers.map((fn) => (
          <div
            key={fn.id}
            className="absolute left-1/2 -translate-x-1/2 animate-float-up pointer-events-none z-[150]"
            style={{ top: -10 }}
          >
            <span
              className="font-black text-lg drop-shadow-lg whitespace-nowrap"
              style={{
                color: fn.type === 'heal' ? 'hsl(142, 76%, 50%)' : 'hsl(0, 84%, 60%)',
                fontSize: fn.type === 'crit' ? size * 0.5 : size * 0.35,
                textShadow: fn.type === 'crit' 
                  ? '0 0 10px hsl(0, 84%, 60%), 0 2px 4px rgba(0,0,0,0.8)' 
                  : '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {fn.value > 0 ? `+${fn.value}` : fn.value}
              {fn.type === 'crit' && ' 💥'}
            </span>
          </div>
        ))}

        {/* HP Bar underneath the token */}
        {hpMax > 0 && status === 'active' && !hideHpBar && (
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
        
        {/* Token name label */}
        <div
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-card/90 backdrop-blur-sm rounded font-semibold text-card-foreground border border-border pointer-events-none"
          style={{ 
            top: hpMax > 0 && status === 'active' && !hideHpBar ? size + Math.max(4, size * 0.08) + 8 : size + 4,
            fontSize: Math.max(10, size * 0.2),
            padding: `${Math.max(2, size * 0.04)}px ${Math.max(6, size * 0.08)}px`,
            lineHeight: 1.2,
          }}
        >
          {name}
          {isDead && ' 💀'}
          {isInactive && ' ⏸️'}
        </div>

        {/* Quick action buttons (with invisible bridge to prevent hover gap) */}
        {!readOnly && showActions && (status === 'active' || isDead) && (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-[110]"
            style={{ top: -44, paddingBottom: 44 }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
            <div className="flex gap-1 relative z-[1]">
              {status === 'active' && onToggleHidden && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleHidden();
                  }}
                  className="p-1.5 bg-secondary hover:bg-muted rounded text-foreground transition-colors shadow-lg"
                  title={hidden ? 'Mostrar a los jugadores' : 'Ocultar a los jugadores'}
                >
                  {hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              )}
              {status === 'active' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkDead();
                  }}
                  className="p-1.5 bg-secondary hover:bg-muted rounded text-foreground transition-colors shadow-lg"
                  title="Marcar como muerto"
                >
                  <Skull className="w-4 h-4" />
                </button>
              )}
              {isDead && onRevive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRevive();
                  }}
                  className="p-1.5 bg-[hsl(142,76%,36%)] hover:bg-[hsl(142,76%,30%)] rounded text-white transition-colors shadow-lg"
                  title="Resucitar token"
                >
                  <Heart className="w-4 h-4" />
                </button>
              )}
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
          </div>
        )}

        {/* Rotation hint tooltip */}
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
