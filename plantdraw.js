/**
 * plantdraw.js - Procedural Mathematical Aquatic Flora & Seaweed Engine
 * Generates sumi-e ink style aquatic vegetation across 7 morphological archetypes:
 * 1. Seagrass (Lamun / Posidonia / Eelgrass) [FAVORITE - Enhanced with organic height/width variance]
 * 2. Kelp (Rumput laut besar / Laminaria) [REDESIGNED - Supple stipe, crinkled undulating frills, 3D ribbon twist, pneumatocysts, rugae]
 * 3. Branching Algae (Alga / Ranting bercabang / Naiad / Starhorn) [FAVORITE - Enhanced with fractal bifurcations]
 * 4. Sheet Algae (Alga lembaran selada air / Ulva) [REDESIGNED - Bilangan ruffled folia, silk-like translucent drape, Bézier perimeter]
 * 5. Bubble Algae (Alga gelembung / Valonia) [REDESIGNED - Grapelike pearl clusters, emerald gradient wash, specular gleam, holdfast stalks]
 * 6. Aquatic Moss (Lumut karpet air / Willow Moss) [FAVORITE - Enhanced dense feathery velvet filaments]
 * 7. Whorled & Fanwort (Cabomba / Coontail / Watermilfoil) [REDESIGNED - Sinusoidal supple stem, multi-tiered radial fan whorls, dichotomous rays]
 * 
 * Features deep organic randomization of width, height, density, and curvature for natural realism.
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
  // 2. Botanical Species Catalog (40 Spesies)
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
    // --- 1. Seagrass (Lamun) [FAVORITE] ---
    { id: 'posidonia', common: 'Posidonia Oceanica', binomen: 'Posidonia oceanica', archetype: 0, height: 420, baseW: 15, tipW: 2.0, blades: 10, desc: 'Lamun purba Mediterania dengan helai pita panjang kokoh meliuk di dasar laut.' },
    { id: 'eelgrass', common: 'Eelgrass', binomen: 'Zostera marina', archetype: 0, height: 380, baseW: 11, tipW: 1.6, blades: 12, desc: 'Lamun pita ramping berdaun lembut yang membentuk padang lamun tenang.' },
    { id: 'widgeon_grass', common: 'Widgeon Grass', binomen: 'Ruppia maritima', archetype: 0, height: 290, baseW: 8, tipW: 1.2, blades: 14, desc: 'Rumput air payau dengan helai daun sehalus benang sutra.' },
    { id: 'ribbonleaf_pondweed', common: 'Ribbonleaf Pondweed', binomen: 'Potamogeton epihydrus', archetype: 0, height: 340, baseW: 16, tipW: 2.4, blades: 9, desc: 'Pondweed berdaun pita transparan dengan pola serat daun sejajar.' },

    // --- 2. Kelp (Rumput Laut Besar) [REDESIGNED] ---
    { id: 'giant_kelp', common: 'Giant Kelp', binomen: 'Macrocystis pyrifera', archetype: 1, height: 530, baseW: 42, tipW: 7.0, blades: 5, desc: 'Kelp raksasa berpelepah tebal dengan bilah berombak kerut dinamis dan stipe lentur.' },
    { id: 'laminaria', common: 'Oarweed / Kelp Jepang', binomen: 'Laminaria japonica', archetype: 1, height: 450, baseW: 38, tipW: 5.5, blades: 6, desc: 'Kelp sumi-e berdaun lebar mengombak anggun mengikuti pasang surut air laut.' },

    // --- 3. Branching Algae (Alga / Ranting Bercabang) [FAVORITE] ---
    { id: 'branching_algae', common: 'Branching Coralline Algae', binomen: 'Callithamnion corymbosum', archetype: 2, height: 270, baseW: 13, tipW: 2.0, blades: 8, desc: 'Alga merah bercabang dikotomis menyerupai miniatur koral atau ranting pohon air.' },
    { id: 'brittle_naiad', common: 'Brittle Naiad', binomen: 'Najas minor', archetype: 2, height: 250, baseW: 9, tipW: 1.5, blades: 10, desc: 'Tanaman air rapuh bercabang rimbun dengan daun melengkung ke bawah.' },
    { id: 'brittle_waternymph', common: 'Brittle Waternymph', binomen: 'Najas marina', archetype: 2, height: 290, baseW: 11, tipW: 1.8, blades: 9, desc: 'Naiad berduri halus dengan percabangan tegas seperti tanduk rusa air.' },
    { id: 'bushy_pondweed', common: 'Bushy Pondweed / Southern Naiad', binomen: 'Najas guadalupensis', archetype: 2, height: 280, baseW: 10, tipW: 1.6, blades: 11, desc: 'Ranting semak air lebat yang tumbuh bertingkat di sekitar bebatuan dasar.' },
    { id: 'starhorn', common: 'Starhorn', binomen: 'Hypnea musciformis', archetype: 2, height: 260, baseW: 12, tipW: 2.2, blades: 9, desc: 'Alga berujung melengkung seperti kait tanduk bintang yang saling mengait.' },
    { id: 'horned_pondweed', common: 'Horned Pondweed', binomen: 'Zannichellia palustris', archetype: 2, height: 240, baseW: 8, tipW: 1.2, blades: 13, desc: 'Cabang halus bertanduk dengan daun berlawanan yang sangat lentur.' },
    { id: 'sago_pondweed', common: 'Sago Pondweed', binomen: 'Stuckenia pectinata', archetype: 2, height: 360, baseW: 9, tipW: 1.4, blades: 10, desc: 'Percabangan mirip sapu ijuk air halus yang mengembang di arus sungai deras.' },

    // --- 4. Sheet Algae (Alga Lembaran Daun Selada) [REDESIGNED] ---
    { id: 'sea_lettuce', common: 'Sea Lettuce', binomen: 'Ulva lactuca', archetype: 3, height: 300, baseW: 75, tipW: 22.0, blades: 5, desc: 'Alga lembaran berkerut tipis bagai kain sutra melayang dengan tepi selada bergelombang.' },
    { id: 'large_leaf_pondweed', common: 'Large-leaf Pondweed', binomen: 'Potamogeton amplifolius', archetype: 3, height: 380, baseW: 65, tipW: 18.0, blades: 6, desc: 'Pondweed berdaun lebar melengkung tembus pandang dengan lipatan selada air anggun.' },
    { id: 'curly_leaf_pondweed', common: 'Curly-leaf Pondweed', binomen: 'Potamogeton crispus', archetype: 3, height: 330, baseW: 45, tipW: 12.0, blades: 7, desc: 'Bilah daun berombak keriting kaku dengan arsir bergerigi halus khas sumi-e.' },
    { id: 'floating_pondweed', common: 'Floating Pondweed', binomen: 'Potamogeton natans', archetype: 3, height: 350, baseW: 55, tipW: 16.0, blades: 6, desc: 'Lembaran daun elips oval lebar yang mengalir anggun di kolom air.' },
    { id: 'illinois_pondweed', common: 'Illinois Pondweed', binomen: 'Potamogeton illinoensis', archetype: 3, height: 390, baseW: 52, tipW: 14.0, blades: 7, desc: 'Bilah daun lanset lebar bertulang daun tajam dengan lekukan tirai.' },
    { id: 'richardsons_pondweed', common: 'Richardson’s Pondweed', binomen: 'Potamogeton richardsonii', archetype: 3, height: 320, baseW: 46, tipW: 13.0, blades: 8, desc: 'Daun memeluk batang dengan tepi meliuk-liuk seperti pita perca.' },
    { id: 'american_pondweed', common: 'American Pondweed', binomen: 'Potamogeton nodosus', archetype: 3, height: 400, baseW: 58, tipW: 17.0, blades: 6, desc: 'Daun mengambang lonjong dengan tangkai panjang kokoh bertumpu di dasar.' },
    { id: 'spotted_pondweed', common: 'Spotted Pondweed', binomen: 'Potamogeton pulcher', archetype: 3, height: 340, baseW: 50, tipW: 15.0, blades: 7, desc: 'Daun lanset bergelombang dengan corak bintik tinta alami.' },

    // --- 5. Bubble Algae (Alga Gelembung Mutiara) [REDESIGNED] ---
    { id: 'bubble_algae', common: 'Bubble Algae / Sailor’s Eyeball', binomen: 'Valonia ventricosa', archetype: 4, height: 180, baseW: 55, tipW: 28.0, blades: 16, desc: 'Koloni mutiara gelembung zamrud berkilau dengan pantulan cahaya specular dan tangkai holdfast.' },
    { id: 'sea_pearls', common: 'Sea Pearls', binomen: 'Dictyosphaeria cavernosa', archetype: 4, height: 160, baseW: 48, tipW: 24.0, blades: 20, desc: 'Kumpulan mutiara gelembung berpori yang membentuk kubah kristal anggun.' },

    // --- 6. Aquatic Moss (Lumut Karpet Air) [FAVORITE] ---
    { id: 'willow_moss', common: 'Willow Moss', binomen: 'Fontinalis antipyretica', archetype: 5, height: 190, baseW: 28, tipW: 4.5, blades: 26, desc: 'Lumut air berbulu segitiga lebat yang menempel erat pada batu dan akar lapuk.' },
    { id: 'java_moss', common: 'Java Moss', binomen: 'Taxiphyllum barbieri', archetype: 5, height: 170, baseW: 24, tipW: 4.0, blades: 30, desc: 'Karpet lumut mikro bercabang rapat yang membentuk bantalan beludru hijau dasar kolam.' },
    { id: 'baby_pondweed', common: 'Baby Pondweed', binomen: 'Potamogeton pusillus', archetype: 5, height: 210, baseW: 18, tipW: 3.2, blades: 22, desc: 'Rumpun lumut pondweed mini dengan bilah super halus bagai jaring sutra air.' },

    // --- 7. Whorled & Fan Leaf Flora (Cabomba / Coontail) [REDESIGNED] ---
    { id: 'cabomba', common: 'Cabomba / Fanwort', binomen: 'Cabomba caroliniana', archetype: 6, height: 370, baseW: 16, tipW: 2.2, blades: 8, desc: 'Batang sinusoidal lentur dengan pusaran daun kipas bertingkat bercabang renda mekar.' },
    { id: 'coontail', common: 'Coontail / Hornwort', binomen: 'Ceratophyllum demersum', archetype: 6, height: 390, baseW: 18, tipW: 2.4, blades: 8, desc: 'Pusaran daun menjari rapat mirip bulu ekor rakun yang mengapung anggun di air tenang.' },
    { id: 'eurasian_watermilfoil', common: 'Eurasian Watermilfoil', binomen: 'Myriophyllum spicatum', archetype: 6, height: 410, baseW: 16, tipW: 1.9, blades: 9, desc: 'Batang lentur dengan 4 karangan daun menjari berbulu halus seperti sisir camar air.' },
    { id: 'cutleaf_watermilfoil', common: 'Cutleaf Watermilfoil', binomen: 'Myriophyllum pinnatum', archetype: 6, height: 360, baseW: 15, tipW: 1.8, blades: 8, desc: 'Milfoil dengan gerigi helai daun bersirip tajam terbelah rapi.' },
    { id: 'variable_watermilfoil', common: 'Variable-leaf Watermilfoil', binomen: 'Myriophyllum heterophyllum', archetype: 6, height: 380, baseW: 16, tipW: 2.0, blades: 8, desc: 'Daun bawah air yang sangat lebat bertransisi halus mengikuti kedalaman.' },
    { id: 'parrots_feather', common: 'Parrot’s-feather', binomen: 'Myriophyllum aquaticum', archetype: 6, height: 400, baseW: 17, tipW: 2.1, blades: 8, desc: 'Daun bertekstur bulu burung nuri biru kehijauan yang tersusun rapat pada ruas batang.' },
    { id: 'hydrilla', common: 'Hydrilla', binomen: 'Hydrilla verticillata', archetype: 6, height: 370, baseW: 13, tipW: 2.2, blades: 9, desc: 'Batang beruas dengan karangan 5 daun bergerigi tajam memutar mengitari batang.' },
    { id: 'elodea', common: 'Elodea / American Waterweed', binomen: 'Elodea canadensis', archetype: 6, height: 330, baseW: 12, tipW: 2.4, blades: 9, desc: 'Daun hijau tua tersusun tiga-tiga dalam lingkaran rapat melingkari batang.' },
    { id: 'egeria', common: 'Egeria / Brazilian Waterweed', binomen: 'Egeria densa', archetype: 6, height: 360, baseW: 14, tipW: 2.5, blades: 8, desc: 'Karangan daun rapat berkelompok empat atau lebih dengan helai daun berkilap.' },
    { id: 'asian_marshweed', common: 'Asian Marshweed', binomen: 'Limnophila sessiliflora', archetype: 6, height: 340, baseW: 15, tipW: 1.9, blades: 8, desc: 'Daun terbagi menjari halus bagai mahkota krisan air yang merekah mekar.' },
    { id: 'water_wisteria', common: 'Water Wisteria', binomen: 'Hygrophila difformis', archetype: 6, height: 380, baseW: 20, tipW: 3.8, blades: 7, desc: 'Daun bercabang renda mekar yang sangat adaptif terhadap derasnya aliran kolam.' },
    { id: 'east_indian_hygro', common: 'East Indian Hygrophila', binomen: 'Hygrophila polysperma', archetype: 6, height: 320, baseW: 17, tipW: 4.2, blades: 9, desc: 'Daun lonjong berhadapan silang yang tumbuh tegak membentuk rumpun padat.' },
    { id: 'willow_leafed_hygro', common: 'Willow-leafed Hygrophila', binomen: 'Hygrophila salicifolia', archetype: 6, height: 350, baseW: 16, tipW: 3.2, blades: 8, desc: 'Daun memanjang sempit seperti pohon gandarusa atau dedalu air yang menjuntai.' },
    { id: 'waterthread_pondweed', common: 'Waterthread Pondweed', binomen: 'Potamogeton diversifolius', archetype: 6, height: 290, baseW: 10, tipW: 1.5, blades: 11, desc: 'Benang-benang daun bawah air yang sangat tipis dan meliuk elastis.' }
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
  // 3. Mathematical Blade: Archetype 0 (SEAGRASS) [FAVORITE - Enhanced]
  // -----------------------------------------------------------------
  class SeagrassBlade {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.baseAngle = (config.baseAngleDeg || 0) * (PI / 180);
      const cosA = Math.cos(this.baseAngle);
      const sinA = Math.sin(this.baseAngle);

      // Organic randomized length and width
      const lenVar = rndtri(0.72, 1.0, 1.38);
      const widthVar = rndtri(0.75, 1.0, 1.35);
      this.length = (config.length || rndtri(240, 360, 490)) * lenVar;
      this.baseWidth = (config.baseWidth || rndtri(9, 15, 22)) * widthVar;
      this.tipWidth = (config.tipWidth || rndtri(1.2, 1.8, 2.6));
      this.segments = config.segments || 22;
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.1, 1.7, 2.4);
      this.naturalSway = rndtri(25, 52, 85);
      this.curl = config.curl !== undefined ? config.curl : rndtri(-0.45, 0.0, 0.45);

      this.nodes = [];
      const ds = this.length / (this.segments - 1);
      for (let i = 0; i < this.segments; i++) {
        const frac = i / (this.segments - 1);
        const distFromBase = i * ds;
        this.nodes.push({
          relX: sinA * distFromBase,
          relY: -cosA * distFromBase,
          velX: 0,
          width: lerp(this.baseWidth, this.tipWidth, Math.pow(frac, 0.8))
        });
      }
      this.veinOffsets = [-0.55, -0.25, 0.25, 0.55];
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      const N = this.nodes.length;
      const cosA = Math.cos(this.baseAngle);
      const sinA = Math.sin(this.baseAngle);

      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const node = this.nodes[i];
        const worldX = rootX + this.offsetX + node.relX;
        const worldY = rootY + node.relY;

        const restAngledX = sinA * (this.length * frac);
        const wave = Math.sin(time * this.waveSpeed + this.phase - frac * 3.2) * (this.naturalSway * Math.pow(frac, 1.35));
        const tidal = currentFlow * 72 * Math.pow(frac, 1.5);
        const staticCurl = this.curl * this.length * frac * frac;
        const targetX = restAngledX + wave + tidal + staticCurl;

        let repelForce = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(worldX, worldY, fishX, fishY);
          if (d < 115) {
            repelForce = ((worldX >= fishX) ? 1 : -1) * (1.0 - d / 115) * 88 * frac;
          }
        }

        if (ripples && ripples.length > 0) {
          for (let r = 0; r < ripples.length; r++) {
            const rip = ripples[r];
            const rd = dist(worldX, worldY, rip.x, rip.y);
            if (Math.abs(rd - rip.r) < 32) {
              const rFactor = (1.0 - Math.abs(rd - rip.r) / 32) * rip.alpha * 38;
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

        let tx = (i < N - 1) ? (this.nodes[i + 1].relX - this.nodes[i].relX) : (this.nodes[N - 1].relX - this.nodes[N - 2].relX);
        let ty = (i < N - 1) ? (this.nodes[i + 1].relY - this.nodes[i].relY) : (this.nodes[N - 1].relY - this.nodes[N - 2].relY);
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

      // Parallel fine longitudinal ink veins
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
  // 4. Mathematical Kelp: Archetype 1 (KELP) [REDESIGNED]
  //    - Supple basal stipe stalk
  //    - Broad billowing belly with high-frequency ruffled margins (crinkled frills)
  //    - Clean stipe midrib and textured rugae fluting lines
  // -----------------------------------------------------------------
  class KelpBlade {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.baseAngle = (config.baseAngleDeg || 0) * (PI / 180);
      const cosA = Math.cos(this.baseAngle);
      const sinA = Math.sin(this.baseAngle);

      const lenVar = rndtri(0.75, 1.0, 1.4);
      const widthVar = rndtri(0.75, 1.0, 1.4);
      this.length = (config.length || rndtri(360, 480, 580)) * lenVar;
      this.baseWidth = (config.baseWidth || rndtri(32, 48, 64)) * widthVar;
      this.tipWidth = (config.tipWidth || rndtri(5.0, 8.0, 12.0));
      this.segments = config.segments || 26;
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(0.9, 1.4, 1.9);
      this.naturalSway = rndtri(40, 72, 110);
      this.crinkleFreq1 = rndtri(6.0, 8.5, 11.0);
      this.crinkleFreq2 = rndtri(12.0, 16.0, 20.0);
      this.crinkleAmp = rndtri(6.0, 11.0, 16.0);

      this.nodes = [];
      const ds = this.length / (this.segments - 1);
      for (let i = 0; i < this.segments; i++) {
        const frac = i / (this.segments - 1);
        const distFromBase = i * ds;
        // Biological kelp width profile: slender stipe (frac < 0.15) -> broad frond belly (0.35-0.7) -> tapering tip
        let wProfile;
        if (frac < 0.14) {
          wProfile = lerp(6.0, this.baseWidth * 0.45, frac / 0.14);
        } else if (frac < 0.65) {
          wProfile = lerp(this.baseWidth * 0.45, this.baseWidth, (frac - 0.14) / 0.51);
        } else {
          wProfile = lerp(this.baseWidth, this.tipWidth, (frac - 0.65) / 0.35);
        }

        this.nodes.push({
          relX: sinA * distFromBase,
          relY: -cosA * distFromBase,
          velX: 0,
          width: wProfile
        });
      }
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      const N = this.nodes.length;
      const cosA = Math.cos(this.baseAngle);
      const sinA = Math.sin(this.baseAngle);

      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const node = this.nodes[i];
        const worldX = rootX + this.offsetX + node.relX;
        const worldY = rootY + node.relY;

        const restAngledX = sinA * (this.length * frac);
        const wave = Math.sin(time * this.waveSpeed + this.phase - frac * 2.8) * (this.naturalSway * Math.pow(frac, 1.4));
        const tidal = currentFlow * 90 * Math.pow(frac, 1.5);
        const targetX = restAngledX + wave + tidal;

        let repel = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(worldX, worldY, fishX, fishY);
          if (d < 135) {
            repel = ((worldX >= fishX) ? 1 : -1) * (1.0 - d / 135) * 105 * frac;
          }
        }
        node.velX += ((targetX + repel - node.relX) * 7.2 - node.velX * 3.2) * dt;
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

        let tx = (i < N - 1) ? (this.nodes[i + 1].relX - this.nodes[i].relX) : (this.nodes[N - 1].relX - this.nodes[N - 2].relX);
        let ty = (i < N - 1) ? (this.nodes[i + 1].relY - this.nodes[i].relY) : (this.nodes[N - 1].relY - this.nodes[N - 2].relY);
        const tLen = Math.hypot(tx, ty) || 1;
        const nxNorm = -ty / tLen;
        const nyNorm = tx / tLen;

        const frac = i / (N - 1);
        // Multi-harmonic crinkled frill edge flutter
        const frill1 = Math.sin(frac * this.crinkleFreq1 * PI + this.phase) * this.crinkleAmp;
        const frill2 = Math.sin(frac * this.crinkleFreq2 * PI - this.phase * 1.5) * (this.crinkleAmp * 0.4);
        const frillEffect = (frac > 0.15) ? (frill1 + frill2) * Math.sin(frac * PI) : 0;

        const hw = (this.nodes[i].width * 0.5) + frillEffect;

        leftEdge.push([nx - nxNorm * hw, ny - nyNorm * hw]);
        rightEdge.push([nx + nxNorm * hw, ny + nyNorm * hw]);
      }

      ctx.save();

      // Main Kelp Blade Body with layered watercolor wash
      ctx.beginPath();
      ctx.moveTo(leftEdge[0][0], leftEdge[0][1]);
      for (let i = 1; i < N; i++) ctx.lineTo(leftEdge[i][0], leftEdge[i][1]);
      ctx.lineTo(centerLine[N - 1][0], centerLine[N - 1][1]);
      for (let i = N - 1; i >= 0; i--) ctx.lineTo(rightEdge[i][0], rightEdge[i][1]);
      ctx.closePath();

      ctx.fillStyle = options.washColor || 'rgba(38, 56, 44, 0.11)';
      ctx.fill();

      // Secondary deeper belly shading
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = 'rgba(28, 48, 36, 0.14)';
      ctx.beginPath();
      ctx.moveTo(centerLine[Math.floor(N * 0.2)][0], centerLine[Math.floor(N * 0.2)][1]);
      for (let i = Math.floor(N * 0.2); i < Math.floor(N * 0.8); i++) ctx.lineTo(leftEdge[i][0], leftEdge[i][1]);
      for (let i = Math.floor(N * 0.8); i >= Math.floor(N * 0.2); i--) ctx.lineTo(centerLine[i][0], centerLine[i][1]);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = options.strokeColor || '#18141f';
      ctx.lineWidth = options.lineWidth || 1.1;

      // Draw left & right undulating ruffled borders
      ctx.beginPath();
      ctx.moveTo(leftEdge[0][0], leftEdge[0][1]);
      for (let i = 1; i < N; i++) ctx.lineTo(leftEdge[i][0], leftEdge[i][1]);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightEdge[0][0], rightEdge[0][1]);
      for (let i = 1; i < N; i++) ctx.lineTo(rightEdge[i][0], rightEdge[i][1]);
      ctx.stroke();

      // Flexible stipe & central midrib
      ctx.lineWidth = Math.max(0.75, (options.lineWidth || 1.1) * 0.85);
      ctx.beginPath();
      ctx.moveTo(centerLine[0][0], centerLine[0][1]);
      for (let i = 1; i < N; i++) ctx.lineTo(centerLine[i][0], centerLine[i][1]);
      ctx.stroke();

      // Longitudinal rugae flutes (surface crinkle lines)
      ctx.save();
      ctx.lineWidth = Math.max(0.5, (options.lineWidth || 1.0) * 0.5);
      ctx.globalAlpha = 0.45;
      [-0.45, 0.45].forEach(vOff => {
        ctx.beginPath();
        for (let i = Math.floor(N * 0.18); i < N - 2; i++) {
          const tParam = (vOff + 1.0) * 0.5;
          const rx = lerp(leftEdge[i][0], rightEdge[i][0], tParam);
          const ry = lerp(leftEdge[i][1], rightEdge[i][1], tParam);
          if (i === Math.floor(N * 0.18)) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.stroke();
      });
      ctx.restore();

      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 5. Mathematical Branching: Archetype 2 (BRANCHING) [FAVORITE - Enhanced]
  // -----------------------------------------------------------------
  class BranchingFlora {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.baseAngle = (config.baseAngleDeg || 0) * (PI / 180);
      const lenVar = rndtri(0.75, 1.0, 1.35);
      this.height = (config.length || rndtri(210, 280, 360)) * lenVar;
      this.baseWidth = config.baseWidth || 11;
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.2, 1.8, 2.4);

      // Hierarchical fractal branching
      this.branches = [];
      const numBranches = Math.floor(rnd(6, 10));
      for (let i = 0; i < numBranches; i++) {
        const t = lerp(0.18, 0.92, i / (numBranches - 1));
        const side = (i % 2 === 0 ? 1 : -1);
        const bLen = rndtri(50, 85, 125) * (1.1 - t * 0.5);
        const angle = side * rndtri(0.48, 0.78, 1.12);

        const twigs = [];
        const numTwigs = Math.floor(rnd(2, 5));
        for (let j = 0; j < numTwigs; j++) {
          twigs.push({
            t: lerp(0.35, 0.92, j / (numTwigs - 1)),
            side: (j % 2 === 0 ? 1 : -1),
            len: bLen * rndtri(0.32, 0.48, 0.65),
            angle: (j % 2 === 0 ? 1 : -1) * rndtri(0.35, 0.65, 0.85)
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
      const sway = Math.sin(time * this.waveSpeed + this.phase) * 38 + currentFlow * 55;
      let repel = 0;
      if (fishX !== undefined && fishY !== undefined && fishX > -500) {
        const d = dist(rootX + this.offsetX, rootY - this.height * 0.5, fishX, fishY);
        if (d < 125) repel = ((rootX >= fishX) ? 1 : -1) * (1.0 - d / 125) * 65;
      }
      this.currentStemX += ((sway + repel - this.currentStemX) * 7.0) * dt;

      for (let i = 0; i < this.branches.length; i++) {
        const b = this.branches[i];
        const bSway = Math.sin(time * (this.waveSpeed * 1.35) + this.phase + i) * 14;
        b.swayOffset += (bSway - b.swayOffset) * 8.0 * dt;
      }
    }

    render(ctx, rootX, rootY, options = {}) {
      ctx.save();
      ctx.strokeStyle = options.strokeColor || '#18141f';
      ctx.lineWidth = options.lineWidth || 1.1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const cosA = Math.cos(this.baseAngle);
      const sinA = Math.sin(this.baseAngle);
      const bx = rootX + this.offsetX;
      const by = rootY;
      const tipX = bx + sinA * this.height + this.currentStemX;
      const tipY = by - cosA * this.height;
      const cpX = bx + sinA * this.height * 0.45 + this.currentStemX * 0.4;
      const cpY = by - cosA * this.height * 0.55;

      // Draw main trunk
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

        const totalAngle = this.baseAngle + b.angle;
        const bTipX = nodeX + Math.sin(totalAngle) * b.bLen + b.swayOffset * b.side;
        const bTipY = nodeY - Math.cos(totalAngle) * b.bLen;

        ctx.beginPath();
        ctx.moveTo(nodeX, nodeY);
        ctx.lineTo(bTipX, bTipY);
        ctx.stroke();

        for (const tw of b.twigs) {
          const twNodeX = lerp(nodeX, bTipX, tw.t);
          const twNodeY = lerp(nodeY, bTipY, tw.t);
          const twTipX = twNodeX + Math.sin(totalAngle + tw.angle) * tw.len;
          const twTipY = twNodeY - Math.cos(totalAngle + tw.angle) * tw.len;

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
  // 6. Mathematical Sheet Algae: Archetype 3 (SHEET / ULVA) [REDESIGNED]
  //    - Multiple broad, billowing ruffled folia (lettuce leaves)
  //    - Translucent multilayer silk drape folds
  //    - Scalloped Bézier perimeter curves with fluid flutter
  // -----------------------------------------------------------------
  class SheetAlgaeFlora {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.baseAngle = (config.baseAngleDeg || 0) * (PI / 180);
      const lenVar = rndtri(0.75, 1.0, 1.35);
      const widthVar = rndtri(0.75, 1.0, 1.4);
      this.height = (config.length || rndtri(280, 380, 460)) * lenVar;
      this.width = (config.baseWidth || rndtri(60, 95, 130)) * widthVar;
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.0, 1.5, 2.0);

      // Multiple billowy translucent lobes (3 to 6 ruffled sails)
      this.lobes = [];
      const numLobes = Math.floor(rnd(3, 6));
      for (let i = 0; i < numLobes; i++) {
        const spreadAngle = (numLobes > 1 ? (i / (numLobes - 1) - 0.5) : 0) * 0.85;
        this.lobes.push({
          len: this.height * rndtri(0.7, 1.0, 1.25),
          width: this.width * rndtri(0.65, 1.0, 1.35),
          angle: this.baseAngle + spreadAngle,
          ruffleFreq: rndtri(6, 9, 13),
          ruffleAmp: rndtri(8, 14, 22),
          swayX: 0
        });
      }
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      for (let i = 0; i < this.lobes.length; i++) {
        const lb = this.lobes[i];
        const sway = Math.sin(time * this.waveSpeed + this.phase + i * 1.1) * 48 + currentFlow * 70;
        let repel = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(rootX + this.offsetX, rootY - lb.len * 0.5, fishX, fishY);
          if (d < 145) repel = ((rootX >= fishX) ? 1 : -1) * (1.0 - d / 145) * 85;
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
        const tipX = bx + lb.swayX + Math.sin(lb.angle) * (lb.len * 0.55);
        const tipY = by - Math.cos(lb.angle) * lb.len;
        const hw = lb.width * 0.5;

        // Billowing curved lettuce sheet contour
        ctx.beginPath();
        ctx.moveTo(bx, by);

        // Left fluttering scalloped margin
        const steps = 14;
        for (let t = 0; t <= steps; t++) {
          const frac = t / steps;
          const ruff = Math.sin(frac * lb.ruffleFreq * PI) * lb.ruffleAmp;
          const lx = lerp(bx, tipX - hw + ruff, frac);
          const ly = lerp(by, tipY, frac);
          ctx.lineTo(lx, ly);
        }

        // Curved crown apex
        ctx.quadraticCurveTo(tipX, tipY - 14, tipX + hw * 0.2, tipY);

        // Right fluttering scalloped margin
        for (let t = steps; t >= 0; t--) {
          const frac = t / steps;
          const ruff = Math.sin(frac * lb.ruffleFreq * PI + PI) * lb.ruffleAmp;
          const rx = lerp(bx, tipX + hw + ruff, frac);
          const ry = lerp(by, tipY, frac);
          ctx.lineTo(rx, ry);
        }
        ctx.closePath();

        // Translucent sea lettuce sumi-e wash
        ctx.fillStyle = options.washColor || 'rgba(38, 68, 50, 0.09)';
        ctx.fill();

        ctx.strokeStyle = options.strokeColor || '#18141f';
        ctx.lineWidth = (options.lineWidth || 1.1) * 0.9;
        ctx.stroke();

        // Radiating organic drape folds (silk veil ribs)
        ctx.save();
        ctx.globalAlpha = 0.42;
        ctx.lineWidth = Math.max(0.5, (options.lineWidth || 1.0) * 0.5);
        for (let r = -2; r <= 2; r++) {
          ctx.beginPath();
          ctx.moveTo(bx, by);
          const rTipX = tipX + (r / 2.4) * hw;
          const cpX = bx + lb.swayX * 0.45 + r * 12;
          const cpY = by - lb.len * 0.55;
          ctx.quadraticCurveTo(cpX, cpY, rTipX, tipY);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 7. Mathematical Bubble Algae: Archetype 4 (BUBBLE / VALONIA) [REDESIGNED]
  //    - Clustered grapelike pearl geometry with holdfast stalks
  //    - Large mother pearls + medium daughters + tiny baby clusters
  //    - Emerald sumi-e gradient wash + crisp specular gleam highlight
  // -----------------------------------------------------------------
  class BubbleAlgaeFlora {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.2, 1.8, 2.5);

      // Clustered hierarchical pearls
      this.bubbles = [];
      const numBubbles = Math.floor(rnd(12, 22));
      const spanW = config.bladeSpacing ? Math.max(35, config.bladeSpacing * 4.5) : rndtri(40, 70, 95);
      for (let i = 0; i < numBubbles; i++) {
        const offX = rndtri(-spanW * 0.5, 0, spanW * 0.5);
        const distFromCenter = Math.abs(offX) / (spanW * 0.55);
        // Larger mother bubbles in center, smaller daughters outside
        const baseRadius = (i < 3) ? rndtri(20, 28, 38) : rndtri(6, 14, 22) * (1.1 - distFromCenter * 0.45);
        const offY = -rndtri(6, 28, 65) - (i < 3 ? baseRadius * 0.8 : 0);

        this.bubbles.push({
          relX: offX,
          relY: offY,
          r: Math.max(5, baseRadius),
          bobPhase: rnd(0, PI * 2),
          bobOffset: 0
        });
      }
      // Sort by radius so background large bubbles draw behind smaller foreground gems
      this.bubbles.sort((a, b) => b.r - a.r);
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      for (const b of this.bubbles) {
        const bob = Math.sin(time * this.waveSpeed + b.bobPhase) * 4.5;
        let repel = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(rootX + this.offsetX + b.relX, rootY + b.relY, fishX, fishY);
          if (d < 75) repel = (1.0 - d / 75) * 14;
        }
        b.bobOffset += (bob + repel - b.bobOffset) * 6.5 * dt;
      }
    }

    render(ctx, rootX, rootY, options = {}) {
      ctx.save();
      const bx = rootX + this.offsetX;
      const by = rootY;

      // Small anchor holdfast stalks connecting bubbles to rock
      ctx.strokeStyle = options.strokeColor || '#18141f';
      ctx.lineWidth = 1;
      for (const b of this.bubbles) {
        ctx.beginPath();
        ctx.moveTo(bx + b.relX * 0.5, by);
        ctx.lineTo(bx + b.relX, by + b.relY + b.bobOffset + b.r * 0.7);
        ctx.stroke();
      }

      // Render pearls
      for (const b of this.bubbles) {
        const cx = bx + b.relX;
        const cy = by + b.relY + b.bobOffset;
        const r = b.r;

        // Base sphere outline & wash
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, PI * 2);
        ctx.fillStyle = options.washColor || 'rgba(38, 78, 56, 0.16)';
        ctx.fill();

        ctx.strokeStyle = options.strokeColor || '#18141f';
        ctx.lineWidth = options.lineWidth || 1.1;
        ctx.stroke();

        // Inner shadow crescent (depth)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx + r * 0.22, cy + r * 0.22, r * 0.65, 0, PI * 2);
        ctx.fillStyle = 'rgba(18, 36, 26, 0.20)';
        ctx.fill();

        // White specular gleam highlight (gem shine)
        ctx.beginPath();
        ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.32, 0, PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fill();

        // Secondary tiny pin-point sparkle
        ctx.beginPath();
        ctx.arc(cx - r * 0.15, cy - r * 0.45, r * 0.12, 0, PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 8. Mathematical Moss: Archetype 5 (MOSS) [FAVORITE - Enhanced]
  // -----------------------------------------------------------------
  class AquaticMossFlora {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.5, 2.3, 3.2);

      // Dense feathery velvet tufts
      this.tufts = [];
      const numTufts = Math.floor(rnd(22, 38));
      const spanW = config.bladeSpacing ? Math.max(45, config.bladeSpacing * (config.bladeCount || 10) * 0.42) : rndtri(45, 75, 105);
      for (let i = 0; i < numTufts; i++) {
        const offX = rndtri(-spanW * 0.5, 0, spanW * 0.5);
        const lenVar = rndtri(0.7, 1.0, 1.4);
        const len = (config.length ? config.length * 0.25 : rndtri(30, 60, 95)) * lenVar * (1.0 - Math.abs(offX) / (spanW * 0.6) * 0.35);
        const angle = rndtri(-0.5, 0, 0.5);
        const numMicroLeaves = Math.floor(rnd(7, 14));

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
        const sway = Math.sin(time * this.waveSpeed + this.phase + i * 0.35) * 15 + currentFlow * 28;
        let repel = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(rootX + this.offsetX + tf.offX, rootY - tf.len * 0.5, fishX, fishY);
          if (d < 90) repel = ((rootX >= fishX) ? 1 : -1) * (1.0 - d / 90) * 38;
        }
        tf.swayX += (sway + repel - tf.swayX) * 9.5 * dt;
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

        ctx.beginPath();
        ctx.moveTo(bx + tf.offX, by);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Biserial feathery micro-leaflets
        for (let j = 0; j < tf.numMicroLeaves; j++) {
          const frac = (j + 1) / (tf.numMicroLeaves + 1);
          const lx = lerp(bx + tf.offX, tipX, frac);
          const ly = lerp(by, tipY, frac);
          const side = (j % 2 === 0 ? 1 : -1);
          const leafLen = 4.8 * (1 - frac * 0.45);

          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx + side * leafLen, ly - 2.8);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 9. Mathematical Whorled & Fanwort: Archetype 6 (CABOMBA) [REDESIGNED]
  //    - Supple sinusoidal jointed stem curving dynamically
  //    - Multi-tiered radial fan whorls with dichotomous forked rays
  //    - Fluid drag response: fan rays stream gracefully backward with current
  // -----------------------------------------------------------------
  class WhorledFanFlora {
    constructor(parent, config) {
      this.parent = parent;
      this.offsetX = config.offsetX || 0;
      this.baseAngle = (config.baseAngleDeg || 0) * (PI / 180);
      const cosA = Math.cos(this.baseAngle);
      const sinA = Math.sin(this.baseAngle);

      const lenVar = rndtri(0.75, 1.0, 1.35);
      this.height = (config.length || rndtri(300, 400, 510)) * lenVar;
      this.phase = rnd(0, PI * 2);
      this.waveSpeed = rndtri(1.0, 1.5, 2.1);

      // Supple stem nodes
      this.stemNodes = [];
      const segs = 20;
      const ds = this.height / (segs - 1);
      for (let i = 0; i < segs; i++) {
        const distFromBase = i * ds;
        this.stemNodes.push({
          relX: sinA * distFromBase,
          relY: -cosA * distFromBase,
          velX: 0
        });
      }

      // Radial fan whorls along stem nodes with progressive degree rotation
      this.whorls = [];
      const numWhorls = Math.floor(rnd(7, 12));
      const whorlRotationStep = (config.whorlRotationDeg !== undefined ? config.whorlRotationDeg : 48) * (PI / 180);
      for (let i = 0; i < numWhorls; i++) {
        const t = lerp(0.16, 0.96, i / (numWhorls - 1));
        // Leaves are larger in mid-bottom, smaller and denser toward the budding tip
        const fanRadius = rndtri(25, 42, 60) * (1.15 - t * 0.42);
        const fanRays = Math.floor(rnd(5, 8));

        this.whorls.push({
          t,
          fanRadius,
          fanRays,
          whorlAngle: i * whorlRotationStep,
          swayLag: rnd(0.8, 1.4)
        });
      }
    }

    update(dt, time, rootX, rootY, currentFlow, fishX, fishY, ripples) {
      const N = this.stemNodes.length;
      const cosA = Math.cos(this.baseAngle);
      const sinA = Math.sin(this.baseAngle);

      for (let i = 0; i < N; i++) {
        const frac = i / (N - 1);
        const node = this.stemNodes[i];
        const worldX = rootX + this.offsetX + node.relX;
        const worldY = rootY + node.relY;

        const restAngledX = sinA * (this.height * frac);
        const wave = Math.sin(time * this.waveSpeed + this.phase - frac * 3.1) * (52 * Math.pow(frac, 1.4));
        const tidal = currentFlow * 78 * Math.pow(frac, 1.5);
        const targetX = restAngledX + wave + tidal;

        let repel = 0;
        if (fishX !== undefined && fishY !== undefined && fishX > -500) {
          const d = dist(worldX, worldY, fishX, fishY);
          if (d < 125) repel = ((worldX >= fishX) ? 1 : -1) * (1.0 - d / 125) * 90 * frac;
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

      // Draw graceful jointed sinusoidal stem
      ctx.beginPath();
      ctx.moveTo(rootX + this.offsetX + this.stemNodes[0].relX, rootY + this.stemNodes[0].relY);
      for (let i = 1; i < N; i++) {
        ctx.lineTo(rootX + this.offsetX + this.stemNodes[i].relX, rootY + this.stemNodes[i].relY);
      }
      ctx.stroke();

      // Draw multi-tiered radial fan whorls with dichotomous rays
      for (const wh of this.whorls) {
        const idx = Math.min(N - 2, Math.floor(wh.t * (N - 1)));
        const frac = (wh.t * (N - 1)) - idx;
        const wx = rootX + this.offsetX + lerp(this.stemNodes[idx].relX, this.stemNodes[idx + 1].relX, frac);
        const wy = rootY + lerp(this.stemNodes[idx].relY, this.stemNodes[idx + 1].relY, frac);

        // Fluid drag tilt on fan leaves
        const stemSlope = (this.stemNodes[idx + 1].relX - this.stemNodes[idx].relX) * 0.08;

        [-1, 1].forEach(side => {
          for (let r = 0; r < wh.fanRays; r++) {
            const spreadNorm = (r / (wh.fanRays - 1) - 0.5);
            const rayAngle = this.baseAngle + wh.whorlAngle * 0.35 + spreadNorm * 1.4 + stemSlope;
            const rLen = wh.fanRadius * (1 - Math.abs(spreadNorm) * 0.28);
            const rTipX = wx + side * Math.cos(rayAngle) * rLen;
            const rTipY = wy - Math.sin(rayAngle) * (rLen * 0.6) - 6;

            // Primary ray
            ctx.beginPath();
            ctx.moveTo(wx, wy);
            ctx.lineTo(rTipX, rTipY);
            ctx.stroke();

            // First-tier fork
            const forkLen = rLen * 0.38;
            const f1X = rTipX + side * forkLen * 0.85;
            const f1Y = rTipY - forkLen * 0.55;
            const f2X = rTipX + side * forkLen * 0.45;
            const f2Y = rTipY + forkLen * 0.55;

            ctx.beginPath();
            ctx.moveTo(rTipX, rTipY);
            ctx.lineTo(f1X, f1Y);
            ctx.moveTo(rTipX, rTipY);
            ctx.lineTo(f2X, f2Y);
            ctx.stroke();

            // Second-tier fine lace tiplets
            const tipletLen = forkLen * 0.45;
            ctx.beginPath();
            ctx.moveTo(f1X, f1Y);
            ctx.lineTo(f1X + side * tipletLen * 0.7, f1Y - tipletLen * 0.6);
            ctx.moveTo(f1X, f1Y);
            ctx.lineTo(f1X + side * tipletLen * 0.5, f1Y + tipletLen * 0.4);
            ctx.stroke();
          }
        });
      }
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------
  // 10. Unified Botanical Plant Cluster (Rumpun Tanaman Air)
  //     Organic leaf spacing & angular degree spread (kerapatan & perubahan derajat)
  // -----------------------------------------------------------------
  class PlantCluster {
    constructor(x, y, seed, options = {}) {
      this.x = x;
      this.y = y;
      this.seed = seed || botanical_binomen();
      set_seed(this.seed);

      let profile = SPECIES_CATALOG.find(s => s.id === options.speciesId || s.binomen === this.seed || s.common === this.seed);
      if (!profile) {
        const parsedArch = options.archetype !== undefined ? options.archetype : choice([0, 1, 2, 3, 4, 5, 6]);
        profile = choice(SPECIES_CATALOG.filter(s => s.archetype === parsedArch)) || SPECIES_CATALOG[0];
      }

      this.species = profile;
      this.speciesName = profile.binomen;
      this.archetype = profile.archetype;
      // Cluster scale random variation
      this.scale = (options.scale || rndtri(0.78, 1.0, 1.35)) * (options.scaleMult || 1.0);

      this.blades = [];
      this.structures = [];

      // Spacing & Angular Degree settings
      const bladeSpacing = options.bladeSpacing !== undefined ? options.bladeSpacing : 16;
      const spreadAngleDeg = options.spreadAngleDeg !== undefined ? options.spreadAngleDeg : 54;
      const anglePattern = options.anglePattern || 'fan'; // 'fan', 'alternating', 'spiral'

      this.bladeSpacing = bladeSpacing;
      this.spreadAngleDeg = spreadAngleDeg;
      this.anglePattern = anglePattern;

      // Base count / density
      const baseCount = options.bladeCount !== undefined ? options.bladeCount : profile.blades;
      const count = options.exactCount ? Math.max(2, baseCount) : Math.max(2, Math.floor(baseCount * rndtri(0.85, 1.0, 1.25)));

      const getBladePlacement = (i, totalCount) => {
        const u = (totalCount > 1) ? (i / (totalCount - 1) - 0.5) : 0;
        const offX = u * (totalCount - 1) * bladeSpacing * this.scale + rndtri(-1.2, 0, 1.2);
        let angleDeg = 0;
        if (anglePattern === 'fan') {
          angleDeg = (u * 2) * (spreadAngleDeg * 0.5);
        } else if (anglePattern === 'alternating') {
          const mag = ((i + 1) / totalCount) * (spreadAngleDeg * 0.5);
          angleDeg = (i % 2 === 0 ? -1 : 1) * mag;
        } else if (anglePattern === 'spiral') {
          const normStep = ((i * 137.5) % 360) / 360 - 0.5;
          angleDeg = normStep * spreadAngleDeg;
        }
        return { offX, angleDeg: angleDeg + rndtri(-2.0, 0, 2.0), u };
      };

      if (this.archetype === ARCHETYPES.SEAGRASS) {
        for (let i = 0; i < count; i++) {
          const { offX, angleDeg, u } = getBladePlacement(i, count);
          this.blades.push(new SeagrassBlade(this, {
            offsetX: offX,
            baseAngleDeg: angleDeg,
            length: (options.length || profile.height) * this.scale * (1.0 - Math.abs(u) * 0.28),
            baseWidth: (options.baseWidth || profile.baseW) * this.scale,
            tipWidth: profile.tipW,
            curl: options.curl !== undefined ? options.curl : rndtri(-0.35, 0, 0.35)
          }));
        }
      } else if (this.archetype === ARCHETYPES.KELP) {
        for (let i = 0; i < count; i++) {
          const { offX, angleDeg, u } = getBladePlacement(i, count);
          this.blades.push(new KelpBlade(this, {
            offsetX: offX,
            baseAngleDeg: angleDeg,
            length: (options.length || profile.height) * this.scale * (1.0 - Math.abs(u) * 0.22),
            baseWidth: (options.baseWidth || profile.baseW) * this.scale,
            tipWidth: profile.tipW
          }));
        }
      } else if (this.archetype === ARCHETYPES.BRANCHING) {
        const bCount = Math.max(2, Math.floor(count * 0.6));
        for (let i = 0; i < bCount; i++) {
          const { offX, angleDeg } = getBladePlacement(i, bCount);
          this.structures.push(new BranchingFlora(this, {
            offsetX: offX,
            baseAngleDeg: angleDeg * 0.75,
            length: (options.length || profile.height) * this.scale,
            baseWidth: options.baseWidth || profile.baseW
          }));
        }
      } else if (this.archetype === ARCHETYPES.SHEET) {
        const sCount = Math.max(2, Math.floor(count * 0.6));
        for (let i = 0; i < sCount; i++) {
          const { offX, angleDeg } = getBladePlacement(i, sCount);
          this.structures.push(new SheetAlgaeFlora(this, {
            offsetX: offX,
            baseAngleDeg: angleDeg * 0.65,
            length: (options.length || profile.height) * this.scale,
            baseWidth: (options.baseWidth || profile.baseW) * this.scale
          }));
        }
      } else if (this.archetype === ARCHETYPES.BUBBLE) {
        this.structures.push(new BubbleAlgaeFlora(this, {
          offsetX: 0,
          bladeSpacing: bladeSpacing,
          bladeCount: count
        }));
      } else if (this.archetype === ARCHETYPES.MOSS) {
        this.structures.push(new AquaticMossFlora(this, {
          offsetX: 0,
          bladeSpacing: bladeSpacing,
          bladeCount: count,
          length: (options.length || profile.height) * this.scale
        }));
      } else if (this.archetype === ARCHETYPES.WHORLED) {
        const wCount = Math.max(2, Math.floor(count * 0.65));
        for (let i = 0; i < wCount; i++) {
          const { offX, angleDeg } = getBladePlacement(i, wCount);
          this.structures.push(new WhorledFanFlora(this, {
            offsetX: offX,
            baseAngleDeg: angleDeg * 0.7,
            whorlRotationDeg: 45,
            length: (options.length || profile.height) * this.scale
          }));
        }
      }

      // Root anchor pebble (holdfast rock) - dynamically adapts to leaf spread width
      const totalSpanX = Math.max(20, (count - 1) * bladeSpacing * this.scale);
      this.rockRadiusX = Math.max(22, totalSpanX * 0.55 + 14) * this.scale;
      this.rockRadiusY = Math.max(12, this.rockRadiusX * 0.42);
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

      // Holdfast anchor rock (disabled by default)
      if (options.showRock === true) {
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.rockRadiusX, this.rockRadiusY, 0, 0, PI * 2);
        ctx.fillStyle = options.stoneWash || 'rgba(30, 26, 36, 0.08)';
        ctx.fill();
        ctx.strokeStyle = options.strokeColor || '#18141f';
        ctx.lineWidth = (options.lineWidth || 1.1) * 0.9;
        ctx.stroke();
      }

      // Render all blades and botanical structures
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
  //     Organic spacing jitter and height/density diversity
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

      const margin = 80;
      const step = (width - margin * 2) / (count - 1);
      const archetypesPool = [0, 1, 2, 3, 4, 5, 6];

      for (let i = 0; i < count; i++) {
        // Natural spatial jitter along seabed
        const baseX = margin + i * step + rndtri(-45, 0, 45);
        const baseY = height + rndtri(-16, 2, 22);
        const clusterSeed = `${this.seed}_cluster_${i}`;
        const arch = archetypesPool[i % archetypesPool.length];
        const species = choice(SPECIES_CATALOG.filter(s => s.archetype === arch)) || SPECIES_CATALOG[0];

        const cluster = new PlantCluster(baseX, baseY, clusterSeed, {
          speciesId: species.id,
          archetype: arch,
          scale: rndtri(0.72, 1.0, 1.38),
          bladeSpacing: rndtri(12, 16, 22),
          spreadAngleDeg: rndtri(38, 55, 72),
          anglePattern: choice(['fan', 'alternating'])
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
