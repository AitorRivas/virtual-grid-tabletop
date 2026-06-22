
# Estados, Variantes de Escena y Overlays

Antes de empezar quiero confirmar algunos puntos críticos porque el alcance es grande y toca arquitectura central (tokens, mapas, escenas, sincronización GM↔Player, niebla, combate).

## Puntos a confirmar antes de implementar

1. **Condiciones ya existen.** El proyecto ya tiene `ConditionManager` con 43 condiciones D&D (Envenenado, Paralizado, Cegado, Aturdido, Caído, Invisible… ya están). ¿Quieres que **reutilice ese sistema** y solo añada (a) acceso desde el menú contextual del token y (b) la capacidad de crear estados personalizados con icono subido? ¿O prefieres un sistema paralelo nuevo "Estados" distinto de las "Condiciones"?

2. **Migración de escenas.** Hoy `SceneData` tiene un único `mapId` y los tokens viven en `MapData`. Mover tokens a la escena rompe el modelo actual donde un mapa puede usarse sin escena. Propongo:
   - Mantener `MapData` como hoy (tokens incluidos) para no romper sesiones existentes.
   - Añadir un **modo Escena**: cuando una escena tiene `variants[]`, los tokens/HP/iniciativa/estados/FoW pasan a vivir en la escena y las variantes solo aportan imagen (+ grid opcional).
   - Migración automática: escenas existentes siguen funcionando con su `mapId` único; al añadir una segunda variante, los tokens del mapa actual se "promueven" a la escena.
   ¿OK con este enfoque incremental, o prefieres refactor duro (tokens **siempre** en escena)?

3. **Niebla y grid por variante.** Si el puente intacto y el derrumbado tienen la misma geometría, la niebla y el grid deberían compartirse. Si las variantes pueden tener resoluciones distintas, no. Asumo: **grid y niebla viven en la escena** (compartidos entre variantes), y la variante solo aporta la imagen. ¿Correcto?

## Plan de implementación (si confirmas lo anterior)

### 1. Estados personalizados en tokens
- Añadir `customStates?: TokenState[]` al tipo Token (junto a `conditions` existentes).
  ```ts
  type TokenState = { id; name; iconUrl; color?; createdAt }
  ```
- Almacén global de estados personalizados (localStorage + opcional Supabase `custom_states` para compartir): nombre + icono base64 + color.
- Menú contextual del token → "Añadir estado" → popover con:
  - lista de condiciones predefinidas (reutiliza `conditions.ts`)
  - lista de estados personalizados del usuario
  - botón "Crear estado personalizado" (nombre, upload icono PNG/SVG, color picker)
- Renderizado: pequeños iconos (16-20px) en una fila bajo o sobre el token, mezclando condiciones existentes + custom. Tooltip con el nombre. Click sobre el icono lo elimina.
- Los estados se serializan dentro del token → ya persisten al cambiar de mapa/escena/variante.

### 2. Variantes de mapa por escena
Modificación del store:
```ts
SceneData {
  ...existing,
  variants?: MapVariant[],         // nuevo, opcional
  activeVariantId?: string | null, // nuevo
  sceneTokens?: Token[],           // tokens "promovidos" a la escena
  sceneFog?: string | null,        // niebla compartida entre variantes
  sceneGrid?: { cellSize, offsetX, offsetY, show, color, width } // opcional
}

MapVariant {
  id, name, image: string|null,
  // opcional: override de grid si la imagen tiene otra resolución
  gridOverride?: { cellSize, offsetX, offsetY } | null
}
```
- Hook `useActiveCanvas()` que devuelve, según contexto:
  - Si escena tiene `variants`: imagen = variante activa; tokens/fog/grid = de la escena.
  - Si no: comportamiento actual (todo del mapa).
- `MapViewer` lee de ese hook. Cambio de variante = solo reemplaza `mapImage`. Tokens, HP, iniciativa, FoW, estados, overlays = intactos.
- Sincronización GM↔Player: añadir `activeVariantId` al broadcast del store; el Player ya rerenderiza por `useSyncExternalStore`.

### 3. Overlays por escena
```ts
SceneOverlay {
  id, name, imageUrl, visible: boolean,
  x: number, y: number,        // en coords de mapa (igual que tokens)
  scale: number,               // 1 = tamaño nativo
  rotation?: number,
  opacity?: number,
  zIndex?: number              // para ordenar entre sí
}
SceneData.overlays?: SceneOverlay[]
```
- Capa de render nueva en `MapViewer`, entre **Map** y **Grid** (o entre Grid y FoW; lo haré configurable por overlay con `zIndex`, default = sobre el mapa, bajo la niebla).
- Drag/resize del overlay solo en vista GM (handles en esquinas como un token grande). En Player View: render-only, respetando `visible`.
- Upload de imagen → base64 (consistente con el resto del proyecto, sin servidor).

### 4. Panel "Gestión de Escena"
Nuevo panel flotante (estilo de los existentes, con `useDraggable` y clamping):
- Selector de variante activa (radio/segmented).
- Lista de variantes con: nombre, miniatura, botones añadir/renombrar/eliminar/duplicar, cambiar imagen.
- Lista de overlays con: checkbox visible, nombre, miniatura, botones mover/escalar/eliminar.
- Botón "Promover mapa actual a escena con variantes" (migración guiada).

## Detalles técnicos

- **Sin romper sesiones existentes**: todos los campos nuevos son opcionales. Tokens siguen leyéndose de `activeMap.tokens` por defecto; el hook `useActiveCanvas` devuelve `scene.sceneTokens ?? activeMap.tokens`.
- **Combate global** (`globalCombat`) ya guarda `mapId` por entrada. Añadiré soporte para `sceneId` opcional; si la entrada tiene `sceneId`, "Ir al combatiente" navega a esa escena en lugar de a un mapa.
- **Player View**: clamping del viewport ya está por `activeMap.id`; lo extenderé a `scene.id + activeVariantId` para que un cambio de variante no descentre la cámara (si las imágenes tienen resoluciones distintas, recentrar; si son iguales, conservar zoom).
- **Memorias a actualizar** tras la implementación: `core-virtual-tabletop`, `gestion-de-escenas`, `condition-system`, `layered-rendering-model`.

## Archivos principales a tocar
- `src/stores/gameState.ts`, `src/hooks/useGameState.ts` — tipos + acciones (`addVariant`, `setActiveVariant`, `addOverlay`, `toggleOverlay`, `addTokenState`, `removeTokenState`, `createCustomState`).
- `src/components/Token.tsx` — render de iconos de estados.
- `src/components/MapContextMenu.tsx` (o el menú de token) — entrada "Añadir estado".
- Nuevo `src/components/TokenStatesPopover.tsx`.
- Nuevo `src/components/CustomStatesLibrary.tsx` (gestión global).
- `src/components/MapViewer.tsx` — capa de overlays + lectura desde `useActiveCanvas`.
- Nuevo `src/components/SceneVariantsPanel.tsx` y `src/components/OverlaysPanel.tsx` (o uno solo "ScenePanel").
- `src/components/SceneManager.tsx` — botón abrir panel + migración.
- `src/pages/PlayerView.tsx` — leer variante/overlays del store.
- Nuevo `src/hooks/useActiveCanvas.ts`.

## Lo que NO incluye este plan
- Animación de overlays (fuego animado, etc.) — quedan como imágenes estáticas/transparentes.
- Estados con duración/turnos automáticos (sería trivial añadir después si lo pides).
- Compartir estados personalizados entre cuentas vía Supabase (lo dejo como follow-up; en v1 viven en localStorage del GM).

¿Confirmas los 3 puntos del inicio y procedo?
