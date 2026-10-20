/* Experimento: max pooling y average pooling paso a paso, con valores editables y desplazamiento de la imagen. */
Lab.register("curso2/c2m3-pooling", function (root, api) {
  var IMGS = {
    texto: ["Ejemplo del texto (4×4)", [[1, 3, 2, 1], [4, 6, 5, 0], [7, 2, 9, 8], [1, 0, 3, 4]]],
    mancha: ["Una mancha brillante (6×6)", [[0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0], [0, 1, 9, 8, 1, 0], [0, 0, 8, 9, 1, 0], [0, 0, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0]]],
    borde: ["Un borde vertical (6×6)", [[1, 1, 2, 8, 9, 9], [1, 2, 1, 9, 8, 9], [2, 1, 1, 8, 9, 8], [1, 1, 2, 9, 9, 9], [1, 2, 1, 8, 8, 9], [2, 1, 1, 9, 9, 8]]]
  };
  var base, N, f = 2, st = 2, pos = 0, shift = 0, playing = false, preset = "texto", stSel;
  function load(k) { preset = k; base = IMGS[k][1].map(function (r) { return r.slice(); }); N = base.length; shift = 0; pos = 0; }
  function cur() { return base.map(function (r) { return r.map(function (v, j) { return r[((j - shift) % N + N) % N]; }); }); }
  function strideV() { return st === 0 ? f : st; }
  function outN() { return N >= f ? Math.floor((N - f) / strideV()) + 1 : 0; }
  function pool(im, i, j) {
    var a, b, mx = -Infinity, sm = 0, vals = [];
    for (a = 0; a < f; a++) for (b = 0; b < f; b++) { var v = im[i * strideV() + a][j * strideV() + b]; vals.push(v); mx = Math.max(mx, v); sm += v; }
    return { max: mx, avg: sm / (f * f), vals: vals };
  }
  function fmt(x) { return Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : (Math.round(x * 100) / 100).toString(); }

  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", gap: "10px", alignItems: "start" } });
  root.appendChild(grid);
  function cellDiv() { var c = api.el("div", { style: { minWidth: "0" } }); grid.appendChild(c); return c; }
  var vIn = api.view(cellDiv(), { aspect: 1, minH: 150, maxH: 330, label: "Mapa de entrada con la ventana de pooling" });
  var vMax = api.view(cellDiv(), { aspect: 1, minH: 150, maxH: 330, label: "Resultado del max pooling" });
  var vAvg = api.view(cellDiv(), { aspect: 1, minH: 150, maxH: 330, label: "Resultado del average pooling" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Imagen", options: Object.keys(IMGS).map(function (k) { return [k, IMGS[k][0]]; }), value: preset, onChange: function (v) { load(v); fix(); update(); } });
  ui.segmented({ label: "Tamaño de la ventana (f)", options: [[2, "2×2"], [3, "3×3"]], value: f, onChange: function (v) { f = v; fix(); update(); } });
  stSel = ui.segmented({ label: "Stride", options: [[0, "= f (sin solapar)"], [1, "1 (solapando)"]], value: 0, onChange: function (v) { st = v; fix(); update(); } });
  var sl = ui.slider({ label: "Posición de la ventana", min: 0, max: 3, step: 1, value: 0, fmt: function (v) { return (v + 1) + " de " + (outN() * outN() || 1); }, onInput: function (v) { pos = v; update(); } });
  ui.button("Desplazar la imagen 1 columna →", function () { shift = (shift + 1) % N; update(); }, "primary");
  ui.button("Quitar el desplazamiento", function () { shift = 0; update(); });
  var playBtn = ui.button("Reproducir", function () { if (playing) loop.stop(); else start(); });
  var loop = api.loop(function () { var m = outN(); if (pos >= m * m - 1) return false; sl.set(pos + 1); return true; },
    { fps: 1.6, onState: function (s) { playing = s; playBtn.textContent = s ? "Pausa" : "Reproducir"; } });
  function start() { var m = outN(); if (!m) return; if (api.reduceMotion) { sl.set(m * m - 1); return; } if (pos >= m * m - 1) sl.set(0); loop.start(); }
  function fix() { var m = outN(); sl.input.max = Math.max(0, m * m - 1); if (pos > m * m - 1) pos = Math.max(0, m * m - 1); sl.set(pos, true); }

  function gray(v) { var g = Math.round(255 * api.math.clamp(v, 0, 9) / 9); return "rgb(" + g + "," + g + "," + g + ")"; }
  function geom(v, c, top) { var sz = Math.max(12, Math.min((v.w - 14) / c, (v.h - top - 8) / c)); return { sz: sz, x0: (v.w - sz * c) / 2, y0: top }; }
  function drawGrid(ctx, g, c, val, C, fn) {
    var i, j;
    for (i = 0; i < c; i++) for (j = 0; j < c; j++) {
      var v = val(i, j); if (v === null) { api.d.rect(ctx, g.x0 + j * g.sz, g.y0 + i * g.sz, g.sz, g.sz, C.surface, C.line, 1); api.d.text(ctx, "?", g.x0 + (j + .5) * g.sz, g.y0 + (i + .5) * g.sz + 4, { size: 12, align: "center", color: C.muted }); continue; }
      api.d.rect(ctx, g.x0 + j * g.sz, g.y0 + i * g.sz, g.sz, g.sz, gray(v), C.line, 1);
      api.d.text(ctx, fmt(v), g.x0 + (j + .5) * g.sz, g.y0 + (i + .5) * g.sz + 4, { size: Math.min(14, g.sz * 0.38), align: "center", mono: true, color: v > 4 ? "#111" : "#f3f3f3" });
    }
  }
  load("texto"); fix();
  vIn.draw(function (ctx, w, h, C) {
    var im = cur(), g = geom(vIn, N, 22), m = outN(), wi = m ? Math.floor(pos / m) : 0, wj = m ? pos % m : 0;
    api.d.text(ctx, "Entrada " + N + "×" + N + " (toca para editar)", w / 2, 14, { size: 11, weight: 600, align: "center", color: C.ink2 });
    drawGrid(ctx, g, N, function (i, j) { return im[i][j]; }, C);
    if (m) api.d.rect(ctx, g.x0 + wj * strideV() * g.sz, g.y0 + wi * strideV() * g.sz, f * g.sz, f * g.sz, null, C.terracota, 3.5);
  });
  function drawOut(v, key, title) {
    v.draw(function (ctx, w, h, C) {
      var m = outN(), im = cur();
      api.d.text(ctx, title + (m ? " " + m + "×" + m : ""), w / 2, 14, { size: 11, weight: 600, align: "center", color: C.ink2 });
      if (!m) return;
      var g = geom(v, m, 22);
      drawGrid(ctx, g, m, function (i, j) { return i * m + j <= pos ? pool(im, i, j)[key] : null; }, C);
      api.d.rect(ctx, g.x0 + (pos % m) * g.sz, g.y0 + Math.floor(pos / m) * g.sz, g.sz, g.sz, null, C.terracota, 3.5);
    });
  }
  drawOut(vMax, "max", "Max pooling"); drawOut(vAvg, "avg", "Average pooling");
  vIn.pointer({ down: function (px, py) {
    var g = geom(vIn, N, 22), j = Math.floor((px - g.x0) / g.sz), i = Math.floor((py - g.y0) / g.sz);
    if (i >= 0 && i < N && j >= 0 && j < N) { var jb = ((j - shift) % N + N) % N; base[i][jb] = (base[i][jb] + 1) % 10; update(); }
  } });
  vIn.canvas.classList.remove("no-cursor"); vIn.canvas.style.cursor = "pointer";

  function update() {
    vIn.redraw(); vMax.redraw(); vAvg.redraw();
    var m = outN(), im = cur(), ref = base, i, j;
    if (!m) { out.set("<span class='bad'>La ventana " + f + "×" + f + " no cabe en una imagen de " + N + "×" + N + ".</span>"); return; }
    var wi = Math.floor(pos / m), wj = pos % m, pl = pool(im, wi, wj);
    var dIn = 0, dMax = 0, dAvg = 0;
    for (i = 0; i < N; i++) for (j = 0; j < N; j++) if (im[i][j] !== ref[i][j]) dIn++;
    for (i = 0; i < m; i++) for (j = 0; j < m; j++) {
      var p0 = pool(ref, i, j), p1 = pool(im, i, j);
      if (Math.abs(p0.max - p1.max) > 1e-9) dMax++;
      if (Math.abs(p0.avg - p1.avg) > 1e-9) dAvg++;
    }
    out.set("Ventana " + (wi + 1) + "," + (wj + 1) + ": valores [" + pl.vals.join(", ") + "] → max = <b>" + fmt(pl.max) + "</b> · media = (" + pl.vals.join(" + ") + ") / " + (f * f) + " = <b>" + fmt(pl.avg) + "</b><br>" +
      "Tamaño: " + N + "×" + N + " → " + m + "×" + m + " · parámetros que se aprenden: <b>0</b>" +
      (shift ? "<br>Desplazada " + shift + " col.: casillas distintas respecto a la imagen original → entrada <b>" + dIn + "</b> de " + (N * N) + " · max pooling <b>" + dMax + "</b> de " + (m * m) + " · average pooling <b>" + dAvg + "</b> de " + (m * m) : ""));
  }
  update();
  return { destroy: function () { loop.stop(); } };
});
