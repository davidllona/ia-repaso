/* Experimento: por qué una recta no sirve para clasificar y cómo la sigmoide convierte «puntuación» en probabilidad. */
Lab.register("curso1/c1m2-sigmoide", function (root, api) {
  var M = api.math, r = api.rng(17), N = 36, pts = [], i;
  for (i = 0; i < N; i++) {
    var x = r.range(0, 50), y = r.next() < M.sigmoid(0.22 * (x - 24)) ? 1 : 0;
    pts.push({ x: x, y: y, j: r.range(0.0, 0.06) });
  }
  var t0 = -2, t1 = 0.1, thr = 0.5, xc = 30, showLin = false;
  var ols = M.linreg(pts.map(function (p) { return p.x; }), pts.map(function (p) { return p.y; }));

  var view = api.view(root, { aspect: 1.65, minH: 290, drag: true, label: "Clientes según los días sin entrar (1 = canceló, 0 = se quedó) con la curva sigmoide y, si quieres, la recta de regresión lineal" });
  var plot = api.plot(view, { xr: [0, 50], yr: [-0.4, 1.4], xticks: 5, yticks: 9, xlabel: "Días sin entrar en la plataforma", ylabel: "probabilidad de cancelar", yfmt: function (v) { return (Math.round(v * 10) / 10).toFixed(1); }, pad: { l: 48, r: 12, t: 12, b: 40 } });
  api.legend(root, [[api.colors().cobalto, "se quedó (0)"], [api.colors().terracota, "canceló (1)"], [api.colors().ink, "sigmoide p̂ = σ(θ₀ + θ₁·x)"], [api.colors().marker, "cliente nuevo"]]);
  var ui = api.controls(root), out = api.readout(root);
  var s1 = ui.slider({ label: "Peso θ₁ de «días sin entrar»", min: 0, max: 0.8, step: 0.01, value: t1, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { t1 = v; update(); } });
  var s0 = ui.slider({ label: "Intercepto θ₀", min: -20, max: 4, step: 0.1, value: t0, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { t0 = v; update(); } });
  var st = ui.slider({ label: "Umbral de decisión", min: 0.05, max: 0.95, step: 0.01, value: thr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { thr = v; update(); } });
  ui.toggle({ label: "Mostrar la recta de regresión lineal", value: false, onChange: function (v) { showLin = v; update(); } });
  ui.button("Ajustar con regresión logística", function () { var f = newton(); t0 = M.clamp(f[0], -20, 4); t1 = M.clamp(f[1], 0, 0.8); s0.set(t0, true); s1.set(t1, true); update(); }, "primary");

  // Regresión logística 1D por el método de Newton (IRLS)
  function newton() {
    var th = [0, 0], it, k;
    for (it = 0; it < 30; it++) {
      var g = [0, 0], H = [[0, 0], [0, 0]];
      for (k = 0; k < N; k++) {
        var p = M.sigmoid(th[0] + th[1] * pts[k].x), w = p * (1 - p), e = p - pts[k].y, x = pts[k].x;
        g[0] += e; g[1] += e * x; H[0][0] += w; H[0][1] += w * x; H[1][0] += w * x; H[1][1] += w * x * x;
      }
      var d = M.solve(H, g); th = [th[0] - d[0], th[1] - d[1]];
    }
    return th;
  }
  function prob(x) { return M.sigmoid(t0 + t1 * x); }
  function metrics() {
    var ok = 0, ll = 0;
    pts.forEach(function (p) { var q = M.clamp(prob(p.x), 1e-9, 1 - 1e-9); if ((q >= thr ? 1 : 0) === p.y) ok++; ll -= p.y ? Math.log(q) : Math.log(1 - q); });
    return { acc: ok / N, ll: ll / N };
  }
  function draw(ctx, w, h, C) {
    var D = api.d, i, xu = t1 > 1e-6 ? (Math.log(thr / (1 - thr)) - t0) / t1 : null, b = plot.box;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    if (xu !== null) {
      var xe = M.clamp(xu, 0, 50);
      ctx.fillStyle = C.cobaltoWash; ctx.globalAlpha = 0.55; ctx.fillRect(b.x, b.y, plot.x(xe) - b.x, b.h);
      ctx.fillStyle = C.terracotaWash; ctx.fillRect(plot.x(xe), b.y, b.x + b.w - plot.x(xe), b.h); ctx.globalAlpha = 1;
    }
    D.line(ctx, b.x, plot.y(0), b.x + b.w, plot.y(0), C.line, 1.5); D.line(ctx, b.x, plot.y(1), b.x + b.w, plot.y(1), C.line, 1.5);
    D.line(ctx, b.x, plot.y(thr), b.x + b.w, plot.y(thr), C.ink2, 1.2, [5, 4]);
    if (showLin) D.line(ctx, plot.x(0), plot.y(ols.b), plot.x(50), plot.y(ols.b + ols.m * 50), C.oliva, 3);
    var cu = []; for (i = 0; i <= 200; i++) { var xx = 50 * i / 200; cu.push([plot.x(xx), plot.y(prob(xx))]); }
    D.path(ctx, cu, C.ink, 3);
    pts.forEach(function (p) { D.circle(ctx, plot.x(p.x), plot.y(p.y ? 1 - p.j : p.j), 5, p.y ? C.terracota : C.cobalto, C.paper, 1.3); });
    D.line(ctx, plot.x(xc), b.y, plot.x(xc), b.y + b.h, C.marker, 2);
    D.circle(ctx, plot.x(xc), plot.y(prob(xc)), 7, C.marker, C.ink, 2.5);
    if (showLin) D.circle(ctx, plot.x(xc), plot.y(ols.b + ols.m * xc), 6, C.oliva, C.ink, 2);
    ctx.restore();
    D.text(ctx, "predice: se queda", b.x + 6, b.y + b.h - 6, { size: 10.5, color: C.cobaltoInk, weight: 600 });
    D.text(ctx, "predice: cancela", b.x + b.w - 6, b.y + b.h - 6, { size: 10.5, color: C.terracotaInk, weight: 600, align: "right" });
  }
  function update() {
    view.redraw();
    var z = t0 + t1 * xc, p = M.sigmoid(z), m = metrics(), lin = ols.b + ols.m * xc;
    out.set("Cliente nuevo con <b>" + xc.toFixed(0) + " días</b>: z = θ₀ + θ₁·x = <b>" + z.toFixed(2) + "</b> → p̂ = σ(z) = <b>" + p.toFixed(3) + "</b> · probabilidad de quedarse = <b>" + (1 - p).toFixed(3) + "</b> (suman 1)<br>" +
      "Con umbral " + thr.toFixed(2) + ": <b>" + (p >= thr ? "cancela" : "se queda") + "</b> · frontera en " + (t1 > 1e-6 ? "<b>" + ((Math.log(thr / (1 - thr)) - t0) / t1).toFixed(1) + " días</b>" : "—") + "<br>" +
      "Acierto sobre los 36 clientes = <b>" + (100 * m.acc).toFixed(0) + " %</b> · log-loss = <b>" + m.ll.toFixed(3) + "</b>" +
      (showLin ? "<br>La recta lineal da <b>" + lin.toFixed(2) + "</b> para este cliente" + (lin < 0 || lin > 1 ? " <span class='bad'>(¡una «probabilidad» fuera de 0–1!)</span>" : "") : ""));
  }
  function setx(px, py) { if (!plot.inside(px, py)) return; xc = M.clamp(plot.ix(px), 0, 50); update(); }
  view.pointer({ down: setx, drag: setx });
  view.draw(draw); update();
});
