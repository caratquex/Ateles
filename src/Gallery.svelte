<script>
  import { onMount } from "svelte";
  import {
    journalEntries,
    activeEntryId,
    appState,
    clearCanvasTrigger,
    journalLayout,
    currentUser,
    journalEntriesLoading,
  } from "./store.js";

  onMount(() => {
    if ($currentUser || $journalEntries.length > 0) return;
    try {
      journalEntries.set(JSON.parse(localStorage.getItem("ateles_guest_journal_entries") || "[]"));
    } catch (error) {
      console.error("Error loading guest journal entries:", error);
    }
  });

  /** @param {string|number} id */
  function openJournal(id) {
    activeEntryId.set(id);
    appState.set("journal_view");
  }

  function startNewAteles() {
    activeEntryId.set(null);
    clearCanvasTrigger.update((v) => v + 1);
    journalLayout.set(2);
    appState.set("home");
  }

  /** @param {string|number|Date} timestamp */
  function formatDay(timestamp) {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "short",
    });
  }

  /** @param {string|number|Date} timestamp */
  function formatDate(timestamp) {
    const d = new Date(timestamp);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  $: groupedEntries = (() => {
    const sorted = [...$journalEntries].sort(
      (a, b) => new Date(b.created_at || b.id).getTime() - new Date(a.created_at || a.id).getTime()
    );

    const groups = {};
    for (const entry of sorted) {
      const date = new Date(entry.created_at || entry.id);
      const month = date.toLocaleDateString("en-US", { month: "long" });
      const year = date.getFullYear();
      const groupKey = `${month} ${year}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          month,
          year,
          entries: []
        };
      }
      groups[groupKey].entries.push(entry);
    }

    return Object.values(groups);
  })();
</script>

<div
  class="absolute top-0 left-0 w-full h-full bg-bg overflow-y-auto pt-[100px] pb-32 z-[25] animate-[fadeIn_0.5s_ease]"
>
  {#if $journalEntriesLoading}
    <div
      class="grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-4 px-4 sm:px-6 max-w-[500px] mx-auto mt-8"
    >
      {#each [1, 2, 3, 4, 5, 6] as _}
        <div class="flex flex-col items-center animate-pulse">
          <div class="w-[80px] h-[80px] rounded-full bg-text-secondary opacity-10 mb-3"></div>
          <div class="h-4 w-12 bg-text-secondary opacity-10 rounded mb-1"></div>
          <div class="h-3 w-8 bg-text-secondary opacity-10 rounded"></div>
        </div>
      {/each}
    </div>
  {:else if groupedEntries.length === 0}
    <div class="text-center text-text-secondary mt-12 px-4">
      No entries found. Start drawing to create your first Ateles!
    </div>
  {:else}
    {#each groupedEntries as group}
      <div class="mb-12">
        <div class="text-center mb-6">
          <h2 class="text-[1.5rem] font-medium text-text-primary tracking-wide leading-none mb-1">
            {group.month}
          </h2>
          <span class="text-[0.75rem] text-text-secondary font-light tracking-widest uppercase block">
            {group.year}
          </span>
        </div>

        <div
          class="grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-4 px-4 sm:px-6 max-w-[500px] mx-auto"
        >
          {#each group.entries as entry}
            <button
              class="flex flex-col items-center bg-transparent border-none cursor-pointer group"
              on:click={() => openJournal(entry.id)}
            >
              <div
                class="w-[80px] h-[80px] relative mb-3 transition-transform duration-300 group-hover:scale-110"
              >
                {#if entry.atelesData && entry.atelesData.shards}
                  <!-- Use SVG to render a static, performant representation of the Ateles -->
                  <svg
                    viewBox="-150 -150 300 300"
                    class="w-full h-full drop-shadow-sm opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    {#each entry.atelesData.shards as s}
                      <g
                        transform="translate({s.baseTargetX},{s.baseTargetY}) rotate({(s.baseTargetRot *
                          180) /
                          Math.PI})"
                      >
                        {#if s.type === "rect"}
                          <rect
                            x={-s.targetW / 2}
                            y={-s.targetH / 2}
                            width={s.targetW}
                            height={s.targetH}
                            rx={s.targetW * 0.1}
                            fill={s.color}
                          />
                        {:else if s.type === "ellipse"}
                          <ellipse
                            cx="0"
                            cy="0"
                            rx={s.targetW / 2}
                            ry={s.targetH / 2}
                            fill={s.color}
                          />
                        {:else if s.type === "diamond"}
                          <polygon
                            points="0,{-s.targetH / 2} {s.targetW /
                              2},0 0,{s.targetH / 2} {-s.targetW / 2},0"
                            fill={s.color}
                          />
                        {/if}
                      </g>
                    {/each}
                  </svg>
                {:else}
                  <!-- Fallback if no visual data -->
                  <div
                    class="w-full h-full rounded-full bg-text-secondary opacity-20"
                  ></div>
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
      </div>
    {/each}
  {/if}
</div>
