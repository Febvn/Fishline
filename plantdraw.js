/**
 * plantdraw.js - Procedural Mathematical Aquatic Flora & Seaweed Engine
 * Generates sumi-e ink style aquatic vegetation across 7 morphological archetypes:
 * 1. Seagrass (Lamun / Posidonia / Eelgrass)
 * 2. Kelp (Rumput laut besar / Laminaria)
 * 3. Branching Algae (Alga / Ranting bercabang / Naiad / Starhorn)
 * 4. Sheet Algae (Alga lembaran daun selada / Ulva / Large-leaf)
 * 5. Bubble Algae (Alga gelembung mutiara / Valonia Ventricosa)
 * 6. Aquatic Moss (Lumut karpet air / Willow Moss / Fontinalis)
 * 7. Whorled & Fanwort (Daun menjari melingkar / Cabomba / Coontail / Watermilfoil / Hydrilla)
 * 
 * Includes catalog of 40 real botanical species driven by mathematical curves,
 * harmonic current physics, and sumi-e brushwork.
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

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function dist(x0, y0, x1, y1) {
    return Math.hypot(x1 - x0, y1 - y0);
  }

  // -----------------------------------------------------------------
  // 2. Comprehensive Botanical Species Catalog (40 Spesies)
  // -----------------------------------------------------------------
  const ARCHETYPES = {
    SEAGRASS: 0,
    KELP: 1,
    BRANCHING: 2,
    SHEET: 3,
    BUBBLE: 4,
    MOSS: 5,
    WHORLED: 6
  };

  const SPECIES_CATALOG = [
    // --- 1. Seagrass (Lamun) ---
    { id: 'posidonia', common: 'Posidonia Oceanica', binomen: 'Posidonia oceanica', archetype: 0, height: 420, baseW: 14, tipW: 2.0, blades: 9, desc: 'Lamun purba mediterania dengan helai pita panjang kokoh meliuk di dasar laut.' },
    { id: 'eelgrass', common: 'Eelgrass', binomen: 'Zostera marina', archetype: 0, height: 380, baseW: 10, tipW: 1.5, blades: 11, desc: 'Lamun pita ramping berdaun lembut yang membentuk padang lamun tenang.' },
    { id: 'widgeon_grass', common: 'Widgeon Grass', binomen: 'Ruppia maritima', archetype: 0, height: 290, baseW: 7, tipW: 1.2, blades: 12, desc: 'Rumput air payau dengan helai daun sehalus benang sutra.' },
    { id: 'ribbonleaf_pondweed', common: 'Ribbonleaf Pondweed', binomen: 'Potamogeton epihydrus', archetype: 0, height: 340, baseW: 15, tipW: 2.5, blades: 8, desc: 'Pondweed berdaun pita transparan dengan pola serat daun sejajar.' },

    // --- 2. Kelp (Rumput Laut Besar) ---
    { id: 'giant_kelp', common: 'Giant Kelp', binomen: 'Macrocystis pyrifera', archetype: 1, height: 520, baseW: 32, tipW: 6.0, blades: 5, desc: 'Rumput laut raksasa berpelepah tebal dengan bilah bergelombang dan gelembung apung.' },
    { id: 'laminaria', common: 'Oarweed / Kelp Jepang', binomen: 'Laminaria japonica', archetype: 1, height: 440, baseW: 28, tipW: 4.5, blades: 6, desc: 'Kelp sumi-e berdaun lebar mengombak anggun mengikuti pasang surut air laut.' },

    // --- 3. Branching Algae (Alga / Ranting Bercabang) ---
    { id: 'branching_algae', common: 'Branching Coralline Algae', binomen: 'Callithamnion corymbosum', archetype: 2, height: 260, baseW: 12, tipW: 2.0, blades: 7, desc: 'Alga merah bercabang dikotomis menyerupai miniatur koral atau ranting pohon.' },
    { id: 'brittle_naiad', common: 'Brittle Naiad', binomen: 'Najas minor', archetype: 2, height: 240, baseW: 8, tipW: 1.5, blades: 9, desc: 'Tanaman air rapuh bercabang rimbun dengan daun melengkung ke bawah.' },
    { id: 'brittle_waternymph', common: 'Brittle Waternymph', binomen: 'Najas marina', archetype: 2, height: 280, baseW: 10, tipW: 1.8, blades: 8, desc: 'Naiad berduri halus dengan percabangan tegas seperti tanduk rusa air.' },
    { id: 'bushy_pondweed', common: 'Bushy Pondweed / Southern Naiad', binomen: 'Najas guadalupensis', archetype: 2, height: 270, baseW: 9, tipW: 1.6, blades: 10, desc: 'Ranting semak air lebat yang tumbuh bertingkat di sekitar bebatuan dasar.' },
    { id: 'starhorn', common: 'Starhorn', binomen: 'Hypnea musciformis', archetype: 2, height: 250, baseW: 11, tipW: 2.2, blades: 8, desc: 'Alga berujung melengkung seperti kait tanduk bintang yang saling mengait.' },
    { id: 'horned_pondweed', common: 'Horned Pondweed', binomen: 'Zannichellia palustris', archetype: 2, height: 230, baseW: 7, tipW: 1.2, blades: 12, desc: 'Cabang halus bertanduk dengan daun berlawanan yang sangat lentur.' },
    { id: 'sago_pondweed', common: 'Sago Pondweed', binomen: 'Stuckenia pectinata', archetype: 2, height: 350, baseW: 8, tipW: 1.4, blades: 9, desc: 'Percabangan mirip sapu ijuk air halus yang mengembang di arus sungai deras.' },

    // --- 4. Sheet Algae (Alga Lembaran Daun Selada) ---
    { id: 'sea_lettuce', common: 'Sea Lettuce', binomen: 'Ulva lactuca', archetype: 3, height: 280, baseW: 55, tipW: 18.0, blades: 5, desc: 'Alga hijau lembaran tipis berkerut seperti kain sutra atau daun selada mengambang.' },
    { id: 'large_leaf_pondweed', common: 'Large-leaf Pondweed', binomen: 'Potamogeton amplifolius', archetype: 3, height: 360, baseW: 42, tipW: 12.0, blades: 6, desc: 'Pondweed berdaun lebar melengkung bergelombang dengan tekstur tembus pandang.' },
    { id: 'curly_leaf_pondweed', common: 'Curly-leaf Pondweed', binomen: 'Potamogeton crispus', archetype: 3, height: 320, baseW: 26, tipW: 8.0, blades: 7, desc: 'Bilah daun berombak keriting kaku dengan tepi bergerigi halus khas sumi-e.' },
    { id: 'floating_pondweed', common: 'Floating Pondweed', binomen: 'Potamogeton natans', archetype: 3, height: 340, baseW: 36, tipW: 14.0, blades: 6, desc: 'Daun elips oval lebar yang mengalir lembut di permukaan kolom air.' },
    { id: 'illinois_pondweed', common: 'Illinois Pondweed', binomen: 'Potamogeton illinoensis', archetype: 3, height: 380, baseW: 30, tipW: 10.0, blades: 7, desc: 'Bilah lanset lebar bertulang daun tajam dengan lekukan anggun.' },
    { id: 'richardsons_pondweed', common: 'Richardson’s Pondweed', binomen: 'Potamogeton richardsonii', archetype: 3, height: 310, baseW: 24, tipW: 9.0, blades: 8, desc: 'Daun memeluk batang dengan tepi meliuk-liuk seperti pita perca.' },
    { id: 'american_pondweed', common: 'American Pondweed', binomen: 'Potamogeton nodosus', archetype: 3, height: 390, baseW: 38, tipW: 12.0, blades: 6, desc: 'Daun mengambang lonjong dengan tangkai panjang kokoh bertumpu di dasar.' },
    { id: 'spotted_pondweed', common: 'Spotted Pondweed', binomen: 'Potamogeton pulcher', archetype: 3, height: 330, baseW: 34, tipW: 11.0, blades: 7, desc: 'Daun lanset bergelombang dengan corak bintik tinta alami.' },

    // --- 5. Bubble Algae (Alga Gelembung Mutiara) ---
    { id: 'bubble_algae', common: 'Bubble Algae / Sailor’s Eyeball', binomen: 'Valonia ventricosa', archetype: 4, height: 160, baseW: 45, tipW: 25.0, blades: 14, desc: 'Koloni bola gelembung sel tunggal terbesar yang berkilau seperti batu permata zamrud.' },
    { id: 'sea_pearls', common: 'Sea Pearls', binomen: 'Dictyosphaeria cavernosa', archetype: 4, height: 140, baseW: 40, tipW: 20.0, blades: 18, desc: 'Kumpulan mutiara gelembung berpori yang membentuk kubah kristal di atas karang.' },

    // --- 6. Aquatic Moss (Lumut Karpet Air) ---
    { id: 'willow_moss', common: 'Willow Moss', binomen: 'Fontinalis antipyretica', archetype: 5, height: 180, baseW: 24, tipW: 4.0, blades: 24, desc: 'Lumut air berbulu segitiga lebat yang menempel erat pada batu dan akar lapuk.' },
    { id: 'java_moss', common: 'Java Moss', binomen: 'Taxiphyllum barbieri', archetype: 5, height: 160, baseW: 20, tipW: 3.5, blades: 28, desc: 'Karpet lumut mikro bercabang rapat yang membentuk bantalan beludru hijau dasar kolam.' },
    { id: 'baby_pondweed', common: 'Baby Pondweed', binomen: 'Potamogeton pusillus', archetype: 5, height: 200, baseW: 16, tipW: 3.0, blades: 20, desc: 'Rumpun lumut pondweed mini dengan bilah super halus bagai jaring laba-laba air.' },

    // --- 7. Whorled & Fan Leaf Flora (Daun Menjari Melingkar) ---
    { id: 'cabomba', common: 'Cabomba / Fanwort', binomen: 'Cabomba caroliniana', archetype: 6, height: 350, baseW: 14, tipW: 2.0, blades: 8, desc: 'Batang lentur dengan lingkaran daun kipas terbelah halus bagai sayap kupu-kupu air.' },
    { id: 'coontail', common: 'Coontail / Hornwort', binomen: 'Ceratophyllum demersum', archetype: 6, height: 370, baseW: 16, tipW: 2.2, blades: 7, desc: 'Lingkaran daun menjari kaku mirip ekor rakun yang mengapung bebas di air tenang.' },
    { id: 'eurasian_watermilfoil', common: 'Eurasian Watermilfoil', binomen: 'Myriophyllum spicatum', archetype: 6, height: 390, baseW: 15, tipW: 1.8, blades: 8, desc: 'Batang kemerahan dengan 4 daun tersusun melingkar berbulu halus seperti sisir camar.' },
    { id: 'cutleaf_watermilfoil', common: 'Cutleaf Watermilfoil', binomen: 'Myriophyllum pinnatum', archetype: 6, height: 340, baseW: 14, tipW: 1.7, blades: 8, desc: 'Milfoil dengan gerigi helai daun bersirip tajam terbelah rapi.' },
    { id: 'variable_watermilfoil', common: 'Variable-leaf Watermilfoil', binomen: 'Myriophyllum heterophyllum', archetype: 6, height: 360, baseW: 15, tipW: 1.9, blades: 8, desc: 'Daun bawah air yang sangat lebat bertransisi halus mengikuti kedalaman.' },
    { id: 'parrots_feather', common: 'Parrot’s-feather', binomen: 'Myriophyllum aquaticum', archetype: 6, height: 380, baseW: 16, tipW: 2.0, blades: 7, desc: 'Daun bertekstur bulu burung nuri biru kehijauan yang tersusun rapat pada ruas batang.' },
    { id: 'hydrilla', common: 'Hydrilla', binomen: 'Hydrilla verticillata', archetype: 6, height: 360, baseW: 12, tipW: 2.0, blades: 9, desc: 'Batang beruas dengan karangan 5 daun bergerigi tajam memutar mengitari batang.' },
    { id: 'elodea', common: 'Elodea / American Waterweed', binomen: 'Elodea canadensis', archetype: 6, height: 320, baseW: 11, tipW: 2.2, blades: 9, desc: 'Daun hijau tua tersusun tiga-tiga dalam lingkaran rapat melingkari batang.' },
    { id: 'egeria', common: 'Egeria / Brazilian Waterweed', binomen: 'Egeria densa', archetype: 6, height: 350, baseW: 13, tipW: 2.4, blades: 8, desc: 'Karangan daun rapat berkelompok empat atau lebih dengan helai daun berkilap.' },
    { id: 'asian_marshweed', common: 'Asian Marshweed', binomen: 'Limnophila sessiliflora', archetype: 6, height: 330, baseW: 14, tipW: 1.8, blades: 8, desc: 'Daun terbagi menjari halus bagai mahkota krisan air yang merekah mekar.' },
    { id: 'water_wisteria', common: 'Water Wisteria', binomen: 'Hygrophila difformis', archetype: 6, height: 360, baseW: 18, tipW: 3.5, blades: 7, desc: 'Daun bercabang renda mekar yang sangat adaptif terhadap derasnya aliran kolam.' },
    { id: 'east_indian_hygro', common: 'East Indian Hygrophila', binomen: 'Hygrophila polysperma', archetype: 6, height: 310, baseW: 16, tipW: 4.0, blades: 9, desc: 'Daun lonjong berhadapan silang yang tumbuh tegak membentuk rumpun padat.' },
    { id: 'willow_leafed_hygro', common: 'Willow-leafed Hygrophila', binomen: 'Hygrophila salicifolia', archetype: 6, height: 340, baseW: 15, tipW: 3.0, blades: 8, desc: 'Daun memanjang sempit seperti pohon gandarusa atau dedalu air yang menjuntai.' },
    { id: 'waterthread_pondweed', common: 'Waterthread Pondweed', binomen: 'Potamogeton diversifolius', archetype: 6, height: 280, baseW: 9, tipW: 1.4, blades: 11, desc: 'Benang-benang daun bawah air yang sangat tipis dan meliuk elastis.' }
  ];

  function getSpeciesById(id) {
    return SPECIES_CATALOG.find(s => s.id === id) || SPECIES_CATALOG[0];
  }

  function getSpeciesList() {
    return SPECIES_CATALOG.slice();
  }

  function botanical_binomen() {
    return choice(SPECIES_CATALOG).binomen;
  }

  // -----------------------------------------------------------------
  // 3. Mathematical Blade / Frond Model: Archetype 0 (SEAGRASS)
  // -----------------------------------------------------------------
  class SeagrassBlade {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.length = config.length || rndtri(240, 350, 480);
      this.baseWidth = config.baseWidth || rndtri(8, 14, 20);
      this.tipWidth = config.tipWidth || rndtri(1.2, 1.8, 2.5);
      this.segments = config.segments || 22;
      this.phase = rnd(0, PI * 2);
      this.waveFreq = rndtri(0.008, 0.014, 0.022);
      this.waveSpeed = rndtri(1.2, 1.8, 2.5);
      this.naturalSway = rndtri(25, 50, 80);
      this.curl = config.curl !== undefined ? config.curl : rndtri(-0.35, 0.0, 0.35);

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
      this.veinOffsets = [-0.5, -0.2, 0.2, 0.5];
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      const N = this.nodes.length;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const node = this.nodes[i];
        const worldX = rootX + this.offsetX + node.relX;
        const worldY = rootY + node.relY;

        // Current harmonic wave
        const wave = Math.sin(time * this.waveSpeed + this.phase - frac * 3.2) * (this.naturalSway * Math.pow(frac, 1.35));
        const tidal = currentFlow * 70 * Math.pow(frac, 1.5);
        const staticCurl = this.curl * this.length * frac * frac;
        const targetX = wave + tidal + staticCurl;

        // Fish proximity deflection
        let repelForce = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(worldX, worldY, fishX, fishY);
          if (d < 110) {
            const push = (1.0 - d / 110) * 85;
            const dir = (worldX >= fishX) ? 1 : -1;
            repelForce = dir * push * frac;
          }
        }

        // Ripple deflection
        if (ripples && ripples.length > 0) {
          for (let r = 0; r < ripples.length; r++) {
            const rip = ripples[r];
            const rd = dist(worldX, worldY, rip.x, rip.y);
            if (Math.abs(rd - rip.r) < 30) {
              const rFactor = (1.0 - Math.abs(rd - rip.r) / 30) * rip.alpha * 35;
              repelForce += (worldX >= rip.x ? 1 : -1) * rFactor * frac;
            }
          }
        }

        const spring = 8.5;
        const damping = 3.8;
        const accelX = (targetX + repelForce - node.relX) * spring - node.velX * damping;
        node.velX += accelX * dt;
        node.relX += node.velX * dt;
      }
    }

    render(ctx, rootX, rootY, options = {}) {
      const N = this.nodes.length;
      const leftEdge = [];
      const rightEdge = [];
      const centerLine = [];

      for (let i = 0; i < N; i++) {
        const nx = rootX + this.offsetX + this.nodes[i].relX;
        const ny = rootY + this.nodes[i].relY;
        centerLine.push([nx, ny]);

        let tx, ty;
        if (i === 0) {
          tx = this.nodes[1].relX - this.nodes[0].relX;
          ty = this.nodes[1].relY - this.nodes[0].relY;
        } else if (i === N - 1) {
          tx = this.nodes[N - 1].relX - this.nodes[N - 2].relX;
          ty = this.nodes[N - 1].relY - this.nodes[N - 2].relY;
        } else {
          tx = this.nodes[i + 1].relX - this.nodes[i - 1].relX;
          ty = this.nodes[i + 1].relY - this.nodes[i - 1].relY;
        }
        const tLen = Math.hypot(tx, ty) || 1;
        const nxNorm = -ty / tLen;
        const nyNorm = tx / tLen;
        const hw = this.nodes[i].width * 0.5;

        leftEdge.push([nx - nxNorm * hw, ny - nyNorm * hw]);
        rightEdge.push([nx + nxNorm * hw, ny + nyNorm * hw]);
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(leftEdge[0][0], leftEdge[0][1]);
      for (let i = 1; i < N; i++) ctx.lineTo(leftEdge[i][0], leftEdge[i][1]);
      ctx.lineTo(centerLine[N - 1][0], centerLine[N - 1][1]);
      for (let i = N - 1; i >= 0; i--) ctx.lineTo(rightEdge[i][0], rightEdge[i][1]);
      ctx.closePath();

      ctx.fillStyle = options.washColor || 'rgba(38, 54, 46, 0.08)';
      ctx.fill();

      ctx.strokeStyle = options.strokeColor || '#18141f';
      ctx.lineWidth = options.lineWidth || 1.1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(leftEdge[0][0], leftEdge[0][1]);
      for (let i = 1; i < N; i++) ctx.lineTo(leftEdge[i][0], leftEdge[i][1]);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightEdge[0][0], rightEdge[0][1]);
      for (let i = 1; i < N; i++) ctx.lineTo(rightEdge[i][0], rightEdge[i][1]);
      ctx.stroke();

      // Fine longitudinal veins
      if (options.showVeins !== false) {
        ctx.save();
        ctx.lineWidth = Math.max(0.5, (options.lineWidth || 1.0) * 0.5);
        ctx.globalAlpha = 0.55;
        for (const vOff of this.veinOffsets) {
          ctx.beginPath();
          for (let i = 0; i < N - 2; i++) {
            const tParam = (vOff + 1.0) * 0.5;
            const vx = lerp(leftEdge[i][0], rightEdge[i][0], tParam);
            const vy = lerp(leftEdge[i][1], rightEdge[i][1], tParam);
            if (i === 0) ctx.moveTo(vx, vy);
            else ctx.lineTo(vx, vy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 4. Mathematical Kelp Model: Archetype 1 (KELP - Wavy / Crinkled)
  // -----------------------------------------------------------------
  class KelpBlade {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.length = config.length || rndtri(320, 440, 560);
      this.baseWidth = config.baseWidth || rndtri(24, 38, 52);
      this.tipWidth = config.tipWidth || rndtri(4.0, 7.0, 10.0);
      this.segments = config.segments || 24;
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.0, 1.5, 2.0);
      this.naturalSway = rndtri(35, 65, 100);
      this.crinkleFreq = rndtri(6.0, 9.0, 12.0);
      this.crinkleAmp = rndtri(5.0, 9.0, 14.0);

      this.nodes = [];
      const ds = this.length / (this.segments - 1);
      for (let i = 0; i < this.segments; i++) {
        this.nodes.push({
          relX: 0,
          relY: -i * ds,
          velX: 0,
          width: lerp(this.baseWidth, this.tipWidth, Math.pow(i / (this.segments - 1), 0.75))
        });
      }
      // Pneumatocysts (gas bladders at stipe)
      this.bladders = [
        { t: 0.12, r: rndtri(7, 10, 13) },
        { t: 0.22, r: rndtri(8, 12, 15) }
      ];
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      const N = this.nodes.length;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const node = this.nodes[i];
        const worldX = rootX + this.offsetX + node.relX;
        const worldY = rootY + node.relY;

        const wave = Math.sin(time * this.waveSpeed + this.phase - frac * 2.8) * (this.naturalSway * Math.pow(frac, 1.4));
        const tidal = currentFlow * 85 * Math.pow(frac, 1.5);
        const targetX = wave + tidal;

        let repel = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(worldX, worldY, fishX, fishY);
          if (d < 130) {
            repel = ((worldX >= fishX) ? 1 : -1) * (1.0 - d / 130) * 95 * frac;
          }
        }
        node.velX += ((targetX + repel - node.relX) * 7.5 - node.velX * 3.4) * dt;
        node.relX += node.velX * dt;
      }
    }

    render(ctx, rootX, rootY, options = {}) {
      const N = this.nodes.length;
      const leftEdge = [];
      const rightEdge = [];
      const centerLine = [];

      for (let i = 0; i < N; i++) {
        const nx = rootX + this.offsetX + this.nodes[i].relX;
        const ny = rootY + this.nodes[i].relY;
        centerLine.push([nx, ny]);

        let tx = (i < N - 1) ? (this.nodes[i + 1].relX - this.nodes[i].relX) : 0;
        let ty = (i < N - 1) ? (this.nodes[i + 1].relY - this.nodes[i].relY) : -10;
        const tLen = Math.hypot(tx, ty) || 1;
        const nxNorm = -ty / tLen;
        const nyNorm = tx / tLen;

        // Crinkled / ruffled margin fluctuation
        const frac = i / (N - 1);
        const crinkle = Math.sin(frac * this.crinkleFreq * PI + this.phase) * this.crinkleAmp * (1 - Math.abs(frac - 0.5) * 0.4);
        const hw = (this.nodes[i].width * 0.5) + crinkle;

        leftEdge.push([nx - nxNorm * hw, ny - nyNorm * hw]);
        rightEdge.push([nx + nxNorm * hw, ny + nyNorm * hw]);
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(leftEdge[0][0], leftEdge[0][1]);
      for (let i = 1; i < N; i++) ctx.lineTo(leftEdge[i][0], leftEdge[i][1]);
      ctx.lineTo(centerLine[N - 1][0], centerLine[N - 1][1]);
      for (let i = N - 1; i >= 0; i--) ctx.lineTo(rightEdge[i][0], rightEdge[i][1]);
      ctx.closePath();

      ctx.fillStyle = options.washColor || 'rgba(38, 54, 46, 0.08)';
      ctx.fill();

      ctx.strokeStyle = options.strokeColor || '#18141f';
      ctx.lineWidth = options.lineWidth || 1.1;

      // Draw undulating boundaries
      ctx.beginPath();
      ctx.moveTo(leftEdge[0][0], leftEdge[0][1]);
      for (let i = 1; i < N; i++) ctx.lineTo(leftEdge[i][0], leftEdge[i][1]);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightEdge[0][0], rightEdge[0][1]);
      for (let i = 1; i < N; i++) ctx.lineTo(rightEdge[i][0], rightEdge[i][1]);
      ctx.stroke();

      // Strong central midrib stipe
      ctx.lineWidth = Math.max(0.7, (options.lineWidth || 1.1) * 0.8);
      ctx.beginPath();
      ctx.moveTo(centerLine[0][0], centerLine[0][1]);
      for (let i = 1; i < N; i++) ctx.lineTo(centerLine[i][0], centerLine[i][1]);
      ctx.stroke();

      // Draw gas bladders (pneumatocysts)
      for (const bl of this.bladders) {
        const idx = Math.floor(bl.t * (N - 1));
        const bx = centerLine[idx][0] + (idx % 2 === 0 ? -1 : 1) * (this.nodes[idx].width * 0.35);
        const by = centerLine[idx][1];
        ctx.beginPath();
        ctx.ellipse(bx, by, bl.r, bl.r * 1.35, 0.1, 0, PI * 2);
        ctx.fillStyle = options.washColor || 'rgba(38, 54, 46, 0.15)';
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 5. Mathematical Branching Model: Archetype 2 (BRANCHING ALGAE)
  // -----------------------------------------------------------------
  class BranchingFlora {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.height = config.length || rndtri(200, 270, 340);
      this.baseWidth = config.baseWidth || 10;
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.2, 1.8, 2.4);

      // Hierarchical fractal branch hierarchy
      this.branches = [];
      const numBranches = Math.floor(rnd(5, 9));
      for (let i = 0; i < numBranches; i++) {
        const t = lerp(0.2, 0.9, i / (numBranches - 1));
        const side = (i % 2 === 0 ? 1 : -1);
        const bLen = rndtri(45, 80, 115) * (1.1 - t * 0.5);
        const angle = side * rndtri(0.45, 0.75, 1.05);

        // Sub-twigs (tertiary twigs)
        const twigs = [];
        const numTwigs = Math.floor(rnd(2, 5));
        for (let j = 0; j < numTwigs; j++) {
          twigs.push({
            t: lerp(0.35, 0.9, j / (numTwigs - 1)),
            side: (j % 2 === 0 ? 1 : -1),
            len: bLen * rndtri(0.3, 0.45, 0.6),
            angle: (j % 2 === 0 ? 1 : -1) * rndtri(0.3, 0.6, 0.8)
          });
        }

        this.branches.push({
          t, side, bLen, angle, twigs,
          swayOffset: 0
        });
      }
      this.currentStemX = 0;
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      const sway = Math.sin(time * this.waveSpeed + this.phase) * 35 + currentFlow * 50;
      let repel = 0;
      if (fishX !== undefined && fishY !== undefined && fishX > -500) {
        const d = dist(rootX + this.offsetX, rootY - this.height * 0.5, fishX, fishY);
        if (d < 120) repel = ((rootX >= fishX) ? 1 : -1) * (1.0 - d / 120) * 60;
      }
      this.currentStemX += ((sway + repel - this.currentStemX) * 7.0) * dt;

      for (let i = 0; i < this.branches.length; i++) {
        const b = this.branches[i];
        const bSway = Math.sin(time * (this.waveSpeed * 1.3) + this.phase + i) * 12;
        b.swayOffset += (bSway - b.swayOffset) * 8.0 * dt;
      }
    }

    render(ctx, rootX, rootY, options = {}) {
      ctx.save();
      ctx.strokeStyle = options.strokeColor || '#18141f';
      ctx.lineWidth = options.lineWidth || 1.1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const bx = rootX + this.offsetX;
      const by = rootY;
      const tipX = bx + this.currentStemX;
      const tipY = by - this.height;
      const cpX = bx + this.currentStemX * 0.4;
      const cpY = by - this.height * 0.55;

      // Draw main curved trunk
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
      ctx.stroke();

      // Draw secondary branches & sub-twigs
      for (const b of this.branches) {
        const t = b.t;
        const mt = 1 - t;
        const nodeX = mt * mt * bx + 2 * mt * t * cpX + t * t * tipX;
        const nodeY = mt * mt * by + 2 * mt * t * cpY + t * t * tipY;

        const bTipX = nodeX + Math.sin(b.angle) * b.bLen + b.swayOffset * b.side;
        const bTipY = nodeY - Math.cos(b.angle) * b.bLen;

        ctx.beginPath();
        ctx.moveTo(nodeX, nodeY);
        ctx.lineTo(bTipX, bTipY);
        ctx.stroke();

        // Tertiary twigs
        for (const tw of b.twigs) {
          const twNodeX = lerp(nodeX, bTipX, tw.t);
          const twNodeY = lerp(nodeY, bTipY, tw.t);
          const twTipX = twNodeX + Math.sin(b.angle + tw.angle) * tw.len;
          const twTipY = twNodeY - Math.cos(b.angle + tw.angle) * tw.len;

          ctx.beginPath();
          ctx.moveTo(twNodeX, twNodeY);
          ctx.lineTo(twTipX, twTipY);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 6. Mathematical Sheet Algae Model: Archetype 3 (SHEET / ULVA)
  // -----------------------------------------------------------------
  class SheetAlgaeFlora {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.height = config.length || rndtri(260, 360, 440);
      this.width = config.baseWidth || rndtri(45, 75, 110);
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.0, 1.4, 1.9);

      // Radial lobes (sheets / ruffled leaves)
      this.lobes = [];
      const numLobes = Math.floor(rnd(3, 6));
      for (let i = 0; i < numLobes; i++) {
        this.lobes.push({
          len: this.height * rndtri(0.7, 1.0, 1.2),
          width: this.width * rndtri(0.65, 1.0, 1.3),
          curl: rndtri(-0.35, 0, 0.35),
          ruffleFreq: rndtri(5, 8, 11),
          ruffleAmp: rndtri(6, 12, 18),
          swayX: 0
        });
      }
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      for (let i = 0; i < this.lobes.length; i++) {
        const lb = this.lobes[i];
        const sway = Math.sin(time * this.waveSpeed + this.phase + i * 1.2) * 45 + currentFlow * 65;
        let repel = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(rootX + this.offsetX, rootY - lb.len * 0.5, fishX, fishY);
          if (d < 140) repel = ((rootX >= fishX) ? 1 : -1) * (1.0 - d / 140) * 80;
        }
        lb.swayX += ((sway + repel - lb.swayX) * 6.5) * dt;
      }
    }

    render(ctx, rootX, rootY, options = {}) {
      ctx.save();
      const bx = rootX + this.offsetX;
      const by = rootY;

      for (let k = 0; k < this.lobes.length; k++) {
        const lb = this.lobes[k];
        const tipX = bx + lb.swayX + lb.curl * 50;
        const tipY = by - lb.len;
        const midY = by - lb.len * 0.52;
        const hw = lb.width * 0.5;

        // Ruffled veil contour
        ctx.beginPath();
        ctx.moveTo(bx, by);

        // Left ruffled border
        for (let t = 0; t <= 10; t++) {
          const frac = t / 10;
          const ruff = Math.sin(frac * lb.ruffleFreq * PI) * lb.ruffleAmp;
          const lx = lerp(bx, tipX - hw + ruff, frac);
          const ly = lerp(by, tipY, frac);
          ctx.lineTo(lx, ly);
        }

        ctx.lineTo(tipX, tipY);

        // Right ruffled border
        for (let t = 10; t >= 0; t--) {
          const frac = t / 10;
          const ruff = Math.sin(frac * lb.ruffleFreq * PI + PI) * lb.ruffleAmp;
          const rx = lerp(bx, tipX + hw + ruff, frac);
          const ry = lerp(by, tipY, frac);
          ctx.lineTo(rx, ry);
        }
        ctx.closePath();

        // Translucent multilayer wash
        ctx.fillStyle = options.washColor || 'rgba(38, 64, 48, 0.10)';
        ctx.fill();

        ctx.strokeStyle = options.strokeColor || '#18141f';
        ctx.lineWidth = (options.lineWidth || 1.1) * 0.9;
        ctx.stroke();

        // Radiating silk wrinkles
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = Math.max(0.5, (options.lineWidth || 1.0) * 0.5);
        for (let r = -2; r <= 2; r++) {
          ctx.beginPath();
          ctx.moveTo(bx, by);
          const rTipX = tipX + (r / 2.5) * hw;
          ctx.quadraticCurveTo(bx + lb.swayX * 0.4 + r * 8, midY, rTipX, tipY);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 7. Mathematical Bubble Model: Archetype 4 (BUBBLE ALGAE / VALONIA)
  // -----------------------------------------------------------------
  class BubbleAlgaeFlora {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.2, 1.8, 2.5);

      // Spherical vesicle cluster
      this.bubbles = [];
      const numBubbles = Math.floor(rnd(9, 18));
      const spanW = rndtri(35, 60, 85);
      for (let i = 0; i < numBubbles; i++) {
        const offX = rndtri(-spanW * 0.5, 0, spanW * 0.5);
        const offY = -rndtri(4, 30, 65) - Math.abs(offX) * 0.25;
        const radius = rndtri(7, 14, 24) * (1.1 - Math.abs(offX) / (spanW * 0.6) * 0.4);
        this.bubbles.push({
          relX: offX,
          relY: offY,
          r: radius,
          bobPhase: rnd(0, PI * 2),
          bobOffset: 0
        });
      }
      // Sort bubbles by radius so small ones render in front/around
      this.bubbles.sort((a, b) => b.r - a.r);
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      for (const b of this.bubbles) {
        const bob = Math.sin(time * this.waveSpeed + b.bobPhase) * 4;
        let repel = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(rootX + this.offsetX + b.relX, rootY + b.relY, fishX, fishY);
          if (d < 70) repel = (1.0 - d / 70) * 12;
        }
        b.bobOffset += (bob + repel - b.bobOffset) * 6.0 * dt;
      }
    }

    render(ctx, rootX, rootY, options = {}) {
      ctx.save();
      const bx = rootX + this.offsetX;
      const by = rootY;

      for (const b of this.bubbles) {
        const cx = bx + b.relX;
        const cy = by + b.relY + b.bobOffset;
        const r = b.r;

        // Base vesicle sphere
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, PI * 2);
        ctx.fillStyle = options.washColor || 'rgba(40, 75, 55, 0.16)';
        ctx.fill();

        ctx.strokeStyle = options.strokeColor || '#18141f';
        ctx.lineWidth = options.lineWidth || 1.1;
        ctx.stroke();

        // Specular highlight crescent
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx - r * 0.32, cy - r * 0.32, r * 0.38, 0, PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fill();

        // Inner shadow crescent
        ctx.beginPath();
        ctx.arc(cx + r * 0.25, cy + r * 0.25, r * 0.55, 0, PI * 2);
        ctx.fillStyle = options.washColor || 'rgba(20, 36, 26, 0.15)';
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 8. Mathematical Moss Model: Archetype 5 (AQUATIC MOSS / CARPET)
  // -----------------------------------------------------------------
  class AquaticMossFlora {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.5, 2.2, 3.0);

      // Dense carpet filament tufts
      this.tufts = [];
      const numTufts = Math.floor(rnd(18, 32));
      const spanW = rndtri(40, 70, 95);
      for (let i = 0; i < numTufts; i++) {
        const offX = rndtri(-spanW * 0.5, 0, spanW * 0.5);
        const len = rndtri(28, 55, 85) * (1.0 - Math.abs(offX) / (spanW * 0.6) * 0.35);
        const angle = rndtri(-0.45, 0, 0.45);
        const numMicroLeaves = Math.floor(rnd(6, 12));

        this.tufts.push({
          offX,
          len,
          angle,
          numMicroLeaves,
          swayX: 0
        });
      }
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      for (let i = 0; i < this.tufts.length; i++) {
        const tf = this.tufts[i];
        const sway = Math.sin(time * this.waveSpeed + this.phase + i * 0.4) * 14 + currentFlow * 25;
        let repel = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(rootX + this.offsetX + tf.offX, rootY - tf.len * 0.5, fishX, fishY);
          if (d < 85) repel = ((rootX >= fishX) ? 1 : -1) * (1.0 - d / 85) * 35;
        }
        tf.swayX += (sway + repel - tf.swayX) * 9.0 * dt;
      }
    }

    render(ctx, rootX, rootY, options = {}) {
      ctx.save();
      ctx.strokeStyle = options.strokeColor || '#18141f';
      ctx.lineWidth = Math.max(0.6, (options.lineWidth || 1.1) * 0.65);
      ctx.lineCap = 'round';

      const bx = rootX + this.offsetX;
      const by = rootY;

      for (const tf of this.tufts) {
        const tipX = bx + tf.offX + tf.swayX + Math.sin(tf.angle) * tf.len;
        const tipY = by - tf.len;

        // Stem filament
        ctx.beginPath();
        ctx.moveTo(bx + tf.offX, by);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Biserial micro-leaflets
        for (let j = 0; j < tf.numMicroLeaves; j++) {
          const frac = (j + 1) / (tf.numMicroLeaves + 1);
          const lx = lerp(bx + tf.offX, tipX, frac);
          const ly = lerp(by, tipY, frac);
          const side = (j % 2 === 0 ? 1 : -1);
          const leafLen = 4.5 * (1 - frac * 0.5);

          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx + side * leafLen, ly - 2.5);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 9. Mathematical Whorled Model: Archetype 6 (CABOMBA / FANWORT)
  // -----------------------------------------------------------------
  class WhorledFanFlora {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.height = config.length || rndtri(280, 380, 480);
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.1, 1.6, 2.2);

      // Nodal stem whorls
      this.whorls = [];
      const numWhorls = Math.floor(rnd(6, 11));
      for (let i = 0; i < numWhorls; i++) {
        const t = lerp(0.18, 0.95, i / (numWhorls - 1));
        const fanRadius = rndtri(22, 38, 54) * (1.1 - t * 0.4);
        const fanRays = Math.floor(rnd(5, 8));

        this.whorls.push({
          t,
          fanRadius,
          fanRays
        });
      }
      this.stemNodes = [];
      const segs = 18;
      const ds = this.height / (segs - 1);
      for (let i = 0; i < segs; i++) {
        this.stemNodes.push({ relX: 0, relY: -i * ds, velX: 0 });
      }
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      const N = this.stemNodes.length;
      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const node = this.stemNodes[i];
        const worldX = rootX + this.offsetX + node.relX;
        const worldY = rootY + node.relY;

        const wave = Math.sin(time * this.waveSpeed + this.phase - frac * 3.0) * (50 * Math.pow(frac, 1.4));
        const tidal = currentFlow * 75 * Math.pow(frac, 1.5);
        const targetX = wave + tidal;

        let repel = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(worldX, worldY, fishX, fishY);
          if (d < 120) repel = ((worldX >= fishX) ? 1 : -1) * (1.0 - d / 120) * 85 * frac;
        }
        node.velX += ((targetX + repel - node.relX) * 7.5 - node.velX * 3.5) * dt;
        node.relX += node.velX * dt;
      }
    }

    render(ctx, rootX, rootY, options = {}) {
      const N = this.stemNodes.length;
      ctx.save();
      ctx.strokeStyle = options.strokeColor || '#18141f';
      ctx.lineWidth = options.lineWidth || 1.1;

      // Draw central jointed stem
      ctx.beginPath();
      ctx.moveTo(rootX + this.offsetX + this.stemNodes[0].relX, rootY + this.stemNodes[0].relY);
      for (let i = 1; i < N; i++) {
        ctx.lineTo(rootX + this.offsetX + this.stemNodes[i].relX, rootY + this.stemNodes[i].relY);
      }
      ctx.stroke();

      // Draw radial dissected fan whorls
      for (const wh of this.whorls) {
        const idx = Math.min(N - 2, Math.floor(wh.t * (N - 1)));
        const frac = (wh.t * (N - 1)) - idx;
        const wx = rootX + this.offsetX + lerp(this.stemNodes[idx].relX, this.stemNodes[idx + 1].relX, frac);
        const wy = rootY + lerp(this.stemNodes[idx].relY, this.stemNodes[idx + 1].relY, frac);

        // Fan spokes on left and right
        [-1, 1].forEach(side => {
          for (let r = 0; r < wh.fanRays; r++) {
            const rayAngle = (r / (wh.fanRays - 1) - 0.5) * 1.35;
            const rLen = wh.fanRadius * (1 - Math.abs(r / (wh.fanRays - 1) - 0.5) * 0.3);
            const rTipX = wx + side * Math.cos(rayAngle) * rLen;
            const rTipY = wy - Math.sin(rayAngle) * (rLen * 0.6) - 5;

            ctx.beginPath();
            ctx.moveTo(wx, wy);
            ctx.lineTo(rTipX, rTipY);
            ctx.stroke();

            // Dichotomous fork at ray tip
            const forkLen = rLen * 0.35;
            ctx.beginPath();
            ctx.moveTo(rTipX, rTipY);
            ctx.lineTo(rTipX + side * forkLen * 0.8, rTipY - forkLen * 0.6);
            ctx.moveTo(rTipX, rTipY);
            ctx.lineTo(rTipX + side * forkLen * 0.4, rTipY + forkLen * 0.6);
            ctx.stroke();
          }
        });
      }
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 10. Unified Botanical Plant Cluster (Rumpun Tanaman Air)
  // -----------------------------------------------------------------
  class PlantCluster {
    constructor(x, y, seed, options = {}) {
      this.x = x;
      this.y = y;
      this.seed = seed || botanical_binomen();
      set_seed(this.seed);

      // Determine species profile
      let profile = SPECIES_CATALOG.find(s => s.id === options.speciesId || s.binomen === this.seed || s.common === this.seed);
      if (!profile) {
        const parsedArch = options.archetype !== undefined ? options.archetype : choice([0, 1, 2, 3, 4, 5, 6]);
        profile = choice(SPECIES_CATALOG.filter(s => s.archetype === parsedArch)) || SPECIES_CATALOG[0];
      }

      this.species = profile;
      this.speciesName = profile.binomen;
      this.archetype = profile.archetype;
      this.scale = options.scale || rndtri(0.8, 1.0, 1.25);

      this.blades = [];
      this.structures = [];

      // Construct structures according to morphological archetype
      const count = options.bladeCount || profile.blades;
      const spanW = rndtri(25, 50, 75);

      if (this.archetype === ARCHETYPES.SEAGRASS) {
        for (let i = 0; i < count; i++) {
          const offX = rndtri(-spanW * 0.5, 0, spanW * 0.5);
          this.blades.push(new SeagrassBlade(this, {
            offsetX: offX,
            length: profile.height * this.scale * (1.0 - Math.abs(offX) / (spanW * 0.6) * 0.35),
            baseWidth: profile.baseW * this.scale,
            tipWidth: profile.tipW,
            curl: options.curl !== undefined ? options.curl : rndtri(-0.35, 0, 0.35)
          }));
        }
      } else if (this.archetype === ARCHETYPES.KELP) {
        for (let i = 0; i < count; i++) {
          const offX = rndtri(-spanW * 0.4, 0, spanW * 0.4);
          this.blades.push(new KelpBlade(this, {
            offsetX: offX,
            length: profile.height * this.scale * (1.0 - Math.abs(offX) / (spanW * 0.5) * 0.25),
            baseWidth: profile.baseW * this.scale,
            tipWidth: profile.tipW
          }));
        }
      } else if (this.archetype === ARCHETYPES.BRANCHING) {
        for (let i = 0; i < Math.max(2, Math.floor(count * 0.5)); i++) {
          const offX = rndtri(-spanW * 0.4, 0, spanW * 0.4);
          this.structures.push(new BranchingFlora(this, {
            offsetX: offX,
            length: profile.height * this.scale,
            baseWidth: profile.baseW
          }));
        }
      } else if (this.archetype === ARCHETYPES.SHEET) {
        for (let i = 0; i < Math.max(2, Math.floor(count * 0.5)); i++) {
          const offX = rndtri(-spanW * 0.3, 0, spanW * 0.3);
          this.structures.push(new SheetAlgaeFlora(this, {
            offsetX: offX,
            length: profile.height * this.scale,
            baseWidth: profile.baseW * this.scale
          }));
        }
      } else if (this.archetype === ARCHETYPES.BUBBLE) {
        this.structures.push(new BubbleAlgaeFlora(this, {
          offsetX: 0
        }));
      } else if (this.archetype === ARCHETYPES.MOSS) {
        this.structures.push(new AquaticMossFlora(this, {
          offsetX: 0
        }));
      } else if (this.archetype === ARCHETYPES.WHORLED) {
        for (let i = 0; i < Math.max(2, Math.floor(count * 0.6)); i++) {
          const offX = rndtri(-spanW * 0.4, 0, spanW * 0.4);
          this.structures.push(new WhorledFanFlora(this, {
            offsetX: offX,
            length: profile.height * this.scale
          }));
        }
      }

      // Root holdfast pebble / rock
      this.rockRadiusX = rndtri(16, 26, 40) * this.scale;
      this.rockRadiusY = rndtri(9, 15, 22) * this.scale;
    }

    update(dt, time, fishX, fishY, ripples, ambientCurrent = 0) {
      for (let i = 0; i < this.blades.length; i++) {
        this.blades[i].update(dt, time, this.x, this.y, ambientCurrent, fishX, fishY, ripples);
      }
      for (let i = 0; i < this.structures.length; i++) {
        this.structures[i].update(dt, time, this.x, this.y, ambientCurrent, fishX, fishY, ripples);
      }
    }

    render(ctx, options = {}) {
      ctx.save();

      // 1. Draw Anchor Pebble / Holdfast washi stone
      if (options.stoneWash !== 'transparent') {
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.rockRadiusX, this.rockRadiusY, 0, 0, PI * 2);
        ctx.fillStyle = options.stoneWash || 'rgba(30, 26, 36, 0.08)';
        ctx.fill();
        ctx.strokeStyle = options.strokeColor || '#18141f';
        ctx.lineWidth = (options.lineWidth || 1.1) * 0.9;
        ctx.stroke();
      }

      // 2. Render Blades & Botanical Structures
      for (let i = 0; i < this.blades.length; i++) {
        this.blades[i].render(ctx, this.x, this.y, options);
      }
      for (let i = 0; i < this.structures.length; i++) {
        this.structures[i].render(ctx, this.x, this.y, options);
      }

      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 11. High-Level Flora Colony Ecosystem Manager
  // -----------------------------------------------------------------
  class PlantColony {
    constructor(options = {}) {
      this.clusters = [];
      this.time = 0;
      this.ambientCurrent = 0;
      this.seed = options.seed || 'Sumi-e Flora Colony';
      this.init(options.width || 1200, options.height || 800, options.count || 7);
    }

    init(width, height, count = 7) {
      set_seed(this.seed);
      this.clusters = [];
      this.width = width;
      this.height = height;

      // Distribute a rich diversity of archetypes across the seabed
      const margin = 80;
      const step = (width - margin * 2) / (count - 1);
      const archetypesPool = [0, 1, 2, 3, 4, 5, 6];

      for (let i = 0; i < count; i++) {
        const baseX = margin + i * step + rndtri(-30, 0, 30);
        const baseY = height + rndtri(-12, 4, 18);
        const clusterSeed = `${this.seed}_cluster_${i}`;
        const arch = archetypesPool[i % archetypesPool.length];
        const species = choice(SPECIES_CATALOG.filter(s => s.archetype === arch)) || SPECIES_CATALOG[0];

        const cluster = new PlantCluster(baseX, baseY, clusterSeed, {
          speciesId: species.id,
          archetype: arch,
          scale: rndtri(0.75, 1.0, 1.25)
        });
        this.clusters.push(cluster);
      }
    }

    resize(width, height) {
      this.init(width, height, this.clusters.length || 7);
    }

    update(dt, fishX, fishY, ripples) {
      this.time += dt;
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

  // -----------------------------------------------------------------
  // 12. Public Module API
  // -----------------------------------------------------------------
  return {
    set_seed,
    botanical_binomen,
    ARCHETYPES,
    SPECIES_CATALOG,
    getSpeciesById,
    getSpeciesList,
    SeagrassBlade,
    KelpBlade,
    BranchingFlora,
    SheetAlgaeFlora,
    BubbleAlgaeFlora,
    AquaticMossFlora,
    WhorledFanFlora,
    PlantCluster,
    PlantColony,
    createColony: function (options) {
      return new PlantColony(options);
    }
  };
});
