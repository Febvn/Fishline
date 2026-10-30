/**
 * fish_animator.js
 * Real-time skeletal deformation & animation engine for LingDong-/fishdraw
 * Supports: Idle, Swim (Gerak), Eat (Makan), Die (Mati), Revive
 */

(function (global) {
  const isNode = typeof module !== 'undefined' && module.exports;
  const fishdraw = isNode ? require('./fishdraw.js') : global;

  class FishAnimator {
    constructor(options = {}) {
      this.seed = options.seed || null;
      this.state = 'idle'; // 'idle', 'swim', 'eat', 'die'
      this.stateTimer = 0;

      // World placement & kinematics
      this.x = options.x || 400;
      this.y = options.y || 260;
      this.targetX = this.x;
      this.targetY = this.y;
      this.vx = -40; // initial drift to the left
      this.vy = 0;
      this.facing = -1; // -1 = facing left, +1 = facing right
      this.pitch = 0; // vertical pitch (positive = diving down, negative = climbing up)
      this.roll = 0; // for belly-up death (0 to PI)
      this.scale = options.scale || 0.85;

      // Animation parameters
      this.time = 0;
      this.spinePhase = 0;
      this.jawAngle = 0;
      this.targetJawAngle = 0;
      this.pecAngle = 0;
      this.bobOffset = 0;

      // State-specific timers and food targeting
      this.chewTimer = 0;
      this.targetFood = null;
      this.isDead = false;
      this.deathProgress = 0;
      this.bubbles = [];

      // Generate initial structured fish
      this.generate(this.seed);
    }

    generate(seed) {
      const fd = typeof window !== 'undefined' ? window : fishdraw;
      if (!seed) {
        this.seed = (fd.binomen ? fd.binomen() : (fishdraw.binomen ? fishdraw.binomen() : 'Piscis vagus'));
      } else {
        this.seed = seed;
      }

      if (typeof set_seed === 'function') {
        set_seed(this.seed);
      } else if (fd.set_seed) {
        fd.set_seed(this.seed);
      } else if (fishdraw.set_seed) {
        fishdraw.set_seed(this.seed);
      }

      const genParams = (fd.generate_params || fishdraw.generate_params);
      const getStructured = (fd.fish_structured || fishdraw.fish_structured);
      const params = genParams();
      // Use natural resting jaw aperture (neither gaping wide nor pursed flat/mingkem)
      params.jaw_open = 0.25;
      this.model = getStructured(params);
      this.speciesName = this.seed;

      // Compute bounding box and local origin
      const allPts = [];
      for (const key in this.model.parts) {
        const polyList = this.model.parts[key];
        for (let i = 0; i < polyList.length; i++) {
          for (let j = 0; j < polyList[i].length; j++) {
            allPts.push(polyList[i][j]);
          }
        }
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < allPts.length; i++) {
        const [px, py] = allPts[i];
        if (px < minX) minX = px;
        if (py < minY) minY = py;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
      }

      this.localBBox = {
        minX, minY, maxX, maxY,
        w: maxX - minX,
        h: maxY - minY,
        centerX: minX + (maxX - minX) * 0.42,
        centerY: minY + (maxY - minY) * 0.5
      };

      this.spineLength = (this.model.anchors.spine_x_end || maxX) - this.model.anchors.head_tip[0];
      if (this.spineLength <= 0) this.spineLength = 300;

      // Reset dynamic states
      this.state = 'idle';
      this.stateTimer = 0;
      this.isDead = false;
      this.deathProgress = 0;
      this.roll = 0;
      this.pitch = 0;
      this.targetFood = null;
      this.bubbles = [];
    }

    setState(newState) {
      if (this.state === newState) return;
      if (this.isDead && newState !== 'idle' && newState !== 'swim' && newState !== 'revive') return;

      if (newState === 'revive') {
        this.isDead = false;
        this.deathProgress = 0;
        this.roll = 0;
        this.pitch = 0;
        this.state = 'idle';
        this.stateTimer = 0;
        this.spawnBubbles(this.x, this.y, 8);
        return;
      }

      if (newState === 'die') {
        this.isDead = true;
        this.deathProgress = 0;
      }

      this.state = newState;
      this.stateTimer = 0;
      if (newState === 'eat') {
        this.chewTimer = 0;
      }
    }

    feed(foodOrX, maybeY) {
      if (this.isDead) return;
      if (typeof foodOrX === 'object' && foodOrX !== null) {
        this.targetFood = foodOrX;
      } else {
        this.targetFood = { x: foodOrX, y: maybeY, radius: 4, eaten: false };
      }
      this.setState('eat');
    }

    update(dt, bounds = { width: 900, height: 600 }) {
      this.time += dt;
      this.stateTimer += dt;

      // State machine logic
      switch (this.state) {
        case 'idle':
          this.updateIdle(dt, bounds);
          break;
        case 'swim':
          this.updateSwim(dt, bounds);
          break;
        case 'eat':
          this.updateEat(dt, bounds);
          break;
        case 'die':
          this.updateDie(dt, bounds);
          break;
      }

      // Smooth jaw opening & closing
      this.jawAngle += (this.targetJawAngle - this.jawAngle) * Math.min(1, dt * 16);

      // Update bubbles
      this.updateBubbles(dt);
    }

    setFacing(dir) {
      if (dir !== this.facing) {
        this.facing = dir;
      }
    }

    updateIdle(dt, bounds) {
      // Gentle floating buoyancy bob
      this.bobOffset = Math.sin(this.time * 1.5) * 6;

      // Spine wave: calm, small breathing amplitude
      const waveFreq = 0.8;
      const waveAmp = 7;
      this.spinePhase += dt * waveFreq * Math.PI * 2;
      this.currentWaveAmp = waveAmp;
      this.currentWaveK = 3.5;

      // Pectoral fin lazy flutter
      this.pecAngle = Math.sin(this.time * 2.2) * 0.16;

      // Natural "magap-magap" respiration: rhythmic breathing mouth motion
      // Breathes comfortably between natural resting shape and gentle respiration opening
      const breath = 0.5 + 0.5 * Math.sin(this.time * 2.8);
      this.targetJawAngle = -0.04 + breath * 0.16;

      // Slow drift & dampening
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Relax pitch to level
      this.pitch *= Math.pow(0.2, dt);

      // Random slow turn when idling too long
      if (!this.idleTurnTimer || this.stateTimer > this.idleTurnTimer) {
        this.idleTurnTimer = this.stateTimer + 4.0 + Math.random() * 4.0;
        if (Math.random() < 0.4) {
          this.setFacing(-this.facing);
          this.vx = this.facing * 18;
        }
      }

      this.clampBounds(bounds);
    }

    updateSwim(dt, bounds) {
      this.bobOffset = Math.sin(this.time * 3.0) * 3;

      // Spine wave: active propulsive traveling wave
      const waveFreq = 2.6;
      const waveAmp = 26;
      this.spinePhase += dt * waveFreq * Math.PI * 2;
      this.currentWaveAmp = waveAmp;
      this.currentWaveK = 5.8;

      // Pectoral fin active paddling
      this.pecAngle = Math.sin(this.time * 5.5) * 0.38;

      // Streamlined natural mouth posture while swimming
      this.targetJawAngle = -0.02 + Math.max(0, Math.sin(this.time * 4.0)) * 0.05;

      // Swim wandering / target picking
      if (!this.wanderTimer || this.stateTimer > this.wanderTimer) {
        this.wanderTimer = this.stateTimer + 2.5 + Math.random() * 2.5;
        const margin = 140;
        this.targetX = margin + Math.random() * (bounds.width - margin * 2);
        this.targetY = margin + Math.random() * (bounds.height - margin * 2);
      }

      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 40) {
        if (dx > 25) this.setFacing(1);
        else if (dx < -25) this.setFacing(-1);

        const speed = 120;
        const targetVx = (dx / dist) * speed;
        const targetVy = (dy / dist) * speed;
        this.vx += (targetVx - this.vx) * Math.min(1, dt * 3.5);
        this.vy += (targetVy - this.vy) * Math.min(1, dt * 3.5);

        // Smooth pitch alignment with swim direction
        const targetPitch = Math.atan2(this.vy, Math.max(15, Math.abs(this.vx))) * 0.7;
        this.pitch += (targetPitch - this.pitch) * Math.min(1, dt * 4.5);
      } else {
        this.vx *= 0.92;
        this.vy *= 0.92;
        this.pitch *= Math.pow(0.2, dt);
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.clampBounds(bounds);
    }

    updateEat(dt, bounds) {
      if (!this.targetFood || this.targetFood.eaten) {
        // Return smoothly to idle once food is eaten or gone
        if (!this.targetFood) {
          this.setState('idle');
          return;
        }
      }

      const food = this.targetFood;
      const mouth = this.getMouthWorldPosition();
      const dx = food.x - mouth.x;
      const dy = food.y - mouth.y;
      const dist = Math.hypot(dx, dy);

      if (!food.eaten) {
        // 1. Set horizontal facing towards the food
        if (dx > 25) this.setFacing(1);
        else if (dx < -25) this.setFacing(-1);

        // 2. Pitch angle straight towards the food pellet
        const targetPitch = Math.atan2(dy, Math.max(15, Math.abs(dx)));
        const maxPitch = 1.35; // ~77 degrees
        const clampedPitch = Math.max(-maxPitch, Math.min(maxPitch, targetPitch));
        this.pitch += (clampedPitch - this.pitch) * Math.min(1, dt * 10.0);

        // 3. Fast swimming wave towards target
        this.spinePhase += dt * 4.2 * Math.PI * 2;
        this.currentWaveAmp = 26;
        this.currentWaveK = 6.0;
        this.pecAngle = Math.sin(this.time * 7.0) * 0.4;

        // 4. Progressively open lower lip as mouth closes in on the food pellet
        if (dist < 130) {
          const openProgress = Math.max(0, 1 - dist / 130);
          this.targetJawAngle = openProgress * 0.35; // opens lower lip smoothly
        } else {
          this.targetJawAngle = 0.0;
        }

        // 5. Steer the MOUTH directly to the food pellet with sub-pixel precision
        const speed = 230;
        const step = Math.min(dist, speed * dt);
        if (dist > 0.001) {
          this.x += (dx / dist) * step;
          this.y += (dy / dist) * step;
        }

        // 6. Chomp condition: lower lip clamps shut neatly on contact
        if (dist <= 22) {
          food.eaten = true;
          this.jawAngle = -0.10; // Clamps lower lip firmly against upper lip!
          this.targetJawAngle = -0.10;
          this.chewTimer = 0;
          this.spawnBubbles(mouth.x, mouth.y, 7);
        }
      } else {
        // Chewing phase
        this.chewTimer += dt;
        this.vx *= 0.88;
        this.vy *= 0.88;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Level off pitch
        this.pitch *= Math.pow(0.15, dt);

        // Spine settles down
        this.spinePhase += dt * 1.2 * Math.PI * 2;
        this.currentWaveAmp = 8;
        this.currentWaveK = 3.5;

        // Hold bite firmly shut for 0.35s so the chomp is clearly visible!
        if (this.chewTimer < 0.35) {
          this.jawAngle = -0.10;
          this.targetJawAngle = -0.10;
        } else {
          // Subtle chewing pulses that clamp back on each bite
          const tChew = this.chewTimer - 0.35;
          const chew = Math.sin(tChew * 13);
          this.targetJawAngle = chew > 0 ? (chew * 0.07 * Math.exp(-tChew * 2.0) - 0.05) : -0.10;
        }

        if (this.chewTimer > 1.6) {
          this.jawAngle = 0.0;
          this.targetJawAngle = 0.0;
          this.targetFood = null;
          this.setState('idle');
        }
      }

      this.clampBounds(bounds);
    }

    updateDie(dt, bounds) {
      this.deathProgress = Math.min(1, this.deathProgress + dt * 0.4);

      if (this.deathProgress < 0.25) {
        // Phase 1: Tremor / seizure spasms
        const tremor = (1 - this.deathProgress / 0.25);
        this.currentWaveAmp = Math.sin(this.time * 25) * 8 * tremor;
        this.spinePhase += dt * 18 * Math.PI * 2;
        this.currentWaveK = 5.0;
        this.targetJawAngle = 0.22; // Mouth gapes open lifelessly
        this.pecAngle = Math.sin(this.time * 20) * 0.15 * tremor;
        this.vx *= 0.8;
        this.vy *= 0.8;
      } else {
        // Phase 2: Loss of equilibrium, roll belly-up (180 deg)
        this.currentWaveAmp = 0; // Stiff/limp body
        this.pecAngle = 0.1; // Limp fin
        this.targetJawAngle = 0.18; // Remains open slightly
        this.pitch *= 0.9;
        this.vx *= 0.9;

        // Roll over smoothly to 180 degrees
        const rollT = (this.deathProgress - 0.25) / 0.75;
        this.roll = Math.PI * Math.min(1, rollT * 1.2);

        // Buoyancy drift: floats toward water surface
        const surfaceY = 95;
        if (this.y > surfaceY) {
          this.vy = -36 * (1 - Math.exp(-rollT * 3));
        } else {
          this.vy = 0;
          this.bobOffset = Math.sin(this.time * 1.0) * 3;
        }
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.clampBounds(bounds);
    }

    clampBounds(bounds) {
      const pad = 65;
      if (this.x < pad) { this.x = pad; this.vx = Math.abs(this.vx); this.setFacing(1); }
      if (this.x > bounds.width - pad) { this.x = bounds.width - pad; this.vx = -Math.abs(this.vx); this.setFacing(-1); }
      if (this.y < pad) { this.y = pad; this.vy = Math.abs(this.vy); }
      if (this.y > bounds.height - pad) { this.y = bounds.height - pad; this.vy = -Math.abs(this.vy); }
    }

    /**
     * Get world position of the tip of the mouth
     */
    getMouthWorldPosition() {
      const tip = this.model.anchors.head_tip;
      // Slight vertical mouth aperture adjustment when jaw is open
      const mouthY = tip[1] + (this.jawAngle || 0) * 10;
      return this.localToWorld(tip[0], mouthY);
    }

    spawnBubbles(x, y, count = 5) {
      for (let i = 0; i < count; i++) {
        this.bubbles.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 22,
          vy: -28 - Math.random() * 30,
          r: 2 + Math.random() * 3.5,
          life: 0,
          maxLife: 1.2 + Math.random() * 0.8
        });
      }
    }

    updateBubbles(dt) {
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        b.life += dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.life >= b.maxLife) {
          this.bubbles.splice(i, 1);
        }
      }
    }

    /**
     * Skeletally deform a local point (px, py)
     */
    deformPoint(px, py, partName) {
      const anchors = this.model.anchors;
      const headTipX = anchors.head_tip[0];

      // Normalized spine coordinate [0, 1]
      let u = (px - headTipX) / this.spineLength;
      if (u < 0) u = 0;
      if (u > 1.2) u = 1.2;

      let lx = px;
      let ly = py;

      // 1. Jaw rotation around jaw hinge
      if (partName === 'jaw' && this.jawAngle !== 0) {
        const [jx, jy] = anchors.jaw_hinge;
        const dx = lx - jx;
        const dy = ly - jy;
        // Jaw rotates downward
        const th = this.jawAngle;
        lx = jx + dx * Math.cos(th) + dy * Math.sin(th);
        ly = jy - dx * Math.sin(th) + dy * Math.cos(th);
      }

      // 2. Pectoral fin flap around pectoral root
      if (partName === 'pectoral' && this.pecAngle !== 0) {
        const [pxr, pyr] = anchors.pectoral_root;
        const dx = lx - pxr;
        const dy = ly - pyr;
        const th = this.pecAngle;
        lx = pxr + dx * Math.cos(th) - dy * Math.sin(th);
        ly = pyr + dx * Math.sin(th) + dy * Math.cos(th);
      }

      // 3. Spine wave deformation
      if (this.currentWaveAmp && this.currentWaveAmp > 0.01) {
        // Head stays rigid (u < 0.22)
        if (u > 0.22) {
          const w = Math.min(1.2, (u - 0.22) / 0.78);
          const amp = this.currentWaveAmp * Math.pow(w, 1.55);
          const dyWave = Math.sin(this.spinePhase - this.currentWaveK * u) * amp;
          ly += dyWave;

          // Subtle X foreshortening
          const dxWave = -0.5 * (dyWave * dyWave) / this.spineLength;
          lx += dxWave;
        }
      }

      return [lx, ly];
    }

    /**
     * Map deformed local coordinate to world canvas coordinate
     */
    localToWorld(lx, ly) {
      const cx = this.localBBox.centerX;
      const cy = this.localBBox.centerY;

      // In fishdraw native coordinates:
      // lx < cx is towards the mouth/snout (forward)
      // lx > cx is towards the tail (backward)
      // ly < cy is towards dorsal fin (up)
      // ly > cy is towards belly (down)
      const Xfwd = (cx - lx) * this.scale;
      let Ydown = (ly - cy) * this.scale;

      // Apply belly-up roll when dead (flips Ydown upside down)
      if (this.roll !== 0) {
        Ydown *= Math.cos(this.roll);
      }

      // Pitch rotation:
      // pitch > 0 means diving down, pitch < 0 means climbing up
      const cosP = Math.cos(this.pitch);
      const sinP = Math.sin(this.pitch);

      // Facing: -1 = facing Left, +1 = facing Right
      const rotX = this.facing * (Xfwd * cosP - Ydown * sinP);
      const rotY = Xfwd * sinP + Ydown * cosP;

      const wx = this.x + rotX;
      const wy = this.y + this.bobOffset + rotY;

      return { x: wx, y: wy };
    }

    /**
     * Render the fish to an HTML5 Canvas 2D context
     */
    render(ctx, options = {}) {
      const strokeColor = options.strokeColor || '#181818';
      const lineWidth = options.lineWidth || 1.15;

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const paperBg = options.paperColor || '#fbf9f4';

      const parts = this.model.parts;

      // 1. Draw all underlying body parts (scales, motifs, other fins, head, jaw)
      // Skip 'pectoral' here so the side fin can be layered on top with its dynamic mask
      for (const partName in parts) {
        if (partName === 'pectoral') continue;
        if (this.isDead && partName === 'eye') continue;

        const polyList = parts[partName];
        ctx.beginPath();
        for (let i = 0; i < polyList.length; i++) {
          const poly = polyList[i];
          if (poly.length < 2) continue;

          for (let j = 0; j < poly.length; j++) {
            const [lx, ly] = this.deformPoint(poly[j][0], poly[j][1], partName);
            const w = this.localToWorld(lx, ly);
            if (j === 0) {
              ctx.moveTo(w.x, w.y);
            } else {
              ctx.lineTo(w.x, w.y);
            }
          }
        }
        ctx.stroke();
      }

      // 2. Draw Pectoral Fin (sirip samping/dada) on top
      // First: fill its deformed contour with paper wash to cleanly mask only where the fin is right now
      const contour = this.model.anchors.pectoral_contour;
      if (contour && contour.length > 2) {
        ctx.save();
        ctx.fillStyle = paperBg;
        ctx.beginPath();
        for (let j = 0; j < contour.length; j++) {
          const [lx, ly] = this.deformPoint(contour[j][0], contour[j][1], 'pectoral');
          const w = this.localToWorld(lx, ly);
          if (j === 0) ctx.moveTo(w.x, w.y);
          else ctx.lineTo(w.x, w.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Second: stroke the pectoral fin rays and outline
      if (parts.pectoral) {
        ctx.beginPath();
        for (let i = 0; i < parts.pectoral.length; i++) {
          const poly = parts.pectoral[i];
          if (poly.length < 2) continue;

          for (let j = 0; j < poly.length; j++) {
            const [lx, ly] = this.deformPoint(poly[j][0], poly[j][1], 'pectoral');
            const w = this.localToWorld(lx, ly);
            if (j === 0) {
              ctx.moveTo(w.x, w.y);
            } else {
              ctx.lineTo(w.x, w.y);
            }
          }
        }
        ctx.stroke();
      }

      // 3. If dead, draw crossed "X" eyes
      if (this.isDead) {
        this.renderDeadEye(ctx);
      }

      // 4. Render chew & respiration bubbles
      this.renderBubbles(ctx);

      ctx.restore();
    }

    renderDeadEye(ctx) {
      const [ex, ey] = this.model.anchors.eye_center;
      const [lx, ly] = this.deformPoint(ex, ey, 'eye');
      const w = this.localToWorld(lx, ly);
      const r = (this.model.anchors.eye_size || 6) * this.scale * 0.9;

      ctx.save();
      ctx.strokeStyle = '#ba3222'; // Vermilion red X for dead eye
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w.x - r, w.y - r);
      ctx.lineTo(w.x + r, w.y + r);
      ctx.moveTo(w.x - r, w.y + r);
      ctx.lineTo(w.x + r, w.y - r);
      ctx.stroke();
      ctx.restore();
    }

    renderBubbles(ctx) {
      if (!this.bubbles || this.bubbles.length === 0) return;
      ctx.save();
      ctx.strokeStyle = '#6d8999';
      ctx.lineWidth = 1.0;
      for (let i = 0; i < this.bubbles.length; i++) {
        const b = this.bubbles[i];
        const alpha = Math.max(0, 1 - b.life / b.maxLife);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Export
  if (isNode) {
    module.exports = { FishAnimator };
  } else {
    global.FishAnimator = FishAnimator;
  }
})(typeof window !== 'undefined' ? window : globalThis);
