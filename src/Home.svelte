<script>
  import { appState, visualPhase, strokeType, strokeColor, isCameraActive, activeTheme } from "./store.js";
  import HandTracker from "./HandTracker.svelte";

  const brushPalettes = [
    { name: 'Monochrome', colors: ['#000000', '#888888', '#ffffff'] },
    { name: 'Vibrant', colors: ['#E53935', '#1E88E5', '#FDD835'] },
    { name: 'Pastel', colors: ['#F48FB1', '#80CBC4', '#CE93D8'] },
    { name: 'Earth', colors: ['#CC4A2C', '#2E4D43', '#E5C594'] }
  ];
  let currentPaletteIndex = 0;
  $: activePalette = brushPalettes[currentPaletteIndex];
  
  function prevBrushPalette() {
    currentPaletteIndex = (currentPaletteIndex - 1 + brushPalettes.length) % brushPalettes.length;
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

  function enterJournal() {
    appState.set("journal_input");
  }

  function doneDrawing() {
    visualPhase.set("ready_to_shake");
  }
</script>

<div class="absolute top-0 left-0 w-full h-full z-10 flex flex-col justify-end items-center pb-[max(15vh,64px)] pointer-events-none">
  <div class="text-center flex flex-col gap-5 items-center w-[90%] mx-auto">
    {#if needsPermission}
      <button class="pointer-events-auto py-3 px-8 bg-accent text-text-inverse rounded-pill text-[1.2rem] font-medium tracking-[0.02em] border-none cursor-pointer shadow-md transition-all duration-normal ease-default hover:-translate-y-[2px] hover:shadow-hover" on:click={requestPermission}>
        Enable Motion Sensor
      </button>
    {/if}

    {#if $visualPhase === "drawing"}
      <div class="flex flex-col items-center gap-4 opacity-100 animate-[fadeIn_1s_cubic-bezier(0,0,0.2,1)]">
        <p class="text-[1.2rem] font-normal tracking-[0.01em] text-text-primary transition-opacity duration-xslow ease-default" style="text-shadow: 0 0 10px var(--color-overlay), 0 0 20px var(--color-overlay);">Draw your ego</p>
        
        <div class="flex gap-3 mb-1 items-center justify-center">
          {#each activePalette.colors as color, i}
            <button 
              aria-label="Color {i+1}" 
              class="pointer-events-auto w-6 h-6 rounded-circle border-2 cursor-pointer shadow-sm transition-transform duration-normal ease-default {$strokeColor === color ? 'border-accent scale-125' : 'border-transparent'}" 
              style="background: {color};" 
              on:click={() => strokeColor.set(color)}>
            </button>
          {/each}
        </div>

        <div class="flex items-center gap-4 mb-2 text-[1rem] font-medium">
          <button class="pointer-events-auto bg-transparent border-none text-[1.2rem] cursor-pointer text-text-primary p-1" on:click={prevBrushPalette}>&lt;</button>
          <span class="min-w-[60px] text-center">{activePalette.name}</span>
          <button class="pointer-events-auto bg-transparent border-none text-[1.2rem] cursor-pointer text-text-primary p-1" on:click={nextBrushPalette}>&gt;</button>
        </div>

        <div class="flex gap-3 mb-1 items-center justify-center">
          <button class="pointer-events-auto py-2 px-4 border border-accent rounded-pill text-[0.875rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$strokeType === 'ellipse' ? 'bg-accent text-text-inverse' : 'bg-transparent text-text-primary'}" on:click={() => strokeType.set('ellipse')}>Round</button>
          <button class="pointer-events-auto py-2 px-4 border border-accent rounded-pill text-[0.875rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$strokeType === 'rect' ? 'bg-accent text-text-inverse' : 'bg-transparent text-text-primary'}" on:click={() => strokeType.set('rect')}>Square</button>
          <button class="pointer-events-auto py-2 px-4 border border-accent rounded-pill text-[0.875rem] font-medium cursor-pointer transition-all duration-normal ease-default hover:opacity-80 {$strokeType === 'line' ? 'bg-accent text-text-inverse' : 'bg-transparent text-text-primary'}" on:click={() => strokeType.set('line')}>Line</button>
        </div>

        <button class="pointer-events-auto w-[200px] mt-2 py-3 px-8 bg-accent text-text-inverse rounded-pill text-[1.2rem] font-medium tracking-[0.02em] border-none cursor-pointer shadow-md transition-all duration-normal ease-default hover:-translate-y-[2px] hover:shadow-hover" on:click={doneDrawing}>Done</button>
      </div>
    {:else if $visualPhase === "ready_to_shake"}
      <p class="text-[1.2rem] font-normal tracking-[0.01em] text-text-primary transition-opacity duration-xslow ease-default opacity-100 animate-[fadeIn_1s_cubic-bezier(0,0,0.2,1)]" style="text-shadow: 0 0 10px var(--color-overlay), 0 0 20px var(--color-overlay);">Shake to shatter them</p>
    {:else if $visualPhase === "breaking"}
      <p class="text-[1.2rem] font-normal tracking-[0.01em] text-text-primary transition-opacity duration-xslow ease-default opacity-0" style="text-shadow: 0 0 10px var(--color-overlay), 0 0 20px var(--color-overlay);">Letting go...</p>
    {:else if $visualPhase === "bloom"}
      <p class="text-[1.2rem] font-normal tracking-[0.01em] text-text-primary transition-opacity duration-xslow ease-default opacity-100 animate-[fadeIn_1s_cubic-bezier(0,0,0.2,1)]" style="font-size: var(--font-body-lg); margin-bottom: var(--space-3); text-shadow: 0 0 10px var(--color-overlay), 0 0 20px var(--color-overlay);">
        Find a shape you like. Shake to change.
      </p>
      <button class="pointer-events-auto py-3 px-8 bg-accent text-text-inverse rounded-pill text-[1.2rem] font-medium tracking-[0.02em] border-none cursor-pointer shadow-md transition-all duration-normal ease-default hover:-translate-y-[2px] hover:shadow-hover opacity-100 animate-[fadeIn_1s_cubic-bezier(0,0,0.2,1)]" on:click={enterJournal}>
        Write Journal
      </button>
    {/if}
  </div>
</div>

{#if false && enableCamera}
  <HandTracker />
{/if}

<style>
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
