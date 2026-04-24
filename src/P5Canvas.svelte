<script>
  import { onMount } from 'svelte';
  import p5 from 'p5';
  import { shakeIntensity, appState, hasShaken } from './store.js';

  let canvasContainer;
  let p5Instance;

  onMount(() => {
    const sketch = (p) => {
      let currentShake = 0;
      let targetShake = 0;
      let angle = 0;

      let currentVariation = 0;
      let variations = [
        // 0: Classic 8-slice petal & diamond
        (r) => {
          let slices = 8;
          for (let i = 0; i < slices; i++) {
            p.push(); p.rotate((p.TWO_PI / slices) * i);
            p.fill('#e0e0e0'); p.ellipse(0, r * 0.8, r * 0.4, r * 1.2);
            p.fill('#000000'); p.ellipse(0, r * 0.9, r * 0.15, r * 0.6);
            p.push(); p.rotate(p.TWO_PI / (slices * 2));
            p.fill('#e0e0e0'); p.quad(0, r * 0.45, r * 0.15, r * 0.7, 0, r * 0.95, -r * 0.15, r * 0.7);
            p.fill('#000000'); p.circle(0, r * 1.05, r * 0.1);
            p.pop(); p.pop();
          }
          p.fill('#e0e0e0'); p.circle(0, 0, r * 0.5);
          p.fill('#000000'); p.circle(0, 0, r * 0.15);
        },
        // 1: 12-slice sharp diamonds
        (r) => {
          let slices = 12;
          for (let i = 0; i < slices; i++) {
            p.push(); p.rotate((p.TWO_PI / slices) * i);
            p.fill('#e0e0e0'); p.quad(0, r * 0.3, r * 0.2, r * 0.8, 0, r * 1.3, -r * 0.2, r * 0.8);
            p.fill('#000000'); p.quad(0, r * 0.4, r * 0.1, r * 0.8, 0, r * 1.1, -r * 0.1, r * 0.8);
            p.pop();
          }
          p.fill('#000000'); p.circle(0, 0, r * 0.5);
          p.fill('#e0e0e0'); p.circle(0, 0, r * 0.2);
        },
        // 2: 6-slice large alternating circles
        (r) => {
          let slices = 6;
          for (let i = 0; i < slices; i++) {
            p.push(); p.rotate((p.TWO_PI / slices) * i);
            p.fill('#e0e0e0'); p.circle(0, r * 0.8, r * 0.7);
            p.fill('#000000'); p.circle(0, r * 0.8, r * 0.3);
            p.push(); p.rotate(p.TWO_PI / (slices * 2));
            p.fill('#e0e0e0'); p.ellipse(0, r * 0.5, r * 0.2, r * 0.8);
            p.pop(); p.pop();
          }
          p.fill('#000000'); p.circle(0, 0, r * 0.3);
        },
        // 3: 4-slice retro blocks
        (r) => {
          let slices = 4;
          for (let i = 0; i < slices; i++) {
            p.push(); p.rotate((p.TWO_PI / slices) * i);
            p.fill('#e0e0e0'); p.rect(0, r * 0.7, r * 0.6, r * 1.2);
            p.fill('#000000'); p.rect(0, r * 0.7, r * 0.2, r * 0.8);
            p.push(); p.rotate(p.TWO_PI / (slices * 2));
            p.fill('#e0e0e0'); p.circle(0, r * 0.8, r * 0.4);
            p.fill('#000000'); p.circle(0, r * 0.8, r * 0.15);
            p.pop(); p.pop();
          }
          p.fill('#000000'); p.rect(0, 0, r * 0.4, r * 0.4);
        },
        // 4: 10-slice dotted trail
        (r) => {
          let slices = 10;
          for (let i = 0; i < slices; i++) {
            p.push(); p.rotate((p.TWO_PI / slices) * i);
            p.fill('#e0e0e0'); p.ellipse(0, r * 0.6, r * 0.2, r * 0.8);
            p.fill('#000000'); 
            p.circle(0, r * 1.1, r * 0.15);
            p.circle(0, r * 1.3, r * 0.1);
            p.circle(0, r * 1.45, r * 0.05);
            p.pop();
          }
          p.fill('#e0e0e0'); p.circle(0, 0, r * 0.4);
        },
        // 5: 8-slice overlapping shapes
        (r) => {
          let slices = 8;
          for (let i = 0; i < slices; i++) {
            p.push(); p.rotate((p.TWO_PI / slices) * i);
            p.fill('#e0e0e0');
            p.arc(-r*0.15, r*0.8, r*0.3, r*0.3, p.PI, p.TWO_PI);
            p.arc(r*0.15, r*0.8, r*0.3, r*0.3, p.PI, p.TWO_PI);
            p.triangle(-r*0.3, r*0.8, r*0.3, r*0.8, 0, r*1.2);
            p.fill('#000000'); p.ellipse(0, r*0.9, r*0.15, r*0.3);
            p.push(); p.rotate(p.TWO_PI / (slices * 2));
            p.fill('#e0e0e0'); p.circle(0, r*0.5, r*0.15);
            p.pop(); p.pop();
          }
          p.fill('#000000'); p.circle(0, 0, r * 0.2);
        },
        // 6: 16-slice sunburst
        (r) => {
          let slices = 16;
          for (let i = 0; i < slices; i++) {
            p.push(); p.rotate((p.TWO_PI / slices) * i);
            p.fill('#e0e0e0'); p.triangle(-r*0.08, r*0.3, r*0.08, r*0.3, 0, r*1.4);
            p.fill('#000000'); p.circle(0, r*0.7, r*0.08);
            p.pop();
          }
          p.fill('#000000'); p.circle(0, 0, r * 0.4);
          p.fill('#e0e0e0'); p.circle(0, 0, r * 0.2);
        },
        // 7: 6-slice star
        (r) => {
          let slices = 6;
          for (let i = 0; i < slices; i++) {
            p.push(); p.rotate((p.TWO_PI / slices) * i);
            p.fill('#e0e0e0'); 
            p.beginShape();
            p.vertex(0, r*0.3); p.vertex(r*0.3, r*0.6); p.vertex(r*0.2, r*1.1);
            p.vertex(-r*0.2, r*1.1); p.vertex(-r*0.3, r*0.6);
            p.endShape(p.CLOSE);
            p.fill('#000000'); 
            p.circle(0, r*0.7, r*0.2);
            p.pop();
          }
          p.fill('#e0e0e0'); p.circle(0, 0, r*0.5);
          p.fill('#000000'); p.circle(0, 0, r*0.1);
        },
        // 8: 8-slice target pills
        (r) => {
          let slices = 8;
          for (let i = 0; i < slices; i++) {
            p.push(); p.rotate((p.TWO_PI / slices) * i);
            p.fill('#e0e0e0'); p.rect(0, r*0.8, r*0.3, r*0.9, r*0.15);
            p.fill('#000000'); p.circle(0, r*0.5, r*0.2);
            p.circle(0, r*1.1, r*0.2);
            p.push(); p.rotate(p.TWO_PI / (slices * 2));
            p.fill('#e0e0e0'); p.rect(0, r*0.5, r*0.1, r*0.6, r*0.05);
            p.pop(); p.pop();
          }
          p.fill('#000000'); p.circle(0, 0, r*0.4);
        },
        // 9: 12-slice delicate lines and dots
        (r) => {
          let slices = 12;
          for (let i = 0; i < slices; i++) {
            p.push(); p.rotate((p.TWO_PI / slices) * i);
            p.fill('#e0e0e0'); p.rect(0, r*0.8, r*0.06, r*1.2);
            p.fill('#000000'); p.circle(0, r*1.4, r*0.15);
            p.push(); p.rotate(p.TWO_PI / (slices * 2));
            p.fill('#000000'); p.ellipse(0, r*0.6, r*0.2, r*0.5);
            p.pop(); p.pop();
          }
          p.fill('#e0e0e0'); p.circle(0, 0, r*0.3);
          p.fill('#000000'); p.circle(0, 0, r*0.15);
        }
      ];

      p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent(canvasContainer);
        p.rectMode(p.CENTER);
        p.noStroke();
        currentVariation = p.floor(p.random(variations.length));
      };

      p.mouseClicked = () => {
        currentVariation = (currentVariation + 1) % variations.length;
      };

      p.draw = () => {
        p.background(255, 255, 255); // Light background

        // Get hardware shake
        let shake = p.dist(0, 0, 0, p.accelerationX, p.accelerationY, p.accelerationZ);
        if (isNaN(shake)) shake = 0;
        
        // Add mouse dragging to simulate shake
        if (p.mouseIsPressed) {
          let mouseVelocity = p.dist(p.mouseX, p.mouseY, p.pmouseX, p.pmouseY);
          shake += mouseVelocity * 0.5;
        }

        // Smooth out the shake value
        targetShake = p.max(targetShake * 0.95, shake); 
        currentShake = p.lerp(currentShake, targetShake, 0.1);
        
        // Update stores
        shakeIntensity.set(currentShake);
        if (currentShake > 15) {
          hasShaken.set(true);
        }

        // Rotate square based on shake
        angle += 0.01 + (currentShake * 0.01);

        let currentState;
        appState.subscribe(val => currentState = val)();

        p.push();
        p.translate(p.width / 2, p.height / 2);
        
        if (currentState === 'journal_input' || currentState === 'journal_view') {
          // Move up and expand when in journal mode
          p.translate(0, -p.height / 4);
          p.scale(1.5);
        }

        p.rotate(angle);
        
        let baseRadius = 120 + currentShake * 3;
        
        // Draw the current variation
        if (variations[currentVariation]) {
          variations[currentVariation](baseRadius);
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
