<script>
  import { journalEntries, activeEntryId, appState, clearCanvasTrigger, journalLayout } from './store.js';

  /** @param {string|number} id */
  function openJournal(id) {
    activeEntryId.set(id);
    appState.set('journal_view');
  }

  function startNewAteles() {
    activeEntryId.set(null);
    clearCanvasTrigger.update(v => v + 1);
    journalLayout.set(0);
    appState.set('home');
  }

  /** @param {string|number|Date} timestamp */
  function formatDay(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short' });
  }

  /** @param {string|number|Date} timestamp */
  function formatDate(timestamp) {
    const d = new Date(timestamp);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
</script>

<div class="absolute top-0 left-0 w-full min-h-screen bg-bg overflow-y-auto pt-[100px] pb-10 z-[25] animate-[fadeIn_0.5s_ease]">
  <h1 class="text-center text-[1.5rem] font-medium text-text-primary mb-8 tracking-wide">
    {new Date().toLocaleDateString('en-US', { month: 'long' })}
  </h1>
  
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-4 px-4 sm:px-6 max-w-[500px] mx-auto">
    {#each $journalEntries as entry}
      <button 
        class="flex flex-col items-center bg-transparent border-none cursor-pointer group"
        on:click={() => openJournal(entry.id)}
      >
        <div class="w-[80px] h-[80px] relative mb-3 transition-transform duration-300 group-hover:scale-110">
          {#if entry.atelesData && entry.atelesData.shards}
            <!-- Use SVG to render a static, performant representation of the Ateles -->
            <svg viewBox="-150 -150 300 300" class="w-full h-full drop-shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
              {#each entry.atelesData.shards as s}
                <g transform="translate({s.baseTargetX},{s.baseTargetY}) rotate({s.baseTargetRot * 180 / Math.PI})">
                  {#if s.type === 'rect'}
                    <rect x={-s.targetW/2} y={-s.targetH/2} width={s.targetW} height={s.targetH} rx={s.targetW*0.1} fill={s.color} />
                  {:else if s.type === 'ellipse'}
                    <ellipse cx="0" cy="0" rx={s.targetW/2} ry={s.targetH/2} fill={s.color} />
                  {:else if s.type === 'diamond'}
                    <polygon points="0,{-s.targetH/2} {s.targetW/2},0 0,{s.targetH/2} {-s.targetW/2},0" fill={s.color} />
                  {/if}
                </g>
              {/each}
            </svg>
          {:else}
            <!-- Fallback if no visual data -->
            <div class="w-full h-full rounded-full bg-text-secondary opacity-20"></div>
          {/if}
        </div>
        
        <div class="text-[1.1rem] font-medium text-text-primary mb-1">
          {formatDay(entry.created_at || entry.id)}
        </div>
        <div class="text-[0.8rem] text-text-secondary">
          {formatDate(entry.created_at || entry.id)}
        </div>
      </button>
    {/each}
  </div>

  <div class="fixed bottom-8 left-0 w-full flex justify-center z-50">
    <button 
      class="py-4 px-10 bg-accent text-text-inverse rounded-pill text-[1.1rem] font-medium tracking-[0.02em] shadow-lg transition-transform hover:-translate-y-1 hover:shadow-hover border-none cursor-pointer"
      on:click={startNewAteles}
    >
      New Ateles
    </button>
  </div>
</div>
