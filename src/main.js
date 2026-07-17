import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const target = document.getElementById('app');
const app = target ? mount(App, { target }) : null;

// Register Service Worker for PWA / Offline Fallback
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('[Service Worker] Registered with scope:', registration.scope);
    }).catch(error => {
      console.error('[Service Worker] Registration failed:', error);
    });
  });
}

export default app
