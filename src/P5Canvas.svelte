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
    stampChar,
    shakeMode,
    uploadedImage,
  } from "./store.js";
  import DrawingTracker from "./DrawingTracker.js";

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
    const unsubStrokeSize = strokeSize.subscribe(
      (v) => (currentStrokeSize = v),
    );
    let currentStrokeOpacity = 1.0;
    const unsubStrokeOpacity = strokeOpacity.subscribe(
      (v) => (currentStrokeOpacity = v),
    );
    let currentFillMode = "solid";
    const unsubFillMode = fillMode.subscribe((v) => (currentFillMode = v));
    let currentStampChar = "A";
    const unsubStampChar = stampChar.subscribe((v) => (currentStampChar = v));
    let currentShakeMode = "orbits";
    const unsubShakeMode = shakeMode.subscribe((v) => (currentShakeMode = v));
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
        borderHex =
          style.getPropertyValue("--color-border-strong").trim() ||
          "rgba(0, 0, 0, 0.20)";
      }, 50);
    });

    let currentUploadedImage = null;
    const unsubUploadedImage = uploadedImage.subscribe((v) => (currentUploadedImage = v));

    let allEntries = [];
    const unsubEntries = journalEntries.subscribe((v) => (allEntries = v));
    let unsubActiveEntry;
    let unsubClear;

    let saveTriggered = false;
    const unsubSave = saveVisualTrigger.subscribe((v) => {
      if (v > 0) saveTriggered = true;
    });

    const sketch = (p) => {
      let tracker;
      let currentShake = 0;
      let targetShake = 0;

      let shards = [];
      let undoStack = [];
      let redoStack = [];
      let currentStrokeCount = 0;

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

      let p5TextureImage = null;
      let loadedImageSrc = null;

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
            if (entry.atelesData.uploadedImage) {
              uploadedImage.set(entry.atelesData.uploadedImage);
            } else {
              uploadedImage.set(null);
            }
            visualPhase.set("bloom");
            appState.set("journal_view");
          }
        } else {
          // Reset when going back to home
          if (currentState === "home" || currentState === "gallery") {
            shards = [];
            undoStack = [];
            redoStack = [];
            currentStrokeCount = 0;
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
          undoStack = [];
          redoStack = [];
          currentStrokeCount = 0;
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

      function createShard(px, py, prevPt, speed = 5) {
        hasDrawing.set(true);
        let len = prevPt ? p.dist(prevPt.x, prevPt.y, px, py) : 5;
        let rot = prevPt ? p.atan2(py - prevPt.y, px - prevPt.x) : 0;

        let strokeOpacity = 255 * currentStrokeOpacity;

        let magnitude = p.constrain(speed, 1, 50);
        // Calligraphy style: slower (low speed) = thicker, faster (high speed) = thinner
        let sizeMult = p.map(magnitude, 1, 50, 1.5, 0.5) * currentStrokeSize;

        let w, h;
        if (currentStrokeType === "ellipse" || currentStrokeType === "rect") {
          w = p.random(10, 25) * sizeMult;
          h = w;
          rot = p.random(p.TWO_PI);
        } else if (currentStrokeType.startsWith("stamp_")) {
          w = p.random(20, 35) * sizeMult;
          h = w;
          if (currentStrokeType === "stamp_char") {
            rot = p.random(p.TWO_PI);
          } else {
            rot = p.random(-0.15, 0.15); // Slight organic tilt, but keeps plus upright
          }
        } else if (currentStrokeType === "line") {
          w = (len + 10) * sizeMult; // slight overlap
          h = 4 * sizeMult; // consistent thickness
        } else {
          w = (len + 5) * sizeMult;
          h = p.random(2, 6) * sizeMult;
        }

        let shardColor = currentStrokeColor;
        let finalFillMode = currentFillMode;

        if (currentFillMode === "image" && p5TextureImage) {
          let px = Math.floor(p.random(0, p5TextureImage.width));
          let py = Math.floor(p.random(0, p5TextureImage.height));
          let c = p5TextureImage.get(px, py);
          if (c) {
            shardColor = p.color(c[0], c[1], c[2]).toString('#rrggbb');
          }
          finalFillMode = "solid";
        }

        currentStrokeCount++;
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
          color: shardColor,
          opacity: strokeOpacity,
          type: currentStrokeType,
          fillMode: finalFillMode,
          char: currentStampChar,
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
        let startPt = p.createVector(lastDrawPoint.x, lastDrawPoint.y);
        let steps = Math.max(1, Math.floor(d / INTERP_STEP));
        let prevPt = startPt;
        for (let i = 1; i <= steps; i++) {
          let t = i / steps;
          let ix = p.lerp(startPt.x, pt.x, t);
          let iy = p.lerp(startPt.y, pt.y, t);
          createShard(ix, iy, prevPt, d);
          prevPt = p.createVector(ix, iy);
        }
        lastDrawPoint = prevPt;
      }

      // Initialize canvas
      p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent(canvasContainer);
        p.rectMode(p.CENTER);
        p.noStroke();
        tracker = new DrawingTracker(p);
      };

      p.keyPressed = (event) => {
        if (currentVisualPhase === "drawing" && currentState === "home") {
          if (
            (event.code === "KeyZ" || event.key === "z" || event.key === "Z") &&
            (event.ctrlKey || event.metaKey)
          ) {
            if (event.shiftKey) {
              // Redo
              if (redoStack.length > 0) {
                let stroke = redoStack.pop();
                undoStack.push(stroke.length);
                shards.push(...stroke);
              }
            } else {
              // Undo
              if (undoStack.length > 0) {
                let count = undoStack.pop();
                let removed = shards.splice(shards.length - count, count);
                redoStack.push(removed);
              }
            }

            // Keep `hasDrawing` state up to date
            hasDrawing.set(shards.length > 0);
          }
        }
      };

      // ── Mouse handlers (desktop) ──────────────────────
      p.mousePressed = (event) => {
        if (event && event.target && event.target.tagName !== "CANVAS") return;
        if (currentVisualPhase === "drawing" && currentState === "home") {
          lastDrawPoint = null;
          currentStrokeCount = 0;
          redoStack = [];
          if (currentStrokeType.startsWith("stamp_")) {
            createShard(p.mouseX - p.width / 2, p.mouseY - p.height / 2, null);
          } else {
            tracker.startStroke(
              p.mouseX,
              p.mouseY,
              p.millis(),
              currentStrokeSize,
            );
            addDrawPoints(p.mouseX, p.mouseY);
          }
          return false;
        }
      };

      p.mouseDragged = (event) => {
        if (event && event.target && event.target.tagName !== "CANVAS") return;
        if (currentVisualPhase === "drawing" && currentState === "home") {
          if (!currentStrokeType.startsWith("stamp_")) {
            tracker.addPoint(p.mouseX, p.mouseY);
            addDrawPoints(p.mouseX, p.mouseY);
          }
          return false; // prevent default only when drawing
        }
      };

      p.mouseReleased = (event) => {
        if (event && event.target && event.target.tagName !== "CANVAS") return;
        tracker.endStroke();
        lastDrawPoint = null;
        if (currentStrokeCount > 0) {
          undoStack.push(currentStrokeCount);
          currentStrokeCount = 0;
        }
      };

      // ── Touch handlers (mobile) ───────────────────────
      p.touchStarted = (event) => {
        if (event && event.target && event.target.tagName !== "CANVAS") return;
        if (currentVisualPhase === "drawing" && currentState === "home") {
          lastDrawPoint = null; // reset for new stroke
          currentStrokeCount = 0;
          redoStack = [];
          if (p.touches.length > 0) {
            if (currentStrokeType.startsWith("stamp_")) {
              createShard(
                p.touches[0].x - p.width / 2,
                p.touches[0].y - p.height / 2,
                null,
              );
            } else {
              tracker.startStroke(
                p.touches[0].x,
                p.touches[0].y,
                p.millis(),
                currentStrokeSize,
              );
              addDrawPoints(p.touches[0].x, p.touches[0].y);
            }
          }
          return false; // prevent default only when drawing
        }
      };

      p.touchMoved = (event) => {
        if (event && event.target && event.target.tagName !== "CANVAS") return;
        if (currentVisualPhase === "drawing" && currentState === "home") {
          if (p.touches.length > 0 && !currentStrokeType.startsWith("stamp_")) {
            tracker.addPoint(p.touches[0].x, p.touches[0].y);
            addDrawPoints(p.touches[0].x, p.touches[0].y);
          }
          return false; // prevent default only when drawing
        }
      };

      p.touchEnded = (event) => {
        if (event && event.target && event.target.tagName !== "CANVAS") return;
        if (currentVisualPhase === "drawing" && currentState === "home") {
          tracker.endStroke();
          lastDrawPoint = null;
          if (currentStrokeCount > 0) {
            undoStack.push(currentStrokeCount);
            currentStrokeCount = 0;
          }
          return false;
        }
      };

      p.draw = () => {
        if (currentUploadedImage && loadedImageSrc !== currentUploadedImage) {
          loadedImageSrc = currentUploadedImage;
          let nativeImg = new Image();
          nativeImg.crossOrigin = "Anonymous";
          nativeImg.onload = () => {
            let p5Img = p.createImage(nativeImg.width, nativeImg.height);
            p5Img.drawingContext.drawImage(nativeImg, 0, 0);
            p5Img.loadPixels(); // Ensure pixels are accessible for get()
            p5TextureImage = p5Img;
          };
          nativeImg.src = currentUploadedImage;
        }
        if (!currentUploadedImage && loadedImageSrc) {
          p5TextureImage = null;
          loadedImageSrc = null;
        }

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
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(100);
          }
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
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([80, 50, 80]);
            }
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

              visualParams.shakeMode = currentShakeMode;

              let baseSize = p.floor(shards.length / slices);
              let activeCount = slices * baseSize;

              visualParams.slices = slices;
              visualParams.baseSize = baseSize;

              let scaleMult = p.map(
                maxShakeDuringBreak,
                10,
                80,
                0.3,
                1.0,
                true,
              );

              // ==========================================
              // 1. SETUP: ORBITS
              // Distributes pieces along concentric circles
              // ==========================================
              if (visualParams.shakeMode === "orbits") {
                // 1. Sort all active shards by distance from center
                let activeShards = shards.slice(0, activeCount);
                activeShards.sort((a, b) => {
                  let d1 = p.dist(0, 0, a.x, a.y);
                  let d2 = p.dist(0, 0, b.x, b.y);
                  return d1 - d2;
                });

                // 2. Distribute into concentric rings without overlapping
                let currentRingRadius = p.random(15, 30);
                let shardIdx = 0;

                while (shardIdx < activeCount) {
                  // We assign a scale to all dots in this ring
                  let ringScale = p.random(0.4, 1.2);
                  
                  // Estimate max size of dots in this ring to prevent overlap.
                  // Assume an average base stroke size of around 25px
                  let estimatedDotSize = 25 * scaleMult * Math.max(dragRatioX, dragRatioY) * ringScale;
                  
                  // Radially: push this ring outward so it doesn't overlap the previous ring
                  let radialPadding = estimatedDotSize * p.random(1.2, 2.0);
                  let R = currentRingRadius + radialPadding;
                  currentRingRadius = R; // Save for next iteration
                  
                  // Tangentially: calculate how many dots fit along the circumference
                  let circumference = p.TWO_PI * R;
                  let arcPadding = estimatedDotSize * p.random(1.2, 2.5);
                  let capacity = Math.floor(circumference / arcPadding);
                  if (capacity < 1) capacity = 1;

                  // Take a batch of shards for this ring
                  let ringShards = [];
                  for (let i = 0; i < capacity && shardIdx < activeCount; i++) {
                     ringShards.push(activeShards[shardIdx]);
                     shardIdx++;
                  }

                  // Assign targets for this ring
                  for (let i = 0; i < ringShards.length; i++) {
                     let s = ringShards[i];
                     let theta = (i / ringShards.length) * p.TWO_PI;
                     
                     // Very minor jitter so it doesn't look completely robotic, but small enough to not overlap
                     let finalR = R + p.random(-estimatedDotSize*0.1, estimatedDotSize*0.1);

                     s.baseTargetX = finalR * p.cos(theta) * scaleMult * spreadMult * visualParams.orbitXRatio;
                     s.baseTargetY = finalR * p.sin(theta) * scaleMult * spreadMult * visualParams.orbitYRatio;
                     
                     // Follow orbit tangent
                     s.baseTargetRot = theta + p.PI / 2;
                     
                     // Maintain size proportional to original
                     s.targetW = s.originalW * scaleMult * dragRatioX * ringScale;
                     s.targetH = s.originalH * scaleMult * dragRatioY * ringScale;
                  }
                }
                // ==========================================
                // 2. SETUP: PERLIN (FLUID)
                // Prepares trails and sizes for fluid flow
                // ==========================================
              } else if (visualParams.shakeMode === "perlin") {
                for (let i = 0; i < shards.length; i++) {
                  let s = shards[i];
                  s.trail = [];
                  s.baseTargetX = s.x;
                  s.baseTargetY = s.y;
                  s.baseTargetRot = s.rot;
                  s.targetW = s.originalW * scaleMult * dragRatioX;
                  s.targetH = s.originalH * scaleMult * dragRatioY;
                }
                // ==========================================
                // 3. SETUP: MATRIX
                // Snaps pieces into structured pixel matrices
                // ==========================================
              } else if (visualParams.shakeMode === "matrix") {
                let gridSize = 40;
                for (let k = 0; k < baseSize; k++) {
                  let s = shards[k];
                  if (!s) continue;
                  s.targetW = gridSize * 0.9 * scaleMult;
                  s.targetH = gridSize * 0.9 * scaleMult;
                  s.baseTargetX =
                    Math.round(s.baseTargetX / gridSize) * gridSize;
                  s.baseTargetY =
                    Math.round(s.baseTargetY / gridSize) * gridSize;
                  s.baseTargetRot = 0;
                }

                for (let i = 1; i < slices; i++) {
                  let angle = (p.TWO_PI / slices) * i;
                  let isMirrored = i % 2 === 1;

                  for (let k = 0; k < baseSize; k++) {
                    let idx = i * baseSize + k;
                    if (idx >= shards.length) break;
                    let sMirror = shards[idx];
                    let s0 = shards[k];

                    let tx = s0.baseTargetX;
                    let ty = s0.baseTargetY;
                    let trot = s0.baseTargetRot;
                    if (isMirrored) {
                      ty = -ty;
                      trot = -trot;
                    }

                    sMirror.baseTargetX = tx * p.cos(angle) - ty * p.sin(angle);
                    sMirror.baseTargetY = tx * p.sin(angle) + ty * p.cos(angle);
                    sMirror.baseTargetRot = trot + angle;
                    sMirror.targetW = s0.targetW;
                    sMirror.targetH = s0.targetH;
                  }
                }
                // ==========================================
                // 4. SETUP: GEOMETRIC WEB
                // Pre-calculates nearest neighbor connections
                // ==========================================
              } else if (visualParams.shakeMode === "geometric_web") {
                let connections = [];
                for (let i = 0; i < shards.length; i++) {
                  let s = shards[i];
                  let dists = [];
                  for (let j = 0; j < shards.length; j++) {
                    if (i === j) continue;
                    let dSq =
                      (s.x - shards[j].x) ** 2 + (s.y - shards[j].y) ** 2;
                    dists.push({ j, dSq });
                  }
                  dists.sort((a, b) => a.dSq - b.dSq);
                  if (dists[0]) connections.push({ i1: i, i2: dists[0].j });
                  if (dists[1]) connections.push({ i1: i, i2: dists[1].j });

                  s.baseTargetX = s.x;
                  s.baseTargetY = s.y;
                  s.baseTargetRot = s.rot;
                  s.type = "rect"; // Force rectangular aesthetic
                  s.targetW = s.originalW * scaleMult * dragRatioX * 0.7;
                  s.targetH = s.originalH * scaleMult * dragRatioY * 0.7;
                }
                visualParams.webConnections = connections;
              } else if (visualParams.shakeMode === "mandala_wave") {
                // ==========================================
                // 5. SETUP: MANDALA WAVE
                // Groups shards by shape type, then distributes
                // them into separate concentric orbits.
                // Rings undulate and counter-rotate.
                // ==========================================
                let ringSpacing = 28;
                
                // Group shards by shape type
                let groups = {};
                for (let i = 0; i < activeCount; i++) {
                  let s = shards[i];
                  if (!groups[s.type]) {
                    groups[s.type] = [];
                  }
                  groups[s.type].push({
                    shard: s,
                    d: p.dist(0, 0, s.x, s.y)
                  });
                }

                // Sort shards within each group by distance, and calculate average distance
                let groupList = [];
                for (let type in groups) {
                  let arr = groups[type];
                  arr.sort((a, b) => a.d - b.d);
                  
                  let sum = arr.reduce((acc, curr) => acc + curr.d, 0);
                  let avg = sum / arr.length;
                  groupList.push({
                    type: type,
                    shards: arr.map(item => item.shard),
                    avgD: avg
                  });
                }

                // Sort groups by average distance (innermost first)
                groupList.sort((a, b) => a.avgD - b.avgD);

                let currentRingIndex = 0;

                // Distribute each group into its own set of rings (no mixed types in any ring)
                for (let g of groupList) {
                  let typeShards = g.shards;
                  let M = typeShards.length;
                  
                  // Target density ~12 particles per ring
                  let ringsNeeded = Math.max(1, Math.ceil(M / 12));
                  let baseParticlesPerRing = Math.ceil(M / ringsNeeded);

                  for (let r = 0; r < ringsNeeded; r++) {
                    let startIndex = r * baseParticlesPerRing;
                    let endIndex = Math.min(M, (r + 1) * baseParticlesPerRing);
                    let countInThisRing = endIndex - startIndex;
                    if (countInThisRing <= 0) continue;

                    let baseR = (currentRingIndex + 1) * ringSpacing * scaleMult;

                    for (let j = 0; j < countInThisRing; j++) {
                      let s = typeShards[startIndex + j];
                      let theta = (j / countInThisRing) * p.TWO_PI;

                      s.ringIndex = currentRingIndex;
                      s.ringTheta = theta;
                      s.ringBaseR = baseR;

                      s.baseTargetX = p.cos(theta) * baseR;
                      s.baseTargetY = p.sin(theta) * baseR;
                      s.baseTargetRot = theta + p.PI / 2;

                      // Uniform compact size, but preserve line thickness
                      if (s.type === "line") {
                        s.targetW = p.constrain(s.originalW * scaleMult * 0.9, 10, 40);
                        s.targetH = s.originalH * scaleMult;
                      } else {
                        let sz = p.constrain(s.originalW * scaleMult * 0.9, 4, 22);
                        s.targetW = sz;
                        s.targetH = sz;
                      }

                      // Keep 100% opacity
                      s.opacity = 255;
                    }
                    currentRingIndex++;
                  }
                }
              } else if (visualParams.shakeMode === "emblem") {
                // ==========================================
                // 6. SETUP: EMBLEM
                // Sorts by size (largest at back), places largest
                // at center, and symmetrically arranges the rest
                // in concentric groups of 4 around the center.
                // ==========================================
                
                // Get active shards and calculate area
                let emblemShards = [];
                for (let i = 0; i < activeCount; i++) {
                  let s = shards[i];
                  s.area = (s.originalW || s.w) * (s.originalH || s.h);
                  emblemShards.push(s);
                }
                
                // Sort descending by area
                emblemShards.sort((a, b) => b.area - a.area);
                
                // We actually need to reorder the real `shards` array for z-index to work
                // in the draw loop. 
                // We'll replace the first activeCount elements with sorted ones.
                for (let i = 0; i < activeCount; i++) {
                  shards[i] = emblemShards[i];
                }
                
                if (activeCount > 0) {
                  // Center the largest shard
                  let centerS = shards[0];
                  centerS.baseTargetX = 0;
                  centerS.baseTargetY = 0;
                  centerS.baseTargetRot = 0;
                  centerS.targetW = centerS.originalW * scaleMult * dragRatioX;
                  centerS.targetH = centerS.originalH * scaleMult * dragRatioY;
                  centerS.emblemLayer = 0;

                  let radiusStep = 45 * scaleMult;
                  let remaining = activeCount - 1;
                  let idx = 1;
                  let layerIndex = 0;

                  while (remaining > 0) {
                    let groupSize = Math.min(4, remaining);
                    let R = (layerIndex + 1) * radiusStep;
                    // Alternate axes: diagonals for even layerIndex, cardinals for odd
                    let startAngle = (layerIndex % 2 === 0) ? p.PI / 4 : 0;
                    
                    // If we have an incomplete layer (less than 4), we distribute them symmetrically
                    let angleStep = (groupSize < 4) ? (p.TWO_PI / groupSize) : (p.PI / 2);
                    if (groupSize < 4) {
                       startAngle = 0; // Reset start angle for incomplete layers for perfect symmetry
                    }

                    for (let j = 0; j < groupSize; j++) {
                      let s = shards[idx];
                      let angle = startAngle + j * angleStep;
                      
                      s.baseTargetX = R * p.cos(angle);
                      s.baseTargetY = R * p.sin(angle);
                      // Point outward from center
                      s.baseTargetRot = angle;
                      s.targetW = s.originalW * scaleMult * dragRatioX;
                      s.targetH = s.originalH * scaleMult * dragRatioY;
                      s.emblemLayer = layerIndex + 1;
                      
                      idx++;
                    }
                    
                    remaining -= groupSize;
                    layerIndex++;
                  }
                }
              } else {
                // 'chaos' mode
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
                char: s.char,
                id: s.id,
                baseTargetX: s.baseTargetX,
                baseTargetY: s.baseTargetY,
                baseTargetRot: s.baseTargetRot,
                targetW: s.targetW,
                targetH: s.targetH,
                originalW: s.originalW,
                originalH: s.originalH,
                ringIndex: s.ringIndex,
                ringBaseR: s.ringBaseR,
                ringTheta: s.ringTheta,
                emblemLayer: s.emblemLayer,
              }));
              currentAtelesData.set({
                shards: exportedShards,
                bgHex: bgHex,
                visualParams: visualParams,
                uploadedImage: currentUploadedImage,
              });
            }
          } else {
            calmFrames = 0;
          }
        } else if (currentVisualPhase === "bloom") {
          let time = p.millis() * 0.001;
          for (let i = 0; i < shards.length; i++) {
            let s = shards[i];
            // ==========================================
            // PHYSICS TICK: PERLIN (FLUID)
            // Evaluates noise fields for flowing motion
            // ==========================================
            if (visualParams.shakeMode === "perlin") {
              let bSize = visualParams.baseSize || shards.length;
              let sliceIdx = Math.floor(i / bSize);
              let k = i % bSize;

              if (sliceIdx === 0) {
                s.jumped = false;
                // Randomly respawn particles to prevent them from merging into a single sink
                if (p.random() < 0.008) {
                  let spawnDist = p.random(10, p.width * 0.25);
                  let spawnAngle = p.random(0, p.TWO_PI);
                  s.baseTargetX = p.cos(spawnAngle) * spawnDist;
                  s.baseTargetY = p.sin(spawnAngle) * spawnDist;
                  s.trail = [];
                  s.jumped = true;
                }

                let noiseScale = 0.005;
                let angle =
                  p.noise(
                    s.baseTargetX * noiseScale,
                    s.baseTargetY * noiseScale,
                    time * 0.2,
                  ) *
                  p.TWO_PI *
                  4;
                let speed = 0.4;
                s.baseTargetX += p.cos(angle) * speed;
                s.baseTargetY += p.sin(angle) * speed;

                let d = p.dist(0, 0, s.baseTargetX, s.baseTargetY);
                if (d > p.width * 0.4) {
                  s.baseTargetX *= 0.98;
                  s.baseTargetY *= 0.98;
                }

                s.targetX = s.baseTargetX;
                s.targetY = s.baseTargetY;
                s.targetRot = angle;
              } else {
                let rootShard = shards[k];
                if (rootShard.jumped) {
                  s.trail = [];
                }

                let tx = rootShard.targetX;
                let ty = rootShard.targetY;
                let trot = rootShard.targetRot;

                let angleMod =
                  (p.TWO_PI / (visualParams.slices || 1)) * sliceIdx;
                let isMirrored = sliceIdx % 2 === 1;

                if (isMirrored) {
                  ty = -ty;
                  trot = -trot;
                }

                s.targetX = tx * p.cos(angleMod) - ty * p.sin(angleMod);
                s.targetY = tx * p.sin(angleMod) + ty * p.cos(angleMod);
                s.targetRot = trot + angleMod;

                s.baseTargetX = s.targetX;
                s.baseTargetY = s.targetY;
              }

              if (!s.trail) s.trail = [];
              s.trail.push({ x: s.targetX, y: s.targetY });
              if (s.trail.length > 25) s.trail.shift();
            } else if (visualParams.shakeMode === "mandala_wave") {
              // ==========================================
              // PHYSICS TICK: MANDALA WAVE
              // Rings undulate radially + counter-rotate;
              // odd rings CW, even rings CCW for a gear effect.
              // Pure trig per shard — no allocations.
              // ==========================================
              let waveAmp = 8;         // radial undulation pixels
              let waveFreq = 0.5;      // how fast rings breathe
              let driftSpeed = 0.018;  // angular drift speed

              let ringIndex = s.ringIndex || 0;
              let ringBaseR = s.ringBaseR || 40;

              // Alternate CW / CCW per ring
              let direction = ringIndex % 2 === 0 ? 1 : -1;
              let driftAngle = direction * time * driftSpeed * (1 + ringIndex * 0.05);

              // Radial undulation, staggered per ring so they don't all pulse together
              let wave = p.sin(time * waveFreq + ringIndex * 0.7) * waveAmp;
              let r = ringBaseR + wave;

              let theta = (s.ringTheta || 0) + driftAngle;

              s.targetX = p.cos(theta) * r;
              s.targetY = p.sin(theta) * r;
              s.targetRot = theta + p.PI / 2;
            } else if (visualParams.shakeMode === "emblem") {
              // ==========================================
              // PHYSICS TICK: EMBLEM
              // Very subtle, organized breathing to keep it
              // feeling alive without breaking symmetry.
              // ==========================================
              let breathScale = 1 + p.sin(time * 0.8 + (s.emblemLayer || 0) * 0.5) * 0.04;
              s.targetX = s.baseTargetX * breathScale;
              s.targetY = s.baseTargetY * breathScale;
              s.targetRot = s.baseTargetRot;
            } else {
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

        // ==========================================
        // DRAW LOOP: GEOMETRIC WEB LINES
        // Only drawn when settled into bloom phase
        // ==========================================
        if (
          visualParams.shakeMode === "geometric_web" &&
          visualParams.webConnections &&
          currentVisualPhase === "bloom"
        ) {
          let lineCol = p.color(borderHex);
          lineCol.setAlpha(100);
          p.stroke(lineCol);
          p.strokeWeight(1.0);
          for (let c of visualParams.webConnections) {
            let p1 = shards[c.i1];
            let p2 = shards[c.i2];
            if (p1 && p2) {
              p.line(p1.x, p1.y, p2.x, p2.y);
            }
          }
          // ==========================================
          // DRAW LOOP: PERLIN (FLUID) TRAILS
          // Draws the trailing lines behind particles
          // ==========================================
        } else if (visualParams.shakeMode === "perlin") {
          for (let s of shards) {
            if (s.trail && s.trail.length > 1) {
              p.noFill();
              let c = p.color(s.color);
              c.setAlpha((s.opacity || 255) * 0.5);
              p.stroke(c);
              p.strokeWeight(s.w * 0.8);
              p.beginShape();
              for (let pt of s.trail) {
                p.vertex(pt.x, pt.y);
              }
              p.endShape();
            }
          }
        }

        for (let s of shards) {
          if (s.w > 0.5 && s.h > 0.5) {
            p.push();
            p.translate(s.x, s.y);
            p.rotate(s.rot);

            let mode = s.fillMode || "solid";

            if (mode === "solid" || mode === "image") {
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
              let grad = ctx.createLinearGradient(0, -s.h / 2, 0, s.h / 2);

              let c1 = p.color(s.color);
              c1.setAlpha(s.opacity || 255);

              let c2 = p.color(s.color);
              c2.setAlpha(0); // Fade to transparent

              grad.addColorStop(0, c1.toString());
              grad.addColorStop(1, c2.toString());

              ctx.fillStyle = grad;
            }

            if (s.type === "rect") p.rect(0, 0, s.w, s.h, s.w * 0.1);
            else if (s.type === "line") {
              let gap = s.h * 2.5;
              p.rect(0, 0, s.w, s.h, s.w * 0.1);
              p.rect(0, -gap, s.w, s.h, s.w * 0.1);
              p.rect(0, gap, s.w, s.h, s.w * 0.1);
            }
            else if (s.type === "ellipse") p.ellipse(0, 0, s.w, s.h);
            else if (s.type === "diamond") {
              p.beginShape();
              p.vertex(0, -s.h / 2);
              p.vertex(s.w / 2, 0);
              p.vertex(0, s.h / 2);
              p.vertex(-s.w / 2, 0);
              p.endShape(p.CLOSE);
            } else if (s.type === "stamp_asterisk") {
              p.push();
              for (let i = 0; i < 3; i++) {
                p.rect(0, 0, s.w, s.h * 0.15, 2);
                p.rotate(p.PI / 3);
              }
              p.pop();
            } else if (s.type === "stamp_plus") {
              p.rect(0, 0, s.w, s.h * 0.2, 2);
              p.rect(0, 0, s.w * 0.2, s.h, 2);
            } else if (s.type === "stamp_char") {
              p.textAlign(p.CENTER, p.CENTER);
              p.textSize(s.w * 0.8);
              p.text(s.char || "A", 0, 0);
            }
            p.pop();
          }
        }

        p.pop();

        // Dim background if in journal mode
        if (!saveTriggered) {
          if (currentState === "journal_input") {
            p.push();
            let c = p.color(bgHex);
            c.setAlpha(200);
            p.fill(c);
            p.rectMode(p.CORNER);
            p.rect(0, 0, p.width, p.height);
            p.pop();
          }
        }
        if (currentVisualPhase === "drawing") {
          tracker.draw();
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
      unsubStampChar();
      unsubCameraShake();
      unsubLayout();
      unsubTheme();
      unsubEntries();
      unsubActiveEntry();
      unsubSave();
      unsubUploadedImage();
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
