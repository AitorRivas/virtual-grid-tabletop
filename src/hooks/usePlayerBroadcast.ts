import { useEffect, useRef, useCallback } from 'react';
import { MapData, SceneData } from './useSessionStorage';

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
  // Narrative overlay
  narrativeOverlay: {
    image: string | null;
    text: string;
    visible: boolean;
  };
}

/** GM side: broadcasts active map state to player view windows */
export const usePlayerBroadcastSender = () => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const latestStateRef = useRef<PlayerViewState | null>(null);

  const buildState = useCallback((
    activeMap: MapData | null,
    narrativeOverlay?: { image: string | null; text: string; visible: boolean }
  ): PlayerViewState => ({
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
    narrativeOverlay: narrativeOverlay ?? { image: null, text: '', visible: false },
  }), []);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    // Listen for state requests from player views
    channel.onmessage = (event) => {
      if (event.data?.type === 'REQUEST_STATE' && latestStateRef.current) {
        channel.postMessage({ type: 'STATE_UPDATE', state: latestStateRef.current });
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const broadcast = useCallback((
    activeMap: MapData | null,
    narrativeOverlay?: { image: string | null; text: string; visible: boolean }
  ) => {
    const state = buildState(activeMap, narrativeOverlay);
    latestStateRef.current = state;
    channelRef.current?.postMessage({ type: 'STATE_UPDATE', state });
  }, [buildState]);

  const openPlayerWindow = useCallback(() => {
    const w = window.open('/player-view', 'vtt-player-view', 'popup');
    if (w) {
      w.focus();
      // Re-broadcast current state after a short delay for the new window to set up its listener
      setTimeout(() => {
        if (latestStateRef.current) {
          channelRef.current?.postMessage({ type: 'STATE_UPDATE', state: latestStateRef.current });
        }
      }, 500);
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
