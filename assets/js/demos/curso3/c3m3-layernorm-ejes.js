/* Experimento: ¿sobre qué números calcula la media y la desviación cada normalización? Un tensor (lote = 3, tokens = 4, rasgos = 5).
   LayerNormalization: sobre los 5 rasgos de UN token. BatchNormalization: sobre los 12 valores de UN rasgo (lote × tokens). */
Lab.register("curso3/c3m3-layernorm-ejes", function (root, api) {
  var D = api.d, B = 3, T = 4, F = 5, EPS = 1e-3;
  var S = { mode: "ln", b: 1, t: 1, f: 2 };
  var r = api.rng(5), X = [], b, t, f;
  var off = [2, 8, 5, 12, -3], sc = [1, 2.5, 1.5, 3, 1];
  for (b = 0; b < B; b++) { X.push([]); for (t = 0; t < T; t++) { X[b].push([]); for (f = 0; f < F; f++) X[b][t].push(Math.round(off[f] + sc[f] * r.normal(0, 1))); } }
  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
  function set() {
    var cells = [], i, j, k;
    if (S.mode === "ln") { for (k = 0; k < F; k++) cells.push([S.b, S.t, k]); }
    else { for (i = 0; i < B; i++) for (j = 0; j < T; j++) cells.push([i, j, S.f]); }
    return cells;
  }
  function stats() {
    var c = set(), v = c.map(function (q) { return X[q[0]][q[1]][q[2]]; }), m = v.reduce(function (a, x) { return a + x; }, 0) / v.length;
    var va = v.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / v.length;
    return { v: v, m: m, va: va, sd: Math.sqrt(va) };
  }
  var view = api.view(root, { aspect: 2.1, minH: 200, maxH: 300, drag: false, label: "Tensor de 3 ejemplos, 4 tokens y 5 rasgos; las casillas resaltadas son las que entran en la media y la desviación" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.segmented({ label: "Normalización", value: "ln", options: [["ln", "LayerNorm (por token)"], ["bn", "BatchNorm (por rasgo)"]], onChange: function (v) { S.mode = v; update(); } });
  function geom(w, h) { var gap = 12, cell = Math.max(14, Math.min(40, Math.floor((w - 2 * gap - 8) / (B * F)), Math.floor((h - 44) / T))); var gw = cell * F; var x0 = (w - (gw * B + gap * (B - 1))) / 2; return { cell: cell, gap: gap, gw: gw, x0: x0, y0: 30 }; }
  view.draw(function (ctx, w, h, C) {
    var g = geom(w, h), cells = set(), key = {}; cells.forEach(function (q) { key[q.join(",")] = 1; });
    for (b = 0; b < B; b++) {
      var gx = g.x0 + b * (g.gw + g.gap);
      D.text(ctx, "ejemplo " + (b + 1), gx + g.gw / 2, 16, { size: 11, align: "center", weight: 600, color: C.ink2 });
      for (t = 0; t < T; t++) for (f = 0; f < F; f++) {
        var x = gx + f * g.cell, y = g.y0 + t * g.cell, sel = key[[b, t, f].join(",")], me = (b === S.b && t === S.t && (S.mode === "ln" || f === S.f));
        D.rect(ctx, x, y, g.cell, g.cell, sel ? C.terracotaWash : C.surface, C.line, 1);
        D.text(ctx, String(X[b][t][f]), x + g.cell / 2, y + g.cell / 2 + 4, { size: g.cell >= 26 ? 12 : 10, mono: true, align: "center", color: sel ? C.terracotaInk : C.ink, weight: sel ? 700 : 400 });
        if (S.mode === "bn" ? (b === S.b && t === S.t && f === S.f) : (b === S.b && t === S.t && f === S.f)) D.rect(ctx, x + 1, y + 1, g.cell - 2, g.cell - 2, null, C.terracota, 2.5);
      }
      D.rect(ctx, gx, g.y0, g.gw, g.cell * T, null, C.ink, 1.2);
    }
  });
  view.pointer({ down: function (px, py) {
    var g = geom(view.w, view.h), bb = Math.floor((px - g.x0) / (g.gw + g.gap)), gx = g.x0 + bb * (g.gw + g.gap), ff = Math.floor((px - gx) / g.cell), tt = Math.floor((py - g.y0) / g.cell);
    if (bb >= 0 && bb < B && ff >= 0 && ff < F && tt >= 0 && tt < T) { S.b = bb; S.t = tt; S.f = ff; update(); }
  } });
  function update() {
    view.redraw();
    var s = stats(), x = X[S.b][S.t][S.f], z = (x - s.m) / Math.sqrt(s.va + EPS);
    out.set((S.mode === "ln" ? "<b>LayerNorm</b>: el token " + (S.t + 1) + " del ejemplo " + (S.b + 1) + " usa sus <b>" + F + "</b> números " : "<b>BatchNorm</b>: el rasgo " + (S.f + 1) + " usa sus <b>" + (B * T) + "</b> valores (" + B + " ejemplos × " + T + " tokens) ") + "[" + s.v.join(", ") + "]<br>" +
      "media μ = <b>" + n(s.m, 2) + "</b>, varianza = <b>" + n(s.va, 2) + "</b>, σ = <b>" + n(s.sd, 2) + "</b><br>" +
      "casilla marcada x = " + x + " → z = (x − μ)/√(σ² + ε) = (" + x + " − " + n(s.m, 2) + ")/√(" + n(s.va, 2) + " + 0,001) = <b>" + n(z, 3) + "</b><br>" +
      (S.mode === "ln" ? "Cada token se normaliza <b>solo con sus propios números</b>: no depende de los demás tokens ni del tamaño del lote." : "BatchNorm mezcla tokens y ejemplos del lote: con lotes pequeños o secuencias de longitud variable sus estadísticas son inestables. Por eso los Transformers usan LayerNorm."));
  }
  update();
});
