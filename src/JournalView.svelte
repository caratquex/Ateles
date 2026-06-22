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

  const LAYOUT_COUNT = 5;
  let shakeCooldown = false;
  let wasShaking = false;

  // ── Shake detection (edge-triggered) ──────────────────
  $: {
    const intensity = $shakeIntensity;
    const isShaking = intensity > 20;
    if (isShaking && !wasShaking) {
      cycleLayout(1);
    }
    wasShaking = isShaking;
  }

  function cycleLayout(dir = 1) {
    if (shakeCooldown) return;
    shakeCooldown = true;
    journalLayout.update(
      (l) => (((l + dir) % LAYOUT_COUNT) + LAYOUT_COUNT) % LAYOUT_COUNT,
    );
    setTimeout(() => {
      shakeCooldown = false;
    }, 600);
  }

  // ── Swipe / drag detection ────────────────────────────
  let startX = 0;
  let startY = 0;
  let startTime = 0;

  function pointerDown(x, y) {
    startX = x;
    startY = y;
    startTime = Date.now();
  }

  function pointerUp(x, y) {
    const dx = x - startX;
    const dy = y - startY;
    const dt = Date.now() - startTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > 60 && absDx > absDy * 1.5 && dt < 600) {
      // Horizontal swipe
      cycleLayout(dx > 0 ? 1 : -1);
    } else if (absDx < 12 && absDy < 12 && dt < 300) {
      // Tap / click to toggle fullscreen
      isFullscreenVisual.set(true);
    }
  }

  function handleTouchStart(e) {
    if (e.target.closest("button")) return;
    if (e.touches.length === 1) {
      pointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  function handleTouchEnd(e) {
    if (e.target.closest("button")) return;
    if (e.changedTouches.length === 1) {
      pointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  }

  function handleMouseDown(e) {
    if (e.target.closest("button")) return;
    pointerDown(e.clientX, e.clientY);
  }

  function handleMouseUp(e) {
    if (e.target.closest("button")) return;
    pointerUp(e.clientX, e.clientY);
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
  class="view-container layout-{$journalLayout}"
  in:fade={{ duration: 500 }}
  role="presentation"
  on:touchstart|stopPropagation={handleTouchStart}
  on:touchend|stopPropagation={handleTouchEnd}
  on:mousedown|stopPropagation={handleMouseDown}
  on:mouseup|stopPropagation={handleMouseUp}
  on:click|stopPropagation
>
  <div class="gradient-overlay"></div>
  <div class="solid-overlay" style="opacity: {solidOpacity};"></div>

  {#if entry}
    <div class="content" bind:this={contentEl} on:scroll={(e) => scrollTop = e.target.scrollTop}>
      <h1 class="title">{entry.title}</h1>
      <p class="date">{entry.date}</p>
      <p class="body-text">{entry.content}</p>
    </div>
    <p class="hint">Swipe or shake to change layout</p>
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
     LAYOUT 0 — Editorial (text top-left, visual bottom)
     ═══════════════════════════════════════════════════════ */
  .layout-0 .content {
    padding: var(--page-padding-top) var(--page-padding-x) 0;
    text-align: left;
  }

  .layout-0 .body-text {
    max-width: 85%;
  }

  /* ═══════════════════════════════════════════════════════
     LAYOUT 1 — Magazine (text top-left, visual offset)
     ═══════════════════════════════════════════════════════ */
  .layout-1 .content {
    padding: var(--page-padding-top) var(--page-padding-x) 0;
    text-align: left;
  }

  .layout-1 .title {
    font-size: var(--font-h1);
    font-weight: var(--weight-regular);
    letter-spacing: -0.015em;
  }

  .layout-1 .body-text {
    max-width: 85%;
  }

  /* ═══════════════════════════════════════════════════════
     LAYOUT 2 — Centered (visual top, text centered below)
     ═══════════════════════════════════════════════════════ */
  .layout-2 .content {
    padding: 0 var(--page-padding-x);
    padding-top: 50vh;
    text-align: center;
  }
  @media (min-width: 48rem) {
    .layout-2 .content {
      padding-top: 60vh;
    }
  }

  .layout-2 .title {
    font-size: var(--font-h1);
    font-weight: var(--weight-regular);
    letter-spacing: -0.015em;
    margin-bottom: var(--space-2);
  }

  .layout-2 .date {
    margin-bottom: var(--space-5);
  }

  .layout-2 .body-text {
    font-size: var(--font-body);
    line-height: 1.7;
  }

  /* ═══════════════════════════════════════════════════════
     LAYOUT 3 — Right Aligned (text right, visual left)
     ═══════════════════════════════════════════════════════ */
  .layout-3 .content {
    padding: var(--page-padding-top) var(--page-padding-x) 0;
    text-align: right;
  }

  .layout-3 .title {
    font-size: var(--font-h1);
    font-weight: var(--weight-medium);
    letter-spacing: -0.015em;
  }

  .layout-3 .body-text {
    max-width: 85%;
    margin-left: auto;
  }

  /* ═══════════════════════════════════════════════════════
     LAYOUT 4 — Chaos (chaotic typography, erratic positioning)
     ═══════════════════════════════════════════════════════ */
  .layout-4 .content {
    padding: calc(var(--page-padding-top) * 1.5) var(--page-padding-x) 0;
    text-align: justify;
    transform: rotate(-1deg);
  }

  .layout-4 .title {
    font-size: calc(var(--font-display) * 1.2);
    font-weight: var(--weight-bold);
    letter-spacing: -0.05em;
    transform: translateX(-5px) rotate(2deg);
    line-height: 0.9;
    margin-bottom: var(--space-4);
  }

  .layout-4 .date {
    transform: translateX(15px) rotate(-2deg);
    opacity: 0.9;
  }

  .layout-4 .body-text {
    font-family: monospace;
    font-size: calc(var(--font-body-lg) * 1.05);
    line-height: 1.3;
    letter-spacing: -0.02em;
    max-width: 95%;
    transform: translateX(5px);
  }
</style>
