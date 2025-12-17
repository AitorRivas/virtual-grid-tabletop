import { useState, useEffect, useCallback } from 'react';
import { TokenData } from '@/components/MapViewer';

const STORAGE_KEY = 'dnd-session';

interface SessionData {
  mapImage: string | null;
  tokens: TokenData[];
  showGrid: boolean;
  gridSize: number;
  gridColor: string;
  gridLineWidth: number;
  combatMode: boolean;
  currentTurnIndex: number;
  fogEnabled: boolean;
  fogData: string | null;
}

const defaultSession: SessionData = {
  mapImage: null,
  tokens: [],
  showGrid: true,
  gridSize: 50,
  gridColor: '#000000',
  gridLineWidth: 1,
  combatMode: false,
  currentTurnIndex: 0,
  fogEnabled: false,
  fogData: null,
};

export const useSessionStorage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [session, setSession] = useState<SessionData>(defaultSession);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SessionData;
        setSession(parsed);
      }
    } catch (error) {
      console.error('Error loading session from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever session changes (after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session to localStorage:', error);
    }
  }, [session, isLoaded]);

  const updateSession = useCallback((updates: Partial<SessionData>) => {
    setSession(prev => ({ ...prev, ...updates }));
  }, []);

  const clearSession = useCallback(() => {
    setSession(defaultSession);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    ...session,
    isLoaded,
    updateSession,
    clearSession,
  };
};
