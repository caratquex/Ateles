<script>
  import P5Canvas from "./P5Canvas.svelte";
  import Home from "./Home.svelte";
  import JournalInput from "./JournalInput.svelte";
  import JournalView from "./JournalView.svelte";
  import Gallery from "./Gallery.svelte";
  import Auth from "./Auth.svelte";
  import Onboarding from "./Onboarding.svelte";
  import {
    appState,
    activeTheme,
    activeEntryId,
    visualPhase,
    clearCanvasTrigger,
    currentUser,
    journalEntries,
  } from "./store.js";
  import { supabase } from "./lib/supabase.js";
  import { onMount } from "svelte";

  let menuOpen = false;
  const themes = [
    "light",
    "dark",
    "warm",
    "cool",
    "japandi",
    "cyberpunk",
    "retro",
    "bauhaus",
  ];
  let entriesLoading = false;

  async function fetchJournalEntries() {
    entriesLoading = true;
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching journal entries:", error.message);
      } else if (data) {
        const mappedEntries = data.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          created_at: item.created_at,
          date: new Date(item.created_at).toLocaleDateString("en-US", {
            weekday: "short",
            month: "long",
            day: "numeric",
          }),
          atelesData: item.visual_data,
        }));
        journalEntries.set(mappedEntries);
      }
    } catch (e) {
      console.error("Unexpected error fetching entries:", e);
    } finally {
      entriesLoading = false;
    }
  }

  onMount(async () => {
    // Check initial session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      currentUser.set(session.user);
      await fetchJournalEntries();
      if ($appState === "auth") {
        if (session.user.user_metadata?.username) {
          appState.set("home");
        } else {
          appState.set("onboarding");
        }
      }
    } else {
      appState.set("auth");
    }

    // Listen to auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        currentUser.set(session.user);
        await fetchJournalEntries();
        if ($appState === "auth") {
          if (session.user.user_metadata?.username) {
            appState.set("home");
          } else {
            appState.set("onboarding");
          }
        }
      } else {
        currentUser.set(null);
        journalEntries.set([]);
        appState.set("auth");
      }
    });
  });

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
    clearCanvasTrigger.update((v) => v + 1);
    appState.set("home");
    menuOpen = false;
  }

  function goGallery() {
    appState.set("gallery");
    menuOpen = false;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    menuOpen = false;
  }

  $: {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", $activeTheme);
    }
  }
</script>

<main class="w-screen h-[100dvh] overflow-hidden relative">
  <P5Canvas />

  {#if entriesLoading}
    <div
      class="absolute top-6 left-6 z-[100] flex items-center gap-2 px-4 py-2 pointer-events-none glass-panel"
      style="border-radius: var(--radius-pill); box-shadow: var(--shadow-sm);"
    >
      <div
        class="w-2 h-2 animate-ping"
        style="background-color: var(--color-accent); border-radius: var(--radius-circle);"
      ></div>
      <span
        class="text-[0.75rem] font-semibold tracking-wider uppercase"
        style="color: var(--color-text-secondary); font-family: var(--font-family);"
        >Syncing</span
      >
    </div>
  {/if}

  {#if $appState === "auth"}
    <Auth />
  {:else if $appState === "onboarding"}
    <Onboarding />
  {:else if $appState === "home"}
    <Home />
  {:else if $appState === "journal_input"}
    <JournalInput />
  {:else if $appState === "journal_view"}
    <JournalView />
  {:else if $appState === "gallery"}
    <Gallery />
  {/if}

  <div class="absolute top-6 right-6 z-[100]">
    <button
      class="bg-transparent border-none text-text-primary cursor-pointer p-2 flex"
      on:click={() => (menuOpen = !menuOpen)}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
    {#if menuOpen}
      <div
        class="absolute top-full right-0 mt-2 bg-bg border border-border-default rounded-md shadow-md flex flex-col min-w-[150px] overflow-hidden"
      >
        <button
          class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0"
          on:click={cycleTheme}>Theme: {capitalize($activeTheme)}</button
        >
        <button
          class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0"
          on:click={goHome}>Home</button
        >
        <button
          class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0"
          on:click={goGallery}>Gallery</button
        >
        <button
          class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0"
          on:click={() => {
            appState.set("journal_view");
            menuOpen = false;
          }}>Journal</button
        >
        {#if $currentUser}
          <button
            class="bg-transparent border-b border-border-default hover:bg-surface text-left text-red-500 text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0"
            on:click={handleLogout}>Log Out</button
          >
        {/if}
      </div>
    {/if}
  </div>
</main>
