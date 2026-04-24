<script>
  import { appState, journalEntries } from './store.js';

  $: entry = $journalEntries[0]; // Just showing the latest for MVP

  function goHome() {
    appState.set('home');
  }
</script>

<div class="view-container" in:fade={{ duration: 500 }}>
  {#if entry}
    <div class="content" on:click={goHome}>
      <h1 class="title">{entry.title}</h1>
      <p class="date">{entry.date}</p>
      <p class="body-text">{entry.content}</p>
    </div>
  {:else}
    <div class="content" on:click={goHome}>
      <p>No entries yet. Tap to go back.</p>
    </div>
  {/if}
</div>

<script context="module">
  import { fade } from 'svelte/transition';
</script>

<style>
  .view-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    padding: 60px 24px;
    pointer-events: auto;
    overflow-y: auto;
  }

  .content {
    cursor: pointer;
  }

  .title {
    font-size: 2.5rem;
    font-weight: 400;
    margin-bottom: 4px;
    color: var(--text-main);
  }

  .date {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 24px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .body-text {
    font-size: 1.1rem;
    line-height: 1.6;
    color: var(--text-main);
    white-space: pre-wrap;
  }
</style>
