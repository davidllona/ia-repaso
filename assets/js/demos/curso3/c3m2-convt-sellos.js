/* Experimento: convolución transpuesta "a sellos". Cada número de la entrada estampa el kernel
   multiplicado por él; donde los sellos se solapan, las cifras se SUMAN. Todo se calcula de verdad. */
Lab.register("curso3/c3m2-convt-sellos", function (root, api) {
  var st = { n: 2, k: 3, s: 1, pad: "valid", op: 0, t: 0, sel: null, mode: "sum" };
  var X = [], K = [];
  var rng = api.rng(7);

  function mk(r, c, f) { var a = [], i, j; for (i = 0; i < r; i++) { a.push([]); for (j = 0; j < c; j++) a[i].push(f(i, j)); } return a; }
  function setX(name) {
    if (name === "ej") X = mk(st.n, st.n, function (i, j) { return (i * st.n + j + 1) % 10; });
    else if (name === "unos") X = mk(st.n, st.n, function () { return 1; });
    else if (name === "imp") X = mk(st.n, st.n, function (i, j) { return i === 0 && j === 0 ? 1 : 0; });
    else X = mk(st.n, st.n, function () { return rng.int(0, 9); });
  }
  function setK(name) {
    if (name === "num") K = mk(st.k, st.k, function (i, j) { return (i * st.k + j + 1) % 10; });
    else if (name === "unos") K = mk(st.k, st.k, function () { return 1; });
    else K = mk(st.k, st.k, function () { return rng.int(-2, 9); });
  }
  var xPreset = "ej", kPreset = "num";

  /* ---- geometría del resultado ---- */
  function geo() {
    var n = st.n, k = st.k, s = st.s;
    var full = (n - 1) * s + k;
    var cs = 0, ce = 0, O, E;
    if (st.pad === "same") {
      var T = Math.max(k - s, 0); cs = Math.floor(T / 2); ce = T - cs; O = n * s; E = full;
    } else { O = full + st.op; E = O; }
    return { full: full, cs: cs, ce: ce, O: O, E: E };
  }
  function stamps() { var L = [], i, j; for (i = 0; i < st.n; i++) for (j = 0; j < st.n; j++) L.push([i, j]); return L; }

  /* ---- suma de sellos hasta el paso t ---- */
  function compute(t) {
    var g = geo(), sum = mk(g.E, g.E, function () { return 0; }), cnt = mk(g.E, g.E, function () { return 0; });
    var L = stamps(), q, a, b;
    for (q = 0; q < t; q++) {
      var i = L[q][0], j = L[q][1];
      for (a = 0; a < st.k; a++) for (b = 0; b < st.k; b++) {
        var R = i * st.s + a, C = j * st.s + b;
        sum[R][C] += X[i][j] * K[a][b]; cnt[R][C] += 1;
      }
    }
    return { sum: sum, cnt: cnt, g: g };
  }

  setX("ej"); setK("num");

  /* ---- interfaz ---- */
  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "10px" } });
  root.appendChild(grid);
  function cellDiv() { var c = api.el("div", { style: { minWidth: "0" } }); grid.appendChild(c); return c; }
  var vIn = api.view(cellDiv(), { aspect: 1.6, minH: 190, maxH: 300, label: "Entrada y kernel: toca una casilla para cambiar su valor" });
  var vOut = api.view(cellDiv(), { aspect: 1.15, minH: 240, maxH: 420, label: "Salida de la convolución transpuesta: suma de los sellos" });
  var ui = api.controls(root), out = api.readout(root);

  var slN = ui.slider({ label: "n = lado de la entrada", min: 2, max: 4, step: 1, value: st.n, onInput: function (v) { st.n = v; setX(xPreset); clampT(); } });
  var slK = ui.slider({ label: "k = lado del kernel", min: 1, max: 4, step: 1, value: st.k, onInput: function (v) { st.k = v; setK(kPreset); fixOp(); clampT(); } });
  var slS = ui.slider({ label: "s = stride", min: 1, max: 3, step: 1, value: st.s, onInput: function (v) { st.s = v; fixOp(); clampT(); } });
  var slOp = ui.slider({ label: "output_padding (solo con valid)", min: 0, max: 2, step: 1, value: 0, onInput: function (v) { st.op = v; update(); } });
  ui.select({ label: "padding", options: [["valid", "valid (sin recorte)"], ["same", "same (salida = n·s)"]], value: "valid", onChange: function (v) { st.pad = v; fixOp(); update(); } });
  ui.select({ label: "Entrada", options: [["ej", "1, 2, 3, 4… (ejemplo del texto)"], ["unos", "todo unos"], ["imp", "un solo 1 (impulso)"], ["rnd", "aleatoria"]], value: "ej", onChange: function (v) { xPreset = v; setX(v); st.t = 0; update(); } });
  ui.select({ label: "Kernel", options: [["num", "numerado 1…k²"], ["unos", "todo unos"], ["rnd", "aleatorio"]], value: "num", onChange: function (v) { kPreset = v; setK(v); update(); } });
  var slT = ui.slider({ label: "Sellos colocados", min: 0, max: 4, step: 1, value: 0, fmt: function (v) { return v + " de " + (st.n * st.n); }, onInput: function (v) { st.t = v; update(); } });
  ui.segmented({ label: "Qué mostrar", options: [["sum", "Sumas"], ["cnt", "Nº de sellos por casilla"]], value: "sum", onChange: function (v) { st.mode = v; update(); } });
  var playBtn = ui.button("▶ Colocar sellos", function () {
    if (api.reduceMotion) { st.t = st.n * st.n; slT.set(st.t, true); update(); return; }
    if (loop.running) loop.stop(); else { if (st.t >= st.n * st.n) { st.t = 0; slT.set(0, true); } loop.start(); }
  }, "primary");
  ui.button("Colocar todos", function () { loop.stop(); st.t = st.n * st.n; slT.set(st.t, true); update(); });
  var loop = api.loop(function () {
    if (st.t >= st.n * st.n) return false;
    st.t++; slT.set(st.t, true); update(); return true;
  }, { fps: 1.5, onState: function (on) { playBtn.textContent = on ? "⏸ Pausa" : "▶ Colocar sellos"; } });

  function fixOp() {
    var mx = Math.max(0, st.s - 1);
    slOp.input.max = mx; if (st.op > mx) { st.op = mx; slOp.set(mx, true); }
    slOp.input.disabled = (st.pad === "same");
  }
  function clampT() {
    slT.input.max = st.n * st.n; if (st.t > st.n * st.n) st.t = st.n * st.n; slT.set(st.t, true);
    st.sel = null; update();
  }

  /* ---- dibujo ---- */
  function gridGeom(x0, y0, wMax, hMax, cells) {
    var sz = Math.max(10, Math.min(wMax / cells, hMax / cells));
    return { sz: sz, x: x0 + (wMax - sz * cells) / 2, y: y0 };
  }
  function inLayout(w, h) {
    var half = w / 2, top = 26;
    return { a: gridGeom(0, top, half - 12, h - top - 8, st.n), b: gridGeom(half, top, half - 12, h - top - 8, st.k) };
  }
  vIn.draw(function (ctx, w, h, C) {
    var D = api.d, L = inLayout(w, h), i, j, cur = null, Ls = stamps();
    if (st.t > 0) cur = Ls[st.t - 1];
    D.text(ctx, "Entrada x (" + st.n + "×" + st.n + ")", L.a.x + L.a.sz * st.n / 2, 16, { size: 11, weight: 600, align: "center", color: C.ink2 });
    D.text(ctx, "Kernel K (" + st.k + "×" + st.k + ")", L.b.x + L.b.sz * st.k / 2, 16, { size: 11, weight: 600, align: "center", color: C.ink2 });
    for (i = 0; i < st.n; i++) for (j = 0; j < st.n; j++) {
      var x = L.a.x + j * L.a.sz, y = L.a.y + i * L.a.sz, done = (i * st.n + j) < st.t, isCur = cur && cur[0] === i && cur[1] === j;
      D.rect(ctx, x, y, L.a.sz, L.a.sz, isCur ? C.terracotaWash : (done ? C.cobaltoWash : C.surface), C.line, 1);
      D.text(ctx, String(X[i][j]), x + L.a.sz / 2, y + L.a.sz / 2 + 5, { size: Math.min(16, L.a.sz * 0.42), align: "center", mono: true, weight: 600, color: C.ink });
    }
    if (cur) D.rect(ctx, L.a.x + cur[1] * L.a.sz, L.a.y + cur[0] * L.a.sz, L.a.sz, L.a.sz, null, C.terracota, 3);
    for (i = 0; i < st.k; i++) for (j = 0; j < st.k; j++) {
      var x2 = L.b.x + j * L.b.sz, y2 = L.b.y + i * L.b.sz;
      D.rect(ctx, x2, y2, L.b.sz, L.b.sz, C.oliva, C.paper, 1);
      D.text(ctx, String(K[i][j]), x2 + L.b.sz / 2, y2 + L.b.sz / 2 + 5, { size: Math.min(16, L.b.sz * 0.42), align: "center", mono: true, weight: 600, color: C.paper });
    }
    D.text(ctx, "toca una casilla para cambiar su valor", w / 2, h - 3, { size: 10, align: "center", color: C.muted });
  });
  vIn.pointer({
    down: function (px, py) {
      var L = inLayout(vIn.w, vIn.h), i, j;
      i = Math.floor((py - L.a.y) / L.a.sz); j = Math.floor((px - L.a.x) / L.a.sz);
      if (i >= 0 && i < st.n && j >= 0 && j < st.n) { X[i][j] = (X[i][j] + 1) % 10; update(); return; }
      i = Math.floor((py - L.b.y) / L.b.sz); j = Math.floor((px - L.b.x) / L.b.sz);
      if (i >= 0 && i < st.k && j >= 0 && j < st.k) { K[i][j] = K[i][j] >= 9 ? -3 : K[i][j] + 1; update(); }
    }
  });

  function outGeom(w, h) {
    var g = geo();
    return { g: g, q: gridGeom(0, 26, w, h - 34, g.E) };
  }
  vOut.draw(function (ctx, w, h, C) {
    var D = api.d, R = compute(st.t), g = R.g, q = outGeom(w, h).q, i, j, Ls = stamps();
    var cur = st.t > 0 ? Ls[st.t - 1] : null, maxc = 1;
    for (i = 0; i < g.E; i++) for (j = 0; j < g.E; j++) if (R.cnt[i][j] > maxc) maxc = R.cnt[i][j];
    D.text(ctx, "Salida " + g.O + "×" + g.O + (st.pad === "same" ? " (tras recortar el borde gris)" : ""), w / 2, 16, { size: 11, weight: 600, align: "center", color: C.ink2 });
    for (i = 0; i < g.E; i++) for (j = 0; j < g.E; j++) {
      var x = q.x + j * q.sz, y = q.y + i * q.sz;
      var cropped = (st.pad === "same") && (i < g.cs || i >= g.E - g.ce || j < g.cs || j >= g.E - g.ce);
      var inStamp = cur && i >= cur[0] * st.s && i < cur[0] * st.s + st.k && j >= cur[1] * st.s && j < cur[1] * st.s + st.k;
      var fill = C.surface;
      if (st.mode === "cnt" && R.cnt[i][j] > 0) { D.rect(ctx, x, y, q.sz, q.sz, C.surface); ctx.save(); ctx.globalAlpha = 0.18 + 0.7 * R.cnt[i][j] / Math.max(maxc, 1); D.rect(ctx, x, y, q.sz, q.sz, C.cobalto); ctx.restore(); }
      else { if (inStamp) fill = C.terracotaWash; else if (R.cnt[i][j] > 0) fill = C.cobaltoWash; D.rect(ctx, x, y, q.sz, q.sz, fill); }
      D.rect(ctx, x, y, q.sz, q.sz, null, C.line, 1);
      if (cropped) {
        ctx.save(); ctx.globalAlpha = 0.55; D.rect(ctx, x, y, q.sz, q.sz, C.paper); ctx.restore();
        D.line(ctx, x + 2, y + q.sz - 2, x + q.sz - 2, y + 2, C.muted, 1);
      }
      var big = (st.mode === "cnt") ? R.cnt[i][j] : R.sum[i][j];
      var txtCol = (st.mode === "cnt" && R.cnt[i][j] > maxc * 0.6) ? C.paper : C.ink;
      if ((st.mode === "cnt" && R.cnt[i][j] > 0) || (st.mode === "sum" && R.cnt[i][j] > 0)) {
        D.text(ctx, String(Math.round(big * 100) / 100), x + q.sz / 2, y + q.sz / 2 + 4, { size: Math.min(15, q.sz * 0.38), align: "center", mono: true, weight: 600, color: cropped ? C.muted : txtCol });
      } else if (!cropped) {
        D.text(ctx, "0", x + q.sz / 2, y + q.sz / 2 + 4, { size: Math.min(13, q.sz * 0.34), align: "center", mono: true, color: C.muted });
      }
      if (inStamp && st.mode === "sum" && q.sz >= 30) {
        var v = X[cur[0]][cur[1]] * K[i - cur[0] * st.s][j - cur[1] * st.s];
        D.text(ctx, (v >= 0 ? "+" : "") + v, x + q.sz - 3, y + 10, { size: Math.min(10, q.sz * 0.26), align: "right", mono: true, color: C.terracotaInk });
      }
    }
    if (cur) D.rect(ctx, q.x + cur[1] * st.s * q.sz, q.y + cur[0] * st.s * q.sz, st.k * q.sz, st.k * q.sz, null, C.terracota, 3);
    if (st.pad === "valid" && st.op) D.rect(ctx, q.x + (g.E - st.op) * q.sz, q.y, st.op * q.sz, g.E * q.sz, null, C.muted, 1.5);
    if (st.sel) {
      var r = st.sel[0] + g.cs, c = st.sel[1] + g.cs;
      D.rect(ctx, q.x + c * q.sz, q.y + r * q.sz, q.sz, q.sz, null, C.ink, 2.5);
    }
  });
  vOut.pointer({
    down: function (px, py) {
      var o = outGeom(vOut.w, vOut.h), q = o.q, g = o.g;
      var i = Math.floor((py - q.y) / q.sz), j = Math.floor((px - q.x) / q.sz);
      if (i < 0 || j < 0 || i >= g.E || j >= g.E) return;
      var r = i - g.cs, c = j - g.cs;
      if (r < 0 || c < 0 || r >= g.O || c >= g.O) return;
      st.sel = [r, c]; update();
    }
  });

  function update() {
    var R = compute(st.t), g = R.g, n = st.n, k = st.k, s = st.s, html;
    vIn.redraw(); vOut.redraw();
    var fv = (n - 1) * s + k;
    if (st.pad === "valid") {
      html = "Tamaño de la salida = (n − 1)·s + k" + (st.op ? " + output_padding" : "") + " = (" + n + " − 1)·" + s + " + " + k + (st.op ? " + " + st.op : "") + " = <b>" + g.O + "</b> → salida de <b>" + g.O + "×" + g.O + "</b>";
    } else {
      html = "padding='same': salida = n·s = " + n + "·" + s + " = <b>" + g.O + "</b>. Antes del recorte la salida mide (n − 1)·s + k = " + fv + "; se quitan k − s = " + Math.max(k - s, 0) + " filas/columnas (" + g.cs + " por delante, " + g.ce + " por detrás: el borde gris).";
    }
    var L = stamps();
    if (st.t > 0) {
      var c = L[st.t - 1], v = X[c[0]][c[1]];
      html += "<br>Sello " + st.t + ": x[" + c[0] + "," + c[1] + "] = " + v + " → se estampa " + v + "·K con la esquina en la casilla (" + (c[0] * s) + "," + (c[1] * s) + ").";
    } else html += "<br>Aún no hay ningún sello. Pulsa «Colocar sellos» o mueve el slider.";
    var ov = 0, i, j; for (i = 0; i < g.E; i++) for (j = 0; j < g.E; j++) if (R.cnt[i][j] > 1) ov++;
    html += "<br>Casillas con sellos superpuestos (se suman): <b>" + ov + "</b>";
    if (st.sel && st.t > 0) {
      var rr = st.sel[0] + g.cs, cc = st.sel[1] + g.cs, parts = [], tot = 0, q;
      for (q = 0; q < st.t; q++) {
        var a = rr - L[q][0] * s, b = cc - L[q][1] * s;
        if (a >= 0 && a < k && b >= 0 && b < k) { var pv = X[L[q][0]][L[q][1]] * K[a][b]; parts.push(X[L[q][0]][L[q][1]] + "·" + K[a][b]); tot += pv; }
      }
      html += "<br>Casilla (" + st.sel[0] + "," + st.sel[1] + ") = " + (parts.length ? parts.join(" + ") + " = <b>" + tot + "</b> (" + parts.length + " sello" + (parts.length === 1 ? "" : "s") + ")" : "0 (ningún sello llega hasta aquí)");
    } else if (st.t > 0) html += "<br><span style='opacity:.75'>Toca una casilla de la salida para ver con qué productos se ha calculado.</span>";
    out.set(html);
  }

  fixOp(); slT.input.max = st.n * st.n;
  update();
  return { destroy: function () { loop.stop(); } };
});
