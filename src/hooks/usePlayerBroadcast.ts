import { useEffect, useRef, useCallback } from 'react';
import { MapData } from './useSessionStorage';

const CHANNEL_NAME = 'vtt-player-sync';

export interface PlayerViewState {
  mapImage: string | null;
  tokens: MapData['tokens'];
  showGrid: boolean;
  gridSize: number;
  gridColor: string;
  gridLineWidth: number;
  gridOffsetX: number;
  gridOffsetY: number;
  fogEnabled: boolean;
  fogData: string | null;
  cellStates: MapData['cellStates'];
}

/** GM side: broadcasts active map state to player view windows */
export const usePlayerBroadcastSender = () => {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    return () => {
      channelRef.current?.close();
    };
  }, []);

  const broadcast = useCallback((activeMap: MapData | null) => {
    if (!channelRef.current) return;
    const state: PlayerViewState = {
      mapImage: activeMap?.mapImage ?? null,
      tokens: activeMap?.tokens ?? [],
      showGrid: activeMap?.showGrid ?? true,
      gridSize: activeMap?.gridSize ?? 50,
      gridColor: activeMap?.gridColor ?? '#000000',
      gridLineWidth: activeMap?.gridLineWidth ?? 1,
      gridOffsetX: activeMap?.gridOffsetX ?? 0,
      gridOffsetY: activeMap?.gridOffsetY ?? 0,
      fogEnabled: activeMap?.fogEnabled ?? false,
      fogData: activeMap?.fogData ?? null,
      cellStates: activeMap?.cellStates ?? {},
    };
    channelRef.current.postMessage({ type: 'STATE_UPDATE', state });
  }, []);

  const openPlayerWindow = useCallback(() => {
    const w = window.open('/player-view', 'vtt-player-view', 'popup');
    if (w) {
      w.focus();
    }
  }, []);

  return { broadcast, openPlayerWindow };
};

/** Player side: listens for state updates from GM */
export const usePlayerBroadcastReceiver = (
  onStateUpdate: (state: PlayerViewState) => void
) => {
  const callbackRef = useRef(onStateUpdate);
  callbackRef.current = onStateUpdate;

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.type === 'STATE_UPDATE') {
        callbackRef.current(event.data.state);
      }
    };
    return () => channel.close();
  }, []);
};
