/* Experimento: "despliegue" mínimo. Dibuja un dígito en la rejilla de 8 × 8 (como la que entrega un sensor) y mira el viaje completo
   de la función predecir(): escalar a 0-1, ampliar a 32 × 32, tres canales, añadir la dimensión del lote, calcular probabilidades y decidir
   con un umbral de confianza. El clasificador es de JUGUETE (el dígito medio de cada clase, calculado con scikit-learn): sirve para ver el
   flujo, no es la CNN del proyecto. */
Lab.register("curso3/c3m7-despliegue", function (root, api) {
  var D = api.d, M = api.math;
  var PROTOS = [[0, 0, 4, 13, 11, 3, 0, 0, 0, 1, 13, 13, 11, 11, 1, 0, 0, 4, 14, 5, 2, 12, 4, 0, 0, 5, 13, 2, 0, 9, 6, 0, 0, 6, 12, 1, 0, 9, 7, 0, 0, 3, 13, 2, 2, 11, 6, 0, 0, 1, 13, 10, 10, 13, 2, 0, 0, 0, 4, 14, 13, 5, 0, 0], [0, 0, 2, 9, 10, 6, 1, 0, 0, 0, 4, 13, 14, 8, 1, 0, 0, 1, 7, 15, 14, 7, 1, 0, 0, 2, 9, 14, 14, 6, 0, 0, 0, 1, 7, 12, 14, 6, 0, 0, 0, 0, 5, 10, 13, 6, 0, 0, 0, 0, 5, 11, 14, 8, 2, 1, 0, 0, 2, 9, 13, 9, 3, 1], [0, 1, 10, 14, 10, 2, 0, 0, 0, 5, 14, 12, 13, 6, 0, 0, 0, 5, 8, 5, 12, 6, 0, 0, 0, 1, 2, 5, 12, 4, 0, 0, 0, 0, 1, 9, 10, 2, 0, 0, 0, 1, 5, 12, 7, 2, 1, 0, 0, 1, 11, 14, 12, 11, 7, 1, 0, 1, 10, 14, 13, 12, 8, 2], [0, 1, 8, 14, 14, 7, 1, 0, 0, 4, 13, 9, 11, 12, 2, 0, 0, 2, 4, 3, 12, 9, 1, 0, 0, 0, 1, 9, 14, 6, 0, 0, 0, 0, 1, 6, 12, 11, 2, 0, 0, 0, 1, 1, 4, 12, 6, 0, 0, 1, 7, 6, 8, 13, 6, 0, 0, 1, 9, 15, 14, 9, 1, 0], [0, 0, 0, 7, 11, 2, 0, 0, 0, 0, 3, 13, 8, 2, 1, 0, 0, 1, 10, 11, 5, 6, 4, 0, 0, 5, 14, 6, 7, 11, 6, 0, 0, 9, 15, 10, 13, 14, 5, 0, 0, 6, 11, 12, 15, 10, 2, 0, 0, 1, 3, 8, 13, 4, 0, 0, 0, 0, 1, 8, 12, 2, 0, 0], [0, 1, 10, 13, 14, 12, 4, 0, 0, 4, 15, 12, 8, 6, 2, 0, 0, 6, 14, 6, 2, 1, 0, 0, 0, 5, 14, 12, 9, 4, 0, 0, 0, 2, 8, 8, 9, 8, 2, 0, 0, 0, 1, 4, 7, 8, 2, 0, 0, 1, 6, 8, 11, 7, 1, 0, 0, 1, 11, 15, 9, 3, 0, 0], [0, 0, 1, 11, 10, 1, 0, 0, 0, 0, 7, 15, 6, 1, 0, 0, 0, 1, 13, 10, 1, 0, 0, 0, 0, 2, 14, 8, 4, 2, 0, 0, 0, 4, 15, 13, 12, 10, 3, 0, 0, 2, 15, 11, 6, 10, 9, 0, 0, 0, 10, 13, 6, 11, 11, 1, 0, 0, 1, 11, 15, 13, 4, 0], [0, 0, 5, 13, 14, 11, 5, 1, 0, 1, 11, 12, 11, 12, 5, 1, 0, 1, 5, 2, 7, 11, 3, 0, 0, 1, 4, 6, 12, 12, 5, 0, 0, 1, 9, 13, 15, 11, 4, 0, 0, 1, 5, 12, 11, 4, 1, 0, 0, 0, 3, 12, 6, 0, 0, 0, 0, 0, 6, 12, 2, 0, 0, 0], [0, 0, 5, 12, 12, 6, 1, 0, 0, 2, 12, 11, 9, 12, 3, 0, 0, 3, 12, 7, 8, 12, 2, 0, 0, 1, 9, 13, 13, 7, 1, 0, 0, 0, 7, 14, 13, 4, 0, 0, 0, 1, 11, 9, 9, 8, 1, 0, 0, 1, 11, 8, 8, 10, 2, 0, 0, 0, 5, 13, 13, 7, 1, 0], [0, 0, 6, 12, 11, 6, 2, 0, 0, 2, 13, 10, 10, 11, 3, 0, 0, 4, 12, 6, 8, 14, 3, 0, 0, 2, 10, 12, 13, 14, 4, 0, 0, 0, 3, 5, 5, 12, 5, 0, 0, 0, 1, 1, 2, 10, 6, 0, 0, 1, 6, 5, 6, 11, 5, 0, 0, 0, 6, 12, 13, 9, 2, 0]];
  var SAMPLES = [[0, 0, 10, 14, 11, 3, 0, 0, 0, 4, 16, 13, 6, 14, 1, 0, 0, 4, 16, 2, 0, 11, 7, 0, 0, 8, 16, 0, 0, 10, 5, 0, 0, 8, 16, 0, 0, 14, 4, 0, 0, 8, 16, 0, 1, 16, 1, 0, 0, 4, 16, 1, 11, 15, 0, 0, 0, 0, 11, 16, 12, 3, 0, 0], [0, 0, 0, 0, 12, 5, 0, 0, 0, 0, 0, 2, 16, 12, 0, 0, 0, 0, 1, 12, 16, 11, 0, 0, 0, 2, 12, 16, 16, 10, 0, 0, 0, 6, 11, 5, 15, 6, 0, 0, 0, 0, 0, 1, 16, 9, 0, 0, 0, 0, 0, 2, 16, 11, 0, 0, 0, 0, 0, 3, 16, 8, 0, 0], [0, 0, 0, 5, 14, 12, 2, 0, 0, 0, 7, 15, 8, 14, 4, 0, 0, 0, 6, 2, 3, 13, 1, 0, 0, 0, 0, 1, 13, 4, 0, 0, 0, 0, 1, 11, 9, 0, 0, 0, 0, 8, 16, 13, 0, 0, 0, 0, 0, 5, 14, 16, 11, 2, 0, 0, 0, 0, 0, 6, 12, 13, 3, 0], [0, 0, 9, 16, 13, 6, 0, 0, 0, 0, 6, 5, 16, 16, 0, 0, 0, 0, 0, 8, 15, 5, 0, 0, 0, 0, 0, 5, 14, 3, 0, 0, 0, 0, 0, 0, 9, 15, 2, 0, 0, 0, 0, 0, 0, 11, 12, 0, 0, 0, 4, 8, 11, 15, 12, 0, 0, 0, 11, 14, 12, 8, 0, 0], [0, 0, 0, 9, 15, 1, 0, 0, 0, 0, 4, 16, 12, 0, 0, 0, 0, 0, 15, 14, 2, 11, 3, 0, 0, 4, 16, 9, 4, 16, 10, 0, 0, 9, 16, 11, 13, 16, 2, 0, 0, 0, 9, 16, 16, 14, 0, 0, 0, 0, 0, 8, 16, 6, 0, 0, 0, 0, 0, 9, 16, 2, 0, 0], [0, 2, 13, 16, 16, 16, 11, 0, 0, 5, 16, 10, 5, 4, 1, 0, 0, 6, 16, 7, 3, 0, 0, 0, 0, 9, 16, 16, 16, 6, 0, 0, 0, 3, 8, 4, 11, 15, 0, 0, 0, 0, 0, 1, 12, 15, 0, 0, 0, 0, 4, 13, 16, 6, 0, 0, 0, 2, 16, 15, 8, 0, 0, 0], [0, 0, 0, 5, 14, 2, 0, 0, 0, 0, 1, 13, 11, 0, 0, 0, 0, 0, 5, 16, 2, 0, 0, 0, 0, 0, 6, 15, 5, 0, 0, 0, 0, 1, 15, 16, 15, 11, 1, 0, 0, 2, 13, 14, 1, 12, 9, 0, 0, 0, 4, 16, 7, 13, 9, 0, 0, 0, 0, 5, 16, 15, 3, 0], [0, 0, 0, 9, 15, 12, 0, 0, 0, 0, 4, 7, 7, 14, 0, 0, 0, 0, 0, 0, 0, 13, 3, 0, 0, 4, 9, 8, 10, 13, 1, 0, 0, 4, 16, 15, 16, 16, 6, 0, 0, 0, 0, 0, 14, 3, 0, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 0, 11, 7, 0, 0, 0], [0, 0, 7, 7, 13, 16, 4, 0, 0, 0, 13, 13, 6, 12, 7, 0, 0, 0, 10, 4, 10, 11, 1, 0, 0, 0, 8, 16, 10, 0, 0, 0, 0, 3, 14, 16, 0, 0, 0, 0, 0, 8, 8, 11, 5, 0, 0, 0, 0, 4, 10, 9, 8, 0, 0, 0, 0, 1, 11, 16, 6, 0, 0, 0], [0, 0, 2, 13, 8, 0, 0, 0, 0, 0, 6, 16, 16, 6, 0, 0, 0, 0, 5, 15, 13, 11, 0, 0, 0, 0, 0, 7, 16, 15, 0, 0, 0, 0, 0, 0, 0, 14, 3, 0, 0, 0, 0, 0, 0, 7, 11, 0, 0, 0, 0, 3, 4, 4, 16, 2, 0, 0, 2, 15, 13, 14, 13, 2]];
  var S = { thr: 0.6, tool: "paint", noise: 0 };
  var img = new Array(64).fill(0), p = new Array(10).fill(0.1), painting = false;

  function load(k) { img = SAMPLES[k].slice(); update(); }
  function classify() {
    var d = PROTOS.map(function (pr) { var s = 0; for (var k = 0; k < 64; k++) s += (img[k] - pr[k]) * (img[k] - pr[k]); return -s / 160; });
    p = M.softmax(d);
  }

  var view = api.view(root, { aspect: 2.1, minH: 190, maxH: 300, drag: true, label: "Rejilla de 8 por 8 para dibujar un dígito y barras con las probabilidades de cada clase" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Cargar un dígito de ejemplo", options: [["", "— elige uno —"]].concat([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (k) { return [k, "un " + k]; })), value: "", onChange: function (v) { if (v !== "") load(+v); } });
  ui.segmented({ label: "Herramienta", options: [["paint", "Pintar"], ["erase", "Borrar"]], value: S.tool, onChange: function (v) { S.tool = v; } });
  ui.slider({ label: "Umbral de confianza", min: 0.3, max: 0.95, step: 0.01, value: S.thr, fmt: function (v) { return Math.round(v * 100) + " %"; }, onInput: function (v) { S.thr = v; update(); } });
  ui.button("Borrar todo", function () { img = new Array(64).fill(0); update(); });
  ui.button("Añadir ruido (como un sensor sucio)", function () { S.noise++; var R = api.rng(S.noise * 31 + 7); img = img.map(function (v) { return M.clamp(v + R.normal(0, 4), 0, 16); }); update(); });

  var geo = {};
  function layout(w, h) { var s = Math.min(h - 28, w * 0.42); geo = { s: s, c: s / 8, x: 10, y: 20, bx: 10 + s + 22 }; }
  function cellAt(px, py) { var j = Math.floor((px - geo.x) / geo.c), i = Math.floor((py - geo.y) / geo.c); return i >= 0 && j >= 0 && i < 8 && j < 8 ? i * 8 + j : -1; }
  function paintAt(px, py) {
    var k = cellAt(px, py); if (k < 0) return;
    var i = Math.floor(k / 8), j = k % 8;
    if (S.tool === "paint") { img[k] = 16; [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) { var a = i + d[0], b = j + d[1]; if (a >= 0 && b >= 0 && a < 8 && b < 8) img[a * 8 + b] = Math.max(img[a * 8 + b], 6); }); }
    else img[k] = 0;
    update();
  }
  view.pointer({ down: function (px, py) { painting = true; paintAt(px, py); }, drag: function (px, py) { if (painting) paintAt(px, py); }, up: function () { painting = false; } });

  view.draw(function (ctx, w, h, C) {
    layout(w, h);
    var i, j, g = geo;
    D.text(ctx, "tu dibujo (8 × 8)", g.x, 13, { size: 11, weight: 600, color: C.ink2 });
    D.rect(ctx, g.x, g.y, g.s, g.s, C.surface);
    for (i = 0; i < 8; i++) for (j = 0; j < 8; j++) { var v = img[i * 8 + j] / 16; if (v > 0.02) { ctx.globalAlpha = Math.min(1, v); ctx.fillStyle = C.ink; ctx.fillRect(g.x + j * g.c + 0.5, g.y + i * g.c + 0.5, g.c - 1, g.c - 1); ctx.globalAlpha = 1; } }
    for (i = 0; i <= 8; i++) { D.line(ctx, g.x + i * g.c, g.y, g.x + i * g.c, g.y + g.s, C.line, 1); D.line(ctx, g.x, g.y + i * g.c, g.x + g.s, g.y + i * g.c, C.line, 1); }
    D.rect(ctx, g.x, g.y, g.s, g.s, null, C.ink, 1.5);
    var bw = w - g.bx - 54, bh = (h - 34) / 10, top = p.indexOf(Math.max.apply(null, p)), ok = p[top] >= S.thr;
    D.text(ctx, "probabilidad de cada dígito", g.bx, 13, { size: 11, weight: 600, color: C.ink2 });
    for (i = 0; i < 10; i++) {
      var y = 20 + i * bh;
      D.text(ctx, String(i), g.bx, y + bh * 0.72, { size: 11, weight: i === top ? 700 : 400, color: C.ink2, mono: true });
      D.rect(ctx, g.bx + 14, y + 2, Math.max(1, (bw - 14) * p[i]), bh - 4, i === top ? (ok ? C.oliva : C.terracota) : C.cobalto);
      D.text(ctx, (p[i] * 100).toFixed(0) + " %", g.bx + 14 + (bw - 14) * p[i] + 5, y + bh * 0.72, { size: 10.5, color: C.ink2, mono: true });
    }
    var tx = g.bx + 14 + (bw - 14) * S.thr;
    D.line(ctx, tx, 20, tx, 20 + 10 * bh, C.ink, 1.5, [4, 3]);
  });

  function update() {
    classify();
    var top = p.indexOf(Math.max.apply(null, p)), conf = p[top], ink = img.reduce(function (s, v) { return s + (v > 0 ? 1 : 0); }, 0);
    var sorted = p.map(function (v, k) { return [k, v]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3);
    out.set("<b>1.</b> imagen (8, 8), " + ink + " casillas con tinta, valores de 0 a 16 &nbsp;→&nbsp; <b>2.</b> ÷ 16: valores de 0 a 1 &nbsp;→&nbsp; <b>3.</b> ampliar ×4 y 3 canales: (32, 32, 3)" +
      " &nbsp;→&nbsp; <b>4.</b> añadir el lote: (1, 32, 32, 3) &nbsp;→&nbsp; <b>5.</b> modelo: (1, 10) probabilidades que suman " + (M.sum(p) * 100).toFixed(0) + " %" +
      "<br><b>top 3:</b> " + sorted.map(function (s) { return s[0] + " (" + Math.round(s[1] * 100) + " %)"; }).join(" · ") +
      "<br><b>Respuesta de predecir():</b> " + (ink === 0 ? "<span class='bad'>imagen vacía: no estoy seguro</span>" : conf >= S.thr ? "<span class='good'>«" + top + "» con " + Math.round(conf * 100) + " % de confianza</span>" : "<span class='bad'>«no estoy seguro»</span> (la mejor, " + Math.round(conf * 100) + " %, no llega al umbral del " + Math.round(S.thr * 100) + " %)"));
    view.redraw();
  }
  load(7);
});
