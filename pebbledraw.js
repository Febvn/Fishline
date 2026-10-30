/**
 * pebbledraw.js - Procedural Lakebed Pebble & Stone Engine
 *
 * Mathematically generates procedural river pebbles, stones, boulders,
 * and lakebed shingle clusters using Fourier harmonic boundary perturbation,
 * multiple morphological profile deformations (egg/teardrop, wedge,
 * superellipse slab, kidney bean, flat-bottom, chipped spall),
 * chiaroscuro concentric topographical elevation contours, branching fissure splines,
 * and sumi-e monochrome ink washes.
 *
 * 100% STRICTLY MONOCHROME: Pure black, pure white, and neutral grays only.
 * Zero non-grayscale hues or pigments.
 *
 * UMD wrapper: CommonJS + Browser window.pebbledraw
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.pebbledraw = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // -----------------------------------------------------------------
  // 1. Deterministic PRNG & Numerical Utilities
  // -----------------------------------------------------------------
  let jsr = 0x5EED;
  const PI = Math.PI;
  const TWO_PI = PI * 2;

  function rand() {
    jsr ^= (jsr << 17);
    jsr ^= (jsr >>> 13);
    jsr ^= (jsr << 5);
    return (jsr >>> 0) / 4294967296;
  }

  function set_seed(seed) {
    if (typeof seed === 'number') {
      jsr = (seed >>> 0) || 0x5EED;
      return;
    }
    let h = 0x811c9dc5;
    const str = String(seed);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    jsr = (h >>> 0) || 0x5EED;
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

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // -----------------------------------------------------------------
  // 2. Geological Archetypes & Morphological Profiles
  // -----------------------------------------------------------------
  const ARCHETYPES = {
    SMOOTH: 0,     // Batu Kali Mulus (Water-worn oval pebble)
    CRAGGY: 1,     // Batu Granit Tebing (Angular chiseled boulder)
    STRATIFIED: 2, // Batu Lempeng Sedimen (Layered shale & slate)
    MOSSY: 3,      // Batu Berlumut Air (Sumi-e ink stipple moss stone)
    KARST: 4,      // Batu Karang Berpori (Porous Taihu scholar karst)
    CLUSTER: 5     // Rumpun Kerikil Kali (Composite multi-pebble shingle)
  };

  const MORPHS = {
    OVAL: 0,         // Simetris oval sungai klasik (Classical water-worn oval)
    TEARDROP: 1,     // Telur / tetesan air asimetris (Teardrop & egg skew)
    TRIANGULAR: 2,   // Baji segitiga sungai (Triangular fluvial wedge)
    SUPERELLIPSE: 3, // Balok tumpul / slab pipih bersegi (Superellipse blocky cobble)
    KIDNEY_BEAN: 4,  // Bentuk kacang / ginjal melengkung (Kidney bean arch)
    FLAT_BOTTOM: 5,  // Dasar datar bidang duduk sungai (Flat-bottom resting plane)
    CHIPPED_SPALL: 6 // Cekungan serpihan benturan kali (Fluvial impact spall scar)
  };

  const PEBBLE_CATALOG = [
    // --- 1. Smooth River Pebbles (Batu Kali Mulus) ---
    { id: 'kamo_river', common: 'Batu Kali Kamo', binomen: 'Saxum fluvii kamonis', archetype: 0, rx: 65, ry: 42, roughness: 0.12, morph: 0, desc: 'Batu kali halus terpoles aliran arus deras sungai Kyoto dengan kontur lonjong anggun dan goresan tinta sumi-e.' },
    { id: 'magnesite', common: 'Kerikil Pualam Putih', binomen: 'Saxum magnesita levis', archetype: 0, rx: 48, ry: 34, roughness: 0.10, morph: 0, desc: 'Kerikil pualam monokrom bersih dengan kilau basah air dan cincin elevasi halus.' },
    { id: 'lake_jadeite', common: 'Batu Kuarsa Danau', binomen: 'Nephritum lacustre', archetype: 0, rx: 56, ry: 38, roughness: 0.14, morph: 1, desc: 'Batu sungai sejuk dengan pantulan cahaya putih alami dan kontur asimetris tetesan air.' },
    { id: 'egg_pebble', common: 'Batu Telur Angsa', binomen: 'Saxum oviforme', archetype: 0, rx: 72, ry: 48, roughness: 0.08, morph: 1, desc: 'Batu kerikil lonjong telur alami yang tertidur tenang di dasar kolam substrat pasir.' },

    // --- 2. Craggy Boulders (Batu Granit & Vulkanik Tebing) ---
    { id: 'granite_crag', common: 'Batu Granit Terbelah', binomen: 'Granitum fissuratum', archetype: 1, rx: 85, ry: 62, roughness: 0.38, morph: 2, desc: 'Batu granit bersudut tajam dengan retakan rekahan tegas khas cukil kayu sumi-e monokrom.' },
    { id: 'basalt_block', common: 'Bongkahan Basalt Hitam', binomen: 'Basaltes angularis', archetype: 1, rx: 78, ry: 55, roughness: 0.35, morph: 3, desc: 'Batuan vulkanik kelam pekat bersisi patah dengan goresan arsir kapak tajam.' },
    { id: 'obsidian_flint', common: 'Serpihan Obsidian Air', binomen: 'Obsidianus aquatilis', archetype: 1, rx: 60, ry: 44, roughness: 0.42, morph: 6, desc: 'Pecahan batuan kaca vulkanik dengan cekungan serpihan benturan dan sudut runcing.' },
    { id: 'dolomite_bluff', common: 'Bongkahan Dolomit Tebing', binomen: 'Dolomita praerupta', archetype: 1, rx: 92, ry: 68, roughness: 0.34, morph: 2, desc: 'Batu tebing danau purba berstruktur kokoh dengan retakan mineral diagonal.' },

    // --- 3. Layered Shale & Slate (Batu Lempeng Sedimen) ---
    { id: 'slate_plate', common: 'Lempeng Sabak Danau', binomen: 'Schistus lamellatus', archetype: 2, rx: 90, ry: 38, roughness: 0.22, morph: 3, desc: 'Batu lempeng bertingkat pipih dengan lapisan sedimen sejajar yang tersingkap air.' },
    { id: 'sandstone_strata', common: 'Batu Pasir Berlapis', binomen: 'Arenaceum stratosum', archetype: 2, rx: 82, ry: 46, roughness: 0.20, morph: 5, desc: 'Batuan sedimen danau dengan garis-garis ritmis pelapukan gelombang air dan bidang dasar datar.' },
    { id: 'banded_iron', common: 'Batu Sedimen Besi', binomen: 'Saxum ferreum vittatum', archetype: 2, rx: 74, ry: 42, roughness: 0.25, morph: 4, desc: 'Batu berpita mineral gelap berselang-seling dengan trap pelapisan sedimen halus.' },
    { id: 'schist_mica', common: 'Sekis Mika Berombak', binomen: 'Schistus micans undulatus', archetype: 2, rx: 86, ry: 40, roughness: 0.24, morph: 3, desc: 'Batu pipih berombak dengan serat metamorf dan kilau titik mika monokrom.' },

    // --- 4. Moss-Covered Stones (Batu Berlumut Danau) ---
    { id: 'velvet_moss_rock', common: 'Batu Lumut Beludru', binomen: 'Saxum muscosum sericeum', archetype: 3, rx: 76, ry: 52, roughness: 0.18, morph: 0, desc: 'Batu kali yang diselimuti bantalan lumut beludru berupa bercak bintik tinta sumi-e pekat di punggungnya.' },
    { id: 'algal_boulder', common: 'Batu Ganggang Air Tenang', binomen: 'Saxum algis vestitum', archetype: 3, rx: 84, ry: 58, roughness: 0.22, morph: 4, desc: 'Bongkahan batu tua dengan lapisan patina kelam dan spora titik tinta mikroskopis.' },
    { id: 'lichen_pebble', common: 'Kerikil Lumut Kerak', binomen: 'Calculus lichenosus', archetype: 3, rx: 55, ry: 36, roughness: 0.16, morph: 1, desc: 'Kerikil danau dengan bercak-bercak lumut kerak arsir tinta sumi-e yang melekat erat pada pori batu.' },
    { id: 'bog_stone', common: 'Batu Gambut Danau Purba', binomen: 'Saxum palustre antiquum', archetype: 3, rx: 70, ry: 48, roughness: 0.26, morph: 5, desc: 'Batu hitam kelam berpori dengan lumut air merambat di celah-celah lekukannya.' },

    // --- 5. Perforated Karst (Batu Karang Berpori & Suiseki) ---
    { id: 'taihu_scholar', common: 'Batu Karang Taihu', binomen: 'Saxum taihuense foraminosum', archetype: 4, rx: 82, ry: 66, roughness: 0.44, morph: 4, desc: 'Batu karang air tawar berongga pusaran dengan lorong-lorong tembus cahaya.' },
    { id: 'whirlpool_karst', common: 'Karang Pusaran Pusaka', binomen: 'Karstus vorticosus', archetype: 4, rx: 75, ry: 60, roughness: 0.40, morph: 2, desc: 'Batuan gamping terkikis pusaran air danau dengan rongga-rongga cekung anggun.' },
    { id: 'porous_tuff', common: 'Tufa Vulkanik Berpori', binomen: 'Tophus spongiosus', archetype: 4, rx: 68, ry: 50, roughness: 0.36, morph: 6, desc: 'Batu apung danau berongga mikro tempat persembunyian fauna air kecil.' },
    { id: 'pocket_boulder', common: 'Boulder Cekungan Sedimen', binomen: 'Saxum lacunae limosae', archetype: 4, rx: 88, ry: 56, roughness: 0.32, morph: 5, desc: 'Batu dengan cekungan mangkuk alami penampung butiran pasir dan kerikil halus.' },

    // --- 6. Pebble Shingle Clusters (Gugusan Kerikil Kali) ---
    { id: 'zen_trinity', common: 'Triad Batu Zen Sanzon', binomen: 'Trias lapidum zenica', archetype: 5, rx: 110, ry: 55, roughness: 0.18, count: 3, morph: 0, desc: 'Komposisi tiga batu harmoni klasik (Tinggi, Sedang, Rendah) saling bersandar anggun.' },
    { id: 'stream_gravel', common: 'Hamparan Kerikil Sungai', binomen: 'Glarea rivularis confluens', archetype: 5, rx: 130, ry: 60, roughness: 0.15, count: 6, morph: 1, desc: 'Gugusan 6 kerikil kali pipih dan bundar berjenjang yang tertata alami di dasar kolam.' },
    { id: 'shingle_pile', common: 'Gugusan Kerikil Teluk', binomen: 'Cumulus calculorum sinus', archetype: 5, rx: 150, ry: 68, roughness: 0.20, count: 9, morph: 3, desc: 'Kelompok 9 kerikil aneka ukuran yang tersusun tumpang-tindih mengikuti gravitasi dasar.' },
    { id: 'boulder_huddle', common: 'Rumpun Batu Dasar Danau', binomen: 'Congeries saxorum lacustris', archetype: 5, rx: 135, ry: 65, roughness: 0.28, count: 5, morph: 6, desc: 'Rumpun 5 batu bersudut dan membulat yang saling mengunci membentuk habitat alami.' }
  ];

  function getPebbleById(id) {
    return PEBBLE_CATALOG.find(p => p.id === id) || PEBBLE_CATALOG[0];
  }

  function getPebbleList() {
    return PEBBLE_CATALOG.slice();
  }

  // -----------------------------------------------------------------
  // 3. Mathematical Single Pebble / Stone Specimen
  // -----------------------------------------------------------------
  class PebbleSpecimen {
    constructor(x, y, seed, config = {}) {
      this.x = x;
      this.y = y;
      this.seed = seed || `Pebble_${Math.floor(rand() * 99999)}`;
      set_seed(this.seed);

      this.archetype = config.archetype !== undefined ? config.archetype : ARCHETYPES.SMOOTH;
      this.morph = config.morph !== undefined && config.morph !== 'auto'
        ? Number(config.morph)
        : (config.morphPreset !== undefined ? config.morphPreset : choice([0, 1, 2, 3, 4, 5, 6]));

      this.scale = config.scale || 1.0;
      this.rx = (config.rx || rndtri(38, 55, 78)) * this.scale;
      this.ry = (config.ry || rndtri(24, 38, 56)) * this.scale;
      this.angle = config.angle !== undefined ? config.angle : rndtri(-0.35, 0, 0.35);
      this.roughness = config.roughness !== undefined ? config.roughness : rndtri(0.1, 0.2, 0.35);

      this.tiltX = Math.cos(this.angle);
      this.tiltY = Math.sin(this.angle);

      // Light direction vector (standard sumi-e illumination: top-left ambient)
      this.lightAngle = rndtri(-PI * 0.85, -PI * 0.65, -PI * 0.45);
      this.lightVec = { x: Math.cos(this.lightAngle), y: Math.sin(this.lightAngle) };

      this.initPerimeter();
      this.initInnerContours();
      this.initFissures();
      this.initStrata();
      this.initMoss();
    }

    initPerimeter() {
      this.perimeterPts = [];
      const numPts = this.archetype === ARCHETYPES.CRAGGY ? Math.floor(rnd(12, 18)) : 72;

      // Harmonic Fourier parameters (up to 8 independent modes)
      const numHarmonics = this.archetype === ARCHETYPES.SMOOTH ? 5 : 8;
      const harmonics = [];
      for (let k = 2; k <= numHarmonics; k++) {
        harmonics.push({
          k,
          amp: (rnd(0.04, 0.16) / Math.pow(k, 0.75)) * (this.roughness * 2.8),
          phase: rnd(0, TWO_PI)
        });
      }

      // Morphological parameters
      const chipAngle = rnd(0, TWO_PI);
      const chipWidth = rnd(0.28, 0.45);
      const chipDepth = rnd(0.22, 0.36);
      const eggSkew = rndtri(0.18, 0.26, 0.35);
      const triPhase = rnd(0, TWO_PI);
      const superP = rndtri(2.2, 2.6, 3.2);

      for (let i = 0; i < numPts; i++) {
        const theta = (i / numPts) * TWO_PI;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        // 1. Base geometric shape radius
        let baseR;
        if (this.morph === MORPHS.SUPERELLIPSE) {
          // Lamé superellipse (rounded rectangular blocky slab)
          const absCos = Math.abs(cosT);
          const absSin = Math.abs(sinT);
          const denom = Math.pow(Math.pow(absCos / this.rx, superP) + Math.pow(absSin / this.ry, superP), 1 / superP) || 1;
          baseR = 1 / denom;
        } else {
          // Standard ellipse
          const denom = Math.hypot(this.ry * cosT, this.rx * sinT) || 1;
          baseR = (this.rx * this.ry) / denom;
        }

        // 2. Morphological Profile Deformations
        let morphFactor = 1.0;
        if (this.morph === MORPHS.TEARDROP) {
          // Asymmetric egg / teardrop: bulbous on one end, tapered on other
          morphFactor *= (1.0 + eggSkew * cosT);
        } else if (this.morph === MORPHS.TRIANGULAR) {
          // 3-fold wedge prism
          morphFactor *= (1.0 + 0.22 * Math.cos(3 * theta + triPhase));
        } else if (this.morph === MORPHS.KIDNEY_BEAN) {
          // Bean curve: convex upper, concave lower
          morphFactor *= (1.0 - 0.20 * sinT - 0.12 * Math.cos(2 * theta));
        } else if (this.morph === MORPHS.CHIPPED_SPALL) {
          // Localized Gaussian impact flake spall scar
          let dTh = Math.abs(theta - chipAngle);
          if (dTh > PI) dTh = TWO_PI - dTh;
          const chipIndent = chipDepth * Math.exp(-(dTh * dTh) / (2 * chipWidth * chipWidth));
          morphFactor *= (1.0 - chipIndent);
        }

        // 3. Harmonic Fourier Perturbation
        let perturb = 1.0;
        for (const h of harmonics) {
          perturb += h.amp * Math.cos(h.k * theta + h.phase);
        }

        // Karst hollow indentations
        if (this.archetype === ARCHETYPES.KARST) {
          const hollow = Math.sin(theta * 3.0 + 1.2) * 0.18 + Math.cos(theta * 5.0) * 0.12;
          perturb += hollow;
        }

        let r = Math.max(8, baseR * morphFactor * perturb);

        // Local coordinates
        let lx = Math.cos(theta) * r;
        let ly = Math.sin(theta) * r;

        // Flat-bottom resting plane morph
        if (this.morph === MORPHS.FLAT_BOTTOM) {
          const flatY = -this.ry * 0.70;
          if (ly < flatY) {
            ly = flatY + rndtri(-1.5, 0, 1.5);
            r = Math.hypot(lx, ly);
          }
        }

        // Rotate by tilt angle
        const rx = lx * this.tiltX - ly * this.tiltY;
        const ry = lx * this.tiltY + ly * this.tiltX;

        this.perimeterPts.push({ x: rx, y: ry, theta, r });
      }
    }

    initInnerContours() {
      // Concentric chiaroscuro shading contours drifting toward light
      this.contours = [];
      const numLayers = rndtri(3, 4, 6);
      for (let l = 1; l <= numLayers; l++) {
        const frac = l / (numLayers + 1);
        const pts = [];
        // Light drift center
        const driftDist = (1 - frac) * (this.rx * 0.22);
        const cX = this.lightVec.x * driftDist;
        const cY = this.lightVec.y * (driftDist * 0.65);

        for (let i = 0; i < this.perimeterPts.length; i++) {
          const p = this.perimeterPts[i];
          const shrink = lerp(0.92, 0.25, frac);
          const px = cX + p.x * shrink;
          const py = cY + p.y * shrink;
          pts.push({ x: px, y: py });
        }
        this.contours.push({ pts, frac });
      }
    }

    initFissures() {
      this.fissures = [];
      if (this.archetype !== ARCHETYPES.CRAGGY && this.archetype !== ARCHETYPES.KARST && this.archetype !== ARCHETYPES.STRATIFIED) {
        return;
      }

      const numCracks = Math.floor(rnd(2, 5));
      for (let c = 0; c < numCracks; c++) {
        const crackPts = [];
        const startIdx = Math.floor(rnd(0, this.perimeterPts.length));
        let curr = { x: this.perimeterPts[startIdx].x * 0.95, y: this.perimeterPts[startIdx].y * 0.95 };
        crackPts.push(curr);

        const steps = Math.floor(rnd(4, 9));
        for (let s = 0; s < steps; s++) {
          const toCenterX = -curr.x * 0.35;
          const toCenterY = -curr.y * 0.35;
          curr = {
            x: curr.x + toCenterX + rndtri(-12, 0, 12),
            y: curr.y + toCenterY + rndtri(-8, 0, 8)
          };
          crackPts.push(curr);

          // Sub-branch fracture
          if (rand() < 0.35 && crackPts.length >= 2) {
            const branchPts = [curr];
            const bX = curr.x + rndtri(-15, 0, 15);
            const bY = curr.y + rndtri(-12, 0, 12);
            branchPts.push({ x: bX, y: bY });
            this.fissures.push({ pts: branchPts, isSub: true });
          }
        }
        this.fissures.push({ pts: crackPts, isSub: false });
      }
    }

    initStrata() {
      this.strataLines = [];
      if (this.archetype !== ARCHETYPES.STRATIFIED) {
        return;
      }

      const numBands = Math.floor(rnd(4, 8));
      for (let b = 0; b < numBands; b++) {
        const frac = lerp(-0.75, 0.75, (b + 1) / (numBands + 1));
        const yOff = frac * this.ry * 0.85;
        const pts = [];
        const steps = 14;
        const spanW = this.rx * 1.5 * Math.sqrt(Math.max(0.1, 1 - Math.pow(frac, 2)));

        for (let s = 0; s <= steps; s++) {
          const u = (s / steps - 0.5) * 2;
          const lx = u * (spanW * 0.5);
          const ly = yOff + Math.sin(u * PI * 2 + b) * (this.ry * 0.08) + rndtri(-2, 0, 2);
          const rx = lx * this.tiltX - ly * this.tiltY;
          const ry = lx * this.tiltY + ly * this.tiltX;
          pts.push({ x: rx, y: ry });
        }
        this.strataLines.push(pts);
      }
    }

    initMoss() {
      this.mossPatches = [];
      if (this.archetype !== ARCHETYPES.MOSSY && this.archetype !== ARCHETYPES.KARST && rand() > 0.4) {
        return;
      }

      const numPatches = this.archetype === ARCHETYPES.MOSSY ? Math.floor(rnd(4, 9)) : Math.floor(rnd(2, 4));
      for (let m = 0; m < numPatches; m++) {
        const arc = rnd(PI * 0.65, PI * 1.35); // Upper sunlit crown
        const pIdx = Math.floor((arc / TWO_PI) * this.perimeterPts.length) % this.perimeterPts.length;
        const basePt = this.perimeterPts[pIdx];

        const patchR = rndtri(8, 16, 26) * this.scale;
        const cx = basePt.x * rndtri(0.75, 0.9, 1.05);
        const cy = basePt.y * rndtri(0.75, 0.9, 1.05);

        const tufts = [];
        const numTufts = Math.floor(rnd(8, 16));
        for (let k = 0; k < numTufts; k++) {
          tufts.push({
            dx: rndtri(-patchR * 0.6, 0, patchR * 0.6),
            dy: rndtri(-patchR * 0.6, 0, patchR * 0.6),
            r: rndtri(1.2, 2.4, 3.8)
          });
        }

        this.mossPatches.push({ cx, cy, r: patchR, tufts });
      }
    }

    render(ctx, options = {}) {
      ctx.save();
      ctx.translate(this.x, this.y);

      const theme = options.theme || 'washi';
      const isMidnight = theme === 'midnight';
      const strokeColor = options.strokeColor || (isMidnight ? '#f0f0f0' : '#111111');
      const lineWidth = options.lineWidth || 1.1;

      // -----------------------------------------------------------------
      // 100% STRICTLY MONOCHROME SUMI-E PALETTE (Grayscale, Black & White)
      // -----------------------------------------------------------------
      const baseWash = isMidnight
        ? (options.rockWash || options.fillWash || 'rgba(255, 255, 255, 0.08)')
        : (options.rockWash || options.fillWash || 'rgba(40, 40, 40, 0.09)');

      const shadowWash = isMidnight
        ? 'rgba(0, 0, 0, 0.60)'
        : 'rgba(20, 20, 20, 0.22)';

      const highlightWash = isMidnight
        ? 'rgba(255, 255, 255, 0.16)'
        : 'rgba(255, 255, 255, 0.55)';

      const mossWash = isMidnight
        ? (options.mossWash || 'rgba(255, 255, 255, 0.14)')
        : (options.mossWash || 'rgba(25, 25, 25, 0.18)');

      const mossTuftColor = isMidnight
        ? 'rgba(240, 240, 240, 0.70)'
        : 'rgba(15, 15, 15, 0.75)';

      const dropShadowColor = isMidnight
        ? 'rgba(0, 0, 0, 0.45)'
        : 'rgba(0, 0, 0, 0.14)';

      const P = this.perimeterPts;
      if (P.length < 3) {
        ctx.restore();
        return;
      }

      // 1. Soft underwater ground drop shadow
      if (options.showShadow !== false) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, this.ry * 0.55, this.rx * 0.95, this.ry * 0.35, 0, 0, TWO_PI);
        ctx.fillStyle = dropShadowColor;
        ctx.fill();
        ctx.restore();
      }

      // 2. Main Pebble Perimeter Silhouette & Base Wash
      ctx.beginPath();
      ctx.moveTo(P[0].x, P[0].y);
      for (let i = 1; i < P.length; i++) {
        ctx.lineTo(P[i].x, P[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = baseWash;
      ctx.fill();

      // Clip to interior for layered chiaroscuro shading
      ctx.save();
      ctx.clip();

      // 3. Shaded Bottom-Right Crescent (Depicts weight and light direction)
      ctx.beginPath();
      const shadowCenterX = -this.lightVec.x * (this.rx * 0.32);
      const shadowCenterY = -this.lightVec.y * (this.ry * 0.32);
      ctx.ellipse(shadowCenterX, shadowCenterY, this.rx * 0.85, this.ry * 0.85, this.angle, 0, TWO_PI);
      ctx.fillStyle = shadowWash;
      ctx.fill();

      // 4. Concentric Topographical Ink Contours (Classical woodcut / print texture)
      if (options.showContours !== false) {
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const c of this.contours) {
          ctx.beginPath();
          ctx.lineWidth = Math.max(0.4, lineWidth * 0.55 * (1 - c.frac * 0.4));
          ctx.globalAlpha = lerp(0.35, 0.12, c.frac);

          const cpts = c.pts;
          ctx.moveTo(cpts[0].x, cpts[0].y);
          for (let i = 1; i < cpts.length; i++) {
            ctx.lineTo(cpts[i].x, cpts[i].y);
          }
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. Sedimentary Strata Striations
      if (this.strataLines.length > 0 && options.showStrata !== false) {
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(0.5, lineWidth * 0.65);
        ctx.globalAlpha = 0.48;
        for (const line of this.strataLines) {
          ctx.beginPath();
          ctx.moveTo(line[0].x, line[0].y);
          for (let i = 1; i < line.length; i++) {
            ctx.lineTo(line[i].x, line[i].y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Branching Fracture Fissures
      if (this.fissures.length > 0 && options.showFissures !== false) {
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineCap = 'round';
        for (const fis of this.fissures) {
          ctx.beginPath();
          ctx.lineWidth = fis.isSub ? Math.max(0.4, lineWidth * 0.5) : Math.max(0.7, lineWidth * 0.95);
          ctx.globalAlpha = fis.isSub ? 0.45 : 0.75;
          ctx.moveTo(fis.pts[0].x, fis.pts[0].y);
          for (let i = 1; i < fis.pts.length; i++) {
            ctx.lineTo(fis.pts[i].x, fis.pts[i].y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 7. Karst Porous Cavities / Hollows
      if (this.archetype === ARCHETYPES.KARST && options.showKarst !== false) {
        ctx.save();
        ctx.fillStyle = shadowWash;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(0.6, lineWidth * 0.75);

        const cavities = [
          { x: this.rx * 0.22, y: -this.ry * 0.15, rx: this.rx * 0.16, ry: this.ry * 0.18, rot: 0.3 },
          { x: -this.rx * 0.28, y: this.ry * 0.18, rx: this.rx * 0.14, ry: this.ry * 0.12, rot: -0.4 },
          { x: -this.rx * 0.05, y: -this.ry * 0.32, rx: this.rx * 0.10, ry: this.ry * 0.09, rot: 0.1 }
        ];

        for (const cav of cavities) {
          ctx.beginPath();
          ctx.ellipse(cav.x, cav.y, cav.rx, cav.ry, cav.rot, 0, TWO_PI);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // 8. Soft Moss Patches & Velvet Stippling (Sumi-e ink dotting)
      if (this.mossPatches.length > 0 && options.showMoss !== false) {
        ctx.save();
        for (const m of this.mossPatches) {
          // Monochrome ink bleed
          ctx.beginPath();
          ctx.arc(m.cx, m.cy, m.r, 0, TWO_PI);
          ctx.fillStyle = mossWash;
          ctx.fill();

          // Delicate stippled ink tufts
          ctx.fillStyle = mossTuftColor;
          for (const tf of m.tufts) {
            ctx.beginPath();
            ctx.arc(m.cx + tf.dx, m.cy + tf.dy, tf.r, 0, TWO_PI);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 9. Water Sheen Crest Highlight
      ctx.beginPath();
      const hlX = this.lightVec.x * (this.rx * 0.42);
      const hlY = this.lightVec.y * (this.ry * 0.42);
      ctx.ellipse(hlX, hlY, this.rx * 0.38, this.ry * 0.24, this.angle, 0, TWO_PI);
      ctx.fillStyle = highlightWash;
      ctx.fill();

      ctx.restore(); // Exit clip

      // 10. Outer Stroke Boundary (Crisp sumi-e outline)
      ctx.beginPath();
      ctx.moveTo(P[0].x, P[0].y);
      for (let i = 1; i < P.length; i++) {
        ctx.lineTo(P[i].x, P[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 4. Composite Multi-Pebble Riverbed Cluster (Gugusan Kerikil Kali)
  // -----------------------------------------------------------------
  class PebbleCluster {
    constructor(x, y, seed, options = {}) {
      this.x = x;
      this.y = y;
      this.seed = seed || `Cluster_${Math.floor(rand() * 99999)}`;
      set_seed(this.seed);

      let profile = PEBBLE_CATALOG.find(p => p.id === options.pebbleId || p.binomen === this.seed || p.common === this.seed);
      if (!profile) {
        const parsedArch = options.archetype !== undefined ? options.archetype : choice([0, 1, 2, 3, 4, 5]);
        profile = choice(PEBBLE_CATALOG.filter(p => p.archetype === parsedArch)) || PEBBLE_CATALOG[0];
      }

      this.profile = profile;
      this.archetype = profile.archetype;
      this.scale = (options.scale || rndtri(0.75, 1.0, 1.35)) * (options.scaleMult || 1.0);

      this.pebbles = [];
      const numPebbles = options.count !== undefined ? options.count : (profile.count || (this.archetype === ARCHETYPES.CLUSTER ? Math.floor(rnd(4, 8)) : 1));

      if (numPebbles <= 1) {
        // Single specimen stone
        this.pebbles.push(new PebbleSpecimen(0, 0, `${this.seed}_single`, {
          archetype: this.archetype,
          morph: options.morph !== undefined ? options.morph : profile.morph,
          rx: (options.rx || profile.rx) * this.scale,
          ry: (options.ry || profile.ry) * this.scale,
          roughness: options.roughness !== undefined ? options.roughness : profile.roughness,
          angle: options.angle !== undefined ? options.angle : rndtri(-0.35, 0, 0.35)
        }));
      } else {
        // Multi-pebble natural cluster
        const clusterSpanX = (options.clusterSpan || (profile.rx * 1.6)) * this.scale;
        const mainRx = (options.rx || profile.rx) * this.scale * 0.85;
        const mainRy = (options.ry || profile.ry) * this.scale * 0.85;

        // Primary anchor stone
        this.pebbles.push(new PebbleSpecimen(0, 0, `${this.seed}_main`, {
          archetype: this.archetype === ARCHETYPES.CLUSTER ? choice([0, 1, 2, 3]) : this.archetype,
          morph: options.morph !== undefined && options.morph !== 'auto' ? options.morph : profile.morph,
          rx: mainRx,
          ry: mainRy,
          roughness: profile.roughness,
          angle: rndtri(-0.25, 0, 0.25)
        }));

        // Satellite companion pebbles
        for (let i = 1; i < numPebbles; i++) {
          const u = (i / (numPebbles - 1) - 0.5) * 2;
          const satScale = rndtri(0.42, 0.65, 0.85);
          const offX = u * clusterSpanX * 0.55 + rndtri(-12, 0, 12);
          const offY = rndtri(-mainRy * 0.25, mainRy * 0.15, mainRy * 0.45);

          this.pebbles.push(new PebbleSpecimen(offX, offY, `${this.seed}_sat_${i}`, {
            archetype: choice([0, 1, 2, 3]),
            morph: options.morph !== undefined && options.morph !== 'auto' ? options.morph : choice([0, 1, 2, 3, 4, 5, 6]),
            rx: mainRx * satScale,
            ry: mainRy * satScale,
            roughness: rndtri(0.12, 0.24, 0.36),
            angle: rndtri(-0.6, 0, 0.6)
          }));
        }

        // Sort pebbles by Y to ensure proper perspective layering
        this.pebbles.sort((a, b) => a.y - b.y);
      }
    }

    render(ctx, options = {}) {
      ctx.save();
      ctx.translate(this.x, this.y);
      for (let i = 0; i < this.pebbles.length; i++) {
        this.pebbles[i].render(ctx, options);
      }
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 5. Lakebed Pebble Bed / Shingle Colony Ecosystem Manager
  // -----------------------------------------------------------------
  class PebbleBed {
    constructor(options = {}) {
      this.clusters = [];
      this.seed = options.seed || 'Lakebed Shingle Bed';
      this.init(options.width || 1200, options.height || 800, options.count || 8);
    }

    init(width, height, count = 8) {
      set_seed(this.seed);
      this.clusters = [];
      this.width = width;
      this.height = height;

      const margin = 60;
      const step = (width - margin * 2) / Math.max(1, count - 1);
      const archetypesPool = [0, 1, 2, 3, 4, 5];

      for (let i = 0; i < count; i++) {
        const baseX = margin + i * step + rndtri(-35, 0, 35);
        const baseY = height - rndtri(10, 24, 45);
        const clusterSeed = `${this.seed}_bed_${i}`;
        const arch = archetypesPool[i % archetypesPool.length];
        const species = choice(PEBBLE_CATALOG.filter(p => p.archetype === arch)) || PEBBLE_CATALOG[0];

        const cluster = new PebbleCluster(baseX, baseY, clusterSeed, {
          pebbleId: species.id,
          archetype: arch,
          scale: rndtri(0.65, 0.95, 1.3),
          count: arch === ARCHETYPES.CLUSTER ? Math.floor(rnd(3, 7)) : (rand() < 0.35 ? Math.floor(rnd(2, 4)) : 1)
        });
        this.clusters.push(cluster);
      }

      // Sort clusters by Y
      this.clusters.sort((a, b) => a.y - b.y);
    }

    resize(width, height) {
      this.init(width, height, this.clusters.length || 8);
    }

    render(ctx, options = {}) {
      for (let i = 0; i < this.clusters.length; i++) {
        this.clusters[i].render(ctx, options);
      }
    }
  }

  // -----------------------------------------------------------------
  // 6. Public Module API
  // -----------------------------------------------------------------
  return {
    set_seed,
    ARCHETYPES,
    MORPHS,
    PEBBLE_CATALOG,
    catalog: PEBBLE_CATALOG,
    getPebbleById,
    getPebbleList,
    PebbleSpecimen,
    PebbleCluster,
    PebbleBed,
    createBed: function (options) {
      return new PebbleBed(options);
    }
  };
});
