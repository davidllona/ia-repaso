/* Experimento: R² = qué parte de la variación de y explica tu recta, comparada con el modelo «tonto» que siempre dice la media. */
Lab.register("curso1/c1m2-r2", function (root, api) {
  var M = api.math, r = api.rng(33), N = 36, xs = [], z = [], i;
  for (i = 0; i < N; i++) { xs.push(Math.round((1 + 4.5 * (i + r.next() * 0.9) / N) * 10) / 10); z.push(r.normal(0, 1)); }
  var noise = 22, slope = 34;
  var ys = [], fit, xm, ym, sst, sse;

  var view = api.view(root, { aspect: 1.75, minH: 270, label: "Coches según el motor y las emisiones, con la media de las emisiones y una recta cuya pendiente puedes cambiar" });
  var plot = api.plot(view, { xr: [0, 6], yr: [0, 450], xticks: 6, yticks: 6, xlabel: "Tamaño del motor (litros)", ylabel: "CO₂ (g/km)", pad: { l: 52, r: 14, t: 12, b: 40 } });
  var bars = api.view(root, { aspect: 6.5, minH: 96, maxH: 120, label: "Barras: variación total de y y parte que la recta no explica" });
  api.legend(root, [[api.colors().muted, "error del «modelo tonto» (siempre la media)"], [api.colors().terracota, "error de tu recta"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Ruido de los datos (desviación, g/km)", min: 0, max: 70, step: 1, value: noise, onInput: function (v) { noise = v; calc(); update(); } });
  var sl = ui.slider({ label: "Pendiente de tu recta (pasa siempre por el centro de los datos)", min: -20, max: 80, step: 0.5, value: slope, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { slope = v; calc(); update(); } });
  ui.button("Poner la pendiente óptima (OLS)", function () { slope = Math.round(fit.m * 2) / 2; sl.set(slope, true); calc(); update(); }, "primary");

  function calc() {
    ys = xs.map(function (x, k) { return 115 + 34 * x + noise * z[k]; });
    fit = M.linreg(xs, ys); xm = M.mean(xs); ym = M.mean(ys);
    sst = 0; sse = 0;
    for (var k = 0; k < N; k++) {
      var e0 = ys[k] - ym, e1 = ys[k] - (ym + slope * (xs[k] - xm));
      sst += e0 * e0; sse += e1 * e1;
    }
  }
  function draw(ctx, w, h, C) {
    var D = api.d;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    D.line(ctx, plot.x(0), plot.y(ym), plot.x(6), plot.y(ym), C.muted, 2, [6, 5]);
    for (var k = 0; k < N; k++) {
      var yh = ym + slope * (xs[k] - xm), px = plot.x(xs[k]);
      D.line(ctx, px - 3, plot.y(ys[k]), px - 3, plot.y(ym), C.muted, 1.5);
      D.line(ctx, px + 3, plot.y(ys[k]), px + 3, plot.y(yh), C.terracota, 1.5);
    }
    D.line(ctx, plot.x(0), plot.y(ym + slope * (0 - xm)), plot.x(6), plot.y(ym + slope * (6 - xm)), C.cobalto, 3);
    for (k = 0; k < N; k++) D.circle(ctx, plot.x(xs[k]), plot.y(ys[k]), 4, C.ink, C.paper, 1);
    ctx.restore();
  }
  function drawBars(ctx, w, h, C) {
    var D = api.d, L = 12, R = 12, bw = w - L - R, y1 = 16, bh = 26, y2 = y1 + bh + 22;
    D.text(ctx, "Variación total (error de «siempre la media»)", L, y1 - 4, { size: 11, color: C.ink2 });
    D.rect(ctx, L, y1, bw, bh, C.muted, C.ink, 1.2);
    var frac = Math.max(0, sse / (sst || 1));
    D.text(ctx, "Error de tu recta", L, y2 - 4, { size: 11, color: C.ink2 });
    var wBar = Math.min(bw * frac, bw * 1.6);
    D.rect(ctx, L, y2, bw, bh, C.surface, C.line, 1);
    D.rect(ctx, L, y2, Math.min(wBar, bw), bh, C.terracota, C.ink, 1.2);
    if (frac > 1) D.text(ctx, "¡más que el modelo tonto!", w - R - 6, y2 + bh - 8, { size: 12, color: C.paper, weight: 600, align: "right" });
  }
  function update() {
    view.redraw(); bars.redraw();
    var r2 = 1 - sse / sst, best = 1 - (function () { var s = 0; for (var k = 0; k < N; k++) { var e = ys[k] - (fit.b + fit.m * xs[k]); s += e * e; } return s; })() / sst;
    var verdict = r2 < 0 ? "<span class='bad'>R² negativo: tu recta es PEOR que decir siempre la media.</span>" :
      (r2 > 0.9 ? "<span class='good'>Tu recta explica casi toda la variación.</span>" : (r2 > 0.7 ? "Explica la mayor parte de la variación; el resto es ruido o falta de variables." : (r2 > 0.4 ? "Explica solo una parte: queda mucha variación sin explicar." : "<span class='bad'>Explica muy poco: apenas mejora a «siempre la media».</span>")));
    out.set("SST (error de la media) = <b>" + sst.toFixed(0) + "</b> · SSE (error de tu recta) = <b>" + sse.toFixed(0) + "</b><br>" +
      "R² = 1 − SSE/SST = 1 − " + (sse / sst).toFixed(3) + " = <b>" + r2.toFixed(3) + "</b> → explica el <b>" + (100 * r2).toFixed(1) + " %</b> de la variación<br>" +
      "Con la mejor recta posible (OLS) el R² sería <b>" + best.toFixed(3) + "</b><br>" + verdict);
  }
  calc(); view.draw(draw); bars.draw(drawBars); update();
});
