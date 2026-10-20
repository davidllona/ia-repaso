/* Experimento: complejidad del modelo -> infraajuste, buen ajuste, sobreajuste. */
Lab.register("comun/sobreajuste", function (root, api) {
  var M = api.math, seed = 5, deg = 3, noise = 0.2, N = 14, train, test, errs;
  function f(x) { return 0.8 * Math.sin(2.4 * x) + 0.25 * x; }
  function gen() {
    var r = api.rng(seed), i; train = []; test = [];
    for (i = 0; i < N; i++) { var x = r.range(-1, 1); train.push([x, f(x) + r.normal(0, noise)]); }
    var t = api.rng(999);
    for (i = 0; i < 90; i++) { var x2 = t.range(-1, 1); test.push([x2, f(x2) + t.normal(0, noise)]); }
  }
  function fit(d) { return M.polyfit(train.map(function (p) { return p[0]; }), train.map(function (p) { return p[1]; }), d, 1e-9); }
  function err(c, set) { return M.mean(set.map(function (p) { var e = M.polyval(c, p[0]) - p[1]; return e * e; })); }
  function allErrs() { errs = []; for (var d = 1; d <= 12; d++) { var c = fit(d); errs.push([d, err(c, train), err(c, test)]); } }

  var view = api.view(root, { aspect: 1.7, minH: 260, label: "Puntos de entrenamiento y curva ajustada por un polinomio" });
  var plot = api.plot(view, { xr: [-1, 1], yr: [-1.6, 1.6], xticks: 4, yticks: 4, pad: { l: 40, r: 10, t: 10, b: 24 } });
  var view2 = api.view(root, { aspect: 3.6, minH: 130, label: "Error de entrenamiento y de test según el grado del polinomio" });
  var plot2 = api.plot(view2, { xr: [1, 12], yr: [0, 1], xticks: 11, yticks: 2, xlabel: "grado del polinomio (complejidad)", pad: { l: 40, r: 10, t: 8, b: 34 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Complejidad del modelo (grado del polinomio)", min: 1, max: 12, step: 1, value: deg, onInput: function (v) { deg = v; update(); } });
  ui.slider({ label: "Ruido en los datos", min: 0.05, max: 0.5, step: 0.05, value: noise, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { noise = v; gen(); allErrs(); update(); } });
  ui.button("Generar otros datos de entrenamiento", function () { seed += 7; gen(); allErrs(); update(); });
  api.legend(root, [[api.colors().cobalto, "datos de entrenamiento (los que el modelo ve)"], [api.colors().muted, "datos de test (nunca vistos)"], [api.colors().terracota, "curva del modelo"]]);

  function draw(ctx, w, h, C) {
    var D = api.d, c = fit(deg), i;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var truth = []; for (i = 0; i <= 120; i++) { var x = -1 + 2 * i / 120; truth.push([plot.x(x), plot.y(f(x))]); }
    D.path(ctx, truth, C.muted, 1.5, [5, 4]);
    test.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 3, null, C.muted, 1); });
    var cur = []; for (i = 0; i <= 200; i++) { var x2 = -1 + 2 * i / 200; cur.push([plot.x(x2), plot.y(M.polyval(c, x2))]); }
    D.path(ctx, cur, C.terracota, 3);
    train.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 5.5, C.cobalto, C.paper, 1.5); });
    ctx.restore();
  }
  function draw2(ctx, w, h, C) {
    var D = api.d, maxE = 1, ymax = 0.8;
    plot2.yr = [0, ymax]; plot2.axes(ctx); ctx.save(); plot2.clip(ctx);
    D.path(ctx, errs.map(function (e) { return [plot2.x(e[0]), plot2.y(Math.min(e[1], ymax))]; }), C.cobalto, 2.5);
    D.path(ctx, errs.map(function (e) { return [plot2.x(e[0]), plot2.y(Math.min(e[2], ymax))]; }), C.terracota, 2.5);
    ctx.restore();
    D.line(ctx, plot2.x(deg), plot2.box.y, plot2.x(deg), plot2.box.y + plot2.box.h, C.ink, 1.5, [4, 3]);
    D.text(ctx, "error train", plot2.box.x + 6, plot2.box.y + 13, { size: 11, color: C.cobaltoInk, weight: 600 });
    D.text(ctx, "error test", plot2.box.x + 82, plot2.box.y + 13, { size: 11, color: C.terracotaInk, weight: 600 });
  }
  function update() {
    view.redraw(); view2.redraw();
    var e = errs[deg - 1], tr = e[1], te = e[2], verdict, cls;
    if (tr > noise * noise * 2 + 0.03) { verdict = "Infraajuste: el modelo es demasiado simple y falla incluso con los datos que ve."; cls = "bad"; }
    else if (te > tr * 2.5 + 0.02) { verdict = "Sobreajuste: casi memoriza el entrenamiento, pero con datos nuevos falla mucho más."; cls = "bad"; }
    else { verdict = "Buen equilibrio: errores parecidos y bajos en train y en test."; cls = "good"; }
    out.set("grado <b>" + deg + "</b> · error en train = <b>" + tr.toFixed(3) + "</b> · error en test = <b>" + (te > 9 ? ">9" : te.toFixed(3)) + "</b><br><span class='" + cls + "'>" + verdict + "</span>");
  }
  gen(); allErrs(); view.draw(draw); view2.draw(draw2); update();
});
