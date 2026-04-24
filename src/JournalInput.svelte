<script>
  import { appState, journalEntries } from './store.js';

  let title = '';
  let content = '';

  function save() {
    if (title || content) {
      const entry = {
        id: Date.now(),
        title: title || 'Untitled',
        content,
        date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })
      };
      journalEntries.update(entries => [entry, ...entries]);
      appState.set('journal_view');
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
    padding: 60px 24px 40px;
    pointer-events: auto;
  }

  .header-title {
    font-size: 1.8rem;
    font-weight: 400;
    text-align: center;
    margin-bottom: 24px;
    margin-top: auto;
  }

  .editor-card {
    flex: 1;
    max-height: 50vh;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
    background: var(--surface);
  }

  .title-input {
    font-family: inherit;
    font-size: 2rem;
    font-weight: 500;
    border: none;
    background: transparent;
    outline: none;
    color: var(--text-main);
  }

  .content-input {
    font-family: inherit;
    font-size: 1.1rem;
    line-height: 1.5;
    border: none;
    background: transparent;
    outline: none;
    resize: none;
    flex: 1;
    color: var(--text-main);
  }

  .title-input::placeholder, .content-input::placeholder {
    color: var(--text-secondary);
  }

  .actions {
    display: flex;
    gap: 16px;
    margin-top: auto;
  }

  .action-btn {
    flex: 1;
    padding: 16px;
    border-radius: 16px;
    font-size: 1.1rem;
    font-weight: 500;
  }

  .secondary {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-main);
  }

  .primary {
    background: var(--accent);
    color: #ffffff;
  }
</style>
