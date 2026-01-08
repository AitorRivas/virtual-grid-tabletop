import { useState, useRef, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  defaultPosition: Position;
  dragThreshold?: number; // Minimum pixels before drag starts
}

export const useDraggable = ({ defaultPosition, dragThreshold = 5 }: UseDraggableOptions) => {
  const [position, setPosition] = useState<Position>(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<Position>({ x: 0, y: 0 });
  const startPosRef = useRef<Position>({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const defaultPosRef = useRef<Position>(defaultPosition);

  // Update ref when defaultPosition changes, but don't trigger re-renders
  useEffect(() => {
    defaultPosRef.current = defaultPosition;
  }, [defaultPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      startPosRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
      hasDraggedRef.current = false;
      setIsDragging(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // Check if we've moved enough to consider it a drag
    const deltaX = Math.abs(e.clientX - startPosRef.current.x);
    const deltaY = Math.abs(e.clientY - startPosRef.current.y);
    
    if (!hasDraggedRef.current && deltaX < dragThreshold && deltaY < dragThreshold) {
      return; // Not a real drag yet
    }
    
    hasDraggedRef.current = true;
    
    const newX = e.clientX - offsetRef.current.x;
    const newY = e.clientY - offsetRef.current.y;
    
    // Clamp to viewport with margin
    const elementWidth = dragRef.current?.offsetWidth || 0;
    const elementHeight = dragRef.current?.offsetHeight || 0;
    const margin = 20; // Keep at least 20px visible
    
    const maxX = window.innerWidth - margin;
    const maxY = window.innerHeight - margin;
    const minX = margin - elementWidth;
    const minY = margin - elementHeight;
    
    setPosition({
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY)),
    });
  }, [isDragging, dragThreshold]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // resetPosition now uses the ref to avoid dependency on defaultPosition
  const resetPosition = useCallback(() => {
    setPosition(defaultPosRef.current);
  }, []);

  return {
    position,
    isDragging,
    dragRef,
    handleMouseDown,
    resetPosition,
  };
};
