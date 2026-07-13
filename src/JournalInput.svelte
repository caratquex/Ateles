<script>
  import { supabase } from './lib/supabase.js';
  import { appState, journalEntries, currentAtelesData, currentUser, activeEntryId, journalSaveTrigger, journalCancelTrigger } from './store.js';
  import { onMount, onDestroy } from 'svelte';

  let title = '';
  let content = '';
  let loading = false;
  let errorMsg = '';

  let entryId = $activeEntryId;
  let autosaveStatus = 'Saved'; // 'Saved', 'Saving...', 'Unsaved changes', 'Error saving'
  let autosaveTimeout;
  let isInitialLoad = true;

  let unsubSave;
  let unsubCancel;

  onMount(() => {
    // Reset triggers to prevent immediate redirection from historical values
    journalSaveTrigger.set(0);
    journalCancelTrigger.set(0);

    if (entryId) {
      const entry = $journalEntries.find(e => e.id === entryId);
      if (entry) {
        title = entry.title || '';
        content = entry.content || '';
        if (entry.atelesData) {
          currentAtelesData.set(entry.atelesData);
        }
      }
    }

    // Subscribe to global bottom-row triggers
    unsubSave = journalSaveTrigger.subscribe(val => {
      if (val > 0) {
        handleDone();
      }
    });

    unsubCancel = journalCancelTrigger.subscribe(val => {
      if (val > 0) {
        handleBack();
      }
    });

    setTimeout(() => {
      isInitialLoad = false;
    }, 200);
  });

  onDestroy(() => {
    if (unsubSave) unsubSave();
    if (unsubCancel) unsubCancel();
  });

  function triggerAutosave() {
    if (!title && !content) return;
    autosaveStatus = 'Unsaved changes';
    clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(async () => {
      await performAutosave();
    }, 1500);
  }

  let currentSavePromise = null;

  async function performAutosave() {
    if (!title && !content && entryId) return; // Allow first save even if empty
    autosaveStatus = 'Saving...';
    errorMsg = '';

    currentSavePromise = (async () => {

    const entryData = {
      user_id: $currentUser ? $currentUser.id : null,
      title: title || 'Untitled',
      content,
      visual_data: $currentAtelesData
    };

    if ($currentUser) {
      try {
        if (entryId) {
          // Update existing record
          const { data, error } = await supabase
            .from('journal_entries')
            .update(entryData)
            .eq('id', entryId)
            .select()
            .single();

          if (error) {
            console.error('Error auto-saving journal entry:', error);
            autosaveStatus = 'Error saving';
            errorMsg = `Failed to auto-save: ${error.message || 'Unknown error'}`;
            return;
          }

          const localEntry = {
            id: data.id,
            title: data.title,
            content: data.content,
            created_at: data.created_at || new Date().toISOString(),
            date: new Date(data.created_at || Date.now()).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }),
            atelesData: data.visual_data
          };

          journalEntries.update(entries => {
            const idx = entries.findIndex(e => e.id === entryId);
            if (idx !== -1) {
              const updated = [...entries];
              updated[idx] = localEntry;
              return updated;
            }
            return [...entries, localEntry];
          });

          autosaveStatus = 'Saved';
        } else {
          // Insert new record
          let tempId = entryId || ('temp-' + Date.now());
          entryId = tempId;
          
          const optimisticEntry = {
            id: tempId,
            title: entryData.title,
            content: entryData.content,
            created_at: new Date().toISOString(),
            date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }),
            atelesData: entryData.visual_data,
            optimistic: true
          };

          journalEntries.update(entries => {
            const exists = entries.find(e => e.id === tempId);
            if (!exists) return [...entries, optimisticEntry];
            return entries;
          });

          const { data, error } = await supabase
            .from('journal_entries')
            .insert([entryData])
            .select()
            .single();

          if (error) {
            console.error('Error auto-saving journal entry:', error);
            autosaveStatus = 'Error saving';
            errorMsg = `Failed to auto-save: ${error.message || 'Unknown error'}`;
            // Optional: remove optimistic entry on failure
            return;
          }

          // Replace temp entry with real data
          entryId = data.id;
          
          journalEntries.update(entries => {
            const updated = [...entries];
            const idx = updated.findIndex(e => e.id === tempId);
            const finalEntry = {
              id: data.id,
              title: data.title,
              content: data.content,
              created_at: data.created_at || new Date().toISOString(),
              date: new Date(data.created_at || Date.now()).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }),
              atelesData: data.visual_data
            };
            if (idx !== -1) {
              updated[idx] = finalEntry;
            } else {
              updated.push(finalEntry);
            }
            return updated;
          });
          
          autosaveStatus = 'Saved';
        }
      } catch (err) {
        console.error('Unexpected error auto-saving entry:', err);
        autosaveStatus = 'Error saving';
        errorMsg = 'An unexpected error occurred while auto-saving.';
      }
    } else {
      // Local storage test/fallback mode
      if (entryId) {
        const localEntry = {
          id: entryId,
          title: entryData.title,
          content: entryData.content,
          created_at: new Date().toISOString(),
          date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }),
          atelesData: entryData.visual_data
        };
        journalEntries.update(entries => {
          const idx = entries.findIndex(e => e.id === entryId);
          if (idx !== -1) {
            const updated = [...entries];
            updated[idx] = localEntry;
            return updated;
          }
          return [...entries, localEntry];
        });
      } else {
        entryId = Date.now();
        activeEntryId.set(entryId);
        const localEntry = {
          id: entryId,
          title: entryData.title,
          content: entryData.content,
          created_at: new Date().toISOString(),
          date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }),
          atelesData: entryData.visual_data
        };
        journalEntries.update(entries => [...entries, localEntry]);
      }
      autosaveStatus = 'Saved';
    }
    })();
    await currentSavePromise;
    currentSavePromise = null;
  }

  async function handleDone() {
    clearTimeout(autosaveTimeout);
    
    if (autosaveStatus === 'Unsaved changes' || (!String(entryId).startsWith('temp-') && !entryId && autosaveStatus !== 'Saving...')) {
      performAutosave(); // Fire and forget
    }
    
    activeEntryId.set(null);
    appState.set('gallery');
  }

  async function handleBack() {
    clearTimeout(autosaveTimeout);
    if (autosaveStatus === 'Unsaved changes') {
      performAutosave(); // Fire and forget
    }
    activeEntryId.set(null);
    appState.set('gallery');
  }

  $: {
    if (!isInitialLoad && (title || content)) {
      triggerAutosave();
    }
  }

  $: wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  $: charCount = content ? content.length : 0;
</script>

<div class="journal-container" in:fade={{ duration: 500 }}>
  <header class="editor-header">
    <div class="status-indicator">
      {#if autosaveStatus === 'Saving...'}
        <span class="pulse-dot"></span>
      {/if}
      {autosaveStatus}
    </div>
  </header>

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
      maxlength="100"
    />
    <textarea 
      class="content-input" 
      placeholder="Reflect on your thoughts here..." 
      bind:value={content}
      disabled={loading}
      maxlength="2500"
    ></textarea>
    <div class="editor-footer">
      <span class="counter-text {charCount >= 2200 ? (charCount >= 2500 ? 'at-limit' : 'near-limit') : ''}">
        {wordCount} {wordCount === 1 ? 'word' : 'words'} &nbsp;•&nbsp; {charCount.toLocaleString()}/2,500 chars
      </span>
    </div>
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
    padding: var(--page-padding-top) var(--page-padding-x) 108px;
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

  .editor-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-2);
    margin-top: auto;
    font-size: var(--font-caption);
    flex-shrink: 0;
  }

  .counter-text {
    color: var(--color-text-tertiary);
    font-weight: var(--weight-medium);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    transition: color var(--duration-normal) var(--easing-default);
  }

  .counter-text.near-limit {
    color: #D97706;
  }

  .counter-text.at-limit {
    color: #DC2626;
    animation: shake 0.3s ease;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }

  .title-input::placeholder, .content-input::placeholder {
    color: var(--color-text-secondary);
  }

  .editor-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
    margin-bottom: var(--space-4);
    flex-shrink: 0;
  }

  .status-indicator {
    font-size: var(--font-caption);
    color: var(--color-text-secondary);
    font-weight: var(--weight-medium);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    background-color: var(--color-accent);
    border-radius: var(--radius-circle);
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.5);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 6px rgba(0, 0, 0, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    }
  }
</style>
