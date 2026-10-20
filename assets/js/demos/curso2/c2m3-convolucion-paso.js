/* Experimento: una convolución 2D paso a paso (ventana, productos, suma, mapa de salida). */
Lab.register("curso2/c2m3-convolucion-paso", function (root, api) {
  var N = 5, img = [], filt = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], bias = 0, relu = false;
  var pos = 0, playing = false, fInputs = [], presetSel;
  var BASE = [[1, 1, 2, 8, 9], [1, 2, 1, 9, 8], [2, 1, 1, 8, 9], [1, 1, 2, 9, 9], [1, 2, 1, 8, 8]];
  var PRESETS = {
    vder: ["Borde vertical (oscuro → claro)", [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]]],
    vizq: ["Borde vertical (claro → oscuro)", [[1, 0, -1], [1, 0, -1], [1, 0, -1]]],
    hor: ["Borde horizontal", [[-1, -1, -1], [0, 0, 0], [1, 1, 1]]],
    suma: ["Sumar los 9 vecinos", [[1, 1, 1], [1, 1, 1], [1, 1, 1]]],
    id: ["Identidad (solo el centro)", [[0, 0, 0], [0, 1, 0], [0, 0, 0]]],
    custom: ["Personalizado", null]
  };

  function makeImg() {
    var r = api.rng(7 + N), i, j; img = [];
    for (i = 0; i < N; i++) {
      img.push([]);
      for (j = 0; j < N; j++) {
        if (N === 5) img[i].push(BASE[i][j]);
        else img[i].push(j < Math.ceil(N / 2) ? 1 + r.int(0, 1) : 8 + r.int(0, 1));
      }
    }
  }
  function outN() { return N - 2; }
  function windowAt(k) { var m = outN(); return { i: Math.floor(k / m), j: k % m }; }
  function calc(i, j) {
    var s = 0, a, b, terms = [];
    for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) { var p = img[i + a][j + b] * filt[a][b]; s += p; terms.push(p); }
    var total = s + bias;
    return { sum: s, total: total, out: relu ? Math.max(0, total) : total, terms: terms };
  }
  function fmt(x) { return Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : (Math.round(x * 100) / 100).toString(); }

  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", gap: "10px", alignItems: "start" } });
  root.appendChild(grid);
  function cellDiv() { var c = api.el("div", { style: { minWidth: "0" } }); grid.appendChild(c); return c; }
  var vImg = api.view(cellDiv(), { aspect: 1, minH: 150, maxH: 330, drag: false, label: "Fotograma de entrada con la ventana de 3 por 3 señalada" });
  var vMul = api.view(cellDiv(), { aspect: 1, minH: 150, maxH: 330, label: "Productos de cada píxel de la ventana por el peso del filtro" });
  var vOut = api.view(cellDiv(), { aspect: 1, minH: 150, maxH: 330, label: "Mapa de salida que se va construyendo" });

  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Tamaño del fotograma", options: [[5, "5×5"], [6, "6×6"], [7, "7×7"]], value: N, onChange: function (v) { N = v; makeImg(); pos = 0; sl.input.max = outN() * outN() - 1; sl.set(0, true); update(); } });
  presetSel = ui.select({ label: "Filtro predefinido", options: Object.keys(PRESETS).map(function (k) { return [k, PRESETS[k][0]]; }), value: "vder", onChange: function (v) { if (PRESETS[v][1]) { setFilter(PRESETS[v][1]); } update(); } });
  var sl = ui.slider({ label: "Paso (posición de la ventana)", min: 0, max: outN() * outN() - 1, step: 1, value: 0, fmt: function (v) { return (v + 1) + " de " + (outN() * outN()); }, onInput: function (v) { pos = v; update(); } });
  ui.slider({ label: "Bias b (se suma al final)", min: -10, max: 10, step: 1, value: 0, onInput: function (v) { bias = v; update(); } });
  ui.toggle({ label: "Aplicar ReLU a la salida", value: false, onChange: function (v) { relu = v; update(); } });
  ui.button("◀ Anterior", function () { stopPlay(); sl.set(Math.max(0, pos - 1)); });
  ui.button("Siguiente ▶", function () { stopPlay(); sl.set(Math.min(outN() * outN() - 1, pos + 1)); }, "primary");
  var playBtn = ui.button("Reproducir", function () { if (playing) stopPlay(); else startPlay(); });
  ui.button("Mostrar todo el mapa", function () { stopPlay(); sl.set(outN() * outN() - 1); });

  /* filtro editable: 3x3 cajas numéricas */
  var fbox = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,64px)", gap: "4px", margin: "2px 0" } });
  var fwrap = api.el("div", { style: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" } },
    api.el("span", { style: { fontSize: ".82rem", fontWeight: "500" }, text: "Filtro editable (3×3):" }), fbox);
  root.insertBefore(fwrap, root.querySelector(".lab-controls"));
  for (var a = 0; a < 3; a++) fInputs.push([]);
  for (a = 0; a < 3; a++) for (var b = 0; b < 3; b++) (function (a, b) {
    var inp = api.el("input", { type: "number", step: "1", min: "-9", max: "9", "aria-label": "Peso fila " + (a + 1) + " columna " + (b + 1),
      style: { width: "64px", padding: ".3rem", font: "inherit", fontFamily: "'IBM Plex Mono',monospace", textAlign: "center", border: "1px solid currentColor", background: "transparent", color: "inherit" } });
    inp.addEventListener("input", function () { var v = parseFloat(inp.value); filt[a][b] = isFinite(v) ? v : 0; presetSel.set("custom"); update(); });
    fInputs[a][b] = inp; fbox.appendChild(inp);
  })(a, b);
  function setFilter(f) { for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) { filt[a][b] = f[a][b]; fInputs[a][b].value = f[a][b]; } }

  var loop = api.loop(function () {
    var last = outN() * outN() - 1;
    if (pos >= last) { stopPlay(); return false; }
    sl.set(pos + 1); return true;
  }, { fps: 1.4, onState: function (s) { playing = s; playBtn.textContent = s ? "Pausa" : "Reproducir"; } });
  function startPlay() { if (api.reduceMotion) { sl.set(outN() * outN() - 1); return; } if (pos >= outN() * outN() - 1) sl.set(0); loop.start(); }
  function stopPlay() { loop.stop(); }

  function gray(v) { var g = Math.round(255 * Math.max(0, Math.min(9, v)) / 9); return "rgb(" + g + "," + g + "," + g + ")"; }
  function geom(v, n, top, bot) {
    var s = Math.min((v.w - 16) / n, (v.h - top - (bot || 8)) / n); s = Math.max(14, s);
    return { s: s, x0: (v.w - s * n) / 2, y0: top };
  }
  var TOP = 22;
  function drawImg(ctx, w, h, C) {
    var D = api.d, g = geom(vImg, N, TOP), wnd = windowAt(pos), i, j;
    D.text(ctx, "Fotograma " + N + "×" + N + " (toca un píxel)", w / 2, 14, { size: 11, align: "center", weight: 600, color: C.ink2 });
    for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
      D.rect(ctx, g.x0 + j * g.s, g.y0 + i * g.s, g.s, g.s, gray(img[i][j]), C.line, 1);
      D.text(ctx, String(img[i][j]), g.x0 + (j + 0.5) * g.s, g.y0 + (i + 0.5) * g.s + 4, { size: Math.min(15, g.s * 0.42), align: "center", mono: true, color: img[i][j] > 4 ? "#111" : "#f3f3f3" });
    }
    D.rect(ctx, g.x0 + wnd.j * g.s, g.y0 + wnd.i * g.s, 3 * g.s, 3 * g.s, null, C.terracota, 3.5);
  }
  function drawMul(ctx, w, h, C) {
    var D = api.d, g = geom(vMul, 3, TOP, 26), wnd = windowAt(pos), c = calc(wnd.i, wnd.j), a, b;
    D.text(ctx, "Píxel × peso = producto", w / 2, 14, { size: 11, align: "center", weight: 600, color: C.ink2 });
    var big = g.s >= 52;
    for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) {
      var p = c.terms[a * 3 + b], x = g.x0 + b * g.s, y = g.y0 + a * g.s;
      D.rect(ctx, x, y, g.s, g.s, p > 0 ? C.cobaltoWash : p < 0 ? C.terracotaWash : C.paper, C.line, 1);
      if (big) {
        D.text(ctx, img[wnd.i + a][wnd.j + b] + "×" + fmt(filt[a][b]), x + g.s / 2, y + g.s * 0.36, { size: Math.min(12, g.s * 0.22), align: "center", mono: true, color: C.muted });
        D.text(ctx, fmt(p), x + g.s / 2, y + g.s * 0.74, { size: Math.min(17, g.s * 0.32), align: "center", mono: true, weight: 600, color: p > 0 ? C.cobaltoInk : p < 0 ? C.terracotaInk : C.muted });
      } else {
        D.text(ctx, fmt(p), x + g.s / 2, y + g.s / 2 + 4, { size: Math.min(14, g.s * 0.4), align: "center", mono: true, weight: 600, color: p > 0 ? C.cobaltoInk : p < 0 ? C.terracotaInk : C.muted });
      }
    }
    D.rect(ctx, g.x0, g.y0, 3 * g.s, 3 * g.s, null, C.ink, 1.5);
    D.text(ctx, "Σ = " + fmt(c.sum) + (bias ? "  + b = " + fmt(c.total) : ""), w / 2, g.y0 + 3 * g.s + 15, { size: 12, align: "center", mono: true, weight: 600, color: C.ink });
  }
  function drawOut(ctx, w, h, C) {
    var D = api.d, m = outN(), g = geom(vOut, m, TOP), i, j, k;
    D.text(ctx, "Mapa de salida " + m + "×" + m, w / 2, 14, { size: 11, align: "center", weight: 600, color: C.ink2 });
    for (i = 0; i < m; i++) for (j = 0; j < m; j++) {
      k = i * m + j;
      var x = g.x0 + j * g.s, y = g.y0 + i * g.s;
      if (k <= pos) {
        var c = calc(i, j), v = c.out;
        D.rect(ctx, x, y, g.s, g.s, v > 0 ? C.cobaltoWash : v < 0 ? C.terracotaWash : C.paper, C.line, 1);
        D.text(ctx, fmt(v), x + g.s / 2, y + g.s / 2 + 4, { size: Math.min(15, g.s * 0.36), align: "center", mono: true, weight: 600, color: v > 0 ? C.cobaltoInk : v < 0 ? C.terracotaInk : C.muted });
      } else {
        D.rect(ctx, x, y, g.s, g.s, C.surface, C.line, 1);
        D.text(ctx, "?", x + g.s / 2, y + g.s / 2 + 4, { size: 13, align: "center", color: C.muted });
      }
    }
    var cur = windowAt(pos);
    D.rect(ctx, g.x0 + cur.j * g.s, g.y0 + cur.i * g.s, g.s, g.s, null, C.terracota, 3.5);
  }
  makeImg(); setFilter(PRESETS.vder[1]);
  vImg.draw(drawImg); vMul.draw(drawMul); vOut.draw(drawOut);
  vImg.pointer({ down: function (px, py) {
    var g = geom(vImg, N, TOP), j = Math.floor((px - g.x0) / g.s), i = Math.floor((py - g.y0) / g.s);
    if (i >= 0 && i < N && j >= 0 && j < N) { img[i][j] = (img[i][j] + 1) % 10; update(); }
  } });
  vImg.canvas.classList.remove("no-cursor"); vImg.canvas.style.cursor = "pointer";

  function update() {
    var wnd = windowAt(pos), c = calc(wnd.i, wnd.j), m = outN();
    vImg.redraw(); vMul.redraw(); vOut.redraw();
    var eq = [], a, b;
    for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) eq.push("(" + img[wnd.i + a][wnd.j + b] + ")(" + fmt(filt[a][b]) + ")");
    out.set("Paso <b>" + (pos + 1) + "</b> de " + (m * m) + " · ventana con su esquina en fila <b>" + wnd.i + "</b>, columna <b>" + wnd.j + "</b><br>" +
      eq.join(" + ") + " = <b>" + fmt(c.sum) + "</b>" + (bias ? " &nbsp;+ b (" + bias + ") = <b>" + fmt(c.total) + "</b>" : "") +
      (relu ? "<br>ReLU: max(0, " + fmt(c.total) + ") = <b>" + fmt(c.out) + "</b>" : "") +
      "<br>" + (c.out > 0 ? "<span class='good'>Respuesta positiva: aquí hay lo que el filtro busca.</span>" : c.out < 0 ? "<span class='bad'>Respuesta negativa: el patrón aparece al revés.</span>" : "Respuesta 0: no hay nada que detectar en esta ventana."));
  }
  update();
  return { destroy: function () { loop.stop(); } };
});
