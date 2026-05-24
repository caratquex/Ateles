<script>
  import { appState, journalEntries, currentAtelesData } from './store.js';

  let title = '';
  let content = '';

  function save() {
    if (title || content) {
      const entry = {
        id: Date.now(),
        title: title || 'Untitled',
        content,
        date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }),
        atelesData: $currentAtelesData
      };
      // Append to the bottom so newest are at the bottom (like a calendar)
      journalEntries.update(entries => [...entries, entry]);
      appState.set('gallery');
    }
  }

  function post() {
    // For now, post acts like save
    save();
  }
</script>

<div class="journal-container" in:fade={{ duration: 500 }}>
  <h1 class="header-title">How was your day?</h1>
  
  <div class="glass-panel editor-card">
    <input 
      type="text" 
      class="title-input" 
      placeholder="Lorem ipsum" 
      bind:value={title} 
    />
    <textarea 
      class="content-input" 
      placeholder="Lorem ipsum dolor sit amet..." 
      bind:value={content}
    ></textarea>
  </div>
  
  <div class="actions">
    <button class="action-btn secondary" on:click={save}>Save</button>
    <button class="action-btn primary" on:click={post}>Post</button>
  </div>
</div>

<script context="module">
  import { fade } from 'svelte/transition';
</script>

<style>
  .journal-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    display: flex;
    flex-direction: column;
    padding: var(--page-padding-top) var(--page-padding-x) var(--page-padding-bottom);
    pointer-events: auto;
  }

  .header-title {
    font-size: var(--font-h2);
    font-weight: var(--weight-regular);
    letter-spacing: -0.01em;
    text-align: center;
    margin-bottom: var(--space-6);
    margin-top: auto;
    color: var(--color-text-primary);
  }

  .editor-card {
    flex: 1;
    max-height: 80vh;
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
    background: var(--color-glass);
  }

  .title-input {
    font-family: var(--font-family);
    font-size: var(--font-h1);
    font-weight: var(--weight-medium);
    letter-spacing: -0.015em;
    border: none;
    background: transparent;
    outline: none;
    color: var(--color-text-primary);
  }

  .content-input {
    font-family: var(--font-family);
    font-size: var(--font-body-lg);
    font-weight: var(--weight-regular);
    line-height: 1.5;
    letter-spacing: 0.01em;
    border: none;
    background: transparent;
    outline: none;
    resize: none;
    flex: 1;
    color: var(--color-text-primary);
    overflow-y: auto;
    scrollbar-width: none;
  }
  .content-input::-webkit-scrollbar {
    display: none;
  }

  .title-input::placeholder, .content-input::placeholder {
    color: var(--color-text-secondary);
  }

  .actions {
    display: flex;
    gap: var(--space-4);
    margin-top: auto;
  }

  .action-btn {
    flex: 1;
    padding: var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--font-body-lg);
    font-weight: var(--weight-medium);
    letter-spacing: 0.02em;
    transition: all var(--duration-normal) var(--easing-default);
  }

  .secondary {
    background: rgba(0, 0, 0, 0.05);
    color: var(--color-text-primary);
  }

  .secondary:hover {
    background: rgba(0, 0, 0, 0.08);
  }

  .primary {
    background: var(--color-accent);
    color: var(--color-text-inverse);
    box-shadow: var(--shadow-md);
  }

  .primary:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-1px);
  }
</style>
