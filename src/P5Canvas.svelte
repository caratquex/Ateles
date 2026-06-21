<script>
  import { onMount } from "svelte";
  import p5 from "p5";
  import {
    shakeIntensity,
    appState,
    visualPhase,
    strokeType,
    strokeColor,
    cameraShakeIntensity,
    journalLayout,
    activeTheme,
    currentAtelesData,
    activeEntryId,
    journalEntries,
    clearCanvasTrigger,
    saveVisualTrigger,
    fillMode,
    strokeSize,
    strokeOpacity,
    hasDrawing,
  } from "./store.js";

  let canvasContainer;
  let p5Instance;

  onMount(() => {
    let currentVisualPhase = "drawing";
    const unsubPhase = visualPhase.subscribe((v) => (currentVisualPhase = v));
    let currentState = "home";
    const unsubState = appState.subscribe((v) => (currentState = v));
    let currentStrokeType = "rect";
    const unsubStroke = strokeType.subscribe((v) => (currentStrokeType = v));
    let currentStrokeColor = "#000000";
    const unsubColor = strokeColor.subscribe((v) => (currentStrokeColor = v));
    let currentStrokeSize = 1.0;
    const unsubStrokeSize = strokeSize.subscribe((v) => (currentStrokeSize = v));
    let currentStrokeOpacity = 1.0;
    const unsubStrokeOpacity = strokeOpacity.subscribe((v) => (currentStrokeOpacity = v));
    let currentFillMode = "solid";
    const unsubFillMode = fillMode.subscribe((v) => (currentFillMode = v));
    let currentCameraShake = 0;
    const unsubCameraShake = cameraShakeIntensity.subscribe(
      (v) => (currentCameraShake = v),
    );
    let currentJournalLayout = 0;
    const unsubLayout = journalLayout.subscribe(
      (v) => (currentJournalLayout = v),
    );

    let bgHex = "#FFFFFF";
    let borderHex = "rgba(0, 0, 0, 0.10)";
    const unsubTheme = activeTheme.subscribe((v) => {
      setTimeout(() => {
        const style = getComputedStyle(document.documentElement);
        bgHex = style.getPropertyValue("--color-bg").trim() || "#FFFFFF";
        borderHex = style.getPropertyValue("--color-border-strong").trim() || "rgba(0, 0, 0, 0.20)";
      }, 50);
    });

    let allEntries = [];
    const unsubEntries = journalEntries.subscribe((v) => (allEntries = v));
    let unsubActiveEntry;
    let unsubClear;

    let saveTriggered = false;
    const unsubSave = saveVisualTrigger.subscribe((v) => {
      if (v > 0) saveTriggered = true;
    });

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

      let totalDrawDistance = 0;
      let totalDrawDistX = 0;
      let totalDrawDistY = 0;
      let maxShakeX = 0;
      let maxShakeY = 0;

      let visualParams = {
        breathingAmp: 2,
        breathingFreq: 0.1,
        rotSpeed: 0.002,
        orbitXRatio: 1.0,
        orbitYRatio: 1.0,
        breathingStyle: "radial",
      };

      unsubActiveEntry = activeEntryId.subscribe((v) => {
        if (v != null) {
          let entry = allEntries.find((e) => e.id === v);
          if (entry && entry.atelesData) {
            shards = entry.atelesData.shards.map((s) => ({ ...s }));
            bgHex = entry.atelesData.bgHex || bgHex;
            visualParams = entry.atelesData.visualParams || {
              breathingAmp: 2,
              breathingFreq: 0.1,
              rotSpeed: 0.002,
              orbitXRatio: 1.0,
              orbitYRatio: 1.0,
              breathingStyle: "radial",
            };
            visualPhase.set("bloom");
            appState.set("journal_view");
          }
        } else {
          // Reset when going back to home
          if (currentState === "home" || currentState === "gallery") {
            shards = [];
            totalDrawDistance = 0;
            totalDrawDistX = 0;
            totalDrawDistY = 0;
            maxShakeX = 0;
            maxShakeY = 0;
            visualPhase.set("drawing");
            hasDrawing.set(false);
          }
        }
      });

      unsubClear = clearCanvasTrigger.subscribe((v) => {
        if (v > 0) {
          shards = [];
          totalDrawDistance = 0;
          totalDrawDistX = 0;
          totalDrawDistY = 0;
          maxShakeX = 0;
          maxShakeY = 0;
          visualPhase.set("drawing");
          hasDrawing.set(false);
        }
      });

      // Lerped journal visual positioning
      let jX = 0,
        jY = 0,
        jScale = 1;
      let jTargetX = 0,
        jTargetY = 0,
        jTargetScale = 1;

      // Minimum distance between shard placements
      const MIN_DRAW_DIST = 5;
      // Interpolation step size for filling gaps between fast touch moves
      const INTERP_STEP = 4;

      function createShard(px, py, prevPt) {
        hasDrawing.set(true);
        let len = prevPt ? p.dist(prevPt.x, prevPt.y, px, py) : 5;
        let rot = prevPt ? p.atan2(py - prevPt.y, px - prevPt.x) : 0;

        let magnitude = p.constrain(len, 1, 50);
        let strokeOpacity = p.map(magnitude, 1, 25, 255, 10) * currentStrokeOpacity;
        let sizeMult = p.map(magnitude, 1, 25, 1.0, 0.1) * currentStrokeSize;

        let w, h;
        if (currentStrokeType === "ellipse" || currentStrokeType === "rect") {
          w = p.random(10, 25) * sizeMult;
          h = w;
          rot = p.random(p.TWO_PI);
        } else {
          w = (len + 5) * sizeMult;
          h = p.random(2, 6) * sizeMult;
        }

        shards.push({
          id: shardCounter++,
          x: px,
          y: py,
          rot: rot,
          w: w,
          h: h,
          targetW: w,
          targetH: h,
          originalW: w,
          originalH: h,
          vx: 0,
          vy: 0,
          vrot: 0,
          targetX: px,
          targetY: py,
          targetRot: rot,
          baseTargetX: px,
          baseTargetY: py,
          baseTargetRot: rot,
          color: currentStrokeColor,
          opacity: strokeOpacity,
          type: currentStrokeType === "line" ? "rect" : currentStrokeType,
          fillMode: currentFillMode,
        });
      }

      // Adds shards along a line from lastDrawPoint to (cx, cy),
      // interpolating if the gap is large (fast swipes on mobile).
      function addDrawPoints(cx, cy) {
        if (currentVisualPhase !== "drawing" || currentState !== "home") return;

        let pt = p.createVector(cx - p.width / 2, cy - p.height / 2);

        if (!lastDrawPoint) {
          createShard(pt.x, pt.y, null);
          lastDrawPoint = pt;
          return;
        }

        let d = p.dist(lastDrawPoint.x, lastDrawPoint.y, pt.x, pt.y);
        if (d < MIN_DRAW_DIST) return;

        let dx = Math.abs(pt.x - lastDrawPoint.x);
        let dy = Math.abs(pt.y - lastDrawPoint.y);
        totalDrawDistX += dx;
        totalDrawDistY += dy;
        totalDrawDistance += d;

        // Interpolate for smooth, gap-free strokes
        let steps = Math.max(1, Math.floor(d / INTERP_STEP));
        for (let i = 1; i <= steps; i++) {
          let t = i / steps;
          let ix = p.lerp(lastDrawPoint.x, pt.x, t);
          let iy = p.lerp(lastDrawPoint.y, pt.y, t);
          createShard(ix, iy, lastDrawPoint);
          lastDrawPoint = p.createVector(ix, iy);
        }
      }

      // Initialize canvas
      p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent(canvasContainer);
        p.rectMode(p.CENTER);
        p.noStroke();
      };

      // ── Mouse handlers (desktop) ──────────────────────
      p.mouseDragged = (event) => {
        if (event && event.target && event.target.tagName !== "CANVAS") return;
        if (currentVisualPhase === "drawing" && currentState === "home") {
          addDrawPoints(p.mouseX, p.mouseY);
          return false; // prevent default only when drawing
        }
      };

      p.mouseReleased = (event) => {
        if (event && event.target && event.target.tagName !== "CANVAS") return;
        lastDrawPoint = null;
      };

      // ── Touch handlers (mobile) ───────────────────────
      p.touchStarted = (event) => {
        if (event && event.target && event.target.tagName !== "CANVAS") return;
        if (currentVisualPhase === "drawing" && currentState === "home") {
          lastDrawPoint = null; // reset for new stroke
          if (p.touches.length > 0) {
            addDrawPoints(p.touches[0].x, p.touches[0].y);
          }
          return false; // prevent default only when drawing
        }
      };

      p.touchMoved = (event) => {
        if (event && event.target && event.target.tagName !== "CANVAS") return;
        if (currentVisualPhase === "drawing" && currentState === "home") {
          if (p.touches.length > 0) {
            addDrawPoints(p.touches[0].x, p.touches[0].y);
          }
          return false; // prevent default only when drawing
        }
      };

      p.touchEnded = (event) => {
        if (event && event.target && event.target.tagName !== "CANVAS") return;
        if (currentVisualPhase === "drawing" && currentState === "home") {
          lastDrawPoint = null;
          return false;
        }
      };

      p.draw = () => {
        if (saveTriggered) {
          p.clear();
        } else {
          p.background(bgHex);

          // Draw notebook dot grid background
          p.push();
          let dotColor = p.color(borderHex);
          // Set opacity to make it look subtle and elegant
          dotColor.setAlpha(80);
          p.fill(dotColor);
          p.noStroke();
          
          let spacing = 24;
          let dotSize = 2.0;
          for (let x = spacing / 2; x < p.width; x += spacing) {
            for (let y = spacing / 2; y < p.height; y += spacing) {
              p.ellipse(x, y, dotSize, dotSize);
            }
          }
          p.pop();
        }

        // Physics / Shake detection
        let shake = p.dist(
          0,
          0,
          0,
          p.accelerationX,
          p.accelerationY,
          p.accelerationZ,
        );
        if (isNaN(shake)) shake = 0;

        // Add camera shake input
        shake += currentCameraShake;

        if (p.mouseIsPressed) {
          let mouseVelocity = p.dist(p.mouseX, p.mouseY, p.pmouseX, p.pmouseY);
          shake += mouseVelocity * 0.5;
        }

        targetShake = p.max(targetShake * 0.95, shake);
        currentShake = p.lerp(currentShake, targetShake, 0.1);
        shakeIntensity.set(currentShake);

        // Phase Transitions
        if (
          currentVisualPhase === "ready_to_shake" &&
          currentShake > 8 &&
          shards.length > 10
        ) {
          visualPhase.set("breaking");
          maxShakeDuringBreak = currentShake;
          maxShakeX = Math.abs(p.accelerationX) || 0;
          maxShakeY = Math.abs(p.accelerationY) || 0;
          calmFrames = 0;
          bloomProgress = 0;
          shakeCount = 1;
          originalShardCount = shards.length;
          for (let s of shards) {
            s.isDead = false;
            s.vx = p.random(-5, 5);
            s.vy = p.random(-5, 5);
            s.vrot = p.random(-0.2, 0.2);
          }
        }

        if (currentVisualPhase === "bloom" && currentState === "home") {
          if (currentShake > 25) {
            // Reshake
            visualPhase.set("breaking");
            maxShakeDuringBreak = currentShake;
            maxShakeX = Math.abs(p.accelerationX) || 0;
            maxShakeY = Math.abs(p.accelerationY) || 0;
            calmFrames = 0;
            shakeCount++;

            let ratio = 1.0;
            if (shakeCount === 2) ratio = 0.9;
            else if (shakeCount === 3) ratio = 0.75;
            else if (shakeCount === 4) ratio = 0.5;
            else if (shakeCount === 5) ratio = 0.25;
            else if (shakeCount >= 6) ratio = 0.0;

            let targetCount = p.floor(originalShardCount * ratio);
            let killCount = p.max(0, shards.length - targetCount);

            let indices = shards.map((_, i) => i);
            indices = p.shuffle(indices);

            let killed = 0;
            for (let i of indices) {
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

        if (currentVisualPhase === "breaking") {
          maxShakeDuringBreak = p.max(maxShakeDuringBreak, currentShake);
          maxShakeX = p.max(maxShakeX, Math.abs(p.accelerationX) || 0);
          maxShakeY = p.max(maxShakeY, Math.abs(p.accelerationY) || 0);

          // Apply chaotic force to shards
          let force = currentShake * 0.15;
          for (let s of shards) {
            s.vx += p.random(-force, force);
            s.vy += p.random(-force, force);
            s.vrot += p.random(-force * 0.02, force * 0.02);

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
            if (calmFrames > 30) {
              // Half a second of calm
              visualPhase.set("bloom");

              // Filter out dead shards permanently
              shards = shards.filter((s) => !s.isDead);

              // Calculate visual parameters based on magnitude of interactions
              // 1. Slices (Symmetry) based on shake magnitude
              slices = p.floor(p.map(maxShakeDuringBreak, 10, 80, 4, 16, true));
              if (slices % 2 !== 0) slices++; // Keep it even for better mirroring

              // 2. Spread/Spacing based on dragging distance
              let spreadMult = p.map(
                totalDrawDistance,
                1000,
                10000,
                0.8,
                2.5,
                true,
              );

              // 3. Aspect Ratio based on Dragging Direction
              let dragRatioX = 1.0;
              let dragRatioY = 1.0;
              if (totalDrawDistance > 0) {
                let hRatio = totalDrawDistX / (totalDrawDistX + totalDrawDistY);
                dragRatioX = p.map(hRatio, 0, 1, 0.5, 2.0);
                dragRatioY = p.map(hRatio, 0, 1, 2.0, 0.5);
              }

              // 4. Orbit Shape & Breathing Style based on Shake Direction
              let sRatioX = 1.0;
              let sRatioY = 1.0;
              let totalShakeDir = maxShakeX + maxShakeY;
              if (totalShakeDir > 0) {
                let hShakeRatio = maxShakeX / totalShakeDir;
                sRatioX = p.map(hShakeRatio, 0, 1, 0.6, 1.4);
                sRatioY = p.map(hShakeRatio, 0, 1, 1.4, 0.6);

                if (hShakeRatio > 0.6) {
                  visualParams.breathingStyle = "tangential";
                } else {
                  visualParams.breathingStyle = "radial";
                }
              }
              visualParams.orbitXRatio = sRatioX;
              visualParams.orbitYRatio = sRatioY;

              // 5. Animation parameters
              visualParams.breathingAmp = p.map(
                maxShakeDuringBreak,
                10,
                80,
                1.0,
                4.0,
                true,
              );
              visualParams.breathingFreq = p.map(
                maxShakeDuringBreak,
                10,
                80,
                0.05,
                0.2,
                true,
              );
              visualParams.rotSpeed = p.map(
                maxShakeDuringBreak,
                10,
                80,
                0.001,
                0.008,
                true,
              );

              let baseSize = p.floor(shards.length / slices);

              let scaleMult = p.map(
                maxShakeDuringBreak,
                10,
                80,
                0.3,
                1.0,
                true,
              );

              for (let i = 0; i < slices; i++) {
                let angle = (p.TWO_PI / slices) * i;
                let isMirrored = i % 2 === 1;

                for (let k = 0; k < baseSize; k++) {
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

                  s.baseTargetX =
                    (tx * p.cos(angle) - ty * p.sin(angle)) *
                    scaleMult *
                    spreadMult *
                    visualParams.orbitXRatio;
                  s.baseTargetY =
                    (tx * p.sin(angle) + ty * p.cos(angle)) *
                    scaleMult *
                    spreadMult *
                    visualParams.orbitYRatio;
                  s.baseTargetRot = trot + angle;

                  s.targetW = shards[k].originalW * scaleMult * dragRatioX;
                  s.targetH = shards[k].originalH * scaleMult * dragRatioY;
                }
              }

              // Remainder shards fade out
              for (let k = slices * baseSize; k < shards.length; k++) {
                shards[k].targetW = 0;
                shards[k].targetH = 0;
              }

              // Capture visual state
              let exportedShards = shards.map((s) => ({
                x: s.x,
                y: s.y,
                rot: s.rot,
                w: s.w,
                h: s.h,
                color: s.color,
                opacity: s.opacity || 255,
                type: s.type,
                fillMode: s.fillMode || "solid",
                id: s.id,
                baseTargetX: s.baseTargetX,
                baseTargetY: s.baseTargetY,
                baseTargetRot: s.baseTargetRot,
                targetW: s.targetW,
                targetH: s.targetH,
                originalW: s.originalW,
                originalH: s.originalH,
              }));
              currentAtelesData.set({
                shards: exportedShards,
                bgHex: bgHex,
                visualParams: visualParams,
              });
            }
          } else {
            calmFrames = 0;
          }
        } else if (currentVisualPhase === "bloom") {
          let time = p.millis() * 0.001;
          for (let s of shards) {
            let breathCycle =
              p.sin(time * visualParams.breathingFreq * 10 + s.id * 0.1) *
              visualParams.breathingAmp;
            let angleFromCenter = p.atan2(s.baseTargetY, s.baseTargetX);

            if (visualParams.breathingStyle === "radial") {
              // Radial pumping
              s.targetX =
                s.baseTargetX + p.cos(angleFromCenter) * breathCycle * 5;
              s.targetY =
                s.baseTargetY + p.sin(angleFromCenter) * breathCycle * 5;
              s.targetRot =
                s.baseTargetRot + p.sin(time * 0.5 + s.id * 0.1) * 0.02;
            } else {
              // Tangential swirling
              let tangX = -p.sin(angleFromCenter);
              let tangY = p.cos(angleFromCenter);
              s.targetX = s.baseTargetX + tangX * breathCycle * 5;
              s.targetY = s.baseTargetY + tangY * breathCycle * 5;
              s.targetRot =
                s.baseTargetRot +
                p.sin(time * 0.5 + s.id * 0.1) * 0.1 * breathCycle;
            }
          }
        }

        // Draw Scene
        p.push();
        p.translate(p.width / 2, p.height / 2);

        // Layout-aware journal visual positioning (lerped)
        if (currentState === "journal_input") {
          jTargetX = 0;
          jTargetY = -p.height / 4;
          jTargetScale = 1.5;
        } else if (currentState === "journal_view") {
          if (currentJournalLayout === 0) {
            jTargetX = 0;
            jTargetY = p.height * 0.18;
            jTargetScale = 1.6;
          } else if (currentJournalLayout === 1) {
            jTargetX = p.width * 0.05;
            jTargetY = p.height * 0.12;
            jTargetScale = 1.4;
          } else if (currentJournalLayout === 2) {
            jTargetX = 0;
            jTargetY = -p.height * 0.25;
            jTargetScale = 0.8;
          } else if (currentJournalLayout === 3) {
            jTargetX = -p.width * 0.15;
            jTargetY = p.height * 0.05;
            jTargetScale = 1.3;
          } else if (currentJournalLayout === 4) {
            jTargetX = p.width * 0.25;
            jTargetY = p.height * 0.2;
            jTargetScale = 2.5;
          }
        } else {
          jTargetX = 0;
          jTargetY = 0;
          jTargetScale = 1;
        }
        jX = p.lerp(jX, jTargetX, 0.06);
        jY = p.lerp(jY, jTargetY, 0.06);
        jScale = p.lerp(jScale, jTargetScale, 0.06);

        if (
          currentState === "journal_input" ||
          currentState === "journal_view"
        ) {
          p.translate(jX, jY);
          p.scale(jScale);
        }

        // Update shards morphing physics
        for (let s of shards) {
          if (currentVisualPhase === "breaking") {
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
            s.vx = 0;
            s.vy = 0;
            s.vrot = 0;
          }
        }

        // Global gentle rotation in bloom phase
        if (currentVisualPhase === "bloom") {
          globalRotation += visualParams.rotSpeed + currentShake * 0.001;
        } else {
          globalRotation = 0;
        }
        p.rotate(globalRotation);

        for (let s of shards) {
          if (s.w > 0.5 && s.h > 0.5) {
            p.push();
            p.translate(s.x, s.y);
            p.rotate(s.rot);

            let mode = s.fillMode || "solid";
            
            if (mode === "solid") {
              let c = p.color(s.color);
              c.setAlpha(s.opacity || 255);
              p.fill(c);
              p.noStroke();
            } else if (mode === "stroke") {
              let c = p.color(s.color);
              c.setAlpha(s.opacity || 255);
              p.noFill();
              p.stroke(c);
              p.strokeWeight(p.map(s.opacity || 255, 10, 255, 1, 4));
            } else if (mode === "gradient") {
              p.noStroke();
              let ctx = p.drawingContext;
              // Create a linear gradient from top to bottom of the shape
              let grad = ctx.createLinearGradient(0, -s.h/2, 0, s.h/2);
              
              let c1 = p.color(s.color);
              c1.setAlpha(s.opacity || 255);
              
              let c2 = p.color(s.color);
              c2.setAlpha(0); // Fade to transparent
              
              grad.addColorStop(0, c1.toString());
              grad.addColorStop(1, c2.toString());
              
              ctx.fillStyle = grad;
            }

            if (s.type === "rect") p.rect(0, 0, s.w, s.h, s.w * 0.1);
            else if (s.type === "ellipse") p.ellipse(0, 0, s.w, s.h);
            else if (s.type === "diamond") {
              p.beginShape();
              p.vertex(0, -s.h / 2);
              p.vertex(s.w / 2, 0);
              p.vertex(0, s.h / 2);
              p.vertex(-s.w / 2, 0);
              p.endShape(p.CLOSE);
            }
            p.pop();
          }
        }

        p.pop();

        // Dim background if in journal mode
        if (!saveTriggered) {
          if (currentState === "journal_input") {
            let c = p.color(bgHex);
            c.setAlpha(200);
            p.fill(c);
            p.rectMode(p.CORNER);
            p.rect(0, 0, p.width, p.height);
          }
        }

        if (saveTriggered) {
          p.saveCanvas("Ateles_Visual", "png");
          saveTriggered = false;
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };

    p5Instance = new p5(sketch);

    return () => {
      unsubPhase();
      unsubState();
      unsubStroke();
      unsubColor();
      unsubStrokeSize();
      unsubStrokeOpacity();
      unsubFillMode();
      unsubCameraShake();
      unsubLayout();
      unsubTheme();
      unsubEntries();
      unsubActiveEntry();
      unsubSave();
      if (unsubClear) unsubClear();
      if (p5Instance) p5Instance.remove();
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
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
</style>
