/**
 * Lightweight structured debug logger.
 *
 * Categories used across the app (keep in sync as you add):
 *   map:switch       — Active map changed
 *   mapReady         — Player View map pipeline ready
 *   cameraReady      — Player View camera hydration finished
 *   fogReady         — Player View fog restored or bypassed
 *   renderUnlocked   — Player View render gate opened
 *   renderUnlockForced — Player View render gate opened by failsafe
 *   camera:save      — Camera snapshot persisted
 *   camera:restore   — Camera snapshot restored
 *   camera:default   — Default camera applied (no snapshot)
 *   camera:broadcast — DM camera broadcast to Player View
 *   fog:apply        — Fog of war painted/restored
 *   combat:init      — Combat started
 *   combat:end       — Combat ended
 *   combat:cleanup   — Stale combat entries removed
 *   combat:next      — Turn advanced
 *   tokens:add       — Token(s) appended to active map
 *   tokens:clamp     — Token coordinates corrected to map bounds
 *   tokens:remove    — Token removed
 *   encounter:deploy — Encounter deployed to map (with count)
 *   audio:load       — Audio asset loaded
 *   audio:error      — Audio playback failure
 *   sync:player      — DM→Player sync action applied
 *
 * Activate with VITE_DEBUG=true at build time, or call window.__VTT_DEBUG = true at runtime.
 */

const buildFlag = (() => {
  try {
    return import.meta.env?.VITE_DEBUG === 'true' || import.meta.env?.VITE_DEBUG === true;
  } catch {
    return false;
  }
})();

const isEnabled = (): boolean => {
  if (buildFlag) return true;
  if (typeof window !== 'undefined' && (window as any).__VTT_DEBUG === true) return true;
  return false;
};

export type DebugCategory =
  | 'map:switch'
  | 'mapReady'
  | 'cameraReady'
  | 'fogReady'
  | 'renderUnlocked'
  | 'renderUnlockForced'
  | 'camera:save'
  | 'camera:restore'
  | 'camera:default'
  | 'camera:broadcast'
  | 'fog:apply'
  | 'combat:init'
  | 'combat:end'
  | 'combat:cleanup'
  | 'combat:next'
  | 'tokens:add'
  | 'tokens:clamp'
  | 'tokens:remove'
  | 'encounter:deploy'
  | 'audio:load'
  | 'audio:error'
  | 'sync:player';

export const log = (category: DebugCategory, payload?: Record<string, unknown>) => {
  if (!isEnabled()) return;
  // eslint-disable-next-line no-console
  console.log(`%c[${category}]`, 'color:#a78bfa;font-weight:600', payload ?? '');
};

export const warn = (category: DebugCategory, payload?: Record<string, unknown>) => {
  // Always emit warnings (cheap and useful in production for invariant violations).
  // eslint-disable-next-line no-console
  console.warn(`[${category}]`, payload ?? '');
};

export const error = (category: DebugCategory | string, payload?: Record<string, unknown> | Error) => {
  // eslint-disable-next-line no-console
  console.error(`[${category}]`, payload ?? '');
};

/** Enable/disable debug logging at runtime (call from devtools). */
if (typeof window !== 'undefined') {
  (window as any).__vttEnableDebug = (on = true) => {
    (window as any).__VTT_DEBUG = on;
    // eslint-disable-next-line no-console
    console.log(`VTT debug logging ${on ? 'ENABLED' : 'DISABLED'}`);
  };
}
