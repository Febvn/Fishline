/**
 * coraldraw.js - Procedural Aquatic Coral & Reef Engine
 *
 * Mathematically generates procedural marine & aquatic corals, sea fans,
 * brain corals, table plates, cup foliose ruffles, and pillar organ pipes
 * using recursive stochastic L-systems, reaction-diffusion meander curves,
 * harmonic conchoid whorls, reticulated fan lattices, and sumi-e ink washes.
 *
 * 100% STRICTLY MONOCHROME: Pure black ink, pure white, and neutral grays only.
 * Zero non-grayscale hues or pigments.
 *
 * UMD wrapper: CommonJS + Browser window.coraldraw
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.coraldraw = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // -----------------------------------------------------------------
  // 1. Deterministic PRNG & Numerical Utilities
  // -----------------------------------------------------------------
  let jsr = 0xC08A1;
  const PI = Math.PI;
  const TWO_PI = PI * 2;
  const HALF_PI = PI * 0.5;

  function rand() {
    jsr ^= (jsr << 17);
    jsr ^= (jsr >>> 13);
    jsr ^= (jsr << 5);
    return (jsr >>> 0) / 4294967296;
  }

  function set_seed(seed) {
    if (typeof seed === 'number') {
      jsr = (seed >>> 0) || 0xC08A1;
      return;
    }
    let h = 0x811c9dc5;
    const str = String(seed);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    jsr = (h >>> 0) || 0xC08A1;
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
  // 2. Coral Architectural Forms & 24 Species Catalog
  // -----------------------------------------------------------------
  const CORAL_ARCHETYPES = {
    BRANCHING: 0,   // Karang Rusa / Tanduk Bercabang (Staghorn / Acropora)
    BRAIN: 1,       // Karang Otak Labirin (Brain / Meandrina Labyrinth)
    TABLE: 2,       // Karang Meja Bertingkat (Table / Shelf Plate)
    FAN: 3,         // Kipas Laut Renda Lentur (Sea Fan / Gorgonian Mesh)
    FOLIOSE: 4,     // Karang Selada Cawan Kelopak (Cup / Foliose Lettuce)
    PILLAR: 5       // Karang Tabung Pilar Pipa (Pillar / Organ Pipe)
  };

  const CORAL_MORPHS = {
    STANDARD: 0,    // Morfologi standar botani
    SPREADING: 1,   // Melebar horizontal
    TALL_SPIRE: 2,  // Menjulang tinggi vertikal
    DENSE_BUSH: 3,  // Rumpun lebat rapat
    CURVED_FLOW: 4, // Melengkung mengikuti arus
    TIERED_STEP: 5, // Bertingkat tangga trap
    CLEFT_SPLIT: 6  // Patahan terbelah dua
  };

  const CORAL_CATALOG = [
    // --- 1. Branching Corals (Karang Ranting & Tanduk) ---
    { id: 'staghorn_acropora', common: 'Karang Tanduk Rusa', binomen: 'Acropora cervicornis', archetype: 0, height: 190, baseW: 14, spread: 130, roughness: 0.16, desc: 'Karang bercabang silindris anggun dengan corak kelopak cangkir polip runcing menghadap cahaya.' },
    { id: 'elkhorn_coral', common: 'Karang Tanduk Rusa Pipih', binomen: 'Acropora palmata', archetype: 0, height: 180, baseW: 22, spread: 150, roughness: 0.22, desc: 'Percabangan kokoh menyerupai tanduk rusa kutub dengan lempengan lebar penahan hantaman arus.' },
    { id: 'birdsnest_coral', common: 'Karang Sarang Burung', binomen: 'Seriatopora hystrix', archetype: 0, height: 150, baseW: 10, spread: 120, roughness: 0.14, desc: 'Jalinan ranting-ranting runcing rapat menyerupai sarang burung dengan ujung jarum tajam.' },
    { id: 'stylophora_club', common: 'Karang Gada Berbuku', binomen: 'Stylophora pistillata', archetype: 0, height: 160, baseW: 16, spread: 110, roughness: 0.18, desc: 'Batang bercabang dengan ujung membulat seperti gada bertabur cincin koralit sumi-e.' },

    // --- 2. Brain Corals (Karang Otak Labirin) ---
    { id: 'brain_diploria', common: 'Karang Otak Alur', binomen: 'Diploria labyrinthiformis', archetype: 1, height: 140, baseW: 160, spread: 160, roughness: 0.25, desc: 'Bongkahan kubah masif dengan lekukan meander labirin berliku mirip lipatan otak purba.' },
    { id: 'maze_platygyra', common: 'Karang Labirin Karang', binomen: 'Platygyra lamellina', archetype: 1, height: 130, baseW: 150, spread: 150, roughness: 0.28, desc: 'Pola dinding meander tajam berselang-seling dengan lembah arsir kapak sumi-e yang dalam.' },
    { id: 'boulder_brain', common: 'Karang Otak Bulat Masif', binomen: 'Colpophyllia natans', archetype: 1, height: 160, baseW: 170, spread: 170, roughness: 0.20, desc: 'Kubah batu terumbu danau kokoh berstruktur alur ganda dengan tekstur kontur elevasi cincin.' },
    { id: 'honeycomb_favia', common: 'Karang Sarang Lebah', binomen: 'Favia speciosa', archetype: 1, height: 120, baseW: 140, spread: 140, roughness: 0.22, desc: 'Koloni heksagonal rapat bersusun beraturan dengan kaliks koralit mangkuk monokrom.' },

    // --- 3. Table Corals (Karang Meja Bertingkat) ---
    { id: 'table_acropora', common: 'Karang Piring Meja', binomen: 'Acropora cytherea', archetype: 2, height: 175, baseW: 24, spread: 210, roughness: 0.15, desc: 'Piringan horizontal datar melebar horizontal bertingkat ditopang batang kayu tengah yang kokoh.' },
    { id: 'tiered_montipora', common: 'Karang Piring Bertingkat', binomen: 'Montipora capricornis', archetype: 2, height: 165, baseW: 20, spread: 190, roughness: 0.18, desc: 'Lempeng kelopak melingkar berjenjang spiral ke atas dengan tepian bergelombang renda.' },
    { id: 'bracket_shelf', common: 'Karang Rak Dinding', binomen: 'Pachyseris speciosa', archetype: 2, height: 140, baseW: 18, spread: 170, roughness: 0.20, desc: 'Lempeng rak bertrap dengan garis-garis punggungan konsentris sejajar yang halus.' },
    { id: 'disk_turbinaria', common: 'Karang Cawan Piring', binomen: 'Turbinaria peltata', archetype: 2, height: 150, baseW: 22, spread: 180, roughness: 0.16, desc: 'Cawan datar lebar menyerupai piring saji dengan bintik-bintik koralit polip timbul.' },

    // --- 4. Sea Fans (Kipas Laut Renda Lentur) ---
    { id: 'sea_fan_gorgonian', common: 'Kipas Laut Renda', binomen: 'Gorgonia ventalina', archetype: 3, height: 210, baseW: 12, spread: 180, roughness: 0.12, desc: 'Anyaman jala renda pipih berpori mikro yang meliuk anggun mengikuti tiupan arus air bawah.' },
    { id: 'sea_whip_black', common: 'Kipas Cemeti Hitam', binomen: 'Antipathes dichotoma', archetype: 3, height: 230, baseW: 10, spread: 140, roughness: 0.15, desc: 'Jalinan cabang lentur menjulang tinggi dengan pola arsir jala sumi-e yang renggang.' },
    { id: 'venus_sea_fan', common: 'Kipas Anyam Venus', binomen: 'Gorgonia flabellum', archetype: 3, height: 200, baseW: 14, spread: 190, roughness: 0.14, desc: 'Kipas jala segitiga terbalik melebar dengan kerangka anyaman mikro saling mengunci.' },
    { id: 'lace_coral', common: 'Kipas Renda Halus', binomen: 'Stylaster roseus', archetype: 3, height: 170, baseW: 10, spread: 130, roughness: 0.10, desc: 'Struktur renda kalsit tipis dengan percabangan mikroskopis yang tembus pandang.' },

    // --- 5. Foliose & Cup Corals (Karang Selada & Cawan) ---
    { id: 'lettuce_coral', common: 'Karang Selada Renda', binomen: 'Turbinaria mesenterina', archetype: 4, height: 160, baseW: 30, spread: 170, roughness: 0.24, desc: 'Kelopak cawan bergelombang lipat-melipat menyerupai daun selada air atau bunga mawar mekar.' },
    { id: 'carnation_coral', common: 'Karang Mawar Kelopak', binomen: 'Pectinia lactuca', archetype: 4, height: 150, baseW: 28, spread: 160, roughness: 0.26, desc: 'Piramida kelopak tipis berlekuk tegak dengan sayatan kontur chiaroscuro yang tajam.' },
    { id: 'scroll_coral', common: 'Karang Gulungan Kertas', binomen: 'Turbinaria reniformis', archetype: 4, height: 145, baseW: 26, spread: 155, roughness: 0.20, desc: 'Lempeng berpilin melingkar mirip gulungan washi kuno yang terbuka di dasar kolam.' },
    { id: 'ridge_coral', common: 'Karang Kelopak Karang', binomen: 'Echinopora lamellosa', archetype: 4, height: 155, baseW: 25, spread: 165, roughness: 0.22, desc: 'Cawan pipih berombak dengan tepian bergerigi halus dan alur septa memusat.' },

    // --- 6. Pillar & Pipe Corals (Karang Tabung Pilar) ---
    { id: 'pillar_dendrogyra', common: 'Karang Pilar Tiang', binomen: 'Dendrogyra cylindrus', archetype: 5, height: 220, baseW: 90, spread: 140, roughness: 0.20, desc: 'Kumpulan silinder pilar kokoh menjulang vertikal dengan permukaan berbulu polip halus.' },
    { id: 'organ_pipe', common: 'Karang Pipa Organ', binomen: 'Tubipora musica', archetype: 5, height: 180, baseW: 80, spread: 130, roughness: 0.18, desc: 'Deretan tabung paralel berjenjang seperti pipa organ katedral dengan sekat pelat horizontal.' },
    { id: 'finger_porites', common: 'Karang Tabung Jari', binomen: 'Porites compressa', archetype: 5, height: 190, baseW: 85, spread: 135, roughness: 0.22, desc: 'Gugusan silinder ramping tumpul mirip jari-jemari tangan yang mengarah ke permukaan air.' },
    { id: 'clustered_tube', common: 'Karang Tabung Rumpun', binomen: 'Galaxea fascicularis', archetype: 5, height: 170, baseW: 75, spread: 125, roughness: 0.25, desc: 'Tabung koralit bersudut bintang tajam yang tumbuh memancar dari substrat dasar kolam.' }
  ];

  function getCoralById(id) {
    return CORAL_CATALOG.find(c => c.id === id) || CORAL_CATALOG[0];
  }

  function getCoralList() {
    return CORAL_CATALOG.slice();
  }

  // -----------------------------------------------------------------
  // 3. Mathematical Single Coral Specimen
  // -----------------------------------------------------------------
  class CoralSpecimen {
    constructor(x, y, seed, config = {}) {
      this.x = x;
      this.y = y;
      this.seed = seed || `Coral_${Math.floor(rand() * 99999)}`;
      set_seed(this.seed);

      this.archetype = config.archetype !== undefined ? config.archetype : CORAL_ARCHETYPES.BRANCHING;
      this.morph = config.morph !== undefined && config.morph !== 'auto'
        ? Number(config.morph)
        : (config.morphPreset !== undefined ? config.morphPreset : Math.floor(rand() * 7));

      this.scale = config.scale || 1.0;
      this.height = (config.height || rndtri(140, 180, 220)) * this.scale;
      this.baseW = (config.baseW || rndtri(14, 22, 32)) * this.scale;
      this.spread = (config.spread || rndtri(120, 160, 200)) * this.scale;
      this.roughness = config.roughness !== undefined ? config.roughness : rndtri(0.12, 0.20, 0.32);

      // Light vector (top-left sumi-e ambient light)
      this.lightAngle = rndtri(-PI * 0.85, -PI * 0.65, -PI * 0.45);
      this.lightVec = { x: Math.cos(this.lightAngle), y: Math.sin(this.lightAngle) };

      // Hydrodynamic current phase
      this.swayPhase = rnd(0, TWO_PI);
      this.swayAmp = (this.archetype === CORAL_ARCHETYPES.FAN ? 14 : 4) * this.scale;
      this.currentSwayX = 0;

      // Internal structures
      this.branches = [];
      this.plates = [];
      this.meanders = [];
      this.meshLattice = [];
      this.ruffles = [];
      this.pillars = [];
      this.polyps = [];
      this.holdfastPts = [];

      this.initHoldfast();
      this.buildGeometry();
    }

    initHoldfast() {
      // Basal calcified holdfast cementing coral to lakebed
      this.holdfastPts = [];
      const footW = this.baseW * 1.8;
      const footH = this.baseW * 0.55;
      const numPts = 16;
      for (let i = 0; i <= numPts; i++) {
        const u = (i / numPts - 0.5) * 2;
        const px = u * footW;
        const py = Math.pow(u, 2) * footH + rndtri(-2, 0, 2);
        this.holdfastPts.push({ x: px, y: py });
      }
    }

    buildGeometry() {
      switch (this.archetype) {
        case CORAL_ARCHETYPES.BRANCHING:
          this.buildBranching();
          break;
        case CORAL_ARCHETYPES.BRAIN:
          this.buildBrain();
          break;
        case CORAL_ARCHETYPES.TABLE:
          this.buildTable();
          break;
        case CORAL_ARCHETYPES.FAN:
          this.buildFan();
          break;
        case CORAL_ARCHETYPES.FOLIOSE:
          this.buildFoliose();
          break;
        case CORAL_ARCHETYPES.PILLAR:
          this.buildPillar();
          break;
        default:
          this.buildBranching();
      }
    }

    // --- 3.1 Branching Acropora (L-system recursive tree) ---
    buildBranching() {
      this.branches = [];
      this.polyps = [];

      const startW = this.baseW;
      const rootLen = this.height * 0.38;

      const queue = [
        { x: 0, y: 0, angle: -HALF_PI, length: rootLen, width: startW, depth: 0 }
      ];

      const maxDepth = this.morph === CORAL_MORPHS.DENSE_BUSH ? 4 : 3;

      while (queue.length > 0) {
        const seg = queue.shift();
        const endX = seg.x + Math.cos(seg.angle) * seg.length;
        const endY = seg.y + Math.sin(seg.angle) * seg.length;

        // Curve control point with natural upward buoyancy
        const midX = (seg.x + endX) * 0.5 + rndtri(-6, 0, 6);
        const midY = (seg.y + endY) * 0.5 - rndtri(2, 6, 12);

        this.branches.push({
          x0: seg.x, y0: seg.y,
          cx: midX, cy: midY,
          x1: endX, y1: endY,
          width0: seg.width,
          width1: Math.max(2.5, seg.width * 0.68),
          depth: seg.depth
        });

        // Corallite calices (cups along branch edge)
        const numCalices = Math.floor(rnd(3, 6));
        for (let k = 1; k < numCalices; k++) {
          const t = k / numCalices;
          const bx = lerp(seg.x, endX, t);
          const by = lerp(seg.y, endY, t);
          const normA = seg.angle + (rand() < 0.5 ? HALF_PI : -HALF_PI);
          this.polyps.push({
            x: bx + Math.cos(normA) * (seg.width * 0.55),
            y: by + Math.sin(normA) * (seg.width * 0.55),
            r: rndtri(2.0, 3.2, 4.2),
            angle: normA
          });
        }

        if (seg.depth < maxDepth) {
          const numChildren = (seg.depth === 0 && this.morph === CORAL_MORPHS.CLEFT_SPLIT) ? 2 : (rand() < 0.45 ? 3 : 2);
          const spreadAng = (this.morph === CORAL_MORPHS.SPREADING ? 0.65 : 0.42);

          for (let c = 0; c < numChildren; c++) {
            const frac = numChildren === 1 ? 0 : (c / (numChildren - 1) - 0.5) * 2;
            const childAngle = seg.angle + frac * spreadAng + rndtri(-0.15, 0, 0.15);
            const childLen = seg.length * rndtri(0.65, 0.78, 0.88);
            const childW = seg.width * 0.68;

            queue.push({
              x: endX, y: endY,
              angle: childAngle,
              length: childLen,
              width: childW,
              depth: seg.depth + 1
            });
          }
        }
      }
    }

    // --- 3.2 Brain Coral (Labyrinthine Gyri & Sulci) ---
    buildBrain() {
      this.meanders = [];
      this.polyps = [];

      const domeRx = this.spread * 0.52;
      const domeRy = this.height * 0.65;
      const centerY = -domeRy * 0.85;

      // Outer dome silhouette points
      this.domePts = [];
      const numDome = 48;
      for (let i = 0; i <= numDome; i++) {
        const theta = PI + (i / numDome) * PI;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const baseR = (domeRx * domeRy) / Math.hypot(domeRy * cosT, domeRx * sinT);
        const perturb = 1.0 + rndtri(-0.06, 0, 0.06);
        this.domePts.push({
          x: cosT * baseR * perturb,
          y: centerY + sinT * baseR * perturb
        });
      }

      // Generate undulating meander ridge curves inside the dome
      const numBands = 9;
      for (let b = 1; b < numBands; b++) {
        const frac = b / numBands;
        const bandRy = domeRy * (1 - frac * 0.85);
        const bandRx = domeRx * (1 - frac * 0.85);
        const bandCenterY = centerY + frac * (domeRy * 0.35);

        const pts = [];
        const steps = 36;
        for (let s = 0; s <= steps; s++) {
          const theta = PI + (s / steps) * PI;
          // Meander sinusoidal jitter (brain convolution)
          const freq = 7.0 + (b % 3);
          const amp = 6.0 * (1 - frac * 0.3);
          const rOff = Math.sin(theta * freq + b * 1.4) * amp;

          const baseR = (bandRx * bandRy) / Math.hypot(bandRy * Math.cos(theta), bandRx * Math.sin(theta));
          const r = Math.max(10, baseR + rOff);
          pts.push({
            x: Math.cos(theta) * r,
            y: bandCenterY + Math.sin(theta) * r
          });
        }
        this.meanders.push(pts);
      }
    }

    // --- 3.3 Table Coral (Cantilevered Horizontal Tiered Discs) ---
    buildTable() {
      this.plates = [];
      this.polyps = [];

      const numTiers = this.morph === CORAL_MORPHS.TIERED_STEP ? 4 : (this.morph === CORAL_MORPHS.TALL_SPIRE ? 2 : 3);
      const topW = this.spread * 0.55;

      for (let t = 0; t < numTiers; t++) {
        const frac = t / (numTiers);
        const plateY = -this.height * (0.45 + frac * 0.50);
        const plateRx = topW * (0.65 + frac * 0.45);
        const plateRy = plateRx * 0.28; // 2.5D perspective flatten
        const shiftX = rndtri(-12, 0, 12);

        const rimPts = [];
        const numRim = 36;
        for (let i = 0; i <= numRim; i++) {
          const th = (i / numRim) * TWO_PI;
          const rMod = 1.0 + Math.sin(th * 12) * 0.04 + rndtri(-0.03, 0, 0.03);
          rimPts.push({
            x: shiftX + Math.cos(th) * plateRx * rMod,
            y: plateY + Math.sin(th) * plateRy * rMod
          });
        }

        // Under-plate support struts
        const struts = [];
        const numStruts = 6;
        for (let s = 0; s < numStruts; s++) {
          const a = (s / numStruts) * PI;
          struts.push({
            x0: 0, y0: plateY + plateRy * 0.6,
            x1: shiftX + Math.cos(a) * plateRx * 0.85,
            y1: plateY + Math.sin(a) * plateRy * 0.85
          });
        }

        this.plates.push({
          y: plateY,
          rx: plateRx,
          ry: plateRy,
          shiftX,
          rimPts,
          struts
        });
      }

      // Sort plates from top to bottom
      this.plates.sort((a, b) => a.y - b.y);
    }

    // --- 3.4 Sea Fan (Anastomosing Reticular Lattice) ---
    buildFan() {
      this.meshLattice = [];
      this.polyps = [];

      const fanH = this.height * 0.95;
      const fanW = this.spread * 0.55;

      // Primary radial ribs
      const numRibs = 14;
      const ribs = [];
      for (let r = 0; r < numRibs; r++) {
        const u = (r / (numRibs - 1) - 0.5) * 2;
        const targetAng = -HALF_PI + u * (PI * 0.38);
        const len = fanH * (0.85 + (1 - Math.abs(u)) * 0.25);

        const pts = [];
        const steps = 8;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const curAng = lerp(-HALF_PI, targetAng, t);
          const curLen = len * t;
          pts.push({
            x: Math.cos(curAng) * curLen + rndtri(-2, 0, 2),
            y: Math.sin(curAng) * curLen
          });
        }
        ribs.push(pts);
      }

      // Horizontal cross-connecting lattice rungs
      const rungs = [];
      const numRungs = 12;
      for (let l = 1; l < numRungs; l++) {
        const t = l / numRungs;
        const rungPts = [];
        for (let r = 0; r < numRibs; r++) {
          const stepIdx = Math.min(ribs[r].length - 1, Math.floor(t * (ribs[r].length - 1)));
          rungPts.push(ribs[r][stepIdx]);
        }
        rungs.push(rungPts);
      }

      this.meshLattice = { ribs, rungs };
    }

    // --- 3.5 Foliose / Cup Coral (Conchoid Petaloid Whorls) ---
    buildFoliose() {
      this.ruffles = [];
      this.polyps = [];

      const numCups = this.morph === CORAL_MORPHS.DENSE_BUSH ? 5 : 3;
      for (let c = 0; c < numCups; c++) {
        const frac = c / numCups;
        const cupCenterY = -this.height * (0.35 + frac * 0.55);
        const cupRx = this.spread * (0.35 + (1 - frac) * 0.25);
        const cupRy = cupRx * 0.45;
        const offX = rndtri(-18, 0, 18);

        const petalPts = [];
        const numPts = 42;
        for (let i = 0; i <= numPts; i++) {
          const th = (i / numPts) * TWO_PI;
          // Harmonic wavy ruffle edge
          const ruffle = 1.0 + Math.sin(th * 6.0 + c * 1.8) * 0.16 + Math.cos(th * 3.0) * 0.08;
          petalPts.push({
            x: offX + Math.cos(th) * cupRx * ruffle,
            y: cupCenterY + Math.sin(th) * cupRy * ruffle
          });
        }

        // Internal radial septa striations
        const striations = [];
        const numStriae = 16;
        for (let s = 0; s < numStriae; s++) {
          const a = (s / numStriae) * TWO_PI;
          striations.push({
            x0: offX, y0: cupCenterY,
            x1: offX + Math.cos(a) * cupRx * 0.85,
            y1: cupCenterY + Math.sin(a) * cupRy * 0.85
          });
        }

        this.ruffles.push({
          y: cupCenterY,
          offX,
          rx: cupRx,
          ry: cupRy,
          petalPts,
          striations
        });
      }

      this.ruffles.sort((a, b) => a.y - b.y);
    }

    // --- 3.6 Pillar & Pipe Coral (Vertical Clustered Cylinders) ---
    buildPillar() {
      this.pillars = [];
      this.polyps = [];

      const numCols = Math.floor(rnd(4, 7));
      const colWidth = this.baseW * 0.95;
      const spanW = this.spread * 0.65;

      for (let i = 0; i < numCols; i++) {
        const u = (i / (numCols - 1) - 0.5) * 2;
        const colX = u * spanW * 0.5 + rndtri(-6, 0, 6);
        const colH = this.height * (0.65 + (1 - Math.abs(u) * 0.45) * 0.35 + rndtri(-0.1, 0, 0.1));
        const w = colWidth * rndtri(0.75, 1.0, 1.25);

        // Fluted vertical grooves
        const grooves = [];
        const numG = 3;
        for (let g = 0; g < numG; g++) {
          const gx = colX + (g - 1) * (w * 0.35);
          grooves.push({ x0: gx, y0: 0, x1: gx, y1: -colH });
        }

        this.pillars.push({
          x: colX,
          height: colH,
          width: w,
          grooves
        });
      }

      this.pillars.sort((a, b) => Math.abs(a.x) - Math.abs(b.x));
    }

    update(dt, waterFlow = 0) {
      this.swayPhase += dt * 1.4;
      this.currentSwayX = Math.sin(this.swayPhase) * this.swayAmp + waterFlow * 8;
    }

    render(ctx, options = {}) {
      ctx.save();
      ctx.translate(this.x, this.y);

      const theme = options.theme || 'washi';
      const isMidnight = theme === 'midnight';
      const strokeColor = options.strokeColor || (isMidnight ? '#f0f0f0' : '#111111');
      const lineWidth = options.lineWidth || 1.15;

      // 100% STRICTLY MONOCHROME PALETTE
      const baseWash = isMidnight
        ? (options.coralWash || 'rgba(255, 255, 255, 0.08)')
        : (options.coralWash || 'rgba(35, 35, 35, 0.08)');

      const shadowWash = isMidnight
        ? 'rgba(0, 0, 0, 0.60)'
        : 'rgba(20, 20, 20, 0.24)';

      const highlightWash = isMidnight
        ? 'rgba(255, 255, 255, 0.18)'
        : 'rgba(255, 255, 255, 0.55)';

      const polypInk = isMidnight
        ? 'rgba(240, 240, 240, 0.75)'
        : 'rgba(15, 15, 15, 0.80)';

      const dropShadowColor = isMidnight
        ? 'rgba(0, 0, 0, 0.45)'
        : 'rgba(0, 0, 0, 0.14)';

      // 1. Soft underwater ground drop shadow
      if (options.showShadow !== false) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 8, this.spread * 0.45, 12, 0, 0, TWO_PI);
        ctx.fillStyle = dropShadowColor;
        ctx.fill();
        ctx.restore();
      }

      // 2. Basal Holdfast Anchor
      if (this.holdfastPts.length > 2 && options.showHoldfast !== false) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.holdfastPts[0].x, this.holdfastPts[0].y);
        for (let i = 1; i < this.holdfastPts.length; i++) {
          ctx.lineTo(this.holdfastPts[i].x, this.holdfastPts[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = baseWash;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth * 0.9;
        ctx.stroke();
        ctx.restore();
      }

      // Dynamic subtle hydrodynamic sway transform
      ctx.save();
      const swayX = this.currentSwayX;
      ctx.transform(1, 0, swayX / 600, 1, 0, 0);

      // 3. Render According to Archetype
      switch (this.archetype) {
        case CORAL_ARCHETYPES.BRANCHING:
          this.renderBranching(ctx, strokeColor, lineWidth, baseWash, shadowWash, polypInk, options);
          break;
        case CORAL_ARCHETYPES.BRAIN:
          this.renderBrain(ctx, strokeColor, lineWidth, baseWash, shadowWash, options);
          break;
        case CORAL_ARCHETYPES.TABLE:
          this.renderTable(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options);
          break;
        case CORAL_ARCHETYPES.FAN:
          this.renderFan(ctx, strokeColor, lineWidth, baseWash, shadowWash, options);
          break;
        case CORAL_ARCHETYPES.FOLIOSE:
          this.renderFoliose(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options);
          break;
        case CORAL_ARCHETYPES.PILLAR:
          this.renderPillar(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options);
          break;
      }

      // 4. Corallite Polyps (Cups / Dots)
      if (this.polyps.length > 0 && options.showPolyps !== false) {
        ctx.save();
        ctx.fillStyle = polypInk;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth * 0.6;
        for (const p of this.polyps) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, TWO_PI);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore(); // Exit sway transform
      ctx.restore(); // Exit root translate
    }

    renderBranching(ctx, strokeColor, lineWidth, baseWash, shadowWash, polypInk, options) {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const b of this.branches) {
        // Shaded branch stroke
        ctx.beginPath();
        ctx.moveTo(b.x0, b.y0);
        ctx.quadraticCurveTo(b.cx, b.cy, b.x1, b.y1);

        ctx.lineWidth = b.width0;
        ctx.strokeStyle = baseWash;
        ctx.stroke();

        // Outline contour
        ctx.lineWidth = Math.max(0.8, lineWidth * (1 - b.depth * 0.18));
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
      }
      ctx.restore();
    }

    renderBrain(ctx, strokeColor, lineWidth, baseWash, shadowWash, options) {
      if (!this.domePts || this.domePts.length < 3) return;

      // 1. Dome Silhouette & Base Wash
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.domePts[0].x, this.domePts[0].y);
      for (let i = 1; i < this.domePts.length; i++) {
        ctx.lineTo(this.domePts[i].x, this.domePts[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = baseWash;
      ctx.fill();

      // Clip to dome for internal meander valleys
      ctx.save();
      ctx.clip();

      // Shadow on lower-right
      ctx.beginPath();
      ctx.ellipse(this.spread * 0.15, -this.height * 0.25, this.spread * 0.45, this.height * 0.35, 0.2, 0, TWO_PI);
      ctx.fillStyle = shadowWash;
      ctx.fill();

      // 2. Meandering Gyri / Sulci lines
      if (options.showMeanders !== false) {
        ctx.strokeStyle = strokeColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const line of this.meanders) {
          ctx.beginPath();
          ctx.lineWidth = Math.max(0.6, lineWidth * 0.85);
          ctx.moveTo(line[0].x, line[0].y);
          for (let i = 1; i < line.length; i++) {
            ctx.lineTo(line[i].x, line[i].y);
          }
          ctx.stroke();
        }
      }

      ctx.restore(); // Exit clip

      // Outer boundary stroke
      ctx.beginPath();
      ctx.moveTo(this.domePts[0].x, this.domePts[0].y);
      for (let i = 1; i < this.domePts.length; i++) {
        ctx.lineTo(this.domePts[i].x, this.domePts[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth * 1.1;
      ctx.stroke();

      ctx.restore();
    }

    renderTable(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options) {
      ctx.save();

      // 1. Main Trunk Holdfast
      ctx.beginPath();
      ctx.moveTo(-this.baseW * 0.6, 0);
      ctx.lineTo(-this.baseW * 0.35, -this.height * 0.75);
      ctx.lineTo(this.baseW * 0.35, -this.height * 0.75);
      ctx.lineTo(this.baseW * 0.6, 0);
      ctx.closePath();
      ctx.fillStyle = shadowWash;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // 2. Tiered Horizontal Plates
      for (const p of this.plates) {
        // Struts beneath plate
        if (p.struts) {
          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth * 0.75;
          ctx.globalAlpha = 0.55;
          for (const s of p.struts) {
            ctx.beginPath();
            ctx.moveTo(s.x0, s.y0);
            ctx.lineTo(s.x1, s.y1);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Plate disc fill
        ctx.beginPath();
        ctx.moveTo(p.rimPts[0].x, p.rimPts[0].y);
        for (let i = 1; i < p.rimPts.length; i++) {
          ctx.lineTo(p.rimPts[i].x, p.rimPts[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = baseWash;
        ctx.fill();

        // Rim highlight & contour
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      ctx.restore();
    }

    renderFan(ctx, strokeColor, lineWidth, baseWash, shadowWash, options) {
      if (!this.meshLattice || !this.meshLattice.ribs) return;
      ctx.save();

      // Stem
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -this.height * 0.22);
      ctx.lineWidth = this.baseW * 0.65;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();

      // Reticulated Ribs
      ctx.strokeStyle = strokeColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const rib of this.meshLattice.ribs) {
        ctx.beginPath();
        ctx.lineWidth = Math.max(0.6, lineWidth * 0.75);
        ctx.moveTo(rib[0].x, rib[0].y);
        for (let i = 1; i < rib.length; i++) {
          ctx.lineTo(rib[i].x, rib[i].y);
        }
        ctx.stroke();
      }

      // Horizontal Lattice Rungs
      for (const rung of this.meshLattice.rungs) {
        ctx.beginPath();
        ctx.lineWidth = Math.max(0.4, lineWidth * 0.5);
        ctx.globalAlpha = 0.65;
        ctx.moveTo(rung[0].x, rung[0].y);
        for (let i = 1; i < rung.length; i++) {
          ctx.lineTo(rung[i].x, rung[i].y);
        }
        ctx.stroke();
      }

      ctx.restore();
    }

    renderFoliose(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options) {
      ctx.save();

      for (const r of this.ruffles) {
        // Ruffle Petal Plate
        ctx.beginPath();
        ctx.moveTo(r.petalPts[0].x, r.petalPts[0].y);
        for (let i = 1; i < r.petalPts.length; i++) {
          ctx.lineTo(r.petalPts[i].x, r.petalPts[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = baseWash;
        ctx.fill();

        // Septa striations radiating outward
        if (r.striations && options.showStriations !== false) {
          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(0.4, lineWidth * 0.5);
          ctx.globalAlpha = 0.45;
          for (const s of r.striations) {
            ctx.beginPath();
            ctx.moveTo(s.x0, s.y0);
            ctx.lineTo(s.x1, s.y1);
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth * 1.05;
        ctx.stroke();
      }

      ctx.restore();
    }

    renderPillar(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options) {
      ctx.save();

      for (const p of this.pillars) {
        const topY = -p.height;
        const rad = p.width * 0.5;

        // Pillar column body
        ctx.beginPath();
        ctx.moveTo(p.x - rad, 0);
        ctx.lineTo(p.x - rad, topY + rad);
        ctx.arc(p.x, topY + rad, rad, PI, 0);
        ctx.lineTo(p.x + rad, 0);
        ctx.closePath();

        ctx.fillStyle = baseWash;
        ctx.fill();

        // Grooves
        if (p.grooves && options.showGrooves !== false) {
          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(0.5, lineWidth * 0.65);
          ctx.globalAlpha = 0.5;
          for (const g of p.grooves) {
            ctx.beginPath();
            ctx.moveTo(g.x0, g.y0);
            ctx.lineTo(g.x1, g.y1);
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 4. Composite Multi-Coral Colony
  // -----------------------------------------------------------------
  class CoralColony {
    constructor(x, y, seed, options = {}) {
      this.x = x;
      this.y = y;
      this.seed = seed || `Colony_${Math.floor(rand() * 99999)}`;
      set_seed(this.seed);

      let profile = CORAL_CATALOG.find(c => c.id === options.coralId || c.binomen === this.seed || c.common === this.seed);
      if (!profile) {
        const parsedArch = options.archetype !== undefined ? options.archetype : choice([0, 1, 2, 3, 4, 5]);
        profile = choice(CORAL_CATALOG.filter(c => c.archetype === parsedArch)) || CORAL_CATALOG[0];
      }

      this.profile = profile;
      this.archetype = profile.archetype;
      this.scale = (options.scale || rndtri(0.75, 1.0, 1.25)) * (options.scaleMult || 1.0);

      this.corals = [];
      const numCorals = options.count !== undefined ? options.count : (options.single === true ? 1 : Math.floor(rnd(2, 4)));

      if (numCorals <= 1) {
        // Single specimen
        this.corals.push(new CoralSpecimen(0, 0, `${this.seed}_single`, {
          archetype: this.archetype,
          morph: options.morph !== undefined ? options.morph : profile.morph,
          height: (options.height || profile.height) * this.scale,
          baseW: (options.baseW || profile.baseW) * this.scale,
          spread: (options.spread || profile.spread) * this.scale,
          roughness: options.roughness !== undefined ? options.roughness : profile.roughness
        }));
      } else {
        // Natural clustered colony
        const mainH = (options.height || profile.height) * this.scale;
        const mainW = (options.spread || profile.spread) * this.scale;

        this.corals.push(new CoralSpecimen(0, 0, `${this.seed}_main`, {
          archetype: this.archetype,
          morph: options.morph !== undefined ? options.morph : profile.morph,
          height: mainH,
          baseW: (options.baseW || profile.baseW) * this.scale,
          spread: mainW,
          roughness: profile.roughness
        }));

        for (let i = 1; i < numCorals; i++) {
          const u = (i / (numCorals - 1) - 0.5) * 2;
          const satScale = rndtri(0.48, 0.70, 0.88);
          const offX = u * mainW * 0.42 + rndtri(-10, 0, 10);
          const offY = rndtri(-8, 0, 8);

          this.corals.push(new CoralSpecimen(offX, offY, `${this.seed}_sat_${i}`, {
            archetype: this.archetype,
            morph: choice([0, 1, 2, 3, 4, 5, 6]),
            height: mainH * satScale,
            baseW: profile.baseW * satScale,
            spread: mainW * satScale,
            roughness: profile.roughness
          }));
        }

        this.corals.sort((a, b) => a.y - b.y);
      }
    }

    update(dt, waterFlow = 0) {
      for (let i = 0; i < this.corals.length; i++) {
        this.corals[i].update(dt, waterFlow);
      }
    }

    render(ctx, options = {}) {
      ctx.save();
      ctx.translate(this.x, this.y);
      for (let i = 0; i < this.corals.length; i++) {
        this.corals[i].render(ctx, options);
      }
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 5. Coral Reef Ecosystem Manager (Barrier / Lakebed Reef)
  // -----------------------------------------------------------------
  class CoralReef {
    constructor(options = {}) {
      this.colonies = [];
      this.seed = options.seed || 'Lakebed Coral Reef';
      this.init(options.width || 1200, options.height || 800, options.count || 6);
    }

    init(width, height, count = 6) {
      set_seed(this.seed);
      this.colonies = [];
      this.width = width;
      this.height = height;

      const margin = 80;
      const step = (width - margin * 2) / Math.max(1, count - 1);
      const archetypesPool = [0, 1, 2, 3, 4, 5];

      for (let i = 0; i < count; i++) {
        const baseX = margin + i * step + rndtri(-40, 0, 40);
        const baseY = height - rndtri(8, 20, 36);
        const colSeed = `${this.seed}_reef_${i}`;
        const arch = archetypesPool[i % archetypesPool.length];
        const species = choice(CORAL_CATALOG.filter(c => c.archetype === arch)) || CORAL_CATALOG[0];

        const colony = new CoralColony(baseX, baseY, colSeed, {
          coralId: species.id,
          archetype: arch,
          scale: rndtri(0.65, 0.90, 1.2),
          count: arch === CORAL_ARCHETYPES.BRANCHING || arch === CORAL_ARCHETYPES.PILLAR ? Math.floor(rnd(2, 4)) : 1
        });
        this.colonies.push(colony);
      }

      this.colonies.sort((a, b) => a.y - b.y);
    }

    resize(width, height) {
      this.init(width, height, this.colonies.length || 6);
    }

    update(dt, waterFlow = 0) {
      for (let i = 0; i < this.colonies.length; i++) {
        this.colonies[i].update(dt, waterFlow);
      }
    }

    render(ctx, options = {}) {
      for (let i = 0; i < this.colonies.length; i++) {
        this.colonies[i].render(ctx, options);
      }
    }
  }

  // -----------------------------------------------------------------
  // 6. Public Module API
  // -----------------------------------------------------------------
  return {
    set_seed,
    CORAL_ARCHETYPES,
    CORAL_MORPHS,
    CORAL_CATALOG,
    catalog: CORAL_CATALOG,
    getCoralById,
    getCoralList,
    CoralSpecimen,
    CoralColony,
    CoralReef,
    createReef: function (options) {
      return new CoralReef(options);
    }
  };
});
