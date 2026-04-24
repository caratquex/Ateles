<script>
  import { appState, hasShaken } from "./store.js";

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

  // Auto transition when shaken
  $: if ($hasShaken) {
    appState.set("journal_input");
    hasShaken.set(false); // Reset
  }
</script>

<div class="home-container">
  <div class="content">
    {#if needsPermission}
      <button class="permission-btn" on:click={requestPermission}>
        Enable Motion Sensor
      </button>
    {/if}
    <p class="prompt">Shake or drag to create your Ateles</p>
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
  }

  .permission-btn {
    padding: 12px 24px;
    background: var(--text-main);
    color: white;
    border-radius: 30px;
    font-size: 1rem;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
</style>
