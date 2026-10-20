/* Experimento: sesgo y varianza medidos de verdad. Se entrena el mismo modelo con 30 conjuntos de datos distintos. */
Lab.register("curso1/c1m3-sesgo-varianza", function (root, api) {
  var D = api.d, M = api.math;
  var N = 25, noise = 0.25, deg = 3, R = 30, MAXD = 10, G = 81, grid = [], preds, stats;
  function f(x) { return 0.8 * Math.sin(2.4 * x) + 0.25 * x; }
  var i;
  for (i = 0; i < G; i++) grid.push(-1 + 2 * i / (G - 1));

  function compute() {
    var d, r, g, xs, ys, c, k;
    preds = []; stats = [];
    for (d = 1; d <= MAXD; d++) preds.push([]);
    for (r = 0; r < R; r++) {
      var rg = api.rng(1000 + r * 17);
      xs = []; ys = [];
      for (k = 0; k < N; k++) { var x = rg.range(-1, 1); xs.push(x); ys.push(f(x) + rg.normal(0, noise)); }
      for (d = 1; d <= MAXD; d++) { c = M.polyfit(xs, ys, d, 1e-7); preds[d - 1].push(grid.map(function (x) { return M.polyval(c, x); })); }
    }
    for (d = 1; d <= MAXD; d++) {
      var mean = [], b2 = 0, va = 0;
      for (g = 0; g < G; g++) {
        var vals = preds[d - 1].map(function (p) { return p[g]; }), m = M.mean(vals);
        var vu = M.std(vals) * M.std(vals) * R / (R - 1);          /* varianza muestral (R-1) */
        mean.push(m); b2 += (m - f(grid[g])) * (m - f(grid[g])) - vu / R; va += vu;   /* se resta vu/R: la media de R ajustes también tiene su ruido */
      }
      stats.push({ d: d, mean: mean, b2: Math.max(0, b2 / G), va: va / G });
    }
  }

  var view = api.view(root, { aspect: 1.7, minH: 250, label: "Treinta predicciones del número de usuarios conectados a Netflix a cada hora de la noche, hechas con treinta conjuntos de datos distintos, su media y la curva real" });
  var plot = api.plot(view, { xr: [-1, 1], yr: [-1.8, 1.8], xticks: 4, yticks: 4, xlabel: "hora de la noche", ylabel: "usuarios conectados", pad: { l: 26, r: 20, t: 10, b: 36 }, xfmt: function (v) { return (22 + 2 * v) + " h"; }, yfmt: function () { return ""; } });
  var view2 = api.view(root, { aspect: 3.1, minH: 140, maxH: 210, label: "Sesgo al cuadrado, varianza y su suma según la complejidad del recomendador" });
  var plot2 = api.plot(view2, { xr: [1, MAXD], yr: [0, 0.3], xticks: 9, yticks: 3, xlabel: "complejidad del modelo (grado del polinomio)", pad: { l: 44, r: 10, t: 10, b: 34 }, yfmt: function (v) { return v.toFixed(2); } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Complejidad (grado del polinomio)", min: 1, max: MAXD, step: 1, value: deg, onInput: function (v) { deg = v; update(); } });
  ui.slider({ label: "Datos de entrenamiento por recomendador", min: 8, max: 60, step: 1, value: N, onInput: function (v) { N = v; compute(); update(); } });
  ui.slider({ label: "Ruido de los datos (σ)", min: 0.1, max: 0.5, step: 0.05, value: noise, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { noise = v; compute(); update(); } });
  var C0 = api.colors();
  api.legend(root, [[C0.muted, "curva real"], [C0.terracota, "cada recomendador (30)"], [C0.ink, "media de los 30"], [C0.cobalto, "sesgo²"], [C0.oliva, "varianza"]]);

  function draw(ctx, w, h, C) {
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var s = stats[deg - 1], r, truth = [], mean = [], g;
    ctx.globalAlpha = 0.2;
    for (r = 0; r < R; r++) { var pts = []; for (g = 0; g < G; g++) pts.push([plot.x(grid[g]), plot.y(preds[deg - 1][r][g])]); D.path(ctx, pts, C.terracota, 1.6); }
    ctx.globalAlpha = 1;
    for (g = 0; g < G; g++) { truth.push([plot.x(grid[g]), plot.y(f(grid[g]))]); mean.push([plot.x(grid[g]), plot.y(s.mean[g])]); }
    D.path(ctx, truth, C.muted, 2, [6, 4]);
    D.path(ctx, mean, C.ink, 3);
    ctx.restore();
  }
  function draw2(ctx, w, h, C) {
    var best = Math.min.apply(null, stats.map(function (s) { return s.b2 + s.va; }));
    plot2.yr = [0, Math.max(0.1, Math.ceil(best * 4 * 20) / 20)]; plot2.axes(ctx);
    ctx.save(); plot2.clip(ctx);
    D.path(ctx, stats.map(function (s) { return [plot2.x(s.d), plot2.y(s.b2)]; }), C.cobalto, 2.5);
    D.path(ctx, stats.map(function (s) { return [plot2.x(s.d), plot2.y(s.va)]; }), C.oliva, 2.5);
    D.path(ctx, stats.map(function (s) { return [plot2.x(s.d), plot2.y(s.b2 + s.va)]; }), C.ink, 3);
    ctx.restore();
    D.line(ctx, plot2.x(deg), plot2.box.y, plot2.x(deg), plot2.box.y + plot2.box.h, C.ink, 1.3, [4, 3]);
    var t = stats[deg - 1].b2 + stats[deg - 1].va;
    if (t < plot2.yr[1]) D.circle(ctx, plot2.x(deg), plot2.y(t), 5.5, C.ink, C.paper, 2);
  }
  function update() {
    view.redraw(); view2.redraw();
    var s = stats[deg - 1], tot = s.b2 + s.va, s2 = noise * noise, v, cls = "good";
    if (s.b2 > Math.max(0.02, 0.4 * s2) && s.b2 > s.va) { v = "Sesgo alto: la media de los recomendadores se aleja de la curva real (infraajuste). Entrenar con más datos no lo arregla."; cls = "bad"; }
    else if (s.va > Math.max(0.05, s2) && s.va > s.b2) { v = "Varianza alta: cada recomendador da una curva muy distinta de las demás (sobreajuste). Más datos o un modelo más simple lo reducen."; cls = "bad"; }
    else v = "Sesgo y varianza equilibrados: ninguna de las dos fuentes de error domina.";
    out.set("grado <b>" + deg + "</b> · sesgo² = <b>" + s.b2.toFixed(3) + "</b> · varianza = <b>" + s.va.toFixed(3) + "</b> · ruido irreducible σ² = <b>" + s2.toFixed(3) + "</b><br>" +
      "Error esperado en test ≈ sesgo² + varianza + σ² = " + s.b2.toFixed(3) + " + " + s.va.toFixed(3) + " + " + s2.toFixed(3) + " = <b>" + (tot + s2).toFixed(3) + "</b><br><span class='" + cls + "'>" + v + "</span>");
  }
  compute(); view.draw(draw); view2.draw(draw2); update();
});
