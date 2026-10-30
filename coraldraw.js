/**
 * coraldraw.js - Procedural Aquatic Coral Engine (20 Hand-Drawn Doodle Styles)
 *
 * Implements the 20 hand-drawn vector doodle styles directly matching the user's
 * 5x4 reference grid illustration:
 * - Bold organic line-art (lineWidth ~ 2.4px, round caps & joins)
 * - Pure white opaque fills blocking background layers
 * - Double-rim open elliptical mouths, wrapping cylindrical bands, stipple pores,
 *   circular polyp rings, daisy flower sunbursts, and smooth riverbed pebbles.
 * - 100% strictly monochrome: ink black, white, and grayscale without colored pigment.
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

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // --- Helper: Smooth Riverbed Pebble ---
  function drawPebble(ctx, x, y, rx, ry, rot = 0, strokeColor, fillColor, lineWidth) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TWO_PI);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  }

  // -----------------------------------------------------------------
  // 20 HAND-DRAWN DOODLE CORAL STYLES (Direct 5x4 Grid Mapping)
  // -----------------------------------------------------------------
  const CORAL_PRESETS = [
    // 01: TRUMPET TRIO (Row 1, Col 1)
    {
      id: 'trumpet_trio',
      gridRow: 1, gridCol: 1,
      common: 'Cawan Terompet Tiga Tabung',
      binomen: 'Caulastrea curvata',
      desc: 'Tiga cawan terompet tegak melebar pada alas pasir bergelombang dengan gelang volume dan bibir elips ganda.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const bw = 55 * sc;

        // Base wavy substrate plate
        if (opts.showPebbles !== false) {
          ctx.beginPath();
          ctx.moveTo(-bw, 5 * sc);
          ctx.bezierCurveTo(-bw * 0.7, -2 * sc, -bw * 0.3, 6 * sc, 0, 2 * sc);
          ctx.bezierCurveTo(bw * 0.35, -2 * sc, bw * 0.7, 6 * sc, bw, 5 * sc);
          ctx.bezierCurveTo(bw * 1.08, 14 * sc, bw * 0.7, 18 * sc, 0, 16 * sc);
          ctx.bezierCurveTo(-bw * 0.7, 18 * sc, -bw * 1.08, 14 * sc, -bw, 5 * sc);
          ctx.closePath();
          ctx.fill(); ctx.stroke();

          if (opts.showDots !== false) {
            ctx.fillStyle = opts.strokeColor;
            [[-bw*0.6, 7*sc], [-bw*0.2, 10*sc], [bw*0.3, 8*sc], [bw*0.65, 10*sc]].forEach(([dx, dy]) => {
              ctx.beginPath(); ctx.arc(dx, dy, 1.8 * sc, 0, TWO_PI); ctx.fill();
            });
            ctx.fillStyle = opts.fillColor;
          }
        }

        const tubes = [
          { rx0: -18 * sc, tx: -36 * sc, ty: -90 * sc * p.hMult, rx: 22 * sc, ry: 8 * sc, w: 10 * sc },
          { rx0: 18 * sc, tx: 36 * sc, ty: -96 * sc * p.hMult, rx: 24 * sc, ry: 9 * sc, w: 10 * sc },
          { rx0: 0, tx: 0, ty: -75 * sc * p.hMult, rx: 20 * sc, ry: 7.5 * sc, w: 9 * sc }
        ];

        tubes.forEach(t => {
          ctx.beginPath();
          ctx.moveTo(t.rx0 - t.w, 0);
          ctx.bezierCurveTo(t.rx0 - t.w * 0.8, t.ty * 0.4, t.tx - t.rx * 0.85, t.ty * 0.8, t.tx - t.rx, t.ty);
          ctx.quadraticCurveTo(t.tx, t.ty + t.ry, t.tx + t.rx, t.ty);
          ctx.bezierCurveTo(t.tx + t.rx * 0.85, t.ty * 0.8, t.rx0 + t.w * 0.8, t.ty * 0.4, t.rx0 + t.w, 0);
          ctx.closePath();
          ctx.fill(); ctx.stroke();

          if (opts.showBands !== false) {
            [0.35, 0.62].forEach(frac => {
              const by = t.ty * frac;
              const bx = t.rx0 + (t.tx - t.rx0) * frac;
              const bwBand = t.w + (t.rx - t.w) * frac * 0.9;
              ctx.beginPath();
              ctx.ellipse(bx, by, bwBand, bwBand * 0.28, 0, 0, PI);
              ctx.stroke();
            });
          }

          ctx.beginPath(); ctx.ellipse(t.tx, t.ty, t.rx, t.ry, 0, 0, TWO_PI); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(t.tx, t.ty, t.rx * 0.65, t.ry * 0.65, 0, 0, TWO_PI); ctx.stroke();
        });
      }
    },

    // 02: GINGER ANTLER (Row 1, Col 2)
    {
      id: 'ginger_branch',
      gridRow: 1, gridCol: 2,
      common: 'Ranting Tanduk Jahe Montok',
      binomen: 'Acropora humilis',
      desc: 'Percabangan silinder montok membulat seperti rimpang jahe dengan ujung jari tumpul dan bintik lingkaran.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        ctx.beginPath();
        ctx.moveTo(-14 * sc, 0);
        ctx.quadraticCurveTo(-15 * sc, -28 * sc * hm, -24 * sc, -40 * sc * hm);
        ctx.quadraticCurveTo(-40 * sc, -48 * sc * hm, -46 * sc, -65 * sc * hm);
        ctx.arc(-42 * sc, -75 * sc * hm, 9 * sc, PI * 0.8, -PI * 0.2);
        ctx.quadraticCurveTo(-30 * sc, -65 * sc * hm, -26 * sc, -72 * sc * hm);
        ctx.arc(-20 * sc, -92 * sc * hm, 9 * sc, PI * 0.8, -PI * 0.2);
        ctx.quadraticCurveTo(-12 * sc, -78 * sc * hm, -4 * sc, -82 * sc * hm);
        ctx.arc(5 * sc, -105 * sc * hm, 10 * sc, PI * 0.8, -PI * 0.2);
        ctx.quadraticCurveTo(14 * sc, -82 * sc * hm, 22 * sc, -75 * sc * hm);
        ctx.arc(35 * sc, -78 * sc * hm, 10 * sc, -PI * 0.8, PI * 0.2);
        ctx.quadraticCurveTo(30 * sc, -60 * sc * hm, 20 * sc, -52 * sc * hm);
        ctx.quadraticCurveTo(15 * sc, -30 * sc * hm, 14 * sc, 0);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        if (opts.showDots !== false) {
          [[-16, -45, 5], [-32, -62, 4], [-10, -70, 5], [6, -60, 5.5], [14, -38, 4], [-2, -20, 5]].forEach(([sx, sy, r]) => {
            ctx.beginPath(); ctx.arc(sx * sc, sy * sc * hm, r * sc, 0, TWO_PI); ctx.stroke();
          });
        }
        ctx.beginPath(); ctx.arc(0, 0, 14 * sc, PI, TWO_PI); ctx.stroke();
      }
    },

    // 03: DOME POLYPS (Row 1, Col 3)
    {
      id: 'anemone_mounds',
      gridRow: 1, gridCol: 3,
      common: 'Dua Kubah Polip Anemon',
      binomen: 'Goniopora stokesi',
      desc: 'Dua kubah montok berkepala tentakel jari memancar ke segala arah yang bertumpu pada tiga batu kerikil sungai.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        if (opts.showPebbles !== false) {
          drawPebble(ctx, -30 * sc, 4 * sc, 16 * sc, 8 * sc, -0.1, opts.strokeColor, opts.fillColor, opts.lineWidth);
          drawPebble(ctx, 28 * sc, 5 * sc, 18 * sc, 9 * sc, 0.1, opts.strokeColor, opts.fillColor, opts.lineWidth);
          drawPebble(ctx, -2 * sc, 6 * sc, 13 * sc, 7 * sc, 0.05, opts.strokeColor, opts.fillColor, opts.lineWidth);
        }

        const mounds = [
          { mx: -20 * sc, mw: 26 * sc, mh: 60 * sc * hm, angles: [-2.5, -2.1, -1.7, -1.3, -0.9, -0.5], dots: [[-4, -36], [3, -30], [-2, -18]] },
          { mx: 18 * sc, mw: 30 * sc, mh: 80 * sc * hm, angles: [-2.6, -2.2, -1.8, -1.4, -1.0, -0.6], dots: [[-3, -52], [5, -44], [-4, -28], [4, -20]] }
        ];

        mounds.forEach(m => {
          ctx.beginPath();
          ctx.moveTo(m.mx - m.mw * 0.5, 0);
          ctx.bezierCurveTo(m.mx - m.mw * 0.55, -m.mh * 0.6, m.mx - m.mw * 0.45, -m.mh, m.mx, -m.mh);
          ctx.bezierCurveTo(m.mx + m.mw * 0.45, -m.mh, m.mx + m.mw * 0.55, -m.mh * 0.6, m.mx + m.mw * 0.5, 0);
          ctx.closePath(); ctx.fill(); ctx.stroke();

          m.angles.forEach(a => {
            const r0 = m.mw * 0.42;
            const r1 = r0 + 14 * sc;
            ctx.lineWidth = opts.lineWidth * 1.6;
            ctx.beginPath();
            ctx.moveTo(m.mx + Math.cos(a) * r0, -m.mh + Math.sin(a) * (r0 * 0.5));
            ctx.lineTo(m.mx + Math.cos(a) * r1, -m.mh + Math.sin(a) * (r1 * 0.65));
            ctx.stroke();
            ctx.lineWidth = opts.lineWidth;
          });

          if (opts.showDots !== false) {
            ctx.fillStyle = opts.strokeColor;
            m.dots.forEach(([dx, dy]) => {
              ctx.beginPath(); ctx.arc(m.mx + dx * sc, dy * sc * hm, 1.8 * sc, 0, TWO_PI); ctx.fill();
            });
            ctx.fillStyle = opts.fillColor;
          }
        });
      }
    },

    // 04: CRINKLY STAGHORN (Row 1, Col 4)
    {
      id: 'crinkly_staghorn',
      gridRow: 1, gridCol: 4,
      common: 'Tanduk Ranting Keriting Berkeluk',
      binomen: 'Acropora prolifera',
      desc: 'Cabang tanduk karang bergelombang dengan lekukan pinggir organik dan garis alur sumbu di tengah.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        ctx.beginPath();
        ctx.moveTo(-10 * sc, 0);
        ctx.bezierCurveTo(-14 * sc, -20 * sc * hm, -22 * sc, -30 * sc * hm, -32 * sc, -45 * sc * hm);
        ctx.bezierCurveTo(-45 * sc, -55 * sc * hm, -42 * sc, -75 * sc * hm, -35 * sc, -88 * sc * hm);
        ctx.bezierCurveTo(-38 * sc, -98 * sc * hm, -28 * sc, -112 * sc * hm, -18 * sc, -120 * sc * hm);
        ctx.lineTo(-8 * sc, -112 * sc * hm);
        ctx.bezierCurveTo(-4 * sc, -125 * sc * hm, 4 * sc, -132 * sc * hm, 10 * sc, -135 * sc * hm);
        ctx.bezierCurveTo(16 * sc, -125 * sc * hm, 14 * sc, -112 * sc * hm, 18 * sc, -100 * sc * hm);
        ctx.bezierCurveTo(30 * sc, -95 * sc * hm, 42 * sc, -80 * sc * hm, 36 * sc, -65 * sc * hm);
        ctx.bezierCurveTo(28 * sc, -50 * sc * hm, 18 * sc, -40 * sc * hm, 14 * sc, -20 * sc * hm);
        ctx.lineTo(10 * sc, 0);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-2 * sc, -5 * sc);
        ctx.bezierCurveTo(-4 * sc, -25 * sc * hm, -12 * sc, -45 * sc * hm, -8 * sc, -70 * sc * hm);
        ctx.bezierCurveTo(-4 * sc, -90 * sc * hm, 4 * sc, -105 * sc * hm, 6 * sc, -125 * sc * hm);
        ctx.stroke();

        if (opts.showDots !== false) {
          [[-25, -55], [-16, -85], [20, -68], [12, -92]].forEach(([wx, wy]) => {
            ctx.beginPath(); ctx.arc(wx * sc, wy * sc * hm, 4 * sc, 0, TWO_PI); ctx.stroke();
          });
        }
      }
    },

    // 05: DIGITATE HAND (Row 1, Col 5)
    {
      id: 'digitate_hand',
      gridRow: 1, gridCol: 5,
      common: 'Karang Menjari Gerigi Mahkota',
      binomen: 'Acropora gemmifera',
      desc: 'Bentuk lima jari tegak menjari menyerupai telapak tangan dengan tepi ujung bergigi koralit runcing.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        ctx.beginPath();
        ctx.moveTo(-14 * sc, 0);
        ctx.lineTo(-14 * sc, -30 * sc * hm);
        ctx.lineTo(-32 * sc, -45 * sc * hm);
        ctx.lineTo(-36 * sc, -85 * sc * hm);
        ctx.lineTo(-32 * sc, -90 * sc * hm); ctx.lineTo(-28 * sc, -85 * sc * hm);
        ctx.lineTo(-24 * sc, -48 * sc * hm);
        ctx.lineTo(-18 * sc, -95 * sc * hm);
        ctx.lineTo(-14 * sc, -100 * sc * hm); ctx.lineTo(-10 * sc, -95 * sc * hm);
        ctx.lineTo(-6 * sc, -50 * sc * hm);
        ctx.lineTo(-2 * sc, -115 * sc * hm);
        ctx.lineTo(2 * sc, -120 * sc * hm); ctx.lineTo(6 * sc, -115 * sc * hm);
        ctx.lineTo(10 * sc, -48 * sc * hm);
        ctx.lineTo(18 * sc, -105 * sc * hm);
        ctx.lineTo(22 * sc, -110 * sc * hm); ctx.lineTo(26 * sc, -105 * sc * hm);
        ctx.lineTo(24 * sc, -45 * sc * hm);
        ctx.lineTo(34 * sc, -80 * sc * hm);
        ctx.lineTo(38 * sc, -85 * sc * hm); ctx.lineTo(40 * sc, -80 * sc * hm);
        ctx.lineTo(26 * sc, -30 * sc * hm);
        ctx.lineTo(14 * sc, -30 * sc * hm);
        ctx.lineTo(14 * sc, 0);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        if (opts.showDots !== false) {
          ctx.fillStyle = opts.strokeColor;
          [[-6, -8], [0, -12], [6, -7], [-4, -20], [4, -18]].forEach(([dx, dy]) => {
            ctx.beginPath(); ctx.arc(dx * sc, dy * sc, 1.8 * sc, 0, TWO_PI); ctx.fill();
          });
          ctx.fillStyle = opts.fillColor;
        }
      }
    },

    // 06: ANTLER FORK (Row 2, Col 1)
    {
      id: 'antler_fork',
      gridRow: 2, gridCol: 1,
      common: 'Tanduk Rusa Garpu Anggun',
      binomen: 'Acropora cervicornis',
      desc: 'Percabangan tanduk rusa langsing dengan cincin corong terbuka di setiap ujung dahan.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        ctx.beginPath();
        ctx.moveTo(-10 * sc, 0);
        ctx.bezierCurveTo(-14 * sc, -25 * sc * hm, -24 * sc, -40 * sc * hm, -35 * sc, -55 * sc * hm);
        ctx.bezierCurveTo(-45 * sc, -70 * sc * hm, -48 * sc, -88 * sc * hm, -42 * sc, -102 * sc * hm);
        ctx.lineTo(-28 * sc, -98 * sc * hm);
        ctx.bezierCurveTo(-32 * sc, -85 * sc * hm, -30 * sc, -72 * sc * hm, -22 * sc, -62 * sc * hm);
        ctx.bezierCurveTo(-18 * sc, -75 * sc * hm, -14 * sc, -95 * sc * hm, -8 * sc, -112 * sc * hm);
        ctx.lineTo(4 * sc, -110 * sc * hm);
        ctx.bezierCurveTo(0, -92 * sc * hm, 0, -75 * sc * hm, 8 * sc, -62 * sc * hm);
        ctx.bezierCurveTo(18 * sc, -72 * sc * hm, 30 * sc, -78 * sc * hm, 40 * sc, -90 * sc * hm);
        ctx.lineTo(48 * sc, -84 * sc * hm);
        ctx.bezierCurveTo(36 * sc, -68 * sc * hm, 22 * sc, -58 * sc * hm, 14 * sc, -42 * sc * hm);
        ctx.bezierCurveTo(14 * sc, -25 * sc * hm, 12 * sc, -10 * sc * hm, 10 * sc, 0);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        [[-35, -100, 7, 4, -0.3], [-2, -111, 6.5, 4, -0.1], [44, -87, 7, 4, 0.4]].forEach(([rx, ry, ra, rb, rot]) => {
          ctx.beginPath(); ctx.ellipse(rx * sc, ry * sc * hm, ra * sc, rb * sc, rot, 0, TWO_PI); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(rx * sc, ry * sc * hm, ra * sc * 0.55, rb * sc * 0.55, rot, 0, TWO_PI); ctx.stroke();
        });
        ctx.beginPath(); ctx.ellipse(0, 0, 14 * sc, 6 * sc, 0, 0, TWO_PI); ctx.stroke();
      }
    },

    // 07: CRATER BOWL (Row 2, Col 2)
    {
      id: 'crater_bowl',
      gridRow: 2, gridCol: 2,
      common: 'Mangkuk Kawah Cerobong Sponge',
      binomen: 'Xestospongia testudinaria',
      desc: 'Bongkahan mangkuk lebar bertanduk 4 cerobong kawah terbuka dengan sebaran bintik pori kalsit.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        ctx.beginPath();
        ctx.moveTo(-58 * sc, -15 * sc * hm);
        ctx.quadraticCurveTo(-66 * sc, 12 * sc, -32 * sc, 24 * sc);
        ctx.quadraticCurveTo(0, 30 * sc, 32 * sc, 24 * sc);
        ctx.quadraticCurveTo(66 * sc, 12 * sc, 58 * sc, -15 * sc * hm);
        ctx.bezierCurveTo(40 * sc, -4 * sc * hm, 16 * sc, -8 * sc * hm, 0, -6 * sc * hm);
        ctx.bezierCurveTo(-16 * sc, -8 * sc * hm, -40 * sc, -4 * sc * hm, -58 * sc, -15 * sc * hm);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        const chimneys = [
          { cx: -40 * sc, cy: -35 * sc * hm, w: 12 * sc, h: 25 * sc * hm, rx: 9 * sc, ry: 4 * sc },
          { cx: -16 * sc, cy: -58 * sc * hm, w: 13 * sc, h: 52 * sc * hm, rx: 10 * sc, ry: 4.5 * sc },
          { cx: 14 * sc, cy: -66 * sc * hm, w: 14 * sc, h: 60 * sc * hm, rx: 11 * sc, ry: 5 * sc },
          { cx: 42 * sc, cy: -38 * sc * hm, w: 12 * sc, h: 28 * sc * hm, rx: 9 * sc, ry: 4 * sc }
        ];

        chimneys.forEach(ch => {
          ctx.beginPath();
          ctx.moveTo(ch.cx - ch.w * 0.5, ch.cy + ch.h);
          ctx.lineTo(ch.cx - ch.rx, ch.cy);
          ctx.quadraticCurveTo(ch.cx, ch.cy + ch.ry, ch.cx + ch.rx, ch.cy);
          ctx.lineTo(ch.cx + ch.w * 0.5, ch.cy + ch.h);
          ctx.closePath(); ctx.fill(); ctx.stroke();

          ctx.beginPath(); ctx.ellipse(ch.cx, ch.cy, ch.rx, ch.ry, 0, 0, TWO_PI); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(ch.cx, ch.cy, ch.rx * 0.65, ch.ry * 0.65, 0, 0, TWO_PI); ctx.stroke();
        });

        if (opts.showDots !== false) {
          ctx.fillStyle = opts.strokeColor;
          [[-38, 0], [-26, 12], [-14, 4], [-4, 15], [6, 8], [18, 16], [30, 6], [42, 2], [0, 2]].forEach(([dx, dy]) => {
            ctx.beginPath(); ctx.arc(dx * sc, dy * sc, 1.8 * sc, 0, TWO_PI); ctx.fill();
          });
          ctx.fillStyle = opts.fillColor;
        }
      }
    },

    // 08: STRIPED BRANCH (Row 2, Col 3)
    {
      id: 'striped_branch',
      gridRow: 2, gridCol: 3,
      common: 'Ranting Belang Gelang Silinder',
      binomen: 'Stylophora pistillata',
      desc: 'Pohon karang bervolume tebal dengan garis belang horizontal di sekujur dahan dan mulut terbuka di puncak.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        ctx.beginPath();
        ctx.moveTo(-13 * sc, 0);
        ctx.bezierCurveTo(-15 * sc, -25 * sc * hm, -25 * sc, -36 * sc * hm, -36 * sc, -48 * sc * hm);
        ctx.bezierCurveTo(-44 * sc, -60 * sc * hm, -44 * sc, -76 * sc * hm, -38 * sc, -88 * sc * hm);
        ctx.lineTo(-25 * sc, -84 * sc * hm);
        ctx.bezierCurveTo(-30 * sc, -72 * sc * hm, -30 * sc, -60 * sc * hm, -22 * sc, -52 * sc * hm);
        ctx.bezierCurveTo(-18 * sc, -65 * sc * hm, -16 * sc, -85 * sc * hm, -12 * sc, -100 * sc * hm);
        ctx.lineTo(-2 * sc, -98 * sc * hm);
        ctx.bezierCurveTo(-6 * sc, -80 * sc * hm, -6 * sc, -65 * sc * hm, 2 * sc, -52 * sc * hm);
        ctx.bezierCurveTo(12 * sc, -60 * sc * hm, 24 * sc, -64 * sc * hm, 34 * sc, -76 * sc * hm);
        ctx.lineTo(42 * sc, -70 * sc * hm);
        ctx.bezierCurveTo(30 * sc, -56 * sc * hm, 18 * sc, -48 * sc * hm, 13 * sc, -36 * sc * hm);
        ctx.bezierCurveTo(15 * sc, -24 * sc * hm, 13 * sc, -8 * sc * hm, 13 * sc, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        [[-32, -86, 7.5, 4, -0.4], [-7, -99, 6.5, 3.8, -0.1], [38, -73, 6.5, 4, 0.4]].forEach(([rx, ry, ra, rb, rot]) => {
          ctx.beginPath(); ctx.ellipse(rx * sc, ry * sc * hm, ra * sc, rb * sc, rot, 0, TWO_PI); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(rx * sc, ry * sc * hm, ra * sc * 0.6, rb * sc * 0.6, rot, 0, TWO_PI); ctx.stroke();
        });

        if (opts.showBands !== false) {
          const bands = [
            [-11, 0, 11, -12], [-11, -16, 11, -14],
            [-32, -56, -22, -52], [-38, -72, -27, -68],
            [-17, -68, -6, -64], [-14, -84, -4, -82],
            [14, -44, 21, -52], [22, -60, 30, -68]
          ];
          bands.forEach(([x0, y0, x1, y1]) => {
            ctx.beginPath(); ctx.moveTo(x0 * sc, y0 * sc * hm);
            ctx.quadraticCurveTo((x0 + x1) * 0.5 * sc, ((y0 + y1) * 0.5 + 3) * sc * hm, x1 * sc, y1 * sc * hm);
            ctx.stroke();
          });
        }
      }
    },

    // 09: BRAIN DOME (Row 2, Col 4)
    {
      id: 'brain_dome',
      gridRow: 2, gridCol: 4,
      common: 'Kubah Otak Sel Cincin Konsentris',
      binomen: 'Platygyra lamellina',
      desc: 'Kubah setengah bola padat yang dipenuhi puluhan bilik sel cincin konsentris dari dasar hingga puncaknya.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const rx = 52 * sc, ry = 42 * sc * p.hMult;
        ctx.beginPath();
        ctx.moveTo(-rx, 0);
        ctx.bezierCurveTo(-rx, -ry * 1.35, rx, -ry * 1.35, rx, 0);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        if (opts.showDots !== false) {
          ctx.save(); ctx.clip();
          const rings = [
            [-42, -6, 6.5, 5], [-28, -6, 7, 5.5], [-14, -6, 6.5, 5], [0, -6, 7, 5.5], [14, -6, 6.5, 5], [28, -6, 7, 5.5], [42, -6, 6.5, 5],
            [-35, -18, 6.5, 5], [-21, -18, 7, 5.5], [-7, -18, 6.5, 5], [7, -18, 7, 5.5], [21, -18, 7, 5.5], [35, -18, 6.5, 5],
            [-28, -29, 6.5, 5], [-14, -29, 7, 5.5], [0, -29, 6.5, 5], [14, -29, 7, 5.5], [28, -29, 6.5, 5],
            [-16, -39, 6, 4.5], [0, -39, 6.5, 5], [16, -39, 6, 4.5],
            [0, -47, 5.5, 4]
          ];
          rings.forEach(([cx, cy, cra, crb]) => {
            ctx.beginPath(); ctx.ellipse(cx * sc, cy * sc * p.hMult, cra * sc, crb * sc, 0, 0, TWO_PI); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(cx * sc, cy * sc * p.hMult, cra * sc * 0.5, crb * sc * 0.5, 0, 0, TWO_PI); ctx.stroke();
          });
          ctx.restore();
        }

        ctx.beginPath();
        ctx.moveTo(-rx, 0);
        ctx.bezierCurveTo(-rx, -ry * 1.35, rx, -ry * 1.35, rx, 0);
        ctx.closePath(); ctx.stroke();
      }
    },

    // 10: RIBBON GRASS (Row 2, Col 5)
    {
      id: 'ribbon_grass',
      gridRow: 2, gridCol: 5,
      common: 'Riak Rumput Pita Batu Kali',
      binomen: 'Vallisneria spiralis',
      desc: 'Bilah rumput air berkeluk lentur yang meliuk vertikal dari dua batu kerikil sungai yang saling bertumpuk.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        if (opts.showPebbles !== false) {
          drawPebble(ctx, -14 * sc, 5 * sc, 18 * sc, 9 * sc, -0.05, opts.strokeColor, opts.fillColor, opts.lineWidth);
          drawPebble(ctx, 16 * sc, 6 * sc, 18 * sc, 9 * sc, 0.05, opts.strokeColor, opts.fillColor, opts.lineWidth);
        }

        const blades = [
          [-22, 0, -32, -35, -28, -75, -34, -105],
          [-12, 0, -18, -40, -10, -85, -14, -120],
          [-2, 0, 2, -45, -2, -90, 2, -125],
          [8, 0, 16, -40, 12, -80, 18, -115],
          [18, 0, 28, -35, 24, -75, 30, -100]
        ];
        blades.forEach(([x0, y0, cx1, cy1, cx2, cy2, tx, ty]) => {
          ctx.beginPath();
          ctx.moveTo((x0 - 3) * sc, y0 * sc);
          ctx.bezierCurveTo((cx1 - 4) * sc, cy1 * sc * hm, (cx2 - 3) * sc, cy2 * sc * hm, tx * sc, ty * sc * hm);
          ctx.bezierCurveTo((cx2 + 3) * sc, cy2 * sc * hm, (cx1 + 4) * sc, cy1 * sc * hm, (x0 + 3) * sc, y0 * sc);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
        });
      }
    },

    // 11: CHIMNEY CLUSTER (Row 3, Col 1)
    {
      id: 'chimney_cluster',
      gridRow: 3, gridCol: 1,
      common: 'Gugusan Cerobong Tabung Laut',
      binomen: 'Haliclona fascigera',
      desc: 'Lembah mangkuk rendah dengan lima cerobong kawah terbuka bertingkat menghadap ke atas.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        ctx.beginPath();
        ctx.moveTo(-52 * sc, -12 * sc * hm);
        ctx.quadraticCurveTo(-60 * sc, 14 * sc, -28 * sc, 22 * sc);
        ctx.quadraticCurveTo(0, 28 * sc, 28 * sc, 22 * sc);
        ctx.quadraticCurveTo(60 * sc, 14 * sc, 52 * sc, -12 * sc * hm);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        const chimneys = [
          { cx: -42 * sc, cy: -28 * sc * hm, rx: 11 * sc, ry: 5 * sc },
          { cx: -24 * sc, cy: -48 * sc * hm, rx: 13 * sc, ry: 5.5 * sc },
          { cx: 0, cy: -56 * sc * hm, rx: 14 * sc, ry: 6 * sc },
          { cx: 25 * sc, cy: -46 * sc * hm, rx: 13 * sc, ry: 5.5 * sc },
          { cx: 44 * sc, cy: -26 * sc * hm, rx: 10 * sc, ry: 4.5 * sc }
        ];
        chimneys.forEach(ch => {
          ctx.beginPath(); ctx.ellipse(ch.cx, ch.cy, ch.rx, ch.ry, 0, 0, TWO_PI); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(ch.cx, ch.cy, ch.rx * 0.6, ch.ry * 0.6, 0, 0, TWO_PI); ctx.stroke();
        });

        if (opts.showDots !== false) {
          ctx.fillStyle = opts.strokeColor;
          [[-30, 2], [-12, 10], [6, 12], [24, 4], [0, 4]].forEach(([dx, dy]) => {
            ctx.beginPath(); ctx.arc(dx * sc, dy * sc, 1.8 * sc, 0, TWO_PI); ctx.fill();
          });
          ctx.fillStyle = opts.fillColor;
        }
      }
    },

    // 12: SPOTTED FLAME SHRUB (Row 3, Col 2)
    {
      id: 'spotted_flame',
      gridRow: 3, gridCol: 2,
      common: 'Semak Karang Lidah Api Bercak',
      binomen: 'Millepora dichotoma',
      desc: 'Semak karang meliuk menyerupai jilatan api dengan corak cincin dan bintik polip di badannya.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        ctx.beginPath();
        ctx.moveTo(-12 * sc, 0);
        ctx.bezierCurveTo(-18 * sc, -25 * sc * hm, -28 * sc, -42 * sc * hm, -40 * sc, -55 * sc * hm);
        ctx.bezierCurveTo(-52 * sc, -68 * sc * hm, -48 * sc, -88 * sc * hm, -40 * sc, -98 * sc * hm);
        ctx.lineTo(-30 * sc, -90 * sc * hm);
        ctx.bezierCurveTo(-34 * sc, -78 * sc * hm, -30 * sc, -68 * sc * hm, -20 * sc, -58 * sc * hm);
        ctx.bezierCurveTo(-16 * sc, -75 * sc * hm, -12 * sc, -98 * sc * hm, -6 * sc, -118 * sc * hm);
        ctx.lineTo(6 * sc, -115 * sc * hm);
        ctx.bezierCurveTo(0, -95 * sc * hm, 2 * sc, -75 * sc * hm, 12 * sc, -62 * sc * hm);
        ctx.bezierCurveTo(22 * sc, -72 * sc * hm, 34 * sc, -76 * sc * hm, 42 * sc, -88 * sc * hm);
        ctx.lineTo(48 * sc, -80 * sc * hm);
        ctx.bezierCurveTo(36 * sc, -64 * sc * hm, 22 * sc, -54 * sc * hm, 15 * sc, -40 * sc * hm);
        ctx.bezierCurveTo(15 * sc, -22 * sc * hm, 13 * sc, -8 * sc * hm, 12 * sc, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (opts.showDots !== false) {
          [[-25, -50], [-10, -78], [15, -60], [-4, -30]].forEach(([sx, sy]) => {
            ctx.beginPath(); ctx.arc(sx * sc, sy * sc * hm, 4.5 * sc, 0, TWO_PI); ctx.stroke();
          });
          ctx.fillStyle = opts.strokeColor;
          [[-16, -20], [8, -35], [-2, -60], [25, -68], [-32, -75]].forEach(([dx, dy]) => {
            ctx.beginPath(); ctx.arc(dx * sc, dy * sc * hm, 2 * sc, 0, TWO_PI); ctx.fill();
          });
          ctx.fillStyle = opts.fillColor;
        }
      }
    },

    // 13: PEDESTAL TREE (Row 3, Col 3)
    {
      id: 'pedestal_tree',
      gridRow: 3, gridCol: 3,
      common: 'Pohon Karang Berundak Trap',
      binomen: 'Acropora hyacinthus',
      desc: 'Pohon tegak pada bantalan batu undak dengan dahan mendatar bertingkat dan cawan koralit di tiap ujung.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        // Pedestal base
        if (opts.showPebbles !== false) {
          ctx.beginPath();
          ctx.moveTo(-32 * sc, 8 * sc);
          ctx.lineTo(-24 * sc, -4 * sc);
          ctx.lineTo(24 * sc, -4 * sc);
          ctx.lineTo(32 * sc, 8 * sc);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }

        // Trunk
        ctx.beginPath();
        ctx.moveTo(-8 * sc, -4 * sc);
        ctx.lineTo(-8 * sc, -120 * sc * hm);
        ctx.lineTo(8 * sc, -120 * sc * hm);
        ctx.lineTo(8 * sc, -4 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        const branches = [
          [-8 * sc, -25 * sc * hm, -34 * sc, -38 * sc * hm],
          [8 * sc, -40 * sc * hm, 36 * sc, -55 * sc * hm],
          [-8 * sc, -60 * sc * hm, -32 * sc, -75 * sc * hm],
          [8 * sc, -80 * sc * hm, 30 * sc, -95 * sc * hm],
          [-8 * sc, -98 * sc * hm, -24 * sc, -110 * sc * hm]
        ];
        branches.forEach(([x0, y0, x1, y1]) => {
          ctx.beginPath();
          ctx.moveTo(x0, y0 - 4 * sc);
          ctx.lineTo(x1, y1 - 4 * sc);
          ctx.lineTo(x1, y1 + 4 * sc);
          ctx.lineTo(x0, y0 + 4 * sc);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(x1, y1, 5 * sc, 3.5 * sc, 0, 0, TWO_PI); ctx.fill(); ctx.stroke();
        });
        ctx.beginPath(); ctx.ellipse(0, -120 * sc * hm, 8 * sc, 4.5 * sc, 0, 0, TWO_PI); ctx.fill(); ctx.stroke();
      }
    },

    // 14: TWISTED PILLAR (Row 3, Col 4)
    {
      id: 'twisted_pillar',
      gridRow: 3, gridCol: 4,
      common: 'Pilar Spiral Terpilin Heliks',
      binomen: 'Dendronephthya klunzingeri',
      desc: 'Pilar terpilin berbentuk kurva S dengan pita heliks diagonal dan tunas anakan kecil di pangkalnya.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        if (opts.showPebbles !== false) {
          ctx.beginPath(); ctx.ellipse(0, 5 * sc, 36 * sc, 14 * sc, 0, 0, TWO_PI); ctx.fill(); ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(-16 * sc, 5 * sc);
        ctx.bezierCurveTo(-24 * sc, -30 * sc * hm, 8 * sc, -60 * sc * hm, -12 * sc, -95 * sc * hm);
        ctx.bezierCurveTo(-18 * sc, -110 * sc * hm, -12 * sc, -125 * sc * hm, -4 * sc, -130 * sc * hm);
        ctx.bezierCurveTo(4 * sc, -125 * sc * hm, 6 * sc, -110 * sc * hm, 2 * sc, -95 * sc * hm);
        ctx.bezierCurveTo(18 * sc, -60 * sc * hm, -6 * sc, -30 * sc * hm, 16 * sc, 5 * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (opts.showBands !== false) {
          [-15, -40, -65, -90, -115].forEach(sy => {
            ctx.beginPath();
            ctx.moveTo(-14 * sc, sy * sc * hm);
            ctx.quadraticCurveTo(0, (sy - 6) * sc * hm, 14 * sc, (sy - 12) * sc * hm);
            ctx.stroke();
          });
        }

        // Small side shoot
        ctx.beginPath();
        ctx.moveTo(18 * sc, 5 * sc);
        ctx.quadraticCurveTo(32 * sc, -10 * sc * hm, 30 * sc, -25 * sc * hm);
        ctx.quadraticCurveTo(22 * sc, -10 * sc * hm, 16 * sc, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    },

    // 15: SUNBURST POLYPS (Row 3, Col 5)
    {
      id: 'sunburst_polyps',
      gridRow: 3, gridCol: 5,
      common: 'Bunga Polip Surya Kelopak Mekar',
      binomen: 'Tubastraea faulkneri',
      desc: 'Dua tabung kalsit silindris bermahkota kelopak bunga matahari mekar memancar dengan bintik koralit.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        function drawFlower(cx, w, h, numPetals, petalR) {
          ctx.beginPath();
          ctx.moveTo(cx - w * 0.5, 0);
          ctx.lineTo(cx - w * 0.42, -h);
          ctx.lineTo(cx + w * 0.42, -h);
          ctx.lineTo(cx + w * 0.5, 0);
          ctx.closePath(); ctx.fill(); ctx.stroke();

          if (opts.showDots !== false) {
            ctx.fillStyle = opts.strokeColor;
            [[-w * 0.25, -10], [0, -14], [w * 0.22, -8], [-w * 0.15, -22], [w * 0.18, -20]].forEach(([dx, dy]) => {
              ctx.beginPath(); ctx.arc(cx + dx, dy * sc * hm, 1.6 * sc, 0, TWO_PI); ctx.fill();
            });
            ctx.fillStyle = opts.fillColor;
          }

          for (let pt = 0; pt < numPetals; pt++) {
            const ang = (pt / numPetals) * TWO_PI;
            const px0 = cx + Math.cos(ang) * (w * 0.35);
            const py0 = -h + Math.sin(ang) * (w * 0.25);
            const px1 = cx + Math.cos(ang) * (w * 0.35 + petalR);
            const py1 = -h + Math.sin(ang) * (w * 0.25 + petalR * 0.75);
            const perpA = ang + HALF_PI;
            const pw = 3.5 * sc;
            ctx.beginPath();
            ctx.moveTo(px0 - Math.cos(perpA) * pw, py0 - Math.sin(perpA) * pw);
            ctx.lineTo(px1, py1);
            ctx.lineTo(px0 + Math.cos(perpA) * pw, py0 + Math.sin(perpA) * pw);
            ctx.closePath(); ctx.fill(); ctx.stroke();
          }
          ctx.beginPath(); ctx.ellipse(cx, -h, w * 0.30, w * 0.20, 0, 0, TWO_PI); ctx.fill(); ctx.stroke();
        }

        drawFlower(-24 * sc, 28 * sc, 55 * sc * hm, 12, 18 * sc);
        drawFlower(22 * sc, 34 * sc, 78 * sc * hm, 14, 22 * sc);
      }
    },

    // 16: SEAWEED CLUMP (Row 4, Col 1)
    {
      id: 'seaweed_clump',
      gridRow: 4, gridCol: 1,
      common: 'Rumpun Daun Rumput Kali',
      binomen: 'Potamogeton crispus',
      desc: 'Gugusan daun air berujung runcing dengan lekukan kurva anggun yang bertumpu pada batu kerikil danau.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        if (opts.showPebbles !== false) {
          drawPebble(ctx, -14 * sc, 5 * sc, 18 * sc, 9 * sc, -0.05, opts.strokeColor, opts.fillColor, opts.lineWidth);
          drawPebble(ctx, 16 * sc, 6 * sc, 18 * sc, 9 * sc, 0.05, opts.strokeColor, opts.fillColor, opts.lineWidth);
        }

        const leaves = [
          [-16, 0, -28, -40, -22, -80, -30, -110],
          [-8, 0, -14, -50, -4, -95, -12, -130],
          [2, 0, 6, -55, 0, -100, 4, -135],
          [10, 0, 20, -45, 14, -85, 22, -118],
          [18, 0, 30, -35, 24, -70, 32, -95]
        ];
        leaves.forEach(([x0, y0, cx1, cy1, cx2, cy2, tx, ty]) => {
          ctx.beginPath();
          ctx.moveTo((x0 - 3.5) * sc, y0 * sc);
          ctx.bezierCurveTo((cx1 - 5) * sc, cy1 * sc * hm, (cx2 - 4) * sc, cy2 * sc * hm, tx * sc, ty * sc * hm);
          ctx.bezierCurveTo((cx2 + 4) * sc, cy2 * sc * hm, (cx1 + 5) * sc, cy1 * sc * hm, (x0 + 3.5) * sc, y0 * sc);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        });
      }
    },

    // 17: PIPE SPONGE BUNDLE (Row 4, Col 2)
    {
      id: 'pipe_bundle',
      gridRow: 4, gridCol: 2,
      common: 'Bundel Tabung Spons Miring',
      binomen: 'Aplysina fistularis',
      desc: 'Sekelompok tabung spons berpenampang miring dengan bibir elips terbuka dan garis alur sumbu memanjang.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        const pipes = [
          { cx: -32 * sc, ang: -0.42, w: 18 * sc, h: 65 * sc * hm },
          { cx: -15 * sc, ang: -0.18, w: 20 * sc, h: 90 * sc * hm },
          { cx: 8 * sc, ang: 0.08, w: 22 * sc, h: 98 * sc * hm },
          { cx: 28 * sc, ang: 0.32, w: 19 * sc, h: 75 * sc * hm }
        ];

        pipes.forEach(pipe => {
          ctx.save();
          ctx.translate(pipe.cx, 0);
          ctx.rotate(pipe.ang);

          ctx.beginPath();
          ctx.moveTo(-pipe.w * 0.5, 0);
          ctx.lineTo(-pipe.w * 0.44, -pipe.h);
          ctx.lineTo(pipe.w * 0.44, -pipe.h);
          ctx.lineTo(pipe.w * 0.5, 0);
          ctx.closePath(); ctx.fill(); ctx.stroke();

          ctx.beginPath(); ctx.ellipse(0, -pipe.h, pipe.w * 0.48, pipe.w * 0.24, 0, 0, TWO_PI); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(0, -pipe.h, pipe.w * 0.30, pipe.w * 0.15, 0, 0, TWO_PI); ctx.stroke();

          ctx.beginPath(); ctx.moveTo(0, -pipe.h + pipe.w * 0.24); ctx.lineTo(0, 0); ctx.stroke();

          if (opts.showDots !== false) {
            ctx.fillStyle = opts.strokeColor;
            [[-pipe.w * 0.22, -pipe.h * 0.4], [pipe.w * 0.22, -pipe.h * 0.6]].forEach(([dx, dy]) => {
              ctx.beginPath(); ctx.arc(dx, dy, 1.8 * sc, 0, TWO_PI); ctx.fill();
            });
            ctx.fillStyle = opts.fillColor;
          }
          ctx.restore();
        });
      }
    },

    // 18: ZIGZAG KNOBBY (Row 4, Col 3)
    {
      id: 'zigzag_knobby',
      gridRow: 4, gridCol: 3,
      common: 'Ranting Berbuku Zigzag Bersusun',
      binomen: 'Pocillopora verrucosa',
      desc: 'Pohon kalsit kokoh dengan tonjolan buku berselang-seling kiri dan kanan berhias mata cincin koralit.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        ctx.beginPath();
        ctx.moveTo(-10 * sc, 0);
        ctx.lineTo(-12 * sc, -20 * sc * hm); ctx.lineTo(-28 * sc, -25 * sc * hm); ctx.arc(-32 * sc, -28 * sc * hm, 5 * sc, PI, 0); ctx.lineTo(-14 * sc, -36 * sc * hm);
        ctx.lineTo(-14 * sc, -50 * sc * hm); ctx.lineTo(-34 * sc, -58 * sc * hm); ctx.arc(-38 * sc, -62 * sc * hm, 5 * sc, PI, 0); ctx.lineTo(-12 * sc, -70 * sc * hm);
        ctx.lineTo(-10 * sc, -90 * sc * hm); ctx.arc(0, -98 * sc * hm, 9 * sc, PI, 0);
        ctx.lineTo(10 * sc, -90 * sc * hm);
        ctx.lineTo(12 * sc, -70 * sc * hm); ctx.lineTo(34 * sc, -62 * sc * hm); ctx.arc(38 * sc, -58 * sc * hm, 5 * sc, 0, PI); ctx.lineTo(14 * sc, -50 * sc * hm);
        ctx.lineTo(14 * sc, -36 * sc * hm); ctx.lineTo(28 * sc, -28 * sc * hm); ctx.arc(32 * sc, -25 * sc * hm, 5 * sc, 0, PI); ctx.lineTo(12 * sc, -20 * sc * hm);
        ctx.lineTo(10 * sc, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (opts.showDots !== false) {
          [[-16, -42], [16, -42], [0, -65], [0, -30]].forEach(([dx, dy]) => {
            ctx.beginPath(); ctx.arc(dx * sc, dy * sc * hm, 3.5 * sc, 0, TWO_PI); ctx.stroke();
          });
        }
      }
    },

    // 19: FAN FINGER CUP (Row 4, Col 4)
    {
      id: 'fan_finger_cup',
      gridRow: 4, gridCol: 4,
      common: 'Kipas Jari Kalsit Cawan',
      binomen: 'Tubipora musica',
      desc: 'Bantalan kipas cekung setengah lingkaran yang melahirkan enam jari silinder tegak di atas hamparan kerikil.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        if (opts.showPebbles !== false) {
          drawPebble(ctx, -22 * sc, 6 * sc, 14 * sc, 7 * sc, -0.1, opts.strokeColor, opts.fillColor, opts.lineWidth);
          drawPebble(ctx, 0, 8 * sc, 16 * sc, 8 * sc, 0, opts.strokeColor, opts.fillColor, opts.lineWidth);
          drawPebble(ctx, 22 * sc, 6 * sc, 14 * sc, 7 * sc, 0.1, opts.strokeColor, opts.fillColor, opts.lineWidth);
        }

        // U-shaped cradle
        ctx.beginPath();
        ctx.moveTo(-45 * sc, -10 * sc * hm);
        ctx.quadraticCurveTo(-52 * sc, 12 * sc, -22 * sc, 18 * sc);
        ctx.quadraticCurveTo(0, 22 * sc, 22 * sc, 18 * sc);
        ctx.quadraticCurveTo(52 * sc, 12 * sc, 45 * sc, -10 * sc * hm);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        const fingers = [-35 * sc, -21 * sc, -7 * sc, 7 * sc, 21 * sc, 35 * sc];
        fingers.forEach(fx => {
          const h = (45 + (1 - Math.abs(fx) / (45 * sc)) * 25) * sc * hm;
          ctx.beginPath();
          ctx.moveTo(fx - 5 * sc, 0);
          ctx.lineTo(fx - 5 * sc, -h);
          ctx.lineTo(fx + 5 * sc, -h);
          ctx.lineTo(fx + 5 * sc, 0);
          ctx.closePath(); ctx.fill(); ctx.stroke();

          ctx.beginPath(); ctx.ellipse(fx, -h, 5 * sc, 2.8 * sc, 0, 0, TWO_PI); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(fx, -h, 2.8 * sc, 1.5 * sc, 0, 0, TWO_PI); ctx.stroke();
        });

        if (opts.showDots !== false) {
          ctx.fillStyle = opts.strokeColor;
          fingers.forEach(fx => {
            [-12, -24, -36].forEach(dy => {
              ctx.beginPath(); ctx.arc(fx, dy * sc * hm, 1.4 * sc, 0, TWO_PI); ctx.fill();
            });
          });
          ctx.fillStyle = opts.fillColor;
        }
      }
    },

    // 20: SPOUT PIPE TREE (Row 4, Col 5)
    {
      id: 'spout_pipe_tree',
      gridRow: 4, gridCol: 5,
      common: 'Pohon Pipa Cerobong Moncong',
      binomen: 'Dendrophyllia ramea',
      desc: 'Batang silinder utama bergaris gelang trap dengan empat cerobong siku menyamping berlubang koralit terbuka.',
      draw: function(ctx, p, opts) {
        const sc = p.scale;
        const hm = p.hMult;
        const tw = 18 * sc, th = 110 * sc * hm;

        ctx.beginPath();
        ctx.moveTo(-tw * 0.5, 0);
        ctx.lineTo(-tw * 0.45, -th);
        ctx.lineTo(tw * 0.45, -th);
        ctx.lineTo(tw * 0.5, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (opts.showBands !== false) {
          [-20, -42, -68, -92].forEach(sy => {
            ctx.beginPath(); ctx.moveTo(-tw * 0.48, sy * sc * hm); ctx.lineTo(tw * 0.48, sy * sc * hm); ctx.stroke();
          });
        }

        const nozzles = [
          { isLeft: true, ny: -30 * sc * hm, len: 14 * sc, rx: 6 * sc, ry: 3.5 * sc },
          { isLeft: false, ny: -50 * sc * hm, len: 13 * sc, rx: 5.5 * sc, ry: 3.5 * sc },
          { isLeft: true, ny: -75 * sc * hm, len: 12 * sc, rx: 5 * sc, ry: 3 * sc },
          { isLeft: false, ny: -98 * sc * hm, len: 20 * sc, rx: 7.5 * sc, ry: 4 * sc }
        ];

        nozzles.forEach(nz => {
          const dir = nz.isLeft ? -1 : 1;
          const edgeX = dir * tw * 0.46;
          const tipX = edgeX + dir * nz.len;
          ctx.beginPath();
          ctx.moveTo(edgeX, nz.ny - nz.ry * 0.85);
          ctx.lineTo(tipX, nz.ny - nz.ry);
          ctx.lineTo(tipX, nz.ny + nz.ry);
          ctx.lineTo(edgeX, nz.ny + nz.ry * 0.85);
          ctx.closePath(); ctx.fill(); ctx.stroke();

          ctx.beginPath(); ctx.ellipse(tipX, nz.ny, nz.rx, nz.ry, 0, 0, TWO_PI); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(tipX, nz.ny, nz.rx * 0.55, nz.ry * 0.55, 0, 0, TWO_PI); ctx.stroke();
        });

        ctx.beginPath(); ctx.ellipse(-5 * sc, -th, 6.5 * sc, 3.8 * sc, -0.2, 0, TWO_PI); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-5 * sc, -th, 3.5 * sc, 2 * sc, -0.2, 0, TWO_PI); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(6 * sc, -th - 6 * sc * hm, 7 * sc, 4 * sc, 0.2, 0, TWO_PI); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(6 * sc, -th - 6 * sc * hm, 4 * sc, 2.2 * sc, 0.2, 0, TWO_PI); ctx.stroke();
      }
    }
  ];

  // -----------------------------------------------------------------
  // 3. Specimen Model Wrapper
  // -----------------------------------------------------------------
  class CoralSpecimen {
    constructor(x, y, seed, config = {}) {
      this.x = x;
      this.y = y;
      this.seed = seed || `Coral_${Math.floor(rand() * 99999)}`;
      set_seed(this.seed);

      // Determine style (0 to 19)
      this.styleIdx = config.styleIdx !== undefined
        ? (Number(config.styleIdx) % CORAL_PRESETS.length)
        : Math.floor(rand() * CORAL_PRESETS.length);

      this.scale = config.scale || 1.0;
      this.hMult = config.hMult || rndtri(0.85, 1.0, 1.25);
      this.wMult = config.wMult || rndtri(0.88, 1.0, 1.20);

      // Hydrodynamic sway
      this.swayPhase = rnd(0, TWO_PI);
      this.swayAmp = 2.5 * this.scale;
      this.currentSwayX = 0;
    }

    update(dt, waterFlow = 0) {
      this.swayPhase += dt * 1.5;
      this.currentSwayX = Math.sin(this.swayPhase) * this.swayAmp + waterFlow * 4;
    }

    render(ctx, options = {}) {
      ctx.save();
      ctx.translate(this.x, this.y);

      const theme = options.theme || 'washi';
      const isMidnight = theme === 'midnight';
      const strokeColor = options.strokeColor || (isMidnight ? '#f0f0f0' : '#151515');
      const fillColor = options.fillColor || (isMidnight ? '#191e28' : '#ffffff');
      const lineWidth = (options.lineWidth || 2.4);

      // Optional drop shadow
      if (options.showShadow !== false) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 6 * this.scale, 45 * this.scale * this.wMult, 10 * this.scale, 0, 0, TWO_PI);
        ctx.fillStyle = isMidnight ? 'rgba(0, 0, 0, 0.45)' : 'rgba(40, 40, 40, 0.08)';
        ctx.fill();
        ctx.restore();
      }

      // Current sway transform
      ctx.save();
      ctx.transform(1, 0, this.currentSwayX / 600, 1, 0, 0);

      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const preset = CORAL_PRESETS[this.styleIdx] || CORAL_PRESETS[0];
      const p = {
        scale: this.scale * this.wMult,
        hMult: this.hMult
      };

      const renderOpts = {
        strokeColor,
        fillColor,
        lineWidth,
        showDots: options.showPolyps !== false,
        showBands: options.showVolumeRings !== false,
        showPebbles: options.showPebbles !== false
      };

      preset.draw(ctx, p, renderOpts);

      ctx.restore(); // Exit sway
      ctx.restore(); // Exit root translate
    }
  }

  // -----------------------------------------------------------------
  // 4. Composite Colony & Reef
  // -----------------------------------------------------------------
  class CoralColony {
    constructor(x, y, seed, options = {}) {
      this.x = x;
      this.y = y;
      this.seed = seed || `Colony_${Math.floor(rand() * 99999)}`;
      set_seed(this.seed);

      this.styleIdx = options.styleIdx !== undefined ? options.styleIdx : 0;
      this.scale = options.scale || 1.0;
      this.corals = [];

      const count = options.single === true ? 1 : Math.max(1, options.count || 1);

      if (count <= 1) {
        this.corals.push(new CoralSpecimen(0, 0, `${this.seed}_0`, {
          styleIdx: this.styleIdx,
          scale: this.scale,
          hMult: options.hMult,
          wMult: options.wMult
        }));
      } else {
        // Main specimen
        this.corals.push(new CoralSpecimen(0, 0, `${this.seed}_main`, {
          styleIdx: this.styleIdx,
          scale: this.scale * 1.05
        }));

        // Satellite companions
        for (let i = 1; i < count; i++) {
          const u = (i / (count - 1) - 0.5) * 2;
          const offX = u * 60 * this.scale + rndtri(-8, 0, 8);
          const offY = rndtri(-4, 0, 4);
          const satScale = rndtri(0.70, 0.85, 0.95) * this.scale;
          this.corals.push(new CoralSpecimen(offX, offY, `${this.seed}_sat_${i}`, {
            styleIdx: this.styleIdx,
            scale: satScale
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

      const margin = 90;
      const step = (width - margin * 2) / Math.max(1, count - 1);

      for (let i = 0; i < count; i++) {
        const baseX = margin + i * step + rndtri(-25, 0, 25);
        const baseY = height - rndtri(10, 22, 36);
        const colSeed = `${this.seed}_reef_${i}`;
        const styleIdx = (i * 3 + Math.floor(rand() * 4)) % CORAL_PRESETS.length;

        const colony = new CoralColony(baseX, baseY, colSeed, {
          styleIdx: styleIdx,
          scale: rndtri(0.85, 1.05, 1.25),
          single: rand() < 0.65,
          count: Math.floor(rnd(2, 3))
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
    CORAL_PRESETS,
    catalog: CORAL_PRESETS,
    getCoralById: function(id) {
      return CORAL_PRESETS.find(c => c.id === id) || CORAL_PRESETS[0];
    },
    getCoralList: function() {
      return CORAL_PRESETS.slice();
    },
    CoralSpecimen,
    CoralColony,
    CoralReef,
    createReef: function(options) {
      return new CoralReef(options);
    }
  };
});
