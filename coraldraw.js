/**
 * coraldraw.js - Procedural Aquatic Coral & Reef Engine (Volumetric 3D Edition)
 *
 * Implements standard marine biology coral growth forms (English et al., 1997):
 * - Acropora: Branching (ACB), Tabulate (ACT), Digitate (ACD), Submassive (ACS), Encrusting (ACE)
 * - Non-Acropora: Massive (CM), Mushroom (CMR - Fungia), Foliose (CF), Branching (CB),
 *   Encrusting (CE), Tubipora (CTU), Millepora (CME)
 *
 * VOLUMETRIC 3D RENDERING:
 * - 3D cylindrical hulls with lateral edge tapering
 * - Cylindrical cross-section latitude contour ribs (wrapping arcs conveying round volume)
 * - Directional chiaroscuro lighting (core shadow, reflected light, crest highlight)
 * - Axial and radial corallite calices protruding in 3D perspective
 * - Convex Fungia mushroom septa discs with central stomodaeum mouth
 * - Tiered cantilevered plates with 3D rim bevels and deep under-plate shadows
 *
 * 100% STRICTLY MONOCHROME: Pure black ink, pure white, and neutral grays only.
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
  // 2. Coral Growth Forms (English et al., 1997 & Marine Biology)
  // -----------------------------------------------------------------
  const CORAL_ARCHETYPES = {
    BRANCHING: 0,   // Bercabang (Branching ACB / CB - Acropora formosa, Staghorn)
    MASSIVE: 1,     // Masif / Bongkahan (Massive CM / ACS - Platygyra, Favia)
    TABULAR: 2,     // Meja / Pinggan (Tabulate ACT - Acropora hyacinthus)
    ENCRUSTING: 3,  // Berkerak Lapisan Substrat (Encrusting ACE / CE - Leptoseris)
    FOLIOSE: 4,     // Berdaun Lembaran (Foliose CF - Montipora, Turbinaria)
    MUSHROOM: 5,    // Jamur Soliter (Mushroom CMR - Fungia sp.)
    DIGITATE: 6     // Menjari & Tabung Pipa (Digitate ACD / Pillar / CTU - Acropora humilis)
  };

  const CORAL_MORPHS = {
    STANDARD: 0,    // Standar botani
    SPREADING: 1,   // Melebar horizontal
    TALL_SPIRE: 2,  // Menjulang tinggi vertikal
    DENSE_BUSH: 3,  // Rumpun lebat rapat
    CURVED_FLOW: 4, // Melengkung mengikuti arus
    TIERED_STEP: 5, // Bertingkat tangga trap
    CLEFT_SPLIT: 6  // Patahan terbelah dua
  };

  const CORAL_CATALOG = [
    // --- 1. Branching Corals (Acropora Branching ACB & Coral Branching CB) ---
    { id: 'acropora_formosa', code: 'ACB', common: 'Karang Rusa Ranting', binomen: 'Acropora formosa', archetype: 0, height: 210, baseW: 24, spread: 160, roughness: 0.16, desc: 'Bercabang silindris anggun dengan koralit aksial di tiap ujung dan koralit radial timbul bervolume.' },
    { id: 'acropora_cervicornis', code: 'ACB', common: 'Karang Tanduk Rusa Karibia', binomen: 'Acropora cervicornis', archetype: 0, height: 195, baseW: 22, spread: 150, roughness: 0.15, desc: 'Ranting silinder tegak dengan cincin kontur volumetrik melingkar dan percabangan dikotomi alami.' },
    { id: 'seriatopora_hystrix', code: 'CB', common: 'Karang Sarang Burung', binomen: 'Seriatopora hystrix', archetype: 0, height: 160, baseW: 16, spread: 135, roughness: 0.14, desc: 'Ranting jarum ramping dengan kelopak koralit radial berderet rapi di sepanjang batang silindris.' },
    { id: 'stylophora_pistillata', code: 'CB', common: 'Karang Gada Berbuku', binomen: 'Stylophora pistillata', archetype: 0, height: 175, baseW: 26, spread: 130, roughness: 0.18, desc: 'Cabang silindris tumpul berbobot masif dengan kontur lengkung melingkar tiga dimensi.' },

    // --- 2. Massive Corals (Coral Massive CM & Acropora Submassive ACS) ---
    { id: 'platygyra_lamellina', code: 'CM', common: 'Karang Otak Labirin Masif', binomen: 'Platygyra lamellina', archetype: 1, height: 150, baseW: 180, spread: 180, roughness: 0.28, desc: 'Bongkahan kubah masif kuat ombak dengan alur dinding labirin berlekuk dalam dan bayangan chiaroscuro tiga dimensi.' },
    { id: 'diploria_labyrinth', code: 'CM', common: 'Karang Otak Lembah Ganda', binomen: 'Diploria labyrinthiformis', archetype: 1, height: 160, baseW: 190, spread: 190, roughness: 0.25, desc: 'Kubah batu terumbu danau berstruktur alur ganda dengan tekstur kontur elevasi cincin volumetrik.' },
    { id: 'favia_speciosa', code: 'CM', common: 'Karang Bongkahan Sarang Lebah', binomen: 'Favia speciosa', archetype: 1, height: 135, baseW: 165, spread: 165, roughness: 0.22, desc: 'Koloni heksagonal rapat bersusun beraturan dengan kaliks koralit mangkuk timbul berkedalaman.' },
    { id: 'acropora_palifera_sub', code: 'ACS', common: 'Karang Submasif Bilah', binomen: 'Acropora palifera', archetype: 1, height: 170, baseW: 160, spread: 170, roughness: 0.24, desc: 'Bentuk transisi antara bercabang dan masif membentuk kolom lempeng vertikal bervolume tebal.' },

    // --- 3. Tabulate Corals (Acropora Tabulate ACT) ---
    { id: 'acropora_hyacinthus', code: 'ACT', common: 'Karang Meja Piring Meja', binomen: 'Acropora hyacinthus', archetype: 2, height: 180, baseW: 28, spread: 230, roughness: 0.15, desc: 'Piringan horizontal datar bertingkat dengan tepian bibir berketebalan 3D dan penopang batang tengah berarsir gelap.' },
    { id: 'acropora_cytherea', code: 'ACT', common: 'Karang Meja Kanopi Lebar', binomen: 'Acropora cytherea', archetype: 2, height: 190, baseW: 30, spread: 250, roughness: 0.14, desc: 'Lempeng kanopi lebar melebar horizontal dengan pola radial jala koralit di permukaan atas piringan.' },
    { id: 'pachyseris_speciosa', code: 'ACT', common: 'Karang Meja Trap Berundak', binomen: 'Pachyseris speciosa', archetype: 2, height: 155, baseW: 24, spread: 200, roughness: 0.18, desc: 'Lempeng rak bertrap dengan garis-garis punggungan konsentris sejajar berdimensi tebal.' },

    // --- 4. Encrusting Corals (Acropora Encrusting ACE & Coral Encrusting CE) ---
    { id: 'leptoseris_incrustans', code: 'CE', common: 'Karang Kerak Lapisan Batu', binomen: 'Leptoseris incrustans', archetype: 3, height: 75, baseW: 200, spread: 210, roughness: 0.26, desc: 'Tumbuh melapisi substrat dasar kolam dengan tepi bevel berketebalan dan koralit timbul kaldera.' },
    { id: 'acropora_palifera_enc', code: 'ACE', common: 'Karang Kerak Acropora Dasar', binomen: 'Acropora palifera f. crust', archetype: 3, height: 85, baseW: 220, spread: 230, roughness: 0.24, desc: 'Lapisan kerak kalsit tebal bervolume dengan bintil-bintil koralit aksial dan radial menonjol.' },
    { id: 'montipora_crust', code: 'CE', common: 'Karang Kerak Beludru Pori', binomen: 'Montipora tuberculosa', archetype: 3, height: 80, baseW: 190, spread: 200, roughness: 0.28, desc: 'Lapisan koralit mikro berarsir padat dengan tepi mengalun mengikuti kontur bebatuan danau.' },

    // --- 5. Foliose Corals (Coral Foliose CF) ---
    { id: 'montipora_capricornis', code: 'CF', common: 'Karang Daun Selada Spiral', binomen: 'Montipora capricornis', archetype: 4, height: 170, baseW: 32, spread: 190, roughness: 0.20, desc: 'Lembaran kelopak melingkar berjenjang spiral ke atas dengan ketebalan pinggir daun dan bayangan tumpang-tindih.' },
    { id: 'turbinaria_mesenterina', code: 'CF', common: 'Karang Daun Selada Renda', binomen: 'Turbinaria mesenterina', archetype: 4, height: 165, baseW: 35, spread: 185, roughness: 0.22, desc: 'Kelopak cawan bergelombang lipat-melipat berdimensi mangkuk dengan alur sekat septa memusat.' },
    { id: 'pectinia_lactuca', code: 'CF', common: 'Karang Mawar Kelopak Berlekuk', binomen: 'Pectinia lactuca', archetype: 4, height: 155, baseW: 30, spread: 175, roughness: 0.25, desc: 'Piramida kelopak tipis berlekuk tegak dengan sayatan kontur chiaroscuro volumetrik tajam.' },

    // --- 6. Mushroom Corals (Coral Mushroom CMR - Soliter Fungia) ---
    { id: 'fungia_scutaria', code: 'CMR', common: 'Karang Jamur Piringan Soliter', binomen: 'Fungia scutaria', archetype: 5, height: 95, baseW: 170, spread: 170, roughness: 0.18, desc: 'Polip soliter berbentuk piringan jamur kubah cembung dengan celah mulut stomodaeum tengah dan bilah septa radial melengkung 3D.' },
    { id: 'fungia_fungites', code: 'CMR', common: 'Karang Jamur Gerigi Tajam', binomen: 'Fungia fungites', archetype: 5, height: 105, baseW: 185, spread: 185, roughness: 0.22, desc: 'Cawan jamur soliter dengan septa bilah bergerigi tajam memancar dari rongga mulut memanjang.' },
    { id: 'cycloseris_costulata', code: 'CMR', common: 'Karang Jamur Cawan Mini', binomen: 'Cycloseris costulata', archetype: 5, height: 80, baseW: 140, spread: 140, roughness: 0.15, desc: 'Karang jamur bulat simetris dengan lengkungan cembung penuh dan punggung septa berarsir halus.' },

    // --- 7. Digitate & Columnar Corals (Acropora Digitate ACD & Tubipora CTU) ---
    { id: 'acropora_humilis', code: 'ACD', common: 'Karang Menjari Jari Tangan', binomen: 'Acropora humilis', archetype: 6, height: 185, baseW: 90, spread: 150, roughness: 0.20, desc: 'Cabang silindris gemuk tegak menjari seperti jari-jemari tangan dengan kubah koralit aksial bulat besar di puncak.' },
    { id: 'dendrogyra_cylindrus', code: 'ACD', common: 'Karang Pilar Tiang Katedral', binomen: 'Dendrogyra cylindrus', archetype: 6, height: 230, baseW: 100, spread: 155, roughness: 0.22, desc: 'Pilar silinder tegak tebal bervolume penuh dengan alur vertikal dan cincin silinder melingkar.' },
    { id: 'tubipora_musica', code: 'CTU', common: 'Karang Pipa Organ Berongga', binomen: 'Tubipora musica', archetype: 6, height: 190, baseW: 85, spread: 140, roughness: 0.18, desc: 'Deretan tabung silinder paralel berjenjang seperti pipa organ katedral dengan sekat pelat horizontal.' },
    { id: 'millepora_alcicornis', code: 'CME', common: 'Karang Api Bilah Halus', binomen: 'Millepora alcicornis', archetype: 6, height: 180, baseW: 75, spread: 145, roughness: 0.16, desc: 'Lempeng bilah silindris vertikal berpori halus tempat keluarnya bulu penyengat halus.' }
  ];

  function getCoralById(id) {
    return CORAL_CATALOG.find(c => c.id === id) || CORAL_CATALOG[0];
  }

  function getCoralList() {
    return CORAL_CATALOG.slice();
  }

  // -----------------------------------------------------------------
  // 3. Volumetric Single Coral Specimen
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
      this.height = (config.height || rndtri(140, 185, 230)) * this.scale;
      this.baseW = (config.baseW || rndtri(18, 28, 42)) * this.scale;
      this.spread = (config.spread || rndtri(130, 175, 220)) * this.scale;
      this.roughness = config.roughness !== undefined ? config.roughness : rndtri(0.12, 0.20, 0.32);

      // Light vector (top-left sumi-e ambient light)
      this.lightAngle = rndtri(-PI * 0.85, -PI * 0.65, -PI * 0.45);
      this.lightVec = { x: Math.cos(this.lightAngle), y: Math.sin(this.lightAngle) };

      // Hydrodynamic current phase
      this.swayPhase = rnd(0, TWO_PI);
      this.swayAmp = (this.archetype === CORAL_ARCHETYPES.BRANCHING ? 6 : 2) * this.scale;
      this.currentSwayX = 0;

      // Internal structures
      this.volumetricLimbs = [];
      this.mushroomDisc = null;
      this.massiveDome = null;
      this.tablePlates = [];
      this.folioseRuffles = [];
      this.folioseStalk = null;
      this.encrustingSlab = null;
      this.columns = [];
      this.holdfastPts = [];

      this.initHoldfast();
      this.buildGeometry();
    }

    initHoldfast() {
      this.holdfastPts = [];
      const footW = this.baseW * (this.archetype === CORAL_ARCHETYPES.ENCRUSTING ? 1.2 : 1.6);
      const footH = this.baseW * 0.45;
      const numPts = 18;
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
          this.buildVolumetricBranching();
          break;
        case CORAL_ARCHETYPES.MASSIVE:
          this.buildVolumetricMassive();
          break;
        case CORAL_ARCHETYPES.TABULAR:
          this.buildVolumetricTable();
          break;
        case CORAL_ARCHETYPES.ENCRUSTING:
          this.buildVolumetricEncrusting();
          break;
        case CORAL_ARCHETYPES.FOLIOSE:
          this.buildVolumetricFoliose();
          break;
        case CORAL_ARCHETYPES.MUSHROOM:
          this.buildVolumetricMushroom();
          break;
        case CORAL_ARCHETYPES.DIGITATE:
          this.buildVolumetricDigitate();
          break;
        default:
          this.buildVolumetricBranching();
      }
    }

    // --- 3.1 Volumetric Branching (Cylindrical limbs with cross-section rings) ---
    buildVolumetricBranching() {
      this.volumetricLimbs = [];
      const startW = this.baseW;
      const rootLen = this.height * 0.38;

      const queue = [
        { x: 0, y: 0, angle: -HALF_PI, length: rootLen, width0: startW, width1: startW * 0.72, depth: 0 }
      ];

      const maxDepth = this.morph === CORAL_MORPHS.DENSE_BUSH ? 4 : 3;

      while (queue.length > 0) {
        const seg = queue.shift();
        const endX = seg.x + Math.cos(seg.angle) * seg.length;
        const endY = seg.y + Math.sin(seg.angle) * seg.length;

        const midX = (seg.x + endX) * 0.5 + rndtri(-6, 0, 6);
        const midY = (seg.y + endY) * 0.5 - rndtri(2, 6, 10);

        // Discretize limb into sample slices for true 3D cylinder contouring
        const numSlices = 7;
        const slices = [];
        for (let s = 0; s <= numSlices; s++) {
          const t = s / numSlices;
          // Quadratic bezier interpolation
          const it = 1 - t;
          const px = it * it * seg.x + 2 * it * t * midX + t * t * endX;
          const py = it * it * seg.y + 2 * it * t * midY + t * t * endY;
          // Tangent angle
          const tx = 2 * it * (midX - seg.x) + 2 * t * (endX - midX);
          const ty = 2 * it * (midY - seg.y) + 2 * t * (endY - midY);
          const normAngle = Math.atan2(ty, tx) + HALF_PI;

          const w = lerp(seg.width0, seg.width1, t) * 0.5;
          const leftX = px + Math.cos(normAngle) * w;
          const leftY = py + Math.sin(normAngle) * w;
          const rightX = px - Math.cos(normAngle) * w;
          const rightY = py - Math.sin(normAngle) * w;

          slices.push({ px, py, leftX, leftY, rightX, rightY, w, normAngle, t });
        }

        // Radial corallite calices along left and right flanks
        const calices = [];
        for (let i = 1; i < slices.length - 1; i++) {
          if (rand() < 0.6) {
            const sl = slices[i];
            const isLeft = rand() < 0.5;
            const cx = isLeft ? sl.leftX : sl.rightX;
            const cy = isLeft ? sl.leftY : sl.rightY;
            calices.push({
              x: cx, y: cy,
              r: rndtri(2.5, 3.8, 5.0),
              angle: sl.normAngle + (isLeft ? 0 : PI)
            });
          }
        }

        this.volumetricLimbs.push({
          slices,
          calices,
          depth: seg.depth,
          isTip: seg.depth === maxDepth || rand() < 0.2
        });

        if (seg.depth < maxDepth) {
          const numChildren = (seg.depth === 0 && this.morph === CORAL_MORPHS.CLEFT_SPLIT) ? 2 : (rand() < 0.45 ? 3 : 2);
          const spreadAng = (this.morph === CORAL_MORPHS.SPREADING ? 0.68 : 0.45);

          for (let c = 0; c < numChildren; c++) {
            const frac = numChildren === 1 ? 0 : (c / (numChildren - 1) - 0.5) * 2;
            const childAngle = seg.angle + frac * spreadAng + rndtri(-0.15, 0, 0.15);
            const childLen = seg.length * rndtri(0.65, 0.76, 0.86);
            const childW0 = seg.width1;
            const childW1 = Math.max(3.0, childW0 * 0.68);

            queue.push({
              x: endX, y: endY,
              angle: childAngle,
              length: childLen,
              width0: childW0,
              width1: childW1,
              depth: seg.depth + 1
            });
          }
        }
      }
    }

    // --- 3.2 Volumetric Massive (Spherical boulder dome with relief crevices) ---
    buildVolumetricMassive() {
      const domeRx = this.spread * 0.52;
      const domeRy = this.height * 0.70;
      const centerY = -domeRy * 0.90;

      // 3D dome boundary
      const boundaryPts = [];
      const numDome = 48;
      for (let i = 0; i <= numDome; i++) {
        const theta = PI + (i / numDome) * PI;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const baseR = (domeRx * domeRy) / Math.hypot(domeRy * cosT, domeRx * sinT);
        const perturb = 1.0 + rndtri(-0.05, 0, 0.05);
        boundaryPts.push({
          x: cosT * baseR * perturb,
          y: centerY + sinT * baseR * perturb
        });
      }

      // Volumetric concentric latitude rings across dome
      const latRings = [];
      const numRings = 7;
      for (let r = 1; r < numRings; r++) {
        const frac = r / numRings;
        const ringY = centerY + frac * domeRy * 0.85;
        const ringRx = domeRx * Math.sqrt(Math.max(0.1, 1 - Math.pow((ringY - centerY) / domeRy, 2)));
        const ringRy = ringRx * 0.32;

        const pts = [];
        const steps = 32;
        for (let s = 0; s <= steps; s++) {
          const a = PI + (s / steps) * PI;
          pts.push({
            x: Math.cos(a) * ringRx,
            y: ringY + Math.sin(a) * ringRy + rndtri(-2, 0, 2)
          });
        }
        latRings.push(pts);
      }

      // Deep convoluted meander trenches (brain/platygyra ridges)
      const trenches = [];
      const numTrenches = 12;
      for (let t = 0; t < numTrenches; t++) {
        const frac = (t + 1) / (numTrenches + 1);
        const ty = centerY + lerp(-domeRy * 0.7, domeRy * 0.75, frac);
        const spanX = domeRx * Math.sqrt(Math.max(0.05, 1 - Math.pow((ty - centerY) / domeRy, 2))) * 0.88;

        const pts = [];
        const steps = 24;
        for (let s = 0; s <= steps; s++) {
          const u = (s / steps - 0.5) * 2;
          const x = u * spanX;
          // Sinusoidal meander convolution
          const meanderY = ty + Math.sin(u * PI * 4 + t * 1.5) * 6.5 + Math.cos(u * PI * 8) * 3;
          pts.push({ x, y: meanderY });
        }
        trenches.push(pts);
      }

      this.massiveDome = {
        boundaryPts,
        latRings,
        trenches,
        centerY,
        domeRx,
        domeRy
      };
    }

    // --- 3.3 Volumetric Tabular (3D Cantilevered Plate with Thickness & Rim Bevel) ---
    buildVolumetricTable() {
      this.tablePlates = [];
      const numTiers = this.morph === CORAL_MORPHS.TIERED_STEP ? 3 : 2;
      const topW = this.spread * 0.55;

      for (let t = 0; t < numTiers; t++) {
        const frac = t / numTiers;
        const plateY = -this.height * (0.50 + frac * 0.45);
        const plateRx = topW * (0.70 + frac * 0.40);
        const plateRy = plateRx * 0.30;
        const thickness = rndtri(8, 12, 16);
        const shiftX = rndtri(-10, 0, 10);

        // Top rim points
        const topPts = [];
        const botPts = [];
        const numRim = 36;
        for (let i = 0; i <= numRim; i++) {
          const th = (i / numRim) * TWO_PI;
          const rMod = 1.0 + Math.sin(th * 14) * 0.035 + rndtri(-0.02, 0, 0.02);
          const px = shiftX + Math.cos(th) * plateRx * rMod;
          const py = plateY + Math.sin(th) * plateRy * rMod;
          topPts.push({ x: px, y: py });
          botPts.push({ x: px, y: py + thickness });
        }

        // Radial corallite septa rays across top plate
        const radialRays = [];
        const numRays = 20;
        for (let r = 0; r < numRays; r++) {
          const a = (r / numRays) * TWO_PI;
          radialRays.push({
            x0: shiftX, y0: plateY,
            x1: shiftX + Math.cos(a) * plateRx * 0.88,
            y1: plateY + Math.sin(a) * plateRy * 0.88
          });
        }

        this.tablePlates.push({
          plateY,
          thickness,
          shiftX,
          topPts,
          botPts,
          radialRays
        });
      }

      this.tablePlates.sort((a, b) => a.plateY - b.plateY);
    }

    // --- 3.4 Volumetric Encrusting (3D Relief Slab on substrate) ---
    buildVolumetricEncrusting() {
      const slabW = this.spread * 0.55;
      const slabH = this.height * 0.40;
      const thickness = rndtri(14, 20, 26);

      const topPts = [];
      const botPts = [];
      const numPts = 32;
      for (let i = 0; i <= numPts; i++) {
        const u = (i / numPts - 0.5) * 2;
        const x = u * slabW;
        const humpY = -slabH * (1 - Math.pow(u, 2) * 0.85) + rndtri(-3, 0, 3);
        topPts.push({ x, y: humpY });
        botPts.push({ x, y: humpY + thickness });
      }

      // Raised caldera corallite mounds
      const calderas = [];
      const numCalderas = 10;
      for (let c = 0; c < numCalderas; c++) {
        const cx = rndtri(-slabW * 0.75, 0, slabW * 0.75);
        const cy = -slabH * rndtri(0.2, 0.5, 0.85);
        calderas.push({
          x: cx, y: cy,
          rx: rndtri(6, 9, 13),
          ry: rndtri(3, 5, 7)
        });
      }

      this.encrustingSlab = { topPts, botPts, calderas, thickness };
    }

    // --- 3.5 Volumetric Foliose (Layered Cabbage / Scroll Leaves with Organic Growth Folds & Veins) ---
    buildVolumetricFoliose() {
      this.folioseRuffles = [];
      const numCups = this.morph === CORAL_MORPHS.DENSE_BUSH ? 6 : (this.morph === CORAL_MORPHS.SPREADING ? 4 : 5);

      // Central stem / stalk column supporting the foliose tiers from holdfast
      const stalkTopY = -this.height * 0.38;
      const stalkBottomY = 0;
      const stalkW = this.baseW * 0.85;
      this.folioseStalk = {
        topY: stalkTopY,
        bottomY: stalkBottomY,
        w: stalkW
      };

      for (let c = 0; c < numCups; c++) {
        const frac = c / (numCups - 1 || 1);
        const cupCenterY = -this.height * (0.26 + frac * 0.64);
        const sizeFactor = this.morph === CORAL_MORPHS.TIERED_STEP
          ? (1.0 - frac * 0.32)
          : (0.82 + Math.sin(frac * PI) * 0.38);
        const cupRx = this.spread * 0.44 * sizeFactor;
        const cupRy = cupRx * 0.38; // 2.5D natural oblique view
        const thickness = 5.0 + (1 - frac) * 2.5;
        const offX = rndtri(-18, 0, 18) + (c % 2 === 0 ? -14 : 14) * (1 - frac * 0.45);

        // 1. Outer ruffled margin contour
        const outerPts = [];
        const innerPts = [];
        const numPts = 64;
        const ruffleFreq = 5.0 + (c % 2);
        const rufflePhase = c * 1.7;

        for (let i = 0; i <= numPts; i++) {
          const th = (i / numPts) * TWO_PI;
          const ruffle = 1.0 + Math.sin(th * ruffleFreq + rufflePhase) * 0.16 + Math.cos(th * 3.0) * 0.06;
          const ox = offX + Math.cos(th) * cupRx * ruffle;
          const oy = cupCenterY + Math.sin(th) * cupRy * ruffle;
          outerPts.push({ x: ox, y: oy });
          innerPts.push({ x: ox, y: oy + thickness });
        }

        // 2. Concentric Growth Folds (garis lipatan konsentris alami daun foliose)
        const growthRings = [];
        const ringFractions = [0.42, 0.68, 0.86];
        for (const rf of ringFractions) {
          const ringPts = [];
          for (let i = 0; i <= 48; i++) {
            const th = (i / 48) * TWO_PI;
            const rRuffle = 1.0 + Math.sin(th * ruffleFreq + rufflePhase) * (0.16 * rf) + Math.cos(th * 3.0) * (0.05 * rf);
            const rx = offX + Math.cos(th) * (cupRx * rf) * rRuffle;
            const ry = cupCenterY + Math.sin(th) * (cupRy * rf) * rRuffle;
            ringPts.push({ x: rx, y: ry });
          }
          growthRings.push(ringPts);
        }

        // 3. Natural Leaf Veins (urat daun / rusuk radial alami foliose)
        const veins = [];
        const numVeins = 14;
        for (let v = 0; v < numVeins; v++) {
          const th = (v / numVeins) * TWO_PI;
          const ruffle = 1.0 + Math.sin(th * ruffleFreq + rufflePhase) * 0.16 + Math.cos(th * 3.0) * 0.06;
          const startR = 0.20;
          const endR = 0.94;
          const x0 = offX + Math.cos(th) * cupRx * startR;
          const y0 = cupCenterY + Math.sin(th) * cupRy * startR;
          // Organic curve towards lobe crest
          const curveAngle = th + 0.14 * Math.sin(v * 2.3);
          const midR = (startR + endR) * 0.52;
          const cx = offX + Math.cos(curveAngle) * cupRx * midR;
          const cy = cupCenterY + Math.sin(curveAngle) * cupRy * midR;
          const x1 = offX + Math.cos(th) * cupRx * endR * ruffle;
          const y1 = cupCenterY + Math.sin(th) * cupRy * endR * ruffle;
          veins.push({ x0, y0, cx, cy, x1, y1 });
        }

        // 4. Subtle Corallite Calice Dots on Leaf Blade
        const pores = [];
        const numPores = 12;
        for (let p = 0; p < numPores; p++) {
          const pTh = rnd(0, TWO_PI);
          const pRad = rnd(0.32, 0.85);
          const pRuffle = 1.0 + Math.sin(pTh * ruffleFreq + rufflePhase) * 0.12;
          pores.push({
            x: offX + Math.cos(pTh) * cupRx * pRad * pRuffle,
            y: cupCenterY + Math.sin(pTh) * cupRy * pRad * pRuffle,
            r: rnd(1.0, 1.6)
          });
        }

        this.folioseRuffles.push({
          y: cupCenterY,
          offX,
          outerPts,
          innerPts,
          growthRings,
          veins,
          pores
        });
      }

      this.folioseRuffles.sort((a, b) => a.y - b.y);
    }

    // --- 3.6 Volumetric Mushroom (Convex Fungia Disc with Stomodaeum & Curved Septa) ---
    buildVolumetricMushroom() {
      const discRx = this.spread * 0.52;
      const discRy = discRx * 0.45; // 2.5D perspective ellipse
      const domeHeight = this.height * 0.45;
      const centerY = -domeHeight;

      // Outer rim points of mushroom disc
      const rimPts = [];
      const numPts = 64;
      for (let i = 0; i <= numPts; i++) {
        const th = (i / numPts) * TWO_PI;
        // Scalloped undulating margin
        const scallop = 1.0 + Math.sin(th * 24) * 0.03 + rndtri(-0.015, 0, 0.015);
        rimPts.push({
          x: Math.cos(th) * discRx * scallop,
          y: centerY + Math.sin(th) * discRy * scallop
        });
      }

      // Central stomodaeum (elongated mouth slit)
      const mouthW = discRx * 0.28;
      const mouthH = discRy * 0.18;

      // Radial septa blades radiating from stomodaeum to rim
      const septaBlades = [];
      const numBlades = 44;
      for (let b = 0; b < numBlades; b++) {
        const a = (b / numBlades) * TWO_PI;
        // Arched curve rising from mouth over the convex crown to the rim
        const startX = Math.cos(a) * mouthW;
        const startY = centerY + Math.sin(a) * mouthH;
        const endX = Math.cos(a) * discRx;
        const endY = centerY + Math.sin(a) * discRy;

        // Arch crest point
        const midX = (startX + endX) * 0.5;
        const midY = (startY + endY) * 0.5 - domeHeight * 0.35 * Math.sin((b / numBlades) * PI);

        septaBlades.push({ startX, startY, midX, midY, endX, endY });
      }

      this.mushroomDisc = {
        centerY,
        discRx,
        discRy,
        rimPts,
        mouthW,
        mouthH,
        septaBlades
      };
    }

    // --- 3.7 Volumetric Digitate & Columnar (Acropora digitate ACD & Tubipora) ---
    buildVolumetricDigitate() {
      this.columns = [];
      const numCols = Math.floor(rnd(4, 7));
      const colWidth = this.baseW * 0.95;
      const spanW = this.spread * 0.65;

      for (let i = 0; i < numCols; i++) {
        const u = (i / (numCols - 1) - 0.5) * 2;
        const colX = u * spanW * 0.5 + rndtri(-6, 0, 6);
        const colH = this.height * (0.65 + (1 - Math.abs(u) * 0.45) * 0.38 + rndtri(-0.08, 0, 0.08));
        const w = colWidth * rndtri(0.80, 1.05, 1.30);

        // Vertical cylindrical slice rings (latitude arcs)
        const rings = [];
        const numR = 6;
        for (let r = 1; r < numR; r++) {
          const ry = -(colH * (r / numR));
          rings.push({ y: ry, rx: w * 0.5, ry: w * 0.22 });
        }

        // Fluted vertical grooves
        const grooves = [];
        const numG = 3;
        for (let g = 0; g < numG; g++) {
          const gx = colX + (g - 1) * (w * 0.35);
          grooves.push({ x0: gx, y0: 0, x1: gx, y1: -colH });
        }

        this.columns.push({
          x: colX,
          height: colH,
          width: w,
          rings,
          grooves
        });
      }

      this.columns.sort((a, b) => Math.abs(a.x) - Math.abs(b.x));
    }

    update(dt, waterFlow = 0) {
      this.swayPhase += dt * 1.4;
      this.currentSwayX = Math.sin(this.swayPhase) * this.swayAmp + waterFlow * 6;
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
        ? (options.coralWash || 'rgba(255, 255, 255, 0.09)')
        : (options.coralWash || 'rgba(35, 35, 35, 0.09)');

      const shadowWash = isMidnight
        ? 'rgba(0, 0, 0, 0.65)'
        : 'rgba(20, 20, 20, 0.25)';

      const highlightWash = isMidnight
        ? 'rgba(255, 255, 255, 0.20)'
        : 'rgba(255, 255, 255, 0.60)';

      const polypInk = isMidnight
        ? 'rgba(240, 240, 240, 0.80)'
        : 'rgba(15, 15, 15, 0.85)';

      const dropShadowColor = isMidnight
        ? 'rgba(0, 0, 0, 0.50)'
        : 'rgba(0, 0, 0, 0.16)';

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
        ctx.fillStyle = shadowWash;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth * 0.9;
        ctx.stroke();
        ctx.restore();
      }

      // Hydrodynamic current sway transform
      ctx.save();
      const swayX = this.currentSwayX;
      ctx.transform(1, 0, swayX / 600, 1, 0, 0);

      // 3. Render According to Volumetric Archetype
      switch (this.archetype) {
        case CORAL_ARCHETYPES.BRANCHING:
          this.renderVolumetricBranching(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, polypInk, options);
          break;
        case CORAL_ARCHETYPES.MASSIVE:
          this.renderVolumetricMassive(ctx, strokeColor, lineWidth, baseWash, shadowWash, options);
          break;
        case CORAL_ARCHETYPES.TABULAR:
          this.renderVolumetricTable(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options);
          break;
        case CORAL_ARCHETYPES.ENCRUSTING:
          this.renderVolumetricEncrusting(ctx, strokeColor, lineWidth, baseWash, shadowWash, options);
          break;
        case CORAL_ARCHETYPES.FOLIOSE:
          this.renderVolumetricFoliose(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options);
          break;
        case CORAL_ARCHETYPES.MUSHROOM:
          this.renderVolumetricMushroom(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options);
          break;
        case CORAL_ARCHETYPES.DIGITATE:
          this.renderVolumetricDigitate(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, polypInk, options);
          break;
      }

      ctx.restore(); // Exit sway transform
      ctx.restore(); // Exit root translate
    }

    // --- Render Volumetric Branching (3D cylinder hull + latitude wrapping rings) ---
    renderVolumetricBranching(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, polypInk, options) {
      ctx.save();

      for (const b of this.volumetricLimbs) {
        const S = b.slices;
        if (S.length < 2) continue;

        // 1. Fill 3D solid cylinder hull
        ctx.beginPath();
        ctx.moveTo(S[0].leftX, S[0].leftY);
        for (let i = 1; i < S.length; i++) ctx.lineTo(S[i].leftX, S[i].leftY);
        // Hemispherical tip
        const last = S[S.length - 1];
        ctx.arc(last.px, last.py, last.w, last.normAngle, last.normAngle + PI);
        for (let i = S.length - 1; i >= 0; i--) ctx.lineTo(S[i].rightX, S[i].rightY);
        ctx.closePath();

        ctx.fillStyle = baseWash;
        ctx.fill();

        // 2. Chiaroscuro core shadow on right flank
        ctx.save();
        ctx.clip();
        ctx.beginPath();
        for (let i = 0; i < S.length; i++) ctx.lineTo(S[i].px, S[i].py);
        for (let i = S.length - 1; i >= 0; i--) ctx.lineTo(S[i].rightX, S[i].rightY);
        ctx.closePath();
        ctx.fillStyle = shadowWash;
        ctx.fill();

        // Highlight stripe along left/top crest
        ctx.beginPath();
        for (let i = 0; i < S.length; i++) {
          const hx = lerp(S[i].px, S[i].leftX, 0.45);
          const hy = lerp(S[i].py, S[i].leftY, 0.45);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.lineWidth = S[0].w * 0.35;
        ctx.strokeStyle = highlightWash;
        ctx.stroke();

        ctx.restore(); // Exit clip

        // 3. Volumetric Cross-Section Latitude Contours (Wrapping Arcs)
        if (options.showVolumeRings !== false) {
          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(0.45, lineWidth * 0.55);
          ctx.globalAlpha = 0.50;

          for (let i = 1; i < S.length - 1; i++) {
            const sl = S[i];
            ctx.beginPath();
            // Curved arc bowed toward tip to show cylinder roundness
            const midBowX = sl.px - Math.sin(sl.normAngle) * (sl.w * 0.35);
            const midBowY = sl.py + Math.cos(sl.normAngle) * (sl.w * 0.35);
            ctx.moveTo(sl.leftX, sl.leftY);
            ctx.quadraticCurveTo(midBowX, midBowY, sl.rightX, sl.rightY);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 4. Boundary Outlines
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(0.75, lineWidth * (1 - b.depth * 0.15));
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(S[0].leftX, S[0].leftY);
        for (let i = 1; i < S.length; i++) ctx.lineTo(S[i].leftX, S[i].leftY);
        ctx.arc(last.px, last.py, last.w, last.normAngle, last.normAngle + PI);
        for (let i = S.length - 1; i >= 0; i--) ctx.lineTo(S[i].rightX, S[i].rightY);
        ctx.stroke();

        // 5. Axial corallite at the tip + radial corallite cones
        if (b.isTip && options.showPolyps !== false) {
          ctx.beginPath();
          ctx.arc(last.px, last.py, last.w * 0.65, 0, TWO_PI);
          ctx.fillStyle = polypInk;
          ctx.fill();
          ctx.stroke();
        }

        if (b.calices && options.showPolyps !== false) {
          for (const c of b.calices) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, TWO_PI);
            ctx.fillStyle = polypInk;
            ctx.fill();
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    }

    // --- Render Volumetric Massive (Spherical dome + relief crevices) ---
    renderVolumetricMassive(ctx, strokeColor, lineWidth, baseWash, shadowWash, options) {
      const D = this.massiveDome;
      if (!D || !D.boundaryPts) return;

      ctx.save();

      // 1. Solid dome fill
      ctx.beginPath();
      ctx.moveTo(D.boundaryPts[0].x, D.boundaryPts[0].y);
      for (let i = 1; i < D.boundaryPts.length; i++) ctx.lineTo(D.boundaryPts[i].x, D.boundaryPts[i].y);
      ctx.closePath();
      ctx.fillStyle = baseWash;
      ctx.fill();

      // Clip for spherical chiaroscuro & crevices
      ctx.save();
      ctx.clip();

      // 2. Spherical crescent shadow
      ctx.beginPath();
      ctx.ellipse(D.domeRx * 0.22, D.centerY + D.domeRy * 0.35, D.domeRx * 0.75, D.domeRy * 0.55, 0.25, 0, TWO_PI);
      ctx.fillStyle = shadowWash;
      ctx.fill();

      // 3. Volumetric latitude contours
      if (options.showVolumeRings !== false && D.latRings) {
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(0.4, lineWidth * 0.5);
        ctx.globalAlpha = 0.45;
        for (const ring of D.latRings) {
          ctx.beginPath();
          ctx.moveTo(ring[0].x, ring[0].y);
          for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i].x, ring[i].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. Meandering brain sulci ridges
      if (options.showMeanders !== false && D.trenches) {
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const t of D.trenches) {
          ctx.beginPath();
          ctx.lineWidth = Math.max(0.65, lineWidth * 0.85);
          ctx.moveTo(t[0].x, t[0].y);
          for (let i = 1; i < t.length; i++) ctx.lineTo(t[i].x, t[i].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore(); // Exit clip

      // Outer boundary stroke
      ctx.beginPath();
      ctx.moveTo(D.boundaryPts[0].x, D.boundaryPts[0].y);
      for (let i = 1; i < D.boundaryPts.length; i++) ctx.lineTo(D.boundaryPts[i].x, D.boundaryPts[i].y);
      ctx.closePath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth * 1.15;
      ctx.stroke();

      ctx.restore();
    }

    // --- Render Volumetric Tabular (3D Cantilevered Plate with Bevel Rim) ---
    renderVolumetricTable(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options) {
      ctx.save();

      // 1. Sturdy central trunk
      ctx.beginPath();
      ctx.moveTo(-this.baseW * 0.7, 0);
      ctx.lineTo(-this.baseW * 0.4, -this.height * 0.75);
      ctx.lineTo(this.baseW * 0.4, -this.height * 0.75);
      ctx.lineTo(this.baseW * 0.7, 0);
      ctx.closePath();
      ctx.fillStyle = shadowWash;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // 2. Volumetric Plates (Back-to-front layering)
      for (const p of this.tablePlates) {
        // Under-plate deep shadow
        ctx.beginPath();
        ctx.moveTo(p.botPts[0].x, p.botPts[0].y);
        for (let i = 1; i < p.botPts.length; i++) ctx.lineTo(p.botPts[i].x, p.botPts[i].y);
        ctx.closePath();
        ctx.fillStyle = shadowWash;
        ctx.fill();

        // 3D vertical bevel rim band
        for (let i = 0; i < p.topPts.length - 1; i++) {
          ctx.beginPath();
          ctx.moveTo(p.topPts[i].x, p.topPts[i].y);
          ctx.lineTo(p.topPts[i + 1].x, p.topPts[i + 1].y);
          ctx.lineTo(p.botPts[i + 1].x, p.botPts[i + 1].y);
          ctx.lineTo(p.botPts[i].x, p.botPts[i].y);
          ctx.closePath();
          ctx.fillStyle = shadowWash;
          ctx.fill();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth * 0.75;
          ctx.stroke();
        }

        // Top horizontal plate disc
        ctx.beginPath();
        ctx.moveTo(p.topPts[0].x, p.topPts[0].y);
        for (let i = 1; i < p.topPts.length; i++) ctx.lineTo(p.topPts[i].x, p.topPts[i].y);
        ctx.closePath();
        ctx.fillStyle = baseWash;
        ctx.fill();

        // Radial corallite septa rays
        if (p.radialRays && options.showStriations !== false) {
          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(0.4, lineWidth * 0.5);
          ctx.globalAlpha = 0.45;
          for (const r of p.radialRays) {
            ctx.beginPath();
            ctx.moveTo(r.x0, r.y0);
            ctx.lineTo(r.x1, r.y1);
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

    // --- Render Volumetric Encrusting (3D Relief Slab on Substrate) ---
    renderVolumetricEncrusting(ctx, strokeColor, lineWidth, baseWash, shadowWash, options) {
      const S = this.encrustingSlab;
      if (!S) return;

      ctx.save();

      // 1. 3D vertical edge rim
      ctx.beginPath();
      ctx.moveTo(S.topPts[0].x, S.topPts[0].y);
      for (let i = 1; i < S.topPts.length; i++) ctx.lineTo(S.topPts[i].x, S.topPts[i].y);
      for (let i = S.botPts.length - 1; i >= 0; i--) ctx.lineTo(S.botPts[i].x, S.botPts[i].y);
      ctx.closePath();
      ctx.fillStyle = shadowWash;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // 2. Top relief surface
      ctx.beginPath();
      ctx.moveTo(S.topPts[0].x, S.topPts[0].y);
      for (let i = 1; i < S.topPts.length; i++) ctx.lineTo(S.topPts[i].x, S.topPts[i].y);
      ctx.lineTo(S.topPts[S.topPts.length - 1].x, 0);
      ctx.lineTo(S.topPts[0].x, 0);
      ctx.closePath();
      ctx.fillStyle = baseWash;
      ctx.fill();

      // 3. Caldera corallite mounds
      if (S.calderas && options.showPolyps !== false) {
        for (const cal of S.calderas) {
          ctx.beginPath();
          ctx.ellipse(cal.x, cal.y, cal.rx, cal.ry, 0, 0, TWO_PI);
          ctx.fillStyle = shadowWash;
          ctx.fill();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth * 0.8;
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // --- Render Volumetric Foliose (Layered Petals with Natural Leaf Veins & Undulating Growth Folds) ---
    renderVolumetricFoliose(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options) {
      ctx.save();

      // 1. Central supporting stalk column anchored to base
      if (this.folioseStalk) {
        const stk = this.folioseStalk;
        ctx.beginPath();
        ctx.moveTo(-stk.w * 0.5, stk.bottomY);
        ctx.lineTo(-stk.w * 0.36, stk.topY);
        ctx.lineTo(stk.w * 0.36, stk.topY);
        ctx.lineTo(stk.w * 0.5, stk.bottomY);
        ctx.closePath();
        ctx.fillStyle = shadowWash;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth * 0.95;
        ctx.stroke();
      }

      for (const r of this.folioseRuffles) {
        // A. Deep under-leaf cast shadow
        ctx.beginPath();
        ctx.moveTo(r.innerPts[0].x, r.innerPts[0].y);
        for (let i = 1; i < r.innerPts.length; i++) ctx.lineTo(r.innerPts[i].x, r.innerPts[i].y);
        ctx.closePath();
        ctx.fillStyle = shadowWash;
        ctx.fill();

        // B. 3D edge rim bevel (thickness of the ruffled leaf)
        ctx.beginPath();
        ctx.moveTo(r.outerPts[0].x, r.outerPts[0].y);
        for (let i = 1; i < r.outerPts.length; i++) ctx.lineTo(r.outerPts[i].x, r.outerPts[i].y);
        for (let i = r.innerPts.length - 1; i >= 0; i--) ctx.lineTo(r.innerPts[i].x, r.innerPts[i].y);
        ctx.closePath();
        ctx.fillStyle = shadowWash;
        ctx.fill();

        // Under-edge rim line (ordinary ink line)
        ctx.beginPath();
        ctx.moveTo(r.innerPts[0].x, r.innerPts[0].y);
        for (let i = 1; i < r.innerPts.length; i++) ctx.lineTo(r.innerPts[i].x, r.innerPts[i].y);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(0.6, lineWidth * 0.85);
        ctx.stroke();

        // C. Top petal face fill (opaque wash occludes lower tiers behind it)
        ctx.beginPath();
        ctx.moveTo(r.outerPts[0].x, r.outerPts[0].y);
        for (let i = 1; i < r.outerPts.length; i++) ctx.lineTo(r.outerPts[i].x, r.outerPts[i].y);
        ctx.closePath();
        ctx.fillStyle = options.theme === 'midnight' ? '#161616' : '#f7f4ed';
        ctx.fill();
        ctx.fillStyle = baseWash;
        ctx.fill();

        // D. Concentric growth folds (garis alur lipatan konsentris alami daun foliose)
        if (r.growthRings && options.showStriations !== false) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(0.5, lineWidth * 0.70);
          for (const ring of r.growthRings) {
            ctx.beginPath();
            ctx.moveTo(ring[0].x, ring[0].y);
            for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i].x, ring[i].y);
            ctx.closePath();
            ctx.stroke();
          }
        }

        // E. Natural leaf veins (urat daun / rusuk radial alami foliose)
        if (r.veins && options.showStriations !== false) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(0.55, lineWidth * 0.75);
          for (const v of r.veins) {
            ctx.beginPath();
            ctx.moveTo(v.x0, v.y0);
            ctx.quadraticCurveTo(v.cx, v.cy, v.x1, v.y1);
            ctx.stroke();
          }
        }

        // F. Subtle corallite calice pores on leaf blade
        if (r.pores && options.showPolyps !== false) {
          ctx.fillStyle = strokeColor;
          for (const p of r.pores) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, TWO_PI);
            ctx.fill();
          }
        }

        // G. Clean outer rim contour stroke (garis luar daun foliose)
        ctx.beginPath();
        ctx.moveTo(r.outerPts[0].x, r.outerPts[0].y);
        for (let i = 1; i < r.outerPts.length; i++) ctx.lineTo(r.outerPts[i].x, r.outerPts[i].y);
        ctx.closePath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth * 1.15;
        ctx.stroke();
      }

      ctx.restore();
    }

    // --- Render Volumetric Mushroom (Convex 3D Disc + Central Stomodaeum Mouth) ---
    renderVolumetricMushroom(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, options) {
      const M = this.mushroomDisc;
      if (!M) return;

      ctx.save();

      // 1. Disc solid base wash
      ctx.beginPath();
      ctx.moveTo(M.rimPts[0].x, M.rimPts[0].y);
      for (let i = 1; i < M.rimPts.length; i++) ctx.lineTo(M.rimPts[i].x, M.rimPts[i].y);
      ctx.closePath();
      ctx.fillStyle = baseWash;
      ctx.fill();

      // 2. Chiaroscuro convex shadow
      ctx.save();
      ctx.clip();
      ctx.beginPath();
      ctx.ellipse(M.discRx * 0.25, M.centerY + M.discRy * 0.35, M.discRx * 0.75, M.discRy * 0.55, 0.2, 0, TWO_PI);
      ctx.fillStyle = shadowWash;
      ctx.fill();

      // 3. Arched 3D Septa Blades
      if (options.showStriations !== false && M.septaBlades) {
        ctx.strokeStyle = strokeColor;
        ctx.lineCap = 'round';
        for (const b of M.septaBlades) {
          ctx.beginPath();
          ctx.lineWidth = Math.max(0.45, lineWidth * 0.65);
          ctx.moveTo(b.startX, b.startY);
          ctx.quadraticCurveTo(b.midX, b.midY, b.endX, b.endY);
          ctx.stroke();
        }
      }

      ctx.restore(); // Exit clip

      // 4. Central Stomodaeum (Mouth slit)
      ctx.beginPath();
      ctx.ellipse(0, M.centerY, M.mouthW, M.mouthH, 0, 0, TWO_PI);
      ctx.fillStyle = shadowWash;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth * 1.1;
      ctx.stroke();

      // 5. Outer scalloped boundary rim
      ctx.beginPath();
      ctx.moveTo(M.rimPts[0].x, M.rimPts[0].y);
      for (let i = 1; i < M.rimPts.length; i++) ctx.lineTo(M.rimPts[i].x, M.rimPts[i].y);
      ctx.closePath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth * 1.1;
      ctx.stroke();

      ctx.restore();
    }

    // --- Render Volumetric Digitate (Thick cylindrical columns + latitude rings) ---
    renderVolumetricDigitate(ctx, strokeColor, lineWidth, baseWash, shadowWash, highlightWash, polypInk, options) {
      ctx.save();

      for (const p of this.columns) {
        const topY = -p.height;
        const rad = p.width * 0.5;

        // 1. Column body cylinder
        ctx.beginPath();
        ctx.moveTo(p.x - rad, 0);
        ctx.lineTo(p.x - rad, topY + rad);
        ctx.arc(p.x, topY + rad, rad, PI, 0);
        ctx.lineTo(p.x + rad, 0);
        ctx.closePath();

        ctx.fillStyle = baseWash;
        ctx.fill();

        // 2. Chiaroscuro right-side core shadow
        ctx.save();
        ctx.clip();
        ctx.beginPath();
        ctx.rect(p.x, topY, rad, p.height);
        ctx.fillStyle = shadowWash;
        ctx.fill();

        // 3. Volumetric latitude contour rings
        if (p.rings && options.showVolumeRings !== false) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(0.45, lineWidth * 0.55);
          ctx.globalAlpha = 0.55;
          for (const rng of p.rings) {
            ctx.beginPath();
            ctx.ellipse(p.x, rng.y, rng.rx, rng.ry, 0, 0, PI);
            ctx.stroke();
          }
        }

        ctx.restore(); // Exit clip

        // 4. Dome top calice
        ctx.beginPath();
        ctx.arc(p.x, topY + rad, rad * 0.65, 0, TWO_PI);
        ctx.fillStyle = polypInk;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // 5. Outer cylinder boundary
        ctx.beginPath();
        ctx.moveTo(p.x - rad, 0);
        ctx.lineTo(p.x - rad, topY + rad);
        ctx.arc(p.x, topY + rad, rad, PI, 0);
        ctx.lineTo(p.x + rad, 0);
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
        const parsedArch = options.archetype !== undefined ? options.archetype : choice([0, 1, 2, 3, 4, 5, 6]);
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
        // Clustered colony
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
          const satScale = rndtri(0.50, 0.72, 0.88);
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
  // 5. Coral Reef Ecosystem Manager
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
      const archetypesPool = [0, 1, 2, 3, 4, 5, 6];

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
          count: arch === CORAL_ARCHETYPES.BRANCHING || arch === CORAL_ARCHETYPES.DIGITATE ? Math.floor(rnd(2, 4)) : 1
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
