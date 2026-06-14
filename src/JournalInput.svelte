<script>
  import { supabase } from './lib/supabase.js';
  import { appState, journalEntries, currentAtelesData, currentUser } from './store.js';

  let title = '';
  let content = '';
  let loading = false;
  let errorMsg = '';

  async function save() {
    if (!title && !content) return;
    loading = true;
    errorMsg = '';

    const entryData = {
      user_id: $currentUser ? $currentUser.id : null,
      title: title || 'Untitled',
      content,
      visual_data: $currentAtelesData
    };

    if ($currentUser) {
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .insert([entryData])
          .select()
          .single();

        if (error) {
          console.error('Error saving journal entry:', error);
          errorMsg = `Failed to save: ${error.message || 'Unknown error'}`;
          loading = false;
          return;
        }

        // Update local store chronologically with the database generated ID
        const localEntry = {
          id: data.id,
          title: data.title,
          content: data.content,
          created_at: data.created_at || new Date().toISOString(),
          date: new Date(data.created_at || Date.now()).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }),
          atelesData: data.visual_data
        };
        journalEntries.update(entries => [...entries, localEntry]);
        loading = false;
        appState.set('gallery');
        return;
      } catch (err) {
        console.error('Unexpected error saving entry:', err);
        errorMsg = 'An unexpected error occurred while saving.';
        loading = false;
        return;
      }
    } else {
      // Fallback for non-authenticated testing
      const localEntry = {
        id: Date.now(),
        title: entryData.title,
        content: entryData.content,
        created_at: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }),
        atelesData: entryData.ateles_data
      };
      journalEntries.update(entries => [...entries, localEntry]);
      loading = false;
      appState.set('gallery');
    }
    loading = false;
    appState.set('gallery');
  }

  function post() {
    save();
  }
</script>

<div class="journal-container" in:fade={{ duration: 500 }}>
  <h1 class="header-title">How was your day?</h1>
  
  {#if errorMsg}
    <div class="mb-4 bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm text-center">
      {errorMsg}
    </div>
  {/if}

  <div class="glass-panel editor-card">
    <input 
      type="text" 
      class="title-input" 
      placeholder="Title of your day..." 
      bind:value={title} 
      disabled={loading}
    />
    <textarea 
      class="content-input" 
      placeholder="Reflect on your thoughts here..." 
      bind:value={content}
      disabled={loading}
    ></textarea>
  </div>
  
  <div class="actions">
    <button class="action-btn secondary" on:click={save} disabled={loading || (!title && !content)}>
      {loading ? 'Saving...' : 'Save'}
    </button>
    <button class="action-btn primary" on:click={post} disabled={loading || (!title && !content)}>
      {loading ? 'Posting...' : 'Post'}
    </button>
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
    margin-bottom: var(--space-4);
    margin-top: auto;
    color: var(--color-text-primary);
  }

  @media (min-width: 48rem) {
    .header-title {
      margin-bottom: var(--space-6);
    }
  }

  .editor-card {
    flex: 1;
    min-height: 0;
    max-height: 80vh;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
    background: var(--color-glass);
  }

  @media (min-width: 48rem) {
    .editor-card {
      padding: var(--space-6);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
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
    gap: var(--space-3);
    margin-top: auto;
    flex-shrink: 0;
  }

  @media (min-width: 48rem) {
    .actions {
      gap: var(--space-4);
    }
  }

  .action-btn {
    flex: 1;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--font-body-lg);
    font-weight: var(--weight-medium);
    letter-spacing: 0.02em;
    transition: all var(--duration-normal) var(--easing-default);
  }

  @media (min-width: 48rem) {
    .action-btn {
      padding: var(--space-4);
    }
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
