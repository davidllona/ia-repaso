/* Experimento: BatchNormalization en entrenamiento y en inferencia.
   Un dato x ~ N(μ, σ). En cada paso (lote de n valores) la capa normaliza con la media y la varianza DEL LOTE
   y, a la vez, actualiza sus medias móviles: moving ← momentum·moving + (1 − momentum)·estadística_del_lote.
   En inferencia no hay lote fiable: usa moving_mean y moving_variance (empiezan en 0 y 1, como en Keras). ε = 0,001. */
Lab.register("curso3/c3m5-batchnorm", function (root, api) {
  var D = api.d, M = api.math, EPS = 1e-3, R = null;
  var S = { n: 8, mom: 0.9, mu: 5, sd: 2, xt: 7, steps: 0, mm: 0, mv: 1, hist: [], batch: [] };

  function reset() { R = api.rng(21); S.steps = 0; S.mm = 0; S.mv = 1; S.hist = [[0, 0, 1]]; S.batch = []; update(); }
  function step() {
    var xs = [], i, m = 0, v = 0;
    for (i = 0; i < S.n; i++) xs.push(R.normal(S.mu, S.sd));
    for (i = 0; i < S.n; i++) m += xs[i]; m /= S.n;
    for (i = 0; i < S.n; i++) v += (xs[i] - m) * (xs[i] - m); v /= S.n;
    S.mm = S.mom * S.mm + (1 - S.mom) * m; S.mv = S.mom * S.mv + (1 - S.mom) * v;
    S.steps++; S.batch = { xs: xs, m: m, v: v }; S.hist.push([S.steps, S.mm, S.mv]);
    S.jit = xs.map(function () { return R.next(); });
  }
  var vA = api.view(root, { aspect: 2.6, minH: 190, maxH: 270, label: "Valores del último lote antes y después de normalizar" });
  var pA = api.plot(vA, { xr: [-4, 12], yr: [0, 1], grid: false, xticks: 8, yticks: 1, pad: { l: 14, r: 14, t: 8, b: 8 }, xfmt: function () { return ""; }, yfmt: function () { return ""; } });
  var vB = api.view(root, { aspect: 2.6, minH: 170, maxH: 250, label: "Medias móviles de la capa a lo largo de los pasos" });
  var poB = { xr: [0, 60], yr: [0, 6], xticks: 6, yticks: 3, xlabel: "paso de entrenamiento (lotes vistos)", pad: { l: 36, r: 12, t: 12, b: 34 }, yfmt: function (v) { return Math.round(v); }, xfmt: function (v) { return Math.round(v); } };
  var pB = api.plot(vB, poB);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Tamaño del lote", min: 2, max: 64, step: 1, value: S.n, onInput: function (v) { S.n = v; reset(); } });
  ui.slider({ label: "momentum de las medias móviles", min: 0.5, max: 0.99, step: 0.01, value: S.mom, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.mom = v; reset(); } });
  ui.slider({ label: "Nota media real μ", min: 0, max: 10, step: 0.5, value: S.mu, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.mu = v; reset(); } });
  ui.slider({ label: "Desviación real σ de las notas", min: 0.5, max: 4, step: 0.5, value: S.sd, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.sd = v; reset(); } });
  ui.slider({ label: "Nota de prueba x (para comparar los dos modos)", min: 0, max: 10, step: 0.5, value: S.xt, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.xt = v; update(); } });
  ui.button("Entrenar 1 lote", function () { step(); update(); }, "primary");
  ui.button("Entrenar 10 lotes", function () { for (var i = 0; i < 10; i++) step(); update(); });
  ui.button("Reiniciar capa", function () { reset(); });
  api.legend(root, [[api.colors().cobalto, "último lote (barra = su media, trazo = ±σ del lote)"], [api.colors().terracota, "moving_mean (discontinua arriba)"], [api.colors().oliva, "moving_variance"], [api.colors().ink, "μ real (punteada)"]]);

  function draw(ctx, w, h, C) {
    var b = S.batch, i, y1 = h * 0.30, y2 = h * 0.78;
    D.rect(ctx, pA.box.x, 4, pA.box.w, h - 8, C.surface, C.ink, 1.5);
    function axis(y, lo, hi, label, tf) {
      D.line(ctx, pA.box.x + 6, y + 14, pA.box.x + pA.box.w - 6, y + 14, C.ink2, 1.5);
      for (var t = Math.ceil(lo); t <= hi; t += (hi - lo > 12 ? 2 : 1)) { var px = pA.box.x + 6 + (t - lo) / (hi - lo) * (pA.box.w - 12); D.line(ctx, px, y + 14, px, y + 18, C.ink2, 1.5); D.text(ctx, String(t), px, y + 29, { align: "center", size: 10.5, color: C.muted, mono: true }); }
      D.text(ctx, label, pA.box.x + 8, y - 30, { size: 11.5, weight: 600, color: C.ink2 });
    }
    var X0 = -4, X1 = 12, Z0 = -4, Z1 = 4;
    function px(v) { return pA.box.x + 6 + (v - X0) / (X1 - X0) * (pA.box.w - 12); }
    function pz(v) { return pA.box.x + 6 + (v - Z0) / (Z1 - Z0) * (pA.box.w - 12); }
    axis(y1, X0, X1, "Entrada: las notas del lote tal cual", px);
    axis(y2, Z0, Z1, w < 480 ? "Salida normalizada con el lote" : "Salida en entrenamiento: (x − media_lote) / √(var_lote + ε)", pz);
    if (b && b.xs) {
      var sd = Math.sqrt(b.v);
      for (i = 0; i < b.xs.length; i++) {
        D.circle(ctx, px(b.xs[i]), y1 + 4 - S.jit[i] * 22, 4.2, C.cobalto, C.paper, 1);
        var z = (b.xs[i] - b.m) / Math.sqrt(b.v + EPS);
        D.circle(ctx, pz(z), y2 + 4 - S.jit[i] * 22, 4.2, C.cobalto, C.paper, 1);
      }
      D.line(ctx, px(b.m), y1 - 26, px(b.m), y1 + 14, C.cobaltoInk, 2);
      D.line(ctx, px(b.m - sd), y1 - 10, px(b.m + sd), y1 - 10, C.cobaltoInk, 1.5, [4, 3]);
      D.line(ctx, pz(0), y2 - 26, pz(0), y2 + 14, C.cobaltoInk, 2);
    } else D.text(ctx, "Pulsa «Entrenar 1 lote»", pA.box.x + pA.box.w / 2, y1 + 4, { align: "center", size: 12, color: C.muted });
    D.line(ctx, px(S.mm), y1 - 26, px(S.mm), y1 + 14, C.terracota, 2.2, [3, 3]);
    D.line(ctx, px(S.mu), y1 - 26, px(S.mu), y1 + 14, C.ink, 1, [2, 4]);
  }
  vA.draw(draw);
  function drawB(ctx, w, h, C) {
    pB.xr = [0, Math.max(30, Math.ceil(S.steps / 10) * 10 + 10)]; poB.xticks = pB.xr[1] / 10; pB.yr = [0, Math.max(6, Math.ceil(Math.max(S.mu, S.sd * S.sd) * 1.2))];
    pB.axes(ctx);
    ctx.save(); pB.clip(ctx);
    D.path(ctx, [[pB.x(0), pB.y(S.mu)], [pB.x(pB.xr[1]), pB.y(S.mu)]], C.terracota, 1.2, [3, 4]);
    D.path(ctx, [[pB.x(0), pB.y(S.sd * S.sd)], [pB.x(pB.xr[1]), pB.y(S.sd * S.sd)]], C.oliva, 1.2, [3, 4]);
    D.path(ctx, S.hist.map(function (q) { return [pB.x(q[0]), pB.y(q[1])]; }), C.terracota, 2.4);
    D.path(ctx, S.hist.map(function (q) { return [pB.x(q[0]), pB.y(q[2])]; }), C.oliva, 2.4);
    ctx.restore();
    D.text(ctx, "líneas de puntos = valores reales (μ y σ²)", pB.box.x + pB.box.w - 6, pB.box.y + pB.box.h - 8, { align: "right", size: 10.5, color: C.muted });
  }
  vB.draw(drawB);

  function f2(v) { return v.toFixed(2).replace("-", "−"); }
  function update() {
    var b = S.batch, g = Math.sqrt(S.mv + EPS), xt = S.xt, inf = (xt - S.mm) / g;
    var s = "Paso <b>" + S.steps + "</b> · moving_mean = <b>" + f2(S.mm) + "</b> (real " + S.mu.toFixed(1) + ") · moving_variance = <b>" + f2(S.mv) + "</b> (real " + (S.sd * S.sd).toFixed(2) + ")";
    if (b && b.xs) {
      var tr = (xt - b.m) / Math.sqrt(b.v + EPS), ideal = (xt - S.mu) / Math.sqrt(S.sd * S.sd + EPS);
      s += "<br>Último lote: media <b>" + f2(b.m) + "</b>, varianza <b>" + f2(b.v) + "</b> (con " + S.n + " valores: " + (S.n < 8 ? "<span class='bad'>estimación muy ruidosa</span>" : "estimación razonable") + ")" +
        "<br>Para x = " + xt.toFixed(1) + ": salida en <b>entrenamiento</b> (estadísticas del lote) = <b>" + f2(tr) + "</b> · en <b>inferencia</b> (medias móviles) = <b>" + f2(inf) + "</b> · valor ideal con la media y σ reales = " + f2(ideal);
    } else s += "<br>Para x = " + xt.toFixed(1) + ": con las medias móviles iniciales (0 y 1) la salida en inferencia sería <b>" + f2(inf) + "</b>: la capa todavía no ha visto datos.";
    out.set(s); vA.redraw(); vB.redraw();
  }
  reset();
});
