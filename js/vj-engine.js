/* Emotional Frameworks Live: the visuals engine.
   Used twice: by the controller (split-screen preview, visuals-only view) and by output.html (the projector window).
   It only draws. The controller owns the settings (V) and sends audio frames (A); every renderer draws the same thing. */
(function () {
  const TAU = Math.PI * 2, clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;

  const FONTS = [
    ['theme', 'Theme font'], ["'Archivo'", 'Archivo (heavy grotesque)'], ["'Archivo Narrow'", 'Archivo Narrow (condensed)'], ["'Bebas Neue'", 'Bebas Neue (poster caps)'],
    ["'Space Grotesk'", 'Space Grotesk (techno)'], ["'Inter'", 'Inter (Swiss neutral)'], ["'Playfair Display'", 'Playfair Display (editorial serif)'],
    ["'IBM Plex Mono'", 'IBM Plex Mono (typewriter)'], ["'Space Mono'", 'Space Mono (retro mono)'], ['Georgia', 'Georgia (system serif)'], ['system-ui', 'System sans'], ['Impact', 'Impact (system poster)']];

  /* palettes + typography, each a homage to a designer in the Manifesto Machines spirit */
  const THEMES = {
    tomato: { name: 'Tomato', homage: 'Tomato, London, 1990s: night light, streams of type, huge overprinted words', bg: '#07080b', fg: '#f2f0ea', acc: '#ff4b1f', acc2: '#4fd1ff', acc3: '#ffd23f', head: "'Archivo'", headW: 900, mono: "'IBM Plex Mono'", upper: true },
    swiss: { name: 'Swiss (Müller-Brockmann)', homage: 'Josef Müller-Brockmann: the grid, objective type, one red', bg: '#f4f1ea', fg: '#111111', acc: '#e30613', acc2: '#111111', acc3: '#9a9a9a', head: "'Inter'", headW: 800, mono: "'IBM Plex Mono'", upper: false },
    bauhaus: { name: 'Bauhaus (Herbert Bayer)', homage: 'Herbert Bayer and the Bauhaus: primary colours, circle, square, triangle', bg: '#efe6d2', fg: '#151515', acc: '#d6281b', acc2: '#1d4fa3', acc3: '#f2b705', head: "'Archivo'", headW: 800, mono: "'Space Mono'", upper: true },
    tdr: { name: 'The Designers Republic', homage: 'The Designers Republic, Sheffield: acid colour, corporate parody, techno', bg: '#0e0e0e', fg: '#e9ff2a', acc: '#ff2a8a', acc2: '#00e5ff', acc3: '#ffffff', head: "'Space Grotesk'", headW: 700, mono: "'Space Mono'", upper: true },
    saville: { name: 'Peter Saville (Factory)', homage: 'Peter Saville at Factory Records: black, white, restraint, data as image', bg: '#000000', fg: '#ffffff', acc: '#ffffff', acc2: '#8a8a8a', acc3: '#444444', head: "'Archivo Narrow'", headW: 400, mono: "'IBM Plex Mono'", upper: false },
    brody: { name: 'Neville Brody (The Face)', homage: 'Neville Brody at The Face: condensed caps, red and black, type as image', bg: '#111111', fg: '#ffffff', acc: '#e4002b', acc2: '#ffffff', acc3: '#e4002b', head: "'Bebas Neue'", headW: 400, mono: "'Space Mono'", upper: true },
    bass: { name: 'Saul Bass', homage: 'Saul Bass: cut paper, orange and black, title sequences in motion', bg: '#f3e9d2', fg: '#1b1b1b', acc: '#e2541f', acc2: '#1b1b1b', acc3: '#c9a227', head: "'Archivo'", headW: 900, mono: "'Space Mono'", upper: true },
    greiman: { name: 'April Greiman', homage: 'April Greiman, new wave: pastel gradients, layered space, early digital', bg: '#1a1035', fg: '#ffffff', acc: '#ff7ac6', acc2: '#6ef3ff', acc3: '#ffe66e', head: "'Space Grotesk'", headW: 700, mono: "'Space Mono'", upper: false },
    carson: { name: 'David Carson (Ray Gun)', homage: 'David Carson at Ray Gun: grunge, broken grids, type that refuses to sit still', bg: '#e9e4d8', fg: '#222222', acc: '#c1272d', acc2: '#555555', acc3: '#222222', head: "'Playfair Display'", headW: 900, mono: "'Space Mono'", upper: false, rough: true },
    brand: { name: 'Your brand', homage: 'Your own colours, font and logo (set them under BRAND)', bg: '#000000', fg: '#ffffff', acc: '#ff4b1f', acc2: '#ffffff', acc3: '#888888', head: "'Archivo'", headW: 900, mono: "'IBM Plex Mono'", upper: true }
  };
  /* framework moods: if switched on, each emotional framework picks its own look */
  const MOODS = { lifted: 'tomato', twostep: 'greiman', numb: 'saville', panic: 'brody', gospel: 'bass', rave: 'tdr', still: 'swiss' };

  const SCENES = [
    { id: 'overprint', name: 'Overprint', homage: 'Tomato', own: { head: true } },
    { id: 'skyline', name: 'Skyline', homage: 'spectrum city' },
    { id: 'grid', name: 'Swiss Grid', homage: 'Gerstner, Müller-Brockmann' },
    { id: 'particles', name: 'Particle Bloom', homage: 'night light' },
    { id: 'scope', name: 'Sample Scope', homage: 'your vocal, start to end' },
    { id: 'signage', name: 'Signage', homage: 'station boards', own: { head: true, msgs: true } },
    { id: 'radial', name: 'Radial', homage: 'Bauhaus' },
    { id: 'kinetic', name: 'Kinetic Type', homage: 'Saul Bass titles', own: { head: true, msgs: true } }];

  function defaults() {
    return {
      scene: 'overprint', cycle: 'off', cycleSecs: 20, cycleBars: 8, cycleList: SCENES.map((s) => s.id), transition: 'fade',
      theme: 'tomato', fwMoods: false, font: 'theme', caps: true,
      intensity: 0.8, speed: 1, react: 1, trails: 0.15, flash: 0.6, glitch: 0.2, grain: 0.12, textScale: 1,
      headline: '{framework}', showHead: true,
      artist: 'CRAIG STANLEY', track: '{framework} · version {version}', showLower: true,
      ticker: 'EMOTIONAL FRAMEWORKS LIVE  ·  ONE VOCAL LINE, MANY EMOTIONAL FRAMEWORKS  ·  {bpm} BPM IN {key}  ·  ', tickerSpeed: 1, showTicker: true,
      messages: 'the same words, a different room\nsamples are the emotional epicentre\nbegin with something you have no control over\nslower, more breathable\nkeep the fragments in the back of your mind', msgSecs: 6, msgOffset: 0, showMsgs: true,
      brandName: 'EMOTIONAL FRAMEWORKS', logo: '', logoPos: 'tr', showLogo: true, logoSize: 1, brandBg: '#000000', brandFg: '#ffffff', brandAcc: '#ff4b1f', brandFont: "'Archivo'",
      blackout: false, freeze: false
    };
  }
  const emptyFrame = () => ({ e: 0, lo: 0, mid: 0, hi: 0, spec: new Array(48).fill(0), wave: new Array(96).fill(0), bar: 0, bars: 16, step: 0, sec: 'stopped', fw: 0, fwId: 'lifted', fwName: 'Lifted', word: 'LIFTED', bpm: 124, key: 'C', chord: 'C', ver: 1, playing: false, n: { k: 0, c: 0, h: 0, v: 0, b: 0, d: 0 }, log: [], rs: 0, re: 1, smp: 'built-in sung line', mem: false, sketch: '' });

  function fillTokens(str, A, V) {
    const now = new Date();
    return String(str == null ? '' : str).replace(/\{(\w+)\}/g, (m, k) => {
      switch (k) {
        case 'framework': return A.fwName; case 'word': return A.word; case 'bpm': return String(Math.round(A.bpm)); case 'key': return A.key; case 'chord': return A.chord;
        case 'section': return A.sec; case 'version': return String(A.ver).padStart(3, '0'); case 'bar': return String(A.bar + 1); case 'bars': return String(A.bars);
        case 'time': return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); case 'date': return now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
        case 'artist': return V.artist; case 'brand': return V.brandName; case 'sample': return A.smp; default: return m;
      }
    });
  }

  function create(canvas, opts = {}) {
    const g = canvas.getContext('2d');
    const r = { cv: canvas, g, W: 1, H: 1, A: emptyFrame(), V: defaults(), t: 0, last: 0, env: { k: 0, c: 0, h: 0, v: 0, b: 0, d: 0 }, cnt: null, sceneId: null, trans: 0, snap: document.createElement('canvas'), frozen: false, bo: 0, logoImg: null, logoSrc: '', st: {}, ePeak: 0.15, peaks: [], chops: [] };
    const grain = document.createElement('canvas'); grain.width = grain.height = 192; { const gg = grain.getContext('2d'), id = gg.createImageData(192, 192); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } gg.putImageData(id, 0, 0); }

    r.setFrame = (A) => { r.A = Object.assign(r.A, A); };
    r.setSettings = (V) => { const logo = r.V.logo; r.V = Object.assign(defaults(), V); if (V.logo === undefined) r.V.logo = logo; r.setLogo(r.V.logo); };
    r.setLogo = (src) => { r.V.logo = src || ''; if (src === r.logoSrc) return; r.logoSrc = src || ''; if (!src) { r.logoImg = null; return; } const im = new Image(); im.onload = () => (r.logoImg = im); im.src = src; };
    r.setPeaks = (p, ch) => { r.peaks = p || []; r.chops = ch || []; };

    function theme() {
      const V = r.V, A = r.A; let id = V.theme; if (V.fwMoods && MOODS[A.fwId]) id = MOODS[A.fwId];
      let T = Object.assign({}, THEMES[id] || THEMES.tomato); if (id === 'brand') Object.assign(T, { bg: V.brandBg, fg: V.brandFg, acc: V.brandAcc, head: V.brandFont || T.head });
      if (V.font && V.font !== 'theme') T.head = V.font; T.id = id; return T;
    }
    const up = (T, s) => (T.upper && r.V.caps ? String(s).toUpperCase() : String(s));
    const font = (T, px, kind = 'head', w) => kind === 'mono' ? `${w || 500} ${px}px ${T.mono}, ui-monospace, monospace` : `${w || T.headW} ${px}px ${T.head}, system-ui, sans-serif`;
    function fitText(T, text, maxW, maxPx, w) { g.font = font(T, 100, 'head', w); const m = g.measureText(text).width || 1; return Math.max(8, Math.min(maxPx, 100 * maxW / m)); }
    function wrap(text, maxW) { const words = String(text).split(/\s+/), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
    function msgs() { const list = String(r.V.messages || '').split('\n').map((s) => s.trim()).filter(Boolean); return list; }
    function msgIndex(n) { const secs = Math.max(1, +r.V.msgSecs || 6); const raw = Math.floor(Date.now() / 1000 / secs) + (r.V.msgOffset | 0); return { i: n ? ((raw % n) + n) % n : 0, p: (Date.now() / 1000 / secs) % 1, secs }; }
    function alpha(hex, a) { if (!hex || hex[0] !== '#') return hex; let h = hex.slice(1); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1)})`; }
    const rnd = (seed) => { let a = (seed * 2654435761) >>> 0 || 1; return () => { a ^= a << 13; a >>>= 0; a ^= a >> 17; a ^= a << 5; a >>>= 0; return a / 4294967296; }; };

    /* ---------------- scenes ---------------- */
    const D = {};
    D.overprint = (T, A, V, E) => {
      const { W, H } = r, s = r.st.op || (r.st.op = { b: Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), r: 0.01 + Math.random() * 0.06, c: Math.random(), v: (Math.random() - 0.5) * 0.00018 })) });
      const lift = (A.sec === 'drop' ? 1 : A.sec === 'build' ? 0.7 : 0.45) * (0.6 + E.e * 0.8);
      s.b.forEach((b) => { b.x = (b.x + b.v * (A.bpm / 60) * V.speed * r.dt * 60 + 1) % 1; const rr = b.r * Math.max(W, H) * (1 + E.k * 0.25 * V.intensity); const col = b.c < 0.3 ? T.acc : b.c < 0.6 ? T.acc3 : T.acc2; const gr = g.createRadialGradient(b.x * W, b.y * H, 0, b.x * W, b.y * H, rr); gr.addColorStop(0, alpha(col, 0.22 * lift * V.intensity)); gr.addColorStop(1, alpha(col, 0)); g.fillStyle = gr; g.fillRect(b.x * W - rr, b.y * H - rr, rr * 2, rr * 2); });
      // streams of type: the versions log and the messages, like a diary of the night
      const lines = [...A.log, ...msgs().map((m) => up(T, m))]; if (lines.length) { const px = Math.max(10, H * 0.016) * V.textScale; g.font = font(T, px, 'mono'); g.fillStyle = alpha(T.fg, 0.38); const cols = Math.max(2, Math.floor(W / (px * 26))); for (let c = 0; c < cols; c++) for (let k = 0; k < Math.min(lines.length, 40); k++) { if ((k + c) % cols) continue; const y = ((k * px * 1.7 + c * 53 + r.t * px * 1.2 * (c % 2 ? 1 : 0.7)) % (H + 30)) - 15; g.fillText(lines[k], 18 + c * (W / cols), y); } }
      // the huge headline, overprinted
      if (V.showHead) { const word = up(T, fillTokens(V.headline, A, V)) || ' ', fs = Math.min(H * 0.36, fitText(T, word, W * 0.92, H * 0.36)) * V.textScale; g.font = font(T, fs); g.textBaseline = 'alphabetic'; const y0 = H * 0.58, jit = A.sec === 'drop' ? Math.sin(r.t * 18) * 3 * V.intensity : 0, off = 6 + E.k * 16 * V.intensity * V.react;
        g.lineWidth = Math.max(1, fs / 90); g.strokeStyle = alpha(T.fg, 0.85); g.strokeText(word, W * 0.04 + off, y0 + off + jit); g.fillStyle = T.acc; g.fillText(word, W * 0.04, y0);
        g.font = font(T, Math.max(10, H * 0.018), 'mono', 600); g.fillStyle = T.fg; g.fillText(up(T, `VERSION ${String(A.ver).padStart(3, '0')} · ${A.fwName} · ${Math.round(A.bpm)} BPM · KEY ${A.key} · CHORD ${A.chord} · BAR ${A.bar + 1}/${A.bars} · ${A.sec}`), W * 0.04, y0 + H * 0.06); }
      const bw = W * 0.92; for (let k = 0; k < A.bars; k++) { g.fillStyle = k === A.bar && A.playing ? T.acc : alpha(T.fg, 0.25 + (k >= A.bars / 2 && k < A.bars * 7 / 8 ? 0.4 : 0)); g.fillRect(W * 0.04 + k * bw / A.bars, H * 0.06, bw / A.bars - 3, 4); }
    };
    D.skyline = (T, A, V, E) => {
      const { W, H } = r, hz = H * 0.62, n = A.spec.length, bw = W / n;
      // perspective floor
      g.strokeStyle = alpha(T.acc2, 0.25 + E.lo * 0.3); g.lineWidth = 1; const sp = (r.t * 0.6 * V.speed) % 1; for (let k = 0; k < 14; k++) { const z = (k + sp) / 14, y = hz + Math.pow(z, 2.2) * (H - hz); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } for (let k = -12; k <= 12; k++) { g.beginPath(); g.moveTo(W / 2 + k * W * 0.02, hz); g.lineTo(W / 2 + k * W * 0.14, H); g.stroke(); }
      for (let i = 0; i < n; i++) { const v = Math.pow(A.spec[i] / 255, 1.2) * V.react, h = v * H * 0.52 * (0.5 + V.intensity * 0.6) + 2, x = i * bw; g.fillStyle = i % 8 === (A.step >> 1) % 8 && A.playing ? T.acc : T.fg; g.fillRect(x + 1, hz - h, bw - 2, h); g.fillStyle = alpha(T.fg, 0.18); g.fillRect(x + 1, hz, bw - 2, h * 0.45); if (v > 0.6) { g.fillStyle = T.acc3; g.fillRect(x + 1, hz - h - 6, bw - 2, 3); } }
      g.fillStyle = T.acc; g.fillRect(0, hz - 1, W, 2 + E.k * 6 * V.intensity);
      // the live waveform, high over the city
      g.strokeStyle = T.acc2; g.lineWidth = 2 + E.v * 3; g.beginPath(); A.wave.forEach((v, i) => { const x = (i / (A.wave.length - 1)) * W, y = H * 0.2 + (v / 128) * H * 0.12 * (0.6 + V.react); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    };
    D.grid = (T, A, V, E) => {
      const { W, H } = r, cols = 8, cell = W / cols, rows = Math.ceil(H / cell), R = rnd(A.n.b + 7), shapes = [];
      for (let k = 0; k < cols * rows; k++) shapes.push(Math.floor(R() * 4));
      g.strokeStyle = alpha(T.fg, 0.18); g.lineWidth = 1; for (let i = 0; i <= cols; i++) { g.beginPath(); g.moveTo(i * cell, 0); g.lineTo(i * cell, H); g.stroke(); } for (let j = 0; j <= rows; j++) { g.beginPath(); g.moveTo(0, j * cell); g.lineTo(W, j * cell); g.stroke(); }
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const k = j * cols + i, v = A.spec[(i * 5 + j * 3) % A.spec.length] / 255, sz = cell * (0.18 + 0.72 * clamp(v * V.react * (0.7 + V.intensity * 0.4), 0, 1)), cx = i * cell + cell / 2, cy = j * cell + cell / 2, hot = (i + j + A.step) % 7 === 0 && A.playing;
        g.save(); g.translate(cx, cy); g.rotate(((shapes[k] % 2 ? 1 : -1) * r.t * 0.3 * V.speed) + E.k * 0.4 * V.intensity * (k % 3 - 1)); g.fillStyle = hot ? T.acc : k % 11 === 0 ? T.acc2 : T.fg;
        const sh = shapes[k]; g.beginPath(); if (sh === 0) g.arc(0, 0, sz / 2, 0, TAU); else if (sh === 1) g.rect(-sz / 2, -sz / 2, sz, sz); else if (sh === 2) { g.moveTo(-sz / 2, sz / 2); g.arc(-sz / 2, sz / 2, sz, -Math.PI / 2, 0); g.closePath(); } else { g.rect(-sz / 2, -sz * 0.12, sz, sz * 0.24); } g.fill(); g.restore(); }
      g.fillStyle = T.acc; g.fillRect(0, 0, W * clamp(A.playing ? (A.step + 1) / 16 : 0, 0, 1), Math.max(4, H * 0.012));
    };
    D.particles = (T, A, V, E) => {
      const { W, H } = r, s = r.st.pt || (r.st.pt = { p: [], lastK: -1 }), cx = W / 2, cy = H / 2, max = Math.round(300 + 900 * V.intensity);
      const burst = (n, pw) => { for (let k = 0; k < n && s.p.length < max; k++) { const a = Math.random() * TAU, v = (0.5 + Math.random()) * pw; s.p.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: Math.random(), sz: 1 + Math.random() * 3 }); } };
      if (r.cnt && A.n.k !== s.lastK) { burst(Math.round(40 + 80 * V.intensity), 6 + 10 * V.react); s.lastK = A.n.k; }
      burst(Math.round(E.e * 10 * V.intensity * V.react) + 1, 2 + E.e * 6);
      const sp = V.speed * r.dt * 60; s.p = s.p.filter((p) => p.life > 0);
      s.p.forEach((p) => { const a = Math.sin(p.x * 0.004 + r.t * 0.7) + Math.cos(p.y * 0.004 - r.t * 0.5); p.vx += Math.cos(a * 2) * 0.08 * sp; p.vy += Math.sin(a * 2) * 0.08 * sp; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx * sp; p.y += p.vy * sp; p.life -= 0.006 * sp; g.globalAlpha = clamp(p.life, 0, 1); g.fillStyle = p.c < 0.5 ? T.fg : p.c < 0.8 ? T.acc : T.acc2; g.fillRect(p.x, p.y, p.sz * (1 + E.hi), p.sz * (1 + E.hi)); }); g.globalAlpha = 1;
      const rr = Math.min(W, H) * (0.05 + E.lo * 0.12 * V.react + E.k * 0.05); const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 3); gr.addColorStop(0, alpha(T.acc, 0.7)); gr.addColorStop(1, alpha(T.acc, 0)); g.fillStyle = gr; g.fillRect(cx - rr * 3, cy - rr * 3, rr * 6, rr * 6);
    };
    D.scope = (T, A, V, E) => {
      const { W, H } = r, x0 = W * 0.05, w = W * 0.9, y0 = H * 0.42, amp = H * 0.22, p = r.peaks;
      g.font = font(T, Math.max(11, H * 0.022), 'mono', 600); g.fillStyle = T.fg; { const lb = up(T, `SLOT 1 · ${A.smp}`); g.fillText(lb, x0 + w - g.measureText(lb).width, H * 0.155); }
      if (p && p.length) { const n = p.length, a = A.rs * w, z = A.re * w;
        g.fillStyle = alpha(T.fg, 0.08); g.fillRect(x0 + a, y0 - amp - 10, z - a, amp * 2 + 20);
        for (let i = 0; i < n; i++) { const x = x0 + (i / n) * w, inR = i / n >= A.rs && i / n <= A.re, h = p[i] * amp * (inR ? 1 + E.v * 0.5 * V.react : 0.6); g.fillStyle = inR ? (E.v > 0.3 ? T.acc : T.fg) : alpha(T.fg, 0.25); g.fillRect(x, y0 - h, Math.max(1, w / n - 0.5), h * 2); }
        g.fillStyle = T.acc; r.chops.forEach((c) => { const x = x0 + (A.rs + c * (A.re - A.rs)) * w; g.fillRect(x, y0 - amp - 14, 2, amp * 2 + 28); });
        [[a, 'START'], [z, 'END']].forEach(([x, l]) => { g.fillStyle = T.acc3; g.fillRect(x0 + x - 2, y0 - amp - 30, 4, amp * 2 + 60); g.font = font(T, Math.max(10, H * 0.018), 'mono', 700); g.fillText(l, x0 + x + (l === 'END' ? -g.measureText(l).width - 8 : 8), y0 - amp - 18); });
        if (E.v > 0.02) { const ph = x0 + a + (z - a) * (1 - E.v); g.fillStyle = T.acc2; g.fillRect(ph - 1.5, y0 - amp - 10, 3, amp * 2 + 20); } }
      // oscilloscope of the master
      g.strokeStyle = T.acc2; g.lineWidth = 2; g.beginPath(); A.wave.forEach((v, i) => { const x = x0 + (i / (A.wave.length - 1)) * w, y = H * 0.8 + (v / 128) * H * 0.08 * (0.5 + V.react); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
      g.fillStyle = alpha(T.fg, 0.6); g.font = font(T, Math.max(10, H * 0.016), 'mono'); g.fillText(up(T, `START ${A.rs.toFixed(3)} · END ${A.re.toFixed(3)} · ${r.chops.length} CHOPS · ${A.sec}`), x0, H * 0.7);
    };
    D.signage = (T, A, V, E) => {
      const { W, H } = r, m = msgs(), mi = msgIndex(m.length), pad = W * 0.03, top = H * 0.11, colW = W * 0.3;
      // header strip: brand + clock
      g.fillStyle = T.fg; g.fillRect(0, 0, W, top); g.fillStyle = T.bg; g.font = font(T, top * 0.5); g.textBaseline = 'middle'; g.fillText(up(T, V.brandName || ''), pad, top / 2);
      const clock = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); g.font = font(T, top * 0.42, 'mono', 700); const cw = g.measureText(clock).width; g.fillText(clock, W - pad - cw, top / 2); g.textBaseline = 'alphabetic';
      // main message board with a vertical flip
      const bx = pad, by = top + pad, bw = W - colW - pad * 3, bh = H * 0.62; g.strokeStyle = T.fg; g.lineWidth = 3; g.strokeRect(bx, by, bw, bh);
      const msg = up(T, fillTokens(m[mi.i] || fillTokens(V.headline, A, V), A, V)), flip = clamp(mi.p * mi.secs / 0.5, 0, 1);
      g.save(); g.beginPath(); g.rect(bx, by, bw, bh); g.clip(); let fs = Math.min(bh * 0.3, W * 0.09) * V.textScale; g.font = font(T, fs); let lines = wrap(msg, bw - pad * 2); while (lines.length * fs * 1.05 > bh - pad * 2 && fs > 14) { fs *= 0.9; g.font = font(T, fs); lines = wrap(msg, bw - pad * 2); }
      const ty = by + bh - pad - (lines.length - 1) * fs * 1.02 + (1 - flip) * bh; g.fillStyle = T.fg; lines.forEach((l, k) => g.fillText(l, bx + pad, ty + k * fs * 1.02 - fs * 0.15)); g.restore();
      g.fillStyle = T.acc; g.fillRect(bx, by + bh - 6, bw * mi.p, 6);
      // right column: now / next / tempo
      const rx = W - colW - pad, lab = (y, t) => { g.fillStyle = T.acc; g.font = font(T, Math.max(10, H * 0.02), 'mono', 700); g.fillText(t, rx, y); };
      lab(by + H * 0.025, 'NOW'); g.fillStyle = T.fg; g.font = font(T, Math.min(H * 0.06, fitText(T, up(T, A.fwName), colW, H * 0.06))); g.fillText(up(T, A.fwName), rx, by + H * 0.09);
      g.font = font(T, Math.max(11, H * 0.022), 'mono'); g.fillText(up(T, fillTokens(V.track, A, V)).slice(0, 40), rx, by + H * 0.13);
      lab(by + H * 0.2, 'NEXT'); g.fillStyle = alpha(T.fg, 0.75); g.font = font(T, Math.max(11, H * 0.026)); wrap(up(T, fillTokens(m[(mi.i + 1) % Math.max(1, m.length)] || '', A, V)), colW).slice(0, 3).forEach((l, k) => g.fillText(l, rx, by + H * 0.25 + k * H * 0.032));
      lab(by + H * 0.4, 'TEMPO'); g.fillStyle = E.k > 0.5 ? T.acc : T.fg; g.font = font(T, H * 0.11 * (1 + E.k * 0.06 * V.intensity), 'head'); g.fillText(String(Math.round(A.bpm)), rx, by + H * 0.52);
      // level meter row
      const my = by + bh + pad * 0.8, mh = H - my - H * 0.16, n = 32; if (mh > 8) for (let i = 0; i < n; i++) { const v = A.spec[Math.floor(i * A.spec.length / n)] / 255; g.fillStyle = i / n < v * V.react ? (i > n * 0.8 ? T.acc : T.fg) : alpha(T.fg, 0.12); g.fillRect(pad + i * (W - pad * 2) / n, my, (W - pad * 2) / n - 4, mh); }
    };
    D.radial = (T, A, V, E) => {
      const { W, H } = r, cx = W / 2, cy = H / 2, R0 = Math.min(W, H) * 0.18, rot = r.t * 0.25 * V.speed + E.k * 0.08;
      for (let k = 6; k > 0; k--) { g.strokeStyle = alpha(T.fg, 0.08 + (k === (A.n.b % 6) + 1 ? 0.4 : 0)); g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R0 * (1 + k * 0.42), 0, TAU); g.stroke(); }
      const n = A.spec.length; for (let i = 0; i < n * 2; i++) { const v = A.spec[i % n] / 255 * V.react, a = rot + (i / (n * 2)) * TAU, r1 = R0 * 1.15, r2 = r1 + v * Math.min(W, H) * 0.3 * (0.5 + V.intensity * 0.6); g.strokeStyle = i % 6 === 0 ? T.acc : T.fg; g.lineWidth = Math.max(2, (TAU * r1) / (n * 2) * 0.55); g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); g.stroke(); }
      g.fillStyle = T.acc; g.beginPath(); g.arc(cx, cy, R0 * (0.75 + E.lo * 0.4 * V.react + E.k * 0.15 * V.intensity), 0, TAU); g.fill();
      const orb = [[T.acc2, 0], [T.acc3, 1], [T.fg, 2]]; orb.forEach(([c, k]) => { const a = -rot * (1.3 + k * 0.4) + k * TAU / 3, rr = R0 * (2.4 + k * 0.5), x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr, s = R0 * (0.28 + (k === 0 ? E.c : k === 1 ? E.h : E.v) * 0.3); g.fillStyle = c; g.beginPath(); if (k === 0) g.arc(x, y, s, 0, TAU); else if (k === 1) g.rect(x - s, y - s, s * 2, s * 2); else { g.moveTo(x, y - s * 1.2); g.lineTo(x + s * 1.1, y + s * 0.8); g.lineTo(x - s * 1.1, y + s * 0.8); g.closePath(); } g.fill(); });
    };
    D.kinetic = (T, A, V, E) => {
      const { W, H } = r, s = r.st.kt || (r.st.kt = { i: 0, lastK: -1, lastB: -1, t: 0 }), words = [fillTokens(V.headline, A, V), ...msgs().map((m) => fillTokens(m, A, V))].join(' ').split(/\s+/).filter(Boolean);
      const trig = A.playing ? A.n.k + A.n.c : Math.floor(r.t * 2 * V.speed); if (trig !== s.lastK) { s.lastK = trig; s.i = (s.i + 1) % Math.max(1, words.length); s.t = 0; } s.t += r.dt;
      const inv = A.n.b % 2 === 1; if (inv) { g.fillStyle = T.acc; g.fillRect(0, 0, W, H); }
      const wd = up(T, words[s.i] || ''), vert = s.i % 5 === 3, maxW = (vert ? H : W) * 0.9, fs0 = fitText(T, wd, maxW, (vert ? W : H) * 0.7) * V.textScale, sc = 1 + Math.max(0, 0.35 - s.t * 2) * V.intensity;
      g.save(); g.translate(W / 2, H / 2); if (vert) g.rotate(-Math.PI / 2); g.scale(sc, sc); g.font = font(T, fs0); g.textAlign = 'center'; g.textBaseline = 'middle';
      const bands = 7, bh = fs0 * 1.2 / bands, gl = V.glitch * (E.hi * 60 + E.k * 40); for (let b = 0; b < bands; b++) { g.save(); g.beginPath(); g.rect(-W, -fs0 * 0.6 + b * bh, W * 2, bh + 1); g.clip(); g.fillStyle = inv ? T.bg : b === 3 && E.k > 0.4 ? T.acc : T.fg; g.fillText(wd, Math.sin(b * 1.7 + r.t * 8) * gl, 0); g.restore(); }
      g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.font = font(T, Math.max(10, H * 0.018), 'mono', 600); g.fillStyle = inv ? T.bg : alpha(T.fg, 0.7); g.fillText(up(T, `${String(s.i + 1).padStart(2, '0')}/${String(words.length).padStart(2, '0')} · ${A.fwName} · ${A.sec}`), W * 0.04, H * 0.08);
    };

    /* ---------------- overlays: headline, message card, lower third, logo, ticker ---------------- */
    function overlays(T, A, V, E, own) {
      const { W, H } = r, tickH = V.showTicker ? Math.max(24, H * 0.055) * V.textScale : 0, pad = W * 0.03;
      if (V.showHead && !own.head) { const t = up(T, fillTokens(V.headline, A, V)), fs = Math.min(H * 0.12, fitText(T, t, W * 0.6, H * 0.12)) * V.textScale; g.font = font(T, fs); g.fillStyle = T.fg; g.globalAlpha = 0.92; g.fillText(t, pad, pad + fs * 0.85); g.globalAlpha = 1; g.fillStyle = T.acc; g.fillRect(pad, pad + fs + 6, Math.min(W * 0.3, fs * 2) * (0.4 + E.k * 0.6), Math.max(3, fs * 0.06)); }
      const m = msgs(); if (V.showMsgs && !own.msgs && m.length) { const mi = msgIndex(m.length), t = up(T, fillTokens(m[mi.i], A, V)), fs = Math.max(12, H * 0.028) * V.textScale, bw = W * 0.32; g.font = font(T, fs); const lines = wrap(t, bw - fs).slice(0, 4), bh = lines.length * fs * 1.25 + fs, bx = W - pad - bw, by = H - tickH - pad - bh - (V.showLower ? H * 0.14 : 0) * 0; const a = clamp(Math.min(mi.p * mi.secs / 0.4, (1 - mi.p) * mi.secs / 0.4), 0, 1);
        g.globalAlpha = a; g.fillStyle = alpha(T.bg, 0.78); g.fillRect(bx, by, bw, bh); g.fillStyle = T.acc; g.fillRect(bx, by, 6, bh); g.fillStyle = T.fg; lines.forEach((l, k) => g.fillText(l, bx + fs * 0.8, by + fs * 1.15 + k * fs * 1.25)); g.globalAlpha = 1; }
      if (V.showLower) { const a1 = up(T, fillTokens(V.artist, A, V)), a2 = up(T, fillTokens(V.track, A, V)), f1 = Math.max(14, H * 0.045) * V.textScale, f2 = Math.max(10, H * 0.022) * V.textScale, y = H - tickH - pad; g.font = font(T, f1); const w1 = g.measureText(a1).width; g.font = font(T, f2, 'mono', 600); const w2 = g.measureText(a2).width, bw = Math.max(w1, w2) + pad;
        g.fillStyle = alpha(T.bg, 0.72); g.fillRect(pad - 10, y - f1 - f2 - 18, bw, f1 + f2 + 26); g.fillStyle = T.acc; g.fillRect(pad - 10, y - f1 - f2 - 18, 6, f1 + f2 + 26); g.fillStyle = T.fg; g.font = font(T, f1); g.fillText(a1, pad + 4, y - f2 - 10); g.font = font(T, f2, 'mono', 600); g.fillStyle = alpha(T.fg, 0.8); g.fillText(a2, pad + 4, y + 2); }
      if (V.showLogo) { const sz = Math.min(W, H) * 0.12 * V.logoSize, pos = V.logoPos || 'tr'; let x = pos[1] === 'l' ? pad : W - pad - sz, y = pos[0] === 't' ? pad : H - tickH - pad - sz; if (r.logoImg) { const im = r.logoImg, ar = im.width / im.height, w = ar >= 1 ? sz : sz * ar, h = ar >= 1 ? sz / ar : sz; if (pos[1] !== 'l') x = W - pad - w; if (pos[0] !== 't') y = H - tickH - pad - h; g.globalAlpha = 0.95; g.drawImage(im, x, y, w, h); g.globalAlpha = 1; } else if (V.brandName) { const t = up(T, V.brandName), fs = Math.max(11, H * 0.022); g.font = font(T, fs, 'head'); const w = g.measureText(t).width + fs; x = pos[1] === 'l' ? pad : W - pad - w; y = pos[0] === 't' ? pad : H - tickH - pad - fs * 1.8; if (!(own.head && r.sceneId === 'signage' && pos[0] === 't')) { g.strokeStyle = T.fg; g.lineWidth = 2; g.strokeRect(x, y, w, fs * 1.8); g.fillStyle = T.fg; g.fillText(t, x + fs / 2, y + fs * 1.25); } } }
      if (V.showTicker) { const y = H - tickH; g.fillStyle = T.acc; g.fillRect(0, y, W, tickH); const t = up(T, fillTokens(V.ticker, A, V)) + '   '; g.font = font(T, tickH * 0.62); g.fillStyle = T.bg; const tw = Math.max(50, g.measureText(t).width), off = ((Date.now() / 1000) * 90 * V.tickerSpeed * (tickH / 40)) % tw; g.textBaseline = 'middle'; for (let x = -off; x < W; x += tw) g.fillText(t, x, y + tickH / 2 + 1); g.textBaseline = 'alphabetic'; }
    }

    /* ---------------- frame ---------------- */
    r.resize = () => { const rc = canvas.getBoundingClientRect(), d = Math.min(opts.maxDpr || 1.5, devicePixelRatio || 1), w = Math.max(1, Math.round(rc.width * d)), h = Math.max(1, Math.round(rc.height * d)); if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; } r.W = rc.width || 1; r.H = rc.height || 1; g.setTransform(d, 0, 0, d, 0, 0); r.d = d; };
    r.render = (now) => {
      now = now || performance.now(); r.dt = clamp((now - (r.last || now)) / 1000, 0, 0.1); r.last = now; r.resize();
      const A = r.A, V = r.V, T = theme(), E = r.env, n = A.n || {};
      // envelopes: counters that went up since the last frame fire a hit
      if (!r.cnt) r.cnt = Object.assign({}, n); for (const k of ['k', 'c', 'h', 'v', 'b', 'd']) { if ((n[k] || 0) !== (r.cnt[k] || 0)) { E[k] = 1; r.cnt[k] = n[k] || 0; } }
      const dec = { k: 7, c: 9, h: 14, v: 1.4, b: 3, d: 1.2 }; for (const k in dec) E[k] = Math.max(0, E[k] - E[k] * dec[k] * r.dt);
      r.ePeak = Math.max(0.06, r.ePeak * 0.995, A.e); E.e = clamp(A.e / r.ePeak, 0, 1); E.lo = A.lo; E.mid = A.mid; E.hi = A.hi;
      if (!V.freeze) r.t += r.dt * V.speed;
      r.bo = lerp(r.bo, V.blackout ? 1 : 0, clamp(r.dt * 6, 0, 1));
      const W = r.W, H = r.H;
      if (V.freeze && r.frozen) { g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(r.frozenCv, 0, 0); g.setTransform(r.d, 0, 0, r.d, 0, 0); }
      else {
        const sc = SCENES.find((s) => s.id === V.scene) || SCENES[0];
        if (r.sceneId !== sc.id) { if (r.sceneId && V.transition !== 'cut') { r.snap.width = canvas.width; r.snap.height = canvas.height; r.snap.getContext('2d').drawImage(canvas, 0, 0); r.trans = 1; } r.sceneId = sc.id; }
        g.globalAlpha = 1; g.fillStyle = alpha(T.bg, sc.id === 'kinetic' || sc.id === 'signage' ? 1 : 1 - V.trails * 0.85); g.fillRect(0, 0, W, H);
        g.save(); try { D[sc.id](T, A, V, E); } catch (e) { console.error(e); } g.restore();
        if (T.rough && V.glitch > 0) { const R = rnd(Math.floor(r.t * 12)); for (let k = 0; k < 3 * V.glitch * (1 + E.k * 3); k++) { const y = R() * H, h = 4 + R() * 30, dx = (R() - 0.5) * 60 * V.glitch; g.drawImage(canvas, 0, y * r.d, canvas.width, h * r.d, dx, y, W, h); } }
        else if (V.glitch > 0 && E.k > 0.6 && A.sec === 'drop') { const R = rnd(A.n.k); for (let k = 0; k < 4 * V.glitch; k++) { const y = R() * H, h = 6 + R() * 26; g.drawImage(canvas, 0, y * r.d, canvas.width, h * r.d, (R() - 0.5) * 50 * V.glitch, y, W, h); } }
        overlays(T, A, V, E, sc.own || {});
        if (r.trans > 0) { const p = r.trans; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); if (V.transition === 'fade') { g.globalAlpha = p; g.drawImage(r.snap, 0, 0); } else if (V.transition === 'wipe') { const x = (1 - p) * canvas.width; g.drawImage(r.snap, x, 0, canvas.width - x, canvas.height, x, 0, canvas.width - x, canvas.height); g.fillStyle = T.acc; g.fillRect(x - 6, 0, 12, canvas.height); } else if (V.transition === 'flash') { g.globalAlpha = p; g.fillStyle = T.acc; g.fillRect(0, 0, canvas.width, canvas.height); } g.restore(); r.trans = Math.max(0, r.trans - r.dt / 0.8); }
        if (V.flash > 0 && E.d > 0.01) { g.fillStyle = alpha(T.acc, E.d * E.d * V.flash * 0.8); g.fillRect(0, 0, W, H); }
        if (V.grain > 0) { g.save(); g.globalAlpha = V.grain * 0.35; g.globalCompositeOperation = 'overlay'; const ox = Math.random() * 192, oy = Math.random() * 192; g.translate(-ox, -oy); g.fillStyle = g.createPattern(grain, 'repeat'); g.fillRect(0, 0, W + 192, H + 192); g.restore(); }
        if (V.freeze) { r.frozenCv = r.frozenCv || document.createElement('canvas'); r.frozenCv.width = canvas.width; r.frozenCv.height = canvas.height; r.frozenCv.getContext('2d').drawImage(canvas, 0, 0); r.frozen = true; } else r.frozen = false;
      }
      if (r.bo > 0.003) { g.fillStyle = `rgba(0,0,0,${r.bo})`; g.fillRect(0, 0, W, H); }
    };
    return r;
  }
  window.VJ = { THEMES, SCENES, FONTS, MOODS, defaults, emptyFrame, fillTokens, create };
})();
