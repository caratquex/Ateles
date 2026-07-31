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
    isFullscreenVisual,
    hasDrawing,
    journalSaveTrigger,
    journalCancelTrigger,
    saveVisualTrigger,
    isTutorialMode,
  } from "./store.js";
  import { supabase } from "./lib/supabase.js";
  import { onMount } from "svelte";
  import {
    LayoutGrid,
    Pen,
    Edit,
    Check,
    BookOpen,
    Share2,
    X,
    Maximize,
    Trash2,
    Download,
    Plus,
  } from "lucide-svelte";

  let menuOpen = false;
  let showShareOptions = false;
  const themes = [
    "light",
    "dark",
    "warm",
    "cool",
    "japandi",
    "cyberpunk",
    "retro",
    "bauhaus",
    "nature",
    "candy",
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

  let lastUserId = null;
  $: if ($currentUser && $currentUser.id !== lastUserId) {
    lastUserId = $currentUser.id;
    fetchJournalEntries();
  } else if (!$currentUser && lastUserId !== null) {
    lastUserId = null;
    journalEntries.set([]);
  }

  onMount(async () => {
    // Check initial session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      currentUser.set(session.user);
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
        if ($appState === "auth") {
          if (session.user.user_metadata?.username) {
            appState.set("home");
          } else {
            appState.set("onboarding");
          }
        }
      } else {
        currentUser.set(null);
        if ($appState === "auth") {
          appState.set("auth");
        }
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
    isTutorialMode.set(false);
    activeEntryId.set(null);
    clearCanvasTrigger.update((v) => v + 1);
    appState.set("home");
    menuOpen = false;
  }

  function goGallery() {
    isTutorialMode.set(false);
    appState.set("gallery");
    menuOpen = false;
  }

  async function handleLogout() {
    isTutorialMode.set(false);
    await supabase.auth.signOut();
    menuOpen = false;
  }

  async function captureCombinedCanvas() {
    const p5Canvas = document.querySelector(".p5-container canvas");
    if (!p5Canvas) return null;

    const canvasWidth = p5Canvas.width;
    const canvasHeight = p5Canvas.height;
    const dpr = window.devicePixelRatio || 1;

    const outCanvas = document.createElement("canvas");
    outCanvas.width = canvasWidth;
    outCanvas.height = canvasHeight;
    const ctx = outCanvas.getContext("2d");

    // Draw the Ateles visual
    ctx.drawImage(p5Canvas, 0, 0, canvasWidth, canvasHeight);

    // Fetch active journal entry
    let currentEntry = null;
    const unsub1 = activeEntryId.subscribe((id) => {
      const unsub2 = journalEntries.subscribe((entries) => {
        currentEntry = entries.find((e) => e.id === id);
      });
      unsub2();
    });
    unsub1();

    if (!currentEntry) return outCanvas;

    // Fetch theme colors
    const style = getComputedStyle(document.documentElement);
    const bgHex = style.getPropertyValue("--color-bg").trim() || "#FFFFFF";
    const textPrimary =
      style.getPropertyValue("--color-text-primary").trim() || "#000000";
    const textSecondary =
      style.getPropertyValue("--color-text-secondary").trim() || "#666666";

    // Draw bottom gradient overlay
    const gradient = ctx.createLinearGradient(
      0,
      canvasHeight * 0.3,
      0,
      canvasHeight,
    );
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(0.35, bgHex);
    gradient.addColorStop(1, bgHex);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvasHeight * 0.3, canvasWidth, canvasHeight * 0.7);

    // Draw Text
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    let currentY = canvasHeight * 0.55;
    let centerX = canvasWidth / 2;

    // Title
    ctx.font = `300 ${48 * dpr}px 'Outfit', sans-serif`;
    ctx.fillStyle = textPrimary;
    ctx.fillText(currentEntry.title || "Untitled", centerX, currentY);
    currentY += 60 * dpr;

    // Date
    ctx.font = `500 ${14 * dpr}px 'Outfit', sans-serif`;
    ctx.fillStyle = textSecondary;
    ctx.fillText(currentEntry.date || "", centerX, currentY);
    currentY += 40 * dpr;

    // Content (wrapped)
    ctx.font = `400 ${18 * dpr}px 'Outfit', sans-serif`;
    ctx.fillStyle = textPrimary;
    const maxWidth = Math.min(800 * dpr, canvasWidth * 0.85);
    const lineHeight = 30 * dpr;

    const text = currentEntry.content || "";
    const paragraphs = text.split("\n");

    for (let i = 0; i < paragraphs.length; i++) {
      let words = paragraphs[i].split(" ");
      let line = "";
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + " ";
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, centerX, currentY);
          line = words[n] + " ";
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, centerX, currentY);
      currentY += lineHeight;
    }

    return outCanvas;
  }

  async function handleShare(includeJournalPage = true) {
    let canvas;
    if (includeJournalPage) {
      canvas = await captureCombinedCanvas();
    } else {
      const p5Canvas = document.querySelector(".p5-container canvas");
      if (!p5Canvas) return;
      canvas = document.createElement("canvas");
      canvas.width = p5Canvas.width;
      canvas.height = p5Canvas.height;
      canvas.getContext("2d").drawImage(p5Canvas, 0, 0);
    }
    if (!canvas) {
      return;
    }

    try {
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Could not create image blob");

      const file = new File([blob], "Ateles_Visual.png", { type: "image/png" });

      let activeTitle = "My Ateles";
      const unsubActive = activeEntryId.subscribe((id) => {
        const unsubEntries = journalEntries.subscribe((entries) => {
          const entry = entries.find((e) => e.id === id);
          if (entry && entry.title) activeTitle = entry.title;
        });
        unsubEntries();
      });
      unsubActive();

      const shareData = {
        title: activeTitle,
        text: `Check out my ego transformation: ${activeTitle} - created with Ateles!`,
        files: [file],
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else {
        const link = document.createElement("a");
        link.download = "Ateles_Visual.png";
        link.href = canvas.toDataURL();
        link.click();
      }
    } catch (error) {
      console.error("Error sharing:", error);
      const link = document.createElement("a");
      link.download = "Ateles_Visual.png";
      link.href = canvas.toDataURL();
      link.click();
    }
  }

  function handleStartOver() {
    activeEntryId.set(null);
    clearCanvasTrigger.update((v) => v + 1);
    visualPhase.set("drawing");
    hasDrawing.set(false);
  }

  $: {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", $activeTheme);
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<main
  class="w-screen h-[100dvh] overflow-hidden relative"
  on:click={() => {
    if ($isFullscreenVisual) {
      isFullscreenVisual.set(false);
    }
  }}
>
  <P5Canvas />

  {#if !$isFullscreenVisual}
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
  {/if}

  {#if !$isFullscreenVisual}
    <div class="absolute top-6 right-6 z-[100]">
      <button
        aria-label="Toggle Menu"
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
            on:click={goHome}>Home</button
          >
          <button
            class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0"
            on:click={goGallery}>Gallery</button
          >
          <button
            class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0"
            on:click={() => {
              isTutorialMode.set(true);
              appState.set("onboarding");
              menuOpen = false;
            }}>Tutorial</button
          >
          <button
            class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0"
            on:click={cycleTheme}>Theme: {capitalize($activeTheme)}</button
          >
          {#if $appState === "home"}
            <button
              class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0"
              on:click={() => {
                saveVisualTrigger.update((n) => n + 1);
                menuOpen = false;
              }}>Download Drawing</button
            >
          {/if}
          {#if $currentUser}
            <button
              class="bg-transparent border-b border-border-default hover:bg-surface text-left text-red-500 text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0"
              on:click={handleLogout}>Log Out</button
            >
          {:else}
            <button
              class="bg-transparent border-b border-border-default hover:bg-surface text-left text-text-primary text-[1rem] font-medium p-3 px-4 cursor-pointer last:border-b-0"
              on:click={() => {
                appState.set("auth");
                menuOpen = false;
              }}>Log In / Sign Up</button
            >
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if $appState !== "auth" && $appState !== "onboarding" && !$isFullscreenVisual && $visualPhase !== "breaking"}
    <div class="bottom-row">
      <!-- Left side buttons -->
      <button
        class="nav-icon-btn"
        class:show={$appState === "journal_view"}
        on:click|stopPropagation={() => appState.set("journal_input")}
        aria-label="Edit Journal"
      >
        <Edit size={18} />
      </button>

      <button
        class="nav-icon-btn"
        class:show={$appState === "journal_input"}
        on:click|stopPropagation={() =>
          journalCancelTrigger.update((n) => n + 1)}
        aria-label="Cancel"
      >
        <X size={18} />
      </button>

      <button
        class="nav-icon-btn"
        class:show={$appState === "home" && $visualPhase === "bloom"}
        on:click|stopPropagation={() => saveVisualTrigger.update((n) => n + 1)}
        aria-label="Save Visual"
      >
        <Download size={18} />
      </button>

      <button
        class="nav-icon-btn"
        class:show={$appState === "home" && $visualPhase === "bloom"}
        on:click|stopPropagation={handleStartOver}
        aria-label="Start Over"
      >
        <Trash2 size={18} />
      </button>

      <!-- Center Navbar -->
      <div
        class="bottom-nav"
        class:compact={$appState === "journal_view" ||
          $appState === "journal_input"}
      >
        <button
          class="nav-btn"
          class:active={$appState === "gallery" ||
            $appState === "journal_view" ||
            $appState === "journal_input"}
          on:click|stopPropagation={() => {
            if ($appState === "journal_input") {
              journalCancelTrigger.update((n) => n + 1);
            } else {
              activeEntryId.set(null);
              appState.set("gallery");
            }
          }}
        >
          <LayoutGrid size={18} />
          <span>Gallery</span>
        </button>
        {#if $appState === "home" && $visualPhase === "drawing" && $hasDrawing}
          <button
            class="nav-btn active"
            on:click|stopPropagation={() => {
              visualPhase.set("ready_to_shake");
            }}
          >
            <Check size={18} />
            <span>Done</span>
          </button>
        {:else if $appState === "home" && $visualPhase === "bloom"}
          <button
            class="nav-btn active"
            on:click|stopPropagation={() => {
              appState.set("journal_input");
            }}
          >
            <BookOpen size={18} />
            <span>Journal</span>
          </button>
        {:else}
          <button
            class="nav-btn"
            class:active={$appState === "home"}
            on:click|stopPropagation={() => {
              if ($appState === "journal_input") {
                journalCancelTrigger.update((n) => n + 1);
              } else {
                if ($appState === "journal_view" || $appState === "gallery") {
                  handleStartOver();
                }
                appState.set("home");
              }
            }}
          >
            {#if $appState === "gallery" || $appState === "journal_view"}
              <Plus size={18} />
              <span>New Ateles</span>
            {:else}
              <Pen size={18} />
              <span>Ateles</span>
            {/if}
          </button>
        {/if}
      </div>

      <!-- Right side buttons -->
      <button
        class="nav-icon-btn"
        class:show={$appState === "journal_view"}
        on:click|stopPropagation={() => (showShareOptions = !showShareOptions)}
        aria-label="Share Options"
      >
        <Share2 size={18} />
      </button>

      {#if showShareOptions}
        <div class="share-dropdown">
          <button
            on:click|stopPropagation={() => {
              handleShare(false);
              showShareOptions = false;
            }}>Save Ateles visual only</button
          >
          <button
            on:click|stopPropagation={() => {
              handleShare(true);
              showShareOptions = false;
            }}>Save the whole journal page</button
          >
        </div>
      {/if}

      <button
        class="nav-icon-btn"
        class:show={$appState === "journal_view" ||
          ($appState === "home" && $visualPhase === "bloom")}
        on:click|stopPropagation={() => isFullscreenVisual.set(true)}
        aria-label="View Fullscreen"
      >
        <Maximize size={18} />
      </button>

      <button
        class="nav-icon-btn active-accent"
        class:show={$appState === "journal_input"}
        on:click|stopPropagation={() => journalSaveTrigger.update((n) => n + 1)}
        aria-label="Done"
      >
        <Check size={18} />
      </button>
    </div>
  {/if}
</main>

<style>
  .bottom-row {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    z-index: 100;
    width: max-content;
    max-width: 95vw;
    pointer-events: none;
  }

  .bottom-row > * {
    pointer-events: auto;
  }

  .bottom-nav {
    width: 240px;
    height: 56px;
    background: var(--color-glass);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    transition:
      width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
      background-color 0.25s ease,
      border-color 0.25s ease,
      box-shadow 0.4s ease;
  }

  .bottom-nav.compact {
    width: 130px;
  }

  .bottom-nav .nav-btn span {
    max-width: 100px;
    opacity: 1;
    transition:
      max-width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity 0.25s ease;
    overflow: hidden;
    white-space: nowrap;
    display: inline-block;
  }

  .bottom-nav.compact .nav-btn span {
    max-width: 0;
    opacity: 0;
  }

  .bottom-nav.compact .nav-btn {
    gap: 0;
  }

  .nav-btn {
    flex: 1;
    height: 48px;
    border-radius: var(--radius-pill);
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    font-family: var(--font-family);
    font-size: var(--font-body-sm);
    font-weight: var(--weight-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition:
      all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
      gap 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .nav-btn:hover:not(.active) {
    background: var(--color-surface);
    color: var(--color-text-primary);
  }

  .nav-btn.active {
    background: var(--color-accent);
    color: var(--color-text-inverse);
    box-shadow: var(--shadow-sm);
  }

  .nav-icon-btn {
    height: 56px;
    width: 0;
    opacity: 0;
    transform: scale(0);
    pointer-events: none;
    border: 0 solid transparent;
    background: var(--color-glass);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: none;
    margin: 0;
    padding: 0;
    transition:
      width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity 0.3s ease,
      border-color 0.3s ease,
      background-color 0.25s ease,
      box-shadow 0.4s ease;
    overflow: hidden;
  }

  .nav-icon-btn.show {
    width: 56px;
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    border-radius: var(--radius-circle);
  }

  .share-dropdown {
    position: absolute;
    bottom: 70px;
    right: 50px;
    background: var(--color-glass);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: var(--shadow-lg);
    z-index: 101;
  }

  .share-dropdown button {
    background: transparent;
    border: none;
    padding: 10px 14px;
    color: var(--color-text-primary);
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    transition: background-color 0.2s;
  }

  .share-dropdown button:hover {
    background: var(--color-surface);
  }

  .nav-icon-btn:hover {
    background: var(--color-surface);
    color: var(--color-text-primary);
  }

  .nav-icon-btn.active-accent {
    background: var(--color-accent);
    color: var(--color-text-inverse);
    border-color: var(--color-accent);
  }

  .nav-icon-btn.active-accent:hover {
    background: var(--color-accent);
    opacity: 0.95;
    color: var(--color-text-inverse);
  }

  @media (max-width: 480px) {
    .bottom-nav {
      width: 180px;
    }
    .bottom-nav.compact {
      width: 110px;
    }
    .bottom-row {
      gap: 8px;
    }
  }

  @media (max-width: 480px) {
    .bottom-nav {
      width: 110px;
    }
    .bottom-nav.compact {
      width: 100px;
    }
    .bottom-nav .nav-btn span {
      display: none !important;
    }
    .bottom-row {
      gap: 6px;
    }
  }
</style>
