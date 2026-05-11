<script>
  import { appState, visualPhase, strokeType, strokeColor, isCameraActive } from "./store.js";
  import HandTracker from "./HandTracker.svelte";

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

<div class="home-container">
  <div class="content">
    {#if needsPermission}
      <button class="permission-btn" on:click={requestPermission}>
        Enable Motion Sensor
      </button>
    {/if}

    {#if $visualPhase === "drawing"}
      <div class="controls fade-in">
        <p class="prompt">Draw your feelings</p>
        
        <div class="color-selectors">
          <button aria-label="Black color" class="color-btn" style="background: #000;" class:active={$strokeColor === '#000000'} on:click={() => strokeColor.set('#000000')}></button>
          <button aria-label="Grey color" class="color-btn" style="background: #888;" class:active={$strokeColor === '#888888'} on:click={() => strokeColor.set('#888888')}></button>
          <button aria-label="White color" class="color-btn" style="background: #fff;" class:active={$strokeColor === '#ffffff'} on:click={() => strokeColor.set('#ffffff')}></button>
        </div>
        <div class="stroke-selectors">
          <button class="stroke-btn" class:active={$strokeType === 'ellipse'} on:click={() => strokeType.set('ellipse')}>Round</button>
          <button class="stroke-btn" class:active={$strokeType === 'rect'} on:click={() => strokeType.set('rect')}>Square</button>
          <button class="stroke-btn" class:active={$strokeType === 'line'} on:click={() => strokeType.set('line')}>Line</button>
        </div>

        <button class="enter-btn" on:click={doneDrawing}>Done Drawing</button>
      </div>
    {:else if $visualPhase === "ready_to_shake"}
      <p class="prompt fade-in">Shake to shatter them</p>
    {:else if $visualPhase === "breaking"}
      <p class="prompt fade-out">Letting go...</p>
    {:else if $visualPhase === "bloom"}
      <p class="prompt fade-in" style="font-size: var(--font-body-lg); margin-bottom: var(--space-3);">
        Find a shape you like. Shake to change.
      </p>
      <button class="enter-btn fade-in" on:click={enterJournal}>
        Write Journal
      </button>
    {/if}
  </div>
</div>

{#if enableCamera}
  <HandTracker />
{/if}

<style>
  .home-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding-bottom: 20vh;
    pointer-events: none;
  }

  .content {
    pointer-events: auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    align-items: center;
    width: 90%;
    margin-inline: auto;
  }

  .prompt {
    font-size: var(--font-body-lg);
    font-weight: var(--weight-regular);
    letter-spacing: 0.01em;
    color: var(--color-text-primary);
    text-shadow:
      0 0 10px var(--color-overlay),
      0 0 20px var(--color-overlay);
    transition: opacity var(--duration-xslow) var(--easing-default);
    max-width: 100%;
  }

  .fade-in {
    opacity: 1;
    animation: fadeIn var(--duration-xslow) var(--easing-out);
  }

  .fade-out {
    opacity: 0;
  }

  .permission-btn,
  .enter-btn {
    padding: var(--space-3) var(--space-8);
    background: var(--color-accent);
    color: var(--color-text-inverse);
    border-radius: var(--radius-pill);
    font-size: var(--font-body-lg);
    font-weight: var(--weight-medium);
    letter-spacing: 0.02em;
    border: none;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition:
      transform var(--duration-normal) var(--easing-default),
      box-shadow var(--duration-normal) var(--easing-default);
  }

  .enter-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }

  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    pointer-events: auto;
  }

  .stroke-selectors, .color-selectors {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-1);
    align-items: center;
    justify-content: center;
  }

  .color-btn {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-circle);
    border: 2px solid transparent;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform var(--duration-normal) var(--easing-default);
  }
  
  .color-btn.active {
    border: 2px solid var(--color-accent);
    transform: scale(1.2);
  }

  .stroke-btn {
    padding: var(--space-2) var(--space-4);
    background: transparent;
    color: var(--color-text-primary);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-pill);
    font-size: var(--font-body-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: all var(--duration-normal) var(--easing-default);
  }

  .stroke-btn.active {
    background: var(--color-accent);
    color: var(--color-text-inverse);
  }

  .stroke-btn:hover {
    opacity: 0.8;
  }
</style>
