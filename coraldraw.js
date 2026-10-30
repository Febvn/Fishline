/**
 * coraldraw.js - Procedural Aquatic Coral Engine (Volumetric Ink Line-Art Edition)
 *
 * Implements the chunky volumetric line-art coral style with:
 * - 3D open crater/tube rims (perspective elliptical mouths with inner cavity depth)
 * - Horizontal wrapping cylindrical volume bands
 * - Thick organic tubular limbs with smooth rounded contours
 * - Volumetric brain coral domes with cellular ring chambers
 * - Sunburst radiating polyp tentacle crowns
 * - Multi-tube crater mounds (volcano sponge / tube coral)
 * - Base riverbed pebble clusters anchoring the coral
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
  // 1. Volumetric Coral Archetypes & Species Catalog
  // -----------------------------------------------------------------
  const CORAL_ARCHETYPES = {
    TRUMPET: 0,      // 01 Cawan Terompet Tabung (Flared Trumpet Tubes with Open Rims)
    BRANCHING: 1,    // 02 Ranting Tanduk Tebal (Chunky Branching Tree with Mouths & Bands)
    CRATER_MOUND: 2, // 03 Kubah Kawah Cerobong (Volcano Crater Mound with Open Chimneys)
    BRAIN_DOME: 3,   // 04 Kubah Otak Masif (Cellular Brain Dome with Organic Ring Chambers)
    SUN_POLYP: 4,    // 05 Bunga Polip Mahkota (Tube Mounds with Starburst Tentacle Crowns)
    DIGITATE: 5,     // 06 Menjari Jari Tangan (Upright Digitate Cylinders with Cup Lips)
    KNOBBY_TREE: 6   // 07 Pohon Karang Berbuku (Knobby Spire with Horizontal Ribs & Side Cups)
  };

  const CORAL_MORPHS = {
    STANDARD: 0,    // Standar seimbang
    SPREADING: 1,   // Melebar ke samping
    TALL_SPIRE: 2,  // Ramping menjulang tinggi
    DENSE_CLUSTER: 3,// Rumpun padat rapat
    CURVED_FLOW: 4, // Melengkung teratur
    STEP_TIERED: 5, // Bertingkat tangga trap
    ASYMMETRIC: 6   // Asimetris miring
  };

  const CORAL_CATALOG = [
    // --- 1. Flared Trumpet & Vase Corals (Cawan Terompet Tabung) ---
    { id: 'trumpet_vase', code: 'CTV', common: 'Karang Terompet Cawan', binomen: 'Caulastrea curvata', archetype: 0, height: 160, baseW: 130, spread: 140, roughness: 0.14, desc: 'Tiga cawan terompet tegak melebar dengan bibir elips terbuka berlapis dan garis gelang silindris.' },
    { id: 'fluted_chalice', code: 'CTV', common: 'Karang Piala Seruling', binomen: 'Echinophyllia aspera', archetype: 0, height: 150, baseW: 130, spread: 145, roughness: 0.16, desc: 'Gugusan cawan piala berongga dalam dengan ketebalan bibir 3D dan batu penopang dasar.' },
    { id: 'tube_sponge_pair', code: 'CTV', common: 'Karang Tabung Berongga', binomen: 'Aplysina fistularis', archetype: 0, height: 155, baseW: 110, spread: 130, roughness: 0.12, desc: 'Tabung silinder ramping tegak dengan mulut kawah cekung berkedalaman gelap.' },
    { id: 'triad_flute_coral', code: 'CTV', common: 'Karang Seruling Tiga Cawan', binomen: 'Balanophyllia elegans', archetype: 0, height: 165, baseW: 135, spread: 145, roughness: 0.15, desc: 'Trio cawan terompet berjenjang dengan bibir ganda bervolume tebal dan dasar substrat bergelombang.' },

    // --- 2. Chunky Branching & Antler Corals (Ranting Tanduk Tebal) ---
    { id: 'chunky_staghorn', code: 'ACB', common: 'Karang Tanduk Rusa Tebal', binomen: 'Acropora formosa', archetype: 1, height: 160, baseW: 34, spread: 155, roughness: 0.18, desc: 'Percabangan silinder montok bervolume penuh dengan mulut cangkir terbuka di tiap ujung dan bercak polip.' },
    { id: 'elkhorn_broad', code: 'ACB', common: 'Karang Tanduk Pipih Masif', binomen: 'Acropora palmata', archetype: 1, height: 150, baseW: 42, spread: 155, roughness: 0.22, desc: 'Cabang tebal membulat kokoh mirip tanduk rusa kutub dengan cincin gelang volume horizontal.' },
    { id: 'knobby_branch', code: 'CB', common: 'Karang Ranting Berbuku', binomen: 'Stylophora pistillata', archetype: 1, height: 145, baseW: 30, spread: 145, roughness: 0.16, desc: 'Ranting gemuk meliuk dengan ornamen bercak cincin organik di sekujur batangnya.' },
    { id: 'smooth_antler', code: 'CB', common: 'Karang Tanduk Rusa Mulus', binomen: 'Pocillopora verrucosa', archetype: 1, height: 150, baseW: 32, spread: 150, roughness: 0.15, desc: 'Cabang silindris lentur dengan ujung tumpul berbibir ganda dan alas batu sungai.' },

    // --- 3. Volcano Crater Mound (Kubah Kawah Cerobong) ---
    { id: 'volcano_chimney', code: 'VMC', common: 'Karang Kawah Gunung Api', binomen: 'Turbinaria cratera', archetype: 2, height: 130, baseW: 180, spread: 180, roughness: 0.20, desc: 'Bongkahan kubah masif dengan cerobong kawah terbuka yang memperlihatkan rongga dalam silinder.' },
    { id: 'cluster_crater', code: 'VMC', common: 'Karang Cerobong Rumpun', binomen: 'Montastrea cavernosa', archetype: 2, height: 140, baseW: 190, spread: 190, roughness: 0.24, desc: 'Gundukan terumbu dengan 4 kawah cerobong bertingkat dan bintik-bintik pori koralit di dindingnya.' },
    { id: 'mini_caldera', code: 'VMC', common: 'Karang Kaldera Dasar Danau', binomen: 'Favites flexuosa', archetype: 2, height: 120, baseW: 170, spread: 170, roughness: 0.18, desc: 'Kubah rendah kokoh dengan bibir kawah bulat tebal berkedalaman tinta pekat.' },

    // --- 4. Brain Dome with Cellular Chambers (Kubah Otak Masif) ---
    { id: 'brain_pebble_cell', code: 'CM', common: 'Karang Otak Sel Batuan', binomen: 'Platygyra lamellina', archetype: 3, height: 135, baseW: 165, spread: 165, roughness: 0.22, desc: 'Kubah batu setengah lingkaran masif yang dipenuhi bilik-bilik sel melingkar organik bertingkat konsentris.' },
    { id: 'diploria_dome', code: 'CM', common: 'Karang Otak Cincin Rapat', binomen: 'Diploria labyrinthiformis', archetype: 3, height: 145, baseW: 175, spread: 175, roughness: 0.20, desc: 'Bongkahan kubah terumbu kokoh dengan ratusan rongga sel heksagonal membulat alami.' },
    { id: 'favia_honeycomb_dome', code: 'CM', common: 'Karang Sarang Lebah Kubah', binomen: 'Favia favus', archetype: 3, height: 130, baseW: 160, spread: 160, roughness: 0.18, desc: 'Kubah kalsit masif dengan dinding sel koralit timbul dan arsir volume chiaroscuro.' },

    // --- 5. Sunburst Flower Polyp Tube (Bunga Polip Mahkota) ---
    { id: 'sunburst_polyp', code: 'SPT', common: 'Karang Bunga Polip Surya', binomen: 'Tubastraea faulkneri', archetype: 4, height: 145, baseW: 130, spread: 140, roughness: 0.16, desc: 'Dua kubah silinder montok bermahkota tentakel menjari mirip kelopak bunga matahari mekar.' },
    { id: 'anemone_coral_duo', code: 'SPT', common: 'Karang Tabung Anemon Ganda', binomen: 'Goniopora stokesi', archetype: 4, height: 150, baseW: 135, spread: 145, roughness: 0.18, desc: 'Tabung montok berpori dengan mahkota tentakel lentur yang memancar ke segala arah.' },
    { id: 'sea_dahlia_tube', code: 'SPT', common: 'Karang Dahlia Laut Rumpun', binomen: 'Clavularia viridis', archetype: 4, height: 150, baseW: 130, spread: 135, roughness: 0.15, desc: 'Koloni tabung silinder bulat pendek dengan tentakel runcing melingkari mulut terbuka.' },

    // --- 6. Digitate Glove & Columnar Corals (Menjari Jari Tangan) ---
    { id: 'digitate_glove', code: 'ACD', common: 'Karang Menjari Sarung Tangan', binomen: 'Acropora humilis', archetype: 5, height: 150, baseW: 90, spread: 145, roughness: 0.18, desc: 'Kumpulan jari silinder gemuk tegak menjari dengan mulut cangkir koralit elips di tiap ujung jari.' },
    { id: 'organ_pipe_bundle', code: 'CTU', common: 'Karang Tabung Pipa Berjenjang', binomen: 'Tubipora musica', archetype: 5, height: 145, baseW: 100, spread: 140, roughness: 0.20, desc: 'Deretan tabung silinder miring berjejer dengan penampang bibir mulut elips 3D dan garis gelang.' },
    { id: 'finger_coral_fan', code: 'ACD', common: 'Karang Jari Menyeruak Kipas', binomen: 'Porites compressa', archetype: 5, height: 155, baseW: 95, spread: 145, roughness: 0.16, desc: 'Cabang-cabang silinder vertikal menjulang sejajar dari pangkal batang yang tebal.' },
    { id: 'wavy_fingers', code: 'ACD', common: 'Karang Jari Bergelombang', binomen: 'Alcyonium digitatum', archetype: 5, height: 145, baseW: 95, spread: 140, roughness: 0.15, desc: 'Jari-jari lentur berombak meliuk anggun dengan alas batu kerikil sungai.' },

    // --- 7. Knobby Tree & Ribbed Spires (Pohon Karang Berbuku) ---
    { id: 'knobby_spire', code: 'KTS', common: 'Karang Menara Berbuku Gelang', binomen: 'Dendrophyllia ramea', archetype: 6, height: 165, baseW: 55, spread: 135, roughness: 0.18, desc: 'Batang pohon tegak dengan gelang-gelang cincin horizontal, koralit samping menonjol, dan mulut atas.' },
    { id: 'ladder_shelf_tree', code: 'KTS', common: 'Karang Pohon Trap Berundak', binomen: 'Pachyseris rugosa', archetype: 6, height: 155, baseW: 52, spread: 135, roughness: 0.20, desc: 'Batang bergaris-garis trap horizontal seperti tangga dengan percabangan bervolume tebal.' },
    { id: 'side_nozzle_coral', code: 'KTS', common: 'Karang Cerobong Cabang Samping', binomen: 'Millepora alcicornis', archetype: 6, height: 160, baseW: 54, spread: 140, roughness: 0.17, desc: 'Batang silinder utama kokoh dengan beberapa moncong cerobong cawan menyamping.' }
  ];

  function getCoralById(id) {
    return CORAL_CATALOG.find(c => c.id === id) || CORAL_CATALOG[0];
  }

  function getCoralList() {
    return CORAL_CATALOG.slice();
  }

  // -----------------------------------------------------------------
  // 2. Volumetric Specimen Class (Matches User Line-Art Reference)
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
      this.baseW = (config.baseW || rndtri(50, 90, 130)) * this.scale;
      this.spread = (config.spread || rndtri(120, 160, 200)) * this.scale;
      this.roughness = config.roughness !== undefined ? config.roughness : rndtri(0.12, 0.20, 0.30);

      // Light angle (top-left sumi-e ambient)
      this.lightAngle = rndtri(-PI * 0.85, -PI * 0.65, -PI * 0.45);
      this.lightVec = { x: Math.cos(this.lightAngle), y: Math.sin(this.lightAngle) };

      // Hydrodynamic sway phase
      this.swayPhase = rnd(0, TWO_PI);
      this.swayAmp = 3.5 * this.scale;
      this.currentSwayX = 0;

      // Base riverbed pebbles anchoring the coral
      this.basePebbles = [];
      this.initBasePebbles();

      // Geometry model
      this.model = {};
      this.buildGeometry();
    }

    initBasePebbles() {
      this.basePebbles = [];
      const numPebbles = Math.floor(rnd(2, 4));
      const spanW = this.spread * 0.42;
      for (let i = 0; i < numPebbles; i++) {
        const u = numPebbles === 1 ? 0 : (i / (numPebbles - 1) - 0.5) * 2;
        const px = u * spanW + rndtri(-8, 0, 8);
        const py = rndtri(-2, 4, 10);
        const prx = rndtri(14, 22, 32) * this.scale;
        const pry = rndtri(8, 13, 18) * this.scale;
        const rot = rndtri(-0.25, 0, 0.25);
        this.basePebbles.push({ px, py, prx, pry, rot });
      }
    }

    buildGeometry() {
      switch (this.archetype) {
        case CORAL_ARCHETYPES.TRUMPET:
          this.buildTrumpetModel();
          break;
        case CORAL_ARCHETYPES.BRANCHING:
          this.buildChunkyBranchingModel();
          break;
        case CORAL_ARCHETYPES.CRATER_MOUND:
          this.buildCraterMoundModel();
          break;
        case CORAL_ARCHETYPES.BRAIN_DOME:
          this.buildBrainDomeModel();
          break;
        case CORAL_ARCHETYPES.SUN_POLYP:
          this.buildSunPolypModel();
          break;
        case CORAL_ARCHETYPES.DIGITATE:
          this.buildDigitateModel();
          break;
        case CORAL_ARCHETYPES.KNOBBY_TREE:
          this.buildKnobbyTreeModel();
          break;
        default:
          this.buildChunkyBranchingModel();
      }
    }

    // --- 1. Flared Trumpet Cups (Col 1 Row 1) ---
    buildTrumpetModel() {
      const tubes = [];
      const numTubes = 3;
      const spanW = this.spread * 0.55;

      for (let i = 0; i < numTubes; i++) {
        const u = (i / (numTubes - 1) - 0.5) * 2;
        const tHeight = this.height * (0.75 + (1 - Math.abs(u) * 0.25) * 0.25 + rndtri(-0.06, 0, 0.06));
        const rootX = u * spanW * 0.38 + rndtri(-4, 0, 4);
        const topX = u * spanW * 0.55 + rndtri(-6, 0, 6);
        const topY = -tHeight;

        const rimRx = rndtri(24, 32, 40) * this.scale;
        const rimRy = rimRx * 0.38; // Perspective ellipse
        const stemW = rndtri(12, 16, 22) * this.scale;

        // Horizontal banding stripes along the cone stem
        const bands = [];
        const numB = 3;
        for (let b = 1; b <= numB; b++) {
          const frac = b / (numB + 1);
          const by = lerp(0, topY + rimRy * 1.2, frac);
          const bx = lerp(rootX, topX, frac);
          const bw = lerp(stemW, rimRx * 1.5, frac) * 0.5;
          bands.push({ bx, by, bw, bRy: bw * 0.28 });
        }

        tubes.push({
          rootX, topX, topY,
          stemW, rimRx, rimRy,
          bands
        });
      }

      // Wavy basal substrate plate
      const substratePts = [];
      const subW = this.spread * 0.55;
      const subH = 14 * this.scale;
      const numPts = 16;
      for (let i = 0; i <= numPts; i++) {
        const u = (i / numPts - 0.5) * 2;
        const sx = u * subW;
        const sy = 4 + Math.sin(u * PI * 2) * 3 + rndtri(-2, 0, 2);
        substratePts.push({ sx, sy });
      }

      this.model = { tubes, substratePts };
    }

    // --- 2. Chunky Branching Tree (Col 2 Row 1, Col 2 Row 3) ---
    buildChunkyBranchingModel() {
      const branches = [];
      const branchW = Math.max(18 * this.scale, this.baseW * 0.55);

      // Recursive chunky limbs forming a balanced, organic aquatic bush
      const queue = [
        { x: 0, y: 0, angle: -HALF_PI, length: this.height * 0.28, w: branchW, depth: 0 }
      ];

      const maxDepth = 3;
      while (queue.length > 0) {
        const b = queue.shift();
        const endX = b.x + Math.cos(b.angle) * b.length;
        const endY = b.y + Math.sin(b.angle) * b.length;

        // Open rim cup at branch tip
        const rimRx = b.w * 0.55;
        const rimRy = rimRx * 0.38;

        // Horizontal stripes / volume rings along the limb
        const rings = [];
        const numR = Math.max(1, Math.floor(b.length / (24 * this.scale)));
        for (let r = 1; r <= numR; r++) {
          const t = r / (numR + 1);
          rings.push({
            rx: lerp(b.x, endX, t),
            ry: lerp(b.y, endY, t),
            w: b.w * 0.48,
            ang: b.angle + HALF_PI
          });
        }

        // Circular polyp spot splotches on the branch
        const spots = [];
        if (rand() < 0.80) {
          spots.push({
            sx: lerp(b.x, endX, 0.45) + rndtri(-3, 0, 3),
            sy: lerp(b.y, endY, 0.45) + rndtri(-3, 0, 3),
            r: rndtri(2.5, 4.0, 5.5) * this.scale
          });
        }

        branches.push({
          x0: b.x, y0: b.y,
          x1: endX, y1: endY,
          w: b.w,
          angle: b.angle,
          rimRx, rimRy,
          rings,
          spots,
          depth: b.depth
        });

        if (b.depth < maxDepth) {
          const numChildren = b.depth === 0 ? 3 : (rand() < 0.65 ? 2 : 1);
          const spreadAng = 0.48;
          for (let c = 0; c < numChildren; c++) {
            let frac = 0;
            if (numChildren === 3) frac = (c === 0 ? -1.0 : (c === 1 ? 0 : 1.0));
            else if (numChildren === 2) frac = (c === 0 ? -0.85 : 0.85);
            else frac = rand() < 0.5 ? -0.5 : 0.5;

            const childAng = b.angle + frac * spreadAng + rndtri(-0.10, 0, 0.10);
            const childLen = b.length * rndtri(0.72, 0.82, 0.92);
            queue.push({
              x: endX, y: endY,
              angle: childAng,
              length: childLen,
              w: Math.max(12 * this.scale, b.w * 0.78),
              depth: b.depth + 1
            });
          }
        }
      }

      this.model = { branches };
    }

    // --- 3. Volcano Crater Mound (Col 2 Row 2, Col 1 Row 3) ---
    buildCraterMoundModel() {
      const moundW = this.spread * 0.55;
      const moundH = this.height * 0.55;

      // 3 to 5 open volcano chimney craters along top rim
      const chimneys = [];
      const numCh = 4;
      for (let i = 0; i < numCh; i++) {
        const u = (i / (numCh - 1) - 0.5) * 2;
        const cx = u * moundW * 0.75 + rndtri(-6, 0, 6);
        const cy = -moundH * (0.65 + (1 - Math.abs(u) * 0.45) * 0.45 + rndtri(-0.06, 0, 0.06));
        const crx = rndtri(12, 17, 24) * this.scale;
        const cry = crx * 0.42;
        chimneys.push({ cx, cy, crx, cry, u });
      }

      // Stipple dots across mound surface
      const dots = [];
      const numD = 18;
      for (let d = 0; d < numD; d++) {
        dots.push({
          dx: rndtri(-moundW * 0.65, 0, moundW * 0.65),
          dy: -moundH * rndtri(0.15, 0.40, 0.65),
          r: rndtri(1.2, 2.2, 3.5)
        });
      }

      this.model = { moundW, moundH, chimneys, dots };
    }

    // --- 4. Brain Dome with Organic Cellular Chambers (Col 4 Row 2) ---
    buildBrainDomeModel() {
      const domeRx = this.spread * 0.48;
      const domeRy = this.height * 0.56;
      const centerY = 0;

      // Outer dome boundary points resting on base y=0
      const domePts = [];
      const numPts = 36;
      for (let i = 0; i <= numPts; i++) {
        const th = PI + (i / numPts) * PI;
        domePts.push({
          x: Math.cos(th) * domeRx,
          y: centerY + Math.sin(th) * domeRy
        });
      }

      // Tightly packed cellular pebble rings inside dome (matches 5x4 reference)
      const cells = [];
      const rows = 5;
      for (let r = 0; r < rows; r++) {
        const fracY = (r + 0.6) / (rows + 0.5);
        const cy = -domeRy * fracY;
        const spanX = domeRx * Math.sqrt(Math.max(0.08, 1 - Math.pow(fracY, 2))) * 0.84;
        const cols = Math.max(2, Math.floor(spanX / (12 * this.scale)));

        for (let c = 0; c < cols; c++) {
          const u = cols === 1 ? 0 : (c / (cols - 1) - 0.5) * 2;
          const cx = u * spanX + rndtri(-3, 0, 3);
          const crx = rndtri(7, 10, 13) * this.scale;
          const cry = crx * rndtri(0.70, 0.85, 1.05);
          const rot = rndtri(-0.35, 0, 0.35);
          cells.push({ cx, cy, crx, cry, rot });
        }
      }

      this.model = { domeRx, domeRy, centerY, domePts, cells };
    }

    // --- 5. Sunburst Flower Polyp Tube (Col 3 Row 1, Col 5 Row 3) ---
    buildSunPolypModel() {
      const tubes = [];
      const numTubes = 2;
      const spanW = this.spread * 0.45;

      for (let i = 0; i < numTubes; i++) {
        const u = numTubes === 1 ? 0 : (i / (numTubes - 1) - 0.5) * 2;
        const tx = u * spanW * 0.55 + rndtri(-6, 0, 6);
        const tH = this.height * (0.75 + (i === 1 ? 0.25 : 0) + rndtri(-0.05, 0, 0.05));
        const tw = rndtri(32, 44, 56) * this.scale;
        const topY = -tH;

        // Radiating sunburst petal tentacles
        const tentacles = [];
        const numTent = Math.floor(rnd(10, 14));
        const tentLen = rndtri(16, 24, 32) * this.scale;
        for (let t = 0; t < numTent; t++) {
          const a = (t / numTent) * TWO_PI;
          tentacles.push({
            x0: tx + Math.cos(a) * (tw * 0.38),
            y0: topY + Math.sin(a) * (tw * 0.22),
            x1: tx + Math.cos(a) * (tw * 0.38 + tentLen),
            y1: topY + Math.sin(a) * (tw * 0.22 + tentLen * 0.75)
          });
        }

        // Stipple dots
        const dots = [];
        for (let d = 0; d < 6; d++) {
          dots.push({
            dx: tx + rndtri(-tw * 0.35, 0, tw * 0.35),
            dy: lerp(0, topY, rnd(0.25, 0.75)),
            r: rndtri(1.5, 2.5, 3.8)
          });
        }

        tubes.push({ tx, topY, tw, tH, tentacles, dots });
      }

      this.model = { tubes };
    }

    // --- 6. Digitate Glove Fingers (Col 5 Row 1, Col 4 Row 4) ---
    buildDigitateModel() {
      const fingers = [];
      const numFingers = Math.floor(rnd(4, 6));
      const spanW = this.spread * 0.55;
      const fingerW = rndtri(16, 22, 28) * this.scale;

      for (let i = 0; i < numFingers; i++) {
        const u = (i / (numFingers - 1) - 0.5) * 2;
        const fx = u * spanW * 0.5 + rndtri(-4, 0, 4);
        const fH = this.height * (0.65 + (1 - Math.abs(u) * 0.40) * 0.42 + rndtri(-0.06, 0, 0.06));
        const topY = -fH;
        const rimRx = fingerW * 0.45;
        const rimRy = rimRx * 0.38;

        // Horizontal banding lines
        const bands = [];
        const numB = 2;
        for (let b = 1; b <= numB; b++) {
          const by = lerp(0, topY, b / (numB + 1));
          bands.push({ by, w: fingerW * 0.48 });
        }

        fingers.push({
          fx, topY, fH, fingerW,
          rimRx, rimRy, bands
        });
      }

      this.model = { fingers, spanW };
    }

    // --- 7. Knobby Tree & Ladder Spire (Col 3 Row 3, Col 5 Row 4) ---
    buildKnobbyTreeModel() {
      const trunkW = rndtri(24, 32, 42) * this.scale;
      const trunkH = this.height * 0.95;
      const topY = -trunkH;

      // Horizontal ladder shelves / rings
      const shelves = [];
      const numS = 5;
      for (let s = 1; s <= numS; s++) {
        const frac = s / (numS + 1);
        const sy = lerp(0, topY, frac);
        const sw = trunkW * (1.1 + rndtri(-0.15, 0, 0.25));
        shelves.push({ sy, sw });
      }

      // Protruding sideways nozzle cups
      const sideCups = [];
      const numCups = 3;
      for (let c = 0; c < numCups; c++) {
        const isLeft = c % 2 === 0;
        const cy = lerp(topY * 0.3, topY * 0.8, (c + 1) / (numCups + 1));
        const cx = (isLeft ? -trunkW * 0.55 : trunkW * 0.55) + (isLeft ? -16 : 16) * this.scale;
        sideCups.push({
          cx, cy, isLeft,
          rx: 9 * this.scale,
          ry: 5 * this.scale
        });
      }

      this.model = { trunkW, trunkH, topY, shelves, sideCups };
    }

    update(dt, waterFlow = 0) {
      this.swayPhase += dt * 1.5;
      this.currentSwayX = Math.sin(this.swayPhase) * this.swayAmp + waterFlow * 5;
    }

    render(ctx, options = {}) {
      ctx.save();
      ctx.translate(this.x, this.y);

      const theme = options.theme || 'washi';
      const isMidnight = theme === 'midnight';
      const strokeColor = options.strokeColor || (isMidnight ? '#f0f0f0' : '#111111');
      const lineWidth = (options.lineWidth || 1.4) * 1.25;

      // Strictly monochrome palette
      const baseWash = isMidnight
        ? (options.coralWash || 'rgba(255, 255, 255, 0.10)')
        : (options.coralWash || 'rgba(255, 255, 255, 0.95)');

      const cavityWash = isMidnight
        ? 'rgba(0, 0, 0, 0.65)'
        : 'rgba(25, 25, 25, 0.60)';

      const shadowWash = isMidnight
        ? 'rgba(0, 0, 0, 0.45)'
        : 'rgba(0, 0, 0, 0.14)';

      // 1. Soft underwater ground drop shadow
      if (options.showShadow !== false) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 8, this.spread * 0.45, 12, 0, 0, TWO_PI);
        ctx.fillStyle = shadowWash;
        ctx.fill();
        ctx.restore();
      }

      // 2. Base riverbed pebble stones
      if (this.basePebbles.length > 0 && options.showPebbles !== false) {
        ctx.save();
        ctx.fillStyle = baseWash;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth * 0.85;
        for (const p of this.basePebbles) {
          ctx.beginPath();
          ctx.ellipse(p.px, p.py, p.prx, p.pry, p.rot, 0, TWO_PI);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // Hydrodynamic current sway transform
      ctx.save();
      const swayX = this.currentSwayX;
      ctx.transform(1, 0, swayX / 650, 1, 0, 0);

      // 3. Render Volumetric Model
      switch (this.archetype) {
        case CORAL_ARCHETYPES.TRUMPET:
          this.renderTrumpet(ctx, strokeColor, lineWidth, baseWash, cavityWash, options);
          break;
        case CORAL_ARCHETYPES.BRANCHING:
          this.renderChunkyBranching(ctx, strokeColor, lineWidth, baseWash, cavityWash, options);
          break;
        case CORAL_ARCHETYPES.CRATER_MOUND:
          this.renderCraterMound(ctx, strokeColor, lineWidth, baseWash, cavityWash, options);
          break;
        case CORAL_ARCHETYPES.BRAIN_DOME:
          this.renderBrainDome(ctx, strokeColor, lineWidth, baseWash, cavityWash, options);
          break;
        case CORAL_ARCHETYPES.SUN_POLYP:
          this.renderSunPolyp(ctx, strokeColor, lineWidth, baseWash, cavityWash, options);
          break;
        case CORAL_ARCHETYPES.DIGITATE:
          this.renderDigitate(ctx, strokeColor, lineWidth, baseWash, cavityWash, options);
          break;
        case CORAL_ARCHETYPES.KNOBBY_TREE:
          this.renderKnobbyTree(ctx, strokeColor, lineWidth, baseWash, cavityWash, options);
          break;
      }

      ctx.restore(); // Exit sway
      ctx.restore(); // Exit root translate
    }

    // --- Render Trumpet Tubes with Open Rims & Inner Cavity ---
    renderTrumpet(ctx, strokeColor, lineWidth, baseWash, cavityWash, options) {
      const M = this.model;
      if (!M || !M.tubes) return;

      // Substrate plate
      if (M.substratePts && options.showHoldfast !== false) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(M.substratePts[0].sx, M.substratePts[0].sy);
        for (let i = 1; i < M.substratePts.length; i++) ctx.lineTo(M.substratePts[i].sx, M.substratePts[i].sy);
        ctx.closePath();
        ctx.fillStyle = baseWash;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        ctx.restore();
      }

      // Tubes back-to-front
      for (const t of M.tubes) {
        ctx.save();
        // 1. Cone body
        ctx.beginPath();
        ctx.moveTo(t.rootX - t.stemW * 0.5, 0);
        ctx.quadraticCurveTo(t.rootX - t.stemW * 0.4, t.topY * 0.5, t.topX - t.rimRx, t.topY);
        ctx.quadraticCurveTo(t.topX, t.topY + t.rimRy, t.topX + t.rimRx, t.topY);
        ctx.quadraticCurveTo(t.rootX + t.stemW * 0.4, t.topY * 0.5, t.rootX + t.stemW * 0.5, 0);
        ctx.closePath();

        ctx.fillStyle = baseWash;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // 2. Horizontal wrapping volume bands
        if (options.showVolumeRings !== false && t.bands) {
          for (const b of t.bands) {
            ctx.beginPath();
            ctx.ellipse(b.bx, b.by, b.bw, b.bRy, 0, 0, PI);
            ctx.lineWidth = lineWidth * 0.8;
            ctx.stroke();
          }
        }

        // 3. Open Elliptical Rim Lip (Outer Rim)
        ctx.beginPath();
        ctx.ellipse(t.topX, t.topY, t.rimRx, t.rimRy, 0, 0, TWO_PI);
        ctx.fillStyle = baseWash;
        ctx.fill();
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // 4. Inner Hollow Cavity (Depth hole)
        ctx.beginPath();
        ctx.ellipse(t.topX, t.topY, t.rimRx * 0.65, t.rimRy * 0.65, 0, 0, TWO_PI);
        ctx.fillStyle = cavityWash;
        ctx.fill();
        ctx.lineWidth = lineWidth * 0.75;
        ctx.stroke();

        ctx.restore();
      }
    }

    // --- Render Chunky Branching Tree (Mouths, Spots & Bands) ---
    renderChunkyBranching(ctx, strokeColor, lineWidth, baseWash, cavityWash, options) {
      const M = this.model;
      if (!M || !M.branches) return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const b of M.branches) {
        const normA = b.angle + HALF_PI;
        const hw0 = b.w * 0.5;
        const hw1 = b.w * 0.38;

        const l0x = b.x0 + Math.cos(normA) * hw0;
        const l0y = b.y0 + Math.sin(normA) * hw0;
        const l1x = b.x1 + Math.cos(normA) * hw1;
        const l1y = b.y1 + Math.sin(normA) * hw1;

        const r0x = b.x0 - Math.cos(normA) * hw0;
        const r0y = b.y0 - Math.sin(normA) * hw0;
        const r1x = b.x1 - Math.cos(normA) * hw1;
        const r1y = b.y1 - Math.sin(normA) * hw1;

        // Branch weld junction at joint
        if (b.depth > 0) {
          ctx.beginPath();
          ctx.arc(b.x0, b.y0, hw0 * 0.9, 0, TWO_PI);
          ctx.fillStyle = baseWash;
          ctx.fill();
        }

        // Branch limb polygon
        ctx.beginPath();
        ctx.moveTo(l0x, l0y);
        ctx.lineTo(l1x, l1y);
        ctx.lineTo(r1x, r1y);
        ctx.lineTo(r0x, r0y);
        ctx.closePath();

        ctx.fillStyle = baseWash;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Horizontal volume wrapping rings
        if (options.showVolumeRings !== false && b.rings) {
          for (const rng of b.rings) {
            ctx.beginPath();
            ctx.moveTo(rng.rx + Math.cos(rng.ang) * rng.w, rng.ry + Math.sin(rng.ang) * rng.w);
            ctx.lineTo(rng.rx - Math.cos(rng.ang) * rng.w, rng.ry - Math.sin(rng.ang) * rng.w);
            ctx.lineWidth = lineWidth * 0.8;
            ctx.stroke();
          }
        }

        // Open rim mouth at tip
        ctx.beginPath();
        ctx.ellipse(b.x1, b.y1, b.rimRx, b.rimRy, b.angle, 0, TWO_PI);
        ctx.fillStyle = baseWash;
        ctx.fill();
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Inner cavity hole
        ctx.beginPath();
        ctx.ellipse(b.x1, b.y1, b.rimRx * 0.55, b.rimRy * 0.55, b.angle, 0, TWO_PI);
        ctx.fillStyle = cavityWash;
        ctx.fill();
        ctx.stroke();

        // Spot splotches
        if (options.showPolyps !== false && b.spots) {
          for (const sp of b.spots) {
            ctx.beginPath();
            ctx.arc(sp.sx, sp.sy, sp.r, 0, TWO_PI);
            ctx.fillStyle = baseWash;
            ctx.fill();
            ctx.lineWidth = lineWidth * 0.8;
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    }

    // --- Render Volcano Crater Mound (Chimneys with Dark Cavities) ---
    renderCraterMound(ctx, strokeColor, lineWidth, baseWash, cavityWash, options) {
      const M = this.model;
      if (!M || !M.chimneys) return;

      ctx.save();
      // 1. Mound body silhouette
      ctx.beginPath();
      ctx.moveTo(-M.moundW, 0);
      for (const ch of M.chimneys) {
        ctx.lineTo(ch.cx - ch.crx, ch.cy);
        ctx.lineTo(ch.cx + ch.crx, ch.cy);
      }
      ctx.lineTo(M.moundW, 0);
      ctx.closePath();

      ctx.fillStyle = baseWash;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // 2. Open crater chimneys with inner cavity depth
      for (const ch of M.chimneys) {
        // Outer rim
        ctx.beginPath();
        ctx.ellipse(ch.cx, ch.cy, ch.crx, ch.cry, 0, 0, TWO_PI);
        ctx.fillStyle = baseWash;
        ctx.fill();
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Dark inner cavity
        ctx.beginPath();
        ctx.ellipse(ch.cx, ch.cy, ch.crx * 0.60, ch.cry * 0.60, 0, 0, TWO_PI);
        ctx.fillStyle = cavityWash;
        ctx.fill();
        ctx.lineWidth = lineWidth * 0.75;
        ctx.stroke();
      }

      // 3. Stipple dots
      if (options.showPolyps !== false && M.dots) {
        ctx.fillStyle = strokeColor;
        for (const dt of M.dots) {
          ctx.beginPath();
          ctx.arc(dt.dx, dt.dy, dt.r, 0, TWO_PI);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // --- Render Brain Dome with Packed Cellular Chambers ---
    renderBrainDome(ctx, strokeColor, lineWidth, baseWash, cavityWash, options) {
      const M = this.model;
      if (!M || !M.domePts) return;

      ctx.save();
      // Outer dome boundary
      ctx.beginPath();
      ctx.moveTo(M.domePts[0].x, M.domePts[0].y);
      for (let i = 1; i < M.domePts.length; i++) ctx.lineTo(M.domePts[i].x, M.domePts[i].y);
      ctx.closePath();

      ctx.fillStyle = baseWash;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Clip for internal cellular chambers
      ctx.save();
      ctx.clip();

      if (options.showMeanders !== false && M.cells) {
        for (const cl of M.cells) {
          // Outer cell ring
          ctx.beginPath();
          ctx.ellipse(cl.cx, cl.cy, cl.crx, cl.cry, cl.rot, 0, TWO_PI);
          ctx.fillStyle = baseWash;
          ctx.fill();
          ctx.lineWidth = lineWidth * 0.85;
          ctx.stroke();

          // Inner concentric ring
          ctx.beginPath();
          ctx.ellipse(cl.cx, cl.cy, cl.crx * 0.48, cl.cry * 0.48, cl.rot, 0, TWO_PI);
          ctx.lineWidth = lineWidth * 0.65;
          ctx.stroke();
        }
      }

      ctx.restore(); // Exit clip

      // Dome outline boundary
      ctx.beginPath();
      ctx.moveTo(M.domePts[0].x, M.domePts[0].y);
      for (let i = 1; i < M.domePts.length; i++) ctx.lineTo(M.domePts[i].x, M.domePts[i].y);
      ctx.closePath();
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      ctx.restore();
    }

    // --- Render Sunburst Flower Polyp Tube ---
    renderSunPolyp(ctx, strokeColor, lineWidth, baseWash, cavityWash, options) {
      const M = this.model;
      if (!M || !M.tubes) return;

      ctx.save();
      for (const tb of M.tubes) {
        // Rounded dome top cylinder mound
        ctx.beginPath();
        ctx.moveTo(tb.tx - tb.tw * 0.5, 0);
        ctx.lineTo(tb.tx - tb.tw * 0.44, tb.topY + tb.tw * 0.25);
        ctx.quadraticCurveTo(tb.tx, tb.topY - tb.tw * 0.12, tb.tx + tb.tw * 0.44, tb.topY + tb.tw * 0.25);
        ctx.lineTo(tb.tx + tb.tw * 0.5, 0);
        ctx.closePath();

        ctx.fillStyle = baseWash;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Radiating starburst petal tentacles with rounded flower caps
        if (options.showPolyps !== false && tb.tentacles) {
          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.fillStyle = baseWash;
          ctx.lineWidth = lineWidth * 1.1;
          ctx.lineCap = 'round';
          for (const tc of tb.tentacles) {
            ctx.beginPath();
            ctx.moveTo(tc.x0, tc.y0);
            ctx.lineTo(tc.x1, tc.y1);
            ctx.stroke();

            // Small rounded tentacle tip bulb
            ctx.beginPath();
            ctx.arc(tc.x1, tc.y1, lineWidth * 1.2, 0, TWO_PI);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }

        // Stipple dots
        if (options.showPolyps !== false && tb.dots) {
          ctx.fillStyle = strokeColor;
          for (const dt of tb.dots) {
            ctx.beginPath();
            ctx.arc(dt.dx, dt.dy, dt.r, 0, TWO_PI);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    // --- Render Digitate Glove Fingers (Open Cup Mouths) ---
    renderDigitate(ctx, strokeColor, lineWidth, baseWash, cavityWash, options) {
      const M = this.model;
      if (!M || !M.fingers) return;

      ctx.save();
      for (const fg of M.fingers) {
        // Finger cylinder
        ctx.beginPath();
        ctx.moveTo(fg.fx - fg.fingerW * 0.5, 0);
        ctx.lineTo(fg.fx - fg.fingerW * 0.45, fg.topY);
        ctx.lineTo(fg.fx + fg.fingerW * 0.45, fg.topY);
        ctx.lineTo(fg.fx + fg.fingerW * 0.5, 0);
        ctx.closePath();

        ctx.fillStyle = baseWash;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Volume wrapping bands
        if (options.showVolumeRings !== false && fg.bands) {
          for (const b of fg.bands) {
            ctx.beginPath();
            ctx.moveTo(fg.fx - b.w, b.by);
            ctx.lineTo(fg.fx + b.w, b.by);
            ctx.lineWidth = lineWidth * 0.8;
            ctx.stroke();
          }
        }

        // Open rim cup
        ctx.beginPath();
        ctx.ellipse(fg.fx, fg.topY, fg.rimRx, fg.rimRy, 0, 0, TWO_PI);
        ctx.fillStyle = baseWash;
        ctx.fill();
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Inner cavity
        ctx.beginPath();
        ctx.ellipse(fg.fx, fg.topY, fg.rimRx * 0.55, fg.rimRy * 0.55, 0, 0, TWO_PI);
        ctx.fillStyle = cavityWash;
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- Render Knobby Tree (Shelves, Spires & Side Cups) ---
    renderKnobbyTree(ctx, strokeColor, lineWidth, baseWash, cavityWash, options) {
      const M = this.model;
      if (!M) return;

      ctx.save();
      const hw = M.trunkW * 0.5;

      // Main trunk
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw * 0.75, M.topY);
      ctx.lineTo(hw * 0.75, M.topY);
      ctx.lineTo(hw, 0);
      ctx.closePath();

      ctx.fillStyle = baseWash;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Horizontal ladder shelves
      if (options.showVolumeRings !== false && M.shelves) {
        for (const s of M.shelves) {
          ctx.beginPath();
          ctx.moveTo(-s.sw * 0.5, s.sy);
          ctx.lineTo(s.sw * 0.5, s.sy);
          ctx.lineWidth = lineWidth * 1.05;
          ctx.stroke();
        }
      }

      // Protruding sideways nozzle cups connected by elbow stubs
      if (M.sideCups) {
        for (const sc of M.sideCups) {
          const edgeX = sc.isLeft ? -hw : hw;
          // Connecting branch elbow
          ctx.beginPath();
          ctx.moveTo(edgeX, sc.cy - sc.ry * 0.85);
          ctx.lineTo(sc.cx, sc.cy - sc.ry);
          ctx.lineTo(sc.cx, sc.cy + sc.ry);
          ctx.lineTo(edgeX, sc.cy + sc.ry * 0.85);
          ctx.closePath();
          ctx.fillStyle = baseWash;
          ctx.fill();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          ctx.stroke();

          // Outer nozzle rim
          ctx.beginPath();
          ctx.ellipse(sc.cx, sc.cy, sc.rx, sc.ry, 0, 0, TWO_PI);
          ctx.fillStyle = baseWash;
          ctx.fill();
          ctx.lineWidth = lineWidth;
          ctx.stroke();

          // Dark inner nozzle hole
          ctx.beginPath();
          ctx.ellipse(sc.cx, sc.cy, sc.rx * 0.55, sc.ry * 0.55, 0, 0, TWO_PI);
          ctx.fillStyle = cavityWash;
          ctx.fill();
          ctx.stroke();
        }
      }

      // Top open mouth
      ctx.beginPath();
      ctx.ellipse(0, M.topY, hw * 0.75, hw * 0.32, 0, 0, TWO_PI);
      ctx.fillStyle = baseWash;
      ctx.fill();
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, M.topY, hw * 0.45, hw * 0.18, 0, 0, TWO_PI);
      ctx.fillStyle = cavityWash;
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 3. Composite Multi-Coral Colony
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
      this.scale = (options.scale || rndtri(0.80, 1.0, 1.25)) * (options.scaleMult || 1.0);

      this.corals = [];
      const numCorals = options.count !== undefined ? options.count : (options.single === true ? 1 : Math.floor(rnd(2, 4)));

      if (numCorals <= 1) {
        this.corals.push(new CoralSpecimen(0, 0, `${this.seed}_single`, {
          archetype: this.archetype,
          morph: options.morph !== undefined ? options.morph : profile.morph,
          height: (options.height || profile.height) * this.scale,
          baseW: (options.baseW || profile.baseW) * this.scale,
          spread: (options.spread || profile.spread) * this.scale,
          roughness: options.roughness !== undefined ? options.roughness : profile.roughness
        }));
      } else {
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
          const satScale = rndtri(0.55, 0.75, 0.90);
          const offX = u * mainW * 0.42 + rndtri(-8, 0, 8);
          const offY = rndtri(-6, 0, 6);

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
  // 4. Coral Reef Ecosystem Manager
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
        const baseX = margin + i * step + rndtri(-35, 0, 35);
        const baseY = height - rndtri(8, 20, 36);
        const colSeed = `${this.seed}_reef_${i}`;
        const arch = archetypesPool[i % archetypesPool.length];
        const species = choice(CORAL_CATALOG.filter(c => c.archetype === arch)) || CORAL_CATALOG[0];

        const colony = new CoralColony(baseX, baseY, colSeed, {
          coralId: species.id,
          archetype: arch,
          scale: rndtri(0.70, 0.95, 1.25),
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
  // 5. Public Module API
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
