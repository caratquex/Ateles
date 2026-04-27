<script>
  import { onMount } from 'svelte';
  import p5 from 'p5';
  import { shakeIntensity, appState, visualPhase } from './store.js';

  let canvasContainer;
  let p5Instance;

  onMount(() => {
    let currentVisualPhase = 'pristine';
    const unsubPhase = visualPhase.subscribe(v => currentVisualPhase = v);
    let currentState = 'home';
    const unsubState = appState.subscribe(v => currentState = v);

    const sketch = (p) => {
      let currentShake = 0;
      let targetShake = 0;
      
      let shards = [];
      const NUM_GROUPS = 5;
      const SHARDS_PER_GROUP = 16;
      const TOTAL_SHARDS = NUM_GROUPS * SHARDS_PER_GROUP;

      let maxShakeDuringBreak = 0;
      let calmFrames = 0; // To detect when shake has stopped
      
      let globalRotation = 0;

      // Initialize shards
      p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent(canvasContainer);
        p.rectMode(p.CENTER);
        p.noStroke();

        for(let g=0; g<NUM_GROUPS; g++) {
          for(let i=0; i<SHARDS_PER_GROUP; i++) {
             shards.push({
               id: g*SHARDS_PER_GROUP + i,
               group: g,
               index: i,
               x: 0, y: 0, rot: 0,
               vx: 0, vy: 0, vrot: 0,
               targetX: 0, targetY: 0, targetRot: 0,
               w: 0, h: 0, 
               targetW: 0, targetH: 0,
               color: g % 2 === 0 ? '#000000' : '#e0e0e0',
               type: 'rect'
             });
          }
        }
        
        setPristine();
        // Instantly snap to pristine
        for(let s of shards) {
           s.x = s.targetX; s.y = s.targetY; s.rot = s.targetRot;
           s.w = s.targetW; s.h = s.targetH;
        }
      };

      function setPristine() {
        for(let g=0; g<NUM_GROUPS; g++) {
           for(let i=0; i<SHARDS_PER_GROUP; i++) {
              let s = shards[g*SHARDS_PER_GROUP + i];
              s.targetX = 0;
              s.targetY = 0;
              s.targetRot = 0;
              s.type = 'rect';
              if (g === 0) { s.targetW = 160; s.targetH = 160; s.color = '#000000'; } // outer border
              else if (g === 1) { s.targetW = 150; s.targetH = 150; s.color = '#ffffff'; } // inner white
              else if (g === 2) { s.targetW = 60; s.targetH = 60; s.color = '#e0e0e0'; } // middle gray
              else if (g === 3) { s.targetW = 20; s.targetH = 20; s.color = '#000000'; } // inner black
              else { s.targetW = 0; s.targetH = 0; } // hide rest
           }
        }
      }

      function generateMandala(shakeMag) {
        // Scale complexity and size based on shake magnitude
        let baseScale = p.map(shakeMag, 10, 60, 0.8, 2.5, true);
        
        for(let g=0; g<NUM_GROUPS; g++) {
           let slicesOptions = [4, 8, 16];
           let slices = slicesOptions[p.floor(p.random(slicesOptions.length))];
           
           // If shake is huge, push shapes further out
           let radius = p.random(20, 100) * baseScale + (g * 15);
           let w = p.random(10, 40) * baseScale;
           let h = p.random(10, 80) * baseScale;
           let type = p.random(['rect', 'ellipse', 'diamond']);
           let isRadial = p.random() > 0.3; // 70% chance to face outward
           
           // Alternate colors to ensure contrast
           let color = (g % 2 === 0) ? '#000000' : '#e0e0e0';
           if (p.random() > 0.8) color = '#ffffff';

           for(let i=0; i<SHARDS_PER_GROUP; i++) {
              let s = shards[g*SHARDS_PER_GROUP + i];
              if (i < slices) {
                 let angle = (p.TWO_PI / slices) * i;
                 s.targetX = p.cos(angle) * radius;
                 s.targetY = p.sin(angle) * radius;
                 
                 s.targetRot = isRadial ? angle : p.random(p.TWO_PI);
                 if (isRadial && type === 'rect') s.targetRot += p.PI/2; 
                 
                 s.targetW = w;
                 s.targetH = h;
                 s.type = type;
                 s.color = color;
              } else {
                 s.targetW = 0;
                 s.targetH = 0;
              }
           }
        }
      }

      p.draw = () => {
        p.background(255, 255, 255);

        // Physics / Shake detection
        let shake = p.dist(0, 0, 0, p.accelerationX, p.accelerationY, p.accelerationZ);
        if (isNaN(shake)) shake = 0;
        
        if (p.mouseIsPressed) {
          let mouseVelocity = p.dist(p.mouseX, p.mouseY, p.pmouseX, p.pmouseY);
          shake += mouseVelocity * 0.5;
        }

        targetShake = p.max(targetShake * 0.95, shake); 
        currentShake = p.lerp(currentShake, targetShake, 0.1);
        shakeIntensity.set(currentShake);

        // Phase Transitions
        if (currentVisualPhase === 'pristine' && currentShake > 8) {
           visualPhase.set('breaking');
           maxShakeDuringBreak = currentShake;
           calmFrames = 0;
        }

        if (currentVisualPhase === 'bloom' && currentState === 'home') {
           if (currentShake > 25) { // Reshake
              visualPhase.set('breaking');
              maxShakeDuringBreak = currentShake;
              calmFrames = 0;
           }
        }

        if (currentVisualPhase === 'breaking') {
           maxShakeDuringBreak = p.max(maxShakeDuringBreak, currentShake);
           
           // Apply chaotic force to shards
           let force = currentShake * 0.15;
           for(let s of shards) {
              s.vx += p.random(-force, force);
              s.vy += p.random(-force, force);
              s.vrot += p.random(-force*0.02, force*0.02);
           }

           // Check if shake subsided to transition to bloom
           if (currentShake < 5) {
              calmFrames++;
              if (calmFrames > 30) { // Half a second of calm
                 visualPhase.set('bloom');
                 generateMandala(maxShakeDuringBreak);
              }
           } else {
              calmFrames = 0;
           }
        }

        // Draw Scene
        p.push();
        p.translate(p.width / 2, p.height / 2);
        
        if (currentState === 'journal_input' || currentState === 'journal_view') {
          p.translate(0, -p.height / 4);
          p.scale(1.5);
        }

        // Global gentle rotation in bloom phase
        if (currentVisualPhase === 'bloom') {
           globalRotation += 0.002 + (currentShake * 0.001);
        }
        p.rotate(globalRotation);

        // Update and draw shards
        for(let s of shards) {
           if (currentVisualPhase === 'breaking') {
              // Physics movement
              s.x += s.vx;
              s.y += s.vy;
              s.rot += s.vrot;
              // Friction
              s.vx *= 0.92;
              s.vy *= 0.92;
              s.vrot *= 0.95;
              
              // Softly lerp to targets just to keep them from flying to infinity
              s.w = p.lerp(s.w, s.targetW, 0.02);
              s.h = p.lerp(s.h, s.targetH, 0.02);
           } else {
              // Morphing movement (Pristine or Bloom)
              s.x = p.lerp(s.x, s.targetX, 0.04);
              s.y = p.lerp(s.y, s.targetY, 0.04);
              s.rot = p.lerp(s.rot, s.targetRot, 0.04);
              s.w = p.lerp(s.w, s.targetW, 0.04);
              s.h = p.lerp(s.h, s.targetH, 0.04);
              s.vx = 0; s.vy = 0; s.vrot = 0;
           }
           
           if (s.w > 0.5 && s.h > 0.5) {
              p.push();
              p.translate(s.x, s.y);
              p.rotate(s.rot);
              p.fill(s.color);
              if (s.type === 'rect') p.rect(0, 0, s.w, s.h, s.w*0.1); // slight rounded corners
              else if (s.type === 'ellipse') p.ellipse(0, 0, s.w, s.h);
              else if (s.type === 'diamond') {
                 p.beginShape();
                 p.vertex(0, -s.h/2); p.vertex(s.w/2, 0);
                 p.vertex(0, s.h/2); p.vertex(-s.w/2, 0);
                 p.endShape(p.CLOSE);
              }
              p.pop();
           }
        }

        p.pop();

        // Dim background if in journal mode
        if (currentState === 'journal_input' || currentState === 'journal_view') {
          p.fill(255, 255, 255, 200);
          p.rectMode(p.CORNER);
          p.rect(0, 0, p.width, p.height);
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };

    p5Instance = new p5(sketch);

    return () => {
      p5Instance.remove();
      unsubPhase();
      unsubState();
    };
  });
</script>

<div bind:this={canvasContainer} class="p5-container"></div>

<style>
  .p5-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: auto;
  }
</style>
