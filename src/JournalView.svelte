<script context="module">
  import { fade } from "svelte/transition";
</script>

<script>
  import {
    appState,
    journalEntries,
    shakeIntensity,
    journalLayout,
    activeEntryId,
    clearCanvasTrigger,
    saveVisualTrigger,
    isFullscreenVisual,
  } from "./store.js";

  $: entry = $activeEntryId
    ? $journalEntries.find((e) => e.id === $activeEntryId)
    : $journalEntries[$journalEntries.length - 1];

  function handleClick(e) {
    if (e.target.closest("button")) return;
    // Tap / click to toggle fullscreen
    isFullscreenVisual.set(true);
  }

  function goHome() {
    activeEntryId.set(null);
    appState.set("home");
  }

  function startNewAteles() {
    activeEntryId.set(null);
    clearCanvasTrigger.update((v) => v + 1);
    journalLayout.set(2);
    appState.set("home");
  }

  function saveVisual() {
    saveVisualTrigger.update((v) => v + 1);
  }

  async function handleShare() {
    const canvas = document.querySelector(".p5-container canvas");
    if (!canvas) {
      saveVisual();
      return;
    }

    try {
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Could not create image blob");

      const file = new File([blob], "Ateles_Visual.png", { type: "image/png" });
      const titleText = entry && entry.title ? entry.title : "My Ateles";
      const shareData = {
        title: titleText,
        text: `Check out my ego transformation: ${titleText} - created with Ateles!`,
        files: [file],
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else {
        // Fallback to standard download if file sharing is unsupported
        saveVisual();
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Fallback to standard download on error or cancellation
      saveVisual();
    }
  }

  let scrollTop = 0;
  let contentEl;
  $: solidOpacity = Math.min(scrollTop / 150, 0.85);
  $: {
    if (($journalLayout !== undefined || $activeEntryId !== undefined) && contentEl) {
      contentEl.scrollTop = 0;
      scrollTop = 0;
    }
  }
</script>

<div
  class="view-container layout-center"
  in:fade={{ duration: 500 }}
  role="presentation"
  on:click|stopPropagation={handleClick}
>
  <div class="gradient-overlay"></div>
  <div class="solid-overlay" style="opacity: {solidOpacity};"></div>

  {#if entry}
    <div class="content" bind:this={contentEl} on:scroll={(e) => scrollTop = e.target.scrollTop}>
      <h1 class="title">{entry.title}</h1>
      <p class="date">{entry.date}</p>
      <p class="body-text">{entry.content}</p>
    </div>
  {:else}
    <div class="content">
      <p>No entries yet. Tap to go back.</p>
    </div>
  {/if}
</div>

<style>
  /* ── Base container ─────────────────────────────────── */
  .view-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    pointer-events: auto;
    overflow: hidden;
    touch-action: none;
    cursor: grab;
    display: flex;
    flex-direction: column;
  }

  .gradient-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Gradient from bottom (fully opaque background color) to middle (transparent) */
    background: linear-gradient(
      to top,
      var(--color-bg) 0%,
      var(--color-bg) 35%,
      transparent 65%
    );
    pointer-events: none;
    z-index: 1;
    transition: background var(--duration-slow) var(--easing-out);
  }

  .solid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--color-bg);
    pointer-events: none;
    z-index: 1;
    transition: background-color var(--duration-slow) var(--easing-out);
  }

  .content {
    position: relative;
    z-index: 2;
    transition: all var(--duration-slow) var(--easing-out);
    max-height: 85vh;
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
    padding-bottom: 108px;
  }
  .content::-webkit-scrollbar {
    display: none; /* Safari/Chrome */
  }

  .hint {
    position: absolute;
    bottom: 110px;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: var(--font-caption);
    font-weight: var(--weight-medium);
    color: var(--color-text-tertiary);
    letter-spacing: 0.03em;
    text-transform: uppercase;
    opacity: 0.6;
    pointer-events: none;
    transition: opacity var(--duration-slow) var(--easing-default);
    z-index: 2;
  }

  /* ── Typography ─────────────────────────────────────── */
  .title {
    font-size: var(--font-display);
    font-weight: var(--weight-light);
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin-bottom: var(--space-1);
    color: var(--color-text-primary);
    word-break: break-word;
    overflow-wrap: break-word;
    transition: all var(--duration-slow) var(--easing-out);
  }

  .date {
    font-size: var(--font-caption);
    font-weight: var(--weight-medium);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-6);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    transition: all var(--duration-slow) var(--easing-out);
  }

  .body-text {
    font-size: var(--font-body-lg);
    font-weight: var(--weight-regular);
    line-height: 1.6;
    letter-spacing: 0.01em;
    color: var(--color-text-primary);
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: break-word;
    transition: all var(--duration-slow) var(--easing-out);
  }

  /* ═══════════════════════════════════════════════════════
     LAYOUT Center (visual top, text centered below)
     ═══════════════════════════════════════════════════════ */
  .layout-center .content {
    padding: 0 var(--page-padding-x);
    padding-top: 50vh;
    text-align: center;
  }
  @media (min-width: 48rem) {
    .layout-center .content {
      padding-top: 60vh;
    }
  }

  .layout-center .title {
    font-size: var(--font-h1);
    font-weight: var(--weight-regular);
    letter-spacing: -0.015em;
    margin-bottom: var(--space-2);
  }

  .layout-center .date {
    margin-bottom: var(--space-5);
  }

  .layout-center .body-text {
    font-size: var(--font-body);
    line-height: 1.7;
  }
</style>
