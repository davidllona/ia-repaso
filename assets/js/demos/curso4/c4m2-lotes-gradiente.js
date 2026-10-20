/* Experimento: por qué lotes. Un catálogo de 240 películas (x = nota de la crítica, y = valoración de los usuarios = 3x + ruido) y un modelo y = w·x.
   Para el valor actual de w se calcula el gradiente de la pérdida con TODOS los datos (la «verdad») y con
   muchos lotes aleatorios de tamaño B. Se ve cuánto se dispersa el gradiente según B y cuántos pasos por época se hacen. */
Lab.register("curso4/c4m2-lotes-gradiente", function (root, api) {
  var D = api.d, M = api.math, N = 240, SIZES = [1, 2, 4, 8, 16, 40, 80, 240];
  var R0 = api.rng(11), xs = [], ys = [], i;
  for (i = 0; i < N; i++) { var x = R0.range(-1, 1); xs.push(x); ys.push(3 * x + R0.normal(0, 0.3)); }
  var S = { bi: 3, w: 0, seed: 1 };

  function sampleGrad(w, k) { return 2 * (w * xs[k] - ys[k]) * xs[k]; }
  function fullGrad(w) { var s = 0, k; for (k = 0; k < N; k++) s += sampleGrad(w, k); return s / N; }
  function batchGrads(w, B, count, seed) {
    var R = api.rng(seed * 101 + B), idx = [], out = [], t, k;
    for (k = 0; k < N; k++) idx.push(k);
    for (t = 0; t < count; t++) {
      R.shuffle(idx);
      var s = 0; for (k = 0; k < B; k++) s += sampleGrad(w, idx[k]);
      out.push(s / B);
    }
    return out;
  }

  var view = api.view(root, { aspect: 2.1, minH: 210, maxH: 300, label: "Histograma del gradiente estimado con lotes aleatorios y marca del gradiente con todos los datos" });
  var view2 = api.view(root, { aspect: 4.2, minH: 120, maxH: 170, label: "Para cada tamaño de lote: pasos por época y ruido del gradiente" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "batch_size B", min: 0, max: SIZES.length - 1, step: 1, value: S.bi, fmt: function (v) { return SIZES[v]; }, onInput: function (v) { S.bi = v; update(); } });
  ui.slider({ label: "valor actual de w (peso de la crítica)", min: 0, max: 4, step: 0.1, value: S.w, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.w = v; update(); } });
  ui.button("Sortear otros 400 lotes", function () { S.seed++; update(); }, "primary");

  var stats = {};
  function compute() {
    stats = {};
    SIZES.forEach(function (B) {
      var g = batchGrads(S.w, B, 400, S.seed), m = M.mean(g), sd = M.std(g);
      stats[B] = { g: g, mean: m, sd: sd };
    });
  }
  function draw(ctx, w, h, C) {
    var B = SIZES[S.bi], st = stats[B], full = fullGrad(S.w);
    var lo = full - 2.2 * stats[1].sd, hi = full + 2.2 * stats[1].sd, bins = 40, cnt = [], k;
    for (k = 0; k < bins; k++) cnt.push(0);
    st.g.forEach(function (v) { var b = Math.floor((v - lo) / (hi - lo) * bins); cnt[M.clamp(b, 0, bins - 1)]++; });
    var mx = Math.max.apply(null, cnt), pad = { l: 12, r: 12, t: 22, b: 34 }, bw = (w - pad.l - pad.r) / bins, ph = h - pad.t - pad.b;
    D.rect(ctx, pad.l, pad.t, w - pad.l - pad.r, ph, C.surface, C.line, 1);
    for (k = 0; k < bins; k++) {
      var bh = cnt[k] / mx * (ph - 4);
      D.rect(ctx, pad.l + k * bw + 0.5, pad.t + ph - bh, bw - 1, bh, C.cobaltoWash, C.cobalto, 1);
    }
    var xf = pad.l + (full - lo) / (hi - lo) * (w - pad.l - pad.r);
    D.line(ctx, xf, pad.t - 4, xf, pad.t + ph, C.terracota, 2.5);
    D.text(ctx, "gradiente con las 240 películas = " + full.toFixed(2), M.clamp(xf, 90, w - 90), 13, { size: 11, color: C.terracotaInk, align: "center", weight: 600 });
    D.text(ctx, "valor del gradiente estimado con un lote de " + B + " →", w / 2, h - 8, { size: 11, color: C.muted, align: "center" });
    D.text(ctx, "cada barra: cuántos de los 400 lotes dieron ese valor", w / 2, h - 21, { size: 10, color: C.muted, align: "center" });
  }
  function draw2(ctx, w, h, C) {
    var n = SIZES.length, gw = (w - 20) / n, maxSd = stats[1].sd, k, base = h - 24, top = 14;
    D.text(ctx, "azul: pasos por época (240/B) · naranja: ruido (desviación) del gradiente", w / 2, 9, { size: 10, color: C.muted, align: "center" });
    for (k = 0; k < n; k++) {
      var B = SIZES[k], steps = Math.ceil(N / B) / N, noise = stats[B].sd / maxSd, x0 = 10 + k * gw, hh = base - top - 8;
      var sel = k === S.bi;
      if (sel) D.rect(ctx, x0 + 1, top, gw - 2, base - top + 18, C.markerWash, null);
      D.rect(ctx, x0 + gw * 0.12, base - steps * hh, gw * 0.32, steps * hh, C.cobalto);
      D.rect(ctx, x0 + gw * 0.5, base - Math.max(1, noise * hh), gw * 0.32, Math.max(1, noise * hh), C.terracota);
      D.text(ctx, String(B), x0 + gw / 2, h - 6, { size: 11, color: sel ? C.ink : C.muted, align: "center", weight: sel ? 700 : 400, mono: true });
    }
    D.line(ctx, 10, base, w - 10, base, C.ink, 1);
  }
  compute();
  view.draw(draw); view2.draw(draw2);

  function update() {
    compute();
    var B = SIZES[S.bi], st = stats[B], full = fullGrad(S.w), steps = Math.ceil(N / B);
    out.set("Con B = <b>" + B + "</b>: <b>" + steps + "</b> pasos de gradiente por época (⌈240/" + B + "⌉) · gradiente real (240 películas) = <b>" + full.toFixed(3) + "</b><br>" +
      "media de los 400 lotes = <b>" + st.mean.toFixed(3) + "</b> (casi igual: el lote es un estimador <em>sin sesgo</em>) · desviación = <b class='" + (st.sd > 1 ? "bad" : "good") + "'>" + st.sd.toFixed(3) + "</b>" +
      " (con B = 1 era " + stats[1].sd.toFixed(3) + "; ruido ≈ σ₁/√B = " + (stats[1].sd / Math.sqrt(B)).toFixed(3) + ")" +
      (B === N ? "<br><span class='good'>B = 240: el gradiente sale idéntico en todos los lotes (no hay ruido) pero solo das 1 paso por época.</span>" : (B === 1 ? "<br><span class='bad'>B = 1: 240 pasos por época, pero cada uno apunta a veces en dirección contraria al buen camino.</span>" : "")));
    view.redraw(); view2.redraw();
  }
  update();
});
