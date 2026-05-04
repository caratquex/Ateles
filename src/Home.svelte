<script>
  import { appState, visualPhase, strokeType, strokeColor } from "./store.js";

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
      <p class="prompt fade-in" style="font-size: 1.2rem; margin-bottom: 10px;">
        Find a shape you like. Shake to change.
      </p>
      <button class="enter-btn fade-in" on:click={enterJournal}>
        Write Journal
      </button>
    {/if}
  </div>
</div>

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
    gap: 20px;
    align-items: center;
  }

  .prompt {
    font-size: 1.5rem;
    font-weight: 400;
    letter-spacing: 0.5px;
    color: var(--text-main);
    text-shadow:
      0 0 10px rgba(255, 255, 255, 0.8),
      0 0 20px rgba(255, 255, 255, 0.9);
    transition: opacity 1s ease-in-out;
  }

  .fade-in {
    opacity: 1;
    animation: fadeIn 1s ease-in;
  }

  .fade-out {
    opacity: 0;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .permission-btn,
  .enter-btn {
    padding: 14px 32px;
    background: var(--text-main);
    color: var(--bg-color);
    border-radius: 30px;
    font-size: 1.1rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .enter-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    pointer-events: auto;
  }

  .stroke-selectors, .color-selectors {
    display: flex;
    gap: 10px;
    margin-bottom: 5px;
    align-items: center;
    justify-content: center;
  }

  .color-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: transform 0.2s;
  }
  
  .color-btn.active {
    border: 2px solid var(--text-main);
    transform: scale(1.2);
  }

  .stroke-btn {
    padding: 8px 16px;
    background: transparent;
    color: var(--text-main);
    border: 1px solid var(--text-main);
    border-radius: 20px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .stroke-btn.active {
    background: var(--text-main);
    color: var(--bg-color);
  }

  .stroke-btn:hover {
    opacity: 0.8;
  }
</style>
