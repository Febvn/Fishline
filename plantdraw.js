/**
 * plantdraw.js - Procedural Mathematical Aquatic Flora & Seaweed Engine
 * Generates sumi-e ink style aquatic plants, ribbon seagrass, and kelp fronds
 * using purely mathematical geometry, harmonic wave physics, and botanical growth rules.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.plantdraw = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // -----------------------------------------------------------------
  // 1. Deterministic Pseudo-Random Number Generator (PRNG) & Perlin
  // -----------------------------------------------------------------
  let jsr = 0x7EED;
  const PI = Math.PI;

  function rand() {
    jsr ^= (jsr << 17);
    jsr ^= (jsr >> 13);
    jsr ^= (jsr << 5);
    return (jsr >>> 0) / 4294967295;
  }

  function set_seed(seed) {
    if (typeof seed === 'number') {
      jsr = (seed >>> 0) || 0x7EED;
      return;
    }
    let h = 0x811c9dc5;
    const str = String(seed);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    jsr = (h >>> 0) || 0x7EED;
  }

  function rnd(min, max) {
    if (min === undefined) return rand();
    if (max === undefined) return rand() * min;
    return min + rand() * (max - min);
  }

  function rndtri(min, peak, max) {
    const u = rand();
    const c = (peak - min) / (max - min);
    if (u < c) {
      return min + Math.sqrt(u * (max - min) * (peak - min));
    }
    return max - Math.sqrt((1 - u) * (max - min) * (max - peak));
  }

  function choice(arr) {
    return arr[Math.floor(rand() * arr.length)];
  }

  // 1D/2D Perlin Noise for Organic Plant Texture
  const PERLIN_SIZE = 4095;
  let perlin = null;

  function init_perlin() {
    perlin = new Float32Array(PERLIN_SIZE + 1);
    for (let i = 0; i <= PERLIN_SIZE; i++) {
      perlin[i] = rand();
    }
  }

  function noise1d(x) {
    if (!perlin) init_perlin();
    if (x < 0) x = -x;
    const xi = Math.floor(x);
    const xf = x - xi;
    const s = 0.5 * (1.0 - Math.cos(xf * PI));
    const n0 = perlin[xi & PERLIN_SIZE];
    const n1 = perlin[(xi + 1) & PERLIN_SIZE];
    return n0 + s * (n1 - n0);
  }

  function noise2d(x, y) {
    if (!perlin) init_perlin();
    if (x < 0) x = -x;
    if (y < 0) y = -y;
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const sx = 0.5 * (1.0 - Math.cos(xf * PI));
    const sy = 0.5 * (1.0 - Math.cos(yf * PI));

    const i0 = (xi + (yi << 4)) & PERLIN_SIZE;
    const i1 = (xi + 1 + (yi << 4)) & PERLIN_SIZE;
    const i2 = (xi + ((yi + 1) << 4)) & PERLIN_SIZE;
    const i3 = (xi + 1 + ((yi + 1) << 4)) & PERLIN_SIZE;

    const n0 = perlin[i0] + sx * (perlin[i1] - perlin[i0]);
    const n1 = perlin[i2] + sx * (perlin[i3] - perlin[i2]);
    return n0 + sy * (n1 - n0);
  }

  // -----------------------------------------------------------------
  // 2. Vector & Spline Mathematical Utilities
  // -----------------------------------------------------------------
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function dist(x0, y0, x1, y1) {
    return Math.hypot(x1 - x0, y1 - y0);
  }

  // Cubic Bézier calculation
  function cubic_bezier(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    const a = mt2 * mt;
    const b = 3 * mt2 * t;
    const c = 3 * mt * t2;
    const d = t2 * t;
    return [
      a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]
    ];
  }

  // Botanical Binomial Taxonomy Generator
  const GENERA = [
    'Zostera', 'Vallisneria', 'Laminaria', 'Cryptocoryne', 'Cabomba',
    'Ceratophyllum', 'Sagittaria', 'Myriophyllum', 'Egeria', 'Caulerpa'
  ];
  const EPITHETS = [
    'sumiensis', 'fluctuosa', 'undulata', 'spiralis', 'marina',
    'japonica', 'gracilis', 'foliosa', 'capillata', 'pinnata',
    'aquatica', 'orientalis', 'elegans', 'demersa', 'lucens'
  ];

  function botanical_binomen() {
    return choice(GENERA) + ' ' + choice(EPITHETS);
  }

  // -----------------------------------------------------------------
  // 3. Mathematical Blade / Frond Model
  // -----------------------------------------------------------------
  class PlantBlade {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.length = config.length || rndtri(180, 290, 420);
      this.baseWidth = config.baseWidth || rndtri(8, 16, 24);
      this.tipWidth = config.tipWidth || rndtri(1.2, 2.0, 3.5);
      this.segments = config.segments || 22;
      this.type = config.type || 0; // 0: Ribbon, 1: Feather Kelp, 2: Broad Lanceolate
      this.phase = rnd(0, PI * 2);
      this.waveFreq = rndtri(0.008, 0.014, 0.022);
      this.waveSpeed = rndtri(1.2, 1.8, 2.5);
      this.naturalSway = rndtri(20, 45, 75);
      this.curl = rndtri(-0.35, 0.0, 0.35);

      // Node structure for hydrodynamic physics
      this.nodes = [];
      const ds = this.length / (this.segments - 1);
      for (let i = 0; i < this.segments; i++) {
        this.nodes.push({
          relX: 0,
          relY: -i * ds,
          velX: 0,
          forceX: 0,
          width: lerp(this.baseWidth, this.tipWidth, Math.pow(i / (this.segments - 1), 0.8))
        });
      }

      // Feature veins
      this.veinOffsets = [-0.5, -0.2, 0.2, 0.5];
      if (this.type === 1) {
        // Pinnate leaflets along stem
        this.leaflets = [];
        const numLeaflets = Math.floor(rnd(6, 14));
        for (let j = 0; j < numLeaflets; j++) {
          const t = lerp(0.2, 0.92, j / (numLeaflets - 1));
          this.leaflets.push({
            t: t,
            side: (j % 2 === 0 ? 1 : -1),
            len: rndtri(22, 40, 58) * (1 - Math.abs(t - 0.55)),
            angle: rndtri(0.35, 0.65, 0.95),
            phase: rnd(0, PI * 2)
          });
        }
      }
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      const N = this.nodes.length;
      const baseCurvature = this.curl * this.length;

      for (let i = 0; i < N; i++) {
        const node = this.nodes[i];
        const fraction = i / (N - 1);
        const fracPow = Math.pow(fraction, 1.6);

        // 1. Harmonic Ambient Ocean Current
        // Mathematical harmonic waves: fundamental + 2nd overtone + micro-flutter
        const harmonic1 = Math.sin(time * this.waveSpeed + this.phase + i * 0.18) * this.naturalSway;
        const harmonic2 = Math.sin(time * (this.waveSpeed * 1.8) + this.phase * 1.5 + i * 0.35) * (this.naturalSway * 0.35);
        const flutter = noise1d(time * 2.0 + i * 0.4) * 6.0;

        const targetX = (harmonic1 + harmonic2 + flutter + baseCurvature * fraction + currentFlow * 35.0) * fracPow;

        // 2. Fish Proximity Hydrodynamic Push
        // Plants smoothly part away when fish body/snout swims near
        const worldX = rootX + this.offsetX + node.relX;
        const worldY = rootY + node.relY;

        let pushX = 0;
        if (fishX !== undefined && fishY !== undefined) {
          const dFish = dist(worldX, worldY, fishX, fishY);
          const fishRadius = 150;
          if (dFish < fishRadius) {
            const pushFactor = Math.pow(1.0 - dFish / fishRadius, 1.5);
            const dx = worldX - fishX;
            // Push outwards away from fish center
            pushX = (dx >= 0 ? 1 : -1) * pushFactor * 65.0 * fraction;
          }
        }

        // 3. Water Surface Ripple Perturbation
        if (ripples && ripples.length) {
          for (let r = 0; r < ripples.length; r++) {
            const rip = ripples[r];
            const dRip = dist(worldX, worldY, rip.x, rip.y);
            const waveFront = Math.abs(dRip - rip.r);
            if (waveFront < 40 && rip.r > 20) {
              const impulse = Math.sin((dRip - rip.r) * 0.15) * rip.alpha * 18.0 * fraction;
              pushX += impulse;
            }
          }
        }

        // 4. Spring-Damper Relaxation Equation
        // m*x'' + c*x' + k*(x - x_target) = 0
        const totalTarget = targetX + pushX;
        const springK = 18.0;
        const damping = 6.5;

        const force = springK * (totalTarget - node.relX);
        node.velX += (force - damping * node.velX) * dt;
        node.relX += node.velX * dt;
      }
    }

    render(ctx, rootX, rootY, options) {
      const { strokeColor, paperColor, lineWidthMult } = options;
      const N = this.nodes.length;
      if (N < 2) return;

      const baseWorldX = rootX + this.offsetX;
      const baseWorldY = rootY;

      // Compute left and right boundary curves based on normal vectors
      const leftEdge = [];
      const rightEdge = [];
      const centerLine = [];

      for (let i = 0; i < N; i++) {
        const node = this.nodes[i];
        const cx = baseWorldX + node.relX;
        const cy = baseWorldY + node.relY;
        centerLine.push([cx, cy]);

        // Compute tangent vector from neighbors
        let tx = 0;
        let ty = -1;
        if (i === 0) {
          tx = this.nodes[1].relX - node.relX;
          ty = this.nodes[1].relY - node.relY;
        } else if (i === N - 1) {
          tx = node.relX - this.nodes[i - 1].relX;
          ty = node.relY - this.nodes[i - 1].relY;
        } else {
          tx = this.nodes[i + 1].relX - this.nodes[i - 1].relX;
          ty = this.nodes[i + 1].relY - this.nodes[i - 1].relY;
        }

        const tLen = Math.hypot(tx, ty) || 1;
        // Normal vector perpendicular to tangent: (-ty, tx)
        const nx = -ty / tLen;
        const ny = tx / tLen;

        const halfW = node.width * 0.5;
        leftEdge.push([cx - nx * halfW, cy - ny * halfW]);
        rightEdge.push([cx + nx * halfW, cy + ny * halfW]);
      }

      ctx.save();

      // 1. Translucent Sumi-e Algae Wash (Paper Underfill)
      ctx.beginPath();
      ctx.moveTo(leftEdge[0][0], leftEdge[0][1]);
      for (let i = 1; i < N; i++) {
        ctx.lineTo(leftEdge[i][0], leftEdge[i][1]);
      }
      ctx.lineTo(centerLine[N - 1][0], centerLine[N - 1][1]);
      for (let i = N - 1; i >= 0; i--) {
        ctx.lineTo(rightEdge[i][0], rightEdge[i][1]);
      }
      ctx.closePath();

      // Watercolor translucent wash
      ctx.fillStyle = options.washColor || 'rgba(38, 54, 46, 0.08)';
      ctx.fill();

      // 2. Main Outer Contour Strokes (Variable Width Ink Lines)
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = (options.lineWidth || 1.1) * (lineWidthMult || 1.0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw left boundary
      ctx.beginPath();
      ctx.moveTo(leftEdge[0][0], leftEdge[0][1]);
      for (let i = 1; i < N; i++) {
        ctx.lineTo(leftEdge[i][0], leftEdge[i][1]);
      }
      ctx.stroke();

      // Draw right boundary
      ctx.beginPath();
      ctx.moveTo(rightEdge[0][0], rightEdge[0][1]);
      for (let i = 1; i < N; i++) {
        ctx.lineTo(rightEdge[i][0], rightEdge[i][1]);
      }
      ctx.stroke();

      // 3. Central & Lateral Longitudinal Veins (Internal Linework)
      ctx.save();
      ctx.lineWidth = Math.max(0.6, (options.lineWidth || 1.0) * 0.55);
      ctx.globalAlpha = 0.55;

      // Center midrib
      ctx.beginPath();
      ctx.moveTo(centerLine[0][0], centerLine[0][1]);
      for (let i = 1; i < N; i++) {
        ctx.lineTo(centerLine[i][0], centerLine[i][1]);
      }
      ctx.stroke();

      // Secondary fine veins for Ribbon blades
      if (this.type === 0) {
        for (const vOff of this.veinOffsets) {
          ctx.beginPath();
          for (let i = 0; i < N - 2; i++) {
            const lx = leftEdge[i][0];
            const rx = rightEdge[i][0];
            const ly = leftEdge[i][1];
            const ry = rightEdge[i][1];
            const tParam = (vOff + 1.0) * 0.5;
            const vx = lerp(lx, rx, tParam);
            const vy = lerp(ly, ry, tParam);
            if (i === 0) ctx.moveTo(vx, vy);
            else ctx.lineTo(vx, vy);
          }
          ctx.stroke();
        }
      }

      ctx.restore();

      // 4. Feather Kelp Pinnule Leaflets (Type 1)
      if (this.type === 1 && this.leaflets) {
        ctx.save();
        ctx.lineWidth = Math.max(0.7, (options.lineWidth || 1.0) * 0.75);
        for (const leaf of this.leaflets) {
          const idx = Math.min(N - 2, Math.floor(leaf.t * (N - 1)));
          const frac = (leaf.t * (N - 1)) - idx;
          const rootStemX = lerp(centerLine[idx][0], centerLine[idx + 1][0], frac);
          const rootStemY = lerp(centerLine[idx][1], centerLine[idx + 1][1], frac);

          // Leaf curving upward and outwards
          const side = leaf.side;
          const lLen = leaf.len;
          const tipX = rootStemX + side * (lLen * 0.85);
          const tipY = rootStemY - lLen * 0.55;
          const cpX = rootStemX + side * (lLen * 0.5);
          const cpY = rootStemY + 5;

          // Leaf outline
          ctx.beginPath();
          ctx.moveTo(rootStemX, rootStemY);
          ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
          ctx.stroke();

          // Leaf vein
          ctx.beginPath();
          ctx.moveTo(rootStemX, rootStemY);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 4. Botanical Plant Cluster (Kuil Rumpun Tanaman Air)
  // -----------------------------------------------------------------
  class PlantCluster {
    constructor(x, y, seed, options = {}) {
      this.x = x;
      this.y = y;
      this.seed = seed || botanical_binomen();
      set_seed(this.seed);

      this.speciesName = this.seed;
      this.type = options.type !== undefined ? options.type : choice([0, 0, 1]); // Predominantly ribbon & kelp
      this.scale = options.scale || rndtri(0.75, 1.0, 1.25);
      this.bladeCount = options.bladeCount || Math.floor(rndtri(5, 8, 12));

      this.blades = [];
      const spanW = rndtri(20, 45, 70);
      for (let i = 0; i < this.bladeCount; i++) {
        const offX = rndtri(-spanW * 0.5, 0, spanW * 0.5);
        const heightScale = this.scale * (1.0 - Math.abs(offX) / (spanW * 0.6) * 0.35);
        this.blades.push(new PlantBlade(this, {
          offsetX: offX,
          length: rndtri(190, 320, 460) * heightScale,
          baseWidth: rndtri(10, 18, 24) * heightScale,
          type: this.type,
          segments: Math.floor(rnd(18, 26))
        }));
      }

      // Root rock / anchor stone
      this.rockRadiusX = rndtri(14, 25, 38) * this.scale;
      this.rockRadiusY = rndtri(8, 14, 20) * this.scale;
    }

    update(dt, time, fishX, fishY, ripples, ambientCurrent = 0) {
      for (let i = 0; i < this.blades.length; i++) {
        this.blades[i].update(dt, time, this.x, this.y, ambientCurrent, fishX, fishY, ripples);
      }
    }

    render(ctx, options = {}) {
      ctx.save();

      // Draw anchor pebble / root washi stone
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.rockRadiusX, this.rockRadiusY, 0, 0, PI * 2);
      ctx.fillStyle = options.stoneWash || 'rgba(30, 26, 36, 0.08)';
      ctx.fill();
      ctx.strokeStyle = options.strokeColor || '#18141f';
      ctx.lineWidth = (options.lineWidth || 1.1) * 0.9;
      ctx.stroke();

      // Render individual foliage blades
      for (let i = 0; i < this.blades.length; i++) {
        this.blades[i].render(ctx, this.x, this.y, options);
      }

      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 5. High-Level Aquarium Flora Colony Manager (Ecosystem)
  // -----------------------------------------------------------------
  class PlantColony {
    constructor(options = {}) {
      this.clusters = [];
      this.time = 0;
      this.ambientCurrent = 0;
      this.seed = options.seed || 'Sumi-e Flora Pond';
      this.init(options.width || 1200, options.height || 800, options.count || 6);
    }

    init(width, height, count = 6) {
      set_seed(this.seed);
      this.clusters = [];
      this.width = width;
      this.height = height;

      // Spatially distribute plant clusters across the bottom of the pond
      const margin = 70;
      const step = (width - margin * 2) / (count - 1);

      for (let i = 0; i < count; i++) {
        const baseX = margin + i * step + rndtri(-25, 0, 25);
        const baseY = height + rndtri(-12, 4, 18);
        const clusterSeed = `${this.seed}_cluster_${i}`;
        const cluster = new PlantCluster(baseX, baseY, clusterSeed, {
          scale: rndtri(0.7, 0.95, 1.25),
          type: choice([0, 0, 1]), // 0: Ribbon grass, 1: Feather Kelp
          bladeCount: Math.floor(rndtri(5, 7, 10))
        });
        this.clusters.push(cluster);
      }
    }

    resize(width, height) {
      this.init(width, height, this.clusters.length || 6);
    }

    update(dt, fishX, fishY, ripples) {
      this.time += dt;
      // Gentle long-period ambient tidal sway (sinusoidal water current)
      this.ambientCurrent = Math.sin(this.time * 0.45) * 0.65 + Math.cos(this.time * 0.2) * 0.35;

      for (let i = 0; i < this.clusters.length; i++) {
        this.clusters[i].update(dt, this.time, fishX, fishY, ripples, this.ambientCurrent);
      }
    }

    render(ctx, options = {}) {
      for (let i = 0; i < this.clusters.length; i++) {
        this.clusters[i].render(ctx, options);
      }
    }
  }

  // Public Module API
  return {
    set_seed,
    botanical_binomen,
    PlantBlade,
    PlantCluster,
    PlantColony,
    createColony: function (options) {
      return new PlantColony(options);
    }
  };
});
