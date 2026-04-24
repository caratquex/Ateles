import { writable } from 'svelte/store';

// 'home', 'journal_input', 'journal_view'
export const appState = writable('home');

// Journal entries
export const journalEntries = writable([]);

// Current shaking intensity/state
export const shakeIntensity = writable(0);
export const hasShaken = writable(false);
