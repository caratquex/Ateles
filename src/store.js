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

// '#000000', '#888888', '#ffffff'
export const strokeColor = writable('#000000');

// 'solid', 'stroke', 'gradient'
export const fillMode = writable('solid');



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
export const journalLayout = writable(0);

// Current shaking intensity/state
export const shakeIntensity = writable(0);
export const hasShaken = writable(false);
export const cameraShakeIntensity = writable(0);
export const isCameraActive = writable(false);

// Fullscreen mode for viewing the visual without UI
export const isFullscreenVisual = writable(false);
