<script>
  import { supabase } from './lib/supabase.js';
  import { appState, journalEntries, currentAtelesData, currentUser, activeEntryId, journalSaveTrigger, journalCancelTrigger } from './store.js';
  import { onMount, onDestroy } from 'svelte';

  const AUTOSAVE_DELAY = 800;
  const JOURNAL_COLUMNS = 'id, title, content, created_at, visual_data';
  let title = '';
  let content = '';
  let loading = false;
  let errorMsg = '';
  let entryId = $activeEntryId;
  let autosaveStatus = 'Saved';
  let autosaveTimeout;
  let isInitialLoad = true;
  let saveInFlight = null;
  let saveQueued = false;
  let backupRevision = 0;
  let unsubSave;
  let unsubCancel;

  function backupKey() {
    return `ateles_unsaved_backup_${$currentUser?.id || 'guest'}`;
  }

  function formatEntry(data) {
    const createdAt = data.created_at || new Date().toISOString();
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      created_at: createdAt,
      date: new Date(createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }),
      atelesData: data.visual_data,
    };
  }

  function replaceLocalEntry(entry) {
    journalEntries.update((entries) => {
      const index = entries.findIndex((item) => String(item.id) === String(entry.id));
      if (index === -1) return [...entries, entry];
      const updated = [...entries];
      updated[index] = entry;
      return updated;
    });
  }

  function writeBackup() {
    backupRevision += 1;
    try {
      localStorage.setItem(backupKey(), JSON.stringify({
        id: entryId, title, content, visual_data: $currentAtelesData, timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error writing journal backup:', error);
    }
  }

  function removeBackup() {
    try {
      localStorage.removeItem(backupKey());
      localStorage.removeItem('ateles_unsaved_backup');
    } catch (error) {
      console.error('Error removing journal backup:', error);
    }
  }

  function restoreBackup() {
    try {
      // Read the legacy key too, so an entry started before this update remains recoverable.
      const backupString = localStorage.getItem(backupKey()) || localStorage.getItem('ateles_unsaved_backup');
      if (!backupString) return;
      const backup = JSON.parse(backupString);
      const isMatchingEntry = entryId && String(backup.id) === String(entryId);
      const isNewEntryBackup = !entryId && (!backup.id || String(backup.id).startsWith('temp-'));
      if (!isMatchingEntry && !isNewEntryBackup) return;

      if (confirm('We found an unsaved backup of this journal entry. Would you like to restore it?')) {
        title = backup.title || '';
        content = backup.content || '';
        if (backup.visual_data) currentAtelesData.set(backup.visual_data);
        autosaveStatus = 'Unsaved changes';
        backupRevision += 1;
      } else {
        removeBackup();
        localStorage.removeItem('ateles_unsaved_backup');
      }
    } catch (error) {
      console.error('Error reading journal backup:', error);
    }
  }

  function triggerAutosave() {
    autosaveStatus = 'Unsaved changes';
    writeBackup();
    clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => { performAutosave(); }, AUTOSAVE_DELAY);
  }

  async function saveGuestEntry(snapshot) {
    if (!entryId) entryId = `guest-${Date.now()}`;
    const entry = formatEntry({ id: entryId, title: snapshot.title, content: snapshot.content, visual_data: snapshot.visual_data, created_at: new Date().toISOString() });
    replaceLocalEntry(entry);
    try {
      const entries = JSON.parse(localStorage.getItem('ateles_guest_journal_entries') || '[]');
      const index = entries.findIndex((item) => String(item.id) === String(entry.id));
      if (index === -1) entries.push(entry);
      else entries[index] = entry;
      localStorage.setItem('ateles_guest_journal_entries', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving guest journal entry:', error);
    }
  }

  async function saveSnapshot() {
    const revisionAtStart = backupRevision;
    const snapshot = { title: title || 'Untitled', content, visual_data: $currentAtelesData };
    autosaveStatus = 'Saving...';
    errorMsg = '';

    try {
      if (!$currentUser) {
        await saveGuestEntry(snapshot);
      } else {
        let data;
        let error;
        if (entryId) {
          // A finished visual never changes. Do not resend the potentially large shard
          // payload on every keystroke; only the journal text needs updating.
          ({ data, error } = await supabase
            .from('journal_entries')
            .update({ title: snapshot.title, content: snapshot.content })
            .eq('id', entryId)
            .eq('user_id', $currentUser.id)
            .select(JOURNAL_COLUMNS)
            .single());
        } else {
          ({ data, error } = await supabase
            .from('journal_entries')
            .insert([{ user_id: $currentUser.id, ...snapshot }])
            .select(JOURNAL_COLUMNS)
            .single());
        }
        if (error) throw error;
        entryId = data.id;
        replaceLocalEntry(formatEntry(data));
      }

      if (backupRevision === revisionAtStart) {
        autosaveStatus = 'Saved';
        removeBackup();
      } else {
        autosaveStatus = 'Unsaved changes';
      }
      return true;
    } catch (error) {
      console.error('Error saving journal entry:', error);
      autosaveStatus = 'Error saving';
      errorMsg = 'Could not save this entry. Your latest version is kept on this device; check your connection and try again.';
      return false;
    }
  }

  async function performAutosave() {
    clearTimeout(autosaveTimeout);
    saveQueued = true;
    if (saveInFlight) return saveInFlight;

    saveInFlight = (async () => {
      let saved = true;
      while (saveQueued) {
        saveQueued = false;
        saved = await saveSnapshot();
        if (!saved && !saveQueued) return false;
      }
      return saved;
    })();

    try {
      return await saveInFlight;
    } finally {
      saveInFlight = null;
    }
  }

  async function finishAndShowGallery() {
    clearTimeout(autosaveTimeout);
    writeBackup();
    loading = true;
    const saved = await performAutosave();
    loading = false;
    if (!saved) return;
    activeEntryId.set(null);
    appState.set('gallery');
  }

  function handleDone() { return finishAndShowGallery(); }
  function handleBack() { return finishAndShowGallery(); }

  function preserveUnsavedBackup() {
    if (autosaveStatus !== 'Saved') writeBackup();
  }

  onMount(() => {
    journalSaveTrigger.set(0);
    journalCancelTrigger.set(0);
    if (entryId) {
      const entry = $journalEntries.find((item) => String(item.id) === String(entryId));
      if (entry) {
        title = entry.title || '';
        content = entry.content || '';
        if (entry.atelesData) currentAtelesData.set(entry.atelesData);
      }
    }
    restoreBackup();
    unsubSave = journalSaveTrigger.subscribe((value) => value > 0 && handleDone());
    unsubCancel = journalCancelTrigger.subscribe((value) => value > 0 && handleBack());
    setTimeout(() => { isInitialLoad = false; }, 200);
    window.addEventListener('beforeunload', preserveUnsavedBackup);
  });

  onDestroy(() => {
    clearTimeout(autosaveTimeout);
    unsubSave?.();
    unsubCancel?.();
    window.removeEventListener('beforeunload', preserveUnsavedBackup);
  });

  $: if (!isInitialLoad && (title || content)) triggerAutosave();
  $: wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  $: charCount = content ? content.length : 0;
</script>

<div class="journal-container" in:fade={{ duration: 500 }}>
  <header class="editor-header">
    <div class="status-indicator">
      {#if autosaveStatus === 'Saving...'}<span class="pulse-dot"></span>{/if}
      {autosaveStatus}
    </div>
  </header>
  <h1 class="header-title">How was your day?</h1>
  {#if errorMsg}
    <div class="mb-4 bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm text-center">
      <p>{errorMsg}</p>
      <button class="retry-button" type="button" on:click={() => performAutosave()} disabled={loading}>Retry save</button>
    </div>
  {/if}
  <div class="glass-panel editor-card">
    <input type="text" class="title-input" placeholder="Title of your day..." bind:value={title} disabled={loading} maxlength="100" />
    <textarea class="content-input" placeholder="Reflect on your thoughts here..." bind:value={content} disabled={loading} maxlength="2500"></textarea>
    <div class="editor-footer">
      <span class="counter-text {charCount >= 2200 ? (charCount >= 2500 ? 'at-limit' : 'near-limit') : ''}">{wordCount} {wordCount === 1 ? 'word' : 'words'} &nbsp;•&nbsp; {charCount.toLocaleString()}/2,500 chars</span>
    </div>
  </div>
</div>

<script context="module">
  import { fade } from 'svelte/transition';
</script>

<style>
  .journal-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; display: flex; flex-direction: column; padding: var(--page-padding-top) var(--page-padding-x) 108px; pointer-events: auto; }
  .header-title { font-size: var(--font-h2); font-weight: var(--weight-regular); letter-spacing: -0.01em; text-align: center; margin-bottom: var(--space-4); margin-top: auto; color: var(--color-text-primary); }
  @media (min-width: 48rem) { .header-title { margin-bottom: var(--space-6); } }
  .editor-card { flex: 1; min-height: 0; max-height: 80vh; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); background: var(--color-glass); }
  @media (min-width: 48rem) { .editor-card { padding: var(--space-6); gap: var(--space-4); margin-bottom: var(--space-6); } }
  .title-input { font-family: var(--font-family); font-size: var(--font-h1); font-weight: var(--weight-medium); letter-spacing: -0.015em; border: none; background: transparent; outline: none; color: var(--color-text-primary); }
  .content-input { font-family: var(--font-family); font-size: var(--font-body-lg); font-weight: var(--weight-regular); line-height: 1.5; letter-spacing: 0.01em; border: none; background: transparent; outline: none; resize: none; flex: 1; color: var(--color-text-primary); overflow-y: auto; scrollbar-width: none; }
  .content-input::-webkit-scrollbar { display: none; }
  .editor-footer { display: flex; justify-content: flex-end; align-items: center; border-top: 1px solid var(--color-border); padding-top: var(--space-2); margin-top: auto; font-size: var(--font-caption); flex-shrink: 0; }
  .counter-text { color: var(--color-text-tertiary); font-weight: var(--weight-medium); letter-spacing: 0.05em; text-transform: uppercase; transition: color var(--duration-normal) var(--easing-default); }
  .counter-text.near-limit { color: #D97706; }
  .counter-text.at-limit { color: #DC2626; animation: shake 0.3s ease; }
  @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
  .title-input::placeholder, .content-input::placeholder { color: var(--color-text-secondary); }
  .editor-header { display: flex; justify-content: flex-end; align-items: center; width: 100%; margin-bottom: var(--space-4); flex-shrink: 0; }
  .status-indicator { font-size: var(--font-caption); color: var(--color-text-secondary); font-weight: var(--weight-medium); display: flex; align-items: center; gap: var(--space-2); text-transform: uppercase; letter-spacing: 0.05em; }
  .pulse-dot { width: 6px; height: 6px; background-color: var(--color-accent); border-radius: var(--radius-circle); animation: pulse 1.5s infinite; }
  .retry-button { margin-top: var(--space-2); padding: var(--space-1) var(--space-3); border: 1px solid currentColor; border-radius: var(--radius-pill); background: transparent; color: inherit; cursor: pointer; font: inherit; }
  .retry-button:disabled { cursor: wait; opacity: 0.6; }
  @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.5); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(0, 0, 0, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); } }
</style>
