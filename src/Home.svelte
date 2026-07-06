<script>
  import {
    appState,
    visualPhase,
    strokeType,
    strokeColor,
    isCameraActive,
    activeTheme,
    isFullscreenVisual,
    fillMode,
    activeEntryId,
    clearCanvasTrigger,
    journalLayout,
    strokeSize,
    strokeOpacity,
    stampChar,
    shakeMode,
    saveVisualTrigger,
  } from "./store.js";
  import HandTracker from "./HandTracker.svelte";

  let brushPalettes = [
    { name: "Monochrome", colors: ["#000000", "#888888", "#ffffff"] },
    { name: "Vibrant", colors: ["#E53935", "#1E88E5", "#FDD835"] },
    { name: "Pastel", colors: ["#F48FB1", "#80CBC4", "#CE93D8"] },
    { name: "Earth", colors: ["#CC4A2C", "#2E4D43", "#E5C594"] },
    { name: "Japandi", colors: ["#2F2F2F", "#8C7B6B", "#E8E0D5"] },
    { name: "Cyberpunk", colors: ["#00E5FF", "#FF2D78", "#0D0D0D"] },
    { name: "Retro", colors: ["#4A6741", "#C75B3A", "#E8A838"] },
    { name: "Bauhaus", colors: ["#F7B731", "#1A3A8F", "#D62828"] },
    { name: "Free", colors: ["#E53935", "#1E88E5", "#FDD835"] },
  ];
  let currentPaletteIndex = 0;
  let activePalette = brushPalettes[currentPaletteIndex];
  $: activePalette = brushPalettes[currentPaletteIndex];

  function prevBrushPalette() {
    currentPaletteIndex =
      (currentPaletteIndex - 1 + brushPalettes.length) % brushPalettes.length;
    strokeColor.set(brushPalettes[currentPaletteIndex].colors[0]);
  }

  function nextBrushPalette() {
    currentPaletteIndex = (currentPaletteIndex + 1) % brushPalettes.length;
    strokeColor.set(brushPalettes[currentPaletteIndex].colors[0]);
  }

  let enableCamera = false;

  $: if ($visualPhase === "ready_to_shake" || $visualPhase === "bloom") {
    enableCamera = true;
  } else if ($visualPhase === "drawing") {
    enableCamera = false;
  }

  let permissionGranted = false;
  let needsPermission =
    typeof window !== "undefined" &&
    typeof window.DeviceMotionEvent !== "undefined" &&
    typeof window.DeviceMotionEvent.requestPermission === "function";

  async function requestPermission() {
    if (needsPermission) {
      try {
        const response = await window.DeviceMotionEvent.requestPermission();
        if (response === "granted") {
          permissionGranted = true;
          needsPermission = false;
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  let showBrushSettings = false;

  function doneDrawing() {
    showBrushSettings = false;
    visualPhase.set("ready_to_shake");
  }

  function startNewAteles() {
    showBrushSettings = false;
    activeEntryId.set(null);
    clearCanvasTrigger.update((v) => v + 1);
    journalLayout.set(2);
  }

  function saveVisual() {
    saveVisualTrigger.update((v) => v + 1);
  }

  const currentDate = new Date();
  const yearStr = currentDate.getFullYear();
  const dayMonthStr = currentDate
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    .replace(",", " |");
</script>

<div
  class="absolute top-10 left-0 w-full h-full z-10 flex flex-col justify-end items-center pb-[108px] pointer-events-none"
>
  <div class="text-center flex flex-col gap-5 items-center w-[90%] mx-auto">
    {#if needsPermission}
      <button
        class="pointer-events-auto py-3 px-8 bg-accent text-text-inverse rounded-pill text-[1.2rem] font-medium tracking-[0.02em] border-none cursor-pointer shadow-md transition-all duration-normal ease-default hover:-translate-y-[2px] hover:shadow-hover"
        on:click={requestPermission}
      >
        Enable Motion Sensor
      </button>
    {/if}

    {#if $visualPhase === "drawing"}
      <!-- Floating Date Header at the top of the canvas area -->
      <div
        class="absolute top-10 left-0 w-full text-center pointer-events-none animate-[fadeIn_1s_cubic-bezier(0,0,0.2,1)] flex flex-col gap-1"
      >
        <h1
          class="text-[2.25rem] font-medium tracking-tight text-text-primary m-0"
          style="text-shadow: 0 0 10px var(--color-overlay), 0 0 20px var(--color-overlay);"
        >
          {yearStr}
        </h1>
        <p
          class="text-[0.95rem] font-normal text-text-secondary m-0"
          style="text-shadow: 0 0 10px var(--color-overlay), 0 0 20px var(--color-overlay);"
        >
          {dayMonthStr}
        </p>
      </div>

      <!-- Settings Drawer Card -->
      <div class="drawing-controls-wrapper">
        {#if showBrushSettings}
          <div
            class="glass-panel pointer-events-auto p-4 flex flex-col gap-4 w-full max-w-[340px] shadow-lg animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)_forwards] mb-3"
          >
            <!-- Header -->
            <div
              class="flex justify-between items-center border-b border-border pb-2"
            >
              <span
                class="text-[0.75rem] font-bold tracking-wider uppercase text-text-secondary"
                >Brush Settings</span
              >
              <button
                aria-label="Close settings"
                class="bg-transparent border-none text-text-secondary hover:text-text-primary cursor-pointer p-1 flex items-center justify-center rounded-circle hover:bg-surface transition-colors"
                on:click={() => (showBrushSettings = false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <!-- Palette Selection -->
            <div class="flex flex-col gap-1.5 text-left">
              <span
                class="text-[0.75rem] font-semibold text-text-tertiary uppercase tracking-wider"
                >Palette</span
              >
              <div
                class="flex items-center justify-between bg-surface/30 rounded-pill px-3 py-1 border border-border"
              >
                <button
                  class="bg-transparent border-none text-[1rem] cursor-pointer text-text-primary p-1 hover:opacity-75"
                  on:click={prevBrushPalette}
                >
                  &lt;
                </button>
                <span
                  class="text-[0.875rem] font-medium text-text-primary min-w-[80px] text-center"
                  >{activePalette.name}</span
                >
                <button
                  class="bg-transparent border-none text-[1rem] cursor-pointer text-text-primary p-1 hover:opacity-75"
                  on:click={nextBrushPalette}
                >
                  &gt;
                </button>
              </div>
            </div>

            <!-- Stroke Selection -->
            <div class="flex flex-col gap-1.5 text-left">
              <span
                class="text-[0.75rem] font-semibold text-text-tertiary uppercase tracking-wider"
                >Stroke Type</span
              >
              <div class="grid grid-cols-3 gap-2">
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$strokeType ===
                  'ellipse'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => strokeType.set("ellipse")}
                >
                  Round
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$strokeType ===
                  'rect'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => strokeType.set("rect")}
                >
                  Square
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$strokeType ===
                  'line'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => strokeType.set("line")}
                >
                  Line
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$strokeType ===
                  'stamp_asterisk'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => strokeType.set("stamp_asterisk")}
                >
                  Asterisk (*)
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$strokeType ===
                  'stamp_plus'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => strokeType.set("stamp_plus")}
                >
                  Plus (+)
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$strokeType ===
                  'stamp_char'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => strokeType.set("stamp_char")}
                >
                  Character
                </button>
              </div>
              {#if $strokeType === 'stamp_char'}
                <div class="mt-2 flex items-center gap-2 pointer-events-auto">
                  <span class="text-[0.75rem] font-medium text-text-secondary">Type letter:</span>
                  <input
                    type="text"
                    maxlength="2"
                    bind:value={$stampChar}
                    class="w-12 text-center bg-surface border border-border rounded text-[0.875rem] text-text-primary py-1 outline-none focus:border-accent"
                  />
                </div>
              {/if}
            </div>

            <!-- Shake Mode Selection -->
            <div class="flex flex-col gap-1.5 text-left">
              <span
                class="text-[0.75rem] font-semibold text-text-tertiary uppercase tracking-wider"
                >Shake Mode</span
              >
              <div class="grid grid-cols-3 gap-2">
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$shakeMode ===
                  'chaos'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => shakeMode.set("chaos")}
                >
                  Chaos
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$shakeMode ===
                  'orbits'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => shakeMode.set("orbits")}
                >
                  Orbits
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$shakeMode ===
                  'perlin'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => shakeMode.set("perlin")}
                >
                  Fluid
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$shakeMode ===
                  'matrix'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => shakeMode.set("matrix")}
                >
                  Matrix
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$shakeMode ===
                  'geometric_web'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => shakeMode.set("geometric_web")}
                >
                  Web
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$shakeMode ===
                  'mandala_wave'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => shakeMode.set("mandala_wave")}
                >
                  Mandala
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-accent rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$shakeMode ===
                  'emblem'
                    ? 'bg-accent text-text-inverse'
                    : 'bg-transparent text-text-primary'}"
                  on:click={() => shakeMode.set("emblem")}
                >
                  Emblem
                </button>
              </div>
            </div>

            <!-- Fill Selection -->
            <div class="flex flex-col gap-1.5 text-left">
              <span
                class="text-[0.75rem] font-semibold text-text-tertiary uppercase tracking-wider"
                >Fill Mode</span
              >
              <div class="grid grid-cols-3 gap-2">
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-border rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default {$fillMode ===
                  'solid'
                    ? 'bg-surface-hover text-text-primary border-text-secondary'
                    : 'bg-transparent text-text-secondary'}"
                  on:click={() => fillMode.set("solid")}
                >
                  Solid
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-border rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default {$fillMode ===
                  'stroke'
                    ? 'bg-surface-hover text-text-primary border-text-secondary'
                    : 'bg-transparent text-text-secondary'}"
                  on:click={() => fillMode.set("stroke")}
                >
                  Stroke
                </button>
                <button
                  class="pointer-events-auto py-1.5 px-2 border border-border rounded-pill text-[0.75rem] font-medium cursor-pointer transition-all duration-normal ease-default {$fillMode ===
                  'gradient'
                    ? 'bg-surface-hover text-text-primary border-text-secondary'
                    : 'bg-transparent text-text-secondary'}"
                  on:click={() => fillMode.set("gradient")}
                >
                  Gradient
                </button>
              </div>
            </div>

            <!-- Brush Size Slider -->
            <div class="flex flex-col gap-1.5 text-left">
              <div class="flex justify-between items-center">
                <span
                  class="text-[0.75rem] font-semibold text-text-tertiary uppercase tracking-wider"
                  >Size</span
                >
                <span class="text-[0.75rem] font-medium text-text-secondary"
                  >{Math.round($strokeSize * 100)}%</span
                >
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                bind:value={$strokeSize}
                class="pointer-events-auto w-full accent-accent bg-surface/50 h-1.5 rounded-pill appearance-none cursor-pointer"
              />
            </div>

            <!-- Brush Opacity Slider -->
            <div class="flex flex-col gap-1.5 text-left">
              <div class="flex justify-between items-center">
                <span
                  class="text-[0.75rem] font-semibold text-text-tertiary uppercase tracking-wider"
                  >Opacity</span
                >
                <span class="text-[0.75rem] font-medium text-text-secondary"
                  >{Math.round($strokeOpacity * 100)}%</span
                >
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                bind:value={$strokeOpacity}
                class="pointer-events-auto w-full accent-accent bg-surface/50 h-1.5 rounded-pill appearance-none cursor-pointer"
              />
            </div>
          </div>
        {/if}

        <!-- Floating Bottom Control Bar -->
        <div
          class="drawing-bar flex items-center gap-3 px-4 py-2 rounded-pill pointer-events-auto transition-transform duration-normal ease-default hover:scale-[1.02] opacity-100 animate-[fadeIn_1s_cubic-bezier(0,0,0.2,1)]"
        >
          <!-- Settings Button -->
          <button
            aria-label="Brush Settings"
            class="bg-transparent border-none text-[1.2rem] cursor-pointer text-text-primary p-1.5 flex items-center justify-center rounded-circle hover:bg-surface-hover transition-colors {showBrushSettings
              ? 'text-accent bg-surface-hover scale-110'
              : ''}"
            on:click={() => (showBrushSettings = !showBrushSettings)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="21" x2="14" y1="4" y2="4" />
              <line x1="10" x2="3" y1="4" y2="4" />
              <line x1="21" x2="12" y1="12" y2="12" />
              <line x1="8" x2="3" y1="12" y2="12" />
              <line x1="21" x2="16" y1="20" y2="20" />
              <line x1="12" x2="3" y1="20" y2="20" />
              <line x1="14" x2="14" y1="2" y2="6" />
              <line x1="8" x2="8" y1="10" y2="14" />
              <line x1="16" x2="16" y1="18" y2="22" />
            </svg>
          </button>

          <!-- Divider -->
          <div class="w-[1px] h-5 bg-border"></div>

          <!-- Color Selection -->
          <div class="flex gap-2 items-center">
            {#each activePalette.colors as color, i}
              <button
                aria-label="Color {i + 1}"
                class="w-6 h-6 rounded-circle border-2 cursor-pointer shadow-sm transition-transform duration-normal ease-default {$strokeColor ===
                color
                  ? 'border-accent scale-125'
                  : 'border-transparent'}"
                style="background: {color};"
                on:click={() => strokeColor.set(color)}
              >
              </button>
            {/each}
            {#if activePalette.name === "Free"}
              <div class="relative w-6 h-6 rounded-circle border border-border bg-surface hover:bg-surface-hover cursor-pointer shadow-sm flex items-center justify-center transition-transform duration-normal ease-default hover:scale-110" title="Edit selected color">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-secondary"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                <input
                  type="color"
                  value={$strokeColor}
                  class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  on:input={(e) => {
                    let activeIdx = activePalette.colors.indexOf($strokeColor);
                    if (activeIdx === -1) {
                      activeIdx = 0;
                    }
                    brushPalettes[currentPaletteIndex].colors[activeIdx] = e.target.value;
                    brushPalettes = brushPalettes;
                    strokeColor.set(e.target.value);
                  }}
                />
              </div>
            {/if}
          </div>
        </div>
      </div>
    {:else if $visualPhase === "ready_to_shake"}
      <p
        class="text-[1.2rem] font-normal tracking-[0.01em] text-text-primary transition-opacity duration-xslow ease-default opacity-100 animate-[fadeIn_1s_cubic-bezier(0,0,0.2,1)]"
        style="text-shadow: 0 0 10px var(--color-overlay), 0 0 20px var(--color-overlay);"
      >
        Shake to shatter them
      </p>
    {:else if $visualPhase === "breaking"}
      <p
        class="text-[1.2rem] font-normal tracking-[0.01em] text-text-primary transition-opacity duration-xslow ease-default opacity-0"
        style="text-shadow: 0 0 10px var(--color-overlay), 0 0 20px var(--color-overlay);"
      >
        Letting go...
      </p>
    {:else if $visualPhase === "bloom"}
      <p
        class="text-[1.2rem] font-normal tracking-[0.01em] text-text-primary transition-opacity duration-xslow ease-default opacity-100 animate-[fadeIn_1s_cubic-bezier(0,0,0.2,1)]"
        style="font-size: var(--font-body-lg); margin-bottom: var(--space-3); text-shadow: 0 0 10px var(--color-overlay), 0 0 20px var(--color-overlay);"
      >
        Great
      </p>
    {/if}
  </div>
</div>

<style>
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Custom slider track & thumb styling */
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
  }
  input[type="range"]::-webkit-slider-runnable-track {
    background: var(--color-border-strong);
    border-radius: var(--radius-pill);
    height: 6px;
  }
  input[type="range"]::-webkit-slider-thumb {
    background: var(--color-accent);
    width: 14px;
    height: 14px;
    border-radius: var(--radius-circle);
    -webkit-appearance: none;
    margin-top: -4px;
    box-shadow: var(--shadow-sm);
    transition: transform var(--duration-fast);
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }
  input[type="range"]::-moz-range-track {
    background: var(--color-border-strong);
    border-radius: var(--radius-pill);
    height: 6px;
  }
  input[type="range"]::-moz-range-thumb {
    background: var(--color-accent);
    width: 14px;
    height: 14px;
    border-radius: var(--radius-circle);
    border: none;
    box-shadow: var(--shadow-sm);
    transition: transform var(--duration-fast);
  }
  input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.2);
  }

  .drawing-bar {
    background: color-mix(in srgb, var(--color-glass) 60%, transparent);
    backdrop-filter: var(--blur-glass);
    -webkit-backdrop-filter: var(--blur-glass);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
  }

  .drawing-controls-wrapper {
    position: fixed;
    bottom: 96px; /* Safely clears bottom-row navbar (24px bottom + 56px height + 16px gap) */
    left: 50%;
    transform: translateX(-50%);
    z-index: 90;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: max-content;
    max-width: 90vw;
    pointer-events: none;
  }

  .drawing-controls-wrapper > * {
    pointer-events: auto;
  }
</style>
