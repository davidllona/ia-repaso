/* Experimento: por qué se divide entre raíz de d_k. Se generan 1600 productos escalares q·k con componentes N(0,1) y se mira
   su dispersión y lo que hace el softmax con ellos (grupos de 8 claves). */
Lab.register("curso2/c2m4-escala-dk", function (root, api) {
  var D = api.d, C0 = api.colors();
  var S = { e: 6, scale: false, seed: 5 };
  var NP = 1600, GR = 8, cache = {};

  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
  function samples(dk) {
    var key = dk + "/" + S.seed;
    if (cache[key]) return cache[key];
    var r = api.rng(S.seed * 1000 + dk), out = [], i, j;
    for (i = 0; i < NP; i++) { var s = 0; for (j = 0; j < dk; j++) s += r.normal(0, 1) * r.normal(0, 1); out.push(s); }
    cache = {}; cache[key] = out;
    return out;
  }
  function softmax(a) { var m = Math.max.apply(null, a), e = a.map(function (v) { return Math.exp(v - m); }), s = 0; e.forEach(function (v) { s += v; }); return e.map(function (v) { return v / s; }); }
  var R;
  function compute() {
    var dk = Math.pow(2, S.e), raw = samples(dk), f = S.scale ? 1 / Math.sqrt(dk) : 1;
    var sc = raw.map(function (v) { return v * f; }), mean = 0, sd = 0;
    sc.forEach(function (v) { mean += v; }); mean /= sc.length;
    sc.forEach(function (v) { sd += (v - mean) * (v - mean); }); sd = Math.sqrt(sd / sc.length);
    var mx = 0, grad = 0, g, groups = Math.floor(NP / GR), first = null;
    for (g = 0; g < groups; g++) {
      var w = softmax(sc.slice(g * GR, (g + 1) * GR));
      if (g === 0) first = w;
      mx += Math.max.apply(null, w);
      var s2 = 0; w.forEach(function (v) { s2 += v * v; }); grad += 1 - s2;
    }
    R = { dk: dk, sc: sc, sd: sd, mx: mx / groups, grad: grad / groups, first: first, scores0: sc.slice(0, GR) };
  }

  var view = api.view(root, { aspect: 2.6, minH: 170, maxH: 260, label: "Histograma de los productos escalares q·k" });
  var view2 = api.view(root, { aspect: 3.0, minH: 150, maxH: 230, label: "Pesos de atención (softmax) de un título sobre 8 títulos de su historial con esos puntajes" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.slider({ label: "Dimensión de las claves d_k", min: 0, max: 8, step: 1, value: S.e, fmt: function (v) { return Math.pow(2, v); }, onInput: function (v) { S.e = v; update(); } });
  ui.toggle({ label: "Dividir entre √d_k", value: S.scale, onChange: function (v) { S.scale = v; update(); } });
  ui.button("Otra muestra al azar", function () { S.seed += 1; update(); });

  var LIM = 56, NB = 56;
  function draw(ctx, w, h, C) {
    var L = 14, Rr = 14, T = 22, B = 26, bw = w - L - Rr, bh = h - T - B, bins = new Array(NB).fill(0), i;
    R.sc.forEach(function (v) { var b = Math.floor((v + LIM) / (2 * LIM) * NB); if (b >= 0 && b < NB) bins[b]++; });
    var mx = Math.max.apply(null, bins);
    D.text(ctx, "Distribución de q·k" + (S.scale ? " ÷ √d_k" : "") + " (1600 pares al azar)", L, 14, { size: 11.5, color: C.ink2, weight: 500 });
    D.rect(ctx, L, T, bw, bh, C.surface, C.ink, 1.5);
    bins.forEach(function (c, k) { var bhh = bh * c / mx; D.rect(ctx, L + bw * k / NB + 0.5, T + bh - bhh, bw / NB - 1, bhh, S.scale ? C.cobalto : C.terracota); });
    D.line(ctx, L + bw / 2, T, L + bw / 2, T + bh, C.ink, 1, [3, 3]);
    [-48, -24, 0, 24, 48].forEach(function (t) { D.text(ctx, String(t).replace("-", "−"), L + bw * (t + LIM) / (2 * LIM), h - 9, { size: 10.5, mono: true, align: "center", color: C.muted }); });
    var sx = L + bw * (R.sd + LIM) / (2 * LIM), sx2 = L + bw * (-R.sd + LIM) / (2 * LIM);
    D.line(ctx, sx2, T + bh + 3, sx, T + bh + 3, C.ink, 2);
    D.text(ctx, "±1 desviación = " + n(R.sd, 2), L + bw - 6, T + 14, { size: 11, align: "right", mono: true, color: C.ink });
  }
  function draw2(ctx, w, h, C) {
    var L = 74, Rr = 44, T = 22, bw = w - L - Rr, rowH = (h - T - 6) / GR;
    D.text(ctx, "Atención de un título sobre 8 títulos de su historial", 8, 14, { size: 11.5, color: C.ink2, weight: 500 });
    R.first.forEach(function (p, k) {
      var y = T + k * rowH;
      D.text(ctx, "k" + (k + 1) + ": " + n(R.scores0[k], 1), L - 6, y + rowH * 0.72, { size: Math.min(10.5, rowH * 0.8), mono: true, align: "right", color: C.muted });
      D.rect(ctx, L, y + 1, Math.max(1, bw * p), rowH - 2, S.scale ? C.cobalto : C.terracota);
      D.text(ctx, n(p, 3), L + bw * p + 4, y + rowH * 0.72, { size: Math.min(10.5, rowH * 0.8), mono: true, color: C.ink });
    });
  }
  compute();
  view.draw(draw); view2.draw(draw2);

  function update() {
    compute(); view.redraw(); view2.redraw();
    var th = S.scale ? 1 : Math.sqrt(R.dk);
    out.set("d_k = <b>" + R.dk + "</b> → desviación teórica de q·k" + (S.scale ? " ÷ √d_k" : "") + " = <b>" + n(th, 2) + "</b> · medida: <b>" + n(R.sd, 2) + "</b><br>" +
      "Peso máximo medio del softmax (grupos de 8 claves): <b>" + n(R.mx, 3) + "</b> (con reparto uniforme sería 0,125)<br>" +
      "«Pendiente» media del softmax, 1 − Σw²: <b>" + n(R.grad, 3) + "</b> (si es ≈ 0, casi no llega gradiente)" +
      (!S.scale && R.dk >= 64 ? "<br><span class='bad'>Sin dividir, el softmax se satura: un token se lleva casi todo y el aprendizaje se atasca.</span>" : "") +
      (S.scale ? "<br><span class='good'>Dividiendo entre √d_k, la dispersión se queda en 1 sea cual sea d_k.</span>" : ""));
  }
  update();
});
