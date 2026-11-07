/* Experimento: el umbral sobre las probabilidades REALES del clasificador Keras (mejor.keras) en los
   400 pósters de test. Cada punto es un póster; el umbral decide qué se llama «acción».
   Se ven la matriz de confusión, accuracy, precision, recall y F1 cambiando a la vez. */
Lab.register("curso6/c6m2-umbral", function (root, api) {
  var P = [0.979,0.079,0.155,0.0,0.0,0.998,0.0,0.035,0.063,1.0,0.998,1.0,1.0,0.001,1.0,0.001,1.0,0.001,0.007,1.0,0.006,0.987,0.0,0.718,1.0,0.0,0.982,1.0,0.95,0.0,0.0,0.591,0.688,1.0,0.955,0.512,0.634,0.028,0.013,0.0,0.001,0.013,0.745,0.993,1.0,1.0,1.0,1.0,0.903,0.0,1.0,0.987,0.0,0.0,1.0,1.0,0.998,0.021,0.001,0.001,1.0,0.008,0.015,1.0,0.994,1.0,0.0,1.0,1.0,0.86,0.034,0.0,1.0,0.997,0.992,0.747,0.0,1.0,0.0,0.0,0.0,0.861,0.001,1.0,0.0,1.0,0.0,0.0,0.0,1.0,1.0,0.001,1.0,1.0,0.012,0.0,0.0,0.133,1.0,0.0,1.0,1.0,0.999,0.016,0.072,1.0,0.0,0.756,0.001,0.0,1.0,1.0,0.999,1.0,0.263,0.999,1.0,0.0,0.0,0.001,0.999,0.0,0.0,0.0,1.0,0.997,0.0,0.016,0.297,0.0,1.0,0.796,0.001,0.0,0.0,0.005,0.999,0.0,1.0,1.0,0.998,1.0,0.0,1.0,1.0,0.999,0.068,1.0,1.0,1.0,0.001,1.0,1.0,1.0,1.0,0.0,0.001,0.957,1.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,0.0,0.022,0.151,0.872,0.0,0.0,1.0,0.996,1.0,0.003,1.0,0.014,1.0,0.991,0.001,0.844,0.005,0.852,0.028,0.0,0.999,0.008,1.0,0.002,0.989,1.0,1.0,0.0,1.0,0.001,0.997,0.0,1.0,0.033,1.0,0.0,0.109,1.0,0.0,0.0,0.997,0.79,0.001,1.0,0.0,0.013,1.0,0.0,0.998,1.0,0.964,1.0,1.0,0.0,1.0,0.05,0.0,0.0,0.023,1.0,1.0,1.0,1.0,0.999,0.003,1.0,0.815,0.01,0.527,1.0,1.0,0.851,1.0,0.0,0.0,0.0,0.0,1.0,0.001,0.001,1.0,0.0,0.999,0.889,1.0,1.0,1.0,0.999,1.0,0.978,0.001,0.211,0.993,1.0,0.0,1.0,0.001,0.999,1.0,0.0,0.0,1.0,0.974,0.998,0.977,0.24,1.0,0.001,0.0,1.0,0.862,0.0,0.999,0.0,0.599,0.0,0.0,0.521,0.323,0.998,0.015,0.171,0.099,0.003,0.0,0.0,0.978,1.0,1.0,0.0,0.001,0.997,0.001,1.0,1.0,0.001,0.012,0.999,0.998,0.0,0.478,0.276,0.997,0.003,1.0,0.0,1.0,1.0,0.962,0.991,0.0,1.0,0.035,1.0,0.99,0.0,1.0,0.003,0.999,0.002,0.149,1.0,0.946,1.0,0.904,0.091,0.0,1.0,0.0,0.999,1.0,0.0,0.003,0.002,1.0,0.0,0.0,0.0,0.943,1.0,0.124,1.0,0.0,0.011,0.001,1.0,0.922,0.999,0.0,0.004,1.0,0.998,0.002,0.928,0.001,1.0,1.0,0.0,0.0,0.002,0.364,0.0,1.0,1.0,0.0,1.0,1.0,0.009,1.0,0.803,1.0,1.0,1.0,0.644,1.0,0.003,0.001,1.0,0.0,0.001,1.0,0.0,0.0,1.0,1.0,0.113,1.0,0.387,0.939,0.0,0.0,0.0];
  var Y = "1000010001111010100101001011100111110000001111111011001110001001110111001111010001010100011011000010111001010011110110001000110000110000101111011101110111100111001001010000001110101100000010101110101010100100110100101111101000011111010011111000010010111111110011010110011101100110101001110000001110010110011001101011110101101010010111010110001000110100011100110101100000110110111111100100100110111000";
  var N = P.length, S = { u: 0.5 };
  var coarse = window.matchMedia && matchMedia("(pointer:coarse)").matches;

  var view = api.view(root, { aspect: 1.9, minH: 380, maxH: 400, drag: !coarse, label: "Puntos con la probabilidad de acción de cada póster de test, separados por su clase real, una línea de umbral y la matriz de confusión" });
  var ui = api.controls(root), out = api.readout(root);
  var sl = ui.slider({ label: "Umbral para decir «acción»", min: 0.02, max: 0.98, step: 0.01, value: S.u,
    fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.u = v; update(); } });
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "real: animación"], [C0.terracota, "real: acción"]]);

  // posiciones verticales reproducibles (jitter) para que los puntos no se pisen
  var rng = api.rng(7), JIT = [];
  for (var k = 0; k < N; k++) JIT.push(rng.next());

  function cuenta() {
    var tp = 0, fp = 0, fn = 0, tn = 0, i;
    for (i = 0; i < N; i++) {
      var pos = P[i] >= S.u, real = Y.charAt(i) === "1";
      if (pos && real) tp++; else if (pos) fp++; else if (real) fn++; else tn++;
    }
    return { tp: tp, fp: fp, fn: fn, tn: tn };
  }
  var L = {};
  function layout(w, h) {
    var ancho = w >= 560;
    L.sx = 34; L.sw = ancho ? w * 0.6 - 40 : w - 48;
    L.sy = 22;
    L.mx = ancho ? w * 0.6 + 14 : 34; L.my = ancho ? 40 : h - 150;
    L.mw = ancho ? w - L.mx - 10 : w - 44; L.mh = ancho ? h - 70 : 142;
    L.sh = ancho ? h - 60 : L.my - 44 - L.sy;
  }
  function px(p) { return L.sx + p * L.sw; }

  function draw(ctx, w, h, C) {
    layout(w, h);
    var c = cuenta(), i, band = L.sh / 2;
    api.d.text(ctx, "animación", L.sx - 4, L.sy + band * 0.5, { size: 10, color: C.muted, rotate: -Math.PI / 2, align: "center" });
    api.d.text(ctx, "acción", L.sx - 4, L.sy + band * 1.5, { size: 10, color: C.muted, rotate: -Math.PI / 2, align: "center" });
    api.d.line(ctx, L.sx, L.sy + band, L.sx + L.sw, L.sy + band, C.line, 1);
    api.d.rect(ctx, px(S.u), L.sy, L.sx + L.sw - px(S.u), L.sh, C.terracotaWash);
    for (i = 0; i < N; i++) {
      var real = Y.charAt(i) === "1";
      var y = L.sy + (real ? band : 0) + 6 + JIT[i] * (band - 12);
      api.d.circle(ctx, px(P[i]), y, 2.6, real ? C.terracota : C.cobalto);
    }
    api.d.line(ctx, px(S.u), L.sy - 6, px(S.u), L.sy + L.sh, C.ink, 2);
    api.d.text(ctx, "umbral " + S.u.toFixed(2), px(S.u), L.sy - 9, { align: S.u > 0.8 ? "right" : S.u < 0.2 ? "left" : "center", size: 11, weight: 600 });
    [0, 0.5, 1].forEach(function (t) { api.d.text(ctx, String(t), px(t), L.sy + L.sh + 14, { align: "center", size: 10, color: C.muted }); });
    api.d.text(ctx, "P(acción) que da el modelo", L.sx + L.sw / 2, L.sy + L.sh + 28, { align: "center", size: 11, color: C.ink2 });
    // matriz de confusión
    var cw = Math.min(L.mw / 2 - 6, 110), ch = Math.min((L.mh - 34) / 2, 70), mx = L.mx + 18, my = L.my + 22;
    api.d.text(ctx, "predicho →", mx + cw, L.my + 4, { align: "center", size: 10, color: C.muted });
    api.d.text(ctx, "anim.", mx + cw * 0.5, L.my + 16, { align: "center", size: 10, color: C.muted });
    api.d.text(ctx, "acción", mx + cw * 1.5, L.my + 16, { align: "center", size: 10, color: C.muted });
    api.d.text(ctx, "real", L.mx + 6, my + ch, { align: "center", size: 10, color: C.muted, rotate: -Math.PI / 2 });
    var celdas = [[c.tn, "TN", true], [c.fp, "FP", false], [c.fn, "FN", false], [c.tp, "TP", true]];
    for (i = 0; i < 4; i++) {
      var cx = mx + (i % 2) * cw, cy = my + Math.floor(i / 2) * ch, ok = celdas[i][2];
      api.d.rect(ctx, cx + 2, cy + 2, cw - 4, ch - 4, ok ? C.olivaWash : C.terracotaWash, ok ? C.oliva : C.terracota, 1);
      api.d.text(ctx, String(celdas[i][0]), cx + cw / 2, cy + ch / 2 + 4, { align: "center", size: 18, weight: 700, color: C.ink });
      api.d.text(ctx, celdas[i][1], cx + cw / 2, cy + ch - 8, { align: "center", size: 10, color: C.muted });
    }
  }

  if (!coarse) view.pointer({
    down: function (x, y) { L.agarra = y <= L.sy + L.sh + 6; if (L.agarra) mover(x); },
    drag: function (x) { if (L.agarra) mover(x); }
  });
  function mover(x) {
    if (!L.sw || x > L.sx + L.sw + 10) return;
    var u = Math.max(0.02, Math.min(0.98, (x - L.sx) / L.sw));
    S.u = Math.round(u * 100) / 100; sl.set(S.u, true); update();
  }

  function update() {
    view.redraw();
    var c = cuenta(), acc = (c.tp + c.tn) / N, prec = c.tp / Math.max(1, c.tp + c.fp), rec = c.tp / Math.max(1, c.tp + c.fn);
    var f1 = 2 * prec * rec / Math.max(1e-9, prec + rec);
    out.set("accuracy <b>" + acc.toFixed(3) + "</b> · precision <b>" + prec.toFixed(3) + "</b> · recall <b>" + rec.toFixed(3) + "</b> · F1 <b>" + f1.toFixed(3) + "</b><br>" +
      "Falsas «acción» (FP): <b>" + c.fp + "</b> · acciones que se escapan (FN): <b>" + c.fn + "</b>" +
      (S.u < 0.3 ? "<br><span class='bad'>Umbral bajo: casi nada se escapa, pero llamas «acción» a más pósters de animación.</span>" :
       S.u > 0.7 ? "<br><span class='bad'>Umbral alto: lo que llamas «acción» casi siempre lo es, pero se te escapan más.</span>" : ""));
  }
  view.draw(draw); update();
});
