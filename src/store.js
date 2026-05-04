import { writable } from 'svelte/store';

// 'home', 'journal_input', 'journal_view'
export const appState = writable('home');

// 'drawing', 'ready_to_shake', 'breaking', 'bloom'
export const visualPhase = writable('drawing');

// 'ellipse', 'rect', 'line'
export const strokeType = writable('rect');

// '#000000', '#888888', '#ffffff'
export const strokeColor = writable('#000000');



// Journal entries
export const journalEntries = writable([]);

// Current shaking intensity/state
export const shakeIntensity = writable(0);
export const hasShaken = writable(false);
