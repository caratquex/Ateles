<script>
  import { onMount, onDestroy } from 'svelte';
  import { cameraShakeIntensity, isCameraActive } from './store.js';

  let videoElement;
  let hands;
  let camera;
  
  let lastDistance = null;
  let smoothedVelocity = 0;

  onMount(() => {
    isCameraActive.set(true);

    if (typeof window === "undefined" || !window.Hands || !window.Camera) {
      console.warn("MediaPipe Hands or Camera not loaded");
      return;
    }

    // Using the globals injected by index.html CDN scripts
    hands = new window.Hands({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});
    
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    hands.onResults(onResults);

    camera = new window.Camera(videoElement, {
      onFrame: async () => {
        if (hands && videoElement && videoElement.readyState >= 2) {
            await hands.send({image: videoElement});
        }
      },
      width: 320,
      height: 240
    });
    
    camera.start().catch(err => {
        console.error("Failed to start camera:", err);
        isCameraActive.set(false);
    });
  });

  onDestroy(() => {
    isCameraActive.set(false);
    if (camera) {
      camera.stop();
    }
    if (hands) {
      hands.close();
    }
  });

  function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      const wrist = landmarks[0];
      const fingertips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
      
      let totalDistance = 0;
      for (let pt of fingertips) {
        let dx = pt.x - wrist.x;
        let dy = pt.y - wrist.y;
        let dz = pt.z - wrist.z;
        // The hands API returns x, y, z usually.
        let dzSafe = dz || 0;
        totalDistance += Math.sqrt(dx*dx + dy*dy + dzSafe*dzSafe);
      }
      let avgDistance = totalDistance / fingertips.length;

      if (lastDistance !== null) {
        // Calculate rate of change
        let velocity = Math.abs(avgDistance - lastDistance) * 8000;
        
        // Smooth
        smoothedVelocity = smoothedVelocity * 0.8 + velocity * 0.2;
        
        // Set shake intensity in store
        cameraShakeIntensity.set(smoothedVelocity);
      } else {
        cameraShakeIntensity.set(0);
      }
      
      lastDistance = avgDistance;
    } else {
      cameraShakeIntensity.set(0);
      lastDistance = null;
      smoothedVelocity = 0;
    }
  }
</script>

<div class="hand-tracker-container">
  <video bind:this={videoElement} autoplay playsinline muted></video>
</div>

<style>
  .hand-tracker-container {
    position: absolute;
    top: -1000px;
    left: -1000px;
    width: 320px;
    height: 240px;
    opacity: 0;
    pointer-events: none;
  }
  video {
    width: 100%;
    height: 100%;
  }
</style>
