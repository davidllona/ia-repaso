/* Experimento: MAE, RMSE y R² calculados sobre 8 pisos. Los puntos predichos se pueden ARRASTRAR en vertical.
   R² = 1 - SSE/SST compara el error del modelo con el error de "predecir siempre la media" (el baseline). */
Lab.register("curso3/c3m7-metricas", function (root, api) {
  var D = api.d;
  var REAL = [95, 130, 160, 190, 210, 250, 300, 340];
  var S = { sigma: 15, bias: 0, outlier: false, seed: 3 };
  var dev = [], noise = [], drag = -1;
  var MEAN = api.math.mean(REAL);

  function regen() {
    var R = api.rng(S.seed * 31 + 5); noise = REAL.map(function () { return R.normal(0, 1); });
    apply();
  }
  function apply() {
    dev = noise.map(function (e) { return S.bias + S.sigma * e; });
    if (S.outlier) dev[REAL.length - 1] += 90;
  }

  var view = api.view(root, { aspect: 1.35, minH: 300, maxH: 400, drag: true, label: "Precio real frente a precio predicho de 8 pisos; la diagonal es la predicción perfecta y la horizontal, predecir siempre la media" });
  var plot = api.plot(view, { xr: [60, 420], yr: [0, 480], xticks: 6, yticks: 6, grid: true, pad: { l: 46, r: 14, t: 14, b: 42 }, xlabel: "precio real (miles €)" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Error típico del modelo (σ, miles €)", min: 0, max: 80, step: 1, value: S.sigma, onInput: function (v) { S.sigma = v; apply(); update(); } });
  ui.slider({ label: "Sesgo (el modelo tasa de más o de menos)", min: -60, max: 60, step: 1, value: S.bias, onInput: function (v) { S.bias = v; apply(); update(); } });
  ui.toggle({ label: "Un piso muy mal tasado (+90)", value: S.outlier, onChange: function (v) { S.outlier = v; apply(); update(); } });
  ui.button("Otro sorteo de errores", function () { S.seed = S.seed % 9 + 1; regen(); update(); });
  api.legend(root, [[api.colors().terracota, "error del modelo"], [api.colors().muted, "error de predecir la media"], [api.colors().cobalto, "predicción (arrastra)"]]);

  function pred(i) { return REAL[i] + dev[i]; }
  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, i;
    ctx.save(); plot.clip(ctx);
    D.line(ctx, plot.x(60), plot.y(60), plot.x(420), plot.y(420), C.ink2, 1.5, [6, 4]);
    D.line(ctx, b.x, plot.y(MEAN), b.x + b.w, plot.y(MEAN), C.muted, 1.5);
    for (i = 0; i < REAL.length; i++) {
      var x = plot.x(REAL[i]);
      D.line(ctx, x + 4, plot.y(MEAN), x + 4, plot.y(REAL[i]), C.muted, 2);
      D.line(ctx, x, plot.y(REAL[i]), x, plot.y(pred(i)), C.terracota, 2.4);
    }
    for (i = 0; i < REAL.length; i++) D.circle(ctx, plot.x(REAL[i]), plot.y(pred(i)), i === drag ? 8 : 6, C.cobalto, C.paper, 1.5);
    ctx.restore();
    D.text(ctx, "perfecto: predicho = real", b.x + 6, b.y + 14, { size: 10.5, color: C.ink2 });
    D.text(ctx, "media = " + MEAN.toFixed(1).replace(".", ","), b.x + b.w - 6, plot.y(MEAN) - 5, { align: "right", size: 10.5, color: C.muted });
  });
  view.pointer({
    down: function (px, py) {
      var best = -1, bd = 22 * 22;
      for (var i = 0; i < REAL.length; i++) { var dx = px - plot.x(REAL[i]), dy = py - plot.y(pred(i)); if (dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = i; } }
      drag = best; if (best >= 0) { dev[best] = plot.iy(py) - REAL[best]; update(); }
    },
    drag: function (px, py) { if (drag >= 0) { dev[drag] = api.math.clamp(plot.iy(py), 0, 480) - REAL[drag]; update(); } },
    up: function () { drag = -1; update(); }
  });

  function update() {
    var n = REAL.length, sa = 0, sq = 0, sst = 0, i;
    for (i = 0; i < n; i++) { sa += Math.abs(dev[i]); sq += dev[i] * dev[i]; sst += (REAL[i] - MEAN) * (REAL[i] - MEAN); }
    var mae = sa / n, rmse = Math.sqrt(sq / n), r2 = 1 - sq / sst, maeB = REAL.reduce(function (s, v) { return s + Math.abs(v - MEAN); }, 0) / n;
    out.set("<b>MAE</b> = " + mae.toFixed(1).replace(".", ",") + " (el baseline: " + maeB.toFixed(1).replace(".", ",") + ") &nbsp; <b>RMSE</b> = " + rmse.toFixed(1).replace(".", ",") +
      "<br><b>SSE</b> (suma de errores² del modelo) = " + Math.round(sq).toLocaleString("es-ES") + " &nbsp; <b>SST</b> (errores² de la media) = " + Math.round(sst).toLocaleString("es-ES") +
      "<br><b>R² = 1 − SSE/SST = 1 − " + (sq / sst).toFixed(3).replace(".", ",") + " = <span class='" + (r2 > 0.5 ? "good" : "bad") + "'>" + r2.toFixed(3).replace(".", ",") + "</span></b>" +
      (r2 < 0 ? " &nbsp; <span class='bad'>negativo: peor que predecir siempre la media</span>" : r2 < 0.5 ? " &nbsp; apenas mejor que la media" : " &nbsp; explica el " + Math.round(r2 * 100) + " % de la variación") +
      (rmse > 1.3 * mae ? "<br>RMSE bastante mayor que MAE: hay <b>algún error grande</b> que el cuadrado agranda." : ""));
    view.redraw();
  }
  regen(); update();
});
