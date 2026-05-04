<script>
  import { onMount } from 'svelte';
  import p5 from 'p5';
  import { shakeIntensity, appState, visualPhase, strokeType, strokeColor } from './store.js';

  let canvasContainer;
  let p5Instance;

  onMount(() => {
    let currentVisualPhase = 'drawing';
    const unsubPhase = visualPhase.subscribe(v => currentVisualPhase = v);
    let currentState = 'home';
    const unsubState = appState.subscribe(v => currentState = v);
    let currentStrokeType = 'rect';
    const unsubStroke = strokeType.subscribe(v => currentStrokeType = v);
    let currentStrokeColor = '#000000';
    const unsubColor = strokeColor.subscribe(v => currentStrokeColor = v);

    const sketch = (p) => {
      let currentShake = 0;
      let targetShake = 0;
      
      let shards = [];
      
      let maxShakeDuringBreak = 0;
      let calmFrames = 0; // To detect when shake has stopped
      
      let globalRotation = 0;
      let slices = 1;
      let bloomProgress = 0;
      let lastDrawPoint = null;
      let shardCounter = 0;
      
      let shakeCount = 0;
      let originalShardCount = 0;

      // Initialize shards
      p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent(canvasContainer);
        p.rectMode(p.CENTER);
        p.noStroke();
      };

      p.mouseDragged = () => {
        if (currentVisualPhase === 'drawing' && currentState === 'home') {
           let pt = p.createVector(p.mouseX - p.width/2, p.mouseY - p.height/2);
           
           if (!lastDrawPoint || p.dist(lastDrawPoint.x, lastDrawPoint.y, pt.x, pt.y) > 5) {
               let len = lastDrawPoint ? p.dist(lastDrawPoint.x, lastDrawPoint.y, pt.x, pt.y) : 5;
               let rot = lastDrawPoint ? p.atan2(pt.y - lastDrawPoint.y, pt.x - lastDrawPoint.x) : 0;
                   
                   let w = len + 2;
                   let h = p.random(2, 6);
                   
                   if (currentStrokeType === 'ellipse' || currentStrokeType === 'rect') {
                       w = p.random(10, 25);
                       h = w;
                       rot = p.random(p.TWO_PI);
                   } else if (currentStrokeType === 'line') {
                       w = len + 5;
                       h = p.random(2, 6);
                   }

                   shards.push({
                       id: shardCounter++,
                       x: pt.x, y: pt.y, rot: rot, w: w, h: h,
                       targetW: w, targetH: h,
                       originalW: w, originalH: h,
                       vx: 0, vy: 0, vrot: 0,
                       targetX: pt.x, targetY: pt.y, targetRot: rot,
                       baseTargetX: pt.x, baseTargetY: pt.y, baseTargetRot: rot,
                       color: currentStrokeColor,
                       type: currentStrokeType === 'line' ? 'rect' : currentStrokeType
                   });
                   lastDrawPoint = pt;
               }
        }
      };

      p.mouseReleased = () => {
         lastDrawPoint = null;
      };



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
        if (currentVisualPhase === 'ready_to_shake' && currentShake > 8 && shards.length > 10) {
           visualPhase.set('breaking');
           maxShakeDuringBreak = currentShake;
           calmFrames = 0;
           bloomProgress = 0;
           shakeCount = 1;
           originalShardCount = shards.length;
           for(let s of shards) {
               s.isDead = false;
               s.vx = p.random(-5, 5);
               s.vy = p.random(-5, 5);
               s.vrot = p.random(-0.2, 0.2);
           }
        }

        if (currentVisualPhase === 'bloom' && currentState === 'home') {
           if (currentShake > 25) { // Reshake
              visualPhase.set('breaking');
              maxShakeDuringBreak = currentShake;
              calmFrames = 0;
              shakeCount++;

              let ratio = 1.0;
              if (shakeCount === 2) ratio = 0.90;
              else if (shakeCount === 3) ratio = 0.75;
              else if (shakeCount === 4) ratio = 0.50;
              else if (shakeCount === 5) ratio = 0.25;
              else if (shakeCount >= 6) ratio = 0.0;

              let targetCount = p.floor(originalShardCount * ratio);
              let killCount = p.max(0, shards.length - targetCount);

              let indices = shards.map((_, i) => i);
              indices = p.shuffle(indices);

              let killed = 0;
              for(let i of indices) {
                  let s = shards[i];
                  if (killed < killCount) {
                      s.isDead = true;
                      killed++;
                  } else {
                      s.isDead = false;
                      s.targetW = s.originalW;
                      s.targetH = s.originalH;
                  }
                  s.vx = p.random(-10, 10);
                  s.vy = p.random(-10, 10);
                  s.vrot = p.random(-0.3, 0.3);
              }
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
              
              // Physics movement
              s.x += s.vx;
              s.y += s.vy;
              s.rot += s.vrot;
              
              // Gravity to center to prevent flying off screen
              s.vx += -s.x * 0.001;
              s.vy += -s.y * 0.001;
              
              // Friction
              s.vx *= 0.92;
              s.vy *= 0.92;
              s.vrot *= 0.95;
           }

           // Check if shake subsided to transition to bloom
           if (currentShake < 5) {
              calmFrames++;
              if (calmFrames > 30) { // Half a second of calm
                 visualPhase.set('bloom');
                 
                 // Filter out dead shards permanently
                 shards = shards.filter(s => !s.isDead);

                 slices = p.random([4, 6, 8, 10, 12, 16]);
                 let baseSize = p.floor(shards.length / slices);
                 
                 for(let i = 0; i < slices; i++) {
                     let angle = (p.TWO_PI / slices) * i;
                     let isMirrored = (i % 2 === 1);
                     
                     for(let k = 0; k < baseSize; k++) {
                         let idx = i * baseSize + k;
                         if (idx >= shards.length) break;
                         let s = shards[idx];
                         
                         let baseX = shards[k].x;
                         let baseY = shards[k].y;
                         let baseRot = shards[k].rot;
                         
                         let tx = baseX;
                         let ty = baseY;
                         let trot = baseRot;
                         
                         if (isMirrored) {
                             ty = -ty;
                             trot = -trot;
                         }
                         
                         s.baseTargetX = tx * p.cos(angle) - ty * p.sin(angle);
                         s.baseTargetY = tx * p.sin(angle) + ty * p.cos(angle);
                         s.baseTargetRot = trot + angle;
                         
                         s.targetW = shards[k].originalW;
                         s.targetH = shards[k].originalH;
                     }
                 }
                 
                 // Remainder shards fade out
                 for(let k = slices * baseSize; k < shards.length; k++) {
                     shards[k].targetW = 0;
                     shards[k].targetH = 0;
                 }
              }
           } else {
              calmFrames = 0;
           }
        } else if (currentVisualPhase === 'bloom') {
           let time = p.millis() * 0.001;
           for(let s of shards) {
               s.targetX = s.baseTargetX + p.sin(time + s.id * 0.1) * 2;
               s.targetY = s.baseTargetY + p.cos(time + s.id * 0.1) * 2;
               s.targetRot = s.baseTargetRot + p.sin(time * 0.5 + s.id * 0.1) * 0.02;
           }
        }

        // Draw Scene
        p.push();
        p.translate(p.width / 2, p.height / 2);
        
        if (currentState === 'journal_input' || currentState === 'journal_view') {
          p.translate(0, -p.height / 4);
          p.scale(1.5);
        }

        // Update shards morphing physics
        for(let s of shards) {
           if (currentVisualPhase === 'breaking') {
              s.targetX = s.x;
              s.targetY = s.y;
              s.targetRot = s.rot;
              
              if (s.isDead) {
                  s.targetW = 0;
                  s.targetH = 0;
              }
              
              s.w = p.lerp(s.w, s.targetW, 0.02);
              s.h = p.lerp(s.h, s.targetH, 0.02);
           } else {
              s.x = p.lerp(s.x, s.targetX, 0.04);
              s.y = p.lerp(s.y, s.targetY, 0.04);
              s.rot = p.lerp(s.rot, s.targetRot, 0.04);
              s.w = p.lerp(s.w, s.targetW, 0.04);
              s.h = p.lerp(s.h, s.targetH, 0.04);
              s.vx = 0; s.vy = 0; s.vrot = 0;
           }
        }

        // Global gentle rotation in bloom phase
        if (currentVisualPhase === 'bloom') {
           globalRotation += 0.002 + (currentShake * 0.001);
        } else {
           globalRotation = 0;
        }
        p.rotate(globalRotation);

        for(let s of shards) {
            if (s.w > 0.5 && s.h > 0.5) {
                p.push();
                p.translate(s.x, s.y);
                p.rotate(s.rot);
                
                p.fill(s.color);
                
                if (s.type === 'rect') p.rect(0, 0, s.w, s.h, s.w*0.1);
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
      unsubStroke();
      unsubColor();
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
