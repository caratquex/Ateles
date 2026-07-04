import { writable } from 'svelte/store';

// 'home', 'journal_input', 'journal_view', 'auth'
export const appState = writable('auth');

// Currently authenticated Supabase user
/** @type {import('svelte/store').Writable<import('@supabase/supabase-js').User | null>} */
export const currentUser = writable(null);

// 'light', 'dark', 'warm', 'cool'
export const activeTheme = writable('light');

// 'drawing', 'ready_to_shake', 'breaking', 'bloom'
export const visualPhase = writable('drawing');

// 'ellipse', 'rect', 'line'
export const strokeType = writable('rect');

// custom character for stamp_char
export const stampChar = writable('A');

// '#000000', '#888888', '#ffffff'
export const strokeColor = writable('#000000');

// Brush size multiplier (0.2 to 3.0)
export const strokeSize = writable(1.0);

// Brush opacity multiplier (0.1 to 1.0)
export const strokeOpacity = writable(1.0);

// 'solid', 'stroke', 'gradient'
export const fillMode = writable('solid');

// 'chaos', 'orbits', 'perlin', 'matrix', 'geometric_web', 'mandala_wave'
export const shakeMode = writable('chaos');


// Journal entries
/** @type {import('svelte/store').Writable<any[]>} */
export const journalEntries = writable([]);

// Currently viewed journal entry ID (null means viewing live/new)
/** @type {import('svelte/store').Writable<number | string | null>} */
export const activeEntryId = writable(null);

// Captured Ateles data for the current session
/** @type {import('svelte/store').Writable<any>} */
export const currentAtelesData = writable(null);

// Trigger to explicitly clear the canvas shards
export const clearCanvasTrigger = writable(0);

// Trigger to save the visual as PNG
export const saveVisualTrigger = writable(0);

// Journal view layout variant (0, 1, 2)
export const journalLayout = writable(2);

// Current shaking intensity/state
export const shakeIntensity = writable(0);
export const hasShaken = writable(false);
export const cameraShakeIntensity = writable(0);
export const isCameraActive = writable(false);

// Fullscreen mode for viewing the visual without UI
export const isFullscreenVisual = writable(false);

// Tracks if there is active drawing on the canvas
export const hasDrawing = writable(false);

// Triggers for bottom-row action buttons in journal editor
export const journalSaveTrigger = writable(0);
export const journalCancelTrigger = writable(0);

