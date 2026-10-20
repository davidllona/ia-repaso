/* Experimento: ajustar una recta a mano, ver los residuos, el MSE y compararlo con la solución OLS. */
Lab.register("curso1/c1m2-recta-a-mano", function (root, api) {
  var M = api.math, r = api.rng(4), pts = [], i;
  // 12 películas inventadas: horas vistas (miles) ≈ 115 + 34·presupuesto (×10 M€) + ruido
  for (i = 0; i < 12; i++) {
    var x = Math.round(r.range(1.0, 5.5) * 10) / 10;
    pts.push({ x: x, y: Math.round(115 + 34 * x + r.normal(0, 22)) });
  }
  var ols = M.linreg(pts.map(function (p) { return p.x; }), pts.map(function (p) { return p.y; }));
  var t0 = 160, t1 = 12, showOls = false, showSq = true;

  var view = api.view(root, { aspect: 1.6, minH: 290, label: "Doce películas según su presupuesto y las horas vistas en la primera semana, con una recta ajustable y los errores de cada película" });
  var plot = api.plot(view, { xr: [0, 6], yr: [50, 350], xticks: 6, yticks: 6, xlabel: "Presupuesto (decenas de millones de €)", ylabel: "Horas vistas (miles)", pad: { l: 52, r: 14, t: 12, b: 40 } });
  var ui = api.controls(root), out = api.readout(root);
  var s1 = ui.slider({ label: "Pendiente θ₁ (miles de horas por cada 10 M€)", min: -10, max: 80, step: 0.5, value: t1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { t1 = v; update(); } });
  var s0 = ui.slider({ label: "Intercepto θ₀ (miles de horas con presupuesto 0)", min: 0, max: 250, step: 1, value: t0, fmt: function (v) { return v.toFixed(0); }, onInput: function (v) { t0 = v; update(); } });
  ui.toggle({ label: "Dibujar los cuadrados del error", value: true, onChange: function (v) { showSq = v; update(); } });
  ui.toggle({ label: "Mostrar la recta OLS", value: false, onChange: function (v) { showOls = v; update(); } });
  ui.button("Poner mi recta donde la pone OLS", function () { t1 = Math.round(ols.m * 2) / 2; t0 = Math.round(ols.b); s1.set(t1, true); s0.set(t0, true); update(); }, "primary");

  function stats(a, b) {
    var sse = 0, sae = 0;
    pts.forEach(function (p) { var e = p.y - (a + b * p.x); sse += e * e; sae += Math.abs(e); });
    return { mse: sse / pts.length, mae: sae / pts.length, sse: sse };
  }
  function draw(ctx, w, h, C) {
    var D = api.d;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var k = plot.y(0) - plot.y(1);                // píxeles por unidad de y (para dibujar cuadrados)
    pts.forEach(function (p) {
      var yh = t0 + t1 * p.x, e = p.y - yh, px = plot.x(p.x);
      if (showSq) {
        var side = Math.abs(e) * k, sy = e > 0 ? plot.y(p.y) : plot.y(yh);
        ctx.fillStyle = C.terracotaWash; ctx.globalAlpha = 0.55;
        ctx.fillRect(px, sy, side, side); ctx.globalAlpha = 1;
        ctx.strokeStyle = C.terracota; ctx.lineWidth = 1; ctx.strokeRect(px, sy, side, side);
      }
      D.line(ctx, px, plot.y(p.y), px, plot.y(yh), C.terracota, 2);
    });
    if (showOls) D.line(ctx, plot.x(0), plot.y(ols.b), plot.x(6), plot.y(ols.b + ols.m * 6), C.oliva, 2.5, [7, 5]);
    D.line(ctx, plot.x(0), plot.y(t0), plot.x(6), plot.y(t0 + t1 * 6), C.cobalto, 3);
    pts.forEach(function (p) { D.circle(ctx, plot.x(p.x), plot.y(p.y), 5.5, C.ink, C.paper, 1.5); });
    ctx.restore();
  }
  function update() {
    view.redraw();
    var me = stats(t0, t1), best = stats(ols.b, ols.m);
    var ratio = me.mse / best.mse;
    out.set("Tu recta: ŷ = <b>" + t0.toFixed(0) + " + " + t1.toFixed(1) + "·x</b><br>" +
      "MSE = <b>" + me.mse.toFixed(0) + "</b> · RMSE = <b>" + Math.sqrt(me.mse).toFixed(1) + " mil h</b> · MAE = <b>" + me.mae.toFixed(1) + " mil h</b><br>" +
      "Recta OLS: ŷ = " + ols.b.toFixed(1) + " + " + ols.m.toFixed(2) + "·x → MSE = <b>" + best.mse.toFixed(0) + "</b><br>" +
      (ratio < 1.03 ? "<span class='good'>Casi has llegado al mínimo posible.</span>" : "<span class='bad'>Tu error cuadrático es " + ratio.toFixed(1) + " veces el mínimo posible.</span>"));
  }
  view.draw(draw); update();
});
