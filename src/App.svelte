<script>
  import P5Canvas from './P5Canvas.svelte';
  import Home from './Home.svelte';
  import JournalInput from './JournalInput.svelte';
  import JournalView from './JournalView.svelte';
  import Gallery from './Gallery.svelte';
  import { appState, activeTheme, activeEntryId, visualPhase, clearCanvasTrigger } from './store.js';

  let menuOpen = false;
  const themes = ['light', 'dark', 'warm', 'cool'];

  function cycleTheme() {
    const currentIndex = themes.indexOf($activeTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    activeTheme.set(themes[nextIndex]);
  }

  /** @param {string} str */
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function goHome() {
    activeEntryId.set(null);
    clearCanvasTrigger.update(v => v + 1);
    appState.set('home');
    menuOpen = false;
  }

  function goGallery() {
    appState.set('gallery');
    menuOpen = false;
  }

  $: {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', $activeTheme);
    }
  }
</script>

<main class="w-screen h-screen overflow-hidden relative">
  <P5Canvas />
  
  {#if $appState === 'home'}
    <Home />
  {:else if $appState === 'journal_input'}
    <JournalInput />
  {:else if $appState === 'journal_view'}
    <JournalView />
  {:else if $appState === 'gallery'}
    <Gallery />
  {/if}

  <div class="absolute top-6 right-6 z-[100]">
    <button class="bg-transparent border-none text-text-primary cursor-pointer p-2 flex" on:click={() => menuOpen = !menuOpen}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
    {#if menuOpen}
      <div class="absolute top-full right-0 mt-2 bg-bg border border-border-default rounded-md shadow-md flex flex-col min-w-[150px] overflow-hidden">
        <button class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0" on:click={cycleTheme}>Theme: {capitalize($activeTheme)}</button>
        <button class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0" on:click={goHome}>Home</button>
        <button class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0" on:click={goGallery}>Gallery</button>
        <button class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0" on:click={() => { appState.set('journal_view'); menuOpen = false; }}>Journal</button>
      </div>
    {/if}
  </div>
</main>
