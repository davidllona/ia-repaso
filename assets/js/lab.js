/* =====================================================================
   LAB — mini-framework para las demos interactivas ("experimentos").

   Una demo es un archivo en assets/js/demos/<nombre>.js que hace:

       Lab.register("curso1/mi-demo", function (root, api) {
         const view = api.view(root, { aspect: 1.7, drag: true });
         const ui   = api.controls(root);
         const out  = api.readout(root);
         ...
       });

   y se usa en el HTML con:

       <figure class="demo" data-demo="curso1/mi-demo"
               data-titulo="Título del experimento">
         <div class="haz">Qué debe hacer el lector…</div>
         <div class="observa">En qué debe fijarse…</div>
       </figure>

   Todo se carga bajo demanda (cuando la demo está cerca de la pantalla).
   ===================================================================== */
(function () {
  "use strict";

  var registry = {};
  var Lab = (window.Lab = { registry: registry });
  var ROOT = function () { return document.body.getAttribute("data-root") || "./"; };

  Lab.register = function (name, fn) { registry[name] = fn; };

  /* ---------- DOM ---------- */
  function el(tag, props) {
    var node = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
      else if (k.slice(0, 2) === "on" && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  var uidCount = 0;
  function uid(p) { return (p || "lab") + "-" + ++uidCount; }

  /* ---------- Colores del tema (lee las variables CSS) ---------- */
  var colorCache = null;
  function colors() {
    if (colorCache) return colorCache;
    var cs = getComputedStyle(document.documentElement);
    function g(n) { return cs.getPropertyValue(n).trim(); }
    colorCache = {
      ink: g("--ink"), ink2: g("--ink-2"), muted: g("--muted"), line: g("--line"),
      paper: g("--paper"), paper2: g("--paper-2"), surface: g("--surface"),
      cobalto: g("--cobalto"), cobaltoInk: g("--cobalto-ink"), cobaltoWash: g("--cobalto-wash"),
      terracota: g("--terracota"), terracotaInk: g("--terracota-ink"), terracotaWash: g("--terracota-wash"),
      oliva: g("--oliva"), olivaInk: g("--oliva-ink"), olivaWash: g("--oliva-wash"),
      marker: g("--marker"), markerWash: g("--marker-wash"), grid: g("--grid")
    };
    return colorCache;
  }
  window.addEventListener("lab:theme", function () { colorCache = null; });

  /* ---------- Matemáticas ---------- */
  var math = {
    sum: function (a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; },
    mean: function (a) { return a.length ? math.sum(a) / a.length : 0; },
    std: function (a) {
      var m = math.mean(a), s = 0;
      for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
      return Math.sqrt(s / (a.length || 1));
    },
    median: function (a) {
      var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length;
      if (!n) return 0;
      return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
    },
    clamp: function (v, a, b) { return Math.min(b, Math.max(a, v)); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    linspace: function (a, b, n) {
      var r = [];
      for (var i = 0; i < n; i++) r.push(n === 1 ? a : a + (b - a) * i / (n - 1));
      return r;
    },
    sigmoid: function (z) { return 1 / (1 + Math.exp(-z)); },
    relu: function (z) { return Math.max(0, z); },
    tanh: function (z) { return Math.tanh(z); },
    softmax: function (arr, T) {
      T = T || 1;
      var m = Math.max.apply(null, arr), e = arr.map(function (v) { return Math.exp((v - m) / T); });
      var s = math.sum(e);
      return e.map(function (v) { return v / s; });
    },
    dot: function (a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; },
    dist: function (a, b) {
      var s = 0;
      for (var i = 0; i < a.length; i++) s += (a[i] - b[i]) * (a[i] - b[i]);
      return Math.sqrt(s);
    },
    /* Resuelve A x = b (eliminación gaussiana con pivote parcial). */
    solve: function (A, b) {
      var n = b.length, M = A.map(function (r, i) { return r.slice().concat([b[i]]); });
      for (var c = 0; c < n; c++) {
        var p = c;
        for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
        var t = M[c]; M[c] = M[p]; M[p] = t;
        if (Math.abs(M[c][c]) < 1e-12) M[c][c] = 1e-12;
        for (var r2 = c + 1; r2 < n; r2++) {
          var f = M[r2][c] / M[c][c];
          for (var k = c; k <= n; k++) M[r2][k] -= f * M[c][k];
        }
      }
      var x = new Array(n);
      for (var i = n - 1; i >= 0; i--) {
        var s = M[i][n];
        for (var j = i + 1; j < n; j++) s -= M[i][j] * x[j];
        x[i] = s / M[i][i];
      }
      return x;
    },
    /* Ajuste polinómico por mínimos cuadrados (con ridge opcional). Devuelve [c0, c1, ... cd]. */
    polyfit: function (xs, ys, deg, ridge) {
      var n = deg + 1, A = [], b = [], i, j, k;
      for (i = 0; i < n; i++) { A.push(new Array(n).fill(0)); b.push(0); }
      for (k = 0; k < xs.length; k++) {
        var pw = [1];
        for (i = 1; i < 2 * n; i++) pw.push(pw[i - 1] * xs[k]);
        for (i = 0; i < n; i++) {
          for (j = 0; j < n; j++) A[i][j] += pw[i + j];
          b[i] += pw[i] * ys[k];
        }
      }
      for (i = 0; i < n; i++) A[i][i] += (ridge || 0) + 1e-9;
      return math.solve(A, b);
    },
    polyval: function (c, x) { var r = 0; for (var i = c.length - 1; i >= 0; i--) r = r * x + c[i]; return r; },
    /* Regresión lineal simple: devuelve {m, b}. */
    linreg: function (xs, ys) {
      var mx = math.mean(xs), my = math.mean(ys), num = 0, den = 0;
      for (var i = 0; i < xs.length; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) * (xs[i] - mx); }
      var m = den ? num / den : 0;
      return { m: m, b: my - m * mx };
    },
    mse: function (a, b) {
      var s = 0;
      for (var i = 0; i < a.length; i++) s += (a[i] - b[i]) * (a[i] - b[i]);
      return s / (a.length || 1);
    }
  };

  /* ---------- Números aleatorios con semilla (mulberry32) ---------- */
  function rng(seed) {
    var a = (seed === undefined ? Date.now() : seed) >>> 0;
    function next() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    var spare = null;
    return {
      next: next,
      range: function (lo, hi) { return lo + (hi - lo) * next(); },
      int: function (lo, hi) { return Math.floor(lo + (hi - lo + 1) * next()); },
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      normal: function (mu, sigma) {
        var z;
        if (spare !== null) { z = spare; spare = null; }
        else {
          var u = 0, v = 0, s = 0;
          do { u = next() * 2 - 1; v = next() * 2 - 1; s = u * u + v * v; } while (s >= 1 || s === 0);
          var f = Math.sqrt(-2 * Math.log(s) / s);
          spare = v * f; z = u * f;
        }
        return (mu || 0) + (sigma === undefined ? 1 : sigma) * z;
      },
      shuffle: function (arr) {
        for (var i = arr.length - 1; i > 0; i--) {
          var j = Math.floor(next() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
      }
    };
  }

  /* ---------- Dibujo ---------- */
  var d = {
    line: function (ctx, x1, y1, x2, y2, color, width, dash) {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width || 1;
      ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    },
    circle: function (ctx, x, y, r, fill, stroke, sw) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 1.5; ctx.stroke(); }
    },
    rect: function (ctx, x, y, w, h, fill, stroke, sw) {
      if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 1; ctx.strokeRect(x, y, w, h); }
    },
    text: function (ctx, str, x, y, o) {
      o = o || {};
      ctx.save();
      ctx.fillStyle = o.color || colors().ink;
      ctx.font = (o.weight || 400) + " " + (o.size || 12) + "px " + (o.mono ? "'IBM Plex Mono',monospace" : "'IBM Plex Sans',system-ui,sans-serif");
      ctx.textAlign = o.align || "left"; ctx.textBaseline = o.baseline || "alphabetic";
      if (o.rotate) { ctx.translate(x, y); ctx.rotate(o.rotate); ctx.fillText(str, 0, 0); }
      else ctx.fillText(str, x, y);
      ctx.restore();
    },
    arrow: function (ctx, x1, y1, x2, y2, color, width) {
      var a = Math.atan2(y2 - y1, x2 - x1), hl = 8 + (width || 1.5);
      ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width || 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hl * 0.6, y2 - Math.sin(a) * hl * 0.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - hl * Math.cos(a - 0.4), y2 - hl * Math.sin(a - 0.4));
      ctx.lineTo(x2 - hl * Math.cos(a + 0.4), y2 - hl * Math.sin(a + 0.4));
      ctx.closePath(); ctx.fill(); ctx.restore();
    },
    path: function (ctx, pts, color, width, dash) {
      if (!pts.length) return;
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width || 1.5; ctx.setLineDash(dash || []);
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke(); ctx.restore();
    }
  };

  /* ---------- Vista (canvas responsive y nítido) ---------- */
  function view(parent, opts) {
    opts = opts || {};
    var canvas = el("canvas", { class: "lab-canvas", role: "img", "aria-label": opts.label || "Gráfico interactivo" });
    canvas.style.touchAction = opts.drag ? "none" : "pan-y";
    if (!opts.drag) canvas.classList.add("no-cursor"); else canvas.classList.add("is-drag");
    parent.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var v = { canvas: canvas, ctx: ctx, w: 300, h: 200, _draw: null };
    var aspect = opts.aspect || 1.6, minH = opts.minH || 180, maxH = opts.maxH || 560;

    function resize() {
      var w = Math.max(200, Math.floor(canvas.parentNode.clientWidth || canvas.clientWidth || 300));
      var h = Math.round(math.clamp(w / aspect, minH, maxH));
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      if (w === v.w && h === v.h && canvas.width === Math.round(w * dpr)) return;
      v.w = w; v.h = h;
      canvas.style.height = h + "px";
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      v.redraw();
    }
    v.redraw = function () {
      var dpr = canvas.width / v.w;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, v.w, v.h);
      if (v._draw) v._draw(ctx, v.w, v.h, colors());
    };
    v.draw = function (fn) { v._draw = fn; v.redraw(); };
    v.label = function (t) { canvas.setAttribute("aria-label", t); };
    v.pointer = function (h) {
      function pos(e) {
        var r = canvas.getBoundingClientRect();
        return [(e.clientX - r.left) * (v.w / r.width), (e.clientY - r.top) * (v.h / r.height)];
      }
      var down = false;
      canvas.addEventListener("pointerdown", function (e) {
        down = true; try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        var p = pos(e); if (h.down) h.down(p[0], p[1], e);
      });
      canvas.addEventListener("pointermove", function (e) {
        var p = pos(e);
        if (down && h.drag) h.drag(p[0], p[1], e);
        if (h.move) h.move(p[0], p[1], e, down);
      });
      function up(e) {
        if (!down) return; down = false;
        var p = pos(e); if (h.up) h.up(p[0], p[1], e);
      }
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
      canvas.addEventListener("pointerleave", function (e) { if (h.leave) h.leave(e); });
    };
    if (window.ResizeObserver) new ResizeObserver(resize).observe(parent);
    else window.addEventListener("resize", resize);
    window.addEventListener("lab:theme", function () { v.redraw(); });
    resize();
    return v;
  }

  /* ---------- Mapeo datos -> píxeles + ejes ---------- */
  function plot(v, o) {
    o = o || {};
    var pad = Object.assign({ l: 46, r: 14, t: 14, b: 38 }, o.pad || {});
    var p = {
      xr: o.xr || [0, 1], yr: o.yr || [0, 1],
      get box() { return { x: pad.l, y: pad.t, w: v.w - pad.l - pad.r, h: v.h - pad.t - pad.b }; },
      x: function (val) { var b = p.box; return b.x + (val - p.xr[0]) / (p.xr[1] - p.xr[0]) * b.w; },
      y: function (val) { var b = p.box; return b.y + b.h - (val - p.yr[0]) / (p.yr[1] - p.yr[0]) * b.h; },
      ix: function (px) { var b = p.box; return p.xr[0] + (px - b.x) / b.w * (p.xr[1] - p.xr[0]); },
      iy: function (py) { var b = p.box; return p.yr[0] + (b.y + b.h - py) / b.h * (p.yr[1] - p.yr[0]); },
      inside: function (px, py) { var b = p.box; return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h; },
      clip: function (ctx) { var b = p.box; ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip(); },
      axes: function (ctx) {
        var C = colors(), b = p.box, nx = o.xticks || 5, ny = o.yticks || 5, i;
        var fx = o.xfmt || function (t) { return +t.toFixed(2); }, fy = o.yfmt || function (t) { return +t.toFixed(2); };
        ctx.save();
        ctx.fillStyle = C.surface; ctx.fillRect(b.x, b.y, b.w, b.h);
        if (o.grid !== false) {
          for (i = 0; i <= nx; i++) { var gx = b.x + b.w * i / nx; d.line(ctx, gx, b.y, gx, b.y + b.h, C.line, 1); }
          for (i = 0; i <= ny; i++) { var gy = b.y + b.h * i / ny; d.line(ctx, b.x, gy, b.x + b.w, gy, C.line, 1); }
        }
        d.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
        for (i = 0; i <= nx; i++) {
          var tv = p.xr[0] + (p.xr[1] - p.xr[0]) * i / nx;
          d.text(ctx, String(fx(tv)), b.x + b.w * i / nx, b.y + b.h + 15, { align: "center", size: 11, color: C.muted, mono: true });
        }
        for (i = 0; i <= ny; i++) {
          var tw = p.yr[0] + (p.yr[1] - p.yr[0]) * i / ny;
          d.text(ctx, String(fy(tw)), b.x - 6, b.y + b.h - b.h * i / ny + 4, { align: "right", size: 11, color: C.muted, mono: true });
        }
        if (o.xlabel) d.text(ctx, o.xlabel, b.x + b.w / 2, v.h - 6, { align: "center", size: 12, color: C.ink2, weight: 500 });
        if (o.ylabel) d.text(ctx, o.ylabel, 13, b.y + b.h / 2, { align: "center", size: 12, color: C.ink2, weight: 500, rotate: -Math.PI / 2 });
        ctx.restore();
      }
    };
    return p;
  }

  /* ---------- Controles ---------- */
  function controls(parent) {
    var wrap = el("div", { class: "lab-controls" });
    var btns = null;
    parent.appendChild(wrap);
    var ui = {
      el: wrap,
      slider: function (o) {
        var id = uid("sl"), fmt = o.fmt || function (x) { return x; };
        var out = el("output", { for: id, text: String(fmt(o.value)) });
        var input = el("input", { type: "range", id: id, min: o.min, max: o.max, step: o.step || 1, value: o.value });
        input.addEventListener("input", function () {
          var val = parseFloat(input.value); out.textContent = String(fmt(val));
          if (o.onInput) o.onInput(val);
        });
        wrap.appendChild(el("div", { class: "ctl" }, el("label", { for: id }, o.label, out), input));
        return {
          input: input,
          get: function () { return parseFloat(input.value); },
          set: function (val, silent) {
            input.value = val; out.textContent = String(fmt(parseFloat(input.value)));
            if (!silent && o.onInput) o.onInput(parseFloat(input.value));
          }
        };
      },
      select: function (o) {
        var id = uid("se"), sel = el("select", { id: id });
        o.options.forEach(function (op) { sel.appendChild(el("option", { value: op[0], text: op[1], selected: String(op[0]) === String(o.value) })); });
        sel.addEventListener("change", function () { if (o.onChange) o.onChange(sel.value); });
        wrap.appendChild(el("div", { class: "ctl" }, el("label", { for: id }, o.label), sel));
        return { el: sel, get: function () { return sel.value; }, set: function (v) { sel.value = v; } };
      },
      segmented: function (o) {
        var seg = el("div", { class: "seg", role: "group", "aria-label": o.label }), cur = o.value, bs = [];
        o.options.forEach(function (op) {
          var b = el("button", { type: "button", text: op[1], "aria-pressed": String(op[0] === cur) });
          b.addEventListener("click", function () {
            cur = op[0]; bs.forEach(function (x, i) { x.setAttribute("aria-pressed", String(o.options[i][0] === cur)); });
            if (o.onChange) o.onChange(cur);
          });
          bs.push(b); seg.appendChild(b);
        });
        wrap.appendChild(el("div", { class: "ctl" }, el("label", {}, o.label), seg));
        return { get: function () { return cur; } };
      },
      toggle: function (o) {
        var on = !!o.value;
        var b = el("button", { type: "button", class: "btn", "aria-pressed": String(on), text: o.label });
        b.addEventListener("click", function () { on = !on; b.setAttribute("aria-pressed", String(on)); if (o.onChange) o.onChange(on); });
        ui._row().appendChild(b);
        return { get: function () { return on; }, set: function (v) { on = !!v; b.setAttribute("aria-pressed", String(on)); } };
      },
      _row: function () {
        if (!btns) { btns = el("div", { class: "lab-btns", style: { gridColumn: "1 / -1" } }); wrap.appendChild(btns); }
        return btns;
      },
      button: function (label, onClick, kind) {
        var b = el("button", { type: "button", class: "btn" + (kind ? " " + kind : ""), text: label });
        b.addEventListener("click", function () { onClick(b); });
        ui._row().appendChild(b);
        return b;
      }
    };
    return ui;
  }

  function readout(parent) {
    var node = el("div", { class: "lab-readout", role: "status", "aria-live": "polite" });
    parent.appendChild(node);
    return { el: node, set: function (h) { node.innerHTML = h; } };
  }

  function legend(parent, items) {
    var C = colors();
    var node = el("div", { class: "lab-legend" });
    items.forEach(function (it) {
      node.appendChild(el("span", {}, el("i", { style: { background: it[0] } }), it[1]));
    });
    parent.appendChild(node);
    return node;
  }

  function table(parent, headers) {
    var t = el("table", { class: "lab-table" }), thead = el("thead"), tbody = el("tbody");
    var tr = el("tr"); headers.forEach(function (h) { tr.appendChild(el("th", { html: h })); });
    thead.appendChild(tr); t.appendChild(thead); t.appendChild(tbody);
    var wrap = el("div", { style: { overflowX: "auto" } }, t);
    parent.appendChild(wrap);
    return {
      el: wrap,
      set: function (rows) {
        tbody.innerHTML = "";
        rows.forEach(function (r) {
          var row = el("tr");
          r.forEach(function (c) { row.appendChild(el("td", { html: String(c) })); });
          tbody.appendChild(row);
        });
      }
    };
  }

  /* ---------- Animación (se detiene sola si la demo sale de pantalla) ---------- */
  function makeLoop(host) {
    return function (fn, o) {
      o = o || {};
      var minDt = 1000 / (o.fps || 30), raf = 0, last = 0, running = false, visible = true;
      if (window.IntersectionObserver) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (!visible) stop(); }).observe(host);
      }
      function frame(t) {
        if (!running) return;
        raf = requestAnimationFrame(frame);
        if (t - last < minDt) return;
        var dt = (t - last) / 1000; last = t;
        if (fn(Math.min(dt, 0.1)) === false) stop();
      }
      function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); if (o.onState) o.onState(true); }
      function stop() { if (!running) return; running = false; cancelAnimationFrame(raf); if (o.onState) o.onState(false); }
      return { start: start, stop: stop, get running() { return running; } };
    };
  }

  function makeApi(host) {
    return {
      el: el, uid: uid, colors: colors, math: math, rng: rng, d: d,
      view: view, plot: plot, controls: controls, readout: readout, legend: legend, table: table,
      loop: makeLoop(host),
      fmt: function (n, k) { return (typeof n === "number" && isFinite(n)) ? n.toFixed(k === undefined ? 2 : k) : String(n); },
      reduceMotion: window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches
    };
  }

  /* ---------- Carga y montaje de demos ---------- */
  var loading = {};
  Lab.load = function (name) {
    if (registry[name]) return Promise.resolve();
    if (loading[name]) return loading[name];
    loading[name] = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = ROOT() + "assets/js/demos/" + name + ".js";
      s.onload = function () { registry[name] ? resolve() : reject(new Error("La demo no se registró: " + name)); };
      s.onerror = function () { reject(new Error("No se pudo cargar " + s.src)); };
      document.head.appendChild(s);
    });
    return loading[name];
  };

  function buildDemo(fig, index) {
    var name = fig.getAttribute("data-demo");
    var titulo = fig.getAttribute("data-titulo") || "Experimento";
    var haz = fig.querySelector(".haz"), obs = fig.querySelector(".observa");
    var hazHtml = haz ? haz.innerHTML : (fig.getAttribute("data-haz") || "");
    var obsHtml = obs ? obs.innerHTML : (fig.getAttribute("data-observa") || "");
    var n = fig.getAttribute("data-n") || String(index);
    fig.innerHTML = "";
    var body = el("div", { class: "demo-body" }, el("div", { class: "demo-loading", text: "Cargando experimento…" }));
    var reset = el("button", { type: "button", class: "demo-reset", text: "Reiniciar", "aria-label": "Reiniciar el experimento" });
    fig.appendChild(el("div", { class: "demo-head" },
      el("span", { class: "demo-tag", text: "Experimento " + n }),
      el("h4", { text: titulo }), reset));
    if (hazHtml) fig.appendChild(el("p", { class: "demo-haz", html: "<strong>Haz esto</strong>" + hazHtml }));
    fig.appendChild(body);
    if (obsHtml) fig.appendChild(el("p", { class: "demo-observa", html: "<strong>Fíjate en</strong>" + obsHtml }));

    var instance = null, mounted = false;
    function mount() {
      body.innerHTML = "";
      try {
        instance = registry[name](body, makeApi(fig)) || null;
        mounted = true;
      } catch (err) {
        console.error("[Lab] Error en la demo " + name, err);
        body.innerHTML = '<p class="demo-error">Este experimento ha fallado al iniciarse: ' + String(err.message || err) + "</p>";
      }
    }
    reset.addEventListener("click", function () {
      if (instance && instance.destroy) { try { instance.destroy(); } catch (_) {} }
      if (mounted) mount();
    });
    function start() {
      Lab.load(name).then(mount).catch(function (err) {
        console.error("[Lab]", err);
        body.innerHTML = '<p class="demo-error">No se pudo cargar este experimento (' + String(err.message || err) + ").</p>";
      });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); start(); }
      }, { rootMargin: "400px 0px" });
      io.observe(fig);
    } else start();
  }

  Lab.init = function (scope) {
    var figs = (scope || document).querySelectorAll("figure.demo[data-demo], div.demo[data-demo]");
    var count = 0;
    Array.prototype.forEach.call(figs, function (f) {
      if (f.__labDone) return; f.__labDone = true; count++; buildDemo(f, count);
    });
  };
  Lab.math = math; Lab.rng = rng; Lab.el = el;
})();
